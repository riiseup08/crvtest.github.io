/**
 * search.js – Location search and autocomplete
 * HIV Risk Map – Cartographie des risques VIH
 */

const SearchManager = (() => {
  let inputEl = null;
  let resultsEl = null;
  let onSelectCallback = null;
  let debounceTimer = null;

  /**
   * Initialise search UI
   * @param {string} inputId    id of the <input> element
   * @param {string} resultsId  id of the results container
   * @param {Function} onSelect callback(feature) when result selected
   */
  function init(inputId, resultsId, onSelect) {
    inputEl = document.getElementById(inputId);
    resultsEl = document.getElementById(resultsId);
    onSelectCallback = onSelect;

    inputEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleInput, 200);
    });

    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        clear();
      }
    });

    // Close results when clicking outside
    document.addEventListener('click', e => {
      if (!inputEl.contains(e.target) && !resultsEl.contains(e.target)) {
        hideResults();
      }
    });
  }

  function handleInput() {
    const query = inputEl.value.trim();
    if (query.length < 2) {
      hideResults();
      return;
    }

    const results = DataManager.search(query, 15);
    showResults(results, query);
  }

  /**
   * Render search results
   * @param {Array}  results   GeoJSON feature array
   * @param {string} query     original search term (for highlighting)
   */
  function showResults(results, query) {
    resultsEl.innerHTML = '';

    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="search-result-item" style="color:#888;cursor:default">Aucun résultat trouvé</div>';
      resultsEl.style.display = 'block';
      return;
    }

    results.forEach(feature => {
      const props = feature.properties;
      const meta = DataManager.getCategoryMeta(props.category);
      const div = document.createElement('div');
      div.className = 'search-result-item';

      const name = props.secteur || props.commune || '–';
      const commune = props.commune || '';

      div.innerHTML = `
        <span style="
          display:inline-block;width:8px;height:8px;
          border-radius:50%;background:${meta.hex};
          margin-right:6px;vertical-align:middle"></span>
        <strong>${highlight(escapeHtml(name), escapeHtml(query))}</strong>
        <span class="search-result-category">${escapeHtml(props.category)} – ${highlight(escapeHtml(commune), escapeHtml(query))}</span>
      `;

      div.addEventListener('click', () => {
        inputEl.value = name;
        hideResults();
        if (onSelectCallback) onSelectCallback(feature);
      });

      resultsEl.appendChild(div);
    });

    resultsEl.style.display = 'block';
  }

  function hideResults() {
    resultsEl.style.display = 'none';
  }

  function clear() {
    if (inputEl) inputEl.value = '';
    hideResults();
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Wrap matched text in a <mark> tag (applied to already-escaped text)
   * @param {string} text   HTML-escaped text
   * @param {string} query  raw user query
   * @returns {string}
   */
  function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  return { init, clear };
})();
