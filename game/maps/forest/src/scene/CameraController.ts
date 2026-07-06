import * as THREE from 'three';

export class CameraController {
  private lookAtOffset = new THREE.Vector3(0, 1.5, 0);
  private distance: number;
  private yaw: number;
  private pitch: number;
  private readonly minPitch = THREE.MathUtils.degToRad(8);
  private readonly maxPitch = THREE.MathUtils.degToRad(72);
  private readonly sensitivity = 0.004;
  private readonly zoomStep = 1.5;
  private readonly minDistance = 4;
  private readonly maxDistance = 14;

  constructor(private camera: THREE.PerspectiveCamera) {
    const base = new THREE.Vector3(0, 6, 10).applyAxisAngle(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(20)
    );
    this.distance = base.length();
    this.yaw = Math.atan2(base.x, base.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(base.y / this.distance, -1, 1));
  }

  addMouseDelta(dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    this.yaw -= dx * this.sensitivity;
    this.pitch += dy * this.sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch, this.minPitch, this.maxPitch);
  }

  /** خطوة ثابتة لكل نقرة بكرة الماوس: +1 = تقريب، -1 = إبعاد */
  adjustZoom(steps: number) {
    if (steps === 0) return;
    this.distance -= steps * this.zoomStep;
    this.distance = THREE.MathUtils.clamp(this.distance, this.minDistance, this.maxDistance);
  }

  /** اتجاه نظر الكamera على مستوى الأرض (داخل الشاشة) */
  getForwardOnXZ(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  getRightOnXZ(): THREE.Vector3 {
    return new THREE.Vector3()
      .crossVectors(this.getForwardOnXZ(), new THREE.Vector3(0, 1, 0))
      .normalize();
  }

  follow(target: THREE.Object3D, delta: number) {
    const cosPitch = Math.cos(this.pitch);
    const offset = new THREE.Vector3(
      this.distance * cosPitch * Math.sin(this.yaw),
      this.distance * Math.sin(this.pitch),
      this.distance * cosPitch * Math.cos(this.yaw)
    );

    const ideal = target.position.clone().add(offset);
    this.camera.position.lerp(ideal, 1 - Math.pow(0.001, delta));
    const lookTarget = target.position.clone().add(this.lookAtOffset);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(lookTarget);
  }
}
