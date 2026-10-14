import { useState } from 'react';
import type { Product } from '../domain/types';

/**
 * Ảnh sản phẩm. Không tải được ảnh (mất mạng, chặn CDN) thì hiện khối màu kèm tên sản phẩm.
 * Giai đoạn 5 thay bằng ảnh giữ chỗ SVG tự sinh.
 */
export function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !product.image) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br p-2 text-center text-xs font-bold text-white ${product.fallbackGradient} ${className}`}
        role="img"
        aria-label={product.name}
      >
        <span className="line-clamp-3">{product.name}</span>
      </div>
    );
  }
  return (
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
