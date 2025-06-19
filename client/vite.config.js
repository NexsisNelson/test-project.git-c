import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: ['all', 'a5a68924-10d5-47c8-966a-010df790457f-00-513w68ouo1bt.picard.replit.dev'],
    strictPort: false
  }
})
