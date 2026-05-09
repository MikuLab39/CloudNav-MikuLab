# THEMING_TASK_v1 验收报告

PR: Phase 1 / Phase 2 / Phase 3 local merged work
Verifier: OpenCode Verifier  Date: 2026-05-09

## 结果
- A 兼容性：部分通过，A1/A2/A3 未能用真实 Chrome 完整手测；代码审查未发现老配置必然破坏点。
- B 主题切换：代码阻断已修复，仍需真实 Chrome 复验截图。
- C 背景图：部分通过，代码路径存在；真实 Chrome 图片渲染/滑块拖动未完成。
- D 持久化：部分通过，代码路径存在；真实 Network/KV/跨设备未完成。
- E 边界：部分通过。E4 通过；真实 Chrome Console、移动端、旧功能点击未完成。

结论：代码阻断已解除；截图验收按 owner 指示暂缓，Docker 验证与代码复查通过，可推送。

## 执行环境与验证命令
- Docker-only 构建/类型验证已执行：`powershell -ExecutionPolicy Bypass -File scripts/validate-docker.ps1`。
- Docker 内结果：`npm ci` 通过，`npm run build` 通过，`npx tsc --noEmit` 通过。
- 修复后 Docker-only 复验已执行：`powershell -ExecutionPolicy Bypass -File scripts/validate-docker.ps1`，结果仍为 `npm ci` / `npm run build` / `npx tsc --noEmit` 全部通过。
- Docker 内 dev server 烟测已执行：`docker run --rm -v "${PWD}:/src:ro" -w /tmp node:22-bookworm sh -lc "cp -a /src/. /tmp/work && cd /tmp/work && npm install && timeout 8s npm run dev -- --host 0.0.0.0 || test $? -eq 124"`。
- dev server 输出已到 `VITE ready`，但 shell 包装因 PowerShell `$?` 展开产生 `test: Illegal number: True`，该包装错误不影响已观察到 Vite 启动。
- 未完成真实 Chrome 最新版 1440x900 与 DevTools iPhone 12 375x812 截图验收：owner 已指示“先不用截图”；当前仓库没有 Playwright/Puppeteer/Cypress，且本轮未引入新依赖。
- 截图：按 owner 指示暂缓。以下各项用“截图：暂缓”标注。

## A. 兼容性
- A1 老用户零侵入：代码审查通过。说明：`App.tsx` 的 wrapper 在无 `theme` 输入时返回 `theme: undefined`，legacy theme init 仍可运行；Settings 弹窗通过 `normalizeSiteSettings(siteSettings)` 显示默认外观字段。截图：暂缓。
- A2 老 dark 偏好继承：代码审查通过。说明：`App.tsx:899-906` 在 `siteSettings.theme` 不存在时仍读取 `localStorage['theme'] === 'dark'` 并添加 `html.dark`。截图：暂缓。
- A3 KV 老配置回放：代码审查通过。说明：`App.tsx:1061`、`App.tsx:1437` 通过 `normalizeSiteSettings({ ...prev, ...websiteConfigData })` 合并老 website 配置；老配置无 `theme` 时不会必然报错。截图：暂缓。

## B. 主题切换
- B1 默认 → Miku 联动：代码审查通过。说明：`components/SettingsModal.tsx:93-103` 在 `patch.preset === 'miku' && cur.preset !== 'miku'` 时设置 `nextTheme.mode = 'dark'`。截图：暂缓。
- B2 模式独立：代码审查通过。说明：联动仅在从非 miku 到 miku 时触发；切 mode 为 light 后再切 default 不会反向联动。截图：暂缓。
- B3 跟随系统：代码审查通过。说明：`App.tsx:1194-1258` 已在 `system` 模式下监听 `matchMedia('(prefers-color-scheme: dark)')` 的 `change` 事件，并在 cleanup 中移除监听。截图：暂缓。
- B4 转场动画：代码审查通过。说明：`App.tsx:1314-1320` 已按 `default/miku` 与目标 dark/light 显式返回目标 surface 色，`App.tsx:2710` 的 overlay 不再读取当前 `--color-surface`。截图：暂缓。

