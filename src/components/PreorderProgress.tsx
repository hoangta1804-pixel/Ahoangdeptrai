import { reservedSlots } from '../domain/stock';
import { formatDateKey } from '../domain/state';
import type { Product } from '../domain/types';
import { useStore } from '../store/AppDataContext';

/** Thanh "Đã giữ x/y suất", tính từ đơn trong store (mục 5.6), không gõ cứng. */
export function PreorderProgress({ product }: { product: Product }) {
  const { state } = useStore();
  const total = product.preorder?.totalSlots ?? 0;
  if (product.kind !== 'preorder' || total <= 0) return null;
  const reserved = Math.min(total, reservedSlots(product.id, state.orders));
  const percent = Math.round((reserved / total) * 100);
  return (
    <div className="rounded-lg border border-amber-200/60 bg-amber-50 p-2">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 text-xs font-medium text-amber-900">
        <span>
          Đã giữ {reserved}/{total} suất
        </span>
        {product.preorder && (
          <span>
            Giao {formatDateKey(product.preorder.deliveryFrom)} – {formatDateKey(product.preorder.deliveryTo)}
          </span>
        )}
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-amber-200/70"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={reserved}
        aria-label={`Đã giữ ${reserved} trên ${total} suất`}
      >
        <div className="h-full rounded-full bg-amber-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
