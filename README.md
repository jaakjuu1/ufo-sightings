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

## Data

The dataset is a scrubbed, geocoded, time-standardized export of NUFORC's public
report database (via [`planetsig/ufo-reports`](https://github.com/planetsig/ufo-reports)).

`scripts/build-data.mjs` downloads the source CSV, cleans it (HTML-entity decoding,
date/coordinate/duration parsing, country/state normalization) and produces two
committed artifacts the app ships with:

| File | Contents | Size |
| --- | --- | --- |
| `src/data/stats.json` | Aggregate analytics over all reports (powers the dashboard) | ~8 KB |
| `src/data/sightings.json` | Full cleaned record set (served, filtered & sampled, via the API) | ~24 MB |

Regenerate the data (e.g. to refresh from upstream) with:

```bash
npm run build:data
```

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
