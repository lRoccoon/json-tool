# JSON Tool

A developer notebook for unwieldy JSON. Paste raw, escaped, or Unicode-encoded
JSON and get a navigable tree with per-value actions — works fully offline and
ships as a single Docker image.

Live demo: <https://json.herf.cc>

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
`linux/arm64`) images to `ghcr.io/<owner>/json-tool` with tags `latest`,
`sha-<short>`, and the semver tag when applicable.

## License

[MIT](./LICENSE) © Roccoon
