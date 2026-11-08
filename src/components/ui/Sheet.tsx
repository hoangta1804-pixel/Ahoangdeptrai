import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  placement?: 'bottom' | 'right' | 'center';
  maxWidth?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  ariaLabel?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  placement = 'bottom',
  maxWidth = 'max-w-xl',
  showCloseButton = true,
  closeOnBackdrop = true,
  ariaLabel,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const prevActiveElement = useRef<HTMLElement | null>(null);

  // Esc key & Focus management
  useEffect(() => {
    if (isOpen) {
      prevActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        if (prevActiveElement.current) {
          prevActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Touch handlers for swipe down to dismiss on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (sheetRef.current && sheetRef.current.scrollTop <= 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart !== null) {
      const delta = e.touches[0].clientY - touchStart;
      if (delta > 0) {
        setTouchDelta(delta);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchDelta > 100) {
      onClose();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  return (
    <div
      role="region"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : ariaLabel || 'Hộp thoại'}
      className="fixed inset-0 z-50 flex flex-col justify-end lg:justify-center items-center"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2F6650]/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: touchDelta > 0 ? `translateY(${touchDelta}px)` : undefined,
          transition: touchDelta > 0 ? 'none' : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 w-full ${maxWidth} bg-[#FAF7F0] text-[#1B1B1F] shadow-2xl flex flex-col 
          rounded-t-[28px] lg:rounded-[24px] max-h-[90dvh] lg:max-h-[85vh] 
          overflow-hidden border border-[#E7DFCF]/60`}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="lg:hidden flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-[#8F6A4D]/30" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 pt-3 pb-3 border-b border-[#E7DFCF]/60">
            <div>
              {title && (
                <h3 className="font-serif text-[1.35rem] font-bold text-[#1B1B1F] tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-small text-[#6B4A32] mt-0.5">{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#6B4A32] hover:bg-[#F3EEE2] active:bg-[#E7DFCF] transition-colors -mr-2 cursor-pointer"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
};
