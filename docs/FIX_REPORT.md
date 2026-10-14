# Báo cáo sửa prototype "Đặc Sản Số Lào Cai"

Tài liệu này cập nhật sau mỗi giai đoạn của `PROMPT_SUA_APP.md`. Mã trong ngoặc (`BR-…`, `FR-…`, `PAR-…`, `OI-…`) là mã trong SRS hợp nhất.

| Giai đoạn | Nội dung | Tình trạng |
|---|---|---|
| 1 | Hợp nhất mã nguồn, sửa cấu hình build | **Xong** |
| 2 | Sửa lỗi L1–L18 | **Xong** |
| 3 | Dữ liệu dùng chung và đăng nhập | **Xong** |
| 4 | Chức năng mức Must theo vai trò | **Xong** |
| 5 | Nội dung và dữ liệu mẫu | **Xong** |
| 6 | Giao diện | **Xong** |

## Chạy local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # ra thư mục dist/ (Vercel dùng thư mục này)
npm run lint     # kiểm tra kiểu TypeScript
npm test         # unit test vitest: src/domain, dữ liệu mẫu, quy ước giao diện
```

### Kết quả lần chạy cuối (Giai đoạn 6)

| Lệnh | Kết quả |
|---|---|
| `npm run lint` | Không lỗi |
| `npm test` | 15 file, 124 test, tất cả đạt |
| `npm run build` | Thành công, không cảnh báo. Phần chung 431 kB (gzip 127 kB); màn HTX, Admin, QLNN tải riêng theo vai trò |
| Luồng 1 và Luồng 2 (mục 11.2) bằng Playwright, chặn mọi request ngoài localhost | Đạt trọn vẹn. Không có request ra ngoài, không lỗi JS |
| Kiểm tra giao diện tự động trên mọi màn và trong Luồng 1 (axe-core 4.10 + đo vùng bấm và cỡ chữ) | 0 lỗi tương phản AA, 0 nút thiếu tên, 0 vùng bấm dưới 44×44, 0 chữ dưới 12px |

---

## Sau Giai đoạn 6 – Số điện thoại nhập 9 số

Theo yêu cầu của chủ repo, mọi ô nhập SĐT nhận cả 3 dạng:

| Dạng nhập | Ví dụ |
|---|---|
| 9 chữ số, bỏ số 0 đầu | `912345678` |
| 10 chữ số, có số 0 đầu | `0912345678` |
| Có mã nước | `+84 912 345 678` |

- **Áp dụng ở:** đăng nhập, đăng ký, Admin cấp tài khoản, sổ địa chỉ, người nhận quà, sửa người nhận quà.
- **Lưu thống nhất:** app luôn lưu, so khớp và hiển thị dạng 10 số bắt đầu bằng 0. Vì vậy cùng một số nhập theo dạng nào cũng ra cùng một tài khoản, và không đăng ký trùng được bằng dạng khác.
- **Gợi ý và báo lỗi:** ô nhập có dòng gợi ý; nhập sai thì báo "Nhập 9 chữ số (vd. 912 345 678), có thể thêm số 0 hoặc +84 ở đầu."
- **Mã nguồn:** `src/domain/phone.ts`; test `src/domain/__tests__/phone.test.ts` (19 test).
- **Kiểm tra trên trình duyệt:**
  - đăng nhập bằng `900000001` và `+84 900 000 002` ra đúng tài khoản;
  - nhập 8 số thì báo lỗi;
  - lưu địa chỉ với `912 345 678` thì số được lưu là `0912345678`;
  - kiểm tra giao diện tự động không có lỗi.

---

## Giai đoạn 6 – Giao diện

### Bảng màu (mục 10.1)

- **Token trong theme Tailwind** (`@theme` trong `src/index.css`). Nhóm đổi màu ở đây thì mọi màn đổi theo.

  | Token | Giá trị |
  |---|---|
  | `forest-800` (xanh rừng) | `#1F4D3A` |
  | `champagne-400` (vàng champagne) | `#C9A96E` |
  | `ivory` (trắng ngà) | `#FAF7F0` |
  | `ink` (chữ chính) | `#1C1B18` |
  | `muted` (chữ phụ) | `#6B655F` |

  - Hai màu xanh rừng và champagne có đủ dải 50–950, tính sẵn để chữ và nền đạt AA.
  - `stone-500` của Tailwind chỉ đạt 4,4:1 trên nền trắng ngà, nên chữ phụ dùng token `muted` đạt AA.
- **Áp dụng:**
  - nút chính, thanh trên cùng, thẻ đầu màn HTX / Admin / QLNN dùng xanh rừng;
  - nhãn đặt trước, cảnh báo, dải demo dùng champagne;
  - nền trang trắng ngà, chữ chính `ink`.
- **Đã bỏ:**
  - toàn bộ lớp màu `emerald` / `amber` / `orange` cũ. Nhãn trạng thái "Trả hàng – hoàn tiền" và "Đang chuyển hoàn" đổi từ cam sang hồng đất;
  - chữ "Gian Hàng Chính Hãng" ở tiêu đề trang, nay là "Đặc Sản Số Lào Cai – Bản demo".
- **Không có:** màu `#EE4D2D`, logo, icon hay bố cục đặc trưng của Shopee.

### Cỡ chữ (mục 10.2)

- Không còn chữ 10–11px: nhãn "Mô phỏng" và các chữ 10px trong file tạm ẩn `ShipperScreen.tsx` đổi lên 12px.
- Các câu giải thích, lưu ý (điều kiện mã ưu đãi, thời hạn thanh toán, lý do không có COD hay hoả tốc, quy định đánh giá, khiếu nại, tài khoản hoàn…) đổi từ 12px lên 14px. 12px chỉ còn dùng cho nhãn phụ.
- Ô nhập dùng chữ 16px trên điện thoại (14px từ màn `md`). Nhờ đó iOS không tự phóng to khi bấm vào ô, nay đã cho phép phóng to.

### Cho phép thao tác (mục 10.3)

- Thẻ viewport bỏ `maximum-scale=1.0, user-scalable=no`; người dùng phóng to được.
- Không còn `select-none` hay `user-select: none`, nên copy được mã đơn.

### Trợ năng (mục 10.4)

- **Nút chỉ có icon** đều có `aria-label`. Bảng thêm tên ẩn "Thao tác" cho cột nút.
- **Bottom sheet** có `aria-labelledby` trỏ vào tiêu đề.
- **Vùng bấm tối thiểu 44×44**, đã nâng các chỗ còn thiếu:
  - chip lọc, nút "+" thêm vào giỏ, nút tăng giảm số lượng;
  - nút sửa / xoá địa chỉ, nút "Xem nguồn gốc", nút xoá ảnh;
  - mọi ô nhập và ô chọn.
- **Kiểm tra bằng axe-core 4.10** (các quy tắc color-contrast, button-name, link-name, label, select-name, image-alt, aria-dialog-name, nested-interactive) và một script đo kích thước vùng bấm, cỡ chữ.
  - Chạy trên mọi màn của 5 nhóm Admin, Khách, HTX, QLNN, Công cụ demo; cả ở màn 390px và 1280px.
  - Chạy cả trong Luồng 1 (sheet HTX có nút thao tác, cổng thanh toán, ĐVVC, ticket, hoàn tiền, QLNN).
  - Kết quả: không còn lỗi.

### Bố cục (mục 10.5)

- **Bottom sheet:** mọi sheet dùng chung `BottomSheet`, rộng tối đa 640px. Có test kiểm tra không có hộp thoại nào khác.
- **Trạng thái rỗng:** các danh sách còn thiếu đã có: tài khoản (Vận hành, Quản trị gốc), mã ưu đãi, hồ sơ HTX, phường/xã, hộp quà, yêu cầu đã duyệt, bảng đơn của QLNN.
- **Trạng thái lỗi:**
  - **Khi có lỗi lúc hiển thị:** mỗi tab của Khách, HTX, Admin, mỗi sheet, và cả màn theo vai trò đều bọc trong `ListBoundary`. Có lỗi (dữ liệu trên trình duyệt hỏng, không tải được mã của màn) thì chỉ phần đó hiện khung lỗi, có nút "Thử lại", "Tải lại trang" và hướng dẫn khôi phục dữ liệu mẫu. Thanh điều hướng vẫn dùng được. Khi dữ liệu đổi (vd. vừa khôi phục), danh sách tự thử lại.
  - **Khi không có quyền xem:** danh sách đọc qua kiểm tra quyền (đơn của khách, của HTX, của Admin; ticket của HTX; nhật ký; bảng QLNN) hiện lý do bị từ chối thay vì âm thầm hiện rỗng.
  - **Kiểm thử:** làm hỏng dữ liệu đơn trong `localStorage`, rồi mở tab Đơn hàng: tab báo lỗi, thanh dưới vẫn dùng được, khôi phục dữ liệu mẫu thì danh sách hiện lại.
