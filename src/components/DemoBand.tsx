/** Câu cố định của dải demo (Giai đoạn 5, mục 9.2). */
export const DEMO_BAND_TEXT = 'Bản demo – dữ liệu mẫu. Thanh toán, giao hàng và OTP là mô phỏng.';

/**
 * Dải "Bản demo" hiện trên mọi màn hình: nằm trong header cố định của app,
 * và lặp lại ở đầu lớp phủ của bottom sheet để không bị che khi mở sheet.
 */
export function DemoBand({ className = '' }: { className?: string }) {
  return (
    <p role="note" className={`bg-amber-200 px-3 py-1 text-center text-xs font-semibold leading-snug text-amber-950 ${className}`}>
      {DEMO_BAND_TEXT}
    </p>
  );
}
