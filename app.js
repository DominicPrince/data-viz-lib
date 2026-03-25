/* ── app.js ───────────────────────────────────────────────────────────────── */

/* ── Col-tip tooltip (fixed-position to escape stacking contexts) ─────────── */
(function () {
  let _tipEl = null;
  document.addEventListener('mouseover', e => {
    const badge = e.target.closest('.col-tip');
    if (!badge) return;
    if (_tipEl) _tipEl.remove();
    _tipEl = document.createElement('div');
    _tipEl.className = 'col-tip-popup';
    _tipEl.textContent = badge.dataset.tip || '';
    document.body.appendChild(_tipEl);
    const r = badge.getBoundingClientRect();
    _tipEl.style.left = (r.left + r.width / 2) + 'px';
    _tipEl.style.top  = (r.top - _tipEl.offsetHeight - 7) + 'px';
  });
  document.addEventListener('mouseout', e => {
    const badge = e.target.closest('.col-tip');
    if (!badge) return;
    if (_tipEl) { _tipEl.remove(); _tipEl = null; }
  });
})();

/* ── State ───────────────────────────────────────────────────────────────── */
const state = {
  catalog: [],
  fuse: null,
  activeFilter: 'all',
  dataStructure: '',
  goal: '',
  theme: {
    bg: '#EEF5FB',
    palette: ['#5BADE0', '#3DC4A0', '#E8705A', '#D966A8', '#9070C8', '#6A52A8'],
    font: "'Graphik', 'Inter', sans-serif",
  },
  openVizId: null,
  vegaViews: {}, // card id → vega view, for re-theming
  savedPalettes: JSON.parse(sessionStorage.getItem('savedPalettes') || '[]'),
  chartStyle: 'journeys',
};

/* ── Theme presets ───────────────────────────────────────────────────────── */
const PRESETS = {
  default: {
    bg: '#ffffff',
    palette: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    font: 'Inter',
  },
  bold: {
    bg: '#fff7f7',
    palette: ['#EF4444', '#F97316', '#FBBF24', '#84CC16', '#06B6D4', '#8B5CF6'],
    font: 'Inter',
  },
  earth: {
    bg: '#faf7f2',
    palette: ['#92400E', '#B45309', '#D97706', '#65A30D', '#047857', '#6B7280'],
    font: "'Georgia', serif",
  },
  dark: {
    bg: '#111111',
    palette: ['#CCCCCC', '#999999', '#666666', '#444444', '#EEEEEE', '#222222'],
    font: 'Inter',
  },
  journeys: {
    bg: '#EEF5FB',
    palette: ['#5BADE0', '#3DC4A0', '#E8705A', '#D966A8', '#9070C8', '#6A52A8'],
    font: "'Graphik', 'Inter', sans-serif",
  },
};

// Load custom theme from session, falling back to a copy of Default
(function () {
  const saved = sessionStorage.getItem('customTheme');
  PRESETS.custom = saved
    ? JSON.parse(saved)
    : { ...PRESETS.default, palette: [...PRESETS.default.palette] };
})();

/* ── Chart style presets ─────────────────────────────────────────────────── */
const CHART_STYLES = {
  modern:    { name:'Modern',    barRadius:5, lineSmooth:true,  lineDots:true,  areaFill:'gradient', gridScale:1,   gridDash:'',    strokeW:2.5, fontOverride:null,                     glow:false, axisLabels:true  },
  minimal:   { name:'Minimal',   barRadius:2, lineSmooth:true,  lineDots:false, areaFill:'none',     gridScale:0,   gridDash:'',    strokeW:1.5, fontOverride:null,                     glow:false, axisLabels:false },
  classic:   { name:'Classic',   barRadius:0, lineSmooth:false, lineDots:true,  areaFill:'solid',    gridScale:3,   gridDash:'',    strokeW:1.5, fontOverride:'Georgia, serif',         glow:false, axisLabels:true  },
  neon:      { name:'Neon',      barRadius:1, lineSmooth:true,  lineDots:true,  areaFill:'gradient', gridScale:1,   gridDash:'3 3', strokeW:2,   fontOverride:'"Courier New", monospace', glow:true,  axisLabels:true  },
  editorial: { name:'Editorial', barRadius:0, lineSmooth:false, lineDots:false, areaFill:'solid',    gridScale:5,   gridDash:'',    strokeW:3,   fontOverride:null,                                           glow:false, axisLabels:true  },
  journeys:  { name:'Journeys', barRadius:12, lineSmooth:true,  lineDots:true,  areaFill:'gradient', gridScale:0,   gridDash:'',    strokeW:2,   fontOverride:"'Graphik', 'Inter', sans-serif",               glow:false, axisLabels:true  },
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
    axis: compact ? {
      labels: false,
      ticks: false,
      title: null,
      domain: false,
      grid: true,
      gridColor,
    } : {
      labelFont: theme.font,
      labelColor: isDark ? '#94a3b8' : '#6B6866',
      labelFontSize: 11,
      titleFont: theme.font,
      titleColor: isDark ? '#94a3b8' : '#6B6866',
      titleFontSize: 12,
      gridColor,
      domainColor: axisColor,
      tickColor: axisColor,
    },
    legend: compact ? null : {
      labelFont: theme.font,
      labelColor: textColor,
      titleFont: theme.font,
      titleColor: textColor,
      labelFontSize: 11,
    },
    range: {
      category: theme.palette,
      ordinal: theme.palette,
    },
    mark: { color: theme.palette[0] },
    bar: { color: theme.palette[0] },
    line: { color: theme.palette[0], strokeWidth: 2 },
    point: { color: theme.palette[0], filled: true },
    arc: { innerRadius: 0 },
    area: { color: theme.palette[0], opacity: 0.7 },
    rect: { color: theme.palette[0] },
    padding: compact ? 0 : 16,
    view: { stroke: null },
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
  const w = compact ? 240 : 540;
  const h = compact ? 150 : 280;

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
      width: w, height: h,
      data: { values: [
        {category:'Product A',value:35},{category:'Product B',value:25},
        {category:'Product C',value:20},{category:'Product D',value:12},
        {category:'Other',value:8},
      ]},
      mark: {type:'arc', outerRadius: compact ? 52 : 120},
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
      width: w, height: h,
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
      width: w, height: h,
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
    'sankey-diagram': null,
    'chord-diagram': null,

    'grouped-bar-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {category:'Q1',group:'Product A',value:42},{category:'Q1',group:'Product B',value:28},{category:'Q1',group:'Product C',value:35},
        {category:'Q2',group:'Product A',value:55},{category:'Q2',group:'Product B',value:40},{category:'Q2',group:'Product C',value:30},
        {category:'Q3',group:'Product A',value:48},{category:'Q3',group:'Product B',value:52},{category:'Q3',group:'Product C',value:44},
        {category:'Q4',group:'Product A',value:70},{category:'Q4',group:'Product B',value:45},{category:'Q4',group:'Product C',value:58},
      ]},
      mark: 'bar',
      encoding: {
        x: {field:'category',type:'nominal',title:null},
        y: {field:'value',type:'quantitative',title: compact ? null : 'Revenue'},
        xOffset: {field:'group',type:'nominal'},
        color: {field:'group',type:'nominal',legend: compact ? null : {}},
      },
    },
    'stacked-bar-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {quarter:'Q1',category:'Direct',value:40},{quarter:'Q1',category:'Organic',value:25},{quarter:'Q1',category:'Paid',value:35},
        {quarter:'Q2',category:'Direct',value:45},{quarter:'Q2',category:'Organic',value:30},{quarter:'Q2',category:'Paid',value:40},
        {quarter:'Q3',category:'Direct',value:50},{quarter:'Q3',category:'Organic',value:35},{quarter:'Q3',category:'Paid',value:30},
        {quarter:'Q4',category:'Direct',value:55},{quarter:'Q4',category:'Organic',value:45},{quarter:'Q4',category:'Paid',value:50},
      ]},
      mark: 'bar',
      encoding: {
        x: {field:'quarter',type:'nominal',title:null},
        y: {field:'value',type:'quantitative',stack:true,title: compact ? null : 'Users'},
        color: {field:'category',type:'nominal',legend: compact ? null : {}},
      },
    },
    'stacked-bar-100': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {region:'North',segment:'A',value:40},{region:'North',segment:'B',value:35},{region:'North',segment:'C',value:25},
        {region:'South',segment:'A',value:20},{region:'South',segment:'B',value:50},{region:'South',segment:'C',value:30},
        {region:'East',segment:'A',value:55},{region:'East',segment:'B',value:25},{region:'East',segment:'C',value:20},
        {region:'West',segment:'A',value:30},{region:'West',segment:'B',value:40},{region:'West',segment:'C',value:30},
      ]},
      mark: 'bar',
      encoding: {
        x: {field:'region',type:'nominal',title:null},
        y: {field:'value',type:'quantitative',stack:'normalize',axis:{format:'%'},title: compact ? null : 'Share'},
        color: {field:'segment',type:'nominal',legend: compact ? null : {}},
      },
    },
    'lollipop-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {country:'Norway',value:0.961},{country:'Ireland',value:0.955},{country:'Switzerland',value:0.950},
        {country:'Hong Kong',value:0.949},{country:'Iceland',value:0.945},{country:'Germany',value:0.942},
        {country:'Sweden',value:0.937},{country:'Australia',value:0.930},
      ]},
      layer: [
        {mark: {type:'rule',strokeWidth:1.5}, encoding:{
          y: {field:'country',type:'nominal',sort:'-x',title:null,axis:{labelFontSize: compact ? 8 : 11}},
          x: {field:'value',type:'quantitative',scale:{domain:[0.92,0.97]},title: compact ? null : 'HDI'},
          x2: {value: 0},
        }},
        {mark: {type:'point',filled:true,size: compact ? 40 : 80}, encoding:{
          y: {field:'country',type:'nominal',sort:'-x',title:null},
          x: {field:'value',type:'quantitative'},
        }},
      ],
    },
    'dumbbell-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {role:'Engineer',before:95,after:112},{role:'Designer',before:78,after:88},
        {role:'Manager',before:105,after:130},{role:'Analyst',before:70,after:82},
        {role:'Director',before:140,after:165},{role:'Sales',before:72,after:90},
      ]},
      layer: [
        {mark:{type:'rule',strokeWidth:2,opacity:0.4}, encoding:{
          y:{field:'role',type:'nominal',title:null,axis:{labelFontSize: compact ? 8 : 11}},
          x:{field:'before',type:'quantitative',title: compact ? null : 'Salary (k)'},
          x2:{field:'after'},
        }},
        {mark:{type:'point',filled:true,size: compact ? 40 : 70,opacity:1}, encoding:{
          y:{field:'role',type:'nominal',title:null},
          x:{field:'before',type:'quantitative'},
          color:{value:'#94a3b8'},
        }},
        {mark:{type:'point',filled:true,size: compact ? 40 : 70,opacity:1}, encoding:{
          y:{field:'role',type:'nominal',title:null},
          x:{field:'after',type:'quantitative'},
        }},
      ],
    },
    'slope-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {item:'Alpha',year:'2020',value:3},{item:'Alpha',year:'2024',value:1},
        {item:'Beta',year:'2020',value:1},{item:'Beta',year:'2024',value:4},
        {item:'Gamma',year:'2020',value:5},{item:'Gamma',year:'2024',value:2},
        {item:'Delta',year:'2020',value:2},{item:'Delta',year:'2024',value:5},
        {item:'Epsilon',year:'2020',value:4},{item:'Epsilon',year:'2024',value:3},
      ]},
      mark: {type:'line', point:true, strokeWidth:2},
      encoding: {
        x: {field:'year',type:'ordinal',title:null},
        y: {field:'value',type:'quantitative',sort:'descending',title: compact ? null : 'Rank',axis:{tickMinStep:1}},
        color: {field:'item',type:'nominal',legend: compact ? null : {}},
        detail: {field:'item',type:'nominal'},
      },
    },
    'donut-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {category:'Direct',value:38},{category:'Organic',value:27},
        {category:'Paid',value:20},{category:'Referral',value:15},
      ]},
      mark: {type:'arc', innerRadius: compact ? 30 : 70, outerRadius: compact ? 52 : 120},
      encoding: {
        theta: {field:'value',type:'quantitative'},
        color: {field:'category',type:'nominal',legend: compact ? null : {}},
      },
    },
    'sunburst-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {outer:'Engineering',inner:'Frontend',value:30},
        {outer:'Engineering',inner:'Backend',value:40},
        {outer:'Engineering',inner:'DevOps',value:20},
        {outer:'Product',inner:'Design',value:25},
        {outer:'Product',inner:'Research',value:15},
        {outer:'Operations',inner:'Finance',value:20},
        {outer:'Operations',inner:'HR',value:18},
      ]},
      mark: {type:'arc', outerRadius: compact ? 52 : 120, innerRadius: compact ? 20 : 50},
      encoding: {
        theta: {field:'value',type:'quantitative'},
        color: {field:'outer',type:'nominal',legend: compact ? null : {}},
        radius: {field:'outer',type:'nominal',scale:{range: compact ? [20,52] : [50,120]}},
      },
    },
    'waterfall-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const items = [
          {label:'Revenue',value:500,type:'total'},
          {label:'COGS',value:-180,type:'negative'},
          {label:'Gross Profit',value:320,type:'subtotal'},
          {label:'Salaries',value:-120,type:'negative'},
          {label:'Marketing',value:-60,type:'negative'},
          {label:'Net Profit',value:140,type:'total'},
        ];
        let running = 0;
        return items.map(d => {
          const start = d.type === 'total' || d.type === 'subtotal' ? 0 : running;
          const end = d.type === 'total' || d.type === 'subtotal' ? d.value : running + d.value;
          running = end;
          return {...d, start, end};
        });
      })()},
      mark: 'bar',
      encoding: {
        x: {field:'label',type:'nominal',sort:null,title:null,axis:{labelAngle: compact ? -30 : 0, labelFontSize: compact ? 8 : 11}},
        y: {field:'start',type:'quantitative',title: compact ? null : 'Value'},
        y2: {field:'end'},
        color: {field:'type',type:'nominal',scale:{domain:['total','subtotal','negative'],range:['#64748b','#94a3b8','#ef4444']},legend:null},
      },
    },
    'gantt-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {task:'Research',start:0,end:3},{task:'Design',start:2,end:6},
        {task:'Development',start:5,end:12},{task:'Testing',start:10,end:14},
        {task:'Launch',start:13,end:15},{task:'Review',start:14,end:16},
      ]},
      mark: {type:'bar', cornerRadius:3},
      encoding: {
        y: {field:'task',type:'nominal',sort:null,title:null,axis:{labelFontSize: compact ? 8 : 11}},
        x: {field:'start',type:'quantitative',title: compact ? null : 'Week'},
        x2: {field:'end'},
        color: {field:'task',type:'nominal',legend:null},
      },
    },
    'bullet-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {metric:'Revenue',actual:78,target:90,poor:50,ok:75,good:100},
        {metric:'NPS',actual:62,target:70,poor:40,ok:60,good:80},
        {metric:'Retention',actual:88,target:85,poor:60,ok:80,good:95},
        {metric:'Growth',actual:45,target:55,poor:30,ok:50,good:70},
      ]},
      layer: [
        {mark:{type:'bar',opacity:0.15,color:'#94a3b8'}, encoding:{
          y:{field:'metric',type:'nominal',title:null,axis:{labelFontSize: compact ? 8 : 11}},
          x:{field:'good',type:'quantitative',title: compact ? null : 'Score'},
        }},
        {mark:{type:'bar',opacity:0.5,color:'#94a3b8'}, encoding:{
          y:{field:'metric',type:'nominal'},
          x:{field:'ok',type:'quantitative'},
        }},
        {mark:{type:'bar',height: compact ? 8 : 14}, encoding:{
          y:{field:'metric',type:'nominal'},
          x:{field:'actual',type:'quantitative'},
        }},
        {mark:{type:'tick',thickness:2,size: compact ? 12 : 20,color:'#1A1816'}, encoding:{
          y:{field:'metric',type:'nominal'},
          x:{field:'target',type:'quantitative'},
        }},
      ],
    },
    'dot-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {country:'Japan',value:84.3},{country:'Switzerland',value:83.4},{country:'South Korea',value:82.7},
        {country:'Australia',value:82.6},{country:'Spain',value:82.4},{country:'France',value:81.9},
        {country:'Sweden',value:81.8},{country:'Canada',value:81.4},{country:'UK',value:80.9},{country:'USA',value:78.5},
      ]},
      mark: {type:'point', filled:true, size: compact ? 50 : 90},
      encoding: {
        y: {field:'country',type:'nominal',sort:'-x',title:null,axis:{labelFontSize: compact ? 8 : 11}},
        x: {field:'value',type:'quantitative',scale:{domain:[77,85]},title: compact ? null : 'Life Expectancy'},
      },
    },
    'strip-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const depts = ['Engineering','Design','Marketing','Sales'];
        return depts.flatMap(d => Array.from({length:20},() => ({
          dept: d,
          value: Math.round(60 + Math.random()*40 + (d==='Engineering'?10:0)),
        })));
      })()},
      mark: {type:'tick', thickness:1.5, opacity:0.6},
      encoding: {
        x: {field:'value',type:'quantitative',title: compact ? null : 'Score'},
        y: {field:'dept',type:'nominal',title:null,axis:{labelFontSize: compact ? 8 : 11}},
        color: {field:'dept',type:'nominal',legend:null},
      },
    },
    'beeswarm-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const groups = ['Junior','Mid','Senior','Lead'];
        return groups.flatMap(g => Array.from({length:15},(_,i) => ({
          level: g,
          salary: Math.round(50 + ['Junior','Mid','Senior','Lead'].indexOf(g)*25 + (Math.random()-0.5)*20),
          jitter: (i % 5 - 2) * (compact ? 4 : 8),
        })));
      })()},
      mark: {type:'point', filled:true, opacity:0.7, size: compact ? 25 : 50},
      encoding: {
        x: {field:'salary',type:'quantitative',title: compact ? null : 'Salary (k)'},
        y: {field:'level',type:'nominal',title:null,axis:{labelFontSize: compact ? 8 : 11}},
        yOffset: {field:'jitter',type:'quantitative'},
        color: {field:'level',type:'nominal',legend:null},
      },
    },
    'violin-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const groups = ['Group A','Group B','Group C'];
        return groups.flatMap((g,gi) => Array.from({length:80},() => ({
          group: g,
          value: Math.round(40 + gi*15 + (Array.from({length:4},()=>Math.random()).reduce((a,b)=>a+b,0)-2)*20),
        })));
      })()},
      mark: {type:'boxplot', extent:1.5, median:{color:'white'}},
      encoding: {
        x: {field:'group',type:'nominal',title:null},
        y: {field:'value',type:'quantitative',title: compact ? null : 'Value'},
        color: {field:'group',type:'nominal',legend:null},
      },
    },
    'density-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const groups = [{name:'Group A',mean:55},{name:'Group B',mean:70}];
        return groups.flatMap(g => Array.from({length:100},() => ({
          group: g.name,
          value: g.mean + (Array.from({length:6},()=>Math.random()).reduce((a,b)=>a+b,0)-3)*12,
        })));
      })()},
      transform: [{density:'value',groupby:['group'],bandwidth:5}],
      mark: {type:'area', opacity:0.6, line:true},
      encoding: {
        x: {field:'value',type:'quantitative',title: compact ? null : 'Score'},
        y: {field:'density',type:'quantitative',title: compact ? null : 'Density'},
        color: {field:'group',type:'nominal',legend: compact ? null : {}},
      },
    },
    'ridge-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: compact ? h : h + 40,
      data: { values: (() => {
        const months = ['Jan','Mar','May','Jul','Sep','Nov'];
        return months.flatMap(m => Array.from({length:60},() => ({
          month: m,
          temp: Math.round(5 + ['Jan','Mar','May','Jul','Sep','Nov'].indexOf(m)*8 + (Math.random()-0.5)*20),
        })));
      })()},
      transform: [{density:'temp',groupby:['month'],bandwidth:3}],
      mark: {type:'area', opacity:0.7, line:{strokeWidth:1}},
      encoding: {
        x: {field:'value',type:'quantitative',title: compact ? null : 'Temperature (°C)'},
        y: {field:'density',type:'quantitative',title:null,axis:null,scale:{range:[0,compact?40:60]}},
        row: {field:'month',type:'nominal',title:null,header:{labelFontSize: compact ? 8 : 11}},
        color: {field:'month',type:'nominal',legend:null},
      },
    },
    'parallel-coordinates': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: Array.from({length:20},(_,i) => ({
        id: i,
        horsepower: Math.round(60+Math.random()*200),
        weight: Math.round(1500+Math.random()*2000),
        mpg: Math.round(15+Math.random()*35),
        price: Math.round(15+Math.random()*50),
        type: i%3===0?'A':i%3===1?'B':'C',
      }))},
      transform: [
        {fold:['horsepower','weight','mpg','price'],as:['axis','value']},
        {joinaggregate:[{op:'min',field:'value',as:'min'},{op:'max',field:'value',as:'max'}],groupby:['axis']},
        {calculate:'(datum.value - datum.min) / (datum.max - datum.min)',as:'norm'},
      ],
      mark: {type:'line', opacity:0.4, strokeWidth:1.5},
      encoding: {
        x: {field:'axis',type:'nominal',title:null,axis:{labelFontSize: compact ? 8 : 11}},
        y: {field:'norm',type:'quantitative',title:null,axis:null},
        color: {field:'type',type:'nominal',legend: compact ? null : {}},
        detail: {field:'id',type:'nominal'},
      },
    },
    'stacked-area-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const sources = ['Solar','Wind','Hydro','Gas'];
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return sources.flatMap(s => months.map((m,i) => ({
          month: m, source: s,
          value: Math.round(20 + Math.random()*30 + (s==='Solar'?Math.sin(i/11*Math.PI)*20:0)),
        })));
      })()},
      mark: {type:'area', opacity:0.8},
      encoding: {
        x: {field:'month',type:'ordinal',title:null},
        y: {field:'value',type:'quantitative',stack:true,title: compact ? null : 'GWh'},
        color: {field:'source',type:'nominal',legend: compact ? null : {}},
      },
    },
    'streamgraph': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const genres = ['Rock','Pop','Jazz','Electronic','Hip-hop'];
        const years = [2000,2005,2010,2015,2020];
        return genres.flatMap(g => years.map(y => ({
          year: y, genre: g,
          value: Math.round(10+Math.random()*60),
        })));
      })()},
      mark: {type:'area', interpolate:'monotone', opacity:0.85},
      encoding: {
        x: {field:'year',type:'ordinal',title:null},
        y: {field:'value',type:'quantitative',stack:'center',axis:null},
        color: {field:'genre',type:'nominal',legend: compact ? null : {}},
      },
    },
    'step-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {date:'Jan',rate:0.25},{date:'Feb',rate:0.25},{date:'Mar',rate:0.5},
        {date:'Apr',rate:0.5},{date:'May',rate:0.5},{date:'Jun',rate:0.75},
        {date:'Jul',rate:0.75},{date:'Aug',rate:1.0},{date:'Sep',rate:1.0},
        {date:'Oct',rate:1.25},{date:'Nov',rate:1.25},{date:'Dec',rate:1.5},
      ]},
      mark: {type:'line', interpolate:'step-after', strokeWidth:2, point:false},
      encoding: {
        x: {field:'date',type:'ordinal',title:null},
        y: {field:'rate',type:'quantitative',title: compact ? null : 'Rate (%)'},
      },
    },
    'connected-scatter-plot': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {year:2000,gdp:36,life:77},{year:2003,gdp:39,life:77.5},{year:2006,gdp:45,life:78},
        {year:2009,gdp:46,life:78.4},{year:2012,gdp:51,life:78.8},{year:2015,gdp:56,life:79.1},
        {year:2018,gdp:62,life:79.4},{year:2021,gdp:63,life:79.1},{year:2023,gdp:68,life:79.7},
      ]},
      layer: [
        {mark:{type:'line',color:'#94a3b8',strokeWidth:1.5}, encoding:{
          x:{field:'gdp',type:'quantitative',title: compact ? null : 'GDP per capita ($k)'},
          y:{field:'life',type:'quantitative',scale:{domain:[76,81]},title: compact ? null : 'Life Expectancy'},
        }},
        {mark:{type:'point',filled:true,size: compact ? 40 : 70}, encoding:{
          x:{field:'gdp',type:'quantitative'},
          y:{field:'life',type:'quantitative'},
          color:{field:'year',type:'ordinal',scale:{scheme:'viridis'},legend: compact ? null : {title:'Year'}},
        }},
      ],
    },
    'bump-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {team:'Alpha',year:2020,rank:1},{team:'Alpha',year:2021,rank:2},{team:'Alpha',year:2022,rank:1},{team:'Alpha',year:2023,rank:3},
        {team:'Beta',year:2020,rank:3},{team:'Beta',year:2021,rank:1},{team:'Beta',year:2022,rank:4},{team:'Beta',year:2023,rank:2},
        {team:'Gamma',year:2020,rank:2},{team:'Gamma',year:2021,rank:4},{team:'Gamma',year:2022,rank:2},{team:'Gamma',year:2023,rank:1},
        {team:'Delta',year:2020,rank:4},{team:'Delta',year:2021,rank:3},{team:'Delta',year:2022,rank:3},{team:'Delta',year:2023,rank:4},
      ]},
      mark: {type:'line',point:true,strokeWidth:2,interpolate:'monotone'},
      encoding: {
        x: {field:'year',type:'ordinal',title:null},
        y: {field:'rank',type:'ordinal',sort:'ascending',title: compact ? null : 'Rank',axis:{tickMinStep:1}},
        color: {field:'team',type:'nominal',legend: compact ? null : {}},
        detail: {field:'team',type:'nominal'},
      },
    },
    'span-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {month:'Jan',low:2,high:8},{month:'Feb',low:3,high:10},{month:'Mar',low:7,high:15},
        {month:'Apr',low:11,high:19},{month:'May',low:15,high:23},{month:'Jun',low:19,high:27},
        {month:'Jul',low:21,high:29},{month:'Aug',low:21,high:28},{month:'Sep',low:17,high:24},
        {month:'Oct',low:11,high:18},{month:'Nov',low:6,high:12},{month:'Dec',low:3,high:8},
      ]},
      mark: {type:'bar', cornerRadius:3},
      encoding: {
        x: {field:'month',type:'ordinal',title:null,sort:null},
        y: {field:'low',type:'quantitative',title: compact ? null : 'Temperature (°C)'},
        y2: {field:'high'},
      },
    },
    'calendar-heatmap': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const weeks = Array.from({length: compact ? 12 : 20}, (_,i) => `W${i+1}`);
        return days.flatMap(d => weeks.map(w => ({
          day:d, week:w,
          commits: Math.random() < 0.3 ? 0 : Math.round(Math.random()*12),
        })));
      })()},
      mark: {type:'rect', cornerRadius:2},
      encoding: {
        x: {field:'week',type:'ordinal',title:null,axis:{labelFontSize: compact ? 7 : 10, labelAngle:-45}},
        y: {field:'day',type:'ordinal',sort:null,title:null,axis:{labelFontSize: compact ? 8 : 11}},
        color: {field:'commits',type:'quantitative',scale:{scheme:'greens'},legend: compact ? null : {title:'Commits'}},
      },
    },
    'network-graph': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        // Approximation: scatter plot styled as network nodes
        const nodes = ['API','Auth','DB','Cache','UI','Queue','Worker','Logger'].map((n,i)=>({
          name:n, x:Math.cos(i/8*2*Math.PI)*40+50, y:Math.sin(i/8*2*Math.PI)*40+50, size:20+Math.random()*30,
        }));
        return nodes;
      })()},
      mark: {type:'point',filled:true,opacity:0.85},
      encoding: {
        x: {field:'x',type:'quantitative',axis:null,scale:{domain:[0,100]}},
        y: {field:'y',type:'quantitative',axis:null,scale:{domain:[0,100]}},
        size: {field:'size',type:'quantitative',legend:null,scale:{range:[compact?100:200,compact?500:1200]}},
        color: {field:'name',type:'nominal',legend:null},
      },
    },
    'word-cloud': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {word:'Design',freq:95},{word:'Data',freq:82},{word:'Product',freq:78},{word:'User',freq:71},
        {word:'Strategy',freq:60},{word:'Analytics',freq:55},{word:'Growth',freq:48},{word:'Team',freq:42},
        {word:'Launch',freq:38},{word:'Research',freq:35},{word:'Metrics',freq:30},{word:'Revenue',freq:28},
      ]},
      mark: {type:'text', baseline:'middle'},
      encoding: {
        x: {field:'freq',type:'quantitative',axis:null,scale:{domain:[0,100]}},
        y: {field:'word',type:'nominal',axis:null,sort:'-x'},
        size: {field:'freq',type:'quantitative',scale:{range: compact ? [8,18] : [12,36]},legend:null},
        color: {field:'freq',type:'quantitative',scale:{scheme:'viridis'},legend:null},
        text: {field:'word',type:'nominal'},
      },
    },
    'pictogram': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: Array.from({length:50},(_,i)=>({x:i%10, y:Math.floor(i/10), filled: i < 37}))},
      mark: {type:'point', shape:'circle', filled:true, size: compact ? 80 : 160},
      encoding: {
        x: {field:'x',type:'ordinal',axis:null},
        y: {field:'y',type:'ordinal',axis:null,sort:'descending'},
        color: {field:'filled',type:'nominal',scale:{range:['#E4E2DE','#3B82F6']},legend:null},
      },
    },
    'proportional-symbol-map': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {city:'London',x:50,y:62,pop:9},
        {city:'Paris',x:52,y:58,pop:11},{city:'Berlin',x:58,y:60,pop:7},
        {city:'Madrid',x:44,y:52,pop:6},{city:'Rome',x:56,y:52,pop:4},
        {city:'Warsaw',x:64,y:62,pop:5},{city:'Amsterdam',x:50,y:64,pop:3},
        {city:'Vienna',x:60,y:58,pop:4},{city:'Brussels',x:50,y:62,pop:2},
      ]},
      mark: {type:'point',filled:true,opacity:0.6},
      encoding: {
        x: {field:'x',type:'quantitative',axis:null,scale:{domain:[40,70]}},
        y: {field:'y',type:'quantitative',axis:null,scale:{domain:[48,68]}},
        size: {field:'pop',type:'quantitative',scale:{range: compact ? [50,600] : [100,2000]},legend:null},
        color: {value:'#3B82F6'},
        tooltip: [{field:'city',type:'nominal'},{field:'pop',type:'quantitative',title:'Pop (M)'}],
      },
    },
    'choropleth-map': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        // Proxy: use a heatmap-style grid to suggest a geographic map
        return Array.from({length: compact ? 40 : 70},(_,i)=>({
          x: i % (compact ? 8 : 10), y: Math.floor(i/(compact ? 8 : 10)),
          value: Math.round(Math.random()*100),
        }));
      })()},
      mark: {type:'rect'},
      encoding: {
        x: {field:'x',type:'ordinal',axis:null},
        y: {field:'y',type:'ordinal',axis:null},
        color: {field:'value',type:'quantitative',scale:{scheme:'orangered'},legend: compact ? null : {title:'Rate'}},
      },
    },
    'marimekko-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {segment:'Enterprise',company:'Alpha',share:50,segSize:0.4},
        {segment:'Enterprise',company:'Beta',share:30,segSize:0.4},
        {segment:'Enterprise',company:'Other',share:20,segSize:0.4},
        {segment:'SMB',company:'Alpha',share:35,segSize:0.35},
        {segment:'SMB',company:'Beta',share:40,segSize:0.35},
        {segment:'SMB',company:'Other',share:25,segSize:0.35},
        {segment:'Consumer',company:'Alpha',share:20,segSize:0.25},
        {segment:'Consumer',company:'Beta',share:25,segSize:0.25},
        {segment:'Consumer',company:'Other',share:55,segSize:0.25},
      ]},
      mark: 'bar',
      encoding: {
        x: {field:'segment',type:'nominal',title:null,axis:{labelFontSize: compact ? 8 : 11}},
        y: {field:'share',type:'quantitative',stack:'normalize',axis:{format:'%'},title: compact ? null : 'Share'},
        color: {field:'company',type:'nominal',legend: compact ? null : {}},
      },
    },
    'error-bar-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {method:'Control',mean:72,lo:65,hi:79},{method:'Method A',mean:81,lo:75,hi:87},
        {method:'Method B',mean:68,lo:60,hi:76},{method:'Method C',mean:88,lo:83,hi:93},
        {method:'Method D',mean:75,lo:67,hi:83},
      ]},
      layer: [
        {mark:{type:'bar',opacity:0.7}, encoding:{
          x:{field:'method',type:'nominal',title:null,axis:{labelFontSize: compact ? 8 : 10}},
          y:{field:'lo',type:'quantitative',title: compact ? null : 'Score'},
          y2:{field:'hi'},
        }},
        {mark:{type:'tick',color:'white',thickness:2,size: compact ? 12 : 20}, encoding:{
          x:{field:'method',type:'nominal'},
          y:{field:'mean',type:'quantitative'},
        }},
      ],
    },
    'candlestick-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        let price = 100;
        return Array.from({length: compact ? 12 : 20}, (_,i) => {
          const open = price;
          const change = (Math.random()-0.45)*8;
          const close = Math.round((price + change)*10)/10;
          const high = Math.max(open,close) + Math.random()*3;
          const low = Math.min(open,close) - Math.random()*3;
          price = close;
          return {day: i+1, open, close, high, low, up: close >= open};
        });
      })()},
      layer: [
        {mark:{type:'rule'}, encoding:{
          x:{field:'day',type:'ordinal',title:null,axis:{labelFontSize: compact ? 8 : 11}},
          y:{field:'low',type:'quantitative',title: compact ? null : 'Price'},
          y2:{field:'high'},
          color:{field:'up',type:'nominal',scale:{domain:[true,false],range:['#10b981','#ef4444']},legend:null},
        }},
        {mark:{type:'bar'}, encoding:{
          x:{field:'day',type:'ordinal'},
          y:{field:'open',type:'quantitative'},
          y2:{field:'close'},
          color:{field:'up',type:'nominal',scale:{domain:[true,false],range:['#10b981','#ef4444']},legend:null},
        }},
      ],
    },
    'gauge-chart': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: [
        {category:'Used',value:73},{category:'Remaining',value:27},
      ]},
      mark: {type:'arc', innerRadius: compact ? 30 : 70, outerRadius: compact ? 52 : 120, theta2: {expr:'PI'}},
      encoding: {
        theta: {field:'value',type:'quantitative',stack:true},
        color: {field:'category',type:'nominal',scale:{domain:['Used','Remaining'],range:['#3B82F6','#E4E2DE']},legend:null},
      },
      view: {stroke:null},
    },
    'sparkline': {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: w, height: h,
      data: { values: (() => {
        const tickers = ['AAPL','MSFT','GOOG','AMZN'];
        return tickers.flatMap(t => Array.from({length:7},(_,i)=>({
          ticker:t, day:i,
          value: 100 + (Math.random()-0.45)*15 * (i+1),
        })));
      })()},
      mark: {type:'line', strokeWidth:1.5},
      encoding: {
        x: {field:'day',type:'ordinal',title:null,axis:null},
        y: {field:'value',type:'quantitative',title:null,axis:null},
        color: {field:'ticker',type:'nominal',legend: compact ? null : {}},
        row: {field:'ticker',type:'nominal',title:null,header:{labelFontSize: compact ? 8 : 11, labelAlign:'left'}},
      },
    },
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
const recData  = $('rec-data');
const recGoal  = $('rec-goal');
const recReset = $('rec-reset');
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
const colorBg = $('color-bg');
const colorBgHex = $('color-bg-hex');
const fontSelect = $('font-select');
const paletteSwatches = $('palette-swatches');
const addPaletteColor = $('add-palette-color');

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
if (sidebar) {
  sidebar.addEventListener('click', e => {
    if (sidebar.classList.contains('sidebar--collapsed')) {
      sidebar.classList.remove('sidebar--collapsed');
      document.body.classList.add('sidebar-open');
    } else if (e.target === sidebarToggle || sidebarToggle.contains(e.target)) {
      sidebar.classList.add('sidebar--collapsed');
      document.body.classList.remove('sidebar-open');
    }
  });

  document.addEventListener('click', e => {
    if (!sidebar.classList.contains('sidebar--collapsed') && !sidebar.contains(e.target)) {
      sidebar.classList.add('sidebar--collapsed');
      document.body.classList.remove('sidebar-open');
    }
  });
}

