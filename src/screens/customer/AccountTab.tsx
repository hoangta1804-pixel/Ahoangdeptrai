import { ChevronRight, Lock, LogOut, MapPin, ShieldCheck, Store } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { useAppData } from '../../store/AppDataContext';

export function AccountTab() {
  const { addresses, refundBank } = useAppData();
  const { openModal, showToast, setRole } = useUi();

  return (
      <div className="p-4 space-y-4">
        {/* User Profile Header */}
        <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-900 text-white font-bold text-lg flex items-center justify-center border-2 border-emerald-700 shrink-0">
            NA
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 truncate">Nguyễn Văn An</h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                Thành viên VIP
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">SĐT chính chủ: 0988 234 567 (Đã khóa)</p>
            <button
              onClick={() => {
                openModal({ type: 'auth', step: 'otp' });
                showToast('Vui lòng xác thực OTP để đổi số điện thoại');
              }}
              className="text-[10px] text-emerald-700 font-semibold mt-1 hover:underline"
            >
              Đổi số điện thoại qua OTP mới →
            </button>
          </div>
        </div>

        {/* COD Refund Bank Account Card with Security Shield */}
        <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-700" />
            <h4 className="text-xs font-bold text-stone-900">Tài Khoản Nhận Hoàn Tiền Đơn COD</h4>
          </div>

          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/60 space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold block">Ngân hàng</span>
              <span className="font-bold text-stone-800">{refundBank.bankName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Số tài khoản</span>
                <span className="font-mono font-bold text-stone-900 tracking-wider tabular-nums">{refundBank.accountNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Chủ tài khoản</span>
                <span className="font-bold text-stone-900 uppercase">{refundBank.accountHolder}</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-stone-500 flex items-center gap-1.5 leading-tight">
            <Lock size={12} className="text-emerald-800 shrink-0" />
            <span>Thông tin được mã hóa bảo mật – Chỉ bộ phận Tài chính được phép truy cập khi bồi hoàn.</span>
          </p>
        </div>

        {/* Address Book Navigation Button */}
        <button
          onClick={() => openModal({ type: 'address_sheet' })}
          className="w-full bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
              <MapPin size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">Sổ Địa Chỉ Giao Hàng Hà Nội</h4>
              <p className="text-[11px] text-stone-400">{addresses.length}/10 địa chỉ đã lưu</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-stone-400" />
        </button>

        {/* Unified App Switch to Coop */}
        <div className="bg-gradient-to-r from-emerald-900 to-stone-900 rounded-3xl p-4 text-white shadow-md space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Dành cho Nhà Vườn & HTX</span>
          <h4 className="text-sm font-bold">Bạn là chủ Hợp tác xã tại Lào Cai?</h4>
          <p className="text-xs text-stone-300">Quản lý kho hàng, duyệt đơn và theo dõi dòng tiền đối soát minh bạch.</p>
          <button
            onClick={() => {
              setRole('coop');
              showToast('Đã chuyển sang giao diện Quản lý Gian hàng / HTX');
            }}
            className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Store size={16} />
            Chuyển sang Quản lý Gian hàng / HTX
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            if (window.confirm('Xác nhận đăng xuất khỏi thiết bị này?')) {
              openModal({ type: 'auth' });
              showToast('Đã đăng xuất và xóa phiên làm việc an toàn.');
            }
          }}
          className="w-full bg-stone-100 text-rose-700 hover:bg-rose-50 text-xs font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Đăng xuất tài khoản
        </button>
      </div>
  );
}
