import { useEffect, useState, type ReactNode } from 'react';
import { useUi } from '../../app/UiContext';
import { ADMIN_GROUP_LABEL, type AdminSubGroup } from '../../domain/types';
import { AdminAuditTab } from './AdminAuditTab';
import { AdminOrdersTab } from './AdminOrdersTab';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminParamsTab } from './AdminParamsTab';
import { CarrierSimTab } from './CarrierSimTab';
import { CskhTicketsTab } from './CskhTicketsTab';
import { FinanceRefundsTab } from './FinanceRefundsTab';
import { FinanceSettlementTab } from './FinanceSettlementTab';
import { QualityChangesTab } from './QualityChangesTab';

type TabDef = { key: string; label: string; render: () => ReactNode };

const TABS: Record<AdminSubGroup, TabDef[]> = {
  operations: [
    { key: 'overview', label: 'Tổng quan', render: () => <AdminOverviewTab /> },
    { key: 'orders', label: 'Đơn hàng', render: () => <AdminOrdersTab /> },
    { key: 'carrier', label: 'Mô phỏng ĐVVC', render: () => <CarrierSimTab /> },
    { key: 'params', label: 'Tham số', render: () => <AdminParamsTab /> },
    { key: 'audit', label: 'Nhật ký', render: () => <AdminAuditTab /> },
  ],
  quality: [{ key: 'changes', label: 'Duyệt sản phẩm & giá', render: () => <QualityChangesTab /> }],
  cskh: [{ key: 'tickets', label: 'Ticket khiếu nại', render: () => <CskhTicketsTab /> }],
  finance: [
    { key: 'refunds', label: 'Hoàn tiền', render: () => <FinanceRefundsTab /> },
    { key: 'settlement', label: 'Đối soát HTX', render: () => <FinanceSettlementTab /> },
  ],
};

/** Admin theo nhóm quyền (mục 8). Giao diện rộng cho máy tính. */
export function AdminScreen() {
  const { adminGroup, setAdminGroup } = useUi();
  const [tab, setTab] = useState(TABS[adminGroup][0].key);
  useEffect(() => setTab(TABS[adminGroup][0].key), [adminGroup]);
  const current = TABS[adminGroup].find((t) => t.key === tab) ?? TABS[adminGroup][0];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
      <aside className="space-y-3 lg:w-56 lg:shrink-0">
        <div className="space-y-2 rounded-3xl bg-stone-900 p-4 text-white">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Quản trị</span>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-stone-300">Nhóm quyền (demo, Giai đoạn 3 thay bằng đăng nhập)</span>
            <select value={adminGroup} onChange={(e) => setAdminGroup(e.target.value as AdminSubGroup)} className="min-h-11 w-full rounded-xl bg-stone-800 px-3 text-sm text-white">
              {(Object.keys(ADMIN_GROUP_LABEL) as AdminSubGroup[]).map((g) => (
                <option key={g} value={g}>
                  Admin – {ADMIN_GROUP_LABEL[g]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col" aria-label="Chức năng quản trị">
          {TABS[adminGroup].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} aria-current={current.key === t.key ? 'page' : undefined} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-left text-sm font-medium ${current.key === t.key ? 'bg-emerald-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">{current.render()}</section>
    </div>
  );
}
