import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { DangerButton, Field, PrimaryButton, SecondaryButton, Select, Textarea } from '../../components/form';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge';
import { returnDeadline } from '../../domain/complaint';
import { customerCancelMode } from '../../domain/orderStateMachine';
import {
  codBlockReason,
  customerCancel,
  customerConfirmReceived,
  customerRequestCancel,
  customerSwitchRemainingToCod,
  ensureRemainingTransaction,
} from '../../domain/orders';
import { formatMoney } from '../../domain/pricing';
import { depositRefundDeadline } from '../../domain/refund';
import { findOrder, formatDateKey, fromDateKey } from '../../domain/state';
import { ORDER_KIND_LABEL, ORDER_STATUS_LABEL, REFUND_SOURCE_LABEL } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

const CANCEL_REASONS = ['Đặt nhầm sản phẩm', 'Muốn đổi địa chỉ / thời gian', 'Tìm được nơi khác', 'Không còn nhu cầu', 'Lý do khác'];

/** Chi tiết đơn kèm lịch sử trạng thái (FR-DH-13), hiện đúng đơn được chọn (L10). */
export function OrderDetailSheet({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { state, run, now } = useStore();
  const { customerActor, openModal, showToast } = useUi();
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const order = findOrder(state, orderId);
  if (!order || order.customerId !== customerActor.id) return null;
  const p = order.pricing;
  const at = now();

  const pendingTx = state.transactions.find((t) => t.status === 'pending' && t.kind === 'checkout' && t.orderIds.includes(order.id));
  const mode = customerCancelMode(order.status);
  const refunds = state.refunds.filter((r) => r.orderId === order.id);
  const deadline = returnDeadline(order);
  const canComplain = order.status === 'delivered' && deadline && at.getTime() <= deadline.getTime();
  const needRemaining = order.kind === 'preorder' && order.readyReportedAt && order.paymentStatus === 'deposit_paid' && order.paymentMethod === 'online' && order.status === 'awaiting_harvest';

  const act = (op: Parameters<typeof run>[0], success: string) => {
    const r = run(op);
    showToast(r.ok ? success : r.error);
    return r.ok;
  };

  const doCancel = () => {
    const reason = cancelReason.trim();
    if (!reason) return showToast('Vui lòng chọn lý do huỷ.');
    const ok =
      mode === 'immediate'
        ? act((s, t) => customerCancel(s, order.id, customerActor, reason, t), 'Đã huỷ đơn.')
        : act((s, t) => customerRequestCancel(s, order.id, customerActor, reason, t), 'Đã gửi yêu cầu huỷ, chờ HTX duyệt.');
    if (ok) setCancelling(false);
  };

  return (
    <BottomSheet
      title={
        <>
          <span className="block font-mono">{order.id}</span>
          <span className="mt-1 flex flex-wrap gap-1">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        </>
      }
      onClose={onClose}
    >
      <section className="space-y-1 text-sm">
        <p>
          <strong>{order.coopName}</strong> · {ORDER_KIND_LABEL[order.kind]}
          {order.deliveryDate ? ` · giao ngày ${formatDateKey(order.deliveryDate)}` : ''}
          {order.shipping === 'express' ? ' · hoả tốc' : ''}
        </p>
        <p className="text-stone-600">
          Giao tới: {order.address.receiverName} · {order.address.text}
        </p>
        {order.note && <p className="text-stone-600">Ghi chú: {order.note}</p>}
        {order.gift && (
          <p className="text-stone-600">
            Hộp quà: {order.gift.boxName}
            {order.gift.message ? ` · "${order.gift.message}"` : ''}
            {order.gift.sendToOther ? ' · gửi người khác' : ''}
          </p>
        )}
      </section>

      <section className="space-y-1 rounded-2xl border border-stone-200 p-3 text-sm">
        {order.items.map((i) => (
          <div key={i.productId} className="flex justify-between gap-2">
            <span>
              {i.name} × {i.quantity} {i.unit} <span className="text-stone-500">({formatMoney(i.unitPrice)})</span>
            </span>
            <span className="tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-0.5 border-t border-stone-100 pt-2">
          <Line label="Tiền hàng" value={p.itemsTotal} />
          {p.discount > 0 && <Line label={`Giảm giá${order.voucherCode ? ` (${order.voucherCode})` : ''}`} value={-p.discount} />}
          <Line label="Phí giao" value={p.shippingFee} />
          {p.expressSurcharge > 0 && <Line label="Phụ phí hoả tốc" value={p.expressSurcharge} />}
          {p.giftBoxFee > 0 && <Line label="Phí hộp quà" value={p.giftBoxFee} />}
          <Line label="Tổng đơn" value={p.total} strong />
          {order.kind === 'preorder' && (
            <>
              <Line label="Tiền cọc" value={p.deposit} />
              <Line label={`Phần còn lại (${order.paymentMethod === 'cod' ? 'trả khi nhận' : 'trả online'})`} value={p.remaining} />
            </>
          )}
          <Line label="Đã trả online" value={order.amountPaidOnline} />
          {order.codCollected > 0 && <Line label="Đã thu khi nhận hàng" value={order.codCollected} />}
        </div>
      </section>

      {order.cancelPolicy && <p className="rounded-xl bg-amber-50 p-2.5 text-sm text-amber-950">Điều kiện huỷ đã đồng ý: {order.cancelPolicy}</p>}

      {refunds.length > 0 && (
        <section className="space-y-1 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm">
          <h4 className="font-bold text-sky-950">Hoàn tiền</h4>
          {refunds.map((r) => (
            <p key={r.id}>
              {REFUND_SOURCE_LABEL[r.source]}: {formatMoney(r.amount)} – {r.status === 'refunded' ? 'Đã hoàn tiền' : r.status === 'refunding' ? 'Đang hoàn tiền' : 'Chờ hoàn tiền'}
              {r.destination === 'bank_account' ? ' (chuyển khoản vào tài khoản đã khai)' : ' (về nguồn thanh toán ban đầu)'}
            </p>
          ))}
        </section>
      )}

      <section className="space-y-2">
        {pendingTx && (
          <PrimaryButton className="w-full" onClick={() => openModal({ type: 'payment', txId: pendingTx.id })}>
            Tiếp tục thanh toán {formatMoney(pendingTx.amount)}
          </PrimaryButton>
        )}
        {needRemaining && (
          <>
            <p className="text-sm text-stone-700">
              HTX đã báo hàng sẵn sàng. Hạn trả phần còn lại: <strong>{new Date(order.remainingDueAt!).toLocaleString('vi-VN')}</strong>.
            </p>
            <PrimaryButton
              className="w-full"
              onClick={() => {
                const r = run(
                  (s, t) => ensureRemainingTransaction(s, order.id, t),
                  (v) => v.state,
                );
                if (r.ok) openModal({ type: 'payment', txId: r.value.tx.id });
                else showToast(r.error);
              }}
            >
              Trả phần còn lại {formatMoney(p.remaining)}
            </PrimaryButton>
            {!order.remainingMethodChanged && !codBlockReason(order) && (
              <SecondaryButton className="w-full" onClick={() => act((s, t) => customerSwitchRemainingToCod(s, order.id, customerActor, t), 'Đã chuyển phần còn lại sang trả khi nhận hàng.')}>
                Đổi sang trả tiền mặt khi nhận (1 lần)
              </SecondaryButton>
            )}
          </>
        )}
        {order.status === 'shipping' && (
          <PrimaryButton className="w-full" onClick={() => act((s, t) => customerConfirmReceived(s, order.id, customerActor, t), 'Cảm ơn bạn! Đơn đã chuyển sang Đã giao.')}>
            Đã nhận hàng
          </PrimaryButton>
        )}
        {canComplain && (
          <SecondaryButton className="w-full" onClick={() => openModal({ type: 'complaint', orderId: order.id })}>
            Khiếu nại / Yêu cầu trả hàng (hạn đến {deadline!.toLocaleString('vi-VN')})
          </SecondaryButton>
        )}
        {mode !== 'not_allowed' && order.cancelRequest?.status !== 'pending' && !cancelling && (
          <DangerButton className="w-full" onClick={() => setCancelling(true)}>
            {mode === 'immediate' ? 'Huỷ đơn' : 'Gửi yêu cầu huỷ'}
          </DangerButton>
        )}
        {cancelling && (
          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3">
            {order.kind === 'preorder' && order.deliveryDate && (
              <p className="text-sm text-rose-900">
                Huỷ đến hết 23:59 ngày {depositRefundDeadline(fromDateKey(order.deliveryDate), order.params.preorderMinLeadDays).toLocaleDateString('vi-VN')} được hoàn 100% cọc; sau mốc này không hoàn cọc.
              </p>
            )}
            {order.status === 'awaiting_payment' && <p className="text-sm text-rose-900">Đơn đang chờ thanh toán: huỷ sẽ huỷ cả giao dịch gộp (các đơn online cùng lần đặt).</p>}
            <Field label="Lý do huỷ">
              <Select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                <option value="">— Chọn lý do —</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setCancelling(false)}>Không huỷ</SecondaryButton>
              <DangerButton className="flex-1" onClick={doCancel}>
                Xác nhận {mode === 'immediate' ? 'huỷ' : 'gửi yêu cầu'}
              </DangerButton>
            </div>
          </div>
        )}
        {order.cancelRequest && order.cancelRequest.status !== 'pending' && (
          <p className="text-sm text-stone-700">
            Yêu cầu huỷ: {order.cancelRequest.status === 'approved' ? 'HTX đã duyệt' : `HTX từ chối – ${order.cancelRequest.rejectReason}`}
          </p>
        )}
      </section>

      <section className="space-y-1">
        <h4 className="text-sm font-bold text-stone-700">Lịch sử trạng thái</h4>
        <ol className="space-y-1.5 border-l-2 border-stone-200 pl-3 text-sm">
          {order.statusHistory.map((h, i) => (
            <li key={i}>
              <span className="font-semibold">{ORDER_STATUS_LABEL[h.to]}</span>
              <span className="text-stone-500"> · {new Date(h.at).toLocaleString('vi-VN')} · {h.actor.name ?? h.actor.kind}</span>
              {h.reason && <span className="block text-stone-600">{h.reason}</span>}
            </li>
          ))}
          {order.deliveryLog.map((d, i) => (
            <li key={`d${i}`} className="text-stone-600">
              Vận chuyển: {d.event === 'picked_up' ? 'đã lấy hàng' : d.event === 'delivered_reported' ? 'ĐVVC báo giao thành công' : d.event === 'failed' ? 'giao thất bại' : 'khách từ chối nhận'}
              {d.reason ? ` – ${d.reason}` : ''} · {new Date(d.at).toLocaleString('vi-VN')}
            </li>
          ))}
        </ol>
      </section>
    </BottomSheet>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${strong ? 'font-extrabold' : ''}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value < 0 ? `−${formatMoney(-value)}` : formatMoney(value)}</span>
    </div>
  );
}
