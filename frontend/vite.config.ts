import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
  },
  server: {
    host: '127.0.0.1',
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3457',
        changeOrigin: true,
      },
      '/go': {
        target: 'http://127.0.0.1:3457',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3457',
        changeOrigin: true,
      },
      '/kv-store.apk': {
        target: 'http://127.0.0.1:3457',
        changeOrigin: true,
      },
    },
  },
});
