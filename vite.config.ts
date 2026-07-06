import { defineConfig, type Plugin } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gameRoot = path.resolve(__dirname, 'game');

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function copyGameAssets(): Plugin {
  return {
    name: 'copy-game-assets',
    closeBundle() {
      const src = path.join(gameRoot, 'assets');
      const dest = path.resolve(__dirname, 'dist/assets');
      if (fs.existsSync(src)) copyDir(src, dest);
    }
  };
}

export default defineConfig({
  root: gameRoot,
  plugins: [copyGameAssets()],
  server: {
    port: 5173,
    open: '/index.html'
  },
  optimizeDeps: {
    include: ['three']
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      input: {
        main: path.resolve(gameRoot, 'index.html'),
        intro: path.resolve(gameRoot, 'start/index.html'),
        forest: path.resolve(gameRoot, 'maps/forest/index.html')
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three',
              test: /node_modules[\\/]three/,
              priority: 20
            }
          ]
        }
      }
    }
  }
});
