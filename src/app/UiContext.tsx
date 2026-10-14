/**
 * Trạng thái giao diện dùng chung: vai trò đang xem, tài khoản demo đang dùng, tab, sheet đang mở, thông báo nổi.
 * Dữ liệu nghiệp vụ nằm ở src/store, không nằm ở đây.
 *
 * Giai đoạn 2: tài khoản đang dùng chọn trực tiếp trên giao diện (khách mẫu 1, HTX theo bộ chọn, nhóm quyền Admin theo tab).
 * Giai đoạn 3 thay bằng đăng nhập SĐT + OTP mô phỏng.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Actor, AdminSubGroup, CartLine, UserRole } from '../domain/types';
import { ADMIN_GROUP_LABEL } from '../domain/types';
import { useStore } from '../store/AppDataContext';

export type CustomerTab = 'explore' | 'season' | 'orders' | 'account';

export type CheckoutSource = { type: 'cart' } | { type: 'buy_now'; line: CartLine };

export type ModalState =
  | { type: 'product_detail'; productId: string }
  | { type: 'trace_lot'; productId: string }
  | { type: 'cart' }
  | { type: 'checkout'; source: CheckoutSource }
  | { type: 'payment'; txId: string }
  | { type: 'order_detail'; orderId: string }
  | { type: 'address_book' }
  | { type: 'address_form'; addressId?: string }
  | { type: 'complaint'; orderId?: string }
  | { type: 'coop_order'; orderId: string }
  | { type: 'demo_panel' }
  | { type: 'auth'; step?: 'login' | 'register' | 'otp' }
  | { type: 'silent_locked' }
  | { type: 'face_id_scan' };

export const DEMO_CUSTOMER_ID = 'cust-1';

interface UiContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  coopId: string;
  setCoopId: (id: string) => void;
  adminGroup: AdminSubGroup;
  setAdminGroup: (g: AdminSubGroup) => void;
  /** Người đang thao tác theo vai trò đang xem. */
  customerActor: Actor;
  coopActor: Actor;
  adminActor: Actor;
  modal: ModalState | null;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  toast: string | null;
  showToast: (message: string) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const [role, setRole] = useState<UserRole>('customer');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('explore');
  const [coopId, setCoopId] = useState('coop-bacha');
  const [adminGroup, setAdminGroup] = useState<AdminSubGroup>('operations');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo<UiContextValue>(
    () => ({
      role,
      setRole,
      customerTab,
      setCustomerTab,
      coopId,
      setCoopId,
      adminGroup,
      setAdminGroup,
      customerActor: { kind: 'customer', id: DEMO_CUSTOMER_ID, name: 'Khách hàng mẫu 1' },
      coopActor: { kind: 'coop', id: coopId, name: state.coops.find((c) => c.id === coopId)?.name ?? coopId },
      adminActor: { kind: 'admin', id: `admin-${adminGroup}`, name: `Admin – ${ADMIN_GROUP_LABEL[adminGroup]}`, adminGroup },
      modal,
      openModal: setModal,
      closeModal,
      toast,
      showToast,
    }),
    [role, customerTab, coopId, adminGroup, modal, closeModal, toast, showToast, state.coops],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi phải dùng bên trong UiProvider');
  return ctx;
}
