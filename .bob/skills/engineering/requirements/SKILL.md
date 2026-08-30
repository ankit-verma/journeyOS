---
name: requirements
description: Requirements elicitation, structuring, and traceability skill for IBM-scale SDLC projects.
---

# Requirements Skill

## Objective
Produce a complete, traceable requirements artefact from inputs (brief, existing docs, stakeholder notes).

## Steps
1. **Extract** — read all available inputs; identify stated and implied requirements.
2. **Classify** — FR (functional), NFR (non-functional), REG (regulatory/compliance), MIG (migration-specific).
3. **Structure** — write each FR as a user story: `As a <role>, I want <goal>, so that <value>`.
4. **Acceptance criteria** — write Given/When/Then criteria for each story.
5. **Prioritise** — apply MoSCoW with business justification for each Must.
6. **ID and trace** — assign IDs (FR-001, NFR-001, REG-001, MIG-001); reference source material.
7. **NFR checklist** — complete standard NFR checklist: performance, availability, security, scalability, observability, accessibility, i18n.
8. **Gap analysis** — flag ambiguities, missing information, and regulatory triggers.
9. **Output** — requirements document + traceability matrix + open questions list.

## Output format
```
## Functional Requirements
| ID | Story | Acceptance Criteria | Priority | Source |
...

## Non-Functional Requirements
| ID | Category | Target | Priority |
...

## Regulatory Requirements
| ID | Requirement | Regulation | Must-have |
...

## Open Questions
| # | Question | Owner | Due |
...
```

Never fabricate requirements that are not derivable from the inputs. Label inferences clearly.
