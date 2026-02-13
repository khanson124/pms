import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiTarget = env.VITE_API_URL || 'http://localhost:4001';
    const allowedHosts = env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',').map((s) => s.trim()) : ['heron', 'spinx-dev', 'spinx-prod', 'localhost', '127.0.0.1'];

    return {
        plugins: [react()],
        define: {
            __APP_VERSION__: JSON.stringify(pkg.version),
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION || pkg.version),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            host: '0.0.0.0', // Listen on all interfaces for server deployment
            port: 5173,
            // Allow requests addressed to specific hostnames when developing on a remote/devbox.
            // Read from `VITE_ALLOWED_HOSTS` env var (comma-separated) or fall back to a safe default.
            // CAUTION: This is for development only — do not expose arbitrary hosts in production.
            allowedHosts,
            proxy: {
                // Proxy API requests to the backend
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                    ws: true, // Enable WebSocket proxying
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            // Ensure cookies are forwarded
                            if (req.headers.cookie) {
                                proxyReq.setHeader('cookie', req.headers.cookie);
                            }
                        });
                    },
                },
                // Note: Only proxy /api paths. DO NOT proxy frontend routes like /procurement, /finance, etc.
                // Those are React Router routes and should be handled by the frontend.
            },
        },
    };
});
