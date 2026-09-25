/* amp-build:2116 Ridge V1 access — unit stairs (Mike lock 2026-09-16).
   Demo 1×1 → verify +2 specialties (same state) → paid geo + polls.
   2205: poll packages 15/$225, 50/$650, 100/$1,100, 250/$2,250 (any state; 1 poll = 1 specialty × 1 state, all layers). Extra poll $15. One-off report $99.
   Stripe Checkout is stubbed (test-mode hooks). Public data only — no MGMA. */
(function (w) {
  "use strict";

  var STORAGE_KEY = "amp_ridge_seat_v3";
  var STORAGE_KEY_V2 = "amp_ridge_seat_v2";
  var STORAGE_KEY_V1 = "amp_ridge_seat_v1";
  var LEGACY_UNLOCK = "amp_mi_lite_unlocked";
  var LEGACY_PLAN = "amp_mi_lite_plan";

  var FREE_DOMAINS = {
    gmail: 1, yahoo: 1, hotmail: 1, outlook: 1, live: 1, msn: 1, icloud: 1,
    aol: 1, proton: 1, protonmail: 1, me: 1, mac: 1, ymail: 1, gmx: 1,
    mail: 1, inbox: 1, hey: 1, fastmail: 1
  };

  var PLANS = {
    demo: { id: "demo", label: "Demo", price: 0, polls: 0, geo: "one-state" },
    verified: { id: "verified", label: "Verified sample", price: 0, polls: 0, geo: "one-state" },
    pack15: { id: "pack15", label: "15 polls", price: 225, polls: 15, geo: "national", paid: true },
    pack50: { id: "pack50", label: "50 polls", price: 650, polls: 50, geo: "national", paid: true },
    pack100: { id: "pack100", label: "100 polls", price: 1100, polls: 100, geo: "national", paid: true },
    pack250: { id: "pack250", label: "250 polls", price: 2250, polls: 250, geo: "national", paid: true }
  };
  var LEGACY_TIER = { state: "pack15", region: "pack50", national: "pack100" };

  var SKUS = {
    pack15: { sku: "ridge_pack15", kind: "one_time", plan: "pack15", amount: 225, label: "Market Intelligence · 15 polls · $225" },
    pack50: { sku: "ridge_pack50", kind: "one_time", plan: "pack50", amount: 650, label: "Market Intelligence · 50 polls · $650" },
    pack100: { sku: "ridge_pack100", kind: "one_time", plan: "pack100", amount: 1100, label: "Market Intelligence · 100 polls · $1,100" },
    pack250: { sku: "ridge_pack250", kind: "one_time", plan: "pack250", amount: 2250, label: "Market Intelligence · 250 polls · $2,250" },
    extra_poll: { sku: "ridge_extra_poll", kind: "one_time", amount: 15, label: "Market Intelligence Extra Poll · $15" },
    oneoff: { sku: "ridge_oneoff", kind: "one_time", amount: 99, label: "Market Intelligence One-off Report · $99" }
  };

  var REGIONS = {
    west: { label: "West", states: ["WA", "OR", "CA", "NV", "AK", "HI", "ID", "MT", "WY", "UT", "CO"] },
    southwest: { label: "Southwest", states: ["AZ", "NM", "TX", "OK"] },
    midwest: { label: "Midwest", states: ["ND", "SD", "NE", "KS", "MN", "IA", "MO", "WI", "IL", "MI", "IN", "OH"] },
    northeast: { label: "Northeast", states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "DE", "MD", "DC"] },
    southeast: { label: "Southeast", states: ["WV", "VA", "KY", "TN", "NC", "SC", "GA", "FL", "AL", "MS", "AR", "LA"] }
  };

  var DEFAULT_STATE = "tx";
  var DEFAULT_SPEC = "family_medicine_without_ob";
  var VERIFIED_TASTE_CAP = 3;

  var listeners = [];
  var denialListeners = [];
  var lastDenial = null;
  var seatCache = null;

  function normState(code) {
    return String(code || "").trim().toLowerCase();
  }
  function normStateUp(code) {
    return String(code || "").trim().toUpperCase();
  }
  function orgDomain(email) {
    var m = String(email || "").toLowerCase().trim().match(/@([^@]+)$/);
    return m ? m[1] : "";
  }
  function isWorkEmail(email) {
    var addr = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return false;
    var host = orgDomain(addr);
    if (!host) return false;
    var root = host.split(".").slice(-2, -1)[0] || host.split(".")[0];
    if (FREE_DOMAINS[root]) return false;
    return true;
  }

  function defaultSeat() {
    return {
      tier: "demo",
      demoState: "",
      demoSpecialty: "",
      demoCommitted: false,
      tastes: [],
      polls: [],
      extraPolls: 0,
      oneOffs: [],
      paidState: "",
      paidRegion: "",
      seat: null,
      checkoutStub: true,
      grantedByCheckout: false,
      updatedAt: null
    };
  }

  function migrateLegacy(seat) {
    /* Old MI-lite unlock keys and leftover v1 seats must NOT mint a paid Region/State/National seat. */
    return seat;
  }

  function sanitizeSeat(seat) {
    if (!seat) return seat;
    if (seat.demoCommitted == null) {
      seat.demoCommitted = seat.tier === "verified";
    }
    if (isPaid(seat) && !seat.grantedByCheckout) {
      seat.tier = seat.seat ? "verified" : "demo";
      seat.paidRegion = "";
      seat.polls = Array.isArray(seat.polls) ? seat.polls : [];
      seat.extraPolls = 0;
    }
    if (!isPaid(seat)) seat.extraPolls = 0;
    return seat;
  }

  function load() {
    if (seatCache) return sanitizeSeat(seatCache);
    var seat = defaultSeat();
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_V2);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          Object.keys(seat).forEach(function (k) {
            if (parsed[k] != null) seat[k] = parsed[k];
          });
        }
      } else {
        seat = migrateLegacy(seat);
      }
    } catch (e) {}
    if (!Array.isArray(seat.tastes)) seat.tastes = [];
    if (!Array.isArray(seat.polls)) seat.polls = [];
    if (!Array.isArray(seat.oneOffs)) seat.oneOffs = [];
    if (LEGACY_TIER[seat.tier]) seat.tier = LEGACY_TIER[seat.tier];
    if (!PLANS[seat.tier]) seat.tier = "demo";
    seatCache = sanitizeSeat(seat);
    return seatCache;
  }

  function save(seat) {
    seat = seat || load();
    seat.updatedAt = new Date().toISOString();
    seatCache = seat;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seat)); } catch (e) {}
    listeners.forEach(function (fn) {
      try { fn(seat); } catch (err) {}
    });
    return seat;
  }

  function reset() {
    seatCache = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    try { localStorage.removeItem(STORAGE_KEY_V2); } catch (e) {}
    try { localStorage.removeItem(STORAGE_KEY_V1); } catch (e) {}
    try {
      localStorage.removeItem(LEGACY_UNLOCK);
      localStorage.removeItem(LEGACY_PLAN);
    } catch (e) {}
    lastDenial = null;
    return save(defaultSeat());
  }

  function isPaid(seat) {
    seat = seat || load();
    return !!(PLANS[seat.tier] && PLANS[seat.tier].paid);
  }
  function isDemoCommitted(seat) {
    seat = seat || load();
    if (isPaid(seat) || seat.tier === "verified") return true;
    return !!(seat.demoCommitted && seat.demoSpecialty && seat.demoState);
  }
  function oneStateUnit(seat) {
    seat = seat || load();
    if (isPaid(seat)) return "";
    if ((seat.tier === "demo" || seat.tier === "verified") && isDemoCommitted(seat) && seat.demoState) {
      return normState(seat.demoState);
    }
    return "";
  }
  function allowsPeek(code, seat) {
    return canState(code, seat);
  }
  function allowsMulti(seat) {
    seat = seat || load();
    return isPaid(seat);
  }
  function pollLimit(seat) {
    seat = seat || load();
    if (!isPaid(seat)) return 0;
    var plan = PLANS[seat.tier];
    var base = Number(seat.pollCredits) || (plan && plan.polls ? plan.polls : 0);
    return base + (Number(seat.extraPolls) || 0);
  }
  function canGrantExtraPoll(seat) {
    return isPaid(seat);
  }
  function canBuyExtraPoll(seat) {
    seat = seat || load();
    return canGrantExtraPoll(seat) && pollsLeft(seat) <= 0;
  }
  function pollsUsed(seat) {
    seat = seat || load();
    return (seat.polls || []).length;
  }
  function pollsLeft(seat) {
    if (!isPaid(seat)) return 0;
    return Math.max(0, pollLimit(seat) - pollsUsed(seat));
  }
  function pollKey(spec, st) {
    return String(spec || "") + "|" + normState(st);
  }
  function hasPoll(seat, spec, st) {
    var key = pollKey(spec, st);
    return (seat.polls || []).some(function (p) { return pollKey(p.specialty, p.state) === key; });
  }
  function hasOneOff(seat, spec, st) {
    var key = pollKey(spec, st);
    return (seat.oneOffs || []).some(function (p) { return pollKey(p.specialty, p.state) === key; });
  }
  function tasteSpecialties(seat) {
    seat = seat || load();
    var seen = [];
    (seat.tastes || []).forEach(function (t) {
      if (t && t.specialty && seen.indexOf(t.specialty) === -1) seen.push(t.specialty);
    });
    if (!seen.length && seat.demoSpecialty) seen.push(seat.demoSpecialty);
    return seen;
  }

  function allowedStates(seat) {
    seat = seat || load();
    if (isPaid(seat)) return null;
    if (seat.tier === "demo" && !isDemoCommitted(seat)) return [];
    return seat.demoState ? [normState(seat.demoState)] : [];
  }

  function canState(code, seat) {
    seat = seat || load();
    var st = normState(code);
    if (!st) return false;
    if (hasOneOff(seat, seat._peekSpec || currentSpecialty(), st) && !isPaid(seat)) {
      /* one-off is combo-scoped; handled in canCombo */
    }
    var allowed = allowedStates(seat);
    if (allowed == null) return true;
    return allowed.indexOf(st) !== -1;
  }

  function currentSpecialty() {
    try {
      if (w.AMPRidgeWorkbench && AMPRidgeWorkbench.getSpecialtyKey) {
        return AMPRidgeWorkbench.getSpecialtyKey();
      }
    } catch (e) {}
    return load().demoSpecialty || "";
  }

  function canSpecialty(key, seat) {
    seat = seat || load();
    key = String(key || "");
    if (!key) return false;
    if (isPaid(seat)) return true;
    if (seat.tier === "demo") {
      if (!isDemoCommitted(seat)) return false;
      return key === seat.demoSpecialty;
    }
    if (seat.tier === "verified") {
      var specs = tasteSpecialties(seat);
      if (specs.indexOf(key) !== -1) return true;
      return specs.length < VERIFIED_TASTE_CAP;
    }
    return false;
  }

  function canCombo(spec, st, seat) {
    seat = seat || load();
    spec = String(spec || "");
    st = normState(st);
    if (hasOneOff(seat, spec, st)) return true;
    if (!canState(st, seat)) return false;
    if (isPaid(seat)) return hasPoll(seat, spec, st) || pollsLeft(seat) > 0;
    if (seat.tier === "demo") {
      if (!isDemoCommitted(seat)) return false;
      return spec === seat.demoSpecialty && st === normState(seat.demoState);
    }
    if (seat.tier === "verified") {
      if (st !== normState(seat.demoState)) return false;
      var specs = tasteSpecialties(seat);
      if (specs.indexOf(spec) !== -1) return true;
      return specs.length < VERIFIED_TASTE_CAP;
    }
    return false;
  }

  function deny(reason, extra) {
    lastDenial = Object.assign({ reason: reason, at: Date.now() }, extra || {});
    denialListeners.forEach(function (fn) {
      try { fn(lastDenial); } catch (err) {}
    });
    return { ok: false, reason: reason, denial: lastDenial, seat: load() };
  }

  function ensureTaste(seat, spec, st) {
    var key = pollKey(spec, st);
    var exists = (seat.tastes || []).some(function (t) { return pollKey(t.specialty, t.state) === key; });
    if (!exists) {
      seat.tastes = seat.tastes || [];
      seat.tastes.push({ specialty: spec, state: normState(st), at: new Date().toISOString() });
    }
  }

  function consumePaidPoll(seat, spec, st) {
    if (hasPoll(seat, spec, st)) return { consumed: false };
    if (pollsLeft(seat) <= 0) return { consumed: false, blocked: true };
    seat.polls.push({ specialty: spec, state: normState(st), at: new Date().toISOString() });
    return { consumed: true };
  }

  function trySpecialty(key) {
    var seat = load();
    key = String(key || "");
    if (!key) return deny("missing_specialty");
    if (isPaid(seat)) {
      var st = currentSelectedState(seat) || seat.paidState || seat.demoState;
      if (st && !canCombo(key, st, seat)) {
        if (!canState(st, seat)) return deny("geo", { specialty: key, state: st });
        return deny("polls", { specialty: key, state: st });
      }
      if (st) {
        var used = consumePaidPoll(seat, key, st);
        if (used.blocked) return deny("polls", { specialty: key, state: st });
        save(seat);
        return { ok: true, consumed: !!used.consumed, seat: seat };
      }
      return { ok: true, seat: seat };
    }
    if (seat.tier === "demo" && !isDemoCommitted(seat)) {
      return deny("walkthrough", { specialty: key, state: seat.demoState });
    }
    if (seat.tier === "demo" && key !== seat.demoSpecialty) {
      return deny("verify", { specialty: key, state: seat.demoState });
    }
    if (seat.tier === "verified") {
      var specs = tasteSpecialties(seat);
      if (specs.indexOf(key) === -1 && specs.length >= VERIFIED_TASTE_CAP) {
        return deny("paywall", { specialty: key, state: seat.demoState });
      }
      ensureTaste(seat, key, seat.demoState);
      save(seat);
      return { ok: true, seat: seat };
    }
    return { ok: true, seat: seat };
  }

  function currentSelectedState(seat) {
    try {
      if (w.AMPRidgeWorkbench && AMPRidgeWorkbench.getSelectedCodes) {
        var codes = AMPRidgeWorkbench.getSelectedCodes() || [];
        if (codes.length) return codes[0];
      }
    } catch (e) {}
    return seat.demoState;
  }

  function tryState(code) {
    var seat = load();
    var st = normState(code);
    if (!st) return deny("missing_state");
    var spec = currentSpecialty() || seat.demoSpecialty;
    if (seat.tier === "demo" && !isDemoCommitted(seat)) {
      return deny("walkthrough", { specialty: spec, state: st });
    }
    if (hasOneOff(seat, spec, st) && !isPaid(seat)) {
      return { ok: true, seat: seat, oneOff: true };
    }
    if (!canState(st, seat)) {
      if (!isPaid(seat)) {
        return deny(seat.tier === "verified" ? "paywall" : "verify", { specialty: spec, state: st });
      }
      return deny("geo", { specialty: spec, state: st });
    }
    if (isPaid(seat)) {
      if (!canCombo(spec, st, seat)) return deny("polls", { specialty: spec, state: st });
      var used = consumePaidPoll(seat, spec, st);
      if (used.blocked) return deny("polls", { specialty: spec, state: st });
      save(seat);
      return { ok: true, consumed: !!used.consumed, seat: seat };
    }
    if (st !== normState(seat.demoState)) {
      return deny(seat.tier === "verified" ? "paywall" : "verify", { specialty: spec, state: st });
    }
    return { ok: true, seat: seat };
  }

  function startDemo(opts) {
    opts = opts || {};
    var seat = load();
    if (isPaid(seat) || seat.tier === "verified") return seat;
    var spec = opts.specialty ? String(opts.specialty) : "";
    var st = opts.state ? normState(opts.state) : "";
    if (!spec || !st) return seat;
    seat.demoState = st;
    seat.demoSpecialty = spec;
    seat.demoCommitted = true;
    seat.tier = "demo";
    if (!seat.tastes.length) {
      ensureTaste(seat, seat.demoSpecialty, seat.demoState);
    }
    return save(seat);
  }

  function verify(fields) {
    fields = fields || {};
    var email = String(fields.email || "").trim();
    if (!fields.name || !fields.org || !fields.phone || !email) {
      return { ok: false, reason: "required" };
    }
    if (!isWorkEmail(email)) {
      return { ok: false, reason: "work_email" };
    }
    var seat = load();
    seat.tier = seat.tier === "demo" || !isPaid(seat) ? "verified" : seat.tier;
    if (!isPaid(seat)) seat.tier = "verified";
    seat.seat = {
      name: String(fields.name).trim(),
      org: String(fields.org).trim(),
      email: email,
      phone: String(fields.phone).trim(),
      domain: orgDomain(email)
    };
    if (seat.demoSpecialty && seat.demoState) {
      ensureTaste(seat, seat.demoSpecialty, seat.demoState);
    }
    seat.demoCommitted = true;
    save(seat);
    return { ok: true, seat: seat };
  }

  function simulateVerify() {
    var seat = load();
    if (isPaid(seat)) return { ok: true, seat: seat, simulated: true };
    if (!isDemoCommitted(seat) && !(seat.demoSpecialty && seat.demoState)) {
      return { ok: false, reason: "walkthrough" };
    }
    seat.tier = "verified";
    seat.demoCommitted = true;
    seat.seat = {
      name: "Mike (preview)",
      org: "AMP preview",
      email: "mike@adaptivemedicalpartners.com",
      phone: "555-0100",
      domain: "adaptivemedicalpartners.com",
      simulated: true
    };
    if (seat.demoSpecialty && seat.demoState) {
      ensureTaste(seat, seat.demoSpecialty, seat.demoState);
    }
    save(seat);
    return { ok: true, seat: seat, simulated: true };
  }

  function seedPaidUnit(seat) {
    var spec = seat.demoSpecialty || currentSpecialty();
    var st = "";
    st = currentSelectedState(seat) || seat.demoState;
    if (spec && st && !hasPoll(seat, spec, st)) {
      seat.polls.push({ specialty: spec, state: normState(st), at: new Date().toISOString() });
    }
  }

  function openUnits(seat) {
    seat = seat || load();
    if (isPaid(seat)) return (seat.polls || []).slice();
    return (seat.tastes || []).map(function (t) {
      return { specialty: t.specialty, state: t.state || seat.demoState, at: t.at, taste: true };
    });
  }

  function applyPaid(opts) {
    opts = opts || {};
    var sku = String(opts.sku || opts.plan || "").replace(/^ridge_/, "");
    var seat = load();
    if (sku === "extra_poll") {
      if (!canGrantExtraPoll(seat)) return seat;
      seat.extraPolls = (Number(seat.extraPolls) || 0) + 1;
      return save(seat);
    }
    if (sku === "oneoff") {
      var spec = String(opts.specialty || currentSpecialty() || seat.demoSpecialty);
      var st = normState(opts.state || currentSelectedState(seat) || seat.demoState);
      if (!hasOneOff(seat, spec, st)) {
        seat.oneOffs.push({ specialty: spec, state: st, at: new Date().toISOString() });
      }
      return save(seat);
    }
    if (LEGACY_TIER[sku]) sku = LEGACY_TIER[sku];
    if (!PLANS[sku] || !PLANS[sku].paid) return seat;
    /* Packages stack: buying another adds its polls to what's left. */
    var carry = isPaid(seat) ? pollLimit(seat) : 0;
    seat.pollCredits = carry + PLANS[sku].polls;
    seat.extraPolls = 0;
    seat.tier = sku;
    seat.grantedByCheckout = true;
    if (opts.specialty) seat.demoSpecialty = String(opts.specialty);
    seedPaidUnit(seat);
    return save(seat);
  }

  function consumeCheckoutQuery() {
    try {
      var params = new URLSearchParams(w.location.search || "");
      var flag = params.get("ridge_checkout") || params.get("ridge_sku");
      if (!flag) return null;
      var sku = params.get("ridge_sku") || params.get("sku") || "";
      if (params.get("ridge_checkout") === "success" && !sku) sku = params.get("plan") || "pack15";
      if (params.get("ridge_checkout") && params.get("ridge_checkout") !== "success" && !params.get("ridge_sku")) {
        sku = params.get("ridge_checkout");
      }
      if (!sku) return null;
      var pend = null;
      try { pend = JSON.parse(w.localStorage.getItem("amp_ridge_pending_checkout") || "null"); } catch (eP) { pend = null; }
      if (pend && String(pend.sku) !== String(sku).replace(/^ridge_/, "")) pend = null;
      var seat = applyPaid({
        sku: sku,
        state: params.get("ridge_state") || params.get("state") || (pend && pend.state),
        region: params.get("ridge_region") || params.get("region"),
        specialty: params.get("ridge_specialty") || params.get("specialty") || (pend && pend.specialty)
      });
      try { w.localStorage.removeItem("amp_ridge_pending_checkout"); } catch (eR) {}
      if (params.get("session_id")) {
        try {
          ["ridge_checkout", "ridge_sku", "session_id"].forEach(function (k) { params.delete(k); });
          var qs = params.toString();
          w.history.replaceState(null, "", w.location.pathname + (qs ? "?" + qs : "") + w.location.hash);
        } catch (eH) {}
      }
      return seat;
    } catch (e) {
      return null;
    }
  }

  function specLabel(key) {
    try {
      var list = (w.AMPRidgeMI && AMPRidgeMI.SPECIALTIES) || [];
      for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i].label;
    } catch (e) {}
    return key || "Specialty";
  }
  function stateLabel(code) {
    var st = normState(code);
    try {
      var names = (w.AMPRidgeMI && AMPRidgeMI.STATE_NAMES) || {};
      if (names[st]) return names[st];
    } catch (e) {}
    return normStateUp(st);
  }

  function tierCopy(seat) {
    seat = seat || load();
    if (seat.tier === "demo") {
      if (!isDemoCommitted(seat)) {
        return {
          tag: "Demo · pick 1×1",
          title: "Choose specialty, then state",
          body: "The workbench stays closed until you commit one specialty × one state. Then that unit is unlocked."
        };
      }
      return {
        tag: "Free demo · 1×1",
        title: specLabel(seat.demoSpecialty) + " × " + stateLabel(seat.demoState),
        body: "Anonymous demo: 1 specialty × 1 state, full surface. Verify a work email to taste +2 specialties."
      };
    }
    if (seat.tier === "verified") {
      var used = tasteSpecialties(seat).length;
      var leftTastes = Math.max(0, VERIFIED_TASTE_CAP - used);
      return {
        tag: "Verified sample · free",
        title: used + " of " + VERIFIED_TASTE_CAP + " specialty tastes",
        body: leftTastes
          ? ("Pick " + leftTastes + " more specialty" + (leftTastes === 1 ? "" : "s") + " in " + stateLabel(seat.demoState) + ". Same state only. Then hard paywall.")
          : "Three specialty tastes are in. Buy a poll package, or a $99 one-off report."
      };
    }
    var left = pollsLeft(seat);
    var lim = pollLimit(seat);
    return {
      tag: "Poll package · " + lim + " polls",
      title: left + " of " + lim + " polls left",
      body: "A poll opens one specialty in one state, any state, with every layer: pay bands, Place draw, cost of living and Aspects. Revisiting is free. Extra polls are $15 each once your package is used."
    };
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }
  function onDenial(fn) {
    if (typeof fn === "function") denialListeners.push(fn);
  }

  w.AMPRidgeAccess = {
    PLANS: PLANS,
    SKUS: SKUS,
    REGIONS: REGIONS,
    VERIFIED_TASTE_CAP: VERIFIED_TASTE_CAP,
    STORAGE_KEY: STORAGE_KEY,
    load: load,
    save: save,
    reset: reset,
    getSeat: load,
    isPaid: isPaid,
    isWorkEmail: isWorkEmail,
    canGrantExtraPoll: canGrantExtraPoll,
    canBuyExtraPoll: canBuyExtraPoll,
    pollLimit: pollLimit,
    pollsUsed: pollsUsed,
    pollsLeft: pollsLeft,
    allowedStates: allowedStates,
    canState: canState,
    canSpecialty: canSpecialty,
    canCombo: canCombo,
    trySpecialty: trySpecialty,
    tryState: tryState,
    startDemo: startDemo,
    isDemoCommitted: isDemoCommitted,
    oneStateUnit: oneStateUnit,
    allowsPeek: allowsPeek,
    allowsMulti: allowsMulti,
    verify: verify,
    simulateVerify: simulateVerify,
    openUnits: openUnits,
    applyPaid: applyPaid,
    consumeCheckoutQuery: consumeCheckoutQuery,
    specLabel: specLabel,
    stateLabel: stateLabel,
    tierCopy: tierCopy,
    tasteSpecialties: tasteSpecialties,
    lastDenial: function () { return lastDenial; },
    onChange: onChange,
    onDenial: onDenial,
    normState: normState
  };
})(window);
