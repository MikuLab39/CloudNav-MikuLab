# Mikunav 主题改造执行手册 v1（Miku 预设 + 背景图）

> 本手册是 v1 版本的**执行规范**，配套架构原则见 `docs/THEMING_GUIDE.md`。
> 范围被严格限定为：① 新增 `miku` 主题预设（#39C5BB） ② 新增背景图设置功能。
> 其余（自定义色覆盖 UI、更多预设、组件 className 迁移、毛玻璃容器等）一律**只留接口、不实现**。

---

## 0. 阅读优先级

执行前必须按顺序读完：

1. `docs/THEMING_GUIDE.md` 的 §1（现状）、§2（分层）、§9（审查）、§10（禁区）
2. 本手册全篇
3. `index.html` 现状（重点看 `<script>` IIFE 与 Tailwind config 内联部分）
4. `types.ts` 与 `services/` 目录（理解 SiteSettings 现有形状）
5. `App.tsx`：行 743–748、1043–1100、2397–2410（主题相关锚点）
6. `components/SettingsModal.tsx` 行 1–115（理解 site 标签的现有结构）

执行任何阶段时，遇到与本手册冲突的"看似合理的优化"——**先 STOP，问 owner，再动**。

---

## 1. 验收目标（Definition of Done）

全部完成后，用户应能：

- 在「设置 → 网站 → 外观」区块：
  - 切换主题模式：`浅色 / 深色 / 跟随系统`
  - 切换主题预设：`默认 / Miku 青`，预设旁有色片预览
  - 启用 / 关闭背景图，上传本地图片或填 URL
  - 调节背景图模糊（0–30 px）、图片显示度（0–100%）、适配方式（cover / contain）
- 联动行为：
  - 用户**首次**把预设从 `default` 切到 `miku` 时，`mode` 自动同步为 `dark`；之后切换 mode 与 preset 互不影响
  - 老用户（`localStorage['cloudnav_site_settings']` 中无 `theme` 字段）打开页面行为与改造前完全一致
  - 老用户的 `localStorage['theme']`（旧的 dark/light 持久化键）仍然工作，作为 fallback
- 数据落点：
  - 所有主题状态写在 `cloudnav_site_settings.theme`，通过现有 `/api/storage` `saveConfig: 'website'` 同步到 KV
  - **不**新建 localStorage key、**不**新建 API 端点
- 视觉：
  - 暗色 + Miku + 启用背景图，三者任意组合下文字均可读，无 FOUC（无白闪 / 暗闪）
  - 暗色转场动画（clip-path）随主题色一起切换，不再硬编码 `#020617 / #f8fafc`

---

## 2. 数据契约（types）

下列类型为**最终形态**，三个阶段共同遵守，不许私自调整字段名或可选性。

```ts
// types.ts —— 在文件末尾追加

export type ThemeMode = 'light' | 'dark' | 'system';

/** 字符串字面量留出 string 通配，方便日后追加预设而不破坏 TS 调用点 */
export type ThemePreset = 'default' | 'miku' | string;

export interface ThemeBackground {
  enabled: boolean;
  url?: string;                                 // base64 data URI 或外链
  blur?: number;                                // 0–30 px
  opacity?: number;                             // 0–1，UI 文案"图片显示度"，越大图越显
  position?: 'cover' | 'contain' | 'tile';     // 'tile' 预留，UI 暂不暴露
}

export interface ThemeSettings {
  mode: ThemeMode;
  preset: ThemePreset;
  background?: ThemeBackground;
  /** 预留：CSS 变量名（不带 -- 前缀）→ 值；UI 暂不暴露 */
  overrides?: Partial<Record<string, string>>;
}

// 修改 SiteSettings：在末尾追加可选字段
export interface SiteSettings {
  title: string;
  navTitle: string;
  favicon: string;
  cardStyle: 'detailed' | 'simple';
  requirePasswordOnVisit: boolean;
  passwordExpiryDays: number;
  theme?: ThemeSettings;     // ← 新增；可选，保证向后兼容
}
```

---

## 3. 全局命名约束（强约束）

