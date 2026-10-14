import { Building2 } from 'lucide-react';
import { StatsPanel } from '../admin/AdminOverviewTab';

/**
 * Cơ quan QLNN: chỉ đọc, số liệu tổng hợp tính từ dữ liệu trong store (L17, FR-BCTK-01).
 * Không hiện tên, SĐT, địa chỉ, tài khoản của khách; không xem nhật ký; không sửa được gì (mục 5.9).
 */
export function RegulatorScreen() {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1 rounded-3xl bg-sky-950 p-4 text-white">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
          <Building2 size={16} /> Cơ quan quản lý nhà nước – chỉ xem
        </span>
        <h2 className="text-lg font-bold">Số liệu tổng hợp</h2>
        <p className="text-sm text-sky-100">Số liệu tính từ dữ liệu demo hiện có. Không có dữ liệu cá nhân của khách hàng.</p>
      </div>
      <StatsPanel />
      <p className="text-sm text-stone-600">Xuất báo cáo (FR-BCTK-02, 03) làm ở Giai đoạn 4.</p>
    </div>
  );
}
