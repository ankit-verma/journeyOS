# Safe Installation

Always start with `-DryRun`.

The installer is intentionally conservative:
- existing `.bob/mcp.json` and `.bob/settings.json` are preserved
- existing skills are preserved
- any conflicting existing `.bob` file is preserved rather than overwritten
- an existing `.bob` directory is backed up before a real install
- an existing `AGENTS.md` is backed up before the marked SmartBob section is merged
- `custom_modes.yaml` is **not overwritten** when a project already has one; inspect and merge it deliberately because custom-mode schemas can be Bob-version-specific

## Windows

```powershell
.\install-smartbob.ps1 -ProjectPath "C:\path\to\project" -DryRun
.\install-smartbob.ps1 -ProjectPath "C:\path\to\project"
```

## macOS/Linux

```bash
./install-smartbob.sh /path/to/project --dry-run
./install-smartbob.sh /path/to/project
```
