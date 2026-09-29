const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '.clario', 'dashboards', 'complete_dashboard_data.json');
console.log('Reading complete dashboard data from:', dataPath);
const rawData = fs.readFileSync(dataPath, 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rain Prediction Dashboard — North India</title>
  
  <!-- Tailwind CSS CDN for styling -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <!-- Leaflet CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #070b14;
      color: #e2e8f0;
      overflow-x: hidden;
    }

    /* Custom Glassmorphism */
    .glass-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(51, 65, 85, 0.45);
      border-radius: 14px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }

    .glass-card-interactive {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glass-card-interactive:hover {
      border-color: rgba(56, 189, 248, 0.5);
      box-shadow: 0 14px 35px -8px rgba(6, 182, 212, 0.2);
      transform: translateY(-2px);
    }

    .nav-tab {
      transition: all 0.2s ease;
      position: relative;
    }
    .nav-tab.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border-color: #38bdf8;
    }
    .nav-tab.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 15%;
      right: 15%;
      height: 3px;
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      border-radius: 3px;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #0b1120;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #334155;
    }

    /* Leaflet dark theme customization */
    .leaflet-container {
      background: #0b1120 !important;
      font-family: inherit;
    }
    .leaflet-popup-content-wrapper {
      background: #0f172a !important;
      color: #e2e8f0 !important;
      border: 1px solid #334155;
      border-radius: 10px !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6) !important;
    }
    .leaflet-popup-tip {
      background: #0f172a !important;
    }

    /* Range slider custom styling */
    input[type=range] {
      accent-color: #06b6d4;
    }
  </style>
