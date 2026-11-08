import React, { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Voucher } from '../../mock/types';
import { mockVouchers } from '../../mock/vouchers';
import { formatMoney } from '../../lib/pricing';
import { Tag, Check, AlertCircle } from 'lucide-react';

export interface VoucherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoucherCode?: string;
  orderSubtotal: number;
  onApplyVoucher: (v: Voucher | null) => void;
}

export const VoucherSheet: React.FC<VoucherSheetProps> = ({
  isOpen,
  onClose,
  currentVoucherCode,
  orderSubtotal,
  onApplyVoucher,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApply = (v: Voucher) => {
    if (!v.isActive) {
      setErrorMessage('Mã ưu đãi này đã hết hạn hoặc không còn áp dụng.');
      return;
    }
    if (orderSubtotal < v.minOrderValue) {
      setErrorMessage(
        `Đơn hàng cần tối thiểu ${formatMoney(v.minOrderValue)} để áp dụng mã này (hiện có ${formatMoney(
          orderSubtotal
        )}).`
      );
      return;
    }

    onApplyVoucher(v);
    setErrorMessage(null);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = mockVouchers.find((v) => v.code.toUpperCase() === inputCode.trim().toUpperCase());
    if (!found) {
      setErrorMessage('Mã ưu đãi không tồn tại.');
      return;
    }
    handleApply(found);
  };

  const handleRemoveVoucher = () => {
    onApplyVoucher(null);
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Chọn mã ưu đãi"
      subtitle="Tối đa 1 mã ưu đãi cho mỗi lần đặt"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 py-1">
        {/* Nhập mã tự do */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập mã ưu đãi..."
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value.toUpperCase());
              setErrorMessage(null);
            }}
            className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] outline-none text-small font-mono bg-white uppercase"
          />
          <Button variant="primary" size="sm" type="submit">
            Áp dụng
          </Button>
        </form>

        {errorMessage && (
          <div className="p-3 bg-[#FDF1F1] text-[#A63D3D] text-small rounded-xl font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Danh sách mã mẫu sẵn có */}
        <div className="space-y-2.5 pt-1">
          <span className="text-caption font-semibold text-[#6B4A32] uppercase tracking-wider block">
            Mã ưu đãi dành cho bạn:
          </span>

          {mockVouchers.map((v) => {
            const isApplied = currentVoucherCode === v.code;
            const isEligible = v.isActive && orderSubtotal >= v.minOrderValue;

            return (
              <div
                key={v.code}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isApplied
                    ? 'bg-[#35705A] text-[#FAF7F0] border-[#35705A]'
                    : isEligible
                    ? 'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:border-[#B8893B]'
                    : 'bg-[#F3EEE2]/50 text-[#8F6A4D]/60 border-dashed border-[#E7DFCF]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-small text-[#B8893B]">
                      {v.code}
                    </span>
                    {!v.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FDF1F1] text-[#A63D3D] font-semibold">
                        Hết hạn
                      </span>
                    )}
                  </div>
                  <p className="text-small leading-tight">
                    {v.discountType === 'percent'
                      ? `Giảm ${v.value}% (Tối đa ${formatMoney(v.maxDiscount || 0)})`
                      : `Giảm trực tiếp ${formatMoney(v.value)}`}
                  </p>
                  <span className="text-caption text-[#8F6A4D] block">
                    Đơn tối thiểu {formatMoney(v.minOrderValue)}
                  </span>
                </div>

                <div>
                  {isApplied ? (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="px-3 py-1.5 rounded-full bg-[#A63D3D] text-white text-xs font-semibold cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!isEligible}
                      onClick={() => handleApply(v)}
                      className="px-3 py-1.5 rounded-full bg-[#B8893B] text-[#2F6650] text-xs font-semibold hover:bg-[#CDA25A] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Dùng mã
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
};
