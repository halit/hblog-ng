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
- `vault/assets/**` — images, PDFs, and signatures (binary content)

Source lives in `app/`, `components/`, `config/`, `hooks/`, `lib/`, `scripts/`,
`types/`, and `utils/`. Vault **Markdown** (`vault/**/*.md`) is content, not code.

## Project overview

**hblog-ng** transforms an [Obsidian](https://obsidian.md) vault of Markdown into
a statically-generated site with an interactive knowledge graph. Built with
Next.js (App Router, static export) and deployed to Cloudflare Pages. There is
**no server runtime** — everything is pre-rendered at build time.

## Commands

```bash
npm run dev              # Data pipeline + dev server with file watcher
npm run prepare-data     # parse-vault → parse-bibtex → optimize-images → generate-og-images → copy-static-assets
npm run build            # prepare-data + next build (static export to out/)
npm run deploy           # build + wrangler pages deploy
npm run lint             # ESLint (flat config)
npm run format           # Prettier
npm run test             # Vitest
npm run analyze          # Bundle-size visualization
npm run sign-posts       # PGP-sign vault posts
```

Run `npm run prepare-data` after changing anything under `vault/` before building.

## Architecture

### Data flow

```text
vault/ (Obsidian markdown)
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
- **`lib/markdown/extensions.ts`** + **`components/MarkdownRenderer.tsx`** /
  **`components/markdown/*`** — custom `marked` extensions: `[[WikiLinks]]`,
  `![[embeds]]`, `$math$`/`$$math$$` (KaTeX), Mermaid fences, `[ref:key]`
  citations. `lib/rss-markdown.ts` is a separate string renderer for feeds.
- **`components/NeuralGraph.tsx`** + **`components/graph/*`** + **`hooks/graph/*`**
  — canvas-based D3 force simulation (not SVG). Config in `config/graph.ts`;
  colors `offense: #ff0055`, `defense: #00e5ff`.
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

All env vars are read through `config/env.ts`, which holds the site's real
identity as defaults (title, author, social handles, PGP, etc.). Override any of
them via `.env.local` with the matching `NEXT_PUBLIC_*` variable. Every
`NEXT_PUBLIC_*` value is public (inlined into the build).

## Adding a content type

Update `types/vault.ts`, `scripts/parse-vault.ts`, `lib/routing.ts`, add a route
under `app/[type]/` using the `lib/page-logic.tsx` factories.

## Notes

- `out/` is the deploy artifact — never edit it directly.
- A missing or empty `vault/` no longer breaks the build; the pipeline writes
  empty `data/*.json` so a fresh clone still builds.
