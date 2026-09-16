/* amp-build:2112 Ridge V1 access — unit stairs (Mike lock 2026-09-15).
   Demo (1 state × 1 specialty) → verified (+2 specialties, 3 tastes) → paid geo + polls.
   Stripe Checkout is stubbed (test-mode hooks). Public data only — no MGMA. */
(function (w) {
  "use strict";

  var STORAGE_KEY = "amp_ridge_seat_v1";
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
    state: { id: "state", label: "State", price: 99, polls: 15, geo: "one-state" },
    region: { id: "region", label: "Region", price: 149, polls: 30, geo: "region" },
    national: { id: "national", label: "National", price: 225, polls: 60, geo: "national" }
  };

  var SKUS = {
    state: { sku: "ridge_state", kind: "subscription", plan: "state", amount: 99, label: "Ridge State · $99/mo" },
    region: { sku: "ridge_region", kind: "subscription", plan: "region", amount: 149, label: "Ridge Region · $149/mo" },
    national: { sku: "ridge_national", kind: "subscription", plan: "national", amount: 225, label: "Ridge National · $225/mo" },
    extra_poll: { sku: "ridge_extra_poll", kind: "one_time", amount: 9, label: "Ridge Extra Poll · $9" },
    oneoff: { sku: "ridge_oneoff", kind: "one_time", amount: 49, label: "Ridge One-off Report · $49" }
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
      demoState: DEFAULT_STATE,
      demoSpecialty: DEFAULT_SPEC,
      tastes: [],
      polls: [],
      extraPolls: 0,
      oneOffs: [],
      paidState: "",
      paidRegion: "",
      seat: null,
      checkoutStub: true,
      updatedAt: null
    };
  }

  function migrateLegacy(seat) {
    try {
      if (localStorage.getItem(LEGACY_UNLOCK) !== "1") return seat;
      var plan = String(localStorage.getItem(LEGACY_PLAN) || "").toLowerCase();
      if (plan === "monthly" || plan === "annual") plan = "region";
      if (plan === "state" || plan === "region" || plan === "national") {
        seat.tier = plan;
        if (plan === "state" && !seat.paidState) seat.paidState = DEFAULT_STATE;
        if (plan === "region" && !seat.paidRegion) seat.paidRegion = "southwest";
      } else if (plan === "demo") {
        seat.tier = "demo";
      }
    } catch (e) {}
    return seat;
  }

  function load() {
    if (seatCache) return seatCache;
    var seat = defaultSeat();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
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
    if (!seat.demoState) seat.demoState = DEFAULT_STATE;
    if (!seat.demoSpecialty) seat.demoSpecialty = DEFAULT_SPEC;
    if (!Array.isArray(seat.tastes)) seat.tastes = [];
    if (!Array.isArray(seat.polls)) seat.polls = [];
    if (!Array.isArray(seat.oneOffs)) seat.oneOffs = [];
    if (!PLANS[seat.tier]) seat.tier = "demo";
    seatCache = seat;
    return seat;
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
    try {
      localStorage.removeItem(LEGACY_UNLOCK);
      localStorage.removeItem(LEGACY_PLAN);
    } catch (e) {}
    lastDenial = null;
    return save(defaultSeat());
  }

  function isPaid(seat) {
    seat = seat || load();
    return seat.tier === "state" || seat.tier === "region" || seat.tier === "national";
  }
  function pollLimit(seat) {
    seat = seat || load();
    var plan = PLANS[seat.tier];
    var base = plan && plan.polls ? plan.polls : 0;
    return base + (Number(seat.extraPolls) || 0);
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
    var seen = [];
    (seat.tastes || []).forEach(function (t) {
      if (t && t.specialty && seen.indexOf(t.specialty) === -1) seen.push(t.specialty);
    });
    if (!seen.length && seat.demoSpecialty) seen.push(seat.demoSpecialty);
    return seen;
  }

  function allowedStates(seat) {
    seat = seat || load();
    if (seat.tier === "national") return null;
    if (seat.tier === "region") {
      var pack = REGIONS[seat.paidRegion];
      return pack ? pack.states.map(normState) : [];
    }
    if (seat.tier === "state") {
      return seat.paidState ? [normState(seat.paidState)] : [normState(seat.demoState || DEFAULT_STATE)];
    }
    return [normState(seat.demoState || DEFAULT_STATE)];
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
    return load().demoSpecialty || DEFAULT_SPEC;
  }

  function canSpecialty(key, seat) {
    seat = seat || load();
    key = String(key || "");
    if (!key) return false;
    if (isPaid(seat)) return true;
    if (seat.tier === "demo") return key === seat.demoSpecialty;
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
    if (isPaid(seat) && seat.tier === "state") return seat.paidState;
    return seat.demoState;
  }

  function tryState(code) {
    var seat = load();
    var st = normState(code);
    if (!st) return deny("missing_state");
    var spec = currentSpecialty() || seat.demoSpecialty;
    if (hasOneOff(seat, spec, st) && !isPaid(seat)) {
      return { ok: true, seat: seat, oneOff: true };
    }
    if (!canState(st, seat)) return deny("geo", { specialty: spec, state: st });
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
    if (opts.state) seat.demoState = normState(opts.state);
    if (opts.specialty) seat.demoSpecialty = String(opts.specialty);
    if (!seat.tastes.length) {
      ensureTaste(seat, seat.demoSpecialty, seat.demoState);
    }
    seat.tier = "demo";
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
    ensureTaste(seat, seat.demoSpecialty, seat.demoState);
    save(seat);
    return { ok: true, seat: seat };
  }

  function applyPaid(opts) {
    opts = opts || {};
    var sku = String(opts.sku || opts.plan || "").replace(/^ridge_/, "");
    var seat = load();
    if (sku === "extra_poll") {
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
    if (!PLANS[sku] || sku === "demo" || sku === "verified") return seat;
    seat.tier = sku;
    if (sku === "state") seat.paidState = normState(opts.state || seat.paidState || seat.demoState || DEFAULT_STATE);
    if (sku === "region") seat.paidRegion = String(opts.region || seat.paidRegion || "southwest");
    if (opts.specialty) seat.demoSpecialty = String(opts.specialty);
    return save(seat);
  }

  function consumeCheckoutQuery() {
    try {
      var params = new URLSearchParams(w.location.search || "");
      var flag = params.get("ridge_checkout") || params.get("ridge_sku");
      if (!flag) return null;
      var sku = params.get("ridge_sku") || params.get("sku") || "";
      if (params.get("ridge_checkout") === "success" && !sku) sku = params.get("plan") || "state";
      if (params.get("ridge_checkout") && params.get("ridge_checkout") !== "success" && !params.get("ridge_sku")) {
        sku = params.get("ridge_checkout");
      }
      if (!sku) return null;
      var seat = applyPaid({
        sku: sku,
        state: params.get("ridge_state") || params.get("state"),
        region: params.get("ridge_region") || params.get("region"),
        specialty: params.get("ridge_specialty") || params.get("specialty")
      });
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
      return {
        tag: "Demo · free",
        title: specLabel(seat.demoSpecialty) + " × " + stateLabel(seat.demoState),
        body: "Anonymous demo: 1 state × 1 specialty, full surface. Verify a work email to taste +2 specialties."
      };
    }
    if (seat.tier === "verified") {
      var used = tasteSpecialties(seat).length;
      return {
        tag: "Verified sample · free",
        title: used + " of " + VERIFIED_TASTE_CAP + " specialty tastes",
        body: "Hard paywall after 3 tastes. Subscribe to unlock geo + monthly polls."
      };
    }
    var left = pollsLeft(seat);
    var lim = pollLimit(seat);
    return {
      tag: (PLANS[seat.tier] || {}).label + " · $" + ((PLANS[seat.tier] || {}).price || 0) + "/mo",
      title: left + " of " + lim + " polls left",
      body: "A poll is one specialty × state open inside your plan geography. Extra poll $9 · one-off report $49."
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
    verify: verify,
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
