import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { Select } from '../../components/form';
import { useStore } from '../../store/AppDataContext';
import { CoopOrdersTab } from './CoopOrdersTab';
import { CoopProductsTab } from './CoopProductsTab';
import { CoopTicketsTab } from './CoopTicketsTab';
import { CoopWalletTab } from './CoopWalletTab';

type CoopTab = 'orders' | 'products' | 'tickets' | 'wallet';
const TABS: { key: CoopTab; label: string }[] = [
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'products', label: 'Sản phẩm' },
  { key: 'tickets', label: 'Khiếu nại' },
  { key: 'wallet', label: 'Đối soát' },
];

export function CoopScreen() {
  const { state } = useStore();
  const { coopId, setCoopId } = useUi();
  const [tab, setTab] = useState<CoopTab>('orders');
  const coop = state.coops.find((c) => c.id === coopId);
  const pendingConfirm = state.orders.filter((o) => o.coopId === coopId && o.status === 'awaiting_confirmation').length;

  return (
    <div className="flex flex-1 flex-col space-y-4 p-4">
      <div className="space-y-2 rounded-3xl bg-emerald-950 p-4 text-white shadow-md">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Kênh HTX</span>
        <h2 className="text-lg font-bold">{coop?.name}</h2>
        <p className="text-sm text-emerald-100">
          Vùng {coop?.region} · Tài khoản nhận chi trả {coop?.payoutAccountMasked}
        </p>
        <label className="block text-sm text-emerald-100">
          <span className="mb-1 block text-xs">Đang xem với tư cách HTX (demo, Giai đoạn 3 thay bằng đăng nhập)</span>
          <Select value={coopId} onChange={(e) => setCoopId(e.target.value)} className="text-stone-900">
            {state.coops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-stone-200/70 p-1 text-sm font-medium" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`min-h-11 rounded-xl ${tab === t.key ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-700'}`}>
            {t.label}
            {t.key === 'orders' && pendingConfirm > 0 && <span className="ml-1 rounded-full bg-amber-600 px-1.5 text-xs text-white">{pendingConfirm}</span>}
          </button>
        ))}
      </div>

      {tab === 'orders' && <CoopOrdersTab />}
      {tab === 'products' && <CoopProductsTab />}
      {tab === 'tickets' && <CoopTicketsTab />}
      {tab === 'wallet' && <CoopWalletTab />}
    </div>
  );
}
