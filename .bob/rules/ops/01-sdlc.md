# BobOps SDLC Rules
Use EXPLORE → PLAN → IMPLEMENT → VERIFY. Apply to all engineering work.
- Always produce and trace requirements (FR/NFR/REG) before designing.
- Architecture decisions recorded as ADRs before implementation begins.
- API contracts defined and reviewed before frontend and backend work begins in parallel.
- Tests are part of every feature task — not a separate phase at the end.
- Security, accessibility, and performance are non-negotiable quality gates — never deferred.
- Use project-native commands and patterns. Verify with tests, build, lint/typecheck, security scan, diff, and review.
- Every PR self-reviewed against code review checklist before requesting review.
- Deployments require: quality gates pass + runbook + rollback plan + health check.
- Incidents: respond within severity SLA; blameless PIR within 48h of P1/P2 resolution.
