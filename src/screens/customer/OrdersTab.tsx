import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { formatMoney } from '../../domain/pricing';
import type { LedgerEntry } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';

export function OrdersTab() {
  const { orders, setOrders, setLedger } = useAppData();
  const { openModal, showToast } = useUi();

  // Huỷ đơn đặt trước quá hạn (giữ nguyên hành vi bản cũ; Giai đoạn 2 chuyển sang orderStateMachine + refund)
  const handleCancelOverduePreorder = (orderId: string) => {
    setOrders((prev) => prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'cancelled', isRefunded: true } : ord)));
    const refundEntry: LedgerEntry = {
      id: `LED-${Date.now()}`,
      type: 'refund',
      amount: -102000,
      orderId,
      coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa',
      date: '13/10/2026',
      status: 'matched',
      bearer: 'HTX',
      notes: 'Hoàn 100% tiền cọc do trễ hạn giao cam kết',
    };
    setLedger((prev) => [refundEntry, ...prev]);
    showToast('Hủy đơn thành công! Đã hoàn trả 100% tiền cọc (102.000đ) vào tài khoản');
  };

  return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Đơn Hàng Của Bạn</h3>
          <button
            onClick={() => openModal({ type: 'ticket_form' })}
            className="text-xs text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200"
          >
            <AlertCircle size={14} />
            Gửi khiếu nại
          </button>
        </div>

        <div className="space-y-3">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div>
                  <span className="text-xs font-bold text-stone-900">{ord.id}</span>
                  <span className="text-[10px] text-stone-400 block">{ord.createdAt}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    ord.status === 'delayed'
                      ? 'bg-rose-100 text-rose-700'
                      : ord.status === 'delivering'
                      ? 'bg-sky-100 text-sky-800'
                      : ord.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ord.status === 'cancelled'
                      ? 'bg-stone-200 text-stone-600'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {ord.status === 'delayed' && 'Trễ hạn cam kết (>48h)'}
                  {ord.status === 'delivering' && 'Đang giao hàng tại Hà Nội'}
                  {ord.status === 'completed' && 'Đã giao thành công'}
                  {ord.status === 'cancelled' && 'Đã hủy & Đã hoàn tiền'}
                  {ord.status === 'confirmed' && 'Đã đặt cọc - Đang chuẩn bị'}
                </span>
              </div>

              {/* Items list */}
              <div className="space-y-1.5">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-stone-700">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      {formatMoney(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Snapshot address */}
              <div className="bg-stone-50 rounded-xl p-2 text-[11px] text-stone-600 border border-stone-100">
                <span className="font-semibold text-stone-700 block">Địa chỉ Snapshot cố định:</span>
                <span className="line-clamp-2">{ord.frozenAddressSnapshot}</span>
              </div>

              {/* Preorder Payment breakdown */}
              {ord.isPreorder ? (
                <div className="grid grid-cols-2 gap-2 bg-emerald-50/70 p-2 rounded-xl text-[11px] border border-emerald-100">
                  <div>
                    <span className="text-stone-500 block">Đã cọc Online (30%):</span>
                    <span className="font-bold text-emerald-800 tabular-nums">{formatMoney(ord.depositPaid)}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Còn lại thu COD (70% + Ship):</span>
                    <span className="font-bold text-stone-900 tabular-nums">{formatMoney(ord.remainingCod)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-100">
                  <span className="text-stone-500">Tổng thanh toán COD:</span>
                  <span className="font-extrabold text-stone-900 tabular-nums">{formatMoney(ord.totalAmount)}</span>
                </div>
              )}

              {/* Special button for delayed preorder cancellation */}
              {ord.status === 'delayed' && (
                <div className="pt-2 border-t border-rose-100 flex flex-col gap-1.5">
                  <div className="text-[11px] text-rose-700 flex items-center gap-1 font-medium">
                    <AlertTriangle size={14} />
                    <span>Đơn hàng quá hạn cam kết giao {ord.expectedDelivery}</span>
                  </div>
                  <button
                    onClick={() => handleCancelOverduePreorder(ord.id)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition-colors shadow-xs"
                  >
                    Hủy đơn hợp lệ & Nhận hoàn 100% cọc ({formatMoney(ord.depositPaid)})
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
  );
}
