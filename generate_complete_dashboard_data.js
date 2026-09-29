const fs = require('fs');
const path = require('path');
const XLSX = require('./.clario/node_modules/xlsx');

console.log('Generating complete multi-level aggregated dataset...');
const t0 = Date.now();

const wb = XLSX.readFile('./projects/new_project/sources/india_weather_rainfall_data.xlsx', { dense: true });
const sheet = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(sheet['!ref']);

const headerRow = sheet[0];
const headers = headerRow.map(c => c ? String(c.v).trim() : '');
const colIdx = {};
headers.forEach((h, i) => colIdx[h] = i);

function excelDateToDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

const northStates = ['UP', 'RJ', 'HP', 'JK', 'PB', 'HR', 'DL', 'CH'];

// Master containers
const globalData = {
  records: 0,
  totalRain: 0,
  maxRain: 0,
  rainyDays_gt0: 0,
  rainyDays_imd: 0,
  tempSum: 0,
  minTempSum: 0,
  maxTempSum: 0,
  windSum: 0,
  presSum: 0,
  validTemp: 0,
  validWind: 0,
  validPres: 0,
  months: {},
  seasons: {},
  years: {},
  tempBins: {},
  pressureBins: {},
  windBins: {}
};

const northData = {
  records: 0,
  totalRain: 0,
  maxRain: 0,
  rainyDays_gt0: 0,
  rainyDays_imd: 0,
  tempSum: 0,
  minTempSum: 0,
  maxTempSum: 0,
  windSum: 0,
  presSum: 0,
  validTemp: 0,
  validWind: 0,
  validPres: 0,
  months: {},
  seasons: {},
  years: {},
  tempBins: {},
  pressureBins: {},
  windBins: {}
};

const stateData = {};
const stationData = {};

// Sample for ML
const sampleFeatures = [];
const sampleLabels = [];
const sampleStep = 15;

const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const seasonOrder = ['Winter', 'Summer', 'Monsoon', 'Post-monsoon'];

function initAgg(obj) {
  monthOrder.forEach(m => obj.months[m] = { month: m, records: 0, rain: 0, rainyDays: 0, tempSum: 0, windSum: 0, presSum: 0 });
  seasonOrder.forEach(s => obj.seasons[s] = { season: s, records: 0, rain: 0, rainyDays: 0, tempSum: 0, windSum: 0, presSum: 0 });
}

initAgg(globalData);
initAgg(northData);

