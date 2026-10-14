import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { AdminTable, Td } from '../../components/AdminTable';
import { EmptyState } from '../../components/EmptyState';
import { Input, PrimaryButton, SecondaryButton, DangerButton } from '../../components/form';
import { cskhUpdateTicket, isTicketOpen, returnRefundAmount } from '../../domain/complaint';
import { formatMoney } from '../../domain/pricing';
import { findOrder } from '../../domain/state';
import { COMPLAINT_REASON_LABEL, TICKET_STATUS_LABEL, type Ticket } from '../../domain/types';
import { useNow, useStore } from '../../store/AppDataContext';

/**
 * Admin – CSKH xử lý ticket (FR-CSKH-07..09) và duyệt trả hàng – hoàn tiền (FR-DH-11).
 * Bố cục bảng cho máy tính: chọn một dòng để xem chi tiết và xử lý ngay bên dưới.
 */
export function CskhTicketsTab() {
  const { state } = useStore();
  const at = useNow(30_000);
  const tickets = [...state.tickets].sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high') || b.createdAt.localeCompare(a.createdAt));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (tickets.length === 0) return <EmptyState>Chưa có ticket nào.</EmptyState>;
  const selected = tickets.find((t) => t.id === selectedId) ?? tickets.find(isTicketOpen) ?? tickets[0];
  return (
    <div className="space-y-4">
      <AdminTable columns={['Mã ticket', 'Đơn · HTX', 'Lý do', 'Ưu tiên', 'Trạng thái', 'Hạn kết luận (SLA-01)', '']} minWidth={900}>
        {tickets.map((t) => {
          const order = findOrder(state, t.orderId);
          const late = isTicketOpen(t) && at.getTime() > new Date(t.resolveDueAt).getTime();
          const active = t.id === selected.id;
          return (
            <tr key={t.id} className={active ? 'bg-forest-50' : ''}>
              <Td className="font-mono font-bold">{t.id}</Td>
              <Td>
                <span className="font-mono">{t.orderId}</span>
                <span className="block text-stone-600">{order?.coopName}</span>
              </Td>
              <Td>
                {COMPLAINT_REASON_LABEL[t.reason]}
                {t.requestRefund && <span className="block text-stone-600">Yêu cầu trả hàng – hoàn tiền</span>}
              </Td>
              <Td>{t.priority === 'high' ? <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">Cao</span> : 'Thường'}</Td>
              <Td>{TICKET_STATUS_LABEL[t.status]}</Td>
              <Td className={late ? 'font-bold text-rose-700' : ''}>{new Date(t.resolveDueAt).toLocaleString('vi-VN')}</Td>
              <Td>
                <button
                  onClick={() => setSelectedId(t.id)}
                  aria-pressed={active}
                  aria-label={`Xem ticket ${t.id}`}
                  className={`min-h-11 rounded-xl px-3 font-semibold ${active ? 'bg-forest-800 text-white' : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50'}`}
                >
                  {active ? 'Đang xem' : 'Xem'}
                </button>
              </Td>
            </tr>
          );
        })}
      </AdminTable>
      <TicketRow key={selected.id} ticket={selected} />
    </div>
  );
}

function TicketRow({ ticket: t }: { ticket: Ticket }) {
  const { state, run } = useStore();
  const { adminActor, showToast } = useUi();
  const at = useNow(30_000);
  const [note, setNote] = useState('');
  const order = findOrder(state, t.orderId);
  const open = isTicketOpen(t);
  const overdue = (iso: string) => open && at.getTime() > new Date(iso).getTime();
  const update = (status: Ticket['status'], refund = false) => {
    const r = run((s, time) => cskhUpdateTicket(s, t.id, adminActor, status, note, time, refund));
    showToast(r.ok ? 'Đã cập nhật ticket.' : r.error);
    if (r.ok) setNote('');
  };
  return (
    <section aria-label={`Chi tiết ticket ${t.id}`} className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono font-bold">{t.id}</span>
        <span className="flex gap-1">
          {t.priority === 'high' && <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">Ưu tiên Cao</span>}
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold">{TICKET_STATUS_LABEL[t.status]}</span>
        </span>
      </div>
      <p>
        Đơn {t.orderId} · {order?.coopName} · {COMPLAINT_REASON_LABEL[t.reason]}
        {t.requestRefund ? ' · yêu cầu trả hàng – hoàn tiền' : ''}
      </p>
      <p className="text-stone-600">
        SLA-01: tiếp nhận trước <span className={overdue(t.ackDueAt) ? 'font-bold text-rose-700' : ''}>{new Date(t.ackDueAt).toLocaleString('vi-VN')}</span>, kết luận trước{' '}
        <span className={overdue(t.resolveDueAt) ? 'font-bold text-rose-700' : ''}>{new Date(t.resolveDueAt).toLocaleString('vi-VN')}</span>
      </p>
      {t.description && <p className="rounded-lg bg-stone-50 p-2">"{t.description}"</p>}
      {t.photos.length > 0 && (
        <div className="flex gap-1">
          {t.photos.map((src, i) => (
            <img key={i} src={src} alt={`Ảnh ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
      <ul className="space-y-0.5 text-stone-600">
        {t.history.map((h, i) => (
          <li key={i}>
            {new Date(h.at).toLocaleString('vi-VN')} · {h.actor.name ?? h.actor.kind}: {h.action}
            {h.note ? ` – ${h.note}` : ''}
          </li>
        ))}
      </ul>
      {t.status !== 'closed' && (
        <div className="space-y-2">
          <Input aria-label="Kết luận / ghi chú" placeholder="Kết luận / ghi chú (bắt buộc khi Đã xử lý, Từ chối)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {t.status === 'open' && <SecondaryButton onClick={() => update('processing')}>Tiếp nhận</SecondaryButton>}
            {open && t.requestRefund && order && (
              <PrimaryButton onClick={() => update('resolved', true)}>Đã xử lý – duyệt hoàn {formatMoney(returnRefundAmount(order, t.productIds))}</PrimaryButton>
            )}
            {open && <SecondaryButton onClick={() => update('resolved')}>Đã xử lý{t.requestRefund ? ' – không hoàn' : ''}</SecondaryButton>}
            {open && <DangerButton onClick={() => update('rejected')}>Từ chối</DangerButton>}
            {!open && <SecondaryButton onClick={() => update('closed')}>Đóng ticket</SecondaryButton>}
          </div>
        </div>
      )}
    </section>
  );
}
