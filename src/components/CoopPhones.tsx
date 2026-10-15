import { Phone } from 'lucide-react';
import { coopPhonesOf, formatContactPhone, isSamplePhone } from '../domain/coopContact';
import type { Coop } from '../domain/types';

/** 2 nút gọi SĐT của HTX: bấm là mở ứng dụng gọi của máy (`tel:`). */
export function CoopCallLinks({ coop }: { coop: Coop }) {
  const phones = coopPhonesOf(coop);
  if (phones.length === 0) return <p className="text-sm text-muted">HTX chưa cập nhật số điện thoại.</p>;
  return (
    <div className="space-y-1.5">
      <ul className="grid gap-2 min-[400px]:grid-cols-2">
        {phones.map((p, i) => (
          <li key={p}>
            <a
              href={`tel:${p}`}
              aria-label={`Gọi ${coop.name}, số ${i + 1}: ${formatContactPhone(p)}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-forest-800 bg-white px-3 text-sm font-bold text-forest-900 hover:bg-forest-50"
            >
              <Phone size={16} aria-hidden="true" />
              <span className="tabular-nums">{formatContactPhone(p)}</span>
            </a>
          </li>
        ))}
      </ul>
      {phones.every(isSamplePhone) && <p className="text-xs text-muted">Bản demo: số điện thoại mẫu.</p>}
    </div>
  );
}
