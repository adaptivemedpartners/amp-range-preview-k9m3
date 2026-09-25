/* AMP Market Intelligence — Day load worksheet + Support input layer (v1, 2026-09-25)
 * Shared by the internal MI file and the public preview. Host calls:
 *   AmpMiWorksheets.sync({ host: Element, dayLoad: bool, support: bool, spec: {key,label,ampBands} })
 * No invented data: the only market number used is the specialty's AMP band (40 hr/week full-time baseline).
 * Everything else is what the user types. Inputs persist per browser (localStorage).
 */
(function (global) {
  "use strict";
  var KEY = "ampMiWorksheetsV1";
  var st = load();
  var last = { sig: "" };

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function dl() { return st.day || (st.day = { patients: "", per: "day", days: "5", hours: "8", weeks: "48", salary: "" }); }
  function sp() { return st.sup || (st.sup = { ma: "1", floatN: "0", floatShare: "3", fd: "0", fdShare: "1", sched: "0", schedShare: "1", other: "0", otherShare: "1", tasks: {} }); }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[$,\s]/g, "")); return isFinite(n) ? n : null; }
  function money(n) { return n == null ? "—" : "$" + Math.round(n).toLocaleString("en-US"); }
  function money2(n) { return n == null ? "—" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var CSS = "" +
    ".mi-ws{margin:0 0 12px;display:flex;flex-direction:column;gap:10px;font-size:13px}" +
    ".mi-ws-card{background:rgba(42,169,181,.07);border:1px solid rgba(42,169,181,.35);border-radius:12px;padding:12px 12px 10px}" +
    ".mi-ws-card h4{margin:0 0 2px;font-size:14px;font-weight:800;letter-spacing:.01em}" +
    ".mi-ws-sub{margin:0 0 10px;font-size:11.5px;opacity:.75;line-height:1.35}" +
    ".mi-ws-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
    ".mi-ws-grid .full{grid-column:1/-1}" +
    ".mi-ws label{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;opacity:.9}" +
    ".mi-ws input,.mi-ws select{font:inherit;font-size:14px;padding:7px 8px;border-radius:8px;border:1px solid rgba(148,163,184,.55);background:rgba(255,255,255,.92);color:#0f172a;min-width:0;width:100%;box-sizing:border-box}" +
    ".mi-ws .row2{display:flex;gap:6px}.mi-ws .row2>*{flex:1}" +
    ".mi-ws-out{margin-top:10px;border-top:1px dashed rgba(148,163,184,.5);padding-top:9px;display:flex;flex-direction:column;gap:5px}" +
    ".mi-ws-kv{display:flex;justify-content:space-between;gap:8px}.mi-ws-kv b{font-variant-numeric:tabular-nums}" +
    ".mi-ws-verdict{margin-top:4px;padding:7px 9px 7px 10px;border-radius:8px;font-weight:700;line-height:1.35;color:inherit!important;border-left:4px solid #94a3b8}" +
    ".mi-ws-verdict.red{background:rgba(239,68,68,.14);border-left-color:#ef4444}.mi-ws-verdict.comp{background:rgba(234,179,8,.16);border-left-color:#eab308}" +
    ".mi-ws-verdict.mag{background:rgba(34,197,94,.15);border-left-color:#22c55e}.mi-ws-verdict.dest{background:rgba(59,130,246,.15);border-left-color:#3b82f6}" +
    ".mi-ws-verdict.none{background:rgba(148,163,184,.14)}" +
    ".mi-ws-note{font-size:11px;opacity:.7;line-height:1.35}" +
    ".mi-ws-scale{position:relative;height:10px;border-radius:6px;background:linear-gradient(90deg,#ef4444 0%,#eab308 40%,#22c55e 60%,#3b82f6 100%);margin:14px 0 18px}" +
    ".mi-ws-scale .tick{position:absolute;top:-4px;width:2px;height:18px;background:#0f172a;opacity:.55}" +
    ".mi-ws-scale .tick span{position:absolute;top:19px;left:50%;transform:translateX(-50%);font-size:10px;white-space:nowrap}" +
    ".mi-ws-scale .me{position:absolute;top:-6px;width:14px;height:22px;margin-left:-7px;border-radius:5px;background:#fff;border:2px solid #0f172a;box-shadow:0 1px 3px rgba(0,0,0,.3)}" +
    ".mi-ws-sgrid{display:grid;grid-template-columns:1.4fr .8fr 1fr;gap:6px 6px;align-items:center}.mi-ws-role{font-size:12px;font-weight:700}.mi-ws-h{font-size:10.5px;font-weight:700;opacity:.7}" +
    ".mi-ws-tasks{display:flex;flex-direction:column;gap:4px;margin-top:4px}" +
    ".mi-ws-tasks label{flex-direction:row;align-items:center;gap:7px;font-weight:600}" +
    ".mi-ws-tasks input{width:auto}" +
    "body.mi-mobile .sidebar.mi-ws-on{overflow-y:auto!important;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}" +
    "body.mi-mobile .sidebar.mi-ws-on>#mi-worksheets{order:2;padding:0 12px;flex:none}body.mi-mobile .sidebar.mi-ws-on>.sidebar-head{order:1}body.mi-mobile .sidebar.mi-ws-on>#side-body{order:3;flex:none;overflow:visible;max-height:none}" +
    "@media (max-width:760px){.mi-ws input,.mi-ws select{font-size:16px}.mi-ws-grid{grid-template-columns:1fr 1fr}}";

  function ensureCss() {
    if (document.getElementById("mi-ws-css")) return;
    var s = document.createElement("style"); s.id = "mi-ws-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---------- Day load ---------- */
  function dayHtml(spec) {
    var d = dl(); var b = spec && spec.ampBands;
    var comp = b && b.competitive != null ? b.competitive : null;
    return '<div class="mi-ws-card" id="mi-ws-day">' +
      '<h4>Day load worksheet</h4>' +
      '<p class="mi-ws-sub">' + esc(spec ? spec.label : "Pick a specialty") + ' · Competitive band ' + (comp != null ? money(comp) : "not set") +
      ' at a 40-hour week. Enter your schedule and volume to see the real rate.</p>' +
      '<div class="mi-ws-grid">' +
      '<label class="full">Patients seen<span class="row2"><input data-ws="day.patients" inputmode="decimal" placeholder="e.g. 20" value="' + esc(d.patients) + '">' +
      '<select data-ws="day.per"><option value="day"' + (d.per === "day" ? " selected" : "") + '>per day</option><option value="week"' + (d.per === "week" ? " selected" : "") + '>per week</option><option value="month"' + (d.per === "month" ? " selected" : "") + '>per month</option></select></span></label>' +
      '<label>Days per week<input data-ws="day.days" inputmode="decimal" value="' + esc(d.days) + '"></label>' +
      '<label>Hours per day<input data-ws="day.hours" inputmode="decimal" value="' + esc(d.hours) + '"></label>' +
      '<label>Weeks worked / year<input data-ws="day.weeks" inputmode="decimal" value="' + esc(d.weeks) + '"></label>' +
      '<label>Current salary (optional)<input data-ws="day.salary" inputmode="decimal" placeholder="e.g. 225000" value="' + esc(d.salary) + '"></label>' +
      '</div><div class="mi-ws-out" id="mi-ws-day-out"></div></div>';
  }

  function bandTier(fte, b) {
    if (!b || fte == null) return null;
    if (b.destination != null && fte >= b.destination) return { cls: "dest", name: "Destination" };
    if (b.magnet != null && fte >= b.magnet) return { cls: "mag", name: "Magnet" };
    if (b.competitive != null && fte >= b.competitive) return { cls: "comp", name: "Competitive" };
    return { cls: "red", name: b.redAlert != null && fte >= b.redAlert ? "Red alert" : "Below Red alert" };
  }

  function computeDay(spec) {
    var d = dl(); var b = spec && spec.ampBands; var comp = b && b.competitive != null ? b.competitive : null;
    var days = num(d.days), hrs = num(d.hours), wks = num(d.weeks), pts = num(d.patients), sal = num(d.salary);
    var hpw = days && hrs ? days * hrs : null;
    var ptsWeek = null;
    if (pts != null && pts > 0) {
      if (d.per === "day") ptsWeek = days ? pts * days : null;
      else if (d.per === "week") ptsWeek = pts;
      else ptsWeek = wks ? pts * 12 / wks : pts * 12 / 52;
    }
    var r = { comp: comp, hpw: hpw, wks: wks, ptsWeek: ptsWeek, sal: sal };
    if (comp != null && wks) {
      r.bandHourly = comp / (40 * wks);                       /* full-time 40 hr baseline */
      r.bandProrated = hpw ? comp * hpw / 40 : null;          /* same hourly rate at your hours */
      if (ptsWeek && hpw) r.bandPerPatient = comp / ((ptsWeek / hpw) * 40 * wks); /* band ÷ full-time patients at your pace */
    }
    if (sal != null && wks && hpw) {
      r.yourHourly = sal / (hpw * wks);
      r.fte = sal * 40 / hpw;                                 /* your pay scaled to 40 hr */
      if (ptsWeek) r.yourPerPatient = sal / (ptsWeek * wks);
      r.tier = bandTier(r.fte, b);
    }
    return r;
  }

  function dayOut(spec) {
    var r = computeDay(spec); var h = "";
    function kv(k, v) { h += '<div class="mi-ws-kv"><span>' + k + '</span><b>' + v + '</b></div>'; }
    if (r.comp == null) { return '<div class="mi-ws-note">No AMP Competitive band is set for this specialty yet, so there is no baseline to compare against.</div>'; }
    if (!r.hpw || !r.wks) return '<div class="mi-ws-note">Enter days per week, hours per day, and weeks per year.</div>';
    kv("Your hours / week", r.hpw.toFixed(r.hpw % 1 ? 1 : 0));
    kv("Band per hour (40-hr baseline)", money2(r.bandHourly));
    kv("Band pay at your hours", money(r.bandProrated));
    if (r.ptsWeek) {
      kv("Patients / week", Math.round(r.ptsWeek * 10) / 10);
      kv("Band per patient at your pace", money2(r.bandPerPatient));
    }
    if (r.sal != null) {
      kv("Your pay per hour", money2(r.yourHourly));
      if (r.yourPerPatient != null) kv("Your pay per patient", money2(r.yourPerPatient));
      kv("Your pay scaled to 40 hrs", money(r.fte));
      var t = r.tier;
      var hourWord = r.yourHourly >= r.bandHourly ? "above" : "below";
      var msg = "You are " + t.name + " per hour: " + money2(r.yourHourly) + "/hr, " + hourWord + " the " + money2(r.bandHourly) + "/hr Competitive rate.";
      if (r.yourPerPatient != null && r.bandPerPatient != null) {
        msg += " You are " + t.name + " per patient too: " + money2(r.yourPerPatient) + " vs " + money2(r.bandPerPatient) + " at your pace.";
      }
      h += '<div class="mi-ws-verdict ' + t.cls + '">' + msg + '</div>';
      h += '<div class="mi-ws-note">The band stays anchored to a 40-hour full-time week. Your pay is scaled to 40 hours (and your patient pace to a full-time load) so it can be read against the same band.</div>';
    } else {
      h += '<div class="mi-ws-note">Add a current salary to see where you land against the band.</div>';
    }
    return h;
  }

  /* ---------- Support ---------- */
  var TASKS = [
    ["sched", "Provider does own scheduling"],
    ["noshow", "Provider handles no-show / wellness follow-up calls"],
    ["inbox", "Provider handles inbox, refills, prior auths alone"],
    ["intake", "Provider does own intake / rooming"]
  ];
  function supHtml(spec) {
    var s = sp();
    function pair(label, a, b) {
      return '<span class="mi-ws-role">' + label + '</span>' +
        '<input data-ws="sup.' + a + '" inputmode="decimal" aria-label="' + label + ' people" value="' + esc(s[a]) + '">' +
        '<input data-ws="sup.' + b + '" inputmode="decimal" aria-label="' + label + ' providers shared across" value="' + esc(s[b]) + '">';
    }
    var tasks = TASKS.map(function (t) {
      return '<label><input type="checkbox" data-ws-task="' + t[0] + '"' + (s.tasks && s.tasks[t[0]] ? " checked" : "") + '> ' + t[1] + '</label>';
    }).join("");
    return '<div class="mi-ws-card" id="mi-ws-sup">' +
      '<h4>Support layer</h4>' +
      '<p class="mi-ws-sub">' + esc(spec ? spec.label : "") + ' · Scale: 1.0 = one dedicated MA per provider (the over/under line). Each support person counts 1 unit, split across the providers they cover.</p>' +
      '<div class="mi-ws-sgrid"><span></span><span class="mi-ws-h">People</span><span class="mi-ws-h">Shared across providers</span>' +
      '<span class="mi-ws-role">Dedicated MAs</span><input data-ws="sup.ma" inputmode="decimal" aria-label="Dedicated MAs per provider" value="' + esc(s.ma) + '"><span class="mi-ws-note">1 each</span>' +
      pair("Float MAs", "floatN", "floatShare") +
      pair("Front desk", "fd", "fdShare") +
      pair("Schedulers", "sched", "schedShare") +
      pair("Other (RN, scribe, coordinator)", "other", "otherShare") +
      '</div><div class="mi-ws-grid" style="margin-top:8px">' +
      '<div class="full"><div style="font-size:11px;font-weight:700">Work the provider carries themselves</div><div class="mi-ws-tasks">' + tasks + '</div></div>' +
      '</div><div class="mi-ws-out" id="mi-ws-sup-out"></div></div>';
  }
  function computeSup() {
    var s = sp();
    function share(n, k) { var a = num(s[n]) || 0, d = num(s[k]); return a > 0 ? a / (d && d > 0 ? d : 1) : 0; }
    var parts = { ma: num(s.ma) || 0, float: share("floatN", "floatShare"), fd: share("fd", "fdShare"), sched: share("sched", "schedShare"), other: share("other", "otherShare") };
    var total = parts.ma + parts.float + parts.fd + parts.sched + parts.other;
    var carried = TASKS.filter(function (t) { return s.tasks && s.tasks[t[0]]; }).map(function (t) { return t[1]; });
    return { parts: parts, total: total, carried: carried };
  }
  function supOut() {
    var r = computeSup(); var h = "";
    var max = Math.max(3, Math.ceil(r.total + 0.5));
    function pos(v) { return Math.max(0, Math.min(100, v / max * 100)); }
    h += '<div class="mi-ws-kv"><span>Your support units per provider</span><b>' + r.total.toFixed(2) + '</b></div>';
    var diff = r.total - 1;
    h += '<div class="mi-ws-scale" aria-label="Support scale">' +
      '<div class="tick" style="left:' + pos(0) + '%"><span>0</span></div>' +
      '<div class="tick" style="left:' + pos(1) + '%"><span>1.0 line</span></div>' +
      '<div class="tick" style="left:' + pos(2) + '%"><span>2.0</span></div>' +
      '<div class="me" style="left:' + pos(r.total) + '%" title="You"></div></div>';
    var bits = [];
    [["ma", "MA"], ["float", "Float MA"], ["fd", "Front desk"], ["sched", "Scheduler"], ["other", "Other"]].forEach(function (p) {
      if (r.parts[p[0]] > 0) bits.push(p[1] + " " + r.parts[p[0]].toFixed(2));
    });
    if (bits.length) h += '<div class="mi-ws-note">' + bits.join(" · ") + '</div>';
    var cls = diff >= 0.25 ? "mag" : diff > -0.25 ? "comp" : "red";
    var msg = Math.abs(diff) < 0.005 ? "Right on the 1.0 line." : (diff > 0 ? "+" + diff.toFixed(2) + " over the 1.0 line — more support than a one-MA setup." : diff.toFixed(2) + " under the 1.0 line — less support than a one-MA setup.");
    if (r.carried.length) msg += " The provider also carries " + r.carried.length + " task" + (r.carried.length === 1 ? "" : "s") + " themselves, which adds to their day.";
    h += '<div class="mi-ws-verdict ' + cls + '">' + msg + '</div>';
    if (r.carried.length) h += '<div class="mi-ws-note">Carried by the provider: ' + esc(r.carried.join("; ")) + '. Example: psych NPs at a large CHC usually have staff for scheduling and no-show follow-up; independent-practice NPs often do it themselves.</div>';
    h += '<div class="mi-ws-note">This is your personal layer, saved in this browser. Role weights are equal for now.</div>';
    return h;
  }

  /* ---------- wiring ---------- */
  var curSpec = null;
  function refreshOut() {
    var a = document.getElementById("mi-ws-day-out"); if (a) a.innerHTML = dayOut(curSpec);
    var b = document.getElementById("mi-ws-sup-out"); if (b) b.innerHTML = supOut();
  }
  function bind(root) {
    if (root.__miWsBound) return; root.__miWsBound = true;
    function onEv(e) {
      var t = e.target; var k = t.getAttribute && t.getAttribute("data-ws");
      if (k) { var p = k.split("."); (p[0] === "day" ? dl() : sp())[p[1]] = t.value; save(); refreshOut(); return; }
      var tk = t.getAttribute && t.getAttribute("data-ws-task");
      if (tk) { var s = sp(); s.tasks = s.tasks || {}; s.tasks[tk] = !!t.checked; save(); refreshOut(); }
    }
    root.addEventListener("input", onEv); root.addEventListener("change", onEv);
    ["pointerdown", "mousedown", "touchstart", "click", "wheel"].forEach(function (ev) {
      root.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
  }
  function sync(o) {
    o = o || {}; var host = o.host; if (!host) return;
    ensureCss();
    curSpec = o.spec || null;
    var sig = (o.dayLoad ? "D" : "") + (o.support ? "S" : "") + "|" + (curSpec ? curSpec.key : "") + "|" + (curSpec && curSpec.ampBands ? curSpec.ampBands.competitive : "");
    var par = host.parentElement;
    if (!o.dayLoad && !o.support) { host.innerHTML = ""; host.hidden = true; last.sig = sig; if (par) par.classList.remove("mi-ws-on"); return; }
    var wasOn = last.sig && (last.sig.charAt(0) === "D" || last.sig.charAt(0) === "S");
    var prevKinds = (last.sig || "").split("|")[0], nowKinds = sig.split("|")[0];
    host.hidden = false;
    if (par) par.classList.add("mi-ws-on");
    /* Mobile: a newly turned-on worksheet opens the bottom sheet so it is actually visible. */
    if (nowKinds !== prevKinds && nowKinds.length >= prevKinds.length && typeof o.openMobile === "function") { try { o.openMobile(); } catch (eM) {} }
    if (sig !== last.sig || !host.querySelector(".mi-ws")) {
      host.innerHTML = '<div class="mi-ws">' + (o.dayLoad ? dayHtml(curSpec) : "") + (o.support ? supHtml(curSpec) : "") + '</div>';
      last.sig = sig;
    }
    bind(host); refreshOut();
  }
  global.AmpMiWorksheets = { sync: sync, _computeDay: computeDay, _computeSup: computeSup, _state: function () { return st; } };
})(window);
