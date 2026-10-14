import { BottomSheet } from '../../components/BottomSheet';
import { ProductImage } from '../../components/ProductImage';
import type { Product } from '../../domain/types';

/**
 * Trang thông tin lô / nguồn gốc của đúng sản phẩm được chọn (L10).
 * Chỉ hiện dữ liệu có trong hồ sơ sản phẩm; không dựng nhật ký thu hái, toạ độ hay lời xác nhận của cơ quan nhà nước.
 */
export function TraceLotSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const rows: [string, string | undefined][] = [
    ['Sản phẩm', product.name],
    ['Đơn vị bán', product.coopName],
    ['Vùng sản xuất', `${product.originDistrict}, Lào Cai`],
    ['Chứng nhận HTX khai', `${product.certType} – ${product.certNumber}`],
    ['Quy cách', product.unit],
    ['Ngày giao dự kiến', product.isPreorder ? product.deliveryDate : undefined],
  ];
  return (
    <BottomSheet title="Thông tin nguồn gốc" onClose={onClose}>
      <div className="flex gap-3">
        <ProductImage product={product} className="h-20 w-20 shrink-0 rounded-2xl" />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-stone-900">{product.name}</h3>
          <p className="text-xs text-stone-500">{product.coopName}</p>
        </div>
      </div>

      <dl className="divide-y divide-stone-100 rounded-2xl border border-stone-200 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-3 py-2.5">
              <dt className="text-stone-500">{label}</dt>
              <dd className="text-right font-semibold text-stone-900">{value}</dd>
            </div>
          ))}
      </dl>

      <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>

      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        Thông tin lô (mã lô, ngày thu hoạch, ngày đóng gói) do HTX khai khi tạo lô hàng. Dữ liệu trên là dữ liệu mẫu, chờ HTX xác nhận.
      </p>
    </BottomSheet>
  );
}