- **Độ rộng:** Khách và HTX giữ bố cục điện thoại, rộng tối đa 640px. Màn 320px không cuộn ngang.
- **Admin và QLNN dạng bảng** (`AdminTable`), cuộn ngang trong khung nếu màn hẹp. Đã chuyển từ dạng thẻ sang bảng:
  - Mô phỏng ĐVVC;
  - Hồ sơ HTX & quyền bán;
  - Kiểm duyệt đánh giá;
  - Duyệt sản phẩm & giá (bảng chờ duyệt và bảng đã xử lý);
  - Danh mục dùng chung (phường/xã, hộp quà, bậc phụ phí);
  - Ticket khiếu nại: bảng ticket, chọn một dòng thì phần chi tiết và xử lý hiện ngay dưới bảng.

### Kiểm thử Giai đoạn 6

- **Unit test mới `src/components/__tests__/ui.test.ts`** (5 test), đọc mã nguồn để kiểm tra:
  - token màu có trong theme;
  - không còn `#EE4D2D`, "Chính hãng", lớp màu cũ;
  - không có chữ dưới 12px;
  - viewport cho phóng to, không `select-none`;
  - chỉ `BottomSheet` có `role="dialog"`.
- **Trình duyệt:**
  - kiểm tra giao diện tự động như trên;
  - Luồng 1 và Luồng 2 đạt như Giai đoạn 5;
  - dải demo hiện ở mọi vai trò;
  - thử trạng thái lỗi.

### Còn tồn tại sau Giai đoạn 6

- **Màu nhãn trạng thái đơn** (xanh lam, tím, xanh lá mạ…) vẫn dùng màu Tailwind để phân biệt nhiều trạng thái. Chúng không thuộc bảng nhận diện; nhóm có thể chốt bảng màu trạng thái riêng.
- **Chưa kiểm tra bằng trình đọc màn hình thật** (VoiceOver, TalkBack). Mới kiểm tra tự động bằng axe-core.
- **Chưa có giao diện tối** (dark mode); yêu cầu không nêu.

---

## Giai đoạn 5 – Nội dung và dữ liệu mẫu

### Gỡ nội dung (mục 9.1)

Quét toàn bộ `src/` (kể cả file tạm ẩn `_pending-OI-01`). Phần lớn nội dung cấm đã không còn từ Giai đoạn 1–2, khi bản `index.html` cũ được chuyển vào `legacy/` (không build, không deploy).

| Nội dung | Tình trạng |
|---|---|
| "CQQLNN bảo chứng / tài trợ", "Đã xác thực chữ ký số CQQLNN" | **Đã làm** – không còn trong `src/` |
| "GS1/EPCIS Blockchain", "OCOP 5 Sao Quốc Gia", "Quỹ xúc tiến thương mại tỉnh hỗ trợ" | **Đã làm** – không còn. Nhãn `certLabel` ("OCOP 5 Sao (HTX khai…)", "VietGAP…") bị xoá khỏi kiểu dữ liệu, dữ liệu mẫu và trang nguồn gốc |
| Nút "Xác nhận đạt chuẩn xuất xưởng" phía khách | **Đã làm** – không còn |
| Đồng hồ "Giá mùa vụ ưu đãi" | **Đã làm** – không còn |
| "Đã bán 2.8k", điểm đánh giá bịa | **Đã làm** – điểm đánh giá chỉ tính từ đánh giá thật trong dữ liệu; chưa có thì ghi "Chưa có đánh giá" |
| Tên nông hộ, GPS, độ cao, máy in Bluetooth, biển số xe, tên nhà xe | **Đã làm** – bỏ tên shipper "Trần Văn Mạnh" còn sót trong `ShipperScreen.tsx` (file tạm ẩn chờ OI-01) |
| Cảnh báo thời tiết đèo Khau Phạ, nhiệt độ cảm biến | **Đã làm** – không còn |
| "Hoả tốc 2H", "giao kịp bữa tối" | **Đã làm** – không còn. Thời gian và phí giao hiện theo tham số (PAR-08, PAR-21, FEE-01, FEE-02) và loại đơn |
| Ảnh Unsplash | **Đã làm** – bỏ hết, thay bằng ảnh giữ chỗ SVG tự sinh |

`src/data/__tests__/seed.test.ts` quét mọi file `.ts`, `.tsx`, `.css`, `.md` trong `src/` và báo lỗi nếu các cụm trên quay lại.

### Dải "Bản demo" (mục 9.2)

- Câu "Bản demo – dữ liệu mẫu. Thanh toán, giao hàng và OTP là mô phỏng." nằm ở dòng đầu của header cố định (`src/components/DemoBand.tsx`). Header hiện ở mọi màn: đăng nhập, khách, HTX, Admin, QLNN.
- Khi mở bottom sheet, dải được lặp lại ở mép trên lớp phủ, nên không bị che. Sheet chừa chỗ cho dải.
- Header cao lên (dải xuống 2 dòng trên điện thoại hẹp). App đo chiều cao header để thanh "Giao tới / Giỏ hàng" của khách dính ngay dưới header. Trước đây thanh này bị header che khi cuộn.

### Danh mục mẫu (mục 9.3)

9 sản phẩm theo bảng của nhóm. Trang chi tiết có khung **"Dữ liệu mẫu – chờ HTX xác nhận"**, ghi khoảng giá nhóm khảo sát hoặc "giá mẫu". Không sản phẩm nào có mã chứng nhận.

| Sản phẩm | Loại đơn | Nhóm hàng | Vùng | HTX mẫu | Giá mẫu | Quy đổi | Khoảng nhóm khảo sát |
|---|---|---|---|---|---|---|---|
| Chè Shan tuyết (gói 100 g) | Mua sẵn | Hàng khô | Suối Giàng, Bản Liền | HTX mẫu Suối Giàng | 80.000đ | 800.000đ/kg | 400.000–1.500.000đ/kg |
| Thảo quả khô (gói 200 g) | Mua sẵn | Hàng khô | Sa Pa, Bát Xát | HTX mẫu Sa Pa | 70.000đ | 350.000đ/kg | 250.000–450.000đ/kg |
| Mứt / ô mai mận tam hoa (hộp 300 g) | Mua sẵn | Chế biến | Bắc Hà | HTX mẫu Bắc Hà | 135.000đ | 450.000đ/kg | 350.000–550.000đ/kg |
| Mật ong Thanh Xuân (chai 500 ml) | Mua sẵn | Chế biến | Bảo Hà | HTX mẫu Bảo Hà | 175.000đ | 350.000đ/lít | 250.000–450.000đ/lít |
| Gạo Séng Cù (túi 2 kg) | Mua sẵn | Hàng khô | Mường Khương, Bát Xát | HTX mẫu Mường Khương | 120.000đ | 60.000đ/kg | 45.000–70.000đ/kg |
| Phở hồng Bắc Hà (gói 500 g) | Mua sẵn | Chế biến | Bắc Hà | HTX mẫu Bắc Hà | 65.000đ | 130.000đ/kg | khoảng 130.000đ/kg |
| Mận tam hoa tươi (thùng 3 kg) | Đặt trước | Nông sản tươi | Bắc Hà | HTX mẫu Bắc Hà | 210.000đ | 70.000đ/kg | 50.000–90.000đ/kg |
| Cốm Tú Lệ (gói 500 g, quy cách mẫu) | Đặt trước | Chế biến | Tú Lệ | HTX mẫu Tú Lệ | 110.000đ – **giá mẫu** | – | chưa có giá |
| Bưởi Đại Minh (thùng 5 kg, quy cách mẫu) | Đặt trước | Nông sản tươi | Vùng hồ Thác Bà | HTX mẫu Thác Bà | 200.000đ – **giá mẫu** | – | chưa có giá |

Ghi chú bắt buộc trong bảng của nhóm:

- **Chè Shan tuyết:** tên sản phẩm không kèm tên chỉ dẫn địa lý, không có logo OCOP.
- **Thảo quả:** không có chữ "thảo quả rừng".
- **Mật ong:** không có chữ "mật bản địa".
- **Gạo:** không có chữ "Séng cù xanh".
- **Mận tam hoa tươi:**
  - mô tả ghi "đóng thùng 3 kg chống dập" và "mùa bán tháng 5–7";
  - khoảng ngày giao mẫu 01/05/2027 – 30/06/2027, ghi "(mẫu, chờ HTX xác nhận)".
- **Cốm Tú Lệ:**
  - mô tả ghi "do người Thái ở Tú Lệ làm";
  - giá ghi "giá mẫu";
  - khoảng ngày giao lấy từ cấu hình: từ hôm nay + PAR-08, dài 4 tuần. Ghi "(mẫu, chờ HTX xác nhận)".
- **Bưởi Đại Minh:** giá ghi "giá mẫu". Trang chi tiết và trang nguồn gốc ghi "OCOP 4 sao năm 2025 (theo hồ sơ nhóm, chờ xác minh)". Đây là sản phẩm duy nhất có nhắc OCOP.
- **Không đưa vào:** mật ong hoa bạc hà, đào Sa Pa, cá hồi, cá tầm, thịt gác bếp, rượu. Các sản phẩm cá hồi, đào Sa Pa của dữ liệu cũ đã bị xoá.

Dữ liệu đi kèm cũng đổi theo:

- **HTX:** 7 HTX mẫu, mỗi vùng một HTX; tài khoản nhận chi trả che dạng `**** 0101` … `**** 0107`.
- **Tài khoản HTX:** cũ có 4, nay có 7 (xem bảng tài khoản demo).
- **Đơn mẫu:**
  - Khách 2 mua 2 túi gạo, trả COD, đơn đã giao;
  - Khách 1 mua 1 hộp mứt mận, thanh toán mô phỏng thành công, đơn chờ HTX Bắc Hà xác nhận.
