import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge';
import { listOrdersFor } from '../../domain/access';
import { needsReadyContact, unreadCount } from '../../domain/orderContact';
import { formatMoney } from '../../domain/pricing';
import { formatDateKey } from '../../domain/state';
import { ORDER_KIND_LABEL, ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderStatus } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Danh sách đơn của HTX (FR-DH-07). HTX chỉ thấy đơn của HTX mình. */
export function CoopOrdersTab() {
  const { state } = useStore();
  const { coopActor, openModal } = useUi();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const listed = listOrdersFor(state, coopActor);
  if (!listed.ok) return <ErrorState>{listed.error}</ErrorState>;
  const mine = listed.value;
  const shown = filter === 'all' ? mine : mine.filter((o) => o.status === filter);

  return (
    <div className="space-y-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <button onClick={() => setFilter('all')} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-sm ${filter === 'all' ? 'bg-forest-800 text-white' : 'border border-stone-200 bg-white'}`}>
          Tất cả ({mine.length})
        </button>
        {ORDER_STATUSES.filter((s) => mine.some((o) => o.status === s)).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-sm ${filter === s ? 'bg-forest-800 text-white' : 'border border-stone-200 bg-white'}`}>
            {ORDER_STATUS_LABEL[s]} ({mine.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState>Chưa có đơn nào.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {shown.map((o) => (
            <li key={o.id}>
              <button onClick={() => openModal({ type: 'coop_order', orderId: o.id })} className="w-full space-y-1.5 rounded-2xl border border-stone-200 bg-white p-3 text-left hover:bg-stone-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold">{o.id}</span>
                  <span className="flex flex-wrap gap-1">
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </span>
                </div>
                <p className="text-sm text-stone-700">
                  {ORDER_KIND_LABEL[o.kind]}
                  {o.deliveryDate ? ` · giao ${formatDateKey(o.deliveryDate)}` : ''} · {o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                </p>
                <p className="text-sm text-stone-600">Tiền hàng {formatMoney(o.pricing.itemsTotal)}</p>
                {o.status === 'awaiting_confirmation' && o.confirmDeadline && <p className="text-sm font-semibold text-champagne-800">Hạn xác nhận: {new Date(o.confirmDeadline).toLocaleString('vi-VN')}</p>}
                {o.cancelRequest?.status === 'pending' && <p className="text-sm font-semibold text-rose-700">Khách yêu cầu huỷ – cần duyệt</p>}
                {(needsReadyContact(state, o) || unreadCount(state, o, 'coop') > 0) && (
                  <p className="flex flex-wrap gap-1.5">
                    {needsReadyContact(state, o) && <span className="rounded-full bg-champagne-200 px-2.5 py-0.5 text-xs font-bold text-champagne-950">Hàng vào mùa – cần liên hệ khách</span>}
                    {unreadCount(state, o, 'coop') > 0 && <span className="rounded-full bg-forest-900 px-2.5 py-0.5 text-xs font-bold text-champagne-100">{unreadCount(state, o, 'coop')} tin mới từ khách</span>}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