- **CSS 变量**：`--color-{语义}`、`--bg-{语义}`，全部 kebab-case；禁止 `--my-blue` 类无语义命名
- **Tailwind token**（在 `index.html` 内联 config）：所有新增 token 通过 `var(--...)` 桥接到 CSS 变量；禁止写死色值
- **预设类名**：`html.theme-{preset}`，与 `html.dark` 通过**类组合**叠加（不是替换）
- **localStorage key**：禁止新建；只读写 `cloudnav_site_settings`、`cloudnav_auth_token`、`lastLoginTime`、`theme`（旧值，仅兼容读）
- **文件结构**：
  ```
  services/
    siteSettings.ts      ← 新建（normalize + 默认值）
    themePresets.ts      ← 新建（预设元数据集中常量）
  ```

---

## 4. 实施阶段总览

| 阶段 | Owner | 可独立合入 | 主要文件 | 验收负责人 |
|---|---|---|---|---|
| Phase 1：令牌 + 类型 + 兜底 | Agent A | ✅ 合入后视觉无变化 | `index.html`、`types.ts`、`services/siteSettings.ts`（新）、`services/themePresets.ts`（新）、`App.tsx`（仅 1 行硬编码修复） | Verifier |
| Phase 2：应用层 effect + 启动脚本兜底 | Agent B | ✅ 需 Phase 1 已合入 | `App.tsx`、`index.html`（启动 IIFE） | Verifier |
| Phase 3：外观 UI 区块 | Agent C | ✅ 需 Phase 1+2 已合入 | `components/SettingsModal.tsx` | Verifier |
| Phase 4：端到端验收 | Verifier | — | 跑测 + 截图 + checklist | owner |

---

## 5. Phase 1 — 令牌层 / 类型 / 兜底工具

### 5.1 任务清单

- [ ] `types.ts`：在文件末尾追加 §2 的类型定义；扩展 `SiteSettings` 加 `theme?` 字段
- [ ] 新建 `services/siteSettings.ts`：导出 `DEFAULT_SITE_SETTINGS`、`defaultTheme()`、`normalizeSiteSettings()`
- [ ] 新建 `services/themePresets.ts`：导出 `THEME_PRESETS` 常量与 `isKnownPreset()`
- [ ] `index.html`：扩展 `<style>`（CSS 变量 + 背景图层 CSS）+ `<script>` 中 `tailwind.config`（语义 token 映射）
- [ ] `App.tsx`：**仅**修复 `:2403` 硬编码色值；**不**做其它改动（其它改动在 Phase 2）

### 5.2 文件改动模板

#### 5.2.1 `services/siteSettings.ts`（新建）

```ts
import type { SiteSettings, ThemeSettings } from '../types';

export function defaultTheme(): ThemeSettings {
  return {
    mode: 'light',
    preset: 'default',
    background: { enabled: false, blur: 8, opacity: 0.35, position: 'cover' },
    overrides: {},
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  title: 'MikuLab-Nav',
  navTitle: 'MikuLab-Nav',
  favicon: '',
  cardStyle: 'detailed',
  requirePasswordOnVisit: false,
  passwordExpiryDays: 7,
  theme: defaultTheme(),
};

/** 兜底 / 兼容老配置；调用点禁止再写局部默认值 */
export function normalizeSiteSettings(s?: Partial<SiteSettings> | null): SiteSettings {
  const base = DEFAULT_SITE_SETTINGS;
  const t = s?.theme;
  return {
    title:                  s?.title || base.title,
    navTitle:               s?.navTitle || base.navTitle,
    favicon:                s?.favicon ?? base.favicon,
    cardStyle:              s?.cardStyle || base.cardStyle,
    requirePasswordOnVisit: s?.requirePasswordOnVisit ?? base.requirePasswordOnVisit,
    passwordExpiryDays:     s?.passwordExpiryDays ?? base.passwordExpiryDays,
    theme: t
      ? {
          mode:   (t.mode as ThemeSettings['mode']) ?? 'light',
          preset: t.preset ?? 'default',
          background: {
            enabled:  t.background?.enabled ?? false,
            url:      t.background?.url ?? '',
            blur:     clampNum(t.background?.blur, 0, 30, 8),
            opacity:  clampNum(t.background?.opacity, 0, 1, 0.35),
            position: t.background?.position ?? 'cover',
          },
          overrides: t.overrides ?? {},
        }
      : defaultTheme(),
  };
}

function clampNum(v: number | undefined, lo: number, hi: number, fallback: number): number {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.max(lo, Math.min(hi, v));
}
```

