import { Product, Variant } from '../mock/types';

/**
 * Chọn quy cách mặc định (BR-MN-01, US-11):
 * - Quy cách đầu tiên còn hàng theo thứ tự Admin sắp xếp.
 * - Nếu không có quy cách nào còn hàng thì là quy cách đầu tiên mở đặt trước.
 * - Nếu không có quy cách nào đặt trước thì lấy quy cách đầu tiên.
 */
export function getDefaultVariant(product: Product): Variant | undefined {
  if (!product.variants || product.variants.length === 0) return undefined;

  const sorted = [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder);

  // 1. Quy cách đầu tiên còn hàng
  const inStock = sorted.find((v) => v.status === 'in_stock' && v.stock > 0);
  if (inStock) return inStock;

  // 2. Quy cách đầu tiên mở đặt trước
  const preorder = sorted.find(
    (v) => v.status === 'preorder' && (v.preorderSlots ?? 0) > 0
  );
  if (preorder) return preorder;

  // 3. Fallback về quy cách đầu tiên
  return sorted[0];
}
