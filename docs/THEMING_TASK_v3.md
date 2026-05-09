# Mikunav 主题改造执行手册 v3（视觉调优 + 可迭代化）

> v1 修管道，v2 接水龙头，v3 **调出真正能用的水**——同时把一切可调参数收口到一块"调参面板"，后续加预设 / 改色调 / 微调玻璃强度都不需要再写新的 phase。
>
> 本手册补充 v1 / v2，未在本手册重新提及的约束、禁区、命名规则一律沿用。

---

## 0. 阅读优先级

1. `docs/THEMING_GUIDE.md`：架构原则
2. `docs/THEMING_TASK_v1.md`：§3、§9、§10
3. `docs/THEMING_TASK_v2.md`：§3 替换字典（v3 大量复用）、§7 禁区
4. **本手册的 §2、§3 必须先读完再动手**——它们解释了"调参的物理位置"

---

## 1. v3 改了什么、为什么

| 问题（v2 现状） | 根因 | v3 修法 |
|---|---|---|
| Miku Dark 颜色塌成一团 | canvas 已经是青绿，accent 也是青绿，accent-soft 当大块底色 → 同色相吞噬 | canvas 改近黑（不带主题色调）；accent 只在边框 / 高亮文字 / 按钮内部出现，不当大块底色 |
| 激活态"青绿底青绿字" | `bg-accent-soft text-accent` 在已经青绿的画布上无层次 | 改为 **左竖条 + accent 文字 + 10% accent 浮色**（cyberpunk 范式） |
| 背景图突兀 | 卡片是不透明实色块，盖在图上像贴纸 | 引入 `.frost` / `.frost-card` 类 + `backdrop-filter` 毛玻璃；只在 `has-bg-image` 时生效 |
| 一张图配不上亮 / 暗两种模式 | 数据模型只支持单 url | 拆成 `urlLight` / `urlDark`（旧 `url` 做向下兼容，自动迁移到 `urlDark`） |
| 现在的"调"等于改源码 / 重新发版 | CSS 变量散落、命名零散、没有"知识结构" | 在 `index.html` 顶部新建 **TWEAK DECK**：所有可调旋钮集中在一处，DevTools 实时改值即可预览 |

---

## 2. ⭐ TWEAK DECK —— 中央调参面板

下面这个 CSS 块就是 v3 的"控制台"。**改主题手感 = 只改这一个块**。每一行都注明用途与建议范围。

> 它会被放在 `index.html` `<style>` 最顶部，所有其它 CSS 都通过 `var()` 读它。

