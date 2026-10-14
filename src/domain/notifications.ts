/**
 * Trung tâm thông báo cho từng tài khoản (FR-CSKH-10, mục 7).
 *
 * Thông báo được sinh bằng cách so dữ liệu trước và sau mỗi thao tác (deriveNotifications), nên mọi đường thay đổi
 * (người dùng bấm, tác vụ theo giờ, cổng thanh toán mô phỏng) đều sinh thông báo giống nhau.
 * Các sự kiện: đổi trạng thái đơn, kết quả duyệt, ticket, tồn thấp (tối đa 1 lần/ngày/sản phẩm), mời đánh giá.
 */
import { generateId } from './ids';
import { formatMoney } from './pricing';
import { iso, remainingFor, toDateKey } from './state';
import {
  ORDER_STATUS_LABEL,
  TICKET_STATUS_LABEL,
  type AdminSubGroup,
  type AppNotification,
  type DemoState,
  type NotificationLink,
  type Order,
} from './types';

type Draft = { userIds: string[]; title: string; body: string; link?: NotificationLink };

export const usersOfCoop = (s: DemoState, coopId: string): string[] =>
  s.users.filter((u) => u.role === 'coop' && u.coopId === coopId && u.status === 'active').map((u) => u.id);

export const usersOfCustomer = (s: DemoState, customerId: string): string[] =>
  s.users.filter((u) => u.role === 'customer' && u.customerId === customerId).map((u) => u.id);

export const adminsOf = (s: DemoState, group: AdminSubGroup): string[] =>
  s.users.filter((u) => u.role === 'admin' && u.adminGroup === group && u.status === 'active').map((u) => u.id);

function orderDrafts(prev: DemoState, next: DemoState, o: Order): Draft[] {
  const before = prev.orders.find((x) => x.id === o.id);
  const link: NotificationLink = { type: 'order', id: o.id };
  const customer = usersOfCustomer(next, o.customerId);
  const coop = usersOfCoop(next, o.coopId);
  const out: Draft[] = [];

  if (!before) {
    out.push({ userIds: customer, title: `Đã tạo đơn ${o.id}`, body: `${o.coopName} · ${ORDER_STATUS_LABEL[o.status]}`, link });
    if (o.status === 'awaiting_confirmation') {
      out.push({ userIds: coop, title: `Đơn mới ${o.id} cần xác nhận`, body: `Khách trả khi nhận hàng. Hạn xác nhận ${o.confirmDeadline ? new Date(o.confirmDeadline).toLocaleString('vi-VN') : ''}.`, link });
    }
    return out;
  }

  if (before.status !== o.status) {
    const last = o.statusHistory[o.statusHistory.length - 1];
    const reason = last?.reason ? ` – ${last.reason}` : '';
    // Không báo lại cho chính bên vừa thao tác.
    if (last?.actor.kind !== 'customer') {
      out.push({ userIds: customer, title: `Đơn ${o.id}: ${ORDER_STATUS_LABEL[o.status]}`, body: `${o.coopName}${reason}`, link });
    }
    if (before.status === 'awaiting_payment' && o.status === 'awaiting_confirmation') {
      out.push({ userIds: coop, title: `Đơn mới ${o.id} đã thanh toán, cần xác nhận`, body: `Hạn xác nhận ${o.confirmDeadline ? new Date(o.confirmDeadline).toLocaleString('vi-VN') : ''}.`, link });
    } else if (o.status !== 'awaiting_payment' && before.status !== 'awaiting_payment' && last?.actor.kind !== 'coop') {
      out.push({ userIds: coop, title: `Đơn ${o.id}: ${ORDER_STATUS_LABEL[o.status]}`, body: reason.replace(/^ – /, '') || ORDER_STATUS_LABEL[o.status], link });
    }
    if (o.status === 'delivered') {
      out.push({ userIds: customer, title: 'Mời bạn đánh giá sản phẩm', body: `Đơn ${o.id} đã giao. Hãy cho HTX biết cảm nhận của bạn.`, link });
    }
  }

  if (!before.readyReportedAt && o.readyReportedAt && o.remainingDueAt) {
    out.push({
      userIds: customer,
      title: `Hàng đơn ${o.id} đã sẵn sàng`,
      body: `Vui lòng trả phần còn lại ${formatMoney(o.pricing.remaining)} trước ${new Date(o.remainingDueAt).toLocaleString('vi-VN')}.`,
      link,
    });
  }
  if (before.paymentStatus !== o.paymentStatus && ['refund_pending', 'refunding', 'refunded'].includes(o.paymentStatus)) {
    const label = o.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : o.paymentStatus === 'refunding' ? 'Đang hoàn tiền' : 'Chờ hoàn tiền';
    out.push({ userIds: customer, title: `Đơn ${o.id}: ${label}`, body: 'Theo dõi chi tiết hoàn tiền trong đơn hàng.', link });
  }
  if (o.cancelRequest?.status === 'pending' && before.cancelRequest?.status !== 'pending') {
    out.push({ userIds: coop, title: `Khách yêu cầu huỷ đơn ${o.id}`, body: o.cancelRequest.reason, link });
  }
  if (o.cancelRequest && before.cancelRequest?.status === 'pending' && o.cancelRequest.status === 'rejected') {
    out.push({ userIds: customer, title: `HTX từ chối yêu cầu huỷ đơn ${o.id}`, body: o.cancelRequest.rejectReason ?? '', link });
  }
  return out;
}

