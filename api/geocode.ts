/// <reference types="node" />
/**
 * Tra địa chỉ từ toạ độ GPS bằng Google Maps (Vercel Serverless Function): GET /api/geocode?lat=…&lng=…
 *
 * - Khoá Google Maps chỉ nằm ở server (biến môi trường GOOGLE_MAPS_API_KEY), trình duyệt không thấy.
 * - Chỉ nhận toạ độ trong khung Việt Nam, để khoá không bị dùng cho nơi khác.
 * - Có Upstash Redis (cùng cơ sở dữ liệu với /api/state) thì giới hạn số lượt tra mỗi ngày
 *   (GEOCODE_DAILY_LIMIT, mặc định 300) để không phát sinh phí ngoài ý muốn.
 * - Kết quả được CDN của Vercel giữ 1 ngày theo toạ độ (app làm tròn toạ độ ~11 m), cùng chỗ thì không gọi lại Google.
 * - Không lưu toạ độ.
 *
 *   200 { formattedAddress, street, areas, city }
 *   GET /api/geocode?status=1 → 200 { configured }: chỉ cho biết đã có khoá hay chưa (Công cụ demo), không gọi Google, không tính lượt.
 *   400 toạ độ sai · 422 ngoài Việt Nam · 404 Google không tìm thấy địa chỉ · 429 hết lượt
 *   502 Google từ chối (khoá sai, chưa bật Geocoding API, chưa bật thanh toán) · 503 chưa có khoá
 *
 * File này tự chứa (chỉ import @upstash/redis) giống api/state.ts.
 */
import { Redis } from '@upstash/redis';

/** Khung toạ độ gần đúng của Hà Nội (rộng hơn ranh giới thật một chút). */
export const HANOI_BOUNDS = { south: 20.53, north: 21.39, west: 105.28, east: 106.03 };
export const VIETNAM_BOUNDS = { south: 8.0, north: 23.6, west: 102.0, east: 110.0 };

export const DEFAULT_DAILY_LIMIT = 300;

export function inHanoiBounds(lat: number, lng: number): boolean {
  return lat >= HANOI_BOUNDS.south && lat <= HANOI_BOUNDS.north && lng >= HANOI_BOUNDS.west && lng <= HANOI_BOUNDS.east;
}

export function inVietnamBounds(lat: number, lng: number): boolean {
  return lat >= VIETNAM_BOUNDS.south && lat <= VIETNAM_BOUNDS.north && lng >= VIETNAM_BOUNDS.west && lng <= VIETNAM_BOUNDS.east;
}

export interface GeocodeResult {
  formattedAddress: string;
  /** Số nhà, ngõ, đường (rỗng nếu Google không có). */
  street: string;
  /** Tên phường / xã / khu vực Google trả về, để app khớp với danh sách phường giao hàng. */
  areas: string[];
  city: string;
}

interface AddressComponent {
  long_name: string;
  short_name?: string;
  types: string[];
}
interface GoogleResult {
  formatted_address: string;
  address_components: AddressComponent[];
  types: string[];
}

const AREA_TYPES = ['sublocality_level_1', 'sublocality', 'administrative_area_level_3', 'administrative_area_level_2', 'locality', 'neighborhood'];

/** Đọc kết quả Google: ưu tiên kết quả là địa chỉ cụ thể (số nhà, toà nhà, đường). */
export function parseGoogleResults(results: GoogleResult[]): GeocodeResult | null {
  if (results.length === 0) return null;
  const best = results.find((r) => r.types.some((t) => ['street_address', 'premise', 'subpremise', 'route'].includes(t))) ?? results[0];
  const all = [best, ...results];
  const find = (type: string) => best.address_components.find((c) => c.types.includes(type))?.long_name ?? '';
  const street = [find('premise'), find('street_number'), find('route')].filter(Boolean).join(' ');
  const areas: string[] = [];
  for (const r of all) {
    for (const c of r.address_components) {
      if (c.types.some((t) => AREA_TYPES.includes(t)) && !areas.includes(c.long_name)) areas.push(c.long_name);
    }
  }
  const city = all.flatMap((r) => r.address_components).find((c) => c.types.includes('administrative_area_level_1'))?.long_name ?? '';
  return { formattedAddress: best.formatted_address, street, areas, city };
}

export interface VietmapBoundary {
  id?: number;
  name: string;
  type?: number;
}

export interface VietmapData {
  display?: string;
  address?: string;
  name?: string;
  boundaries?: VietmapBoundary[];
  data_old?: {
    display?: string;
    address?: string;
    boundaries?: VietmapBoundary[];
  };
}

export function parseVietmapResult(data: VietmapData): GeocodeResult | null {
  const formattedAddress = data.display || data.address || '';
  if (!formattedAddress) return null;
  const street = data.name || '';
  const areas: string[] = [];
  const boundaries = [...(data.boundaries ?? []), ...(data.data_old?.boundaries ?? [])];
  for (const b of boundaries) {
    if (b.name && !areas.includes(b.name)) areas.push(b.name);
  }
  const city = boundaries.find((b) => b.type === 1)?.name ?? '';
  return { formattedAddress, street, areas, city };
}

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface GeocodeDeps {
  apiKey?: string;
  provider?: 'vietmap' | 'goong' | 'google';
  fetch: FetchLike;
  /** Tăng và trả về số lượt đã dùng hôm nay (không có thì không giới hạn ở app). */
  countToday?: () => Promise<number>;
  dailyLimit?: number;
}

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
  /** Cho CDN giữ kết quả (chỉ khi thành công). */
  cacheable?: boolean;
}

const first = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);

