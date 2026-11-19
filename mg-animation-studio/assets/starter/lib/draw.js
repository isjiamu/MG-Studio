import {clamp} from './motion.js';
export function seeded(n){const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);}
export function makeDraw(canvas,{height=1080,insets={top:.04,right:.04,bottom:.04,left:.04}}={}){
  // Use one CPU raster path: repeated readback must not switch GPU blending mid-film.
  const g=canvas.getContext('2d',{alpha:false,willReadFrequently:true}),S=canvas.height/height,H=height,W=canvas.width/S;
  let issues=[],time=0;
  function reset(t){
    issues=[];time=t;g.reset();g.setTransform(S,0,0,S,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.setLineDash([]);g.lineCap='round';g.lineJoin='round';
  }
  function text(s,x,y,size=32,color='#283e51',weight=500,align='left',check=true,family='StudioSans'){
    g.font=`${weight} ${size}px "${family}"`;g.fillStyle=color;g.textAlign=align;g.textBaseline='alphabetic';g.fillText(s,x,y);
    if(check&&g.globalAlpha>.12){
      const m=g.measureText(s),left=x-(align==='center'?m.width/2:align==='right'?m.width:0),tr=g.getTransform();
      const pts=[[left,y-m.actualBoundingBoxAscent],[left+m.width,y-m.actualBoundingBoxAscent],[left,y+m.actualBoundingBoxDescent],[left+m.width,y+m.actualBoundingBoxDescent]];
      if(pts.some(([a,b])=>{const xx=(tr.a*a+tr.c*b+tr.e)/S,yy=(tr.b*a+tr.d*b+tr.f)/S;return xx<W*insets.left||xx>W*(1-insets.right)||yy<H*insets.top||yy>H*(1-insets.bottom);}))
        issues.push({text:s,time,reason:'text exceeds configured safeInsets'});
    }
  }
  // Named-option form for typography work: family, tracking (em), check.
  function type(s,x,y,{size=32,color='#283e51',weight=500,align='left',family='StudioSans',tracking=0,check=true}={}){
    const prev=g.letterSpacing;g.letterSpacing=`${tracking*size}px`;
    try{text(s,x,y,size,color,weight,align,check,family);}finally{g.letterSpacing=prev||'0px';}
  }
  function line(x1,y1,x2,y2,color='#283e51',w=2){g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();}
  function dot(x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,Math.max(.01,r),0,Math.PI*2);g.fill();}
  function box(x,y,w,h,color,r=0){g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();}
  function rough(points,t,id,{color='#283e51',width=2,closed=false,fill=null,jitter=1.2}={}){
    const phase=Math.floor(t*8);
    g.beginPath();
    for(let i=0;i<points.length;i++){
      const [x,y]=points[i],xx=x+(seeded(id+i*3+phase*17)-.5)*jitter,yy=y+(seeded(id+i*5+phase*19)-.5)*jitter;
      if(i===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);
    }
    if(closed)g.closePath();if(fill){g.fillStyle=fill;g.fill();}g.strokeStyle=color;g.lineWidth=width;g.stroke();
  }
  function oval(x,y,rx,ry,t,progress=1,color='#cd684b',id=2){
    const pts=[];for(let i=0;i<=Math.floor(clamp(progress)*80);i++){const a=i/80*Math.PI*2-.3;pts.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry]);}
    if(pts.length>1)rough(pts,t,id,{color,width:2.7,jitter:2});
  }
  return {g,W,H,reset,text,type,line,dot,box,rough,oval,inspect:()=>issues,layoutCoverage:'visible primary text bounds vs configured safeInsets; excludes decorative microtype and overlap'};
}
export function paperPattern(g,seed=42){
  const c=document.createElement('canvas');c.width=512;c.height=512;const p=c.getContext('2d',{willReadFrequently:true});
  const im=p.createImageData(512,512);
  for(let i=0;i<512*512;i++){const v=seeded(i+seed);im.data[i*4]=v>.5?255:20;im.data[i*4+1]=v>.5?247:35;im.data[i*4+2]=v>.5?224:48;im.data[i*4+3]=Math.floor(v*23);}
  p.putImageData(im,0,0);p.strokeStyle='#15283d0b';p.lineWidth=.6;
  for(let i=0;i<240;i++){const x=seeded(i*2+seed)*512,y=seeded(i*3+77)*512;p.beginPath();p.moveTo(x,y);p.lineTo(x+seeded(i+27)*12,y+3);p.stroke();}
  return g.createPattern(c,'repeat');
}
