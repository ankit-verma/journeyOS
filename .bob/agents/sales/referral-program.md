---
name: referral-program
description: Implement a viral referral program for any platform — unique invite links per user, referee tracking, credit or discount rewards for both sides, and referral analytics. Use when adding referrals, invite links, affiliate tracking, or word-of-mouth growth mechanics.
---

# Referral Program Agent

Build a viral growth loop: user shares → friend signs up and buys → both earn a reward.

## Responsibilities

- Generate a unique referral link per user
- Track referrer → referee relationship through to a completed order
- Award credit to both sides on referee's first purchase
- Show referral stats in user account
- Admin visibility into referral programme performance

## Working Method

1. **Discover** user model, order flow, and existing credit/balance fields
2. **Schema** — add tables:
   ```sql
   CREATE TABLE referral_codes (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id),
     code       TEXT NOT NULL UNIQUE,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );

   CREATE TABLE referrals (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     referrer_id     INTEGER NOT NULL REFERENCES users(id),
     referee_id      INTEGER REFERENCES users(id),
     order_id        INTEGER,
     referrer_credit INTEGER NOT NULL DEFAULT 0,
     referee_credit  INTEGER NOT NULL DEFAULT 0,
     status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'credited'|'expired'
     created_at      TEXT NOT NULL DEFAULT (datetime('now')),
     credited_at     TEXT
   );

   ALTER TABLE users ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 0;
   ```
3. **Backend** routes:
   - `GET  /api/referral/code` — return or create referral code for logged-in user
   - `GET  /api/referral/stats` — referral count, credits earned
   - `GET  /api/ref/:code` — set referral cookie, redirect to homepage
   - On register: if referral cookie present, create `referrals` row
   - On first order completion: award credit to both sides, mark credited
   - `GET  /api/admin/referrals` — full chain list (admin only)
4. **Frontend** — "Refer a Friend" section in account area: unique link, copy button, stats
5. **Checkout** — show "Apply travel credit" toggle if `credit_balance > 0`

## Constraints
- Referral code: 8-char alphanumeric, collision-checked
- Credit only on referee's FIRST order
- Self-referral blocked (`referrer_id !== referee_id`)
- Credits are platform credit only — no cash out
- Cookie TTL: 30 days

## Sensors
- `GET /api/referral/code` → code generated and persisted
- Register via link → `referrals` row created
- First order → both balances credited, status = credited
- Self-referral attempt → 400 returned