export async function handleGeocodeRequest(req: { method?: string; query?: Record<string, unknown> }, deps: GeocodeDeps): Promise<ApiResult> {
  if (req.method !== 'GET') return { status: 405, body: { error: 'Chỉ hỗ trợ GET.' } };
  if (first(req.query?.status) !== undefined) return { status: 200, body: { configured: !!deps.apiKey } };
  const lat = Number(first(req.query?.lat));
  const lng = Number(first(req.query?.lng));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { status: 400, body: { error: 'Toạ độ không hợp lệ.' } };
  if (!inVietnamBounds(lat, lng)) return { status: 422, body: { error: 'Vị trí hiện tại nằm ngoài phạm vi Việt Nam.', outside: true } };
  if (!deps.apiKey) return { status: 503, body: { error: 'Chưa bật định vị bản đồ cho bản này (thiếu VIETMAP_API_KEY, GOONG_API_KEY hoặc GOOGLE_MAPS_API_KEY).', configured: false } };

  if (deps.countToday) {
    // Redis lỗi thì vẫn tra (không chặn người dùng), giới hạn của dịch vụ bản đồ vẫn còn.
    const used = await deps.countToday().catch(() => 0);
    if (used > (deps.dailyLimit ?? DEFAULT_DAILY_LIMIT)) return { status: 429, body: { error: 'Hôm nay bản demo đã dùng hết lượt tra địa chỉ. Vui lòng nhập tay.' } };
  }

  const isVietmap = deps.provider === 'vietmap';
  const isGoong = deps.provider === 'goong';
  const providerName = isVietmap ? 'Vietmap' : isGoong ? 'Goong' : 'Google';

  const url = isVietmap
    ? `https://maps.vietmap.vn/api/reverse/v4?apikey=${encodeURIComponent(deps.apiKey)}&lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&display_type=6`
    : isGoong
      ? `https://rsapi.goong.io/geocode?latlng=${lat.toFixed(6)},${lng.toFixed(6)}&api_key=${encodeURIComponent(deps.apiKey)}`
      : `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.toFixed(6)},${lng.toFixed(6)}&language=vi&region=vn&key=${encodeURIComponent(deps.apiKey)}`;

  const res = await deps.fetch(url);
  const data = (await res.json().catch(() => null)) as (GoogleResult & VietmapData & { status?: string; results?: GoogleResult[]; error?: { message?: string }; error_message?: string }) | null;

  if (!res.ok || !data) {
    if (res.status === 401) return { status: 502, body: { error: `${providerName} từ chối: Khoá API không hợp lệ hoặc đã hết hạn.` } };
    return { status: 502, body: { error: `Không gọi được ${providerName} Maps.` } };
  }

  if (isVietmap) {
    const parsed = parseVietmapResult(data);
    if (!parsed) return { status: 404, body: { error: 'Vietmap không tìm thấy địa chỉ tại vị trí này.' } };
    return { status: 200, body: { ...parsed }, cacheable: true };
  }

  if (data.error) {
    console.error(`${providerName} Maps error:`, data.error);
    return { status: 502, body: { error: `${providerName} Maps từ chối: ${data.error.message || 'Kiểm tra khoá API'}.` } };
  }
  switch (data.status) {
    case 'OK': {
      const parsed = parseGoogleResults(data.results ?? []);
      if (!parsed) return { status: 404, body: { error: 'Bản đồ không tìm thấy địa chỉ tại vị trí này.' } };
      return { status: 200, body: { ...parsed }, cacheable: true };
    }
    case 'ZERO_RESULTS':
      return { status: 404, body: { error: 'Bản đồ không tìm thấy địa chỉ tại vị trí này.' } };
    case 'OVER_QUERY_LIMIT':
    case 'OVER_DAILY_LIMIT':
      return { status: 429, body: { error: 'Dịch vụ bản đồ đang hết lượt. Vui lòng nhập tay.' } };
    default:
      console.error(`${providerName} Geocoding:`, data.status, data.error_message);
      return { status: 502, body: { error: `${providerName} Maps từ chối yêu cầu (kiểm tra khoá API).` } };
  }
}

/** Đếm lượt theo ngày trên Upstash Redis (nếu đã nối). */
export function dailyCounterFromEnv(env: Record<string, string | undefined> = process.env): (() => Promise<number>) | undefined {
  const urlKey = ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', ...Object.keys(env).filter((k) => /_REST_API_URL$/.test(k)).sort()].find(
    (k) => env[k] && env[k.replace(/_URL$/, '_TOKEN')],
  );
  if (!urlKey) return undefined;
  const redis = new Redis({ url: env[urlKey]!, token: env[urlKey.replace(/_URL$/, '_TOKEN')]!, automaticDeserialization: false });
  return async () => {
    const key = `dacsan-demo:geocode:${new Date().toISOString().slice(0, 10)}`;
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 2 * 24 * 3600);
    return n;
  };
}

interface VercelLikeRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}
interface VercelLikeResponse {
  status(code: number): VercelLikeResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  try {
    const vietmapKey = process.env.VIETMAP_API_KEY?.trim();
    const goongKey = process.env.GOONG_API_KEY?.trim();
    const googleKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    const apiKey = vietmapKey || goongKey || googleKey;
    const provider: 'vietmap' | 'goong' | 'google' = vietmapKey ? 'vietmap' : goongKey ? 'goong' : 'google';

    const result = await handleGeocodeRequest(req, {
      apiKey,
      provider,
      fetch: (url) => fetch(url),
      countToday: dailyCounterFromEnv(),
      dailyLimit: Number(process.env.GEOCODE_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT,
    });
    res.setHeader('Cache-Control', result.cacheable ? 'public, s-maxage=86400' : 'no-store');
    if (result.status === 405) res.setHeader('Allow', 'GET');
    res.status(result.status).json(result.body);
  } catch (e) {
    console.error(e);
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'Không tra được địa chỉ.' });
  }
}
