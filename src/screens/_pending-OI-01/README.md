# Vai trò tạm ẩn – chờ OI-01

SRS chưa chốt ai cập nhật trạng thái giao hàng (OI-01). Theo mục 5.5 của yêu cầu sửa app:

- Hai vai trò **Giao vận (Shipper)** và **Điều phối Ops** bị ẩn khỏi app.
- `ShipperScreen.tsx` giữ code Shipper chuyển từ `src/App.tsx` cũ. File này không được import ở đâu.
- Màn Điều phối Ops chỉ có ở bản cũ `legacy/index-babel.html` (tìm `currentRole === 'ops'`). Code đó chưa chuyển sang TypeScript.
- Trong lúc chờ, trạng thái giao hàng được cập nhật qua màn "Mô phỏng đơn vị vận chuyển" trong Admin – Vận hành.
