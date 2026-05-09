# CloudNav-MikuLab

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja-JP.md)

### 複製給 AI

將下面這段提示詞複製到你的 LLM agent（Claude Code、AmpCode、Cursor 等）中：

```text
專案網址：https://nav.mikulab.com
倉庫地址：https://github.com/MikuLab39/CloudNav-MikuLab

請閱讀這份 README，並根據專案內容生成一份詳細的繁體中文教學。請涵蓋專案概覽、Cloudflare Pages/KV 部署、設定說明、使用方式與常見檢查項目。內容要準確、實用，並嚴格以倉庫中的真實設定為依據。
```

本專案是 MikuLab 自用的導覽站版本，基於以下專案融合並依照自身需求持續修改：

- https://github.com/sese972010/CloudNav-
- https://github.com/aabacada/CloudNav-abcd
- https://github.com/Aaowu/CloudNav-Oorz

原有功能說明與部署教學保留在下方，目前本地化版本統一命名為 `CloudNav-MikuLab`，示範站點為 <https://nav.mikulab.com>。

## 更新日誌

### 2026.04.07

1. 修復 AI 設定可被未授權讀取的問題，`/api/storage?getConfig=ai` 現已要求登入驗證。
2. 修復 WebDAV 代理介面未授權的問題，備份、還原、測試連線現在都需要有效登入狀態。
3. 刪除 `index.html` 中不存在的 `/index.css` 引用，避免額外 404 請求。
4. WebDAV 設定現已支援寫入 KV，並在登入後自動從 KV 拉回到目前裝置。

## 核心功能

### 🧠 AI 深度整合

* **多模型支援**：完整支援 **Google Gemini**、**OpenAI**、**DeepSeek**、**Claude** 等任何相容 OpenAI 介面的模型。
* **一鍵智能補全**：在設定面板一鍵掃描，自動為成百上千個書籤生成精準的中文簡介。
* **智慧分類**：新增連結時，AI 自動分析網頁內容並推薦最合適的分類目錄。

### ☁️ 資料同步與安全

* **Cloudflare KV 同步**：利用邊緣儲存技術，公司、家裡、手機三端資料秒級同步。
* **連結圖示持久化**：第一次新增連結時自動抓取並存入 Cloudflare KV，換裝置開啟也不用重新補圖示。
* **WebDAV 雙重備份**：支援 Nextcloud 等 WebDAV 網盤備份，資料自主掌控，並可選將目前 WebDAV 設定一起打包同步。
* **隱私加密體系**：
  * **全域鎖**：部署時設定存取密碼，防止他人查看。
  * **導覽統一鎖**：可批次標記受保護分類，共用一個導覽鎖密碼，解鎖後統一存取。
  * **後端過濾保護**：未解鎖導覽鎖時，介面預設不回傳受保護分類下的連結內容。

### 🎨 極致體驗

* **Chrome 擴充功能 (Pro)**：
  * **一鍵儲存**：點擊瀏覽器圖示即可彈出側邊欄，快速將目前網頁儲存到指定分類。
  * **側邊欄導覽**：按下快捷鍵（如 Ctrl+Shift+E）喚出側邊欄，在任意網頁直接瀏覽、搜尋和管理您的書籤，無需離開目前頁面。
* **置頂專區**：常用網站一鍵置頂，在首頁頂部常駐顯示。
* **無縫遷移**：支援匯入 Chrome/Edge 書籤 HTML 檔案（智慧去重）。

> 💡 部分功能創意參考自 [CloudNav-abcd](https://github.com/aabacada/CloudNav-abcd)，該分支的導覽專案同樣優秀，特此致謝。

## 部署教學（免費）

本應用完全基於 **Cloudflare Pages** + **KV** 建構，無需伺服器，永久免費。

### 部署步驟

1. **Fork 專案**：點擊右上角 Fork 按鈕，將本專案複製到您的 GitHub 帳號。
2. **建立 Pages 應用**：登入 Cloudflare Dashboard -> Workers & Pages -> 建立應用程式 -> Pages -> 連接到 Git -> 選擇 `CloudNav-MikuLab`。
3. **設定建置**：
   * 框架預設：**無 (None)**
   * 建置命令：`npm run build`
   * 輸出目錄：`dist`
4. **建立資料庫**：在 Workers & Pages -> KV 中建立一個新的命名空間，命名為 `CLOUDNAV_DB`。
5. **繫結變數**：
   * 進入 Pages 專案設定 -> 繫結 (Bindings) -> 新增 KV 命名空間 -> 變數名稱填 `CLOUDNAV_KV`，值選擇剛才建立的 `CLOUDNAV_DB`。
   * 進入 環境變數 (Environment variables) -> 新增變數 `PASSWORD`，值為您的存取密碼。
6. **部署**：重新部署專案即可。

### 說明

* `CLOUDNAV_KV` 是 Cloudflare Pages 必須繫結的 KV 命名空間。
* `PASSWORD` 用於站點 / 管理員登入保護。
* 修改繫結或環境變數後，需要重新部署 Pages。

## 使用指南

### 1. Chrome 擴充程式（推薦）

點擊側邊欄左下角的 **「設定」** -> **「擴充工具」**。

系統會自動依據您的網域產生 3 個檔案 (`manifest.json`, `popup.html`, `popup.js`)。

1. 在電腦新建資料夾，保存這 3 個檔案。
2. 打開 Chrome 擴充功能管理頁 (`chrome://extensions`)。
3. 開啟右上角 **「開發者模式」**。
4. 點擊 **「載入未封裝的擴充功能」**，選擇剛才的資料夾。
5. 之後瀏覽網頁時，點擊外掛圖示即可彈出視窗，**選擇分類並儲存**。

### 2. 設定 AI 服務

點擊側邊欄底部的 **「設定」** -> **「AI 設定」**：

* **提供商**：Google Gemini 或 OpenAI 相容（DeepSeek 等）。
* **Key & Model**：輸入 API Key 和模型名稱。
* **一鍵補全**：點擊底部的 **「一鍵補全所有描述」**，AI 將自動掃描所有無描述的連結並於背景生成。

### 3. WebDAV 備份

點擊側邊欄的 **「備份」** 圖示，設定 WebDAV 資訊，即可一鍵上傳備份到雲端。

如果您想把目前 WebDAV 位址、帳號和應用密碼一起遷移，也可以在備份時勾選同步 WebDAV 設定，還原或匯入時再決定要不要覆蓋本地設定。

### 4. 本地資料匯出

點擊側邊欄的 **「備份」** 圖示 -> **「匯出 HTML」**。

* 產生的 HTML 檔案完全相容 **Chrome**、**Edge**、**Firefox** 等主流瀏覽器的匯入格式。
* 完整保留您在雲航中整理的分類目錄結構。

**如何匯入到瀏覽器（以 Chrome 為例）：**

1. 打開 Chrome 瀏覽器，點擊右上角選單 -> **書籤與清單** -> **書籤管理員**。
2. 點擊頁面右上角的三個點圖示 -> **匯入書籤**。
3. 選擇剛才從雲航下載的 HTML 檔案即可還原所有書籤。

## 回饋

如果有 Bug 或改善建議，請在 Issue 中提交。
