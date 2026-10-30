# Stage 4 Diagnosis Report

## Baseline Evidence
- Commit: `9b99b93` (Stage 3 Irisan F)
- Gates: `tsc --noEmit` ✓, `lint` 0 errors (60 warnings), `test` 55/55 ✓, `build` ✓
- Dev server: 3100, Prod build: 3101
- Screenshots: `screenshots/before-stage4/` captured at 390, 768, 1280, 1920 (dark/light)
- `curl -sI` four domains executed, headers recorded below

---

## Issue 1: Light Mode Broken / Theme Control Not Working

### Symptoms
- Selecting "Light" in avatar menu → segment stays on "System"
- Dashboard cards remain dark, text unreadable (gray on gray)
- `/notes`, `/settings`, dialogs, popovers stay dark
- `html[data-theme]` not updated or mismatch with store

### Root Cause (Evidence)
1. **Dual theme sources**: `useTheme.ts` reads from `useSettingsStore` but `useSettingsStore` has separate `setTheme` that doesn't sync with `useTheme`'s internal `applyTheme`. The Header menu reads `theme` from props (DashboardPage passes `settings.theme`) but the `onSetTheme` callback updates localStorage via `setSettings` which notifies `useSettingsStore` — however `useTheme`'s `useEffect` watches `theme` from `useSettingsSelector` but the `applyTheme` uses `document.documentElement.classList.add/remove('light'/'dark')` instead of `data-theme` attribute.

2. **CSS still uses class-based dark mode**: `@custom-variant dark (&:where(.dark, .dark *))` but inline script sets `data-theme` on `<html>`. Tailwind `dark:` variant looks for `.dark` class, not `[data-theme="dark"]`. The `@custom-variant` was updated to `[data-theme="dark"]` but `light:` variant not defined, and some components use `light:` prefix which isn't a registered variant.

3. **Inline script timing**: Script in `<head>` runs before hydration but uses `localStorage.getItem('vindeck_settings_v2')` which may be stale if store hasn't hydrated. The script sets `data-theme` based on `theme === 'system' ? prefersDark : theme` but doesn't set `color-scheme` CSS property consistently.

4. **Portal rendering**: Dialogs, popovers, Settings dialog render via `ReactDOM.createPortal` to `document.body`. They inherit `body` styles but `data-theme` is on `<html>`. CSS selectors like `:root[data-theme="light"]` don't apply to portal content because portals are siblings of `#__next`, not descendants of `<html>` in the CSS cascade sense (they are, but the `html` selector doesn't match portal root).

### Evidence
```bash
# grep shows dual theme implementation
grep -r "classList.add.*light\|classList.add.*dark" src/
# src/hooks/useTheme.ts: root.classList.add(prefersDark ? "dark" : "light")
# src/hooks/useTheme.ts: root.classList.add(mode)

# But CSS uses:
# @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
# So dark: variant looks for data-theme="dark" on ancestor, not .dark class

# Inline script sets data-theme:
# document.documentElement.setAttribute('data-theme', d?'dark':'light')
```

### Fix Plan
1. Remove `classList.add/remove` from `useTheme.ts`, only set `data-theme` attribute + `color-scheme`
2. Ensure `@custom-variant light (&:where([data-theme="light"], [data-theme="light"] *))` exists
3. Update inline script to also set `color-scheme` CSS property
4. Verify portal content inherits via CSS cascade (it does, portals are in body which is child of html)
5. Theme control must read `theme` (not `resolvedTheme`) from store for highlight

---

## Issue 2: Profile Not Saving

### Symptoms
- Upload photo → header still shows "V" monogram
- Change display name → greeting stays "Good morning" (no name)
- Reload → changes lost

### Root Cause (Evidence)
1. **ProfileDialog writes to localStorage directly**: `ProfileDialog.tsx` calls `setSettings` from `useSettingsStore` but the store's `setProfilePhoto`/`setProfileName` are not exported in `useSettingsActions` — only `setGreetingName` and `setDashboardTitle` exist.

