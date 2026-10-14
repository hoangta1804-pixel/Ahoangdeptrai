/**
 * Dữ liệu mẫu ban đầu theo mô hình nghiệp vụ mới (Giai đoạn 2).
 *
 * - Sản phẩm vẫn là 5 sản phẩm của src/App.tsx cũ, đã sửa nhóm hàng và mỗi HTX một mã riêng (L16).
 *   Giai đoạn 5 thay bằng danh mục của nhóm (mục 9).
 * - Tên HTX, khách hàng, SĐT, tài khoản đều là dữ liệu mẫu rõ ràng là giả.
 * - Phường/xã ghi "(mẫu)" cho đến khi nhóm nạp danh mục chính thức. Khoảng cách là số mẫu.
 * - Đơn mẫu được tạo qua chính các hàm trong src/domain để dữ liệu luôn nhất quán.
 */
import { groupKey, placeCheckout } from '../domain/checkout';
import { carrierSimulate, coopConfirm, coopHandover, customerConfirmReceived } from '../domain/orders';
import { DEFAULT_PARAMS } from '../domain/params';
import { applyGatewayResult } from '../domain/payment';
import { addMs, DAY_MS, HOUR_MS, toDateKey } from '../domain/state';
import type { Actor, DemoState, Product, UserAccount } from '../domain/types';
import type { Voucher } from '../domain/voucher';

const dateFromNow = (now: Date, days: number) => toDateKey(addMs(now, days * DAY_MS));

function products(now: Date): Product[] {
  return [
    {
      id: 'prod-man',
      coopId: 'coop-bacha',
      name: 'Mận Tam Hoa Bắc Hà',
      category: 'fresh',
      region: 'Bắc Hà',
      unit: 'kg',
      price: 85_000,
      description: 'Mận hái chọn từng quả tại sườn núi Bắc Hà, quả to đều, thịt giòn, phấn trắng tự nhiên bọc quanh vỏ.',
      image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=600&q=80',
      fallbackGradient: 'from-rose-700 to-amber-800',
      certLabel: 'OCOP 4 Sao (HTX khai, chờ xác minh)',
      kind: 'preorder',
      stockOnHand: 0,
      expressApproved: false,
      preorder: { totalSlots: 100, deliveryFrom: dateFromNow(now, 6), deliveryTo: dateFromNow(now, 20), open: true },
      status: 'active',
    },
    {
      id: 'prod-gao',
      coopId: 'coop-muongkhuong',
      name: 'Gạo Séng Cù Mường Khương',
      category: 'dry',
      region: 'Mường Khương',
      unit: 'túi 5kg',
      price: 195_000,
      description: 'Gạo lúa nương gieo trồng ở thung lũng Mường Khương, hạt dài đều, cơm dẻo thơm.',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      fallbackGradient: 'from-amber-600 to-yellow-800',
      certLabel: 'OCOP 5 Sao (HTX khai, chờ xác minh)',
      kind: 'ready',
      stockOnHand: 40,
      expressApproved: true,
      status: 'active',
    },
    {
      id: 'prod-cahoi',
      coopId: 'coop-sapa-ts',
      name: 'Cá Hồi Vân Sa Pa Nguyên Con',
      category: 'fresh',
      region: 'Sa Pa',
      unit: 'kg',
      price: 340_000,
      description: 'Cá hồi nuôi tại vùng nước lạnh Sa Pa, thịt đỏ cam, thớ săn chắc.',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      fallbackGradient: 'from-orange-600 to-teal-800',
      certLabel: 'VietGAP (HTX khai, chờ xác minh)',
      kind: 'preorder',
      stockOnHand: 0,
      expressApproved: false,
      preorder: { totalSlots: 50, deliveryFrom: dateFromNow(now, 4), deliveryTo: dateFromNow(now, 14), open: true },
      status: 'active',
    },
    {
      id: 'prod-dao',
      coopId: 'coop-sapa-caq',
      name: 'Đào Sa Pa',
      category: 'fresh',
      region: 'Sa Pa',
      unit: 'kg',
      price: 120_000,
      description: 'Đào trồng tại các bản người Mông ở Sa Pa, giòn, ngọt thanh.',
      image: 'https://images.unsplash.com/photo-1629828874514-c1e5103f2150?auto=format&fit=crop&w=600&q=80',
      fallbackGradient: 'from-rose-400 to-amber-700',
      certLabel: 'OCOP 4 Sao (HTX khai, chờ xác minh)',
      kind: 'preorder',
      stockOnHand: 0,
      expressApproved: false,
      preorder: { totalSlots: 80, deliveryFrom: dateFromNow(now, 10), deliveryTo: dateFromNow(now, 30), open: true },
      status: 'active',
    },
    {
      id: 'prod-matong',
      coopId: 'coop-bacha',
      name: 'Mật Ong Bắc Hà',
      category: 'processed',
      region: 'Bắc Hà',
      unit: 'chai 500ml',
      price: 290_000,
      description: 'Mật ong khai thác tại cao nguyên Bắc Hà.',
      image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80',
      fallbackGradient: 'from-amber-500 to-emerald-800',
      certLabel: 'OCOP 4 Sao (HTX khai, chờ xác minh)',
      kind: 'ready',
      stockOnHand: 12,
      expressApproved: true,
      status: 'active',
    },
  ];
}

