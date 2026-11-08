import { useEffect } from 'react';
import '../styles/staff-portal.css';
import { AppShell } from './AppShell';
import { StorefrontProvider } from './StorefrontContext';
import { UiProvider } from './UiContext';
import { AppDataProvider } from '../store/AppDataContext';
import { hasBackendSession } from '../store/backend';
import { loadSession } from '../store/persistence';

const LOGIN_URL = '/dang-nhap?tiep=' + encodeURIComponent('/quan-tri');

/**
 * Cổng quản trị (/quan-tri): bọc màn có sẵn (AppShell) trong các provider dữ liệu máy chủ.
 * Chưa đăng nhập → sang trang đăng nhập của cửa hàng, xong quay lại đây. Đăng xuất → về trang chủ.
 */
export function StaffPortal() {
  const signedIn = hasBackendSession() && Boolean(loadSession());

  useEffect(() => {
    if (!signedIn) window.location.replace(LOGIN_URL);
  }, [signedIn]);

  useEffect(() => {
    const out = () => window.location.assign('/');
    window.addEventListener('backend-logout', out);
    return () => window.removeEventListener('backend-logout', out);
  }, []);

  if (!signedIn) return <p style={{ padding: 32, textAlign: 'center' }}>Đang chuyển tới trang đăng nhập…</p>;

  return (
    <AppDataProvider>
      <UiProvider>
        <StorefrontProvider>
          <AppShell portal />
        </StorefrontProvider>
      </UiProvider>
    </AppDataProvider>
  );
}
