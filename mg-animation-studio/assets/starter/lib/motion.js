export const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b,v));
export const lerp = (a,b,p) => a+(b-a)*p;
export const ease = p => {p=clamp(p);return p*p*(3-2*p);};
export const out = p => 1-(1-clamp(p))**3;
export const range = (t,a,b) => clamp((t-a)/(b-a));
// Unit-mass analytic step response: handles under, critical AND overdamping.
export function spring(t,k=180,c=26) {
  if(t<=0)return 0;
  if(!(k>0&&c>0))throw Error('Spring stiffness/damping must be positive');
  const w=Math.sqrt(k),z=c/(2*w);
  if(Math.abs(z-1)<1e-5)return 1-(1+w*t)*Math.exp(-w*t);
  if(z<1){const d=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*t)*(Math.cos(d*t)+z*w/d*Math.sin(d*t));}
  const r1=-w*(z-Math.sqrt(z*z-1)),r2=-w*(z+Math.sqrt(z*z-1));
  return 1+(r2*Math.exp(r1*t)-r1*Math.exp(r2*t))/(r1-r2);
}
export function track(t,keys,k=180,c=26){
  let v=keys[0][1];
  for(let i=1;i<keys.length;i++)v+=(keys[i][1]-keys[i-1][1])*spring(t-keys[i][0],k,c);
  return v;
}
// Indexed noise has no mutable PRNG state; scrubbing in any order is identical.
export function noise(i,seed=42){
  let x=Math.imul(i+seed,0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);
  return ((x^(x>>>16))>>>0)/4294967296;
}

// ---- Named easing vocabulary (each has a personality; pick one per film as its motion signature) ----
// cubicBezier(x1,y1,x2,y2) returns p->value, same curves as CSS / After Effects speed graphs.
export function cubicBezier(x1,y1,x2,y2){
  const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
  const X=t=>((ax*t+bx)*t+cx)*t,Y=t=>((ay*t+by)*t+cy)*t,dX=t=>(3*ax*t+2*bx)*t+cx;
  return p=>{
    p=clamp(p);if(p===0||p===1)return p;
    let t=p;for(let i=0;i<8;i++){const e=X(t)-p,d=dX(t);if(Math.abs(e)<1e-6)break;if(Math.abs(d)<1e-6)break;t-=e/d;}
    let lo=0,hi=1;if(Math.abs(X(t)-p)>1e-5){t=p;for(let i=0;i<30;i++){X(t)<p?lo=t:hi=t;t=(lo+hi)/2;}}
    return Y(t);
  };
}
export const easings={
  linear:p=>clamp(p),
  // Calm, editorial: long decelerating tail. Good default for type and camera.
  quartOut:p=>1-(1-clamp(p))**4,
  // Confident, premium (product / keynote feel): very fast start, very long settle.
  expoOut:p=>{p=clamp(p);return p===1?1:1-2**(-10*p);},
  expoInOut:p=>{p=clamp(p);if(p===0||p===1)return p;return p<.5?2**(20*p-10)/2:(2-2**(-20*p+10))/2;},
  // Snappy UI / kinetic type: slight overshoot without a visible wobble.
  backOut:(p,s=1.4)=>{p=clamp(p)-1;return 1+p*p*((s+1)*p+s);},
  // Cinematic camera move: gentle in, gentle out.
  sineInOut:p=>-(Math.cos(Math.PI*clamp(p))-1)/2,
  // Motion-design "smooth" (AE 'Easy Ease' with stronger influence).
  smooth:cubicBezier(.65,0,.35,1),
  // Anticipation: dips below 0 before going; use for a deliberate wind-up.
  anticipate:cubicBezier(.36,-0.35,.6,1),
};
// Animate a value between keys [[t,value,easingName?],...]; easing applies to the segment ending at that key.
export function keys(t,list){
  if(t<=list[0][0])return list[0][1];
  for(let i=1;i<list.length;i++){
    const [t1,v1,e]=list[i],[t0,v0]=list[i-1];
    if(t<=t1){const f=easings[e||'smooth']||easings.smooth;return lerp(v0,v1,f((t-t0)/(t1-t0)));}
  }
  return list[list.length-1][1];
}
// Offset start times so a group reads as one gesture, not N simultaneous fades.
export const stagger=(t,index,{start=0,each=.06,dur=.6,easing='expoOut'}={})=>(easings[easing]||easings.expoOut)(range(t,start+index*each,start+index*each+dur));
