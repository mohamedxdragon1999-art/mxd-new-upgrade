# MXD Word Search Generator - Download CDN Dependencies
$ErrorActionPreference = "Stop"
$libsDir = Join-Path $PSScriptRoot "libs"

if (-not (Test-Path $libsDir)) {
    Write-Host "Creating libs directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $libsDir | Out-Null
}

$downloads = @(
    @{Name="React"; Url="https://unpkg.com/react@18/umd/react.production.min.js"; File="react.production.min.js"},
    @{Name="React DOM"; Url="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"; File="react-dom.production.min.js"},
    @{Name="Babel Standalone"; Url="https://unpkg.com/@babel/standalone/babel.min.js"; File="babel.min.js"},
    @{Name="html2canvas"; Url="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; File="html2canvas.min.js"},
    @{Name="JSZip"; Url="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; File="jszip.min.js"}
)

$successCount = 0
$failCount = 0

foreach ($dl in $downloads) {
    $filePath = Join-Path $libsDir $dl.File
    
    if (Test-Path $filePath) {
        $size = (Get-Item $filePath).Length
        $sizeKB = [math]::Round($size/1024, 1)
        Write-Host ("OK " + $dl.Name + " already exists (" + $sizeKB + " KB)") -ForegroundColor Green
        $successCount++
        continue
    }
    
    Write-Host ("Downloading " + $dl.Name + "...") -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $dl.Url -OutFile $filePath -UseBasicParsing
        $size = (Get-Item $filePath).Length
        $sizeKB = [math]::Round($size/1024, 1)
        Write-Host ("  OK Downloaded (" + $sizeKB + " KB)") -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host ("  FAIL " + $_.Exception.Message) -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Download Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ("Success: " + $successCount) -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host ("Failed: " + $failCount) -ForegroundColor Red
    Write-Host "Check your internet connection and try again." -ForegroundColor Yellow
} else {
    Write-Host "All dependencies downloaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run the app offline by double-clicking index.html" -ForegroundColor Cyan
}
Write-Host ""
