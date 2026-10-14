import { useEffect, useState } from 'react';
import { AlertTriangle, ScanFace } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../BottomSheet';

/** Đăng nhập / đăng ký / OTP – bản chuyển từ App.tsx cũ. Giai đoạn 3 làm lại theo mục 5.9. */
export function AuthSheet({ initialStep = 'login', onClose }: { initialStep?: 'login' | 'register' | 'otp'; onClose: () => void }) {
  const { openModal, closeModal, showToast } = useUi();
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'otp'>(initialStep);
  const [authPhone, setAuthPhone] = useState('0988234567');
  const [authPassword, setAuthPassword] = useState('');
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const [registerType, setRegisterType] = useState<'customer' | 'coop'>('customer');

  useEffect(() => {
    if (lockCountdown <= 0) return;
    const t = setInterval(() => setLockCountdown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [lockCountdown > 0]);

  useEffect(() => {
    if (authStep !== 'otp' || otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [authStep, otpTimer > 0]);

  const triggerFaceIDLogin = () => {
    openModal({ type: 'face_id_scan' });
    setTimeout(() => {
      closeModal();
      showToast('Xác thực Face ID thành công! Chào mừng trở lại.');
    }, 1800);
  };

  return (
    <BottomSheet title={<span className="text-sm text-emerald-900">Đặc Sản Số Lào Cai</span>} onClose={onClose}>
      {/* Login View */}
      {authStep === 'login' && (
        <div className="space-y-3.5">
          <div className="text-center">
            <h3 className="text-base font-bold text-stone-900">Đăng Nhập Tài Khoản</h3>
            <p className="text-xs text-stone-500 mt-0.5">Tinh hoa Đặc sản Lào Cai – Giao tươi tận cửa tại Hà Nội</p>
          </div>

          {/* 15-minute lockout indicator if failed 5 times */}
          {lockCountdown > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-rose-800 text-xs text-center space-y-1">
              <AlertTriangle size={18} className="mx-auto text-rose-600" />
              <span className="font-bold block">Tài khoản bị tạm khóa 15 phút</span>
              <span className="text-[11px] font-mono tabular-nums">
                Vui lòng thử lại sau: {Math.floor(lockCountdown / 60)}:{(lockCountdown % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <input
              type="tel"
              value={authPhone}
              onChange={(e) => setAuthPhone(e.target.value)}
              placeholder="Số điện thoại"
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-900"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Mật khẩu"
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-900"
            />
          </div>

          {/* Biometric Face ID Button */}
          <div className="flex justify-center py-1">
            <button
              onClick={triggerFaceIDLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all border border-stone-200"
            >
              <ScanFace size={18} className="text-emerald-700" />
              <span>Đăng nhập bằng Face ID / Vân tay</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (authPassword !== 'LaoCai@2026') {
                setFailedLoginAttempts((p) => p + 1);
                if (failedLoginAttempts >= 4) {
                  setLockCountdown(900); // 15 minutes
                  showToast('Đã nhập sai 5 lần. Tạm khóa đăng nhập 15 phút.');
                } else {
                  showToast('Số điện thoại hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
                }
                return;
              }
              onClose();
              showToast('Đăng nhập thành công!');
            }}
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
          >
            Đăng Nhập
          </button>

          {/* Simulation Quick-Test Bar */}
          <div className="pt-2 border-t border-stone-100 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase block text-center">Kiểm thử kịch bản bảo mật:</span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <button
                onClick={() => showToast('Số điện thoại hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.')}
                className="bg-stone-100 p-1.5 rounded-lg text-stone-700 font-medium"
              >
                Thử sai MK
              </button>
              <button
                onClick={() => {
                  setLockCountdown(900);
                  showToast('Đã khóa đăng nhập 15 phút.');
                }}
                className="bg-stone-100 p-1.5 rounded-lg text-rose-700 font-medium"
              >
                Khóa 15 phút
              </button>
              <button
                onClick={() => openModal({ type: 'silent_locked' })}
                className="bg-stone-100 p-1.5 rounded-lg text-rose-800 font-bold"
              >
                Silent Push Khóa
              </button>
            </div>
          </div>

          <div className="flex justify-between text-xs text-stone-500 pt-1">
            <button onClick={() => setAuthStep('otp')} className="hover:underline">
              Đăng nhập qua OTP
            </button>
            <button onClick={() => setAuthStep('register')} className="text-emerald-800 font-bold hover:underline">
              Đăng ký tài khoản mới
            </button>
          </div>
        </div>
      )}

      {/* OTP View */}
      {authStep === 'otp' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-base font-bold text-stone-900">Xác Thực Mã OTP 6 Số</h3>
            <p className="text-xs text-stone-500 mt-0.5">Mã OTP đã gửi về số {authPhone}</p>
            <span className="text-xs font-mono font-bold text-emerald-800 tabular-nums">
              Hiệu lực còn: {otpTimer}s
            </span>
          </div>

          {/* iOS QuickType autofill bar */}
          <button
            onClick={() => {
              setOtpValue(['6', '8', '2', '9', '1', '0']);
              showToast('Đã tự điền mã OTP từ tin nhắn hệ thống');
            }}
            className="w-full bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl p-2 text-xs text-stone-700 flex items-center justify-center gap-1.5 font-medium transition-colors"
          >
            <span>Từ Tin nhắn:</span>
            <strong className="text-emerald-900">Mã OTP là 682910</strong>
            <span className="text-[10px] text-stone-400">(Chạm để điền)</span>
          </button>

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center gap-2">
            {otpValue.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                readOnly
                className="w-11 h-12 text-center text-lg font-bold border border-stone-300 rounded-xl bg-stone-50 text-stone-900"
              />
            ))}
          </div>

          <button
            onClick={() => {
              onClose();
              showToast('Xác thực OTP thành công! Chào mừng bạn.');
            }}
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
          >
            Xác Nhận & Tiếp Tục
          </button>
        </div>
      )}

      {/* Register View */}
      {authStep === 'register' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-medium">
            <button
              onClick={() => setRegisterType('customer')}
              className={`py-1.5 rounded-xl ${registerType === 'customer' ? 'bg-white font-bold shadow-xs' : 'text-stone-500'}`}
            >
              Khách hàng
            </button>
            <button
              onClick={() => setRegisterType('coop')}
              className={`py-1.5 rounded-xl ${registerType === 'coop' ? 'bg-white font-bold shadow-xs' : 'text-stone-500'}`}
            >
              Đối tác HTX
            </button>
          </div>

          {registerType === 'customer' ? (
            <div className="space-y-2">
              <input type="text" placeholder="Họ và tên" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
              <input type="tel" placeholder="Số điện thoại" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
              <input type="password" placeholder="Mật khẩu (8-32 ký tự, hoa, thường, số, ký tự đặc biệt)" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <input type="checkbox" defaultChecked className="rounded text-emerald-800" />
                <span>Đồng ý với quy chế bảo chứng nguồn gốc</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input type="text" placeholder="Mã số thuế HTX (Kiểm tra duy nhất)" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono" />
              <input type="text" placeholder="Tên Hợp tác xã" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-dashed border-stone-300 rounded-xl p-2 text-center text-[10px] text-stone-500 cursor-pointer">
                  📷 Chụp Giấy phép KD
                </div>
                <div className="border border-dashed border-stone-300 rounded-xl p-2 text-center text-[10px] text-stone-500 cursor-pointer">
                  📷 Chụp OCOP/VietGAP
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setAuthStep('otp');
              showToast('Mã OTP xác thực đã được gửi về số điện thoại.');
            }}
            className="w-full bg-emerald-900 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
          >
            Đăng Ký & Nhận OTP
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
