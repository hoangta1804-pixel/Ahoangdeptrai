import React from 'react';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../stores/cartStore';

export interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenCart,
  onOpenAuth,
}) => {
  const { lines } = useCart();
  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);

  // Ẩn thanh đáy khi đang xem trang chi tiết sản phẩm để nhường chỗ cho StickyBuyBar
  if (currentPath.startsWith('/san-pham/') && currentPath !== '/san-pham') {
    return null;
  }

  // Ẩn thanh đáy khi ở trang đặt hàng một màn
  if (currentPath === '/dat-hang' || currentPath.startsWith('/mua-ngay/')) {
    return null;
  }

  return (
    <nav
      aria-label="Thanh điều hướng nhanh phía dưới màn hình"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-blur border-t border-[#E7DFCF]/80 shadow-[0_-4px_20px_rgba(47, 102, 80,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4 h-16 items-center">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors ${
            currentPath === '/' ? 'text-[#B8893B] font-bold' : 'text-[#6B4A32]'
          }`}
        >
          <Home size={20} strokeWidth={currentPath === '/' ? 2.5 : 1.8} />
          <span className="text-xs leading-none">Trang chủ</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/san-pham')}
          className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors ${
            currentPath.startsWith('/san-pham') ? 'text-[#B8893B] font-bold' : 'text-[#6B4A32]'
          }`}
        >
          <Grid size={20} strokeWidth={currentPath.startsWith('/san-pham') ? 2.5 : 1.8} />
          <span className="text-xs leading-none">Danh mục</span>
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center min-h-[44px] gap-1 text-[#6B4A32] hover:text-[#B8893B] transition-colors"
        >
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={1.8} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-[#B8893B] text-[#2F6650] text-xs font-bold font-mono flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-xs leading-none">Giỏ hàng</span>
        </button>

        <button
          type="button"
          onClick={onOpenAuth}
          className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors ${
            currentPath === '/tai-khoan' ? 'text-[#B8893B] font-bold' : 'text-[#6B4A32]'
          }`}
        >
          <User size={20} strokeWidth={currentPath === '/tai-khoan' ? 2.5 : 1.8} />
          <span className="text-xs leading-none">Tài khoản</span>
        </button>
      </div>
    </nav>
  );
};
