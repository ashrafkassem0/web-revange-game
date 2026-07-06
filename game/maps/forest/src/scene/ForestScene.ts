import * as THREE from 'three';

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
    this.scene.fog = new THREE.Fog(0x87ceeb, 80, 350);
    this.buildGround();
    this.buildTrees();
    this.buildRocks();
    this.buildLakes();
    this.buildLighting();
  }

  private buildGround() {
    const geo = new THREE.PlaneGeometry(this.mapData.widthM, this.mapData.heightM);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3d7a37, roughness: 0.9 });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(this.mapData.widthM / 2, 0, this.mapData.heightM / 2);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  private buildTrees() {
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3020 });
    const leafGeo = new THREE.ConeGeometry(1.8, 4, 8);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f5c1a });

    const sample = this.mapData.trees.filter((_, i) => i % 4 === 0);
    for (const tree of sample) {
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
      this.scene.add(group);
    }
  }

  private buildRocks() {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true });
    const sample = this.mapData.rocks.filter((_, i) => i % 3 === 0);
    for (const rock of sample) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(rock.x + rock.width / 2, rock.width * 0.4, rock.y + rock.height / 2);
      mesh.scale.setScalar(rock.width * 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }
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
