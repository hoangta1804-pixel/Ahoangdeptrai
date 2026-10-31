import { useMemo, useState } from 'react';
import { AlertTriangle, Camera, Search } from 'lucide-react';
import { LAO_CAI_SURVEY, PERSONA_MAI_HOA, type SurveyProduct } from '../../data/laoCaiSurvey';
import { PRODUCT_SURVEY_ID } from '../../data/productSurvey';

const PRIORITY_ORDER = ['Ưu tiên cao', 'Thử đặt trước', 'Cân nhắc', 'Xác minh thêm', 'Chỉ khi có đủ giấy ATTP', 'Chưa nên'];
const ON_SALE = new Set(Object.values(PRODUCT_SURVEY_ID));
const tone = (p?: string) =>
  p === 'Ưu tiên cao' ? 'bg-forest-700 text-white' : p === 'Thử đặt trước' ? 'bg-champagne-200 text-champagne-900' : p === 'Chưa nên' ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-800';

/** Dữ liệu khảo sát "DS sản phẩm Lào Cai" của nhóm: danh mục tiềm năng, giá thị trường Hà Nội, nội dung và bản quyền, persona. */
export function SurveyTab() {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('vi');
    return LAO_CAI_SURVEY.filter((s) => (!priority || (s.priority ?? 'Chưa phân loại') === priority) && (!q || JSON.stringify(s).toLocaleLowerCase('vi').includes(q)))
      .sort((a, b) => rank(a) - rank(b));
  }, [query, priority]);
  const counts = PRIORITY_ORDER.map((p) => [p, LAO_CAI_SURVEY.filter((s) => s.priority === p).length] as const);
  return (
    <div className="space-y-4">
      <p className="rounded-2xl border border-champagne-300 bg-champagne-50 p-3 text-sm text-champagne-950">
        Khảo sát của nhóm ({LAO_CAI_SURVEY.length} dòng, 4 tab bảng tính, đọc 01/11/2026). Chưa được HTX xác nhận. <strong>Chưa sản phẩm nào được phép dùng ảnh/video</strong>: cần ký phiếu cho phép trước.
        {' '}{ON_SALE.size} dòng đã có sản phẩm mẫu trên sàn.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo đề xuất giai đoạn đầu">
        <button onClick={() => setPriority('')} className={`min-h-10 rounded-full px-3 text-sm ${!priority ? 'bg-forest-900 text-white' : 'bg-white'}`}>Tất cả ({LAO_CAI_SURVEY.length})</button>
        {counts.filter(([, n]) => n).map(([p, n]) => (
          <button key={p} onClick={() => setPriority(p)} aria-pressed={priority === p} className={`min-h-10 rounded-full px-3 text-sm ${priority === p ? 'bg-forest-900 text-white' : 'bg-white'}`}>{p} ({n})</button>
        ))}
      </div>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3">
        <Search size={16} aria-hidden="true" />
        <input className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" placeholder="Tìm sản phẩm, vùng, HTX…" aria-label="Tìm trong dữ liệu khảo sát" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="grid gap-3 xl:grid-cols-2">
        {list.map((s) => <SurveyCard key={s.id} s={s} />)}
      </div>
      {!list.length && <p className="text-sm text-muted">Không có dòng nào khớp.</p>}
      <details className="admin-card rounded-2xl border bg-white p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">Persona: {PERSONA_MAI_HOA.name} – {PERSONA_MAI_HOA.segment}</summary>
        <div className="mt-2 space-y-3 text-sm">
          <p>{PERSONA_MAI_HOA.profile}.</p>
          <p><strong>Mức chi:</strong> {PERSONA_MAI_HOA.spending}</p>
          <div><strong>Quan tâm nhất:</strong><ol className="ml-5 list-decimal">{PERSONA_MAI_HOA.priorities.map((p) => <li key={p}>{p}</li>)}</ol></div>
          <div><strong>Đề xuất cho app:</strong><ul className="ml-5 list-disc">{PERSONA_MAI_HOA.appRecommendations.map((p) => <li key={p}>{p}</li>)}</ul></div>
          <p className="flex items-start gap-2 text-rose-800"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Combo ví dụ có rượu ngô và thịt gác bếp: rượu nằm ngoài phạm vi, thịt gác bếp chỉ bán khi đủ giấy ATTP (tab 1).</p>
        </div>
      </details>
    </div>
  );
}

function rank(s: SurveyProduct) {
  const i = PRIORITY_ORDER.indexOf(s.priority ?? '');
  return i < 0 ? PRIORITY_ORDER.length : i;
}

function SurveyCard({ s }: { s: SurveyProduct }) {
  const m = s.market, c = s.content;
  const facts = [
    ['Vùng', s.region], ['Nhóm hàng', s.group], ['Thu hoạch', s.harvest], ['Mùa bán', s.sellingMonths], ['Quy cách', [s.packaging, s.packSize].filter(Boolean).join(' · ')],
    ['Hạn dùng', s.shelfLife], ['Bảo quản', s.storage], ['Vận chuyển 1–2 ngày', s.shipping],
    ['Giá tại vườn', m?.farmGate], ['Giá sỉ', m?.wholesale], ['Giá lẻ Hà Nội', m?.retailHanoi], ['Mốc giá', m?.priceNotes], ['Mua nhiều', m?.peakSeason],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <article className="admin-card space-y-2 rounded-2xl border bg-white p-4 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-forest-900">{s.name}</h3>
          {s.localName && <p className="text-xs text-muted">{s.localName}</p>}
        </div>
        <div className="flex flex-wrap gap-1">
          {s.priority && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone(s.priority)}`}>{s.priority}</span>}
          {ON_SALE.has(s.id) && <span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-800">Đang có trên sàn</span>}
        </div>
      </header>
      <dl className="grid gap-x-3 gap-y-1 sm:grid-cols-[auto_1fr]">
        {facts.map(([k, v]) => <div key={k} className="contents"><dt className="text-xs font-semibold text-champagne-700">{k}</dt><dd className="text-stone-700">{v}</dd></div>)}
      </dl>
      {s.notes && <p className="text-stone-700"><strong>Ghi chú:</strong> {s.notes}</p>}
      {c?.toVerify && <p className="flex items-start gap-2 text-champagne-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" />Cần xác minh: {c.toVerify}</p>}
      {c?.mediaRights && <p className="flex items-start gap-2 text-stone-600"><Camera size={15} className="mt-0.5 shrink-0" />Ảnh: {c.mediaRights}{c.photoOwner ? ` Đề xuất: ${c.photoOwner}.` : ''}</p>}
    </article>
  );
}
