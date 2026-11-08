import { describe, it, expect } from 'vitest';
import { getAvailableStock, checkCanAddToCart } from '../stock';
import { getDefaultVariant } from '../variants';
import { calculateDeposit, calculateRemainingPayment } from '../deposit';
import { validateAndApplyVoucher } from '../voucher';
import { splitOrderItems, WAREHOUSE_HANOI_SHIPPING_FEE, PREORDER_SHIPPING_FEE_PER_TRIP } from '../orderSplit';
import { calculateCheckoutTotals, formatMoney } from '../pricing';
import { validateDeliveryAddress } from '../address';
import { Product, Variant, Voucher, OrderItem } from '../../mock/types';

describe('Đặc Sản Số - Business Rules (lib/*)', () => {
  describe('Stock calculation (BR-MN-02, BR-MN-10, US-02)', () => {
    const sampleVariant: Variant = {
      id: 'var_01',
      productId: 'prod_01',
      label: 'Hũ 500g',
      price: 100000,
      stock: 5,
      status: 'in_stock',
      depositPercent: 30,
      sortOrder: 1,
    };

    it('tính tồn kho có thể bán trừ đi số lượng đang giữ', () => {
      expect(getAvailableStock(sampleVariant, 0)).toBe(5);
      expect(getAvailableStock(sampleVariant, 2)).toBe(3);
      expect(getAvailableStock(sampleVariant, 10)).toBe(0);
    });

    it('US-02: giỏ đã có 4, tồn có thể bán là 5, thêm 2 -> không thêm được, báo còn thêm được 1', () => {
      const result = checkCanAddToCart(4, 2, sampleVariant);
      expect(result.allowed).toBe(false);
      expect(result.maxCanAdd).toBe(1);
      expect(result.message).toContain('Chỉ còn thêm được 1');
    });

    it('cho phép thêm nếu trong giới hạn tồn', () => {
      const result = checkCanAddToCart(2, 2, sampleVariant);
      expect(result.allowed).toBe(true);
      expect(result.maxCanAdd).toBe(3);
    });
  });

  describe('Default Variant selection (BR-MN-01, US-11)', () => {
    it('ưu tiên quy cách đầu tiên còn hàng', () => {
      const product: Product = {
        id: 'p1',
        slug: 'p1',
        name: 'Trà Shan Tuyết',
        region: 'Suối Giàng',
        supplierId: 's1',
        category: 'tea',
        shortDescription: 'desc',
        status: 'active',
        media: [],
        themeMappings: [],
        variants: [
          { id: 'v1', productId: 'p1', label: '100g', price: 100, stock: 0, status: 'out_of_stock', depositPercent: 30, sortOrder: 1 },
          { id: 'v2', productId: 'p1', label: '250g', price: 200, stock: 10, status: 'in_stock', depositPercent: 30, sortOrder: 2 },
          { id: 'v3', productId: 'p1', label: '500g', price: 400, stock: 5, status: 'in_stock', depositPercent: 30, sortOrder: 3 },
        ],
      };

      const selected = getDefaultVariant(product);
      expect(selected?.id).toBe('v2');
    });

    it('nếu không có quy cách nào còn hàng, lấy quy cách mở đặt trước', () => {
      const product: Product = {
        id: 'p2',
        slug: 'p2',
        name: 'Mận tươi',
        region: 'Bắc Hà',
        supplierId: 's2',
        category: 'fresh',
        shortDescription: 'desc',
        status: 'active',
        media: [],
        themeMappings: [],
        variants: [
          { id: 'v1', productId: 'p2', label: '1kg', price: 50, stock: 0, status: 'out_of_stock', depositPercent: 30, sortOrder: 1 },
          { id: 'v2', productId: 'p2', label: '2kg', price: 90, stock: 0, status: 'preorder', preorderSlots: 20, depositPercent: 30, sortOrder: 2 },
        ],
      };

      const selected = getDefaultVariant(product);
      expect(selected?.id).toBe('v2');
    });
  });

  describe('Deposit calculation (BR-MN-09, D14, US-06)', () => {
    it('tính cọc 30% và làm tròn LÊN tới 1.000₫', () => {
      // 500.000₫ * 30% = 150.000₫
      expect(calculateDeposit(500000, 0, 30)).toBe(150000);

      // 45.000₫ * 30% = 13.500₫ -> làm tròn lên thành 14.000₫
      expect(calculateDeposit(45000, 0, 30)).toBe(14000);

      // Tính cả phí hộp quà: (100.000 + 25.000) * 30% = 37.500₫ -> làm tròn lên 38.000₫
      expect(calculateDeposit(100000, 25000, 30)).toBe(38000);
    });

    it('tính phần còn lại phải trả', () => {
      expect(calculateRemainingPayment(500000, 150000)).toBe(350000);
    });
  });

  describe('Voucher rules (BR-MN-12)', () => {
    const mockVoucher: Voucher = {
      code: 'DACSAN10',
      discountType: 'percent',
      value: 10, // 10%
      minOrderValue: 200000,
      maxDiscount: 50000,
      expiresAt: '2026-12-31',
      isActive: true,
    };

    it('chặn mã khi chưa đạt giá trị tối thiểu', () => {
      const res = validateAndApplyVoucher(mockVoucher, 150000, [{ id: 'o1', subtotal: 150000 }]);
      expect(res.valid).toBe(false);
      expect(res.message).toContain('tối thiểu');
    });

    it('phân bổ giảm giá theo tỷ lệ tiền hàng giữa các đơn', () => {
      const res = validateAndApplyVoucher(mockVoucher, 400000, [
        { id: 'o1', subtotal: 100000 },
        { id: 'o2', subtotal: 300000 },
      ]);
      expect(res.valid).toBe(true);
      expect(res.totalDiscount).toBe(40000); // 10% của 400k = 40k
      expect(res.allocations['o1']).toBe(10000);
      expect(res.allocations['o2']).toBe(30000);
    });
  });

  describe('Order Splitting & Shipping (BR-MN-07, TS-E2E-04, US-08)', () => {
    const suppliers = {
      supp_a: { id: 'supp_a', name: 'Nhà cung cấp A' },
      supp_b: { id: 'supp_b', name: 'Nhà cung cấp B' },
    };

    it('US-08(1): hàng có sẵn của NCC A và B -> 1 lần đặt, 2 đơn, 1 phí giao kho Hà Nội duy nhất', () => {
      const items: OrderItem[] = [
        {
          productId: 'supp_a_prod1',
          variantId: 'v1',
          productName: 'Món A',
          variantLabel: 'Gói 500g',
          unitPrice: 100000,
          quantity: 1,
          total: 100000,
          kind: 'normal',
        },
        {
          productId: 'supp_b_prod2',
          variantId: 'v2',
          productName: 'Món B',
          variantLabel: 'Gói 500g',
          unitPrice: 150000,
          quantity: 1,
          total: 150000,
          kind: 'normal',
        },
      ];

      const split = splitOrderItems(items, suppliers, 'DSS-TEST');
      expect(split.orders.length).toBe(2);
      expect(split.totalShippingFee).toBe(WAREHOUSE_HANOI_SHIPPING_FEE); // 25.000₫ duy nhất
    });

    it('TS-E2E-04: giỏ gồm (A thường), (A đặt trước), (B thường) -> tách 3 đơn, 1 phí kho Hà Nội + 1 phí chuyến đặt trước', () => {
      const items: OrderItem[] = [
        {
          productId: 'supp_a_prod1',
          variantId: 'v1',
          productName: 'Món A Thường',
          variantLabel: 'Gói 500g',
          unitPrice: 100000,
          quantity: 1,
          total: 100000,
          kind: 'normal',
        },
        {
          productId: 'supp_a_prod2',
          variantId: 'v2',
          productName: 'Món A Đặt trước',
          variantLabel: 'Khay 1kg',
          unitPrice: 200000,
          quantity: 1,
          total: 200000,
          kind: 'preorder',
          expectedDeliveryDate: '20/06/2026',
        },
        {
          productId: 'supp_b_prod3',
          variantId: 'v3',
          productName: 'Món B Thường',
          variantLabel: 'Chai 500ml',
          unitPrice: 120000,
          quantity: 1,
          total: 120000,
          kind: 'normal',
        },
      ];

      const split = splitOrderItems(items, suppliers, 'DSS-TEST');
      expect(split.orders.length).toBe(3);
      // 1 phí kho Hà Nội (25k) + 1 phí preorder (35k) = 60k
      expect(split.totalShippingFee).toBe(WAREHOUSE_HANOI_SHIPPING_FEE + PREORDER_SHIPPING_FEE_PER_TRIP);
    });
  });

  describe('Pricing calculation (US-06, BR-MN-08)', () => {
    it('US-06: Đơn A (Mua thường, COD, 200k + ship 25k) và Đơn B (Đặt trước 500k, ship 35k) -> Nút ghi Trả ngay 150.000₫, Trả khi nhận = 610.000₫', () => {
      const orderA: any = {
        id: 'ord_A',
        subtotal: 200000,
        shippingFee: 25000,
        giftBoxFee: 0,
        depositAmount: 0,
        payNowAmount: 0,
        payOnDeliveryAmount: 225000,
      };

      const orderB: any = {
        id: 'ord_B',
        subtotal: 500000,
        shippingFee: 35000,
        giftBoxFee: 0,
        depositAmount: 150000, // 30% của 500.000₫
        payNowAmount: 150000,
        payOnDeliveryAmount: 385000, // 500.000 + 35.000 - 150.000
      };

      const totals = calculateCheckoutTotals([orderA, orderB], 0);

      // Trả ngay = cọc của Đơn B = 150.000₫
      expect(totals.payNowTotal).toBe(150000);
      // Trả khi nhận = Đơn A (225.000) + Phần còn lại Đơn B (385.000) = 610.000₫
      expect(totals.payOnDeliveryTotal).toBe(610000);
      expect(formatMoney(totals.payNowTotal)).toBe('150.000₫');
    });
  });

  describe('Address Hanoi-only rule (BR-MN-06)', () => {
    it('chấp nhận địa chỉ hợp lệ tại Hà Nội', () => {
      const res = validateDeliveryAddress('Hà Nội', 'Quận Ba Đình', 'Phường Điện Biên');
      expect(res.isValidHanoi).toBe(true);
    });

    it('từ chối địa chỉ ngoài Hà Nội và báo tin nhắn chuẩn SRS', () => {
      const res = validateDeliveryAddress('Bắc Ninh', 'Thành phố Bắc Ninh', 'Phường Tiền An');
      expect(res.isValidHanoi).toBe(false);
      expect(res.message).toContain('Hiện chúng tôi chỉ giao trong Hà Nội');
    });
  });
});
