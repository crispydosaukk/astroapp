Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " AstroParihar - Safe Low-Resource APK Build" -ForegroundColor Yellow
Write-Host " Tuned specifically to prevent laptop freeze" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$androidDir = "C:\Users\PC\Desktop\astroparihar-app\android"

# Set process priority to BelowNormal so the system stays responsive
$process = [System.Diagnostics.Process]::GetCurrentProcess()
$process.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal

# 1. Clean previous build caches that cause memory leaks
Write-Host "`n[1/3] Preparing build environment..." -ForegroundColor Cyan
$apkSource = "C:\Users\PC\Desktop\astroparihar-app\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkSource) {
    Remove-Item -Path $apkSource -Force
    Write-Host "Removed previous APK output to ensure clean fresh build."
}
Set-Location $androidDir

# 2. Run Gradle with isolated user home to prevent lock collisions with IDE
Write-Host "[2/3] Building release APK (single worker, low memory, skipping lint, isolated user home)..." -ForegroundColor Cyan
cmd.exe /c "gradlew.bat assembleRelease --no-daemon --max-workers=1 --gradle-user-home C:\Users\PC\.gradle-cli -x lint -x lintVitalRelease -x lintVitalAnalyzeRelease"

# 3. Check and copy the output APK to Desktop & project root
$apkSource = "C:\Users\PC\Desktop\astroparihar-app\android\app\build\outputs\apk\release\app-release.apk"
$apkDesktop = "C:\Users\PC\Desktop\AstroParihar-Latest.apk"
$apkProjectLatest = "C:\Users\PC\Desktop\astroparihar-app\AstroParihar-Latest.apk"
$apkProjectV1 = "C:\Users\PC\Desktop\astroparihar-app\AstroParihar-v1.0.0.apk"

if (Test-Path $apkSource) {
    Copy-Item -Path $apkSource -Destination $apkDesktop -Force
    Copy-Item -Path $apkSource -Destination $apkProjectLatest -Force
    Copy-Item -Path $apkSource -Destination $apkProjectV1 -Force
    $sizeMB = [math]::Round((Get-Item $apkDesktop).Length / 1MB, 2)
    Write-Host "`n[3/3] SUCCESS! Release APK generated successfully ($sizeMB MB):" -ForegroundColor Green
    Write-Host "  -> Desktop: $apkDesktop" -ForegroundColor Yellow
    Write-Host "  -> Project: $apkProjectLatest" -ForegroundColor Yellow
} else {
    Write-Host "`nAPK build did not produce output at expected location. Check Gradle logs above." -ForegroundColor Red
}
