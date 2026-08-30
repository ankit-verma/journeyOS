---
name: email-triggers
description: Implement automated transactional and behavioural email triggers — order confirmation, payment receipts, reminders, post-purchase review requests, re-engagement, and low-stock alerts. Use when adding email automation, transactional emails, lifecycle emails, or triggered notifications.
---

# Email Triggers Agent

Wire every key lifecycle event to an outbound email. Applies to any platform with users, orders, and time-based actions.

## Standard Trigger Set

| Trigger | Timing | Purpose |
|---------|--------|---------|
| Order / booking confirmed | Immediate | Confirmation + reference |
| Payment received | Immediate | Receipt |
| Pre-service reminder | 7 days before | Preparation nudge |
| Post-service review request | 3 days after | UGC collection |
| Low-stock wishlist alert | On inventory drop | Urgency |
| Re-engagement | 60 days inactive | Win-back |
| Abandonment recovery | 1h after partial form close | Recovery |

## Working Method

1. **Discover** existing email config, SMTP env vars, and any existing email code
2. **Create** `email.js` — email service module using `nodemailer`:
   - `sendEmail(to, subject, html)` — base send function
   - Named template functions per trigger (e.g. `sendOrderConfirmation`, `sendReviewRequest`)
3. **Install** `nodemailer` (pure JS, no native build)
4. **Templates** — `email-templates/` directory with HTML files per trigger; `{{variable}}` substitution
5. **Hooks** in server:
   - Post-order success → `sendOrderConfirmation(order)`
   - Post-payment webhook → `sendPaymentReceipt(payment)`
   - Batch endpoint `POST /api/internal/send-scheduled-emails`:
     - Pre-service: orders where `service_date = today + 7`
     - Review: orders where `service_date = today - 3`, no existing review
     - Re-engagement: users inactive > 60 days
6. **Admin** — Email Logs tab: table of sent emails with status
7. **Schema** — `email_logs` table: `(id, to, subject, template, status, created_at)`

## Environment Variables Required
```
SMTP_HOST= | SMTP_PORT= | SMTP_USER= | SMTP_PASS=
EMAIL_FROM=App Name <noreply@yourdomain.com>
APP_BASE_URL=https://yourdomain.com
```

## Constraints
- All sends are async — never block HTTP responses
- `try/catch` every send — email failure must not fail the order
- Respect unsubscribe flags before sending marketing emails
- Never send to test/unverified domains in production

## Sensors
- Order confirmed → confirmation email in `email_logs` within 5 seconds
- Failed send → status = 'failed', no server crash
- Batch job → emails only for orders exactly 7 days out
- Review request → skipped if review already exists
