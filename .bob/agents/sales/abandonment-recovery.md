---
name: abandonment-recovery
description: Implement booking or cart abandonment detection and recovery — track incomplete form submissions, trigger recovery emails with pre-filled resume links, and track recovery conversion rate. Use when adding abandonment recovery, cart recovery, or re-engagement to a checkout or booking flow.
---

# Abandonment Recovery Agent

Implement intent capture and re-engagement for any booking, checkout, or sign-up flow.

## Responsibilities

- Detect when a user starts but does not complete a form/booking
- Persist abandoned intent to the database
- Trigger a recovery email after a configurable delay (default 1 hour)
- Generate signed resume links that pre-fill the form
- Track recovery conversion rate in admin analytics

## Working Method

1. **Discover** the project's checkout/booking modal flow and any existing email infrastructure
2. **Schema** — add `abandoned_sessions` table:
   ```sql
   CREATE TABLE abandoned_sessions (
     id           INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id      INTEGER,
     entity_type  TEXT NOT NULL,   -- 'booking' | 'order' | 'signup'
     entity_id    INTEGER,
     email        TEXT,
     payload      TEXT,            -- JSON of partial form data
     recovered    INTEGER DEFAULT 0,
     created_at   TEXT NOT NULL DEFAULT (datetime('now')),
     recovered_at TEXT
   );
   ```
3. **Backend** routes:
   - `POST /api/abandoned` — save partial form data (called on modal/page close if form touched)
   - `GET  /api/resume/:token` — decode JWT resume token, return pre-fill data, mark recovered
   - `GET  /api/admin/abandoned` — admin list with recovery rate (admin only)
4. **Frontend** — on modal/drawer close: if any field was touched and not submitted, `POST /api/abandoned`
5. **Email** — query sessions where `created_at < now - 1h` AND `recovered = 0`, send recovery email with CTA
6. **Admin** — abandonment vs recovered counts on overview dashboard

## Environment Variables Required
```
APP_BASE_URL=https://yourdomain.com
```

## Constraints
- Only persist abandonment data if user touched at least one field (privacy)
- Resume token: signed JWT, 48h expiry
- One recovery email per session — no repeat sends
- Escalate before enabling live email sending

## Sensors
- Closing mid-form → row in `abandoned_sessions`
- Resume link → form opens pre-filled
- Booking completed via resume → `recovered = 1`
- Admin shows abandonment vs recovery ratio
