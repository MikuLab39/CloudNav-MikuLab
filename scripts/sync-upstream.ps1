param(
  [string]$UpstreamBranch = "origin/main",
  [switch]$SkipValidation
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")

Push-Location $repoRoot
try {
  $dirty = git status --porcelain
  if ($dirty) {
    throw "Working tree is not clean. Commit or stash changes before syncing upstream."
  }

  git fetch origin

  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $safeName = $UpstreamBranch -replace "[^A-Za-z0-9._-]", "-"
  $syncBranch = "sync/$safeName-$timestamp"

  git switch -c $syncBranch
  git merge --no-ff $UpstreamBranch

  if (-not $SkipValidation) {
    & (Join-Path $PSScriptRoot "validate-docker.ps1")
  }

  "Created validated sync branch: $syncBranch"
  "Review the merge, then merge it back to main when ready."
} finally {
  Pop-Location
}
