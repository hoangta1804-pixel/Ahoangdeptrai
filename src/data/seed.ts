/**
 * Dữ liệu mẫu ban đầu (chuyển nguyên từ src/App.tsx cũ).
 * Nội dung sẽ được thay theo danh mục của nhóm ở Giai đoạn 5 (mục 9).
 */
import type { Address, AuditLog, LedgerEntry, Order, Product, RefundBank, Ticket } from '../domain/types';

export const INITIAL_PRODUCTS: Product[] = [
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
export const INITIAL_ADDRESSES: Address[] = [
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
export const INITIAL_ORDERS: Order[] = [
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
export const INITIAL_TICKETS: Ticket[] = [
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
export const INITIAL_LEDGER: LedgerEntry[] = [
  { id: 'LED-001', type: 'goods_sale', amount: 170000, orderId: 'LCA-65910', coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà', date: '10/10/2026', status: 'matched' },
  { id: 'LED-002', type: 'commission', amount: -8500, orderId: 'LCA-65910', coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà', date: '10/10/2026', status: 'matched' },
  { id: 'LED-003', type: 'shipping_fee', amount: -25000, orderId: 'LCA-65910', coopName: 'HTX Nông Nghiệp Hữu Cơ Bắc Hà', date: '10/10/2026', status: 'matched' },
  { id: 'LED-004', type: 'refund', amount: -51000, orderId: 'LCA-88219', coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa', date: '12/10/2026', status: 'mismatched', bearer: 'HTX', notes: 'Chênh lệch hoàn tiền hủy đơn quá hạn' },
  { id: 'LED-005', type: 'gateway_fee', amount: -4200, orderId: 'LCA-88219', coopName: 'HTX Nuôi Thủy Sản Nước Lạnh Sa Pa', date: '11/10/2026', status: 'matched' }
];

// Initial Audit Logs
export const INITIAL_AUDITS: AuditLog[] = [
  { id: 'AUD-01', timestamp: '13/10/2026 09:15', adminName: 'Lê Hoàng (Admin Tài chính)', action: 'Duyệt bảng kê kỳ 19', target: 'HTX Bắc Hà', oldValue: 'Chờ duyệt', newValue: 'Đã duyệt chi 14.500.000đ' },
  { id: 'AUD-02', timestamp: '12/10/2026 16:40', adminName: 'Nguyễn Mai (Admin Vận hành)', action: 'Cập nhật phụ phí hỏa tốc', target: 'Bậc 5-10km', oldValue: '25.000đ', newValue: '30.000đ' },
  { id: 'AUD-03', timestamp: '11/10/2026 10:20', adminName: 'Trần Vũ (Admin CSKH)', action: 'Đóng Ticket khiếu nại', target: 'TCK-2026-079', oldValue: 'Đang điều tra', newValue: 'Đã bồi hoàn 100%' }
];

// Hanoi Districts
export const HANOI_DISTRICTS = [
  'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
  'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Nam Từ Liêm',
  'Bắc Từ Liêm', 'Hà Đông'
];

export const INITIAL_REFUND_BANK: RefundBank = {
  bankName: 'Ngân hàng TMCP Ngoại Thương VN (Vietcombank)',
  accountNumber: '1023847599',
  accountHolder: 'NGUYEN VAN AN',
};
