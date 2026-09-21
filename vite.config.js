import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Recovery tool: nothing should ever reach the console.
  esbuild: { drop: ['console', 'debugger'] },
})
