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
    if (kind === 'sandstone') result = this._buildSandstone(repeatX, repeatY);
    else if (kind === 'concrete') result = this._buildConcrete(repeatX, repeatY);
    else if (kind === 'containerBlue') result = this._buildContainer('#1e4e79', '#143857', repeatX, repeatY);
    else if (kind === 'containerRust') result = this._buildContainer('#7f3f26', '#5a2b19', repeatX, repeatY);
    else if (kind === 'containerOlive') result = this._buildContainer('#3e5438', '#2a3a26', repeatX, repeatY);
    else if (kind === 'crateWood') result = this._buildCrate(repeatX, repeatY);
    else if (kind === 'asphalt') result = this._buildAsphalt(repeatX, repeatY);
    else if (kind === 'snow') result = this._buildSnow(repeatX, repeatY);
    else if (kind === 'steel') result = this._buildSteel(repeatX, repeatY);
    else result = this._buildConcrete(repeatX, repeatY);

    result.map.anisotropy = anisotropy;
    if (result.bumpMap) result.bumpMap.anisotropy = anisotropy;
    this.cache.set(key, result);
    return result;
  }

  _buildSandstone(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const b = createCanvas(size);
    const bctx = b.getContext('2d');
    const rand = seededNoise(101);

    ctx.fillStyle = '#c8b28e';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 4200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 1 + rand() * 3;
      const shade = Math.floor(175 + rand() * 48);
      ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.87)}, ${Math.floor(shade * 0.68)})`;
      ctx.fillRect(x, y, w, w);

      const bv = Math.floor(100 + rand() * 55);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, w, w);
    }

    // Subtle tile seam lines for crisp spatial scale
    ctx.strokeStyle = 'rgba(95, 78, 55, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);

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

    ctx.fillStyle = '#9aa1a8';
    ctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3800; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 1 + rand() * 2.5;
      const g = Math.floor(135 + rand() * 40);
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 4})`;
      ctx.fillRect(x, y, r, r);

      const bv = Math.floor(105 + rand() * 46);
      bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bctx.fillRect(x, y, r, r);
    }

    // Architectural panel lines
    ctx.strokeStyle = 'rgba(40, 48, 56, 0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    return {
      map: makeRepeatTexture(c, rx, ry, true),
      bumpMap: makeRepeatTexture(b, rx, ry, false)
    };
  }

  _buildContainer(mainHex, darkHex, rx, ry) {
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
    const ribs = 16;
    const w = size / ribs;
    for (let i = 0; i < ribs; i++) {
      ctx.fillStyle = i % 2 === 0 ? mainHex : darkHex;
      ctx.fillRect(i * w, 0, w, size);
      bctx.fillStyle = i % 2 === 0 ? '#c8c8c8' : '#404040';
      bctx.fillRect(i * w, 0, w, size);
    }

    // Frame border
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, size, size);

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

    ctx.fillStyle = '#8c6642';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? '#966e49' : '#825c39';
      ctx.fillRect(0, y, size, 30);
    }
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = 'rgba(50, 32, 16, 0.14)';
      ctx.fillRect(rand() * size, rand() * size, 18, 2);
    }

    ctx.strokeStyle = '#4e3620';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, size - 16, size - 16);
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(size - 12, size - 12);
    ctx.stroke();

    return { map: makeRepeatTexture(c, rx, ry, true), bumpMap: null };
  }

  _buildAsphalt(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const rand = seededNoise(404);

    ctx.fillStyle = '#383d45';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 4800; i++) {
      const g = Math.floor(42 + rand() * 32);
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`;
      ctx.fillRect(rand() * size, rand() * size, 2, 2);
    }
    return { map: makeRepeatTexture(c, rx, ry, true), bumpMap: null };
  }

  _buildSnow(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const rand = seededNoise(505);

    ctx.fillStyle = '#cfd9e3';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 3000; i++) {
      const g = Math.floor(195 + rand() * 45);
      ctx.fillStyle = `rgb(${g},${g + 4},${Math.min(255, g + 10)})`;
      ctx.fillRect(rand() * size, rand() * size, 2.5, 2.5);
    }
    return { map: makeRepeatTexture(c, rx, ry, true), bumpMap: null };
  }

  _buildSteel(rx, ry) {
    const size = 256;
    const c = createCanvas(size);
    const ctx = c.getContext('2d');
    const rand = seededNoise(606);

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1600; i++) {
      const g = Math.floor(62 + rand() * 34);
      ctx.fillStyle = `rgb(${g},${g + 6},${g + 12})`;
      ctx.fillRect(rand() * size, rand() * size, 12, 1.5);
    }
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 4;
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
