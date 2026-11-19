import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {args,config,run,probe,json,measure} from './common.mjs';
const SR=48000;
function wav(file,L,R){
  const n=L.length,b=Buffer.alloc(44+n*4);
  b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);
  b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*4,28);
  b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*4,40);
  for(let i=0;i<n;i++){b.writeInt16LE(Math.round(Math.tanh(L[i])*27000),44+i*4);b.writeInt16LE(Math.round(Math.tanh(R[i])*27000),46+i*4);}
  fs.writeFileSync(file,b);
}
export function score(c){
  if(c.audio?.mode==='silent')throw Error('Explicit silent project: score generation is not part of this deliverable');
  if(c.audio?.script){
    const script=path.resolve(c.audio.script),root=fs.realpathSync('.');
    if(!script.startsWith(root+path.sep))throw Error('audio.script must live inside the project');
    fs.mkdirSync('out',{recursive:true});
    run('python3',[script]);
    if(!fs.existsSync('out/score.wav'))throw Error('audio.script did not produce out/score.wav');
    console.log(`Custom score (${c.audio.script}): out/score.wav`);
    return;
  }
  fs.mkdirSync('out',{recursive:true});
  const n=Math.round(c.duration*SR),L=new Float64Array(n),R=new Float64Array(n),beat=60/c.bpm;
  let seed=c.seed||42;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  const hz=m=>440*2**((m-69)/12);
  function add(at,dur,fn,gain=.2,pan=0){
    const s=Math.round(at*SR),count=Math.ceil(dur*SR),gl=Math.sqrt((1-pan)/2),gr=Math.sqrt((1+pan)/2);
    for(let i=0;i<count&&s+i<n;i++)if(s+i>=0){const t=i/SR,v=fn(t,dur)*gain;L[s+i]+=v*gl;R[s+i]+=v*gr;}
  }
  const chords=[[57,60,64,71],[53,57,60,64],[48,55,60,64],[55,59,62,69]];
  const notes=[];
  for(let bar=0;bar*4*beat<c.duration;bar++){
    const ch=chords[bar%4],at=bar*4*beat;
    for(let j=0;j<ch.length;j++)add(at,4.2*beat,(t,d)=>{
      const env=Math.min(1,t/.22)*Math.min(1,(d-t)/.6),f=hz(ch[j]);
      return env*(Math.sin(2*Math.PI*f*t)+.22*Math.sin(2*Math.PI*(f*2.002)*t));
    },.055,(j-1.5)*.4);
    for(let step=0;step<8;step++){
      const t=at+step*.5*beat,f=hz(ch[[0,2,1,3,2,1,3,2][step]]+12);
      if(t>=c.duration-.8)continue;
      add(t,.65,(s,d)=>Math.sin(Math.PI*Math.min(1,s/.008)/2)*Math.exp(-s*6)*(Math.sin(2*Math.PI*f*s)+.28*Math.sin(2*Math.PI*f*3*s)),.11,Math.sin(step*1.3)*.55);
      // Quiet stereo echo is separately scheduled, not carried between frames.
      add(t+beat*.75,.5,s=>Math.exp(-s*8)*Math.sin(2*Math.PI*f*s),.024,-Math.sin(step*1.3)*.5);
    }
    for(let b=0;b<4;b++){
      const t=at+b*beat;if(t>=c.duration-1)continue;
      add(t,.35,s=>Math.sin(2*Math.PI*(48*s+95*.022*(1-Math.exp(-s/.022))))*Math.exp(-s*14),bar===0?.16:.29);
      add(t,.35,s=>Math.sin(2*Math.PI*hz(ch[0]-12)*s)*Math.min(1,s/.015)*Math.exp(-s*6),.2);
      if(b%2)add(t,.14,s=>noise()*Math.exp(-s*28)+.25*Math.sin(2*Math.PI*185*s)*Math.exp(-s*30),.1);
      add(t+beat*.5,.055,s=>noise()*Math.exp(-s*80),.045,.45);
      notes.push({t,kind:b===0?'bar':'beat'});
    }
  }
  for(const cue of c.cues||[]){
    if(cue.type==='click')add(cue.t,.06,t=>Math.sin(2*Math.PI*1400*t)*Math.exp(-t*75),.12);
    else if(cue.type==='impact')add(cue.t,.5,t=>Math.sin(2*Math.PI*(42*t+1.4*(1-Math.exp(-t*30))))*Math.exp(-t*9),.3);
    else if(cue.type==='chime')for(const f of [880,1320])add(cue.t,.8,t=>Math.sin(2*Math.PI*f*t)*Math.min(1,t/.01)*Math.exp(-t*5),.065);
    else if(cue.type==='whoosh')add(cue.t-.2,.38,(t,d)=>noise()*Math.sin(Math.PI*t/d)**2,.06);
    else throw Error(`Unknown cue type: ${cue.type}`);
  }
  for(let i=0;i<n;i++){
    const t=i/SR,fade=Math.min(1,t/.035)*Math.min(1,(c.duration-t)/.8);
    L[i]*=fade;R[i]*=fade;
  }
  wav('out/score.wav',L,R);
  json('out/audio-source.json',{type:'original procedural composition',sampleRate:SR,seed:c.seed,bpm:c.bpm,beatOffset:0,chords:'Am9 / Fmaj7 / C / Gadd9',cues:c.cues,beatGrid:notes,limitation:'Synthesized score; no human listening approval implied.'});
  console.log('Original score: out/score.wav');
}
export function mixSettings(c,opt={},hasVoice=!!opt.voice){
  const object=(value,name)=>{
    if(value===undefined)return {};
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${name} must be an object`);
    return value;
  };
  const m=object(c.audio?.mix,'audio.mix'),d=object(m.ducking,'audio.mix.ducking');
  const number=(flag,source,key,fallback,min,max)=>{
    const raw=Object.hasOwn(opt,flag)?opt[flag]:Object.hasOwn(source,key)?source[key]:fallback;
    const value=Number(raw);
    if(!['number','string'].includes(typeof raw)||(typeof raw==='string'&&!raw.trim())||!Number.isFinite(value)||value<min||value>max)
      throw Error(`Invalid --${flag} / ${key}: expected a finite number in [${min}, ${max}]`);
    return value;
  };
  return {
    voiceGain:number('voice-gain',m,'voiceGain',1,0,64),
    musicGain:number('music-gain',m,'musicGain',hasVoice?.38:1,0,64),
    ducking:{
      threshold:number('duck-threshold',d,'threshold',.025,1/1024,1),
      ratio:number('duck-ratio',d,'ratio',6,1,20),
      attackMs:number('duck-attack-ms',d,'attackMs',15,.01,2000),
      releaseMs:number('duck-release-ms',d,'releaseMs',250,.01,9000)
    }
  };
}
export function mix(c,video,dest,opt={}){
  if(c.audio?.mode==='silent')throw Error('Explicit silent project: mixing an audio stream is not allowed');
  const music=path.resolve(opt.music||c.audio?.music||'out/score.wav'),voice=(opt.voice||c.audio?.voice)&&path.resolve(opt.voice||c.audio?.voice);
  const settings=mixSettings(c,opt,!!voice),d=settings.ducking;
  if(!fs.existsSync(music))throw Error('No music. Run npm run score or pass --music FILE');
  const duration=Number(probe(music).format.duration);
  const voiceDuration=voice?Number(probe(voice).format.duration):null;
  if(voice&&voiceDuration>c.duration+.05)throw Error('Voice is longer than film. Extend the storyboard or edit the voice before mixing.');
  if(duration<c.duration-.1&&!opt['loop-music'])throw Error('Music is shorter than film. Edit music or explicitly pass --loop-music.');
  const target={integratedLufs:c.audio.integratedLufs,truePeakDb:c.audio.truePeakDb,loudnessRange:c.audio.loudnessRange??11};
  const vm=voice?measure(voice,target):null;
  const sourceVoice=vm?{durationSeconds:voiceDuration,integratedLufs:vm.input_i,truePeakDb:vm.input_tp,loudnessRange:vm.input_lra,measurement:'Original source before voiceGain; FFmpeg loudnorm input fields'}:null;
  // Keep both filter inputs alive beyond the delivery trim; avoids observed FFmpeg 8.1 tail truncation.
  const mixDuration=c.duration+(voice?1:0);
  const input=['-hide_banner','-nostats','-y',...(opt['loop-music']?['-stream_loop','-1']:[]),'-i',music];
  if(voice)input.push('-i',voice);
  const fade=`afade=t=in:d=0.035,afade=t=out:st=${Math.max(0,c.duration-.8)}:d=0.8`;
  let graph=`[0:a]aresample=48000,${voice?'apad,':''}atrim=duration=${mixDuration},asetpts=PTS-STARTPTS,${fade}[music];`;
  const voiceGain=settings.voiceGain===1?'':`volume=${settings.voiceGain},`;
  if(voice)graph+=`[1:a]aresample=48000,apad,atrim=duration=${mixDuration},asetpts=PTS-STARTPTS,${voiceGain}asplit=2[v][key];[music]volume=${settings.musicGain}[m];[m][key]sidechaincompress=threshold=${d.threshold}:ratio=${d.ratio}:attack=${d.attackMs}:release=${d.releaseMs}[duck];[duck][v]amix=inputs=2:normalize=0:duration=longest[mix]`;
  else graph+=`[music]${settings.musicGain===1?'anull':`volume=${settings.musicGain}`}[mix]`;
  run('ffmpeg',[...input,'-filter_complex',graph,'-map','[mix]','-t',String(c.duration),'-c:a','pcm_s24le','out/mix.wav']);
  const m=measure('out/mix.wav',target);
  if(!Number.isFinite(Number(m.input_i)))throw Error('Silent or invalid audio');
  const norm=`loudnorm=I=${target.integratedLufs}:TP=${target.truePeakDb}:LRA=${target.loudnessRange}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
  const temp=dest.replace(/\.mp4$/,'.partial.mp4');
  const applied=run('ffmpeg',['-hide_banner','-nostats','-y','-i',video,'-i','out/mix.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-af',norm,'-ar','48000','-c:a','aac','-b:a','256k','-t',String(c.duration),'-movflags','+faststart',temp]);
  const appliedBlock=applied.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if(!appliedBlock)throw Error('No second-pass loudness report');
  fs.renameSync(temp,dest);
  json(dest+'.audio.json',{music,voice:voice||null,loopMusic:!!opt['loop-music'],settings,gainUnit:'linear amplitude multiplier',duckingKey:'voice after voiceGain; threshold is linear amplitude, times are milliseconds',sourceVoice,target,before:m,applied:JSON.parse(appliedBlock[0]),after:measure(dest,target)});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const opt=args(),c=config();if(opt.mode==='mix'){if(!opt.video)throw Error('--video FILE required');mix(c,opt.video,opt.out||'out/final.mp4',opt);}else score(c);
}
