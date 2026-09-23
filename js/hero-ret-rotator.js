/* amp-build:2181-still-there-swipe
   amp-build:2169-years-rotate-bridge
   amp-build:2155-home-placements-map
   amp-build:2154-hero-cleanup-kansas
   amp-build:2153-hero-rotator-mobile-slim
   Homepage still-there rotator. Big cards are painted from #amp-still-there-examples
   (swap that array; card chrome stays). Soft crossfade ~3.8s, pause on hover/focus,
   static first card if reduced-motion.
   Horizontal drag/swipe on the card track moves prev/next, pauses auto-rotate
   while the finger or pointer is down, then resumes. Vertical page scroll wins
   until the gesture is clearly horizontal. */
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

    var html = '<div class="v3-still-stage" data-hero-ret-track>';
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
    var hoverPaused = false;
    var focusPaused = false;
    var dragPaused = false;
    var reduce = prefersReduced();
    var drag = null;
    var settling = false;
    var STAGE_LOCK = 10;
    var FLICK_PX_MS = 0.45;

    function clearMotion() {
      for (var i = 0; i < slides.length; i++) {
        slides[i].style.transform = "";
        slides[i].style.opacity = "";
        slides[i].style.visibility = "";
        slides[i].style.transition = "";
      }
      root.classList.remove("is-dragging");
      root.classList.remove("is-settling");
    }

    function show(next) {
      index = (next + slides.length) % slides.length;
      clearMotion();
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

    function trackWidth() {
      var stage = root.querySelector("[data-hero-ret-track]");
      var w = stage ? stage.getBoundingClientRect().width : 0;
      return w || root.getBoundingClientRect().width || 1;
    }

    function paintDrag(px) {
      var w = trackWidth();
      var dir = px < 0 ? 1 : (px > 0 ? -1 : 0);
      var incoming = dir === 0 ? -1 : (index + dir + slides.length) % slides.length;
      root.classList.add("is-dragging");
      for (var i = 0; i < slides.length; i++) {
        slides[i].style.transition = "none";
        if (i === index) {
          slides[i].style.transform = "translate3d(" + px + "px,0,0)";
          slides[i].style.opacity = "1";
          slides[i].style.visibility = "visible";
        } else if (i === incoming) {
          var origin = dir === 1 ? w : -w;
          slides[i].style.transform = "translate3d(" + (origin + px) + "px,0,0)";
          slides[i].style.opacity = "1";
          slides[i].style.visibility = "visible";
        } else {
          slides[i].style.transform = "";
          slides[i].style.opacity = "0";
          slides[i].style.visibility = "hidden";
        }
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

    function resumeAfterGesture() {
      dragPaused = false;
      paused = hoverPaused || focusPaused;
      if (!paused) start();
    }

    root.addEventListener("mouseenter", function () { hoverPaused = true; paused = true; });
    root.addEventListener("mouseleave", function () {
      hoverPaused = false;
      paused = dragPaused || focusPaused;
      if (!paused) start();
    });
    root.addEventListener("focusin", function () { focusPaused = true; paused = true; });
    root.addEventListener("focusout", function () {
      focusPaused = false;
      paused = dragPaused || hoverPaused;
      if (!paused) start();
    });

    for (var b = 0; b < dots.length; b++) {
      (function (idx) {
        dots[idx].addEventListener("click", function () {
          show(idx);
          start();
        });
      })(b);
    }

    var stage = root.querySelector("[data-hero-ret-track]");
    if (stage && slides.length > 1) {
      stage.addEventListener("dragstart", function (e) { e.preventDefault(); });

      function onMove(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var adx = e.clientX - drag.x;
        var ady = e.clientY - drag.y;
        if (!drag.lock) {
          if (Math.abs(adx) < STAGE_LOCK && Math.abs(ady) < STAGE_LOCK) return;
          drag.lock = Math.abs(adx) > Math.abs(ady) ? "x" : "y";
          if (drag.lock === "y") {
            /* Vertical intent: leave the page scroll alone. */
            detachDrag();
            clearMotion();
            resumeAfterGesture();
            return;
          }
          if (stage.setPointerCapture) {
            try { stage.setPointerCapture(e.pointerId); } catch (err) {}
          }
        }
        if (drag.lock !== "x") return;
        if (e.cancelable) e.preventDefault();
        var now = performance.now();
        var dt = Math.max(1, now - drag.t);
        drag.vx = (e.clientX - drag.lastX) / dt;
        drag.lastX = e.clientX;
        drag.t = now;
        drag.dx = adx;
        paintDrag(adx);
      }

      function detachDrag() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        drag = null;
      }

      function finishDrag(commit, dir) {
        var w = trackWidth();
        var from = index;
        var incoming = (from + dir + slides.length) % slides.length;
        var current = slides[from];
        var nextEl = slides[incoming];
        if (prefersReduced()) {
          if (commit) show(from + dir);
          else clearMotion();
          resumeAfterGesture();
          return;
        }
        settling = true;
        root.classList.remove("is-dragging");
        root.classList.add("is-settling");
        var ease = "transform 0.28s ease, opacity 0.28s ease";
        current.style.transition = ease;
        nextEl.style.transition = ease;
        if (commit) {
          current.style.transform = "translate3d(" + (dir * -w) + "px,0,0)";
          current.style.opacity = "0";
          nextEl.style.transform = "translate3d(0px,0,0)";
          nextEl.style.opacity = "1";
          nextEl.style.visibility = "visible";
        } else {
          current.style.transform = "translate3d(0px,0,0)";
          current.style.opacity = "1";
          nextEl.style.transform = "translate3d(" + (dir * w) + "px,0,0)";
          nextEl.style.opacity = "0";
        }
        var done = false;
        function doneSettle() {
          if (done) return;
          done = true;
          settling = false;
          if (commit) show(from + dir);
          else clearMotion();
          resumeAfterGesture();
        }
        current.addEventListener("transitionend", doneSettle);
        window.setTimeout(doneSettle, 360);
      }

      function onUp(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var locked = drag.lock;
        var dx = drag.dx;
        var vx = drag.vx;
        var kind = drag.kind;
        detachDrag();
        if (locked !== "x") {
          clearMotion();
          resumeAfterGesture();
          return;
        }
        var commit = Math.abs(dx) > Math.max(36, trackWidth() * 0.22) || Math.abs(vx) > FLICK_PX_MS;
        var signed = Math.abs(vx) > FLICK_PX_MS ? vx : dx;
        var dir = signed < 0 ? 1 : -1;
        if (kind === "touch" || kind === "pen") hoverPaused = false;
        finishDrag(commit, dir);
      }

      stage.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (drag || settling) return;
        dragPaused = true;
        paused = true;
        stop();
        drag = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          lastX: e.clientX,
          t: performance.now(),
          dx: 0,
          vx: 0,
          lock: null,
          kind: e.pointerType || "mouse"
        };
        window.addEventListener("pointermove", onMove, { passive: false });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      });
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
