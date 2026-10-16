/* 2315: Market Intelligence first-login guided tour. Dependency-free.
   Runs once per signed-in user (flag: auth user_metadata.mi_tour_done, localStorage fallback "amp_mi_tour_done:<user id>").
   Replay: "Take the tour" link in the account bar, or ?tour=1. */
(function (w, d) {
  "use strict";
  var STEPS = [
    { sel: ["#mi-app-specialty", "#ridge-app-walk-specialty", "#ridge-demo-specialty"], title: "1. Pick your specialty",
      text: "Start here. Choose the specialty you're hiring for and everything on the page follows it." },
    { sel: ["#ridge-app-walk-state", "#ridge-demo-state", "#ridge-map-wrap"], title: "2. Pick a state",
      text: "Choose a state (or tap it on the map) to see its compensation bands and market detail." },
    { sel: ["#ridge-map-wrap", "#ridge-map-container"], title: "3. The map",
      text: "This is where everything shows. Hover or tap a state for details, and switch what the map shows with the buttons above it." },
    { sel: ["#mi-aspects-selector", "#mi-ws-day", "#mi-worksheets"], title: "4. Filters and aspects",
      text: "Fine-tune the view here: aspects like Place draw and cost of living, plus the Comp per Patient Worksheet (formerly Day load)." }
  ];
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
  function css() {
    if (d.getElementById("mi-tour-css")) return;
    var s = d.createElement("style"); s.id = "mi-tour-css";
    s.textContent = "#mi-tour{position:fixed;inset:0;z-index:10000;pointer-events:none}" +
      "#mi-tour .mt-hole{position:fixed;border-radius:10px;box-shadow:0 0 0 9999px rgba(8,18,28,.62);outline:3px solid #6BE0AD;transition:all .25s ease;pointer-events:none}" +
      "#mi-tour .mt-block{position:fixed;inset:0;pointer-events:auto}" +
      "#mi-tour .mt-card{position:fixed;pointer-events:auto;background:#fff;color:#0b2a44;border-radius:14px;padding:18px 18px 14px;width:min(340px,calc(100vw - 24px));box-shadow:0 12px 40px rgba(0,0,0,.3);font:400 15px/1.45 Inter,system-ui,sans-serif}" +
      "#mi-tour .mt-card h3{margin:0 0 6px;font-size:17px}#mi-tour .mt-card p{margin:0 0 14px}" +
      "#mi-tour .mt-row{display:flex;align-items:center;gap:8px}#mi-tour .mt-dots{flex:1;color:#6b7c8c;font-size:13px}" +
      "#mi-tour button{border:0;border-radius:8px;padding:9px 14px;font:600 14px/1 Inter,system-ui,sans-serif;cursor:pointer}" +
      "#mi-tour .mt-next{background:#0f2a3d;color:#fff}#mi-tour .mt-back{background:#eef2f5;color:#0b2a44}#mi-tour .mt-skip{background:none;color:#1a6fa3;padding:9px 4px}";
    d.head.appendChild(s);
  }
  function place() {
    if (!root) return;
    var el = target(STEPS[i]), vw = w.innerWidth, vh = w.innerHeight, cw = Math.min(340, vw - 24);
    if (el) {
      var r = el.getBoundingClientRect(), pad = 6;
      hole.style.display = "block";
      hole.style.left = (r.left - pad) + "px"; hole.style.top = (r.top - pad) + "px";
      hole.style.width = (r.width + pad * 2) + "px"; hole.style.height = Math.min(r.height + pad * 2, vh) + "px";
      var ch = card.offsetHeight || 170, top = r.bottom + 14;
      if (top + ch > vh - 8) top = r.top - ch - 14;
      if (top < 8) top = Math.max(8, vh - ch - 12);
      var left = Math.min(Math.max(12, r.left), vw - cw - 12);
      card.style.left = left + "px"; card.style.top = top + "px";
    } else {
      hole.style.display = "block"; hole.style.width = hole.style.height = "0px"; hole.style.left = vw / 2 + "px"; hole.style.top = vh / 2 + "px";
      card.style.left = ((vw - cw) / 2) + "px"; card.style.top = Math.max(12, (vh - (card.offsetHeight || 170)) / 2) + "px";
    }
  }
  function render() {
    var st = STEPS[i], el = target(st);
    if (el) { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); } }
    card.querySelector("h3").textContent = st.title;
    card.querySelector("p").textContent = st.text + (el ? "" : " (Open the Market Intelligence workspace to see it.)");
    card.querySelector(".mt-dots").textContent = (i + 1) + " of " + STEPS.length;
    card.querySelector(".mt-back").style.visibility = i ? "visible" : "hidden";
    card.querySelector(".mt-next").textContent = i === STEPS.length - 1 ? "Done" : "Next";
    place(); setTimeout(place, 350); setTimeout(place, 700);
  }
  function end() {
    if (!root) return; root.remove(); root = null;
    d.removeEventListener("keydown", onKey); w.removeEventListener("resize", onMove); w.removeEventListener("scroll", onMove, true);
    markDone();
  }
  function start() {
    if (root) return; css(); i = 0;
    root = d.createElement("div"); root.id = "mi-tour"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Market Intelligence tour");
    root.innerHTML = '<div class="mt-block"></div><div class="mt-hole"></div><div class="mt-card"><h3></h3><p></p><div class="mt-row"><span class="mt-dots"></span>' +
      '<button type="button" class="mt-skip">Skip</button><button type="button" class="mt-back">Back</button><button type="button" class="mt-next">Next</button></div></div>';
    d.body.appendChild(root);
    hole = root.querySelector(".mt-hole"); card = root.querySelector(".mt-card");
    card.querySelector(".mt-skip").onclick = end;
    card.querySelector(".mt-back").onclick = function () { if (i > 0) { i--; render(); } };
    card.querySelector(".mt-next").onclick = function () { if (i < STEPS.length - 1) { i++; render(); } else end(); };
    onKey = function (e) { if (e.key === "Escape") end(); else if (e.key === "ArrowRight") card.querySelector(".mt-next").click(); else if (e.key === "ArrowLeft") card.querySelector(".mt-back").click(); };
    onMove = function () { place(); };
    d.addEventListener("keydown", onKey); w.addEventListener("resize", onMove); w.addEventListener("scroll", onMove, true);
    render(); card.querySelector(".mt-next").focus();
  }
  function onMiPage() { return !!d.querySelector('.view[data-route^="mi-lite"]'); }
  function link() {
    var bar = d.getElementById("mi-acct-bar"); if (!bar || d.getElementById("mi-tour-link")) return;
    var a = acc(); if (!a || !a.user()) return;
    var t = d.createElement("a"); t.id = "mi-tour-link"; t.href = "#"; t.textContent = "Take the tour";
    t.style.cssText = "text-decoration:underline;color:inherit;font-weight:600";
    t.onclick = function (e) { e.preventDefault(); start(); };
    var right = bar.querySelector("span:nth-child(2)") || bar; right.insertBefore(t, right.firstChild);
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
    var a = acc(); if (!a) return;
    a.onChange(function (u) { setTimeout(link, 50); maybe(u); });
    a.init().then(function (u) { link(); maybe(u); });
    setInterval(link, 1500);
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();
})(window, document);
