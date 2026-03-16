/**
 * app.js – Main application orchestration
 * HIV Risk Map – Cartographie des risques VIH
 */

(async () => {
  // ── Loading overlay ──────────────────────────────────────────────────────────
  const overlay = document.getElementById('loading-overlay');

  // ── Initialise map ──────────────────────────────────────────────────────────
  MapManager.init('map');

  // ── Load data ────────────────────────────────────────────────────────────────
  try {
    await DataManager.load();
  } catch (err) {
    if (overlay) {
      overlay.innerHTML = `<p style="color:#c00;text-align:center;padding:20px">
        Erreur de chargement des données.<br>${err.message}</p>`;
    }
    return;
  }

  // ── Build sidebar filters ─────────────────────────────────────────────────
  buildCategoryFilters();
  buildCommuneSelect();

  // ── Initial render ────────────────────────────────────────────────────────
  renderMap();
  MapManager.fitBounds();

  // Hide loading overlay
  if (overlay) overlay.style.display = 'none';

  // ── Search ────────────────────────────────────────────────────────────────
  SearchManager.init('search-input', 'search-results', feature => {
    MapManager.focusFeature(feature);
  });

  // ── Sidebar toggle ────────────────────────────────────────────────────────
  setupSidebarToggle();

  // ── Layer switcher ────────────────────────────────────────────────────────
  setupLayerSwitcher();

  // ── Export buttons ────────────────────────────────────────────────────────
  setupExport();

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  setupKeyboardShortcuts();

  // ── Reset filters ─────────────────────────────────────────────────────────
  document.getElementById('reset-filters').addEventListener('click', () => {
    DataManager.resetFilters();
    // Reset UI checkboxes
    document.querySelectorAll('.category-checkbox').forEach(cb => (cb.checked = true));
    // Reset commune select
    const sel = document.getElementById('commune-select');
    if (sel) sel.value = '';
    renderMap();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────────────────────────────────

  /** Render markers and update stats based on current filters */
  function renderMap() {
    const filtered = DataManager.getFiltered();
    MapManager.render(filtered);
    StatsManager.update(filtered, DataManager.getAll());
  }

  /** Build category filter checkboxes */
  function buildCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const allFeatures = DataManager.getAll();
    const totalCounts = DataManager.countByCategory(allFeatures);

    Object.entries(DataManager.CATEGORY_META).forEach(([cat, meta]) => {
      const key = slugify(cat);
      const count = totalCounts[cat] || 0;

      const div = document.createElement('div');
      div.className = 'filter-item';
      div.innerHTML = `
        <input type="checkbox" class="category-checkbox" id="cb-${key}"
          data-category="${cat}" checked>
        <label for="cb-${key}">
          <span class="filter-dot color-${meta.color}"></span>
          ${cat}
          <span class="filter-count" id="count-${key}">${count.toLocaleString()}</span>
        </label>
      `;

      div.querySelector('input').addEventListener('change', e => {
        DataManager.setCategoryVisible(cat, e.target.checked);
        renderMap();
      });

      container.appendChild(div);
    });
  }

  /** Build commune <select> filter */
  function buildCommuneSelect() {
    const sel = document.getElementById('commune-select');
    if (!sel) return;

    DataManager.getCommunes().forEach(commune => {
      const opt = document.createElement('option');
      opt.value = commune;
      opt.textContent = toTitleCase(commune);
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => {
      DataManager.setCommune(sel.value || null);
      renderMap();
    });
  }

  /** Setup sidebar open/close toggle */
  function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const isMobile = () => window.innerWidth <= 768;

    // Start open on desktop, closed on mobile
    if (isMobile()) {
      sidebar.classList.remove('open');
    } else {
      toggle.classList.add('sidebar-open');
    }

    toggle.addEventListener('click', () => {
      if (isMobile()) {
        sidebar.classList.toggle('open');
      } else {
        sidebar.classList.toggle('collapsed');
        toggle.classList.toggle('sidebar-open');
        const isCollapsed = sidebar.classList.contains('collapsed');
        toggle.textContent = isCollapsed ? '\u203a' : '\u2039';
        toggle.setAttribute('aria-label', isCollapsed ? 'Afficher le panneau latéral' : 'Masquer le panneau latéral');
        toggle.setAttribute('title', isCollapsed ? 'Afficher' : 'Masquer');
      }
      // Invalidate map size after transition
      setTimeout(() => MapManager.getMap().invalidateSize(), 320);
    });

    // Mobile: sidebar toggle in header
    const headerToggle = document.getElementById('mobile-sidebar-btn');
    if (headerToggle) {
      headerToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  /** Setup tile layer switcher */
  function setupLayerSwitcher() {
    const panel = document.getElementById('layer-switcher');
    const btn   = document.getElementById('layer-btn');
    if (!panel || !btn) return;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      panel.classList.toggle('visible');
    });

    document.querySelectorAll('input[name="tile-layer"]').forEach(radio => {
      radio.addEventListener('change', () => {
        MapManager.switchLayer(radio.value);
      });
    });

    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.remove('visible');
      }
    });
  }

  /** Setup GeoJSON export and print */
  function setupExport() {
    const exportBtn = document.getElementById('export-geojson');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const filtered = DataManager.getFiltered();
        const geojson = { type: 'FeatureCollection', features: filtered };
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'risques-vih.geojson';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const printBtn = document.getElementById('print-map');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  }

  /** Keyboard shortcuts */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      // '/' to focus search
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const input = document.getElementById('search-input');
        if (input) input.focus();
      }
      // 'f' to fit bounds
      if (e.key === 'f' && document.activeElement.tagName !== 'INPUT') {
        MapManager.fitBounds();
      }
    });
  }

  /** Convert category name to a URL-safe slug */
  function slugify(str) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /** Simple title-case formatter */
  function toTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
})();
