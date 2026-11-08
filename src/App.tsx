import { lazy, Suspense } from 'react';
import { Phase2App } from './app/Phase2App';

/**
 * ĐẶC SẢN SỐ
 *  - Cửa hàng (giao diện mới): mọi đường dẫn thường.
 *  - Cổng quản trị / nội bộ: /quan-tri — dùng lại màn Admin, HTX, QLNN, Shipper có sẵn (dữ liệu thật trên máy chủ).
 *    Tải riêng (lazy) để khách mua hàng không phải tải mã của cổng quản trị.
 */
const StaffPortal = lazy(() => import('./app/StaffPortal').then((m) => ({ default: m.StaffPortal })));

export const isStaffPortalPath = (path: string) => path === '/quan-tri' || path.startsWith('/quan-tri/');

export default function App() {
  if (isStaffPortalPath(window.location.pathname)) {
    return (
      <Suspense fallback={<p style={{ padding: 32, textAlign: 'center' }}>Đang mở trang quản trị…</p>}>
        <StaffPortal />
      </Suspense>
    );
  }
  return <Phase2App />;
}