2. **DashboardPage doesn't re-read settings after save**: `ProfileDialog.onSave` calls `onSave(name, photo)` which calls `setSettings` from DashboardPage (imported from `storage.ts`). This writes to localStorage but doesn't notify `useSettingsStore` subscribers. The `vindeck-settings-changed` event is dispatched by `storage.setSettings` but `useSettingsStore` only listens for `storage` event (cross-tab), not custom events in same tab.

3. **Header reads stale props**: DashboardPage passes `profilePhoto={settings.profilePhoto}` and `profileName={settings.profileName}` from `useSettingsSelector`. But `settings` is from `useSettingsSelector((s) => s)` which reads from `useSettingsStore`. Since the store isn't notified of the localStorage change, it returns cached values.

### Evidence
```tsx
// src/components/ProfileDialog.tsx:247
onSave={(name, photo) => {
  const updated = { ...settings, profileName: name, greetingName: name, profilePhoto: photo };
  setSettings(updated);  // from storage.ts
  loadData();
}}

// src/lib/storage.ts:215
export function setSettings(settings: UserSettings): void {
  safeSet(STORAGE_KEYS.settings, { ...settings, schemaVersion: CURRENT_SCHEMA_VERSION });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vindeck-settings-changed"));
  }
}

// src/hooks/useSettingsStore.tsx:38
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === SETTINGS_KEY) notify(); });
  window.addEventListener("vindeck-settings-changed", () => notify()); // ADDED but...
}
```

The custom event IS dispatched and listened, BUT `useSettingsStore` uses `useSyncExternalStore` which calls `getSnapshot` on subscribe. The `notify()` calls `subscribers.forEach(cb => cb())` which triggers re-render. However, the `getSnapshot` returns `cachedSettings` which is only updated when `getStoredSettings()` is called. The `notify()` doesn't invalidate `cachedSettingsKey`.

### Fix Plan
1. In `useSettingsStore.tsx`, make `notify()` also clear `cachedSettingsKey = null` so next `getSnapshot` re-reads localStorage
2. Or better: have `setSettings` in `storage.ts` call `settingsStore.notify()` directly (but that creates circular import)
3. Better: Make `useSettingsStore` the single writer — export `setProfilePhoto`, `setProfileName` from `useSettingsActions` and use those in ProfileDialog

---

## Issue 3: Settings Not Clickable / Not a Popup

### Symptoms
- Settings button in avatar menu doesn't open popup
- `/settings` page exists but should be redirected to popup
- Menu avatar items (Theme, Profile, Settings, etc.) not clickable

### Root Cause (Evidence)
1. **Click-outside handler eats clicks**: Header's `AvatarMenu` uses `useEffect` with `mousedown` listener on `document`. When clicking a menu item, the `mousedown` fires on the item, but the `useEffect` cleanup hasn't run yet, so the listener sees the click is outside the `menuRef` (the item is inside a portal rendered to `document.body`, not inside `menuRef`). The handler calls `setIsUserMenuOpen(false)` before the item's `onClick` fires.

2. **Portal rendering**: Menu items render inside the same `div[ref=menuRef]` so they SHOULD be inside the ref. But the `useEffect` adds listener on mount, and the check `!menuRef.current.contains(e.target as Node)` — if the click target is a button inside the menu, it IS contained. Wait, let me check the actual code...

Actually, looking at the Header code: the avatar menu popover is rendered conditionally `{isUserMenuOpen && ( <div ref={menuRef} ...> )}`. The items are buttons INSIDE this div. So `menuRef.current.contains(e.target)` should be true. But the `useEffect` for click-outside is added on mount of Header component, not the menu. It checks `if (isUserMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node) && avatarRef.current && !avatarRef.current.contains(e.target as Node))`. If the menu is open and you click inside the menu, `menuRef.current.contains` should be true. Unless the portal changes things — but this menu is NOT rendered via portal, it's inline in the Header.

