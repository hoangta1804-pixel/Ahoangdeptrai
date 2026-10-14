import { Bell, FlaskConical, LogOut } from 'lucide-react';
import { Toast } from '../components/Toast';
import { ACCOUNT_ROLE_LABEL, ADMIN_GROUP_LABEL } from '../domain/types';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { CoopScreen } from '../screens/coop/CoopScreen';
import { CustomerScreen } from '../screens/customer/CustomerScreen';
import { RegulatorScreen } from '../screens/regulator/RegulatorScreen';
import { useStore } from '../store/AppDataContext';
import { LoginScreen } from './LoginScreen';
import { ModalHost } from './ModalHost';
import { useUi } from './UiContext';

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

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F4F0] text-stone-800">
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-900 text-stone-200">
        <div className={`mx-auto flex w-full items-center gap-1 px-3 py-1.5 ${width}`}>
          <div className="min-w-0 flex-1">
            {user ? (
              <>
                <span className="block truncate text-sm font-bold text-white">{user.name}</span>
                <span className="block truncate text-xs text-stone-400">{user.role === 'admin' && user.adminGroup ? `Admin – ${ADMIN_GROUP_LABEL[user.adminGroup]}` : ACCOUNT_ROLE_LABEL[user.role]}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-white">Đặc Sản Số Lào Cai</span>
            )}
          </div>
          {user && (
            <button
              onClick={() => openModal({ type: 'notifications' })}
              aria-label={`Thông báo, ${unread} chưa đọc`}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-200 hover:bg-stone-800"
            >
              <Bell size={20} />
              {unread > 0 && <span className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-stone-950">{unread}</span>}
            </button>
          )}
          <button
            onClick={() => openModal({ type: 'demo_panel' })}
            aria-label="Công cụ demo: tua thời gian, mô phỏng cổng thanh toán, khôi phục dữ liệu mẫu"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-400/60 px-2.5 text-sm font-semibold text-amber-300 hover:bg-stone-800"
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
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm text-stone-200 hover:bg-stone-800"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          )}
        </div>
      </header>

      <main className={`mx-auto flex w-full flex-1 flex-col bg-[#FAF8F5] ${width}`}>
        {!user && <LoginScreen />}
        {user?.role === 'customer' && <CustomerScreen />}
        {user?.role === 'coop' && <CoopScreen />}
        {user?.role === 'regulator' && <RegulatorScreen />}
        {user?.role === 'admin' && <AdminScreen />}
      </main>

      <ModalHost />
      <Toast />
    </div>
  );
}
