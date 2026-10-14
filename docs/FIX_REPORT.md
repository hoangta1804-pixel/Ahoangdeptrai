# Báo cáo sửa prototype "Đặc Sản Số Lào Cai"

Tài liệu này cập nhật sau mỗi giai đoạn của `PROMPT_SUA_APP.md`. Mã trong ngoặc (`BR-…`, `FR-…`, `PAR-…`, `OI-…`) là mã trong SRS hợp nhất.

| Giai đoạn | Nội dung | Tình trạng |
|---|---|---|
| 1 | Hợp nhất mã nguồn, sửa cấu hình build | **Xong** |
| 2 | Sửa lỗi L1–L18 | Chưa làm |
| 3 | Dữ liệu dùng chung và đăng nhập | Chưa làm |
| 4 | Chức năng mức Must theo vai trò | Chưa làm |
| 5 | Nội dung và dữ liệu mẫu | Chưa làm |
| 6 | Giao diện | Chưa làm |

## Chạy local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # ra thư mục dist/ (Vercel dùng thư mục này)
npm run lint     # kiểm tra kiểu TypeScript
npm test         # unit test vitest cho src/domain
```

### Kết quả lần chạy cuối (Giai đoạn 1)

| Lệnh | Kết quả |
|---|---|
| `npm run lint` | Không lỗi |
| `npm test` | 6 file, 26 test, tất cả đạt |
| `npm run build` | Thành công. JS 328 kB (gzip 96 kB), CSS 66 kB (gzip 19 kB), font tự host |
| Bundle có Babel standalone? | Không (tìm chuỗi "babel" trong `dist/`: 0 kết quả) |
| Bundle gọi CDN (unpkg, cdnjs, Tailwind CDN, Google Fonts)? | Không |
| Chạy với mọi request ngoài localhost bị chặn (Playwright) | Trang chạy đủ, không lỗi JS. Chỉ ảnh Unsplash của dữ liệu mẫu bị chặn và được thay bằng khối màu kèm tên sản phẩm |

---

## Giai đoạn 1 – Hợp nhất mã nguồn và sửa cấu hình build

### Kết luận về bản gốc

`src/App.tsx` build và lint được ngay, nên **không phải viết lại** (không chạm nguyên tắc 8). Bản này được lấy làm gốc và tách thành module. File `src/App.tsx` giờ chỉ còn phần lắp các provider.

### Đã làm

1. **Entry chuẩn Vite.** `index.html` chỉ còn `<div id="root">` và `<script type="module" src="/src/main.tsx">`.
   - Đã bỏ React, Babel, Tailwind, Font Awesome từ CDN.
   - Icon dùng `lucide-react`. Font Plus Jakarta Sans tự host qua `@fontsource/plus-jakarta-sans`.
   - Tailwind v4 build tĩnh qua `@tailwindcss/vite`.
2. **Chuyển 3 màn từ bản `index.html` cũ** theo quy tắc mới, không mang theo lỗi cũ:
   - **Tab Vụ mùa** (`screens/customer/SeasonTab.tsx`). Thanh "Đã giữ x/y suất" tính từ đơn trong store (`domain/stock.ts › reservedSlots`). Trường `preorderSold` gõ cứng đã bị xoá khỏi dữ liệu. Tiền cọc hiển thị tính bằng `computeDeposit` theo PAR-18 và PAR-04. Đã bỏ "lịch trình từ vườn tới bàn ăn" bịa.
   - **Trang thông tin nguồn gốc** (`screens/customer/TraceLotSheet.tsx`). Hiện đúng sản phẩm được chọn, chỉ dùng dữ liệu có trong hồ sơ sản phẩm. Đã bỏ nhật ký QC 5 bước, tên nghệ nhân, biển số xe, cảm biến nhiệt, "GS1/EPCIS", "OCOP 5 Sao Quốc Gia" và nút "Xác nhận đạt chuẩn xuất xưởng".
   - **Giỏ hàng dạng bottom sheet** (`screens/customer/CartSheet.tsx`). Chia hai nhóm Mua sẵn / Đặt trước (MHTT-01). Số lượng hàng đặt trước không vượt số suất còn lại. Đã bỏ chọn nhiều mã và mã freeship; mã ưu đãi sẽ nằm trong màn đặt hàng (Giai đoạn 2, L7).
3. **Dọn dẹp:**
   - Bản `index.html` Babel cũ lưu ở `legacy/index-babel.html`.
   - `scripts/build_app.js`, `scripts/make_fullscreen.js`, `scripts/test_marker.txt`, `public/standalone.html` chuyển vào `legacy/` (xem `legacy/README.md`).
   - `src/DacSanApp.jsx` (bản chuyển tạm từ `index.html` cũ ở lần sửa trước) đã xoá, vì nguồn gốc đã lưu ở `legacy/`.
   - Gỡ dependency không dùng: `@google/genai`, `express`, `dotenv`, `@types/express`, `motion`, `tsx`, `autoprefixer`.
   - `metadata.json` bỏ `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. `.env.example` bỏ `GEMINI_API_KEY`.