/** So dữ liệu trước và sau một thao tác, thêm thông báo cho đúng tài khoản. Hàm thuần. */
export function deriveNotifications(prev: DemoState, next: DemoState, at: Date): DemoState {
  if (prev === next) return next;
  const drafts: Draft[] = [];

  if (prev.orders !== next.orders) {
    for (const o of next.orders) {
      const before = prev.orders.find((x) => x.id === o.id);
      if (before === o) continue;
      drafts.push(...orderDrafts(prev, next, o));
    }
  }

  // Nhắc thanh toán ở phút PAR-20.
  for (const tx of next.transactions) {
    const before = prev.transactions.find((t) => t.id === tx.id);
    if (tx.remindedAt && !before?.remindedAt && tx.status === 'pending') {
      drafts.push({
        userIds: usersOfCustomer(next, tx.customerId),
        title: 'Nhắc thanh toán',
        body: `Giao dịch ${formatMoney(tx.amount)} hết hạn lúc ${new Date(tx.expiresAt).toLocaleTimeString('vi-VN')}. Quá hạn các đơn online sẽ tự huỷ.`,
        link: { type: 'order', id: tx.orderIds[0] },
      });
    }
  }

  // Ticket.
  if (prev.tickets !== next.tickets) {
    for (const t of next.tickets) {
      const before = prev.tickets.find((x) => x.id === t.id);
      const link: NotificationLink = { type: 'ticket', id: t.id };
      if (!before) {
        const high = t.priority === 'high' ? ' (ưu tiên Cao)' : '';
        drafts.push({ userIds: [...usersOfCoop(next, t.coopId), ...adminsOf(next, 'cskh')], title: `Khiếu nại mới ${t.id}${high}`, body: `Đơn ${t.orderId}`, link });
        continue;
      }
      if (before.history.length === t.history.length) continue;
      const last = t.history[t.history.length - 1];
      if (before.status !== t.status) {
        drafts.push({ userIds: [...usersOfCustomer(next, t.customerId), ...usersOfCoop(next, t.coopId)], title: `Khiếu nại ${t.id}: ${TICKET_STATUS_LABEL[t.status]}`, body: last.note ?? '', link });
      } else if (last.actor.kind === 'coop') {
        drafts.push({ userIds: [...usersOfCustomer(next, t.customerId), ...adminsOf(next, 'cskh')], title: `HTX phản hồi khiếu nại ${t.id}`, body: last.note ?? '', link });
      }
    }
  }

  // Kết quả duyệt sản phẩm / giá.
  if (prev.productChanges !== next.productChanges) {
    for (const c of next.productChanges) {
      const before = prev.productChanges.find((x) => x.id === c.id);
      const name = next.products.find((p) => p.id === c.productId)?.name ?? c.productId;
      const what = c.type === 'price' ? 'đổi giá' : 'báo thu hoạch';
      const link: NotificationLink = { type: 'product', id: c.productId };
      if (!before) {
        drafts.push({ userIds: adminsOf(next, 'quality'), title: `Yêu cầu ${what} chờ duyệt`, body: name, link });
      } else if (before.status === 'pending' && c.status !== 'pending') {
        drafts.push({
          userIds: usersOfCoop(next, c.coopId),
          title: `Yêu cầu ${what} ${c.status === 'approved' ? 'đã được duyệt' : 'bị từ chối'}`,
          body: c.status === 'approved' ? name : `${name}: ${c.rejectReason}`,
          link,
        });
      }
    }
  }

  // Yêu cầu hoàn mới → Admin – Tài chính.
  if (prev.refunds !== next.refunds) {
    for (const r of next.refunds) {
      if (!prev.refunds.some((x) => x.id === r.id)) {
        drafts.push({ userIds: adminsOf(next, 'finance'), title: 'Yêu cầu hoàn tiền mới', body: `Đơn ${r.orderId} · ${formatMoney(r.amount)}`, link: { type: 'order', id: r.orderId } });
      }
    }
  }

  // Chi trả đối soát → HTX.
  if (prev.payoutPeriods !== next.payoutPeriods) {
    for (const p of next.payoutPeriods) {
      const before = prev.payoutPeriods.find((x) => x.id === p.id);
      if (p.status === 'paid' && before?.status !== 'paid') {
        drafts.push({ userIds: usersOfCoop(next, p.coopId), title: 'Đã ghi nhận chi trả kỳ đối soát (mô phỏng)', body: `${formatMoney(p.payout)} cho ${p.lines.length} đơn.` });
      }
    }
  }

  // Tồn thấp: tối đa 1 lần/ngày cho mỗi sản phẩm (mục 5.6).
  let lowStockAlerts = next.lowStockAlerts;
  if (prev.orders !== next.orders || prev.products !== next.products) {
    const today = toDateKey(at);
    for (const p of next.products) {
      if (p.kind !== 'ready' || p.status !== 'active') continue;
      const available = remainingFor(next, p);
      const threshold = p.lowStockThreshold ?? next.params.lowStockThreshold;
      if (available <= threshold && lowStockAlerts[p.id] !== today) {
        lowStockAlerts = { ...lowStockAlerts, [p.id]: today };
        drafts.push({ userIds: usersOfCoop(next, p.coopId), title: `Tồn thấp: ${p.name}`, body: `Còn ${available} ${p.unit} khả dụng (ngưỡng ${threshold}).`, link: { type: 'product', id: p.id } });
      }
    }
  }

  const created: AppNotification[] = drafts.flatMap((d) =>
    [...new Set(d.userIds)].map((userId) => ({ id: generateId('TB'), userId, at: iso(at), title: d.title, body: d.body, link: d.link, read: false })),
  );
  if (created.length === 0 && lowStockAlerts === next.lowStockAlerts) return next;
  return { ...next, notifications: [...created, ...next.notifications], lowStockAlerts };
}

export function notificationsOf(state: DemoState, userId: string): AppNotification[] {
  return state.notifications.filter((n) => n.userId === userId);
}

export function markNotificationsRead(state: DemoState, userId: string, ids?: string[]): DemoState {
  return {
    ...state,
    notifications: state.notifications.map((n) => (n.userId === userId && !n.read && (!ids || ids.includes(n.id)) ? { ...n, read: true } : n)),
  };
}
