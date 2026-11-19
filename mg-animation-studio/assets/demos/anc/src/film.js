// Showcase Demo: "主动降噪 · 原理演示" — Layered Studio Cutaway Photography + Live Acoustic Interference Waves (30fps)
// Ported into deterministic DOM/SVG seek(t) mode; assets are studio product cutouts + code-driven phase math.
const C = {
  noise: '#F2A25C',
  anti: '#6FC7E8',
  result: '#7FD9B0',
  residual: '#9FB3C2',
  text: '#EDF2F5',
  muted: '#8A97A6',
  accent: '#F2A25C',
};

const clamp01 = v => Math.min(1, Math.max(0, v));
const prog = (f, a, b) => clamp01((f - a) / (b - a));
const appear = (f, a, dur = 12) => prog(f, a, a + dur);
const band = (f, a, b, fade = 14) => Math.min(appear(f, a, fade), 1 - prog(f, b - fade, b));

function alpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a.toFixed(4)})`;
}

function wavePath({ x0, x1, cy, amp, wavelength, phase, amplitudeFade, steps = 160 }) {
  let out = '';
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = x0 + (x1 - x0) * u;
    const localAmp = amplitudeFade ? amplitudeFade(u) : 1;
    const y = cy - amp * localAmp * Math.sin((2 * Math.PI * (x - x0)) / wavelength + phase);
    out += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return out;
}

function preload(srcs) {
  return Promise.all(srcs.map(src => new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.decode().then(() => resolve(img), () => reject(Error(`Failed to decode ${src}`)));
  })));
}

export async function createFilm(stage, cfg) {
  const FPS = cfg.fps || 30;
  const DURATION = cfg.duration || 15;
  const headSrc = './assets/headphone_alpha.webp';
  const cutSrc = './assets/earcup_cutaway_alpha.webp';
  await preload([headSrc, cutSrc]);

  const H = { mic: { x: 906, y: 544 }, dsp: { x: 1032, y: 590 }, spk: { x: 1032, y: 687 } };
  const noiseSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>")`;

  stage.style.background = '#0B1119';
  stage.style.fontFamily = '"PingFang SC", "Hiragino Sans GB", StudioSans, sans-serif';
  stage.style.overflow = 'hidden';

  function renderHighlight(cx, cy, r, opacity, color, pulse) {
    if (opacity <= 0.001) return '';
    const rr = r + pulse * 6;
    const id = `glow-${cx}-${cy}`;
    return `<svg width="1920" height="1080" style="position:absolute;inset:0;opacity:${opacity.toFixed(4)};pointer-events:none">
      <defs><radialGradient id="${id}"><stop offset="0%" stop-color="${alpha(color, 0.42)}"/><stop offset="70%" stop-color="${alpha(color, 0.1)}"/><stop offset="100%" stop-color="${alpha(color, 0)}"/></radialGradient></defs>
      <circle cx="${cx}" cy="${cy}" r="${(rr * 2.1).toFixed(1)}" fill="url(#${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${rr.toFixed(1)}" fill="none" stroke="${alpha(color, 0.9)}" stroke-width="2.5" stroke-dasharray="5 7"/>
      <circle cx="${cx}" cy="${cy}" r="${rr.toFixed(1)}" fill="none" stroke="${alpha(color, 0.35)}" stroke-width="9"/>
    </svg>`;
  }

  function renderSignalLine(x1, y1, x2, y2, opacity, color, frame) {
    if (opacity <= 0.001) return '';
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 42;
    const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
    const u = (frame % 40) / 40;
    const bx = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2;
    const by = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2;
    return `<svg width="1920" height="1080" style="position:absolute;inset:0;opacity:${opacity.toFixed(4)};pointer-events:none">
      <path d="${d}" fill="none" stroke="${alpha(color, 0.25)}" stroke-width="2"/>
      <path d="${d}" fill="none" stroke="${alpha(color, 0.7)}" stroke-width="1.6" stroke-dasharray="6 9"/>
      <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="5.5" fill="${color}"/>
      <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="11" fill="${alpha(color, 0.2)}"/>
    </svg>`;
  }

  function renderLabel(x, y, text, sub, color, align, opacity) {
    if (opacity <= 0.001) return '';
    return `<div style="position:absolute;left:${x}px;top:${y}px;opacity:${opacity.toFixed(4)};text-align:${align};transform:${align === 'right' ? 'translateX(-100%)' : 'none'}">
      <div style="font-size:23px;font-weight:700;color:${color};letter-spacing:0.5px">${text}</div>
      ${sub ? `<div style="font-size:15px;color:${C.muted};margin-top:3px">${sub}</div>` : ''}
    </div>`;
  }

  function renderWavePanel(frame, x, y, w, h, opacity) {
    if (opacity <= 0.001) return '';
    const antiOn = prog(frame, 250, 274);
    const cancelAmt = prog(frame, 320, 384);
    const resultRatio = 1 - (1 - 0.16) * cancelAmt;
    const topPad = 48, pad = 22, rowH = (h - topPad - pad) / 3;
    const rows = [
      { label: '环境噪声', cy: topPad + rowH * 0.5, color: C.noise, amp: rowH * 0.32 },
      { label: '反相信号', cy: topPad + rowH * 1.5, color: C.anti, amp: rowH * 0.32 },
      { label: '耳边合成', cy: topPad + rowH * 2.5, color: C.result, amp: rowH * 0.32 },
    ];
    const x0 = 122, x1 = w - 20, wavelength = 118, drift = (frame * 2.4) % wavelength;
    const paths = rows.map((r, i) => {
      const on = i === 1 ? antiOn : 1;
      if (i === 1 && antiOn <= 0.001) return '';
      const ratio = i === 2 ? resultRatio : 1;
      const phase = (i === 1 ? Math.PI : 0) + (2 * Math.PI * drift) / wavelength;
      const d = wavePath({ x0, x1, cy: r.cy, amp: r.amp * ratio, wavelength, phase, amplitudeFade: u => Math.max(0, Math.min(u / 0.06, (1 - u) / 0.06, 1)) });
      return `<g opacity="${on.toFixed(4)}">
        <line x1="${x0}" y1="${r.cy.toFixed(1)}" x2="${x1}" y2="${r.cy.toFixed(1)}" stroke="${alpha(r.color, 0.16)}" stroke-width="1" stroke-dasharray="4 6"/>
        <path d="${d}" fill="none" stroke="${r.color}" stroke-width="${i === 2 ? 3 : 2.4}" stroke-linecap="round" opacity="0.95"/>
      </g>`;
    }).join('');
    const labels = rows.map((r, i) => {
      const on = i === 1 ? antiOn : 1;
      return `<div style="position:absolute;left:16px;top:${(r.cy - 13).toFixed(1)}px;width:96px;font-size:15px;font-weight:600;color:${r.color};opacity:${(on * 0.95).toFixed(4)}">${r.label}</div>`;
    }).join('');
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:${opacity.toFixed(4)}">
      <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(20,32,44,0.86),rgba(11,18,26,0.9));border:1px solid ${alpha('#6E8498', 0.28)};border-radius:16px;box-shadow:0 18px 48px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.04)"></div>
      <div style="position:absolute;left:18px;top:12px;font-size:19px;font-weight:700;color:${C.text};letter-spacing:1px">耳边声音 · 同一时间轴</div>
      <div style="position:absolute;right:16px;top:14px;font-size:13px;color:${C.muted}">简化示意</div>
      <svg width="${w}" height="${h}" style="position:absolute;inset:0;overflow:visible">${paths}</svg>
      ${labels}
      <div style="position:absolute;left:16px;bottom:10px;font-size:14px;color:${alpha(C.result, prog(frame, 344, 372))}">${cancelAmt > 0.35 ? '两波叠加 → 大幅相消' : '噪声规律、可预测'}</div>
    </div>`;
  }

  function seek(t) {
    if (!Number.isFinite(t) || t < 0 || t >= DURATION) throw Error('seek outside timeline');
    const frame = t * FPS;
    const warmPulse = 0.5 + 0.5 * Math.sin(frame / 26);
    const zoomIn = prog(frame, 92, 150);
    const zoomOut = prog(frame, 392, 430);
    const closeUp = Math.min(zoomIn, 1 - zoomOut);

    const wholeScale = 1 + closeUp * 0.06;
    const wholeX = 300 - closeUp * 120;
    const wholeY = 120 + closeUp * 26;
    const wholeOpacity = 1 - closeUp * 0.92;

    const cutScale = 0.62 + closeUp * 0.5;
    const cutX = 1010 - closeUp * 470;
    const cutY = 470 - closeUp * 190;
    const cutOpacity = closeUp;

    const s1 = band(frame, 4, 92);
    const s2 = band(frame, 96, 168);
    const s3 = band(frame, 168, 242);
    const s4 = band(frame, 242, 316);
    const s5 = band(frame, 316, 390);
    const s6 = band(frame, 392, 450, 10);
    const pulse = 0.5 + 0.5 * Math.sin(frame / 8);

    const appOp = band(frame, 0, 96) * 0.95;
    const appCx = 300 + prog(frame, 6, 78) * 250;
    const appRings = appOp > 0.001 ? [0, 1, 2, 3].map(i => {
      const u = (frame / 34 + i * 0.25) % 1;
      const r = 40 + u * 150;
      const o = Math.sin(Math.PI * u) * 0.5;
      return `<ellipse cx="${appCx.toFixed(1)}" cy="320" rx="${(r * 0.55).toFixed(1)}" ry="${r.toFixed(1)}" fill="none" stroke="${alpha(C.noise, o)}" stroke-width="2.4"/>`;
    }).join('') : '';

    const earOp = band(frame, 320, 392) * 0.95;
    const earSum = earOp > 0.001 ? `<div style="position:absolute;left:1090px;top:150px;opacity:${earOp.toFixed(4)}">
      <div style="font-size:17px;font-weight:700;color:${C.result};margin-bottom:8px">在耳边叠加</div>
      <svg width="330" height="150">
        <path d="${wavePath({ x0: 8, x1: 322, cy: 42, amp: 24, wavelength: 90, phase: 0 })}" fill="none" stroke="${C.noise}" stroke-width="2.4"/>
        <path d="${wavePath({ x0: 8, x1: 322, cy: 100, amp: 24, wavelength: 90, phase: Math.PI })}" fill="none" stroke="${C.anti}" stroke-width="2.4"/>
      </svg>
      <div style="font-size:14px;color:${C.muted};margin-top:-6px">等幅 · 反相 → 相消</div>
    </div>` : '';

    const stageCaption = (op, title, sub, color, big = false) => op <= 0.001 ? '' :
      `<div style="position:absolute;left:56px;bottom:${big ? 60 : 64}px;max-width:${big ? 720 : 660}px;opacity:${op.toFixed(4)}">
        <div style="font-size:${big ? 32 : 30}px;font-weight:${big ? 800 : 700};color:${color}">${title}</div>
        <div style="font-size:${big ? 19 : 20}px;color:${sub.muted ? C.muted : C.text};margin-top:8px;line-height:1.5">${sub.text}</div>
      </div>`;

    const hdrOp = band(frame, 0, 450, 20);
    stage.innerHTML = `
      <div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 62% 40%,#223443 0%,#16212E 38%,#0C131C 72%,#070B11 100%)"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(60% 55% at 22% 18%,rgba(150,185,215,0.16) 0%,rgba(150,185,215,0) 62%)"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(48% 60% at 84% 62%,rgba(242,162,92,${(0.06 + 0.05 * warmPulse).toFixed(4)}) 0%,rgba(242,162,92,0) 60%)"></div>
      <div style="position:absolute;left:0;right:0;top:72%;bottom:0;background:linear-gradient(180deg,rgba(120,150,175,0) 0%,rgba(90,120,145,0.05) 45%,rgba(0,0,0,0.28) 100%)"></div>
      <div style="position:absolute;inset:0;opacity:0.05;background-image:${noiseSvg}"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(100% 100% at 50% 48%,rgba(0,0,0,0) 55%,rgba(0,0,0,0.42) 100%)"></div>

      <div style="position:absolute;left:56px;top:44px;opacity:${hdrOp.toFixed(4)}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:6px;height:34px;background:${C.accent};border-radius:3px"></div>
          <div style="font-size:40px;font-weight:800;color:${C.text};letter-spacing:1px">主动降噪 · 原理演示</div>
        </div>
        <div style="font-size:18px;color:${C.muted};margin-top:8px;margin-left:18px">持续的低频噪声，是怎样被减弱的？</div>
      </div>
      <div style="position:absolute;right:52px;top:50px;text-align:right;opacity:${hdrOp.toFixed(4)}">
        <div style="font-size:15px;color:${C.muted};letter-spacing:2px">前馈式 ANC · 概念示意</div>
      </div>

      <div style="position:absolute;left:${wholeX.toFixed(1)}px;top:${wholeY.toFixed(1)}px;width:1320px;height:880px;transform:scale(${wholeScale.toFixed(4)});transform-origin:center center;opacity:${wholeOpacity.toFixed(4)}">
        <img src="${headSrc}" style="width:100%;height:100%;object-fit:contain;display:block"/>
      </div>

      ${appRings ? `<svg width="760" height="620" style="position:absolute;left:0;top:210px;opacity:${appOp.toFixed(4)};pointer-events:none">${appRings}</svg>` : ''}

      <div style="position:absolute;left:${cutX.toFixed(1)}px;top:${cutY.toFixed(1)}px;width:900px;height:600px;transform:scale(${cutScale.toFixed(4)});transform-origin:left top;opacity:${cutOpacity.toFixed(4)}">
        <img src="${cutSrc}" style="width:100%;height:100%;object-fit:contain;display:block"/>
      </div>

      ${renderHighlight(H.mic.x, H.mic.y, 30, band(frame, 168, 316) * cutOpacity, C.accent, pulse)}
      ${renderHighlight(H.dsp.x, H.dsp.y, 46, band(frame, 244, 340) * cutOpacity, '#F2C25C', pulse * 0.6)}
      ${renderHighlight(H.spk.x, H.spk.y, 58, band(frame, 316, 392) * cutOpacity, '#6FC7E8', pulse)}

      ${renderSignalLine(690, 470, H.mic.x, H.mic.y, band(frame, 176, 246) * cutOpacity, C.noise, frame)}
      ${renderSignalLine(H.mic.x, H.mic.y, H.dsp.x, H.dsp.y, band(frame, 250, 320) * cutOpacity, '#F2C25C', frame)}
      ${renderSignalLine(H.dsp.x, H.dsp.y, H.spk.x, H.spk.y, band(frame, 322, 392) * cutOpacity, C.anti, frame)}

      ${renderLabel(H.mic.x - 34, H.mic.y - 78, '① 外部麦克风', '采样环境噪声', C.noise, 'right', band(frame, 172, 250) * cutOpacity)}
      ${renderLabel(H.dsp.x + 62, H.dsp.y - 30, '② 控制芯片 DSP', '生成反相信号', '#F2C25C', 'left', band(frame, 248, 330) * cutOpacity)}
      ${renderLabel(H.spk.x + 78, H.spk.y + 10, '③ 扬声器', '发出反相声波', C.anti, 'left', band(frame, 320, 392) * cutOpacity)}

      ${earSum}

      ${stageCaption(s1, '① 持续的低频噪声', { text: '引擎、空调的嗡鸣：波长长、变化慢、规律可预测。' }, C.noise)}
      ${stageCaption(s2, '打开耳罩，看内部', { text: '内部结构为通用原理示意，非真实产品拆解', muted: true }, C.text)}
      ${stageCaption(s3, '② 麦克风先听见', { text: '噪声还没到耳边，外部麦克风已提前采样。' }, C.noise)}
      ${stageCaption(s4, '③ 芯片算出「反相」', { text: '生成一个同幅度、相位相差 180° 的反相信号。' }, '#F2C25C')}
      ${stageCaption(s5, '④ 扬声器发出反相声波', { text: '与原噪声叠加、相消——不是把两束声音「撞碎」。' }, C.anti)}
      ${stageCaption(s6, '噪声大幅减弱，但不是完全消失', { text: '耳边仍留有少量残余；高频与突发声主要靠耳罩物理隔绝。' }, C.result, true)}

      ${renderWavePanel(frame, 1288, 470, 572, 400, band(frame, 44, 450, 16))}

      <div style="position:absolute;right:52px;bottom:22px;font-size:12px;color:${alpha(C.muted, 0.7)};opacity:${band(frame, 60, 450, 20).toFixed(4)}">
        原理参考：IEEE ANC / 声学叠加　·　波形为简化示意
      </div>
    `;
    return true;
  }

  return { seek, layoutCoverage: 'manual-only (DOM + studio cutaway assets)' };
}
