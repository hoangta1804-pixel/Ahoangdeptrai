/**
 * Khiếu nại (ticket) và yêu cầu trả hàng (mục 5.7, 5.8).
 *
 * - Chỉ gửi được trong hạn RET-01 tính từ lúc Đã giao; bắt buộc chọn đơn, sản phẩm, lý do và có ít nhất 1 ảnh.
 * - "Đổi ý" không phải căn cứ hoàn tiền mặc định.
 * - Ticket về hàng quá hạn, dị vật, QR bất thường, ảnh hưởng sức khoẻ tự gắn ưu tiên Cao.
 * - HTX chỉ xem và phản hồi ticket của HTX mình; không đóng, không từ chối hoàn tiền, không sửa nội dung.
 * - Chỉ Admin – CSKH đổi sang Đã xử lý / Từ chối / Đóng. Mọi thay đổi lưu lịch sử.
 */
import { generateId } from './ids';
import { addRefund } from './orders';
import { refundableAmount } from './refund';
import { transitionOrder } from './orderStateMachine';
import { addMs, audit, findOrder, HOUR_MS, iso, replaceOrder } from './state';
import {
  fail,
  goodsGroupOf,
  HIGH_PRIORITY_REASONS,
  ok,
  type Actor,
  type ComplaintReason,
  type DemoState,
  type Order,
  type Result,
  type Ticket,
  type TicketStatus,
} from './types';

export interface ComplaintInput {
  orderId: string;
  productIds: string[];
  reason: ComplaintReason | '';
  description: string;
  photos: string[];
  requestRefund: boolean;
}

/** Hạn gửi yêu cầu trả hàng: hàng tươi theo RET-01 tươi, còn lại theo RET-01 khô. */
export function returnDeadline(order: Order, productIds?: string[]): Date | null {
  if (!order.deliveredAt) return null;
  const items = productIds?.length ? order.items.filter((i) => productIds.includes(i.productId)) : order.items;
  const fresh = items.some((i) => goodsGroupOf(i.category) === 'fresh');
  const hours = fresh ? order.params.returnWindowHoursFresh : order.params.returnWindowHoursDry;
  return addMs(new Date(order.deliveredAt), hours * HOUR_MS);
}

export function submitComplaint(state: DemoState, actor: Actor, input: ComplaintInput, at: Date): Result<{ state: DemoState; ticket: Ticket }> {
  if (!input.orderId) return fail('Vui lòng chọn đơn hàng.');
  const order = findOrder(state, input.orderId);
  if (!order) return fail('Không tìm thấy đơn.');
  if (actor.kind !== 'customer' || actor.id !== order.customerId) return fail('Bạn chỉ gửi khiếu nại cho đơn của mình.');
  if (order.status !== 'delivered') return fail('Chỉ gửi khiếu nại, trả hàng cho đơn Đã giao.');
  if (input.productIds.length === 0) return fail('Vui lòng chọn sản phẩm cần khiếu nại.');
  if (!input.productIds.every((id) => order.items.some((i) => i.productId === id))) return fail('Sản phẩm không thuộc đơn đã chọn.');
  if (!input.reason) return fail('Vui lòng chọn lý do.');
  if (input.photos.length === 0) return fail('Vui lòng thêm ít nhất 1 ảnh.');
  const deadline = returnDeadline(order, input.productIds);
  if (!deadline || at.getTime() > deadline.getTime()) {
    return fail(`Đã quá hạn gửi khiếu nại, trả hàng (hạn đến ${deadline?.toLocaleString('vi-VN') ?? '—'}).`);
  }
  if (input.requestRefund && input.reason === 'changed_mind') {
    return fail('Đổi ý không phải căn cứ hoàn tiền mặc định. Bạn vẫn gửi được khiếu nại để CSKH xem xét, nhưng không chọn yêu cầu hoàn tiền.');
  }
  if (state.tickets.some((t) => t.orderId === order.id && ['open', 'processing'].includes(t.status))) {
    return fail('Đơn này đã có khiếu nại đang xử lý.');
  }

  const ticket: Ticket = {
    id: generateId('TK'),
    orderId: order.id,
    coopId: order.coopId,
    customerId: order.customerId,
    productIds: input.productIds,
    reason: input.reason,
    description: input.description.trim(),
    photos: input.photos,
    requestRefund: input.requestRefund,
    priority: HIGH_PRIORITY_REASONS.includes(input.reason) ? 'high' : 'normal',
    status: 'open',
    createdAt: iso(at),
    ackDueAt: iso(addMs(at, state.params.ticketAckHours * HOUR_MS)),
    resolveDueAt: iso(addMs(at, state.params.ticketResolveHours * HOUR_MS)),
    history: [{ at: iso(at), actor, action: 'Khách gửi khiếu nại' }],
  };
  let next: DemoState = { ...state, tickets: [ticket, ...state.tickets] };
  if (input.requestRefund) {
    const r = transitionOrder(order, { to: 'return_refund', actor, at, reason: 'Khách gửi yêu cầu trả hàng – hoàn tiền' });
    if (!r.ok) return r;
    next = replaceOrder(next, r.value);
  }
  return ok({ state: next, ticket });
}

