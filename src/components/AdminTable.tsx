import type { ReactNode } from 'react';

/**
 * Bảng dùng chung cho màn Admin và QLNN (Giai đoạn 6, mục 10.5): bố cục bảng cho máy tính,
 * cuộn ngang trong khung khi màn hẹp để trang không bị cuộn ngang.
 */
export function AdminTable({
  caption,
  columns,
  minWidth = 640,
  children,
}: {
  caption?: ReactNode;
  columns: (string | { label: string; align?: 'right'; className?: string })[];
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {caption && <caption className="px-3 pt-3 pb-1 text-left text-base font-bold text-ink">{caption}</caption>}
        <thead className="bg-stone-50 text-xs text-muted">
          <tr>
            {columns.map((c) => {
              const col = typeof c === 'string' ? { label: c } : c;
              return (
                <th key={col.label} scope="col" className={`px-3 py-2 font-semibold ${col.align === 'right' ? 'text-right' : ''} ${col.className ?? ''}`}>
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '', colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2 align-top ${className}`}>
      {children}
    </td>
  );
}
