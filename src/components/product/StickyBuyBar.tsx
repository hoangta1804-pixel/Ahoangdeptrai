import React from 'react';
import { ShoppingBag, Zap, Bell, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { QuantityStepper } from '../ui/QuantityStepper';
import { Variant } from '../../mock/types';
import { formatMoney } from '../../lib/pricing';
import { calculateDeposit } from '../../lib/deposit';
import { getAvailableStock } from '../../lib/stock';
import { getFeatureFlags } from '../../lib/featureFlags';

export interface StickyBuyBarProps {
  variant: Variant;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onNotifyBackInStock?: () => void;
  onExceedMax?: () => void;
}

export const StickyBuyBar: React.FC<StickyBuyBarProps> = ({
  variant,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onNotifyBackInStock,
  onExceedMax,
}) => {
  const flags = getFeatureFlags();
  const availableStock = getAvailableStock(variant);
  const isPreorder = variant.status === 'preorder';
  const isOutOfStock = availableStock <= 0;

  const totalAmount = variant.price * quantity;
  const depositAmount = isPreorder ? calculateDeposit(totalAmount, 0, 30) : 0;

  return (
    <div
      role="region"
      aria-label="Thanh đặt mua dính đáy"
      className="fixed bottom-0 inset-x-0 z-40 glass-blur border-t border-[#E7DFCF]/80 shadow-[0_-4px_24px_rgba(47, 102, 80,0.08)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Giá & Bộ chỉnh số lượng */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
          <div className="flex flex-col">
            <span className="text-caption text-[#8F6A4D] font-medium leading-none mb-0.5">
              {isPreorder ? 'Cần cọc trước 30%' : 'Tạm tính'}
            </span>
            <div className="price-tag text-xl sm:text-2xl leading-tight">
              {formatMoney(totalAmount)}
            </div>
            {isPreorder && (
              <span className="text-xs text-[#B7791F] font-semibold leading-none mt-0.5">
                Cọc: {formatMoney(depositAmount)}
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <QuantityStepper
              value={quantity}
              min={1}
              max={Math.max(1, availableStock)}
              onChange={onQuantityChange}
              onExceedMax={onExceedMax}
            />
          )}
        </div>

        {/* Nút hành động */}
        <div className="w-full sm:w-auto flex items-center gap-2.5">
          {!isOutOfStock ? (
            <>
              {/* Nút phụ: Thêm vào giỏ (outline) */}
              <Button
                variant="outline"
                size="md"
                className="flex-1 sm:flex-initial"
                onClick={onAddToCart}
                leftIcon={<ShoppingBag size={18} />}
              >
                Thêm vào giỏ
              </Button>

              {/* Nút chính DUY NHẤT: Brass (Mua ngay / Đặt trước) */}
              <Button
                variant="primary"
                size="md"
                className="flex-1 sm:flex-initial"
                onClick={onBuyNow}
                leftIcon={isPreorder ? <Clock size={18} /> : <Zap size={18} />}
              >
                {isPreorder ? `Đặt trước · Cọc ${formatMoney(depositAmount)}` : 'Mua ngay'}
              </Button>
            </>
          ) : (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <Button variant="secondary" disabled className="flex-1 sm:flex-initial">
                Tạm hết hàng
              </Button>

              {flags.couldHave.notifyBackInStock && onNotifyBackInStock && (
                <Button
                  variant="outline"
                  onClick={onNotifyBackInStock}
                  leftIcon={<Bell size={16} />}
                  className="flex-1 sm:flex-initial text-small"
                >
                  Báo khi có hàng
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