/* ── Chart recommender mapping ───────────────────────────────────────────── */
// Keys: '<dataStructure>:<goal>' → ordered array of vizIds
const CHART_RECOMMENDATIONS = {
  // A single number
  'single:compare':       ['gauge-chart', 'bullet-chart', 'sparkline'],
  'single:change':        ['sparkline', 'line-chart'],
  'single:composition':   ['waffle-chart', 'pictogram'],
  'single:ranking':       ['bullet-chart', 'gauge-chart'],
  'single:distribution':  [],
  'single:relationships': [],
  'single:geographic':    ['choropleth-map'],
  'single:movement':      [],

  // One value for each category
  'per_cat:compare':      ['bar-chart', 'grouped-bar-chart', 'lollipop-chart', 'dot-plot', 'bullet-chart', 'error-bar-chart', 'data-table'],
  'per_cat:change':       ['slope-chart', 'dumbbell-chart', 'bump-chart'],
  'per_cat:distribution': ['strip-plot', 'beeswarm-plot', 'dot-plot'],
  'per_cat:relationships':['heatmap', 'scatter-plot', 'data-table'],
  'per_cat:composition':  ['pie-chart', 'donut-chart', 'waffle-chart', 'marimekko-chart'],
  'per_cat:ranking':      ['bar-chart', 'lollipop-chart', 'dot-plot', 'bump-chart'],
  'per_cat:geographic':   ['choropleth-map', 'proportional-symbol-map'],
  'per_cat:movement':     [],

  // Values over time
  'over_time:compare':      ['line-chart', 'bar-chart', 'area-chart'],
  'over_time:change':       ['line-chart', 'area-chart', 'step-chart', 'sparkline', 'candlestick-chart'],
  'over_time:distribution': ['calendar-heatmap', 'ridge-plot'],
  'over_time:relationships':['connected-scatter-plot', 'scatter-plot'],
  'over_time:composition':  ['area-chart', 'stacked-area-chart'],
  'over_time:ranking':      ['bump-chart', 'slope-chart'],
  'over_time:geographic':   ['choropleth-map'],
  'over_time:movement':     ['gantt-chart', 'waterfall-chart'],

  // Several series over time
  'series_time:compare':      ['line-chart', 'grouped-bar-chart', 'slope-chart', 'bump-chart', 'data-table'],
  'series_time:change':       ['line-chart', 'stacked-area-chart', 'streamgraph', 'area-chart'],
  'series_time:distribution': ['heatmap', 'ridge-plot', 'calendar-heatmap'],
  'series_time:relationships':['heatmap', 'parallel-coordinates'],
  'series_time:composition':  ['stacked-bar-chart', 'stacked-bar-100', 'stacked-area-chart', 'streamgraph'],
  'series_time:ranking':      ['bump-chart', 'slope-chart'],
  'series_time:geographic':   ['choropleth-map'],
  'series_time:movement':     ['streamgraph', 'sankey-diagram'],

  // A spread of numeric values
  'spread:compare':      ['box-plot', 'violin-plot', 'strip-plot', 'beeswarm-plot', 'error-bar-chart'],
  'spread:change':       ['ridge-plot'],
  'spread:distribution': ['histogram', 'box-plot', 'violin-plot', 'density-plot', 'strip-plot', 'beeswarm-plot', 'ridge-plot'],
  'spread:relationships':['scatter-plot', 'connected-scatter-plot', 'density-plot'],
  'spread:composition':  ['histogram', 'waffle-chart'],
  'spread:ranking':      ['strip-plot', 'dot-plot'],
  'spread:geographic':   [],
  'spread:movement':     [],

  // Two numeric variables
  'two_num:compare':      ['scatter-plot', 'bubble-chart', 'dumbbell-chart', 'data-table'],
  'two_num:change':       ['connected-scatter-plot', 'scatter-plot'],
  'two_num:distribution': ['scatter-plot', 'density-plot', 'heatmap'],
  'two_num:relationships':['scatter-plot', 'bubble-chart', 'connected-scatter-plot', 'heatmap'],
  'two_num:composition':  ['marimekko-chart'],
  'two_num:ranking':      ['scatter-plot', 'dot-plot'],
  'two_num:geographic':   ['proportional-symbol-map'],
  'two_num:movement':     ['connected-scatter-plot'],

  // Parts of a whole
  'parts:compare':      ['stacked-bar-100', 'marimekko-chart', 'treemap'],
  'parts:change':       ['stacked-area-chart', 'stacked-bar-chart'],
  'parts:distribution': ['treemap', 'marimekko-chart'],
  'parts:relationships':['chord-diagram', 'sankey-diagram'],
  'parts:composition':  ['pie-chart', 'donut-chart', 'stacked-bar-chart', 'stacked-bar-100', 'treemap', 'waffle-chart', 'marimekko-chart', 'sunburst-chart'],
  'parts:ranking':      ['treemap', 'marimekko-chart'],
  'parts:geographic':   ['choropleth-map', 'proportional-symbol-map'],
  'parts:movement':     ['sankey-diagram'],

  // Values by location
  'location:compare':      ['choropleth-map', 'proportional-symbol-map'],
  'location:change':       ['choropleth-map'],
  'location:distribution': ['choropleth-map', 'proportional-symbol-map'],
  'location:relationships':['proportional-symbol-map'],
  'location:composition':  ['choropleth-map'],
  'location:ranking':      ['choropleth-map', 'proportional-symbol-map'],
  'location:geographic':   ['choropleth-map', 'proportional-symbol-map'],
  'location:movement':     ['sankey-diagram'],

  // Hierarchy
  'hierarchy:compare':      ['treemap', 'sunburst-chart'],
  'hierarchy:change':       [],
  'hierarchy:distribution': ['treemap'],
  'hierarchy:relationships':['network-graph'],
  'hierarchy:composition':  ['treemap', 'sunburst-chart'],
  'hierarchy:ranking':      ['treemap'],
  'hierarchy:geographic':   [],
  'hierarchy:movement':     ['network-graph'],

  // Flow between things
  'flow:compare':      ['sankey-diagram', 'waterfall-chart', 'funnel-chart'],
  'flow:change':       ['waterfall-chart', 'gantt-chart'],
  'flow:distribution': [],
  'flow:relationships':['chord-diagram', 'network-graph'],
  'flow:composition':  ['sankey-diagram', 'funnel-chart'],
  'flow:ranking':      ['funnel-chart'],
  'flow:geographic':   [],
  'flow:movement':     ['sankey-diagram', 'chord-diagram', 'network-graph', 'funnel-chart'],
};

/* ── Load catalog ────────────────────────────────────────────────────────── */
async function loadCatalog() {
  showSkeletons();
  const res = await fetch('data/catalog.json?v=45');
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
  syncStyleBtnColors();
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
    filterRow.appendChild(btn);
  });
}

// Single delegated listener handles all pills including "All"
filterRow.addEventListener('click', e => {
  const pill = e.target.closest('.filter-pill');
  if (pill) setFilter(pill.dataset.filter);
});

function setFilter(tag) {
  state.activeFilter = tag;
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.filter === tag);
  });
  runSearch();
}

/* ── Recommender ─────────────────────────────────────────────────────────── */
recData.addEventListener('change', () => {
  state.dataStructure = recData.value;
  recData.classList.toggle('has-value', !!recData.value);
  recReset.hidden = !state.dataStructure && !state.goal;
  runSearch();
});

recGoal.addEventListener('change', () => {
  state.goal = recGoal.value;
  recGoal.classList.toggle('has-value', !!recGoal.value);
  recReset.hidden = !state.dataStructure && !state.goal;
  runSearch();
});

recReset.addEventListener('click', () => {
  recData.value = '';
  recGoal.value = '';
  recData.classList.remove('has-value');
  recGoal.classList.remove('has-value');
  state.dataStructure = '';
  state.goal = '';
  recReset.hidden = true;
  runSearch();
});

function runSearch() {
  let results;

  if (state.dataStructure && state.goal) {
    const key = `${state.dataStructure}:${state.goal}`;
    const ids = CHART_RECOMMENDATIONS[key] || [];
    results = ids.map(id => state.catalog.find(v => v.id === id)).filter(Boolean);
    filterRow.hidden = true;
  } else {
    results = state.catalog;
    if (state.activeFilter !== 'all') {
      results = results.filter(v => v.tags.includes(state.activeFilter));
    }
    filterRow.hidden = false;
  }

  renderGrid(results, { recommended: !!(state.dataStructure && state.goal) });
}

/* ── Grid rendering ──────────────────────────────────────────────────────── */
function renderGrid(items, { recommended = false } = {}) {
  state.vegaViews = {};
  vizGrid.innerHTML = '';

  if (!items.length) {
    const msg = recommended
      ? 'No charts match this combination — try a different goal.'
      : 'No charts found';
    const sub = recommended ? '' : 'Try a different filter.';
    vizGrid.innerHTML = `
      <div class="empty-state">
        <strong>${msg}</strong>
        ${sub}
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
      ${viz.builderReady ? '<div class="build-badge">Build</div>' : ''}
      <div class="viz-card-preview" id="preview-${viz.id}"></div>
      <div class="viz-card-body">
        <div class="viz-card-name">${viz.name}</div>
        <div class="viz-card-desc">${viz.description}</div>
        <div class="viz-card-tags">${tagPills}</div>
      </div>
    `;

    card.addEventListener('click', () => openModal(viz.id));
    vizGrid.appendChild(card);

    renderCardChart(viz.id);
  });
}

function renderCardChart(vizId) {
  const container = document.getElementById(`preview-${vizId}`);
  if (!container) return;
  container.style.background = state.theme.bg;
  if (!renderCustomChart(vizId, container, state.theme)) {
    container.innerHTML = getPreviewSVG(vizId, state.theme);
  }
  state.vegaViews[vizId] = true;
}

