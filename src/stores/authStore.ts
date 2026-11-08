import { useSyncExternalStore } from 'react';
import { User, Address } from '../mock/types';
import { mockUsers } from '../mock/users';
import {
  loginWithPassword,
  registerWithPassword,
  restoreAccount,
  completeGoogleLogin,
  startGoogleLogin,
  saveFirstPhone,
  logoutAccount,
  saveProfile,
  loginWithGoogleCredential,
} from '../lib/accountApi';

export type UserPersona = 'guest' | 'user_with_address' | 'user_no_address';

export interface AuthState {
  persona: UserPersona;
  user: User | null;
  otpPhone: string;
  isOtpOpen: boolean;
  otpCountdown: number;
  otpResendCount: number;
  pendingRedirectUrl?: string;
  setPersona: (p: UserPersona) => void;
  openOtpModal: (phone: string, targetRedirect?: string) => void;
  closeOtpModal: () => void;
  verifyOtp: (code: string) => { success: boolean; message?: string };
  resendOtp: () => { success: boolean; message?: string };
  addAddress: (addr: Omit<Address, 'id'>) => Address;
  setDefaultAddress: (addrId: string) => void;
  toggleFavorite: (productId: string) => void;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  /** Đang khôi phục phiên / xử lý Google chuyển về. */
  authLoading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  /** Đường Google Identity Services (nút Google chính chủ). */
  loginWithGoogleToken: (credential: string) => Promise<void>;
  /** Khách Google lưu số điện thoại lần đầu. */
  savePhone: (phone: string) => Promise<void>;
}