- **Mã ưu đãi:** giữ nguyên 4 mã. CHEBIEN10 áp cho nhóm Chế biến (mứt mận, mật ong, phở hồng, cốm).
- **Bộ lọc vùng:** sản phẩm ghi nhiều địa danh (vd. "Sa Pa, Bát Xát") hiện ở từng địa danh. Chọn "Bát Xát" thấy cả thảo quả và gạo.
- **Phiên bản dữ liệu `localStorage`:** tăng lên 4. Trình duyệt còn dữ liệu cũ sẽ tự nạp lại danh mục mới.

### Ảnh giữ chỗ (mục 9.4)

`src/components/ProductImage.tsx` tự vẽ ảnh SVG. Ảnh có dải núi làm nền và mang màu theo nhóm hàng:

| Nhóm hàng | Màu |
|---|---|
| Hàng khô | Nâu |
| Chế biến | Đỏ mận |
| Nông sản tươi | Xanh rừng |

Nội dung ảnh theo kích thước:

| Kích thước | Nội dung |
|---|---|
| Thẻ sản phẩm | Tên sản phẩm |
| Ảnh lớn ở trang chi tiết | Tên sản phẩm và dòng "Ảnh giữ chỗ – chờ HTX cung cấp ảnh" |
| Ảnh nhỏ (giỏ hàng, vụ mùa, danh sách HTX) | Hình lá / hũ / quả theo nhóm hàng, vì chữ ở cỡ đó quá nhỏ để đọc. Tên sản phẩm luôn hiện ngay bên cạnh và có trong `aria-label` |

Ảnh do HTX tự tải lên (nếu có) vẫn được ưu tiên hiện.

### Số điện thoại và tài khoản (mục 9.5)

- **Số điện thoại:** mọi SĐT dạng `0900 000 xxx`. Không có hotline 1900.
- **Tài khoản:**
  - tài khoản nhận hoàn của khách là số mẫu `000000000001` và chỉ hiện dạng che;
  - tài khoản HTX hiện dạng `**** 01xx`.
- **Test:** kiểm tra mọi SĐT trong dữ liệu mẫu khớp `0900000xxx`.

### Kiểm thử Giai đoạn 5

- **Unit test mới `src/data/__tests__/seed.test.ts`** (32 test):
  - đúng 9 sản phẩm, đúng loại đơn và nhóm hàng;
  - giá mẫu quy đổi ra đ/kg (đ/lít) nằm trong khoảng nhóm khảo sát;
  - Cốm và Bưởi là "giá mẫu";
  - không ảnh ngoài, không mã chứng nhận;
  - chỉ Bưởi có OCOP, kèm "chờ xác minh";
  - không có cụm từ hay sản phẩm bị loại;
  - khoảng ngày giao mận 05–06/2027; cốm lấy mốc từ PAR-08;
  - mỗi sản phẩm thuộc một "HTX mẫu …" có tài khoản;
  - SĐT giả, tài khoản che;
  - quét `src/` không còn nội dung cấm.
- **Trình duyệt** (Playwright, chặn mọi request ngoài localhost; không có request nào bị chặn):
  - dải demo hiện ở màn đăng nhập, khách, HTX, Admin, QLNN và trong bottom sheet;
  - màn 320px không cuộn ngang;
  - trang chi tiết Bưởi, Chè, Cốm hiện đúng khung dữ liệu mẫu;
  - trang nguồn gốc Bưởi không còn dòng chứng nhận mẫu.
- **Luồng 1 trên danh mục mới:**
  - Khách 1 đặt mứt mận (mua sẵn, hộp quà gửi người khác) và mận tươi (đặt trước); nút ghi "trả ngay 241.000đ";
  - HTX mẫu Bắc Hà xử lý 2 đơn; ĐVVC mô phỏng giao; khách nhận, đánh giá, khiếu nại kèm ảnh;
  - CSKH duyệt hoàn; Tài chính hoàn mô phỏng;
  - QLNN thấy "Tổng số đơn" từ 2 lên 4 và "Giá trị hàng đã giao" từ 240.000đ lên 450.000đ. Đơn mứt mận đang trả hàng – hoàn tiền nên không tính.
- **Luồng 2:**
  - Khách 2 mua ngay 1 gói chè, không trả: tồn còn đặt được từ 30 xuống 29;
  - tua 15 phút: đơn tự huỷ, tồn về 30.

### Còn tồn tại sau Giai đoạn 5

- **Danh mục phường/xã giao hàng và loại hộp quà** vẫn là danh sách mẫu. Phường/xã có ghi "(mẫu)"; chờ nhóm nạp danh mục chính thức.
- **Mô tả sản phẩm** chỉ ghi điều có trong bảng của nhóm; các thông tin khác ghi "chờ HTX xác nhận". **Quy cách của Cốm Tú Lệ và Bưởi Đại Minh** là quy cách mẫu.
- **Thư mục `legacy/`** vẫn giữ bản `index.html` cũ, có các nội dung bị gỡ, để nhóm đối chiếu. Thư mục này không được build hay deploy. Nhóm có thể xoá khi không cần nữa.
- **Màu sắc, cỡ chữ, trợ năng:** làm ở Giai đoạn 6 (đã làm).

## Giai đoạn 4 – Chức năng mức Must theo vai trò

### Tình trạng từng FR

Quy ước tình trạng:
- **Đã làm:** chức năng chạy thật trên dữ liệu demo.
- **Mô phỏng:** có màn hình và luồng đầy đủ, nhưng phần bên ngoài (OTP, cổng thanh toán, ngân hàng, ĐVVC) là giả lập, có nhãn "Mô phỏng".
- **Chưa làm:** kèm lý do.

**Khách hàng**

| FR | Nội dung | Tình trạng | Ghi chú |
|---|---|---|---|
| TK-01 | Đăng ký | Mô phỏng | SĐT + OTP mô phỏng `123456` |
| TK-02 | Đăng nhập | Mô phỏng | SĐT + OTP mô phỏng; có danh sách tài khoản demo |
| TK-03 | Thông tin cá nhân | Đã làm | Sửa họ tên; khai / đổi tài khoản nhận hoàn (hiện dạng che). SĐT là tên đăng nhập, không đổi tại đây |
| TK-04 | Sổ địa chỉ | Đã làm | Tối đa 10, mặc định, sửa, xoá; phường/xã theo danh mục |
| TKSP-01 | Danh mục | Đã làm | Lọc theo nhóm hàng |
| TKSP-02 | Tìm kiếm | Đã làm | Không phân biệt dấu, hoa/thường |
| TKSP-03 | Lọc | Đã làm | Vùng (sinh từ dữ liệu), nhóm hàng; màn rỗng có nút xoá lọc |
| TKSP-04 | Chi tiết sản phẩm | Đã làm | Kèm điểm đánh giá, đánh giá công khai, chứng nhận đã xác minh, nguồn gốc |
| TKSP-05 | Chia sẻ link | Đã làm | Link `#/san-pham/<mã>`. Dùng chia sẻ của thiết bị nếu có, không thì sao chép link. Mở link khi chưa đăng nhập thì mở sản phẩm sau khi đăng nhập |
| MHTT-01 | Giỏ hàng 2 nhóm | Đã làm | |
| MHTT-02 | Đặt mua sẵn | Đã làm | |
| MHTT-03 | Đặt trước | Đã làm | |
| MHTT-04 | Hộp quà | Đã làm | |
| MHTT-05 | Thanh toán | Mô phỏng | Cổng thanh toán mô phỏng |
| MHTT-07 | Trả phần còn lại | Mô phỏng | Trả qua cổng mô phỏng hoặc đổi sang COD 1 lần |
| DH-01 | Danh sách đơn theo tab trạng thái | Đã làm | |
| DH-02 | Đổi người nhận và địa chỉ trước khi bàn giao | Đã làm | Kèm đổi ngày giao D 1 lần (BR-DAT-08) và sửa lời nhắn, người nhận quà trước Đang chuẩn bị (BR-DAT-09) |
| DH-03 | Huỷ đơn | Đã làm | Huỷ ngay hoặc gửi yêu cầu theo trạng thái |
| DH-04 | Yêu cầu trả hàng | Đã làm | |
| DH-13 | Chi tiết đơn kèm lịch sử trạng thái | Đã làm | |
| DH-15 | Xác nhận đã nhận hàng | Đã làm | |
| CSKH-01 | Gửi ticket | Đã làm | Ảnh thu nhỏ, chỉ lưu trên trình duyệt |
| CSKH-04 | Đánh giá | Đã làm | 1–5 sao; 1–2 sao cần ≥ 20 ký tự; ≤ 500 ký tự; ≤ 5 ảnh; mỗi sản phẩm / đơn 1 lần |
| CSKH-10 | Thông báo | Đã làm | |

**HTX**

