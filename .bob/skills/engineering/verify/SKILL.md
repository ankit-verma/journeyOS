---
name: verify
description: Verification skill — validating implementation against requirements, quality gates, and production readiness checklist.
---

# Verify Skill

## Objective
Confirm that delivered work meets requirements, passes all quality gates, and is safe to deploy.

## Steps
1. **Functional** — verify each acceptance criterion is met; run automated tests; demonstrate to stakeholder if needed.
2. **Non-functional** — validate NFR targets: performance under load, accessibility score, security scan clean.
3. **Quality gates** — confirm all CI pipeline stages pass: lint, typecheck, unit, integration, E2E, security scan, performance.
4. **Requirements traceability** — verify every FR and NFR has a corresponding test or evidence of compliance.
5. **Security** — confirm no new Critical/High findings; OWASP Top 10 checklist reviewed.
6. **Accessibility** — zero critical axe violations; Lighthouse accessibility ≥ 90.
7. **Observability** — confirm logs, metrics, and traces are flowing; alerts are configured.
8. **Deployment readiness** — runbook exists; rollback plan documented; staging validated.
9. **Sign-off** — produce verification report with pass/fail per criterion; flag any unresolved items.

## Verification report format
```
## Verification Report — <Feature/Release>

### Functional Requirements
| ID | Criterion | Test | Status | Evidence |
...

### Non-Functional Requirements
| ID | NFR | Target | Actual | Status |
...

### Quality Gates
- [ ] All unit tests pass (coverage: X%)
- [ ] Integration tests pass
- [ ] E2E smoke suite passes
- [ ] No Critical/High security findings
- [ ] Accessibility: Lighthouse ≥ 90, zero critical axe violations
- [ ] Performance: p95 < target under load
- [ ] Staging deployment successful
- [ ] Post-deploy health checks pass

### Unresolved Items
| Item | Severity | Owner | Due |
```

## Vertical-specific verification
- **Regulated Financial Services**: financial calculation accuracy test (expected vs actual amounts); audit log completeness check; concurrent transaction test
- **Digital Commerce**: checkout E2E with real payment sandbox; inventory decrement verified post-purchase; discount logic test
- **Travel and Service Operations**: booking saga completeness (hold → payment → confirm); cancellation and refund flow; GDS error handling
- **Migration**: reconciliation report signed off; data parity verified; rollback tested in staging

Never fabricate test results or verification status. Evidence must be real.
