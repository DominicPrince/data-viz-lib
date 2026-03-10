# data-viz-lib

A searchable library of data visualisations. Find the right chart, preview it in your brand theme.

## Stack

- Vanilla HTML / CSS / JS — no build step
- [Fuse.js](https://fusejs.io/) — fuzzy search
- [Vega-Lite](https://vega.github.io/vega-lite/) — interactive charts
- GitHub Pages — hosting

## Local dev

```bash
# Any static server works
npx serve .
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Adding a visualisation

1. Add an entry to `data/catalog.json`
2. Add a Vega-Lite spec function to `getVegaSpec()` in `app.js`
3. That's it.

## Backlog

### Real choropleth map
The current `choropleth-map` renderer is a placeholder (grid of rectangles). Replace with a proper data-driven choropleth using TopoJSON/GeoJSON country boundaries projected to SVG paths, with countries filled by series value.

Regions to support:
- World (all countries)
- Europe
- The Americas
- Africa
- APAC