for (let r = 1; r <= range.e.r; r++) {
  const row = sheet[r];
  if (!row) continue;

  const rawDate = row[colIdx['date_of_record']]?.v;
  const month = String(row[colIdx['month']]?.v || 'Unknown').trim();
  const season = String(row[colIdx['season']]?.v || 'Unknown').trim();
  const station = String(row[colIdx['station_name']]?.v || 'Unknown').trim();
  const state = String(row[colIdx['state']]?.v || 'Unknown').trim();
  const district = String(row[colIdx['district']]?.v || 'Unknown').trim();

  const avgTemp = Number(row[colIdx['avg_temp']]?.v);
  const minTemp = Number(row[colIdx['min_temp']]?.v);
  const maxTemp = Number(row[colIdx['max_temp']]?.v);
  const wind = Number(row[colIdx['wind_speed']]?.v);
  const pres = Number(row[colIdx['air_pressure']]?.v);
  const elev = Number(row[colIdx['elevation']]?.v);
  const lat = Number(row[colIdx['latitude']]?.v);
  const lon = Number(row[colIdx['longitude']]?.v);
  const rain = Number(row[colIdx['rainfall']]?.v) || 0;

  const isRainyIMD = rain >= 2.5;
  const isRainyGt0 = rain > 0;
  const isNorth = northStates.includes(state);

  let year = null;
  if (typeof rawDate === 'number') {
    const d = excelDateToDate(rawDate);
    if (d) year = d.getUTCFullYear();
  }

  // Update helper
  function updateTarget(tgt) {
    tgt.records++;
    tgt.totalRain += rain;
    if (rain > tgt.maxRain) tgt.maxRain = rain;
    if (isRainyGt0) tgt.rainyDays_gt0++;
    if (isRainyIMD) tgt.rainyDays_imd++;

    if (!isNaN(avgTemp)) { tgt.tempSum += avgTemp; tgt.validTemp++; }
    if (!isNaN(minTemp)) tgt.minTempSum += minTemp;
    if (!isNaN(maxTemp)) tgt.maxTempSum += maxTemp;
    if (!isNaN(wind)) { tgt.windSum += wind; tgt.validWind++; }
    if (!isNaN(pres)) { tgt.presSum += pres; tgt.validPres++; }

    if (tgt.months[month]) {
      const m = tgt.months[month];
      m.records++;
      m.rain += rain;
      if (isRainyIMD) m.rainyDays++;
      if (!isNaN(avgTemp)) m.tempSum += avgTemp;
      if (!isNaN(wind)) m.windSum += wind;
      if (!isNaN(pres)) m.presSum += pres;
    }

    if (tgt.seasons[season]) {
      const s = tgt.seasons[season];
      s.records++;
      s.rain += rain;
      if (isRainyIMD) s.rainyDays++;
      if (!isNaN(avgTemp)) s.tempSum += avgTemp;
      if (!isNaN(wind)) s.windSum += wind;
      if (!isNaN(pres)) s.presSum += pres;
    }

    if (year) {
      if (!tgt.years[year]) tgt.years[year] = { year, records: 0, rain: 0, rainyDays: 0, tempSum: 0, windSum: 0, presSum: 0 };
      const y = tgt.years[year];
      y.records++;
      y.rain += rain;
      if (isRainyIMD) y.rainyDays++;
      if (!isNaN(avgTemp)) y.tempSum += avgTemp;
      if (!isNaN(wind)) y.windSum += wind;
      if (!isNaN(pres)) y.presSum += pres;
    }

    if (!isNaN(avgTemp)) {
      const tKey = Math.floor(avgTemp / 5) * 5;
      if (!tgt.tempBins[tKey]) tgt.tempBins[tKey] = { sortVal: tKey, range: `${tKey} to ${tKey + 5}°C`, count: 0, rainSum: 0, rainyCount: 0 };
      tgt.tempBins[tKey].count++;
      tgt.tempBins[tKey].rainSum += rain;
      if (isRainyIMD) tgt.tempBins[tKey].rainyCount++;
    }

    if (!isNaN(pres) && pres > 850 && pres < 1050) {
      const pKey = Math.floor(pres / 5) * 5;
      if (!tgt.pressureBins[pKey]) tgt.pressureBins[pKey] = { sortVal: pKey, range: `${pKey}-${pKey + 5} hPa`, count: 0, rainSum: 0, rainyCount: 0 };
      tgt.pressureBins[pKey].count++;
      tgt.pressureBins[pKey].rainSum += rain;
      if (isRainyIMD) tgt.pressureBins[pKey].rainyCount++;
    }

    if (!isNaN(wind) && wind >= 0 && wind <= 40) {
      const wKey = Math.floor(wind / 2) * 2;
      if (!tgt.windBins[wKey]) tgt.windBins[wKey] = { sortVal: wKey, range: `${wKey}-${wKey + 2} km/h`, count: 0, rainSum: 0, rainyCount: 0 };
      tgt.windBins[wKey].count++;
      tgt.windBins[wKey].rainSum += rain;
      if (isRainyIMD) tgt.windBins[wKey].rainyCount++;
    }
  }

  // Update Global
  updateTarget(globalData);

  // Update North
  if (isNorth) updateTarget(northData);

  // State-specific
  if (!stateData[state]) {
    stateData[state] = {
      state,
      records: 0,
      totalRain: 0,
      maxRain: 0,
      rainyDays_gt0: 0,
      rainyDays_imd: 0,
      tempSum: 0,
      minTempSum: 0,
      maxTempSum: 0,
      windSum: 0,
      presSum: 0,
      validTemp: 0,
      validWind: 0,
      validPres: 0,
      stations: new Set(),
      districts: new Set(),
      months: {},
      seasons: {},
      years: {},
      tempBins: {},
      pressureBins: {},
      windBins: {}
    };
    initAgg(stateData[state]);
  }
  const sObj = stateData[state];
  sObj.stations.add(station);
  sObj.districts.add(district);
  updateTarget(sObj);

  // Station-specific
  if (!stationData[station]) {
    stationData[station] = {
      name: station,
      state,
      district,
      lat,
      lon,
      elevation: elev,
      records: 0,
      totalRain: 0,
      maxRain: 0,
      rainyDays_imd: 0,
      tempSum: 0,
      validTemp: 0,
      windSum: 0,
      presSum: 0,
    };
  }
  const stn = stationData[station];
  stn.records++;
  stn.totalRain += rain;
  if (rain > stn.maxRain) stn.maxRain = rain;
  if (isRainyIMD) stn.rainyDays_imd++;
  if (!isNaN(avgTemp)) { stn.tempSum += avgTemp; stn.validTemp++; }
  if (!isNaN(wind)) stn.windSum += wind;
  if (!isNaN(pres)) stn.presSum += pres;

  // ML sample
  if (r % sampleStep === 0) {
    if (!isNaN(avgTemp) && !isNaN(minTemp) && !isNaN(maxTemp) && !isNaN(wind) && !isNaN(pres) && !isNaN(elev)) {
      const tRange = maxTemp - minTemp;
      const isMonsoon = season.toLowerCase().includes('monsoon') && !season.toLowerCase().includes('post') ? 1 : 0;
      sampleFeatures.push([1, avgTemp, tRange, wind, pres, elev, isMonsoon]);
      sampleLabels.push(rain >= 2.5 ? 1 : 0);
    }
  }
}

