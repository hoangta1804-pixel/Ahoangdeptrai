# Blocked and externally dependent features

| Feature | Current evidence | Dependency / acceptance needed |
|---|---|---|
| Production website parity | URL supplied but unavailable via current web reader | Browser access to deployed site and environment details |
| SMS/OTP delivery | Adapter/configuration seam exists | Real SMS provider credentials, sender approval and delivery tests |
| Email account recovery | Delivery adapter/configuration seam exists | Verified email delivery provider and domain |
| Google OAuth | Backend/frontend flow exists | Correct OAuth client, redirect configuration and real login acceptance |
| Online payment | Session/webhook architecture exists | Merchant account, gateway adapter credentials, sandbox and settlement acceptance |
| Supabase business persistence and private media | Postgres and storage setup documented | Project URL, DB/service credentials, migrations, storage policy acceptance |
| Carrier integration | Internal shipper and webhook paths exist | Selected carrier API agreement, credentials and callback verification |
| Push notification delivery | Web Push implementation exists | VAPID configuration, HTTPS and device acceptance |
| Official certification/trace data | Internal document and lot workflows exist | Trusted issuing authority/source and verification procedure |
| Nationwide geography and catalog | Seed/sample geography and products exist | Maintained authoritative datasets and verified seller/catalog onboarding |
| Production operations | Runbook/readiness checks exist | Persistent deployment, backup/restore drill, monitoring and load/security acceptance |

No fake integration or live transaction was used to remove these blockers.
