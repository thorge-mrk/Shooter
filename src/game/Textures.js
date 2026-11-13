import * as THREE from 'three';

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

export class TextureLibrary {
  constructor() {
    this.cache = new Map();
  }

  getTextureSet(kind, repeatX = 1, repeatY = 1, anisotropy = 2) {
    const key = `${kind}:${repeatX}:${repeatY}`;
    if (this.cache.has(key)) return this.cache.get(key);

    let result;
    if (kind === 'sandstone') result = this._buildSandDunes(repeatX, repeatY);
    else if (kind === 'concrete') result = this._buildConcrete(repeatX, repeatY);
    else if (kind === 'containerBlue') result = this._buildContainer('#1c4d78', '#123352', '#e2e8f0', repeatX, repeatY);
    else if (kind === 'containerRust') result = this._buildContainer('#8f3d23', '#612715', '#fed7aa', repeatX, repeatY);
    else if (kind === 'containerOlive') result = this._buildContainer('#3f5939', '#2b3e27', '#d9f99d', repeatX, repeatY);
    else if (kind === 'containerYellow') result = this._buildContainer('#b47b19', '#85580f', '#1e293b', repeatX, repeatY);
    else if (kind === 'crateWood') result = this._buildCrate(repeatX, repeatY);
    else if (kind === 'harborDeck') result = this._buildHarborDeck(repeatX, repeatY);
    else if (kind === 'snow') result = this._buildSnow(repeatX, repeatY);
    else if (kind === 'steel') result = this._buildSteel(repeatX, repeatY);
    else if (kind === 'tankArmor') result = this._buildTankArmor(repeatX, repeatY);
    else result = this._buildConcrete(repeatX, repeatY);

    result.map.anisotropy = anisotropy;
    if (result.bumpMap) result.bumpMap.anisotropy = anisotropy;
    this.cache.set(key, result);
    return result;
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

    // Wind-blown sand ripples
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

    return {
      map: makeRepeatTexture(c, rx, ry, true),
      bumpMap: makeRepeatTexture(b, rx, ry, false)
    };
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

    // Architectural expansion joints & form-tie dimples
    ctx.strokeStyle = 'rgba(35, 42, 50, 0.34)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(40, 48, 56, 0.45)';
    for (const px of [36, 220]) {
      for (const py of [36, 164]) {
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return {
      map: makeRepeatTexture(c, rx, ry, true),
      bumpMap: makeRepeatTexture(b, rx, ry, false)
    };
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

    // Concrete harbor dock tile seams
    ctx.strokeStyle = 'rgba(20, 26, 33, 0.42)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    return {
      map: makeRepeatTexture(c, rx, ry, true),
      bumpMap: makeRepeatTexture(b, rx, ry, false)
    };
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

    // Corrugated steel ribs
    const ribs = 18;
    const w = size / ribs;
    for (let i = 0; i < ribs; i++) {
      ctx.fillStyle = i % 2 === 0 ? mainHex : darkHex;
      ctx.fillRect(i * w, 0, w, size);
      bctx.fillStyle = i % 2 === 0 ? '#d8d8d8' : '#353535';
      bctx.fillRect(i * w, 0, w, size);
    }

    // Steel structural corner posts & top/bottom rails
    ctx.fillStyle = darkHex;
    ctx.fillRect(0, 0, size, 14);
    ctx.fillRect(0, size - 14, size, 14);
    ctx.fillRect(0, 0, 12, size);
    ctx.fillRect(size - 12, 0, 12, size);

    // Subtle cargo stencil marking
    ctx.fillStyle = stencilHex;
    ctx.globalAlpha = 0.72;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('COLDBORE', 26, 52);
    ctx.font = 'bold 14px monospace';
    ctx.fillText('40FT • PORT', 26, 72);
    ctx.globalAlpha = 1.0;

    return {
      map: makeRepeatTexture(c, rx, ry, true),
      bumpMap: makeRepeatTexture(b, rx, ry, false)
    };
  }

  _buildCrate(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const rand = seededNoise(303);

    ctx.fillStyle = '#926942';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? '#9c734b' : '#855d38';
      ctx.fillRect(0, y, size, 30);
    }
    for (let i = 0; i < 650; i++) {
      ctx.fillStyle = 'rgba(48, 30, 14, 0.16)';
      ctx.fillRect(rand() * size, rand() * size, 22, 2);
    }

    ctx.strokeStyle = '#573a20';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, size - 18, size - 18);
    ctx.beginPath();
    ctx.moveTo(14, 14);
    ctx.lineTo(size - 14, size - 14);
    ctx.moveTo(size - 14, 14);
    ctx.lineTo(14, size - 14);
    ctx.stroke();

    // Metal corner brackets
    ctx.fillStyle = '#334155';
    for (const [bx, by] of [[0, 0], [size - 24, 0], [0, size - 24], [size - 24, size - 24]]) {
      ctx.fillRect(bx, by, 24, 24);
    }

    return { map: makeRepeatTexture(c, rx, ry, true), bumpMap: null };
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

    return {
      map: makeRepeatTexture(c, rx, ry, true),
      bumpMap: makeRepeatTexture(b, rx, ry, false)
    };
  }

  _buildSteel(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const rand = seededNoise(606);

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1800; i++) {
      const g = Math.floor(62 + rand() * 34);
      ctx.fillStyle = `rgb(${g},${g + 6},${g + 12})`;
      ctx.fillRect(rand() * size, rand() * size, 14, 1.5);
    }
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.48)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    return { map: makeRepeatTexture(c, rx, ry, true), bumpMap: null };
  }

  _buildTankArmor(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const rand = seededNoise(707);

    ctx.fillStyle = '#55614a';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#454f3c' : '#657056';
      ctx.fillRect(Math.floor(rand() * 8) * 32, Math.floor(rand() * 8) * 32, 48, 32);
    }
    ctx.strokeStyle = 'rgba(20, 26, 20, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    return { map: makeRepeatTexture(c, rx, ry, true), bumpMap: null };
  }

  dispose() {
    for (const set of this.cache.values()) {
      set.map?.dispose();
      set.bumpMap?.dispose();
    }
    this.cache.clear();
  }
}
