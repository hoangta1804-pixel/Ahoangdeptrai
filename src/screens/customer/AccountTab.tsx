import { useState } from 'react';
import { ChevronRight, LogOut, MapPin, UserRound } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BrocadeBand } from '../../components/Brand';
import { Field, Input, PrimaryButton, SecondaryButton } from '../../components/form';
import { updateCustomerProfile } from '../../domain/account';
import { loginIdentityLabel } from '../../domain/auth';
import { useStore } from '../../store/AppDataContext';
import { BankLinkSection } from './BankLinkSection';

/** Tài khoản của khách: thông tin cá nhân (FR-TK-03), liên kết ngân hàng nhận hoàn (mô phỏng), sổ địa chỉ (FR-TK-04), đăng xuất. */
export function AccountTab() {
  const { state, run } = useStore();
  const { customerActor, openModal, logout, showToast } = useUi();
  const customer = state.customers.find((c) => c.id === customerActor.id);
  const account = state.users.find((u) => u.id === customerActor.userId);
  const addressCount = state.addresses.filter((a) => a.customerId === customerActor.id).length;
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(customer?.name ?? '');
  if (!customer) return null;
  // Chữ viết tắt cho vòng tròn đại diện: chữ đầu của từ đầu và từ cuối trong tên.
  const words = customer.name.trim().split(/\s+/);
  const initials = (words[0]?.[0] ?? '') + (words.length > 1 ? (words[words.length - 1][0] ?? '') : '');

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-5 pb-8 md:px-6 md:pt-8">
      <section className="relative overflow-hidden rounded-[28px] bg-forest-950 px-5 pt-5 pb-8 text-white shadow-[0_20px_50px_rgb(14,37,27,0.25)]" aria-labelledby="thong-tin-ca-nhan">
        <div aria-hidden="true" className="lattice absolute inset-0" />
        <div className="relative flex items-center gap-4">
          <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest-900 font-display text-2xl font-semibold text-champagne-200 ring-2 ring-champagne-400/80 ring-offset-2 ring-offset-forest-950">
            {initials.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="thong-tin-ca-nhan" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-champagne-300">
              <UserRound size={14} aria-hidden="true" /> Thông tin cá nhân
            </h2>
            <p className="font-display text-xl font-semibold leading-tight sm:text-2xl">{customer.name}</p>
          </div>
        </div>
        <div className="relative mt-3 flex items-end justify-between gap-3">
          <p className="text-sm text-forest-100">
            {account?.google
              ? `Đăng nhập bằng ${loginIdentityLabel(account)}`
              : `SĐT: ${customer.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')} (dùng để đăng nhập, không đổi tại đây)`}
          </p>
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="min-h-11 shrink-0 rounded-full border border-champagne-400/60 px-4 text-sm font-semibold text-champagne-100 hover:bg-white/5"
            >
              Sửa
            </button>
          )}
        </div>
        <BrocadeBand className="absolute inset-x-0 bottom-0" />
      </section>

      {editingName && (
        <section className="space-y-2 rounded-3xl border border-champagne-200 bg-white p-4 shadow-xs" aria-label="Sửa thông tin cá nhân">
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
        </section>
      )}

      <BankLinkSection />

      <button onClick={() => openModal({ type: 'address_book' })} className="flex min-h-14 w-full items-center justify-between rounded-3xl border border-champagne-200 bg-white p-4 text-left shadow-xs hover:border-champagne-400">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-900 text-champagne-300">
            <MapPin size={17} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold text-ink">Sổ địa chỉ</span>
            <span className="text-xs text-muted">{addressCount}/10 địa chỉ</span>
          </span>
        </span>
        <ChevronRight size={16} className="text-muted" />
      </button>

      <button onClick={logout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-white/70 text-sm font-bold text-rose-800 hover:bg-rose-50">
        <LogOut size={16} />
        Đăng xuất
      </button>
    </div>
  );
}