export const useAuthStore = (function createAuthStore() {
  // Mặc định: khách chưa đăng nhập; phiên máy chủ (nếu có) được khôi phục bất đồng bộ bên dưới.
  let user: User | null = null;
  let persona: UserPersona = 'guest';
  let authLoading = typeof window !== 'undefined';
  let authError: string | null = null;
  let otpPhone = '';
  let isOtpOpen = false;
  let otpCountdown = 120;
  let otpResendCount = 0;
  let pendingRedirectUrl: string | undefined = undefined;
  let timerInterval: any = null;

  let listeners: Array<() => void> = [];

  function notify() {
    listeners.forEach((l) => l());
  }

  function startTimer() {
    clearInterval(timerInterval);
    otpCountdown = 120;
    updateSnapshot();
    timerInterval = setInterval(() => {
      if (otpCountdown > 0) {
        otpCountdown--;
        updateSnapshot();
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  const setPersona = (newPersona: UserPersona) => {
    persona = newPersona;
    if (newPersona === 'guest') {
      user = null;
    } else {
      user = { ...mockUsers[newPersona] };
    }
    updateSnapshot();
  };

  const openOtpModal = (phone: string, targetRedirect?: string) => {
    otpPhone = phone;
    pendingRedirectUrl = targetRedirect;
    isOtpOpen = true;
    otpResendCount = 0;
    startTimer();
    updateSnapshot();
  };

  const closeOtpModal = () => {
    isOtpOpen = false;
    clearInterval(timerInterval);
    updateSnapshot();
  };

  const verifyOtp = (code: string) => {
    if (code !== '123456') {
      return { success: false, message: 'Mã OTP không chính xác. Vui lòng thử lại.' };
    }
    // Giả lập đăng nhập thành công
    const phone = otpPhone || '0912345678';
    user = user ?? { id: `otp_${phone}`, name: 'Khách hàng', phone, addresses: [], favoriteProductIds: [] };
    persona = user.addresses.length ? 'user_with_address' : 'user_no_address';
    isOtpOpen = false;
    clearInterval(timerInterval);
    updateSnapshot();
    return { success: true };
  };

  const resendOtp = () => {
    if (otpResendCount >= 3) {
      return {
        success: false,
        message: 'Bạn đã yêu cầu gửi lại quá 3 lần. Vui lòng thử lại sau 15 phút.',
      };
    }
    otpResendCount++;
    startTimer();
    updateSnapshot();
    return { success: true, message: 'Đã gửi lại mã xác thực.' };
  };

  const addAddress = (newAddr: Omit<Address, 'id'>) => {
    if (!user) throw new Error('Not logged in');
    const created: Address = {
      ...newAddr,
      id: `addr_${Date.now()}`,
    };
    const addresses = [...user.addresses];
    if (created.isDefault) {
      addresses.forEach((a) => (a.isDefault = false));
    }
    addresses.push(created);
    user = { ...user, addresses };
    updateSnapshot();
    return created;
  };

  const setDefaultAddress = (addrId: string) => {
    if (!user) return;
    user = {
      ...user,
      addresses: user.addresses.map((a) => ({
        ...a,
        isDefault: a.id === addrId,
      })),
    };
    updateSnapshot();
  };

  const toggleFavorite = (productId: string) => {
    if (!user) return;
    const exists = user.favoriteProductIds.includes(productId);
    user = {
      ...user,
      favoriteProductIds: exists
        ? user.favoriteProductIds.filter((id) => id !== productId)
        : [...user.favoriteProductIds, productId],
    };
    updateSnapshot();
  };

  const setUser = (next: User | null) => {
    user = next;
    persona = !next ? 'guest' : next.addresses.length ? 'user_with_address' : 'user_no_address';
    updateSnapshot();
  };

  const login = async (phone: string, password: string) => {
    setUser(await loginWithPassword(phone, password));
  };

  const register = async (name: string, phone: string, password: string) => {
    setUser(await registerWithPassword(name, phone, password));
  };

  const loginWithGoogle = async () => {
    authError = null;
    updateSnapshot();
    await startGoogleLogin();
  };

  const loginWithGoogleToken = async (credential: string) => {
    setUser(await loginWithGoogleCredential(credential));
  };

  const savePhone = async (phone: string) => {
    setUser(await saveFirstPhone(phone));
  };

  const logout = () => {
    setUser(null);
    void logoutAccount();
  };

  // Khi tải trang: xử lý Google chuyển về (nếu có), nếu không thì khôi phục phiên cũ.
  if (typeof window !== 'undefined') {
    void (async () => {
      try {
        const fromGoogle = await completeGoogleLogin();
        setUser(fromGoogle ?? (await restoreAccount()));
      } catch (e) {
        authError = e instanceof Error ? e.message : 'Không đăng nhập được bằng Google.';
      } finally {
        authLoading = false;
        updateSnapshot();
      }
    })();
  }

  let snapshot: AuthState = {
    persona,
    user,
    otpPhone,
    isOtpOpen,
    otpCountdown,
    otpResendCount,
    pendingRedirectUrl,
    setPersona,
    openOtpModal,
    closeOtpModal,
    verifyOtp,
    resendOtp,
    addAddress,
    setDefaultAddress,
    toggleFavorite,
    login,
    register,
    logout,
    authLoading,
    authError,
    loginWithGoogle,
    loginWithGoogleToken,
    savePhone,
  };

  function updateSnapshot() {
    snapshot = {
      persona,
      user,
      otpPhone,
      isOtpOpen,
      otpCountdown,
      otpResendCount,
      pendingRedirectUrl,
      setPersona,
      openOtpModal,
      closeOtpModal,
      verifyOtp,
      resendOtp,
      addAddress,
      setDefaultAddress,
      toggleFavorite,
      login,
      register,
      logout,
      authLoading,
      authError,
      loginWithGoogle,
      loginWithGoogleToken,
      savePhone,
    };
    if (user) saveProfile(user);
    notify();
  }

  const store = {
    getState: (): AuthState => snapshot,
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };

  return store;
})();

export function useAuth() {
  return useSyncExternalStore(useAuthStore.subscribe, useAuthStore.getState, useAuthStore.getState);
}
