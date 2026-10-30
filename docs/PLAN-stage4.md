# Stage 4 Execution Plan

## Branch & Baseline
- Branch: `redesign-v2` (10 commits ahead of `main`)
- Current commit: `9b99b93` (Stage 3 Irisan F)
- Gates: `tsc --noEmit` ✓, `lint` ✓ (60 warnings), `test` 55/55 ✓, `build` ✓

## Irisan Breakdown & Order

### Irisan A: Test Harness & Diagnostics (Day 1)
- Create `realClick` helper, `contrast.ts`, `twoContexts.ts`
- Fixture PNG 600x400, bootstrap test servers 3100/3101 + Postgres Docker
- `curl -sI` four domains, `matchMedia('(prefers-reduced-motion: reduce)')`
- Screenshot `screenshots/before-stage4/` at 390, 768, 1280, 1920 (dark/light)
- Write `docs/DIAGNOSIS.md` with root causes for issues 1-10

### Irisan B: Interactivity + Theme (4.1) + Avatar Menu Fix (Day 1-2)
- Fix click-outside handler for portal-rendered popovers (pointerdown + composedPath)
- Ensure theme control reads/writes single source (`useSettingsStore`)
- Verify three-way theme toggle (Light/Dark/System) with live System updates
- Contrast audit all surfaces (Light/Dark) using `contrast.ts`
- Remove any `transition: all`, `filter: blur` on large elements

### Irisan C: Data Layer - Unified Sync Store (Day 2-3)
- `entities` table schema + `ensureSchema()` with `pg_advisory_xact_lock`
- `/api/sync` (GET cursor/limit, POST ops with idempotency)
- `NotesRepository` (Postgres + InMemory) + contract suite
- Client sync store: `useApps`, `useSettings`, `useDeviceSettings`, `useProfile`, `useNotes`, `useStats`
- Optimistic updates, outbox, conflict resolution (rebase for app/setting/profile, conflicted copy for notes)
- Seed/adoption logic, migration from `localStorage` v4, Local-only mode
- Hooks: `useApps`, `useSettings`, `useDeviceSettings`, `useProfile`, `useNotes`, `useStats`

### Irisan D: Settings Popup + Profile + Avatar Menu (Day 3-4)
- Replace `/settings` page with dialog (desktop 960x680, HP full-screen sheet)
- Hash routing `#settings` / `#settings/<section>`, Back button closes
- All 7 sections functional: Profile, Appearance, Apps, Notes, Data, About, Account
- Avatar menu popover (desktop) / bottom sheet (HP) with portal-aware click-outside
- "Synced"/"This device" badges on every control

### Irisan E: Layout + Cards + Header (Day 4-5)
- Container `max-width: 1760px`, padding `clamp(16px, 3vw, 56px)`
- Hero single row: greeting + date + status pill
- Toolbar: chips (All, ★ Favorites, categories) + segmented Grid|List|Compact
- Grid: `repeat(var(--cols), minmax(0, 1fr))`, 2/3/4 cols responsive
- Card anatomy per spec (desktop/HP/List/Compact), stretched-link pattern
- Header: desktop capsule (avatar + VinDeck + search + Notes/Add/avatar), HP redesigned
- HP dock: Home/Search/Add/Notes/Settings, content padding = dock + safe-area + 16px
- Remove View button, "All Apps" heading, "4 apps" count, Hidden chip

### Irisan F: Status Server-Side + Notes Sync (Day 5-6)
- `POST /api/status` with SSRF protection, 15s cache, classification table
- `StatusDiagnostics` dialog in Settings > Apps
- Notes store migration to `/api/sync` (upsert, revisions, soft-delete)
- Notes page uses sync store, sync indicator, offline queue

### Irisan G: Animations + PWA + Polish (Day 6-7)
- `LazyMotion domMax`, `html[data-motion]` from setting (Full=never, Reduced=always, Follow=user)
- All animations per spec table (stagger, layout, spotlight, header shrink, dialog/sheet/sheet HP, toast, status pulse, skeleton, clock, page transitions, theme 350ms)
- `html.theme-transition` class for theme switch (350ms, finally cleanup)
- `MotionConfig reducedMotion` from setting (Full=never, Reduced=always, Follow=user)
- PWA: manifest validation, `public/sw.js` pass-through, prod-only registration
- English sweep, README update

### Irisan H: QA + Deploy (Day 7)
- Full Playwright suite on dev (3100) + prod build (3101) at 390/768/1024/1280/1920 both themes
- Two-context sync tests, offline/conflict/seed scenarios
- Clean worktree test (`git worktree add /tmp/vindeck-check HEAD`)
- Vercel deploy, hash match, cleanup

