import { useSyncExternalStore } from 'react';
import { Product, Variant } from '../mock/types';

export interface BuyNowSession {
  product: Product;
  variant: Variant;
  quantity: number;
  startedAt: number;
}

export interface BuyNowState {
  session: BuyNowSession | null;
  startBuyNow: (product: Product, variant: Variant, quantity?: number) => void;
  clearBuyNow: () => void;
}

export const useBuyNowStore = (function createBuyNowStore() {
  let session: BuyNowSession | null = null;
  let listeners: Array<() => void> = [];

  function notify() {
    listeners.forEach((l) => l());
  }

  const startBuyNow = (product: Product, variant: Variant, quantity = 1) => {
    session = {
      product,
      variant,
      quantity,
      startedAt: Date.now(),
    };
    updateSnapshot();
  };

  const clearBuyNow = () => {
    session = null;
    updateSnapshot();
  };

  let snapshot: BuyNowState = {
    session,
    startBuyNow,
    clearBuyNow,
  };

  function updateSnapshot() {
    snapshot = {
      session,
      startBuyNow,
      clearBuyNow,
    };
    notify();
  }

  const store = {
    getState: (): BuyNowState => snapshot,
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };

  return store;
})();

export function useBuyNow() {
  return useSyncExternalStore(
    useBuyNowStore.subscribe,
    useBuyNowStore.getState,
    useBuyNowStore.getState
  );
}
