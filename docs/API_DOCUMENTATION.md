# API documentation (repository inventory)

Base path: `/api/v1`, implemented in `server/app.mjs`. JSON errors use HTTP status codes and backend authorization is applied before data mutation. Use `src/store/backend.ts` for the frontend request/session wrapper.

| Method/path | Purpose |
|---|---|
| GET `/api/health` | Health and configured service status |
| POST `/api/v1/auth/otp` | Request OTP challenge |
| POST `/api/v1/auth/login`, `/register` | OTP login/register |
| POST `/api/v1/auth/password/login`, `/register` | Password auth |
| POST `/api/v1/auth/google` | Google identity exchange |
| POST `/api/v1/auth/refresh`, `/logout` | Session lifecycle |
| GET `/api/v1/me` | Current authenticated account |
| GET `/api/v1/state` | Role-scoped state projection |
| GET `/api/v1/products`, `/api/v1/products/:id` | Product listing/detail |
| GET/POST `/api/v1/me/addresses`; PUT/DELETE `/api/v1/me/addresses/:id` | Owned addresses |
| GET `/api/v1/cart`; POST `/api/v1/cart/items`; PUT/DELETE `/api/v1/cart/items/:id` | Cart operations |
| POST `/api/v1/checkouts/plan`, `/api/v1/checkouts` | Preview and place checkout |
| GET `/api/v1/orders` | Role-scoped order list |
| POST `/api/v1/commands` and command paths | Domain mutations with idempotency key |
| GET `/api/v1/admin/users`, `/api/v1/audit` | Restricted admin views |
| GET `/api/v1/reports/dashboard` | Authorized dashboard projection |
| POST/GET `/api/v1/exports`; GET `/api/v1/exports/:id/download` | Export jobs and download |
| POST `/api/v1/webhooks/*` | Signed integration events |
| GET `/api/v1/lots/:id` | Public lot trace projection |
| GET `/api/geocode` | Configured geocoding adapter |

The command names and parameter contracts are defined in `server/commands.json`; workflows and permissions are implemented in `server/command-service.mjs`, `server/security.mjs` and domain modules. This inventory is not a generated OpenAPI contract. Provider credentials, production URLs and webhook secrets are not documented here.
