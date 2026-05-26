import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// HOSTIQ деплоїть під /BotiLocal/. Абсолютний base потрібен бо SPA-роути
// типу /menu/paddys рендеряться тим самим index.html, але відносні шляхи
// до assets зламаються (резолвлять у /BotiLocal/menu/paddys/assets/...).
// Якщо у майбутньому переїдемо на власний домен у root — поміняти на '/'.
export default defineConfig({
  base: '/BotiLocal/',
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