```css
/* ============================================================
   TWEAK DECK —— 主题调参面板（改这里就够了）
   ============================================================ */
:root {
  /* ---------- 1. 调色板（RGB 三元组，不要写 # 或 rgb()） ---------- */

  /* Default 预设 */
  --p-default-canvas-light:    248 250 252;   /* 默认浅色画布 */
  --p-default-canvas-dark:      15  23  42;   /* 默认深色画布（slate-900） */
  --p-default-elevated-light:  255 255 255;   /* 默认浅色卡片 / 侧栏 / Modal */
  --p-default-elevated-dark:    30  41  59;
  --p-default-accent:           59 130 246;   /* 默认主色 #3b82f6 */
  --p-default-accent-fg:       255 255 255;

  /* Miku 预设 */
  --p-miku-canvas-light:       244 251 250;   /* 浅色 - 暖青白（亮色画布维持当前感觉） */
  --p-miku-canvas-dark:         10  14  13;   /* 深色 - 近黑，仅 ~3% 青绿暗示。建议 6–24 */
  --p-miku-elevated-light:     255 255 255;
  --p-miku-elevated-dark:       19  23  21;   /* 比 canvas-dark 略亮一档 */
  --p-miku-accent:              57 197 187;   /* #39C5BB —— 不要动 */
  --p-miku-accent-fg-light:    255 255 255;   /* 亮色按钮文字 */
  --p-miku-accent-fg-dark:      10  14  13;   /* 暗色按钮文字（与 canvas-dark 同色，营造"挖空" 感） */

  /* 文字色（亮 / 暗共用，与画布解耦） */
  --p-text-light:                15  23  42;
  --p-text-light-muted:          71  85 105;
  --p-text-light-subtle:        148 163 184;
  --p-text-dark:                216 228 226;  /* 冷白，不要带强青绿 */
  --p-text-dark-muted:          148 163 184;
  --p-text-dark-subtle:         100 116 139;

  /* 边框色 */
  --p-border-light:             226 232 240;
  --p-border-dark:               42  50  47;  /* 在近黑画布上勾出 1px 描边 */

  /* 状态色（中性，不随主题切换） */
  --p-danger:   239  68  68;
  --p-success:   34 197  94;
  --p-warning:  245 158  11;
  --p-info:      14 165 233;

  /* ---------- 2. 状态强度（激活 / hover） ---------- */
  --tune-active-bg-alpha:       0.10;   /* 激活底色透明度。建议 0.05-0.20 */
  --tune-active-bar-width:      2px;    /* 激活左竖条粗细。建议 1-4px */
  --tune-hover-bg-alpha:        0.06;   /* hover 浮层透明度。建议 0.03-0.12 */

  /* ---------- 3. 毛玻璃（仅 has-bg-image 时生效） ---------- */
  /* 静态容器（侧栏 / Header / Modal） */
  --tune-glass-bg-alpha-light:        0.65;   /* 浅色：建议 0.40-0.80 */
  --tune-glass-bg-alpha-dark:         0.55;   /* 深色：建议 0.30-0.75 */
  /* 卡片（hover 会变更透） */
  --tune-glass-card-alpha-light:      0.55;
  --tune-glass-card-alpha-dark:       0.50;
  --tune-glass-card-hover-light:      0.15;   /* 浅色 hover 几乎全透（图4 风格） */
  --tune-glass-card-hover-dark:       0.40;   /* 深色 hover 维持可读 */
  /* 共用 */
  --tune-glass-blur:                 16px;    /* 模糊强度。建议 8-32px */
  --tune-glass-saturate:             140%;    /* 饱和增强 */
  --tune-glass-border-alpha:        0.18;     /* 玻璃边框透明度 */

  /* ---------- 4. 背景图层（运行时由 JS 注入图片） ---------- */
  --bg-image:           none;
  --bg-blur:            8px;
  --bg-overlay-alpha:   0.30;
  --bg-position-size:   cover;
  --bg-position-repeat: no-repeat;
}
```

后面所有 CSS 全部通过 `var(--p-*)` / `var(--tune-*)` 读这块；改色 / 改强度时**永远不要去改其它地方**。

---

## 3. ⭐ 调参指南（最重要的产出）

| 我想… | 改什么 |
|---|---|
| 暗色更黑 | `--p-miku-canvas-dark` 数字降低（如 `6 8 7`） |
| 暗色青绿味多一点 | `--p-miku-canvas-dark` 增加 G 通道（如 `10 18 16`） |
| 激活竖条更粗 / 不要竖条 | `--tune-active-bar-width: 3px` / `0px` |
| 激活底色更明显 | `--tune-active-bg-alpha: 0.18` |
| hover 几乎察觉不到 | `--tune-hover-bg-alpha: 0.03` |
| 玻璃更朦胧 | `--tune-glass-blur: 24px` + `--tune-glass-saturate: 160%` |
| 浅色 hover 不要那么透 | `--tune-glass-card-hover-light: 0.30` |
| 想换 accent 颜色玩玩 | `--p-miku-accent: <RGB 三元组>`，全站 accent 自动更新 |
| 加新预设 "sakura" | ① `services/themePresets.ts` 加常量 ② `index.html` 的 `<style>` 加一对 `html.theme-sakura { ... }` 与 `html.theme-sakura.dark { ... }`（绑定 `--color-*-rgb` 到新 `--p-sakura-*`）。**不需要改 React 代码** |
| 想做"画布亮度滑块"暴露给用户 | ① `types.ts` 加 `theme.canvasBoost: number` ② App.tsx applyTheme effect 里 `setProperty('--p-miku-canvas-dark', ...)` ③ SettingsModal 加 slider |

