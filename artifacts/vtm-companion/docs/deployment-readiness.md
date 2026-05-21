# Deployment Readiness

A short, practical guide for building and deploying the VTM Companion as a
static SPA. Update this when the deploy pipeline changes.

## TL;DR

- **Stack**: React + Vite, no server, all data in `localStorage`.
- **Build output**: `artifacts/vtm-companion/dist/public/` — pure static.
- **Routing**: client-side via wouter. Any 404 on a non-asset path **must**
  fall back to `index.html` so the SPA can take over. `vite preview` (used
  by the current Railway config) does this by default.
- **Repo deploys two services** from the same monorepo using two separate
  nixpacks configs: one for the API server, one for the frontend.

## Local commands

| Goal                                | Command (from repo root)                                      |
|-------------------------------------|---------------------------------------------------------------|
| Dev server                          | `pnpm --dir artifacts/vtm-companion run dev`                  |
| Type-check (workspace-wide libs)    | `pnpm run typecheck:libs`                                     |
| Type-check (companion only)         | `pnpm --dir artifacts/vtm-companion run typecheck`            |
| Tests (companion)                   | `pnpm --dir artifacts/vtm-companion run test`                 |
| Production build                    | `pnpm --dir artifacts/vtm-companion run build`                |
| Production preview (after build)    | `pnpm --dir artifacts/vtm-companion run serve`                |
| Regenerate PNG icons                | `pnpm --dir artifacts/vtm-companion run icons`                |

The `serve` command runs `vite preview`. It binds `0.0.0.0` and reads the
port from `PORT` (defaults to `5173`), which is exactly what Railway's
managed runtimes expect.

## Production build

```sh
pnpm --dir artifacts/vtm-companion run build
```

Output layout (paths relative to repo root):

```
artifacts/vtm-companion/dist/public/
├── index.html
├── manifest.webmanifest
├── favicon.svg
├── icon-192.png
├── icon-512.png
├── icon-maskable-512.png
├── opengraph.jpg
├── images/                  ← clan PNGs and other static art
└── assets/
    ├── index-<hash>.css
    └── index-<hash>.js
```

The build is verified end-to-end in this checkpoint: every PWA asset
(`/manifest.webmanifest`, `/favicon.svg`, `/icon-192.png`, `/icon-512.png`,
`/icon-maskable-512.png`) and every documented client route (`/`,
`/personaje`, `/cronica`, `/compendium/reglas`, `/compendium/herramientas`,
`/compendium/clanes`, `/compendium/disciplinas`, `/favoritos`, `/ajustes`,
`/buscar`) returns `200 OK` from `vite preview`, with the manifest served as
`application/manifest+json`.

### Known build warning

Rollup currently reports one chunk over its 500 kB warning threshold (the
client bundle ends up around ~290 kB gzipped). This is **not** a deploy
blocker — it's a hint to revisit code-splitting later. Track it as a
follow-up rather than a blocker for this checkpoint.

## SPA fallback (client-side routing)

The app uses wouter for client routing. A request like `/personaje` only
exists in the browser; the static host has no file at that path. The host
must therefore serve `index.html` for any path that doesn't match a real
file. Behavior per environment:

- **`vite preview` (current production runtime via `nixpacks.frontend.toml`)**
  — Built-in SPA fallback. Verified locally; all routes above return the
  built `index.html`.
- **Any other static host (Netlify, Cloudflare Pages, S3+CloudFront,
  nginx, etc.)** — Add a "history fallback" rewrite. Minimal examples:
  - Netlify: `public/_redirects` with `/*  /index.html  200`.
  - Cloudflare Pages: same `_redirects` file.
  - nginx: `try_files $uri /index.html;`.
  None of these are needed today because we deploy through nixpacks +
  `vite preview`, but document them before swapping hosts.

## Railway

Two nixpacks configs live at the repo root:

- `nixpacks.toml` — default; builds and runs the **API server**.
- `nixpacks.frontend.toml` — used by the **frontend** service. Points at
  `@workspace/vtm-companion`, runs `pnpm install` → `run build` → `run serve`.

Each Railway service should be configured to use one of those configs (set
`NIXPACKS_CONFIG_FILE=nixpacks.frontend.toml` for the frontend service, or
configure the equivalent in Railway's UI). Both files pin Node 22 and pnpm
9 via `nixPkgs`.

### Environment variables that affect the frontend build

The frontend build is intentionally minimal. The two env vars `vite.config.ts`
reads are:

| Var         | Default | Effect                                                                 |
|-------------|---------|------------------------------------------------------------------------|
| `PORT`      | `5173`  | Port `vite preview` binds to. Railway sets this automatically.         |
| `BASE_PATH` | `/`     | Vite `base`. Only set this if hosting at a sub-path (e.g. `/vtm/`). If you do, also update `manifest.webmanifest`'s `start_url` / `scope` and `index.html`'s absolute paths to the same prefix. |

Neither needs to be set on Railway today.

## Things this checkpoint did **not** change

- No service worker / offline cache was added.
- No `_redirects` / `_headers` / `vercel.json` files were added — current
  `vite preview` path doesn't need them.
- `localStorage` schemas and backup/import format are untouched.
- No new routes, no new commands, no new dependencies.

## Future deployment follow-ups

- Replace placeholder PWA PNG icons with designed art before any store
  submission (see `mobile-app-readiness.md`).
- Add PWA `screenshots` entries for richer install UI.
- Consider a true static file server (`serve`, `caddy file-server`, nginx)
  instead of `vite preview` if the frontend service ever needs higher
  throughput or custom cache headers. Until then, `vite preview` is
  acceptable.
- Code-split the main client bundle to reduce the >500 kB chunk warning.
- Service worker (network-first for HTML, cache-first for hashed assets)
  is the right next step **after** the icon set is finalized.
- Capacitor / Trusted Web Activity Android wrappers remain deferred — see
  `mobile-app-readiness.md` for the decision tree.
