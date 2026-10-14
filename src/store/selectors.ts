/**
 * Chuyển dữ liệu UI hiện tại sang dạng mà các hàm domain cần.
 * Giai đoạn 2–3 sẽ bỏ lớp chuyển đổi này khi đơn hàng dùng mô hình nghiệp vụ mới.
 */
import type { HoldingOrder } from '../domain/stock';
import type { Order, OrderStatus } from '../domain/types';

const LEGACY_STATUS: Record<Order['status'], OrderStatus> = {
  pending_deposit: 'awaiting_payment',
  confirmed: 'confirmed',
  harvesting: 'awaiting_harvest',
  delivering: 'shipping',
  completed: 'delivered',
  delayed: 'awaiting_harvest',
  cancelled: 'cancelled',
};

export function toHoldingOrders(orders: Order[]): HoldingOrder[] {
  return orders.map((o) => ({
    status: LEGACY_STATUS[o.status],
    kind: o.isPreorder ? 'preorder' : 'ready',
    items: o.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
  }));
}
