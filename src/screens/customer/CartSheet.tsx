import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { ProductImage } from '../../components/ProductImage';
import { formatMoney, sumLines } from '../../domain/pricing';
import { remainingSlots } from '../../domain/stock';
import type { CartItem } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';
import { toHoldingOrders } from '../../store/selectors';
import { useUi } from '../../app/UiContext';

/** Giỏ hàng dạng bottom sheet, chia hai nhóm Mua sẵn / Đặt trước (MHTT-01). Chuyển từ bản index.html cũ. */
export function CartSheet({ onClose }: { onClose: () => void }) {
  const { cart, setCart, orders } = useAppData();
  const { openModal, showToast } = useUi();
  const holding = toHoldingOrders(orders);

  const maxFor = (item: CartItem): number | undefined =>
    item.product.isPreorder ? remainingSlots(item.product.preorderStock ?? 0, item.product.id, holding) : undefined;

  const changeQty = (productId: string, delta: number) =>
    setCart((prev) =>
      prev.map((it) => {
        if (it.product.id !== productId) return it;
        const max = maxFor(it);
        const next = Math.max(1, it.quantity + delta);
        if (max !== undefined && next > max) {
          showToast(`Chỉ còn ${max} suất đặt trước cho sản phẩm này.`);
          return { ...it, quantity: Math.max(1, Math.min(it.quantity, max)) };
        }
        return { ...it, quantity: next };
      }),
    );

  const groups: { title: string; items: CartItem[] }[] = [
    { title: 'Mua sẵn', items: cart.filter((i) => !i.product.isPreorder) },
    { title: 'Đặt trước', items: cart.filter((i) => i.product.isPreorder) },
  ];
  const subtotal = sumLines(cart.map((i) => ({ unitPrice: i.product.price, quantity: i.quantity })));

  return (
    <BottomSheet
      title={`Giỏ hàng (${cart.length})`}
      onClose={onClose}
      footer={
        cart.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Tạm tính tiền hàng</span>
              <span className="font-bold tabular-nums text-stone-900">{formatMoney(subtotal)}</span>
            </div>
            <p className="text-xs text-stone-500">Phí giao, mã ưu đãi và tiền cọc được tính ở bước đặt hàng.</p>
            <button
              onClick={() => openModal({ type: 'checkout' })}
              className="w-full rounded-2xl bg-emerald-900 py-3.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Tiến hành đặt hàng
            </button>
          </div>
        )
      }
    >
      {cart.length === 0 ? (
        <div className="space-y-2 py-10 text-center text-sm text-stone-500">
          <ShoppingBasket size={40} className="mx-auto text-stone-300" />
          <p>Giỏ hàng chưa có sản phẩm nào.</p>
        </div>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.title} className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">{g.title}</h4>
              {g.items.map((item) => {
                const max = maxFor(item);
                return (
                  <div key={item.product.id} className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 p-2.5">
                    <ProductImage product={item.product} className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <h5 className="truncate text-sm font-bold text-stone-900">{item.product.name}</h5>
                      <span className="block text-xs font-bold tabular-nums text-emerald-900">
                        {formatMoney(item.product.price)}/{item.product.unit}
                      </span>
                      {max !== undefined && <span className="text-xs text-amber-800">Còn {max} suất</span>}
                    </div>
                    <div className="flex items-center rounded-xl border border-stone-200 bg-white">
                      <button
                        onClick={() => changeQty(item.product.id, -1)}
                        aria-label={`Giảm số lượng ${item.product.name}`}
                        className="flex h-11 w-9 items-center justify-center text-stone-700"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => changeQty(item.product.id, 1)}
                        aria-label={`Tăng số lượng ${item.product.name}`}
                        className="flex h-11 w-9 items-center justify-center text-stone-700"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => setCart((prev) => prev.filter((it) => it.product.id !== item.product.id))}
                      aria-label={`Xoá ${item.product.name} khỏi giỏ`}
                      className="flex h-11 w-11 items-center justify-center text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </section>
          ))
      )}
    </BottomSheet>
  );
}
