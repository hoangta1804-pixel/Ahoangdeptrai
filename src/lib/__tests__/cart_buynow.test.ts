import { describe, it, expect } from 'vitest';
import { useCartStore } from '../../stores/cartStore';
import { useBuyNowStore } from '../../stores/buyNowStore';
import { Product, Variant, CartLine } from '../../mock/types';

describe('Đặc Sản Số - Cart Merge & Buy Now Isolation (Bước 5)', () => {
  const productA: Product = {
    id: 'prod_A',
    slug: 'prod-a',
    name: 'Sản phẩm A',
    region: 'Bắc Hà',
    supplierId: 'supp_bac_ha',
    category: 'tea',
    shortDescription: 'desc',
    status: 'active',
    media: [],
    themeMappings: [],
    variants: [
      {
        id: 'var_A',
        productId: 'prod_A',
        label: 'Gói 500g',
        price: 100000,
        stock: 5, // Tồn có thể bán tối đa là 5
        status: 'in_stock',
        depositPercent: 30,
        sortOrder: 1,
      },
    ],
  };

  const variantA = productA.variants[0];

  it('TS-E2E-01: Gộp giỏ vượt tồn: tài khoản 3 A, giỏ tạm 4 A, tồn 5 -> giỏ là 5 A, báo điều chỉnh', () => {
    const store = useCartStore.getState();
    store.clearCart();

    // Giả sử tài khoản đã có 3 A
    store.addToCart(productA, variantA, 3);
    expect(useCartStore.getState().lines.find((l) => l.variantId === 'var_A')?.quantity).toBe(3);

    // Giỏ tạm có 4 A
    const guestLines: CartLine[] = [
      {
        id: 'guest_line_1',
        productId: 'prod_A',
        variantId: 'var_A',
        quantity: 4,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const variantsMap = { var_A: variantA };
    const mergeResult = store.mergeGuestCart(guestLines, variantsMap);

    // Kiểm tra: số lượng sau gộp phải được kẹp về tồn tối đa (5)
    const lineAfter = useCartStore.getState().lines.find((l) => l.variantId === 'var_A');
    expect(lineAfter?.quantity).toBe(5);
    expect(mergeResult.adjustedCount).toBe(1); // Có 1 món bị điều chỉnh số lượng do vượt tồn
  });

  it('TS-E2E-02: Mua ngay không đụng giỏ: giỏ có X, Y giữ nguyên khi Mua ngay Z', () => {
    useCartStore.getState().clearCart();
    // Giỏ đang có 2 món A
    useCartStore.getState().addToCart(productA, variantA, 2);
    expect(useCartStore.getState().lines.length).toBe(1);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);

    // Bắt đầu phiên Mua ngay món Z
    const productZ: Product = {
      id: 'prod_Z',
      slug: 'prod-z',
      name: 'Sản phẩm Z',
      region: 'Sa Pa',
      supplierId: 'supp_sa_pa',
      category: 'gift',
      shortDescription: 'desc',
      status: 'active',
      media: [],
      themeMappings: [],
      variants: [
        {
          id: 'var_Z',
          productId: 'prod_Z',
          label: 'Hộp 1kg',
          price: 300000,
          stock: 10,
          status: 'in_stock',
          depositPercent: 30,
          sortOrder: 1,
        },
      ],
    };

    useBuyNowStore.getState().startBuyNow(productZ, productZ.variants[0], 1);

    // Kiểm tra: phiên Mua ngay có món Z
    expect(useBuyNowStore.getState().session?.product.id).toBe('prod_Z');
    expect(useBuyNowStore.getState().session?.quantity).toBe(1);

    // Giỏ hàng X, Y vẫn giữ nguyên không đổi! Món Z không tự vào giỏ
    expect(useCartStore.getState().lines.length).toBe(1);
    expect(useCartStore.getState().lines[0].variantId).toBe('var_A');
    expect(useCartStore.getState().lines[0].quantity).toBe(2);

    // Kết thúc phiên Mua ngay
    useBuyNowStore.getState().clearBuyNow();
    expect(useBuyNowStore.getState().session).toBeNull();

    // Giỏ hàng vẫn giữ nguyên
    expect(useCartStore.getState().lines.length).toBe(1);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });
});
