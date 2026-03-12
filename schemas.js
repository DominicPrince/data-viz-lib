/**
 * schemas.js — Data shape & builder configuration for all 51 chart types.
 *
 * Each entry defines:
 *   dataShape     — one of the canonical shapes below; determines builder data-entry UI
 *   builderReady  — true when the builder fully supports this chart today
 *   columns       — ordered column definitions for data entry and CSV parsing
 *     .key        — programmatic field name
 *     .label      — display name shown in the data table header
 *     .type       — 'string' | 'number' | 'date' | 'any'
 *     .required   — whether the column must be present
 *     .multiple   — true for variable-count series columns (grouped bar, etc.)
 *     .minCount   — minimum number of series when multiple=true
 *     .example    — placeholder / example value shown in the data table
 *   csvHint       — example CSV shown in the Paste CSV textarea
 *   config        — which config panel controls to show in the builder
 *     .axes       — { xLabel, yLabel, xMin, xMax, yMin, yMax }
 *     .sort       — sortable category axis
 *     .showValues — value label toggle
 *     .showLegend — legend toggle
 *     .colorScheme— 'sequential' | 'diverging' | 'categorical'
 *     .region     — map region selector (World / Europe / Americas / Africa / APAC)
 *   notes         — implementation notes / data format guidance
 *
 * ── Data shapes ────────────────────────────────────────────────────────────
 *   label-value        bar, lollipop, pie, donut, waffle, funnel, dot-plot,
 *                      word-cloud, pictogram, waterfall
 *   single-value       histogram, density-plot, gauge
 *   time-value         line, area, step, sparkline
 *   xy                 scatter
 *   xy-size            bubble
 *   xy-ordered         connected-scatter
 *   label-two-values   dumbbell, slope
 *   label-range        span
 *   label-value-error  error-bar
 *   label-value-target bullet
 *   multi-series       grouped-bar, stacked-bar, stacked-bar-100, radar,
 *                      parallel-coordinates
 *   time-multi-series  stacked-area, streamgraph, bump
 *   matrix             heatmap
 *   date-value         calendar-heatmap
 *   distribution       box-plot, violin, strip, beeswarm, ridge
 *   location           choropleth, proportional-symbol
 *   hierarchy          treemap, sunburst
 *   hierarchy-2d       marimekko
 *   flow               sankey, chord
 *   network            network-graph
 *   ohlcv              candlestick
 *   timeline           gantt
 *   tabular            data-table
 */

