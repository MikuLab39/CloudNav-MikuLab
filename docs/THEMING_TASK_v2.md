# Mikunav 主题改造执行手册 v2（修复包：让 Miku 主题与背景图真的可见）

> v1 把 CSS 变量管道修好了，但 ~507 处组件 className 仍是死值（`bg-white / dark:bg-slate-800 / text-blue-500 ...`），导致主题色无人读、背景图被 `<main>` 遮死。
> v2 是**定向迁移修复包**：抓"决定整体观感"的 ~50–80 处 className，把它们换成 v1 已经接好的语义 token；同时让背景图真的能透出来。
>
> 本手册补充 v1，**未在本手册中重新提及的约束、禁区、命名规则一律沿用 `docs/THEMING_TASK_v1.md`**（特别是 §3、§9、§10、§11）。

---

## 0. 前置阅读

1. `docs/THEMING_GUIDE.md`：架构原则
2. `docs/THEMING_TASK_v1.md`：v1 验收报告 + §3、§9、§10
3. 本手册全文
4. 跑过一次 `npm run dev`，亲眼确认 v1 现状（默认 vs Miku 几乎无视觉差异）

---

## 1. 修复目标（Definition of Done）

完成 Phase 5+6+7 后，下列必须**用肉眼**就能看出区别：

1. **主题色显形**：切到 Miku，侧边栏激活态、添加按钮、聚焦环、置顶图标、徽章、搜索框聚焦圈，全部呈现 `#39C5BB`（亮 Miku 是青绿底白字，暗 Miku 是青绿在深青背景上）
2. **表面色显形**：切到 Miku Light，整页背景从蓝灰偏暖白变成淡青绿；切到 Miku Dark，整页背景从蓝黑变成深青墨
3. **背景图能看见**：启用背景图后，正文区域（main）变透明，图片真的从卡片之间透出来；侧边栏、卡片、Modal 仍然不透明保持可读
4. **安全网**：设置 → 网站 → 外观新增「恢复默认」按钮，一键回到 v1 状态（preset='default'、mode='light'、bg.enabled=false）
5. **没做就是没做**：状态色（红/绿/黄）、阴影、渐变图标块**保持原样**——不要顺手改

---

## 2. 实施总览

| 阶段 | Owner | 前置 | 主要改动 | 是否门槛 |
|---|---|---|---|---|
| Phase 5 (Pilot) | Agent D | v1 已合入 | App.tsx 全文 + index.html（背景穿透 CSS）+ SettingsModal（恢复默认按钮）| **是**：未通过验收禁止进入 Phase 6 |
| Phase 6 (Extend) | Agent E | Phase 5 通过验收 | 11 个 Modal 组件外壳 | 否，可分批合入 |
| Phase 7 (Verify) | Verifier | 5+6 都合入 | 端到端验收 + 报告 | — |

---

## 3. 替换规律（核心字典，所有阶段共用）

**机械替换**：以下三组规则可以全文 search-replace，不需要看上下文。**先逐条肉眼跑过 1–2 处确认**，再批量；批量后**逐文件 diff review**。

### 3.A — Surface 系列（容器底色 / 边框 / 文字色）

```
bg-white dark:bg-slate-800              → bg-surface-elevated
bg-white dark:bg-slate-600              → bg-surface-elevated      (active pill 内部)
bg-gray-50 dark:bg-slate-900            → bg-surface
bg-slate-50 dark:bg-slate-900           → bg-surface
bg-slate-50/50 dark:bg-slate-800/50     → bg-surface-muted          (alpha 退化为 muted)
bg-slate-100 dark:bg-slate-700          → bg-surface-muted
bg-slate-100 dark:bg-slate-800          → bg-surface-muted
bg-slate-200 dark:bg-slate-700          → bg-surface-muted
bg-slate-100 dark:bg-slate-700/50       → bg-surface-muted
bg-slate-100 dark:bg-slate-700/30       → bg-surface-muted

border-slate-200 dark:border-slate-700  → border-border-default
border-slate-100 dark:border-slate-700  → border-border-default
border-slate-200 dark:border-slate-600  → border-border-default
border-slate-300 dark:border-slate-600  → border-border-strong

text-slate-900 dark:text-slate-50       → text-fg
text-slate-800 dark:text-slate-200      → text-fg
text-slate-700 dark:text-slate-300      → text-fg-muted
text-slate-600 dark:text-slate-400      → text-fg-muted
text-slate-600 dark:text-slate-300      → text-fg-muted
text-slate-500 dark:text-slate-400      → text-fg-subtle
text-slate-400                          → text-fg-subtle
dark:text-white                         → dark:text-fg              (input/textarea 内常见)
dark:text-slate-200                     → dark:text-fg
dark:text-slate-300                     → dark:text-fg-muted

hover:bg-slate-100 dark:hover:bg-slate-700      → hover:bg-surface-muted
hover:bg-slate-200 dark:hover:bg-slate-600      → hover:bg-surface-muted
hover:bg-slate-50 dark:hover:bg-slate-700       → hover:bg-surface-muted
hover:bg-slate-50 dark:hover:bg-slate-700/50    → hover:bg-surface-muted
hover:bg-white dark:hover:bg-slate-700          → hover:bg-surface-elevated
```