| FR | Nội dung | Tình trạng | Ghi chú |
|---|---|---|---|
| TK-06/07 | Hồ sơ HTX, gửi duyệt, theo dõi kết quả | Đã làm | Trong lúc chờ duyệt vẫn hiện hồ sơ cũ |
| SP-02..06 | Tạo, sửa, ẩn sản phẩm, gửi duyệt | Đã làm | Tạo mới và sửa nội dung → Chờ duyệt; ẩn / hiện có hiệu lực ngay |
| SP-07 | Tồn kho và giá | Đã làm | Tồn kho có hiệu lực ngay; giá chờ duyệt |
| SP-08 | Chứng nhận | Đã làm | Khai kèm ảnh → Admin – Chất lượng xác minh; chỉ chứng nhận đã xác minh mới hiện cho khách |
| SP-09 | Cấu hình đặt trước và hoả tốc | Đã làm | Báo thu hoạch / mở đặt trước và cờ hoả tốc đều chờ duyệt |
| DH-07 | Danh sách đơn | Đã làm | |
| DH-08 | Xác nhận / từ chối đơn | Đã làm | |
| DH-09 | Đóng gói, bàn giao | Đã làm | Phiếu đóng gói; quà gửi người khác không in giá |
| DH-10 | Xử lý trả hàng, nhận hàng hoàn | Đã làm | HTX đề xuất hoàn / không hoàn; CSKH quyết định |
| DH-16 | Xử lý yêu cầu huỷ | Đã làm | |
| DH-17 | Báo sẵn sàng / không cung cấp được | Đã làm | |
| CSKH-05/08 | Phản hồi ticket và đánh giá | Đã làm | Không sửa, không xoá đánh giá |
| DT-01..03 | Doanh thu và đối soát | Đã làm | |

**Admin**

| Nhóm | FR | Nội dung | Tình trạng | Ghi chú |
|---|---|---|---|---|
| Vận hành | TK-10/12 | Cấp, khoá tài khoản | Đã làm | Không tự khoá chính mình; khoá phải ghi lý do; phiên đang mở bị đăng xuất |
| Vận hành | HT-02 | Tham số | Đã làm | Sửa kèm lý do, lưu lịch sử, chỉ áp cho đơn mới; có cột Tình trạng |
| Vận hành | HT-04 | Danh mục dùng chung | Đã làm | Phường/xã (có khoảng cách mẫu), 2–3 loại hộp quà, bậc phụ phí hoả tốc |
| Vận hành | – | Mô phỏng ĐVVC | Mô phỏng | Chờ OI-01 |
| Chất lượng | TK-08/09 | Duyệt hồ sơ HTX | Đã làm | |
| Chất lượng | SP-04 | Duyệt sản phẩm và giá | Đã làm | Sản phẩm mới, nội dung, giá, báo thu hoạch, hoả tốc, chứng nhận |
| Chất lượng | TK-13 | Kích hoạt / tạm khoá quyền bán | Đã làm | Khoá phải ghi lý do; sản phẩm hiện "Tạm ngừng bán", không đặt được |
| CSKH | CSKH-07..09 | Ticket | Đã làm | |
| CSKH | CSKH-06 | Kiểm duyệt đánh giá | Đã làm | Ẩn phải chọn lý do trong danh sách; không có lý do "sao thấp" |
| CSKH | DH-11 | Duyệt trả hàng | Đã làm | |
| Tài chính | DH-12 | Ghi nhận hoàn tiền | Mô phỏng | Ngân hàng mô phỏng |
| Tài chính | DT-02..03 | Đối soát, chốt kỳ | Đã làm | |
| Tài chính | DT-04 | Chi trả | Mô phỏng | Chi trả mô phỏng |
| Quản trị gốc | TK-11 | Phân quyền | Đã làm | |
| Quản trị gốc | HT-03 | Nhật ký | Đã làm | |
| (Vận hành) | HT-01 | Mã ưu đãi | Đã làm | Tạo mã theo mức chi tối thiểu, nhóm hàng, HTX, khách lần đầu, hạn, số lượt; bật / tắt mã |
| Mọi nhóm | BCTK-01 | Dashboard | Đã làm | Tính từ store; có nút xuất CSV |

**Cơ quan QLNN**

| FR | Nội dung | Tình trạng | Ghi chú |
|---|---|---|---|
| BCTK-01 | Dashboard tổng hợp | Đã làm | |
| BCTK-02, 03 | Xuất báo cáo | Đã làm | CSV tổng hợp và CSV đơn ẩn danh; không có dữ liệu cá nhân |

### Thay đổi khác

- **Tách mã theo vai trò** (lazy load). Màn HTX, Admin, QLNN chỉ tải khi đăng nhập vai trò đó. Bản build không còn cảnh báo vượt 500 kB, và khách trên điện thoại tải ít hơn.
- **Sửa câu thông báo** khi trả phần còn lại của đơn đặt trước (trước đây báo nhầm "Chờ xác nhận").

### Kiểm thử Giai đoạn 4

- **Unit test** `phase4.test.ts` (9 test):
  - T19 và các quy tắc đánh giá;
  - cấp / khoá tài khoản, phân quyền;
  - hồ sơ HTX, khoá quyền bán;
  - sản phẩm mới chờ duyệt, ẩn sản phẩm;
  - tham số áp cho đơn mới (BR-DAT-06);
  - hộp quà 2–3 loại; tạo, tắt mã ưu đãi;
  - đổi ngày giao 1 lần, đổi địa chỉ;
  - xuất báo cáo không có dữ liệu cá nhân.
- **Trình duyệt:** chạy từng chức năng ở trên cho đủ các vai trò, và chạy trọn **Luồng 1** của mục 11.2:
  1. Khách 1 đặt mật ong (mua sẵn, hộp quà gửi người khác nên COD bị khoá) và mận (đặt trước, tick điều kiện huỷ). Nút ghi "trả ngay 359.000đ"; thanh toán thành công.
  2. HTX mẫu Bắc Hà thấy đúng 2 đơn. Phiếu đóng gói của đơn quà không in giá. HTX xác nhận và bàn giao đơn mua sẵn; với đơn đặt trước thì báo sẵn sàng → khách trả phần còn lại → HTX bàn giao.
  3. Admin – Vận hành mô phỏng ĐVVC giao thành công.
  4. Khách bấm Đã nhận, đánh giá 4 sao, gửi khiếu nại kèm ảnh và yêu cầu hoàn.
  5. Admin – CSKH kết luận và duyệt hoàn.
  6. Admin – Tài chính: Bắt đầu hoàn → ngân hàng mô phỏng xác nhận.
  7. QLNN thấy "Tổng số đơn 4", "Giá trị hàng đã giao 475.000đ" (gạo 390.000đ + mận 85.000đ; đơn mật ong đang Trả hàng – hoàn tiền nên không tính).
- **Luồng 2:** đã đạt từ Giai đoạn 2.

### Còn tồn tại sau Giai đoạn 4

- **HTX chưa đổi được tài khoản nhận chi trả trên giao diện.** Đây là dữ liệu nhạy cảm nên cần quy trình riêng, hiện vẫn hiện dạng che `**** 01xx`. Chờ nhóm quyết định.
- **Chưa có:** đổi SĐT đăng nhập; quên / khoá đăng nhập do nhập sai OTP nhiều lần. SRS trích trong yêu cầu không nêu chi tiết.
- **Nội dung, ảnh, danh mục sản phẩm vẫn là bộ cũ** (đã thay ở Giai đoạn 5). **Màu sắc, cỡ chữ, trợ năng:** Giai đoạn 6.

---

## Giai đoạn 3 – Dữ liệu dùng chung và đăng nhập

### Đăng nhập và phân quyền (mục 5.9)

- **Đăng nhập bằng SĐT + OTP.**
  - Màn hình ghi rõ "OTP mô phỏng", mã luôn là `123456`, có nút "Điền OTP mô phỏng".
  - Có danh sách tài khoản demo để bấm nhanh: bấm một tài khoản thì điền sẵn SĐT, rồi nhập OTP.
  - Sai OTP, SĐT chưa có tài khoản, tài khoản đang khoá đều bị chặn kèm lý do.
- **Khách hàng mới đăng ký được** bằng họ tên + SĐT + OTP mô phỏng (FR-TK-01). Tài khoản HTX, Admin, QLNN do Admin cấp (làm ở Giai đoạn 4).
- **Đã bỏ thanh chuyển vai trò công khai,** ô chọn HTX và ô chọn nhóm quyền Admin. Vai trò, HTX và nhóm quyền lấy từ tài khoản đăng nhập. Đổi vai trò bằng nút "Đăng xuất" rồi đăng nhập tài khoản khác.
- **Đã bỏ màn đăng nhập cũ của `src/App.tsx`:** mật khẩu, Face ID, "Silent Push khoá phiên", hotline 1900. Thẻ "Khoá phiên tức thời (thử nghiệm)" ở Tham số cũng đã bỏ. Khoá tài khoản thật làm ở Giai đoạn 4 (FR-TK-10/12).
- **Phiên đăng nhập lưu theo từng tab** (`sessionStorage`), dữ liệu lưu chung (`localStorage`).
  - Hai tab cùng trình duyệt đăng nhập được hai vai trò khác nhau và thấy cùng một dữ liệu.
  - Tab còn lại cập nhật ngay qua sự kiện `storage` và khi tải lại trang.
