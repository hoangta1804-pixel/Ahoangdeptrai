import { useState } from 'react';
import { FileBadge, Minus, Plus } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { deliveryWindow, isOrderable } from '../../domain/cart';
import { computeDeposit, formatMoney } from '../../domain/pricing';
import { findProduct, formatDateKey, remainingFor } from '../../domain/state';
import { CATEGORY_LABEL, ORDER_KIND_LABEL } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';
import { useCartActions } from './useCartActions';

export function ProductDetailSheet({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { state, now } = useStore();
  const { openModal } = useUi();
  const { add } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const product = findProduct(state, productId);
  if (!product) return null;

  const params = state.params;
  const coop = state.coops.find((c) => c.id === product.coopId);
  const remaining = remainingFor(state, product);
  const win = product.kind === 'preorder' ? deliveryWindow(product, now(), params) : null;
  const blocked = !isOrderable(product)
    ? 'Sản phẩm hiện không mở bán'
    : remaining <= 0
      ? 'Hết hàng'
      : product.kind === 'preorder' && !win
        ? 'Đã hết thời gian nhận đặt trước'
        : null;
  const qty = Math.min(quantity, Math.max(1, remaining));
  const itemsTotal = product.price * qty;
  const deposit = computeDeposit(itemsTotal, 0, params.depositPercent, params.depositRoundingStep);

  return (
    <BottomSheet
      title={
        <>
          <span className="block">{product.name}</span>
          <span className="block text-sm font-normal text-stone-500">
            {coop?.name} · {product.region} · {CATEGORY_LABEL[product.category]}
          </span>
        </>
      }
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!!blocked}
            onClick={() => add(product.id, qty) && onClose()}
            className="min-h-12 rounded-2xl border border-emerald-900 bg-white text-sm font-bold text-emerald-900 disabled:border-stone-300 disabled:text-stone-500"
          >
            Thêm vào giỏ
          </button>
          <button
            disabled={!!blocked}
            onClick={() =>
              openModal({
                type: 'checkout',
                source: { type: 'buy_now', line: { productId: product.id, quantity: qty, deliveryDate: win?.min, seenPrice: product.price } },
              })
            }
            className="min-h-12 rounded-2xl bg-emerald-900 text-sm font-bold text-white disabled:bg-stone-300 disabled:text-stone-600"
          >
            {blocked ?? (product.kind === 'preorder' ? 'Đặt trước' : 'Mua ngay')}
          </button>
        </div>
      }
    >
      <div className="relative h-44 overflow-hidden rounded-2xl border border-stone-200 sm:h-56">
        <ProductImage product={product} className="h-full w-full" />
        <button
          onClick={() => openModal({ type: 'trace_lot', productId: product.id })}
          className="absolute right-2 bottom-2 flex min-h-10 items-center gap-1 rounded-lg bg-black/75 px-3 text-sm font-semibold text-white hover:bg-black/90"
        >
          <FileBadge size={16} />
          Xem nguồn gốc
        </button>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xl font-extrabold tabular-nums text-stone-900">
          {formatMoney(product.price)}
          <span className="text-sm font-normal text-stone-500">/{product.unit}</span>
        </span>
        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">{ORDER_KIND_LABEL[product.kind]}</span>
      </div>

      <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>

      {product.kind === 'preorder' ? (
        <>
          <PreorderProgress product={product} />
          <div className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p>
              <strong>Cọc {params.depositPercent}%</strong> trả online khi đặt: {formatMoney(deposit)} (chưa gồm phí giao).
            </p>
            <p>Phần còn lại trả online khi HTX báo hàng sẵn sàng, hoặc trả khi nhận hàng nếu đơn đủ điều kiện.</p>
            {win && (
              <p>
                Chọn ngày giao từ {formatDateKey(win.min)} đến {formatDateKey(win.max)} ở bước đặt hàng.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-stone-600">
          Còn <strong>{remaining}</strong> {product.unit} có thể đặt.
        </p>
      )}

      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-sm font-semibold text-stone-700">
          Số lượng ({product.unit})
          <span className="block text-xs font-normal text-stone-500">Tối đa {Math.max(0, remaining)}</span>
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-xs">
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-bold tabular-nums">{qty}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
            disabled={qty >= remaining}
            aria-label="Tăng số lượng"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-xs disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