### 3.B — Accent 系列（让 #39C5BB 显形的核心）

```
text-blue-600 dark:text-blue-400        → text-accent
text-blue-600 dark:text-blue-300        → text-accent
text-blue-500                           → text-accent
text-blue-400                           → text-accent

bg-blue-50 dark:bg-blue-900/30          → bg-accent-soft
bg-blue-50 dark:bg-blue-900/20          → bg-accent-soft
bg-blue-100 dark:bg-blue-900/30         → bg-accent-soft
bg-blue-100 dark:bg-blue-800            → bg-accent-soft
bg-blue-500                             → bg-accent
bg-blue-600                             → bg-accent
bg-blue-700                             → bg-accent                 (hover 用 opacity)

hover:bg-blue-50 dark:hover:bg-blue-900/20  → hover:bg-accent-soft
hover:bg-blue-700                           → hover:opacity-90       (替代 darker)
hover:bg-blue-600                           → hover:opacity-90

hover:text-blue-500                     → hover:text-accent
hover:text-blue-400                     → hover:text-accent

ring-blue-500                           → ring-accent
focus:ring-blue-500                     → focus:ring-accent
focus:ring-2 focus:ring-blue-500        → focus:ring-2 focus:ring-accent

hover:border-blue-400 dark:hover:border-blue-500  → hover:border-accent
hover:border-blue-300 dark:hover:border-blue-600  → hover:border-accent
hover:border-blue-500                             → hover:border-accent

fill-blue-500                           → fill-accent
```

按钮的常见组合可以一次替换：

```
"bg-blue-600 hover:bg-blue-700 text-white"      → "bg-accent hover:opacity-90 text-accent-fg"
"bg-blue-600 hover:bg-blue-700"                 → "bg-accent hover:opacity-90"
```

### 3.C — 保留不动（哪怕看到也不要改）

```
bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800   ← 卡片图标块渐变
shadow-blue-500/30   shadow-lg   shadow-2xl                                          ← 阴影
text-red-* / text-green-* / text-yellow-* / bg-red-* ...                            ← 状态色
ring-offset-* / ring-1 / ring-inset                                                  ← 不带蓝的 ring 修饰
text-white  bg-black                                                                 ← 纯字面白/黑（按钮文字色）
任何带 backdrop-blur-* 的修饰                                                        ← 不动
透明度修饰符（/10 /20 /30 /50 /80）单独出现且不在 §3.A/3.B 表中的                    ← 不动
```

---

## 4. Phase 5 — Pilot：App.tsx + 安全网 + 背景穿透

### 4.1 任务清单

- [ ] **4.A** 对 `App.tsx` 全文应用 §3.A、§3.B 替换规律（不动 §3.C）
- [ ] **4.B** 在 `index.html` 的 `<style>` 末尾追加"背景图穿透"CSS（让 main / body 在 has-bg-image 时透明）
- [ ] **4.C** 在 `components/SettingsModal.tsx` 的"外观"区块新增「恢复默认」按钮
- [ ] **4.D** 跑通 §4.5 视觉门槛验收

### 4.2 App.tsx 改动方法

> **不许重写整个文件**，只做替换。Edit 工具的 replace_all 适合做这种批处理；但**每个字符串替换前必须先读 1 处样例确认上下文**。

执行步骤建议：

1. 用 Grep 先列出每条规则在 App.tsx 中的命中数（基线）
2. 按 §3.A → §3.B 顺序，逐条 Edit replace_all
3. 替换完后再用 Grep 反查：`bg-white|dark:bg-slate-800|text-blue-500|ring-blue-500` 等还剩多少（剩下的应当是 §3.C 保留项或新引入的语义 token 关联代码）
4. **关键热点**必须出现在 diff 中（见 §4.3，缺一不可）

