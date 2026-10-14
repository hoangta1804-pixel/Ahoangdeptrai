import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { Field, Input, PrimaryButton, Select } from '../../components/form';
import { addAddress, updateAddress, type AddressInput } from '../../domain/address';
import type { HouseType } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';

/**
 * Form địa chỉ (BR-DAT-04, L14): Hà Nội cố định; phường/xã chọn từ danh sách; không dùng quận/huyện.
 * Chung cư bắt buộc toà và căn; nhà mặt đất bắt buộc số nhà. Không có nút GPS.
 */
export function AddressFormSheet({ addressId, onClose }: { addressId?: string; onClose: () => void }) {
  const { state, run } = useStore();
  const { customerActor, openModal, showToast } = useUi();
  const existing = state.addresses.find((a) => a.id === addressId);
  const customer = state.customers.find((c) => c.id === customerActor.id);
  const [form, setForm] = useState<AddressInput>(
    existing
      ? { ...existing, isDefault: existing.isDefault }
      : { label: '', receiverName: customer?.name ?? '', receiverPhone: customer?.phone ?? '', houseType: 'apartment', wardId: '', street: '', building: '', unit: '', isDefault: false },
  );
  const set = (patch: Partial<AddressInput>) => setForm((f) => ({ ...f, ...patch }));

  const save = () => {
    const r = existing
      ? run((s) => updateAddress(s, customerActor.id!, existing.id, form))
      : run(
          (s) => addAddress(s, customerActor.id!, form),
          (v) => v.state,
        );
    if (!r.ok) return showToast(r.error);
    showToast(existing ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.');
    openModal({ type: 'address_book' });
  };

  return (
    <BottomSheet
      title={existing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
      onClose={() => openModal({ type: 'address_book' })}
      closeLabel="Quay lại sổ địa chỉ"
      footer={
        <PrimaryButton className="w-full" onClick={save}>
          Lưu địa chỉ
        </PrimaryButton>
      }
    >
      <Field label="Tên gợi nhớ">
        <Input value={form.label} onChange={(e) => set({ label: e.target.value })} placeholder="Ví dụ: Nhà riêng, Văn phòng" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Người nhận">
          <Input value={form.receiverName} onChange={(e) => set({ receiverName: e.target.value })} />
        </Field>
        <Field label="SĐT người nhận">
          <Input inputMode="tel" value={form.receiverPhone} onChange={(e) => set({ receiverPhone: e.target.value })} placeholder="0900 000 000" />
        </Field>
      </div>
      <Field label="Tỉnh/thành phố" hint="Giai đoạn 1 chỉ giao trong Hà Nội.">
        <Input value="Hà Nội" disabled />
      </Field>
      <Field label="Phường/xã" hint="Danh sách mẫu, chờ nhóm nạp danh mục chính thức.">
        <Select value={form.wardId} onChange={(e) => set({ wardId: e.target.value })}>
          <option value="">— Chọn phường/xã —</option>
          {state.wards.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>
      <fieldset className="space-y-1">
        <legend className="text-sm font-semibold text-stone-700">Loại nhà</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['apartment', 'ground'] as HouseType[]).map((t) => (
            <label key={t} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm ${form.houseType === t ? 'border-forest-600 bg-forest-50 font-bold' : 'border-stone-200'}`}>
              <input type="radio" name="houseType" className="sr-only" checked={form.houseType === t} onChange={() => set({ houseType: t })} />
              {t === 'apartment' ? 'Chung cư' : 'Nhà mặt đất'}
            </label>
          ))}
        </div>
      </fieldset>
      {form.houseType === 'apartment' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Toà (bắt buộc)">
            <Input value={form.building ?? ''} onChange={(e) => set({ building: e.target.value })} placeholder="Ví dụ: S2" />
          </Field>
          <Field label="Căn hộ (bắt buộc)">
            <Input value={form.unit ?? ''} onChange={(e) => set({ unit: e.target.value })} placeholder="Ví dụ: 1508" />
          </Field>
        </div>
      )}
      <Field label={form.houseType === 'ground' ? 'Số nhà, ngõ, đường (bắt buộc số nhà)' : 'Tên khu / đường (không bắt buộc)'}>
        <Input value={form.street} onChange={(e) => set({ street: e.target.value })} placeholder={form.houseType === 'ground' ? 'Ví dụ: 25 ngõ 12 đường …' : 'Ví dụ: Khu đô thị …'} />
      </Field>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" className="h-5 w-5" checked={!!form.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} />
        Đặt làm địa chỉ mặc định
      </label>
    </BottomSheet>
  );
}
