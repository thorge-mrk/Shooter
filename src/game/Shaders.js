import * as THREE from 'three';

export function createSkyDome({
  zenithColor = 0x26547c,
  horizonColor = 0xf4a261,
  groundColor = 0x1b263b,
  sunDir = new THREE.Vector3(0.6, 0.7, 0.4),
  sunColor = 0xffcf87,
  sunGlow = 1.0
} = {}) {
  const geo = new THREE.SphereGeometry(260, 32, 20);
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

        // Rayleigh + Mie horizon gradient
        float horizonT = pow(clamp(h, 0.0, 1.0), 0.54);
        vec3 col = mix(uHorizon, uZenith, horizonT);
        float horizonBand = exp(-abs(h) * 8.5);
        col += mix(uHorizon, uSunColor, 0.45) * horizonBand * 0.22 * uSunGlow;

        if (h < 0.0) {
          col = mix(uHorizon, uGround, clamp(-h * 4.2, 0.0, 1.0));
        } else {
          // Subtle high-altitude cirrus cloud wisps
          vec2 cloudUv = dir.xz / (h + 0.18) * 1.45;
          float c1 = valueNoise(cloudUv * 2.1 + vec2(1.7, -0.8));
          float c2 = valueNoise(cloudUv * 4.6 - vec2(0.5, 2.3)) * 0.5;
          float cirrus = smoothstep(0.68, 0.98, c1 + c2 * 0.65) * smoothstep(0.04, 0.28, h) * (1.0 - smoothstep(0.65, 0.98, h));
          vec3 cloudCol = mix(uHorizon, uSunColor, 0.35 + 0.45 * pow(sunAmt, 3.0));
          col = mix(col, cloudCol, cirrus * 0.26);
        }

        // Multi-ring solar corona & crisp solar disc
        col += uSunColor * pow(sunAmt, 8.0) * 0.22 * uSunGlow;
        col += uSunColor * pow(sunAmt, 24.0) * 0.42 * uSunGlow;
        col += uSunColor * smoothstep(0.9962, 0.9994, sunAmt) * 1.55 * uSunGlow;
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
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: sunDir.clone().normalize() },
      uDeepColor: { value: new THREE.Color(0x0a2740) },
      uShallowColor: { value: new THREE.Color(0x1b6282) },
      uSunColor: { value: new THREE.Color(0xffc078) },
      uFoamColor: { value: new THREE.Color(0xe6f4f8) }
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
      varying vec3 vWorldPos;

      void main() {
        vec2 p = vWorldPos.xz * 0.14;
        // Layered Gerstner-like directional wave interference
        float w1 = sin(p.x * 1.65 + uTime * 1.45) * cos(p.y * 1.25 - uTime * 1.05);
        float w2 = sin(p.x * 3.15 - uTime * 1.95 + p.y * 2.15) * 0.52;
        float w3 = cos(p.x * 5.4 + p.y * 4.8 + uTime * 2.7) * 0.22;
        float wave = w1 + w2 + w3;

        float dx = (w1 * 0.11 + w2 * 0.14 + w3 * 0.09);
        float dz = ((w1 - w2) * 0.11 + w3 * 0.08);
        vec3 normal = normalize(vec3(dx, 1.0, dz));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.2);
        vec3 base = mix(uDeepColor, uShallowColor, 0.32 + fresnel * 0.68);

        // Shore foam near the harbor quay edge (|x| or |z| around 48..54)
        float dockEdgeDist = max(abs(vWorldPos.x), abs(vWorldPos.z)) - 48.2;
        float shoreBand = exp(-max(0.0, dockEdgeDist) * 0.55) * step(-0.5, dockEdgeDist);
        float foamWave = smoothstep(0.32, 0.78, shoreBand + sin(dockEdgeDist * 2.8 - uTime * 2.6 + w2 * 1.5) * 0.25 * shoreBand);
        float crestFoam = smoothstep(1.22, 1.58, wave) * 0.28;
        base = mix(base, uFoamColor, clamp(foamWave * 0.78 + crestFoam, 0.0, 0.85));

        vec3 halfVec = normalize(normalize(uSunDir) + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 84.0);
        float glint = pow(max(dot(normal, halfVec), 0.0), 260.0) * 1.8;
        vec3 col = base + uSunColor * (spec * 1.05 + glint + fresnel * 0.16);

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * 0.0042, 2.0));
        col = mix(col, vec3(0.84, 0.58, 0.44), clamp(fogFactor, 0.0, 0.85));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -1.65, 0);

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
 * - 'fast' (HD PERFORMANCE): single-pass MeshLambertMaterial with vertexColors: false for maximum FPS
 * - 'balanced' / 'ultra': PBR MeshStandardMaterial / MeshPhysicalMaterial with custom onBeforeCompile 3-layer shader
 */