**DevTools 工作流（推荐）**：

1. F12 → Elements → 选 `<html>` → Styles 面板找到 `:root`
2. 找 `--p-miku-canvas-dark`，直接改值（如 `8 12 10`），按回车
3. 视觉立即更新，不需要刷新
4. 满意后把值写回 `index.html` 提交

---

## 4. 阶段总览

| Phase | Owner | 目标 | 前置 | 可独立合入 |
|---|---|---|---|---|
| 12 — 地基重铸 | Agent F | 把 CSS 变量改成 RGB 三元组形式；建 TWEAK DECK；视觉零变化 | v2 已合入 | 是 |
| 13 — Dark 重调 + 清理漏网 | Agent G | Miku Dark canvas 改近黑；清理 v2 漏迁的 className（如 Logout 按钮） | 12 通过 | 是 |
| 14 — 激活态重设 | Agent H | 侧栏激活态改"竖条 + 浮色"模式 | 13 通过 | 是 |
| 15a — 毛玻璃基础设施 | Agent I | 加 `.frost` / `.frost-card` 类到 14 处；CSS 规则 | 14 通过 | 是 |
| 15b — 双背景图 | Agent J | `urlLight` / `urlDark` 数据模型 + UI | 15a 通过 | 是 |
| 16 — 验收 + 调参演练 | Verifier | 视觉门槛 + 让用户实测 TWEAK DECK | 15b 合入 | — |

---

## 5. Phase 12 —— 地基重铸（RGB 三元组）

### 5.1 任务

把 `index.html` 的 `<style>` 整段重写：
- 顶部插入 §2 完整的 TWEAK DECK 块
- 替换原来的 `:root` / `html.dark` / `html.theme-miku` / `html.theme-miku.dark` 块为**纯绑定**形式（见 §5.2）
- `body::after` 把 `var(--color-surface)` 改成 `rgb(var(--color-surface-rgb))`
- 内联 Tailwind config 颜色 token 改 RGB 三元组形式

### 5.2 绑定块模板

```css
/* 默认浅色（:root 的画布是 default + light） */
:root {
  --color-surface-rgb:           var(--p-default-canvas-light);
  --color-surface-elevated-rgb:  var(--p-default-elevated-light);
  --color-surface-muted-rgb:     241 245 249;
  --color-fg-rgb:                var(--p-text-light);
  --color-fg-muted-rgb:          var(--p-text-light-muted);
  --color-fg-subtle-rgb:         var(--p-text-light-subtle);
  --color-border-default-rgb:    var(--p-border-light);
  --color-border-strong-rgb:     203 213 225;
  --color-accent-rgb:            var(--p-default-accent);
  --color-accent-fg-rgb:         var(--p-default-accent-fg);
  --color-danger-rgb:            var(--p-danger);
  --color-success-rgb:           var(--p-success);
  --color-warning-rgb:           var(--p-warning);
  --color-info-rgb:              var(--p-info);
}

html.dark {
  --color-surface-rgb:           var(--p-default-canvas-dark);
  --color-surface-elevated-rgb:  var(--p-default-elevated-dark);
  --color-surface-muted-rgb:     30 41 59;
  --color-fg-rgb:                var(--p-text-dark);
  --color-fg-muted-rgb:          var(--p-text-dark-muted);
  --color-fg-subtle-rgb:         var(--p-text-dark-subtle);
  --color-border-default-rgb:    var(--p-border-dark);
  --color-border-strong-rgb:     71 85 105;
  --color-accent-rgb:            96 165 250;       /* default-dark 的蓝 */
  --color-accent-fg-rgb:         var(--p-default-canvas-dark);
}

html.theme-miku {
  --color-surface-rgb:           var(--p-miku-canvas-light);
  --color-surface-elevated-rgb:  var(--p-miku-elevated-light);
  --color-surface-muted-rgb:     232 245 243;
  --color-fg-rgb:                13  42  40;
  --color-fg-muted-rgb:          61  94  91;
  --color-fg-subtle-rgb:        138 168 165;
  --color-border-default-rgb:   207 231 227;
  --color-border-strong-rgb:    163 210 204;
  --color-accent-rgb:            var(--p-miku-accent);
  --color-accent-fg-rgb:         var(--p-miku-accent-fg-light);
}

html.theme-miku.dark {
  --color-surface-rgb:           var(--p-miku-canvas-dark);
  --color-surface-elevated-rgb:  var(--p-miku-elevated-dark);
  --color-surface-muted-rgb:     26  58  55;
  --color-fg-rgb:                var(--p-text-dark);
  --color-fg-muted-rgb:          168 208 204;
  --color-fg-subtle-rgb:          90 121 118;
  --color-border-default-rgb:    34  74  69;
  --color-border-strong-rgb:     51 107 101;
  --color-accent-rgb:            var(--p-miku-accent);
  --color-accent-fg-rgb:         var(--p-miku-accent-fg-dark);
}
```

