import { useMemo, useState } from 'react';
import { ArrowRight, PackageCheck, Plus, Search, Sprout, Truck } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BrandEmblem, BrandWordmark, BrocadeBand, Ornament, SectionHeading } from '../../components/Brand';
import { EmptyState } from '../../components/EmptyState';
import { LandscapeArt } from '../../components/LandscapeArt';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { QuantityStepper } from '../../components/QuantityStepper';
import { isOrderableIn } from '../../domain/cart';
import { formatMoney } from '../../domain/pricing';
import { isSamplePrice, regionsOf, remainingFor } from '../../domain/state';
import { matchesSearch } from '../../domain/text';
import { CATEGORY_LABEL, type Category, type Product } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';
import { useCartActions } from './useCartActions';

const ALL = 'all';

/** Các bước mua, mô tả đúng luồng của app (không phải cam kết dịch vụ). */
const STEPS = [
  { Icon: Sprout, title: 'Chọn đặc sản', text: 'Hàng mua sẵn đặt là giao; nông sản theo mùa đặt trước, cọc để giữ suất.' },
  { Icon: PackageCheck, title: 'HTX chuẩn bị đơn', text: 'HTX xác nhận đơn, đóng gói và bàn giao cho đơn vị vận chuyển.' },
  { Icon: Truck, title: 'Nhận hàng tại Hà Nội', text: 'Theo dõi đơn ở mục Đơn hàng; xem nguồn gốc lô hàng ở trang sản phẩm.' },
];

/**
 * Trang Khám phá của khách (FR-TKSP-01..03): đầu trang, tìm và lọc, đặt trước theo mùa, lưới sản phẩm, cách mua.
 * Giao diện "sang": nền tối có hoa văn chìm, chữ ánh vàng, khung ảnh hình vòm, hoa văn thổ cẩm ngăn mục.
 */
