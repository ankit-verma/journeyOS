# SmartBob Bob Mode Imports

IBM Bob's **Import Mode** UI accepts exactly one mode per import file.

Use these files one at a time:

1. `smartbob.yaml`
2. `bobceo.yaml`
3. `bobcompliance.yaml`
4. `bobops.yaml`
5. `bobsales.yaml`
6. `bobkt.yaml`
7. `bobresearch.yaml`
8. `bobfinance.yaml`
9. `bobdata.yaml`
10. `bobmigrate.yaml`

For each file:
- Bob → Settings → Modes → Import Mode
- Select the file
- Choose the target scope
- Import

The project-level `.bob/custom_modes.yaml` contains all modes together and is intended to be placed in the project, not passed through the one-mode Import Mode dialog.

The standalone import files each contain exactly:
```yaml
customModes:
  - <one mode>
```
