import { Clock } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { SimBadge } from '../../components/EmptyState';
import { generateId } from '../../domain/ids';
import { applyGatewayResult, GATEWAY_OUTCOME_MESSAGE, secondsLeft, type GatewayResult } from '../../domain/payment';
import { formatMoney } from '../../domain/pricing';
import { findOrder } from '../../domain/state';
import { ORDER_KIND_LABEL, TRANSACTION_STATUS_LABEL } from '../../domain/types';
import { useNow, useStore } from '../../store/AppDataContext';

/** Cổng thanh toán – MÔ PHỎNG (mục 5.4). Kết quả chỉ ghi nhận qua applyGatewayResult(). */
export function PaymentSheet({ txId, onClose }: { txId: string; onClose: () => void }) {
  const { state, run } = useStore();
  const { showToast, setCustomerTab } = useUi();
  const at = useNow(1000);
  const tx = state.transactions.find((t) => t.id === txId);
  if (!tx) return null;

  const left = secondsLeft(tx, at);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const pending = tx.status === 'pending' && left > 0;
  const isRemaining = tx.kind === 'remaining';

  const send = (result: GatewayResult) => {
    let message = '';
    const r = run(
      (s, t) => applyGatewayResult(s, tx.id, result, generateId('GW'), t),
      (v) => {
        message =
          tx.kind === 'remaining' && v.outcome === 'paid'
            ? 'Đã trả phần còn lại. Đơn chuyển sang Đang chuẩn bị nếu HTX đã báo hàng sẵn sàng.'
            : tx.kind === 'remaining' && (v.outcome === 'failed' || v.outcome === 'cancelled')
              ? 'Trả phần còn lại chưa thành công. Bạn có thể thử lại trước hạn; hạn không được gia hạn.'
              : GATEWAY_OUTCOME_MESSAGE[v.outcome];
        return v.state;
      },
    );
    showToast(r.ok ? message : r.error);
    onClose();
    setCustomerTab('orders');
  };

  return (
    <BottomSheet
      title={
        <span className="flex flex-wrap items-center gap-2">
          Cổng thanh toán <SimBadge />
        </span>
      }
      onClose={onClose}
      closeLabel="Đóng cổng thanh toán (giao dịch vẫn giữ, không gia hạn)"
      footer={
        pending ? (
          <div className="space-y-2">
            <button onClick={() => send('success')} className="min-h-12 w-full rounded-2xl bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-600">
              Thanh toán thành công
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => send('failed')} className="min-h-12 rounded-2xl border border-rose-300 bg-rose-50 text-sm font-bold text-rose-800">
                Thanh toán thất bại
              </button>
              <button onClick={() => send('cancelled')} className="min-h-12 rounded-2xl border border-stone-300 bg-white text-sm font-bold text-stone-800">
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <button onClick={onClose} className="min-h-12 w-full rounded-2xl bg-stone-900 text-sm font-bold text-white">
            Đóng
          </button>
        )
      }
    >
      <p className="rounded-2xl border-2 border-dashed border-stone-900 bg-amber-50 p-3 text-center text-sm font-bold text-stone-900">
        Đây là cổng mô phỏng, không trừ tiền thật.
      </p>

      <div className="text-center">
        <p className="text-sm text-stone-600">{isRemaining ? 'Số tiền phần còn lại' : 'Số tiền thanh toán'}</p>
        <p className="text-3xl font-extrabold tabular-nums text-stone-900">{formatMoney(tx.amount)}</p>
        {pending ? (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-amber-800" role="timer" aria-live="off">
            <Clock size={16} />
            {isRemaining ? 'Hạn trả phần còn lại' : 'Giữ hàng'} còn {left >= 3600 ? `${Math.floor(left / 3600)} giờ ` : ''}
            {mm}:{ss}
          </p>
        ) : (
          <p className="mt-1 text-sm font-semibold text-stone-700">Giao dịch: {TRANSACTION_STATUS_LABEL[tx.status]}</p>
        )}
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-bold text-stone-700">Các đơn trong giao dịch</h4>
        {tx.orderIds.map((id) => {
          const o = findOrder(state, id);
          if (!o) return null;
          return (
            <div key={id} className="flex justify-between gap-2 rounded-xl border border-stone-200 p-2.5 text-sm">
              <span>
                <span className="block font-mono text-xs font-bold">{o.id}</span>
                {o.coopName} · {ORDER_KIND_LABEL[o.kind]}
                {o.kind === 'preorder' && !isRemaining ? ' (tiền cọc)' : ''}
              </span>
              <span className="font-bold tabular-nums">{formatMoney(tx.amounts[id] ?? 0)}</span>
            </div>
          );
        })}
      </section>
      <p className="text-xs text-stone-500">
        Đóng màn này giao dịch vẫn được giữ; mở lại từ "Đơn hàng". Thử lại hoặc mở lại không gia hạn thời gian. Sau khi hết giờ, các đơn thanh toán online tự huỷ và hàng được nhả.
      </p>
    </BottomSheet>
  );
}
