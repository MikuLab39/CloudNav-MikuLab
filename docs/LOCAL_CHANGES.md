# Local Change Log

This file records local optimization work that should be preserved when syncing with the upstream CloudNav codebase.

## 2026-05-08

### Main UI language switch

- Added a minimal English/Chinese switch for the primary navigation UI, defaulting to English without browser language detection.
- Placed the language control beside the existing top-bar icons and persisted the choice in localStorage.
- Localized the currently visible main-page labels, tooltips, auth prompts, and basic action confirmations while leaving secondary settings/import/backup/category pages unchanged for scope control.
- Passed localized labels into the login modal for the authentication title, password placeholder, submit button, close label, and error message.
- Added bilingual category names (`nameZh` and `nameEn`) so default and newly edited categories can follow the current UI language while preserving stable category ids.
- Normalized legacy category data on load/import/update so old backups without bilingual fields continue to work and missing built-in categories are restored in the default order.
- Moved the language and theme controls before the simple/detailed view switch in the top bar.
- Kept the implementation in `App.tsx` with a small static text map to avoid new dependencies and runtime loading overhead.

### Default category naming guide

| Chinese | English |
| --- | --- |
| 置顶 | Pinned |
| 常用 | Featured |
| 开发 | Dev |
| 设计 | Design |
| 资讯 | Feeds |
| 休闲 | Play |
| 论坛 | Community |
| 智能 | AI |

### Validation

- Docker-only validation required before commit and push.

### MikuLab localization

- Renamed visible local project identity to `CloudNav-MikuLab`.
- Updated README demo links to `https://nav.mikulab.com/`.
- Preserved upstream attribution and added the MikuLab fork note.
- Kept storage keys and backup filenames unchanged to preserve compatibility with existing deployed data.

### Docker validation reuse

- Updated `scripts/validate-docker.ps1` to keep the validation image by default for repeated runs.
- Added an explicit `-CleanupImage` switch for cases where Docker image cleanup is requested.

### App data safety

- Fixed initial cloud data loading to use the saved auth token instead of waiting for React auth state.
- Prevented empty app data or built-in sample links from being silently synced to Cloudflare KV.
- Stopped login recovery from automatically overwriting `app_data` when cloud data is empty or unreadable.
- Added `docs/DATA_STORAGE.md` to document Cloudflare KV keys, localStorage keys, and data safety rules.

### Extension packaging safety

- Serialized generated extension configuration as JSON to avoid broken JavaScript when passwords or site names contain special characters.
- Normalized extension API base URLs and added generated `host_permissions` for the target site.
- Added startup configuration checks and detailed HTTP/API error messages to popup and sidebar scripts.

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
