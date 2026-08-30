# SmartBob Framework v1

A universal, portable, plug-and-play agent framework for IBM Bob 2.0.

## Goal

SmartBob should work across many industries, business models, application architectures and technology stacks without requiring hard-coded industry/vendor agents.

Instead of encoding every possible sector or technology, the framework uses:
- runtime project discovery
- capability-based specialist agents
- reusable skills
- project adapters
- rules and approval gates
- sensors and feedback
- parallel task orchestration

## Modes

SmartBob (default), BobCEO, BobCompliance, BobOps, BobSales, BobKT, BobResearch, BobFinance, BobData and BobMigrate.

## Architecture

Mode -> Agent -> Skill -> Tool -> Sensor -> Feedback

## Plug-and-play principle

A new project should only need a project context profile and its approved tools/integrations. SmartBob discovers the actual domain and technology rather than requiring a new agent for each sector or vendor.

## Installation

Use the included safe installer. Start with dry-run mode. It backs up existing `.bob`, preserves project-owned configuration, preserves existing skills, and avoids overwriting conflicting files.

Windows:
```powershell
.\install-smartbob.ps1 -ProjectPath "C:\path\to\project" -DryRun
.\install-smartbob.ps1 -ProjectPath "C:\path\to\project"
```

macOS/Linux:
```bash
./install-smartbob.sh /path/to/project --dry-run
./install-smartbob.sh /path/to/project
```

## What the framework can automate

End-to-end workflows can combine discovery, requirements, planning, implementation, testing, security, compliance, review, change management, release, operations, reporting and knowledge transfer.

The actual workflow is selected dynamically from the request and project context.

## Safety

Never fabricate results or external actions. Require appropriate human approval for high-risk, irreversible, regulated or public-facing decisions.

## One-prompt autonomous build

SmartBob v1 is designed for a concise human outcome request. The human does not need to supply a technical master prompt. SmartBob discovers project context, infers safe requirements, maps capabilities, selects specialists, builds a dependency-aware task graph, executes the SDLC, uses sensors for verification and feedback, and continues through delivery and post-delivery verification where authorized.

Example:

```text
Build a travel website called JourneyOS.
```

See `SMARTBOB-ONE-PROMPT.md` and `.bob/agents/smartbob/autonomous-build.md`.


## Parallel agent execution

The framework includes a dependency graph, parallel-wave model, execution event contract and execution-monitor specification.

A graph proves that work *can* be parallel. Runtime start/finish events are required to prove that work *was* parallel. If the runtime does not expose that evidence, SmartBob must say so.


## IBM Bob custom modes

The custom mode registry now uses IBM Bob's native `customModes:` array schema. A standalone `smartbob-custom-modes.yaml` is included for importing through Settings → Modes → Import Mode.
