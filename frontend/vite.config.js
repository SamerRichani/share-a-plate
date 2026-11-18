import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      // During development, requests to /api go to the backend server.
      proxy: { '/api': env.API_PROXY_TARGET || 'http://localhost:5001' },
    },
    // Settings for `npm test` (Vitest).
    test: {
      environment: 'jsdom',
      setupFiles: './src/tests/setup.js',
    },
  };
});
