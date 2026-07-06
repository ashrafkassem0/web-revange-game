import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, 'game/maps/forest'),
  publicDir: path.resolve(__dirname, 'game'),
  server: {
    port: 5173,
    open: true
  },
  optimizeDeps: {
    include: ['three']
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/forest'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
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
