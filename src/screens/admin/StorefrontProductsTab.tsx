import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, ImageOff } from 'lucide-react';
import { BottomSheet } from '../../components/BottomSheet';
import { productImageSources } from '../../lib/productImages';
import { api } from '../../store/backend';
import { Field, Input, Select, Textarea, PrimaryButton, SecondaryButton, DangerButton } from '../../components/form';
import type { Product, ProductStatus, VariantStatus, ThemeId } from '../../mock/types';

/**
 * Admin — Sản phẩm hiển thị trên cửa hàng: xem danh sách, thêm, sửa, ẩn/hiện, xoá.
 * Dữ liệu lưu trên máy chủ (/api/v1/storefront/products) — cửa hàng đọc cùng nguồn này.
 */

const CATEGORY_LABEL: Record<Product['category'], string> = {
  tea: 'Trà & chè',
  dry: 'Đồ khô',
  fresh: 'Nông sản tươi',
  processed: 'Chế biến',
  gift: 'Quà tặng',
};
const STATUS_LABEL: Record<ProductStatus, string> = { active: 'Đang bán', hidden: 'Đang ẩn', discontinued: 'Ngừng bán' };
const VARIANT_STATUS_LABEL: Record<VariantStatus, string> = { in_stock: 'Còn hàng', preorder: 'Đặt trước', out_of_stock: 'Hết hàng' };
const THEME_LABEL: Record<ThemeId, string> = { in_season: 'Đang vào vụ', best_seller: 'Bán chạy', gift: 'Quà biếu' };
const REGIONS = ['Bắc Hà', 'Sa Pa', 'Mường Khương', 'Suối Giàng', 'Tú Lệ', 'Bảo Hà', 'Bảo Yên', 'Lào Cai'];
const money = (n: number) => n.toLocaleString('vi-VN') + '₫';

interface VariantForm { id?: string; label: string; price: string; stock: string; status: VariantStatus }
interface ProductForm {
  id?: string;
  name: string;
  slug: string;
  region: string;
  category: Product['category'];
  status: ProductStatus;
  shortDescription: string;
  mainImageUrl: string;
  themes: ThemeId[];
  variants: VariantForm[];
}

const emptyForm = (): ProductForm => ({
  name: '',
  slug: '',
  region: 'Lào Cai',
  category: 'dry',
  status: 'active',
  shortDescription: '',
  mainImageUrl: '',
  themes: [],
  variants: [{ label: '', price: '', stock: '0', status: 'in_stock' }],
});

const mainImage = (p: Product) => p.media.find((m) => m.type === 'photo' && m.group === 'main')?.url ?? '';

const toForm = (p: Product): ProductForm => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  region: p.region,
  category: p.category,
  status: p.status,
  shortDescription: p.shortDescription ?? '',
  mainImageUrl: mainImage(p),
  themes: p.themeMappings.filter((t) => t.isActive).map((t) => t.themeId),
  variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: String(v.price), stock: String(v.stock), status: v.status })),
});

