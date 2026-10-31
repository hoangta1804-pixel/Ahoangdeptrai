# Sinh src/data/laoCaiSurvey.ts từ bảng "DS sản phẩm Lào Cai" (xuất mỗi tab ra CSV: 1.csv Sản phẩm, 2.csv Giá & thị trường, 3.csv Persona, 4.csv Nội dung & bản quyền).
# Cách chạy: python -X utf8 scripts/import-lao-cai-survey.py <thư mục chứa CSV> src/data/laoCaiSurvey.ts
import csv,json,re,sys,unicodedata
D=sys.argv[1]; OUT=sys.argv[2]
def rows(n): return list(csv.reader(open(f'{D}/{n}.csv',encoding='utf-8')))
def clean(v):
  v=re.sub(r'\s+',' ',(v or '').replace('\u00a0',' ')).strip()
  # Quy \u01b0\u1edbc giao di\u1ec7n (src/components/__tests__/ui.test.ts): kh\u00f4ng d\u00f9ng nh\u00e3n "ch\u00ednh h\u00e3ng".
  v=re.sub(r'ch\u00ednh h\u00e3ng','ch\u00ednh th\u1ee9c',v,flags=re.I)
  return '' if v.lower() in ('x','') else v
def norm(s):
  s=unicodedata.normalize('NFD',s.lower()); s=''.join(c for c in s if unicodedata.category(c)!='Mn')
  return s.replace('đ','d')
# Khoá: (id, tiền tố tên đã bỏ dấu) — khớp tên giữa 3 sheet.
KEYS=[('che-shan-tuyet',['che shan tuyet']),('thao-qua',['thao qua']),('mut-man-tam-hoa',['mut man','mut / o mai']),
 ('man-tam-hoa-tuoi',['man tam hoa bac ha (tuoi)','man tam hoa tuoi']),('man-hau-ta-van',['man hau','man do ta van']),
 ('dao-sa-pa',['dao sa pa']),('ca-hoi-ca-tam',['ca hoi']),('gao-seng-cu',['gao dac san','gao seng cu']),('pho-hong',['pho hong']),
 ('mat-ong-thanh-xuan',['mat ong thanh xuan','mat ong (thanh xuan']),('lac-do-si-ma-cai',['lac do']),('le-que-duoc-lieu-si-ma-cai',['le, que']),
 ('tra-ca-gai-leo',['tra ca gai leo']),('tinh-bot-san-day',['tinh bot san day']),('vien-nghe-mat-ong',['vien nghe']),('tao-meo',['tao meo']),
 ('thit-gac-bep',['thit']),('que-dieu-thuoc',['que dieu thuoc']),('que',['que']),('mang-kho-nam-gia-vi',['mang kho']),('banh-hat-de-banh-dao',['banh hat de']),
 ('gao-nep-tan-tu-le',['gao nep tan']),('com-tu-le',['com tu le']),('buoi-dai-minh',['buoi dai minh']),('mien-dao-gioi-phien',['mien dao']),
 ('ca-ho-thac-ba',['ca ho thac ba']),('che-bat-tien',['che bat tien']),('mat-ong-mu-cang-chai',['mat ong mu cang chai']),('cam-luc-yen',['cam luc yen']),
 ('mang-mai-lam-thuong',['mang mai']),('atiso-sa-pa',['atiso'])]
def key(name):
  n=norm(clean(name))
  for k,prefixes in KEYS:
    if any(n.startswith(p) for p in prefixes): return k
  raise SystemExit('Không khớp: '+name)
items={}
order=[]
for r in rows(1)[1:]:
  r+=['']*16; k=key(r[1]); order.append(k)
  items[k]={'id':k,'name':clean(r[1]),'localName':clean(r[2]),'group':clean(r[3]),'region':clean(r[4]),'harvest':clean(r[5]),'sellingMonths':clean(r[6]),
    'packaging':clean(r[7]),'packSize':clean(r[8]),'shelfLife':clean(r[9]),'storage':clean(r[10]),'shipping':clean(r[11]),'priority':clean(r[13]),'reliability':clean(r[14]),'notes':clean(r[15])}
