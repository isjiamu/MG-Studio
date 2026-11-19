import {compose, fade, W, H} from './stage.js';
import {paintLayer} from '../lib/layers.js';
import {lerp} from '../lib/motion.js';

const title='#f0edd9', muted='#bacbb7', gold='#ffdda4', green='#a5c9ae';
const brief=[
  {at:0,key:'intro',title:'看见需要的光',note:'折叠式双臂与底座'},
  {at:4.65,key:'on',title:'暖光落在桌面',note:'灯罩内侧亮起'},
  {at:10.9,key:'dial',title:'旋转底座旋钮',note:'转动时，桌面渐亮'},
  {at:19.3,key:'fold',title:'灯臂沿铰链收拢',note:'主转轴保持在原位'},
  {at:25.85,key:'end',title:'灯臂已收拢',note:''}
];

function product(d,cfg,layers){
  const {g,text,line,dot,box,path,round,linear,radial,ellipse,arc,arrow,progress}=d;
  const hinge={x:937,y:377};
  const move=([x,y],angle)=>[hinge.x+x*Math.cos(angle)-y*Math.sin(angle),hinge.y+x*Math.sin(angle)+y*Math.cos(angle)];
  return t=>{
    const current=brief.findLast(b=>b.at<=t);
    const power=fade(t,4.65,6.94), dial=fade(t,11.45,14.38), fold=fade(t,19.72,23.45);
    const angle=lerp(-.29,-1.425,fold);
    const [ex,ey]=move([-20,-146],angle), [hx,hy]=move([-168,-194],angle);
    const led=hy+28, intensity=power*(.45+.55*dial)*(1-.82*fold);
    paintLayer(g,layers.material,0,0,W,H);
    g.fillStyle=linear(0,0,652,0,[[0,'#0e211ce8'],[.57,'#13251dee'],[1,'#15282000']]);
    g.fillRect(0,0,660,H);

    const beamSpread=57+(561-led)*.38;
    if(intensity>0){
      const field=linear(0,led,0,563,[[0,'#fff1bdb8'],[.35,'#ffdc8863'],[1,'#ffd79408']]);
      g.globalAlpha=intensity;
      path([[hx-55,led],[hx+55,led],[hx+beamSpread,562],[hx-beamSpread,562]],field);
      g.save();
      g.translate(hx,574);g.scale(1,.26);
      const pool=radial(0,0,209,[[0,'#ffdd9a9c'],[.45,'#ffc57781'],[1,'#ffc57700']]);
      ellipse(0,0,209,209,pool);g.restore();
      g.globalAlpha=1;
    }
    g.save();g.translate(935,590);g.scale(1,.18);
    ellipse(0,0,247,247,radial(0,0,240,[[0,'#0a1713ed'],[1,'#0a171300']]));
    g.restore();
    const metal=linear(910,0,971,0,[[0,'#302d1c'],[.25,'#b28c57'],[.53,'#f0c286'],[.76,'#795a36'],[1,'#403723']]);
    const base=linear(0,538,0,600,[[0,'#debd84'],[.48,'#a97d51'],[.55,'#684d32'],[1,'#362d20']]);
    path([[833,553],[971,545],[1035,567],[1031,587],[962,602],[813,587],[803,575]],base,'#987746',2);
    path([[831,544],[973,536],[1032,563],[964,580],[806,566]],'#ad885a','#d2af78',1.25);
    line(830,557,964,550,'#e3c791',1.2);
    line(937,555,hinge.x,hinge.y,'#4a3927',35);
    line(937,555,hinge.x,hinge.y,metal,28);
    line(931,546,931,393,'#e8c799',2.1);
    const leg=linear(750,281,930,401,[[0,'#e9bc86'],[.57,'#ab8657'],[1,'#796142']]);
    line(hinge.x,hinge.y,ex,ey,'#483a29',24);
    line(hinge.x,hinge.y,ex,ey,leg,18);
    line(ex,ey,hx,hy,'#483a29',23);
    line(ex,ey,hx,hy,leg,17);
    dot(ex,ey,14,'#765a3d');dot(ex,ey,8,'#d3a978');
    const shade=linear(0,hy-37,0,hy+35,[[0,'#e8c697'],[.38,'#b99267'],[.76,'#856344'],[1,'#5c452e']]);
    g.beginPath();g.moveTo(hx-75,hy+24);g.quadraticCurveTo(hx-54,hy+9,hx-45,hy-13);
    g.quadraticCurveTo(hx,hy-51,hx+45,hy-13);
    g.quadraticCurveTo(hx+54,hy+9,hx+75,hy+24);g.closePath();
    g.fillStyle=shade;g.fill();g.strokeStyle='#e1c293';g.lineWidth=1.1;g.stroke();
    ellipse(hx,led,75,10,'#403527');
    ellipse(hx,led,62,6,'#e5ab71');
    g.globalAlpha=power*(.46+.54*dial)*(1-.80*fold);
    ellipse(hx,led,62,6,'#fff1b9');g.globalAlpha=1;
    dot(hinge.x,hinge.y,19,'#5e492e');dot(hinge.x,hinge.y,14,'#d1a76c');
    dot(hinge.x,hinge.y,5,'#f0d299');
    const dialAngle=-2.14+3.62*dial;
    ellipse(866,564,29,12,'#664b32');
    dot(866,551,17,'#634a30');dot(866,549,15,'#c79c64');
    line(866,549,866+11*Math.cos(dialAngle),549+11*Math.sin(dialAngle),'#fdf1c8',3);
    if(current.key==='dial'){
      arc(866,549,29,0,2*Math.PI,gold,1.6);
      const q=fade(t,10.90,11.4);
      g.globalAlpha=q;
      line(845,531,789,484,gold,1.2);line(789,484,706,484,gold,1.2);
      text('实际旋钮',703,480,18,gold,710,'right');
      g.globalAlpha=1;
    }
    if(current.key==='fold'||current.key==='end'){
      const opacity=current.key==='end'?1-fade(t,25.85,26.28):fade(t,19.3,19.80);
      g.globalAlpha=opacity;
      g.setLineDash([4,7]);arc(hinge.x,hinge.y,93,-2.98,-1.72,gold,2);g.setLineDash([]);
      const tip=-2.98;
      const px=hinge.x+93*Math.cos(tip),py=hinge.y+93*Math.sin(tip);
      arrow(px+2,py-9,px,py,gold,2,8);
      line(hinge.x+21,hinge.y-3,1027,340,gold,1.4);line(1027,340,1120,340,gold,1.4);
      text('铰链',1120,326,23,gold,780,'right');
      g.globalAlpha=1;
    }

    text('昼屿',73,162,103,title,850);
    text('折叠台灯',81,222,31,green,690);
    line(79,271,415,271,'#526a5c',1);
    text(current.title,81,336,current.key==='end'?31:36,title,780);
    if(current.note)text(current.note,84,383,22,muted,550);
    if(current.key==='dial'){
      const cx=135,cy=493;
      round(80,425,321,131,'#21362c','#556958',13);
      arc(cx,cy,35,0,2*Math.PI,'#9a8159',1.25);
      dot(cx,cy,27,'#bd9864');
      line(cx,cy,cx+19*Math.cos(dialAngle),cy+19*Math.sin(dialAngle),'#fff4d2',3.3);
      text('光线亮度',199,474,19,title,650);
      progress(198,501,157,.45+.55*dial,1,gold,'#536955');
    }
    text('概念演示',82,662,17,muted,550);
    progress(1007,657,186,t,30,green,'#465c50');
  };
}
export async function createFilm(canvas,cfg) {
  return compose(canvas,cfg,product);
}
