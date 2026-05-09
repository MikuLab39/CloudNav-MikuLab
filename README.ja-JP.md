# CloudNav-MikuLab

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

### AI 用のコピー文

下のプロンプトを LLM agent（Claude Code、AmpCode、Cursor など）に貼り付けてください。

```text
リポジトリ: https://github.com/MikuLab39/CloudNav-MikuLab

この README を読んで、プロジェクトの詳細なチュートリアルを作成してください。概要、Cloudflare Pages/KV でのデプロイ、設定方法、使い方、よくある確認項目を含めてください。内容は実用的かつ正確にし、このリポジトリ内の実際の設定だけを根拠にしてください。
```

CloudNav-MikuLab は、素早いアクセス、クラウド同期、AI 支援のブックマーク管理のための個人用ナビゲーションダッシュボードです。

## 上流ソース

このプロジェクトは、以下のプロジェクトをベースにカスタマイズしています。

- https://github.com/sese972010/CloudNav-
- https://github.com/aabacada/CloudNav-abcd
- https://github.com/Aaowu/CloudNav-Oorz

ローカルフォークの名称は `CloudNav-MikuLab` で、デモサイトは <https://nav.mikulab.com> です。

## 機能

- AI による説明文生成と分類補助
- Cloudflare KV を使ったブックマークと設定の同期
- WebDAV バックアップと復元のサポート
- パスワードによるアクセス制御
- Chrome 拡張機能のサポート
- ブラウザのブックマークのインポート / エクスポート

> Some ideas and implementation inspiration come from [CloudNav-abcd](https://github.com/aabacada/CloudNav-abcd).

## デプロイ

CloudNav-MikuLab は **Cloudflare Pages** と **Cloudflare KV** 上にデプロイします。

### 手順

1. リポジトリを Fork するか、Cloudflare Pages に接続します。
2. Pages プロジェクトを作成し、リポジトリをリンクします。
3. ビルド設定を行います。
   - Framework preset: `None`
   - Build command: `npm run build`
   - Output directory: `dist`
4. `CLOUDNAV_DB` という名前の Cloudflare KV namespace を作成します。
5. その namespace を `CLOUDNAV_KV` として Pages プロジェクトにバインドします。
6. `PASSWORD` 環境変数を追加します。
7. バインド保存後に Pages を再デプロイします。

### 補足

- `CLOUDNAV_KV` はアプリデータ用の必須バインドです。
- `PASSWORD` はサイト / 管理者アクセスを保護します。
- KV バインドや環境変数を変更した場合は、Pages を再デプロイしてください。

## License

MIT.
