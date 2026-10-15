import { MapPin, ShoppingBag, User } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { defaultAddressOf } from '../../domain/address';
import { snapshotAddress } from '../../domain/state';
import { useStore } from '../../store/AppDataContext';

export function CustomerTopBar() {
  const { state } = useStore();
  const { openModal, customerActor, setCustomerTab } = useUi();
  const address = defaultAddressOf(state, customerActor.id!);
  const cartCount = (state.carts[customerActor.id!] ?? []).reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="sticky top-[var(--app-header-h,0px)] z-30 flex items-center justify-between gap-2 border-b border-stone-200/60 bg-white/95 px-4 py-1.5 backdrop-blur-md">
      <button onClick={() => openModal({ type: 'address_book' })} className="flex min-h-11 min-w-0 flex-1 items-center gap-1.5 text-left">
        <MapPin size={16} className="shrink-0 text-forest-600" />
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-muted">Nhận hàng tại (Hà Nội)</span>
          <span className="block truncate text-sm font-bold text-stone-800">{address ? snapshotAddress(state, address).text : 'Thêm địa chỉ giao hàng'}</span>
        </span>
      </button>
      <button
        onClick={() => openModal({ type: 'cart' })}
        aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-stone-100"
      >
        <ShoppingBag size={20} className="text-forest-800" />
        {cartCount > 0 && (
          <span className="absolute top-1 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-champagne-600 px-1 text-xs font-bold text-white">{cartCount}</span>
        )}
      </button>
      <button
        onClick={() => setCustomerTab('account')}
        aria-label="Tài khoản"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100"
      >
        <User size={18} />
      </button>
    </div>
  );
}
