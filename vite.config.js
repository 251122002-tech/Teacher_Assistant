import { defineConfig } from 'vite';

// The React app lives in frontend/; API calls under /api go to the local Node server.
export default defineConfig({
  root: 'frontend',
  server: {
    proxy: {
      '/api': `http://127.0.0.1:${process.env.API_PORT ?? 3001}`
    }
  }
});
