# Truy vết SRS Phase 2 với mã hiện có

Ngày: 07/11/2026. Đánh giá theo ứng dụng được khởi chạy bởi `src/App.tsx`, không coi component chưa gắn vào runtime là luồng đang chạy. “Một phần” nghĩa là có UI/logic prototype hoặc domain cũ nhưng chưa chứng minh đủ tiêu chí SRS và vận hành thật. “Chưa có” nghĩa là không tìm thấy luồng/asset tương ứng. “Trái SRS” nghĩa là hành vi/kiến trúc hiện chạy có mâu thuẫn rõ. Không chạy test trong lượt khảo sát.

## Tóm tắt Must

| Trạng thái | Số Must |
| --- | ---: |
| Đã có đầy đủ | 0/13 |
| Một phần (UI prototype hoặc logic cũ, thiếu bằng chứng server/acceptance) | 13/13 |
| Chưa có | 1/13 |

Trong 13 Must của bảng FR, tất cả đang một phần: FR-TKSP-11/12/13, FR-MHTT-08/09/10/11/12/13/14/15/16 và FR-SP-10. Không tiêu chí nào được xác nhận hoàn chỉnh vì runtime Phase 2 là prototype client-side, chưa bật cờ, chưa có kiểm thử nghiệm thu được chạy và chưa chứng minh kiểm soát máy chủ. FR-TKSP-14 vẫn là Should/Chờ duyệt, không tính vào Must.

Ước lượng sơ bộ cho 13 Must trên web/app web responsive: **30–45 ngày công** (giả định một codebase web; chưa tính làm nội dung ảnh/3D, kiểm thử khách thật, cập nhật tài liệu gốc, triển khai và xử lý dữ liệu thật). Rủi ro cao nhất là backend-authoritative checkout/giữ tồn, OTP và gộp giỏ thật, địa chỉ Hà Nội theo danh mục hiện hành, và media admin. Mốc 07/12–08/01 có 24 ngày làm việc theo lịch thường; cần Dev xác nhận số người và phạm vi trước khi chốt câu hỏi mở 1.

## Yêu cầu chức năng mới

