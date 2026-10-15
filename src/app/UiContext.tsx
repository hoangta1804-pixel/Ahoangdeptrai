/**
 * Trạng thái giao diện: tài khoản đang đăng nhập (theo từng tab), tab khách hàng, sheet đang mở, thông báo nổi.
 * Vai trò, HTX và nhóm quyền Admin lấy từ tài khoản đăng nhập (mục 5.9); không có thanh chuyển vai trò công khai.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { actorOf } from '../domain/auth';
import type { OrderTabKey } from '../domain/orderTabs';
import type { Actor, AdminSubGroup, CartLine, UserAccount } from '../domain/types';
import { useStore } from '../store/AppDataContext';
import { loadSession, saveSession } from '../store/persistence';

export type CustomerTab = 'explore' | 'season' | 'orders' | 'account';

/** Đặt từ giỏ: `productIds` là các sản phẩm khách đã chọn trong giỏ (không có thì lấy cả giỏ). */
export type CheckoutSource = { type: 'cart'; productIds?: string[] } | { type: 'buy_now'; line: CartLine };

export type ModalState =
  | { type: 'product_detail'; productId: string }
  | { type: 'trace_lot'; productId: string }
  | { type: 'cart' }
  /** `addressId`: địa chỉ chọn sẵn, vd. địa chỉ vừa thêm từ bước đặt hàng. */
  | { type: 'checkout'; source: CheckoutSource; addressId?: string }
  | { type: 'payment'; txId: string }
  | { type: 'order_detail'; orderId: string }
  | { type: 'address_book' }
  /** `returnTo`: màn mở lại sau khi lưu hoặc đóng form (mặc định là sổ địa chỉ). */
  | { type: 'address_form'; addressId?: string; returnTo?: ModalState }
  | { type: 'complaint'; orderId?: string }
  | { type: 'coop_order'; orderId: string }
  /** HTX xác nhận thu hoạch cả lô cho một sản phẩm đặt trước. */
  | { type: 'coop_harvest'; productId: string }
  | { type: 'notifications' }
  | { type: 'review'; orderId: string; productId: string }
  | { type: 'coop_product_form'; productId?: string }
  | { type: 'demo_panel' };

const NO_ACTOR: Actor = { kind: 'system', name: 'Chưa đăng nhập' };

interface UiContextValue {
  /** Tài khoản đang đăng nhập ở tab này; null khi chưa đăng nhập. */
  user: UserAccount | null;
  login: (userId: string) => void;
  logout: () => void;
  /** Người đang thao tác (dùng cho mọi hàm domain). */
  actor: Actor;
  /** Bí danh của `actor` theo vai trò, để màn hình đọc rõ nghĩa. */
  customerActor: Actor;
  coopActor: Actor;
  adminActor: Actor;
  coopId: string;
  adminGroup: AdminSubGroup;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  /** Tab đang chọn trong "Đơn mua" của khách. */
  orderTab: OrderTabKey;
  setOrderTab: (tab: OrderTabKey) => void;
  /** Mở "Đơn mua" ở đúng tab (từ các biểu tượng trạng thái trong Tài khoản). */
  openOrders: (tab: OrderTabKey) => void;
  modal: ModalState | null;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  toast: string | null;
  showToast: (message: string) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const [userId, setUserId] = useState<string | null>(() => loadSession());
  const [customerTab, setCustomerTab] = useState<CustomerTab>('explore');
  const [orderTab, setOrderTab] = useState<OrderTabKey>('all');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const user = state.users.find((u) => u.id === userId && u.status === 'active') ?? null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const login = useCallback((id: string) => {
    saveSession(id);
    setUserId(id);
    setModal(null);
    setCustomerTab('explore');
    setOrderTab('all');
  }, []);
  const openOrders = useCallback((tab: OrderTabKey) => {
    setOrderTab(tab);
    setCustomerTab('orders');
  }, []);
  const logout = useCallback(() => {
    saveSession(null);
    setUserId(null);
    setModal(null);
  }, []);
  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo<UiContextValue>(() => {
    const actor = user ? actorOf(user) : NO_ACTOR;
    return {
      user,
      login,
      logout,
      actor,
      customerActor: actor,
      coopActor: actor,
      adminActor: actor,
      coopId: user?.coopId ?? '',
      adminGroup: user?.adminGroup ?? 'operations',
      customerTab,
      setCustomerTab,
      orderTab,
      setOrderTab,
      openOrders,
      modal,
      openModal: setModal,
      closeModal,
      toast,
      showToast,
    };
  }, [user, login, logout, customerTab, orderTab, openOrders, modal, closeModal, toast, showToast]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi phải dùng bên trong UiProvider');
  return ctx;
}
