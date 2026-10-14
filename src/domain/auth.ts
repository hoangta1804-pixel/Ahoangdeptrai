/**
 * Đăng nhập demo (mục 5.9, FR-TK-01/02): SĐT + OTP mô phỏng, mã cố định 123456.
 * Đổi vai trò bằng đăng xuất rồi đăng nhập tài khoản khác.
 */
import { generateId } from './ids';
import { iso } from './state';
import { fail, ok, type Actor, type DemoState, type Result, type UserAccount } from './types';

/** OTP mô phỏng, không gửi SMS thật. */
export const DEMO_OTP = '123456';

export const normalizePhone = (phone: string): string => phone.replace(/\D/g, '');

const PHONE_RE = /^0\d{9}$/;

export function findUserByPhone(state: DemoState, phone: string): UserAccount | undefined {
  const p = normalizePhone(phone);
  return state.users.find((u) => u.phone === p);
}

/** Bước 1: nhập SĐT. Không có tài khoản thì gợi ý đăng ký. */
export function requestOtp(state: DemoState, phone: string): Result<UserAccount> {
  const p = normalizePhone(phone);
  if (!PHONE_RE.test(p)) return fail('Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.');
  const user = findUserByPhone(state, p);
  if (!user) return fail('Số điện thoại chưa có tài khoản. Khách hàng có thể đăng ký mới.');
  if (user.status === 'locked') return fail('Tài khoản đang bị khoá. Vui lòng liên hệ CSKH.');
  return ok(user);
}

/** Bước 2: nhập OTP mô phỏng. */
export function verifyLogin(state: DemoState, phone: string, otp: string): Result<UserAccount> {
  const user = requestOtp(state, phone);
  if (!user.ok) return user;
  if (otp.trim() !== DEMO_OTP) return fail('Mã OTP không đúng.');
  return user;
}

/** Khách hàng đăng ký mới bằng SĐT + OTP mô phỏng (FR-TK-01). HTX, Admin, QLNN do Admin cấp. */
export function registerCustomer(
  state: DemoState,
  input: { name: string; phone: string; otp: string },
  at: Date,
): Result<{ state: DemoState; user: UserAccount }> {
  const phone = normalizePhone(input.phone);
  if (!input.name.trim()) return fail('Vui lòng nhập họ tên.');
  if (!PHONE_RE.test(phone)) return fail('Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.');
  if (findUserByPhone(state, phone)) return fail('Số điện thoại đã có tài khoản. Vui lòng đăng nhập.');
  if (input.otp.trim() !== DEMO_OTP) return fail('Mã OTP không đúng.');
  const customerId = generateId('KH');
  const user: UserAccount = {
    id: generateId('U'),
    phone,
    name: input.name.trim(),
    role: 'customer',
    customerId,
    status: 'active',
    createdAt: iso(at),
  };
  return ok({
    state: { ...state, users: [...state.users, user], customers: [...state.customers, { id: customerId, name: user.name, phone }] },
    user,
  });
}

/** Người thao tác tương ứng với tài khoản đăng nhập. */
export function actorOf(user: UserAccount): Actor {
  switch (user.role) {
    case 'customer':
      return { kind: 'customer', id: user.customerId, userId: user.id, name: user.name };
    case 'coop':
      return { kind: 'coop', id: user.coopId, userId: user.id, name: user.name };
    case 'admin':
      return { kind: 'admin', id: user.id, userId: user.id, name: user.name, adminGroup: user.adminGroup };
    case 'regulator':
      return { kind: 'regulator', id: user.id, userId: user.id, name: user.name };
  }
}
