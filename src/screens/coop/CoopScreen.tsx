import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { ListBoundary } from '../../components/ListBoundary';
import { useStore } from '../../store/AppDataContext';
import { CoopOrdersTab } from './CoopOrdersTab';
import { CoopProductsTab } from './CoopProductsTab';
import { CoopProfileTab } from './CoopProfileTab';
import { CoopReviewsTab } from './CoopReviewsTab';
import { CoopSalesTab } from './CoopSalesTab';
import { CoopTicketsTab } from './CoopTicketsTab';
import { CoopWalletTab } from './CoopWalletTab';

type CoopTab = 'orders' | 'products' | 'sales' | 'tickets' | 'reviews' | 'wallet' | 'profile';
const TABS: { key: CoopTab; label: string }[] = [
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'products', label: 'Sản phẩm' },
  { key: 'sales', label: 'Bán chạy' },
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
      <div className="lattice relative space-y-1.5 overflow-hidden rounded-3xl bg-forest-950 p-4 pb-6 text-white shadow-md">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-300">Kênh HTX</span>
        <h2 className="font-display text-2xl font-semibold">{coop?.name}</h2>
        <p className="text-sm text-forest-100">
          Vùng {coop?.region} · Tài khoản nhận chi trả {coop?.payoutAccountMasked}
        </p>
        <div aria-hidden="true" className="brocade-dark absolute inset-x-0 bottom-0 h-2" />
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-stone-200/70 p-1 text-sm font-medium min-[360px]:grid-cols-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`relative min-h-11 whitespace-nowrap rounded-xl px-1 ${tab === t.key ? 'bg-white font-bold text-ink shadow-xs' : 'text-stone-700'}`}
          >
            {t.label}
            {/* Số đơn chờ xác nhận: chấm ở góc tab để chữ không bị xuống dòng khi chia 4 cột. */}
            {t.key === 'orders' && pendingConfirm > 0 && (
              <span className="absolute -top-1 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-champagne-600 px-1 text-xs font-bold text-white">
                {pendingConfirm}
                <span className="sr-only"> đơn chờ xác nhận</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <ListBoundary key={tab} label="mục này" resetKey={state}>
        {tab === 'orders' && <CoopOrdersTab />}
        {tab === 'products' && <CoopProductsTab />}
        {tab === 'sales' && <CoopSalesTab />}
        {tab === 'tickets' && <CoopTicketsTab />}
        {tab === 'reviews' && <CoopReviewsTab />}
        {tab === 'wallet' && <CoopWalletTab />}
        {tab === 'profile' && <CoopProfileTab />}
      </ListBoundary>
    </div>
  );
}
