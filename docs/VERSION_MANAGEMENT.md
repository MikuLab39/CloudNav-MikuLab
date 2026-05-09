# Version Management

This repository keeps local optimization work compatible with the original CloudNav upstream by treating local changes as a small, documented patch layer.

## Goals

- Keep upstream compatibility clear.
- Record every local optimization that should survive future updates.
- Validate local and upstream-merged code in Docker only.
- Avoid host-level dependency installation or host environment changes.

## Branch Model

- `main`: deployable local version.
- `sync/*`: temporary branches for upstream update integration.
- `backup/*`: optional safety branches created before larger merge work.

Do not commit directly to a sync branch unless it has passed Docker validation.

## Local Patch Record

Every local behavior change should be recorded in `docs/LOCAL_CHANGES.md` with:

- date
- changed area
- reason
- validation result
- compatibility notes

This makes future upstream updates easier to review and merge.

## Upstream Sync Workflow

1. Ensure the working tree is clean.
2. Fetch upstream updates.
3. Create a temporary `sync/<branch>-<timestamp>` branch.
4. Merge the upstream branch into the sync branch.
5. Resolve conflicts by preserving validated local improvements unless upstream has a clearly safer or newer implementation.
6. Run Docker validation.
7. Merge the sync branch back to `main` only after validation passes.
8. Add a new entry to `docs/LOCAL_CHANGES.md` for the sync result.

## Merge Policy

When local and upstream code conflict:

- Prefer upstream for untouched code paths.
- Prefer local code for entries already documented in `docs/LOCAL_CHANGES.md`, unless upstream fixes the same issue more cleanly.
- Prefer the smaller implementation when both are correct.
- Do not hide conflicts with broad `any`, `@ts-ignore`, or unrelated rewrites.
- Re-run Docker validation after each conflict resolution pass.

## Docker-Only Rule

Dependency installation, build checks, type checks, audit checks, and similar environment-affecting tasks must run through Docker.

Use `scripts/validate-docker.ps1` for the standard validation command. The script mounts the repository read-only, copies it inside the container, installs dependencies inside the container, and runs checks. It also removes host-side `node_modules/` and `dist/` before and after validation so generated artifacts do not remain in the checkout. Docker images are kept for reuse by default; pass `-CleanupImage` only when an explicit cleanup is requested.

Do not run validation with a writable bind mount of the repository, such as `docker run -v "${PWD}:/workspace" ... npm ci`. That writes `node_modules/`, `dist/`, or other generated files back into the working tree. If generated folders appear after validation, remove them before continuing and use the standard script instead.

Agents must treat this as a project rule: never install dependencies, build, type-check, audit, or run equivalent environment-affecting commands directly on the host or in a container writing into the repository checkout.

## Current Validation Commands

The standard validation set is:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-docker.ps1
```

To clean up the validation image after a run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-docker.ps1 -CleanupImage
```

Inside Docker, it runs:

```sh
npm ci
npm run build
npx tsc --noEmit
```
