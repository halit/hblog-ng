# hblog-ng

```text
  _     _     _
 | |__ | |__ | | ___   __ _       _ __   __ _
 | '_ \| '_ \| |/ _ \ / _` |_____| '_ \ / _` |
 | | | | |_) | | (_) | (_| |_____| | | | (_| |
 |_| |_|_.__/|_|\___/ \__, |     |_| |_|\__, |
                      |___/             |___/
```

A knowledge-graph blog that turns an [Obsidian](https://obsidian.md) vault of
Markdown notes into a statically-generated site with an interactive,
canvas-rendered graph of notes and their `[[wikilinks]]`.

Built with Next.js (App Router, static export) and deployed to Cloudflare Pages.

## Features

### Writing in Obsidian Markdown

- `[[wikilinks]]`, `[[Page#Section|Label]]`, and `![[embeds]]` resolved to real
  links and edges, with a hover **link preview** card for each target note.
- Obsidian **callouts** (`> [!WARNING]`, `> [!INFO]`, …) with themed icons.
- **KaTeX** math (`$inline$` and `$$block$$`), **Mermaid** diagrams, and
  **charts** (` ```chart ` blocks rendered with Recharts: bar / line / area / pie).
- Syntax highlighting (Prism, One Dark), task lists, and footnotes.
- **BibTeX citations**: drop a `references.bib` in the vault and cite with
  `[ref:key]`; references render as numbered footnotes.
- Embedded media: **asciinema** terminal casts (`[asciinema:id]`), YouTube /
  Vimeo / direct video (`[video:url]`), downloadable file attachments
  (`[file:path]`), image galleries, and click-to-zoom images.
- `#hashtags` become clickable keyword pages, and dynamic ` ```query ` blocks
  list notes filtered by type / status / keyword.

### Knowledge graph & navigation

- Interactive knowledge graph rendered on **canvas** with a D3 force simulation
  (not SVG), colored by topic spectrum (offense `#ff0055` / defense `#00e5ff`).
- Drag, zoom/pan, in-graph search, node filtering, and shortest-path finding.
- Client-side fuzzy **search** (MiniSearch) and a **command palette** with
  keyboard shortcuts (search `Ctrl+F`, graph `Ctrl+G`, palette `Ctrl+K`).
- Per-note table of contents, backlinks / related notes, and smart suggestions.

### Performance & assets

- **Static export, no server runtime** — deploys as plain files.
- All raster images converted to **WebP** (Sharp, resized to fit 1920×1920) for
  fast loads; assets served with long-lived immutable cache headers.
- Heavy libraries (graph, search, PGP, Mermaid) are lazy-loaded on demand.

### Social, SEO & syndication

- **Per-note Open Graph images** (1200×630 PNG) generated at build time, each
  with a spectrum graphic, plus Twitter `summary_large_image` cards.
- **RSS 2.0** (`/feed.xml`), **Atom** (`/feed.atom`), and **JSON Feed**
  (`/feed.json`).
- `sitemap.xml`, `robots.txt`, a PWA web manifest, and JSON-LD structured data
  (Article / ScholarlyArticle / SoftwareApplication, breadcrumbs).
- Security and caching headers shipped via [`public/_headers`](public/_headers).

### Trust

- **PGP-signed posts** with **in-browser signature verification** — readers can
  verify a note against your public key without leaving the page
  (`npm run sign-posts` to sign; OpenPGP.js to verify).

## Quick start

Requires Node.js 20+ and npm.

```bash
git clone https://github.com/halit/hblog-ng.git
cd hblog-ng
npm install
npm run dev
```

With no vault configured, `npm run dev` renders the bundled
[`example-vault/`](example-vault/) so you can see what the project looks like
immediately. Point it at your own content by setting `VAULT_PATH` (see
[Content](#content) below).

The graph and search indexes are generated at build time from the vault. The dev
server re-runs the data pipeline when vault content changes; if something looks
stale, run `npm run prepare-data`.

## Configuration

The committed [`.env`](.env) file holds the site's defaults — title,
description, URL, author, and social handles. These `NEXT_PUBLIC_*` values are
public by design; they're inlined into the static build.

To run your own instance, edit [`.env`](.env) directly, or override individual
values with a git-ignored `.env.local` (which takes precedence and is never
committed). Next.js loads both automatically for `dev` and `build`.

Keep private material — PGP private keys, passphrases — out of `.env`. Put it in
`.env.local` or pass it through the environment at build time.

## Content

Content is **not committed to this repo**; it lives in a separate Obsidian
vault of Markdown notes. The build resolves the vault in this order:

1. The `VAULT_PATH` environment variable, if set.
2. A `vault/` directory in the repo root, if present (e.g. a bind-mounted
   vault; see [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json),
   which mounts a host folder to `vault/`).
3. The bundled [`example-vault/`](example-vault/), a small demo vault that ships
   with the repo so a fresh clone renders out of the box.

To use your own content, point `VAULT_PATH` at your vault:

```bash
VAULT_PATH=/path/to/your/vault npm run dev
```

The [`example-vault/`](example-vault/) showcases the rendering engine: wikilinks,
callouts, math, Mermaid diagrams, charts, citations, terminal/asciinema casts, and
image galleries. Browse it to see the supported Markdown features.

## Build

```bash
npm run build
```

`build` runs `prepare-data` and then `next build` (static export to `out/`). The
data pipeline runs in order:

1. `parse-vault`: scans the vault, resolves `[[wikilinks]]` and related notes, builds the search index, and writes `data/vault.json` (plus a trimmed `public/vault.json` for the client).
2. `parse-bibtex`: converts the vault's `references.bib` to `data/references.json`.
3. `optimize-images`: converts images to **WebP** with Sharp into `public/images/` (resized to fit 1920×1920).
4. `generate-og-images`: renders a 1200×630 Open Graph card per note.
5. `copy-static-assets`: copies remaining static files (casts, fonts, PGP keys) into `public/`.

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
lib/           Data loading, routing, markdown, feeds, metadata
scripts/       Build-time data pipeline
utils/         Shared helpers
example-vault/ Bundled demo content (fallback vault)
```

Your own Markdown content lives outside the repo (set `VAULT_PATH`); see
[Content](#content).

## License

[MIT](LICENSE)