| Mã | Tóm tắt | Ưu tiên | Duyệt | Trạng thái code | Bằng chứng (file:dòng) | Việc cần làm | Cỡ | Phụ thuộc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FR-TKSP-11 | Băng chuyền theo chủ đề và thẻ sản phẩm | Must | Đã chốt | Một phần | `src/screens/HomePage.tsx:143-176`; `src/components/product/ProductCard.tsx` | Giới hạn 12, Xem tất cả theo chủ đề, keyboard/drag và dữ liệu đa vùng; chạy acceptance | M | FR-MHTT-08 |
| FR-TKSP-12 | Gallery ảnh/video/360/3D, thứ tự và cử chỉ | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:145-170` | Đối chiếu BR-PT-05; chưa thấy gallery đủ loại/cử chỉ pinch/fullscreen và keyboard | L |
| FR-TKSP-13 | Tải 3D theo tương tác, điều khiển và giải phóng | Must* | Đã chốt | Một phần | `src/components/product/Viewer3D.tsx`; `src/components/product/ProductDetailPage.tsx` | Dùng asset thật, dynamic import sau chạm, kiểm thiết bị/bộ nhớ/fallback | L | BR-PT-01–03, NFR-MN-02/05/09 |
| FR-TKSP-14 | Ảnh xoay 360° | Should | Chờ duyệt | Chưa có | Không thấy tệp 360° trong `public`; `src/components/product/ProductDetailPage.tsx` | Chờ quyết định: Should hay đổi fallback 3D thành ảnh thường | M | Sếp/BA quyết định |
| FR-TKSP-15 | AR qua camera | Could | Làm sau (D17) | Chưa có (đúng ngoài phạm vi) | Không thấy AR package/route; SRS mục 1 | Không triển khai Phase 2 | S | D17 |
| FR-TKSP-16 | Điều hướng sản phẩm trước/sau, giữ bộ lọc | Should | Chờ duyệt | Một phần | `src/components/product/ProductDetailPage.tsx`; `src/app/Phase2App.tsx:167-188` | Kiểm tra thao tác không xung đột gallery, giữ URL/bộ lọc | M |
| FR-MHTT-08 | Thêm nhanh và hoàn tác | Must | Đã chốt | Một phần | `src/app/Phase2App.tsx:89-109`; `src/stores/cartStore.ts:103-192` | Kiểm tồn server, aria-live và thêm lại đúng lượng trong các tình huống đồng thời | M | BR-MN-02/11 |
| FR-MHTT-09 | Chọn quy cách và cập nhật giá/tình trạng/media | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:52-94` | Kiểm quy cách mặc định còn hàng và dữ liệu động phía server | M | BR-MN-01/03 |
| FR-MHTT-10 | Thanh mua dính đáy theo trạng thái | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:126-156` | Xác nhận sticky/safe-area, tiền cọc và trạng thái hết hàng | M | BR-MN-03/09 |
| FR-MHTT-11 | Giỏ nổi, nhóm hàng, sửa/xóa/hoàn tác | Must | Đã chốt | Một phần | `src/components/cart/FloatingCart.tsx:37-275`; `src/stores/cartStore.ts:193-222` | Đồng bộ giỏ tài khoản thật, nhóm đúng, undo accessible | M | BR-MN-02/11 |
| FR-MHTT-12 | Giỏ tạm khách và gộp sau OTP | Must | Đã chốt (D15) | Một phần | `src/stores/cartStore.ts:4-75,224-251`; `src/app/Phase2App.tsx:135-158` | Tách cart server/account và guest local, xác nhận idempotent/expiry, chỉ xóa guest sau merge thành công | L | BR-MN-05, BR-ACC-002 |
| FR-MHTT-13 | Phiên Mua ngay không chạm giỏ | Must | Đã chốt | Một phần | `src/stores/buyNowStore.ts:17-43`; `src/app/Phase2App.tsx:111-124` | Bảo toàn qua OTP và reload; kiểm server; hết hạn/thoát đúng vòng đời | L | BR-MN-04 |
| FR-MHTT-14 | Checkout một màn, tính lại và kiểm lại khi mở/nộp | Must | Đã chốt | Một phần | `src/components/checkout/CheckoutOnePage.tsx:161-207,233-301` | Chuyển tính toán/giá/tồn/phí/discount sang server; giữ mọi bước kiểm của checkout cũ | L | FR-MHTT-02/05, BR-MN-06–12 |
| FR-MHTT-15 | Địa chỉ/cách giao/thanh toán mặc định | Must | Đã chốt | Một phần | `src/components/checkout/CheckoutOnePage.tsx:99-115`; `src/mock/users.ts` | Đọc lựa chọn thật lần trước, sửa địa chỉ danh mục Hà Nội | M | FR-MHTT-14 |
| FR-MHTT-16 | Màn xác nhận một lần đặt và các đơn | Must | Đã chốt | Một phần | `src/components/checkout/OrderConfirmationPage.tsx:26-53,175-237` | Mã và trạng thái phải lấy từ backend/payment gateway; xác nhận số tiền thật | M | FR-MHTT-14 |
| FR-MHTT-17 | Mua lại từ đơn đã giao | Should | Chờ duyệt | Chưa có | Không tìm thấy action mua lại trong runtime; `src/screens/OrderTrackingPage.tsx` | Chỉ làm nếu xếp đợt; kiểm giá/tồn từng món | M |
| FR-MHTT-18 | Báo khi có hàng | Could | Chờ duyệt | Một phần | `src/components/product/ProductDetailPage.tsx:57,235-260` (state UI) | Cần backend đăng ký/thông báo và phân biệt UI demo | M | Sếp/BA duyệt |
| FR-SP-10 | Tải/duyệt media sản phẩm | Must | Đã chốt | Một phần | `src/components/admin/MediaManager.tsx:25-92,185-303`; route `src/app/Phase2App.tsx:277-289` | Upload, kiểm MIME/kích thước, đồng ý bản quyền, lịch sử phiên bản và lưu server chưa được chứng minh | L | BR-PT-01–07 |

*SRS ghi FR-TKSP-13 là Must với sản phẩm có 3D.

## Quy tắc BR-MN

| Mã | Tóm tắt | Ưu tiên | Duyệt | Trạng thái code | Bằng chứng | Việc cần làm | Cỡ | Phụ thuộc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BR-MN-01 | Chọn quy cách mặc định đầu tiên còn hàng | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:52-56`; `src/mock/products.ts` | Xác nhận sắp thứ tự và fallback khi tất cả hết | M | FR-MHTT-09 |
| BR-MN-02 | Mọi cách thêm kiểm tồn | Must | Đã chốt | Một phần | `src/stores/cartStore.ts:103-112`; `src/lib/stock.ts` | Kiểm ở server cho mọi đường thêm và lúc submit | L | NFR-MN-08 |
| BR-MN-03 | Nút theo trạng thái còn hàng/đặt trước/hết hàng | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:70-94,126-156` | Bao phủ hết hàng không mở preorder, mọi quy cách/thẻ | M | FR-MHTT-08–10 |
| BR-MN-04 | Phiên Mua ngay riêng, không sửa giỏ | Must | Đã chốt (ĐX) | Một phần | `src/stores/buyNowStore.ts:25-43`; `CheckoutOnePage.tsx:108-160,288-295` | Kiểm reload, OTP, timeout và lịch sử; xác nhận giỏ X/Y nguyên vẹn | L | FR-MHTT-13 |
| BR-MN-05 | Giỏ tạm 7 ngày và gộp có chặn tồn | Must | Đã chốt* | Một phần | `src/stores/cartStore.ts:4-75,224-251` | `expiresAt` hiện tính từ lúc lưu; xác minh cập nhật theo lần sửa, xử lý tồn và xóa sau merge server thành công | L | FR-MHTT-12 |
| BR-MN-06 | Chỉ giao Hà Nội, chọn phường/xã từ danh mục | Must | Đã chốt | Trái SRS | `src/components/checkout/CheckoutOnePage.tsx:233-253`; `src/screens/customer/AddressFormSheet.tsx:63-102`; `src/domain/checkout.ts:161-165` | Chặn ngoài Hà Nội ở máy chủ, không nhập tự do; hỗ trợ để số có đồng ý | L | Danh mục địa giới; tài liệu AC/MSG gốc |
| BR-MN-07 | Tách đơn theo nhà cung cấp/loại/ngày; phí theo chuyến | Must | Đã chốt (D13) | Một phần | `src/lib/orderSplit.ts`; `src/components/checkout/CheckoutOnePage.tsx:168-170` | Đối chiếu phí chuyến và delivery date với nguồn gốc; lưu/đối soát server | L | D13, BR-MHTT-02 |
| BR-MN-08 | Gộp online/cọc; COD; giữ 15 phút; xử lý tiền về muộn | Must | Đã chốt | Một phần | `src/components/checkout/CheckoutOnePage.tsx:177-207,278-286`; `src/stores/orderStore.ts:4,76-114` | Chưa tích hợp gateway/server polling; kiểm lại phép tính và luồng hoàn tiền | L | BR-MHTT-23–27 (cần đối chiếu tài liệu gốc) |
| BR-MN-09 | Cọc preorder 30%, loại giao và phần còn lại | Must | Đã chốt (D14) | Một phần | `src/lib/deposit.ts`; `src/components/checkout/CheckoutOnePage.tsx:176-202` | Đối chiếu công thức AC-MHTT-09; hỏi quyết định làm tròn/cách trả phần còn | M | D14, AC-MHTT-09 gốc |
| BR-MN-10 | Chỉ giữ/trừ tồn khi tạo đơn, nhả khi hủy/hết hạn | Must | Đã chốt (ĐX) | Trái SRS | `src/components/checkout/CheckoutOnePage.tsx:233-301`; `src/domain/stock.ts:35-56`; `src/domain/orders.ts:363-369` | Prototype tạo đơn local, không khoá cạnh tranh hoặc transaction server; xây kiểm nguyên tử và nhả tồn | L | Backend, BR-MHTT-03 |
| BR-MN-11 | Hoàn tác đúng lượng trong 5 giây | Must | Đã chốt (ĐX) | Một phần | `src/stores/cartStore.ts:145-192`; `src/app/Phase2App.tsx:89-109` | Kiểm accessibility timer/aria-live và thao tác liên tiếp/xóa | M | FR-MHTT-08/11 |
| BR-MN-12 | Tối đa một mã, chia giảm theo tỷ lệ tiền hợp lệ | Must | Đã chốt (D16) | Một phần | `src/lib/voucher.ts`; `src/components/checkout/CheckoutOnePage.tsx:173-207` | Chuyển sang server, làm tròn/phân bổ cuối; đối chiếu AC-MHTT-15 gốc | M | D16, source gốc |
| BR-MN-13 | Hàng sẵn kho do sàn xác nhận | Must | Chờ sếp xác nhận (D13) | Chưa có | Store order prototype chỉ tạo `OrderGroup`; không có luồng vai trò xác nhận tương ứng | Bổ sung xử lý server sau khi D13 được sếp xác nhận | L | D13; BR-MHTT-30 gốc |

*Giỏ tạm 7 ngày ghi là giả định trong SRS.

## Quy tắc BR-PT

| Mã | Tóm tắt | Ưu tiên | Duyệt | Trạng thái code | Bằng chứng | Việc cần làm | Cỡ | Phụ thuộc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BR-PT-01 | 5–10 ảnh, tối đa video/360/3D theo mã gốc | Must | Đã chốt | Một phần | `src/mock/products.ts`; `src/components/admin/MediaManager.tsx:92-96` | Đếm/kiểm giới hạn server, ảnh mẫu đa vùng và đủ asset | M |
| BR-PT-02 | 3D đúng hàng thật và đã duyệt | Must | Đề xuất | Một phần | `src/components/admin/MediaManager.tsx:126`; `src/mock/products.ts` | Quy trình kiểm thật chưa được nối asset và trạng thái duyệt thật | M |
| BR-PT-03 | Giới hạn kích thước/định dạng/nén | Must | Đề xuất | Chưa có | `MediaManager.tsx` chưa thấy pipeline upload/validation tệp | Thêm validation server và kiểm thử file thật | L |
| BR-PT-04 | Có phiếu đồng ý khi nguồn ảnh cần | Must | Đã chốt | Chưa có | Không thấy trường/tệp đồng ý trong `MediaItem`/form theo dõi được | Bổ sung lưu trữ và chặn duyệt | M |
| BR-PT-05 | Thứ tự thư viện theo nhóm ảnh | Must | Đề xuất | Một phần | `src/components/product/ProductDetailPage.tsx:145-170` | Sắp media theo nhóm/sequence từ server | M |
| BR-PT-06 | Chạm kích hoạt 3D/360; kéo không cuộn thư viện | Must | Đề xuất | Một phần | `src/components/product/Viewer3D.tsx:155-176` | Chứng minh gesture ownership bằng TS-UI-05 trên thiết bị thật | L |
| BR-PT-07 | Cần sửa bắt buộc lý do; bản cũ còn hiệu lực | Must | Đề xuất | Một phần | `src/components/admin/MediaManager.tsx:30-89,260-303` | Lưu lịch sử phiên bản và kiểm lý do bền vững phía server | M |

## NFR-MN

| Mã | Tóm tắt | Ưu tiên | Duyệt | Trạng thái code | Bằng chứng | Việc cần làm | Cỡ | Phụ thuộc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-MN-01 | Ảnh chính ≤2,5 giây trên 4G | Must | Đề xuất | Chưa có | Không có kết quả Lighthouse/4G; `public/images` chủ yếu JPG | Đo trên bản mẫu và ghi kết quả | M | Asset tối ưu |
| NFR-MN-02 | Ảnh đại diện tức thời, 3D theo ngưỡng 3 giây/4G | Must | Đề xuất | Chưa có | Không thấy tệp 3D `.glb/.gltf/.usdz` trong `public` | Tạo asset test và đo tải/dựng | L | Viewer dynamic import |
| NFR-MN-03 | Vuốt/xoay gần 60 fps | Must | Đề xuất | Chưa có | Không có phép đo; `src/motion.css` nhiều animation | Đo Android tầm trung/DevTools | M | Thiết bị chuẩn |
| NFR-MN-04 | UI phản hồi ≤0,1 giây và hoàn tác khi lỗi | Must | Đề xuất | Một phần | `src/stores/cartStore.ts:103-139`; giao dịch demo local | Đo mạng chậm và xử lý optimistic rollback từ server | M | API |
| NFR-MN-05 | Tương thích Safari/Chrome; fallback | Must | Đề xuất | Một phần | UI responsive, `Viewer3D.tsx`; chưa thấy matrix thiết bị hoặc fallback asset | Kiểm trên browser/device list, chọn fallback thật | M | FR-TKSP-13 |
| NFR-MN-06 | Keyboard/touch ≥44px, contrast ≥4.5, alt, reduced motion | Must | Đề xuất | Một phần | Nhiều min-height 44; `src/lib/a11y.ts`; `src/styles/tokens.css` | Chưa có contrast report theo 8 theme/a11y audit; một số control <44 | L | Design tokens |
| NFR-MN-07 | Lazy load ảnh/media, nén, ngoài viewport chưa tải | Must | Đề xuất | Một phần | `src/components/AppImage.tsx`; không có báo cáo dung lượng; chưa có dynamic 3D proof | Kiểm Network/asset budget và lazy image | M | Asset pipeline |
| NFR-MN-08 | Không PII trong cart/events; giá/tồn xác thực server | Must | Đề xuất | Trái SRS | `src/lib/analytics.ts`; `CheckoutOnePage.tsx:233-301` kiểm giá/tồn client | Server authoritative; rà event payload; không dùng kết quả local làm đơn thật | L | Backend checkout |
| NFR-MN-09 | Giải phóng mô hình; 10 sản phẩm liên tiếp không crash | Must | Đề xuất | Chưa có | Không thấy asset 3D thật/đo bộ nhớ | Tải dynamic, dispose thật, đo thiết bị iOS/Android | L | FR-TKSP-13 |

## User story và kịch bản trọng tâm

| Mã | Tóm tắt | Ưu tiên | Duyệt | Trạng thái code | Bằng chứng | Việc cần làm | Cỡ | Phụ thuộc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| US-01 | Vuốt băng chuyền sản phẩm | Must | Đã chốt | Một phần | `src/screens/HomePage.tsx`; `src/components/product/ProductCarousel.tsx` | Kiểm scroll-snap, keyboard, reduced motion trên desktop/mobile | M | FR-TKSP-11 |
| US-02 | Thêm nhanh, hoàn tác và kiểm tồn | Must | Đã chốt | Một phần | `src/app/Phase2App.tsx:89-109`; `src/stores/cartStore.ts:103-192` | Đếm thao tác thực tế, kiểm 5 tồn/4 trong giỏ và undo | M | FR-MHTT-08 |
| US-03 | Xoay 3D, fallback | Must | Đã chốt | Một phần | `src/components/product/Viewer3D.tsx`; chưa có asset thật | Lazy-load, 3 giây/fallback và gesture thật | L | FR-TKSP-13 |
| US-04 | Mua ngay ≤3 chạm | Must | Đã chốt | Một phần | `Phase2App.tsx:167-208`; `CheckoutOnePage.tsx:233-301` | Chứng minh ≤3 chạm đúng điều kiện, trả COD và server tạo đơn | L | FR-MHTT-13–15 |
| US-05 | Xem/sửa giỏ không rời trang | Must | Đã chốt | Một phần | `src/components/cart/FloatingCart.tsx` | Hoàn tác xóa, focus/keyboard, giữ scroll position | M | FR-MHTT-11 |
| US-06 | Một màn đặt hàng | Must | Đã chốt | Một phần | `src/components/checkout/CheckoutOnePage.tsx` | Phí và tiền phải server tính lại; ngoài Hà Nội bị chặn | L | FR-MHTT-14 |
| US-07 | Chọn trước, OTP khi đặt | Must | Đã chốt | Một phần | `src/app/Phase2App.tsx:135-158`; `cartStore.ts:224-251` | OTP thật, merge idempotent, bỏ dòng tạm sau thành công | L | FR-MHTT-12 |
| US-08 | Biết số đơn/phí trước khi đặt | Must | Đã chốt | Một phần | `src/lib/orderSplit.ts`; `CheckoutOnePage.tsx:168-207` | Đối chiếu số đơn/phí và payment split với source gốc | L | FR-MHTT-14/16 |
| US-09 | Admin duyệt phương tiện | Must | Đã chốt | Một phần | `src/components/admin/MediaManager.tsx` | Upload, consent, tệp chưa duyệt, giới hạn và thứ tự chưa đủ bằng chứng | L | FR-SP-10 |
| US-10 | Vuốt ảnh/video/3D trên chi tiết | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:145-170` | Thứ tự media và cử chỉ gallery/360 cần hoàn thiện | L | FR-TKSP-12 |
| US-11 | Đổi quy cách, cập nhật giá/tình trạng | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:52-94` | Kiểm cập nhật giá, status, delivery date, ảnh theo quy cách | M | FR-MHTT-09 |
| US-12 | Thanh mua dính đáy | Must | Đã chốt | Một phần | `src/components/product/ProductDetailPage.tsx:126-156` | Sticky/safe-area và trạng thái preorder/hết hàng | M | FR-MHTT-10 |
| TS-E2E-01 | Gộp giỏ vượt tồn | Must | Đã chốt | Một phần | `src/lib/__tests__/cart_buynow.test.ts`; `src/stores/cartStore.ts:224-251` | Có logic merge mock; chưa thấy E2E/OTP server | L | FR-MHTT-12 |
| TS-E2E-02 | Mua ngay không đụng giỏ | Must | Đã chốt | Một phần | `src/lib/__tests__/cart_buynow.test.ts`; `src/stores/buyNowStore.ts` | Kiểm ba kết cục và xác nhận giỏ bất biến | L | FR-MHTT-13 |
| TS-E2E-03 | Tranh món cuối | Must | Đã chốt | Một phần | `Phase2App.tsx:57,226-230`; `CheckoutOnePage.tsx:233-251` | Hiện chỉ có công tắc giả lập race; cần tranh chấp đồng thời thật trên server | L | BR-MN-02/10 |
| TS-E2E-04 | Tách đơn theo nhà cung cấp/loại | Must | Đã chốt | Một phần | `src/lib/orderSplit.ts`; `CheckoutOnePage.tsx:168-207` | Viết E2E xác nhận 3 đơn, phí chuyến, nút trả tiền | L | BR-MN-07–09 |
| TS-UI-05 | Không chồng gesture khi vuốt và xoay | Must | Đã chốt | Chưa có | Không tìm thấy E2E gesture gallery/3D | Thêm kiểm thử tương tác trên media thật; đo đúng một gesture owner | L | BR-PT-06 |

## FR/BR cũ bị ảnh hưởng

| Mã | Tóm tắt | Ưu tiên | Duyệt | Trạng thái code | Bằng chứng (file:dòng) | Việc cần làm | Cỡ | Phụ thuộc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FR-MHTT-01 | Giỏ, sửa số lượng/xóa, nhóm hàng | Must | Theo SRS hợp nhất | Một phần | `src/domain/cart.ts:50-99`; `src/components/checkout/CheckoutOnePage.tsx:52-53` | Giữ tính năng nhưng thống nhất runtime Phase 2 và server | M | Checkout |
| FR-MHTT-02 | Đặt hàng sẵn, kiểm tra và địa chỉ | Must | Theo SRS hợp nhất | Một phần | `src/domain/checkout.ts:161-251`; `src/screens/customer/CheckoutSheet.tsx:43-184` | Giữ từng bước kiểm tra khi gom thành một màn | L | FR-MHTT-14 |
| FR-MHTT-03 | Đặt trước, ngày giao và cọc | Must | Theo SRS hợp nhất | Một phần | `src/domain/cart.ts:16-35`; `src/domain/checkout.ts:176-185` | So với AC-MHTT gốc; kiểm số tiền/ngày giao | L | BR-MN-09 |
| FR-MHTT-04 | Hộp quà/lời nhắn/người nhận | Should | Theo SRS hợp nhất | Một phần | `CheckoutOnePage.tsx:69-74,620-650` | Giữ validate, dữ liệu người nhận tách khỏi địa chỉ giao | M | Checkout |
| FR-MHTT-05 | COD/online, gộp giao dịch, giữ 15 phút | Must | Theo SRS hợp nhất | Một phần | `src/domain/checkout.ts:335-476`; `src/domain/orders.ts:132-178` | Prototype mới cần gateway/server transaction, giữ idempotency | L | FR-MHTT-14 |
| FR-MHTT-06 | Hiện tổng tiền/đơn | Should | Theo SRS hợp nhất | Một phần | `src/domain/checkout.ts:161-251`; `CheckoutOnePage.tsx:568-610` | Không tin phép tính client | M | BR-MN-08 |
| FR-MHTT-07 | Trả phần còn đơn đặt trước | Must | Theo SRS hợp nhất | Một phần | `src/domain/orders.ts:314-335` | Bảo toàn bước trả phần còn và trạng thái giao | M | Gateway |
| FR-TKSP-06 | Trang chủ/danh mục sản phẩm nổi bật | Should | Theo SRS hợp nhất | Một phần | `src/screens/HomePage.tsx:143-176`; `src/screens/CatalogPage.tsx` | Mở rộng carousel, không làm mất nội dung cũ | M | FR-TKSP-11 |

## Kiểm lại hiện trạng tại SRS mục 2

1. **≤3 lần chạm:** Prototype có đường thẻ → Mua ngay → Đặt hàng (ba thao tác nếu vào chi tiết rồi chọn mua), nhưng chưa có phép đếm/chụp luồng cho US-04. Đường cụ thể hiện có ở `Phase2App.tsx:167-208`; con số nghiệm thu vẫn chưa được đo.
2. **Ngoài Hà Nội:** Không thấy kiểm tra thành phố ở `CheckoutOnePage.tsx:233-253`; chỉ kiểm tra địa chỉ có được chọn. Luồng domain cũ kiểm địa chỉ tồn tại tại `src/domain/checkout.ts:161-165`; không thấy guard Hà Nội ở điểm lập kế hoạch này. Cần đối chiếu API/back-end trước khi khẳng định mọi endpoint.
3. **Đăng nhập trước khi thêm:** Prototype cho guest thêm bằng `handleQuickAdd` (`Phase2App.tsx:89-109`); OTP bật lúc checkout/Mua ngay (`:111-145`). `AppShell` cũ có login gate (`src/app/AppShell.tsx:151`), nhưng `src/App.tsx` hiện render `Phase2App`, không phải shell đó.
4. **Số bước checkout:** UI cũ `CheckoutSheet` có biến `step` và progress “Các bước đặt hàng” (`src/screens/customer/CheckoutSheet.tsx:43,90,196`); các lựa chọn địa chỉ/giao/thanh toán/ưu đãi được kiểm ở các section và trước `placeCheckout` (`:118-184`). Prototype mới `CheckoutOnePage` gom vào một màn, nhưng khối địa chỉ/cách giao/thanh toán vẫn là sheet sửa tại chỗ; chưa xác nhận giữ đủ mọi kiểm tra của đường cũ.
5. **Gallery cũ:** `ProductDetailSheet.tsx:155-166` hiển thị một ảnh lớn và thumbnail dạng ô; không thấy video/360/3D gallery gắn vào luồng cũ. Prototype `ProductDetailPage.tsx:145-170` có media strip nhưng chưa đạt toàn bộ FR-TKSP-12.

## Rủi ro bổ sung

- **Giá/tồn phía client:** `CheckoutOnePage.tsx:161-207` tính tổng/discount; `:233-301` gọi `checkCanAddToCart` trên dữ liệu `products` trong bộ nhớ và tạo `OrderGroup` sau `setTimeout`. Đây là demo, không phải kiểm soát server đạt NFR-MN-08.
- **Cạnh tranh tồn:** `src/lib/stock.ts` tính tồn từ mock; `CheckoutOnePage.tsx:233-251` có cờ giả lập race thủ công, không phải giao dịch khóa tồn đồng thời.
- **Mua ngay:** tách khỏi giỏ qua `buyNowStore`; prototype clear buy-now sau tạo đơn và giữ cart khi mua ngay (`CheckoutOnePage.tsx:288-295`), nhưng chưa chứng minh reload, OTP và quá hạn. Không chuyển phần này thành dữ liệu đơn thực trước khi server có phiên riêng.
- **Bấm lặp:** `isSubmittingRef` chặn lặp trong một mount (`CheckoutOnePage.tsx:233-235`); domain cũ nhận idempotency key (`src/domain/checkout.ts:335-362`). Prototype hiện không gửi key vào server nên chưa bảo đảm hai tab/retry không tạo đơn trùng.

