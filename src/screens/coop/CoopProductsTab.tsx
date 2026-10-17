import { useState } from 'react';
import { AlertTriangle, Layers, Plus } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { Field, Input, PrimaryButton, SecondaryButton } from '../../components/form';
import { PhotoPicker } from '../../components/PhotoPicker';
import { ProductImage } from '../../components/ProductImage';
import { formatMoney } from '../../domain/pricing';
import { coopRequestCertification, coopRequestExpress, coopRequestPreorder, coopRequestPriceChange, coopSetProductHidden, coopUpdateStock } from '../../domain/productChanges';
import { formatDateKey, remainingFor } from '../../domain/state';
import { heldQuantity, isLowStock, reservedSlots } from '../../domain/stock';
import { CATEGORY_LABEL, ORDER_KIND_LABEL, PRODUCT_CHANGE_LABEL, PRODUCT_STATUS_LABEL, type Product } from '../../domain/types';
import { familyOf, groupFamilies, MAX_VARIANTS } from '../../domain/variants';
import { useStore } from '../../store/AppDataContext';

/**
 * Sản phẩm của HTX (FR-SP-07, FR-SP-09, L12).
 * Tồn kho có hiệu lực ngay; đổi giá và báo thu hoạch phải chờ Admin – Chất lượng duyệt (trong lúc chờ vẫn bán giá cũ).
 * Mỗi quy cách (hộp 300 g, 500 g…) là một thẻ riêng, các quy cách của cùng sản phẩm đứng liền nhau.
 */
