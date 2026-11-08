import type { Product } from '../mock/types';

/** Ảnh thay thế khi sản phẩm chưa có file ảnh thật (khớp theo tên). */
const FALLBACKS: [RegExp, string][] = [
  [/tương ớt/i, '/images/amora/tuongot.jpg'],
  [/phở|bánh/i, '/images/amora/banhcuon.jpg'],
  [/thịt|gác bếp|trâu|cá/i, '/images/amora/thit.jpg'],
  [/chè|trà/i, '/images/stitch/tea.jpg'],
  [/mật/i, '/images/stitch/honey.jpg'],
  [/thảo quả/i, '/images/catalog/cardamom.jpg'],
];

/** Danh sách nguồn ảnh theo thứ tự ưu tiên (loại trùng). */
export function productImageSources(product: Product, ...preferred: (string | undefined)[]): string[] {
  const fallback = FALLBACKS.find(([re]) => re.test(product.name))?.[1];
  const main = product.media.find((m) => m.type === 'photo' && m.group === 'main')?.url;
  return [...new Set([...preferred, main, fallback].filter(Boolean) as string[])];
}

export function productEmoji(category: string): string {
  return category === 'tea' ? '🍵' : category === 'fresh' ? '🍎' : category === 'processed' ? '🍯' : category === 'gift' ? '🎁' : '🌾';
}