### 5.3 Tailwind config 改造

```js
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 旧 alias 保留
        primary: '#3b82f6', secondary: '#64748b', dark: '#0f172a', card: '#1e293b',

        // 新语义 token（rgb + alpha）
        surface:           'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'surface-elevated':'rgb(var(--color-surface-elevated-rgb) / <alpha-value>)',
        'surface-muted':   'rgb(var(--color-surface-muted-rgb) / <alpha-value>)',
        fg:                'rgb(var(--color-fg-rgb) / <alpha-value>)',
        'fg-muted':        'rgb(var(--color-fg-muted-rgb) / <alpha-value>)',
        'fg-subtle':       'rgb(var(--color-fg-subtle-rgb) / <alpha-value>)',
        'border-default':  'rgb(var(--color-border-default-rgb) / <alpha-value>)',
        'border-strong':   'rgb(var(--color-border-strong-rgb) / <alpha-value>)',
        accent:            'rgb(var(--color-accent-rgb) / <alpha-value>)',
        'accent-fg':       'rgb(var(--color-accent-fg-rgb) / <alpha-value>)',
        // ⚠ accent-soft 已删除：用 bg-accent/10 等替代
        danger:  'rgb(var(--color-danger-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        info:    'rgb(var(--color-info-rgb) / <alpha-value>)',
      }
    }
  }
}
```

### 5.4 body::after 修复

```diff
  html.has-bg-image body::after {
    content: '';
    position: fixed; inset: 0;
-   background-color: var(--color-surface);
+   background-color: rgb(var(--color-surface-rgb));
    opacity: var(--bg-overlay-alpha, 1);
    ...
  }
```

### 5.5 验收

- **视觉零变化**：与 v2 现状像素级一致（亮 / 暗 / Miku 亮 / Miku 暗 + 启用背景图，5 张截图对比）
- TS / 控制台无报错
- DevTools 改 `--p-miku-canvas-dark` 立刻在 Miku Dark 下生效

---

## 6. Phase 13 —— Dark 重调 + 清理漏网

### 6.1 任务

1. **TWEAK DECK 调值**：`--p-miku-canvas-dark` 在合理近黑范围（默认 `10 14 13`），用 §3 的 DevTools 工作流试 2-3 个值后定稿
2. **清理 v2 漏迁**：在 `App.tsx` + 11 个 Modal 全文 grep 残留字面量字段
3. **删除 `accent-soft`**：替换为 `bg-accent/10`、`bg-accent/15`（chips 用 15）

### 6.2 残留扫描清单

