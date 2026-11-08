import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

export const Toast: React.FC<{
  toast: ToastMessage | null;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) {
      setProgress(100);
      return;
    }

    const duration = toast.durationMs ?? 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    setProgress(100);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md pointer-events-auto"
    >
      <div className="relative overflow-hidden bg-[#2F6650] text-[#FAF7F0] px-4 py-3 rounded-2xl shadow-2xl border border-[#5E9A80] flex items-center justify-between gap-3">
        {/* Progress bar at the bottom */}
        <div
          className="absolute bottom-0 left-0 h-[2.5px] bg-[#B8893B] transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />

        <div className="flex-1 text-small text-[#FAF7F0] font-medium leading-snug">
          {toast.text}
        </div>

        {toast.onAction && (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
            className="min-h-[44px] px-3 py-1.5 flex items-center gap-1.5 rounded-full bg-[#4B8A71] hover:bg-[#5E9A80] active:bg-[#B8893B] active:text-[#2F6650] text-[#CDA25A] text-small font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>{toast.actionLabel || 'Hoàn tác'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="min-h-[44px] min-w-[36px] flex items-center justify-center text-[#A5A5B2] hover:text-[#FAF7F0] cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
