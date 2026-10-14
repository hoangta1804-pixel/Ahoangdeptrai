import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { Field, Input, PrimaryButton, SecondaryButton } from '../../components/form';
import { ProductImage } from '../../components/ProductImage';
import { formatMoney } from '../../domain/pricing';
import { coopRequestPreorder, coopRequestPriceChange, coopUpdateStock } from '../../domain/productChanges';
import { formatDateKey, remainingFor } from '../../domain/state';
import { heldQuantity, isLowStock, reservedSlots } from '../../domain/stock';
import { CATEGORY_LABEL, ORDER_KIND_LABEL, type Product } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/**
 * Sản phẩm của HTX (FR-SP-07, FR-SP-09, L12).
 * Tồn kho có hiệu lực ngay; đổi giá và báo thu hoạch phải chờ Admin – Chất lượng duyệt (trong lúc chờ vẫn bán giá cũ).
 */
export function CoopProductsTab() {
  const { state } = useStore();
  const { coopId } = useUi();
  const mine = state.products.filter((p) => p.coopId === coopId);
  if (mine.length === 0) return <EmptyState>HTX chưa có sản phẩm.</EmptyState>;
  return (
    <div className="space-y-3">
      {mine.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const { state, run } = useStore();
  const { coopActor, showToast } = useUi();
  const [stock, setStock] = useState(String(p.stockOnHand));
  const [price, setPrice] = useState('');
  const [slots, setSlots] = useState(String(p.preorder?.totalSlots ?? ''));
  const [from, setFrom] = useState(p.preorder?.deliveryFrom ?? '');
  const [to, setTo] = useState(p.preorder?.deliveryTo ?? '');
  const requests = state.productChanges.filter((c) => c.productId === p.id);
  const held = heldQuantity(p.id, state.orders);
  const available = remainingFor(state, p);
  const threshold = p.lowStockThreshold ?? state.params.lowStockThreshold;

  const act = (op: Parameters<typeof run>[0], ok: string) => {
    const r = run(op);
    showToast(r.ok ? ok : r.error);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3.5">
      <div className="flex gap-3">
        <ProductImage product={p} className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-stone-900">{p.name}</h4>
          <p className="text-sm text-stone-600">
            {ORDER_KIND_LABEL[p.kind]} · {CATEGORY_LABEL[p.category]} · {formatMoney(p.price)}/{p.unit}
          </p>
          <p className="text-xs text-stone-500">Hoả tốc: {p.expressApproved ? 'đã duyệt' : 'chưa duyệt'}</p>
        </div>
      </div>

      {p.kind === 'ready' ? (
        <div className="space-y-2 rounded-xl bg-stone-50 p-3">
          <p className="text-sm text-stone-700">
            Tồn kho {p.stockOnHand} · đang giữ cho đơn {held} · khả dụng <strong>{available}</strong>
          </p>
          {isLowStock(available, threshold) && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
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
              {r.type === 'price' ? `Đổi giá → ${formatMoney(r.newPrice!)}` : `Báo thu hoạch ${r.preorder?.totalSlots} suất (${formatDateKey(r.preorder!.deliveryFrom)} – ${formatDateKey(r.preorder!.deliveryTo)})`}
              {' · '}
              <strong className={r.status === 'pending' ? 'text-amber-800' : r.status === 'approved' ? 'text-emerald-800' : 'text-rose-700'}>
                {r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : `Từ chối: ${r.rejectReason}`}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
