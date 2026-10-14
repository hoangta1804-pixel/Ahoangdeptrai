/**
 * Store dữ liệu dùng chung của app, lưu localStorage, có hàm khôi phục dữ liệu mẫu.
 * Giai đoạn 3 sẽ mở rộng thành đủ các thực thể ở mục 7 (users, checkouts, transactions…).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode, type SetStateAction } from 'react';
import { DEFAULT_PARAMS, type ParamChange, type Params } from '../domain/params';
import type { Address, AuditLog, CartItem, LedgerEntry, Order, Product, RefundBank, Ticket } from '../domain/types';
import {
  INITIAL_ADDRESSES,
  INITIAL_AUDITS,
  INITIAL_LEDGER,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_REFUND_BANK,
  INITIAL_TICKETS,
} from '../data/seed';
import { clearState, loadState, saveState, STORAGE_KEY } from './persistence';

export interface AppData {
  products: Product[];
  addresses: Address[];
  selectedAddressId: string;
  orders: Order[];
  tickets: Ticket[];
  ledger: LedgerEntry[];
  audits: AuditLog[];
  cart: CartItem[];
  refundBank: RefundBank;
  params: Params;
  paramHistory: ParamChange[];
}

export const createSeedData = (): AppData => structuredClone({
  products: INITIAL_PRODUCTS,
  addresses: INITIAL_ADDRESSES,
  selectedAddressId: INITIAL_ADDRESSES[0].id,
  orders: INITIAL_ORDERS,
  tickets: INITIAL_TICKETS,
  ledger: INITIAL_LEDGER,
  audits: INITIAL_AUDITS,
  cart: [],
  refundBank: INITIAL_REFUND_BANK,
  params: DEFAULT_PARAMS,
  paramHistory: [],
});

type Setter<T> = (value: SetStateAction<T>) => void;

interface AppDataContextValue extends AppData {
  selectedAddress: Address;
  setProducts: Setter<Product[]>;
  setAddresses: Setter<Address[]>;
  setSelectedAddressId: Setter<string>;
  setOrders: Setter<Order[]>;
  setTickets: Setter<Ticket[]>;
  setLedger: Setter<LedgerEntry[]>;
  setAudits: Setter<AuditLog[]>;
  setCart: Setter<CartItem[]>;
  setRefundBank: Setter<RefundBank>;
  setParams: Setter<Params>;
  setParamHistory: Setter<ParamChange[]>;
  /** Xoá dữ liệu đã lưu và nạp lại dữ liệu mẫu. */
  resetDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadState(createSeedData));

  useEffect(() => {
    saveState(data);
  }, [data]);

  // Tab khác cùng trình duyệt ghi dữ liệu thì nạp lại để các vai trò thấy chung một dữ liệu.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(loadState(createSeedData));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const field = useCallback(
    <K extends keyof AppData>(key: K): Setter<AppData[K]> =>
      (value) =>
        setData((prev) => ({
          ...prev,
          [key]: typeof value === 'function' ? (value as (p: AppData[K]) => AppData[K])(prev[key]) : value,
        })),
    [],
  );

  const resetDemoData = useCallback(() => {
    clearState();
    setData(createSeedData());
  }, []);

  const value = useMemo<AppDataContextValue>(() => {
    const selectedAddress = data.addresses.find((a) => a.id === data.selectedAddressId) ?? data.addresses[0];
    return {
      ...data,
      selectedAddress,
      setProducts: field('products'),
      setAddresses: field('addresses'),
      setSelectedAddressId: field('selectedAddressId'),
      setOrders: field('orders'),
      setTickets: field('tickets'),
      setLedger: field('ledger'),
      setAudits: field('audits'),
      setCart: field('cart'),
      setRefundBank: field('refundBank'),
      setParams: field('params'),
      setParamHistory: field('paramHistory'),
      resetDemoData,
    };
  }, [data, field, resetDemoData]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData phải dùng bên trong AppDataProvider');
  return ctx;
}
