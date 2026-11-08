import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Database } from '../database.mjs';
import { ensureAdminAccount } from '../admin-account.mjs';
import { verifyPassword } from '../passwords.mjs';

const quiet = { warn() {}, info() {} };
const freshDb = () => new Database(join(mkdtempSync(join(tmpdir(), 'dss-admin-')), 'app.sqlite'), { demo: false });

test('ADMIN_PHONE/ADMIN_PASSWORD tạo Quản trị gốc, mật khẩu chỉ lưu dạng băm', async () => {
  const db = freshDb();
  const user = await ensureAdminAccount(db, { ADMIN_PHONE: '0988000999', ADMIN_PASSWORD: 'Quantri@2026x', ADMIN_NAME: 'Admin thử' }, quiet);
  assert.equal(user.role, 'admin');
  assert.equal(user.adminGroup, 'root');
  const stored = db.read().state.users.find((u) => u.phone === '0988000999');
  assert.equal(stored.adminGroup, 'root');
  const row = db.sql.prepare('SELECT password_hash FROM password_credentials WHERE user_id=?').get(user.id);
  assert.notEqual(row.password_hash, 'Quantri@2026x');
  assert.equal(await verifyPassword('Quantri@2026x', row.password_hash), true);
});

test('đổi ADMIN_PASSWORD rồi khởi động lại = đặt lại mật khẩu; không tạo trùng tài khoản', async () => {
  const db = freshDb();
  await ensureAdminAccount(db, { ADMIN_PHONE: '0988000999', ADMIN_PASSWORD: 'Quantri@2026x' }, quiet);
  const user = await ensureAdminAccount(db, { ADMIN_PHONE: '0988000999', ADMIN_PASSWORD: 'MatKhauMoi#99' }, quiet);
  assert.equal(db.read().state.users.filter((u) => u.phone === '0988000999').length, 1);
  const row = db.sql.prepare('SELECT password_hash FROM password_credentials WHERE user_id=?').get(user.id);
  assert.equal(await verifyPassword('MatKhauMoi#99', row.password_hash), true);
  assert.equal(await verifyPassword('Quantri@2026x', row.password_hash), false);
});

test('không nâng quyền tài khoản khách đã có; bỏ qua khi thiếu cấu hình; từ chối mật khẩu yếu', async () => {
  const db = freshDb();
  const { state } = db.read();
  state.users.push({ id: 'U-khach', phone: '0911222333', name: 'Khách', role: 'customer', status: 'active', createdAt: new Date().toISOString() });
  db.save(state);
  assert.equal(await ensureAdminAccount(db, { ADMIN_PHONE: '0911222333', ADMIN_PASSWORD: 'Quantri@2026x' }, quiet), null);
  assert.equal(db.read().state.users.find((u) => u.phone === '0911222333').role, 'customer');
  assert.equal(await ensureAdminAccount(db, {}, quiet), null);
  await assert.rejects(() => ensureAdminAccount(db, { ADMIN_PHONE: '0988000777', ADMIN_PASSWORD: 'yeu' }, quiet));
});
