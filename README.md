# CloudNav-MikuLab

[中文](README.zh-CN.md)

CloudNav-MikuLab is a personalized navigation dashboard for fast access, cloud sync, and AI-assisted bookmark management.

## Upstream Sources

This project is based on and adapted from:

- https://github.com/sese972010/CloudNav-
- https://github.com/aabacada/CloudNav-abcd
- https://github.com/Aaowu/CloudNav-Oorz

The local fork is named `CloudNav-MikuLab`, and the demo site is <https://nav.mikulab.com>.

## Features

- AI-assisted descriptions and categorization
- Cloudflare KV sync for bookmarks and settings
- WebDAV backup and restore support
- Password-based access controls
- Chrome extension support
- Browser bookmark import and export

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

## Demo

Live site: <https://nav.mikulab.com>

## License

MIT.
