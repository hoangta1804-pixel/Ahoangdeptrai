import React, { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { QuantityStepper } from '../ui/QuantityStepper';
import { Button } from '../ui/Button';
import { Product, Variant } from '../../mock/types';
import { formatMoney } from '../../lib/pricing';
import { calculateDeposit } from '../../lib/deposit';
import { useCart } from '../../stores/cartStore';
import { ShoppingBag, Trash2, ArrowRight, Clock, PackageCheck } from 'lucide-react';

export interface FloatingCartProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProceedToCheckout: () => void;
  onExploreSeason: () => void;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({
  isOpen,
  onClose,
  products,
  onProceedToCheckout,
  onExploreSeason,
}) => {
  const { lines, removeFromCart, updateQuantity } = useCart();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tạo map tìm kiếm nhanh product và variant
  const productsMap = React.useMemo(() => {
    const map: Record<string, { product: Product; variant: Variant }> = {};
    products.forEach((p) => {
      p.variants.forEach((v) => {
        map[v.id] = { product: p, variant: v };
      });
    });
    return map;
  }, [products]);

  // Chia thành 2 nhóm: Mua thường và Đặt trước
  const normalLines = lines.filter((line) => {
    const info = productsMap[line.variantId];
    return info && info.variant.status !== 'preorder';
  });

  const preorderLines = lines.filter((line) => {
    const info = productsMap[line.variantId];
    return info && info.variant.status === 'preorder';
  });

  // Tính tạm tính
  const normalSubtotal = normalLines.reduce((sum, l) => {
    const info = productsMap[l.variantId];
    return sum + (info ? info.variant.price * l.quantity : 0);
  }, 0);

  const preorderSubtotal = preorderLines.reduce((sum, l) => {
    const info = productsMap[l.variantId];
    return sum + (info ? info.variant.price * l.quantity : 0);
  }, 0);

  const preorderDeposit = calculateDeposit(preorderSubtotal, 0, 30);
  const totalSubtotal = normalSubtotal + preorderSubtotal;

  const handleStepQuantity = (lineId: string, variant: Variant, newQty: number) => {
    const result = updateQuantity(lineId, variant, newQty);
    if (!result.success) {
      setErrorMessage(result.message || 'Không thể tăng số lượng.');
      setTimeout(() => setErrorMessage(null), 3000);
    } else {
      setErrorMessage(null);
    }
  };

  const isEmpty = lines.length === 0;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag size={22} className="text-[#B8893B]" />
          <span>Giỏ hàng của bạn</span>
          <span className="text-small font-normal text-[#8F6A4D] ml-1">
            ({lines.reduce((s, l) => s + l.quantity, 0)} món)
          </span>
        </div>
      }
      maxWidth="max-w-xl"
    >
      {isEmpty ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#F3EEE2] flex items-center justify-center text-[#B8893B] mb-4">
            <ShoppingBag size={36} strokeWidth={1.5} />
          </div>
          <h4 className="font-serif text-xl font-bold text-[#1B1B1F]">Giỏ hàng đang trống</h4>
          <p className="text-small text-[#6B4A32] max-w-xs mt-1 mb-6">
            Hãy khám phá các thức quà đặc sản Lào Cai tươi mới đang vào vụ.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onExploreSeason();
            }}
            rightIcon={<ArrowRight size={16} />}
          >
            Xem đặc sản đang vào vụ
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="p-3 bg-[#FDF1F1] border border-[#A63D3D]/30 text-[#A63D3D] text-small rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* NHÓM 1: HÀNG CÓ SẴN (MUA THƯỜNG) */}
          {normalLines.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#E7DFCF]">
                <div className="flex items-center gap-1.5 font-semibold text-small text-[#204C39]">
                  <PackageCheck size={16} />
                  <span>Mua thường · Có sẵn tại kho Hà Nội</span>
                </div>
                <span className="price-tag text-small">{formatMoney(normalSubtotal)}</span>
              </div>

              <div className="space-y-3">
                {normalLines.map((line) => {
                  const info = productsMap[line.variantId];
                  if (!info) return null;
                  const { product, variant } = info;
                  return (
                    <div
                      key={line.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#E7DFCF] shadow-xs"
                    >
                      <div className="w-16 h-16 rounded-xl bg-[#F3EEE2] flex items-center justify-center text-2xl flex-shrink-0">
                        {product.category === 'tea'
                          ? '🍵'
                          : product.category === 'fresh'
                          ? '🍎'
                          : product.category === 'gift'
                          ? '🎁'
                          : '🍯'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="font-serif text-small font-bold text-[#1B1B1F] truncate">
                          {product.name}
                        </h5>
                        <div className="text-caption text-[#8F6A4D]">{variant.label}</div>
                        <div className="price-tag text-small mt-1">
                          {formatMoney(variant.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <QuantityStepper
                          size="sm"
                          value={line.quantity}
                          min={1}
                          max={variant.stock}
                          onChange={(val) => handleStepQuantity(line.id, variant, val)}
                        />
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.id)}
                          aria-label={`Xoá ${product.name} khỏi giỏ`}
                          className="min-h-[44px] min-w-[36px] flex items-center justify-center text-[#8F6A4D] hover:text-[#A63D3D] transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NHÓM 2: HÀNG ĐẶT TRƯỚC (PRE-ORDER) */}
          {preorderLines.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E7DFCF]">
                <div className="flex items-center gap-1.5 font-semibold text-small text-[#B7791F]">
                  <Clock size={16} />
                  <span>Đặt trước · Thu hoạch theo mùa</span>
                </div>
                <div className="text-right">
                  <div className="price-tag text-small">{formatMoney(preorderSubtotal)}</div>
                  <div className="text-xs text-[#B7791F] font-semibold">
                    Cọc 30%: {formatMoney(preorderDeposit)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {preorderLines.map((line) => {
                  const info = productsMap[line.variantId];
                  if (!info) return null;
                  const { product, variant } = info;
                  return (
                    <div
                      key={line.id}
                      className="flex items-center gap-3 p-3 bg-[#FEF7EA]/50 rounded-2xl border border-[#B7791F]/30 shadow-xs"
                    >
                      <div className="w-16 h-16 rounded-xl bg-[#FEF7EA] flex items-center justify-center text-2xl flex-shrink-0">
                        {product.category === 'fresh' ? '🍎' : '🐟'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="font-serif text-small font-bold text-[#1B1B1F] truncate">
                          {product.name}
                        </h5>
                        <div className="text-caption text-[#B7791F] font-medium">
                          {variant.label} · Giao {variant.expectedDeliveryDate || 'theo vụ'}
                        </div>
                        <div className="price-tag text-small mt-1">
                          {formatMoney(variant.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <QuantityStepper
                          size="sm"
                          value={line.quantity}
                          min={1}
                          max={variant.preorderSlots || 99}
                          onChange={(val) => handleStepQuantity(line.id, variant, val)}
                        />
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.id)}
                          aria-label={`Xoá ${product.name} khỏi giỏ`}
                          className="min-h-[44px] min-w-[36px] flex items-center justify-center text-[#8F6A4D] hover:text-[#A63D3D] transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TỔNG KẾT & NÚT ĐẶT HÀNG */}
          <div className="pt-4 border-t border-[#E7DFCF] space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="block text-body font-semibold text-[#1B1B1F]">Tổng tạm tính:</span>
                <span className="text-caption text-[#8F6A4D]">Chưa bao gồm phí vận chuyển</span>
              </div>
              <div className="text-right">
                <div className="price-tag text-2xl">{formatMoney(totalSubtotal)}</div>
                {preorderLines.length > 0 && (
                  <div className="text-caption text-[#B7791F] font-medium">
                    (Gồm cọc đặt trước: {formatMoney(preorderDeposit)})
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              rightIcon={<ArrowRight size={18} />}
            >
              Tiến hành đặt hàng
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
