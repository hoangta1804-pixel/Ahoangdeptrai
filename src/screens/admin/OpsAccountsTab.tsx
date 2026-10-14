import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { DangerButton, Field, Input, PrimaryButton, SecondaryButton, Select } from '../../components/form';
import { opsCreateAccount, opsSetAccountLocked, type NewAccountInput } from '../../domain/account';
import { ACCOUNT_ROLE_LABEL, ADMIN_GROUP_LABEL, type AdminSubGroup, type UserAccount } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Admin – Vận hành cấp tài khoản HTX / Admin / QLNN và khoá / mở khoá tài khoản (FR-TK-10, 12). */
export function OpsAccountsTab() {
  const { state, run } = useStore();
  const { adminActor, showToast } = useUi();
  const [form, setForm] = useState<NewAccountInput>({ name: '', phone: '', role: 'coop', coopId: state.coops[0]?.id, adminGroup: 'operations' });
  const set = (patch: Partial<NewAccountInput>) => setForm((f) => ({ ...f, ...patch }));
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3">
        <h3 className="text-base font-bold">Cấp tài khoản</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Tên">
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="SĐT">
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="0900 000 000" />
          </Field>
          <Field label="Vai trò">
            <Select value={form.role} onChange={(e) => set({ role: e.target.value as NewAccountInput['role'] })}>
              <option value="coop">HTX</option>
              <option value="admin">Admin</option>
              <option value="regulator">Cơ quan QLNN</option>
            </Select>
          </Field>
          {form.role === 'coop' && (
            <Field label="HTX">
              <Select value={form.coopId} onChange={(e) => set({ coopId: e.target.value })}>
                {state.coops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {form.role === 'admin' && (
            <Field label="Nhóm quyền">
              <Select value={form.adminGroup} onChange={(e) => set({ adminGroup: e.target.value as AdminSubGroup })}>
                {(['operations', 'quality', 'cskh', 'finance'] as AdminSubGroup[]).map((g) => (
                  <option key={g} value={g}>
                    {ADMIN_GROUP_LABEL[g]}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        <PrimaryButton
          onClick={() => {
            const r = run(
              (s, at) => opsCreateAccount(s, adminActor, form, at),
              (v) => v.state,
            );
            showToast(r.ok ? 'Đã cấp tài khoản. Người dùng đăng nhập bằng SĐT + OTP mô phỏng.' : r.error);
            if (r.ok) set({ name: '', phone: '' });
          }}
        >
          Cấp tài khoản
        </PrimaryButton>
      </section>
      <AccountTable users={state.users} />
    </div>
  );
}

function AccountTable({ users }: { users: UserAccount[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-stone-50 text-xs text-muted">
          <tr>
            <th className="px-3 py-2">Tên</th>
            <th className="px-3 py-2">SĐT</th>
            <th className="px-3 py-2">Vai trò</th>
            <th className="px-3 py-2">Trạng thái</th>
            <th className="px-3 py-2">Khoá / mở khoá</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-stone-600">
                Chưa có tài khoản nào.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <LockRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LockRow({ user: u }: { user: UserAccount }) {
  const { run } = useStore();
  const { adminActor, showToast } = useUi();
  const [reason, setReason] = useState('');
  const act = (locked: boolean) => {
    const r = run((s, at) => opsSetAccountLocked(s, adminActor, u.id, locked, reason, at));
    showToast(r.ok ? (locked ? 'Đã khoá tài khoản. Phiên đang mở sẽ bị đăng xuất.' : 'Đã mở khoá tài khoản.') : r.error);
    if (r.ok) setReason('');
  };
  return (
    <tr>
      <td className="px-3 py-2">{u.name}</td>
      <td className="px-3 py-2 font-mono">{u.phone}</td>
      <td className="px-3 py-2">{u.role === 'admin' && u.adminGroup ? `Admin – ${ADMIN_GROUP_LABEL[u.adminGroup]}` : ACCOUNT_ROLE_LABEL[u.role]}</td>
      <td className="px-3 py-2">{u.status === 'active' ? 'Đang hoạt động' : 'Đang khoá'}</td>
      <td className="px-3 py-2">
        {u.status === 'active' ? (
          <div className="flex gap-1">
            <Input aria-label={`Lý do khoá ${u.name}`} placeholder="Lý do khoá" value={reason} onChange={(e) => setReason(e.target.value)} />
            <DangerButton onClick={() => act(true)}>Khoá</DangerButton>
          </div>
        ) : (
          <SecondaryButton onClick={() => act(false)}>Mở khoá</SecondaryButton>
        )}
      </td>
    </tr>
  );
}
