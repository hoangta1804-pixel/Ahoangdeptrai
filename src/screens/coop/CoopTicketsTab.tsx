import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { EmptyState } from '../../components/EmptyState';
import { SecondaryButton, Textarea } from '../../components/form';
import { listTicketsFor } from '../../domain/access';
import { coopReplyTicket } from '../../domain/complaint';
import { COMPLAINT_REASON_LABEL, TICKET_STATUS_LABEL, type Ticket } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/** HTX chỉ xem và phản hồi ticket của HTX mình; không đóng, không từ chối hoàn tiền, không sửa nội dung (mục 5.8). */
export function CoopTicketsTab() {
  const { state } = useStore();
  const { coopActor } = useUi();
  const listed = listTicketsFor(state, coopActor);
  const mine = listed.ok ? listed.value : [];
  if (mine.length === 0) return <EmptyState>Chưa có khiếu nại nào.</EmptyState>;
  return (
    <ul className="space-y-3">
      {mine.map((t) => (
        <TicketCard key={t.id} ticket={t} />
      ))}
    </ul>
  );
}

function TicketCard({ ticket: t }: { ticket: Ticket }) {
  const { run } = useStore();
  const { coopActor, showToast } = useUi();
  const [text, setText] = useState('');
  const [proposal, setProposal] = useState<'' | 'refund' | 'no_refund'>('');
  const closed = !['open', 'processing'].includes(t.status);
  return (
    <li className="space-y-2 rounded-2xl border border-stone-200 bg-white p-3.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono font-bold">{t.id}</span>
        <span className="flex gap-1">
          {t.priority === 'high' && <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">Ưu tiên Cao</span>}
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-800">{TICKET_STATUS_LABEL[t.status]}</span>
        </span>
      </div>
      <p>
        Đơn {t.orderId} · {COMPLAINT_REASON_LABEL[t.reason]}
        {t.requestRefund ? ' · có yêu cầu hoàn tiền' : ''}
      </p>
      {t.description && <p className="rounded-lg bg-stone-50 p-2 text-stone-700">"{t.description}"</p>}
      {t.photos.length > 0 && (
        <div className="flex gap-1">
          {t.photos.map((src, i) => (
            <img key={i} src={src} alt={`Ảnh khiếu nại ${i + 1}`} className="h-14 w-14 rounded-lg object-cover" />
          ))}
        </div>
      )}
      <ul className="space-y-0.5 text-stone-600">
        {t.history.slice(1).map((h, i) => (
          <li key={i}>
            {h.action}
            {h.note ? `: ${h.note}` : ''} · {new Date(h.at).toLocaleString('vi-VN')}
          </li>
        ))}
      </ul>
      {!closed && (
        <div className="space-y-2">
          {t.requestRefund && (
            <fieldset className="flex flex-wrap gap-2 text-sm">
              <legend className="mb-1 font-semibold">Đề xuất của HTX (CSKH quyết định)</legend>
              {(['refund', 'no_refund'] as const).map((p) => (
                <label key={p} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 ${proposal === p ? 'border-emerald-700 bg-emerald-50' : 'border-stone-200'}`}>
                  <input type="radio" name={`proposal-${t.id}`} checked={proposal === p} onChange={() => setProposal(p)} />
                  {p === 'refund' ? 'Đề xuất hoàn tiền' : 'Đề xuất không hoàn'}
                </label>
              ))}
            </fieldset>
          )}
          <Textarea rows={2} aria-label="Phản hồi của HTX" placeholder="Nhập thông tin kiểm tra lô hàng, khâu đóng gói…" value={text} onChange={(e) => setText(e.target.value)} />
          <SecondaryButton
            className="w-full"
            onClick={() => {
              const r = run((s, at) => coopReplyTicket(s, t.id, coopActor, text, at, proposal || undefined));
              showToast(r.ok ? 'Đã gửi phản hồi cho CSKH.' : r.error);
              if (r.ok) {
                setText('');
                setProposal('');
              }
            }}
          >
            Gửi phản hồi
          </SecondaryButton>
        </div>
      )}
    </li>
  );
}
