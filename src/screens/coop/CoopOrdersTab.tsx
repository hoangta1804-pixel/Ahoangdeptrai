import { useId, useState } from 'react';
import { Wheat } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { ProductImage } from '../../components/ProductImage';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge';
import { listOrdersFor } from '../../domain/access';
import { fullyHarvested, ordersAwaitingHarvest, quantityIn } from '../../domain/harvest';
import { needsReadyContact, unreadCount } from '../../domain/orderContact';
import { formatMoney } from '../../domain/pricing';
import { formatDateKey } from '../../domain/state';
import { ORDER_KIND_LABEL, ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderStatus } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Danh sách đơn của HTX (FR-DH-07). HTX chỉ thấy đơn của HTX mình. Trên cùng: sản phẩm đặt trước có đơn chờ thu hoạch. */
export function CoopOrdersTab() {
  const { state } = useStore();
  const { coopActor, openModal } = useUi();
  const harvestTitleId = useId();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const listed = listOrdersFor(state, coopActor);
  if (!listed.ok) return <ErrorState>{listed.error}</ErrorState>;
  const mine = listed.value;
  const shown = filter === 'all' ? mine : mine.filter((o) => o.status === filter);
  const toHarvest = state.products
    .filter((p) => p.coopId === coopActor.id && p.kind === 'preorder')
    .map((p) => ({ product: p, waiting: ordersAwaitingHarvest(state, p.id) }))
    .filter((x) => x.waiting.length > 0);

  return (
    <div className="space-y-3">
      {toHarvest.length > 0 && (filter === 'all' || filter === 'awaiting_harvest') && (
        <section aria-labelledby={harvestTitleId} className="space-y-2 rounded-3xl border border-champagne-300 bg-champagne-50/70 p-3">
          <h3 id={harvestTitleId} className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Wheat size={18} aria-hidden="true" className="text-champagne-700" /> Chờ thu hoạch
          </h3>
          <p className="text-xs text-muted">Thu hoạch xong, xác nhận một lần cho cả lô: hàng chia theo thứ tự đặt, đơn đặt sớm nhận trước.</p>
          <ul className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
            {toHarvest.map(({ product, waiting }) => {
              const needed = waiting.reduce((s, o) => s + quantityIn(o, product.id), 0);
              const earliest = waiting.map((o) => o.deliveryDate).filter((d): d is string => !!d).sort()[0];
              return (
                <li key={product.id} className="space-y-2 rounded-2xl border border-champagne-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <ProductImage product={product} className="h-12 w-12 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{product.name}</p>
                      <p className="text-sm text-stone-600">
                        {waiting.length} đơn · cần {needed.toLocaleString('vi-VN')} {product.unit}
                        {earliest ? ` · giao sớm nhất ${formatDateKey(earliest)}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal({ type: 'coop_harvest', productId: product.id })}
                    className="min-h-11 w-full rounded-2xl bg-forest-900 px-4 text-sm font-bold text-champagne-100 hover:bg-forest-800"
                  >
                    Xác nhận thu hoạch {product.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

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
        <ul className="grid gap-2 xl:grid-cols-2 2xl:grid-cols-3">
          {shown.map((o) => (
            <li key={o.id}>
              <button onClick={() => openModal({ type: 'coop_order', orderId: o.id })} className="h-full w-full space-y-1.5 rounded-2xl border border-stone-200 bg-white p-3 text-left hover:bg-stone-50">
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
                {o.status === 'awaiting_harvest' && !o.readyReportedAt && fullyHarvested(o) && (
                  <p className="text-sm font-semibold text-forest-800">Đã thu hoạch – chờ báo sẵn sàng giao</p>
                )}
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
