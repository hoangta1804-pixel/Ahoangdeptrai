import { ExportButtons } from '../../components/ExportButtons';
import { formatMoney } from '../../domain/pricing';
import { aggregateStats } from '../../domain/stats';
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Số liệu tổng hợp tính từ store (FR-BCTK-01, L17). Dùng chung cho Admin và Cơ quan QLNN. */
export function StatsPanel() {
  const { state } = useStore();
  const s = aggregateStats(state);
  const tiles: [string, string][] = [
    ['HTX đang hoạt động', String(s.coopsActive)],
    ['Sản phẩm đang bán', String(s.productsActive)],
    ['Tổng số đơn', String(s.ordersTotal)],
    ['Giá trị hàng đã giao', formatMoney(s.deliveredGoodsValue)],
    ['Khiếu nại đang mở', String(s.ticketsOpen)],
    ['Khiếu nại ưu tiên Cao', String(s.ticketsHighPriority)],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-white p-3">
            <p className="text-sm text-stone-600">{label}</p>
            <p className="text-xl font-extrabold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <table className="w-full rounded-2xl border border-stone-200 bg-white text-left text-sm">
          <caption className="p-2 text-left font-bold">Đơn theo trạng thái</caption>
          <tbody className="divide-y divide-stone-100">
            {ORDER_STATUSES.map((st) => (
              <tr key={st}>
                <td className="px-3 py-1.5">{ORDER_STATUS_LABEL[st]}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{s.ordersByStatus[st]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-4">
          <table className="w-full rounded-2xl border border-stone-200 bg-white text-left text-sm">
            <caption className="p-2 text-left font-bold">Theo vùng</caption>
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-3">Vùng</th>
                <th className="px-3 text-right">Số đơn</th>
                <th className="px-3 text-right">Hàng đã giao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {s.byRegion.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-muted">
                    Chưa có đơn.
                  </td>
                </tr>
              ) : (
                s.byRegion.map((r) => (
                  <tr key={r.region}>
                    <td className="px-3 py-1.5">{r.region}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{r.orders}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(r.deliveredGoodsValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <table className="w-full rounded-2xl border border-stone-200 bg-white text-left text-sm">
            <caption className="p-2 text-left font-bold">Theo HTX</caption>
            <tbody className="divide-y divide-stone-100">
              {s.byCoop.map((c) => (
                <tr key={c.coopName}>
                  <td className="px-3 py-1.5">{c.coopName}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{c.orders} đơn</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(c.deliveredGoodsValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminOverviewTab() {
  return (
    <div className="space-y-4">
      <ExportButtons />
      <StatsPanel />
    </div>
  );
}
