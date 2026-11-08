import React from 'react';
import { Plus, MapPin, Box } from 'lucide-react';
import { Product, Variant } from '../../mock/types';
import { getDefaultVariant } from '../../lib/variants';
import { formatMoney } from '../../lib/pricing';
import { ProductPhoto } from './ProductPhoto';
import { productImageSources, productEmoji } from '../../lib/productImages';
import { Badge, BadgeVariant } from '../ui/Badge';
import { checkCanAddToCart } from '../../lib/stock';

export interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  onQuickAdd: (product: Product, variant: Variant) => void;
  onOpenQuickAddSheet: (product: Product) => void;
  themeVariant?: 'dark' | 'light';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onQuickAdd,
  onOpenQuickAddSheet,
  themeVariant = 'light',
}) => {
  const defaultVariant = getDefaultVariant(product);
  const variants = product.variants || [];
  const hasMultipleVariants = variants.length > 1;

  // Kiểm tra dải giá
  const prices = variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const isPriceRange = minPrice !== maxPrice;

  // Xác định trạng thái chính của sản phẩm
  const isOutOfStock = variants.every((v) => v.status === 'out_of_stock' || (v.stock === 0 && (!v.preorderSlots || v.preorderSlots === 0)));
  const isPreorder = !isOutOfStock && variants.some((v) => v.status === 'preorder');
  const has3D = product.media.some((m) => m.type === 'model3d' && m.approvalStatus === 'approved');

  // Xác định badge nhãn trạng thái
  let badgeLabel = '';
  let badgeType: BadgeVariant = 'neutral';
  if (isOutOfStock) {
    badgeLabel = 'Tạm hết hàng';
    badgeType = 'outofstock';
  } else if (isPreorder) {
    badgeLabel = 'Đặt trước';
    badgeType = 'preorder';
  } else if (product.themeMappings.some((t) => t.themeId === 'in_season')) {
    badgeLabel = 'Theo mùa';
    badgeType = 'season';
  } else if (product.themeMappings.some((t) => t.themeId === 'gift')) {
    badgeLabel = 'Quà biếu';
    badgeType = 'gift';
  }

  // Ảnh chính
  const photoSources = productImageSources(product, defaultVariant?.imageUrl);

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!defaultVariant || isOutOfStock) return;

    if (hasMultipleVariants) {
      onOpenQuickAddSheet(product);
    } else {
      onQuickAdd(product, defaultVariant);
    }
  };

  const cardBgClass =
    themeVariant === 'dark'
      ? 'bg-[#357F5E] text-[#FAF7F0] border-[#5A9A7B] hover:border-[#B8893B]/60 shadow-[0_4px_24px_rgba(0,0,0,0.25)]'
      : 'bg-[#FAF7F0] text-[#1B1B1F] border-[#E7DFCF]/80 hover:border-[#B8893B]/50 shadow-[0_4px_20px_rgba(47, 102, 80,0.06)]';

  const titleColorClass = themeVariant === 'dark' ? 'text-[#FAF7F0]' : 'text-[#1B1B1F]';
  const regionColorClass = themeVariant === 'dark' ? 'text-[#F0D9A9]' : 'text-[#6B4A32]';

  return (
    <article
      onClick={() => onOpenDetail(product)}
      className={`group relative flex flex-col rounded-[22px] p-3 border transition-all duration-300 cursor-pointer ${cardBgClass}`}
    >
      {/* Khung ảnh tỷ lệ 4:5 */}
      <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF7F0]/10 to-[#FAF7F0]/5 overflow-hidden">
        <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-500">
          <ProductPhoto sources={photoSources} alt={product.name} emoji={productEmoji(product.category)} caption={defaultVariant?.label} />
        </div>

        {/* Badge trạng thái ở góc trên bên trái */}
        {badgeLabel && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge variant={badgeType}>{badgeLabel}</Badge>
          </div>
        )}

        {/* Badge 3D ở góc trên bên phải */}
        {has3D && (
          <div
            className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2F6650]/80 text-[#CDA25A] text-xs font-mono font-semibold border border-[#B8893B]/40 shadow-xs"
            title="Có mô hình 3D"
          >
            <Box size={11} />
            <span>3D</span>
          </div>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex flex-col flex-1 justify-between pt-3 pb-1 px-1 gap-2">
        <div>
          {/* Vùng đặc sản */}
          <span className={`inline-flex items-center gap-1 text-caption font-medium tracking-wide uppercase ${regionColorClass}`}>
            <MapPin size={11} aria-hidden="true" />
            {product.region}
          </span>

          {/* Tên sản phẩm serif */}
          <h3
            className={`font-serif text-[1.125rem] font-bold leading-snug line-clamp-2 mt-0.5 group-hover:text-[#B8893B] transition-colors ${titleColorClass}`}
          >
            {product.name}
          </h3>
        </div>

        {/* Giá và nút thêm nhanh */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="flex flex-col">
            <span className={`text-caption font-medium leading-none mb-0.5 ${themeVariant === 'dark' ? 'text-[#DCE6DF]' : 'text-[#6B4A32]'}`}>
              {isPriceRange ? 'Từ' : defaultVariant?.label || 'Giá'}
            </span>
            <div className={`price-tag text-[1.125rem] ${themeVariant === 'dark' ? '!text-[#F0D9A9]' : ''}`}>
              {formatMoney(defaultVariant ? defaultVariant.price : minPrice)}
            </div>
          </div>

          {/* Nút thêm nhanh tròn brass >= 44px */}
          {!isOutOfStock ? (
            <button
              type="button"
              onClick={handlePlusClick}
              aria-label={`Thêm ${product.name} vào giỏ`}
              className="min-h-[44px] min-w-[44px] w-[44px] h-[44px] rounded-full bg-[#B8893B] text-[#2F6650] hover:bg-[#CDA25A] active:bg-[#98702B] active:scale-95 shadow-[0_2px_10px_rgba(184,137,59,0.3)] flex items-center justify-center transition-all cursor-pointer z-10"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          ) : (
            <span className="text-caption text-[#A63D3D] font-semibold py-2">
              Hết hàng
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
