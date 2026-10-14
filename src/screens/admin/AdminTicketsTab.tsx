import { useUi } from '../../app/UiContext';
import { useAppData } from '../../store/AppDataContext';

export function AdminTicketsTab() {
  const { tickets, setTickets, audits } = useAppData();
  const { showToast } = useUi();
  return (
    <div className="space-y-3">
      {/* Tickets to Close */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-stone-900 uppercase">Quyết Định Xử Lý & Đóng Ticket</h4>
        {tickets.map((t) => (
          <div key={t.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold">{t.id}</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                {t.status}
              </span>
            </div>
            <p className="text-stone-700 italic">"{t.description}"</p>
            {t.coopExplanation && (
              <div className="bg-white p-2 rounded-lg border border-stone-200 text-[11px]">
                <span className="font-bold text-emerald-800">HTX phản hồi: </span>
                <span>{t.coopExplanation}</span>
              </div>
            )}
            <button
              onClick={() => {
                setTickets((prev) =>
                  prev.map((item) => (item.id === t.id ? { ...item, status: 'resolved' } : item))
                );
                showToast('Admin CSKH đã xử lý bồi hoàn và chính thức ĐÓNG TICKET.');
              }}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors"
            >
              Duyệt bồi hoàn & Đóng Ticket
            </button>
          </div>
        ))}
      </div>

      {/* Immutable Audit Log */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-stone-900 uppercase">Nhật Ký Thao Tác Bất Biến (Audit Log)</h4>
        <div className="space-y-1.5">
          {audits.map((log) => (
            <div key={log.id} className="p-2 bg-stone-50 rounded-lg text-[11px] text-stone-700 border border-stone-100">
              <div className="flex justify-between font-semibold text-stone-900">
                <span>{log.action}</span>
                <span className="text-stone-400 font-normal">{log.timestamp}</span>
              </div>
              <p className="text-stone-600 mt-0.5">Thực hiện bởi: {log.adminName}</p>
              <div className="text-[10px] text-stone-500 mt-0.5">
                <span className="line-through">{log.oldValue}</span> → <span className="font-bold text-emerald-800">{log.newValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
