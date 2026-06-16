# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Performance: what NOT to read

To keep sessions fast, **do not scan these** unless a task explicitly requires it
(they are large, binary, or generated and contain no source to edit):

- `node_modules/`, `.next/`, `out/`, `.git/`, `.wrangler/`
- `package-lock.json`
- `data/` and generated `public/*` (`public/images/`, `public/vault.json`,
  `public/search-index.json`, `public/assets/`, `public/charts/`,
  `public/files/`, `public/mermaid/`, `public/signatures/`, `public/videos/`) —
  all rebuilt by `npm run prepare-data`
- `vault/assets/**` and `example-vault/assets/**` — images, PDFs, and signatures
  (binary content)

Source lives in `app/`, `components/`, `config/`, `hooks/`, `lib/`, `scripts/`,
`types/`, and `utils/`. `components/` is grouped by concern — `layout/`,
`content/` (Markdown block renderers), `ui/` (small reusables), `graph/`,
`markdown/`, `modals/`, `pages/` — with feature-level components at the root.
Reuse `components/modals/Modal.tsx` (modal shell) and
`hooks/useCopyToClipboard.ts` instead of re-rolling that boilerplate. Vault
**Markdown** (`vault/**/*.md` and bundled `example-vault/**/*.md`) is content,
not code.

## Project overview

