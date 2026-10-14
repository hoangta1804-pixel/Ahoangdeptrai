import { Building2 } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { regulatorOrderRows } from '../../domain/access';
import { formatMoney } from '../../domain/pricing';
import { ORDER_STATUS_LABEL } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';
import { ExportButtons } from '../../components/ExportButtons';
import { StatsPanel } from '../admin/AdminOverviewTab';

/**
 * Cơ quan QLNN: chỉ đọc, số liệu tổng hợp tính từ dữ liệu trong store (L17, FR-BCTK-01).
 * Không hiện tên, SĐT, địa chỉ, tài khoản của khách; không xem nhật ký; không sửa được gì (mục 5.9).
 */
export function RegulatorScreen() {
  const { state } = useStore();
  const { actor } = useUi();
  const rows = regulatorOrderRows(state, actor);
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1 rounded-3xl bg-sky-950 p-4 text-white">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
          <Building2 size={16} /> Cơ quan quản lý nhà nước – chỉ xem
        </span>
        <h2 className="text-lg font-bold">Số liệu tổng hợp</h2>
        <p className="text-sm text-sky-100">Số liệu tính từ dữ liệu demo hiện có. Không có dữ liệu cá nhân của khách hàng.</p>
      </div>
      <ExportButtons />
      <StatsPanel />
      {rows.ok && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="p-2 text-left font-bold">Đơn hàng (ẩn danh, không có thông tin khách)</caption>
            <thead className="bg-stone-50 text-xs text-stone-500">
              <tr>
                <th className="px-3 py-2">Ngày</th>
                <th className="px-3 py-2">HTX</th>
                <th className="px-3 py-2">Vùng</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2 text-right">Tiền hàng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.value.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{r.createdDate.split('-').reverse().join('/')}</td>
                  <td className="px-3 py-2">{r.coopName}</td>
                  <td className="px-3 py-2">{r.region}</td>
                  <td className="px-3 py-2">{ORDER_STATUS_LABEL[r.status]}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(r.itemsTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
