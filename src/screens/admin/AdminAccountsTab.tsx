import { ACCOUNT_ROLE_LABEL, ADMIN_GROUP_LABEL } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Danh sách tài khoản (Quản trị gốc). Phân quyền, cấp và khoá tài khoản (FR-TK-10..12) làm ở Giai đoạn 4. */
export function AdminAccountsTab() {
  const { state } = useStore();
  return (
    <div className="space-y-2">
      <p className="text-sm text-stone-600">Chỉ xem. Cấp, khoá tài khoản và phân quyền làm ở Giai đoạn 4.</p>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">SĐT</th>
              <th className="px-3 py-2">Vai trò</th>
              <th className="px-3 py-2">Đơn vị / nhóm quyền</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {state.users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2 font-mono">{u.phone}</td>
                <td className="px-3 py-2">{ACCOUNT_ROLE_LABEL[u.role]}</td>
                <td className="px-3 py-2">{u.coopId ? state.coops.find((c) => c.id === u.coopId)?.name : u.adminGroup ? ADMIN_GROUP_LABEL[u.adminGroup] : '—'}</td>
                <td className="px-3 py-2">{u.status === 'active' ? 'Đang hoạt động' : 'Đang khoá'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
