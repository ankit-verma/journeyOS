---
name: plan
description: Technical planning skill — breaking down work into implementable tasks with clear scope and risk assessment.
---

# Plan Skill

## Objective
Produce a clear, actionable implementation plan that unblocks development and surfaces risks before work begins.

## Steps
1. **Confirm scope** — load requirements and any architectural decisions; clarify ambiguities before planning.
2. **Decompose** — break work into independently deliverable tasks; each task should be completable in 1–3 days.
3. **Sequence** — identify dependencies; order tasks to unblock parallel work; critical path first.
4. **Estimate** — provide effort estimates (S/M/L or story points); flag high-uncertainty items.
5. **Risk register** — identify technical risks per task: unknowns, dependencies, complexity, compliance requirements.
6. **Definition of Done** — state what "done" means for each task: code, tests, docs, security review, accessibility check.
7. **Milestones** — group tasks into phases with verifiable outcomes (not arbitrary dates).
8. **Assumptions** — list all assumptions; each assumption is a risk if wrong.

## Task structure
```
## Task: <name>
**Type**: Feature | Bug | Tech debt | Infrastructure | Migration
**Effort**: S (< 1 day) | M (1–3 days) | L (3–5 days) | XL (> 5 days, decompose further)
**Dependencies**: <other tasks or external blockers>
**Risks**: <technical risks, unknowns>
**Definition of Done**: <specific, verifiable criteria>
```

## Planning principles
- Prefer small, releasable increments over big-bang deliverables
- Surface blockers and open questions explicitly — do not hide uncertainty in estimates
- Never plan to "test at the end" — testing tasks are part of every feature task
- Compliance, security, and accessibility tasks are not optional — include in plan
- Migration tasks always include: dry run → validate → production run → reconcile

## SDLC phase alignment
Ensure plan covers all required phases:
- [ ] Requirements confirmed and traced
- [ ] Architecture/design decisions recorded (ADRs)
- [ ] API contracts defined before implementation
- [ ] Test strategy defined (not just "write tests")
- [ ] Security review scheduled
- [ ] Accessibility review scheduled
- [ ] Performance testing scheduled
- [ ] Deployment and rollback plan documented

Never fabricate estimates or claim tasks are complete before they are.
