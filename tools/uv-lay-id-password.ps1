# [UTILITY] UltraViewer - open app + read current ID and PASSWORD (never stores the password on disk)
# Usage:  powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\uv-lay-id-password.ps1
# How it works:
#   ID  : registry  HKLM\SOFTWARE\WOW6432Node\UltraViewer -> PreferID
#   PASS: UltraViewer uses a RANDOM password living only in RAM (service log: "UseRandomPasswordFromLastRestart")
#         => not in any file/registry. Must read the app window controls via UI Automation.
#   Which field is which is decided by POSITION: left column "Allow control" has 2 rows
#         upper row (smaller Y) = ID ; lower row = PASSWORD. Right column ("Control other computer") is usually empty.
$ErrorActionPreference = 'Stop'
$exe = "C:\Program Files (x86)\UltraViewer\UltraViewer_Desktop.exe"

# --- 1) start the app if needed ---
$proc = Get-Process UltraViewer_Desktop -ErrorAction SilentlyContinue
if (-not $proc) {
  if (Test-Path $exe) { Start-Process -FilePath $exe; Write-Host "[i] started UltraViewer_Desktop.exe"; Start-Sleep -Seconds 12 }
  else { Write-Host "[x] not found: $exe"; exit 1 }
} else { Write-Host "[i] UltraViewer_Desktop already running (PID $($proc.Id -join ', '))" }

# --- 2) ID from registry ---
$id = (Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\UltraViewer' -ErrorAction SilentlyContinue).PreferID
Write-Host "[i] ID (registry PreferID) = $id"

# --- 3) password from the app window via UI Automation ---
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$root = [System.Windows.Automation.AutomationElement]::RootElement
$win = $null
foreach ($e in $root.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)) {
  if ($e.Current.Name -match '^UltraViewer') { $win = $e; break }
}
if (-not $win) { Write-Host "[x] UltraViewer window not found"; exit 1 }
Write-Host "[i] window: $($win.Current.Name)"

$fields = foreach ($e in $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)) {
  $n = $e.Current.Name
  if ($n -and $n -match '^[0-9 ]+$') {
    [pscustomobject]@{ Name = $n.Trim(); X = [int]$e.Current.BoundingRectangle.X; Y = [int]$e.Current.BoundingRectangle.Y }
  }
}
if (-not $fields) { Write-Host "[x] no numeric fields found"; exit 1 }

$left = @($fields | Sort-Object X | Select-Object -First 2)
if ($left.Count -ge 2) {
  $top = @($left | Sort-Object Y | Select-Object -First 1)[0]
  $bot = @($left | Sort-Object Y | Select-Object -Last 1)[0]
  Write-Host ""
  Write-Host "=============== RESULT ==============="
  Write-Host ("ID       : {0}" -f ($top.Name -replace ' ', ''))
  Write-Host ("PASSWORD : {0}" -f $bot.Name)
  Write-Host "======================================"
  Write-Host "(random password of the CURRENT session - it changes after restarting the app or the PC)"
} else {
  Write-Host "[!] only $($fields.Count) numeric field(s): $($fields.Name -join ' | ')"
}
