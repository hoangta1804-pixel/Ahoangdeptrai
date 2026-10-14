import { Building2, Lock, RotateCcw, ShoppingBag, Store, type LucideIcon } from 'lucide-react';
import type { UserRole } from '../domain/types';
import { Toast } from '../components/Toast';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { CoopScreen } from '../screens/coop/CoopScreen';
import { CustomerScreen } from '../screens/customer/CustomerScreen';
import { RegulatorScreen } from '../screens/regulator/RegulatorScreen';
import { useAppData } from '../store/AppDataContext';
import { ModalHost } from './ModalHost';
import { useUi } from './UiContext';

/**
 * Thanh chuyển vai trò tạm giữ trong Giai đoạn 1–2 để demo được các phía.
 * Giai đoạn 3 bỏ thanh này: đổi vai trò bằng đăng xuất rồi đăng nhập tài khoản khác (mục 5.9).
 * Vai trò Giao vận (Shipper) tạm ẩn theo OI-01, xem src/screens/_pending-OI-01.
 */
const ROLES: { role: UserRole; label: string; Icon: LucideIcon }[] = [
  { role: 'customer', label: 'Khách hàng', Icon: ShoppingBag },
  { role: 'coop', label: 'HTX', Icon: Store },
  { role: 'regulator', label: 'QLNN', Icon: Building2 },
  { role: 'admin', label: 'Admin', Icon: Lock },
];

/** Khách và HTX dùng bố cục điện thoại (rộng tối đa ~640px); Admin và QLNN dùng bố cục rộng. */
const WIDE_ROLES: UserRole[] = ['admin', 'regulator'];

export function AppShell() {
  const { role, setRole, closeModal, showToast } = useUi();
  const { resetDemoData } = useAppData();
  const wide = WIDE_ROLES.includes(role);

  const handleReset = () => {
    if (!window.confirm('Khôi phục dữ liệu mẫu? Mọi đơn, giỏ hàng và thay đổi đã lưu trên trình duyệt này sẽ bị xoá.')) return;
    resetDemoData();
    closeModal();
    showToast('Đã khôi phục dữ liệu mẫu.');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F4F0] text-stone-800">
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-900 text-stone-200">
        <div className={`mx-auto flex w-full items-center gap-2 px-3 py-1.5 ${wide ? 'max-w-6xl' : 'max-w-[640px]'}`}>
          <nav aria-label="Chuyển vai trò demo" className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
            {ROLES.map(({ role: r, label, Icon }) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  closeModal();
                }}
                aria-current={role === r ? 'page' : undefined}
                className={`flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-sm font-medium transition-colors ${
                  role === r ? 'bg-emerald-700 text-white' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
          <button
            onClick={handleReset}
            aria-label="Khôi phục dữ liệu mẫu"
            title="Khôi phục dữ liệu mẫu"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-white"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Khôi phục dữ liệu mẫu</span>
          </button>
        </div>
      </header>

      <main className={`mx-auto flex w-full flex-1 flex-col bg-[#FAF8F5] ${wide ? 'max-w-6xl' : 'max-w-[640px]'}`}>
        {role === 'customer' && <CustomerScreen />}
        {role === 'coop' && <CoopScreen />}
        {role === 'regulator' && <RegulatorScreen />}
        {role === 'admin' && <AdminScreen />}
      </main>

      <ModalHost />
      <Toast />
    </div>
  );
}
