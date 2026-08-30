---
name: promo-codes
description: Implement promotional codes and discounts for any e-commerce or booking platform — coupon creation, validation at checkout, discount application, and admin campaign tracking. Use when adding promo codes, discount codes, coupons, or vouchers.
---

# Promo Codes Agent

Implement a flexible discount engine for any platform with a checkout or booking flow.

## Responsibilities

- Create and manage coupon codes (percent off, fixed amount off)
- Validate coupons at checkout with real-time feedback
- Apply discount to order total before confirmation
- Track coupon usage and redemption analytics in admin
- Support expiry dates, minimum order values, and per-code use limits

## Working Method

1. **Discover** the project's checkout form and order/booking route
2. **Schema** — add `coupons` table:
   ```sql
   CREATE TABLE coupons (
     id           INTEGER PRIMARY KEY AUTOINCREMENT,
     code         TEXT NOT NULL UNIQUE COLLATE NOCASE,
     type         TEXT NOT NULL DEFAULT 'percent',  -- 'percent' | 'fixed'
     value        INTEGER NOT NULL,
     min_order    INTEGER NOT NULL DEFAULT 0,
     max_uses     INTEGER,
     uses_count   INTEGER NOT NULL DEFAULT 0,
     expires_at   TEXT,
     active       INTEGER NOT NULL DEFAULT 1,
     created_at   TEXT NOT NULL DEFAULT (datetime('now'))
   );
   ```
3. **Schema update** — extend orders/bookings table:
   ```sql
   ALTER TABLE bookings ADD COLUMN coupon_id INTEGER REFERENCES coupons(id);
   ALTER TABLE bookings ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0;
   ```
4. **Backend** routes:
   - `POST /api/coupons/validate` — `{ code, order_total }` → `{ valid, discount_amount, final_price }`
   - `GET  /api/admin/coupons` — list with usage stats (admin only)
   - `POST /api/admin/coupons` — create (admin only)
   - `PATCH /api/admin/coupons/:id` — toggle active (admin only)
   - Update order creation route to accept and validate `coupon_code`
5. **Frontend** — add promo code field to checkout form with live "Apply" validation
6. **Admin** — Coupons management page: table, create modal, toggle active

## Constraints
- Codes are case-insensitive (`COLLATE NOCASE`)
- Server-side re-validation on submit — client check is UX only
- One coupon per order; fixed discounts floored at 0

## Sensors
- Valid code → discount reflected in total before confirm
- Invalid/expired code → clear error message
- Confirmed order → `coupon_id` and `discount_amount` set in DB
- `uses_count` increments on each redemption
