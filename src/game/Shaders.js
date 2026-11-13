import * as THREE from 'three';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function linearToSrgbByte(v) {
  const c = clamp01(v);
  const srgb = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(srgb * 255)));
}

/**
 * Generates an instant CPU equirectangular procedural IBL DataTexture (128x64)
 * blending ground bounce -> warm horizon -> bright sky zenith + crisp sun specular hotspot
 * so metals, buildings, and tactical props never silhouette dark in shadow.
 */
export function createProceduralEnvMap(
  zenithHex = 0x2574b8,
  horizonHex = 0xdbeeff,
  groundHex = 0x4b6b82,
  sunDir = null,
  sunHex = 0xfff4d6
) {
  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height * 4);

  const zenith = new THREE.Color(zenithHex);
  const horizon = new THREE.Color(horizonHex);
  const ground = new THREE.Color(groundHex);
  const sunCol = new THREE.Color(sunHex);
  // Lift ground bounce slightly with horizon warmth so undersides and dark metals remain readable
  const bouncedGround = ground.clone().lerp(horizon, 0.24);

  const sDir = sunDir
    ? (Array.isArray(sunDir)
        ? new THREE.Vector3(sunDir[0], sunDir[1], sunDir[2]).normalize()
        : sunDir.clone().normalize())
    : new THREE.Vector3(0.55, 0.72, 0.42).normalize();

  const dir = new THREE.Vector3();
  const c = new THREE.Color();

  for (let y = 0; y < height; y++) {
    // DataTexture flipY=false: y=0 -> v=0 (nadir -Y), y=height-1 -> v=1 (zenith +Y)
    const v = (y + 0.5) / height;
    const elev = (v - 0.5) * Math.PI;
    const sinElev = Math.sin(elev);
    const cosElev = Math.cos(elev);

    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const phi = (u - 0.5) * Math.PI * 2.0;

      dir.set(Math.cos(phi) * cosElev, sinElev, Math.sin(phi) * cosElev).normalize();

      if (dir.y >= 0) {
        const skyT = Math.pow(clamp01(dir.y), 0.56);
        c.copy(horizon).lerp(zenith, skyT);
      } else {
        const groundT = clamp01(Math.pow(-dir.y * 1.45, 0.75));
        c.copy(horizon).lerp(bouncedGround, groundT);
      }

      // Warm horizon bounce band
      const horizonGlow = Math.exp(-Math.abs(dir.y) * 5.2) * 0.14;
      c.r += horizon.r * horizonGlow;
      c.g += horizon.g * horizonGlow;
      c.b += horizon.b * horizonGlow;

      // Directional sun specular hotspot for crisp PBR rims & metallic highlights
      const sunDot = Math.max(0, dir.dot(sDir));
      const softGlow = Math.pow(sunDot, 10.0) * 0.42;
      const hotSpot = Math.pow(sunDot, 72.0) * 0.95;
      const sunAdd = softGlow + hotSpot;
      c.r += sunCol.r * sunAdd;
      c.g += sunCol.g * sunAdd;
      c.b += sunCol.b * sunAdd;

      const idx = (y * width + x) * 4;
      data[idx] = linearToSrgbByte(c.r);
      data[idx + 1] = linearToSrgbByte(c.g);
      data[idx + 2] = linearToSrgbByte(c.b);
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

export function createSkyDome({
  zenithColor = 0x2574b8,
  horizonColor = 0xdbeeff,
  groundColor = 0x4b6b82,
  sunDir = new THREE.Vector3(0.6, 0.7, 0.4),
  sunColor = 0xfff4d6,
  sunGlow = 1.35
} = {}) {
  const geo = new THREE.SphereGeometry(280, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color(zenithColor) },
      uHorizon: { value: new THREE.Color(horizonColor) },
      uGround: { value: new THREE.Color(groundColor) },
      uSunDir: { value: sunDir.clone().normalize() },
      uSunColor: { value: new THREE.Color(sunColor) },
      uSunGlow: { value: sunGlow }
    },
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uSunGlow;
      varying vec3 vWorldDir;

      float hash2(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash2(i + vec2(0.0, 0.0)), hash2(i + vec2(1.0, 0.0)), u.x),
          mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = dir.y;
        vec3 sDir = normalize(uSunDir);
        float sunAmt = max(dot(dir, sDir), 0.0);

        // Crisp sunlit Rayleigh + Mie sky dome gradient
        float horizonT = pow(clamp(h, 0.0, 1.0), 0.52);
        vec3 col = mix(uHorizon, uZenith, horizonT);

        // Subtle warm Venge.io horizon bloom ring stronger toward sun azimuth
        float horizonBand = exp(-abs(h) * 6.2);
        float sunAzimuthGlow = 0.22 + 0.38 * pow(sunAmt, 2.5);
        col += mix(uHorizon, uSunColor, 0.55) * horizonBand * sunAzimuthGlow * uSunGlow;

        if (h < 0.0) {
          col = mix(uHorizon, uGround, clamp(-h * 3.8, 0.0, 1.0));
        } else {
          // Crisp high-altitude sunlit cirrus cloud wisps
          vec2 cloudUv = dir.xz / (h + 0.20) * 1.42;
          float c1 = valueNoise(cloudUv * 2.1 + vec2(1.7, -0.8));
          float c2 = valueNoise(cloudUv * 4.7 - vec2(0.5, 2.3)) * 0.52;
          float cirrus = smoothstep(0.66, 0.98, c1 + c2 * 0.65)
                       * smoothstep(0.05, 0.28, h)
                       * (1.0 - smoothstep(0.68, 0.98, h));
          vec3 cloudCol = mix(mix(uHorizon, vec3(1.0), 0.55), uSunColor, 0.28 + 0.48 * pow(sunAmt, 3.0));
          col = mix(col, cloudCol, cirrus * 0.30);
        }

        // Radiant Venge.io solar corona rings & crisp solar disc
        col += uSunColor * pow(sunAmt, 6.0) * 0.24 * uSunGlow;
        col += uSunColor * pow(sunAmt, 28.0) * 0.54 * uSunGlow;
        col += uSunColor * pow(sunAmt, 140.0) * 0.92 * uSunGlow;
        col += uSunColor * smoothstep(0.9968, 0.9994, sunAmt) * 2.1 * uSunGlow;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return {
    mesh,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    }
  };
}

