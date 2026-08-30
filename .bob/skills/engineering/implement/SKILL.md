---
name: implement
description: Implementation skill — writing production-ready code following project conventions and quality standards.
---

# Implement Skill

## Objective
Deliver working, tested, secure, and observable code that meets requirements and passes all quality gates.

## Steps
1. **Confirm** — verify requirements, API contract, data model, and acceptance criteria before writing code.
2. **Code** — implement following project conventions; match existing code style, patterns, and naming.
3. **Test** — write unit tests alongside implementation; integration tests for external dependencies.
4. **Harden** — input validation, error handling, logging, and metrics instrumentation.
5. **Self-review** — apply code review checklist before raising PR (correctness, security, performance, maintainability).
6. **PR** — clear description: what changed, why, how to test, screenshots if UI, risk level.
7. **Evidence** — record: what was implemented, test results, assumptions made, deviations from plan.

## Implementation standards (always apply)
- No secrets in code; use environment/vault
- All inputs validated at entry point
- All errors handled explicitly — no silent swallowing
- Logging includes trace/request/correlation IDs; never logs PII/card/credentials
- New endpoints require auth unless explicitly documented as public
- Schema changes include migration scripts
- Breaking API changes require version bump

## Quality gates before PR
- [ ] Unit tests pass locally
- [ ] No new lint errors or typecheck failures
- [ ] No new security scan findings (Critical/High)
- [ ] Code self-reviewed against code review checklist
- [ ] PR description complete

## Language-agnostic patterns
- Idempotency: mutating operations (create order, charge payment, send email) must be safe to retry
- Transactions: multi-step data mutations use DB transactions or saga pattern
- Pagination: all list queries paginated (cursor preferred for > 1k records)
- Timeouts: all outbound calls have explicit timeouts configured
- Observability: structured log at entry and exit of every significant operation

## Authentication implementation patterns

### JWT / Bearer token (stateless)
- Issue tokens on login and registration; include `id`, `email`, `role` (and `name` if needed) in payload
- Sign with `JWT_SECRET` from environment — never hardcode; default dev secret must not reach production
- Set a reasonable expiry (`7d` for user sessions; shorter for sensitive operations)
- Store token client-side in `localStorage` (or `httpOnly` cookie for higher security); store minimal user metadata alongside
- Every authenticated request sends `Authorization: Bearer <token>` header
- Middleware verifies signature and expiry; returns `401` on failure; never swallows JWT errors silently

### Route protection levels
| Level | Middleware pattern | Applied to |
|-------|-------------------|------------|
| Public | none | Read-only discovery endpoints, health checks |
| Authenticated | `requireAuth` (verify JWT) | Any user action — create, read-own, update-own |
| Privileged / Admin | `requireAdmin` (verify JWT + role check) | Management CRUD, analytics, user administration |

### Password handling
- Hash with bcrypt (≥ 10 rounds); never store plaintext
- Use constant-time comparison (`bcrypt.compareSync` or equivalent) to prevent timing attacks
- Validate: min length (≥ 6), presence; reject if already registered (duplicate email)

### Frontend auth lifecycle
1. On login/register success: store token + user object in `localStorage`
2. On every API call: read token and set `Authorization` header
3. On `401`/`403` response: clear session storage and redirect to login
4. On logout: clear `localStorage` entries (client-side only for stateless JWT)

### Environment variables for auth services
| Variable | Purpose | Notes |
|----------|---------|-------|
| `JWT_SECRET` | Token signing key | Rotate in production; never commit to source |
| `PORT` | Server listen port | Default `3000` for local dev |

### SQLite auth schema (Node 22 `node:sqlite`)
- Use `datetime('now')` with **single quotes** for default timestamps — double quotes are treated as column identifiers
- Run `ALTER TABLE … ADD COLUMN` migrations at startup for columns added after initial `CREATE TABLE IF NOT EXISTS`
- Wrap multi-step mutations (create + update) in explicit transactions for consistency

### Async Express handlers
- Wrap all `async` route handlers in `.catch(err => next(err))` or an async wrapper — Express 4 does not propagate unhandled async rejections to the error middleware; silent failures return no response

Never fabricate test results. Record actual evidence of what was tested and what passed.