export function CoopProductsTab() {
  const { state } = useStore();
  const { coopId, openModal } = useUi();
  const mine = groupFamilies(state.products.filter((p) => p.coopId === coopId)).flat();
  return (
    <div className="space-y-3">
      <PrimaryButton className="flex w-full items-center justify-center gap-2 lg:w-auto lg:px-6" onClick={() => openModal({ type: 'coop_product_form' })}>
        <Plus size={16} /> Thêm sản phẩm
      </PrimaryButton>
      {mine.length === 0 ? (
        <EmptyState>HTX chưa có sản phẩm.</EmptyState>
      ) : (
        <div className="grid items-start gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {mine.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const { state, run } = useStore();
  const { coopActor, showToast, openModal } = useUi();
  const [cert, setCert] = useState({ open: false, label: '', issuer: '', validUntil: '', photos: [] as string[] });
  const [stock, setStock] = useState(String(p.stockOnHand));
  const [price, setPrice] = useState('');
  const [slots, setSlots] = useState(String(p.preorder?.totalSlots ?? ''));
  const [from, setFrom] = useState(p.preorder?.deliveryFrom ?? '');
  const [to, setTo] = useState(p.preorder?.deliveryTo ?? '');
  const requests = state.productChanges.filter((c) => c.productId === p.id);
  const held = heldQuantity(p.id, state.orders);
  const available = remainingFor(state, p);
  const threshold = p.lowStockThreshold ?? state.params.lowStockThreshold;
  const family = familyOf(state, p).filter((v) => v.status !== 'rejected');

  const act = (op: Parameters<typeof run>[0], ok: string) => {
    const r = run(op);
    showToast(r.ok ? ok : r.error);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3.5">
      <div className="flex gap-3">
        <ProductImage product={p} className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-ink">{p.name}</h4>
          <p className="text-sm text-stone-600">
            {ORDER_KIND_LABEL[p.kind]} · {CATEGORY_LABEL[p.category]} · {formatMoney(p.price)}/{p.unit}
          </p>
          <p className="text-xs text-muted">
            <span className="font-semibold text-stone-800">{PRODUCT_STATUS_LABEL[p.status]}</span> · Hoả tốc: {p.expressApproved ? 'đã duyệt' : 'chưa duyệt'}
          </p>
        </div>
      </div>
      {family.length > 1 && (
        <p className="flex flex-wrap items-center gap-1 text-xs">
          <span className="font-semibold text-stone-700">Quy cách:</span>
          {family.map((v) => (
            <span key={v.id} className={`rounded-full px-2 py-0.5 font-semibold ${v.id === p.id ? 'bg-forest-900 text-champagne-100' : 'border border-champagne-300 bg-champagne-50 text-champagne-900'}`}>
              {v.unit}
            </span>
          ))}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <SecondaryButton onClick={() => openModal({ type: 'coop_product_form', productId: p.id })}>Sửa nội dung</SecondaryButton>
        {(p.status === 'active' || p.status === 'hidden') && (
          <SecondaryButton onClick={() => act((s, t) => coopSetProductHidden(s, p.id, coopActor, p.status === 'active', t), p.status === 'active' ? 'Đã ẩn sản phẩm.' : 'Đã hiện lại sản phẩm.')}>
            {p.status === 'active' ? 'Ẩn sản phẩm' : 'Hiện lại'}
          </SecondaryButton>
        )}
        {p.kind === 'ready' && (
          <SecondaryButton onClick={() => act((s, t) => coopRequestExpress(s, p.id, coopActor, !p.expressApproved, t), 'Đã gửi duyệt cờ hoả tốc.')}>
            {p.expressApproved ? 'Xin tắt hoả tốc' : 'Xin bật hoả tốc'}
          </SecondaryButton>
        )}
        <SecondaryButton onClick={() => setCert({ ...cert, open: !cert.open })}>Khai chứng nhận</SecondaryButton>
        {p.status !== 'rejected' && family.length < MAX_VARIANTS && (
          <SecondaryButton className="flex items-center gap-1.5" onClick={() => openModal({ type: 'coop_variant_form', productId: p.id })}>
            <Layers size={15} aria-hidden="true" /> Thêm quy cách
          </SecondaryButton>
        )}
      </div>

      {cert.open && (
        <div className="space-y-2 rounded-xl bg-stone-50 p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Tên chứng nhận">
              <Input value={cert.label} onChange={(e) => setCert({ ...cert, label: e.target.value })} placeholder="Ví dụ: VietGAP" />
            </Field>
            <Field label="Nơi cấp">
              <Input value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} />
            </Field>
            <Field label="Hiệu lực đến">
              <Input type="date" value={cert.validUntil} onChange={(e) => setCert({ ...cert, validUntil: e.target.value })} />
            </Field>
          </div>
          <PhotoPicker photos={cert.photos} onChange={(photos) => setCert({ ...cert, photos })} max={1} />
          <PrimaryButton
            className="w-full"
            onClick={() => {
              const r = run((s, t) => coopRequestCertification(s, p.id, coopActor, { label: cert.label, issuer: cert.issuer, validUntil: cert.validUntil, photo: cert.photos[0] }, t));
              showToast(r.ok ? 'Đã gửi chứng nhận chờ xác minh.' : r.error);
              if (r.ok) setCert({ open: false, label: '', issuer: '', validUntil: '', photos: [] });
            }}
          >
            Gửi xác minh
          </PrimaryButton>
        </div>
      )}

      {p.kind === 'ready' ? (
        <div className="space-y-2 rounded-xl bg-stone-50 p-3">
          <p className="text-sm text-stone-700">
            Tồn kho {p.stockOnHand} · đang giữ cho đơn {held} · khả dụng <strong>{available}</strong>
          </p>
          {isLowStock(available, threshold) && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-champagne-800">
              <AlertTriangle size={16} /> Tồn thấp (ngưỡng {threshold})
            </p>
          )}
          <div className="flex items-end gap-2">
            <Field label="Tồn kho mới (có hiệu lực ngay)">
              <Input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
            </Field>
            <SecondaryButton onClick={() => act((s, t) => coopUpdateStock(s, p.id, coopActor, Number(stock), t), 'Đã cập nhật tồn kho.')}>Lưu</SecondaryButton>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl bg-stone-50 p-3">
          <p className="text-sm text-stone-700">
            {p.preorder ? (
              <>
                Đang mở {p.preorder.totalSlots} suất · đã giữ {reservedSlots(p.id, state.orders)} · giao {formatDateKey(p.preorder.deliveryFrom)} – {formatDateKey(p.preorder.deliveryTo)}
              </>
            ) : (
              'Chưa mở đặt trước.'
            )}
          </p>
          <h5 className="text-sm font-bold text-stone-800">Báo thu hoạch / mở đợt đặt trước (chờ duyệt)</h5>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Số suất">
              <Input type="number" min={1} value={slots} onChange={(e) => setSlots(e.target.value)} />
            </Field>
            <Field label="Giao từ">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Giao đến">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <PrimaryButton
            className="w-full"
            onClick={() => act((s, t) => coopRequestPreorder(s, p.id, coopActor, { totalSlots: Number(slots), deliveryFrom: from, deliveryTo: to, open: true }, '', t), 'Đã gửi báo thu hoạch. Trạng thái: Chờ duyệt.')}
          >
            Gửi duyệt
          </PrimaryButton>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Field label="Đề xuất giá mới (chờ duyệt, trong lúc chờ bán giá cũ)">
          <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(p.price)} />
        </Field>
        <SecondaryButton onClick={() => act((s, t) => coopRequestPriceChange(s, p.id, coopActor, Number(price), '', t), 'Đã gửi đề xuất giá. Trạng thái: Chờ duyệt.')}>Gửi duyệt</SecondaryButton>
      </div>

      {requests.length > 0 && (
        <ul className="space-y-1 text-sm">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg bg-stone-50 px-2 py-1.5">
              {PRODUCT_CHANGE_LABEL[r.type]}
              {r.type === 'price' && ` → ${formatMoney(r.newPrice!)}`}
              {r.type === 'preorder' && r.preorder && ` ${r.preorder.totalSlots} suất (${formatDateKey(r.preorder.deliveryFrom)} – ${formatDateKey(r.preorder.deliveryTo)})`}
              {r.type === 'express' && (r.express ? ': bật' : ': tắt')}
              {r.type === 'cert' && r.cert && `: ${r.cert.label}`}
              {' · '}
              <strong className={r.status === 'pending' ? 'text-champagne-800' : r.status === 'approved' ? 'text-forest-700' : 'text-rose-700'}>
                {r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : `Từ chối: ${r.rejectReason}`}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