#### 5.2.2 `services/themePresets.ts`（新建）

```ts
import type { ThemePreset } from '../types';

export interface ThemePresetMeta {
  id: ThemePreset;
  name: { zh: string; en: string };
  /** UI 上显示的色片（accent 主色） */
  accentSwatch: string;
  /** 简短描述，可空 */
  description?: { zh: string; en: string };
}

export const THEME_PRESETS: ThemePresetMeta[] = [
  {
    id: 'default',
    name: { zh: '默认',     en: 'Default' },
    accentSwatch: '#3b82f6',
  },
  {
    id: 'miku',
    name: { zh: 'Miku 青',  en: 'Miku' },
    accentSwatch: '#39C5BB',
    description: {
      zh: '以 #39C5BB 为主色的青绿调',
      en: 'Teal palette built around #39C5BB',
    },
  },
];

export function isKnownPreset(p: string): boolean {
  return THEME_PRESETS.some((x) => x.id === p);
}
```

#### 5.2.3 `index.html` —— `<style>` 块（在现有 body 字体规则之后追加）

```css
/* ============================================================
   Theme tokens —— 语义 token 由 CSS 变量驱动
   ============================================================ */
:root {
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

  --bg-image:           none;
  --bg-blur:            0px;
  --bg-overlay-alpha:   1;        /* 1 = 完全遮挡（看不到图）；0 = 完全透出图 */
  --bg-position-size:   cover;
  --bg-position-repeat: no-repeat;
}

/* default 主题暗色 */
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
}

/* Miku 主题（亮） */
html.theme-miku {
  --color-surface:           #f4fbfa;
  --color-surface-elevated:  #ffffff;
  --color-surface-muted:     #e8f5f3;
  --color-fg:                #0d2a28;
  --color-fg-muted:          #3d5e5b;
  --color-fg-subtle:         #8aa8a5;
  --color-border-default:    #cfe7e3;
  --color-border-strong:     #a3d2cc;
  --color-accent:            #39C5BB;
  --color-accent-fg:         #ffffff;
  --color-accent-soft:       #d4f0ed;
}

/* Miku 主题（暗）—— 与 .dark 类叠加 */
html.theme-miku.dark {
  --color-surface:           #0d1f1e;
  --color-surface-elevated:  #163331;
  --color-surface-muted:     #1a3a37;
  --color-fg:                #ecfffd;
  --color-fg-muted:          #a8d0cc;
  --color-fg-subtle:         #5a7976;
  --color-border-default:    #224a45;
  --color-border-strong:     #336b65;
  --color-accent:            #39C5BB;
  --color-accent-fg:         #0d1f1e;
  --color-accent-soft:       rgba(57, 197, 187, 0.18);
}

/* ============================================================
   背景图层 —— 通过 body 伪元素渲染，避免污染组件
   ============================================================ */
html.has-bg-image body { position: relative; }
html.has-bg-image body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: var(--bg-image);
  background-size: var(--bg-position-size, cover);
  background-position: center;
  background-repeat: var(--bg-position-repeat, no-repeat);
  filter: blur(var(--bg-blur, 0));
  transform: scale(1.05);   /* 防止 blur 时边缘出现透明缝 */
  z-index: -2;
  pointer-events: none;
}
html.has-bg-image body::after {
  content: '';
  position: fixed; inset: 0;
  background-color: var(--color-surface);
  opacity: var(--bg-overlay-alpha, 1);
  z-index: -1;
  pointer-events: none;
  transition: opacity 0.2s;
}
```

#### 5.2.4 `index.html` —— 内联 Tailwind config（替换现有 `tailwind.config = { ... }`）

```js
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 旧 token 保留作 alias
        primary:   '#3b82f6',
        secondary: '#64748b',
        dark:      '#0f172a',
        card:      '#1e293b',

        // 新语义 token —— 由 CSS 变量驱动
        surface:            'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-muted':    'var(--color-surface-muted)',
        fg:                 'var(--color-fg)',
        'fg-muted':         'var(--color-fg-muted)',
        'fg-subtle':        'var(--color-fg-subtle)',
        'border-default':   'var(--color-border-default)',
        'border-strong':    'var(--color-border-strong)',
        accent:             'var(--color-accent)',
        'accent-fg':        'var(--color-accent-fg)',
        'accent-soft':      'var(--color-accent-soft)',
        danger:             'var(--color-danger)',
        success:            'var(--color-success)',
        warning:            'var(--color-warning)',
        info:               'var(--color-info)',
      }
    }
  }
}
```

