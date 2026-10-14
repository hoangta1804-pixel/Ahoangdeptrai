import { Wheat } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { deliveryWindow, isOrderableIn } from '../../domain/cart';
import { computeDeposit, formatMoney } from '../../domain/pricing';
import { remainingFor } from '../../domain/state';
import { useStore } from '../../store/AppDataContext';

/** Tab Vụ mùa: danh sách hàng đặt trước (chuyển từ bản index.html cũ). */
export function SeasonTab() {
  const { state, now } = useStore();
  const { openModal } = useUi();
  const params = state.params;
  const preorders = state.products.filter((p) => p.kind === 'preorder' && p.status === 'active');

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1 rounded-3xl bg-gradient-to-r from-emerald-950 to-emerald-800 p-4 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Wheat size={20} className="text-amber-300" />
          <h2 className="text-base font-bold">Nông sản theo mùa – Đặt trước</h2>
        </div>
        <p className="text-sm leading-relaxed text-emerald-100">
          Giữ suất trước mùa thu hoạch. Cọc {params.depositPercent}% khi đặt; phần còn lại trả khi hàng sẵn sàng hoặc khi nhận hàng. Đơn đặt trước không có giao hoả tốc.
        </p>
      </div>

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
              <div key={p.id} className="space-y-3 rounded-3xl border border-stone-200 bg-white p-3.5 shadow-xs">
                <div className="flex gap-3">
                  <ProductImage product={p} className="h-20 w-20 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900">{p.region}</span>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold text-stone-900">{p.name}</h3>
                    <p className="truncate text-xs text-stone-500">{coop?.name}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-extrabold tabular-nums text-emerald-900">
                        {formatMoney(p.price)}/{p.unit}
                      </span>{' '}
                      <span className="text-xs text-amber-800">
                        · cọc từ {formatMoney(computeDeposit(p.price, 0, params.depositPercent, params.depositRoundingStep))}
                      </span>
                    </p>
                  </div>
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
                    className="min-h-11 rounded-2xl bg-emerald-900 text-sm font-bold text-white hover:bg-emerald-800 disabled:bg-stone-300 disabled:text-stone-600"
                  >
                    {blocked ?? 'Đặt trước'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
