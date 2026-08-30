---
name: release
description: Release management skill — versioning, changelogs, artefact publishing, and release notes.
---

# Release Skill

## Objective
Produce a clean, versioned, documented release that is traceable, rollback-capable, and communicates changes clearly.

## Steps
1. **Confirm readiness** — all quality gates passed; no outstanding Critical/High issues; staging validated.
2. **Version** — apply semantic versioning: MAJOR.MINOR.PATCH (breaking.feature.fix); pre-release: `-rc.N`.
3. **Changelog** — generate from conventional commits since last tag; categorise: Breaking Changes, Features, Bug Fixes, Performance, Security.
4. **Tag** — create annotated git tag: `git tag -a v<version> -m "Release v<version>"`.
5. **Build artefact** — trigger CI release pipeline; publish to registry/package manager/release storage.
6. **Release notes** — write customer-facing release notes: plain language, no internal jargon, link to docs.
7. **Publish** — create GitHub/GitLab/Azure DevOps release; attach artefacts; publish release notes.
8. **Notify** — notify stakeholders (Slack/email); update status page; communicate to support teams.
9. **Monitor** — watch adoption metrics and error rates for 24h post-release.

## Semantic versioning rules
- **MAJOR**: breaking API change, removed feature, incompatible data format change
- **MINOR**: new backward-compatible feature or capability
- **PATCH**: backward-compatible bug fix, security patch, performance improvement
- **Pre-release**: `-rc.1`, `-beta.1` for staged rollouts

## Changelog format
```
# Changelog — v<version> (<date>)

## ⚠️ Breaking Changes
- <change> — <migration guidance>

## ✨ Features
- <feature> (<ticket-id>)

## 🐛 Bug Fixes
- <fix> (<ticket-id>)

## 🔒 Security
- <fix> (CVE-YYYY-XXXXX if applicable)

## ⚡ Performance
- <improvement>
```

## Vertical-specific requirements
- **Regulated Financial Services**: release notes must include ITIL change record reference number
- **Digital Commerce/Commerce**: release notes communicated to support team before release (customer-facing changes)
- **Migration**: release notes include data migration summary (records migrated, reconciliation status)
- **Regulated systems**: release artefacts stored for audit retention period (typically 7 years)

Never fabricate release status, version numbers, or artefact publish confirmations.
