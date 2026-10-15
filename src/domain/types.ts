/**
 * Mô hình dữ liệu nghiệp vụ theo SRS. Mọi thay đổi dữ liệu đi qua các hàm trong src/domain.
 */
import type { Params, ParamChange } from './params';
import type { OrderPricing, PaymentMethod } from './pricing';
import type { Voucher } from './voucher';

// ==========================================
// Kết quả hàm nghiệp vụ
// ==========================================

/** Kết quả của một hàm nghiệp vụ: thành công kèm giá trị, hoặc thất bại kèm lý do hiển thị cho người dùng. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <T = never>(error: string): Result<T> => ({ ok: false, error });

// ==========================================
// Vai trò, người thực hiện
// ==========================================

export type UserRole = 'customer' | 'coop' | 'shipper' | 'regulator' | 'admin';
/** Nhóm quyền Admin (mục 8). "root" là Quản trị gốc. */
export type AdminSubGroup = 'operations' | 'quality' | 'cskh' | 'finance' | 'root';

export const ADMIN_GROUP_LABEL: Record<AdminSubGroup, string> = {
  operations: 'Vận hành',
  quality: 'Chất lượng',
  cskh: 'CSKH',
  finance: 'Tài chính',
  root: 'Quản trị gốc',
};

/** Ai thực hiện một thao tác: người dùng (theo vai trò) hoặc hệ thống. */
export type ActorKind = 'customer' | 'coop' | 'admin' | 'regulator' | 'system' | 'carrier_sim' | 'gateway_sim';

export interface Actor {
  kind: ActorKind;
  /** Khách: mã khách hàng. HTX: mã HTX. Admin, QLNN: mã tài khoản. */
  id?: string;
  /** Mã tài khoản đăng nhập (để gửi thông báo, ghi nhật ký). */
  userId?: string;
  name?: string;
  /** Nhóm quyền của Admin. */
  adminGroup?: AdminSubGroup;
}

export const SYSTEM: Actor = { kind: 'system', name: 'Hệ thống' };

// ==========================================
// Danh mục, HTX, sản phẩm
// ==========================================

/** Loại đơn: Mua sẵn hoặc Đặt trước (BR-DAT-02). */
export type OrderKind = 'ready' | 'preorder';

export const ORDER_KIND_LABEL: Record<OrderKind, string> = { ready: 'Mua sẵn', preorder: 'Đặt trước' };

/** Nhóm hàng. */
export type Category = 'dry' | 'processed' | 'fresh';

export const CATEGORY_LABEL: Record<Category, string> = {
  dry: 'Hàng khô',
  processed: 'Chế biến',
  fresh: 'Nông sản tươi',
};

/** Nhóm hạn: hàng tươi / hàng khô, dùng cho RET-01 và PAR-26. */
export type GoodsGroup = 'fresh' | 'dry';

export const goodsGroupOf = (category: Category): GoodsGroup => (category === 'fresh' ? 'fresh' : 'dry');

/** Hồ sơ HTX (FR-TK-06/07): HTX sửa và gửi duyệt; Admin – Chất lượng duyệt (FR-TK-08/09). */
export interface CoopProfile {
  name: string;
  region: string;
  representative: string;
  description: string;
}

export interface Coop {
  id: string;
  name: string;
  region: string;
  representative?: string;
  description?: string;
  /** Tài khoản nhận chi trả đối soát, luôn hiện dạng che. */
  payoutAccountMasked: string;
  /** Quyền bán (FR-TK-13): tạm khoá thì sản phẩm của HTX không đặt được. */
  status: 'active' | 'suspended';
  suspendReason?: string;
  /** Tình trạng hồ sơ. */
  profileStatus: 'approved' | 'pending' | 'rejected';
  pendingProfile?: CoopProfile;
  profileRejectReason?: string;
}

export interface PreorderConfig {
  totalSlots: number;
  /** Khoảng ngày giao HTX khai, dạng yyyy-mm-dd. */
  deliveryFrom: string;
  deliveryTo: string;
  open: boolean;
}