/** HTX phản hồi ticket của HTX mình (FR-CSKH-05); với yêu cầu trả hàng, HTX chỉ xác nhận và đề xuất (FR-DH-10). */
export function coopReplyTicket(state: DemoState, ticketId: string, actor: Actor, text: string, at: Date, proposal?: 'refund' | 'no_refund'): Result<DemoState> {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) return fail('Không tìm thấy ticket.');
  if (actor.kind !== 'coop' || actor.id !== ticket.coopId) return fail('HTX chỉ phản hồi ticket của HTX mình.');
  if (!text.trim()) return fail('Vui lòng nhập nội dung phản hồi.');
  if (['resolved', 'rejected', 'closed'].includes(ticket.status)) return fail('Ticket đã kết thúc.');
  if (proposal && !ticket.requestRefund) return fail('Ticket không có yêu cầu hoàn tiền để đề xuất.');
  const action = proposal ? `HTX phản hồi, đề xuất ${proposal === 'refund' ? 'hoàn tiền' : 'không hoàn tiền'}` : 'HTX phản hồi';
  const updated: Ticket = { ...ticket, coopProposal: proposal ?? ticket.coopProposal, history: [...ticket.history, { at: iso(at), actor, action, note: text.trim() }] };
  const next = { ...state, tickets: state.tickets.map((t) => (t.id === ticketId ? updated : t)) };
  return ok(audit(next, actor, 'Phản hồi ticket', ticketId, at, text.trim()));
}

/** Số tiền hoàn cho các sản phẩm được duyệt: phần khách đã thực trả, đã trừ phần giảm giá chia cho phần đó. */
export function returnRefundAmount(order: Order, productIds: string[]): number {
  const itemsTotal = order.pricing.itemsTotal || 1;
  const selected = order.items.filter((i) => productIds.includes(i.productId)).reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const approvedValue = Math.round(selected * (1 - order.pricing.discount / itemsTotal));
  return refundableAmount(order.amountPaidOnline + order.codCollected, approvedValue, order.pricing.total);
}

/** Admin – CSKH đổi trạng thái ticket (FR-CSKH-07..09). Kết luận Đã xử lý kèm duyệt hoàn thì tạo yêu cầu hoàn. */
export function cskhUpdateTicket(
  state: DemoState,
  ticketId: string,
  actor: Actor,
  status: TicketStatus,
  note: string,
  at: Date,
  refundApproved = false,
): Result<DemoState> {
  if (actor.kind !== 'admin' || actor.adminGroup !== 'cskh') return fail('Chỉ Admin – CSKH được đổi trạng thái ticket.');
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) return fail('Không tìm thấy ticket.');
  if (ticket.status === 'closed') return fail('Ticket đã đóng.');
  if ((status === 'rejected' || status === 'resolved') && !note.trim()) return fail('Vui lòng ghi kết luận.');
  const updated: Ticket = {
    ...ticket,
    status,
    history: [...ticket.history, { at: iso(at), actor, action: `Đổi trạng thái: ${status}`, note: note.trim() || undefined }],
  };
  let next: DemoState = { ...state, tickets: state.tickets.map((t) => (t.id === ticketId ? updated : t)) };
  const order = findOrder(next, ticket.orderId);
  if (status === 'resolved' && refundApproved && ticket.requestRefund && order) {
    if (next.refunds.some((r) => r.orderId === order.id && r.source === 'return')) return fail('Đơn đã có yêu cầu hoàn do trả hàng.');
    const amount = returnRefundAmount(order, ticket.productIds);
    next = addRefund(next, order, amount, 'return', `Trả hàng: ${note.trim()}`, at);
    next = replaceOrder(next, { ...order, paymentStatus: amount > 0 ? 'refund_pending' : order.paymentStatus });
  }
  return ok(audit(next, actor, 'Cập nhật ticket', ticketId, at, `${status}${note ? `: ${note}` : ''}`));
}

export const isTicketOpen = (t: Ticket): boolean => t.status === 'open' || t.status === 'processing';
