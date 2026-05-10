# Local Change Log

This file records local optimization work that should be preserved when syncing with the upstream CloudNav codebase.

## 2026-05-09

### Theming v3 Phase 12-15b

- Completed the v3 theming patch set covering Phase 12 through Phase 15b.
- Added the Docker-only verification path and confirmed the project builds successfully inside `proj-mikunav:latest`.
- Added `docs/THEMING_TASK_v3_REPORT.md` as the audit / verification record for the v3 rollout.
- Preserved backward compatibility for the theming data model and legacy theme behavior while normalizing the newer theme fields.

### Background-image semi-transparent overlay

- Tuned background-image link cards to use a semi-transparent overlay at 0.39 in both light and dark default states, with hover easing to 0.10.
- Kept the default non-hover frosted card treatment unchanged so sidebar, modal, and ordinary card surfaces still preserve the existing look.
- Kept sidebar, modal, and ordinary frosted surfaces unchanged; the new treatment only applies to `.frost-card`.

### Sidebar hover accent polish

- Aligned sidebar category hover with the card accent treatment so hover now shows a light Miku accent background, accent-colored text, and a subtle inset accent ring.
- Kept the active category state stronger than hover so click/selection remains visually distinct.

### Top-right action button polish

- Unified the add / batch / sort action buttons with a softer elevated surface, lighter border, and accent hover feedback so they read as one group rather than three separate styles.
- Kept button size and behavior unchanged so the visual update does not affect layout or interaction.

### Top-right button harmonization

- Reworked the add / batch / sort buttons to sit closer to the same visual family as the logout-style controls: softer surface, quieter border, and restrained accent on hover.
- Preserved the toolbar grouping distinction so these remain a secondary action cluster instead of blending into the logout/session actions.

### Top-right buttons match logout tone

- Shifted the add / batch / sort buttons to the same muted surface family as the logout / view toggle controls while keeping the icon and label text in accent color.
- Kept the action group visually distinct through layout and grouping rather than through loud color contrast.

### Top-right buttons darken to logout tone

- Adjusted the add / batch / sort buttons to use a darker muted surface close to the logout button tone, while preserving Miku-colored labels and icons.
- Kept the hover treatment subtle so the buttons still read as a coordinated tool group rather than a second logout cluster.

### Top-right batch actions harmonized

- Reworked the add, batch, and sort tool buttons to use the same dark muted surface family as logout, with Miku-colored text/icons and much less red/green saturation in batch actions.
- Kept the controls visually grouped but removed the white-text / high-contrast treatment that made the group feel disconnected.

### Top-right sort and footer reset

- Restored the footer action buttons to the header-like muted surface so they no longer compete with the top toolbar.
- Matched the sort and batch action buttons to the same header-style muted surface and accent text so the toolbar reads as a cohesive control group.

### Footer region and pinned sort alignment

- Raised the footer container to the same elevated surface family as the header so the left-bottom action group blends with the main navigation layer.
- Updated the pinned sort controls to use the same muted header-style capsule treatment as the rest of the toolbar, avoiding the old bright accent-only button.

### Footer and sort hover tuning

- Restored the footer outer region to the header-like frosted surface feel so the button cluster sits on the same visual layer as the top navigation.
- Lightened the sort and batch capsules slightly and added subtle hover feedback to keep them coherent without feeling heavy.

### Footer button color correction

- Restored the footer action button labels/icons to Miku accent color and kept the surrounding footer region on the same frosted surface family as the header.
- Lightened the sort and batch capsules a bit more and restored hover feedback so the group remains coordinated without looking overly dark.

### Footer and batch hover refinement

- Nudged the footer action buttons and batch/sort capsules slightly lighter while keeping the header-like frosted footer container intact.
- Added clearer hover feedback to the sort/batch controls so the interaction remains visible without changing the button shape.

### Footer frosted reset and pinned sort lighten

- Restored the footer wrapper to the same frosted/translucent surface style as the header while keeping the existing button shapes intact.
- Lightened the pinned sort and batch capsules one step further and restored hover contrast so they sit naturally inside the toolbar.

### Footer button text color restore

- Restored the footer action button labels and icons to the Miku accent color while keeping the footer wrapper on the header-like frosted surface.
- Preserved the button shapes and spacing so only the color treatment changed.

### Sidebar frosted surface restore

- Restored the sidebar outer shell to the same translucent frosted treatment as the header so the footer area can show the background image through the full left panel.
- Kept the footer buttons themselves unchanged so the fix is limited to the surrounding surface.

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
