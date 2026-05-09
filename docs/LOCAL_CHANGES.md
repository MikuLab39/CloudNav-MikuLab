# Local Change Log

This file records local optimization work that should be preserved when syncing with the upstream CloudNav codebase.

## 2026-05-08

### Unified category lock hardening

- Replaced per-category passwords with a unified navigation category lock.
- Moved the category lock password into the dedicated `category_lock_config` KV record so it is not returned with `app_data` or `website_config`.
- Added temporary `category_lock_session:<token>` records so unlocked protected categories survive refresh until the shared `passwordExpiryDays` window expires.
- Changed `/api/storage` reads to filter links from protected categories unless the request has a valid site/admin password or category lock session token.
- Migrated legacy `Category.password` and `Category.requireAuth` to the new `Category.protected` marker and cleaned legacy fields on save.
- Prevented filtered `app_data` responses from being cached or synced back to KV by marking them with `protectedContentHidden`.
- Added Settings UI for the unified navigation lock and Category Manager controls for marking categories as protected.
- Kept the default `MikuLab` category non-editable and non-deletable, but made its lock icon toggle unified lock protection so it can be protected with minimal behavior change.

### Unified category lock validation

- Docker validation passed with `npm run build`.
- Docker validation passed with `npx tsc --noEmit`.
- Dependency audit still reports known dependency vulnerabilities; no automatic dependency upgrades were applied to avoid unrelated changes.

### Main UI language switch

- Added a minimal English/Chinese switch for the primary navigation UI, defaulting to English without browser language detection.
- Placed the language control beside the existing top-bar icons and persisted the choice in localStorage.
- Localized the currently visible main-page labels, tooltips, auth prompts, and basic action confirmations while leaving secondary settings/import/backup/category pages unchanged for scope control.
- Passed localized labels into the login modal for the authentication title, password placeholder, submit button, close label, and error message.
- Added bilingual category names (`nameZh` and `nameEn`) so default and newly edited categories can follow the current UI language while preserving stable category ids.
- Normalized legacy category data on load/import/update so old backups without bilingual fields continue to work and missing built-in categories are restored in the default order.
- Migrated legacy built-in category ids to the current default set only when their names still match known default names, so user-renamed categories are preserved as custom categories.
- Moved the language and theme controls before the simple/detailed view switch in the top bar.
- Kept the implementation in `App.tsx` with a small static text map to avoid new dependencies and runtime loading overhead.

### Theme customization v1

- Added semantic CSS theme tokens and Tailwind CDN token aliases without migrating existing component class names.
- Added `SiteSettings.theme` with normalized defaults, `default` and `miku` presets, and background image configuration fields.
- Added an appearance section to Settings for light/dark/system mode, default/Miku preset selection, and background image upload/URL controls.
- Kept all theme state inside `cloudnav_site_settings.theme` and the existing `/api/storage` `saveConfig: 'website'` path.
- Added first-paint theme application in `index.html` and React-side DOM application in `App.tsx` to reduce FOUC.
- Added system theme change listening for `mode: 'system'` and explicit target surface colors for clip-path theme transitions.
- Added `docs/THEMING_GUIDE.md`, `docs/THEMING_TASK_v1.md`, and `docs/THEMING_TASK_v1_REPORT.md` for implementation and verification traceability.

### Default category naming guide

| Chinese | English |
| --- | --- |
| 置顶 | Pinned |
| MikuLab | MikuLab |
| 智能 | AI |
| 开发 | Dev |
| 效率 | Work |
| 学习 | Learn |
| 工具 | Tools |
| 咨讯 | Feeds |
| 媒娱 | Media |
| 设计 | Design |
| 社区 | Discuss |
| 其他 | Explore |

### Validation

- Docker-only validation required before commit and push.
- Validation must use `scripts/validate-docker.ps1`; do not run `npm ci`, builds, or type checks through a writable bind mount of the repository because it creates host-side `node_modules/` and `dist/` folders.
- If generated validation folders appear in the checkout, remove them before continuing and rerun validation with the standard script.
- Updated `scripts/validate-docker.ps1` to remove host-side `node_modules/` and `dist/` before and after validation.

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
- Added generated extension options page support for language settings. The extension defaults to English and stores the language in `chrome.storage.local`; popup, side panel, and context menu read that setting without adding a language switch to the popup or side panel.
- Kept generated manifest metadata, command labels, popup title fallback, and save-title fallback in English by default.

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
- Theme v1 Docker-only validation passed with `scripts/validate-docker.ps1` after verifier fixes.
- Browser screenshot verification for theme v1 remains pending because no Dockerized browser automation is currently available in the repository.

### Known follow-up work

- Main bundle is still large, around 1.6 MB minified.
- Dependency audit still reports vulnerabilities from the current dependency tree.
- `App.tsx` and `SettingsModal.tsx` remain large and should be split before major feature work.
