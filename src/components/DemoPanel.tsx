import { useState } from 'react';
import { useUi } from '../app/UiContext';
import { DAY_MS, HOUR_MS, MINUTE_MS } from '../domain/state';
import { generateId } from '../domain/ids';
import { applyGatewayResult, GATEWAY_OUTCOME_MESSAGE } from '../domain/payment';
import { formatMoney } from '../domain/pricing';
import { TRANSACTION_STATUS_LABEL } from '../domain/types';
import { useNow, useStore } from '../store/AppDataContext';
import { BottomSheet } from './BottomSheet';
import { Select, SecondaryButton } from './form';

/** Bảng điều khiển demo (mục 5.4). Chỉ để trình diễn, không phải chức năng của sản phẩm. */
export function DemoPanel({ onClose }: { onClose: () => void }) {
  const { state, run, advanceClock, resetClock, resetDemoData } = useStore();
  const { showToast, closeModal } = useUi();
  const at = useNow(1000);
  const ended = state.transactions.filter((t) => t.kind === 'checkout' && ['failed', 'expired', 'cancelled'].includes(t.status));
  const paid = state.transactions.filter((t) => t.status === 'paid');
  const [lateTx, setLateTx] = useState('');
  const [dupTx, setDupTx] = useState('');

  const gateway = (txId: string) => {
    if (!txId) return showToast('Chọn giao dịch trước.');
    let msg = '';
    const r = run(
      (s, t) => applyGatewayResult(s, txId, 'success', generateId('GW'), t),
      (v) => {
        msg = GATEWAY_OUTCOME_MESSAGE[v.outcome];
        return v.state;
      },
    );
    showToast(r.ok ? msg : r.error);
  };

  const shift = (ms: number, label: string) => {
    advanceClock(ms);
    showToast(`Đã tua thời gian ${label}. Các tác vụ theo giờ đã chạy.`);
  };

  const label = (t: (typeof state.transactions)[number]) => `${t.id} · ${formatMoney(t.amount)} · ${TRANSACTION_STATUS_LABEL[t.status]}`;

  return (
    <BottomSheet title="Công cụ demo" onClose={onClose}>
      <p className="rounded-xl border-2 border-dashed border-stone-400 bg-stone-50 p-2.5 text-sm text-stone-700">
        Công cụ demo dùng để trình diễn các tình huống theo thời gian và thanh toán. Không thuộc chức năng của sản phẩm.
      </p>

      <section className="space-y-2">
        <h4 className="text-sm font-bold">Tua thời gian</h4>
        <p className="text-sm text-stone-700">
          Giờ demo: <strong>{at.toLocaleString('vi-VN')}</strong>
          {state.clockOffsetMs !== 0 && ` (lệch ${Math.round(state.clockOffsetMs / HOUR_MS)} giờ so với giờ thật)`}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <SecondaryButton onClick={() => shift(15 * MINUTE_MS, '+15 phút')}>+15 phút</SecondaryButton>
          <SecondaryButton onClick={() => shift(24 * HOUR_MS, '+24 giờ')}>+24 giờ</SecondaryButton>
          <SecondaryButton onClick={() => shift(3 * DAY_MS, '+3 ngày')}>+3 ngày</SecondaryButton>
        </div>
        {state.clockOffsetMs !== 0 && (
          <SecondaryButton className="w-full" onClick={() => (resetClock(), showToast('Đồng hồ demo về giờ thật.'))}>
            Đưa đồng hồ về giờ thật
          </SecondaryButton>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-bold">Gửi "tiền về muộn"</h4>
        <p className="text-sm text-stone-600">Cổng báo thành công cho giao dịch đã thất bại / hết hạn / huỷ. Đơn giữ Đã huỷ và tự tạo yêu cầu hoàn.</p>
        <Select value={lateTx} onChange={(e) => setLateTx(e.target.value)} aria-label="Giao dịch đã kết thúc">
          <option value="">— {ended.length ? 'Chọn giao dịch' : 'Chưa có giao dịch thất bại / hết hạn'} —</option>
          {ended.map((t) => (
            <option key={t.id} value={t.id}>
              {label(t)}
            </option>
          ))}
        </Select>
        <SecondaryButton className="w-full" disabled={!lateTx} onClick={() => gateway(lateTx)}>
          Gửi tiền về muộn
        </SecondaryButton>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-bold">Gửi kết quả cổng lần hai</h4>
        <p className="text-sm text-stone-600">Cổng báo thành công lần nữa (mã tham chiếu khác) cho giao dịch đã thanh toán. Chỉ lần đầu được tính, lần sau tự tạo yêu cầu hoàn 100% (BR-TT-06).</p>
        <Select value={dupTx} onChange={(e) => setDupTx(e.target.value)} aria-label="Giao dịch đã thanh toán">
          <option value="">— {paid.length ? 'Chọn giao dịch' : 'Chưa có giao dịch đã thanh toán'} —</option>
          {paid.map((t) => (
            <option key={t.id} value={t.id}>
              {label(t)}
            </option>
          ))}
        </Select>
        <SecondaryButton className="w-full" disabled={!dupTx} onClick={() => gateway(dupTx)}>
          Gửi kết quả lần hai
        </SecondaryButton>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-bold">Dữ liệu</h4>
        <SecondaryButton
          className="w-full"
          onClick={() => {
            if (!window.confirm('Khôi phục dữ liệu mẫu? Mọi đơn, giỏ hàng và thay đổi trên trình duyệt này sẽ bị xoá.')) return;
            resetDemoData();
            closeModal();
            showToast('Đã khôi phục dữ liệu mẫu.');
          }}
        >
          Khôi phục dữ liệu mẫu
        </SecondaryButton>
      </section>
    </BottomSheet>
  );
}
