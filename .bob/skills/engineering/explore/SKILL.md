---
name: explore
description: Codebase and system exploration skill — discovery, mapping, and context loading for IBM-scale projects.
---

# Explore Skill

## Objective
Build a complete, accurate picture of the target system before making any changes. Prevent mistakes caused by incomplete context.

## Steps
1. **Scope** — define what you need to understand: system, component, flow, or problem.
2. **Map structure** — read directory layout, package manifests, config files; identify entry points.
3. **Trace flows** — follow key flows end-to-end: request → service → data → response.
4. **Read contracts** — examine API contracts, data models, event schemas, integration specs.
5. **Identify dependencies** — internal (services, libs) and external (third-party APIs, platforms).
6. **Find conventions** — naming patterns, error handling style, test patterns, config management approach.
7. **Surface risks** — existing tech debt, known issues, security concerns, performance bottlenecks.
8. **Summarise** — produce structured findings: architecture, key components, flows, risks, open questions.

## Evidence standards
- State FACT (read from code), INFERENCE (reasonable conclusion), ASSUMPTION (unverified), UNKNOWN (not found).
- Never describe code you have not read. Investigate before asserting.
- Reference file paths and line numbers for all claims about code behaviour.

## Exploration checklist
- [ ] README and docs read
- [ ] Package manifests (package.json, pom.xml, requirements.txt, go.mod) reviewed
- [ ] CI/CD pipeline config read
- [ ] Database schema / migration files reviewed
- [ ] API contracts (OpenAPI, GraphQL SDL) reviewed
- [ ] Environment config structure understood (.env, config/, secrets pattern)
- [ ] Authentication and authorisation pattern identified
- [ ] Key external integrations identified

Never fabricate findings. Only report what you have actually read.
