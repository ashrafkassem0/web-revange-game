import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { MapObstacle } from './ForestScene';

const TREE_PATHS = ['/assets/models/trees/tree-1.glb', '/assets/models/trees/tree-2.glb'];
const MAX_RENDER_TREES = 320;
const NEAR_RADIUS_M = 280;

function createLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  loader.setDRACOLoader(draco);
  return loader;
}

function treeCenter(tree: MapObstacle) {
  return {
    x: tree.x + tree.width / 2,
    z: tree.y + tree.height / 2
  };
}

function distSqToPoint(tree: MapObstacle, x: number, z: number) {
  const c = treeCenter(tree);
  const dx = c.x - x;
  const dz = c.z - z;
  return dx * dx + dz * dz;
}

/** أشجار قريبة من البطل أولاً — غابة كثيفة حول الشخصية */
function selectTreesForRender(
  trees: MapObstacle[],
  spawn: { x: number; y: number }
): MapObstacle[] {
  const nearRadiusSq = NEAR_RADIUS_M * NEAR_RADIUS_M;
  const ranked = trees
    .map((tree) => ({ tree, distSq: distSqToPoint(tree, spawn.x, spawn.y) }))
    .sort((a, b) => a.distSq - b.distSq);

  const near = ranked.filter(({ distSq }) => distSq <= nearRadiusSq).map(({ tree }) => tree);
  const far = ranked
    .filter(({ distSq }) => distSq > nearRadiusSq)
    .filter((_, i) => i % 4 === 0)
    .map(({ tree }) => tree);

  return [...near, ...far].slice(0, MAX_RENDER_TREES);
}

function prepareTemplate(model: THREE.Object3D): THREE.Object3D {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y;
  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  return model;
}

function placeTree(instance: THREE.Object3D, tree: MapObstacle) {
  const cx = tree.x + tree.width / 2;
  const cz = tree.y + tree.height / 2;
  instance.position.set(cx, 0, cz);
  instance.rotation.y = Math.random() * Math.PI * 2;

  instance.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(instance);
  const height = Math.max(box.max.y - box.min.y, 0.01);
  const targetHeight = tree.width * 5.5;
  instance.scale.setScalar(targetHeight / height);
}

export async function loadForestTrees(
  scene: THREE.Scene,
  trees: MapObstacle[],
  spawn: { x: number; y: number }
): Promise<void> {
  const loader = createLoader();
  const templates = await Promise.all(
    TREE_PATHS.map(async (path) => {
      const gltf = await loader.loadAsync(path);
      return prepareTemplate(gltf.scene);
    })
  );

  const toRender = selectTreesForRender(trees, spawn);

  for (let i = 0; i < toRender.length; i++) {
    const template = templates[i % templates.length];
    const instance = template.clone(true);
    placeTree(instance, toRender[i]);
    scene.add(instance);
  }
}

export function buildFallbackTrees(
  scene: THREE.Scene,
  trees: MapObstacle[],
  spawn: { x: number; y: number }
) {
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3020 });
  const leafGeo = new THREE.ConeGeometry(1.8, 4, 8);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f5c1a });
  const toRender = selectTreesForRender(trees, spawn);

  for (const tree of toRender) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.y = 4;
    leaves.castShadow = true;
    group.add(trunk, leaves);
    group.position.set(tree.x + tree.width / 2, 0, tree.y + tree.height / 2);
    const s = tree.width / 3;
    group.scale.set(s, s, s);
    scene.add(group);
  }
}
