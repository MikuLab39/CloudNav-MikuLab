param(
  [string]$Image = "node:22-bookworm",
  [switch]$CleanupImage
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")

function Remove-HostGeneratedArtifacts {
  foreach ($name in @("node_modules", "dist")) {
    $path = Join-Path $repoRoot $name
    if (Test-Path -LiteralPath $path) {
      Remove-Item -LiteralPath $path -Recurse -Force
    }
  }
}

try {
  Remove-HostGeneratedArtifacts
  docker run --rm -v "${repoRoot}:/src:ro" -w /tmp $Image sh -lc "cp -a /src/. /tmp/work && cd /tmp/work && npm ci && npm run build && npx tsc --noEmit"
} finally {
  Remove-HostGeneratedArtifacts
  if ($CleanupImage) {
    docker image rm $Image *> $null
  }
}
