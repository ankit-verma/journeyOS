---
name: api-contract
description: Design, inspect and verify API/interface contracts.
---

# Api Contract

## Purpose
Design, inspect and verify API/interface contracts.

## Procedure
1. Establish objective and scope.
2. Discover relevant project evidence.
3. Identify assumptions and unknowns.
4. Execute the capability using available tools.
5. Capture evidence and verification.
6. Return findings, risks and next actions.

Remain technology- and domain-neutral unless project evidence establishes otherwise.
Never fabricate results.

---

## Route protection matrix pattern

When designing HTTP APIs with authentication, classify every route before implementing it. Use this matrix as a template — populate it from project evidence.

| Route pattern | Auth level | Notes |
|--------------|-----------|-------|
| `GET /api/<resource>` (public catalog) | None | Read-only, no PII |
| `GET /api/<resource>/:id` (public detail) | None | Read-only, no PII |
| `POST /api/<resource>` (create, user-owned) | `requireAuth` | Associate with `req.user.id` |
| `GET /api/<resource>` (user-owned list) | `requireAuth` | Filter by owner; admins see all |
| `PATCH /api/<resource>/:id` | `requireAuth` | Verify ownership before mutating |
| `DELETE /api/<resource>/:id` | `requireAuth` | Verify ownership before deleting |
| `GET /api/admin/*` | `requireAdmin` | role-check after JWT verify |
| `POST /api/admin/*` | `requireAdmin` | Management write operations |
| `PUT /api/admin/*` | `requireAdmin` | Management write operations |
| `DELETE /api/admin/*` | `requireAdmin` | Management write operations |

### Ownership rules
- Users may only read or mutate resources they own (match `user_id` or `email` on the record)
- Admins bypass ownership checks — always verify role before granting this bypass
- Return `403` (not `404`) when a resource exists but the caller lacks permission, to prevent enumeration — exception: high-security contexts where existence must be hidden

### Consistent response envelope
All endpoints should return a consistent envelope:
```json
{ "success": true,  "data": <payload> }
{ "success": false, "error": "<human-readable message>" }
```
- Use `200` for success, `201` for created resources
- Use `400` for validation failures, `401` for missing/invalid auth, `403` for insufficient permission, `404` for not found, `500` for unexpected server errors
- Never expose stack traces or internal error details in `error` field

### Clean URL routing (Express)
- Serve pages at clean paths (`/admin`, `/privacy`) using explicit `app.get` routes
- Place `301` redirects from `.html` paths **before** `express.static` middleware, otherwise static middleware intercepts them first
- Place the wildcard SPA fallback (`app.get('*', ...)`) **last**, after all explicit routes
