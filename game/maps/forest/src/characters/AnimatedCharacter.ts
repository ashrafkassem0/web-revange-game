import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationController } from './AnimationController';
import type { CharacterAnimConfig } from '../types';

export class AnimatedCharacter {
  readonly root = new THREE.Group();
  anim: AnimationController;
  mixer: THREE.AnimationMixer | null = null;
  modelLoaded = false;

  constructor(
    public readonly id: string,
    private animConfig: CharacterAnimConfig,
    public scale = 1
  ) {
    this.anim = new AnimationController(null, [], animConfig, this.root);
  }

  async load(modelPath: string): Promise<void> {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync(modelPath);
      const model = gltf.scene;
      model.scale.setScalar(this.scale);
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.root.add(model);
      this.mixer = new THREE.AnimationMixer(model);
      this.anim = new AnimationController(
        this.mixer,
        gltf.animations,
        this.animConfig,
        this.root
      );
      this.modelLoaded = true;
    } catch {
      this.buildFallbackMesh();
      this.anim = new AnimationController(null, [], this.animConfig, this.root);
    }
  }

  private buildFallbackMesh() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a6741 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), bodyMat);
    torso.position.y = 1.1;
    torso.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), skinMat);
    head.position.y = 1.65;
    head.castShadow = true;

    const legGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.15, 0.55, 0);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.15, 0.55, 0);

    this.root.add(torso, head, legL, legR);
    this.root.scale.setScalar(this.scale);
  }

  update(delta: number, speed: number, isRunning: boolean, isGrounded: boolean) {
    this.anim.update(delta, speed, isRunning, isGrounded);
  }

  setPosition(x: number, y: number, z: number) {
    this.root.position.set(x, y, z);
  }

  faceDirection(dx: number, dz: number) {
    if (Math.abs(dx) + Math.abs(dz) < 0.001) return;
    this.root.rotation.y = Math.atan2(dx, dz);
  }
}
