# Giả định và đề xuất mặc định (ĐX)

Mọi mục dưới đây đang chờ duyệt; không tự đổi thành “Đã chốt”. Ngày ghi: 07/11/2026.

| # | Giả định/đề xuất | Lý do an toàn | Người duyệt / hạn |
| --- | --- | --- | --- |
| 1 | Các tài liệu BRD mua hàng và Đặc tả UC BR-MHTT/AC-MHTT/MSG-MHTT chưa thấy; mọi chi tiết chỉ có mã dẫn chiếu được ghi “cần đối chiếu tài liệu gốc”. | Không suy diễn nghiệp vụ từ mã tham chiếu. | BA, trước C1 27/11/2026 |
| 2 | Bộ lọc tỉnh/vùng và chủ đề “Đặc sản vùng miền” là đề xuất giao diện; mặc định không ép một cách phân loại mới vào nghiệp vụ. | SRS mới bỏ giới hạn nguồn hàng nhưng chưa quy định cấu trúc danh mục tỉnh/vùng. | BA, sếp; C1 27/11/2026 |
| 3 | Hàng có sẵn vẫn được mô tả là hàng tại kho Hà Nội; nơi cung ứng có thể thuộc nhiều tỉnh. | Giữ BR-MN-07/10 và bối cảnh đã nêu, không tự tạo chặng vận chuyển mới. | Sếp, C1 27/11/2026 |
| 4 | FR-TKSP-14 chưa nâng Must. Phương án mặc định an toàn là ảnh thường làm dự phòng; chỉ dùng 360° nếu được duyệt và có nội dung thật. | 360° đang Should/Chờ duyệt, trong khi fallback bị mô tả thành bắt buộc. | BA, sếp; C1 27/11/2026 |
| 5 | Trạng thái D13–D15 ghi “Chốt cấp BA, chờ sếp xác nhận”; giữ nguyên trạng thái duyệt cuối là Chờ duyệt đến khi sếp quyết. | Mục 10 hiện nói cần xác nhận trước C1. | Sếp, C1 27/11/2026 |
| 6 | Giai đoạn Dev 07/12–18/12 làm logic, dữ liệu, API và token; hoàn thiện UI sau duyệt mẫu 18/12. | Khớp lịch hiện có nếu không dời C2; cần xác nhận kế hoạch. | Sếp, Dev; C1 27/11/2026 |
| 7 | Theme production đổi qua cấu hình triển khai, không có màn Admin đổi theme. | Đề xuất mặc định của prompt; tránh quyền chưa duyệt. | Sếp, C1 27/11/2026 |
| 8 | Màu trạng thái chỉ đi với chữ/biểu tượng, không thay màu nút chính. | Bảo đảm không chỉ truyền trạng thái qua màu. | BA, GK-A11Y; C1 27/11/2026 |
| 9 | Khi 3D lỗi/không hỗ trợ hoặc quá thời gian chờ, hiện ảnh đại diện/ảnh thường và thông báo có thể thử lại; thời gian chờ chưa chốt. | Fallback không chặn mua hàng; không có ngưỡng gốc trong SRS. | Dev, BA; C1 27/11/2026 |
| 10 | Món một quy cách đang Đặt trước được thêm thẳng vào giỏ Đặt trước; bảng chọn nhanh đổi nhãn nút thành “Đặt trước” và nêu tiền cọc. | Theo trạng thái BR-MN-03, giảm nhầm lẫn thanh toán. | BA, sếp; C1 27/11/2026 |
| 11 | Nếu mọi quy cách hết và không mở đặt trước, quy cách mặc định là quy cách đầu tiên theo thứ tự Admin và nút là “Hết hàng”. | Không chọn một quy cách không xác định. | BA; C1 27/11/2026 |
| 12 | “Xem tất cả” mở danh sách theo đúng chủ đề đang xem, giữ chủ đề/bộ lọc trong URL. | SRS yêu cầu màn này nhưng chưa mô tả đích điều hướng. | BA, UX; C1 27/11/2026 |
| 13 | Điểm ngắt 768px/1024px; lưới 2/3/4 cột; panel desktop 420–480px như prompt Stage 3. | Kích thước được đề xuất trong prompt, chưa phải quyết định duyệt. | Dev, UX; C1 27/11/2026 |
| 14 | “Máy yếu” tạm hiểu là thiết bị không hỗ trợ `backdrop-filter` hoặc bật chế độ tiết kiệm dữ liệu/giảm hiệu ứng do trình duyệt cung cấp; đo thêm trước C2. | Không có ngưỡng phần cứng đáng tin để tự đặt. | Dev; C2 18/12/2026 |
| 15 | Tệp iPhone cho 3D là tuỳ chọn trong đợt 2 nếu trải nghiệm web được xác nhận chỉ cần GLB; chưa đổi BR-PT-01 trước khi Dev xác nhận nền tảng và định dạng. | Tránh bỏ yêu cầu dữ liệu khi chưa xác minh hỗ trợ trình duyệt. | Dev, sếp; C1 27/11/2026 |
| 16 | Nội dung dùng font không chân hiện tại nếu kiểm đủ dấu; tiêu đề thêm một font có chân; không quá hai họ trên UI Phase 2. | Hoà giải hai yêu cầu mâu thuẫn ở mục 7. | Sếp/UX; C2 18/12/2026 |
| 17 | Sự kiện phân tích không gửi PII; gắn theme, loại thiết bị và mã sản phẩm/quy cách giả danh khi cần. | Đo so sánh nhưng không thu tên, số điện thoại, địa chỉ. | Dev/BA; C1 27/11/2026 |
| 18 | Phiên Mua ngay chỉ giữ qua chuyển tiếp OTP trong bộ nhớ an toàn; tải lại trang thì khôi phục từ mã phiên ngắn hạn hoặc yêu cầu chọn lại món, chưa chốt. | SRS chưa nêu vòng đời khi reload; cần không nhầm phiên với giỏ. | BA, Dev; C1 27/11/2026 |
| 19 | Danh mục phường/xã Hà Nội do nguồn dữ liệu địa giới hành chính do Dev/BA chọn, có ngày cập nhật; địa chỉ cũ không khớp cần khách chọn lại trước khi đặt. | BR-MN-06 yêu cầu danh mục hiện hành, chưa chỉ định nhà cung cấp và quy trình. | Dev, BA; C1 27/11/2026 |
| 20 | Hoàn tác dùng vùng `aria-live`; khi hết 5 giây chỉ ẩn thao tác Hoàn tác, không khoá sửa giỏ. | Theo BR-MN-11 và trợ năng. | BA, A11Y; C1 27/11/2026 |
| 21 | Sơ đồ ở mục 3 được vẽ lại bằng Mermaid từ văn bản, đánh dấu cần đối chiếu sơ đồ gốc. | Bản Markdown đã mất sơ đồ nhúng. | BA; C1 27/11/2026 |

