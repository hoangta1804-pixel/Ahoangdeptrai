/**
 * TẠM ẨN theo OI-01 (chưa chốt ai cập nhật trạng thái giao hàng – mục 5.5).
 * Giữ nguyên code vai trò Giao vận (Shipper) từ App.tsx cũ để dùng lại khi nhóm chốt.
 * Không được import vào app. Trạng thái giao hàng hiện cập nhật qua màn
 * "Mô phỏng đơn vị vận chuyển" trong Admin – Vận hành (Giai đoạn 2).
 */
import { useState } from 'react';
import { Phone, QrCode, X } from 'lucide-react';
import { formatMoney } from '../../domain/pricing';
/** Kiểu đơn của src/App.tsx cũ, giữ riêng cho màn tạm ẩn này. */
interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  houseType: 'apartment' | 'ground';
  frozenAddressSnapshot: string;
  remainingCod: number;
  status: string;
}

interface ShipperScreenProps {
  orders: Order[];
  setOrders: (updater: (prev: Order[]) => Order[]) => void;
  showToast: (message: string) => void;
}

export function ShipperScreen({ orders, setOrders, showToast }: ShipperScreenProps) {
  const [scanning, setScanning] = useState(false);
  return (
    <>
      <div className="flex flex-col flex-1 p-4 space-y-4">
        {/* Shipper Header */}
        <div className="bg-amber-600 text-white rounded-3xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
              Đội Vận Chuyển Hà Nội
            </span>
            <h3 className="text-base font-bold">Shipper: Trần Văn Mạnh</h3>
            <p className="text-xs text-amber-100">Khu vực phân công: Nam Từ Liêm & Cầu Giấy</p>
          </div>
          <button
            onClick={() => setScanning(true)}
            className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white"
            title="Quét mã QR nhận túi hàng"
          >
            <QrCode size={22} />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-white rounded-2xl p-3 border border-stone-200 text-xs flex items-center justify-between">
          <span className="font-semibold text-stone-700">Đơn hàng cần giao hôm nay:</span>
          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-lg">1 đơn cần phát</span>
        </div>

        {/* Delivery Action Card */}
        {orders
          .filter((o) => o.status === 'delayed' || o.status === 'delivering')
          .slice(0, 1)
          .map((ord) => (
            <div key={ord.id} className="bg-white rounded-3xl border border-stone-200/80 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-900">{ord.id}</span>
                <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                  {ord.houseType === 'apartment' ? '🏢 Chung cư' : '🏠 Nhà mặt đất'}
                </span>
              </div>

              {/* Snapshot Address details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400">Snapshot Địa chỉ giao cố định</span>
                <p className="text-xs font-bold text-stone-900 leading-snug">{ord.frozenAddressSnapshot}</p>
                <div className="flex items-center gap-2 text-xs text-stone-600 mt-1">
                  <Phone size={12} className="text-emerald-700" />
                  <span className="font-semibold">{ord.customerPhone} ({ord.customerName})</span>
                </div>
              </div>

              {/* COD Collection box */}
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-amber-800 font-semibold block">Số tiền cần thu COD:</span>
                  <span className="text-base font-extrabold text-amber-900 tabular-nums">
                    {formatMoney(ord.remainingCod)}
                  </span>
                </div>
                <span className="text-[10px] text-amber-700 bg-white px-2 py-1 rounded-md border border-amber-200 font-medium">
                  70% giá trị + Ship
                </span>
              </div>

              {/* One-touch Status Update Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Cập nhật trạng thái giao đơn</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setOrders((prev) =>
                        prev.map((o) => (o.id === ord.id ? { ...o, status: 'delivering' } : o))
                      );
                      showToast('Đã chuyển trạng thái: Đang giao hàng');
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Đang giao
                  </button>
                  <button
                    onClick={() => {
                      setOrders((prev) =>
                        prev.map((o) => (o.id === ord.id ? { ...o, status: 'completed' } : o))
                      );
                      showToast(`Giao thành công! Đã ghi nhận thu COD ${formatMoney(ord.remainingCod)}`);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Thành công & Thu COD
                  </button>
                  <button
                    onClick={() => showToast('Đã hẹn giao lại vào ca chiều theo yêu cầu của khách')}
                    className="bg-stone-200 text-stone-800 hover:bg-stone-300 text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    Hẹn giao lại
                  </button>
                  <button
                    onClick={() => showToast('Đã báo chuyển hoàn về kho trung tâm Hà Nội')}
                    className="bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    Chuyển hoàn
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
      {scanning && <ShipperScanModal onClose={() => setScanning(false)} showToast={showToast} />}
    </>
  );
}

function ShipperScanModal({ onClose, showToast }: { onClose: () => void; showToast: (message: string) => void }) {
  return (
    <div className="fixed inset-0 bg-stone-950 z-50 flex flex-col justify-between p-6 text-white text-center">
      <div className="flex justify-between items-center pt-4">
        <span className="text-xs font-bold uppercase text-amber-400">Máy Quét QR Nông Sản</span>
        <button onClick={onClose} className="p-1 rounded-full bg-white/20">
          <X size={18} />
        </button>
      </div>

      <div className="my-auto flex flex-col items-center">
        <div className="relative w-64 h-64 border-2 border-dashed border-amber-400 rounded-3xl flex items-center justify-center p-4">
          <div className="w-full h-full bg-stone-900/50 rounded-2xl flex items-center justify-center">
            <QrCode size={120} className="text-amber-400/80" />
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 animate-scanline"></div>
        </div>
        <p className="text-xs text-stone-300 mt-4">
          Đưa mã QR trên túi hàng nông sản Lào Cai vào khung để nhận đơn giao
        </p>
      </div>

      <button
        onClick={() => {
          onClose();
          showToast('Đã quét nhận túi hàng mã LC-BAG-88219 (Cá Hồi Sa Pa)');
        }}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-3.5 rounded-2xl shadow-lg"
      >
        Mô phỏng Quét thành công
      </button>
    </div>
  );
}
