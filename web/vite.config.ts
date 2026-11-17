import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const PORT = 62467

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
  server: { port: PORT, strictPort: true, fs: { allow: ['..'] }, proxy: { '/api': 'http://localhost:3001' } },
  preview: { port: PORT, strictPort: true },
})
