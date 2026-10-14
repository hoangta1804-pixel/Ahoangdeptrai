import { Lock } from 'lucide-react';
import { useUi } from '../../app/UiContext';

export function CoopLegalTab() {
  const { showToast, setRole } = useUi();
  return (
    <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-stone-800 uppercase">Hồ Sơ Pháp Lý HTX</h4>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
          Đã Thẩm Định Hợp Lệ
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        <div>
          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Mã số thuế (Khóa cố định vĩnh viễn)</span>
          <div className="flex items-center gap-2 mt-0.5 bg-stone-100 px-3 py-2 rounded-xl text-stone-800 font-mono font-bold">
            <Lock size={14} className="text-stone-500" />
            <span>5300892144</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Tên pháp nhân HTX</span>
          <p className="font-bold text-stone-800 mt-0.5">Hợp tác xã Nông Nghiệp Hữu Cơ Bắc Hà</p>
        </div>

        <div>
          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Giấy chứng nhận liên kết</span>
          <div className="flex gap-2 mt-1">
            <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-xl text-[11px] font-semibold">
              OCOP 4 Sao (2024-889)
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-[11px] font-semibold">
              VietGAP Trồng trọt
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100 space-y-2">
        <button
          onClick={() => showToast('Đã gửi yêu cầu thẩm định lại hồ sơ pháp lý lên Admin Chất lượng')}
          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2.5 rounded-xl transition-colors"
        >
          Gửi yêu cầu Duyệt lại hồ sơ khi có thay đổi
        </button>
        <button
          onClick={() => setRole('customer')}
          className="w-full bg-emerald-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-800 transition-colors"
        >
          Quay về Giao diện Mua sắm
        </button>
      </div>
    </div>
  );
}