#### 5.2.5 `App.tsx` —— 修复 `:2403` 硬编码（**唯一的** App.tsx 改动）

```diff
- backgroundColor: themeTransition.targetDark ? '#020617' : '#f8fafc',
+ backgroundColor: themeTransition.targetDark
+   ? 'var(--color-surface, #020617)'
+   : 'var(--color-surface, #f8fafc)',
```

### 5.3 Phase 1 验收标准

执行 `npm run dev` 后：

1. **零视觉变化**：与改造前比较，浅色 / 暗色截图必须像素级一致（允许 ±2 px 抗锯齿差异）
2. **TS 编译通过**：无类型错误
3. **导出可被引用**：在浏览器 console 中执行 `await import('/services/siteSettings.ts')` 与 `await import('/services/themePresets.ts')` 都能拿到对象
4. **Tailwind token 可用**：浏览器 console 创建一个 `<div class="bg-surface text-fg">test</div>` 注入到 body，应当显示当前主题的表面色与文字色
5. **clip-path 动画无视觉异常**：手动触发 dark/light 切换（点右上角太阳/月亮）后过渡动画正常
6. **未触碰**：组件 `.tsx`（除 App.tsx 唯一一行）、`/api/*`、其它 services 文件
7. **交付**：`git diff --stat` + 浅 / 暗截图各一张

---

## 6. Phase 2 — 应用层 effect + 启动脚本兜底

### 6.1 任务清单

- [ ] `App.tsx`：第 743–748 行的 legacy theme init 加入"无新主题字段才走 legacy"的守卫
- [ ] `App.tsx`：第 1051–1060 行的 `applyThemeMode`，同步把 mode 写到 `siteSettings.theme.mode`
- [ ] `App.tsx`：新增一个 `useEffect`，依赖 `siteSettings.theme`，把主题落到 `<html>`
- [ ] `index.html`：扩展现有启动 IIFE，新增 `applyTheme(settings)` 函数并在 `normalizeSettings` 之后调用，**避免首屏 FOUC**

### 6.2 改动模板

#### 6.2.1 `App.tsx` —— 引入 import 与 effect

在文件头部 import 块追加：

```ts
import { defaultTheme, normalizeSiteSettings } from './services/siteSettings';
```

新增 effect（建议放在 §5 的"Theme init"那个 useEffect 紧邻位置）：

```ts
// 主题应用 —— 把 siteSettings.theme 落到 <html>
useEffect(() => {
  const t = siteSettings.theme;
  if (!t) return;

  const root = document.documentElement;

  // 1) 模式
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = t.mode === 'dark' || (t.mode === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
  if (darkMode !== isDark) setDarkMode(isDark);

  // 2) 预设（先清掉所有 theme-* 类）
  Array.from(root.classList).forEach((c) => {
    if (c.startsWith('theme-')) root.classList.remove(c);
  });
  if (t.preset && t.preset !== 'default') {
    root.classList.add(`theme-${t.preset}`);
  }

  // 3) 背景图
  const bg = t.background;
  if (bg?.enabled && bg.url) {
    const safeUrl = bg.url.replace(/"/g, '\\"');
    root.style.setProperty('--bg-image', `url("${safeUrl}")`);
    root.style.setProperty('--bg-blur', `${Math.max(0, Math.min(30, bg.blur ?? 0))}px`);
    const overlay = 1 - Math.max(0, Math.min(1, bg.opacity ?? 0.35));
    root.style.setProperty('--bg-overlay-alpha', String(overlay));
    const size = bg.position === 'contain' ? 'contain'
              : bg.position === 'tile'    ? '300px'
              : 'cover';
    const repeat = bg.position === 'tile' ? 'repeat' : 'no-repeat';
    root.style.setProperty('--bg-position-size', size);
    root.style.setProperty('--bg-position-repeat', repeat);
    root.classList.add('has-bg-image');
  } else {
    root.style.removeProperty('--bg-image');
    root.classList.remove('has-bg-image');
  }

  // 4) 自定义覆盖（预留接口，UI 暂不暴露）
  Object.entries(t.overrides ?? {}).forEach(([k, v]) => {
    if (typeof v === 'string' && v) root.style.setProperty(`--${k}`, v);
  });
}, [siteSettings.theme]);
```

