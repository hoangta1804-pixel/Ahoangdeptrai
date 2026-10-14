import { BottomSheet } from '../components/BottomSheet';
import { DemoPanel } from '../components/DemoPanel';
import { ListBoundary } from '../components/ListBoundary';
import { NotificationsSheet } from '../components/NotificationsSheet';
import { CoopOrderSheet } from '../screens/coop/CoopOrderSheet';
import { AddressBookSheet } from '../screens/customer/AddressBookSheet';
import { AddressFormSheet } from '../screens/customer/AddressFormSheet';
import { CartSheet } from '../screens/customer/CartSheet';
import { CheckoutSheet } from '../screens/customer/CheckoutSheet';
import { ComplaintSheet } from '../screens/customer/ComplaintSheet';
import { OrderDetailSheet } from '../screens/customer/OrderDetailSheet';
import { PaymentSheet } from '../screens/customer/PaymentSheet';
import { ReviewSheet } from '../screens/customer/ReviewSheet';
import { CoopProductFormSheet } from '../screens/coop/CoopProductFormSheet';
import { ProductDetailSheet } from '../screens/customer/ProductDetailSheet';
import { TraceLotSheet } from '../screens/customer/TraceLotSheet';
import { useStore } from '../store/AppDataContext';
import { useUi } from './UiContext';

/** Hiển thị đúng một sheet đang mở. Sheet nhận mã bản ghi và đọc dữ liệu mới nhất từ store. */
export function ModalHost() {
  const { modal, closeModal } = useUi();
  const { state } = useStore();
  if (!modal) return null;
  // Sheet gặp lỗi thì hiện sheet báo lỗi thay vì làm trắng cả app (mục 10.5).
  return (
    <ListBoundary key={modal.type} label="cửa sổ này" resetKey={state} wrap={(node) => <BottomSheet title="Có lỗi" onClose={closeModal}>{node}</BottomSheet>}>
      <ModalContent />
    </ListBoundary>
  );
}

function ModalContent() {
  const { modal, closeModal } = useUi();
  if (!modal) return null;
  switch (modal.type) {
    case 'product_detail':
      return <ProductDetailSheet key={modal.productId} productId={modal.productId} onClose={closeModal} />;
    case 'trace_lot':
      return <TraceLotSheet productId={modal.productId} onClose={closeModal} />;
    case 'cart':
      return <CartSheet onClose={closeModal} />;
    case 'checkout':
      return <CheckoutSheet source={modal.source} preferredAddressId={modal.addressId} onClose={closeModal} />;
    case 'payment':
      return <PaymentSheet txId={modal.txId} onClose={closeModal} />;
    case 'order_detail':
      return <OrderDetailSheet key={modal.orderId} orderId={modal.orderId} onClose={closeModal} />;
    case 'address_book':
      return <AddressBookSheet onClose={closeModal} />;
    case 'address_form':
      return <AddressFormSheet key={modal.addressId ?? 'new'} addressId={modal.addressId} returnTo={modal.returnTo} onClose={closeModal} />;
    case 'complaint':
      return <ComplaintSheet orderId={modal.orderId} onClose={closeModal} />;
    case 'coop_order':
      return <CoopOrderSheet key={modal.orderId} orderId={modal.orderId} onClose={closeModal} />;
    case 'demo_panel':
      return <DemoPanel onClose={closeModal} />;
    case 'review':
      return <ReviewSheet key={`${modal.orderId}-${modal.productId}`} orderId={modal.orderId} productId={modal.productId} onClose={closeModal} />;
    case 'coop_product_form':
      return <CoopProductFormSheet key={modal.productId ?? 'new'} productId={modal.productId} onClose={closeModal} />;
    case 'notifications':
      return <NotificationsSheet onClose={closeModal} />;
  }
}
