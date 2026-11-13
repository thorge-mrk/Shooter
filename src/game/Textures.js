import * as THREE from 'three';

export const SKIN_CATALOG = [
  {
    id: 'factory',
    name: 'Factory Tactical',
    pattern: 'brushed',
    primary: '#475569',
    secondary: '#26303d',
    accent: '#94a3b8',
    cloth: '#334155',
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.52,
    roughness: 0.36,
    clearcoat: 0.22
  },
  {
    id: 'carbon',
    name: 'Forged Carbon',
    pattern: 'carbon',
    primary: '#242b38',
    secondary: '#3b4454',
    accent: '#38bdf8',
    cloth: '#1e2430',
    emissive: '#0ea5e9',
    emissiveIntensity: 0.45,
    metalness: 0.44,
    roughness: 0.24,
    clearcoat: 0.68
  },
  {
    id: 'desert_camo',
    aliases: ['desert_viper'],
    name: 'Desert Viper',
    pattern: 'camo',
    primary: '#c9a978',
    secondary: '#7d623e',
    accent: '#d97706',
    cloth: '#a6895e',
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.28,
    roughness: 0.56,
    clearcoat: 0.12
  },
  {
    id: 'arctic_camo',
    aliases: ['arctic_wolf'],
    name: 'Arctic Wolf',
    pattern: 'splinter',
    primary: '#e2ebf3',
    secondary: '#64748b',
    accent: '#38bdf8',
    cloth: '#cbd5e1',
    emissive: '#38bdf8',
    emissiveIntensity: 0.32,
    metalness: 0.32,
    roughness: 0.4,
    clearcoat: 0.28
  },
  {
    id: 'naval',
    aliases: ['abyssal'],
    name: 'Abyssal Maritime',
    pattern: 'kevlar',
    primary: '#1e3a6e',
    secondary: '#0f1e3d',
    accent: '#06b6d4',
    cloth: '#172554',
    emissive: '#06b6d4',
    emissiveIntensity: 0.45,
    metalness: 0.46,
    roughness: 0.34,
    clearcoat: 0.38
  },
  {
    id: 'woodland',
    name: 'Woodland Stalker',
    pattern: 'camo',
    primary: '#4d6b45',
    secondary: '#2b3b26',
    accent: '#d97706',
    cloth: '#44593e',
    emissive: '#000000',
    emissiveIntensity: 0.0,
    metalness: 0.26,
    roughness: 0.58,
    clearcoat: 0.1
  },
  {
    id: 'ceramic',
    name: 'Ballistic Cermet',
    pattern: 'ceramic',
    primary: '#e2e8f0',
    secondary: '#334155',
    accent: '#f97316',
    cloth: '#475569',
    emissive: '#f97316',
    emissiveIntensity: 0.36,
    metalness: 0.38,
    roughness: 0.22,
    clearcoat: 0.74
  },
  {
    id: 'crimson',
    name: 'Crimson Vanguard',
    pattern: 'carbon',
    primary: '#991b1b',
    secondary: '#1f2024',
    accent: '#ef4444',
    cloth: '#27272a',
    emissive: '#ef4444',
    emissiveIntensity: 0.52,
    metalness: 0.54,
    roughness: 0.26,
    clearcoat: 0.58
  },
  {
    id: 'cobalt',
    name: 'Cobalt Prototype',
    pattern: 'hex',
    primary: '#1d4ed8',
    secondary: '#1e293b',
    accent: '#38bdf8',
    cloth: '#172554',
    emissive: '#38bdf8',
    emissiveIntensity: 0.58,
    metalness: 0.56,
    roughness: 0.28,
    clearcoat: 0.52
  },
  {
    id: 'damascus',
    name: 'Damascus Valor',
    pattern: 'damascus',
    primary: '#3f3f46',
    secondary: '#71717a',
    accent: '#eab308',
    cloth: '#27272a',
    emissive: '#ca8a04',
    emissiveIntensity: 0.38,
    metalness: 0.68,
    roughness: 0.22,
    clearcoat: 0.68
  }
];

const SKIN_ALIAS_MAP = {
  desert_viper: 'desert_camo',
  arctic_wolf: 'arctic_camo',
  abyssal: 'naval'
};

export function resolveSkinCatalogEntry(skinId = 'factory') {
  const key = String(skinId || 'factory').toLowerCase().trim();
  const mapped = SKIN_ALIAS_MAP[key] || key;
  return (
    SKIN_CATALOG.find((s) => s.id === mapped || (s.aliases && s.aliases.includes(key))) ||
    SKIN_CATALOG[0]
  );
}

