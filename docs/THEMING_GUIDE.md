# Mikunav 主题改造指南（Theming Guide）

> 目标读者：后续接手"换配色 / 风格 / 背景图 / 字体"等视觉需求的 agent 与开发者。
> 核心原则：**最小改动、单一数据源、可降级、不触碰组件 className**。

---

## 0. 在动手之前必须读完

仓库现有 ~507 处 `bg-* / text-* / border-* / dark:*` 的 Tailwind 字面量散落在 13 个组件里。**任何"全局替换 className"或"逐组件改色"的方案都属于反模式**，本指南直接拒绝。本指南的所有路线都建立在"令牌层（CSS Variables + Tailwind theme 映射）单点改造"之上。

如果你接到的需求超出本指南覆盖范围（例如"按品牌定制 10 套主题"或"动效大改"），先回到本文档评估是否需要扩展框架，而不是绕开它。

---

## 1. 现状摘要

| 关注点 | 落点 | 说明 |
|---|---|---|
| Tailwind 配置 | `index.html:104-119`（内联 `<script>`，CDN 模式） | 自定义 token 仅 `primary/secondary/dark/card`，组件未使用 |
| 暗色切换 | `App.tsx:743-748`（init） / `App.tsx:1051-1060`（apply） / `App.tsx:1062-1100`（带动画的 toggle） | `<html>` 上加 `.dark` 类，`localStorage['theme']` 持久化 |
| 暗色动画硬编码色值 | `App.tsx:2403` | `#020617` / `#f8fafc` —— 改造时必须同步替换 |
| body 默认背景 | `index.html:152` | `bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50` |
| 站点设置类型 | `types.ts:22 SiteSettings` | 已有 `title/navTitle/favicon/cardStyle/...` |
| 站点设置持久化 | `SettingsModal.tsx` → `POST /api/storage` `saveConfig: 'website'` + `localStorage['cloudnav_site_settings']` | 启动时 `index.html:30-38` 同步拉取 |
| 设置 UI | `SettingsModal.tsx` 的 `activeTab === 'site'` 分支 | 主题入口将在此扩展 |

---

## 2. 分层架构

```
L4  UI 入口         SettingsModal "site" 标签 → 新增 "外观" 区块
L3  状态 / 持久化   SiteSettings.theme（新增字段）
L2  应用层          App.tsx 的 useEffect：把主题写到 <html>
L1  令牌层          CSS Variables + Tailwind theme 映射（index.html）
```

每层只做一件事，跨层耦合通过类型 `SiteSettings` 收敛。

---

## 3. 令牌层（L1）—— 改造的真正承重墙

### 3.1 设计

在 `index.html` 中，**用 CSS 变量定义所有可主题化的值**，然后让 Tailwind 的 theme 映射到这些变量。这样：

- 组件里写的 `bg-surface` 永远读 `--color-surface`，切主题只改变量值。
- 暗色 / 多主题通过 `<html>` 上的类切换（`html.dark`、`html.theme-sakura` 等）。
- 不需要构建工具改动（仍走 CDN）。

### 3.2 命名约定（强约束）

| 类别 | 变量前缀 | Tailwind token 名 | 示例 |
|---|---|---|---|
| 表面 / 容器 | `--color-surface-*` | `surface / surface-elevated / surface-muted` | `bg-surface` |
| 文本 | `--color-text-*` | `fg / fg-muted / fg-subtle` | `text-fg` |
| 边框 | `--color-border-*` | `border-default / border-strong` | `border-border-default` |
| 主色 | `--color-accent-*` | `accent / accent-fg / accent-soft` | `bg-accent text-accent-fg` |
| 状态色 | `--color-{success/warning/danger/info}` | 同名 | `text-danger` |
| 背景图 | `--bg-image` / `--bg-overlay` | 通过 `body::before` 应用 | 见 §5 |

**禁止**新增语义不明确的 token（如 `color-1`、`my-blue`）。**禁止**把暗色直接写成 `dark-surface`，统一用语义名 + 主题类切换。

### 3.3 改动点（最小）

文件：`index.html`

1. 在 `<style>` 中加入：