function getPreviewSVG(vizId, theme) {
  const p = theme.palette;
  const c = i => p[i % p.length];
  const W = 200, H = 130;

  function arc(cx, cy, r, a1, a2, inner = 0) {
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const lg = (a2 - a1) > Math.PI ? 1 : 0;
    if (inner > 0) {
      const ix1 = cx + inner * Math.cos(a1), iy1 = cy + inner * Math.sin(a1);
      const ix2 = cx + inner * Math.cos(a2), iy2 = cy + inner * Math.sin(a2);
      return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${ix2.toFixed(1)},${iy2.toFixed(1)} A${inner},${inner} 0 ${lg},0 ${ix1.toFixed(1)},${iy1.toFixed(1)} Z`;
    }
    return `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
  }

  function pieSlices(cx, cy, r, fracs, inner = 0) {
    let a = -Math.PI / 2;
    return fracs.map((f, i) => {
      const end = a + f * 2 * Math.PI;
      const d = arc(cx, cy, r, a, end, inner);
      a = end;
      return `<path d="${d}" fill="${c(i)}"/>`;
    }).join('');
  }

  const S = {
    'bar-chart': [60,95,74,44,84,56].map((h,i) =>
      `<rect x="${15+i*29}" y="${118-h}" width="21" height="${h}" rx="3" fill="${c(0)}"/>`).join(''),

    'grouped-bar-chart': [0,1,2,3].map(g => [0,1,2].map(s => {
      const hs = [[52,75,38],[60,88,42],[70,55,34],[65,80,45]];
      return `<rect x="${15+g*47+s*14}" y="${118-hs[g][s]}" width="12" height="${hs[g][s]}" rx="2" fill="${c(s)}"/>`;
    }).join('')).join(''),

    'stacked-bar-chart': [[38,32,28],[52,22,20],[34,44,18],[46,34,16]].map((bars,g) => {
      let y = 118;
      return bars.map((h,s) => { y -= h; return `<rect x="${20+g*44}" y="${y}" width="28" height="${h}" rx="${s===0?3:0}" fill="${c(s)}"/>`; }).join('');
    }).join(''),

    'stacked-bar-100': [[40,30,20,10],[25,35,25,15],[35,28,22,15],[20,40,28,12],[30,32,25,13]].map((parts,g) => {
      const total = parts.reduce((a,b)=>a+b,0);
      let y = 118;
      return parts.map((h,s) => { const ph = Math.round(h/total*100); y -= ph; return `<rect x="${12+g*36}" y="${y}" width="24" height="${ph}" rx="${s===0?2:0}" fill="${c(s)}"/>`; }).join('');
    }).join(''),

    'histogram': [12,28,52,80,96,82,54,30,14].map((h,i) =>
      `<rect x="${12+i*20}" y="${118-h}" width="18" height="${h}" rx="2" fill="${c(0)}" opacity="${0.55+i*0.05}"/>`).join(''),

    'line-chart': `<path d="M12,98 C35,82 52,38 82,52 C106,63 118,88 144,36 C160,10 178,55 192,44" stroke="${c(0)}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

    'step-chart': `<polyline points="12,98 52,98 52,62 88,62 88,82 124,82 124,38 160,38 160,58 192,58" stroke="${c(0)}" stroke-width="3" fill="none" stroke-linecap="square"/>`,

    'area-chart': `<path d="M12,98 C35,82 52,38 82,52 C106,63 118,88 144,36 C160,10 178,55 192,44 L192,118 L12,118 Z" fill="${c(0)}" opacity="0.2"/>
      <path d="M12,98 C35,82 52,38 82,52 C106,63 118,88 144,36 C160,10 178,55 192,44" stroke="${c(0)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,

    'stacked-area-chart': `<path d="M12,118 C50,108 90,95 130,100 C158,104 175,112 192,118 Z" fill="${c(2)}" opacity="0.9"/>
      <path d="M12,105 C50,88 90,70 130,75 C158,79 175,88 192,90 L192,118 C175,112 158,104 130,100 C90,95 50,108 12,118 Z" fill="${c(1)}" opacity="0.9"/>
      <path d="M12,85 C50,58 90,32 130,48 C158,58 175,72 192,70 L192,90 C175,88 158,79 130,75 C90,70 50,88 12,105 Z" fill="${c(0)}" opacity="0.9"/>`,

    'streamgraph': `<path d="M12,75 C40,65 70,48 100,52 C130,56 160,68 192,62 L192,92 C160,96 130,84 100,80 C70,76 40,92 12,102 Z" fill="${c(2)}" opacity="0.9"/>
      <path d="M12,55 C40,48 70,32 100,36 C130,40 160,52 192,46 L192,62 C160,68 130,56 100,52 C70,48 40,65 12,75 Z" fill="${c(1)}" opacity="0.9"/>
      <path d="M12,42 C40,38 70,22 100,24 C130,26 160,38 192,34 L192,46 C160,52 130,40 100,36 C70,32 40,48 12,55 Z" fill="${c(0)}" opacity="0.9"/>`,

    'scatter-plot': [[30,85],[55,45],[75,92],[95,55],[115,38],[138,78],[158,52],[178,82],[42,62],[82,78],[122,58],[162,32]]
      .map((pt,i) => `<circle cx="${pt[0]}" cy="${pt[1]}" r="5" fill="${c(i%3)}" opacity="0.85"/>`).join(''),

    'bubble-chart': [[45,88,20],[88,52,30],[140,78,16],[168,42,26],[70,72,12]]
      .map((b,i) => `<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}" fill="${c(i)}" opacity="0.82"/>`).join(''),

    'pie-chart': pieSlices(100, 65, 52, [0.33, 0.24, 0.2, 0.13, 0.1]),
    'donut-chart': pieSlices(100, 65, 52, [0.38, 0.27, 0.2, 0.15], 26),
    'sunburst-chart': pieSlices(100,65,52,[0.45,0.3,0.25],32) + pieSlices(100,65,28,[0.25,0.2,0.2,0.15,0.1,0.1],12),

    'heatmap': (() => {
      const op = [0.2,0.5,0.8,0.6,0.3,0.9,0.4, 0.7,0.3,0.6,0.9,0.5,0.2,0.8, 0.4,0.8,0.2,0.5,0.7,0.4,0.6, 0.6,0.4,0.9,0.3,0.8,0.6,0.2];
      return op.map((v,i) => `<rect x="${16+(i%7)*26}" y="${14+Math.floor(i/7)*26}" width="20" height="20" rx="2" fill="${c(0)}" opacity="${v}"/>`).join('');
    })(),

    'treemap': `<rect x="12" y="12" width="96" height="106" rx="3" fill="${c(0)}" opacity="0.9"/>
      <rect x="116" y="12" width="72" height="54" rx="3" fill="${c(1)}" opacity="0.9"/>
      <rect x="116" y="74" width="34" height="44" rx="3" fill="${c(2)}" opacity="0.9"/>
      <rect x="154" y="74" width="34" height="44" rx="3" fill="${c(3)}" opacity="0.9"/>`,

    'box-plot': [0,1,2].map(i => {
      const x=42+i*55, lo=[90,75,82][i], hi=[22,10,18][i], q1=[72,52,65][i], q3=[40,22,32][i], med=[58,38,50][i];
      return `<line x1="${x}" y1="${lo}" x2="${x}" y2="${hi}" stroke="${c(i)}" stroke-width="1.5"/>
        <line x1="${x-10}" y1="${lo}" x2="${x+10}" y2="${lo}" stroke="${c(i)}" stroke-width="1.5"/>
        <line x1="${x-10}" y1="${hi}" x2="${x+10}" y2="${hi}" stroke="${c(i)}" stroke-width="1.5"/>
        <rect x="${x-14}" y="${q3}" width="28" height="${q1-q3}" rx="2" fill="${c(i)}" opacity="0.25" stroke="${c(i)}" stroke-width="1.5"/>
        <line x1="${x-14}" y1="${med}" x2="${x+14}" y2="${med}" stroke="${c(i)}" stroke-width="2.5"/>`;
    }).join(''),

    'funnel-chart': [[180,40],[130,30],[90,22],[50,14]].map((s,i) =>
      `<rect x="${(200-s[0])/2}" y="${12+i*28}" width="${s[0]}" height="22" rx="2" fill="${c(i)}" opacity="0.9"/>`).join(''),

    'radar-chart': (() => {
      const cx=100,cy=65,r=50,n=6, vals=[0.8,0.6,0.9,0.5,0.7,0.85];
      const pts = vals.map((v,i) => { const a=(i/n)*2*Math.PI-Math.PI/2; return `${(cx+r*v*Math.cos(a)).toFixed(1)},${(cy+r*v*Math.sin(a)).toFixed(1)}`; }).join(' ');
      const grid = [0.33,0.67,1].map(s => {
        const gp = Array.from({length:n},(_,i)=>{ const a=(i/n)*2*Math.PI-Math.PI/2; return `${(cx+r*s*Math.cos(a)).toFixed(1)},${(cy+r*s*Math.sin(a)).toFixed(1)}`; }).join(' ');
        return `<polygon points="${gp}" fill="none" stroke="${c(0)}" stroke-width="0.8" opacity="0.25"/>`;
      }).join('');
      return grid + `<polygon points="${pts}" fill="${c(0)}" opacity="0.2" stroke="${c(0)}" stroke-width="2"/>`;
    })(),

    'waffle-chart': Array.from({length:100},(_,i) => {
      const x=12+(i%10)*18, y=8+Math.floor(i/10)*12;
      return `<rect x="${x}" y="${y}" width="14" height="9" rx="1.5" fill="${c(0)}" opacity="${i<62?0.9:0.1}"/>`;
    }).join(''),

    'lollipop-chart': [60,95,72,42,80,55].map((h,i) =>
      `<line x1="${26+i*30}" y1="118" x2="${26+i*30}" y2="${118-h}" stroke="${c(0)}" stroke-width="1.5" opacity="0.4"/>
       <circle cx="${26+i*30}" cy="${118-h}" r="6" fill="${c(0)}"/>`).join(''),

    'dumbbell-chart': [0,1,2,3].map(i => {
      const y=28+i*26, x1=[30,38,25,45][i]+20, x2=[120,145,130,155][i];
      return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${c(0)}" stroke-width="2" opacity="0.3"/>
        <circle cx="${x1}" cy="${y}" r="6" fill="${c(1)}"/>
        <circle cx="${x2}" cy="${y}" r="6" fill="${c(0)}"/>`;
    }).join(''),

    'slope-chart': (() => {
      const ys = [[25,55,40,70],[45,30,70,20]];
      return `<line x1="50" y1="12" x2="50" y2="118" stroke="#999" stroke-width="1.5" opacity="0.2"/>
        <line x1="152" y1="12" x2="152" y2="118" stroke="#999" stroke-width="1.5" opacity="0.2"/>` +
        [0,1,2,3].map(i => `<line x1="50" y1="${ys[0][i]}" x2="152" y2="${ys[1][i]}" stroke="${c(i)}" stroke-width="2.5" opacity="0.85"/>
          <circle cx="50" cy="${ys[0][i]}" r="4.5" fill="${c(i)}"/>
          <circle cx="152" cy="${ys[1][i]}" r="4.5" fill="${c(i)}"/>`).join('');
    })(),

    'waterfall-chart': (() => {
      const bars = [{y:58,h:60,col:0},{y:38,h:20,col:1},{y:53,h:15,col:2},{y:23,h:30,col:1},{y:118,h:95,col:0}];
      return bars.map((b,i) =>
        `<rect x="${15+i*36}" y="${b.y-b.h}" width="25" height="${b.h}" rx="2" fill="${c(b.col)}" opacity="0.9"/>`).join('');
    })(),

    'gantt-chart': [[20,70,0],[40,55,1],[70,80,2],[35,65,0],[60,45,1]].map((b,i) =>
      `<rect x="${b[0]}" y="${14+i*22}" width="${b[1]}" height="14" rx="3" fill="${c(b[2])}" opacity="0.85"/>`).join(''),

    'bullet-chart': [0,1,2].map(i => {
      const y=25+i*36, act=[95,130,78][i], target=[88,115,105][i];
      return `<rect x="24" y="${y}" width="160" height="16" rx="2" fill="${c(0)}" opacity="0.1"/>
        <rect x="24" y="${y+3}" width="${act}" height="10" rx="2" fill="${c(0)}" opacity="0.85"/>
        <line x1="${24+target}" y1="${y-2}" x2="${24+target}" y2="${y+18}" stroke="${c(1)}" stroke-width="2.5"/>`;
    }).join(''),

    'dot-plot': [62,71,55,80,68,74,58,66,70,60,76,84,50,72,64]
      .map((v,i) => `<circle cx="${v*1.4+16}" cy="${40+i*6}" r="4" fill="${c(0)}" opacity="0.75"/>`).join(''),

    'strip-plot': [[30,45,55,38,62,42,50],[20,35,75,48,58,65,30],[40,52,68,32,55,70,44]]
      .map((pts,i) => pts.map(v => `<circle cx="${50+i*50}" cy="${v+18}" r="4" fill="${c(i)}" opacity="0.75"/>`).join('')).join(''),

    'beeswarm-plot': [[100,108],[88,96],[112,96],[76,84],[100,84],[124,84],[65,72],[88,72],[112,72],[135,72],[55,60],[80,60],[100,60],[122,60],[145,60]]
      .map(pt => `<circle cx="${pt[0]}" cy="${pt[1]}" r="5.5" fill="${c(0)}" opacity="0.8"/>`).join(''),

    'violin-plot': [0,1,2].map(i => {
      const cx=50+i*50, w=20;
      return `<path d="M${cx},18 C${cx+w},28 ${cx+w},50 ${cx+w},65 C${cx+w},80 ${cx+w},100 ${cx},110 C${cx-w},100 ${cx-w},80 ${cx-w},65 C${cx-w},50 ${cx-w},28 ${cx},18 Z" fill="${c(i)}" opacity="0.7"/>
        <line x1="${cx-13}" y1="65" x2="${cx+13}" y2="65" stroke="white" stroke-width="2" opacity="0.9"/>`;
    }).join(''),

    'density-plot': `<path d="M12,108 C30,108 48,100 65,78 C80,58 90,32 100,28 C110,32 120,58 135,78 C152,100 170,108 192,108 L192,118 L12,118 Z" fill="${c(0)}" opacity="0.2"/>
      <path d="M12,108 C30,108 48,100 65,78 C80,58 90,32 100,28 C110,32 120,58 135,78 C152,100 170,108 192,108" stroke="${c(0)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M42,108 C52,108 62,100 72,88 C82,74 88,50 95,40 L105,40 C112,50 118,74 128,88 C138,100 148,108 158,108" stroke="${c(1)}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65"/>`,

    'ridge-plot': [3,2,1,0].map(i => {
      const by=118-i*28, pk=by-40;
      return `<path d="M12,${by} C40,${by} 60,${by-12} 80,${pk} C100,${pk-14} 120,${by-8} 148,${by} C168,${by} 182,${by} 192,${by} L192,118 L12,118 Z" fill="${c(i)}" opacity="0.82"/>`;
    }).join(''),

    'parallel-coordinates': (() => {
      const ax=[40,90,140,190], lines=[[80,55,70,95],[95,30,85,60],[58,75,45,82],[78,48,92,70],[88,62,55,88]];
      return ax.map(x=>`<line x1="${x}" y1="14" x2="${x}" y2="116" stroke="#999" stroke-width="1.5" opacity="0.3"/>`).join('')
        + lines.map((pts,i)=>`<polyline points="${ax.map((x,j)=>`${x},${pts[j]}`).join(' ')}" stroke="${c(i)}" stroke-width="2" fill="none" opacity="0.7"/>`).join('');
    })(),

    'connected-scatter-plot': (() => {
      const pts=[[28,85],[52,65],[75,42],[100,60],[120,35],[148,50],[170,30],[190,50]];
      return `<path d="M${pts.map(p=>p.join(',')).join(' L')}" stroke="${c(0)}" stroke-width="2" fill="none" opacity="0.45"/>`
        + pts.map(pt=>`<circle cx="${pt[0]}" cy="${pt[1]}" r="5" fill="${c(0)}"/>`).join('');
    })(),

    'bump-chart': (() => {
      const xs=[30,100,170], rs=[[18,55,92],[55,92,18],[92,18,55]];
      return rs.map((r,i)=>`<polyline points="${xs.map((x,j)=>`${x},${r[j]}`).join(' ')}" stroke="${c(i)}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        + xs.map((x,j)=>`<circle cx="${x}" cy="${r[j]}" r="5" fill="${c(i)}"/>`).join('')).join('');
    })(),

    'span-chart': [0,1,2,3,4].map(i => {
      const x=22+i*38, lo=[78,58,82,48,68][i], hi=[28,18,38,14,22][i];
      return `<line x1="${x}" y1="${lo}" x2="${x}" y2="${hi}" stroke="${c(0)}" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="${x}" cy="${lo}" r="5" fill="${c(1)}"/>
        <circle cx="${x}" cy="${hi}" r="5" fill="${c(0)}"/>`;
    }).join(''),

    'calendar-heatmap': (() => {
      const op=[0.2,0.8,0.5,0.3,0.9,0.1,0.6,0.7,0.4,0.8,0.2,0.6,0.9,0.5,0.4,0.7,0.9,0.2,0.8,0.3,0.6,0.8,0.5,0.3,0.7,0.4,0.9,0.8,0.5,0.3,0.7,0.4,0.9,0.2,0.6,0.8,0.3,0.5,0.7,0.9,0.1,0.3,0.7,0.5,0.9,0.2,0.6,0.8,0.4,0.7,0.3,0.9,0.5,0.2,0.8,0.6,0.4,0.8,0.2,0.7,0.5,0.3,0.9,0.4,0.6,0.8,0.1,0.5,0.7,0.9,0.3,0.6,0.8,0.2,0.5,0.7,0.4,0.9,0.1,0.6,0.3,0.8,0.5,0.2,0.7,0.4,0.9,0.6,0.3,0.8,0.5,0.7,0.2,0.4,0.9,0.6];
      return op.map((v,i)=>`<rect x="${10+(i%12)*15}" y="${10+Math.floor(i/12)*22}" width="12" height="18" rx="2" fill="${c(0)}" opacity="${v}"/>`).join('');
    })(),

    'network-graph': (() => {
      const nodes=[[100,65],[50,28],[150,28],[38,92],[162,92],[100,18],[68,78],[132,78]];
      const edges=[[0,1],[0,2],[0,3],[0,4],[1,5],[1,6],[2,5],[2,7],[3,6],[4,7]];
      return edges.map(([a,b])=>`<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${c(0)}" stroke-width="1.5" opacity="0.25"/>`).join('')
        + nodes.map((n,i)=>`<circle cx="${n[0]}" cy="${n[1]}" r="${i===0?10:7}" fill="${c(i%p.length)}" opacity="0.88"/>`).join('');
    })(),

    'word-cloud': [[55,58,18],[125,50,13],[82,82,11],[148,74,9],[28,86,8],[105,100,7],[168,50,7],[42,30,6],[158,96,6],[108,26,5]]
      .map(([x,y,s],i)=>`<rect x="${x-s}" y="${y-s*0.4}" width="${s*2.5}" height="${s*0.85}" rx="${s*0.25}" fill="${c(i%3)}" opacity="0.85"/>`).join(''),

    'pictogram': Array.from({length:50},(_,i)=>
      `<circle cx="${18+(i%10)*18}" cy="${14+Math.floor(i/10)*22}" r="7" fill="${c(0)}" opacity="${i<37?0.9:0.1}"/>`).join(''),

    'proportional-symbol-map': [[50,42,22],[100,68,30],[150,38,18],[170,88,16],[65,90,24],[130,50,14],[85,28,10],[28,72,12]]
      .map((b,i)=>`<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}" fill="${c(i%3)}" opacity="0.65"/>`).join(''),

    'choropleth-map': (() => {
      const op=[0.2,0.5,0.8,0.4,0.9,0.3,0.6,0.7,0.6,0.8,0.4,0.7,0.3,0.9,0.5,0.2,0.4,0.3,0.7,0.9,0.6,0.4,0.8,0.5,0.8,0.6,0.3,0.5,0.8,0.7,0.3,0.9,0.3,0.9,0.5,0.2,0.4,0.6,0.7,0.4];
      return op.map((v,i)=>`<rect x="${12+(i%8)*23}" y="${12+Math.floor(i/8)*26}" width="19" height="20" rx="2" fill="${c(0)}" opacity="${v}"/>`).join('');
    })(),

    'marimekko-chart': (() => {
      let x=12;
      return [{w:80,s:[0.5,0.3,0.2]},{w:65,s:[0.25,0.45,0.3]},{w:55,s:[0.6,0.25,0.15]}].map(g => {
        let y=12; const rects=g.s.map((f,s)=>{ const h=Math.round(f*106); const r=`<rect x="${x}" y="${y}" width="${g.w-4}" height="${h}" rx="0" fill="${c(s)}" opacity="0.9"/>`; y+=h; return r; }).join(''); x+=g.w; return rects;
      }).join('');
    })(),

    'error-bar-chart': [0,1,2,3].map(i => {
      const x=38+i*40, h=[55,78,45,65][i], e=[15,12,18,10][i], by=118-h;
      return `<rect x="${x-12}" y="${by}" width="24" height="${h}" rx="2" fill="${c(0)}" opacity="0.8"/>
        <line x1="${x}" y1="${by-e}" x2="${x}" y2="${by+e}" stroke="${c(1)}" stroke-width="2"/>
        <line x1="${x-6}" y1="${by-e}" x2="${x+6}" y2="${by-e}" stroke="${c(1)}" stroke-width="2"/>
        <line x1="${x-6}" y1="${by+e}" x2="${x+6}" y2="${by+e}" stroke="${c(1)}" stroke-width="2"/>`;
    }).join(''),

    'candlestick-chart': [[25,85,60,45,95,true],[55,62,80,52,88,false],[85,80,55,42,88,true],[115,58,70,48,78,false],[145,72,48,38,80,true],[175,50,65,40,72,false]]
      .map(([x,o,cl,h,lo,up]) => {
        const color=up?c(0):c(1), by=Math.min(o,cl), bh=Math.abs(o-cl);
        return `<line x1="${x}" y1="${h}" x2="${x}" y2="${lo}" stroke="${color}" stroke-width="1.5"/>
          <rect x="${x-8}" y="${by}" width="16" height="${Math.max(bh,3)}" rx="1" fill="${color}"/>`;
      }).join(''),

    'gauge-chart': (() => {
      const cx=100,cy=95,r=62,inner=40, val=0.73;
      const ea = Math.PI*(1-val), ex=cx+r*Math.cos(Math.PI-val*Math.PI), ey=cy-r*Math.sin(val*Math.PI);
      const eix=cx+inner*Math.cos(Math.PI-val*Math.PI), eiy=cy-inner*Math.sin(val*Math.PI);
      return `<path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy} L${cx+inner},${cy} A${inner},${inner} 0 0,0 ${cx-inner},${cy} Z" fill="${c(0)}" opacity="0.12"/>
        <path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${ex.toFixed(1)},${ey.toFixed(1)} L${eix.toFixed(1)},${eiy.toFixed(1)} A${inner},${inner} 0 0,0 ${cx-inner},${cy} Z" fill="${c(0)}" opacity="0.9"/>`;
    })(),

    'sparkline': [[12,60,52,45,92,68,132,30,172,50,192,38],[12,88,52,75,92,90,132,65,172,80,192,70],[12,110,52,98,92,105,132,88,172,100,192,92]]
      .map((pts,i) => {
        const d='M'+Array.from({length:pts.length/2},(_,j)=>`${pts[j*2]},${pts[j*2+1]}`).join(' L');
        return `<path d="${d}" stroke="${c(i)}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }).join(''),

    'sankey-diagram': `<rect x="12" y="20" width="12" height="90" rx="2" fill="${c(0)}"/>
      <rect x="94" y="14" width="12" height="40" rx="2" fill="${c(1)}"/>
      <rect x="94" y="60" width="12" height="50" rx="2" fill="${c(2)}"/>
      <rect x="176" y="18" width="12" height="28" rx="2" fill="${c(1)}"/>
      <rect x="176" y="52" width="12" height="26" rx="2" fill="${c(0)}"/>
      <rect x="176" y="84" width="12" height="26" rx="2" fill="${c(2)}"/>
      <path d="M24,20 C58,20 60,14 94,14 L94,54 C60,54 58,50 24,50 Z" fill="${c(0)}" opacity="0.3"/>
      <path d="M24,50 C58,50 60,60 94,60 L94,110 C60,110 58,70 24,110 Z" fill="${c(1)}" opacity="0.3"/>
      <path d="M106,14 C140,14 142,18 176,18 L176,46 C142,46 140,44 106,44 Z" fill="${c(1)}" opacity="0.3"/>
      <path d="M106,44 C140,44 142,52 176,52 L176,78 C142,78 140,72 106,72 Z" fill="${c(0)}" opacity="0.3"/>
      <path d="M106,72 C140,72 142,84 176,84 L176,110 C142,110 140,100 106,100 Z" fill="${c(2)}" opacity="0.3"/>`,

    'chord-diagram': (() => {
      const cx=100,cy=65,r=50,slices=[0.28,0.24,0.24,0.24];
      let a=-Math.PI/2;
      const mids=[], arcs=slices.map((s,i)=>{
        const end=a+s*2*Math.PI*0.87;
        const x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);
        mids.push([cx+(r-5)*Math.cos((a+end)/2),cy+(r-5)*Math.sin((a+end)/2)]);
        const arc=`<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0,1 ${x2.toFixed(1)},${y2.toFixed(1)}" stroke="${c(i)}" stroke-width="8" fill="none"/>`;
        a=end+0.13*2*Math.PI; return arc;
      }).join('');
      const chords=[[0,2],[1,3],[0,1]].map(([a,b])=>`<path d="M${mids[a][0].toFixed(1)},${mids[a][1].toFixed(1)} Q${cx},${cy} ${mids[b][0].toFixed(1)},${mids[b][1].toFixed(1)}" stroke="${c(a)}" stroke-width="3" fill="none" opacity="0.45"/>`).join('');
      return arcs+chords;
    })(),
  };

  const body = S[vizId] || S['bar-chart'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}

/* ── Custom SVG chart renderer ───────────────────────────────────────────── */

function niceScale(maxVal, tickCount = 4) {
  const rawStep = (maxVal * 1.2) / tickCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const max = Math.ceil((maxVal * 1.2) / step) * step;
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v));
  return { max, ticks };
}

function fmtTick(v) {
  if (v >= 1e6) return (v / 1e6) + 'M';
  if (v >= 1e3) return (v / 1e3) + 'K';
  return String(v);
}

function chartTokens(theme) {
  const dark = isColorDark(theme.bg);
  const sty = CHART_STYLES[state.chartStyle] || CHART_STYLES.modern;
  const ch = dark ? '255,255,255' : '0,0,0';
  const gridOpacity = Math.min(0.9, (dark ? 0.06 : 0.05) * sty.gridScale).toFixed(3);
  return {
    textColor:  dark ? 'rgba(255,255,255,0.4)'  : 'rgba(0,0,0,0.32)',
    gridColor:  `rgba(${ch},${gridOpacity})`,
    baseColor:  dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)',
    font:       sty.fontOverride || ((theme.font || 'Inter') + ', sans-serif'),
    c0:         theme.palette[0],
    barRadius:  sty.barRadius,
    lineSmooth: sty.lineSmooth,
    lineDots:   sty.lineDots,
    areaFill:   sty.areaFill,
    strokeW:    sty.strokeW,
    gridDash:   sty.gridDash,
    glow:       sty.glow,
    glowSD:     sty.glowSD || 3,
    axisLabels: sty.axisLabels,
  };
}

