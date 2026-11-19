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
