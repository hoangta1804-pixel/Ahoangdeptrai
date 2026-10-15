import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import {defineConfig, type Connect, type Plugin} from 'vite';
import { createMemoryStore, handleStateRequest } from './api/state';

/**
 * /api/state khi chạy `npm run dev` hoặc `npm run preview`: cùng logic với hàm trên Vercel (api/state.ts)
 * nhưng lưu trong bộ nhớ của server, mất khi tắt server. Dùng để thử demo nhiều tab / nhiều máy trong mạng nội bộ.
 */
function demoApiPlugin(): Plugin {
  const store = createMemoryStore();
  const readBody = (req: IncomingMessage) =>
    new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  const middleware: Connect.NextHandleFunction = (req, res: ServerResponse, next) => {
    if (!req.url?.startsWith('/api/state')) return next();
    const url = new URL(req.url, 'http://localhost');
    (async () => {
      const body = req.method === 'PUT' ? await readBody(req) : undefined;
      const result = await handleStateRequest({ method: req.method, query: Object.fromEntries(url.searchParams), body }, store);
      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(result.body));
    })().catch((e) => {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(e) }));
    });
  };
  return {
    name: 'demo-api-memory',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), demoApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