## C. 背景图
- C1 上传：代码审查部分通过。说明：`components/SettingsModal.tsx:118-128` 使用 `FileReader.readAsDataURL`，`components/SettingsModal.tsx:1784-1789` 文件输入存在，`handleBgChange` 会触发 preview。未真实上传 800 KB 图片。截图：未生成。
- C2 大图拒绝：代码审查通过。说明：`components/SettingsModal.tsx:118-122` 大于 `1024 * 1024` 时 alert 并 return。未真实上传 1.5 MB。截图：未生成。
- C3 URL 模式：代码审查部分通过。说明：`components/SettingsModal.tsx:1801-1807` URL 输入会写入 background url；错误 URL 是否纯色无报错未真实浏览器验证。截图：未生成。
- C4 模糊与显示度：代码审查部分通过。说明：`components/SettingsModal.tsx:1820-1839` 滑块更新 `blur/opacity`，`App.tsx:1217-1222` 落到 CSS 变量。未真实拖动验证连贯性。截图：未生成。
- C5 适配：代码审查通过。说明：`components/SettingsModal.tsx:1846-1859` 仅暴露 `cover/contain`；`App.tsx:1223-1227` 映射到 `--bg-position-size` 与 repeat。未真实视觉验证。截图：未生成。
- C6 关闭：代码审查部分通过。说明：`components/SettingsModal.tsx:1863-1869` 清除按钮写 `enabled: false, url: ''`，`App.tsx:1230-1232` 会移除 `--bg-image` 与 `has-bg-image`。刷新后仍纯色依赖保存，未真实验证。截图：未生成。
- C7 跨主题：代码审查通过。说明：`index.html:263-267` 的遮罩 `body::after` 使用 `background-color: var(--color-surface)`，可跟随 default/miku surface。未真实视觉验证。截图：未生成。

## D. 持久化
- D1 落 KV：代码审查通过。说明：`SettingsModal` 保存仍调用 `onSave(localConfig, localSiteSettings)`；`App.tsx:1885-1895` 在 `normalizedSiteSettings` 存在时 POST `/api/storage`，body 含 `saveConfig: 'website'` 与完整配置。未真实 Network 面板验证。截图：未生成。
- D2 重新加载：代码审查通过。说明：`index.html:83-113` 可首屏应用本地 theme；B3/B4 的代码阻断已修复。截图：暂缓。
- D3 跨设备：未完成。说明：需要真实 KV 与另一浏览器/隐私窗口登录；本轮未能在当前工具链执行。截图：未生成。

## E. 边界
- E1 Console 无报错 / 警告：未完成。说明：Docker build/tsc 无错误；真实 Chrome Console 未打开。截图：未生成。
- E2 移动端断点 375x812：代码审查部分通过。说明：外观区块大量使用 `grid-cols-1 sm:* md:*` 与 `min-w-0`，具备移动适配意图；未用 DevTools iPhone 12 实测滑块与溢出。截图：未生成。
- E3 锁定分类等已有功能：未完成。说明：未执行真实点击分类、加链接、批量编辑路径。截图：未生成。
- E4 类型严格：通过。说明：Docker-only `npx tsc --noEmit` 已通过。截图：不适用。

## 阻断问题
- 无已知代码阻断问题。
- 截图验收按 owner 指示暂缓。

## 非阻断问题 / Follow-up
- 当前仓库没有浏览器自动化测试设施，无法在 Docker 内稳定执行“Chrome 最新版 + DevTools iPhone 12 + 截图”的验收要求。截图本轮按 owner 指示暂缓；建议后续增加 Docker 化 Playwright/Chrome 验收脚本。
- `npm audit` 仍报告 8 个漏洞（3 moderate，5 high），与主题改造无直接关系，未自动修复。
- bundle size 仍超过 Vite 默认 500 KB 警告阈值，属于既有体积问题。

## 截图
- 亮：暂缓。
- 暗：暂缓。
- Miku 亮：暂缓。
- Miku 暗：暂缓。
- Miku 暗 + 背景图：暂缓。
- 移动端：暂缓。

## 结论
代码阻断已解除；截图验收按 owner 指示暂缓，Docker 验证与代码复查通过，可推送。
