# Dependency Graph Contract

Represent autonomous builds as dependency graphs.

Each task has: task_id, capability, agent, skills, dependencies, wave, inputs, outputs, sensors, status.

Example:
T1 requirements []
T2 technology []
T3 architecture []
T4 compliance []
T5 backend [T1,T3]
T6 frontend [T1,T3]
T7 data [T1,T3]
T8 security [T1,T3]
T9 integration-tests [T5,T6,T7]
T10 security-verify [T5,T6,T7,T8]
T11 deploy [T9,T10]

The graph is a plan, not proof of concurrency. Runtime events provide that proof.
