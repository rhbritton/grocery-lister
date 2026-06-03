# Generates Google Play store graphics from website/images/logo_color.png
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent (Split-Path -Parent $root)
$logoPath = Join-Path $repoRoot 'website/images/logo_color.png'
$outDir = $PSScriptRoot

$brand = [System.Drawing.Color]::FromArgb(255, 25, 118, 210)
$brandDark = [System.Drawing.Color]::FromArgb(255, 21, 101, 192)
$dark = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
$white = [System.Drawing.Color]::White

function Save-Png($bitmap, $path) {
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Host "Wrote $path"
}

function Draw-LogoCentered($graphics, $logo, $canvasW, $canvasH, $maxLogoW, $maxLogoH) {
    $scale = [Math]::Min($maxLogoW / $logo.Width, $maxLogoH / $logo.Height)
    $w = [int]($logo.Width * $scale)
    $h = [int]($logo.Height * $scale)
    $x = [int](($canvasW - $w) / 2)
    $y = [int](($canvasH - $h) / 2)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($logo, $x, $y, $w, $h)
}

$logo = [System.Drawing.Image]::FromFile($logoPath)

# 512x512 app icon — zoomed so the mark reads at small sizes (~85% of canvas).
$icon = New-Object System.Drawing.Bitmap 512, 512
$iconG = [System.Drawing.Graphics]::FromImage($icon)
$iconG.Clear($white)
Draw-LogoCentered $iconG $logo 512 512 460 412
$iconG.Dispose()
Save-Png $icon (Join-Path $outDir 'play-store-icon-512.png')

# 1024x500 feature graphic — brand gradient + logo + text
$feature = New-Object System.Drawing.Bitmap 1024, 500
$fg = [System.Drawing.Graphics]::FromImage($feature)
$rect = New-Object System.Drawing.Rectangle 0, 0, 1024, 500
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $brand, $brandDark, 35
$fg.FillRectangle($brush, $rect)
$brush.Dispose()

$logoMaxW = 220
$logoMaxH = 200
$scale = [Math]::Min($logoMaxW / $logo.Width, $logoMaxH / $logo.Height)
$lw = [int]($logo.Width * $scale)
$lh = [int]($logo.Height * $scale)
$lx = 80
$ly = [int]((500 - $lh) / 2)
$fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$fg.DrawImage($logo, $lx, $ly, $lw, $lh)

$titleFont = New-Object System.Drawing.Font 'Segoe UI', 52, ([System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font 'Segoe UI', 24, ([System.Drawing.FontStyle]::Regular)
$fg.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$fg.DrawString('GroceryLister', $titleFont, [System.Drawing.Brushes]::White, 340, 165)
$fg.DrawString('Recipe-powered grocery lists', $subFont, [System.Drawing.Brushes]::White, 342, 245)
$fg.DrawString('Aisle sorted · Share by link · Offline sync', $subFont, [System.Drawing.Brushes]::White, 342, 290)

$titleFont.Dispose()
$subFont.Dispose()
$fg.Dispose()
$logo.Dispose()
Save-Png $feature (Join-Path $outDir 'play-store-feature-1024x500.png')

Write-Host 'Done.'
