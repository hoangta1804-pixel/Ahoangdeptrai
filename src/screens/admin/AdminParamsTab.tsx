import { PARAM_CATALOG, type Params } from '../../domain/params';
import { formatMoney } from '../../domain/pricing';
import { useStore } from '../../store/AppDataContext';

function formatValue(key: keyof Params, params: Params, unit: string): string {
  const value = params[key];
  if (key === 'expressTiers') {
    const tiers = params.expressTiers;
    return (
      tiers.map((t, i) => `${i === 0 ? 0 : tiers[i - 1].maxKm}–${t.maxKm} km: ${formatMoney(t.fee)}`).join('; ') +
      `; trên ${tiers[tiers.length - 1].maxKm} km: không có hoả tốc`
    );
  }
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (unit === 'đ' && typeof value === 'number') return formatMoney(value);
  return `${String(value)}${unit ? ` ${unit}` : ''}`;
}

/** Tham số hệ thống (FR-HT-02), đọc từ store. Giai đoạn 4 thêm sửa giá trị kèm lý do và xem lịch sử. */
export function AdminParamsTab() {
  const { params } = useStore().state;
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        Giá trị mới chỉ áp cho đơn tạo sau thời điểm sửa. Cột “Tình trạng” cho biết giá trị nào chưa được nhóm chốt.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Ý nghĩa</th>
              <th className="px-3 py-2">Giá trị</th>
              <th className="px-3 py-2">Tình trạng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {PARAM_CATALOG.map((m) => (
              <tr key={m.key}>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-bold text-stone-700">{m.code}</td>
                <td className="px-3 py-2 text-stone-800">{m.label}</td>
                <td className="px-3 py-2 font-semibold tabular-nums text-stone-900">{formatValue(m.key, params, m.unit)}</td>
                <td className="px-3 py-2 text-xs text-stone-600">{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
