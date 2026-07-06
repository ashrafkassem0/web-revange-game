import * as THREE from 'three';

export class CameraController {
  private offset = new THREE.Vector3(0, 6, 10);
  private lookAtOffset = new THREE.Vector3(0, 1.5, 0);

  constructor(private camera: THREE.PerspectiveCamera) {}

  follow(target: THREE.Object3D, delta: number) {
    const ideal = target.position.clone().add(this.offset);
    this.camera.position.lerp(ideal, 1 - Math.pow(0.001, delta));
    const lookTarget = target.position.clone().add(this.lookAtOffset);
    this.camera.lookAt(lookTarget);
  }
}
