import { useState, type ReactNode } from 'react';
import {
  BadgeCheck, BarChart3, BookOpen, ClipboardCheck, FileText, Gauge, History, Landmark, LayoutDashboard, MessageSquareWarning,
  Newspaper, PackageSearch, Receipt, ScrollText, Settings2, ShieldCheck, Star, Store, Ticket, Truck, Undo2, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import {ContentManagementTab} from './ContentManagementTab';
import { useUi } from '../../app/UiContext';
import { PAGE_X } from '../../app/layout';
import { ListBoundary } from '../../components/ListBoundary';
import { useStore } from '../../store/AppDataContext';
import { ADMIN_GROUP_LABEL, type AdminSubGroup } from '../../domain/types';
import { AdminAccountsTab } from './AdminAccountsTab';
import { AdminAuditTab } from './AdminAuditTab';
import { AdminCoopsTab } from './AdminCoopsTab';
import { FinanceCodTab } from './FinanceCodTab';
import { FinanceInvoicesTab } from './FinanceInvoicesTab';
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
import { QualityApplicationsTab } from './QualityApplicationsTab';
import { QualityChangesTab } from './QualityChangesTab';

type TabDef = { key: string; label: string; render: () => ReactNode };

/** Biểu tượng và mô tả ngắn cho từng mục quản trị. */
const TAB_META: Record<string, { Icon: LucideIcon; hint: string }> = {
  overview: { Icon: LayoutDashboard, hint: 'Số liệu chính của sàn trong nháy mắt.' },
  'coop-list': { Icon: Store, hint: 'Liên hệ và sản phẩm đang bán của từng hợp tác xã.' },
  orders: { Icon: PackageSearch, hint: 'Theo dõi và xử lý đơn hàng toàn sàn.' },
  carrier: { Icon: Truck, hint: 'Phân công và theo dõi giao hàng.' },
  accounts: { Icon: Users, hint: 'Cấp, khoá và phân quyền tài khoản.' },
  params: { Icon: Settings2, hint: 'Tham số vận hành của hệ thống.' },
  catalog: { Icon: BookOpen, hint: 'Danh mục dùng chung cho sản phẩm.' },
  content: { Icon: Newspaper, hint: 'Nội dung hiển thị trên trang chủ.' },
  vouchers: { Icon: Ticket, hint: 'Tạo và quản lý mã ưu đãi.' },
  applications: { Icon: ClipboardCheck, hint: 'Duyệt hồ sơ hợp tác xã đăng ký mới.' },
  changes: { Icon: BadgeCheck, hint: 'Duyệt thay đổi sản phẩm và giá.' },
  coops: { Icon: ShieldCheck, hint: 'Hồ sơ HTX và quyền bán hàng.' },
  tickets: { Icon: MessageSquareWarning, hint: 'Tiếp nhận và xử lý khiếu nại.' },
  reviews: { Icon: Star, hint: 'Kiểm duyệt đánh giá của khách hàng.' },
  refunds: { Icon: Undo2, hint: 'Duyệt và theo dõi hoàn tiền.' },
  settlement: { Icon: Landmark, hint: 'Đối soát và chi trả cho HTX.' },
  ledger: { Icon: ScrollText, hint: 'Sổ giao dịch tài chính.' },
  cod: { Icon: Wallet, hint: 'Theo dõi tiền thu hộ COD.' },
  invoices: { Icon: Receipt, hint: 'Hoá đơn cho khách hàng công ty.' },
  audit: { Icon: History, hint: 'Nhật ký thao tác trên hệ thống.' },
};
const metaOf = (key: string) => TAB_META[key] ?? { Icon: FileText, hint: '' };
const greeting = (hour: number) => (hour < 5 ? 'Xin chào' : hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');

const OVERVIEW: TabDef = { key: 'overview', label: 'Tổng quan', render: () => <AdminOverviewTab /> };
/** Danh sách HTX (có SĐT, địa chỉ để Admin liên hệ HTX, sản phẩm đang bán của từng HTX): mọi nhóm quyền đều có. */
const COOP_LIST: TabDef = { key: 'coop-list', label: 'Danh sách HTX', render: () => <AdminCoopsTab /> };

/** Chức năng theo nhóm quyền (mục 8). Nhóm quyền lấy từ tài khoản đăng nhập. */
const TABS: Record<AdminSubGroup, TabDef[]> = {
  operations: [
    OVERVIEW,
    { key: 'orders', label: 'Đơn hàng', render: () => <AdminOrdersTab /> },
    { key: 'carrier', label: 'Giao hàng', render: () => <CarrierSimTab /> },
    { key: 'accounts', label: 'Cấp & khoá tài khoản', render: () => <OpsAccountsTab /> },
    { key: 'params', label: 'Tham số', render: () => <AdminParamsTab /> },
    { key: 'catalog', label: 'Danh mục dùng chung', render: () => <SharedCatalogTab /> },
    { key:'content',label:'Nội dung trang chủ',render:()=> <ContentManagementTab/> },
    { key: 'vouchers', label: 'Mã ưu đãi', render: () => <VouchersTab /> },
    COOP_LIST,
  ],
  quality: [
    OVERVIEW,
    { key: 'applications', label: 'Duyệt HTX mới', render: () => <QualityApplicationsTab /> },
    { key: 'changes', label: 'Duyệt sản phẩm & giá', render: () => <QualityChangesTab /> },
    { key: 'coops', label: 'Hồ sơ HTX & quyền bán', render: () => <QualityCoopsTab /> },
    COOP_LIST,
  ],
  cskh: [
    OVERVIEW,
    { key: 'tickets', label: 'Ticket khiếu nại', render: () => <CskhTicketsTab /> },
    { key: 'reviews', label: 'Kiểm duyệt đánh giá', render: () => <CskhReviewsTab /> },
    COOP_LIST,
  ],
  finance: [
    OVERVIEW,
    { key: 'refunds', label: 'Hoàn tiền', render: () => <FinanceRefundsTab /> },
    { key: 'settlement', label: 'Đối soát HTX', render: () => <FinanceSettlementTab /> },
    { key: 'ledger', label: 'Sổ giao dịch', render: () => <FinanceLedgerTab /> },
    { key: 'cod', label: 'Thu hộ COD', render: () => <FinanceCodTab /> },
    { key: 'invoices', label: 'Hoá đơn công ty', render: () => <FinanceInvoicesTab /> },
    COOP_LIST,
  ],
  root: [
    { key: 'accounts', label: 'Phân quyền', render: () => <AdminAccountsTab /> },
    { key: 'audit', label: 'Nhật ký', render: () => <AdminAuditTab /> },
    { key:'params',label:'Tham số (chỉ xem)',render:()=> <AdminParamsTab/> },
  ],
};

/** Admin theo nhóm quyền (mục 8). Giao diện rộng cho máy tính: thanh mục bên trái, nội dung bên phải. */
export function AdminScreen() {
  const { adminGroup, user } = useUi();
  const { state, now } = useStore();
  const tabs = TABS[adminGroup];
  const [tab, setTab] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];
  const { Icon: CurrentIcon, hint } = metaOf(current.key);
  const today = now();
  const stats = [
    { label: 'Đơn hàng', value: state.orders.length, Icon: BarChart3 },
    { label: 'Hợp tác xã', value: state.coops.length, Icon: Store },
    { label: 'Sản phẩm', value: state.products.filter((p) => p.status === 'active').length, Icon: Gauge },
  ];

  return (
    <div className={`admin-shell flex flex-1 flex-col gap-4 py-5 lg:flex-row lg:gap-6 ${PAGE_X}`}>
      <aside className="admin-sidebar space-y-3 lg:sticky lg:top-[calc(var(--app-header-h,0px)+1rem)] lg:w-64 lg:shrink-0 lg:self-start">
        <div className="admin-badge lattice relative hidden lg:block overflow-hidden rounded-3xl bg-forest-950 p-5 pb-6 text-white">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-300">Quản trị</span>
          <p className="font-display text-lg font-semibold">{ADMIN_GROUP_LABEL[adminGroup]}</p>
          <p className="mt-1 text-xs text-forest-200">{tabs.length} chức năng</p>
          <div aria-hidden="true" className="brocade-dark absolute inset-x-0 bottom-0 h-2" />
        </div>
        <nav className="admin-nav no-scrollbar flex gap-1.5 overflow-x-auto lg:flex-col" aria-label="Chức năng quản trị">
          {tabs.map((t) => {
            const { Icon } = metaOf(t.key);
            const active = current.key === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} aria-current={active ? 'page' : undefined} className={`admin-nav-item ${active ? 'is-active' : ''}`}>
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0 flex-1 space-y-4">
        <header className="admin-hero">
          <div className="min-w-0">
            <p className="admin-hero-greet">{greeting(today.getHours())}, {user?.name ?? 'Quản trị viên'} 👋</p>
            <h1 className="admin-hero-title"><span className="admin-hero-icon"><CurrentIcon size={20} /></span>{current.label}</h1>
            {hint && <p className="admin-hero-hint">{hint}</p>}
          </div>
          <div className="admin-hero-stats" aria-label="Số liệu nhanh">
            {stats.map(({ label, value, Icon }) => (
              <div key={label}><Icon size={15} aria-hidden="true" /><strong className="tabular-nums">{value}</strong><span>{label}</span></div>
            ))}
          </div>
        </header>
        <div key={current.key} className="admin-panel">
          <ListBoundary key={current.key} label={`mục "${current.label}"`} resetKey={state}>
            {current.render()}
          </ListBoundary>
        </div>
      </section>
    </div>
  );
}