function renderBarChartSVG(theme, inputData, options) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 40, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, barRadius, gridDash, axisLabels, glow, glowSD } = chartTokens(theme);

  const data = (inputData && inputData.length) ? inputData : [
    {l:'Apples',v:85},{l:'Oranges',v:62},{l:'Bananas',v:108},
    {l:'Grapes',v:44},{l:'Mangoes',v:77},{l:'Peaches',v:93},
  ];
  const { max, ticks } = niceScale(Math.max(...data.map(d => d.v)));
  const slot = cW / data.length;
  const bW = Math.round(slot * 0.52);
  const xMid = i => pad.left + slot * i + slot / 2;
  const yV   = v => pad.top + cH - (v / max) * cH;
  const r = barRadius;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';

  const grid = ticks.map(t => {
    const y = yV(t).toFixed(1);
    const lbl = axisLabels ? `<text x="${pad.left - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${fmtTick(t)}</text>` : '';
    return `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${t === 0 ? baseColor : gridColor}" stroke-width="1"${dash}/>${lbl}`;
  }).join('');

  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';

  const bars = data.map((d, i) => {
    const x = xMid(i) - bW / 2, y = yV(d.v), h = (d.v / max) * cH;
    const bar = r === 0 || h <= r
      ? `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bW}" height="${h.toFixed(1)}" fill="${c0}"/>`
      : `<path d="M${x.toFixed(1)},${(y+h).toFixed(1)} L${x.toFixed(1)},${(y+r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x+r).toFixed(1)},${y.toFixed(1)} L${(x+bW-r).toFixed(1)},${y.toFixed(1)} Q${(x+bW).toFixed(1)},${y.toFixed(1)} ${(x+bW).toFixed(1)},${(y+r).toFixed(1)} L${(x+bW).toFixed(1)},${(y+h).toFixed(1)} Z" fill="${c0}"/>`;
    const lbl = axisLabels ? `<text x="${xMid(i).toFixed(1)}" y="${(pad.top + cH + 16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${d.l}</text>` : '';
    return bar + lbl;
  }).join('');

  const glowAttr = glow ? ` filter="url(#${fid})"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    (filterDef ? `<defs>${filterDef}</defs>` : '') +
    `${grid}<g${glowAttr}>${bars}</g></svg>`;
}

function renderLineChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, lineSmooth, lineDots, areaFill, strokeW, gridDash, axisLabels, glow, glowSD } = chartTokens(theme);

  const data = [
    {l:'Jan',v:42},{l:'Feb',v:55},{l:'Mar',v:50},{l:'Apr',v:68},
    {l:'May',v:73},{l:'Jun',v:89},{l:'Jul',v:82},{l:'Aug',v:95},
    {l:'Sep',v:78},{l:'Oct',v:102},{l:'Nov',v:88},{l:'Dec',v:110},
  ];
  const { max, ticks } = niceScale(Math.max(...data.map(d => d.v)));
  const n = data.length;
  const xP = i => pad.left + (i / (n - 1)) * cW;
  const yP = v => pad.top + cH - (v / max) * cH;
  const pts = data.map((d, i) => [xP(i), yP(d.v)]);

  const pathD = pts.map(([x, y], i) => {
    if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
    if (!lineSmooth) return `L${x.toFixed(1)},${y.toFixed(1)}`;
    const [px, py] = pts[i - 1];
    const cx = ((px + x) / 2).toFixed(1);
    return `C${cx},${py.toFixed(1)} ${cx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const base = (pad.top + cH).toFixed(1);
  const areaD = `${pathD} L${pts[n-1][0].toFixed(1)},${base} L${pts[0][0].toFixed(1)},${base} Z`;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';

  const grid = ticks.map(t => {
    const y = yP(t).toFixed(1);
    const lbl = axisLabels ? `<text x="${pad.left - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${fmtTick(t)}</text>` : '';
    return `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${t === 0 ? baseColor : gridColor}" stroke-width="1"${dash}/>${lbl}`;
  }).join('');

  const xLabels = axisLabels ? data.map((d, i) =>
    (i % 2 !== 0 && i !== n - 1) ? '' :
    `<text x="${xP(i).toFixed(1)}" y="${(pad.top + cH + 16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${d.l}</text>`
  ).join('') : '';

  const dotsEl = lineDots ? pts.map(([x, y]) =>
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${c0}" stroke="${theme.bg}" stroke-width="2.5"/>`
  ).join('') : '';

  const gid = 'lg' + Math.random().toString(36).slice(2, 7);
  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';

  const gradDef = areaFill === 'gradient' ? `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c0}" stop-opacity="0.12"/><stop offset="100%" stop-color="${c0}" stop-opacity="0"/></linearGradient>` : '';
  const areaSVG = areaFill === 'gradient' ? `<path d="${areaD}" fill="url(#${gid})"/>` :
                  areaFill === 'solid'    ? `<path d="${areaD}" fill="${c0}" fill-opacity="0.12"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    `<defs>${gradDef}${filterDef}</defs>` +
    `${grid}${areaSVG}` +
    `<path d="${pathD}" stroke="${c0}" stroke-width="${strokeW}" fill="none" stroke-linecap="round" stroke-linejoin="round"${glowAttr}/>` +
    `${dotsEl}${xLabels}</svg>`;
}

function renderScatterChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, gridDash, axisLabels, glow, glowSD } = chartTokens(theme);
  const c1 = theme.palette[1] || c0;
  const c2 = theme.palette[2] || c1;

  const data = [
    {x:12,y:34,g:0},{x:22,y:58,g:0},{x:35,y:45,g:0},{x:48,y:72,g:0},
    {x:15,y:28,g:0},{x:60,y:85,g:0},{x:42,y:55,g:0},{x:28,y:40,g:0},
    {x:8,y:18,g:1},{x:38,y:30,g:1},{x:52,y:44,g:1},{x:70,y:60,g:1},
    {x:25,y:15,g:1},{x:44,y:52,g:1},{x:65,y:70,g:1},{x:80,y:88,g:1},
    {x:18,y:65,g:2},{x:32,y:80,g:2},{x:55,y:90,g:2},{x:72,y:78,g:2},
    {x:10,y:50,g:2},{x:45,y:95,g:2},{x:62,y:68,g:2},{x:85,y:82,g:2},
  ];
  const colors = [c0, c1, c2];
  const { ticks: yTicks } = niceScale(100, 4);
  const xTicks = [0, 25, 50, 75, 100];
  const xP = v => pad.left + (v / 100) * cW;
  const yP = v => pad.top + cH - (v / 100) * cH;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';

  const grid = yTicks.map(t => {
    const y = yP(t).toFixed(1);
    const lbl = axisLabels ? `<text x="${pad.left - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${t}</text>` : '';
    return `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${t === 0 ? baseColor : gridColor}" stroke-width="1"${dash}/>${lbl}`;
  }).join('');

  const xLabels = axisLabels ? xTicks.map(t =>
    `<text x="${xP(t).toFixed(1)}" y="${(pad.top + cH + 16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${t}</text>`
  ).join('') : '';

  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';

  const dots = data.map(d =>
    `<circle cx="${xP(d.x).toFixed(1)}" cy="${yP(d.y).toFixed(1)}" r="5" fill="${colors[d.g]}" fill-opacity="0.75" stroke="${theme.bg}" stroke-width="1.5"${glowAttr}/>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    (filterDef ? `<defs>${filterDef}</defs>` : '') +
    `${grid}${xLabels}${dots}</svg>`;
}

function renderAreaChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, lineSmooth, areaFill, strokeW, gridDash, axisLabels, glow, glowSD } = chartTokens(theme);
  const c1 = theme.palette[1] || c0;

  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const seriesA = [42,55,50,68,73,89,82,95,78,102,88,110];
  const seriesB = [28,34,45,38,52,61,57,70,65,80,72,90];
  const n = labels.length;
  const { max, ticks } = niceScale(Math.max(...seriesA));
  const xP = i => pad.left + (i / (n - 1)) * cW;
  const yP = v => pad.top + cH - (v / max) * cH;

  const makePath = data => data.map((v, i) => {
    const x = xP(i), y = yP(v);
    if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
    if (!lineSmooth) return `L${x.toFixed(1)},${y.toFixed(1)}`;
    const px = xP(i - 1), py = yP(data[i - 1]);
    const cx = ((px + x) / 2).toFixed(1);
    return `C${cx},${py.toFixed(1)} ${cx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const base = (pad.top + cH).toFixed(1);
  const pathA = makePath(seriesA);
  const pathB = makePath(seriesB);
  const areaAD = `${pathA} L${xP(n-1).toFixed(1)},${base} L${xP(0).toFixed(1)},${base} Z`;
  const areaBD = `${pathB} L${xP(n-1).toFixed(1)},${base} L${xP(0).toFixed(1)},${base} Z`;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';

  const grid = ticks.map(t => {
    const y = yP(t).toFixed(1);
    const lbl = axisLabels ? `<text x="${pad.left - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${fmtTick(t)}</text>` : '';
    return `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${t === 0 ? baseColor : gridColor}" stroke-width="1"${dash}/>${lbl}`;
  }).join('');

  const xLabels = axisLabels ? labels.map((l, i) =>
    (i % 2 !== 0 && i !== n - 1) ? '' :
    `<text x="${xP(i).toFixed(1)}" y="${(pad.top + cH + 16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${l}</text>`
  ).join('') : '';

  const gidA = 'aa' + Math.random().toString(36).slice(2, 7);
  const gidB = 'ab' + Math.random().toString(36).slice(2, 7);
  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';

  const gradDefs = areaFill === 'gradient' ?
    `<linearGradient id="${gidA}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c0}" stop-opacity="0.18"/><stop offset="100%" stop-color="${c0}" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${gidB}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c1}" stop-opacity="0.15"/><stop offset="100%" stop-color="${c1}" stop-opacity="0"/></linearGradient>` : '';

  const areaASVG = areaFill === 'gradient' ? `<path d="${areaAD}" fill="url(#${gidA})"/>` :
                   areaFill === 'solid'    ? `<path d="${areaAD}" fill="${c0}" fill-opacity="0.14"/>` : '';
  const areaBSVG = areaFill === 'gradient' ? `<path d="${areaBD}" fill="url(#${gidB})"/>` :
                   areaFill === 'solid'    ? `<path d="${areaBD}" fill="${c1}" fill-opacity="0.10"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    `<defs>${gradDefs}${filterDef}</defs>` +
    `${grid}` +
    `${areaBSVG}<path d="${pathB}" stroke="${c1}" stroke-width="${strokeW * 0.8}" fill="none" stroke-linecap="round"${glowAttr}/>` +
    `${areaASVG}<path d="${pathA}" stroke="${c0}" stroke-width="${strokeW}" fill="none" stroke-linecap="round"${glowAttr}/>` +
    `${xLabels}</svg>`;
}

function renderPieChartSVG(theme) {
  const W = 560, H = 300;
  const cx = W / 2, cy = H / 2, r = 102, lr = 122;
  const { font, glow, glowSD, axisLabels } = chartTokens(theme);
  const palette = theme.palette;

  const data = [
    {l:'Product A',v:35},{l:'Product B',v:25},{l:'Product C',v:20},
    {l:'Product D',v:12},{l:'Other',v:8},
  ];
  const total = data.reduce((s, d) => s + d.v, 0);
  let startAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.v / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const midAngle = startAngle + angle / 2;
    const lx = cx + lr * Math.cos(midAngle), ly = cy + lr * Math.sin(midAngle);
    const path = `M${cx.toFixed(1)},${cy.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
    const result = { path, color: palette[i % palette.length], lx, ly, pct: Math.round(d.v / total * 100) };
    startAngle = endAngle;
    return result;
  });

  const sliceSVG = slices.map(s => `<path d="${s.path}" fill="${s.color}" stroke="${theme.bg}" stroke-width="1"/>`).join('');
  // Outer ring: bg-coloured band covering the junction points where separator
  // lines meet the arc, giving a soft rounded outer edge. stroke-width 16 →
  // extends 8px inward, masking the harsh slice edge junctions at the rim.
  const outerRing = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="none" stroke="${theme.bg}" stroke-width="16"/>`;

  const labelsSVG = axisLabels ? slices.filter(s => s.pct >= 12).map(s => {
    const anchor = s.lx < cx - 4 ? 'end' : s.lx > cx + 4 ? 'start' : 'middle';
    return `<text x="${s.lx.toFixed(1)}" y="${(s.ly + 4).toFixed(1)}" text-anchor="${anchor}" font-size="12" font-weight="600" font-family="${font}" fill="${s.color}">${s.pct}%</text>`;
  }).join('') : '';

  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    (filterDef ? `<defs>${filterDef}</defs>` : '') +
    `<g${glowAttr}>${sliceSVG}</g>${outerRing}${labelsSVG}</svg>`;
}

function renderDonutChartSVG(theme) {
  const W = 560, H = 300;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(cx, cy) - 22, innerR = r * 0.54;
  const { font, textColor, glow, glowSD } = chartTokens(theme);
  const palette = theme.palette;

  const data = [
    {l:'Direct',v:38},{l:'Organic',v:27},{l:'Paid',v:20},{l:'Referral',v:15},
  ];
  const total = data.reduce((s, d) => s + d.v, 0);
  let startAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.v / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const ox1 = cx + r * Math.cos(startAngle),      oy1 = cy + r * Math.sin(startAngle);
    const ox2 = cx + r * Math.cos(endAngle),         oy2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle),   iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle), iy2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M${ox1.toFixed(1)},${oy1.toFixed(1)} A${r},${r} 0 ${large} 1 ${ox2.toFixed(1)},${oy2.toFixed(1)} L${ix1.toFixed(1)},${iy1.toFixed(1)} A${innerR},${innerR} 0 ${large} 0 ${ix2.toFixed(1)},${iy2.toFixed(1)} Z`;
    const result = { path, color: palette[i % palette.length] };
    startAngle = endAngle;
    return result;
  });

  const sliceSVG = slices.map(s =>
    `<path d="${s.path}" fill="${s.color}" stroke="${theme.bg}" stroke-width="2"/>`
  ).join('');

  const centerLabel =
    `<text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="22" font-weight="700" font-family="${font}" fill="${textColor}">100%</text>` +
    `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}" opacity="0.45">total</text>`;

  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    (filterDef ? `<defs>${filterDef}</defs>` : '') +
    `<g${glowAttr}>${sliceSVG}</g>${centerLabel}</svg>`;
}

function renderGroupedBarChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, barRadius, gridDash, axisLabels, glow, glowSD } = chartTokens(theme);
  const colors = [
    theme.palette[0],
    theme.palette[1] || theme.palette[0],
    theme.palette[2] || theme.palette[0],
  ];

  const groups = [
    {l:'Q1',vals:[42,28,54]},{l:'Q2',vals:[58,46,62]},
    {l:'Q3',vals:[50,38,70]},{l:'Q4',vals:[65,52,48]},
  ];
  const { max, ticks } = niceScale(Math.max(...groups.flatMap(g => g.vals)));
  const nGroups = groups.length, nBars = 3;
  const groupW = cW / nGroups;
  const gap = groupW * 0.14;
  const barW = Math.floor((groupW - gap * 2 - (nBars - 1) * 3) / nBars);
  const r = barRadius;
  const yV = v => pad.top + cH - (v / max) * cH;
  const groupX = i => pad.left + i * groupW;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';

  const grid = ticks.map(t => {
    const y = yV(t).toFixed(1);
    const lbl = axisLabels ? `<text x="${pad.left - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${fmtTick(t)}</text>` : '';
    return `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${t === 0 ? baseColor : gridColor}" stroke-width="1"${dash}/>${lbl}`;
  }).join('');

  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';

  const bars = groups.map((g, gi) => {
    const gx = groupX(gi) + gap;
    return g.vals.map((v, bi) => {
      const x = gx + bi * (barW + 3);
      const y = yV(v);
      const h = (pad.top + cH) - y;
      const path = r === 0 || h <= r
        ? `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" fill="${colors[bi]}"/>`
        : `<path d="M${x.toFixed(1)},${(y+h).toFixed(1)} L${x.toFixed(1)},${(y+r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x+r).toFixed(1)},${y.toFixed(1)} L${(x+barW-r).toFixed(1)},${y.toFixed(1)} Q${(x+barW).toFixed(1)},${y.toFixed(1)} ${(x+barW).toFixed(1)},${(y+r).toFixed(1)} L${(x+barW).toFixed(1)},${(y+h).toFixed(1)} Z" fill="${colors[bi]}"/>`;
      return path;
    }).join('');
  }).join('');

  const xLabels = axisLabels ? groups.map((g, i) => {
    const gxc = (groupX(i) + groupW / 2).toFixed(1);
    return `<text x="${gxc}" y="${(pad.top + cH + 16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${g.l}</text>`;
  }).join('') : '';

  const glowAttr = glow ? ` filter="url(#${fid})"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    (filterDef ? `<defs>${filterDef}</defs>` : '') +
    `${grid}<g${glowAttr}>${bars}</g>${xLabels}</svg>`;
}

function renderTableChartSVG(theme) {
  const W = 560, H = 300;
  const tk = chartTokens(theme);
  const dark = isColorDark(theme.bg);

  // The card is always white (light) / near-black (dark) — independent of theme bg
  const cardBg     = dark ? '#1C1C1E' : '#FFFFFF';
  const headerBg   = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
  const textColor  = dark ? 'rgba(255,255,255,0.80)' : 'rgba(0,0,0,0.70)';
  const mutedColor = dark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.35)';
  const divider    = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const cardRadius = 10;

  // Grey chip (Category / Nat. Rep.)
  const greyChipBg   = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const greyChipText = dark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.45)';

  const cols = ['Category', 'Audience A', 'Audience B', 'Nat. Rep.'];
  const rows = [
    ['Female', '60%', '—',    '51%'],
    ['Male',   '40%', '100%', '49%'],
    ['18–34',  '38%', '72%',  '29%'],
    ['35–54',  '44%', '21%',  '37%'],
  ];

  const PAD     = 20;
  const tableW  = W - PAD * 2;
  const colW    = tableW / cols.length;
  const headerH = 48;   // taller header row so chips have breathing room
  const rowH    = 36;
  const tableH  = headerH + rows.length * rowH;
  const tableX  = PAD;
  const tableY  = Math.round((H - tableH) / 2);

  // Chip geometry — floating pill inside header cell
  const chipH   = 26;
  const chipR   = 6;
  const chipPad = 10;   // horizontal gap between chip edge and cell edge
  const chipY   = tableY + (headerH - chipH) / 2;

  // Per-column chip config
  const chips = [
    { bg: greyChipBg, fg: greyChipText },
    { bg: theme.palette[0],                     fg: '#FFFFFF' },
    { bg: theme.palette[1] || theme.palette[0], fg: '#FFFFFF' },
    { bg: greyChipBg, fg: greyChipText },
  ];

  // Per-column value text colour
  const valueCols = [
    textColor,
    theme.palette[0],
    theme.palette[1] || theme.palette[0],
    mutedColor,
  ];

  const clipId = `tc_${Math.random().toString(36).slice(2, 7)}`;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="font-family:${tk.font};width:100%;height:100%">`;

  // Outer bg (theme bg — tinted for Journeys, white for others)
  svg += `<rect width="${W}" height="${H}" fill="${theme.bg}"/>`;

  // White card
  svg += `<rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="${cardRadius}" fill="${cardBg}"/>`;

  // Clip everything inside the card
  svg += `<defs><clipPath id="${clipId}"><rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="${cardRadius}"/></clipPath></defs>`;
  svg += `<g clip-path="url(#${clipId})">`;

  // Header row bg — very subtle tint
  svg += `<rect x="${tableX}" y="${tableY}" width="${tableW}" height="${headerH}" fill="${headerBg}"/>`;

  // Pill chips — floating within header cells
  cols.forEach((col, i) => {
    const cellX  = tableX + i * colW;
    const chipX  = cellX + chipPad;
    const chipW  = colW - chipPad * 2;
    const chip   = chips[i];
    svg += `<rect x="${chipX.toFixed(1)}" y="${chipY.toFixed(1)}" width="${chipW.toFixed(1)}" height="${chipH}" rx="${chipR}" fill="${chip.bg}"/>`;
    svg += `<text x="${(chipX + chipW / 2).toFixed(1)}" y="${(chipY + chipH / 2 + 4.5).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="${chip.fg}">${col}</text>`;
  });

  // Header / body divider
  svg += `<line x1="${tableX}" y1="${tableY + headerH}" x2="${tableX + tableW}" y2="${tableY + headerH}" stroke="${divider}" stroke-width="1"/>`;

  // Data rows
  rows.forEach((row, ri) => {
    const rowY = tableY + headerH + ri * rowH;
    row.forEach((cell, ci) => {
      const isLabel = ci === 0;
      svg += `<text x="${(tableX + ci * colW + colW / 2).toFixed(1)}" y="${(rowY + rowH / 2 + 4.5).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="${isLabel ? '400' : '600'}" fill="${valueCols[ci]}">${cell}</text>`;
    });
    if (ri < rows.length - 1) {
      svg += `<line x1="${tableX}" y1="${rowY + rowH}" x2="${tableX + tableW}" y2="${rowY + rowH}" stroke="${divider}" stroke-width="1"/>`;
    }
  });

  svg += '</g>';

  // Card border
  svg += `<rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="${cardRadius}" fill="none" stroke="${divider}" stroke-width="1"/>`;
  svg += '</svg>';
  return svg;
}

/* ── Batch 1 renderers ───────────────────────────────────────────────────── */

function renderHistogramSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, barRadius: r, gridDash, axisLabels } = chartTokens(theme);
  const bins = [1,3,7,14,23,33,40,36,27,17,9,4,1];
  const max = 40; const bW = cW / bins.length;
  const yV = v => pad.top + cH - (v / max) * cH;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,10,20,30,40].map(t => {
    const y = yV(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${t===0?baseColor:gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${t}</text>` : '');
  }).join('');
  const bars = bins.map((v,i) => {
    const x = pad.left + i*bW, h = (v/max)*cH, y = yV(v);
    return r===0||h<=r
      ? `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bW+0.5).toFixed(1)}" height="${h.toFixed(1)}" fill="${c0}"/>`
      : `<path d="M${x.toFixed(1)},${(y+h).toFixed(1)} L${x.toFixed(1)},${(y+r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x+r).toFixed(1)},${y.toFixed(1)} L${(x+bW-r).toFixed(1)},${y.toFixed(1)} Q${(x+bW).toFixed(1)},${y.toFixed(1)} ${(x+bW).toFixed(1)},${(y+r).toFixed(1)} L${(x+bW).toFixed(1)},${(y+h).toFixed(1)} Z" fill="${c0}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${bars}</svg>`;
}

function renderStackedBarChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, barRadius: r, gridDash, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const data = [{l:'Q1',a:40,b:30,c:20},{l:'Q2',a:55,b:25,c:30},{l:'Q3',a:35,b:40,c:25},{l:'Q4',a:60,b:35,c:20},{l:'Q5',a:45,b:20,c:35}];
  const max = 120; const { ticks } = niceScale(max, 4);
  const slot = cW/data.length, bW = Math.round(slot*0.55);
  const yV = v => pad.top + cH - (v/max)*cH;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = ticks.map(t => {
    const y = yV(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${t===0?baseColor:gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${t}</text>` : '');
  }).join('');
  const bars = data.map((d,i) => {
    const x = pad.left + slot*i + (slot-bW)/2;
    const hC=(d.c/max)*cH, hB=(d.b/max)*cH, hA=(d.a/max)*cH;
    const yC=pad.top+cH-hC, yB=yC-hB, yA=yB-hA;
    const topPath = r===0||hA<=r
      ? `<rect x="${x.toFixed(1)}" y="${yA.toFixed(1)}" width="${bW}" height="${hA.toFixed(1)}" fill="${c0}"/>`
      : `<path d="M${x.toFixed(1)},${(yA+hA).toFixed(1)} L${x.toFixed(1)},${(yA+r).toFixed(1)} Q${x.toFixed(1)},${yA.toFixed(1)} ${(x+r).toFixed(1)},${yA.toFixed(1)} L${(x+bW-r).toFixed(1)},${yA.toFixed(1)} Q${(x+bW).toFixed(1)},${yA.toFixed(1)} ${(x+bW).toFixed(1)},${(yA+r).toFixed(1)} L${(x+bW).toFixed(1)},${(yA+hA).toFixed(1)} Z" fill="${c0}"/>`;
    const lbl = axisLabels ? `<text x="${(x+bW/2).toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${d.l}</text>` : '';
    return `<rect x="${x.toFixed(1)}" y="${yC.toFixed(1)}" width="${bW}" height="${hC.toFixed(1)}" fill="${c2}"/>` +
           `<rect x="${x.toFixed(1)}" y="${yB.toFixed(1)}" width="${bW}" height="${hB.toFixed(1)}" fill="${c1}"/>` +
           topPath + lbl;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${bars}</svg>`;
}

function renderStackedBar100SVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, barRadius: r, gridDash, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const data = [{l:'A',a:.45,b:.35,c:.20},{l:'B',a:.30,b:.45,c:.25},{l:'C',a:.55,b:.25,c:.20},{l:'D',a:.40,b:.30,c:.30},{l:'E',a:.50,b:.20,c:.30}];
  const slot = cW/data.length, bW = Math.round(slot*0.55);
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,25,50,75,100].map(t => {
    const y = (pad.top+cH-(t/100)*cH).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${t}%</text>` : '');
  }).join('');
  const bars = data.map((d,i) => {
    const x = pad.left + slot*i + (slot-bW)/2;
    const hA=d.a*cH, hB=d.b*cH, hC=d.c*cH;
    const yC=pad.top+cH-hC, yB=yC-hB, yA=yB-hA;
    const topPath = r===0||hA<=r
      ? `<rect x="${x.toFixed(1)}" y="${yA.toFixed(1)}" width="${bW}" height="${hA.toFixed(1)}" fill="${c0}"/>`
      : `<path d="M${x.toFixed(1)},${(yA+hA).toFixed(1)} L${x.toFixed(1)},${(yA+r).toFixed(1)} Q${x.toFixed(1)},${yA.toFixed(1)} ${(x+r).toFixed(1)},${yA.toFixed(1)} L${(x+bW-r).toFixed(1)},${yA.toFixed(1)} Q${(x+bW).toFixed(1)},${yA.toFixed(1)} ${(x+bW).toFixed(1)},${(yA+r).toFixed(1)} L${(x+bW).toFixed(1)},${(yA+hA).toFixed(1)} Z" fill="${c0}"/>`;
    const lbl = axisLabels ? `<text x="${(x+bW/2).toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${d.l}</text>` : '';
    return `<rect x="${x.toFixed(1)}" y="${yC.toFixed(1)}" width="${bW}" height="${hC.toFixed(1)}" fill="${c2}"/>` +
           `<rect x="${x.toFixed(1)}" y="${yB.toFixed(1)}" width="${bW}" height="${hB.toFixed(1)}" fill="${c1}"/>` +
           topPath + lbl;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${bars}</svg>`;
}

function renderWaterfallChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 16, bottom: 36, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, barRadius: r, gridDash, axisLabels } = chartTokens(theme);
  const cNeg = theme.palette[2] || theme.palette[1] || c0;
  const steps = [{l:'Start',v:60,base:0,pos:true},{l:'Sales',v:35,base:60,pos:true},{l:'Costs',v:-25,base:95,pos:false},{l:'Tax',v:-15,base:70,pos:false},{l:'Other',v:20,base:55,pos:true},{l:'Total',v:75,base:0,pos:true,total:true}];
  const max = 100;
  const slot = cW/steps.length, bW = Math.round(slot*0.5);
  const yV = v => pad.top + cH - (v/max)*cH;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,25,50,75,100].map(t => {
    const y = yV(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${t===0?baseColor:gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${t}</text>` : '');
  }).join('');
  const bars = steps.map((s,i) => {
    const x = pad.left + slot*i + (slot-bW)/2;
    const absV = Math.abs(s.v);
    const yTop = s.pos ? yV(s.base + absV) : yV(s.base);
    const h = (absV/max)*cH;
    const color = s.total ? c0 : (s.pos ? c0 : cNeg);
    const bar = r===0||h<=r
      ? `<rect x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${bW}" height="${h.toFixed(1)}" fill="${color}"/>`
      : `<path d="M${x.toFixed(1)},${(yTop+h).toFixed(1)} L${x.toFixed(1)},${(yTop+r).toFixed(1)} Q${x.toFixed(1)},${yTop.toFixed(1)} ${(x+r).toFixed(1)},${yTop.toFixed(1)} L${(x+bW-r).toFixed(1)},${yTop.toFixed(1)} Q${(x+bW).toFixed(1)},${yTop.toFixed(1)} ${(x+bW).toFixed(1)},${(yTop+r).toFixed(1)} L${(x+bW).toFixed(1)},${(yTop+h).toFixed(1)} Z" fill="${color}"/>`;
    const lbl = axisLabels ? `<text x="${(x+bW/2).toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">${s.l}</text>` : '';
    const connector = i < steps.length-1 ? `<line x1="${(x+bW).toFixed(1)}" y1="${(s.pos?yTop:yTop+h).toFixed(1)}" x2="${(pad.left+slot*(i+1)+(slot-bW)/2).toFixed(1)}" y2="${(s.pos?yTop:yTop+h).toFixed(1)}" stroke="${gridColor}" stroke-width="1" stroke-dasharray="3 3"/>` : '';
    return bar + lbl + connector;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${bars}</svg>`;
}

function renderBulletChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 28, right: 30, bottom: 28, left: 90 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, barRadius: r, axisLabels } = chartTokens(theme);
  const rows = [{l:'Revenue',range:.9,good:.65,val:.72,target:.75},{l:'Profit',range:.85,good:.6,val:.48,target:.7},{l:'Growth',range:1,good:.7,val:.83,target:.65}];
  const rowH = cH / rows.length;
  const bH = Math.round(rowH * 0.28), rangeH = Math.round(rowH * 0.55), goodH = Math.round(rowH * 0.42);
  const dark = isColorDark(theme.bg);
  const rangeFill = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const goodFill  = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const bars = rows.map((row, i) => {
    const cy = pad.top + rowH * i + rowH / 2;
    const rangeY = cy - rangeH/2, goodY = cy - goodH/2, valY = cy - bH/2;
    const rr = Math.min(r, 3);
    const rangePath = rr===0 ? `<rect x="${pad.left}" y="${rangeY.toFixed(1)}" width="${(row.range*cW).toFixed(1)}" height="${rangeH}" fill="${rangeFill}"/>`
      : `<rect x="${pad.left}" y="${rangeY.toFixed(1)}" width="${(row.range*cW).toFixed(1)}" height="${rangeH}" rx="${rr}" fill="${rangeFill}"/>`;
    const goodPath = `<rect x="${pad.left}" y="${goodY.toFixed(1)}" width="${(row.good*cW).toFixed(1)}" height="${goodH}" rx="${rr}" fill="${goodFill}"/>`;
    const valPath = rr===0 ? `<rect x="${pad.left}" y="${valY.toFixed(1)}" width="${(row.val*cW).toFixed(1)}" height="${bH}" fill="${c0}"/>`
      : `<rect x="${pad.left}" y="${valY.toFixed(1)}" width="${(row.val*cW).toFixed(1)}" height="${bH}" rx="${rr}" fill="${c0}"/>`;
    const tx = pad.left + row.target*cW;
    const targetLine = `<line x1="${tx.toFixed(1)}" y1="${(cy-rangeH/2-2).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(cy+rangeH/2+2).toFixed(1)}" stroke="${textColor}" stroke-width="2.5"/>`;
    const label = axisLabels ? `<text x="${pad.left-8}" y="${(cy+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${row.l}</text>` : '';
    return rangePath + goodPath + valPath + targetLine + label;
  }).join('');
  const xTicks = axisLabels ? [0,.25,.5,.75,1].map(t =>
    `<text x="${(pad.left+t*cW).toFixed(1)}" y="${(H-8).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">${Math.round(t*100)}%</text>`
  ).join('') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${bars}${xTicks}</svg>`;
}

function renderFunnelChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 60, bottom: 20, left: 60 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, font, c0, axisLabels } = chartTokens(theme);
  const stages = [{l:'Visitors',v:1},{l:'Leads',v:.72},{l:'Qualified',v:.48},{l:'Proposals',v:.28},{l:'Closed',v:.14}];
  const slotH = cH / stages.length;
  const gap = 2;
  const bars = stages.map((s,i) => {
    const halfW = (s.v * cW) / 2;
    const cx = W / 2;
    const y = pad.top + i * slotH + gap/2;
    const h = slotH - gap;
    const color = theme.palette[i % theme.palette.length] || c0;
    const x = cx - halfW;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(halfW*2).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${color}"/>` +
      (axisLabels ? `<text x="${cx.toFixed(1)}" y="${(y+h/2+4.5).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" font-family="${font}" fill="rgba(255,255,255,0.9)">${s.l}</text>` : '');
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${bars}</svg>`;
}

function renderLollipopChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, strokeW, gridDash, axisLabels } = chartTokens(theme);
  const data = [{l:'Alpha',v:72},{l:'Beta',v:48},{l:'Gamma',v:88},{l:'Delta',v:35},{l:'Epsilon',v:61},{l:'Zeta',v:94}];
  const { max, ticks } = niceScale(Math.max(...data.map(d=>d.v)));
  const slot = cW/data.length;
  const xMid = i => pad.left + slot*i + slot/2;
  const yV = v => pad.top + cH - (v/max)*cH;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = ticks.map(t => {
    const y = yV(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${t===0?baseColor:gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${fmtTick(t)}</text>` : '');
  }).join('');
  const lollipops = data.map((d,i) => {
    const x = xMid(i), yTop = yV(d.v), yBase = pad.top+cH;
    const lbl = axisLabels ? `<text x="${x.toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${d.l}</text>` : '';
    return `<line x1="${x.toFixed(1)}" y1="${yBase}" x2="${x.toFixed(1)}" y2="${(yTop+5).toFixed(1)}" stroke="${c0}" stroke-width="${strokeW*0.6}"/>` +
           `<circle cx="${x.toFixed(1)}" cy="${yTop.toFixed(1)}" r="6" fill="${c0}" stroke="${theme.bg}" stroke-width="1.5"/>` + lbl;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${lollipops}</svg>`;
}

function renderDumbbellChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 24, bottom: 16, left: 80 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, gridDash, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0;
  const rows = [{l:'Group A',a:.22,b:.68},{l:'Group B',a:.38,b:.75},{l:'Group C',a:.15,b:.55},{l:'Group D',a:.45,b:.80},{l:'Group E',a:.30,b:.62}];
  const rowH = cH/rows.length;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const vLines = [0,.25,.5,.75,1].map(t => {
    const x = (pad.left + t*cW).toFixed(1);
    return `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top+cH}" stroke="${gridColor}" stroke-width="1"${dash}/>`;
  }).join('');
  const dumbbells = rows.map((row,i) => {
    const cy = pad.top + rowH*i + rowH/2;
    const xA = pad.left + row.a*cW, xB = pad.left + row.b*cW;
    const lbl = axisLabels ? `<text x="${pad.left-8}" y="${(cy+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${row.l}</text>` : '';
    return lbl +
      `<line x1="${xA.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${xB.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${textColor}" stroke-width="1.5"/>` +
      `<circle cx="${xA.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="${c0}" stroke="${theme.bg}" stroke-width="1.5"/>` +
      `<circle cx="${xB.toFixed(1)}" cy="${cy.toFixed(1)}" r="6" fill="${c1}" stroke="${theme.bg}" stroke-width="1.5"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${vLines}${dumbbells}</svg>`;
}

function renderBubbleChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, gridDash, axisLabels, glow, glowSD } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const bubbles = [
    {x:.12,y:.65,r:14,ci:0},{x:.28,y:.28,r:28,ci:1},{x:.44,y:.58,r:10,ci:2},
    {x:.60,y:.18,r:34,ci:0},{x:.75,y:.50,r:18,ci:1},{x:.88,y:.72,r:12,ci:2},
    {x:.50,y:.82,r:8,ci:0},{x:.35,y:.45,r:22,ci:2},
  ];
  const colors = [c0,c1,c2];
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,.25,.5,.75,1].map(t => {
    const y = (pad.top+cH-t*cH).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${gridColor}" stroke-width="1"${dash}/>`;
  }).join('');
  const fid = glow ? 'gf'+Math.random().toString(36).slice(2,7) : '';
  const filterDef = glow ? `<filter id="${fid}"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';
  const circles = bubbles.map(b =>
    `<circle cx="${(pad.left+b.x*cW).toFixed(1)}" cy="${(pad.top+b.y*cH).toFixed(1)}" r="${b.r}" fill="${colors[b.ci]}" fill-opacity="0.72" stroke="${theme.bg}" stroke-width="1.5"${glowAttr}/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${filterDef?`<defs>${filterDef}</defs>`:''}${grid}${circles}</svg>`;
}

function renderDotPlotSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 24, bottom: 16, left: 80 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, gridDash, axisLabels } = chartTokens(theme);
  const rows = [{l:'Category A',v:.68},{l:'Category B',v:.42},{l:'Category C',v:.81},{l:'Category D',v:.30},{l:'Category E',v:.57}];
  const rowH = cH/rows.length;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const vLines = [0,.25,.5,.75,1].map(t => {
    const x = (pad.left+t*cW).toFixed(1);
    return `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top+cH}" stroke="${gridColor}" stroke-width="1"${dash}/>`;
  }).join('');
  const dots = rows.map((row,i) => {
    const cy = pad.top + rowH*i + rowH/2;
    const cx = pad.left + row.v*cW;
    const lbl = axisLabels ? `<text x="${pad.left-8}" y="${(cy+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${row.l}</text>` : '';
    return lbl + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" fill="${c0}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${vLines}${dots}</svg>`;
}

function renderStripPlotSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 24, bottom: 36, left: 70 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, gridDash, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const cats = [{l:'Group A',ci:0},{l:'Group B',ci:1},{l:'Group C',ci:2}];
  const seed = [.12,.28,.38,.52,.61,.74,.82,.18,.33,.55,.70,.88,.09,.41,.63,.79,.25,.48,.67,.85];
  const rowH = cH/cats.length;
  const colors = [c0,c1,c2];
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const vLines = [0,.25,.5,.75,1].map(t => {
    const x = (pad.left+t*cW).toFixed(1);
    return `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top+cH}" stroke="${gridColor}" stroke-width="1"${dash}/>`;
  }).join('');
  let dots = '';
  cats.forEach((cat,ci) => {
    const cy = pad.top + rowH*ci + rowH/2;
    seed.slice(ci*7, ci*7+7).forEach((v,j) => {
      const cx = pad.left + v*cW;
      const jitter = (j%3 - 1)*5;
      dots += `<circle cx="${cx.toFixed(1)}" cy="${(cy+jitter).toFixed(1)}" r="4" fill="${colors[cat.ci]}" fill-opacity="0.75"/>`;
    });
    if (axisLabels) dots += `<text x="${pad.left-8}" y="${(cy+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${cat.l}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${vLines}${dots}</svg>`;
}

function renderSparklineSVG(theme) {
  const W = 560, H = 300;
  const { c0, lineSmooth, strokeW, glow, glowSD } = chartTokens(theme);
  // Three sparklines side by side
  const series = [
    [42,55,48,62,58,72,65,80,75,88],
    [80,72,65,70,60,55,62,50,45,52],
    [30,38,45,40,55,48,58,65,60,72],
  ];
  const labels = ['Revenue','Costs','Margin'];
  const sparkW = W/3, sparkH = H*0.4, sparkPad = 20;
  const dark = isColorDark(theme.bg);
  const textColor = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.32)';
  const fid = glow ? 'gf'+Math.random().toString(36).slice(2,7) : '';
  const filterDef = glow ? `<filter id="${fid}"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';
  let content = '';
  series.forEach((data,si) => {
    const color = theme.palette[si] || c0;
    const x0 = si*sparkW + sparkPad, y0 = H/2 - sparkH/2;
    const w = sparkW - sparkPad*2, h = sparkH;
    const min = Math.min(...data), max = Math.max(...data), range = max-min||1;
    const xP = i => x0 + (i/(data.length-1))*w;
    const yP = v => y0 + h - ((v-min)/range)*h;
    const pts = data.map((v,i) => [xP(i),yP(v)]);
    const pathD = pts.map(([x,y],i) => {
      if (i===0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
      if (!lineSmooth) return `L${x.toFixed(1)},${y.toFixed(1)}`;
      const [px,py] = pts[i-1];
      const cx = ((px+x)/2).toFixed(1);
      return `C${cx},${py.toFixed(1)} ${cx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    content += `<path d="${pathD}" stroke="${color}" stroke-width="${strokeW*0.8}" fill="none" stroke-linecap="round"${glowAttr}/>`;
    content += `<circle cx="${pts[pts.length-1][0].toFixed(1)}" cy="${pts[pts.length-1][1].toFixed(1)}" r="3.5" fill="${color}"/>`;
    content += `<text x="${(x0+w/2).toFixed(1)}" y="${(y0+h+20).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${chartTokens(theme).font}" fill="${textColor}">${labels[si]}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${filterDef?`<defs>${filterDef}</defs>`:''}${content}</svg>`;
}

/* ── Batch 2 renderers ───────────────────────────────────────────────────── */

function renderStepChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, strokeW, gridDash, axisLabels, glow, glowSD } = chartTokens(theme);
  const data = [30,30,48,48,62,62,55,55,74,74,88,88];
  const labels = ['Jan','','Mar','','May','','Jul','','Sep','','Nov',''];
  const { max, ticks } = niceScale(Math.max(...data));
  const n = data.length;
  const xP = i => pad.left + (i/(n-1))*cW;
  const yP = v => pad.top + cH - (v/max)*cH;
  const pts = data.map((v,i) => [xP(i),yP(v)]);
  const pathD = pts.map(([x,y],i) => i===0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = ticks.map(t => {
    const y = yP(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${t===0?baseColor:gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${fmtTick(t)}</text>` : '');
  }).join('');
  const xLbls = axisLabels ? labels.map((l,i) => l ? `<text x="${xP(i).toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">${l}</text>` : '').join('') : '';
  const fid = glow ? 'gf'+Math.random().toString(36).slice(2,7) : '';
  const filterDef = glow ? `<filter id="${fid}"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${filterDef?`<defs>${filterDef}</defs>`:''}${grid}<path d="${pathD}" stroke="${c0}" stroke-width="${strokeW}" fill="none" stroke-linecap="square"${glow?` filter="url(#${fid})"`:''}/>${xLbls}</svg>`;
}

function renderSlopeChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 30, right: 80, bottom: 30, left: 80 };
  const cH = H - pad.top - pad.bottom;
  const { textColor, font, c0, strokeW } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const rows = [{l:'Alpha',a:.85,b:.62,ci:0},{l:'Beta',a:.60,b:.78,ci:1},{l:'Gamma',a:.40,b:.55,ci:2},{l:'Delta',a:.72,b:.38,ci:0},{l:'Epsilon',a:.30,b:.65,ci:1}];
  const colors = [c0,c1,c2];
  const xL = pad.left, xR = W-pad.right;
  const yP = v => pad.top + (1-v)*cH;
  const lines = rows.map(r => {
    const yA = yP(r.a), yB = yP(r.b);
    return `<line x1="${xL}" y1="${yA.toFixed(1)}" x2="${xR}" y2="${yB.toFixed(1)}" stroke="${colors[r.ci]}" stroke-width="${strokeW*0.7}" stroke-opacity="0.85"/>` +
      `<circle cx="${xL}" cy="${yA.toFixed(1)}" r="4.5" fill="${colors[r.ci]}"/>` +
      `<circle cx="${xR}" cy="${yB.toFixed(1)}" r="4.5" fill="${colors[r.ci]}"/>` +
      `<text x="${xL-8}" y="${(yA+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${r.l}</text>`;
  }).join('');
  const colLbl = `<text x="${xL}" y="${pad.top-14}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">2022</text>` +
    `<text x="${xR}" y="${pad.top-14}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">2023</text>`;
  const axes = `<line x1="${xL}" y1="${pad.top-8}" x2="${xL}" y2="${pad.top+cH}" stroke="${textColor}" stroke-width="1"/>` +
    `<line x1="${xR}" y1="${pad.top-8}" x2="${xR}" y2="${pad.top+cH}" stroke="${textColor}" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${axes}${colLbl}${lines}</svg>`;
}

function renderBumpChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 50, bottom: 20, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, font, c0, strokeW, lineSmooth } = chartTokens(theme);
  const series = [
    {l:'A', ranks:[1,2,1,3,2,1], ci:0},
    {l:'B', ranks:[2,1,3,1,3,2], ci:1},
    {l:'C', ranks:[3,3,2,2,1,3], ci:2},
  ];
  const nRanks = 3, nTime = 6;
  const colors = [c0, theme.palette[1]||c0, theme.palette[2]||c0];
  const xP = i => pad.left + (i/(nTime-1))*cW;
  const yP = r => pad.top + ((r-1)/(nRanks-1))*cH;
  const paths = series.map(s => {
    const pts = s.ranks.map((r,i) => [xP(i), yP(r)]);
    const d = pts.map(([x,y],i) => {
      if (i===0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
      if (!lineSmooth) return `L${x.toFixed(1)},${y.toFixed(1)}`;
      const [px,py] = pts[i-1];
      const cx = ((px+x)/2).toFixed(1);
      return `C${cx},${py.toFixed(1)} ${cx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const lastPt = pts[pts.length-1];
    return `<path d="${d}" stroke="${colors[s.ci]}" stroke-width="${strokeW*0.85}" fill="none" stroke-linecap="round"/>` +
      `<circle cx="${pts[0][0].toFixed(1)}" cy="${pts[0][1].toFixed(1)}" r="4" fill="${colors[s.ci]}"/>` +
      `<circle cx="${lastPt[0].toFixed(1)}" cy="${lastPt[1].toFixed(1)}" r="4" fill="${colors[s.ci]}"/>` +
      `<text x="${(lastPt[0]+8).toFixed(1)}" y="${(lastPt[1]+4).toFixed(1)}" font-size="11" font-family="${font}" fill="${textColor}">${s.l}</text>`;
  }).join('');
  const rankLbls = [1,2,3].map(r => `<text x="${pad.left-8}" y="${(yP(r)+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">#${r}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${rankLbls}${paths}</svg>`;
}

function renderStackedAreaChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, lineSmooth, strokeW, gridDash, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
  const s0 = [20,24,22,28,30,26,32,35];
  const s1 = [15,18,20,16,22,24,20,25];
  const s2 = [10,12,14,18,12,16,20,18];
  const n = labels.length;
  const max = Math.max(...s0.map((v,i)=>v+s1[i]+s2[i]));
  const xP = i => pad.left+(i/(n-1))*cW;
  const yP = v => pad.top+cH-(v/max)*cH;
  const makeLine = (vals, bases) => vals.map((v,i) => {
    const x=xP(i), y=yP(v+bases[i]);
    if (i===0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
    if (!lineSmooth) return `L${x.toFixed(1)},${y.toFixed(1)}`;
    const px=xP(i-1), py=yP(vals[i-1]+bases[i-1]);
    const cx=((px+x)/2).toFixed(1);
    return `C${cx},${py.toFixed(1)} ${cx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const zeros = s0.map(()=>0);
  const tops0 = s0.map(()=>0); // base = 0
  const tops1 = s0; // base = s0
  const tops2 = s0.map((v,i)=>v+s1[i]); // base = s0+s1
  const path0 = makeLine(s0,zeros);
  const path1 = makeLine(s1,tops1);
  const path2 = makeLine(s2,tops2);
  const base = (pad.top+cH).toFixed(1);
  const close0 = ` L${xP(n-1).toFixed(1)},${yP(s0[n-1]).toFixed(1)} ${s0.map((_,i)=>`L${xP(n-1-i).toFixed(1)},${base}`).slice(-1)} L${xP(0).toFixed(1)},${base} Z`;
  // Simpler approach: just close each area back to its base line
  const area0 = path0 + ` L${xP(n-1).toFixed(1)},${base} L${xP(0).toFixed(1)},${base} Z`;
  const revPath1 = [...s1].reverse().map((v,ri) => { const i=n-1-ri; return `L${xP(i).toFixed(1)},${yP(s0[i]).toFixed(1)}`; }).join(' ');
  const revPath2 = [...s2].reverse().map((v,ri) => { const i=n-1-ri; return `L${xP(i).toFixed(1)},${yP(s0[i]+s1[i]).toFixed(1)}`; }).join(' ');
  const area1 = path1 + ` ${revPath1} Z`;
  const area2 = path2 + ` ${revPath2} Z`;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,.25,.5,.75,1].map(t => {
    const y = (pad.top+cH-t*cH).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${gridColor}" stroke-width="1"${dash}/>`;
  }).join('');
  const xLbls = axisLabels ? labels.map((l,i) => i%2===0 ? `<text x="${xP(i).toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">${l}</text>` : '').join('') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    `${grid}<path d="${area2}" fill="${c2}" fill-opacity="0.85"/><path d="${area1}" fill="${c1}" fill-opacity="0.85"/><path d="${area0}" fill="${c0}" fill-opacity="0.85"/>` +
    `<path d="${path2}" stroke="${c2}" stroke-width="${strokeW*0.6}" fill="none"/><path d="${path1}" stroke="${c1}" stroke-width="${strokeW*0.6}" fill="none"/><path d="${path0}" stroke="${c0}" stroke-width="${strokeW*0.6}" fill="none"/>` +
    `${xLbls}</svg>`;
}

function renderStreamgraphSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 10, right: 16, bottom: 10, left: 16 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { c0, lineSmooth } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1, c3 = theme.palette[3]||c0;
  // Each stream: array of [top offset, height] at each time step, centered on 0
  const n = 10;
  const streams = [
    { heights:[10,14,18,22,20,16,14,18,22,20], color:c0 },
    { heights:[8,10,14,18,22,20,16,12,10,14],  color:c1 },
    { heights:[6,8,10,8,12,14,16,14,10,8],      color:c2 },
    { heights:[4,6,8,6,8,10,8,6,8,10],          color:c3 },
  ];
  // Compute baselines (streamgraph stacks symmetrically around center)
  const totals = Array(n).fill(0);
  streams.forEach(s => s.heights.forEach((h,i) => totals[i] += h));
  const maxTotal = Math.max(...totals);
  const cy = pad.top + cH/2;
  const xP = i => pad.left + (i/(n-1))*cW;
  const yScale = (cH*0.85) / (maxTotal);
  let runningBase = Array(n).fill(0);
  const paths = streams.map(s => {
    const tops = s.heights.map((h,i) => runningBase[i] + h);
    const topPts = tops.map((v,i) => [xP(i), cy - (v - totals[i]/2) * yScale]);
    const botPts = runningBase.map((v,i) => [xP(i), cy - (v - totals[i]/2) * yScale]);
    runningBase = tops;
    const makePath = pts => pts.map(([x,y],i) => {
      if (i===0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
      if (!lineSmooth) return `L${x.toFixed(1)},${y.toFixed(1)}`;
      const [px,py] = pts[i-1]; const cx = ((px+x)/2).toFixed(1);
      return `C${cx},${py.toFixed(1)} ${cx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const revBot = [...botPts].reverse();
    return `<path d="${makePath(topPts)} ${makePath(revBot).replace('M','L')} Z" fill="${s.color}" fill-opacity="0.88"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${paths}</svg>`;
}

function renderConnectedScatterSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, strokeW, lineSmooth, gridDash, axisLabels } = chartTokens(theme);
  const pts = [[15,80],[25,65],[40,70],[55,45],[60,55],[75,30],[85,40],[90,20]];
  const xP = v => pad.left+(v/100)*cW, yP = v => pad.top+cH-(v/100)*cH;
  const coords = pts.map(([x,y]) => [xP(x), yP(y)]);
  const pathD = coords.map(([x,y],i) => {
    if (i===0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
    if (!lineSmooth) return `L${x.toFixed(1)},${y.toFixed(1)}`;
    const [px,py] = coords[i-1]; const cx = ((px+x)/2).toFixed(1);
    return `C${cx},${py.toFixed(1)} ${cx},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,25,50,75,100].map(t => {
    const y = yP(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${t}</text>` : '');
  }).join('');
  const dots = coords.map(([x,y],i) =>
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${c0}" stroke="${theme.bg}" stroke-width="2"/>` +
    (axisLabels ? `<text x="${x.toFixed(1)}" y="${(y-9).toFixed(1)}" text-anchor="middle" font-size="9" font-family="${font}" fill="${textColor}">'${(i+14).toString().padStart(2,'0')}</text>` : '')
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}<path d="${pathD}" stroke="${c0}" stroke-width="${strokeW*0.7}" fill="none" stroke-opacity="0.5"/>${dots}</svg>`;
}

function renderBoxPlotSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, gridDash, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const boxes = [
    {l:'A',min:.1,q1:.28,med:.45,q3:.62,max:.88,ci:0},
    {l:'B',min:.18,q1:.35,med:.55,q3:.70,max:.90,ci:1},
    {l:'C',min:.05,q1:.22,med:.38,q3:.58,max:.78,ci:2},
  ];
  const colors = [c0,c1,c2];
  const slot = cW/boxes.length, bW = Math.round(slot*0.4);
  const yP = v => pad.top + cH - v*cH;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,.25,.5,.75,1].map(t => {
    const y = yP(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${Math.round(t*100)}</text>` : '');
  }).join('');
  const bxs = boxes.map((b,i) => {
    const cx = pad.left + slot*i + slot/2;
    const x = cx - bW/2;
    const yMin=yP(b.min), yQ1=yP(b.q1), yMed=yP(b.med), yQ3=yP(b.q3), yMax=yP(b.max);
    const lbl = axisLabels ? `<text x="${cx.toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${b.l}</text>` : '';
    return `<line x1="${cx.toFixed(1)}" y1="${yMin.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yMax.toFixed(1)}" stroke="${colors[b.ci]}" stroke-width="1.5"/>` +
      `<line x1="${(cx-bW/4).toFixed(1)}" y1="${yMin.toFixed(1)}" x2="${(cx+bW/4).toFixed(1)}" y2="${yMin.toFixed(1)}" stroke="${colors[b.ci]}" stroke-width="1.5"/>` +
      `<line x1="${(cx-bW/4).toFixed(1)}" y1="${yMax.toFixed(1)}" x2="${(cx+bW/4).toFixed(1)}" y2="${yMax.toFixed(1)}" stroke="${colors[b.ci]}" stroke-width="1.5"/>` +
      `<rect x="${x.toFixed(1)}" y="${yQ3.toFixed(1)}" width="${bW}" height="${(yQ1-yQ3).toFixed(1)}" fill="${colors[b.ci]}" fill-opacity="0.25" stroke="${colors[b.ci]}" stroke-width="1.5"/>` +
      `<line x1="${x.toFixed(1)}" y1="${yMed.toFixed(1)}" x2="${(x+bW).toFixed(1)}" y2="${yMed.toFixed(1)}" stroke="${colors[b.ci]}" stroke-width="2.5"/>` + lbl;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${bxs}</svg>`;
}

function renderViolinPlotSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const violins = [
    {l:'A',ci:0,shape:[2,4,8,14,20,28,34,28,20,14,8,4,2]},
    {l:'B',ci:1,shape:[2,6,12,22,30,26,20,28,24,16,10,6,2]},
    {l:'C',ci:2,shape:[2,4,10,18,28,36,28,18,10,4,2,2,2]},
  ];
  const colors = [c0,c1,c2];
  const slot = cW/violins.length;
  const maxW = slot*0.38;
  const vParts = violins.map((v,i) => {
    const cx = pad.left + slot*i + slot/2;
    const n = v.shape.length;
    const maxS = Math.max(...v.shape);
    const yStep = cH/(n-1);
    const rightPts = v.shape.map((s,j) => `${(cx+s/maxS*maxW).toFixed(1)},${(pad.top+j*yStep).toFixed(1)}`).join(' ');
    const leftPts = [...v.shape].reverse().map((s,j) => `${(cx-s/maxS*maxW).toFixed(1)},${(pad.top+(n-1-j)*yStep).toFixed(1)}`).join(' ');
    const lbl = axisLabels ? `<text x="${cx.toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${v.l}</text>` : '';
    return `<polygon points="${rightPts} ${leftPts}" fill="${colors[v.ci]}" fill-opacity="0.35" stroke="${colors[v.ci]}" stroke-width="1.5"/>` + lbl;
  }).join('');
  const grid = [0,.25,.5,.75,1].map(t => `<line x1="${pad.left}" y1="${(pad.top+t*cH).toFixed(1)}" x2="${W-pad.right}" y2="${(pad.top+t*cH).toFixed(1)}" stroke="${gridColor}" stroke-width="1"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${vParts}</svg>`;
}

function renderDensityPlotSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { gridColor, c0, strokeW, areaFill, glow, glowSD } = chartTokens(theme);
  const c1 = theme.palette[1]||c0;
  // Two overlapping density curves
  const gauss = (x, mu, sig) => Math.exp(-0.5*((x-mu)/sig)**2);
  const n = 60;
  const curve = (mu, sig) => Array.from({length:n}, (_,i) => gauss(i/(n-1), mu, sig));
  const d0 = curve(0.35, 0.18), d1 = curve(0.62, 0.15);
  const max = Math.max(...d0, ...d1);
  const xP = i => pad.left+(i/(n-1))*cW;
  const yP = v => pad.top+cH-(v/max)*cH;
  const makePath = data => data.map((v,i) => (i===0?`M`:` L`)+`${xP(i).toFixed(1)},${yP(v).toFixed(1)}`).join('');
  const p0 = makePath(d0), p1 = makePath(d1);
  const base = pad.top+cH;
  const a0 = p0+` L${xP(n-1).toFixed(1)},${base} L${xP(0).toFixed(1)},${base} Z`;
  const a1 = p1+` L${xP(n-1).toFixed(1)},${base} L${xP(0).toFixed(1)},${base} Z`;
  const fid = glow ? 'gf'+Math.random().toString(36).slice(2,7) : '';
  const filterDef = glow ? `<filter id="${fid}"><feGaussianBlur in="SourceGraphic" stdDeviation="${glowSD}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const af0 = areaFill !== 'none' ? `<path d="${a0}" fill="${c0}" fill-opacity="0.18"/>` : '';
  const af1 = areaFill !== 'none' ? `<path d="${a1}" fill="${c1}" fill-opacity="0.18"/>` : '';
  const grid = `<line x1="${pad.left}" y1="${(pad.top+cH).toFixed(1)}" x2="${W-pad.right}" y2="${(pad.top+cH).toFixed(1)}" stroke="${gridColor}" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${filterDef?`<defs>${filterDef}</defs>`:''}${grid}${af0}${af1}<path d="${p0}" stroke="${c0}" stroke-width="${strokeW}" fill="none" stroke-linecap="round"${glow?` filter="url(#${fid})"`:''}/><path d="${p1}" stroke="${c1}" stroke-width="${strokeW}" fill="none" stroke-linecap="round"${glow?` filter="url(#${fid})"`:''}/>  </svg>`;
}

function renderRidgePlotSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 10, right: 20, bottom: 20, left: 70 };
  const cW = W - pad.left - pad.right;
  const { textColor, font, c0, strokeW } = chartTokens(theme);
  const rows = [
    {l:'2020', mu:.40, sig:.16},
    {l:'2021', mu:.48, sig:.14},
    {l:'2022', mu:.55, sig:.15},
    {l:'2023', mu:.62, sig:.13},
  ];
  const rowH = (H-pad.top-pad.bottom)/rows.length;
  const n = 50;
  const gauss = (x, mu, sig) => Math.exp(-0.5*((x-mu)/sig)**2);
  const ridges = rows.map((row,ri) => {
    const color = theme.palette[ri % theme.palette.length] || c0;
    const baseY = pad.top + (ri+1)*rowH;
    const data = Array.from({length:n}, (_,i) => gauss(i/(n-1), row.mu, row.sig));
    const maxD = Math.max(...data);
    const xP = i => pad.left+(i/(n-1))*cW;
    const yP = v => baseY - (v/maxD)*rowH*0.85;
    const pathD = data.map((v,i) => (i===0?'M':'L')+`${xP(i).toFixed(1)},${yP(v).toFixed(1)}`).join(' ');
    const areaD = pathD + ` L${xP(n-1).toFixed(1)},${baseY} L${xP(0).toFixed(1)},${baseY} Z`;
    return `<path d="${areaD}" fill="${color}" fill-opacity="0.45"/>` +
      `<path d="${pathD}" stroke="${color}" stroke-width="${strokeW*0.7}" fill="none"/>` +
      `<text x="${pad.left-8}" y="${(baseY-rowH*0.3).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${row.l}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${ridges}</svg>`;
}

function renderParallelCoordsSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 30, right: 40, bottom: 30, left: 40 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, strokeW } = chartTokens(theme);
  const axes = ['Speed','Power','Agility','Endurance','Skill'];
  const nAxes = axes.length;
  const series = [
    [.8,.6,.7,.4,.9],[.5,.9,.4,.8,.6],[.7,.3,.9,.6,.5],
    [.3,.7,.5,.9,.4],[.6,.5,.8,.3,.7],[.9,.4,.6,.7,.8],
  ];
  const xA = i => pad.left + (i/(nAxes-1))*cW;
  const yP = v => pad.top + (1-v)*cH;
  const axisLines = axes.map((_,i) => {
    const x = xA(i).toFixed(1);
    return `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top+cH}" stroke="${gridColor}" stroke-width="1"/>` +
      `<text x="${x}" y="${(pad.top-8).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">${axes[i]}</text>`;
  }).join('');
  const lines = series.map((s,si) => {
    const color = theme.palette[si % theme.palette.length] || c0;
    const d = s.map((v,i) => (i===0?'M':'L')+`${xA(i).toFixed(1)},${yP(v).toFixed(1)}`).join(' ');
    return `<path d="${d}" stroke="${color}" stroke-width="${strokeW*0.65}" fill="none" stroke-opacity="0.7"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${lines}${axisLines}</svg>`;
}

function renderWaffleChartSVG(theme) {
  const W = 560, H = 300;
  const { c0, barRadius: r } = chartTokens(theme);
  const c1 = theme.palette[1]||c0;
  const dark = isColorDark(theme.bg);
  const emptyFill = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const cols = 10, rows = 10, total = 100;
  const filled = 63; // 63% filled
  const cellSize = Math.min((W-80)/cols, (H-40)/rows);
  const gap = 3;
  const gridW = cols*(cellSize+gap)-gap, gridH = rows*(cellSize+gap)-gap;
  const ox = (W-gridW)/2, oy = (H-gridH)/2;
  const rr = Math.min(r, 3);
  let cells = '';
  for (let row=0; row<rows; row++) {
    for (let col=0; col<cols; col++) {
      const idx = row*cols+col;
      const x = ox+col*(cellSize+gap), y = oy+row*(cellSize+gap);
      const fill = idx < filled ? (idx < 40 ? c0 : c1) : emptyFill;
      cells += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellSize}" height="${cellSize}" rx="${rr}" fill="${fill}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${cells}</svg>`;
}

function renderHeatmapSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 30, right: 16, bottom: 36, left: 60 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, font, c0, barRadius: r, axisLabels } = chartTokens(theme);
  const cols = ['Mon','Tue','Wed','Thu','Fri'];
  const rows = ['Morning','Afternoon','Evening','Night'];
  const vals = [[.3,.5,.7,.4,.6],[.8,.9,.6,.8,.7],[.5,.6,.9,.7,.5],[.2,.3,.4,.5,.2]];
  const cW2 = cW/cols.length, rH = cH/rows.length;
  const rr = Math.min(r, 4);
  const cells = rows.map((row,ri) =>
    cols.map((col,ci) => {
      const v = vals[ri][ci];
      const x = pad.left+ci*cW2+2, y = pad.top+ri*rH+2, w = cW2-4, h = rH-4;
      const alpha = (0.12 + v*0.88).toFixed(2);
      const fill = `color-mix(in srgb, ${c0} ${Math.round(v*100)}%, transparent)`;
      // Fallback: use opacity on solid color
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rr}" fill="${c0}" fill-opacity="${alpha}"/>` +
        (axisLabels && ri===0 ? `<text x="${(x+w/2).toFixed(1)}" y="${(pad.top-8).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">${col}</text>` : '') +
        (axisLabels && ci===0 ? `<text x="${(pad.left-6).toFixed(1)}" y="${(y+h/2+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${row}</text>` : '');
    }).join('')
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${cells}</svg>`;
}

function renderCalendarHeatmapSVG(theme) {
  const W = 560, H = 300;
  const { c0, barRadius: r } = chartTokens(theme);
  const dark = isColorDark(theme.bg);
  const emptyFill = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const weeks = 18, days = 7;
  const cellSize = Math.min((W-60)/weeks, (H-40)/days);
  const gap = 3;
  const gridW = weeks*(cellSize+gap)-gap, gridH = days*(cellSize+gap)-gap;
  const ox = (W-gridW)/2, oy = (H-gridH)/2;
  const seed = [0,.1,.3,.6,.9,.4,.2,.7,.5,.8,.3,.1,.6,.4,.9,.2,.5,.8,.3,.7,.4,.1,.6,.9,.2,.5,.8,.4,.7,.3];
  const rr = Math.min(r, 3);
  let cells = '';
  for (let w=0; w<weeks; w++) {
    for (let d=0; d<days; d++) {
      const v = seed[(w*7+d) % seed.length];
      const x = ox+w*(cellSize+gap), y = oy+d*(cellSize+gap);
      const opacity = v < 0.05 ? 0 : (0.1 + v*0.9).toFixed(2);
      cells += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellSize}" height="${cellSize}" rx="${rr}" fill="${v < 0.05 ? emptyFill : c0}" fill-opacity="${v < 0.05 ? '1' : opacity}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${cells}</svg>`;
}

function renderBeeswarmPlotSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 24, bottom: 36, left: 70 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, gridDash, axisLabels } = chartTokens(theme);
  const c1 = theme.palette[1]||c0, c2 = theme.palette[2]||c1;
  const cats = [{l:'Group A',ci:0},{l:'Group B',ci:1},{l:'Group C',ci:2}];
  const positions = [
    [.12,.28,.35,.42,.50,.58,.65,.72,.80,.88],
    [.15,.22,.38,.45,.55,.62,.70,.78,.85,.92],
    [.08,.18,.32,.48,.52,.60,.68,.75,.82,.90],
  ];
  const rowH = cH/cats.length;
  const colors = [c0,c1,c2];
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const vLines = [0,.25,.5,.75,1].map(t =>
    `<line x1="${(pad.left+t*cW).toFixed(1)}" y1="${pad.top}" x2="${(pad.left+t*cW).toFixed(1)}" y2="${pad.top+cH}" stroke="${gridColor}" stroke-width="1"${dash}/>`
  ).join('');
  let dots = '';
  cats.forEach((cat,ci) => {
    const cy = pad.top + rowH*ci + rowH/2;
    positions[ci].forEach((v,j) => {
      const jitter = [-6,-3,0,3,6,-4,4,-2,2,0][j] || 0;
      dots += `<circle cx="${(pad.left+v*cW).toFixed(1)}" cy="${(cy+jitter).toFixed(1)}" r="4.5" fill="${colors[cat.ci]}" fill-opacity="0.80"/>`;
    });
    if (axisLabels) dots += `<text x="${pad.left-8}" y="${(cy+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${cat.l}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${vLines}${dots}</svg>`;
}

/* ── Batch 3 renderers ───────────────────────────────────────────────────── */

function renderRadarChartSVG(theme) {
  const W = 560, H = 300;
  const cx = W/2, cy = H/2, R = Math.min(cx,cy)-30;
  const { textColor, gridColor, font, c0, strokeW, areaFill } = chartTokens(theme);
  const c1 = theme.palette[1]||c0;
  const axes = ['Speed','Power','Range','Defence','Stamina','Skill'];
  const n = axes.length;
  const s0 = [.8,.6,.9,.5,.7,.75], s1 = [.5,.85,.55,.8,.6,.45];
  const pt = (r,i) => { const a = (i/n)*Math.PI*2 - Math.PI/2; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; };
  const webLines = [.25,.5,.75,1].map(f =>
    axes.map((_,i) => { const [x,y]=pt(R*f,i); return (i===0?`M${x.toFixed(1)},${y.toFixed(1)}`:`L${x.toFixed(1)},${y.toFixed(1)}`); }).join(' ')+' Z'
  ).map(d => `<path d="${d}" stroke="${gridColor}" stroke-width="1" fill="none"/>`).join('');
  const spokes = axes.map((_,i) => { const [x,y]=pt(R,i); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${gridColor}" stroke-width="1"/>`; }).join('');
  const polyPath = vals => vals.map((v,i) => { const [x,y]=pt(R*v,i); return (i===0?`M${x.toFixed(1)},${y.toFixed(1)}`:`L${x.toFixed(1)},${y.toFixed(1)}`); }).join(' ')+' Z';
  const p0 = polyPath(s0), p1 = polyPath(s1);
  const fill0 = areaFill!=='none' ? `<path d="${p0}" fill="${c0}" fill-opacity="0.20"/>` : '';
  const fill1 = areaFill!=='none' ? `<path d="${p1}" fill="${c1}" fill-opacity="0.15"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${webLines}${spokes}${fill0}${fill1}<path d="${p0}" stroke="${c0}" stroke-width="${strokeW}" fill="none"/><path d="${p1}" stroke="${c1}" stroke-width="${strokeW}" fill="none"/></svg>`;
}

function renderTreemapSVG(theme) {
  const W = 560, H = 300;
  const p = 40, gap = 8; // generous padding + gap so tiles float with breathing room
  const { c0, barRadius: r } = chartTokens(theme);
  const rr = Math.min(r, 4);
  const colors = [c0, theme.palette[1]||c0, theme.palette[2]||c0, theme.palette[3]||c0];
  // Asymmetric layout: one dominant left tile + 3 smaller right tiles
  const cW = W - p*2, cH = H - p*2;
  const lw = Math.round(cW * 0.52); // large left tile width
  const rw = cW - lw - gap;         // right column width
  const th = Math.round((cH - gap) / 2); // top/bottom half height
  const tiles = [
    {x:p,          y:p,       w:lw, h:cH},            // large left
    {x:p+lw+gap,   y:p,       w:rw, h:th},             // top-right
    {x:p+lw+gap,   y:p+th+gap,w:Math.round(rw*0.47), h:th}, // bottom-right small
    {x:p+lw+gap+Math.round(rw*0.47)+gap, y:p+th+gap, w:rw-Math.round(rw*0.47)-gap, h:th}, // bottom-right smaller
  ];
  const cells = tiles.map((t,i) =>
    `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="${rr}" fill="${colors[i]}" fill-opacity="0.85"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${cells}</svg>`;
}

function renderSunburstChartSVG(theme) {
  const W = 560, H = 300;
  const cx = W/2, cy = H/2;
  const R2 = Math.min(cx,cy)-12, R1 = R2*0.52, R0 = R1*0.52;
  const { c0 } = chartTokens(theme);
  const slice = (r1,r2,a1,a2,color,op=1) => {
    const cos = Math.cos, sin = Math.sin;
    const x1=cx+r2*cos(a1),y1=cy+r2*sin(a1),x2=cx+r2*cos(a2),y2=cy+r2*sin(a2);
    const x3=cx+r1*cos(a2),y3=cy+r1*sin(a2),x4=cx+r1*cos(a1),y4=cy+r1*sin(a1);
    const large=a2-a1>Math.PI?1:0;
    return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r2},${r2} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} A${r1},${r1} 0 ${large} 0 ${x4.toFixed(1)},${y4.toFixed(1)} Z" fill="${color}" fill-opacity="${op}" stroke="${theme.bg}" stroke-width="1.5"/>`;
  };
  const tau = Math.PI*2;
  // Inner ring (3 segments)
  const inner = [
    [0, .42*tau, c0],
    [.42*tau, .72*tau, theme.palette[1]||c0],
    [.72*tau, tau,     theme.palette[2]||c0],
  ].map(([a1,a2,col]) => slice(R0,R1,a1-Math.PI/2,a2-Math.PI/2,col));
  // Outer ring (6 segments)
  const outer = [
    [0,.20*tau],[.20*tau,.42*tau],[.42*tau,.56*tau],
    [.56*tau,.72*tau],[.72*tau,.86*tau],[.86*tau,tau],
  ].map(([a1,a2],i) => slice(R1,R2,a1-Math.PI/2,a2-Math.PI/2,theme.palette[i%theme.palette.length]||c0,0.7));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${inner.join('')}${outer.join('')}</svg>`;
}

function renderChordDiagramSVG(theme) {
  const W = 560, H = 300;
  const cx = W/2, cy = H/2, R = Math.min(cx,cy)-20, arcW = 16;
  const { c0 } = chartTokens(theme);
  const groups = [
    {a1:-.1,   a2:.55,  ci:0},
    {a1:.60,   a2:1.2,  ci:1},
    {a1:1.25,  a2:1.95, ci:2},
    {a1:2.0,   a2:2.8,  ci:3},
    {a1:2.85,  a2:3.6,  ci:0},
  ];
  const colors = [c0, theme.palette[1]||c0, theme.palette[2]||c0, theme.palette[3]||c0];
  const arc = (r1,r2,a1,a2,color) => {
    const cos=Math.cos, sin=Math.sin;
    const x1=cx+r2*cos(a1),y1=cy+r2*sin(a1),x2=cx+r2*cos(a2),y2=cy+r2*sin(a2);
    const x3=cx+r1*cos(a2),y3=cy+r1*sin(a2),x4=cx+r1*cos(a1),y4=cy+r1*sin(a1);
    const large=a2-a1>Math.PI?1:0;
    return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r2},${r2} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} A${r1},${r1} 0 ${large} 0 ${x4.toFixed(1)},${y4.toFixed(1)} Z" fill="${color}"/>`;
  };
  const arcs = groups.map(g => arc(R-arcW,R,g.a1,g.a2,colors[g.ci])).join('');
  // Simple chord ribbons (bezier from mid of one group to mid of another)
  const mid = g => (g.a1+g.a2)/2;
  const chords = [[0,2],[1,3],[0,4],[2,4],[1,2]].map(([i,j]) => {
    const a1=mid(groups[i]), a2=mid(groups[j]);
    const r=R-arcW-2;
    const x1=(cx+r*Math.cos(a1)).toFixed(1),y1=(cy+r*Math.sin(a1)).toFixed(1);
    const x2=(cx+r*Math.cos(a2)).toFixed(1),y2=(cy+r*Math.sin(a2)).toFixed(1);
    return `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" stroke="${colors[groups[i].ci]}" stroke-width="6" fill="none" stroke-opacity="0.25"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${chords}${arcs}</svg>`;
}

function renderSankeyDiagramSVG(theme) {
  const W = 560, H = 300;
  const { c0 } = chartTokens(theme);
  const c1=theme.palette[1]||c0, c2=theme.palette[2]||c0, c3=theme.palette[3]||c0;
  const pad = {left:40, right:40, top:20, bottom:20};
  const cW=W-pad.left-pad.right, cH=H-pad.top-pad.bottom;
  const nodeW=16, nodeGap=8;
  // Source nodes (left), target nodes (right)
  const sources = [{y:.05,h:.35,ci:0},{y:.45,h:.28,ci:1},{y:.78,h:.18,ci:2}];
  const targets = [{y:.02,h:.22,ci:0},{y:.28,h:.18,ci:1},{y:.50,h:.30,ci:2},{y:.85,h:.12,ci:3}];
  const colors=[c0,c1,c2,c3];
  const srcNodes = sources.map(n=>`<rect x="${pad.left}" y="${(pad.top+n.y*cH).toFixed(1)}" width="${nodeW}" height="${(n.h*cH).toFixed(1)}" rx="2" fill="${colors[n.ci]}"/>`).join('');
  const tgtNodes = targets.map(n=>`<rect x="${(W-pad.right-nodeW).toFixed(1)}" y="${(pad.top+n.y*cH).toFixed(1)}" width="${nodeW}" height="${(n.h*cH).toFixed(1)}" rx="2" fill="${colors[n.ci]}"/>`).join('');
  // Flows (bezier bands)
  const flows = [
    {si:0,ti:0,sh:.0,th:.0,sw:.5,tw:.5},
    {si:0,ti:2,sh:.5,th:.0,sw:.5,tw:.6},
    {si:1,ti:1,sh:.0,th:.0,sw:.5,tw:.5},
    {si:1,ti:2,sh:.5,th:.6,sw:.3,tw:.4},
    {si:2,ti:3,sh:.0,th:.0,sw:.5,tw:.5},
  ].map(f => {
    const s=sources[f.si], t=targets[f.ti];
    const x1=pad.left+nodeW, y1s=pad.top+(s.y+f.sh*s.h)*cH, y1e=pad.top+(s.y+f.sh*s.h+f.sw*s.h)*cH;
    const x2=W-pad.right-nodeW, y2s=pad.top+(t.y+f.th*t.h)*cH, y2e=pad.top+(t.y+f.th*t.h+f.tw*t.h)*cH;
    const mx=(x1+x2)/2;
    return `<path d="M${x1},${y1s.toFixed(1)} C${mx},${y1s.toFixed(1)} ${mx},${y2s.toFixed(1)} ${x2},${y2s.toFixed(1)} L${x2},${y2e.toFixed(1)} C${mx},${y2e.toFixed(1)} ${mx},${y1e.toFixed(1)} ${x1},${y1e.toFixed(1)} Z" fill="${colors[f.si]}" fill-opacity="0.25"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${flows}${srcNodes}${tgtNodes}</svg>`;
}

function renderNetworkGraphSVG(theme) {
  const W = 560, H = 300;
  const { c0 } = chartTokens(theme);
  const c1=theme.palette[1]||c0, c2=theme.palette[2]||c0;
  const dark = isColorDark(theme.bg);
  const edgeColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const nodes = [
    {x:.50,y:.50,r:14,ci:0},{x:.25,y:.28,r:10,ci:1},{x:.75,y:.25,r:11,ci:2},
    {x:.15,y:.68,r:8, ci:1},{x:.50,y:.82,r:9, ci:0},{x:.82,y:.65,r:10,ci:2},
    {x:.38,y:.16,r:7, ci:2},{x:.70,y:.78,r:7, ci:1},
  ];
  const edges = [[0,1],[0,2],[0,4],[0,5],[1,3],[1,6],[2,5],[2,6],[4,7]];
  const colors=[c0,c1,c2];
  const edgeLines = edges.map(([a,b]) => {
    const na=nodes[a], nb=nodes[b];
    return `<line x1="${(na.x*W).toFixed(1)}" y1="${(na.y*H).toFixed(1)}" x2="${(nb.x*W).toFixed(1)}" y2="${(nb.y*H).toFixed(1)}" stroke="${edgeColor}" stroke-width="1.5"/>`;
  }).join('');
  const nodeDots = nodes.map(n =>
    `<circle cx="${(n.x*W).toFixed(1)}" cy="${(n.y*H).toFixed(1)}" r="${n.r}" fill="${colors[n.ci]}" fill-opacity="0.85" stroke="${theme.bg}" stroke-width="1.5"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${edgeLines}${nodeDots}</svg>`;
}

function renderWordCloudSVG(theme) {
  const W = 560, H = 300;
  const { c0, font } = chartTokens(theme);
  const colors = [c0, theme.palette[1]||c0, theme.palette[2]||c0];
  const words = [
    {w:'data',     x:280, y:155, s:46, ci:0},
    {w:'visual',   x:148, y:122, s:28, ci:1},
    {w:'chart',    x:418, y:108, s:30, ci:2},
    {w:'analysis', x:135, y:212, s:20, ci:0},
    {w:'insight',  x:402, y:220, s:22, ci:1},
    {w:'metric',   x:272, y:252, s:17, ci:2},
    {w:'trend',    x:442, y:170, s:18, ci:0},
  ];
  const wds = words.map(w =>
    `<text x="${w.x}" y="${w.y}" text-anchor="middle" font-size="${w.s}" font-family="${font}" font-weight="${w.s>30?'700':'500'}" fill="${colors[w.ci]}" fill-opacity="0.85">${w.w}</text>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${wds}</svg>`;
}

function renderPictogramSVG(theme) {
  const W = 560, H = 300;
  const { c0, barRadius: r } = chartTokens(theme);
  const dark = isColorDark(theme.bg);
  const emptyFill = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const cols=6, rows=4, filled=15;
  const iconW=64, iconH=58, padX=(W-cols*iconW)/2, padY=(H-rows*iconH)/2;
  const rr = Math.min(r, 8);
  let icons = '';
  for (let row=0; row<rows; row++) {
    for (let col=0; col<cols; col++) {
      const idx=row*cols+col;
      const cx=padX+col*iconW+iconW/2, cy=padY+row*iconH+iconH/2;
      const color = idx<filled ? c0 : emptyFill;
      const op = idx<filled ? '0.85' : '1';
      icons += `<circle cx="${cx.toFixed(1)}" cy="${(cy-11).toFixed(1)}" r="8" fill="${color}" fill-opacity="${op}"/>`;
      icons += `<rect x="${(cx-10).toFixed(1)}" y="${(cy-1).toFixed(1)}" width="20" height="16" rx="${rr}" fill="${color}" fill-opacity="${op}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${icons}</svg>`;
}

function renderProportionalSymbolMapSVG(theme) {
  const W = 560, H = 300;
  const { c0 } = chartTokens(theme);
  const dark = isColorDark(theme.bg);
  const landFill = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  // Simplified world map outline (very rough rectangles for continents)
  const continents = [
    {x:40,y:60,w:120,h:120,rx:4},{x:210,y:50,w:100,h:140,rx:4},
    {x:320,y:40,w:180,h:100,rx:4},{x:330,y:160,w:60,h:80,rx:4},
    {x:80,y:200,w:80,h:70,rx:4},
  ];
  const land = continents.map(c => `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.rx}" fill="${landFill}" stroke="${borderColor}" stroke-width="1"/>`).join('');
  const symbols = [
    {x:280,y:120,r:28},{x:190,y:90,r:18},{x:360,y:80,r:22},
    {x:100,y:110,r:14},{x:360,y:200,r:12},{x:140,y:220,r:10},
    {x:460,y:90,r:16},{x:230,y:200,r:8},
  ].map(s => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${c0}" fill-opacity="0.45" stroke="${c0}" stroke-width="1.5" stroke-opacity="0.7"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${land}${symbols}</svg>`;
}

// World atlas TopoJSON — fetched once, cached
let _worldAtlas = null;
const _worldAtlasLoad = fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(r => r.json())
  .then(d => { _worldAtlas = d; })
  .catch(() => {});

// Sample data: ISO 3166-1 numeric → index value (0–100)
const _choroplethSample = {
  840:85, 124:82, 484:45, 76:62, 32:68, 152:65, 170:50, 604:42, 858:65, 862:35,
  826:80, 250:78, 276:82, 380:74, 724:74, 528:82, 752:88, 756:90, 578:86, 246:84,
  208:82, 40:76, 56:80, 620:68, 300:50, 616:58, 203:70, 348:62, 642:48, 100:44,
  804:38, 643:52, 792:55, 710:58, 566:30, 818:40, 504:44, 12:42, 788:42, 404:28,
  800:22, 834:25, 231:18, 288:32, 384:30, 716:22, 508:20, 682:68, 784:85, 634:72,
  414:75, 376:70, 364:42, 368:38, 156:72, 356:52, 392:88, 410:84, 36:82, 554:76,
  360:50, 764:52, 458:65, 702:88, 704:42, 608:45, 50:28, 586:38,
};

function renderChoroplethMapSVG(theme) {
  const W = 560, H = 300;
  const dark = isColorDark(theme.bg);

  if (!_worldAtlas) {
    // Atlas not ready yet — show placeholder and re-render once it arrives
    _worldAtlasLoad.then(() => {
      if (!_worldAtlas) return;
      const modal = document.getElementById('modal-chart');
      const card  = document.getElementById('preview-choropleth-map');
      if (modal && state.openVizId === 'choropleth-map') modal.innerHTML = renderChoroplethMapSVG(state.theme);
      if (card) card.innerHTML = renderChoroplethMapSVG(state.theme);
    });
    const muted = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const label = dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/><circle cx="280" cy="150" r="105" fill="none" stroke="${muted}" stroke-width="1"/><text x="280" y="156" text-anchor="middle" font-size="13" font-family="system-ui,sans-serif" fill="${label}">Loading map…</text></svg>`;
  }

  const { c0 } = chartTokens(theme);
  const hex = c0.replace('#', '');
  const r2 = parseInt(hex.slice(0,2),16), g2 = parseInt(hex.slice(2,4),16), b2 = parseInt(hex.slice(4,6),16);
  const r1 = dark ? 45 : 225, g1 = dark ? 45 : 225, b1 = dark ? 45 : 225;

  const vals = Object.values(_choroplethSample);
  const minV = Math.min(...vals), maxV = Math.max(...vals);

  function chorColor(id) {
    const v = _choroplethSample[id];
    if (v == null) return dark ? '#2c2c2c' : '#e4e4e4';
    const t = (v - minV) / (maxV - minV);
    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
  }

  const projection = d3.geoNaturalEarth1().fitSize([W, H], {type:'Sphere'});
  const pathGen    = d3.geoPath(projection);
  const countries  = topojson.feature(_worldAtlas, _worldAtlas.objects.countries);

  const oceanColor  = dark ? '#1a2535' : '#c5d8e8';
  const strokeColor = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)';
  const gratColor   = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const spherePath  = pathGen({type:'Sphere'});
  const gratPath    = pathGen(d3.geoGraticule()());

  const paths = countries.features.map(f => {
    const d = pathGen(f);
    if (!d) return '';
    return `<path d="${d}" fill="${chorColor(f.id)}" stroke="${strokeColor}" stroke-width="0.4"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    `<path d="${spherePath}" fill="${oceanColor}"/>` +
    `<path d="${gratPath}" fill="none" stroke="${gratColor}" stroke-width="0.5"/>` +
    paths +
    `<path d="${spherePath}" fill="none" stroke="${dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.18)'}" stroke-width="0.8"/>` +
    `</svg>`;
}

function renderGaugeChartSVG(theme) {
  const W = 560, H = 300;
  const cx = W/2, cy = H - 40; // center near bottom; top of arc = cy-R = 140 ✓
  const R = 120, sw = 22;
  const { textColor, c0 } = chartTokens(theme);
  const dark = isColorDark(theme.bg);
  const trackColor = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const value = 0.68;
  const sweepA = Math.PI + value * Math.PI;
  const fx = (cx + R * Math.cos(sweepA)).toFixed(1);
  const fy = (cy + R * Math.sin(sweepA)).toFixed(1);
  const track = `<path d="M${cx-R},${cy} A${R},${R} 0 0 1 ${cx+R},${cy}" stroke="${trackColor}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
  const fill  = `<path d="M${cx-R},${cy} A${R},${R} 0 0 1 ${fx},${fy}" stroke="${c0}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
  const nx = (cx + R * 0.68 * Math.cos(sweepA)).toFixed(1);
  const ny = (cy + R * 0.68 * Math.sin(sweepA)).toFixed(1);
  const needle = `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${textColor}" stroke-width="2.5" stroke-linecap="round"/>`;
  const hub = `<circle cx="${cx}" cy="${cy}" r="5" fill="${textColor}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${track}${fill}${needle}${hub}</svg>`;
}

function renderGanttChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 16, left: 16 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { gridColor, c0, barRadius: r } = chartTokens(theme);
  const c1=theme.palette[1]||c0, c2=theme.palette[2]||c0;
  const tasks = [
    {start:.02,end:.22,ci:0},{start:.18,end:.42,ci:1},
    {start:.30,end:.60,ci:0},{start:.55,end:.75,ci:2},
    {start:.50,end:.82,ci:0},{start:.78,end:.96,ci:1},
  ];
  const colors=[c0,c1,c2];
  const rowH = cH/tasks.length;
  const bH = Math.round(rowH*0.50);
  const rr = Math.min(r, 4);
  const grid = [0,.25,.5,.75,1].map(t => {
    const x = (pad.left+t*cW).toFixed(1);
    return `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top+cH}" stroke="${gridColor}" stroke-width="1"/>`;
  }).join('');
  const bars = tasks.map((t,i) => {
    const cy = pad.top + rowH*i + rowH/2;
    const x = pad.left + t.start*cW, w = (t.end-t.start)*cW, y = cy - bH/2;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${bH}" rx="${rr}" fill="${colors[t.ci]}" fill-opacity="0.85"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${bars}</svg>`;
}

function renderCandlestickChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, axisLabels, gridDash } = chartTokens(theme);
  const dark = isColorDark(theme.bg);
  const bullColor = c0;
  const bearColor = theme.palette[2] || theme.palette[1] || '#EF4444';
  const candles = [
    {o:.45,h:.58,l:.38,c:.54,bull:true},{o:.54,h:.62,l:.48,c:.60,bull:true},
    {o:.60,h:.65,l:.52,c:.55,bull:false},{o:.55,h:.60,l:.44,c:.48,bull:false},
    {o:.48,h:.55,l:.42,c:.52,bull:true},{o:.52,h:.68,l:.50,c:.65,bull:true},
    {o:.65,h:.72,l:.58,c:.70,bull:true},{o:.70,h:.74,l:.60,c:.62,bull:false},
  ];
  const slot = cW/candles.length, bW = Math.round(slot*0.55);
  const yP = v => pad.top + (1-v)*cH;
  const { ticks } = niceScale(1, 4);
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,.25,.5,.75,1].map(t => {
    const y = yP(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${gridColor}" stroke-width="1"${dash}/>`;
  }).join('');
  const cs = candles.map((c,i) => {
    const cx2 = pad.left + slot*i + slot/2;
    const x = cx2 - bW/2;
    const yO=yP(c.o), yC=yP(c.c), yH=yP(c.h), yL=yP(c.l);
    const bodyY = Math.min(yO,yC), bodyH = Math.abs(yO-yC);
    const color = c.bull ? bullColor : bearColor;
    const lbl = axisLabels && i%2===0 ? `<text x="${cx2.toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">W${i+1}</text>` : '';
    return `<line x1="${cx2.toFixed(1)}" y1="${yH.toFixed(1)}" x2="${cx2.toFixed(1)}" y2="${yL.toFixed(1)}" stroke="${color}" stroke-width="1.5"/>` +
      `<rect x="${x.toFixed(1)}" y="${bodyY.toFixed(1)}" width="${bW}" height="${Math.max(1,bodyH).toFixed(1)}" fill="${color}"/>` + lbl;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${cs}</svg>`;
}

function renderErrorBarChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 16, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, barRadius: r, gridDash, axisLabels } = chartTokens(theme);
  const data = [{l:'A',v:.62,e:.12},{l:'B',v:.45,e:.08},{l:'C',v:.78,e:.15},{l:'D',v:.38,e:.10},{l:'E',v:.55,e:.09}];
  const slot = cW/data.length, bW = Math.round(slot*0.45);
  const yP = v => pad.top + (1-v)*cH;
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const grid = [0,.25,.5,.75,1].map(t => {
    const y = yP(t).toFixed(1);
    return `<line x1="${pad.left}" y1="${y}" x2="${W-pad.right}" y2="${y}" stroke="${gridColor}" stroke-width="1"${dash}/>` +
      (axisLabels ? `<text x="${pad.left-6}" y="${(+y+4).toFixed(1)}" text-anchor="end" font-size="10" font-family="${font}" fill="${textColor}">${Math.round(t*100)}</text>` : '');
  }).join('');
  const bars = data.map((d,i) => {
    const cx2 = pad.left + slot*i + slot/2;
    const x = cx2 - bW/2;
    const yTop = yP(d.v), h = d.v*cH;
    const bar = r===0||h<=r
      ? `<rect x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${bW}" height="${h.toFixed(1)}" fill="${c0}" fill-opacity="0.75"/>`
      : `<path d="M${x.toFixed(1)},${(yTop+h).toFixed(1)} L${x.toFixed(1)},${(yTop+r).toFixed(1)} Q${x.toFixed(1)},${yTop.toFixed(1)} ${(x+r).toFixed(1)},${yTop.toFixed(1)} L${(x+bW-r).toFixed(1)},${yTop.toFixed(1)} Q${(x+bW).toFixed(1)},${yTop.toFixed(1)} ${(x+bW).toFixed(1)},${(yTop+r).toFixed(1)} L${(x+bW).toFixed(1)},${(yTop+h).toFixed(1)} Z" fill="${c0}" fill-opacity="0.75"/>`;
    const eH = d.e*cH;
    const errBar = `<line x1="${cx2.toFixed(1)}" y1="${(yTop-eH).toFixed(1)}" x2="${cx2.toFixed(1)}" y2="${(yTop+eH).toFixed(1)}" stroke="${c0}" stroke-width="2"/>` +
      `<line x1="${(cx2-bW*0.2).toFixed(1)}" y1="${(yTop-eH).toFixed(1)}" x2="${(cx2+bW*0.2).toFixed(1)}" y2="${(yTop-eH).toFixed(1)}" stroke="${c0}" stroke-width="1.5"/>` +
      `<line x1="${(cx2-bW*0.2).toFixed(1)}" y1="${(yTop+eH).toFixed(1)}" x2="${(cx2+bW*0.2).toFixed(1)}" y2="${(yTop+eH).toFixed(1)}" stroke="${c0}" stroke-width="1.5"/>`;
    const lbl = axisLabels ? `<text x="${cx2.toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="11" font-family="${font}" fill="${textColor}">${d.l}</text>` : '';
    return bar + errBar + lbl;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${grid}${bars}</svg>`;
}

function renderMarimekkoChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 20, right: 16, bottom: 30, left: 16 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, font, c0, barRadius: r } = chartTokens(theme);
  const c1=theme.palette[1]||c0, c2=theme.palette[2]||c0;
  // Each col has a width (market share) and 3 segments (proportional height)
  const cols = [
    {w:.30, segs:[.55,.30,.15]},
    {w:.25, segs:[.35,.40,.25]},
    {w:.28, segs:[.45,.25,.30]},
    {w:.17, segs:[.60,.20,.20]},
  ];
  const labels = ['Alpha','Beta','Gamma','Delta'];
  const colors = [c0,c1,c2];
  const rr = Math.min(r, 4);
  let xOff = pad.left;
  const bars = cols.map((col,ci) => {
    const bW = col.w*cW - 2;
    let yOff = pad.top;
    const segs = col.segs.map((s,si) => {
      const h = s*cH;
      const isTop = si === 0;
      const segEl = isTop && rr > 0
        ? `<path d="M${xOff.toFixed(1)},${(yOff+h).toFixed(1)} L${xOff.toFixed(1)},${(yOff+rr).toFixed(1)} Q${xOff.toFixed(1)},${yOff.toFixed(1)} ${(xOff+rr).toFixed(1)},${yOff.toFixed(1)} L${(xOff+bW-rr).toFixed(1)},${yOff.toFixed(1)} Q${(xOff+bW).toFixed(1)},${yOff.toFixed(1)} ${(xOff+bW).toFixed(1)},${(yOff+rr).toFixed(1)} L${(xOff+bW).toFixed(1)},${(yOff+h).toFixed(1)} Z" fill="${colors[si]}" fill-opacity="0.85"/>`
        : `<rect x="${xOff.toFixed(1)}" y="${yOff.toFixed(1)}" width="${bW.toFixed(1)}" height="${h.toFixed(1)}" fill="${colors[si]}" fill-opacity="0.85"/>`;
      yOff += h;
      return segEl;
    }).join('');
    const lbl = `<text x="${(xOff+bW/2).toFixed(1)}" y="${(pad.top+cH+16).toFixed(1)}" text-anchor="middle" font-size="10" font-family="${font}" fill="${textColor}">${labels[ci]}</text>`;
    xOff += col.w*cW;
    return segs + lbl;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${bars}</svg>`;
}

function renderSpanChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 24, bottom: 16, left: 80 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, font, c0, barRadius: r, gridDash, axisLabels } = chartTokens(theme);
  const c1=theme.palette[1]||c0;
  const rows = [
    {l:'Product A',lo:.15,hi:.72,ci:0},{l:'Product B',lo:.30,hi:.85,ci:1},
    {l:'Product C',lo:.08,hi:.55,ci:0},{l:'Product D',lo:.45,hi:.90,ci:1},
    {l:'Product E',lo:.22,hi:.68,ci:0},
  ];
  const rowH = cH/rows.length, bH = Math.round(rowH*0.35);
  const colors=[c0,c1];
  const rr = Math.min(r, 4);
  const dash = gridDash ? ` stroke-dasharray="${gridDash}"` : '';
  const vLines = [0,.25,.5,.75,1].map(t =>
    `<line x1="${(pad.left+t*cW).toFixed(1)}" y1="${pad.top}" x2="${(pad.left+t*cW).toFixed(1)}" y2="${pad.top+cH}" stroke="${gridColor}" stroke-width="1"${dash}/>`
  ).join('');
  const bars = rows.map((row,i) => {
    const cy = pad.top + rowH*i + rowH/2;
    const x = pad.left + row.lo*cW, w = (row.hi-row.lo)*cW, y = cy - bH/2;
    const lbl = axisLabels ? `<text x="${pad.left-8}" y="${(cy+4).toFixed(1)}" text-anchor="end" font-size="11" font-family="${font}" fill="${textColor}">${row.l}</text>` : '';
    return lbl +
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${bH}" rx="${rr}" fill="${colors[row.ci]}" fill-opacity="0.75"/>` +
      `<circle cx="${x.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="${colors[row.ci]}" stroke="${theme.bg}" stroke-width="1.5"/>` +
      `<circle cx="${(x+w).toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="${colors[row.ci]}" stroke="${theme.bg}" stroke-width="1.5"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%"><rect width="${W}" height="${H}" fill="${theme.bg}"/>${vLines}${bars}</svg>`;
}

const CUSTOM_RENDERERS = {
  'bar-chart':              renderBarChartSVG,
  'line-chart':             renderLineChartSVG,
  'scatter-plot':           renderScatterChartSVG,
  'area-chart':             renderAreaChartSVG,
  'pie-chart':              renderPieChartSVG,
  'donut-chart':            renderDonutChartSVG,
  'grouped-bar-chart':      renderGroupedBarChartSVG,
  'data-table':             renderTableChartSVG,
  'histogram':              renderHistogramSVG,
  'stacked-bar-chart':      renderStackedBarChartSVG,
  'stacked-bar-100':        renderStackedBar100SVG,
  'waterfall-chart':        renderWaterfallChartSVG,
  'bullet-chart':           renderBulletChartSVG,
  'funnel-chart':           renderFunnelChartSVG,
  'lollipop-chart':         renderLollipopChartSVG,
  'dumbbell-chart':         renderDumbbellChartSVG,
  'bubble-chart':           renderBubbleChartSVG,
  'dot-plot':               renderDotPlotSVG,
  'strip-plot':             renderStripPlotSVG,
  'sparkline':              renderSparklineSVG,
  'step-chart':             renderStepChartSVG,
  'slope-chart':            renderSlopeChartSVG,
  'bump-chart':             renderBumpChartSVG,
  'stacked-area-chart':     renderStackedAreaChartSVG,
  'streamgraph':            renderStreamgraphSVG,
  'connected-scatter-plot': renderConnectedScatterSVG,
  'box-plot':               renderBoxPlotSVG,
  'violin-plot':            renderViolinPlotSVG,
  'density-plot':           renderDensityPlotSVG,
  'ridge-plot':             renderRidgePlotSVG,
  'parallel-coordinates':   renderParallelCoordsSVG,
  'waffle-chart':           renderWaffleChartSVG,
  'heatmap':                renderHeatmapSVG,
  'calendar-heatmap':       renderCalendarHeatmapSVG,
  'beeswarm-plot':          renderBeeswarmPlotSVG,
  'radar-chart':            renderRadarChartSVG,
  'treemap':                renderTreemapSVG,
  'sunburst-chart':         renderSunburstChartSVG,
  'chord-diagram':          renderChordDiagramSVG,
  'sankey-diagram':         renderSankeyDiagramSVG,
  'network-graph':          renderNetworkGraphSVG,
  'word-cloud':             renderWordCloudSVG,
  'pictogram':              renderPictogramSVG,
  'proportional-symbol-map': renderProportionalSymbolMapSVG,
  'choropleth-map':         renderChoroplethMapSVG,
  'gauge-chart':            renderGaugeChartSVG,
  'gantt-chart':            renderGanttChartSVG,
  'candlestick-chart':      renderCandlestickChartSVG,
  'error-bar-chart':        renderErrorBarChartSVG,
  'marimekko-chart':        renderMarimekkoChartSVG,
  'span-chart':             renderSpanChartSVG,
};

function renderCustomChart(vizId, container, theme) {
  const fn = CUSTOM_RENDERERS[vizId];
  if (!fn) return false;
  container.innerHTML = fn(theme);
  return true;
}

/* ── Build tab ───────────────────────────────────────────────────────────── */
let currentBuildData = [];
let buildListenersReady = false;
let _buildSchemaCols = [
  { key: 'label', label: 'Category', type: 'string', required: true, example: 'Apples' },
  { key: 'value', label: 'Value',    type: 'number', required: true, example: '85'     },
];

function _buildParseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const rows = lines.map(l => l.split(',').map(s => s.trim()));
  const numericIdxs = _buildSchemaCols.map((c, i) => c.type === 'number' ? i : -1).filter(i => i >= 0);
  const hasHeader = numericIdxs.length ? numericIdxs.some(i => isNaN(rows[0]?.[i])) : isNaN(parseFloat(rows[0]?.[1]));
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows
    .map(r => {
      const row = {};
      _buildSchemaCols.forEach((col, i) => { row[col.key] = col.type === 'number' ? parseFloat(r[i]) : (r[i] || ''); });
      return row;
    })
    .filter(r => _buildSchemaCols.filter(c => c.required).every(c =>
      c.type === 'number' ? !isNaN(r[c.key]) : r[c.key] !== ''
    ));
}

function onBuildDataChange(rows) {
  currentBuildData = rows;
  const btn = document.getElementById('build-chart-btn');
  if (btn) btn.disabled = rows.length < 2;
  const preview = document.getElementById('build-tab-preview');
  if (preview) {
    if (rows.length >= 2 && state.openVizId === 'bar-chart') {
      // Bar chart preview uses legacy label-value rows
      preview.innerHTML = renderBarChartSVG(state.theme, rows.map(r => ({ l: r.label, v: r.value })));
    } else {
      preview.innerHTML = '';
    }
  }
}

function addManualRow(tbody, rowData) {
  const tr = document.createElement('tr');
  const cells = _buildSchemaCols.map(col => {
    const val = rowData?.[col.key] ?? '';
    const type = col.type === 'number' ? 'number' : 'text';
    const displayVal = val !== '' ? String(val).replace(/"/g, '&quot;') : '';
    return `<td><input class="manual-cell${type === 'number' ? ' manual-cell--num' : ''}" type="${type}" placeholder="${col.label}" value="${displayVal}"/></td>`;
  }).join('');
  tr.innerHTML = cells + `<td><button class="manual-del-btn" aria-label="Remove row">×</button></td>`;
  tr.querySelector('.manual-del-btn').addEventListener('click', () => { tr.remove(); syncManualData(); });
  tr.querySelectorAll('.manual-cell').forEach(inp => inp.addEventListener('input', syncManualData));
  tbody.appendChild(tr);
}

function syncManualData() {
  const rows = [...document.querySelectorAll('#manual-table tbody tr')].map(tr => {
    const cells = tr.querySelectorAll('.manual-cell');
    const row = {};
    _buildSchemaCols.forEach((col, i) => {
      const val = cells[i]?.value;
      row[col.key] = col.type === 'number' ? parseFloat(val) : (val?.trim() || '');
    });
    return row;
  }).filter(r => _buildSchemaCols.filter(c => c.required).every(c =>
    c.type === 'number' ? !isNaN(r[c.key]) : r[c.key] !== ''
  ));
  onBuildDataChange(rows);
}

function initBuildTab() {
  // Load schema for current chart
  const schema = typeof CHART_SCHEMAS !== 'undefined' ? CHART_SCHEMAS[state.openVizId] : null;
  _buildSchemaCols = schema
    ? schema.columns.filter(c => !c.multiple)
    : [{ key: 'label', label: 'Category', type: 'string', required: true, example: 'Apples' },
       { key: 'value', label: 'Value',    type: 'number', required: true, example: '85'     }];

  // Update manual table headers
  const thead = document.querySelector('#manual-table thead tr');
  if (thead) thead.innerHTML = _buildSchemaCols.map(c => {
    const tip = c.tooltip ? `<span class="col-tip" data-tip="${(c.tooltip||'').replace(/"/g,'&quot;')}">i</span>` : '';
    return `<th>${c.label}${tip}</th>`;
  }).join('') + '<th></th>';

  // Update CSV paste placeholder
  const csvPaste = document.getElementById('csv-paste');
  if (csvPaste) {
    const exRow = _buildSchemaCols.map(c => c.example ?? (c.type === 'number' ? '0' : 'Item')).join(',');
    csvPaste.placeholder = _buildSchemaCols.map(c => c.label).join(',') + '\n' + exRow;
    csvPaste.value = '';
  }

  // Reset UI state
  currentBuildData = [];
  const preview = document.getElementById('build-tab-preview');
  if (preview) preview.innerHTML = '';
  const btn = document.getElementById('build-chart-btn');
  if (btn) btn.disabled = true;

  // Reset to Paste tab
  document.querySelectorAll('.data-tab').forEach(t => t.classList.toggle('active', t.dataset.input === 'paste'));
  $('input-paste').hidden = false;
  $('input-upload').hidden = true;
  $('input-manual').hidden = true;

  // Seed manual table with example rows
  const tbody = document.querySelector('#manual-table tbody');
  if (tbody) {
    tbody.innerHTML = '';
    // Two starter rows using schema examples
    for (let i = 0; i < 2; i++) {
      const row = {};
      _buildSchemaCols.forEach(c => {
        row[c.key] = c.type === 'number' ? (parseFloat(c.example) || 0) : (i === 0 ? (c.example || '') : '');
      });
      addManualRow(tbody, row);
    }
  }

  const fileInput = document.getElementById('csv-file-input');
  if (fileInput) fileInput.value = '';
  const filename = document.getElementById('upload-filename');
  if (filename) { filename.textContent = ''; filename.hidden = true; }

  if (buildListenersReady) return;
  buildListenersReady = true;

  // Input method tabs
  document.querySelectorAll('.data-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.input;
      document.querySelectorAll('.data-tab').forEach(t => t.classList.toggle('active', t === tab));
      $('input-paste').hidden = mode !== 'paste';
      $('input-upload').hidden = mode !== 'upload';
      $('input-manual').hidden = mode !== 'manual';
      if (mode === 'paste') onBuildDataChange(_buildParseCSV(document.getElementById('csv-paste').value));
      else if (mode === 'manual') syncManualData();
    });
  });

  // Paste CSV
  document.getElementById('csv-paste').addEventListener('input', e => onBuildDataChange(_buildParseCSV(e.target.value)));

  // File upload
  document.getElementById('csv-file-input').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const fn = document.getElementById('upload-filename');
    fn.textContent = file.name; fn.hidden = false;
    const reader = new FileReader();
    reader.onload = ev => onBuildDataChange(_buildParseCSV(ev.target.result));
    reader.readAsText(file);
  });

  // Drag-and-drop on upload area
  const uploadLabel = document.getElementById('csv-upload-label');
  uploadLabel.addEventListener('dragover', e => { e.preventDefault(); uploadLabel.classList.add('drag-over'); });
  uploadLabel.addEventListener('dragleave', () => uploadLabel.classList.remove('drag-over'));
  uploadLabel.addEventListener('drop', e => {
    e.preventDefault(); uploadLabel.classList.remove('drag-over');
    const file = e.dataTransfer.files[0]; if (!file) return;
    const fn = document.getElementById('upload-filename');
    fn.textContent = file.name; fn.hidden = false;
    const reader = new FileReader();
    reader.onload = ev => onBuildDataChange(_buildParseCSV(ev.target.result));
    reader.readAsText(file);
  });

  // Add row
  document.getElementById('add-row-btn').addEventListener('click', () => {
    addManualRow(document.querySelector('#manual-table tbody'), null);
    syncManualData();
  });

  // Build Chart → navigate to builder
  document.getElementById('build-chart-btn').addEventListener('click', () => {
    if (!currentBuildData.length) return;
    const payload = JSON.stringify({
      chartId: state.openVizId,
      data: currentBuildData,
      theme: state.theme,
      chartStyle: state.chartStyle,
    });
    // Write to both storages: sessionStorage for compatibility,
    // localStorage to seed the builder's refresh-persist store (fresh session overwrites old)
    sessionStorage.setItem('builderState', payload);
    localStorage.setItem('builderState_' + state.openVizId, payload);
    window.location.href = 'builder.html';
  });
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
function openModal(vizId) {
  const viz = state.catalog.find(v => v.id === vizId);
  if (!viz) return;

  state.openVizId = vizId;

  // Enable Build tab for any builderReady chart
  const _buildTab = document.querySelector('.modal-tab[data-tab="build"]');
  const _soonPill = _buildTab.querySelector('.coming-soon-pill');
  const _builderReady = typeof CHART_SCHEMAS !== 'undefined' && CHART_SCHEMAS[vizId]?.builderReady;
  _buildTab.disabled = !_builderReady;
  if (_soonPill) _soonPill.style.display = _builderReady ? 'none' : '';
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'explore'));
  $('modal-tab-explore').hidden = false;
  $('modal-tab-build').hidden = true;

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
    }).filter(Boolean).join('');
    modalAlso.innerHTML = `<span class="also-see-label">Also see</span>${links}`;
    modalAlso.querySelectorAll('.also-see-link').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); openModal(a.dataset.vizId); });
    });
  } else {
    modalAlso.innerHTML = '';
  }

  // Chart
  modalChart.innerHTML = '';
  if (!renderCustomChart(vizId, modalChart, state.theme)) {
    const spec = getVegaSpec(vizId, false);
    if (spec) {
      spec.config = buildVegaConfig(state.theme, false);
      spec.background = state.theme.bg;
      spec.width = 'container';
      spec.autosize = { type: 'fit', resize: true };
      vegaEmbed(modalChart, spec, { actions: false, renderer: 'svg' }).catch(() => {});
    }
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
    if (tab.dataset.tab === 'build') initBuildTab();
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

/* ── Chart style picker ──────────────────────────────────────────────────── */
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.chartStyle = btn.dataset.style;
    document.querySelectorAll('.style-btn').forEach(b => b.classList.toggle('active', b === btn));
    // Re-render all visible cards
    state.catalog.forEach(v => renderCardChart(v.id));
    // Re-render open modal if any
    if (state.openVizId) {
      modalChart.innerHTML = '';
      if (!renderCustomChart(state.openVizId, modalChart, state.theme)) {
        const spec = getVegaSpec(state.openVizId, false);
        if (spec) {
          spec.config = buildVegaConfig(state.theme, false);
          spec.background = state.theme.bg;
          spec.width = 'container';
          spec.autosize = { type: 'fit', resize: true };
          vegaEmbed(modalChart, spec, { actions: false, renderer: 'svg' }).catch(() => {});
        }
      }
    }
  });
});

/* ── Site mode toggle ────────────────────────────────────────────────────── */
document.querySelectorAll('.site-mode-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const isDark = btn.dataset.mode === 'dark';
    document.body.classList.toggle('site-dark', isDark);
    document.querySelectorAll('.site-mode-opt').forEach(b =>
      b.classList.toggle('active', b === btn)
    );
  });
});