export function createMultiLayerTerrainMaterial(arg1 = 'harbor', arg2 = null, quality = 'balanced') {
  const mapId = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : 'harbor');
  const textureLib = typeof arg1 === 'object' && arg1 !== null ? arg1 : arg2;
  const normId = mapId === 'compound' ? 'harbor' : mapId === 'cargoyard' ? 'desert' : mapId === 'nightops' ? 'snow' : mapId;
  const aniso = quality === 'ultra' || quality === 'high' ? 8 : quality === 'balanced' ? 4 : 1;

  let roadKind = 'asphalt';
  let groundKind = 'sandstone';
  let rockKind = 'rockCliff';
  let roadTint = new THREE.Color(0xd8dee6);
  let groundTint = new THREE.Color(0xffffff);
  let rockTint = new THREE.Color(0xc2bdb6);

  if (normId === 'harbor') {
    roadKind = 'harborDeck';
    groundKind = 'mossyStone';
    rockKind = 'rockCliff';
    roadTint = new THREE.Color(0xffffff);
    groundTint = new THREE.Color(0xb8c9a8);
    rockTint = new THREE.Color(0x9ca3af);
  } else if (normId === 'desert') {
    roadKind = 'asphalt';
    groundKind = 'sandstone';
    rockKind = 'rockCliff';
    roadTint = new THREE.Color(0xc7b292);
    groundTint = new THREE.Color(0xffffff);
    rockTint = new THREE.Color(0xb5926b);
  } else if (normId === 'snow') {
    roadKind = 'asphalt';
    groundKind = 'snow';
    rockKind = 'rockCliff';
    roadTint = new THREE.Color(0x94a3b8);
    groundTint = new THREE.Color(0xffffff);
    rockTint = new THREE.Color(0x94a3b8);
  }

  const primaryKind = normId === 'harbor' ? roadKind : groundKind;
  const primarySet = textureLib.getTextureSet(primaryKind, 18, 18, aniso);

  if (quality === 'fast') {
    return new THREE.MeshLambertMaterial({
      map: primarySet.map,
      vertexColors: false
    });
  }

  const roadSet = textureLib.getTextureSet(roadKind, 18, 18, aniso);
  const groundSet = textureLib.getTextureSet(groundKind, 18, 18, aniso);
  const rockSet = textureLib.getTextureSet(rockKind, 14, 14, aniso);

  const MatClass = quality === 'ultra' ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const mat = new MatClass({
    map: primarySet.map,
    normalMap: primarySet.normalMap || null,
    normalScale: new THREE.Vector2(quality === 'ultra' ? 0.95 : 0.72, quality === 'ultra' ? 0.95 : 0.72),
    roughnessMap: primarySet.roughnessMap || null,
    roughness: normId === 'snow' ? 0.76 : 0.86,
    metalness: 0.05,
    ...(quality === 'ultra' ? { clearcoat: normId === 'snow' ? 0.16 : 0.06, clearcoatRoughness: 0.45 } : {}),
    vertexColors: true
  });

  mat.customProgramCacheKey = () => `coldbore-terrain-${normId}-${quality}`;

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
          splat.b = max(splat.b, slopeFactor * 0.88);
          float weightSum = max(0.0001, splat.r + splat.g + splat.b);
          splat /= weightSum;

          vec4 blendedTexel = roadSample * splat.r + groundSample * splat.g + rockSample * splat.b;
          diffuseColor *= blendedTexel;
        #endif`
      )
      .replace(
        '#include <color_fragment>',
        `// Prevent raw RGB splat weights in vColor from tinting diffuseColor; apply subtle height AO instead
        float heightAo = clamp(0.92 + vTerrainWorldPos.y * 0.035, 0.88, 1.06);
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

