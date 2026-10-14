import { useUi } from '../../app/UiContext';
import { EmptyState, SimBadge } from '../../components/EmptyState';
import { PrimaryButton, SecondaryButton } from '../../components/form';
import { viewRefundAccount } from '../../domain/access';
import { confirmRefundBySimBank, startRefundProcessing } from '../../domain/finance';
import { formatMoney } from '../../domain/pricing';
import { REFUND_SOURCE_LABEL } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** Admin – Tài chính ghi nhận hoàn tiền (FR-DH-12). Chỉ sang Đã hoàn tiền khi ngân hàng mô phỏng xác nhận. */
export function FinanceRefundsTab() {
  const { state, run } = useStore();
  const { adminActor, showToast } = useUi();
  if (state.refunds.length === 0) return <EmptyState>Chưa có yêu cầu hoàn tiền.</EmptyState>;
  const act = (op: Parameters<typeof run>[0], ok: string) => {
    const r = run(op);
    showToast(r.ok ? ok : r.error);
  };
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm text-stone-700">
        <SimBadge /> Ngân hàng / cổng hoàn tiền là mô phỏng, không chuyển tiền thật.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-50 text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Đơn</th>
              <th className="px-3 py-2">Nguồn</th>
              <th className="px-3 py-2 text-right">Số tiền</th>
              <th className="px-3 py-2">Hoàn về</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {state.refunds.map((r) => {
              const acc = viewRefundAccount(state, adminActor, r.customerId);
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono">{r.orderId}</td>
                  <td className="px-3 py-2">
                    {REFUND_SOURCE_LABEL[r.source]}
                    <span className="block text-xs text-muted">{r.reason}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(r.amount)}</td>
                  <td className="px-3 py-2">
                    {r.destination === 'original_source' ? 'Nguồn thanh toán ban đầu' : acc.ok && acc.value ? `${acc.value.bankName} ${acc.value.accountNumber}` : 'Khách chưa khai tài khoản'}
                  </td>
                  <td className="px-3 py-2">{r.status === 'refunded' ? `Đã hoàn tiền (${r.bankRef})` : r.status === 'refunding' ? 'Đang hoàn tiền' : 'Chờ hoàn tiền'}</td>
                  <td className="px-3 py-2">
                    {r.status === 'refund_pending' && <SecondaryButton onClick={() => act((s, t) => startRefundProcessing(s, r.id, adminActor, t), 'Đã chuyển sang Đang hoàn tiền.')}>Bắt đầu hoàn</SecondaryButton>}
                    {r.status === 'refunding' && <PrimaryButton onClick={() => act((s, t) => confirmRefundBySimBank(s, r.id, adminActor, t), 'Ngân hàng mô phỏng đã xác nhận hoàn.')}>Ngân hàng mô phỏng xác nhận</PrimaryButton>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-stone-600">Số tài khoản khách hiện đầy đủ chỉ trong màn của Admin – Tài chính.</p>
    </div>
  );
}
