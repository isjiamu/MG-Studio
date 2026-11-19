import {clamp,lerp,ease,range,out} from '../lib/motion.js';
import {makeDraw,seeded} from '../lib/draw.js';
import {createPencil,createPaperSurface,createPrintSurface,sampleKeyframes,birdAnchor,drawPaperBird} from '../lib/handdrawn.js';
export function createStory(canvas,cfg){
  if(canvas.width!==canvas.height)throw Error('Story demo needs a square layout');
  const d=makeDraw(canvas),{g,W,H,text,line,dot}=d,pen=createPencil(g),surface=createPaperSurface(g,cfg.seed),printSurface=createPrintSurface(g,cfg.seed);
  const B=cfg.storyTiming;if(!B)throw Error('Missing storyTiming. Initialize the current story preset.');
  const C={paper:'#eee1c2',ink:'#304858',red:'#bf654c',night:'#293e59',light:'#efdfb6'};
  const N=276,labels=['第一次尝试','给妈妈的信','再试一次'];
  const env={x:790,y:770,s:.82};let lastTrace={};
  const keyed=sampleKeyframes;
  const pickOffset=birdAnchor({x:0,y:0,s:.95,rot:-.04,head:-.1,sy:1+.003*Math.sin(B.pickup*1.8)});
  const poses=[
    {t:0,x:355,y:653,s:1.13,rot:0,head:.12},
    {t:B.notice,x:355,y:653,s:1.13,rot:-.04,head:-.32},
    {t:4.1,x:355,y:663,s:1.13,rot:-.14,head:-.18},
    {t:4.8,x:455,y:485,s:1.02,rot:-.15,head:-.12},
    {t:B.pickup,x:570-pickOffset.x,y:422-pickOffset.y,s:.95,rot:-.04,head:-.1},
    {t:B.pickup+.24,x:570-pickOffset.x,y:422-pickOffset.y,s:.95,rot:-.04,head:-.1},
    {t:6.3,x:575,y:454,s:.9,rot:.1,head:.1},
    {t:7.7,x:675,y:547,s:.82,rot:.12,head:.1},
    {t:B.release,x:710,y:628,s:.8,rot:.02,head:.2},
    {t:B.land,x:710.2,y:715.6-65.6*(1+.003*Math.sin(B.land*1.8)),s:.8,rot:0,head:.15},
    {t:B.night,x:710,y:650,s:.8,rot:0,head:.32},
    {t:B.awaken-1,x:710,y:650,s:.8,rot:0,head:.42},
    {t:B.awaken+.5,x:710,y:650,s:.8,rot:-.04,head:-.4},
    {t:B.sprout,x:710,y:650,s:.8,rot:-.03,head:-.48},
    {t:B.morph,x:710,y:650,s:.8,rot:-.02,head:-.34},
    {t:B.boat,x:710,y:650,s:.8,rot:.02,head:-.16},
    {t:B.constellation,x:710,y:650,s:.8,rot:-.08,head:-.5},
    {t:B.connect+1,x:710,y:650,s:.8,rot:-.07,head:-.55},
    {t:B.return,x:710,y:650,s:.8,rot:-.01,head:-.1},
    {t:B.resolve,x:710,y:650,s:.8,rot:0,head:.2},
    {t:32,x:710,y:650,s:.8,rot:0,head:.17}
  ];
  function poseAt(t){
    const p=keyed(t,poses),flight=ease(range(t,4.15,4.6))*(1-ease(range(t,B.release-.3,B.land))),anticipation=Math.sin(Math.PI*range(t,3.6,4.25));
    const settle=Math.sin((t-B.land)*17)*Math.exp(-Math.max(0,t-B.land)*5)*(t>=B.land?1:0);
    p.sx=1+.09*anticipation;p.sy=1-.07*anticipation+.003*Math.sin(t*1.8);p.sy+=settle*.022;
    const contactPause=1-.82*ease(range(t,B.pickup-.17,B.pickup))*(1-ease(range(t,B.pickup+.24,B.pickup+.55)));
    const wonder=ease(range(t,B.constellation+.3,B.constellation+1.1))*(1-ease(range(t,B.connect+.3,B.connect+1.1)));
    p.wing=flight*contactPause*(-.28+.95*Math.sin((t-4.15)*14))-.54*wonder+.025*Math.sin(t*1.7);
    p.face=1-2*ease(range(t,B.awaken-.2,B.awaken+.4))*(1-ease(range(t,B.return+.55,B.return+1.15)));
    p.gape=.30*ease(range(t,B.pickup-.35,B.pickup-.08))*(1-ease(range(t,B.pickup,B.pickup+.12)))+.38*ease(range(t,B.release-.12,B.release))*(1-ease(range(t,B.release+.16,B.release+.45)));
    p.tail=flight*Math.sin((t-4.24)*14)*contactPause;p.tuck=flight*(1-ease(range(t,B.release-.4,B.land)));
    p.blink=t>B.night+.3&&t<B.awaken-.35?1:((t%4.7)>4.56?1:0);p.look=t>B.awaken?-1:1;
    if(t>=B.land){const foot=birdAnchor(p,'foot');p.x+=739-foot.x;p.y+=715.6-foot.y;}
    return p;
  }
  const cameras=[{t:0,x:535,y:530,z:1.04},{t:2.8,x:535,y:510,z:1.07},{t:B.pickup,x:535,y:470,z:1.22},{t:B.pickup+.3,x:535,y:470,z:1.22},{t:B.land,x:687,y:642,z:1.27},{t:10.6,x:687,y:642,z:1.27},{t:B.awaken,x:620,y:565,z:1.10},{t:B.sprout,x:540,y:510,z:1.065},{t:B.boat,x:520,y:500,z:1.075},{t:B.connect,x:540,y:510,z:1.035},{t:B.resolve,x:690,y:650,z:1.23},{t:32,x:690,y:650,z:1.23}];
  function cameraAt(t){return keyed(t,cameras);}
  function applyCamera(c){g.translate(540,540);g.scale(c.z,c.z);g.translate(-c.x,-c.y);}
  function nightAt(t){return ease(range(t,B.night,B.night+1.8))*(1-ease(range(t,B.return,B.resolve)));}
  function background(t){
    g.fillStyle=C.paper;g.fillRect(0,0,W,H);const n=nightAt(t);
    if(n>.001){
      const edge=-35+1150*n;g.save();g.beginPath();g.moveTo(0,0);g.lineTo(W,0);
      for(let x=W;x>=0;x-=12)g.lineTo(x,edge+Math.sin(x*.018)*5+(seeded(Math.floor(x/12)+93)-.5)*7);
      g.closePath();g.clip();g.fillStyle=C.night;g.fillRect(0,0,W,H);g.drawImage(printSurface,0,0);
      const glow=g.createRadialGradient(680,660,10,620,600,630);glow.addColorStop(0,'#ceb88520');glow.addColorStop(1,'#ceb88500');g.fillStyle=glow;g.fillRect(0,0,W,H);
      for(let i=0;i<85;i++){g.globalAlpha=.25+.35*Math.sin(t*.7+i)**2;dot(48+seeded(i+80)*984,70+seeded(i+760)*930,i%8===0?1.8:.85,C.light);}g.globalAlpha=1;g.restore();
    }
  }
  function envelopeBack(t,open){
    g.save();g.translate(env.x,env.y);g.scale(env.s,env.s);
    g.globalAlpha=.12;g.fillStyle=C.ink;g.beginPath();g.ellipse(6,110,155,18,0,0,Math.PI*2);g.fill();g.globalAlpha=1;
    pen.stroke([[-128,-65],[125,-65],[128,87],[-125,89]],t,201,{closed:true,fill:'#dfcdab',width:2.5});
    pen.stroke([[-128,-65],[0,lerp(55,-163,open)],[125,-65]],t,212,{closed:true,fill:'#ebdcbb',width:2.5});
    if(open>.4)pen.hatch([[-124,-65],[0,-160],[123,-65]],t,219,'#9a8a71',12);
    g.restore();
  }
  function envelopeFront(t,open){
    g.save();g.translate(env.x,env.y);g.scale(env.s,env.s);
    pen.stroke([[-128,-65],[125,-65],[128,87],[-125,89]],t,221,{closed:true,fill:'#e9d8b5',width:2.5});
    pen.hatch([[-121,78],[-9,-12],[124,83]],t,228,'#9c8d76',13);
    pen.stroke([[-126,-64],[0,31],[124,-64]],t,230,{width:1.2,color:'#8b806d'});
    pen.stroke([[-125,88],[0,-8],[128,87]],t,231,{width:1.4});
    g.save();g.globalAlpha*=.34;pen.stroke([[-110,63],[-98,59],[-93,62]],t,235,{color:'#a1835b',width:1.1});
    for(let i=0;i<4;i++)pen.stroke([[68+i*8,-45],[65+i*8,-26]],t,236+i,{color:'#9e8462',width:.9});g.restore();
    if(open<.5)pen.stroke([[-128,-65],[0,lerp(55,-163,open)],[125,-65]],t,212,{closed:true,fill:'#ebdcbb',width:2.1});
    pen.oval(0,35,22,21,t,1,C.red,249);text('光',0,44,24,C.red,500,'center',false);
    g.restore();
  }
  function strip(label,a,t,ring=0){
    g.save();g.globalAlpha*=a.alpha??1;g.translate(a.x,a.y);g.rotate(a.angle||0);g.scale(a.s,a.s);g.font='500 28px StudioSans';const w=g.measureText(label).width+28;
    g.save();g.globalAlpha*=.13;g.translate(2,3);
    pen.stroke([[0,-22],[w,-21],[w,22],[0,23]],t,307,{closed:true,fill:'#382f24',color:'#382f24',width:.3});g.restore();
    pen.stroke([[0,-22],[w*.32,-24],[w+2,-20],[w-1,22],[w*.6,20],[-2,23]],t,310+label.length,{closed:true,fill:C.ink,color:C.ink,width:1.2});
    g.save();g.globalAlpha*=.2;for(let j=0;j<9;j++){const xx=seeded(j+label.length)*w;pen.stroke([[xx,-19],[xx+5,-19]],t,350+j,{color:C.paper,width:.9});}g.restore();
    text(label,14,10,28,C.paper,500,'left',false);if(ring)pen.oval(w/2,0,w/2+12,32,t,ring,C.red,320);g.restore();
  }
  const starts=[{x:570,y:422,s:.7,angle:0},{x:170,y:345,s:.73,angle:.08},{x:150,y:514,s:.76,angle:-.06}];
  function paperPose(t,i){
    const a=starts[i];
    if(i===0){
      const pick=birdAnchor(poseAt(B.pickup)),rel=birdAnchor(poseAt(B.release));
      if(t<B.pickup)return {...a};
      if(t<=B.release){const b=birdAnchor(poseAt(t));return {x:b.x,y:b.y,s:.7,angle:.03*Math.sin((t-B.pickup)*4)};}
      const u=range(t,B.release,B.release+1.05),prev=birdAnchor(poseAt(B.release-.001));
      const v={x:(rel.x-prev.x)*1000,y:(rel.y-prev.y)*1000};
      const bez=(a,b,c,d)=>(1-u)**3*a+3*(1-u)**2*u*b+3*(1-u)*u*u*c+u**3*d;
      return {x:bez(rel.x,rel.x+v.x*.35,803,790),y:bez(rel.y,rel.y+v.y*.35,746,792),s:lerp(.7,.48,u),angle:u*.45,alpha:1-ease(range(u,.95,1))};
    }
    const start=6.4+(i-1)*.65,q=ease(range(t,start,start+3.5));return {...a,x:lerp(a.x,790,q),y:lerp(a.y,775,q)-Math.sin(q*Math.PI)*(125+i*22),s:lerp(a.s,.32,q),angle:lerp(a.angle,-.3,q),alpha:1-ease(range(q,.92,1))};
  }
  function foregroundPapers(t){
    for(let i=0;i<3;i++)if(t<10.6){const ring=i===0?range(t,B.notice,B.notice+1.05):range(t,5.6+i*.22,6.2+i*.22);strip(labels[i],paperPose(t,i),t,ring);}
  }
  const filler=['把今天记下来','先写一个开头','还能慢一点吗','一封没寄出的信','改一遍就好','谢谢你呀','明天再试','想说的话'];
  function floatingPapers(t){
    const a=1-ease(range(t,4.25,5.5));if(a<=0)return;
    const positions=[[70,235],[410,252],[780,235],[350,325],[845,382],[65,436],[370,534],[88,742],[485,810],[864,625]];
    for(let i=0;i<positions.length;i++){
      const [x,y]=positions[i];
      strip(filler[i%filler.length],{x:x+Math.sin(t*.5+i)*4,y:y+Math.cos(t*.45+i)*3,s:.44+seeded(i)*.08,angle:(seeded(i+9)-.5)*.15,alpha:a*.54},t);
    }
  }

  const sproutPath=new Path2D();
  sproutPath.moveTo(468,710);sproutPath.lineTo(492,710);sproutPath.lineTo(493,474);sproutPath.bezierCurveTo(640,481,692,343,704,294);sproutPath.bezierCurveTo(565,277,493,353,480,430);sproutPath.bezierCurveTo(442,338,326,313,282,342);sproutPath.bezierCurveTo(300,462,382,501,468,493);sproutPath.closePath();
  const boatPath=new Path2D();boatPath.moveTo(233,547);boatPath.lineTo(741,547);boatPath.lineTo(638,687);boatPath.lineTo(347,687);boatPath.closePath();boatPath.moveTo(475,290);boatPath.lineTo(475,525);boatPath.lineTo(271,525);boatPath.closePath();boatPath.moveTo(498,339);boatPath.lineTo(674,525);boatPath.lineTo(498,525);boatPath.closePath();
  function targets(path){
    const pts=[];for(let y=270;y<=720;y+=14)for(let x=220;x<=760;x+=14)if(g.isPointInPath(path,x,y))pts.push({x,y});
    if(pts.length<N)throw Error(`Not enough silhouette samples: ${pts.length} < ${N}`);
    return Array.from({length:N},(_,i)=>pts[Math.floor(i*pts.length/N)]);
  }
  const sprouts=targets(sproutPath),boats=targets(boatPath).map(p=>({x:p.x-45,y:p.y-35})),stars=[[265,593],[383,396],[491,430],[618,316],[676,390],[763,424],[686,462],[662,595],[505,677],[365,648]];
  const chars=[...'第一次尝试再试一次想把今天记下来给妈妈的信'];
  function glyphPosition(t,i){
    const a=sprouts[i],b=boats[i],delay=seeded(i+32)*.45;
    if(t<B.morph){const q=out(range(t,B.awaken+delay,B.sprout+delay*.3));return {x:lerp(790,a.x,q)+Math.sin(q*Math.PI)*(seeded(i+6)-.5)*210,y:lerp(723,a.y,q)-Math.sin(q*Math.PI)*(80+seeded(i+7)*170),alpha:range(t,B.awaken+delay,B.awaken+.3+delay),size:lerp(7,12.5,q)};}
    if(t<B.constellation){const q=ease(range(t,B.morph+delay*.4,B.boat));return {x:lerp(a.x,b.x,q)+Math.sin(q*Math.PI)*(seeded(i+40)-.5)*160,y:lerp(a.y,b.y,q)-Math.sin(q*Math.PI)*(30+seeded(i+41)*90),alpha:1,size:12.5};}
    const j=i%stars.length,s=stars[j],q=ease(range(t,B.constellation+delay*.3,B.connect+.7));
    return {x:lerp(b.x,s[0]+(seeded(i+2)-.5)*15,q),y:lerp(b.y,s[1]+(seeded(i+3)-.5)*15,q)-Math.sin(q*Math.PI)*70,alpha:1-ease(range(t,B.connect-.1,B.connect+.9)),size:12.5};
  }
  function glyphs(t){
    if(t<B.awaken||t>B.connect+1)return;
    for(let i=0;i<N;i++){const p=glyphPosition(t,i);if(p.alpha<=0)continue;g.globalAlpha=p.alpha*(i%8===0?.9:.79);text(chars[i%chars.length],p.x,p.y,p.size,i%8===0?'#ce8c68':C.light,500,'center',false);}g.globalAlpha=1;
    const sprout=ease(range(t,B.sprout-.65,B.sprout))*(1-ease(range(t,B.morph,B.morph+.7)));
    if(sprout){g.globalAlpha=sprout*.72;
      pen.stroke([[490,475],[558,457],[620,406],[663,345],[704,294],[625,300],[558,331],[512,376],[480,430]],t,401,{color:C.light,width:1.2});
      pen.stroke([[468,493],[407,490],[350,453],[305,391],[282,342],[340,336],[402,359],[449,399],[480,450]],t,402,{color:C.light,width:1.2});
      g.globalAlpha=sprout;pen.stroke([[480,706],[480,477],[581,379]],t,406,{color:C.red,width:3});pen.stroke([[480,478],[383,405]],t,407,{color:C.red,width:2.4});pen.oval(480,727,112,14,t,1,C.light,409);g.globalAlpha=1;}
    const water=ease(range(t,B.morph+.8,B.boat))*(1-ease(range(t,B.constellation,B.connect)));
    if(water){
      const outline=ease(range(t,B.boat-.3,B.boat+.2))*(1-ease(range(t,B.constellation,B.constellation+.5)));
      g.globalAlpha=outline*.75;
      pen.stroke([[188,512],[696,512],[593,652],[302,652],[188,512]],t,431,{color:C.red,width:1.5});
      pen.stroke([[430,255],[430,490],[226,490],[430,255]],t,432,{color:C.light,width:1});
      g.globalAlpha=water*.5;for(let row=0;row<3;row++){const pts=[];for(let j=0;j<45;j++)pts.push([155+j*13,684+row*18+Math.sin(j*.28-t*1.2+row)*4]);pen.stroke(pts,t,420+row,{color:C.light,width:1});}g.globalAlpha=1;}
  }
  function constellation(t){
    const appear=ease(range(t,B.constellation+.3,B.connect+.5));if(!appear)return;
    const gather=ease(range(t,B.return,B.resolve-.3)),seal={x:790,y:770+35*.82};
    const pts=stars.map(([x,y])=>[lerp(x,seal.x,gather),lerp(y,seal.y,gather)]);
    g.globalAlpha=appear*(1-gather);
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length],q=out(range(t,B.connect+i*.09,B.connect+.5+i*.09));
      if(q)pen.stroke([a,[lerp(a[0],b[0],q),lerp(a[1],b[1],q)]],t,500+i,{color:C.light,width:1.5});
      dot(a[0],a[1],3.8,C.red);pen.oval(a[0],a[1],10,10,t,appear,C.light,520+i);
    }
    const la=ease(range(t,B.connect+.7,B.connect+1.3))*(1-ease(range(t,B.return-.4,B.return+.3)));g.globalAlpha=la;
    text('勇气',383,366,22,C.light,500,'center',false);text('想念',618,283,22,C.light,500,'center',false);text('远方',799,430,22,C.light,500,'center',false);text('再试一次',505,723,22,C.light,500,'center',false);g.globalAlpha=1;
    if(gather){const r=14+Math.sin(gather*Math.PI)*35,glow=g.createRadialGradient(seal.x,seal.y,1,seal.x,seal.y,r*3);glow.addColorStop(0,'#ffd895aa');glow.addColorStop(1,'#ffd89500');g.fillStyle=glow;g.fillRect(seal.x-r*3,seal.y-r*3,r*6,r*6);dot(seal.x,seal.y,4,C.red);}
  }
  function caption(t){
    const captions=[
      [0,3.7,'那些没说完的话，'],[3.7,7.5,'藏着一个小小的愿望。'],[7.5,11.2,'先替你，好好收着。'],
      [12.5,15.7,'夜深了，愿望醒了。'],[15.7,19,'一点勇气，长出新芽。'],[19,23.2,'一次尝试，驶向远方。'],[24.1,28,'原来，每个小小的开始，']
    ];
    for(const [a,b,s]of captions){const alpha=ease(range(t,a+.12,a+.5))*(1-ease(range(t,b-.42,b)));if(alpha>0){g.globalAlpha=alpha;text(s,540,971,33,nightAt(t)>.55?C.light:C.ink,500,'center');}}g.globalAlpha=1;
    const title=1-ease(range(t,2.8,4));if(title){g.globalAlpha=title;text('未寄出的光',90,137,58,C.ink,600);text('A LITTLE LIGHT, KEPT SAFE',94,176,15,C.ink,500);g.globalAlpha=1;}
    const end=ease(range(t,B.resolve-.4,B.resolve+.4));if(end){g.globalAlpha=end;text('都值得被看见。',540,326,60,C.ink,600,'center');text('KEEP A LITTLE LIGHT.',540,374,18,C.ink,500,'center');text('未寄出的光',540,927,26,C.ink,500,'center');text('一只纸鸟，和每个小小的开始',540,973,19,C.ink,400,'center');g.globalAlpha=1;}
  }
  function seek(t){
    if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek outside timeline');d.reset(t);background(t);
    const cam=cameraAt(t),p=poseAt(t),open=ease(range(t,6.4,8))*(1-ease(range(t,10.1,10.8)))+ease(range(t,B.awaken-.4,B.awaken+.3))*(1-ease(range(t,B.resolve-.3,B.resolve+.7)));
    g.save();applyCamera(cam);
    // The same envelope and bird persist for the whole film; occlusion is explicit.
    const ground=1-ease(range(t,4.05,4.65));if(ground){g.globalAlpha=ground*.10;g.fillStyle=C.ink;g.beginPath();g.ellipse(355,748,70,9,0,0,Math.PI*2);g.fill();g.globalAlpha=1;}
    floatingPapers(t);envelopeBack(t,clamp(open));foregroundPapers(t);glyphs(t);envelopeFront(t,clamp(open));
    drawPaperBird(d,pen,p,t);constellation(t);
    // The light changes the observer, not only the sky.
    const lit=ease(range(t,B.awaken,B.sprout))*(1-ease(range(t,B.resolve-.2,B.resolve+.7)));
    if(lit){const glow=g.createRadialGradient(p.x-35,p.y-38,1,p.x-35,p.y-38,125);glow.addColorStop(0,`rgba(245,200,117,${lit*.1})`);glow.addColorStop(1,'#f5c87500');g.fillStyle=glow;g.fillRect(p.x-160,p.y-165,250,250);}
    g.restore();
    g.globalAlpha=.87;g.drawImage(surface,0,0,W,H);g.globalAlpha=1;
    const vignette=g.createRadialGradient(540,500,300,540,540,780);vignette.addColorStop(0,'#5b472100');vignette.addColorStop(1,'#5b472116');g.fillStyle=vignette;g.fillRect(0,0,W,H);
    // Registration marks and captions stay in screen coordinates.
    const ink=nightAt(t)>.5?C.light:C.ink;for(const [x,y]of [[30,30],[1050,30],[30,1050],[1050,1050]]){line(x-8,y,x+8,y,ink+'55',.7);line(x,y-8,x,y+8,ink+'55',.7);}
    caption(t);
    const beak=birdAnchor(p),paper=paperPose(t,0);
    lastTrace={t,camera:cam,bird:p,beak,paper,carrying:t>=B.pickup&&t<=B.release,envelope:env,open:clamp(open),foot:birdAnchor(p,'foot'),particleCount:N};return true;
  }
  return {seek,inspect:d.inspect,trace:()=>lastTrace,layoutCoverage:d.layoutCoverage+'; movement trace available'};
}