function createCanvas(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function makeRepeatTexture(canvas, repeatX = 1, repeatY = 1, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function seededNoise(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Converts a grayscale height canvas into a true tangent-space RGB Normal Map using Sobel derivatives,
 * plus a matched Roughness/AO canvas.
 */
function buildNormalAndRoughnessFromHeight(heightCanvas, strength = 2.4, baseRoughness = 180, roughBiasCanvas = null) {
  const size = heightCanvas.width;
  const hctx = heightCanvas.getContext('2d');
  const src = hctx.getImageData(0, 0, size, size).data;
  const biasData = roughBiasCanvas
    ? roughBiasCanvas.getContext('2d').getImageData(0, 0, size, size).data
    : null;

  const normCanvas = createCanvas(size);
  const nctx = normCanvas.getContext('2d');
  const normImg = nctx.createImageData(size, size);
  const ndst = normImg.data;

  const roughCanvas = createCanvas(size);
  const rctx = roughCanvas.getContext('2d');
  const roughImg = rctx.createImageData(size, size);
  const rdst = roughImg.data;

  const sampleH = (x, y) => {
    const wx = (x + size) % size;
    const wy = (y + size) % size;
    return src[(wy * size + wx) * 4] / 255.0;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = sampleH(x - 1, y - 1);
      const t = sampleH(x, y - 1);
      const tr = sampleH(x + 1, y - 1);
      const l = sampleH(x - 1, y);
      const c = sampleH(x, y);
      const r = sampleH(x + 1, y);
      const bl = sampleH(x - 1, y + 1);
      const b = sampleH(x, y + 1);
      const br = sampleH(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dz = 1.0;
      const inv = 1.0 / Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      ndst[idx] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      ndst[idx + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      ndst[idx + 2] = Math.round((dz * inv * 0.5 + 0.5) * 255);
      ndst[idx + 3] = 255;

      // Pack AO (R), Roughness (G), Metalness modulation (B)
      const bias = biasData ? (biasData[idx + 1] - 128) * 0.65 : 0;
      const ao = Math.min(255, Math.max(80, Math.round(188 + (c - 0.5) * 140)));
      const rough = Math.min(255, Math.max(24, Math.round(baseRoughness - (c - 0.5) * 95 + bias)));
      rdst[idx] = ao;
      rdst[idx + 1] = rough;
      rdst[idx + 2] = Math.min(255, Math.max(20, 255 - rough));
      rdst[idx + 3] = 255;
    }
  }

  nctx.putImageData(normImg, 0, 0);
  rctx.putImageData(roughImg, 0, 0);
  return { normCanvas, roughCanvas };
}

/**
 * Creates a material adapted to the 3 required Graphics Presets:
 * - 'ultra' (ULTRA 4K): MeshPhysicalMaterial with clearcoat, full Normal/Roughness/AO/Emissive maps
 * - 'balanced' (HIGH BALANCED): MeshStandardMaterial with Normal/Roughness/Emissive maps
 * - 'fast' (HD PERFORMANCE): MeshLambertMaterial with zero extra texture samplers for peak FPS
 */
export function createQualityMaterial(params = {}, quality = 'balanced') {
  if (quality === 'fast') {
    return new THREE.MeshLambertMaterial({
      color: params.color ?? 0xffffff,
      map: params.map || null,
      emissive: params.emissive ?? 0x000000,
      emissiveMap: params.emissiveMap || null,
      emissiveIntensity: params.emissiveIntensity ?? 0,
      transparent: Boolean(params.transparent),
      opacity: params.opacity ?? 1.0,
      side: params.side ?? THREE.FrontSide
    });
  }

  if (quality === 'ultra') {
    return new THREE.MeshPhysicalMaterial({
      color: params.color ?? 0xffffff,
      map: params.map || null,
      normalMap: params.normalMap || null,
      normalScale: params.normalScale || new THREE.Vector2(0.85, 0.85),
      roughnessMap: params.roughnessMap || null,
      roughness: params.roughness ?? 0.65,
      metalness: params.metalness ?? 0.15,
      clearcoat: params.clearcoat ?? 0.12,
      clearcoatRoughness: params.clearcoatRoughness ?? 0.35,
      emissive: params.emissive ?? 0x000000,
      emissiveMap: params.emissiveMap || null,
      emissiveIntensity: params.emissiveIntensity ?? 0,
      transparent: Boolean(params.transparent),
      opacity: params.opacity ?? 1.0,
      side: params.side ?? THREE.FrontSide
    });
  }

  return new THREE.MeshStandardMaterial({
    color: params.color ?? 0xffffff,
    map: params.map || null,
    normalMap: params.normalMap || null,
    normalScale: params.normalScale || new THREE.Vector2(0.65, 0.65),
    roughnessMap: params.roughnessMap || null,
    roughness: params.roughness ?? 0.68,
    metalness: params.metalness ?? 0.15,
    emissive: params.emissive ?? 0x000000,
    emissiveMap: params.emissiveMap || null,
    emissiveIntensity: params.emissiveIntensity ?? 0,
    transparent: Boolean(params.transparent),
    opacity: params.opacity ?? 1.0,
    side: params.side ?? THREE.FrontSide
  });
}

export function createTerminalDisplayTexture({
  title = 'SYS-NODE // COLDBORE',
  subtitle = 'TACTICAL UPLINK ONLINE',
  lines = ['SECTOR STATUS: NOMINAL', 'ARMOR TELEMETRY: SYNCED', 'AMMUNITION BAY: ACTIVE'],
  accentHex = '#38bdf8',
  bgHex = '#09131f'
} = {}) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle CRT scanlines & grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Outer frame
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 492, 236);

  // Header bar
  ctx.fillStyle = accentHex;
  ctx.fillRect(10, 10, 492, 42);
  ctx.fillStyle = '#040911';
  ctx.font = 'bold 21px monospace';
  ctx.fillText(title, 24, 38);

  // Subtitle & telemetry bars
  ctx.fillStyle = accentHex;
  ctx.font = 'bold 16px monospace';
  ctx.fillText(subtitle, 24, 78);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '15px monospace';
  lines.forEach((line, i) => {
    ctx.fillText(`> ${line}`, 24, 114 + i * 28);
  });

  // Waveform / status bar at bottom
  for (let i = 0; i < 16; i++) {
    const h = 10 + ((i * 19) % 26);
    ctx.fillStyle = i % 3 === 0 ? accentHex : 'rgba(148, 163, 184, 0.45)';
    ctx.fillRect(320 + i * 10, 224 - h, 6, h);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class TextureLibrary {
  constructor() {
    this.cache = new Map();
    this.skinCache = new Map();
  }

  getTextureSet(kind, repeatX = 1, repeatY = 1, anisotropy = 4) {
    const key = `${kind}:${repeatX}:${repeatY}`;
    if (this.cache.has(key)) return this.cache.get(key);

    let raw;
    if (kind === 'sandstone') raw = this._buildSandDunes(repeatX, repeatY);
    else if (kind === 'concrete') raw = this._buildConcrete(repeatX, repeatY);
    else if (kind === 'marbleColumn') raw = this._buildMarbleColumn(repeatX, repeatY);
    else if (kind === 'rockCliff') raw = this._buildRockCliff(repeatX, repeatY);
    else if (kind === 'asphalt') raw = this._buildAsphalt(repeatX, repeatY);
    else if (kind === 'mossyStone') raw = this._buildMossyStone(repeatX, repeatY);
    else if (kind === 'bark') raw = this._buildBark(repeatX, repeatY);
    else if (kind === 'containerBlue') raw = this._buildContainer('#1c4d78', '#123352', '#e2e8f0', repeatX, repeatY);
    else if (kind === 'containerRust') raw = this._buildContainer('#8f3d23', '#612715', '#fed7aa', repeatX, repeatY);
    else if (kind === 'containerOlive') raw = this._buildContainer('#3f5939', '#2b3e27', '#d9f99d', repeatX, repeatY);
    else if (kind === 'containerYellow') raw = this._buildContainer('#b47b19', '#85580f', '#1e293b', repeatX, repeatY);
    else if (kind === 'crateWood') raw = this._buildCrate(repeatX, repeatY);
    else if (kind === 'harborDeck') raw = this._buildHarborDeck(repeatX, repeatY);
    else if (kind === 'snow') raw = this._buildSnow(repeatX, repeatY);
    else if (kind === 'steel') raw = this._buildSteel(repeatX, repeatY);
    else if (kind === 'tankArmor') raw = this._buildTankArmor(repeatX, repeatY);
    else raw = this._buildConcrete(repeatX, repeatY);

    raw.map.anisotropy = anisotropy;
    if (raw.normalMap) raw.normalMap.anisotropy = anisotropy;
    if (raw.roughnessMap) raw.roughnessMap.anisotropy = anisotropy;
    if (raw.bumpMap) raw.bumpMap.anisotropy = anisotropy;
    this.cache.set(key, raw);
    return raw;
  }

  getSkinTextureSet(skinId = 'factory', anisotropy = 4) {
    return this._buildSkinSet(skinId, anisotropy);
  }

  /**
   * Builds crisp 256x256 procedural PBR skin maps (`map`, `roughnessMap`, `normalMap`, `emissiveMap`)
   * with rich micro-surface detail tailored to each of the 10 skins in SKIN_CATALOG.
   */
  _buildSkinSet(id = 'factory', anisotropy = 4) {
    const spec = resolveSkinCatalogEntry(id);
    if (this.skinCache.has(spec.id)) {
      return this.skinCache.get(spec.id);
    }

    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const h = createCanvas(size);
    const hctx = h.getContext('2d');
    const rBias = createCanvas(size);
    const rbctx = rBias.getContext('2d');
    const e = createCanvas(size);
    const ectx = e.getContext('2d');

    const rand = seededNoise(spec.id.charCodeAt(0) * 131 + spec.id.length * 53 + 17);

    // Initialize canvases
    ctx.fillStyle = spec.primary;
    ctx.fillRect(0, 0, size, size);
    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, size, size);
    rbctx.fillStyle = '#808080';
    rbctx.fillRect(0, 0, size, size);
    ectx.fillStyle = '#000000';
    ectx.fillRect(0, 0, size, size);

    const drawHexagon = (context, cx, cy, radius) => {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i + Math.PI / 6;
        const hx = cx + Math.cos(ang) * radius;
        const hy = cy + Math.sin(ang) * radius;
        if (i === 0) context.moveTo(hx, hy);
        else context.lineTo(hx, hy);
      }
      context.closePath();
    };

    if (spec.id === 'factory') {
      // FACTORY TACTICAL: Fine matte Parkerized manganese-phosphate steel grain,
      // subtle CNC machined receiver toolpaths, and realistic metallic edge wear along bevels.
      ctx.fillStyle = '#3f4b5b';
      ctx.fillRect(0, 0, size, size);

      // Isotropic Parkerized phosphate micro-speckle
      for (let i = 0; i < 6500; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const v = Math.floor(46 + rand() * 42);
        ctx.fillStyle = `rgb(${v},${v + 7},${v + 16})`;
        ctx.fillRect(x, y, 1.6, 1.6);
        const hv = Math.floor(114 + rand() * 28);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 1.5, 1.5);
      }

      // Subtle horizontal CNC machined toolpath striations
      for (let y = 0; y < size; y += 2) {
        const alpha = 0.025 + rand() * 0.035;
        ctx.fillStyle = y % 4 === 0 ? `rgba(226, 232, 240, ${alpha})` : `rgba(15, 23, 42, ${alpha})`;
        ctx.fillRect(0, y, size, 1);
        hctx.fillStyle = y % 4 === 0 ? 'rgba(155,155,155,0.28)' : 'rgba(105,105,105,0.28)';
        hctx.fillRect(0, y, size, 1);
      }

      // Machined receiver fuller channels & bevel seams
      const seamYs = [44, 128, 212];
      for (const sy of seamYs) {
        ctx.fillStyle = '#252f3d';
        ctx.fillRect(0, sy - 3, size, 6);
        hctx.fillStyle = '#404040';
        hctx.fillRect(0, sy - 3, size, 6);
        // Metallic edge wear highlight along bevel lip
        ctx.fillStyle = 'rgba(186, 200, 218, 0.55)';
        ctx.fillRect(0, sy - 4, size, 1.5);
        ctx.fillRect(0, sy + 3, size, 1.5);
        hctx.fillStyle = '#b8b8b8';
        hctx.fillRect(0, sy - 4, size, 1.5);
        // Lower roughness (shinier metal) on worn edges
        rbctx.fillStyle = '#383838';
        rbctx.fillRect(0, sy - 4, size, 2);
        rbctx.fillRect(0, sy + 3, size, 2);
      }

      // Micro edge wear scratches along bevels
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.42)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 140; i++) {
        const sy = seamYs[i % seamYs.length] + (rand() < 0.5 ? -4 : 3.5);
        const sx = rand() * size;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (rand() - 0.3) * 14, sy + (rand() - 0.5) * 3);
        ctx.stroke();
      }
    } else if (spec.id === 'carbon') {
      // FORGED / 2x2 TWILL CARBON: High-contrast 2x2 twill carbon-fiber diagonal weave
      // with directional sheen, clearcoat gloss highlights, and titanium fastener accents.
      ctx.fillStyle = '#141923';
      ctx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#4a4a4a';
      hctx.fillRect(0, 0, size, size);

      const cell = 8;
      for (let y = 0; y < size; y += cell / 2) {
        for (let x = 0; x < size; x += cell / 2) {
          const tx = Math.floor(x / (cell / 2));
          const ty = Math.floor(y / (cell / 2));
          const phase = (tx + ty) % 4;
          const isWarp = phase < 2;

          if (isWarp) {
            const grad = ctx.createLinearGradient(x, y, x + cell / 2, y + cell / 2);
            grad.addColorStop(0, '#1e2532');
            grad.addColorStop(0.5, '#475569');
            grad.addColorStop(1, '#1a212d');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, cell / 2 - 0.5, cell / 2 - 0.5);

            // Anisotropic fiber thread highlight
            ctx.fillStyle = 'rgba(148, 163, 184, 0.24)';
            ctx.fillRect(x + 1, y + 1, cell / 2 - 2, 1);

            hctx.fillStyle = phase === 0 ? '#d2d2d2' : '#b8b8b8';
            hctx.fillRect(x, y, cell / 2 - 1, cell / 2 - 1);
            rbctx.fillStyle = '#484848';
            rbctx.fillRect(x, y, cell / 2 - 1, cell / 2 - 1);
          } else {
            const grad = ctx.createLinearGradient(x, y + cell / 2, x + cell / 2, y);
            grad.addColorStop(0, '#121720');
            grad.addColorStop(0.5, '#2b3444');
            grad.addColorStop(1, '#10141c');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, cell / 2 - 0.5, cell / 2 - 0.5);

            hctx.fillStyle = phase === 2 ? '#787878' : '#626262';
            hctx.fillRect(x, y, cell / 2 - 1, cell / 2 - 1);
            rbctx.fillStyle = '#969696';
            rbctx.fillRect(x, y, cell / 2 - 1, cell / 2 - 1);
          }
        }
      }

      // Machined titanium channel + fastener accents
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 120, size, 16);
      hctx.fillStyle = '#383838';
      hctx.fillRect(0, 120, size, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 127, size, 2);
      ectx.fillStyle = '#0ea5e9';
      ectx.fillRect(0, 127, size, 2);

      for (let fx = 24; fx < size; fx += 64) {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(fx, 128, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(fx, 128, 2.2, 0, Math.PI * 2);
        ctx.fill();
        hctx.fillStyle = '#e0e0e0';
        hctx.beginPath();
        hctx.arc(fx, 128, 5, 0, Math.PI * 2);
        hctx.fill();
      }
    } else if (spec.id === 'desert_camo') {
      // DESERT VIPER: Multi-scale arid digital/tiger-stripe camo with ripstop Cordura
      // fabric micro-grid + FDE Cerakote metallic finish.
      ctx.fillStyle = '#c8a876';
      ctx.fillRect(0, 0, size, size);

      // Macro arid tiger-stripe / desert dune bands
      const camoPalette = ['#9c7c50', '#785a37', '#dfC498', '#4a3723', '#b59262'];
      for (let i = 0; i < 55; i++) {
        ctx.fillStyle = camoPalette[i % camoPalette.length];
        const cx = rand() * size;
        const cy = rand() * size;
        const w = 36 + rand() * 72;
        const hBand = 10 + rand() * 24;
        const angle = -0.35 + (rand() - 0.5) * 0.35;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 0);
        ctx.quadraticCurveTo(-w * 0.15, -hBand, w * 0.5, -hBand * 0.2);
        ctx.quadraticCurveTo(w * 0.15, hBand, -w * 0.5, 0);
        ctx.fill();
        ctx.restore();
      }

      // Digital arid micro-clusters (4x4px tactical blocks)
      const digiColors = ['#3d2e1e', '#e6cfa8', '#85653f', '#ad8b5c'];
      for (let i = 0; i < 180; i++) {
        ctx.fillStyle = digiColors[i % digiColors.length];
        const bx = Math.floor((rand() * size) / 4) * 4;
        const by = Math.floor((rand() * size) / 4) * 4;
        const bw = (1 + Math.floor(rand() * 4)) * 4;
        const bh = (1 + Math.floor(rand() * 2)) * 4;
        ctx.fillRect(bx, by, bw, bh);
      }

      // Ripstop Cordura fabric 6x6 micro-grid in color & heightmap
      ctx.strokeStyle = 'rgba(42, 30, 18, 0.14)';
      ctx.lineWidth = 1;
      hctx.strokeStyle = '#9e9e9e';
      hctx.lineWidth = 1;
      for (let g = 0; g < size; g += 6) {
        ctx.beginPath();
        ctx.moveTo(g, 0);
        ctx.lineTo(g, size);
        ctx.moveTo(0, g);
        ctx.lineTo(size, g);
        ctx.stroke();

        hctx.beginPath();
        hctx.moveTo(g, 0);
        hctx.lineTo(g, size);
        hctx.moveTo(0, g);
        hctx.lineTo(size, g);
        hctx.stroke();
      }

      // FDE Cerakote metallic micro-grain
      for (let i = 0; i < 2400; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 244, 224, 0.08)' : 'rgba(40, 28, 16, 0.08)';
        ctx.fillRect(x, y, 1.5, 1.5);
        const hv = 118 + Math.floor(rand() * 24);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 1.5, 1.5);
      }
    } else if (spec.id === 'arctic_camo') {
      // ARCTIC WOLF: Crisp splinter overwhite/glacier-grey geometric snow camo
      // with frost micro-grain and ice-blue tactical accents.
      ctx.fillStyle = '#e5edf5';
      ctx.fillRect(0, 0, size, size);

      const splinterColors = ['#cbd5e1', '#94a3b8', '#475569', '#f8fafc', '#64748b', '#38bdf8'];
      for (let i = 0; i < 58; i++) {
        const isIceAccent = i % 11 === 0;
        ctx.fillStyle = isIceAccent ? '#0ea5e9' : splinterColors[i % 5];
        const x0 = rand() * size;
        const y0 = rand() * size;
        const s1 = isIceAccent ? 36 : 85;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + (rand() - 0.5) * s1, y0 + (rand() - 0.5) * s1);
        ctx.lineTo(x0 + (rand() - 0.5) * s1, y0 + (rand() - 0.5) * s1);
        if (!isIceAccent && rand() > 0.4) {
          ctx.lineTo(x0 + (rand() - 0.5) * s1, y0 + (rand() - 0.5) * s1);
        }
        ctx.closePath();
        ctx.fill();

        hctx.fillStyle = isIceAccent ? '#a8a8a8' : i % 2 === 0 ? '#8c8c8c' : '#747474';
        hctx.fill();
      }

      // Diagonal splinter razor lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.22)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 24; i++) {
        const lx = rand() * size;
        const ly = rand() * size;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + 48, ly - 32);
        ctx.stroke();
      }

      // Crystalline frost micro-grain
      for (let i = 0; i < 3600; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(148,163,184,0.14)';
        ctx.fillRect(x, y, 1.5, 1.5);
        const hv = 115 + Math.floor(rand() * 32);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 1.5, 1.5);
      }

      // Subtle ice-blue tactical accent line
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 196, size, 2);
      ectx.fillStyle = '#38bdf8';
      ectx.fillRect(0, 196, size, 2);
    } else if (spec.id === 'naval') {
      // ABYSSAL MARITIME: Deep navy/teal maritime digital pattern with brushed
      // anodized sea-steel striations and subtle tritium cyan micro-piping.
      ctx.fillStyle = '#0f1e3d';
      ctx.fillRect(0, 0, size, size);

      // Maritime digital camo blocks (8x4 & 4x4 grid)
      const seaColors = ['#172554', '#1e3a8a', '#0f3d5e', '#115e59', '#091124', '#1d4ed8'];
      for (let i = 0; i < 320; i++) {
        ctx.fillStyle = seaColors[i % seaColors.length];
        const gx = Math.floor((rand() * size) / 4) * 4;
        const gy = Math.floor((rand() * size) / 4) * 4;
        const gw = (1 + Math.floor(rand() * 5)) * 4;
        const gh = (1 + Math.floor(rand() * 3)) * 4;
        ctx.fillRect(gx, gy, gw, gh);
        hctx.fillStyle = i % 2 === 0 ? '#8c8c8c' : '#727272';
        hctx.fillRect(gx, gy, gw, gh);
      }

      // Brushed anodized sea-steel striations
      for (let i = 0; i < 2400; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.06)' : 'rgba(2, 6, 23, 0.14)';
        ctx.fillRect(x, y, 22, 1);
        hctx.fillStyle = i % 2 === 0 ? '#9c9c9c' : '#646464';
        hctx.fillRect(x, y, 18, 1);
      }

      // Tritium cyan micro-piping channels
      for (const py of [64, 192]) {
        ctx.fillStyle = '#082f49';
        ctx.fillRect(0, py - 2, size, 5);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(0, py, size, 1.5);
        hctx.fillStyle = '#383838';
        hctx.fillRect(0, py - 2, size, 5);
        ectx.fillStyle = '#06b6d4';
        ectx.fillRect(0, py, size, 1.5);
      }
    } else if (spec.id === 'woodland') {
      // WOODLAND STALKER: Authentic multi-layer temperate woodland leaf/bark camouflage
      // with olive drab, moss, & earth tones.
      ctx.fillStyle = '#486340';
      ctx.fillRect(0, 0, size, size);

      const forestPalette = ['#2b3d26', '#5c7849', '#4a3728', '#1e291b', '#6d5237', '#3b5234'];
      for (let i = 0; i < 75; i++) {
        ctx.fillStyle = forestPalette[i % forestPalette.length];
        const rx = rand() * size;
        const ry = rand() * size;
        const rw = 24 + rand() * 56;
        const rh = 14 + rand() * 34;
        const rot = rand() * Math.PI;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rw * 0.5, rh * 0.5, rot, 0, Math.PI * 2);
        ctx.fill();
        // Secondary organic lobe for authentic leaf/amoeba woodland shape
        ctx.beginPath();
        ctx.ellipse(
          rx + (rand() - 0.5) * rw * 0.55,
          ry + (rand() - 0.5) * rh * 0.55,
          rw * 0.35,
          rh * 0.38,
          rot + 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Bark & twig micro-striations
      for (let i = 0; i < 950; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(26, 36, 21, 0.22)' : 'rgba(115, 92, 62, 0.16)';
        ctx.fillRect(x, y, 2, 10 + rand() * 12);
        hctx.fillStyle = i % 2 === 0 ? '#686868' : '#969696';
        hctx.fillRect(x, y, 2, 10);
      }

      // Fine matte canvas / ripstop weave relief
      hctx.strokeStyle = 'rgba(148, 148, 148, 0.35)';
      hctx.lineWidth = 1;
      for (let g = 0; g < size; g += 5) {
        hctx.strokeRect(g, 0, 5, size);
        hctx.strokeRect(0, g, size, 5);
      }
    } else if (spec.id === 'ceramic') {
      // BALLISTIC CERMET: High-tech white/light-grey ballistic cermet hex-tile matrix
      // with dark titanium expansion seams and fine ceramic speckle.
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#2e2e2e';
      hctx.fillRect(0, 0, size, size);

      const hexR = 16;
      const dx = hexR * Math.sqrt(3);
      const dy = hexR * 1.5;

      let row = 0;
      for (let cy = -hexR; cy < size + hexR * 2; cy += dy) {
        const offsetX = (row % 2) * (dx * 0.5);
        for (let cx = -hexR; cx < size + hexR * 2; cx += dx) {
          const hx = cx + offsetX;
          const hy = cy;
          const shade = 224 + Math.floor((rand() - 0.5) * 20);
          ctx.fillStyle = `rgb(${shade},${shade + 4},${Math.min(255, shade + 9)})`;
          drawHexagon(ctx, hx, hy, hexR - 1.4);
          ctx.fill();

          // Inner tile bevel highlight
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1;
          drawHexagon(ctx, hx, hy, hexR - 2.4);
          ctx.stroke();

          // Raised flat ceramic tile in heightmap
          const hVal = 195 + Math.floor((rand() - 0.5) * 22);
          hctx.fillStyle = `rgb(${hVal},${hVal},${hVal})`;
          drawHexagon(hctx, hx, hy, hexR - 1.5);
          hctx.fill();

          // Glossy ceramic tile vs rougher titanium seam
          rbctx.fillStyle = '#484848';
          drawHexagon(rbctx, hx, hy, hexR - 1.5);
          rbctx.fill();

          // Occasional orange thermal cermet telemetry tick on vertex
          if (rand() < 0.14) {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(hx - 2, hy - 2, 4, 4);
            ectx.fillStyle = '#f97316';
            ectx.fillRect(hx - 1.5, hy - 1.5, 3, 3);
          }
        }
        row++;
      }

      // Fine sintered ceramic micro-speckle
      for (let i = 0; i < 3200; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(71, 85, 105, 0.12)' : 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    } else if (spec.id === 'crimson') {
      // CRIMSON VANGUARD: Anodized crimson-red competition CNC receiver bands
      // over dark gunmetal carbon with crisp chamfer highlights.
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#5a5a5a';
      hctx.fillRect(0, 0, size, size);

      // Underlying gunmetal micro-carbon weave
      for (let y = 0; y < size; y += 6) {
        for (let x = 0; x < size; x += 6) {
          const odd = ((x / 6 + y / 6) % 2) === 0;
          ctx.fillStyle = odd ? '#1f2026' : '#141519';
          ctx.fillRect(x, y, 5, 5);
          hctx.fillStyle = odd ? '#747474' : '#525252';
          hctx.fillRect(x, y, 5, 5);
        }
      }

      // Anodized crimson-red competition CNC bands & angled speed-cuts
      ctx.save();
      const bandGrad = ctx.createLinearGradient(0, 28, 0, 118);
      bandGrad.addColorStop(0, '#7f1d1d');
      bandGrad.addColorStop(0.5, '#b91c1c');
      bandGrad.addColorStop(1, '#6b1414');
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, 28, size, 90);
      ctx.fillRect(0, 168, size, 52);

      // Raised anodized CNC plates in heightmap
      hctx.fillStyle = '#c8c8c8';
      hctx.fillRect(0, 28, size, 90);
      hctx.fillRect(0, 168, size, 52);
      rbctx.fillStyle = '#424242';
      rbctx.fillRect(0, 28, size, 90);
      rbctx.fillRect(0, 168, size, 52);

      // CNC weight-reduction pockets milled into the crimson band
      for (let px = 16; px < size; px += 48) {
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.moveTo(px, 46);
        ctx.lineTo(px + 26, 46);
        ctx.lineTo(px + 18, 98);
        ctx.lineTo(px - 8, 98);
        ctx.closePath();
        ctx.fill();

        // Crisp bright crimson-silver chamfer highlight around CNC pocket
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        hctx.fillStyle = '#404040';
        hctx.beginPath();
        hctx.moveTo(px, 46);
        hctx.lineTo(px + 26, 46);
        hctx.lineTo(px + 18, 98);
        hctx.lineTo(px - 8, 98);
        hctx.closePath();
        hctx.fill();
      }

      // Chamfer edge highlights & subtle emissive accent line
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, 27, size, 2);
      ctx.fillRect(0, 117, size, 2);
      ctx.fillRect(0, 167, size, 2);
      ectx.fillStyle = '#ef4444';
      ectx.fillRect(0, 27, size, 1.5);
      ectx.fillRect(0, 167, size, 1.5);
      ctx.restore();
    } else if (spec.id === 'cobalt') {
      // COBALT PROTOTYPE: Experimental cobalt-blue PVD titanium finish
      // with precision hex micro-grid and subtle cyan telemetry accents.
      const pvdGrad = ctx.createLinearGradient(0, 0, size, size);
      pvdGrad.addColorStop(0, '#172554');
      pvdGrad.addColorStop(0.45, '#1d4ed8');
      pvdGrad.addColorStop(0.8, '#2563eb');
      pvdGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = pvdGrad;
      ctx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#909090';
      hctx.fillRect(0, 0, size, size);

      // Precision hex micro-grid (r = 9)
      const hexR = 9;
      const dx = hexR * Math.sqrt(3);
      const dy = hexR * 1.5;
      let row = 0;
      for (let cy = 0; cy < size + hexR; cy += dy) {
        const ox = (row % 2) * (dx * 0.5);
        for (let cx = 0; cx < size + hexR; cx += dx) {
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
          ctx.lineWidth = 1.2;
          drawHexagon(ctx, cx + ox, cy, hexR - 0.8);
          ctx.stroke();

          hctx.fillStyle = (row + Math.floor(cx / dx)) % 3 === 0 ? '#b8b8b8' : '#888888';
          drawHexagon(hctx, cx + ox, cy, hexR - 1.4);
          hctx.fill();
        }
        row++;
      }

      // Brushed PVD titanium fine striations
      for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(147, 197, 253, 0.07)' : 'rgba(15, 23, 42, 0.09)';
        ctx.fillRect(rand() * size, rand() * size, 24, 1);
      }

      // Subtle cyan telemetry circuit traces & datum ticks
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ectx.strokeStyle = '#38bdf8';
      ectx.lineWidth = 1.5;
      for (const ty of [56, 184]) {
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(84, ty);
        ctx.lineTo(100, ty + 12);
        ctx.lineTo(188, ty + 12);
        ctx.lineTo(204, ty);
        ctx.lineTo(size, ty);
        ctx.stroke();

        ectx.beginPath();
        ectx.moveTo(0, ty);
        ectx.lineTo(84, ty);
        ectx.lineTo(100, ty + 12);
        ectx.lineTo(188, ty + 12);
        ectx.lineTo(204, ty);
        ectx.lineTo(size, ty);
        ectx.stroke();
      }
    } else if (spec.id === 'damascus') {
      // DAMASCUS VALOR: Swirling multi-layered Damascus folded steel waves
      // with gold/bronze Damascus veins and heat-blued barrel gradients.
      const imgData = ctx.createImageData(size, size);
      const hData = hctx.createImageData(size, size);
      const eData = ectx.createImageData(size, size);
      const rbData = rbctx.createImageData(size, size);
      const cd = imgData.data;
      const hd = hData.data;
      const ed = eData.data;
      const rbd = rbData.data;

      const tau = Math.PI * 2;
      for (let y = 0; y < size; y++) {
        const ny = (y / size) * tau;
        for (let x = 0; x < size; x++) {
          const nx = (x / size) * tau;
          // Multi-octave domain-warped Damascus folded steel field
          const warpX = nx + 0.85 * Math.sin(ny * 2.0 + Math.cos(nx * 1.0)) + 0.35 * Math.cos(ny * 4.0 - nx * 2.0);
          const warpY = ny + 0.85 * Math.cos(nx * 2.0 - Math.sin(ny * 1.0)) + 0.35 * Math.sin(nx * 3.0 + ny * 3.0);
          const wave = Math.sin(warpX * 5.0 + Math.sin(warpY * 4.0) * 2.4);

          const idx = (y * size + x) * 4;
          let r = 38;
          let g = 41;
          let b = 48;
          let hVal = 128;
          let rBiasVal = 110;
          let er = 0;
          let eg = 0;
          let eb = 0;

          if (wave > 0.72) {
            // Gold / bronze Damascus vein
            r = 234;
            g = 179;
            b = 24;
            hVal = 225;
            rBiasVal = 40;
            er = 180;
            eg = 125;
            eb = 12;
          } else if (wave > 0.25) {
            // Heat-blued titanium steel ridge
            const t = (wave - 0.25) / 0.47;
            r = Math.round(45 + t * 55);
            g = Math.round(78 + t * 64);
            b = Math.round(138 + t * 65);
            hVal = Math.round(160 + t * 45);
            rBiasVal = 65;
          } else if (wave > -0.35) {
            // Charcoal gunmetal valley
            const t = (wave + 0.35) / 0.6;
            r = Math.round(24 + t * 28);
            g = Math.round(27 + t * 32);
            b = Math.round(35 + t * 42);
            hVal = Math.round(75 + t * 55);
            rBiasVal = 150;
          } else {
            // Deep acid-etched steel fold with bronze sheen
            r = 148;
            g = 104;
            b = 34;
            hVal = 185;
            rBiasVal = 55;
            er = 70;
            eg = 45;
            eb = 6;
          }

          cd[idx] = r;
          cd[idx + 1] = g;
          cd[idx + 2] = b;
          cd[idx + 3] = 255;

          hd[idx] = hVal;
          hd[idx + 1] = hVal;
          hd[idx + 2] = hVal;
          hd[idx + 3] = 255;

          rbd[idx] = rBiasVal;
          rbd[idx + 1] = rBiasVal;
          rbd[idx + 2] = rBiasVal;
          rbd[idx + 3] = 255;

          ed[idx] = er;
          ed[idx + 1] = eg;
          ed[idx + 2] = eb;
          ed[idx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      hctx.putImageData(hData, 0, 0);
      ectx.putImageData(eData, 0, 0);
      rbctx.putImageData(rbData, 0, 0);
    }

    const { normCanvas, roughCanvas } = buildNormalAndRoughnessFromHeight(
      h,
      2.6,
      Math.round(spec.roughness * 255),
      rBias
    );
    const map = makeRepeatTexture(c, 2, 2, true);
    const normalMap = makeRepeatTexture(normCanvas, 2, 2, false);
    const roughnessMap = makeRepeatTexture(roughCanvas, 2, 2, false);
    const emissiveMap = makeRepeatTexture(e, 2, 2, true);
    const bumpMap = makeRepeatTexture(h, 2, 2, false);

    map.anisotropy = anisotropy;
    normalMap.anisotropy = anisotropy;
    roughnessMap.anisotropy = anisotropy;
    emissiveMap.anisotropy = anisotropy;
    bumpMap.anisotropy = anisotropy;

    const out = { spec, map, normalMap, roughnessMap, emissiveMap, bumpMap };
    this.skinCache.set(spec.id, out);
    return out;
  }

  _finalizePbr(colorCanvas, heightCanvas, rx, ry, normalStrength = 2.5, baseRoughness = 185) {
    const { normCanvas, roughCanvas } = buildNormalAndRoughnessFromHeight(heightCanvas, normalStrength, baseRoughness);
    const map = makeRepeatTexture(colorCanvas, rx, ry, true);
    const normalMap = makeRepeatTexture(normCanvas, rx, ry, false);
    const roughnessMap = makeRepeatTexture(roughCanvas, rx, ry, false);
    const bumpMap = makeRepeatTexture(heightCanvas, rx, ry, false);
    return { map, normalMap, roughnessMap, bumpMap };
  }

  _buildSandDunes(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(101);

    ctx.fillStyle = '#d3b27e';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 2) {
      const wave = Math.sin(y * 0.25) * 14 + Math.cos(y * 0.11) * 8;
      const r = Math.min(255, Math.max(0, Math.round(211 + wave)));
      const g = Math.min(255, Math.max(0, Math.round(176 + wave * 0.85)));
      const bl = Math.min(255, Math.max(0, Math.round(124 + wave * 0.65)));
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(0, y, size, 2);

      const bv = Math.min(255, Math.max(0, Math.round(128 + wave * 2.1)));
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(0, y, size, 2);
    }

    for (let i = 0; i < 4200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 1 + rand() * 2;
      const shade = Math.floor(188 + rand() * 44);
      ctx.fillStyle = `rgba(${shade}, ${Math.floor(shade * 0.84)}, ${Math.floor(shade * 0.62)}, 0.45)`;
      ctx.fillRect(x, y, w, w);
    }

    return this._finalizePbr(c, b, rx, ry, 2.4, 210);
  }

  _buildConcrete(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(202);

    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 4000; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 1 + rand() * 2.5;
      const g = Math.floor(138 + rand() * 40);
      ctx.fillStyle = `rgb(${g},${g + 3},${g + 6})`;
      ctx.fillRect(x, y, r, r);

      const bv = Math.floor(110 + rand() * 38);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, r, r);
    }

    ctx.strokeStyle = 'rgba(35, 42, 50, 0.38)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    bctx.strokeStyle = '#383838';
    bctx.lineWidth = 3;
    bctx.strokeRect(2, 2, size - 4, size - 4);

    ctx.fillStyle = 'rgba(40, 48, 56, 0.45)';
    for (const px of [36, 220]) {
      for (const py of [36, 164]) {
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return this._finalizePbr(c, b, rx, ry, 2.8, 195);
  }

  _buildMarbleColumn(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(808);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#888888';
    bctx.fillRect(0, 0, size, size);

    // Subtle stone veins & weathered flutes
    for (let i = 0; i < 16; i++) {
      const x = (i / 16) * size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(100,116,139,0.16)' : 'rgba(248,250,252,0.16)';
      ctx.fillRect(x, 0, size / 16, size);
      bctx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#646464';
      bctx.fillRect(x, 0, size / 16, size);
    }
    for (let i = 0; i < 1800; i++) {
      const g = Math.floor(175 + rand() * 55);
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 5})`;
      ctx.fillRect(rand() * size, rand() * size, 3, 2);
    }
    return this._finalizePbr(c, b, rx, ry, 2.6, 140);
  }

  _buildRockCliff(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(909);

    ctx.fillStyle = '#57534e';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 220; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 12 + rand() * 36;
      const h = 6 + rand() * 18;
      const g = Math.floor(62 + rand() * 54);
      ctx.fillStyle = `rgb(${g + 6},${g + 3},${g})`;
      ctx.fillRect(x, y, w, h);
      const bv = Math.floor(60 + rand() * 135);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, w, h);
    }
    return this._finalizePbr(c, b, rx, ry, 3.4, 215);
  }

  _buildAsphalt(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(919);

    ctx.fillStyle = '#272c33';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 5500; i++) {
      const g = Math.floor(28 + rand() * 36);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 5})`;
      ctx.fillRect(x, y, 2, 2);
      const bv = Math.floor(90 + rand() * 75);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, 2, 2);
    }
    return this._finalizePbr(c, b, rx, ry, 3.0, 175);
  }

  _buildMossyStone(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(929);

    ctx.fillStyle = '#646b63';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2400; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const isMoss = rand() < 0.28;
      ctx.fillStyle = isMoss ? 'rgba(63, 98, 46, 0.55)' : 'rgba(120, 126, 118, 0.45)';
      ctx.fillRect(x, y, 4, 4);
      const bv = isMoss ? 155 : 95;
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, 4, 4);
    }
    return this._finalizePbr(c, b, rx, ry, 2.9, 200);
  }

  _buildBark(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(939);

    ctx.fillStyle = '#4a3525';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 900; i++) {
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = i % 2 === 0 ? '#362518' : '#5e4430';
      ctx.fillRect(x, y, 3, 24);
      bctx.fillStyle = i % 2 === 0 ? '#454545' : '#b8b8b8';
      bctx.fillRect(x, y, 3, 24);
    }
    return this._finalizePbr(c, b, rx, ry, 3.2, 220);
  }

  _buildHarborDeck(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(404);

    ctx.fillStyle = '#47515c';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 4600; i++) {
      const g = Math.floor(58 + rand() * 32);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 4},${g + 9})`;
      ctx.fillRect(x, y, 2, 2);

      const bv = Math.floor(112 + rand() * 36);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, 2, 2);
    }

    ctx.strokeStyle = 'rgba(20, 26, 33, 0.42)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    return this._finalizePbr(c, b, rx, ry, 2.6, 165);
  }

  _buildContainer(mainHex, darkHex, stencilHex, rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');

    ctx.fillStyle = mainHex;
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    const ribs = 18;
    const w = size / ribs;
    for (let i = 0; i < ribs; i++) {
      ctx.fillStyle = i % 2 === 0 ? mainHex : darkHex;
      ctx.fillRect(i * w, 0, w, size);
      bctx.fillStyle = i % 2 === 0 ? '#d8d8d8' : '#353535';
      bctx.fillRect(i * w, 0, w, size);
    }

    ctx.fillStyle = darkHex;
    ctx.fillRect(0, 0, size, 14);
    ctx.fillRect(0, size - 14, size, 14);
    ctx.fillRect(0, 0, 12, size);
    ctx.fillRect(size - 12, 0, 12, size);

    ctx.fillStyle = stencilHex;
    ctx.globalAlpha = 0.72;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('COLDBORE', 26, 52);
    ctx.font = 'bold 14px monospace';
    ctx.fillText('40FT • ISO', 26, 72);
    ctx.globalAlpha = 1.0;

    return this._finalizePbr(c, b, rx, ry, 3.1, 130);
  }

  _buildCrate(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(303);

    ctx.fillStyle = '#926942';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? '#9c734b' : '#855d38';
      ctx.fillRect(0, y, size, 30);
      bctx.fillStyle = y % 64 === 0 ? '#a2a2a2' : '#6e6e6e';
      bctx.fillRect(0, y, size, 30);
    }
    for (let i = 0; i < 650; i++) {
      ctx.fillStyle = 'rgba(48, 30, 14, 0.16)';
      ctx.fillRect(rand() * size, rand() * size, 22, 2);
    }

    ctx.strokeStyle = '#573a20';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, size - 18, size - 18);
    bctx.strokeStyle = '#d0d0d0';
    bctx.lineWidth = 16;
    bctx.strokeRect(9, 9, size - 18, size - 18);

    ctx.fillStyle = '#334155';
    for (const [bx, by] of [[0, 0], [size - 24, 0], [0, size - 24], [size - 24, size - 24]]) {
      ctx.fillRect(bx, by, 24, 24);
    }

    return this._finalizePbr(c, b, rx, ry, 2.7, 190);
  }

  _buildSnow(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(505);

    ctx.fillStyle = '#d7e2ee';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3600; i++) {
      const g = Math.floor(204 + rand() * 44);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 5},${Math.min(255, g + 12)})`;
      ctx.fillRect(x, y, 2.5, 2.5);

      const bv = Math.floor(110 + rand() * 38);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, 2.5, 2.5);
    }

    return this._finalizePbr(c, b, rx, ry, 2.0, 170);
  }

  _buildSteel(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(606);

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1800; i++) {
      const g = Math.floor(62 + rand() * 34);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 6},${g + 12})`;
      ctx.fillRect(x, y, 14, 1.5);
      bctx.fillStyle = i % 2 === 0 ? '#9c9c9c' : '#666666';
      bctx.fillRect(x, y, 14, 1.5);
    }
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.48)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    return this._finalizePbr(c, b, rx, ry, 2.4, 110);
  }

  _buildTankArmor(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(707);

    ctx.fillStyle = '#55614a';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#454f3c' : '#657056';
      const rx0 = Math.floor(rand() * 8) * 32;
      const ry0 = Math.floor(rand() * 8) * 32;
      ctx.fillRect(rx0, ry0, 48, 32);
      bctx.fillStyle = i % 2 === 0 ? '#969696' : '#686868';
      bctx.fillRect(rx0, ry0, 48, 32);
    }
    ctx.strokeStyle = 'rgba(20, 26, 20, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    return this._finalizePbr(c, b, rx, ry, 2.5, 125);
  }

  dispose() {
    for (const set of this.cache.values()) {
      set.map?.dispose();
      set.normalMap?.dispose();
      set.roughnessMap?.dispose();
      set.bumpMap?.dispose();
    }
    for (const set of this.skinCache.values()) {
      set.map?.dispose();
      set.normalMap?.dispose();
      set.roughnessMap?.dispose();
      set.emissiveMap?.dispose();
      set.bumpMap?.dispose();
    }
    this.cache.clear();
    this.skinCache.clear();
  }
}
