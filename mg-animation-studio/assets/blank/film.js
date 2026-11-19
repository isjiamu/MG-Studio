import {makeDraw} from '../lib/draw.js';
// Replace this scaffold with the visual mechanism chosen for the current brief.
// Reuse the renderer contract and tools; existing sample films are optional references.
export function createFilm(canvas,cfg){
  const d=makeDraw(canvas),{g,W,H,text,line}=d;
  function seek(t){
    if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek outside timeline');
    d.reset(t);g.fillStyle='#f4f4f0';g.fillRect(0,0,W,H);
    text('创作入口 · 尚未编排内容',W/2,H*.45,54,'#202d35',600,'center');
    text('按当前需求重写本文件与 film.json，再关闭 draft 标记。',W/2,H*.55,26,'#53616a',400,'center');
    line(W*.25,H*.63,W*.75,H*.63,'#c6ced0',2);
    return true;
  }
  return {seek,inspect:d.inspect,layoutCoverage:d.layoutCoverage};
}