- **Kiểm quyền đọc trong hàm domain** (`src/domain/access.ts`), các màn đều đọc qua đây:
  - `listOrdersFor`, `getOrderFor`: khách chỉ thấy đơn của mình; HTX chỉ thấy đơn của HTX mình; QLNN không xem được chi tiết đơn.
  - `listTicketsFor`: HTX chỉ thấy ticket của HTX mình.
  - `regulatorOrderRows`: dòng đơn ẩn danh cho QLNN (không tên, SĐT, địa chỉ, tài khoản).
  - `readAuditLogs`: chỉ Quản trị gốc xem nhật ký; QLNN không xem được.
  - `viewRefundAccount`: tài khoản ngân hàng của khách hiện dạng che `**** 0001`; chỉ Admin – Tài chính xem đầy đủ.
- **Quyền thao tác** đã kiểm trong từng hàm từ Giai đoạn 2. QLNN không có thao tác sửa nào.
- **Màn Admin chia chức năng theo nhóm quyền của tài khoản:**
  - Vận hành: Tổng quan, Đơn hàng, Mô phỏng ĐVVC, Tham số.
  - Chất lượng: Tổng quan, Duyệt sản phẩm & giá.
  - CSKH: Tổng quan, Ticket.
  - Tài chính: Tổng quan, Hoàn tiền, Đối soát HTX, Sổ giao dịch.
  - Quản trị gốc: Tổng quan, Tài khoản (chỉ xem), Nhật ký.

### Dữ liệu dùng chung (mục 7)

| Thực thể theo mục 7 | Trong store (`DemoState`) |
|---|---|
| users | `users` (tài khoản đăng nhập: vai trò, HTX, nhóm quyền, trạng thái) |
| coops | `coops` |
| products | `products` |
| preorderConfigs | `products[].preorder` (quan hệ 1–1 với sản phẩm đặt trước) |
| addresses | `addresses`, `wards` (danh mục phường/xã mẫu) |
| carts | `carts` (theo khách hàng) |
| checkouts (lần đặt) | `checkouts` |
| orders (kèm items, statusHistory) | `orders` |
| transactions | `transactions` |
| vouchers, voucherUsages | `vouchers`, `voucherUsages` |
| giftBoxTypes | `giftBoxTypes` |
| tickets | `tickets` |
| reviews | `reviews` (khung dữ liệu; chức năng đánh giá làm ở Giai đoạn 4) |
| ledgerEntries | `ledgerEntries`: tiền vào qua cổng, thu COD, hoàn tiền, chi trả HTX, hoa hồng. Chỉ thêm, không sửa |
| payoutPeriods | `payoutPeriods` |
| params (kèm history) | `params`, `paramHistory` |
| auditLogs | `auditLogs` |
| notifications | `notifications` |
| (thêm) | `customers`, `productChanges`, `refunds`, `lowStockAlerts`, `clockOffsetMs` |

- Mọi thay đổi đi qua các hàm trong `src/domain` thông qua `run()` của store.
- Khoá `localStorage` lên phiên bản 3, nên dữ liệu của bản cũ tự được thay bằng dữ liệu mẫu mới.

### Trung tâm thông báo (FR-CSKH-10)

Nút chuông ở thanh trên cùng hiện số chưa đọc. Mở ra thì đánh dấu đã đọc; bấm thông báo của đơn thì mở đúng đơn.

Thông báo do `deriveNotifications()` sinh: hàm so dữ liệu trước và sau mỗi thao tác. Vì vậy thao tác của người dùng, tác vụ theo giờ và cổng mô phỏng đều sinh thông báo như nhau.

| Sự kiện | Người nhận |
|---|---|
| Tạo đơn; đơn đổi trạng thái (kèm lý do) | Khách. HTX nhận khi đơn đã thanh toán / COD cần xác nhận và các bước sau. Không báo lại cho chính bên vừa thao tác |
| Đơn Đã giao | Khách, kèm lời "Mời bạn đánh giá sản phẩm" |
| HTX báo hàng sẵn sàng, cần trả phần còn lại | Khách |
| Nhắc thanh toán ở phút PAR-20 | Khách |
| Hoàn tiền (Chờ / Đang / Đã hoàn) | Khách |
| Khách yêu cầu huỷ; HTX từ chối yêu cầu huỷ | HTX; khách |
| Khiếu nại mới | HTX của đơn và Admin – CSKH |
| HTX phản hồi khiếu nại; ticket đổi trạng thái | Khách và CSKH; khách và HTX |
| Yêu cầu đổi giá / báo thu hoạch mới; kết quả duyệt | Admin – Chất lượng; HTX |
| Yêu cầu hoàn tiền mới | Admin – Tài chính |
| Đã ghi nhận chi trả kỳ đối soát | HTX |
| Tồn thấp (≤ ngưỡng PAR-02), tối đa 1 lần/ngày mỗi sản phẩm | HTX |

### Kiểm thử Giai đoạn 3

- **Unit test mới:**
  - `access.test.ts`: đăng nhập, đăng ký, T21, T22, che tài khoản, quyền xem nhật ký.
  - `notifications.test.ts`: thông báo theo trạng thái đơn, khiếu nại, kết quả duyệt, tồn thấp 1 lần/ngày.
- **Trình duyệt, 2 tab cùng lúc:**
  1. Tab A (Khách hàng mẫu 1): nhập sai OTP bị chặn; đăng nhập đúng; mua mật ong và thanh toán mô phỏng.
  2. Tab B mở ra ở màn đăng nhập (phiên riêng), đăng nhập HTX mẫu Bắc Hà. HTX nhận 2 thông báo ("Đơn mới … cần xác nhận", "Tồn thấp"), xác nhận đơn, không thấy đơn của HTX khác.
  3. Tab A tải lại: đơn sang Đang chuẩn bị, có 3 thông báo.
  4. Đăng xuất rồi đăng nhập QLNN: không có tên, SĐT, địa chỉ; có bảng đơn ẩn danh.
  5. Quản trị gốc thấy dòng nhật ký "HTX mẫu Bắc Hà · Xác nhận đơn".
  6. Admin – Tài chính thấy sổ giao dịch.
  7. Khách hàng mẫu 2 chỉ thấy đơn của mình.

### Còn tồn tại sau Giai đoạn 3

- ~~**Còn thiếu các chức năng tài khoản thuộc Giai đoạn 4**~~ – đã làm ở Giai đoạn 4.
- **Công cụ demo** hiện cho mọi tài khoản và cả ở màn đăng nhập, vì đây là bản demo. Nếu nhóm muốn chỉ Admin thấy thì sửa ở `AppShell`.

---

## Giai đoạn 2 – Sửa các lỗi đã phát hiện

### Cách làm

Phần lớn lỗi L1–L18 bắt nguồn từ việc app không có mô hình đơn hàng thật: tiền tính ngay trong màn hình, đơn gõ cứng, không có giao dịch, không có trạng thái. Vì vậy Giai đoạn 2 làm theo thứ tự:

1. **Mở rộng `src/domain`** thành các thao tác thuần trên toàn bộ dữ liệu (`DemoState`):

   | File | Nội dung |
   |---|---|
   | `cart.ts` | Giỏ, kiểm tra lại giá và tồn (BR-DAT-03), ngày giao D (BR-DAT-08) |
   | `checkout.ts` | Tách đơn, mã ưu đãi, hoả tốc, hộp quà, COD; tạo đơn và giao dịch gộp; chống tạo trùng (BR-DAT-01..09) |
   | `payment.ts` | `applyGatewayResult(txId, result, gatewayRef)`: thành công, thất bại, huỷ, tiền về muộn, trả hai lần (mục 5.4) |
   | `orders.ts` | Thao tác của Khách, HTX, ĐVVC mô phỏng; huỷ kèm hoàn tiền; kiểm quyền ngay trong hàm |
   | `jobs.ts` | Tác vụ theo giờ: hết hạn thanh toán PAR-19, nhắc PAR-20, quá hạn xác nhận PAR-11, hạn trả phần còn lại PAR-24, tự chuyển Đã giao PAR-26 |
   | `complaint.ts` | Khiếu nại, trả hàng, RET-01, ưu tiên Cao, CSKH kết luận (mục 5.7, 5.8) |
   | `productChanges.ts` | Tồn kho, đổi giá và báo thu hoạch chờ duyệt (mục 5.6, FR-SP-04) |
   | `settlement.ts`, `finance.ts` | Đối soát tuần, chốt kỳ, chi trả mô phỏng; hoàn tiền qua ngân hàng mô phỏng (mục 5.10, FR-DH-12) |
   | `stats.ts` | Số liệu tổng hợp tính từ store, bản cho QLNN không có dữ liệu cá nhân |
   | `address.ts` | Sổ địa chỉ theo BR-DAT-04 |

2. **Store** (`src/store`) giữ toàn bộ `DemoState` trong `localStorage` (khoá đổi sang phiên bản 2, dữ liệu cũ tự bỏ).
   - Store chạy tác vụ theo giờ khi tải app, mỗi 5 giây và sau khi tua đồng hồ.
   - Mọi thời điểm đọc qua `now()` của đồng hồ demo.
3. **Viết lại các màn bị ảnh hưởng** để chỉ gọi hàm domain, không tự tính tiền hay tự đổi trạng thái.

### Kết quả từng lỗi

