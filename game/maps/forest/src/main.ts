import './style.css';
import { GameLoop } from './game/GameLoop';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas not found');

const progress = window.GameState.getProgress();
if (!progress.completedIntro) {
  window.navigateTo('/start/index.html');
} else {
  window.GameState.save('currentMap', 'forest');
}

const game = new GameLoop(canvas);
game.start();

document.getElementById('btn-menu')?.addEventListener('click', () => {
  window.navigateTo('/index.html');
});
