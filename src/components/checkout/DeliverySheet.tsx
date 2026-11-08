import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Truck, Clock, ShieldCheck } from 'lucide-react';
import { formatMoney } from '../../lib/pricing';
import { WAREHOUSE_HANOI_SHIPPING_FEE, PREORDER_SHIPPING_FEE_PER_TRIP } from '../../lib/orderSplit';

export interface DeliverySheetProps {
  isOpen: boolean;
  onClose: () => void;
  hasNormalItems: boolean;
  hasPreorderItems: boolean;
}

export const DeliverySheet: React.FC<DeliverySheetProps> = ({
  isOpen,
  onClose,
  hasNormalItems,
  hasPreorderItems,
}) => {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Phương thức & Biểu phí giao hàng"
      subtitle="Chính sách vận chuyển áp dụng cho đơn giao Hà Nội"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 py-1">
        {hasNormalItems && (
          <div className="p-4 bg-white rounded-2xl border border-[#E7DFCF] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-serif font-bold text-small text-[#1B1B1F]">
                <Truck size={18} className="text-[#2F6B4F]" />
                <span>Hàng có sẵn tại kho Hà Nội</span>
              </div>
              <span className="price-tag text-small font-bold">
                {formatMoney(WAREHOUSE_HANOI_SHIPPING_FEE)} / chuyến
              </span>
            </div>
            <p className="text-small text-[#6B4A32]">
              Hàng được bảo quản lạnh và đóng gói tập trung tại kho Hà Nội. Toàn bộ các món hàng có sẵn của các nhà cung cấp khác nhau đi CHUNG một chuyến, chỉ tính duy nhất một lần cước giao hàng.
            </p>
            <div className="text-caption text-[#2F6B4F] font-semibold flex items-center gap-1">
              <ShieldCheck size={14} /> Giao nhanh trong 2–4 giờ hoặc trong ngày
            </div>
          </div>
        )}

        {hasPreorderItems && (
          <div className="p-4 bg-[#FEF7EA]/60 rounded-2xl border border-[#B7791F]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-serif font-bold text-small text-[#B7791F]">
                <Clock size={18} />
                <span>Hàng đặt trước theo mùa vụ</span>
              </div>
              <span className="price-tag text-small font-bold">
                {formatMoney(PREORDER_SHIPPING_FEE_PER_TRIP)} / chuyến
              </span>
            </div>
            <p className="text-small text-[#6B4A32]">
              Nông sản tươi hái trực tiếp từ vườn/đồi Lào Cai và vận chuyển bảo quản lạnh về Hà Nội theo từng đợt thu hoạch. Mỗi chuyến giao theo ngày thu hoạch tính cước riêng.
            </p>
            <div className="text-caption text-[#B7791F] font-semibold">
              * Lưu ý: Sản phẩm đặt trước KHÔNG áp dụng giao hỏa tốc.
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-full bg-[#35705A] text-[#FAF7F0] font-semibold text-small cursor-pointer hover:bg-[#4B8A71]"
        >
          Đã hiểu
        </button>
      </div>
    </Sheet>
  );
};
