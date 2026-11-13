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
    roughness: 0.44,
    clearcoat: 0.04
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
    roughness: 0.30,
    clearcoat: 0.36
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
    metalness: 0.16,
    roughness: 0.78,
    clearcoat: 0.0
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
    metalness: 0.22,
    roughness: 0.58,
    clearcoat: 0.05
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
    roughness: 0.42,
    clearcoat: 0.08
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
    metalness: 0.14,
    roughness: 0.82,
    clearcoat: 0.0
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
    metalness: 0.34,
    roughness: 0.32,
    clearcoat: 0.34
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
    roughness: 0.30,
    clearcoat: 0.32
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
    roughness: 0.31,
    clearcoat: 0.30
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
    roughness: 0.28,
    clearcoat: 0.38
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
function buildNormalAndRoughnessFromHeight(heightCanvas, strength = 2.0, baseRoughness = 215, roughBiasCanvas = null) {
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

  // Attenuate derivative spikes to eliminate plastic / clay-like normal shimmer
  const effectiveStrength = strength * 0.55;

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

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * effectiveStrength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * effectiveStrength;
      const dz = 1.0;
      const inv = 1.0 / Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      ndst[idx] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      ndst[idx + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      ndst[idx + 2] = Math.round((dz * inv * 0.5 + 0.5) * 255);
      ndst[idx + 3] = 255;

      // Pack AO (R), Roughness (G), Metalness modulation (B)
      const bias = biasData ? (biasData[idx + 1] - 128) * 0.52 : 0;
      const ao = Math.min(255, Math.max(96, Math.round(196 + (c - 0.5) * 110)));
      const rough = Math.min(255, Math.max(36, Math.round(baseRoughness - (c - 0.5) * 54 + bias)));
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
 * - 'ultra' (ULTRA 4K): MeshPhysicalMaterial with restrained clearcoat (only on glossy metals/optics), Normal/Roughness/Emissive maps
 * - 'balanced' (HIGH BALANCED): MeshStandardMaterial with subtle Normal/Roughness/Emissive maps
 * - 'fast' (HD PERFORMANCE): Crisp MeshLambertMaterial without normal/roughness samplers for peak FPS & clean matte low-poly aesthetic
 */
export function createQualityMaterial(params = {}, quality = 'balanced') {
  if (quality === 'fast') {
    const useMapInFast = params.preferCleanLowPoly
      ? false
      : params.allowMapInFast !== undefined
        ? Boolean(params.allowMapInFast)
        : Boolean(params.map);
    return new THREE.MeshLambertMaterial({
      color: params.color ?? 0xffffff,
      map: useMapInFast ? (params.map || null) : null,
      emissive: params.emissive ?? 0x000000,
      emissiveMap: params.emissiveMap || null,
      emissiveIntensity: params.emissiveIntensity ?? 0,
      transparent: Boolean(params.transparent),
      opacity: params.opacity ?? 1.0,
      side: params.side ?? THREE.FrontSide,
      flatShading: Boolean(params.flatShading ?? params.preferCleanLowPoly)
    });
  }

  const resolvedRoughness = params.roughness ?? 0.78;
  const resolvedMetalness = params.metalness ?? 0.08;

  if (quality === 'ultra') {
    const requestedCoat = params.clearcoat !== undefined ? params.clearcoat : 0.0;
    // Never apply clearcoat film onto matte concrete, stone, wood, or cloth surfaces
    const safeClearcoat = (resolvedRoughness >= 0.70 && !params.transparent)
      ? 0.0
      : Math.min(
          requestedCoat,
          params.transparent || resolvedRoughness < 0.18 ? 1.0 : 0.42
        );

    return new THREE.MeshPhysicalMaterial({
      color: params.color ?? 0xffffff,
      map: params.map || null,
      normalMap: params.normalMap || null,
      normalScale: params.normalScale || new THREE.Vector2(0.38, 0.38),
      roughnessMap: params.roughnessMap || null,
      roughness: resolvedRoughness,
      metalness: resolvedMetalness,
      clearcoat: safeClearcoat,
      clearcoatRoughness: params.clearcoatRoughness ?? 0.38,
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
    normalScale: params.normalScale || new THREE.Vector2(0.28, 0.28),
    roughnessMap: params.roughnessMap || null,
    roughness: resolvedRoughness,
    metalness: resolvedMetalness,
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

      // Isotropic Parkerized phosphate micro-speckle (albedo detail with gentle height)
      for (let i = 0; i < 6500; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const v = Math.floor(46 + rand() * 42);
        ctx.fillStyle = `rgb(${v},${v + 7},${v + 16})`;
        ctx.fillRect(x, y, 1.6, 1.6);
        if (i % 3 === 0) {
          const hv = Math.floor(122 + rand() * 12);
          hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
          hctx.fillRect(x, y, 2, 2);
        }
      }

      // Subtle horizontal CNC machined toolpath striations
      for (let y = 0; y < size; y += 2) {
        const alpha = 0.025 + rand() * 0.035;
        ctx.fillStyle = y % 4 === 0 ? `rgba(226, 232, 240, ${alpha})` : `rgba(15, 23, 42, ${alpha})`;
        ctx.fillRect(0, y, size, 1);
        hctx.fillStyle = y % 4 === 0 ? 'rgba(136,136,136,0.22)' : 'rgba(120,120,120,0.22)';
        hctx.fillRect(0, y, size, 1);
      }

      // Machined receiver fuller channels & bevel seams
      const seamYs = [44, 128, 212];
      for (const sy of seamYs) {
        ctx.fillStyle = '#252f3d';
        ctx.fillRect(0, sy - 3, size, 6);
        hctx.fillStyle = '#585858';
        hctx.fillRect(0, sy - 3, size, 6);
        // Metallic edge wear highlight along bevel lip
        ctx.fillStyle = 'rgba(186, 200, 218, 0.55)';
        ctx.fillRect(0, sy - 4, size, 1.5);
        ctx.fillRect(0, sy + 3, size, 1.5);
        hctx.fillStyle = '#a2a2a2';
        hctx.fillRect(0, sy - 4, size, 1.5);
        // Lower roughness (shinier metal) on worn edges
        rbctx.fillStyle = '#484848';
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
      // DESERT VIPER: Multi-scale arid digital/tiger-stripe camo with crisp matte
      // Ripstop/Cordura fabric cross-weave and zero plastic height noise.
      ctx.fillStyle = '#c8a876';
      ctx.fillRect(0, 0, size, size);
      rbctx.fillStyle = '#989898';
      rbctx.fillRect(0, 0, size, size);

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

      // Crisp Ripstop/Cordura fabric weave (4px fine thread + 20px reinforcement grid)
      for (let y = 0; y < size; y += 4) {
        for (let x = 0; x < size; x += 4) {
          const isWarp = ((x / 4 + y / 4) % 2) === 0;
          ctx.fillStyle = isWarp ? 'rgba(255, 244, 224, 0.06)' : 'rgba(38, 26, 14, 0.08)';
          ctx.fillRect(x, y, 3, 3);
          hctx.fillStyle = isWarp ? '#868686' : '#797979';
          hctx.fillRect(x, y, 3, 3);
        }
      }
      ctx.strokeStyle = 'rgba(42, 30, 18, 0.20)';
      ctx.lineWidth = 1;
      hctx.strokeStyle = '#969696';
      hctx.lineWidth = 1;
      for (let g = 0; g < size; g += 20) {
        ctx.beginPath();
        ctx.moveTo(g + 0.5, 0);
        ctx.lineTo(g + 0.5, size);
        ctx.moveTo(0, g + 0.5);
        ctx.lineTo(size, g + 0.5);
        ctx.stroke();

        hctx.beginPath();
        hctx.moveTo(g + 0.5, 0);
        hctx.lineTo(g + 0.5, size);
        hctx.moveTo(0, g + 0.5);
        hctx.lineTo(size, g + 0.5);
        hctx.stroke();
      }

      // Matte mineral dye grain in color only (no noisy height spikes)
      for (let i = 0; i < 1800; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 244, 224, 0.06)' : 'rgba(40, 28, 16, 0.07)';
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    } else if (spec.id === 'arctic_camo') {
      // ARCTIC WOLF: Crisp splinter overwhite/glacier-grey geometric snow camo
      // with subtle Ripstop weave and ice-blue tactical accents.
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

        hctx.fillStyle = isIceAccent ? '#8d8d8d' : i % 2 === 0 ? '#848484' : '#7b7b7b';
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

      // Crisp matte arctic Ripstop weave relief (no chaotic height spikes)
      for (let y = 0; y < size; y += 4) {
        for (let x = 0; x < size; x += 4) {
          if (((x / 4 + y / 4) % 2) === 0) {
            hctx.fillStyle = 'rgba(138, 138, 138, 0.35)';
            hctx.fillRect(x, y, 3, 3);
          }
        }
      }

      // Crystalline frost micro-grain in color channel only
      for (let i = 0; i < 2600; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(148,163,184,0.12)';
        ctx.fillRect(x, y, 1.5, 1.5);
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
        hctx.fillStyle = i % 2 === 0 ? '#888888' : '#787878';
        hctx.fillRect(gx, gy, gw, gh);
      }

      // Brushed anodized sea-steel striations
      for (let i = 0; i < 2000; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.06)' : 'rgba(2, 6, 23, 0.14)';
        ctx.fillRect(x, y, 22, 1);
        hctx.fillStyle = i % 2 === 0 ? '#8c8c8c' : '#747474';
        hctx.fillRect(x, y, 18, 1);
      }

      // Tritium cyan micro-piping channels
      for (const py of [64, 192]) {
        ctx.fillStyle = '#082f49';
        ctx.fillRect(0, py - 2, size, 5);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(0, py, size, 1.5);
        hctx.fillStyle = '#505050';
        hctx.fillRect(0, py - 2, size, 5);
        ectx.fillStyle = '#06b6d4';
        ectx.fillRect(0, py, size, 1.5);
      }
    } else if (spec.id === 'woodland') {
      // WOODLAND STALKER: Authentic multi-layer temperate woodland leaf/bark camouflage
      // with crisp matte Ripstop/Cordura fabric weave and zero oily/plastic sheen.
      ctx.fillStyle = '#486340';
      ctx.fillRect(0, 0, size, size);
      rbctx.fillStyle = '#9c9c9c';
      rbctx.fillRect(0, 0, size, size);

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

      // Bark & twig micro-striations in albedo color
      for (let i = 0; i < 950; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(26, 36, 21, 0.22)' : 'rgba(115, 92, 62, 0.16)';
        ctx.fillRect(x, y, 2, 10 + rand() * 12);
      }

      // Fine matte Ripstop / Cordura cross-weave in albedo & heightmap
      for (let y = 0; y < size; y += 4) {
        for (let x = 0; x < size; x += 4) {
          const isWarp = ((x / 4 + y / 4) % 2) === 0;
          ctx.fillStyle = isWarp ? 'rgba(255, 255, 255, 0.045)' : 'rgba(12, 18, 10, 0.07)';
          ctx.fillRect(x, y, 3, 3);
          hctx.fillStyle = isWarp ? '#868686' : '#797979';
          hctx.fillRect(x, y, 3, 3);
        }
      }
      ctx.strokeStyle = 'rgba(16, 24, 14, 0.18)';
      ctx.lineWidth = 1;
      hctx.strokeStyle = '#969696';
      hctx.lineWidth = 1;
      for (let g = 0; g < size; g += 20) {
        ctx.beginPath();
        ctx.moveTo(g + 0.5, 0);
        ctx.lineTo(g + 0.5, size);
        ctx.moveTo(0, g + 0.5);
        ctx.lineTo(size, g + 0.5);
        ctx.stroke();

        hctx.beginPath();
        hctx.moveTo(g + 0.5, 0);
        hctx.lineTo(g + 0.5, size);
        hctx.moveTo(0, g + 0.5);
        hctx.lineTo(size, g + 0.5);
        hctx.stroke();
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
      1.9,
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

  _finalizePbr(colorCanvas, heightCanvas, rx, ry, normalStrength = 1.9, baseRoughness = 216) {
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
      const wave = Math.sin(y * 0.25) * 12 + Math.cos(y * 0.11) * 7;
      const r = Math.min(255, Math.max(0, Math.round(211 + wave)));
      const g = Math.min(255, Math.max(0, Math.round(176 + wave * 0.85)));
      const bl = Math.min(255, Math.max(0, Math.round(124 + wave * 0.65)));
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(0, y, size, 2);

      const bv = Math.min(255, Math.max(0, Math.round(128 + wave * 1.1)));
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

    return this._finalizePbr(c, b, rx, ry, 1.5, 228);
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

    // Subtle concrete mineral aggregate in albedo, with calm low-variance height
    for (let i = 0; i < 3600; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 1 + rand() * 2;
      const g = Math.floor(138 + rand() * 36);
      ctx.fillStyle = `rgb(${g},${g + 3},${g + 6})`;
      ctx.fillRect(x, y, r, r);

      if (i % 3 === 0) {
        const bv = Math.floor(121 + rand() * 14);
        bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
        bctx.fillRect(x, y, 2, 2);
      }
    }

    // Crisp architectural concrete slab seam & horizontal formwork joint
    ctx.fillStyle = 'rgba(42, 50, 60, 0.24)';
    ctx.fillRect(0, 127, size, 2);
    bctx.fillStyle = '#6c6c6c';
    bctx.fillRect(0, 127, size, 2);

    ctx.strokeStyle = 'rgba(35, 42, 50, 0.34)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    bctx.strokeStyle = '#646464';
    bctx.lineWidth = 3;
    bctx.strokeRect(2, 2, size - 4, size - 4);

    ctx.fillStyle = 'rgba(40, 48, 56, 0.45)';
    for (const px of [36, 220]) {
      for (const py of [36, 164]) {
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        bctx.fillStyle = '#626262';
        bctx.beginPath();
        bctx.arc(px, py, 3, 0, Math.PI * 2);
        bctx.fill();
      }
    }

    return this._finalizePbr(c, b, rx, ry, 1.65, 224);
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
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    // Subtle stone veins & weathered flutes
    for (let i = 0; i < 16; i++) {
      const x = (i / 16) * size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(100,116,139,0.16)' : 'rgba(248,250,252,0.16)';
      ctx.fillRect(x, 0, size / 16, size);
      bctx.fillStyle = i % 2 === 0 ? '#929292' : '#707070';
      bctx.fillRect(x, 0, size / 16, size);
    }
    for (let i = 0; i < 1800; i++) {
      const g = Math.floor(175 + rand() * 55);
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 5})`;
      ctx.fillRect(rand() * size, rand() * size, 3, 2);
    }
    return this._finalizePbr(c, b, rx, ry, 1.6, 198);
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

    for (let i = 0; i < 200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 14 + rand() * 38;
      const h = 6 + rand() * 16;
      const g = Math.floor(62 + rand() * 52);
      ctx.fillStyle = `rgb(${g + 6},${g + 3},${g})`;
      ctx.fillRect(x, y, w, h);
      const bv = Math.floor(104 + rand() * 48);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, w, h);
    }
    return this._finalizePbr(c, b, rx, ry, 1.9, 230);
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

    for (let i = 0; i < 5000; i++) {
      const g = Math.floor(28 + rand() * 36);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 5})`;
      ctx.fillRect(x, y, 2, 2);
      if (i % 3 === 0) {
        const bv = Math.floor(116 + rand() * 24);
        bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
        bctx.fillRect(x, y, 2, 2);
      }
    }
    return this._finalizePbr(c, b, rx, ry, 1.6, 220);
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
      const bv = isMoss ? 138 : 114;
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, 4, 4);
    }
    return this._finalizePbr(c, b, rx, ry, 1.75, 228);
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
      bctx.fillStyle = i % 2 === 0 ? '#686868' : '#9c9c9c';
      bctx.fillRect(x, y, 3, 24);
    }
    return this._finalizePbr(c, b, rx, ry, 1.95, 232);
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

    for (let i = 0; i < 4200; i++) {
      const g = Math.floor(58 + rand() * 32);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 4},${g + 9})`;
      ctx.fillRect(x, y, 2, 2);

      if (i % 3 === 0) {
        const bv = Math.floor(121 + rand() * 14);
        bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
        bctx.fillRect(x, y, 2, 2);
      }
    }

    ctx.strokeStyle = 'rgba(20, 26, 33, 0.42)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    bctx.strokeStyle = '#626262';
    bctx.lineWidth = 3;
    bctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    return this._finalizePbr(c, b, rx, ry, 1.6, 218);
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
      // Crisp micro bevel highlight along each corrugated rib edge
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(i * w, 0, 1.5, size);
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(i * w + w - 1.5, 0, 1.5, size);
      bctx.fillStyle = i % 2 === 0 ? '#9c9c9c' : '#646464';
      bctx.fillRect(i * w, 0, w, size);
    }

    // Top/bottom heavy steel corner header rails & center weld seam
    ctx.fillStyle = darkHex;
    ctx.fillRect(0, 0, size, 16);
    ctx.fillRect(0, size - 16, size, 16);
    ctx.fillRect(0, 0, 10, size);
    ctx.fillRect(size - 10, 0, 10, size);
    ctx.fillStyle = 'rgba(255,255,255,0.11)';
    ctx.fillRect(0, 16, size, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 127, size, 2);
    bctx.fillStyle = '#5c5c5c';
    bctx.fillRect(0, 0, size, 16);
    bctx.fillRect(0, size - 16, size, 16);

    return this._finalizePbr(c, b, rx, ry, 1.45, 198);
  }

  _buildCrate(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(303);

    ctx.fillStyle = '#8b6239';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    // 4 wide crisp timber planks with clear horizontal seams & rich natural woodgrain
    const plankColors = ['#9c7246', '#8d643a', '#a3784b', '#865d35'];
    const plankH = size / 4;
    for (let p = 0; p < 4; p++) {
      const py = p * plankH;
      ctx.fillStyle = plankColors[p % plankColors.length];
      ctx.fillRect(0, py, size, plankH - 3);
      bctx.fillStyle = p % 2 === 0 ? '#8a8a8a' : '#7b7b7b';
      bctx.fillRect(0, py, size, plankH - 3);

      // Rich crisp horizontal timber woodgrain fibers within each plank
      for (let gy = py + 3; gy < py + plankH - 5; gy += 3) {
        const isDark = rand() < 0.55;
        ctx.fillStyle = isDark ? 'rgba(54, 33, 14, 0.24)' : 'rgba(196, 152, 98, 0.22)';
        const startX = rand() * 32;
        ctx.fillRect(0, gy, size, 1.2);
        ctx.fillStyle = isDark ? 'rgba(42, 24, 9, 0.28)' : 'rgba(212, 168, 112, 0.2)';
        ctx.fillRect(startX, gy + 1, 80 + rand() * 120, 1);

        const hv = isDark ? 120 : 134;
        bctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        bctx.fillRect(0, gy, size, 1);
      }

      // Subtle timber knot per plank
      const kx = 48 + rand() * 160;
      const ky = py + 16 + rand() * 28;
      ctx.fillStyle = 'rgba(58, 35, 16, 0.35)';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 9, 4, 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Clear dark plank seam groove
      ctx.fillStyle = '#3b2410';
      ctx.fillRect(0, py + plankH - 3, size, 3);
      bctx.fillStyle = '#525252';
      bctx.fillRect(0, py + plankH - 3, size, 3);
    }

    // Crisp diagonal reinforcement batten across inner crate face
    ctx.strokeStyle = '#664424';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(16, size - 16);
    ctx.lineTo(size - 16, 16);
    ctx.stroke();
    ctx.strokeStyle = '#402813';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, size - 24);
    ctx.lineTo(size - 24, 8);
    ctx.moveTo(24, size - 8);
    ctx.lineTo(size - 8, 24);
    ctx.stroke();
    bctx.strokeStyle = '#9a9a9a';
    bctx.lineWidth = 16;
    bctx.beginPath();
    bctx.moveTo(16, size - 16);
    bctx.lineTo(size - 16, 16);
    bctx.stroke();

    // Framed outer timber battens with crisp mitered dark groove
    ctx.strokeStyle = '#5d3e20';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, size - 20, size - 20);
    ctx.strokeStyle = '#36200d';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, size - 40, size - 40);

    bctx.strokeStyle = '#a4a4a4';
    bctx.lineWidth = 18;
    bctx.strokeRect(10, 10, size - 20, size - 20);
    bctx.strokeStyle = '#505050';
    bctx.lineWidth = 2;
    bctx.strokeRect(20, 20, size - 40, size - 40);

    // Matte steel corner brackets & bolt heads
    for (const [bx, by] of [[0, 0], [size - 24, 0], [0, size - 24], [size - 24, size - 24]]) {
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(bx, by, 24, 24);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(bx + 5, by + 5, 4, 4);
      ctx.fillRect(bx + 15, by + 15, 4, 4);
      bctx.fillStyle = '#9c9c9c';
      bctx.fillRect(bx, by, 24, 24);
    }

    return this._finalizePbr(c, b, rx, ry, 1.8, 225);
  }

  _buildSnow(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(505);

    ctx.fillStyle = '#dce6f2';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    // Subtle soft windblown snowdrift shading (dry matte snow, zero plastic shimmer)
    for (let y = 0; y < size; y += 4) {
      const drift = Math.sin(y * 0.08) * 6;
      const g = Math.min(248, Math.max(204, Math.round(224 + drift)));
      ctx.fillStyle = `rgb(${g},${g + 5},${Math.min(255, g + 10)})`;
      ctx.fillRect(0, y, size, 4);
      const bv = Math.round(128 + drift * 0.8);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(0, y, size, 4);
    }

    for (let i = 0; i < 2800; i++) {
      const g = Math.floor(214 + rand() * 34);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 4},${Math.min(255, g + 9)})`;
      ctx.fillRect(x, y, 2.2, 2.2);
    }

    return this._finalizePbr(c, b, rx, ry, 1.25, 222);
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

    for (let i = 0; i < 1600; i++) {
      const g = Math.floor(62 + rand() * 34);
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = `rgb(${g},${g + 6},${g + 12})`;
      ctx.fillRect(x, y, 14, 1.5);
      bctx.fillStyle = i % 2 === 0 ? '#8c8c8c' : '#747474';
      bctx.fillRect(x, y, 14, 1.5);
    }
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.48)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    return this._finalizePbr(c, b, rx, ry, 1.6, 152);
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
      bctx.fillStyle = i % 2 === 0 ? '#8c8c8c' : '#747474';
      bctx.fillRect(rx0, ry0, 48, 32);
    }
    ctx.strokeStyle = 'rgba(20, 26, 20, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    return this._finalizePbr(c, b, rx, ry, 1.7, 196);
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
