# Custom Modes Import

IBM Bob's project/global configuration uses a `customModes` YAML array, but the **Import Mode** dialog validates an imported file as a single mode.

Therefore SmartBob ships both:
- `.bob/custom_modes.yaml` — all SmartBob modes for project configuration
- `bob-mode-imports/*.yaml` — one mode per file for the Bob UI Import Mode dialog

Do not import the combined file through Import Mode. Import the individual mode files instead.
