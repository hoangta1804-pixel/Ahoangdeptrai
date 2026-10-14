import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { Input, SecondaryButton } from '../../components/form';
import { opsUpdateParam } from '../../domain/adminConfig';
import { PARAM_CATALOG, type ParamKey, type ParamMeta, type Params } from '../../domain/params';
import { formatMoney } from '../../domain/pricing';
import { useStore } from '../../store/AppDataContext';

function formatValue(key: ParamKey, params: Params, unit: string): string {
  const value = params[key];
  if (key === 'expressTiers') {
    const tiers = params.expressTiers;
    return tiers.map((t, i) => `${i === 0 ? 0 : tiers[i - 1].maxKm}–${t.maxKm} km: ${formatMoney(t.fee)}`).join('; ') + `; trên ${tiers[tiers.length - 1].maxKm} km: không có hoả tốc`;
  }
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (unit === 'đ' && typeof value === 'number') return formatMoney(value);
  return `${String(value)}${unit ? ` ${unit}` : ''}`;
}

/**
 * Tham số hệ thống (FR-HT-02). Admin – Vận hành sửa, bắt buộc lý do, lưu lịch sử.
 * Giá trị mới chỉ áp cho đơn tạo sau đó; đơn đã tạo giữ bản chốt (BR-DAT-06). Cột "Tình trạng" cho biết giá trị nào chưa chốt.
 */
export function AdminParamsTab() {
  const { state } = useStore();
  const { adminGroup } = useUi();
  const canEdit = adminGroup === 'operations';
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">Giá trị mới chỉ áp cho đơn tạo sau thời điểm sửa. Cột “Tình trạng” cho biết giá trị nào chưa được nhóm chốt.</p>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-3 py-2">Mã</th>
              <th className="px-3 py-2">Ý nghĩa</th>
              <th className="px-3 py-2">Giá trị</th>
              <th className="px-3 py-2">Tình trạng</th>
              {canEdit && <th className="px-3 py-2">Sửa (kèm lý do)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {PARAM_CATALOG.map((m) => (
              <ParamRow key={m.key} meta={m} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
      </div>
      <section className="space-y-2">
        <h3 className="text-base font-bold">Lịch sử thay đổi</h3>
        {state.paramHistory.length === 0 ? (
          <p className="text-sm text-stone-600">Chưa có thay đổi nào.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {state.paramHistory.map((h, i) => (
              <li key={i} className="rounded-xl bg-white px-3 py-2">
                <strong>{h.code}</strong> · {new Date(h.at).toLocaleString('vi-VN')} · {h.by}: {JSON.stringify(h.oldValue)} → {JSON.stringify(h.newValue)} · Lý do: {h.reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ParamRow({ meta: m, canEdit }: { meta: ParamMeta; canEdit: boolean }) {
  const { state, run } = useStore();
  const { adminActor, showToast } = useUi();
  const current = state.params[m.key];
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const editable = typeof current === 'number' || typeof current === 'boolean' || typeof current === 'string';
  const save = () => {
    let parsed: Params[ParamKey];
    if (typeof current === 'number') parsed = Number(value);
    else if (typeof current === 'boolean') parsed = value === 'true';
    else parsed = value;
    const r = run((s, at) => opsUpdateParam(s, adminActor, m.key, parsed as never, reason, at));
    showToast(r.ok ? `Đã sửa ${m.code}. Áp cho đơn tạo từ bây giờ.` : r.error);
    if (r.ok) {
      setValue('');
      setReason('');
    }
  };
  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-bold text-stone-700">{m.code}</td>
      <td className="px-3 py-2 text-stone-800">{m.label}</td>
      <td className="px-3 py-2 font-semibold tabular-nums text-stone-900">{formatValue(m.key, state.params, m.unit)}</td>
      <td className="px-3 py-2 text-xs text-stone-600">{m.status}</td>
      {canEdit && (
        <td className="px-3 py-2">
          {editable ? (
            <div className="flex min-w-72 gap-1">
              {typeof current === 'boolean' ? (
                <select aria-label={`Giá trị mới ${m.code}`} value={value} onChange={(e) => setValue(e.target.value)} className="min-h-11 rounded-xl border border-stone-300 px-2 text-sm">
                  <option value="">—</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              ) : (
                <Input aria-label={`Giá trị mới ${m.code}`} placeholder="Giá trị mới" value={value} onChange={(e) => setValue(e.target.value)} />
              )}
              <Input aria-label={`Lý do sửa ${m.code}`} placeholder="Lý do" value={reason} onChange={(e) => setReason(e.target.value)} />
              <SecondaryButton disabled={!value} onClick={save}>
                Lưu
              </SecondaryButton>
            </div>
          ) : (
            <span className="text-xs text-stone-500">Sửa bậc phí ở Danh mục dùng chung</span>
          )}
        </td>
      )}
    </tr>
  );
}
