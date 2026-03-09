import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        proxy: {
            '/api/anthropic': {
                target: 'https://api.anthropic.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
            },
        },
    },
})
