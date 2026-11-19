// Showcase Demo: "LESS, BUT BETTER" — Pure Canvas 2D Tactile Industrial Craft (60fps)
export function createFilm(canvas, cfg) {
  const g = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  const W = 1920, H = 1080;
  const DURATION = cfg.duration || 22.0, FPS = cfg.fps || 60;

// Dieter Rams / Braun / Teenage Engineering Industrial Palette
const C = {
  ivory: '#F2EFE8',
  ivoryDeep: '#E5E0D6',
  alu: '#DFDDD5',
  aluDark: '#BDBAB0',
  ink: '#151517',
  inkSoft: '#4A4945',
  dim: '#8B8880',
  charcoal: '#1A1B1E',
  orange: '#FF4500',   // Iconic Braun / TE Signal Vermilion Orange
  green: '#009E60',    // Classic Braun Leaf Green
  yellow: '#E8B500',   // Braun Ochre Yellow
  glass: '#0E1012',
  phosphor: '#F7C96E'
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const range = (t, a, b) => clamp((t - a) / (b - a));
const expoOut = p => { p = clamp(p); return p === 1 ? 1 : 1 - Math.pow(2, -10 * p); };
const expoIn = p => { p = clamp(p); return p === 0 ? 0 : Math.pow(2, 10 * p - 10); };
const expoInOut = p => {
  p = clamp(p);
  if (p === 0 || p === 1) return p;
  return p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2;
};
// Analytic underdamped mechanical spring detent!
function springDetent(t, k = 320, c = 24) {
  if (t <= 0) return 0;
  const w = Math.sqrt(k), z = c / (2 * w);
  const wd = w * Math.sqrt(Math.max(0.001, 1 - z * z));
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}
function hash(i) {
  let x = Math.imul(i + 1976, 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

// Procedural subtle matte ceramic/anodized-metal micro-grain pattern (created once!)
function makeSurfaceGrain() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = hash(i * 13);
    const bright = v > 0.5 ? 255 : 20;
    img.data[i * 4] = bright;
    img.data[i * 4 + 1] = bright;
    img.data[i * 4 + 2] = bright;
    img.data[i * 4 + 3] = Math.floor(Math.abs(v - 0.5) * 18);
  }
  ctx.putImageData(img, 0, 0);
  return g.createPattern(c, 'repeat');
}
const GRAIN = makeSurfaceGrain();

// Helpers
function setFont(size, weight = 700, family = '"Helvetica Neue", "PingFang SC", StudioSans, sans-serif') {
  g.font = `${weight} ${size}px ${family}`;
}
function drawClippedLine(str, x, y, size, weight, color, prog, align = 'left', family = '"Helvetica Neue", "PingFang SC", StudioSans, sans-serif') {
  g.save();
  setFont(size, weight, family);
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  const m = g.measureText(str);
  const pad = size * 0.4;
  const left = align === 'center' ? x - m.width / 2 - 20 : align === 'right' ? x - m.width - 20 : x - 20;
  g.beginPath();
  g.rect(left, y - size * 1.15, m.width + 40, size * 1.48);
  g.clip();
  const dy = lerp(size * 1.18, 0, clamp(prog));
  g.globalAlpha *= clamp(prog * 2.5);
  g.fillStyle = color;
  g.fillText(str, x, y + dy);
  g.restore();
}
function drawHeaderFooter(tl, tr, bl, br, ink = C.ink, alpha = 0.52) {
  g.save();
  g.globalAlpha *= alpha;
  setFont(13, 600, '"DIN Alternate", "Helvetica Neue", StudioSans, monospace');
  g.fillStyle = ink;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillText(tl, 72, 62);
  g.fillText(bl, 72, H - 46);
  g.textAlign = 'right';
  g.fillText(tr, W - 72, 62);
  g.fillText(br, W - 72, H - 46);
  // Crisp hairline frame dividers
  g.strokeStyle = ink;
  g.globalAlpha *= 0.22;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(72, 86); g.lineTo(W - 72, 86);
  g.moveTo(72, H - 78); g.lineTo(W - 72, H - 78);
  g.stroke();
  g.restore();
}

// Photorealistic Machined Brushed-Aluminum Rotary Knob (createConicGradient metallic sheen!)
function drawRotaryKnob(cx, cy, r, angle, opts = {}) {
  const { accent = C.orange, dark = false, ticks = 24 } = opts;
  g.save();

  // Subtle calibration tick ring around dial
  if (ticks > 0) {
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
      const major = i % 6 === 0;
      const r1 = r + 14, r2 = r + (major ? 26 : 20);
      g.strokeStyle = major ? (dark ? '#7E7D78' : '#55534E') : (dark ? '#3F3E3B' : '#B5B1A8');
      g.lineWidth = major ? 2 : 1.2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      g.stroke();
    }
  }

  // Deep directional studio cast shadow under the machined aluminum cylinder
  g.save();
  g.shadowColor = 'rgba(15, 14, 12, 0.26)';
  g.shadowBlur = r * 0.42;
  g.shadowOffsetX = r * 0.12;
  g.shadowOffsetY = r * 0.22;
  g.fillStyle = dark ? '#18181A' : '#C9C6BE';
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // Machined knurled outer rim
  const knurls = 72;
  g.save();
  g.translate(cx, cy);
  g.rotate(angle);
  for (let i = 0; i < knurls; i++) {
    const a = (i / knurls) * Math.PI * 2;
    g.strokeStyle = i % 2 === 0 ? (dark ? '#38383C' : '#9B9890') : (dark ? '#111113' : '#EFECE5');
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    g.stroke();
  }
  g.restore();

  // Outer chamfer bevel
  const bevel = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  if (dark) {
    bevel.addColorStop(0, '#4C4C52');
    bevel.addColorStop(0.5, '#202024');
    bevel.addColorStop(1, '#0C0C0E');
  } else {
    bevel.addColorStop(0, '#FFFFFF');
    bevel.addColorStop(0.45, '#D8D5CD');
    bevel.addColorStop(1, '#8F8C84');
  }
  g.fillStyle = bevel;
  g.beginPath();
  g.arc(cx, cy, r - 4, 0, Math.PI * 2);
  g.fill();

  // Authentic Brushed Aluminum Conic Anisotropic Sheen!
  const conic = g.createConicGradient(angle * 0.35 - 0.6, cx, cy);
  if (dark) {
    conic.addColorStop(0.00, '#2C2C30');
    conic.addColorStop(0.18, '#46464D');
    conic.addColorStop(0.36, '#1B1B1E');
    conic.addColorStop(0.56, '#3A3A40');
    conic.addColorStop(0.78, '#17171A');
    conic.addColorStop(1.00, '#2C2C30');
  } else {
    conic.addColorStop(0.00, '#DEDBD3');
    conic.addColorStop(0.16, '#F8F6F1');
    conic.addColorStop(0.34, '#C6C3BA');
    conic.addColorStop(0.52, '#F4F1EA');
    conic.addColorStop(0.74, '#BDBAB1');
    conic.addColorStop(0.90, '#ECE9E1');
    conic.addColorStop(1.00, '#DEDBD3');
  }
  g.fillStyle = conic;
  g.beginPath();
  g.arc(cx, cy, r - 10, 0, Math.PI * 2);
  g.fill();

  // Concentric hairline lathe grooves
  g.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.045)';
  g.lineWidth = 1;
  for (let rr = r * 0.25; rr < r - 12; rr += 8) {
    g.beginPath();
    g.arc(cx, cy, rr, 0, Math.PI * 2);
    g.stroke();
  }

  // Signal indicator notch / recessed marker
  g.save();
  g.translate(cx, cy);
  g.rotate(angle - Math.PI / 2);
  g.fillStyle = accent;
  g.beginPath();
  g.roundRect(r * 0.38, -4.5, r * 0.44, 9, 4.5);
  g.fill();
  // Tiny concave center dimple
  g.fillStyle = dark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)';
  g.beginPath();
  g.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  g.fill();
  g.restore();

  g.restore();
}

