/* ── app.js ───────────────────────────────────────────────────────────────── */

/* ── State ───────────────────────────────────────────────────────────────── */
const state = {
  catalog: [],
  fuse: null,
  activeFilter: 'all',
  dataStructure: '',
  goal: '',
  theme: {
    bg: '#ffffff',
    palette: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    font: 'Inter',
  },
  openVizId: null,
  vegaViews: {}, // card id → vega view, for re-theming
  savedPalettes: JSON.parse(sessionStorage.getItem('savedPalettes') || '[]'),
  chartStyle: 'modern',
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
    bg: '#F0F7FC',
    palette: ['#29ABE2', '#26C6A0', '#F44336', '#E91E8C', '#7B3FC4', '#5C2D91'],
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
  journeys:  { name:'Journeys', barRadius:12, lineSmooth:true,  lineDots:true,  areaFill:'gradient', gridScale:0,   gridDash:'',    strokeW:2.5, fontOverride:"'Graphik', 'Inter', sans-serif",               glow:false, axisLabels:true  },
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
  const res = await fetch('data/catalog.json?v=37');
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
    axisLabels: sty.axisLabels,
  };
}

function renderBarChartSVG(theme) {
  const W = 560, H = 300;
  const pad = { top: 16, right: 16, bottom: 40, left: 50 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const { textColor, gridColor, baseColor, font, c0, barRadius, gridDash, axisLabels, glow } = chartTokens(theme);

  const data = [
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
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';

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
  const { textColor, gridColor, baseColor, font, c0, lineSmooth, lineDots, areaFill, strokeW, gridDash, axisLabels, glow } = chartTokens(theme);

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
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
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
  const { textColor, gridColor, baseColor, font, c0, gridDash, axisLabels, glow } = chartTokens(theme);
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
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
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
  const { textColor, gridColor, baseColor, font, c0, lineSmooth, areaFill, strokeW, gridDash, axisLabels, glow } = chartTokens(theme);
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
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
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
  const { font, glow, axisLabels } = chartTokens(theme);
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

  const sliceSVG = slices.map(s =>
    `<path d="${s.path}" fill="${s.color}" stroke="${theme.bg}" stroke-width="2"/>`
  ).join('');

  const labelsSVG = axisLabels ? slices.filter(s => s.pct >= 12).map(s => {
    const anchor = s.lx < cx - 4 ? 'end' : s.lx > cx + 4 ? 'start' : 'middle';
    return `<text x="${s.lx.toFixed(1)}" y="${(s.ly + 4).toFixed(1)}" text-anchor="${anchor}" font-size="12" font-weight="600" font-family="${font}" fill="${s.color}">${s.pct}%</text>`;
  }).join('') : '';

  const fid = glow ? 'gf' + Math.random().toString(36).slice(2, 7) : '';
  const filterDef = glow ? `<filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  const glowAttr = glow ? ` filter="url(#${fid})"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="display:block;width:100%">` +
    `<rect width="${W}" height="${H}" fill="${theme.bg}"/>` +
    (filterDef ? `<defs>${filterDef}</defs>` : '') +
    `<g${glowAttr}>${sliceSVG}</g>${labelsSVG}</svg>`;
}

function renderDonutChartSVG(theme) {
  const W = 560, H = 300;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(cx, cy) - 22, innerR = r * 0.54;
  const { font, textColor, glow } = chartTokens(theme);
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
  const filterDef = glow ? `<filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
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
  const { textColor, gridColor, baseColor, font, barRadius, gridDash, axisLabels, glow } = chartTokens(theme);
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
  const filterDef = glow ? `<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';

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

const CUSTOM_RENDERERS = {
  'bar-chart':         renderBarChartSVG,
  'line-chart':        renderLineChartSVG,
  'scatter-plot':      renderScatterChartSVG,
  'area-chart':        renderAreaChartSVG,
  'pie-chart':         renderPieChartSVG,
  'donut-chart':       renderDonutChartSVG,
  'grouped-bar-chart': renderGroupedBarChartSVG,
  'data-table':        renderTableChartSVG,
};

function renderCustomChart(vizId, container, theme) {
  const fn = CUSTOM_RENDERERS[vizId];
  if (!fn) return false;
  container.innerHTML = fn(theme);
  return true;
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
colorBg.addEventListener('input', () => {
  state.theme.bg = colorBg.value;
  colorBgHex.textContent = colorBg.value;
  saveCustomTheme();
  applyTheme();
});

fontSelect.addEventListener('change', () => {
  state.theme.font = fontSelect.value;
  saveCustomTheme();
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
  Object.assign(state.theme, { ...preset, palette: [...preset.palette] });
  colorBg.value = preset.bg;
  colorBgHex.textContent = preset.bg;
  fontSelect.value = preset.font;
  renderPaletteSwatches();
  document.getElementById('custom-controls').style.display = name === 'custom' ? '' : 'none';
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

addPaletteColor.addEventListener('click', () => {
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
