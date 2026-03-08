/* ── app.js ───────────────────────────────────────────────────────────────── */

/* ── State ───────────────────────────────────────────────────────────────── */
const state = {
  catalog: [],
  fuse: null,
  activeFilter: 'all',
  query: '',
  theme: {
    accent: '#3B82F6',
    bg: '#ffffff',
    palette: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    font: 'Inter',
  },
  openVizId: null,
  vegaViews: {}, // card id → vega view, for re-theming
};

/* ── Theme presets ───────────────────────────────────────────────────────── */
const PRESETS = {
  default: {
    accent: '#3B82F6',
    bg: '#ffffff',
    palette: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    font: 'Inter',
  },
  bold: {
    accent: '#EF4444',
    bg: '#fff7f7',
    palette: ['#EF4444', '#F97316', '#FBBF24', '#84CC16', '#06B6D4', '#8B5CF6'],
    font: 'Inter',
  },
  earth: {
    accent: '#92400E',
    bg: '#faf7f2',
    palette: ['#92400E', '#B45309', '#D97706', '#65A30D', '#047857', '#6B7280'],
    font: "'Georgia', serif",
  },
  dark: {
    accent: '#38BDF8',
    bg: '#0F172A',
    palette: ['#38BDF8', '#34D399', '#FCD34D', '#F87171', '#A78BFA', '#F472B6'],
    font: 'Inter',
  },
};

/* ── Vega theme builder ──────────────────────────────────────────────────── */
function buildVegaConfig(theme, compact = false) {
  const isDark = isColorDark(theme.bg);
  const textColor = isDark ? '#e2e8f0' : '#1A1816';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const axisColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

  return {
    background: theme.bg,
    font: theme.font,
    title: { font: theme.font, fontWeight: 600, color: textColor, fontSize: compact ? 0 : 13 },
    axis: {
      labelFont: theme.font,
      labelColor: isDark ? '#94a3b8' : '#6B6866',
      labelFontSize: compact ? 9 : 11,
      titleFont: theme.font,
      titleColor: isDark ? '#94a3b8' : '#6B6866',
      titleFontSize: compact ? 10 : 12,
      gridColor,
      domainColor: axisColor,
      tickColor: axisColor,
    },
    legend: {
      labelFont: theme.font,
      labelColor: textColor,
      titleFont: theme.font,
      titleColor: textColor,
      labelFontSize: compact ? 9 : 11,
    },
    range: {
      category: theme.palette,
      ordinal: theme.palette,
    },
    mark: { color: theme.accent },
    bar: { color: theme.accent },
    line: { color: theme.accent, strokeWidth: 2 },
    point: { color: theme.accent, filled: true },
    arc: { innerRadius: 0 },
    area: { color: theme.accent, opacity: 0.7 },
    rect: { color: theme.accent },
  };
}

function isColorDark(hex) {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substr(0,2),16);
  const g = parseInt(c.substr(2,2),16);
  const b = parseInt(c.substr(4,2),16);
  return (0.299*r + 0.587*g + 0.114*b) < 128;
}