for r in rows(2)[1:]:
  if not clean(r[0]): continue
  r+=['']*11; k=key(r[0])
  if k not in items: order.append(k); items[k]={'id':k,'name':clean(r[0])}
  items[k]['market']={'farmGate':clean(r[1]),'wholesale':clean(r[2]),'retailHanoi':clean(r[3]),'priceNotes':clean(r[4]),'specialtyShops':clean(r[6]),'supermarkets':clean(r[7]),'ecommerce':clean(r[8]),'social':clean(r[9]),'peakSeason':clean(r[10])}
for r in rows(4)[1:]:
  if not clean(r[0]): continue
  r+=['']*12; k=key(r[0])
  items[k]['content']={'productPhotos':clean(r[2]),'regionPhotos':clean(r[3]),'producerPhotos':clean(r[4]),'story':clean(r[5]),'culture':clean(r[6]),'usage':clean(r[7]),'processing':clean(r[8]),'photoOwner':clean(r[9]),'mediaRights':clean(r[10]),'toVerify':clean(r[11])}
def strip(o):
  return {k:(strip(v) if isinstance(v,dict) else v) for k,v in o.items() if v not in ('',None,{})}
data=[strip(items[k]) for k in order]
p=rows(3)
persona={'name':'Mai Hoa','segment':'Khách cận cao cấp','profile':'30–45 tuổi, thu nhập trên 25 triệu/tháng, sống tại chung cư cao cấp ở Hà Nội, kỹ tính về sức khỏe',
 'spending':clean(p[0][1]).lstrip('• ').replace('Mức chi trả: ',''),
 'priorities':[clean(x) for x in re.split(r'\n\d\.\s*',p[1][1])[1:]],
 'appRecommendations':[clean(x) for x in p[0][3].split('•')[1:]]}
ts='''/**
 * Dữ liệu khảo sát sản phẩm Lào Cai của nhóm (Google Sheets "DS sản phẩm Lào Cai", 4 tab, đọc ngày 01/11/2026).
 * TỰ SINH bằng scripts/import-lao-cai-survey.py, không sửa tay: chạy lại script khi nhóm cập nhật bảng.
 * - Tab 1 "Sản phẩm": vùng, mùa, quy cách, hạn dùng, bảo quản, mức ưu tiên giai đoạn đầu.
 * - Tab 2 "Giá & thị trường (HN)": giá tại vườn, giá sỉ, giá lẻ Hà Nội, kênh bán, mùa mua cao điểm.
 * - Tab 2b "Persona Mai Hoa": khách cận cao cấp.
 * - Tab 3 "Nội dung & bản quyền": câu chuyện, văn hoá, cách dùng, cách chế biến, quyền dùng ảnh.
 * Mọi thông tin là KHẢO SÁT CỦA NHÓM, CHƯA ĐƯỢC HTX XÁC NHẬN. Chưa sản phẩm nào được phép dùng ảnh/video.
 */
export interface SurveyMarket { farmGate?: string; wholesale?: string; retailHanoi?: string; priceNotes?: string; specialtyShops?: string; supermarkets?: string; ecommerce?: string; social?: string; peakSeason?: string }
export interface SurveyContent { productPhotos?: string; regionPhotos?: string; producerPhotos?: string; story?: string; culture?: string; usage?: string; processing?: string; photoOwner?: string; mediaRights?: string; toVerify?: string }
export interface SurveyProduct {
  id: string; name: string; localName?: string; group?: string; region?: string; harvest?: string; sellingMonths?: string;
  packaging?: string; packSize?: string; shelfLife?: string; storage?: string; shipping?: string;
  /** Đề xuất giai đoạn đầu: Ưu tiên cao / Thử đặt trước / Cân nhắc / Chưa nên / Xác minh thêm / Chỉ khi có đủ giấy ATTP. */
  priority?: string; reliability?: string; notes?: string;
  market?: SurveyMarket; content?: SurveyContent;
}
export interface SurveyPersona { name: string; segment: string; profile: string; spending: string; priorities: string[]; appRecommendations: string[] }

export const LAO_CAI_SURVEY: SurveyProduct[] = '''+json.dumps(data,ensure_ascii=False,indent=2)+''';

export const PERSONA_MAI_HOA: SurveyPersona = '''+json.dumps(persona,ensure_ascii=False,indent=2)+''';
'''
open(OUT,'w',encoding='utf-8',newline='\n').write(ts)
print(len(data),'products; with market',sum('market' in d for d in data),'; with content',sum('content' in d for d in data))
