import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { AdminTable, Td } from '../../components/AdminTable';
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
    <AdminTable columns={['Sao', 'Sản phẩm · đơn', 'Nội dung', 'Trạng thái', 'Thao tác']} minWidth={960}>
      {state.reviews.map((r) => (
        <ReviewRow key={r.id} review={r} />
      ))}
    </AdminTable>
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
    <tr>
      <Td>
        <Stars value={r.stars} />
        <span className="sr-only">{r.stars} sao</span>
      </Td>
      <Td className="min-w-40">
        <strong className="block">{product?.name}</strong>
        <span className="font-mono text-stone-600">{r.orderId}</span>
      </Td>
      <Td className="min-w-56">
        {r.comment ? <p className="text-stone-700">{r.comment}</p> : <p className="text-muted">Không có lời nhận xét.</p>}
        {r.coopReply && <p className="mt-1 border-l-2 border-forest-600 pl-2">HTX: {r.coopReply}</p>}
      </Td>
      <Td>
        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold">{r.status === 'visible' ? 'Đang hiển thị' : `Đã ẩn: ${r.hiddenReason}`}</span>
      </Td>
      <Td>
        {r.status === 'visible' ? (
          <div className="flex flex-wrap gap-2">
            <Select aria-label="Lý do ẩn" value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-xs">
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
      </Td>
    </tr>
  );
}
