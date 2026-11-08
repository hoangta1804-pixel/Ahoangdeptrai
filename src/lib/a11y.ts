/**
 * Utilities hỗ trợ khả năng tiếp cận (Accessibility - a11y)
 */

export function announceToScreenReader(message: string, assertive = false): void {
  const existing = document.getElementById('dss-a11y-announcer');
  if (existing) {
    existing.remove();
  }

  const announcer = document.createElement('div');
  announcer.id = 'dss-a11y-announcer';
  announcer.setAttribute('role', assertive ? 'alert' : 'status');
  announcer.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  announcer.className = 'sr-only';
  announcer.innerText = message;

  document.body.appendChild(announcer);

  setTimeout(() => {
    announcer.remove();
  }, 3000);
}

/**
 * Kiểm tra xem người dùng có yêu cầu giảm chuyển động không
 */
export function isReducedMotionPreferred(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