4. **Tách module:**

   | Thư mục | Nội dung |
   |---|---|
   | `src/domain/` | `types`, `params` (mục 4), `pricing` (BR-TIEN, BR-DAT-05), `voucher` (BR-KM), `stock` (mục 5.6), `orderStateMachine` (mục 5.5), `refund` (mục 5.7), `text` (tìm không dấu), `clock` (`now()` tua được), `ids` (mã đơn). Toàn bộ là hàm thuần, không đụng giao diện. |
   | `src/data/seed.ts` | Dữ liệu mẫu (chưa đổi nội dung; Giai đoạn 5 thay) |
   | `src/store/` | Store lưu `localStorage`, đồng bộ giữa các tab cùng trình duyệt, hàm `resetDemoData()` |
   | `src/screens/customer`, `coop`, `admin`, `regulator` | Màn theo vai trò |
   | `src/screens/_pending-OI-01/` | Code vai trò Shipper, tạm ẩn theo OI-01 |
   | `src/components/` | `BottomSheet` dùng chung, `Toast`, `ProductImage`, `PreorderProgress`, màn đăng nhập |
   | `src/app/` | Khung app, trạng thái giao diện, nơi hiển thị sheet |

5. **Test và build:**
   - Đã cài `vitest`, thêm lệnh `npm test`.
   - `npm run build` ra `dist/`, Vercel dùng được.
   - **Không thêm `vercel.json`**, vì app một trang, không có đường dẫn phía client nên không cần rewrite SPA.
6. **Nút "Khôi phục dữ liệu mẫu"** ở góc phải thanh trên cùng. Trên điện thoại chỉ hiện icon, có `aria-label`.

### Thay đổi hành vi so với `src/App.tsx` cũ (cần nhóm biết)

- **Bỏ khung iPhone giả 393×852px.** App giờ chiếm toàn màn hình.
  - Khách và HTX rộng tối đa 640px.
  - Admin và QLNN rộng tối đa 1152px.
  - Không tràn ngang ở 320, 390, 768, 1440px.
- **Thanh chuyển vai trò tạm giữ lại** (Khách hàng, HTX, QLNN, Admin) để demo cho tới Giai đoạn 3, khi chuyển sang đăng xuất / đăng nhập.
- **Vai trò Shipper đã ẩn**, code giữ ở `src/screens/_pending-OI-01/`. Màn Điều phối Ops chỉ có ở `legacy/index-babel.html`, chưa chuyển sang TypeScript.
- **Phí giao thường đổi 25.000đ → 28.000đ** theo FEE-01. Phí hoả tốc đọc bậc FEE-02 từ tham số. Mặc định chọn giao thường thay vì hoả tốc.
- **Banner trang chủ bỏ ảnh stock Unsplash**, thay bằng nền màu.
- **Tab Admin › Tham số** đọc từ `domain/params.ts`, có cột "Tình trạng". Việc sửa giá trị kèm lý do và lịch sử làm ở Giai đoạn 4 (hàm `updateParam` đã có và đã test).
- **Một số lỗi được sửa sớm** do tách module:
  - L8: tìm kiếm không dấu;
  - L9 (một phần): có màn "Không có sản phẩm phù hợp" kèm nút xoá lọc;
  - L10 (một phần): "Xem nguồn gốc" hiện đúng sản phẩm;
  - L18: thông báo nổi xuống dòng được, đặt ở đáy màn hình.
  - Giai đoạn 2 sẽ kiểm tra lại các lỗi này.

