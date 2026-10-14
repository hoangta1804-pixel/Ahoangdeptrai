import { useState, type ReactNode } from 'react';
import { useUi } from '../../app/UiContext';
import { ListBoundary } from '../../components/ListBoundary';
import { useStore } from '../../store/AppDataContext';
import { ADMIN_GROUP_LABEL, type AdminSubGroup } from '../../domain/types';
import { AdminAccountsTab } from './AdminAccountsTab';
import { AdminAuditTab } from './AdminAuditTab';
import { FinanceLedgerTab } from './FinanceLedgerTab';
import { AdminOrdersTab } from './AdminOrdersTab';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminParamsTab } from './AdminParamsTab';
import { CarrierSimTab } from './CarrierSimTab';
import { CskhReviewsTab } from './CskhReviewsTab';
import { CskhTicketsTab } from './CskhTicketsTab';
import { OpsAccountsTab } from './OpsAccountsTab';
import { QualityCoopsTab } from './QualityCoopsTab';
import { SharedCatalogTab } from './SharedCatalogTab';
import { VouchersTab } from './VouchersTab';
import { FinanceRefundsTab } from './FinanceRefundsTab';
import { FinanceSettlementTab } from './FinanceSettlementTab';
import { QualityChangesTab } from './QualityChangesTab';

type TabDef = { key: string; label: string; render: () => ReactNode };

const OVERVIEW: TabDef = { key: 'overview', label: 'Tổng quan', render: () => <AdminOverviewTab /> };

/** Chức năng theo nhóm quyền (mục 8). Nhóm quyền lấy từ tài khoản đăng nhập. */
const TABS: Record<AdminSubGroup, TabDef[]> = {
  operations: [
    OVERVIEW,
    { key: 'orders', label: 'Đơn hàng', render: () => <AdminOrdersTab /> },
    { key: 'carrier', label: 'Mô phỏng ĐVVC', render: () => <CarrierSimTab /> },
    { key: 'accounts', label: 'Cấp & khoá tài khoản', render: () => <OpsAccountsTab /> },
    { key: 'params', label: 'Tham số', render: () => <AdminParamsTab /> },
    { key: 'catalog', label: 'Danh mục dùng chung', render: () => <SharedCatalogTab /> },
    { key: 'vouchers', label: 'Mã ưu đãi', render: () => <VouchersTab /> },
  ],
  quality: [
    OVERVIEW,
    { key: 'changes', label: 'Duyệt sản phẩm & giá', render: () => <QualityChangesTab /> },
    { key: 'coops', label: 'Hồ sơ HTX & quyền bán', render: () => <QualityCoopsTab /> },
  ],
  cskh: [
    OVERVIEW,
    { key: 'tickets', label: 'Ticket khiếu nại', render: () => <CskhTicketsTab /> },
    { key: 'reviews', label: 'Kiểm duyệt đánh giá', render: () => <CskhReviewsTab /> },
  ],
  finance: [
    OVERVIEW,
    { key: 'refunds', label: 'Hoàn tiền', render: () => <FinanceRefundsTab /> },
    { key: 'settlement', label: 'Đối soát HTX', render: () => <FinanceSettlementTab /> },
    { key: 'ledger', label: 'Sổ giao dịch', render: () => <FinanceLedgerTab /> },
  ],
  root: [
    OVERVIEW,
    { key: 'accounts', label: 'Phân quyền', render: () => <AdminAccountsTab /> },
    { key: 'audit', label: 'Nhật ký', render: () => <AdminAuditTab /> },
  ],
};

/** Admin theo nhóm quyền (mục 8). Giao diện rộng cho máy tính. */
export function AdminScreen() {
  const { adminGroup } = useUi();
  const { state } = useStore();
  const [tab, setTab] = useState(TABS[adminGroup][0].key);
  const current = TABS[adminGroup].find((t) => t.key === tab) ?? TABS[adminGroup][0];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
      <aside className="space-y-3 lg:w-56 lg:shrink-0">
        <div className="rounded-3xl bg-forest-900 p-4 text-white">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-200">Quản trị</span>
          <p className="text-base font-bold">Admin – {ADMIN_GROUP_LABEL[adminGroup]}</p>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col" aria-label="Chức năng quản trị">
          {TABS[adminGroup].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} aria-current={current.key === t.key ? 'page' : undefined} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-left text-sm font-medium ${current.key === t.key ? 'bg-forest-800 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <ListBoundary key={current.key} label={`mục "${current.label}"`} resetKey={state}>
          {current.render()}
        </ListBoundary>
      </section>
    </div>
  );
}
