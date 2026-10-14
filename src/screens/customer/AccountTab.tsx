import { ChevronRight, MapPin, ShieldCheck } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { maskAccount } from '../../domain/state';
import { useStore } from '../../store/AppDataContext';

export function AccountTab() {
  const { state } = useStore();
  const { customerActor, openModal } = useUi();
  const customer = state.customers.find((c) => c.id === customerActor.id);
  const addressCount = state.addresses.filter((a) => a.customerId === customerActor.id).length;
  if (!customer) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-lg font-bold text-white" aria-hidden>
          {customer.name.split(' ').pop()?.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-stone-900">{customer.name}</h3>
          <p className="text-sm text-stone-600">SĐT: {customer.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}</p>
        </div>
      </div>

      <div className="space-y-2 rounded-3xl border border-stone-200 bg-white p-4 shadow-xs">
        <h4 className="flex items-center gap-2 text-sm font-bold text-stone-900">
          <ShieldCheck size={18} className="text-emerald-700" />
          Tài khoản nhận hoàn tiền (đơn COD)
        </h4>
        {customer.refundAccount ? (
          <p className="text-sm text-stone-700">
            {customer.refundAccount.bankName} · <span className="font-mono font-bold">{maskAccount(customer.refundAccount.accountNumber)}</span>
          </p>
        ) : (
          <p className="text-sm text-amber-800">Chưa khai tài khoản. Hoàn tiền đơn COD cần tài khoản này.</p>
        )}
        <p className="text-xs text-stone-500">Số tài khoản luôn hiện dạng che. Chỉ Admin – Tài chính xem được đầy đủ.</p>
      </div>

      <button onClick={() => openModal({ type: 'address_book' })} className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-3.5 text-left shadow-xs hover:bg-stone-50">
        <span className="flex items-center gap-3">
          <MapPin size={18} className="text-stone-700" />
          <span>
            <span className="block text-sm font-bold text-stone-900">Sổ địa chỉ</span>
            <span className="text-xs text-stone-500">{addressCount}/10 địa chỉ</span>
          </span>
        </span>
        <ChevronRight size={16} className="text-stone-400" />
      </button>

      <p className="rounded-2xl border border-dashed border-stone-300 p-3 text-sm text-stone-600">
        Bản demo đang dùng tài khoản <strong>{customer.name}</strong>. Đăng nhập bằng SĐT + OTP mô phỏng và đổi tài khoản sẽ có ở Giai đoạn 3.
      </p>
    </div>
  );
}
