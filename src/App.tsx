/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ĐẶC SẢN SỐ LÀO CAI – GIAN HÀNG CHÍNH HÃNG
 * Nền tảng phân phối nông sản, đặc sản Lào Cai có bảo chứng nguồn gốc của CQQLNN, giao hàng TP. Hà Nội.
 * Prototype Đa Vai Trò Chuẩn Mobile HIG Apple & GrabMart
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  User,
  Store,
  Truck,
  Building2,
  Lock,
  QrCode,
  Camera,
  RefreshCw,
  Search,
  Filter,
  X,
  Check,
  Plus,
  Minus,
  FileText,
  BarChart3,
  Sliders,
  LogOut,
  Phone,
  CreditCard,
  ScanFace,
  History,
  FileCheck2,
  BadgePercent,
  TrendingUp,
  Info,
  Send,
  UploadCloud,
  CheckCircle,
  Navigation,
  FileBadge,
  AlertTriangle,
  Smartphone
} from 'lucide-react';

// ==========================================
// 1. DATA MODELS & INITIAL STATE
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
  preorderStock?: number;
  preorderSold?: number;
  deliveryDate?: string;
  depositPercent: number; // 30%
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
  // If apartment:
  buildingName?: string;
  buildingBlock?: string;
  apartmentNumber?: string;
  // If ground:
  streetDetails?: string;
  district: string;
  ward: string;
  city: string; // "Hà Nội"
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

// Initial Products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    name: 'Mận Tam Hoa Bắc Hà Chính Gốc',
    coopId: 'coop-01',
    coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà',
    price: 85000,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=600&q=80',
    fallbackGradient: 'from-rose-700 to-amber-800',
    isPreorder: true,
    preorderStock: 100,
    preorderSold: 65,
    deliveryDate: '20/10/2026',
    depositPercent: 30,
    certType: 'OCOP 4 Sao',
    certNumber: 'OCOP-LC-2024-889',
    originDistrict: 'Bắc Hà',
    description: 'Mận hái chọn từng quả tại sườn núi Bắc Hà, quả to đều, thịt giòn mọng, phấn trắng tự nhiên bọc quanh vỏ.',
    rating: 4.9,
    reviewCount: 142,
    status: 'active'
  },
  {
    id: 'prod-02',
    name: 'Gạo Séng Cù Mường Khương Thượng Hạng',
    coopId: 'coop-02',
    coopName: 'HTX Dịch Vụ Nông Nghiệp Mường Khương',
    price: 195000,
    unit: 'túi 5kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    fallbackGradient: 'from-amber-600 to-yellow-800',
    isPreorder: false,
    depositPercent: 0,
    certType: 'OCOP 5 Sao',
    certNumber: 'OCOP-LC-2023-012',
    originDistrict: 'Mường Khương',
    description: 'Gạo lúa nương gieo trồng ở thung lũng đá Mường Khương, hạt dài đều, cơm dẻo thơm ngào ngạt, đậm đà vị ngọt hậu.',
    rating: 5.0,
    reviewCount: 318,
    status: 'active'
  },
  {
    id: 'prod-03',
    name: 'Cá Hồi Vân Sa Pa Tươi Sống Nguyên Con',
    coopId: 'coop-03',
    coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa',
    price: 340000,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    fallbackGradient: 'from-orange-600 to-teal-800',
    isPreorder: true,
    preorderStock: 50,
    preorderSold: 42,
    deliveryDate: '18/10/2026',
    depositPercent: 30,
    certType: 'VietGAP',
    certNumber: 'VGAP-TS-2024-004',
    originDistrict: 'Sa Pa',
    description: 'Nuôi tại dòng suối lạnh Thác Bạc dưới chân đỉnh Fansipan. Thịt cá đỏ cam tự nhiên, thớ săn chắc, giàu Omega-3.',
    rating: 4.8,
    reviewCount: 96,
    status: 'active'
  },
  {
    id: 'prod-04',
    name: 'Đào Tuyết Cổ Thụ Sa Pa Mọng Nước',
    coopId: 'coop-03',
    coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa',
    price: 120000,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1629828874514-c1e5103f2150?auto=format&fit=crop&w=600&q=80',
    fallbackGradient: 'from-rose-400 to-amber-700',
    isPreorder: true,
    preorderStock: 80,
    preorderSold: 54,
    deliveryDate: '22/10/2026',
    depositPercent: 30,
    certType: 'OCOP 4 Sao',
    certNumber: 'OCOP-LC-2024-411',
    originDistrict: 'Sa Pa',
    description: 'Đào tuyết mọc tự nhiên trên các bản làng người Mông Sa Pa, giòn ngọt thanh tao, thơm mùi sương núi.',
    rating: 4.9,
    reviewCount: 88,
    status: 'active'
  },
  {
    id: 'prod-05',
    name: 'Mật Ong Hoa Bạc Hà Bắc Hà Nguyên Chất',
    coopId: 'coop-01',
    coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà',
    price: 290000,
    unit: 'chai 500ml',
    image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    fallbackGradient: 'from-amber-500 to-emerald-800',
    isPreorder: false,
    depositPercent: 0,
    certType: 'OCOP 4 Sao',
    certNumber: 'OCOP-LC-2023-332',
    originDistrict: 'Bắc Hà',
    description: 'Mật ong khai thác từ hoa bạc hà dại nở vào đầu đông trên cao nguyên đá Bắc Hà, màu vàng chanh ánh xanh đặc trưng.',
    rating: 4.95,
    reviewCount: 215,
    status: 'active'
  }
];

// Initial Addresses
const INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr-01',
    title: 'Nhà riêng (Chung cư)',
    receiverName: 'Nguyễn Văn An',
    receiverPhone: '0988 234 567',
    houseType: 'apartment',
    buildingName: 'KĐT Vinhomes Smart City',
    buildingBlock: 'S2.05',
    apartmentNumber: '1508',
    district: 'Nam Từ Liêm',
    ward: 'Tây Mỗ',
    city: 'Hà Nội',
    isDefault: true,
    lat: 20.9984,
    lng: 105.7483
  },
  {
    id: 'addr-02',
    title: 'Văn phòng làm việc',
    receiverName: 'Nguyễn Văn An',
    receiverPhone: '0988 234 567',
    houseType: 'ground',
    streetDetails: 'Số 25 Ngõ 12 Láng Hạ',
    district: 'Ba Đình',
    ward: 'Thành Công',
    city: 'Hà Nội',
    isDefault: false,
    lat: 21.0189,
    lng: 105.8154
  },
  {
    id: 'addr-03',
    title: 'Nhà bố mẹ',
    receiverName: 'Nguyễn Văn An',
    receiverPhone: '0988 234 567',
    houseType: 'apartment',
    buildingName: 'Vinhomes Royal City',
    buildingBlock: 'Tòa R2',
    apartmentNumber: '2204',
    district: 'Thanh Xuân',
    ward: 'Thượng Đình',
    city: 'Hà Nội',
    isDefault: false,
    lat: 21.0028,
    lng: 105.8166
  }
];

// Initial Orders
const INITIAL_ORDERS: Order[] = [
  {
    id: 'LCA-88219',
    createdAt: '11/10/2026',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0988 234 567',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1, unitPrice: 340000 } // Cá Hồi Sa Pa
    ],
    totalItemAmount: 340000,
    shippingFee: 30000,
    voucherDiscount: 0,
    totalAmount: 370000,
    depositPaid: 102000, // 30% of item
    remainingCod: 268000, // 70% + ship
    shippingMethod: 'express',
    frozenAddressSnapshot: 'Tòa S2.05 - Căn 1508, KĐT Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội',
    houseType: 'apartment',
    district: 'Nam Từ Liêm',
    status: 'delayed', // Preorder overdue > 48h
    expectedDelivery: '12/10/2026',
    isPreorder: true,
    assignedShipper: 'Trần Văn Mạnh (0912 345 678)'
  },
  {
    id: 'LCA-77341',
    createdAt: '13/10/2026',
    customerName: 'Trịnh Thu Hà',
    customerPhone: '0977 123 456',
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 1, unitPrice: 195000 }, // Gạo Séng Cù
      { product: INITIAL_PRODUCTS[4], quantity: 1, unitPrice: 290000 }  // Mật ong Bạc Hà
    ],
    totalItemAmount: 485000,
    shippingFee: 20000,
    voucherDiscount: 20000,
    totalAmount: 485000,
    depositPaid: 0,
    remainingCod: 485000,
    shippingMethod: 'standard',
    frozenAddressSnapshot: 'Số 18 Ngách 5 Ngõ 42 Triều Khúc, Thanh Xuân Nam, Thanh Xuân, Hà Nội',
    houseType: 'ground',
    district: 'Thanh Xuân',
    status: 'delivering',
    expectedDelivery: '14/10/2026',
    isPreorder: false,
    assignedShipper: 'Nguyễn Hữu Tài (Shipper Đội Cầu Giấy - Thanh Xuân)'
  },
  {
    id: 'LCA-65910',
    createdAt: '08/10/2026',
    customerName: 'Hoàng Minh Tuấn',
    customerPhone: '0904 888 999',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 2, unitPrice: 85000 } // Mận Tam Hoa
    ],
    totalItemAmount: 170000,
    shippingFee: 25000,
    voucherDiscount: 0,
    totalAmount: 195000,
    depositPaid: 51000,
    remainingCod: 144000,
    shippingMethod: 'standard',
    frozenAddressSnapshot: 'Tòa R2 - Căn 2204, Royal City, 72A Nguyễn Trãi, Thượng Đình, Thanh Xuân, Hà Nội',
    houseType: 'apartment',
    district: 'Thanh Xuân',
    status: 'completed',
    expectedDelivery: '10/10/2026',
    isPreorder: true
  }
];

// Initial Tickets
const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-2026-081',
    orderId: 'LCA-65910',
    coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà',
    customerName: 'Hoàng Minh Tuấn',
    customerPhone: '0904 888 999',
    issueType: 'damaged_fruit',
    description: 'Hộp mận khi nhận bị giập 3 quả ở góc do khâu bọc xốp vận chuyển hơi lỏng.',
    createdAt: '10/10/2026 14:30',
    status: 'open',
    coopExplanation: ''
  }
];

