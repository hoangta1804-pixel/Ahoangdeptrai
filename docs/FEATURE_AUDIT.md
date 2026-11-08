# Feature audit

Audit date: 2026-11-06. Scope: repository source, existing SRS/coverage/setup docs, local type check and Vitest suite. The supplied production URL could not be read by the available web reader, so production behavior and deployed configuration remain unverified. No production credentials or live transactions were used.

## Architecture observed

- Frontend: React 19 + TypeScript + Vite. `src/app/AppShell.tsx` selects customer, cooperative seller, regulator, shipper and admin screens by authenticated role. UI modules are under `src/screens`; business rules are largely pure functions in `src/domain`; the shared store calls `/api/v1` and synchronizes with the backend.
- Backend: Node.js HTTP API in `server/app.mjs`, dispatched through `/api/v1` routes and command handlers in `server/commands.json` / `server/command-service.mjs`. Authentication, rate limits, idempotency, audit context, webhook validation, media and integrations have dedicated server modules.
- Persistence: SQLite or PostgreSQL/Supabase is selectable. The authoritative business state is currently a single encrypted JSON `app_state` aggregate, guarded by transactions/advisory lock; ancillary tables hold sessions, OTP, audit, rate limits and other service records. Relational migrations exist, but business workflows do not yet persist through normalized product/order tables.
- Data: `src/data/seed.ts` contains demo and illustrative records. Production initialization clears most arrays; `DEMO_MODE` controls demo state. Some local UI preferences remain in browser storage.
- Database/security: Supabase migrations create the private schema, enable RLS and revoke browser roles. Server APIs enforce role/ownership checks. Setup docs state that real SMS, OAuth, payment, storage and deployment verification need provider configuration and live acceptance.

## Audit findings

1. Large functional surface exists: account/auth, customer catalog/cart/checkout/orders/reviews/complaints/addresses/favorites, cooperative applications and seller workflows, admin/quality/finance/CSKH, regulator, shipper, traceability, notifications, exports, settlement and reconciliation.
2. Presence of UI/domain logic does not establish end-to-end production readiness. API and domain tests cover many flows, but external-provider acceptance and deployed environment could not be verified here.
3. Relational schema is ahead of the production domain persistence model: business data remains aggregate JSON. The code documents transaction safeguards, but database-level foreign keys and constraints do not protect individual business entities yet.
4. Address/gift recipient editing had an incorrect Hanoi fallback and no city field in the edit form. Fixed in this sprint; see implementation log.
5. Initial `npm run lint` passed. Baseline `npm test` had 2 failing cases (262 passed): two gift-recipient fixtures omitted the required city. Updated fixtures, added a regression case, and corrected the stale browser test expectation for immediate filtering. Final TypeScript, unit, backend, build and E2E results are recorded in [test report](TEST_REPORT.md).
6. The local production-readiness check reports missing encryption key, HTTPS URLs/origins, SMS, Web Push, payment-session and recovery-link adapters, and payment/refund webhook secrets; it also flags SQLite persistence/backup and deployment verification. No secret values were printed or changed.

## Limitations and next actions

- Compare the deployed site, environment, migration state and provider configuration in an authorized browser/cloud environment.
- Prioritize Sprint 1 production data boundaries, product discoverability/favorites, and customer profile/address integration; verify against a real configured database before claiming production readiness.
- Plan incremental migration from JSON aggregate to relational business tables with compatibility reads, backfill and rollback. Do not replace the aggregate or migrate live data without a reviewed migration plan.
- See [feature matrix](FEATURE_IMPLEMENTATION_MATRIX.md), [blocked features](BLOCKED_FEATURES.md), [database design](DATABASE_DESIGN.md), and [test report](TEST_REPORT.md).
