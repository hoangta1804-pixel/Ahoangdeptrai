import { useCallback } from 'react';
import { useUi } from '../../app/UiContext';
import type { Product } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';

/** Thêm vào giỏ. Thêm vào giỏ không giữ hàng (mục 5.6); số lượng được kiểm tra lại khi đặt hàng. */
export function useAddToCart() {
  const { setCart } = useAppData();
  const { showToast } = useUi();
  return useCallback(
    (product: Product, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item));
        }
        return [...prev, { product, quantity: qty }];
      });
      showToast(`Đã thêm ${qty} ${product.unit} ${product.name} vào giỏ hàng`);
    },
    [setCart, showToast],
  );
}