// Initial Ledger
const INITIAL_LEDGER: LedgerEntry[] = [
  { id: 'LED-001', type: 'goods_sale', amount: 170000, orderId: 'LCA-65910', coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà', date: '10/10/2026', status: 'matched' },
  { id: 'LED-002', type: 'commission', amount: -8500, orderId: 'LCA-65910', coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà', date: '10/10/2026', status: 'matched' },
  { id: 'LED-003', type: 'shipping_fee', amount: -25000, orderId: 'LCA-65910', coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà', date: '10/10/2026', status: 'matched' },
  { id: 'LED-004', type: 'refund', amount: -51000, orderId: 'LCA-88219', coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa', date: '12/10/2026', status: 'mismatched', bearer: 'HTX', notes: 'Chênh lệch hoàn tiền hủy đơn quá hạn' },
  { id: 'LED-005', type: 'gateway_fee', amount: -4200, orderId: 'LCA-88219', coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa', date: '11/10/2026', status: 'matched' }
];

// Initial Audit Logs
const INITIAL_AUDITS: AuditLog[] = [
  { id: 'AUD-01', timestamp: '13/10/2026 09:15', adminName: 'Lê Hoàng (Admin Tài chính)', action: 'Duyệt bảng kê kỳ 19', target: 'HTX Bắc Hà', oldValue: 'Chờ duyệt', newValue: 'Đã duyệt chi 14.500.000đ' },
  { id: 'AUD-02', timestamp: '12/10/2026 16:40', adminName: 'Nguyễn Mai (Admin Vận hành)', action: 'Cập nhật phụ phí hỏa tốc', target: 'Bậc 5-10km', oldValue: '25.000đ', newValue: '30.000đ' },
  { id: 'AUD-03', timestamp: '11/10/2026 10:20', adminName: 'Trần Vũ (Admin CSKH)', action: 'Đóng Ticket khiếu nại', target: 'TCK-2026-079', oldValue: 'Đang điều tra', newValue: 'Đã bồi hoàn 100%' }
];

// Hanoi Districts
const HANOI_DISTRICTS = [
  'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
  'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Nam Từ Liêm',
  'Bắc Từ Liêm', 'Hà Đông'
];

export default function App() {
  // Current Active Role
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');

  // App Global State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [selectedAddress, setSelectedAddress] = useState<Address>(INITIAL_ADDRESSES[0]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [audits, setAudits] = useState<AuditLog[]>(INITIAL_AUDITS);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Navigation Tabs for Customer
  const [customerTab, setCustomerTab] = useState<'explore' | 'preorder' | 'orders' | 'account'>('explore');
  // Navigation Tabs for Coop
  const [coopTab, setCoopTab] = useState<'products' | 'orders' | 'wallet' | 'legal'>('products');
  // Admin Subgroup & Admin Tab
  const [adminGroup, setAdminGroup] = useState<AdminSubGroup>('operations');
  const [adminTab, setAdminTab] = useState<'approvals' | 'params' | 'ledger' | 'tickets'>('approvals');

  // Customer Bank Info for COD refund
  const [refundBank, setRefundBank] = useState({
    bankName: 'Ngân hàng TMCP Ngoại Thương VN (Vietcombank)',
    accountNumber: '1023847599',
    accountHolder: 'NGUYEN VAN AN'
  });

  // Modals & Bottom Sheets
  const [activeModal, setActiveModal] = useState<
    | null
    | 'auth'
    | 'product_detail'
    | 'checkout'
    | 'address_sheet'
    | 'new_address'
    | 'ticket_form'
    | 'shipper_scan'
    | 'ledger_adjust'
    | 'silent_locked'
    | 'image_preview'
    | 'face_id_scan'
  >(null);

  // Selected Product for Detail
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);

  // Active Ticket for HTX response or CSKH handling
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [coopResponseText, setCoopResponseText] = useState<string>('');

  // Selected Ledger row for reconciliation adjustment
  const [selectedLedgerRow, setSelectedLedgerRow] = useState<LedgerEntry | null>(null);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCert, setFilterCert] = useState<string>('all');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth & Security Mock States
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'otp'>('login');
  const [authPhone, setAuthPhone] = useState('0988234567');
  const [authPassword, setAuthPassword] = useState('');
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [lockCountdown, setLockCountdown] = useState<number>(0);
  const [isFaceIdEnabled, setIsFaceIdEnabled] = useState(true);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const [registerType, setRegisterType] = useState<'customer' | 'coop'>('customer');
  const [coopTaxCode, setCoopTaxCode] = useState('');
  const [coopBusinessName, setCoopBusinessName] = useState('');
  const [accountLockReason, setAccountLockReason] = useState('Phát hiện giao dịch bất thường vi phạm quy chế bảo chứng nguồn gốc.');

  // Fullscreen Device View Toggle
  const [fitScreen, setFitScreen] = useState(false);

  // Countdown timer for 15-minute lock
  useEffect(() => {
    let interval: any;
    if (lockCountdown > 0) {
      interval = setInterval(() => {
        setLockCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockCountdown]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (activeModal === 'auth' && authStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeModal, authStep, otpTimer]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Shipping Calculation based on distance from nearest hub (Nam Từ Liêm / Ba Đình)
  const [shippingType, setShippingType] = useState<'standard' | 'express'>('express');
  const shippingDistanceKm = 6.8; // Example distance from hub
  const shippingFee = useMemo(() => {
    if (shippingType === 'standard') return 25000;
    // Express tiers: 0-5km: 20k, 5-10km: 30k, 10-15km: 40k
    if (shippingDistanceKm <= 5) return 20000;
    if (shippingDistanceKm <= 10) return 30000;
    return 40000;
  }, [shippingType, shippingDistanceKm]);

  const [voucherCode, setVoucherCode] = useState('LAOCAI10');
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  // Handler for adding to cart
  const handleAddToCart = (product: Product, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    showToast(`Đã thêm ${qty} ${product.unit} ${product.name} vào giỏ hàng`);
  };

  // Preorder Cancellation (overdue > 48h)
  const handleCancelOverduePreorder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return { ...ord, status: 'cancelled', isRefunded: true };
        }
        return ord;
      })
    );
    // Add ledger entry for refund
    const refundEntry: LedgerEntry = {
      id: `LED-${Date.now()}`,
      type: 'refund',
      amount: -102000,
      orderId: orderId,
      coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa',
      date: '13/10/2026',
      status: 'matched',
      bearer: 'HTX',
      notes: 'Hoàn 100% tiền cọc do trễ hạn giao cam kết'
    };
    setLedger((prev) => [refundEntry, ...prev]);
    showToast('Hủy đơn thành công! Đã hoàn trả 100% tiền cọc (102.000đ) vào tài khoản');
  };

  // Face ID Biometric Trigger
  const triggerFaceIDLogin = () => {
    setActiveModal('face_id_scan');
    setTimeout(() => {
      setActiveModal(null);
      showToast('Xác thực Face ID thành công! Chào mừng trở lại.');
    }, 1800);
  };

  // Format currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-start text-stone-800 p-2 sm:p-4 select-none">
      
      {/* ========================================================
          ROLE SWITCHER (Floating Glassmorphism Bar outside iPhone)
         ======================================================== */}
      <header className="w-full max-w-4xl flex flex-col items-center gap-2 mb-3 z-50">
        <div className="flex items-center justify-between w-full px-2 py-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Đặc Sản Số Lào Cai – Nền Tảng Phân Phối Chuẩn HIG
            </span>
          </div>
          <button
            onClick={() => setFitScreen(!fitScreen)}
            className="text-[11px] text-stone-400 hover:text-white flex items-center gap-1 transition-colors bg-stone-800/80 px-2 py-1 rounded-md"
          >
            <Smartphone size={12} />
            <span>{fitScreen ? 'Thu nhỏ chuẩn iPhone' : 'Toàn màn hình'}</span>
          </button>
        </div>

        {/* 5-Role Pill Bar */}
        <nav aria-label="Role Switcher" className="bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-2xl p-1.5 flex flex-wrap items-center justify-center gap-1.5 shadow-2xl">
          <button
            onClick={() => {
              setCurrentRole('customer');
              showToast('Đang ở giao diện: Khách hàng mua sắm tại Hà Nội');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              currentRole === 'customer'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Khách hàng</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('coop');
              showToast('Đang ở giao diện: Quản trị Gian hàng / HTX Lào Cai');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              currentRole === 'coop'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Store size={14} />
            <span>Gian hàng / HTX</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('shipper');
              showToast('Đang ở giao diện: Đội ngũ Giao vận Hà Nội');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              currentRole === 'shipper'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Truck size={14} />
            <span>Giao vận (Shipper)</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('regulator');
              showToast('Đang ở giao diện: Báo cáo Giám sát CQQLNN (Read-only)');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              currentRole === 'regulator'
                ? 'bg-sky-700 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Building2 size={14} />
            <span>Giám sát QLNN</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('admin');
              showToast('Đang ở giao diện: Quản trị viên Tối cao (Admin Mobile)');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              currentRole === 'admin'
                ? 'bg-rose-700 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Lock size={14} />
            <span>Admin Mobile</span>
          </button>
        </nav>
      </header>

      {/* ========================================================
          IPHONE 16 PRO CASING (393px × 852px)
         ======================================================== */}
      <main
        className={`relative transition-all duration-300 bg-[#FAF8F5] text-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] border-[6px] border-stone-800/90 overflow-hidden flex flex-col ${
          fitScreen
            ? 'w-full max-w-[430px] h-[92vh] rounded-[42px]'
            : 'w-[393px] h-[852px] rounded-[48px]'
        }`}
      >
        {/* Dynamic Island Pill */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-3 text-white">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-[10px] font-semibold text-stone-300 tracking-wider">Lào Cai 5G</span>
          <div className="w-3 h-3 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-800"></div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="pt-3 px-7 flex items-center justify-between text-xs font-semibold text-stone-900 z-40 select-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-stone-900">
            <span className="text-[11px]">5G</span>
            <div className="w-5 h-2.5 border border-stone-900 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-full bg-stone-900 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* APP CONTENT CONTAINER (Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col pb-16">
          
          {/* ----------------------------------------------------
              ROLE 1: CUSTOMER VIEW
             ---------------------------------------------------- */}
          {currentRole === 'customer' && (
            <div className="flex flex-col flex-1">
              
              {/* Top Location Bar */}
              <div className="px-4 py-2.5 border-b border-stone-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <button
                  onClick={() => setActiveModal('address_sheet')}
                  className="flex items-center gap-1.5 text-left max-w-[280px]"
                >
                  <MapPin size={16} className="text-emerald-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] font-semibold uppercase text-stone-400 block tracking-tight">Giao đến tại Hà Nội</span>
                    <span className="text-xs font-bold text-stone-800 truncate block">
                      {selectedAddress.houseType === 'apartment'
                        ? `${selectedAddress.buildingBlock} - Căn ${selectedAddress.apartmentNumber}, ${selectedAddress.district}`
                        : `${selectedAddress.streetDetails}, ${selectedAddress.district}`}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-stone-400 shrink-0" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModal('checkout')}
                    className="relative p-2 rounded-full hover:bg-stone-100 transition-colors"
                  >
                    <ShoppingBag size={20} className="text-emerald-900" />
                    {cart.length > 0 && (
                      <span className="absolute top-1 right-1 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {cart.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveModal('auth')}
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                    title="Tài khoản / Đăng nhập"
                  >
                    <User size={18} />
                  </button>
                </div>
              </div>

              {/* TAB 1: KHÁM PHÁ (EXPLORE) */}
              {customerTab === 'explore' && (
                <div className="p-4 space-y-4">
                  
                  {/* Hero Banner with organic agricultural beauty */}
                  <div className="relative rounded-3xl overflow-hidden shadow-sm border border-stone-200/50 h-44 bg-emerald-950">
                    <img
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85"
                      alt="Nông sản Lào Cai"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent flex flex-col justify-end p-4 text-white">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold bg-sky-500/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-white flex items-center gap-1">
                          <ShieldCheck size={12} />
                          CQQLNN Bảo chứng
                        </span>
                        <span className="text-[10px] font-medium bg-amber-500/90 px-2 py-0.5 rounded-md text-white">
                          Giao tận cửa Hà Nội
                        </span>
                      </div>
                      <h2 className="text-lg font-bold leading-tight">Đặc Sản Sương Mây Lào Cai</h2>
                      <p className="text-xs text-stone-200 mt-0.5">Thu hoạch tươi mới từ Bắc Hà, Mường Khương, Sa Pa</p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Tìm mận Bắc Hà, gạo Séng Cù, cá hồi Sa Pa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>

                  {/* Category / Certification Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {['all', 'OCOP 5 Sao', 'OCOP 4 Sao', 'VietGAP'].map((cert) => (
                      <button
                        key={cert}
                        onClick={() => setFilterCert(cert)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                          filterCert === cert
                            ? 'bg-emerald-900 text-white shadow-sm'
                            : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
                        }`}
                      >
                        {cert === 'all' ? 'Tất cả nông sản' : cert}
                      </button>
                    ))}
                  </div>

                  {/* Product Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Danh Sách Chính Hãng</span>
                      <span className="text-[11px] text-stone-400">{products.length} sản phẩm</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {products
                        .filter((p) => filterCert === 'all' || p.certType === filterCert)
                        .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              setDetailProduct(prod);
                              setDetailQuantity(1);
                              setActiveModal('product_detail');
                            }}
                            className="bg-white rounded-2xl border border-stone-200/70 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
                          >
                            <div className="relative h-28 w-full bg-stone-100 overflow-hidden">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              {/* State badges */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                <span className="bg-sky-600/95 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                                  <CheckCircle2 size={10} />
                                  Bảo chứng
                                </span>
                                {prod.isPreorder && (
                                  <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                    Cọc 30%
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-2.5 flex flex-col flex-1 justify-between">
                              <div>
                                <span className="text-[10px] text-emerald-800 font-semibold block truncate">
                                  {prod.coopName}
                                </span>
                                <h3 className="text-xs font-bold text-stone-900 line-clamp-2 mt-0.5">
                                  {prod.name}
                                </h3>
                              </div>

                              {prod.isPreorder && prod.preorderStock && (
                                <div className="mt-2 bg-amber-50 rounded-lg p-1.5 border border-amber-200/60">
                                  <div className="flex items-center justify-between text-[9px] text-amber-900 font-medium mb-1">
                                    <span>Đã đặt {prod.preorderSold}/{prod.preorderStock}</span>
                                    <span>Giao {prod.deliveryDate}</span>
                                  </div>
                                  <div className="w-full bg-amber-200/70 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-amber-600 h-full rounded-full"
                                      style={{ width: `${((prod.preorderSold || 0) / prod.preorderStock) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-extrabold text-stone-900 tabular-nums">
                                    {formatMoney(prod.price)}
                                  </span>
                                  <span className="text-[10px] text-stone-400">/{prod.unit}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(prod, 1);
                                  }}
                                  className="w-7 h-7 rounded-xl bg-emerald-900 text-white flex items-center justify-center hover:bg-emerald-800 transition-colors shadow-xs"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ĐẶT TRƯỚC (PREORDER SPECIAL) */}
              {customerTab === 'preorder' && (
                <div className="p-4 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <Clock size={18} className="text-amber-700" />
                      <span>Chiến Dịch Nông Sản Đặt Trước (Preorder)</span>
                    </div>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Sản phẩm thu hái tươi tại đồi núi Lào Cai theo lịch trình mùa vụ. Đặt cọc 30% giữ suất thu hoạch tươi ngon nhất, 70% còn lại tất toán khi nhận hàng tại Hà Nội.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {products
                      .filter((p) => p.isPreorder)
                      .map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setDetailProduct(prod);
                            setDetailQuantity(1);
                            setActiveModal('product_detail');
                          }}
                          className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs flex gap-3 cursor-pointer"
                        >
                          <img
                            src={prod.image}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-24 h-24 object-cover rounded-xl shrink-0"
                          />
                          <div className="flex flex-col justify-between flex-1">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-sky-700 uppercase">
                                  {prod.originDistrict} • {prod.certType}
                                </span>
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                  Cọc 30%
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-stone-900 mt-0.5">{prod.name}</h4>
                              <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{prod.coopName}</p>
                            </div>

                            <div className="mt-1">
                              <div className="flex justify-between text-[10px] text-stone-600 mb-1">
                                <span>Tiến độ: {prod.preorderSold}/{prod.preorderStock} suất</span>
                                <span className="font-semibold text-amber-800">Giao {prod.deliveryDate}</span>
                              </div>
                              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-600 h-full rounded-full"
                                  style={{ width: `${((prod.preorderSold || 0) / (prod.preorderStock || 1)) * 100}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-100">
                              <span className="text-xs font-bold text-emerald-900 tabular-nums">
                                {formatMoney(prod.price)}/{prod.unit}
                              </span>
                              <span className="text-[10px] text-stone-500">
                                Cọc trước: {formatMoney(Math.round(prod.price * 0.3))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ĐƠN HÀNG (ORDERS & TICKET COMPLAINTS) */}
              {customerTab === 'orders' && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900">Đơn Hàng Của Bạn</h3>
                    <button
                      onClick={() => setActiveModal('ticket_form')}
                      className="text-xs text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200"
                    >
                      <AlertCircle size={14} />
                      Gửi khiếu nại
                    </button>
                  </div>

                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <div>
                            <span className="text-xs font-bold text-stone-900">{ord.id}</span>
                            <span className="text-[10px] text-stone-400 block">{ord.createdAt}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              ord.status === 'delayed'
                                ? 'bg-rose-100 text-rose-700'
                                : ord.status === 'delivering'
                                ? 'bg-sky-100 text-sky-800'
                                : ord.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'cancelled'
                                ? 'bg-stone-200 text-stone-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status === 'delayed' && 'Trễ hạn cam kết (>48h)'}
                            {ord.status === 'delivering' && 'Đang giao hàng tại Hà Nội'}
                            {ord.status === 'completed' && 'Đã giao thành công'}
                            {ord.status === 'cancelled' && 'Đã hủy & Đã hoàn tiền'}
                            {ord.status === 'confirmed' && 'Đã đặt cọc - Đang chuẩn bị'}
                          </span>
                        </div>

                        {/* Items list */}
                        <div className="space-y-1.5">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-stone-700">
                                {item.quantity}x {item.product.name}
                              </span>
                              <span className="font-semibold text-stone-900 tabular-nums">
                                {formatMoney(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Snapshot address */}
                        <div className="bg-stone-50 rounded-xl p-2 text-[11px] text-stone-600 border border-stone-100">
                          <span className="font-semibold text-stone-700 block">Địa chỉ Snapshot cố định:</span>
                          <span className="line-clamp-2">{ord.frozenAddressSnapshot}</span>
                        </div>

                        {/* Preorder Payment breakdown */}
                        {ord.isPreorder ? (
                          <div className="grid grid-cols-2 gap-2 bg-emerald-50/70 p-2 rounded-xl text-[11px] border border-emerald-100">
                            <div>
                              <span className="text-stone-500 block">Đã cọc Online (30%):</span>
                              <span className="font-bold text-emerald-800 tabular-nums">{formatMoney(ord.depositPaid)}</span>
                            </div>
                            <div>
                              <span className="text-stone-500 block">Còn lại thu COD (70% + Ship):</span>
                              <span className="font-bold text-stone-900 tabular-nums">{formatMoney(ord.remainingCod)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-100">
                            <span className="text-stone-500">Tổng thanh toán COD:</span>
                            <span className="font-extrabold text-stone-900 tabular-nums">{formatMoney(ord.totalAmount)}</span>
                          </div>
                        )}

                        {/* Special button for delayed preorder cancellation */}
                        {ord.status === 'delayed' && (
                          <div className="pt-2 border-t border-rose-100 flex flex-col gap-1.5">
                            <div className="text-[11px] text-rose-700 flex items-center gap-1 font-medium">
                              <AlertTriangle size={14} />
                              <span>Đơn hàng quá hạn cam kết giao {ord.expectedDelivery}</span>
                            </div>
                            <button
                              onClick={() => handleCancelOverduePreorder(ord.id)}
                              className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition-colors shadow-xs"
                            >
                              Hủy đơn hợp lệ & Nhận hoàn 100% cọc ({formatMoney(ord.depositPaid)})
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TÀI KHOẢN (ACCOUNT, BANK & ROLE TOGGLE) */}
              {customerTab === 'account' && (
                <div className="p-4 space-y-4">
                  {/* User Profile Header */}
                  <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-900 text-white font-bold text-lg flex items-center justify-center border-2 border-emerald-700 shrink-0">
                      NA
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-stone-900 truncate">Nguyễn Văn An</h3>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                          Thành viên VIP
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">SĐT chính chủ: 0988 234 567 (Đã khóa)</p>
                      <button
                        onClick={() => {
                          setAuthStep('otp');
                          setActiveModal('auth');
                          showToast('Vui lòng xác thực OTP để đổi số điện thoại');
                        }}
                        className="text-[10px] text-emerald-700 font-semibold mt-1 hover:underline"
                      >
                        Đổi số điện thoại qua OTP mới →
                      </button>
                    </div>
                  </div>

                  {/* COD Refund Bank Account Card with Security Shield */}
                  <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-700" />
                      <h4 className="text-xs font-bold text-stone-900">Tài Khoản Nhận Hoàn Tiền Đơn COD</h4>
                    </div>

                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/60 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Ngân hàng</span>
                        <span className="font-bold text-stone-800">{refundBank.bankName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Số tài khoản</span>
                          <span className="font-mono font-bold text-stone-900 tracking-wider tabular-nums">{refundBank.accountNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Chủ tài khoản</span>
                          <span className="font-bold text-stone-900 uppercase">{refundBank.accountHolder}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-stone-500 flex items-center gap-1.5 leading-tight">
                      <Lock size={12} className="text-emerald-800 shrink-0" />
                      <span>Thông tin được mã hóa bảo mật – Chỉ bộ phận Tài chính được phép truy cập khi bồi hoàn.</span>
                    </p>
                  </div>

                  {/* Address Book Navigation Button */}
                  <button
                    onClick={() => setActiveModal('address_sheet')}
                    className="w-full bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">Sổ Địa Chỉ Giao Hàng Hà Nội</h4>
                        <p className="text-[11px] text-stone-400">{addresses.length}/10 địa chỉ đã lưu</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                  </button>

                  {/* Unified App Switch to Coop */}
                  <div className="bg-gradient-to-r from-emerald-900 to-stone-900 rounded-3xl p-4 text-white shadow-md space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Dành cho Nhà Vườn & HTX</span>
                    <h4 className="text-sm font-bold">Bạn là chủ Hợp tác xã tại Lào Cai?</h4>
                    <p className="text-xs text-stone-300">Quản lý kho hàng, duyệt đơn và theo dõi dòng tiền đối soát minh bạch.</p>
                    <button
                      onClick={() => {
                        setCurrentRole('coop');
                        showToast('Đã chuyển sang giao diện Quản lý Gian hàng / HTX');
                      }}
                      className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Store size={16} />
                      Chuyển sang Quản lý Gian hàng / HTX
                    </button>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      if (window.confirm('Xác nhận đăng xuất khỏi thiết bị này?')) {
                        setActiveModal('auth');
                        showToast('Đã đăng xuất và xóa phiên làm việc an toàn.');
                      }
                    }}
                    className="w-full bg-stone-100 text-rose-700 hover:bg-rose-50 text-xs font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Đăng xuất tài khoản
                  </button>
                </div>
              )}

              {/* CUSTOMER FIXED BOTTOM TAB BAR (Navigation Anchor) */}
              <nav aria-label="Customer Navigation" className="fixed bottom-0 left-0 right-0 max-w-[393px] mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-2 flex items-center justify-around z-40 rounded-b-[44px]">
                <button
                  onClick={() => setCustomerTab('explore')}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                    customerTab === 'explore' ? 'text-emerald-900 font-bold' : 'text-stone-400 font-medium'
                  }`}
                >
                  <Sparkles size={20} className={customerTab === 'explore' ? 'text-emerald-900' : 'text-stone-400'} />
                  <span className="text-[10px]">Khám phá</span>
                </button>

                <button
                  onClick={() => setCustomerTab('preorder')}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                    customerTab === 'preorder' ? 'text-amber-700 font-bold' : 'text-stone-400 font-medium'
                  }`}
                >
                  <Clock size={20} className={customerTab === 'preorder' ? 'text-amber-700' : 'text-stone-400'} />
                  <span className="text-[10px]">Đặt trước</span>
                </button>

                <button
                  onClick={() => setCustomerTab('orders')}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                    customerTab === 'orders' ? 'text-emerald-900 font-bold' : 'text-stone-400 font-medium'
                  }`}
                >
                  <FileText size={20} className={customerTab === 'orders' ? 'text-emerald-900' : 'text-stone-400'} />
                  <span className="text-[10px]">Đơn hàng</span>
                </button>

                <button
                  onClick={() => setCustomerTab('account')}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                    customerTab === 'account' ? 'text-emerald-900 font-bold' : 'text-stone-400 font-medium'
                  }`}
                >
                  <User size={20} className={customerTab === 'account' ? 'text-emerald-900' : 'text-stone-400'} />
                  <span className="text-[10px]">Tài khoản</span>
                </button>
              </nav>

            </div>
          )}

          {/* ----------------------------------------------------
              ROLE 2: COOPERATIVE / STORE MANAGEMENT VIEW
             ---------------------------------------------------- */}
          {currentRole === 'coop' && (
            <div className="flex flex-col flex-1 p-4 space-y-4">
              
              {/* Coop Header */}
              <div className="bg-emerald-950 text-white rounded-3xl p-4 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Kênh Quản Trị Hợp Tác Xã
                  </span>
                  <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded-md text-emerald-200">
                    Mã HTX: LC-BH-01
                  </span>
                </div>
                <h3 className="text-base font-bold">HTX Nông Nghiệp Hữu Cơ Bắc Hà</h3>
                <p className="text-xs text-stone-300">Đại diện: Vàng A Sáng • Bắc Hà, Lào Cai</p>
              </div>

              {/* Sub-nav for Coop */}
              <div className="grid grid-cols-4 gap-1 bg-stone-200/70 p-1 rounded-2xl text-[11px] font-medium">
                <button
                  onClick={() => setCoopTab('products')}
                  className={`py-2 rounded-xl transition-all ${
                    coopTab === 'products' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Sản phẩm
                </button>
                <button
                  onClick={() => setCoopTab('orders')}
                  className={`py-2 rounded-xl transition-all ${
                    coopTab === 'orders' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Đơn & Ticket
                </button>
                <button
                  onClick={() => setCoopTab('wallet')}
                  className={`py-2 rounded-xl transition-all ${
                    coopTab === 'wallet' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Ví đối soát
                </button>
                <button
                  onClick={() => setCoopTab('legal')}
                  className={`py-2 rounded-xl transition-all ${
                    coopTab === 'legal' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Hồ sơ
                </button>
              </div>

              {/* COOP TAB 1: PRODUCT ADJUSTMENT */}
              {coopTab === 'products' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                    <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Quyền tự chủ Preorder:</strong> HTX được chủ động điều chỉnh số lượng suất bán và lịch thu hái trên sản phẩm đã duyệt. Cập nhật áp dụng ngay tức thì trên App Khách hàng.
                    </span>
                  </div>

                  {products
                    .filter((p) => p.coopId === 'coop-01')
                    .map((prod) => (
                      <div key={prod.id} className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-3">
                        <div className="flex gap-3">
                          <img src={prod.image} alt={prod.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-sky-700">{prod.certType}</span>
                            <h4 className="text-xs font-bold text-stone-900 truncate">{prod.name}</h4>
                            <span className="text-xs font-extrabold text-emerald-800 tabular-nums">
                              {formatMoney(prod.price)}/{prod.unit}
                            </span>
                          </div>
                        </div>

                        {prod.isPreorder && (
                          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-stone-700">Suất mở bán Preorder:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setProducts((prev) =>
                                      prev.map((item) =>
                                        item.id === prod.id && (item.preorderStock || 0) > 10
                                          ? { ...item, preorderStock: (item.preorderStock || 0) - 5 }
                                          : item
                                      )
                                    );
                                    showToast('Đã giảm 5 suất preorder. Áp dụng ngay trên App!');
                                  }}
                                  className="w-6 h-6 rounded-md bg-stone-200 text-stone-800 flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-bold text-stone-900 tabular-nums text-sm">
                                  {prod.preorderStock}
                                </span>
                                <button
                                  onClick={() => {
                                    setProducts((prev) =>
                                      prev.map((item) =>
                                        item.id === prod.id
                                          ? { ...item, preorderStock: (item.preorderStock || 0) + 10 }
                                          : item
                                      )
                                    );
                                    showToast('Đã tăng 10 suất preorder. Áp dụng ngay trên App!');
                                  }}
                                  className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-2 border-t border-stone-200/50">
                              <span className="font-semibold text-stone-700">Ngày dự kiến giao Hà Nội:</span>
                              <input
                                type="text"
                                defaultValue={prod.deliveryDate}
                                onBlur={(e) => {
                                  setProducts((prev) =>
                                    prev.map((item) =>
                                      item.id === prod.id ? { ...item, deliveryDate: e.target.value } : item
                                    )
                                  );
                                  showToast(`Đã đổi ngày giao thành ${e.target.value}. Đồng bộ ngay lập tức!`);
                                }}
                                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 w-28 text-right font-medium"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* COOP TAB 2: ORDERS & TICKET EXPLANATION (NO CLOSE, NO REJECT REFUND) */}
              {coopTab === 'orders' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Ticket Khiếu Nại Cần Phản Hồi Giải Trình
                  </h4>

                  {tickets.map((tck) => (
                    <div key={tck.id} className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2">
                      <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                        <div>
                          <span className="text-xs font-bold text-stone-900">{tck.id}</span>
                          <span className="text-[10px] text-stone-400 block">Đơn: {tck.orderId}</span>
                        </div>
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          Chờ HTX giải trình
                        </span>
                      </div>

                      <div className="text-xs text-stone-700">
                        <span className="font-semibold block text-stone-900">Nội dung khiếu nại của khách:</span>
                        <p className="mt-0.5 italic text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-100">
                          "{tck.description}"
                        </p>
                      </div>

                      <div className="pt-2">
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          Giải trình của HTX gửi CSKH (Hệ thống bảo lưu, không đóng ticket):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Nhập thông tin kiểm tra lô hàng, khâu đóng gói tại vườn..."
                          value={tck.coopExplanation || coopResponseText}
                          onChange={(e) => setCoopResponseText(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        ></textarea>
                        <button
                          onClick={() => {
                            setTickets((prev) =>
                              prev.map((item) =>
                                item.id === tck.id ? { ...item, coopExplanation: coopResponseText } : item
                              )
                            );
                            showToast('Đã gửi bản giải trình đến Admin CSKH thẩm định!');
                          }}
                          className="mt-1.5 w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors shadow-xs"
                        >
                          Gửi giải trình cho CSKH
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* COOP TAB 3: 4-BUCKET RECONCILIATION WALLET (READ-ONLY) */}
              {coopTab === 'wallet' && (
                <div className="space-y-3">
                  {/* Top Summary Card */}
                  <div className="bg-stone-900 text-white rounded-3xl p-4 shadow-sm space-y-2">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                      Số Tiền Thực Nhận Kỳ Này (Kỳ 19/2026)
                    </span>
                    <h3 className="text-2xl font-extrabold text-emerald-400 tabular-nums">14.500.000đ</h3>
                    
                    <div className="bg-stone-800/80 rounded-2xl p-2.5 text-[10px] text-stone-300 space-y-1 font-mono border border-stone-700/60">
                      <div className="text-emerald-300 font-bold">Công thức chi trả minh bạch:</div>
                      <div>Thực nhận = Tổng tiền hàng đủ ĐK (17.500.000đ)</div>
                      <div>− Hoa hồng 5% (875.000đ)</div>
                      <div>− Tiền hoàn & phạt HTX (375.000đ)</div>
                      <div>− Khoản giữ lại kỳ này 10% (1.750.000đ)</div>
                      <div className="text-emerald-300">+ Hoàn trả khoản giữ lại từ 2 kỳ trước (+0đ)</div>
                    </div>
                  </div>

                  {/* 4 Tabs Breakdown */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-stone-800 uppercase">Sao Kê 4 Khoản Chi Tiết</h4>
                    
                    <div className="space-y-1.5">
                      {ledger
                        .filter((l) => l.coopName.includes('Bắc Hà'))
                        .map((row) => (
                          <div key={row.id} className="flex items-center justify-between py-2 border-b border-stone-100 text-xs">
                            <div>
                              <span className="font-semibold text-stone-800 block">
                                {row.type === 'goods_sale' && 'Tiền hàng đủ điều kiện'}
                                {row.type === 'commission' && 'Phí hoa hồng nền tảng (5%)'}
                                {row.type === 'shipping_fee' && 'Phí vận chuyển'}
                                {row.type === 'refund' && 'Khấu trừ hoàn tiền / phạt'}
                                {row.type === 'gateway_fee' && 'Phí cổng thanh toán'}
                              </span>
                              <span className="text-[10px] text-stone-400">{row.date} • Đơn {row.orderId}</span>
                            </div>
                            <span className={`font-bold tabular-nums ${row.amount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {row.amount > 0 ? `+${formatMoney(row.amount)}` : formatMoney(row.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* COOP TAB 4: LEGAL PROFILE (MST LOCKED) */}
              {coopTab === 'legal' && (
                <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-800 uppercase">Hồ Sơ Pháp Lý HTX</h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                      Đã Thẩm Định Hợp Lệ
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Mã số thuế (Khóa cố định vĩnh viễn)</span>
                      <div className="flex items-center gap-2 mt-0.5 bg-stone-100 px-3 py-2 rounded-xl text-stone-800 font-mono font-bold">
                        <Lock size={14} className="text-stone-500" />
                        <span>5300892144</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Tên pháp nhân HTX</span>
                      <p className="font-bold text-stone-800 mt-0.5">Hợp tác xã Nông Nghiệp Hữu Cơ Bắc Hà</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Giấy chứng nhận liên kết</span>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-xl text-[11px] font-semibold">
                          OCOP 4 Sao (2024-889)
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-[11px] font-semibold">
                          VietGAP Trồng trọt
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <button
                      onClick={() => showToast('Đã gửi yêu cầu thẩm định lại hồ sơ pháp lý lên Admin Chất lượng')}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                      Gửi yêu cầu Duyệt lại hồ sơ khi có thay đổi
                    </button>
                    <button
                      onClick={() => setCurrentRole('customer')}
                      className="w-full bg-emerald-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-800 transition-colors"
                    >
                      Quay về Giao diện Mua sắm
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ----------------------------------------------------
              ROLE 3: SHIPPER HANOI DELIVERY VIEW
             ---------------------------------------------------- */}
          {currentRole === 'shipper' && (
            <div className="flex flex-col flex-1 p-4 space-y-4">
              {/* Shipper Header */}
              <div className="bg-amber-600 text-white rounded-3xl p-4 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    Đội Vận Chuyển Hà Nội
                  </span>
                  <h3 className="text-base font-bold">Shipper: Trần Văn Mạnh</h3>
                  <p className="text-xs text-amber-100">Khu vực phân công: Nam Từ Liêm & Cầu Giấy</p>
                </div>
                <button
                  onClick={() => setActiveModal('shipper_scan')}
                  className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white"
                  title="Quét mã QR nhận túi hàng"
                >
                  <QrCode size={22} />
                </button>
              </div>

              {/* Notice */}
              <div className="bg-white rounded-2xl p-3 border border-stone-200 text-xs flex items-center justify-between">
                <span className="font-semibold text-stone-700">Đơn hàng cần giao hôm nay:</span>
                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-lg">1 đơn cần phát</span>
              </div>

              {/* Delivery Action Card */}
              {orders
                .filter((o) => o.status === 'delayed' || o.status === 'delivering')
                .slice(0, 1)
                .map((ord) => (
                  <div key={ord.id} className="bg-white rounded-3xl border border-stone-200/80 p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                      <span className="text-xs font-bold text-stone-900">{ord.id}</span>
                      <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                        {ord.houseType === 'apartment' ? '🏢 Chung cư' : '🏠 Nhà mặt đất'}
                      </span>
                    </div>

                    {/* Snapshot Address details */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-stone-400">Snapshot Địa chỉ giao cố định</span>
                      <p className="text-xs font-bold text-stone-900 leading-snug">{ord.frozenAddressSnapshot}</p>
                      <div className="flex items-center gap-2 text-xs text-stone-600 mt-1">
                        <Phone size={12} className="text-emerald-700" />
                        <span className="font-semibold">{ord.customerPhone} ({ord.customerName})</span>
                      </div>
                    </div>

                    {/* COD Collection box */}
                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-amber-800 font-semibold block">Số tiền cần thu COD:</span>
                        <span className="text-base font-extrabold text-amber-900 tabular-nums">
                          {formatMoney(ord.remainingCod)}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-white px-2 py-1 rounded-md border border-amber-200 font-medium">
                        70% giá trị + Ship
                      </span>
                    </div>

                    {/* One-touch Status Update Buttons */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block">Cập nhật trạng thái giao đơn</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setOrders((prev) =>
                              prev.map((o) => (o.id === ord.id ? { ...o, status: 'delivering' } : o))
                            );
                            showToast('Đã chuyển trạng thái: Đang giao hàng');
                          }}
                          className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                        >
                          Đang giao
                        </button>
                        <button
                          onClick={() => {
                            setOrders((prev) =>
                              prev.map((o) => (o.id === ord.id ? { ...o, status: 'completed' } : o))
                            );
                            showToast(`Giao thành công! Đã ghi nhận thu COD ${formatMoney(ord.remainingCod)}`);
                          }}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                        >
                          Thành công & Thu COD
                        </button>
                        <button
                          onClick={() => showToast('Đã hẹn giao lại vào ca chiều theo yêu cầu của khách')}
                          className="bg-stone-200 text-stone-800 hover:bg-stone-300 text-xs font-semibold py-2 rounded-xl transition-colors"
                        >
                          Hẹn giao lại
                        </button>
                        <button
                          onClick={() => showToast('Đã báo chuyển hoàn về kho trung tâm Hà Nội')}
                          className="bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-semibold py-2 rounded-xl transition-colors"
                        >
                          Chuyển hoàn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ----------------------------------------------------
              ROLE 4: REGULATOR OVERSIGHT VIEW (CQQLNN - READ-ONLY)
             ---------------------------------------------------- */}
          {currentRole === 'regulator' && (
            <div className="flex flex-col flex-1 p-4 space-y-4">
              
              {/* Regulator Shield Banner */}
              <div className="bg-sky-950 text-white rounded-3xl p-4 shadow-md space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-sky-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Cơ Quan Quản Lý Nhà Nước
                  </span>
                </div>
                <h3 className="text-base font-bold">Giám Sát Nguồn Gốc & Chất Lượng Nông Sản</h3>
                <p className="text-[11px] text-sky-200 leading-tight">
                  Chế độ Giám sát Chỉ đọc (Read-only) – Đã ẩn 100% dữ liệu cá nhân nhạy cảm của người tiêu dùng để bảo vệ quyền riêng tư.
                </p>
              </div>

              {/* 3 Large KPI Cards with Micro Visuals */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] text-stone-500 font-semibold leading-tight">HTX đang hoạt động</span>
                  <span className="text-xl font-extrabold text-stone-900 mt-2">12</span>
                  <div className="w-full bg-emerald-100 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-600 h-full w-4/5"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] text-stone-500 font-semibold leading-tight">SP có bảo chứng</span>
                  <span className="text-xl font-extrabold text-sky-700 mt-2">48</span>
                  <div className="w-full bg-sky-100 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-sky-600 h-full w-full"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <span className="text-[10px] text-stone-500 font-semibold leading-tight">Khiếu nại đang xử lý</span>
                  <span className="text-xl font-extrabold text-rose-700 mt-2">1</span>
                  <div className="w-full bg-rose-100 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-rose-500 h-full w-1/4"></div>
                  </div>
                </div>
              </div>

              {/* Anonymized Audit Inspection Feed */}
              <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase">Tra Cứu Giao Dịch & Nguồn Gốc</h4>
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-semibold">
                    Đã ẩn danh (Masked)
                  </span>
                </div>

                <div className="space-y-2">
                  {orders.map((ord) => (
                    <div key={ord.id} className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-900">{ord.id}</span>
                        <span className="text-[10px] text-emerald-800 font-semibold">
                          {ord.items[0]?.product.certType} ({ord.items[0]?.product.certNumber})
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600">
                        <span>Khách hàng: Ng*** V** A** (098****567)</span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex justify-between">
                        <span>Quận giao: {ord.district}, Hà Nội</span>
                        <span className="font-bold text-stone-800">{formatMoney(ord.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              ROLE 5: ADMIN MOBILE VIEW (4 PERMISSION GROUPS)
             ---------------------------------------------------- */}
          {currentRole === 'admin' && (
            <div className="flex flex-col flex-1 p-4 space-y-4">
              
              {/* Admin Banner & Permission Selector */}
              <div className="bg-rose-950 text-white rounded-3xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Bàn Quản Trị Tối Cao
                  </span>
                  <span className="text-[10px] bg-rose-800 px-2 py-0.5 rounded-md text-rose-200">
                    Admin Root
                  </span>
                </div>
                <h3 className="text-base font-bold">Quản Trị Viên Di Động (Admin Mobile)</h3>
                
                {/* 4 Group Selector Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-stone-900/90 p-1 rounded-2xl text-[10px] font-bold">
                  {(['operations', 'quality', 'finance', 'cskh'] as AdminSubGroup[]).map((grp) => (
                    <button
                      key={grp}
                      onClick={() => setAdminGroup(grp)}
                      className={`py-1.5 rounded-xl capitalize transition-all ${
                        adminGroup === grp
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {grp === 'operations' && 'Vận hành'}
                      {grp === 'quality' && 'Chất lượng'}
                      {grp === 'finance' && 'Tài chính'}
                      {grp === 'cskh' && 'CSKH'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-nav for Admin Mobile */}
              <div className="grid grid-cols-4 gap-1 bg-stone-200/80 p-1 rounded-2xl text-[11px] font-medium">
                <button
                  onClick={() => setAdminTab('approvals')}
                  className={`py-1.5 rounded-xl transition-all ${
                    adminTab === 'approvals' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Duyệt HTX
                </button>
                <button
                  onClick={() => setAdminTab('params')}
                  className={`py-1.5 rounded-xl transition-all ${
                    adminTab === 'params' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Tham số
                </button>
                <button
                  onClick={() => setAdminTab('ledger')}
                  className={`py-1.5 rounded-xl transition-all ${
                    adminTab === 'ledger' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Sổ cái 4 mục
                </button>
                <button
                  onClick={() => setAdminTab('tickets')}
                  className={`py-1.5 rounded-xl transition-all ${
                    adminTab === 'tickets' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-600'
                  }`}
                >
                  CSKH & Log
                </button>
              </div>

              {/* ADMIN TAB 1: COOP & PRODUCT APPROVALS */}
              {adminTab === 'approvals' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-900">Hồ Sơ HTX Mới Nộp Thẩm Định</span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-md">
                        Đang khóa chỉnh sửa
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-bold text-stone-800">HTX Dược Liệu & Cây Ăn Quả Sa Pa</p>
                      <p className="text-stone-500 text-[11px]">MST: 5300998811 • Đại diện: Má A Chơ</p>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-stone-100 text-stone-700 text-[10px] px-2 py-1 rounded-md">
                          📄 Giấy phép ĐKKD: Đầy đủ
                        </span>
                        <span className="bg-sky-50 text-sky-800 text-[10px] px-2 py-1 rounded-md font-semibold">
                          🌿 VietGAP: Còn hiệu lực
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => {
                          showToast('Đã phê duyệt! Hệ thống gửi Link/OTP kích hoạt hiệu lực 24h cho HTX tự đặt mật khẩu.');
                        }}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                      >
                        Phê duyệt HTX
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Nhập lý do từ chối hồ sơ:') || 'Giấy phép hết hạn hiệu lực';
                          showToast(`Đã từ chối hồ sơ với lý do: ${reason}`);
                        }}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold py-2 rounded-xl transition-colors"
                      >
                        Từ chối (Cần lý do)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 2: SYSTEM PARAMETERS & ACCOUNT LOCKOUT */}
              {adminTab === 'params' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-stone-900 uppercase">Cấu Hình Bậc Phụ Phí Hỏa Tốc Hà Nội</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">Khoảng cách 0 - 5 km:</span>
                        <span className="font-bold tabular-nums">20.000đ</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">Khoảng cách 5 - 10 km:</span>
                        <span className="font-bold tabular-nums">30.000đ</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">Khoảng cách 10 - 15 km:</span>
                        <span className="font-bold tabular-nums">40.000đ</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 italic">
                      Lưu ý: Thay đổi tham số chỉ áp dụng cho các đơn hàng mới tạo sau thời điểm lưu.
                    </p>
                  </div>

                  {/* Account Lock with Silent Push */}
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                      <Lock size={16} />
                      <span>Khóa Tài Khoản & Gửi Silent Push Ngắt Phiên</span>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Khóa tức thì quyền truy cập của người dùng trên toàn hệ thống (Chặn tự khóa chính Admin).
                    </p>
                    <button
                      onClick={() => {
                        setActiveModal('silent_locked');
                        showToast('Đã kích hoạt Silent Push khóa tài khoản ngay lập tức!');
                      }}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition-colors shadow-xs"
                    >
                      Kích hoạt Khóa phiên tức thời (Thử nghiệm)
                    </button>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 3: 4-BUCKET LEDGER & HTX PAYOUT */}
              {adminTab === 'ledger' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-stone-900 uppercase">Sổ Cái 4 Mục Bất Biến</h4>
                      {adminGroup === 'finance' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Quyền Tài chính
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {ledger.map((entry) => (
                        <div key={entry.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-900">{entry.id} • {entry.orderId}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                entry.status === 'matched'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.status === 'mismatched'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {entry.status === 'matched' && 'Khớp chuẩn'}
                              {entry.status === 'mismatched' && 'Lệch đối soát'}
                              {entry.status === 'adjusted' && 'Đã điều chỉnh'}
                            </span>
                          </div>

                          <div className="flex justify-between text-stone-600 text-[11px]">
                            <span>{entry.coopName}</span>
                            <span className="font-extrabold tabular-nums">
                              {entry.amount > 0 ? `+${formatMoney(entry.amount)}` : formatMoney(entry.amount)}
                            </span>
                          </div>

                          {/* Action for mismatched row: create offset entry */}
                          {entry.status === 'mismatched' && (
                            <button
                              onClick={() => {
                                setSelectedLedgerRow(entry);
                                setActiveModal('ledger_adjust');
                              }}
                              className="w-full mt-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors"
                            >
                              Tạo bút toán đảo / Bổ sung để khớp
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN TAB 4: CSKH TICKETS & IMMUTABLE AUDIT LOG */}
              {adminTab === 'tickets' && (
                <div className="space-y-3">
                  {/* Tickets to Close */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-stone-900 uppercase">Quyết Định Xử Lý & Đóng Ticket</h4>
                    {tickets.map((t) => (
                      <div key={t.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{t.id}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                            {t.status}
                          </span>
                        </div>
                        <p className="text-stone-700 italic">"{t.description}"</p>
                        {t.coopExplanation && (
                          <div className="bg-white p-2 rounded-lg border border-stone-200 text-[11px]">
                            <span className="font-bold text-emerald-800">HTX phản hồi: </span>
                            <span>{t.coopExplanation}</span>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setTickets((prev) =>
                              prev.map((item) => (item.id === t.id ? { ...item, status: 'resolved' } : item))
                            );
                            showToast('Admin CSKH đã xử lý bồi hoàn và chính thức ĐÓNG TICKET.');
                          }}
                          className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                        >
                          Duyệt bồi hoàn & Đóng Ticket
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Immutable Audit Log */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-stone-900 uppercase">Nhật Ký Thao Tác Bất Biến (Audit Log)</h4>
                    <div className="space-y-1.5">
                      {audits.map((log) => (
                        <div key={log.id} className="p-2 bg-stone-50 rounded-lg text-[11px] text-stone-700 border border-stone-100">
                          <div className="flex justify-between font-semibold text-stone-900">
                            <span>{log.action}</span>
                            <span className="text-stone-400 font-normal">{log.timestamp}</span>
                          </div>
                          <p className="text-stone-600 mt-0.5">Thực hiện bởi: {log.adminName}</p>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            <span className="line-through">{log.oldValue}</span> → <span className="font-bold text-emerald-800">{log.newValue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-stone-300 rounded-full z-50 pointer-events-none"></div>

        {/* ========================================================
            MODALS & BOTTOM SHEETS
           ======================================================== */}

        {/* 1. PRODUCT DETAIL BOTTOM SHEET */}
        {activeModal === 'product_detail' && detailProduct && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[36px] max-h-[88%] overflow-y-auto no-scrollbar p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={14} />
                    {detailProduct.certType} • Số {detailProduct.certNumber}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 mt-0.5">{detailProduct.name}</h3>
                  <span className="text-xs text-stone-500">{detailProduct.coopName} ({detailProduct.originDistrict})</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative h-44 rounded-2xl overflow-hidden border border-stone-200">
                <img src={detailProduct.image} alt={detailProduct.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => alert(`Chứng nhận ${detailProduct.certType} gốc của CQQLNN: ${detailProduct.certNumber}`)}
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                >
                  <FileBadge size={12} />
                  Xem chứng nhận gốc
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">{detailProduct.description}</p>

              {/* Preorder 2-step Payment Timeline */}
              {detailProduct.isPreorder && (
                <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Clock size={14} />
                    Lộ Trình Thanh Toán Preorder 2 Bước
                  </span>
                  <div className="space-y-1.5 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                      <span className="leading-tight">
                        <strong>Bước 1 – Cọc giữ suất (30%):</strong> Thanh toán Online ngay ({formatMoney(Math.round(detailProduct.price * 0.3 * detailQuantity))})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-300 text-stone-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                      <span className="leading-tight text-stone-600">
                        <strong>Bước 2 – Nhận hàng (70%):</strong> Tất toán COD hoặc Online khi nhận hàng tại Hà Nội ({formatMoney(Math.round(detailProduct.price * 0.7 * detailQuantity))})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-700">Số lượng ({detailProduct.unit}):</span>
                <div className="flex items-center gap-3 bg-stone-100 rounded-xl px-2 py-1">
                  <button
                    onClick={() => setDetailQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-stone-800 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-stone-900 tabular-nums w-4 text-center">{detailQuantity}</span>
                  <button
                    onClick={() => setDetailQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center text-stone-800 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  handleAddToCart(detailProduct, detailQuantity);
                  setActiveModal(null);
                }}
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                Thêm vào giỏ ({formatMoney(detailProduct.price * detailQuantity)})
              </button>
            </div>
          </div>
        )}

        {/* 2. CHECKOUT BOTTOM SHEET */}
        {activeModal === 'checkout' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[36px] max-h-[90%] overflow-y-auto no-scrollbar p-5 space-y-4 shadow-2xl">
              <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1"></div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-stone-900">Xác Nhận Giỏ Hàng & Đặt Hàng</h3>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-full text-stone-400">
                  <X size={18} />
                </button>
              </div>

              {/* Delivery Address Snapshot Preview */}
              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Địa chỉ Snapshot cố định</span>
                  <button onClick={() => setActiveModal('address_sheet')} className="text-[11px] text-emerald-700 font-semibold">
                    Đổi
                  </button>
                </div>
                <p className="text-xs font-bold text-stone-900">
                  {selectedAddress.houseType === 'apartment'
                    ? `${selectedAddress.buildingBlock} - Căn ${selectedAddress.apartmentNumber}, ${selectedAddress.buildingName}`
                    : selectedAddress.streetDetails}
                </p>
                <p className="text-[11px] text-stone-500">{selectedAddress.ward}, {selectedAddress.district}, Hà Nội</p>
              </div>

              {/* Shipping Method Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-700">Phương thức giao hàng tại Hà Nội:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShippingType('standard')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      shippingType === 'standard'
                        ? 'border-emerald-700 bg-emerald-50/60 font-bold text-emerald-950'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <span>Giao Tiêu Chuẩn</span>
                    <span className="block text-[11px] text-stone-500 font-normal">Trong 24-48h (25.000đ)</span>
                  </button>
                  <button
                    onClick={() => setShippingType('express')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      shippingType === 'express'
                        ? 'border-emerald-700 bg-emerald-50/60 font-bold text-emerald-950'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <span className="text-amber-800 font-bold">⚡ Giao Hỏa Tốc GPS</span>
                    <span className="block text-[11px] text-stone-500 font-normal">Bậc 6.8km: 30.000đ</span>
                  </button>
                </div>
              </div>

              {/* Items in Cart */}
              <div className="space-y-2 border-t border-stone-100 pt-3">
                <span className="text-xs font-semibold text-stone-700">Sản phẩm trong giỏ ({cart.length}):</span>
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs">
                    <span className="text-stone-800">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {formatMoney(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tiền hàng:</span>
                  <span className="tabular-nums font-medium">{formatMoney(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Phí vận chuyển Hà Nội:</span>
                  <span className="tabular-nums font-medium">{formatMoney(shippingFee)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Mã ưu đãi (LAOCAI10):</span>
                    <span className="tabular-nums">-{formatMoney(voucherDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-900 font-extrabold text-sm pt-2 border-t border-stone-200">
                  <span>Tổng thanh toán:</span>
                  <span className="tabular-nums text-emerald-900">{formatMoney(cartSubtotal + shippingFee - voucherDiscount)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    showToast('Giỏ hàng đang trống!');
                    return;
                  }
                  const newOrd: Order = {
                    id: `LCA-${Math.floor(10000 + Math.random() * 90000)}`,
                    createdAt: '13/10/2026',
                    customerName: 'Nguyễn Văn An',
                    customerPhone: '0988 234 567',
                    items: cart.map((c) => ({ product: c.product, quantity: c.quantity, unitPrice: c.product.price })),
                    totalItemAmount: cartSubtotal,
                    shippingFee: shippingFee,
                    voucherDiscount: voucherDiscount,
                    totalAmount: cartSubtotal + shippingFee - voucherDiscount,
                    depositPaid: Math.round(cartSubtotal * 0.3),
                    remainingCod: (cartSubtotal + shippingFee - voucherDiscount) - Math.round(cartSubtotal * 0.3),
                    shippingMethod: shippingType,
                    frozenAddressSnapshot: `${selectedAddress.buildingBlock || selectedAddress.streetDetails}, ${selectedAddress.district}, Hà Nội`,
                    houseType: selectedAddress.houseType,
                    district: selectedAddress.district,
                    status: 'confirmed',
                    expectedDelivery: '18/10/2026',
                    isPreorder: true
                  };
                  setOrders((prev) => [newOrd, ...prev]);
                  setCart([]);
                  setActiveModal(null);
                  setCustomerTab('orders');
                  showToast('Đặt hàng thành công! Đã thanh toán cọc 30% bảo chứng.');
                }}
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow-md transition-colors"
              >
                Xác nhận đặt hàng & Thanh toán
              </button>
            </div>
          </div>
        )}

        {/* 3. ADDRESS BOOK & GPS SHEET */}
        {activeModal === 'address_sheet' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[36px] max-h-[85%] overflow-y-auto no-scrollbar p-5 space-y-4 shadow-2xl">
              <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1"></div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Sổ Địa Chỉ Giao Hàng Hà Nội</h3>
                  <p className="text-[11px] text-stone-500">Tối đa 10 địa chỉ • Phục vụ địa bàn TP. Hà Nội</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 rounded-full text-stone-400">
                  <X size={18} />
                </button>
              </div>

              {/* List of saved addresses */}
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setActiveModal(null);
                      showToast(`Đã chọn giao đến: ${addr.district}, Hà Nội`);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddress.id === addr.id
                        ? 'border-emerald-700 bg-emerald-50/50 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900">{addr.title}</span>
                        {addr.isDefault && (
                          <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-md font-semibold">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 font-semibold">
                        {addr.houseType === 'apartment' ? '🏢 Chung cư' : '🏠 Mặt đất'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-800 font-medium mt-1">
                      {addr.houseType === 'apartment'
                        ? `${addr.buildingBlock} - Căn ${addr.apartmentNumber}, ${addr.buildingName}`
                        : addr.streetDetails}
                    </p>
                    <p className="text-[11px] text-stone-500">{addr.ward}, {addr.district}, {addr.city}</p>
                  </div>
                ))}
              </div>

              {/* Add New Address Button */}
              <button
                onClick={() => setActiveModal('new_address')}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={16} />
                Thêm địa chỉ mới tại Hà Nội
              </button>
            </div>
          </div>
        )}

        {/* 4. NEW ADDRESS FORM WITH GPS LOCATION */}
        {activeModal === 'new_address' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[36px] max-h-[92%] overflow-y-auto no-scrollbar p-5 space-y-3.5 shadow-2xl">
              <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1"></div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-stone-900">Thêm Địa Chỉ Giao Hàng</h3>
                <button onClick={() => setActiveModal('address_sheet')} className="p-1 text-stone-400">
                  <X size={18} />
                </button>
              </div>

              {/* GPS Instant Locate Button (<3s) */}
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Định vị vệ tinh GPS</span>
                  <span className="text-[10px] text-emerald-800">Tự động điền tọa độ chính xác &lt; 3 giây</span>
                </div>
                <button
                  onClick={() => {
                    showToast('Đã lấy tọa độ GPS: 21.0285° N, 105.8542° E (Cầu Giấy, Hà Nội)');
                  }}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <Navigation size={12} />
                  Lấy vị trí GPS
                </button>
              </div>

              {/* City Selection (Hanoi validation notice) */}
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Tỉnh / Thành Phố:</label>
                <select
                  defaultValue="Hà Nội"
                  onChange={(e) => {
                    if (e.target.value !== 'Hà Nội') {
                      alert('Giai đoạn 1 ứng dụng chỉ phục vụ giao hàng trong địa bàn TP. Hà Nội');
                      e.target.value = 'Hà Nội';
                    }
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-stone-900 focus:outline-none"
                >
                  <option value="Hà Nội">Thành phố Hà Nội</option>
                  <option value="Khác">Tỉnh thành khác (Chưa hỗ trợ)</option>
                </select>
              </div>

              {/* District & Ward */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">Quận / Huyện:</label>
                  <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900">
                    {HANOI_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">Phường / Xã:</label>
                  <input
                    type="text"
                    placeholder="VD: Dịch Vọng Hậu"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Segmented Control for Housing Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 block">Loại hình nhà ở:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="py-2 rounded-xl text-xs font-bold border border-emerald-700 bg-emerald-50 text-emerald-950 flex items-center justify-center gap-1.5"
                  >
                    🏢 Chung cư
                  </button>
                  <button
                    type="button"
                    className="py-2 rounded-xl text-xs font-semibold border border-stone-200 bg-white text-stone-600 flex items-center justify-center gap-1.5"
                  >
                    🏠 Nhà mặt đất
                  </button>
                </div>
              </div>

              {/* Apartment details */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Tên Tòa (VD: S2.05)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Mã Căn (1508)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              {/* Save Address Button */}
              <button
                onClick={() => {
                  const newAddr: Address = {
                    id: `addr-${Date.now()}`,
                    title: 'Địa chỉ mới thêm',
                    receiverName: 'Nguyễn Văn An',
                    receiverPhone: '0988 234 567',
                    houseType: 'apartment',
                    buildingName: 'KĐT Vinhomes Smart City',
                    buildingBlock: 'S2.05',
                    apartmentNumber: '1508',
                    district: 'Cầu Giấy',
                    ward: 'Dịch Vọng Hậu',
                    city: 'Hà Nội',
                    isDefault: false,
                    lat: 21.0285,
                    lng: 105.8542
                  };
                  setAddresses((prev) => [...prev, newAddr]);
                  setSelectedAddress(newAddr);
                  setActiveModal('address_sheet');
                  showToast('Đã lưu địa chỉ mới vào sổ địa chỉ Hà Nội!');
                }}
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3 rounded-2xl shadow-sm transition-colors"
              >
                Lưu địa chỉ giao hàng
              </button>
            </div>
          </div>
        )}

        {/* 5. TICKET COMPLAINT FORM WITH IMAGE UPLOAD */}
        {activeModal === 'ticket_form' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[36px] max-h-[90%] overflow-y-auto no-scrollbar p-5 space-y-3.5 shadow-2xl">
              <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1"></div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-stone-900">Gửi Khiếu Nại Chất Lượng Nông Sản</h3>
                <button onClick={() => setActiveModal(null)} className="p-1 text-stone-400">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Chọn đơn hàng khiếu nại:</label>
                <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900">
                  <option value="LCA-65910">LCA-65910 • Mận Tam Hoa Bắc Hà</option>
                  <option value="LCA-88219">LCA-88219 • Cá Hồi Vân Sa Pa</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Vấn đề gặp phải:</label>
                <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900">
                  <option value="damaged_fruit">Quả bị giập nát / Hư hại do vận chuyển</option>
                  <option value="wrong_weight">Sai trọng lượng so với bao bì</option>
                  <option value="packaging_torn">Bao bì rách hỏng niêm phong</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Mô tả chi tiết:</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả tình trạng nông sản khi bóc kiện hàng..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                ></textarea>
              </div>

              {/* Evidence Photo Upload Mock */}
              <div className="border-2 border-dashed border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center text-stone-400 hover:border-emerald-700 cursor-pointer">
                <Camera size={24} className="text-emerald-800 mb-1" />
                <span className="text-xs font-semibold text-stone-700">Tải ảnh chụp minh chứng tại chỗ</span>
                <span className="text-[10px] text-stone-400">Chụp rõ tem mác và vết giập quả</span>
              </div>

              <button
                onClick={() => {
                  setActiveModal(null);
                  showToast('Đã tạo Ticket khiếu nại! CSKH và HTX sẽ xử lý bồi hoàn trong 24h.');
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
              >
                Gửi yêu cầu bồi hoàn
              </button>
            </div>
          </div>
        )}

        {/* 6. AUTHENTICATION & LOGIN MODAL */}
        {activeModal === 'auth' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[36px] max-h-[92%] overflow-y-auto no-scrollbar p-5 space-y-4 shadow-2xl">
              <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900">Đặc Sản Số Lào Cai</span>
                <button onClick={() => setActiveModal(null)} className="p-1 text-stone-400">
                  <X size={18} />
                </button>
              </div>

              {/* Login View */}
              {authStep === 'login' && (
                <div className="space-y-3.5">
                  <div className="text-center">
                    <h3 className="text-base font-bold text-stone-900">Đăng Nhập Tài Khoản</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Tinh hoa Đặc sản Lào Cai – Giao tươi tận cửa tại Hà Nội</p>
                  </div>

                  {/* 15-minute lockout indicator if failed 5 times */}
                  {lockCountdown > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-rose-800 text-xs text-center space-y-1">
                      <AlertTriangle size={18} className="mx-auto text-rose-600" />
                      <span className="font-bold block">Tài khoản bị tạm khóa 15 phút</span>
                      <span className="text-[11px] font-mono tabular-nums">
                        Vui lòng thử lại sau: {Math.floor(lockCountdown / 60)}:{(lockCountdown % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-900"
                    />
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Mật khẩu"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-900"
                    />
                  </div>

                  {/* Biometric Face ID Button */}
                  <div className="flex justify-center py-1">
                    <button
                      onClick={triggerFaceIDLogin}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all border border-stone-200"
                    >
                      <ScanFace size={18} className="text-emerald-700" />
                      <span>Đăng nhập bằng Face ID / Vân tay</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (authPassword !== 'LaoCai@2026') {
                        setFailedLoginAttempts((p) => p + 1);
                        if (failedLoginAttempts >= 4) {
                          setLockCountdown(900); // 15 minutes
                          showToast('Đã nhập sai 5 lần. Tạm khóa đăng nhập 15 phút.');
                        } else {
                          showToast('Số điện thoại hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
                        }
                        return;
                      }
                      setActiveModal(null);
                      showToast('Đăng nhập thành công!');
                    }}
                    className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
                  >
                    Đăng Nhập
                  </button>

                  {/* Simulation Quick-Test Bar */}
                  <div className="pt-2 border-t border-stone-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block text-center">Kiểm thử kịch bản bảo mật:</span>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <button
                        onClick={() => showToast('Số điện thoại hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.')}
                        className="bg-stone-100 p-1.5 rounded-lg text-stone-700 font-medium"
                      >
                        Thử sai MK
                      </button>
                      <button
                        onClick={() => {
                          setLockCountdown(900);
                          showToast('Đã khóa đăng nhập 15 phút.');
                        }}
                        className="bg-stone-100 p-1.5 rounded-lg text-rose-700 font-medium"
                      >
                        Khóa 15 phút
                      </button>
                      <button
                        onClick={() => setActiveModal('silent_locked')}
                        className="bg-stone-100 p-1.5 rounded-lg text-rose-800 font-bold"
                      >
                        Silent Push Khóa
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-stone-500 pt-1">
                    <button onClick={() => setAuthStep('otp')} className="hover:underline">
                      Đăng nhập qua OTP
                    </button>
                    <button onClick={() => setAuthStep('register')} className="text-emerald-800 font-bold hover:underline">
                      Đăng ký tài khoản mới
                    </button>
                  </div>
                </div>
              )}

              {/* OTP View */}
              {authStep === 'otp' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-base font-bold text-stone-900">Xác Thực Mã OTP 6 Số</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Mã OTP đã gửi về số {authPhone}</p>
                    <span className="text-xs font-mono font-bold text-emerald-800 tabular-nums">
                      Hiệu lực còn: {otpTimer}s
                    </span>
                  </div>

                  {/* iOS QuickType autofill bar */}
                  <button
                    onClick={() => {
                      setOtpValue(['6', '8', '2', '9', '1', '0']);
                      showToast('Đã tự điền mã OTP từ tin nhắn hệ thống');
                    }}
                    className="w-full bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl p-2 text-xs text-stone-700 flex items-center justify-center gap-1.5 font-medium transition-colors"
                  >
                    <span>Từ Tin nhắn:</span>
                    <strong className="text-emerald-900">Mã OTP là 682910</strong>
                    <span className="text-[10px] text-stone-400">(Chạm để điền)</span>
                  </button>

                  {/* 6 Digit Input Boxes */}
                  <div className="flex justify-center gap-2">
                    {otpValue.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        readOnly
                        className="w-11 h-12 text-center text-lg font-bold border border-stone-300 rounded-xl bg-stone-50 text-stone-900"
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setActiveModal(null);
                      showToast('Xác thực OTP thành công! Chào mừng bạn.');
                    }}
                    className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
                  >
                    Xác Nhận & Tiếp Tục
                  </button>
                </div>
              )}

              {/* Register View */}
              {authStep === 'register' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-medium">
                    <button
                      onClick={() => setRegisterType('customer')}
                      className={`py-1.5 rounded-xl ${registerType === 'customer' ? 'bg-white font-bold shadow-xs' : 'text-stone-500'}`}
                    >
                      Khách hàng
                    </button>
                    <button
                      onClick={() => setRegisterType('coop')}
                      className={`py-1.5 rounded-xl ${registerType === 'coop' ? 'bg-white font-bold shadow-xs' : 'text-stone-500'}`}
                    >
                      Đối tác HTX
                    </button>
                  </div>

                  {registerType === 'customer' ? (
                    <div className="space-y-2">
                      <input type="text" placeholder="Họ và tên" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
                      <input type="tel" placeholder="Số điện thoại" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
                      <input type="password" placeholder="Mật khẩu (8-32 ký tự, hoa, thường, số, ký tự đặc biệt)" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <input type="checkbox" defaultChecked className="rounded text-emerald-800" />
                        <span>Đồng ý với quy chế bảo chứng nguồn gốc</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input type="text" placeholder="Mã số thuế HTX (Kiểm tra duy nhất)" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono" />
                      <input type="text" placeholder="Tên Hợp tác xã" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border border-dashed border-stone-300 rounded-xl p-2 text-center text-[10px] text-stone-500 cursor-pointer">
                          📷 Chụp Giấy phép KD
                        </div>
                        <div className="border border-dashed border-stone-300 rounded-xl p-2 text-center text-[10px] text-stone-500 cursor-pointer">
                          📷 Chụp OCOP/VietGAP
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setAuthStep('otp');
                      showToast('Mã OTP xác thực đã được gửi về số điện thoại.');
                    }}
                    className="w-full bg-emerald-900 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
                  >
                    Đăng Ký & Nhận OTP
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. SILENT PUSH ACCOUNT LOCKED FULLSCREEN MODAL */}
        {activeModal === 'silent_locked' && (
          <div className="absolute inset-0 bg-stone-900/95 backdrop-blur-md z-50 flex flex-col justify-center items-center p-6 text-center text-white">
            <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
              <Lock size={32} />
            </div>

            <h3 className="text-lg font-bold">Tài Khoản Đã Bị Khóa Truy Cập</h3>
            <p className="text-xs text-stone-300 mt-2 leading-relaxed">
              Lý do khóa từ Cơ quan Quản trị:
            </p>
            <div className="bg-stone-800/90 rounded-2xl p-3 border border-stone-700 text-xs text-rose-300 font-medium my-3">
              "{accountLockReason}"
            </div>
            <p className="text-[11px] text-stone-400 mb-6">
              Phiên đăng nhập trên thiết bị này đã bị hủy bỏ để đảm bảo an toàn giao dịch.
            </p>

            <a
              href="tel:19006868"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg mb-2"
            >
              <Phone size={16} />
              Hotline Hỗ Trợ CSKH: 1900 6868
            </a>

            <button
              onClick={() => setActiveModal(null)}
              className="text-xs text-stone-400 hover:text-white underline mt-2"
            >
              Đóng màn hình thông báo (Mở khóa thử nghiệm)
            </button>
          </div>
        )}

        {/* 8. FACE ID SCANNING ANIMATION MODAL */}
        {activeModal === 'face_id_scan' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6">
            <div className="relative w-36 h-36 border-2 border-emerald-500/60 rounded-3xl flex items-center justify-center overflow-hidden mb-4">
              <ScanFace size={72} className="text-emerald-400 animate-pulse" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-scanline"></div>
            </div>
            <span className="text-sm font-bold tracking-wide">Đang quét Face ID Apple...</span>
            <span className="text-xs text-stone-400 mt-1">Giữ khuôn mặt trong khung hình</span>
          </div>
        )}

        {/* 9. RECONCILIATION OFFSET ENTRY MODAL */}
        {activeModal === 'ledger_adjust' && selectedLedgerRow && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[36px] max-h-[85%] overflow-y-auto no-scrollbar p-5 space-y-3.5 shadow-2xl">
              <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-1"></div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-stone-900">Tạo Bút Toán Điều Chỉnh Sổ Cái</h3>
                <button onClick={() => setActiveModal(null)} className="p-1 text-stone-400">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 text-xs space-y-1">
                <span className="font-bold text-stone-800">Dòng gốc bất biến: {selectedLedgerRow.id}</span>
                <p className="text-stone-600">Đơn: {selectedLedgerRow.orderId} • {selectedLedgerRow.coopName}</p>
                <p className="text-rose-700 font-bold">Chênh lệch: {formatMoney(selectedLedgerRow.amount)}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Nguyên nhân lệch đối soát:</label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Nhập căn cứ xử lý bút toán đảo / bồi hoàn..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="py-2 text-[10px] font-bold rounded-xl border border-emerald-700 bg-emerald-50 text-emerald-950"
                >
                  HTX chịu
                </button>
                <button
                  type="button"
                  className="py-2 text-[10px] font-semibold rounded-xl border border-stone-200 text-stone-600"
                >
                  ĐVVC chịu
                </button>
                <button
                  type="button"
                  className="py-2 text-[10px] font-semibold rounded-xl border border-stone-200 text-stone-600"
                >
                  Hệ thống chịu
                </button>
              </div>

              <button
                onClick={() => {
                  setLedger((prev) =>
                    prev.map((item) =>
                      item.id === selectedLedgerRow.id
                        ? { ...item, status: 'adjusted', notes: adjustReason || 'Đã tạo bút toán bù trừ' }
                        : item
                    )
                  );
                  setActiveModal(null);
                  showToast('Đã tạo bút toán điều chỉnh bổ sung, trạng thái chuyển sang ĐÃ ĐIỀU CHỈNH.');
                }}
                className="w-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
              >
                Ghi nhận Bút Toán Bổ Sung
              </button>
            </div>
          </div>
        )}

        {/* 10. SHIPPER QR SCANNER MODAL */}
        {activeModal === 'shipper_scan' && (
          <div className="absolute inset-0 bg-stone-950 z-50 flex flex-col justify-between p-6 text-white text-center">
            <div className="flex justify-between items-center pt-4">
              <span className="text-xs font-bold uppercase text-amber-400">Máy Quét QR Nông Sản</span>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full bg-white/20">
                <X size={18} />
              </button>
            </div>

            <div className="my-auto flex flex-col items-center">
              <div className="relative w-64 h-64 border-2 border-dashed border-amber-400 rounded-3xl flex items-center justify-center p-4">
                <div className="w-full h-full bg-stone-900/50 rounded-2xl flex items-center justify-center">
                  <QrCode size={120} className="text-amber-400/80" />
                </div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 animate-scanline"></div>
              </div>
              <p className="text-xs text-stone-300 mt-4">
                Đưa mã QR trên túi hàng nông sản Lào Cai vào khung để nhận đơn giao
              </p>
            </div>

            <button
              onClick={() => {
                setActiveModal(null);
                showToast('Đã quét nhận túi hàng mã LC-BAG-88219 (Cá Hồi Sa Pa)');
              }}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-3.5 rounded-2xl shadow-lg"
            >
              Mô phỏng Quét thành công
            </button>
          </div>
        )}

        {/* FLOATING TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] bg-stone-900/95 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl z-50 flex items-center gap-2 border border-stone-800 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="line-clamp-2 leading-tight">{toastMessage}</span>
          </div>
        )}

      </main>
    </div>
  );
}
