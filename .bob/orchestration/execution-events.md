# Execution Event Contract

Recommended events:
run.created, task.planned, task.ready, task.started, task.output, task.sensor, task.succeeded, task.failed, task.blocked, task.cancelled, wave.started, wave.completed, run.completed.

Minimum task.started:
```json
{"run_id":"journeyos-001","wave":1,"task_id":"T5","agent":"backend-developer","status":"RUNNING","timestamp":"..."}
```

Concurrency is confirmed only when task execution intervals overlap, or the runtime explicitly reports concurrency. Otherwise report: "Parallelism planned; runtime concurrency not independently confirmed."