function vouchers(now: Date): Voucher[] {
  const in60 = addMs(now, 60 * DAY_MS).toISOString();
  return [
    { id: 'v-min', code: 'GIAM30K', title: 'Giảm 30.000đ cho đơn từ 300.000đ', kind: 'fixed', value: 30_000, minSpend: 300_000, expiresAt: in60, usageLimit: 200, firstOrderOnly: false },
    { id: 'v-cat', code: 'CHEBIEN10', title: 'Giảm 10% hàng Chế biến, tối đa 50.000đ', kind: 'percent', value: 10, maxDiscount: 50_000, minSpend: 0, categories: ['processed'], expiresAt: in60, usageLimit: 200, firstOrderOnly: false },
    { id: 'v-first', code: 'CHAOBAN', title: 'Giảm 20.000đ cho khách đặt lần đầu', kind: 'fixed', value: 20_000, minSpend: 100_000, expiresAt: in60, usageLimit: 500, firstOrderOnly: true },
    { id: 'v-expired', code: 'THANG9', title: 'Giảm 25.000đ (đã hết hạn)', kind: 'fixed', value: 25_000, minSpend: 200_000, expiresAt: addMs(now, -5 * DAY_MS).toISOString(), usageLimit: 100, firstOrderOnly: false },
  ];
}

/**
 * Tài khoản demo (mục 5.9). SĐT rõ ràng là giả; OTP mô phỏng luôn là 123456.
 * Đủ 2 khách hàng, các HTX, Admin theo 4 nhóm quyền + Quản trị gốc, 1 tài khoản Cơ quan QLNN.
 */
export const DEMO_USERS: Omit<UserAccount, 'createdAt'>[] = [
  { id: 'u-kh1', phone: '0900000001', name: 'Khách hàng mẫu 1', role: 'customer', customerId: 'cust-1', status: 'active' },
  { id: 'u-kh2', phone: '0900000002', name: 'Khách hàng mẫu 2', role: 'customer', customerId: 'cust-2', status: 'active' },
  { id: 'u-htx-bacha', phone: '0900000101', name: 'HTX mẫu Bắc Hà', role: 'coop', coopId: 'coop-bacha', status: 'active' },
  { id: 'u-htx-mk', phone: '0900000102', name: 'HTX mẫu Mường Khương', role: 'coop', coopId: 'coop-muongkhuong', status: 'active' },
  { id: 'u-htx-sapats', phone: '0900000103', name: 'HTX mẫu Sa Pa (thuỷ sản)', role: 'coop', coopId: 'coop-sapa-ts', status: 'active' },
  { id: 'u-htx-sapacaq', phone: '0900000104', name: 'HTX mẫu Sa Pa (cây ăn quả)', role: 'coop', coopId: 'coop-sapa-caq', status: 'active' },
  { id: 'u-ad-vh', phone: '0900000201', name: 'Admin – Vận hành (mẫu)', role: 'admin', adminGroup: 'operations', status: 'active' },
  { id: 'u-ad-cl', phone: '0900000202', name: 'Admin – Chất lượng (mẫu)', role: 'admin', adminGroup: 'quality', status: 'active' },
  { id: 'u-ad-cskh', phone: '0900000203', name: 'Admin – CSKH (mẫu)', role: 'admin', adminGroup: 'cskh', status: 'active' },
  { id: 'u-ad-tc', phone: '0900000204', name: 'Admin – Tài chính (mẫu)', role: 'admin', adminGroup: 'finance', status: 'active' },
  { id: 'u-ad-root', phone: '0900000209', name: 'Quản trị gốc (mẫu)', role: 'admin', adminGroup: 'root', status: 'active' },
  { id: 'u-qlnn', phone: '0900000301', name: 'Cơ quan QLNN (mẫu)', role: 'regulator', status: 'active' },
];

