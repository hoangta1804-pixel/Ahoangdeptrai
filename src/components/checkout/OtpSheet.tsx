import React, { useState, useEffect, useRef } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { useAuth } from '../../stores/authStore';
import { ShieldCheck, ArrowRight, RotateCcw, Smartphone } from 'lucide-react';

export interface OtpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OtpSheet: React.FC<OtpSheetProps> = ({ isOpen, onClose, onSuccess }) => {
  const { otpPhone, otpCountdown, otpResendCount, verifyOtp, resendOtp } = useAuth();
  const [phone, setPhone] = useState(otpPhone || '0912345678');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(otpPhone ? 'otp' : 'phone');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
    }
  }, [isOpen, otpPhone]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (10 số).');
      return;
    }
    setStep('otp');
    setErrorMessage(null);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/[^\d]/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setErrorMessage(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Tự động kiểm tra khi nhập đủ 6 số
    if (updated.every((d) => d !== '') && index === 5) {
      const code = updated.join('');
      const res = verifyOtp(code);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message || 'Mã xác thực không hợp lệ.');
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    const res = resendOtp();
    if (!res.success) {
      setErrorMessage(res.message || 'Không thể gửi lại mã.');
    } else {
      setErrorMessage(null);
    }
  };

  const handleFillDemoOtp = () => {
    const demo = ['1', '2', '3', '4', '5', '6'];
    setOtpDigits(demo);
    const res = verifyOtp('123456');
    if (res.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'phone' ? 'Xác thực tài khoản' : 'Nhập mã xác thực OTP'}
      subtitle={
        step === 'phone'
          ? 'Nhập số điện thoại để tiếp tục đặt hàng và đồng bộ giỏ'
          : `Mã xác thực đã gửi tới số ${phone}`
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-5 py-2">
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone-input" className="block text-small font-semibold text-[#1B1B1F] mb-1.5">
                Số điện thoại của bạn:
              </label>
              <div className="relative">
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^\d]/g, ''));
                    setErrorMessage(null);
                  }}
                  className="w-full min-h-[48px] px-4 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] focus:ring-2 focus:ring-[#B8893B]/20 outline-none text-body font-mono"
                  autoFocus
                />
                <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8F6A4D]" size={18} />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FDF1F1] text-[#A63D3D] text-small rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <Button variant="primary" size="lg" className="w-full" type="submit" rightIcon={<ArrowRight size={18} />}>
              Tiếp tục
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between gap-2">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] focus:ring-2 focus:ring-[#B8893B]/20 outline-none bg-white text-[#1B1B1F]"
                />
              ))}
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FDF1F1] text-[#A63D3D] text-small rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Đếm ngược và Gửi lại */}
            <div className="flex items-center justify-between text-small text-[#6B4A32] pt-1">
              <span>Hiệu lực mã:</span>
              <span className="font-mono font-semibold text-[#B8893B]">
                {Math.floor(otpCountdown / 60)}:{String(otpCountdown % 60).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={otpCountdown > 0 || otpResendCount >= 3}
                onClick={handleResend}
                className="text-small font-semibold text-[#35705A] hover:text-[#B8893B] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Gửi lại mã</span>
              </button>

              {/* Nút bấm nhanh cho Demo */}
              <button
                type="button"
                onClick={handleFillDemoOtp}
                className="text-caption text-[#CDA25A] hover:underline cursor-pointer"
              >
                Điền nhanh mã mẫu (123456)
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};
