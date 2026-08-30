# Plug-and-Play Model

SmartBob is designed to be installed into a new project without requiring a new framework branch for each industry or technology.

## What changes per project

Only project context and approved tools should normally change:
- project profile
- repository documentation
- available commands
- MCP/tool connections
- applicable policies and approvals
- environment details

## What stays reusable

- top-level modes
- capability agents
- skills
- global rules
- orchestration patterns
- verification patterns
- context management

## How an unfamiliar stack is handled

1. Context Discovery inspects manifests, configuration, source layout, tests, deployment files and documentation.
2. Technology Analyst builds the technology inventory.
3. SmartBob selects capabilities based on the task.
4. Specialists work using the discovered conventions.
5. Sensors verify the result.
6. Feedback drives another iteration if needed.

This allows the same framework to work with unfamiliar languages, frameworks, databases, runtimes, infrastructure patterns, interfaces and application architectures without adding a hard-coded agent for each one.
