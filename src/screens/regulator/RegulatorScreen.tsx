import { Building2 } from 'lucide-react';
import { formatMoney } from '../../domain/pricing';
import { useAppData } from '../../store/AppDataContext';

/** Màn Cơ quan QLNN – bản chuyển từ App.tsx cũ. Giai đoạn 2–4 tính số liệu từ store và bỏ dữ liệu cá nhân (L17, BCTK-01..03). */
export function RegulatorScreen() {
  const { orders } = useAppData();
  return (
    <div className="flex flex-col flex-1 p-4 space-y-4">

      {/* Regulator Shield Banner */}
      <div className="bg-sky-950 text-white rounded-3xl p-4 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-sky-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            Cơ Quan Quản Lý Nhà Nước
          </span>
        </div>
        <h3 className="text-base font-bold">Giám Sát Nguồn Gốc & Chất Lượng Nông Sản</h3>
        <p className="text-[11px] text-sky-200 leading-tight">
          Chế độ Giám sát Chỉ đọc (Read-only) – Đã ẩn 100% dữ liệu cá nhân nhạy cảm của người tiêu dùng để bảo vệ quyền riêng tư.
        </p>
      </div>

      {/* 3 Large KPI Cards with Micro Visuals */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 font-semibold leading-tight">HTX đang hoạt động</span>
          <span className="text-xl font-extrabold text-stone-900 mt-2">12</span>
          <div className="w-full bg-emerald-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-full w-4/5"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 font-semibold leading-tight">SP có bảo chứng</span>
          <span className="text-xl font-extrabold text-sky-700 mt-2">48</span>
          <div className="w-full bg-sky-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-sky-600 h-full w-full"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 font-semibold leading-tight">Khiếu nại đang xử lý</span>
          <span className="text-xl font-extrabold text-rose-700 mt-2">1</span>
          <div className="w-full bg-rose-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-rose-500 h-full w-1/4"></div>
          </div>
        </div>
      </div>

      {/* Anonymized Audit Inspection Feed */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-900 uppercase">Tra Cứu Giao Dịch & Nguồn Gốc</h4>
          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-semibold">
            Đã ẩn danh (Masked)
          </span>
        </div>

        <div className="space-y-2">
          {orders.map((ord) => (
            <div key={ord.id} className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">{ord.id}</span>
                <span className="text-[10px] text-emerald-800 font-semibold">
                  {ord.items[0]?.product.certType} ({ord.items[0]?.product.certNumber})
                </span>
              </div>
              <div className="text-[11px] text-stone-600">
                <span>Khách hàng: Ng*** V** A** (098****567)</span>
              </div>
              <div className="text-[11px] text-stone-500 flex justify-between">
                <span>Quận giao: {ord.district}, Hà Nội</span>
                <span className="font-bold text-stone-800">{formatMoney(ord.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