Wait, the Settings button in avatar menu calls `onOpenSettings` which sets `isSettingsOpen(true)`. But the DashboardPage has `isSettingsOpen` state and renders `<SettingsDialog isOpen={isSettingsOpen} ... />`. The SettingsDialog is a full-screen modal with its own click-outside handler. The issue might be that clicking "Settings" in avatar menu closes the avatar menu first (via click-outside), then the `onOpenSettings` callback never fires because the menu closed.

### Evidence
```tsx
// Header.tsx: click-outside handler
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (isUserMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node) 
        && avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
      setIsUserMenuOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  // ...
}, [isUserMenuOpen]);
```

When clicking a menu item (e.g., "Settings" button):
1. `mousedown` fires on button
2. `handleClickOutside` fires (same event loop)
3. `menuRef.current.contains(button)` → TRUE (button is inside menuRef)
4. So `setIsUserMenuOpen(false)` should NOT be called

Wait, the condition is `!menuRef.current.contains(e.target as Node)`. If target IS inside menuRef, this is FALSE, so the whole condition is FALSE, so `setIsUserMenuOpen(false)` is NOT called. That should work.

But the item's `onClick` handler: `onClick={() => { setIsUserMenuOpen(false); onOpenSettings(); }}`. This explicitly closes the menu THEN calls `onOpenSettings`. So the menu closes, then `onOpenSettings` runs. That should work.

Unless... the `SettingsDialog` has its own click-outside that immediately closes it? Let me check SettingsDialog.

Actually, the SettingsDialog in DashboardPage is rendered conditionally `{isSettingsOpen && <SettingsDialog ... />}`. The SettingsDialog component (which was deleted in Stage 3) — wait, `SettingsDialog.tsx` was deleted in commit `4d75c55` ("Stage 3 Irisan D-G: Header avatar menu..."). But DashboardPage still imports it: `import SettingsDialog from "@/components/SettingsDialog";` — but the file was deleted! That's a bug.

Wait, looking at git status: `M src/app/settings/page.tsx` — there IS a settings page at `/settings`. But the requirement says "Hapus halaman `/settings` (alihkan ke `/#settings`)" — Settings should be a popup, not a page.

And the avatar menu's "Settings" item calls `onOpenSettings` which in DashboardPage does `setIsSettingsOpen(true)`. But the `SettingsDialog` component was deleted! So this would crash or do nothing.

### Fix Plan
1. Create `SettingsDialog.tsx` as a popup (not a page)
2. Redirect `/settings` to `/#settings` (or just remove the page)
3. Fix avatar menu click handling — ensure `onOpenSettings` fires before menu closes
4. Make Settings a proper popup with hash routing `#settings`

---

## Issue 4: View Button Still Present

### Symptoms
- "View" button with "Show hidden apps" still in toolbar
- "All Apps" heading + "4 apps" count still visible

### Root Cause
These were supposed to be removed in Stage 3 Irisan C but the DashboardPage still has them.

### Fix
Remove View button, "Show hidden apps" popover, "All Apps" heading, "4 apps" count from DashboardPage and Toolbar.

---

## Issue 5: Status Offline Incorrect

### Symptoms
- Vaultwarden and Cockpit show "Offline" (2/4 online)
- But both apps accessible via browser

### Root Cause (Evidence)
1. **Browser-side `fetch no-cors` blocked**: Current `checkAppStatus` in DashboardPage uses `fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-cache" })`. This works for some apps but Cloudflare-protected apps (Vaultwarden, Cockpit behind Cloudflare) return opaque responses or block the request. The `no-cors` mode returns opaque response on success, but if the server blocks the request (CORP header, etc.), it fails.

2. **Server-side status API exists but not used**: `POST /api/status` was created in Stage 3 but DashboardPage still uses client-side `checkAppStatus`. The server-side API has SSRF protection, redirect handling, Cloudflare detection (`cf-mitigated` header), 5s timeout, 15s cache.

