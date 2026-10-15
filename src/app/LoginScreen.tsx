import { useState } from 'react';
import { BrandEmblem, BrocadeBand, Ornament, SectionHeading } from '../components/Brand';
import { SimBadge } from '../components/EmptyState';
import { LandscapeArt } from '../components/LandscapeArt';
import { Field, Input, PrimaryButton, SecondaryButton } from '../components/form';
import { DEMO_OTP, googleLogin, registerCustomer, registerGoogleCustomer, requestOtp, verifyLogin, type GoogleProfile } from '../domain/auth';
import { formatPhone, PHONE_RULE } from '../domain/phone';
import { ACCOUNT_ROLE_LABEL, ADMIN_GROUP_LABEL, type UserAccount } from '../domain/types';
import { useStore } from '../store/AppDataContext';
import { GoogleSignIn } from './GoogleSignIn';
import { useUi } from './UiContext';

type Step = 'phone' | 'otp' | 'register';

const roleLabel = (u: UserAccount) => (u.role === 'admin' && u.adminGroup ? `Admin – ${ADMIN_GROUP_LABEL[u.adminGroup]}` : ACCOUNT_ROLE_LABEL[u.role]);

/** Màu vòng tròn đại diện theo vai trò (chỉ trang trí). */
const AVATAR: Record<UserAccount['role'], string> = {
  customer: 'bg-forest-900 text-champagne-200',
  coop: 'bg-champagne-300 text-forest-950',
  admin: 'bg-ink text-champagne-200',
  regulator: 'bg-forest-100 text-forest-900',
};
const initialsOf = (name: string) => {
  const words = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words[words.length - 1][0] ?? '') : '')).toUpperCase();
};

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

  const confirmOtp = () => {
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

  // Đăng nhập bằng Google: tài khoản đã có thì vào luôn, lần đầu thì tạo tài khoản khách hàng.
  const googleSignIn = (profile: GoogleProfile) => {
    const found = googleLogin(state, profile);
    if (!found.ok) return setError(found.error);
    if (found.value) {
      login(found.value.id);
      showToast(`Xin chào ${found.value.name}.`);
      return;
    }
    let id = '';
    const r = run(
      (s, at) => registerGoogleCustomer(s, profile, at),
      (v) => {
        id = v.user.id;
        return v.state;
      },
    );
    if (!r.ok) return setError(r.error);
    login(id);
    showToast(`Chào mừng ${r.value.user.name}. Đã tạo tài khoản khách hàng.`);
  };

  // Tài khoản đăng nhập bằng Google là của người dùng thật, không đưa vào danh sách tài khoản demo.
  const groups: { title: string; users: UserAccount[] }[] = [
    { title: 'Khách hàng', users: state.users.filter((u) => u.role === 'customer' && !u.google) },
    { title: 'HTX', users: state.users.filter((u) => u.role === 'coop') },
    { title: 'Admin', users: state.users.filter((u) => u.role === 'admin') },
    { title: 'Cơ quan QLNN', users: state.users.filter((u) => u.role === 'regulator') },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 md:px-6 md:pt-6 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-8">
      <div className="relative overflow-hidden rounded-[32px] bg-forest-950 text-white shadow-[0_24px_60px_rgb(14,37,27,0.28)] lg:sticky lg:top-[calc(var(--app-header-h,0px)+1.5rem)]">
        <div aria-hidden="true" className="lattice absolute inset-0" />
        <LandscapeArt className="absolute inset-0 h-full w-full" />
        <div className="relative flex flex-col items-center px-6 pt-8 pb-24 text-center sm:pb-32 lg:pt-16 lg:pb-56">
          <BrandEmblem size={68} className="drop-shadow-[0_10px_24px_rgb(0,0,0,0.35)] lg:h-20 lg:w-20" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-champagne-300">Đặc sản vùng cao, giao tại Hà Nội</p>
          <h1 className="text-gold mt-2 font-display text-4xl font-semibold leading-tight md:text-5xl">
            Đặc Sản Số <span className="block italic sm:inline">Lào Cai</span>
          </h1>
          <Ornament tone="dark" className="mt-3" />
          <p className="mt-3 max-w-xs text-sm text-forest-100">Đăng nhập bằng số điện thoại và mã OTP.</p>
        </div>
        <BrocadeBand className="absolute inset-x-0 bottom-0" />
      </div>

      <div className="mt-5 space-y-6 lg:mt-0">
        <section
          className="space-y-3 rounded-[28px] border border-champagne-200 bg-white p-5 shadow-[0_14px_34px_rgb(31,77,58,0.08)]"
          aria-labelledby="dang-nhap"
        >
          <h2 id="dang-nhap" className="font-display text-2xl font-semibold text-ink">
            {step === 'register' ? 'Đăng ký tài khoản khách' : 'Đăng nhập'}
          </h2>
          <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-champagne-500 bg-champagne-50 p-2.5 text-sm text-ink">
            <SimBadge /> OTP mô phỏng: không gửi tin nhắn thật, mã luôn là <strong className="font-mono">{DEMO_OTP}</strong>
          </p>

          {step === 'phone' && (
            <>
              <Field label="Số điện thoại" hint={PHONE_RULE}>
                <Input
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0900 000 000"
                  onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                />
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
              <div className="flex items-center gap-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-champagne-700" aria-hidden="true">
                <span className="h-px flex-1 bg-champagne-200" />
                hoặc
                <span className="h-px flex-1 bg-champagne-200" />
              </div>
              <GoogleSignIn onProfile={googleSignIn} />
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-sm text-stone-700">
                Mã OTP mô phỏng cho số <strong>{formatPhone(phone)}</strong>.
              </p>
              <Field label="Mã OTP (6 số)">
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && confirmOtp()}
                />
              </Field>
              <div className="flex gap-2">
                <SecondaryButton onClick={() => setStep('phone')}>Đổi số</SecondaryButton>
                <SecondaryButton onClick={() => setOtp(DEMO_OTP)}>Điền OTP mô phỏng</SecondaryButton>
                <PrimaryButton className="flex-1" onClick={confirmOtp}>
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
              <Field label="Số điện thoại" hint={PHONE_RULE}>
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

        <section className="space-y-3" aria-labelledby="tai-khoan-demo">
          <SectionHeading id="tai-khoan-demo" eyebrow="Bản demo" title="Tài khoản demo" />
          <p className="text-sm text-stone-600">
            Bấm một tài khoản để điền sẵn số điện thoại, sau đó nhập OTP mô phỏng. Đổi vai trò bằng cách đăng xuất rồi đăng nhập tài khoản khác.
          </p>
          {groups.map((g) => (
            <div key={g.title} className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne-700">{g.title}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {g.users.map((u) => (
                  <li key={u.id}>
                    <button
                      disabled={u.status !== 'active'}
                      onClick={() => sendOtp(u.phone)}
                      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-champagne-200 bg-white/90 px-3 py-2 text-left transition hover:border-champagne-500 hover:shadow-[0_8px_20px_rgb(31,77,58,0.08)] disabled:opacity-50"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ring-1 ring-champagne-400/60 ${AVATAR[u.role]}`}
                      >
                        {initialsOf(u.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink">{u.name}</span>
                        <span className="block truncate text-xs text-stone-600">
                          {roleLabel(u)} · {formatPhone(u.phone)}
                          {u.status !== 'active' ? ' · đang khoá' : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
