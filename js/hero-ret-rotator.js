/* amp-build:2169-years-rotate-bridge
   amp-build:2155-home-placements-map
   amp-build:2154-hero-cleanup-kansas
   amp-build:2153-hero-rotator-mobile-slim
   Homepage still-there rotator. Big cards are painted from #amp-still-there-examples
   (swap that array; card chrome stays). Soft crossfade ~3.8s, pause on hover/focus,
   static first card if reduced-motion. */
(function () {
  "use strict";

  var INTERVAL_MS = 3800;
  var REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
  var CACHE_V = "2171";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Cards come from #amp-still-there-examples. Photos stay optional — do not invent portraits. */
  function renderStillThere(root) {
    if (!root || root.getAttribute("data-still-there-mount") == null) return;
    var dataEl = document.getElementById("amp-still-there-examples");
    if (!dataEl) return;
    var items;
    try {
      items = JSON.parse(dataEl.textContent);
    } catch (err) {
      return;
    }
    if (!items || !items.length) return;

    var html = '<div class="v3-still-stage">';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var on = i === 0;
      html += '<article class="v3-still-card' + (on ? " is-on" : "") + '" data-hero-ret-slide aria-hidden="' + (on ? "false" : "true") + '">';
      if (it.photo) {
        html += '<img class="v3-still-photo" src="' + esc(it.photo) + "?v=" + CACHE_V + '" alt="' + esc(it.alt || "") + '" width="136" height="136" />';
      }
      html += '<div class="v3-still-copy">';
      html += '<p class="v3-still-year">' + esc(it.year) + " · " + esc(it.specialty) + "</p>";
      html += '<p class="v3-still-facility">' + esc(it.facility) + "</p>";
      if (it.place) html += '<p class="v3-still-place">' + esc(it.place) + "</p>";
      html += '<p class="v3-still-line">' + esc(it.still) + "</p>";
      html += "</div></article>";
    }
    html += "</div>";
    html += '<div class="v3-still-dots">';
    for (var d = 0; d < items.length; d++) {
      var dotOn = d === 0;
      html += '<button type="button" class="v3-still-dot' + (dotOn ? " is-on" : "") + '" data-hero-ret-dot aria-label="Show still-there story ' + (d + 1) + '"' + (dotOn ? ' aria-current="true"' : "") + "></button>";
    }
    html += "</div>";
    root.innerHTML = html;
  }

  function prefersReduced() {
    return window.matchMedia && window.matchMedia(REDUCE_QUERY).matches;
  }

  function bindRotator(root) {
    if (!root || root.dataset.heroRetBound === "1") return;
    root.dataset.heroRetBound = "1";

    var slides = root.querySelectorAll("[data-hero-ret-slide]");
    var dots = root.querySelectorAll("[data-hero-ret-dot]");
    if (!slides.length) return;

    var index = 0;
    var timer = null;
    var paused = false;
    var reduce = prefersReduced();

    function show(next) {
      index = (next + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        var on = i === index;
        slides[i].classList.toggle("is-on", on);
        slides[i].setAttribute("aria-hidden", on ? "false" : "true");
      }
      for (var d = 0; d < dots.length; d++) {
        var dotOn = d === index;
        dots[d].classList.toggle("is-on", dotOn);
        if (dotOn) dots[d].setAttribute("aria-current", "true");
        else dots[d].removeAttribute("aria-current");
      }
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function tick() {
      if (paused || prefersReduced()) return;
      show(index + 1);
    }

    function start() {
      stop();
      if (prefersReduced() || slides.length < 2) return;
      timer = setInterval(tick, INTERVAL_MS);
    }

    function onReduceChange() {
      reduce = prefersReduced();
      if (reduce) {
        stop();
        show(0);
        root.classList.add("is-static");
      } else {
        root.classList.remove("is-static");
        start();
      }
    }

    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    root.addEventListener("focusin", function () { paused = true; });
    root.addEventListener("focusout", function () { paused = false; });

    for (var b = 0; b < dots.length; b++) {
      (function (idx) {
        dots[idx].addEventListener("click", function () {
          show(idx);
          start();
        });
      })(b);
    }

    show(0);
    if (reduce) {
      root.classList.add("is-static");
    } else {
      start();
    }

    if (window.matchMedia) {
      var mq = window.matchMedia(REDUCE_QUERY);
      if (mq.addEventListener) mq.addEventListener("change", onReduceChange);
      else if (mq.addListener) mq.addListener(onReduceChange);
    }
  }

  function init() {
    var nodes = document.querySelectorAll("[data-hero-ret-rotator]");
    for (var i = 0; i < nodes.length; i++) {
      renderStillThere(nodes[i]);
      bindRotator(nodes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
