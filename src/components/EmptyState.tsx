import type { ReactNode } from 'react';

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-600">
      <div>{children}</div>
      {action}
    </div>
  );
}

/** Nhãn "Mô phỏng" bắt buộc trên mọi chức năng mô phỏng (nguyên tắc 6). */
export function SimBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block rounded-md bg-stone-900 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-300 ${className}`}>
      Mô phỏng
    </span>
  );
}