```css
:root {
  /* light theme — 默认 */
  --color-surface:           #f8fafc;
  --color-surface-elevated:  #ffffff;
  --color-surface-muted:     #f1f5f9;
  --color-fg:                #0f172a;
  --color-fg-muted:          #475569;
  --color-fg-subtle:         #94a3b8;
  --color-border-default:    #e2e8f0;
  --color-border-strong:     #cbd5e1;
  --color-accent:            #3b82f6;
  --color-accent-fg:         #ffffff;
  --color-accent-soft:       #dbeafe;
  --color-danger:            #ef4444;
  --color-success:           #22c55e;
  --color-warning:           #f59e0b;
  --color-info:              #0ea5e9;

  --bg-image:    none;
  --bg-overlay:  rgba(248, 250, 252, 0);  /* 与 surface 一致，便于 alpha 叠加 */
}

html.dark {
  --color-surface:           #0f172a;
  --color-surface-elevated:  #1e293b;
  --color-surface-muted:     #1e293b;
  --color-fg:                #f8fafc;
  --color-fg-muted:          #cbd5e1;
  --color-fg-subtle:         #64748b;
  --color-border-default:    #334155;
  --color-border-strong:     #475569;
  --color-accent:            #60a5fa;
  --color-accent-fg:         #0f172a;
  --color-accent-soft:       rgba(96, 165, 250, 0.15);
  --bg-overlay:              rgba(2, 6, 23, 0);
}
```

2. **不要删除** `bg-gray-50 dark:bg-slate-900 ...`（会破坏所有未迁移的视图）；改成在 `body` 同时挂 `bg-surface text-fg`，视觉上等价，但走的是 token：

```html
<body class="bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-300">
```

保持原样作为 fallback。新主题相关元素一律用语义 token。

3. 扩展 Tailwind 内联配置（`index.html:106-118`）：

```js
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   '#3b82f6',  // 保留旧 token，避免历史代码失效
        secondary: '#64748b',
        dark:      '#0f172a',
        card:      '#1e293b',

        // 新语义 token（统一用 CSS 变量）
        surface:           'var(--color-surface)',
        'surface-elevated':'var(--color-surface-elevated)',
        'surface-muted':   'var(--color-surface-muted)',
        fg:                'var(--color-fg)',
        'fg-muted':        'var(--color-fg-muted)',
        'fg-subtle':       'var(--color-fg-subtle)',
        'border-default':  'var(--color-border-default)',
        'border-strong':   'var(--color-border-strong)',
        accent:            'var(--color-accent)',
        'accent-fg':       'var(--color-accent-fg)',
        'accent-soft':     'var(--color-accent-soft)',
        danger:            'var(--color-danger)',
        success:           'var(--color-success)',
        warning:           'var(--color-warning)',
        info:              'var(--color-info)',
      }
    }
  }
}
```

### 3.4 已有 className 是否需要迁移？

**默认不迁移**。新增 / 修改的视图请优先使用语义 token。如果某次需求需要"把所有卡片底色统一改"，再做**有界限**的迁移：以**一个组件文件**为单位，PR 里同时给出迁移前后截图（亮 / 暗）。一次 PR 不超过 1 个文件。

---

## 4. 状态层（L3）—— 把主题写进 SiteSettings

文件：`types.ts`

```ts
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'default' | string;  // 预留扩展（如 'sakura' / 'monokai'）

export interface ThemeSettings {
  mode: ThemeMode;             // 显式主题；'system' 时跟随 prefers-color-scheme
  preset: ThemePreset;         // 预设包名；'default' 即上文 §3.3
  background?: {
    enabled: boolean;
    url?: string;              // 远程图或 data: URL（base64，便于离线）
    blur?: number;             // 0-20 px
    opacity?: number;          // 0-1，叠加层透明度
    position?: 'cover' | 'contain' | 'tile';
  };
  // 预留：自定义颜色覆盖（高级用户）
  overrides?: Partial<Record<string, string>>;  // key 形如 'color-accent'
}

export interface SiteSettings {
  title: string;
  navTitle: string;
  favicon: string;
  cardStyle: 'detailed' | 'simple';
  requirePasswordOnVisit: boolean;
  passwordExpiryDays: number;
  theme?: ThemeSettings;       // 新增；可选保证向后兼容
}
```

