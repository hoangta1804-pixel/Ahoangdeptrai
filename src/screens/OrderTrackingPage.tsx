import React from 'react';
import { useOrders } from '../stores/orderStore';
import { formatMoney } from '../lib/pricing';
import { Button } from '../components/ui/Button';
import {
  ChevronLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
} from 'lucide-react';

export interface OrderTrackingPageProps {
  orderGroupId: string;
  onBack: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  orderGroupId,
  onBack,
}) => {
  const { getOrderGroupById } = useOrders();
  const group = getOrderGroupById(orderGroupId);

  if (!group) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] p-8 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">Không tìm thấy đơn hàng</h2>
        <Button variant="primary" onClick={onBack}>
          Quay lại
        </Button>
      </div>
    );
  }

  const steps = [
    { label: 'Đã nhận đơn', desc: 'Đơn hàng đã được tạo', completed: true },
    {
      label: 'Xác nhận kho',
      desc: 'Kho Hà Nội đóng gói bảo quản',
      completed: group.paymentStatus === 'paid' || group.payNowTotal === 0,
    },
    { label: 'Đang vận chuyển', desc: 'Bàn giao tài xế giao hàng', completed: false },
    { label: 'Giao thành công', desc: 'Khách nhận & kiểm tra hàng', completed: false },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-8 px-4 lg:px-8">
      <main className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7DFCF]">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-small font-semibold text-[#35705A] hover:text-[#B8893B] cursor-pointer"
          >
            <ChevronLeft size={20} />
            <span>Quay lại</span>
          </button>
          <span className="font-mono text-caption text-[#8F6A4D] font-bold">
            MÃ: {group.orderGroupCode}
          </span>
        </div>

        {/* Tiến trình tổng quan */}
        <div className="p-6 bg-white rounded-3xl border border-[#E7DFCF] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-xl font-bold text-[#35705A]">
              Trạng thái hành trình đơn hàng
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#EAF4EE] text-[#2F6B4F] text-xs font-bold">
              {group.paymentStatus === 'paid' ? 'Đang chuẩn bị hàng' : 'Chờ hoàn tất thanh toán'}
            </span>
          </div>

          {/* Dòng thời gian ngang / dọc */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {steps.map((st, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    st.completed
                      ? 'bg-[#2F6B4F] text-white shadow-sm'
                      : 'bg-[#F3EEE2] text-[#8F6A4D]'
                  }`}
                >
                  {st.completed ? <CheckCircle2 size={20} /> : <Clock size={18} />}
                </div>
                <span className="font-serif font-bold text-xs leading-tight text-[#1B1B1F]">
                  {st.label}
                </span>
                <span className="text-xs text-[#8F6A4D] hidden sm:block">{st.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chi tiết từng kiện đơn con */}
        <div className="space-y-4">
          <h2 className="font-serif font-bold text-lg text-[#35705A]">
            Các kiện hàng trong lần đặt ({group.orders.length} kiện)
          </h2>

          {group.orders.map((child) => (
            <div
              key={child.id}
              className="p-5 bg-white rounded-3xl border border-[#E7DFCF] shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DFCF]">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-[#8F6A4D]" />
                  <h3 className="font-serif font-bold text-small text-[#1B1B1F]">
                    {child.supplierName}
                  </h3>
                </div>
                <span className="text-caption font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7F0] text-[#6B4A32]">
                  {child.expectedDeliveryDate}
                </span>
              </div>

              <div className="space-y-2">
                {child.items.map((it) => (
                  <div key={it.variantId} className="flex justify-between text-small">
                    <span>
                      {it.productName} ({it.variantLabel}) × {it.quantity}
                    </span>
                    <span className="price-tag text-small font-semibold">
                      {formatMoney(it.total)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#E7DFCF] flex justify-between text-caption text-[#6B4A32]">
                <span>Cước: {formatMoney(child.shippingFee)}</span>
                <span>
                  Tổng kiện: <strong>{formatMoney(child.subtotal + child.shippingFee)}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