```bash
# 期望：以下命令命中数应为 0（除 §3.C 保留项 / 渐变 / 状态色）
grep -rn "bg-blue-\|text-blue-\|ring-blue-\|hover:bg-blue-\|hover:text-blue-\|fill-blue-\|hover:border-blue-\|focus:ring-blue-" components/ App.tsx
grep -rn "bg-white \|bg-white\"\|bg-white$\| bg-gray-50\|bg-slate-50 \|bg-slate-100 \|bg-slate-200 \|dark:bg-slate-7\|dark:bg-slate-8\|dark:bg-slate-9" components/ App.tsx
grep -rn "border-slate-\|text-slate-\|hover:bg-slate-\|hover:text-slate-" components/ App.tsx
grep -rn "bg-accent-soft" components/ App.tsx index.html
```

按 v2 §3.A / §3.B 字典逐条迁移；额外补：

```
bg-accent-soft                  → bg-accent/10
hover:bg-accent-soft             → hover:bg-accent/15
```

### 6.3 验收

- 上述 grep 命令命中数为 0（§3.C 保留项除外）
- 暗色 + Miku 截图：背景近黑（不再"青绿汤"）；激活态、按钮、徽章上的青绿明显显形
- 默认主题（亮 / 暗）零变化

---

## 7. Phase 14 —— 激活态重设

### 7.1 改动点（侧边栏分类列表）

`App.tsx` 第 2838、2865 行附近，把激活 / 未激活的条件 className 替换为：

```tsx
// 未激活
'border-l-[var(--tune-active-bar-width)] border-transparent text-fg-muted hover:text-fg hover:bg-fg/[var(--tune-hover-bg-alpha)]'

// 已激活
'border-l-[var(--tune-active-bar-width)] border-accent text-accent bg-accent/[var(--tune-active-bg-alpha)] font-medium'
```

> 注意：`border-l-[var(--tune-active-bar-width)]` 是 Tailwind 的 arbitrary value 语法，CDN 模式 JIT 支持。

第 2869 行的图标容器（激活 vs 未激活的 `bg-accent/10` vs `bg-surface-muted`）维持现状即可，不需要再加竖条。

第 2873 行的激活点 `bg-accent` 维持。

### 7.2 同范式应用到搜索模式 pill

第 2960 / 3123 行的 Site / Web 切换 pill（`bg-white dark:bg-slate-600` 当激活态）保持现状——它是按钮组样式不是导航激活样式，不在本 phase 范围。

### 7.3 验收

- Miku Dark 下激活分类不再"塌成一团"，能清楚看到左侧 2px 青绿竖条 + 青绿文字 + 极淡青绿浮色
- DevTools 改 `--tune-active-bar-width` 到 4px 立刻看到竖条变粗
- 默认主题下激活态视觉合理（蓝竖条 + 蓝字 + 淡蓝浮色）

---

## 8. Phase 15 —— 毛玻璃 + 双背景图

### 8.1 拆为 15a / 15b 两步走

#### Phase 15a — 毛玻璃基础设施

**新增 utility class 到 14 处容器**（只追加，不替换现有 className）：

| className | 加在哪 | 文件:行 |
|---|---|---|
| `frost` | 侧边栏 `<aside>` 或对应 div | App.tsx:2821 |
| `frost` | 顶部 `<header>` | App.tsx:2937 |
| `frost-card` | 详情卡片外层 | App.tsx:2539 |
| `frost-card` | 简约卡片外层 | App.tsx:2594 |
| `frost` | Modal 外壳 div × 11 | 11 个 Modal 各一处 |

CSS（追加到 `index.html` `<style>`）：

