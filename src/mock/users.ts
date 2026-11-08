import { User } from './types';

export const mockUsers: Record<'user_with_address' | 'user_no_address', User> = {
  user_with_address: {
    id: 'user_hoang_01',
    name: 'Nguyễn Huy Hoàng',
    phone: '0912345678',
    addresses: [
      {
        id: 'addr_hoang_default',
        recipientName: 'Nguyễn Huy Hoàng',
        phone: '0912345678',
        city: 'Hà Nội',
        district: 'Quận Ba Đình',
        ward: 'Phường Điện Biên',
        street: 'Số 18 Điện Biên Phủ',
        isDefault: true,
      },
      {
        id: 'addr_hoang_office',
        recipientName: 'Nguyễn Huy Hoàng (Văn phòng)',
        phone: '0912345678',
        city: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        ward: 'Phường Dịch Vọng Hậu',
        street: 'Tòa nhà FPT, Phố Duy Tân',
        isDefault: false,
      },
    ],
    defaultPaymentMethod: 'cod',
    favoriteProductIds: ['prod_che_shan_tuyet', 'prod_thit_trau_gac_bep'],
  },
  user_no_address: {
    id: 'user_lan_02',
    name: 'Trần Thị Lan',
    phone: '0987654321',
    addresses: [],
    favoriteProductIds: [],
  },
};