export function createHarborWater(sunDir) {
  const geo = new THREE.PlaneGeometry(420, 420, 1, 1);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: sunDir.clone().normalize() },
      uDeepColor: { value: new THREE.Color(0x0c4a6e) },
      uShallowColor: { value: new THREE.Color(0x22a6c7) },
      uSunColor: { value: new THREE.Color(0xfff0c2) },
      uFoamColor: { value: new THREE.Color(0xf0f9ff) },
      uFogColor: { value: new THREE.Color(0xcfe4f5) }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSunColor;
      uniform vec3 uFoamColor;
      uniform vec3 uFogColor;
      varying vec3 vWorldPos;

      void main() {
        vec2 p = vWorldPos.xz * 0.16;
        // Layered Gerstner-like directional wave interference
        float w1 = sin(p.x * 1.65 + uTime * 1.45) * cos(p.y * 1.25 - uTime * 1.05);
        float w2 = sin(p.x * 3.15 - uTime * 1.95 + p.y * 2.15) * 0.52;
        float w3 = cos(p.x * 5.4 + p.y * 4.8 + uTime * 2.7) * 0.22;
        float wave = w1 + w2 + w3;

        float dx = (w1 * 0.11 + w2 * 0.14 + w3 * 0.09);
        float dz = ((w1 - w2) * 0.11 + w3 * 0.08);
        vec3 normal = normalize(vec3(dx, 1.0, dz));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);

        // Shore foam & shallow turquoise brightening near North quay (z ~ -46) & East beach (x ~ 58)
        float quayDist = abs(vWorldPos.z + 46.0);
        float inQuayX = 1.0 - smoothstep(35.0, 41.0, abs(vWorldPos.x));
        float quayFoamBand = exp(-quayDist * 0.95) * step(vWorldPos.z, -45.2) * inQuayX;

        float beachCurveX = 57.5 + sin(vWorldPos.z * 0.065) * 2.0;
        float beachDist = vWorldPos.x - beachCurveX;
        float inBeachZ = smoothstep(-48.0, -34.0, vWorldPos.z) * (1.0 - smoothstep(58.0, 76.0, vWorldPos.z));
        float beachFoamBand = exp(-max(0.0, beachDist) * 0.42) * step(-1.8, beachDist) * inBeachZ;

        float shoreBand = max(quayFoamBand, beachFoamBand);
        float shallowMask = clamp(0.42 + shoreBand * 0.72 + fresnel * 0.45, 0.0, 1.0);
        vec3 base = mix(uDeepColor, uShallowColor, shallowMask);

        float ripple = sin((vWorldPos.x * 0.8 + vWorldPos.z * 0.65) * 2.2 - uTime * 2.6 + w2 * 1.5);
        float foamWave = smoothstep(0.28, 0.78, shoreBand + ripple * 0.22 * shoreBand);
        float crestFoam = smoothstep(1.22, 1.56, wave) * 0.24;
        base = mix(base, uFoamColor, clamp(foamWave * 0.82 + crestFoam, 0.0, 0.88));

        vec3 halfVec = normalize(normalize(uSunDir) + viewDir);
        float ndh = max(abs(dot(normal, halfVec)), 0.0);
        float spec = pow(ndh, 76.0);
        float glint = pow(ndh, 240.0) * 1.85;
        float shoreSparkle = pow(max(0.0, sin(p.x * 9.0 + uTime * 3.1) * cos(p.y * 8.5 - uTime * 2.4)), 6.0) * (0.25 + shoreBand * 0.45);
        vec3 col = base + uSunColor * (spec * 1.05 + glint + shoreSparkle + fresnel * 0.20);

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * 0.0022, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 0.75));

        float alpha = clamp(0.84 + fresnel * 0.14, 0.82, 0.98);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -0.25, 0);

  return {
    mesh,
    update: (elapsedSec) => {
      mat.uniforms.uTime.value = elapsedSec;
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    }
  };
}

