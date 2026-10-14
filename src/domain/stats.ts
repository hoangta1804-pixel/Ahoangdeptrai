/**
 * Số liệu tổng hợp tính từ dữ liệu trong store (L17, FR-BCTK-01).
 * Bản cho Cơ quan QLNN không chứa tên, SĐT, địa chỉ, tài khoản của khách.
 */
import { isTicketOpen } from './complaint';
import { findProduct } from './state';
import { ORDER_STATUSES, type DemoState, type OrderStatus } from './types';

export interface AggregateStats {
  coopsActive: number;
  productsActive: number;
  ordersTotal: number;
  ordersByStatus: Record<OrderStatus, number>;
  deliveredGoodsValue: number;
  ticketsOpen: number;
  ticketsHighPriority: number;
  byRegion: { region: string; orders: number; deliveredGoodsValue: number }[];
  byCoop: { coopName: string; orders: number; deliveredGoodsValue: number }[];
}

export function aggregateStats(state: DemoState): AggregateStats {
  const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  const region = new Map<string, { orders: number; deliveredGoodsValue: number }>();
  const coop = new Map<string, { orders: number; deliveredGoodsValue: number }>();
  let deliveredGoodsValue = 0;
  for (const o of state.orders) {
    ordersByStatus[o.status]++;
    const delivered = o.status === 'delivered' ? o.pricing.itemsTotal : 0;
    deliveredGoodsValue += delivered;
    const r = findProduct(state, o.items[0]?.productId ?? '')?.region ?? 'Khác';
    const rv = region.get(r) ?? { orders: 0, deliveredGoodsValue: 0 };
    region.set(r, { orders: rv.orders + 1, deliveredGoodsValue: rv.deliveredGoodsValue + delivered });
    const cv = coop.get(o.coopName) ?? { orders: 0, deliveredGoodsValue: 0 };
    coop.set(o.coopName, { orders: cv.orders + 1, deliveredGoodsValue: cv.deliveredGoodsValue + delivered });
  }
  return {
    coopsActive: state.coops.filter((c) => c.status === 'active').length,
    productsActive: state.products.filter((p) => p.status === 'active').length,
    ordersTotal: state.orders.length,
    ordersByStatus,
    deliveredGoodsValue,
    ticketsOpen: state.tickets.filter(isTicketOpen).length,
    ticketsHighPriority: state.tickets.filter((t) => isTicketOpen(t) && t.priority === 'high').length,
    byRegion: [...region].map(([k, v]) => ({ region: k, ...v })).sort((a, b) => b.orders - a.orders),
    byCoop: [...coop].map(([k, v]) => ({ coopName: k, ...v })).sort((a, b) => b.orders - a.orders),
  };
}

/** Dòng đơn cho Cơ quan QLNN: chỉ HTX, vùng, trạng thái, giá trị, ngày; không có dữ liệu cá nhân của khách. */
export interface RegulatorOrderRow {
  coopName: string;
  region: string;
  status: OrderStatus;
  itemsTotal: number;
  createdDate: string;
}

export function regulatorOrderRows(state: DemoState): RegulatorOrderRow[] {
  return state.orders.map((o) => ({
    coopName: o.coopName,
    region: findProduct(state, o.items[0]?.productId ?? '')?.region ?? 'Khác',
    status: o.status,
    itemsTotal: o.pricing.itemsTotal,
    createdDate: o.createdAt.slice(0, 10),
  }));
}
