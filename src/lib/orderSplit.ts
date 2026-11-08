import { OrderItem, SplitChildOrder } from '../mock/types';
import { calculateDeposit } from './deposit';

export const WAREHOUSE_HANOI_SHIPPING_FEE = 25000;
export const PREORDER_SHIPPING_FEE_PER_TRIP = 35000;

export interface SplitResult {
  orders: SplitChildOrder[];
  totalGoodsSubtotal: number;
  totalShippingFee: number;
}

/**
 * Tách đơn hàng theo quy tắc BR-MN-07, TS-E2E-04, US-08:
 * - Tách theo nhà cung cấp và loại (normal / preorder).
 * - Đơn preorder tách thêm theo ngày giao dự kiến.
 * - Hàng có sẵn ở kho Hà Nội (normal) đi chung một chuyến: chỉ tính MỘT phí giao cho toàn bộ các đơn normal.
 * - Mỗi chuyến preorder tính phí riêng.
 */
export function splitOrderItems(
  items: OrderItem[],
  suppliersMap: Record<string, { id: string; name: string }>,
  orderGroupCode: string,
  giftBoxFee = 0,
  defaultPaymentMethod: 'cod' | 'online' = 'cod'
): SplitResult {
  if (items.length === 0) {
    return { orders: [], totalGoodsSubtotal: 0, totalShippingFee: 0 };
  }

  // Group items by key: `${supplierId}_${kind}_${expectedDeliveryDate || 'warehouse'}`
  const groups: Record<
    string,
    {
      supplierId: string;
      kind: 'normal' | 'preorder';
      expectedDeliveryDate: string;
      items: OrderItem[];
    }
  > = {};

  items.forEach((item) => {
    const key =
      item.kind === 'normal'
        ? `${item.productId.split('_')[0] || 'sup'}_normal_warehouse` // Normal warehouse
        : `${item.productId.split('_')[0] || 'sup'}_preorder_${item.expectedDeliveryDate || 'tbd'}`;

    // Lấy thông tin supplier thực tế nếu có
    const supplierId =
      Object.keys(suppliersMap).find((sId) => item.productId.includes(sId.replace('supp_', ''))) ||
      'supp_bac_ha';

    const groupKey =
      item.kind === 'normal'
        ? `${supplierId}_normal`
        : `${supplierId}_preorder_${item.expectedDeliveryDate || '20/06/2026'}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        supplierId,
        kind: item.kind,
        expectedDeliveryDate: item.kind === 'normal' ? 'Giao trong ngày' : item.expectedDeliveryDate || '20/06/2026',
        items: [],
      };
    }
    groups[groupKey].items.push(item);
  });

  const orders: SplitChildOrder[] = [];
  let hasNormalShipment = false;
  let totalGoodsSubtotal = 0;
  let totalShippingFee = 0;

  const groupKeys = Object.keys(groups);

  groupKeys.forEach((key, index) => {
    const g = groups[key];
    const subtotal = g.items.reduce((sum, it) => sum + it.total, 0);
    totalGoodsSubtotal += subtotal;

    let shippingFee = 0;
    if (g.kind === 'normal') {
      if (!hasNormalShipment) {
        shippingFee = WAREHOUSE_HANOI_SHIPPING_FEE;
        hasNormalShipment = true;
      } else {
        shippingFee = 0; // Các đơn normal cùng chuyến kho Hà Nội miễn phí giao phát sinh
      }
    } else {
      // Mỗi chuyến preorder riêng
      shippingFee = PREORDER_SHIPPING_FEE_PER_TRIP;
    }
    totalShippingFee += shippingFee;

    const assignedGiftBox = index === 0 ? giftBoxFee : 0;
    const depositAmount =
      g.kind === 'preorder' ? calculateDeposit(subtotal, assignedGiftBox, 30) : 0;

    const childOrderTotal = subtotal + shippingFee + assignedGiftBox;

    let payNowAmount = 0;
    let payOnDeliveryAmount = 0;

    if (g.kind === 'preorder') {
      payNowAmount = depositAmount;
      payOnDeliveryAmount = Math.max(0, childOrderTotal - depositAmount);
    } else {
      if (defaultPaymentMethod === 'online') {
        payNowAmount = childOrderTotal;
        payOnDeliveryAmount = 0;
      } else {
        payNowAmount = 0;
        payOnDeliveryAmount = childOrderTotal;
      }
    }

    const supplierName = suppliersMap[g.supplierId]?.name || 'Nhà cung cấp đặc sản Lào Cai';
    const childCode = `${orderGroupCode}-${String.fromCharCode(65 + index)}`;

    orders.push({
      id: `ord_${key}_${Date.now()}_${index}`,
      orderCode: childCode,
      supplierId: g.supplierId,
      supplierName,
      kind: g.kind,
      expectedDeliveryDate: g.expectedDeliveryDate,
      items: g.items,
      subtotal,
      discountAmount: 0,
      shippingFee,
      giftBoxFee: assignedGiftBox,
      depositAmount,
      payNowAmount,
      payOnDeliveryAmount,
      paymentMethod: defaultPaymentMethod,
      status: 'pending_payment',
    });
  });

  return {
    orders,
    totalGoodsSubtotal,
    totalShippingFee,
  };
}
