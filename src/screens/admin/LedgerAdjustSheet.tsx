import { useState } from 'react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { formatMoney } from '../../domain/pricing';
import type { LedgerEntry } from '../../domain/types';
import { useAppData } from '../../store/AppDataContext';

export function LedgerAdjustSheet({ row, onClose }: { row: LedgerEntry; onClose: () => void }) {
  const { setLedger } = useAppData();
  const { showToast } = useUi();
  const [adjustReason, setAdjustReason] = useState('');
  return (
    <BottomSheet
      title="Tạo Bút Toán Điều Chỉnh Sổ Cái"
      onClose={onClose}
      footer={
        <button
          onClick={() => {
            setLedger((prev) =>
              prev.map((item) => (item.id === row.id ? { ...item, status: 'adjusted', notes: adjustReason || 'Đã tạo bút toán bù trừ' } : item)),
            );
            onClose();
            showToast('Đã tạo bút toán điều chỉnh bổ sung, trạng thái chuyển sang ĐÃ ĐIỀU CHỈNH.');
          }}
          className="w-full rounded-2xl bg-emerald-900 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-800"
        >
          Ghi nhận Bút Toán Bổ Sung
        </button>
      }
    >
      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 text-xs space-y-1">
        <span className="font-bold text-stone-800">Dòng gốc bất biến: {row.id}</span>
        <p className="text-stone-600">Đơn: {row.orderId} • {row.coopName}</p>
        <p className="text-rose-700 font-bold">Chênh lệch: {formatMoney(row.amount)}</p>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-stone-600 block mb-1">Nguyên nhân lệch đối soát:</label>
        <textarea
          rows={2}
          value={adjustReason}
          onChange={(e) => setAdjustReason(e.target.value)}
          placeholder="Nhập căn cứ xử lý bút toán đảo / bồi hoàn..."
          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
        ></textarea>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className="py-2 text-[10px] font-bold rounded-xl border border-emerald-700 bg-emerald-50 text-emerald-950"
        >
          HTX chịu
        </button>
        <button
          type="button"
          className="py-2 text-[10px] font-semibold rounded-xl border border-stone-200 text-stone-600"
        >
          ĐVVC chịu
        </button>
        <button
          type="button"
          className="py-2 text-[10px] font-semibold rounded-xl border border-stone-200 text-stone-600"
        >
          Hệ thống chịu
        </button>
      </div>

    </BottomSheet>
  );
}
