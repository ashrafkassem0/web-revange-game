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
  build: {
    outDir: path.resolve(__dirname, 'dist/forest'),
    emptyOutDir: true
  }
});
