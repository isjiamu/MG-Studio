// Look & light toolkit for Canvas renderers. Every function is deterministic: it depends only on
// its arguments (including t), never on wall-clock time or Math.random, so seek(t) stays exact.
// These are finishing tools. They make a composed frame look finished; they cannot fix a frame with no idea.
import {noise} from './motion.js';

const cache=new Map();
function offscreen(key,w,h){
  let c=cache.get(key);
  if(!c||c.width!==w||c.height!==h){c=document.createElement('canvas');c.width=w;c.height=h;cache.set(key,c);}
  return c;
}
function device(g,fn){g.save();g.setTransform(1,0,0,1,0,0);try{fn(g.canvas.width,g.canvas.height);}finally{g.restore();}}

// Film grain. Changes pattern `fps` times per second (24 reads as film, 12 as print/stop-motion).
// amount 0.03-0.08 for most work; dark scenes need less than light ones.
export function grain(g,t,{amount=.05,fps=24,seed=7,blend='overlay',size=1}={}){
  const frames=6,tile=256;
  const idx=Math.floor(t*fps)%frames;
  const key=`grain:${seed}:${idx}:${size}`;
  let c=cache.get(key);
  if(!c){
    c=document.createElement('canvas');c.width=c.height=tile;const p=c.getContext('2d');const im=p.createImageData(tile,tile);
    for(let i=0;i<tile*tile;i++){const v=Math.round(noise(i+idx*tile*tile,seed)*255);im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v;im.data[i*4+3]=255;}
    p.putImageData(im,0,0);cache.set(key,c);
  }
  device(g,(w,h)=>{
    g.globalAlpha=amount;g.globalCompositeOperation=blend;
    const pat=g.createPattern(c,'repeat');const ox=Math.floor(noise(idx,seed+3)*tile),oy=Math.floor(noise(idx,seed+5)*tile);
    g.translate(-ox,-oy);g.scale(size,size);g.fillStyle=pat;g.fillRect(0,0,(w+tile*2)/size,(h+tile*2)/size);
  });
}

// Radial vignette that pulls the eye to the focal area (cx, cy in 0..1 of the frame).
export function vignette(g,{strength=.45,inner=.45,cx=.5,cy=.5,color='0,0,0'}={}){
  device(g,(w,h)=>{
    const r=Math.hypot(w,h)/2,gr=g.createRadialGradient(w*cx,h*cy,r*inner,w*cx,h*cy,r*1.05);
    gr.addColorStop(0,`rgba(${color},0)`);gr.addColorStop(1,`rgba(${color},${strength})`);
    g.fillStyle=gr;g.fillRect(0,0,w,h);
  });
}

// Bloom: bright areas bleed light. Apply after the scene, before grain.
// threshold 0..1 (luminance kept), radius in output px, strength = screen opacity.
export function bloom(g,{radius=28,strength=.55,threshold=.6}={}){
  device(g,(w,h)=>{
    const sc=.25,sw=Math.ceil(w*sc),sh=Math.ceil(h*sc);
    const a=offscreen('bloomA',sw,sh),pa=a.getContext('2d',{willReadFrequently:true});
    pa.setTransform(1,0,0,1,0,0);pa.globalCompositeOperation='copy';pa.filter='none';pa.drawImage(g.canvas,0,0,sw,sh);
    const im=pa.getImageData(0,0,sw,sh),d=im.data;
    for(let i=0;i<d.length;i+=4){const l=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255,k=Math.max(0,(l-threshold)/(1-threshold));d[i]*=k;d[i+1]*=k;d[i+2]*=k;}
    pa.putImageData(im,0,0);
    const b=offscreen('bloomB',sw,sh),pb=b.getContext('2d');
    pb.setTransform(1,0,0,1,0,0);pb.globalCompositeOperation='copy';pb.filter=`blur(${Math.max(.5,radius*sc)}px)`;pb.drawImage(a,0,0);pb.filter='none';
    g.globalCompositeOperation='screen';g.globalAlpha=strength;g.imageSmoothingQuality='high';g.drawImage(b,0,0,w,h);g.drawImage(b,0,0,w,h);
  });
}

// Draw with light: additive blending so overlapping light brightens instead of covering.
// Use for glows, beams, emission, aurora, neon, sparks. Never represent light with an opaque rectangle.
export function additive(g,fn){g.save();g.globalCompositeOperation='lighter';try{fn();}finally{g.restore();}}

// Soft glow around whatever fn draws (text, strokes, shapes).
export function glow(g,fn,{color='#ffffff',blur=24,passes=2}={}){
  g.save();g.shadowColor=color;g.shadowBlur=blur;
  for(let i=0;i<passes;i++)fn(i);
  g.restore();
}

// Contact shadow: grounds an object on a surface. Elliptical, darkest at the contact point.
export function softShadow(g,x,y,rx,ry,{opacity=.35,color='0,0,0'}={}){
  g.save();g.translate(x,y);g.scale(1,ry/rx);
  const gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,`rgba(${color},${opacity})`);gr.addColorStop(.6,`rgba(${color},${opacity*.35})`);gr.addColorStop(1,`rgba(${color},0)`);
  g.fillStyle=gr;g.beginPath();g.arc(0,0,rx,0,Math.PI*2);g.fill();g.restore();
}

