import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Use native URL to resolve path without importing node:url to avoid needing @types/node
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: ['@emotion/babel-plugin'],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': new URL('./src', import.meta.url).pathname
        }
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: 'http://emprendu-backend.test',
                changeOrigin: true
            }
        }
    },
});