### 4.3 必须命中的 12 处关键热点（缺一不可）

替换完成后，对 App.tsx 跑 `git diff App.tsx`，确认下列锚点行的 className 已被改写：

| 行号（v1 当前） | 描述 | v2 期望关键字段 |
|---|---|---|
| 2539 | 详情卡 / 简约卡未选中态外壳 | `bg-surface-elevated border-border-default` |
| 2594 | hover 卡 | `bg-surface-elevated hover:bg-accent-soft border-border-default` |
| 2680 | 卡片操作按钮 hover | `hover:text-accent hover:bg-surface-muted` |
| 2695 | loading 屏幕 | `bg-surface text-fg-subtle` |
| 2821 | 侧边栏外壳 | `bg-surface-elevated border-r border-border-default` |
| 2838 / 2865 | 侧边栏激活分类 | `bg-accent-soft text-accent` |
| 2869 | 激活分类的图标容器 | `bg-accent-soft`（未激活：`bg-surface-muted`）|
| 2873 | 激活点 | `bg-accent` |
| 2934 | **main 容器** | `bg-surface`（去掉 `dark:bg-slate-900`） |
| 2937 | 顶部 header | `bg-surface-elevated/80` 或 `bg-surface-elevated`（接受失去一点透明感）|
| 3077 | 搜索输入框聚焦环 | `focus:ring-accent` |
| 3165 / 3210 / 3307 / 3333 / 3355 | 操作按钮（添加 / 批量 / 保存等） | `bg-accent hover:opacity-90 text-accent-fg` 或 `text-white` 保留亦可 |

**如果上面 12 处中任何一处没出现在 diff，立即停下来 review**——大概率说明替换被搞错或漏了。

### 4.4 关键 CSS / 代码片段

#### 4.4.1 `index.html` —— 背景穿透 CSS（在 `<style>` 现有"背景图层"块之后追加）

```css
/* ============================================================
   背景图穿透 —— 启用背景图时，让画布层透明，让伪元素层显形
   ============================================================ */
html.has-bg-image body {
  background-color: transparent !important;
}
html.has-bg-image main {
  background-color: transparent !important;
}
/* 顶部 header / 侧边栏 / 卡片 / Modal 保持不透明（可读性容器），不在此处覆盖 */
```

> 为什么不直接给 main 改成 `bg-transparent`？
> 因为关闭背景图时，main 仍需要 `bg-surface` 作为基础底色。CSS `!important` 仅在 `has-bg-image` 类存在时生效，等于"关图时走 Tailwind 类，开图时强制透明"——**不需要让组件 className 知道背景图开关**，关注点分离。

#### 4.4.2 `components/SettingsModal.tsx` —— 「恢复默认」按钮

在外观区块的末尾、保存/取消按钮之前，加：

```tsx
import { defaultTheme } from '../services/siteSettings';

// ... 在 JSX 内：
<div className="flex items-center justify-between pt-3 border-t border-border-default">
  <span className="text-xs text-fg-subtle">出问题了？一键回到默认主题（不影响其它设置）</span>
  <button
    type="button"
    onClick={() => {
      setLocalSiteSettings(prev => ({
        ...prev,
        theme: defaultTheme(),
      }));
    }}
    className="px-3 py-1.5 text-xs rounded-md bg-surface-muted text-fg-muted hover:bg-surface-elevated transition-colors"
  >
    恢复默认主题
  </button>
</div>
```

实现要求：
- 仅重置 `theme` 字段（preset='default' / mode='light' / bg.enabled=false / overrides={} / blur=8 / opacity=0.35）
- **不**触碰 title / navTitle / favicon / cardStyle 等其它 site 字段
- 点击后**立即在 UI 体现**（依赖 v1 Phase 2 的 effect），让用户能预览，再决定是否点保存
- 不要弹确认框（点击=预览，不点保存=不会持久化）

### 4.5 Phase 5 视觉门槛（硬性，未通过禁止 Phase 6）

**所有截图必须在同一台机器同一浏览器同一窗口尺寸下采集**。

#### 门槛 1 — 主题色显形

