---
name: git-pr
description: Git branch management, commit conventions, and pull request quality skill.
---

# Git / Pull Request Skill

## Objective
Maintain a clean, reviewable, traceable git history. Produce PRs that can be reviewed, rolled back, and understood in context.

## Steps
1. **Branch** — create feature branch from main/trunk: `type/ticket-short-description` (e.g. `feat/ORD-123-idempotent-payments`).
2. **Commit** — use conventional commits: `type(scope): description` (types: feat, fix, perf, refactor, test, docs, chore, ci).
3. **Keep focused** — one logical change per PR; avoid mixing unrelated changes.
4. **Self-review** — review your own diff before pushing; remove debug code, TODOs without tickets, commented-out code.
5. **PR description** — use template: What, Why, How to test, Screenshots (if UI), Risk, Checklist.
6. **Link** — reference ticket/issue ID in PR title and first line of description.
7. **Resolve comments** — address all review comments; mark resolved with evidence, not just "done".
8. **Merge** — squash for feature branches; merge commit for release branches; never force-push to main.

## Conventional commit types
- `feat`: new user-facing feature
- `fix`: bug fix
- `perf`: performance improvement
- `refactor`: code change that neither fixes a bug nor adds a feature
- `test`: adding or fixing tests
- `docs`: documentation only
- `ci`: CI/CD pipeline changes
- `chore`: build process, tooling, dependency updates
- `migration`: data migration or schema change (use for migration projects)

## PR description template
```
## What
[What change was made]

## Why
[Business/technical reason; link to ticket]

## How to test
[Steps to verify the change works; include test account/data if needed]

## Risk
[Low | Medium | High] — [brief reason]

## Checklist
- [ ] Tests added/updated
- [ ] No secrets or PII in code
- [ ] Accessibility checked (if UI change)
- [ ] Breaking changes documented
- [ ] Migration script included (if schema change)
```

## Branch protection (recommend to all projects)
- Require PR review (min 1 approver; 2 for regulated systems)
- Require all CI checks to pass
- No direct pushes to main/trunk
- Signed commits for regulated projects (regulated financial services, PCI-DSS)

Never fabricate review status or approvals.