**约束**：

- `theme` 字段必须**可选**，且所有读取处给出默认值；老用户配置无 `theme` 字段时，行为与现状**一字节不差**。
- 不要新建 `cloudnav_theme` 之类的独立 localStorage key，**复用** `cloudnav_site_settings`。
- 不要改 `/api/storage` 的字段名 / 路径；后端把 `theme` 当作普通字段透传即可。

---

## 5. 应用层（L2）—— 把主题落到 DOM

文件：`App.tsx`

### 5.1 新增 effect：监听 `siteSettings.theme` 并应用到 `<html>`

放在现有"Theme init"附近（`App.tsx:743` 之后），新建一个 `useEffect`：

```ts
useEffect(() => {
  const theme = siteSettings.theme;
  const root = document.documentElement;

  // 1) 模式（light / dark / system）
  const mode = theme?.mode ?? (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
  setDarkMode(isDark);

  // 2) 预设（preset class）
  // 清掉旧的预设类，避免堆积
  Array.from(root.classList).forEach(c => c.startsWith('theme-') && root.classList.remove(c));
  if (theme?.preset && theme.preset !== 'default') {
    root.classList.add(`theme-${theme.preset}`);
  }

  // 3) 背景图（CSS 变量驱动，不动 className）
  const bg = theme?.background;
  if (bg?.enabled && bg.url) {
    root.style.setProperty('--bg-image', `url("${bg.url}")`);
    root.style.setProperty('--bg-blur', `${bg.blur ?? 0}px`);
    root.style.setProperty('--bg-overlay-alpha', String(1 - (bg.opacity ?? 0.4)));
    root.classList.add('has-bg-image');
  } else {
    root.style.removeProperty('--bg-image');
    root.classList.remove('has-bg-image');
  }

  // 4) 自定义覆盖
  Object.entries(theme?.overrides ?? {}).forEach(([k, v]) => {
    if (v) root.style.setProperty(`--${k}`, v);
  });
}, [siteSettings.theme]);
```

### 5.2 修复硬编码色值

`App.tsx:2403` 的暗色转场动画：

```diff
- backgroundColor: themeTransition.targetDark ? '#020617' : '#f8fafc',
+ backgroundColor: themeTransition.targetDark
+   ? 'var(--color-surface, #020617)'
+   : 'var(--color-surface, #f8fafc)',
```

保留 fallback，避免 `<html>` 类还没挂上时白屏。

### 5.3 背景图渲染

在 `index.html` 的 `<style>` 加：

```css
html.has-bg-image body {
  position: relative;
}
html.has-bg-image body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  filter: blur(var(--bg-blur, 0));
  z-index: -2;
  pointer-events: none;
}
html.has-bg-image body::after {
  content: '';
  position: fixed; inset: 0;
  background-color: var(--color-surface);
  opacity: var(--bg-overlay-alpha, 0.4);
  z-index: -1;
  pointer-events: none;
}
```

**为什么走 `::before/::after` 而不是直接给 body 设 `background-image`？**
保留 body 的 Tailwind class 不变；遮罩层独立调透明度，不会污染原色系；`z-index: -1/-2` 保证不影响交互。

---

## 6. UI 层（L4）—— 设置弹窗里的"外观"区块

文件：`components/SettingsModal.tsx`

在 `activeTab === 'site'` 的分支内、紧贴现有"网站标题 / 导航标题 / 网站图标"之后，新增 `<section>`：

- 模式选择：`light / dark / system` 三选一（radio 组）。
- 预设选择：下拉框，选项来自一个集中常量 `THEME_PRESETS`（见 §7.1）。`default` 默认。
- 背景图开关 + URL / 上传 + 模糊滑块（0-20）+ 遮罩透明度滑块（0-1）。
- 保存按钮**复用现有** `handleSave`，不要单独再写一套保存逻辑。

实现要求：

- UI 用现有 token（`bg-surface-elevated` / `text-fg-muted` / `border-border-default`），不要再写 `bg-white dark:bg-slate-800` 一类的二元字面量。
- 上传图片用 `FileReader.readAsDataURL` 转 base64 存进 `theme.background.url`；**限制 ≤ 1 MB**（KV 容量与传输成本）；超过给出 toast 提示并拒绝。
- 不要把图片上传到任何外部服务（隐私 / 成本 / 安全边界）。

