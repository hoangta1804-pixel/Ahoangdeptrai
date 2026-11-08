import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../stores/authStore';
import { googleMode, googleClientId, loadGoogleIdentity } from '../../lib/accountApi';

export interface GoogleButtonProps {
  label: string;
  /** Gọi khi đăng nhập Google xong (đường nút chính chủ không chuyển trang). */
  onSuccess: () => void;
  onError: (message: string) => void;
}

/** Logo "G" 4 màu của Google. */
const GoogleLogo: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export const GoogleButton: React.FC<GoogleButtonProps> = ({ label, onSuccess, onError }) => {
  const { loginWithGoogle, loginWithGoogleToken } = useAuth();
  const holder = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const cb = useRef({ onSuccess, onError });
  cb.current = { onSuccess, onError };

  // Đường 'gis': Google tự vẽ nút trong khung; bấm → popup chọn tài khoản → credential
  useEffect(() => {
    if (googleMode !== 'gis') return;
    let cancelled = false;
    let stopResize = () => {};
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !holder.current) return;
        google.initialize({
          client_id: googleClientId,
          ux_mode: 'popup',
          auto_select: false,
          callback: async ({ credential }) => {
            if (cancelled) return;
            if (!credential) return cb.current.onError('Google chưa trả về thông tin đăng nhập.');
            setBusy(true);
            try {
              await loginWithGoogleToken(credential);
              if (!cancelled) cb.current.onSuccess();
            } catch (e) {
              if (!cancelled) cb.current.onError(e instanceof Error ? e.message : 'Không đăng nhập được bằng Google.');
            } finally {
              if (!cancelled) setBusy(false);
            }
          },
        });
        let lastWidth = -1;
        const render = () => {
          const el = holder.current;
          if (cancelled || !el) return;
          const width = Math.floor(el.clientWidth);
          if (width <= 0 || width === lastWidth) return;
          lastWidth = width;
          el.replaceChildren();
          google.renderButton(el, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            locale: 'vi',
            width: Math.min(400, width),
          });
        };
        render();
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(render);
          ro.observe(holder.current);
          stopResize = () => ro.disconnect();
        }
      })
      .catch((e) => !cancelled && cb.current.onError(e.message));
    return () => {
      cancelled = true;
      stopResize();
    };
  }, [loginWithGoogleToken]);

  if (googleMode === 'gis') {
    return (
      <div aria-busy={busy}>
        <div ref={holder} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
        {busy && <p role="status" style={{ textAlign: 'center', fontSize: 13, color: 'var(--ah-muted)', marginTop: 6 }}>Đang đăng nhập…</p>}
      </div>
    );
  }

  if (googleMode === 'supabase') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await loginWithGoogle(); // chuyển trang sang Google, quay về /dang-nhap
          } catch (e) {
            onError(e instanceof Error ? e.message : 'Không mở được đăng nhập Google.');
            setBusy(false);
          }
        }}
        style={{ width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1px solid var(--ah-line)', borderRadius: 8, background: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#1a2b20' }}
      >
        <GoogleLogo />
        {busy ? 'Đang chuyển sang Google…' : label}
      </button>
    );
  }

  return null;
};