```css
/* ============================================================
   毛玻璃 —— 仅 has-bg-image 时生效
   ============================================================ */

/* 静态玻璃：侧栏 / Header / Modal */
html.has-bg-image .frost {
  background-color: rgb(var(--color-surface-elevated-rgb) / var(--tune-glass-bg-alpha-light)) !important;
  backdrop-filter: blur(var(--tune-glass-blur)) saturate(var(--tune-glass-saturate));
  -webkit-backdrop-filter: blur(var(--tune-glass-blur)) saturate(var(--tune-glass-saturate));
  border-color: rgb(var(--color-fg-rgb) / var(--tune-glass-border-alpha)) !important;
}
html.has-bg-image.dark .frost {
  background-color: rgb(var(--color-surface-elevated-rgb) / var(--tune-glass-bg-alpha-dark)) !important;
}

/* 卡片玻璃：默认半透 + hover 更透 */
html.has-bg-image .frost-card {
  background-color: rgb(var(--color-surface-elevated-rgb) / var(--tune-glass-card-alpha-light)) !important;
  backdrop-filter: blur(var(--tune-glass-blur)) saturate(var(--tune-glass-saturate));
  -webkit-backdrop-filter: blur(var(--tune-glass-blur)) saturate(var(--tune-glass-saturate));
  border-color: rgb(var(--color-fg-rgb) / var(--tune-glass-border-alpha)) !important;
  transition: background-color 0.2s ease;
}
html.has-bg-image.dark .frost-card {
  background-color: rgb(var(--color-surface-elevated-rgb) / var(--tune-glass-card-alpha-dark)) !important;
}
html.has-bg-image .frost-card:hover {
  background-color: rgb(var(--color-surface-elevated-rgb) / var(--tune-glass-card-hover-light)) !important;
}
html.has-bg-image.dark .frost-card:hover {
  background-color: rgb(var(--color-surface-elevated-rgb) / var(--tune-glass-card-hover-dark)) !important;
}
```

**关键性质**：
- 关闭背景图（`has-bg-image` 不存在）时，`.frost` / `.frost-card` 的样式全部不生效，回到 v2 的实色形态
- 浅色 + 启用背景图：卡片初始 55%，hover 15%（接近全透，图4 风格）
- 深色 + 启用背景图：卡片初始 50%，hover 40%（保持可读）
- 用户在 TWEAK DECK 改 4 个 alpha 值就能任意调整

#### Phase 15b — 双背景图

**类型扩展**（`types.ts`）：

```ts
export interface ThemeBackground {
  enabled: boolean;
  /** @deprecated 兼容 v2 数据；新增字段后此字段在 normalize 时自动迁移到 urlDark */
  url?: string;
  urlLight?: string;     // 浅色 / system-light 时使用
  urlDark?: string;      // 深色 / system-dark 时使用
  blur?: number;
  opacity?: number;
  position?: 'cover' | 'contain' | 'tile';
}
```

**normalize 兼容**（`services/siteSettings.ts`）：

```ts
// background: 单 url → urlDark 自动迁移
const oldUrl = t?.background?.url;
const urlLight = t?.background?.urlLight ?? '';
const urlDark  = t?.background?.urlDark  ?? oldUrl ?? '';
return {
  ...,
  background: {
    enabled:  t?.background?.enabled ?? false,
    urlLight,
    urlDark,
    // 不再持久化 url 字段（迁移完成后丢弃）
    blur: ..., opacity: ..., position: ...,
  },
};
```

**applyTheme 逻辑**（`App.tsx` + `index.html` IIFE 同步）：

```ts
const targetUrl = isDark ? bg.urlDark : bg.urlLight;
if (bg?.enabled && targetUrl) {
  root.style.setProperty('--bg-image', `url("${escapeQuote(targetUrl)}")`);
  // ... 其它变量同 v2
  root.classList.add('has-bg-image');
} else {
  root.style.removeProperty('--bg-image');
  root.classList.remove('has-bg-image');
}
```

切换 light / dark 时，由于 `useEffect` 依赖 `siteSettings.theme`，不会自动重跑。需要让 effect 同时监听 `darkMode`，或者在 effect 里同时监听 `[siteSettings.theme, darkMode]`：

```ts
useEffect(() => { /* applyTheme 逻辑 */ }, [siteSettings.theme, darkMode]);
```

**SettingsModal UI 调整**：把现有"图片来源"区拆成两块：

