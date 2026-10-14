import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { SimBadge } from '../components/EmptyState';
import { Field, Input, PrimaryButton, SecondaryButton } from '../components/form';
import { DEMO_OTP, registerCustomer, requestOtp, verifyLogin } from '../domain/auth';
import { ACCOUNT_ROLE_LABEL, ADMIN_GROUP_LABEL, type UserAccount } from '../domain/types';
import { useStore } from '../store/AppDataContext';
import { useUi } from './UiContext';

type Step = 'phone' | 'otp' | 'register';

const roleLabel = (u: UserAccount) => (u.role === 'admin' && u.adminGroup ? `Admin – ${ADMIN_GROUP_LABEL[u.adminGroup]}` : ACCOUNT_ROLE_LABEL[u.role]);
const formatPhone = (p: string) => p.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');

/**
 * Đăng nhập demo (mục 5.9): SĐT + OTP mô phỏng (luôn là 123456), có danh sách tài khoản demo để bấm nhanh.
 * Khách hàng mới đăng ký được bằng SĐT + OTP. Tài khoản HTX, Admin, QLNN do Admin cấp.
 */
export function LoginScreen() {
  const { state, run } = useStore();
  const { login, showToast } = useUi();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sendOtp = (p = phone) => {
    const r = requestOtp(state, p);
    if (!r.ok) return setError(r.error);
    setPhone(p);
    setError(null);
    setOtp('');
    setStep('otp');
  };

  const confirm = () => {
    const r = verifyLogin(state, phone, otp);
    if (!r.ok) return setError(r.error);
    login(r.value.id);
    showToast(`Xin chào ${r.value.name}.`);
  };

  const register = () => {
    let id = '';
    const r = run(
      (s, at) => registerCustomer(s, { name, phone, otp }, at),
      (v) => {
        id = v.user.id;
        return v.state;
      },
    );
    if (!r.ok) return setError(r.error);
    login(id);
    showToast('Đăng ký thành công.');
  };

  const groups: { title: string; users: UserAccount[] }[] = [
    { title: 'Khách hàng', users: state.users.filter((u) => u.role === 'customer') },
    { title: 'HTX', users: state.users.filter((u) => u.role === 'coop') },
    { title: 'Admin', users: state.users.filter((u) => u.role === 'admin') },
    { title: 'Cơ quan QLNN', users: state.users.filter((u) => u.role === 'regulator') },
  ];

  return (
    <div className="mx-auto w-full max-w-[640px] space-y-5 p-4">
      <div className="space-y-1 rounded-3xl bg-emerald-950 p-5 text-white">
        <h1 className="text-xl font-bold">Đặc Sản Số Lào Cai</h1>
        <p className="text-sm text-emerald-100">Đăng nhập bằng số điện thoại và mã OTP.</p>
      </div>

      <section className="space-y-3 rounded-3xl border border-stone-200 bg-white p-4">
        <p className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-stone-400 bg-amber-50 p-2.5 text-sm text-stone-900">
          <SimBadge /> OTP mô phỏng: không gửi tin nhắn thật, mã luôn là <strong className="font-mono">{DEMO_OTP}</strong>
        </p>

        {step === 'phone' && (
          <>
            <Field label="Số điện thoại">
              <Input inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0900 000 000" onKeyDown={(e) => e.key === 'Enter' && sendOtp()} />
            </Field>
            <PrimaryButton className="w-full" onClick={() => sendOtp()}>
              Nhận mã OTP
            </PrimaryButton>
            <SecondaryButton
              className="w-full"
              onClick={() => {
                setError(null);
                setOtp('');
                setStep('register');
              }}
            >
              Khách hàng mới? Đăng ký
            </SecondaryButton>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-sm text-stone-700">
              Mã OTP mô phỏng cho số <strong>{formatPhone(phone.replace(/\D/g, ''))}</strong>.
            </p>
            <Field label="Mã OTP (6 số)">
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && confirm()} />
            </Field>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setStep('phone')}>Đổi số</SecondaryButton>
              <SecondaryButton onClick={() => setOtp(DEMO_OTP)}>Điền OTP mô phỏng</SecondaryButton>
              <PrimaryButton className="flex-1" onClick={confirm}>
                Đăng nhập
              </PrimaryButton>
            </div>
          </>
        )}

        {step === 'register' && (
          <>
            <Field label="Họ tên">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Số điện thoại">
              <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0900 000 000" />
            </Field>
            <Field label="Mã OTP (6 số)">
              <Input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            </Field>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setStep('phone')}>Quay lại</SecondaryButton>
              <SecondaryButton onClick={() => setOtp(DEMO_OTP)}>Điền OTP mô phỏng</SecondaryButton>
              <PrimaryButton className="flex-1" onClick={register}>
                Đăng ký
              </PrimaryButton>
            </div>
          </>
        )}

        {error && (
          <p className="text-sm font-semibold text-rose-700" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
          <ShieldCheck size={18} className="text-emerald-700" /> Tài khoản demo
        </h2>
        <p className="text-sm text-stone-600">Bấm một tài khoản để điền sẵn số điện thoại, sau đó nhập OTP mô phỏng. Đổi vai trò bằng cách đăng xuất rồi đăng nhập tài khoản khác.</p>
        {groups.map((g) => (
          <div key={g.title} className="space-y-1.5">
            <h3 className="text-sm font-semibold text-stone-600">{g.title}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {g.users.map((u) => (
                <li key={u.id}>
                  <button
                    disabled={u.status !== 'active'}
                    onClick={() => sendOtp(u.phone)}
                    className="flex min-h-14 w-full flex-col items-start justify-center rounded-2xl border border-stone-200 bg-white px-3 py-2 text-left hover:border-emerald-700 disabled:opacity-50"
                  >
                    <span className="text-sm font-bold text-stone-900">{u.name}</span>
                    <span className="text-xs text-stone-600">
                      {roleLabel(u)} · {formatPhone(u.phone)}
                      {u.status !== 'active' ? ' · đang khoá' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
