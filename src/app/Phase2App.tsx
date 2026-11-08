import React, { useState, useEffect, useMemo } from 'react';
import { mockProducts as initialMockProducts } from '../mock/products';
import { mockSuppliers } from '../mock/suppliers';
import { Product, Variant, MediaItem, ThemeId, OrderGroup } from '../mock/types';
import { useCart } from '../stores/cartStore';
import { useBuyNow } from '../stores/buyNowStore';
import { useAuth, UserPersona } from '../stores/authStore';
import { useOrders } from '../stores/orderStore';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { Footer } from '../components/layout/Footer';
import { Toast, ToastMessage } from '../components/ui/Toast';
import { FloatingCart } from '../components/cart/FloatingCart';
import { QuickAddSheet } from '../components/product/QuickAddSheet';
import { HomePage } from '../screens/HomePage';
import { CatalogPage } from '../screens/CatalogPage';
import { ProductDetailPage } from '../components/product/ProductDetailPage';
import { CheckoutOnePage } from '../components/checkout/CheckoutOnePage';
import { OrderConfirmationPage } from '../components/checkout/OrderConfirmationPage';
import { AccountScreen } from '../screens/AccountScreen';
import { OrderTrackingPage } from '../screens/OrderTrackingPage';
import { TraceabilityPage } from '../screens/TraceabilityPage';
import { MediaManager } from '../components/admin/MediaManager';
import { AboutPage, StoriesPage, PolicyPage } from '../screens/ContentPages';
import { RegionsPage, ProducersPage } from '../screens/DirectoryPages';
import { registerNavigate } from '../lib/nav';
import { useScrollReveal } from './useScrollReveal';
import { SiteIntro } from '../components/layout/SiteIntro';
import { AuthPage } from '../screens/AuthPage';
import { track } from '../lib/analytics';
import { checkCanAddToCart } from '../lib/stock';