/* ── Vega specs ──────────────────────────────────────────────────────────── */
function getVegaSpec(vizId, compact = false) {
  const w = compact ? 260 : 560;
  const h = compact ? 130 : 280;

  const specs = {
    'bar-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {category:'Apples',value:85},{category:'Oranges',value:62},
        {category:'Bananas',value:108},{category:'Grapes',value:44},
        {category:'Mangoes',value:77},{category:'Peaches',value:93},
      ]},
      mark: 'bar',
      encoding: {
        x: {field:'category',type:'nominal',axis:{labelAngle: compact ? -30 : 0},title:null},
        y: {field:'value',type:'quantitative',title: compact ? null : 'Value'},
      },
    },
    'line-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {month:'Jan',value:42},{month:'Feb',value:55},{month:'Mar',value:50},
        {month:'Apr',value:68},{month:'May',value:73},{month:'Jun',value:89},
        {month:'Jul',value:82},{month:'Aug',value:95},{month:'Sep',value:78},
        {month:'Oct',value:102},{month:'Nov',value:88},{month:'Dec',value:110},
      ]},
      mark: {type:'line', point: true},
      encoding: {
        x: {field:'month',type:'ordinal',title:null},
        y: {field:'value',type:'quantitative',title: compact ? null : 'Revenue'},
      },
    },
    'scatter-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: Array.from({length:40},(_,i)=>({
        x: Math.round(20+Math.random()*80),
        y: Math.round(10+Math.random()*90),
        group: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
      }))},
      mark: {type:'point', filled:true, size:70, opacity:0.75},
      encoding: {
        x: {field:'x',type:'quantitative',title: compact ? null : 'Variable A'},
        y: {field:'y',type:'quantitative',title: compact ? null : 'Variable B'},
        color: {field:'group',type:'nominal',legend: compact ? null : {}},
      },
    },
    'bubble-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {x:20,y:30,size:400,label:'A'},{x:55,y:70,size:900,label:'B'},
        {x:80,y:20,size:200,label:'C'},{x:40,y:55,size:600,label:'D'},
        {x:65,y:45,size:1200,label:'E'},{x:30,y:80,size:300,label:'F'},
        {x:75,y:65,size:700,label:'G'},{x:50,y:35,size:500,label:'H'},
      ]},
      mark: {type:'point', filled:true, opacity:0.7},
      encoding: {
        x: {field:'x',type:'quantitative',title: compact ? null : 'Variable X'},
        y: {field:'y',type:'quantitative',title: compact ? null : 'Variable Y'},
        size: {field:'size',type:'quantitative',legend: compact ? null : {title:'Size'}},
        color: {field:'label',type:'nominal',legend: null},
      },
    },
    'pie-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: compact ? 120 : 260,
      height: compact ? 120 : 260,
      data: { values: [
        {category:'Product A',value:35},{category:'Product B',value:25},
        {category:'Product C',value:20},{category:'Product D',value:12},
        {category:'Other',value:8},
      ]},
      mark: {type:'arc', outerRadius: compact ? 55 : 120},
      encoding: {
        theta: {field:'value',type:'quantitative'},
        color: {field:'category',type:'nominal',legend: compact ? null : {}},
      },
    },
    'area-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {month:'Jan',value:30},{month:'Feb',value:45},{month:'Mar',value:40},
        {month:'Apr',value:60},{month:'May',value:55},{month:'Jun',value:75},
        {month:'Jul',value:70},{month:'Aug',value:88},{month:'Sep',value:72},
        {month:'Oct',value:95},{month:'Nov',value:82},{month:'Dec',value:105},
      ]},
      mark: {type:'area', line:true, point:false, opacity:0.6},
      encoding: {
        x: {field:'month',type:'ordinal',title:null},
        y: {field:'value',type:'quantitative',title: compact ? null : 'Value'},
      },
    },
    'heatmap': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const days = ['Mon','Tue','Wed','Thu','Fri'];
        const hours = ['9am','11am','1pm','3pm','5pm','7pm','9pm'];
        return days.flatMap(d => hours.map(h => ({
          day: d, hour: h,
          value: Math.round(Math.random() * 100)
        })));
      })()},
      mark: 'rect',
      encoding: {
        x: {field:'hour',type:'ordinal',title: compact ? null : 'Hour', sort:null},
        y: {field:'day',type:'ordinal',title: compact ? null : 'Day', sort:null},
        color: {
          field:'value',type:'quantitative',
          scale:{scheme:'blues'},
          legend: compact ? null : {title:'Activity'},
        },
      },
    },
    'treemap': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {name:'Marketing',value:40},{name:'Engineering',value:85},
        {name:'Sales',value:55},{name:'Support',value:30},
        {name:'Design',value:25},{name:'Operations',value:45},
        {name:'Finance',value:20},{name:'HR',value:18},
      ]},
      mark: {type:'rect'},
      transform: [{
        flatten: ['value']
      }],
      encoding: {
        x: {field:'name',type:'nominal',axis:null},
        y: {field:'value',type:'quantitative',axis: compact ? null : {}},
        color: {field:'name',type:'nominal',legend:null},
        tooltip: [{field:'name',type:'nominal'},{field:'value',type:'quantitative'}],
      },
    },
    'histogram': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: Array.from({length:200},() => ({
        value: Math.round(40 + (
          Array.from({length:6},()=>Math.random()).reduce((a,b)=>a+b,0) - 3
        ) * 15)
      }))},
      mark: 'bar',
      encoding: {
        x: {field:'value',type:'quantitative',bin:{maxbins:20},title: compact ? null : 'Score'},
        y: {aggregate:'count',title: compact ? null : 'Count'},
      },
    },
    'box-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const groups = ['Group A','Group B','Group C','Group D'];
        return groups.flatMap(g => Array.from({length:30}, () => ({
          group: g,
          value: Math.round(30 + Math.random() * 70 + (g==='Group B'?15:0))
        })));
      })()},
      mark: {type:'boxplot', extent:'min-max'},
      encoding: {
        x: {field:'group',type:'nominal',title:null},
        y: {field:'value',type:'quantitative',title: compact ? null : 'Value'},
        color: {field:'group',type:'nominal',legend:null},
      },
    },
    'funnel-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {stage:'Visitors',value:10000},{stage:'Sign-ups',value:4200},
        {stage:'Trial',value:1800},{stage:'Paid',value:640},{stage:'Retained',value:480},
      ]},
      mark: 'bar',
      encoding: {
        y: {field:'stage',type:'ordinal',sort:null,title:null,axis:{labelFontSize: compact ? 9 : 11}},
        x: {field:'value',type:'quantitative',title: compact ? null : 'Users'},
        color: {field:'value',type:'quantitative',scale:{scheme:'blues'},legend:null},
      },
    },
    'radar-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: compact ? 130 : 280,
      height: compact ? 130 : 280,
      data: { values: [
        {key:'Speed',value:78},{key:'Accuracy',value:65},
        {key:'Power',value:90},{key:'Agility',value:55},
        {key:'Endurance',value:82},{key:'Technique',value:71},
      ]},
      mark: {type:'line', point:true, strokeWidth:2},
      encoding: {
        theta: {field:'key',type:'ordinal',sort:null},
        radius: {field:'value',type:'quantitative',scale:{domain:[0,100]}},
        color: {value: '#3B82F6'},
      },
      view: {stroke:null},
    },
    'waffle-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: compact ? 120 : 260,
      height: compact ? 120 : 260,
      data: { values: Array.from({length:100},(_,i) => ({
        x: i % 10,
        y: Math.floor(i / 10),
        filled: i < 73,
      }))},
      mark: {type:'rect', cornerRadius:2},
      encoding: {
        x: {field:'x',type:'ordinal',axis:null},
        y: {field:'y',type:'ordinal',axis:null, sort:'descending'},
        color: {
          field:'filled',type:'nominal',
          scale:{range:['#E4E2DE','#3B82F6']},
          legend: compact ? null : {title:'73%', values:[true,false], labelExpr:"datum.value ? 'Filled' : 'Empty'"},
        },
      },
      config: {view:{stroke:null}},
    },
    'sankey-diagram': null, // Sankey requires vega (not vega-lite), use a proxy bar
    'chord-diagram': null,
  };

  // Fallback for complex charts not easily in vega-lite
  const fallback = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: w, height: h,
    data: { values: [
      {x:'A',y:40},{x:'B',y:65},{x:'C',y:30},{x:'D',y:80},{x:'E',y:55},
    ]},
    mark: 'bar',
    encoding: {
      x: {field:'x',type:'nominal',axis:{labelAngle:0},title:null},
      y: {field:'y',type:'quantitative',title:null},
    },
  };

  return specs[vizId] || fallback;
}

