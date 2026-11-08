import { CartLine, TempCart, Variant, Product } from '../mock/types';
import { checkCanAddToCart, getAvailableStock } from '../lib/stock';

const GUEST_CART_KEY_PREFIX = 'dss_guest_cart_';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface UndoRemovalRecord {
  line: CartLine;
  index: number;
}

export interface LastAdditionRecord {
  lineId: string;
  variantId: string;
  quantityAdded: number;
  productName: string;
}

interface CartState {
  deviceId: string;
  lines: CartLine[];
  lastRemovedLine: UndoRemovalRecord | null;
  lastAddition: LastAdditionRecord | null;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setDeviceId: (deviceId: string) => void;
  addToCart: (
    product: Product,
    variant: Variant,
    quantity?: number
  ) => { success: boolean; message?: string; lineId?: string };
  undoLastAdd: () => { success: boolean; message?: string };
  removeFromCart: (lineId: string) => void;
  undoLastRemoval: () => void;
  updateQuantity: (
    lineId: string,
    variant: Variant,
    newQuantity: number
  ) => { success: boolean; message?: string };
  clearCart: () => void;
  mergeGuestCart: (guestLines: CartLine[], variantsMap: Record<string, Variant>) => {
    adjustedCount: number;
    totalMerged: number;
  };
  loadCartForDevice: (deviceId: string) => void;
}

function loadStoredCart(deviceId: string): CartLine[] {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return [];
    const raw = localStorage.getItem(`${GUEST_CART_KEY_PREFIX}${deviceId}`);
    if (!raw) return [];
    const parsed: TempCart = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(`${GUEST_CART_KEY_PREFIX}${deviceId}`);
      return [];
    }
    return parsed.lines || [];
  } catch {
    return [];
  }
}

function saveStoredCart(deviceId: string, lines: CartLine[]) {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    const data: TempCart = {
      deviceId,
      lines,
      updatedAt: Date.now(),
      expiresAt: Date.now() + SEVEN_DAYS_MS,
    };
    localStorage.setItem(`${GUEST_CART_KEY_PREFIX}${deviceId}`, JSON.stringify(data));
  } catch (e) {
    // ignore in non-browser env
  }
}

