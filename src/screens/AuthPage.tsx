import React, { useState } from 'react';
import { Eye, EyeOff, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { googleAvailable } from '../lib/accountApi';
import { GoogleButton } from '../components/ui/GoogleButton';
import { isValidPhone, normalizePhone, PHONE_RULE } from '../domain/phone';
import '../styles/amora-home.css';

export interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onDone: () => void;
}

// Khớp với server/passwords.mjs (validatePassword)
const PASSWORD_RULE = '8–32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.';
const strongPassword = (p: string) =>
  p.length >= 8 && p.length <= 32 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^\w\s]/.test(p);

const field: React.CSSProperties = {
  width: '100%',
  minHeight: 46,
  border: '1px solid var(--ah-line)',
  borderRadius: 8,
  padding: '0 14px',
  background: '#fff',
  fontSize: 15,
};
const labelStyle: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 14, fontWeight: 600 };
const card: React.CSSProperties = {
  maxWidth: 440,
  margin: 'auto',
  background: 'var(--ah-surface)',
  border: '1px solid var(--ah-line)',
  borderRadius: 16,
  padding: '32px 28px',
};

/** Bước bắt buộc sau khi đăng nhập Google: bổ sung số điện thoại để giao hàng. */
const PhoneStep: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { user, savePhone, logout } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!isValidPhone(p)) return setError(`Số điện thoại không hợp lệ. ${PHONE_RULE}`);
    setBusy(true);
    setError('');
    try {
      await savePhone(p);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được số điện thoại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" style={card}>
      <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: '50%', background: '#E8F2EC', color: 'var(--ah-green)', marginBottom: 14 }}>
        <Phone size={24} />
      </span>
      <p className="ah-eyebrow">Bước cuối cùng</p>
      <h1 className="ah-h2" style={{ marginBottom: 6 }}>Thêm số điện thoại</h1>
      <p style={{ color: 'var(--ah-muted)', fontSize: 14, marginBottom: 20 }}>
        Xin chào <strong>{user?.name}</strong>. Nhập số điện thoại để nhà cung cấp và đơn vị giao hàng liên hệ khi giao đơn.
      </p>
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 14 }}>
        <label style={labelStyle}>
          Số điện thoại
          <input style={field} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0900 000 000" autoFocus required />
          <small style={{ fontWeight: 400, color: 'var(--ah-muted)', fontSize: 12 }}>{PHONE_RULE}</small>
        </label>
        {error && <p role="alert" style={{ color: '#A63D3D', fontSize: 14 }}>{error}</p>}
        <button type="submit" className="ah-btn ah-btn--solid" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Đang lưu…' : 'Lưu và tiếp tục'}
        </button>
      </form>
      <p style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--ah-muted)', marginTop: 16 }}>
        <ShieldCheck size={15} /> Số điện thoại chỉ dùng cho giao nhận và hỗ trợ đơn hàng.
      </p>
      <button type="button" onClick={logout} style={{ background: 'none', border: 0, color: 'var(--ah-green)', textDecoration: 'underline', minHeight: 44, cursor: 'pointer', fontSize: 14 }}>
        Dùng tài khoản khác
      </button>
    </main>
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onDone }) => {
  const { user, authLoading, authError, login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  if (authLoading) {
    return (
      <div className="ah" style={{ padding: '80px 16px', textAlign: 'center' }} role="status">
        Đang kiểm tra đăng nhập…
      </div>
    );
  }

  // Đã đăng nhập Google nhưng chưa có SĐT → bắt buộc bổ sung
  if (user && !user.phone) {
    return (
      <div className="ah" style={{ padding: '48px 16px 80px' }}>
        <PhoneStep onDone={onDone} />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const p = normalizePhone(phone);
    if (!isLogin && name.trim().length < 2) return setError('Vui lòng nhập họ tên.');
    if (!isValidPhone(p)) return setError(`Số điện thoại không hợp lệ. ${PHONE_RULE}`);
    if (!isLogin && !strongPassword(password)) return setError(`Mật khẩu cần ${PASSWORD_RULE}`);
    if (!isLogin && password !== confirm) return setError('Mật khẩu nhập lại chưa khớp.');
    if (isLogin && !password) return setError('Vui lòng nhập mật khẩu.');
    setBusy(true);
    try {
      if (isLogin) await login(p, password);
      else await register(name.trim(), p, password);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không kết nối được máy chủ. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const shownError = error || authError;

  return (
    <div className="ah" style={{ padding: '48px 16px 80px' }}>
      <main id="main-content" style={card}>
        <p className="ah-eyebrow">Tài khoản Đặc Sản Số</p>
        <h1 className="ah-h2" style={{ marginBottom: 6 }}>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p style={{ color: 'var(--ah-muted)', fontSize: 14, marginBottom: 20 }}>
          {isLogin ? 'Xem đơn hàng, địa chỉ và sản phẩm yêu thích của bạn.' : 'Chỉ mất 30 giây để bắt đầu mua sắm.'}
        </p>

        {googleAvailable && (
          <>
            <GoogleButton
              label={isLogin ? 'Đăng nhập bằng Google' : 'Đăng ký bằng Google'}
              onSuccess={onDone}
              onError={setError}
            />
            <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ah-muted)', fontSize: 12, margin: '18px 0' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--ah-line)' }} />
              hoặc dùng số điện thoại
              <span style={{ flex: 1, height: 1, background: 'var(--ah-line)' }} />
            </div>
          </>
        )}

        <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 14 }}>
          {!isLogin && (
            <label style={labelStyle}>
              Họ và tên
              <input style={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} required />
            </label>
          )}
          <label style={labelStyle}>
            Số điện thoại
            <input style={field} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0900 000 000" maxLength={20} required />
          </label>
          <label style={labelStyle}>
            Mật khẩu
            <span style={{ position: 'relative', display: 'block' }}>
              <input
                style={{ ...field, paddingRight: 48 }}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                maxLength={32}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPw}
                style={{ position: 'absolute', right: 0, top: 0, width: 46, height: 46, display: 'grid', placeItems: 'center', background: 'none', border: 0, cursor: 'pointer', color: 'var(--ah-muted)' }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            {!isLogin && <small style={{ fontWeight: 400, color: 'var(--ah-muted)', fontSize: 12 }}>{PASSWORD_RULE}</small>}
          </label>
          {!isLogin && (
            <label style={labelStyle}>
              Nhập lại mật khẩu
              <input style={field} type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={32} required />
            </label>
          )}

          {shownError && <p role="alert" style={{ color: '#A63D3D', fontSize: 14 }}>{shownError}</p>}

          <button type="submit" className="ah-btn ah-btn--solid" disabled={busy} style={{ width: '100%', marginTop: 4 }}>
            {busy ? 'Đang xử lý…' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, marginTop: 18, color: 'var(--ah-muted)' }}>
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? 'register' : 'login');
              setError('');
            }}
            style={{ background: 'none', border: 0, color: 'var(--ah-green)', fontWeight: 700, cursor: 'pointer', minHeight: 44, textDecoration: 'underline' }}
          >
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </p>
      </main>
    </div>
  );
};
