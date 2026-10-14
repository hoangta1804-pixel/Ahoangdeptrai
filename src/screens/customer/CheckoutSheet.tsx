import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { now } from '../../domain/clock';
import { generateOrderCode } from '../../domain/ids';
import { expressSurchargeFor, formatMoney, sumLines } from '../../domain/pricing';
import type { Order } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';

/**
 * Màn đặt hàng – bản chuyển từ App.tsx cũ.
 * GIAI ĐOẠN 2 sẽ viết lại theo mục 5.1–5.4 (tách đơn, cọc chỉ cho đặt trước, COD, cổng thanh toán mô phỏng):
 * các lỗi L1, L3, L5, L7, L15 vẫn còn ở màn này.
 */
// Khoảng cách mẫu từ kho tới địa chỉ; Giai đoạn 2 lấy từ trường distanceKm của địa chỉ.
const SAMPLE_DISTANCE_KM = 6.8;

export function CheckoutSheet({ onClose }: { onClose: () => void }) {
  const { cart, setCart, setOrders, selectedAddress, params, orders } = useAppData();
  const { openModal, showToast, setCustomerTab } = useUi();
  const [shippingType, setShippingType] = useState<'standard' | 'express'>('standard');

  const cartSubtotal = sumLines(cart.map((c) => ({ unitPrice: c.product.price, quantity: c.quantity })));
  const expressFee = expressSurchargeFor(SAMPLE_DISTANCE_KM, params.expressTiers);
  const shippingFee = shippingType === 'standard' || expressFee === null ? params.standardShippingFee : expressFee;
  const voucherDiscount = 0;

  const placeOrder = () => {
    if (cart.length === 0) {
      showToast('Giỏ hàng đang trống!');
      return;
    }
    const createdAt = now();
    const newOrd: Order = {
      id: generateOrderCode(createdAt, orders.map((o) => o.id)),
      createdAt: createdAt.toLocaleDateString('vi-VN'),
      customerName: 'Nguyễn Văn An',
      customerPhone: '0988 234 567',
      items: cart.map((c) => ({ product: c.product, quantity: c.quantity, unitPrice: c.product.price })),
      totalItemAmount: cartSubtotal,
      shippingFee,
      voucherDiscount,
      totalAmount: cartSubtotal + shippingFee - voucherDiscount,
      depositPaid: Math.round(cartSubtotal * 0.3),
      remainingCod: cartSubtotal + shippingFee - voucherDiscount - Math.round(cartSubtotal * 0.3),
      shippingMethod: shippingType,
      frozenAddressSnapshot: `${selectedAddress.buildingBlock || selectedAddress.streetDetails}, ${selectedAddress.district}, Hà Nội`,
      houseType: selectedAddress.houseType,
      district: selectedAddress.district,
      status: 'confirmed',
      expectedDelivery: '18/10/2026',
      isPreorder: true,
    };
    setOrders((prev) => [newOrd, ...prev]);
    setCart([]);
    onClose();
    setCustomerTab('orders');
    showToast('Đặt hàng thành công! Đã thanh toán cọc 30% bảo chứng.');
  };

  return (
    <BottomSheet
      title="Xác Nhận Giỏ Hàng & Đặt Hàng"
      onClose={onClose}
      footer={
        <button
          onClick={placeOrder}
          className="w-full rounded-2xl bg-emerald-900 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-800"
        >
          Xác nhận đặt hàng & Thanh toán
        </button>
      }
    >
      <div className="space-y-1 rounded-2xl border border-stone-200/80 bg-stone-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-emerald-800">Địa chỉ giao hàng</span>
          <button onClick={() => openModal({ type: 'address_sheet' })} className="min-h-9 px-2 text-sm font-semibold text-emerald-700">
            Đổi
          </button>
        </div>
        <p className="text-sm font-bold text-stone-900">
          {selectedAddress.houseType === 'apartment'
            ? `${selectedAddress.buildingBlock} - Căn ${selectedAddress.apartmentNumber}, ${selectedAddress.buildingName}`
            : selectedAddress.streetDetails}
        </p>
        <p className="text-xs text-stone-500">
          {selectedAddress.ward}, {selectedAddress.district}, Hà Nội
        </p>
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-semibold text-stone-700">Phương thức giao hàng:</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShippingType('standard')}
            className={`rounded-xl border p-2.5 text-left text-sm transition-all ${
              shippingType === 'standard' ? 'border-emerald-700 bg-emerald-50/60 font-bold text-emerald-950' : 'border-stone-200 bg-white text-stone-600'
            }`}
          >
            <span>Giao thường</span>
            <span className="block text-xs font-normal text-stone-500">{formatMoney(params.standardShippingFee)}</span>
          </button>
          <button
            disabled={expressFee === null}
            onClick={() => setShippingType('express')}
            className={`rounded-xl border p-2.5 text-left text-sm transition-all disabled:opacity-50 ${
              shippingType === 'express' ? 'border-emerald-700 bg-emerald-50/60 font-bold text-emerald-950' : 'border-stone-200 bg-white text-stone-600'
            }`}
          >
            <span className="font-bold text-amber-800">Giao hoả tốc</span>
            <span className="block text-xs font-normal text-stone-500">
              {expressFee === null ? 'Ngoài vùng hoả tốc' : `${SAMPLE_DISTANCE_KM} km: ${formatMoney(expressFee)}`}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-stone-100 pt-3">
        <span className="text-sm font-semibold text-stone-700">Sản phẩm trong giỏ ({cart.length}):</span>
        {cart.map((item) => (
          <div key={item.product.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-stone-800">
              {item.quantity}x {item.product.name}
            </span>
            <span className="font-bold tabular-nums text-stone-900">{formatMoney(item.product.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 rounded-2xl border border-stone-200/80 bg-stone-50 p-3 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>Tiền hàng:</span>
          <span className="font-medium tabular-nums">{formatMoney(cartSubtotal)}</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>Phí giao hàng:</span>
          <span className="font-medium tabular-nums">{formatMoney(shippingFee)}</span>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold text-stone-900">
          <span>Tổng thanh toán:</span>
          <span className="tabular-nums text-emerald-900">{formatMoney(cartSubtotal + shippingFee - voucherDiscount)}</span>
        </div>
      </div>
    </BottomSheet>
  );
}
