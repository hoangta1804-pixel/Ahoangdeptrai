import { useSyncExternalStore } from 'react';
import { OrderGroup, SplitChildOrder } from '../mock/types';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export interface OrderState {
  orderGroups: OrderGroup[];
  activeOrderGroup: OrderGroup | null;
  createOrderGroup: (orderGroup: OrderGroup) => void;
  getOrderGroupById: (id: string) => OrderGroup | undefined;
  markPaymentSuccess: (groupId: string) => void;
  markPaymentFailed: (groupId: string) => void;
  cancelOrderGroup: (groupId: string, reason?: string) => void;
  simulateLatePaymentArrival: (groupId: string) => void;
}

export const useOrderStore = (function createOrderStore() {
  let orderGroups: OrderGroup[] = [];
  let activeOrderGroup: OrderGroup | null = null;
  let listeners: Array<() => void> = [];

  function notify() {
    listeners.forEach((l) => l());
  }

  const createOrderGroup = (group: OrderGroup) => {
    orderGroups = [group, ...orderGroups];
    activeOrderGroup = group;
    updateSnapshot();
  };

  const getOrderGroupById = (id: string) => {
    return orderGroups.find((g) => g.id === id || g.orderGroupCode === id);
  };

  const markPaymentSuccess = (groupId: string) => {
    orderGroups = orderGroups.map((g) => {
      if (g.id === groupId || g.orderGroupCode === groupId) {
        return {
          ...g,
          paymentStatus: 'paid',
          orders: g.orders.map((o) => ({ ...o, status: 'confirmed' })),
        };
      }
      return g;
    });
    if (activeOrderGroup && (activeOrderGroup.id === groupId || activeOrderGroup.orderGroupCode === groupId)) {
      activeOrderGroup = {
        ...activeOrderGroup,
        paymentStatus: 'paid',
        orders: activeOrderGroup.orders.map((o) => ({ ...o, status: 'confirmed' })),
      };
    }
    updateSnapshot();
  };

  const markPaymentFailed = (groupId: string) => {
    orderGroups = orderGroups.map((g) => {
      if (g.id === groupId || g.orderGroupCode === groupId) {
        return {
          ...g,
          paymentStatus: 'failed',
        };
      }
      return g;
    });
    if (activeOrderGroup && (activeOrderGroup.id === groupId || activeOrderGroup.orderGroupCode === groupId)) {
      activeOrderGroup = {
        ...activeOrderGroup,
        paymentStatus: 'failed',
      };
    }
    updateSnapshot();
  };

  const cancelOrderGroup = (groupId: string) => {
    orderGroups = orderGroups.map((g) => {
      if (g.id === groupId || g.orderGroupCode === groupId) {
        return {
          ...g,
          paymentStatus: 'timeout_cancelled',
          orders: g.orders.map((o) => ({ ...o, status: 'cancelled' })),
        };
      }
      return g;
    });
    if (activeOrderGroup && (activeOrderGroup.id === groupId || activeOrderGroup.orderGroupCode === groupId)) {
      activeOrderGroup = {
        ...activeOrderGroup,
        paymentStatus: 'timeout_cancelled',
        orders: activeOrderGroup.orders.map((o) => ({ ...o, status: 'cancelled' })),
      };
    }
    updateSnapshot();
  };

  const simulateLatePaymentArrival = (groupId: string) => {
    // Tiền về sau khi đơn đã bị hủy: không khôi phục đơn, chuyển sang hoàn tiền
    orderGroups = orderGroups.map((g) => {
      if (g.id === groupId || g.orderGroupCode === groupId) {
        return {
          ...g,
          paymentStatus: 'refund_pending',
        };
      }
      return g;
    });
    if (activeOrderGroup && (activeOrderGroup.id === groupId || activeOrderGroup.orderGroupCode === groupId)) {
      activeOrderGroup = {
        ...activeOrderGroup,
        paymentStatus: 'refund_pending',
      };
    }
    updateSnapshot();
  };

  let snapshot: OrderState = {
    orderGroups,
    activeOrderGroup,
    createOrderGroup,
    getOrderGroupById,
    markPaymentSuccess,
    markPaymentFailed,
    cancelOrderGroup,
    simulateLatePaymentArrival,
  };

  function updateSnapshot() {
    snapshot = {
      orderGroups,
      activeOrderGroup,
      createOrderGroup,
      getOrderGroupById,
      markPaymentSuccess,
      markPaymentFailed,
      cancelOrderGroup,
      simulateLatePaymentArrival,
    };
    notify();
  }

  const store = {
    getState: (): OrderState => snapshot,
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };

  return store;
})();

export function useOrders() {
  return useSyncExternalStore(
    useOrderStore.subscribe,
    useOrderStore.getState,
    useOrderStore.getState
  );
}
