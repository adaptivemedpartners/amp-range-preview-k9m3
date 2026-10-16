/* 2315: Market Intelligence first-login guided tour. Dependency-free.
   Runs once per signed-in user (flag: auth user_metadata.mi_tour_done, localStorage fallback "amp_mi_tour_done:<user id>").
   Replay: "Take the tour" link in the account bar, or ?tour=1. */
(function (w, d) {
  "use strict";
  var STEPS = [
    { sel: ["#mi-app-specialty", "#ridge-app-walk-specialty", "#ridge-demo-specialty"], title: "Pick a specialty", advance: "change",
      text: "Start here. Choose the specialty you're hiring for (filter by All, Physicians, Dentistry and more)." },
    { sel: ["#mi-app-state", "#ridge-app-walk-state", "#ridge-demo-state"], title: "Now pick a state", advance: "change",
      text: "Pick a state from this list. You can also click a state on the map; they stay in sync." },
    { sel: ["#ridge-map-wrap", "#ridge-map-container"], title: "The map", needsWorkspace: true,
      text: "This is where everything shows. Hover a state to see it glow, click it to select it, and switch what the map shows with the buttons above it." },
    { sel: ["#mi-aspects-selector", "#mi-ws-day", "#mi-worksheets"], title: "Filters and aspects", needsWorkspace: true, rail: true,
      text: "Fine-tune the view here: aspects like Place draw and cost of living, plus the Comp per Patient Worksheet (formerly Day load)." }
  ];
  var BASE = STEPS.slice();
  /* 2316: one step per aspect actually in the rail (built from the page, so new aspects are included automatically). */
  var ASPECT_TEXT = {
    raw: "The plain numbers, no extra layer: supply and compensation as they are.",
    place_draw: "How strongly the place itself pulls physicians in: lifestyle, amenities and community.",
    day_load: "Comp per Patient Worksheet (formerly Day load): what the pay works out to per patient, based on daily volume.",
    specialty_supply: "How many physicians in this specialty already practice in each state.",
    support: "The support around a physician there: staff, coverage and resources.",
    cah: "Shows Critical Access Hospitals, the small rural hospitals, on the map.",
    fqhc: "Shows Federally Qualified Health Centers, the community clinics, on the map."
  };
  function railSteps() {
    var out = [], seen = {};
    Array.prototype.forEach.call(d.querySelectorAll("#mi-aspects-selector [data-aspect]"), function (b) {
      var id = b.getAttribute("data-aspect"); if (!id || seen[id] || !visible(b)) return; seen[id] = 1;
      var label = (b.textContent || id).replace(/\s+/g, " ").trim();
      if (id === "day_load") label = "Comp per Patient Worksheet (" + label + ")";
      out.push({ sel: ['#mi-aspects-selector [data-aspect="' + id + '"]'], title: label, needsWorkspace: true,
        text: ASPECT_TEXT[id] || ("Turns on the " + label + " layer on the map and in the numbers.") });
    });
    [["#mi-ws-day", "Comp per Patient Worksheet", "Enter patients per day and pay to see what compensation works out to per patient."],
     ["#mi-ws-sup", "Support worksheet", "Enter the support staff and resources you offer to see how your offer compares."]].forEach(function (x) {
      var e = d.querySelector(x[0]); if (e && visible(e)) out.push({ sel: [x[0]], title: x[1], needsWorkspace: true, text: x[2] });
    });
    return out;
  }
  function expandRail() {
    var r = railSteps(); if (!r.length) return;
    STEPS = BASE.filter(function (s) { return !s.rail; }).concat(r);
  }
  var i = 0, root, hole, card, onKey, onMove;
  function acc() { return w.AMPMiAccounts && w.AMPMiAccounts.enabled ? w.AMPMiAccounts : null; }
  function lsKey(u) { return "amp_mi_tour_done:" + (u && u.id || "anon"); }
  function done(u) {
    if (!u) return true;
    if (u.user_metadata && u.user_metadata.mi_tour_done) return true;
    try { return !!localStorage.getItem(lsKey(u)); } catch (e) { return false; }
  }
  function markDone() {
    var a = acc(), u = a && a.user();
    try { localStorage.setItem(lsKey(u), "1"); } catch (e) {}
    if (a && a.setMeta && u) a.setMeta({ mi_tour_done: new Date().toISOString() }).catch(function () {});
  }
  function visible(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; }
  function target(st) { for (var k = 0; k < st.sel.length; k++) { var e = d.querySelector(st.sel[k]); if (visible(e)) return e; } return null; }
  function go(route) { var a = d.createElement("a"); a.setAttribute("data-go", route); a.href = "#"; a.style.display = "none"; d.body.appendChild(a); a.click(); a.remove(); }
  function css() {
    if (d.getElementById("mi-tour-css")) return;
    var s = d.createElement("style"); s.id = "mi-tour-css";
    s.textContent = "#mi-tour{position:fixed;inset:0;z-index:10000;pointer-events:none}" +
      "#mi-tour .mt-dim{position:fixed;inset:0;background:rgba(6,14,22,.74);pointer-events:none}#mi-tour .mt-hole{position:fixed;border-radius:10px;box-shadow:0 0 0 3px #6BE0AD,0 0 18px 4px rgba(107,224,173,.55);transition:all .2s ease;pointer-events:none}" +
      "#mi-tour .mt-card{position:fixed;pointer-events:auto;background:#fff;color:#0b2a44;border-radius:12px;padding:16px 16px 12px;width:min(320px,calc(100vw - 24px));box-shadow:0 12px 40px rgba(0,0,0,.35);font:400 15px/1.45 Inter,system-ui,sans-serif;transition:top .2s ease,left .2s ease}" +
      "#mi-tour .mt-arrow{position:absolute;width:14px;height:14px;background:#fff;transform:rotate(45deg)}" +
      "#mi-tour .mt-card h3{margin:0 0 6px;font-size:17px}#mi-tour .mt-card p{margin:0 0 12px}" +
      "#mi-tour .mt-row{display:flex;align-items:center;gap:8px}#mi-tour .mt-dots{flex:1;color:#6b7c8c;font-size:13px}" +
      "#mi-tour button{border:0;border-radius:8px;padding:9px 14px;font:600 14px/1 Inter,system-ui,sans-serif;cursor:pointer}" +
      "#mi-tour .mt-next{background:#0f2a3d;color:#fff}#mi-tour .mt-back{background:#eef2f5;color:#0b2a44}#mi-tour .mt-skip{background:none;color:#1a6fa3;padding:9px 4px}";
    d.head.appendChild(s);
  }
  /* Anchored popover: beside the element (right, else left) on wide screens; below (else above) on phones. */
  function place() {
    if (!root) return;
    var el = cur, vw = w.innerWidth, vh = w.innerHeight, cw = Math.min(320, vw - 24), ch = card.offsetHeight || 170, gap = 16, arrow = card.querySelector(".mt-arrow");
    if (!el || !visible(el)) {
      root.querySelector(".mt-dim").style.clipPath = "none";
      hole.style.width = hole.style.height = "0px"; hole.style.left = vw / 2 + "px"; hole.style.top = vh / 2 + "px";
      card.style.left = ((vw - cw) / 2) + "px"; card.style.top = Math.max(12, (vh - ch) / 2) + "px"; arrow.style.display = "none"; return;
    }
    var r = el.getBoundingClientRect(), pad = 6;
    hole.style.left = (r.left - pad) + "px"; hole.style.top = (r.top - pad) + "px";
    hole.style.width = (r.width + pad * 2) + "px"; hole.style.height = (r.height + pad * 2) + "px";
    var x0 = r.left - pad, y0 = r.top - pad, x1 = r.right + pad, y1 = r.bottom + pad, dim = root.querySelector(".mt-dim");
    dim.style.clipPath = "polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, " + x0 + "px " + y0 + "px, " + x0 + "px " + y1 + "px, " + x1 + "px " + y1 + "px, " + x1 + "px " + y0 + "px, " + x0 + "px " + y0 + "px)";
    var side, left, top, mobile = vw < 760;
    if (!mobile && r.right + gap + cw <= vw - 8) side = "right";
    else if (!mobile && r.left - gap - cw >= 8) side = "left";
    else side = (r.bottom + gap + ch <= vh - 8 || r.top - gap - ch < 8) ? "below" : "above";
    if (side === "right" || side === "left") {
      left = side === "right" ? r.right + gap : r.left - gap - cw;
      top = Math.min(Math.max(8, r.top + r.height / 2 - ch / 2), vh - ch - 8);
    } else {
      left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), vw - cw - 12);
      top = side === "below" ? r.bottom + gap : r.top - gap - ch;
      top = Math.min(Math.max(8, top), vh - ch - 8);
    }
    card.style.left = left + "px"; card.style.top = top + "px";
    arrow.style.display = "block"; arrow.style.left = arrow.style.top = arrow.style.right = arrow.style.bottom = "";
    if (side === "right" || side === "left") {
      var ay = Math.min(Math.max(14, r.top + r.height / 2 - top - 7), ch - 28);
      arrow.style.top = ay + "px"; arrow.style[side === "right" ? "left" : "right"] = "-7px";
    } else {
      var ax = Math.min(Math.max(14, r.left + r.width / 2 - left - 7), cw - 28);
      arrow.style.left = ax + "px"; arrow.style[side === "below" ? "top" : "bottom"] = "-7px";
    }
  }
  var cur = null, unbind = null;
  function resolve(st, cb) {
    var el = target(st);
    if (el || !st.needsWorkspace) return cb(el);
    /* The map and aspects live in the workspace: open it (and the free sample, if it's ready), then retry. */
    var openBtn = d.querySelector(".ridge-demo-open:not([disabled]), .ridge-app-walk-open:not([disabled])");
    if (openBtn && visible(openBtn)) openBtn.click(); else go("mi-lite-app");
    var n = 0, t = setInterval(function () {
      n++;
      var e2 = target(st); if (e2 || n > 10) { clearInterval(t); cb(e2); }
    }, 250);
  }
  function render() {
    if (i >= 2 && STEPS.length === BASE.length) expandRail();
    var st = STEPS[i], my = i;
    if (unbind) { unbind(); unbind = null; }
    card.querySelector("h3").textContent = st.title;
    card.querySelector(".mt-dots").textContent = (i + 1) + " of " + STEPS.length;
    card.querySelector(".mt-back").style.visibility = i ? "visible" : "hidden";
    card.querySelector(".mt-next").textContent = i === STEPS.length - 1 ? "Done" : "Next";
    resolve(st, function (el) {
      if (!root || my !== i) return;
      cur = el;
      if (st.needsWorkspace && STEPS.length === BASE.length) { expandRail(); if (STEPS[my] !== st) return render(); }
      card.querySelector("p").textContent = st.text + (el ? "" : " (This opens in your workspace once you are signed in with your free sample.)");
      if (el) {
        try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); }
        if (st.advance === "change") {
          var h = function () { if (el.value && root && my === i) setTimeout(function () { if (root && my === i) card.querySelector(".mt-next").click(); }, 350); };
          el.addEventListener("change", h); unbind = function () { el.removeEventListener("change", h); };
        }
      }
      place(); setTimeout(place, 350); setTimeout(place, 800);
    });
  }
  function end() {
    if (!root) return; if (unbind) { unbind(); unbind = null; } root.remove(); root = null; cur = null;
    d.removeEventListener("keydown", onKey); w.removeEventListener("resize", onMove); w.removeEventListener("scroll", onMove, true);
    markDone();
  }
  function start() {
    if (root) return; css(); i = 0; STEPS = BASE.slice();
    root = d.createElement("div"); root.id = "mi-tour"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Market Intelligence tour");
    /* No full-screen blocker: the highlighted control stays usable so picking a specialty/state advances the tour. */
    root.innerHTML = '<div class="mt-dim"></div><div class="mt-hole"></div><div class="mt-card"><span class="mt-arrow"></span><h3></h3><p></p><div class="mt-row"><span class="mt-dots"></span>' +
      '<button type="button" class="mt-skip">Skip</button><button type="button" class="mt-back">Back</button><button type="button" class="mt-next">Next</button></div></div>';
    d.body.appendChild(root);
    hole = root.querySelector(".mt-hole"); card = root.querySelector(".mt-card");
    card.querySelector(".mt-skip").onclick = end;
    card.querySelector(".mt-back").onclick = function () { if (i > 0) { i--; render(); } };
    card.querySelector(".mt-next").onclick = function () { if (i < STEPS.length - 1) { i++; render(); } else end(); };
    onKey = function (e) { if (e.key === "Escape") end(); };
    onMove = function () { place(); };
    d.addEventListener("keydown", onKey); w.addEventListener("resize", onMove); w.addEventListener("scroll", onMove, true);
    render();
  }
  function onMiPage() { return !!d.querySelector('.view[data-route^="mi-lite"]'); }
  function link() { return; /* 2316: merged into the "Replay tour" button */
    var bar = d.getElementById("mi-acct-bar"); if (!bar || d.getElementById("mi-tour-link")) return;
    var a = acc(); if (!a || !a.user()) return;
    var t = d.createElement("a"); t.id = "mi-tour-link"; t.href = "#"; t.textContent = "Take the tour";
    t.style.cssText = "text-decoration:underline;color:inherit;font-weight:600";
    t.onclick = function (e) { e.preventDefault(); start(); };
    var right = bar.querySelector("span:nth-child(2)") || bar; right.insertBefore(t, right.firstChild);
  }
  /* 2316: visible "Replay tour" button near the top of the MI pages. */
  function replayBtns() {
    [['.view[data-route="mi-lite-app"] .ridge-control-top', "mi-tour-replay-app"], ['#mi-acct-bar', "mi-tour-replay-bar"]].forEach(function (x) {
      var host = d.querySelector(x[0]); if (!host || d.getElementById(x[1])) return;
      var b = d.createElement("button"); b.type = "button"; b.id = x[1]; b.className = "mi-tour-replay";
      b.innerHTML = '<span aria-hidden="true" style="font-size:16px;line-height:1">\u21bb</span> Replay tour';
      b.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;border:1px solid #78C4E5;background:#fff;color:#0b2a44;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap";
      b.onclick = function (e) { e.preventDefault(); start(); };
      host.appendChild(b);
    });
  }
  var tried = false;
  function maybe(u) {
    if (!u || tried || !onMiPage()) return;
    var force = new URLSearchParams(w.location.search || "").get("tour") === "1";
    if (!force && done(u)) return;
    tried = true;
    var wait = 0, t = setInterval(function () {
      wait += 500;
      if (d.querySelector(".mi-acct-modal:not([hidden])")) return; /* let sign-in / welcome / promo dialogs finish first */
      if (wait < 1500 && !force) return;
      clearInterval(t); start();
    }, 500);
  }
  w.AMPMiTour = { start: start, reset: function () { var a = acc(), u = a && a.user(); try { localStorage.removeItem(lsKey(u)); } catch (e) {} return a && a.setMeta ? a.setMeta({ mi_tour_done: null }) : null; } };
  function boot() {
    replayBtns();
    var a = acc(); if (!a) { setInterval(replayBtns, 1500); return; }
    a.onChange(function (u) { setTimeout(link, 50); maybe(u); });
    a.init().then(function (u) { link(); maybe(u); });
    setInterval(function () { link(); replayBtns(); }, 1500);
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();
})(window, document);
