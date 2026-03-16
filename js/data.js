/**
 * data.js – Data management, filtering and state
 * HIV Risk Map – Cartographie des risques VIH
 */

const DataManager = (() => {
  // All loaded GeoJSON features
  let allFeatures = [];

  // Active filter state
  const filters = {
    categories: new Set(['Zone à risques', 'OSC', 'FOSA', 'Secteur Apparenté', 'Partenaire']),
    communes: new Set(),      // empty = show all communes
    allCommunes: new Set(),
  };

  // Category → display metadata
  const CATEGORY_META = {
    'Zone à risques': { color: 'red',    hex: '#e74c3c', icon: 'fa-exclamation-triangle' },
    'OSC':            { color: 'blue',   hex: '#3498db', icon: 'fa-users' },
    'FOSA':           { color: 'green',  hex: '#27ae60', icon: 'fa-hospital' },
    'Secteur Apparenté': { color: 'purple', hex: '#8e44ad', icon: 'fa-building' },
    'Partenaire':     { color: 'yellow', hex: '#f39c12', icon: 'fa-handshake' },
  };

  /**
   * Load GeoJSON from data/locations.json
   * @returns {Promise<void>}
   */
  async function load() {
    const response = await fetch('data/locations.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const geojson = await response.json();
    allFeatures = geojson.features || [];

    // Collect all unique communes
    allFeatures.forEach(f => {
      if (f.properties.commune) {
        filters.allCommunes.add(f.properties.commune.trim());
      }
    });

    return allFeatures;
  }

  /**
   * Return features matching current filter state
   * @returns {Array}
   */
  function getFiltered() {
    return allFeatures.filter(f => {
      const props = f.properties;

      // Category filter
      if (!filters.categories.has(props.category)) return false;

      // Commune filter (empty set = show all)
      if (filters.communes.size > 0 && !filters.communes.has(props.commune)) return false;

      return true;
    });
  }

  /**
   * Get all features (unfiltered)
   */
  function getAll() {
    return allFeatures;
  }

  /**
   * Count by category from a given feature array
   * @param {Array} features
   * @returns {Object} { category: count }
   */
  function countByCategory(features) {
    const counts = {};
    features.forEach(f => {
      const cat = f.properties.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }

  /**
   * Count by commune from a given feature array
   * @param {Array} features
   * @returns {Object} { commune: count }
   */
  function countByCommune(features) {
    const counts = {};
    features.forEach(f => {
      const c = f.properties.commune || 'Inconnu';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }

  /**
   * Toggle a category in the active filter
   * @param {string} category
   * @param {boolean} visible
   */
  function setCategoryVisible(category, visible) {
    if (visible) {
      filters.categories.add(category);
    } else {
      filters.categories.delete(category);
    }
  }

  /**
   * Set the active commune filter
   * @param {string|null} commune – null to show all
   */
  function setCommune(commune) {
    filters.communes.clear();
    if (commune) filters.communes.add(commune);
  }

  /**
   * Reset all filters to defaults
   */
  function resetFilters() {
    filters.categories = new Set(Object.keys(CATEGORY_META));
    filters.communes.clear();
  }

  /**
   * Get all unique communes from loaded data
   * @returns {string[]}
   */
  function getCommunes() {
    return Array.from(filters.allCommunes).sort();
  }

  /**
   * Get metadata for a category
   * @param {string} category
   * @returns {Object}
   */
  function getCategoryMeta(category) {
    return CATEGORY_META[category] || { color: 'gray', hex: '#888', icon: 'fa-circle' };
  }

  /**
   * Search features by text (secteur name or commune)
   * @param {string} query
   * @param {number} limit
   * @returns {Array}
   */
  function search(query, limit = 20) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results = [];
    for (const f of allFeatures) {
      const props = f.properties;
      const secteur = (props.secteur || '').toLowerCase();
      const commune = (props.commune || '').toLowerCase();
      if (secteur.includes(q) || commune.includes(q)) {
        results.push(f);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  return {
    load,
    getAll,
    getFiltered,
    countByCategory,
    countByCommune,
    setCategoryVisible,
    setCommune,
    resetFilters,
    getCommunes,
    getCategoryMeta,
    search,
    CATEGORY_META,
    filters,
  };
})();
