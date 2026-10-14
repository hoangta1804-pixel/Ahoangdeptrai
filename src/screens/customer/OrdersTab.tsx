import { useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge';
import { listOrdersFor } from '../../domain/access';
import { formatMoney } from '../../domain/pricing';
import { ORDER_KIND_LABEL, ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderStatus } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Đơn mua của tôi theo tab trạng thái (FR-DH-01). Đơn mới hiện ngay sau khi đặt (L4). */
export function OrdersTab() {
  const { state } = useStore();
  const { customerActor, openModal } = useUi();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const listed = listOrdersFor(state, customerActor);
  const mine = listed.ok ? listed.value : [];
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, mine.filter((o) => o.status === s).length])) as Record<OrderStatus, number>;
  const shown = filter === 'all' ? mine : mine.filter((o) => o.status === filter);

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-stone-900">Đơn mua của tôi</h2>
        <button onClick={() => openModal({ type: 'complaint' })} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900">
          <MessageSquareWarning size={16} />
          Khiếu nại
        </button>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Lọc đơn theo trạng thái">
        <button role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')} className={`min-h-10 whitespace-nowrap rounded-xl px-3 text-sm font-medium ${filter === 'all' ? 'bg-emerald-900 text-white' : 'border border-stone-200 bg-white text-stone-700'}`}>
          Tất cả ({mine.length})
        </button>
        {ORDER_STATUSES.filter((s) => counts[s] > 0).map((s) => (
          <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)} className={`min-h-10 whitespace-nowrap rounded-xl px-3 text-sm font-medium ${filter === s ? 'bg-emerald-900 text-white' : 'border border-stone-200 bg-white text-stone-700'}`}>
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
            return (
              <li key={o.id}>
                <button onClick={() => openModal({ type: 'order_detail', orderId: o.id })} className="w-full space-y-2 rounded-2xl border border-stone-200 bg-white p-3.5 text-left shadow-xs hover:bg-stone-50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="block font-mono text-sm font-bold text-stone-900">{o.id}</span>
                      <span className="text-xs text-stone-500">
                        {new Date(o.createdAt).toLocaleString('vi-VN')} · {o.coopName} · {ORDER_KIND_LABEL[o.kind]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </div>
                  </div>
                  <p className="text-sm text-stone-700">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Tổng đơn</span>
                    <span className="font-bold tabular-nums">{formatMoney(o.pricing.total)}</span>
                  </div>
                  {tx && <p className="rounded-lg bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900">Chờ thanh toán {formatMoney(tx.amounts[o.id] ?? 0)} – bấm để tiếp tục</p>}
                  {o.cancelRequest?.status === 'pending' && <p className="text-sm text-amber-800">Đã gửi yêu cầu huỷ, chờ HTX duyệt.</p>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
