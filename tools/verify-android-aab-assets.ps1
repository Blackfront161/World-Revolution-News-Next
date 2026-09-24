param(
    [Parameter(Mandatory = $true)][string]$StageDirectory,
    [Parameter(Mandatory = $true)][string]$ReceiptPath,
    [Parameter(Mandatory = $true)][string]$AabPath,
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Resolve-RegularFile([string]$Path, [string]$Label) {
    $resolved = (Resolve-Path -LiteralPath $Path).Path
    $item = Get-Item -LiteralPath $resolved -Force
    if (-not $item.PSIsContainer -and -not ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { return $resolved }
    throw "$Label must be a regular file"
}

function Resolve-PlainDirectory([string]$Path, [string]$Label) {
    $resolved = (Resolve-Path -LiteralPath $Path).Path
    $item = Get-Item -LiteralPath $resolved -Force
    if ($item.PSIsContainer -and -not ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { return $resolved.TrimEnd([IO.Path]::DirectorySeparatorChar) }
    throw "$Label must be a plain directory"
}

function Get-StreamSha256([IO.Stream]$Stream) {
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try { return ([Convert]::ToHexString($algorithm.ComputeHash($Stream))).ToLowerInvariant() }
    finally { $algorithm.Dispose() }
}

$stage = Resolve-PlainDirectory $StageDirectory 'Stage directory'
$receiptFile = Resolve-RegularFile $ReceiptPath 'Receipt'
$aabFile = Resolve-RegularFile $AabPath 'AAB'
$receipt = Get-Content -Raw -LiteralPath $receiptFile | ConvertFrom-Json
if ($receipt.schema -ne 'wrn.android-release-preparation.v1' -or $receipt.dirty.rejected -or $receipt.assetsDirectory -ne 'native-assets') { throw 'Receipt is not an accepted Android release preparation' }
$expectedStage = Join-Path (Split-Path $receiptFile -Parent) $receipt.assetsDirectory
if ((Resolve-Path -LiteralPath $expectedStage).Path.TrimEnd([IO.Path]::DirectorySeparatorChar) -cne $stage) { throw 'Stage is not bound to the supplied receipt' }
$manifestFile = Resolve-RegularFile (Join-Path (Split-Path $receiptFile -Parent) 'native-assets.json') 'Native asset manifest'
$manifest = @(Get-Content -Raw -LiteralPath $manifestFile | ConvertFrom-Json)
if ($manifest.Count -lt 1 -or $manifest.Count -ne @($receipt.assets).Count) { throw 'Receipt and native asset manifest counts differ' }

$receiptExpected = @{}
foreach ($entry in @($receipt.assets)) {
    if ($entry.path -notmatch '^[A-Za-z0-9._/-]+$' -or $entry.path -match '(^|/)(\.|\.\.)(/|$)' -or $receiptExpected.ContainsKey($entry.path)) { throw 'Receipt contains an unsafe or duplicate asset path' }
    if ($entry.bytes -lt 0 -or $entry.sha256 -notmatch '^[a-f0-9]{64}$') { throw 'Receipt asset entry is invalid' }
    $receiptExpected[$entry.path] = [ordered]@{ bytes = [long]$entry.bytes; sha256 = [string]$entry.sha256 }
}

$expected = @{}
foreach ($entry in $manifest) {
    if ($entry.path -notmatch '^[A-Za-z0-9._/-]+$' -or $entry.path -match '(^|/)(\.|\.\.)(/|$)' -or $expected.ContainsKey($entry.path)) { throw 'Native asset manifest contains an unsafe or duplicate path' }
    if ($entry.bytes -lt 0 -or $entry.sha256 -notmatch '^[a-f0-9]{64}$') { throw 'Native asset manifest entry is invalid' }
    if (-not $receiptExpected.ContainsKey($entry.path) -or $receiptExpected[$entry.path].bytes -ne [long]$entry.bytes -or $receiptExpected[$entry.path].sha256 -cne [string]$entry.sha256) { throw "Native asset manifest is not bound to receipt: $($entry.path)" }
    $stageFile = Resolve-RegularFile (Join-Path $stage ($entry.path -replace '/', [IO.Path]::DirectorySeparatorChar)) "Stage asset $($entry.path)"
    $stageItem = Get-Item -LiteralPath $stageFile
    $stageHash = (Get-FileHash -LiteralPath $stageFile -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($stageItem.Length -ne $entry.bytes -or $stageHash -cne $entry.sha256) { throw "Stage asset mismatch: $($entry.path)" }
    $expected[$entry.path] = [ordered]@{ bytes = [long]$entry.bytes; sha256 = [string]$entry.sha256 }
}
if ($expected.Count -ne $receiptExpected.Count) { throw 'Native asset manifest does not exactly cover receipt assets' }

$zip = [IO.Compression.ZipFile]::OpenRead($aabFile)
try {
    $actualEntries = @($zip.Entries | Where-Object { $_.FullName.StartsWith('base/assets/', [StringComparison]::Ordinal) -and -not $_.FullName.EndsWith('/', [StringComparison]::Ordinal) })
    if ($actualEntries.Count -ne $expected.Count) { throw "AAB asset count differs: expected $($expected.Count), got $($actualEntries.Count)" }
    $verified = foreach ($relative in ($expected.Keys | Sort-Object)) {
        $name = "base/assets/$relative"
        $matches = @($actualEntries | Where-Object { $_.FullName -ceq $name })
        if ($matches.Count -ne 1) { throw "Missing or duplicate AAB asset: $relative" }
        $entry = $matches[0]
        if ($entry.Length -ne $expected[$relative].bytes) { throw "AAB asset length mismatch: $relative" }
        $stream = $entry.Open()
        try { $hash = Get-StreamSha256 $stream } finally { $stream.Dispose() }
        if ($hash -cne $expected[$relative].sha256) { throw "AAB asset hash mismatch: $relative" }
        [ordered]@{ path = $relative; bytes = [long]$entry.Length; sha256 = $hash }
    }
} finally { $zip.Dispose() }

$result = [ordered]@{
    schema = 'wrn.android-aab-assets-verification.v1'
    status = 'PASS'
    sourceCommit = [string]$receipt.sourceCommit
    assets = @($verified).Count
    aabBytes = (Get-Item -LiteralPath $aabFile).Length
    aabSha256 = (Get-FileHash -LiteralPath $aabFile -Algorithm SHA256).Hash.ToLowerInvariant()
    manifestSha256 = (Get-FileHash -LiteralPath $manifestFile -Algorithm SHA256).Hash.ToLowerInvariant()
}
$json = $result | ConvertTo-Json -Depth 4
if ($OutputPath) {
    $parent = Split-Path $OutputPath -Parent
    if ($parent) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Set-Content -LiteralPath $OutputPath -Value $json -Encoding utf8NoBOM
}
$json
