import {seeded} from './draw.js';
import {lerp,clamp} from './motion.js';
export function createPencil(g){
  // Material is attached to the local object, rather than drifting over the screen.
  const tile=document.createElement('canvas');tile.width=tile.height=96;
  const tg=tile.getContext('2d');
  for(let i=0;i<750;i++){
    const x=seeded(i+17)*96,y=seeded(i+37)*96;
    tg.fillStyle=i%4?'#7d604517':'#fff8df55';
    tg.fillRect(x,y,.45+seeded(i+3)*1.3,.5+seeded(i+9)*1.1);
  }
  const grain=g.createPattern(tile,'repeat');
  function pointsOf(points,t,id,closed,jitter){
    const out=[],phase=Math.floor(t*6),n=closed?points.length:points.length-1;
    for(let i=0;i<n;i++){
      const a=points[i],b=points[(i+1)%points.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(2,Math.ceil(len/9));
      for(let j=0;j<steps;j++){
        const u=j/steps,k=i*101+j,edge=Math.sin(u*Math.PI);
        const drift=(seeded(id+k*7+phase*13)-.5)*jitter+Math.sin(k*.6+id)*.65;
        out.push([lerp(a[0],b[0],u)-(b[1]-a[1])/(len||1)*drift*edge,lerp(a[1],b[1],u)+(b[0]-a[0])/(len||1)*drift*edge]);
      }
    }
    out.push(closed?out[0]:points.at(-1));return out;
  }
  function stroke(points,t,id,{closed=false,fill=null,color='#344c59',width=1.8,jitter=1.8,opacity=1}={}){
    const pts=pointsOf(points,t,id,closed,jitter);g.save();g.globalAlpha*=opacity;g.lineJoin='round';g.lineCap='round';
    g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(closed)g.closePath();
    if(fill){g.fillStyle=fill;g.fill();g.fillStyle=grain;g.fill();}
    // Independent low-opacity second tracing, plus slow pressure variation.
    for(let pass=0;pass<2;pass++){
      g.strokeStyle=color;g.globalAlpha*=pass===0?.9:.29;
      for(let k=1;k<pts.length;k++){
        const a=pts[k-1],b=pts[k],shift=pass?1.05:0;
        g.lineWidth=width*(.63+.30*Math.sin(k*.19+id)**2)*(pass? .7:1);
        g.beginPath();g.moveTo(a[0]+shift,a[1]-.45*shift);g.lineTo(b[0]+shift,b[1]-.45*shift);g.stroke();
      }
    }g.restore();
  }
  function hatch(points,t,id,color='#576574',spacing=9){
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),lo=Math.min(...xs),hi=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    g.save();g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();
    for(let x=lo-(bottom-top);x<hi;x+=spacing)stroke([[x,bottom],[x+bottom-top,top]],t,id+x,{color,width:.8,opacity:.25,jitter:1});
    g.restore();
  }
  function oval(x,y,rx,ry,t,p=1,color='#bf654c',id=5){
    const pts=[];for(let i=0;i<=Math.floor(clamp(p)*90);i++){const a=i/90*Math.PI*2-.25;pts.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry]);}
    if(pts.length>1)stroke(pts,t,id,{color,width:2.4,jitter:1});
  }
  return {stroke,hatch,oval};
}
export function sampleKeyframes(t,keys,flow=['x','y','z']){
  if(t<=keys[0].t)return {...keys[0]};
  if(t>=keys.at(-1).t)return {...keys.at(-1)};
  const i=keys.findIndex((a,j)=>j<keys.length-1&&t>=a.t&&t<keys[j+1].t);
  const a=keys[i],b=keys[i+1],h=b.t-a.t,u=(t-a.t)/h,v={t};
  const slope=(j,k)=>(keys[j+1][k]-keys[j][k])/(keys[j+1].t-keys[j].t);
  const tangent=(j,k)=>{
    if(j===0||j===keys.length-1)return 0;
    const s0=slope(j-1,k),s1=slope(j,k);
    if(s0*s1<=0)return 0; // Holds and direction changes keep their exact extrema.
    const h0=keys[j].t-keys[j-1].t,h1=keys[j+1].t-keys[j].t;
    const w0=2*h1+h0,w1=h1+2*h0;return (w0+w1)/(w0/s0+w1/s1);
  };
  for(const k of Object.keys(a))if(k!=='t'){
    if(flow.includes(k)){
      v[k]=(2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*h*tangent(i,k)
        +(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*h*tangent(i+1,k);
    }else v[k]=lerp(a[k],b[k],u*u*(3-2*u));
  }
  return v;
}
export function createPrintSurface(g,seed=42){
  const c=document.createElement('canvas');c.width=c.height=1080;
  const p=c.getContext('2d');
  for(let i=0;i<30;i++){
    const x=seeded(i+seed)*1080,y=seeded(i+11)*1080,r=110+seeded(i+61)*180;
    const wash=p.createRadialGradient(x,y,0,x,y,r);
    wash.addColorStop(0,i%2?'#a8b7bd0c':'#13234213');wash.addColorStop(1,'#00000000');
    p.fillStyle=wash;p.fillRect(x-r,y-r,r*2,r*2);
  }
  // A fixed, low-contrast ink screen. Density varies spatially, never every frame.
  for(let y=3;y<1080;y+=7)for(let x=3;x<1080;x+=7){
    const d=Math.hypot((x-170)/1050,(y-780)/750),a=Math.max(0,1-d)*.13;
    if(a<=0)continue;
    p.fillStyle=`rgba(230,215,182,${a})`;p.beginPath();
    p.arc(x+(Math.floor(y/7)%2)*3,y,.6+seeded(x+y+seed)*.65,0,Math.PI*2);p.fill();
  }
  return c;
}
export function createPaperSurface(g,seed=42){
  const c=document.createElement('canvas');c.width=1080;c.height=1080;const p=c.getContext('2d',{willReadFrequently:true});
  const im=p.createImageData(1080,1080),hash=(x,y)=>seeded(x*71+y*127+seed);
  for(let y=0;y<1080;y++)for(let x=0;x<1080;x++){
    const i=(y*1080+x)*4,grain=seeded(i+seed),gx=x/58,gy=y/58,fx=gx%1,fy=gy%1,ix=Math.floor(gx),iy=Math.floor(gy);
    const cloud=lerp(lerp(hash(ix,iy),hash(ix+1,iy),fx),lerp(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy);
    const light=grain>.5;im.data[i]=light?255:27;im.data[i+1]=light?247:40;im.data[i+2]=light?220:48;
    im.data[i+3]=Math.round(2+grain*7+cloud*3);
  }
  p.putImageData(im,0,0);
  for(let i=0;i<1500;i++){
    const x=seeded(i*2+seed)*1080,y=seeded(i*3+400)*1080;
    p.strokeStyle=i%3?'#2033420a':'#fff4d522';p.lineWidth=.55+seeded(i)*.8;p.beginPath();p.moveTo(x,y);p.quadraticCurveTo(x+4,y+2,x+5+seeded(i+1)*14,y+seeded(i+8)*6);p.stroke();
  }
  return c;
}
export function birdAnchor(p,part='beak'){
  let x=0,y=0;
  if(part==='beak'){
    const a=p.head||0,f=p.face??1;
    x=lerp(-12,20,(f+1)/2)+f*(67*Math.cos(a)+7*Math.sin(a));y=-24+67*Math.sin(a)-7*Math.cos(a);
  }else if(part==='foot'){x=36;y=82;}
  else if(part==='otherFoot'){x=-34;y=82;}
  const sx=p.sx||1,sy=p.sy||1,rot=p.rot||0;
  x*=p.s*sx;y*=p.s*sy;
  return {x:p.x+x*Math.cos(rot)-y*Math.sin(rot),y:p.y+x*Math.sin(rot)+y*Math.cos(rot)};
}
export function drawPaperBird(d,pen,p,t){
  const {g,dot}=d,{stroke,hatch}=pen,ink='#344c59',paper='#f2e4c7',red='#bf654c';
  g.save();g.translate(p.x,p.y);g.rotate(p.rot||0);g.scale(p.s*(p.sx||1),p.s*(p.sy||1));
  // The far wing gives an upstroke a readable silhouette before the body covers it.
  g.save();g.translate(-22,-4);g.rotate(-(p.wing||0)*.74-.12);g.scale(1,.35+.65*Math.min(1,Math.abs(p.wing||0)*1.1));
  stroke([[-38,15],[-30,-41],[1,-81],[18,-26],[12,20]],t,31,{closed:true,fill:'#cbb694',width:1.7,opacity:.9});
  stroke([[-30,8],[-3,-68],[9,-13]],t,33,{color:'#8e7b64',width:1});g.restore();
  // Tail reacts after the body; two folds retain the paper construction.
  g.save();g.translate(-62,26);g.rotate((p.tail||0)*.25);
  stroke([[0,0],[-66,-32],[-41,30],[6,14]],t,41,{closed:true,fill:red,color:red,width:2});
  stroke([[-62,-28],[-23,16],[2,5]],t,42,{color:'#e6a083',width:1.2});g.restore();
  const body=[[-76,4],[-42,-38],[-4,-55],[37,-36],[64,7],[40,54],[-10,63],[-66,33]];
  stroke(body,t,51,{closed:true,fill:paper,width:2.6,jitter:2});
  hatch([[-65,28],[-10,61],[40,52],[28,29]],t,67,ink,7);
  stroke([[-62,30],[-4,-44],[30,39]],t,57,{color:'#907d67',width:1.1});
  // Feet retract during flight, extend before contact, and remain on the support.
  const tuck=p.tuck||0;
  stroke([[-13,57],[-19+22*tuck,82-29*tuck],[-34+39*tuck,82-24*tuck]],t,71,{width:2.2});
  stroke([[17,55],[20-13*tuck,82-26*tuck],[36-23*tuck,82-26*tuck]],t,72,{width:2.2});
  g.save();g.translate(-10,8);g.rotate((p.wing||0)-.1);
  const wing=[[-45,19],[-12,-20],[5,-62],[31,-24],[44,31],[3,47]];
  stroke(wing,t,80,{closed:true,fill:'#d9c5a0',width:2.3});
  hatch(wing,t,88,ink,8);stroke([[-40,19],[4,-54],[6,42]],t,89,{color:'#938164',width:1.2});g.restore();
  // Head is articulated independently so attention precedes travel.
  const face=p.face??1;
  g.save();g.translate(lerp(-12,20,(face+1)/2),-24);g.scale(face,1);g.rotate(p.head||0);
  stroke([[-6,12],[5,-22],[32,-33],[50,-8],[43,18],[17,28]],t,100,{closed:true,fill:paper,width:2.2});
  stroke([[45,-13],[67,-7],[46,0]],t,104,{closed:true,fill:red,color:red,width:1.5});
  if(p.gape>0){
    g.save();g.translate(46,0);g.rotate(p.gape);
    stroke([[0,0],[20,-5],[2,5]],t,106,{closed:true,fill:red,color:red,width:1.1});g.restore();
  }
  const blink=p.blink??((t%4.7)>4.56?1:0),look=p.look||0;
  if(blink>.5)stroke([[27,-10],[36,-7]],t,108,{width:2});else{dot(32+look*2,-10,3,ink);dot(33+look*2,-11,.8,'#fff1d5');}
  stroke([[17,9],[22,12]],t,110,{color:red,width:2,opacity:.4});
  g.restore();g.restore();
}
