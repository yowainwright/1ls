import { defineConfig } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  base: '/1ls/',
  server: {
    port: 3000 + Math.floor(Math.random() * 1000),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '1ls/browser': path.resolve(__dirname, '../dist/browser/index.js'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
