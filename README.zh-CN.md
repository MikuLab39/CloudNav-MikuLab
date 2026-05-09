# CloudNav-MikuLab

[English](README.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja-JP.md)

### 复制给 AI

复制下面这段提示词到你的 LLM agent（Claude Code、AmpCode、Cursor 等）中：

```text
项目地址：https://nav.mikulab.com
仓库地址：https://github.com/MikuLab39/CloudNav-MikuLab

请阅读这份 README，并基于项目内容生成一份详细的中文教程。请覆盖项目概览、Cloudflare Pages/KV 部署、配置说明、使用方法和常见检查项。内容要准确、实用，并严格基于仓库中的真实设置。
```

本项目是 MikuLab 自用的导航站版本，基于以下项目融合并根据自身需求继续修改：

- https://github.com/sese972010/CloudNav-
- https://github.com/aabacada/CloudNav-abcd
- https://github.com/Aaowu/CloudNav-Oorz

当前本地化版本统一命名为 `CloudNav-MikuLab`，演示地址为 <https://nav.mikulab.com>。

## 更新日志

### 2026.04.07

1. 修复 AI 配置可被未授权读取的问题，`/api/storage?getConfig=ai` 现已要求登录校验。
2. 修复 WebDAV 代理接口未鉴权的问题，备份、恢复、测试连接现在都需要有效登录态。
3. 删除 `index.html` 里不存在的 `/index.css` 引用，避免额外 404 请求。
4. WebDAV 设置现已支持写入 KV，并在登录后自动从 KV 拉回到当前设备。

## 核心功能

### 🧠 AI 深度集成

* **多模型支持**：完美支持 **Google Gemini**、**OpenAI**、**DeepSeek**、**Claude** 等任何兼容 OpenAI 接口的模型。
* **一键智能补全**：在设置面板一键扫描，自动为成百上千个书签生成精准的中文简介。
* **智能分类**：添加链接时，AI 自动分析网页内容并推荐最合适的分类目录。

### ☁️ 数据同步与安全

* **Cloudflare KV 同步**：利用边缘存储技术，公司、家里、手机三端数据秒级同步。
* **链接图标持久化**：第一次添加链接时自动抓取并存进 Cloudflare KV，换设备打开也不用重新补图标。
* **WebDAV 双重备份**：支持 Nextcloud 等 WebDAV 网盘备份，数据自主掌控，并可选把当前 WebDAV 配置一起打包同步。
* **隐私加密体系**：
  * **全局锁**：部署时设置访问密码，防止他人查看。
  * **导航统一锁**：可批量标记受保护分类，共用一个导航锁密码，解锁后统一访问。
  * **后端过滤保护**：未解锁导航锁时，接口默认不返回受保护分类下的链接内容。

### 🎨 极致体验

* **Chrome 扩展插件 (Pro)**：
  * **一键保存**：点击浏览器图标即可弹出侧边栏，快速将当前网页保存到指定分类。
  * **侧边栏导航**：按下快捷键（如 Ctrl+Shift+E）呼出侧边栏，在任意网页直接浏览、搜索和管理您的书签，无需离开当前页面。
* **置顶专区**：常用网站一键置顶，在首页顶部常驻显示。
* **无缝迁移**：支持导入 Chrome/Edge 书签 HTML 文件（智能去重）。

> 💡 部分功能创意参考自 [CloudNav-abcd](https://github.com/aabacada/CloudNav-abcd)，该分支的导航项目同样优秀，特此致谢。

## 部署教程（免费）

本应用完全基于 **Cloudflare Pages** + **KV** 构建，无需服务器，永久免费。

### 部署步骤

1. **Fork 项目**：点击右上角 Fork 按钮，将本项目克隆到您的 GitHub 账号。
2. **创建 Pages 应用**：登录 Cloudflare Dashboard -> Workers & Pages -> 创建应用程序 -> Pages -> 连接到 Git -> 选择 `CloudNav-MikuLab`。
3. **配置构建**：
   * 框架预设：**无 (None)**
   * 构建命令：`npm run build`
   * 输出目录：`dist`
4. **创建数据库**：在 Workers & Pages -> KV 中创建一个新的命名空间，命名为 `CLOUDNAV_DB`。
5. **绑定变量**：
   * 进入 Pages 项目设置 -> 绑定 (Bindings) -> 添加 KV 命名空间 -> 变量名填 `CLOUDNAV_KV`，值选择刚才创建的 `CLOUDNAV_DB`。
   * 进入 环境变量 (Environment variables) -> 添加变量 `PASSWORD`，值为您的访问密码。
6. **部署**：重新部署项目即可。

### 说明

* `CLOUDNAV_KV` 是 Cloudflare Pages 必须绑定的 KV 命名空间。
* `PASSWORD` 用于站点 / 管理员登录保护。
* 修改绑定或环境变量后，需要重新部署 Pages。

## 使用指南

### 1. Chrome 扩展程序（推荐）

点击侧边栏左下角的 **“设置”** -> **“扩展工具”**。

系统会自动根据您的域名生成 3 个文件代码 (`manifest.json`, `popup.html`, `popup.js`)。

1. 在电脑新建文件夹，保存这 3 个文件。
2. 打开 Chrome 扩展管理页 (`chrome://extensions`)。
3. 开启右上角 **“开发者模式”**。
4. 点击 **“加载已解压的扩展程序”**，选择刚才的文件夹。
5. 以后浏览网页时，点击插件图标即可弹出窗口，**选择分类并保存**。

### 2. 配置 AI 服务

点击侧边栏底部的 **“设置”** -> **“AI 设置”**：

* **提供商**：Google Gemini 或 OpenAI 兼容（DeepSeek 等）。
* **Key & Model**：输入 API Key 和模型名称。
* **一键补全**：点击底部的 **“一键补全所有描述”**，AI 将自动扫描所有无描述的链接并后台生成。

### 3. WebDAV 备份

点击侧边栏的 **“备份”** 图标，配置 WebDAV 信息，即可一键上传备份到云端。

如果你想把当前 WebDAV 地址、账号和应用密码一起迁移，也可以在备份时勾选同步 WebDAV 配置，恢复或导入时再决定要不要覆盖本地配置。

### 4. 本地数据导出

点击侧边栏的 **“备份”** 图标 -> **“导出 HTML”**。

* 生成的 HTML 文件完全兼容 **Chrome**、**Edge**、**Firefox** 等主流浏览器的导入格式。
* 完整保留您在云航中整理的分类目录结构。

**如何导入到浏览器（以 Chrome 为例）：**

1. 打开 Chrome 浏览器，点击右上角菜单 -> **书签与清单** -> **书签管理器**。
2. 点击页面右上角的三个点图标 -> **导入书签**。
3. 选择刚才从云航下载的 HTML 文件即可恢复所有书签。

## 反馈

如果有 Bug 或改进建议，请在 Issue 中提交。
