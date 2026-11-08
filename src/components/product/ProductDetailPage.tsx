import React, { useState, useEffect } from 'react';
import { Product, Variant, Supplier } from '../../mock/types';
import { getDefaultVariant } from '../../lib/variants';
import { formatMoney } from '../../lib/pricing';
import { getAvailableStock, checkCanAddToCart } from '../../lib/stock';
import { Gallery } from './Gallery';
import { SpecChips } from './SpecChips';
import { StickyBuyBar } from './StickyBuyBar';
import { Badge } from '../ui/Badge';
import { getFeatureFlags } from '../../lib/featureFlags';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Building2,
  QrCode,
  Heart,
  Share2,
  Clock,
  Sparkles,
  Leaf,
  Info,
} from 'lucide-react';
import { track } from '../../lib/analytics';

export interface ProductDetailPageProps {
  product: Product;
  supplier?: Supplier;
  allProducts: Product[];
  onBack: () => void;
  onNavigateToProduct: (slug: string) => void;
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  onBuyNow: (product: Product, variant: Variant, quantity: number) => void;
  onOpenTraceability: (code: string) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  supplier,
  allProducts,
  onBack,
  onNavigateToProduct,
  onAddToCart,
  onBuyNow,
  onOpenTraceability,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(() => {
    return getDefaultVariant(product) || product.variants[0];
  });
  const [quantity, setQuantity] = useState(1);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const flags = getFeatureFlags();

  useEffect(() => {
    const def = getDefaultVariant(product);
    if (def) setSelectedVariant(def);
    setQuantity(1);
    setStockNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    track('view_product_detail', { productId: product.id, slug: product.slug });
  }, [product.id]);

  const availableStock = getAvailableStock(selectedVariant);
  const isPreorder = selectedVariant.status === 'preorder';
  const isOutOfStock = availableStock <= 0;

  // Xử lý chuyển sản phẩm trước/sau (FR-TKSP-16)
  const currentIndex = allProducts.findIndex((p) => p.id === product.id);
  const prevProduct = currentIndex > 0 ? allProducts[currentIndex - 1] : null;
  const nextProduct = currentIndex < allProducts.length - 1 ? allProducts[currentIndex + 1] : null;

  const handleAddToCart = () => {
    const check = checkCanAddToCart(0, quantity, selectedVariant);
    if (!check.allowed) {
      setStockNotice(check.message || 'Không đủ số lượng.');
      return;
    }
    onAddToCart(product, selectedVariant, quantity);
    track('add_to_cart_detail', { productId: product.id, variantId: selectedVariant.id, quantity });
  };

