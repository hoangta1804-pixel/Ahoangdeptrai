import { useState } from 'react';
import { ChevronRight, LogOut, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { Field, Input, PrimaryButton, SecondaryButton } from '../../components/form';
import { viewRefundAccount } from '../../domain/access';
import { setRefundAccount, updateCustomerProfile } from '../../domain/account';
import { useStore } from '../../store/AppDataContext';

/** Tài khoản của khách: thông tin cá nhân (FR-TK-03), tài khoản nhận hoàn, sổ địa chỉ (FR-TK-04), đăng xuất. */
export function AccountTab() {
  const { state, run } = useStore();
  const { customerActor, openModal, logout, showToast } = useUi();
  const customer = state.customers.find((c) => c.id === customerActor.id);
  const acc = viewRefundAccount(state, customerActor, customerActor.id ?? '');
  const addressCount = state.addresses.filter((a) => a.customerId === customerActor.id).length;
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(customer?.name ?? '');
  const [editingBank, setEditingBank] = useState(false);
  const [bank, setBank] = useState({ bankName: customer?.refundAccount?.bankName ?? '', accountNumber: '', holder: customer?.refundAccount?.holder ?? '' });
  if (!customer) return null;

  return (
    <div className="space-y-4 p-4">
      <section className="space-y-2 rounded-3xl border border-stone-200 bg-white p-4 shadow-xs">
        <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900">
          <UserRound size={18} className="text-emerald-700" /> Thông tin cá nhân
        </h3>
        {editingName ? (
          <>
            <Field label="Họ tên">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setEditingName(false)}>Huỷ</SecondaryButton>
              <PrimaryButton
                className="flex-1"
                onClick={() => {
                  const r = run((s) => updateCustomerProfile(s, customerActor, name));
                  showToast(r.ok ? 'Đã lưu thông tin.' : r.error);
                  if (r.ok) setEditingName(false);
                }}
              >
                Lưu
              </PrimaryButton>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold text-stone-900">{customer.name}</p>
              <p className="text-sm text-stone-600">SĐT: {customer.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')} (dùng để đăng nhập, không đổi tại đây)</p>
            </div>
            <SecondaryButton onClick={() => setEditingName(true)}>Sửa</SecondaryButton>
          </div>
        )}
      </section>

      <section className="space-y-2 rounded-3xl border border-stone-200 bg-white p-4 shadow-xs">
        <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900">
          <ShieldCheck size={18} className="text-emerald-700" /> Tài khoản nhận hoàn tiền (đơn COD)
        </h3>
        {editingBank ? (
          <>
            <Field label="Ngân hàng">
              <Input value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
            </Field>
            <Field label="Số tài khoản">
              <Input inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} />
            </Field>
            <Field label="Chủ tài khoản">
              <Input value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setEditingBank(false)}>Huỷ</SecondaryButton>
              <PrimaryButton
                className="flex-1"
                onClick={() => {
                  const r = run((s) => setRefundAccount(s, customerActor, bank));
                  showToast(r.ok ? 'Đã lưu tài khoản nhận hoàn.' : r.error);
                  if (r.ok) setEditingBank(false);
                }}
              >
                Lưu
              </PrimaryButton>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {acc.ok && acc.value ? (
              <p className="text-sm text-stone-700">
                {acc.value.bankName} · <span className="font-mono font-bold">{acc.value.accountNumber}</span>
              </p>
            ) : (
              <p className="text-sm text-amber-800">Chưa khai tài khoản. Hoàn tiền đơn COD cần tài khoản này.</p>
            )}
            <SecondaryButton onClick={() => setEditingBank(true)}>{acc.ok && acc.value ? 'Đổi' : 'Khai báo'}</SecondaryButton>
          </div>
        )}
        <p className="text-xs text-stone-500">Số tài khoản luôn hiện dạng che. Chỉ Admin – Tài chính xem được đầy đủ.</p>
      </section>

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

      <button onClick={logout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 text-sm font-bold text-rose-800 hover:bg-rose-50">
        <LogOut size={16} />
        Đăng xuất
      </button>
    </div>
  );
}
