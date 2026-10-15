/// <reference types="node" />
/**
 * API dữ liệu demo dùng chung: /api/state (Vercel Serverless Function).
 *
 * Toàn bộ dữ liệu demo (DemoState) được lưu thành một bản ghi, kèm số phiên bản.
 * Quy tắc nghiệp vụ vẫn chạy trên trình duyệt (src/domain); API chỉ đọc và ghi bản ghi này
 * để nhiều máy cùng thấy một dữ liệu: khách đặt trên điện thoại, HTX và Admin xử lý trên máy khác.
 *
 *   GET  /api/state             → { changed: true, version, schema, data, updatedAt }  (data = null khi chưa có)
 *   GET  /api/state?since=N     → { changed: false, version } nếu phiên bản vẫn là N (chỉ tốn 1 lệnh đọc)
 *   PUT  /api/state             ← { baseVersion, schema, data }
 *                               → 200 { version }            ghi thành công, phiên bản tăng 1
 *                               → 409 { error, version, schema, data }  có máy khác vừa ghi; app chạy lại thao tác rồi gửi lại
 *                               → 413 khi dữ liệu quá lớn, 400 khi dữ liệu sai dạng
 *   Chưa nối cơ sở dữ liệu      → 503; app tự quay về lưu trên trình duyệt như trước.
 *
 * Nơi lưu: Upstash Redis (thêm qua Vercel Marketplace). Đọc biến môi trường KV_REST_API_URL / KV_REST_API_TOKEN
 * hoặc UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Ghi có kiểm tra phiên bản bằng một đoạn Lua chạy nguyên tử,
 * nên hai máy ghi cùng lúc không ghi đè mất dữ liệu của nhau.
 *
 * Đây là API cho bản demo: không có đăng nhập phía server, ai có link cũng đọc và ghi được dữ liệu demo.
 * Không nhập dữ liệu cá nhân thật.
 *
 * File này tự chứa (chỉ import @upstash/redis) để Vercel chạy được ở chế độ ES module mà không cần đường dẫn import tương đối.
 */
import { Redis } from '@upstash/redis';

/** Giới hạn kích thước bản ghi (byte). Ảnh khiếu nại / đánh giá đã thu nhỏ còn khoảng 20–40 KB mỗi ảnh. */
export const STATE_LIMIT_BYTES = 900_000;

export interface StoredState {
  version: number;
  schema: number | null;
  data: unknown;
  updatedAt: string | null;
}

export interface StateStore {
  /** Phiên bản hiện tại (0 khi chưa có dữ liệu). */
  version(): Promise<number>;
  read(): Promise<StoredState>;
  /** Ghi `payload` nếu phiên bản hiện tại đúng bằng `baseVersion`; trả về phiên bản sau khi ghi hoặc phiên bản đang có. */
  write(baseVersion: number, payload: string): Promise<{ ok: boolean; version: number }>;
}

interface Envelope {
  schema: number;
  data: unknown;
  updatedAt: string;
}

function parseEnvelope(version: number, raw: string | null): StoredState {
  if (!raw) return { version, schema: null, data: null, updatedAt: null };
  try {
    const env = JSON.parse(raw) as Envelope;
    return { version, schema: typeof env.schema === 'number' ? env.schema : null, data: env.data ?? null, updatedAt: env.updatedAt ?? null };
  } catch {
    return { version, schema: null, data: null, updatedAt: null };
  }
}

/** Kho trong bộ nhớ: dùng khi chạy `npm run dev` / `npm run preview` và trong test. Mất dữ liệu khi tắt server. */
export function createMemoryStore(): StateStore {
  let version = 0;
  let payload: string | null = null;
  return {
    async version() {
      return version;
    },
    async read() {
      return parseEnvelope(version, payload);
    },
    async write(baseVersion, next) {
      if (baseVersion !== version) return { ok: false, version };
      payload = next;
      version += 1;
      return { ok: true, version };
    },
  };
}

// So phiên bản rồi ghi trong một bước (nguyên tử) trên Redis.
const COMPARE_AND_SET = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current ~= tonumber(ARGV[1]) then
  return {0, current}
