import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, QrCode, AlertTriangle } from 'lucide-react';
import { formatMoney } from '../../lib/pricing';
import { buildVietQrPayload, configProblem, shopAccount, transferNote, vietQrConfigured } from '../../lib/vietqr';

export interface VietQrPaymentProps {
  amount: number;
  /** Mã đơn — dùng làm nội dung chuyển khoản để đối soát. */
  orderCode: string;
  title?: string;
}

const CopyRow: React.FC<{ label: string; value: string; display?: string }> = ({ label, value, display }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#E7DFCF] last:border-0">
      <div className="min-w-0">
        <dt className="text-caption text-[#6B4A32]">{label}</dt>
        <dd className="font-semibold text-[#1B1B1F] break-all">{display ?? value}</dd>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            /* trình duyệt chặn clipboard */
          }
        }}
        aria-label={`Sao chép ${label}`}
        className="shrink-0 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[#2A6F50] hover:bg-[#F3EEE2] cursor-pointer"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </div>
  );
};

/** Mã VietQR chứa sẵn số tiền & nội dung — quét bằng bất kỳ ứng dụng ngân hàng nào. */
export const VietQrPayment: React.FC<VietQrPaymentProps> = ({ amount, orderCode, title = 'Quét mã để chuyển khoản' }) => {
  const note = useMemo(() => transferNote(orderCode), [orderCode]);
  const configured = vietQrConfigured(shopAccount);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    setQr('');
    setError('');
    try {
      const payload = buildVietQrPayload(shopAccount, Math.round(amount), note);
      import('qrcode')
        .then((m) => m.toDataURL(payload, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#1a2b20', light: '#ffffff' } }))
        .then((src) => !cancelled && setQr(src))
        .catch(() => !cancelled && setError('Không tạo được mã QR. Bạn vẫn có thể chuyển khoản theo thông tin bên dưới.'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tạo được mã QR.');
    }
    return () => {
      cancelled = true;
    };
  }, [configured, amount, note]);

  if (!configured) {
    return (
      <div role="note" className="p-4 rounded-2xl border border-[#B7791F]/40 bg-[#FEF7EA] text-small text-[#6B4A32] flex gap-2">
        <AlertTriangle size={18} className="shrink-0 text-[#B7791F]" />
        <span>
          Cửa hàng chưa cấu hình tài khoản nhận chuyển khoản nên chưa tạo được mã QR.
          {import.meta.env.DEV && <> (Quản trị: {configProblem()} Sửa trong <code>.env.local</code> rồi chạy lại.)</>}
        </span>
      </div>
    );
  }

  return (
    <section aria-labelledby="vietqr-heading" className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E7DFCF] shadow-xs">
      <h2 id="vietqr-heading" className="flex items-center gap-2 font-serif font-bold text-body text-[#1B1B1F] mb-4">
        <QrCode size={20} className="text-[#2A6F50]" /> {title}
      </h2>
      <div className="grid gap-5 sm:grid-cols-[240px_minmax(0,1fr)] items-start">
        <div className="mx-auto w-60 max-w-full aspect-square rounded-xl border border-[#E7DFCF] bg-white p-2 flex items-center justify-center">
          {qr ? (
            <img
              src={qr}
              width={240}
              height={240}
              alt={`Mã VietQR chuyển khoản ${formatMoney(amount)}, nội dung ${note}`}
              className="w-full h-auto"
            />
          ) : (
            <p role="status" className="text-small text-[#6B4A32] text-center p-3">{error ? 'QR chưa khả dụng' : 'Đang tạo mã QR…'}</p>
          )}
        </div>
        <div className="min-w-0">
          <dl className="text-small">
            <CopyRow label="Số tiền" value={String(Math.round(amount))} display={formatMoney(amount)} />
            <CopyRow label="Nội dung chuyển khoản" value={note} />
            <CopyRow label="Số tài khoản" value={shopAccount.accountNo} />
            {shopAccount.accountName && (
              <div className="py-2 border-b border-[#E7DFCF]">
                <dt className="text-caption text-[#6B4A32]">Chủ tài khoản</dt>
                <dd className="font-semibold text-[#1B1B1F]">{shopAccount.accountName}</dd>
              </div>
            )}
            {shopAccount.bankName && (
              <div className="py-2">
                <dt className="text-caption text-[#6B4A32]">Ngân hàng</dt>
                <dd className="font-semibold text-[#1B1B1F]">{shopAccount.bankName}</dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-caption text-[#6B4A32]">
            Mở ứng dụng ngân hàng → Quét QR. Số tiền và nội dung đã điền sẵn, vui lòng <strong>không sửa nội dung</strong> để
            cửa hàng đối soát đúng đơn.
          </p>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-small text-[#A63D3D]">{error}</p>}
    </section>
  );
};
