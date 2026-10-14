import { lazy, Suspense, useEffect, useRef } from 'react';
import { Bell, FlaskConical, LogOut } from 'lucide-react';
import { DemoBand } from '../components/DemoBand';
import { ListBoundary } from '../components/ListBoundary';
import { Toast } from '../components/Toast';
import { ACCOUNT_ROLE_LABEL, ADMIN_GROUP_LABEL } from '../domain/types';
import { CustomerScreen } from '../screens/customer/CustomerScreen';
import { useStore } from '../store/AppDataContext';
import { LoginScreen } from './LoginScreen';
import { ModalHost } from './ModalHost';
import { useUi } from './UiContext';

// Màn HTX, Admin, QLNN tải riêng theo vai trò, để khách trên điện thoại không phải tải mã của các màn này.
const CoopScreen = lazy(() => import('../screens/coop/CoopScreen').then((m) => ({ default: m.CoopScreen })));
const AdminScreen = lazy(() => import('../screens/admin/AdminScreen').then((m) => ({ default: m.AdminScreen })));
const RegulatorScreen = lazy(() => import('../screens/regulator/RegulatorScreen').then((m) => ({ default: m.RegulatorScreen })));

/**
 * Khung app. Không có thanh chuyển vai trò công khai: vai trò theo tài khoản đăng nhập (mục 5.9).
 * Khách và HTX dùng bố cục điện thoại (rộng tối đa ~640px); Admin và QLNN dùng bố cục rộng.
 */
export function AppShell() {
  const { state } = useStore();
  const { user, logout, openModal, showToast } = useUi();
  const wide = user?.role === 'admin' || user?.role === 'regulator';
  const unread = user ? state.notifications.filter((n) => n.userId === user.id && !n.read).length : 0;
  const width = wide ? 'max-w-7xl' : 'max-w-[640px]';

  // Chiều cao header (có dải demo, có thể xuống 2 dòng trên điện thoại) để thanh dính bên dưới nằm ngay dưới header.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => document.documentElement.style.setProperty('--app-header-h', `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Đăng nhập, đăng xuất thì về đầu trang (màn đăng nhập dài, không giữ vị trí cuộn sang màn mới).
  useEffect(() => window.scrollTo({ top: 0 }), [user?.id]);

  // Link chia sẻ sản phẩm (FR-TKSP-05): #/san-pham/<mã>. Chưa đăng nhập thì giữ link, mở sau khi khách đăng nhập.
  useEffect(() => {
    const open = () => {
      const m = window.location.hash.match(/^#\/san-pham\/([\w-]+)$/);
      if (!m || user?.role !== 'customer') return;
      if (state.products.some((p) => p.id === m[1] && p.status === 'active')) openModal({ type: 'product_detail', productId: m[1] });
      else showToast('Sản phẩm trong link không còn mở bán.');
      history.replaceState(null, '', window.location.pathname + window.location.search);
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100 text-ink">
      <header ref={headerRef} className="sticky top-0 z-40 border-b border-forest-950 bg-forest-900 text-forest-100">
        <DemoBand />
        <div className={`mx-auto flex w-full items-center gap-1 px-3 py-1.5 ${width}`}>
          <div className="min-w-0 flex-1">
            {user ? (
              <>
                <span className="block truncate text-sm font-bold text-white">{user.name}</span>
                <span className="block truncate text-xs text-forest-200">{user.role === 'admin' && user.adminGroup ? `Admin – ${ADMIN_GROUP_LABEL[user.adminGroup]}` : ACCOUNT_ROLE_LABEL[user.role]}</span>
              </>
            ) : (
              <span className="font-display text-base font-semibold text-white">Đặc Sản Số Lào Cai</span>
            )}
          </div>
          {user && (
            <button
              onClick={() => openModal({ type: 'notifications' })}
              aria-label={`Thông báo, ${unread} chưa đọc`}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-forest-100 hover:bg-forest-800"
            >
              <Bell size={20} />
              {unread > 0 && <span className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-champagne-500 px-1 text-xs font-bold text-ink">{unread}</span>}
            </button>
          )}
          <button
            onClick={() => openModal({ type: 'demo_panel' })}
            aria-label="Công cụ demo: tua thời gian, mô phỏng cổng thanh toán, khôi phục dữ liệu mẫu"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-champagne-400/60 px-2.5 text-sm font-semibold text-champagne-300 hover:bg-forest-800"
          >
            <FlaskConical size={16} />
            <span className="hidden sm:inline">Công cụ demo</span>
          </button>
          {user && (
            <button
              onClick={() => {
                logout();
                showToast('Đã đăng xuất.');
              }}
              aria-label="Đăng xuất"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm text-forest-100 hover:bg-forest-800"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          )}
        </div>
      </header>

      <main className={`mx-auto flex w-full flex-1 flex-col bg-ivory ${width}`}>
        <ListBoundary key={user?.id ?? 'guest'} label="màn này" resetKey={state}>
          <Suspense fallback={<p className="p-6 text-center text-sm text-stone-600">Đang tải…</p>}>
            {!user && <LoginScreen />}
            {user?.role === 'customer' && <CustomerScreen />}
            {user?.role === 'coop' && <CoopScreen />}
            {user?.role === 'regulator' && <RegulatorScreen />}
            {user?.role === 'admin' && <AdminScreen />}
          </Suspense>
        </ListBoundary>
      </main>

      <ModalHost />
      <Toast />
    </div>
  );
}