| Mã | Tình trạng | Đã sửa thế nào | Cách kiểm |
|---|---|---|---|
| L1 | Đã làm | Tiền tính bằng `priceOrder` / `totalCheckout`. Cọc chỉ áp cho đơn đặt trước. Nút đặt hàng ghi đúng "trả ngay" bằng tổng phần online | Test T1, L1; trình duyệt: giỏ mật ong (online, mã −29.000đ) + gạo (COD) → nút "Đặt hàng – trả ngay 289.000đ", phần COD 418.000đ hiện riêng |
| L2 | Đã làm | Mỗi lần đặt 1 mã (PAR-28). Chỉ giảm tiền hàng hợp lệ. Bỏ mã freeship và nút "chọn hết / tối ưu". Mã không đủ điều kiện bị khoá và hiện lý do. Kiểm tra lại mã lúc bấm Đặt hàng | Test T2, T3; trình duyệt: chọn mã thứ hai thay cho mã đầu, mã hết hạn và mã "khách lần đầu" bị khoá kèm lý do |
| L3 | Đã làm | "Đặt trước" (Vụ mùa) và "Mua ngay" / "Đặt trước" (chi tiết sản phẩm) mở luồng đặt hàng chỉ cho đúng sản phẩm đó, luôn bắt đầu ở bước 1. Màn xác nhận liệt kê từng đơn, từng món (tên, SL, đơn giá, thành tiền) và từng khoản phí | Trình duyệt: đặt trước mận từ Vụ mùa → bước 1 chỉ có "HTX mẫu Bắc Hà · Đặt trước" |
| L4 | Đã làm | Đơn mới hiện ngay ở Khách (Đơn hàng), HTX (chỉ đúng HTX) và Admin (Đơn hàng). Trạng thái theo mục 5.5: online / đặt trước → Chờ thanh toán; COD → Chờ xác nhận | Trình duyệt: sau khi trả, 2 đơn hiện "Chờ xác nhận" ở khách; HTX Mường Khương chỉ thấy đơn của mình |
| L5 | Đã làm | Mua sẵn chọn COD hoặc online; cọc chỉ online; COD bị ẩn khi đơn vượt PAR-23 hoặc là quà gửi người khác. Có màn "Cổng thanh toán – MÔ PHỎNG" (3 nút, đồng hồ 15 phút, ghi "không trừ tiền thật"). Mọi đơn online và cọc gộp một giao dịch | Test T7, T11; trình duyệt: cổng hiện 14:59 |
| L6 | Đã làm | Số lượng chặn theo tồn khả dụng (mua sẵn) hoặc suất còn lại (đặt trước) ở giỏ, chi tiết sản phẩm và lúc đặt. Hiện số còn lại. Hết thì hiện "Hết hàng" | Test T9, T8 |
| L7 | Đã làm | Panel mã ưu đãi nằm trong bước 2 của màn đặt hàng; chọn mã không đóng màn | Trình duyệt: chọn mã xong vẫn ở "2. Ưu đãi & thanh toán" |
| L8 | Đã làm | Tìm không phân biệt dấu và hoa/thường | Test T20; trình duyệt: "gao seng cu" ra Gạo Séng Cù |
| L9 | Đã làm | Bộ lọc vùng sinh từ dữ liệu sản phẩm, cùng một cấp (Bắc Hà, Mường Khương, Sa Pa). Thêm bộ lọc nhóm hàng. Có màn "Không có sản phẩm phù hợp" kèm nút xoá lọc | Trình duyệt |
| L10 | Đã làm | Nguồn gốc, chi tiết đơn, phiếu đóng gói, form khiếu nại đều mở theo mã bản ghi được chọn | Trình duyệt: "Xem nguồn gốc" ở Mật ong hiện Mật ong |
| L11 | Đã làm | Bắt buộc chọn đơn Đã giao còn trong hạn RET-01, chọn sản phẩm, lý do, ít nhất 1 ảnh. "Đổi ý" không chọn hoàn tiền được. Không còn lời hứa "xử lý trong 24h/120 phút"; hiện mốc SLA-01 | Test T18; trình duyệt: chưa có ảnh → "Vui lòng thêm ít nhất 1 ảnh." |
| L12 | Đã làm | "Báo thu hoạch / mở đợt đặt trước" và đề xuất giá chuyển sang Chờ duyệt. Admin – Chất lượng duyệt hoặc từ chối (bắt buộc lý do). Trong lúc chờ vẫn bán giá cũ | Test L12; trình duyệt |
| L13 | Đã làm | Ví HTX tính theo mục 5.10: hoa hồng COM-01 5% trên tiền hàng thực giữ lại, không tính phí giao, kỳ tuần. Bỏ nút rút tiền, bỏ dòng thuế TNCN, bỏ "8%", "T+3". Admin – Tài chính chốt kỳ (kỳ đã chốt bị khoá) và ghi nhận chi trả (mô phỏng) vào tài khoản HTX | Test L13 |
| L14 | Đã làm | Form địa chỉ: Hà Nội cố định, phường/xã chọn từ danh sách "(mẫu)", không có quận/huyện, chung cư bắt buộc toà–căn, nhà mặt đất bắt buộc số nhà. Thêm, sửa, xoá, đặt mặc định, tối đa 10. Đã bỏ nút GPS | Trình duyệt: thiếu toà → "Chung cư bắt buộc nhập toà và căn hộ." |
| L15 | Đã làm | Ô ghi chú trống, có placeholder; nội dung lưu vào đơn và hiện trên phiếu đóng gói của HTX | Trình duyệt |
| L16 | Đã làm | Gạo Séng Cù thuộc "Hàng khô"; mỗi HTX một mã riêng. Giai đoạn 5 đã thay bằng danh mục của nhóm: 9 sản phẩm, 7 HTX mẫu | Dữ liệu mẫu |
| L17 | Đã làm | Admin – Tổng quan và màn QLNN tính từ store (`aggregateStats`). Màn QLNN không có tên, SĐT, địa chỉ khách | Test L17; trình duyệt: QLNN không chứa "Khách hàng mẫu" hay "0900" |
| L18 | Đã làm | Thông báo nổi xuống dòng được, đặt ở đáy phía trên thanh tab, không chặn thao tác bấm | Trình duyệt |

### Thêm trong Giai đoạn 2 (cần cho các lỗi trên)

- **Mô phỏng đơn vị vận chuyển** (Admin – Vận hành) gồm các nút Đang giao, Giao thành công, Giao thất bại (kèm lý do) và Khách từ chối nhận. Màn này thay cho vai trò Shipper đang ẩn vì OI-01. Giao thất bại quá PAR-27 lần giao lại thì đơn sang Đang chuyển hoàn.
- **Công cụ demo** (nút viền vàng góc phải thanh trên cùng):
  - tua thời gian +15 phút / +24 giờ / +3 ngày, hoặc đưa về giờ thật;
  - gửi "tiền về muộn";
  - gửi kết quả cổng lần hai;
  - khôi phục dữ liệu mẫu.
- **Luồng HTX:** xác nhận hoặc từ chối đơn (bắt buộc lý do); báo sẵn sàng hoặc báo không cung cấp được (đặt trước); đóng gói và bàn giao (tồn kho bị trừ hẳn lúc bàn giao); nhận hàng hoàn; duyệt yêu cầu huỷ của khách. Phiếu đóng gói của quà gửi người khác không in giá.
- **Luồng khách:**
  - huỷ ngay ở Chờ thanh toán / Chờ xác nhận; gửi yêu cầu huỷ ở Đã xác nhận / Đang chuẩn bị;
  - trả phần còn lại của đơn đặt trước, hoặc đổi sang COD 1 lần;
  - bấm Đã nhận hàng;
  - xem chi tiết đơn kèm lịch sử trạng thái.
- **Admin – CSKH** xử lý ticket và duyệt hoàn khi kết luận. **Admin – Tài chính** đưa yêu cầu hoàn qua Đang hoàn tiền → Đã hoàn tiền khi ngân hàng mô phỏng xác nhận; mỗi yêu cầu chỉ thành công 1 lần.
- **Nhật ký thao tác** của Admin và HTX (chỉ thêm, không sửa, không xoá) ở Admin – Vận hành › Nhật ký.
- **Dữ liệu mẫu viết lại theo mô hình mới:**
  - tên "HTX mẫu …", khách "Khách hàng mẫu 1/2", SĐT `0900 000 00x`, tài khoản hiện dạng che;
  - 4 mã ưu đãi đúng mục 5.3: mức chi tối thiểu, theo danh mục, khách lần đầu, đã hết hạn;
  - 3 loại hộp quà;
  - 8 phường/xã "(mẫu)" có khoảng cách mẫu;
  - 2 đơn mẫu tạo qua chính hàm domain: 1 đơn Đã giao, 1 đơn Chờ xác nhận.

### Kiểm thử luồng (mục 11.2) bằng Playwright

**Luồng 1** – các bước đã chạy:
1. Khách đặt 1 món mua sẵn online + 1 món mua sẵn COD, có mã ưu đãi.
2. Cổng mô phỏng báo thành công.
3. HTX Mường Khương thấy đúng đơn của mình, xác nhận, bàn giao.
4. Admin – Chất lượng duyệt báo thu hoạch.
5. Admin – Vận hành mô phỏng ĐVVC "Giao thành công".
6. Khách bấm Đã nhận hàng.
7. Khách gửi khiếu nại: không có ảnh bị chặn; có ảnh thì tạo được ticket.
8. QLNN thấy số liệu tổng hợp, không có dữ liệu cá nhân.

