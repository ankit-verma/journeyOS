---
name: funnel
description: Implement conversion funnel tracking for any web application — server-side event logging, funnel visualisation in admin, and per-listing conversion rates to identify drop-off points. Use when adding funnel analytics, event tracking, conversion tracking, or behavioural analytics.
---

# Funnel Analytics Agent

Instrument the user journey from first view to conversion and surface drop-off in the admin dashboard. Applies to any platform with a multi-step conversion flow.

## Responsibilities

- Track key funnel events server-side: view, detail view, checkout open, form start, submit, complete, abandon
- Store events in a structured log with session and user context
- Add a conversion funnel chart to admin overview
- Show per-listing conversion rates
- Enable daily cohort analysis

## Working Method

1. **Discover** existing analytics, current admin stats, and the project's conversion flow steps
2. **Schema** — add `events` table:
   ```sql
   CREATE TABLE events (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     session_id TEXT NOT NULL,
     user_id    INTEGER,
     event      TEXT NOT NULL,
     entity     TEXT,
     entity_id  INTEGER,
     metadata   TEXT,   -- JSON
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX idx_events_event ON events(event);
   CREATE INDEX idx_events_created ON events(created_at);
   ```
3. **Standard events** (adapt names to domain):

   | Event | Trigger |
   |-------|---------|
   | `listing_view` | Listing card rendered / clicked |
   | `checkout_open` | Checkout/booking modal opened |
   | `form_start` | First field touched |
   | `form_submit` | Submit attempted |
   | `order_complete` | Order/booking API success |
   | `order_abandon` | Modal closed after form_start without complete |
   | `search_performed` | Search submitted |

4. **Backend** routes:
   - `POST /api/events` — log event (public; rate-limited 10/min per session)
   - `GET  /api/admin/funnel` — counts per event type (admin only)
   - `GET  /api/admin/funnel/listings` — per-listing: views, opens, completions, conversion % (admin only)
   - `GET  /api/admin/funnel/timeline` — daily event counts last 30 days (admin only)
5. **Frontend** — `logEvent(event, entity, entityId)` helper; session ID via `crypto.randomUUID()` in sessionStorage
6. **Admin** — Funnel chart on Overview; conversion rate KPI card; per-listing conversion column in listings table

## Constraints
- Events are append-only — no updates or deletes
- `user_id` nullable (anonymous visitors tracked by session)
- Rate-limit `POST /api/events` — return 429 on excess
- Use indexes for all funnel queries

## Sensors
- Browsing listings → `listing_view` events in DB
- Opening checkout → `checkout_open` event logged
- Completing order → `order_complete` with order_id
- `GET /api/admin/funnel` returns non-zero counts
- Conversion rate computed correctly (completions / views × 100)
