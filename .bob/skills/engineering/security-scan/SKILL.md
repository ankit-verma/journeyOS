---
name: security-scan
description: Security scanning skill — SAST, DAST, dependency audit, secrets detection, and container scanning.
---

# Security Scan Skill

## Objective
Identify and prioritise security vulnerabilities across code, dependencies, containers, and infrastructure before they reach production.

## Steps
1. **SAST (Static Analysis)** — run on source code: SonarQube, Semgrep, CodeQL, Checkmarx.
2. **Dependency audit** — scan lockfile for known CVEs: `npm audit`, `pip audit`, Snyk, OWASP Dependency-Check.
3. **Secrets detection** — scan git history and current code: GitLeaks, truffleHog, GitHub secret scanning.
4. **Container scan** — scan Dockerfile and image layers: Trivy, Snyk Container, AWS ECR scanning.
5. **IaC scan** — scan Terraform/CloudFormation/Bicep: tfsec, Checkov, KICS.
6. **DAST (Dynamic Analysis)** — run against deployed staging: OWASP ZAP, Burp Suite (manual).
7. **Triage** — classify findings: true positive vs false positive; severity (Critical/High/Medium/Low).
8. **Remediate** — provide specific fix for each true positive; re-scan to confirm fix.
9. **Report** — produce findings report with CVSS scores, business impact, and remediation status.

## Severity thresholds and actions
| Severity | Action |
|----------|--------|
| Critical (CVSS ≥ 9) | Block deployment immediately; fix required before any release |
| High (CVSS 7–8.9) | Block production deployment; fix within current sprint |
| Medium (CVSS 4–6.9) | Fix in next sprint; do not accumulate |
| Low (CVSS < 4) | Track in backlog; address in hardening sprint |

## Common tools by scan type
- **SAST**: SonarQube (enterprise), Semgrep (fast, configurable), CodeQL (deep, GitHub-native)
- **Dependencies**: Snyk (comprehensive), `npm audit`/`pip audit`/`mvn dependency-check` (native)
- **Secrets**: GitLeaks (git history), detect-secrets (pre-commit), GitHub Advanced Security
- **Container**: Trivy (fast, comprehensive), Snyk Container, Grype
- **IaC**: tfsec (Terraform), Checkov (multi-platform), KICS

## CI integration (always implement)
```
PR → secrets scan (block on any finding) →
     SAST (block on Critical/High) →
     dependency scan (block on Critical) →
     container scan (block on Critical/High) →
     IaC scan (block on Critical/High)
```

## Vertical-specific focus areas
- **Regulated Financial Services**: PCI-DSS requirement — annual pen test + quarterly DAST; no card data in logs (scan for card patterns)
- **Digital Commerce**: PCI-DSS SAQ dependency on payment integration type; fraud pattern signatures
- **Travel and Service Operations and Service Operations**: passport/ID data pattern scanning in logs; PNR data exposure checks

Never fabricate scan results. Evidence must come from actual tool output.
