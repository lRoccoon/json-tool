# JSON Tool

A developer notebook for unwieldy JSON. Paste raw, escaped, or Unicode-encoded
JSON and get a navigable tree with per-value actions — works fully offline and
ships as a single Docker image.

Live demo: <https://json.herf.cc>

## Repo Map

Code is the source of truth; the documents below give navigation and the
principles that the code alone can't carry.

- [`AGENTS.md`](./AGENTS.md) — collaboration entry point, required reading order
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — stable layers and boundary rules
- [`DESIGN.md`](./DESIGN.md) — design principles and long-term constraints
- [`PRODUCT_SENSE.md`](./PRODUCT_SENSE.md) — target users, scenarios, value calls
- [`FRONTEND.md`](./FRONTEND.md) — frontend design language and constraints
- [`RELIABILITY.md`](./RELIABILITY.md) — failure modes, degradation, recovery
- [`SECURITY.md`](./SECURITY.md) — trust boundaries and data handling
- [`QUALITY_SCORE.md`](./QUALITY_SCORE.md) — quality dimensions and delivery bar
- [`CHANGELOG.md`](./CHANGELOG.md) — what already changed and why
- [`docs/design-docs/`](./docs/design-docs/) — long-form design themes
- [`docs/product-specs/`](./docs/product-specs/) — user-facing capabilities
- [`docs/references/`](./docs/references/) — external specs and references
- [`docs/generated/`](./docs/generated/) — generated artifacts
- [`rules/`](./rules/) — commit, validation, doc-update, compatibility rules
- [`src/`](./src/) — `App.tsx` entry, `components/` UI, `utils/` pure logic
- `Dockerfile` · `nginx.conf` · `docker-compose.yml` — runtime
- `.github/workflows/` — CI (multi-arch image build)

## Features

- **Format / compress** arbitrarily large JSON with batch-adjustable expand
  levels (1–5 / all).
- **Escape toolkit** on the raw input: escape, unescape, Unicode ⇄ Chinese,
  one-click unwrap of fully-escaped JSON strings.
- **Recent history** for the source pane: auto-saved snapshots in local
  browser storage, with restore, single-delete, and clear-all actions.
- **Recursive tree viewer** with per-node expand override.
- **Nested JSON parsing** — a string value that itself holds JSON can be
  expanded as a sub-tree on demand.
- **Per-value actions**: copy, unescape in place, open long values in a popup
  with word-wrap and unescape toggles.
- **Offline-first**: fonts are bundled via `@fontsource`, no external CDNs.
- **Editorial UI**: warm paper palette, Instrument Serif + IBM Plex.

## Stack

Vite 5 · React 18 · TypeScript 5 · Nginx 1.27 (runtime).

## Development

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # type-check + production bundle into dist/
pnpm test      # history storage tests via Node's built-in runner
pnpm preview   # serve the built bundle
```

## History

The source pane keeps a recent-history list in `localStorage` under a versioned
key. Snapshots are saved automatically after input changes, deduplicated by
content, and capped to the latest 20 entries.

- History lives only in the current browser profile.
- Clearing the editor does not delete saved history.
- Use the history panel to restore an entry, remove one item, or clear the
  entire list.

## Docker

Pre-built images are published to GitHub Container Registry on every push to
`main` and on version tags:

```bash
docker run --rm -p 8080:80 ghcr.io/lroccoon/json-tool:latest
```

Or build locally:

```bash
docker build -t json-tool .
docker run --rm -p 8080:80 json-tool
```

The included `docker-compose.yml` assumes an external Traefik network; adjust
or remove it for a standalone deploy.

## CI

GitHub Actions (`.github/workflows/docker.yml`) builds the image on every push
to `main` and on `v*` tags, then pushes multi-arch (`linux/amd64`,
`linux/arm64`) images to `ghcr.io/<owner>/json-tool`:

- Pushes to `main` publish `dev` and `sha-<short>`.
- Pushes of a `v*` tag publish `latest`, the semver tag (e.g. `0.4.0`, `0.4`),
  and `sha-<short>`.

## License

[MIT](./LICENSE) © Roccoon
