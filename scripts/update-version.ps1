# Update version number across all project files
# Usage: .\update-version.ps1 -Version "1.2.3"

param(
    [Parameter(Mandatory=$true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Updating version to $Version" -ForegroundColor Cyan
Write-Host ""

# Files to update
$files = @(
    @{
        Path = Join-Path $projectRoot "package.json"
        Pattern = '"version":\s*"[^"]+"'
        Replacement = "`"version`": `"$Version`""
    },
    @{
        Path = Join-Path $projectRoot "public\manifest.json"
        Pattern = '"version":\s*"[^"]+"'
        Replacement = "`"version`": `"$Version`""
    },
    @{
        Path = Join-Path $projectRoot "README.md"
        Pattern = 'version-[\d\.]+(-\w+)?-green'
        Replacement = "version-$Version-green"
    }
)

foreach ($file in $files) {
    $relativePath = $file.Path.Replace($projectRoot, "").TrimStart("\")
    Write-Host "  Updating $relativePath..." -NoNewline

    if (-not (Test-Path $file.Path)) {
        Write-Host " NOT FOUND" -ForegroundColor Red
        continue
    }

    $content = Get-Content $file.Path -Raw
    $newContent = $content -replace $file.Pattern, $file.Replacement

    if ($content -eq $newContent) {
        Write-Host " NO CHANGE" -ForegroundColor Yellow
    } else {
        Set-Content -Path $file.Path -Value $newContent -NoNewline
        Write-Host " OK" -ForegroundColor Green
    }
}

Write-Host ""

# Update package-lock.json
Write-Host "  Updating package-lock.json..." -NoNewline
Push-Location $projectRoot
try {
    $npmOutput = npm install 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host $npmOutput
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Version updated to $Version" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test the changes"
Write-Host "  2. Commit: git add -A && git commit -m 'Bump version to $Version'"
