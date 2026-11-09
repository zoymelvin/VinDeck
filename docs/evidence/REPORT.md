# Deploy Fix Report

## Akar Masalah
`@types/node@^20` tidak memenuhi peerOptional vitest@5 (`^22.0.0 || >=24.0.0`). Vercel menjalankan `npm install` tanpa lockfile yang dapat menutupi ketidakcocokan ini, menyebabkan ERESOLVE.

## Bukti Reproduksi
- `docs/evidence/install-before.txt`: ERESOLVE terjadi di worktree bersih sebelum perbaikan.

## Versi Target
- `@types/node`: `^22.12.0` (memenuhi peer vitest dan vite).
- `engines.node`: `22.x` (direkomendasikan Vercel, stabil).
- Alasan: Node 22 LTS didukung Vercel, `@types/node@22.x` memenuhi semua peer tanpa flag.

## Berkas Diubah
- `package.json`: naikkan `@types/node` ke `^22.12.0`, tambah `engines.node: "22.x"`.
- `package-lock.json`: dihasilkan ulang dari `npm install` tanpa flag.
- `AGENTS.md`: tambah aturan deploy checklist.
- `README.md`: tambah bagian Deploy.
- `docs/DIAGNOSIS.md`: catatan diagnosis.
- `docs/evidence/install-before.txt`: bukti reproduksi.

## Hasil Verifikasi Simulasi (worktree bersih)
- `npm install`: EXIT=0, tanpa ERESOLVE.
- `npm ci`: EXIT=0.
- `npm ls @types/node`: satu versi `22.20.5`, tanpa invalid.
- `npx tsc --noEmit`: 0 error.
- `npm run lint`: 0 error (97 warning).
- `npm test`: 55/55 passed.
- `npm run build`: EXIT=0, tanpa DATABASE_URL.
- `npm start` (port 3101): `/login` 200, `/` 200, `/api/status` 404 (fitur dihapus), tidak crash tanpa DATABASE_URL.

## Hash Commit
- `main`: `cca92926e202af0cb74dd0935b753e655021bc1a`
- Remote `refs/heads/main`: `cca92926e202af0cb74dd0935b753e655021bc1a`

## Status Deploy
- URL: https://zoy-dashboard.vercel.app
- Status: READY
- Deploy ID: `dpl_GSkLugM9E5BoB8DvoGecpn3zCrts`

## Verifikasi Produksi
- `https://zoy-dashboard.vercel.app/login`: HTTP 200, ada CSP + HSTS.
- `https://zoy-dashboard.vercel.app/`: HTTP 200.
- `https://zoy-dashboard.vercel.app/api/status`: HTTP 404 (endpoint dihapus pada tahap redesign-v2).
- `vercel env ls`: tidak ada `DATABASE_URL` (aplikasi berjalan di local-only mode).

## Konflik Lain
- Tidak ada konflik dependensi lain setelah penyesuaian `@types/node`.
- Peringatan EBADENGINE saat `npm install` lokal (Node 26 vs engines 22.x) adalah ekspektasi dan tidak mempengaruhi Vercel.
- UNMET OPTIONAL DEPENDENCY untuk paket platform-spesifik (lightningcss, sharp, dll.) adalah normal di lingkungan Linux.

## Langkah untuk Owner
1. Pastikan Vercel Project Settings → Node.js Version diset ke `22.x` (atau biarkan mengikuti `engines.node`).
2. Hard refresh browser untukMembersihkan cache.
