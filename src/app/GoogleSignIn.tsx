import { useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { SimBadge } from '../components/EmptyState';
import { Field, Input, PrimaryButton, SecondaryButton } from '../components/form';
import { isEmail, maskEmail, type GoogleProfile } from '../domain/auth';

/** Client ID của Google (công khai, không phải bí mật). Đặt ở Vercel: VITE_GOOGLE_CLIENT_ID. Chưa có thì dùng bản mô phỏng. */
const CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

interface GoogleIdApi {
  initialize(config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: 'popup';
    auto_select?: boolean;
    context?: 'signin';
    itp_support?: boolean;
  }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

let gisPromise: Promise<GoogleIdApi> | null = null;

/** Tải thư viện Google Identity Services (chỉ khi đã có Client ID). */
function loadGis(): Promise<GoogleIdApi> {
  const ready = window.google?.accounts?.id;
  if (ready) return Promise.resolve(ready);
  gisPromise ??= new Promise<GoogleIdApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else reject(new Error('Google Identity Services không sẵn sàng'));
    };
    script.onerror = () => {
      gisPromise = null;
      reject(new Error('Không tải được Google Identity Services'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

/** Mã băm SHA-256 (hex, 32 ký tự) cho tài khoản Google mô phỏng. */
async function hashHex(text: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }
  // Trang không chạy https (crypto.subtle không có): băm FNV-1a, đủ cho bản mô phỏng.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (const ch of text) {
    h1 = Math.imul(h1 ^ ch.charCodeAt(0), 16777619) >>> 0;
    h2 = Math.imul(h2 ^ ch.charCodeAt(0), 2246822519) >>> 0;
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(2);
}

/**
 * Đăng nhập bằng Google cho khách hàng.
 * - Có Client ID: nút chính chủ của Google; ID token được /api/auth/google xác minh với Google rồi mới đăng nhập.
 * - Chưa có Client ID, không tải được thư viện Google, hoặc mở trên claude.ai: bản mô phỏng (nhập Gmail, không kết nối Google).
 * Dữ liệu demo chỉ lưu tên, email đã che và mã đã băm.
 */
export function GoogleSignIn({ onProfile }: { onProfile: (profile: GoogleProfile) => void }) {
  const [mode, setMode] = useState<'real' | 'sim'>(CLIENT_ID ? 'real' : 'sim');
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const onProfileRef = useRef(onProfile);
  onProfileRef.current = onProfile;

  useEffect(() => {
    if (mode !== 'real') return;
    let cancelled = false;
    loadGis()
      .then((gis) => {
        const el = holder.current;
        if (cancelled || !el) return;
        gis.initialize({
          client_id: CLIENT_ID,
          ux_mode: 'popup',
          auto_select: false,
          context: 'signin',
          itp_support: true,
          callback: async ({ credential }) => {
            if (!credential) return setError('Google không trả về thông tin đăng nhập. Vui lòng thử lại.');
            setBusy(true);
            setError(null);
            try {
              const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
              const body = (await res.json().catch(() => null)) as { id?: string; name?: string; emailMasked?: string; error?: string } | null;
              if (!res.ok || !body?.id) return setError(body?.error ?? 'Không xác minh được đăng nhập Google.');
              onProfileRef.current({ id: body.id, name: body.name ?? '', emailMasked: body.emailMasked ?? '', simulated: false });
            } catch {
              setError('Không kết nối được máy chủ để xác minh đăng nhập Google.');
            } finally {
              setBusy(false);
            }
          },
        });
        gis.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', logo_alignment: 'left', locale: 'vi', width: Math.min(400, el.clientWidth || 320) });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadFailed(true);
        setMode('sim');
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const submitSimulated = async () => {
    if (!isEmail(email)) return setError('Email không hợp lệ. Ví dụ: ten@gmail.com');
    setError(null);
    const normalized = email.trim().toLowerCase();
    const id = await hashHex(`sim:${normalized}`);
    onProfileRef.current({ id, name: name.trim() || normalized.split('@')[0], emailMasked: maskEmail(normalized), simulated: true });
  };

  if (mode === 'real') {
    return (
      <div className="space-y-2">
        <div ref={holder} className="flex min-h-11 justify-center" aria-busy={busy} />
        <p className="text-center text-xs text-muted">Dành cho khách hàng. Dữ liệu demo chỉ lưu tên và email đã che.</p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <SecondaryButton type="button" className="flex w-full items-center justify-center gap-2" onClick={() => setOpen(true)}>
          <Mail size={16} aria-hidden="true" /> Tiếp tục với Gmail <SimBadge />
        </SecondaryButton>
      ) : (
        <div className="space-y-3 rounded-2xl border border-champagne-200 bg-champagne-50/60 p-3" role="group" aria-label="Đăng nhập Gmail mô phỏng">
          <p className="flex flex-wrap items-center gap-2 text-sm text-stone-700">
            <SimBadge /> Không kết nối Google, không cần mật khẩu. App chỉ lưu tên và email đã che.
          </p>
          <Field label="Địa chỉ Gmail">
            <Input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@gmail.com" onKeyDown={(e) => e.key === 'Enter' && submitSimulated()} />
          </Field>
          <Field label="Tên hiển thị (không bắt buộc)">
            <Input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <SecondaryButton
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Huỷ
            </SecondaryButton>
            <PrimaryButton type="button" className="flex-1" onClick={submitSimulated}>
              Tiếp tục
            </PrimaryButton>
          </div>
        </div>
      )}
      {loadFailed && <p className="text-xs text-muted">Không tải được nút đăng nhập của Google, đang dùng bản mô phỏng.</p>}
      {error && (
        <p role="alert" className="text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
