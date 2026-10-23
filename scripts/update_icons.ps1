Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\PC\Downloads\Astroparihar (1)\Astroparihar\1024x1024.png"
$assetsEmblem = "C:\Users\PC\Desktop\astroparihar-app\assets\images\app_logo_emblem.png"

# 1. Copy master 1024x1024 to assets/images/app_logo_emblem.png
Copy-Item -Path $sourcePath -Destination $assetsEmblem -Force
Write-Host "Copied master icon to assets/images/app_logo_emblem.png"

# 2. Function to resize with high quality bicubic
function Resize-Image($srcPath, $dstPath, $w, $h) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $dstImg = New-Object System.Drawing.Bitmap($w, $h)
    $graphics = [System.Drawing.Graphics]::FromImage($dstImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($srcImg, 0, 0, $w, $h)
    $dstImg.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $dstImg.Dispose()
    $srcImg.Dispose()
    Write-Host "Generated: $dstPath ($w x $h)"
}

$resDir = "C:\Users\PC\Desktop\astroparihar-app\android\app\src\main\res"

$sizes = @(
    @{ Folder = "mipmap-mdpi"; Dim = 48 },
    @{ Folder = "mipmap-hdpi"; Dim = 72 },
    @{ Folder = "mipmap-xhdpi"; Dim = 96 },
    @{ Folder = "mipmap-xxhdpi"; Dim = 144 },
    @{ Folder = "mipmap-xxxhdpi"; Dim = 192 }
)

foreach ($entry in $sizes) {
    $dirPath = Join-Path $resDir $entry.Folder
    if (Test-Path $dirPath) {
        $icPath = Join-Path $dirPath "ic_launcher.png"
        $icRoundPath = Join-Path $dirPath "ic_launcher_round.png"
        Resize-Image $sourcePath $icPath $entry.Dim $entry.Dim
        Copy-Item -Path $icPath -Destination $icRoundPath -Force
    }
}

Write-Host "All icons updated successfully with crystal-clear high quality!"
