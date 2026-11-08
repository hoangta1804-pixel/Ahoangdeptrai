import React from 'react';
import { navigateTo } from '../../lib/nav';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  active?: boolean;
}

/** Thẻ <a> thật (mở tab mới, sao chép link được) nhưng chuyển trang không tải lại. */
export const Link: React.FC<LinkProps> = ({ to, active, onClick, children, ...rest }) => (
  <a
    href={to}
    aria-current={active ? 'page' : undefined}
    onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return;
      e.preventDefault();
      navigateTo(to);
    }}
    {...rest}
  >
    {children}
  </a>
);
