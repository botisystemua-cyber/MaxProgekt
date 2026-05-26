import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' — вивод з відносними шляхами, щоб збірка запрацювала
// в будь-якій підпапці на HOSTIQ (/BotiRestaurant-v1.0/menu-client/).
// Той самий трик використовує весь BotiLogistics-стек.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