/** Ảnh thu nhỏ: thử lần lượt các nguồn (giống cửa hàng), hết nguồn thì hiện ô trống. */
function Thumb({ sources, alt }: { sources: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const key = sources.join('|');
  useEffect(() => {
    setIdx(0);
  }, [key]);
  const url = sources[idx];
  if (!url)
    return (
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-400" aria-label="Chưa có ảnh">
        <ImageOff size={18} />
      </span>
    );
  return <img src={url} alt={alt} onError={() => setIdx((i) => i + 1)} className="h-14 w-14 shrink-0 rounded-xl object-cover" />;
}

export function StorefrontProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [form, setForm] = useState<ProductForm | null>(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api<{ products: Product[] }>('/api/v1/storefront/products');
      setProducts(r.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => (statusFilter === 'all' || p.status === statusFilter) && (!q || `${p.name} ${p.region}`.toLowerCase().includes(q)),
    );
  }, [products, query, statusFilter]);

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((p) => p.status === 'active').length,
      hidden: products.filter((p) => p.status === 'hidden').length,
      discontinued: products.filter((p) => p.status === 'discontinued').length,
    }),
    [products],
  );

  const payload = (f: ProductForm) => ({
    name: f.name,
    slug: f.slug,
    region: f.region,
    category: f.category,
    status: f.status,
    shortDescription: f.shortDescription,
    mainImageUrl: f.mainImageUrl.trim(),
    themes: f.themes,
    variants: f.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      label: v.label,
      price: Number(v.price),
      stock: Number(v.stock),
      status: v.status,
    })),
  });

  const save = async () => {
    if (!form) return;
    setFormError('');
    if (form.name.trim().length < 2) return setFormError('Vui lòng nhập tên sản phẩm.');
    for (const [i, v] of form.variants.entries()) {
      if (!v.label.trim()) return setFormError(`Quy cách #${i + 1}: chưa nhập tên quy cách.`);
      if (!Number.isInteger(Number(v.price)) || Number(v.price) <= 0) return setFormError(`Quy cách "${v.label}": giá phải là số nguyên dương.`);
      if (!Number.isInteger(Number(v.stock)) || Number(v.stock) < 0) return setFormError(`Quy cách "${v.label}": tồn kho không hợp lệ.`);
    }
    setBusy(true);
    try {
      if (form.id) await api(`/api/v1/storefront/products/${form.id}`, { product: payload(form) }, 'PUT');
      else await api('/api/v1/storefront/products', { product: payload(form) }, 'POST');
      flash(form.id ? `Đã lưu "${form.name}".` : `Đã thêm "${form.name}".`);
      setForm(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Không lưu được.');
    } finally {
      setBusy(false);
    }
  };

  const toggleHidden = async (p: Product) => {
    const next = { ...toForm(p), status: (p.status === 'hidden' ? 'active' : 'hidden') as ProductStatus };
    try {
      await api(`/api/v1/storefront/products/${p.id}`, { product: payload(next) }, 'PUT');
      flash(next.status === 'hidden' ? `Đã ẩn "${p.name}" khỏi cửa hàng.` : `Đã hiện lại "${p.name}".`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không đổi được trạng thái.');
    }
  };

  const remove = async (p: Product) => {
    setBusy(true);
    try {
      await api(`/api/v1/storefront/products/${p.id}`, undefined, 'DELETE');
      flash(`Đã xoá "${p.name}".`);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không xoá được.');
    } finally {
      setBusy(false);
    }
  };

  const setVariant = (i: number, patch: Partial<VariantForm>) =>
    setForm((f) => (f ? { ...f, variants: f.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) } : f));

  return (
    <section className="sp-admin space-y-4" aria-labelledby="sp-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="sp-heading" className="text-lg font-bold text-forest-950">Sản phẩm trên cửa hàng</h2>
          <p className="text-sm text-stone-600">Thêm, sửa, ẩn hoặc xoá — cửa hàng cập nhật ngay sau khi lưu.</p>
        </div>
        <PrimaryButton onClick={() => { setFormError(''); setForm(emptyForm()); }}>
          <Plus size={16} className="mr-1.5 inline" /> Thêm sản phẩm
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Tìm sản phẩm</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc vùng…" className="pl-9" />
        </label>
        <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1.5">
          {(['all', 'active', 'hidden', 'discontinued'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={statusFilter === k}
              onClick={() => setStatusFilter(k)}
              className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                statusFilter === k ? 'border-[#2A6F50] bg-[#2A6F50] text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-[#2A6F50]'
              }`}
            >
              {k === 'all' ? 'Tất cả' : STATUS_LABEL[k]} ({counts[k]})
            </button>
          ))}
        </div>
      </div>

      {notice && <p role="status" className="rounded-xl bg-[#EAF4EE] px-4 py-2.5 text-sm font-semibold text-[#2F6B4F]">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p role="status" className="p-6 text-center text-sm text-stone-600">Đang tải sản phẩm…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">Không có sản phẩm phù hợp.</p>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {shown.map((p) => {
            const prices = p.variants.map((v) => v.price);
            const min = Math.min(...prices), max = Math.max(...prices);
            const stock = p.variants.reduce((s, v) => s + v.stock, 0);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                <Thumb sources={productImageSources(p)} alt={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-600">
                    {p.region} · {CATEGORY_LABEL[p.category]} · {p.variants.length} quy cách · tồn {stock}
                  </p>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums text-stone-900">
                  {min === max ? money(min) : `${money(min)} – ${money(max)}`}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    p.status === 'active' ? 'bg-[#EAF4EE] text-[#2F6B4F]' : p.status === 'hidden' ? 'bg-stone-100 text-stone-700' : 'bg-champagne-50 text-champagne-700'
                  }`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => { setFormError(''); setForm(toForm(p)); }} aria-label={`Sửa ${p.name}`} title="Sửa" className="sp-icon">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => void toggleHidden(p)} aria-label={p.status === 'hidden' ? `Hiện ${p.name}` : `Ẩn ${p.name}`} title={p.status === 'hidden' ? 'Hiện trên cửa hàng' : 'Ẩn khỏi cửa hàng'} className="sp-icon">
                    {p.status === 'hidden' ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(p)} aria-label={`Xoá ${p.name}`} title="Xoá" className="sp-icon sp-icon--danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Hộp xác nhận xoá */}
      {confirmDelete && (
        <BottomSheet
          title="Xoá sản phẩm?"
          onClose={() => setConfirmDelete(null)}
          footer={
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setConfirmDelete(null)}>Huỷ</SecondaryButton>
              <DangerButton disabled={busy} onClick={() => void remove(confirmDelete)}>{busy ? 'Đang xoá…' : 'Xoá vĩnh viễn'}</DangerButton>
            </div>
          }
        >
          <p className="text-sm text-stone-600">
            "{confirmDelete.name}" sẽ bị xoá khỏi cửa hàng và không khôi phục được. Nếu chỉ muốn tạm dừng bán, hãy chọn <strong>Ẩn</strong>.
          </p>
        </BottomSheet>
      )}

      {/* Form thêm / sửa */}
      {form && (
        <BottomSheet
          wide
          title={form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
          onClose={() => setForm(null)}
          footer={
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setForm(null)}>Huỷ</SecondaryButton>
              <PrimaryButton disabled={busy} onClick={() => void save()}>{busy ? 'Đang lưu…' : form.id ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</PrimaryButton>
            </div>
          }
        >

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên sản phẩm *">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} autoFocus />
              </Field>
              <Field label="Đường dẫn (slug)" hint="Để trống để tự tạo từ tên.">
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="vd: che-shan-tuyet" />
              </Field>
              <Field label="Vùng *">
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} list="sp-regions" />
                <datalist id="sp-regions">{REGIONS.map((r) => <option key={r} value={r} />)}</datalist>
              </Field>
              <Field label="Nhóm hàng">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Trạng thái">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Ảnh chính (đường dẫn)" hint="Bắt đầu bằng / (ảnh trong web) hoặc https://">
                <div className="flex items-center gap-2">
                  <Input value={form.mainImageUrl} onChange={(e) => setForm({ ...form, mainImageUrl: e.target.value })} placeholder="/images/stitch/tea.jpg" />
                  <Thumb sources={form.mainImageUrl.trim() ? [form.mainImageUrl.trim()] : []} alt="Xem trước ảnh" />
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Mô tả ngắn">
                  <Textarea rows={3} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} maxLength={600} />
                </Field>
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 text-sm font-semibold text-stone-800">Hiện trong mục trang chủ</legend>
                <div className="flex flex-wrap gap-4">
                  {(Object.keys(THEME_LABEL) as ThemeId[]).map((t) => (
                    <label key={t} className="flex min-h-10 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[#2A6F50]"
                        checked={form.themes.includes(t)}
                        onChange={(e) => setForm({ ...form, themes: e.target.checked ? [...form.themes, t] : form.themes.filter((x) => x !== t) })}
                      />
                      {THEME_LABEL[t]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-stone-800">Quy cách & giá *</legend>
              <div className="space-y-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-stone-200 p-2.5 sm:grid-cols-[2fr_1fr_1fr_1.2fr_auto] sm:items-end">
                    <Field label="Tên quy cách"><Input value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="Túi 500g" /></Field>
                    <Field label="Giá (đ)"><Input inputMode="numeric" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value.replace(/\D/g, '') })} /></Field>
                    <Field label="Tồn kho"><Input inputMode="numeric" value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value.replace(/\D/g, '') })} /></Field>
                    <Field label="Tình trạng">
                      <Select value={v.status} onChange={(e) => setVariant(i, { status: e.target.value as VariantStatus })}>
                        {Object.entries(VARIANT_STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </Select>
                    </Field>
                    <button
                      type="button"
                      disabled={form.variants.length === 1}
                      onClick={() => setForm({ ...form, variants: form.variants.filter((_, k) => k !== i) })}
                      aria-label={`Xoá quy cách ${v.label || i + 1}`}
                      className="sp-icon sp-icon--danger disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {form.variants.length < 10 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, variants: [...form.variants, { label: '', price: '', stock: '0', status: 'in_stock' }] })}
                  className="mt-2 min-h-10 rounded-xl border border-dashed border-[#2A6F50] px-3 text-sm font-semibold text-[#2A6F50] hover:bg-[#EAF4EE]"
                >
                  <Plus size={15} className="mr-1 inline" /> Thêm quy cách
                </button>
              )}
            </fieldset>

            {formError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{formError}</p>}
        </BottomSheet>
      )}
    </section>
  );
}
