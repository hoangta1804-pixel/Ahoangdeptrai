import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { Select, SecondaryButton } from '../../components/form';
import { Stars } from '../../components/Stars';
import { cskhSetReviewVisibility, REVIEW_HIDE_REASONS } from '../../domain/reviews';
import type { Review } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Admin – CSKH kiểm duyệt đánh giá (FR-CSKH-06): ẩn phải ghi lý do, không được ẩn vì sao thấp. */
export function CskhReviewsTab() {
  const { state } = useStore();
  if (state.reviews.length === 0) return <EmptyState>Chưa có đánh giá nào.</EmptyState>;
  return (
    <div className="space-y-3">
      {state.reviews.map((r) => (
        <ReviewRow key={r.id} review={r} />
      ))}
    </div>
  );
}

function ReviewRow({ review: r }: { review: Review }) {
  const { state, run } = useStore();
  const { adminActor, showToast } = useUi();
  const [reason, setReason] = useState('');
  const product = state.products.find((p) => p.id === r.productId);
  const act = (hide: boolean) => {
    const res = run((s, at) => cskhSetReviewVisibility(s, adminActor, r.id, hide, reason, at));
    showToast(res.ok ? (hide ? 'Đã ẩn đánh giá.' : 'Đã hiện lại đánh giá.') : res.error);
  };
  return (
    <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3 text-sm">
      <p className="flex flex-wrap items-center gap-2">
        <Stars value={r.stars} /> <strong>{product?.name}</strong> · đơn {r.orderId}
        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold">{r.status === 'visible' ? 'Đang hiển thị' : `Đã ẩn: ${r.hiddenReason}`}</span>
      </p>
      {r.comment && <p className="text-stone-700">{r.comment}</p>}
      {r.coopReply && <p className="border-l-2 border-emerald-700 pl-2">HTX: {r.coopReply}</p>}
      {r.status === 'visible' ? (
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Lý do ẩn" value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-sm">
            <option value="">— Lý do ẩn (không được ẩn vì sao thấp) —</option>
            {REVIEW_HIDE_REASONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
          <SecondaryButton onClick={() => act(true)}>Ẩn đánh giá</SecondaryButton>
        </div>
      ) : (
        <SecondaryButton onClick={() => act(false)}>Hiện lại</SecondaryButton>
      )}
    </div>
  );
}