export interface Product {
  id: string;
  coopId: string;
  name: string;
  category: Category;
  /** Vùng sản xuất, cùng một cấp cho mọi sản phẩm (dùng cho bộ lọc vùng). */
  region: string;
  unit: string;
  price: number;
  description: string;
  /** Ảnh HTX tải lên (data URL). Không có thì hiện ảnh giữ chỗ SVG tự sinh theo tên và nhóm hàng. */
  image?: string;
  kind: OrderKind;
  /** Tồn kho (hàng mua sẵn). Tồn khả dụng = tồn kho − số đang giữ. */
  stockOnHand: number;
  /** Cờ hoả tốc đã được duyệt. */
  expressApproved: boolean;
  preorder?: PreorderConfig;
  /** Đang bán / HTX ẩn / chờ duyệt (sản phẩm mới) / bị từ chối. */
  status: 'active' | 'hidden' | 'pending' | 'rejected';
  /** Ngưỡng tồn thấp riêng; không có thì dùng PAR-02. */
  lowStockThreshold?: number;
  /** Chứng nhận HTX khai (FR-SP-08); chỉ hiện "đã xác minh" khi Admin – Chất lượng duyệt. */
  certifications?: Certification[];
  /** Có khi sản phẩm thuộc danh mục mẫu của nhóm (Giai đoạn 5, mục 9). */
  sample?: SampleInfo;
}

/**
 * Ghi chú của sản phẩm mẫu. Trang chi tiết hiện nhãn "Dữ liệu mẫu – chờ HTX xác nhận" kèm các ghi chú này.
 * Không chứa mã chứng nhận; số sao OCOP chỉ ghi ở sản phẩm có ghi chú trong bảng của nhóm.
 */
export interface SampleInfo {
  /** Khoảng giá bán lẻ Hà Nội nhóm khảo sát. Không có nghĩa là nhóm chưa có giá, giá đang dùng là "giá mẫu". */
  surveyedPrice?: string;
  /** Khoảng ngày giao là mẫu, chờ HTX xác nhận. */
  deliveryWindowIsSample?: boolean;
  /** Thông tin theo hồ sơ nhóm, chưa xác minh. */
  dossierNote?: string;
}

export interface Certification {
  id: string;
  label: string;
  issuer: string;
  /** Hạn hiệu lực, yyyy-mm-dd. */
  validUntil: string;
  photo?: string;
  verified: boolean;
}

/** Nội dung sản phẩm HTX sửa được (cần duyệt). */
export interface ProductContent {
  name: string;
  description: string;
  unit: string;
  category: Category;
  region: string;
}

export const PRODUCT_STATUS_LABEL: Record<Product['status'], string> = {
  active: 'Đang bán',
  hidden: 'HTX đang ẩn',
  pending: 'Chờ duyệt',
  rejected: 'Bị từ chối',
};

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export type ProductChangeType = 'new_product' | 'content' | 'price' | 'preorder' | 'express' | 'cert';

export const PRODUCT_CHANGE_LABEL: Record<ProductChangeType, string> = {
  new_product: 'Sản phẩm mới',
  content: 'Sửa nội dung',
  price: 'Đổi giá',
  preorder: 'Báo thu hoạch / mở đặt trước',
  express: 'Cờ giao hoả tốc',
  cert: 'Chứng nhận',
};

/** Yêu cầu thay đổi của HTX cần Admin – Chất lượng duyệt (FR-SP-04). */
export interface ProductChangeRequest {
  id: string;
  productId: string;
  coopId: string;
  type: ProductChangeType;
  newPrice?: number;
  preorder?: PreorderConfig;
  content?: ProductContent;
  express?: boolean;
  cert?: Certification;
  note?: string;
  status: ChangeRequestStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  rejectReason?: string;
}

// ==========================================
// Khách hàng, địa chỉ
// ==========================================

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  holder: string;
  /** Mã ngân hàng trong danh sách chọn (src/domain/banks.ts). */
  bankCode?: string;
  /** Thời điểm khách xác thực liên kết bằng OTP mô phỏng của ngân hàng. */
  linkedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  refundAccount?: BankAccount;
}