```
─── 背景图 ────────────────────────────────
  [ ☐ 启用 ]
  
  深色模式背景图
   [ 上传 ]   或 URL [ ____________________ ]
   <预览 96x60>  [清除]
  
  浅色模式背景图（建议用淡色 / 高调图）
   [ 上传 ]   或 URL [ ____________________ ]
   <预览 96x60>  [清除]
  
  共用调节
   模糊       [───●───] 8 px
   图片显示度 [───●───] 35%
   适配方式   ( ● Cover )( ○ Contain )
```

各自独立的 ≤ 1MB 校验。**清除按钮只清当前模式那张**，不影响另一张。

### 8.2 验收

- 启用背景图 + Miku Dark：图柔化、卡片半透、hover 更透但仍可读
- 启用背景图 + Miku Light：浅色专用图、卡片在 hover 时几乎全透（图4 风格）
- 切换 light ↔ dark 时背景图同步切换
- 老用户的 `url` 字段自动迁移到 `urlDark`，浅色模式无图直到用户上传
- DevTools 改 `--tune-glass-card-hover-light` 到 0.30 立刻看到 hover 不再几乎全透

---

## 9. Phase 16 —— 验收 + 调参演练

由 Verifier 执行，沿用 v1 §8 + v2 §6 全部验收，**新增**：

### 9.1 视觉对比矩阵（必须全过）

| | Default Light | Default Dark | Miku Light | Miku Dark |
|---|---|---|---|---|
| 无背景图 | 与 v2 一致 | 与 v2 一致 | 与 v2 一致（暖青白） | **近黑** + accent 显形 |
| 启用背景图 | 浅色玻璃 + hover 几乎全透 | 深色玻璃 | 浅色玻璃 + hover 几乎全透 | 深色玻璃 |

### 9.2 调参演练（关键）

让 Verifier 在 DevTools 中现场操作下列任务，**每项必须 < 30 秒完成**：

1. 把 Miku Dark canvas 调到更黑（`6 8 7`）
2. 把激活竖条调到 4px
3. 把浅色 hover 玻璃调到 0.30（不再几乎全透）
4. 把毛玻璃模糊从 16 调到 24

**任何一项做不到 / 不生效 / 需要刷新 → TWEAK DECK 设计未达标，退回**。

---

## 10. 禁区（v3 新增 / 强调）

继承 v1 §10 / v2 §7 的全部禁区，**新增**：

1. ❌ 不要在 TWEAK DECK 之外的地方写死颜色 / alpha / blur 数值
2. ❌ 不要在组件 className 里写 `bg-accent-soft`（已删除）
3. ❌ 不要在 React 组件里读 / 设置 CSS 变量值（除 applyTheme effect 那一处）
4. ❌ 不要把 `.frost` / `.frost-card` 加到状态色容器（红 / 绿徽章）—— 状态色保持实色
5. ❌ 不要让 `.frost` 的 `!important` 影响关闭背景图时的视觉（必须靠 `html.has-bg-image` 类作用域限制）
6. ❌ 不要把双背景图存在两个 KV 字段——共用 `background` 对象的子字段

---

## 11. 风险与回滚

| 风险 | 缓解 | 回滚 |
|---|---|---|
| RGB 三元组重构破坏 v2 视觉 | Phase 12 验收要求"像素级一致"；先在本地试，再合 | revert Phase 12 commit |
| arbitrary value `border-l-[var(--tune-active-bar-width)]` JIT 不识别 | 退化为静态 `border-l-2`，把宽度知识从 className 挪到 CSS 选择器内 | 文档备选实现 |
| Modal 加 `.frost` 后 modal 内部嵌套元素的背景被 `!important` 误伤 | `.frost` 选择器写得严格（只匹配直接添加该类的元素，不级联） | 单文件 revert |
| 双背景图 KV 数据膨胀（两张 base64） | 加总大小校验：两张共 ≤ 2 MB | UI 拒绝 |
| 老用户的 `url` 字段被丢弃前未做迁移测试 | normalize 函数加单元自测，覆盖 `url-only / urlDark-only / 都有 / 都无` 4 种场景 | 保留 `url` 字段一段过渡期再删 |

---

_最后更新：2026-05-09_
