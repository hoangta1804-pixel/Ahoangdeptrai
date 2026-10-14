import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { isOrderableIn } from '../../domain/cart';
import { formatMoney } from '../../domain/pricing';
import { isSamplePrice, regionsOf, remainingFor } from '../../domain/state';
import { matchesSearch } from '../../domain/text';
import { CATEGORY_LABEL, type Category } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';
import { useCartActions } from './useCartActions';

const ALL = 'all';

export function ExploreTab() {
  const { state } = useStore();
  const { openModal } = useUi();
  const { add } = useCartActions();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string>(ALL);
  const [category, setCategory] = useState<Category | typeof ALL>(ALL);

  const listed = state.products.filter((p) => p.status === 'active');
  // Bộ lọc vùng sinh từ dữ liệu sản phẩm, cùng một cấp (L9). Sản phẩm ghi nhiều địa danh thì có ở từng địa danh.
  const regions = useMemo(() => [...new Set(listed.flatMap(regionsOf))].sort((a, b) => a.localeCompare(b, 'vi')), [listed]);
  const categories = useMemo(() => (Object.keys(CATEGORY_LABEL) as Category[]).filter((c) => listed.some((p) => p.category === c)), [listed]);

  const visible = listed
    .filter((p) => region === ALL || regionsOf(p).includes(region))
    .filter((p) => category === ALL || p.category === category)
    .filter((p) => matchesSearch(query, [p.name, p.region, state.coops.find((c) => c.id === p.coopId)?.name]));

  const clearFilters = () => {
    setQuery('');
    setRegion(ALL);
    setCategory(ALL);
  };

  const chip = (active: boolean) =>
    `min-h-11 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors ${
      active ? 'bg-forest-800 text-white' : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
    }`;

  return (
    <div className="space-y-4 p-4">
      <div className="flex h-36 flex-col justify-end rounded-3xl bg-gradient-to-br from-forest-800 via-forest-900 to-stone-900 p-4 text-white shadow-sm sm:h-44">
        <h2 className="text-lg font-bold leading-tight">Đặc sản Lào Cai giao tại Hà Nội</h2>
        <p className="mt-0.5 text-sm text-stone-200">Hàng mua sẵn và nông sản theo mùa đặt trước từ các HTX.</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          aria-label="Tìm sản phẩm"
          placeholder="Tìm sản phẩm, vùng, HTX…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-11 w-full rounded-2xl border border-stone-200 bg-white py-2.5 pr-4 pl-10 text-base text-ink md:text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest-600/20"
        />
      </div>

      <div className="space-y-2">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto" role="group" aria-label="Lọc theo vùng">
          <button onClick={() => setRegion(ALL)} className={chip(region === ALL)}>
            Mọi vùng
          </button>
          {regions.map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={chip(region === r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto" role="group" aria-label="Lọc theo nhóm hàng">
          <button onClick={() => setCategory(ALL)} className={chip(category === ALL)}>
            Mọi nhóm hàng
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={chip(category === c)}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-stone-800">Sản phẩm</span>
        <span className="text-xs text-muted">{visible.length} sản phẩm</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          action={
            <button onClick={clearFilters} className="min-h-11 rounded-xl bg-stone-100 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-200">
              Xoá tìm kiếm và bộ lọc
            </button>
          }
        >
          Không có sản phẩm phù hợp.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((p) => {
            const remaining = remainingFor(state, p);
            const soldOut = remaining <= 0 || !isOrderableIn(state, p);
            const coop = state.coops.find((c) => c.id === p.coopId);
            return (
              <div
                key={p.id}
                onClick={() => openModal({ type: 'product_detail', productId: p.id })}
                className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
              >
                <div className="relative h-28 w-full bg-stone-100">
                  <ProductImage product={p} variant="card" className="h-full w-full" />
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    {p.kind === 'preorder' && <span className="rounded-md bg-champagne-600 px-1.5 py-0.5 text-xs font-bold text-white">Đặt trước</span>}
                    {soldOut && <span className="rounded-md bg-stone-900/85 px-1.5 py-0.5 text-xs font-bold text-white">{isOrderableIn(state, p) ? 'Hết hàng' : 'Tạm ngừng bán'}</span>}
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between gap-2 p-2.5">
                  <div>
                    <span className="block truncate text-xs font-semibold text-forest-700">{coop?.name}</span>
                    <h3 className="mt-0.5 line-clamp-2 text-sm font-bold text-ink">{p.name}</h3>
                    <span className="text-xs text-muted">
                      {p.region} · {CATEGORY_LABEL[p.category]}
                    </span>
                  </div>
                  {p.kind === 'preorder' && <PreorderProgress product={p} />}
                  <div className="flex items-center justify-between border-t border-stone-100 pt-2">
                    <div>
                      <span className="text-sm font-extrabold tabular-nums text-ink">{formatMoney(p.price)}</span>
                      <span className="text-xs text-muted">/{p.unit}</span>
                      {isSamplePrice(p) && <span className="block text-xs font-semibold text-champagne-800">Giá mẫu</span>}
                    </div>
                    <button
                      disabled={soldOut}
                      onClick={(e) => {
                        e.stopPropagation();
                        add(p.id, 1);
                      }}
                      aria-label={`Thêm ${p.name} vào giỏ`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-800 text-white hover:bg-forest-700 disabled:bg-stone-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