/** Phường/xã giao hàng (danh sách cấu hình). Không dùng quận/huyện (bỏ cấp này từ 1/7/2025). */
export interface Ward {
  id: string;
  name: string;
  /** Khoảng cách mẫu từ kho tới phường, để tính phụ phí hoả tốc. Không gọi API bản đồ. */
  distanceKm: number;
}

export type HouseType = 'apartment' | 'ground';

export interface Address {
  id: string;
  customerId: string;
  label: string;
  receiverName: string;
  receiverPhone: string;
  houseType: HouseType;
  wardId: string;
  /** Số nhà, đường. Bắt buộc với nhà mặt đất. */
  street: string;
  /** Toà (chung cư). */
  building?: string;
  /** Căn hộ (chung cư). */
  unit?: string;
  isDefault: boolean;
}

/** Địa chỉ chốt vào đơn (BR-DAT-06). */
export interface AddressSnapshot {
  receiverName: string;
  receiverPhone: string;
  text: string;
  wardName: string;
  distanceKm: number;
}

// ==========================================
// Giỏ, hộp quà, đơn
// ==========================================

export interface CartLine {
  productId: string;
  quantity: number;
  /** Ngày giao D khách chọn (đơn đặt trước), yyyy-mm-dd. */
  deliveryDate?: string;
  /** Giá lúc thêm vào giỏ, để phát hiện đổi giá (BR-DAT-03). */
  seenPrice: number;
}

export interface GiftBoxType {
  id: string;
  name: string;
  fee: number;
  description: string;
}

export interface GiftRecipient {
  name: string;
  phone: string;
  wardId: string;
  street: string;
}

export interface GiftOption {
  boxTypeId: string;
  boxName: string;
  fee: number;
  message: string;
  sendToOther: boolean;
  recipient?: GiftRecipient;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  category: Category;
}

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

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

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

export interface StatusChange {
  from: OrderStatus | null;
  to: OrderStatus;
  at: string; // ISO
  actor: Actor;
  reason?: string;
}

export interface DeliveryEvent {
  at: string;
  event: 'picked_up' | 'delivered_reported' | 'failed' | 'refused';
  reason?: string;
}

export interface Order {
  id: string;
  checkoutId: string;
  customerId: string;
  coopId: string;
  coopName: string;
  kind: OrderKind;
  /** Ngày giao D (đơn đặt trước), yyyy-mm-dd. */
  deliveryDate?: string;
  deliveryDateChanged?: boolean;
  items: OrderItem[];
  pricing: OrderPricing;
  /** Mua sẵn: cách trả cả đơn. Đặt trước: cách trả phần còn lại (cọc luôn online). */
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: StatusChange[];
  shipping: 'standard' | 'express';
  address: AddressSnapshot;
  note: string;
  gift?: GiftOption;
  voucherCode?: string;
  /** Bản chốt tham số lúc tạo đơn (BR-DAT-06). */
  params: Params;
  /** Điều kiện huỷ khách đã đồng ý (đơn đặt trước). */
  cancelPolicy?: string;
  createdAt: string;
  /** Hạn HTX xác nhận (PAR-11), tính từ lúc thanh toán thành công hoặc lúc tạo đơn COD. */
  confirmDeadline?: string;
  /** Tiền khách đã trả online cho đơn này. */
  amountPaidOnline: number;
  /** Tiền thu khi nhận hàng (COD) đã thu. */
  codCollected: number;
  /** HTX báo sẵn sàng giao (đơn đặt trước). */
  readyReportedAt?: string;
  /** Hạn trả phần còn lại (PAR-24). */
  remainingDueAt?: string;
  remainingMethodChanged?: boolean;
  deliveryAttempts: number;
  deliveryLog: DeliveryEvent[];
  /** ĐVVC mô phỏng báo giao thành công; khách chưa bấm Đã nhận. */
  carrierDeliveredAt?: string;
  deliveredAt?: string;
  cancelRequest?: { reason: string; at: string; status: ChangeRequestStatus; rejectReason?: string };
  cancelReason?: string;
}

