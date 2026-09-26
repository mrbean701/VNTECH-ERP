# Compile-verify java-backend when Maven is unavailable.
#
# Why: `mvn package` is blocked by the sandbox writing to C:\Users\PC\.m2, and `mvn -o` is missing
# artifacts in the local repo. Substitute: extract the already-built fat JAR (web/target/*.jar) to get
# every dependency, then compile ALL main sources of the 4 modules with javac. This catches type and
# signature errors ACROSS modules (for example, adding a method to an output port).
#
# NOTE: this is a COMPILE check, not a runtime check. The JAR must still be repackaged with Maven in an
# environment allowed to write .m2 before any change takes effect at runtime.
$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$jar  = Join-Path $repo "java-backend\web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar"
$jdk  = "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin"
$javac   = Join-Path $jdk "javac.exe"
$jarExe  = Join-Path $jdk "jar.exe"

foreach ($p in @($jar, $javac, $jarExe)) {
  if (-not (Test-Path $p)) { Write-Host "MISSING: $p" -ForegroundColor Red; exit 2 }
}

$work = Join-Path $repo "_javac-verify"
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

Write-Host "1/4 Extracting fat JAR for dependency libraries..."
Push-Location $work
& $jarExe xf $jar
Pop-Location
if (-not (Test-Path (Join-Path $work "BOOT-INF\lib"))) {
  Write-Host "BOOT-INF\lib not found after extraction." -ForegroundColor Red; exit 2
}

Write-Host "2/4 Collecting main sources (skipping src/test)..."
$sources = Get-ChildItem -Path (Join-Path $repo "java-backend") -Recurse -Filter *.java |
  Where-Object { $_.FullName -notmatch '\\src\\test\\' } |
  Select-Object -ExpandProperty FullName
$srcList = Join-Path $work "sources.txt"
# javac argfile rules: (1) MUST be UTF-8 WITHOUT BOM, otherwise javac reads the first path as a flag
# ("error: invalid flag: ?D:\..."); (2) paths are split on whitespace, so any path containing a space
# MUST be quoted -- this repo path contains spaces ("13. Duong Trong Thang").
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$quoted = $sources | ForEach-Object { '"' + $_.Replace('\', '/') + '"' }
[System.IO.File]::WriteAllLines($srcList, $quoted, $utf8NoBom)
Write-Host ("    {0} .java files" -f $sources.Count)

Write-Host "3/4 Compiling..."
$libPattern = Join-Path $work "BOOT-INF\lib\*"
$cp = (Join-Path $work "BOOT-INF\classes") + ";" + $libPattern
$out = Join-Path $work "out"
New-Item -ItemType Directory -Path $out | Out-Null

$log = Join-Path $work "javac.log"
# javac writes notes/warnings to STDERR. PowerShell 5.1 turns native stderr into an ErrorRecord, and with
# ErrorActionPreference=Stop that aborts the script even when the compile SUCCEEDED. Capture both streams
# into the log and judge the result ONLY by the process exit code plus real "error:" lines.
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $javac -nowarn -encoding UTF-8 -d $out -cp $cp "@$srcList" > $log 2>&1
$code = $LASTEXITCODE
$ErrorActionPreference = $prevEap
$errorCount = 0
if (Test-Path $log) {
  $errorCount = (Select-String -Path $log -Pattern "error:" -SimpleMatch -ErrorAction SilentlyContinue | Measure-Object).Count
}
$classCount = (Get-ChildItem -Path $out -Recurse -Filter *.class -ErrorAction SilentlyContinue | Measure-Object).Count

Write-Host ""
if ($code -eq 0) {
  Write-Host ("4/4 RESULT: compile SUCCEEDED - {0} source files, {1} error lines, {2} .class produced." -f $sources.Count, $errorCount, $classCount) -ForegroundColor Green
} else {
  Write-Host ("4/4 RESULT: compile FAILED (exit {0}), {1} error lines. See {2}" -f $code, $errorCount, $log) -ForegroundColor Red
}
exit $code
