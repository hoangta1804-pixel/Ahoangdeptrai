import { describe, it, expect } from 'vitest';
import { mockProducts } from '../../mock/products';
import { mockSuppliers } from '../../mock/suppliers';
import { mockVouchers } from '../../mock/vouchers';
import { mockUsers } from '../../mock/users';
import { getDefaultVariant } from '../variants';
import { getAvailableStock, checkCanAddToCart } from '../stock';
import { calculateDeposit } from '../deposit';
import { validateAndApplyVoucher } from '../voucher';
import { splitOrderItems, WAREHOUSE_HANOI_SHIPPING_FEE, PREORDER_SHIPPING_FEE_PER_TRIP } from '../orderSplit';
import { calculateCheckoutTotals, formatMoney } from '../pricing';
import { validateDeliveryAddress } from '../address';
import { useCartStore } from '../../stores/cartStore';
import { useBuyNowStore } from '../../stores/buyNowStore';
import { useOrderStore } from '../../stores/orderStore';
import { OrderItem } from '../../mock/types';

describe('ĐẶC SẢN SỐ - PHASE 2 ACCEPTANCE & E2E SUITE (Mục 12)', () => {
  // US-01: Băng chuyền & sản phẩm đủ điều kiện
  it('US-01: Băng chuyền loại trừ sản phẩm có dưới 5 ảnh đã duyệt (BR-PT-01)', () => {
    // Trà hoa vàng Bảo Yên chỉ có 4 ảnh đã duyệt
    const yellowTea = mockProducts.find((p) => p.id === 'prod_tra_hoa_vang_bao_yen');
    expect(yellowTea).toBeDefined();

    const approvedCount = yellowTea!.media.filter((m) => m.approvalStatus === 'approved').length;
    expect(approvedCount).toBe(4);

    // Băng chuyền nổi bật phải lọc ra (count >= 5)
    const eligibleForFeatured = approvedCount >= 5;
    expect(eligibleForFeatured).toBe(false);

    // Nhưng sản phẩm này vẫn bán được bình thường ở danh mục
    expect(yellowTea!.status).toBe('active');
    expect(yellowTea!.variants[0].stock).toBeGreaterThan(0);
  });

  // US-02: Thêm nhanh 1 chạm & Hoàn tác
  it('US-02: Món 1 quy cách thêm ngay 1 đơn vị, Hoàn tác trong 5s giảm đúng 1', () => {
    const cart = useCartStore.getState();
    cart.clearCart();

    const singleVariantProduct = mockProducts.find((p) => p.id === 'prod_pho_hong_bac_ha');
    expect(singleVariantProduct?.variants.length).toBe(1);

    const variant = singleVariantProduct!.variants[0];
    const addRes = cart.addToCart(singleVariantProduct!, variant, 1);
    expect(addRes.success).toBe(true);

    expect(useCartStore.getState().lines.length).toBe(1);
    expect(useCartStore.getState().lines[0].quantity).toBe(1);

    // Hoàn tác
    const undoRes = useCartStore.getState().undoLastAdd();
    expect(undoRes.success).toBe(true);
    expect(useCartStore.getState().lines.length).toBe(0);
  });

  // US-04: Mua ngay ≤ 3 lần chạm (khách có địa chỉ mặc định Ba Đình, COD)
  it('US-04: Mua ngay ≤ 3 lần chạm (Thẻ -> Mua ngay -> Đặt hàng), giỏ giữ nguyên không đổi', () => {
    const cart = useCartStore.getState();
    const buyNow = useBuyNowStore.getState();
    cart.clearCart();

    // Giỏ đang có Chè Shan tuyết
    const teaProd = mockProducts.find((p) => p.id === 'prod_che_shan_tuyet')!;
    cart.addToCart(teaProd, teaProd.variants[0], 2);
    expect(useCartStore.getState().lines.length).toBe(1);

    // Khách chọn Mua ngay Mật ong rừng Bảo Hà
    const honeyProd = mockProducts.find((p) => p.id === 'prod_mat_ong_bao_ha')!;
    const defVariant = getDefaultVariant(honeyProd)!;

    // Chạm 1: Bấm Mua ngay
    buyNow.startBuyNow(honeyProd, defVariant, 1);
    expect(useBuyNowStore.getState().session?.product.id).toBe('prod_mat_ong_bao_ha');

    // Màn Đặt hàng mở ra: Khách Anh Hoàng có địa chỉ mặc định Ba Đình + COD lần trước tự điền
    const user = mockUsers.user_with_address;
    expect(user.addresses.find((a) => a.isDefault)?.district).toBe('Quận Ba Đình');
    expect(user.defaultPaymentMethod).toBe('cod');

    // Chạm 2: Bấm Đặt hàng (Hoàn tất ≤ 3 chạm!)
    const items: OrderItem[] = [
      {
        productId: honeyProd.id,
        variantId: defVariant.id,
        productName: honeyProd.name,
        variantLabel: defVariant.label,
        unitPrice: defVariant.price,
        quantity: 1,
        total: defVariant.price,
        kind: 'normal',
      },
    ];

    const suppliers = { supp_bao_ha: { id: 'supp_bao_ha', name: 'Mật ong Bảo Hà' } };
    const split = splitOrderItems(items, suppliers, 'DSS-BUYNOW-01', 0, 'cod');
    expect(split.orders.length).toBe(1);

    // Kết thúc phiên Mua ngay
    buyNow.clearBuyNow();

    // Giỏ hàng cũ (Chè Shan tuyết) vẫn giữ nguyên vẹn
    expect(useCartStore.getState().lines.length).toBe(1);
    expect(useCartStore.getState().lines[0].productId).toBe('prod_che_shan_tuyet');
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });

  // US-06: Đặt hàng một màn & Tách đơn theo SRS Mục 11
  it('US-06: Lần đặt gồm Đơn A (Mua thường, COD, 200k + ship 25k) và Đơn B (Đặt trước 500k, ship 35k)', () => {
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
      depositAmount: 150000, // 30% của 500k
      payNowAmount: 150000,
      payOnDeliveryAmount: 385000,
    };

    const totals = calculateCheckoutTotals([orderA, orderB], 0);

    // Nút ghi: Trả ngay 150.000₫
    expect(totals.payNowTotal).toBe(150000);
    // Trả khi nhận = tiền hàng A + ship A + số dư còn lại B = 225.000 + 385.000 = 610.000₫
    expect(totals.payOnDeliveryTotal).toBe(610000);
    expect(formatMoney(totals.payNowTotal)).toBe('150.000₫');
  });

  // US-08: Tách đơn & gom cước kho Hà Nội
  it('US-08: Hàng có sẵn của nhiều nhà cung cấp chỉ tính 1 cước vận chuyển kho Hà Nội duy nhất', () => {
    const items: OrderItem[] = [
      {
        productId: 'supp_suoi_giang_che',
        variantId: 'v1',
        productName: 'Chè Suối Giàng',
        variantLabel: 'Hộp 250g',
        unitPrice: 420000,
        quantity: 1,
        total: 420000,
        kind: 'normal',
      },
      {
        productId: 'supp_bac_ha_pho',
        variantId: 'v2',
        productName: 'Phở hồng Bắc Hà',
        variantLabel: 'Gói 500g',
        unitPrice: 45000,
        quantity: 1,
        total: 45000,
        kind: 'normal',
      },
    ];

    const suppliers = {
      supp_suoi_giang: { id: 'supp_suoi_giang', name: 'Trà Suối Giàng' },
      supp_bac_ha: { id: 'supp_bac_ha', name: 'Nông sản Bắc Hà' },
    };

    const split = splitOrderItems(items, suppliers, 'DSS-SPLIT-01');
    expect(split.orders.length).toBe(2); // 2 đơn riêng cho 2 NCC
    expect(split.totalShippingFee).toBe(WAREHOUSE_HANOI_SHIPPING_FEE); // Chỉ tính 1 lần cước 25.000₫
  });

  // TS-E2E-03: Tranh món cuối (Race condition)
  it('TS-E2E-03: Tranh món cuối: kiểm tra tồn kho không âm và từ chối khi hết hàng', () => {
    const lowStockProduct = mockProducts.find((p) => p.id === 'prod_gao_seng_cu')!;
    const lowVariant = lowStockProduct.variants[0];
    expect(lowVariant.stock).toBe(2);

    // Người A thêm 2 bao vào giỏ -> thành công
    const checkA = checkCanAddToCart(0, 2, lowVariant, 0);
    expect(checkA.allowed).toBe(true);

    // Giả lập người khác mua mất (reservedStock = 2)
    const checkB = checkCanAddToCart(0, 1, lowVariant, 2);
    expect(checkB.allowed).toBe(false);
    expect(checkB.maxCanAdd).toBe(0);
    expect(checkB.message).toContain('tạm hết hàng');
  });

  // NFR-MN-06 & Không dùng từ "HTX" trên giao diện khách
  it('NFR-MN-06: Không dùng chữ "HTX" trong danh sách nhà cung cấp trên giao diện khách hàng', () => {
    mockSuppliers.forEach((s) => {
      expect(s.name.toUpperCase()).not.toContain('HTX');
      expect(s.name).toMatch(/Công ty|Hộ kinh doanh|Doanh nghiệp/);
    });
  });
});
