import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { ProductImage } from '../../components/ProductImage';
import { formatMoney } from '../../domain/pricing';
import { findProduct, formatDateKey, remainingFor } from '../../domain/state';
import type { CartLine, OrderKind } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';
import { useCartActions } from './useCartActions';

/** Giỏ hàng dạng bottom sheet, chia hai nhóm Mua sẵn / Đặt trước (MHTT-01). */
export function CartSheet({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const { openModal } = useUi();
  const { cart, update, remove } = useCartActions();

  const withProduct = cart.map((l) => ({ line: l, product: findProduct(state, l.productId) })).filter((x) => x.product);
  const groups: { kind: OrderKind; title: string; items: typeof withProduct }[] = [
    { kind: 'ready', title: 'Mua sẵn', items: withProduct.filter((x) => x.product!.kind === 'ready') },
    { kind: 'preorder', title: 'Đặt trước', items: withProduct.filter((x) => x.product!.kind === 'preorder') },
  ];
  const subtotal = withProduct.reduce((s, x) => s + x.product!.price * x.line.quantity, 0);

  const row = (line: CartLine) => {
    const product = findProduct(state, line.productId)!;
    const remaining = remainingFor(state, product);
    return (
      <div key={line.productId} className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 p-2.5">
        <ProductImage product={product} className="h-14 w-14 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h5 className="truncate text-sm font-bold text-ink">{product.name}</h5>
          <span className="block text-sm font-bold tabular-nums text-forest-800">
            {formatMoney(product.price)}/{product.unit}
          </span>
          <span className="text-xs text-muted">
            Còn {remaining}
            {line.deliveryDate ? ` · giao ${formatDateKey(line.deliveryDate)}` : ''}
          </span>
        </div>
        <div className="flex items-center rounded-xl border border-stone-200 bg-white">
          <button onClick={() => update(line.productId, { quantity: line.quantity - 1 })} disabled={line.quantity <= 1} aria-label={`Giảm số lượng ${product.name}`} className="flex h-11 w-11 items-center justify-center disabled:opacity-40">
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
          <button onClick={() => update(line.productId, { quantity: line.quantity + 1 })} disabled={line.quantity >= remaining} aria-label={`Tăng số lượng ${product.name}`} className="flex h-11 w-11 items-center justify-center disabled:opacity-40">
            <Plus size={14} />
          </button>
        </div>
        <button onClick={() => remove(line.productId)} aria-label={`Xoá ${product.name} khỏi giỏ`} className="flex h-11 w-11 items-center justify-center text-muted hover:text-rose-700">
          <Trash2 size={16} />
        </button>
      </div>
    );
  };

  return (
    <BottomSheet
      title={`Giỏ hàng (${cart.length})`}
      onClose={onClose}
      footer={
        cart.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Tạm tính tiền hàng</span>
              <span className="font-bold tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            <p className="text-sm text-stone-600">Phí giao, mã ưu đãi và tiền cọc tính ở bước đặt hàng. Thêm vào giỏ chưa giữ hàng.</p>
            <button onClick={() => openModal({ type: 'checkout', source: { type: 'cart' } })} className="min-h-12 w-full rounded-2xl bg-forest-800 text-sm font-bold text-white hover:bg-forest-700">
              Tiến hành đặt hàng
            </button>
          </div>
        )
      }
    >
      {cart.length === 0 ? (
        <div className="space-y-2 py-10 text-center text-sm text-muted">
          <ShoppingBasket size={40} className="mx-auto text-stone-300" />
          <p>Giỏ hàng chưa có sản phẩm nào.</p>
        </div>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.kind} className="space-y-2">
              <h4 className="text-sm font-bold text-stone-600">{g.title}</h4>
              {g.items.map((x) => row(x.line))}
            </section>
          ))
      )}
    </BottomSheet>
  );
}
