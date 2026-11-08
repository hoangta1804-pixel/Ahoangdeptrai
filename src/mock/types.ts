export type SupplierType = 'enterprise' | 'household';

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  region: string;
  address: string;
  verified: boolean;
}

export type ProductStatus = 'active' | 'hidden' | 'discontinued';
export type VariantStatus = 'in_stock' | 'preorder' | 'out_of_stock';

export interface Variant {
  id: string;
  productId: string;
  label: string; // e.g., "Hũ sứ 500g"
  price: number;
  originalPrice?: number;
  stock: number; // Tồn có thể bán (kho Hà Nội)
  status: VariantStatus;
  preorderSlots?: number; // Số suất đặt trước còn nhận
  expectedDeliveryDate?: string; // e.g., "25/06/2026"
  depositPercent: number; // Mặc định 30%
  sortOrder: number;
  imageUrl?: string;
  weightGrams?: number;
}

export type MediaType = 'photo' | 'video' | 'spin360' | 'model3d';
export type MediaGroup = 'main' | 'spec' | 'in_use' | 'origin';
export type MediaSource = 'self_shot' | 'supplier' | 'outsource';
export type MediaApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface MediaItem {
  id: string;
  productId: string;
  variantId?: string; // Trống nếu là ảnh chung
  type: MediaType;
  group: MediaGroup;
  url: string;
  posterUrl?: string;
  alt: string;
  sortOrder: number;
  source: MediaSource;
  consentDocUrl?: string; // Bắt buộc nếu source là supplier hoặc có người làm
  hasConsentDoc: boolean;
  approvalStatus: MediaApprovalStatus;
  rejectReason?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
}

export type ThemeId = 'in_season' | 'best_seller' | 'gift';

export interface ProductThemeMapping {
  themeId: ThemeId;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  region: string;
  supplierId: string;
  category: 'dry' | 'fresh' | 'processed' | 'tea' | 'gift';
  shortDescription: string;
  story?: {
    origin: string;
    culture: string;
    people: string;
  };
  certifications?: string[];
  usageInstructions?: string;
  preservation?: string;
  variants: Variant[];
  media: MediaItem[];
  themeMappings: ProductThemeMapping[];
  status: ProductStatus;
  defaultVariantId?: string;
  traceabilityCode?: string;
}

export interface CartLine {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  addedAt: number;
  updatedAt: number;
}

export interface TempCart {
  deviceId: string;
  lines: CartLine[];
  updatedAt: number;
  expiresAt: number;
}

export interface Address {
  id: string;
  recipientName: string;
  phone: string;
  city: 'Hà Nội';
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  /** Vai trò trên máy chủ: customer | admin | coop | regulator | shipper */
  role?: string;
  addresses: Address[];
  defaultPaymentMethod?: 'cod' | 'online_qr' | 'online_card';
  favoriteProductIds: string[];
}

export interface Voucher {
  code: string;
  discountType: 'percent' | 'fixed';
  value: number; // % (e.g. 10) hoặc số tiền (e.g. 50000)
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  total: number;
  imageUrl?: string;
  kind: 'normal' | 'preorder';
  expectedDeliveryDate?: string;
}

export interface SplitChildOrder {
  id: string;
  orderCode: string;
  supplierId: string;
  supplierName: string;
  kind: 'normal' | 'preorder';
  expectedDeliveryDate: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  giftBoxFee: number;
  depositAmount: number; // 30% nếu preorder, 0 nếu normal
  payNowAmount: number;
  payOnDeliveryAmount: number;
  paymentMethod: 'cod' | 'online';
  status: 'pending_payment' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
}

export interface OrderGroup {
  id: string;
  orderGroupCode: string;
  userId?: string;
  customerName: string;
  phone: string;
  address: Address;
  note?: string;
  giftInfo?: {
    isGift: boolean;
    recipientName?: string;
    cardMessage?: string;
    hasGiftBox: boolean;
    giftBoxFee: number;
  };
  orders: SplitChildOrder[];
  voucherCode?: string;
  subtotalGoods: number;
  discountTotal: number;
  shippingTotal: number;
  giftBoxTotal: number;
  depositTotal: number;
  payNowTotal: number;
  payOnDeliveryTotal: number;
  paymentExpiresAt: number; // Timestamp 15 phút
  paymentStatus: 'pending' | 'paid' | 'failed' | 'timeout_cancelled' | 'refund_pending';
  createdAt: string;
}