---

## 7. 工程化约束

### 7.1 集中常量

新建 `theme/presets.ts`（或 `services/themePresets.ts`）：

```ts
import type { ThemePreset } from '../types';

export interface ThemePresetDef {
  id: ThemePreset;
  name: { zh: string; en: string };
  // 仅描述与默认的 *差异* — 不要重复写所有变量
  light?: Partial<Record<string, string>>;
  dark?:  Partial<Record<string, string>>;
}

export const THEME_PRESETS: ThemePresetDef[] = [
  { id: 'default', name: { zh: '默认', en: 'Default' } },
  // 后续追加在这里，禁止散落到组件里
];
```

预设差异通过 `<style>` 块或运行时注入实现（建议运行时注入，避免重复维护 CSS 与 TS）。

### 7.2 类型与默认值

`SiteSettings` 在三处会被读取：`App.tsx`、`SettingsModal.tsx`、`index.html` 启动脚本。**统一**写一个 `normalizeSiteSettings()` 工具函数（放在 `types.ts` 同目录或 `services/siteSettings.ts`），所有读取点都过它一次：

```ts
export function normalizeSiteSettings(s?: Partial<SiteSettings>): SiteSettings {
  return {
    title: s?.title || 'MikuLab-Nav',
    navTitle: s?.navTitle || 'MikuLab-Nav',
    favicon: s?.favicon || '',
    cardStyle: s?.cardStyle || 'detailed',
    requirePasswordOnVisit: s?.requirePasswordOnVisit ?? false,
    passwordExpiryDays: s?.passwordExpiryDays ?? 7,
    theme: {
      mode: s?.theme?.mode ?? 'light',
      preset: s?.theme?.preset ?? 'default',
      background: s?.theme?.background ?? { enabled: false },
      overrides: s?.theme?.overrides ?? {},
    },
  };
}
```

注意 `index.html` 启动脚本是纯 JS（无类型），需要写一份**最小镜像**逻辑（只关心 `theme.mode` 和 `theme.background`，提前挂 `<html>` 类，避免首屏闪白 / 闪暗 / 闪图）。

### 7.3 命名 / 风格

- TS：变量 `camelCase`、类型 `PascalCase`、CSS 变量 `--kebab-case`。
- CSS 变量值**不要带语义形容词**（`--color-bg-light` ✗，`--color-surface` ✓，靠主题类切换）。
- 不允许写 `style={{ background: '#xxxxxx' }}` 直接硬编码颜色——除非是 fallback。所有内联 style 必须走 `var(--...)` 或现有 Tailwind token。
- 不允许新建 `*.css` 文件（仓库目前无构建侧 CSS 处理，全部 CDN + 内联）。新增样式集中在 `index.html` 的 `<style>` 里。

---

## 8. 实施路线（按 PR 拆分）

每个 PR 只做一层，单测 / 截图齐全才能合入。

### PR-1：令牌层（基础设施，不改观感）
- 改 `index.html`：加 CSS 变量 + 扩展 Tailwind theme。
- 修复 `App.tsx:2403` 硬编码色值。
- **验收**：亮 / 暗模式截图与改造前**像素级一致**（允许 ±2 像素抗锯齿差异）。无任何组件 className 改动。

### PR-2：状态层 + normalize
- 改 `types.ts`：加 `ThemeSettings`。
- 新建 `services/siteSettings.ts`：`normalizeSiteSettings()`。
- 替换 `App.tsx` / `SettingsModal.tsx` / `index.html` 启动脚本中的"读 + 兜底"逻辑为调用 normalize。
- **验收**：老用户的 `localStorage['cloudnav_site_settings']`（无 `theme`）能正常加载；序列化往返无丢失。

### PR-3：应用层（主题落到 DOM）
- `App.tsx` 新增 §5.1 effect。
- `index.html` 加背景图 `::before / ::after` 样式。
- `index.html` 启动脚本同步处理 `theme.mode` / `theme.background`，避免首屏闪烁。
- **验收**：通过手工改 localStorage（不改 UI）即可看到主题切换；首屏无 FOUC（白闪 / 暗闪）。