/**
 * Multi-layer terrain material that blends 3 biome texture layers (Road/Deck, Primary Ground, Cliff Rock)
 * using vertex splat colors (R, G, B) and world-space slope.
 * - 'fast' (720p LOW POLY): bright, crisp sunlit flat-shaded MeshLambertMaterial with biome vertexColors (no muddy texture)
 * - 'balanced' / 'ultra': PBR MeshStandardMaterial / MeshPhysicalMaterial with crisp subtle normalScale & custom 3-layer shader
 */
export function createMultiLayerTerrainMaterial(arg1 = 'harbor', arg2 = null, quality = 'balanced') {
  const mapId = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : 'harbor');
  const textureLib = typeof arg1 === 'object' && arg1 !== null ? arg1 : arg2;
  const normId = mapId === 'compound' ? 'harbor' : mapId === 'cargoyard' ? 'desert' : mapId === 'nightops' ? 'snow' : mapId;

  if (quality === 'fast') {
    return new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: null,
      vertexColors: true,
      flatShading: true
    });
  }

  const aniso = quality === 'ultra' || quality === 'high' ? 8 : 4;

  let roadKind = 'asphalt';
  let groundKind = 'sandstone';
  let rockKind = 'rockCliff';
  let roadTint = new THREE.Color(1.35, 1.35, 1.35);
  let groundTint = new THREE.Color(1.08, 1.06, 1.02);
  let rockTint = new THREE.Color(1.28, 1.24, 1.18);

  if (normId === 'harbor') {
    roadKind = 'harborDeck';
    groundKind = 'sandstone';
    rockKind = 'mossyStone';
    roadTint = new THREE.Color(1.52, 1.54, 1.58);
    groundTint = new THREE.Color(1.16, 1.12, 1.02);
    rockTint = new THREE.Color(1.18, 1.28, 1.12);
  } else if (normId === 'desert') {
    roadKind = 'asphalt';
    groundKind = 'sandstone';
    rockKind = 'rockCliff';
    roadTint = new THREE.Color(1.58, 1.40, 1.12);
    groundTint = new THREE.Color(1.10, 1.06, 1.0);
    rockTint = new THREE.Color(1.48, 1.24, 0.96);
  } else if (normId === 'snow') {
    roadKind = 'asphalt';
    groundKind = 'snow';
    rockKind = 'rockCliff';
    roadTint = new THREE.Color(1.42, 1.52, 1.64);
    groundTint = new THREE.Color(1.06, 1.08, 1.10);
    rockTint = new THREE.Color(1.36, 1.46, 1.58);
  }

  if (!textureLib || typeof textureLib.getTextureSet !== 'function') {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: normId === 'snow' ? 0.78 : 0.88,
      metalness: 0.02,
      vertexColors: true
    });
  }

  const primaryKind = normId === 'harbor' ? roadKind : groundKind;
  const primarySet = textureLib.getTextureSet(primaryKind, 18, 18, aniso);
  const roadSet = textureLib.getTextureSet(roadKind, 18, 18, aniso);
  const groundSet = textureLib.getTextureSet(groundKind, 18, 18, aniso);
  const rockSet = textureLib.getTextureSet(rockKind, 14, 14, aniso);

  const isUltra = quality === 'ultra' || quality === 'high';
  const MatClass = isUltra ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const normalScaleVal = isUltra ? 0.42 : 0.34;

  const mat = new MatClass({
    map: primarySet.map,
    normalMap: primarySet.normalMap || null,
    normalScale: new THREE.Vector2(normalScaleVal, normalScaleVal),
    roughnessMap: primarySet.roughnessMap || null,
    roughness: normId === 'snow' ? 0.78 : 0.88,
    metalness: 0.02,
    ...(isUltra ? { clearcoat: normId === 'snow' ? 0.08 : 0.0, clearcoatRoughness: 0.55 } : {}),
    vertexColors: true
  });

  mat.customProgramCacheKey = () => `coldbore-terrain-v2-${normId}-${quality}`;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRoadMap = { value: roadSet.map };
    shader.uniforms.uGroundMap = { value: groundSet.map };
    shader.uniforms.uRockMap = { value: rockSet.map };
    shader.uniforms.uRoadTint = { value: roadTint };
    shader.uniforms.uGroundTint = { value: groundTint };
    shader.uniforms.uRockTint = { value: rockTint };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vTerrainWorldPos;
        varying vec3 vTerrainWorldNormal;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vTerrainWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uRoadMap;
        uniform sampler2D uGroundMap;
        uniform sampler2D uRockMap;
        uniform vec3 uRoadTint;
        uniform vec3 uGroundTint;
        uniform vec3 uRockTint;
        varying vec3 vTerrainWorldPos;
        varying vec3 vTerrainWorldNormal;`
      )
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec2 tiledUv = vTerrainWorldPos.xz * 0.17;
          vec4 roadSample = texture2D(uRoadMap, tiledUv) * vec4(uRoadTint, 1.0);
          vec4 groundSample = texture2D(uGroundMap, tiledUv * 1.05) * vec4(uGroundTint, 1.0);
          vec4 rockSample = texture2D(uRockMap, tiledUv * 0.78) * vec4(uRockTint, 1.0);

          vec3 splat = max(vColor.rgb, vec3(0.0));
          float slopeFactor = smoothstep(0.16, 0.46, 1.0 - clamp(vTerrainWorldNormal.y, 0.0, 1.0));
          splat.b = max(splat.b, slopeFactor * 0.85);
          float weightSum = max(0.0001, splat.r + splat.g + splat.b);
          splat /= weightSum;

          vec4 blendedTexel = roadSample * splat.r + groundSample * splat.g + rockSample * splat.b;
          diffuseColor *= blendedTexel;
        #endif`
      )
      .replace(
        '#include <color_fragment>',
        `// Prevent raw RGB splat weights in vColor from tinting diffuseColor; apply subtle height AO instead
        float heightAo = clamp(0.95 + vTerrainWorldPos.y * 0.03, 0.90, 1.06);
        diffuseColor.rgb *= heightAo;`
      );
  };

  return mat;
}