/* ── DOM refs ────────────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = $('sidebar-toggle');
const searchInput = $('search-input');
const searchClear = $('search-clear');
const filterRow = $('filter-row');
const vizGrid = $('viz-grid');
const resultsMeta = $('results-meta');
const modal = $('viz-modal');
const modalTitle = $('modal-title');
const modalTags = $('modal-tags');
const modalDescription = $('modal-description');
const modalChart = $('modal-chart');
const modalUseCases = $('modal-use-cases');
const modalNotUse = $('modal-not-use');
const modalAlso = $('modal-also');
const modalClose = $('modal-close');
const colorAccent = $('color-accent');
const colorAccentHex = $('color-accent-hex');
const colorBg = $('color-bg');
const colorBgHex = $('color-bg-hex');
const fontSelect = $('font-select');
const paletteSwatches = $('palette-swatches');
const addPaletteColor = $('add-palette-color');

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
sidebarToggle.addEventListener('click', () => {
  const open = sidebar.classList.toggle('sidebar--collapsed');
  document.body.classList.toggle('sidebar-open', !open);
});

/* ── Load catalog ────────────────────────────────────────────────────────── */
async function loadCatalog() {
  showSkeletons();
  const res = await fetch('data/catalog.json');
  state.catalog = await res.json();

  state.fuse = new Fuse(state.catalog, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'aliases', weight: 1.8 },
      { name: 'keywords', weight: 1.5 },
      { name: 'description', weight: 1 },
      { name: 'use_cases', weight: 0.8 },
      { name: 'tags', weight: 0.7 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  buildFilterPills();
  renderGrid(state.catalog);
  renderPaletteSwatches();
  checkUrlParams();
}

/* ── Skeletons ───────────────────────────────────────────────────────────── */
function showSkeletons() {
  vizGrid.innerHTML = Array.from({length:8}).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-preview"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');
}

/* ── Filter pills ────────────────────────────────────────────────────────── */
function buildFilterPills() {
  const allTags = [...new Set(state.catalog.flatMap(v => v.tags))].sort();
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-pill';
    btn.dataset.filter = tag;
    btn.textContent = capitalize(tag);
    btn.addEventListener('click', () => setFilter(tag));
    filterRow.appendChild(btn);
  });
}

