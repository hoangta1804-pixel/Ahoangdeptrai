/**
 * Bottom sheet dùng chung cho mọi màn: cùng độ rộng, đóng bằng nút X, bấm nền tối hoặc phím Esc.
 * Trên điện thoại trượt từ đáy; từ md trở lên hiện giữa màn hình.
 */
import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { DemoBand } from './DemoBand';

interface BottomSheetProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Nội dung cố định ở đáy sheet (nút hành động chính). */
  footer?: ReactNode;
  closeLabel?: string;
}

export function BottomSheet({ title, onClose, children, footer, closeLabel = 'Đóng' }: BottomSheetProps) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/60 md:justify-center md:p-6"
      onClick={onClose}
      role="presentation"
    >
      <DemoBand className="pointer-events-none absolute inset-x-0 top-0" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90dvh,calc(100dvh-3.5rem))] w-full max-w-[640px] flex-col rounded-t-[32px] bg-white shadow-2xl md:rounded-[32px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div id={titleId} className="min-w-0 flex-1 pt-2 text-base font-bold text-ink">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-stone-100 hover:text-stone-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && (
          <div className="border-t border-stone-100 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </div>
    </div>
  );
}
