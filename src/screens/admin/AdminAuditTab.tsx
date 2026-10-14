import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { readAuditLogs } from '../../domain/access';
import { useStore } from '../../store/AppDataContext';

/** Nhật ký thao tác của Admin và HTX (mục 5.9): chỉ thêm, không sửa, không xoá. */
export function AdminAuditTab() {
  const { state } = useStore();
  const { adminActor } = useUi();
  const logs = readAuditLogs(state, adminActor);
  if (!logs.ok) return <EmptyState>{logs.error}</EmptyState>;
  if (logs.value.length === 0) return <EmptyState>Chưa có thao tác nào được ghi.</EmptyState>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500">
          <tr>
            <th className="px-3 py-2">Thời điểm</th>
            <th className="px-3 py-2">Người thực hiện</th>
            <th className="px-3 py-2">Thao tác</th>
            <th className="px-3 py-2">Đối tượng</th>
            <th className="px-3 py-2">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {logs.value.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2 whitespace-nowrap">{new Date(l.at).toLocaleString('vi-VN')}</td>
              <td className="px-3 py-2">{l.actor.name}</td>
              <td className="px-3 py-2">{l.action}</td>
              <td className="px-3 py-2 font-mono text-xs">{l.target}</td>
              <td className="px-3 py-2">{l.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
