import { useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { SectionHeading } from '../../components/Brand';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge';
import { listOrdersFor } from '../../domain/access';
import { unreadCount } from '../../domain/orderContact';
import { formatMoney } from '../../domain/pricing';
import { ORDER_KIND_LABEL, ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderStatus } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Đơn mua của tôi theo tab trạng thái (FR-DH-01). Đơn mới hiện ngay sau khi đặt (L4). */
export function OrdersTab() {
  const { state } = useStore();
  const { customerActor, openModal } = useUi();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const listed = listOrdersFor(state, customerActor);
  if (!listed.ok) return <ErrorState>{listed.error}</ErrorState>;
  const mine = listed.value;
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, mine.filter((o) => o.status === s).length])) as Record<OrderStatus, number>;
  const shown = filter === 'all' ? mine : mine.filter((o) => o.status === filter);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-5 pb-8 md:px-6 md:pt-8">
      <SectionHeading
        eyebrow="Đơn hàng"
        title="Đơn mua của tôi"
        action={
          <button onClick={() => openModal({ type: 'complaint' })} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-champagne-300 bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-champagne-50">
            <MessageSquareWarning size={16} aria-hidden="true" />
            Khiếu nại
          </button>
        }
      />

      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Lọc đơn theo trạng thái">
        <button role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')} className={`min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-medium ${filter === 'all' ? 'bg-forest-900 text-champagne-100 ring-1 ring-champagne-400/60' : 'border border-champagne-300/80 bg-white/80 text-stone-700'}`}>
          Tất cả ({mine.length})
        </button>
        {ORDER_STATUSES.filter((s) => counts[s] > 0).map((s) => (
          <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)} className={`min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-medium ${filter === s ? 'bg-forest-900 text-champagne-100 ring-1 ring-champagne-400/60' : 'border border-champagne-300/80 bg-white/80 text-stone-700'}`}>
            {ORDER_STATUS_LABEL[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState>{mine.length === 0 ? 'Bạn chưa có đơn nào.' : 'Không có đơn ở trạng thái này.'}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => {
            const tx = state.transactions.find((t) => t.status === 'pending' && t.orderIds.includes(o.id));
            const unread = unreadCount(state, o, 'customer');
            return (
              <li key={o.id}>
                <button
                  onClick={() => openModal({ type: 'order_detail', orderId: o.id })}
                  className="relative w-full space-y-2.5 overflow-hidden rounded-3xl border border-champagne-200 bg-white p-4 pl-5 text-left shadow-[0_10px_28px_rgb(31,77,58,0.06)] hover:border-champagne-400"
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-champagne-300 to-champagne-600" />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="block font-mono text-sm font-bold text-ink">{o.id}</span>
                      <span className="text-xs text-muted">
                        {new Date(o.createdAt).toLocaleString('vi-VN')} · {o.coopName} · {ORDER_KIND_LABEL[o.kind]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </div>
                  </div>
                  <p className="font-display text-base font-semibold text-ink">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
                  <div className="flex items-baseline justify-between border-t border-dashed border-champagne-300 pt-2 text-sm">
                    <span className="text-stone-600">Tổng đơn</span>
                    <span className="font-display text-lg font-semibold tabular-nums text-forest-900">{formatMoney(o.pricing.total)}</span>
                  </div>
                  {tx && <p className="rounded-lg bg-champagne-100 px-2 py-1 text-sm font-semibold text-champagne-900">Chờ thanh toán {formatMoney(tx.amounts[o.id] ?? 0)} – bấm để tiếp tục</p>}
                  {o.cancelRequest?.status === 'pending' && <p className="text-sm text-champagne-800">Đã gửi yêu cầu huỷ, chờ HTX duyệt.</p>}
                  {unread > 0 && (
                    <p className="inline-flex rounded-full bg-forest-900 px-3 py-1 text-xs font-bold text-champagne-100">
                      {unread} tin mới từ {o.coopName}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
