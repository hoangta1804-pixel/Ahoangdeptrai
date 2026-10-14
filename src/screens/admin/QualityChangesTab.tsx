import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { DangerButton, Input, PrimaryButton } from '../../components/form';
import { formatMoney } from '../../domain/pricing';
import { decideProductChange } from '../../domain/productChanges';
import { findProduct, formatDateKey } from '../../domain/state';
import { PRODUCT_CHANGE_LABEL, type ProductChangeRequest } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Admin – Chất lượng duyệt đổi giá và báo thu hoạch của HTX; từ chối bắt buộc lý do (FR-SP-04, L12). */
export function QualityChangesTab() {
  const { state } = useStore();
  const pending = state.productChanges.filter((c) => c.status === 'pending');
  const done = state.productChanges.filter((c) => c.status !== 'pending');
  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold">Chờ duyệt ({pending.length})</h3>
      {pending.length === 0 ? <EmptyState>Không có yêu cầu chờ duyệt.</EmptyState> : pending.map((c) => <ChangeRow key={c.id} req={c} />)}
      {done.length > 0 && (
        <>
          <h3 className="text-base font-bold">Đã xử lý</h3>
          <ul className="space-y-1 text-sm">
            {done.map((c) => (
              <li key={c.id} className="rounded-xl bg-white px-3 py-2">
                {describe(c, state)} · {c.status === 'approved' ? 'Đã duyệt' : `Từ chối: ${c.rejectReason}`} · {c.decidedBy}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function describe(c: ProductChangeRequest, state: ReturnType<typeof useStore>['state']): string {
  const p = findProduct(state, c.productId);
  const coop = state.coops.find((x) => x.id === c.coopId);
  const head = `${coop?.name}: ${p?.name} – ${PRODUCT_CHANGE_LABEL[c.type]}`;
  switch (c.type) {
    case 'price':
      return `${head} ${formatMoney(p?.price ?? 0)} → ${formatMoney(c.newPrice!)}`;
    case 'preorder':
      return `${head}: ${c.preorder?.totalSlots} suất, giao ${formatDateKey(c.preorder!.deliveryFrom)} – ${formatDateKey(c.preorder!.deliveryTo)}`;
    case 'new_product':
      return `${head}: ${p?.unit}, ${formatMoney(p?.price ?? 0)}, vùng ${p?.region}. ${p?.description ?? ''}`;
    case 'content':
      return `${head}: tên "${c.content?.name}", quy cách "${c.content?.unit}", vùng "${c.content?.region}". ${c.content?.description ?? ''}`;
    case 'express':
      return `${head}: ${c.express ? 'bật' : 'tắt'}`;
    case 'cert':
      return `${head}: ${c.cert?.label} · ${c.cert?.issuer} · hiệu lực đến ${c.cert?.validUntil}`;
  }
}

function ChangeRow({ req }: { req: ProductChangeRequest }) {
  const { state, run } = useStore();
  const { adminActor, showToast } = useUi();
  const [reason, setReason] = useState('');
  const decide = (approve: boolean) => {
    const r = run((s, t) => decideProductChange(s, req.id, adminActor, approve, reason, t));
    showToast(r.ok ? (approve ? 'Đã duyệt.' : 'Đã từ chối.') : r.error);
  };
  return (
    <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3 text-sm">
      <p className="font-semibold">{describe(req, state)}</p>
      {req.cert?.photo && <img src={req.cert.photo} alt="Ảnh chứng nhận" className="h-24 rounded-lg border border-stone-200 object-cover" />}
      <p className="text-stone-500">Gửi lúc {new Date(req.createdAt).toLocaleString('vi-VN')}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Input aria-label="Lý do từ chối" placeholder="Lý do (bắt buộc khi từ chối)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DangerButton onClick={() => decide(false)}>Từ chối</DangerButton>
        <PrimaryButton onClick={() => decide(true)}>Duyệt</PrimaryButton>
      </div>
    </div>
  );
}
