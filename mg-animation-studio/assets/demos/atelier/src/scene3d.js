import * as THREE from 'three';

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
const cubicOut = p => 1 - Math.pow(1 - clamp(p), 3);

// Procedural Studio Softbox Environment Map (Cinema4D / Octane style high-contrast strip lights)
function buildStudioEnv(renderer, mode = 'dark') {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(mode === 'light' ? 0xdad4c8 : 0x05060a);

  const addPanel = (w, h, color, intensity, pos, lookAt = [0, 0, 0]) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(...pos);
    mesh.lookAt(...lookAt);
    envScene.add(mesh);
  };

  if (mode === 'light') {
    // Sunlit museum studio: giant warm skylight + crisp side bounce + dark contrast strips for obsidian edges!
    addPanel(16, 10, 0xfffaf0, 3.2, [0, 9, 2]);
    addPanel(10, 8, 0xffe8c2, 2.6, [9, 3, 6]);
    addPanel(8, 10, 0xe8f0ff, 1.9, [-9, 4, 4]);
    addPanel(14, 3, 0xffd28a, 2.2, [0, -6, 8]);
    // Dark negative-fill panels so metallic & obsidian surfaces get razor-sharp contrast!
    addPanel(12, 12, 0x0c0c10, 1.0, [-6, -2, -8]);
    addPanel(12, 12, 0x101014, 1.0, [7, -3, -7]);
  } else {
    // High-contrast dark studio: piercing pure-white softbox strips + subtle cool/warm rim accents
    addPanel(14, 3.2, 0xffffff, 4.8, [0, 8.5, 4]);
    addPanel(3.5, 14, 0xd8f0ff, 3.6, [-10, 2, 5]);
    addPanel(3.2, 12, 0xffe6d0, 3.2, [10, 3, 3]);
    addPanel(10, 2.4, 0x8cb8ff, 2.0, [0, -7, 6]);
    addPanel(6, 6, 0xff7050, 1.2, [6, -4, -8]);
  }

  const rt = pmrem.fromScene(envScene, 0.025);
  pmrem.dispose();
  return rt.texture;
}

