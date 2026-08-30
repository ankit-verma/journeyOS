# Planning Rules

- Modes are stateless configurations that reference rules and agent directories.
- Rules should load additively and avoid hidden precedence.
- Capability stack: Mode -> Agent -> Skill -> Tool -> Sensor.
- Skills are reusable procedures; project/domain context comes from project evidence and adapters.
- Add new capability agents only when a genuinely distinct responsibility is required.
- The installer uses preserve-first conflict handling.
- Engineering lifecycle coverage should span requirements, architecture, interfaces, implementation, testing, security, CI/CD, infrastructure, deployment, observability and incident response as applicable.
- The verify capability is a key exit gate for material engineering changes.
