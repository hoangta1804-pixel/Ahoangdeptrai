/**
 * Sản phẩm phía HTX (mục 5.6, FR-SP-04, FR-SP-07, FR-SP-09).
 * - HTX sửa tồn kho có hiệu lực ngay, nhưng không nhỏ hơn số đang giữ.
 * - HTX đổi giá hoặc báo thu hoạch / mở đặt trước phải chờ Admin – Chất lượng duyệt; trong lúc chờ vẫn bán giá cũ.
 * - Admin từ chối phải ghi lý do.
 */
import { generateId } from './ids';
import { audit, findProduct, iso } from './state';
import { heldQuantity, validateStockUpdate } from './stock';
import { fail, ok, type Actor, type DemoState, type PreorderConfig, type ProductChangeRequest, type Result } from './types';

function ownProduct(state: DemoState, productId: string, actor: Actor) {
  const product = findProduct(state, productId);
  if (!product) return { error: 'Không tìm thấy sản phẩm.' } as const;
  if (actor.kind !== 'coop' || actor.id !== product.coopId) return { error: 'HTX chỉ sửa sản phẩm của HTX mình.' } as const;
  return { product } as const;
}

export function coopUpdateStock(state: DemoState, productId: string, actor: Actor, newStock: number, at: Date): Result<DemoState> {
  const own = ownProduct(state, productId, actor);
  if ('error' in own) return fail(own.error!);
  const product = own.product;
  if (product.kind !== 'ready') return fail('Sản phẩm đặt trước quản lý theo suất, không theo tồn kho.');
  const valid = validateStockUpdate(newStock, heldQuantity(product.id, state.orders));
  if (!valid.ok) return valid;
  const next = { ...state, products: state.products.map((p) => (p.id === productId ? { ...p, stockOnHand: newStock } : p)) };
  return ok(audit(next, actor, 'Cập nhật tồn kho', product.name, at, `${product.stockOnHand} → ${newStock}`));
}

function hasPending(state: DemoState, productId: string, type: ProductChangeRequest['type']): boolean {
  return state.productChanges.some((c) => c.productId === productId && c.type === type && c.status === 'pending');
}

export function coopRequestPriceChange(state: DemoState, productId: string, actor: Actor, newPrice: number, note: string, at: Date): Result<DemoState> {
  const own = ownProduct(state, productId, actor);
  if ('error' in own) return fail(own.error!);
  if (!Number.isInteger(newPrice) || newPrice <= 0) return fail('Giá mới phải là số nguyên dương (đồng).');
  if (newPrice === own.product.price) return fail('Giá mới trùng giá hiện tại.');
  if (hasPending(state, productId, 'price')) return fail('Sản phẩm đã có yêu cầu đổi giá đang chờ duyệt.');
  const req: ProductChangeRequest = {
    id: generateId('CR'),
    productId,
    coopId: own.product.coopId,
    type: 'price',
    newPrice,
    note: note.trim() || undefined,
    status: 'pending',
    createdAt: iso(at),
  };
  return ok(audit({ ...state, productChanges: [req, ...state.productChanges] }, actor, 'Gửi duyệt đổi giá', own.product.name, at, `${own.product.price} → ${newPrice}`));
}

export function validatePreorderConfig(cfg: PreorderConfig): string | null {
  if (!Number.isInteger(cfg.totalSlots) || cfg.totalSlots <= 0) return 'Số suất phải là số nguyên dương.';
  if (!cfg.deliveryFrom || !cfg.deliveryTo) return 'Vui lòng nhập khoảng ngày giao.';
  if (cfg.deliveryFrom > cfg.deliveryTo) return 'Ngày giao từ phải trước ngày giao đến.';
  return null;
}

/** HTX báo thu hoạch / mở đợt đặt trước: sang Chờ duyệt (L12). */
export function coopRequestPreorder(state: DemoState, productId: string, actor: Actor, cfg: PreorderConfig, note: string, at: Date): Result<DemoState> {
  const own = ownProduct(state, productId, actor);
  if ('error' in own) return fail(own.error!);
  if (own.product.kind !== 'preorder') return fail('Chỉ sản phẩm đặt trước mới báo thu hoạch.');
  const err = validatePreorderConfig(cfg);
  if (err) return fail(err);
  if (hasPending(state, productId, 'preorder')) return fail('Sản phẩm đã có báo thu hoạch đang chờ duyệt.');
  const req: ProductChangeRequest = {
    id: generateId('CR'),
    productId,
    coopId: own.product.coopId,
    type: 'preorder',
    preorder: { ...cfg, open: true },
    note: note.trim() || undefined,
    status: 'pending',
    createdAt: iso(at),
  };
  return ok(audit({ ...state, productChanges: [req, ...state.productChanges] }, actor, 'Gửi duyệt báo thu hoạch', own.product.name, at, `${cfg.totalSlots} suất, giao ${cfg.deliveryFrom} → ${cfg.deliveryTo}`));
}

/** Admin – Chất lượng duyệt hoặc từ chối (bắt buộc lý do) yêu cầu của HTX (FR-SP-04). */
export function decideProductChange(state: DemoState, requestId: string, actor: Actor, approve: boolean, reason: string, at: Date): Result<DemoState> {
  if (actor.kind !== 'admin' || actor.adminGroup !== 'quality') return fail('Chỉ Admin – Chất lượng được duyệt thay đổi sản phẩm.');
  const req = state.productChanges.find((c) => c.id === requestId);
  if (!req) return fail('Không tìm thấy yêu cầu.');
  if (req.status !== 'pending') return fail('Yêu cầu đã được xử lý.');
  if (!approve && !reason.trim()) return fail('Từ chối phải ghi lý do.');
  const decided: ProductChangeRequest = {
    ...req,
    status: approve ? 'approved' : 'rejected',
    decidedAt: iso(at),
    decidedBy: actor.name,
    rejectReason: approve ? undefined : reason.trim(),
  };
  let next: DemoState = { ...state, productChanges: state.productChanges.map((c) => (c.id === requestId ? decided : c)) };
  if (approve) {
    next = {
      ...next,
      products: next.products.map((p) => {
        if (p.id !== req.productId) return p;
        if (req.type === 'price' && req.newPrice) return { ...p, price: req.newPrice };
        if (req.type === 'preorder' && req.preorder) return { ...p, preorder: req.preorder };
        return p;
      }),
    };
  }
  const product = findProduct(state, req.productId);
  return ok(audit(next, actor, approve ? 'Duyệt thay đổi sản phẩm' : 'Từ chối thay đổi sản phẩm', product?.name ?? req.productId, at, approve ? undefined : reason));
}
