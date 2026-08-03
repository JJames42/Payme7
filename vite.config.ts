import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'paymebusinessllc.onrender.com',
      '.onrender.com'
    ],
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'paymebusinessllc.onrender.com',
      '.onrender.com'
    ],
  },
  build: {
    outDir: 'dist',
  },
});
