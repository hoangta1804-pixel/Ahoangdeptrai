import React, { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Address } from '../../mock/types';
import { HANOI_DISTRICTS, NON_HANOI_REGIONS } from '../../mock/addresses-hanoi';
import { validateDeliveryAddress } from '../../lib/address';
import { MapPin, Plus, Check, AlertTriangle, Phone } from 'lucide-react';

export interface AddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (addr: Address) => void;
  onAddNewAddress: (addr: Omit<Address, 'id'>) => Address;
}

export const AddressSheet: React.FC<AddressSheetProps> = ({
  isOpen,
  onClose,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(addresses.length === 0);
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState(HANOI_DISTRICTS[0].name);
  const [ward, setWard] = useState(HANOI_DISTRICTS[0].wards[0]);
  const [street, setStreet] = useState('');
  const [isDefault, setIsDefault] = useState(addresses.length === 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Giả lập thử nghiệm địa chỉ ngoài Hà Nội
  const [outsideHanoiPhone, setOutsideHanoiPhone] = useState('');
  const [outsideHanoiRegion, setOutsideHanoiRegion] = useState('');
  const [outsideHanoiSuccess, setOutsideHanoiSuccess] = useState(false);

  const currentDistrictObj = HANOI_DISTRICTS.find((d) => d.name === district) || HANOI_DISTRICTS[0];

  const handleDistrictChange = (dName: string) => {
    setDistrict(dName);
    const dObj = HANOI_DISTRICTS.find((d) => d.name === dName);
    if (dObj && dObj.wards.length > 0) {
      setWard(dObj.wards[0]);
    }
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setErrorMessage('Vui lòng nhập tên người nhận.');
      return;
    }
    if (!phone || phone.length < 10) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (10 số).');
      return;
    }
    if (!street.trim()) {
      setErrorMessage('Vui lòng nhập số nhà, tên đường.');
      return;
    }

    const val = validateDeliveryAddress('Hà Nội', district, ward);
    if (!val.isValidHanoi) {
      setErrorMessage(val.message || 'Địa chỉ không hợp lệ.');
      return;
    }

    const created = onAddNewAddress({
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      city: 'Hà Nội',
      district,
      ward,
      street: street.trim(),
      isDefault,
    });

    onSelectAddress(created);
    setIsAddingNew(false);
    onClose();
  };

  const handleSaveOutsideHanoiLead = () => {
    if (!outsideHanoiPhone || outsideHanoiPhone.length < 10) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ để nhận thông báo.');
      return;
    }
    setOutsideHanoiSuccess(true);
    setTimeout(() => {
      setOutsideHanoiSuccess(false);
      setOutsideHanoiRegion('');
      setOutsideHanoiPhone('');
    }, 4000);
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isAddingNew ? 'Thêm địa chỉ giao hàng' : 'Sổ địa chỉ nhận hàng'}
      subtitle="Chỉ áp dụng giao hàng tại khu vực Hà Nội"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {!isAddingNew ? (
          <div className="space-y-3">
            <div className="space-y-2">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      onSelectAddress(addr);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'bg-[#35705A] text-[#FAF7F0] border-[#35705A] shadow-sm'
                        : 'bg-white text-[#1B1B1F] border-[#E7DFCF] hover:border-[#B8893B]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-small">
                          {addr.recipientName}
                        </span>
                        <span className="text-caption font-mono opacity-80">({addr.phone})</span>
                        {addr.isDefault && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              isSelected ? 'bg-[#B8893B] text-[#2F6650]' : 'bg-[#F3EEE2] text-[#8F6A4D]'
                            }`}
                          >
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-small opacity-90">
                        {addr.street}, {addr.ward}, {addr.district}, {addr.city}
                      </p>
                    </div>

                    <div className="mt-1">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#B8893B] text-[#2F6650] flex items-center justify-center">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#8F6A4D]/40" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => setIsAddingNew(true)}
              leftIcon={<Plus size={18} />}
            >
              Thêm địa chỉ mới
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSaveNewAddress} className="space-y-3.5">
            <div>
              <label className="block text-small font-semibold text-[#1B1B1F] mb-1">
                Tên người nhận:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Huy Hoàng"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] outline-none text-small bg-white"
              />
            </div>

            <div>
              <label className="block text-small font-semibold text-[#1B1B1F] mb-1">
                Số điện thoại liên hệ:
              </label>
              <input
                type="tel"
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] outline-none text-small font-mono bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-small font-semibold text-[#1B1B1F] mb-1">
                  Thành phố:
                </label>
                <input
                  type="text"
                  disabled
                  value="Hà Nội"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7DFCF] bg-[#F3EEE2] text-[#6B4A32] font-semibold text-small cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-small font-semibold text-[#1B1B1F] mb-1">
                  Quận / Huyện:
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] outline-none text-small bg-white"
                >
                  {HANOI_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-small font-semibold text-[#1B1B1F] mb-1">
                Phường / Xã:
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] outline-none text-small bg-white"
              >
                {currentDistrictObj.wards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-small font-semibold text-[#1B1B1F] mb-1">
                Số nhà, ngõ, tên đường:
              </label>
              <input
                type="text"
                placeholder="Số 18 Điện Biên Phủ"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7DFCF] focus:border-[#B8893B] outline-none text-small bg-white"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="accent-[#B8893B] w-4 h-4 rounded"
              />
              <span className="text-small text-[#6B4A32]">Đặt làm địa chỉ nhận mặc định</span>
            </label>

            {errorMessage && (
              <div className="p-3 bg-[#FDF1F1] text-[#A63D3D] text-small rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {addresses.length > 0 && (
                <Button variant="ghost" type="button" onClick={() => setIsAddingNew(false)}>
                  Quay lại
                </Button>
              )}
              <Button variant="primary" type="submit" className="flex-1">
                Lưu địa chỉ
              </Button>
            </div>
          </form>
        )}

        {/* Khu vực kiểm tra & chặn ngoài Hà Nội (BR-MN-06) */}
        <div className="p-3.5 bg-[#FEF7EA] border border-[#B7791F]/30 rounded-2xl text-xs space-y-2 mt-4">
          <div className="flex items-center gap-1.5 font-semibold text-[#B7791F]">
            <AlertTriangle size={15} />
            <span>Bạn ở tỉnh thành khác ngoài Hà Nội?</span>
          </div>
          <p className="text-[#6B4A32]">
            Hiện chúng tôi chỉ giao trong Hà Nội. Để lại số điện thoại, chúng tôi sẽ báo khi mở thêm vùng giao.
          </p>

          {outsideHanoiSuccess ? (
            <div className="p-2 bg-[#EAF4EE] text-[#2F6B4F] font-semibold rounded-lg text-center">
              ✓ Đã ghi nhận số điện thoại của bạn!
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <input
                type="tel"
                placeholder="Số điện thoại nhận tin"
                value={outsideHanoiPhone}
                onChange={(e) => setOutsideHanoiPhone(e.target.value.replace(/[^\d]/g, ''))}
                className="flex-1 px-3 py-1.5 rounded-lg border border-[#E7DFCF] bg-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleSaveOutsideHanoiLead}
                className="px-3 py-1.5 bg-[#B8893B] text-[#2F6650] font-semibold rounded-lg text-xs hover:bg-[#CDA25A]"
              >
                Gửi
              </button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};
