# Local Change Log

This file records local optimization work that should be preserved when syncing with the upstream CloudNav codebase.

## 2026-05-08

### TypeScript model alignment

- Added `LinkItem.order` to match the existing drag sorting implementation in `App.tsx`.
- Added explicit `LinkItem` generics to dnd-kit `arrayMove` calls so reordered link lists do not degrade to `unknown`.
- Normalized `otherCategoryResults` to always be `Record<string, LinkItem[]>` instead of sometimes returning an array.
- Typed `SortableLinkCard` as a React component so JSX `key` handling remains type-safe.

### Cloudflare runtime typing

- Added a local `CloudflareRequestInit` type for the Cloudflare `fetch` `cf` option used by the favicon cache path.
- Kept runtime behavior unchanged.

### Validation

- `npm run build` passed in a Docker-only validation environment.
- `npx tsc --noEmit` passed in a Docker-only validation environment.

### Known follow-up work

- Main bundle is still large, around 1.6 MB minified.
- Dependency audit still reports vulnerabilities from the current dependency tree.
- `App.tsx` and `SettingsModal.tsx` remain large and should be split before major feature work.
