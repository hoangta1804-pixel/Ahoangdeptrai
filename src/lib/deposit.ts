/**
 * Tính tiền cọc đặt trước (BR-MN-09, D14, US-06)
 * - Cọc 30% tính trên (tiền hàng + phí hộp quà).
 * - Làm tròn cọc LÊN tới 1.000₫.
 * - Phần còn lại = Tổng tiền đơn - Tiền cọc.
 */
export function calculateDeposit(
  goodsSubtotal: number,
  giftBoxFee = 0,
  depositPercent = 30
): number {
  if (goodsSubtotal <= 0) return 0;
  const base = goodsSubtotal + giftBoxFee;
  const rawDeposit = (base * depositPercent) / 100;
  return Math.ceil(rawDeposit / 1000) * 1000;
}

export function calculateRemainingPayment(
  totalOrderAmount: number,
  depositAmount: number
): number {
  return Math.max(0, totalOrderAmount - depositAmount);
}
