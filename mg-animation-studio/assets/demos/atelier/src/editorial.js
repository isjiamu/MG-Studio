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

function lineMask(text, progress, style = '') {
  const y = lerp(115, 0, clamp(progress));
  const op = clamp(progress * 2.2);
  return `<span class="clip-line" style="${style}"><span style="transform:translateY(${y.toFixed(2)}%);opacity:${op.toFixed(3)}">${text}</span></span>`;
}

export function createEditorial(backEl, frontEl) {
  function cornerMeta(leftTop, rightTop, leftBot, rightBot, ink, alpha = 0.62) {
    return `
      <div class="font-mono" style="position:absolute;top:52px;left:72px;font-size:14px;letter-spacing:0.26em;color:${ink};opacity:${alpha};font-weight:500;">${leftTop}</div>
      <div class="font-mono" style="position:absolute;top:52px;right:72px;font-size:14px;letter-spacing:0.26em;color:${ink};opacity:${alpha};font-weight:500;">${rightTop}</div>
      <div class="font-mono" style="position:absolute;bottom:48px;left:72px;font-size:13px;letter-spacing:0.24em;color:${ink};opacity:${(alpha * 0.8).toFixed(2)};font-weight:500;">${leftBot}</div>
      <div class="font-mono" style="position:absolute;bottom:48px;right:72px;font-size:13px;letter-spacing:0.24em;color:${ink};opacity:${(alpha * 0.8).toFixed(2)};font-weight:500;">${rightBot}</div>
    `;
  }

  function seek(t) {
    let back = '';
    let front = '';

    // =========================================================================
    // ACT I (0.00 - 3.20s): SILENCE ON PAPER — Warm Gallery Ivory (#F3EFE6)
    // =========================================================================
    if (t < 3.20) {
      const p1 = expoOut(range(t, 0.08, 0.95));
      const pSub = expoOut(range(t, 0.38, 1.15));
      const slash = expoInOut(range(t, 1.18, 1.62));
      const lift = expoInOut(range(t, 1.32, 1.92));
      const swallow = expoIn(range(t, 2.25, 3.16));

      // Subtle architectural drafting lines on warm museum paper
      back = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 44%, #F9F6EF 0%, #EFEAE0 72%, #E6E0D3 100%);"></div>
        <div style="position:absolute;left:72px;right:72px;top:96px;height:1px;background:rgba(15,15,18,0.09);"></div>
        <div style="position:absolute;left:72px;right:72px;bottom:92px;height:1px;background:rgba(15,15,18,0.09);"></div>
        <div style="position:absolute;top:96px;bottom:92px;left:50%;width:1px;background:rgba(15,15,18,0.06);"></div>
        <!-- Colossal ghost serif numeral behind -->
        <div class="font-serif" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:560px;font-weight:400;color:rgba(15,15,18,0.032);letter-spacing:-0.04em;transform:scale(${lerp(1.06, 1.0, p1).toFixed(4)});">IV</div>
      `;

      const titleY = lerp(0, -285, lift);
      const titleFade = 1 - expoInOut(range(t, 1.58, 2.02));
      const titleOp = clamp(titleFade * (1 - swallow * 2.5));
      front = `
        ${cornerMeta('GOOGLE DEEPMIND / 2026', 'MATTER OF LIGHT', 'ACT 01 — SILENCE', 'PERIODIC SYSTEM', '#111114', 0.56 * (1 - swallow * 2.2))}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:translateY(${titleY.toFixed(1)}px);opacity:${titleOp.toFixed(3)};">
          <div class="font-sans" style="font-size:15px;letter-spacing:0.42em;color:#6A655D;margin-bottom:26px;font-weight:600;">
            ${lineMask('NOT TIERS. NOT LABELS.', pSub)}
          </div>
          <div style="position:relative;display:inline-block;">
            <div class="font-sans" style="font-size:138px;font-weight:800;letter-spacing:-0.02em;color:#0E0E11;line-height:1.05;">
              ${lineMask('告别分级。', p1)}
            </div>
            <!-- Razor vermilion strike-through whip -->
            <div style="position:absolute;left:-28px;top:52%;height:8px;width:${(slash * 108).toFixed(2)}%;background:#FF3B1D;transform-origin:left center;"></div>
          </div>
        </div>
        ${swallow > 0.72 ? `<div style="position:absolute;inset:0;background:#FF3B1D;opacity:${clamp((swallow - 0.72) / 0.25).toFixed(3)};"></div>` : ''}
      `;
    }

    // =========================================================================
    // ACT II (3.20 - 5.60s): INTERNATIONAL VERMILION SLAM -> APERTURE SPLIT
    // =========================================================================
    else if (t < 5.60) {
      const u = t - 3.20;
      const slide = expoOut(range(u, 0.0, 1.10));
      const cnIn = expoOut(range(u, 0.35, 1.18));
      const shutter = expoInOut(range(u, 1.82, 2.38));

      const topX = lerp(-420, -40, slide);
      const botX = lerp(420, 40, slide);

      back = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, #FF4929 0%, #FF3B1D 58%, #E1270B 100%);"></div>
        <!-- Monumental opposing kinetic condensed Latin type -->
        <div class="font-cond" style="position:absolute;top:110px;left:0;right:0;text-align:center;font-size:330px;font-weight:900;line-height:0.84;letter-spacing:0.06em;color:rgba(244,240,231,0.16);transform:translateX(${topX.toFixed(1)}px);">ELEMENTS</div>
        <div class="font-cond" style="position:absolute;bottom:108px;left:0;right:0;text-align:center;font-size:330px;font-weight:900;line-height:0.84;letter-spacing:0.06em;color:rgba(12,12,15,0.16);transform:translateX(${botX.toFixed(1)}px);">GEMINI IV</div>
      `;

      // Physical horizontal aperture split to obsidian!
      const slitH = shutter * 560;
      front = `
        ${cornerMeta('FOUR ELEMENTS', 'H · C · Ne · Ar', 'ACT 02 — GENESIS', '124 BPM', '#F6F2EA', 0.85 * (1 - shutter))}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:${(1 - shutter * 1.4).toFixed(3)};">
          <div class="font-serif" style="font-size:118px;font-weight:700;color:#F7F3EA;letter-spacing:0.08em;line-height:1.1;">
            ${lineMask('以元素，定义智能。', cnIn)}
          </div>
          <div class="font-mono" style="margin-top:30px;font-size:17px;letter-spacing:0.44em;color:rgba(247,243,234,0.86);">
            ${lineMask('H  ·  C  ·  Ne  ·  Ar', expoOut(range(u, 0.58, 1.32)))}
          </div>
        </div>
        ${shutter > 0.005 ? `
          <div style="position:absolute;left:0;right:0;top:${(540 - slitH).toFixed(1)}px;height:${(slitH * 2).toFixed(1)}px;background:#050609;border-top:2px solid rgba(255,255,255,0.55);border-bottom:2px solid rgba(255,255,255,0.55);"></div>
        ` : ''}
      `;
    }

    // =========================================================================
    // ACT III (5.60 - 10.40s): 01 H HYDROGEN — LIQUID CHROME ON VELVET OBSIDIAN
    // =========================================================================
    else if (t < 10.40) {
      const u = t - 5.60;
      const inP = expoOut(range(u, 0.08, 1.05));
      const subP = expoOut(range(u, 0.35, 1.25));
      const flash = expoIn(range(u, 4.35, 4.80));

      back = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 56% 50%, #101624 0%, #06070B 62%, #030406 100%);"></div>
        <!-- Architectural hairline horizon & orbital arc -->
        <svg width="1920" height="1080" style="position:absolute;inset:0;opacity:0.22;">
          <line x1="72" y1="540" x2="1848" y2="540" stroke="#9CB6D4" stroke-width="0.8" />
          <circle cx="1015" cy="540" r="390" fill="none" stroke="#9CB6D4" stroke-width="0.8" stroke-dasharray="4 10" />
        </svg>
        <!-- Monumental depth typography BEHIND the 3D liquid chrome sculpture -->
        <div class="font-cond" style="position:absolute;left:64px;top:128px;font-size:520px;font-weight:900;line-height:0.82;color:rgba(220,238,255,0.055);letter-spacing:-0.03em;transform:translateY(${lerp(40, 0, inP).toFixed(1)}px);">01</div>
        <div class="font-cond" style="position:absolute;right:56px;bottom:86px;font-size:210px;font-weight:800;line-height:0.85;letter-spacing:0.06em;color:transparent;-webkit-text-stroke:1.2px rgba(170,225,255,0.16);transform:translateX(${lerp(60, 0, inP).toFixed(1)}px);">HYDROGEN</div>
      `;

      front = `
        ${cornerMeta('ELEMENT 01 / 04', 'ATOMIC MASS 1.008', 'GEMINI 4 HYDROGEN', '1M CONTEXT · $1.50', '#E8F2FC', 0.52)}
        <!-- Left lower-third Swiss editorial title lockup -->
        <div style="position:absolute;left:84px;bottom:146px;display:flex;align-items:flex-end;gap:34px;">
          <div class="font-sans" style="font-size:172px;font-weight:800;line-height:0.84;color:#F4F9FF;letter-spacing:-0.04em;">
            ${lineMask('H', inP)}
          </div>
          <div style="width:1px;height:122px;background:rgba(160,224,255,0.45);transform:scaleY(${inP.toFixed(3)});transform-origin:bottom;"></div>
          <div style="padding-bottom:6px;">
            <div class="font-mono" style="font-size:15px;letter-spacing:0.32em;color:#8CE6FF;margin-bottom:14px;">
              ${lineMask('HYDROGEN  ·  氢', subP)}
            </div>
            <div class="font-serif" style="font-size:66px;font-weight:700;color:#FFFFFF;line-height:1.08;letter-spacing:0.04em;">
              ${lineMask('生于极速。', expoOut(range(u, 0.45, 1.35)))}
            </div>
            <div class="font-sans" style="font-size:18px;letter-spacing:0.14em;color:rgba(218,236,255,0.68);margin-top:16px;font-weight:400;">
              ${lineMask('TERMINAL-BENCH 57%  ·  3.1× 跃升', expoOut(range(u, 0.70, 1.55)))}
            </div>
          </div>
        </div>
        <!-- Specular ivory surge flash match-cut into Carbon Gallery Ivory -->
        ${flash > 0.01 ? `<div style="position:absolute;inset:0;background:#F2EEE6;opacity:${flash.toFixed(3)};"></div>` : ''}
      `;
    }

    // =========================================================================
    // ACT IV (10.40 - 15.20s): 06 C CARBON — OBSIDIAN DIAMOND ON SUNLIT IVORY!
    // =========================================================================
    else if (t < 15.20) {
      const u = t - 10.40;
      const inP = expoOut(range(u, 0.08, 1.05));
      const subP = expoOut(range(u, 0.35, 1.25));
      const diagWipe = expoInOut(range(u, 4.30, 4.80));

      back = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 55% 44%, #FAF7F0 0%, #EFEBE2 64%, #E3DDD0 100%);"></div>
        <!-- Colossal sculptural stone-emboss word BEHIND the floating black diamond -->
        <div class="font-cond" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:395px;font-weight:900;letter-spacing:0.08em;color:#E2DBD0;transform:translateX(${lerp(50, -15, u / 4.8).toFixed(1)}px);">CARBON</div>
        <svg width="1920" height="1080" style="position:absolute;inset:0;opacity:0.14;">
          <line x1="72" y1="96" x2="1848" y2="96" stroke="#141311" stroke-width="1" />
          <line x1="72" y1="984" x2="1848" y2="984" stroke="#141311" stroke-width="1" />
        </svg>
      `;

      // Diagonal black obsidian facet wipe matching crystal cut angle!
      const wp = lerp(145, -45, diagWipe);
      front = `
        ${cornerMeta('ELEMENT 02 / 04', 'ATOMIC MASS 12.011', 'GEMINI 4 CARBON', 'SEC-BENCH 88.2% · 0.0% IPI', '#141311', 0.58)}
        <!-- Top-left sculptural atomic index -->
        <div style="position:absolute;left:84px;top:148px;">
          <div class="font-cond" style="font-size:150px;font-weight:900;line-height:0.86;color:#0E0E11;letter-spacing:-0.02em;">
            ${lineMask('06', inP)}
          </div>
          <div style="width:76px;height:3px;background:#C8943E;margin:18px 0;transform:scaleX(${inP.toFixed(3)});transform-origin:left;"></div>
          <div class="font-mono" style="font-size:16px;letter-spacing:0.30em;color:#6B655B;font-weight:600;">
            ${lineMask('C · CARBON · 碳', subP)}
          </div>
        </div>
        <!-- Bottom-left high-fashion editorial statement -->
        <div style="position:absolute;left:84px;bottom:136px;">
          <div class="font-serif" style="font-size:82px;font-weight:700;color:#0D0D10;line-height:1.06;letter-spacing:0.03em;">
            ${lineMask('旗舰深思。', expoOut(range(u, 0.30, 1.25)))}
          </div>
          <div class="font-sans" style="font-size:19px;letter-spacing:0.16em;color:#5D5850;margin-top:16px;font-weight:500;">
            ${lineMask('长程推理与安全防线  ·  零妥协基石', expoOut(range(u, 0.62, 1.48)))}
          </div>
        </div>
        ${diagWipe > 0.005 ? `
          <div style="position:absolute;inset:0;background:#050408;clip-path:polygon(${wp.toFixed(1)}% 0%, 100% 0%, 100% 100%, ${(wp - 38).toFixed(1)}% 100%);"></div>
        ` : ''}
      `;
    }

    // =========================================================================
    // ACT V-A (15.20 - 18.40s): 10 Ne NEON — INCANDESCENT GLASS TORUS KNOT
    // =========================================================================
    else if (t < 18.40) {
      const u = t - 15.20;
      const inP = expoOut(range(u, 0.06, 0.92));
      const subP = expoOut(range(u, 0.28, 1.10));
      const pulse = 0.5 + 0.5 * Math.sin(u * 12.98);

      back = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 52% 50%, #1E0A16 0%, #09050B 56%, #040306 100%);"></div>
        <!-- Monumental outlined neon chemical symbol BEHIND the glowing 3D torus knot -->
        <div class="font-sans" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:560px;font-weight:900;letter-spacing:-0.04em;color:transparent;-webkit-text-stroke:2px rgba(255,78,52,${(0.24 + 0.14 * pulse).toFixed(3)});transform:scale(${lerp(1.12, 1.0, inP).toFixed(4)});">Ne</div>
      `;

      front = `
        ${cornerMeta('ELEMENT 03 / 04', 'NOV 18, 2026 · LATEST', 'GEMINI 4 NEON', 'PARETO FRONTIER #1', '#FFF0EA', 0.64)}
        <!-- Top-left glowing vermilion dot + edition tag -->
        <div style="position:absolute;left:84px;top:148px;display:flex;align-items:center;gap:14px;opacity:${inP.toFixed(3)};">
          <span style="width:11px;height:11px;border-radius:50%;background:#FF3B1D;box-shadow:0 0 18px #FF3B1D;"></span>
          <span class="font-mono" style="font-size:15px;letter-spacing:0.32em;color:#FF7B61;font-weight:600;">10 · Ne · 昨日全新发布</span>
        </div>
        <!-- Bottom-left monumental white title -->
        <div style="position:absolute;left:84px;bottom:136px;">
          <div class="font-sans" style="font-size:132px;font-weight:900;color:#FFFFFF;line-height:0.92;letter-spacing:-0.03em;">
            ${lineMask('NEON', inP)}
          </div>
          <div class="font-serif" style="font-size:42px;font-weight:600;color:#FFD5C8;letter-spacing:0.08em;margin-top:18px;">
            ${lineMask('速度与智慧的奇点。', subP)}
          </div>
        </div>
        <!-- Bottom-right whisper pricing -->
        <div style="position:absolute;right:84px;bottom:146px;text-align:right;opacity:${subP.toFixed(3)};">
          <div class="font-cond" style="font-size:54px;font-weight:800;color:#FF5A3C;letter-spacing:0.02em;">$3 / $15</div>
          <div class="font-mono" style="font-size:14px;letter-spacing:0.24em;color:rgba(255,220,210,0.62);margin-top:6px;">CACHED INPUT $0.15 · -95%</div>
        </div>
      `;
    }

    // =========================================================================
    // ACT V-B (18.40 - 20.40s): APPLE "DON'T BLINK" 3-BEAT TYPOGRAPHIC SLAM!
    // =========================================================================
    else if (t < 20.40) {
      if (t < 19.05) {
        // Beat 1: Pure Gallery Ivory / Black Ink -> ~110 tok/s
        const b = expoOut(range(t, 18.40, 18.74));
        const sc = lerp(1.16, 1.0, b);
        back = `<div style="position:absolute;inset:0;background:#F3EFE6;"></div>`;
        front = `
          ${cornerMeta('GEMINI 4 NEON', 'VELOCITY', '01 / 03', 'OUTPUT THROUGHPUT', '#111114', 0.55)}
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(${sc.toFixed(4)});">
            <div class="font-cond" style="font-size:360px;font-weight:900;color:#0B0B0E;line-height:0.86;letter-spacing:-0.03em;">~110</div>
            <div class="font-sans" style="margin-top:26px;font-size:28px;font-weight:700;letter-spacing:0.32em;color:#FF3B1D;">TOK/S  ·  疾速涌现</div>
          </div>
        `;
      } else if (t < 19.70) {
        // Beat 2: Full-Bleed International Vermilion / Ivory Ink -> 1,000,000
        const b = expoOut(range(t, 19.05, 19.38));
        const sc = lerp(0.88, 1.0, b);
        back = `<div style="position:absolute;inset:0;background:#FF3B1D;"></div>`;
        front = `
          ${cornerMeta('ALL 4 ELEMENTS', 'HORIZON', '02 / 03', 'UNIFIED MULTIMODAL', '#F7F3EA', 0.85)}
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(${sc.toFixed(4)});">
            <div class="font-cond" style="font-size:268px;font-weight:900;color:#F7F3EA;line-height:0.88;letter-spacing:-0.02em;">1,000,000</div>
            <div class="font-sans" style="margin-top:28px;font-size:28px;font-weight:700;letter-spacing:0.32em;color:#140907;">TOKENS  ·  原生无界上下文</div>
          </div>
        `;
      } else {
        // Beat 3: Velvet Obsidian / Glowing Coral & Pure White -> 61
        const b = expoOut(range(t, 19.70, 20.06));
        const sc = lerp(1.18, 1.0, b);
        back = `<div style="position:absolute;inset:0;background:#050508;"></div>`;
        front = `
          ${cornerMeta('ARTIFICIAL ANALYSIS V5.0', 'BENCHMARK', '03 / 03', 'XHIGH EFFORT', '#FFFFFF', 0.55)}
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(${sc.toFixed(4)});">
            <div class="font-cond" style="font-size:390px;font-weight:900;background:linear-gradient(135deg,#FFFFFF 0%,#FF9D82 55%,#FF3B1D 100%);-webkit-background-clip:text;color:transparent;line-height:0.84;letter-spacing:-0.03em;">61</div>
            <div class="font-sans" style="margin-top:24px;font-size:28px;font-weight:700;letter-spacing:0.32em;color:#F3EFE6;">INTELLIGENCE INDEX  ·  全系登顶</div>
          </div>
        `;
      }
    }

    // =========================================================================
    // ACT VI (20.40 - 24.40s): 18 Ar ARGON — OPTICAL PRISM & CHROMATIC SPECTRUM
    // =========================================================================
    else if (t < 24.40) {
      const u = t - 20.40;
      const inP = expoOut(range(u, 0.08, 0.95));
      const subP = expoOut(range(u, 0.32, 1.18));
      const beam = expoOut(range(u, 0.18, 1.25));
      const whiteBloom = expoIn(range(u, 3.55, 4.00));

      // Authentic physical light ray (incoming white beam left -> refracted rainbow spectrum fan right!)
      back = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 46% 50%, #10132A 0%, #060712 62%, #030308 100%);"></div>
        <div class="font-cond" style="position:absolute;left:72px;bottom:74px;font-size:500px;font-weight:900;line-height:0.80;color:rgba(148,136,255,0.06);letter-spacing:-0.04em;">18</div>
        <svg width="1920" height="1080" style="position:absolute;inset:0;">
          <defs>
            <linearGradient id="inRay" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255,255,255,0)" />
              <stop offset="100%" stop-color="rgba(255,255,255,0.92)" />
            </linearGradient>
            <linearGradient id="spec1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(120,100,255,0.52)" />
              <stop offset="100%" stop-color="rgba(120,100,255,0.0)" />
            </linearGradient>
            <linearGradient id="spec2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(64,218,255,0.48)" />
              <stop offset="100%" stop-color="rgba(64,218,255,0.0)" />
            </linearGradient>
            <linearGradient id="spec3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255,90,150,0.42)" />
              <stop offset="100%" stop-color="rgba(255,90,150,0.0)" />
            </linearGradient>
            <filter id="blurSoft"><feGaussianBlur stdDeviation="16" /></filter>
          </defs>
          <!-- Incoming pure white ray from left -->
          <line x1="${lerp(820, 0, beam).toFixed(1)}" y1="${lerp(540, 620, beam).toFixed(1)}" x2="865" y2="532" stroke="url(#inRay)" stroke-width="4" opacity="${beam.toFixed(3)}" />
          <line x1="${lerp(820, 0, beam).toFixed(1)}" y1="${lerp(540, 620, beam).toFixed(1)}" x2="865" y2="532" stroke="#FFFFFF" stroke-width="14" opacity="${(beam * 0.16).toFixed(3)}" filter="url(#blurSoft)" />
          <!-- Refracted chromatic dispersion spectrum fanning right -->
          <g opacity="${(beam * 0.92).toFixed(3)}" filter="url(#blurSoft)">
            <polygon points="940,515 1920,250 1920,415" fill="url(#spec3)" />
            <polygon points="940,530 1920,400 1920,575" fill="url(#spec2)" />
            <polygon points="940,545 1920,555 1920,765" fill="url(#spec1)" />
          </g>
        </svg>
      `;

      front = `
        ${cornerMeta('ELEMENT 04 / 04', 'ATOMIC MASS 39.948', 'GEMINI 4 ARGON', '3D PERIODIC · 1M OUTPUT', '#E6ECFF', 0.56)}
        <!-- Top-left crisp element signature -->
        <div style="position:absolute;left:84px;top:148px;">
          <div class="font-sans" style="font-size:138px;font-weight:800;color:#F4F7FF;line-height:0.88;letter-spacing:-0.03em;">
            ${lineMask('Ar', inP)}
          </div>
          <div class="font-mono" style="font-size:15px;letter-spacing:0.32em;color:#A59BFF;margin-top:16px;">
            ${lineMask('ARGON  ·  氩  ·  空间先锋', subP)}
          </div>
        </div>
        <!-- Bottom-right poetic editorial statement -->
        <div style="position:absolute;right:84px;bottom:136px;text-align:right;">
          <div class="font-serif" style="font-size:74px;font-weight:700;color:#FFFFFF;line-height:1.1;letter-spacing:0.04em;">
            ${lineMask('重构空间，重塑代码。', expoOut(range(u, 0.25, 1.18)))}
          </div>
          <div class="font-sans" style="font-size:18px;letter-spacing:0.18em;color:rgba(195,208,245,0.72);margin-top:18px;">
            ${lineMask('ANTIGRAVITY 3D 周期表  ·  ORCHESTRATOR 多模型协同', expoOut(range(u, 0.55, 1.40)))}
          </div>
        </div>
        ${whiteBloom > 0.01 ? `<div style="position:absolute;inset:0;background:#F3EFE6;opacity:${whiteBloom.toFixed(3)};"></div>` : ''}
      `;
    }

    // =========================================================================
    // ACT VII (24.40 - 28.00s): MUSEUM GALLERY FINALE — GEMINI 4
    // =========================================================================
    else {
      const u = t - 24.40;
      const tIn = expoOut(range(u, 0.22, 1.25));
      const sIn = expoOut(range(u, 0.48, 1.48));
      const fIn = expoOut(range(u, 0.78, 1.68));

      back = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 38%, #FAF7F1 0%, #F1EDE4 65%, #E5DFD3 100%);"></div>
        <svg width="1920" height="1080" style="position:absolute;inset:0;opacity:0.12;">
          <line x1="72" y1="96" x2="1848" y2="96" stroke="#111114" stroke-width="1" />
          <line x1="72" y1="984" x2="1848" y2="984" stroke="#111114" stroke-width="1" />
          <circle cx="960" cy="396" r="245" fill="none" stroke="#111114" stroke-width="0.9" stroke-dasharray="3 9" />
        </svg>
      `;

      front = `
        ${cornerMeta('GOOGLE DEEPMIND', 'NOVEMBER 2026', 'AI STUDIO · VERTEX AI · ANTIGRAVITY', 'THE PERIODIC ERA', '#121216', 0.52 * fIn)}
        <!-- Museum-poster bottom lockup cleanly below the 3D sculptural Gemini Star & 4 totems -->
        <div style="position:absolute;left:0;right:0;bottom:108px;display:flex;flex-direction:column;align-items:center;">
          <div class="font-sans" style="font-size:138px;font-weight:900;color:#0C0C0F;letter-spacing:0.06em;line-height:0.94;">
            ${lineMask('GEMINI 4', tIn)}
          </div>
          <div style="width:${(440 * sIn).toFixed(1)}px;height:1.5px;background:#121216;margin:22px 0 20px 0;opacity:0.75;"></div>
          <div class="font-serif" style="font-size:36px;font-weight:600;color:#26252B;letter-spacing:0.22em;">
            ${lineMask('元素之形，光之智能。', sIn)}
          </div>
          <div class="font-mono" style="margin-top:28px;font-size:15px;letter-spacing:0.34em;color:#6E6A61;opacity:${fIn.toFixed(3)};display:flex;gap:42px;">
            <span>01 <b style="color:#111114;">H</b> HYDROGEN</span>
            <span>06 <b style="color:#111114;">C</b> CARBON</span>
            <span>10 <b style="color:#FF3B1D;">Ne</b> NEON</span>
            <span>18 <b style="color:#111114;">Ar</b> ARGON</span>
          </div>
        </div>
      `;
    }

    backEl.innerHTML = back;
    frontEl.innerHTML = front;
  }

  return { seek };
}
