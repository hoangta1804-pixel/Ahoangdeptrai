import React from 'react';

export const Skeleton: React.FC<{
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}> = ({ className = '', variant = 'rectangular' }) => {
  const variantClass = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4',
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[#E7DFCF]/60 ${variantClass} ${className}`}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#FAF7F0] rounded-[22px] p-3 border border-[#E7DFCF]/60 flex flex-col gap-3">
      {/* 4:5 image ratio placeholder */}
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#E7DFCF]/50 animate-pulse" />
      <div className="flex flex-col gap-2 p-1">
        <Skeleton variant="text" className="w-1/3 h-3" />
        <Skeleton variant="text" className="w-4/5 h-5" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton variant="text" className="w-24 h-6" />
          <Skeleton variant="circular" className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
};
