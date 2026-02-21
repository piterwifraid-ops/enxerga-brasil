import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    historyApiFallback: true,
    proxy: {
      '/api/babylon': {
        target: 'https://api.bancobabylon.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/babylon/, '/functions/v1/transactions'),
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});