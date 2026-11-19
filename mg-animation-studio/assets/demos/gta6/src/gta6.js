import {makeDraw} from '../lib/draw.js';
import {loadLayers} from '../lib/layers.js';

export async function createFilm(canvas,cfg){
  const d=makeDraw(canvas),{g,W,H,text,line,dot,box}=d;
  const im=await loadLayers(cfg.layers);
  const P={ink:'#100d1b',paper:'#fff3e8',pink:'#ff94b8',coral:'#ffac8c',mint:'#9ef3d7'};
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const ease=x=>1-(1-clamp(x))**3;
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const lerp=(a,b,x)=>a+(b-a)*x;
  function alpha(a,fn){g.save();g.globalAlpha*=clamp(a);fn();g.restore();}
  function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
  function polygon(pts,c){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(c){g.fillStyle=c;g.fill();}}
  function crop(key,x,y,w,h,z=1,fx=.5,fy=.5){
    const a=im[key],s=Math.max(w/a.width,h/a.height)*z,sw=w/s,sh=h/s;
    const sx=clamp(a.width*fx-sw/2,0,a.width-sw),sy=clamp(a.height*fy-sh/2,0,a.height-sh);
    g.drawImage(a,sx,sy,sw,sh,x,y,w,h);
  }
  function grad(x,y,w,h,stops,horiz=false){const a=g.createLinearGradient(x,y,horiz?x+w:x,horiz?y:y+h);for(const [p,c] of stops)a.addColorStop(p,c);rect(x,y,w,h,a);}
  function vignette(){grad(0,0,W,H,[[0,'#0b071e55'],[.25,'#0b071e00'],[.6,'#0b071e10'],[1,'#080715b8']]);}
  function label(s,x,y,color=P.paper){text(s,x,y,24,color,600);}
  function heading(s,x,y,size,color=P.paper,weight=900,align='left'){text(s,x,y,size,color,weight,align);}
  function latin(s,x,y,size,color=P.paper,align='left',stroke=false){
    g.save();g.translate(x,y);g.scale(.78,1);g.font=`900 ${size}px StudioSans`;g.textAlign=align;g.textBaseline='alphabetic';
    if(stroke){g.strokeStyle=color;g.lineWidth=2;g.strokeText(s,0,0);}else{g.fillStyle=color;g.fillText(s,0,0);}g.restore();
  }
  function enter(s,x,y,size,color,start,at,weight=900,align='left'){const e=ease((at-start)/.65);alpha(e,()=>heading(s,x,y+34*(1-e),size,color,weight,align));}
  function rule(x,y,w,p,color=P.pink){line(x,y,x+w*ease(p),y,color,5);}
  function chapter(n,word,color=P.paper){label(`0${n}`,96,92,color);line(148,82,210,82,color,2);label(word,232,92,color);}
  function footer(t){
    alpha(.6,()=>{text('GTA VI  /  中文介绍概念片',96,1028,20,P.paper,500);text('ROCKSTAR GAMES · OFFICIAL IMAGERY',W-96,1028,18,P.paper,500,'right');});
    rect(96,1050,W-192,2,'#ffffff25');rect(96,1050,(W-192)*clamp(t/cfg.duration),2,P.pink);
  }
  function logo(x,y,w,a=1){alpha(a,()=>g.drawImage(im.logo,777,448,880,681,x,y,w,w*681/880));}
  function rings(x,y,t,color=P.pink){g.save();g.strokeStyle=color;g.lineWidth=2;for(let i=0;i<3;i++){const r=50+((t*.27+i/3)%1)*180;g.globalAlpha=.28*(1-(r-50)/180);g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();}g.restore();}
  function slash(t,c=P.pink){const p=ease(t/.65);polygon([[W+120-2300*p,0],[W+300-2300*p,0],[W+20-2300*p,H],[W-160-2300*p,H]],c);}
  function linePath(points,progress,color,width=3){
    if(progress<=0)return;const lengths=[];let total=0;for(let i=1;i<points.length;i++){const l=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(l);total+=l;}
    let remaining=total*clamp(progress);g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++){const q=Math.min(1,remaining/lengths[i-1]);g.lineTo(lerp(points[i-1][0],points[i][0],q),lerp(points[i-1][1],points[i][1],q));remaining-=lengths[i-1];if(remaining<=0)break;}g.strokeStyle=color;g.lineWidth=width;g.stroke();
  }
  function scene0(u){
    crop('cityNight',0,0,W,H,1.08-.035*clamp(u/6),.54,.46);
    grad(0,0,W,H,[[0,'#150a34b3'],[1,'#130b27c7']],true);
    alpha(.2,()=>latin('VI',1430,850,1020,P.pink,'center',true));
    for(let i=0;i<5;i++){const p=ease((u-i*.045)/.9);alpha(.55,()=>rect(0,i*216,W*(1-p),218,P.ink));}
    chapter(1,'WELCOME BACK',P.pink);
    enter('重返',102,382,112,P.paper,-.25,u,700);
    enter('罪恶都市',96,574,174,P.paper,.1,u);
    rule(104,635,685,(u-1.3)/.9);
    alpha(ease((u-1.5)/.7),()=>{latin('VICE CITY',106,748,100,P.pink);label('阳光之下，暗流涌动。',110,820,P.paper);});
    alpha(ease((u-2.1)/.8),()=>{logo(1410,293,350);label('GRAND THEFT AUTO VI',1370,660);});
    rings(1582,465,u,P.pink);
  }
  function scene1(u){
    rect(0,0,W,H,P.ink);const e=ease(u/.9);crop('viceSign',600-160*(1-e),0,1320+160*(1-e),H,1.03+.025*clamp(u/8),.56,.45);
    grad(0,0,1440,H,[[0,P.ink],[.38,'#100d1be6'],[1,'#100d1b00']],true);vignette();
    chapter(2,'THE SETTING',P.pink);
    enter('雷奥奈达州',96,318,105,P.paper,.25,u);
    alpha(ease((u-.7)/.7),()=>latin('LEONIDA',101,426,113,P.pink));rule(104,484,680,(u-1)/.8,P.pink);
    enter('霓虹海岸',104,581,48,P.paper,1.3,u,600);enter('喧闹街头',104,656,48,P.paper,3.2,u,600);
    const card=ease((u-2.6)/.8);alpha(card,()=>{g.save();g.translate(102,710+60*(1-card));crop('cityNight',0,0,660,182,1.06,.5,.43);rect(0,0,7,182,P.pink);g.restore();});
    alpha(ease((u-4.3)/.8),()=>{label('VICE CITY',1356,808);line(1356,838,1798,838,P.pink,3);text('城市只是故事的起点',1356,891,32,P.paper,500);});
  }
  function scene2(u){
    rect(0,0,W,H,P.ink);crop('lucia',650,0,1270,H,1.03+.05*clamp(u/7),.57,.42);
    grad(380,0,800,H,[[0,P.ink],[1,'#100d1b00']],true);vignette();alpha(.7,()=>polygon([[0,0],[635,0],[845,H],[0,H]],'#25152f'));
    chapter(3,'LUCIA CAMINOS',P.pink);alpha(.25,()=>latin('01',91,290,170,P.pink));
    enter('露西娅',96,427,128,P.paper,.3,u);alpha(ease((u-.7)/.8),()=>latin('LUCIA',103,577,139,P.pink));
    rule(104,638,460,(u-1)/.9,P.pink);enter('离开监狱',104,724,44,P.paper,1.5,u,600);
    enter('用更聪明的方式，改写命运。',104,806,34,P.paper,3.1,u,500);
    const p=ease((u-1)/1.1);linePath([[1780,215],[1780,150],[1650,150]],p,P.pink,4);linePath([[1050,720],[1050,795],[1170,795]],p,P.pink,4);
  }
  function scene3(u){
    rect(0,0,W,H,P.ink);crop('jason',550,0,1370,H,1.02+.04*clamp(u/7),.66,.45);
    grad(0,0,1430,H,[[0,'#0d1f25'],[.35,'#0d1f25ed'],[1,'#0d1f2500']],true);vignette();
    chapter(4,'JASON DUVAL',P.mint);alpha(.25,()=>latin('02',91,290,170,P.mint));
    enter('杰森',96,427,136,P.paper,.3,u);alpha(ease((u-.7)/.8),()=>latin('JASON',103,577,139,P.mint));
    rule(104,638,460,(u-1)/.9,P.mint);enter('军旅之后 · 群岛之间',104,725,43,P.paper,1.5,u,600);
    enter('生活，远没有那么简单。',104,806,34,P.paper,3.4,u,500);
    const p=ease((u-1.1)/1.1);linePath([[1740,180],[1800,180],[1800,280]],p,P.mint,4);linePath([[1060,740],[1060,800],[1150,800]],p,P.mint,4);
  }
  function scene4(u){
    const change=smooth((u-3.05)/.7);crop('vault',0,0,W,H,1.04+.018*u,.5,.45);
    alpha(change,()=>crop('couple',0,0,W,H,1.04+.02*clamp((u-3)/5),.5,.42));
    grad(0,0,W,H,[[0,'#100d1b44'],[.43,'#100d1b00'],[.64,'#100d1b66'],[1,'#100d1bfa']]);chapter(5,'TWO LIVES. ONE WAY OUT.',P.pink);
    const early=1-smooth((u-3)/.55);alpha(early,()=>{enter('看似轻松的行动',100,746,86,P.paper,.3,u);enter('意外失控。',100,865,100,P.pink,1.3,u);});
    alpha(change,()=>{const r=ease((u-3.5)/.7);linePath([[320,704],[640,704],[704,754],[1216,754],[1280,704],[1600,704]],r,P.pink,4);
      dot(320,704,8,P.pink);dot(1600,704,8,P.mint);label('LUCIA',252,670,P.pink);label('JASON',1530,670,P.mint);
      enter('只能相信彼此',960,878,100,P.paper,3.75,u,900,'center');});
  }
  function scene5(u){
    rect(0,0,W,H,P.ink);chapter(6,'BEYOND VICE CITY',P.mint);enter('远不止一座城市',96,251,88,P.paper,.25,u);
    const keys=['keys','grass','industry'],names=['热带群岛','荒野湿地','工业腹地'],en=['LEONIDA KEYS','GRASSRIVERS','AMBROSIA'];
    const p2=smooth((u-1.65)/.85),p3=smooth((u-3.15)/.85);
    const widths=[lerp(lerp(1728,852,p2),560,p3),852*p2-292*p3,560*p3];
    const xs=[96,96+widths[0]+24*p2,96+widths[0]+24*p2+widths[1]+24*p3];
    for(let i=0;i<3;i++){const a=ease((u-[.35,1.65,3.15][i])/.65),x=xs[i],w=widths[i],y=325;if(w<1)continue;
      alpha(a,()=>{g.save();g.translate(0,30*(1-a));rect(x,y,w,516,P.ink);g.beginPath();g.rect(x,y,w,516);g.clip();
        crop(keys[i],x,y,w,516,1.04+.04*clamp((u-i*1.9)/10),i===0?.66:.5,.5);
        grad(x,y,w,516,[[0,'#100d1b00'],[.5,'#100d1b00'],[1,'#100d1be6']]);rect(x,y,w,5,[P.mint,P.pink,P.coral][i]);
        if(w>360){label(`0${i+1}`,x+24,y+50,[P.mint,P.pink,P.coral][i]);heading(names[i],x+24,y+415,48,P.paper,800);text(en[i],x+26,y+470,24,P.paper,600);}g.restore();});}
    const r=ease((u-6.15)/1.1);linePath([[112,885],[1808,885]],r,P.mint,3);
    alpha(ease((u-6.65)/.7),()=>text('LEONIDA  /  每一条路，都通往另一种人生。',104,930,29,P.paper,500));
  }
  function scene6(u){
    const cuts=[0,1.1,2.2,3.5],k=u<1.1?0:u<2.2?1:u<3.5?2:3;const key=['atv','car','vault','roof'][k];
    crop(key,0,0,W,H,1.035+.035*(u-cuts[k]),k===3?.57:.5,.45);vignette();grad(0,0,W,H,[[0,'#140d2870'],[1,'#140d2860']],true);chapter(7,'THE OTHER SIDE OF PARADISE',P.pink);
    if(k<3){const local=u-cuts[k],words=['速度','欲望','选择'];g.save();g.translate(110,810+60*(1-ease(local/.4)));g.transform(1,0,-.12,1,0,0);
      alpha(ease(local/.3),()=>heading(words[k],0,0,188,P.paper));g.restore();rect(106,852,365*ease(local/.6),8,[P.mint,P.pink,P.coral][k]);latin(['SPEED','DESIRE','CHOICE'][k],104,926,50,[P.mint,P.pink,P.coral][k]);
    }else{grad(0,0,W,H,[[0,'#100d1bcc'],[.65,'#100d1b44'],[1,'#100d1b99']],true);enter('这一回',96,420,94,P.paper,3.5,u,700);enter('你相信谁？',96,585,142,P.pink,3.65,u);rule(105,656,635,(u-3.95)/.7,P.pink);}
    if(u-cuts[k]<.35&&k>0)slash((u-cuts[k])+.1,[P.mint,P.pink,P.coral][k-1]);
  }
  function scene7(u){
    rect(0,0,W,H,P.ink);crop('keyart',610,0,1310,H,1.015+.025*clamp(u/6),.49,.48);
    grad(420,0,700,H,[[0,P.ink],[1,'#100d1b00']],true);grad(0,0,W,H,[[0,'#100d1b00'],[.6,'#100d1b00'],[1,'#100d1bd9']]);
    alpha(ease((u-.1)/.75),()=>logo(125,140,530));enter('重返罪恶都市',126,673,62,P.paper,.6,u);rule(130,722,520,(u-1)/.7,P.pink);
    alpha(ease((u-1.15)/.65),()=>text('2026.11.19',128,806,78,P.pink,800));
    alpha(ease((u-1.6)/.65),()=>{text('PlayStation 5',130,867,30,P.paper,600);line(365,842,365,872,P.pink,2);text('Xbox Series X|S',395,867,30,P.paper,600);});
    alpha(ease((u-1.9)/.7),()=>text('非官方介绍概念片  ·  画面素材 © Rockstar Games',130,935,22,P.paper,400));
  }
  const scenes=[scene0,scene1,scene2,scene3,scene4,scene5,scene6,scene7];
  const starts=[0,6,14,21,28,36,46,54],ends=[6,14,21,28,36,46,54,60];
  function subtitles(t){const s=(cfg.subtitles||[]).find(s=>t>=s.start&&t<s.end);if(!s)return;g.save();g.font='500 35px StudioSans';const w=g.measureText(s.text).width;box((W-w)/2-26,953,w+52,55,'#080614c9',8);text(s.text,W/2,994,35,P.paper,500,'center');g.restore();}
  function seek(t){
    if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek outside timeline');d.reset(t);rect(0,0,W,H,P.ink);
    let k=starts.findIndex((s,i)=>t>=s&&t<ends[i]);if(k<0)k=7;const u=t-starts[k];
    if(k>0&&u<.48){scenes[k-1](ends[k-1]-starts[k-1]-.001);const edge=(W+430)*ease(u/.48)-430;
      g.save();polygon([[-1,0],[edge+320,0],[edge,H],[-1,H]]);g.clip();scenes[k](u);g.restore();polygon([[edge+320,0],[edge+342,0],[edge+22,H],[edge,H]],k%2?P.pink:P.mint);
    }else scenes[k](u);
    subtitles(t);footer(t);return true;
  }
  return {seek,inspect:d.inspect,layoutCoverage:d.layoutCoverage+'; decorative Latin outlines and transition masks manually reviewed'};
}
