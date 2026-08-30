param(
  [Parameter(Mandatory=$true)][string]$ProjectPath,
  [switch]$DryRun
)
$ErrorActionPreference="Stop"
$FrameworkRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
$Project=(Resolve-Path $ProjectPath).Path
$Source=Join-Path $FrameworkRoot ".bob"
if(!(Test-Path $Source)){throw "Framework .bob not found."}
if(!(Test-Path $Project)){throw "Project not found: $Project"}

$stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$backup=Join-Path $Project ".smartbob-backups\$stamp"
$projectBob=Join-Path $Project ".bob"

Write-Host "SmartBob Framework v1 Safe Installer" -ForegroundColor Cyan
Write-Host "Project: $Project"
Write-Host "Mode: $(if($DryRun){'DRY RUN'}else{'INSTALL'})"

if(Get-Command git -ErrorAction SilentlyContinue){
  # Avoid terminating on git's normal non-repository exit code.
  cmd /c "git -C `"$Project`" rev-parse --is-inside-work-tree >nul 2>nul"
  $gitExit = $LASTEXITCODE
  if($gitExit -eq 0){
    Write-Host "[ OK ] Git repository detected." -ForegroundColor Green
  } else {
    Write-Host "[WARN] Project is not a Git worktree. Continuing safely." -ForegroundColor Yellow
  }
} else {
  Write-Host "[WARN] Git is not installed/on PATH. Continuing safely." -ForegroundColor Yellow
}

if((Test-Path $projectBob) -and !$DryRun){
  New-Item -ItemType Directory -Force $backup | Out-Null
  Copy-Item $projectBob (Join-Path $backup ".bob") -Recurse -Force
  Write-Host "[ OK ] Existing .bob backed up to $backup\.bob" -ForegroundColor Green
}

Get-ChildItem $Source -Recurse -File | ForEach-Object {
  $rel=$_.FullName.Substring($Source.Length).TrimStart('\','/')
  $dest=Join-Path $Project ".bob\$rel"

  if($rel -in @("mcp.json","settings.json")){
    Write-Host "[ OK ] Preserved project file: .bob\$rel" -ForegroundColor Green
    return
  }

  if($rel -like "skills\*" -and (Test-Path $dest)){
    Write-Host "[ OK ] Preserved existing skill: .bob\$rel" -ForegroundColor Green
    return
  }

  if(Test-Path $dest){
    if((Get-FileHash $_.FullName).Hash -eq (Get-FileHash $dest).Hash){
      Write-Host "[ OK ] Unchanged: .bob\$rel" -ForegroundColor Green
    } else {
      Write-Host "[WARN] Conflict - PRESERVED existing file: .bob\$rel" -ForegroundColor Yellow
    }
    return
  }

  if(!$DryRun){
    New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
    Copy-Item $_.FullName $dest
  }
  Write-Host "[ OK ] Would add/new: .bob\$rel" -ForegroundColor Green
}

$agents=Join-Path $Project "AGENTS.md"
$start="<!-- SMARTBOB-FRAMEWORK-START -->"
$end="<!-- SMARTBOB-FRAMEWORK-END -->"
$block=@"
$start
## SmartBob Framework Guidance
- Use EXPLORE -> PLAN -> IMPLEMENT -> VERIFY for meaningful engineering work.
- Route work to the smallest useful specialist set.
- Parallelize independent investigation.
- Treat tests, build, lint, security and review as sensors.
- Never fabricate results, approvals or external actions.
$end
"@

if(Test-Path $agents){
  $text=Get-Content $agents -Raw
  if($text.Contains($start)){Write-Host "[ OK ] SmartBob AGENTS section already present." -ForegroundColor Green}
  elseif(!$DryRun){
    Copy-Item $agents (Join-Path $backup "AGENTS.md") -Force
    Add-Content $agents "`r`n$block"
    Write-Host "[ OK ] SmartBob guidance merged into AGENTS.md." -ForegroundColor Green
  } else {Write-Host "[ OK ] Would merge SmartBob guidance into AGENTS.md." -ForegroundColor Green}
}

$required=@(".bob\custom_modes.yaml",".bob\agents\smartbob\smartbob.md",".bob\agents\ops\bobops.md",".bob\agents\compliance\bobcompliance.md",".bob\skills\engineering\verify\SKILL.md")
if($DryRun){
  foreach($r in $required){
    if(!(Test-Path (Join-Path $FrameworkRoot $r))){throw "Framework validation failed: missing source $r"}
  }
  Write-Host "`nDry run complete. No files changed." -ForegroundColor Cyan
} else {
  foreach($r in $required){
    if(!(Test-Path (Join-Path $Project $r))){throw "Installation validation failed: missing $r"}
  }
  Write-Host "`nInstallation complete. Backup: $backup" -ForegroundColor Cyan
}
