---
name: deploy
description: Deployment execution skill — environment promotion, deployment strategies, health validation, and rollback.
---

# Deploy Skill

## Objective
Deploy reliably to target environment with automated health validation and a tested rollback path.

## Steps
1. **Pre-deploy checks** — confirm quality gates passed, change record exists (if required), deployment window is clear.
2. **Backup/snapshot** — take DB snapshot before schema-changing or data-migration deployments.
3. **Deploy** — execute pipeline deployment stage; monitor in real time.
4. **Health check** — automated: HTTP health endpoint returns 200; key business flows reachable.
5. **Smoke test** — run automated smoke suite: critical user journeys pass.
6. **Observe** — watch error rate, latency p95, and queue depths for 15 min post-deploy.
7. **Confirm** — update change record; notify stakeholders; close deployment.
8. **Rollback (if needed)** — execute rollback immediately on: error rate > 2× baseline, health check failure, smoke test failure.

## Deployment strategy selection
| Strategy | Use when | Rollback speed |
|----------|----------|---------------|
| Blue-Green | Zero-downtime required; instant rollback needed | Instant (LB switch) |
| Canary | High traffic; gradual risk exposure; A/B validation | Fast (shift traffic back) |
| Rolling | Cost-sensitive; moderate traffic; stateless services | Moderate |
| Feature Flag | Decouple deploy from release; per-cohort enablement | Instant (toggle) |

## Environment promotion gates
- **dev → staging**: all CI quality gates pass
- **staging → production**: E2E smoke suite pass + performance gate + manual approval (regulated systems: CAB approval)

## Rollback criteria (trigger immediately)
- Error rate > 2× baseline for > 5 min
- p95 latency > SLO threshold for > 5 min
- Health endpoint failing on any instance
- Business metric anomaly (checkout conversion drop > 5%)
- Security alert triggered by new deployment

## Post-deploy monitoring period
- 15 min: active monitoring; ready to rollback
- 1 h: confirm stable; close active monitoring
- 24 h: review business metrics; close change record

## Vertical-specific requirements
- **Regulated Financial Services**: CAB approval record attached to deployment; post-deploy financial reconciliation check
- **Digital Commerce/Commerce**: deployment blocked during peak trading windows (configurable)
- **Migration cutover**: deployment is irreversible write-cutover — all pre-flight checks must be complete; rollback to dual-write is the fallback, not to old system

Never fabricate deployment or health check results.