end
local nextVersion = current + 1
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SET', KEYS[1], nextVersion)
return {1, nextVersion}
`;

export function createRedisStore(redis: Redis, prefix = 'dacsan-demo'): StateStore {
  const versionKey = `${prefix}:version`;
  const stateKey = `${prefix}:state`;
  return {
    async version() {
      return Number((await redis.get<string>(versionKey)) ?? 0);
    },
    async read() {
      const [version, raw] = await redis.mget<[string | null, string | null]>(versionKey, stateKey);
      return parseEnvelope(Number(version ?? 0), raw);
    },
    async write(baseVersion, payload) {
      const [ok, version] = (await redis.eval(COMPARE_AND_SET, [versionKey, stateKey], [String(baseVersion), payload])) as [number, number];
      return { ok: Number(ok) === 1, version: Number(version) };
    },
  };
}

/**
 * Địa chỉ và token Upstash từ biến môi trường. Tên mặc định khi nối qua Vercel Marketplace là KV_REST_API_URL / KV_REST_API_TOKEN;
 * nếu lúc nối có đặt tiền tố riêng (vd. DACSAN) thì thành DACSAN_REST_API_URL / DACSAN_REST_API_TOKEN, vẫn nhận.
 */
export function redisConfigFromEnv(env: Record<string, string | undefined>): { url: string; token: string } | null {
  const candidates = [
    'KV_REST_API_URL',
    'UPSTASH_REDIS_REST_URL',
    ...Object.keys(env)
      .filter((k) => /_REST_API_URL$|^UPSTASH_REDIS_REST_URL$/.test(k))
      .sort(),
  ];
  for (const urlKey of candidates) {
    const url = env[urlKey];
    const token = env[urlKey.replace(/_URL$/, '_TOKEN')];
    if (url && token) return { url, token };
  }
  return null;
}

/** Kho Redis từ biến môi trường; không có cấu hình thì trả về null. */
export function storeFromEnv(env: Record<string, string | undefined> = process.env): StateStore | null {
  const config = redisConfigFromEnv(env);
  if (!config) return null;
  return createRedisStore(new Redis({ ...config, automaticDeserialization: false }));
}

export interface ApiRequest {
  method?: string;
  query?: Record<string, unknown>;
  body?: unknown;
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Kiểm tra sơ bộ dữ liệu demo: đúng dạng một DemoState (không kiểm tra từng trường). */
function looksLikeDemoState(data: unknown): boolean {
  if (!isObject(data)) return false;
  return ['users', 'products', 'orders', 'coops', 'customers'].every((k) => Array.isArray(data[k]));
}

/** Xử lý yêu cầu, không phụ thuộc Vercel: dùng chung cho hàm Vercel, server dev của Vite và test. */
export async function handleStateRequest(req: ApiRequest, store: StateStore): Promise<ApiResult> {
  if (req.method === 'GET') {
    const since = Number(first(req.query?.since));
    if (Number.isInteger(since) && since > 0) {
      const version = await store.version();
      if (version === since) return { status: 200, body: { changed: false, version } };
    }
    const stored = await store.read();
    return { status: 200, body: { changed: true, ...stored } };
  }

  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return { status: 400, body: { error: 'Nội dung gửi lên không phải JSON.' } };
      }
    }
    if (!isObject(body)) return { status: 400, body: { error: 'Thiếu nội dung gửi lên.' } };
    const { baseVersion, schema, data } = body;
    if (!Number.isInteger(baseVersion) || (baseVersion as number) < 0) return { status: 400, body: { error: 'baseVersion phải là số nguyên không âm.' } };
    if (!Number.isInteger(schema)) return { status: 400, body: { error: 'Thiếu schema (phiên bản cấu trúc dữ liệu).' } };
    if (!looksLikeDemoState(data)) return { status: 400, body: { error: 'Dữ liệu không đúng dạng dữ liệu demo.' } };

    const payload = JSON.stringify({ schema: schema as number, data, updatedAt: new Date().toISOString() } satisfies Envelope);
    const bytes = new TextEncoder().encode(payload).length;
    if (bytes > STATE_LIMIT_BYTES) {
      return {
        status: 413,
        body: { error: `Dữ liệu demo quá lớn (${Math.round(bytes / 1000)} KB, tối đa ${Math.round(STATE_LIMIT_BYTES / 1000)} KB). Hãy bớt ảnh hoặc khôi phục dữ liệu mẫu.` },
      };
    }

    const result = await store.write(baseVersion as number, payload);
    if (!result.ok) {
      const latest = await store.read();
      return { status: 409, body: { error: 'Dữ liệu vừa được máy khác cập nhật.', ...latest } };
    }
    return { status: 200, body: { version: result.version } };
  }

  return { status: 405, body: { error: 'Chỉ hỗ trợ GET và PUT.' } };
}

/** Kiểu tối thiểu của request / response trong Vercel Node.js runtime. */
interface VercelLikeRequest extends ApiRequest {
  query: Record<string, string | string[] | undefined>;
}
interface VercelLikeResponse {
  status(code: number): VercelLikeResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const store = storeFromEnv();
  if (!store) {
    res.status(503).json({ error: 'API chưa nối cơ sở dữ liệu (thiếu biến môi trường KV_REST_API_URL và KV_REST_API_TOKEN của Upstash). App đang lưu dữ liệu trên từng trình duyệt.', configured: false });
    return;
  }
  try {
    const result = await handleStateRequest(req, store);
    if (result.status === 405) res.setHeader('Allow', 'GET, PUT');
    res.status(result.status).json(result.body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Không đọc hoặc ghi được cơ sở dữ liệu.' });
  }
}
