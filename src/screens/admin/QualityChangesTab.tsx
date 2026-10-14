import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { DangerButton, Input, PrimaryButton } from '../../components/form';
import { formatMoney } from '../../domain/pricing';
import { decideProductChange } from '../../domain/productChanges';
import { findProduct, formatDateKey } from '../../domain/state';
import type { ProductChangeRequest } from '../../domain/types';
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
  return c.type === 'price'
    ? `${coop?.name}: ${p?.name} – đổi giá ${formatMoney(p?.price ?? 0)} → ${formatMoney(c.newPrice!)}`
    : `${coop?.name}: ${p?.name} – báo thu hoạch ${c.preorder?.totalSlots} suất, giao ${formatDateKey(c.preorder!.deliveryFrom)} – ${formatDateKey(c.preorder!.deliveryTo)}`;
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
