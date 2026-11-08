import React from 'react';

export type BadgeVariant =
  | 'season'
  | 'preorder'
  | 'outofstock'
  | 'gift'
  | 'lowstock'
  | 'success'
  | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-small px-3 py-1';

  const variantClasses = {
    season: 'bg-[#E8F2EC] text-[#204C39] border border-[#204C39]/20',
    preorder: 'bg-[#FEF7EA] text-[#B7791F] border border-[#B7791F]/25 font-medium',
    outofstock: 'bg-[#FDF1F1] text-[#A63D3D] border border-[#A63D3D]/20',
    gift: 'bg-[#FBF4E4] text-[#98702B] border border-[#98702B]/20 font-medium',
    lowstock: 'bg-[#FEF7EA] text-[#B7791F] border border-[#B7791F]/30 font-semibold',
    success: 'bg-[#EAF4EE] text-[#2F6B4F] border border-[#2F6B4F]/20',
    neutral: 'bg-[#F3EEE2] text-[#6B4A32] border border-[#8F6A4D]/20',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-sans rounded-full leading-none tracking-tight ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
