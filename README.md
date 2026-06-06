# hblog-ng

```text
  _         _ _     _
 | |__   __| | |__ | | ___   __ _      _ __   __ _
 | '_ \ / _` | '_ \| |/ _ \ / _` |____| '_ \ / _` |
 | | | | (_| | |_) | | (_) | (_| |____| | | | (_| |
 |_| |_|\__,_|_.__/|_|\___/ \__, |    |_| |_|\__, |
                           |___/             |___/
```

A knowledge-graph blog that turns an [Obsidian](https://obsidian.md) vault of
Markdown notes into a statically-generated site with an interactive,
canvas-rendered graph of notes and their `[[wikilinks]]`.

Built with Next.js (App Router, static export) and deployed to Cloudflare Pages.

## Features

- Write in plain Markdown with `[[wikilinks]]`, `![[embeds]]`, callouts, and frontmatter.
- Interactive knowledge graph rendered on canvas with a D3 force simulation.
- Client-side search (MiniSearch) and a command palette.
- KaTeX math, Mermaid diagrams, charts, syntax highlighting, BibTeX citations, and asciinema casts.
- RSS / Atom / JSON feeds, sitemap, robots, and per-note Open Graph images.
- Static export with no server runtime.

## Quick start

Requires Node.js 20+ and npm.

```bash
git clone https://github.com/halit/hblog-ng.git
cd hblog-ng
npm install
npm run dev
```

The graph and search indexes are generated at build time from `vault/`. The dev
server re-runs the data pipeline when vault content changes; if something looks
stale, run `npm run prepare-data`.

## Configuration

Edit [`.env`](.env) to set the site title, author, and social handles. These
`NEXT_PUBLIC_*` values are public — they're inlined into the static build. To
override them locally, use a git-ignored `.env.local`.

## Content

Content lives as Obsidian Markdown in [`vault/`](vault/). To keep content in a
separate location, point `VAULT_PATH` at that directory.

## Build

```bash
npm run build
```

`build` runs `prepare-data` and then `next build` (static export to `out/`). The
data pipeline runs in order:

1. `parse-vault` — scans `vault/`, resolves `[[wikilinks]]`, and writes `data/vault.json` (plus a trimmed `public/vault.json` for the client).
2. `parse-bibtex` — converts `vault/references.bib` to `data/references.json`.
3. `optimize-images` — compresses images into `public/images/` with Sharp.
4. `generate-og-images` — renders an Open Graph card per note.

Generated `data/` and `public/*` artifacts are git-ignored and rebuilt on every build.

## Deployment

Configuration lives in [`wrangler.toml`](wrangler.toml)
(`pages_build_output_dir = "out"`).

Deploy from your machine (run `npx wrangler login` once first):

```bash
npm run deploy
```

Or connect the Git repo in the Cloudflare dashboard with build command
`npm run build`, output directory `out`, and your `NEXT_PUBLIC_*` variables set
in the project's environment settings. Security and caching headers are served
from [`public/_headers`](public/_headers).

## Commands

| Command              | Description               |
| -------------------- | ------------------------- |
| `npm run lint`       | ESLint                    |
| `npm run format`     | Prettier                  |
| `npm run test`       | Vitest                    |
| `npm run analyze`    | Bundle-size visualization |
| `npm run sign-posts` | PGP-sign vault posts      |

## Project layout

```text
app/         Next.js routes (App Router)
components/  React components (graph, markdown, modals, pages)
config/      Environment, theme, and graph configuration
hooks/       Client-side React hooks
lib/         Data loading, routing, markdown, feeds, metadata
scripts/     Build-time data pipeline
utils/       Shared helpers
vault/       Markdown content source
```

## License

[MIT](LICENSE)
