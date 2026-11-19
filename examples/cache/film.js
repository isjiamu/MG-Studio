import {compose, fade, W, H} from './stage.js';
import {paintLayer} from '../lib/layers.js';
import {validateGraph} from '../lib/data.js';
import {lerp} from '../lib/motion.js';

const dark='#122434', ink='#edf4f2', muted='#a7bcc4', cyan='#8adcd0', amber='#fac487';
const centers=[246,640,1033];
const schedule=[
  {at:0, focus:0, title:'同一份内容'},
  {at:4.42, focus:1, title:'第一次 · 先查缓存'},
  {at:6.18, focus:1, title:'缓存未命中'},
  {at:7.23, focus:2, title:'转向源站取内容'},
  {at:11.0, focus:1, title:'取回数据'},
  {at:12.15, focus:1, title:'正在写入缓存副本'},
  {at:14.10, focus:0, title:'副本已写入，内容返回'},
  {at:17.48, focus:1, title:'第二次 · 查找同一内容'},
  {at:19.65, focus:1, title:'命中有效副本'},
  {at:22.30, focus:0, title:'由缓存直接返回'},
  {at:25.15, focus:-1, title:'省去源站往返'}
];
function mechanism(d,cfg,layers){
  const {g,text,line,dot,box,round,linear,radial,path,arrow,glowDot,progress}=d;
  const nodes=validateGraph({
    nodes:[{id:'user',label:'用户'},{id:'cache',label:'缓存'},{id:'origin',label:'源站'}],
    edges:[{from:'user',to:'cache'},{from:'cache',to:'origin'},{from:'origin',to:'cache'},{from:'cache',to:'user'}],
  }).nodes;
  const inside=[344,540,739,935];
  function icon(i,x,y,c,lit) {
    const edge=lit?c:'#5b778a';
    if(i===0){
      round(x-29,y-17,58,34,'#102434',edge,5);
      line(x-19,y-5,x-9,y-5,edge,2);line(x-19,y+2,x+4,y+2,edge,2);
      line(x,y+17,x,y+24,edge,2);line(x-15,y+24,x+15,y+24,edge,2);
    } else {
      for(let j=0;j<3;j++){
        const yy=y-18+j*13;
        round(x-27,yy,54,10,'#122536',edge,3);
        line(x-20,yy+5,x+3,yy+5,edge,1.8);
        dot(x+18,yy+5,2.1,edge);
      }
    }
  }
  function flow(t,from,to,x1,x2,y,color){
    if(t<from)return;
    const q=fade(t,from,to),x=lerp(x1,x2,q);
    if(q>.04)arrow(x1,y,x,y,color,3.0);
    if(q<1){
      glowDot(x,y,5.5,color);
      box(x-10,y-7,20,14,color,3);
      line(x-5,y,x+5,y,dark,1.8);
    }
  }
  return t=>{
    const current=schedule.findLast(p=>p.at<=t);
    const pass=t>=17.48;
    const back=t>=10.95&&!pass||t>=22.3;
    const nodeText=[
      t>=24.45||!pass&&t>=16.07?'已收到内容':'请求同一内容',
      t>=19.65?'命中有效副本':t>=17.48?'已有副本':t>=14.12?'副本已写入':t>=12.15?'正在写入':t>=6.18?'未命中':'等待查询',
      pass?'未读取':t>=10.95?'内容已取出':'保存原始内容'
    ];
    g.fillStyle=linear(0,0,W,H,[[0,'#172f3f'],[.58,'#172938'],[1,'#10202c']]);g.fillRect(0,0,W,H);
    paintLayer(g,layers.grain,0,0,W,H,.37);
    for(let x=78;x<1210;x+=29)line(x,248,x,534,'#284257',.65);
    for(let y=248;y<535;y+=22)line(73,y,1212,y,'#284257',.65);
    text('为什么第二次加载更快？',71,108,58,ink,850);
    text('同一份内容的两次读取',75,153,22,muted,600);
    line(73,175,1205,175,'#526779',1);
    const tag=t<4.42?'读取同一内容':t>=25.15?'两次读取对照':pass?'第二次读取':'第一次读取';
    round(75,191,166,44,'#213c4e','#4f6777',10);
    text(tag,158,220,19,pass?cyan:amber,750,'center');
    text(current.title,1201,221,25,back||pass?cyan:amber,800,'right');

    nodes.forEach((n,i)=>{
      const x=centers[i],dim=i===2&&pass,focus=i===current.focus;
      const color=dim?'#7b929e':back?cyan:amber;
      if(focus) {
        g.fillStyle=radial(x,361,134,[[0,'#4a9c8f55'],[1,'#4a9c8f00']]);
        g.fillRect(x-134,230,268,268);
      }
      box(x-101,296,202,173,'#101e2a',15);
      round(x-99,284,198,174,linear(x-92,276,x+82,449,[[0,dim?'#233846':'#33566b'],[1,'#1b3140']]),focus?color:'#587588',13);
      line(x-85,299,x+84,299,focus?color:'#638395',1.25);
      icon(i,x,338,color,focus);
      text(n.label,x,401,27,dim?'#a3b7bf':ink,780,'center');
      text(nodeText[i],x,434,17,focus?color:muted,650,'center');
      if(i===1 && ((t>=12.15&&t<14.12)||t>=19.65)){
        const q=t>=19.65?1:fade(t,12.15,14.05);
        progress(x-44,448,88,q,1,cyan,'#203e46');
      }
    });
    const [a,b,c,e]=inside;
    line(a,342,b,342,'#557181',1.6);line(b,378,a,378,'#456a71',1.6);
    if(!pass){line(c,342,e,342,'#557181',1.6);line(e,378,c,378,'#456a71',1.6);}
    if(!pass){
      flow(t,4.45,5.86,a,b,342,amber);
      flow(t,7.24,8.89,c,e,342,amber);
      flow(t,10.93,11.98,e,c,378,cyan);
      flow(t,14.14,16.08,b,a,378,cyan);
    }else{
      flow(t,17.57,19.44,a,b,342,amber);
      flow(t,22.32,24.44,b,a,378,cyan);
    }

    line(74,499,1205,499,'#547181',1.15);
    if(t>=25.15){
      text('第一次',79,551,20,amber,800);
      text('用户  →  缓存  →  源站  →  回填  →  用户',206,551,21,ink,650);
      text('第二次',79,601,20,cyan,800);
      text('用户  →  缓存  →  用户',206,601,21,ink,650);
      text('源站不参与',1203,599,25,cyan,820,'right');
    }else{
      const stages=pass?
        [[17.48,'查缓存'],[19.65,'有效命中'],[22.3,'返回内容']]:
        [[4.42,'查缓存'],[7.23,'读源站'],[12.15,'写入副本'],[14.1,'返回内容']];
      const active=stages.findLastIndex(([at])=>t>=at);
      stages.forEach(([at,label],i)=>{
        const x=82+i*253, color=i===active?(back?cyan:amber):i<active?ink:muted;
        dot(x+5,558,5,color);
        text(label,x+21,566,22,color,650);
        if(i<stages.length-1)line(x+117,558,x+224,558,'#64818d',1);
      });
    }
    line(74,625,1203,625,'#465d6b',1);
    text('→ 请求',75,665,17,amber,650);
    text('← 内容返回',166,665,17,cyan,650);
    text('路径示意 · 不代表真实延迟',1204,665,17,muted,600,'right');
  };
}
export async function createFilm(canvas,cfg) {
  return compose(canvas,cfg,mechanism);
}
