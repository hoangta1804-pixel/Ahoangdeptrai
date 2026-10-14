import { useState } from 'react';
import type { Category, Product } from '../domain/types';

/**
 * Ảnh sản phẩm (Giai đoạn 5, mục 9.4).
 * Nhóm chưa có quyền dùng ảnh sản phẩm, nên không dùng ảnh stock: chỉ hiện ảnh HTX tự tải lên,
 * còn lại là ảnh giữ chỗ SVG tự sinh, ghi tên sản phẩm và tô màu theo nhóm hàng.
 *
 * - `thumb`: ảnh nhỏ cạnh tên sản phẩm, chỉ có hình theo nhóm hàng (chữ ở cỡ này sẽ quá nhỏ để đọc).
 * - `card`: thẻ sản phẩm, có tên.
 * - `cover`: ảnh lớn ở trang chi tiết, có tên và dòng "Ảnh giữ chỗ" ở mép trên (mép dưới có nút Xem nguồn gốc).
 */
type Variant = 'thumb' | 'card' | 'cover';

const PALETTE: Record<Category, { bg: string; motif: string }> = {
  dry: { bg: '#6B4A2B', motif: '#C9A96E' },
  processed: { bg: '#74303B', motif: '#E2B8A0' },
  fresh: { bg: '#1F4D3A', motif: '#9CC5A1' },
};

export function ProductImage({ product, className = '', variant = 'thumb' }: { product: Product; className?: string; variant?: Variant }) {
  const [failed, setFailed] = useState(false);
  if (product.image && !failed) {
    return (
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  return <ProductPlaceholder product={product} variant={variant} className={className} />;
}

function ProductPlaceholder({ product, variant, className }: { product: Product; variant: Variant; className: string }) {
  const { bg, motif } = PALETTE[product.category];
  const lines = variant === 'thumb' ? [] : wrapName(product.name, 15);
  const lineHeight = 16;
  const firstY = 44 - ((lines.length - 1) * lineHeight) / 2;
  return (
    <div role="img" aria-label={`Ảnh giữ chỗ: ${product.name}`} className={`relative overflow-hidden ${className}`} style={{ backgroundColor: bg }}>
      {/* Lớp nền: dải núi, kéo giãn theo khung. */}
      <svg viewBox="0 0 160 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M0 100 L0 74 Q32 56 64 70 T128 64 T160 68 L160 100 Z" fill={motif} opacity="0.22" />
        <path d="M0 100 L0 86 Q40 72 80 84 T160 82 L160 100 Z" fill={motif} opacity="0.16" />
      </svg>
      {/* Lớp chữ và hình: giữ tỉ lệ, luôn nằm giữa khung. */}
      <svg
        viewBox={variant === 'thumb' ? '0 0 100 100' : '0 0 160 100'}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {variant === 'thumb' ? (
          <g transform="translate(30 24)" fill={motif}>
            <CategoryGlyph category={product.category} />
          </g>
        ) : (
          <>
            <text x="80" textAnchor="middle" fill="#FFFFFF" fontWeight="700" fontSize="13" style={{ fontFamily: 'inherit' }}>
              {lines.map((line, i) => (
                <tspan key={i} x="80" y={firstY + i * lineHeight + 4}>
                  {line}
                </tspan>
              ))}
            </text>
            {variant === 'cover' && (
              <text x="80" y="13" textAnchor="middle" fill="#FFFFFF" fillOpacity="0.85" fontSize="7" style={{ fontFamily: 'inherit' }}>
                Ảnh giữ chỗ – chờ HTX cung cấp ảnh
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

/** Hình đơn giản theo nhóm hàng, trong khung 40×40: lá (hàng khô), hũ (chế biến), quả (nông sản tươi). */
function CategoryGlyph({ category }: { category: Category }) {
  if (category === 'dry') {
    return (
      <>
        <path d="M20 2 C34 8 36 28 20 38 C4 28 6 8 20 2 Z" />
        <path d="M20 8 L20 34" stroke="#00000033" strokeWidth="1.5" />
      </>
    );
  }
  if (category === 'processed') {
    return (
      <>
        <rect x="7" y="3" width="26" height="7" rx="2" />
        <rect x="9" y="11" width="22" height="26" rx="5" />
      </>
    );
  }
  return (
    <>
      <circle cx="20" cy="24" r="14" />
      <path d="M20 10 C23 3 31 2 33 5 C28 9 24 10 20 10 Z" />
    </>
  );
}

/** Ngắt tên sản phẩm thành tối đa 3 dòng, mỗi dòng khoảng `max` ký tự. */
export function wrapName(name: string, max: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of name.split(/\s+/).filter(Boolean)) {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= max) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > 3) return [...lines.slice(0, 2), `${lines[2]}…`];
  return lines;
}
