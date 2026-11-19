import {compose, fade, W, H} from './stage.js';
import {paintLayer} from '../lib/layers.js';
import {sampleKeyframes} from '../lib/handdrawn.js';
import {lerp} from '../lib/motion.js';

const title='#fff0ce', rust='#ac513e';
const trip=[
  {t:0,x:262,y:438,r:.035},
  {t:4.5,x:262,y:435,r:.035},
  {t:8.0,x:338,y:441,r:-.035},
  {t:11.15,x:496,y:447,r:.08},
  {t:15.1,x:676,y:469,r:-.10},
  {t:18.2,x:807,y:420,r:.11},
  {t:22.6,x:982,y:438,r:0},
  {t:30,x:982,y:438,r:0},
];
const envelope=[[-89,-39],[82,-42],[84,52],[-91,58]];
const hull=[[-93,-4],[95,-2],[60,48],[-48,49]];

function collage(d,cfg,layers){
  const {g,text,line,dot,box,path,ellipse,linear,radial}=d;
  const interpolate=(a,b,q)=>a.map(([x,y],i)=>[lerp(x,b[i][0],q),lerp(y,b[i][1],q)]);
  function shape(t){
    const fold=fade(t,4.58,7.82);
    const ship=sampleKeyframes(t,trip,['x','y']);
    const bob=Math.sin(t*1.77)*6*fold*(1-fade(t,21.8,22.6));
    const x=ship.x,y=ship.y+bob;
    g.save();g.translate(x,y);g.rotate(ship.r+bob*.010);
    const outline=interpolate(envelope,hull,fold);
    const body=linear(-70,-42,70,51,[[0,'#faebbf'],[.55,'#f0d6a4'],[1,'#d6b184']]);
    g.save();g.shadowColor='#14272e68';g.shadowBlur=11;g.shadowOffsetY=6;
    path(outline,body,'#f3d5a2',1.1);g.restore();
    path([
      [lerp(-87,-92,fold),lerp(-38,-2,fold)],
      [lerp(-3,2,fold),lerp(17,26,fold)],
      [lerp(81,93,fold),lerp(-40,-1,fold)],
    ],fold<.55?'#cba47b3e':'#c48d5f77');
    line(lerp(-86,-91,fold),lerp(-37,-3,fold),2,lerp(17,26,fold),'#b98961',1.4);
    line(2,lerp(17,26,fold),lerp(81,93,fold),lerp(-39,-2,fold),'#bd9268',1.4);
    const tail=fade(t,5.25,7.55);
    if(tail>0){
      const tipY=lerp(-8,-49,tail);
      g.globalAlpha=tail;
      path([[-83,-2],[-16,tipY],[88,0],[2,27]],'#ffebba','#edcfa1',.8);
      path([[-16,tipY],[88,0],[2,27]],'#c36c53');
      path([[-16,tipY],[-8,15],[2,27]],'#d8ab74');
      g.globalAlpha=1;
    }
    g.globalAlpha=1-tail;
    dot(-1,16,10,rust);
    ellipse(-3,14,3.0,2.5,'#dfa179');
    line(-59,34,-28,33,'#b89169',1.3);line(-59,43,-40,43,'#b89169',1.3);
    g.globalAlpha=1;
    if(fold>.08){
      g.globalAlpha=fold;
      line(-47,43,58,41,'#d3a677',1.05);
      g.globalAlpha=1;
    }
    g.save();
    path(outline,'rgba(0,0,0,0)');
    g.clip();
    paintLayer(g,layers.grain,-96,-53,193,110,.75);
    g.restore();
    g.restore();
  }
  return t=>{
    const beacon=fade(t,23.65,24.89);
    paintLayer(g,layers.sky,0,0,W,H);
    paintLayer(g,layers.far,-86+Math.sin(t*.36)*18,347,1440,350);
    paintLayer(g,layers.middle,-83-Math.sin(t*.60)*25,405,1440,350);
    paintLayer(g,layers.shore,0,419,350,240);
    if(beacon){
      const beam=linear(1039,297,617,359,[[0,'#ffe1a4ad'],[.28,'#ffeabf58'],[1,'#ffeabf00']]);
      g.globalAlpha=beacon;
      path([[1042,300],[640,303],[582,423],[1042,314]],beam);
      g.globalAlpha=1;
    }
    paintLayer(g,layers.rock,886,237,304,288);
    if(beacon){
      g.globalAlpha=beacon;
      ellipse(1043,305,110,110,radial(1043,305,110,[[0,'#fff1b8b8'],[1,'#fff2bb00']]));
      box(1028,295,30,19,'#fff3b8',2);
      g.globalAlpha=1;
    }
    if(t>8&&t<22.6){
      const p=sampleKeyframes(t,trip,['x','y']);
      const wash=fade(t,8,10.4)*(1-fade(t,20.1,22.6));
      g.globalAlpha=wash*.65;
      for(let k=0;k<3;k++){
        g.beginPath();g.moveTo(p.x-65-k*17,p.y+47+k*3);
        g.quadraticCurveTo(p.x-97-k*19,p.y+35+k*4,p.x-127-k*24,p.y+50+k*5);
        g.strokeStyle='#b8d3b6';g.lineWidth=1.8-k*.35;g.stroke();
      }
      g.globalAlpha=1;
    }
    shape(t);
    const crest=22*fade(t,12,14.5)*(1-fade(t,16.1,18.2));
    const frontY=471+Math.sin(t*.82)*12-crest;
    paintLayer(g,layers.front,-80+Math.sin(t*.74)*22,frontY,1440,350);
    if(beacon){
      g.globalAlpha=beacon*.7;
      for(let i=0;i<9;i++){
        const offset=Math.sin(i*2+t*1.2)*8;
        const y=527+i*10;
        const span=11+3*i;
        line(1045+offset-span,y,1045+offset+span,y,i<3?'#ffe5aa':'#c4b580',2.15-i*.10);
      }
      g.globalAlpha=1;
    }
    // Keep the title readable in the foreground while the boat stays in physical space.
    const opening=1-fade(t,7.1,8.4);
    if(opening){
      g.globalAlpha=opening;
      text('一封信过海',72,155,83,title,830);
      line(78,189,205,189,'#eeae7e',2);
      g.globalAlpha=1;
    }
    const end=fade(t,24.3,25.65);
    if(end){
      g.globalAlpha=end;
      text('一封信过海',72,155,76,title,830);
      text('信到了，灯也亮了。',77,211,23,'#f9d3a3',590);
      g.globalAlpha=1;
    }
  };
}

export async function createFilm(canvas,cfg) {
  return compose(canvas,cfg,collage);
}
