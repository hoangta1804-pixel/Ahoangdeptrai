import { SplitChildOrder } from '../mock/types';

/**
 * Định dạng tiền tệ tiếng Việt theo chuẩn: 1.234.000₫
 */
export function formatMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0₫';
  return `${Math.round(amount).toLocaleString('vi-VN')}₫`;
}

export interface CheckoutSummaryTotals {
  subtotalGoods: number;
  totalShipping: number;
  totalGiftBox: number;
  totalDiscount: number;
  grandTotal: number;
  depositTotal: number;
  payNowTotal: number;
  payOnDeliveryTotal: number;
}

/**
 * Tính toán tổng tiền theo BR-MN-08 và US-06
 */
export function calculateCheckoutTotals(
  orders: SplitChildOrder[],
  totalDiscount = 0
): CheckoutSummaryTotals {
  let subtotalGoods = 0;
  let totalShipping = 0;
  let totalGiftBox = 0;
  let depositTotal = 0;
  let payNowTotal = 0;
  let payOnDeliveryTotal = 0;

  orders.forEach((order) => {
    subtotalGoods += order.subtotal;
    totalShipping += order.shippingFee;
    totalGiftBox += order.giftBoxFee;
    depositTotal += order.depositAmount;

    // Phân bổ payNow & payOnDelivery
    payNowTotal += order.payNowAmount;
    payOnDeliveryTotal += order.payOnDeliveryAmount;
  });

  const grandTotal = Math.max(0, subtotalGoods + totalShipping + totalGiftBox - totalDiscount);

  // Điều chỉnh nếu có giảm giá toàn đơn vào phần trả ngay hoặc trả khi nhận
  if (totalDiscount > 0) {
    if (payNowTotal >= totalDiscount) {
      payNowTotal -= totalDiscount;
    } else {
      const remainingDiscount = totalDiscount - payNowTotal;
      payNowTotal = 0;
      payOnDeliveryTotal = Math.max(0, payOnDeliveryTotal - remainingDiscount);
    }
  }

  return {
    subtotalGoods,
    totalShipping,
    totalGiftBox,
    totalDiscount,
    grandTotal,
    depositTotal,
    payNowTotal,
    payOnDeliveryTotal,
  };
}
