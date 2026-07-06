export type AnimState = 'idle' | 'walk' | 'run' | 'jump';

export interface CharacterAnimConfig {
  idle?: string;
  walk?: string;
  run?: string;
  jump?: string;
}
