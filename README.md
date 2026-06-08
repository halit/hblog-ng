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

1. `parse-vault`: scans the vault, resolves `[[wikilinks]]`, and writes `data/vault.json` (plus a trimmed `public/vault.json` for the client).
2. `parse-bibtex`: converts the vault's `references.bib` to `data/references.json`.
3. `optimize-images`: compresses images into `public/images/` with Sharp.
4. `generate-og-images`: renders an Open Graph card per note.

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
