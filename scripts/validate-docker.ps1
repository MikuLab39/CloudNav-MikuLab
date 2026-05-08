param(
  [string]$Image = "node:22-bookworm"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$imageExistsBefore = $false

try {
  docker image inspect $Image *> $null
  $imageExistsBefore = $true
} catch {
  $imageExistsBefore = $false
}

try {
  docker run --rm -v "${repoRoot}:/src:ro" -w /tmp $Image sh -lc "cp -a /src/. /tmp/work && cd /tmp/work && npm ci && npm run build && npx tsc --noEmit"
} finally {
  if (-not $imageExistsBefore) {
    docker image rm $Image *> $null
  }
}
