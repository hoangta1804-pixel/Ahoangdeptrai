import React from 'react';
import { Product } from '../mock/types';
import { Button } from '../components/ui/Button';
import {
  ChevronLeft,
  QrCode,
  ShieldCheck,
  MapPin,
  Calendar,
  Building2,
  FileCheck2,
  Leaf,
} from 'lucide-react';

export interface TraceabilityPageProps {
  code: string;
  product?: Product;
  onBack: () => void;
}

export const TraceabilityPage: React.FC<TraceabilityPageProps> = ({
  code,
  product,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-8 px-4 lg:px-8">
      <main className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7DFCF]">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-small font-semibold text-[#35705A] hover:text-[#B8893B] cursor-pointer"
          >
            <ChevronLeft size={20} />
            <span>Quay lại</span>
          </button>
          <span className="font-mono text-caption text-[#2F6B4F] font-bold flex items-center gap-1">
            <ShieldCheck size={16} /> XÁC THỰC NGUYÊN BẢN
          </span>
        </div>

        {/* Thông tin chứng thực nguồn gốc */}
        <div className="p-6 bg-white rounded-3xl border border-[#E7DFCF] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F2EC] text-[#204C39] flex items-center justify-center">
              <QrCode size={30} />
            </div>
            <div>
              <span className="text-caption font-mono font-bold text-[#8F6A4D]">MÃ TRUY XUẤT: {code}</span>
              <h1 className="font-serif text-xl font-bold text-[#35705A]">
                {product?.name || 'Đặc sản vùng cao Lào Cai'}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-small">
            <div className="p-3 bg-[#FAF7F0] rounded-xl space-y-1">
              <span className="text-caption text-[#8F6A4D] flex items-center gap-1">
                <MapPin size={13} /> Vùng nguyên liệu:
              </span>
              <strong className="block text-[#1B1B1F]">{product?.region || 'Suối Giàng, Lào Cai'}</strong>
              <span className="text-xs text-[#6B4A32]">Độ cao 1.380m so với mực nước biển</span>
            </div>

            <div className="p-3 bg-[#FAF7F0] rounded-xl space-y-1">
              <span className="text-caption text-[#8F6A4D] flex items-center gap-1">
                <Calendar size={13} /> Ngày thu hoạch:
              </span>
              <strong className="block text-[#1B1B1F]">Vụ mùa 2026</strong>
              <span className="text-xs text-[#6B4A32]">Hái thủ công sáng sớm</span>
            </div>
          </div>

          {/* Dòng thời gian thu hoạch & kiểm định */}
          <div className="pt-4 border-t border-[#E7DFCF] space-y-3">
            <h3 className="font-serif font-bold text-small text-[#35705A]">
              Nhật ký chuỗi cung ứng đã xác thực:
            </h3>

            <div className="space-y-3 text-small">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2F6B4F] mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="block text-[#1B1B1F]">Thu hái tại nông hộ / vùng đồi</strong>
                  <span className="text-caption text-[#6B4A32]">
                    Canh tác tự nhiên theo tiêu chuẩn VietGAP, không sử dụng thuốc bảo vệ thực vật hóa học.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2F6B4F] mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="block text-[#1B1B1F]">Sơ chế & Đóng gói có tem niêm phong</strong>
                  <span className="text-caption text-[#6B4A32]">
                    Bao bì đạt chuẩn an toàn vệ sinh thực phẩm, hút chân không hoặc đóng hộp kín.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2F6B4F] mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="block text-[#1B1B1F]">Vận chuyển lạnh về Kho Hà Nội</strong>
                  <span className="text-caption text-[#6B4A32]">
                    Bảo quản nhiệt độ tiêu chuẩn tại kho điều phối Ba Đình, sẵn sàng giao ngay.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <Button variant="outline" onClick={onBack}>
            Quay lại chi tiết sản phẩm
          </Button>
        </div>
      </main>
    </div>
  );
};
