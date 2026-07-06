import * as THREE from 'three';
import { buildFallbackTrees, loadForestTrees } from './TreeLoader';
import { buildGrassTufts, createGrassGroundTexture } from './GrassField';
import { buildPebbles, buildRockScatter } from './RockScatter';

export interface MapObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  solid: boolean;
}

export interface ForestMapData {
  widthM: number;
  heightM: number;
  spawnPoint: { x: number; y: number };
  trees: MapObstacle[];
  rocks: MapObstacle[];
  lakes: { x: number; y: number; width: number; height: number }[];
}

export class ForestScene {
  readonly scene = new THREE.Scene();
  private ground!: THREE.Mesh;

  constructor(private mapData: ForestMapData) {
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 60, 320);
    this.buildGround();
    this.buildGrass();
    void this.buildTrees();
    this.buildRocks();
    this.buildPebbles();
    this.buildLakes();
    this.buildLighting();
  }

  private buildGround() {
    const tex = createGrassGroundTexture();
    const geo = new THREE.PlaneGeometry(this.mapData.widthM, this.mapData.heightM);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: 0x9ec492,
      roughness: 0.95,
      metalness: 0
    });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(this.mapData.widthM / 2, 0, this.mapData.heightM / 2);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  private buildGrass() {
    buildGrassTufts(
      this.scene,
      this.mapData.spawnPoint,
      this.mapData.widthM,
      this.mapData.heightM
    );
  }

  private async buildTrees() {
    try {
      await loadForestTrees(this.scene, this.mapData.trees, this.mapData.spawnPoint);
    } catch {
      buildFallbackTrees(this.scene, this.mapData.trees, this.mapData.spawnPoint);
    }
  }

  private buildRocks() {
    buildRockScatter(this.scene, this.mapData.rocks, this.mapData.spawnPoint);
  }

  private buildPebbles() {
    buildPebbles(
      this.scene,
      this.mapData.spawnPoint,
      this.mapData.widthM,
      this.mapData.heightM
    );
  }

  private buildLakes() {
    for (const lake of this.mapData.lakes) {
      const geo = new THREE.PlaneGeometry(lake.width, lake.height);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x1a6b8a,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
        metalness: 0.2
      });
      const water = new THREE.Mesh(geo, mat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(lake.x + lake.width / 2, 0.05, lake.y + lake.height / 2);
      this.scene.add(water);
    }
  }

  private buildLighting() {
    const hemi = new THREE.HemisphereLight(0xb1e1ff, 0x3d5c2e, 0.6);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.1);
    sun.position.set(200, 400, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 800;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    this.scene.add(sun);

    this.scene.add(new THREE.AmbientLight(0x404040, 0.35));
  }

  worldToScene(x: number, y: number): THREE.Vector3 {
    return new THREE.Vector3(x, 0, y);
  }
}

export function checkObstacleCollision(
  mapData: ForestMapData,
  x: number,
  z: number,
  radius: number
): boolean {
  const box = { x: x - radius, y: z - radius, width: radius * 2, height: radius * 2 };
  const obstacles = [...mapData.trees, ...mapData.rocks];
  for (const obs of obstacles) {
    if (
      box.x < obs.x + obs.width &&
      box.x + box.width > obs.x &&
      box.y < obs.y + obs.height &&
      box.y + box.height > obs.y
    ) {
      return true;
    }
  }
  return false;
}