## Key Architectural Decisions
| Decision | Rationale |
|----------|-----------|
| Single `entities` table (kind + id + jsonb) | Flexible schema, single sync endpoint, easy migration |
| `pg_advisory_xact_lock` for migrations | Safe parallel deployments |
| Client sync store = single source of truth | Eliminates dual-store bugs (theme, profile) |
| Server-side status via `/api/status` | Bypasses CORS/CORP blocking by Cloudflare |
| `data-theme` on `<html>` + inline script | Zero-flicker hydration, portal-friendly |
| `LazyMotion domMax` + `layout`/`layoutId` | Performant shared layout animations |
| `html[data-motion]` from setting | OS preference never overrides user choice |
| Inline theme script in `<head>` | Zero-flicker before paint |

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Postgres Docker unavailable | In-memory repo fallback, document "NOT RUN" |
| Theme flicker on reload | Inline script in `<head>` + `suppressHydrationWarning` on `<html>` only |
| Portal click-outside eats clicks | `pointerdown` + `composedPath()` check against portal root |
| Animation jank on mobile | `backdrop-filter` ≤ 12px on HP, no `filter: blur` on large elements |
| Sync conflicts on first run | Deterministic IDs for built-ins, `meta/seeded` guard, conflicted copy for notes |
| CSP blocking status checks | Server-side `/api/status` same-origin, no `connect-src` needed |
| Hydration mismatch on theme | Inline script sets `data-theme` before paint, `useSyncExternalStore` for SSR |

## File Targets (New/Modified)
```
src/hooks/useSyncStore.tsx          # NEW - unified sync store
src/hooks/useApps.ts                # NEW
src/hooks/useSettings.ts            # NEW
src/hooks/useDeviceSettings.ts      # NEW
src/hooks/useProfile.ts             # NEW
src/hooks/useNotes.ts               # NEW
src/hooks/useStats.ts               # NEW
src/lib/sync/outbox.ts              # NEW
src/lib/sync/conflict.ts            # NEW
src/lib/sync/migration.ts           # NEW
src/lib/sync/index.ts               # NEW
src/lib/contrast.ts                 # NEW
src/lib/realClick.ts                # NEW
src/server/db.ts                    # UPDATED (entities schema)
src/server/notes-repo.ts            # UPDATED (implements NotesRepository)
src/server/sync-repo.ts             # NEW (entities CRUD + seq)
src/server/sync.ts                  # NEW (classification, SSRF)
src/app/api/sync/route.ts           # NEW
src/app/api/status/route.ts         # UPDATED (classification, SSRF)
src/app/api/notes/*                 # UPDATED to use sync repo
src/app/(dashboard)/settings/dialog.tsx  # NEW - SettingsDialog
src/components/SettingsDialog.tsx   # NEW
src/components/AvatarMenu.tsx       # NEW (extracted from Header)
src/components/StatusDiagnostics.tsx # NEW
src/components/SettingsTabs.tsx     # NEW
src/hooks/useSync.ts                # NEW (React context + useSyncExternalStore)
src/app/layout.tsx                  # MODIFIED (inline theme script, SW reg)
src/app/globals.css                 # MODIFIED (tokens, animations, data-motion)
src/components/Header.tsx           # MODIFIED (avatar menu refactor)
src/app/DashboardPage.tsx           # MODIFIED (layout, cards, hero, toolbar)
src/app/notes/page.tsx              # MODIFIED (sync store, two-panel)
src/app/notes/[id]/page.tsx         # NEW (HP editor)
src/components/AppCard.tsx          # MODIFIED (anatomy, animations)
src/components/NotesPage.tsx        # MODIFIED
src/components/SettingsDialog.tsx   # NEW
src/components/AvatarMenu.tsx       # NEW
src/components/StatusDiagnostics.tsx # NEW
src/components/SettingsTabs.tsx     # NEW
src/lib/contrast.ts                 # NEW
src/lib/realClick.ts                # NEW
tests/e2e/contrast.ts               # NEW
tests/e2e/realClick.ts              # NEW
tests/e2e/twoContexts.ts            # NEW
tests/e2e/sync.test.ts              # NEW
tests/e2e/animations.test.ts        # NEW
docs/PLAN-stage4.md                 # THIS FILE
docs/DIAGNOSIS.md                   # NEW
docs/DECISIONS.md                   # NEW
```

## Gate Commands Per Irisan
```bash
npx tsc --noEmit && npm run lint && npm test && npx playwright test --project=chromium --reporter=line
# + screenshots at each breakpoint
```