// Luminous curtain / volumetric rays: many soft vertical strands with drifting intensity.
// x,y,w,h = extent of the emitting band in the current (logical) coordinates.
// colors = top->bottom gradient stops (use alpha 0 at the ends for soft falloff).
// Strands are drawn additively at low resolution, then softened with one blur: light, not bars.
export function curtain(g,t,x,y,w,h,{colors=['rgba(80,255,170,0)','rgba(80,255,170,.9)','rgba(80,255,170,0)'],strands=90,seed=11,sway=18,speed=.25,width=[4,18],fold=0,soften=10,intensity=1}={}){
  const tr=g.getTransform(),sc=.35,pad=soften*3+sway+Math.abs(fold);
  const ow=Math.ceil((w+pad*2)*sc),oh=Math.ceil((h+pad*2)*sc);
  const c=offscreen(`curtain:${seed}`,ow,oh),p=c.getContext('2d');
  p.setTransform(1,0,0,1,0,0);p.clearRect(0,0,ow,oh);p.globalCompositeOperation='lighter';
  p.setTransform(sc,0,0,sc,pad*sc,pad*sc);
  const gr=p.createLinearGradient(0,0,0,h);colors.forEach((col,j)=>gr.addColorStop(j/(colors.length-1),col));p.fillStyle=gr;
  for(let i=0;i<strands;i++){
    const u=noise(i,seed),v=noise(i,seed+1),wv=noise(i,seed+2);
    const fx=u*w+Math.sin(t*speed*6.283+v*6.283)*sway+Math.sin(u*9+t*speed*2)*fold;
    const sw=width[0]+(width[1]-width[0])*wv,k=.35+.65*(.5+.5*Math.sin(t*speed*4+i*1.7));
    const top=h*noise(i,seed+3)*.22,bot=h*(.78+noise(i,seed+4)*.22);
    p.globalAlpha=Math.min(1,k*.34*intensity);p.fillRect(fx-sw/2,top,sw,bot-top);
  }
  p.globalAlpha=1;
  g.save();g.globalCompositeOperation='lighter';g.filter=`blur(${(soften*Math.hypot(tr.a,tr.b)).toFixed(2)}px)`;
  g.drawImage(c,x-pad,y-pad,w+pad*2,h+pad*2);g.filter='none';g.globalAlpha=.6;g.drawImage(c,x-pad,y-pad,w+pad*2,h+pad*2);g.restore();
}

// Duotone / gradient map over the whole frame: unifies mismatched photos into one palette.
// stops: [[0,'#0b1a2a'],[1,'#f2e6c9']] (luminance -> color). Costs one pixel pass per frame.
export function duotone(g,stops,{mix=1}={}){
  const lut=new Uint8ClampedArray(256*3),hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  const cs=stops.map(([p,c])=>[p,hex(c)]);
  for(let i=0;i<256;i++){const p=i/255;let k=0;while(k<cs.length-2&&p>cs[k+1][0])k++;
    const [p0,c0]=cs[k],[p1,c1]=cs[k+1],f=Math.min(1,Math.max(0,(p-p0)/(p1-p0||1)));
    for(let j=0;j<3;j++)lut[i*3+j]=c0[j]+(c1[j]-c0[j])*f;}
  device(g,(w,h)=>{
    const im=g.getImageData(0,0,w,h),d=im.data;
    for(let i=0;i<d.length;i+=4){const l=Math.round(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)*3;
      d[i]+=(lut[l]-d[i])*mix;d[i+1]+=(lut[l+1]-d[i+1])*mix;d[i+2]+=(lut[l+2]-d[i+2])*mix;}
    g.putImageData(im,0,0);
  });
}

// Halftone dot screen built from the current frame's luminance (print / risograph looks).
export function halftone(g,{cell=9,angle=.26,ink='#1b1b1b',paper=null,mix=1}={}){
  device(g,(w,h)=>{
    const src=g.getImageData(0,0,w,h).data;
    if(paper){g.fillStyle=paper;g.globalAlpha=mix;g.fillRect(0,0,w,h);}
    g.globalAlpha=mix;g.fillStyle=ink;const ca=Math.cos(angle),sa=Math.sin(angle),R=Math.hypot(w,h);
    for(let u=-R;u<R;u+=cell)for(let v=-R;v<R;v+=cell){
      const x=w/2+u*ca-v*sa,y=h/2+u*sa+v*ca;if(x<0||y<0||x>=w||y>=h)continue;
      const i=(Math.floor(y)*w+Math.floor(x))*4,l=(src[i]*.2126+src[i+1]*.7152+src[i+2]*.0722)/255;
      const r=cell*.5*Math.sqrt(1-l)*1.15;if(r<.3)continue;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
    }
  });
}
