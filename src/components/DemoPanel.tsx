import { useState } from 'react';
import { useUi } from '../app/UiContext';
import { DAY_MS, HOUR_MS, MINUTE_MS } from '../domain/state';
import { generateId } from '../domain/ids';
import { applyGatewayResult, GATEWAY_OUTCOME_MESSAGE } from '../domain/payment';
import { formatMoney } from '../domain/pricing';
import { TRANSACTION_STATUS_LABEL } from '../domain/types';
import { useNow, useStore } from '../store/AppDataContext';
import { BottomSheet } from './BottomSheet';
import { DangerButton, Select, SecondaryButton } from './form';

/** Bảng điều khiển demo (mục 5.4). Chỉ để trình diễn, không phải chức năng của sản phẩm. */
export function DemoPanel({ onClose }: { onClose: () => void }) {
  const { state, run, advanceClock, resetClock, resetDemoData, sync, syncNow } = useStore();
  const shared = sync.mode === 'shared';
  const { showToast, closeModal } = useUi();
  const at = useNow(1000);
  const ended = state.transactions.filter((t) => t.kind === 'checkout' && ['failed', 'expired', 'cancelled'].includes(t.status));
  const paid = state.transactions.filter((t) => t.status === 'paid');
  const [lateTx, setLateTx] = useState('');
  const [dupTx, setDupTx] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

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
        <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
          <p className="font-semibold text-ink">
            {sync.mode === 'checking'
              ? 'Đang kiểm tra API dữ liệu chung…'
              : sync.mode === 'local'
                ? 'Lưu trên trình duyệt này'
                : sync.phase === 'offline'
                  ? 'Dữ liệu dùng chung – đang mất kết nối'
                  : sync.phase === 'error'
                    ? 'Dữ liệu dùng chung – không lưu được'
                    : sync.phase === 'saving'
                      ? 'Dữ liệu dùng chung – đang lưu…'
                      : 'Dữ liệu dùng chung – đã đồng bộ'}
          </p>
          {sync.mode === 'local' && <p>{sync.reason} Các tab cùng trình duyệt vẫn thấy chung dữ liệu.</p>}
          {shared && (
            <>
              <p>Mọi máy mở link demo thấy chung đơn, giỏ, khiếu nại… qua API /api/state. Máy khác thay đổi thì màn hình cập nhật trong khoảng 10 giây.</p>
              {sync.message && <p className="font-semibold text-rose-800">{sync.message}</p>}
              {sync.lastSyncAt && <p className="text-muted">Lần đồng bộ gần nhất: {new Date(sync.lastSyncAt).toLocaleTimeString('vi-VN')}</p>}
              <SecondaryButton
                className="w-full"
                onClick={() => {
                  syncNow();
                  showToast('Đang đồng bộ với API…');
                }}
              >
                Đồng bộ ngay
              </SecondaryButton>
            </>
          )}
        </div>
        {/* Xác nhận ngay trong trang: hộp confirm() của trình duyệt bị chặn khi app chạy trong khung nhúng. */}
        {confirmReset ? (
          <div role="alert" className="space-y-2 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
            <p>
              {shared
                ? 'Khôi phục dữ liệu mẫu cho mọi máy đang dùng demo? Mọi đơn, giỏ hàng và thay đổi trên dữ liệu dùng chung sẽ bị xoá.'
                : 'Khôi phục dữ liệu mẫu? Mọi đơn, giỏ hàng và thay đổi trên trình duyệt này sẽ bị xoá.'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton onClick={() => setConfirmReset(false)}>Huỷ</SecondaryButton>
              <DangerButton
                onClick={() => {
                  resetDemoData();
                  closeModal();
                  showToast('Đã khôi phục dữ liệu mẫu.');
                }}
              >
                Xoá và khôi phục
              </DangerButton>
            </div>
          </div>
        ) : (
          <SecondaryButton className="w-full" onClick={() => setConfirmReset(true)}>
            Khôi phục dữ liệu mẫu
          </SecondaryButton>
        )}
      </section>
    </BottomSheet>
  );
}
