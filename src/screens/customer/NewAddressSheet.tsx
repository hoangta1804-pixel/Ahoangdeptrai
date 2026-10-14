import { Navigation } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { HANOI_DISTRICTS } from '../../data/seed';
import type { Address } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';

/** Form thêm địa chỉ – bản chuyển từ App.tsx cũ. Giai đoạn 2 làm lại theo mục 5.1 (L14). */
export function NewAddressSheet({ onClose }: { onClose: () => void }) {
  const { setAddresses, setSelectedAddressId } = useAppData();
  const { openModal, showToast } = useUi();

  const save = () => {
    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      title: 'Địa chỉ mới thêm',
      receiverName: 'Nguyễn Văn An',
      receiverPhone: '0988 234 567',
      houseType: 'apartment',
      buildingName: 'KĐT Vinhomes Smart City',
      buildingBlock: 'S2.05',
      apartmentNumber: '1508',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng Hậu',
      city: 'Hà Nội',
      isDefault: false,
      lat: 21.0285,
      lng: 105.8542,
    };
    setAddresses((prev) => [...prev, newAddr]);
    setSelectedAddressId(newAddr.id);
    openModal({ type: 'address_sheet' });
    showToast('Đã lưu địa chỉ mới vào sổ địa chỉ Hà Nội!');
  };

  return (
    <BottomSheet
      title="Thêm Địa Chỉ Giao Hàng"
      onClose={onClose}
      footer={
        <button onClick={save} className="w-full rounded-2xl bg-emerald-900 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-800">
          Lưu địa chỉ giao hàng
        </button>
      }
    >
      {/* GPS Instant Locate Button (<3s) */}
      <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-950 block">Định vị vệ tinh GPS</span>
          <span className="text-[10px] text-emerald-800">Tự động điền tọa độ chính xác &lt; 3 giây</span>
        </div>
        <button
          onClick={() => {
            showToast('Đã lấy tọa độ GPS: 21.0285° N, 105.8542° E (Cầu Giấy, Hà Nội)');
          }}
          className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs"
        >
          <Navigation size={12} />
          Lấy vị trí GPS
        </button>
      </div>

      {/* City Selection (Hanoi validation notice) */}
      <div>
        <label className="text-[11px] font-semibold text-stone-600 block mb-1">Tỉnh / Thành Phố:</label>
        <select
          defaultValue="Hà Nội"
          onChange={(e) => {
            if (e.target.value !== 'Hà Nội') {
              alert('Giai đoạn 1 ứng dụng chỉ phục vụ giao hàng trong địa bàn TP. Hà Nội');
              e.target.value = 'Hà Nội';
            }
          }}
          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-semibold text-stone-900 focus:outline-none"
        >
          <option value="Hà Nội">Thành phố Hà Nội</option>
          <option value="Khác">Tỉnh thành khác (Chưa hỗ trợ)</option>
        </select>
      </div>

      {/* District & Ward */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-stone-600 block mb-1">Quận / Huyện:</label>
          <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900">
            {HANOI_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-stone-600 block mb-1">Phường / Xã:</label>
          <input
            type="text"
            placeholder="VD: Dịch Vọng Hậu"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900"
          />
        </div>
      </div>

      {/* Segmented Control for Housing Type */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-stone-600 block">Loại hình nhà ở:</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="py-2 rounded-xl text-xs font-bold border border-emerald-700 bg-emerald-50 text-emerald-950 flex items-center justify-center gap-1.5"
          >
            🏢 Chung cư
          </button>
          <button
            type="button"
            className="py-2 rounded-xl text-xs font-semibold border border-stone-200 bg-white text-stone-600 flex items-center justify-center gap-1.5"
          >
            🏠 Nhà mặt đất
          </button>
        </div>
      </div>

      {/* Apartment details */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <input
            type="text"
            placeholder="Tên Tòa (VD: S2.05)"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Mã Căn (1508)"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
          />
        </div>
      </div>

    </BottomSheet>
  );
}