function setFilter(tag) {
  state.activeFilter = tag;
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.filter === tag);
  });
  runSearch();
}

/* ── Search ──────────────────────────────────────────────────────────────── */
searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim();
  searchClear.hidden = !state.query;
  runSearch();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  state.query = '';
  searchClear.hidden = true;
  runSearch();
  searchInput.focus();
});

function runSearch() {
  let results;

  if (state.query) {
    results = state.fuse.search(state.query).map(r => r.item);
  } else {
    results = state.catalog;
  }

  if (state.activeFilter !== 'all') {
    results = results.filter(v => v.tags.includes(state.activeFilter));
  }

  renderGrid(results);
}

/* ── Grid rendering ──────────────────────────────────────────────────────── */
function renderGrid(items) {
  state.vegaViews = {};
  vizGrid.innerHTML = '';

  if (!items.length) {
    vizGrid.innerHTML = `
      <div class="empty-state">
        <strong>No charts found</strong>
        Try different search terms or clear the filter
      </div>`;
    resultsMeta.textContent = '';
    return;
  }

  resultsMeta.textContent = `${items.length} chart${items.length !== 1 ? 's' : ''}`;

  items.forEach(viz => {
    const card = document.createElement('div');
    card.className = 'viz-card';
    card.dataset.vizId = viz.id;

    const tagPills = viz.tags.slice(0,3).map(t =>
      `<span class="tag-pill">${capitalize(t)}</span>`
    ).join('');

    card.innerHTML = `
      <div class="viz-card-preview" id="preview-${viz.id}"></div>
      <div class="viz-card-body">
        <div class="viz-card-name">${viz.name}</div>
        <div class="viz-card-desc">${viz.description}</div>
        <div class="viz-card-tags">${tagPills}</div>
      </div>
    `;

    card.addEventListener('click', () => openModal(viz.id));
    vizGrid.appendChild(card);

    // Render chart in card (deferred for performance)
    requestIdleCallback(() => renderCardChart(viz.id), { timeout: 2000 });
  });
}

function renderCardChart(vizId) {
  const container = document.getElementById(`preview-${vizId}`);
  if (!container) return;

  const spec = getVegaSpec(vizId, true);
  if (!spec) {
    container.style.background = 'var(--color-bg)';
    return;
  }

  spec.config = buildVegaConfig(state.theme, true);
  spec.background = state.theme.bg;

  vegaEmbed(container, spec, {
    actions: false,
    renderer: 'canvas',
  }).then(result => {
    state.vegaViews[vizId] = result.view;
  }).catch(() => {
    // silent fail for cards
  });
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
function openModal(vizId) {
  const viz = state.catalog.find(v => v.id === vizId);
  if (!viz) return;

  state.openVizId = vizId;

  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('viz', vizId);
  history.pushState({vizId}, '', url);

  // Populate header
  modalTitle.textContent = viz.name;
  modalTags.innerHTML = viz.tags.map(t => `<span class="tag-pill">${capitalize(t)}</span>`).join('');
  modalDescription.textContent = viz.description;

  // Use cases
  modalUseCases.innerHTML = viz.use_cases.map(u => `<li>${u}</li>`).join('');
  modalNotUse.innerHTML = viz.not_use_cases.map(u => `<li>${u}</li>`).join('');

  // Also see
  if (viz.also_see?.length) {
    const links = viz.also_see.map(id => {
      const other = state.catalog.find(v => v.id === id);
      return other ? `<a href="#" data-viz-id="${id}" class="also-see-link">${other.name}</a>` : null;
    }).filter(Boolean).join(', ');
    modalAlso.innerHTML = `<strong>Also see:</strong> ${links}`;
    modalAlso.querySelectorAll('.also-see-link').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); openModal(a.dataset.vizId); });
    });
  } else {
    modalAlso.innerHTML = '';
  }

  // Chart
  modalChart.innerHTML = '';
  const spec = getVegaSpec(vizId, false);
  if (spec) {
    spec.config = buildVegaConfig(state.theme, false);
    spec.background = state.theme.bg;
    vegaEmbed(modalChart, spec, { actions: false, renderer: 'svg' }).catch(() => {});
  }

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleModalKey);
}

