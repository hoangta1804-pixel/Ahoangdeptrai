import { HANOI_DISTRICTS } from '../mock/addresses-hanoi';

export interface HanoiValidationResult {
  isValidHanoi: boolean;
  message?: string;
}

export function validateDeliveryAddress(
  city: string,
  district: string,
  ward: string
): HanoiValidationResult {
  const normalizedCity = city.trim().toLowerCase();

  if (normalizedCity !== 'hà nội' && normalizedCity !== 'ha noi') {
    return {
      isValidHanoi: false,
      message:
        'Hiện chúng tôi chỉ giao trong Hà Nội. Để lại số điện thoại, chúng tôi báo khi mở thêm vùng giao.',
    };
  }

  const foundDistrict = HANOI_DISTRICTS.find(
    (d) => d.name.toLowerCase() === district.trim().toLowerCase()
  );

  if (!foundDistrict) {
    return {
      isValidHanoi: false,
      message: 'Quận/huyện không thuộc phạm vi giao hàng Hà Nội.',
    };
  }

  const foundWard = foundDistrict.wards.find(
    (w) => w.toLowerCase() === ward.trim().toLowerCase()
  );

  if (!foundWard) {
    return {
      isValidHanoi: false,
      message: 'Phường/xã không hợp lệ tại quận/huyện đã chọn.',
    };
  }

  return { isValidHanoi: true };
}
