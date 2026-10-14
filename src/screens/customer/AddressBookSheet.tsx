import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { deleteAddress, MAX_ADDRESSES, setDefaultAddress } from '../../domain/address';
import { snapshotAddress } from '../../domain/state';
import { useStore } from '../../store/AppDataContext';

/** Sổ địa chỉ (FR-TK-04): tối đa 10 địa chỉ, đặt mặc định, sửa, xoá. */
export function AddressBookSheet({ onClose }: { onClose: () => void }) {
  const { state, run } = useStore();
  const { customerActor, openModal, showToast } = useUi();
  const mine = state.addresses.filter((a) => a.customerId === customerActor.id);
  const full = mine.length >= MAX_ADDRESSES;

  return (
    <BottomSheet
      title={
        <>
          Sổ địa chỉ
          <span className="block text-sm font-normal text-stone-500">
            {mine.length}/{MAX_ADDRESSES} địa chỉ · chỉ giao trong Hà Nội
          </span>
        </>
      }
      onClose={onClose}
      footer={
        <button
          disabled={full}
          onClick={() => openModal({ type: 'address_form' })}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 text-sm font-bold text-white disabled:bg-stone-300 disabled:text-stone-600"
        >
          <Plus size={16} />
          {full ? `Đã đủ ${MAX_ADDRESSES} địa chỉ` : 'Thêm địa chỉ'}
        </button>
      }
    >
      {mine.length === 0 ? (
        <EmptyState>Chưa có địa chỉ nào.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {mine.map((a) => (
            <li key={a.id} className={`space-y-1 rounded-2xl border p-3 ${a.isDefault ? 'border-emerald-700 bg-emerald-50/50' : 'border-stone-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-stone-900">
                  {a.label}
                  {a.isDefault && <span className="ml-2 rounded-md bg-emerald-800 px-1.5 py-0.5 text-xs text-white">Mặc định</span>}
                </span>
                <span className="text-xs text-stone-500">{a.houseType === 'apartment' ? 'Chung cư' : 'Nhà mặt đất'}</span>
              </div>
              <p className="text-sm text-stone-700">
                {a.receiverName} · {a.receiverPhone}
              </p>
              <p className="text-sm text-stone-600">{snapshotAddress(state, a).text}</p>
              <div className="flex gap-1 pt-1">
                {!a.isDefault && (
                  <button
                    onClick={() => {
                      const r = run((s) => setDefaultAddress(s, customerActor.id!, a.id));
                      showToast(r.ok ? 'Đã đặt làm địa chỉ mặc định.' : r.error);
                    }}
                    className="flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    <Star size={14} /> Đặt mặc định
                  </button>
                )}
                <button onClick={() => openModal({ type: 'address_form', addressId: a.id })} className="flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">
                  <Pencil size={14} /> Sửa
                </button>
                <button
                  onClick={() => {
                    if (!window.confirm(`Xoá địa chỉ "${a.label}"?`)) return;
                    const r = run((s) => deleteAddress(s, customerActor.id!, a.id));
                    showToast(r.ok ? 'Đã xoá địa chỉ.' : r.error);
                  }}
                  className="flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
