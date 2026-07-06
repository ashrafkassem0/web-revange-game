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
        const clip = this.findClip(clips, clipName, state);
        if (clip) {
          const action = this.mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          this.actions.set(state, action);
        }
      }

      const idle = this.actions.get('idle');
      if (idle) {
        idle.time = 0;
        idle.timeScale = 0;
        idle.play();
      }
    }
  }

  private findClip(
    clips: THREE.AnimationClip[],
    clipName: string | undefined,
    state: AnimState
  ): THREE.AnimationClip | undefined {
    if (clipName) {
      const exact = clips.find((c) => c.name === clipName);
      if (exact) return exact;
    }
    return (
      clips.find((c) => c.name.toLowerCase().includes(state)) ||
      clips.find((c) => c.name.toLowerCase().includes(clipName?.toLowerCase() ?? ''))
    );
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
      this.applyStateSpeed(this.current);
      this.mixer.update(delta);
    } else if (this.useProcedural) {
      this.applyProcedural(delta, next, speed);
    }
  }

  private applyStateSpeed(state: AnimState) {
    for (const [name, action] of this.actions) {
      if (name === 'idle') {
        action.timeScale = state === 'idle' ? 0 : 1;
        if (state === 'idle') action.time = 0;
      } else {
        action.timeScale = name === state ? 1 : 1;
      }
    }
  }

  private crossfade(from: AnimState, to: AnimState, duration: number) {
    const prev = this.actions.get(from);
    const next = this.actions.get(to);
    if (!next) return;

    for (const action of this.actions.values()) {
      action.timeScale = 1;
    }

    prev?.fadeOut(duration);
    next.reset().fadeIn(duration).play();

    if (to === 'idle') {
      next.time = 0;
      next.timeScale = 0;
    }
  }

  private applyProcedural(delta: number, state: AnimState, _speed: number) {
    this.proceduralTime += delta;
    const t = this.proceduralTime;

    if (state === 'idle') {
      this.root.position.y = Math.sin(t * 2) * 0.03;
    } else if (state === 'walk') {
      this.root.position.y = Math.abs(Math.sin(t * 8)) * 0.08;
    } else if (state === 'run') {
      this.root.position.y = Math.abs(Math.sin(t * 12)) * 0.12;
    } else if (state === 'jump') {
      this.root.position.y = 0.4 + Math.sin(t * 6) * 0.1;
    }
  }

  getCurrentState() {
    return this.current;
  }
}
