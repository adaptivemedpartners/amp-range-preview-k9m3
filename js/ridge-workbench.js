/* amp-build:2157-mi-map-pinch-zoom
   amp-build:2156-mi-place-draw-heat
   amp-build:2153 Market Intelligence workbench — Aspects v1 + AMP bands.
   Place-draw heat via AmpMiPlaceDraw engine 20260919d (js/amp-mi-place-draw-engine.js).
   Map host owns pinch-to-zoom / pan so heat + state paths + pin share one SVG transform.
   Place-draw hover/pin card only inside the committed sample / unlocked state.
   No firm iframe. No MGMA. No Look/theme switcher. Firm guts stay behind Ask AMP. */
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

  /* Aspects v1 — Market Intelligence (product term). Shared store key with firm MI. */
  var ASPECTS_V1 = [
    { id: "raw", label: "Raw",
      move: "National specialty cash ruler — YOUR Baseline (Competitive when AMP bands are set).",
      weight: "pending Mike weights" },
    { id: "place_draw", label: "Place draw",
      move: "Who lives there / desirability / COL–taxes framing. Deep metros can lower required pay when the specialty pool is deep.",
      weight: "pending Mike weights" },
    { id: "day_load", label: "Day load",
      move: "Patients/day, schedule, and pay-per-patient shift effective cash vs headline package.",
      weight: "pending Mike weights · subtype day-load rules still to bake" },
    { id: "specialty_supply", label: "Specialty supply",
      move: "How many real candidates for this specialty here (not generic market pull).",
      weight: "pending Mike weights" },
    { id: "support", label: "Support",
      move: "Culture, admin burden, and unspoken value. Soft read OK for v1.",
      weight: "qualitative v1" },
    { id: "cah", label: "CAH",
      move: "Critical access (≤25 beds) / CAH-heavy markets often need higher cash on top of geo.",
      weight: "CMS CAH counts by state when facility file present · else HPSA need-met" },
    { id: "fqhc", label: "FQHC",
      move: "Medicaid PPS / change-in-scope rules. Not “more FQHC sites = higher pay.”",
      weight: "HRSA site counts by state when facility file present · else pending" },
    { id: "cms", label: "CMS",
      move: "Revenue/collections triangulation. Subtypes inherit parent. Not auto-Baseline $.",
      weight: "pending Mike weights — triangulation language only" }
  ];
  var ASPECTS_STORE_KEY = "amp_mi_aspects_v1";
  var aspectsV1Active = ["specialty_supply"];
  /* Easy → hard. Colors match #placeHoverCard .t-dest / .t-magnet / .t-comp / .t-red. */
  var ASPECT_LADDER = [
    { band: "Destination", fill: "#a78bfa" },
    { band: "Magnet", fill: "#60a5fa" },
    { band: "Competitive", fill: "#fbbf24" },
    { band: "Red", fill: "#f87171" }
  ];

  function aspectDef(id) {
    for (var i = 0; i < ASPECTS_V1.length; i++) if (ASPECTS_V1[i].id === id) return ASPECTS_V1[i];
    return null;
  }
  function normalizeAspectsList(arr) {
    var allow = {};
    ASPECTS_V1.forEach(function (a) { allow[a.id] = 1; });
    var out = [];
    (arr || []).forEach(function (id) {
      id = String(id || "");
      if (allow[id] && out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }
  function loadAspectsV1() {
    try {
      var raw = localStorage.getItem(ASPECTS_STORE_KEY);
      if (!raw) return ["specialty_supply"];
      var list = normalizeAspectsList(JSON.parse(raw));
      var id = list.length ? list[0] : "specialty_supply";
      return [id];
    } catch (e) { return ["specialty_supply"]; }
  }
  function saveAspectsV1() {
    try { localStorage.setItem(ASPECTS_STORE_KEY, JSON.stringify(aspectsV1Active)); } catch (e) {}
  }
  function isAspectOn(id) { return aspectsV1Active.indexOf(id) >= 0; }
  function syncAspectsUi() {
    document.querySelectorAll("#ridge-aspects-chips .aspect-chip").forEach(function (btn) {
      var id = btn.getAttribute("data-aspect");
      var on = isAspectOn(id);
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var note = $("ridge-aspects-note");
    if (note) {
      var n = aspectsV1Active.length;
      note.textContent = n
        ? (n + " Aspect" + (n === 1 ? "" : "s") + " on · story panel follows · AMP bands when set · weights pending · Medicaid later")
        : "No Aspects on — turn on Raw (or others) to shape the market read";
    }
  }
  function toggleAspectV1(id) {
    if (!aspectDef(id)) return;
    var i = aspectsV1Active.indexOf(id);
    if (i >= 0) aspectsV1Active.splice(i, 1);
    else aspectsV1Active.push(id);
    aspectsV1Active = normalizeAspectsList(aspectsV1Active);
    saveAspectsV1();
    syncAspectsUi();
    try { applyAspectLayers(); } catch (e) {}
    try { renderBenchCards(); } catch (e) {}
    try { paintMap(); } catch (e) {}
    try { renderSidebar(); } catch (e) {}
  }
  function aspectHooksForSpecialty(s) {
    var hooks = w.MI_ASPECT_HOOKS || {};
    var label = s && s.label ? s.label : "";
    var cms = (hooks.cmsByLabel && hooks.cmsByLabel[label]) || null;
    var rediMap = hooks.rediByStateByLabel || {};
    var rediUs = hooks.rediUsByLabel || {};
    var redi = rediMap[label] || null;
    var tot = rediUs[label] || null;
    if (!redi) {
      var keys = Object.keys(rediMap);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (label.indexOf(k) >= 0 || k.indexOf(label) >= 0) { redi = rediMap[k]; tot = rediUs[k] || tot; break; }
      }
    }
    if (!cms && hooks.cmsByLabel) {
      var ckeys = Object.keys(hooks.cmsByLabel);
      for (var j = 0; j < ckeys.length; j++) {
        var ck = ckeys[j];
        if (label.indexOf(ck) >= 0 || ck.indexOf(label) >= 0) { cms = hooks.cmsByLabel[ck]; break; }
      }
    }
    return { cms: cms, rediByState: redi, rediUs: tot, label: label };
  }
  function aspectHookHtml(id, s) {
    var h = aspectHooksForSpecialty(s);
    var picks = selectedCodes();
    var bits = [];
    if (id === "raw") {
      var amp = getAmpBands(s);
      if (amp && amp.competitive != null) bits.push("Data: YOUR Baseline (Competitive) " + fmtMoney(amp.competitive));
      else bits.push("Data: AMP bands pending — no invented $");
      } else if (id === "place_draw") {
      bits.push("Read · " + selectionNames() + " only — neighboring regions stay outside this lens");
      var pd = placeDrawApi();
      if (pd && pd.isEnabled && pd.isEnabled()) {
        var pin = pd.getPin ? pd.getPin() : null;
        var bands = pd.getPinBands ? pd.getPinBands() : null;
        var metros = pd.METROS || [];
        var near = null;
        if (pin && metros.length) {
          var bestD = Infinity;
          for (var mi = 0; mi < metros.length; mi++) {
            var m = metros[mi];
            var dlat = (pin.lat - m.lat), dlon = (pin.lon - m.lon);
            var dd = dlat * dlat + dlon * dlon;
            if (dd < bestD) { bestD = dd; near = m; }
          }
        }
        if (pin && bands) {
          bits.push("Pin: " + (near ? near.label : "metro field") +
            (pin.state ? (" · " + String(pin.state).toUpperCase()) : "") +
            " · " + (bands.placeMode === "compress" ? "metro compress" : "cool-field amplify"));
          bits.push("Cash: Red " + fmtMoney(bands.red) +
            " · Comp " + fmtMoney(bands.competitive) +
            " · Magnet " + fmtMoney(bands.magnet) +
            " · Dest " + fmtMoney(bands.destination) +
            " — AMP YOUR Baseline ladder, not MGMA");
        }
      } else if (picks.length) {
        var parts = [];
        picks.slice(0, 6).forEach(function (code) {
          var rpp = STATE_RPP[code];
          if (rpp != null) parts.push((stateNames()[code] || code.toUpperCase()) + " COL " + rpp);
        });
        if (parts.length) bits.push("Data: " + parts.join(" · "));
      } else bits.push("Turn Place draw ON for national metro heat · COL (RPP) still available on selected states");
    } else if (id === "specialty_supply") {
      if (picks.length && h.rediByState) {
        var sum = 0, have = 0;
        picks.forEach(function (code) {
          var v = h.rediByState[code];
          if (v != null) { sum += v; have++; }
        });
        if (have) bits.push("Data: Redi residence in selection ≈ " + fmtNum(sum) +
          (h.rediUs && h.rediUs.usTotal != null ? (" · U.S. " + fmtNum(h.rediUs.usTotal)) : ""));
      }
      if (s && s.physNational != null) bits.push("Data: national supply signal " + fmtNum(s.physNational));
      if (!bits.length) bits.push("Data: Redi hook pending for this label");
    } else if (id === "cms") {
      if (h.cms && h.cms.avgAllowed != null) {
        bits.push("Data: CMS avg allowed/provider ~" + fmtMoney(h.cms.avgAllowed) +
          (h.cms.relIndex != null ? (" · rel index " + h.cms.relIndex) : "") +
          " — triangulation only, not Baseline $");
      } else bits.push("Data: CMS context not mapped for this label");
    } else if (id === "day_load") {
      bits.push("Read: patients/day and schedule shift effective cash vs headline package — qualitative v1, no invented $");
    } else if (id === "support") {
      bits.push("Read: culture / admin burden / unspoken value — qualitative v1, no invented $");
    } else if (id === "cah") {
      var cahN = hpsaPressureCodes().length;
      bits.push("Overlay pending: no public CAH pin file in this surface. " +
        (cahN ? ("HPSA pressure highlight on " + cahN + " states (need-met <50% or PC needed ≥200).") : "HPSA pressure table pending.") +
        " Not a facility directory.");
    } else if (id === "fqhc") {
      var fqN = hpsaPressureCodes().length;
      bits.push("Overlay pending: no public FQHC pin file in this surface. " +
        (fqN ? ("Same HPSA pressure corridor on " + fqN + " states — not “more sites = higher pay.”") : "HPSA pressure table pending.") +
        " Medicaid PPS language only.");
    } else {
      bits.push("Data hook: qualitative in v1");
    }
    return bits.join(" · ");
  }
  function renderAspectsStoryHtml(s) {
    var html = '<div class="aspects-story" id="ridge-aspects-story">';
    html += "<h4>Aspects · how the read moves</h4>";
    if (!aspectsV1Active.length) {
      html += '<div class="as-empty">No Aspects active. Turn on Raw (or others) above.</div></div>';
      return html;
    }
    aspectsV1Active.forEach(function (id) {
      var def = aspectDef(id);
      if (!def) return;
      html += '<div class="as-item as-live" data-aspect="' + id + '"><div class="as-name">' + def.label + "</div>";
      html += '<div class="as-move">' + def.move + "</div>";
      var hook = aspectHookHtml(id, s);
      if (hook) html += '<div class="as-hook">' + hook + "</div>";
      if (def.weight) html += '<div class="as-pending">' + def.weight + "</div>";
      html += "</div>";
    });
    html += '<div class="note" style="margin-top:8px">Aspects shape the consult story. They do not invent Baseline dollars. AMP guides are never replaced by this panel. Medicaid Aspect = later.</div>';
    html += "</div>";
    return html;
  }
  function lensId() { return aspectsV1Active[0] || "specialty_supply"; }

  function facilityData() { return w.MI_FACILITY_STATE_DATA || null; }
  function hardnessFor(code, id) {
    id = id || lensId();
    if (id === "specialty_supply") {
      var h = aspectHooksForSpecialty(currentSpec());
      var pop = statePop()[code];
      var redi = h.rediByState && typeof h.rediByState[code] === "number" ? h.rediByState[code] : null;
      if (redi > 0 && pop) return pop / redi;
      var dens = densityFor(code);
      if (dens > 0) return 1 / dens;
      return null;
    }
    if (id === "place_draw") {
      var stay = retentionFor(code);
      if (stay == null) return null;
      return 100 - stay;
    }
    if (id === "cah") {
      var fac = facilityData();
      if (fac && typeof fac.cahCount === "function") {
        var cahN = fac.cahCount(code);
        if (cahN != null) return cahN; /* higher CAH count = harder corridor pressure */
      }
      var row = hpsaFor(code);
      if (!row || row.pctMet == null) return null;
      return 100 - row.pctMet;
    }
    if (id === "fqhc") {
      var fac2 = facilityData();
      if (fac2 && typeof fac2.fqhcCount === "function") {
        var fq = fac2.fqhcCount(code);
        if (fq != null) return fq; /* higher site count = harder FQHC corridor pressure */
      }
      return null;
    }
    return null;
  }

  function bandTable(id) {
    var rows = [];
    allStateCodes().forEach(function (code) {
      var hard = hardnessFor(code, id);
      if (hard == null) return;
      rows.push({ code: code, hard: hard });
    });
    rows.sort(function (a, b) { return a.hard - b.hard; });
    var n = rows.length;
    var byCode = {};
    rows.forEach(function (row, i) {
      var q = n <= 1 ? 2 : Math.min(3, Math.floor(i * 4 / n));
      byCode[row.code] = { q: q, band: ASPECT_LADDER[q].band, fill: ASPECT_LADDER[q].fill };
    });
    return { rows: rows, byCode: byCode };
  }

  function rankRow(row, table) {
    var info = table.byCode[row.code] || {};
    var out = {
      code: row.code,
      name: stateNames()[row.code] || String(row.code).toUpperCase(),
      band: info.band || "Pending"
    };
    var fac = facilityData();
    var id = lensId();
    if (fac) {
      if (id === "cah" && fac.cahCount) {
        var cn = fac.cahCount(row.code);
        if (cn != null) out.value = String(cn);
      }
      if (id === "fqhc" && fac.fqhcCount) {
        var fn = fac.fqhcCount(row.code);
        if (fn != null) out.value = String(fn);
      }
    }
    return out;
  }

  function aspectRead(id) {
    var s = currentSpec();
    var label = (s && s.label) || "This specialty";
    var sentence = label + " · ";
    var pending = false;
    var note = "";
    if (id === "specialty_supply") {
      sentence += "Specialty supply: candidates here. Red states have fewer of this specialty per person.";
    } else if (id === "raw") {
      sentence += "Raw: national baseline. States sit on Competitive. Red on the other Aspects is where recruiting is harder.";
    } else if (id === "place_draw") {
      sentence += "Place draw: roots, pool depth, and desirability inside " + selectionNames() + ". Heat stays in the selected state, and the pin marks its top metro. On the list, Red states keep fewer trainees.";
    } else if (id === "day_load") {
      sentence += "Day load: patients per day, schedule, and housing. Pending — no file, so this lens does not recolor the map.";
      pending = true;
    } else if (id === "support") {
      sentence += "Support: culture and admin burden. Pending — no file, so this lens does not recolor the map.";
      pending = true;
    } else if (id === "cah") {
      if (facilityData() && facilityData().cahByState) {
        sentence += "CAH: Critical Access Hospital counts by state (CMS Hospital General Information). Red states have more CAHs — harder rural corridor pressure. Not a pin directory.";
      } else {
        sentence += "CAH: critical-access pressure from primary-care need met. Red states have less of that need met. Not a facility directory.";
      }
    } else if (id === "fqhc") {
      if (facilityData() && facilityData().fqhcSitesByState) {
        sentence += "FQHC: HRSA health-center service delivery site counts by state. Red states have more sites — denser FQHC corridor (not “more sites = higher pay”).";
      } else {
        sentence += "FQHC: Medicaid PPS framing. Pending — no site file, so this lens does not recolor the map.";
        pending = true;
      }
    } else {
      sentence += "CMS: national collections context for this specialty. Not a state color and not a baseline dollar.";
      pending = true;
    }

    if (id === "raw") {
      return {
        sentence: sentence,
        pending: !getAmpBands(s),
        mode: "sample",
        top: [],
        bottom: [],
        note: "Raw is one national baseline, so there is no top and bottom five."
      };
    }

    if (pending) {
      var picks = selectedCodes().filter(accessAllowsState);
      var names = stateNames();
      return {
        sentence: sentence,
        pending: true,
        mode: "sample",
        top: picks.map(function (code) {
          return { code: code, name: names[code] || String(code).toUpperCase(), band: "Pending" };
        }),
        bottom: [],
        note: ""
      };
    }

    var table = bandTable(id);
    var unlocked = table.rows.filter(function (row) { return accessAllowsState(row.code); });
    if (unlocked.length >= 5) {
      var hardest = unlocked.slice().reverse();
      var top = hardest.slice(0, 5).map(function (row) { return rankRow(row, table); });
      var bottom = unlocked.slice(0, 5).map(function (row) { return rankRow(row, table); });
      if (unlocked.length < 10) {
        var used = {};
        top.forEach(function (row) { used[row.code] = 1; });
        bottom = bottom.filter(function (row) { return !used[row.code]; });
      }
      return { sentence: sentence, pending: false, mode: "rank", top: top, bottom: bottom, note: note };
    }
    var sample = unlocked.slice().reverse().map(function (row) { return rankRow(row, table); });
    if (id === "place_draw" && !sample.length) {
      var selNames = stateNames();
      sample = selectedCodes().filter(accessAllowsState).map(function (code) {
        return { code: code, name: selNames[code] || String(code).toUpperCase(), band: "Selected" };
      });
    }
    return {
      sentence: sentence,
      pending: false,
      mode: "sample",
      top: sample,
      bottom: [],
      note: note || "A top and bottom five appears when more states are unlocked."
    };
  }

  function isCahHeavy(code) {
    var fac = facilityData();
    if (fac && fac.isCahHeavyByCount && fac.isCahHeavyByCount(code)) return true;
    var row = hpsaFor(code);
    if (!row) return false;
    return (row.pctMet != null && row.pctMet < 50) || (row.needed != null && row.needed >= 200);
  }

  function aspectCard(code) {
    if (!code || !accessAllowsPeek(code)) return null;
    var name = stateNames()[code] || String(code).toUpperCase();
    var id = lensId();
    var sentence;
    if (id === "raw") {
      sentence = name + " sits on Competitive, the national baseline.";
    } else if (id === "day_load" || id === "support" || id === "cms") {
      sentence = name + " has no " + (aspectDef(id) ? aspectDef(id).label : "lens") + " band yet.";
    } else if (id === "fqhc" && !(facilityData() && facilityData().fqhcSitesByState)) {
      sentence = name + " has no FQHC band yet.";
    } else if (id === "place_draw") {
      var placeInfo = bandTable(id).byCode[code];
      sentence = state.selected[code]
        ? name + " is the selected place" + (placeInfo ? " and reads " + placeInfo.band + " for trainee roots" : "") + ". The pin marks its top metro."
        : name + " is outside the selected place. Heat stays inside the selection.";
    } else {
      var info = bandTable(id).byCode[code];
      sentence = name + " reads " + (info ? info.band : "Pending") + " for this specialty.";
    }
    var tags = [];
    if (isCahHeavy(code)) tags.push("CAH-heavy");
    var facTag = facilityData();
    if (facTag && facTag.isFqhcHeavy && facTag.isFqhcHeavy(code)) tags.push("FQHC-heavy");
    var hooks = aspectHooksForSpecialty(currentSpec());
    if (hooks.cms) tags.push("CMS");
    var value = null;
    if (id === "cah" && facTag && facTag.cahCount) {
      var cn = facTag.cahCount(code);
      if (cn != null) value = cn + " CAHs";
    }
    if (id === "fqhc" && facTag && facTag.fqhcCount) {
      var fn = facTag.fqhcCount(code);
      if (fn != null) value = fn + " FQHC sites";
    }
    return { name: name, sentence: sentence, tags: tags, value: value };
  }

  function syncAspectRead() {
    var handle = w.AmpMiAspectsSelectorHandle;
    if (handle && handle.setSpecialtyKey) handle.setSpecialtyKey(state.specialtyKey || "");
    if (w.AmpMiAspectsSelector && w.AmpMiAspectsSelector.refresh) {
      try { w.AmpMiAspectsSelector.refresh(); } catch (e) {}
    }
    var focus = state.focus;
    if (focus && state.selected[focus] && accessAllowsPeek(focus) && w.AmpMiAspectsSelector && w.AmpMiAspectsSelector.openState) {
      try { w.AmpMiAspectsSelector.openState(focus); } catch (e2) {}
    }
  }

  function bindAspectsV1() {
    if (document._ridgeAspectsV1Bound) return;
    document._ridgeAspectsV1Bound = true;
    aspectsV1Active = loadAspectsV1();
    var host = $("mi-aspects-selector");
    var wb = $("ridge-workbench");
    if (wb) wb.classList.add("mi-aspects-on");
    if (host && w.AmpMiAspectsSelector && host.getAttribute("data-mi-aspects-selector") !== "1") {
      w.AmpMiAspectsSelector.mount(host, {
        mapEl: $("ridge-map-wrap"),
        active: aspectsV1Active[0] || "specialty_supply",
        specialtyKey: state.specialtyKey,
        exactValues: false,
        getSpecialties: function () {
          return specialties().map(function (s) { return { key: s.key, label: s.label }; });
        },
        onSpecialty: function (key) { setSpecialty(key); },
        onSelect: function (id) { setAspectLens(id); },
        getRead: aspectRead,
        getCard: aspectCard,
        onOpenState: function (code) {
          if (!code) return;
          var additive = accessAllowsMulti() && state.multi;
          toggleState(code, additive);
        }
      });
    }
    syncAspectsUi();
  }

  function setAspectLens(id) {
    if (!aspectDef(id)) return;
    aspectsV1Active = [id];
    saveAspectsV1();
    if (w.AmpMiAspectsSelector && w.AmpMiAspectsSelector.getActive && w.AmpMiAspectsSelector.getActive() !== id) {
      w.AmpMiAspectsSelector.setActive(id, { silent: true });
    }
    try { applyAspectLayers(); } catch (e) {}
    try { renderBenchCards(); } catch (e2) {}
    try { paintMap(); } catch (e3) {}
    try { renderSidebar(); } catch (e4) {}
    try { updateTitle(); } catch (e5) {}
    if (id === "place_draw") {
      var pd = placeDrawApi();
      if (pd && pd.syncSelection) { try { pd.syncSelection(); } catch (e6) {} }
      maybeFitSelection(false);
    }
    syncAspectRead();
  }


  /* Illustrative state COL / RPP seeds (EXAMPLE) — not live BLS */
  var STATE_RPP = {
    al: 88, ak: 105, az: 98, ar: 86, ca: 112, co: 103, ct: 108, de: 100, dc: 118, fl: 100,
    ga: 95, hi: 119, id: 94, il: 100, in: 92, ia: 90, ks: 90, ky: 89, la: 91, me: 98,
    md: 110, ma: 115, mi: 94, mn: 99, ms: 85, mo: 91, mt: 95, ne: 91, nv: 98, nh: 104,
    nj: 114, nm: 92, ny: 116, nc: 96, nd: 93, oh: 93, ok: 88, or: 104, pa: 98, ri: 102,
    sc: 93, sd: 90, tn: 92, tx: 97, ut: 98, vt: 101, va: 103, wa: 108, wv: 87, wi: 95, wy: 96
  };


  /* Market intel seeds (EXAMPLE) — from AMP Market Intelligence for Market Intelligence hover card */
  var RETENTION_BY_STATE = {"al":52.3,"ak":70.3,"az":54.9,"ar":55.3,"ca":75.7,"co":58.2,"ct":46.7,"de":41.2,"dc":33.6,"fl":64.5,"ga":58.5,"hi":52.5,"id":66.0,"il":53.3,"in":55.4,"ia":46.7,"ks":52.8,"ky":50.8,"la":51.8,"me":60.9,"md":45.7,"ma":54.6,"mi":53.1,"mn":51.0,"ms":52.0,"mo":48.0,"mt":58.0,"ne":52.0,"nv":54.0,"nh":45.1,"nj":48.0,"nm":50.0,"ny":48.5,"nc":52.0,"nd":50.0,"oh":51.0,"ok":52.0,"or":55.0,"pa":48.5,"ri":44.9,"sc":54.0,"sd":50.0,"tn":53.0,"tx":64.9,"ut":51.5,"vt":48.9,"va":49.1,"wa":56.1,"wv":49.0,"wi":53.9,"wy":43.0};
  var HPSA_BY_STATE = {"al":{"pctMet":67.0,"needed":239,"pop":2251179},"ak":{"pctMet":26.6,"needed":68,"pop":298176},"az":{"pctMet":42.2,"needed":776,"pop":4220172},"ar":{"pctMet":53.5,"needed":177,"pop":1123775},"ca":{"pctMet":53.6,"needed":1045,"pop":6905819},"co":{"pctMet":46.7,"needed":171,"pop":997473},"ct":{"pctMet":74.6,"needed":73,"pop":961480},"de":{"pctMet":11.2,"needed":122,"pop":394684},"dc":{"pctMet":0.2,"needed":96,"pop":286765},"fl":{"pctMet":39.6,"needed":1434,"pop":6966284},"ga":{"pctMet":39.0,"needed":563,"pop":2720812},"hi":{"pctMet":66.6,"needed":58,"pop":604780},"id":{"pctMet":47.1,"needed":85,"pop":509230},"il":{"pctMet":44.4,"needed":597,"pop":3343128},"in":{"pctMet":52.2,"needed":431,"pop":2822011},"ia":{"pctMet":37.2,"needed":197,"pop":979850},"ks":{"pctMet":41.2,"needed":122,"pop":652005},"ky":{"pctMet":31.4,"needed":388,"pop":1752671},"la":{"pctMet":72.5,"needed":220,"pop":2540625},"me":{"pctMet":60.1,"needed":26,"pop":209904},"md":{"pctMet":28.7,"needed":284,"pop":1170262},"ma":{"pctMet":58.5,"needed":81,"pop":599751},"mi":{"pctMet":47.5,"needed":464,"pop":2629221},"mn":{"pctMet":54.4,"needed":216,"pop":1503698},"ms":{"pctMet":34.9,"needed":303,"pop":1353860},"mo":{"pctMet":21.5,"needed":475,"pop":1837226},"mt":{"pctMet":42.3,"needed":57,"pop":334449},"ne":{"pctMet":49.2,"needed":36,"pop":257978},"nv":{"pctMet":43.7,"needed":180,"pop":957294},"nh":{"pctMet":78.9,"needed":14,"pop":192273},"nj":{"pctMet":70.2,"needed":24,"pop":243247},"nm":{"pctMet":43.7,"needed":182,"pop":1003706},"ny":{"pctMet":35.4,"needed":1036,"pop":4845088},"nc":{"pctMet":47.8,"needed":559,"pop":3203805},"nd":{"pctMet":37.7,"needed":37,"pop":195077},"oh":{"pctMet":48.5,"needed":686,"pop":4017969},"ok":{"pctMet":30.7,"needed":318,"pop":1279787},"or":{"pctMet":51.3,"needed":169,"pop":1022377},"pa":{"pctMet":51.6,"needed":91,"pop":461015},"ri":{"pctMet":74.3,"needed":22,"pop":257218},"sc":{"pctMet":78.5,"needed":189,"pop":2739889},"sd":{"pctMet":33.2,"needed":59,"pop":287405},"tn":{"pctMet":58.8,"needed":383,"pop":2816840},"tx":{"pctMet":51.0,"needed":1147,"pop":7346355},"ut":{"pctMet":65.4,"needed":79,"pop":703027},"vt":{"pctMet":84.2,"needed":2,"pop":43971},"va":{"pctMet":57.5,"needed":298,"pop":2221978},"wa":{"pctMet":45.4,"needed":685,"pop":4101131},"wv":{"pctMet":38.3,"needed":163,"pop":793019},"wi":{"pctMet":54.0,"needed":200,"pop":1500000},"wy":{"pctMet":40.0,"needed":40,"pop":200000}};
  var GME_PROGRAMS = {fm:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:11,ak:1,az:17,ar:15,ca:84,co:14,ct:6,de:4,dc:1,fl:39,ga:20,hi:5,id:9,il:35,in:17,ia:8,ks:6,ky:10,la:13,me:4,md:7,ma:7,mi:40,mn:13,ms:9,mo:14,mt:2,ne:5,nv:7,nh:4,nj:24,nm:7,ny:43,nc:21,nd:6,oh:41,ok:13,or:9,pa:59,pr:5,ri:2,sc:18,sd:3,tn:13,tx:43,ut:5,vt:2,va:17,wa:27,wv:8,wi:21,wy:3,_national:817},im:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:12,ak:1,az:14,ar:11,ca:66,co:4,ct:14,de:2,dc:4,fl:55,ga:21,hi:4,id:2,il:25,in:8,ia:4,ks:4,ky:7,la:11,me:1,md:13,ma:15,mi:36,mn:4,ms:9,mo:14,mt:2,ne:2,nv:6,nh:2,nj:30,nm:3,ny:65,nc:15,nd:2,oh:34,ok:5,or:6,pa:37,pr:10,ri:4,sc:10,sd:1,tn:10,tx:46,ut:1,vt:1,va:14,wa:9,wv:6,wi:6,wy:0,_national:688},obg:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:2,ak:0,az:4,ar:1,ca:25,co:2,ct:6,de:1,dc:3,fl:17,ga:6,hi:2,id:0,il:13,in:3,ia:1,ks:3,ky:3,la:5,me:1,md:5,ma:6,mi:24,mn:2,ms:1,mo:5,mt:0,ne:2,nv:2,nh:1,nj:17,nm:1,ny:36,nc:9,nd:0,oh:15,ok:4,or:1,pa:16,pr:3,ri:1,sc:5,sd:0,tn:8,tx:23,ut:1,vt:1,va:7,wa:3,wv:3,wi:3,wy:0,_national:303},pd:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:2,ak:0,az:3,ar:1,ca:18,co:1,ct:2,de:1,dc:2,fl:15,ga:5,hi:2,id:1,il:10,in:2,ia:2,ks:1,ky:2,la:5,me:1,md:4,ma:4,mi:10,mn:2,ms:1,mo:4,mt:0,ne:1,nv:2,nh:1,nj:9,nm:1,ny:32,nc:5,nd:1,oh:9,ok:3,or:1,pa:8,pr:4,ri:1,sc:3,sd:1,tn:4,tx:13,ut:1,vt:1,va:6,wa:3,wv:3,wi:3,wy:0,_national:217},psych:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:8,ak:0,az:6,ar:3,ca:38,co:2,ct:6,de:2,dc:4,fl:28,ga:8,hi:2,id:2,il:13,in:5,ia:3,ks:2,ky:2,la:5,me:3,md:7,ma:12,mi:12,mn:3,ms:2,mo:5,mt:1,ne:2,nv:4,nh:2,nj:13,nm:1,ny:46,nc:10,nd:1,oh:11,ok:4,or:3,pa:17,pr:2,ri:1,sc:5,sd:1,tn:5,tx:22,ut:1,vt:1,va:7,wa:2,wv:4,wi:4,wy:0,_national:353},em:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:2,ak:0,az:6,ar:3,ca:26,co:1,ct:2,de:2,dc:2,fl:24,ga:5,hi:0,id:0,il:13,in:2,ia:2,ks:1,ky:2,la:4,me:1,md:2,ma:5,mi:27,mn:3,ms:3,mo:5,mt:0,ne:1,nv:4,nh:1,nj:12,nm:1,ny:32,nc:7,nd:0,oh:18,ok:5,or:1,pa:22,pr:2,ri:2,sc:5,sd:1,tn:5,tx:20,ut:1,vt:1,va:7,wa:2,wv:2,wi:2,wy:0,_national:297},ortho:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:3,ak:0,az:3,ar:1,ca:17,co:1,ct:2,de:0,dc:2,fl:11,ga:4,hi:2,id:0,il:7,in:1,ia:1,ks:2,ky:2,la:4,me:0,md:5,ma:4,mi:17,mn:2,ms:1,mo:5,mt:0,ne:1,nv:2,nh:1,nj:10,nm:1,ny:19,nc:5,nd:1,oh:16,ok:2,or:2,pa:16,pr:1,ri:1,sc:3,sd:0,tn:4,tx:15,ut:1,vt:1,va:4,wa:2,wv:2,wi:2,wy:0,_national:209},gs:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:3,ak:0,az:8,ar:1,ca:27,co:5,ct:6,de:2,dc:3,fl:29,ga:8,hi:2,id:0,il:13,in:3,ia:3,ks:3,ky:3,la:6,me:1,md:8,ma:10,mi:24,mn:3,ms:2,mo:5,mt:0,ne:2,nv:3,nh:1,nj:15,nm:1,ny:40,nc:9,nd:1,oh:20,ok:3,or:2,pa:23,pr:2,ri:1,sc:6,sd:1,tn:7,tx:26,ut:2,vt:1,va:8,wa:5,wv:4,wi:4,wy:0,_national:365},rad:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:3,ak:0,az:3,ar:1,ca:20,co:1,ct:6,de:1,dc:2,fl:11,ga:3,hi:1,id:0,il:10,in:2,ia:1,ks:2,ky:2,la:4,me:1,md:3,ma:10,mi:10,mn:2,ms:1,mo:4,mt:0,ne:2,nv:1,nh:1,nj:6,nm:1,ny:25,nc:3,nd:0,oh:8,ok:3,or:1,pa:12,pr:1,ri:1,sc:1,sd:0,tn:4,tx:12,ut:1,vt:1,va:4,wa:4,wv:1,wi:3,wy:0,_national:200},derm:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:1,ak:0,az:4,ar:1,ca:12,co:1,ct:2,de:0,dc:3,fl:11,ga:3,hi:0,id:0,il:7,in:1,ia:1,ks:1,ky:1,la:2,me:0,md:3,ma:4,mi:7,mn:3,ms:1,mo:5,mt:0,ne:1,nv:0,nh:1,nj:3,nm:1,ny:12,nc:4,nd:0,oh:7,ok:1,or:2,pa:8,pr:2,ri:1,sc:1,sd:0,tn:2,tx:13,ut:1,vt:1,va:5,wa:1,wv:1,wi:3,wy:0,_national:145},gi:{_type:"fellowship",_source:"ACGME Data Resource Book AY 2024-2025",_national:242},rheum:{_type:"fellowship",_source:"ACGME Data Resource Book AY 2024-2025",_national:138},endo:{_type:"fellowship",_source:"ACGME Data Resource Book AY 2024-2025",_national:163}};
  var GME_SPEC_MAP = {
    family_medicine_without_ob:"fm", family_medicine_with_ob:"fm", family_medicine_ambulatory_only_no_inpatient_work:"fm",
    family_medicine_sports_medicine:"fm", hospitalist_family_medicine:"fm",
    internal_medicine_general:"im", internal_medicine_ambulatory_only_no_inpatient_work:"im", hospitalist_internal_medicine:"im", hospitalist_nocturnist:"im",
    ob_gyn_general:"obg", hospitalist_ob_gyn:"obg",
    pediatrics_general:"pd",
    psychiatry_general:"psych", psychiatry_child_and_adolescent:"psych", psychiatry_geriatric:"psych", psychiatry_addiction_medicine:"psych",
    emergency_medicine:"em",
    orthopedic_surgery_general:"ortho", orthopedic_surgery_sports_medicine:"ortho", orthopedic_surgery_spine:"ortho",
    orthopedic_surgery_trauma:"ortho", orthopedic_surgery_hand:"ortho", orthopedic_surgery_hip_and_joint:"ortho",
    surgery_general:"gs", surgery_trauma:"gs",
    radiology_diagnostic:"rad", radiology_interventional:"rad",
    dermatology:"derm", dermatology_mohs_surgery:"derm",
    gastroenterology:"gi", gastroenterology_hepatology:"gi",
    rheumatology:"rheum",
    endocrinology_metabolism:"endo"
  };

  var state = {
    specialtyKey: null,
    mapMetric: "difficulty",
    selected: {},
    multi: false,
    groupFilter: "all",
    search: "",
    hover: null,
    focus: "",
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
    return "$" + Math.round(Number(n)).toLocaleString("en-US");
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

  function hpsaFor(code) { return HPSA_BY_STATE[code] || null; }
  function retentionFor(code) {
    var v = RETENTION_BY_STATE[code];
    return v != null ? v : null;
  }
  function gmeKeyForSpec(s) {
    s = s || currentSpec();
    if (!s) return null;
    return GME_SPEC_MAP[s.key] || null;
  }
  function gmeProgramsFor(code, s) {
    var gk = gmeKeyForSpec(s);
    if (!gk || !GME_PROGRAMS[gk]) return null;
    var g = GME_PROGRAMS[gk];
    if (code) {
      if (g[code] != null) return { count: g[code], type: g._type, national: g._national, state: code };
      if (g._type === "fellowship") return { count: null, type: g._type, national: g._national, state: code, nationalOnly: true };
      return { count: 0, type: g._type, national: g._national, state: code };
    }
    return { count: g._national, type: g._type, national: g._national };
  }
  function isFmSpecialty(s) {
    if (!s) return false;
    var k = String(s.key || "").toLowerCase();
    return k === "family_medicine_without_ob" || k === "family_medicine_with_ob" ||
      k === "family_medicine_ambulatory_only_no_inpatient_work";
  }
  function getAmpBands(s) {
    s = s || currentSpec();
    if (s && s.ampBands && (s.ampBands.competitive != null || s.ampBands.redAlert != null)) return s.ampBands;
    var pd = placeDrawApi();
    var fm = pd && pd.SPECIALTIES && pd.SPECIALTIES.fm;
    if (isFmSpecialty(s) && fm && fm.ampBands) return fm.ampBands;
    return null;
  }
  function hpsaPressureCodes() {
    var out = [];
    Object.keys(HPSA_BY_STATE).forEach(function (code) {
      var h = HPSA_BY_STATE[code];
      if (!h) return;
      if ((h.pctMet != null && h.pctMet < 50) || (h.needed != null && h.needed >= 200)) out.push(code);
    });
    return out;
  }

  /** Public MI: AMP market bands only. Never MGMA percentiles on this surface. */
  function ampBandsHtml(amp, opts) {
    opts = opts || {};
    var cls = opts.className || "ridge-bars";
    if (!amp || amp.competitive == null) {
      return '<div class="' + cls + ' ridge-bars-pending"><div class="bar-row"><span class="bar-lbl">AMP bands</span><span class="bar-val">Pending — Mike YOUR Baseline</span></div></div>';
    }
    var maxComp = Math.max(amp.destination || 0, amp.magnet || 0, amp.competitive || 0, amp.redAlert || 0, 1);
    var html = '<div class="' + cls + '">';
    [["Red alert", amp.redAlert], ["Competitive", amp.competitive], ["Magnet", amp.magnet], ["Destination", amp.destination]].forEach(function (pair) {
      var pct = pair[1] != null ? Math.round(pair[1] / maxComp * 100) : 0;
      html += '<div class="bar-row"><span class="bar-lbl">' + pair[0] + '</span><div class="bar"><i style="width:' + pct + '%"></i></div><span class="bar-val">' + show(fmtMoney(pair[1]), "—") + "</span></div>";
    });
    html += "</div>";
    if (opts.mean !== false) {
      html += '<div class="mean-line' + (opts.meanRow ? " mean-row" : "") + '">';
      if (opts.meanRow) html += '<span class="k">Baseline</span><span class="v"><strong>Competitive</strong></span>';
      else html += "Competitive = YOUR Baseline" + (opts.meanSuffix || " · public · EXAMPLE");
      html += "</div>";
    }
    return html;
  }

  // Back-compat name: public surface must not render MGMA percentiles.
  function mgmaBarsHtml(tc, opts) {
    return ampBandsHtml(getAmpBands(), opts);
  }

  function realPayFor(code) {
    var s = currentSpec();
    var amp = getAmpBands(s);
    var base = amp && amp.competitive != null ? amp.competitive : null;
    if (base == null) return 0;
    var rpp = rppFor(code) || 100;
    return Math.round(base * (100 / rpp));
  }
  function compFor() {
    var amp = getAmpBands();
    return amp && amp.competitive != null ? amp.competitive : 0;
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
    if (!s) return 110;
    if (s.timeToFillDays != null) return s.timeToFillDays;
    return 110;
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
      var srcEl = root.querySelector('.state [data-state="' + code + '"], circle[data-state="' + code + '"]');
      if (!srcEl) srcEl = root.querySelector('[data-state="' + code + '"]');
      if (!srcEl || (srcEl.closest && srcEl.closest("#outline-layer"))) return;
      var clone = srcEl.cloneNode(true);
      clone.removeAttribute("id");
      clone.removeAttribute("class");
      clone.removeAttribute("data-state");
      clone.setAttribute("class", cls);
      clone.style.fill = "none";
      clone.style.pointerEvents = "none";
      clone.style.stroke = "#ffffff";
      clone.style.strokeWidth = "2px";
      clone.style.strokeOpacity = "0.95";
      clone.style.filter = "";
      /* AK/HI multipaths: stroke ring only — no bloom filter */
      if (code === "ak" || code === "hi") {
        clone.style.filter = "none";
        clone.style.stroke = "#0d9488";
        clone.style.strokeWidth = "2.4px";
        clone.style.strokeOpacity = "0.95";
      }
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

  function rawLegendBit() {
    var amp = getAmpBands();
    return amp && amp.competitive != null
      ? '<span class="ridge-legend-metric">Raw · YOUR Baseline ' + fmtMoney(amp.competitive) + "</span>"
      : '<span class="ridge-legend-metric">Raw · AMP bands pending</span>';
  }

  function paintMap() {
    var root = $("ridge-map-container");
    if (!root) return;
    var id = lensId();
    var placeOn = id === "place_draw";
    var choropleth = id === "specialty_supply" || id === "cah" || id === "fqhc";
    var table = choropleth ? bandTable(id) : null;
    var rawFill = getAmpBands() ? "#fbbf24" : "#eef2f6";
    var nodes = root.querySelectorAll(".state [data-state], circle[data-state]");
    nodes.forEach(function (el) {
      if (el.closest && (el.closest("#outline-layer") || el.closest("#selectionOutline") || el.closest("#placeDrawSelectionOutline") || el.closest("#placeDrawPinLayer") || el.closest("#pdLabelLayer") || el.closest("#pdPinLayer"))) return;
      var code = el.getAttribute("data-state");
      if (placeOn) {
        /* Border-only selection. Do not paint a gray/teal fill over metro heat. */
        el.style.fill = "";
      } else if (id === "raw") {
        el.style.fill = rawFill;
      } else if (table && table.byCode[code]) {
        el.style.fill = table.byCode[code].fill;
      } else {
        el.style.fill = "#eef2f6";
      }
      el.classList.toggle("pd-in-selection", !!placeOn && !!state.selected[code]);
      el.classList.toggle("selected", !placeOn && !!state.selected[code]);
      el.classList.toggle("is-hover", !placeOn && state.hover === code);
      el.classList.toggle("ridge-geo-locked", !accessAllowsState(code));
      el.classList.toggle("aspect-hpsa-pressure", false);
      el.classList.toggle("mi-aspects-filter-out", false);
      /* Avoid double-filter black blobs on AK/HI */
      if (code === "ak" || code === "hi") {
        el.style.filter = "none";
      } else {
        el.style.filter = "";
      }
    });
    var legend = $("ridge-map-legend-dynamic");
    if (legend) {
      legend.innerHTML = placeOn
        ? '<span class="ridge-legend-metric">Place draw · heat inside the selected state</span>'
        : '<span class="ridge-legend-metric">Red is harder · Destination is easier</span>';
    }
    if (placeOn) {
      var ol = root.querySelector("#outline-layer");
      if (ol) ol.innerHTML = "";
    } else {
      redrawOutlines();
    }
    try { syncAspectMapChrome(); } catch (e) {}
  }

  function pctCells(obj, fmt) {
    if (!obj) return "";
    return [
      { l: "25th", k: "p25" },
      { l: "50th", k: "p50" },
      { l: "75th", k: "p75" },
      { l: "90th", k: "p90" }
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
    var amp = getAmpBands(s);
    var rvu = s.workRVUs || {};
    var ratio = s.compRatio || {};
    var wt = workforceTerms(s);
    var html = "";

    /* Row 1: AMP market bands only on public (Competitive = YOUR Baseline). Pending if gap. */
    var rawOn = isAspectOn("raw");
    html += '<div class="bench-card comp bench-featured' + (rawOn ? " raw-aspect-on" : "") + '">';
    html += '<div class="title">' + (rawOn ? "AMP cash bands (YOUR Baseline)" : "AMP cash bands (market read)") + "</div>";
    if (amp && amp.competitive != null) {
      html += '<div class="hero">' + show(fmtMoney(amp.competitive), "n/a") +
        "<small>" + (rawOn ? "YOUR Baseline · Competitive" : "Competitive") + "</small></div>";
    } else {
      html += '<div class="hero">Pending<small>' + (rawOn ? "Raw on · AMP bands pending" : "YOUR Baseline") + "</small></div>";
    }
    html += ampBandsHtml(amp, { className: "ridge-bars ridge-bars-hud", mean: true, meanSuffix: " · public · EXAMPLE" });
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

  function selectionNames() {
    var names = stateNames();
    var picks = selectedCodes();
    if (!picks.length) return "No state selected";
    return picks.map(function (c) { return names[c] || String(c).toUpperCase(); }).join(" · ");
  }

  function aspectSnapshot(id) {
    var s = currentSpec();
    var picks = selectedCodes();
    var label = selectionNames();
    var lens = aspectDef(id) || { label: id };
    var numbers = [];
    var legend = { title: lens.label, low: "", high: "", note: "" };
    function pending(k) { numbers.push({ label: k, value: "Pending", pending: true }); }
    if (id === "raw") {
      var amp = getAmpBands(s);
      legend.low = "Lower";
      legend.high = "Higher";
      legend.note = "Map uses the active supply metric. Cash is AMP bands only.";
      if (amp && amp.competitive != null) {
        numbers.push({ label: "Competitive", value: fmtMoney(amp.competitive) });
        numbers.push({ label: "Red", value: amp.redAlert != null ? fmtMoney(amp.redAlert) : "Pending", pending: amp.redAlert == null });
        numbers.push({ label: "Magnet", value: amp.magnet != null ? fmtMoney(amp.magnet) : "Pending", pending: amp.magnet == null });
        numbers.push({ label: "Destination", value: amp.destination != null ? fmtMoney(amp.destination) : "Pending", pending: amp.destination == null });
      } else pending("YOUR Baseline");
      numbers.push({ label: "Selection", value: label });
    } else if (id === "place_draw") {
      legend.low = "Cool field";
      legend.high = "Metro glow";
      legend.note = "Heat stays inside " + label + ". Border only — no fill over the glow.";
      var pd = placeDrawApi();
      var pin = pd && pd.getPin ? pd.getPin() : null;
      var bands = pd && pd.getPinBands ? pd.getPinBands() : null;
      numbers.push({ label: "Selection", value: label });
      if (pin && pin.state && picks.indexOf(String(pin.state).toLowerCase()) >= 0) {
        var metros = (pd && pd.METROS) || [];
        var near = null;
        var bestD = Infinity;
        for (var i = 0; i < metros.length; i++) {
          var m = metros[i];
          if (m.msaOf || m.coolField) continue;
          var dd = Math.pow(pin.lat - m.lat, 2) + Math.pow(pin.lon - m.lon, 2);
          if (dd < bestD) { bestD = dd; near = m; }
        }
        numbers.push({ label: "Pin", value: (near ? near.label : "In state") });
      } else pending("Pin");
      if (bands && bands.competitive != null) {
        numbers.push({ label: "Red", value: fmtMoney(bands.red) });
        numbers.push({ label: "Competitive", value: fmtMoney(bands.competitive) });
        numbers.push({ label: "Magnet", value: fmtMoney(bands.magnet) });
        numbers.push({ label: "Destination", value: fmtMoney(bands.destination) });
      } else pending("Place-draw bands");
    } else if (id === "specialty_supply") {
      legend.low = "Thinner bench";
      legend.high = "Deeper bench";
      legend.note = "Redi residence counts for " + (s ? s.label : "this specialty") + " in " + label + ".";
      var h = aspectHooksForSpecialty(s);
      if (picks.length && h.rediByState) {
        var sum = 0, have = 0;
        picks.forEach(function (code) {
          var v = h.rediByState[code];
          if (typeof v === "number") { sum += v; have++; }
        });
        if (have) numbers.push({ label: "Redi in selection", value: fmtNum(sum) });
        else pending("Redi in selection");
        if (h.rediUs && h.rediUs.usTotal != null) numbers.push({ label: "U.S. total", value: fmtNum(h.rediUs.usTotal) });
      } else pending("Redi in selection");
      numbers.push({ label: "Selection", value: label });
    } else if (id === "cah" || id === "fqhc") {
      legend.low = "More need met";
      legend.high = "Higher pressure";
      legend.note = id === "fqhc"
        ? "Same public HPSA need-met file. Not a site count and not higher pay."
        : "Public primary-care HPSA need-met. Facility pins are pending.";
      if (picks.length) {
        var metSum = 0, metN = 0, needSum = 0;
        picks.forEach(function (code) {
          var row = hpsaFor(code);
          if (!row) return;
          if (row.pctMet != null) { metSum += row.pctMet; metN++; }
          if (row.needed != null) needSum += row.needed;
        });
        if (metN) numbers.push({ label: "HPSA need met", value: (metSum / metN).toFixed(1) + "%" });
        else pending("HPSA need met");
        if (metN) numbers.push({ label: "PC practitioners needed", value: fmtNum(needSum) });
      } else pending("HPSA need met");
      numbers.push({ label: "Selection", value: label });
      pending(id === "cah" ? "CAH facilities" : "FQHC sites");
    } else if (id === "cms") {
      legend.low = "Pending";
      legend.high = "Pending";
      legend.note = "CMS is a national triangulation for this specialty. No per-state map file — nothing invented.";
      var cms = aspectHooksForSpecialty(s).cms;
      if (cms && cms.avgAllowed != null) {
        numbers.push({ label: "Avg allowed / provider", value: fmtMoney(cms.avgAllowed) });
        numbers.push({ label: "Rel index", value: cms.relIndex != null ? String(cms.relIndex) : "Pending", pending: cms.relIndex == null });
      } else pending("CMS avg allowed");
      numbers.push({ label: "Selection", value: label });
      pending("State CMS map");
    } else if (id === "day_load") {
      legend.low = "Pending";
      legend.high = "Pending";
      legend.note = "Day load is qualitative in v1. No patients-per-day file on this surface.";
      pending("Patients / day");
      pending("Schedule shift");
      numbers.push({ label: "Selection", value: label });
    } else if (id === "support") {
      legend.low = "Pending";
      legend.high = "Pending";
      legend.note = "Support is qualitative in v1. No culture score file on this surface.";
      pending("Culture / admin");
      numbers.push({ label: "Selection", value: label });
    } else {
      legend.note = "Pending";
      pending("Figure");
    }
    return { legend: legend, numbers: numbers };
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
      else headName.textContent = s ? s.label : "Market Insight";
    }
    if (headSub) {
      if (picks.length === 1) headSub.textContent = (s ? s.label + " · " : "") + selectionNames() + " · state read";
      else if (picks.length > 1) headSub.textContent = (s ? s.label + " · " : "") + selectionNames() + " · state read";
      else headSub.textContent = "Difficulty · speed-to-fill · Total Comp · public · EXAMPLE";
    }

    var html = "";
    html += '<div class="sel-block">';
    var oneUnit = !!forcedUnitState();
    html += '<div class="sel-title"><strong>Selected states</strong><span class="sel-hint">' +
      (oneUnit ? "Demo 1×1 · committed state only"
        : (state.multi ? "Multi-select ON · click to add/remove" : "Click map · one state · Multi-select / Cmd-click to compare")) +
      "</span></div>";
    if (picks.length) {
      html += '<div class="sel-chips">';
      picks.slice().sort(function (a, b) {
        return (names[a] || a).localeCompare(names[b] || b);
      }).forEach(function (code) {
        html += '<span class="sel-chip">' + (names[code] || code.toUpperCase()) +
          (oneUnit ? "" : '<button type="button" data-remove-state="' + code + '" title="Remove" aria-label="Remove">×</button>') +
          "</span>";
      });
      html += "</div>";
    } else {
      html += '<div class="sel-hint">' + (oneUnit ? "Unlocking committed state…" : "None selected — click a state on the map") + "</div>";
    }
    html += "</div>";

    html += renderAspectsStoryHtml(s);

    html += '<div class="section-title">Market Insight</div>';
    if (picks.length === 1) {
      var code0 = picks[0];
      html += '<div class="row"><span class="k">Recruiting difficulty</span><span class="v"><strong>' +
        Number(difficultyFor(code0)).toFixed(1) + " / 100</strong></span></div>";
    } else if (picks.length > 1) {
      var sumDiff = 0;
      picks.forEach(function (c) { sumDiff += difficultyFor(c) || 0; });
      html += '<div class="row"><span class="k">Avg recruiting difficulty</span><span class="v"><strong>' +
        (sumDiff / picks.length).toFixed(1) + " / 100</strong></span></div>";
    } else if (s) {
      var codes = allStateCodes();
      var dsum = 0, dn = 0;
      codes.forEach(function (c) { var d = difficultyFor(c); if (d) { dsum += d; dn++; } });
      html += '<div class="row"><span class="k">Recruiting difficulty</span><span class="v"><strong>' +
        (dn ? (dsum / dn).toFixed(1) : "—") + " / 100</strong></span></div>";
    }

    var ttfDays = timeToFillFor(s);
    html += '<div class="row"><span class="k">Speed-to-fill</span><span class="v"><strong>~' + ttfDays +
      " days</strong></span></div>";

    if (s && (s.ampBands || s.totalComp || getAmpBands(s))) {
      var sideAmp = getAmpBands(s);
      html += '<div class="section-title">' + (isAspectOn("raw") ? "AMP cash bands (YOUR Baseline)" : "AMP cash bands (market read)") + "</div>";
      html += ampBandsHtml(sideAmp, { className: "ridge-bars", mean: true, meanRow: true, meanSuffix: "" });
      if (isAspectOn("raw")) {
        html += sideAmp && sideAmp.competitive != null
          ? '<div class="note raw-cash-note">Raw on · YOUR Baseline (Competitive) ' + fmtMoney(sideAmp.competitive) + " — AMP bands, not invented $</div>"
          : '<div class="note raw-cash-note">Raw on · AMP bands pending — no invented $</div>';
      }
      if (isAspectOn("cms")) {
        html += '<div class="note cms-tri-note">CMS is triangulation only — not Baseline $</div>';
      }
      if (s.compRatio && s.compRatio.p50 != null)
        html += '<div class="row"><span class="k">Comp / wRVU</span><span class="v">' + show(fmtNum(s.compRatio.p50, 2), "—") + "</span></div>";
      if (s.workRVUs && s.workRVUs.p50 != null)
        html += '<div class="row"><span class="k">wRVU median</span><span class="v">' + show(fmtNum(s.workRVUs.p50), "—") + "</span></div>";
    }

    var annualRev = annualRevenueFor(s);
    var vac = vacancyBreakdown(annualRev);
    if (vac) {
      html += '<div class="section-title">Cost of vacancy</div>';
      html += '<div class="vacancy-box">';
      html += '<div class="vac-title">Benchmark search length · AAPPR-aligned</div>';
      html += '<div class="vac-hero">' + ttfDays + ' days<small>median time-to-fill for specialty family</small></div>';
      html += '<div class="row vac-daily"><span class="k">Daily cost they\u2019re losing</span><span class="v"><strong>' + fmtMoney(vac.daily) + "</strong></span></div>";
      html += '<div class="row"><span class="k">Revenue at risk over TTF</span><span class="v"><strong>' + fmtMoney(vac.daily * ttfDays) + "</strong></span></div>";
      html += '<div class="vacancy-grid">';
      html += '<div class="cell"><div class="lbl">Daily</div><div class="val">' + fmtMoney(vac.daily) + "</div></div>";
      html += '<div class="cell"><div class="lbl">Monthly</div><div class="val">' + fmtMoney(vac.monthly) + "</div></div>";
      html += '<div class="cell"><div class="lbl">Quarterly</div><div class="val">' + fmtMoney(vac.quarterly) + "</div></div>";
      html += '<div class="cell"><div class="lbl">Annual</div><div class="val">' + fmtMoney(vac.annual) + "</div></div>";
      html += "</div>";
      html += '<div class="note">TTF is a specialty benchmark. Revenue is directional professional medical revenue · EXAMPLE.</div>';
      html += "</div>";
    }

    if (picks.length) {
      html += '<div class="section-title">Selected · supply &amp; openings</div>';
      var sumPhys = 0, sumPost = 0, sumPop = 0;
      var pop = statePop();
      picks.slice().sort(function (a, b) {
        return (names[a] || a).localeCompare(names[b] || b);
      }).forEach(function (code) {
        var n = physCountFor(code);
        var p = postingsFor(code);
        var dens = densityFor(code);
        var diff = difficultyFor(code);
        sumPhys += n || 0;
        sumPost += p || 0;
        sumPop += pop[code] || 0;
        html += '<div class="st-card">';
        html += '<div class="st-name">' + (names[code] || code.toUpperCase()) + "</div>";
        html += '<div class="st-metrics">';
        html += '<div class="st-m"><span class="st-ml">' + wt.title + '</span><span class="st-mv">' + show(fmtNum(n), "—") + "</span></div>";
        html += '<div class="st-m"><span class="st-ml">Per 100k</span><span class="st-mv">' + Number(dens).toFixed(1) + "</span></div>";
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

    html += '<p class="ridge-side-note">EXAMPLE / ILLUSTRATIVE · ' +
      (forcedUnitState() ? "Demo is locked to one committed state. Verify or upgrade to open another unit. "
        : "Selection stays on the map. Multi-select toggle or Cmd/Ctrl+click to compare. ") +
      "No client names or search IDs. Ask AMP for deeper firm tools.</p>";
    body.innerHTML = html;
    var pd = placeDrawApi();
    if (pd && isAspectOn("place_draw")) {
      try { pd.ensureScaffold(); pd.refreshPanel(); } catch (e) {}
    }
  }

  function updateTitle() {
    var s = currentSpec();
    var title = $("mi-app-title");
    var copy = $("mi-app-copy");
    var picks = selectedCodes();
    var names = stateNames();
    var lens = picks.length ? picks.map(function (c) { return names[c] || c.toUpperCase(); }).join(" · ") : "national lens";
    if (title) title.textContent = (s ? s.label : "Specialty") + " · " + lens;
    if (copy) copy.textContent = "Full Market Intelligence workbench for " + (s ? s.label : "specialty") +
      " — map, HUD cards, and state rail. EXAMPLE signals for planning; Ask AMP for deeper firm tools.";
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

  function accessApi() {
    return w.AMPRidgeAccess || null;
  }
  function accessAllowsState(code) {
    var api = accessApi();
    if (!api || typeof api.canState !== "function") return true;
    return !!api.canState(code);
  }
  function accessAllowsPeek(code) {
    var api = accessApi();
    if (!api) return true;
    if (typeof api.allowsPeek === "function") return !!api.allowsPeek(code);
    return accessAllowsState(code);
  }
  function accessAllowsMulti() {
    var api = accessApi();
    if (!api || typeof api.allowsMulti !== "function") return true;
    return !!api.allowsMulti();
  }
  function forcedUnitState() {
    var api = accessApi();
    if (!api || typeof api.oneStateUnit !== "function") return "";
    return api.normState ? api.normState(api.oneStateUnit()) : String(api.oneStateUnit() || "");
  }
  function ensureForcedSelection() {
    var forced = forcedUnitState();
    if (!accessAllowsMulti()) state.multi = false;
    if (!forced) return forced;
    state.selected = {};
    state.selected[forced] = true;
    if (!state.focus || !state.selected[state.focus]) state.focus = forced;
    return forced;
  }
  function gateSpecialty(key) {
    var api = accessApi();
    if (!api || typeof api.trySpecialty !== "function") return { ok: true };
    return api.trySpecialty(key);
  }
  function gateState(code) {
    var api = accessApi();
    if (!api || typeof api.tryState !== "function") return { ok: true };
    return api.tryState(code);
  }

  function setSpecialty(key) {
    if (!key) return;
    var gate = gateSpecialty(key);
    if (!gate.ok) {
      var sel = $("mi-app-specialty");
      if (sel && state.specialtyKey) sel.value = state.specialtyKey;
      var handle = w.AmpMiAspectsSelectorHandle;
      if (handle && handle.setSpecialtyKey) handle.setSpecialtyKey(state.specialtyKey);
      return;
    }
    state.specialtyKey = key;
    var appSel = $("mi-app-specialty");
    if (appSel) appSel.value = key;
    refresh();
  }

  function toggleState(code, additive) {
    if (!code) return;
    var api = accessApi();
    var norm = api && api.normState ? api.normState(code) : String(code).toLowerCase();
    if (!accessAllowsMulti()) {
      additive = false;
      state.multi = false;
    }
    var forced = forcedUnitState();
    if (forced) {
      ensureForcedSelection();
      state.focus = forced;
      afterGeoChange();
      return;
    }
    var willSelect = true;
    if (state.selected[norm] && (additive || state.multi)) willSelect = false;
    else if (!additive && !state.multi && state.selected[norm] && selectedCodes().length === 1) willSelect = false;
    if (willSelect) {
      var gate = gateState(norm);
      if (!gate.ok) return;
    }
    var multi = !!additive || !!state.multi;
    if (multi) {
      state.selected[norm] = !state.selected[norm];
      if (!state.selected[norm]) delete state.selected[norm];
    } else {
      var only = selectedCodes();
      if (only.length === 1 && only[0] === norm) state.selected = {};
      else {
        state.selected = {};
        state.selected[norm] = true;
      }
    }
    state.focus = state.selected[norm] ? norm : (selectedCodes()[0] || "");
    afterGeoChange();
  }

  function clearStates() {
    if (forcedUnitState()) {
      ensureForcedSelection();
    } else {
      state.selected = {};
    }
    afterGeoChange();
  }

  function afterGeoChange() {
    paintMap();
    renderSidebar();
    updateTitle();
    var pd = placeDrawApi();
    if (pd && isAspectOn("place_draw") && pd.syncSelection) {
      try { pd.syncSelection(); } catch (ePd) {}
    }
    maybeFitSelection(true);
    syncAspectRead();
  }

  function showTooltip(evt, code) {
    var tip = $("ridge-map-tooltip");
    var wb = $("ridge-workbench");
    if (wb && wb.classList.contains("mi-aspects-on")) {
      if (tip) { tip.hidden = true; tip.innerHTML = ""; }
      return;
    }
    if (!tip) return;
    if (!code) { tip.hidden = true; tip.innerHTML = ""; return; }
    var names = stateNames();
    if (!accessAllowsPeek(code)) {
      tip.hidden = false;
      tip.innerHTML = '<div class="tt-head"><div class="tt-title">' + (names[code] || String(code).toUpperCase()) +
        '</div><div class="tt-hint">Locked</div></div>' +
        '<div class="tt-body tt-lock"><strong>Verify / upgrade to unlock</strong>' +
        "<p>Demo is 1 state × 1 specialty. This state stays dark until you verify or subscribe.</p></div>";
      var wrapLock = $("ridge-map-wrap") || tip.parentElement;
      if (evt && wrapLock) {
        var rectL = wrapLock.getBoundingClientRect();
        var twL = tip.offsetWidth || 260;
        var thL = tip.offsetHeight || 120;
        var xL = evt.clientX - rectL.left + 14;
        var yL = evt.clientY - rectL.top + 14;
        if (xL + twL > rectL.width - 8) xL = Math.max(8, rectL.width - twL - 8);
        if (yL + thL > rectL.height - 8) yL = Math.max(8, evt.clientY - rectL.top - thL - 12);
        tip.style.left = xL + "px";
        tip.style.top = yL + "px";
      }
      return;
    }
    var s = currentSpec();
    var wt = workforceTerms(s || {});
    var n = physCountFor(code);
    var p = postingsFor(code);
    var r = ratioFor(code);
    var dens = densityFor(code);
    var diff = difficultyFor(code);
    var h = hpsaFor(code);
    var ret = retentionFor(code);
    var rows = "";
    function addRow(k, v) {
      if (v == null || v === "") return;
      rows += '<div class="tt-row"><span class="tt-k">' + k + '</span><span class="tt-v">' + v + "</span></div>";
    }
    addRow(wt.title, n ? Number(n).toLocaleString("en-US") : "0");
    if (dens) addRow(wt.title + " density", Number(dens).toFixed(1) + " / 100k");
    if (s && s.nationalPostings) addRow("Approx. postings", "~" + Math.round(p || 0).toLocaleString("en-US"));
    if (r) addRow("Openings / 100 " + wt.plural, String(r));
    if (diff) addRow("Difficulty", diff + " / 100");
    var rpp = rppFor(code);
    if (rpp != null) {
      var vs = rpp - 100;
      addRow("COL (BEA RPP)", Number(rpp).toFixed(1) + " (" + (vs >= 0 ? "+" : "") + Number(vs).toFixed(1) + "% vs U.S.)");
      var realPay = realPayFor(code);
      if (realPay) addRow("Real value of nat. median", fmtMoney(realPay));
    }
    var gme = gmeProgramsFor(code, s);
    if (gme) {
      if (gme.nationalOnly) addRow(gme.type === "fellowship" ? "Fellowships (U.S.)" : "Residencies (U.S.)", String(gme.national));
      else if (gme.count != null) addRow(gme.type === "fellowship" ? "Fellowships in state" : "Residencies in state", String(gme.count) + " (U.S. " + gme.national + ")");
    }
    var extra = "";
    if (h) {
      extra += '<div class="tt-section"><div class="tt-section-label">Primary care HPSA</div>';
      extra += '<div class="tt-row"><span class="tt-k">Need met</span><span class="tt-v">' + h.pctMet.toFixed(0) + "%</span></div>";
      extra += '<div class="tt-row"><span class="tt-k">PC needed</span><span class="tt-v">' + Number(h.needed).toLocaleString("en-US") + "</span></div></div>";
    }
    if (ret != null) {
      extra += '<div class="tt-section"><div class="tt-section-label">GME retention</div>';
      extra += '<div class="tt-row"><span class="tt-k">Stay in-state</span><span class="tt-v">' + Number(ret).toFixed(1) + "%</span></div></div>";
    }
    var hint = !accessAllowsMulti()
      ? "Demo 1×1 · other states locked"
      : (state.multi ? "Multi-select ON · click to add/remove" : "Cmd/Ctrl · multi-select");
    tip.hidden = false;
    tip.innerHTML = '<div class="tt-head"><div class="tt-title">' + (names[code] || code.toUpperCase()) +
      '</div><div class="tt-hint">' + hint + '</div></div><div class="tt-body">' + rows + extra + "</div>";
    var wrap = $("ridge-map-wrap") || tip.parentElement;
    var rect = wrap.getBoundingClientRect();
    var tw = tip.offsetWidth || 260;
    var th = tip.offsetHeight || 220;
    var x = evt.clientX - rect.left + 14;
    var y = evt.clientY - rect.top + 14;
    if (x + tw > rect.width - 8) x = Math.max(8, rect.width - tw - 8);
    if (y + th > rect.height - 8) y = Math.max(8, evt.clientY - rect.top - th - 12);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  function placeDrawApi() { return w.AmpMiPlaceDraw || null; }
  function syncAspectMapChrome() {
    var wrap = $("ridge-map-wrap");
    if (!wrap) return;
    var ids = ["raw", "place_draw", "day_load", "specialty_supply", "support", "cah", "fqhc", "cms"];
    var wb = $("ridge-workbench");
    ids.forEach(function (id) {
      var cls = "aspect-" + id.replace("_", "-") + "-on";
      var on = isAspectOn(id);
      wrap.classList.toggle(cls, on);
      if (wb) wb.classList.toggle(cls, on);
    });
    var banner = $("ridge-aspect-map-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "ridge-aspect-map-banner";
      banner.className = "ridge-aspect-map-banner";
      wrap.appendChild(banner);
    }
    if (wb && wb.classList.contains("mi-aspects-on")) {
      banner.hidden = true;
      banner.innerHTML = "";
      return;
    }
    var bits = [];
    var amp = getAmpBands();
    if (isAspectOn("raw")) {
      bits.push(amp && amp.competitive != null
        ? ("Raw · YOUR Baseline " + fmtMoney(amp.competitive) + " (Competitive)")
        : "Raw · AMP bands pending — no invented $");
    }
    if (isAspectOn("place_draw")) bits.push("Place draw · " + selectionNames() + " · heat inside selection · border only");
    if (isAspectOn("day_load")) bits.push("Day load · schedule / patients-per-day framing (qualitative v1)");
    if (isAspectOn("specialty_supply")) bits.push("Specialty supply · Redi residence density");
    if (isAspectOn("support")) bits.push("Support · culture / admin burden (qualitative v1)");
    if (isAspectOn("cah")) bits.push("CAH · overlay pending · HPSA pressure highlight (not facility pins)");
    if (isAspectOn("fqhc")) bits.push("FQHC · overlay pending · HPSA pressure highlight (not “more sites = higher pay”)");
    if (isAspectOn("cms")) bits.push("CMS · triangulation only — not Baseline $");
    banner.hidden = !bits.length;
    banner.innerHTML = bits.length ? bits.map(function (b) { return "<span>" + b + "</span>"; }).join("") : "";
  }
  function applyAspectLayers() {
    document.documentElement.setAttribute("data-look", "light");
    try {
      var mobile = window.matchMedia && window.matchMedia("(max-width: 430px)").matches;
      if (document.body) document.body.classList.toggle("mi-mobile", !!mobile);
    } catch (eMob) {}
    var pd = placeDrawApi();
    var placeOn = isAspectOn("place_draw");
    var tip = $("ridge-map-tooltip");
    if (tip && placeOn) { tip.hidden = true; tip.innerHTML = ""; }
    if (pd) {
      if (placeOn) pd.enable();
      else pd.disable();
    }
    syncAspectMapChrome();
    paintSupplyDots();
  }
  function paintSupplyDots() {
    var host = $("ridge-map-container");
    if (!host) return;
    var svg = host.querySelector("svg");
    if (!svg) return;
    var layer = svg.querySelector("#aspectSupplyDots");
    if (!layer) {
      layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      layer.setAttribute("id", "aspectSupplyDots");
      layer.setAttribute("pointer-events", "none");
      svg.appendChild(layer);
    }
    layer.innerHTML = "";
    var wbDots = $("ridge-workbench");
    if (wbDots && wbDots.classList.contains("mi-aspects-on")) return;
    if (!isAspectOn("specialty_supply")) return;
    var h = aspectHooksForSpecialty(currentSpec());
    if (!h.rediByState) return;
    var max = 0;
    Object.keys(h.rediByState).forEach(function (k) {
      if (k === "other" || k === "us_total") return;
      if (typeof h.rediByState[k] === "number") max = Math.max(max, h.rediByState[k]);
    });
    if (!max) return;
    svg.querySelectorAll("path[data-state]").forEach(function (el) {
      if (el.closest && (el.closest("#outline-layer") || el.closest("#selectionOutline") || el.closest("#placeDrawSelectionOutline") || el.closest("#placeDrawPinLayer"))) return;
      var code = el.getAttribute("data-state");
      var n = h.rediByState[code];
      if (n == null) return;
      var bb;
      try { bb = el.getBBox(); } catch (e) { return; }
      if (!bb || !bb.width) return;
      var cx = bb.x + bb.width / 2;
      var cy = bb.y + bb.height / 2;
      var r = 2.2 + 6.5 * Math.sqrt(n / max);
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", String(r));
      c.setAttribute("fill", "rgba(14,116,144,0.28)");
      c.setAttribute("stroke", "rgba(14,116,144,0.55)");
      c.setAttribute("stroke-width", "0.8");
      layer.appendChild(c);
    });
  }

  function ensureMapGlow(host) {
    if (!host) return;
    var svg = host.querySelector("svg");
    if (!svg) return;
    /* Always refresh glow filter — old 340% / std26 bloom boxed the states */
    var oldGlow = svg.querySelector("#ampStateGlow");
    if (oldGlow && oldGlow.parentNode) oldGlow.parentNode.removeChild(oldGlow);
    var defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    var glow = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    glow.setAttribute("id", "ampStateGlow");
    glow.setAttribute("x", "-35%");
    glow.setAttribute("y", "-35%");
    glow.setAttribute("width", "170%");
    glow.setAttribute("height", "170%");
    glow.setAttribute("color-interpolation-filters", "sRGB");
    glow.innerHTML =
      '<feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b1"/>' +
      '<feFlood flood-color="#ffffff" flood-opacity="0.9" result="f1"/>' +
      '<feComposite in="f1" in2="b1" operator="in" result="g1"/>' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="2.8" result="b2"/>' +
      '<feFlood flood-color="#0d9488" flood-opacity="0.85" result="f2"/>' +
      '<feComposite in="f2" in2="b2" operator="in" result="g2"/>' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b3"/>' +
      '<feFlood flood-color="#14b8a6" flood-opacity="0.45" result="f3"/>' +
      '<feComposite in="f3" in2="b3" operator="in" result="g3"/>' +
      '<feMerge><feMergeNode in="g3"/><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="SourceGraphic"/></feMerge>';
    defs.appendChild(glow);
    if (!svg.querySelector("#outline-layer")) {
      var layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      layer.setAttribute("id", "outline-layer");
      svg.appendChild(layer);
    }
    svg.querySelectorAll(".state [data-state], circle[data-state]").forEach(function (el) {
      el.style.pointerEvents = "auto";
      el.style.cursor = "pointer";
    });
    svg.querySelectorAll("g.borders path, path.separator1").forEach(function (el) {
      el.style.pointerEvents = "none";
      el.style.fill = "none";
      el.setAttribute("fill", "none");
      if (el.classList.contains("separator1") || (el.getAttribute("class") || "").indexOf("separator") >= 0) {
        el.style.stroke = "#94a3b8";
        el.style.strokeWidth = "1";
        el.style.opacity = "0.55";
      }
    });
  }

  function stateElFromPoint(root, x, y) {
    var hit = document.elementFromPoint(x, y);
    if (!hit) return null;
    var el = hit.closest("[data-state]");
    if (!el || !root.contains(el)) return null;
    return el;
  }

  var MI_MAP_VIEW = { scale: 1, x: 0, y: 0, min: 1, max: 3.6 };
  var mapViewTouched = false;
  var mapFitSel = "";
  var mapFitOk = false;

  function maybeFitSelection(force) {
    var codes = selectedCodes();
    var key = codes.slice().sort().join(",");
    if (force) mapViewTouched = false;
    if (!force && mapViewTouched && key === mapFitSel) return;
    if (!force && mapFitOk && key === mapFitSel) return;
    var n = 0;
    function attempt() {
      var api = w.__AMP_MI_MAP_VIEWPORT;
      if (api && typeof api.fitToCodes === "function" && api.fitToCodes(codes)) {
        mapFitSel = key;
        mapFitOk = true;
        return;
      }
      n += 1;
      if (n < 40) requestAnimationFrame(attempt);
      else if (n < 52) setTimeout(attempt, 160);
    }
    attempt();
  }

  function bindMapViewport(root) {
    if (!root || root.getAttribute("data-mi-zoom-bound") === "1") return;
    root.setAttribute("data-mi-zoom-bound", "1");

    var pointers = {};
    var pinch = null;
    var pan = null;

    function currentSvg() { return root.querySelector("svg"); }

    function applyView() {
      var svg = currentSvg();
      if (!svg) return;
      if (MI_MAP_VIEW.scale <= 1.001) {
        MI_MAP_VIEW.scale = 1;
        MI_MAP_VIEW.x = 0;
        MI_MAP_VIEW.y = 0;
      }
      clampView();
      svg.style.transformOrigin = "0 0";
      svg.style.willChange = "transform";
      svg.style.transform = "translate(" + MI_MAP_VIEW.x + "px," + MI_MAP_VIEW.y + "px) scale(" + MI_MAP_VIEW.scale + ")";
      root.classList.toggle("is-zoomed", MI_MAP_VIEW.scale > 1.02);
      root.setAttribute("data-map-scale", String(Math.round(MI_MAP_VIEW.scale * 100) / 100));
    }

    function clampView() {
      var rect = root.getBoundingClientRect();
      var w = rect.width || 1, h = rect.height || 1;
      var s = MI_MAP_VIEW.scale;
      if (s <= 1) { MI_MAP_VIEW.x = 0; MI_MAP_VIEW.y = 0; return; }
      var sw = w * s, sh = h * s;
      /* Slack lets a fitted edge state (RI, CA, FL) sit in frame without flying off. */
      var slack = 0.5;
      var maxX = w * slack;
      var minX = w - sw - w * slack;
      var maxY = h * slack;
      var minY = h - sh - h * slack;
      if (minX > maxX) minX = maxX = (w - sw) / 2;
      if (minY > maxY) minY = maxY = (h - sh) / 2;
      MI_MAP_VIEW.x = Math.min(maxX, Math.max(minX, MI_MAP_VIEW.x));
      MI_MAP_VIEW.y = Math.min(maxY, Math.max(minY, MI_MAP_VIEW.y));
    }

    function zoomAt(fx, fy, nextScale) {
      nextScale = Math.max(MI_MAP_VIEW.min, Math.min(MI_MAP_VIEW.max, nextScale));
      var s = MI_MAP_VIEW.scale || 1;
      MI_MAP_VIEW.x = fx - (fx - MI_MAP_VIEW.x) * (nextScale / s);
      MI_MAP_VIEW.y = fy - (fy - MI_MAP_VIEW.y) * (nextScale / s);
      MI_MAP_VIEW.scale = nextScale;
      applyView();
    }

    function ptrCount() { return Object.keys(pointers).length; }

    function pinchMetrics() {
      var ids = Object.keys(pointers);
      if (ids.length < 2) return null;
      var a = pointers[ids[0]], b = pointers[ids[1]];
      var dx = b.x - a.x, dy = b.y - a.y;
      return { dist: Math.hypot(dx, dy) || 1, midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
    }

    function localPoint(clientX, clientY) {
      var r = root.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top };
    }

    function ignoreChrome(e) {
      return !!(e.target && e.target.closest &&
        e.target.closest("#mi-place-draw-chrome, #placeHoverCard, button, a, input, select"));
    }

    root.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      if (ignoreChrome(e)) return;
      root.classList.remove("did-pan", "did-pinch");
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (ptrCount() >= 2) {
        var m = pinchMetrics();
        var lp = localPoint(m.midX, m.midY);
        pinch = { dist: m.dist, scale: MI_MAP_VIEW.scale, fx: lp.x, fy: lp.y };
        pan = null;
        root.classList.add("is-pinching", "did-pinch");
        root.classList.remove("is-panning");
        try { e.preventDefault(); } catch (err) {}
      } else if (MI_MAP_VIEW.scale > 1.05) {
        pan = { x: e.clientX, y: e.clientY, vx: MI_MAP_VIEW.x, vy: MI_MAP_VIEW.y, moved: false };
      }
    }, { capture: true, passive: false });

    root.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pinch && ptrCount() >= 2) {
        var m = pinchMetrics();
        var lp = localPoint(m.midX, m.midY);
        mapViewTouched = true;
        zoomAt(lp.x, lp.y, pinch.scale * (m.dist / pinch.dist));
        try { e.preventDefault(); } catch (err) {}
        return;
      }
      if (pan && ptrCount() === 1 && MI_MAP_VIEW.scale > 1.05) {
        var dx = e.clientX - pan.x, dy = e.clientY - pan.y;
        if (!pan.moved && (dx * dx + dy * dy) < 100) return;
        pan.moved = true;
        mapViewTouched = true;
        root.classList.add("is-panning", "did-pan");
        MI_MAP_VIEW.x = pan.vx + dx;
        MI_MAP_VIEW.y = pan.vy + dy;
        applyView();
        try { e.preventDefault(); } catch (err2) {}
      }
    }, { capture: true, passive: false });

    function endPtr(e) {
      delete pointers[e.pointerId];
      if (ptrCount() < 2) pinch = null;
      if (ptrCount() === 0) pan = null;
      requestAnimationFrame(function () {
        if (ptrCount() < 2) root.classList.remove("is-pinching");
        if (ptrCount() === 0) root.classList.remove("is-panning");
      });
    }
    root.addEventListener("pointerup", endPtr, { capture: true });
    root.addEventListener("pointercancel", endPtr, { capture: true });

    root.addEventListener("touchmove", function (e) {
      if ((e.touches && e.touches.length >= 2) ||
          root.classList.contains("is-panning") ||
          root.classList.contains("is-pinching")) {
        try { e.preventDefault(); } catch (err) {}
      }
    }, { passive: false });

    /* Desktop/trackpad: ctrl/meta + wheel (incl. native pinch-as-wheel). Do not steal page scroll. */
    root.addEventListener("wheel", function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      if (ignoreChrome(e)) return;
      e.preventDefault();
      mapViewTouched = true;
      var lp = localPoint(e.clientX, e.clientY);
      zoomAt(lp.x, lp.y, MI_MAP_VIEW.scale * Math.exp(-e.deltaY * 0.002));
    }, { passive: false });

    w.__AMP_MI_MAP_VIEWPORT = {
      get: function () { return { scale: MI_MAP_VIEW.scale, x: MI_MAP_VIEW.x, y: MI_MAP_VIEW.y }; },
      set: function (s, x, y) {
        MI_MAP_VIEW.scale = s;
        MI_MAP_VIEW.x = x || 0;
        MI_MAP_VIEW.y = y || 0;
        applyView();
      },
      reset: function () {
        MI_MAP_VIEW.scale = 1;
        MI_MAP_VIEW.x = 0;
        MI_MAP_VIEW.y = 0;
        applyView();
      },
      zoomAt: zoomAt,
      apply: applyView,
      fitToCodes: fitToCodes
    };
    applyView();

    function fitToCodes(codes) {
      var svg = currentSvg();
      if (!svg || root.clientWidth < 40 || root.clientHeight < 40) return false;
      codes = (codes || []).filter(Boolean);
      var prev = svg.style.transform;
      svg.style.transform = "none";
      if (!codes.length) {
        MI_MAP_VIEW.scale = 1;
        MI_MAP_VIEW.x = 0;
        MI_MAP_VIEW.y = 0;
        applyView();
        root.setAttribute("data-map-fitted", "");
        return true;
      }
      var minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity, found = 0;
      codes.forEach(function (code) {
        var el = svg.querySelector('g.state [data-state="' + code + '"], circle[data-state="' + code + '"]');
        if (!el || !el.getBoundingClientRect) return;
        var b = el.getBoundingClientRect();
        if (!(b.width > 1) || !(b.height > 1)) return;
        found += 1;
        minL = Math.min(minL, b.left);
        minT = Math.min(minT, b.top);
        maxR = Math.max(maxR, b.right);
        maxB = Math.max(maxB, b.bottom);
      });
      if (!found) {
        svg.style.transform = prev;
        return false;
      }
      var svgBox = svg.getBoundingClientRect();
      var rr = root.getBoundingClientRect();
      var cw = rr.width, ch = rr.height;
      var bw = Math.max(8, maxR - minL);
      var bh = Math.max(8, maxB - minT);
      var S = Math.min((cw * 0.86) / bw, (ch * 0.86) / bh);
      S = Math.max(1.08, Math.min(MI_MAP_VIEW.max, S));
      var cx = ((minL + maxR) / 2) - svgBox.left;
      var cy = ((minT + maxB) / 2) - svgBox.top;
      var ox = svgBox.left - rr.left;
      var oy = svgBox.top - rr.top;
      MI_MAP_VIEW.scale = S;
      MI_MAP_VIEW.x = (cw / 2) - ox - cx * S;
      MI_MAP_VIEW.y = (ch / 2) - oy - cy * S;
      applyView();
      root.setAttribute("data-map-fitted", codes.slice().sort().join(","));
      return MI_MAP_VIEW.scale > 1.02;
    }
  }

  function bindMap() {
    var root = $("ridge-map-container");
    if (!root || root.getAttribute("data-ridge-bound") === "1") return;
    root.setAttribute("data-ridge-bound", "1");
    ensureMapGlow(root);
    /* Phone: finger-drag must sweep states, not scroll the page. Pinch is custom (touch-action none). */
    root.style.touchAction = "none";
    bindMapViewport(root);

    var fingerDrag = false;

    function applyHover(e, el) {
      if (isAspectOn("place_draw")) {
        showTooltip(null, null);
        return;
      }
      if (!el) {
        if (!state.hover) return;
        state.hover = null;
        paintMap();
        showTooltip(null, null);
        return;
      }
      var code = el.getAttribute("data-state");
      if (state.hover !== code) {
        state.hover = code;
        paintMap();
      }
      showTooltip(e, state.hover);
    }

    root.addEventListener("pointerdown", function (e) {
      if (isAspectOn("place_draw")) {
        showTooltip(null, null);
        return;
      }
      if (root.classList.contains("is-pinching") || root.classList.contains("is-panning")) return;
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      fingerDrag = true;
      try { root.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      var el = stateElFromPoint(root, e.clientX, e.clientY);
      if (!el) {
        el = e.target.closest("[data-state]");
        if (el && !root.contains(el)) el = null;
      }
      applyHover(e, el);
    }, { passive: false });

    root.addEventListener("pointerover", function (e) {
      if (fingerDrag) return;
      var el = e.target.closest("[data-state]");
      if (!el || !root.contains(el)) return;
      applyHover(e, el);
    });

    root.addEventListener("pointermove", function (e) {
      if (isAspectOn("place_draw") || root.classList.contains("is-pinching") || root.classList.contains("is-panning")) {
        showTooltip(null, null);
        return;
      }
      var el;
      if (fingerDrag || e.pointerType === "touch" || e.pointerType === "pen") {
        if (fingerDrag) e.preventDefault();
        el = stateElFromPoint(root, e.clientX, e.clientY);
      } else {
        el = e.target.closest("[data-state]");
        if (el && !root.contains(el)) el = null;
      }
      if (el) applyHover(e, el);
      else if (fingerDrag) applyHover(e, null);
    }, { passive: false });

    function endFinger(e) {
      if (!fingerDrag) return;
      fingerDrag = false;
      try { if (e && e.pointerId != null) root.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    root.addEventListener("pointerup", endFinger);
    root.addEventListener("pointercancel", endFinger);

    root.addEventListener("pointerleave", function () {
      if (fingerDrag) return;
      if (isAspectOn("place_draw")) { showTooltip(null, null); return; }
      if (!state.hover) return;
      state.hover = null;
      paintMap();
      showTooltip(null, null);
    });
    root.addEventListener("click", function (e) {
      if (root.classList.contains("is-pinching") || root.classList.contains("is-panning") ||
          root.classList.contains("did-pan") || root.classList.contains("did-pinch")) {
        e.preventDefault();
        return;
      }
      var el = e.target.closest("[data-state]");
      if (!el || !root.contains(el)) return;
      var code = el.getAttribute("data-state");
      if (isAspectOn("place_draw")) {
        state.focus = code;
        if (accessAllowsPeek(code) && w.AmpMiAspectsSelector && w.AmpMiAspectsSelector.openState) {
          w.AmpMiAspectsSelector.openState(code);
        } else if (w.AmpMiAspectsSelectorHandle && w.AmpMiAspectsSelectorHandle.clearCard) {
          w.AmpMiAspectsSelectorHandle.clearCard();
        }
        return;
      }
      e.preventDefault();
      var additive = accessAllowsMulti() && (state.multi || e.metaKey || e.ctrlKey);
      toggleState(code, additive);
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
    fetch("assets/ridge-usa-map.svg?v=2200")
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

  function syncDemoTools() {
    var multiBtn = $("ridge-multi-toggle");
    var clearBtn = $("ridge-clear-states");
    var allowMulti = accessAllowsMulti();
    if (!allowMulti) state.multi = false;
    if (multiBtn) {
      multiBtn.hidden = !allowMulti;
      multiBtn.disabled = !allowMulti;
      multiBtn.setAttribute("aria-hidden", allowMulti ? "false" : "true");
    }
    if (clearBtn) {
      clearBtn.hidden = !allowMulti;
      clearBtn.disabled = !allowMulti;
    }
    var caption = document.querySelector("#ridge-map-wrap .map-caption");
    if (caption && !allowMulti) {
      caption.textContent = "Demo 1×1 · only the committed state is live. Tap other states for a verify / upgrade cue — no numbers.";
    }
  }

  function refresh() {
    if (!demoSurfaceReady() || !state.specialtyKey) {
      var cards = $("ridge-bench-cards");
      if (cards) cards.innerHTML = "";
      return;
    }
    ensureForcedSelection();
    syncDemoTools();
    updateMetricButtons();
    renderBenchCards();
    try { applyAspectLayers(); } catch (e) {}
    paintMap();
    renderSidebar();
    updateTitle();
    var pdRefresh = placeDrawApi();
    if (pdRefresh && isAspectOn("place_draw") && pdRefresh.syncSelection) {
      try { pdRefresh.syncSelection(); } catch (ePd) {}
    }
    maybeFitSelection(false);
    syncAspectRead();
  }

  function bindChrome() {
    var root = $("ridge-workbench");
    if (!root || root.getAttribute("data-ridge-chrome") === "1") return;
    root.setAttribute("data-ridge-chrome", "1");

    try { bindAspectsV1(); } catch (e) {}
    document.documentElement.setAttribute("data-look", "light");
    if (!window.__ampMiMobileBound) {
      window.__ampMiMobileBound = true;
      window.addEventListener("resize", function () {
        try {
          var mobile = window.matchMedia && window.matchMedia("(max-width: 430px)").matches;
          if (document.body) document.body.classList.toggle("mi-mobile", !!mobile);
        } catch (eR) {}
      });
    }

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
        if (sel && sel.value) setSpecialty(sel.value);
        else refresh();
      });
    });

    var search = $("ridge-spec-search");
    if (search) {
      search.addEventListener("input", function () {
        state.search = search.value || "";
        populateSpecialtySelect();
        var sel = $("mi-app-specialty");
        if (sel && sel.value) setSpecialty(sel.value);
        else refresh();
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
      function syncMultiBtn() {
        multiBtn.classList.toggle("active", !!state.multi);
        multiBtn.setAttribute("aria-pressed", state.multi ? "true" : "false");
        multiBtn.textContent = state.multi ? "Multi-select ON" : "Multi-select";
      }
      syncMultiBtn();
      multiBtn.addEventListener("click", function () {
        if (!accessAllowsMulti()) {
          state.multi = false;
          syncMultiBtn();
          return;
        }
        state.multi = !state.multi;
        syncMultiBtn();
        renderSidebar();
      });
    }

    var side = $("ridge-side-body");
    if (side) {
      side.addEventListener("click", function (e) {
        var rem = e.target.closest("[data-remove-state]");
        if (rem) {
          e.preventDefault();
          var code = rem.getAttribute("data-remove-state");
          if (forcedUnitState()) {
            ensureForcedSelection();
            afterGeoChange();
            return;
          }
          if (state.selected[code]) {
            delete state.selected[code];
            afterGeoChange();
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
    var names = stateNames();
    var logo = (function () {
      try {
        return new URL("assets/amp-lockup-nav-black.png?v=2114", window.location.href).href;
      } catch (e) {
        return "assets/amp-lockup-nav-black.png?v=2114";
      }
    })();
    var rows = reportStateCodes();
    var table = rows.map(function (code) {
      return "<tr><td>" + (names[code] || code.toUpperCase()) + "</td><td>" + formatMetric(metricValueFor(code)) +
        "</td><td>" + fmtNum(physCountFor(code)) + "</td><td>" + Number(difficultyFor(code)).toFixed(1) + "</td></tr>";
    }).join("");
    if (!rows.length) {
      table = "<tr><td colspan='4'>No unlocked state in this report. Demo is 1 specialty × 1 state after you commit both.</td></tr>";
    }
    var unit = rows.length === 1 ? rows[0] : null;
    var supply = unit ? physCountFor(unit) : (s && s.physNational);
    var postings = unit ? postingsFor(unit) : (s && s.nationalPostings);
    var comp = unit ? realPayFor(unit) : (function(){ var a=getAmpBands(s); return a && a.competitive != null ? a.competitive : null; })();
    var lens = unit ? ((names[unit] || unit.toUpperCase()) + " · 1×1") : metricLabelForActive();
    return "<!doctype html><html><head><meta charset='utf-8'><title>Market Intelligence Report · Adaptive Medical Partners</title>" +
      "<style>body{font-family:Inter,system-ui,sans-serif;color:#0f172a;padding:32px;max-width:900px;margin:0 auto}" +
      ".logo{height:56px;width:auto;max-width:280px;margin-bottom:18px;display:block;opacity:1;filter:none;-webkit-filter:none}h1{font-size:22px;margin:0 0 6px}p{color:#475569}" +
      "table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}" +
      ".stamp{display:inline-block;letter-spacing:.12em;font-size:11px;font-weight:800;color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;padding:4px 8px;border-radius:999px}" +
      ".cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0} .card{border:1px solid #e2e8f0;border-radius:12px;padding:12px} .card b{display:block;font-size:20px;margin-top:6px}" +
      "@media print{.no-print{display:none}}</style></head><body>" +
      '<img class="logo" src="' + logo + '" alt="Adaptive Medical Partners" />' +
      '<div class="stamp">EXAMPLE / ILLUSTRATIVE</div>' +
      "<h1>Market Intelligence market report</h1>" +
      "<p><strong>" + (s ? s.label : "Specialty") + "</strong> · " + lens +
      " · Generated from the Market Intelligence sample on Adaptive Medical Partners.</p>" +
      '<div class="cards">' +
      "<div class='card'>Active supply<b>" + show(fmtNum(supply), "n/a") + "</b></div>" +
      "<div class='card'>Approx. postings<b>" + show(fmtNum(postings), "n/a") + "</b></div>" +
      "<div class='card'>Median total comp<b>" + show(fmtMoney(comp), "n/a") + "</b></div>" +
      "</div>" +
      "<table><thead><tr><th>State</th><th>Map metric</th><th>Supply</th><th>Difficulty</th></tr></thead><tbody>" +
      table + "</tbody></table>" +
      "<p style='margin-top:24px;font-size:12px;color:#64748b'>Adaptive Medical Partners · Market Intelligence sample. Sample only. Ask AMP for guided recruiting next steps.</p>" +
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

  function demoSurfaceReady() {
    var api = accessApi();
    if (!api || typeof api.isDemoCommitted !== "function") return true;
    return !!api.isDemoCommitted();
  }

  function applyAccessDefaults() {
    var api = accessApi();
    var seat = api && api.getSeat ? api.getSeat() : null;
    if (!demoSurfaceReady()) {
      state.specialtyKey = null;
      state.selected = {};
      return;
    }
    if (!state.specialtyKey) {
      state.specialtyKey = (seat && seat.demoSpecialty) || (data().SPECIALTIES[0] && data().SPECIALTIES[0].key) || null;
    }
    if (ensureForcedSelection()) return;
    if (seat && !Object.keys(state.selected).length) {
      var st = null;
      if (seat.tier === "state" && seat.paidState) st = api.normState(seat.paidState);
      else if ((seat.tier === "demo" || seat.tier === "verified") && seat.demoState) st = api.normState(seat.demoState);
      if (st) state.selected[st] = true;
    }
  }

  function init() {
    if (!data().SPECIALTIES || !data().SPECIALTIES.length) return;
    applyAccessDefaults();
    bindChrome();
    syncDemoTools();
    if (!demoSurfaceReady() || !state.specialtyKey) {
      var cards = $("ridge-bench-cards");
      if (cards) cards.innerHTML = "";
      return;
    }
    populateSpecialtySelect();
    loadMapSvg(function () { refresh(); });
  }

  function reportStateCodes() {
    var forced = forcedUnitState();
    if (forced) return [forced];
    var picks = selectedCodes();
    if (picks.length) return picks;
    return [];
  }

  w.AMPRidgeCurrentSpec = currentSpec;
  w.AmpMiPlaceDrawOnPinState = function (code) {
    if (!code || !isAspectOn("place_draw")) return;
    if (!accessAllowsState(code)) return;
    if (!state.selected[code] && !state.multi) {
      state.selected = {};
      state.selected[code] = true;
    }
    try { renderSidebar(); } catch (e) {}
  };

  w.AMPRidgeWorkbench = {
    init: init,
    refresh: refresh,
    downloadReport: downloadReport,
    getSpecialtyKey: function () { return state.specialtyKey; },
    setSpecialtyKey: setSpecialty,
    getSelectedCodes: selectedCodes,
    isAspectOn: isAspectOn,
    applyAspectLayers: applyAspectLayers,
    selectState: function (code, additive) { toggleState(code, additive); },
    ensureUnitSelection: function () {
      ensureForcedSelection();
      refresh();
    },
    reportStateCodes: reportStateCodes
  };
})(window);