#### 6.2.2 `App.tsx` —— legacy init 守卫（行 743–748 附近）

```diff
  useEffect(() => {
-   // Theme init
-   if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
-     setDarkMode(true);
-     document.documentElement.classList.add('dark');
+   // Theme init —— 仅当用户未配置新主题字段时走 legacy
+   const hasNewTheme = !!siteSettings?.theme;
+   if (!hasNewTheme) {
+     if (localStorage.getItem('theme') === 'dark' ||
+         (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
+       setDarkMode(true);
+       document.documentElement.classList.add('dark');
+     }
    }
```

#### 6.2.3 `App.tsx` —— `applyThemeMode` 双写（行 1051 附近）

```diff
  const applyThemeMode = (newMode: boolean) => {
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
+   // 同步到新的主题配置，保持两条路径一致
+   setSiteSettings(prev => ({
+     ...prev,
+     theme: {
+       ...(prev.theme ?? defaultTheme()),
+       mode: newMode ? 'dark' : 'light',
+     },
+   }));
  };
```

#### 6.2.4 `index.html` —— 启动 IIFE 扩展

在现有 IIFE（`<script>` 块内）`document.title = settings.title;` 之后，**追加** `applyTheme(settings);` 调用，并在 IIFE 内部添加该函数：

```js
function applyTheme(settings) {
  if (!settings || !settings.theme) return;
  var t = settings.theme;
  var root = document.documentElement;

  var prefersDark = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = t.mode === 'dark' || (t.mode === 'system' && prefersDark);
  if (isDark) root.classList.add('dark');

  if (t.preset && t.preset !== 'default') {
    root.classList.add('theme-' + t.preset);
  }

  var bg = t.background;
  if (bg && bg.enabled && bg.url) {
    var safe = String(bg.url).replace(/"/g, '\\"');
    root.style.setProperty('--bg-image', 'url("' + safe + '")');
    var blur = Math.max(0, Math.min(30, Number(bg.blur) || 0));
    root.style.setProperty('--bg-blur', blur + 'px');
    var op = Math.max(0, Math.min(1, Number(bg.opacity)));
    if (Number.isNaN(op)) op = 0.35;
    root.style.setProperty('--bg-overlay-alpha', String(1 - op));
    var size = bg.position === 'contain' ? 'contain'
            : bg.position === 'tile'    ? '300px' : 'cover';
    var rep  = bg.position === 'tile' ? 'repeat' : 'no-repeat';
    root.style.setProperty('--bg-position-size', size);
    root.style.setProperty('--bg-position-repeat', rep);
    root.classList.add('has-bg-image');
  }
}
```

### 6.3 Phase 2 验收标准

1. **手动改 localStorage 即可生效**：浏览器 console 执行
   ```js
   const s = JSON.parse(localStorage.getItem('cloudnav_site_settings') || '{}');
   s.theme = { mode: 'dark', preset: 'miku', background: { enabled: false } };
   localStorage.setItem('cloudnav_site_settings', JSON.stringify(s));
   location.reload();
   ```
   首屏立即是 Miku 暗色，**无白闪 / 暗闪**
2. **legacy 兼容**：清空 `cloudnav_site_settings`，只留 `localStorage['theme'] = 'dark'`，刷新后仍是默认暗色
3. **toggle 同步**：点击右上角太阳/月亮，`siteSettings.theme.mode` 与 `localStorage['theme']` 同步更新
4. **背景图变量正确**：手测开启 `background.enabled=true` + `url=` 一张图，body 后能看到图、有遮罩
5. **TS 编译通过**、控制台无 React 警告
6. **未触碰**：types.ts、services/、SettingsModal.tsx、其它组件
7. **交付**：`git diff --stat` + 三种模式（浅 / 暗 / Miku 暗）截图

---

## 7. Phase 3 — 外观 UI 区块

### 7.1 任务清单

