import {lerp,ease,out,range} from '../lib/motion.js';
import {makeDraw} from '../lib/draw.js';
import {validateDataset,validateGraph,formatNumber} from '../lib/data.js';
export function createIndustry(canvas,cfg){
  const ratio=canvas.width/canvas.height;
  if(ratio<1.7||ratio>3.7)throw Error('Industry demo supports landscape 16:9 to 32:9; design other layouts explicitly');
  const data=validateDataset(cfg.dataset,{kinds:['bar'],allowMissing:false}),graph=validateGraph(cfg.graph);
  if(graph.nodes.length!==5)throw Error('Industry example layout requires 5 nodes; redesign for another topology');
  const d=makeDraw(canvas,{insets:cfg.safeInsets}),{g,W,H,text,line,dot,box}=d,m=Math.max(110,W*.055),wide=W>2600;
  const C={bg:'#091f2b',ink:'#e5f1eb',mint:'#b7edce',red:'#ed795e',dim:'#739b9e',grid:'#27444e'};
  function chrome(t,index){
    const grad=g.createRadialGradient(W*.7,550,20,W*.65,500,W*.6);grad.addColorStop(0,'#193d49');grad.addColorStop(1,C.bg);
    g.fillStyle=grad;g.fillRect(0,0,W,H);
    for(let i=0;i<12;i++)line(m+i*(W-2*m)/11,230,m+i*(W-2*m)/11,920,C.grid+'70',1);
    text('FARO  /  微光',m,100,30,C.ink,700);text('概念设备 · 示意数据',W-m,100,23,C.dim,500,'right');
    line(m,133,W-m,133,C.grid,2);
    text(['01   MATERIAL','02   DETAILS','03   ARCHITECTURE','04   DATA','05   TREND','06   FARO'][index],m,1002,22,C.dim,500);
    text('PRODUCT  /  SYSTEM  /  SIGNAL',W-m,1002,20,C.dim,500,'right');
    box(m,1030,(W-2*m)*t/cfg.duration,3,C.mint);
  }
  function ring(x,y,r,c,w=2,a=0,b=Math.PI*2){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.arc(x,y,r,a,b);g.stroke();}
  function device(x,y,s,t,explode=0){
    g.save();g.translate(x,y);g.scale(s,s);g.rotate(Math.sin(t*.3)*.025);
    g.fillStyle='#00000038';g.beginPath();g.ellipse(20,245,290,50,0,0,Math.PI*2);g.fill();
    const parts=[{dy:explode*110,w:450,h:320,c:'#3c5864'},{dy:0,w:470,h:315,c:'#b6c8c5'},{dy:-explode*160,w:480,h:310,c:'#d7e2d9'}];
    for(let i=0;i<3;i++){
      const p=parts[i];g.save();g.translate(0,p.dy);
      const body=g.createLinearGradient(-220,-150,230,170);body.addColorStop(0,p.c);body.addColorStop(.48,i===2?'#a5b7b5':p.c);body.addColorStop(.55,i===2?'#e3ebe0':p.c);body.addColorStop(1,'#6d8b91');
      box(-p.w/2,-p.h/2,p.w,p.h,body,55);
      if(i===2){
        box(-198,-119,396,229,'#112e3d',28);
        for(let j=0;j<32;j++)for(let k=0;k<11;k++)dot(-174+j*11.2,-97+k*17,1.2,'#42616c');
        ring(0,-3,73,C.mint,2);ring(0,-3,66,C.mint,3,-Math.PI/2,-Math.PI/2+Math.PI*1.5);
        text('F',0,18,61,C.mint,400,'center',false);
        dot(174,101,5,C.red);
        for(let j=0;j<25;j++)line(-180+j*15,135,-175+j*15,135,'#6f898d',2);
        const shine=g.createLinearGradient(-230,-150,230,140);shine.addColorStop(0,'#ffffff24');shine.addColorStop(.4,'#ffffff00');shine.addColorStop(.8,'#ffffff12');shine.addColorStop(1,'#ffffff00');box(-198,-119,396,229,shine,28);
      }else if(i===1){for(let j=0;j<5;j++)box(-150+j*65,-95,40,20,C.bg,3);}
      g.restore();
    }
    g.restore();
  }
  function label(s,x,y,tx,ty,side='left'){
    line(tx,ty,x+(side==='left'?20:-20),y-12,C.dim,1.5);dot(tx,ty,4,C.red);text(s,x,y,27,C.ink,500,side);
  }
  function chartFrame(x,y,w,h){
    for(let i=0;i<=4;i++){const v=data.domain[1]*i/4,yy=y+h-h*i/4;line(x,yy,x+w,yy,C.grid,1.5);text(formatNumber(v,Number.isInteger(v)?0:1),x-18,yy+7,21,C.dim,500,'right');}
    text(data.unit,x,y-27,22,C.dim,500);
  }
  function bars(t,x,y,w,h){
    chartFrame(x,y,w,h);const gap=w/data.rows.length;
    data.rows.forEach((r,i)=>{
      const p=out(range(t,i*.08,.95+i*.08)),hh=r.value/data.domain[1]*h*p,bw=gap*.54,bx=x+gap*(i+.5)-bw/2;
      box(bx,y+h-hh,bw,Math.max(.01,hh),i===data.rows.length-1?C.red:C.mint,5);
      text(formatNumber(r.value*p),bx+bw/2,y+h-hh-17,31,C.ink,600,'center');
      text(r.label,bx+bw/2,y+h+44,26,C.dim,500,'center');
    });
  }
  function seek(t){
    if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek outside timeline');
    d.reset(t);const index=Math.floor(t/4),u=t-index*4;chrome(t,index);
    if(index===0){
      text('看见，',m,351,wide?118:104,C.ink,600);text('信号的形状。',m,484,wide?118:104,C.ink,600);
      text('从一个细节，进入整套系统。',m,585,32,C.dim,400);
      const x=wide?W*.71:W*.74;device(x,580,1.2+.25*ease(range(u,0,2)),t);
      label('01  精细纹理',x-170,282,x-150,438);label('02  状态光点',W-m,837,x+247,728,'right');
      text('二维材质概念图',x,900,22,C.dim,400,'center');
    }else if(index===1){
      text('每一层，都有自己的任务。',m,254,wide?82:68,C.ink,600);
      const x=wide?W*.46:W*.43;device(x,630,1.1,t,ease(range(u,.1,1.3))*.95);
      const lx=wide?W*.72:W*.73;
      [['感知层',390,'接收信号'],['处理层',590,'整理信息'],['连接层',786,'传递结果']].forEach(([s,y,sub],i)=>{label(s,lx,y,x+235,489+i*145);text(sub,lx,y+43,24,C.dim,400);});
    }else if(index===2){
      text('跟着一次信号，走完系统。',m,254,wide?82:68,C.ink,600);
      const xs=graph.nodes.map((_,i)=>m+130+i*(W-2*m-260)/4),y=564;
      graph.edges.forEach((e,i)=>{
        const ai=graph.nodes.findIndex(n=>n.id===e.from),bi=graph.nodes.findIndex(n=>n.id===e.to),a=xs[ai]+104,b=xs[bi]-104,p=((u*.52-i*.12)%1+1)%1;
        line(a,y,b,y,C.dim,2);line(b-10,y-7,b,y,C.dim,2);line(b-10,y+7,b,y,C.dim,2);
        dot(lerp(a,b,p),y,5,C.red);
      });
      graph.nodes.forEach((n,i)=>{const active=range(u,i*.4,i*.4+.35);box(xs[i]-102,y-65,204,130,active>.5?C.mint:'#254653',14);text(String(i+1).padStart(2,'0'),xs[i],y-97,23,C.dim,500,'center');text(n.label,xs[i],y+12,31,active>.5?C.bg:C.ink,600,'center');});
      text('方向表示数据流；运动速度仅作示意',m,813,28,C.dim,400);
    }else if(index===3){
      text(data.title,m,254,wide?82:68,C.ink,600);
      const cw=(W-2*m)*.64,x=m+55,y=404,h=376;bars(u,x,y,cw-60,h);
      const rx=m+(W-2*m)*.78,last=data.rows.at(-1);
      text(last.label,rx,469,31,C.dim,500);
      text(formatNumber(last.value*out(range(u,0,1.25))),rx,642,126,C.red,600);
      text(data.unit,rx,704,32,C.ink,500);
      text(`${data.illustrative?'示意数据':'数据来源'} · ${data.source}`,m,903,22,C.dim,400);
    }else if(index===4){
      text('从单点，看到变化。',m,254,wide?82:68,C.ink,600);
      const x=m+60,y=390,w=(W-2*m)*.68,h=390;chartFrame(x,y,w,h);
      const pts=data.rows.map((r,i)=>[x+i*w/(data.rows.length-1),y+h-r.value/data.domain[1]*h]);
      const p=out(range(u,.05,1.6))*(pts.length-1);
      for(let i=0;i<pts.length-1;i++){
        if(p<=i)break;const q=Math.min(1,p-i),a=pts[i],b=pts[i+1];line(a[0],a[1],lerp(a[0],b[0],q),lerp(a[1],b[1],q),C.mint,4);
      }
      pts.forEach(([xx,yy],i)=>{text(data.rows[i].label,xx,y+h+45,25,C.dim,500,'center');if(p>=i){dot(xx,yy,7,C.red);text(String(data.rows[i].value),xx,yy-24,29,C.ink,600,'center');}});
      const sum=data.rows.reduce((s,r)=>s+r.value,0),rx=m+(W-2*m)*.8;
      text('期间合计',rx,451,29,C.dim,500);text(formatNumber(sum),rx,603,110,C.ink,600);text(data.unit,rx,661,30,C.dim,500);
      text(`快照 ${data.asOf} · ${data.illustrative?'仅演示绘图逻辑':'同口径数据'}`,m,904,24,C.dim,400);
    }else{
      for(let i=0;i<14;i++){const r=120+i*40+u*7;ring(W*.72,530,r,C.mint+(i%2?'12':'25'),1);}
      text('让每个信号，',m,411,wide?124:104,C.ink,600);text('都有回响。',m,555,wide?124:104,C.mint,600);
      text('FARO / 微光',m,687,44,C.ink,700);text('概念发布演示',m,750,25,C.dim,400);
      device(W*.76,568,wide?1.4:1,t);
    }
    return true;
  }
  return {seek,inspect:d.inspect,layoutCoverage:d.layoutCoverage};
}
