/**
 * map.js – Map initialisation, tile layers, marker rendering
 * HIV Risk Map – Cartographie des risques VIH
 */

const MapManager = (() => {
  let map = null;
  let markerCluster = null;
  let currentLayer = 'osm';

  // Tile layer definitions
  const TILE_LAYERS = {
    osm: {
      label: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    },
    satellite: {
      label: 'Satellite (Esri)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      },
    },
    terrain: {
      label: 'Terrain (OpenTopoMap)',
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      options: {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17,
      },
    },
  };

  let activeTileLayer = null;


  /**
   * Build an HTML popup string for a feature
   * @param {Object} feature
   * @returns {string}
   */
  function buildPopupHtml(feature) {
    const p = feature.properties;
    const meta = DataManager.getCategoryMeta(p.category);

    let body = '';

    if (p.commune) {
      body += `<div class="popup-field">
        <div class="popup-label">Commune</div>
        <div class="popup-value">${p.commune}</div>
      </div>`;
    }

    if (p.secteur) {
      body += `<div class="popup-field">
        <div class="popup-label">Secteur</div>
        <div class="popup-value">${p.secteur}</div>
      </div>`;
    }

    if (p.description) {
      body += `<div class="popup-field">
        <div class="popup-label">Description</div>
        <div class="popup-value">${p.description}</div>
      </div>`;
    }

    if (p.prevention !== undefined) {
      const badgePrev = `<span class="popup-badge ${p.prevention === 'OUI' ? 'badge-oui' : 'badge-non'}">${p.prevention}</span>`;
      const badgeTest = `<span class="popup-badge ${p.test_depistage === 'OUI' ? 'badge-oui' : 'badge-non'}">${p.test_depistage}</span>`;
      const badgeArv  = `<span class="popup-badge ${p.dispensation_arv === 'OUI' ? 'badge-oui' : 'badge-non'}">${p.dispensation_arv}</span>`;

      body += `<div class="popup-field"><div class="popup-label">Prévention</div><div>${badgePrev}</div></div>`;
      body += `<div class="popup-field"><div class="popup-label">Test de dépistage</div><div>${badgeTest}</div></div>`;
      body += `<div class="popup-field"><div class="popup-label">Dispensation ARV</div><div>${badgeArv}</div></div>`;
    }

    return `
      <div class="popup-header popup-header-${meta.color}">${p.category}</div>
      <div class="popup-body">${body}</div>
    `;
  }

  /**
   * Initialise Leaflet map
   * @param {string} elementId  DOM element id
   */
  function init(elementId) {
    map = L.map(elementId, {
      center: [3.848, 11.5021],
      zoom: 6,
      zoomControl: true,
    });

    // Default tile layer
    activeTileLayer = L.tileLayer(TILE_LAYERS.osm.url, TILE_LAYERS.osm.options);
    activeTileLayer.addTo(map);

    // Marker cluster group
    markerCluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    map.addLayer(markerCluster);

    return map;
  }

  /**
   * Switch base tile layer
   * @param {string} layerKey  key in TILE_LAYERS
   */
  function switchLayer(layerKey) {
    if (!TILE_LAYERS[layerKey]) return;
    if (activeTileLayer) map.removeLayer(activeTileLayer);
    activeTileLayer = L.tileLayer(TILE_LAYERS[layerKey].url, TILE_LAYERS[layerKey].options);
    activeTileLayer.addTo(map);
    currentLayer = layerKey;
  }

  /**
   * Render filtered features onto the map
   * @param {Array} features  GeoJSON feature array
   */
  function render(features) {
    markerCluster.clearLayers();

    const markers = features.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const meta = DataManager.getCategoryMeta(feature.properties.category);

      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        fillColor: meta.hex,
        color: '#fff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85,
      });

      marker.bindPopup(buildPopupHtml(feature), {
        maxWidth: 240,
        className: 'custom-popup',
      });

      return marker;
    });

    markerCluster.addLayers(markers);
  }

  /**
   * Pan and zoom the map to a specific feature
   * @param {Object} feature  GeoJSON feature
   */
  function focusFeature(feature) {
    const [lng, lat] = feature.geometry.coordinates;
    map.setView([lat, lng], 15);
  }

  /**
   * Fit map bounds to visible markers
   */
  function fitBounds() {
    if (markerCluster.getLayers().length > 0) {
      map.fitBounds(markerCluster.getBounds(), { padding: [30, 30] });
    }
  }

  /**
   * Get the Leaflet map instance
   */
  function getMap() { return map; }

  /**
   * Get available tile layer definitions
   */
  function getTileLayers() { return TILE_LAYERS; }

  return {
    init,
    render,
    switchLayer,
    focusFeature,
    fitBounds,
    getMap,
    getTileLayers,
  };
})();
