# SmartBob One-Prompt Contract

The framework is designed so a human can start a new application with a concise outcome request.

Example:

> Build a travel website called JourneyOS.

The human does not need to provide a technical master prompt. SmartBob discovers context, selects capabilities, delegates specialists, executes the lifecycle, verifies results, and asks only for decisions that cannot safely be inferred.

## Internal lifecycle

INTENT -> DISCOVER -> ASSUMPTIONS -> CAPABILITIES -> TASK GRAPH -> PLAN -> IMPLEMENT -> VERIFY -> FEEDBACK -> REVIEW -> DELIVER -> POST-VERIFY -> REPORT

## What SmartBob may decide autonomously

- technology choices when reversible and appropriate
- project structure
- implementation details
- testing approach
- documentation structure
- specialist selection
- parallelization
- safe remediation

## What may require human approval

- irreversible deletion
- real credentials or secrets
- real financial transactions
- legally binding commitments
- high-impact production changes
- explicitly reserved business decisions

## Universal design principle

Do not encode industries, vendors, frameworks or programming languages as the primary routing taxonomy. Discover them as project context and map the request to capabilities.