console.log('Finished row processing. Formatting aggregates...');

// Helper to format an aggregate object
function formatAgg(tgt) {
  const years = Object.values(tgt.years).sort((a, b) => a.year - b.year).map(y => ({
    year: y.year,
    records: y.records,
    totalRain: Number(y.rain.toFixed(1)),
    avgRain: Number((y.rain / y.records).toFixed(2)),
    rainyDays: y.rainyDays,
    rainyDaysPercent: Number(((y.rainyDays / y.records) * 100).toFixed(1)),
    avgTemp: y.records ? Number((y.tempSum / y.records).toFixed(1)) : null,
    avgWind: y.records ? Number((y.windSum / y.records).toFixed(1)) : null,
    avgPressure: y.records ? Number((y.presSum / y.records).toFixed(1)) : null,
  }));

  const months = monthOrder.map(m => {
    const item = tgt.months[m] || { records: 0, rain: 0, rainyDays: 0, tempSum: 0, windSum: 0, presSum: 0 };
    return {
      month: m,
      records: item.records,
      totalRain: Number(item.rain.toFixed(1)),
      avgRain: item.records ? Number((item.rain / item.records).toFixed(2)) : 0,
      rainyDays: item.rainyDays,
      rainyDaysPercent: item.records ? Number(((item.rainyDays / item.records) * 100).toFixed(1)) : 0,
      avgTemp: item.records ? Number((item.tempSum / item.records).toFixed(1)) : null,
      avgWind: item.records ? Number((item.windSum / item.records).toFixed(1)) : null,
      avgPressure: item.records ? Number((item.presSum / item.records).toFixed(1)) : null,
    };
  });

  const seasons = seasonOrder.map(s => {
    const item = tgt.seasons[s] || { records: 0, rain: 0, rainyDays: 0, tempSum: 0, windSum: 0, presSum: 0 };
    return {
      season: s,
      records: item.records,
      totalRain: Number(item.rain.toFixed(1)),
      avgRain: item.records ? Number((item.rain / item.records).toFixed(2)) : 0,
      rainyDays: item.rainyDays,
      rainyDaysPercent: item.records ? Number(((item.rainyDays / item.records) * 100).toFixed(1)) : 0,
      avgTemp: item.records ? Number((item.tempSum / item.records).toFixed(1)) : null,
      avgWind: item.records ? Number((item.windSum / item.records).toFixed(1)) : null,
      avgPressure: item.records ? Number((item.presSum / item.records).toFixed(1)) : null,
    };
  });

  const tempBins = Object.values(tgt.tempBins).sort((a, b) => a.sortVal - b.sortVal).map(b => ({
    range: b.range,
    count: b.count,
    avgRain: Number((b.rainSum / b.count).toFixed(2)),
    rainProb: Number(((b.rainyCount / b.count) * 100).toFixed(1))
  }));

  const pressureBins = Object.values(tgt.pressureBins).sort((a, b) => a.sortVal - b.sortVal).map(b => ({
    range: b.range,
    count: b.count,
    avgRain: Number((b.rainSum / b.count).toFixed(2)),
    rainProb: Number(((b.rainyCount / b.count) * 100).toFixed(1))
  }));

  const windBins = Object.values(tgt.windBins).sort((a, b) => a.sortVal - b.sortVal).map(b => ({
    range: b.range,
    count: b.count,
    avgRain: Number((b.rainSum / b.count).toFixed(2)),
    rainProb: Number(((b.rainyCount / b.count) * 100).toFixed(1))
  }));

  return {
    kpis: {
      totalRain: Number(tgt.totalRain.toFixed(1)),
      avgRain: Number((tgt.totalRain / tgt.records).toFixed(2)),
      maxRain: Number(tgt.maxRain.toFixed(1)),
      rainyDays: tgt.rainyDays_imd,
      rainyDaysGt0: tgt.rainyDays_gt0,
      rainyDaysPercent: Number(((tgt.rainyDays_imd / tgt.records) * 100).toFixed(1)),
      records: tgt.records,
      avgTemp: tgt.validTemp ? Number((tgt.tempSum / tgt.validTemp).toFixed(1)) : null,
      avgWind: tgt.validWind ? Number((tgt.windSum / tgt.validWind).toFixed(1)) : null,
      avgPressure: tgt.validPres ? Number((tgt.presSum / tgt.validPres).toFixed(1)) : null,
    },
    years,
    months,
    seasons,
    tempBins,
    pressureBins,
    windBins
  };
}

