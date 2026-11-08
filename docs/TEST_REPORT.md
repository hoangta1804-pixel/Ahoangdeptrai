# Test report

Date: 2026-11-06. Test execution was requested in the supplied project brief.

| Check | Result |
|---|---|
| `npm.cmd run lint` (TypeScript no-emit) | Passed after correction |
| `npm.cmd test` (Vitest) | 36/36 files passed; 265/265 tests passed |
| `npm.cmd run test:backend` | 97/97 passed (SQLite, PostgreSQL/PGlite adapters, auth, access control, checkout, webhooks and related flows) |
| `npm.cmd run build` | Passed; Vite reports a main JavaScript chunk above 500 kB |
| `npm.cmd run e2e` | 31/31 browser scenarios passed after updating the catalog test to match immediate filter application |
| `npm.cmd run check:production` | Correctly reports not ready: required production secrets/adapters are missing; SQLite durability and deployment checks remain unverified |
| Live Supabase/provider acceptance | Not run; requires project credentials and external services |

The E2E test starts isolated local app instances and does not contact production services. Production deployment, provider delivery, live payment, and cloud storage permissions remain unverified.