// Custom GLSL Liquid Chrome Sculpture (Act III — Hydrogen)
function createHydrogenGroup(darkEnv) {
  const group = new THREE.Group();

  // High-res organic displaced liquid-mercury core
  const geo = new THREE.IcosahedronGeometry(1.52, 64);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xeaf4ff,
    metalness: 1.0,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMap: darkEnv,
    envMapIntensity: 1.85,
    iridescence: 0.85,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [180, 480]
  });

  const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.24 } };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmp = uniforms.uAmp;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        uniform float uAmp;
        float hWave(vec3 p, float t) {
          float w1 = sin(p.x * 2.1 + t * 1.9) * cos(p.y * 1.8 - t * 1.4) * sin(p.z * 2.0 + t * 1.1);
          float w2 = sin(p.y * 3.4 + p.z * 2.7 - t * 2.4) * 0.42;
          float w3 = cos(p.x * 4.2 - p.z * 3.1 + t * 2.9) * 0.18;
          return (w1 + w2 + w3) * uAmp;
        }
      `)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        vec3 p0 = position;
        float eps = 0.025;
        vec3 nBase = normalize(p0);
        vec3 tangent1 = normalize(abs(nBase.y) < 0.99 ? cross(nBase, vec3(0.0, 1.0, 0.0)) : cross(nBase, vec3(1.0, 0.0, 0.0)));
        vec3 tangent2 = normalize(cross(nBase, tangent1));
        vec3 pA = normalize(p0 + tangent1 * eps) * length(p0);
        vec3 pB = normalize(p0 + tangent2 * eps) * length(p0);
        vec3 d0 = p0 + nBase * hWave(p0, uTime);
        vec3 dA = pA + normalize(pA) * hWave(pA, uTime);
        vec3 dB = pB + normalize(pB) * hWave(pB, uTime);
        objectNormal = normalize(cross(dA - d0, dB - d0));
      `)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed = position + normalize(position) * hWave(position, uTime);
      `);
  };

  const blob = new THREE.Mesh(geo, mat);
  group.add(blob);

  // Orbiting razor-thin chrome ring + single fast hydrogen electron droplet
  const ringGeo = new THREE.TorusGeometry(2.38, 0.011, 16, 180);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.1,
    envMap: darkEnv,
    envMapIntensity: 2.0
  });
  const orbitRing = new THREE.Mesh(ringGeo, ringMat);
  orbitRing.rotation.set(1.18, 0.34, 0.2);
  group.add(orbitRing);

  const satGeo = new THREE.SphereGeometry(0.14, 32, 32);
  const satMat = new THREE.MeshPhysicalMaterial({
    color: 0x9cf8ff,
    emissive: 0x20a8cc,
    emissiveIntensity: 0.65,
    metalness: 0.85,
    roughness: 0.06,
    envMap: darkEnv,
    envMapIntensity: 2.2
  });
  const electron = new THREE.Mesh(satGeo, satMat);
  group.add(electron);

  // Micro chrome satellites
  const minis = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (i % 3) * 0.018, 24, 24), mat);
    group.add(m);
    minis.push(m);
  }

  return { group, blob, orbitRing, electron, minis, uniforms };
}

// Act IV — Carbon: Monumental Faceted Obsidian Black Diamond on Sunlit Gallery Ivory
function createCarbonGroup(lightEnv) {
  const group = new THREE.Group();

  // Sharp flat-shaded faceted black obsidian crystal
  const crystalGeo = new THREE.OctahedronGeometry(1.58, 1);
  // Subtle architectural elongation along vertical axis (precious diamond cut!)
  crystalGeo.scale(0.92, 1.24, 0.92);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0c10,
    metalness: 0.90,
    roughness: 0.09,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    flatShading: true,
    envMap: lightEnv,
    envMapIntensity: 1.95
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  group.add(crystal);

  // Subtle razor-thin champagne-gold wireframe bevels etched along the diamond facets
  const edgesGeo = new THREE.EdgesGeometry(crystalGeo, 12);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xd9a85b,
    transparent: true,
    opacity: 0.48
  });
  const edges = new THREE.LineSegments(edgesGeo, edgesMat);
  crystal.add(edges);

  // Precision brushed-gold architectural orbital ring
  const goldRingGeo = new THREE.TorusGeometry(2.26, 0.018, 20, 200);
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6b868,
    metalness: 0.98,
    roughness: 0.16,
    clearcoat: 0.6,
    envMap: lightEnv,
    envMapIntensity: 1.7
  });
  const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
  goldRing.rotation.set(1.24, -0.32, 0.15);
  group.add(goldRing);

  // Soft gallery floor contact shadow (procedural radial gradient texture!)
  const shCanvas = document.createElement('canvas');
  shCanvas.width = 256; shCanvas.height = 256;
  const ctx = shCanvas.getContext('2d');
  const gr = ctx.createRadialGradient(128, 128, 6, 128, 128, 124);
  gr.addColorStop(0, 'rgba(18, 15, 10, 0.34)');
  gr.addColorStop(0.45, 'rgba(18, 15, 10, 0.14)');
  gr.addColorStop(1, 'rgba(18, 15, 10, 0.0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 4.8),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -2.18;
  group.add(shadowPlane);

  return { group, crystal, goldRing, shadowPlane };
}

// Act V — Neon: Sculptural Incandescent Glass Neon Torus Knot (True Glow + Fresnel Shader)
function createNeonGroup(darkEnv) {
  const group = new THREE.Group();

  // Outer glossy incandescent Fresnel glass knot (deep noir glass + blazing saturated neon plasma rim!)
  const knotGeo = new THREE.TorusKnotGeometry(1.14, 0.24, 280, 56, 2, 3);
  const neonUniforms = {
    uTime: { value: 0 },
    uPower: { value: 1.0 }
  };
  const neonMat = new THREE.ShaderMaterial({
    uniforms: neonUniforms,
    transparent: false,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uPower;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = pow(1.0 - ndv, 2.2);
        float innerTube = pow(ndv, 3.2);

        // Flowing high-voltage neon plasma wave along tube
        float flow = 0.5 + 0.5 * sin(vUv.x * 18.8495 - uTime * 3.6 + vWorldPos.y * 1.2);

        vec3 noirGlass   = vec3(0.03, 0.008, 0.025);
        vec3 crimsonNeon = vec3(1.00, 0.14, 0.04);    // Blazing authentic Neon Vermilion
        vec3 magentaGlow = vec3(1.00, 0.05, 0.44);    // Electric Magenta plasma
        vec3 whiteCore   = vec3(1.00, 0.88, 0.68);    // Hot white-gold inner gas filament

        vec3 plasma = mix(crimsonNeon, magentaGlow, smoothstep(0.28, 0.82, flow));

        // Deep dark glass center + blazing saturated rim + hot filament stripe!
        vec3 col = noirGlass;
        col += plasma * (0.28 + 1.55 * fresnel) * uPower;
        col += crimsonNeon * innerTube * (0.55 + 0.45 * flow) * uPower;
        col += whiteCore * pow(ndv, 7.5) * (0.55 + 0.45 * flow) * uPower;

        // Razor-sharp white studio softbox specular reflection on blown glass surface
        vec3 L1 = normalize(vec3(0.45, 0.82, 0.90));
        vec3 L2 = normalize(vec3(-0.75, -0.35, 0.65));
        float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 110.0);
        float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 60.0);
        col += vec3(1.0, 0.97, 0.94) * spec1 * 1.35;
        col += vec3(1.0, 0.40, 0.60) * spec2 * 0.45;

        // Preserve deep saturation (no muddy gray knee!)
        col = clamp(col, 0.0, 1.0);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const knot = new THREE.Mesh(knotGeo, neonMat);
  group.add(knot);

  // Soft volumetric additive bloom halo behind/around the knot
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 512; glowCanvas.height = 512;
  const gctx = glowCanvas.getContext('2d');
  const ggrad = gctx.createRadialGradient(256, 256, 12, 256, 256, 256);
  ggrad.addColorStop(0.0, 'rgba(255, 62, 32, 0.56)');
  ggrad.addColorStop(0.32, 'rgba(255, 22, 92, 0.28)');
  ggrad.addColorStop(0.65, 'rgba(170, 10, 75, 0.07)');
  ggrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  gctx.fillStyle = ggrad;
  gctx.fillRect(0, 0, 512, 512);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  }));
  halo.scale.set(7.6, 7.6, 1);
  halo.position.z = -0.8;
  group.add(halo);

  // Circular soft bokeh sprite texture (never square pixels!)
  const bokehCanvas = document.createElement('canvas');
  bokehCanvas.width = 64; bokehCanvas.height = 64;
  const bctx = bokehCanvas.getContext('2d');
  const bgr = bctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  bgr.addColorStop(0.0, 'rgba(255, 240, 220, 1.0)');
  bgr.addColorStop(0.35, 'rgba(255, 110, 82, 0.75)');
  bgr.addColorStop(1.0, 'rgba(255, 40, 90, 0.0)');
  bctx.fillStyle = bgr;
  bctx.fillRect(0, 0, 64, 64);
  const bokehTex = new THREE.CanvasTexture(bokehCanvas);

  // Floating incandescent bokeh orbs (deterministic seeded)
  const emberCount = 36;
  const emberPos = new Float32Array(emberCount * 3);
  let seed = 9001;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const emberMeta = [];
  for (let i = 0; i < emberCount; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = 2.0 + rnd() * 2.9;
    const y = (rnd() - 0.5) * 3.8;
    emberMeta.push({ a, rad, y, spd: 0.22 + rnd() * 0.48 });
    emberPos[i * 3] = Math.cos(a) * rad;
    emberPos[i * 3 + 1] = y;
    emberPos[i * 3 + 2] = Math.sin(a) * rad * 0.6;
  }
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const emberMat = new THREE.PointsMaterial({
    map: bokehTex,
    color: 0xffb8a0,
    size: 0.16,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  group.add(embers);

  return { group, knot, halo, embers, emberMeta, neonUniforms };
}

// Act VI — Argon: Sculptural Chromatic Optical Glass Prism & Gyroscope Rings
function createArgonGroup(darkEnv) {
  const group = new THREE.Group();

  // Elongated chamfered triangular optical prism
  const shape = new THREE.Shape();
  const R = 1.32;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  const prismGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 2.35,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.08,
    bevelSegments: 4
  });
  prismGeo.center();

  const prismUniforms = { uTime: { value: 0 } };
  const prismMat = new THREE.ShaderMaterial({
    uniforms: prismUniforms,
    transparent: true,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      vec3 spectrum(float x) {
        // Iridescent thin-film optical dispersion (Klein blue -> violet -> cyan -> warm gold)
        vec3 a = vec3(0.42, 0.45, 0.65);
        vec3 b = vec3(0.48, 0.42, 0.48);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.55, 0.72, 0.92);
        return clamp(a + b * cos(6.28318 * (c * x + d)), 0.0, 1.0);
      }
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = pow(1.0 - ndv, 2.2);

        float disp = fresnel * 1.4 + vWorldPos.x * 0.22 + vWorldPos.y * 0.18 + uTime * 0.14;
        vec3 irid = spectrum(disp);
        vec3 baseGlass = vec3(0.06, 0.08, 0.18);

        vec3 L1 = normalize(vec3(-0.7, 0.6, 0.8));
        vec3 L2 = normalize(vec3(0.8, -0.3, 0.6));
        float s1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 90.0);
        float s2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 48.0);

        vec3 col = mix(baseGlass, irid, 0.30 + 0.70 * fresnel);
        col += vec3(0.95, 0.97, 1.0) * s1 * 1.45;
        col += irid * s2 * 0.75;
        col += vec3(0.48, 0.36, 1.0) * fresnel * 0.65;

        float alpha = clamp(0.76 + 0.24 * fresnel + s1 * 0.25, 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  group.add(prism);

  // Crisp optical edge highlights along prism ridges
  const prismEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(prismGeo, 24),
    new THREE.LineBasicMaterial({ color: 0xc2d4ff, transparent: true, opacity: 0.62 })
  );
  prism.add(prismEdges);

  // Interlocking ultra-fine brushed silver & violet kinetic rings
  const ringMat1 = new THREE.MeshPhysicalMaterial({
    color: 0xd8e0ff, metalness: 1.0, roughness: 0.12, envMap: darkEnv, envMapIntensity: 2.0
  });
  const ringMat2 = new THREE.MeshPhysicalMaterial({
    color: 0x8d6eff, metalness: 0.9, roughness: 0.15, envMap: darkEnv, envMapIntensity: 1.9
  });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.012, 16, 180), ringMat1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.68, 0.010, 16, 180), ringMat2);
  group.add(ring1, ring2);

  return { group, prism, ring1, ring2, prismUniforms };
}

// Act VII — Finale: 4 Sculptural Material Totems + Faceted Sculptural 3D Obsidian Diamond Gemini Star
function createFinaleGroup(lightEnv) {
  const group = new THREE.Group();

  // Sculptural 4-pointed faceted diamond star (raised front/back apex -> dramatic jewelry-grade facet reflections!)
  const tips = [
    [0, 1.38], [0.27, 0.27],
    [1.38, 0], [0.27, -0.27],
    [0, -1.38], [-0.27, -0.27],
    [-1.38, 0], [-0.27, 0.27]
  ];
  const positions = [];
  const apexZ = 0.44;
  for (let i = 0; i < tips.length; i++) {
    const [x1, y1] = tips[i];
    const [x2, y2] = tips[(i + 1) % tips.length];
    // Front facet triangle (CCW)
    positions.push(0, 0, apexZ, x2, y2, 0, x1, y1, 0);
    // Back facet triangle (CCW)
    positions.push(0, 0, -apexZ, x1, y1, 0, x2, y2, 0);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  starGeo.computeVertexNormals();

  const starMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0c11,
    metalness: 0.94,
    roughness: 0.07,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    flatShading: true,
    iridescence: 0.65,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [180, 480],
    envMap: lightEnv,
    envMapIntensity: 2.15
  });
  const star = new THREE.Mesh(starGeo, starMat);
  // Subtle razor-fine champagne-gold ridge lines along the cut diamond star facets
  const starEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(starGeo, 5),
    new THREE.LineBasicMaterial({ color: 0xe6be78, transparent: true, opacity: 0.42 })
  );
  star.add(starEdges);
  group.add(star);

  // 4 Miniature Sculptural Element Totems flanking the star
  const totems = [
    // H: Liquid Chrome Sphere
    new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 48, 48),
      new THREE.MeshPhysicalMaterial({ color: 0xeaf4ff, metalness: 1.0, roughness: 0.05, clearcoat: 1.0, iridescence: 0.8, envMap: lightEnv, envMapIntensity: 2.0 })
    ),
    // C: Faceted Black Diamond
    new THREE.Mesh(
      new THREE.OctahedronGeometry(0.44, 1),
      new THREE.MeshPhysicalMaterial({ color: 0x0d0e12, metalness: 0.92, roughness: 0.08, clearcoat: 1.0, flatShading: true, envMap: lightEnv, envMapIntensity: 2.0 })
    ),
    // Ne: Glossy Vermilion Coral Glass Torus
    new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.13, 32, 64),
      new THREE.MeshPhysicalMaterial({ color: 0xff3b1d, emissive: 0x661205, emissiveIntensity: 0.35, metalness: 0.35, roughness: 0.08, clearcoat: 1.0, envMap: lightEnv, envMapIntensity: 1.8 })
    ),
    // Ar: Iridescent Faceted Crystal
    new THREE.Mesh(
      new THREE.OctahedronGeometry(0.44, 0),
      new THREE.MeshPhysicalMaterial({ color: 0x5c4cff, metalness: 0.85, roughness: 0.06, clearcoat: 1.0, iridescence: 1.0, iridescenceThicknessRange: [150, 500], envMap: lightEnv, envMapIntensity: 2.1 })
    )
  ];
  for (const m of totems) group.add(m);

  // Soft gallery floor contact shadow under star
  const shCanvas = document.createElement('canvas');
  shCanvas.width = 256; shCanvas.height = 256;
  const ctx = shCanvas.getContext('2d');
  const gr = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  gr.addColorStop(0, 'rgba(18, 16, 12, 0.24)');
  gr.addColorStop(0.55, 'rgba(18, 16, 12, 0.08)');
  gr.addColorStop(1, 'rgba(18, 16, 12, 0.0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 256, 256);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.8),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCanvas), transparent: true, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.68;
  group.add(shadowPlane);

  return { group, star, totems, shadowPlane };
}

// Act I — Glossy Lacquer Vermilion Sphere (drops on gallery ivory -> swallows camera!)
function createIntroSphere(lightEnv) {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 64, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xe8250c,
      metalness: 0.04,
      roughness: 0.07,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMap: lightEnv,
      envMapIntensity: 1.05
    })
  );
  group.add(sphere);

  const shCanvas = document.createElement('canvas');
  shCanvas.width = 256; shCanvas.height = 256;
  const ctx = shCanvas.getContext('2d');
  const gr = ctx.createRadialGradient(128, 128, 6, 128, 128, 120);
  gr.addColorStop(0, 'rgba(30, 12, 8, 0.30)');
  gr.addColorStop(0.5, 'rgba(30, 12, 8, 0.10)');
  gr.addColorStop(1, 'rgba(30, 12, 8, 0.0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCanvas), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.82;
  group.add(shadow);

  return { group, sphere, shadow };
}

export function createScene3D(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
  });
  renderer.setSize(1920, 1080, false);
  renderer.setPixelRatio(1.5); // crisp supersampling on Apple M5 Max Metal GPU!
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1920 / 1080, 0.1, 100);
  camera.position.set(0, 0, 7.6);

  // Studio Lights
  const keyLight = new THREE.DirectionalLight(0xfff7ea, 2.6);
  keyLight.position.set(5, 7, 6);
  const rimLight = new THREE.DirectionalLight(0xc2e2ff, 2.0);
  rimLight.position.set(-6, 3, -4);
  const fillLight = new THREE.PointLight(0xff5a36, 1.8, 18);
  fillLight.position.set(4, -3, 4);
  scene.add(keyLight, rimLight, fillLight);

  const darkEnv = buildStudioEnv(renderer, 'dark');
  const lightEnv = buildStudioEnv(renderer, 'light');

  const intro = createIntroSphere(lightEnv);
  const hydrogen = createHydrogenGroup(darkEnv);
  const carbon = createCarbonGroup(lightEnv);
  const neon = createNeonGroup(darkEnv);
  const argon = createArgonGroup(darkEnv);
  const finale = createFinaleGroup(lightEnv);

  scene.add(intro.group, hydrogen.group, carbon.group, neon.group, argon.group, finale.group);

  function hideAll() {
    intro.group.visible = false;
    hydrogen.group.visible = false;
    carbon.group.visible = false;
    neon.group.visible = false;
    argon.group.visible = false;
    finale.group.visible = false;
  }

  function seek(t) {
    hideAll();
    camera.position.set(0, 0, 7.6);
    camera.lookAt(0, 0, 0);
    renderer.toneMappingExposure = 1.12;

    // ACT I (0.00 - 3.20s): Vermilion Gloss Sphere drops on Ivory Gallery -> swells to swallow lens!
    if (t >= 1.35 && t < 3.20) {
      intro.group.visible = true;
      const drop = range(t, 1.40, 2.15);
      // Gravity drop with crisp single bounce
      let y;
      if (drop < 0.62) {
        const q = drop / 0.62;
        y = lerp(3.4, -0.14, q * q);
      } else {
        const q = (drop - 0.62) / 0.38;
        y = -0.14 + Math.sin(q * Math.PI) * 0.42 * (1 - q * 0.35);
      }
      const swell = expoIn(range(t, 2.25, 3.16));
      const sc = lerp(1.0, 18.5, swell);
      intro.sphere.position.set(0, lerp(y, 0, swell), lerp(0, 2.6, swell));
      intro.sphere.scale.setScalar(sc);
      intro.shadow.visible = swell < 0.25;
      const shScale = clamp(1.15 - Math.max(0, y + 0.14) * 0.22, 0.25, 1.2);
      intro.shadow.scale.setScalar(shScale);
      intro.shadow.material.opacity = (1 - swell * 4) * shScale;
    }

    // ACT III (5.60 - 10.40s): Hydrogen — Liquid Chrome Sculpture
    else if (t >= 5.60 && t < 10.40) {
      const u = t - 5.60;
      hydrogen.group.visible = true;
      hydrogen.uniforms.uTime.value = u * 1.15;
      hydrogen.uniforms.uAmp.value = 0.22 + 0.05 * Math.sin(u * 1.4);

      const enter = expoOut(range(u, 0.0, 0.95));
      const punch = expoIn(range(u, 4.30, 4.80));
      const baseSc = lerp(0.55, 1.06, enter) + punch * 3.8;
      hydrogen.group.scale.setScalar(baseSc);
      hydrogen.group.position.set(lerp(0.35, 0.22, u / 4.8), Math.sin(u * 1.2) * 0.06, 0);
      hydrogen.blob.rotation.set(u * 0.28, u * 0.52, 0.12);

      // Orbiting electron + subtle micro-droplets
      const ea = u * 2.85 + 0.6;
      const rVec = new THREE.Vector3(Math.cos(ea) * 2.38, Math.sin(ea) * 2.38, 0);
      rVec.applyEuler(hydrogen.orbitRing.rotation);
      hydrogen.electron.position.copy(rVec);

      hydrogen.minis.forEach((m, i) => {
        const a = u * (1.2 + i * 0.22) + i * 1.15;
        const rad = 1.92 + (i % 3) * 0.34;
        m.position.set(Math.cos(a) * rad, Math.sin(a * 1.3 + i) * 0.85, Math.sin(a) * rad * 0.7);
      });

      camera.position.set(Math.sin(u * 0.35) * 0.55, Math.cos(u * 0.28) * 0.22, lerp(8.1, 6.9, u / 4.8));
      camera.lookAt(0.15, 0, 0);
    }

    // ACT IV (10.40 - 15.20s): Carbon — Monumental Faceted Black Diamond on Sunlit Ivory Gallery
    else if (t >= 10.40 && t < 15.20) {
      const u = t - 10.40;
      carbon.group.visible = true;
      renderer.toneMappingExposure = 1.22;
      const enter = expoOut(range(u, 0.0, 1.05));
      carbon.group.scale.setScalar(lerp(0.72, 1.02, enter));
      carbon.group.position.set(0.35, 0.08 + Math.sin(u * 1.1) * 0.07, 0);
      carbon.crystal.rotation.set(0.24 + Math.sin(u * 0.6) * 0.12, u * 0.62 + 0.4, 0.08);
      carbon.goldRing.rotation.set(1.24 + Math.sin(u * 0.7) * 0.15, -0.32 + u * 0.38, 0.15);
      carbon.shadowPlane.position.y = -2.18 - Math.sin(u * 1.1) * 0.07;

      camera.position.set(lerp(-0.4, 0.5, u / 4.8), 0.28, lerp(7.8, 7.1, u / 4.8));
      camera.lookAt(0.25, -0.05, 0);
    }

    // ACT V-A (15.20 - 18.40s): Neon — Sculptural Incandescent Glass Torus Knot
    else if (t >= 15.20 && t < 18.40) {
      const u = t - 15.20;
      neon.group.visible = true;
      neon.neonUniforms.uTime.value = u;
      // Authentic subtle neon ignition flicker in first 0.28s, then pure bright glow!
      const ignite = u < 0.28 ? (0.35 + 0.65 * Math.abs(Math.sin(u * 48.0))) : 1.0;
      neon.neonUniforms.uPower.value = ignite * (1.0 + 0.14 * Math.sin(u * 12.98)); // synced to 124 BPM!

      const enter = expoOut(range(u, 0.0, 0.85));
      neon.group.scale.setScalar(lerp(0.68, 1.06, enter));
      neon.group.position.set(0.18, 0.06, 0);
      neon.knot.rotation.set(0.35 + u * 0.42, u * 0.68, Math.sin(u * 0.9) * 0.18);
      neon.halo.material.opacity = 0.88 * ignite;

      const posAttr = neon.embers.geometry.attributes.position;
      for (let i = 0; i < neon.emberMeta.length; i++) {
        const em = neon.emberMeta[i];
        const a = em.a + u * em.spd;
        posAttr.setXYZ(i, Math.cos(a) * em.rad, em.y + Math.sin(u * 1.4 + i) * 0.22, Math.sin(a) * em.rad * 0.6);
      }
      posAttr.needsUpdate = true;

      camera.position.set(Math.sin(u * 0.5) * 0.45, 0.1, lerp(7.9, 6.8, u / 3.2));
      camera.lookAt(0.12, 0.04, 0);
    }

    // ACT VI (20.40 - 24.40s): Argon — Sculptural Chromatic Optical Glass Prism
    else if (t >= 20.40 && t < 24.40) {
      const u = t - 20.40;
      argon.group.visible = true;
      argon.prismUniforms.uTime.value = u;
      const enter = expoOut(range(u, 0.0, 0.85));
      argon.group.scale.setScalar(lerp(0.62, 0.94, enter));
      argon.group.position.set(-0.22, 0.18, 0);
      argon.prism.rotation.set(0.36 + Math.sin(u * 0.8) * 0.14, u * 0.68 + 0.52, 0.26);
      argon.ring1.rotation.set(1.15 + u * 0.35, u * 0.42, 0.2);
      argon.ring2.rotation.set(-0.82 - u * 0.28, u * 0.55, -0.4);

      camera.position.set(lerp(0.55, -0.35, u / 4.0), 0.16, lerp(8.0, 7.1, u / 4.0));
      camera.lookAt(-0.14, 0.08, 0);
    }

    // ACT VII (24.40 - 28.00s): Finale — 4 Sculptural Material Totems + Front-Facing 3D Gemini Star
    else if (t >= 24.40) {
      const u = t - 24.40;
      finale.group.visible = true;
      renderer.toneMappingExposure = 1.18;
      finale.group.position.set(0, 0.96, 0);

      const enter = expoOut(range(u, 0.0, 1.10));
      // Keep iconic 4-pointed diamond star facing front with subtle sculptural gallery sway!
      finale.star.scale.setScalar(lerp(0.01, 0.82, enter));
      finale.star.rotation.set(
        Math.cos(u * 0.8) * 0.09,
        Math.sin(u * 0.95) * 0.24 + (1 - enter) * 0.85,
        Math.sin(u * 0.6) * 0.04
      );
      finale.shadowPlane.position.y = -1.35;

      const xTargets = [-3.15, -1.85, 1.85, 3.15];
      finale.totems.forEach((m, i) => {
        const tp = expoOut(range(u, 0.14 + i * 0.09, 1.22 + i * 0.09));
        m.position.set(lerp(0, xTargets[i], tp), Math.sin(u * 1.8 + i * 1.3) * 0.08, lerp(-1.0, 0, tp));
        m.scale.setScalar(lerp(0.01, 0.78, tp));
        m.rotation.set(u * 0.55 + i, u * 0.8 + i * 0.5, i * 0.3);
      });

      camera.position.set(0, 0.18, lerp(8.4, 7.85, cubicOut(range(u, 0, 1.4))));
      camera.lookAt(0, 0.12, 0);
    }

    renderer.render(scene, camera);
  }

  return { seek };
}
