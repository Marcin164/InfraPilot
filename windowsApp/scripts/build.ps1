# Build pipeline:
#   1. PyInstaller --onefile -> dist\infrapilot-agent.exe
#   2. Inno Setup compiles installer\installer.iss -> installer\Output\InfraPilotAgentSetup-*.exe
#
# Requires:
#   - Python 3.10+ on PATH
#   - Inno Setup 6 (iscc.exe) at the default path or via -Iscc

param(
    [string] $Python = "python",
    [string] $Iscc   = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    [switch] $Clean,
    [switch] $SkipInstaller
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Format-CmdArg([string] $Value) {
    if ($Value -match '[\s"]') {
        return '"' + ($Value -replace '"', '""') + '"'
    }
    return $Value
}

function Invoke-Native {
    param(
        [Parameter(Mandatory)][string] $Exe,
        [Parameter(ValueFromRemainingArguments = $true)] $Args
    )
    # Routed through cmd.exe with stderr merged into stdout *before* it
    # reaches PowerShell. PowerShell itself treats any stderr line from a
    # native exe as an error-stream record (worse on 7.3+, which can make
    # it terminating) -- pip/PyInstaller log routine INFO/DEBUG progress to
    # stderr, so without this every build would print scary false-positive
    # errors (or outright abort) despite succeeding. $LASTEXITCODE below
    # still reflects the wrapped command's real exit code.
    $commandLine = (@($Exe) + $Args | ForEach-Object { Format-CmdArg([string]$_) }) -join ' '
    cmd /c "$commandLine 2>&1"
    if ($LASTEXITCODE -ne 0) {
        throw "$Exe exited with code $LASTEXITCODE"
    }
}

if ($Clean) {
    Remove-Item -Recurse -Force "$root\build", "$root\dist", "$root\installer\Output" `
        -ErrorAction SilentlyContinue
}

Push-Location $root
try {
    Invoke-Native $Python -m pip install --upgrade pip
    Invoke-Native $Python -m pip install -r requirements.txt pyinstaller

    Write-Host "Building infrapilot-agent.exe..." -ForegroundColor Cyan
    Invoke-Native $Python -m PyInstaller `
        --noconfirm --onefile --console `
        --name infrapilot-agent `
        -p . `
        agent\main.py

    if ($SkipInstaller) {
        Write-Host "Skipping Inno Setup (use without -SkipInstaller to ship)." -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $Iscc)) {
        throw @"
Inno Setup compiler not found at:
    $Iscc

Install Inno Setup 6 from https://jrsoftware.org/isinfo.php
(or pass -Iscc <path>). Use -SkipInstaller to stop after building the .exe.
"@
    }

    Write-Host "Compiling Inno Setup installer..." -ForegroundColor Cyan
    Invoke-Native $Iscc /Qp "$root\installer\installer.iss"

    Write-Host ""
    Write-Host "Build complete." -ForegroundColor Green
    Write-Host "  Agent:     $root\dist\infrapilot-agent.exe"
    Get-ChildItem "$root\installer\Output\*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host ("  Installer: {0}" -f $_.FullName) -ForegroundColor Green
    }
} finally {
    Pop-Location
}