- [ ] `components/SettingsModal.tsx` 引入 `THEME_PRESETS`、`defaultTheme`、`ThemeMode`、`ThemePreset`
- [ ] 在 `localSiteSettings` 兜底处使用 `normalizeSiteSettings`（避免重复 fallback）
- [ ] 在 `activeTab === 'site'` 分支末尾，新增 `<section>` "外观"
- [ ] 实现：模式 radio、预设选择（带色片）、背景图开关、上传 / URL、模糊滑块、显示度滑块、适配 radio、清除按钮、缩略图预览
- [ ] **联动逻辑**：当 `preset` 变成 `'miku'` 且**之前**不是 `'miku'`，同时把 `mode` 设成 `'dark'`
- [ ] 文件大小校验：图片 ≤ 1 MB，超出弹 alert 提示并拒绝
- [ ] 不动既有保存逻辑（`handleSave` 已经把整个 `localSiteSettings` 透传，`theme` 字段会自动随同）

### 7.2 UI 形态规范

```
─── 外观 ──────────────────────────────────────────
 主题模式
  ( ) 浅色   ( ) 深色   ( ) 跟随系统

 主题预设
  [ ⬤ #3b82f6  默认  ▾ ]   [ ⬤ #39C5BB  Miku 青  ▾ ]
  ↑ 用 button group / radio card，色片在前

 背景图
  [ ☐ 启用背景图 ]
  ─（启用时展开下面）───────────────────────────────
   图片来源
     [ 上传图片 ]      或   URL [ ____________________ ]
     <预览缩略图 96x60>

   模糊      [───●───────────] 8 px
   图片显示度 [─────●─────────] 35%
   适配方式  ( ● Cover )( ○ Contain )

   [ 清除背景图 ]
─────────────────────────────────────────────────
```

视觉要求：

- 整段使用语义 token：`bg-surface-elevated text-fg border-border-default`
- 所有滑块右侧显示当前数值
- 预览缩略图始终用 `--bg-image` 同源（确保所见即所得）
- 不启用背景图时，整个图片相关字段不渲染（不只是 disable）

### 7.3 关键代码片段

#### 7.3.1 imports

```ts
import { THEME_PRESETS } from '../services/themePresets';
import { defaultTheme, normalizeSiteSettings } from '../services/siteSettings';
import type { ThemeMode, ThemePreset, ThemeBackground } from '../types';
```

#### 7.3.2 兜底统一

替换原本手写的 `setLocalSiteSettings(() => ({ ... title || 'MikuLab-Nav' ... }))` 为：

```ts
const [localSiteSettings, setLocalSiteSettings] = useState(() =>
  normalizeSiteSettings(siteSettings)
);
// useEffect(... isOpen ...) 内同样改用 normalizeSiteSettings
```

#### 7.3.3 联动 helper

```ts
const handleThemeChange = (patch: Partial<NonNullable<typeof localSiteSettings.theme>>) => {
  setLocalSiteSettings(prev => {
    const cur = prev.theme ?? defaultTheme();
    const next = { ...cur, ...patch };
    // 首次切到 miku：联动 mode = 'dark'
    if (patch.preset === 'miku' && cur.preset !== 'miku') {
      next.mode = 'dark';
    }
    return { ...prev, theme: next };
  });
};

const handleBgChange = (patch: Partial<ThemeBackground>) => {
  setLocalSiteSettings(prev => {
    const t = prev.theme ?? defaultTheme();
    return {
      ...prev,
      theme: { ...t, background: { ...(t.background ?? {}), ...patch } as ThemeBackground }
    };
  });
};
```

#### 7.3.4 上传校验

```ts
const onPickBgFile = (file: File) => {
  if (file.size > 1024 * 1024) {
    alert('图片需小于 1 MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    handleBgChange({ url: String(reader.result), enabled: true });
  };
  reader.readAsDataURL(file);
};
```

### 7.4 Phase 3 验收标准

1. **首次切 Miku → 自动 dark**：从默认浅色开始，单击 Miku 预设，立刻变 Miku 暗；之后单独切 mode 为 light，UI 与 `siteSettings.theme.mode` 都是 light
2. **滑块即时预览**：拖模糊 / 显示度时，body 背景实时变化（不需要等点保存）—— **注意**：实时预览是为体验，但实际写入 `siteSettings` 仍需要点保存。可以接受任一种实现：
   - 方案 A（推荐）：onChange 即更新 `siteSettings`（依赖现有 effect 实时落地）
   - 方案 B：onChange 只更新 `localSiteSettings`，预览效果在 modal 内通过受控样式表现
   选 A 即可，实现最简单
