# Dholera SIR — independent guide and 3D model

A static multi-page site about the Dholera Special Investment Region, with a Three.js model at `/explore/`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Generate pages, then start Vite |
| `npm run build` | Data and geometry checks, page generation, production build to `dist/` |
| `npm run preview` | Serve `dist/` on port 4173 |
| `npm run check` | Geometry checks plus data integrity (every cited source exists, every project is dated) |
| `npm run fetch:latest` | Compare the official DSIRDA pages with the data file; writes `scripts/out/latest-report.md` |

## Where things live

- `src/data/dholera.js` — the single data source: facts, projects, timeline, villages, FAQ, sources.
- `src/site/templates.mjs` — HTML for every generated page. `src/site/routes.js` lists them.
- `scripts/build-pages.mjs` — writes the pages, `sitemap.xml` and `robots.txt`. The generated `index.html`, `projects/` and so on are git-ignored.
- `explore/index.html`, `src/main.js`, `src/world/` — the 3D model. `src/content/city.js` holds its prose.

## Updating the data

1. Run `npm run fetch:latest` and read the report.
2. Edit `src/data/dholera.js`. Cite a source id for every change; press items need a date.
3. Bump `meta.dataAsOf`, then run `npm run build`.

Set `meta.siteUrl` to the production domain before deploying; canonical URLs, Open Graph tags and the sitemap use it.