  const handleBuyNow = () => {
    const check = checkCanAddToCart(0, quantity, selectedVariant);
    if (!check.allowed) {
      setStockNotice(check.message || 'Không đủ số lượng.');
      return;
    }
    onBuyNow(product, selectedVariant, quantity);
    track('buy_now_detail', { productId: product.id, variantId: selectedVariant.id, quantity });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] pb-32">
      {/* Top Bar điều hướng */}
      <nav
        aria-label="Thanh điều hướng trang chi tiết"
        className="sticky top-0 z-30 glass-blur border-b border-[#E7DFCF]/80 px-4 py-2 flex items-center justify-between"
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại danh sách sản phẩm"
          className="min-h-[44px] min-w-[44px] rounded-full flex items-center gap-1.5 text-small font-semibold text-[#35705A] hover:bg-[#F3EEE2] px-2.5 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
              className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[#B8893B] hover:bg-[#F3EEE2] transition-colors cursor-pointer"
            >
              <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setStockNotice('Đã sao chép liên kết chia sẻ!');
              setTimeout(() => setStockNotice(null), 3000);
            }}
            aria-label="Chia sẻ sản phẩm"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[#6B4A32] hover:bg-[#F3EEE2] transition-colors cursor-pointer"
          >
            <Share2 size={20} />
          </button>
        </div>
      </nav>

      {/* Main Container - 2 cột trên Desktop, 1 cột trên Mobile */}
      <main className="max-w-6xl mx-auto lg:px-8 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: KHU TRƯNG BÀY NỀN CHÀM (THƯ VIỆN, 3D, 360) */}
          <div className="lg:col-span-6 lg:sticky lg:top-18">
            <div className="rounded-none lg:rounded-[28px] overflow-hidden shadow-2xl border border-[#5E9A80]/40">
              <Gallery product={product} selectedVariant={selectedVariant} />
            </div>
          </div>

          {/* CỘT PHẢI: KHU THÔNG TIN & ĐẶT MUA NỀN TRẮNG NGÀ */}
          <div className="lg:col-span-6 px-4 lg:px-0 space-y-6">
            {/* Header thông tin sản phẩm */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-small font-semibold tracking-wider uppercase text-[#6B4A32] flex items-center gap-1.5">
                  <MapPin size={15} />
                  <span>{product.region}</span>
                </span>

                {/* NÚT CHUYỂN SẢN PHẨM TRƯỚC/SAU Ở VÙNG TÊN SẢN PHẨM (FR-TKSP-16) */}
                {flags.shouldHave.prevNextProduct && (prevProduct || nextProduct) && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!prevProduct}
                      onClick={() => prevProduct && onNavigateToProduct(prevProduct.slug)}
                      aria-label="Sản phẩm trước"
                      className="p-1.5 rounded-full text-[#6B4A32] hover:bg-[#F3EEE2] disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-caption text-[#8F6A4D] font-mono">
                      {currentIndex + 1}/{allProducts.length}
                    </span>
                    <button
                      type="button"
                      disabled={!nextProduct}
                      onClick={() => nextProduct && onNavigateToProduct(nextProduct.slug)}
                      aria-label="Sản phẩm tiếp theo"
                      className="p-1.5 rounded-full text-[#6B4A32] hover:bg-[#F3EEE2] disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tên sản phẩm serif */}
              <h1 className="font-serif text-h1 font-bold text-[#1B1B1F] leading-tight">
                {product.name}
              </h1>

              {/* Nhà cung cấp (Không dùng chữ HTX!) */}
              <div className="flex items-center gap-2 text-small text-[#6B4A32]">
                <Building2 size={16} />
                <span>Nhà cung cấp:</span>
                <span className="font-semibold text-[#1B1B1F]">
                  {supplier?.name || 'Doanh nghiệp đặc sản Lào Cai'}
                </span>
              </div>
            </div>

            {/* Khung Giá & Tình trạng hàng */}
            <div className="p-4 bg-white rounded-2xl border border-[#E7DFCF] shadow-xs space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-caption text-[#8F6A4D] block">Đơn giá</span>
                  <div className="price-tag text-3xl">{formatMoney(selectedVariant.price)}</div>
                </div>

                <div>
                  {isOutOfStock ? (
                    <Badge variant="outofstock">Tạm hết hàng</Badge>
                  ) : isPreorder ? (
                    <Badge variant="preorder">Đặt trước · Cọc 30%</Badge>
                  ) : (
                    <Badge variant="success">Có sẵn tại kho Hà Nội</Badge>
                  )}
                </div>
              </div>

              {/* Cảnh báo số lượng tồn ít hoặc ngày giao */}
              {isPreorder ? (
                <div className="p-2.5 bg-[#FEF7EA] text-[#B7791F] text-small rounded-xl flex items-center gap-2 font-medium">
                  <Clock size={16} />
                  <span>
                    Dự kiến giao ngày {selectedVariant.expectedDeliveryDate || 'vụ tới'}. Còn{' '}
                    {availableStock} suất đặt trước.
                  </span>
                </div>
              ) : availableStock > 0 && availableStock <= 10 ? (
                <div className="text-small text-[#B7791F] font-semibold">
                  Chỉ còn {availableStock} sản phẩm có sẵn tại kho Hà Nội!
                </div>
              ) : null}
            </div>

            {/* Chip quy cách đóng gói */}
            <SpecChips
              variants={product.variants}
              selectedVariant={selectedVariant}
              onSelectVariant={(v) => {
                setSelectedVariant(v);
                setQuantity(1);
                setStockNotice(null);
              }}
            />

            {/* Thông báo lỗi vượt tồn nếu có */}
            {stockNotice && (
              <div className="p-3 bg-[#FDF1F1] text-[#A63D3D] border border-[#A63D3D]/30 text-small rounded-xl font-medium">
                {stockNotice}
              </div>
            )}

            {/* Thông báo đăng ký báo khi có hàng thành công */}
            {notifySuccess && (
              <div className="p-3 bg-[#EAF4EE] text-[#2F6B4F] border border-[#2F6B4F]/30 text-small rounded-xl font-medium">
                Đã ghi nhận! Chúng tôi sẽ gửi tin nhắn báo ngay khi có hàng mới về kho.
              </div>
            )}

            {/* Mô tả ngắn sản phẩm */}
            <div className="text-body text-[#33333A] leading-relaxed">
              {product.shortDescription}
            </div>

            {/* Nút Truy xuất nguồn gốc QR */}
            {product.traceabilityCode && (
              <button
                type="button"
                onClick={() => onOpenTraceability(product.traceabilityCode!)}
                className="w-full p-3.5 bg-gradient-to-r from-[#FAF7F0] to-[#F3EEE2] border border-[#B8893B]/40 rounded-2xl flex items-center justify-between hover:border-[#B8893B] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-small font-semibold text-[#35705A]">
                  <QrCode size={20} className="text-[#B8893B]" />
                  <span>Truy xuất nguồn gốc & Nhật ký lô hàng</span>
                </div>
                <span className="text-caption text-[#B8893B] font-semibold group-hover:translate-x-1 transition-transform">
                  Mã: {product.traceabilityCode} →
                </span>
              </button>
            )}

            {/* Khối Nguồn gốc & Văn hóa */}
            {product.story && (
              <section className="p-5 bg-white rounded-2xl border border-[#E7DFCF] space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#1B1B1F] flex items-center gap-2">
                  <Leaf size={18} className="text-[#204C39]" />
                  <span>Nguồn gốc & Đất trời Tây Bắc</span>
                </h3>
                <div className="space-y-2 text-small text-[#4A4A52]">
                  <p>
                    <strong className="text-[#1B1B1F]">Vùng đất:</strong> {product.story.origin}
                  </p>
                  <p>
                    <strong className="text-[#1B1B1F]">Văn hóa:</strong> {product.story.culture}
                  </p>
                  <p>
                    <strong className="text-[#1B1B1F]">Con người:</strong> {product.story.people}
                  </p>
                </div>
              </section>
            )}

            {/* Chứng nhận chất lượng (ẨN NẾU THIẾU) */}
            {product.certifications && product.certifications.length > 0 && (
              <section className="p-5 bg-white rounded-2xl border border-[#E7DFCF] space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#1B1B1F] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#2F6B4F]" />
                  <span>Chứng nhận & Kiểm định</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-3 py-1 bg-[#EAF4EE] text-[#2F6B4F] text-caption font-semibold rounded-full border border-[#2F6B4F]/20"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Hướng dẫn sử dụng & Bảo quản */}
            {(product.usageInstructions || product.preservation) && (
              <section className="p-5 bg-white rounded-2xl border border-[#E7DFCF] space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#1B1B1F] flex items-center gap-2">
                  <Info size={18} className="text-[#8F6A4D]" />
                  <span>Cách dùng & Bảo quản</span>
                </h3>
                <div className="space-y-2 text-small text-[#4A4A52]">
                  {product.usageInstructions && (
                    <p>
                      <strong className="text-[#1B1B1F]">Thưởng thức:</strong>{' '}
                      {product.usageInstructions}
                    </p>
                  )}
                  {product.preservation && (
                    <p>
                      <strong className="text-[#1B1B1F]">Bảo quản:</strong>{' '}
                      {product.preservation}
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Thanh mua dính đáy StickyBuyBar */}
      <StickyBuyBar
        variant={selectedVariant}
        quantity={quantity}
        onQuantityChange={(q) => {
          setQuantity(q);
          setStockNotice(null);
        }}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onNotifyBackInStock={() => {
          setNotifySuccess(true);
          setTimeout(() => setNotifySuccess(false), 4000);
        }}
        onExceedMax={() => setStockNotice(`Chỉ còn đặt được ${availableStock} sản phẩm.`)}
      />
    </div>
  );
};
