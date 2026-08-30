#!/usr/bin/env bash
set -euo pipefail
PROJECT=""
DRY=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1;;
    -h|--help) echo "Usage: $0 /path/to/project [--dry-run]"; exit 0;;
    *) [[ -z "$PROJECT" ]] && PROJECT="$a" || { echo "Unknown argument: $a"; exit 2; };;
  esac
done
[[ -n "$PROJECT" ]] || { echo "Usage: $0 /path/to/project [--dry-run]"; exit 2; }
PROJECT="$(cd "$PROJECT" && pwd)"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/.bob"
[[ -d "$SRC" ]] || { echo "Framework .bob not found"; exit 1; }

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$PROJECT/.smartbob-backups/$STAMP"
echo "SmartBob Framework v1 Safe Installer"
echo "Project: $PROJECT"
echo "Mode: $([[ $DRY -eq 1 ]] && echo DRY-RUN || echo INSTALL)"

if git -C "$PROJECT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then echo "[ OK ] Git repository detected."; else echo "[WARN] Not a Git worktree."; fi

if [[ -d "$PROJECT/.bob" && $DRY -eq 0 ]]; then
  mkdir -p "$BACKUP"
  cp -a "$PROJECT/.bob" "$BACKUP/.bob"
  echo "[ OK ] Existing .bob backed up to $BACKUP/.bob"
fi

while IFS= read -r -d '' f; do
  rel="${f#$SRC/}"
  dest="$PROJECT/.bob/$rel"
  if [[ "$rel" == "mcp.json" || "$rel" == "settings.json" ]]; then echo "[ OK ] Preserved .bob/$rel"; continue; fi
  if [[ "$rel" == skills/* && -e "$dest" ]]; then echo "[ OK ] Preserved existing skill .bob/$rel"; continue; fi
  if [[ $DRY -eq 0 ]]; then mkdir -p "$(dirname "$dest")"; cp "$f" "$dest"; fi
  echo "[ OK ] Add/update .bob/$rel"
done < <(find "$SRC" -type f -print0)

AGENTS="$PROJECT/AGENTS.md"
START="<!-- SMARTBOB-FRAMEWORK-START -->"
if [[ -f "$AGENTS" ]]; then
  if grep -q "$START" "$AGENTS"; then echo "[ OK ] SmartBob AGENTS section already present."
  elif [[ $DRY -eq 0 ]]; then
    mkdir -p "$BACKUP"; cp "$AGENTS" "$BACKUP/AGENTS.md"
    cat >> "$AGENTS" <<'EOF'

<!-- SMARTBOB-FRAMEWORK-START -->
## SmartBob Framework Guidance
- Use EXPLORE -> PLAN -> IMPLEMENT -> VERIFY for meaningful engineering work.
- Route work to the smallest useful specialist set.
- Parallelize independent investigation.
- Treat tests, build, lint, security and review as sensors.
- Never fabricate results, approvals or external actions.
<!-- SMARTBOB-FRAMEWORK-END -->
EOF
    echo "[ OK ] SmartBob guidance merged into AGENTS.md."
  else echo "[ OK ] Would merge SmartBob guidance into AGENTS.md."; fi
fi

for r in ".bob/custom_modes.yaml" ".bob/agents/smartbob/smartbob.md" ".bob/agents/ops/bobops.md" ".bob/agents/compliance/bobcompliance.md" ".bob/skills/engineering/verify/SKILL.md"; do
  [[ -e "$PROJECT/$r" ]] || { echo "Validation failed: missing $r"; exit 1; }
done
echo "[ OK ] Framework structure validated."
[[ $DRY -eq 1 ]] && echo "Dry run complete. No files changed." || echo "Installation complete. Backup: $BACKUP"
