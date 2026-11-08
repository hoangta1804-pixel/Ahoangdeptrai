# Business rules observed

This document summarizes current code paths, not a claim of full production acceptance.

- **Identity and roles:** role comes from server-side account state; privileged commands are authorized on the backend. Customer, seller, admin groups, regulator and shipper have separate projections and actions.
- **Catalog:** only orderable products should be visible/accepted by checkout; product changes and quality workflows support review. Seed data is illustrative and must not be treated as verified nationwide inventory.
- **Cart and checkout:** server-side domain recalculates product price and remaining stock; cart quantities are bounded by availability. Checkout groups items by seller and order kind/delivery date, computes fees/discounts per group and enforces payment/shipping rules.
- **Multi-seller orders:** one checkout can create seller-specific child orders. Inventory, order transitions, payment and fulfillment are distinct concepts, but aggregate persistence is still shared JSON.
- **Payment:** transaction state is represented separately from order fulfillment. Webhook signatures, event idempotency and explicit gateway session configuration exist. A configured real merchant adapter has not been accepted here.
- **Seller and product governance:** seller applications and product changes use approval workflows; upload is not equivalent to certification verification.
- **Stock and lots:** inventory/harvest/lot operations and trace views exist. Domain aggregate does not provide relational stock constraints; concurrency safety depends on serialized backend mutations.
- **Refund/finance:** restricted finance actions, refund/payout records, reconciliation and financial integrity checks exist; external bank settlement remains an operational dependency.
- **Address/gifts:** recipient city is part of the address; editing must not infer or silently substitute Hanoi. The edit flow now requires the city explicitly.
- **External claims:** no blockchain or authority-verified certification claim is supported by the available code evidence.

Detailed domain rules and tests remain in `src/domain/` and `src/domain/__tests__/`.
