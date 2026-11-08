import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Product, Variant, ThemeId } from '../../mock/types';
import { ProductCard } from './ProductCard';
import { THEME_DEFINITIONS } from '../../mock/themes';

export interface ProductCarouselProps {
  themeId: ThemeId;
  products: Product[];
  onOpenDetail: (product: Product) => void;
  onQuickAdd: (product: Product, variant: Variant) => void;
  onOpenQuickAddSheet: (product: Product) => void;
  onViewAll: (themeId: ThemeId) => void;
  themeVariant?: 'dark' | 'light';
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  themeId,
  products,
  onOpenDetail,
  onQuickAdd,
  onOpenQuickAddSheet,
  onViewAll,
  themeVariant = 'light',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const dark = themeVariant === 'dark';

  // Thẻ hiện dần khi băng chuyền cuộn vào màn hình
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Kéo bằng chuột để lướt (cảm ứng đã có vuốt tự nhiên)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = containerRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setIsDragging(true);
      el.setPointerCapture(e.pointerId);
    }
    if (d.moved) el.scrollLeft = d.startScroll - dx;
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) {
      containerRef.current?.releasePointerCapture?.(e.pointerId);
      setIsDragging(false);
    }
  };
  // Vừa kéo xong thì không tính là bấm vào thẻ
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const themeInfo = THEME_DEFINITIONS[themeId];

  // Lọc sản phẩm theo chủ đề và luật BR-PT-01:
  // Sản phẩm CHƯA ĐỦ 5 ẢNH đã duyệt không xuất hiện trong băng chuyền nổi bật
  const eligibleProducts = products
    .filter((p) => {
      const mapping = p.themeMappings.find((t) => t.themeId === themeId && t.isActive);
      if (!mapping) return false;
      const approvedMediaCount = p.media.filter((m) => m.approvalStatus === 'approved').length;
      return approvedMediaCount >= 5;
    })
    .sort((a, b) => {
      const orderA = a.themeMappings.find((t) => t.themeId === themeId)?.sortOrder ?? 99;
      const orderB = b.themeMappings.find((t) => t.themeId === themeId)?.sortOrder ?? 99;
      return orderA - orderB;
    })
    .slice(0, 11); // Tối đa 11 thẻ sản phẩm + 1 thẻ "Xem tất cả" = 12 thẻ

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const current = el.scrollLeft;
    setScrollProgress((current / maxScroll) * 100);
    setCanScrollLeft(current > 10);
    setCanScrollRight(current < maxScroll - 10);
  };

  useEffect(() => {
    handleScroll();
  }, [eligibleProducts]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('article')?.clientWidth || 300;
    const scrollOffset = direction === 'left' ? -cardWidth - 16 : cardWidth + 16;
    el.scrollBy({ left: scrollOffset, behavior: 'smooth' });
  };

  // Keyboard navigation left/right arrows
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByAmount('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByAmount('right');
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-label={`Băng chuyền ${themeInfo.title}`}
      className={`carousel-reveal py-6 lg:py-10 ${isVisible ? 'is-visible' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header của Băng chuyền */}
      <div className="flex items-end justify-between px-4 lg:px-8 mb-4 lg:mb-6">
        <div>
          <span className={`text-caption font-semibold tracking-wider uppercase ${dark ? 'text-[#F0D9A9]' : 'text-[#2A6F50]'}`}>
            {themeInfo.badgeLabel}
          </span>
          <h2
            className={`font-serif text-h2 font-bold tracking-tight mt-0.5 ${
              themeVariant === 'dark' ? 'text-[#FAF7F0]' : 'text-[#1B1B1F]'
            }`}
          >
            {themeInfo.title}
          </h2>
          <p
            className={`text-small mt-1 max-w-xl ${
              themeVariant === 'dark' ? 'text-[#DCE6DF]' : 'text-[#6B4A32]'
            }`}
          >
            {themeInfo.subtitle}
          </p>
        </div>

        {/* Nút điều hướng Desktop */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canScrollLeft}
            onClick={() => scrollByAmount('left')}
            aria-label={`Cuộn sang trái ${themeInfo.title}`}
            className={`w-11 h-11 rounded-full flex items-center justify-center border active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${dark ? 'border-[#E0BD7E]/60 text-[#F0D9A9] hover:bg-[#B8893B]/20' : 'border-[#DED8CA] bg-white text-[#2A6F50] hover:bg-[#2A6F50] hover:text-white hover:border-[#2A6F50]'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            disabled={!canScrollRight}
            onClick={() => scrollByAmount('right')}
            aria-label={`Cuộn sang phải ${themeInfo.title}`}
            className={`w-11 h-11 rounded-full flex items-center justify-center border active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${dark ? 'border-[#E0BD7E]/60 text-[#F0D9A9] hover:bg-[#B8893B]/20' : 'border-[#DED8CA] bg-white text-[#2A6F50] hover:bg-[#2A6F50] hover:text-white hover:border-[#2A6F50]'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Băng chuyền cuộn ngang có scroll snap */}
      <div className="relative">
      {canScrollRight && (
        <div aria-hidden="true" className={`pointer-events-none absolute right-0 top-0 bottom-4 w-12 z-10 bg-gradient-to-l ${dark ? 'from-[#2A6F50]' : 'from-[#F5F1E8]'} to-transparent`} />
      )}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className={`carousel-snap px-4 lg:px-8 gap-4 pt-2 pb-4 focus:outline-none ${isDragging ? 'is-dragging' : ''}`}
      >
        {eligibleProducts.map((product, i) => (
          <div
            key={product.id}
            style={{ '--i': i } as React.CSSProperties}
            className="carousel-item w-[78vw] sm:w-[48vw] md:w-[32vw] lg:w-[260px] xl:w-[280px]"
          >
            <ProductCard
              product={product}
              onOpenDetail={onOpenDetail}
              onQuickAdd={onQuickAdd}
              onOpenQuickAddSheet={onOpenQuickAddSheet}
              themeVariant={themeVariant}
            />
          </div>
        ))}

        {/* Thẻ thứ 12: "Xem tất cả" */}
        <div
          style={{ '--i': eligibleProducts.length } as React.CSSProperties}
          className="carousel-item w-[70vw] sm:w-[40vw] md:w-[28vw] lg:w-[240px] flex items-stretch"
        >
          <button
            type="button"
            onClick={() => onViewAll(themeId)}
            className={`w-full rounded-[22px] border border-dashed flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group ${
              themeVariant === 'dark'
                ? 'border-[#5E9A80] bg-[#35705A]/40 text-[#FAF7F0] hover:bg-[#35705A] hover:border-[#B8893B]'
                : 'border-[#DED8CA] bg-white/60 text-[#1B1B1F] hover:bg-white hover:border-[#2A6F50]'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#2A6F50]/10 text-[#2A6F50] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#2A6F50] group-hover:text-white transition-all">
              <ArrowRight size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold">Xem tất cả</h3>
            <p className={`text-small mt-1 ${themeVariant === 'dark' ? 'text-[#DCE6DF]' : 'text-[#6B4A32]'}`}>Đặc sản {themeInfo.title.toLowerCase()}</p>
          </button>
        </div>
      </div>

      </div>

      {/* Thanh tiến trình cuộn mảnh */}
      <div className="px-4 lg:px-8 mt-1">
        <div className={`w-full h-1 rounded-full overflow-hidden ${dark ? 'bg-[#4B8A71]/40' : 'bg-[#DED8CA]'}`}>
          <div
            className={`h-full rounded-full transition-all duration-150 ${dark ? 'bg-[#B8893B]' : 'bg-[#2A6F50]'}`}
            style={{ width: `${Math.max(15, scrollProgress)}%` }}
          />
        </div>
      </div>
    </section>
  );
};