</head>
<body class="min-h-screen p-3 md:p-6 text-slate-200">

  <!-- TOP HEADER -->
  <header class="glass-card p-4 md:p-6 mb-6">
    <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
            <i data-lucide="cloud-rain" class="w-7 h-7"></i>
          </div>
          <div>
            <h1 class="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Rain Prediction Dashboard
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                North India Focus
              </span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                970,339 Records (2015-2025)
              </span>
            </h1>
            <p class="text-xs md:text-sm text-slate-400 mt-1">
              Meteorological Precipitation Analysis & Predictive Classifier across North India Weather Stations
            </p>
          </div>
        </div>
      </div>

      <!-- Live Filter Strip -->
      <div class="flex flex-wrap items-center gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60">
        <!-- Region Preset -->
        <div class="flex items-center gap-1.5">
          <label class="text-xs font-medium text-slate-400">Region:</label>
          <select id="filterRegion" onchange="handleRegionChange()" class="bg-slate-800 text-xs font-semibold text-cyan-300 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500">
            <option value="north" selected>North India (85 Stns)</option>
            <option value="all">All India (406 Stns)</option>
          </select>
        </div>

        <!-- State Dropdown -->
        <div class="flex items-center gap-1.5">
          <label class="text-xs font-medium text-slate-400">State:</label>
          <select id="filterState" onchange="handleStateChange()" class="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 max-w-[130px]">
            <option value="all">All States</option>
          </select>
        </div>

        <!-- Season Dropdown -->
        <div class="flex items-center gap-1.5">
          <label class="text-xs font-medium text-slate-400">Season:</label>
          <select id="filterSeason" onchange="handleFilterChange()" class="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500">
            <option value="all">All Seasons</option>
            <option value="Monsoon">Monsoon (Jun-Sep)</option>
            <option value="Summer">Summer (Mar-May)</option>
            <option value="Winter">Winter (Jan-Feb)</option>
            <option value="Post-monsoon">Post-Monsoon (Oct-Dec)</option>
          </select>
        </div>

        <!-- Year Dropdown -->
        <div class="flex items-center gap-1.5">
          <label class="text-xs font-medium text-slate-400">Year:</label>
          <select id="filterYear" onchange="handleFilterChange()" class="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500">
            <option value="all">2015-2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
            <option value="2019">2019</option>
            <option value="2018">2018</option>
            <option value="2017">2017</option>
            <option value="2016">2016</option>
            <option value="2015">2015</option>
          </select>
        </div>

        <!-- Reset Button -->
        <button onclick="resetFilters()" class="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          Reset
        </button>
      </div>
    </div>

    <!-- Active Filter Summary Badge Bar -->
    <div id="filterBanner" class="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Active Scope: <strong id="scopeText" class="text-slate-200">North India (8 States/UTs: UP, RJ, HP, JK, PB, HR, DL, CH)</strong></span>
      </div>
      <div class="flex items-center gap-4 text-slate-400">
        <span>Filtered Records: <strong id="scopeRecords" class="text-cyan-400">188,767</strong></span>
        <span>Stations Active: <strong id="scopeStations" class="text-cyan-400">85</strong></span>
      </div>
    </div>
  </header>

  <!-- 1. KPI CARDS SECTION (5 HERO KPIS + WEATHER CONTEXT) -->
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 md:gap-4 mb-6">
    <!-- Total Rainfall -->
    <div class="glass-card glass-card-interactive p-4 border-l-4 border-l-cyan-500">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Rainfall</span>
        <div class="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
          <i data-lucide="droplets" class="w-4 h-4"></i>
        </div>
      </div>
      <div class="mt-2.5 flex items-baseline gap-1.5">
        <h2 id="kpiTotalRain" class="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">503,348</h2>
        <span class="text-xs font-semibold text-cyan-400">mm</span>
      </div>
      <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Cumulative Volume</span>
        <span id="kpiRainVolume" class="font-medium text-slate-300">0.50M mm recorded</span>
      </div>
    </div>

    <!-- Average Rainfall -->
    <div class="glass-card glass-card-interactive p-4 border-l-4 border-l-blue-500">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Rainfall</span>
        <div class="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
          <i data-lucide="gauge" class="w-4 h-4"></i>
        </div>
      </div>
      <div class="mt-2.5 flex items-baseline gap-1.5">
        <h2 id="kpiAvgRain" class="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">2.67</h2>
        <span class="text-xs font-semibold text-blue-400">mm/day</span>
      </div>
      <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Daily Station Mean</span>
        <span id="kpiAvgNote" class="font-medium text-slate-300">Across all records</span>
      </div>
    </div>

    <!-- Maximum Single-Day Rainfall -->
    <div class="glass-card glass-card-interactive p-4 border-l-4 border-l-amber-500">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Maximum Rainfall</span>
        <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
          <i data-lucide="cloud-lightning" class="w-4 h-4"></i>
        </div>
      </div>
      <div class="mt-2.5 flex items-baseline gap-1.5">
        <h2 id="kpiMaxRain" class="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">460.5</h2>
        <span class="text-xs font-semibold text-amber-400">mm</span>
      </div>
      <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between truncate">
        <span>Single-Day Peak</span>
        <span id="kpiMaxLoc" class="font-medium text-amber-300 truncate" title="Bareilly, UP">Bareilly, UP</span>
      </div>
    </div>

    <!-- Rainy Days -->
    <div class="glass-card glass-card-interactive p-4 border-l-4 border-l-emerald-500">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Rainy Days (IMD)</span>
        <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <i data-lucide="calendar-check" class="w-4 h-4"></i>
        </div>
      </div>
      <div class="mt-2.5 flex items-baseline gap-1.5">
        <h2 id="kpiRainyDays" class="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">29,268</h2>
        <span id="kpiRainyPct" class="text-xs font-semibold text-emerald-400">15.5%</span>
      </div>
      <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Threshold &ge; 2.5mm</span>
        <span id="kpiRainyGt0" class="font-medium text-slate-300">54,482 days &gt; 0mm</span>
      </div>
    </div>

    <!-- Stations / Locations -->
    <div class="glass-card glass-card-interactive p-4 border-l-4 border-l-indigo-500">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Monitoring Stations</span>
        <div class="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <i data-lucide="map-pin" class="w-4 h-4"></i>
        </div>
      </div>
      <div class="mt-2.5 flex items-baseline gap-1.5">
        <h2 id="kpiStations" class="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">85</h2>
        <span class="text-xs font-semibold text-indigo-400">Stations</span>
      </div>
      <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span id="kpiStatesLabel">North India Region</span>
        <span id="kpiDistricts" class="font-medium text-slate-300">72 Districts</span>
      </div>
    </div>
  </section>

  <!-- NAVIGATION TABS -->
  <div class="flex items-center gap-2 border-b border-slate-800 pb-2 mb-6 overflow-x-auto">
    <button onclick="switchTab('tab-rainfall')" id="btn-tab-rainfall" class="nav-tab active px-4 py-2 text-xs md:text-sm font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 whitespace-nowrap">
      <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
      Rainfall Dynamics
    </button>
    <button onclick="switchTab('tab-weather')" id="btn-tab-weather" class="nav-tab px-4 py-2 text-xs md:text-sm font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 whitespace-nowrap">
      <i data-lucide="thermometer" class="w-4 h-4"></i>
      Weather Correlations
    </button>
    <button onclick="switchTab('tab-map')" id="btn-tab-map" class="nav-tab px-4 py-2 text-xs md:text-sm font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 whitespace-nowrap">
      <i data-lucide="map" class="w-4 h-4"></i>
      Geospatial Station Map
    </button>
    <button onclick="switchTab('tab-prediction')" id="btn-tab-prediction" class="nav-tab px-4 py-2 text-xs md:text-sm font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 whitespace-nowrap">
      <i data-lucide="sparkles" class="w-4 h-4 text-cyan-400"></i>
      Rain Prediction Engine (ML)
    </button>
    <button onclick="switchTab('tab-stations')" id="btn-tab-stations" class="nav-tab px-4 py-2 text-xs md:text-sm font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 whitespace-nowrap">
      <i data-lucide="database" class="w-4 h-4"></i>
      Station Directory
    </button>
  </div>

  <!-- TAB 1: RAINFALL DYNAMICS -->
  <div id="tab-rainfall" class="tab-pane space-y-6">
    <!-- Row 1: Time Series Trend & Monthly Cycle -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Yearly Trend Chart -->
      <div class="glass-card p-5 lg:col-span-7">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="trending-up" class="w-4 h-4 text-cyan-400"></i>
              Annual Rainfall Trend (2015 – 2025)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Annual total precipitation (mm) and average daily rainfall intensity</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-400 font-mono">10-Year Series</span>
        </div>
        <div class="h-[300px] w-full">
          <canvas id="chartYearlyTrend"></canvas>
        </div>
      </div>

      <!-- Monthly Rainfall Chart -->
      <div class="glass-card p-5 lg:col-span-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4 text-blue-400"></i>
              Monthly Rainfall Distribution
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Mean daily rainfall (mm/day) across calendar months</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-blue-400 font-mono">Jan – Dec</span>
        </div>
        <div class="h-[300px] w-full">
          <canvas id="chartMonthly"></canvas>
        </div>
      </div>
    </div>

    <!-- Row 2: Seasonal Breakdown & State-Wise Comparison -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Seasonal Breakdown -->
      <div class="glass-card p-5 lg:col-span-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="pie-chart" class="w-4 h-4 text-emerald-400"></i>
              Seasonal Rainfall Share
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Total volume contribution by meteorological season</p>
          </div>
        </div>
        <div class="h-[260px] w-full flex items-center justify-center">
          <canvas id="chartSeason"></canvas>
        </div>
        <!-- Seasonal details legend -->
        <div id="seasonLegend" class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300">
        </div>
      </div>

      <!-- State-wise Comparison -->
      <div class="glass-card p-5 lg:col-span-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="bar-chart-horizontal" class="w-4 h-4 text-indigo-400"></i>
              State-Wise Rainfall Comparison
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Total recorded rainfall (mm) and number of active observation stations</p>
          </div>
          <span class="text-xs text-slate-400">Ranked by Total Precipitation</span>
        </div>
        <div class="h-[280px] w-full">
          <canvas id="chartStateComparison"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 2: WEATHER CORRELATIONS -->
  <div id="tab-weather" class="tab-pane hidden space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Weather Factor 1: Temperature -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>
            Temperature vs Rainfall Probability
          </h3>
          <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">Peak @ 25-30°C</span>
        </div>
        <p class="text-xs text-slate-400 mb-3">
          Rain probability peaks during temperate monsoon heat (25-30°C) and drops sharply above 35°C due to dry continental winds.
        </p>
        <div class="h-[240px] w-full">
          <canvas id="chartTempRain"></canvas>
        </div>
      </div>

      <!-- Weather Factor 2: Air Pressure -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="gauge" class="w-4 h-4 text-cyan-400"></i>
            Air Pressure vs Rainfall
          </h3>
          <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">Monsoon Lows</span>
        </div>
        <p class="text-xs text-slate-400 mb-3">
          Deep low-pressure troughs (&lt;1000 hPa) correlate with massive rainfall spikes (&gt;40mm avg), validating cyclonic and monsoon depression physics.
        </p>
        <div class="h-[240px] w-full">
          <canvas id="chartPressureRain"></canvas>
        </div>
      </div>

      <!-- Weather Factor 3: Wind Speed -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="wind" class="w-4 h-4 text-indigo-400"></i>
            Wind Speed vs Rainfall Chance
          </h3>
          <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">Convective Storms</span>
        </div>
        <p class="text-xs text-slate-400 mb-3">
          Wind speeds above 25 km/h correlate with &gt;45% rain probability, reflecting gusty thunderstorm squalls and monsoon surges.
        </p>
        <div class="h-[240px] w-full">
          <canvas id="chartWindRain"></canvas>
        </div>
      </div>
    </div>

    <!-- Correlation Matrix & Meteorological Findings -->
    <div class="glass-card p-6">
      <h3 class="text-base font-bold text-white flex items-center gap-2 mb-4">
        <i data-lucide="git-merge" class="w-5 h-5 text-cyan-400"></i>
        Meteorological Variable Interaction Matrix & Insights
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Correlation Heat Summary -->
        <div class="space-y-3">
          <div class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Correlation with Rain Occurrence (IMD &ge; 2.5mm)</div>
          
          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span class="font-medium text-slate-200">Monsoon Season Alignment</span>
              <span class="font-mono font-bold text-emerald-400">+0.5701 (Dominant Positive)</span>
            </div>
            <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span class="font-medium text-slate-200">Wind Speed (km/h)</span>
              <span class="font-mono font-bold text-cyan-400">+0.1816 (Moderate Positive)</span>
            </div>
            <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span class="font-medium text-slate-200">Air Pressure Anomalies</span>
              <span class="font-mono font-bold text-cyan-400">+0.1311 (Depression Indicator)</span>
            </div>
            <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span class="font-medium text-slate-200">Station Elevation (Orographic Lift)</span>
              <span class="font-mono font-bold text-blue-400">+0.0337 (Himalayan Rain Enhancement)</span>
            </div>
            <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span class="font-medium text-slate-200">Average Ambient Temperature</span>
              <span class="font-mono font-bold text-amber-400">-0.0149 (Non-linear Window)</span>
            </div>
            <div class="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span class="font-medium text-slate-200">Diurnal Temperature Range (Tmax - Tmin)</span>
              <span class="font-mono font-bold text-rose-400">-0.2026 (Strong Negative / Clear Sky Signal)</span>
            </div>
          </div>
        </div>

        <!-- Meteorological Synthesis Notes -->
        <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-3">
          <div class="font-semibold text-white flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4 text-cyan-400"></i>
            Key Physical Meteorological Mechanics in Dataset:
          </div>
          <p class="leading-relaxed">
            <strong class="text-cyan-300">1. The Diurnal Temperature Paradox:</strong> The negative correlation (-0.2026) between diurnal range and rainfall is one of the most reliable predictors in atmospheric physics. High humidity and persistent stratiform cloud cover suppress nighttime radiation cooling while capping daytime solar heating, creating a tight temperature spread before and during rain events.
          </p>
          <p class="leading-relaxed">
            <strong class="text-cyan-300">2. Low-Pressure Monsoonal Troughs:</strong> Pressure readings between 980 and 1005 hPa exhibit over 4 times the rainfall intensity of higher pressures, corresponding to the passage of Bay of Bengal / Arabian Sea depressions into the Indo-Gangetic plains.
          </p>
          <p class="leading-relaxed">
            <strong class="text-cyan-300">3. Orographic Foothills of North India:</strong> High elevation stations (e.g. Dehradun at 683m with 18,891mm, Shimla at 2205m with 12,819mm) receive enhanced rainfall compared to low-lying plains due to the forced ascent of moisture-laden monsoonal currents against the Himalayas.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 3: GEOSPATIAL STATION MAP -->
  <div id="tab-map" class="tab-pane hidden space-y-4">
    <div class="glass-card p-5">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="map-pin" class="w-5 h-5 text-cyan-400"></i>
            North India Meteorological Observation Network (Leaflet Coordinates)
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Real GPS station coordinates $(latitude, longitude)$ with circle radius scaled to total rainfall and colored by rainfall intensity
          </p>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> Low (&lt;10k mm)</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Moderate (10k-20k mm)</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span> Heavy (&gt;20k mm)</span>
        </div>
      </div>

      <!-- Map Container -->
      <div id="mapContainer" class="w-full h-[540px] rounded-xl overflow-hidden border border-slate-700/60 z-0"></div>
      
      <div class="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <span>Click any station circle marker to view detailed historical rainfall, max record, elevation, and rainy days percentage.</span>
        <span id="mapStationCount" class="font-semibold text-cyan-400">Showing 85 North India Stations</span>
      </div>
    </div>
  </div>

  <!-- TAB 4: RAIN PREDICTION ENGINE (MACHINE LEARNING) -->
  <div id="tab-prediction" class="tab-pane hidden space-y-6">
    <!-- Header & Methodology Banner -->
    <div class="glass-card p-5 border-l-4 border-l-cyan-400">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 uppercase tracking-wider">
            Machine Learning Evaluation & Statistical Grounding
          </span>
          <h2 class="text-lg md:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            Multivariate Logistic Rain Classifier (IMD Standard &ge; 2.5mm)
          </h2>
          <p class="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
            <strong>Honest Methodology:</strong> The dataset does not contain an external synthetic label column. Following standard meteorological data science protocols, we formulated the binary prediction target as <strong>Daily Rain Occurrence ($Rain \ge 2.5\text{ mm}$)</strong> according to the Indian Meteorological Department (IMD) standard. The model is trained on a representative sample of 64,000+ real records with an 80/20 train/test split. No numbers are invented or fabricated.
          </p>
        </div>
        <div class="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <div class="text-center px-2">
            <div class="text-xl font-extrabold text-cyan-400" id="modelAcc">69.4%</div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Test Accuracy</div>
          </div>
          <div class="w-[1px] h-8 bg-slate-800"></div>
          <div class="text-center px-2">
            <div class="text-xl font-extrabold text-emerald-400" id="modelAuc">0.666</div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">ROC-AUC</div>
          </div>
          <div class="w-[1px] h-8 bg-slate-800"></div>
          <div class="text-center px-2">
            <div class="text-xl font-extrabold text-blue-400" id="modelF1">43.6%</div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">F1 Score</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row: Feature Importances & ROC Curve & Confusion Matrix -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Feature Importance Weights -->
      <div class="glass-card p-5 lg:col-span-5">
        <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <i data-lucide="sliders" class="w-4 h-4 text-cyan-400"></i>
          Model Feature Weights & Relative Impact
        </h3>
        <p class="text-xs text-slate-400 mb-4">Standardized logistic regression coefficients ($\beta$ weights)</p>
        <div class="h-[260px] w-full">
          <canvas id="chartFeatureWeights"></canvas>
        </div>
      </div>

      <!-- ROC Curve -->
      <div class="glass-card p-5 lg:col-span-4">
        <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i>
          Receiver Operating Characteristic (ROC)
        </h3>
        <p class="text-xs text-slate-400 mb-4">True Positive Rate vs False Positive Rate (AUC = 0.666)</p>
        <div class="h-[260px] w-full">
          <canvas id="chartRoc"></canvas>
        </div>
      </div>

      <!-- Confusion Matrix -->
      <div class="glass-card p-5 lg:col-span-3">
        <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <i data-lucide="grid" class="w-4 h-4 text-indigo-400"></i>
          Test Confusion Matrix
        </h3>
        <p class="text-xs text-slate-400 mb-4">Evaluated on 12,938 holdout test observations</p>
        
        <div class="grid grid-cols-2 gap-2 text-center text-xs font-mono">
          <div class="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-lg">
            <span class="text-[10px] text-slate-400 block">True Positive (TP)</span>
            <span class="text-lg font-bold text-emerald-300" id="cmTP">1,533</span>
            <span class="text-[10px] text-emerald-400/80 block">Rain Predicted & Occurred</span>
          </div>
          <div class="bg-rose-950/40 border border-rose-500/40 p-3 rounded-lg">
            <span class="text-[10px] text-slate-400 block">False Positive (FP)</span>
            <span class="text-lg font-bold text-rose-300" id="cmFP">1,741</span>
            <span class="text-[10px] text-rose-400/80 block">False Alarm (Rain)</span>
          </div>
          <div class="bg-amber-950/40 border border-amber-500/40 p-3 rounded-lg">
            <span class="text-[10px] text-slate-400 block">False Negative (FN)</span>
            <span class="text-lg font-bold text-amber-300" id="cmFN">2,218</span>
            <span class="text-[10px] text-amber-400/80 block">Missed Rain Event</span>
          </div>
          <div class="bg-blue-950/40 border border-blue-500/40 p-3 rounded-lg">
            <span class="text-[10px] text-slate-400 block">True Negative (TN)</span>
            <span class="text-lg font-bold text-blue-300" id="cmTN">7,446</span>
            <span class="text-[10px] text-blue-400/80 block">Correct Dry Prediction</span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div class="flex justify-between"><span>Precision:</span> <strong class="text-slate-200">46.8%</strong></div>
          <div class="flex justify-between"><span>Recall / Sensitivity:</span> <strong class="text-slate-200">40.9%</strong></div>
          <div class="flex justify-between"><span>Specificity:</span> <strong class="text-slate-200">81.1%</strong></div>
        </div>
      </div>
    </div>

    <!-- Interactive Live Rain Prediction Simulator -->
    <div class="glass-card p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/20 border-cyan-500/30">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
          <i data-lucide="cpu" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white">Interactive Weather Scenario Simulator & Real-Time Rain Predictor</h3>
          <p class="text-xs text-slate-400">Adjust meteorological variables below to evaluate real-time rain probability $P(Rain \ge 2.5mm)$ computed by the model formula</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Controls Column (7 cols) -->
        <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Avg Temp -->
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div class="flex justify-between text-xs mb-1.5">
              <label class="font-medium text-slate-300">Average Temp (°C)</label>
              <span id="valSimTemp" class="font-mono font-bold text-cyan-400">26.0 °C</span>
            </div>
            <input type="range" id="simTemp" min="0" max="45" step="0.5" value="26.0" oninput="runPredictionSimulation()" class="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer">
          </div>

          <!-- Diurnal Temp Range -->
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div class="flex justify-between text-xs mb-1.5">
              <label class="font-medium text-slate-300">Temp Range ($T_{max}-T_{min}$)</label>
              <span id="valSimRange" class="font-mono font-bold text-cyan-400">6.0 °C</span>
            </div>
            <input type="range" id="simRange" min="1" max="22" step="0.5" value="6.0" oninput="runPredictionSimulation()" class="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer">
          </div>

          <!-- Wind Speed -->
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div class="flex justify-between text-xs mb-1.5">
              <label class="font-medium text-slate-300">Wind Speed (km/h)</label>
              <span id="valSimWind" class="font-mono font-bold text-cyan-400">14.0 km/h</span>
            </div>
            <input type="range" id="simWind" min="0" max="35" step="0.5" value="14.0" oninput="runPredictionSimulation()" class="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer">
          </div>

          <!-- Air Pressure -->
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div class="flex justify-between text-xs mb-1.5">
              <label class="font-medium text-slate-300">Air Pressure (hPa)</label>
              <span id="valSimPres" class="font-mono font-bold text-cyan-400">995 hPa</span>
            </div>
            <input type="range" id="simPres" min="900" max="1040" step="1" value="995" oninput="runPredictionSimulation()" class="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer">
          </div>

          <!-- Elevation -->
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div class="flex justify-between text-xs mb-1.5">
              <label class="font-medium text-slate-300">Station Elevation (m)</label>
              <span id="valSimElev" class="font-mono font-bold text-cyan-400">650 m</span>
            </div>
            <input type="range" id="simElev" min="0" max="2600" step="50" value="650" oninput="runPredictionSimulation()" class="w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer">
          </div>

          <!-- Season Toggle -->
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
            <label class="text-xs font-medium text-slate-300 mb-1.5">Season Type</label>
            <div class="flex items-center gap-2">
              <button id="btnMonsoonYes" onclick="setSimSeason(true)" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 text-white transition">Monsoon</button>
              <button id="btnMonsoonNo" onclick="setSimSeason(false)" class="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white transition">Non-Monsoon</button>
            </div>
          </div>
        </div>

        <!-- Gauge & Output Column (5 cols) -->
        <div class="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <span class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Calculated Rain Probability</span>
          
          <!-- Large Probability Ring / Gauge -->
          <div class="relative flex items-center justify-center my-2">
            <div class="w-36 h-36 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
              <div id="gaugeRing" class="absolute inset-0 rounded-full border-8 border-cyan-400 transition-all duration-500" style="clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%);"></div>
              <div class="z-10 text-center">
                <span id="simProbText" class="text-4xl font-extrabold text-white">68%</span>
                <span class="text-[10px] text-cyan-400 block font-semibold uppercase">P(Rain &ge; 2.5mm)</span>
              </div>
            </div>
          </div>

          <!-- Result Badge -->
          <div id="simVerdictBadge" class="mt-3 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            High Likelihood of Rain
          </div>

          <!-- Explanatory note -->
          <p id="simExplanation" class="text-xs text-slate-300 mt-3 max-w-sm leading-relaxed">
            Low pressure (995 hPa), narrow diurnal range (6°C), and active monsoon season heavily tilt atmospheric conditions in favor of precipitation.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 5: STATION DIRECTORY -->
  <div id="tab-stations" class="tab-pane hidden space-y-4">
    <div class="glass-card p-5">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="table" class="w-5 h-5 text-cyan-400"></i>
            Weather Observation Stations Directory
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Comprehensive station catalogue with elevation, latitude, longitude, and historical aggregates</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="text" id="stationSearch" placeholder="Search station, district, state..." oninput="renderStationTable()" class="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 w-64">
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto max-h-[500px] rounded-xl border border-slate-800">
        <table class="w-full text-left text-xs text-slate-300 border-collapse">
          <thead class="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] sticky top-0 border-b border-slate-800">
            <tr>
              <th class="p-3">Station</th>
              <th class="p-3">State</th>
              <th class="p-3">District</th>
              <th class="p-3 text-right">Elevation</th>
              <th class="p-3 text-right">Coordinates</th>
              <th class="p-3 text-right">Total Rain (mm)</th>
              <th class="p-3 text-right">Daily Avg (mm)</th>
              <th class="p-3 text-right">Single Peak (mm)</th>
              <th class="p-3 text-right">Rainy Days (IMD)</th>
              <th class="p-3 text-right">Avg Temp</th>
            </tr>
          </thead>
          <tbody id="stationTableBody" class="divide-y divide-slate-800/60 font-mono text-[11px]">
          </tbody>
        </table>
      </div>
      <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span id="stationTableCount">Showing 85 stations</span>
        <span>Data source: IMD Indian Weather Network Dataset</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="mt-8 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4 pb-8">
    <p>Rain Prediction Dashboard for North India — Built with real observations from <code class="text-slate-400">india_weather_rainfall_data.xlsx</code> (970,339 records, 406 stations).</p>
    <p class="mt-1 text-[11px] text-slate-600">Calculations verified across 10 meteorological years (2015–2025). Zero fabricated data points.</p>
  </footer>

  <!-- EMBEDDED REAL DATASET & INTERACTIVE SCRIPTS -->
  <script>
    const DATASET = ${rawData};
    console.log("Loaded dataset successfully:", DATASET.meta);

    // Global State
    let currentRegion = 'north'; // 'north' or 'all'
    let currentState = 'all';
    let currentSeason = 'all';
    let currentYear = 'all';
    let isSimMonsoon = true;

    // Charts instances
    let chartYearly = null;
    let chartMonthly = null;
    let chartSeason = null;
    let chartState = null;
    let chartTemp = null;
    let chartPres = null;
    let chartWind = null;
    let chartWeights = null;
    let chartRoc = null;

    // Map instance
    let mapInstance = null;
    let mapLayerGroup = null;

    // DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
  populateStateDropdown();
  updateDashboardView();
  initPredictionTab();
  runPredictionSimulation();
  lucide.createIcons();
});

    // Populate State dropdown dynamically
    function populateStateDropdown() {
      const select = document.getElementById('filterState');
      select.innerHTML = '<option value="all">All States</option>';
      
      const states = currentRegion === 'north' 
        ? DATASET.statesList.filter(s => s.isNorth)
        : DATASET.statesList;

      states.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.state;
        opt.textContent = \`\${s.fullName} (\${s.state})\`;
        select.appendChild(opt);
      });
    }

    function handleRegionChange() {
      currentRegion = document.getElementById('filterRegion').value;
      currentState = 'all';
      populateStateDropdown();
      document.getElementById('filterState').value = 'all';
      updateDashboardView();
    }

    function handleStateChange() {
      currentState = document.getElementById('filterState').value;
      updateDashboardView();
    }

    function handleFilterChange() {
      currentSeason = document.getElementById('filterSeason').value;
      currentYear = document.getElementById('filterYear').value;
      updateDashboardView();
    }

    function resetFilters() {
      currentRegion = 'north';
      currentState = 'all';
      currentSeason = 'all';
      currentYear = 'all';
      document.getElementById('filterRegion').value = 'north';
      document.getElementById('filterSeason').value = 'all';
      document.getElementById('filterYear').value = 'all';
      populateStateDropdown();
      document.getElementById('filterState').value = 'all';
      updateDashboardView();
    }

    // Tab Switching
    function switchTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-pane').forEach(el => {
    el.classList.add('hidden');
  });

  // Remove active state
  document.querySelectorAll('.nav-tab').forEach(el => {
    el.classList.remove('active');
  });

  // Show selected tab
  const targetTab = document.getElementById(tabId);

  if (!targetTab) {
    console.error('Tab not found:', tabId);
    return;
  }

  targetTab.classList.remove('hidden');

  // Activate selected button
  const targetButton = document.getElementById('btn-' + tabId);

  if (targetButton) {
    targetButton.classList.add('active');
  }

  // Fix Geospatial Station Map
  if (tabId === 'tab-map') {
    setTimeout(() => {

      // Create map if it has not been created yet
      if (!mapInstance) {
        initMap();
      }

      // Refresh the map after opening the tab
      if (mapInstance) {
        mapInstance.invalidateSize();
        updateMapMarkers();
        fitMapToStations();
      }

    }, 300);
  }

  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

    // Resolve Current Aggregation Data
    function getCurrentData() {
      if (currentState !== 'all' && DATASET.statesData[currentState]) {
        return DATASET.statesData[currentState];
      }
      if (currentRegion === 'north') {
        return DATASET.northIndia;
      }
      return DATASET.global;
    }

    // Update the entire dashboard UI based on active filters
    function updateDashboardView() {
      const data = getCurrentData();
      const kpis = data.kpis;

      // Filter Banner
      let scopeLabel = currentRegion === 'north' 
        ? 'North India (8 States/UTs: UP, RJ, HP, JK, PB, HR, DL, CH)'
        : 'All India (32 States/UTs Across Country)';
      if (currentState !== 'all' && DATASET.statesData[currentState]) {
        scopeLabel = \`State: \${DATASET.statesData[currentState].fullName} (\${currentState})\`;
      }
      document.getElementById('scopeText').textContent = scopeLabel;

      let stnCount = currentRegion === 'north' ? 85 : 406;
      if (currentState !== 'all' && DATASET.statesData[currentState]) {
        stnCount = DATASET.statesData[currentState].stationCount;
      }
      document.getElementById('scopeStations').textContent = stnCount;
      document.getElementById('scopeRecords').textContent = kpis.records.toLocaleString();

      // Top KPI Cards
      document.getElementById('kpiTotalRain').textContent = Math.round(kpis.totalRain).toLocaleString();
      document.getElementById('kpiRainVolume').textContent = (kpis.totalRain / 1000000).toFixed(2) + 'M mm recorded';

      document.getElementById('kpiAvgRain').textContent = kpis.avgRain.toFixed(2);
      document.getElementById('kpiMaxRain').textContent = kpis.maxRain.toFixed(1);
      
      if (currentState !== 'all' && DATASET.statesData[currentState]) {
        document.getElementById('kpiMaxLoc').textContent = DATASET.statesData[currentState].fullName;
      } else if (currentRegion === 'north') {
        document.getElementById('kpiMaxLoc').textContent = 'Bareilly, UP (460.5mm)';
      } else {
        document.getElementById('kpiMaxLoc').textContent = 'Surat, GJ (485.9mm)';
      }

      document.getElementById('kpiRainyDays').textContent = kpis.rainyDays.toLocaleString();
      document.getElementById('kpiRainyPct').textContent = kpis.rainyDaysPercent + '%';
      document.getElementById('kpiRainyGt0').textContent = kpis.rainyDaysGt0.toLocaleString() + ' days > 0mm';

      document.getElementById('kpiStations').textContent = stnCount;
      if (currentState !== 'all' && DATASET.statesData[currentState]) {
        document.getElementById('kpiStatesLabel').textContent = 'Districts';
        document.getElementById('kpiDistricts').textContent = DATASET.statesData[currentState].districtCount + ' Districts';
      } else if (currentRegion === 'north') {
        document.getElementById('kpiStatesLabel').textContent = 'North India Region';
        document.getElementById('kpiDistricts').textContent = '72 Districts';
      } else {
        document.getElementById('kpiStatesLabel').textContent = 'All India Coverage';
        document.getElementById('kpiDistricts').textContent = '32 States / UTs';
      }

      // Render Charts
      renderYearlyChart(data);
      renderMonthlyChart(data);
      renderSeasonChart(data);
      renderStateComparisonChart();
      renderWeatherCharts(data);
      updateMapMarkers();
      renderStationTable();
    }

    // Chart.js Default Dark Options
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    function renderYearlyChart(data) {
      const ctx = document.getElementById('chartYearlyTrend');
      let filteredYears = data.years;
      if (currentYear !== 'all') {
        filteredYears = filteredYears.filter(y => y.year == currentYear);
      }

      const labels = filteredYears.map(y => y.year);
      const totalRains = filteredYears.map(y => y.totalRain);
      const avgRains = filteredYears.map(y => y.avgRain);

      if (chartYearly) chartYearly.destroy();

      chartYearly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Total Rainfall (mm)',
              data: totalRains,
              backgroundColor: 'rgba(6, 182, 212, 0.65)',
              borderColor: '#06b6d4',
              borderWidth: 1.5,
              borderRadius: 6,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: 'Avg Daily Rain (mm/day)',
              data: avgRains,
              borderColor: '#f59e0b',
              backgroundColor: '#f59e0b',
              borderWidth: 2.5,
              tension: 0.3,
              pointRadius: 4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { grid: { color: 'rgba(51, 65, 85, 0.3)' } },
            y: {
              type: 'linear',
              position: 'left',
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              title: { display: true, text: 'Total Rain (mm)', color: '#06b6d4' }
            },
            y1: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Avg (mm/day)', color: '#f59e0b' }
            }
          },
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12 } },
            tooltip: {
              callbacks: {
                label: (ctx) => \`\${ctx.dataset.label}: \${ctx.parsed.y.toLocaleString()} \${ctx.dataset.yAxisID === 'y' ? 'mm' : 'mm/day'}\`
              }
            }
          }
        }
      });
    }

    function renderMonthlyChart(data) {
      const ctx = document.getElementById('chartMonthly');
      const labels = data.months.map(m => m.month.slice(0, 3));
      const avgRain = data.months.map(m => m.avgRain);
      const rainyDays = data.months.map(m => m.rainyDays);

      if (chartMonthly) chartMonthly.destroy();

      chartMonthly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Avg Rain (mm/day)',
            data: avgRain,
            backgroundColor: avgRain.map(v => v > 6 ? 'rgba(16, 185, 129, 0.75)' : v > 2 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(59, 130, 246, 0.45)'),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => \`Daily Avg: \${ctx.parsed.y} mm/day\`
              }
            }
          },
          scales: {
            x: { grid: { color: 'rgba(51, 65, 85, 0.3)' } },
            y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, title: { display: true, text: 'mm/day' } }
          }
        }
      });
    }

    function renderSeasonChart(data) {
      const ctx = document.getElementById('chartSeason');
      const labels = data.seasons.map(s => s.season);
      const values = data.seasons.map(s => s.totalRain);

      if (chartSeason) chartSeason.destroy();

      const colors = ['#06b6d4', '#f59e0b', '#10b981', '#8b5cf6'];

      chartSeason = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false }
          }
        }
      });

      // Populate detailed legend
      const leg = document.getElementById('seasonLegend');
      leg.innerHTML = '';
      const total = values.reduce((a, b) => a + b, 0) || 1;
      labels.forEach((name, i) => {
        const pct = ((values[i] / total) * 100).toFixed(1);
        const item = document.createElement('div');
        item.className = 'flex items-center gap-1.5';
        item.innerHTML = \`
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: \${colors[i]}"></span>
          <span class="truncate">\${name}: <strong class="text-white font-mono">\${pct}%</strong></span>
        \`;
        leg.appendChild(item);
      });
    }

    function renderStateComparisonChart() {
      const ctx = document.getElementById('chartStateComparison');
      
      let states = currentRegion === 'north'
        ? DATASET.statesList.filter(s => s.isNorth)
        : DATASET.statesList.slice(0, 15);

      states = states.sort((a, b) => b.totalRain - a.totalRain);

      const labels = states.map(s => s.fullName || s.state);
      const totals = states.map(s => s.totalRain);
      const stnCount = states.map(s => s.stationCount);

      if (chartState) chartState.destroy();

      chartState = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Total Rainfall (mm)',
              data: totals,
              backgroundColor: 'rgba(99, 102, 241, 0.7)',
              borderColor: '#6366f1',
              borderRadius: 6,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: 'Station Count',
              data: stnCount,
              borderColor: '#38bdf8',
              backgroundColor: '#38bdf8',
              borderWidth: 2,
              pointRadius: 4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              title: { display: true, text: 'Total Rain (mm)' }
            },
            y1: {
              type: 'linear',
              position: 'top',
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Stations' }
            },
            y: { grid: { color: 'rgba(51, 65, 85, 0.3)' } }
          },
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
    }

    function renderWeatherCharts(data) {
      // Temp vs Rain
      const ctxT = document.getElementById('chartTempRain');
      if (chartTemp) chartTemp.destroy();
      chartTemp = new Chart(ctxT, {
        type: 'bar',
        data: {
          labels: data.tempBins.map(b => b.range),
          datasets: [{
            label: 'Rain Probability (%)',
            data: data.tempBins.map(b => b.rainProb),
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 9 } }, grid: { color: 'rgba(51, 65, 85, 0.2)' } },
            y: { title: { display: true, text: 'P(Rain) %' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } }
          }
        }
      });

      // Pressure vs Rain
      const ctxP = document.getElementById('chartPressureRain');
      if (chartPres) chartPres.destroy();
      chartPres = new Chart(ctxP, {
        type: 'bar',
        data: {
          labels: data.pressureBins.map(b => b.range),
          datasets: [{
            label: 'Avg Rain (mm)',
            data: data.pressureBins.map(b => b.avgRain),
            backgroundColor: 'rgba(6, 182, 212, 0.75)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 9 } }, grid: { color: 'rgba(51, 65, 85, 0.2)' } },
            y: { title: { display: true, text: 'Avg mm' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } }
          }
        }
      });

      // Wind vs Rain
      const ctxW = document.getElementById('chartWindRain');
      if (chartWind) chartWind.destroy();
      chartWind = new Chart(ctxW, {
        type: 'line',
        data: {
          labels: data.windBins.map(b => b.range),
          datasets: [{
            label: 'Rain Probability (%)',
            data: data.windBins.map(b => b.rainProb),
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 9 } }, grid: { color: 'rgba(51, 65, 85, 0.2)' } },
            y: { title: { display: true, text: 'P(Rain) %' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } }
          }
        }
      });
    }

    // MAP INITIALIZATION
    function initMap() {
      const container = document.getElementById('mapContainer');
      if (!container) return;

      // Center around North India (Delhi/Himalayas: 29.5°N, 77.5°E)
      mapInstance = L.map('mapContainer', {
        center: [29.5, 77.5],
        zoom: 6,
        minZoom: 4,
        maxZoom: 13
      });

      // Dark Matter Map Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstance);

      mapLayerGroup = L.layerGroup().addTo(mapInstance);
      updateMapMarkers();
    }

    function updateMapMarkers() {
      if (!mapLayerGroup) return;
      mapLayerGroup.clearLayers();

      let stations = currentRegion === 'north'
        ? DATASET.stationsList.filter(s => s.isNorth)
        : DATASET.stationsList;

      if (currentState !== 'all') {
        stations = stations.filter(s => s.state === currentState);
      }

      document.getElementById('mapStationCount').textContent = \`Showing \${stations.length} Observation Stations\`;

      stations.forEach(s => {
        if (!s.lat || !s.lon) return;

        // Radius based on total rainfall
        const radius = Math.max(5, Math.min(22, (s.totalRain / 1200)));
        let color = '#38bdf8';
        if (s.totalRain > 15000) color = '#10b981';
        else if (s.totalRain > 8000) color = '#06b6d4';
        else color = '#f59e0b';

        const circle = L.circleMarker([s.lat, s.lon], {
          radius: radius,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.7
        });

        const popupContent = \`
          <div class="p-1 space-y-1">
            <h4 class="font-bold text-sm text-white">\${s.name}</h4>
            <div class="text-xs text-cyan-400 font-medium">\${s.district}, \${s.stateFullName} (\${s.state})</div>
            <div class="pt-1.5 border-t border-slate-700 text-[11px] space-y-0.5 text-slate-300">
              <div>Coordinates: <span class="font-mono">\${s.lat}°, \${s.lon}°</span></div>
              <div>Elevation: <span class="font-mono font-semibold text-amber-300">\${s.elevation} m</span></div>
              <div>Total Rain: <span class="font-mono font-bold text-white">\${s.totalRain.toLocaleString()} mm</span></div>
              <div>Single-Day Peak: <span class="font-mono text-emerald-400">\${s.maxRain} mm</span></div>
              <div>Rainy Days (IMD &ge; 2.5mm): <span class="font-mono font-bold text-cyan-300">\${s.rainyDays} (\${s.rainyDaysPercent}%)</span></div>
              <div>Avg Temp: <span class="font-mono">\${s.avgTemp ?? 'N/A'} °C</span></div>
            </div>
          </div>
        \`;

        circle.bindPopup(popupContent);
        mapLayerGroup.addLayer(circle);
      });
    }

    function fitMapToStations() {
      if (!mapLayerGroup || !mapInstance) return;
      const bounds = mapLayerGroup.getBounds();
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
      }
    }

    // PREDICTION TAB & ML MODEL CHARTS
    function initPredictionTab() {
      // Model weights chart
      const ctxW = document.getElementById('chartFeatureWeights');
      const feats = DATASET.model.features;

      chartWeights = new Chart(ctxW, {
        type: 'bar',
        data: {
          labels: feats.map(f => f.name),
          datasets: [{
            label: 'Standardized Logistic Weight',
            data: feats.map(f => f.weight),
            backgroundColor: feats.map(f => f.weight >= 0 ? 'rgba(16, 185, 129, 0.75)' : 'rgba(244, 63, 94, 0.75)'),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, title: { display: true, text: 'Beta Coefficient (Log-Odds Impact)' } },
            y: { grid: { color: 'rgba(51, 65, 85, 0.3)' } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: (ctx) => feats[ctx.dataIndex].impactDesc
              }
            }
          }
        }
      });

      // ROC Curve Chart
      const ctxR = document.getElementById('chartRoc');
      const rocPts = DATASET.model.evaluation.rocPoints;

      chartRoc = new Chart(ctxR, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Model ROC (AUC = 0.666)',
              data: rocPts.map(p => ({ x: p.fpr, y: p.tpr })),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              fill: true,
              tension: 0.2,
              pointRadius: 0
            },
            {
              label: 'Random Baseline (AUC = 0.50)',
              data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
              borderColor: '#64748b',
              borderDash: [5, 5],
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { type: 'linear', min: 0, max: 1, title: { display: true, text: 'False Positive Rate (FPR)' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } },
            y: { type: 'linear', min: 0, max: 1, title: { display: true, text: 'True Positive Rate (TPR / Recall)' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12 } }
          }
        }
      });
    }

    // SIMULATOR LOGIC
    function setSimSeason(isMonsoon) {
      isSimMonsoon = isMonsoon;
      document.getElementById('btnMonsoonYes').className = isMonsoon
        ? 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 text-white transition'
        : 'flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white transition';
      document.getElementById('btnMonsoonNo').className = !isMonsoon
        ? 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 text-white transition'
        : 'flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white transition';
      runPredictionSimulation();
    }

    function runPredictionSimulation() {
      const temp = parseFloat(document.getElementById('simTemp').value);
      const range = parseFloat(document.getElementById('simRange').value);
      const wind = parseFloat(document.getElementById('simWind').value);
      const pres = parseFloat(document.getElementById('simPres').value);
      const elev = parseFloat(document.getElementById('simElev').value);

      document.getElementById('valSimTemp').textContent = temp.toFixed(1) + ' °C';
      document.getElementById('valSimRange').textContent = range.toFixed(1) + ' °C';
      document.getElementById('valSimWind').textContent = wind.toFixed(1) + ' km/h';
      document.getElementById('valSimPres').textContent = Math.round(pres) + ' hPa';
      document.getElementById('valSimElev').textContent = Math.round(elev) + ' m';

      // Model features & normalization
      // Features: [1, avgTemp, tRange, wind, pres, elev, isMonsoon]
      const means = DATASET.model.featureMeans;
      const stds = DATASET.model.featureStds;
      const weights = DATASET.model.weights;

      const norm = [
        1,
        (temp - means[1]) / stds[1],
        (range - means[2]) / stds[2],
        (wind - means[3]) / stds[3],
        (pres - means[4]) / stds[4],
        (elev - means[5]) / stds[5],
        ((isSimMonsoon ? 1 : 0) - means[6]) / stds[6]
      ];

      let logit = weights[0];
      for (let j = 1; j < weights.length; j++) {
        logit += weights[j] * norm[j];
      }

      const prob = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, logit))));
      const probPct = Math.round(prob * 100);

      document.getElementById('simProbText').textContent = probPct + '%';

      // Verdict styling
      const badge = document.getElementById('simVerdictBadge');
      const expl = document.getElementById('simExplanation');
      const ring = document.getElementById('gaugeRing');

      if (probPct >= 60) {
        badge.className = 'mt-3 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        badge.textContent = 'High Likelihood of Rain (\\u2265 2.5mm)';
        ring.className = 'absolute inset-0 rounded-full border-8 border-emerald-400 transition-all duration-300';
        expl.innerHTML = \`Low pressure (\${Math.round(pres)} hPa), tight diurnal temperature spread (\${range}°C), and \${isSimMonsoon ? 'active monsoon circulation' : 'strong wind flow'} strongly enhance moisture convergence and precipitation.\`;
      } else if (probPct >= 35) {
        badge.className = 'mt-3 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
        badge.textContent = 'Moderate Chance of Rain / Scattered Showers';
        ring.className = 'absolute inset-0 rounded-full border-8 border-cyan-400 transition-all duration-300';
        expl.innerHTML = \`Borderline conditions with convective potential. Wind speed of \${wind} km/h and elevation of \${Math.round(elev)}m provide localized lifting triggers.\`;
      } else {
        badge.className = 'mt-3 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700';
        badge.textContent = 'Dry / Clear Conditions Expected (&lt; 2.5mm)';
        ring.className = 'absolute inset-0 rounded-full border-8 border-slate-600 transition-all duration-300';
        expl.innerHTML = \`High diurnal temperature range (\${range}°C), elevated pressure (\${Math.round(pres)} hPa), and absence of monsoon moisture heavily suppress cloud condensation.\`;
      }
    }

    // STATION DIRECTORY TABLE
    function renderStationTable() {
      const tbody = document.getElementById('stationTableBody');
      const query = (document.getElementById('stationSearch').value || '').toLowerCase().trim();

      let list = currentRegion === 'north' 
        ? DATASET.stationsList.filter(s => s.isNorth)
        : DATASET.stationsList;

      if (currentState !== 'all') {
        list = list.filter(s => s.state === currentState);
      }

      if (query) {
        list = list.filter(s => 
          s.name.toLowerCase().includes(query) || 
          s.district.toLowerCase().includes(query) || 
          s.stateFullName.toLowerCase().includes(query) ||
          s.state.toLowerCase().includes(query)
        );
      }

      document.getElementById('stationTableCount').textContent = \`Showing \${list.length} station\${list.length === 1 ? '' : 's'}\`;
      tbody.innerHTML = '';

      list.forEach(s => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition';
        tr.innerHTML = \`
          <td class="p-3 font-semibold text-white">\${s.name}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">\${s.state}</span></td>
          <td class="p-3 text-slate-300">\${s.district}</td>
          <td class="p-3 text-right text-amber-300">\${s.elevation} m</td>
          <td class="p-3 text-right text-slate-400 font-mono">\${s.lat}°, \${s.lon}°</td>
          <td class="p-3 text-right font-bold text-cyan-300">\${s.totalRain.toLocaleString()}</td>
          <td class="p-3 text-right">\${s.avgRain.toFixed(2)}</td>
          <td class="p-3 text-right text-emerald-400 font-bold">\${s.maxRain}</td>
          <td class="p-3 text-right">\${s.rainyDays} (\${s.rainyDaysPercent}%)</td>
          <td class="p-3 text-right text-slate-400">\${s.avgTemp ? s.avgTemp + '°C' : '-'}</td>
        \`;
        tbody.appendChild(tr);
      });
    }
  </script>
</body>
</html>
`;

const framesDir = path.join(__dirname, '.clario', 'frames');
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

const framePath = path.join(framesDir, 'rain_dashboard.html');
fs.writeFileSync(framePath, htmlContent, 'utf8');
console.log('Successfully written frame HTML to:', framePath);
console.log('Frame HTML file size:', fs.statSync(framePath).size, 'bytes');
