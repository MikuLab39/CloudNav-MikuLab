param(
  [string]$Image = "node:22-bookworm",
  [switch]$CleanupImage
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")

try {
  docker run --rm -v "${repoRoot}:/src:ro" -w /tmp $Image sh -lc "cp -a /src/. /tmp/work && cd /tmp/work && npm ci && npm run build && npx tsc --noEmit"
} finally {
  if ($CleanupImage) {
    docker image rm $Image *> $null
  }
}
