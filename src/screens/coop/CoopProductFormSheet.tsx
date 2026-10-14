import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { Field, Input, PrimaryButton, Select, Textarea } from '../../components/form';
import { coopCreateProduct, coopRequestContentChange } from '../../domain/productChanges';
import { findProduct } from '../../domain/state';
import { CATEGORY_LABEL, type Category, type OrderKind } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** HTX tạo sản phẩm mới hoặc sửa nội dung sản phẩm; đều sang Chờ duyệt (FR-SP-02, 03, 04). */
export function CoopProductFormSheet({ productId, onClose }: { productId?: string; onClose: () => void }) {
  const { state, run } = useStore();
  const { coopActor, showToast } = useUi();
  const existing = productId ? findProduct(state, productId) : undefined;
  const coop = state.coops.find((c) => c.id === coopActor.id);
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    unit: existing?.unit ?? '',
    category: (existing?.category ?? 'dry') as Category,
    region: existing?.region ?? coop?.region ?? '',
    kind: (existing?.kind ?? 'ready') as OrderKind,
    price: '',
    stock: '',
    slots: '',
    from: '',
    to: '',
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = () => {
    const content = { name: form.name, description: form.description, unit: form.unit, category: form.category, region: form.region };
    const r = existing
      ? run((s, at) => coopRequestContentChange(s, existing.id, coopActor, content, at))
      : run(
          (s, at) =>
            coopCreateProduct(
              s,
              coopActor,
              {
                ...content,
                kind: form.kind,
                price: Number(form.price),
                stockOnHand: Number(form.stock || 0),
                preorder: form.kind === 'preorder' ? { totalSlots: Number(form.slots), deliveryFrom: form.from, deliveryTo: form.to, open: true } : undefined,
              },
              at,
            ),
          (v) => v.state,
        );
    if (!r.ok) return showToast(r.error);
    showToast(existing ? 'Đã gửi duyệt sửa nội dung. Trong lúc chờ, khách vẫn thấy nội dung cũ.' : 'Đã tạo sản phẩm. Trạng thái: Chờ duyệt.');
    onClose();
  };

  return (
    <BottomSheet
      title={existing ? `Sửa nội dung: ${existing.name}` : 'Thêm sản phẩm'}
      onClose={onClose}
      footer={
        <PrimaryButton className="w-full" onClick={save}>
          Gửi duyệt
        </PrimaryButton>
      }
    >
      <Field label="Tên sản phẩm">
        <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quy cách">
          <Input value={form.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="Ví dụ: gói 100 g" />
        </Field>
        <Field label="Nhóm hàng">
          <Select value={form.category} onChange={(e) => set({ category: e.target.value as Category })}>
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Vùng sản xuất">
        <Input value={form.region} onChange={(e) => set({ region: e.target.value })} />
      </Field>
      <Field label="Mô tả">
        <Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      {!existing && (
        <>
          <fieldset className="space-y-1">
            <legend className="text-sm font-semibold text-stone-700">Loại đơn</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['ready', 'preorder'] as OrderKind[]).map((k) => (
                <label key={k} className={`flex min-h-11 items-center justify-center rounded-xl border text-sm ${form.kind === k ? 'border-emerald-700 bg-emerald-50 font-bold' : 'border-stone-200'}`}>
                  <input type="radio" className="sr-only" checked={form.kind === k} onChange={() => set({ kind: k })} />
                  {k === 'ready' ? 'Mua sẵn' : 'Đặt trước'}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá bán (đồng)">
              <Input type="number" min={1} value={form.price} onChange={(e) => set({ price: e.target.value })} />
            </Field>
            {form.kind === 'ready' ? (
              <Field label="Tồn kho">
                <Input type="number" min={0} value={form.stock} onChange={(e) => set({ stock: e.target.value })} />
              </Field>
            ) : (
              <Field label="Số suất">
                <Input type="number" min={1} value={form.slots} onChange={(e) => set({ slots: e.target.value })} />
              </Field>
            )}
          </div>
          {form.kind === 'preorder' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giao từ ngày">
                <Input type="date" value={form.from} onChange={(e) => set({ from: e.target.value })} />
              </Field>
              <Field label="Giao đến ngày">
                <Input type="date" value={form.to} onChange={(e) => set({ to: e.target.value })} />
              </Field>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-stone-500">Sản phẩm mới và nội dung sửa đều cần Admin – Chất lượng duyệt trước khi hiện cho khách.</p>
    </BottomSheet>
  );
}
