# CloudNav-MikuLab

- [English](README.md)
- [简体中文](README.zh-CN.md)
- [繁體中文](README.zh-TW.md)

CloudNav-MikuLab は、素早いアクセス、クラウド同期、AI 支援のブックマーク管理のための個人用ナビゲーションダッシュボードです。

## Upstream Sources

This project is based on and adapted from:

- https://github.com/sese972010/CloudNav-
- https://github.com/aabacada/CloudNav-abcd
- https://github.com/Aaowu/CloudNav-Oorz

The local fork is named `CloudNav-MikuLab`, and the demo site is <https://nav.mikulab.com>.

## Features

- AI による説明文生成と分類補助
- Cloudflare KV を使ったブックマークと設定の同期
- WebDAV バックアップと復元のサポート
- パスワードによるアクセス制御
- Chrome 拡張機能のサポート
- ブラウザのブックマークのインポート / エクスポート

> Some ideas and implementation inspiration come from [CloudNav-abcd](https://github.com/aabacada/CloudNav-abcd).

## Deployment

CloudNav-MikuLab is deployed on **Cloudflare Pages** with **Cloudflare KV**.

### Steps

1. Fork the repository or connect it to Cloudflare Pages.
2. Create a Pages project and link it to the repository.
3. Set the build configuration:
   - Framework preset: `None`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Create a Cloudflare KV namespace named `CLOUDNAV_DB`.
5. Bind the namespace to the Pages project as `CLOUDNAV_KV`.
6. Add the `PASSWORD` environment variable.
7. Redeploy the project after saving the bindings.

### Notes

- `CLOUDNAV_KV` is the required Pages binding for app data.
- `PASSWORD` protects site/admin access.
- If you change the KV binding or environment variables, redeploy Pages again.

## License

MIT.