### Còn tồn tại sau Giai đoạn 1 (sẽ sửa ở giai đoạn sau)

- **`CheckoutSheet` vẫn dùng logic đặt hàng cũ** để giữ nguyên hành vi. Chỗ tính cọc 30% trên toàn giỏ và gán mọi đơn là đặt trước còn nằm trong màn hình, chưa qua `domain/pricing.ts`. Giai đoạn 2 viết lại theo mục 5.1–5.4 (L1, L3, L4, L5, L7, L15).
- **Một số màn còn hành vi và nội dung cũ, chờ Giai đoạn 2–5:** form địa chỉ (L14), form khiếu nại (L11), đăng nhập, ví HTX (L13), màn QLNN (L17), duyệt hồ sơ Admin.
- **Đơn hàng trong UI vẫn dùng kiểu dữ liệu cũ** (`Order` với 7 trạng thái cũ). `store/selectors.ts` chuyển tạm sang 11 trạng thái mới khi cần tính suất. Giai đoạn 2–3 thay hẳn bằng mô hình mới trong `domain/types.ts`.

---

## Kiểm thử bắt buộc (mục 11.1)

| Ca | Tình trạng | Ghi chú |
|---|---|---|
| T1 | Đạt | `pricing.test.ts` |
| T2 | Đạt | `voucher.test.ts` |
| T3 | Đạt | `pricing.test.ts`, `voucher.test.ts` |
| T4 | Đạt | |
| T5 | Đạt | |
| T6 | Đạt | |
| T7 | Chưa làm | Cần hàm tách đơn và giao dịch gộp (Giai đoạn 2) |
| T8 | Chưa làm | Cần giao dịch và hết hạn thanh toán (Giai đoạn 2). Phần tồn khả dụng đã có test riêng |
| T9 | Đạt | `stock.test.ts` |
| T10 | Đạt | `pricing.test.ts` |
| T11 | Chưa làm | Giai đoạn 2 |
| T12 | Đạt | `orderStateMachine.test.ts` |
| T13 | Một phần | Phần trạng thái đã đạt. Phần thanh toán sang Chờ hoàn tiền làm ở Giai đoạn 2 |
| T14 | Đạt | `refund.test.ts` |
| T15 | Chưa làm | Giai đoạn 2 (`applyGatewayResult`) |
| T16 | Chưa làm | Giai đoạn 2 |
| T17 | Đạt | `refund.test.ts` |
| T18 | Chưa làm | Giai đoạn 2 |
| T19 | Chưa làm | Giai đoạn 4 |
| T20 | Đạt | `text.test.ts` |
| T21 | Chưa làm | Giai đoạn 3 |
| T22 | Chưa làm | Giai đoạn 3 |

## Lỗi L1–L18

| Mã | Tình trạng | Ghi chú |
|---|---|---|
| L1 | Chưa làm | Hàm tính đúng đã có (`priceOrder`, `totalCheckout`); màn đặt hàng chưa dùng |
| L2 | Chưa làm | Hàm `evaluateVoucher`, `selectVoucher` đã có |
| L3 | Chưa làm | |
| L4 | Chưa làm | Đơn mới đã lưu vào store và còn sau khi tải lại; chưa đúng trạng thái và chưa hiện ở HTX, Admin |
| L5 | Chưa làm | |
| L6 | Một phần | Giỏ và trang chi tiết chặn số lượng theo suất còn lại; chưa có tồn khả dụng cho hàng mua sẵn |
| L7 | Chưa làm | |
| L8 | Đã làm | `domain/text.ts`, T20 |
| L9 | Một phần | Có màn rỗng kèm nút xoá lọc; bộ lọc vùng sinh từ dữ liệu làm ở Giai đoạn 2 |
| L10 | Một phần | "Xem nguồn gốc" đúng sản phẩm; màn theo dõi đơn, đóng gói, khiếu nại làm ở Giai đoạn 2 |
| L11 | Chưa làm | |
| L12 | Chưa làm | |
| L13 | Chưa làm | |
| L14 | Chưa làm | |
| L15 | Chưa làm | |
| L16 | Chưa làm | |
| L17 | Chưa làm | |
| L18 | Đã làm | `components/Toast.tsx` |

