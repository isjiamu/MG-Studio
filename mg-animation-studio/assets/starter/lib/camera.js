// 2.5D camera for Canvas renderers. One world, one camera: shots are framings of a persistent
// space rather than separate slides. Depth gives parallax (and optional depth-of-field blur).
//
//   const cam = camera(t, [[0,{x:960,y:540,zoom:1}], [4,{x:1200,y:500,zoom:1.6},'expoInOut']]);
//   layer(g, W, H, cam, 2,   () => drawSky());      // far: moves less
//   layer(g, W, H, cam, 0,   () => drawSubject());  // focus plane: moves exactly with the camera
//   layer(g, W, H, cam, -.4, () => drawForeground());// near: moves more, can frame the shot
//   screen-space text/captions are drawn AFTER, outside any layer, so they stay readable.
import {easings,lerp,clamp} from './motion.js';

// keys: [[time, {x,y,zoom,rot,focus}, easingName?], ...]  (easing applies to the segment ending at the key)
export function camera(t,keys){
  const pick=(k)=>({x:k.x??0,y:k.y??0,zoom:k.zoom??1,rot:k.rot??0,focus:k.focus??0});
  if(t<=keys[0][0])return pick(keys[0][1]);
  for(let i=1;i<keys.length;i++){
    const [t1,b,e]=keys[i],[t0,a]=keys[i-1];
    if(t<=t1){
      const f=(easings[e||'smooth']||easings.smooth)(clamp((t-t0)/(t1-t0))),A=pick(a),B=pick(b);
      // Zoom interpolates geometrically so push-ins feel constant-speed to the eye.
      return {x:lerp(A.x,B.x,f),y:lerp(A.y,B.y,f),zoom:A.zoom*Math.pow(B.zoom/A.zoom,f),rot:lerp(A.rot,B.rot,f),focus:lerp(A.focus,B.focus,f)};
    }
  }
  return pick(keys[keys.length-1][1]);
}

// depth: 0 = focus plane, >0 farther (moves less), <0 nearer (moves more, > -1).
// dof: blur in px per unit of |depth - cam.focus|; 0 disables (blur is costly on large layers).
export function layer(g,W,H,cam,depth,fn,{dof=0,maxBlur=14}={}){
  if(depth<=-1)throw Error('layer depth must be > -1');
  const p=1/(1+depth),zoom=1+(cam.zoom-1)*p;
  g.save();
  try{
    g.translate(W/2,H/2);g.rotate(cam.rot*p);g.scale(zoom,zoom);g.translate(-W/2-(cam.x-W/2)*p,-H/2-(cam.y-H/2)*p);
    const blur=dof?Math.min(maxBlur,Math.abs(depth-cam.focus)*dof):0;
    if(blur>.3)g.filter=`blur(${blur.toFixed(2)}px)`;
    fn(p);
  }finally{g.restore();}
}

// World -> screen position of a point on a given depth plane (to pin screen-space labels to world objects).
export function project(W,H,cam,depth,x,y){
  const p=1/(1+depth),zoom=1+(cam.zoom-1)*p;
  let dx=(x-W/2-(cam.x-W/2)*p)*zoom,dy=(y-H/2-(cam.y-H/2)*p)*zoom;
  const r=cam.rot*p,c=Math.cos(r),s=Math.sin(r);
  return {x:W/2+dx*c-dy*s,y:H/2+dx*s+dy*c,scale:zoom};
}