**hblog-ng** transforms an [Obsidian](https://obsidian.md) vault of Markdown into
a statically-generated site with an interactive knowledge graph. Built with
Next.js (App Router, static export) and deployed to Cloudflare Pages. There is
**no server runtime** — everything is pre-rendered at build time.

Vault content is **not committed to this repo**. It lives in a separate Obsidian
vault, resolved by `scripts/lib/vault-path.ts` in this order: (1) the `VAULT_PATH`
env var, (2) a `vault/` directory if present (the devcontainer bind-mounts one —
see `.devcontainer/devcontainer.json`), (3) the bundled `example-vault/` demo so a
fresh clone still renders. Always resolve the vault via `getVaultPath()` /
`getVaultPathWithOverride()`; never hard-code `vault/`.

## Commands

```bash
npm run dev              # Data pipeline + dev server with file watcher
npm run prepare-data     # sign-posts → parse-vault → parse-bibtex → optimize-images → generate-og-images → copy-static-assets
npm run build            # prepare-data + next build (static export to out/)
npm run deploy           # build + wrangler pages deploy
npm run lint             # ESLint (flat config)
npm run format           # Prettier
npm run test             # Vitest
npm run analyze          # Bundle-size visualization
npm run sign-posts       # PGP-sign vault posts (also runs first in prepare-data)
```

`prepare-data` runs `sign-posts` first so signatures are fresh before
`parse-vault` embeds them. Signing is idempotent (re-signs only changed posts)
and skips gracefully when no `NEXT_PUBLIC_PGP_*` key is set, so keyless clones
and CI still build.

Run `npm run prepare-data` after changing vault content (the resolved vault or
`example-vault/`) before building.

## Architecture

### Data flow

```text
resolved vault (Obsidian markdown — VAULT_PATH | vault/ | example-vault/)
  └─ scripts/parse-vault.ts
       ├─ data/vault.json      (full, used by lib/vault.ts during SSG)
       └─ public/vault.json    (lite, fetched by client graph/search)
```

The dual JSON split keeps full content out of the browser bundle while still
powering the client-side graph and search.

### Key modules

- **`types/vault.ts`** — `VaultNode`, the central data structure. Notable fields:
  `id` (`blog:hello-world`), `type` (`system | blog | profile | project | intel |
research`), `spectrum` (`offensive | defensive | misc`, drives graph color),
  `links[]` (resolved wikilink edges).
- **`lib/routing.ts`** — `getPathFromId()` / `extractSlugFromId()` /
  `findNodeBySlugOrId()` map node IDs/types to URLs (`blog → /posts/[id]`,
  `project → /projects/[id]`, `research → /research/[id]`). Always use these
  rather than re-deriving paths inline.
- **`lib/page-logic.tsx`** — `createCollectionPage()` and `createDetailPage()`
  factories back the `app/{posts,projects,research}` routes; each route file just
  spreads the result. Add a new content type here.
- **`lib/markdown/extensions.ts`** +
  **`components/content/MarkdownRenderer.tsx`** + **`components/markdown/*`**
  — custom `marked` extensions: `[[WikiLinks]]`, `![[embeds]]`,
  `$math$`/`$$math$$` (KaTeX), Mermaid fences, `[ref:key]` citations.
  `lib/rss-markdown.ts` is a separate string renderer for feeds.
- **`components/graph/*`** (incl. `NeuralGraph.tsx`) + **`hooks/graph/*`**
  — canvas-based D3 force simulation (not SVG). Config in `config/graph.ts`;
  colors `offense: #ff0055`, `defense: #00e5ff`.
- **`lib/metadata.ts`** — `generateMetadata` helpers: per-page Open Graph /
  Twitter (`summary_large_image`) cards and JSON-LD structured data
  (`TechArticle` / `ScholarlyArticle` / `SoftwareApplication`, breadcrumbs).
  Used by the `app/**/page.tsx` routes; OG image URLs point at the PNGs below.
- **`lib/feed.ts`** + **`app/feed.{xml,atom,json}/route.ts`** — RSS 2.0, Atom,
  and JSON Feed. `lib/rss-markdown.ts` is the separate string renderer for feed
  HTML (don't reuse the React `MarkdownRenderer` here). `app/{sitemap,robots,
manifest}.ts` cover the rest of SEO/PWA.
- **Search** — MiniSearch. The index is built in `parse-vault` and written to
  `public/search-index.json`, lazy-loaded client-side via `lib/search-client.ts`
  (`components/SearchModal.tsx`, command palette in `config/commands.ts`).
- **PGP** — `scripts/sign-posts.ts` writes detached `.asc` signatures into the
  vault's `assets/signatures/`; `parse-vault` embeds them and OpenPGP.js verifies
  in-browser (`components/modals/SignatureModal.tsx`, `hooks/usePublicKey.ts`).
  Key material stays in `.env.local` / `.secrets/`, never committed.
- **Asset pipeline** — `scripts/optimize-images.ts` converts raster images to
  **WebP** (Sharp, fit 1920×1920) into `public/images/`;
  `scripts/generate-og-images.ts` renders the 1200×630 OG PNG per note.
- **`utils/index.ts`** — shared helpers incl. `byNewest` (sort comparator) and
  `stripMarkdownToText` (plain-text excerpts). Prefer these over re-implementing.

### Client vs server components

Default to React Server Components. Add `'use client'` only for `useState`,
`useEffect`, or browser events (graph, search, modals, keyboard shortcuts). Page
data is loaded in Server Components via `lib/vault.ts`.

## Tech stack rules

- **TypeScript**: strict, no `any`. Use `interface` for component props.
- **Styling**: Tailwind utilities; `clsx` / `tailwind-merge` for conditional classes.
- **Static export**: no server actions, no `cookies`/`headers`/`request`. Route
  handlers and metadata routes must be statically renderable
  (`export const dynamic = 'force-static'`); dynamic routes need
  `generateStaticParams`.
- **Images**: `next/image` with explicit dimensions; optimization is disabled
  (`images.unoptimized`) because this is a static export.
- **Imports**: React/Next → third-party → local components → utils/lib.
- **Naming**: components `PascalCase.tsx`, hooks/utils `camelCase.ts`,
  constants `UPPER_SNAKE_CASE`.

## Configuration

All env vars are read through `config/env.ts`. The defaults live in the
committed `.env` file (the site's identity: title, author, social handles), not
inline in `env.ts`. Next.js loads `.env` automatically; override any value via a
git-ignored `.env.local` with the matching `NEXT_PUBLIC_*` variable. Every
`NEXT_PUBLIC_*` value is public (inlined into the build). Private material (PGP
private key, passphrase) stays in `.env.local`, never `.env`.

## Adding a content type

Update `types/vault.ts`, `scripts/parse-vault.ts`, `lib/routing.ts`, add a route
under `app/[type]/` using the `lib/page-logic.tsx` factories.

## Notes

- `out/` is the deploy artifact — never edit it directly.
- Vault content is external (see [Project overview](#project-overview)); the
  repo ships `example-vault/` as the fallback so a fresh clone renders the demo.
- A missing or empty vault no longer breaks the build; the pipeline writes empty
  `data/*.json` so even a vault wiped for personal use still builds.
