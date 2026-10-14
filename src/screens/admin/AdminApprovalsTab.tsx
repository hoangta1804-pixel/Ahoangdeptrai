import { useUi } from '../../app/UiContext';

export function AdminApprovalsTab() {
  const { showToast } = useUi();
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-stone-900">Hồ Sơ HTX Mới Nộp Thẩm Định</span>
          <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-md">
            Đang khóa chỉnh sửa
          </span>
        </div>

        <div className="text-xs space-y-1">
          <p className="font-bold text-stone-800">HTX Dược Liệu & Cây Ăn Quả Sa Pa</p>
          <p className="text-stone-500 text-[11px]">MST: 5300998811 • Đại diện: Má A Chơ</p>
          <div className="flex gap-2 mt-1">
            <span className="bg-stone-100 text-stone-700 text-[10px] px-2 py-1 rounded-md">
              📄 Giấy phép ĐKKD: Đầy đủ
            </span>
            <span className="bg-sky-50 text-sky-800 text-[10px] px-2 py-1 rounded-md font-semibold">
              🌿 VietGAP: Còn hiệu lực
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
          <button
            onClick={() => {
              showToast('Đã phê duyệt! Hệ thống gửi Link/OTP kích hoạt hiệu lực 24h cho HTX tự đặt mật khẩu.');
            }}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl transition-colors"
          >
            Phê duyệt HTX
          </button>
          <button
            onClick={() => {
              const reason = prompt('Nhập lý do từ chối hồ sơ:') || 'Giấy phép hết hạn hiệu lực';
              showToast(`Đã từ chối hồ sơ với lý do: ${reason}`);
            }}
            className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold py-2 rounded-xl transition-colors"
          >
            Từ chối (Cần lý do)
          </button>
        </div>
      </div>
    </div>
  );
}
