import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import {defineConfig, loadEnv, type Connect, type Plugin} from 'vite';
import { handleGoogleAuthRequest } from './api/auth/google.ts';
import { handleGeocodeRequest } from './api/geocode.ts';
import { createMemoryStore, handleStateRequest } from './api/state.ts';

/**
 * API khi chạy `npm run dev` hoặc `npm run preview`, cùng logic với các hàm trên Vercel (thư mục api/):
 * - /api/state: lưu trong bộ nhớ của server, mất khi tắt server. Dùng để thử demo nhiều tab / nhiều máy trong mạng nội bộ.
 * - /api/geocode: cần GOOGLE_MAPS_API_KEY trong file .env.local (không có thì trả 503, app báo nhập tay).
 * - /api/auth/google: cần VITE_GOOGLE_CLIENT_ID trong file .env.local.
 */
function demoApiPlugin(env: Record<string, string>): Plugin {
  const store = createMemoryStore();
  const readBody = (req: IncomingMessage) =>
    new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  const route = async (req: IncomingMessage, url: URL) => {
    const query = Object.fromEntries(url.searchParams);
    if (url.pathname === '/api/state') {
      const body = req.method === 'PUT' ? await readBody(req) : undefined;
      return handleStateRequest({ method: req.method, query, body }, store);
    }
    if (url.pathname === '/api/geocode') {
      return handleGeocodeRequest({ method: req.method, query }, { apiKey: env.GOOGLE_MAPS_API_KEY, fetch: (u) => fetch(u) });
    }
    if (url.pathname === '/api/auth/google') {
      const body = req.method === 'POST' ? await readBody(req) : undefined;
      return handleGoogleAuthRequest({ method: req.method, body }, { clientId: env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID, fetch: (u) => fetch(u) });
    }
    return null;
  };
  const middleware: Connect.NextHandleFunction = (req, res: ServerResponse, next) => {
    if (!req.url?.startsWith('/api/')) return next();
    const url = new URL(req.url, 'http://localhost');
    (async () => {
      const result = await route(req, url);
      if (!result) return next();
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

export default defineConfig(({ mode }) => {
  // Đọc cả biến không có tiền tố VITE_ (khoá Google Maps) cho API chạy local; app trên trình duyệt chỉ thấy biến VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), demoApiPlugin(env)],
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
