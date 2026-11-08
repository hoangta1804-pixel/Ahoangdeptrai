import React, { useState, useMemo } from 'react';
import { Product, Variant, ThemeId } from '../mock/types';
import { ProductCard } from '../components/product/ProductCard';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import {
  SlidersHorizontal,
  Search,
  X,
  ArrowRight,
  Box,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface CatalogPageProps {
  products: Product[];
  initialThemeId?: ThemeId;
  initialQuery?: string;
  initialRegion?: string;
  onOpenDetail: (product: Product) => void;
  onQuickAdd: (product: Product, variant: Variant) => void;
  onOpenQuickAddSheet: (product: Product) => void;
  onClearFilters?: () => void;
}

// Bỏ dấu tiếng Việt để tìm kiếm chịu được gõ không dấu (SRS 5.2)
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  initialThemeId,
  initialQuery = '',
  initialRegion = '',
  onOpenDetail,
  onQuickAdd,
  onOpenQuickAddSheet,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyPreorder, setOnlyPreorder] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under100' | '100to300' | 'over300'>('all');
  const [sortKey, setSortKey] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Danh sách các vùng độc nhất
  const allRegions = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.region))).filter(Boolean);
  }, [products]);

  // Bộ lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Lọc theo chủ đề nếu có
      if (initialThemeId) {
        const hasTheme = product.themeMappings.some((t) => t.themeId === initialThemeId && t.isActive);
        if (!hasTheme) return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm (chịu gõ không dấu)
      if (searchQuery.trim()) {
        const qNorm = removeVietnameseTones(searchQuery.trim());
        const nameNorm = removeVietnameseTones(product.name);
        const regionNorm = removeVietnameseTones(product.region);
        const descNorm = removeVietnameseTones(product.shortDescription);
        if (!nameNorm.includes(qNorm) && !regionNorm.includes(qNorm) && !descNorm.includes(qNorm)) {
          return false;
        }
      }

      // 3. Lọc theo vùng
      if (selectedRegion && product.region !== selectedRegion) {
        return false;
      }

      // 4. Lọc theo nhóm hàng
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }


      // 6. Lọc chỉ xem còn hàng
      if (onlyInStock) {
        const hasStock = product.variants.some((v) => v.status === 'in_stock' && v.stock > 0);
        if (!hasStock) return false;
      }

      // 7. Lọc đặt trước
      if (onlyPreorder) {
        const hasPre = product.variants.some((v) => v.status === 'preorder');
        if (!hasPre) return false;
      }

      // 8. Lọc theo khoảng giá
      const minPrice = Math.min(...product.variants.map((v) => v.price));
      if (priceRange === 'under100' && minPrice >= 100000) return false;
      if (priceRange === '100to300' && (minPrice < 100000 || minPrice > 300000)) return false;
      if (priceRange === 'over300' && minPrice <= 300000) return false;

      return true;
    });
  }, [
    products,
    initialThemeId,
    searchQuery,
    selectedRegion,
    selectedCategory,
    onlyInStock,
    onlyPreorder,
    priceRange,
  ]);

  // Sắp xếp
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA = Math.min(...a.variants.map((v) => v.price));
      const priceB = Math.min(...b.variants.map((v) => v.price));
      if (sortKey === 'price_asc') return priceA - priceB;
      if (sortKey === 'price_desc') return priceB - priceA;
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'vi');
      return 0; // Mặc định featured
    });
  }, [filteredProducts, sortKey]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedRegion('');
    setSelectedCategory('all');
    setOnlyInStock(false);
    setOnlyPreorder(false);
    setPriceRange('all');
    setSortKey('featured');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedRegion) ||
    selectedCategory !== 'all' ||
    onlyInStock ||
    onlyPreorder ||
    priceRange !== 'all';

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-6 px-4 lg:px-8">
      <main className="max-w-6xl mx-auto space-y-6">
        {/* Tiêu đề trang & Ô tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-caption font-semibold tracking-wider uppercase text-[#8F6A4D]">
              ĐẶC SẢN LÀO CAI CHÍNH GỐC
            </span>
            <h1 className="font-serif text-h1 font-bold text-[#35705A] mt-0.5">
              {initialThemeId === 'in_season'
                ? 'Nông sản đang vào vụ'
                : initialThemeId === 'best_seller'
                ? 'Đặc sản bán chạy nhất'
                : initialThemeId === 'gift'
                ? 'Gợi ý hộp quà biếu'
                : 'Danh mục tất cả đặc sản'}
            </h1>
            <p className="text-small text-[#6B4A32] mt-1">
              {filteredProducts.length} đặc sản tuyển chọn sẵn sàng giao tại Hà Nội
            </p>
          </div>

          {/* Ô tìm kiếm */}
          <div className="w-full md:w-80 relative">
            <input
              type="search"
              placeholder="Tìm theo tên, vùng đất..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-full border border-[#E7DFCF] focus:border-[#B8893B] bg-white text-small outline-none"
            />
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F6A4D]" />
          </div>
        </div>

        {/* Thanh lọc dính (Sticky Filter Bar) */}
        <div className="sticky top-16 z-20 glass-blur p-3 rounded-2xl border border-[#E7DFCF]/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Nhóm nút lọc nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-small font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isFilterPanelOpen || hasActiveFilters
                  ? 'bg-[#35705A] text-[#FAF7F0] border-[#35705A]'
                  : 'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:border-[#B8893B]'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#B8893B] ml-0.5" />
              )}
            </button>

            {/* Filter nhanh còn hàng */}
            <Chip
              active={onlyInStock}
              onClick={() => setOnlyInStock(!onlyInStock)}
              className="min-h-[40px] text-xs"
            >
              Có sẵn kho Hà Nội
            </Chip>

            {/* Filter nhanh đặt trước */}
            <Chip
              active={onlyPreorder}
              onClick={() => setOnlyPreorder(!onlyPreorder)}
              className="min-h-[40px] text-xs"
            >
              <Clock size={13} className="mr-1 inline" />
              Đặt trước vụ mới
            </Chip>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 text-small">
            <span className="text-[#8F6A4D] hidden sm:inline">Sắp xếp:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-[#E7DFCF] bg-white text-small text-[#1B1B1F] outline-none"
            >
              <option value="featured">Nổi bật gợi ý</option>
              <option value="price_asc">Giá từ thấp đến cao</option>
              <option value="price_desc">Giá từ cao đến thấp</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>

        {/* Khung bộ lọc mở rộng */}
        {isFilterPanelOpen && (
          <div className="p-5 bg-white rounded-3xl border border-[#E7DFCF] shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Vùng sản xuất */}
              <div>
                <label className="block text-small font-semibold text-[#1B1B1F] mb-1.5">
                  Vùng xuất xứ Lào Cai:
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7DFCF] text-small bg-[#FAF7F0]"
                >
                  <option value="">Tất cả các vùng</option>
                  {allRegions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nhóm hàng */}
              <div>
                <label className="block text-small font-semibold text-[#1B1B1F] mb-1.5">
                  Nhóm đặc sản:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7DFCF] text-small bg-[#FAF7F0]"
                >
                  <option value="all">Tất cả nhóm hàng</option>
                  <option value="tea">Trà & Thức uống thảo mộc</option>
                  <option value="dry">Nông sản khô & Gạo nương</option>
                  <option value="processed">Đặc sản chế biến & Thịt gác bếp</option>
                  <option value="fresh">Nông sản tươi chín cây</option>
                  <option value="gift">Hộp quà tặng trang trọng</option>
                </select>
              </div>

              {/* Khoảng giá */}
              <div>
                <label className="block text-small font-semibold text-[#1B1B1F] mb-1.5">
                  Khoảng giá:
                </label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7DFCF] text-small bg-[#FAF7F0]"
                >
                  <option value="all">Mọi mức giá</option>
                  <option value="under100">Dưới 100.000₫</option>
                  <option value="100to300">100.000₫ – 300.000₫</option>
                  <option value="over300">Trên 300.000₫</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="pt-2 border-t border-[#E7DFCF] flex items-center justify-between">
                <span className="text-small text-[#6B4A32]">
                  Đang lọc theo các điều kiện đã chọn
                </span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-small text-[#A63D3D] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <X size={15} />
                  <span>Xoá tất cả bộ lọc</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lưới sản phẩm (Mobile 2 cột, Desktop 3-4 cột) */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetail={onOpenDetail}
                onQuickAdd={onQuickAdd}
                onOpenQuickAddSheet={onOpenQuickAddSheet}
                themeVariant="light"
              />
            ))}
          </div>
        ) : (
          /* Trạng thái rỗng (Empty state) */
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#F3EEE2] flex items-center justify-center text-[#B8893B] mx-auto">
              <Search size={32} />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1B1B1F]">
              Không tìm thấy đặc sản phù hợp
            </h3>
            <p className="text-small text-[#6B4A32]">
              Thử tìm kiếm với từ khóa khác hoặc xóa bớt các tiêu chí lọc để xem toàn bộ đặc sản Lào Cai.
            </p>
            <Button variant="primary" onClick={clearAllFilters}>
              Xoá bộ lọc và xem tất cả
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