/* ── Theme ───────────────────────────────────────────────────────────────── */
if (colorBg) colorBg.addEventListener('input', () => {
  state.theme.bg = colorBg.value;
  colorBgHex.textContent = colorBg.value;
  saveCustomTheme();
  applyTheme();
});

if (fontSelect) fontSelect.addEventListener('change', () => {
  state.theme.font = fontSelect.value;
  saveCustomTheme();
  applyTheme();
});

/* ── Catalog inline controls ─────────────────────────────────────────────── */
const catalogThemeSel = document.getElementById('catalog-theme-select');
const catalogStyleSel = document.getElementById('catalog-style-select');
if (catalogThemeSel) {
  catalogThemeSel.addEventListener('change', () => {
    applyPreset(catalogThemeSel.value);
    if (catalogStyleSel) catalogStyleSel.value = state.chartStyle;
  });
}
if (catalogStyleSel) {
  catalogStyleSel.addEventListener('change', () => {
    state.chartStyle = catalogStyleSel.value;
    state.catalog.forEach(v => renderCardChart(v.id));
    if (state.openVizId) {
      modalChart.innerHTML = '';
      if (!renderCustomChart(state.openVizId, modalChart, state.theme)) {
        const spec = getVegaSpec(state.openVizId, false);
        if (spec) {
          spec.config = buildVegaConfig(state.theme, false);
          spec.background = state.theme.bg;
          spec.width = 'container';
          spec.autosize = { type: 'fit', resize: true };
          vegaEmbed(modalChart, spec, { actions: false, renderer: 'svg' }).catch(() => {});
        }
      }
    }
  });
}

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
  Object.assign(state.theme, { ...preset, palette: [...preset.palette] });
  if (colorBg) { colorBg.value = preset.bg; colorBgHex.textContent = preset.bg; }
  if (fontSelect) fontSelect.value = preset.font;
  if (paletteSwatches) renderPaletteSwatches();
  const customControls = document.getElementById('custom-controls');
  if (customControls) customControls.style.display = name === 'custom' ? '' : 'none';
  // Journeys preset → auto-apply Journeys chart style
  if (name === 'journeys') {
    state.chartStyle = 'journeys';
    document.querySelectorAll('.style-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.style === 'journeys')
    );
  }
  applyTheme();
}

