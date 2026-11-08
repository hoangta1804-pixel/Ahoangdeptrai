# Nội dung giao diện và dữ liệu gắn với một vùng

Ngày rà soát: 07/11/2026. Yêu cầu mới ở SRS Phase 2 là sàn đặc sản đa vùng; chỉ giao trong Hà Nội. Vùng được phép xuất hiện trên trường nguồn gốc của từng sản phẩm, không được mặc định thành nhận diện, lời giới thiệu, bộ lọc duy nhất hay điều kiện tham gia sàn.

| Vị trí | Dấu hiệu hiện tại | Đề xuất xử lý |
| --- | --- | --- |
| `src/components/Brand.tsx:5,28,45` | Brand ghi “Lào Cai”; dải hoa văn thổ cẩm. | Bỏ địa danh và hoạ tiết đặc trưng vùng; dùng wordmark trung tính. |
| `src/screens/HomePage.tsx:28-30,81,93,249` | Banner và khám phá địa danh đều xoay quanh Lào Cai/Bắc Hà/Sa Pa/Mường Khương. | Đổi thành nội dung đa vùng; khu vực nhận hàng Hà Nội được giữ riêng. |
| `src/components/layout/Header.tsx:68,80,176`; `src/components/layout/Footer.tsx:24,28,71,146` | Nhãn, tìm kiếm, footer tự nhận sàn Lào Cai và chỉ bán hàng Lào Cai. | Bỏ giới hạn nguồn hàng khỏi nhận diện; giữ “Giao tại Hà Nội”. |
| `src/screens/ContentPages.tsx:21,24,66,91,124` | Câu chuyện, sản phẩm và mùa vụ gọi địa danh Tây Bắc/Lào Cai/Bắc Hà/Sa Pa/Mường Khương; câu chính sách giao nêu sản phẩm của một vùng. | Viết lại phần thương hiệu trung tính. Chỉ nêu địa danh trong nội dung chi tiết của đúng sản phẩm, nguồn dữ liệu đã xác minh. |
| `src/screens/ExploreTab.tsx:153`; `src/screens/customer/StorefrontPage.tsx:21-23,92,94` | Chủ đề, vùng card, footer và nội dung bài kể tập trung các địa danh Tây Bắc. | Chủ đề chung theo mùa/danh mục; vùng là dữ liệu sản phẩm hoặc bộ lọc đa lựa chọn, không phải điểm nhấn mặc định. |
| `src/screens/CatalogPage.tsx:271,366`; `src/screens/customer/ProductCatalogPage.tsx:40` | Bộ lọc/empty state nói “Vùng xuất xứ Lào Cai” hoặc “đặc sản Lào Cai”. | Bộ lọc đa vùng; empty state dùng câu trung tính. |
| `src/screens/TraceabilityPage.tsx:52,62`; `src/screens/customer/TraceLotSheet.tsx:22` | Giá trị fallback tự thêm Lào Cai hoặc Suối Giàng. | Không ghép tỉnh mặc định vào vùng sản phẩm; lấy địa danh từ dữ liệu đã duyệt, thiếu thì ghi “Chưa có thông tin”. |
| `src/components/product/ProductDetailPage.tsx:200,292`; `src/components/product/Viewer3D.tsx:181,189` | Tên nhà cung cấp fallback và nội dung trưng bày 3D gắn Lào Cai/Tây Bắc. | Nội dung fallback trung tính; phần trưng bày dùng token/theme, không hoạ tiết vùng. |
| `src/components/cart/FloatingCart.tsx:99`; `src/components/checkout/DeliverySheet.tsx:61` | Empty state giỏ và mô tả giao hàng nhắc riêng Lào Cai. | Viết lại không giả định nguồn vùng; giữ quy tắc chỉ giao Hà Nội. |
| `src/components/admin/MediaManager.tsx:126` | Hướng dẫn duyệt media buộc sản phẩm thuộc Lào Cai. | Yêu cầu trung thực bao bì giữ nguyên; bỏ điều kiện tỉnh. |
| `src/screens/coopApply/CoopApplySheet.tsx:102,104`; `src/screens/coop/CoopProfileTab.tsx:90`; `src/domain/coopApplication.ts:35`; `src/domain/coopContact.ts:47` | Form và logic onboarding yêu cầu nơi sản xuất/địa chỉ ở Lào Cai. | Cần rà soát nghiệp vụ ngoài trải nghiệm mua: nhận nhà cung cấp đa tỉnh, giữ trường địa chỉ hợp lệ; chỉ dùng cờ tỉnh nếu có quy tắc vận hành được duyệt. |
| `src/screens/customer/AddressFormSheet.tsx:75`; `src/screens/customer/CheckoutSheet.tsx:645` | Ví dụ tỉnh giao và tỉnh người nhận là Lào Cai. | Địa chỉ giao hàng chỉ Hà Nội theo BR-MN-06; địa chỉ người nhận quà dùng ví dụ trung tính. |
| `src/screens/admin/ContentManagementTab.tsx:15`; `src/screens/admin/AdminScreen.tsx:66`; `src/screens/admin/SurveyTab.tsx:11`; `src/data/seed.ts:5,193`; `src/data/laoCaiSurvey.ts` | Nội dung mặc định và khảo sát sản phẩm/nhà cung cấp lấy từ một vùng. | Không dùng nguyên bộ seed làm dữ liệu mẫu Phase 2. Tạo fixture đa vùng đã kiểm nguồn; giữ khảo sát gốc làm tư liệu lịch sử, không sửa số liệu nguồn để giả thành đa vùng. |
| `src/mock/products.ts:241-1355`; `src/mock/suppliers.ts:9-41` | Prototype mới có sản phẩm, câu chuyện, ảnh alt và nhà cung cấp hầu như chỉ ở Lào Cai. | Dữ liệu vùng cho từng mặt hàng được phép, nhưng cần fixture sản phẩm từ nhiều vùng và tên nhà cung cấp độc lập địa danh để đáp ứng SRS mục 3.8. |
| `src/lib/orderSplit.ts:117` | Tên nhà cung cấp dự phòng gắn Lào Cai. | Dùng “Nhà cung cấp”. |
| `src/components/ProductIllustration.tsx:240`; `src/mock/products.ts:328,415,594,671,683,714,822,913,1094,1154,1183,1348-1355` | Minh hoạ và nội dung/ảnh alt có địa danh, ruộng bậc thang, thổ cẩm, vùng nguyên liệu riêng. | Ảnh/câu chuyện từng sản phẩm chỉ giữ khi dữ liệu sản phẩm đó thực sự có nguồn tương ứng; ảnh chủ đề và khung app dùng hình trung tính, đồng nhất trên mọi theme. |
| `public/images/stitch/sources.json:10,15,45`; ảnh `public/images/stitch/region-1.jpg`–`region-6.jpg`, `hero.jpg`, `specialties-hero-v2.jpg`, `farmer.jpg`, `story-1.jpg`–`story-3.jpg`, `smoked-meat.jpg` | Mô tả nguồn ảnh gọi Tây Bắc, bản làng, ruộng bậc thang, thịt gác bếp; các ảnh vùng/hero/story có ngữ cảnh thị giác vùng cao. | Dùng ảnh sản phẩm đã xác minh theo từng sản phẩm; thay hình hero/region/story dùng làm nhận diện bằng hình trưng bày trung tính, không gắn vùng. Kiểm bản quyền/nguồn ảnh trước khi đưa lên bản mẫu. |
| `src/index.css:127`; `src/components/Brand.tsx:45` | Comment/kiểu trang trí đề xuất thổ cẩm/quả trám/răng cưa. | Loại hoạ tiết này khỏi hệ giao diện Phase 2. |
| `artifacts/mobile-before.png` | Ảnh chụp giao diện cũ có nhận diện hiện hành. | Giữ nguyên chỉ làm ảnh “trước” trong hồ sơ; không dùng làm asset mới. |

## Phân biệt dữ liệu theo vùng với khóa giao diện

Tên địa danh như `region` trong từng bản ghi sản phẩm, địa chỉ thật của nhà cung cấp, chứng nhận và thông tin truy xuất vẫn có thể được giữ khi có căn cứ. Không được tự thay dữ liệu nguồn của các sản phẩm Lào Cai thành tỉnh khác. Tuy nhiên fixture mẫu phải có sản phẩm từ nhiều vùng (SRS mục 3.8); dữ liệu hiện tại chưa đạt điều này. Các bài test dùng Lào Cai như dữ liệu cụ thể cũng không tự thân là khóa giao diện, nhưng những assertion ép mọi nhà cung cấp phải thuộc Lào Cai cần được rà theo phạm vi kinh doanh mới.

Kết quả rà theo chuỗi tên tỉnh/địa danh bằng `rg` nằm ở các vị trí liệt kê trên. Chưa xác minh bằng mắt toàn bộ ảnh JPG; việc kiểm duyệt hình ảnh phải làm ở Giai đoạn 3 trước khi nộp mẫu.