// Tactile Braun / Teenage Engineering Recessed Circular Indicator Dot / Button
function drawTactileDot(cx, cy, r, color, press = 0) {
  g.save();
  // Recessed bezel housing
  const bezel = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  bevel_safe: {
    bezel.addColorStop(0, 'rgba(0,0,0,0.16)');
    bezel.addColorStop(1, 'rgba(255,255,255,0.85)');
  }
  g.fillStyle = bezel;
  g.beginPath();
  g.arc(cx, cy, r + 5, 0, Math.PI * 2);
  g.fill();

  // Soft elevation shadow (compresses when pressed!)
  g.save();
  const elev = 1 - clamp(press);
  g.shadowColor = 'rgba(15,14,12,0.28)';
  g.shadowBlur = 14 * elev + 3;
  g.shadowOffsetX = 3 * elev;
  g.shadowOffsetY = 7 * elev + 1;
  g.fillStyle = color;
  g.beginPath();
  g.arc(cx, cy + press * 2, r, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // Tactile matte-plastic convex specular catchlight
  const cap = g.createRadialGradient(cx - r * 0.32, cy - r * 0.32 + press * 2, r * 0.08, cx, cy + press * 2, r);
  cap.addColorStop(0, 'rgba(255,255,255,0.42)');
  cap.addColorStop(0.55, 'rgba(255,255,255,0.0)');
  cap.addColorStop(1, 'rgba(0,0,0,0.24)');
  g.fillStyle = cap;
  g.beginPath();
  g.arc(cx, cy + press * 2, r, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function fillCeramicBackdrop(tone = 'ivory') {
  const grad = g.createRadialGradient(W * 0.45, H * 0.38, 80, W * 0.5, H * 0.5, W * 0.78);
  if (tone === 'alu') {
    grad.addColorStop(0, '#E9E7E0');
    grad.addColorStop(1, '#D5D2C9');
  } else if (tone === 'dark') {
    grad.addColorStop(0, '#1D1E22');
    grad.addColorStop(1, '#101114');
  } else {
    grad.addColorStop(0, '#F8F6F0');
    grad.addColorStop(0.65, '#F0ECE3');
    grad.addColorStop(1, '#E4DFD4');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
}

// ============================================================================
// ACT I (0.00 - 3.80s): NOISE -> ONE DIAL CLICK -> PURE SILENCE ("LESS, / 少，")
// ============================================================================
function drawAct1(t) {
  fillCeramicBackdrop('ivory');

  // Phase 1 (0.0 - 1.65s): Chaotic modern UI clutter (noisy cards, alerts, jagged lines!)
  const clickAt = 1.65;
  const wipe = expoOut(range(t, clickAt, clickAt + 0.55));

  if (wipe < 0.999) {
    g.save();
    // Radial sweep mask that physically erases all clutter as the dial clicks!
    if (wipe > 0.001) {
      g.beginPath();
      g.rect(0, 0, W, H);
      // Reverse winding inner circle erased
      const eraseR = wipe * 1350;
      g.arc(W * 0.5, H * 0.5, eraseR, 0, Math.PI * 2, true);
      g.clip('evenodd');
    }
    // Draw 34 noisy clashing UI clutter artifacts jittering nervously!
    for (let i = 0; i < 34; i++) {
      const rx = 140 + hash(i * 3) * (W - 380);
      const ry = 130 + hash(i * 7) * (H - 300);
      const rw = 90 + hash(i * 11) * 190;
      const rh = 34 + hash(i * 17) * 86;
      const jx = Math.sin(t * 14 + i * 2.3) * 5;
      const jy = Math.cos(t * 11 + i * 1.9) * 5;
      const cols = ['#2B5CFF', '#FF2D85', '#7B3EFF', '#181A1F', '#FF4500', '#00B8A9'];
      const col = cols[i % cols.length];
      g.fillStyle = i % 3 === 0 ? col + '22' : '#FFFFFFAA';
      g.strokeStyle = col + 'AA';
      g.lineWidth = 2;
      g.beginPath();
      g.roundRect(rx + jx, ry + jy, rw, rh, 10);
      g.fill();
      g.stroke();
      // Fake busy bar/text lines inside noise boxes
      g.fillStyle = col + '77';
      g.fillRect(rx + jx + 14, ry + jy + 14, rw * 0.52, 6);
      g.fillStyle = '#00000022';
      g.fillRect(rx + jx + 14, ry + jy + 28, rw * 0.72, 5);
    }
    g.restore();
  }

  // Centerpiece Machined Rotary Dial drops in at 0.72s, clicks 1 crisp detent at 1.65s, glides aside cleanly!
  const dialIn = expoOut(range(t, 0.72, 1.38));
  const dialShift = expoInOut(range(t, 1.85, 2.55));
  if (dialIn > 0.01) {
    const dialAngle = springDetent(t - clickAt, 380, 22) * (Math.PI * 0.5);
    const dx = lerp(W * 0.5, W * 0.73, dialShift);
    const dy = H * 0.5;
    const dr = lerp(195, 168, dialShift) * dialIn;
    // Crisp wipe shockwave ring at moment of click
    if (wipe > 0.01 && wipe < 0.98) {
      g.strokeStyle = `rgba(255,69,0,${(1 - wipe) * 0.55})`;
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(W * 0.5, H * 0.5, wipe * 1200, 0, Math.PI * 2);
      g.stroke();
    }
    drawRotaryKnob(dx, dy, dr, dialAngle, { accent: C.orange, ticks: 24 });
  }

  // After the click: Pure calm museum space + monumental Swiss typography!
  if (t >= clickAt + 0.15) {
    const tp = expoOut(range(t, 1.90, 2.75));
    const cp = expoOut(range(t, 2.15, 2.95));
    drawHeaderFooter('INDUSTRIAL MOTION STUDY', 'WENIGER, ABER BESSER', '00 — REDUCTION', '120 BPM', C.ink, 0.52 * tp);

    // Single crisp signal-orange dot
    const dotS = springDetent(t - 1.95, 260, 20);
    if (dotS > 0.01) drawTactileDot(158, 355, 22 * dotS, C.orange, 0);

    drawClippedLine('LESS,', 130, 565, 178, 800, C.ink, tp, 'left');
    drawClippedLine('少，即是秩序。', 136, 672, 62, 600, C.inkSoft, cp, 'left', '"Songti SC", "PingFang SC", StudioSans, serif');
    drawClippedLine('REMOVE THE NOISE. KEEP ONLY WHAT MATTERS.', 138, 738, 16, 600, C.dim, expoOut(range(t, 2.38, 3.15)), 'left', '"DIN Alternate", StudioSans, monospace');
  }

  // Clean horizontal aluminum curtain wipe into Act II (3.42 - 3.80s)
  const outW = expoInOut(range(t, 3.42, 3.80));
  if (outW > 0.005) {
    g.fillStyle = C.alu;
    g.fillRect(0, 0, W * outW, H);
    g.fillStyle = C.orange;
    g.fillRect(W * outW - 4, 0, 4, H);
  }
}

// ============================================================================
// ACT II (3.80 - 7.80s): 01 HONEST — CNC ALUMINUM SPEAKER GRILL + ACOUSTIC WAVE
// ============================================================================
function drawAct2(t) {
  const u = t - 3.80;
  fillCeramicBackdrop('alu');
  drawHeaderFooter('PRINCIPLE 01 / 03', 'HONESTY OF MATERIAL', 'BRAUN SK4 / T3 ACOUSTIC STUDY', '325 CNC PERFORATIONS', C.ink, 0.58);

  // Recessed machined CNC aluminum speaker panel on right/center
  const px = 640, py = 148, pw = 1208, ph = 784;
  const panelIn = expoOut(range(u, 0.0, 0.65));

  g.save();
  // Panel subtle bevel frame
  g.shadowColor = 'rgba(15,14,12,0.12)';
  g.shadowBlur = 32;
  g.shadowOffsetY = 12;
  g.fillStyle = '#E6E4DD';
  g.beginPath();
  g.roundRect(px, py, pw, ph, 26);
  g.fill();
  g.restore();

  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(px + 1, py + 1, pw - 2, ph - 2, 25);
  g.stroke();

  // 25 x 13 CNC Circular Acoustic Perforations with physical traveling sound ripples!
  const cols = 25, rows = 13;
  const gx0 = px + 68, gy0 = py + 68;
  const stepX = (pw - 136) / (cols - 1);
  const stepY = (ph - 136) / (rows - 1);
  const waveCx = px + pw * 0.5, waveCy = py + ph * 0.5;

  // 3 acoustic bass pulses emitted at u = 0.40, 1.40, 2.40s (exact beats!)
  const pulses = [0.40, 1.40, 2.40];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = gx0 + c * stepX;
      const cy = gy0 + r * stepY;
      const dist = Math.hypot(cx - waveCx, cy - waveCy);
      // Staggered CNC reveal
      const rev = expoOut(range(u, 0.02 + dist * 0.00055, 0.35 + dist * 0.00055));
      if (rev <= 0.02) continue;

      // Sum acoustic wave resonance across pulses
      let energy = 0;
      for (const pt of pulses) {
        const dt = u - pt;
        if (dt > 0 && dt < 1.8) {
          const front = dt * 620;
          const diff = Math.abs(dist - front);
          const ringVal = Math.exp(-(diff * diff) / (2 * 62 * 62)) * Math.exp(-dt * 1.15);
          energy += ringVal;
        }
      }
      energy = clamp(energy);
      const holeR = (10.5 + energy * 3.8) * rev;

      // Machined top-left dark bevel + bottom-right bright aluminum catchlight
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.beginPath();
      g.arc(cx + 1.2, cy + 1.4, holeR, 0, Math.PI * 2);
      g.fill();

      // Acoustic chamber depth color (shifts from matte charcoal to glowing signal-orange resonance!)
      if (energy > 0.06) {
        const rg = g.createRadialGradient(cx, cy, 1, cx, cy, holeR);
        rg.addColorStop(0, `rgba(255, 69, 0, ${clamp(energy * 1.15)})`);
        rg.addColorStop(0.65, `rgba(22, 22, 24, ${0.95 - energy * 0.4})`);
        rg.addColorStop(1, '#111214');
        g.fillStyle = rg;
      } else {
        g.fillStyle = '#18191C';
      }
      g.beginPath();
      g.arc(cx, cy, holeR, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Left Swiss Editorial Typographic Column (clean negative space!)
  const tp = expoOut(range(u, 0.15, 0.95));
  drawClippedLine('01', 72, 315, 168, 900, C.ink, tp, 'left', '"Avenir Next Condensed", "Helvetica Neue", sans-serif');
  g.fillStyle = C.orange;
  g.fillRect(74, 348, 86 * tp, 5);
  drawClippedLine('HONEST.', 72, 438, 66, 800, C.ink, expoOut(range(u, 0.30, 1.05)), 'left');
  drawClippedLine('诚实材质。', 72, 526, 56, 700, C.ink, expoOut(range(u, 0.45, 1.20)), 'left', '"Songti SC", "PingFang SC", StudioSans, serif');
  drawClippedLine('不伪装工艺，', 74, 608, 24, 500, C.inkSoft, expoOut(range(u, 0.65, 1.35)), 'left');
  drawClippedLine('让每一次振动清晰可见。', 74, 646, 24, 500, C.inkSoft, expoOut(range(u, 0.78, 1.45)), 'left');

  // Subtle live decibel / frequency readout bottom-left
  const activeWave = pulses.reduce((s, pt) => s + (u > pt && u < pt + 0.9 ? Math.exp(-(u - pt) * 3.5) : 0), 0);
  g.fillStyle = C.ink;
  g.fillRect(74, 780, 120, 2);
  g.fillStyle = C.orange;
  g.fillRect(74, 780, 120 * clamp(0.18 + activeWave * 0.82), 5);
  setFont(14, 600, '"DIN Alternate", StudioSans, monospace');
  g.fillStyle = C.dim;
  g.textAlign = 'left';
  g.fillText(`ACOUSTIC OUTPUT  ${(48 + activeWave * 36).toFixed(1)} dB`, 74, 814);

  // Smooth vertical wipe into Act III (3.62 - 4.00s)
  const outW = expoInOut(range(u, 3.62, 4.00));
  if (outW > 0.005) {
    g.fillStyle = C.ivory;
    g.fillRect(0, H * (1 - outW), W, H * outW);
  }
}

// ============================================================================
// ACT III (7.80 - 12.40s): 02 PRECISE — TEENAGE ENGINEERING / BRAUN CONSOLE
// ============================================================================
function drawAct3(t) {
  const u = t - 7.80;
  fillCeramicBackdrop('ivory');
  drawHeaderFooter('PRINCIPLE 02 / 03', 'TACTILE PRECISION', 'ANODIZED DECK · LIVE OSCILLOSCOPE', '4-DETENT HARMONIC SYNTH', C.ink, 0.56);

  const deckIn = expoOut(range(u, 0.0, 0.78));
  const deckY = lerp(52, 0, deckIn);

  // Stepped detent timeline (4 crisp encoder clicks at u = 0.6, 1.4, 2.2, 3.0s!)
  const detents = [0.60, 1.40, 2.20, 3.00];
  let stepPos = 0;
  let activeKey = -1;
  detents.forEach((dt, idx) => {
    if (u >= dt) {
      stepPos += springDetent(u - dt, 340, 21);
      if (u - dt < 0.36) activeKey = idx;
    }
  });

  // Overhead Industrial Anodized Aluminum Hardware Slab
  const dx = 112, dy = 148 + deckY, dw = 1696, dh = 736;
  g.save();
  g.shadowColor = 'rgba(18, 16, 12, 0.22)';
  g.shadowBlur = 65;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 28;
  const slabGrad = g.createLinearGradient(dx, dy, dx, dy + dh);
  slabGrad.addColorStop(0, '#ECEAE2');
  slabGrad.addColorStop(0.5, '#E2DFD7');
  slabGrad.addColorStop(1, '#D3CFC6');
  g.fillStyle = slabGrad;
  g.beginPath();
  g.roundRect(dx, dy, dw, dh, 34);
  g.fill();
  g.restore();

  // Outer machined metallic highlight border
  g.strokeStyle = 'rgba(255,255,255,0.92)';
  g.lineWidth = 2.5;
  g.beginPath();
  g.roundRect(dx + 1.5, dy + 1.5, dw - 3, dh - 3, 33);
  g.stroke();

  // Internal machined engraving divider lines
  g.strokeStyle = 'rgba(20,20,22,0.12)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(dx + 660, dy + 42); g.lineTo(dx + 660, dy + dh - 42);
  g.moveTo(dx + 46, dy + 466); g.lineTo(dx + 614, dy + 466);
  g.stroke();

  // Left Upper Zone: TWO Brushed-Aluminum Rotary Encoders!
  setFont(13, 700, '"DIN Alternate", StudioSans, monospace');
  g.fillStyle = C.dim;
  g.textAlign = 'left';
  g.fillText('FREQ / HARMONIC', dx + 56, dy + 62);
  g.fillText('RESONANCE / DAMPING', dx + 372, dy + 62);

  drawRotaryKnob(dx + 188, dy + 258, 118, -0.8 + stepPos * 0.68, { accent: C.orange, ticks: 24 });
  drawRotaryKnob(dx + 486, dy + 258, 118, 0.4 - stepPos * 0.52, { accent: C.green, dark: true, ticks: 24 });

  // Left Lower Zone: 4 Tactile Braun/TE Mechanical Square Keycaps with circular concave dimples!
  const keyCols = [C.ivory, C.charcoal, C.orange, C.green];
  const keyLabels = ['SINE', 'TRI', 'HARM', 'CHORD'];
  const keyW = 124, keyH = 148, keyGap = 22;
  for (let i = 0; i < 4; i++) {
    const kx = dx + 56 + i * (keyW + keyGap);
    const ky = dy + 522;
    const pressed = activeKey === i ? Math.sin(clamp((u - detents[i]) / 0.36) * Math.PI) : 0;
    const isLit = Math.floor(stepPos + 0.15) === i + 1;

    // Recessed key well
    g.fillStyle = '#B8B4AA';
    g.beginPath();
    g.roundRect(kx - 4, ky - 4, keyW + 8, keyH + 8, 18);
    g.fill();

    // Keycap body with compressible elevation shadow
    g.save();
    const elev = 1 - pressed * 0.8;
    g.shadowColor = 'rgba(15,14,12,0.28)';
    g.shadowBlur = 12 * elev + 2;
    g.shadowOffsetY = 6 * elev + 1;
    g.fillStyle = keyCols[i];
    g.beginPath();
    g.roundRect(kx, ky + pressed * 4, keyW, keyH, 14);
    g.fill();
    g.restore();

    // Tactile top concave circular finger dish
    const dish = g.createRadialGradient(kx + keyW * 0.52, ky + keyH * 0.45 + pressed * 4, 4, kx + keyW * 0.5, ky + keyH * 0.42 + pressed * 4, 34);
    dish.addColorStop(0, i === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.16)');
    dish.addColorStop(1, 'rgba(0,0,0,0.0)');
    g.fillStyle = dish;
    g.beginPath();
    g.arc(kx + keyW * 0.5, ky + keyH * 0.42 + pressed * 4, 34, 0, Math.PI * 2);
    g.fill();

    // Active tiny LED dot + label
    g.fillStyle = isLit ? (i === 2 ? '#FFFFFF' : C.orange) : (i === 0 ? '#99958C' : 'rgba(255,255,255,0.35)');
    g.beginPath();
    g.arc(kx + keyW / 2, ky + 22 + pressed * 4, 4.5, 0, Math.PI * 2);
    g.fill();

    setFont(13, 700, '"DIN Alternate", StudioSans, monospace');
    g.fillStyle = i === 0 ? C.inkSoft : 'rgba(255,255,255,0.88)';
    g.textAlign = 'center';
    g.fillText(keyLabels[i], kx + keyW / 2, ky + keyH - 18 + pressed * 4);
  }

  // Right Zone: Recessed Matte-Obsidian Analog Oscilloscope & Precision VU Meter!
  const sx = dx + 716, sy = dy + 54, sw = 924, sh = 426;
  // Deep milled bezel shadow
  g.fillStyle = '#0B0C0E';
  g.beginPath();
  g.roundRect(sx, sy, sw, sh, 20);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(sx - 1, sy - 1, sw + 2, sh + 2, 21);
  g.stroke();

  // Subtle oscilloscope reticle grid inside glass screen
  g.save();
  g.beginPath();
  g.roundRect(sx + 4, sy + 4, sw - 8, sh - 8, 17);
  g.clip();
  g.strokeStyle = 'rgba(247, 201, 110, 0.08)';
  g.lineWidth = 1;
  for (let gx = sx + 60; gx < sx + sw; gx += 64) { g.beginPath(); g.moveTo(gx, sy); g.lineTo(gx, sy + sh); g.stroke(); }
  for (let gy = sy + 52; gy < sy + sh; gy += 54) { g.beginPath(); g.moveTo(sx, gy); g.lineTo(sx + sw, gy); g.stroke(); }

  // Live morphing analog phosphor waveform driven by rotary encoder stepPos!
  const midY = sy + sh * 0.52;
  const morph = clamp(stepPos / 3.5);
  const drawWave = (lw, alpha, col) => {
    g.strokeStyle = col;
    g.globalAlpha = alpha;
    g.lineWidth = lw;
    g.beginPath();
    for (let i = 0; i <= 240; i++) {
      const f = i / 240;
      const x = sx + 28 + f * (sw - 56);
      const env = Math.sin(f * Math.PI);
      const phase = f * Math.PI * 6 + u * 6.5;
      // Morphs smoothly from pure sine -> harmonic rich -> warm square -> shimmering chord!
      const s1 = Math.sin(phase);
      const s2 = Math.sin(phase * 3) / 3 + Math.sin(phase * 5) / 5;
      const s3 = Math.sin(phase * 1.5) * 0.6 + Math.cos(phase * 2.0) * 0.4;
      const yVal = s1 * (1 - morph * 0.3) + s2 * morph * 0.95 + s3 * clamp(stepPos - 2) * 0.45;
      const y = midY - yVal * 112 * env;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  };
  drawWave(14, 0.14, C.orange);
  drawWave(6, 0.32, C.phosphor);
  drawWave(2.6, 1.0, '#FFF5DE');
  g.globalAlpha = 1;

  // Screen crisp HUD micro-readout
  setFont(14, 600, '"DIN Alternate", StudioSans, monospace');
  g.fillStyle = C.phosphor;
  g.textAlign = 'left';
  g.fillText(`OSC-01  ·  HARMONIC STAGE 0${Math.min(4, Math.floor(stepPos) + 1)}`, sx + 28, sy + 36);
  g.textAlign = 'right';
  g.fillStyle = C.orange;
  g.fillText(`${(220 + stepPos * 55).toFixed(1)} Hz`, sx + sw - 28, sy + 36);

  // Subtle diagonal glass studio reflection glare across screen
  const glare = g.createLinearGradient(sx, sy, sx + sw * 0.65, sy + sh);
  glare.addColorStop(0, 'rgba(255,255,255,0.08)');
  glare.addColorStop(0.35, 'rgba(255,255,255,0.02)');
  glare.addColorStop(0.36, 'rgba(255,255,255,0.0)');
  g.fillStyle = glare;
  g.fillRect(sx, sy, sw, sh);
  g.restore();

  // Right Lower Zone: Precision Analog VU Meter + Typographic Statement
  const vx = dx + 716, vy = dy + 518, vw = 430, vh = 166;
  g.fillStyle = '#F7F4EC';
  g.beginPath();
  g.roundRect(vx, vy, vw, vh, 16);
  g.fill();
  g.strokeStyle = 'rgba(20,20,22,0.22)';
  g.lineWidth = 1.5;
  g.stroke();

  // Strictly clip needle & scale inside the recessed VU meter glass window!
  g.save();
  g.beginPath();
  g.roundRect(vx + 2, vy + 2, vw - 4, vh - 4, 14);
  g.clip();

  // Analog VU scale arc + fine calibration ticks
  const vcx = vx + vw / 2, vcy = vy + vh + 26, vr = 142;
  g.strokeStyle = C.ink;
  g.lineWidth = 2;
  g.beginPath();
  g.arc(vcx, vcy, vr, -Math.PI * 0.74, -Math.PI * 0.36);
  g.stroke();
  g.strokeStyle = C.orange;
  g.lineWidth = 3.5;
  g.beginPath();
  g.arc(vcx, vcy, vr, -Math.PI * 0.36, -Math.PI * 0.26);
  g.stroke();
  for (let i = 0; i <= 12; i++) {
    const a = lerp(-Math.PI * 0.74, -Math.PI * 0.26, i / 12);
    const hot = i >= 10;
    const major = i % 3 === 0;
    g.strokeStyle = hot ? C.orange : C.inkSoft;
    g.lineWidth = major ? 2 : 1.1;
    g.beginPath();
    g.moveTo(vcx + Math.cos(a) * (vr - (major ? 10 : 6)), vcy + Math.sin(a) * (vr - (major ? 10 : 6)));
    g.lineTo(vcx + Math.cos(a) * vr, vcy + Math.sin(a) * vr);
    g.stroke();
  }

  // VU needle kicking with exact detent clicks!
  let kick = 0;
  for (const dt of detents) {
    if (u >= dt && u < dt + 0.75) kick += Math.exp(-(u - dt) * 6.5) * 0.65;
  }
  const vuAngle = -Math.PI * 0.68 + clamp(0.22 + kick + Math.sin(u * 6.2) * 0.06) * (Math.PI * 0.42);
  g.strokeStyle = C.orange;
  g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(vcx, vcy);
  g.lineTo(vcx + Math.cos(vuAngle) * (vr + 10), vcy + Math.sin(vuAngle) * (vr + 10));
  g.stroke();

  // Subtle recessed dark bezel cap at bottom of meter window
  g.fillStyle = '#18181B';
  g.beginPath();
  g.arc(vcx, vy + vh + 8, 28, Math.PI, Math.PI * 2);
  g.fill();

  setFont(12, 700, '"DIN Alternate", StudioSans, monospace');
  g.fillStyle = C.dim;
  g.textAlign = 'left';
  g.fillText('VU', vx + 18, vy + 26);
  g.textAlign = 'right';
  g.fillStyle = C.orange;
  g.fillText('+3 dB', vx + vw - 18, vy + 26);
  g.restore();

  // Right-bottom crisp editorial callout beside VU meter
  drawClippedLine('02  PRECISE.', dx + 1184, dy + 586, 46, 800, C.ink, expoOut(range(u, 0.25, 0.95)), 'left');
  drawClippedLine('精密的阻尼，', dx + 1184, dy + 638, 28, 600, C.inkSoft, expoOut(range(u, 0.45, 1.15)), 'left', '"Songti SC", "PingFang SC", StudioSans, serif');
  drawClippedLine('是看得见的手感。', dx + 1184, dy + 676, 28, 600, C.orange, expoOut(range(u, 0.60, 1.28)), 'left', '"Songti SC", "PingFang SC", StudioSans, serif');

  // Circular iris zoom wipe from right knob into Act IV Clock Dial!
  const iris = expoInOut(range(u, 4.18, 4.60));
  if (iris > 0.005) {
    g.fillStyle = C.ivory;
    g.beginPath();
    g.arc(W * 0.5, H * 0.5, iris * 1350, 0, Math.PI * 2);
    g.fill();
  }
}

// ============================================================================
// ACT IV (12.40 - 16.80s): 03 TIMELESS — BRAUN AB1 / SWISS MECHANICAL CLOCK
// ============================================================================
function drawAct4(t) {
  const u = t - 12.40;
  fillCeramicBackdrop('ivory');
  drawHeaderFooter('PRINCIPLE 03 / 03', 'TIMELESS FORM', 'MECHANICAL ESCAPEMENT STUDY', '1976 — 2026', C.ink, 0.56);

  const enter = expoOut(range(u, 0.0, 0.85));
  const morphOut = expoInOut(range(u, 3.65, 4.38));

  const cx = lerp(W * 0.60, W * 0.50, morphOut);
  const cy = H * 0.50;
  const R = lerp(330, 14, morphOut) * enter;

  // Left Editorial Column (fades cleanly as dial collapses into the Finale center!)
  g.save();
  g.globalAlpha = 1 - expoOut(range(u, 3.45, 3.95));
  drawClippedLine('03', 84, 345, 174, 900, C.ink, expoOut(range(u, 0.12, 0.88)), 'left', '"Avenir Next Condensed", sans-serif');
  g.fillStyle = C.yellow;
  g.fillRect(86, 378, 86 * enter, 5);
  drawClippedLine('TIMELESS.', 84, 466, 62, 800, C.ink, expoOut(range(u, 0.25, 1.00)), 'left');
  drawClippedLine('对抗时间。', 84, 558, 58, 700, C.ink, expoOut(range(u, 0.40, 1.15)), 'left', '"Songti SC", "PingFang SC", StudioSans, serif');
  drawClippedLine('不追逐流行，', 86, 636, 24, 500, C.inkSoft, expoOut(range(u, 0.58, 1.28)), 'left');
  drawClippedLine('所以永不过时。', 86, 674, 24, 500, C.inkSoft, expoOut(range(u, 0.72, 1.40)), 'left');
  g.restore();

  // Iconic Braun / Swiss Railway Minimalist Clock Face
  if (R > 16) {
    g.save();
    // Soft museum studio shadow under watch housing
    g.shadowColor = 'rgba(18,16,12,0.24)';
    g.shadowBlur = 58;
    g.shadowOffsetX = 14;
    g.shadowOffsetY = 26;
    g.fillStyle = '#18181B';
    g.beginPath();
    g.arc(cx, cy, R + 18, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // Brushed metallic outer steel rim
    const rim = g.createConicGradient(-0.5, cx, cy);
    rim.addColorStop(0, '#D4D1C8');
    rim.addColorStop(0.25, '#FAF8F3');
    rim.addColorStop(0.5, '#9C9990');
    rim.addColorStop(0.75, '#ECE9E1');
    rim.addColorStop(1, '#D4D1C8');
    g.fillStyle = rim;
    g.beginPath();
    g.arc(cx, cy, R + 16, 0, Math.PI * 2);
    g.fill();

    // Deep matte-obsidian Braun dial face
    g.fillStyle = '#141518';
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fill();

    g.save();
    g.globalAlpha = 1 - morphOut * 1.4;
    if (g.globalAlpha > 0.02) {
      // 60 surgical minute/hour markers
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isHour = i % 5 === 0;
        const r1 = R * (isHour ? 0.80 : 0.88);
        const r2 = R * 0.94;
        g.strokeStyle = isHour ? '#F4F2EB' : '#6D6C68';
        g.lineWidth = isHour ? 5.5 : 2;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        g.stroke();
      }
      // Classic Helvetica dial numerals 12 / 3 / 6 / 9
      setFont(Math.round(R * 0.105), 600, '"Helvetica Neue", sans-serif');
      g.fillStyle = '#E8E5DC';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('12', cx, cy - R * 0.67);
      g.fillText('3', cx + R * 0.67, cy);
      g.fillText('6', cx, cy + R * 0.67);
      g.fillText('9', cx - R * 0.67, cy);

      // Hour & Minute hands (clean classic 10:10 aesthetic positioning!)
      const drawHand = (ang, len, width, col) => {
        g.save();
        g.translate(cx, cy);
        g.rotate(ang - Math.PI / 2);
        g.fillStyle = col;
        g.beginPath();
        g.roundRect(-width * 0.5, -width * 0.5, len, width, width * 0.5);
        g.fill();
        g.restore();
      };
      drawHand(Math.PI * 1.69, R * 0.52, 12, '#F4F2EB'); // ~10 o'clock
      drawHand(Math.PI * 0.34, R * 0.74, 8, '#F4F2EB');  // ~10 min

      // Mechanical Swiss Escapement Second Hand (discrete 0.5s beat ticks with authentic spring bounce!)
      const tickRate = 2.0; // crisp 120 BPM double-time watch pulse
      const tickIdx = Math.floor(u * tickRate);
      const tickFrac = (u * tickRate) - tickIdx;
      const steppedSec = tickIdx + springDetent(tickFrac / tickRate, 920, 32);
      const secAngle = ((54 + steppedSec) / 60) * Math.PI * 2 - Math.PI / 2;

      g.save();
      g.translate(cx, cy);
      g.rotate(secAngle);
      g.strokeStyle = C.orange;
      g.lineWidth = 4.2;
      g.beginPath();
      g.moveTo(-R * 0.22, 0);
      g.lineTo(R * 0.82, 0);
      g.stroke();
      // Iconic Mondaine/Braun circular paddle tip on second hand!
      g.fillStyle = C.orange;
      g.beginPath();
      g.arc(R * 0.72, 0, 11, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#F4F2EB';
      g.beginPath();
      g.arc(0, 0, 9, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.restore();
  } else {
    // Collapsed into single tactile orange origin dot ready for Finale!
    drawTactileDot(W * 0.5, H * 0.5, 22, C.orange, 0);
  }
}

// ============================================================================
// ACT V (16.80 - 22.00s): FINALE — LESS, BUT BETTER (SWISS MUSEUM POSTER)
// ============================================================================
function drawAct5(t) {
  const u = t - 16.80;
  fillCeramicBackdrop('ivory');
  drawHeaderFooter('WENIGER, ABER BESSER', '1976 — 2026', 'INDUSTRIAL DESIGN MOTION STUDY', '60 FPS · TACTILE AUDIO', C.ink, 0.54 * expoOut(range(u, 0.2, 1.0)));

  // Three iconic Braun tactile circular indicator buttons snapping into horizontal Swiss triad!
  const triad = [
    { col: C.orange, dx: -76, at: 0.05 },
    { col: C.green,  dx: 0,   at: 0.30 },
    { col: C.yellow, dx: 76,  at: 0.55 }
  ];
  const dotY = 344;
  triad.forEach((d) => {
    const sp = springDetent(u - d.at, 310, 22);
    if (sp > 0.01) {
      const press = u > d.at && u < d.at + 0.22 ? Math.sin(((u - d.at) / 0.22) * Math.PI) : 0;
      drawTactileDot(W * 0.5 + d.dx, dotY, 21 * clamp(sp, 0, 1.15), d.col, press);
    }
  });

  // Monumental Swiss Editorial Poster Lockup
  const p1 = expoOut(range(u, 0.55, 1.45));
  const p2 = expoOut(range(u, 0.85, 1.75));
  const p3 = expoOut(range(u, 1.15, 2.00));

  drawClippedLine('LESS, BUT BETTER.', W * 0.5, 540, 134, 800, C.ink, p1, 'center');
  g.fillStyle = C.ink;
  g.fillRect(W * 0.5 - 260 * p2, 586, 520 * p2, 1.8);
  drawClippedLine('少，却更好。', W * 0.5, 686, 62, 600, C.inkSoft, p2, 'center', '"Songti SC", "PingFang SC", StudioSans, serif');
  drawClippedLine('GOOD DESIGN IS AS LITTLE DESIGN AS POSSIBLE.', W * 0.5, 766, 17, 600, C.dim, p3, 'center', '"DIN Alternate", StudioSans, monospace');
}

function seek(t) {
  const ct = clamp(t, 0, DURATION - 1 / FPS);
  g.save();
  g.reset();
  g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  g.globalAlpha = 1;
  g.shadowColor = 'transparent';
  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 0;

  if (ct < 3.80) drawAct1(ct);
  else if (ct < 7.80) drawAct2(ct);
  else if (ct < 12.40) drawAct3(ct);
  else if (ct < 16.80) drawAct4(ct);
  else drawAct5(ct);

  // Subtle tactile matte paper/ceramic surface grain across entire frame
  g.globalAlpha = 0.65;
  g.fillStyle = GRAIN;
  g.fillRect(0, 0, W, H);
  g.restore();
  return true;
}

  return { seek, layoutCoverage: 'manual-only (editorial canvas)' };
}