function baseState(now: Date): DemoState {
  return {
    clockOffsetMs: 0,
    users: DEMO_USERS.map((u) => ({ ...u, createdAt: now.toISOString() })),
    customers: [
      { id: 'cust-1', name: 'Khách hàng mẫu 1', phone: '0900000001', refundAccount: { bankName: 'Ngân hàng mẫu', accountNumber: '000000000001', holder: 'KHACH HANG MAU 1' } },
      { id: 'cust-2', name: 'Khách hàng mẫu 2', phone: '0900000002' },
    ],
    coops: [
      { id: 'coop-bacha', name: 'HTX mẫu Bắc Hà', region: 'Bắc Hà', payoutAccountMasked: '**** 0101', status: 'active', profileStatus: 'approved' },
      { id: 'coop-muongkhuong', name: 'HTX mẫu Mường Khương', region: 'Mường Khương', payoutAccountMasked: '**** 0102', status: 'active', profileStatus: 'approved' },
      { id: 'coop-sapa-ts', name: 'HTX mẫu Sa Pa (thuỷ sản)', region: 'Sa Pa', payoutAccountMasked: '**** 0103', status: 'active', profileStatus: 'approved' },
      { id: 'coop-sapa-caq', name: 'HTX mẫu Sa Pa (cây ăn quả)', region: 'Sa Pa', payoutAccountMasked: '**** 0104', status: 'active', profileStatus: 'approved' },
    ],
    products: products(now),
    productChanges: [],
    wards: [
      { id: 'w-xuanphuong', name: 'Phường Xuân Phương (mẫu)', distanceKm: 3.5 },
      { id: 'w-taymo', name: 'Phường Tây Mỗ (mẫu)', distanceKm: 4.2 },
      { id: 'w-caugiay', name: 'Phường Cầu Giấy (mẫu)', distanceKm: 8.1 },
      { id: 'w-thanhxuan', name: 'Phường Thanh Xuân (mẫu)', distanceKm: 9.4 },
      { id: 'w-badinh', name: 'Phường Ba Đình (mẫu)', distanceKm: 11.6 },
      { id: 'w-hoankiem', name: 'Phường Hoàn Kiếm (mẫu)', distanceKm: 13.2 },
      { id: 'w-longbien', name: 'Phường Long Biên (mẫu)', distanceKm: 17.5 },
      { id: 'w-socson', name: 'Xã Sóc Sơn (mẫu)', distanceKm: 35 },
    ],
    addresses: [
      { id: 'addr-1', customerId: 'cust-1', label: 'Nhà riêng', receiverName: 'Khách hàng mẫu 1', receiverPhone: '0900000001', houseType: 'apartment', wardId: 'w-taymo', street: 'Khu đô thị mẫu', building: 'S2', unit: '1508', isDefault: true },
      { id: 'addr-2', customerId: 'cust-1', label: 'Văn phòng', receiverName: 'Khách hàng mẫu 1', receiverPhone: '0900000001', houseType: 'ground', wardId: 'w-caugiay', street: '25 ngõ 12 đường mẫu', isDefault: false },
      { id: 'addr-3', customerId: 'cust-2', label: 'Nhà riêng', receiverName: 'Khách hàng mẫu 2', receiverPhone: '0900000002', houseType: 'ground', wardId: 'w-thanhxuan', street: '18 ngõ 42 đường mẫu', isDefault: true },
    ],
    carts: {},
    checkouts: [],
    orders: [],
    transactions: [],
    vouchers: vouchers(now),
    voucherUsages: [],
    giftBoxTypes: [
      { id: 'box-kraft', name: 'Hộp giấy kraft', fee: 15_000, description: 'Hộp giấy tái chế, buộc dây cói.' },
      { id: 'box-cloth', name: 'Túi vải in hoa văn', fee: 30_000, description: 'Túi vải mộc, in hoa văn mẫu.' },
      { id: 'box-wood', name: 'Hộp gỗ thông', fee: 45_000, description: 'Hộp gỗ thông có lót rơm.' },
    ],
    refunds: [],
    tickets: [],
    payoutPeriods: [],
    params: structuredClone(DEFAULT_PARAMS),
    paramHistory: [],
    auditLogs: [],
    notifications: [],
    ledgerEntries: [],
    reviews: [],
    lowStockAlerts: {},
  };
}

