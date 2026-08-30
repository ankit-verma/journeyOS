---
name: reviews
description: Implement a user reviews and ratings system — verified post-purchase review collection, dynamic average ratings displayed on listings, admin moderation, and automated review request emails. Use when adding reviews, ratings, testimonials, or social proof to any platform.
---

# Reviews Agent

Add user-generated reviews and dynamic ratings to any product, service, or experience platform.

## Responsibilities

- Allow verified purchasers to submit star ratings and written reviews
- Display dynamic average ratings on listing cards
- Send automated post-purchase review request prompts
- Admin moderation: approve, reject, or flag reviews
- Surface top reviews on listing detail views

## Working Method

1. **Discover** the project's listing model (products/trips/services), booking/order model, and DB schema
2. **Schema** — add `reviews` table:
   ```sql
   CREATE TABLE reviews (
     id          INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id     INTEGER NOT NULL REFERENCES users(id),
     order_id    INTEGER NOT NULL,
     listing_id  INTEGER NOT NULL,
     rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
     title       TEXT,
     body        TEXT NOT NULL,
     status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'approved'|'rejected'
     created_at  TEXT NOT NULL DEFAULT (datetime('now')),
     UNIQUE(user_id, order_id)
   );
   ```
3. **Backend** routes:
   - `POST /api/reviews` — submit (auth required; order must be completed and past date)
   - `GET  /api/reviews?listing_id=` — approved reviews for a listing
   - `GET  /api/listings/:id/rating` — `{ avg_rating, count }` computed from approved reviews
   - `GET  /api/admin/reviews` — all reviews with status filter (admin only)
   - `PATCH /api/admin/reviews/:id/status` — approve / reject (admin only)
4. **Frontend** — listing cards show computed rating; completed-order UI shows "Leave a Review" CTA; review submission modal (stars + title + body)
5. **Admin** — Reviews page with pending count badge; approve/reject actions

## Constraints
- Only users with a completed order/booking past the service date can submit
- One review per order (UNIQUE constraint)
- Reviews default to `pending` — approved before public display
- Display first name + last initial only (e.g. "Sarah A.")

## Sensors
- Eligible user submits → row created, status = pending
- Admin approves → appears on listing card
- Duplicate attempt → 409 error
- Ineligible user → 403 error