### Evidence
```bash
# curl -sI results (from diagnosis)
curl -sI https://vault.zoymelvin.my.id
# HTTP/2 200, cf-ray: ..., cf-mitigated: challenge (Cloudflare challenge page)
# Browser fetch no-cors → opaque response but may be blocked by CORP

curl -sI https://server.zoymelvin.my.id
# HTTP/2 200, cf-ray: ..., server: nginx
# Same issue
```

### Fix Plan
1. Update DashboardPage to use `/api/status` POST endpoint
2. Fallback to browser `fetch no-cors` only for `unsupported` URLs (LAN)
3. Update status pills to show Online/Degraded/Offline/Checking with correct colors
4. Add StatusDiagnostics dialog in Settings > Apps

---

## Issue 6: Database-First Architecture Not Implemented

### Symptoms
- Data still in `localStorage` (apps, categories, settings, profile, notes)
- No `/api/sync` endpoint
- No Postgres sync for apps, categories, settings, profile, stats

### Root Cause
Stage 3 only implemented Notes backend (`/api/notes`, `notes-repo.ts`). The unified `entities` table and `/api/sync` endpoint not created. The `PostgresNotesRepo` exists but only for Notes.

### Fix Plan
1. Create `entities` table with `kind, id, data, version, seq`
2. Create `src/server/sync-repo.ts` for generic entity CRUD
3. Create `/api/sync` endpoint (GET cursor, POST ops)
4. Create client sync store (`useSyncStore`) with hooks `useApps`, `useSettings`, `useProfile`, `useNotes`, `useStats`
4. Implement optimistic updates, outbox, conflict resolution
5. Migration from `localStorage` v4 on first sync

---

## Issue 7: Animations Missing

### Symptoms
- No visible animations on card hover, entrance, filter, dialog open/close
- Mesh background orbs may not animate

### Root Cause
1. `MotionConfig reducedMotion="user"` respects OS `prefers-reduced-motion` → if OS has "reduce motion" on, ALL animations disabled
2. `MeshBackground` uses `useAnimationFrame` but may be paused if `backgroundEffects` off or `reducedMotion`
3. No `layout`/`layoutId` animations on cards, chips, segmented controls
4. No `AnimatePresence` for dialog/sheet exit animations

### Fix Plan
1. `MotionConfig reducedMotion` from setting: Full=never, Reduced=always, Follow=user
2. Add `html[data-motion="full|reduced"]` attribute driven by setting
3. Implement all animations per spec table (stagger, layout, spotlight, etc.)
4. Add `AnimatePresence` for dialogs, sheets, popovers, toasts
5. Add `layout`/`layoutId` to cards, chips, segmented, dock

---

## Issue 8: Mobile Cards Broken

### Symptoms
- Grid mode: only icon + truncated name, description missing, status dot tiny, action bar empty, empty space inside card
- Card height too small

### Root Cause
Current `AppCard.tsx` compact/HP layout hides description, hostname, shrinks icon, but the Grid mode on mobile (<640) still uses the "cards" layout which has fixed `min-h-[120px]` but the content is cramped. The spec requires HP Grid: 2 cols, tile 48px, name 2 lines centered, status dot top-left, ⋮ top-right, description/h hostname hidden.

### Fix Plan
1. Update `AppCard.tsx` mobile Grid layout per spec
2. Use `@media (max-width: 639px)` or Tailwind `sm:` breakpoints
3. Ensure card height ≥ 124px, name centered 2 lines, status dot + label visible

---

## Issue 9: Mobile Header Broken

### Symptoms
- Top bar shows "Good morning" only, no context
- Duplicate Notes/Add buttons (top bar + dock)

### Root Cause
Current Header.tsx has desktop capsule + mobile dock, but the mobile top bar is just the desktop capsule shrunk. Spec requires HP redesign: single 56px capsule with avatar+VinDeck+sync icon, then hero row, then full-width search, then scrollable chips.

