import { formatMoney } from '../../domain/pricing';
import { useAppData } from '../../store/AppDataContext';

export function CoopWalletTab() {
  const { ledger } = useAppData();
  return (
    <div className="space-y-3">
      {/* Top Summary Card */}
      <div className="bg-stone-900 text-white rounded-3xl p-4 shadow-sm space-y-2">
        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
          Số Tiền Thực Nhận Kỳ Này (Kỳ 19/2026)
        </span>
        <h3 className="text-2xl font-extrabold text-emerald-400 tabular-nums">14.500.000đ</h3>

        <div className="bg-stone-800/80 rounded-2xl p-2.5 text-[10px] text-stone-300 space-y-1 font-mono border border-stone-700/60">
          <div className="text-emerald-300 font-bold">Công thức chi trả minh bạch:</div>
          <div>Thực nhận = Tổng tiền hàng đủ ĐK (17.500.000đ)</div>
          <div>− Hoa hồng 5% (875.000đ)</div>
          <div>− Tiền hoàn & phạt HTX (375.000đ)</div>
          <div>− Khoản giữ lại kỳ này 10% (1.750.000đ)</div>
          <div className="text-emerald-300">+ Hoàn trả khoản giữ lại từ 2 kỳ trước (+0đ)</div>
        </div>
      </div>

      {/* 4 Tabs Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-stone-800 uppercase">Sao Kê 4 Khoản Chi Tiết</h4>

        <div className="space-y-1.5">
          {ledger
            .filter((l) => l.coopName.includes('Bắc Hà'))
            .map((row) => (
              <div key={row.id} className="flex items-center justify-between py-2 border-b border-stone-100 text-xs">
                <div>
                  <span className="font-semibold text-stone-800 block">
                    {row.type === 'goods_sale' && 'Tiền hàng đủ điều kiện'}
                    {row.type === 'commission' && 'Phí hoa hồng nền tảng (5%)'}
                    {row.type === 'shipping_fee' && 'Phí vận chuyển'}
                    {row.type === 'refund' && 'Khấu trừ hoàn tiền / phạt'}
                    {row.type === 'gateway_fee' && 'Phí cổng thanh toán'}
                  </span>
                  <span className="text-[10px] text-stone-400">{row.date} • Đơn {row.orderId}</span>
                </div>
                <span className={`font-bold tabular-nums ${row.amount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {row.amount > 0 ? `+${formatMoney(row.amount)}` : formatMoney(row.amount)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
