import { Plus } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { useAppData } from '../../store/AppDataContext';

export function AddressSheet({ onClose }: { onClose: () => void }) {
  const { addresses, selectedAddress, setSelectedAddressId } = useAppData();
  const { openModal, showToast } = useUi();

  return (
    <BottomSheet
      title={
        <>
          Sổ Địa Chỉ Giao Hàng Hà Nội
          <span className="block text-xs font-normal text-stone-500">Tối đa 10 địa chỉ • Phục vụ địa bàn TP. Hà Nội</span>
        </>
      }
      onClose={onClose}
      footer={
        <button
          onClick={() => openModal({ type: 'new_address' })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 py-3 text-sm font-bold text-stone-900 transition-colors hover:bg-stone-200"
        >
          <Plus size={16} />
          Thêm địa chỉ mới tại Hà Nội
        </button>
      }
    >
      <div className="space-y-2">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            onClick={() => {
              setSelectedAddressId(addr.id);
              onClose();
              showToast(`Đã chọn giao đến: ${addr.district}, Hà Nội`);
            }}
            className={`w-full rounded-2xl border p-3 text-left transition-all ${
              selectedAddress.id === addr.id ? 'border-emerald-700 bg-emerald-50/50 shadow-xs' : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-stone-900">{addr.title}</span>
                {addr.isDefault && (
                  <span className="rounded-md bg-stone-200 px-1.5 py-0.5 text-xs font-semibold text-stone-700">Mặc định</span>
                )}
              </div>
              <span className="text-xs font-semibold text-stone-500">{addr.houseType === 'apartment' ? 'Chung cư' : 'Nhà mặt đất'}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-stone-800">
              {addr.houseType === 'apartment' ? `${addr.buildingBlock} - Căn ${addr.apartmentNumber}, ${addr.buildingName}` : addr.streetDetails}
            </p>
            <p className="text-xs text-stone-500">
              {addr.ward}, {addr.district}, {addr.city}
            </p>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
