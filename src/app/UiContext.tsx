/**
 * Trạng thái giao diện dùng chung: vai trò đang xem, tab khách hàng, sheet đang mở, thông báo nổi.
 * Dữ liệu nghiệp vụ nằm ở src/store, không nằm ở đây.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LedgerEntry, Product, UserRole } from '../domain/types';

export type CustomerTab = 'explore' | 'season' | 'orders' | 'account';

export type ModalState =
  | { type: 'product_detail'; product: Product }
  | { type: 'trace_lot'; product: Product }
  | { type: 'cart' }
  | { type: 'checkout' }
  | { type: 'address_sheet' }
  | { type: 'new_address' }
  | { type: 'ticket_form' }
  | { type: 'auth'; step?: 'login' | 'register' | 'otp' }
  | { type: 'silent_locked' }
  | { type: 'face_id_scan' }
  | { type: 'ledger_adjust'; row: LedgerEntry };

interface UiContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  modal: ModalState | null;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  toast: string | null;
  showToast: (message: string) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('customer');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('explore');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(
    () => ({ role, setRole, customerTab, setCustomerTab, modal, openModal: setModal, closeModal, toast, showToast }),
    [role, customerTab, modal, closeModal, toast, showToast],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi phải dùng bên trong UiProvider');
  return ctx;
}
