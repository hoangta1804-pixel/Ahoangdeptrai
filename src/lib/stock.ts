import { Variant } from '../mock/types';

/**
 * Tính toán tồn kho có thể bán (BR-MN-10)
 * Tồn có thể bán = Tồn kho Hà Nội - Phần đang giữ
 */
export function getAvailableStock(variant: Variant, reservedStock = 0): number {
  if (variant.status === 'preorder') {
    return Math.max(0, (variant.preorderSlots ?? 0) - reservedStock);
  }
  if (variant.status === 'out_of_stock') {
    return 0;
  }
  return Math.max(0, variant.stock - reservedStock);
}

export interface CanAddResult {
  allowed: boolean;
  maxCanAdd: number;
  message?: string;
}

/**
 * Kiểm tra số lượng khi thêm vào giỏ (BR-MN-02, US-02)
 * (Số đã có trong giỏ + số thêm) <= Tồn có thể bán (hoặc số suất đặt trước còn nhận)
 */
export function checkCanAddToCart(
  currentQtyInCart: number,
  addQty: number,
  variant: Variant,
  reservedStock = 0
): CanAddResult {
  const available = getAvailableStock(variant, reservedStock);

  if (available <= 0) {
    return {
      allowed: false,
      maxCanAdd: 0,
      message: variant.status === 'preorder' ? 'Đã hết suất đặt trước.' : 'Sản phẩm tạm hết hàng.',
    };
  }

  const maxCanAdd = Math.max(0, available - currentQtyInCart);

  if (addQty <= maxCanAdd) {
    return {
      allowed: true,
      maxCanAdd,
    };
  }

  return {
    allowed: false,
    maxCanAdd,
    message: maxCanAdd > 0 ? `Chỉ còn thêm được ${maxCanAdd} sản phẩm nữa.` : 'Đã đạt số lượng tối đa có thể mua.',
  };
}