## Chức năng Giai đoạn 4

Chưa bắt đầu. Bảng FR theo vai trò sẽ được điền khi làm Giai đoạn 4.

## Giả định đã dùng

1. **PAR-18 = 30%, COM-01 = 5%:** theo bảng tham số mục 4, đánh dấu "Giả định" trong màn Tham số.
2. **PAR-26 và RET-01 lưu theo giờ:** hàng khô 72 giờ (= 3 ngày) và 240 giờ (= 10 ngày), để mọi hạn dùng chung một đơn vị.
3. **Mốc hoàn cọc tính theo giờ địa phương của trình duyệt.** Hết 23:59:59 ngày D − PAR-08 vẫn được hoàn.
4. **Bậc hoả tốc FEE-02 tính cả mốc trên:** đúng 5 km thuộc bậc 0–5 km, đúng 15 km vẫn có hoả tốc.
5. **Khách được gửi yêu cầu huỷ khi đơn đặt trước ở Chờ thu hoạch** (`customerCancelMode`). Lý do: mục 5.7 cho phép khách huỷ đơn đặt trước theo mốc D − PAR-08, nhưng bảng chuyển trạng thái chưa ghi rõ ai bấm huỷ ở bước này.
6. **Huỷ đơn luôn phải ghi lý do,** kể cả khi hệ thống tự huỷ. Hệ thống ghi lý do tự động (ví dụ "Hết hạn thanh toán").
7. **Chia giảm giá làm tròn xuống từng đơn,** phần lẻ dồn vào đơn có tiền hàng hợp lệ lớn nhất.
8. **Số tiền hoàn theo tỷ lệ** giá trị phần được duyệt trên giá trị đơn, làm tròn đến đồng, không vượt số đã thực trả.
9. **Mã đơn** dạng `DH-yyyymmdd-xxxxxx`. Phần ngẫu nhiên gồm 6 ký tự chữ hoa và số, bỏ ký tự dễ nhầm (0/O, 1/I).
10. **Đề xuất của SRS dùng như quy tắc:** BR-TON-04 (giữ hàng ngay khi tạo đơn) và BR-TT-06 (lần trả thứ hai tạo yêu cầu hoàn).
11. **OI-08:** tham số `refundShippingWhenNotCustomerFault` mặc định `false`.

## Vấn đề chờ nhóm chốt

| Mã | Nội dung | Cách app đang xử lý |
|---|---|---|
| OI-01 | Ai cập nhật trạng thái giao hàng | Ẩn Shipper và Điều phối Ops. Giai đoạn 2 thêm màn "Mô phỏng ĐVVC" trong Admin – Vận hành |
| OI-02 | (theo SRS) | Chưa đụng tới ở Giai đoạn 1 |
| OI-04 | (theo SRS) | Chưa đụng tới ở Giai đoạn 1 |
| OI-05 | (theo SRS) | Chưa đụng tới ở Giai đoạn 1 |
| OI-08 | Có hoàn phí giao khi lỗi không do khách | Tham số, mặc định không hoàn |
| OI-11 | (theo SRS) | Chưa đụng tới ở Giai đoạn 1 |
| OI-13 | Chính sách đổi hàng | Không làm chức năng đổi hàng |
| OI-15 | (theo SRS) | Chưa đụng tới ở Giai đoạn 1 |
| OI-16 | (theo SRS) | Chưa đụng tới ở Giai đoạn 1 |

Tài liệu yêu cầu không mô tả nội dung của OI-02, OI-04, OI-05, OI-11, OI-15, OI-16. Nhóm cần cung cấp mô tả để ghi đúng vào báo cáo.

## Tài khoản demo và khôi phục dữ liệu

- **Tài khoản demo:** chưa có. Giai đoạn 3 thêm đăng nhập bằng SĐT + OTP mô phỏng `123456` và danh sách tài khoản.
- **Khôi phục dữ liệu mẫu:** bấm nút "Khôi phục dữ liệu mẫu" (icon mũi tên vòng) ở góc phải thanh trên cùng. Thao tác này xoá dữ liệu đã lưu trong `localStorage` (khoá `dac-san-so-lao-cai:data`) và nạp lại dữ liệu mẫu.