function saveCustomTheme() {
  PRESETS.custom = { ...state.theme, palette: [...state.theme.palette] };
  sessionStorage.setItem('customTheme', JSON.stringify(PRESETS.custom));
  // Update mini swatches on the Custom button
  const mini = document.getElementById('custom-swatches-mini');
  if (mini) {
    mini.innerHTML = state.theme.palette.slice(0, 4).map(c => `<span style="background:${c}"></span>`).join('');
  }
}

function syncStyleBtnColors() {
  const c = state.theme.palette[0];
  document.querySelectorAll('.style-btn svg').forEach(svg => { svg.style.color = c; });
}

function applyTheme() {
  syncStyleBtnColors();
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
    if (!renderCustomChart(state.openVizId, modalChart, state.theme)) {
      const spec = getVegaSpec(state.openVizId, false);
      if (spec) {
        spec.config = buildVegaConfig(state.theme, false);
        spec.background = state.theme.bg;
        spec.width = 'container';
        spec.autosize = { type: 'fit', resize: true };
        vegaEmbed(modalChart, spec, { actions: false, renderer: 'svg' }).catch(() => {});
      }
    }
  }
}

/* ── Palette swatches ────────────────────────────────────────────────────── */
function renderPaletteSwatches() {
  paletteSwatches.innerHTML = '';
  updatePaletteSuggestions();
  state.theme.palette.forEach((color, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'palette-swatch-wrap';

    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'palette-swatch';
    input.value = color;
    input.addEventListener('input', () => {
      state.theme.palette[i] = input.value;
      updatePaletteSuggestions();
      saveCustomTheme();
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
        saveCustomTheme();
        applyTheme();
      }
    });

    wrap.appendChild(input);
    wrap.appendChild(removeBtn);
    paletteSwatches.appendChild(wrap);
  });
}

