---
name: wishlist
description: Implement wishlists and saved items for any platform — users save listings, receive low-inventory or price-drop alerts, and are nudged back to purchase. Use when adding wishlists, favourites, saved items, or heart/bookmark functionality.
---

# Wishlist Agent

Add a save/favourite mechanic to any listing or product platform to capture intent and re-engage users at the right moment.

## Responsibilities

- Allow logged-in users to save/unsave any listing with a toggle (heart/bookmark)
- Persist wishlists per user in the database
- Show a "Saved Items" view in the user account area
- Trigger low-inventory or price-drop alert emails
- Show wishlist count badge in navigation

## Working Method

1. **Discover** the project's listing model, auth state, and existing nav patterns
2. **Schema** — add `wishlists` table:
   ```sql
   CREATE TABLE wishlists (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id    INTEGER NOT NULL REFERENCES users(id),
     listing_id INTEGER NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     UNIQUE(user_id, listing_id)
   );
   ```
3. **Backend** routes:
   - `GET    /api/wishlist` — user's saved items with full listing data (auth required)
   - `POST   /api/wishlist/:id` — add to wishlist (auth required; 409 if duplicate)
   - `DELETE /api/wishlist/:id` — remove from wishlist (auth required)
   - `GET    /api/admin/wishlist/popular` — most-wishlisted items ranked (admin only)
   - Internal: `POST /api/internal/wishlist-alerts` — send alerts for low-inventory wishlisted items
4. **Frontend** — toggle icon (♡/♥) on each listing card; prompt login if not authenticated; "Saved" tab in user account area
5. **Alert email** — "Only 2 spots/units left on your saved item: [Name]"

## Constraints
- UNIQUE constraint — return `{ already_saved: true }` on duplicate POST, not an error
- Wishlist is user-private
- Alert emails: one per user per item per inventory-drop event (no spam)
- Guest users: show toggle but prompt login to persist

## Sensors
- Clicking toggle (logged in) → item saved, icon fills
- `GET /api/wishlist` returns correct items for user
- Low-inventory alert email contains item name and resume link
- Admin popular list shows correct ranking