const formattedGlobal = formatAgg(globalData);
const formattedNorth = formatAgg(northData);

// State mapping dictionary
const stateFullNames = {
  'UP': 'Uttar Pradesh',
  'RJ': 'Rajasthan',
  'HP': 'Himachal Pradesh',
  'JK': 'Jammu & Kashmir',
  'PB': 'Punjab',
  'HR': 'Haryana',
  'DL': 'Delhi',
  'CH': 'Chandigarh',
  'MH': 'Maharashtra',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'TN': 'Tamil Nadu',
  'MP': 'Madhya Pradesh',
  'AS': 'Assam',
  'WB': 'West Bengal',
  'AP': 'Andhra Pradesh',
  'OR': 'Odisha',
  'GJ': 'Gujarat',
  'BR': 'Bihar',
  'AN': 'Andaman & Nicobar',
  'GA': 'Goa',
  'ML': 'Meghalaya',
  'TR': 'Tripura',
  'LD': 'Lakshadweep',
  'AR': 'Arunachal Pradesh',
  'PY': 'Puducherry',
  'SK': 'Sikkim',
  'DD': 'Daman & Diu',
  'NL': 'Nagaland',
  'MZ': 'Mizoram',
  'MN': 'Manipur',
  'CT': 'Chhattisgarh'
};

const formattedStates = {};
const statesList = Object.values(stateData).map(s => {
  const formatted = formatAgg(s);
  formattedStates[s.state] = {
    ...formatted,
    state: s.state,
    fullName: stateFullNames[s.state] || s.state,
    isNorth: northStates.includes(s.state),
    stationCount: s.stations.size,
    districtCount: s.districts.size,
    stationNames: Array.from(s.stations),
    districtNames: Array.from(s.districts),
  };
  return {
    state: s.state,
    fullName: stateFullNames[s.state] || s.state,
    isNorth: northStates.includes(s.state),
    records: s.records,
    totalRain: Number(s.totalRain.toFixed(1)),
    avgRain: Number((s.totalRain / s.records).toFixed(2)),
    maxRain: Number(s.maxRain.toFixed(1)),
    rainyDays: s.rainyDays_imd,
    rainyDaysPercent: Number(((s.rainyDays_imd / s.records) * 100).toFixed(1)),
    stationCount: s.stations.size,
    districtCount: s.districts.size,
    avgTemp: s.validTemp ? Number((s.tempSum / s.validTemp).toFixed(1)) : null,
    avgWind: s.validWind ? Number((s.windSum / s.validWind).toFixed(1)) : null,
    avgPressure: s.validPres ? Number((s.presSum / s.validPres).toFixed(1)) : null,
  };
}).sort((a, b) => b.totalRain - a.totalRain);

