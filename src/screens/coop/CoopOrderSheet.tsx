import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { DangerButton, PrimaryButton, ReasonPrompt, SecondaryButton } from '../../components/form';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/StatusBadge';
import { getOrderFor } from '../../domain/access';
import { coopCannotSupply, coopConfirm, coopDecideCancelRequest, coopHandover, coopReceiveReturn, coopReject, coopReportReady } from '../../domain/orders';
import { formatMoney } from '../../domain/pricing';
import { formatDateKey } from '../../domain/state';
import { ORDER_KIND_LABEL, ORDER_STATUS_LABEL } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

type Pending = null | 'reject' | 'cannot_supply' | 'reject_cancel';

/** Đơn phía HTX: xác nhận / từ chối, báo sẵn sàng, đóng gói & bàn giao, nhận hàng hoàn, duyệt yêu cầu huỷ (FR-DH-08..10, 16, 17). */
export function CoopOrderSheet({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { state, run } = useStore();
  const { coopActor, showToast } = useUi();
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState('');
  const found = getOrderFor(state, coopActor, orderId);
  if (!found.ok) return null;
  const order = found.value;

  const act = (op: Parameters<typeof run>[0], ok: string) => {
    const r = run(op);
    showToast(r.ok ? ok : r.error);
    if (r.ok) {
      setPending(null);
      setReason('');
    }
  };
  const hidePrice = !!order.gift?.sendToOther;

  return (
    <BottomSheet
      title={
        <>
          <span className="block font-mono">{order.id}</span>
          <span className="mt-1 flex flex-wrap gap-1 font-sans">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        </>
      }
      onClose={onClose}
    >
      <section className="space-y-1 rounded-2xl border border-stone-300 bg-white p-3 text-sm" aria-label="Phiếu đóng gói">
        <h4 className="font-bold">Phiếu đóng gói {hidePrice && <span className="font-normal text-muted">(quà gửi người khác – không in giá)</span>}</h4>
        <p>
          {ORDER_KIND_LABEL[order.kind]}
          {order.deliveryDate ? ` · giao ngày ${formatDateKey(order.deliveryDate)}` : ''} · {order.shipping === 'express' ? 'Hoả tốc' : 'Giao thường'}
        </p>
        <p>
          Người nhận: {order.address.receiverName} · {order.address.receiverPhone}
        </p>
        <p>Địa chỉ: {order.address.text}</p>
        <ul className="mt-1 border-t border-stone-100 pt-1">
          {order.items.map((i) => (
            <li key={i.productId} className="flex justify-between">
              <span>
                {i.name} × {i.quantity} {i.unit}
              </span>
              {!hidePrice && <span className="tabular-nums">{formatMoney(i.unitPrice * i.quantity)}</span>}
            </li>
          ))}
        </ul>
        {order.gift && (
          <p>
            Hộp quà: {order.gift.boxName}
            {order.gift.message ? ` · Lời nhắn: "${order.gift.message}"` : ''}
          </p>
        )}
        {order.note && <p>Ghi chú của khách: {order.note}</p>}
        {!hidePrice && order.pricing.payOnDelivery > 0 && <p className="font-semibold">Thu khi giao: {formatMoney(order.pricing.payOnDelivery)}</p>}
      </section>

      {order.cancelRequest?.status === 'pending' && (
        <section className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm">
          <p className="font-bold text-rose-900">Khách yêu cầu huỷ: {order.cancelRequest.reason}</p>
          {pending === 'reject_cancel' ? (
            <>
              <ReasonPrompt label="Lý do từ chối yêu cầu huỷ" value={reason} onChange={setReason} />
              <DangerButton className="w-full" onClick={() => act((s, t) => coopDecideCancelRequest(s, order.id, coopActor, false, reason, t), 'Đã từ chối yêu cầu huỷ.')}>
                Xác nhận từ chối
              </DangerButton>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton onClick={() => setPending('reject_cancel')}>Từ chối</SecondaryButton>
              <PrimaryButton onClick={() => act((s, t) => coopDecideCancelRequest(s, order.id, coopActor, true, '', t), 'Đã duyệt huỷ đơn.')}>Đồng ý huỷ</PrimaryButton>
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        {order.status === 'awaiting_confirmation' && pending !== 'reject' && (
          <div className="grid grid-cols-2 gap-2">
            <DangerButton onClick={() => setPending('reject')}>Từ chối đơn</DangerButton>
            <PrimaryButton onClick={() => act((s, t) => coopConfirm(s, order.id, coopActor, t), 'Đã xác nhận đơn.')}>Xác nhận đơn</PrimaryButton>
          </div>
        )}
        {pending === 'reject' && (
          <>
            <ReasonPrompt label="Lý do từ chối (bắt buộc)" value={reason} onChange={setReason} />
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setPending(null)}>Thôi</SecondaryButton>
              <DangerButton className="flex-1" onClick={() => act((s, t) => coopReject(s, order.id, coopActor, reason, t), 'Đã từ chối đơn. Khách được hoàn 100% số đã trả.')}>
                Xác nhận từ chối
              </DangerButton>
            </div>
          </>
        )}
        {order.status === 'awaiting_harvest' && !order.readyReportedAt && pending !== 'cannot_supply' && (
          <div className="grid grid-cols-2 gap-2">
            <DangerButton onClick={() => setPending('cannot_supply')}>Không cung cấp được</DangerButton>
            <PrimaryButton onClick={() => act((s, t) => coopReportReady(s, order.id, coopActor, t), 'Đã báo hàng sẵn sàng.')}>Báo sẵn sàng giao</PrimaryButton>
          </div>
        )}
        {order.status === 'awaiting_harvest' && order.readyReportedAt && (
          <p className="text-sm text-stone-700">Đã báo sẵn sàng. Đang chờ khách trả phần còn lại (hạn {order.remainingDueAt ? new Date(order.remainingDueAt).toLocaleString('vi-VN') : '—'}).</p>
        )}
        {pending === 'cannot_supply' && (
          <>
            <ReasonPrompt label="Lý do không cung cấp được (bắt buộc)" value={reason} onChange={setReason} />
            <DangerButton className="w-full" onClick={() => act((s, t) => coopCannotSupply(s, order.id, coopActor, reason, t), 'Đã huỷ đơn. Khách được hoàn 100%.')}>
              Xác nhận
            </DangerButton>
          </>
        )}
        {order.status === 'preparing' && (
          <PrimaryButton className="w-full" onClick={() => act((s, t) => coopHandover(s, order.id, coopActor, t), 'Đã đóng gói và bàn giao vận chuyển.')}>
            Đã đóng gói – bàn giao vận chuyển
          </PrimaryButton>
        )}
        {order.status === 'returning' && (
          <PrimaryButton className="w-full" onClick={() => act((s, t) => coopReceiveReturn(s, order.id, coopActor, t), 'Đã nhận lại hàng hoàn. Hàng hoàn không tự cộng lại tồn kho.')}>
            Xác nhận đã nhận lại hàng
          </PrimaryButton>
        )}
      </section>

      <section className="space-y-1">
        <h4 className="text-sm font-bold text-stone-700">Lịch sử trạng thái</h4>
        <ol className="space-y-1 border-l-2 border-stone-200 pl-3 text-sm">
          {order.statusHistory.map((h, i) => (
            <li key={i}>
              <strong>{ORDER_STATUS_LABEL[h.to]}</strong> · {new Date(h.at).toLocaleString('vi-VN')} · {h.actor.name ?? h.actor.kind}
              {h.reason && <span className="block text-stone-600">{h.reason}</span>}
            </li>
          ))}
        </ol>
      </section>
    </BottomSheet>
  );
}
