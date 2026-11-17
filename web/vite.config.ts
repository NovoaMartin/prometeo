import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const PORT = 62467

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: PORT, strictPort: true, proxy: { '/api': 'http://localhost:3001' } },
  preview: { port: PORT, strictPort: true },
})
