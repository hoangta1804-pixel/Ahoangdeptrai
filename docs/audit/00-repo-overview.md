# Khảo sát repo Phase 2

Ngày khảo sát: 07/11/2026  
Nhánh: `phase2/ux-rebuild` (tạo từ `main`; workspace đã có thay đổi chưa commit trước khi khảo sát, được giữ nguyên).

## Nguồn SRS và tài liệu

| Tài liệu | Kết quả |
| --- | --- |
| `docx/SRS – Trải nghiệm chọn mua hàng (Phase 2).md` | Bản 1.1, 04/11/2026; chọn làm nguồn SRS mới nhất. Đã đọc hết 374 dòng, tới cuối Phụ lục A. |
| `docs/SRS_UNIFIED_2026-10-29.md` | SRS hợp nhất cũ, 29/10; có FR cũ và quy tắc nền. |
| Các bản khác: `docs/SRS_ACCESS_DECISION_2026-10-29.md`, `SRS_FOLLOWUP_2026-10-29.md`, `SRS_HANDOVER_REFUNDS_2026-10-29.md`, `SRS_IMPLEMENTATION_2026-10-29.md`, `SRS_PUSH_PAYMENT_2026-10-29.md`, `SRS_UNIFIED_COVERAGE_2026-10-29.md` | Tài liệu quyết định/triển khai/coverage cũ cùng ngày 29/10, không phải bản Phase 2 mới hơn; giữ làm nguồn bối cảnh. |
| `docs/specifications/15.txt` | SRS module Mua hàng cũ; quy tắc Mua thường/Đặt trước. Không phải tài liệu chi tiết BR-MHTT/AC-MHTT/MSG-MHTT được SRS 1.1 viện dẫn. |
| `docs/specifications/16.txt` | Đặc tả tài khoản; có BR-ACC-002 (OTP 120 giây, gửi lại tối đa 3 lần/15 phút). |
| `docs/specifications/09.txt` | Đặc tả UC FR-DT/FR-HT; có liên quan mã ưu đãi. |
| `docs/specifications/07.txt`, `12.txt` | Đặc tả đơn hàng/giao nhận và tìm kiếm sản phẩm; xác nhận địa chỉ Hà Nội trong nghiệp vụ đơn cũ. |
| `docs/specifications/01.txt`, `02.txt`, `03.txt`, `04.txt`, `05.txt`, `06.txt`, `08.txt`, `10.txt`, `11.txt`, `13.txt`, `14.txt` | Tìm thấy trong quét từ khóa tổng quát (BRD/Preorder/Đặc tả UC); tên/mục lục cho thấy phần lớn thuộc các module khác, không phải nguồn BR-MHTT/AC-MHTT. |
| `artifacts/mobile-before.png` | Ảnh chụp giao diện cũ tìm thấy. |
| BRD Luồng mua hàng và Preorder; Đặc tả UC – Module Mua hàng và Thanh toán (BR-MHTT, AC-MHTT, MSG-MHTT) | Không tìm thấy tài liệu gốc độc lập. Các điểm phụ thuộc các mã này được ghi “cần đối chiếu tài liệu gốc”; không tự suy diễn nội dung. |

SRS 1.1 đã đọc đủ và đếm được: **18 FR mới (13 Must), 13 BR-MN, 7 BR-PT, 9 NFR-MN, 12 user story, 5 kịch bản kiểm thử trọng tâm, 6 quyết định D13–D18, 6 câu hỏi mở, 26 góp ý Phụ lục A**. Các số khớp yêu cầu ở mục 0.1. Không cần chuyển đổi định dạng vì bản SRS tìm thấy đã là Markdown.

Nguồn module cũ xác nhận lịch sử quy tắc: `docs/specifications/15.txt` UC-MH-05 còn yêu cầu đăng nhập trước khi thêm; quyết định D15 trong SRS 1.1 đổi thành khách vãng lai thêm trước, đăng nhập lúc đặt. SRS hợp nhất cũ mục BR-DAT-04 chỉ giao Hà Nội, nhưng checkout prototype mới chưa thể hiện guard này. Các nguồn cũ dùng “Mua sẵn/HTX” và có một số hành vi khác; khi mâu thuẫn, SRS Phase 2 1.1 cùng các đề xuất chờ duyệt v1.2 là căn cứ cho audit này.

## Stack và cách chạy

- React 19, TypeScript, Vite 8, Tailwind CSS 4 qua plugin Vite; ứng dụng web SPA. Cấu hình ở `package.json`, `vite.config.ts`, `tsconfig.json`.
- `npm run dev` chạy `scripts/dev.mjs`; `npm run dev:frontend` chạy Vite cổng 3000; `npm run dev:backend` chạy `server/start.mjs`; `npm start` chạy backend. Proxy `/api` mặc định tới `127.0.0.1:4000` (`vite.config.ts`).
- Lệnh có sẵn: `npm run lint` (TypeScript no-emit), `npm run test` (Vitest), `npm run e2e` (Playwright wrapper), `npm run test:backend` (Node test runner), `npm run build`.
- Chưa chạy lệnh kiểm tra trong bước khảo sát. Các lệnh trên là khai báo từ `package.json`, chưa xác minh trạng thái chạy.

## Cấu trúc chính

`src/app` điều phối app; `src/screens` và `src/components` chứa màn và giao diện; `src/domain` chứa quy tắc/kiểu dữ liệu và `src/store/commands` là lớp gọi lệnh; `src/stores`, `src/mock`, `src/lib`, `src/components/product|cart|checkout|admin`, `src/screens/HomePage.tsx`, `src/screens/CatalogPage.tsx` là prototype Phase 2; `server` chứa backend; `public/images` chứa ảnh; `docs` và `docs/specifications` chứa tài liệu.

