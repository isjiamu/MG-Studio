import {clamp,lerp,ease,out,range,spring,noise} from '../lib/motion.js';
import {kinetic} from './kinetic.js';
import {createStory} from './story.js';
import {createIndustry} from './industry.js';
const C={paper:'#F2F0E8',ink:'#142C35',lime:'#C6F16B',coral:'#ED6D51',blue:'#477EEC',white:'#FFFFFF',muted:'#647878'};
export function createFilm(canvas,cfg){
  if(cfg.demo==='story')return createStory(canvas,cfg);
  if(cfg.demo==='industry')return createIndustry(canvas,cfg);
  const g=canvas.getContext('2d',{alpha:false}),portrait=canvas.height>canvas.width;
  const square=canvas.height===canvas.width;
  const W=portrait?1080:1920,scale=canvas.width/W,H=canvas.height/scale;
  let issues=[],time=0;
  const rr=(x,y,w,h,r=20,fill=C.ink)=>{g.fillStyle=fill;g.beginPath();g.roundRect(x,y,Math.max(.01,w),Math.max(.01,h),Math.min(r,w/2,h/2));g.fill();};
  function line(x1,y1,x2,y2,color=C.ink,width=3){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();}
  function circle(x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,Math.max(0,r),0,Math.PI*2);g.fill();}
  function text(str,x,y,size=40,color=C.ink,weight=600,align='left',safe=true){
    g.fillStyle=color;g.font=`${weight} ${size}px StudioSans`;g.textAlign=align;g.textBaseline='alphabetic';
    const m=g.measureText(str);g.fillText(str,x,y);
    if(safe&&g.globalAlpha>.1){
      const tr=g.getTransform(),left=x-(align==='center'?m.width/2:align==='right'?m.width:0);
      const top=y-m.actualBoundingBoxAscent,bottom=y+m.actualBoundingBoxDescent;
      const pts=[[left,top],[left+m.width,top],[left,bottom],[left+m.width,bottom]].map(([a,b])=>[tr.a*a+tr.c*b+tr.e,tr.b*a+tr.d*b+tr.f]);
      if(pts.some(([a,b])=>a<12*scale||b<12*scale||a>canvas.width-12*scale||b>canvas.height-12*scale))issues.push({text:str,reason:'text outside safe canvas',time});
    }
  }
  function ring(x,y,r,width,color,start=0,end=Math.PI*2){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.arc(x,y,r,start,end);g.stroke();}
  function arrow(x,y,angle=0,color=C.ink,s=1){
    g.save();g.translate(x,y);g.rotate(angle);g.scale(s,s);line(-35,0,35,0,color,5);line(35,0,9,-26,color,5);line(35,0,9,26,color,5);g.restore();
  }
  function star(x,y,r,color,rot=0){
    g.save();g.translate(x,y);g.rotate(rot);g.beginPath();
    for(let i=0;i<24;i++){const a=i*Math.PI/12,rad=i%2?r*.63:r;g.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}
    g.closePath();g.fillStyle=color;g.fill();g.restore();
  }
  function caption(kicker,title,sub,t,color=C.ink){
    const x=portrait?76:108,y=portrait?330:340;
    text(kicker,x,portrait?172:182,22,color,600);
    title.forEach((s,i)=>{
      g.save();g.globalAlpha=range(t,-.12,.25+i*.06);const shift=(1-out(range(t,i*.08,.65+i*.08)))*45;
      text(s,x,y+i*(portrait?130:155)+shift,portrait?112:142,color,800);g.restore();
    });
    const sy=y+title.length*(portrait?130:155)+30;
    text(sub,x,sy,portrait?29:32,color,400);
  }
  function shell(i,color){
    text('REFRACT  /  折光',portrait?76:108,H-76,24,color,700);
    text('CONCEPT FILM',W-(portrait?76:108),H-76,18,color,500,'right');
    for(let k=0;k<6;k++)rr((portrait?76:108)+k*44,H-42,30,4,2,k===i?color:color+'45');
  }
  function product(i,t){
    const bg=[C.paper,C.lime,C.paper,C.ink,C.paper,C.lime][i];
    const fg=i===3?C.paper:C.ink;
    g.fillStyle=bg;g.fillRect(0,0,W,H);
    // Quiet registration marks build a consistent graphic world.
    for(const [x,y]of [[W-90,90],[W-90,H-120]]){line(x-12,y,x+12,y,fg+'55',2);line(x,y-12,x,y+12,fg+'55',2);}
    shell(i,fg);
    const cx=portrait?540:square?960:1375,cy=portrait?1130:square?1205:535;
    if(i===0){
      caption('01 / AN IDEA TAKES SHAPE',['让灵感','有形。'],'把脑海中的一点光，变成看得见的作品。',t);
      const k=out(range(t,.08,1.1)),r=portrait?265:270;
      g.save();g.translate(cx,cy);g.rotate(-.14+t*.12);
      for(let j=6;j>=0;j--){
        const a=j*.16+time*.12,x=Math.cos(a)*j*18,y=Math.sin(a)*j*18;
        g.save();g.translate(x,y);g.rotate(j*.12);rr(-r*k,-r*.7,r*2*k,r*1.4,70,[C.ink,C.coral,C.paper,C.ink,C.lime,C.coral,C.lime][j]);g.restore();
      }
      circle(0,0,100,C.ink);star(0,0,70,C.lime,t*.4);g.restore();
      const yy=cy+(portrait?490:square?460:420);text('一点想法，无限可能。',cx,yy,30,C.ink,500,'center');
      for(let j=0;j<3;j++)circle(cx-200+j*200,cy-360,5+j*3,j===1?C.coral:C.ink);
    }else if(i===1){
      caption('02 / COLLECT → CONNECT',['散落的想法，','开始连接。'],'收集灵感，让每一个片段找到自己的位置。',t);
      const labels=['灵感','图像','文字','节奏'],colors=[C.paper,C.ink,C.coral,C.paper];
      const p=ease(range(t,.6,2.2));
      for(let j=0;j<4;j++){
        const tx=cx+((j%2)-.5)*270,ty=cy+(Math.floor(j/2)-.5)*210;
        const sx=cx+Math.cos(j*Math.PI/2+.4)*330,sy=cy+Math.sin(j*Math.PI/2+.4)*330;
        const x=lerp(sx,tx,p),y=lerp(sy,ty,p),rot=(1-p)*[.2,-.17,-.25,.12][j];
        g.save();g.translate(x,y);g.rotate(rot);
        rr(-123,-87,246,174,20,colors[j]);text(labels[j],0,20,49,j===1?C.paper:C.ink,700,'center');
        if(j===0)circle(85,-53,10,C.coral);if(j===2)star(85,-53,16,C.ink,t*.3);
        g.restore();
      }
      if(p>.75){g.save();g.globalAlpha=range(p,.75,1);line(cx-22,cy,cx+22,cy,C.ink,4);line(cx,cy-22,cx,cy+22,C.ink,4);g.restore();}
      text('COLLECT  /  CONNECT  /  CREATE',cx,cy+440,portrait?21:24,C.ink,500,'center');
    }else if(i===2){
      caption('03 / COMPOSE YOUR POINT OF VIEW',['从碎片，','到作品。'],'结构、色彩、字形，在同一张画布里相遇。',t);
      const s=.85+.15*spring(t,100,20),pw=portrait?640:650,ph=520;
      g.save();g.translate(cx,cy);g.scale(s,s);
      rr(-pw/2-14,-ph/2-14,pw+28,ph+28,26,C.ink);
      rr(-pw/2,-ph/2,pw,ph,16,C.paper);
      g.save();g.beginPath();g.rect(-pw/2,-ph/2,pw,ph);g.clip();
      rr(-pw/2,-ph/2,pw*.47,ph,0,C.coral);
      for(let j=0;j<6;j++)line(-pw/2+32,-ph/2+42+j*77,-pw/2+pw*.47-32,-ph/2+42+j*77,C.ink,.8);
      star(-pw*.27,0,100,C.ink,t*.2);
      const dx=pw*.07;const reveal=out(range(t,.3,1.4));
      g.save();g.beginPath();g.rect(dx,-ph/2+48,pw*.38,ph*.7*reveal);g.clip();
      text('MAKE',dx,-100,62,C.ink,900,'left',false);text('IT',dx,-12,62,C.ink,900,'left',false);text('MATTER.',dx,76,44,C.ink,900,'left',false);g.restore();
      rr(dx,ph/2-92,pw*.36,36,18,C.lime);g.restore();
      g.restore();
      text('你的观点，值得被看见。',cx,cy+430,30,C.ink,500,'center');
    }else if(i===3){
      caption('04 / A CONTINUOUS CREATIVE FLOW',['一个动作，','接着一个。'],'从创作到呈现，保持思路流动。',t,C.paper);
      const stage=Math.min(3,Math.floor(t)),q=t-stage,p=out(range(q,0,.45));
      const sizes=[[300,100],[190,190],[430,270],[550,120]];
      const prev=sizes[Math.max(0,stage-1)],curr=sizes[stage],w=lerp(prev[0],curr[0],p),h=lerp(prev[1],curr[1],p);
      rr(cx-w/2,cy-h/2,w,h,lerp(35,stage===1?95:28,p),C.lime);
      g.save();g.globalAlpha=range(q,.25,.5);
      if(stage===0){text('开始创作',cx,cy+18,40,C.ink,700,'center');}
      if(stage===1){ring(cx,cy,50,9,C.ink,-Math.PI/2,-Math.PI/2+Math.PI*2*range(q,.1,.8));}
      if(stage===2){
        rr(cx-180,cy-100,105,200,12,C.coral);
        for(let k=0;k<3;k++)rr(cx-45,cy-80+k*65,180-(k===2?55:0),20,8,C.ink);
      }
      if(stage===3){circle(cx-195,cy,25,C.ink);line(cx-208,cy,cx-198,cy+11,C.lime,4);line(cx-198,cy+11,cx-182,cy-12,C.lime,4);text('作品已就绪',cx+36,cy+15,37,C.ink,700,'center');}
      g.restore();
      const cursorX=cx+150+Math.sin(t*.8)*30,cursorY=cy+170-22*ease(range(q,.05,.2))+22*ease(range(q,.2,.4));
      g.save();g.translate(cursorX,cursorY);g.fillStyle=C.paper;g.beginPath();g.moveTo(0,0);g.lineTo(0,48);g.lineTo(13,36);g.lineTo(24,57);g.lineTo(34,51);g.lineTo(23,31);g.lineTo(42,28);g.closePath();g.fill();g.restore();
      for(let j=0;j<4;j++)circle(cx-75+j*50,cy+330,5,j<=stage?C.lime:'#48616B');
    }else if(i===4){
      caption('05 / ONE IDEA. EVERY FRAME.',['换个画幅，','同样出彩。'],'为每一块屏幕，重新安排内容。',t);
      const specs=portrait?[
        [cx-160,cy-140,330,195,-.1],[cx+190,cy-40,200,200,.08],[cx-65,cy+240,166,290,-.05]
      ]:[[cx-120,cy-210,490,276,-.06],[cx+180,cy+90,250,250,.07],[cx-175,cy+190,166,290,-.04]];
      specs.forEach(([x,y,w,h,r],j)=>{
        const s=out(range(t,j*.18,.75+j*.18));
        g.save();g.translate(x,y+80*(1-s));g.rotate(r);g.scale(Math.max(.01,s),Math.max(.01,s));
        rr(-w/2-7,-h/2-7,w+14,h+14,18,C.ink);rr(-w/2,-h/2,w,h,12,j===1?C.coral:C.lime);
        star(0,h> w?-h*.18:0,Math.min(w,h)*.24,C.ink,t*.14);
        if(h>w)line(-w*.3,h*.23,w*.3,h*.23,C.ink,6);
        else if(w>h){line(-w*.4,h*.32,w*.05,h*.32,C.ink,6);}
        else ring(0,0,w*.36,2,C.ink);
        g.restore();
      });
      const yy=portrait?cy+500:cy+430;text('16:9    /    1:1    /    9:16',cx,yy,29,C.ink,500,'center');
    }else{
      const y=portrait?610:square?780:435;
      star(W/2,y-(portrait?260:240),70,C.ink,.1+t*.1);
      text('让创意，发生。',W/2,y+20,portrait?104:148,C.ink,800,'center');
      const len=out(range(t,.1,1.3));
      line(W/2-260*len,y+90,W/2+260*len,y+90,C.ink,4);
      text('REFRACT / 折光',W/2,y+205,portrait?48:54,C.ink,700,'center');
      text('从一点灵感，到完整表达。',W/2,y+285,portrait?32:36,C.ink,400,'center');
      const boxY=portrait?1250:square?1370:835;rr(W/2-160,boxY-44,320,88,44,C.ink);text('开始你的创作',W/2,boxY+14,30,C.lime,600,'center');
    }
    // Shared full-frame circle wipe; transition duration is intentionally short.
    if(i<5&&t>3.68){
      const p=ease(range(t,3.68,4)),next=[C.lime,C.paper,C.ink,C.paper,C.lime][i];
      g.save();g.beginPath();g.arc(W+50,H+50,p*Math.hypot(W+100,H+100),0,Math.PI*2);g.clip();product(i+1,0);g.restore();
    }
  }
  function explainer(i,t){
    const palettes=[C.paper,C.paper,'#E7EEF7','#E7EEF7',C.ink,C.paper],bg=palettes[i],fg=i===4?C.paper:C.ink;
    g.fillStyle=bg;g.fillRect(0,0,W,H);
    const headings=[['一束光，','为什么转弯？'],['同一束光，','进入另一种介质。'],['传播速度变了，','波前随之转向。'],['向法线靠近，','是这种情况。'],['角度之间，','有一条规律。'],['折射，让我们','看见不同。']];
    const subs=['空气与玻璃的交界，发生了什么？','用一条光线，追踪传播方向。','玻璃中的光，传播得更慢。','从空气斜射入玻璃，折射角更小。','n₁ sin θ₁ = n₂ sin θ₂','介质改变速度；斜入射时，方向也可能改变。'];
    const tx=portrait?76:108; text('LIGHT LAB / 光的实验室',tx,portrait?166:145,22,fg,600);
    headings[i].forEach((s,j)=>text(s,tx,(portrait?295:300)+j*(portrait?105:110),portrait?86:96,fg,800));
    text(subs[i],tx,portrait?570:560,portrait?28:30,fg,400);
    text('折射 · 理想均匀介质示意',tx,H-76,22,fg,400);
    const cx=portrait?540:square?960:1430,cy=portrait?1190:square?1200:540,dw=portrait?820:700,dh=portrait?740:650;
    rr(cx-dw/2,cy-dh/2,dw,dh,30,i===4?'#244551':'#FFFFFF');
    g.save();g.beginPath();g.roundRect(cx-dw/2,cy-dh/2,dw,dh,30);g.clip();
    rr(cx-dw/2,cy,dw,dh/2,0,i===4?'#355666':'#CEE2EF');
    const theme=i===4?C.paper:C.ink;
    g.setLineDash([8,9]);line(cx,cy-dh/2+55,cx,cy+dh/2-55,theme+'77',2);g.setLineDash([]);
    line(cx-dw/2,cy,cx+dw/2,cy,theme+'66',2);
    const theta1=Math.PI/4,theta2=Math.asin(Math.sin(theta1)/1.5),len=dh*.4;
    const ax=cx-Math.sin(theta1)*len,ay=cy-Math.cos(theta1)*len;
    const bx=cx+Math.sin(theta2)*len,by=cy+Math.cos(theta2)*len;
    const pr=range(t,.1,1.3);line(ax,ay,lerp(ax,cx,Math.min(1,pr*2)),lerp(ay,cy,Math.min(1,pr*2)),C.coral,8);
    if(pr>.5)line(cx,cy,lerp(cx,bx,(pr-.5)*2),lerp(cy,by,(pr-.5)*2),C.blue,8);
    circle(cx,cy,9,C.coral);
    for(let j=0;j<7;j++){
      const p=((time*.6+j/7)%1),incoming=p<.4;
      const q=incoming?p/.4:(p-.4)/.6;
      circle(incoming?lerp(ax,cx,q):lerp(cx,bx,q),incoming?lerp(ay,cy,q):lerp(cy,by,q),4,incoming?C.paper:C.lime);
    }
    if(i>=2&&i<=3){
      for(let j=0;j<5;j++){
        const p=((t*180+j*60)%len)/len,xx=lerp(ax,cx,p),yy=lerp(ay,cy,p);
        line(xx-24,yy+24,xx+24,yy-24,C.coral+'80',2);
        const p2=((t*120+j*40)%len)/len,x2=lerp(cx,bx,p2),y2=lerp(cy,by,p2);
        line(x2-30,y2+15,x2+30,y2-15,C.blue+'80',2);
      }
    }
    text('空气',cx+dw*.26,cy-dh*.27,30,theme,600,'center');
    text('玻璃',cx-dw*.29,cy+dh*.31,30,theme,600,'center');
    text('法线',cx+20,cy-dh/2+45,21,theme,400);
    if(i>=3){ring(cx,cy,80,2,C.coral,-Math.PI/2-theta1,-Math.PI/2);ring(cx,cy,80,2,C.blue,Math.PI/2-theta2,Math.PI/2);}
    if(i===4){text(`${Math.round(theta1*180/Math.PI)}°`,cx-68,cy-118,28,C.coral,700,'center');text(`≈ ${Math.round(theta2*180/Math.PI)}°`,cx+91,cy+145,28,C.lime,700,'center');}
    g.restore();
    if(i===5){text('REFRACTION',cx,cy+dh/2+75,portrait?34:30,C.ink,600,'center');}
  }
  function seek(t){
    if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek(t) outside [0, duration)');
    time=t;issues=[];g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.setLineDash([]);
    g.scale(scale,scale);
    const index=cfg.scenes.findIndex(s=>t>=s.from&&t<s.to);if(index<0)throw Error('No scene at time');
    g.save();
    if(cfg.demo==='kinetic')kinetic(g,W,H,t);
    else (cfg.demo==='explainer'?explainer:product)(index,t-cfg.scenes[index].from);
    g.restore();
    return true;
  }
  return {seek,inspect:()=>issues};
}
