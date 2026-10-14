/**
 * Tài khoản (FR-TK-03, FR-TK-10..12).
 * - Khách sửa thông tin cá nhân và tài khoản nhận hoàn tiền (TK-03).
 * - Admin – Vận hành cấp và khoá / mở khoá tài khoản (TK-10, TK-12); không tự khoá chính mình; khoá phải ghi lý do.
 * - Quản trị gốc phân quyền: đổi nhóm quyền của tài khoản Admin (TK-11).
 */
import { normalizePhone } from './auth';
import { generateId } from './ids';
import { audit, iso } from './state';
import { fail, ok, type Actor, type AdminSubGroup, type BankAccount, type DemoState, type Result, type UserAccount } from './types';

const PHONE_RE = /^0\d{9}$/;

export function updateCustomerProfile(state: DemoState, actor: Actor, name: string): Result<DemoState> {
  if (actor.kind !== 'customer' || !actor.id) return fail('Chỉ khách hàng sửa được thông tin của mình.');
  if (!name.trim()) return fail('Vui lòng nhập họ tên.');
  return ok({
    ...state,
    customers: state.customers.map((c) => (c.id === actor.id ? { ...c, name: name.trim() } : c)),
    users: state.users.map((u) => (u.customerId === actor.id ? { ...u, name: name.trim() } : u)),
  });
}

export function setRefundAccount(state: DemoState, actor: Actor, account: BankAccount): Result<DemoState> {
  if (actor.kind !== 'customer' || !actor.id) return fail('Chỉ khách hàng khai được tài khoản nhận hoàn của mình.');
  if (!account.bankName.trim()) return fail('Vui lòng nhập tên ngân hàng.');
  const digits = account.accountNumber.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 19) return fail('Số tài khoản phải gồm 6–19 chữ số.');
  if (!account.holder.trim()) return fail('Vui lòng nhập tên chủ tài khoản.');
  const refundAccount: BankAccount = { bankName: account.bankName.trim(), accountNumber: digits, holder: account.holder.trim().toUpperCase() };
  return ok({ ...state, customers: state.customers.map((c) => (c.id === actor.id ? { ...c, refundAccount } : c)) });
}

export interface NewAccountInput {
  name: string;
  phone: string;
  role: 'coop' | 'admin' | 'regulator';
  coopId?: string;
  adminGroup?: AdminSubGroup;
}

/** Admin – Vận hành cấp tài khoản HTX, Admin, Cơ quan QLNN (FR-TK-10). Khách hàng tự đăng ký. */
export function opsCreateAccount(state: DemoState, actor: Actor, input: NewAccountInput, at: Date): Result<{ state: DemoState; user: UserAccount }> {
  if (actor.kind !== 'admin' || actor.adminGroup !== 'operations') return fail('Chỉ Admin – Vận hành được cấp tài khoản.');
  const phone = normalizePhone(input.phone);
  if (!input.name.trim()) return fail('Vui lòng nhập tên tài khoản.');
  if (!PHONE_RE.test(phone)) return fail('Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.');
  if (state.users.some((u) => u.phone === phone)) return fail('Số điện thoại đã có tài khoản.');
  if (input.role === 'coop' && !state.coops.some((c) => c.id === input.coopId)) return fail('Vui lòng chọn HTX.');
  if (input.role === 'admin' && !input.adminGroup) return fail('Vui lòng chọn nhóm quyền.');
  if (input.role === 'admin' && input.adminGroup === 'root') return fail('Tài khoản Quản trị gốc không cấp qua màn này.');
  const user: UserAccount = {
    id: generateId('U'),
    phone,
    name: input.name.trim(),
    role: input.role,
    coopId: input.role === 'coop' ? input.coopId : undefined,
    adminGroup: input.role === 'admin' ? input.adminGroup : undefined,
    status: 'active',
    createdAt: iso(at),
  };
  return ok({ state: audit({ ...state, users: [...state.users, user] }, actor, 'Cấp tài khoản', user.name, at, `${user.role} · ${phone}`), user });
}

/** Khoá / mở khoá tài khoản (FR-TK-12). Tài khoản bị khoá không đăng nhập được, phiên đang mở bị đăng xuất. */
export function opsSetAccountLocked(state: DemoState, actor: Actor, userId: string, locked: boolean, reason: string, at: Date): Result<DemoState> {
  if (actor.kind !== 'admin' || actor.adminGroup !== 'operations') return fail('Chỉ Admin – Vận hành được khoá tài khoản.');
  if (actor.userId === userId) return fail('Không thể tự khoá tài khoản của chính mình.');
  const user = state.users.find((u) => u.id === userId);
  if (!user) return fail('Không tìm thấy tài khoản.');
  if (user.role === 'admin' && user.adminGroup === 'root') return fail('Không khoá tài khoản Quản trị gốc qua màn này.');
  if (locked && !reason.trim()) return fail('Khoá tài khoản phải ghi lý do.');
  const next = { ...state, users: state.users.map((u) => (u.id === userId ? { ...u, status: locked ? ('locked' as const) : ('active' as const) } : u)) };
  return ok(audit(next, actor, locked ? 'Khoá tài khoản' : 'Mở khoá tài khoản', user.name, at, reason.trim() || undefined));
}

/** Quản trị gốc đổi nhóm quyền của tài khoản Admin (FR-TK-11). */
export function rootSetAdminGroup(state: DemoState, actor: Actor, userId: string, group: AdminSubGroup, at: Date): Result<DemoState> {
  if (actor.kind !== 'admin' || actor.adminGroup !== 'root') return fail('Chỉ Quản trị gốc được phân quyền.');
  const user = state.users.find((u) => u.id === userId);
  if (!user || user.role !== 'admin') return fail('Chỉ phân quyền cho tài khoản Admin.');
  if (user.id === actor.userId) return fail('Không tự đổi nhóm quyền của chính mình.');
  if (group === 'root') return fail('Không cấp thêm quyền Quản trị gốc qua màn này.');
  const next = { ...state, users: state.users.map((u) => (u.id === userId ? { ...u, adminGroup: group } : u)) };
  return ok(audit(next, actor, 'Phân quyền', user.name, at, `${user.adminGroup} → ${group}`));
}
