import { Voucher } from '../mock/types';

export interface VoucherApplicationResult {
  valid: boolean;
  message?: string;
  totalDiscount: number;
  allocations: Record<string, number>; // orderId -> discount
}

export function validateAndApplyVoucher(
  voucher: Voucher | null | undefined,
  eligibleGoodsSubtotal: number,
  childOrders: Array<{ id: string; subtotal: number }>
): VoucherApplicationResult {
  if (!voucher) {
    return { valid: false, totalDiscount: 0, allocations: {} };
  }

  if (!voucher.isActive) {
    return {
      valid: false,
      message: 'Mã ưu đãi đã hết hạn hoặc không còn hiệu lực.',
      totalDiscount: 0,
      allocations: {},
    };
  }

  if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < new Date().setHours(0, 0, 0, 0)) {
    return {
      valid: false,
      message: 'Mã ưu đãi đã hết hạn sử dụng.',
      totalDiscount: 0,
      allocations: {},
    };
  }

  if (eligibleGoodsSubtotal < voucher.minOrderValue) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}₫ để dùng mã này.`,
      totalDiscount: 0,
      allocations: {},
    };
  }

  let totalDiscount = 0;
  if (voucher.discountType === 'percent') {
    const rawDiscount = (eligibleGoodsSubtotal * voucher.value) / 100;
    totalDiscount = voucher.maxDiscount ? Math.min(rawDiscount, voucher.maxDiscount) : rawDiscount;
  } else {
    totalDiscount = Math.min(voucher.value, eligibleGoodsSubtotal);
  }

  // Làm tròn tiền giảm tới 1.000₫
  totalDiscount = Math.floor(totalDiscount / 1000) * 1000;

  // Phân bổ tỷ lệ vào từng đơn con theo tiền hàng hợp lệ
  const allocations: Record<string, number> = {};
  let distributed = 0;

  childOrders.forEach((order, index) => {
    if (index === childOrders.length - 1) {
      // Đơn cuối nhận phần chênh lệch làm tròn
      allocations[order.id] = Math.max(0, totalDiscount - distributed);
    } else {
      const share = Math.floor((totalDiscount * (order.subtotal / eligibleGoodsSubtotal)) / 1000) * 1000;
      allocations[order.id] = share;
      distributed += share;
    }
  });

  return {
    valid: true,
    totalDiscount,
    allocations,
  };
}