// Format stations
const stationsList = Object.values(stationData).map(st => ({
  name: st.name,
  state: st.state,
  stateFullName: stateFullNames[st.state] || st.state,
  district: st.district,
  isNorth: northStates.includes(st.state),
  lat: Number(st.lat.toFixed(4)),
  lon: Number(st.lon.toFixed(4)),
  elevation: Math.round(st.elevation),
  records: st.records,
  totalRain: Number(st.totalRain.toFixed(1)),
  avgRain: Number((st.totalRain / st.records).toFixed(2)),
  maxRain: Number(st.maxRain.toFixed(1)),
  rainyDays: st.rainyDays_imd,
  rainyDaysPercent: Number(((st.rainyDays_imd / st.records) * 100).toFixed(1)),
  avgTemp: st.validTemp ? Number((st.tempSum / st.validTemp).toFixed(1)) : null,
  avgWind: st.records ? Number((st.windSum / st.records).toFixed(1)) : null,
  avgPressure: st.records ? Number((st.presSum / st.records).toFixed(1)) : null,
})).sort((a, b) => b.totalRain - a.totalRain);

// Model training
const numFeats = sampleFeatures[0].length;
const fMeans = new Array(numFeats).fill(0);
const fStds = new Array(numFeats).fill(0);

for (let j = 1; j < numFeats; j++) {
  for (let i = 0; i < sampleFeatures.length; i++) {
    fMeans[j] += sampleFeatures[i][j];
  }
  fMeans[j] /= sampleFeatures.length;
  for (let i = 0; i < sampleFeatures.length; i++) {
    fStds[j] += Math.pow(sampleFeatures[i][j] - fMeans[j], 2);
  }
  fStds[j] = Math.sqrt(fStds[j] / sampleFeatures.length) || 1;
}

const splitIdx = Math.floor(sampleFeatures.length * 0.8);
const X_train = sampleFeatures.slice(0, splitIdx);
const y_train = sampleLabels.slice(0, splitIdx);
const X_test = sampleFeatures.slice(splitIdx);
const y_test = sampleLabels.slice(splitIdx);

let weights = new Array(numFeats).fill(0);
const lr = 0.08;
const epochs = 100;

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

for (let ep = 0; ep < epochs; ep++) {
  const grads = new Array(numFeats).fill(0);
  for (let i = 0; i < X_train.length; i++) {
    const x = X_train[i];
    let z = weights[0];
    for (let j = 1; j < numFeats; j++) {
      z += weights[j] * ((x[j] - fMeans[j]) / fStds[j]);
    }
    const pred = sigmoid(z);
    const err = pred - y_train[i];
    grads[0] += err;
    for (let j = 1; j < numFeats; j++) {
      grads[j] += err * ((x[j] - fMeans[j]) / fStds[j]);
    }
  }
  for (let j = 0; j < numFeats; j++) {
    weights[j] -= (lr / X_train.length) * grads[j];
  }
}

let TP = 0, FP = 0, TN = 0, FN = 0;
const testScores = [];
for (let i = 0; i < X_test.length; i++) {
  const x = X_test[i];
  let z = weights[0];
  for (let j = 1; j < numFeats; j++) {
    z += weights[j] * ((x[j] - fMeans[j]) / fStds[j]);
  }
  const prob = sigmoid(z);
  const actual = y_test[i];
  const pred = prob >= 0.30 ? 1 : 0;
  testScores.push({ prob, actual });

  if (pred === 1 && actual === 1) TP++;
  else if (pred === 1 && actual === 0) FP++;
  else if (pred === 0 && actual === 0) TN++;
  else if (pred === 0 && actual === 1) FN++;
}

