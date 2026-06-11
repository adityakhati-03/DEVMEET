import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@devmeet/shared': path.resolve(__dirname, '../../packages/shared/src/index'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/collaboration': {
        target: 'ws://localhost:5000',
        ws: true,
      }
    }
  },
  preview: {
    port: 4173,
  },
});
