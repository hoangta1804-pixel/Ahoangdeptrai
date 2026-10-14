# Báo cáo sửa prototype "Đặc Sản Số Lào Cai"

Tài liệu này cập nhật sau mỗi giai đoạn của `PROMPT_SUA_APP.md`. Mã trong ngoặc (`BR-…`, `FR-…`, `PAR-…`, `OI-…`) là mã trong SRS hợp nhất.

| Giai đoạn | Nội dung | Tình trạng |
|---|---|---|
| 1 | Hợp nhất mã nguồn, sửa cấu hình build | **Xong** |
| 2 | Sửa lỗi L1–L18 | **Xong** |
| 3 | Dữ liệu dùng chung và đăng nhập | **Xong** |
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

### Kết quả lần chạy cuối (Giai đoạn 3)

| Lệnh | Kết quả |
|---|---|
| `npm run lint` | Không lỗi |
| `npm test` | 11 file, 59 test, tất cả đạt |
| `npm run build` | Thành công |
| Kiểm thử trình duyệt (Playwright, chặn mọi request ngoài localhost, 2 tab cùng lúc) | Đạt. Không lỗi JS |

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

- **Còn thiếu các chức năng tài khoản thuộc Giai đoạn 4:** thông tin cá nhân (TK-03), hồ sơ HTX (TK-06/07), cấp và khoá tài khoản (TK-10/12), phân quyền (TK-11). Màn "Tài khoản" của Quản trị gốc hiện chỉ xem.
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
| L16 | Đã làm | Gạo Séng Cù thuộc "Hàng khô"; mỗi HTX một mã riêng (4 HTX mẫu). Danh mục đầy đủ của nhóm thay ở Giai đoạn 5 | Dữ liệu mẫu |
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
- **Chưa có:** đổi ngày giao D 1 lần sau khi đặt; đổi người nhận / địa chỉ trước bàn giao; trung tâm thông báo; đánh giá. Các mục này thuộc Giai đoạn 3–4.
- **Màn Tham số chỉ đọc.** Phần sửa kèm lý do làm ở Giai đoạn 4; hàm `updateParam` đã có.
- **Sản phẩm, mô tả, ảnh Unsplash vẫn là bộ cũ**, chỉ đã sửa nhóm hàng và mã HTX. Giai đoạn 5 thay theo danh mục của nhóm.

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
| T19 | Chưa làm | Đánh giá làm ở Giai đoạn 4 |
| T20 | Đạt | `text.test.ts` |
| T21 | Đạt | `access.test.ts`, `flow.test.ts` |
| T22 | Đạt | `access.test.ts`, `payment.test.ts` |

Ngoài các ca trên còn có test cho:
- đặt lặp với cùng khoá (BR-DAT-07), HTX không đặt được hàng (BR-DAT-01);
- giá tăng / giảm (BR-DAT-03), ngày giao D (BR-DAT-08);
- COD bị ẩn, hoả tốc sau 14:00, lời nhắn hộp quà;
- quá hạn xác nhận, trả phần còn lại và quá hạn PAR-24, tự chuyển Đã giao sau PAR-26, chuyển hoàn sau PAR-27;
- đối soát, số liệu tổng hợp.

## Chức năng Giai đoạn 4

Chưa bắt đầu. Bảng FR theo vai trò sẽ được điền khi làm Giai đoạn 4.

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
26. **Khách hàng đăng ký mới** bằng SĐT + OTP mô phỏng, chưa yêu cầu thêm thông tin nào khác. Thông tin cá nhân (TK-03) làm ở Giai đoạn 4.

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
| HTX mẫu Bắc Hà | 0900 000 101 | HTX (mận, mật ong) |
| HTX mẫu Mường Khương | 0900 000 102 | HTX (gạo) |
| HTX mẫu Sa Pa (thuỷ sản) | 0900 000 103 | HTX (cá hồi) |
| HTX mẫu Sa Pa (cây ăn quả) | 0900 000 104 | HTX (đào) |
| Admin – Vận hành (mẫu) | 0900 000 201 | Admin – Vận hành |
| Admin – Chất lượng (mẫu) | 0900 000 202 | Admin – Chất lượng |
| Admin – CSKH (mẫu) | 0900 000 203 | Admin – CSKH |
| Admin – Tài chính (mẫu) | 0900 000 204 | Admin – Tài chính |
| Quản trị gốc (mẫu) | 0900 000 209 | Quản trị gốc |
| Cơ quan QLNN (mẫu) | 0900 000 301 | Cơ quan QLNN (chỉ xem) |

- **Khôi phục dữ liệu mẫu:** bấm "Công cụ demo" ở góc phải thanh trên cùng, rồi bấm "Khôi phục dữ liệu mẫu". Thao tác này xoá dữ liệu trong `localStorage` (khoá `dac-san-so-lao-cai:data`), nạp lại dữ liệu mẫu và đưa đồng hồ demo về giờ thật.