const accuracy = (TP + TN) / X_test.length;
const precision = TP / (TP + FP) || 0;
const recall = TP / (TP + FN) || 0;
const f1 = 2 * (precision * recall) / (precision + recall) || 0;

testScores.sort((a, b) => b.prob - a.prob);
let auc = 0, posCount = 0, negCount = 0, rankSum = 0;
for (let i = 0; i < testScores.length; i++) {
  if (testScores[i].actual === 1) {
    posCount++;
    rankSum += (testScores.length - i);
  } else {
    negCount++;
  }
}
auc = (rankSum - (posCount * (posCount + 1)) / 2) / (posCount * negCount);

// Generate ROC curve points (FPR vs TPR)
const rocPoints = [];
const stepSize = Math.max(1, Math.floor(testScores.length / 50));
let curTP = 0, curFP = 0;
for (let i = 0; i < testScores.length; i++) {
  if (testScores[i].actual === 1) curTP++;
  else curFP++;
  if (i % stepSize === 0 || i === testScores.length - 1) {
    rocPoints.push({
      fpr: Number((curFP / negCount).toFixed(3)),
      tpr: Number((curTP / posCount).toFixed(3)),
      threshold: Number(testScores[i].prob.toFixed(3))
    });
  }
}

const featureNames = ['Intercept', 'Avg Temperature', 'Diurnal Temp Range', 'Wind Speed', 'Air Pressure', 'Elevation', 'Monsoon Season Flag'];
const featureImportances = [];
for (let j = 1; j < numFeats; j++) {
  featureImportances.push({
    name: featureNames[j],
    weight: Number(weights[j].toFixed(4)),
    absWeight: Number(Math.abs(weights[j]).toFixed(4)),
    direction: weights[j] >= 0 ? 'Increases Rain Chance' : 'Decreases Rain Chance',
    impactDesc: weights[j] >= 0 ? 'Higher values correlate with rain' : 'Higher values correlate with dry/clear skies'
  });
}
featureImportances.sort((a, b) => b.absWeight - a.absWeight);

const completeDataset = {
  meta: {
    datasetName: "India Weather & Rainfall Data (2015-2025)",
    totalRows: range.e.r,
    northIndiaStateCodes: northStates,
    allStatesCount: statesList.length,
    northStatesCount: northStates.length,
    allStationsCount: stationsList.length,
    northStationsCount: stationsList.filter(s => s.isNorth).length,
  },
  global: formattedGlobal,
  northIndia: formattedNorth,
  statesList,
  statesData: formattedStates,
  stationsList,
  model: {
    name: "Multivariate Logistic Rain Classifier (IMD Standard >= 2.5mm)",
    description: "Statistical model predicting daily rain occurrence using ambient atmospheric predictors (Temperature, Diurnal Range, Wind, Pressure, Elevation, Season).",
    target: "Rainfall Occurrence (Daily Rain >= 2.5 mm / IMD Standard)",
    evaluation: {
      accuracy: Number((accuracy * 100).toFixed(1)),
      precision: Number((precision * 100).toFixed(1)),
      recall: Number((recall * 100).toFixed(1)),
      f1Score: Number((f1 * 100).toFixed(1)),
      rocAuc: Number(auc.toFixed(3)),
      confusionMatrix: { TP, FP, TN, FN, totalTest: X_test.length },
      rocPoints
    },
    features: featureImportances,
    weights: weights.map(w => Number(w.toFixed(5))),
    featureMeans: fMeans.map(m => Number(m.toFixed(3))),
    featureStds: fStds.map(s => Number(s.toFixed(3)))
  }
};

const outPath = path.join(__dirname, '.clario', 'dashboards', 'complete_dashboard_data.json');
fs.writeFileSync(outPath, JSON.stringify(completeDataset, null, 2), 'utf8');
console.log('Successfully written complete dashboard data to:', outPath);
console.log('Total execution time:', ((Date.now() - t0)/1000).toFixed(2), 's');
