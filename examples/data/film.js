import {compose, fade, W, H} from './stage.js';
import {paintLayer} from '../lib/layers.js';
import {validateDataset, linearScale, formatNumber} from '../lib/data.js';

const ink='#233325', green='#1c654f', pale='#e9e4d3', bronze='#ad533a', muted='#536153';
const x=[235,406,577,748], base=560;
const beats=[
  {from:3.80,until:4.92,title:'一月 · 建立基准',note:'从 1,200 人读起'},
  {from:8.17,until:9.38,title:'二月 · 客流上升',note:'比一月多 600 人'},
  {from:12.99,until:14.02,title:'三月 · 短暂回落',note:'比二月少 300 人'},
  {from:18.06,until:19.44,title:'四月 · 达到高点',note:'月度客流为一月的两倍'}
];
function data(d,cfg,layers){
  const {g,text,line,dot,box,round,linear,arrow,progress}=d;
  const model=validateDataset(cfg.dataset);
  const scale=v=>linearScale(v,[0,2400],[base,235]);
  return t=>{
    const active=beats.findLastIndex(b=>t>=b.from);
    const completed=t>=20.18;
    const current=beats[active];
    g.fillStyle='#f6efdd';g.fillRect(0,0,W,H);
    g.fillStyle=linear(0,0,W,H,[[0,'#faf4e8'],[1,'#e9e6d4']]);g.fillRect(0,0,W,H);
    paintLayer(g,layers.grain,0,0,W,H,.57);
    text('澄屿书店',74,89,59,ink,850);
    text('到店人数 · 1—4 月',78,142,29,green,700);
    text('人',889,144,19,muted,700,'right');
    line(76,167,1206,167,'#9fa591',1.3);
    round(891,190,315,426,'#305545','#536c55',14);
    g.save();g.beginPath();g.roundRect(893,192,311,265,[13,13,0,0]);g.clip();
    paintLayer(g,layers.bookshop,893,190,311,272);
    g.restore();
    line(911,461,1185,461,'#728d78',1);
    if(completed){
      text('2.0×',916,534,66,'#ffe7ad',850);
      text('四月是 1 月的两倍',919,582,21,'#f7eede',650);
    }else{
      text(current?current.title:'月度到店人数',917,516,24,'#f0dfad',750);
      text(current?current.note:'四个月依次揭示',918,565,18,'#f3e8d3',500);
    }

    [0,600,1200,1800,2400].forEach(v=>{
      g.setLineDash(v?[3,6]:[]);
      const y=scale(v);
      line(130,y,846,y,v?'#c2c3ad':'#748676',v?1:1.5);
      g.setLineDash([]);
      text(formatNumber(v),114,y+5,15,muted,600,'right');
    });
    if(current&&!completed) {
      const i=active;
      round(x[i]-61,209,122,381,'#e5e8d4',null,12);
      [0,600,1200,1800,2400].forEach(v=>line(x[i]-61,scale(v),x[i]+61,scale(v),'#c1ccba',1));
    }
    model.rows.forEach((row,i)=>{
      const b=beats[i],q=fade(t,b.from,b.until);
      const fill=i===2?bronze:i===active||completed&&i===3?green:'#75907a';
      text(row.label,x[i],597,22,i===2&&q?bronze:ink,700,'center');
      if(!q)return;
      const y=scale(row.value*q);
      box(x[i]-43,y,86,base-y,fill,3);
      g.globalAlpha=fade(t,b.until-.05,b.until+.33);
      text(formatNumber(row.value),x[i],scale(row.value)-14,24,fill,800,'center');
      g.globalAlpha=1;
    });
    if(t>=14.20&&t<18.12){
      const x1=x[1]+42,x2=x[2]-45,y1=scale(1800)+13,y2=scale(1500)+11;
      arrow(x1+1,y1,x2-10,y2,bronze,2.4,10);
    }
    if(completed){
      g.setLineDash([5,6]);
      line(x[0]+43,scale(1200),x[3]-43,scale(1200),green,1.7);
      g.setLineDash([]);
      dot(x[0]+43,scale(1200),4,green);
    }
    line(75,632,1204,632,'#b4b7a3',1);
    text('示例数据 · 虚构书店',76,668,17,muted,650);
    progress(891,665,313,t,30,green,'#c2c8b6');
  };
}
export async function createFilm(canvas,cfg) {
  return compose(canvas,cfg,data);
}
