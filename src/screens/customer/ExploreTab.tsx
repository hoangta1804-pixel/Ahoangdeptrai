import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { LandscapeArt } from '../../components/LandscapeArt';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { QuantityStepper } from '../../components/QuantityStepper';
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
  const { add, cart, update, remove } = useCartActions();
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

  const coopCount = new Set(listed.map((p) => p.coopId)).size;

  const chip = (active: boolean) =>
    `min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${
      active ? 'bg-forest-800 text-white' : 'border border-stone-300/80 bg-white text-stone-700 hover:border-forest-600'
    }`;

  return (
    <div className="space-y-4 p-4">
      <section className="relative overflow-hidden rounded-[28px] bg-forest-900 text-white shadow-sm">
        <LandscapeArt className="absolute inset-0 h-full w-full" />
        <div className="relative space-y-2 px-5 pt-6 pb-28 sm:pb-32">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne-300">Từ các hợp tác xã vùng cao Lào Cai</p>
          <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-balance">Đặc sản núi rừng, giao tận nhà tại Hà Nội</h2>
          <p className="max-w-sm text-sm text-forest-100">Hàng mua sẵn và nông sản theo mùa, đặt trước để giữ suất.</p>
          <p className="inline-flex rounded-full border border-champagne-300/50 px-3 py-1 text-xs font-semibold text-champagne-200">
            {listed.length} sản phẩm · {coopCount} HTX
          </p>
        </div>
      </section>

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

      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl font-semibold text-ink">Sản phẩm</h3>
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
            // Đã có trong giỏ: thẻ hiện ô số lượng để tăng, giảm hoặc gõ số ngay tại chỗ.
            const inCart = soldOut ? undefined : cart.find((l) => l.productId === p.id);
            return (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgb(0,0,0,0.04),0_10px_28px_rgb(31,77,58,0.07)] ring-1 ring-stone-200/60">
                <button
                  type="button"
                  onClick={() => openModal({ type: 'product_detail', productId: p.id })}
                  aria-label={`Xem ${p.name}`}
                  className="flex flex-1 flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
                >
                  <div className="relative aspect-square w-full">
                    <ProductImage product={p} variant="card" className="h-full w-full" />
                    <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
                      {p.kind === 'preorder' && <span className="rounded-full bg-champagne-600 px-2 py-0.5 text-xs font-bold text-white">Đặt trước</span>}
                      {soldOut && <span className="rounded-full bg-ink/85 px-2 py-0.5 text-xs font-bold text-white">{isOrderableIn(state, p) ? 'Hết hàng' : 'Tạm ngừng bán'}</span>}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="truncate text-xs font-semibold uppercase tracking-wider text-champagne-700">{p.region}</span>
                    <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-ink">{p.name}</h3>
                    <span className="truncate text-xs text-muted">{coop?.name}</span>
                    {p.kind === 'preorder' && (
                      <div className="mt-1">
                        <PreorderProgress product={p} compact />
                      </div>
                    )}
                  </div>
                </button>
                <div className={`space-y-2 border-t border-stone-100 py-2 ${inCart ? 'px-2' : 'px-3'}`}>
                  <div className="flex min-h-11 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block text-base font-bold tabular-nums text-ink">{formatMoney(p.price)}</span>
                      <span className="block truncate text-xs text-muted">
                        /{p.unit}
                        {isSamplePrice(p) && <span className="font-semibold text-champagne-800"> · giá mẫu</span>}
                      </span>
                    </div>
                    {!inCart && (
                      <button
                        disabled={soldOut}
                        onClick={() => add(p.id, 1)}
                        aria-label={`Thêm ${p.name} vào giỏ`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white hover:bg-forest-700 disabled:bg-stone-300"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                  {inCart && (
                    <QuantityStepper
                      value={inCart.quantity}
                      max={remaining}
                      onChange={(quantity) => update(p.id, { quantity })}
                      onRemove={() => remove(p.id)}
                      itemName={p.name}
                      compact
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