### PR-4：UI 层（外观设置）
- `SettingsModal.tsx` 在 site 标签新增"外观"区块。
- 新建 `theme/presets.ts` 集中常量。
- **验收**：用户在 UI 上完成 light → dark → system → 配背景图 → 关闭背景图，全程无报错；刷新后状态保留；KV 同步成功。

### PR-5（可选）：迁移 hot path 组件至语义 token
- 范围：`App.tsx` 顶部导航 + 1 个 modal。
- 一次 PR 一个文件。

---

## 9. 审查清单（Reviewer Checklist）

合入任何主题相关 PR 前必须逐条勾选：

- [ ] 没有新增 `bg-white dark:bg-slate-800` 这类二元字面量（新增 UI 必须用语义 token）。
- [ ] 没有在 TSX 里硬编码 hex / rgb 色值（除了 fallback 与 SVG 内部色）。
- [ ] `SiteSettings` 类型变更已通过 `normalizeSiteSettings` 给出默认值，老配置不报错（手测：清空 `theme` 字段后刷新）。
- [ ] `index.html` 启动脚本与 `App.tsx` 的主题应用逻辑保持**一致**（同样的 `mode/preset/background` 解析），避免首屏闪烁。
- [ ] 没有新建独立 localStorage key（必须复用 `cloudnav_site_settings`）。
- [ ] 没有新建独立 API 端点（必须走 `/api/storage` `saveConfig: 'website'`）。
- [ ] 暗色 / 亮色 / 系统三种模式 + 启用 / 禁用背景图 共 6 种组合手测过，附截图。
- [ ] 在 `cardStyle: 'simple'` 与 `'detailed'` 两种视图下都验证过。
- [ ] 移动端断点（`md:` 以下）下背景图与遮罩可读性 OK。
- [ ] 控制台无 React 警告 / CSP 报错（注意背景图的 `url(...)` 跨域）。
- [ ] 用户上传 > 1MB 图片时被拒绝且有提示。
- [ ] 关闭主题功能后，行为回到改造前的现状。

---

## 10. 边界与禁区

**绝对不要做**：

1. ❌ 全局 `sed` 替换 className（500+ 处会破坏布局且 review 不可读）。
2. ❌ 引入 CSS-in-JS / styled-components / 新构建链（仓库走 CDN，引入会破坏部署模型）。
3. ❌ 引入 Tailwind 插件（CDN 模式不支持插件）。
4. ❌ 修改 `/api/storage` 字段名或新增端点。
5. ❌ 把背景图传到第三方图床。
6. ❌ 把主题写进 `INITIAL_LINKS / DEFAULT_CATEGORIES` 这类业务默认值。
7. ❌ 把暗色色值写进组件 className（应通过 `html.dark` 类自动切换）。

---

## 11. 风险与回滚

| 风险 | 缓解 | 回滚 |
|---|---|---|
| 首屏闪烁（FOUC） | `index.html` 启动脚本同步挂类 + 设变量 | 回退该 commit；fallback 仍是当前 dark 类机制 |
| 用户配的背景图失效（CSP / 防盗链） | UI 层加载失败 toast 提示 + 自动 disable | 用户手动关闭背景；状态层保留 url 不丢 |
| KV 容量超限（base64 图） | UI 层强制 ≤ 1 MB | 抛错 + 不写入 |
| 老用户配置被覆盖 | `normalizeSiteSettings` 全字段给默认值，且新字段 optional | 不需要回滚，类型保证 |
| Tailwind CDN 版本变化导致 token 解析失败 | `index.html` 锁版本（如 `cdn.tailwindcss.com?v=3.4`） | 回退 CDN 版本 |

---

## 12. 后续 Agent 接手提示词模板

> 目标：实施 `docs/THEMING_GUIDE.md` 的 PR-N。
> 约束：严格遵守第 9 节 Checklist 与第 10 节禁区；只动指南列出的文件与行段；本 PR 不涉及组件 className 重写；提交前生成亮 / 暗 / 系统三种模式截图各一张。
> 完成定义：所有 Checklist 勾选 + 手测脚本通过 + 老配置兼容性脚本通过。

---

_最后更新：2026-05-09_
