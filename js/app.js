// Main application
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  try {
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');

    // Load data
    await DataManager.loadData();

    // Initialize map
    MapManager.initMap();

    // Populate filters
    populateCategoryFilters();
    populateCommuneSelect();

    // Initialize UI
    initializeUI();
    SearchManager.initSearchUI();
    StatsManager.initStatsUI();

    // Add initial markers
    const locations = DataManager.getFilteredLocations();
    MapManager.addMarkers(locations);

    // Hide loading overlay
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

function populateCategoryFilters() {
  const container = document.getElementById('category-filters');
  if (!container) return;

  const categories = DataManager.getCategories();
  container.innerHTML = categories.map(category => {
    const color = DataManager.getCategoryColor(category);
    const checkboxId = `cat-${category.replace(/\s+/g, '-')}`;
    return `
      <label class="filter-checkbox">
        <input type="checkbox" id="${checkboxId}" value="${category}" checked />
        <span>
          <div class="filter-color-dot" style="background-color: ${color};"></div>
          ${category}
        </span>
      </label>
    `;
  }).join('');

  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', onFilterChange);
  });
}

function populateCommuneSelect() {
  const select = document.getElementById('commune-select');
  if (!select) return;

  const communes = DataManager.getCommunes();
  const options = communes.map(commune => 
    `<option value="${commune}">${commune}</option>`
  ).join('');
  
  select.innerHTML = '<option value="">— Toutes les communes —</option>' + options;
  select.addEventListener('change', onFilterChange);
}

function onFilterChange() {
  const categories = Array.from(
    document.querySelectorAll('#category-filters input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  const commune = document.getElementById('commune-select').value;

  SearchManager.updateFilters({
    categories,
    commune
  });
}

function initializeUI() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const mobileSidebarBtn = document.getElementById('mobile-sidebar-btn');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.style.marginLeft = sidebar.style.marginLeft === '-100%' ? '0' : '-100%';
    });
  }

  if (mobileSidebarBtn) {
    mobileSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Layer switcher
  const layerRadios = document.querySelectorAll('input[name="tile-layer"]');
  layerRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      MapManager.switchLayer(e.target.value);
    });
  });

  const layerBtn = document.getElementById('layer-btn');
  const layerSwitcher = document.getElementById('layer-switcher');
  if (layerBtn && layerSwitcher) {
    layerBtn.addEventListener('click', () => {
      layerSwitcher.style.display = 
        layerSwitcher.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Reset filters button
  const resetBtn = document.getElementById('reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  // Export buttons
  const exportGeoJSON = document.getElementById('export-geojson');
  const printMap = document.getElementById('print-map');

  if (exportGeoJSON) {
    exportGeoJSON.addEventListener('click', exportData);
  }
  if (printMap) {
    printMap.addEventListener('click', () => window.print());
  }
}

function resetAllFilters() {
  document.querySelectorAll('#category-filters input[type="checkbox"]')
    .forEach(cb => cb.checked = true);
  document.getElementById('commune-select').value = '';
  document.getElementById('search-input').value = '';
  
  SearchManager.updateFilters({
    categories: DataManager.getCategories(),
    commune: '',
    search: ''
  });
}

function exportData() {
  const geojson = DataManager.exportToGeoJSON();
  const dataStr = JSON.stringify(geojson, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hiv-map-data-${new Date().toISOString().split('T')[0]}.geojson`;
  link.click();
  URL.revokeObjectURL(url);
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
    if (e.key === 'f') {
      const locations = DataManager.getFilteredLocations();
      if (locations.length > 0) {
        MapManager.fitBounds(locations);
      }
    }
  });
}