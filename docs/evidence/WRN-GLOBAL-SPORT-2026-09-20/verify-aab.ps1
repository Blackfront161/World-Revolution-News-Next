param([Parameter(Mandatory=$true)][string]$Stage)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$receipt = Get-Content -LiteralPath (Join-Path $Stage 'receipt.json') -Raw | ConvertFrom-Json
$aab = Join-Path (Get-Location) 'apps/mobile/android/app/build/outputs/bundle/release/app-release.aab'
$zip = [System.IO.Compression.ZipFile]::OpenRead($aab)
try {
  $assets = @($zip.Entries | Where-Object { $_.FullName.StartsWith('base/assets/') -and -not $_.FullName.EndsWith('/') })
  $vendorPath = 'apps/mobile/node_modules/@capacitor/android/capacitor/src/main/assets/native-bridge.js'
  $vendor = @{path='native-bridge.js'; bytes=(Get-Item -LiteralPath $vendorPath).Length; sha256=(Get-FileHash -LiteralPath $vendorPath -Algorithm SHA256).Hash.ToLower()}
  $expected = @($receipt.assets) + @($vendor)
  if ($assets.Count -ne $expected.Count) { throw 'AAB asset count differs from receipt plus Capacitor bridge' }
  foreach ($record in $expected) {
    $entry = $zip.GetEntry('base/assets/' + $record.path)
    if ($null -eq $entry -or $entry.Length -ne $record.bytes) { throw "Missing or resized asset: $($record.path)" }
    $stream = $entry.Open()
    $hash = [System.Security.Cryptography.SHA256]::Create()
    try { $digest = [Convert]::ToHexString($hash.ComputeHash($stream)).ToLower() } finally { $stream.Dispose(); $hash.Dispose() }
    if ($digest -ne $record.sha256) { throw "Asset hash differs: $($record.path)" }
  }
  $signatures = @($zip.Entries | Where-Object { $_.FullName -match '^META-INF/[^/]+\.(SF|RSA|DSA|EC)$' })
  if ($signatures.Count -ne 0) { throw 'Unexpected bundle signature' }
  @{ aab=$aab; sha256=(Get-FileHash -LiteralPath $aab -Algorithm SHA256).Hash.ToLower(); bytes=(Get-Item -LiteralPath $aab).Length; assetsVerified=$assets.Count; signatureEntries=0; sourceCommit=$receipt.sourceCommit; stage=$Stage } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Stage 'aab-verification.json') -Encoding utf8
  Get-Content -LiteralPath (Join-Path $Stage 'aab-verification.json')
} finally { $zip.Dispose() }
