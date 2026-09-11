/* amp-build:1998 Ridge workbench — Light MI full-bleed inside mountain chrome.
   No Look/theme switcher. Firm guts (Live AMP / Bullhorn / MPC / Outfitter) stay behind Ask AMP. */
(function (w) {
  "use strict";

  var METRICS = [
    { key: "physicians", label: "Physician supply" },
    { key: "density", label: "Physicians / 100k" },
    { key: "postings", label: "Approx. postings" },
    { key: "ratio", label: "Openings / 100 physicians" },
    { key: "difficulty", label: "Recruiting difficulty" },
    { key: "rpp", label: "COL index (RPP)" },
    { key: "realpay", label: "Real pay value" },
    { key: "comp", label: "Median total comp" }
  ];

  /* Illustrative state COL / RPP seeds (EXAMPLE) — not live BLS */
  var STATE_RPP = {
    al: 88, ak: 105, az: 98, ar: 86, ca: 112, co: 103, ct: 108, de: 100, dc: 118, fl: 100,
    ga: 95, hi: 119, id: 94, il: 100, in: 92, ia: 90, ks: 90, ky: 89, la: 91, me: 98,
    md: 110, ma: 115, mi: 94, mn: 99, ms: 85, mo: 91, mt: 95, ne: 91, nv: 98, nh: 104,
    nj: 114, nm: 92, ny: 116, nc: 96, nd: 93, oh: 93, ok: 88, or: 104, pa: 98, ri: 102,
    sc: 93, sd: 90, tn: 92, tx: 97, ut: 98, vt: 101, va: 103, wa: 108, wv: 87, wi: 95, wy: 96
  };

  var state = {
    specialtyKey: null,
    mapMetric: "difficulty",
    selected: {},
    multi: true,
    groupFilter: "all",
    search: "",
    hover: null,
    mapReady: false
  };

  function $(id) { return document.getElementById(id); }
  function data() { return w.AMPRidgeMI || {}; }
  function specialties() { return (data().SPECIALTIES || []); }
  function stateNames() { return data().STATE_NAMES || {}; }
  function statePop() { return data().STATE_POP || {}; }

  function currentSpec() {
    var list = specialties();
    var key = state.specialtyKey || (list[0] && list[0].key);
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
    return list[0] || null;
  }

  function ampSpecGroup(s) {
    var k = (s.key || "").toLowerCase();
    var l = (s.label || "").toLowerCase();
    if (k.indexOf("dent") >= 0 || l.indexOf("dent") >= 0 || k.indexOf("hygien") >= 0 ||
        k.indexOf("orthodont") >= 0 || k.indexOf("endodont") >= 0 || k.indexOf("periodont") >= 0 ||
        k.indexOf("prosthodont") >= 0 || k.indexOf("oral_maxillofacial") >= 0 ||
        l.indexOf("orthodont") >= 0 || l.indexOf("endodont") >= 0 || l.indexOf("periodont") >= 0 ||
        l.indexOf("prosthodont") >= 0 || l.indexOf("oral & maxillofacial") >= 0) return "Dentistry";
    if (k.indexOf("nurse_practitioner") >= 0 || k.indexOf("physician_assistant") >= 0 ||
        k.indexOf("nurse_midwife") >= 0 || k.indexOf("certified_registered_nurse") >= 0 ||
        k.indexOf("crna") >= 0 || k.indexOf("np_") >= 0 || k.indexOf("_np") >= 0 ||
        k.indexOf("pa_") >= 0 || k.indexOf("_pa") >= 0 || k.indexOf("advanced_practice") >= 0 ||
        l.indexOf("nurse practitioner") >= 0 || l.indexOf("physician assistant") >= 0 ||
        l.indexOf("midwife") >= 0 || l.indexOf("crna") >= 0 || l.indexOf("nurse anesthetist") >= 0 ||
        l.indexOf("advanced practice") >= 0 || l.indexOf("(np)") >= 0 || l.indexOf("(pa)") >= 0)
      return "Advanced Practice (Mid-level)";
    if (k.indexOf("therapist") >= 0 || k.indexOf("therapy") >= 0 || k.indexOf("technolog") >= 0 ||
        k.indexOf("technician") >= 0 || k.indexOf("sonograph") >= 0 || k.indexOf("radiologic") >= 0 ||
        k.indexOf("speech") >= 0 || k.indexOf("audiolog") >= 0 || k.indexOf("laboratory") >= 0 ||
        k.indexOf("pharmacist") >= 0 || k.indexOf("pharmacy") >= 0 || k.indexOf("dietitian") >= 0 ||
        k.indexOf("nutrition") >= 0 || k.indexOf("chiropract") >= 0 || k.indexOf("optometr") >= 0 ||
        k.indexOf("podiatr") >= 0 || l.indexOf("therapist") >= 0 || l.indexOf("technician") >= 0 ||
        l.indexOf("technolog") >= 0 || l.indexOf("pharmacist") >= 0 || l.indexOf("optometr") >= 0 ||
        l.indexOf("podiatr") >= 0 || l.indexOf("chiropract") >= 0 || l.indexOf("dietitian") >= 0)
      return "Allied Health";
    return "Physicians";
  }

  function workforceTerms(s) {
    var g = ampSpecGroup(s || {});
    if (g === "Dentistry") {
      return { group: g, plural: "dentists", title: "Dentists", active: "Active dentists", vsSupply: "dentist supply",
        mapSupply: "Dental supply", mapDensity: "Dentists / 100k", mapRatio: "Openings / 100 dentists" };
    }
    if (g === "Allied Health") {
      return { group: g, plural: "clinicians", title: "Clinicians", active: "Active clinicians", vsSupply: "allied supply",
        mapSupply: "Allied supply", mapDensity: "Clinicians / 100k", mapRatio: "Openings / 100 clinicians" };
    }
    if (g === "Advanced Practice (Mid-level)") {
      return { group: g, plural: "APPs", title: "APPs", active: "Active APPs", vsSupply: "APP supply",
        mapSupply: "APP supply", mapDensity: "APPs / 100k", mapRatio: "Openings / 100 APPs" };
    }
    return { group: g, plural: "physicians", title: "Physicians", active: "Active physicians", vsSupply: "physician supply",
      mapSupply: "Physician supply", mapDensity: "Physicians / 100k", mapRatio: "Openings / 100 physicians" };
  }

  function fmtNum(n, digits) {
    if (n == null || isNaN(n)) return null;
    return Number(n).toLocaleString("en-US", {
      maximumFractionDigits: digits == null ? 0 : digits,
      minimumFractionDigits: digits == null ? 0 : digits
    });
  }
  function fmtMoney(n) {
    if (n == null || isNaN(n)) return null;
    if (Math.abs(n) >= 1000) return "$" + Math.round(n / 1000) + "k";
    return "$" + Math.round(n);
  }
  function show(v, fallback) { return v == null || v === "" ? (fallback || "n/a") : v; }

  function physCountFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.physByState && s.physByState[code] != null) return s.physByState[code] || 0;
    return 0;
  }
  function postingsFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.postingsByState && s.postingsByState[code] != null) return s.postingsByState[code] || 0;
    return 0;
  }
  function densityFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.densityByState && s.densityByState[code] != null) return s.densityByState[code] || 0;
    var n = physCountFor(code);
    var pop = statePop()[code];
    if (!pop) return 0;
    return 100000 * n / pop;
  }
  function ratioFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.ratioByState && s.ratioByState[code] != null) return s.ratioByState[code] || 0;
    var n = physCountFor(code);
    var p = postingsFor(code);
    if (!n) return 0;
    return Math.round((100 * p / n) * 100) / 100;
  }
  function difficultyFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    var dens = densityFor(code);
    var ratio = ratioFor(code);
    var age = s.age55Pct != null ? s.age55Pct : 50;
    var densScore = dens <= 0 ? 70 : Math.max(0, Math.min(100, 100 * (1 - dens / 60)));
    var ratioScore = Math.max(0, Math.min(100, ratio * 25));
    var ageScore = Math.max(0, Math.min(100, (age - 30) * 2));
    var score = 0.45 * densScore + 0.35 * ratioScore + 0.20 * ageScore;
    if (!s.physCategory && !s.nationalPostings && !s.physByState) return Math.round(score * 0.4 * 10) / 10;
    return Math.round(score * 10) / 10;
  }
  function rppFor(code) { return STATE_RPP[code] || 100; }
  function realPayFor(code) {
    var s = currentSpec();
    var p50 = s && s.totalComp && s.totalComp.p50 != null ? s.totalComp.p50 : null;
    if (p50 == null) return 0;
    var rpp = rppFor(code) || 100;
    return Math.round(p50 * (100 / rpp));
  }
  function compFor() {
    var s = currentSpec();
    return s && s.totalComp && s.totalComp.p50 != null ? s.totalComp.p50 : 0;
  }

  function metricValueFor(code) {
    if (state.mapMetric === "postings") return postingsFor(code);
    if (state.mapMetric === "ratio") return ratioFor(code);
    if (state.mapMetric === "density") return densityFor(code);
    if (state.mapMetric === "difficulty") return difficultyFor(code);
    if (state.mapMetric === "rpp") return rppFor(code);
    if (state.mapMetric === "realpay") return realPayFor(code);
    if (state.mapMetric === "comp") return compFor();
    return physCountFor(code);
  }

  function metricLabelForActive() {
    var s = currentSpec();
    var wt = workforceTerms(s);
    var map = {
      physicians: wt.mapSupply,
      density: wt.mapDensity,
      postings: "Approx. postings",
      ratio: wt.mapRatio,
      difficulty: "Recruiting difficulty",
      rpp: "COL index (RPP)",
      realpay: "Real pay value",
      comp: "Median total comp"
    };
    return map[state.mapMetric] || "Map metric";
  }

  function formatMetric(v) {
    if (v == null || isNaN(v)) return "—";
    if (state.mapMetric === "realpay" || state.mapMetric === "comp") return fmtMoney(v);
    if (state.mapMetric === "density" || state.mapMetric === "ratio" || state.mapMetric === "difficulty")
      return Number(v).toFixed(1);
    if (state.mapMetric === "rpp") return String(Math.round(v));
    return fmtNum(v);
  }

  function lerpColor(t) {
    /* Light MI: soft slate → teal → deep teal */
    t = Math.max(0, Math.min(1, t));
    var a = [186, 210, 222], b = [45, 158, 168], c = [13, 148, 136];
    var rgb;
    if (t < 0.55) {
      var u = t / 0.55;
      rgb = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    } else {
      var u2 = (t - 0.55) / 0.45;
      rgb = [b[0] + (c[0] - b[0]) * u2, b[1] + (c[1] - b[1]) * u2, b[2] + (c[2] - b[2]) * u2];
    }
    return "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")";
  }

  function vacancyBreakdown(annual) {
    if (annual == null || isNaN(annual)) return null;
    return {
      annual: annual,
      quarterly: annual / 4,
      monthly: annual / 12,
      daily: annual / 365,
      d30: annual / 365 * 30,
      d90: annual / 365 * 90,
      d180: annual / 365 * 180
    };
  }

  function timeToFillFor(s) {
    if (!s) return 118;
    if (s.timeToFillDays != null) return s.timeToFillDays;
    return 140;
  }

  function annualRevenueFor(s) {
    if (!s) return null;
    if (s.annualRevenue != null) return s.annualRevenue;
    return null;
  }

  function redrawOutlines() {
    var root = $("ridge-map-container");
    if (!root) return;
    var svg = root.querySelector("svg");
    if (!svg) return;
    var layer = svg.querySelector("#outline-layer");
    if (!layer) {
      layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      layer.setAttribute("id", "outline-layer");
      svg.appendChild(layer);
    }
    layer.innerHTML = "";
    function cloneOutline(code, cls) {
      var src = root.querySelector('[data-state="' + code + '"]');
      if (!src) return;
      var clone = src.cloneNode(true);
      clone.removeAttribute("id");
      clone.removeAttribute("class");
      clone.setAttribute("class", cls);
      clone.style.fill = "none";
      clone.style.pointerEvents = "none";
      clone.style.stroke = "";
      clone.style.strokeWidth = "";
      clone.style.filter = "";
      layer.appendChild(clone);
    }
    selectedCodes().forEach(function (code) { cloneOutline(code, "outline-selected"); });
    if (state.hover && !state.selected[state.hover]) cloneOutline(state.hover, "outline-hover");
  }

  function allStateCodes() {
    return Object.keys(stateNames());
  }

  function metricExtent() {
    var vals = allStateCodes().map(metricValueFor).filter(function (v) { return v != null && !isNaN(v) && v > 0; });
    if (!vals.length) return { min: 0, max: 1 };
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    if (min === max) max = min + 1;
    return { min: min, max: max };
  }

  function paintMap() {
    var root = $("ridge-map-container");
    if (!root) return;
    var ext = metricExtent();
    var nodes = root.querySelectorAll("[data-state]");
    nodes.forEach(function (el) {
      var code = el.getAttribute("data-state");
      var v = metricValueFor(code);
      var t = (v - ext.min) / (ext.max - ext.min);
      if (!v || isNaN(v)) t = 0.08;
      el.style.fill = lerpColor(t);
      el.classList.toggle("selected", !!state.selected[code]);
      el.classList.toggle("is-hover", state.hover === code);
    });
    var legend = $("ridge-map-legend-dynamic");
    if (legend) {
      legend.innerHTML =
        '<span class="ridge-legend-metric">' + metricLabelForActive() + '</span>' +
        '<span class="ridge-legend-scale"><i class="lo"></i> Lower</span>' +
        '<span class="ridge-legend-scale"><i class="hi"></i> Higher</span>' +
        '<span class="ridge-legend-scale"><i class="sel"></i> Selected</span>';
    }
    redrawOutlines();
  }

  function pctCells(obj, fmt) {
    if (!obj) return "";
    return [
      { l: "p25", k: "p25" },
      { l: "p50", k: "p50" },
      { l: "p75", k: "p75" },
      { l: "p90", k: "p90" }
    ].map(function (x) {
      var v = obj[x.k];
      return '<div class="pct"><div class="l">' + x.l + '</div><div class="v">' + show(fmt(v), "—") + '</div></div>';
    }).join("");
  }

  function renderBenchCards() {
    var host = $("ridge-bench-cards");
    if (!host) return;
    var s = currentSpec();
    if (!s) { host.innerHTML = ""; return; }
    var tc = s.totalComp || {};
    var rvu = s.workRVUs || {};
    var ratio = s.compRatio || {};
    var wt = workforceTerms(s);
    var html = "";

    /* Row 1 (Mike 1998): Compensation top-left, then pipeline, then workforce age.
       Row 2: former top row — supply, postings, openings ratio. */
    html += '<div class="bench-card comp bench-featured"><div class="title">Total Compensation</div>';
    html += '<div class="hero">' + show(fmtMoney(tc.p50), "n/a") + "<small>median</small></div>";
    html += '<div class="pct-grid">' + pctCells(s.totalComp, fmtMoney) + "</div>";
    if (tc.mean != null) html += '<div class="mean-line">Mean ' + fmtMoney(tc.mean) + " · MGMA · EXAMPLE</div>";
    else html += '<div class="mean-line">MGMA national · EXAMPLE</div>';
    if (ratio.p50 != null || (rvu && rvu.p50 != null)) {
      html += '<div class="bench-extra">';
      if (ratio.p50 != null) html += '<span>Comp / wRVU <b>' + show(fmtNum(ratio.p50, 2), "n/a") + "</b></span>";
      if (rvu && rvu.p50 != null) html += '<span>wRVU median <b>' + show(fmtNum(rvu.p50), "n/a") + "</b></span>";
      html += "</div>";
    }
    html += "</div>";

    html += '<div class="bench-card pipeline"><div class="title">Training pipeline (NRMP)</div>';
    if (s.pipelineFilled != null) {
      html += '<div class="hero">' + show(fmtNum(s.pipelineFilled), "n/a") + '<small>PGY-1 filled / year</small></div>';
      html += '<div class="mean-line">' + show(fmtNum(s.pipelineOffered), "") + " offered · " +
        (s.pipelineFillRate != null ? s.pipelineFillRate + "% fill" : "") + " · 2025 Match · EXAMPLE</div>";
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>no PGY-1 match breakout</small></div>';
      html += '<div class="mean-line">Subspecialties often lack separate Match counts · EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card aging"><div class="title">Workforce age 55+</div>';
    if (s.age55Pct != null) {
      html += '<div class="hero">' + s.age55Pct.toFixed(1) + '%<small>national specialty signal</small></div>';
      html += '<div class="mean-line">AAMC workforce reports · retirement pressure · EXAMPLE</div>';
    } else {
      html += '<div class="hero"><span class="na">n/a</span></div><div class="mean-line">EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card phys"><div class="title">' + (wt.active || ("Active " + wt.title)) + '</div>';
    if (s.physCategory || (s.physNational != null && s.physNational > 0)) {
      html += '<div class="hero">' + show(fmtNum(s.physNational), "n/a") + '<small>national · ' + (s.physCategory || s.label || wt.title) + '</small></div>';
      html += '<div class="mean-line">KFF May 2026 · EXAMPLE</div>';
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>limited public count</small></div>';
      html += '<div class="mean-line">' + wt.group + ' · supply snapshot · EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card postings"><div class="title">Approx. live postings</div>';
    if (s.nationalPostings) {
      html += '<div class="hero">' + show(fmtNum(s.nationalPostings), "n/a") + '<small>national JAMA</small></div>';
      html += '<div class="mean-line">' + (s.postingCategory || "") + (s.postingDemand ? " · demand " + s.postingDemand : "") + " · EXAMPLE</div>";
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>limited public count</small></div>';
      html += '<div class="mean-line">Not broken out on JAMA snapshot · EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card ratio-card"><div class="title">Openings : ' + wt.plural + '</div>';
    if (s.openingsPerPhysician != null) {
      var per100 = s.openingsPerPhysician * 100;
      html += '<div class="hero">' + per100.toFixed(2) + '<small>openings / 100 ' + wt.plural + '</small></div>';
      html += '<div class="mean-line">≈ ' + show(fmtNum(s.physiciansPerOpening, 1), "n/a") + " " + wt.plural + " per opening · EXAMPLE</div>";
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>need postings + supply</small></div>';
      html += '<div class="mean-line">Ratio needs postings and ' + wt.vsSupply + " · EXAMPLE</div>";
    }
    html += '</div>';

    host.innerHTML = html;
  }

  function selectedCodes() {
    return Object.keys(state.selected).filter(function (k) { return state.selected[k]; });
  }

  function renderSidebar() {
    var headName = $("ridge-side-name");
    var headSub = $("ridge-side-sub");
    var body = $("ridge-side-body");
    if (!body) return;
    var s = currentSpec();
    var names = stateNames();
    var picks = selectedCodes();
    var wt = workforceTerms(s || {});

    if (headName) {
      if (picks.length === 1) headName.textContent = names[picks[0]] || picks[0].toUpperCase();
      else if (picks.length > 1) headName.textContent = picks.length + " states selected";
      else headName.textContent = s ? s.label : "Specialty benchmarks";
    }
    if (headSub) {
      if (picks.length === 1) headSub.textContent = (s ? s.label + " · " : "") + picks[0].toUpperCase() + " · EXAMPLE";
      else if (picks.length > 1) headSub.textContent = (s ? s.label + " · " : "") + metricLabelForActive() + " · EXAMPLE";
      else headSub.textContent = "MGMA / KFF / JAMA / AAPPR signals · EXAMPLE";
    }

    var html = "";
    html += '<div class="sel-block">';
    html += '<div class="sel-title"><strong>Selected states</strong><span class="sel-hint">Multi-select · Cmd/Ctrl+click</span></div>';
    if (picks.length) {
      html += '<div class="sel-chips">';
      picks.slice().sort(function (a, b) {
        return (names[a] || a).localeCompare(names[b] || b);
      }).forEach(function (code) {
        html += '<span class="sel-chip">' + (names[code] || code.toUpperCase()) +
          '<button type="button" data-remove-state="' + code + '" title="Remove" aria-label="Remove">×</button></span>';
      });
      html += "</div>";
    } else {
      html += '<div class="sel-hint">None selected — click states on the map</div>';
    }
    html += "</div>";

    if (s && s.totalComp) {
      html += '<div class="section-title">Total compensation · national</div>';
      html += '<div class="row"><span class="k">Median total comp</span><span class="v"><strong>' + show(fmtMoney(s.totalComp.p50), "—") + "</strong></span></div>";
      if (s.totalComp.mean != null)
        html += '<div class="row"><span class="k">Mean total comp</span><span class="v">' + show(fmtMoney(s.totalComp.mean), "—") + "</span></div>";
      if (s.compRatio && s.compRatio.p50 != null)
        html += '<div class="row"><span class="k">Comp / wRVU</span><span class="v">' + show(fmtNum(s.compRatio.p50, 2), "—") + "</span></div>";
      if (s.workRVUs && s.workRVUs.p50 != null)
        html += '<div class="row"><span class="k">wRVU median</span><span class="v">' + show(fmtNum(s.workRVUs.p50), "—") + "</span></div>";
    }

    var ttfDays = timeToFillFor(s);
    var annualRev = annualRevenueFor(s);
    var vac = vacancyBreakdown(annualRev);
    if (vac || ttfDays) {
      html += '<div class="section-title">Time-to-fill &amp; cost of vacancy</div>';
      html += '<div class="vacancy-box">';
      html += '<div class="vac-title">Benchmark search length · AAPPR-aligned</div>';
      html += '<div class="vac-hero">' + ttfDays + ' days<small>median time-to-fill for specialty family</small></div>';
      if (vac) {
        html += '<div class="row vac-daily"><span class="k">Daily cost they\u2019re losing</span><span class="v"><strong>' + fmtMoney(vac.daily) + "</strong></span></div>";
        html += '<div class="row"><span class="k">Revenue at risk over TTF</span><span class="v"><strong>' + fmtMoney(vac.daily * ttfDays) + "</strong></span></div>";
        html += '<div class="vacancy-grid">';
        html += '<div class="cell"><div class="lbl">Daily</div><div class="val">' + fmtMoney(vac.daily) + "</div></div>";
        html += '<div class="cell"><div class="lbl">Monthly</div><div class="val">' + fmtMoney(vac.monthly) + "</div></div>";
        html += '<div class="cell"><div class="lbl">Quarterly</div><div class="val">' + fmtMoney(vac.quarterly) + "</div></div>";
        html += '<div class="cell"><div class="lbl">Annual</div><div class="val">' + fmtMoney(vac.annual) + "</div></div>";
        html += "</div>";
        html += '<div class="vacancy-scenarios">';
        html += '<div class="row"><span class="k">30-day vacancy</span><span class="v">' + fmtMoney(vac.d30) + "</span></div>";
        html += '<div class="row"><span class="k">90-day vacancy</span><span class="v">' + fmtMoney(vac.d90) + "</span></div>";
        html += '<div class="row"><span class="k">180-day vacancy</span><span class="v">' + fmtMoney(vac.d180) + "</span></div>";
        html += "</div>";
      }
      html += '<div class="note">TTF is a specialty benchmark. Revenue is directional professional medical revenue · EXAMPLE.</div>';
      html += "</div>";
    }

    if (picks.length) {
      html += '<div class="section-title">Selected states · supply &amp; openings</div>';
      var sumPhys = 0, sumPost = 0, sumPop = 0;
      var pop = statePop();
      picks.slice().sort(function (a, b) {
        return (names[a] || a).localeCompare(names[b] || b);
      }).forEach(function (code) {
        var n = physCountFor(code);
        var p = postingsFor(code);
        var d = densityFor(code);
        var diff = difficultyFor(code);
        sumPhys += n || 0;
        sumPost += p || 0;
        sumPop += pop[code] || 0;
        html += '<div class="st-card">';
        html += '<div class="st-name">' + (names[code] || code.toUpperCase()) + "</div>";
        html += '<div class="st-metrics">';
        html += '<div class="st-m"><span class="st-ml">' + wt.title + '</span><span class="st-mv">' + show(fmtNum(n), "—") + "</span></div>";
        html += '<div class="st-m"><span class="st-ml">Per 100k</span><span class="st-mv">' + Number(d).toFixed(1) + "</span></div>";
        html += '<div class="st-m"><span class="st-ml">~Jobs</span><span class="st-mv">' + show(fmtNum(p), "0") + "</span></div>";
        html += '<div class="st-m"><span class="st-ml">Difficulty</span><span class="st-mv">' + Number(diff).toFixed(1) + "</span></div>";
        html += "</div>";
        html += '<div class="st-pay"><span>COL ' + rppFor(code) + '</span><span>Real pay ' + show(fmtMoney(realPayFor(code)), "—") + "</span></div>";
        html += "</div>";
      });
      html += '<div class="row"><span class="k"><strong>Combined ' + wt.plural + '</strong></span><span class="v"><strong>' + show(fmtNum(sumPhys), "—") + "</strong></span></div>";
      if (sumPop > 0)
        html += '<div class="row"><span class="k"><strong>Combined density</strong></span><span class="v"><strong>' + (100000 * sumPhys / sumPop).toFixed(1) + " / 100k</strong></span></div>";
      if (sumPhys > 0)
        html += '<div class="row"><span class="k"><strong>Selected openings / 100</strong></span><span class="v"><strong>' + (100 * sumPost / sumPhys).toFixed(2) + "</strong></span></div>";
    } else if (s) {
      html += '<div class="section-title">National benchmarks</div>';
      html += '<div class="row"><span class="k">Active supply</span><span class="v">' + show(fmtNum(s.physNational), "—") + "</span></div>";
      html += '<div class="row"><span class="k">Approx. postings</span><span class="v">' + show(fmtNum(s.nationalPostings), "—") + "</span></div>";
      html += '<div class="row"><span class="k">Age 55+</span><span class="v">' + (s.age55Pct != null ? s.age55Pct.toFixed(1) + "%" : "—") + "</span></div>";
    }

    html += '<div class="section-title">States by ' + metricLabelForActive() + "</div>";
    html += '<div class="ridge-state-list">';
    var ranked = allStateCodes().map(function (code) {
      return { code: code, name: names[code] || code.toUpperCase(), v: metricValueFor(code) };
    }).sort(function (a, b) { return (b.v || 0) - (a.v || 0); });
    ranked.forEach(function (row) {
      var on = !!state.selected[row.code];
      html += '<button type="button" class="ridge-state-row' + (on ? " is-on" : "") + '" data-ridge-state="' + row.code + '">';
      html += '<span class="nm">' + row.name + '</span><span class="sc">' + formatMetric(row.v) + "</span></button>";
    });
    html += "</div>";
    html += '<p class="ridge-side-note">EXAMPLE / ILLUSTRATIVE · Cmd/Ctrl+click or Multi-select to compare states. No client names, search IDs, or Outfitter guts.</p>';
    body.innerHTML = html;
  }

  function updateTitle() {
    var s = currentSpec();
    var title = $("mi-app-title");
    var copy = $("mi-app-copy");
    var picks = selectedCodes();
    var names = stateNames();
    var lens = picks.length ? picks.map(function (c) { return names[c] || c.toUpperCase(); }).join(" · ") : "national lens";
    if (title) title.textContent = (s ? s.label : "Specialty") + " · " + lens;
    if (copy) copy.textContent = "Full Ridge market workbench for " + (s ? s.label : "specialty") +
      " — map, HUD cards, and state rail. EXAMPLE signals for planning; Ask AMP for Live AMP / Bullhorn / MPC / Outfitter.";
  }

  function updateMetricButtons() {
    var bar = $("ridge-metric-bar");
    if (!bar) return;
    var wt = workforceTerms(currentSpec());
    var labels = {
      physicians: wt.mapSupply,
      density: wt.mapDensity,
      postings: "Approx. postings",
      ratio: wt.mapRatio,
      difficulty: "Recruiting difficulty",
      rpp: "COL index (RPP)",
      realpay: "Real pay value",
      comp: "Median total comp"
    };
    bar.querySelectorAll(".metric-btn").forEach(function (btn) {
      var key = btn.getAttribute("data-metric");
      if (labels[key]) btn.textContent = labels[key];
      btn.classList.toggle("active", key === state.mapMetric);
    });
  }

  function populateSpecialtySelect() {
    var sel = $("mi-app-specialty");
    if (!sel) return;
    var q = (state.search || "").toLowerCase().trim();
    var current = state.specialtyKey;
    sel.innerHTML = "";
    var groups = {
      "Physicians": [],
      "Advanced Practice (Mid-level)": [],
      "Allied Health": [],
      "Dentistry": []
    };
    specialties().forEach(function (s) {
      if (q && (s.label || "").toLowerCase().indexOf(q) < 0 && (s.key || "").toLowerCase().indexOf(q) < 0) return;
      var g = ampSpecGroup(s);
      if (state.groupFilter && state.groupFilter !== "all" && g !== state.groupFilter) return;
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    });
    var order = ["Physicians", "Advanced Practice (Mid-level)", "Allied Health", "Dentistry"];
    var total = 0;
    order.forEach(function (gName) {
      var list = groups[gName] || [];
      if (!list.length) return;
      var og = document.createElement("optgroup");
      og.label = gName + " (" + list.length + ")";
      list.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.key;
        opt.textContent = s.label;
        og.appendChild(opt);
        total++;
      });
      sel.appendChild(og);
    });
    if (!total) {
      var opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No matches";
      sel.appendChild(opt);
      return;
    }
    var found = false;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === current) { found = true; break; }
    }
    if (found) sel.value = current;
    else {
      state.specialtyKey = sel.options[0].value;
      sel.value = state.specialtyKey;
    }
  }

  function setSpecialty(key) {
    state.specialtyKey = key;
    refresh();
  }

  function toggleState(code, additive) {
    if (!code) return;
    if (!additive && !state.multi) {
      var was = !!state.selected[code];
      state.selected = {};
      if (!was) state.selected[code] = true;
    } else {
      state.selected[code] = !state.selected[code];
      if (!state.selected[code]) delete state.selected[code];
    }
    paintMap();
    renderSidebar();
    updateTitle();
  }

  function clearStates() {
    state.selected = {};
    paintMap();
    renderSidebar();
    updateTitle();
  }

  function showTooltip(evt, code) {
    var tip = $("ridge-map-tooltip");
    if (!tip) return;
    if (!code) { tip.hidden = true; return; }
    var names = stateNames();
    tip.hidden = false;
    tip.innerHTML = "<strong>" + (names[code] || code.toUpperCase()) + "</strong><span>" +
      metricLabelForActive() + ": <b>" + formatMetric(metricValueFor(code)) + "</b></span>";
    var wrap = $("ridge-map-wrap") || tip.parentElement;
    var rect = wrap.getBoundingClientRect();
    var x = evt.clientX - rect.left + 12;
    var y = evt.clientY - rect.top + 12;
    tip.style.left = Math.min(x, rect.width - 180) + "px";
    tip.style.top = Math.min(y, rect.height - 60) + "px";
  }

  function ensureMapGlow(host) {
    if (!host) return;
    var svg = host.querySelector("svg");
    if (!svg) return;
    if (!svg.querySelector("#ampStateGlow")) {
      var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML =
        '<filter id="ampStateGlow" x="-120%" y="-120%" width="340%" height="340%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b1"/>' +
        '<feFlood flood-color="#ffffff" flood-opacity="0.95" result="f1"/>' +
        '<feComposite in="f1" in2="b1" operator="in" result="g1"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b2"/>' +
        '<feFlood flood-color="#0d9488" flood-opacity="0.95" result="f2"/>' +
        '<feComposite in="f2" in2="b2" operator="in" result="g2"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="16" result="b3"/>' +
        '<feFlood flood-color="#0d9488" flood-opacity="0.75" result="f3"/>' +
        '<feComposite in="f3" in2="b3" operator="in" result="g3"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="26" result="b4"/>' +
        '<feFlood flood-color="#14b8a6" flood-opacity="0.45" result="f4"/>' +
        '<feComposite in="f4" in2="b4" operator="in" result="g4"/>' +
        '<feMerge><feMergeNode in="g4"/><feMergeNode in="g3"/><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
      svg.insertBefore(defs, svg.firstChild);
    }
    if (!svg.querySelector("#outline-layer")) {
      var layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      layer.setAttribute("id", "outline-layer");
      svg.appendChild(layer);
    }
    svg.querySelectorAll("[data-state]").forEach(function (el) {
      el.style.pointerEvents = "auto";
      el.style.cursor = "pointer";
    });
    svg.querySelectorAll("g.borders path, path.separator1").forEach(function (el) {
      el.style.pointerEvents = "none";
    });
  }

  function bindMap() {
    var root = $("ridge-map-container");
    if (!root || root.getAttribute("data-ridge-bound") === "1") return;
    root.setAttribute("data-ridge-bound", "1");
    ensureMapGlow(root);

    root.addEventListener("pointerover", function (e) {
      var el = e.target.closest("[data-state]");
      if (!el || !root.contains(el)) return;
      var code = el.getAttribute("data-state");
      if (state.hover === code) return;
      state.hover = code;
      paintMap();
      showTooltip(e, state.hover);
    });
    root.addEventListener("pointermove", function (e) {
      var el = e.target.closest("[data-state]");
      if (el && root.contains(el)) {
        var code = el.getAttribute("data-state");
        if (state.hover !== code) {
          state.hover = code;
          paintMap();
        }
        showTooltip(e, state.hover);
      }
    });
    root.addEventListener("pointerleave", function () {
      if (!state.hover) return;
      state.hover = null;
      paintMap();
      showTooltip(null, null);
    });
    root.addEventListener("click", function (e) {
      var el = e.target.closest("[data-state]");
      if (!el || !root.contains(el)) return;
      e.preventDefault();
      var additive = state.multi || e.metaKey || e.ctrlKey || e.shiftKey;
      toggleState(el.getAttribute("data-state"), additive);
    });
  }

  function loadMapSvg(cb) {
    var host = $("ridge-map-container");
    if (!host) { if (cb) cb(); return; }
    if (host.querySelector("svg")) {
      state.mapReady = true;
      host.removeAttribute("data-ridge-bound");
      ensureMapGlow(host);
      bindMap();
      if (cb) cb();
      return;
    }
    fetch("assets/ridge-usa-map.svg?v=1998")
      .then(function (r) {
        if (!r.ok) throw new Error("map " + r.status);
        return r.text();
      })
      .then(function (svg) {
        host.innerHTML = svg;
        state.mapReady = true;
        host.removeAttribute("data-ridge-bound");
        ensureMapGlow(host);
        bindMap();
        if (cb) cb();
      })
      .catch(function () {
        host.innerHTML = '<p class="ridge-map-fallback">Map failed to load. Refresh or Ask AMP.</p>';
        if (cb) cb();
      });
  }

  function refresh() {
    updateMetricButtons();
    renderBenchCards();
    paintMap();
    renderSidebar();
    updateTitle();
  }

  function bindChrome() {
    var root = $("ridge-workbench");
    if (!root || root.getAttribute("data-ridge-chrome") === "1") return;
    root.setAttribute("data-ridge-chrome", "1");

    var bar = $("ridge-metric-bar");
    if (bar) {
      bar.addEventListener("click", function (e) {
        var btn = e.target.closest(".metric-btn");
        if (!btn) return;
        state.mapMetric = btn.getAttribute("data-metric") || "difficulty";
        refresh();
      });
    }

    document.querySelectorAll(".ridge-carve-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.groupFilter = btn.getAttribute("data-carve") || "all";
        document.querySelectorAll(".ridge-carve-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        populateSpecialtySelect();
        var sel = $("mi-app-specialty");
        if (sel && sel.value) state.specialtyKey = sel.value;
        refresh();
      });
    });

    var search = $("ridge-spec-search");
    if (search) {
      search.addEventListener("input", function () {
        state.search = search.value || "";
        populateSpecialtySelect();
        var sel = $("mi-app-specialty");
        if (sel && sel.value) state.specialtyKey = sel.value;
        refresh();
      });
    }

    var sel = $("mi-app-specialty");
    if (sel) {
      sel.addEventListener("change", function () {
        if (sel.value) setSpecialty(sel.value);
      });
    }

    var clearBtn = $("ridge-clear-states");
    if (clearBtn) clearBtn.addEventListener("click", clearStates);

    var multiBtn = $("ridge-multi-toggle");
    if (multiBtn) {
      multiBtn.classList.toggle("active", state.multi);
      multiBtn.addEventListener("click", function () {
        state.multi = !state.multi;
        multiBtn.classList.toggle("active", state.multi);
        multiBtn.setAttribute("aria-pressed", state.multi ? "true" : "false");
      });
    }

    var side = $("ridge-side-body");
    if (side) {
      side.addEventListener("click", function (e) {
        var rem = e.target.closest("[data-remove-state]");
        if (rem) {
          e.preventDefault();
          var code = rem.getAttribute("data-remove-state");
          if (state.selected[code]) {
            delete state.selected[code];
            paintMap();
            renderSidebar();
            updateTitle();
          }
          return;
        }
        var row = e.target.closest("[data-ridge-state]");
        if (!row) return;
        toggleState(row.getAttribute("data-ridge-state"), state.multi);
      });
    }
  }

  function buildReportHtml() {
    var s = currentSpec();
    var picks = selectedCodes();
    var names = stateNames();
    var logo = (function () {
      try {
        return new URL("assets/amp-lockup-nav.png?v=1998", window.location.href).href;
      } catch (e) {
        return "assets/amp-lockup-nav.png?v=1998";
      }
    })();
    var rows = picks.length ? picks : allStateCodes().slice(0, 12);
    var table = rows.map(function (code) {
      return "<tr><td>" + (names[code] || code.toUpperCase()) + "</td><td>" + formatMetric(metricValueFor(code)) +
        "</td><td>" + fmtNum(physCountFor(code)) + "</td><td>" + Number(difficultyFor(code)).toFixed(1) + "</td></tr>";
    }).join("");
    var tc = s && s.totalComp ? s.totalComp : {};
    return "<!doctype html><html><head><meta charset='utf-8'><title>Ridge Report · Adaptive Medical Partners</title>" +
      "<style>body{font-family:Inter,system-ui,sans-serif;color:#0f172a;padding:32px;max-width:900px;margin:0 auto}" +
      ".logo{height:52px;width:auto;margin-bottom:18px}h1{font-size:22px;margin:0 0 6px}p{color:#475569}" +
      "table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}" +
      ".stamp{display:inline-block;letter-spacing:.12em;font-size:11px;font-weight:800;color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;padding:4px 8px;border-radius:999px}" +
      ".cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0} .card{border:1px solid #e2e8f0;border-radius:12px;padding:12px} .card b{display:block;font-size:20px;margin-top:6px}" +
      "@media print{.no-print{display:none}}</style></head><body>" +
      '<img class="logo" src="' + logo + '" alt="Adaptive Medical Partners" />' +
      '<div class="stamp">EXAMPLE / ILLUSTRATIVE</div>' +
      "<h1>Ridge market report</h1>" +
      "<p><strong>" + (s ? s.label : "Specialty") + "</strong> · " + metricLabelForActive() +
      " · Generated from the Ridge sample on Adaptive Medical Partners.</p>" +
      '<div class="cards">' +
      "<div class='card'>Active supply<b>" + show(fmtNum(s && s.physNational), "n/a") + "</b></div>" +
      "<div class='card'>Approx. postings<b>" + show(fmtNum(s && s.nationalPostings), "n/a") + "</b></div>" +
      "<div class='card'>Median total comp<b>" + show(fmtMoney(tc.p50), "n/a") + "</b></div>" +
      "</div>" +
      "<table><thead><tr><th>State</th><th>Map metric</th><th>Supply</th><th>Difficulty</th></tr></thead><tbody>" +
      table + "</tbody></table>" +
      "<p style='margin-top:24px;font-size:12px;color:#64748b'>Adaptive Medical Partners · Ridge sample. Not a live Outfitter export. Ask AMP for guided recruiting next steps.</p>" +
      '<p class="no-print"><button onclick="window.print()">Print / Save PDF</button></p>' +
      "</body></html>";
  }

  function downloadReport() {
    var html = buildReportHtml();
    var wdw = window.open("", "_blank");
    if (!wdw) return false;
    wdw.document.open();
    wdw.document.write(html);
    wdw.document.close();
    return true;
  }

  function init() {
    if (!data().SPECIALTIES || !data().SPECIALTIES.length) return;
    if (!state.specialtyKey) state.specialtyKey = data().SPECIALTIES[0].key;
    populateSpecialtySelect();
    bindChrome();
    loadMapSvg(function () { refresh(); });
  }

  w.AMPRidgeWorkbench = {
    init: init,
    refresh: refresh,
    downloadReport: downloadReport,
    getSpecialtyKey: function () { return state.specialtyKey; },
    setSpecialtyKey: setSpecialty
  };
})(window);
