import * as THREE from 'three';

export function createSkyDome({ zenithColor, horizonColor, groundColor, sunDir, sunColor, sunGlow = 1.0 }) {
  const geo = new THREE.SphereGeometry(260, 24, 16);
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

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = dir.y;
        vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.58));
        if (h < 0.0) {
          col = mix(uHorizon, uGround, clamp(-h * 4.0, 0.0, 1.0));
        }
        float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
        col += uSunColor * pow(sunAmt, 14.0) * 0.42 * uSunGlow;
        col += uSunColor * smoothstep(0.9965, 0.9994, sunAmt) * 1.45 * uSunGlow;
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
      uDeepColor: { value: new THREE.Color(0x0c2d48) },
      uShallowColor: { value: new THREE.Color(0x1b5c7a) },
      uSunColor: { value: new THREE.Color(0xffb86c) }
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
      varying vec3 vWorldPos;

      void main() {
        vec2 p = vWorldPos.xz * 0.14;
        float w1 = sin(p.x * 1.7 + uTime * 1.5) * cos(p.y * 1.3 - uTime * 1.1);
        float w2 = sin(p.x * 3.1 - uTime * 2.0 + p.y * 2.2) * 0.5;
        float wave = w1 + w2;
        vec3 normal = normalize(vec3(wave * 0.09, 1.0, (w1 - w2) * 0.09));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
        vec3 base = mix(uDeepColor, uShallowColor, 0.35 + fresnel * 0.65);

        vec3 halfVec = normalize(normalize(uSunDir) + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 64.0);
        vec3 col = base + uSunColor * (spec * 1.15 + fresnel * 0.16);

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
