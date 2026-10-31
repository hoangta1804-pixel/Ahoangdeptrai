/**
 * Chạy backend Node (server/app.mjs) dạng Vercel Serverless Function, dữ liệu trên Supabase.
 * vercel.json chuyển /api/v1/* và /api/health về đây, kèm đường dẫn gốc trong tham số __path.
 * Việc định kỳ (hết hạn thanh toán, tự xác nhận đã giao, push…) chạy kèm request tối đa 1 lần/30 giây
 * mỗi instance, và Vercel Cron gọi thêm qua /api/backend?__cron=1.
 */
import '../server/register.mjs';

process.env.TZ = 'Asia/Ho_Chi_Minh';
const BACKGROUND_EVERY_MS = 30_000;
let appPromise = null;
let lastBackgroundAt = 0;
const REQUIRED_ENV = ['DATABASE_PROVIDER', 'SUPABASE_DB_URL', 'DATA_ENCRYPTION_KEY', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'ALLOWED_ORIGINS'];

/** Lý do lỗi khởi động đã che chuỗi kết nối, mật khẩu và khoá dài. */
function safeReason(e) {
  // Host pooler (aws-0-<vùng>.pooler.supabase.com) không chứa mã project nên giữ lại để chẩn đoán.
  const hosts = [];
  return `${e.code ? e.code + ': ' : ''}${String(e.message ?? e)}`
    .replace(/postgres(ql)?:\/\/\S+/gi, 'postgresql://***')
    .replace(/\bdb\.[a-z0-9]+\.supabase\.co\b/gi, 'db.***.supabase.co (Direct connection)')
    .replace(/\baws-\d+-[a-z0-9-]+\.pooler\.supabase\.com\b/gi, (host) => `@@${hosts.push(host) - 1}@@`)
    .replace(/[A-Za-z0-9_\-.]{32,}/g, '***')
    .replace(/@@(\d+)@@/g, (_, i) => hosts[Number(i)])
    .slice(0, 300);
}

function application() {
  appPromise ??= (async () => {
    const { configuration } = await import('../server/config.mjs');
    const { createApplication } = await import('../server/app.mjs');
    const options = configuration();
    if (options.databaseProvider !== 'supabase') throw new Error('Trên Vercel cần DATABASE_PROVIDER=supabase.');
    if (!options.demo && !options.encryptionKey) throw new Error('Cần DATA_ENCRYPTION_KEY khi chạy chế độ thật.');
    return createApplication({ ...options, poolMax: options.poolMax ?? 2, backgroundTimers: false });
  })().catch((e) => { appPromise = null; throw e; });
  return appPromise;
}

async function backgroundWork(app, force) {
  if (!force && Date.now() - lastBackgroundAt < BACKGROUND_EVERY_MS) return;
  lastBackgroundAt = Date.now();
  await app.runBackgroundWork().catch((e) => console.error('Background work:', e.code ?? e.name));
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const original = url.searchParams.get('__path');
  const cron = url.searchParams.get('__cron') === '1';
  url.searchParams.delete('__path');
  url.searchParams.delete('__cron');
  let app;
  try {
    app = await application();
  } catch (e) {
    console.error('Backend start:', e.code ?? '', e.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      error: 'Máy chủ chưa cấu hình xong. Kiểm tra biến môi trường trên Vercel.',
      // Chỉ tên biến và mã lỗi, không bao giờ trả giá trị biến hay chuỗi kết nối.
      missing: REQUIRED_ENV.filter((name) => !process.env[name]?.trim()),
      reason: safeReason(e),
      node: process.version,
    }));
  }
  if (cron) {
    // Vercel Cron gửi "Authorization: Bearer <CRON_SECRET>" khi có biến CRON_SECRET.
    const authorized = process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
    res.statusCode = authorized ? 200 : 401;
    if (authorized) await backgroundWork(app, true);
    return res.end();
  }
  await backgroundWork(app, false);
  req.url = (original ?? url.pathname) + url.search;
  await new Promise((resolve) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    app.server.emit('request', req, res);
  });
}
