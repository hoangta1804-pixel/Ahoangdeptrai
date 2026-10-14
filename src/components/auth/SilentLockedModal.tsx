import { Lock, Phone } from 'lucide-react';

const accountLockReason = 'Phát hiện giao dịch bất thường vi phạm quy chế bảo chứng nguồn gốc.';

/** Màn khoá tài khoản – bản chuyển từ App.tsx cũ. */
export function SilentLockedModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-md z-50 flex flex-col justify-center items-center p-6 text-center text-white">
      <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
        <Lock size={32} />
      </div>

      <h3 className="text-lg font-bold">Tài Khoản Đã Bị Khóa Truy Cập</h3>
      <p className="text-xs text-stone-300 mt-2 leading-relaxed">
        Lý do khóa từ Cơ quan Quản trị:
      </p>
      <div className="bg-stone-800/90 rounded-2xl p-3 border border-stone-700 text-xs text-rose-300 font-medium my-3">
        "{accountLockReason}"
      </div>
      <p className="text-[11px] text-stone-400 mb-6">
        Phiên đăng nhập trên thiết bị này đã bị hủy bỏ để đảm bảo an toàn giao dịch.
      </p>

      <a
        href="tel:19006868"
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg mb-2"
      >
        <Phone size={16} />
        Hotline Hỗ Trợ CSKH: 1900 6868
      </a>

      <button
        onClick={onClose}
        className="text-xs text-stone-400 hover:text-white underline mt-2"
      >
        Đóng màn hình thông báo (Mở khóa thử nghiệm)
      </button>
    </div>
  );
}