if (addPaletteColor) addPaletteColor.addEventListener('click', () => {
  if (state.theme.palette.length < 10) {
    state.theme.palette.push('#888888');
    renderPaletteSwatches();
    saveCustomTheme();
  }
});

/* ── Colour harmony ──────────────────────────────────────────────────────── */
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max-min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  const hue2rgb = (p,q,t) => {
    if(t<0)t+=1; if(t>1)t-=1;
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  let r,g,b;
  if(s===0) { r=g=b=l; } else {
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function generateHarmonies(palette) {
  const n = palette.length;
  const hsls = palette.map(hexToHsl);
  const clamp = (v,lo,hi) => Math.min(Math.max(v,lo),hi);

  // Use average S/L of the current palette as baseline
  const avgS = clamp(hsls.reduce((s,h)=>s+h[1],0)/n, 45, 88);
  const avgL = clamp(hsls.reduce((s,h)=>s+h[2],0)/n, 32, 68);
  const make = (hDeg, ds=0, dl=0) =>
    hslToHex(((hDeg%360)+360)%360, clamp(avgS+ds,20,95), clamp(avgL+dl,20,80));

  const h0 = hsls[0][0];

  // Detect whether the user has set 2+ meaningfully distinct hues
  const distinctHues = hsls.filter(h => Math.abs(((h[0]-h0+180+360)%360)-180) > 10);
  const isMultiColor = distinctHues.length >= 1;

  if (!isMultiColor) {
    // ── Single-anchor mode ──────────────────────────────────────────────────
    const spread = Array.from({length:n}, (_,i) => make(h0 + (360/n)*i));
    const analogOffsets = [0, 25, -25, 50, -50, 75];
    const analogous = Array.from({length:n}, (_,i) =>
      make(h0 + analogOffsets[i%analogOffsets.length], 0, i%2===0?0:i%4===1?8:-8));
    const compOffsets = [0, 180, 30, 210, 90, 270];
    const complementary = Array.from({length:n}, (_,i) =>
      make(h0 + compOffsets[i%compOffsets.length]));
    return [
      { label: 'Even spread',    colors: spread },
      { label: 'Analogous',      colors: analogous },
      { label: 'Complementary',  colors: complementary },
    ];
  }

  // ── Multi-anchor mode ─────────────────────────────────────────────────────
  // Detect the signed step between the first two distinct hues
  const h1 = hsls[1][0];
  const rawDiff = (h1 - h0 + 360) % 360;
  const step = rawDiff <= 180 ? rawDiff : rawDiff - 360; // signed: -180..180

  // Strategy 1 — Continue: extend the detected step uniformly
  const continued = Array.from({length:n}, (_,i) => make(h0 + step*i));

  // Strategy 2 — Redistribute: spread all n slots evenly in the detected direction
  const evenStep = step >= 0 ? 360/n : -360/n;
  const redistributed = Array.from({length:n}, (_,i) => make(h0 + evenStep*i));

  // Strategy 3 — Symmetric: mirror the step on both sides of the anchor
  const symmetric = Array.from({length:n}, (_,i) => {
    const side = i%2===0 ? 1 : -1;
    return make(h0 + side * step * Math.ceil(i/2));
  });

  return [
    { label: 'Continue pattern', colors: continued },
    { label: 'Redistribute',     colors: redistributed },
    { label: 'Symmetric',        colors: symmetric },
  ];
}

function updatePaletteSuggestions() {
  const wrap = document.getElementById('palette-suggestions');
  const list = document.getElementById('suggestion-list');
  const harmonies = generateHarmonies(state.theme.palette);
  list.innerHTML = '';
  harmonies.forEach(({ label, colors }) => {
    const row = document.createElement('div');
    row.className = 'suggestion-row';
    row.innerHTML =
      `<div class="suggestion-dots">${colors.map(c=>`<span class="suggestion-dot" style="background:${c}"></span>`).join('')}</div>` +
      `<span class="suggestion-label">${label}</span>`;
    row.addEventListener('click', () => {
      state.theme.palette = [...colors];
      renderPaletteSwatches();
      saveCustomTheme();
      applyTheme();
    });
    list.appendChild(row);
  });
  wrap.style.display = '';
}

/* ── Saved palettes ──────────────────────────────────────────────────────── */
function renderSavedPresets() {
  const container = document.getElementById('saved-presets-container');
  container.innerHTML = '';
  state.savedPalettes.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.dataset.preset = `saved-${i}`;
    btn.title = p.name;
    const mini = p.palette.slice(0, 4).map(c => `<span style="background:${c}"></span>`).join('');
    btn.innerHTML = `<span class="preset-swatches-mini">${mini}</span><span>${p.name}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.assign(state.theme, { ...p, palette: [...p.palette] });
      colorAccent.value = p.accent;
      colorAccentHex.textContent = p.accent;
      colorBg.value = p.bg;
      colorBgHex.textContent = p.bg;
      fontSelect.value = p.font;
      renderPaletteSwatches();
      document.getElementById('custom-controls').style.display = 'none';
      applyTheme();
    });
    container.appendChild(btn);
  });
}

document.getElementById('save-palette-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('palette-name-input');
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }

  const saved = { ...state.theme, palette: [...state.theme.palette], name };
  state.savedPalettes.push(saved);
  sessionStorage.setItem('savedPalettes', JSON.stringify(state.savedPalettes));

  renderSavedPresets();

  // Activate the newly saved preset button
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('saved-presets-container').lastElementChild.classList.add('active');
  document.getElementById('custom-controls').style.display = 'none';

  // Reset Custom to default for next time
  PRESETS.custom = { ...PRESETS.default, palette: [...PRESETS.default.palette] };
  sessionStorage.setItem('customTheme', JSON.stringify(PRESETS.custom));
  nameInput.value = '';
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

// Polyfill for requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || (cb => setTimeout(() => cb({ timeRemaining: () => 50 }), 1));

/* ── Boot ────────────────────────────────────────────────────────────────── */
renderSavedPresets();
loadCatalog();
