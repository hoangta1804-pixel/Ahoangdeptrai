import { useState } from 'react';
import { CheckCircle2, Plus, Search, ShieldCheck } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { formatMoney } from '../../domain/pricing';
import { matchesSearch } from '../../domain/text';
import { useAppData } from '../../store/AppDataContext';
import { useAddToCart } from './useAddToCart';

export function ExploreTab() {
  const { products } = useAppData();
  const { openModal } = useUi();
  const addToCart = useAddToCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCert, setFilterCert] = useState('all');

  const visible = products
    .filter((p) => filterCert === 'all' || p.certType === filterCert)
    .filter((p) => matchesSearch(searchQuery, [p.name, p.coopName, p.originDistrict]));

  return (
    <div className="space-y-4 p-4">
      {/* Banner (không dùng ảnh stock) */}
      <div className="relative flex h-40 flex-col justify-end overflow-hidden rounded-3xl border border-stone-200/50 bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 p-4 text-white shadow-sm sm:h-48">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-md bg-sky-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <ShieldCheck size={12} />
            CQQLNN Bảo chứng
          </span>
          <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white">Giao tận cửa Hà Nội</span>
        </div>
        <h2 className="text-lg font-bold leading-tight">Đặc Sản Sương Mây Lào Cai</h2>
        <p className="mt-0.5 text-xs text-stone-200">Thu hoạch tươi mới từ Bắc Hà, Mường Khương, Sa Pa</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          aria-label="Tìm sản phẩm"
          placeholder="Tìm mận Bắc Hà, gạo Séng Cù..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-stone-200 bg-white py-2.5 pr-4 pl-10 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
        />
      </div>

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
        {['all', 'OCOP 5 Sao', 'OCOP 4 Sao', 'VietGAP'].map((cert) => (
          <button
            key={cert}
            onClick={() => setFilterCert(cert)}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              filterCert === cert ? 'bg-emerald-900 text-white shadow-sm' : 'border border-stone-200/80 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cert === 'all' ? 'Tất cả nông sản' : cert}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-800">Danh Sách Chính Hãng</span>
          <span className="text-[11px] text-stone-400">{visible.length} sản phẩm</span>
        </div>

        {visible.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-600">
            <p>Không có sản phẩm phù hợp.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCert('all');
              }}
              className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-200"
            >
              Xoá tìm kiếm và bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((prod) => (
              <div
                key={prod.id}
                onClick={() => openModal({ type: 'product_detail', product: prod })}
                className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-transform active:scale-[0.98]"
              >
                <div className="relative h-28 w-full overflow-hidden bg-stone-100">
                  <ProductImage product={prod} className="h-full w-full" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="flex items-center gap-0.5 rounded-md bg-sky-600/95 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      <CheckCircle2 size={10} />
                      Bảo chứng
                    </span>
                    {prod.isPreorder && (
                      <span className="rounded-md bg-amber-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Cọc 30%</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-2.5">
                  <div>
                    <span className="block truncate text-[10px] font-semibold text-emerald-800">{prod.coopName}</span>
                    <h3 className="mt-0.5 line-clamp-2 text-xs font-bold text-stone-900">{prod.name}</h3>
                  </div>
                  {prod.isPreorder && (
                    <div className="mt-2">
                      <PreorderProgress product={prod} />
                    </div>
                  )}
                  <div className="mt-2.5 flex items-center justify-between border-t border-stone-100 pt-2">
                    <div>
                      <span className="text-xs font-extrabold tabular-nums text-stone-900">{formatMoney(prod.price)}</span>
                      <span className="text-[10px] text-stone-400">/{prod.unit}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod, 1);
                      }}
                      aria-label={`Thêm ${prod.name} vào giỏ`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-900 text-white transition-colors hover:bg-emerald-800"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
