import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Variant, Address, Voucher, OrderItem, OrderGroup, SplitChildOrder } from '../../mock/types';
import { useAuth } from '../../stores/authStore';
import { useCart } from '../../stores/cartStore';
import { useBuyNow } from '../../stores/buyNowStore';
import { useOrders } from '../../stores/orderStore';
import { AddressSheet } from './AddressSheet';
import { DeliverySheet } from './DeliverySheet';
import { PaymentSheet, PaymentMethod } from './PaymentSheet';
import { VoucherSheet } from './VoucherSheet';
import { splitOrderItems } from '../../lib/orderSplit';
import { calculateCheckoutTotals, formatMoney } from '../../lib/pricing';
import { validateAndApplyVoucher } from '../../lib/voucher';
import { calculateDeposit } from '../../lib/deposit';
import { checkCanAddToCart } from '../../lib/stock';
import { Button } from '../ui/Button';
import { mockSuppliers } from '../../mock/suppliers';
import { mockVouchers } from '../../mock/vouchers';
import { track } from '../../lib/analytics';
import {
  MapPin,
  Truck,
  CreditCard,
  Tag,
  Gift,
  ChevronRight,
  ShieldCheck,
  Clock,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';

export interface CheckoutOnePageProps {
  isBuyNowMode?: boolean;
  onOrderSuccess: (orderGroup: OrderGroup) => void;
  onBack: () => void;
  products: Product[];
  simulatedRaceCondition?: boolean;
  onClearSimulatedRace?: () => void;
}

export const CheckoutOnePage: React.FC<CheckoutOnePageProps> = ({
  isBuyNowMode = false,
  onOrderSuccess,
  onBack,
  products,
  simulatedRaceCondition = false,
  onClearSimulatedRace,
}) => {
  const { user, persona, addAddress, setDefaultAddress } = useAuth();
  const { lines, clearCart } = useCart();
  const { session, clearBuyNow } = useBuyNow();
  const { createOrderGroup } = useOrders();

  // Dialog sheets state
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  const [isDeliverySheetOpen, setIsDeliverySheetOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isVoucherSheetOpen, setIsVoucherSheetOpen] = useState(false);

  // Form selections
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState('');

  // Tùy chọn gửi tặng
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [hasGiftBox, setHasGiftBox] = useState(false);
  const giftBoxFee = hasGiftBox ? 50000 : 0;

  // Trạng thái kiểm tra & đặt hàng
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Map nhà cung cấp
  const suppliersMap = useMemo(() => {
    const map: Record<string, { id: string; name: string }> = {};
    mockSuppliers.forEach((s) => {
      map[s.id] = { id: s.id, name: s.name };
    });
    return map;
  }, []);

  // Map sản phẩm & quy cách
  const productsMap = useMemo(() => {
    const map: Record<string, { product: Product; variant: Variant }> = {};
    products.forEach((p) => {
      p.variants.forEach((v) => {
        map[v.id] = { product: p, variant: v };
      });
    });
    return map;
  }, [products]);

  // Khởi tạo địa chỉ mặc định hoặc mở sheet nếu chưa có
  useEffect(() => {
    if (user && user.addresses.length > 0) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddress(def);
    } else {
      setSelectedAddress(null);
      // Tự mở bảng thêm địa chỉ nếu khách chưa có địa chỉ
      setIsAddressSheetOpen(true);
    }

    if (user?.defaultPaymentMethod) {
      setPaymentMethod(user.defaultPaymentMethod);
    }

    track('start_checkout', { isBuyNow: isBuyNowMode });
  }, [user]);

  // Chuẩn bị danh sách OrderItem dựa trên Mua ngay hay Giỏ hàng
  const checkoutItems: OrderItem[] = useMemo(() => {
    if (isBuyNowMode && session) {
      const { product, variant, quantity } = session;
      const isPre = variant.status === 'preorder';
      return [
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantLabel: variant.label,
          unitPrice: variant.price,
          quantity,
          total: variant.price * quantity,
          imageUrl: variant.imageUrl || product.media[0]?.url,
          kind: isPre ? 'preorder' : 'normal',
          expectedDeliveryDate: isPre ? variant.expectedDeliveryDate || '20/06/2026' : undefined,
        },
      ];
    }

    return lines
      .map((l) => {
        const info = productsMap[l.variantId];
        if (!info) return null;
        const { product, variant } = info;
        const isPre = variant.status === 'preorder';
        return {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantLabel: variant.label,
          unitPrice: variant.price,
          quantity: l.quantity,
          total: variant.price * l.quantity,
          imageUrl: variant.imageUrl || product.media[0]?.url,
          kind: isPre ? 'preorder' : 'normal',
          expectedDeliveryDate: isPre ? variant.expectedDeliveryDate || '20/06/2026' : undefined,
        } as OrderItem;
      })
      .filter((it): it is OrderItem => it !== null);
  }, [isBuyNowMode, session, lines, productsMap]);

  // Sinh mã lần đặt
  const orderGroupCode = useMemo(() => {
    return `DSS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }, []);

  // TÁCH ĐƠN theo nhà cung cấp và loại hàng (BR-MN-07)
  const splitResult = useMemo(() => {
    const methodParam = paymentMethod === 'cod' ? 'cod' : 'online';
    return splitOrderItems(checkoutItems, suppliersMap, orderGroupCode, giftBoxFee, methodParam);
  }, [checkoutItems, suppliersMap, orderGroupCode, giftBoxFee, paymentMethod]);

  // Áp dụng mã ưu đãi
  const voucherResult = useMemo(() => {
    return validateAndApplyVoucher(appliedVoucher, splitResult.totalGoodsSubtotal, splitResult.orders);
  }, [appliedVoucher, splitResult.totalGoodsSubtotal, splitResult.orders]);

  // Cập nhật phân bổ giảm giá vào từng đơn con
  const finalOrders: SplitChildOrder[] = useMemo(() => {
    return splitResult.orders.map((o) => {
      const allocatedDiscount = voucherResult.allocations[o.id] || 0;
      const netSubtotal = Math.max(0, o.subtotal - allocatedDiscount);
      const childTotal = netSubtotal + o.shippingFee + o.giftBoxFee;

      let payNow = 0;
      let payOnDelivery = 0;

      if (o.kind === 'preorder') {
        payNow = o.depositAmount;
        payOnDelivery = Math.max(0, childTotal - payNow);
      } else {
        if (paymentMethod === 'cod') {
          payNow = 0;
          payOnDelivery = childTotal;
        } else {
          payNow = childTotal;
          payOnDelivery = 0;
        }
      }

      return {
        ...o,
        discountAmount: allocatedDiscount,
        payNowAmount: payNow,
        payOnDeliveryAmount: payOnDelivery,
      };
    });
  }, [splitResult.orders, voucherResult.allocations, paymentMethod]);

  // Tính tổng kết tiền chi tiết
  const totals = useMemo(() => {
    return calculateCheckoutTotals(finalOrders, voucherResult.totalDiscount);
  }, [finalOrders, voucherResult.totalDiscount]);

  const hasPreorder = checkoutItems.some((it) => it.kind === 'preorder');
  const hasNormal = checkoutItems.some((it) => it.kind === 'normal');

  // Xử lý bấm Đặt hàng (Idempotent & Kiểm tra tồn phía máy chủ)
  const handlePlaceOrder = () => {
    if (isSubmittingRef.current) return;
    setCheckoutError(null);

    // 1. Kiểm tra địa chỉ
    if (!selectedAddress) {
      setCheckoutError('Vui lòng chọn hoặc thêm địa chỉ nhận hàng tại Hà Nội.');
      setIsAddressSheetOpen(true);
      return;
    }

    // 2. Kiểm tra nếu có giả lập người khác mua mất món cuối (TS-E2E-03)
    if (simulatedRaceCondition) {
      setCheckoutError(
        'Rất tiếc! Trong lúc bạn thao tác, sản phẩm cuối cùng vừa được khách hàng khác đặt mua mất. Tồn kho đã hết.'
      );
      if (onClearSimulatedRace) onClearSimulatedRace();
      return;
    }

    // 3. Kiểm tra lại tồn kho và giá hiện thời
    for (const item of checkoutItems) {
      const info = productsMap[item.variantId];
      if (!info) {
        setCheckoutError(`Sản phẩm ${item.productName} không còn khả dụng.`);
        return;
      }
      const check = checkCanAddToCart(0, item.quantity, info.variant);
      if (!check.allowed) {
        setCheckoutError(`Không đủ tồn kho cho ${item.productName}: ${check.message}`);
        return;
      }
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // Mô phỏng tạo đơn
    setTimeout(() => {
      const newOrderGroup: OrderGroup = {
        id: `grp_${Date.now()}`,
        orderGroupCode,
        userId: user?.id,
        customerName: selectedAddress.recipientName,
        phone: selectedAddress.phone,
        address: selectedAddress,
        note: orderNote.trim() || undefined,
        giftInfo: isGift
          ? {
              isGift: true,
              recipientName,
              cardMessage,
              hasGiftBox,
              giftBoxFee,
            }
          : undefined,
        orders: finalOrders,
        voucherCode: appliedVoucher?.code,
        subtotalGoods: totals.subtotalGoods,
        discountTotal: totals.totalDiscount,
        shippingTotal: totals.totalShipping,
        giftBoxTotal: totals.totalGiftBox,
        depositTotal: totals.depositTotal,
        payNowTotal: totals.payNowTotal,
        payOnDeliveryTotal: totals.payOnDeliveryTotal,
        paymentExpiresAt: Date.now() + 15 * 60 * 1000, // 15 phút
        paymentStatus: totals.payNowTotal > 0 ? 'pending' : 'paid',
        createdAt: new Date().toISOString(),
      };

      createOrderGroup(newOrderGroup);

      // Nếu là giỏ hàng thì dọn giỏ, nếu là Mua ngay thì dọn session (giỏ giữ nguyên theo TS-E2E-02)
      if (isBuyNowMode) {
        clearBuyNow();
      } else {
        clearCart();
      }

      track('order_completed', {
        orderGroupCode,
        totalOrders: finalOrders.length,
        payNow: totals.payNowTotal,
        payOnDelivery: totals.payOnDeliveryTotal,
      });

      isSubmittingRef.current = false;
      setIsSubmitting(false);
      onOrderSuccess(newOrderGroup);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] pb-36">
      {/* Top Header */}
      <header className="sticky top-0 z-30 glass-blur border-b border-[#E7DFCF]/80 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại"
          className="min-h-[44px] min-w-[44px] rounded-full flex items-center gap-1 text-small font-semibold text-[#35705A] hover:bg-[#F3EEE2] px-2 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span>{isBuyNowMode ? 'Huỷ mua ngay' : 'Quay lại'}</span>
        </button>

        <h1 className="font-serif text-lg font-bold text-[#1B1B1F]">
          {isBuyNowMode ? 'Phiên Đặt mua ngay' : 'Đặt hàng một màn'}
        </h1>

        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Banner thông báo chế độ Mua ngay (không đụng giỏ) */}
        {isBuyNowMode && (
          <div className="p-3 bg-[#EAF4EE] text-[#2F6B4F] text-small rounded-2xl border border-[#2F6B4F]/30 flex items-center gap-2">
            <ShieldCheck size={18} />
            <span>
              Phiên Mua ngay riêng biệt: Giỏ hàng hiện có của bạn vẫn được giữ nguyên an toàn.
            </span>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {checkoutError && (
          <div className="p-4 bg-[#FDF1F1] text-[#A63D3D] text-small rounded-2xl border border-[#A63D3D]/30 flex items-start gap-2.5">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Không thể hoàn tất đặt hàng:</span>
              <span>{checkoutError}</span>
            </div>
          </div>
        )}

        {/* KHỐI 1: ĐỊA CHỈ GIAO HÀNG (Bấm được -> Mở AddressSheet) */}
        <section
          onClick={() => setIsAddressSheetOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Địa chỉ giao hàng"
          className="p-4 bg-white rounded-2xl border border-[#E7DFCF] hover:border-[#B8893B] shadow-xs cursor-pointer transition-all flex items-start justify-between gap-3 group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3EEE2] text-[#8F6A4D] flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin size={20} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-small text-[#1B1B1F]">
                  Địa chỉ nhận hàng (Hà Nội)
                </span>
                {selectedAddress && (
                  <span className="text-xs px-2 py-0.5 bg-[#EAF4EE] text-[#2F6B4F] font-semibold rounded-full">
                    Đã chọn
                  </span>
                )}
              </div>

              {selectedAddress ? (
                <>
                  <div className="text-small font-semibold text-[#1B1B1F]">
                    {selectedAddress.recipientName} ·{' '}
                    <span className="font-mono text-[#8F6A4D]">{selectedAddress.phone}</span>
                  </div>
                  <p className="text-small text-[#6B4A32] leading-snug">
                    {selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district},{' '}
                    {selectedAddress.city}
                  </p>
                </>
              ) : (
                <p className="text-small text-[#A63D3D] font-medium">
                  Chưa có địa chỉ nhận. Chạm để chọn hoặc thêm địa chỉ Hà Nội.
                </p>
              )}
            </div>
          </div>

          <ChevronRight size={18} className="text-[#8F6A4D] group-hover:translate-x-1 transition-transform mt-3" />
        </section>

        {/* KHỐI 2: CÁCH GIAO HÀNG (Bấm được -> Mở DeliverySheet) */}
        <section
          onClick={() => setIsDeliverySheetOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Cách giao hàng"
          className="p-4 bg-white rounded-2xl border border-[#E7DFCF] hover:border-[#B8893B] shadow-xs cursor-pointer transition-all flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3EEE2] text-[#8F6A4D] flex items-center justify-center flex-shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <span className="font-serif font-bold text-small text-[#1B1B1F] block">
                Phương thức & Cước vận chuyển
              </span>
              <span className="text-small text-[#6B4A32]">
                {hasNormal && hasPreorder
                  ? 'Kho Hà Nội + Chuyến nông sản tươi theo vụ'
                  : hasPreorder
                  ? 'Giao từ vùng trồng khi thu hoạch'
                  : 'Giao tiêu chuẩn trong ngày từ kho Hà Nội'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="price-tag text-small">{formatMoney(totals.totalShipping)}</span>
            <ChevronRight size={18} className="text-[#8F6A4D] group-hover:translate-x-1 transition-transform" />
          </div>
        </section>

        {/* KHỐI 3: PHƯƠNG THỨC THANH TOÁN (Bấm được -> Mở PaymentSheet) */}
        <section
          onClick={() => setIsPaymentSheetOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Phương thức thanh toán"
          className="p-4 bg-white rounded-2xl border border-[#E7DFCF] hover:border-[#B8893B] shadow-xs cursor-pointer transition-all flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3EEE2] text-[#8F6A4D] flex items-center justify-center flex-shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <span className="font-serif font-bold text-small text-[#1B1B1F] block">
                Phương thức thanh toán
              </span>
              <span className="text-small text-[#6B4A32]">
                {paymentMethod === 'cod'
                  ? 'Thanh toán khi nhận hàng (COD)'
                  : paymentMethod === 'online_qr'
                  ? 'Chuyển khoản VietQR tự động'
                  : 'Thẻ ATM / Thẻ quốc tế'}
              </span>
            </div>
          </div>

          <ChevronRight size={18} className="text-[#8F6A4D] group-hover:translate-x-1 transition-transform" />
        </section>

        {/* KHỐI 4: MÃ ƯU ĐÃI — nhập trực tiếp hoặc chọn từ danh sách */}
        <section aria-labelledby="voucher-heading" className="p-4 bg-white rounded-2xl border border-[#E7DFCF] shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="voucher-heading" className="flex items-center gap-2 font-serif font-bold text-small text-[#1B1B1F]">
              <Tag size={18} className="text-[#8F6A4D]" /> Mã giảm giá
            </h2>
            <button
              type="button"
              onClick={() => setIsVoucherSheetOpen(true)}
              className="min-h-[44px] px-2 text-small font-semibold text-[#35705A] underline cursor-pointer"
            >
              Xem mã có sẵn
            </button>
          </div>

          {appliedVoucher ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#EAF4EE] text-small">
              <span className="text-[#2F6B4F] font-semibold">
                {voucherResult.valid
                  ? `Đã áp dụng ${appliedVoucher.code}: -${formatMoney(totals.totalDiscount)}`
                  : `${appliedVoucher.code}: ${voucherResult.message || 'chưa áp dụng được'}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAppliedVoucher(null);
                  setVoucherInput('');
                }}
                className="min-h-[44px] px-2 font-semibold text-[#A63D3D] cursor-pointer"
              >
                Bỏ mã
              </button>
            </div>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const code = voucherInput.trim().toUpperCase();
                if (!code) return setVoucherError('Vui lòng nhập mã.');
                const found = mockVouchers.find((v) => v.code.toUpperCase() === code);
                if (!found) return setVoucherError('Mã giảm giá không tồn tại.');
                const check = validateAndApplyVoucher(found, splitResult.totalGoodsSubtotal, splitResult.orders);
                if (!check.valid) return setVoucherError(check.message || 'Mã chưa áp dụng được cho đơn này.');
                setVoucherError(null);
                setAppliedVoucher(found);
                track('voucher_apply_inline', { code });
              }}
            >
              <label htmlFor="voucher-input" className="sr-only">Nhập mã giảm giá</label>
              <input
                id="voucher-input"
                value={voucherInput}
                onChange={(e) => {
                  setVoucherInput(e.target.value);
                  setVoucherError(null);
                }}
                placeholder="Nhập mã, ví dụ DACSAN10"
                autoComplete="off"
                aria-invalid={Boolean(voucherError)}
                aria-describedby={voucherError ? 'voucher-error' : undefined}
                className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] outline-none uppercase text-small"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-[#35705A] text-white text-small font-semibold hover:bg-[#2A6F50] cursor-pointer"
              >
                Áp dụng
              </button>
            </form>
          )}
          {voucherError && (
            <p id="voucher-error" role="alert" className="text-small text-[#A63D3D]">{voucherError}</p>
          )}
        </section>

        {/* KHỐI TÙY CHỌN GỬI TẶNG (Mở rộng) */}
        <section className="p-4 bg-white rounded-2xl border border-[#E7DFCF] space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Gift size={20} className="text-[#B8893B]" />
              <span className="font-serif font-bold text-small text-[#1B1B1F]">
                Đây là quà gửi tặng người thân / đối tác
              </span>
            </div>
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
              className="accent-[#B8893B] w-5 h-5 rounded cursor-pointer"
            />
          </label>

          {isGift && (
            <div className="space-y-3 pt-2 border-t border-[#E7DFCF]">
              <input
                type="text"
                placeholder="Tên người nhận quà (in trên thiệp)"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7DFCF] text-small"
              />
              <textarea
                placeholder="Lời chúc gửi kèm thiệp mừng..."
                rows={2}
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E7DFCF] text-small resize-none"
              />
              <label className="flex items-center justify-between cursor-pointer p-2 bg-[#F3EEE2] rounded-xl text-small">
                <span>Kèm hộp quà sang trọng (+50.000₫)</span>
                <input
                  type="checkbox"
                  checked={hasGiftBox}
                  onChange={(e) => setHasGiftBox(e.target.checked)}
                  className="accent-[#B8893B] w-4 h-4 rounded"
                />
              </label>
            </div>
          )}
        </section>

        {/* KHỐI 5: TÓM TẮT & CÁC ĐƠN SẼ TÁCH (BR-MN-07, TS-E2E-04, US-08) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif font-bold text-body text-[#1B1B1F]">
              Các kiện đơn sẽ tách ({finalOrders.length} đơn)
            </h3>
            <span className="text-caption text-[#8F6A4D]">Mã lần đặt: {orderGroupCode}</span>
          </div>

          <div className="space-y-3">
            {finalOrders.map((childOrder) => (
              <div
                key={childOrder.id}
                className="p-4 bg-white rounded-2xl border border-[#E7DFCF] shadow-xs space-y-3"
              >
                {/* Header đơn con */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E7DFCF]">
                  <div>
                    <span className="text-caption font-semibold uppercase text-[#8F6A4D]">
                      Mã đơn: {childOrder.orderCode}
                    </span>
                    <h4 className="font-serif font-bold text-small text-[#1B1B1F]">
                      {childOrder.supplierName}
                    </h4>
                  </div>

                  <div>
                    {childOrder.kind === 'preorder' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-caption font-semibold bg-[#FEF7EA] text-[#B7791F]">
                        Đặt trước · Giao {childOrder.expectedDeliveryDate}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-caption font-semibold bg-[#EAF4EE] text-[#2F6B4F]">
                        Hàng có sẵn · Giao trong ngày
                      </span>
                    )}
                  </div>
                </div>

                {/* Danh sách món trong đơn con */}
                <div className="space-y-2">
                  {childOrder.items.map((it) => (
                    <div key={it.variantId} className="flex items-center justify-between text-small">
                      <div className="flex-1 pr-2 truncate">
                        <span className="font-medium text-[#1B1B1F]">{it.productName}</span>
                        <span className="text-caption text-[#8F6A4D] ml-1.5">
                          ({it.variantLabel} × {it.quantity})
                        </span>
                      </div>
                      <span className="price-tag text-small font-semibold">
                        {formatMoney(it.total)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Phí ship & cọc của đơn con */}
                <div className="pt-2 border-t border-[#E7DFCF] flex items-center justify-between text-caption text-[#6B4A32]">
                  <span>Cước giao hàng: {formatMoney(childOrder.shippingFee)}</span>
                  {childOrder.kind === 'preorder' ? (
                    <span className="text-[#B7791F] font-semibold">
                      Cọc trước: {formatMoney(childOrder.depositAmount)} · Còn lại khi nhận:{' '}
                      {formatMoney(childOrder.payOnDeliveryAmount)}
                    </span>
                  ) : (
                    <span>
                      {childOrder.payNowAmount > 0
                        ? `Trả online: ${formatMoney(childOrder.payNowAmount)}`
                        : `Trả khi nhận: ${formatMoney(childOrder.payOnDeliveryAmount)}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* KHỐI 6: CHI TIẾT TỔNG TIỀN */}
        <section className="p-4 bg-white rounded-2xl border border-[#E7DFCF] space-y-2.5 text-small">
          <div className="flex justify-between text-[#6B4A32]">
            <span>Tiền hàng ({checkoutItems.reduce((s, it) => s + it.quantity, 0)} món)</span>
            <span className="font-semibold text-[#1B1B1F]">{formatMoney(totals.subtotalGoods)}</span>
          </div>

          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-[#2F6B4F] font-semibold">
              <span>Mã giảm giá ưu đãi</span>
              <span>-{formatMoney(totals.totalDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#6B4A32]">
            <span>Phí vận chuyển ({finalOrders.length} chuyến)</span>
            <span className="font-semibold text-[#1B1B1F]">{formatMoney(totals.totalShipping)}</span>
          </div>

          {totals.totalGiftBox > 0 && (
            <div className="flex justify-between text-[#6B4A32]">
              <span>Phí hộp quà đặc biệt</span>
              <span className="font-semibold text-[#1B1B1F]">{formatMoney(totals.totalGiftBox)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#E7DFCF] flex items-baseline justify-between text-body font-bold text-[#1B1B1F]">
            <span>Tổng giá trị lần đặt</span>
            <span className="price-tag text-2xl">{formatMoney(totals.grandTotal)}</span>
          </div>

          {/* Phân định Trả ngay vs Trả khi nhận (BR-MN-08, US-06) */}
          <div className="p-3 bg-[#F3EEE2] rounded-xl space-y-1 text-small">
            {totals.payNowTotal > 0 && (
              <div className="flex justify-between font-bold text-[#35705A]">
                <span>
                  {paymentMethod !== 'cod'
                    ? 'Thanh toán online ngay:'
                    : 'Cọc 30% cho hàng đặt trước:'}
                </span>
                <span className="price-tag text-base">{formatMoney(totals.payNowTotal)}</span>
              </div>
            )}
            {totals.payNowTotal > 0 && paymentMethod === 'cod' && (
              <p className="text-caption text-[#6B4A32]">
                Hàng đặt trước cần cọc 30% để giữ suất; phần còn lại trả khi nhận hàng.
              </p>
            )}
            {totals.payOnDeliveryTotal > 0 && (
              <div className="flex justify-between font-semibold text-[#6B4A32]">
                <span>Thanh toán khi nhận hàng:</span>
                <span className="font-mono text-[#1B1B1F]">{formatMoney(totals.payOnDeliveryTotal)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Ghi chú cho đơn hàng */}
        <section className="p-4 bg-white rounded-2xl border border-[#E7DFCF]">
          <label className="block text-small font-semibold text-[#1B1B1F] mb-1.5">
            Ghi chú giao hàng:
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7DFCF] text-small"
          />
        </section>
      </main>

      {/* THANH ĐẶT HÀNG DÍNH ĐÁY VỚI SỐ TIỀN TRẢ NGAY & TRẢ KHI NHẬN (BR-MN-08) */}
      <footer
        role="region"
        aria-label="Thanh xác nhận đặt hàng"
        className="fixed bottom-0 inset-x-0 z-40 glass-blur border-t border-[#E7DFCF]/80 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-caption text-[#8F6A4D] font-medium leading-none mb-0.5">
              {totals.payNowTotal > 0 ? 'Thanh toán ngay' : 'Thanh toán khi nhận'}
            </span>
            <div className="price-tag text-2xl font-bold">
              {formatMoney(totals.payNowTotal > 0 ? totals.payNowTotal : totals.payOnDeliveryTotal)}
            </div>
            {totals.payNowTotal > 0 && totals.payOnDeliveryTotal > 0 && (
              <span className="text-xs text-[#6B4A32] font-semibold mt-0.5">
                + Trả khi nhận: {formatMoney(totals.payOnDeliveryTotal)}
              </span>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            onClick={handlePlaceOrder}
            className="flex-1 max-w-xs shadow-brass"
            rightIcon={<ArrowRight size={18} />}
          >
            {totals.payNowTotal > 0 ? `Trả ngay ${formatMoney(totals.payNowTotal)}` : 'Đặt hàng (COD)'}
          </Button>
        </div>
      </footer>

      {/* SHEETS LIÊN QUAN */}
      <AddressSheet
        isOpen={isAddressSheetOpen}
        onClose={() => setIsAddressSheetOpen(false)}
        addresses={user?.addresses || []}
        selectedAddressId={selectedAddress?.id}
        onSelectAddress={(addr) => setSelectedAddress(addr)}
        onAddNewAddress={(newAddr) => {
          if (user) {
            return addAddress(newAddr);
          }
          const created = { ...newAddr, id: `addr_${Date.now()}` };
          setSelectedAddress(created);
          return created;
        }}
      />

      <DeliverySheet
        isOpen={isDeliverySheetOpen}
        onClose={() => setIsDeliverySheetOpen(false)}
        hasNormalItems={hasNormal}
        hasPreorderItems={hasPreorder}
      />

      <PaymentSheet
        isOpen={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
        selectedMethod={paymentMethod}
        onSelectMethod={(m) => setPaymentMethod(m)}
        hasPreorder={hasPreorder}
      />

      <VoucherSheet
        isOpen={isVoucherSheetOpen}
        onClose={() => setIsVoucherSheetOpen(false)}
        currentVoucherCode={appliedVoucher?.code}
        orderSubtotal={splitResult.totalGoodsSubtotal}
        onApplyVoucher={(v) => setAppliedVoucher(v)}
      />
    </div>
  );
};
