/*! mi-facility-state-data.js — per-state FQHC site + CAH counts (FREE public sources). No invented values. */
(function (global) {
  "use strict";
  var FQHC = {"AK": 229, "AL": 230, "AR": 285, "AZ": 302, "CA": 3085, "CO": 292, "CT": 466, "DC": 79, "DE": 16, "FL": 798, "GA": 467, "HI": 143, "IA": 135, "ID": 247, "IL": 550, "IN": 525, "KS": 181, "KY": 682, "LA": 552, "MA": 295, "MD": 173, "ME": 189, "MI": 488, "MN": 99, "MO": 483, "MS": 339, "MT": 143, "NC": 818, "ND": 36, "NE": 96, "NH": 78, "NJ": 166, "NM": 266, "NV": 80, "NY": 899, "OH": 679, "OK": 222, "OR": 330, "PA": 503, "RI": 66, "SC": 345, "SD": 41, "TN": 251, "TX": 845, "UT": 66, "VA": 247, "VT": 103, "WA": 481, "WI": 316, "WV": 550, "WY": 28, "_meta": {"source": "https://data.hrsa.gov/DataDownload/DD_Files/Health_Center_Service_Delivery_and_LookAlike_Sites.csv", "source_label": "HRSA Health Center Service Delivery and Look-Alike Sites", "source_page": "https://data.hrsa.gov/data/download", "retrieved": "2026-09-25", "unit": "service delivery sites (including look-alikes)", "total_us_sites": 18985, "note": "Counts are site rows (delivery sites), not unique awardee organizations. Territories excluded."}};
  var CAH = {"AK": 13, "AL": 9, "AR": 29, "AZ": 17, "CA": 38, "CO": 32, "CT": 0, "DC": 0, "DE": 0, "FL": 12, "GA": 31, "HI": 9, "IA": 82, "ID": 26, "IL": 55, "IN": 33, "KS": 83, "KY": 29, "LA": 27, "MA": 4, "MD": 0, "ME": 18, "MI": 35, "MN": 76, "MO": 35, "MS": 30, "MT": 50, "NC": 20, "ND": 37, "NE": 62, "NH": 13, "NJ": 0, "NM": 13, "NV": 13, "NY": 21, "OH": 33, "OK": 39, "OR": 25, "PA": 17, "RI": 0, "SC": 3, "SD": 39, "TN": 15, "TX": 93, "UT": 13, "VA": 8, "VT": 8, "WA": 39, "WI": 58, "WV": 21, "WY": 19, "_meta": {"source": "https://data.cms.gov/provider-data/dataset/xubh-q36u", "source_label": "CMS Hospital General Information (Provider Data Catalog)", "retrieved": "2026-09-25", "unit": "Critical Access Hospitals", "filter": "hospital_type == 'Critical Access Hospitals'", "total": 1382, "note": "States with 0 have no Critical Access Hospitals in CMS Hospital General Information."}};
  var META = {"fqhcHeavyThreshold": 488, "fqhcHeavyRule": "top quartile of US state site counts (inclusive of threshold)", "fqhcHeavyStates": ["CA", "FL", "IL", "IN", "KY", "LA", "MI", "NC", "NY", "OH", "PA", "TX", "WV"], "hardnessConvention": "higher facility site/hospital counts = harder (corridor pressure); matches darker/warmer=harder. Specialty supply still inverts density (thinner=harder). Prior CAH HPSA need-met remains fallback only if CAH file missing."};
  function lowerMap(obj) {
    var out = {};
    Object.keys(obj || {}).forEach(function (k) {
      if (k === "_meta") return;
      out[String(k).toLowerCase()] = obj[k];
    });
    return out;
  }
  global.MI_FACILITY_STATE_DATA = {
    fqhcSitesByState: lowerMap(FQHC),
    cahByState: lowerMap(CAH),
    fqhcMeta: FQHC._meta || {},
    cahMeta: CAH._meta || {},
    heavy: META,
    fqhcCount: function (code) {
      var v = this.fqhcSitesByState[String(code || "").toLowerCase()];
      return typeof v === "number" ? v : null;
    },
    cahCount: function (code) {
      var v = this.cahByState[String(code || "").toLowerCase()];
      return typeof v === "number" ? v : null;
    },
    isFqhcHeavy: function (code) {
      var v = this.fqhcCount(code);
      return v != null && v >= (META.fqhcHeavyThreshold || 0);
    },
    isCahHeavyByCount: function (code) {
      /* top quartile of CAH counts among states with >=1 CAH */
      var vals = Object.keys(this.cahByState).map(function (k) { return this.cahByState[k]; }.bind(this)).filter(function (v) { return v > 0; }).sort(function (a,b){return a-b;});
      if (!vals.length) return false;
      var thr = vals[Math.ceil(0.75 * vals.length) - 1];
      var v = this.cahCount(code);
      return v != null && v >= thr;
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
