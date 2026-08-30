# Agent Authoring Rules

- Agent and skill Markdown files include YAML frontmatter with `name` and `description`.
- Rule files use a numeric prefix when ordering is useful.
- Skills live at `.bob/skills/<family>/<skill-name>/SKILL.md`.
- User-facing modes are defined in `custom_modes.yaml`; specialist agents should not be duplicated merely for a new domain or technology.
- `.bob/mcp.json` and `.bob/settings.json` are project-local and must not be modified by framework installation.
- Rules should be additive and composable.
- Keep framework instructions domain- and vendor-neutral; project-specific constraints belong in the project adapter.
- Installer preserve/conflict behavior must remain consistent across supported installer scripts.