3. **取消按钮**：点取消，theme 回退到打开 modal 前的状态（依赖现有 modal 关闭逻辑）
4. **超大图被拒**：上传 1.5 MB 图片，弹 alert，不写入
5. **关闭背景图**：点清除按钮，body 背景立刻回到纯色
6. **保存后落 KV**：点保存，Network 面板看到 `POST /api/storage` 含 `saveConfig: 'website'` 与完整 `theme` 对象
7. **TS 编译通过、无 React 警告**
8. **未触碰**：types.ts、services/、App.tsx、其它组件
9. **交付**：`git diff --stat` + 6 张截图（亮 / 暗 / Miku 亮 / Miku 暗 / 启用背景图 / 关闭背景图）

---

## 8. Phase 4 — 端到端验收

由 Verifier 执行。完成后向 owner 交付一份验收报告。

### 8.1 验收脚本

逐项执行，每项记录"通过 / 不通过 + 截图"：

#### A. 兼容性（最高优先级）

- [ ] **A1 老用户零侵入**：`localStorage.removeItem('cloudnav_site_settings')`，刷新；行为与改造前完全一致（亮色、无背景图、Settings 弹窗内"外观"区块全字段为默认值）
- [ ] **A2 老 dark 偏好继承**：A1 状态下，再 `localStorage.setItem('theme','dark')` + 刷新，应当是默认暗色
- [ ] **A3 KV 老配置回放**：手工 PUT 一份只含 `{ title, navTitle, ... }` 无 `theme` 字段的配置到 KV，刷新页面，应正常显示无报错

#### B. 主题切换

- [ ] **B1 默认 → Miku 联动**：从默认浅色单击 Miku 预设，应自动变 Miku 暗；连续点击 Miku 不重复触发联动
- [ ] **B2 模式独立**：在 Miku 暗下手动切 light，停留 light；再点击 default 预设，停留 light（不会被反向联动）
- [ ] **B3 跟随系统**：选择跟随系统，切换 OS 主题（macOS Appearance / Windows 色彩），页面无需刷新即更新
- [ ] **B4 转场动画**：点击右上角太阳/月亮，clip-path 转场无白闪；底色随主题变（Miku 时是 #0d1f1e / #f4fbfa，default 时是 #0f172a / #f8fafc）

#### C. 背景图

- [ ] **C1 上传**：上传一张 800 KB 动漫图，预览出现，body 立即显示
- [ ] **C2 大图拒绝**：上传 1.5 MB，弹 alert，不写入
- [ ] **C3 URL 模式**：填 `https://...` 一张外链图，正常显示；故意填错 URL，body 后是纯色无报错
- [ ] **C4 模糊与显示度**：拖动两个滑块到极限，渲染连贯、无闪烁
- [ ] **C5 适配**：切 cover / contain，预期布局符合 CSS 规范
- [ ] **C6 关闭**：点清除按钮，body 立即回纯色，刷新后仍为纯色
- [ ] **C7 跨主题**：开启背景图，切 default ↔ Miku，遮罩颜色应跟着 surface 色变（验证遮罩用的是 `var(--color-surface)`）

#### D. 持久化

- [ ] **D1 落 KV**：完成一次 mode + preset + bg 设置，点保存；Network 面板验证 POST 体含 `theme` 完整对象
- [ ] **D2 重新加载**：硬刷新（Ctrl+Shift+R），状态完整恢复，**首屏无 FOUC**
- [ ] **D3 跨设备**：另一浏览器 / 隐私窗口 + 同账号登录，`/api/storage?getConfig=website` 拉到的配置含 `theme`

#### E. 边界

- [ ] **E1 Console 无报错 / 警告**
- [ ] **E2 移动端断点（DevTools 切 375×812）**：外观区块布局可用、滑块可拖、文字不溢出
- [ ] **E3 锁定分类等已有功能**：随机点几个分类、加一条链接、批量编辑等老路径正常
- [ ] **E4 类型严格**：`tsc --noEmit` 通过

