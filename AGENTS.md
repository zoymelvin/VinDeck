<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# VinDeck

Self-hosted app dashboard (Next.js 16 App Router, React 19, Tailwind 4, TypeScript strict).

## Verification Commands

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`

Order: `tsc` -> `lint` -> `test` -> `build`.

## Architecture & Boundaries

- `src/server/`: Server-only modules (`db.ts`, `notes-repo.ts`, `sync-repo.ts`). `postgres` driver MUST NOT be imported in client components.
- `src/components/icons.ts`: Single Lucide icon registry. Only import icons exported here.
- `src/lib/strings.ts`: All UI text string constants.
- `src/lib/storage.ts`: localStorage schema v5. Schema changes require version bump, migration, and test update. `iconCustomized` flag protects user-customized icons.
- State: React context + `useSyncExternalStore` (`src/hooks/`). No Zustand or external state libraries.
- Sync/DB: Neon Postgres via `DATABASE_URL`. Local-only fallback when unset. `npm run build` must succeed without `DATABASE_URL`.

## Strict Code Rules

- No `any`, `@ts-ignore`, `eslint-disable`, or `dangerouslySetInnerHTML`.
- No `transition: all`, empty `try/catch`, or `setTimeout` hacks.
- CSP rules in `next.config.ts`: `img-src 'self' data: https:`, `connect-src 'self' https:`.
- `@types/node` must match `engines.node` major version (`22.x`).

## Ports

- Dev: 3000 (never touch user server on 3001).
- Test servers: 3100 (dev test), 3101 (prod test).
