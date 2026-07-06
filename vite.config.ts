import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gameRoot = path.resolve(__dirname, 'game');

export default defineConfig({
  root: gameRoot,
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
