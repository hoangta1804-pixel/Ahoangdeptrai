import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Play, Volume2, VolumeX, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem, Product, Variant } from '../../mock/types';
import { ProductPhoto } from './ProductPhoto';
import { productImageSources, productEmoji } from '../../lib/productImages';
import { Viewer360 } from './Viewer360';
import { getFeatureFlags } from '../../lib/featureFlags';

export interface GalleryProps {
  product: Product;
  selectedVariant: Variant;
}

export const Gallery: React.FC<GalleryProps> = ({ product, selectedVariant }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [is360Active, setIs360Active] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const flags = getFeatureFlags();

  // Sắp xếp media theo thứ tự chuẩn BR-PT-05:
  // Ảnh chính -> 360° -> Quy cách và nhãn -> Lúc dùng -> Vùng nguyên liệu -> Video
  const groupOrder: Record<string, number> = {
    main: 1,
    spec: 3,
    in_use: 4,
    origin: 5,
  };

  const sortedMedia = React.useMemo(() => {
    return [...product.media]
      .filter((m) => m.approvalStatus === 'approved' && m.type !== 'model3d')
      .sort((a, b) => {
        // 360° đặt ở vị trí thứ 2
        const priorityA = a.type === 'spin360' ? 2 : groupOrder[a.group] || 9;
        const priorityB = b.type === 'spin360' ? 2 : groupOrder[b.group] || 9;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.sortOrder - b.sortOrder;
      });
  }, [product.media]);

  // Cuộn tới ảnh quy cách khi đổi variant (US-11)
  useEffect(() => {
    if (selectedVariant.imageUrl) {
      const idx = sortedMedia.findIndex((m) => m.variantId === selectedVariant.id);
      if (idx !== -1 && scrollRef.current) {
        setActiveIndex(idx);
        scrollRef.current.scrollTo({
          left: idx * scrollRef.current.clientWidth,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedVariant, sortedMedia]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex && idx >= 0 && idx < sortedMedia.length) {
      setActiveIndex(idx);
    }
  };

  const scrollToMedia = (idx: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: idx * scrollRef.current.clientWidth,
        behavior: 'smooth',
      });
      setActiveIndex(idx);
    }
  };


  return (
    <div className="relative w-full showcase-cabinet">
      {/* Khung trưng bày chính - Tỷ lệ chuẩn 4:5 */}
      <div className="relative aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4/5] w-full max-w-xl mx-auto overflow-hidden">
        {/* Nút mở phóng to Lightbox */}
        {!is360Active && (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Mở toàn màn hình xem chi tiết ảnh"
            className="absolute top-4 left-4 z-30 min-h-[44px] min-w-[44px] rounded-full bg-[#2F6650]/80 hover:bg-[#35705A] text-[#FAF7F0] border border-[#5E9A80] shadow-lg flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
          >
            <Maximize2 size={18} />
          </button>
        )}

        {/* Chế độ 360° tương tác */}
        {is360Active ? (
          <Viewer360
            productName={product.name}
            onClose={() => setIs360Active(false)}
          />
        ) : (
          /* Băng chuyền thư viện cuộn ngang có scroll snap */
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full h-full carousel-snap flex"
            style={{ scrollSnapType: is360Active ? 'none' : 'x mandatory' }}
          >
            {sortedMedia.map((media, idx) => (
              <div
                key={media.id}
                className="carousel-item w-full h-full flex items-center justify-center p-6 relative"
              >
                {media.type === 'photo' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="w-full max-w-md aspect-[4/5] max-h-full rounded-3xl overflow-hidden border border-[#B8893B]/40 shadow-[0_20px_50px_rgba(0,0,0,0.35)] bg-[#FAF7F0]">
                      <ProductPhoto
                        sources={media.group === 'main' ? productImageSources(product, media.url, selectedVariant.imageUrl) : [media.url]}
                        alt={media.alt}
                        emoji={productEmoji(product.category)}
                        caption={media.alt}
                      />
                    </div>
                    {/* Đốm sáng radial phía sau */}
                    <div className="absolute inset-0 bg-radial from-[#CDA25A]/10 to-transparent pointer-events-none" />
                  </div>
                )}

                {media.type === 'spin360' && (
                  <div
                    onClick={() => setIs360Active(true)}
                    className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-56 h-72 rounded-3xl bg-[#35705A] border-2 border-dashed border-[#B8893B] flex flex-col items-center justify-center p-4 text-center group-hover:scale-102 transition-transform shadow-2xl">
                      <div className="w-16 h-16 rounded-full bg-[#B8893B]/20 text-[#CDA25A] flex items-center justify-center mb-3">
                        <RefreshCw size={32} />
                      </div>
                      <span className="font-serif text-lg font-bold text-[#FAF7F0]">
                        Chạm để xoay 360°
                      </span>
                      <span className="text-caption text-[#A5A5B2] mt-1">
                        Bộ ảnh chụp 24 góc nhìn đa chiều
                      </span>
                    </div>
                  </div>
                )}

                {media.type === 'video' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <div className="w-56 h-72 sm:w-64 sm:h-80 rounded-3xl bg-[#35705A] border border-[#5E9A80] flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-2xl">
                      <div className="w-14 h-14 rounded-full bg-[#B8893B] text-[#2F6650] flex items-center justify-center mb-2 shadow-lg">
                        <Play size={26} className="ml-1" />
                      </div>
                      <span className="font-serif font-bold text-[#FAF7F0] text-center">
                        Video thực tế (22s)
                      </span>
                      <span className="text-caption text-[#CDA25A] mt-1">
                        Cách ngâm và chế biến chuẩn vị
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoMuted(!isVideoMuted);
                        }}
                        className="absolute bottom-3 right-3 p-2 rounded-full bg-[#2F6650]/80 text-[#FAF7F0] border border-[#5E9A80]"
                      >
                        {isVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chấm vị trí (Dots indicator) */}
        {!is360Active && sortedMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#2F6650]/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-[#5E9A80]/40">
            {sortedMedia.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToMedia(idx)}
                aria-label={`Chuyển đến ảnh ${idx + 1}`}
                className={`min-h-[24px] min-w-[24px] flex items-center justify-center cursor-pointer`}
              >
                <span
                  className={`h-2 rounded-full transition-all duration-200 block ${
                    activeIndex === idx ? 'w-6 bg-[#B8893B]' : 'w-2 bg-[#FAF7F0]/40'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox xem ảnh toàn màn hình nền chàm */}
      {isLightboxOpen && (
        <div
          role="region"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#2F6650] flex flex-col items-center justify-between p-4"
        >
          <div className="w-full max-w-4xl flex items-center justify-between z-20">
            <span className="text-small font-serif font-bold text-[#CDA25A]">
              {product.name} ({activeIndex + 1}/{sortedMedia.length})
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="min-h-[44px] min-w-[44px] rounded-full bg-[#35705A] text-[#FAF7F0] flex items-center justify-center border border-[#5E9A80] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative flex-1 w-full max-w-3xl flex items-center justify-center p-4">
            <div className="w-72 h-96 rounded-3xl bg-[#FAF7F0] p-6 flex flex-col items-center justify-center shadow-2xl border-2 border-[#B8893B]/40">
              <span className="text-6xl mb-4">🏔️</span>
              <h3 className="font-serif text-xl font-bold text-[#1B1B1F] text-center">
                {sortedMedia[activeIndex]?.alt || product.name}
              </h3>
              <p className="text-small text-[#6B4A32] mt-2">Vuốt hoặc nhấn nút đóng để quay lại</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-4">
            <button
              type="button"
              disabled={activeIndex <= 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="min-h-[44px] px-4 rounded-full bg-[#35705A] text-[#FAF7F0] disabled:opacity-30 border border-[#5E9A80]"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-small font-mono text-[#CDA25A]">
              {activeIndex + 1} / {sortedMedia.length}
            </span>
            <button
              type="button"
              disabled={activeIndex >= sortedMedia.length - 1}
              onClick={() => setActiveIndex((i) => Math.min(sortedMedia.length - 1, i + 1))}
              className="min-h-[44px] px-4 rounded-full bg-[#35705A] text-[#FAF7F0] disabled:opacity-30 border border-[#5E9A80]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
