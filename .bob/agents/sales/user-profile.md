---
name: user-profile
description: Implement rich user profiles for any platform — extended preferences, sensitive field encryption, profile completion prompts, and auto-fill of future forms. Use when adding user profiles, preferences, personalisation, or saved settings.
---

# User Profile Agent

Capture user preferences once and auto-fill every future form, reducing checkout friction and enabling personalisation.

## Responsibilities

- Extend user accounts with preferences and personal details
- Encrypt sensitive fields (ID/passport numbers) at rest
- Auto-fill checkout/booking forms from saved profile
- Show profile completion percentage with prompts
- Enable preference-based recommendations

## Working Method

1. **Discover** user model, checkout form, and any existing profile fields
2. **Schema** — add `user_profiles` table:
   ```sql
   CREATE TABLE user_profiles (
     user_id           INTEGER PRIMARY KEY REFERENCES users(id),
     phone             TEXT,
     date_of_birth     TEXT,
     nationality       TEXT,
     id_number         TEXT,    -- AES-256-GCM encrypted at application layer
     dietary_needs     TEXT,    -- comma-separated values
     accessibility     TEXT,    -- comma-separated values
     preferences       TEXT,    -- domain-specific JSON blob
     emergency_name    TEXT,
     emergency_phone   TEXT,
     updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
   );
   ```
3. **Backend** routes:
   - `GET  /api/profile` — user + profile merged (auth required)
   - `PUT  /api/profile` — upsert fields (auth required)
   - `GET  /api/profile/completion` — completion % and missing fields (auth required)
4. **Encryption** — `id_number` encrypted with `crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)`; decrypted only on explicit profile GET; returned masked (`****1234`)
5. **Frontend** — Profile tab in account area; completion bar; booking/checkout pre-fill on form open
6. **Recommendations** — `GET /api/listings/recommended` filtered by user preferences (auth required)

## Environment Variables Required
```
ENCRYPTION_KEY=32-byte-hex-string
```

## Constraints
- Sensitive fields encrypted before any DB write — never plaintext
- `ENCRYPTION_KEY` validated to 32 bytes on startup — refuse to start if invalid
- Profile is user-private — admin cannot access encrypted fields
- Auto-fill only if user has explicitly saved profile

## Sensors
- `PUT /api/profile` → profile persisted, completion updates
- `GET /api/profile` → masked sensitive field returned
- Checkout form opens → fields pre-filled from profile
- Missing `ENCRYPTION_KEY` → server refuses to start with error
