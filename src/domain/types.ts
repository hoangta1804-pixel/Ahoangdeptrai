/**
 * Kiểu dữ liệu dùng chung của app.
 *
 * Phần "UI hiện tại" là các kiểu chuyển nguyên từ src/App.tsx cũ để màn hình vẫn chạy
 * trong Giai đoạn 1. Phần "Mô hình nghiệp vụ" là mô hình mới theo SRS mà các hàm thuần
 * trong src/domain dùng; Giai đoạn 2–3 sẽ chuyển dần màn hình sang mô hình này.
 */

// ==========================================
// UI hiện tại (chuyển từ src/App.tsx)
// ==========================================

export type UserRole = 'customer' | 'coop' | 'shipper' | 'regulator' | 'admin';
export type AdminSubGroup = 'operations' | 'quality' | 'finance' | 'cskh';

export interface Product {
  id: string;
  name: string;
  coopId: string;
  coopName: string;
  price: number;
  unit: string;
  image: string;
  fallbackGradient: string;
  isPreorder: boolean;
  /** Tổng số suất đặt trước HTX mở bán. Số đã giữ tính từ đơn (stock.ts), không lưu cứng. */
  preorderStock?: number;
  deliveryDate?: string;
  depositPercent: number;
  certType: 'OCOP 5 Sao' | 'OCOP 4 Sao' | 'VietGAP' | 'Hữu Cơ';
  certNumber: string;
  originDistrict: 'Bắc Hà' | 'Mường Khương' | 'Sa Pa' | 'Bát Xát';
  description: string;
  rating: number;
  reviewCount: number;
  status: 'active' | 'pending';
}

export interface Address {
  id: string;
  title: string;
  receiverName: string;
  receiverPhone: string;
  houseType: 'apartment' | 'ground';
  buildingName?: string;
  buildingBlock?: string;
  apartmentNumber?: string;
  streetDetails?: string;
  district: string;
  ward: string;
  city: string;
  isDefault: boolean;
  lat: number;
  lng: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  items: { product: Product; quantity: number; unitPrice: number }[];
  totalItemAmount: number;
  shippingFee: number;
  voucherDiscount: number;
  totalAmount: number;
  depositPaid: number;
  remainingCod: number;
  shippingMethod: 'standard' | 'express';
  frozenAddressSnapshot: string;
  houseType: 'apartment' | 'ground';
  district: string;
  status: 'pending_deposit' | 'confirmed' | 'harvesting' | 'delivering' | 'completed' | 'delayed' | 'cancelled';
  expectedDelivery: string;
  isPreorder: boolean;
  assignedShipper?: string;
  isRefunded?: boolean;
}

export interface Ticket {
  id: string;
  orderId: string;
  coopName: string;
  customerName: string;
  customerPhone: string;
  issueType: 'damaged_fruit' | 'wrong_weight' | 'packaging_torn' | 'late_delivery';
  description: string;
  imageUrl?: string;
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved';
  coopExplanation?: string;
  refundDecision?: {
    approved: boolean;
    refundAmount: number;
    bearer: 'HTX' | 'ĐVVC' | 'Hệ thống';
  };
}

export interface LedgerEntry {
  id: string;
  type: 'goods_sale' | 'commission' | 'shipping_fee' | 'refund' | 'gateway_fee';
  amount: number;
  orderId: string;
  coopName: string;
  date: string;
  status: 'matched' | 'mismatched' | 'adjusted';
  bearer?: 'HTX' | 'ĐVVC' | 'Hệ thống';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  target: string;
  oldValue: string;
  newValue: string;
}

export interface RefundBank {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

// ==========================================
// Mô hình nghiệp vụ (SRS)
// ==========================================

/** Loại đơn: Mua sẵn hoặc Đặt trước (BR-DAT-02). */
export type OrderKind = 'ready' | 'preorder';

/** Nhóm hàng, dùng cho hạn trả hàng RET-01 và tự chuyển Đã giao PAR-26. */
export type GoodsGroup = 'fresh' | 'dry';

/** 11 trạng thái đơn (mục 5.5). */
export type OrderStatus =
  | 'awaiting_payment'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'awaiting_harvest'
  | 'preparing'
  | 'shipping'
  | 'delivered'
  | 'return_refund'
  | 'returning'
  | 'returned'
  | 'cancelled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Chờ thanh toán',
  awaiting_confirmation: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  awaiting_harvest: 'Chờ thu hoạch',
  preparing: 'Đang chuẩn bị',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  return_refund: 'Trả hàng – hoàn tiền',
  returning: 'Đang chuyển hoàn',
  returned: 'Đã hoàn về',
  cancelled: 'Đã huỷ',
};

/** Tình trạng thanh toán, cột riêng song song với trạng thái đơn (mục 5.5). */
export type PaymentStatus =
  | 'cod_unpaid'
  | 'awaiting_payment'
  | 'paid'
  | 'deposit_paid'
  | 'refund_pending'
  | 'refunding'
  | 'refunded';

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  cod_unpaid: 'Chưa thanh toán (COD)',
  awaiting_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  deposit_paid: 'Đã cọc – còn lại',
  refund_pending: 'Chờ hoàn tiền',
  refunding: 'Đang hoàn tiền',
  refunded: 'Đã hoàn tiền',
};

/** Ai thực hiện một thao tác: người dùng (theo vai trò) hoặc hệ thống. */
export type ActorKind = 'customer' | 'coop' | 'admin' | 'system' | 'carrier_sim';

export interface Actor {
  kind: ActorKind;
  id?: string;
  name?: string;
}

export interface StatusChange {
  from: OrderStatus | null;
  to: OrderStatus;
  at: string; // ISO
  actor: Actor;
  reason?: string;
}

/** Kết quả của một hàm nghiệp vụ: thành công kèm giá trị, hoặc thất bại kèm lý do hiển thị cho người dùng. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <T = never>(error: string): Result<T> => ({ ok: false, error });
