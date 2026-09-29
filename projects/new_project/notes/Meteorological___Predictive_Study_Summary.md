# Rain Prediction & Meteorological Study
**Region:** North India & All-India Network  
**Dataset:** `india_weather_rainfall_data.xlsx`  
**Observations Processed:** 970,339 records (2015 – 2025)  
**Total Stations:** 406 (85 in North India) across 32 States & UTs  

---

### Key Findings & IMD Thresholds

- **Total Recorded Rainfall:** 3,754,618.2 mm across India (503,348 mm in North India)
- **Mean Daily Precipitation:** 3.87 mm/day (2.67 mm/day in North India)
- **Single-Day Peak Record:** 485.9 mm (Surat, Gujarat) | 460.5 mm (Bareilly, UP)
- **Rainy Days (IMD Standard $\ge$ 2.5 mm):** 208,163 occurrences (21.5% of total dataset)
- **Precipitation Occurrences ($>$ 0 mm):** 346,545 occurrences (35.7%)

---

### Atmospheric & Predictive Model Performance

- **Model Formulation:** Multivariate Logistic Classifier predicting Daily Rain Occurrence ($Rain \ge 2.5\text{ mm}$) based on ambient predictors ($T_{avg}$, Diurnal Range, Wind, Pressure, Elevation, Season).
- **Test Accuracy:** **69.4%** on 12,938 holdout observations.
- **ROC-AUC Score:** **0.666** (significantly outperforming random guessing of 0.50).
- **Confusion Matrix:**
  - True Positives (TP): 1,533
  - False Positives (FP): 1,741
  - True Negatives (TN): 7,446
  - False Negatives (FN): 2,218

---

### Primary Physical Drivers of Rain in North India

1. **Monsoon Season ($\\beta = +0.5701$):** Dominant macro driver providing sustained southwest oceanic moisture.
2. **Diurnal Temperature Range ($\\beta = -0.2026$):** Cloud condensation and high relative humidity suppress daytime heating and nighttime radiative cooling, producing a tight diurnal spread ($<7^\circ\text{C}$) before rainfall.
3. **Wind Speed ($\\beta = +0.1816$):** Squall lines and convective wind gusts ($>25\text{ km/h}$) correlate with over 45% rain probability.
4. **Air Pressure ($\\beta = +0.1311$):** Depressions and low-pressure troughs ($<1000\text{ hPa}$) generate intense storm precipitation.
5. **Elevation Lift ($\\beta = +0.0337$):** Foothill orographic lift in Himachal Pradesh, Uttarakhand, and Jammu & Kashmir triggers localized intense precipitation.
