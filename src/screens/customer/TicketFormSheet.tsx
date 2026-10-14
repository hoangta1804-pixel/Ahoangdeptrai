import { Camera } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';

/** Form khiếu nại – bản chuyển từ App.tsx cũ. Giai đoạn 2 làm lại theo mục 5.7, 5.8 (L11). */
export function TicketFormSheet({ onClose }: { onClose: () => void }) {
  const { showToast } = useUi();
  return (
    <BottomSheet
      title="Gửi Khiếu Nại Chất Lượng Nông Sản"
      onClose={onClose}
      footer={
        <button
          onClick={() => {
            onClose();
            showToast('Đã tạo Ticket khiếu nại! CSKH và HTX sẽ xử lý bồi hoàn trong 24h.');
          }}
          className="w-full rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700"
        >
          Gửi yêu cầu bồi hoàn
        </button>
      }
    >
      <div>
        <label className="text-[11px] font-semibold text-stone-600 block mb-1">Chọn đơn hàng khiếu nại:</label>
        <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900">
          <option value="LCA-65910">LCA-65910 • Mận Tam Hoa Bắc Hà</option>
          <option value="LCA-88219">LCA-88219 • Cá Hồi Vân Sa Pa</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-stone-600 block mb-1">Vấn đề gặp phải:</label>
        <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900">
          <option value="damaged_fruit">Quả bị giập nát / Hư hại do vận chuyển</option>
          <option value="wrong_weight">Sai trọng lượng so với bao bì</option>
          <option value="packaging_torn">Bao bì rách hỏng niêm phong</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-stone-600 block mb-1">Mô tả chi tiết:</label>
        <textarea
          rows={3}
          placeholder="Mô tả tình trạng nông sản khi bóc kiện hàng..."
          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
        ></textarea>
      </div>

      {/* Evidence Photo Upload Mock */}
      <div className="border-2 border-dashed border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center text-stone-400 hover:border-emerald-700 cursor-pointer">
        <Camera size={24} className="text-emerald-800 mb-1" />
        <span className="text-xs font-semibold text-stone-700">Tải ảnh chụp minh chứng tại chỗ</span>
        <span className="text-[10px] text-stone-400">Chụp rõ tem mác và vết giập quả</span>
      </div>

    </BottomSheet>
  );
}
