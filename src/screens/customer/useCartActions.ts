import { useCallback } from 'react';
import { useUi } from '../../app/UiContext';
import { addToCart, removeCartLine, setCartLine } from '../../domain/cart';
import { findProduct } from '../../domain/state';
import type { CartLine } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Thao tác giỏ của khách đang dùng. Thêm vào giỏ không giữ hàng (mục 5.6). */
export function useCartActions() {
  const { run, state } = useStore();
  const { customerActor, showToast } = useUi();
  const customerId = customerActor.id!;

  const add = useCallback(
    (productId: string, qty: number) => {
      const r = run((s, at) => addToCart(s, customerId, productId, qty, at));
      const p = findProduct(state, productId);
      showToast(r.ok ? `Đã thêm ${qty} ${p?.unit ?? ''} ${p?.name ?? ''} vào giỏ.` : r.error);
      return r.ok;
    },
    [run, state, customerId, showToast],
  );

  const update = useCallback(
    (productId: string, patch: Partial<Pick<CartLine, 'quantity' | 'deliveryDate'>>) => {
      const r = run((s) => setCartLine(s, customerId, productId, patch));
      if (!r.ok) showToast(r.error);
    },
    [run, customerId, showToast],
  );

  const remove = useCallback(
    (productId: string) => run((s) => ({ ok: true, value: removeCartLine(s, customerId, [productId]) })),
    [run, customerId],
  );

  return { cart: state.carts[customerId] ?? [], add, update, remove };
}
