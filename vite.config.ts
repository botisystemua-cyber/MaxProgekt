import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// HOSTIQ деплоїть в /BotiLocal/, тому asset paths мають бути відносні.
// Якщо у майбутньому переїдемо на власний домен у root — поміняти на '/'.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
  },
});
