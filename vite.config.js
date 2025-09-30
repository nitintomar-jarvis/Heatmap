import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/geojson': {
        target: 'https://storage.googleapis.com/heatmap-man-ki-baat/geojson4.json',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geojson/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://storage.googleapis.com');
          });
        }
      }
    }
  }
})