- [ ] **G1.1**：默认浅色截图
- [ ] **G1.2**：切换 preset 到 Miku（mode 不变 light）截图。**侧边栏激活分类**底色应为淡青绿（`#d4f0ed` 系），**激活分类的文字 + 左侧小圆点 + 图标容器** 应为 `#39C5BB`。整页背景应为暖青白（`#f4fbfa` 系），与 G1.1 的灰白可肉眼分辨
- [ ] **G1.3**：切换 mode 到 dark（preset 仍 Miku）截图。整页背景应为深青墨（`#0d1f1e` 系），与默认暗色（`#0f172a` 系）肉眼可分辨。激活分类 / 添加按钮上的青绿色仍为 `#39C5BB`
- [ ] **G1.4**：搜索框聚焦截图。聚焦环必须是 `#39C5BB`，不再是蓝色

#### 门槛 2 — 背景图穿透

- [ ] **G2.1**：随便上传一张动漫风壁纸（≤ 1MB）。设置：blur=8、显示度=35%、cover
- [ ] **G2.2**：保存后，**正文卡片之间的空白处必须看见图**（哪怕被遮罩柔化）。判断方式：DevTools 给 `<main>` 元素查 computed `background-color`，应当是 `rgba(0, 0, 0, 0)`（即 transparent）
- [ ] **G2.3**：侧边栏、Header、链接卡片仍然**完全不透明**。判断方式：DevTools 看这三个元素 computed `background-color`，应当不为 transparent
- [ ] **G2.4**：关闭背景图开关，刷新，截图应与 G1.2/G1.3 一致

#### 门槛 3 — 安全网

- [ ] **G3.1**：当前是 Miku Dark + 启用背景图。点「恢复默认主题」，UI 立即变回默认浅色（无背景图）
- [ ] **G3.2**：点保存后刷新，state 持久化为默认浅色
- [ ] **G3.3**：「恢复默认」按钮不影响 title / navTitle 等非主题字段（提前在 site 标签里改掉 navTitle 测试一下）

#### 门槛 4 — 不应该有的副作用

- [ ] **G4.1**：默认主题（preset=default、mode=light）截图，与 v1 现状对比，**整体布局、间距、阴影、圆角无可见变化**；**只有微小色差**是允许的（因为 `--color-surface` ≈ `bg-gray-50` 但不是同一个值，可能差几个色值）
- [ ] **G4.2**：状态徽章（同步成功 / 失败）的红绿色保持不变
- [ ] **G4.3**：移动端断点（375×812）布局完整、滚动正常、汉堡菜单正常

### 4.6 Phase 5 交付清单

- `git diff --stat`，主要变更应集中在 App.tsx、index.html、SettingsModal.tsx
- 8 张截图：G1.1 / G1.2 / G1.3 / G1.4 / G2.2 / G2.3 / G3.1 / G4.3
- DevTools 截图 G2.2 与 G2.3 各一张（证明 background-color 状态）
- 控制台无 React 警告 / CSP 报错
- `tsc --noEmit` 通过

**任何一项门槛未通过 → 中止 Phase 6，回到 owner 讨论。**

---

## 5. Phase 6 — Extend：Modal 外壳迁移

### 5.1 范围

下列 11 个文件，全部应用 §3.A / §3.B 替换规律：

```
components/AuthModal.tsx
components/BackupModal.tsx
components/CategoryActionAuthModal.tsx
components/CategoryAuthModal.tsx
components/CategoryManagerModal.tsx
components/ContextMenu.tsx
components/IconSelector.tsx
components/ImportModal.tsx
components/LinkModal.tsx
components/QRCodeModal.tsx
components/SearchConfigModal.tsx
```

`components/SettingsModal.tsx` **不在本阶段范围**——它在 v1 Phase 3 已部分使用语义 token，本阶段不动它（避免回归）。

### 5.2 执行节奏

按"每文件一次提交"的粒度推进。每个文件流程：

1. Grep 一遍当前文件的 `bg-white|dark:bg-slate-800|text-blue|ring-blue|...` 命中数（baseline）
2. 应用 §3 规律
3. 跑 `tsc --noEmit`
4. 在浏览器中打开该 Modal，截图浅 / 暗 / Miku-暗 三张
5. 提交，进入下一个文件

### 5.3 验收（每文件）

- [ ] Grep 残留：`bg-white|dark:bg-slate-800` 在该文件中应为 0（除非属于 §3.C 保留项）
- [ ] Modal 在浅 / 暗 / Miku 暗 下视觉无错位、文字可读
- [ ] Modal 内部按钮（确认 / 取消 / 删除等）颜色与全局一致：确认按钮用 accent，取消按钮用 surface-muted，删除按钮保持 red