const CHART_SCHEMAS = {

  // ── Label → Value ──────────────────────────────────────────────────────────
  // Simplest shape. Bar chart builder is the reference implementation.
  // All others in this group share the same data-entry UI.

  'bar-chart': {
    name: 'Bar Chart',
    dataShape: 'label-value',
    builderReady: true,
    columns: [
      { key: 'label', label: 'Category', type: 'string', required: true,  example: 'Apples'  },
      { key: 'value', label: 'Value',    type: 'number', required: true,  example: '85'      },
    ],
    csvHint: 'Category,Value\nApples,85\nOranges,62\nBananas,108\nGrapes,47',
    config: {
      axes:       { xLabel: true, yLabel: true, yMin: true, yMax: false },
      sort:       true,
      showValues: true,
    },
  },

  'lollipop-chart': {
    name: 'Lollipop Chart',
    dataShape: 'label-value',
    builderReady: true,
    columns: [
      { key: 'label', label: 'Category', type: 'string', required: true,  example: 'Apples' },
      { key: 'value', label: 'Value',    type: 'number', required: true,  example: '85'     },
    ],
    csvHint: 'Category,Value\nApples,85\nOranges,62\nBananas,108\nGrapes,47',
    config: {
      axes:       { xLabel: true, yLabel: true, yMin: true },
      sort:       true,
      showValues: false,
    },
  },

  'pie-chart': {
    name: 'Pie Chart',
    dataShape: 'label-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Slice', type: 'string', required: true, example: 'Apples' },
      { key: 'value', label: 'Value', type: 'number', required: true, example: '85'     },
    ],
    csvHint: 'Slice,Value\nApples,85\nOranges,62\nBananas,53',
    config: {
      showValues: true,
      showLegend: true,
    },
  },

  'donut-chart': {
    name: 'Donut Chart',
    dataShape: 'label-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Slice', type: 'string', required: true, example: 'Apples' },
      { key: 'value', label: 'Value', type: 'number', required: true, example: '85'     },
    ],
    csvHint: 'Slice,Value\nApples,85\nOranges,62\nBananas,53',
    config: {
      showValues: true,
      showLegend: true,
    },
  },

  'waffle-chart': {
    name: 'Waffle Chart',
    dataShape: 'label-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Category', type: 'string', required: true, example: 'Category A' },
      { key: 'value', label: 'Value',    type: 'number', required: true, example: '40'         },
    ],
    csvHint: 'Category,Value\nCategory A,40\nCategory B,35\nCategory C,25',
    config: {
      showLegend: true,
    },
    notes: 'Values are treated as percentages and must sum to 100.',
  },

  'funnel-chart': {
    name: 'Funnel Chart',
    dataShape: 'label-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Stage', type: 'string', required: true, example: 'Awareness' },
      { key: 'value', label: 'Count', type: 'number', required: true, example: '1000'      },
    ],
    csvHint: 'Stage,Count\nAwareness,1000\nInterest,750\nConsideration,500\nIntent,250\nPurchase,100',
    config: {
      showValues: true,
    },
    notes: 'Rows should be ordered from largest to smallest — the chart does not auto-sort.',
  },

  'dot-plot': {
    name: 'Dot Plot',
    dataShape: 'label-value',
    builderReady: true,
    columns: [
      { key: 'label', label: 'Category', type: 'string', required: true, example: 'United Kingdom' },
      { key: 'value', label: 'Value',    type: 'number', required: true, example: '75'             },
    ],
    csvHint: 'Category,Value\nUnited Kingdom,75\nUnited States,82\nGermany,68\nFrance,71',
    config: {
      axes: { xLabel: true, xMin: true, xMax: true },
      sort: true,
    },
  },

  'word-cloud': {
    name: 'Word Cloud',
    dataShape: 'label-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Word',      type: 'string', required: true, example: 'Innovation' },
      { key: 'value', label: 'Frequency', type: 'number', required: true, example: '42'         },
    ],
    csvHint: 'Word,Frequency\nInnovation,42\nStrategy,38\nGrowth,35\nDigital,30',
    config: {},
  },

  'pictogram': {
    name: 'Pictogram',
    dataShape: 'label-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Category', type: 'string', required: true, example: 'Agreed'    },
      { key: 'value', label: 'Count',    type: 'number', required: true, example: '7'         },
    ],
    csvHint: 'Category,Count\nAgreed,7\nNeutral,3\nDisagreed,2',
    config: {
      showLegend: true,
    },
    notes: 'Values represent counts of icons. Keep totals small (≤50 per row) for readability.',
  },

  'waterfall-chart': {
    name: 'Waterfall Chart',
    dataShape: 'label-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Category', type: 'string', required: true, example: 'Starting balance' },
      { key: 'value', label: 'Value',    type: 'number', required: true, example: '500'              },
    ],
    csvHint: 'Category,Value\nStarting balance,500\nQ1 Revenue,250\nOperating costs,-120\nQ2 Revenue,180\nTotal,0',
    config: {
      axes:       { yLabel: true },
      showValues: true,
    },
    notes: 'Positive = increase, negative = decrease. The last row with value 0 renders as a total bar.',
  },

  // ── Single numeric value ────────────────────────────────────────────────────

  'gauge-chart': {
    name: 'Gauge Chart',
    dataShape: 'single-value',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Label', type: 'string', required: true,  example: 'Progress'  },
      { key: 'value', label: 'Value', type: 'number', required: true,  example: '72'        },
      { key: 'max',   label: 'Max',   type: 'number', required: false, example: '100'       },
    ],
    csvHint: 'Label,Value,Max\nProgress,72,100',
    config: {},
    notes: 'Single-row input only. Max defaults to 100 if omitted.',
  },

  'histogram': {
    name: 'Histogram',
    dataShape: 'single-value',
    builderReady: false,
    columns: [
      { key: 'value', label: 'Value', type: 'number', required: true, example: '42' },
    ],
    csvHint: 'Value\n42\n38\n55\n61\n47\n39\n72\n44\n58',
    config: {
      axes: { xLabel: true, yLabel: true },
    },
    notes: 'One value per row — raw data points. The chart auto-bins them.',
  },

  'density-plot': {
    name: 'Density Plot',
    dataShape: 'single-value',
    builderReady: false,
    columns: [
      { key: 'value',    label: 'Value',    type: 'number', required: true,  example: '42'      },
      { key: 'category', label: 'Category', type: 'string', required: false, example: 'Group A' },
    ],
    csvHint: 'Value,Category\n42,Group A\n38,Group B\n55,Group A\n61,Group B',
    config: {
      axes:       { xLabel: true, yLabel: true },
      showLegend: true,
    },
    notes: 'Category column is optional — omit to show a single density curve.',
  },

  // ── Time → Value ───────────────────────────────────────────────────────────

  'line-chart': {
    name: 'Line Chart',
    dataShape: 'time-value',
    builderReady: true,
    columns: [
      { key: 'date',  label: 'Date',  type: 'date',   required: true,  example: '2024-01' },
      { key: 'value', label: 'Value', type: 'number', required: true,  example: '42'      },
      { key: 'label', label: 'Label', type: 'string', required: false, example: 'Series A' },
    ],
    csvHint: 'Date,Value\n2024-01,42\n2024-02,58\n2024-03,51\n2024-04,67',
    config: {
      axes:       { xLabel: true, yLabel: true, yMin: true, yMax: false },
      showValues: false,
    },
    notes: 'Date accepts YYYY, YYYY-MM, or YYYY-MM-DD. Include a Label column to overlay multiple series.',
  },

  'area-chart': {
    name: 'Area Chart',
    dataShape: 'time-value',
    builderReady: true,
    columns: [
      { key: 'date',  label: 'Date',  type: 'date',   required: true, example: '2024-01' },
      { key: 'value', label: 'Value', type: 'number', required: true, example: '42'      },
    ],
    csvHint: 'Date,Value\n2024-01,42\n2024-02,58\n2024-03,51\n2024-04,67',
    config: {
      axes: { xLabel: true, yLabel: true, yMin: true },
    },
  },

  'step-chart': {
    name: 'Step Chart',
    dataShape: 'time-value',
    builderReady: true,
    columns: [
      { key: 'date',  label: 'Date',  type: 'date',   required: true, example: '2024-01' },
      { key: 'value', label: 'Value', type: 'number', required: true, example: '42'      },
    ],
    csvHint: 'Date,Value\n2024-01,42\n2024-02,42\n2024-03,58\n2024-04,58\n2024-05,65',
    config: {
      axes: { xLabel: true, yLabel: true, yMin: true },
    },
    notes: 'Repeat the same value across multiple dates to show flat periods before a jump.',
  },

  'sparkline': {
    name: 'Sparkline',
    dataShape: 'time-value',
    builderReady: false,
    columns: [
      { key: 'date',  label: 'Date',  type: 'date',   required: false, example: '2024-01' },
      { key: 'value', label: 'Value', type: 'number', required: true,  example: '42'      },
    ],
    csvHint: 'Value\n42\n58\n51\n67\n72\n65',
    config: {},
    notes: 'Date column is optional — a plain sequence of values works fine.',
  },

  // ── X, Y ──────────────────────────────────────────────────────────────────

  'scatter-plot': {
    name: 'Scatter Plot',
    dataShape: 'xy',
    builderReady: false,
    columns: [
      { key: 'x',     label: 'X',     type: 'number', required: true,  example: '24'     },
      { key: 'y',     label: 'Y',     type: 'number', required: true,  example: '35'     },
      { key: 'label', label: 'Label', type: 'string', required: false, example: 'UK'     },
    ],
    csvHint: 'X,Y,Label\n24,35,UK\n42,18,US\n31,55,Germany\n58,44,France',
    config: {
      axes: { xLabel: true, yLabel: true, xMin: true, xMax: true, yMin: true, yMax: true },
    },
  },

  'bubble-chart': {
    name: 'Bubble Chart',
    dataShape: 'xy-size',
    builderReady: true,
    columns: [
      { key: 'x',     label: 'X',     type: 'number', required: true,  example: '24', tooltip: 'One quantitative variable — e.g. GDP per capita, price, temperature'                      },
      { key: 'y',     label: 'Y',     type: 'number', required: true,  example: '35', tooltip: 'A second quantitative variable — e.g. life expectancy, revenue, satisfaction score'        },
      { key: 'size',  label: 'Size',  type: 'number', required: true,  example: '12', tooltip: 'A third variable encoded as bubble area — e.g. population, market cap, volume'             },
      { key: 'label', label: 'Label', type: 'string', required: false, example: 'UK', tooltip: 'The name of each point — e.g. country, company, product'                                   },
    ],
    csvHint: 'X,Y,Size,Label\n24,35,12,UK\n42,18,8,US\n31,55,20,Germany',
    config: {
      axes: { xLabel: true, yLabel: true, xMin: true, xMax: true, yMin: true, yMax: true },
    },
    notes: 'Size values are scaled relative to each other — absolute units do not matter.',
  },

  'connected-scatter-plot': {
    name: 'Connected Scatter Plot',
    dataShape: 'xy-ordered',
    builderReady: false,
    columns: [
      { key: 'x',     label: 'X',     type: 'number', required: true,  example: '10'   },
      { key: 'y',     label: 'Y',     type: 'number', required: true,  example: '42'   },
      { key: 'label', label: 'Label', type: 'string', required: false, example: '2020' },
    ],
    csvHint: 'X,Y,Label\n10,42,2020\n18,55,2021\n24,48,2022\n29,61,2023',
    config: {
      axes: { xLabel: true, yLabel: true, xMin: true, xMax: true, yMin: true, yMax: true },
    },
    notes: 'Points are connected in row order. Label each row with a time period for clarity.',
  },

  // ── Label, two values ─────────────────────────────────────────────────────

  'dumbbell-chart': {
    name: 'Dumbbell Chart',
    dataShape: 'label-two-values',
    builderReady: false,
    columns: [
      { key: 'label',  label: 'Category', type: 'string', required: true, example: 'United Kingdom' },
      { key: 'value1', label: 'Value A',  type: 'number', required: true, example: '45'             },
      { key: 'value2', label: 'Value B',  type: 'number', required: true, example: '68'             },
    ],
    csvHint: 'Category,Value A,Value B\nUnited Kingdom,45,68\nUnited States,52,75\nGermany,38,60',
    config: {
      axes:       { xLabel: true, xMin: true, xMax: true },
      showLegend: true,
    },
    notes: 'Value A and Value B typically represent two time points or two comparison groups.',
  },

  'slope-chart': {
    name: 'Slope Chart',
    dataShape: 'label-two-values',
    builderReady: false,
    columns: [
      { key: 'label',  label: 'Category', type: 'string', required: true, example: 'United Kingdom' },
      { key: 'value1', label: 'Period A', type: 'number', required: true, example: '45'             },
      { key: 'value2', label: 'Period B', type: 'number', required: true, example: '68'             },
    ],
    csvHint: 'Category,Period A,Period B\nUnited Kingdom,45,68\nUnited States,52,75\nGermany,38,60',
    config: {
      axes:       { yLabel: true, yMin: true, yMax: true },
      showLegend: false,
    },
    notes: 'Period A and B label the left and right axes respectively.',
  },

  // ── Label, range ──────────────────────────────────────────────────────────

  'span-chart': {
    name: 'Span Chart',
    dataShape: 'label-range',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Category', type: 'string', required: true, example: 'Product A' },
      { key: 'min',   label: 'Min',      type: 'number', required: true, example: '20'        },
      { key: 'max',   label: 'Max',      type: 'number', required: true, example: '80'        },
    ],
    csvHint: 'Category,Min,Max\nProduct A,20,80\nProduct B,35,65\nProduct C,10,90',
    config: {
      axes: { xLabel: true, xMin: true, xMax: true },
    },
  },

  // ── Label, value, error ───────────────────────────────────────────────────

  'error-bar-chart': {
    name: 'Error Bar Chart',
    dataShape: 'label-value-error',
    builderReady: false,
    columns: [
      { key: 'label',    label: 'Category',    type: 'string', required: true, example: 'Group A' },
      { key: 'value',    label: 'Mean / Value', type: 'number', required: true, example: '72'      },
      { key: 'errorLow', label: 'Lower bound', type: 'number', required: true, example: '65'      },
      { key: 'errorHigh',label: 'Upper bound', type: 'number', required: true, example: '79'      },
    ],
    csvHint: 'Category,Value,LowerBound,UpperBound\nGroup A,72,65,79\nGroup B,58,50,66\nGroup C,85,78,92',
    config: {
      axes: { xLabel: true, yLabel: true, yMin: true, yMax: true },
    },
  },

  // ── Label, value, target ──────────────────────────────────────────────────

  'bullet-chart': {
    name: 'Bullet Chart',
    dataShape: 'label-value-target',
    builderReady: false,
    columns: [
      { key: 'label',  label: 'Metric',      type: 'string', required: true,  example: 'Revenue'   },
      { key: 'value',  label: 'Actual',      type: 'number', required: true,  example: '75'        },
      { key: 'target', label: 'Target',      type: 'number', required: true,  example: '100'       },
      { key: 'range1', label: 'Poor range',  type: 'number', required: false, example: '50'        },
      { key: 'range2', label: 'Good range',  type: 'number', required: false, example: '80'        },
    ],
    csvHint: 'Metric,Actual,Target,PoorRange,GoodRange\nRevenue,75,100,50,80\nSatisfaction,62,80,40,70',
    config: {
      axes: { xLabel: true },
    },
    notes: 'Range columns are optional. If provided, they shade background bands on the bar.',
  },

  // ── Multi-series ──────────────────────────────────────────────────────────

  'grouped-bar-chart': {
    name: 'Grouped Bar Chart',
    dataShape: 'multi-series',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true,                    example: 'Q1'   },
      { key: 'series',   label: 'Series',   type: 'number', required: true, multiple: true, minCount: 2, example: '42'   },
    ],
    csvHint: 'Category,Series A,Series B,Series C\nQ1,42,35,28\nQ2,58,41,33\nQ3,51,38,45\nQ4,64,52,40',
    config: {
      axes:       { xLabel: true, yLabel: true, yMin: true },
      showLegend: true,
    },
    notes: 'First column is the category axis. All remaining columns are treated as series.',
  },

  'stacked-bar-chart': {
    name: 'Stacked Bar Chart',
    dataShape: 'multi-series',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true,                    example: 'Q1'   },
      { key: 'series',   label: 'Series',   type: 'number', required: true, multiple: true, minCount: 2, example: '42'   },
    ],
    csvHint: 'Category,Series A,Series B,Series C\nQ1,42,35,28\nQ2,58,41,33\nQ3,51,38,45',
    config: {
      axes:       { xLabel: true, yLabel: true },
      showLegend: true,
      showValues: false,
    },
  },

  'stacked-bar-100': {
    name: '100% Stacked Bar Chart',
    dataShape: 'multi-series',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true,                    example: 'Q1'   },
      { key: 'series',   label: 'Series',   type: 'number', required: true, multiple: true, minCount: 2, example: '42'   },
    ],
    csvHint: 'Category,Series A,Series B,Series C\nQ1,42,35,28\nQ2,58,41,33\nQ3,51,38,45',
    config: {
      axes:       { xLabel: true, yLabel: true },
      showLegend: true,
    },
    notes: 'Values are normalised to percentages automatically — raw counts are fine as input.',
  },

  'radar-chart': {
    name: 'Radar Chart',
    dataShape: 'multi-series',
    builderReady: false,
    columns: [
      { key: 'axis',   label: 'Axis',   type: 'string', required: true,                    example: 'Speed'  },
      { key: 'series', label: 'Series', type: 'number', required: true, multiple: true, minCount: 1, example: '72'     },
    ],
    csvHint: 'Axis,Series A,Series B\nSpeed,72,58\nPower,65,80\nAccuracy,88,70\nStamina,55,75\nAgility,79,62',
    config: {
      showLegend: true,
    },
    notes: 'First column is the spoke label. Each additional column is a series overlay.',
  },

  'parallel-coordinates': {
    name: 'Parallel Coordinates',
    dataShape: 'multi-series',
    builderReady: false,
    columns: [
      { key: 'label', label: 'Label',     type: 'string', required: false,                    example: 'Item A' },
      { key: 'dims',  label: 'Dimension', type: 'number', required: true,  multiple: true, minCount: 3, example: '42'     },
    ],
    csvHint: 'Label,Dim 1,Dim 2,Dim 3,Dim 4\nItem A,42,65,28,80\nItem B,58,30,72,45\nItem C,35,88,55,62',
    config: {},
    notes: 'Each numeric column becomes a vertical axis. Label column is optional for colouring lines.',
  },

  // ── Time, multi-series ────────────────────────────────────────────────────

  'stacked-area-chart': {
    name: 'Stacked Area Chart',
    dataShape: 'time-multi-series',
    builderReady: false,
    columns: [
      { key: 'date',   label: 'Date',   type: 'date',   required: true,                    example: '2024-01' },
      { key: 'series', label: 'Series', type: 'number', required: true, multiple: true, minCount: 2, example: '42'     },
    ],
    csvHint: 'Date,Series A,Series B,Series C\n2024-01,42,28,15\n2024-02,55,32,18\n2024-03,48,30,22',
    config: {
      axes:       { xLabel: true, yLabel: true },
      showLegend: true,
    },
  },

  'streamgraph': {
    name: 'Streamgraph',
    dataShape: 'time-multi-series',
    builderReady: false,
    columns: [
      { key: 'date',   label: 'Date',   type: 'date',   required: true,                    example: '2024-01' },
      { key: 'series', label: 'Series', type: 'number', required: true, multiple: true, minCount: 2, example: '42'     },
    ],
    csvHint: 'Date,Series A,Series B,Series C\n2024-01,42,28,15\n2024-02,55,32,18\n2024-03,48,30,22',
    config: {
      showLegend: true,
    },
  },

  'bump-chart': {
    name: 'Bump Chart',
    dataShape: 'time-multi-series',
    builderReady: false,
    columns: [
      { key: 'date',   label: 'Date',   type: 'date',   required: true,                    example: '2020'  },
      { key: 'series', label: 'Rank',   type: 'number', required: true, multiple: true, minCount: 2, example: '3'     },
    ],
    csvHint: 'Year,Series A,Series B,Series C\n2020,1,3,2\n2021,2,1,3\n2022,1,2,3\n2023,3,1,2',
    config: {
      showLegend: true,
    },
    notes: 'Values are ranks (1 = highest). Each column after Date is one ranked entity.',
  },

  // ── Matrix ────────────────────────────────────────────────────────────────

  'heatmap': {
    name: 'Heatmap',
    dataShape: 'matrix',
    builderReady: false,
    columns: [
      { key: 'x',     label: 'X Category', type: 'string', required: true, example: 'Monday' },
      { key: 'y',     label: 'Y Category', type: 'string', required: true, example: '9am'    },
      { key: 'value', label: 'Value',      type: 'number', required: true, example: '42'     },
    ],
    csvHint: 'X,Y,Value\nMonday,9am,42\nMonday,10am,65\nTuesday,9am,38\nTuesday,10am,71',
    config: {
      axes:        { xLabel: true, yLabel: true },
      colorScheme: 'sequential',
    },
    notes: 'One row per cell — X and Y define position, Value defines colour intensity.',
  },

  // ── Date → Value ──────────────────────────────────────────────────────────

  'calendar-heatmap': {
    name: 'Calendar Heatmap',
    dataShape: 'date-value',
    builderReady: false,
    columns: [
      { key: 'date',  label: 'Date',  type: 'date',   required: true, example: '2024-03-15' },
      { key: 'value', label: 'Value', type: 'number', required: true, example: '12'         },
    ],
    csvHint: 'Date,Value\n2024-01-01,4\n2024-01-02,12\n2024-01-03,7\n2024-01-06,15',
    config: {
      colorScheme: 'sequential',
    },
    notes: 'Date must be YYYY-MM-DD. Missing dates are shown as empty cells.',
  },

  // ── Distribution ──────────────────────────────────────────────────────────
  // All use long-format: one row per observation.

  'box-plot': {
    name: 'Box Plot',
    dataShape: 'distribution',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true, example: 'Group A' },
      { key: 'value',    label: 'Value',    type: 'number', required: true, example: '42'      },
    ],
    csvHint: 'Category,Value\nGroup A,42\nGroup A,38\nGroup A,55\nGroup A,61\nGroup B,65\nGroup B,70',
    config: {
      axes: { xLabel: true, yLabel: true, yMin: true, yMax: true },
    },
    notes: 'Multiple rows per category — quartiles are computed automatically.',
  },

  'violin-plot': {
    name: 'Violin Plot',
    dataShape: 'distribution',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true, example: 'Group A' },
      { key: 'value',    label: 'Value',    type: 'number', required: true, example: '42'      },
    ],
    csvHint: 'Category,Value\nGroup A,42\nGroup A,38\nGroup A,55\nGroup B,65\nGroup B,70',
    config: {
      axes: { xLabel: true, yLabel: true },
    },
    notes: 'Same long-format input as box plot.',
  },

  'strip-plot': {
    name: 'Strip Plot',
    dataShape: 'distribution',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true, example: 'Group A' },
      { key: 'value',    label: 'Value',    type: 'number', required: true, example: '42'      },
    ],
    csvHint: 'Category,Value\nGroup A,42\nGroup A,38\nGroup B,65\nGroup B,70',
    config: {
      axes: { xLabel: true, yLabel: true },
    },
  },

  'beeswarm-plot': {
    name: 'Beeswarm Plot',
    dataShape: 'distribution',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true,  example: 'Group A' },
      { key: 'value',    label: 'Value',    type: 'number', required: true,  example: '42'      },
      { key: 'label',    label: 'Label',    type: 'string', required: false, example: 'Item 1'  },
    ],
    csvHint: 'Category,Value,Label\nGroup A,42,Item 1\nGroup A,38,Item 2\nGroup B,65,Item 3',
    config: {
      axes: { xLabel: true, yLabel: true },
    },
    notes: 'Label column is optional — used for tooltips or dot annotations.',
  },

  'ridge-plot': {
    name: 'Ridge Plot',
    dataShape: 'distribution',
    builderReady: false,
    columns: [
      { key: 'category', label: 'Category', type: 'string', required: true, example: 'Group A' },
      { key: 'value',    label: 'Value',    type: 'number', required: true, example: '42'      },
    ],
    csvHint: 'Category,Value\nGroup A,42\nGroup A,38\nGroup A,55\nGroup B,65\nGroup B,70',
    config: {
      axes: { xLabel: true },
    },
  },

  // ── Location ──────────────────────────────────────────────────────────────

  'choropleth-map': {
    name: 'Choropleth Map',
    dataShape: 'location',
    builderReady: false,
    columns: [
      { key: 'country', label: 'Country', type: 'string', required: true, example: 'United Kingdom' },
      { key: 'value',   label: 'Value',   type: 'number', required: true, example: '72'             },
    ],
    csvHint: 'Country,Value\nUnited Kingdom,72\nGermany,85\nFrance,68\nItaly,61',
    config: {
      region:      true,
      colorScheme: 'sequential',
    },
    notes: 'Country names, ISO 2-letter (GB), or ISO 3-letter (GBR) codes are all accepted.',
  },

  'proportional-symbol-map': {
    name: 'Proportional Symbol Map',
    dataShape: 'location',
    builderReady: false,
    columns: [
      { key: 'country', label: 'Country', type: 'string', required: true,  example: 'United Kingdom' },
      { key: 'value',   label: 'Value',   type: 'number', required: true,  example: '72'             },
      { key: 'label',   label: 'Label',   type: 'string', required: false, example: 'UK'             },
    ],
    csvHint: 'Country,Value,Label\nUnited Kingdom,72,UK\nGermany,85,DE\nFrance,68,FR',
    config: {
      region: true,
    },
  },

  // ── Hierarchy ─────────────────────────────────────────────────────────────

  'treemap': {
    name: 'Treemap',
    dataShape: 'hierarchy',
    builderReady: false,
    columns: [
      { key: 'label',  label: 'Label',  type: 'string', required: true,  example: 'Category A' },
      { key: 'parent', label: 'Parent', type: 'string', required: false, example: 'Root'       },
      { key: 'value',  label: 'Value',  type: 'number', required: true,  example: '42'         },
    ],
    csvHint: 'Label,Parent,Value\nRoot,,0\nA,Root,0\nA1,A,42\nA2,A,28\nB,Root,0\nB1,B,35',
    config: {
      showValues: true,
    },
    notes: 'Parent column optional for flat layouts. Internal nodes (parent rows) should have Value 0.',
  },

  'sunburst-chart': {
    name: 'Sunburst Chart',
    dataShape: 'hierarchy',
    builderReady: false,
    columns: [
      { key: 'label',  label: 'Label',  type: 'string', required: true,  example: 'Category A' },
      { key: 'parent', label: 'Parent', type: 'string', required: false, example: 'Root'       },
      { key: 'value',  label: 'Value',  type: 'number', required: true,  example: '42'         },
    ],
    csvHint: 'Label,Parent,Value\nRoot,,0\nA,Root,0\nA1,A,42\nA2,A,28\nB,Root,0\nB1,B,35',
    config: {},
    notes: 'Same format as treemap.',
  },

  'marimekko-chart': {
    name: 'Marimekko Chart',
    dataShape: 'hierarchy-2d',
    builderReady: false,
    columns: [
      { key: 'column', label: 'Column group', type: 'string', required: true, example: 'Region A'  },
      { key: 'row',    label: 'Row segment',  type: 'string', required: true, example: 'Product X' },
      { key: 'value',  label: 'Value',        type: 'number', required: true, example: '42'        },
    ],
    csvHint: 'Column,Row,Value\nRegion A,Product X,42\nRegion A,Product Y,28\nRegion B,Product X,35\nRegion B,Product Y,55',
    config: {
      showLegend: true,
    },
    notes: 'Column widths are proportional to the sum of each column group.',
  },

  // ── Flow / Network ────────────────────────────────────────────────────────

  'sankey-diagram': {
    name: 'Sankey Diagram',
    dataShape: 'flow',
    builderReady: false,
    columns: [
      { key: 'source', label: 'From',  type: 'string', required: true, example: 'Solar'   },
      { key: 'target', label: 'To',    type: 'string', required: true, example: 'Grid'    },
      { key: 'value',  label: 'Value', type: 'number', required: true, example: '120'     },
    ],
    csvHint: 'From,To,Value\nSolar,Grid,120\nWind,Grid,80\nGrid,Homes,150\nGrid,Industry,50',
    config: {},
    notes: 'Circular references (A → B → A) are not supported.',
  },

  'chord-diagram': {
    name: 'Chord Diagram',
    dataShape: 'flow',
    builderReady: false,
    columns: [
      { key: 'source', label: 'From',  type: 'string', required: true, example: 'UK'  },
      { key: 'target', label: 'To',    type: 'string', required: true, example: 'US'  },
      { key: 'value',  label: 'Value', type: 'number', required: true, example: '42'  },
    ],
    csvHint: 'From,To,Value\nUK,US,42\nUS,Germany,28\nGermany,UK,35\nUS,France,22',
    config: {},
    notes: 'Bidirectional flows should be listed as two separate rows.',
  },

  'network-graph': {
    name: 'Network Graph',
    dataShape: 'network',
    builderReady: false,
    columns: [
      { key: 'source', label: 'Source node', type: 'string', required: true,  example: 'Alice'  },
      { key: 'target', label: 'Target node', type: 'string', required: true,  example: 'Bob'    },
      { key: 'value',  label: 'Edge weight', type: 'number', required: false, example: '5'      },
    ],
    csvHint: 'Source,Target,Weight\nAlice,Bob,5\nBob,Carol,3\nAlice,Carol,8\nCarol,Dave,2',
    config: {},
    notes: 'Nodes are inferred from Source and Target — no separate node list needed.',
  },

  // ── Financial ─────────────────────────────────────────────────────────────

  'candlestick-chart': {
    name: 'Candlestick Chart',
    dataShape: 'ohlcv',
    builderReady: false,
    columns: [
      { key: 'date',  label: 'Date',  type: 'date',   required: true, example: '2024-01-15' },
      { key: 'open',  label: 'Open',  type: 'number', required: true, example: '142.50'     },
      { key: 'high',  label: 'High',  type: 'number', required: true, example: '148.20'     },
      { key: 'low',   label: 'Low',   type: 'number', required: true, example: '140.10'     },
      { key: 'close', label: 'Close', type: 'number', required: true, example: '146.80'     },
    ],
    csvHint: 'Date,Open,High,Low,Close\n2024-01-15,142.50,148.20,140.10,146.80\n2024-01-16,146.80,152.00,145.30,149.50',
    config: {
      axes: { xLabel: true, yLabel: true },
    },
  },

  // ── Timeline ──────────────────────────────────────────────────────────────

  'gantt-chart': {
    name: 'Gantt Chart',
    dataShape: 'timeline',
    builderReady: false,
    columns: [
      { key: 'task',     label: 'Task',     type: 'string', required: true,  example: 'Design'       },
      { key: 'start',    label: 'Start',    type: 'date',   required: true,  example: '2024-01-01'   },
      { key: 'end',      label: 'End',      type: 'date',   required: true,  example: '2024-01-15'   },
      { key: 'category', label: 'Category', type: 'string', required: false, example: 'Phase 1'      },
    ],
    csvHint: 'Task,Start,End,Category\nDesign,2024-01-01,2024-01-15,Phase 1\nDevelopment,2024-01-10,2024-02-28,Phase 1\nTesting,2024-02-15,2024-03-10,Phase 2',
    config: {
      showLegend: true,
    },
    notes: 'Dates must be YYYY-MM-DD. Rows are displayed in order. Category is used for colour grouping.',
  },

  // ── Tabular ───────────────────────────────────────────────────────────────

  'data-table': {
    name: 'Data Table',
    dataShape: 'tabular',
    builderReady: false,
    columns: [
      { key: 'col', label: 'Column', type: 'any', required: true, multiple: true, minCount: 1, example: '—' },
    ],
    csvHint: 'Column A,Column B,Column C\nValue 1,Value 2,Value 3\nValue 4,Value 5,Value 6',
    config: {},
    notes: 'Any CSV structure is accepted — all columns are rendered as-is.',
  },

};
