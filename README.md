# Cartographie des risques VIH – Adolescents et Jeunes

Interactive map of HIV risks and vulnerabilities among adolescents and youth in Cameroon.

## Features

- **Interactive Map** – Leaflet.js with marker clustering for 5,000+ locations
- **Multiple Tile Layers** – OpenStreetMap, Satellite (Esri), Terrain (OpenTopoMap)
- **Category Filtering** – Toggle visibility of Zones à risques, OSC, FOSA, Secteur Apparenté
- **Commune Filter** – Narrow down to a specific commune
- **Search** – Find locations by sector or commune name with live autocomplete
- **Statistics Dashboard** – Real-time counts updating as filters change
- **GeoJSON Export** – Download the currently visible data
- **Print Support** – Clean print layout
- **Responsive Design** – Works on mobile, tablet, and desktop
- **Keyboard Shortcuts** – `/` to focus search, `f` to fit bounds

## Data Categories

| Colour | Category | Count |
|--------|----------|-------|
| 🔴 Red | Zone à risques | 3 951 |
| 🔵 Blue | OSC (Organisation de la Société Civile) | 96 |
| 🟢 Green | FOSA (Formation Sanitaire) | 490 |
| 🟣 Purple | Secteur Apparenté | 748 |

## File Structure

```
├── index.html           Main entry point
├── css/
│   ├── style.css        Custom styles
│   └── responsive.css   Mobile responsive styles
├── js/
│   ├── app.js           Main application logic
│   ├── map.js           Map initialisation and controls
│   ├── data.js          Data management and filtering
│   ├── search.js        Search functionality
│   └── stats.js         Statistics dashboard
├── data/
│   └── locations.json   Location data (GeoJSON FeatureCollection)
└── README.md
```

## Running Locally

Because the app fetches `data/locations.json` via `fetch()`, you need a local HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Then open http://localhost:8000
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search box |
| `f` | Fit map to visible markers |
| `Esc` | Clear search |
