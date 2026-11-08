import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  onExceedMax?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  min = 1,
  max = 999,
  onChange,
  onExceedMax,
  disabled = false,
  size = 'md',
}) => {
  const handleDecrement = () => {
    if (disabled || value <= min) return;
    onChange(value - 1);
  };

  const handleIncrement = () => {
    if (disabled) return;
    if (value >= max) {
      onExceedMax?.();
      return;
    }
    onChange(value + 1);
  };

  const btnSizeClass = size === 'sm' ? 'w-[38px] h-[38px]' : 'min-w-[44px] min-h-[44px] w-[44px] h-[44px]';

  return (
    <div
      role="group"
      aria-label="Điều chỉnh số lượng"
      className="inline-flex items-center bg-[#FAF7F0] border border-[#E7DFCF] rounded-full p-0.5 shadow-xs"
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={handleDecrement}
        aria-label="Giảm số lượng"
        className={`${btnSizeClass} flex items-center justify-center rounded-full text-[#1B1B1F] hover:bg-[#F3EEE2] active:bg-[#E7DFCF] disabled:text-[#8F6A4D]/40 disabled:cursor-not-allowed transition-colors cursor-pointer`}
      >
        <Minus size={16} />
      </button>

      <span
        aria-live="polite"
        className="px-3 min-w-[36px] text-center font-sans font-semibold text-[#1B1B1F] text-body tabular-nums"
      >
        {value}
      </span>

      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={handleIncrement}
        aria-label="Tăng số lượng"
        className={`${btnSizeClass} flex items-center justify-center rounded-full text-[#1B1B1F] hover:bg-[#F3EEE2] active:bg-[#E7DFCF] disabled:text-[#8F6A4D]/40 disabled:cursor-not-allowed transition-colors cursor-pointer`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
