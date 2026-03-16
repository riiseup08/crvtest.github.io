/**
 * stats.js – Statistics dashboard rendering
 * HIV Risk Map – Cartographie des risques VIH
 */

const StatsManager = (() => {
  /**
   * Convert a category name to a URL-safe slug (must match app.js slugify)
   * @param {string} str
   * @returns {string}
   */
  function slugify(str) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Update the stats panel with current filtered data
   * @param {Array} filteredFeatures  currently visible features
   * @param {Array} allFeatures       all loaded features
   */
  function update(filteredFeatures, allFeatures) {
    const total = filteredFeatures.length;

    // Update total count
    const totalEl = document.getElementById('stat-total');
    if (totalEl) totalEl.textContent = total.toLocaleString();

    // Update per-category counts
    const counts = DataManager.countByCategory(filteredFeatures);
    Object.keys(DataManager.CATEGORY_META).forEach(cat => {
      const count = counts[cat] || 0;
      const key = slugify(cat);
      const countEl = document.getElementById(`count-${key}`);
      if (countEl) countEl.textContent = count.toLocaleString();
    });

    // Update commune count
    const communeCounts = DataManager.countByCommune(filteredFeatures);
    const communeCountEl = document.getElementById('stat-communes');
    if (communeCountEl) {
      communeCountEl.textContent = Object.keys(communeCounts).length.toLocaleString();
    }
  }

  return { update };
})();
