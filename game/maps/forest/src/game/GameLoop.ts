import * as THREE from 'three';
import { AnimatedCharacter } from '../characters/AnimatedCharacter';
import { ForestScene, checkObstacleCollision, type ForestMapData } from '../scene/ForestScene';
import { CameraController } from '../scene/CameraController';
import { PlayerInput } from '../input/PlayerInput';
import { MovementConfig, SprintStamina } from './SprintStamina';

declare global {
  interface Window {
    GameState: {
      getHeroRuntime: () => { stats: Record<string, number>; skills: Record<string, number> };
      saveHeroRuntime: (h: { stats: Record<string, number>; skills: Record<string, number> }) => void;
      getInventory: () => Record<string, unknown>;
      saveInventory: (i: Record<string, unknown>) => void;
      getTotalDistanceRun: () => number;
      saveTotalDistanceRun: (m: number) => void;
      getProgress: () => Record<string, unknown>;
      save: (k: string, v: unknown) => void;
    };
    CHARACTERS: Record<string, {
      model: string;
      scale: number;
      facingOffset?: number;
      animations: Record<string, string>;
      stats: Record<string, number>;
      skills: Record<string, number>;
    }>;
    FOREST_MAP: ForestMapData;
    navigateTo: (p: string) => void;
  }
}

export class GameLoop {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private forestScene: ForestScene;
  private cameraCtrl: CameraController;
  private input: PlayerInput;
  private hero: AnimatedCharacter;
  private heroStats: { stats: Record<string, number>; skills: Record<string, number> };
  private velocityY = 0;
  private isGrounded = true;
  private totalDistance = 0;
  private currentSpeedMps = 0;
  private isSprinting = false;
  private sprint = new SprintStamina();
  private clock = new THREE.Clock();
  private mapData: ForestMapData;

  constructor(canvas: HTMLCanvasElement) {
    this.mapData = window.FOREST_MAP;
    const heroDef = window.CHARACTERS.hero;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    canvas.tabIndex = 0;
    canvas.focus();

    this.input = new PlayerInput(canvas);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.5, 2000);
    this.forestScene = new ForestScene(this.mapData);
    this.cameraCtrl = new CameraController(this.camera);

    this.heroStats = window.GameState.getHeroRuntime();
    this.hero = new AnimatedCharacter(
      'hero',
      heroDef.animations,
      heroDef.scale,
      heroDef.facingOffset ?? 0
    );
    this.forestScene.scene.add(this.hero.root);

    const spawn = this.mapData.spawnPoint;
    this.hero.setPosition(spawn.x, 0, spawn.y);
    this.totalDistance = window.GameState.getTotalDistanceRun();

    this.onResize();
    this.cameraCtrl.follow(this.hero.root, 1);
    window.addEventListener('resize', () => this.onResize());

    void this.hero.load(heroDef.model);
  }

  private onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private tick() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const camDelta = this.input.consumeCameraDelta();
    this.cameraCtrl.addMouseDelta(camDelta.dx, camDelta.dy);
    this.cameraCtrl.adjustZoom(this.input.consumeZoomSteps());
    this.updateHero(delta);
    this.cameraCtrl.follow(this.hero.root, delta);
    this.hero.update(
      delta,
      this.currentSpeedMps,
      this.isSprinting,
      this.isGrounded
    );
    this.updateHud();
    this.renderer.render(this.forestScene.scene, this.camera);
  }

  private getWorldMoveDirection(): THREE.Vector3 {
    const axes = this.input.getAxes();
    if (axes.forward === 0 && axes.strafe === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    // حركة نسبة لاتجاه الكamera الأفقي
    const moveForward = this.cameraCtrl.getForwardOnXZ();
    const moveRight = this.cameraCtrl.getRightOnXZ();

    const move = new THREE.Vector3();
    move.addScaledVector(moveForward, axes.forward);
    move.addScaledVector(moveRight, axes.strafe);
    if (move.lengthSq() > 0) move.normalize();
    return move;
  }

  private updateHero(delta: number) {
    const move = this.getWorldMoveDirection();
    const isMoving = move.lengthSq() > 0;

    const sprintState = this.sprint.update(delta, this.input.run, isMoving);
    this.isSprinting = sprintState.sprinting;
    this.currentSpeedMps = sprintState.speedMps;

    const speed = this.currentSpeedMps;
    const dx = move.x * speed * delta;
    const dz = move.z * speed * delta;

    if (this.input.consumeJump() && this.isGrounded) {
      this.velocityY = 5;
      this.isGrounded = false;
    }

    this.velocityY -= 18 * delta;
    let ny = this.hero.root.position.y + this.velocityY * delta;
    if (ny <= 0) {
      ny = 0;
      this.velocityY = 0;
      this.isGrounded = true;
    }

    const nx = this.hero.root.position.x + dx;
    const nz = this.hero.root.position.z + dz;
    const r = 0.5;

    if (!checkObstacleCollision(this.mapData, nx, this.hero.root.position.z, r)) {
      this.hero.root.position.x = nx;
    }
    if (!checkObstacleCollision(this.mapData, this.hero.root.position.x, nz, r)) {
      this.hero.root.position.z = nz;
    }
    this.hero.root.position.y = ny;

    if (Math.abs(dx) + Math.abs(dz) > 0.0001) {
      this.hero.faceDirection(dx, dz);
      const dist = Math.hypot(dx, dz);
      this.totalDistance += dist;
      window.GameState.saveTotalDistanceRun(this.totalDistance);
    }
  }

  private updateHud() {
    const hpEl = document.getElementById('hp-value');
    const speedEl = document.getElementById('speed-value');
    const distEl = document.getElementById('dist-value');
    const animEl = document.getElementById('anim-value');
    const sprintEl = document.getElementById('sprint-bar-fill');
    const sprintLabel = document.getElementById('sprint-value');

    if (hpEl) hpEl.textContent = `${Math.round(this.heroStats.stats.hp)}/${this.heroStats.stats.maxHp}`;
    if (speedEl) {
      const label = this.isSprinting ? 'جري' : 'مشي';
      speedEl.textContent = `${this.currentSpeedMps.toFixed(1)} م/ث (${label})`;
    }
    if (distEl) distEl.textContent = `${(this.totalDistance / 1000).toFixed(2)} كم`;
    if (animEl) animEl.textContent = this.hero.anim.getCurrentState();
    if (sprintEl) sprintEl.style.width = `${this.sprint.ratio * 100}%`;
    if (sprintLabel) {
      const left = Math.round(this.sprint.ratio * MovementConfig.sprintMaxM);
      sprintLabel.textContent = this.sprint.exhausted
        ? 'منتهية — امشِ للاستعادة'
        : `${left}/${MovementConfig.sprintMaxM} م`;
    }

    window.GameState.saveHeroRuntime(this.heroStats);
  }
}
