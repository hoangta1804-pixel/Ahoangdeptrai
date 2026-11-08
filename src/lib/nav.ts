/** Cầu nối điều hướng: Phase2App đăng ký hàm navigate, <Link> gọi lại. */
let navigateImpl: ((path: string) => void) | null = null;

export function registerNavigate(fn: (path: string) => void) {
  navigateImpl = fn;
}

export function navigateTo(path: string) {
  if (navigateImpl) navigateImpl(path);
  else window.location.assign(path);
}
