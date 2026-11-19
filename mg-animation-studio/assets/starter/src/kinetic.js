import {clamp,lerp,ease,out,range,spring} from '../lib/motion.js';
// A separate visual direction: full-bleed typography and geometric choreography.
export function kinetic(g,W,H,time){
  const u=W/1920,v=H/1080;
  g.save();g.scale(u,v);
  const ink='#11151D',paper='#F4F0E5',blue='#2458F4',orange='#FF6D3A',lime='#D8F66C';
  const scene=Math.min(3,Math.floor(time/4)),t=time-scene*4;
  const rect=(x,y,w,h,c,r=0)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,Math.max(.01,w),Math.max(.01,h),r);g.fill();};
  const dot=(x,y,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y,Math.max(0,r),0,Math.PI*2);g.fill();};
  function type(s,x,y,size,c=paper,weight=900){
    g.font=`${weight} ${size}px StudioSans`;g.textAlign='center';g.textBaseline='middle';g.fillStyle=c;g.fillText(s,x,y);
  }
  function stroke(x1,y1,x2,y2,c,w){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();}
  function flower(x,y,r,c,a=0){
    g.save();g.translate(x,y);g.rotate(a);g.fillStyle=c;g.beginPath();
    for(let k=0;k<32;k++){const angle=k*Math.PI/16,rad=k%2?r*.6:r;g.lineTo(Math.cos(angle)*rad,Math.sin(angle)*rad);}
    g.closePath();g.fill();g.restore();
  }
  if(scene===0){
    rect(0,0,1920,1080,ink);
    const phase=Math.min(2,Math.floor(t)),q=t-phase;
    if(phase===0){
      type('点',500,525,400);
      const x=lerp(1000,1450,out(range(q,0,.5)));
      dot(x,540,120+.05*Math.sin(t*12)*100,orange);
      for(let k=0;k<5;k++)dot(1030+k*90,540,Math.max(0,30-k*4)*(1-range(q,.1,.7)),paper);
    }else if(phase===1){
      const p=out(range(q,0,.7));
      type('线',500,525,400);
      for(let k=0;k<7;k++){
        const yy=250+k*95;stroke(1060,yy,1060+580*p,yy,k%2?paper:orange,16);
      }
    }else{
      type('面',500,525,400);
      const p=spring(q,140,25);
      for(let k=5;k>=0;k--){
        g.save();g.translate(1330,540);g.rotate((k-2.5)*.1*p);
        rect(-240-k*12,-240-k*12,480,480,[orange,paper,blue,orange,paper,blue][k],18);g.restore();
      }
      type('FORM',1330,540,75,paper,800);
    }
    type('EVERY IDEA STARTS SOMEWHERE.',960,120,26,paper,500);
    type('从一个点，开始。',960,960,36,paper,500);
  }else if(scene===1){
    rect(0,0,1920,1080,blue);
    const spread=1-range(t,2.35,3.5)*.6,spin=t*.14;
    g.save();g.translate(960,540);g.rotate(spin);g.scale(1.3,1.3);
    for(let row=-3;row<=3;row++)for(let col=-5;col<=5;col++){
      const d=Math.hypot(row,col),s=.68+.32*spring((t+.2)-d*.07,160,20);
      const x=col*225*spread,y=row*225*spread;
      g.save();g.translate(x,y);g.rotate((row+col)*.18+t*.4);
      if((row+col)%2)flower(0,0,82*s,paper,t*.2);
      else rect(-70*s,-70*s,140*s,140*s,orange,20);
      g.restore();
    }g.restore();
    rect(320,395,1280,290,ink,145);
    const pulse=1+.015*Math.exp(-((t%.5)/.1));
    g.save();g.translate(960,535);g.scale(pulse,pulse);type('让 想 法 起 舞',0,0,142,paper);g.restore();
    rect(520,892,880,86,ink,43);type('RHYTHM IS A DESIGN MATERIAL.',960,935,25,paper,500);
  }else if(scene===2){
    rect(0,0,1920,1080,paper);
    const stage=Math.min(3,Math.floor(t)),q=t-stage;
    const states=[[250,250,125],[1020,190,95],[750,570,36],[1120,330,165]];
    const a=states[Math.max(0,stage-1)],b=states[stage],p=clamp(spring(q,190,27));
    const w=lerp(a[0],b[0],p),h=lerp(a[1],b[1],p),r=lerp(a[2],b[2],p);
    // A single vessel morphs while its next semantic content waits for space.
    rect(960-w/2,540-h/2,w,h,stage===2?blue:ink,r);
    const alpha=range(q,.22,.45);g.save();g.globalAlpha=alpha;
    if(stage===0)flower(960,540,70,orange,t);
    if(stage===1)type('灵 感 连 接 中',960,540,93,paper,800);
    if(stage===2){
      for(let i=0;i<5;i++)rect(690+i*110,670-(i+1)*65,70,(i+1)*65,i===4?orange:paper,16);
      type('IDEAS IN MOTION',960,355,32,paper,600);
    }
    if(stage===3){type('不止一种可能',960,540,130,lime,900);dot(1425,540,28,orange);}
    g.restore();
    type('SAME SHAPE. A NEW POSSIBILITY.',960,140,28,ink,500);
    type('形变，有因。',960,940,44,ink,700);
  }else{
    rect(0,0,1920,1080,orange);
    const p=out(range(t,0,.7));
    for(let i=0;i<9;i++){
      const x=-60+i*245,yy=100+80*Math.sin(i*.7+t*.5);
      flower(x,yy,75,ink,i*.3+t*.2);flower(x,1080-yy,75,ink,-i*.3-t*.2);
    }
    g.save();g.translate(960,490);g.scale(.8+.2*p,.8+.2*p);type('创意 × 代码',0,0,230,ink);g.restore();
    type('MAKE IT MOVE.',960,705,78,ink,800);
    stroke(420,820,420+1080*range(t,.4,1.5),820,ink,5);
    if(t>2.7){const q=ease(range(t,2.7,3.45));dot(1760,540,80*q,ink);type('→',1760,536,100*q,paper,500);}
  }
  // Beat-aligned, brief stripe shutter between scenes; no inter-frame state.
  if(scene<3&&t>3.72){
    const p=ease(range(t,3.72,4)),next=[blue,paper,orange][scene];
    for(let k=0;k<8;k++){const local=clamp(p*1.35-k*.045);rect(k*240,1080*(1-local),242,1080*local,next);}
  }
  g.restore();
}
