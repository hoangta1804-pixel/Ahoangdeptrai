import React, { useEffect, useState } from 'react';
import { Mountain } from 'lucide-react';

export interface ProductPhotoProps {
  /** Các nguồn ảnh thử lần lượt; ảnh lỗi sẽ tự chuyển sang nguồn kế tiếp. */
  sources: string[];
  alt: string;
  emoji?: string;
  caption?: string;
  className?: string;
  fit?: 'cover' | 'contain';
}

/** Ảnh sản phẩm dùng chung (thẻ, chi tiết, giỏ…) + placeholder thống nhất khi chưa có ảnh. */
export const ProductPhoto: React.FC<ProductPhotoProps> = ({ sources, alt, emoji, caption, className = '', fit = 'cover' }) => {
  const key = sources.join('|');
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [key]);
  const src = sources[idx];

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setIdx((i) => i + 1)}
        className={`w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4 bg-gradient-to-br from-[#EFE8D6] via-[#F6F1E4] to-[#DDE8DF] text-[#35705A] ${className}`}
    >
      <Mountain size={34} strokeWidth={1.4} className="text-[#B8893B]" aria-hidden="true" />
      {emoji && <span className="text-2xl" aria-hidden="true">{emoji}</span>}
      <span className="font-serif font-semibold text-sm leading-snug line-clamp-3">{caption || alt}</span>
      <span className="text-xs tracking-wider uppercase text-[#8F6A4D]">Ảnh sắp cập nhật</span>
    </div>
  );
};
