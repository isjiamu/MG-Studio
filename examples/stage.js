import {makeDraw} from '../lib/draw.js';
import {clamp, ease, range} from '../lib/motion.js';
import {loadLayers} from '../lib/layers.js';

export const W=1280;
export const H=720;
export const fade=(t,from,to)=>ease(range(t,from,to));

export function makeStage(canvas) {
  const d=makeDraw(canvas,{height:H});
  const {g,line,box,dot}=d;
  function path(points,fill,stroke,width=1) {
    g.beginPath();
    points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
    g.closePath();
    if(fill){g.fillStyle=fill;g.fill();}
    if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}
  }
  function ellipse(x,y,rx,ry,fill) {
    g.beginPath();g.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);
    g.fillStyle=fill;g.fill();
  }
  function round(x,y,w,h,c,border,r=16) {
    g.beginPath();g.roundRect(x,y,w,h,r);
    g.fillStyle=c;g.fill();
    if(border){g.strokeStyle=border;g.lineWidth=1;g.stroke();}
  }
  function arrow(x1,y1,x2,y2,color,width=3,tip=10) {
    const angle=Math.atan2(y2-y1,x2-x1);
    line(x1,y1,x2,y2,color,width);
    path([[x2,y2],[x2-tip*Math.cos(angle-.50),y2-tip*Math.sin(angle-.50)],[x2-tip*Math.cos(angle+.50),y2-tip*Math.sin(angle+.50)]],color);
  }
  function linear(x1,y1,x2,y2,stops) {
    const paint=g.createLinearGradient(x1,y1,x2,y2);
    stops.forEach(([p,color])=>paint.addColorStop(p,color));
    return paint;
  }
  function radial(x,y,r,stops) {
    const paint=g.createRadialGradient(x,y,0,x,y,r);
    stops.forEach(([p,color])=>paint.addColorStop(p,color));
    return paint;
  }
  function arc(x,y,r,theta1,theta2,c,width=1){
    g.beginPath();g.arc(x,y,r,theta1,theta2);
    g.strokeStyle=c;g.lineWidth=width;g.stroke();
  }
  function progress(x,y,w,t,end,color,base) {
    box(x,y,w,3,base,1.5);
    if(t>0)box(x,y,w*clamp(t/end),3,color,1.5);
  }
  function glowDot(x,y,r,color) {
    g.save();g.globalAlpha=.22;dot(x,y,r*1.85,color);g.restore();dot(x,y,r,color);
  }
  return {...d,path,ellipse,round,arrow,linear,radial,arc,progress,glowDot};
}

export async function compose(canvas,cfg,scene) {
  const d=makeStage(canvas);
  const render=scene(d,cfg,await loadLayers(cfg.layers));
  function seek(t){
    if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek outside timeline');
    d.reset(t);render(t);return true;
  }
  return {seek,inspect:d.inspect,layoutCoverage:d.layoutCoverage};
}