Chưa chạy được, chờ giai đoạn sau:
- đăng nhập (Giai đoạn 3);
- đánh giá (Giai đoạn 4);
- đơn kèm "hộp quà gửi người khác" trên trình duyệt (đã có test domain).

**Luồng 2:** đặt 1 đơn online rồi tua +15 phút → trên trình duyệt đơn chuyển Đã huỷ. Phần nhả hàng, nhả suất, nhả lượt mã và trả sản phẩm về giỏ đã kiểm bằng test T8 và T11.

### Còn tồn tại sau Giai đoạn 2

- ~~**Danh tính tạm thời** (khách cố định, chọn HTX và nhóm quyền bằng ô chọn)~~ – đã thay bằng đăng nhập ở Giai đoạn 3.
- ~~**Chưa có:** đổi ngày giao D 1 lần sau khi đặt; đổi người nhận / địa chỉ trước bàn giao; trung tâm thông báo; đánh giá~~ – đã làm ở Giai đoạn 3–4.
- ~~**Màn Tham số chỉ đọc**~~ – đã cho sửa kèm lý do ở Giai đoạn 4.
- **Sản phẩm, mô tả, ảnh Unsplash vẫn là bộ cũ**, chỉ đã sửa nhóm hàng và mã HTX. Giai đoạn 5 thay theo danh mục của nhóm (đã thay).

---

## Giai đoạn 1 – Hợp nhất mã nguồn và sửa cấu hình build (đã xong)

- `src/App.tsx` build được nên lấy làm gốc, không phải viết lại.
- `index.html` là entry chuẩn Vite; không còn React, Babel, Tailwind, Font Awesome từ CDN; font tự host qua `@fontsource`.
- **Đã chuyển từ bản cũ:** tab Vụ mùa, trang nguồn gốc, giỏ hàng bottom sheet.
- **Bản cũ và các script ghi đè** nằm ở `legacy/` (xem `legacy/README.md`).
- **Đã gỡ:** `@google/genai`, `express`, `dotenv`, `@types/express`, `motion`, `tsx`, `autoprefixer`, khai báo Gemini.
- **Mã nguồn chia theo thư mục:** `src/domain`, `src/data`, `src/store`, `src/screens/{customer,coop,admin,regulator}`, `src/components`, `src/app`. Vai trò Shipper giữ ở `src/screens/_pending-OI-01/`.
- **Không cần `vercel.json`**, vì app một trang, không có đường dẫn phía client.
- **Nghiệm thu:** build không lỗi; trang chạy khi chặn mọi CDN; bundle không có Babel.
- **Đã bỏ khung iPhone giả.** Khách và HTX rộng tối đa 640px; Admin và QLNN dùng bố cục rộng.

---

## Kiểm thử bắt buộc (mục 11.1)

| Ca | Tình trạng | File test |
|---|---|---|
| T1 | Đạt | `pricing.test.ts` |
| T2 | Đạt | `voucher.test.ts` |
| T3 | Đạt | `pricing.test.ts`, `voucher.test.ts` |
| T4 | Đạt | `pricing.test.ts` |
| T5 | Đạt | `pricing.test.ts` |
| T6 | Đạt | `pricing.test.ts` |
| T7 | Đạt | `checkout.test.ts` |
| T8 | Đạt | `checkout.test.ts` |
| T9 | Đạt | `stock.test.ts`, `checkout.test.ts` |
| T10 | Đạt | `pricing.test.ts` |
| T11 | Đạt | `checkout.test.ts` |
| T12 | Đạt | `orderStateMachine.test.ts` |
| T13 | Đạt | `payment.test.ts` |
| T14 | Đạt | `refund.test.ts` |
| T15 | Đạt | `payment.test.ts` |
| T16 | Đạt | `payment.test.ts` |
| T17 | Đạt | `refund.test.ts`, `flow.test.ts` |
| T18 | Đạt | `flow.test.ts` |
| T19 | Đạt | `phase4.test.ts` |
| T20 | Đạt | `text.test.ts` |
| T21 | Đạt | `access.test.ts`, `flow.test.ts` |
| T22 | Đạt | `access.test.ts`, `payment.test.ts` |

Ngoài các ca trên còn có test cho:
- đặt lặp với cùng khoá (BR-DAT-07), HTX không đặt được hàng (BR-DAT-01);
- giá tăng / giảm (BR-DAT-03), ngày giao D (BR-DAT-08);
- COD bị ẩn, hoả tốc sau 14:00, lời nhắn hộp quà;
- quá hạn xác nhận, trả phần còn lại và quá hạn PAR-24, tự chuyển Đã giao sau PAR-26, chuyển hoàn sau PAR-27;
- đối soát, số liệu tổng hợp.

## Giả định đã dùng

1. **PAR-18 = 30%, COM-01 = 5%:** theo bảng tham số mục 4, đánh dấu "Giả định" trong màn Tham số.
2. **PAR-26 và RET-01 lưu theo giờ:** hàng khô 72 giờ (= 3 ngày) và 240 giờ (= 10 ngày). Đơn có ít nhất một món tươi thì dùng hạn hàng tươi.
3. **Mốc thời gian tính theo giờ địa phương của trình duyệt:** mốc hoàn cọc (hết 23:59:59 ngày D − PAR-08), giờ chốt hoả tốc PAR-21, kỳ đối soát (thứ Hai 00:00).
4. **Bậc hoả tốc FEE-02 tính cả mốc trên.** Đơn hoả tốc trả phí giao thường FEE-01 cộng phụ phí FEE-02.
5. **Sau khi HTX xác nhận, hệ thống tự chuyển tiếp** sang Chờ thu hoạch (đặt trước) hoặc Đang chuẩn bị (mua sẵn); cả hai bước đều ghi lịch sử. Lý do: bảng chuyển trạng thái chỉ ghi điều kiện là loại đơn, không ghi người bấm.
6. **Khách được gửi yêu cầu huỷ khi đơn đặt trước ở Chờ thu hoạch.** Mục 5.7 cho huỷ theo mốc D − PAR-08 nhưng bảng chuyển trạng thái chưa ghi rõ.
7. **Khách huỷ một đơn Chờ thanh toán thì huỷ cả giao dịch gộp** (các đơn online cùng lần đặt), giống bấm "Huỷ" ở cổng. Lý do: một giao dịch chỉ có một số tiền.
8. **Huỷ đơn luôn phải ghi lý do.** Hệ thống tự ghi lý do khi tự huỷ.
9. **Lượt mã được nhả** khi mọi đơn dùng mã của lần đặt đều bị huỷ trước bàn giao và không đơn nào mất cọc. Huỷ một phần thì giữ lượt.
10. **Chia giảm giá làm tròn xuống từng đơn,** phần lẻ dồn vào đơn có tiền hàng hợp lệ lớn nhất.
11. **Số tiền hoàn trả hàng** = số khách đã thực trả × (giá trị phần được duyệt sau khi trừ phần giảm giá chia cho phần đó ÷ tổng đơn). Không hoàn phí giao (OI-08 mặc định `false`).
12. **Đơn đặt trước khách huỷ sau mốc:** khách mất cọc, nên đơn giữ tình trạng thanh toán "Đã cọc – còn lại".
13. **Trả phần còn lại thất bại** không huỷ đơn; khách thử lại tới hạn PAR-24 mà hạn không được gia hạn.
14. **Phần còn lại về sau khi giao dịch đã kết thúc** thì tạo yêu cầu hoàn khoản vừa nhận.
15. **Phí hộp quà không tính vào doanh thu HTX** khi đối soát, vì SRS chưa quy định.
16. **Ghi chú của khách** là một ô cho cả lần đặt, chép vào từng đơn.
17. **Mặc định:** đơn mua sẵn thanh toán online, giao thường. Khách tự chọn COD hoặc hoả tốc.
18. **Ảnh khiếu nại** được thu nhỏ còn cạnh dài 320px và chỉ lưu trên trình duyệt (mô phỏng tải ảnh).
19. **Đề xuất của SRS dùng như quy tắc:** BR-TON-04 (giữ hàng ngay khi tạo đơn) và BR-TT-06 (lần trả thứ hai tạo yêu cầu hoàn 100%).
20. **Mã đơn** dạng `DH-yyyymmdd-xxxxxx`, phần ngẫu nhiên bỏ các ký tự dễ nhầm (0/O, 1/I).
21. **preorderConfigs lưu ngay trong sản phẩm** (`products[].preorder`), vì mỗi sản phẩm đặt trước có đúng một cấu hình đang áp dụng. Lịch sử báo thu hoạch nằm ở `productChanges`.
22. **Phiên đăng nhập theo từng tab** (`sessionStorage`), để demo hai vai trò song song trên một trình duyệt.
23. **Nhật ký thao tác chỉ Quản trị gốc xem** (FR-HT-03); các nhóm Admin khác không xem.
24. **Thông báo không gửi lại cho chính bên vừa thao tác** (ví dụ HTX tự xác nhận đơn thì chỉ khách nhận thông báo).
25. **Tồn thấp khi tồn khả dụng ≤ ngưỡng** (PAR-02 hoặc ngưỡng riêng của sản phẩm), kể cả lúc khách vừa tạo đơn và hàng đang được giữ.
26. **Khách hàng đăng ký mới** bằng SĐT + OTP mô phỏng, chưa yêu cầu thêm thông tin nào khác.
27. **Mã ưu đãi (HT-01) do Admin – Vận hành tạo,** vì yêu cầu không ghi rõ nhóm quyền.
28. **Đơn hoả tốc chỉ đổi được địa chỉ khi phụ phí không đổi.** Nếu phụ phí đổi, khách liên hệ CSKH; app không tự thu thêm hay hoàn bớt.
29. **Sản phẩm mới ở trạng thái Chờ duyệt** cho tới khi Admin – Chất lượng duyệt; bị từ chối thì ở trạng thái "Bị từ chối". **Sửa nội dung** chờ duyệt và trong lúc chờ khách thấy nội dung cũ. **Ẩn / hiện** có hiệu lực ngay.
30. **Chỉ chứng nhận đã được Admin – Chất lượng xác minh mới hiện cho khách,** ghi "Admin đã xem hồ sơ – mô phỏng". Nhãn `certLabel` của dữ liệu mẫu cũ đã bị xoá ở Giai đoạn 5.
31. **Đánh giá công khai** hiện tên rút gọn (ví dụ "Khách 1.") và 3 ký tự cuối của mã đơn.
32. **Danh sách lý do được phép ẩn đánh giá** gồm: thông tin cá nhân, ngôn từ xúc phạm, quảng cáo / spam / link, không liên quan sản phẩm. Không có lý do "sao thấp".
33. **Giới hạn khi khoá tài khoản và phân quyền:**
    - Admin – Vận hành không khoá được chính mình và không khoá được Quản trị gốc.
    - Quản trị gốc không tự đổi nhóm quyền của mình và không cấp thêm quyền Quản trị gốc.