### 5.4 共性陷阱

- **AuthModal 类的图标容器**（`bg-blue-100 dark:bg-blue-900/30`）→ `bg-accent-soft`；图标颜色 → `text-accent`。这是该类弹窗辨识度最高的元素，必须显形
- **input / textarea 的 focus ring** → `focus:ring-accent`，不要漏
- **删除/危险按钮**（`text-red-* / bg-red-*`）→ **保留**
- **状态色徽章**（`bg-green-50 text-green-600 / bg-red-50 text-red-600`）→ **保留**

### 5.5 Phase 6 交付清单

- 11 个独立 commit（或 1 个汇总 PR 但 commit 历史按文件拆分）
- 11 × 3 = 33 张截图（每文件浅 / 暗 / Miku-暗）
- 各文件 grep 残留 0 的证据（输出贴在 PR 里）

---

## 6. Phase 7 — Acceptance（端到端）

由 Verifier 执行，在 v1 Phase 4 验收脚本基础上 **新增**下列条目：

#### F. 视觉对比

- [ ] **F1**：v2 默认浅色 vs v1 默认浅色（迁移前 stash 一张）—— 仅微小色差，无布局变化
- [ ] **F2**：v2 Miku 浅色 vs v2 默认浅色 —— 必须能盲测分辨
- [ ] **F3**：v2 Miku 暗 vs v2 默认暗 —— 必须能盲测分辨
- [ ] **F4**：启用背景图后正文区域有图、卡片仍不透明（DevTools computed style 验证）
- [ ] **F5**：「恢复默认」一键回到 v1 默认状态

#### G. 残留扫描

```bash
# 全仓 grep，期望命中数大幅下降；剩余命中应主要分布在 SettingsModal（v1 已部分迁移，未在 v2 范围）
# 与状态色 / 渐变（§3.C 保留项）
grep -rn "bg-white dark:bg-slate-800" components/ App.tsx
grep -rn "text-blue-500\|text-blue-600 dark:text-blue-400" components/ App.tsx
grep -rn "ring-blue-500\|focus:ring-blue-500" components/ App.tsx
```

期望：
- App.tsx 中上述命中数应为 0（除 §3.C 渐变 / 状态色相关）
- components/ 中除 SettingsModal.tsx 外应为 0

#### H. 功能回归

沿用 v1 Phase 4 的 A1–E4 全部条目。**A1–A3 兼容性条目仍然必须通过**——老用户无 theme 字段时行为不变。

### 6.1 验收报告

新建 `docs/THEMING_TASK_v2_REPORT.md`，按 v1 §8.2 模板填写，加入 F / G / H 段。

---

## 7. 禁区（v2 新增 / 强调）

继承 v1 §10 的全部禁区，**新增**：

1. ❌ 不要为了"看起来一致"把状态色（红/绿/黄）也换成 accent
2. ❌ 不要重写组件（只做 className 替换；JSX 结构、props、逻辑一律不动）
3. ❌ 不要顺手优化 / 重构 / 抽组件（哪怕代码很丑）
4. ❌ 不要新增 CSS 变量、不要扩展 Tailwind config（v1 Phase 1 已经把所有需要的 token 都建好了）
5. ❌ 不要改 SettingsModal.tsx（除 Phase 5 §4.4.2 规定的「恢复默认」按钮）
6. ❌ 不要把 `bg-blue-600` 替换成 `bg-accent` 时丢掉 `text-white` / `text-accent-fg`（accent 按钮没文字色会变难看）

---

## 8. 风险与回滚

| 风险 | 缓解 | 回滚 |
|---|---|---|
| 替换误伤（漏 `dark:` 前缀） | 替换前 grep 基线，替换后 grep 残留对比 | revert 单文件 commit |
| Tailwind JIT 没识别新 token | v1 Phase 1 已配置；如真出现，检查 `index.html` 的 `tailwind.config.colors` 是否包含该 token | revert |
| 背景透明导致暗色视图主区"穿底" | 默认主题切到暗色，无背景图时不应触发（has-bg-image 才透明） | 关闭背景图即可 |
| Modal Z 轴下叠加问题 | 11 个 Modal 均使用 fixed inset-0 + z-50，背景图 ::before/::after 在 z:-1/-2 下，不会冲突 | — |
| 替换后某 Modal 视觉崩坏 | 每文件单独 commit，按文件粒度回滚 | revert 单文件 |

---

_最后更新：2026-05-09_
