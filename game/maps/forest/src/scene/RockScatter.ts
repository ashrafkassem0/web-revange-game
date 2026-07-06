import * as THREE from 'three';
import type { MapObstacle } from './ForestScene';

function centerOf(item: MapObstacle) {
  return { x: item.x + item.width / 2, z: item.y + item.height / 2 };
}

function distSqToSpawn(item: MapObstacle, spawn: { x: number; y: number }) {
  const c = centerOf(item);
  const dx = c.x - spawn.x;
  const dz = c.z - spawn.y;
  return dx * dx + dz * dz;
}

function selectRocks(rocks: MapObstacle[], spawn: { x: number; y: number }): MapObstacle[] {
  const nearR = 280 * 280;
  const ranked = rocks
    .map((r) => ({ r, d: distSqToSpawn(r, spawn) }))
    .sort((a, b) => a.d - b.d);

  const near = ranked.filter(({ d }) => d <= nearR).map(({ r }) => r);
  const far = ranked.filter(({ d }) => d > nearR).filter((_, i) => i % 3 === 0).map(({ r }) => r);
  return [...near, ...far].slice(0, 220);
}

function makeRockMesh(size: number, variant: number): THREE.Mesh {
  const geos = [
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0)
  ];
  const geo = geos[variant % geos.length];
  const gray = 0x55 + Math.floor(Math.random() * 35);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(`rgb(${gray},${gray - 8},${gray - 14})`),
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true
  });
  const mesh = new THREE.Mesh(geo, mat);
  const s = size * (0.75 + Math.random() * 0.55);
  mesh.scale.set(
    s * (0.85 + Math.random() * 0.3),
    s * (0.55 + Math.random() * 0.35),
    s * (0.85 + Math.random() * 0.3)
  );
  mesh.rotation.set(
    Math.random() * 0.4,
    Math.random() * Math.PI * 2,
    Math.random() * 0.4
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildRockScatter(
  scene: THREE.Scene,
  rocks: MapObstacle[],
  spawn: { x: number; y: number }
) {
  const group = new THREE.Group();
  const toPlace = selectRocks(rocks, spawn);

  for (let i = 0; i < toPlace.length; i++) {
    const rock = toPlace[i];
    const cx = rock.x + rock.width / 2;
    const cz = rock.y + rock.height / 2;
    const clusterSize = 1 + Math.floor(Math.random() * 2.5);

    for (let j = 0; j < clusterSize; j++) {
      const mesh = makeRockMesh(rock.width * 0.45, i + j);
      const spread = rock.width * 0.35;
      mesh.position.set(
        cx + (Math.random() - 0.5) * spread,
        rock.width * 0.22 * (0.5 + Math.random() * 0.5),
        cz + (Math.random() - 0.5) * spread
      );
      group.add(mesh);
    }
  }

  scene.add(group);
}

/** صخور صغيرة زينة فقط (بدون تصادم) */
export function buildPebbles(
  scene: THREE.Scene,
  spawn: { x: number; y: number },
  mapWidth: number,
  mapHeight: number
) {
  const geo = new THREE.DodecahedronGeometry(0.12, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, flatShading: true });
  const count = 800;
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.castShadow = true;
  inst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  let placed = 0;
  while (placed < count) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * 240;
    const x = spawn.x + Math.cos(angle) * dist;
    const z = spawn.y + Math.sin(angle) * dist;
    if (x < 1 || z < 1 || x > mapWidth - 1 || z > mapHeight - 1) continue;

    dummy.position.set(x, 0.06, z);
    dummy.rotation.set(Math.random(), Math.random(), Math.random());
    const s = 0.6 + Math.random() * 1.4;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);
}
