# Database design and current state

## Current implementation

`server/database.mjs` and `server/postgres-database.mjs` provide SQLite and PostgreSQL/Supabase providers. The main business snapshot is stored in one `app_state` row as encrypted JSON (AES-256-GCM when `DATA_ENCRYPTION_KEY` is configured). Mutations run transactionally; PostgreSQL serializes the shared aggregate with an advisory transaction lock. Supporting tables hold sessions, OTP challenges, credentials/account links, idempotency/feature records, audit, exports, rate limits and webhook events. Supabase migrations place backend tables in `app_private`, enable RLS and revoke browser `anon`/`authenticated` access.

The application does not yet use normalized relational tables as the source of truth for product, cart, order, payment, inventory, seller, ticket and certification records. Thus relational FK/check constraints cannot currently guarantee those entities' integrity.

## Target logical entities

Use the existing business concepts; migrate incrementally rather than creating parallel active stores: profiles/roles; administrative areas; sellers/documents/staff; categories/products/variants/images/certifications; inventory movements/batches; carts/items; parent orders/seller orders/items; payment attempts/refunds; shipments/events; reviews; traceability/QR; notifications; tickets/messages; audit events.

## Migration principles

- Assign stable IDs and preserve legacy JSON IDs during backfill.
- Add normalized tables and constraints first; backfill and compare counts/totals before switching reads or writes.
- Keep payment status separate from fulfillment status; enforce nonnegative stock and unique idempotency keys.
- Scope rows by customer, seller or staff permissions in server authorization and PostgreSQL RLS where direct access is allowed.
- Do not delete or overwrite the current aggregate until reconciliation, backup and rollback are verified.
- No production migration was run for this audit.

See `supabase/migrations/` and `docs/SUPABASE_SETUP.md` for concrete bootstrap schema and operational setup.
