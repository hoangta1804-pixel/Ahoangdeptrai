import { Wheat } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { LandscapeArt } from '../../components/LandscapeArt';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { deliveryWindow, isOrderableIn } from '../../domain/cart';
import { computeDeposit, formatMoney } from '../../domain/pricing';
import { isSamplePrice, remainingFor } from '../../domain/state';
import { useStore } from '../../store/AppDataContext';

/** Tab Vụ mùa: danh sách hàng đặt trước (chuyển từ bản index.html cũ). */
export function SeasonTab() {
  const { state, now } = useStore();
  const { openModal } = useUi();
  const params = state.params;
  const preorders = state.products.filter((p) => p.kind === 'preorder' && p.status === 'active');

  return (
    <div className="space-y-4 p-4">
      <section className="relative overflow-hidden rounded-[28px] bg-forest-900 text-white shadow-sm">
        <LandscapeArt className="absolute inset-0 h-full w-full" />
        <div className="relative space-y-2 px-5 pt-6 pb-24">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-champagne-300">
            <Wheat size={16} aria-hidden /> Đặt trước theo mùa
          </p>
          <h2 className="font-display text-[1.6rem] font-semibold leading-tight text-balance">Giữ suất trước mùa thu hoạch</h2>
          <p className="max-w-md text-sm leading-relaxed text-forest-100">
            Cọc {params.depositPercent}% khi đặt; phần còn lại trả khi hàng sẵn sàng hoặc khi nhận hàng. Đơn đặt trước không có giao hoả tốc.
          </p>
        </div>
      </section>

      {preorders.length === 0 ? (
        <EmptyState>Hiện chưa có sản phẩm nào mở đặt trước.</EmptyState>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {preorders.map((p) => {
            const coop = state.coops.find((c) => c.id === p.coopId);
            const remaining = remainingFor(state, p);
            const win = deliveryWindow(p, now(), params);
            const blocked = !isOrderableIn(state, p) ? 'Chưa mở đặt trước' : remaining <= 0 ? 'Hết suất' : !win ? 'Đã hết thời gian nhận đặt trước' : null;
            return (
              <article key={p.id} className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgb(0,0,0,0.04),0_10px_28px_rgb(31,77,58,0.07)] ring-1 ring-stone-200/60">
                <button
                  type="button"
                  onClick={() => openModal({ type: 'product_detail', productId: p.id })}
                  aria-label={`Xem ${p.name}`}
                  className="block aspect-[16/9] w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
                >
                  <ProductImage product={p} variant="card" className="h-full w-full" />
                </button>
                <div className="space-y-3 p-4">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-champagne-700">{p.region}</span>
                    <h3 className="font-display text-xl font-semibold leading-snug text-ink">{p.name}</h3>
                    <p className="truncate text-sm text-muted">{coop?.name}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-extrabold tabular-nums text-forest-800">
                        {formatMoney(p.price)}/{p.unit}
                      </span>{' '}
                      {isSamplePrice(p) && <span className="text-xs font-semibold text-champagne-800">(giá mẫu) </span>}
                      <span className="text-xs text-champagne-800">
                        · cọc từ {formatMoney(computeDeposit(p.price, 0, params.depositPercent, params.depositRoundingStep))}
                      </span>
                    </p>
                  </div>
                  <PreorderProgress product={p} />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openModal({ type: 'trace_lot', productId: p.id })}
                      className="min-h-11 rounded-2xl border border-stone-200 bg-white text-sm font-bold text-stone-800 hover:bg-stone-50"
                    >
                      Nguồn gốc
                    </button>
                    <button
                      disabled={!!blocked}
                      onClick={() =>
                        win &&
                        openModal({ type: 'checkout', source: { type: 'buy_now', line: { productId: p.id, quantity: 1, deliveryDate: win.min, seenPrice: p.price } } })
                      }
                      className="min-h-11 rounded-2xl bg-forest-800 text-sm font-bold text-white hover:bg-forest-700 disabled:bg-stone-300 disabled:text-stone-600"
                    >
                      {blocked ?? 'Đặt trước'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