export interface Checkout {
  id: string;
  idempotencyKey: string;
  customerId: string;
  orderIds: string[];
  transactionId?: string;
  voucherId?: string;
  createdAt: string;
}

export type TransactionStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  expired: 'Hết hạn',
  cancelled: 'Đã huỷ',
};

/** Giao dịch thanh toán online (mô phỏng). Một lần đặt gộp mọi đơn online và tiền cọc vào một giao dịch. */
export interface Transaction {
  id: string;
  kind: 'checkout' | 'remaining';
  checkoutId?: string;
  customerId: string;
  orderIds: string[];
  /** Số tiền từng đơn trong giao dịch. */
  amounts: Record<string, number>;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  expiresAt: string;
  /** Các gatewayRef đã xử lý, để gọi lặp không xử lý lần hai. */
  processedRefs: string[];
  paidRef?: string;
  remindedAt?: string;
}

export interface VoucherUsage {
  id: string;
  voucherId: string;
  checkoutId: string;
  customerId: string;
  orderIds: string[];
  status: 'held' | 'used' | 'released';
}

export type RefundStatus = 'refund_pending' | 'refunding' | 'refunded';

export type RefundSource = 'cancel' | 'late_payment' | 'duplicate_payment' | 'return';

export const REFUND_SOURCE_LABEL: Record<RefundSource, string> = {
  cancel: 'Huỷ đơn',
  late_payment: 'Tiền về sau khi đơn đã huỷ',
  duplicate_payment: 'Thanh toán trùng',
  return: 'Trả hàng',
};

export interface RefundRecord {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  status: RefundStatus;
  source: RefundSource;
  reason: string;
  /** Đơn online hoàn về nguồn ban đầu; đơn COD chuyển khoản vào tài khoản khách đã khai. */
  destination: 'original_source' | 'bank_account';
  createdAt: string;
  bankRef?: string;
  completedAt?: string;
}

// ==========================================
// Khiếu nại, đối soát, nhật ký
// ==========================================

export type ComplaintReason = 'damaged' | 'wrong_item' | 'expired' | 'foreign_object' | 'qr_abnormal' | 'health' | 'changed_mind';

export const COMPLAINT_REASON_LABEL: Record<ComplaintReason, string> = {
  damaged: 'Hàng hư hỏng, dập nát',
  wrong_item: 'Sai hoặc thiếu hàng',
  expired: 'Hàng quá hạn',
  foreign_object: 'Có dị vật',
  qr_abnormal: 'QR / tem bất thường',
  health: 'Ảnh hưởng sức khoẻ',
  changed_mind: 'Đổi ý (không phải căn cứ hoàn tiền mặc định)',
};

/** Lý do tự gắn ưu tiên Cao (mục 5.8). */
export const HIGH_PRIORITY_REASONS: ComplaintReason[] = ['expired', 'foreign_object', 'qr_abnormal', 'health'];

export type TicketStatus = 'open' | 'processing' | 'resolved' | 'rejected' | 'closed';

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Mới tiếp nhận',
  processing: 'Đang xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Từ chối',
  closed: 'Đóng',
};

export interface TicketEvent {
  at: string;
  actor: Actor;
  action: string;
  note?: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  coopId: string;
  customerId: string;
  productIds: string[];
  reason: ComplaintReason;
  description: string;
  /** Ảnh thu nhỏ lưu trên trình duyệt (data URL). */
  photos: string[];
  requestRefund: boolean;
  /** HTX chỉ xác nhận và đề xuất; Admin – CSKH quyết định (mục 5.7). */
  coopProposal?: 'refund' | 'no_refund';
  priority: 'normal' | 'high';
  status: TicketStatus;
  createdAt: string;
  ackDueAt: string;
  resolveDueAt: string;
  history: TicketEvent[];
}

export interface SettlementLine {
  orderId: string;
  deliveredAt: string;
  goods: number;
  refunded: number;
  retained: number;
  commission: number;
  payout: number;
}