export function ExploreTab() {
  const { state } = useStore();
  const { setCustomerTab } = useUi();
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

  const filtering = query.trim() !== '' || region !== ALL || category !== ALL;
  const clearFilters = () => {
    setQuery('');
    setRegion(ALL);
    setCategory(ALL);
  };

  const coopCount = new Set(listed.map((p) => p.coopId)).size;
  const preorders = listed.filter((p) => p.kind === 'preorder' && isOrderableIn(state, p) && remainingFor(state, p) > 0);
  const showcase = listed.slice(0, 3);

  const chip = (active: boolean) =>
    `min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${
      active ? 'bg-forest-900 text-champagne-100 ring-1 ring-champagne-400/60' : 'border border-champagne-300/80 bg-white/80 text-stone-700 hover:border-champagne-500'
    }`;

  const scrollToProducts = () => document.getElementById('san-pham')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-9 px-4 pt-4 pb-8 md:px-6 md:pt-6">
      {/* Đầu trang */}
      <section className="relative overflow-hidden rounded-[32px] bg-forest-950 text-white shadow-[0_24px_60px_rgb(14,37,27,0.28)]">
        <div aria-hidden="true" className="lattice absolute inset-0" />
        <LandscapeArt className="absolute inset-0 h-full w-full" />
        {/* Trên máy tính: ba khung tranh hình vòm bên phải. */}
        <div aria-hidden="true" className="pointer-events-none absolute right-10 bottom-16 hidden items-end gap-4 lg:flex">
          {showcase.map((p, i) => (
            <div key={p.id} className={`overflow-hidden rounded-t-full rounded-b-3xl p-1.5 ring-1 ring-champagne-400/70 ${i === 1 ? 'w-44 bg-champagne-200/20' : 'w-32 bg-champagne-200/10'}`}>
              <ProductImage product={p} variant="card" className="aspect-[4/5] w-full rounded-t-full rounded-b-[20px]" />
            </div>
          ))}
        </div>
        <div className="relative space-y-4 px-6 pt-8 pb-36 md:max-w-xl md:px-10 md:pt-12 md:pb-44">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-300">
            <span aria-hidden="true" className="h-px w-7 bg-champagne-400" />
            Từ các hợp tác xã vùng cao Lào Cai
          </p>
          <h2 className="text-gold font-display text-[2rem] font-semibold leading-[1.1] text-balance md:text-5xl">Đặc sản núi rừng, giao tận nhà tại Hà Nội</h2>
          <p className="max-w-md text-sm leading-relaxed text-forest-100 md:text-base">Hàng mua sẵn và nông sản theo mùa, đặt trước để giữ suất.</p>
          <dl className="flex max-w-md divide-x divide-champagne-400/30 rounded-2xl border border-champagne-400/30 bg-forest-950/60 backdrop-blur-sm">
            {[
              [String(listed.length), 'sản phẩm'],
              [String(coopCount), 'HTX'],
              ['Hà Nội', 'nơi giao'],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-1 flex-col-reverse px-3 py-2 text-center">
                <dt className="text-xs text-forest-100">{label}</dt>
                <dd className="font-display text-lg font-semibold text-champagne-200">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={scrollToProducts}
              className="flex min-h-11 items-center gap-1.5 rounded-full bg-champagne-300 px-5 text-sm font-bold text-forest-950 shadow-[0_8px_20px_rgb(201,169,110,0.25)] hover:bg-champagne-200"
            >
              Xem sản phẩm <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button onClick={() => setCustomerTab('season')} className="min-h-11 rounded-full border border-champagne-300/70 px-5 text-sm font-semibold text-champagne-100 hover:bg-white/5">
              Đặt trước theo mùa
            </button>
          </div>
        </div>
        <BrocadeBand className="absolute inset-x-0 bottom-0" />
      </section>

      {/* Tìm và lọc */}
      <section className="space-y-3" aria-label="Tìm và lọc sản phẩm">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-champagne-700" aria-hidden="true" />
          <input
            type="search"
            aria-label="Tìm sản phẩm"
            placeholder="Tìm sản phẩm, vùng, HTX…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-12 w-full rounded-full border border-champagne-300/80 bg-white/90 py-2.5 pr-4 pl-11 text-base text-ink shadow-xs placeholder-muted focus:border-champagne-500 focus:outline-none focus:ring-2 focus:ring-champagne-400/30 md:text-sm"
          />
        </div>
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
      </section>

      {/* Đặt trước theo mùa (ẩn khi đang tìm / lọc) */}
      {!filtering && preorders.length > 0 && (
        <section className="relative overflow-hidden rounded-[28px] border border-champagne-300/80 bg-champagne-50 shadow-[0_10px_30px_rgb(116,90,42,0.10)]">
          <div className="grid items-center gap-4 p-5 sm:grid-cols-[1fr_auto] md:p-7">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-700">Đặt trước theo mùa</p>
              <h3 className="font-display text-2xl font-semibold leading-tight text-forest-900">Giữ suất trước mùa thu hoạch</h3>
              <p className="text-sm text-stone-700">Cọc {state.params.depositPercent}% khi đặt, phần còn lại trả khi hàng sẵn sàng hoặc khi nhận hàng.</p>
              <ul className="flex flex-wrap gap-1.5 pt-1">
                {preorders.map((p) => (
                  <li key={p.id} className="rounded-full border border-champagne-300 bg-white px-3 py-1 text-xs font-semibold text-champagne-900">
                    {p.name}
                  </li>
                ))}
              </ul>
              <button onClick={() => setCustomerTab('season')} className="mt-1 flex min-h-11 items-center gap-1.5 text-sm font-bold text-forest-800 hover:text-forest-600">
                Xem vụ mùa <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
            <div aria-hidden="true" className="mx-auto hidden w-36 rounded-t-full rounded-b-3xl bg-white p-1.5 ring-1 ring-champagne-300 sm:block md:w-44">
              <ProductImage product={preorders[0]} variant="card" className="aspect-[4/5] w-full rounded-t-full rounded-b-[20px]" />
            </div>
          </div>
        </section>
      )}

      {/* Lưới sản phẩm */}
      <section className="space-y-4" aria-labelledby="san-pham" style={{ scrollMarginTop: 'calc(var(--app-header-h, 0px) + 4.5rem)' }}>
        <SectionHeading
          id="san-pham"
          eyebrow={filtering ? 'Kết quả' : 'Tuyển chọn'}
          title="Sản phẩm"
          action={<span className="pb-1 text-xs text-muted">{visible.length} sản phẩm</span>}
        />

        {visible.length === 0 ? (
          <EmptyState
            action={
              <button onClick={clearFilters} className="min-h-11 rounded-full border border-champagne-300 bg-white px-4 text-sm font-semibold text-forest-900 hover:bg-champagne-50">
                Xoá tìm kiếm và bộ lọc
              </button>
            }
          >
            Không có sản phẩm phù hợp.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:gap-x-5 md:gap-y-6 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Cách mua */}
      {!filtering && (
        <section className="space-y-4" aria-labelledby="cach-mua">
          <BrocadeBand tone="light" />
          <SectionHeading id="cach-mua" eyebrow="Cách mua" title="Từ hợp tác xã tới nhà bạn" />
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="flex gap-3 rounded-3xl border border-champagne-200 bg-white/80 p-4">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-900 text-champagne-300 ring-1 ring-champagne-400/60">
                  <Icon size={18} aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-champagne-300 font-display text-xs font-semibold text-forest-950">{i + 1}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold text-ink">{title}</span>
                  <span className="block text-sm leading-relaxed text-stone-600">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Chân trang */}
      <footer className="space-y-3 pt-2 text-center">
        <Ornament className="mx-auto" />
        <div className="flex items-center justify-center gap-2.5">
          <BrandEmblem size={34} />
          <BrandWordmark tone="light" />
        </div>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted">Bản demo – dữ liệu mẫu. Sản phẩm, giá và HTX là mẫu, chờ HTX xác nhận.</p>
      </footer>
    </div>
  );
}

/**
 * Thẻ sản phẩm: khung ảnh hình vòm viền vàng, tên chữ có chân căn giữa, giá và nút thêm vào giỏ.
 * Đã có trong giỏ thì thẻ hiện − / số / + để tăng giảm tại chỗ.
 */
function ProductCard({ product: p }: { product: Product }) {
  const { state } = useStore();
  const { openModal } = useUi();
  const { add, cart, update, remove } = useCartActions();
  const remaining = remainingFor(state, p);
  const soldOut = remaining <= 0 || !isOrderableIn(state, p);
  const coop = state.coops.find((c) => c.id === p.coopId);
  const inCart = soldOut ? undefined : cart.find((l) => l.productId === p.id);

  return (
    <article className="group flex flex-col rounded-[28px] bg-white p-2 shadow-[0_1px_2px_rgb(0,0,0,0.04),0_14px_34px_rgb(31,77,58,0.08)] ring-1 ring-champagne-200/80 transition hover:shadow-[0_1px_2px_rgb(0,0,0,0.04),0_18px_40px_rgb(31,77,58,0.14)]">
      <button
        type="button"
        onClick={() => openModal({ type: 'product_detail', productId: p.id })}
        aria-label={`Xem ${p.name}`}
        className="flex flex-1 flex-col rounded-[22px] text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
      >
        <div className="relative w-full overflow-hidden rounded-t-full rounded-b-[20px] ring-1 ring-champagne-300/70">
          <ProductImage product={p} variant="card" className="aspect-[4/5] w-full transition duration-500 group-hover:scale-[1.03]" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 rounded-t-full rounded-b-[16px] border border-white/70" />
          <div className="absolute inset-x-0 bottom-2.5 flex flex-col items-center gap-1">
            {p.kind === 'preorder' && <span className="rounded-full bg-forest-950/85 px-2.5 py-0.5 text-xs font-bold text-champagne-200 ring-1 ring-champagne-400/60">Đặt trước</span>}
            {soldOut && <span className="rounded-full bg-ink/85 px-2.5 py-0.5 text-xs font-bold text-white">{isOrderableIn(state, p) ? 'Hết hàng' : 'Tạm ngừng bán'}</span>}
          </div>
        </div>
        <div className="flex w-full flex-1 flex-col items-center gap-1 px-1.5 pt-3 pb-1">
          <span className="w-full truncate text-xs font-semibold uppercase tracking-[0.14em] text-champagne-700">{p.region}</span>
          <h3 className="line-clamp-2 font-display text-[1.05rem] font-semibold leading-snug text-ink">{p.name}</h3>
          <span className="w-full truncate text-xs text-muted">{coop?.name}</span>
          {p.kind === 'preorder' && (
            <div className="mt-1 w-full text-left">
              <PreorderProgress product={p} compact />
            </div>
          )}
        </div>
      </button>
      <div className={`mt-1 space-y-2 border-t border-champagne-200/80 pt-2 pb-0.5 ${inCart ? 'px-0' : 'px-0.5 min-[360px]:px-1.5'}`}>
        <div className="flex min-h-11 items-center justify-between gap-1 min-[360px]:gap-2">
          <div className="min-w-0">
            <span className="block font-display text-sm font-semibold tabular-nums text-forest-900 min-[390px]:text-lg">{formatMoney(p.price)}</span>
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-900 text-champagne-200 ring-1 ring-champagne-400/60 transition hover:bg-forest-700 disabled:bg-stone-300 disabled:text-stone-600 disabled:ring-0"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
        {inCart && <QuantityStepper value={inCart.quantity} max={remaining} onChange={(quantity) => update(p.id, { quantity })} onRemove={() => remove(p.id)} itemName={p.name} compact />}
      </div>
    </article>
  );
}