34. **HTX bị tạm khoá quyền bán:** sản phẩm vẫn hiện trong danh mục kèm nhãn "Tạm ngừng bán" nhưng không đặt được. Các đơn đã có vẫn xử lý bình thường.
35. **Báo cáo CSV** mã hoá UTF-8 có BOM để Excel hiển thị đúng tiếng Việt.
36. **Mỗi vùng trong bảng sản phẩm có một HTX mẫu riêng.** Lý do: nhóm chưa cung cấp tên HTX. Như vậy có 7 HTX; Bắc Hà bán 3 sản phẩm. Sản phẩm ghi 2 địa danh (vd. "Mường Khương, Bát Xát") vẫn chỉ gắn 1 HTX.
37. **Giá mẫu chọn gần giữa khoảng nhóm khảo sát.** Chè lấy mức phổ thông – trung cấp 800.000đ/kg. Cốm Tú Lệ 110.000đ/gói 500 g và Bưởi Đại Minh 200.000đ/thùng 5 kg là giá và quy cách tự đặt, ghi "giá mẫu".
38. **Khoảng ngày giao của mận tươi** là 01/05 – 30/06 của mùa kế tiếp, tức 2027 khi chạy demo năm 2026. Theo bảng của nhóm: mùa bán tháng 5–7, khoảng giao mẫu 05–06/2027.
39. **"Khoảng ngày giao lấy từ cấu hình"** của Cốm Tú Lệ được hiểu là ngày giao sớm nhất bằng hôm nay + PAR-08, kéo dài 4 tuần. Bưởi Đại Minh chưa có khoảng ngày giao nên dùng cách tương tự: bắt đầu sau mốc PAR-08 thêm 1 tuần. Cả hai đều ghi "(mẫu, chờ HTX xác nhận)".
40. **Bộ lọc vùng tách theo dấu phẩy:** mỗi địa danh trong ô "Vùng" thành một lựa chọn lọc. Số liệu QLNN theo vùng vẫn dùng nguyên chuỗi vùng của sản phẩm.
41. **Nhãn "Dữ liệu mẫu – chờ HTX xác nhận" chỉ gắn cho sản phẩm trong danh mục mẫu.** Sản phẩm HTX tự tạo trong demo thì do chính HTX khai, nên không có nhãn này. Dải "Bản demo" vẫn hiện trên mọi màn.
42. **Dải màu đầy đủ cho xanh rừng và champagne** tự tính từ 2 màu gốc của nhóm, chọn độ sáng để các cặp chữ / nền đang dùng đạt AA. Nhóm đổi màu gốc thì cần kiểm tra lại tương phản.
43. **Chữ phụ dùng token `muted` `#6B655F`** thay cho `stone-500`, vì `stone-500` không đạt AA trên nền trắng ngà.
44. **Ô nhập dùng chữ 16px trên điện thoại** để iOS không tự phóng to khi bấm vào ô (chuyện này xảy ra sau khi bỏ chặn phóng to).
45. **Dải demo dùng chữ 12px đậm** vì là nhãn, không phải nội dung; ở 320px dải xuống 2 dòng.
46. **Màn QLNN đổi thẻ đầu trang từ xanh lam sang xanh rừng** để theo bảng nhận diện. Nhãn trạng thái đơn và khung "Hoàn tiền" vẫn dùng màu thông tin (xanh lam).
47. **Trạng thái lỗi của danh sách** gồm 2 trường hợp: lỗi khi hiển thị (bắt bằng error boundary) và lỗi không có quyền xem (hiện lý do). Dữ liệu demo đọc từ `localStorage` nên không có lỗi mạng.
48. **SĐT nhập 9 số được hiểu là số di động bỏ số 0 đầu.** Chuỗi 11 số bắt đầu bằng `84` được hiểu là có mã nước. App lưu dạng 10 số `0xxxxxxxxx` để tương thích với dữ liệu đã có.

## Vấn đề chờ nhóm chốt

| Mã | Nội dung | Cách app đang xử lý |
|---|---|---|
| OI-01 | Ai cập nhật trạng thái giao hàng | Ẩn Shipper và Điều phối Ops. Dùng màn "Mô phỏng ĐVVC" trong Admin – Vận hành |
| OI-02 | (theo SRS) | Chưa đụng tới |
| OI-04 | (theo SRS) | Chưa đụng tới |
| OI-05 | (theo SRS) | Chưa đụng tới |
| OI-08 | Có hoàn phí giao khi lỗi không do khách | Tham số, mặc định không hoàn |
| OI-11 | (theo SRS) | Chưa đụng tới |
| OI-13 | Chính sách đổi hàng | Không làm chức năng đổi hàng |
| OI-15 | (theo SRS) | Chưa đụng tới |
| OI-16 | (theo SRS) | Chưa đụng tới |

Tài liệu yêu cầu không mô tả nội dung của OI-02, OI-04, OI-05, OI-11, OI-15, OI-16. Nhóm cần cung cấp mô tả để ghi đúng vào báo cáo.

## Tài khoản demo và khôi phục dữ liệu

**Tài khoản demo.** Đăng nhập bằng SĐT, OTP mô phỏng luôn là `123456`. Có thể bấm tên tài khoản ở màn đăng nhập để điền sẵn số.

| Tài khoản | SĐT | Vai trò |
|---|---|---|
| Khách hàng mẫu 1 | 0900 000 001 | Khách hàng (có tài khoản nhận hoàn, có 1 đơn mẫu Chờ xác nhận) |
| Khách hàng mẫu 2 | 0900 000 002 | Khách hàng (có 1 đơn mẫu Đã giao) |
| HTX mẫu Bắc Hà | 0900 000 101 | HTX (mứt / ô mai mận, phở hồng, mận tươi đặt trước; có 1 đơn mẫu Chờ xác nhận) |
| HTX mẫu Mường Khương | 0900 000 102 | HTX (gạo Séng Cù; có 1 đơn mẫu Đã giao) |
| HTX mẫu Suối Giàng | 0900 000 103 | HTX (chè Shan tuyết) |
| HTX mẫu Sa Pa | 0900 000 104 | HTX (thảo quả khô) |
| HTX mẫu Bảo Hà | 0900 000 105 | HTX (mật ong Thanh Xuân) |
| HTX mẫu Tú Lệ | 0900 000 106 | HTX (cốm Tú Lệ, đặt trước) |
| HTX mẫu Thác Bà | 0900 000 107 | HTX (bưởi Đại Minh, đặt trước) |
| Admin – Vận hành (mẫu) | 0900 000 201 | Admin – Vận hành |
| Admin – Chất lượng (mẫu) | 0900 000 202 | Admin – Chất lượng |
| Admin – CSKH (mẫu) | 0900 000 203 | Admin – CSKH |
| Admin – Tài chính (mẫu) | 0900 000 204 | Admin – Tài chính |
| Quản trị gốc (mẫu) | 0900 000 209 | Quản trị gốc |
| Cơ quan QLNN (mẫu) | 0900 000 301 | Cơ quan QLNN (chỉ xem) |

- **Khôi phục dữ liệu mẫu:** bấm "Công cụ demo" ở góc phải thanh trên cùng, rồi bấm "Khôi phục dữ liệu mẫu". Thao tác này xoá dữ liệu trong `localStorage` (khoá `dac-san-so-lao-cai:data`), nạp lại dữ liệu mẫu và đưa đồng hồ demo về giờ thật.
