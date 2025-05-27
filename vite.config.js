import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/public',
  base: '/',
  build: {
    outDir: '../../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/public/index.html'),
        player: resolve(__dirname, 'src/public/player.html')
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/proxy': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  css: {
    postcss: './postcss.config.js'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
