import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { useAppData } from '../../store/AppDataContext';

export function CoopOrdersTab() {
  const { tickets, setTickets } = useAppData();
  const { showToast } = useUi();
  const [coopResponseText, setCoopResponseText] = useState('');
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
        Ticket Khiếu Nại Cần Phản Hồi Giải Trình
      </h4>

      {tickets.map((tck) => (
        <div key={tck.id} className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b border-stone-100 pb-2">
            <div>
              <span className="text-xs font-bold text-stone-900">{tck.id}</span>
              <span className="text-[10px] text-stone-400 block">Đơn: {tck.orderId}</span>
            </div>
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
              Chờ HTX giải trình
            </span>
          </div>

          <div className="text-xs text-stone-700">
            <span className="font-semibold block text-stone-900">Nội dung khiếu nại của khách:</span>
            <p className="mt-0.5 italic text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-100">
              "{tck.description}"
            </p>
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-bold text-stone-700 block mb-1">
              Giải trình của HTX gửi CSKH (Hệ thống bảo lưu, không đóng ticket):
            </label>
            <textarea
              rows={2}
              placeholder="Nhập thông tin kiểm tra lô hàng, khâu đóng gói tại vườn..."
              value={tck.coopExplanation || coopResponseText}
              onChange={(e) => setCoopResponseText(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
            ></textarea>
            <button
              onClick={() => {
                setTickets((prev) =>
                  prev.map((item) =>
                    item.id === tck.id ? { ...item, coopExplanation: coopResponseText } : item
                  )
                );
                showToast('Đã gửi bản giải trình đến Admin CSKH thẩm định!');
              }}
              className="mt-1.5 w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors shadow-xs"
            >
              Gửi giải trình cho CSKH
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
