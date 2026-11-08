import { Voucher } from './types';

export const mockVouchers: Voucher[] = [
  {
    code: 'DACSAN10',
    discountType: 'percent',
    value: 10, // 10%
    minOrderValue: 200000,
    maxDiscount: 100000,
    expiresAt: '2026-12-31',
    isActive: true,
  },
  {
    code: 'GIAM50K',
    discountType: 'fixed',
    value: 50000, // 50.000₫
    minOrderValue: 300000,
    expiresAt: '2026-12-31',
    isActive: true,
  },
  {
    code: 'HETHAN2025',
    discountType: 'fixed',
    value: 30000,
    minOrderValue: 100000,
    expiresAt: '2025-01-01', // Hết hạn
    isActive: false,
  },
  {
    code: 'VIP1TRIEU',
    discountType: 'fixed',
    value: 150000,
    minOrderValue: 1000000, // Đòi hỏi đơn từ 1.000.000₫
    expiresAt: '2026-12-31',
    isActive: true,
  },
];
