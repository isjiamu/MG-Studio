// Empty creative entry. There are no sample films on purpose: build this film from its own
// BRIEF.md and STORYBOARD.md. Delete this scaffold entirely.
//
// Contract (keep): export createFilm(stage, cfg) -> {seek(t), inspect?(), layoutCoverage?}
//   seek(t) must draw frame t from scratch using only t, cfg and preloaded assets.
// Toolkit (optional, use what serves the visual thesis):
//   lib/draw.js     makeDraw(): text/type (multi-font, tracking), lines, rough strokes, safe-area check
//   lib/motion.js   easings (expoOut, quartOut, backOut, smooth, cubicBezier...), keys(), stagger(), spring
//   lib/camera.js   camera()/layer()/project(): one persistent world, parallax depth, push/pull, DOF
//   lib/look.js     grain, vignette, bloom, additive light, glow, softShadow, curtain (volumetric strands),
//                   duotone (unify photos), halftone
//   lib/layers.js   loadLayers()/paintLayer(): project-local images, decoded before frame 0
//   lib/handdrawn.js pencil strokes, hatch, paper/print surfaces, sampleKeyframes
// capture:"dom" in film.json gives you a <div id="stage"> instead: HTML/SVG/CSS/WebGL, captured by
// element screenshot. Drive every property from t inside seek(); CSS animations are disabled in render.
import {makeDraw} from '../lib/draw.js';
export function createFilm(stage,cfg){
  if(stage instanceof HTMLCanvasElement){
    const d=makeDraw(stage),{g,W,H,text,line}=d;
    function seek(t){
      if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek outside timeline');
      d.reset(t);g.fillStyle='#f4f4f0';g.fillRect(0,0,W,H);
      text('创作入口 · 尚未编排内容',W/2,H*.45,54,'#202d35',600,'center');
      text('按本题材的视觉世界重写本文件与 film.json，审片后再关闭 draft。',W/2,H*.55,26,'#53616a',400,'center');
      line(W*.25,H*.63,W*.75,H*.63,'#c6ced0',2);
      return true;
    }
    return {seek,inspect:d.inspect,layoutCoverage:d.layoutCoverage};
  }
  stage.style.background='#f4f4f0';
  stage.innerHTML='<div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center;color:#202d35;font:600 54px StudioSans">创作入口 · 尚未编排内容<div style="font:400 26px StudioSans;color:#53616a;margin-top:24px">DOM 捕获模式：在 seek(t) 中按时间设置每个元素的样式</div></div>';
  return {seek(t){if(!Number.isFinite(t)||t<0||t>=cfg.duration)throw Error('seek outside timeline');return true;},layoutCoverage:'manual-only (DOM)'};
}
