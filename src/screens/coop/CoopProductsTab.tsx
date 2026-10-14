import { Info } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { ProductImage } from '../../components/ProductImage';
import { formatMoney } from '../../domain/pricing';
import { useAppData } from '../../store/AppDataContext';
import { DEMO_COOP_ID } from './demoCoop';

export function CoopProductsTab() {
  const { products, setProducts } = useAppData();
  const { showToast } = useUi();
  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-start gap-2">
        <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
        <span>
          <strong>Quyền tự chủ Preorder:</strong> HTX được chủ động điều chỉnh số lượng suất bán và lịch thu hái trên sản phẩm đã duyệt. Cập nhật áp dụng ngay tức thì trên App Khách hàng.
        </span>
      </div>

      {products
        .filter((p) => p.coopId === DEMO_COOP_ID)
        .map((prod) => (
          <div key={prod.id} className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-3">
            <div className="flex gap-3">
              <ProductImage product={prod} className="w-16 h-16 rounded-xl" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-sky-700">{prod.certType}</span>
                <h4 className="text-xs font-bold text-stone-900 truncate">{prod.name}</h4>
                <span className="text-xs font-extrabold text-emerald-800 tabular-nums">
                  {formatMoney(prod.price)}/{prod.unit}
                </span>
              </div>
            </div>

            {prod.isPreorder && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-700">Suất mở bán Preorder:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setProducts((prev) =>
                          prev.map((item) =>
                            item.id === prod.id && (item.preorderStock || 0) > 10
                              ? { ...item, preorderStock: (item.preorderStock || 0) - 5 }
                              : item
                          )
                        );
                        showToast('Đã giảm 5 suất preorder. Áp dụng ngay trên App!');
                      }}
                      className="w-6 h-6 rounded-md bg-stone-200 text-stone-800 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-stone-900 tabular-nums text-sm">
                      {prod.preorderStock}
                    </span>
                    <button
                      onClick={() => {
                        setProducts((prev) =>
                          prev.map((item) =>
                            item.id === prod.id
                              ? { ...item, preorderStock: (item.preorderStock || 0) + 10 }
                              : item
                          )
                        );
                        showToast('Đã tăng 10 suất preorder. Áp dụng ngay trên App!');
                      }}
                      className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-stone-200/50">
                  <span className="font-semibold text-stone-700">Ngày dự kiến giao Hà Nội:</span>
                  <input
                    type="text"
                    defaultValue={prod.deliveryDate}
                    onBlur={(e) => {
                      setProducts((prev) =>
                        prev.map((item) =>
                          item.id === prod.id ? { ...item, deliveryDate: e.target.value } : item
                        )
                      );
                      showToast(`Đã đổi ngày giao thành ${e.target.value}. Đồng bộ ngay lập tức!`);
                    }}
                    className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 w-28 text-right font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
