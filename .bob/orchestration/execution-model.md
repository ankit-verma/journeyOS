# SmartBob Execution Model

SmartBob separates orchestration intent from runtime evidence.

INTENT → DISCOVERY → CAPABILITY MAP → TASK GRAPH → PARALLEL WAVES → EXECUTION → SENSORS → FEEDBACK → RECOVERY → DELIVERY → FINAL VERIFICATION

States: PLANNED, READY, RUNNING, WAITING, SUCCEEDED, FAILED, BLOCKED, CANCELLED.

Never report RUNNING or concurrent execution unless runtime evidence exists.
