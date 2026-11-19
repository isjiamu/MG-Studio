import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {args,config,run,json} from './common.mjs';
import {mix} from './audio.mjs';
const opt=args(),cfg=config(),mode=opt.mode||'stills',root=fs.realpathSync('.');
if(cfg.audio?.mode==='silent'&&(opt.music||opt.voice||opt['loop-music']))throw Error('Explicit silent delivery conflicts with music/voice arguments');
if(mode==='render'&&cfg.draft)throw Error('Draft scaffold: implement the current brief, inspect frames, then set film.json draft=false before rendering.');
const [W,H]=String(opt.size||`${cfg.width}x${cfg.height}`).split('x').map(Number);
const fps=Number(opt.fps||cfg.fps),samples=Number(opt.samples||1),scale=Number(opt.scale||1);
if(![W,H,fps].every(n=>Number.isInteger(n)&&n>0)||W%2||H%2||!Number.isFinite(scale)||scale<=0||scale>1||![1,2,4].includes(samples))throw Error('Invalid size/fps/scale/samples');
if(Math.abs(cfg.duration*fps-Math.round(cfg.duration*fps))>1e-6)throw Error('Fractional frame count');
const tag=opt.tag||`${W}x${H}-${fps}fps`,outDir=path.resolve('out',tag);
if(!/^[a-zA-Z0-9_-]+$/.test(tag))throw Error('Tag must contain letters, numbers, - or _');
fs.mkdirSync(outDir,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.ttf':'font/ttf','.woff2':'font/woff2','.wav':'audio/wav','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  try{
    const u=new URL(req.url,'http://local'),f=fs.realpathSync(path.join(root,decodeURIComponent(u.pathname)==='/'?'index.html':decodeURIComponent(u.pathname)));
    if(f!==root&&!f.startsWith(root+path.sep))throw Error('Outside project');
    if(!fs.statSync(f).isFile())throw Error('Not a file');
    res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');
    fs.createReadStream(f).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(opt.port||0),'127.0.0.1');await once(server,'listening');
const origin=`http://127.0.0.1:${server.address().port}`,url=`${origin}/?size=${W}x${H}`;
if(mode==='preview'){console.log(url);process.on('SIGINT',()=>server.close(()=>process.exit(0)));}
else {
  let browser,ff,ffDone;const errors=[];
  try{
    run('ffmpeg',['-version']);run('ffprobe',['-version']);
    // gpu:true uses the machine's real GPU for WebGL (Three.js PBR, shaders). Default headless WebGL is a slow
// software rasterizer. GPU output is deterministic per machine; re-run verify after changing machines.
    const gpuArgs=process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:['--use-gl=angle'];
    browser=await chromium.launch({headless:true,args:(cfg.gpu||opt.gpu)?[...gpuArgs,'--enable-webgl','--ignore-gpu-blocklist','--disable-background-timer-throttling']:[]});
    const context=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));
    async function page(){
      const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
      p.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`);});
      await p.goto(url+'&render=1');
      try{await p.waitForFunction(()=>window.MG?.ready===true,{},{timeout:30000});}
      catch(e){throw Error(errors.length?errors.join('\n'):e.message);}
      return p;
    }
    const p=await page();
    const capture=await p.evaluate(()=>window.MG.capture||'canvas');
    // canvas: read the stage canvas pixels. dom: screenshot the stage element (HTML/SVG/CSS/WebGL).
    async function grab(target){
      if(capture==='dom'){
        await target.evaluate(()=>Promise.all([...document.querySelectorAll('#stage img')].map(i=>i.decode().catch(()=>{throw Error(`Image failed: ${i.src}`);}))).then(()=>document.fonts.ready).then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
        return await target.locator('#stage').screenshot({type:'png',animations:'disabled',caret:'hide',scale:'css'});
      }
      return Buffer.from(await target.evaluate(()=>document.querySelector('#stage').toDataURL('image/png').split(',')[1]),'base64');
    }
    async function frame(t,target=p){
      const issues=await target.evaluate(async t=>{await window.MG.seek(t);return window.MG.inspect?.()||[];},t);
      if(issues.length)throw Error(`Layout at ${t.toFixed(3)}s: ${JSON.stringify(issues)}`);
      const png=await grab(target);
      if(errors.length)throw Error(errors.join('\n'));
      return png;
    }
    const hash=b=>createHash('sha256').update(b).digest('hex');
    if(mode==='verify'){
      const times=[0,...cfg.scenes.flatMap(s=>[s.from+1/fps,(s.from+s.to)/2,s.to-1/fps])];
      const useGpu=Boolean(cfg.gpu||opt.gpu),gpuDeltas=[];
      async function assertSame(refBuf,refHash,curBuf,label){
        if(hash(curBuf)===refHash)return;
        if(!useGpu)throw Error(label);
        const a=await sharp(refBuf).raw().toBuffer(),b=await sharp(curBuf).raw().toBuffer();
        let maxd=0,changed=0,sum=0;
        for(let k=0;k<a.length;k++){const d=Math.abs(a[k]-b[k]);if(d){changed++;sum+=d;if(d>maxd)maxd=d;}}
        if(maxd>2||sum/a.length>=0.005)throw Error(`${label} (GPU maxDiff=${maxd}, meanDiff=${(sum/a.length).toFixed(4)})`);
        gpuDeltas.push({check:label,maxDiff:maxd,changedChannels:changed,totalChannels:a.length});
      }
      const frames=[],hashes=[];for(const t of times){const f=await frame(t);frames.push(useGpu?f:null);hashes.push(hash(f));}
      for(let i=times.length-1;i>=0;i--)await assertSame(frames[i],hashes[i],await frame(times[i]),`Nondeterministic frame at ${times[i]}`);
      const shuffleSeed=74291,order=times.map((_,i)=>i);let shuffleState=shuffleSeed;
      for(let i=order.length-1;i>0;i--){
        shuffleState=(Math.imul(shuffleState,1664525)+1013904223)>>>0;
        const j=shuffleState%(i+1);[order[i],order[j]]=[order[j],order[i]];
      }
      for(const i of order)await assertSame(frames[i],hashes[i],await frame(times[i]),`Shuffled seek mismatch at ${times[i]} (seed ${shuffleSeed})`);
      const p2=await page();
      for(let i=0;i<times.length;i+=3)await assertSame(frames[i],hashes[i],await frame(times[i],p2),`Fresh-page mismatch at ${times[i]}`);
      // Do not seek again during a hold: doing so can reset and hide timer-driven drift.
      const holds=[];
      for(const t of [0,cfg.duration/2,cfg.duration-1/fps]){
        const initial=hash(await frame(t,p2));let elapsed=0;
        for(const waitMs of [73,149,227]){
          await new Promise(resolve=>setTimeout(resolve,waitMs));elapsed+=waitMs;
          const data=await grab(p2);
          if(hash(data)!==initial)throw Error(`Paused frame drift at ${t}s after ${elapsed}ms without seek`);
          if(errors.length)throw Error(errors.join('\n'));
        }
        holds.push({t,totalWaitMs:elapsed,hash:initial});
      }
      // Dense boundary check catches text transitions that midpoint frames miss.
      for(const s of cfg.scenes)for(let d=-3;d<=3;d++){const t=s.from+d/fps;if(t>=0&&t<cfg.duration)await frame(t);}
      let loop=null;
      if(cfg.loop){
        const a=await sharp(await frame(0)).raw().toBuffer(),b=await sharp(await frame(cfg.duration-1/fps)).raw().toBuffer();
        let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);loop={endpointMeanAbsoluteDifference:sum/a.length,note:'Endpoint similarity only; velocity and audio seam require playback review.'};
      }
      json(path.join(outDir,'verify.json'),{passed:true,layoutCoverage:await p.evaluate(()=>window.MG.layoutCoverage||'unspecified'),engine:`Chromium/${capture}`,times,hashes,reverseOrder:true,randomOrder:{seed:shuffleSeed,indices:order,times:order.map(i=>times[i])},pausedHolds:holds,freshPage:true,gpuDeltas:useGpu?gpuDeltas:undefined,boundaryFrames:true,loop});
      console.log('Deterministic seek + shuffled order + paused holds + fresh page + declared bounds passed (see layoutCoverage)');
    }else if(mode==='stills'){
      const times=opt.times?String(opt.times).split(',').map(Number):cfg.scenes.map(s=>(s.from+s.to)/2);
      if(times.some(t=>!Number.isFinite(t)||t<0||t>=cfg.duration))throw Error('Still time outside timeline');
      const tiles=[],tw=W>=H?480:270,th=Math.round(H/W*tw),cols=W>=H?3:4;
      for(let i=0;i<times.length;i++){
        const png=await frame(times[i]);fs.writeFileSync(path.join(outDir,`frame-${times[i].toFixed(3)}.png`),png);
        const label=Buffer.from(`<svg width="${tw}" height="32"><rect width="100%" height="100%" fill="#141821"/><text x="12" y="23" font-size="17" fill="white" font-family="sans-serif">${times[i].toFixed(3)} s</text></svg>`);
        tiles.push({input:await sharp(png).resize(tw,th).png().toBuffer(),left:(i%cols)*tw,top:Math.floor(i/cols)*(th+32)});
        tiles.push({input:label,left:(i%cols)*tw,top:Math.floor(i/cols)*(th+32)+th});
      }
      await sharp({create:{width:tw*cols,height:Math.ceil(times.length/cols)*(th+32),channels:3,background:'#141821'}}).composite(tiles).png().toFile(path.join(outDir,'contact-sheet.png'));
      console.log(path.join(outDir,'contact-sheet.png'));
    }else if(mode==='render'){
      const total=Math.round(cfg.duration*fps),silent=path.join(outDir,'silent.mp4'),start=Date.now();
      const ow=2*Math.round(W*scale/2),oh=2*Math.round(H*scale/2);
      ff=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-i','pipe:0','-vf',`scale=${ow}:${oh}`,'-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-frames:v',String(total),silent],{stdio:['pipe','ignore','pipe']});
      let stderr='',pipeError;ff.stderr.on('data',d=>stderr+=d);ff.stdin.on('error',e=>pipeError=e);
      ffDone=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',code=>code===0?resolve():reject(Error(`Encoder exit ${code}: ${stderr}`)));});ffDone.catch(()=>{});
      for(let i=0;i<total;i++){
        const t=i/fps,shot=cfg.scenes.find(s=>t>=s.from&&t<s.to);let png;
        if(samples===1)png=await frame(t);
        else{
          let acc,info;
          for(let s=0;s<samples;s++){
            // 180-degree shutter centered on frame; never blend across a hard cut.
            const st=Math.max(shot.from,Math.min(shot.to-1e-7,t+((s+.5)/samples-.5)*.5/fps));
            const r=await sharp(await frame(st)).removeAlpha().raw().toBuffer({resolveWithObject:true});
            info=r.info;if(!acc)acc=new Uint16Array(r.data.length);for(let k=0;k<acc.length;k++)acc[k]+=r.data[k];
          }
          const raw=Buffer.alloc(acc.length);for(let k=0;k<acc.length;k++)raw[k]=Math.round(acc[k]/samples);
          png=await sharp(raw,{raw:{width:info.width,height:info.height,channels:info.channels}}).png().toBuffer();
        }
        if(pipeError)throw pipeError;
        if(!ff.stdin.write(png))await Promise.race([once(ff.stdin,'drain'),ffDone.then(()=>{throw Error('Encoder exited early');})]);
        if(i%Math.round(fps*2)===0)console.log(`${i}/${total} frames · ${(Date.now()-start)/1000}s elapsed`);
      }
      ff.stdin.end();await ffDone;
      const dest=path.join(outDir,'final.mp4');
      if(cfg.audio?.mode==='silent')fs.copyFileSync(silent,dest);else mix(cfg,silent,dest,opt);
      json(path.join(outDir,'render.json'),{width:ow,height:oh,fps,frames:total,duration:cfg.duration,samples,shutterDegrees:samples>1?180:0,seconds:(Date.now()-start)/1000,sourceTitle:cfg.title,audioMode:cfg.audio?.mode??'sound'});
      console.log(dest);
    }else throw Error(`Unknown mode: ${mode}`);
  }finally{if(ff&&ff.exitCode===null)ff.kill();await browser?.close();server.close();}
}
