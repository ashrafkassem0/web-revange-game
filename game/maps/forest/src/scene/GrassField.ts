import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGrassGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a7535';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const g = 70 + Math.random() * 50;
    ctx.fillStyle = `rgb(${Math.floor(g * 0.45)},${Math.floor(g)},${Math.floor(g * 0.3)})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 4 + Math.random() * 14;
    ctx.fillStyle = `rgba(${30 + Math.random() * 20},${60 + Math.random() * 30},${25 + Math.random() * 15},0.25)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(90, 72);
  tex.anisotropy = 4;
  return tex;
}

/** نسيج أوراق عشب بشفافية — يُستخدم على مستطيلات الحشائش */
export function createGrassBladeTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const blades = [
    { x: 0.22, lean: -0.12, h: 0.88, w: 9 },
    { x: 0.42, lean: 0.06, h: 0.72, w: 7 },
    { x: 0.58, lean: -0.04, h: 0.95, w: 10 },
    { x: 0.76, lean: 0.14, h: 0.65, w: 8 },
    { x: 0.35, lean: 0.1, h: 0.58, w: 6 },
    { x: 0.65, lean: -0.1, h: 0.78, w: 7 }
  ];

  for (const blade of blades) {
    const bx = w * blade.x;
    const tipY = h * (1 - blade.h);
    const halfW = blade.w * 0.5;
    const lean = blade.lean * w;
    const g = 95 + Math.floor(Math.random() * 55);
    const r = Math.floor(g * 0.42);
    const b = Math.floor(g * 0.32);

    const grad = ctx.createLinearGradient(bx, h, bx + lean, tipY);
    grad.addColorStop(0, `rgb(${r - 10},${g - 15},${b - 8})`);
    grad.addColorStop(0.55, `rgb(${r},${g},${b})`);
    grad.addColorStop(1, `rgb(${r + 18},${g + 22},${b + 10})`);

    ctx.beginPath();
    ctx.moveTo(bx - halfW * 0.35, h);
    ctx.quadraticCurveTo(bx + lean * 0.4, h - blade.h * h * 0.45, bx + lean * 0.15, tipY + 8);
    ctx.quadraticCurveTo(bx + lean, tipY, bx + lean * 0.2, tipY);
    ctx.quadraticCurveTo(bx + lean * 0.5, tipY + 6, bx + halfW * 0.35, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  return tex;
}

export function buildGrassTufts(
  scene: THREE.Scene,
  spawn: { x: number; y: number },
  mapWidth: number,
  mapHeight: number
) {
  const rand = mulberry32(91);
  const bladeA = new THREE.PlaneGeometry(0.35, 0.9);
  bladeA.translate(0, 0.45, 0);
  const bladeB = bladeA.clone();
  bladeB.rotateY(Math.PI / 2);
  const bladeGeo = mergeGeometries([bladeA, bladeB]) ?? bladeA;
  const bladeTex = createGrassBladeTexture();
  const bladeMat = new THREE.MeshStandardMaterial({
    map: bladeTex,
    transparent: true,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.95,
    metalness: 0,
    depthWrite: true
  });

  const nearCount = 4500;
  const farCount = 2500;
  const meshes = [
    { count: nearCount, radius: 260, yScale: 1 },
    { count: farCount, radius: 520, yScale: 0.85 }
  ];

  for (const layer of meshes) {
    const inst = new THREE.InstancedMesh(bladeGeo, bladeMat, layer.count);
    inst.castShadow = false;
    inst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    while (placed < layer.count) {
      const angle = rand() * Math.PI * 2;
      const dist = Math.sqrt(rand()) * layer.radius;
      const x = spawn.x + Math.cos(angle) * dist;
      const z = spawn.y + Math.sin(angle) * dist;
      if (x < 2 || z < 2 || x > mapWidth - 2 || z > mapHeight - 2) continue;

      dummy.position.set(x, 0, z);
      dummy.rotation.y = rand() * Math.PI * 2;
      dummy.rotation.z = (rand() - 0.5) * 0.15;
      const s = (0.55 + rand() * 0.9) * layer.yScale;
      dummy.scale.set(s * (0.8 + rand() * 0.4), s, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }
}
