// Showcase Demo: "MATTER OF LIGHT" — Three.js PBR/GLSL × Swiss Editorial Depth Sandwich (60fps)
import { createScene3D } from './scene3d.js';
import { createEditorial } from './editorial.js';

export function createFilm(stage, cfg) {
  const DURATION = cfg.duration || 28.0;
  const FPS = cfg.fps || 60;

  if (!document.getElementById('atelier-styles')) {
    const style = document.createElement('style');
    style.id = 'atelier-styles';
    style.textContent = `
      #stage { background: #F3EFE6; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
      #stage .layer { position: absolute; inset: 0; width: 1920px; height: 1080px; pointer-events: none; }
      #back-layer { z-index: 1; }
      #webgl-stage { position: absolute; inset: 0; width: 1920px; height: 1080px; z-index: 2; display: block; }
      #front-layer { z-index: 3; }
      #grain-layer { z-index: 4; opacity: 0.042; mix-blend-mode: overlay; }
      .font-sans { font-family: "Helvetica Neue", "PingFang SC", StudioSans, sans-serif; }
      .font-cond { font-family: "Avenir Next Condensed", "Helvetica Neue", "PingFang SC", StudioSans, sans-serif; }
      .font-serif { font-family: "Bodoni 72", "Songti SC", "STSong", Georgia, StudioSans, serif; }
      .font-mono { font-family: "DIN Alternate", "SF Mono", "Helvetica Neue", StudioSans, monospace; }
      .clip-line { overflow: hidden; display: inline-block; vertical-align: bottom; }
      .clip-line > span { display: inline-block; will-change: transform, opacity; }
    `;
    document.head.appendChild(style);
  }

  stage.innerHTML = `
    <div id="back-layer" class="layer"></div>
    <canvas id="webgl-stage" width="1920" height="1080"></canvas>
    <div id="front-layer" class="layer"></div>
    <canvas id="grain-layer" class="layer" width="480" height="270"></canvas>
  `;

  const backEl = stage.querySelector('#back-layer');
  const webglCanvas = stage.querySelector('#webgl-stage');
  const frontEl = stage.querySelector('#front-layer');
  const grainCanvas = stage.querySelector('#grain-layer');
  const gctx = grainCanvas.getContext('2d', { willReadFrequently: true });

  const scene3d = createScene3D(webglCanvas);
  const editorial = createEditorial(backEl, frontEl);

  function drawGrain(t) {
    const step = Math.floor(t * 24);
    const w = grainCanvas.width, h = grainCanvas.height;
    const img = gctx.createImageData(w, h);
    const data = img.data;
    let s = (Math.imul(step + 1337, 0x9e3779b1) ^ 0x85ebca6b) >>> 0;
    for (let i = 0; i < w * h; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const v = (s >>> 24) & 255;
      const idx = i * 4;
      data[idx] = v; data[idx + 1] = v; data[idx + 2] = v; data[idx + 3] = 255;
    }
    gctx.putImageData(img, 0, 0);
  }

  function seek(t) {
    const clamped = Math.max(0, Math.min(DURATION - 1 / FPS, t));
    editorial.seek(clamped);
    scene3d.seek(clamped);
    drawGrain(clamped);
    return true;
  }

  return { seek, layoutCoverage: 'manual-only (3D WebGL + DOM editorial)' };
}