### 8.2 报告模板

```markdown
# THEMING_TASK_v1 验收报告

PR: [PR-1 链接] [PR-2 链接] [PR-3 链接]
Verifier: <name>  Date: YYYY-MM-DD

## 结果
- A 兼容性：✅ / ❌（细节）
- B 主题切换：…
- C 背景图：…
- D 持久化：…
- E 边界：…

## 阻断问题
（无 → 可合入；有 → 列出 issue 链接）

## 截图
- 亮 / 暗 / Miku 亮 / Miku 暗 / Miku 暗 + 背景图 / 移动端
```

---

## 9. 审查清单（每阶段合入前必勾）

- [ ] 没有新增 `bg-white dark:bg-slate-800` 之类二元字面量（新代码必须语义 token）
- [ ] 没有在 TSX / JS 里硬编码 hex 色值（除已知 fallback）
- [ ] `SiteSettings` 的新字段都过了 `normalizeSiteSettings`
- [ ] `index.html` 启动 IIFE 与 `App.tsx` 应用 effect 的解析逻辑一致（mode/preset/background 三项都对齐）
- [ ] 没有新建独立 localStorage key、独立 API 端点
- [ ] 没有引入新构建依赖、新的 npm 包、Tailwind 插件
- [ ] 暗 / 亮 / 跟随系统 × default / miku × bg 启用 / 禁用 共 12 种组合至少抽测过一半
- [ ] `cardStyle: 'simple'` 与 `'detailed'` 都验证过
- [ ] 移动端断点验证过
- [ ] Console 无 React 警告 / CSP 报错
- [ ] 上传 > 1 MB 图被拒并提示

---

## 10. 禁区（Hard No）

1. ❌ 全局 / 批量替换组件 className（必须语义 token 与 dark: 字面量并存）
2. ❌ 引入 CSS-in-JS、styled-components、Emotion、独立 `.css` 文件、Tailwind 插件
3. ❌ 修改 `/api/storage` 字段或新增端点
4. ❌ 把背景图传到第三方图床；只允许 base64 或外链 URL（外链由用户自负 CSP）
5. ❌ 新建除 `cloudnav_site_settings` 之外的主题相关 localStorage key
6. ❌ 改 `INITIAL_LINKS / DEFAULT_CATEGORIES` 等业务默认值
7. ❌ 把暗色色值硬编码进组件 className（应通过 `html.dark` 自动切换）
8. ❌ 修改 `services/geminiService.ts`、`services/webDavService.ts`、`functions/api/*` 等无关模块

---

## 11. 预留接口（不实现，但保持可扩展）

| 接口 | 位置 | 留给谁 |
|---|---|---|
| `ThemePreset` 字符串通配 | `types.ts` | 加预设：在 `themePresets.ts` 追一项常量 + `index.html` 加 `html.theme-{id}` CSS 块 |
| `ThemeSettings.overrides` | `types.ts` | "高级用户自定义色"功能：写入 `overrides['color-accent'] = '#xxx'` 即生效 |
| `ThemeBackground.position = 'tile'` | `types.ts` + CSS | 平铺图：UI 加一个 radio 选项即可 |
| `ThemeMode = 'system'` | 完整支持 | 已实现（含 prefers-color-scheme），UI 已暴露 |
| `body::after` 遮罩层 | CSS | 顶 / 底渐变 scrim：换 `background-image: linear-gradient(...)` 即可 |

---

## 12. 风险与回滚

| 风险 | 缓解 | 回滚 |
|---|---|---|
| 首屏 FOUC | `index.html` IIFE 同步预挂类 + 设变量 | 回退该 PR；fallback 仍是 `localStorage['theme']` 的 dark 类 |
| 用户配的外链图被 CSP 拦 | 不支持检测；建议默认推荐用户上传 | 用户清除背景图即可 |
| KV 容量超限（base64 大图） | UI 强制 ≤ 1 MB | 拒绝写入；toast 提示 |
| 老配置覆盖 | `normalizeSiteSettings` 全字段默认值，theme 可选 | 不需要 |
| Tailwind CDN 版本变化 | 暂不锁版本（与现状保持一致） | 一旦失效可加 `?v=3.4` 锁定 |

---

_最后更新：2026-05-09_
