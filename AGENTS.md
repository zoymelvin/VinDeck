<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# VinDeck

Self-hosted app dashboard (Next.js 16 App Router, React 19, Tailwind 4, TypeScript strict).

## Commands

```bash
npm run dev      # dev server (port 3000)
npm run build    # production build
npm run lint     # eslint (0 errors required)
npm test         # vitest run (jsdom)
npx tsc --noEmit # typecheck
```

Gate order: `tsc --noEmit` → `lint` → `test` → `build`.

## Architecture

- `src/app/` — App Router pages (`page.tsx` = login, `DashboardPage.tsx` = main dashboard, `notes/`, `settings/`)
- `src/components/` — UI components; `icons.ts` is the single Lucide icon registry (only icons proven to exist in installed version)
- `src/lib/` — `types.ts`, `storage.ts` (versioned localStorage, schema v3), `defaults.ts`, `strings.ts` (all UI text), `validation.ts`, `theme-tokens.ts`, `notes.ts`, `greeting.ts`, `notes-sync.ts`
- `src/hooks/` — `useSettingsStore.tsx` (React context + `useSyncExternalStore`, NOT zustand), `useTheme.ts`, `useToast.ts`, `useKeyboardShortcuts.ts`
- `src/server/` — server-only modules (`db.ts`, `notes-repo.ts`, `status-check.ts`). `postgres` driver imported ONLY here, never from client components
- `public/icons/` — brand PNGs (immich, vaultwarden, cockpit, filebrowser) + ICONS.md
- `public/sw.js` — minimal PWA service worker (pass-through, no caching)
- Tests: `src/lib/__tests__/`, `src/components/__tests__/`, `tests/e2e/`

## Key Conventions

- All UI text in English, sourced from `src/lib/strings.ts`
- No zustand; settings use React context + `useSyncExternalStore`
- Only new dependencies allowed: `motion`, `postgres` (server-only)
- Lucide icons only from `src/components/icons.ts`
- No `any`, `@ts-ignore`, `eslint-disable`, `dangerouslySetInnerHTML`
- No `transition: all`, empty `try/catch`, `setTimeout` hacks
- Schema changes require version bump + migration + tests in `storage.ts`
- Export/import validates schema version strictly (old exports still importable)
- CSP: `img-src 'self' data: https:` only (connect-src removed — status checks are server-side)
- Status checks: server-side POST /api/status (Node runtime, session required, SSRF-protected), browser fallback for LAN apps
- Theme: single ThemeProvider via useSyncExternalStore, inline init script in `<head>`, `:root[data-theme="light|dark"]` tokens
- Notes sync: Neon Postgres via DATABASE_URL, local-only mode when unset, build must succeed without DATABASE_URL
- `postgres` driver must not appear in client bundle

## Storage

- localStorage keys: `vindeck_settings_v2`, `vindeck_apps_v2`, `vindeck_categories_v2`, `vindeck_notes_v2`, `vindeck_schema_version`
- Schema v3: built-in apps migrated to PNG icons, categories translated (Keamanan→Security, Sistem→System, File→Files), descriptions English
- `iconCustomized` flag prevents overwriting user-customized built-in app icons
- Accent color removed; profile stored in settings (`displayName`, `photo`)

## Ports

- User's dev server: 3000/3001 (restartable, clear `.next` if needed)
- Test servers: 3100 (dev), 3101 (production) — kill by PID after use
- Never touch port 3001 (user's)

## Deploy checklist

- Before push/deploy, verify in a clean worktree from the target commit: `npm install` (no flags), `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build` (without DATABASE_URL), and `npm test`.
- Keep `@types/node` on the same major version as the Vercel runtime (match `engines.node`); align it with vitest/vite peer requirements without `--legacy-peer-deps` or `overrides`.