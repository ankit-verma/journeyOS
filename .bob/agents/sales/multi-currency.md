---
name: multi-currency
description: Implement multi-currency support for any e-commerce or booking platform — currency selector, live exchange rates, locale-aware price formatting throughout the UI. Use when adding multi-currency, currency conversion, internationalisation, or localised pricing.
---

# Multi-Currency Agent

Let users see prices in their preferred currency. Applies to any platform with monetary values in the UI.

## Responsibilities

- Add a currency selector to navigation
- Fetch and cache daily exchange rates from a free public API
- Convert all displayed prices to the selected currency
- Format prices with correct locale symbols and separators
- Store all data in base currency (USD/GBP/EUR as configured) — display is presentation only
- Admin dashboard shows revenue in base currency with display toggle

## Working Method

1. **Discover** how prices are stored and displayed; current base currency
2. **Schema** — add `exchange_rates` cache table:
   ```sql
   CREATE TABLE exchange_rates (
     currency   TEXT PRIMARY KEY,
     rate       REAL NOT NULL,   -- relative to base currency
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   ```
3. **Default supported currencies** (configurable):
   `USD, EUR, GBP, AUD, JPY, CAD, SGD, AED` — seed fallback rates on startup
4. **Backend** routes:
   - `GET /api/currencies` — supported currencies with current rates (public)
   - `POST /api/internal/refresh-rates` — fetch from `open.er-api.com` (free tier), upsert rates (admin or scheduled)
5. **Frontend**:
   - Currency dropdown in nav (flag emoji + code)
   - Selection stored in `localStorage`
   - `formatPrice(baseAmount, currency)` using `Intl.NumberFormat` with correct locale
   - All price displays re-render on currency change without page reload
6. **Admin** — currency selector in topbar; all revenue figures converted for display; "Base currency: [X]" label

## Constraints
- All prices stored in base currency (integers) — DB never changes
- Exchange rates for display only
- Fallback rates hardcoded for when API is unavailable
- Rate refresh: max once per 24h (free API limits)
- JPY and similar: no decimal places (`Intl.NumberFormat` locale handles this)

## Sensors
- Currency switch → all prices update within 100ms
- `GET /api/currencies` returns rates for all supported currencies
- Booking total shown in selected currency = `base_price × rate`
- DB record always stores base currency value
- Admin refresh → `exchange_rates.updated_at` changes
