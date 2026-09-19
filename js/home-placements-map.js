/* amp-build:2155-home-placements-map
   Homepage-only placements map. Stories + placement info.
   Reuses the in-repo USA map SVG. Not the Market Intelligence workbench. */
(function () {
  "use strict";

  var SVG_SRC = "assets/ridge-usa-map.svg?v=2155";

  var STATE_NAMES = {
    al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
    co: "Colorado", ct: "Connecticut", de: "Delaware", fl: "Florida", ga: "Georgia",
    hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa",
    ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
    ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi", mo: "Missouri",
    mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire", nj: "New Jersey",
    nm: "New Mexico", ny: "New York", nc: "North Carolina", nd: "North Dakota", oh: "Ohio",
    ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania", ri: "Rhode Island", sc: "South Carolina",
    sd: "South Dakota", tn: "Tennessee", tx: "Texas", ut: "Utah", vt: "Vermont",
    va: "Virginia", wa: "Washington", wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming",
    dc: "District of Columbia"
  };

  /* Public seats already on the homepage / client strip — information only. */
  var PLACEMENTS = {
    ne: [
      {
        year: "2015",
        role: "Pediatrician",
        place: "Nebraska FQHC",
        days: "90 DAYS to identify & place",
        stay: "11 YEARS LATER. STILL THERE."
      },
      {
        year: "2018",
        role: "Family Medicine",
        place: "Nebraska Critical Access Hospital",
        days: "174 DAYS to identify & place",
        stay: "8 YEARS LATER. STILL THERE."
      }
    ],
    ks: [
      {
        year: "2021",
        role: "Kansas medical group",
        stay: "5 YEARS LATER. STILL THERE."
      }
    ]
  };

  var state = {
    selected: null,
    hover: null,
    ready: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function norm(code) {
    return String(code || "").toLowerCase();
  }

  function storiesFor(code) {
    return PLACEMENTS[norm(code)] || null;
  }

  function stateLabel(code) {
    var key = norm(code);
    return STATE_NAMES[key] || String(code || "").toUpperCase();
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPanel(code) {
    var panel = $("home-place-map-panel");
    if (!panel) return;
    var key = norm(code);
    if (!key) {
      panel.innerHTML =
        '<p class="home-place-map-lead">Tap a highlighted state to see a seat that stuck.</p>' +
        '<p class="home-place-map-hint">Nebraska and Kansas carry the featured placements. Other states stay quiet on this map.</p>';
      return;
    }
    var stories = storiesFor(key);
    var name = stateLabel(key);
    if (!stories) {
      panel.innerHTML =
        '<p class="home-place-map-state">' + escapeHtml(name) + "</p>" +
        '<p class="home-place-map-lead">No featured seat in ' + escapeHtml(name) + " on this map.</p>" +
        '<p class="home-place-map-hint">Highlighted states are the placements we show here — still in role, years later.</p>';
      return;
    }
    var html = '<p class="home-place-map-state">' + escapeHtml(name) + "</p>";
    html += '<p class="home-place-map-count">' + stories.length + (stories.length === 1 ? " featured seat" : " featured seats") + "</p>";
    stories.forEach(function (story) {
      html += '<article class="home-place-story">';
      html += '<p class="home-place-story-year">' + escapeHtml(story.year) + "</p>";
      html += '<p class="home-place-story-role">' + escapeHtml(story.role) + "</p>";
      html += '<p class="home-place-story-place">' + escapeHtml(story.place) + "</p>";
      if (story.days) html += '<p class="home-place-story-days">' + escapeHtml(story.days) + "</p>";
      html += '<p class="home-place-story-stay">' + escapeHtml(story.stay) + "</p>";
      html += "</article>";
    });
    panel.innerHTML = html;
  }

  function paint() {
    var host = $("home-place-map");
    if (!host) return;
    host.querySelectorAll("[data-state]").forEach(function (el) {
      if (el.closest && el.closest(".home-place-pins")) return;
      var code = norm(el.getAttribute("data-state"));
      var hasStory = !!storiesFor(code);
      var on = state.selected === code;
      var hover = state.hover === code;
      el.classList.toggle("has-story", hasStory);
      el.classList.toggle("is-on", on);
      el.classList.toggle("is-hover", hover);
      if (hasStory && (on || hover)) el.style.fill = "#0f6f66";
      else if (hasStory) el.style.fill = "#2a9d8f";
      else if (on || hover) el.style.fill = "#7f93a3";
      else el.style.fill = "#c9d6e0";
    });
    host.querySelectorAll(".home-place-pin").forEach(function (pin) {
      var code = norm(pin.getAttribute("data-state"));
      pin.classList.toggle("is-on", state.selected === code);
    });
  }

  function selectState(code) {
    var key = norm(code);
    if (!key) return;
    state.selected = state.selected === key ? null : key;
    paint();
    renderPanel(state.selected);
  }

  function centroid(el) {
    try {
      var box = el.getBBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    } catch (e) {
      return null;
    }
  }

  function raiseFeatured(svg) {
    Object.keys(PLACEMENTS).forEach(function (code) {
      var path = svg.querySelector('[data-state="' + code + '"]');
      if (path && path.parentNode) path.parentNode.appendChild(path);
    });
  }

  function addPins(svg) {
    var old = svg.querySelector(".home-place-pins");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer.setAttribute("class", "home-place-pins");
    Object.keys(PLACEMENTS).forEach(function (code) {
      var path = svg.querySelector('[data-state="' + code + '"]');
      if (!path) return;
      var pt = centroid(path);
      if (!pt) return;
      var pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pin.setAttribute("class", "home-place-pin");
      pin.setAttribute("data-state", code);
      pin.setAttribute("cx", String(pt.x));
      pin.setAttribute("cy", String(pt.y));
      pin.setAttribute("r", "7");
      pin.setAttribute("tabindex", "0");
      pin.setAttribute("role", "button");
      pin.setAttribute("aria-label", stateLabel(code) + " placement");
      layer.appendChild(pin);
    });
    svg.appendChild(layer);
  }

  function showTip(evt, code) {
    var tip = $("home-place-map-tip");
    var wrap = $("home-place-map-wrap");
    if (!tip || !wrap) return;
    if (!code || window.matchMedia("(hover: none)").matches) {
      tip.hidden = true;
      tip.innerHTML = "";
      return;
    }
    var stories = storiesFor(code);
    var name = stateLabel(code);
    tip.hidden = false;
    tip.innerHTML = stories
      ? "<strong>" + escapeHtml(name) + "</strong><span>" + stories.length + (stories.length === 1 ? " featured seat" : " featured seats") + "</span>"
      : "<strong>" + escapeHtml(name) + "</strong><span>No featured seat</span>";
    var rect = wrap.getBoundingClientRect();
    var tw = tip.offsetWidth || 180;
    var th = tip.offsetHeight || 48;
    var x = evt.clientX - rect.left + 12;
    var y = evt.clientY - rect.top + 12;
    if (x + tw > rect.width - 8) x = Math.max(8, rect.width - tw - 8);
    if (y + th > rect.height - 8) y = Math.max(8, evt.clientY - rect.top - th - 10);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  function bind(host) {
    if (!host || host.getAttribute("data-place-bound") === "1") return;
    host.setAttribute("data-place-bound", "1");

    host.addEventListener("click", function (e) {
      var el = e.target.closest("[data-state]");
      if (!el || !host.contains(el)) return;
      e.preventDefault();
      selectState(el.getAttribute("data-state"));
    });

    host.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var el = e.target.closest("[data-state]");
      if (!el || !host.contains(el)) return;
      e.preventDefault();
      selectState(el.getAttribute("data-state"));
    });

    host.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var el = e.target.closest("[data-state]");
      var code = el && host.contains(el) ? norm(el.getAttribute("data-state")) : null;
      if (state.hover === code) {
        if (code) showTip(e, code);
        return;
      }
      state.hover = code;
      paint();
      showTip(e, code);
    });

    host.addEventListener("pointerleave", function () {
      state.hover = null;
      paint();
      showTip(null, null);
    });
  }

  function prepareSvg(host, svgText) {
    host.innerHTML = svgText;
    var svg = host.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "United States map of featured AMP placements");
    svg.querySelectorAll("[data-state]").forEach(function (el) {
      var code = norm(el.getAttribute("data-state"));
      el.style.cursor = "pointer";
      el.style.pointerEvents = "auto";
      if (storiesFor(code)) {
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", stateLabel(code) + " placement stories");
      }
    });
    raiseFeatured(svg);
    addPins(svg);
    bind(host);
    state.ready = true;
    paint();
    renderPanel(state.selected);
  }

  function load() {
    var host = $("home-place-map");
    if (!host) return;
    if (host.querySelector("svg")) {
      prepareSvg(host, host.innerHTML);
      return;
    }
    host.innerHTML = '<p class="home-place-map-fallback">Loading placements map…</p>';
    fetch(SVG_SRC)
      .then(function (r) {
        if (!r.ok) throw new Error("map " + r.status);
        return r.text();
      })
      .then(function (svg) {
        prepareSvg(host, svg);
      })
      .catch(function () {
        host.innerHTML = '<p class="home-place-map-fallback">Map could not load. Refresh to try again.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
