#!/usr/bin/env python3
import argparse,json
from datetime import datetime,timezone
from pathlib import Path
LOG=Path(".bob/orchestration/execution-events.jsonl")
p=argparse.ArgumentParser(); s=p.add_subparsers(dest="cmd",required=True)
for cmd,event,status in [("start","task.started","RUNNING"),("done","task.succeeded","SUCCEEDED")]:
    q=s.add_parser(cmd); q.add_argument("--run",required=True); q.add_argument("--task",required=True); q.add_argument("--agent",required=True); q.add_argument("--wave"); q.set_defaults(event=event,status=status)
q=s.add_parser("show"); q.add_argument("--run",required=True)
a=p.parse_args()
if a.cmd!="show":
    LOG.parent.mkdir(parents=True,exist_ok=True)
    e={"event":a.event,"run_id":a.run,"task_id":a.task,"agent":a.agent,"wave":a.wave,"status":a.status,"timestamp":datetime.now(timezone.utc).isoformat()}
    with LOG.open("a",encoding="utf-8") as f:f.write(json.dumps(e)+"\n")
    print(json.dumps(e,indent=2))
else:
    if LOG.exists():
        for line in LOG.read_text(encoding="utf-8").splitlines():
            e=json.loads(line)
            if e["run_id"]==a.run: print(e["timestamp"],"wave="+str(e.get("wave")),e["event"],e["task_id"],e["agent"],e["status"])
    else: print("No execution events found.")
