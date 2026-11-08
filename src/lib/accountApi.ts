/**
 * Tài khoản khách hàng — nối với máy chủ thật (server/app.mjs → database Postgres/Supabase khi deploy).
 *  - Đăng ký / đăng nhập bằng SĐT + mật khẩu: /api/v1/auth/password/{register,login}
 *  - Đăng nhập Google qua Supabase OAuth:   /api/v1/auth/supabase
 *  - Khách Google bổ sung SĐT lần đầu:      /api/v1/me/phone/first
 */
import type { User } from '../mock/types';
import type { UserAccount } from '../domain/types';
import { api, acceptLogin, backendLogout, hasBackendSession, type LoginResponse } from '../store/backend';
import { supabase } from '../store/supabase';
import { GOOGLE_CLIENT_ID } from '../store/serviceStatus';

const GOOGLE_PENDING = 'dac-san-so-lao-cai:google-oauth';
const PROFILE_PREFIX = 'dss_profile_';

/** Địa chỉ & yêu thích vẫn giữ trên trình duyệt (theo từng tài khoản) cho đến khi có API riêng. */
function loadProfile(id: string): Pick<User, 'addresses' | 'favoriteProductIds'> {
  try {
    const raw = localStorage.getItem(PROFILE_PREFIX + id);
    if (raw) return JSON.parse(raw);
  } catch {
    /* bỏ qua */
  }
  return { addresses: [], favoriteProductIds: [] };
}

export function saveProfile(user: User) {
  try {
    localStorage.setItem(
      PROFILE_PREFIX + user.id,
      JSON.stringify({ addresses: user.addresses, favoriteProductIds: user.favoriteProductIds }),
    );
  } catch {
    /* bỏ qua */
  }
}

function toUser(account: UserAccount): User {
  return { id: account.id, name: account.name, phone: account.phone || '', ...loadProfile(account.id) };
}

export async function loginWithPassword(phone: string, password: string): Promise<User> {
  const result = await api<LoginResponse>('/api/v1/auth/password/login', { phone, password });
  acceptLogin(result);
  return toUser(result.user);
}

export async function registerWithPassword(name: string, phone: string, password: string): Promise<User> {
  const result = await api<LoginResponse>('/api/v1/auth/password/register', { name, phone, password });
  acceptLogin(result);
  return toUser(result.user);
}

/** Khôi phục phiên đã đăng nhập (sau khi tải lại trang). */
export async function restoreAccount(): Promise<User | null> {
  if (!hasBackendSession()) return null;
  try {
    const { user } = await api<{ user: UserAccount }>('/api/v1/me');
    return toUser(user);
  } catch {
    return null;
  }
}

/**
 * Cách đăng nhập Google đang dùng:
 *  - 'supabase': có VITE_SUPABASE_* (bản Vercel) → chuyển trang qua Supabase OAuth
 *  - 'gis':      chỉ có VITE_GOOGLE_CLIENT_ID (máy dev) → nút Google chính chủ, máy chủ tự xác minh
 */
export const googleMode: 'supabase' | 'gis' | null = supabase ? 'supabase' : GOOGLE_CLIENT_ID ? 'gis' : null;
export const googleAvailable = googleMode !== null;

interface GoogleIdApi {
  initialize(options: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode: 'popup'; auto_select: boolean }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}
let gisLibrary: Promise<GoogleIdApi> | null = null;

/** Nạp thư viện Google Identity Services (chỉ khi cần). */
export function loadGoogleIdentity(): Promise<GoogleIdApi> {
  const w = window as unknown as { google?: { accounts?: { id?: GoogleIdApi } } };
  if (w.google?.accounts?.id) return Promise.resolve(w.google.accounts.id);
  gisLibrary ??= new Promise<GoogleIdApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=vi';
    script.async = true;
    script.onload = () => (w.google?.accounts?.id ? resolve(w.google.accounts.id) : reject(new Error('Không tải được đăng nhập Google.')));
    script.onerror = () => {
      script.remove();
      gisLibrary = null;
      reject(new Error('Không kết nối được Google. Kiểm tra mạng rồi thử lại.'));
    };
    document.head.appendChild(script);
  });
  return gisLibrary;
}

export const googleClientId = GOOGLE_CLIENT_ID;

/** Google trả về credential (ID token) → máy chủ xác minh → tài khoản cửa hàng. */
export async function loginWithGoogleCredential(credential: string): Promise<User> {
  const result = await api<LoginResponse>('/api/v1/auth/google', { credential });
  acceptLogin(result);
  return toUser(result.user);
}

/** Bước 1: chuyển sang trang chọn tài khoản Google. */
export async function startGoogleLogin(returnTo = '/dang-nhap') {
  if (!supabase) throw new Error('Đăng nhập Google chưa được cấu hình.');
  sessionStorage.setItem(GOOGLE_PENDING, '1');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + returnTo, queryParams: { prompt: 'select_account' } },
  });
  if (error) {
    sessionStorage.removeItem(GOOGLE_PENDING);
    throw error;
  }
}

/** Bước 2: Google chuyển về — đổi phiên Supabase lấy tài khoản của cửa hàng. Trả null nếu không có gì để xử lý. */
export async function completeGoogleLogin(): Promise<User | null> {
  if (!supabase || !sessionStorage.getItem(GOOGLE_PENDING)) return null;
  sessionStorage.removeItem(GOOGLE_PENDING);
  if (new URLSearchParams(window.location.search).has('error')) {
    throw new Error('Đăng nhập Google chưa hoàn tất. Vui lòng thử lại.');
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('Chưa nhận được phiên Google. Vui lòng chọn tài khoản lại.');
  const session = data.session;
  const result = await api<Omit<LoginResponse, 'accessToken' | 'refreshToken'>>('/api/v1/auth/supabase', {
    accessToken: session.access_token,
  });
  acceptLogin({ ...result, accessToken: session.access_token, refreshToken: session.refresh_token, authProvider: 'supabase' });
  return toUser(result.user);
}

/** Khách đăng nhập Google: lưu số điện thoại lần đầu. */
export async function saveFirstPhone(phone: string): Promise<User> {
  await api('/api/v1/me/phone/first', { phone });
  const { user } = await api<{ user: UserAccount }>('/api/v1/me');
  return toUser(user);
}

export async function logoutAccount() {
  await backendLogout();
}
