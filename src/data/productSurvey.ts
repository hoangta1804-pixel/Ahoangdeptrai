/**
 * Nối sản phẩm đang bán với dữ liệu khảo sát của nhóm (src/data/laoCaiSurvey.ts).
 * Quy cách thêm (variantOf) dùng chung dữ liệu với sản phẩm gốc.
 */
import type { Product } from '../domain/types';
import { LAO_CAI_SURVEY, type SurveyProduct } from './laoCaiSurvey';

/** Mã sản phẩm mẫu → mã dòng khảo sát. Sản phẩm HTX tự tạo không có trong bảng thì không hiện phần khảo sát. */
export const PRODUCT_SURVEY_ID: Record<string, string> = {
  'prod-che': 'che-shan-tuyet',
  'prod-thaoqua': 'thao-qua',
  'prod-mutman': 'mut-man-tam-hoa',
  'prod-matong': 'mat-ong-thanh-xuan',
  'prod-gao': 'gao-seng-cu',
  'prod-phohong': 'pho-hong',
  'prod-man': 'man-tam-hoa-tuoi',
  'prod-com': 'com-tu-le',
  'prod-buoi': 'buoi-dai-minh',
  'prod-gaonep': 'gao-nep-tan-tu-le',
  'prod-mien': 'mien-dao-gioi-phien',
  'prod-matong-mcc': 'mat-ong-mu-cang-chai',
  'prod-cam': 'cam-luc-yen',
};

const BY_ID = new Map(LAO_CAI_SURVEY.map((s) => [s.id, s]));

export function surveyOf(product: Pick<Product, 'id' | 'variantOf'>): SurveyProduct | undefined {
  const id = PRODUCT_SURVEY_ID[product.variantOf ?? product.id];
  return id ? BY_ID.get(id) : undefined;
}

/** Nhóm theo đề xuất giai đoạn đầu của tab 1 (để Admin xem nhanh danh mục tiềm năng). */
export function surveyByPriority(): Map<string, SurveyProduct[]> {
  const groups = new Map<string, SurveyProduct[]>();
  for (const s of LAO_CAI_SURVEY) {
    const key = s.priority ?? 'Chưa phân loại';
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return groups;
}