export function Phase2App() {
  useScrollReveal();
  const [products, setProducts] = useState<Product[]>(initialMockProducts);

  // Sản phẩm do Admin quản lý trên máy chủ; lỗi mạng thì giữ danh sách mẫu ban đầu.
  // Gọi không kèm đăng nhập để luôn nhận danh sách công khai (không có sản phẩm đang ẩn).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/storefront/products', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { products?: Product[] }) => {
        if (!cancelled && Array.isArray(data.products)) setProducts(data.products.filter((p) => p.status !== 'hidden'));
      })
      .catch(() => {
        /* giữ dữ liệu mẫu */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    return new URLSearchParams(window.location.search);
  });

  const {
    lines,
    isCartOpen,
    setCartOpen,
    addToCart,
    undoLastAdd,
    deviceId,
    setDeviceId,
    mergeGuestCart,
  } = useCart();
  const { session, startBuyNow, clearBuyNow } = useBuyNow();
  const { user, persona, setPersona, isOtpOpen, openOtpModal, closeOtpModal, toggleFavorite } =
    useAuth();
  const { orderGroups } = useOrders();

  // Dialog & Sheet states
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [simulatedRaceCondition, setSimulatedRaceCondition] = useState(false);
  const [simulatedConfirmedOrder, setSimulatedConfirmedOrder] = useState<OrderGroup | null>(null);

  // Điều hướng nội bộ
  const navigate = (path: string) => {
    if (path === '/quan-tri' || path.startsWith('/quan-tri/')) {
      window.location.assign(path);
      return;
    }
    if (path.startsWith('/')) {
      const [pathname, search] = path.split('?');
      history.pushState(null, '', path);
      setCurrentPath(pathname);
      setSearchParams(new URLSearchParams(search || ''));
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  registerNavigate(navigate);

  // Lắng nghe popstate & hashchange
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Xử lý Thêm nhanh 1 chạm (US-02):
  // 1 quy cách -> thêm ngay 1 đơn vị, toast "Đã thêm 1 {tên} · Hoàn tác" trong 5s.
  const handleQuickAdd = (product: Product, variant: Variant) => {
    const res = addToCart(product, variant, 1);
    if (!res.success) {
      setToastMessage({
        id: `err_${Date.now()}`,
        text: res.message || 'Không thể thêm sản phẩm.',
        durationMs: 4000,
      });
      return;
    }

    track('quick_add', { productId: product.id, variantId: variant.id });

    // Toast có nút Hoàn tác trong 5s
    setToastMessage({
      id: `add_${Date.now()}`,
      text: `Đã thêm 1 ${product.name} (${variant.label})`,
      actionLabel: 'Hoàn tác',
      durationMs: 5000,
      onAction: () => {
        const undoRes = undoLastAdd();
        if (undoRes.success) {
          track('undo_quick_add', { productId: product.id });
        }
      },
    });
  };

  // Xử lý Mua ngay (≤ 3 lần chạm - Section 0, US-04, TS-E2E-02)
  const handleBuyNow = (product: Product, variant: Variant, quantity = 1) => {
    startBuyNow(product, variant, quantity);
    track('start_buy_now', { productId: product.id, variantId: variant.id, quantity });

    // Chưa đăng nhập: sang trang đăng nhập, xong quay lại đúng bước mua
    if (!user) {
      navigate(`/dang-nhap?tiep=${encodeURIComponent(`/mua-ngay/${variant.id}`)}`);
      return;
    }

    navigate(`/mua-ngay/${variant.id}`);
  };

  // Xử lý bấm Đặt hàng từ Giỏ nổi (US-07)
  const handleProceedCheckoutFromCart = () => {
    setCartOpen(false);
    if (!user) {
      navigate(`/dang-nhap?tiep=${encodeURIComponent('/dat-hang')}`);
      return;
    }
    navigate('/dat-hang');
  };

  // Xử lý sau khi OTP xác thực thành công (Gộp giỏ theo TS-E2E-01)
  const handleOtpSuccess = () => {
    // Gộp giỏ khách vãng lai vào tài khoản
    const variantsMap: Record<string, Variant> = {};
    products.forEach((p) => {
      p.variants.forEach((v) => {
        variantsMap[v.id] = v;
      });
    });

    const mergeRes = mergeGuestCart(lines, variantsMap);
    if (mergeRes.adjustedCount > 0) {
      setToastMessage({
        id: `adjust_${Date.now()}`,
        text: `Đã điều chỉnh số lượng của ${mergeRes.adjustedCount} sản phẩm theo tồn kho thực tế.`,
        durationMs: 5000,
      });
    }

    navigate('/dat-hang');
  };

  // Map tìm nhanh nhà cung cấp
  const suppliersMap = useMemo(() => {
    const map: Record<string, any> = {};
    mockSuppliers.forEach((s) => (map[s.id] = s));
    return map;
  }, []);

  // Xác định view hiển thị theo route
  const renderCurrentView = () => {
    // Khách đăng nhập Google chưa có số điện thoại: bắt buộc bổ sung trước khi dùng tiếp
    if (user && !user.phone) {
      return <AuthPage onDone={() => navigate(searchParams.get('tiep') || (currentPath.startsWith('/dang-') ? '/' : currentPath))} />;
    }
    // 1. Trang chi tiết sản phẩm: /san-pham/:slug
    if (currentPath.startsWith('/san-pham/') && currentPath !== '/san-pham') {
      const slug = currentPath.replace('/san-pham/', '').replace(/\/$/, '');
      const found = products.find((p) => p.slug === slug || p.id === slug);
      if (found) {
        return (
          <ProductDetailPage
            product={found}
            supplier={suppliersMap[found.supplierId]}
            allProducts={products}
            onBack={() => navigate('/san-pham')}
            onNavigateToProduct={(nextSlug) => navigate(`/san-pham/${nextSlug}`)}
            onAddToCart={(p, v, q) => {
              addToCart(p, v, q);
              setToastMessage({
                id: `add_${Date.now()}`,
                text: `Đã thêm ${q} ${p.name} vào giỏ`,
                durationMs: 4000,
              });
            }}
            onBuyNow={handleBuyNow}
            onOpenTraceability={(code) => navigate(`/truy-xuat/${code}`)}
            onToggleFavorite={toggleFavorite}
            isFavorite={user?.favoriteProductIds.includes(found.id)}
          />
        );
      }
    }

    // 2. Trang đặt hàng một màn (Cart hoặc Mua ngay)
    if (currentPath === '/dat-hang' || currentPath.startsWith('/mua-ngay/')) {
      const isBuyNow = currentPath.startsWith('/mua-ngay/');
      return (
        <CheckoutOnePage
          isBuyNowMode={isBuyNow}
          products={products}
          onOrderSuccess={(createdGroup) => {
            setSimulatedConfirmedOrder(createdGroup);
            navigate(`/xac-nhan/${createdGroup.id}`);
          }}
          onBack={() => {
            if (isBuyNow) clearBuyNow();
            navigate('/');
          }}
        />
      );
    }

    // 3. Trang xác nhận đơn hàng: /xac-nhan/:orderGroupId
    if (currentPath.startsWith('/xac-nhan/')) {
      const groupId = currentPath.replace('/xac-nhan/', '');
      const group =
        simulatedConfirmedOrder || orderGroups.find((g) => g.id === groupId || g.orderGroupCode === groupId);
      if (group) {
        return (
          <OrderConfirmationPage
            orderGroup={group}
            onContinueShopping={() => navigate('/')}
            onTrackOrder={(id) => navigate(`/don-hang/${id}`)}
          />
        );
      }
    }

    // 4. Trang theo dõi đơn hàng: /don-hang/:orderId
    if (currentPath.startsWith('/don-hang/')) {
      const orderId = currentPath.replace('/don-hang/', '');
      return <OrderTrackingPage orderGroupId={orderId} onBack={() => navigate('/tai-khoan')} />;
    }

    // 5. Trang danh mục & tìm kiếm: /san-pham hoặc /tim-kiem
    if (currentPath === '/san-pham' || currentPath === '/tim-kiem') {
      const themeParam = searchParams.get('chu-de') as ThemeId | undefined;
      const queryParam = searchParams.get('q') || '';
      const regionParam = searchParams.get('vung') || '';
      return (
        <CatalogPage
          products={products}
          initialThemeId={themeParam || undefined}
          initialQuery={queryParam}
          initialRegion={regionParam}
          onOpenDetail={(p) => navigate(`/san-pham/${p.slug}`)}
          onQuickAdd={handleQuickAdd}
          onOpenQuickAddSheet={(p) => setQuickAddProduct(p)}
          onClearFilters={() => navigate('/san-pham')}
        />
      );
    }

    // Đăng nhập / đăng ký
    if (currentPath === '/dang-nhap' || currentPath === '/dang-ky') {
      const next = searchParams.get('tiep') || '/tai-khoan';
      return <AuthPage key={currentPath} initialMode={currentPath === '/dang-ky' ? 'register' : 'login'} onDone={() => navigate(next)} />;
    }

    // 6. Tài khoản: /tai-khoan (chỉ khi đã đăng nhập)
    if (currentPath === '/tai-khoan') {
      if (!user) return <AuthPage onDone={() => navigate('/tai-khoan')} />;
      return (
        <AccountScreen
          products={products}
          onOpenProductDetail={(p) => navigate(`/san-pham/${p.slug}`)}
          onTrackOrder={(id) => navigate(`/don-hang/${id}`)}
          onNavigateHome={() => navigate('/')}
        />
      );
    }

    // 7. Truy xuất nguồn gốc QR: /truy-xuat/:code
    if (currentPath.startsWith('/truy-xuat/')) {
      const code = currentPath.replace('/truy-xuat/', '');
      const matched = products.find((p) => p.traceabilityCode === code);
      return <TraceabilityPage code={code} product={matched} onBack={() => navigate('/')} />;
    }

    // 8. Admin Quản lý phương tiện: /admin/phuong-tien
    if (currentPath === '/admin/phuong-tien') {
      return (
        <MediaManager
          products={products}
          onUpdateProductMedia={(pId, updatedMedia) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === pId ? { ...p, media: updatedMedia } : p))
            );
          }}
          onBack={() => navigate('/')}
        />
      );
    }

    // 9. Trang nội dung
    if (currentPath === '/gioi-thieu') {
      return <AboutPage onExplore={() => navigate('/san-pham')} />;
    }
    if (currentPath === '/vung-mien') return <RegionsPage products={products} />;
    if (currentPath === '/htx') return <ProducersPage products={products} />;
    if (currentPath === '/cau-chuyen') {
      return <StoriesPage onExplore={() => navigate('/san-pham')} />;
    }
    if (currentPath === '/chinh-sach') {
      return <PolicyPage />;
    }

    // Mặc định: Trang chủ (/)
    return (
      <HomePage
        products={products}
        onOpenDetail={(p) => navigate(`/san-pham/${p.slug}`)}
        onQuickAdd={handleQuickAdd}
        onOpenQuickAddSheet={(p) => setQuickAddProduct(p)}
        onViewAllTheme={(themeId) => navigate(`/san-pham?chu-de=${themeId}`)}
        onSelectRegion={(reg) => navigate(`/san-pham?vung=${encodeURIComponent(reg)}`)}
        onNavigate={navigate}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F0] text-[#1B1B1F]">
      <SiteIntro />
      {/* Header dính có nền kính khi cuộn */}
      <Header
        products={products}
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => {
          navigate(user ? '/tai-khoan' : '/dang-nhap');
        }}
      />

      {/* View chính */}
      <div className="flex-1 page-enter" key={currentPath}>{renderCurrentView()}</div>

      {/* Footer ấm áp sang trọng */}
      <Footer onNavigate={navigate} />

      {/* Bottom Nav cho Mobile */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => {
          navigate(user ? '/tai-khoan' : '/dang-nhap');
        }}
      />

      {/* Giỏ hàng nổi (FloatingCart) - mở không đổi trang (FR-MHTT-11) */}
      <FloatingCart
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        products={products}
        onProceedToCheckout={handleProceedCheckoutFromCart}
        onExploreSeason={() => navigate('/san-pham?chu-de=in_season')}
      />

      {/* QuickAddSheet cho sản phẩm nhiều quy cách (2 chạm) */}
      <QuickAddSheet
        product={quickAddProduct}
        isOpen={Boolean(quickAddProduct)}
        onClose={() => setQuickAddProduct(null)}
        onAddToCart={(p, v, q) => {
          addToCart(p, v, q);
          setToastMessage({
            id: `add_${Date.now()}`,
            text: `Đã thêm ${q} ${p.name} vào giỏ`,
            durationMs: 4000,
          });
        }}
        onBuyNow={handleBuyNow}
      />


      {/* Toast thông báo hoàn tác */}
      <Toast toast={toastMessage} onDismiss={() => setToastMessage(null)} />


    </div>
  );
}