function closeModal() {
  state.openVizId = null;
  modal.hidden = true;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleModalKey);

  const url = new URL(window.location);
  url.searchParams.delete('viz');
  history.pushState({}, '', url);
}

function handleModalKey(e) {
  if (e.key === 'Escape') closeModal();
}

modalClose.addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

// Modal tabs
document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    if (tab.disabled) return;
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $('modal-tab-explore').hidden = tab.dataset.tab !== 'explore';
    $('modal-tab-build').hidden = tab.dataset.tab !== 'build';
  });
});

/* ── URL routing ─────────────────────────────────────────────────────────── */
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const vizId = params.get('viz');
  if (vizId && state.catalog.find(v => v.id === vizId)) {
    openModal(vizId);
  }
}

window.addEventListener('popstate', e => {
  if (e.state?.vizId) {
    openModal(e.state.vizId);
  } else {
    closeModal();
  }
});

/* ── Theme ───────────────────────────────────────────────────────────────── */
colorAccent.addEventListener('input', () => {
  state.theme.accent = colorAccent.value;
  colorAccentHex.textContent = colorAccent.value;
  applyTheme();
});

colorBg.addEventListener('input', () => {
  state.theme.bg = colorBg.value;
  colorBgHex.textContent = colorBg.value;
  applyTheme();
});

fontSelect.addEventListener('change', () => {
  state.theme.font = fontSelect.value;
  applyTheme();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyPreset(btn.dataset.preset);
  });
});

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  Object.assign(state.theme, preset);
  colorAccent.value = preset.accent;
  colorAccentHex.textContent = preset.accent;
  colorBg.value = preset.bg;
  colorBgHex.textContent = preset.bg;
  fontSelect.value = preset.font;
  renderPaletteSwatches();
  applyTheme();
}

function applyTheme() {
  // Update CSS accent for UI elements
  document.documentElement.style.setProperty('--color-accent', state.theme.accent);

  // Re-render all visible card charts
  const cardIds = Object.keys(state.vegaViews);
  cardIds.forEach(vizId => {
    const container = document.getElementById(`preview-${vizId}`);
    if (!container) return;
    state.vegaViews[vizId] = null;
    container.innerHTML = '';
    renderCardChart(vizId);
  });

  // Re-render modal chart if open
  if (state.openVizId) {
    modalChart.innerHTML = '';
    const spec = getVegaSpec(state.openVizId, false);
    if (spec) {
      spec.config = buildVegaConfig(state.theme, false);
      spec.background = state.theme.bg;
      vegaEmbed(modalChart, spec, { actions: false, renderer: 'svg' }).catch(() => {});
    }
  }
}

/* ── Palette swatches ────────────────────────────────────────────────────── */
function renderPaletteSwatches() {
  paletteSwatches.innerHTML = '';
  state.theme.palette.forEach((color, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'palette-swatch-wrap';

    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'palette-swatch';
    input.value = color;
    input.addEventListener('input', () => {
      state.theme.palette[i] = input.value;
      applyTheme();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'palette-remove';
    removeBtn.innerHTML = '×';
    removeBtn.setAttribute('aria-label', 'Remove colour');
    removeBtn.addEventListener('click', () => {
      if (state.theme.palette.length > 2) {
        state.theme.palette.splice(i, 1);
        renderPaletteSwatches();
        applyTheme();
      }
    });

    wrap.appendChild(input);
    wrap.appendChild(removeBtn);
    paletteSwatches.appendChild(wrap);
  });
}

addPaletteColor.addEventListener('click', () => {
  if (state.theme.palette.length < 10) {
    state.theme.palette.push('#888888');
    renderPaletteSwatches();
  }
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

// Polyfill for requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || (cb => setTimeout(() => cb({ timeRemaining: () => 50 }), 1));

/* ── Boot ────────────────────────────────────────────────────────────────── */
loadCatalog();
