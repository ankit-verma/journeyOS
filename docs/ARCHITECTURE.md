# SmartBob Universal Architecture

## Layers

### 1. Mode
User-facing operating posture.

### 2. Agent
Specialist reasoning/work role selected by capability.

### 3. Skill
Reusable procedure/capability.

### 4. Tool
Mechanism for reading, writing, searching, testing, communicating or operating systems.

### 5. Sensor
Objective feedback about outcomes.

### 6. Feedback
Evidence used to continue, revise, retry or stop.

## Dynamic specialization

The framework intentionally does not encode one mode per industry or vendor.

Example:
A request involving an unfamiliar application stack can route:
SmartBob -> Context Discovery -> Technology Analyst + Requirements Analyst -> Architecture -> Implementation -> Verify.

The same structure can adapt to different domains because domain context is discovered from the project.

## Parallelism

Independent work can execute concurrently:
- requirements analysis
- architecture review
- security assessment
- compliance assessment
- test planning
- UX/content review

SmartBob consolidates their results before implementation or decision.

## Context window

Prefer concise specialist summaries and durable project artifacts. Keep the primary context focused on the objective, decisions, current state, evidence and next action.
