import { useState } from 'react';
import { BadgeCheck, FileBadge, MessageCircle, Share2 } from 'lucide-react';
import { useUi } from '../../app/UiContext';
import { Ornament } from '../../components/Brand';
import { BottomSheet, SheetColumns } from '../../components/BottomSheet';
import { PreorderProgress } from '../../components/PreorderProgress';
import { QuantityStepper } from '../../components/QuantityStepper';
import { Stars } from '../../components/Stars';
import { VariantPicker } from '../../components/VariantPicker';
import { averageRating, publicReviews } from '../../domain/reviews';
import { ProductImage } from '../../components/ProductImage';
import { deliveryWindow, isOrderableIn } from '../../domain/cart';
import { computeDeposit, formatMoney } from '../../domain/pricing';
import { findProduct, formatDateKey, isSamplePrice, remainingFor } from '../../domain/state';
import { CATEGORY_LABEL, ORDER_KIND_LABEL } from '../../domain/types';
import { listedFamilyOf } from '../../domain/variants';
import { useStore } from '../../store/AppDataContext';
import { useCartActions } from './useCartActions';

export function ProductDetailSheet({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { state, now } = useStore();
  const { openModal, showToast } = useUi();
  const { add, cart } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  // Quy cách đang chọn: mở từ thẻ nào thì chọn sẵn quy cách đó.
  const [variantId, setVariantId] = useState(productId);
  const product = findProduct(state, variantId) ?? findProduct(state, productId);
  if (!product) return null;
  const family = listedFamilyOf(state, product);

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
  const inCart = cart.find((l) => l.productId === product.id)?.quantity ?? 0;
  // Đánh giá tính chung các quy cách của sản phẩm.
  const reviewed = family.length > 1 ? family : [product];
  const reviews = reviewed.flatMap((v) => publicReviews(state, v.id).map((r) => ({ ...r, unit: v.unit }))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rating = reviewed.length > 1 ? combinedRating(reviewed.map((v) => averageRating(state, v.id))) : averageRating(state, product.id);

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
          <span className="block font-sans text-xs font-semibold uppercase tracking-[0.14em] text-champagne-700">
            {product.region} · {CATEGORY_LABEL[product.category]}
          </span>
          <span className="block font-display text-2xl font-semibold leading-tight">{product.name}</span>
          <span className="block font-sans text-sm font-normal text-muted">{coop?.name}</span>
        </>
      }
      onClose={onClose}
      wide
      footer={
        <div className="space-y-2 lg:ml-auto lg:max-w-[calc(50%-0.75rem)]">
          {!blocked && (
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 text-sm">
                <span className="block font-semibold text-stone-700">
                  Số lượng <span className="font-normal text-muted">({product.unit})</span>
                </span>
                <span className="block text-xs text-muted">
                  Còn {remaining}
                  {inCart > 0 && ` · trong giỏ ${inCart}`} · <span className="font-semibold tabular-nums text-ink">{formatMoney(itemsTotal)}</span>
                </span>
              </span>
              <QuantityStepper value={qty} max={remaining} onChange={setQuantity} itemName={product.name} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!!blocked}
              onClick={() => add(product.id, qty) && onClose()}
              className="min-h-12 rounded-2xl border border-forest-800 bg-white text-sm font-bold text-forest-800 disabled:border-stone-300 disabled:text-muted"
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
              className="min-h-12 rounded-2xl bg-forest-800 text-sm font-bold text-white disabled:bg-stone-300 disabled:text-stone-600"
            >
              {blocked ?? (product.kind === 'preorder' ? 'Đặt trước' : 'Mua ngay')}
            </button>
          </div>
        </div>
      }
    >
      <SheetColumns
        left={
          <>
            <div className="relative aspect-[4/3] max-h-80 w-full overflow-hidden rounded-3xl ring-1 ring-champagne-300/80 lg:max-h-none">
              <ProductImage product={product} variant="cover" className="h-full w-full" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[20px] border border-white/70" />
              <button
                onClick={() => openModal({ type: 'trace_lot', productId: product.id })}
                className="absolute right-3 bottom-3 flex min-h-11 items-center gap-1.5 rounded-full bg-forest-950/90 px-4 text-sm font-semibold text-champagne-200 ring-1 ring-champagne-400/60 hover:bg-forest-900"
              >
                <FileBadge size={16} />
                Xem nguồn gốc
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-3xl font-semibold tabular-nums text-forest-900">
                {formatMoney(product.price)}
                <span className="font-sans text-sm font-normal text-muted">/{product.unit}</span>
                {isSamplePrice(product) && <span className="ml-1.5 text-sm font-semibold text-champagne-800">(giá mẫu)</span>}
              </span>
              <span className="flex items-center gap-1">
                <span className="whitespace-nowrap rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">{ORDER_KIND_LABEL[product.kind]}</span>
                <button onClick={share} aria-label="Chia sẻ link sản phẩm" className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100">
                  <Share2 size={18} />
                </button>
              </span>
            </div>
            {family.length > 1 && (
              <VariantPicker
                variants={family}
                selected={product.id}
                onSelect={(id) => {
                  setVariantId(id);
                  setQuantity(1);
                }}
              />
            )}
            <p className="flex items-center gap-2 text-sm text-stone-700">
              {rating.average !== null ? (
                <>
                  <Stars value={rating.average} /> {rating.average}/5 · {rating.count} đánh giá
                </>
              ) : (
                'Chưa có đánh giá'
              )}
            </p>
            <button
              type="button"
              onClick={() => openModal({ type: 'chat', withId: product.coopId, productId: product.id })}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-champagne-300 bg-white px-4 text-sm font-bold text-forest-900 hover:border-champagne-500 hover:bg-champagne-50"
            >
              <MessageCircle size={17} aria-hidden="true" /> Hỏi {coop?.name ?? 'HTX'} về sản phẩm này
            </button>
          </>
        }
        right={
          <>
            <Ornament className="mx-auto" />

            <p className="drop-cap text-sm leading-relaxed text-stone-700">{product.description}</p>

            {/* Thông tin sản phẩm, lấy từ dữ liệu sản phẩm. */}
            <dl className="space-y-1.5 rounded-2xl border border-champagne-200 bg-champagne-50/60 p-3.5 text-sm">
              {(
                [
                  ['Vùng', product.region],
                  ['HTX', coop?.name ?? '—'],
                  ['Nhóm hàng', CATEGORY_LABEL[product.category]],
                  ['Hình thức', ORDER_KIND_LABEL[product.kind]],
                  ['Quy cách', product.unit],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <dt className="flex flex-1 items-baseline gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-champagne-700">
                    <span className="shrink-0">{label}</span>
                    <span aria-hidden="true" className="leader" />
                  </dt>
                  <dd className="max-w-[65%] text-right font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {product.sample && (
              <div role="note" className="space-y-1 rounded-2xl border border-stone-300 bg-stone-50 p-3 text-sm text-stone-700">
                <p className="font-bold text-ink">Dữ liệu mẫu – chờ HTX xác nhận</p>
                <p>
                  {product.sample.surveyedPrice
                    ? `Giá mẫu, chọn trong khoảng giá bán lẻ tại Hà Nội nhóm đã khảo sát: ${product.sample.surveyedPrice}.`
                    : 'Giá mẫu: nhóm chưa có giá khảo sát cho sản phẩm này.'}
                </p>
                {product.sample.deliveryWindowIsSample && <p>Khoảng ngày giao là mẫu, chờ HTX xác nhận.</p>}
                {product.sample.dossierNote && <p>{product.sample.dossierNote}.</p>}
              </div>
            )}

            {product.kind === 'preorder' ? (
              <>
                <PreorderProgress product={product} />
                <div className="space-y-1 rounded-2xl border border-champagne-200 bg-champagne-50 p-3 text-sm text-champagne-950">
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
                    <BadgeCheck size={16} className="text-forest-600" />
                    {c.label} · {c.issuer} · hiệu lực đến {c.validUntil.split('-').reverse().join('/')} (Admin đã xem hồ sơ – mô phỏng)
                  </li>
                ))}
              </ul>
            )}

            {reviews.length > 0 && (
              <section className="space-y-2 border-t border-stone-100 pt-3">
                <h4 className="text-sm font-bold text-stone-800">Đánh giá của khách</h4>
                {reviews.map((r) => (
                  <div key={r.id} className="space-y-1 rounded-xl bg-stone-50 p-2.5 text-sm">
                    <p className="flex items-center gap-2">
                      <Stars value={r.stars} /> <span className="font-semibold">{r.reviewerName}</span>
                      <span className="text-xs text-muted">
                        · đơn {r.orderRef}
                        {reviewed.length > 1 && ` · ${r.unit}`}
                      </span>
                    </p>
                    {r.comment && <p className="text-stone-700">{r.comment}</p>}
                    {r.photos.length > 0 && (
                      <div className="flex gap-1">
                        {r.photos.map((src, i) => (
                          <img key={i} src={src} alt={`Ảnh đánh giá ${i + 1}`} className="h-14 w-14 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    {r.coopReply && <p className="border-l-2 border-forest-600 pl-2 text-stone-700">HTX phản hồi: {r.coopReply}</p>}
                  </div>
                ))}
              </section>
            )}
          </>
        }
      />
    </BottomSheet>
  );
}

/** Điểm trung bình gộp nhiều quy cách, theo số đánh giá của từng quy cách. */
function combinedRating(parts: { average: number | null; count: number }[]): { average: number | null; count: number } {
  const count = parts.reduce((n, p) => n + p.count, 0);
  if (count === 0) return { average: null, count: 0 };
  return { average: Math.round((parts.reduce((s, p) => s + (p.average ?? 0) * p.count, 0) / count) * 10) / 10, count };
}
