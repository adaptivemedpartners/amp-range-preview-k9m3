/* amp-build:2152-hero-rotating-ret-card
   Compact homepage hero retention rotator. Self-contained.
   Soft crossfade ~3.8s, pause on hover/focus, static first card if reduced-motion. */
(function () {
  "use strict";

  var INTERVAL_MS = 3800;
  var REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

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
    for (var i = 0; i < nodes.length; i++) bindRotator(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
