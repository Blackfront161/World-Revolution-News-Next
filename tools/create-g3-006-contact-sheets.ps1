$ErrorActionPreference = 'Stop'

$evidenceRoot = Join-Path $PSScriptRoot '..\docs\evidence\WRN-G3-006'
$candidate = '206a7e1'
$date = '2026-08-24'

function New-ContactSheet {
  param(
    [string]$Client,
    [int]$Columns
  )

  $files = Get-ChildItem -LiteralPath $evidenceRoot -Filter "$candidate`_$Client`_*.png" |
    Sort-Object Name
  if ($files.Count -eq 0) { throw "Keine $Client-Screenshots gefunden." }

  $tileWidth = 460
  $tileHeight = 610
  $rows = [Math]::Ceiling($files.Count / $Columns)
  $bitmap = [System.Drawing.Bitmap]::new($Columns * $tileWidth, $rows * $tileHeight)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::FromArgb(15, 20, 30))
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  for ($index = 0; $index -lt $files.Count; $index += 1) {
    $image = [System.Drawing.Image]::FromFile($files[$index].FullName)
    try {
      $column = $index % $Columns
      $row = [Math]::Floor($index / $Columns)
      $x = $column * $tileWidth + 10
      $y = $row * $tileHeight + 10
      $availableWidth = $tileWidth - 20
      $availableHeight = $tileHeight - 20
      $ratio = [Math]::Min($availableWidth / $image.Width, $availableHeight / $image.Height)
      $width = [int]($image.Width * $ratio)
      $height = [int]($image.Height * $ratio)
      $graphics.DrawImage($image, $x + [int](($availableWidth - $width) / 2), $y, $width, $height)
    }
    finally {
      $image.Dispose()
    }
  }

  try {
    $bitmap.Save((Join-Path $evidenceRoot "$candidate`_$Client`_contact-sheet_$date.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

Add-Type -AssemblyName System.Drawing
New-ContactSheet -Client 'app' -Columns 2
New-ContactSheet -Client 'website' -Columns 2