/**
 * Injects a zero-overhead GPU vertex wind-sway displacement into any Three.js material
 * for tree canopies, fronds, ferns, reeds, tall grass blades, and climbing vines.
 */
export function applyWindSwayShader(material, { amplitude = 0.14, speed = 2.1, heightThreshold = 0.15 } = {}) {
  if (!material) return material;

  const windUniforms = {
    uWindTime: { value: 0 },
    uWindAmp: { value: amplitude },
    uWindSpeed: { value: speed },
    uWindHeightThreshold: { value: heightThreshold }
  };
  material.userData = material.userData || {};
  material.userData.windUniforms = windUniforms;

  const prevKey = material.customProgramCacheKey ? material.customProgramCacheKey.bind(material) : () => '';
  material.customProgramCacheKey = () => `${prevKey()}-wind-${amplitude.toFixed(3)}-${speed.toFixed(2)}`;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniforms.uWindTime;
    shader.uniforms.uWindAmp = windUniforms.uWindAmp;
    shader.uniforms.uWindSpeed = windUniforms.uWindSpeed;
    shader.uniforms.uWindHeightThreshold = windUniforms.uWindHeightThreshold;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWindTime;
        uniform float uWindAmp;
        uniform float uWindSpeed;
        uniform float uWindHeightThreshold;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float windFlex = clamp((position.y - uWindHeightThreshold) * 0.85, 0.0, 2.2);
        if (windFlex > 0.0) {
          vec3 windAnchor = vec3(modelMatrix[3].xyz);
          #ifdef USE_INSTANCING
            windAnchor += instanceMatrix[3].xyz;
          #endif
          float phase = windAnchor.x * 0.37 + windAnchor.z * 0.53 + position.x * 0.8 + position.z * 0.8;
          float gust = sin(uWindTime * uWindSpeed + phase) * 0.68
                     + cos(uWindTime * (uWindSpeed * 1.63) + phase * 1.35) * 0.32;
          float sway = gust * uWindAmp * windFlex;
          transformed.x += sway;
          transformed.z += sway * 0.62;
          transformed.y -= abs(sway) * 0.08;
        }`
      );
  };

  return material;
}
