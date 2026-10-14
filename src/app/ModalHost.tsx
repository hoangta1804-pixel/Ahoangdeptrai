import { AuthSheet } from '../components/auth/AuthSheet';
import { FaceIdModal } from '../components/auth/FaceIdModal';
import { SilentLockedModal } from '../components/auth/SilentLockedModal';
import { LedgerAdjustSheet } from '../screens/admin/LedgerAdjustSheet';
import { AddressSheet } from '../screens/customer/AddressSheet';
import { CartSheet } from '../screens/customer/CartSheet';
import { CheckoutSheet } from '../screens/customer/CheckoutSheet';
import { NewAddressSheet } from '../screens/customer/NewAddressSheet';
import { ProductDetailSheet } from '../screens/customer/ProductDetailSheet';
import { TicketFormSheet } from '../screens/customer/TicketFormSheet';
import { TraceLotSheet } from '../screens/customer/TraceLotSheet';
import { useUi } from './UiContext';

/** Hiển thị đúng một sheet/modal đang mở. */
export function ModalHost() {
  const { modal, closeModal } = useUi();
  if (!modal) return null;
  switch (modal.type) {
    case 'product_detail':
      return <ProductDetailSheet key={modal.product.id} product={modal.product} onClose={closeModal} />;
    case 'trace_lot':
      return <TraceLotSheet product={modal.product} onClose={closeModal} />;
    case 'cart':
      return <CartSheet onClose={closeModal} />;
    case 'checkout':
      return <CheckoutSheet onClose={closeModal} />;
    case 'address_sheet':
      return <AddressSheet onClose={closeModal} />;
    case 'new_address':
      return <NewAddressSheet onClose={closeModal} />;
    case 'ticket_form':
      return <TicketFormSheet onClose={closeModal} />;
    case 'auth':
      return <AuthSheet initialStep={modal.step} onClose={closeModal} />;
    case 'silent_locked':
      return <SilentLockedModal onClose={closeModal} />;
    case 'face_id_scan':
      return <FaceIdModal />;
    case 'ledger_adjust':
      return <LedgerAdjustSheet row={modal.row} onClose={closeModal} />;
  }
}
