import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { EmptyState, SimBadge } from '../../components/EmptyState';
import { Input } from '../../components/form';
import { autoDeliveredDueAt, carrierSimulate, type CarrierEvent } from '../../domain/orders';
import { type Order } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/**
 * Mô phỏng đơn vị vận chuyển (Admin – Vận hành). Thay cho vai trò Shipper đang tạm ẩn vì OI-01 chưa chốt.
 */
export function CarrierSimTab() {
  const { state } = useStore();
  const shipping = state.orders.filter((o) => o.status === 'shipping');
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-stone-700">
        <SimBadge /> Màn tạm thay vai trò Giao vận trong lúc chờ OI-01 (ai cập nhật trạng thái giao hàng).
      </p>
      {shipping.length === 0 ? <EmptyState>Không có đơn nào đang giao.</EmptyState> : shipping.map((o) => <CarrierRow key={o.id} order={o} />)}
    </div>
  );
}

function CarrierRow({ order: o }: { order: Order }) {
  const { run } = useStore();
  const { adminActor, showToast } = useUi();
  const [reason, setReason] = useState('');
  const send = (event: CarrierEvent, ok: string) => {
    const r = run((s, t) => carrierSimulate(s, o.id, adminActor, event, reason, t));
    showToast(r.ok ? ok : r.error);
    if (r.ok) setReason('');
  };
  const due = autoDeliveredDueAt(o);
  return (
    <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="font-mono font-bold">{o.id}</span>
        <span>
          {o.coopName} · {o.address.wardName} · lần giao thất bại: {o.deliveryAttempts}/{o.params.maxRedeliveries + 1}
        </span>
      </div>
      {o.carrierDeliveredAt ? (
        <p className="text-emerald-800">
          ĐVVC đã báo giao thành công. Chờ khách bấm Đã nhận; tự chuyển Đã giao lúc {due?.toLocaleString('vi-VN')} (PAR-26).
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <button onClick={() => send('picked_up', 'Đã ghi nhận: đang giao.')} className="min-h-11 rounded-xl border border-stone-300 px-3 font-semibold">
            Đang giao
          </button>
          <button onClick={() => send('delivered_reported', 'Đã ghi nhận: giao thành công.')} className="min-h-11 rounded-xl bg-emerald-700 px-3 font-semibold text-white">
            Giao thành công
          </button>
          <div className="min-w-48 flex-1">
            <Input aria-label="Lý do giao thất bại" placeholder="Lý do (bắt buộc khi thất bại)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <button onClick={() => send('failed', 'Đã ghi nhận giao thất bại.')} className="min-h-11 rounded-xl border border-rose-300 bg-rose-50 px-3 font-semibold text-rose-800">
            Giao thất bại
          </button>
          <button onClick={() => send('refused', 'Khách từ chối nhận: đơn chuyển hoàn.')} className="min-h-11 rounded-xl border border-rose-300 bg-rose-50 px-3 font-semibold text-rose-800">
            Khách từ chối nhận
          </button>
        </div>
      )}
    </div>
  );
}
