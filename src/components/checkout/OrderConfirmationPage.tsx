import React, { useState, useEffect } from 'react';
import { OrderGroup } from '../../mock/types';
import { formatMoney } from '../../lib/pricing';
import { useOrders } from '../../stores/orderStore';
import { Button } from '../ui/Button';
import { VietQrPayment } from './VietQrPayment';
import { isDevToolsEnabled } from '../../lib/devMode';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Building2,
  MapPin,
  CreditCard,
} from 'lucide-react';

export interface OrderConfirmationPageProps {
  orderGroup: OrderGroup;
  onContinueShopping: () => void;
  onTrackOrder: (groupId: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderGroup,
  onContinueShopping,
  onTrackOrder,
}) => {
  const { markPaymentSuccess, markPaymentFailed, cancelOrderGroup } = useOrders();
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, Math.floor((orderGroup.paymentExpiresAt - Date.now()) / 1000));
  });
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(orderGroup.paymentStatus);
  // Khách báo đã chuyển khoản: dừng đếm ngược, chờ cửa hàng đối soát (chưa tự xác nhận được)
  const [transferClaimed, setTransferClaimed] = useState(false);
  const [showDevGateway] = useState(isDevToolsEnabled);

  useEffect(() => {
    if (paymentStatus === 'paid' || paymentStatus === 'timeout_cancelled' || transferClaimed) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((orderGroup.paymentExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        cancelOrderGroup(orderGroup.id);
        setPaymentStatus('timeout_cancelled');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [orderGroup.paymentExpiresAt, paymentStatus, transferClaimed, orderGroup.id, cancelOrderGroup]);

  const handleSimulatePayment = (result: 'success' | 'fail' | 'cancel') => {
    setIsGatewayOpen(false);
    if (result === 'success') {
      markPaymentSuccess(orderGroup.id);
      setPaymentStatus('paid');
    } else if (result === 'fail') {
      markPaymentFailed(orderGroup.id);
      setPaymentStatus('failed');
    }
  };

  const handleCancelOrder = () => {
    cancelOrderGroup(orderGroup.id);
    setPaymentStatus('timeout_cancelled');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-8 px-4">
      <main className="max-w-2xl mx-auto space-y-6">
        {/* Header thành công trang nhã */}
        <div className="text-center space-y-3 py-4">
          <div className="w-16 h-16 rounded-full bg-[#EAF4EE] text-[#2F6B4F] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="font-serif text-h2 font-bold text-[#1B1B1F]">
            Đặt hàng thành công!
          </h1>
          <p className="text-small text-[#6B4A32] max-w-md mx-auto">
            Cảm ơn bạn đã lựa chọn Đặc Sản Số. Đơn hàng của bạn đã được ghi nhận và đang chuẩn bị xuất kho.
          </p>
          <div className="inline-block px-4 py-1.5 bg-[#F3EEE2] rounded-full text-caption font-mono font-bold text-[#8F6A4D] border border-[#E7DFCF]">
            MÃ LẦN ĐẶT: {orderGroup.orderGroupCode}
          </div>
        </div>

        {/* Cảnh báo đếm ngược 15 phút nếu có khoản cần trả online */}
        {orderGroup.payNowTotal > 0 && paymentStatus !== 'paid' && paymentStatus !== 'timeout_cancelled' && (
          <div className="p-4 bg-[#FEF7EA] rounded-2xl border border-[#B7791F]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-serif font-bold text-small text-[#B7791F]">
                <Clock size={18} />
                <span>Thời gian giữ đơn & Giữ tồn kho:</span>
              </div>
              <span className="font-mono font-bold text-lg text-[#B7791F]">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>

            <p className="text-small text-[#6B4A32]">
              Vui lòng hoàn tất thanh toán khoản tiền{' '}
              <strong className="text-[#1B1B1F]">{formatMoney(orderGroup.payNowTotal)}</strong> trong
              thời hạn 15 phút để đảm bảo quyền giữ hàng.
            </p>

            {paymentStatus === 'failed' && (
              <div className="p-2.5 bg-[#FDF1F1] text-[#A63D3D] text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <AlertCircle size={15} />
                <span>Giao dịch trước đó thất bại. Bạn có thể nhấn Thanh toán ngay để thử lại.</span>
              </div>
            )}

            {!transferClaimed && (
              <>
                <VietQrPayment amount={orderGroup.payNowTotal} orderCode={orderGroup.orderGroupCode} />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="primary" size="md" className="flex-1" onClick={() => setTransferClaimed(true)}>
                    Tôi đã chuyển khoản
                  </Button>
                  {showDevGateway && (
                    <Button variant="outline" size="md" onClick={() => setIsGatewayOpen(true)} rightIcon={<ExternalLink size={16} />}>
                      Cổng giả lập (dev)
                    </Button>
                  )}
                  <Button variant="ghost" size="md" onClick={handleCancelOrder}>
                    Huỷ đơn
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {transferClaimed && paymentStatus !== 'paid' && (
          <div role="status" className="p-4 bg-[#EAF4EE] text-[#2F6B4F] rounded-2xl border border-[#2F6B4F]/30 text-small space-y-1">
            <strong className="block">Đã ghi nhận bạn chuyển khoản {formatMoney(orderGroup.payNowTotal)}.</strong>
            <span>
              Cửa hàng sẽ đối soát theo nội dung chuyển khoản và xác nhận đơn. Nếu chưa chuyển, bạn có thể{' '}
              <button type="button" className="underline font-semibold min-h-[44px]" onClick={() => setTransferClaimed(false)}>
                xem lại mã QR
              </button>
              .
            </span>
          </div>
        )}

        {/* Đơn trả khi nhận hàng: cho phép chuyển khoản trước thay tiền mặt */}
        {orderGroup.payOnDeliveryTotal > 0 && paymentStatus !== 'timeout_cancelled' && (
          <details className="group rounded-2xl border border-[#E7DFCF] bg-white">
            <summary className="min-h-[48px] px-4 py-3 cursor-pointer font-serif font-bold text-small text-[#1B1B1F] list-none flex items-center justify-between">
              Muốn chuyển khoản {formatMoney(orderGroup.payOnDeliveryTotal)} thay vì trả tiền mặt?
              <span aria-hidden="true" className="text-[#2A6F50] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-4 pb-4">
              <VietQrPayment
                amount={orderGroup.payOnDeliveryTotal}
                orderCode={orderGroup.orderGroupCode}
                title="Quét mã để trả trước tiền hàng"
              />
            </div>
          </details>
        )}

        {paymentStatus === 'timeout_cancelled' && (
          <div className="p-4 bg-[#FDF1F1] rounded-2xl border border-[#A63D3D]/30 text-small text-[#A63D3D] space-y-1">
            <strong className="block font-bold">Đơn hàng đã hết thời gian giữ hàng:</strong>
            <p>Hệ thống đã tự động hoàn trả số lượng vào kho để nhường cho khách mua khác. Bạn có thể mua lại món này.</p>
          </div>
        )}

        {paymentStatus === 'paid' && (
          <div className="p-3.5 bg-[#EAF4EE] text-[#2F6B4F] rounded-2xl border border-[#2F6B4F]/30 text-small font-semibold flex items-center gap-2">
            <ShieldCheck size={18} />
            <span>Khoản thanh toán online đã được xác nhận thành công!</span>
          </div>
        )}

        {/* THÔNG TIN CHI TIẾT TỪNG ĐƠN ĐÃ TÁCH */}
        <section className="space-y-3">
          <h2 className="font-serif font-bold text-body text-[#1B1B1F]">
            Chi tiết các đơn con ({orderGroup.orders.length} kiện)
          </h2>

          <div className="space-y-3">
            {orderGroup.orders.map((child) => (
              <div
                key={child.id}
                className="p-4 bg-white rounded-2xl border border-[#E7DFCF] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E7DFCF]">
                  <div>
                    <span className="text-caption font-mono font-semibold text-[#8F6A4D] uppercase">
                      Mã: {child.orderCode}
                    </span>
                    <h3 className="font-serif font-bold text-small text-[#1B1B1F]">
                      {child.supplierName}
                    </h3>
                  </div>
                  <span className="text-caption px-2.5 py-0.5 rounded-full font-semibold bg-[#F3EEE2] text-[#6B4A32]">
                    {child.expectedDeliveryDate}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {child.items.map((it) => (
                    <div key={it.variantId} className="flex justify-between text-small">
                      <span className="text-[#33333A]">
                        {it.productName} ({it.variantLabel}) × {it.quantity}
                      </span>
                      <span className="price-tag text-small">{formatMoney(it.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E7DFCF] flex justify-between text-caption text-[#6B4A32]">
                  <span>Cước giao hàng: {formatMoney(child.shippingFee)}</span>
                  <span>
                    {child.payNowAmount > 0 && `Đã trả online: ${formatMoney(child.payNowAmount)}`}
                    {child.payOnDeliveryAmount > 0 &&
                      ` · Trả khi nhận: ${formatMoney(child.payOnDeliveryAmount)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* THÔNG TIN NGƯỜI NHẬN & ĐỊA CHỈ */}
        <section className="p-4 bg-white rounded-2xl border border-[#E7DFCF] space-y-2 text-small">
          <div className="flex items-center gap-2 font-serif font-bold text-[#1B1B1F]">
            <MapPin size={18} className="text-[#8F6A4D]" />
            <span>Địa chỉ nhận hàng tại Hà Nội:</span>
          </div>
          <p className="text-[#33333A]">
            <strong className="text-[#1B1B1F]">{orderGroup.customerName}</strong> ·{' '}
            <span className="font-mono">{orderGroup.phone}</span>
          </p>
          <p className="text-[#6B4A32]">
            {orderGroup.address.street}, {orderGroup.address.ward}, {orderGroup.address.district},{' '}
            {orderGroup.address.city}
          </p>
          {orderGroup.note && (
            <p className="text-caption text-[#8F6A4D] pt-1">
              <strong>Ghi chú:</strong> {orderGroup.note}
            </p>
          )}
        </section>

        {/* NÚT ĐIỀU HƯỚNG */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => onTrackOrder(orderGroup.id)}
            rightIcon={<ArrowRight size={18} />}
          >
            Theo dõi đơn hàng
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onContinueShopping}
            leftIcon={<ShoppingBag size={18} />}
          >
            Tiếp tục mua sắm
          </Button>
        </div>

        {/* CỔNG THANH TOÁN GIẢ LẬP (MÔ PHỎNG) */}
        {isGatewayOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F6650]/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-[#E7DFCF]">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F0] text-[#B8893B] flex items-center justify-center mx-auto">
                <CreditCard size={24} />
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#1B1B1F]">
                  Cổng thanh toán giả lập
                </h3>
                <p className="text-caption text-[#6B4A32] mt-1">
                  Mô phỏng thanh toán online gộp một giao dịch duy nhất cho toàn bộ khoản cọc / trả ngay
                </p>
              </div>

              <div className="p-3 bg-[#FAF7F0] rounded-xl text-center">
                <span className="text-caption text-[#8F6A4D] block">Số tiền cần thanh toán</span>
                <span className="price-tag text-2xl font-bold">
                  {formatMoney(orderGroup.payNowTotal)}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => handleSimulatePayment('success')}
                >
                  Xác nhận thành công (Thành công)
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="w-full"
                  onClick={() => handleSimulatePayment('fail')}
                >
                  Mô phỏng lỗi giao dịch (Thất bại)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => handleSimulatePayment('cancel')}
                >
                  Huỷ / Đóng cổng
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
