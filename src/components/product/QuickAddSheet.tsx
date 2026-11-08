import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Chip } from '../ui/Chip';
import { QuantityStepper } from '../ui/QuantityStepper';
import { Button } from '../ui/Button';
import { Product, Variant } from '../../mock/types';
import { getDefaultVariant } from '../../lib/variants';
import { formatMoney } from '../../lib/pricing';
import { getAvailableStock, checkCanAddToCart } from '../../lib/stock';
import { ShoppingBag, Zap, Clock } from 'lucide-react';
import { calculateDeposit } from '../../lib/deposit';

export interface QuickAddSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  onBuyNow: (product: Product, variant: Variant, quantity: number) => void;
}

export const QuickAddSheet: React.FC<QuickAddSheetProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const def = getDefaultVariant(product);
      setSelectedVariant(def || null);
      setQuantity(1);
      setErrorMsg(null);
    }
  }, [product]);

  if (!product || !selectedVariant) return null;

  const availableStock = getAvailableStock(selectedVariant);
  const isPreorder = selectedVariant.status === 'preorder';
  const isOutOfStock = availableStock <= 0;

  const handleVariantSelect = (v: Variant) => {
    setSelectedVariant(v);
    setQuantity(1);
    setErrorMsg(null);
  };

  const handleAddToCart = () => {
    const check = checkCanAddToCart(0, quantity, selectedVariant);
    if (!check.allowed) {
      setErrorMsg(check.message || 'Không đủ số lượng trong kho.');
      return;
    }
    onAddToCart(product, selectedVariant, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    const check = checkCanAddToCart(0, quantity, selectedVariant);
    if (!check.allowed) {
      setErrorMsg(check.message || 'Không đủ số lượng trong kho.');
      return;
    }
    onBuyNow(product, selectedVariant, quantity);
    onClose();
  };

  const depositValue = isPreorder ? calculateDeposit(selectedVariant.price * quantity, 0, 30) : 0;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Chọn quy cách mua"
      subtitle={`${product.name} · ${product.region}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Hàng chọn chip quy cách */}
        <div>
          <label className="block text-small font-semibold text-[#6B4A32] mb-2">
            Quy cách đóng gói:
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const stock = getAvailableStock(v);
              const isOOS = stock <= 0;
              return (
                <Chip
                  key={v.id}
                  active={selectedVariant.id === v.id}
                  outOfStock={isOOS}
                  onClick={() => handleVariantSelect(v)}
                >
                  <span>{v.label}</span>
                  <span className="ml-1 opacity-80 text-xs">({formatMoney(v.price)})</span>
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Thông tin tồn kho & Ngày giao */}
        <div className="p-3 bg-[#F3EEE2] rounded-2xl border border-[#E7DFCF] text-small">
          <div className="flex items-center justify-between">
            <span className="text-[#6B4A32]">Tình trạng:</span>
            <span className="font-semibold text-[#1B1B1F]">
              {isOutOfStock ? (
                <span className="text-[#A63D3D]">Tạm hết hàng</span>
              ) : isPreorder ? (
                <span className="text-[#B7791F] flex items-center gap-1">
                  <Clock size={14} /> Đặt trước (Còn {availableStock} suất)
                </span>
              ) : (
                <span className="text-[#2F6B4F]">Còn hàng ({availableStock} có sẵn tại kho Hà Nội)</span>
              )}
            </span>
          </div>

          {isPreorder && selectedVariant.expectedDeliveryDate && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E7DFCF]">
              <span className="text-[#6B4A32]">Ngày giao dự kiến:</span>
              <span className="font-semibold text-[#1B1B1F]">
                {selectedVariant.expectedDeliveryDate}
              </span>
            </div>
          )}
        </div>

        {/* Số lượng */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="block text-small font-semibold text-[#1B1B1F]">Số lượng</span>
            <span className="text-caption text-[#8F6A4D]">
              Tối đa {availableStock} đơn vị
            </span>
          </div>
          <QuantityStepper
            value={quantity}
            min={1}
            max={Math.max(1, availableStock)}
            disabled={isOutOfStock}
            onChange={(val) => {
              setQuantity(val);
              setErrorMsg(null);
            }}
            onExceedMax={() => setErrorMsg(`Chỉ còn đặt được ${availableStock} sản phẩm.`)}
          />
        </div>

        {/* Thông báo lỗi vượt tồn */}
        {errorMsg && (
          <div className="p-2.5 bg-[#FDF1F1] border border-[#A63D3D]/30 text-[#A63D3D] text-small rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tổng tiền & Cọc nếu có */}
        <div className="pt-2 border-t border-[#E7DFCF] flex items-baseline justify-between">
          <span className="text-body text-[#6B4A32]">Tạm tính:</span>
          <div className="text-right">
            <div className="price-tag text-2xl">
              {formatMoney(selectedVariant.price * quantity)}
            </div>
            {isPreorder && (
              <div className="text-caption text-[#B7791F] font-semibold mt-0.5">
                Cọc 30%: {formatMoney(depositValue)}
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            leftIcon={<ShoppingBag size={18} />}
          >
            Thêm vào giỏ
          </Button>
          <Button
            variant="primary"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            leftIcon={<Zap size={18} />}
          >
            {isPreorder ? 'Đặt trước ngay' : 'Mua ngay'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