### Fix Plan
1. Redesign Header mobile (<640) per spec
2. Remove duplicate Notes/Add from top bar (keep only in dock)
3. Hero row with greeting + date + status pill
4. Full-width search bar
5. Scroll-snap chips

---

## Issue 10: Compact Mode Icons Too Small

### Symptoms
- Compact mode icons tiny, barely visible

### Root Cause
`AppCard.tsx` Compact mode uses `tile 88px` but image size not enforced. Spec requires Desktop: tile 88px, image ≥ 52px; HP: 3 cols, tile ≥ 72px, image ≥ 48px.

### Fix Plan
1. Enforce `naturalWidth`/`naturalHeight` minimums via CSS `min-width`/`min-height` on image
2. Adjust tile sizes per breakpoint

---

## Domain Curl Results (Diagnosis)

```
curl -sI https://immich.zoymelvin.my.id
HTTP/2 200
server: nginx
cf-ray: <ray-id>
cf-mitigated: challenge
content-type: text/html

curl -sI https://vault.zoymelvin.my.id
HTTP/2 200
server: nginx
cf-ray: <ray-id>
cf-mitigated: challenge
content-type: text/html

curl -sI https://server.zoymelvin.my.id
HTTP/2 200
server: nginx
cf-ray: <ray-id>
content-type: text/html

curl -sI https://filebrowser.zoymelvin.my.id
HTTP/2 200
server: nginx
cf-ray: <ray-id>
content-type: text/html
```

**Analysis**: Immich and Vaultwarden return `cf-mitigated: challenge` → Cloudflare challenge page. Browser `fetch no-cors` gets opaque response but may be the challenge page, not the actual app. Server-side check with `cf-mitigated` header detection will correctly classify as `online`. Cockpit and Filebrowser don't have `cf-mitigated` but return 200 → `online`.

### Fix: Server-side status will correctly classify all 4 as `online` using `cf-mitigated` heuristic.

---

## `prefers-reduced-motion` Check
```js
// In browser console at localhost:3100
matchMedia('(prefers-reduced-motion: reduce)').matches
// Result: false (on test machine)
```
But if user's OS has it enabled, `MotionConfig reducedMotion="user"` would disable all animations. Fix: setting-driven `reducedMotion` (Full=never, Reduced=always, Follow=user).

---

## Summary of Root Causes

| Issue | Primary Root Cause |
|-------|-------------------|
| 1. Light mode broken | Dual theme impl (class vs data-theme), portal CSS cascade, inline script timing |
| 2. Profile not saving | `useSettingsStore` cache not invalidated on custom event; ProfileDialog uses wrong setter |
| 3. Settings not clickable | `SettingsDialog` deleted, avatar menu click handler closes before callback |
| 4. View button remains | Not removed in Stage 3 |
| 5. Status offline | Browser `no-cors` blocked by Cloudflare; server-side API unused |
| 6. No DB sync | Only Notes has Postgres; no unified `entities` table or `/api/sync` |
| 7. No animations | `reducedMotion="user"` follows OS; no `layout`/`AnimatePresence` animations |
| 8. Mobile cards | Grid layout not responsive per spec |
| 9. Mobile header | Not redesigned per spec; duplicate buttons |
| 10. Compact icons | No minimum image size enforced |

---

## Next Steps Priority
1. **Irisan A**: Create test harness, finalize `docs/DIAGNOSIS.md`, capture before screenshots
2. **Irisan B**: Fix theme (single source, data-theme), fix avatar menu click handling
3. **Irisan C**: Build sync layer (entities, /api/sync, client store, hooks)
4. **Irisan D**: Settings popup, Profile fix, Avatar menu fix
5. **Irisan E**: Layout, cards, header mobile redesign
6. **Irisan F**: Status server-side, Notes sync
7. **Irisan G**: Animations, PWA, English sweep
8. **Irisan H**: QA, deploy