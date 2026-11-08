import { normalizePhone, isValidPhone } from '../src/domain/phone.ts';
import { hashPassword, verifyPassword } from './passwords.mjs';

/**
 * Tài khoản Quản trị gốc lấy từ biến môi trường — tự tạo / cập nhật mật khẩu khi máy chủ khởi động.
 *   ADMIN_PHONE     số điện thoại đăng nhập (vd 0912345678)
 *   ADMIN_PASSWORD  mật khẩu (8–32 ký tự, có hoa, thường, số, ký tự đặc biệt)
 *   ADMIN_NAME      (tuỳ chọn) tên hiển thị
 * Không đặt 2 biến đầu thì bỏ qua. Mật khẩu chỉ lưu dạng băm bcrypt.
 * Đổi ADMIN_PASSWORD rồi khởi động lại = đặt lại mật khẩu admin.
 */
export async function ensureAdminAccount(db, env = process.env, log = console) {
  const phone = normalizePhone(String(env.ADMIN_PHONE ?? ''));
  const password = String(env.ADMIN_PASSWORD ?? '');
  if (!phone && !password) return null;
  if (!isValidPhone(phone)) {
    log.warn('[admin] ADMIN_PHONE không hợp lệ — bỏ qua tạo tài khoản admin.');
    return null;
  }
  const name = String(env.ADMIN_NAME ?? '').trim().slice(0, 60) || 'Quản trị hệ thống';

  const { state } = await db.read();
  let user = state.users.find((u) => u.phone === phone);
  if (user && user.role !== 'admin') {
    // Không tự nâng quyền một tài khoản khách/HTX đã có — tránh chiếm quyền nhầm.
    log.warn(`[admin] Số ${phone} đang là tài khoản ${user.role}; không nâng thành admin. Dùng số khác cho ADMIN_PHONE.`);
    return null;
  }
  if (!user) {
    user = { id: 'admin-root-env', phone, name, role: 'admin', adminGroup: 'root', status: 'active', createdAt: new Date().toISOString() };
    state.users.push(user);
    await db.save(state);
    await db.audit(user.id, 'admin-account-created-from-env');
    log.info?.(`[admin] Đã tạo tài khoản Quản trị gốc ${phone}.`);
  } else if (user.adminGroup !== 'root' || user.status !== 'active') {
    Object.assign(user, { adminGroup: 'root', status: 'active' });
    await db.save(state);
  }

  const row = await db.sql.prepare('SELECT password_hash FROM password_credentials WHERE user_id=?').get(user.id);
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    const hash = await hashPassword(password); // kiểm tra độ mạnh mật khẩu
    await db.sql
      .prepare('INSERT INTO password_credentials(user_id,password_hash) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET password_hash=excluded.password_hash')
      .run(user.id, hash);
    await db.sql.prepare('DELETE FROM password_attempts WHERE phone=?').run(phone);
    await db.audit(user.id, 'admin-password-set-from-env');
  }
  return user;
}
