---
name: upsells
description: Implement optional add-ons and upsells for any booking or e-commerce platform — per-item extras shown at checkout to increase average order value. Use when adding add-ons, upsells, extras, optional upgrades, or cross-sells.
---

# Add-ons & Upsells Agent

Surface contextual optional extras at checkout to increase average order value. Applies to any booking, service, or product platform.

## Responsibilities

- Define optional add-ons per listing or globally
- Display available add-ons during checkout after the main selection
- Add selected extras to order total before confirmation
- Track add-on revenue separately in admin analytics
- Admin: create / edit / deactivate add-ons

## Working Method

1. **Discover** the project's checkout/booking flow and order schema
2. **Schema** — add tables:
   ```sql
   CREATE TABLE add_ons (
     id          INTEGER PRIMARY KEY AUTOINCREMENT,
     listing_id  INTEGER,   -- NULL = available for all listings
     name        TEXT NOT NULL,
     description TEXT,
     price       INTEGER NOT NULL,
     per_person  INTEGER NOT NULL DEFAULT 1,  -- 1=per person, 0=flat
     icon        TEXT,
     active      INTEGER NOT NULL DEFAULT 1,
     created_at  TEXT NOT NULL DEFAULT (datetime('now'))
   );

   CREATE TABLE order_add_ons (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     order_id   INTEGER NOT NULL,
     add_on_id  INTEGER NOT NULL REFERENCES add_ons(id),
     quantity   INTEGER NOT NULL DEFAULT 1,
     unit_price INTEGER NOT NULL,
     subtotal   INTEGER NOT NULL
   );
   ```
3. **Seed** common add-ons (adapt to domain):
   - Transfer / delivery: per-person flat fee
   - Insurance / protection: per-person
   - Premium upgrade / private option: flat
4. **Backend** routes:
   - `GET  /api/listings/:id/addons` — active add-ons for a listing (public)
   - Update order creation route to accept `add_on_ids: [{ id, quantity }]`
   - `GET  /api/admin/addons` — all add-ons (admin only)
   - `POST /api/admin/addons` — create (admin only)
   - `PUT  /api/admin/addons/:id` — update (admin only)
5. **Frontend** — "Enhance Your Order" section in checkout after main form; live total update as add-ons toggled; line items in total summary
6. **Admin** — Add-ons page with create/edit modal; add-on revenue % in analytics

## Constraints
- Add-ons are optional — order completes without them
- Deactivated add-ons not shown to new orders but preserved on existing
- Add-on subtotal included in `total_price` on order record

## Sensors
- `GET /api/listings/:id/addons` returns seeded add-ons
- Selecting add-on → total updates correctly
- Order with add-ons → `order_add_ons` rows created
- Deactivated add-on → not visible in checkout flow
