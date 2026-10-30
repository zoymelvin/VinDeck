Lockfile ter-commit: package-lock.json ada di git, tidak diabaikan.
Tidak ada .npmrc, .vercelignore, vercel.json, atau .vercel/.
Tidak ada field "engines" di package.json.
Node lokal: v26.12.1; npm: 12.2.1.
@types/node di package.json: ^20.
vitest: ^5.0.5 (membutuhkan peerOptional @types/node ^22.0.0 || >=24.0.0).
vite: ^8.3.5 (membutuhkan peerOptional @types/node ^20.19.0 || >=22.12.0).
Pemicu deploy: Git push ke branch redesign-v2, tanpa vercel.json/custom installCommand.
