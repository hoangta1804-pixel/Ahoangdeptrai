import { useState } from 'react';
import { Clock, FileBadge, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { computeDeposit, formatMoney } from '../../domain/pricing';
import { remainingSlots } from '../../domain/stock';
import type { Product } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';
import { toHoldingOrders } from '../../store/selectors';
import { useAddToCart } from './useAddToCart';

export function ProductDetailSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const { params, orders } = useAppData();
  const { openModal } = useUi();
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);

  const slotsLeft = product.isPreorder ? remainingSlots(product.preorderStock ?? 0, product.id, toHoldingOrders(orders)) : undefined;
  const maxQty = slotsLeft ?? Infinity;
  const itemsTotal = product.price * quantity;
  const deposit = computeDeposit(itemsTotal, 0, params.depositPercent, params.depositRoundingStep);
  const soldOut = slotsLeft === 0;

  return (
    <BottomSheet
      title={
        <>
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-sky-700">
            <ShieldCheck size={14} />
            {product.certType} • Số {product.certNumber}
          </span>
          <span className="mt-0.5 block">{product.name}</span>
          <span className="block text-xs font-normal text-stone-500">
            {product.coopName} ({product.originDistrict})
          </span>
        </>
      }
      onClose={onClose}
      footer={
        <button
          disabled={soldOut}
          onClick={() => {
            addToCart(product, Math.min(quantity, maxQty));
            onClose();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-800 disabled:bg-stone-300"
        >
          <ShoppingBag size={16} />
          {soldOut ? 'Hết suất đặt trước' : `Thêm vào giỏ (${formatMoney(itemsTotal)})`}
        </button>
      }
    >
      <div className="relative h-44 overflow-hidden rounded-2xl border border-stone-200 sm:h-56">
        <ProductImage product={product} className="h-full w-full" />
        <button
          onClick={() => openModal({ type: 'trace_lot', product })}
          className="absolute right-2 bottom-2 flex min-h-9 items-center gap-1 rounded-lg bg-black/75 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/90"
        >
          <FileBadge size={14} />
          Xem nguồn gốc
        </button>
      </div>

      <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>

      {product.isPreorder && (
        <>
          <PreorderProgress product={product} />
          <div className="space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-900">
            <span className="flex items-center gap-1 font-bold">
              <Clock size={14} />
              Thanh toán đặt trước 2 bước
            </span>
            <p>
              <strong>Bước 1 – Cọc {params.depositPercent}%:</strong> trả online khi đặt ({formatMoney(deposit)}).
            </p>
            <p className="text-stone-700">
              <strong>Bước 2 – Phần còn lại:</strong> {formatMoney(itemsTotal - deposit)} tiền hàng + phí giao, trả online khi hàng sẵn sàng hoặc khi nhận hàng.
            </p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-sm font-semibold text-stone-700">
          Số lượng ({product.unit}){slotsLeft !== undefined && <span className="block text-xs font-normal text-amber-800">Còn {slotsLeft} suất</span>}
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Giảm số lượng"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-stone-800 shadow-xs"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-bold tabular-nums text-stone-900">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label="Tăng số lượng"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-stone-800 shadow-xs disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
