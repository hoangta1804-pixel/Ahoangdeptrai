import React, { useState } from 'react';
import { useAuth } from '../stores/authStore';
import { useOrders } from '../stores/orderStore';
import { useCart } from '../stores/cartStore';
import { Product, Variant } from '../mock/types';
import { formatMoney } from '../lib/pricing';
import { checkCanAddToCart } from '../lib/stock';
import { Button } from '../components/ui/Button';
import {
  User,
  MapPin,
  Package,
  Heart,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export interface AccountScreenProps {
  products: Product[];
  onOpenProductDetail: (product: Product) => void;
  onTrackOrder: (groupId: string) => void;
  onNavigateHome: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  products,
  onOpenProductDetail,
  onTrackOrder,
  onNavigateHome,
}) => {
  const { user, persona, logout } = useAuth();
  const { orderGroups: allOrderGroups } = useOrders();
  // Chỉ hiện đơn của tài khoản đang đăng nhập
  const orderGroups = allOrderGroups.filter((g) => user && g.userId === user.id);
  const { addToCart, setCartOpen } = useCart();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'favorites'>('orders');
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  // Lọc sản phẩm yêu thích
  const favoriteProducts = products.filter((p) =>
    user?.favoriteProductIds.includes(p.id)
  );

  // Xử lý Mua lại (FR-MHTT-17): một chạm thêm lại vào giỏ các món còn bán theo giá hiện tại
  const handleReorder = (orderGroup: any) => {
    let addedCount = 0;
    let skippedCount = 0;

    orderGroup.orders.forEach((child: any) => {
      child.items.forEach((item: any) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod || prod.status !== 'active') {
          skippedCount++;
          return;
        }
        const variant = prod.variants.find((v) => v.id === item.variantId);
        if (!variant || (variant.stock <= 0 && variant.status !== 'preorder')) {
          skippedCount++;
          return;
        }

        const res = addToCart(prod, variant, item.quantity);
        if (res.success) {
          addedCount++;
        } else {
          skippedCount++;
        }
      });
    });

    if (skippedCount > 0) {
      setReorderNotice(
        `Đã thêm lại ${addedCount} món vào giỏ hàng. ${skippedCount} món tạm hết hàng hoặc đã ngừng bán đã được bỏ qua.`
      );
    } else {
      setReorderNotice(`Đã thêm lại toàn bộ ${addedCount} món vào giỏ hàng!`);
    }

    setCartOpen(true);
    setTimeout(() => setReorderNotice(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1B1B1F] py-8 px-4 lg:px-8 pb-24">
      <main className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card Header */}
        <div className="p-6 bg-white rounded-3xl border border-[#E7DFCF] shadow-xs flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#35705A] text-[#CDA25A] flex items-center justify-center font-serif text-2xl font-bold shadow-md">
            {user ? user.name[0] : 'K'}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h1 className="font-serif text-2xl font-bold text-[#35705A]">
              {user ? user.name : 'Khách vãng lai'}
            </h1>
            <p className="text-small text-[#6B4A32]">
              {user ? `Số điện thoại: ${user.phone}` : 'Chưa đăng nhập'}
            </p>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => {
                logout();
                onNavigateHome();
              }}
              className="min-h-[44px] px-4 rounded-full border border-[#E7DFCF] text-small font-semibold text-[#35705A] hover:bg-[#F3EEE2] cursor-pointer"
            >
              Đăng xuất
            </button>
          )}
        </div>

        {/* Thông báo mua lại nếu có */}
        {reorderNotice && (
          <div className="p-3.5 bg-[#EAF4EE] text-[#2F6B4F] text-small rounded-2xl border border-[#2F6B4F]/30 font-medium">
            {reorderNotice}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E7DFCF] text-small font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-b-2 border-[#B8893B] text-[#B8893B]'
                : 'text-[#8F6A4D] hover:text-[#35705A]'
            }`}
          >
            <Package size={17} />
            <span>Lịch sử đơn hàng ({orderGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 px-4 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'addresses'
                ? 'border-b-2 border-[#B8893B] text-[#B8893B]'
                : 'text-[#8F6A4D] hover:text-[#35705A]'
            }`}
          >
            <MapPin size={17} />
            <span>Sổ địa chỉ Hà Nội ({user?.addresses.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`pb-3 px-4 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'favorites'
                ? 'border-b-2 border-[#B8893B] text-[#B8893B]'
                : 'text-[#8F6A4D] hover:text-[#35705A]'
            }`}
          >
            <Heart size={17} />
            <span>Đặc sản yêu thích ({favoriteProducts.length})</span>
          </button>
        </div>

        {/* TAB 1: DANH SÁCH ĐƠN HÀNG */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orderGroups.length > 0 ? (
              orderGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-5 bg-white rounded-3xl border border-[#E7DFCF] shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E7DFCF]">
                    <div>
                      <span className="text-caption font-mono font-bold text-[#8F6A4D]">
                        MÃ: {group.orderGroupCode}
                      </span>
                      <div className="text-small text-[#6B4A32]">
                        Đặt ngày {new Date(group.createdAt).toLocaleDateString('vi-VN')} ·{' '}
                        {group.orders.length} kiện đơn con
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {group.paymentStatus === 'paid' ? (
                        <span className="px-3 py-1 rounded-full bg-[#EAF4EE] text-[#2F6B4F] text-caption font-semibold">
                          Đã thanh toán
                        </span>
                      ) : group.paymentStatus === 'timeout_cancelled' ? (
                        <span className="px-3 py-1 rounded-full bg-[#FDF1F1] text-[#A63D3D] text-caption font-semibold">
                          Đã hủy
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-[#FEF7EA] text-[#B7791F] text-caption font-semibold">
                          Chờ thanh toán
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Danh sách kiện đơn con */}
                  <div className="space-y-2">
                    {group.orders.map((child) => (
                      <div
                        key={child.id}
                        className="p-3 bg-[#FAF7F0] rounded-xl flex items-center justify-between text-small"
                      >
                        <div>
                          <strong className="block text-[#1B1B1F]">{child.supplierName}</strong>
                          <span className="text-caption text-[#8F6A4D]">
                            {child.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                          </span>
                        </div>
                        <span className="price-tag text-small font-semibold">
                          {formatMoney(child.subtotal + child.shippingFee)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-small">
                      <span className="text-[#6B4A32]">Tổng tiền: </span>
                      <strong className="price-tag text-lg">
                        {formatMoney(group.payNowTotal + group.payOnDeliveryTotal)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Nút Mua lại (FR-MHTT-17) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(group)}
                        leftIcon={<RotateCcw size={14} />}
                      >
                        Mua lại đơn này
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onTrackOrder(group.id)}
                        rightIcon={<ExternalLink size={14} />}
                      >
                        Theo dõi chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-3 bg-white rounded-3xl border border-[#E7DFCF] p-6">
                <Package size={36} className="mx-auto text-[#8F6A4D]" />
                <h3 className="font-serif text-lg font-bold">Chưa có đơn hàng nào</h3>
                <p className="text-small text-[#6B4A32]">Khám phá các thức quà đặc sản ngay hôm nay.</p>
                <Button variant="primary" size="sm" onClick={onNavigateHome}>
                  Khám phá đặc sản
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SỔ ĐỊA CHỈ */}
        {activeTab === 'addresses' && (
          <div className="space-y-3">
            {user?.addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 bg-white rounded-2xl border border-[#E7DFCF] flex items-start justify-between"
              >
                <div className="space-y-1 text-small">
                  <div className="flex items-center gap-2">
                    <strong className="font-serif text-base">{addr.recipientName}</strong>
                    <span className="font-mono text-[#8F6A4D]">({addr.phone})</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-[#B8893B] text-[#2F6650] text-xs font-bold">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-[#6B4A32]">
                    {addr.street}, {addr.ward}, {addr.district}, {addr.city}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ĐẶC SẢN YÊU THÍCH */}
        {activeTab === 'favorites' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {favoriteProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onOpenProductDetail(p)}
                className="p-3 bg-white rounded-2xl border border-[#E7DFCF] hover:border-[#B8893B] cursor-pointer"
              >
                <div className="aspect-[4/5] rounded-xl bg-[#FAF7F0] flex items-center justify-center text-3xl mb-2">
                  🏔️
                </div>
                <h4 className="font-serif font-bold text-small truncate">{p.name}</h4>
                <div className="price-tag text-small mt-1">
                  {formatMoney(p.variants[0]?.price || 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
