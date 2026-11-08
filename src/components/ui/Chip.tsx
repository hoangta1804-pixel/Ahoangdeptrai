import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  disabled?: boolean;
  outOfStock?: boolean;
  variant?: 'light' | 'dark';
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active = false,
  disabled = false,
  outOfStock = false,
  variant = 'light',
  className = '',
  ...props
}) => {
  // Pill 9999px, touch target >= 44px
  const baseClasses =
    'inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-small font-medium rounded-full transition-all duration-150 cursor-pointer border';

  let stateClasses = '';

  if (variant === 'light') {
    if (active) {
      stateClasses = 'bg-[#35705A] text-[#FAF7F0] border-[#35705A] shadow-sm font-semibold';
    } else if (outOfStock || disabled) {
      stateClasses =
        'bg-[#F3EEE2]/60 text-[#8F6A4D]/50 border-dashed border-[#8F6A4D]/30 line-through cursor-not-allowed';
    } else {
      stateClasses =
        'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:border-[#B8893B] hover:text-[#B8893B] active:bg-[#FAF7F0]';
    }
  } else {
    // dark variant for indigo showcase cabinet
    if (active) {
      stateClasses =
        'bg-[#B8893B] text-[#2F6650] border-[#B8893B] shadow-[0_2px_10px_rgba(184,137,59,0.3)] font-semibold';
    } else if (outOfStock || disabled) {
      stateClasses =
        'bg-[#4B8A71]/40 text-[#FAF7F0]/40 border-dashed border-[#FAF7F0]/20 line-through cursor-not-allowed';
    } else {
      stateClasses =
        'bg-[#4B8A71] text-[#FAF7F0] border-[#5E9A80] hover:border-[#CDA25A] hover:text-[#CDA25A] active:bg-[#35705A]';
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      className={`${baseClasses} ${stateClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