export interface PayoutPeriod {
  id: string;
  coopId: string;
  /** Đầu kỳ (thứ Hai 00:00) và giờ cắt kỳ (thứ Hai tuần sau 00:00), ISO. */
  start: string;
  end: string;
  status: 'closed' | 'paid';
  lines: SettlementLine[];
  retained: number;
  commission: number;
  payout: number;
  closedAt: string;
  closedBy: string;
  paidAt?: string;
  paidRef?: string;
}

export interface AuditLog {
  id: string;
  at: string;
  actor: Actor;
  action: string;
  target: string;
  detail?: string;
}

// ==========================================
// Tài khoản, thông báo, sổ giao dịch, đánh giá
// ==========================================

export type AccountRole = 'customer' | 'coop' | 'admin' | 'regulator';

export const ACCOUNT_ROLE_LABEL: Record<AccountRole, string> = {
  customer: 'Khách hàng',
  coop: 'HTX',
  admin: 'Admin',
  regulator: 'Cơ quan QLNN',
};

export interface UserAccount {
  id: string;
  phone: string;
  name: string;
  role: AccountRole;
  customerId?: string;
  coopId?: string;
  adminGroup?: AdminSubGroup;
  status: 'active' | 'locked';
  createdAt: string;
}

export type NotificationLink = { type: 'order'; id: string } | { type: 'ticket'; id: string } | { type: 'product'; id: string };

/** Thông báo cho từng tài khoản (FR-CSKH-10). */
export interface AppNotification {
  id: string;
  userId: string;
  at: string;
  title: string;
  body: string;
  link?: NotificationLink;
  read: boolean;
}

export type LedgerType = 'payment_in' | 'cod_in' | 'refund_out' | 'payout_out' | 'commission';

export const LEDGER_TYPE_LABEL: Record<LedgerType, string> = {
  payment_in: 'Tiền vào qua cổng (mô phỏng)',
  cod_in: 'Thu khi giao (COD)',
  refund_out: 'Hoàn tiền cho khách',
  payout_out: 'Chi trả cho HTX (mô phỏng)',
  commission: 'Hoa hồng sàn',
};

/** Sổ giao dịch: chỉ thêm, không sửa, không xoá. */
export interface LedgerEntry {
  id: string;
  at: string;
  type: LedgerType;
  amount: number;
  orderId?: string;
  coopId?: string;
  /** Mã tham chiếu: giao dịch, yêu cầu hoàn, kỳ đối soát. */
  refId?: string;
  note?: string;
}

/** Đánh giá sản phẩm (chức năng làm ở Giai đoạn 4). */
export interface Review {
  id: string;
  orderId: string;
  productId: string;
  customerId: string;
  stars: number;
  comment: string;
  photos: string[];
  status: 'visible' | 'hidden';
  hiddenReason?: string;
  coopReply?: string;
  createdAt: string;
}

// ==========================================
// Toàn bộ dữ liệu demo
// ==========================================

export interface DemoState {
  /** Độ lệch đồng hồ demo (tua thời gian), ms. */
  clockOffsetMs: number;
  users: UserAccount[];
  customers: Customer[];
  coops: Coop[];
  products: Product[];
  productChanges: ProductChangeRequest[];
  wards: Ward[];
  addresses: Address[];
  /** Giỏ theo khách hàng. */
  carts: Record<string, CartLine[]>;
  checkouts: Checkout[];
  orders: Order[];
  transactions: Transaction[];
  vouchers: Voucher[];
  voucherUsages: VoucherUsage[];
  giftBoxTypes: GiftBoxType[];
  refunds: RefundRecord[];
  tickets: Ticket[];
  payoutPeriods: PayoutPeriod[];
  params: Params;
  paramHistory: ParamChange[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  ledgerEntries: LedgerEntry[];
  reviews: Review[];
  /** Ngày (yyyy-mm-dd) đã gửi cảnh báo tồn thấp cho từng sản phẩm, để tối đa 1 lần/ngày. */
  lowStockAlerts: Record<string, string>;
}
