import { useState } from 'react';
import { BadgeCheck, FileBadge, Minus, Plus, Share2 } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { BottomSheet } from '../../components/BottomSheet';
import { PreorderProgress } from '../../components/PreorderProgress';
import { Stars } from '../../components/Stars';
import { averageRating, publicReviews } from '../../domain/reviews';
import { ProductImage } from '../../components/ProductImage';
import { deliveryWindow, isOrderableIn } from '../../domain/cart';
import { computeDeposit, formatMoney } from '../../domain/pricing';
import { findProduct, formatDateKey, remainingFor } from '../../domain/state';
import { CATEGORY_LABEL, ORDER_KIND_LABEL } from '../../domain/types';
import { useStore } from '../../store/AppDataContext';
import { useCartActions } from './useCartActions';

export function ProductDetailSheet({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { state, now } = useStore();
  const { openModal, showToast } = useUi();
  const { add } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const product = findProduct(state, productId);
  if (!product) return null;

  const params = state.params;
  const coop = state.coops.find((c) => c.id === product.coopId);
  const remaining = remainingFor(state, product);
  const win = product.kind === 'preorder' ? deliveryWindow(product, now(), params) : null;
  const blocked = !isOrderableIn(state, product)
    ? 'Sản phẩm hiện không mở bán'
    : remaining <= 0
      ? 'Hết hàng'
      : product.kind === 'preorder' && !win
        ? 'Đã hết thời gian nhận đặt trước'
        : null;
  const qty = Math.min(quantity, Math.max(1, remaining));
  const rating = averageRating(state, product.id);
  const reviews = publicReviews(state, product.id);

  // Chia sẻ link sản phẩm (FR-TKSP-05): dùng chia sẻ của thiết bị nếu có, không thì sao chép link.
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/san-pham/${product.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('Đã sao chép link sản phẩm.');
    } catch {
      showToast(`Link sản phẩm: ${url}`);
    }
  };
  const itemsTotal = product.price * qty;
  const deposit = computeDeposit(itemsTotal, 0, params.depositPercent, params.depositRoundingStep);

  return (
    <BottomSheet
      title={
        <>
          <span className="block">{product.name}</span>
          <span className="block text-sm font-normal text-stone-500">
            {coop?.name} · {product.region} · {CATEGORY_LABEL[product.category]}
          </span>
        </>
      }
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!!blocked}
            onClick={() => add(product.id, qty) && onClose()}
            className="min-h-12 rounded-2xl border border-emerald-900 bg-white text-sm font-bold text-emerald-900 disabled:border-stone-300 disabled:text-stone-500"
          >
            Thêm vào giỏ
          </button>
          <button
            disabled={!!blocked}
            onClick={() =>
              openModal({
                type: 'checkout',
                source: { type: 'buy_now', line: { productId: product.id, quantity: qty, deliveryDate: win?.min, seenPrice: product.price } },
              })
            }
            className="min-h-12 rounded-2xl bg-emerald-900 text-sm font-bold text-white disabled:bg-stone-300 disabled:text-stone-600"
          >
            {blocked ?? (product.kind === 'preorder' ? 'Đặt trước' : 'Mua ngay')}
          </button>
        </div>
      }
    >
      <div className="relative h-44 overflow-hidden rounded-2xl border border-stone-200 sm:h-56">
        <ProductImage product={product} className="h-full w-full" />
        <button
          onClick={() => openModal({ type: 'trace_lot', productId: product.id })}
          className="absolute right-2 bottom-2 flex min-h-10 items-center gap-1 rounded-lg bg-black/75 px-3 text-sm font-semibold text-white hover:bg-black/90"
        >
          <FileBadge size={16} />
          Xem nguồn gốc
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xl font-extrabold tabular-nums text-stone-900">
          {formatMoney(product.price)}
          <span className="text-sm font-normal text-stone-500">/{product.unit}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">{ORDER_KIND_LABEL[product.kind]}</span>
          <button onClick={share} aria-label="Chia sẻ link sản phẩm" className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100">
            <Share2 size={18} />
          </button>
        </span>
      </div>
      <p className="flex items-center gap-2 text-sm text-stone-700">
        {rating.average !== null ? (
          <>
            <Stars value={rating.average} /> {rating.average}/5 · {rating.count} đánh giá
          </>
        ) : (
          'Chưa có đánh giá'
        )}
      </p>

      <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>

      {product.kind === 'preorder' ? (
        <>
          <PreorderProgress product={product} />
          <div className="space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p>
              <strong>Cọc {params.depositPercent}%</strong> trả online khi đặt: {formatMoney(deposit)} (chưa gồm phí giao).
            </p>
            <p>Phần còn lại trả online khi HTX báo hàng sẵn sàng, hoặc trả khi nhận hàng nếu đơn đủ điều kiện.</p>
            {win && (
              <p>
                Chọn ngày giao từ {formatDateKey(win.min)} đến {formatDateKey(win.max)} ở bước đặt hàng.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-stone-600">
          Còn <strong>{remaining}</strong> {product.unit} có thể đặt.
        </p>
      )}

      {(product.certifications?.length ?? 0) > 0 && (
        <ul className="space-y-1 text-sm">
          {product.certifications!.map((c) => (
            <li key={c.id} className="flex items-center gap-1.5 text-stone-700">
              <BadgeCheck size={16} className="text-emerald-700" />
              {c.label} · {c.issuer} · hiệu lực đến {c.validUntil.split('-').reverse().join('/')} (Admin đã xem hồ sơ – mô phỏng)
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-sm font-semibold text-stone-700">
          Số lượng ({product.unit})
          <span className="block text-xs font-normal text-stone-500">Tối đa {Math.max(0, remaining)}</span>
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-xs">
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-bold tabular-nums">{qty}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
            disabled={qty >= remaining}
            aria-label="Tăng số lượng"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-xs disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      {reviews.length > 0 && (
        <section className="space-y-2 border-t border-stone-100 pt-3">
          <h4 className="text-sm font-bold text-stone-800">Đánh giá của khách</h4>
          {reviews.map((r) => (
            <div key={r.id} className="space-y-1 rounded-xl bg-stone-50 p-2.5 text-sm">
              <p className="flex items-center gap-2">
                <Stars value={r.stars} /> <span className="font-semibold">{r.reviewerName}</span>
                <span className="text-xs text-stone-500">· đơn {r.orderRef}</span>
              </p>
              {r.comment && <p className="text-stone-700">{r.comment}</p>}
              {r.photos.length > 0 && (
                <div className="flex gap-1">
                  {r.photos.map((src, i) => (
                    <img key={i} src={src} alt={`Ảnh đánh giá ${i + 1}`} className="h-14 w-14 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              {r.coopReply && <p className="border-l-2 border-emerald-700 pl-2 text-stone-700">HTX phản hồi: {r.coopReply}</p>}
            </div>
          ))}
        </section>
      )}
    </BottomSheet>
  );
}
