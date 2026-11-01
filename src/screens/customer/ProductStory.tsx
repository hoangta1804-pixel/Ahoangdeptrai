import { BookOpen, CalendarDays, ChefHat, Leaf, Package, Users } from 'lucide-react';
import { surveyOf } from '../../data/productSurvey';
import type { Product } from '../../domain/types';

/**
 * Câu chuyện, văn hoá, cách dùng của sản phẩm theo khảo sát của nhóm (persona Mai Hoa: minh bạch nguồn gốc, giá trị văn hoá).
 * Chỉ hiện nội dung dành cho khách; ghi chú nội bộ (cần xác minh, quyền dùng ảnh) không hiện ở đây.
 */
export function ProductStory({ product }: { product: Product }) {
  const s = surveyOf(product);
  if (!s) return null;
  const c = s.content ?? {};
  const season = [s.harvest && `Thu hoạch: ${s.harvest}`, s.sellingMonths && `Mùa bán: ${s.sellingMonths}`, s.market?.peakSeason && `Mua nhiều: ${s.market.peakSeason}`].filter(Boolean).join(' · ');
  const keep = [s.storage && `Bảo quản: ${s.storage}`, s.shelfLife && `Hạn dùng: ${s.shelfLife}`].filter(Boolean).join(' · ');
  const rows = [
    { Icon: BookOpen, label: 'Câu chuyện', text: c.story },
    { Icon: Users, label: 'Văn hoá bản địa', text: c.culture },
    { Icon: ChefHat, label: 'Cách dùng', text: c.usage },
    { Icon: Leaf, label: 'Cách làm', text: c.processing },
    { Icon: CalendarDays, label: 'Mùa vụ', text: season },
    { Icon: Package, label: 'Bảo quản', text: keep },
  ].filter((r) => r.text);
  if (!rows.length) return null;
  return (
    <section aria-labelledby={`story-${product.id}`} className="product-origin-story space-y-4 rounded-2xl border border-forest-200 bg-forest-50/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-forest-200/70 pb-3">
        <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[.16em] text-champagne-700">Nguồn gốc & văn hoá</p><h3 id={`story-${product.id}`} className="font-display text-xl font-semibold text-forest-900">Câu chuyện từ vùng đất</h3></div>
        {s.localName && <p className="rounded-full bg-white/80 px-3 py-1 text-xs text-muted">Tên gọi: {s.localName}</p>}
      </div>
      <dl className="space-y-2.5 text-sm">
        {rows.map(({ Icon, label, text }) => (
          <div key={label} className="flex gap-2.5">
            <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-forest-600" />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-champagne-700">{label}</dt>
              <dd className="leading-relaxed text-stone-700">{text}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted">Theo khảo sát của nhóm, chờ HTX xác nhận.</p>
    </section>
  );
}
