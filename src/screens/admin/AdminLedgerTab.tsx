import { useUi } from '../../app/UiContext';
import { formatMoney } from '../../domain/pricing';
import type { AdminSubGroup } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';

export function AdminLedgerTab({ group }: { group: AdminSubGroup }) {
  const { ledger } = useAppData();
  const { openModal } = useUi();
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-stone-900 uppercase">Sổ Cái 4 Mục Bất Biến</h4>
          {group === 'finance' && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              Quyền Tài chính
            </span>
          )}
        </div>

        <div className="space-y-2">
          {ledger.map((entry) => (
            <div key={entry.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">{entry.id} • {entry.orderId}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    entry.status === 'matched'
                      ? 'bg-emerald-100 text-emerald-800'
                      : entry.status === 'mismatched'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {entry.status === 'matched' && 'Khớp chuẩn'}
                  {entry.status === 'mismatched' && 'Lệch đối soát'}
                  {entry.status === 'adjusted' && 'Đã điều chỉnh'}
                </span>
              </div>

              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>{entry.coopName}</span>
                <span className="font-extrabold tabular-nums">
                  {entry.amount > 0 ? `+${formatMoney(entry.amount)}` : formatMoney(entry.amount)}
                </span>
              </div>

              {/* Action for mismatched row: create offset entry */}
              {entry.status === 'mismatched' && (
                <button
                  onClick={() => {
                    openModal({ type: 'ledger_adjust', row: entry });
                  }}
                  className="w-full mt-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors"
                >
                  Tạo bút toán đảo / Bổ sung để khớp
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
