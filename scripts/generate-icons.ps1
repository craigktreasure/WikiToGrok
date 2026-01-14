# Generate PNG icons from SVG source using ImageMagick
# Requires: ImageMagick (magick command)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$svgSource = Join-Path $PSScriptRoot "icon.svg"
$outputDir = Join-Path $projectRoot "public\icons"

# Icon sizes required for Chrome/Edge extensions
$sizes = @(16, 32, 48, 128)

Write-Host "Generating icons from $svgSource" -ForegroundColor Cyan

# Ensure output directory exists
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir"
}

# Generate each size
foreach ($size in $sizes) {
    $outputFile = Join-Path $outputDir "icon$size.png"
    Write-Host "  Generating ${size}x${size}..." -NoNewline
    
    magick $svgSource -resize "${size}x${size}" $outputFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nAll icons generated successfully!" -ForegroundColor Green
Write-Host "Output directory: $outputDir"
