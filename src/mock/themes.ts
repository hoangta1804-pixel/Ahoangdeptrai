import { ThemeId } from './types';

export interface ThemeDefinition {
  id: ThemeId;
  title: string;
  subtitle: string;
  badgeLabel: string;
}

export const THEME_DEFINITIONS: Record<ThemeId, ThemeDefinition> = {
  in_season: {
    id: 'in_season',
    title: 'Đang vào vụ',
    subtitle: 'Nông sản mùa mới, tươi ngon trọn vị đất trời',
    badgeLabel: 'Theo mùa',
  },
  best_seller: {
    id: 'best_seller',
    title: 'Bán chạy nhất',
    subtitle: 'Những thức quà được người sành ẩm thực yêu thích nhất',
    badgeLabel: 'Bán chạy',
  },
  gift: {
    id: 'gift',
    title: 'Gợi ý quà biếu',
    subtitle: 'Trao gửi chân tình qua từng thức quà trang trọng, chỉn chu',
    badgeLabel: 'Quà biếu',
  },
};
