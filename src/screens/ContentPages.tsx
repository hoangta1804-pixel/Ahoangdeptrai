import React from 'react';
import { Leaf, ShieldCheck, Truck, Headphones, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AboutPage: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-12 px-4 lg:px-8">
      <main className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3 text-center">
          <span className="text-caption font-semibold tracking-wider uppercase text-[#B8893B]">
            VỀ ĐẶC SẢN SỐ
          </span>
          <h1 className="font-serif text-h1 font-bold text-[#35705A]">
            Kết nối những miền quê.<br />
            <em className="font-normal italic text-[#B8893B]">Lan toả giá trị nguyên bản.</em>
          </h1>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-[#E7DFCF] space-y-5 text-body text-[#33333A] leading-relaxed shadow-xs">
          <p>
            <strong>Đặc Sản Số</strong> ra đời từ mong ước bình dị: mang những hương vị mộc mạc, nguyên bản nhất từ núi rừng Lào Cai đến bàn ăn mỗi gia đình tại Hà Nội.
          </p>
          <p>
            Chúng tôi trân trọng từng hạt gạo nương Mường Khương, từng búp chè Shan tuyết đại ngàn Suối Giàng, quả mận tam hoa Bắc Hà phủ phấn trắng đến miếng thịt sấy đượm khói bếp Sa Pa. Mỗi thức quà là kết tinh từ khí trời non cao và bàn tay cần cù của các nhà cung cấp, doanh nghiệp và hộ kinh doanh tâm huyết.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E7DFCF]">
            <div className="p-4 bg-[#FAF7F0] rounded-2xl">
              <h3 className="font-serif font-bold text-[#35705A] mb-1">Mô hình mua đứt minh bạch</h3>
              <p className="text-small text-[#6B4A32]">
                Sàn trực tiếp nhập và kiểm định từng lô hàng, chịu trách nhiệm pháp lý và bảo quản tại kho Hà Nội.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F0] rounded-2xl">
              <h3 className="font-serif font-bold text-[#35705A] mb-1">Giao hàng tập trung</h3>
              <p className="text-small text-[#6B4A32]">
                Kho tổng điều phối tại Hà Nội giúp gom các đặc sản cùng chuyến, tối ưu chi phí và thời gian giao nhận.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Button variant="primary" size="lg" onClick={onExplore}>
            Khám phá đặc sản ngay
          </Button>
        </div>
      </main>
    </div>
  );
};

export const StoriesPage: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-12 px-4 lg:px-8">
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-caption font-semibold tracking-wider uppercase text-[#B8893B]">
            GÓC VĂN HÓA VÙNG CAO
          </span>
          <h1 className="font-serif text-h1 font-bold text-[#35705A]">
            Những câu chuyện từ đất lành
          </h1>
          <p className="text-small text-[#6B4A32]">
            Hành trình của người làm nghề, nhịp điệu mùa vụ và phong vị ẩm thực Tây Bắc
          </p>
        </div>

        <div className="space-y-6">
          <article className="p-8 bg-white rounded-3xl border border-[#E7DFCF] space-y-3 shadow-xs">
            <span className="text-caption font-bold text-[#B8893B] uppercase">
              CON NGƯỜI & NGHỀ TRUYỀN THỐNG
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#35705A]">
              Gặp những người gìn giữ hương chè trên núi cao Suối Giàng
            </h2>
            <p className="text-body text-[#33333A] leading-relaxed">
              Ở độ cao gần 1.400 mét so với mực nước biển, những cây chè Shan tuyết cổ thụ hàng trăm năm tuổi vẫn hiên ngang giữa sương mù bao phủ. Người bản địa xem cây chè như người bạn tri kỷ, chắt chiu từng búp non phủ lớp lông tơ trắng muốt lúc rạng đông. Trà sao thủ công trên chảo gang lớn giữ trọn vị chát dịu và hậu ngọt sâu lắng.
            </p>
          </article>

          <article className="p-8 bg-white rounded-3xl border border-[#E7DFCF] space-y-3 shadow-xs">
            <span className="text-caption font-bold text-[#B8893B] uppercase">
              NÔNG SẢN & MÙA VỤ
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#35705A]">
              Mỗi mùa đi qua, một hương vị ở lại
            </h2>
            <p className="text-body text-[#33333A] leading-relaxed">
              Nông sản có nhịp điệu của đất trời. Mùa mận tam hoa Bắc Hà chín đỏ rực đồi chỉ vỏn vẹn trong tháng 6; vụ nếp Tú Lệ dẻo thơm ngát khi gió thu về; thịt hun khói đượm nồng vào những ngày đông giá rét. Thưởng thức đặc sản đúng mùa là cách con người hòa cùng nhịp thở của tự nhiên.
            </p>
          </article>
        </div>
      </main>
    </div>
  );
};

export const PolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-12 px-4 lg:px-8">
      <main className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-caption font-semibold tracking-wider uppercase text-[#B8893B]">
            CHÍNH SÁCH BÁN HÀNG
          </span>
          <h1 className="font-serif text-h1 font-bold text-[#35705A]">
            Chính sách chất lượng & Đổi trả
          </h1>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-[#E7DFCF] space-y-6 text-body text-[#33333A] leading-relaxed shadow-xs">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#35705A] mb-2">1. Phạm vi giao hàng</h3>
            <p className="text-small text-[#6B4A32]">
              Hiện tại, sàn Đặc Sản Số chỉ tiếp nhận và giao các đơn hàng có địa chỉ nhận thuộc phạm vi các quận, huyện của thành phố Hà Nội.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-[#35705A] mb-2">2. Chính sách cọc hàng đặt trước</h3>
            <p className="text-small text-[#6B4A32]">
              Đối với các nông sản tươi mở đặt trước theo mùa vụ (ví dụ: mận tươi Bắc Hà, cá tầm phi lê), quý khách thanh toán trước 30% tiền cọc (làm tròn lên 1.000₫) để nhà vườn đảm bảo suất thu hoạch. Số tiền còn lại và cước giao hàng được thanh toán khi nhận hàng.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-[#35705A] mb-2">3. Chính sách đổi trả & Hoàn tiền</h3>
            <p className="text-small text-[#6B4A32]">
              Khách hàng được quyền đồng kiểm tra hàng khi nhận. Trường hợp sản phẩm hư hỏng, không đúng quy cách hoặc lỗi bảo quản, sàn sẽ hỗ trợ đổi mới hoặc hoàn tiền ngay trong vòng 24 giờ làm việc.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
