# Dữ liệu khảo sát sản phẩm Lào Cai (01/11/2026)

Nguồn: Google Sheets "DS sản phẩm Lào Cai" của nhóm, gồm 4 tab: Sản phẩm, Giá & thị trường (HN), Persona Mai Hoa, Nội dung & bản quyền. Mọi thông tin là khảo sát của nhóm, chưa được HTX xác nhận.

## Trong mã nguồn

| File | Nội dung |
|---|---|
| `src/data/laoCaiSurvey.ts` | 31 dòng (30 sản phẩm của tab 1 + Atiso Sa Pa chỉ có ở tab giá) và persona. Tự sinh, không sửa tay. |
| `scripts/import-lao-cai-survey.py` | Sinh lại file trên từ CSV của 4 tab: `python -X utf8 scripts/import-lao-cai-survey.py <thư mục CSV> src/data/laoCaiSurvey.ts` (1.csv Sản phẩm, 2.csv Giá, 3.csv Persona, 4.csv Nội dung). |
| `src/data/productSurvey.ts` | Nối mã sản phẩm mẫu với dòng khảo sát (`surveyOf`). |
| `src/screens/customer/ProductStory.tsx` | Mục "Câu chuyện từ vùng đất" ở trang chi tiết: câu chuyện, văn hoá, cách dùng, cách làm, mùa vụ, bảo quản. Không hiện ghi chú nội bộ. |
| `src/screens/admin/SurveyTab.tsx` | Tab "Khảo sát sản phẩm" cho Admin Vận hành và Chất lượng: lọc theo đề xuất giai đoạn đầu, giá thị trường, việc cần xác minh, quyền dùng ảnh, persona. |

## Danh mục mẫu bổ sung (`src/data/seed.ts`)

Thêm 4 sản phẩm, 3 HTX mẫu (Giới Phiên, Mù Cang Chải, Lục Yên) và tài khoản demo 0900000108–0900000110:

| Mã | Tên trên sàn | Quy cách, giá | Căn cứ |
|---|---|---|---|
| `prod-gaonep` | Gạo nếp Tan (Tú Lệ) | túi 2 kg, 140.000đ | Ưu tiên cao; giá lẻ HN 50–90k/kg (ước lượng) |
| `prod-mien` | Miến dong (miến đao) | gói 500 g, 45.000đ | Ưu tiên cao; 70–100k/kg |
| `prod-matong-mcc` | Mật ong hoa rừng (Mù Cang Chải) | chai 500 ml, 280.000đ | Ưu tiên cao; 450–700k/lít |
| `prod-cam` | Cam Lục Yên (đặt trước) | thùng 5 kg, 175.000đ (giá mẫu) | Thử đặt trước; chưa có giá |

- Tên không dùng chỉ dẫn địa lý/nhãn hiệu tập thể ("Mật ong Mù Cang Chải", "Miến đao Giới Phiên") vì tab 3 yêu cầu hỏi chủ sở hữu trước.
- OCOP chỉ ghi trong `sample.dossierNote`, luôn kèm "theo hồ sơ nhóm, chờ xác minh".
- Không thêm ảnh: chưa sản phẩm nào được phép dùng ảnh/video.

## Đưa lên môi trường đang chạy

Dữ liệu mẫu chỉ được nạp khi cơ sở dữ liệu trống. Môi trường demo đã có dữ liệu: dùng Công cụ demo → khôi phục dữ liệu mẫu (xoá đơn và thao tác đã có). Môi trường thật (không demo) không nạp sản phẩm mẫu; HTX tạo sản phẩm và Admin – Chất lượng duyệt như bình thường.
