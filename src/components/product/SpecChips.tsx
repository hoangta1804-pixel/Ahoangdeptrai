import React from 'react';
import { Variant } from '../../mock/types';
import { Chip } from '../ui/Chip';
import { getAvailableStock } from '../../lib/stock';
import { formatMoney } from '../../lib/pricing';

export interface SpecChipsProps {
  variants: Variant[];
  selectedVariant: Variant;
  onSelectVariant: (v: Variant) => void;
}

export const SpecChips: React.FC<SpecChipsProps> = ({
  variants,
  selectedVariant,
  onSelectVariant,
}) => {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-2">
      <span className="block text-small font-semibold text-[#6B4A32]">
        Chọn quy cách:
      </span>
      <div className="flex flex-wrap gap-2.5">
        {variants.map((variant) => {
          const available = getAvailableStock(variant);
          const isOOS = available <= 0;
          const isSelected = selectedVariant.id === variant.id;

          return (
            <Chip
              key={variant.id}
              active={isSelected}
              outOfStock={isOOS}
              onClick={() => onSelectVariant(variant)}
            >
              <span>{variant.label}</span>
              <span className="ml-1 opacity-80 text-xs font-mono">
                · {formatMoney(variant.price)}
              </span>
            </Chip>
          );
        })}
      </div>
    </div>
  );
};