## Màn hình và định tuyến đang chạy

`src/App.tsx:1-9` render trực tiếp `Phase2App`. `src/app/Phase2App.tsx:167-300` tự xử lý đường dẫn: `/`, `/san-pham`, `/san-pham/:slug`, `/dat-hang`, `/mua-ngay/:variantId`, `/xac-nhan/:id`, `/don-hang/:id`, `/tai-khoan`, `/truy-xuat/:code`, `/admin/phuong-tien`, `/gioi-thieu`, `/cau-chuyen`, `/chinh-sach`. Prototype còn có OTP sheet, giỏ nổi, bảng chọn nhanh, theo dõi đơn, trang danh mục và quản lý phương tiện.

Không thấy route `/prototype` hoặc `/prototype/motion`. Hiện không thấy sử dụng router thư viện; điều hướng dùng `history.pushState` và `popstate` trong `src/app/Phase2App.tsx:61-75`.

## Logic mua hàng và dữ liệu

| Phần | Vị trí và quan sát |
| --- | --- |
| Giỏ prototype | `src/stores/cartStore.ts:48-75, 79-139, 145-250`: localStorage theo device ID, hết hạn 7 ngày, kiểm tồn bằng dữ liệu trong trình duyệt, gộp giỏ và có hoàn tác lần thêm/xóa. |
| Mua ngay prototype | `src/stores/buyNowStore.ts:17-43`: phiên trong bộ nhớ trang; `Phase2App.tsx:111-124` mở OTP hoặc route mua ngay. Chưa thấy khôi phục phiên qua tải lại trang/OTP. |
| OTP prototype | `src/stores/authStore.ts:25-101`: OTP giả lập `123456`; thời hạn 120 giây, tối đa 3 lần gửi lại trong phiên store. |
| Đơn prototype | `src/stores/orderStore.ts:17-120`: giữ dữ liệu trong bộ nhớ, giả lập trạng thái thanh toán và hết hạn 15 phút. |
| Checkout prototype | `src/components/checkout/CheckoutOnePage.tsx:161-207, 233-301`: tính tách đơn/giá phía client; kiểm tồn bằng `checkCanAddToCart` phía client; tạo đơn bằng `setTimeout`, lưu vào store bộ nhớ. Có chặn gửi lặp trong component, nhưng không thấy idempotency server-side trong luồng này. |
| Luồng cũ | `src/domain/cart.ts:50-140`, `src/domain/checkout.ts:161-476`, `src/screens/customer/CheckoutSheet.tsx:43-184`: model giỏ, kiểm lại và tạo đơn miền nghiệp vụ; UI checkout cũ có nhiều bước (`CheckoutSheet.tsx:196` và biến `step`). `src/App.tsx` hiện không render `AppShell`, nơi các màn cũ được lắp. |
| Địa chỉ | `src/screens/customer/AddressFormSheet.tsx:63-102` cho nhập tỉnh và phường/xã dạng tự do; ví dụ còn là Lào Cai. Prototype mới có `src/mock/addresses-hanoi.ts`, nhưng checkout chưa xác thực mã phường theo danh mục máy chủ. |
| Sản phẩm | Prototype dùng `src/mock/products.ts` với `Product` có `variants` và `media` (`src/mock/types.ts`); dữ liệu miền cũ dùng `src/data/seed.ts` và các bảng `DemoState` tại `src/domain/types.ts`. |

## Style, chuyển động, font và media

- Style kết hợp Tailwind classes, CSS thường và biến CSS: `src/index.css`, `src/styles/tokens.css`, `src/storefront.css`, `src/motion.css`, `src/catalog.css`. Có CSS motion và reduced-motion, nhưng chưa có một bảng preset duy nhất theo SRS; nhiều thời lượng/giá trị được gõ trực tiếp (`src/components/ui/Sheet.tsx:105`, `src/motion.css`). Không thấy thư viện chuyển động chuyên dụng trong dependencies.
- Có ba họ font được khai báo/tải: Plus Jakarta Sans, Newsreader, Fraunces (`src/main.tsx:3-34`, `package.json:27-29`). Nội dung có dấu Việt trong code và fontsource có gói font; chưa đo/render kiểm tra ký tự theo chuỗi bắt buộc của SRS.
- `public` có 26 JPG, 1 SVG, 2 JSON và webmanifest. Không thấy tệp `.glb`, `.gltf`, `.usdz`, `.mp4` hoặc `.webm`; Viewer3D hiện là component demo, chưa có asset 3D thật (`src/components/product/Viewer3D.tsx`).

## Rủi ro kỹ thuật ban đầu

1. Cờ `phase2_ui` không xuất hiện trong code; app hiện chạy prototype Phase 2 trực tiếp từ `App.tsx`, chưa đáp ứng mặc định tắt ở production.
2. Prototype checkout dùng giá/tồn client và dữ liệu đơn cục bộ, không đủ chứng minh yêu cầu NFR-MN-08 hoặc luồng server-authoritative.
3. Giỏ vãng lai và phiên Mua ngay có trạng thái/lưu trữ chưa đồng nhất; phiên Mua ngay không thấy phục hồi khi tải lại trang.
4. Ba hệ dữ liệu/logic song song (domain/store cũ, `src/stores` mock, backend) tạo nguy cơ sửa không đúng đường chạy.
5. UI, nội dung và ảnh mẫu còn gắn với Lào Cai; liệt kê đầy đủ trong `docs/audit/02-region-lock.md`.
6. Không có bằng chứng đo tương phản mọi theme, tốc độ 4G, khung hình, bộ nhớ 3D hay chạy thử bàn phím trên các thiết bị SRS.

