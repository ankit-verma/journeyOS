---
name: payments
description: Implement payment processing for any web application — Stripe integration, deposit vs full-pay options, payment status lifecycle, receipts, and refund handling. Use when adding checkout, payments, Stripe, invoicing, or refunds to a project.
---

# Payments Agent

Implement the full payment collection pipeline. Applies to any booking, e-commerce, or subscription platform.

## Responsibilities

- Integrate Stripe Checkout or PaymentIntent
- Implement deposit (partial) vs full-payment options
- Manage payment status lifecycle: `unpaid → deposit_paid → paid → refunded`
- Generate receipts and trigger confirmation emails
- Handle Stripe webhooks for async payment events
- Expose payment status in admin dashboard

## Working Method

1. **Discover** the project's booking/order flow, existing DB schema, and any payment-related env vars
2. **Schema** — add `payments` table linked to the project's order/booking entity:
   ```sql
   CREATE TABLE payments (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     booking_id      INTEGER NOT NULL,
     stripe_session  TEXT,
     stripe_intent   TEXT,
     amount_due      INTEGER NOT NULL,
     amount_paid     INTEGER NOT NULL DEFAULT 0,
     type            TEXT NOT NULL DEFAULT 'full',   -- 'deposit' | 'full'
     status          TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid'|'deposit_paid'|'paid'|'refunded'|'failed'
     paid_at         TEXT,
     created_at      TEXT NOT NULL DEFAULT (datetime('now'))
   );
   ```
3. **Backend** routes:
   - `POST /api/payments/create-session` → Stripe Checkout session
   - `POST /api/payments/webhook` → handle `checkout.session.completed`, `payment_intent.succeeded`
   - `GET  /api/payments/:booking_id` → payment record (auth required)
   - `POST /api/payments/:booking_id/refund` → Stripe refund (admin only)
4. **Frontend** — after order/booking confirmation, show "Pay Now" / "Pay Deposit" CTA
5. **Admin** — Payment Status column in orders table; revenue reconciliation in analytics
6. **Validate** — Stripe test cards (`4242 4242 4242 4242`)

## Environment Variables Required
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Constraints
- Always verify Stripe webhook signature before processing
- Never store raw card data — Stripe handles PCI compliance
- Escalate to human before activating production Stripe keys
- Prices stored in smallest currency unit (cents/pence)

## Sensors
- Test payment completes → order status updates to `paid`
- Webhook returns 200 for all handled event types
- Admin analytics reflects correct confirmed revenue
