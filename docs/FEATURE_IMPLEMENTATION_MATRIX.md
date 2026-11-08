# Feature implementation matrix

Status vocabulary: IMPLEMENTED, PARTIAL, UI_ONLY, MOCK_DATA, BROKEN, MISSING, BLOCKED. Classification is based on repository evidence; BLOCKED means real-provider/deployment acceptance is unavailable in this workspace. IMPLEMENTED describes the local code path, not live production acceptance.

| STT | Phân hệ | Chức năng | Hiện trạng code | Backend | Database | Bảo mật | Trạng thái | Hướng xử lý |
|---:|---|---|---|---|---|---|---|---|
| 1 | Customer | Đăng ký/đăng nhập/đăng xuất | UI + password/OTP/Google flows | API + domain | sessions/credentials + aggregate | token/role checks | PARTIAL | Verify providers and recovery end-to-end |
| 2 | Customer | Quên/đặt lại mật khẩu, xác minh | UI + password tools | account-link/SMS adapters | challenges/credentials | rate limits | BLOCKED | Configure and accept real delivery provider |
| 3 | Customer | Hồ sơ cá nhân/tài khoản | account screens and commands | API/domain | aggregate | ownership checks | PARTIAL | Verify profile persistence and session management |
| 4 | Customer | Địa chỉ nhận hàng | address book/forms | API/domain | aggregate | ownership checks | PARTIAL | Validate geographic coverage and address completeness |
| 5 | Customer | Catalog/product detail/search/filter | storefront, catalog, product details | catalog/state APIs | aggregate + illustrative seed | public read rules | PARTIAL | Audit deployed catalog and replace seed content |
| 6 | Customer | Favorites/follow/season watch | UI and domain commands | command API | aggregate | customer scoping | PARTIAL | Verify account sync and empty/error states |
| 7 | Customer | Cart/variant/stock | cart UI and domain rules | cart APIs/commands | aggregate | server-side stock/price checks | PARTIAL | Verify concurrent reservations and live data |
| 8 | Commerce | Checkout, multi-seller split, order history | checkout/order flows | API + domain | aggregate, transactional | auth/idempotency/stock validation | PARTIAL | Validate live DB concurrency and payment lifecycle |
| 9 | Commerce | Online payment | payment sheet/session/webhook code | adapter/webhook endpoints | payment records in aggregate + webhook events | signature/idempotency checks | BLOCKED | Configure gateway; perform sandbox/live merchant acceptance |
| 10 | Customer | Reviews and seller ratings | review UI/domain | API commands | aggregate | policy checks | PARTIAL | Verify purchase eligibility/moderation end-to-end |
| 11 | Customer | Complaints/support/order chat | screens/domain | API/commands | aggregate | role/order scoping | PARTIAL | Verify outbound notifications and attachments on provider |
| 12 | Seller | Seller application and approval | apply/status/admin screens | API/domain | aggregate + uploaded media | approval separation | PARTIAL | Verify documents and private storage in deployed environment |
| 13 | Seller | Shop profile, staff, contact | coop screens/domain | API/commands | aggregate | seller scope varies by command | PARTIAL | Audit each staff permission and cross-seller boundary |
| 14 | Seller | Product CRUD/moderation/variants | forms/tabs/domain | API/commands | aggregate + product locks | quality role checks | PARTIAL | Verify review workflow and persistent media |
| 15 | Seller | Inventory, lots, expiry | inventory/harvest/lot UI + rules | commands/API | aggregate | seller ownership checks | PARTIAL | Add relational stock ledger before production scale |
| 16 | Seller | Order processing/reports | coop tabs/domain | API/commands | aggregate | seller-scoped projections | PARTIAL | Validate seller isolation and report reconciliation |
| 17 | Admin | Accounts/coops/catalog/geography/content | admin screens | APIs/commands | aggregate | admin group authorization | PARTIAL | Verify every privileged command and deployed role mapping |
| 18 | Admin/Finance | Refunds, payouts, settlement, reconciliation | finance screens/domain | APIs/webhooks | aggregate + audit | restricted roles and integrity checks | PARTIAL | Real bank reconciliation and controlled financial acceptance |
| 19 | Operations | Notifications/web push | notification UI/service | API + web-push module | aggregate/subscription data | user scoping | BLOCKED | Configure VAPID and test on real devices |
| 20 | Operations | Shipping/carrier | shipper screens/internal workflow | API + carrier webhook seam | aggregate/webhook events | assignment and signature checks | PARTIAL | External carrier adapter is not configured |
| 21 | Operations | QR/traceability/certificates | lot trace UI and quality workflows | APIs/domain | aggregate | public projection + review roles | PARTIAL | No authority-backed certification source verified |
| 22 | Platform | Storage/media | upload and signed URL flow | server/Supabase storage adapter | references in aggregate | ownership and private bucket design | BLOCKED | Configure Supabase Storage and verify deployed permissions |
| 23 | Platform | Data model | migrations and aggregate persistence | SQLite/Postgres repositories | encrypted `app_state` + service tables | encryption/RLS design | PARTIAL | Migrate domain data incrementally to relational tables |
| 24 | Platform | Production operational readiness | readiness checks/runbook | health/readiness endpoints | SQLite or Supabase | config checks | BLOCKED | Verify deployment secrets, backups, restore and provider acceptance |
