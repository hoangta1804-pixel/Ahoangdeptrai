-- Dán toàn bộ file này vào Supabase > SQL Editor > New query > Run.
-- Gộp từ supabase/migrations theo thứ tự. Chạy lại nhiều lần vẫn an toàn (IF NOT EXISTS).

-- ===================== migrations/202610270001_backend.sql =====================
-- Business data is accessible only through the Node backend. No browser access.
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS app_private.app_state (
  id integer PRIMARY KEY CHECK (id = 1), version bigint NOT NULL, data text NOT NULL
);
CREATE TABLE IF NOT EXISTS app_private.sessions (
  access_hash text PRIMARY KEY, refresh_hash text UNIQUE NOT NULL,
  user_id text NOT NULL, expires_at bigint NOT NULL, refresh_expires_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS app_private.revoked_tokens (token_hash text PRIMARY KEY, expires_at bigint NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON app_private.sessions(user_id);
CREATE TABLE IF NOT EXISTS app_private.otp_challenges (
  id text PRIMARY KEY, phone text NOT NULL, purpose text NOT NULL,
  code_hash text NOT NULL, expires_at bigint NOT NULL, attempts integer NOT NULL DEFAULT 0, created_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS otp_phone_idx ON app_private.otp_challenges(phone, created_at DESC);
CREATE TABLE IF NOT EXISTS app_private.receipts (
  user_id text NOT NULL, request_id text NOT NULL, fingerprint text NOT NULL,
  response text NOT NULL, created_at bigint NOT NULL, PRIMARY KEY(user_id, request_id)
);
CREATE TABLE IF NOT EXISTS app_private.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text, action text NOT NULL, target text, at text NOT NULL, detail text
);

CREATE TABLE IF NOT EXISTS app_private.export_jobs (
  id text PRIMARY KEY, user_id text NOT NULL, kind text NOT NULL, status text NOT NULL,
  filters text NOT NULL, data_as_of text NOT NULL, version bigint NOT NULL,
  filename text, content text, expires_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS exports_user_idx ON app_private.export_jobs(user_id, data_as_of DESC);
CREATE TABLE IF NOT EXISTS app_private.rate_limits (
  key text PRIMARY KEY, count integer NOT NULL, reset_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS app_private.webhook_events (
  provider text NOT NULL, event_id text NOT NULL, fingerprint text NOT NULL, created_at bigint NOT NULL,
  PRIMARY KEY(provider, event_id)
);

CREATE OR REPLACE FUNCTION app_private.audit_append_only() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN RAISE EXCEPTION 'Audit is append-only'; END;
$$;
DROP TRIGGER IF EXISTS audit_immutable ON app_private.audit_events;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON app_private.audit_events
FOR EACH ROW EXECUTE FUNCTION app_private.audit_append_only();

ALTER TABLE app_private.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.revoked_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app_private FROM PUBLIC;
-- Supabase roles exist in hosted projects; conditional so local PostgreSQL tests also work.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA app_private FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA app_private FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM authenticated;
  END IF;
END $$;

-- ===================== migrations/202610270002_storage.sql =====================
-- Private bucket: clients cannot list or overwrite other users' objects.
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('app-images', 'app-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false, file_size_limit=5242880,
  allowed_mime_types=ARRAY['image/jpeg', 'image/png', 'image/webp'];
-- No anon/authenticated policies are added. The Node backend authorizes each upload/read.

-- ===================== migrations/202610270003_password_credentials.sql =====================
CREATE TABLE IF NOT EXISTS app_private.password_credentials (user_id TEXT PRIMARY KEY,password_hash TEXT NOT NULL);
ALTER TABLE app_private.password_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.password_credentials FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON app_private.password_credentials FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON app_private.password_credentials FROM authenticated;
  END IF;
END $$;

-- ===================== migrations/202610280001_account_security.sql =====================
CREATE TABLE IF NOT EXISTS app_private.password_attempts (phone TEXT PRIMARY KEY, failures INTEGER NOT NULL, locked_until BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS app_private.account_links (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS app_private.feature_records (id TEXT PRIMARY KEY,kind TEXT NOT NULL,owner_id TEXT NOT NULL,data TEXT NOT NULL,expires_at BIGINT NOT NULL);
ALTER TABLE app_private.password_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.account_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.feature_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.feature_records FROM PUBLIC;
REVOKE ALL ON app_private.password_attempts,app_private.account_links FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON app_private.password_attempts,app_private.account_links FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON app_private.password_attempts,app_private.account_links FROM authenticated; END IF;
END $$;

-- ===================== migrations/202610280002_audit_trace.sql =====================
ALTER TABLE app_private.audit_events ADD COLUMN IF NOT EXISTS outcome TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE app_private.audit_events ADD COLUMN IF NOT EXISTS correlation_id TEXT;
CREATE INDEX IF NOT EXISTS audit_correlation ON app_private.audit_events(correlation_id);
CREATE INDEX IF NOT EXISTS audit_outcome ON app_private.audit_events(outcome,id);

-- ===================== migrations/202610290001_srs_followup.sql =====================
-- Lookup indexes for persistent export queue and SRS feature workflows.
-- No historical orders, ledger entries, accounts or audit events are rewritten.
CREATE INDEX IF NOT EXISTS exports_queue_idx ON app_private.export_jobs(status, data_as_of);
CREATE INDEX IF NOT EXISTS feature_kind_owner_idx ON app_private.feature_records(kind, owner_id);

-- ===================== migrations/202610300001_relational_schema.sql =====================
-- Lược đồ quan hệ cho dữ liệu nghiệp vụ, khớp src/domain/types.ts (DemoState).
-- Schema riêng app_data: trình duyệt không đọc/ghi trực tiếp, mọi thao tác đi qua backend Node như app_private.
-- Tiền: bigint VND. Thời điểm: timestamptz. Ngày (yyyy-mm-dd): date. Mã: text giữ nguyên mã đang dùng trong app.
CREATE SCHEMA IF NOT EXISTS app_data;
REVOKE ALL ON SCHEMA app_data FROM PUBLIC;

-- ==========================================
-- Cấu hình, danh mục dùng chung
-- ==========================================

-- Một dòng cho mỗi khối cấu hình: params, homepage, review_policy, settlement_policy, demo_access, clock_offset_ms.
CREATE TABLE IF NOT EXISTS app_data.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- Lịch sử sửa tham số (ParamChange). Đơn đã tạo giữ bản chốt riêng trong orders.params_snapshot.
CREATE TABLE IF NOT EXISTS app_data.param_changes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL,
  code text NOT NULL,
  changed_by text NOT NULL,
  changed_at timestamptz NOT NULL,
  old_value jsonb,
  new_value jsonb,
  reason text NOT NULL
);

-- Phường/xã giao hàng, không có cấp quận/huyện.
CREATE TABLE IF NOT EXISTS app_data.wards (
  id text PRIMARY KEY,
  name text NOT NULL,
  distance_km numeric(6,2) NOT NULL CHECK (distance_km >= 0)
);

CREATE TABLE IF NOT EXISTS app_data.catalog_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  goods_group text NOT NULL CHECK (goods_group IN ('dry','processed','fresh')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Từ điển vùng / đơn vị / loại chứng nhận do Admin quản lý.
CREATE TABLE IF NOT EXISTS app_data.catalog_dictionaries (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('region','unit','certification')),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS app_data.gift_box_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  fee bigint NOT NULL CHECK (fee >= 0),
  description text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS app_data.support_agents (
  id text PRIMARY KEY,
  name text NOT NULL
);

-- ==========================================
-- HTX, khách hàng, tài khoản
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.coops (
  id text PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL,
  representative text,
  description text,
  tax_code text,
  payout_account_masked text NOT NULL,
  phones text[] NOT NULL DEFAULT '{}',
  store_address text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  suspend_reason text,
  profile_status text NOT NULL DEFAULT 'approved' CHECK (profile_status IN ('approved','pending','rejected')),
  -- Hồ sơ HTX gửi chờ duyệt: {name, region, representative, description}.
  pending_profile jsonb,
  profile_reject_reason text
);

-- Hồ sơ đăng ký HTX mới (coopApplication.ts).
CREATE TABLE IF NOT EXISTS app_data.coop_applications (
  id text PRIMARY KEY,
  coop_name text NOT NULL,
  tax_code text,
  region text NOT NULL,
  address text NOT NULL,
  representative text NOT NULL,
  login_phone text NOT NULL,
  phones text[] NOT NULL DEFAULT '{}',
  payout_account_masked text NOT NULL,
  description text NOT NULL DEFAULT '',
  products text NOT NULL DEFAULT '',
  documents text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('submitted','reviewing','needs_info','approved','rejected')),
  -- {documents, region, contact, products}: boolean từng mục thẩm định.
  checks jsonb NOT NULL DEFAULT '{}',
  review_note text,
  history jsonb NOT NULL DEFAULT '[]',
  coop_id text REFERENCES app_data.coops(id),
  user_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

-- Tài khoản ngân hàng nhận hoàn tiền là dữ liệu nhạy cảm: backend mã hoá trước khi ghi (DATA_ENCRYPTION_KEY).
CREATE TABLE IF NOT EXISTS app_data.customers (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  refund_bank_name text,
  refund_bank_code text,
  refund_account_number_enc text,
  refund_account_holder text,
  refund_linked_at timestamptz,
  invoice_company_name text,
  invoice_tax_code text CHECK (invoice_tax_code IS NULL OR invoice_tax_code ~ '^\d{10}(-\d{3})?$'),
  invoice_address text,
  invoice_email text
);

CREATE TABLE IF NOT EXISTS app_data.user_accounts (
  id text PRIMARY KEY,
  phone text NOT NULL DEFAULT '',
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer','coop','admin','regulator','shipper')),
  admin_group text CHECK (admin_group IN ('operations','quality','cskh','finance','root')),
  customer_id text REFERENCES app_data.customers(id),
  coop_id text REFERENCES app_data.coops(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','locked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  phone_verified_at timestamptz,
  access_closed_at timestamptz,
  expires_at timestamptz,
  -- Liên kết Supabase Auth (auth.users.id). Quyền vẫn lấy từ bảng này, không từ user_metadata.
  supabase_id uuid UNIQUE,
  email_masked text,
  google_id_hash text UNIQUE,
  google_email_masked text,
  google_simulated boolean,
  CHECK (role <> 'admin' OR admin_group IS NOT NULL),
  CHECK (role <> 'customer' OR customer_id IS NOT NULL),
  CHECK (role <> 'coop' OR coop_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_phone_uq ON app_data.user_accounts(phone) WHERE phone <> '';

CREATE TABLE IF NOT EXISTS app_data.addresses (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  label text NOT NULL,
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  house_type text NOT NULL CHECK (house_type IN ('apartment','ground')),
  ward_id text NOT NULL REFERENCES app_data.wards(id),
  street text NOT NULL DEFAULT '',
  building text,
  unit text,
  is_default boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS addresses_customer_idx ON app_data.addresses(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default_uq ON app_data.addresses(customer_id) WHERE is_default;

-- ==========================================
-- Sản phẩm
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.products (
  id text PRIMARY KEY,
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  -- Quy cách thêm trỏ về sản phẩm gốc (variants.ts).
  variant_of text REFERENCES app_data.products(id),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('dry','processed','fresh')),
  catalog_category_id text REFERENCES app_data.catalog_categories(id),
  region text NOT NULL,
  unit text NOT NULL,
  price bigint NOT NULL CHECK (price >= 0),
  description text NOT NULL DEFAULT '',
  image text,
  images text[] NOT NULL DEFAULT '{}',
  kind text NOT NULL CHECK (kind IN ('ready','preorder')),
  stock_on_hand integer NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
  low_stock_threshold integer,
  express_approved boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN ('active','hidden','pending','rejected')),
  trace_url text,
  harvest_months smallint[] NOT NULL DEFAULT '{}',
  storage text,
  shelf_life_days integer,
  preparation_minutes integer,
  sold_count integer NOT NULL DEFAULT 0,
  -- Cấu hình đặt trước (PreorderConfig); chỉ có với kind = 'preorder'.
  preorder_total_slots integer,
  preorder_delivery_from date,
  preorder_delivery_to date,
  preorder_open boolean,
  -- Ghi chú dữ liệu mẫu (SampleInfo).
  sample jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind <> 'preorder' OR preorder_total_slots IS NOT NULL),
  CHECK (preorder_delivery_from IS NULL OR preorder_delivery_to >= preorder_delivery_from)
);
CREATE INDEX IF NOT EXISTS products_coop_idx ON app_data.products(coop_id);
CREATE INDEX IF NOT EXISTS products_storefront_idx ON app_data.products(status, category, region);
CREATE INDEX IF NOT EXISTS products_variant_idx ON app_data.products(variant_of);

CREATE TABLE IF NOT EXISTS app_data.product_certifications (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES app_data.products(id) ON DELETE CASCADE,
  label text NOT NULL,
  issuer text NOT NULL,
  number text,
  issued_on date,
  valid_until date NOT NULL,
  photo text,
  verified boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS certifications_product_idx ON app_data.product_certifications(product_id);

-- Yêu cầu thay đổi của HTX chờ Admin – Chất lượng duyệt.
CREATE TABLE IF NOT EXISTS app_data.product_change_requests (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES app_data.products(id),
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  type text NOT NULL CHECK (type IN ('new_product','content','price','preorder','express','cert')),
  new_price bigint,
  preorder jsonb,
  content jsonb,
  express boolean,
  cert jsonb,
  note text,
  status text NOT NULL CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL,
  decided_at timestamptz,
  decided_by text,
  reject_reason text
);
CREATE INDEX IF NOT EXISTS product_changes_queue_idx ON app_data.product_change_requests(status, created_at);

-- Lô hàng truy xuất (server/lots.mjs).
CREATE TABLE IF NOT EXISTS app_data.product_lots (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES app_data.products(id),
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  code text NOT NULL,
  harvested_on date NOT NULL,
  packed_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coop_id, code),
  CHECK (harvested_on <= packed_on)
);

-- Ngày đã gửi cảnh báo tồn thấp, tối đa 1 lần/ngày.
CREATE TABLE IF NOT EXISTS app_data.low_stock_alerts (
  product_id text PRIMARY KEY REFERENCES app_data.products(id) ON DELETE CASCADE,
  alerted_on date NOT NULL
);

-- ==========================================
-- Tương tác của khách: giỏ, yêu thích, theo dõi
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.cart_lines (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES app_data.products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  delivery_date date,
  seen_price bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS cart_lines_uq ON app_data.cart_lines(customer_id, product_id, COALESCE(delivery_date, '0001-01-01'::date));

-- product_id là mã nhóm quy cách (sản phẩm gốc).
CREATE TABLE IF NOT EXISTS app_data.favorites (
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES app_data.products(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS app_data.coop_follows (
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, coop_id)
);

-- "Báo tôi khi vào mùa" và đợt đã báo (để không báo lặp).
CREATE TABLE IF NOT EXISTS app_data.season_watches (
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES app_data.products(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_alerted_window text,
  PRIMARY KEY (customer_id, product_id)
);

-- ==========================================
-- Voucher
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.vouchers (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('fixed','percent')),
  value bigint NOT NULL CHECK (value > 0),
  max_discount bigint,
  min_spend bigint NOT NULL DEFAULT 0,
  -- Phạm vi áp dụng; mảng rỗng = mọi sản phẩm.
  product_ids text[] NOT NULL DEFAULT '{}',
  categories text[] NOT NULL DEFAULT '{}',
  coop_ids text[] NOT NULL DEFAULT '{}',
  starts_at timestamptz,
  expires_at timestamptz NOT NULL,
  usage_limit integer NOT NULL CHECK (usage_limit >= 0),
  first_order_only boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  CHECK (kind <> 'percent' OR value <= 100)
);

-- Kho voucher khách đã lưu.
CREATE TABLE IF NOT EXISTS app_data.saved_vouchers (
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  voucher_id text NOT NULL REFERENCES app_data.vouchers(id),
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, voucher_id)
);

-- ==========================================
-- Đặt hàng, đơn
-- ==========================================

-- Một lần bấm Đặt hàng: có thể tách thành nhiều đơn (mỗi HTX một đơn).
CREATE TABLE IF NOT EXISTS app_data.checkouts (
  id text PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  transaction_id text,
  voucher_id text REFERENCES app_data.vouchers(id),
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS app_data.orders (
  id text PRIMARY KEY,
  checkout_id text NOT NULL REFERENCES app_data.checkouts(id),
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  coop_name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('ready','preorder')),
  status text NOT NULL CHECK (status IN ('awaiting_payment','awaiting_confirmation','confirmed','awaiting_harvest','preparing','shipping','delivered','return_refund','returning','returned','cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('online','cod')),
  payment_status text NOT NULL CHECK (payment_status IN ('cod_unpaid','awaiting_payment','paid','deposit_paid','refund_pending','refunding','refunded')),
  shipping text NOT NULL CHECK (shipping IN ('standard','express')),
  delivery_date date,
  delivery_date_changed boolean NOT NULL DEFAULT false,
  -- Giá chốt lúc đặt (OrderPricing).
  items_total bigint NOT NULL,
  discount bigint NOT NULL DEFAULT 0,
  shipping_fee bigint NOT NULL DEFAULT 0,
  express_surcharge bigint NOT NULL DEFAULT 0,
  gift_box_fee bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL,
  deposit bigint NOT NULL DEFAULT 0,
  remaining bigint NOT NULL DEFAULT 0,
  pay_now_online bigint NOT NULL DEFAULT 0,
  pay_on_delivery bigint NOT NULL DEFAULT 0,
  -- Địa chỉ chốt vào đơn (AddressSnapshot); khách sửa sổ địa chỉ sau đó không ảnh hưởng.
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  address_text text NOT NULL,
  ward_name text NOT NULL,
  distance_km numeric(6,2) NOT NULL,
  note text NOT NULL DEFAULT '',
  gift jsonb,
  invoice jsonb,
  voucher_code text,
  params_snapshot jsonb NOT NULL,
  cancel_policy text,
  created_at timestamptz NOT NULL,
  confirm_deadline timestamptz,
  amount_paid_online bigint NOT NULL DEFAULT 0,
  cod_collected bigint NOT NULL DEFAULT 0,
  ready_reported_at timestamptz,
  remaining_due_at timestamptz,
  remaining_method_changed boolean NOT NULL DEFAULT false,
  delivery_attempts integer NOT NULL DEFAULT 0,
  carrier_delivered_at timestamptz,
  delivered_at timestamptz,
  -- {reason, at, status, rejectReason}
  cancel_request jsonb,
  cancel_reason text,
  chat_read_customer_at timestamptz,
  chat_read_coop_at timestamptz,
  -- Điểm nhận hàng Vận hành nhập: {name, address, contactName, contactPhone, note, updatedAt, updatedBy}
  pickup_point jsonb,
  -- {reference, at, sessionId}
  reconciled_cod jsonb,
  CHECK (total = items_total - discount + shipping_fee + express_surcharge + gift_box_fee),
  CHECK (kind <> 'preorder' OR delivery_date IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON app_data.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_coop_idx ON app_data.orders(coop_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_checkout_idx ON app_data.orders(checkout_id);

CREATE TABLE IF NOT EXISTS app_data.order_items (
  order_id text NOT NULL REFERENCES app_data.orders(id) ON DELETE CASCADE,
  line_no smallint NOT NULL,
  product_id text NOT NULL REFERENCES app_data.products(id),
  name text NOT NULL,
  unit text NOT NULL,
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  category text NOT NULL CHECK (category IN ('dry','processed','fresh')),
  -- Lần thu hoạch đã chia hàng cho dòng này (đơn đặt trước).
  harvest_id text,
  PRIMARY KEY (order_id, line_no)
);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON app_data.order_items(product_id);

-- Lịch sử trạng thái đơn; chỉ thêm.
CREATE TABLE IF NOT EXISTS app_data.order_status_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id text NOT NULL REFERENCES app_data.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  at timestamptz NOT NULL,
  actor_kind text NOT NULL,
  actor_id text,
  actor_name text,
  reason text
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON app_data.order_status_history(order_id, at);

CREATE TABLE IF NOT EXISTS app_data.order_delivery_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id text NOT NULL REFERENCES app_data.orders(id) ON DELETE CASCADE,
  at timestamptz NOT NULL,
  event text NOT NULL CHECK (event IN ('assigned','picked_up','delivered_reported','failed','refused')),
  reason text,
  reported_by text
);
CREATE INDEX IF NOT EXISTS order_delivery_events_order_idx ON app_data.order_delivery_events(order_id, at);

-- Phiếu nộp tiền thu hộ của shipper.
CREATE TABLE IF NOT EXISTS app_data.cod_remittances (
  id text PRIMARY KEY,
  shipper_id text NOT NULL REFERENCES app_data.user_accounts(id),
  shipper_name text NOT NULL,
  amount bigint NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('submitted','confirmed')),
  created_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  confirmed_by text
);

-- Phân công shipper: tối đa một lượt phân công hiện hành cho mỗi đơn.
CREATE TABLE IF NOT EXISTS app_data.shipments (
  order_id text PRIMARY KEY REFERENCES app_data.orders(id) ON DELETE CASCADE,
  shipper_id text NOT NULL REFERENCES app_data.user_accounts(id),
  shipper_name text NOT NULL,
  assigned_at timestamptz NOT NULL,
  assigned_by text NOT NULL,
  pickup_note text,
  picked_up_at timestamptz,
  proof_photos text[] NOT NULL DEFAULT '{}',
  delivered_note text,
  cod_held bigint,
  remittance_id text REFERENCES app_data.cod_remittances(id)
);
CREATE INDEX IF NOT EXISTS shipments_shipper_idx ON app_data.shipments(shipper_id);

-- Lần HTX xác nhận thu hoạch xong một sản phẩm đặt trước.
CREATE TABLE IF NOT EXISTS app_data.harvest_records (
  id text PRIMARY KEY,
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  product_id text NOT NULL REFERENCES app_data.products(id),
  product_name text NOT NULL,
  unit text NOT NULL,
  harvested_on date NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  note text NOT NULL DEFAULT '',
  photos text[] NOT NULL DEFAULT '{}',
  confirmed_at timestamptz NOT NULL,
  confirmed_by text NOT NULL
);
ALTER TABLE app_data.order_items DROP CONSTRAINT IF EXISTS order_items_harvest_fk;
ALTER TABLE app_data.order_items ADD CONSTRAINT order_items_harvest_fk FOREIGN KEY (harvest_id) REFERENCES app_data.harvest_records(id);

-- ==========================================
-- Thanh toán, hoàn tiền
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.transactions (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('checkout','remaining')),
  checkout_id text REFERENCES app_data.checkouts(id),
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  amount bigint NOT NULL CHECK (amount >= 0),
  status text NOT NULL CHECK (status IN ('pending','paid','failed','expired','cancelled')),
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  -- Mã tham chiếu cổng đã xử lý, để callback lặp không ghi hai lần.
  processed_refs text[] NOT NULL DEFAULT '{}',
  paid_ref text,
  reminded_at timestamptz
);
CREATE INDEX IF NOT EXISTS transactions_pending_idx ON app_data.transactions(status, expires_at);
ALTER TABLE app_data.checkouts DROP CONSTRAINT IF EXISTS checkouts_transaction_fk;
ALTER TABLE app_data.checkouts ADD CONSTRAINT checkouts_transaction_fk FOREIGN KEY (transaction_id) REFERENCES app_data.transactions(id) DEFERRABLE INITIALLY DEFERRED;

-- Số tiền từng đơn trong một giao dịch gộp.
CREATE TABLE IF NOT EXISTS app_data.transaction_orders (
  transaction_id text NOT NULL REFERENCES app_data.transactions(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES app_data.orders(id),
  amount bigint NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (transaction_id, order_id)
);

CREATE TABLE IF NOT EXISTS app_data.voucher_usages (
  id text PRIMARY KEY,
  voucher_id text NOT NULL REFERENCES app_data.vouchers(id),
  checkout_id text NOT NULL REFERENCES app_data.checkouts(id),
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  order_ids text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('held','used','released'))
);
CREATE INDEX IF NOT EXISTS voucher_usages_voucher_idx ON app_data.voucher_usages(voucher_id, status);

CREATE TABLE IF NOT EXISTS app_data.refunds (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES app_data.orders(id),
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  amount bigint NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('refund_pending','refunding','refunded')),
  source text NOT NULL CHECK (source IN ('cancel','late_payment','duplicate_payment','return')),
  reason text NOT NULL,
  destination text NOT NULL CHECK (destination IN ('original_source','bank_account')),
  created_at timestamptz NOT NULL,
  bank_ref text,
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS refunds_queue_idx ON app_data.refunds(status, created_at);

-- Chứng từ hoàn tiền thủ công Tài chính đã kiểm tra (server/manual-refunds.mjs).
CREATE TABLE IF NOT EXISTS app_data.manual_refund_proofs (
  refund_id text PRIMARY KEY REFERENCES app_data.refunds(id),
  reference text NOT NULL UNIQUE,
  amount bigint NOT NULL,
  note text NOT NULL,
  recipient_last4 text NOT NULL,
  recorded_by text NOT NULL,
  recorded_at timestamptz NOT NULL
);

-- ==========================================
-- Trao đổi khách – HTX
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.order_messages (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES app_data.orders(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer','coop')),
  sender_name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('text','call')),
  text text NOT NULL DEFAULT '',
  photos text[] NOT NULL DEFAULT '{}',
  call_outcome text CHECK (call_outcome IN ('scheduled','callback','no_answer')),
  at timestamptz NOT NULL,
  CHECK (kind <> 'call' OR call_outcome IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS order_messages_order_idx ON app_data.order_messages(order_id, at);

CREATE TABLE IF NOT EXISTS app_data.direct_messages (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  sender text NOT NULL CHECK (sender IN ('customer','coop')),
  sender_name text NOT NULL,
  text text NOT NULL DEFAULT '',
  photos text[] NOT NULL DEFAULT '{}',
  product_id text REFERENCES app_data.products(id),
  product_label text,
  at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS direct_messages_thread_idx ON app_data.direct_messages(customer_id, coop_id, at);

-- Lần cuối mỗi bên mở cuộc trò chuyện chung, để đếm tin chưa đọc.
CREATE TABLE IF NOT EXISTS app_data.chat_reads (
  customer_id text NOT NULL REFERENCES app_data.customers(id) ON DELETE CASCADE,
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  customer_read_at timestamptz,
  coop_read_at timestamptz,
  PRIMARY KEY (customer_id, coop_id)
);

-- ==========================================
-- Khiếu nại, đánh giá
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.tickets (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES app_data.orders(id),
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  product_ids text[] NOT NULL DEFAULT '{}',
  reason text NOT NULL CHECK (reason IN ('damaged','wrong_item','expired','foreign_object','qr_abnormal','health','changed_mind','order_question','late_delivery','cancel_request','other')),
  description text NOT NULL,
  photos text[] NOT NULL DEFAULT '{}',
  request_refund boolean NOT NULL DEFAULT false,
  coop_proposal text CHECK (coop_proposal IN ('refund','no_refund')),
  priority text NOT NULL CHECK (priority IN ('normal','high')),
  status text NOT NULL CHECK (status IN ('open','processing','resolved','rejected','closed')),
  assigned_user_id text REFERENCES app_data.user_accounts(id),
  resolution text CHECK (resolution IN ('check','refund','exchange','resupply')),
  -- {kind, status, tracking, updatedAt}
  fulfillment jsonb,
  created_at timestamptz NOT NULL,
  ack_due_at timestamptz NOT NULL,
  resolve_due_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS tickets_queue_idx ON app_data.tickets(status, priority, resolve_due_at);
CREATE INDEX IF NOT EXISTS tickets_order_idx ON app_data.tickets(order_id);

CREATE TABLE IF NOT EXISTS app_data.ticket_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES app_data.tickets(id) ON DELETE CASCADE,
  at timestamptz NOT NULL,
  actor_kind text NOT NULL,
  actor_id text,
  actor_name text,
  action text NOT NULL,
  note text,
  kind text CHECK (kind IN ('submit','accept','coop_reply','request_coop','conclude','close')),
  to_status text,
  refund_approved boolean
);
CREATE INDEX IF NOT EXISTS ticket_events_ticket_idx ON app_data.ticket_events(ticket_id, at);

-- Đánh giá sản phẩm.
CREATE TABLE IF NOT EXISTS app_data.reviews (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES app_data.orders(id),
  product_id text NOT NULL REFERENCES app_data.products(id),
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('visible','hidden','pending','rejected')),
  hidden_reason text,
  flagged boolean NOT NULL DEFAULT false,
  coop_reply text,
  created_at timestamptz NOT NULL,
  UNIQUE (order_id, product_id)
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON app_data.reviews(product_id, status);

-- Đánh giá HTX (server/coop-reviews.mjs): mỗi đơn Đã giao một lần.
CREATE TABLE IF NOT EXISTS app_data.coop_reviews (
  id text PRIMARY KEY,
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  customer_id text NOT NULL REFERENCES app_data.customers(id),
  order_id text NOT NULL UNIQUE REFERENCES app_data.orders(id),
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('visible','hidden','pending','rejected')),
  coop_reply text,
  created_at timestamptz NOT NULL,
  CHECK (stars > 2 OR char_length(comment) >= 20)
);
CREATE INDEX IF NOT EXISTS coop_reviews_coop_idx ON app_data.coop_reviews(coop_id, status);

-- ==========================================
-- Đối soát, sổ giao dịch
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.payout_periods (
  id text PRIMARY KEY,
  coop_id text NOT NULL REFERENCES app_data.coops(id),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('closed','paid')),
  retained bigint NOT NULL,
  commission bigint NOT NULL,
  payout bigint NOT NULL,
  reserve_amount bigint,
  reserve_until timestamptz,
  payout_fee bigint,
  -- Bản chốt SettlementPolicy áp dụng cho kỳ.
  policy jsonb,
  closed_at timestamptz NOT NULL,
  closed_by text NOT NULL,
  paid_at timestamptz,
  paid_ref text,
  UNIQUE (coop_id, period_start),
  CHECK (period_end > period_start)
);

CREATE TABLE IF NOT EXISTS app_data.settlement_lines (
  period_id text NOT NULL REFERENCES app_data.payout_periods(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES app_data.orders(id),
  delivered_at timestamptz NOT NULL,
  goods bigint NOT NULL,
  shipping_fee bigint,
  refunded bigint NOT NULL,
  retained bigint NOT NULL,
  commission bigint NOT NULL,
  payout bigint NOT NULL,
  PRIMARY KEY (period_id, order_id)
);
-- Một đơn chỉ đối soát trong một kỳ.
CREATE UNIQUE INDEX IF NOT EXISTS settlement_lines_order_uq ON app_data.settlement_lines(order_id);

-- Các lần chi trả (có thể chia nhiều đợt) của một kỳ.
CREATE TABLE IF NOT EXISTS app_data.payout_disbursements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  period_id text NOT NULL REFERENCES app_data.payout_periods(id),
  amount bigint NOT NULL CHECK (amount > 0),
  reference text NOT NULL UNIQUE,
  at timestamptz NOT NULL,
  recorded_by text NOT NULL,
  note text NOT NULL DEFAULT ''
);

-- Sổ giao dịch: chỉ thêm, không sửa, không xoá.
CREATE TABLE IF NOT EXISTS app_data.ledger_entries (
  id text PRIMARY KEY,
  at timestamptz NOT NULL,
  type text NOT NULL CHECK (type IN ('payment_in','cod_in','refund_out','payout_out','commission','payout_fee','reconciliation_adjustment')),
  amount bigint NOT NULL,
  order_id text REFERENCES app_data.orders(id),
  coop_id text REFERENCES app_data.coops(id),
  ref_id text,
  note text
);
CREATE INDEX IF NOT EXISTS ledger_entries_at_idx ON app_data.ledger_entries(at);
CREATE INDEX IF NOT EXISTS ledger_entries_coop_idx ON app_data.ledger_entries(coop_id, at);

-- ==========================================
-- Thông báo, tài khoản, nhật ký nghiệp vụ
-- ==========================================

CREATE TABLE IF NOT EXISTS app_data.notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES app_data.user_accounts(id) ON DELETE CASCADE,
  at timestamptz NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link_type text CHECK (link_type IN ('order','ticket','product','chat')),
  link_id text,
  read boolean NOT NULL DEFAULT false,
  CHECK ((link_type IS NULL) = (link_id IS NULL))
);
CREATE INDEX IF NOT EXISTS notifications_inbox_idx ON app_data.notifications(user_id, read, at DESC);

CREATE TABLE IF NOT EXISTS app_data.account_deletion_requests (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES app_data.user_accounts(id),
  status text NOT NULL CHECK (status IN ('pending','needs_information','retention_review','rejected','withdrawn','access_closed')),
  reason text NOT NULL,
  history jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS deletion_requests_open_uq ON app_data.account_deletion_requests(user_id)
  WHERE status IN ('pending','needs_information','retention_review');

-- Nhật ký nghiệp vụ hiển thị trong màn Admin (AuditLog). Nhật ký bảo mật vẫn ở app_private.audit_events.
CREATE TABLE IF NOT EXISTS app_data.audit_logs (
  id text PRIMARY KEY,
  at timestamptz NOT NULL,
  actor_kind text NOT NULL,
  actor_id text,
  actor_name text,
  action text NOT NULL,
  target text NOT NULL,
  detail text
);
CREATE INDEX IF NOT EXISTS audit_logs_at_idx ON app_data.audit_logs(at DESC);

CREATE OR REPLACE FUNCTION app_data.append_only() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN RAISE EXCEPTION '% chỉ được thêm, không sửa/xoá', TG_TABLE_NAME; END;
$$;
DROP TRIGGER IF EXISTS ledger_append_only ON app_data.ledger_entries;
CREATE TRIGGER ledger_append_only BEFORE UPDATE OR DELETE ON app_data.ledger_entries
FOR EACH ROW EXECUTE FUNCTION app_data.append_only();
DROP TRIGGER IF EXISTS audit_logs_append_only ON app_data.audit_logs;
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON app_data.audit_logs
FOR EACH ROW EXECUTE FUNCTION app_data.append_only();

-- ==========================================
-- View cho trang mua hàng
-- ==========================================

-- Điểm đánh giá sản phẩm (chỉ đánh giá đang hiện).
CREATE OR REPLACE VIEW app_data.product_ratings WITH (security_invoker = true) AS
SELECT product_id, round(avg(stars)::numeric, 1) AS avg_stars, count(*) AS review_count
FROM app_data.reviews WHERE status = 'visible' GROUP BY product_id;

CREATE OR REPLACE VIEW app_data.coop_ratings WITH (security_invoker = true) AS
SELECT coop_id, round(avg(stars)::numeric, 1) AS avg_stars, count(*) AS review_count
FROM app_data.coop_reviews WHERE status = 'visible' GROUP BY coop_id;

-- Sản phẩm khách thấy được: đang bán và HTX không bị tạm khoá.
CREATE OR REPLACE VIEW app_data.storefront_products WITH (security_invoker = true) AS
SELECT p.*, c.name AS coop_name, r.avg_stars, COALESCE(r.review_count, 0) AS review_count
FROM app_data.products p
JOIN app_data.coops c ON c.id = p.coop_id AND c.status = 'active'
LEFT JOIN app_data.product_ratings r ON r.product_id = p.id
WHERE p.status = 'active';

-- ==========================================
-- Quyền: chỉ backend (kết nối PostgreSQL trực tiếp) truy cập
-- ==========================================

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'app_data' LOOP
    EXECUTE format('ALTER TABLE app_data.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA app_data FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app_data FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA app_data FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_data FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA app_data FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_data FROM authenticated;
  END IF;
END $$;
