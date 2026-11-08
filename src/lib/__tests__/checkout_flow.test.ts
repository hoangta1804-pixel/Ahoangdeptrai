import { describe, it, expect } from 'vitest';
import { useOrderStore } from '../../stores/orderStore';
import { OrderGroup } from '../../mock/types';

describe('Đặc Sản Số - Checkout & 15-minute Countdown (Bước 6)', () => {
  it('tạo đơn hàng với 15 phút đếm ngược và cho phép mô phỏng thanh toán thành công', () => {
    const store = useOrderStore.getState();

    const sampleGroup: OrderGroup = {
      id: 'grp_test_01',
      orderGroupCode: 'DSS-TEST-001',
      customerName: 'Anh Hoàng',
      phone: '0912345678',
      address: {
        id: 'addr_1',
        recipientName: 'Anh Hoàng',
        phone: '0912345678',
        city: 'Hà Nội',
        district: 'Quận Ba Đình',
        ward: 'Phường Điện Biên',
        street: '18 Điện Biên Phủ',
        isDefault: true,
      },
      orders: [],
      subtotalGoods: 500000,
      discountTotal: 0,
      shippingTotal: 25000,
      giftBoxTotal: 0,
      depositTotal: 150000,
      payNowTotal: 150000,
      payOnDeliveryTotal: 375000,
      paymentExpiresAt: Date.now() + 15 * 60 * 1000,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.createOrderGroup(sampleGroup);
    expect(useOrderStore.getState().orderGroups.length).toBeGreaterThan(0);

    // Thanh toán thành công
    store.markPaymentSuccess('grp_test_01');
    const updated = useOrderStore.getState().getOrderGroupById('grp_test_01');
    expect(updated?.paymentStatus).toBe('paid');
  });

  it('hết hạn 15 phút hoặc huỷ đơn thì trạng thái chuyển thành timeout_cancelled', () => {
    const store = useOrderStore.getState();
    const sampleGroup: OrderGroup = {
      id: 'grp_test_02',
      orderGroupCode: 'DSS-TEST-002',
      customerName: 'Chị Lan',
      phone: '0987654321',
      address: {
        id: 'addr_2',
        recipientName: 'Chị Lan',
        phone: '0987654321',
        city: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        ward: 'Phường Dịch Vọng',
        street: '1 Duy Tân',
        isDefault: true,
      },
      orders: [],
      subtotalGoods: 200000,
      discountTotal: 0,
      shippingTotal: 25000,
      giftBoxTotal: 0,
      depositTotal: 0,
      payNowTotal: 225000,
      payOnDeliveryTotal: 0,
      paymentExpiresAt: Date.now() + 15 * 60 * 1000,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.createOrderGroup(sampleGroup);
    store.cancelOrderGroup('grp_test_02');

    const updated = useOrderStore.getState().getOrderGroupById('grp_test_02');
    expect(updated?.paymentStatus).toBe('timeout_cancelled');
  });

  it('tiền về muộn sau khi đơn đã huỷ -> không khôi phục đơn, chuyển sang refund_pending', () => {
    const store = useOrderStore.getState();
    store.simulateLatePaymentArrival('grp_test_02');
    const updated = useOrderStore.getState().getOrderGroupById('grp_test_02');
    expect(updated?.paymentStatus).toBe('refund_pending');
  });
});
