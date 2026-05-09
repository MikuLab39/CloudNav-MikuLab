# CloudNav-MikuLab

> English first, with brief Chinese notes where helpful.

CloudNav-MikuLab is a personalized navigation dashboard built for fast access, lightweight organization, and optional AI-assisted management.

中文简介：这是一个面向个人使用的导航站，强调简洁、可同步、可扩展，并支持 AI 辅助整理书签。

## Overview

CloudNav-MikuLab focuses on three things:

- fast bookmark browsing and organization
- Cloudflare-based data sync and backup
- AI-assisted metadata generation and categorization

It is built with React, TypeScript, and Vite, and is designed to run on Cloudflare Pages.

## Key Features

- **AI assistance** - generate descriptions and help classify links with OpenAI-compatible models.
- **Cloud sync** - keep data aligned through Cloudflare KV.
- **WebDAV backup** - back up and restore data with WebDAV services such as Nextcloud.
- **Privacy controls** - protect the whole app or selected categories with passwords.
- **Chrome extension support** - save the current page quickly from the browser sidebar.
- **Import and export** - move bookmarks in and out of common browser formats.

中文补充：核心能力集中在 AI 整理、云端同步、备份恢复和私密访问控制。

## Deployment

This project is deployed with **Cloudflare Pages + Cloudflare KV**.

### Quick deploy

1. Fork this repository or connect it to your Cloudflare Pages project.
2. Set the build configuration:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Framework preset: `None`
3. Create a Cloudflare KV namespace.
4. Bind the KV namespace to the Pages project using the variable name `CLOUDNAV_KV`.
5. Add the environment variable `PASSWORD` for the login password.
6. Redeploy the project.

### Notes

- The app is static at build time and uses Vite for bundling.
- If you want a fresh deployment, rerun the Pages build after changing the binding or environment variables.

中文说明：部署时只需要配置 Pages、KV 和密码变量，不需要自建服务器。

## Usage

### 1. AI settings

Open the settings panel and configure your provider, API key, and model.

You can use Gemini or any OpenAI-compatible provider such as DeepSeek.

### 2. Browser extension

Use the extension tools in settings to generate the extension files, then load them into Chrome as an unpacked extension.

### 3. Backup and restore

Use the backup panel to export data, upload it to WebDAV, or restore it later.

### 4. Export bookmarks

Export your data as HTML when you want to import it into Chrome, Edge, or Firefox.

中文补充：常用流程就是配置 AI、安装扩展、备份恢复，以及按需导出书签。

## Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Notes

- Demo site: <https://nav.mikulab.com>
- The project name used in this fork is `CloudNav-MikuLab`.
- The repository is based on upstream CloudNav variants and has been adapted for MikuLab's own needs.

## Acknowledgements

This project builds on the work of the CloudNav community and related forks.

If you like the project, feel free to star the repository and open an issue for feedback or suggestions.
