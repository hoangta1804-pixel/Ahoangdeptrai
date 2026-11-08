/**
 * Công cụ nội bộ (Dev Panel, link quản trị) chỉ hiện khi bật cờ:
 *  - biến môi trường VITE_SHOW_DEV_TOOLS=true, hoặc
 *  - mở trang với ?dev=1 (ghi nhớ trên trình duyệt; tắt bằng ?dev=0).
 * Khách bình thường không thấy, kể cả khi chạy `npm run dev`.
 */
const KEY = 'dss_dev_tools';

export function isDevToolsEnabled(): boolean {
  if (import.meta.env.VITE_SHOW_DEV_TOOLS === 'true') return true;
  try {
    const flag = new URLSearchParams(window.location.search).get('dev');
    if (flag === '1') localStorage.setItem(KEY, '1');
    if (flag === '0') localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