function must(r: { ok: true; value: DemoState } | { ok: false; error: string }): DemoState {
  if (!r.ok) throw new Error(`Dữ liệu mẫu lỗi: ${r.error}`);
  return r.value;
}

/** Tạo dữ liệu mẫu: 1 đơn đã giao (để demo khiếu nại, đối soát) và 1 đơn đã thanh toán đang chờ HTX xác nhận. */
export function createSeedState(now: Date): DemoState {
  let s = baseState(now);
  const cust2: Actor = { kind: 'customer', id: 'cust-2', userId: 'u-kh2', name: 'Khách hàng mẫu 2' };
  const cust1: Actor = { kind: 'customer', id: 'cust-1', userId: 'u-kh1', name: 'Khách hàng mẫu 1' };
  const coopMK: Actor = { kind: 'coop', id: 'coop-muongkhuong', userId: 'u-htx-mk', name: 'HTX mẫu Mường Khương' };
  const opsSystem: Actor = { kind: 'admin', id: 'seed', name: 'Dữ liệu mẫu', adminGroup: 'operations' };

  // Đơn 1: Khách 2 mua 2 túi gạo, COD, đã giao cách đây 2 ngày.
  const t1 = addMs(now, -3 * DAY_MS);
  const p1 = placeCheckout(
    s,
    {
      customerId: 'cust-2',
      lines: [{ productId: 'prod-gao', quantity: 2, seenPrice: 195_000 }],
      addressId: 'addr-3',
      note: '',
      groupOptions: { [groupKey('coop-muongkhuong', 'ready')]: { shipping: 'standard', paymentMethod: 'cod' } },
      idempotencyKey: 'seed-1',
      acceptedPreorderPolicy: true,
      confirmedPriceIncrease: false,
      fromCart: false,
    },
    cust2,
    new Date(t1.getFullYear(), t1.getMonth(), t1.getDate(), 9, 0),
  );
  if (!p1.ok) throw new Error(p1.error);
  s = p1.state;
  const o1 = p1.checkout.orderIds[0];
  const day = (n: number, h: number) => {
    const d = addMs(now, n * DAY_MS);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0);
  };
  s = must(coopConfirm(s, o1, coopMK, day(-3, 10)));
  s = must(coopHandover(s, o1, coopMK, day(-3, 15)));
  s = must(carrierSimulate(s, o1, opsSystem, 'delivered_reported', '', day(-2, 10)));
  s = must(customerConfirmReceived(s, o1, cust2, day(-2, 11)));

  // Đơn 2: Khách 1 mua 1 chai mật ong, thanh toán online thành công 1 giờ trước, chờ HTX xác nhận.
  const t2 = addMs(now, -1 * HOUR_MS);
  const p2 = placeCheckout(
    s,
    {
      customerId: 'cust-1',
      lines: [{ productId: 'prod-matong', quantity: 1, seenPrice: 290_000 }],
      addressId: 'addr-1',
      note: 'Gọi trước khi giao.',
      groupOptions: { [groupKey('coop-bacha', 'ready')]: { shipping: 'standard', paymentMethod: 'online' } },
      idempotencyKey: 'seed-2',
      acceptedPreorderPolicy: true,
      confirmedPriceIncrease: false,
      fromCart: false,
    },
    cust1,
    t2,
  );
  if (!p2.ok) throw new Error(p2.error);
  s = must((() => {
    const r = applyGatewayResult(p2.state, p2.transaction!.id, 'success', 'SEED-REF-2', addMs(t2, 2 * 60_000));
    return r.ok ? { ok: true as const, value: r.value.state } : r;
  })());

  // Nhật ký và sổ giao dịch của dữ liệu mẫu giữ lại để màn Admin có dữ liệu; thông báo bắt đầu trống.
  return { ...s, auditLogs: [] };
}
