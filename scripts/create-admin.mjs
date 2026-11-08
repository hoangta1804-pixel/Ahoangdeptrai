/**
 * Tạo / đặt lại mật khẩu tài khoản Quản trị gốc trực tiếp trên database (vd Supabase của bản deploy).
 *
 *   ADMIN_PHONE=09xxxxxxxx ADMIN_PASSWORD='MatKhau@123' node scripts/create-admin.mjs [file-env]
 *
 * - file-env mặc định: .env.vercel — chỉ đọc cấu hình database từ file này (không lẫn .env.local).
 * - Số điện thoại & mật khẩu lấy từ biến môi trường lúc chạy, không ghi vào file.
 * - Dữ liệu ứng dụng được mã hoá bằng DATA_ENCRYPTION_KEY nên không thể chèn admin bằng SQL tay.
 */
import '../server/register.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';

const file = process.argv[2] ?? '.env.vercel';
if (!existsSync(file)) throw new Error(`Không thấy file ${file}.`);
const cfg = parseEnv(readFileSync(file, 'utf8'));
for (const key of ['DATABASE_PROVIDER', 'SUPABASE_DB_URL', 'DATA_ENCRYPTION_KEY']) {
  if (!cfg[key]) throw new Error(`${file} thiếu ${key}.`);
}
if (!process.env.ADMIN_PHONE || !process.env.ADMIN_PASSWORD) {
  throw new Error('Đặt ADMIN_PHONE và ADMIN_PASSWORD khi chạy lệnh.');
}

const { openDatabase } = await import('../server/postgres-database.mjs');
const { ensureAdminAccount } = await import('../server/admin-account.mjs');

// Chứng chỉ CA của Supabase (Project Settings → Database → SSL → Download certificate)
const caPath = process.env.SUPABASE_DB_CA_PATH ?? cfg.SUPABASE_DB_CA_PATH;
const ca = cfg.SUPABASE_DB_CA?.trim() ? cfg.SUPABASE_DB_CA.replace(/\\n/g, '\n') : caPath ? readFileSync(caPath, 'utf8') : undefined;
if (!ca) throw new Error('Thiếu chứng chỉ Supabase. Đặt SUPABASE_DB_CA_PATH=<đường dẫn prod-ca-2021.crt>.');

const db = await openDatabase({
  demo: false,
  databaseProvider: cfg.DATABASE_PROVIDER,
  connectionString: cfg.SUPABASE_DB_URL,
  encryptionKey: cfg.DATA_ENCRYPTION_KEY,
  ca,
});
try {
  // Sao lưu app_state (đã mã hoá) trước khi ghi — khôi phục được nếu cần
  const { mkdirSync, writeFileSync } = await import('node:fs');
  const row = await db.sql.prepare('SELECT version,data FROM app_state WHERE id=1').get();
  mkdirSync('data/backups', { recursive: true });
  const backup = `data/backups/app_state-before-admin-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(backup, JSON.stringify(row));
  console.log(`Đã sao lưu app_state (version ${row?.version}) → ${backup}`);

  const user = await ensureAdminAccount(db, {
    ADMIN_PHONE: process.env.ADMIN_PHONE,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_NAME: process.env.ADMIN_NAME,
  });
  if (!user) {
    console.error('Không tạo được admin (xem cảnh báo ở trên).');
    process.exitCode = 1;
  } else {
    console.log(`OK: tài khoản Quản trị gốc ${user.phone} (id ${user.id}, nhóm ${user.adminGroup}) đã sẵn sàng.`);
  }
} finally {
  await db.close();
}
