param(
  [string]$Path
)

if (-not $Path) {
  Write-Error "No path provided to git_rebase_edit.ps1"
  exit 1
}

$lines = Get-Content -Path $Path
$updatedLines = $lines | ForEach-Object {
  if ($_ -match '^pick a743e04') {
    'edit a743e04'
  } else {
    $_
  }
}

$updatedLines | Set-Content -Path $Path
