import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Kích thước nút: luôn đảm bảo min touch target >= 44px trên mobile
    const sizeClasses = {
      sm: 'min-h-[44px] h-[44px] px-4 text-small font-medium',
      md: 'min-h-[44px] h-[48px] px-6 text-body font-semibold',
      lg: 'min-h-[52px] h-[52px] px-8 text-body font-bold',
      icon: 'min-h-[44px] min-w-[44px] w-[44px] h-[44px] p-2 flex items-center justify-center',
    }[size];

    // Màu sắc theo tôn chỉ: Nút chính DUY NHẤT dùng Brass-500, chữ tương phản cao (#2F6650)
    const variantClasses = {
      primary:
        'bg-[#B8893B] text-[#2F6650] hover:bg-[#CDA25A] active:bg-[#98702B] shadow-[0_4px_16px_rgba(184,137,59,0.3)] disabled:bg-[#E7DFCF] disabled:text-[#8F6A4D] disabled:shadow-none',
      secondary:
        'bg-[#35705A] text-[#FAF7F0] hover:bg-[#4B8A71] active:bg-[#2F6650] disabled:bg-[#33333A] disabled:text-[#767682]',
      outline:
        'border border-[#B8893B] text-[#B8893B] bg-transparent hover:bg-[#B8893B]/10 active:bg-[#B8893B]/20 disabled:border-[#C2A58D] disabled:text-[#8F6A4D]',
      ghost:
        'bg-transparent text-[#1B1B1F] hover:bg-[#FAF7F0] active:bg-[#E7DFCF] disabled:text-[#767682]',
      danger:
        'bg-[#A63D3D] text-white hover:bg-[#8F3333] active:bg-[#722727] disabled:bg-[#E7DFCF] disabled:text-[#8F6A4D]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
