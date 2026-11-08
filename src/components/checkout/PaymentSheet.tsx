import React from 'react';
import { Sheet } from '../ui/Sheet';
import { QrCode, CreditCard, Banknote, Check } from 'lucide-react';

export type PaymentMethod = 'cod' | 'online_qr' | 'online_card';

export interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  hasPreorder: boolean;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  isOpen,
  onClose,
  selectedMethod,
  onSelectMethod,
  hasPreorder,
}) => {
  const methods = [
    {
      id: 'cod' as PaymentMethod,
      title: 'Thanh toán khi nhận hàng (COD)',
      desc: hasPreorder
        ? 'Áp dụng cho tiền hàng có sẵn và số dư còn lại của hàng đặt trước khi nhận hàng. (Phần cọc 30% vẫn thanh toán online).'
        : 'Nhận hàng, kiểm tra đặc sản và thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.',
      icon: Banknote,
    },
    {
      id: 'online_qr' as PaymentMethod,
      title: 'Chuyển khoản ngân hàng (VietQR)',
      desc: 'Sau khi đặt hàng, quét mã VietQR bằng ứng dụng ngân hàng — số tiền và nội dung đã điền sẵn.',
      icon: QrCode,
    },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Phương thức thanh toán"
      subtitle="Gộp một giao dịch cho mọi khoản trả online của lần đặt"
      maxWidth="max-w-md"
    >
      <div className="space-y-3 py-1">
        {methods.map((m) => {
          const isSelected = selectedMethod === m.id;
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              onClick={() => {
                onSelectMethod(m.id);
                onClose();
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                isSelected
                  ? 'bg-[#35705A] text-[#FAF7F0] border-[#35705A] shadow-sm'
                  : 'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:border-[#B8893B]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-[#B8893B] text-[#2F6650]' : 'bg-[#F3EEE2] text-[#8F6A4D]'
                }`}
              >
                <Icon size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-small">{m.title}</h4>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#B8893B] text-[#2F6650] flex items-center justify-center">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-small opacity-85 mt-1 leading-snug">{m.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
};