export const useCartStore = (function createCartStore() {
  let listeners: Array<() => void> = [];
  let deviceId = 'device_1';
  let lines: CartLine[] = loadStoredCart(deviceId);
  let isCartOpen = false;
  let lastRemovedLine: UndoRemovalRecord | null = null;
  let lastAddition: LastAdditionRecord | null = null;

  function notify() {
    listeners.forEach((l) => l());
  }

  const setCartOpen = (open: boolean) => {
    isCartOpen = open;
    updateSnapshot();
  };

  const setDeviceId = (newDevice: string) => {
    saveStoredCart(deviceId, lines);
    deviceId = newDevice;
    lines = loadStoredCart(newDevice);
    updateSnapshot();
  };

  const addToCart = (product: Product, variant: Variant, quantity = 1) => {
    const existing = lines.find((l) => l.variantId === variant.id);
    const currentQty = existing ? existing.quantity : 0;

    const check = checkCanAddToCart(currentQty, quantity, variant);
    if (!check.allowed) {
      return { success: false, message: check.message };
    }

    let updatedLineId = '';
    if (existing) {
      lines = lines.map((l) => {
        if (l.variantId === variant.id) {
          updatedLineId = l.id;
          return { ...l, quantity: l.quantity + quantity, updatedAt: Date.now() };
        }
        return l;
      });
    } else {
      updatedLineId = `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      lines = [
        ...lines,
        {
          id: updatedLineId,
          productId: product.id,
          variantId: variant.id,
          quantity,
          addedAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
    }

    lastAddition = {
      lineId: updatedLineId,
      variantId: variant.id,
      quantityAdded: quantity,
      productName: product.name,
    };

    saveStoredCart(deviceId, lines);
    updateSnapshot();
    return { success: true, lineId: updatedLineId };
  };

  const undoLastAdd = () => {
    if (!lastAddition) return { success: false };
    const record = lastAddition;
    lastAddition = null;

    const line = lines.find((l) => l.id === record.lineId);
    if (!line) return { success: false };

    if (line.quantity <= record.quantityAdded) {
      // Bỏ hoàn toàn dòng
      lines = lines.filter((l) => l.id !== record.lineId);
    } else {
      // Bỏ đúng số lượng vừa thêm
      lines = lines.map((l) =>
        l.id === record.lineId
          ? { ...l, quantity: l.quantity - record.quantityAdded, updatedAt: Date.now() }
          : l
      );
    }

    saveStoredCart(deviceId, lines);
    updateSnapshot();
    return { success: true, message: `Đã hoàn tác thêm ${record.productName}` };
  };

  const removeFromCart = (lineId: string) => {
    const index = lines.findIndex((l) => l.id === lineId);
    if (index === -1) return;

    const line = lines[index];
    lastRemovedLine = { line, index };
    lines = lines.filter((l) => l.id !== lineId);
    saveStoredCart(deviceId, lines);
    updateSnapshot();
  };

  const undoLastRemoval = () => {
    if (!lastRemovedLine) return;
    const { line, index } = lastRemovedLine;
    lastRemovedLine = null;

    const newLines = [...lines];
    newLines.splice(Math.min(index, newLines.length), 0, line);
    lines = newLines;
    saveStoredCart(deviceId, lines);
    updateSnapshot();
  };

  const updateQuantity = (lineId: string, variant: Variant, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(lineId);
      return { success: true };
    }

    const available = getAvailableStock(variant);
    if (newQuantity > available) {
      return {
        success: false,
        message: `Chỉ còn tối đa ${available} sản phẩm.`,
      };
    }

    lines = lines.map((l) =>
      l.id === lineId ? { ...l, quantity: newQuantity, updatedAt: Date.now() } : l
    );
    saveStoredCart(deviceId, lines);
    updateSnapshot();
    return { success: true };
  };

  const clearCart = () => {
    lines = [];
    saveStoredCart(deviceId, lines);
    updateSnapshot();
  };

  const mergeGuestCart = (guestLines: CartLine[], variantsMap: Record<string, Variant>) => {
    let adjustedCount = 0;
    let totalMerged = 0;

    guestLines.forEach((gLine) => {
      const variant = variantsMap[gLine.variantId];
      const availableStock = variant ? getAvailableStock(variant) : 999;
      const existing = lines.find((l) => l.variantId === gLine.variantId);

      if (existing) {
        const desired = existing.quantity + gLine.quantity;
        const clamped = Math.min(desired, availableStock);
        if (clamped < desired) {
          adjustedCount++;
        }
        existing.quantity = clamped;
        existing.updatedAt = Date.now();
      } else {
        const clamped = Math.min(gLine.quantity, availableStock);
        if (clamped < gLine.quantity) {
          adjustedCount++;
        }
        if (clamped > 0) {
          lines.push({
            ...gLine,
            quantity: clamped,
            updatedAt: Date.now(),
          });
        }
      }
      totalMerged++;
    });

    saveStoredCart(deviceId, lines);
    updateSnapshot();
    return { adjustedCount, totalMerged };
  };

  const loadCartForDevice = (newDevice: string) => {
    deviceId = newDevice;
    lines = loadStoredCart(newDevice);
    updateSnapshot();
  };

  let snapshot: CartState = {
    deviceId,
    lines,
    isCartOpen,
    lastRemovedLine,
    lastAddition,
    setCartOpen,
    setDeviceId,
    addToCart,
    undoLastAdd,
    removeFromCart,
    undoLastRemoval,
    updateQuantity,
    clearCart,
    mergeGuestCart,
    loadCartForDevice,
  };

  function updateSnapshot() {
    snapshot = {
      deviceId,
      lines,
      isCartOpen,
      lastRemovedLine,
      lastAddition,
      setCartOpen,
      setDeviceId,
      addToCart,
      undoLastAdd,
      removeFromCart,
      undoLastRemoval,
      updateQuantity,
      clearCart,
      mergeGuestCart,
      loadCartForDevice,
    };
    notify();
  }

  const store = {
    getState: (): CartState => snapshot,
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };

  return store;
})();

// React hook wrapper
import { useSyncExternalStore } from 'react';

export function useCart() {
  const state = useSyncExternalStore(
    useCartStore.subscribe,
    useCartStore.getState,
    useCartStore.getState
  );
  return state;
}
