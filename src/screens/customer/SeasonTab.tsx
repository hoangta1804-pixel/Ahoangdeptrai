import { CalendarDays, Wheat } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { PreorderProgress } from '../../components/PreorderProgress';
import { ProductImage } from '../../components/ProductImage';
import { computeDeposit, formatMoney } from '../../domain/pricing';
import { useAppData } from '../../store/AppDataContext';

/** Tab Vụ mùa: danh sách hàng đặt trước, chuyển từ bản index.html cũ (mục 3.3). */
export function SeasonTab() {
  const { products, params } = useAppData();
  const { openModal } = useUi();
  const preorders = products.filter((p) => p.isPreorder);

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1 rounded-3xl bg-gradient-to-r from-emerald-950 to-emerald-800 p-4 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Wheat size={20} className="text-amber-300" />
          <h2 className="text-sm font-bold">Nông sản theo mùa – Đặt trước</h2>
        </div>
        <p className="text-xs leading-relaxed text-emerald-100">
          Giữ suất trước mùa thu hoạch. Cọc {params.depositPercent}% khi đặt, phần còn lại trả khi hàng sẵn sàng hoặc khi nhận hàng.
        </p>
      </div>

      {preorders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-600">
          Hiện chưa có sản phẩm nào mở đặt trước.
        </p>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {preorders.map((p) => (
            <div key={p.id} className="space-y-3 rounded-3xl border border-stone-200 bg-white p-3.5 shadow-xs">
              <div className="flex gap-3">
                <ProductImage product={p} className="h-20 w-20 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">{p.originDistrict}</span>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-stone-900">{p.name}</h3>
                  <p className="mt-0.5 truncate text-xs text-stone-500">{p.coopName}</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-extrabold tabular-nums text-emerald-900">
                      {formatMoney(p.price)}/{p.unit}
                    </span>
                    <span className="text-amber-800">
                      Cọc từ {formatMoney(computeDeposit(p.price, 0, params.depositPercent, params.depositRoundingStep))}
                    </span>
                  </div>
                </div>
              </div>

              <PreorderProgress product={p} />

              {p.deliveryDate && (
                <p className="flex items-center gap-1.5 text-xs text-stone-600">
                  <CalendarDays size={14} className="text-emerald-700" />
                  Ngày giao dự kiến: <strong>{p.deliveryDate}</strong>
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openModal({ type: 'trace_lot', product: p })}
                  className="rounded-2xl border border-stone-200 bg-white py-2.5 text-xs font-bold text-stone-800 hover:bg-stone-50"
                >
                  Thông tin nguồn gốc
                </button>
                <button
                  onClick={() => openModal({ type: 'product_detail', product: p })}
                  className="rounded-2xl bg-emerald-900 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Xem và đặt trước
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
