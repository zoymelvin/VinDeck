# VinDeck

Self-hosted application dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **App Launcher**: Quick access to self-hosted applications
- **Notes**: Markdown notes with revision history
- **Profile**: Customizable profile photo and display name
- **Themes**: Light, Dark, and System themes with 7 accent colors
- **Status Checks**: Browser-based reachability checks for your apps
- **Data Export/Import**: JSON backup and restore

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy

- Set `engines.node` in `package.json` to match your Vercel Node.js runtime (e.g. `22.x`).
- Keep `@types/node` on the same major version as the runtime so it satisfies vitest/vite peer requirements.
- Do not use `--legacy-peer-deps`, `--force`, or `.npmrc` workarounds.
- Before deploying, verify in a clean worktree: `npm install` (no flags), `npm ci`, `npm run build`, and `npm test`.

## Profile Photo

Profile photos can be set via the avatar menu or Settings page:

- **Upload file**: PNG/JPG/WEBP, max 2 MB (center-cropped to 256x256, stored as WebP data URL)
- **Paste image URL**: Must be HTTPS. Same rules as Icon URL.
- **Remove**: Reverts to gradient monogram

Profile data is stored per-device in localStorage. Use Export/Import to transfer between devices.

## Icon URL

When adding or editing an app, paste a link to a PNG, JPG, WEBP, or SVG image in the "Icon URL" field. Example sources:

- [dashboardicons.com](https://dashboardicons.com) - logos for most self-hosted apps

Validation: must be HTTPS, image must load within 8 seconds. Empty = monogram fallback. Built-in apps use local PNG icons from `/icons/`.

## Content Security Policy

VinDeck applies a strict CSP:

- `default-src 'self'` - only same-origin resources
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - required by Next.js
- `style-src 'self' 'unsafe-inline'` - required by Tailwind
- `img-src 'self' data: https:` - allows icon URLs and profile photos from HTTPS
- `connect-src 'self' https:` - allows status checks to app domains
- `font-src 'self' data:` - local fonts
- `object-src 'none'` - no plugins
- `base-uri 'self'` - prevent base tag injection
- `frame-ancestors 'none'` - prevent embedding

No runtime requests to third parties except user-provided icon/profile URLs and app domains.

## App Status Checks

Status checks are performed from the browser using `fetch()` with `no-cors` mode and a 4-second timeout:

- **Resolve (opaque response)** = Online
- **Network error / timeout** = Offline
- **Before completion** = Checking…

Some apps may block browser-based checks (e.g., via CORS or authentication headers). In that case, the status will show as Offline even if the app is reachable. This is a limitation of browser-based checks and is documented here rather than faking the status.

## Credits

### Application Icons

Icons provided by [homarr-labs/dashboard-icons](https://github.com/homarr-labs/dashboard-icons) under the Apache-2.0 License.

Fallback monograms are generated automatically when an icon fails to load.

All trademarks, logos, and brand names are the property of their respective owners.

## Data Storage

All data is stored in the browser's localStorage. Data is versioned (schema v3) with automatic migration. Use Export/Import (JSON) to backup or transfer data between devices.

## License

MIT