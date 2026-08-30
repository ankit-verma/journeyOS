---
name: loyalty
description: Implement a loyalty points and rewards programme for any platform — earn points per purchase, tier progression, and credit redemption at checkout. Use when adding loyalty points, rewards programmes, tier systems, or purchase credits.
---

# Loyalty Points Agent

Turn one-time buyers into repeat customers through earned points, tier progression, and redeemable credits.

## Responsibilities

- Award points for every confirmed order (configurable rate, default 1 pt per $1)
- Define tiers (e.g. Bronze / Silver / Gold) with threshold-based benefits
- Allow credit redemption at checkout
- Show loyalty balance and tier progress in user account
- Admin: leaderboard and tier override

## Working Method

1. **Discover** user model, order flow, and any existing credit_balance fields
2. **Schema** — add `loyalty_points` table and extend users:
   ```sql
   CREATE TABLE loyalty_points (
     id          INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id     INTEGER NOT NULL REFERENCES users(id),
     order_id    INTEGER,
     points      INTEGER NOT NULL,   -- positive=earned, negative=redeemed
     reason      TEXT NOT NULL,      -- 'order_earned'|'redeemed'|'referral_bonus'|'adjustment'
     created_at  TEXT NOT NULL DEFAULT (datetime('now'))
   );

   ALTER TABLE users ADD COLUMN loyalty_points_balance INTEGER NOT NULL DEFAULT 0;
   ALTER TABLE users ADD COLUMN loyalty_tier TEXT NOT NULL DEFAULT 'Bronze';
   ```
3. **Tier logic** (configurable thresholds):
   - Bronze (0–999 pts): no benefit
   - Silver (1000–4999 pts): 5% discount on all orders
   - Gold (5000+ pts): 10% discount + priority badge
4. **Backend** routes:
   - `GET  /api/loyalty` — `{ balance, tier, history, points_to_next }` (auth required)
   - `POST /api/loyalty/redeem` — redeem N pts for credit (auth required)
   - `GET  /api/admin/loyalty` — top users by points (admin only)
   - Hook into order completion: award points, update balance, recalculate tier
5. **Frontend** — Loyalty section in account: tier badge, progress bar, "Redeem Points" button; checkout shows "You'll earn X points"
6. **Admin** — Loyalty leaderboard on Users page

## Constraints
- Points awarded only on `confirmed` / `paid` orders
- Redemption minimum: configurable (default 100 pts = $10 credit)
- Points cannot go negative — validate before redemption
- Tier stored on user row for fast reads; recalculated on every point change

## Sensors
- Completed order → `loyalty_points` row created, balance updated
- Threshold reached → tier updates correctly
- Redeem 100 pts → balance −100, credit_balance +10
- Tier discount auto-applied at checkout for Silver/Gold
