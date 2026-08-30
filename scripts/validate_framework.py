#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
required=[
".bob/custom_modes.yaml",
".bob/agents/smartbob/smartbob.md",
".bob/agents/ceo/bobceo.md",
".bob/agents/compliance/bobcompliance.md",
".bob/agents/ops/bobops.md",
".bob/agents/sales/bobsales.md",
".bob/agents/kt/bobkt.md",
".bob/skills/engineering/verify/SKILL.md",
"AGENTS.md",
]
missing=[x for x in required if not (root/x).exists()]
if missing:
 print("FAILED"); [print(" -",x) for x in missing]; sys.exit(1)
print("SmartBob framework structure: PASS")
try:
 import yaml
 data=yaml.safe_load((root/".bob/custom_modes.yaml").read_text())
 names=[m.get("name") for m in data.get("modes",[])]
 print("Modes:", ", ".join(names))
 if "SmartBob" not in names: raise ValueError("SmartBob mode missing")
except ImportError:
 print("PyYAML not installed; YAML semantic validation skipped.")
except Exception as e:
 print("custom_modes.yaml validation failed:",e); sys.exit(1)
