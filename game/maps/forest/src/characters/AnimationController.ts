import * as THREE from 'three';
import type { AnimState, CharacterAnimConfig } from '../types';

export class AnimationController {
  private current: AnimState = 'idle';
  private actions = new Map<AnimState, THREE.AnimationAction>();
  private proceduralTime = 0;
  private useProcedural: boolean;

  constructor(
    private mixer: THREE.AnimationMixer | null,
    clips: THREE.AnimationClip[],
    animConfig: CharacterAnimConfig,
    private root: THREE.Object3D
  ) {
    this.useProcedural = clips.length === 0;

    if (this.mixer && clips.length > 0) {
      const mapping: [AnimState, string | undefined][] = [
        ['idle', animConfig.idle],
        ['walk', animConfig.walk],
        ['run', animConfig.run],
        ['jump', animConfig.jump]
      ];

      for (const [state, clipName] of mapping) {
        const clip =
          clips.find((c) => c.name === clipName) ||
          clips.find((c) => c.name.toLowerCase().includes(state)) ||
          clips[0];
        if (clip) {
          const action = this.mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          this.actions.set(state, action);
        }
      }

      const idle = this.actions.get('idle');
      idle?.play();
    }
  }

  update(delta: number, speed: number, isRunning: boolean, isGrounded: boolean) {
    let next: AnimState = 'idle';
    if (!isGrounded) next = 'jump';
    else if (isRunning && speed > 0.5) next = 'run';
    else if (speed > 0.08) next = 'walk';

    if (next !== this.current) {
      this.crossfade(this.current, next, 0.25);
      this.current = next;
    }

    if (this.mixer && !this.useProcedural) {
      this.mixer.update(delta);
    } else if (this.useProcedural) {
      this.applyProcedural(delta, next, speed);
    }
  }

  private crossfade(from: AnimState, to: AnimState, duration: number) {
    const prev = this.actions.get(from);
    const next = this.actions.get(to);
    if (!next) return;
    prev?.fadeOut(duration);
    next.reset().fadeIn(duration).play();
  }

  /** حركة بديلة عند غياب ملف GLB */
  private applyProcedural(delta: number, state: AnimState, speed: number) {
    this.proceduralTime += delta;
    const t = this.proceduralTime;

    if (state === 'idle') {
      this.root.position.y = Math.sin(t * 2) * 0.03;
      this.root.rotation.x = 0;
    } else if (state === 'walk') {
      this.root.position.y = Math.abs(Math.sin(t * 8)) * 0.08;
      this.root.rotation.z = Math.sin(t * 8) * 0.04;
    } else if (state === 'run') {
      this.root.position.y = Math.abs(Math.sin(t * 12)) * 0.12;
      this.root.rotation.z = Math.sin(t * 12) * 0.06;
    } else if (state === 'jump') {
      this.root.position.y = 0.4 + Math.sin(t * 6) * 0.1;
      this.root.rotation.x = -0.2;
    }
  }

  getCurrentState() {
    return this.current;
  }
}
