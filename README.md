# 🛸 UFO Sightings Atlas

An interactive dashboard built on **real** UFO sighting data — **80,332 eyewitness
reports** filed with the [National UFO Reporting Center (NUFORC)](https://nuforc.org)
between 1906 and 2014, across 5 countries.

It turns a raw public dataset into something genuinely useful for anyone curious
about UFO phenomena: where sightings cluster, what shapes people report, when
they happen (time of day, season, decade), how long they last, and a searchable,
mappable view of every individual report.

## What it shows

- **Headline stats** — total reports, most-reported shape, peak year, most active
  hour of day, median sighting duration, distinct shape count.
- **Reports per year** — the dramatic rise from a handful in the 1950s to the
  late-2000s peak.
- **Time-of-day, month and weekday** distributions — sightings cluster heavily
  after dark and in the summer months.
- **Shape breakdown** — lights, triangles, circles, fireballs and more, color-coded
  consistently across the whole app.
- **Duration distribution** — most encounters are brief (the median is ~3 minutes).
- **Geography** — top countries, top U.S. states, and top cities (hotspots).
- **Shape trends by decade** — how the mix of reported shapes shifted over time.
- **Interactive explorer** — a dark world map plus a searchable, filterable,
  paginated list. Filter by country, shape, year range, or free-text keyword
  (e.g. `area 51`, `boomerang`, `hovering`), and click any point or row for the
  full report.

## Data & freshness

Two sources are merged, newest-on-top and de-duplicated:

1. **Live — `nuforc.org`.** `scripts/build-data.mjs` fetches the most recent
   reports straight from the NUFORC databank and merges them into the snapshot.
   New reports are geocoded from a gazetteer built out of the historical data
   (plus state/country centroids), so no external geocoder is needed.
2. **Historical baseline** — a scrubbed, geocoded export of NUFORC's database via
   [`planetsig/ufo-reports`](https://github.com/planetsig/ufo-reports) (1949–2014),
   used once to bootstrap the archive.

`scripts/build-data.mjs` produces two committed artifacts the app ships with:

| File | Contents | Size |
| --- | --- | --- |
| `src/data/stats.json` | Aggregate analytics over all reports (powers the dashboard) | ~8 KB |
| `src/data/sightings.json` | Full cleaned record set (served, filtered & sampled, via the API) | ~24 MB |

```bash
npm run build:data                 # incremental: existing snapshot + recent NUFORC
UFO_BOOTSTRAP=1 npm run build:data  # rebuild the historical baseline from planetsig
NUFORC_SINCE_DAYS=400 npm run build:data   # widen the live window (e.g. backfill)
UFO_SKIP_LIVE=1 npm run build:data         # snapshot only, skip the live fetch
```

### How "real-time" works

- **Daily refresh (the workhorse).** `.github/workflows/refresh-data.yml` runs on a
  GitHub-hosted runner — which, unlike sandboxed dev/deploy environments, has open
  internet egress and *can* reach `nuforc.org`. It re-runs `build:data`, and commits
  the updated snapshot **only when new reports actually arrive** (`sightings.json`
  carries no timestamp, so an idle run produces no diff and no commit). Trigger a
  one-time backfill from the Actions tab with a large `since_days`.
- **Live strip (best-effort).** The “Latest from NUFORC” strip calls `GET /api/live`,
  an ISR route (revalidated every 30 min) that fetches the freshest reports on the
  server. If the deployment can't reach `nuforc.org`, the endpoint returns nothing
  and the strip simply hides — the rest of the page is unaffected.

> **Network policy:** Claude Code web/dev sandboxes and some deploy environments use
> an egress **allowlist**. `nuforc.org` must be added to it for the live fetch and
> live strip to work *outside* GitHub Actions. Without it, the app still runs fully
> on the committed snapshot, which the daily Action keeps current.
>
> **NUFORC ToS** restricts scraping and redistribution; keep live-fetched data for
> private/internal use.

> ⚠️ These are **unverified eyewitness accounts**, inherently subjective and
> reporting-biased (overwhelmingly U.S./English-speaking). Treat the patterns as
> *patterns in how people report sightings*, not confirmed observations.

## Architecture

- **Next.js 16 (App Router)**, React 19, TypeScript.
- The home page is a **server component** that reads the small `stats.json` and
  renders the dashboard with **dependency-free SVG/CSS charts** (`src/components/charts.tsx`).
- `GET /api/sightings` queries the full dataset in memory and supports
  `search`, `country`, `state`, `shape`, `yearFrom`, `yearTo`, `limit`, `offset`,
  and a `map=1&max=N` down-sampling mode for the map.
- `GET /api/live` returns the freshest reports fetched live from NUFORC (ISR,
  30-min revalidate); empty when the host isn't reachable.
- The interactive map uses **Leaflet** (canvas circle markers, dynamically
  imported so it never runs during SSR).

## Develop

```bash
npm install
npm run build:data   # optional — committed data already present
npm run dev          # http://localhost:3000
```

## Deploy

Builds to a standalone Next.js server and ships as a Docker image:

```bash
docker build -t ufo-sightings .
docker run -p 3000:3000 ufo-sightings
```

The bundled dataset is traced into the standalone output, so the container needs
**no network access at runtime**. GitHub Actions workflows publish the image to GHCR.

## API examples

```bash
# Triangle sightings in Texas, 2008–2010
curl "localhost:3000/api/sightings?shape=triangle&country=us&state=tx&yearFrom=2008&yearTo=2010"

# Anything mentioning "area 51"
curl "localhost:3000/api/sightings?search=area%2051"

# Up to 3,000 map points for fireballs
curl "localhost:3000/api/sightings?shape=fireball&map=1&max=3000"
```
