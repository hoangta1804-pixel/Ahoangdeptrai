import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { ListBoundary } from '../../components/ListBoundary';
import { useStore } from '../../store/AppDataContext';
import { CoopOrdersTab } from './CoopOrdersTab';
import { CoopProductsTab } from './CoopProductsTab';
import { CoopProfileTab } from './CoopProfileTab';
import { CoopReviewsTab } from './CoopReviewsTab';
import { CoopTicketsTab } from './CoopTicketsTab';
import { CoopWalletTab } from './CoopWalletTab';

type CoopTab = 'orders' | 'products' | 'tickets' | 'reviews' | 'wallet' | 'profile';
const TABS: { key: CoopTab; label: string }[] = [
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'products', label: 'Sản phẩm' },
  { key: 'tickets', label: 'Khiếu nại' },
  { key: 'reviews', label: 'Đánh giá' },
  { key: 'wallet', label: 'Đối soát' },
  { key: 'profile', label: 'Hồ sơ' },
];

export function CoopScreen() {
  const { state } = useStore();
  const { coopId } = useUi();
  const [tab, setTab] = useState<CoopTab>('orders');
  const coop = state.coops.find((c) => c.id === coopId);
  const pendingConfirm = state.orders.filter((o) => o.coopId === coopId && o.status === 'awaiting_confirmation').length;

  return (
    <div className="flex flex-1 flex-col space-y-4 p-4">
      <div className="space-y-2 rounded-3xl bg-forest-900 p-4 text-white shadow-md">
        <span className="text-xs font-bold uppercase tracking-wider text-forest-300">Kênh HTX</span>
        <h2 className="text-lg font-bold">{coop?.name}</h2>
        <p className="text-sm text-forest-100">
          Vùng {coop?.region} · Tài khoản nhận chi trả {coop?.payoutAccountMasked}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-stone-200/70 p-1 text-sm font-medium" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`min-h-11 rounded-xl ${tab === t.key ? 'bg-white font-bold text-ink shadow-xs' : 'text-stone-700'}`}>
            {t.label}
            {t.key === 'orders' && pendingConfirm > 0 && <span className="ml-1 rounded-full bg-champagne-600 px-1.5 text-xs text-white">{pendingConfirm}</span>}
          </button>
        ))}
      </div>

      <ListBoundary key={tab} label="mục này" resetKey={state}>
        {tab === 'orders' && <CoopOrdersTab />}
        {tab === 'products' && <CoopProductsTab />}
        {tab === 'tickets' && <CoopTicketsTab />}
        {tab === 'reviews' && <CoopReviewsTab />}
        {tab === 'wallet' && <CoopWalletTab />}
        {tab === 'profile' && <CoopProfileTab />}
      </ListBoundary>
    </div>
  );
}
