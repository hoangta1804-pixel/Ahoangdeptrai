import { ChevronDown, MapPin, ShoppingBag, User } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { useAppData } from '../../store/AppDataContext';

export function CustomerTopBar() {
  const { selectedAddress, cart } = useAppData();
  const { openModal } = useUi();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/60 bg-white/90 px-4 py-2 backdrop-blur-md">
      <button
        onClick={() => openModal({ type: 'address_sheet' })}
        className="flex min-w-0 max-w-[75%] items-center gap-1.5 text-left"
      >
        <MapPin size={16} className="shrink-0 text-emerald-700" />
        <div className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-tight text-stone-400">Giao đến tại Hà Nội</span>
          <span className="block truncate text-xs font-bold text-stone-800">
            {selectedAddress.houseType === 'apartment'
              ? `${selectedAddress.buildingBlock} - Căn ${selectedAddress.apartmentNumber}, ${selectedAddress.district}`
              : `${selectedAddress.streetDetails}, ${selectedAddress.district}`}
          </span>
        </div>
        <ChevronDown size={14} className="shrink-0 text-stone-400" />
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={() => openModal({ type: 'cart' })}
          aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
          className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
        >
          <ShoppingBag size={20} className="text-emerald-900" />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
        <button
          onClick={() => openModal({ type: 'auth' })}
          aria-label="Tài khoản / Đăng nhập"
          className="flex h-11 w-11 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100"
        >
          <User size={18} />
        </button>
      </div>
    </div>
  );
}
