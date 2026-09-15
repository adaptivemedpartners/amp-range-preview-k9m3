/* AMP Mountain Site — SPA router + video settle + shared trail transitions */
(function () {
  "use strict";
  window.__AMP_BUILD = "2111-legacy-blogs";

    /* Imagine winner lock 2026-09-09 ~12:49 CT: whole ~6s clip; HTML picker soft-fades late. */
  var SETTLE = 6.0;
  var FREEZE_END = 6.0; /* end of whole clip — do not freeze early */
  var OVERLAY_AT = 1.5; /* Mike lock 1:28 CT: fade from 1.5s */

  var state = {
    moving: false,
    settled: false,
    specialty: null,
    region: null,
    regions: [],
    jobId: null,
    facility: null,
    clientSpecialty: null,
    clientSpecialties: [],
    clientSpecialtyCustom: null,
    agreement: null,
    mpcAccess: "monthly",
    mpcUnlocked: false,
    mpcFilterSpecialty: "",
    mpcFilterLooking: "",
    mpcMetroOnly: true,
    mpcAmenities: [],
    mpcSelectedId: null,
    miLitePlan: "region",
    miLiteUnlocked: false,
    jobViews: 0,
    jobWhispered: false,
    guidePathText: ""
  ,
    browseGeo: null,
    softMatch: null,
    rankOrder: null,
    rankPick: null
  ,
    approachHold: false
  };

  var AGREEMENT_META = {
    "summit-clear": {
      tag: "Summit Clear",
      title: "Summit Clear (All-In)",
      blurb: "You hold the peak; AMP does the work — lump retainer + marketing + placement. A hiring guide owns the next step."
    },
    "shared-ascent": {
      tag: "Shared Ascent",
      title: "Shared Ascent (Partnership)",
      blurb: "Lower upfront risk — initiation + 4–6 monthlies. You wait; AMP works. A hiring guide owns the next step."
    },
    "mpc": {
      tag: "MPC · tailored search",
      title: "MPC tailor-search",
      blurb: "When nothing posted fits, a recruiting guide opens a tailored search with you."
    },
    "market-analysis": {
      tag: "Free market analysis",
      title: "Free market analysis from your hiring guide",
      blurb: "Soft start — leave your info and specialty/state context. Your hiring guide sends a free market read. No retainer to begin."
    }
  };

  function syncPickedAgreement() {
    var box = $("#picked-agreement");
    var tag = $("#picked-agreement-tag");
    var title = $("#picked-agreement-title");
    var blurb = $("#picked-agreement-blurb");
    var field = $("#meeting-agreement");
    var key = state.agreement;
    var meta = key && AGREEMENT_META[key];
    if (field) field.value = key || "";
    if (!box) return;
    if (!meta) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (tag) tag.textContent = meta.tag;
    if (title) title.textContent = meta.title;
    if (blurb) blurb.textContent = meta.blurb;
    var note = document.querySelector("#client-meeting-form textarea[name=\"note\"]");
    if (note && key === "market-analysis" && !note.value) {
      note.placeholder = "Specialty · state · what you want to understand in the market";
    }
    var meetLede = document.querySelector('[data-route="client-meeting"] .lede');
    if (meetLede && key === "market-analysis") {
      meetLede.innerHTML = "Request a <strong>free market analysis</strong> from your hiring guide. Soft start — no retainer required.";
    }
  }

  var video = null;
  var settleTimer = null;
  var onSettleTime = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setNavMode(route) {
    var nav = $("#site-nav");
    if (!nav) return;
    /* Match home glass anytime a full-bleed photo sits behind the bar. */
    var view = document.querySelector('.view.on[data-route="' + route + '"]') ||
      document.querySelector('.view[data-route="' + route + '"]');
    var photoHint = /^(home|physician|client|physician-|client-|job|chat|contact|mpc|mi-lite|residents|guides|education|hiring)/.test(String(route || ""));
    var overPhoto = route === "home" ||
      (view && (view.classList.contains("funnel") || view.classList.contains("trailhead") ||
        !!view.querySelector(":scope > .shot, .shot img.still, .hero-band .bg"))) ||
      (!view && photoHint);
    /* Prefer view classes when present; funnel/trailhead always glass. */
    if (view && (view.classList.contains("funnel") || view.classList.contains("trailhead"))) overPhoto = true;
    if (overPhoto) nav.classList.add("is-home");
    else nav.classList.remove("is-home");
  }

  function clearSettleWatch() {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
    if (video && onSettleTime) {
      video.removeEventListener("timeupdate", onSettleTime);
      onSettleTime = null;
    }
    if (video && video.__ampEaseRaf) {
      try { cancelAnimationFrame(video.__ampEaseRaf); } catch (e) {}
      video.__ampEaseRaf = null;
    }
  }



  /* Cover-locked SVG plank hits (viewBox = bake 2560×1096, slice = object-fit:cover). */
  var SPEC_PLANK_HITS = [['fm',417,153,1484,150],['obg',541,303,1228,109],['gi',590,431,1126,109],['neuro',645,558,1024,109],['dental',675,690,972,98],['other',524,794,1280,153]];
  var FAC_PLANK_HITS = [['fqhc',419,153,1484,153],['cah',541,306,1228,109],['bh',590,431,1126,109],['group',619,558,1075,109],['dental',675,690,972,98],['other',524,794,1280,153]];

  function ensureTrailheadHitLayer() {
    var layer = $("#trailhead-hit-layer");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "trailhead-hit-layer";
    layer.className = "trailhead-hit-layer";
    document.body.appendChild(layer);
    return layer;
  }

  function buildPlankSvg(hits, attr) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "plank-hit-svg");
    svg.setAttribute("viewBox", "0 0 2560 1096");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    hits.forEach(function (h) {
      var r = document.createElementNS(ns, "rect");
      r.setAttribute("class", "plank-hit");
      r.setAttribute("data-" + attr, h[0]);
      r.setAttribute("x", h[1]);
      r.setAttribute("y", h[2]);
      r.setAttribute("width", h[3]);
      r.setAttribute("height", h[4]);
      r.setAttribute("fill", "rgba(0,0,0,0.001)");
      svg.appendChild(r);
    });
    return svg;
  }

  function mountTrailheadHits(route) {
    route = route || state._approachRoute || "physician";
    var layer = ensureTrailheadHitLayer();
    layer.innerHTML = "";
    var attr = route === "client" ? "facility" : "specialty";
    var hits = route === "client" ? FAC_PLANK_HITS : SPEC_PLANK_HITS;
    var svg = buildPlankSvg(hits, attr);
    layer.appendChild(svg);
    layer.hidden = false;
    layer.classList.add("is-live");
    /* Keep legacy signpost in DOM for rails / a11y but don't let it steal taps while live. */
    $all(".sign-media-frame").forEach(function (fr) {
      fr.classList.add("hits-deferred");
    });
    if (route === "physician" || route === "physician-specialty") {
      wireOtherHot(layer, "specialty", openSpecialtyOtherPop);
    } else if (route === "client") {
      wireOtherHot(layer, "facility", openFacilityOtherPop);
    }
  }

  function unmountTrailheadHits() {
    var layer = $("#trailhead-hit-layer");
    if (layer) {
      layer.innerHTML = "";
      layer.classList.remove("is-live");
      layer.hidden = true;
    }
    $all(".sign-media-frame.hits-deferred").forEach(function (fr) {
      fr.classList.remove("hits-deferred");
    });
    /* Return Other pops home if they were moved onto the layer. */
    var specPop = $("#spec-other-pop");
    var homeSpec = $("#specialty-signpost");
    if (specPop && homeSpec && homeSpec.parentElement && specPop.parentElement === layer) {
      homeSpec.parentElement.appendChild(specPop);
    }
    var facPop = $("#fac-other-pop");
    var homeFac = $("#facility-signpost");
    if (facPop && homeFac && homeFac.parentElement && facPop.parentElement === layer) {
      homeFac.parentElement.appendChild(facPop);
    }
  }


  function ensureApproachHoldEl() {
    var hold = $("#approach-video-hold");
    if (hold) return hold;
    hold = document.createElement("div");
    hold.id = "approach-video-hold";
    hold.className = "approach-video-hold";
    hold.setAttribute("aria-hidden", "true");
    hold.hidden = true;
    document.body.insertBefore(hold, document.body.firstChild);
    return hold;
  }

  function pinApproachVideo(opts) {
    /* NEVER seek here — seeking the frame is the snap design avoids. */
    opts = opts || {};
    video = video || $("#home-video");
    if (!video) return;
    var hold = ensureApproachHoldEl();
    if (!opts.keepPlaying) {
      try { video.pause(); } catch (e) {}
    }
    if (video.parentElement !== hold) hold.appendChild(video);
    try {
      video.style.opacity = "1";
      video.removeAttribute("hidden");
      /* Poster flash = snap. Kill it for the whole approach. */
      if (video.getAttribute("poster")) {
        video.setAttribute("data-home-poster", video.getAttribute("poster"));
        video.removeAttribute("poster");
      }
    } catch (e) {}
    hold.hidden = false;
    document.body.classList.add("amp-live-trailhead");
    state.approachHold = true;
  }

  function paintFreezeCanvas() {
    /* Last decoded frame under the <video> so pause/ended never blanks or flashes poster. */
    video = video || $("#home-video");
    var hold = ensureApproachHoldEl();
    if (!video || !hold || !video.videoWidth) return;
    var canvas = hold.querySelector("canvas.approach-freeze");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "approach-freeze";
      canvas.setAttribute("aria-hidden", "true");
      hold.insertBefore(canvas, video);
    }
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      var ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0);
    } catch (e) {}
  }


  /* Home / re-enter: strip lit picker chrome so the next climb can soft-fade again.
     picker-in + after-approach both force opacity:1 — if either sticks, round 2 snaps. */
  function resetTrailheadPickerChrome(view, opts) {
    opts = opts || {};
    var views = view ? [view] : $all(".view.trailhead");
    views.forEach(function (v) {
      if (!v) return;
      v.classList.remove("picker-in", "after-approach", "signs-lit", "signs-frozen");
      /* clearLive only when leaving the climb (Home) — keep live-video-bg mid-swoop. */
      if (opts.clearLive) v.classList.remove("live-video-bg");
      /* Force style recalc so the next picker-in transition actually runs. */
      void v.offsetWidth;
    });
  }

  function teardownApproachVideo() {
    var hold = $("#approach-video-hold");
    var stage = $("#home-stage");
    video = (hold && hold.querySelector("video")) || $("#home-video");
    if (hold) {
      var c = hold.querySelector("canvas.approach-freeze");
      if (c) c.remove();
      hold.classList.remove("is-fading-out");
      hold.classList.remove("is-settling");
      hold.hidden = true;
      try { hold.style.opacity = ""; } catch (e) {}
    }
    if (video && stage && video.parentElement !== stage) {
      var poster = stage.querySelector(".home-poster");
      if (poster && poster.parentElement === stage) poster.after(video);
      else stage.insertBefore(video, stage.firstChild);
    }
    if (video) {
      try {
        var saved = video.getAttribute("data-home-poster");
        if (saved && !video.getAttribute("poster")) video.setAttribute("poster", saved);
      } catch (e) {}
      try {
        video.style.visibility = "";
        video.style.opacity = "";
        video.playbackRate = 1;
        video.pause();
        video.currentTime = 0;
      } catch (e) {}
    }
    if (stage) {
      stage.classList.remove("approach-under", "handoff", "playing", "approach-ghost");
      stage.classList.add("settled");
    }
    unmountTrailheadHits();
    document.body.classList.remove("amp-live-trailhead");
    state.approachHold = false;
  }

  function clearApproachHold() {
    teardownApproachVideo();
    resetTrailheadPickerChrome(null, { clearLive: true });
  }

  /* Post-swoop land: freeze still + specialty/facility sheet visible.
     Used for Back/Forward, Physicians/Hiring nav, and any non-approach door. */
  function showTrailheadPickerSheet(view, snap) {
    if (!view) return;
    view.classList.remove("live-video-bg");
    var img = view.querySelector("img.still");
    if (img) {
      try {
        img.style.opacity = "";
        img.style.visibility = "";
        /* Prefer baked freeze; else stock post-swoop PNG */
        if (!img.getAttribute("data-baked")) {
          img.src = "assets/hero-mountain-trailhead-freeze.png?v=2110";
        }
      } catch (e) {}
    }
    if (snap) view.classList.add("picker-snap");
    view.classList.add("picker-in", "after-approach", "signs-lit", "signs-frozen");
    if (snap) {
      setTimeout(function () {
        try { view.classList.remove("picker-snap"); } catch (e2) {}
      }, 320);
    }
    layoutSignMediaFrames();
  }


  /* After swoop: paint the exact paused video frame onto trailhead stills (same framing as home video). */
  function bakeFreezeToTrailheadStills(done) {
    video = video || $("#home-video");
    /* Only the wood-sign trailheads — never paint the freeze onto later ridge steps. */
    var imgs = $all('.view.trailhead[data-route="physician"] img.still, .view.trailhead[data-route="client"] img.still');
    function finishBake() {
      if (typeof done === "function") done();
    }
    if (!video || !video.videoWidth || !imgs.length) {
      /* Fallback still matches 4.0s extract */
      imgs.forEach(function (img) {
        if (!img.getAttribute("data-baked")) {
          img.src = "assets/hero-mountain-trailhead-freeze.png?v=2110";
        }
      });
      finishBake();
      return;
    }
    try {
      var c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      var ctx = c.getContext("2d");
      if (!ctx) { finishBake(); return; }
      ctx.drawImage(video, 0, 0);
      var url = c.toDataURL("image/jpeg", 0.92);
      var pending = imgs.length;
      imgs.forEach(function (img) {
        img.setAttribute("data-baked", "1");
        img.onload = function () {
          pending -= 1;
          if (pending <= 0) finishBake();
        };
        img.onerror = function () {
          pending -= 1;
          if (pending <= 0) finishBake();
        };
        img.src = url;
      });
      /* Safety if cached decode is sync */
      setTimeout(function () {
        if (pending > 0) finishBake();
      }, 120);
    } catch (e) {
      finishBake();
    }
  }



  /* Match focal-point % to object-fit:cover crop of the approach video / freeze still. */
  var SIGN_MEDIA_ASPECT = 2560 / 1096; /* imagine-home native */

  function layoutSignMediaFrames() {
    var frames = document.querySelectorAll(".sign-media-frame");
    if (!frames.length) return;
    var vw = window.innerWidth || document.documentElement.clientWidth || 1;
    var vh = window.innerHeight || document.documentElement.clientHeight || 1;
    var viewAspect = vw / vh;
    var mediaW, mediaH, left, top;
    if (viewAspect > SIGN_MEDIA_ASPECT) {
      /* viewport wider — cover crops top/bottom */
      mediaW = vw;
      mediaH = vw / SIGN_MEDIA_ASPECT;
      left = 0;
      top = (vh - mediaH) / 2;
    } else {
      /* viewport taller — cover crops sides */
      mediaH = vh;
      mediaW = vh * SIGN_MEDIA_ASPECT;
      top = 0;
      left = (vw - mediaW) / 2;
    }
    for (var i = 0; i < frames.length; i++) {
      var fr = frames[i];
      fr.style.position = "fixed";
      fr.style.left = left + "px";
      fr.style.top = top + "px";
      fr.style.width = mediaW + "px";
      fr.style.height = mediaH + "px";
      fr.style.right = "auto";
      fr.style.bottom = "auto";
      fr.style.inset = "auto";
    }
  }

  function markSignsFrozen(on) {
    document.querySelectorAll(".view.trailhead").forEach(function (v) {
      if (on) {
        v.classList.add("signs-frozen", "signs-lit");
      } else {
        v.classList.remove("signs-frozen");
      }
    });
    if (on) layoutSignMediaFrames();
  }


  function showBakedTrailheadStill(done) {
    /* Mike eye 2026-09-09 ~1:24 CT: NO settle blink.
       Pause on last decoded frame and leave <video> up under translucent picker.
       No opacity fade, no visibility hide, no still/canvas swap flash. */
    var hold = $("#approach-video-hold");
    if (video) {
      try { video.pause(); } catch (e) {}
      try {
        video.style.transition = "none";
        video.style.opacity = "1";
        video.style.visibility = "visible";
      } catch (e) {}
    }
    /* Optional safety canvas UNDER video — do not fade video onto it. */
    try { paintFreezeCanvas(); } catch (e) {}
    if (hold) {
      hold.classList.remove("is-settling");
      try { hold.style.opacity = "1"; } catch (e) {}
    }

    var route = state._approachRoute || "physician";
    var live = document.querySelector('.view.trailhead.on[data-route="' + route + '"]') ||
      document.querySelector('.view.trailhead[data-route="' + route + '"]');
    if (live) {
      live.classList.add("after-approach", "picker-in", "signs-lit", "live-video-bg");
      /* Keep live-video-bg — shot still stays hidden so last video frame remains solid. */
    }
    state.approachHold = true;
    if (live && live.querySelector(".hire-sheet")) {
      /* specialty HTML overlay */
    } else if (route === "client") {
      try { renderFacilitySignpost(); } catch (e) {}
      mountTrailheadHits("client");
    } else if (route === "physician" || route === "physician-specialty") {
      try { renderSpecialtyGrid(); } catch (e) {}
      mountTrailheadHits(route);
    }
    /* Quietly bake stills for later hops — do not reveal them yet. */
    try { bakeFreezeToTrailheadStills(function () {}); } catch (e) {}
    if (typeof done === "function") done();
  }

  function settleHome() {
    clearSettleWatch();
    state.settled = true;
    var stage = $("#home-stage");
    if (stage) {
      stage.classList.remove("playing", "approach-ghost");
      stage.classList.add("settled");
    }
    if (video) {
      try { video.pause(); } catch (e) {}
      /* Do not seek — home settled uses the wide poster, not the 4s frame. */
    }
  }

  /* Still-first LCP: do not put src on <video> until the page is usable (or the
     visitor actually starts the approach). Warm only on the home view so deep
     routes do not pull imagine-home.mp4. */
  var HOME_VIDEO_SRC = "assets/imagine-home.mp4?v=2110";

  function homeVideoSrcOf(el) {
    if (!el) return "";
    return el.getAttribute("src") || el.getAttribute("data-src") || HOME_VIDEO_SRC;
  }

  function attachHomeVideoSrc(el) {
    el = el || video || $("#home-video");
    if (!el) return el;
    var src = homeVideoSrcOf(el);
    if (!src) return el;
    if (el.getAttribute("src") !== src) {
      el.setAttribute("data-src", src);
      el.setAttribute("src", src);
      try { el.preload = "auto"; } catch (e) {}
      try { el.load(); } catch (e2) {}
    }
    return el;
  }

  function whenHomeVideoReady(el, done) {
    el = attachHomeVideoSrc(el);
    if (!el) {
      if (typeof done === "function") done(null);
      return;
    }
    if (el.readyState >= 2) {
      if (typeof done === "function") done(el);
      return;
    }
    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      if (typeof done === "function") done(el);
    }
    el.addEventListener("canplay", finish, { once: true });
    el.addEventListener("loadeddata", finish, { once: true });
    el.addEventListener("error", finish, { once: true });
    setTimeout(finish, 10000);
  }

  var homeVideoWarmArmed = false;
  function scheduleHomeVideoWarm() {
    function warm() {
      var stage = $("#home-stage");
      if (!stage || !stage.classList.contains("on")) return;
      attachHomeVideoSrc($("#home-video"));
    }
    function afterUsable() {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(warm, { timeout: 2200 });
      } else {
        setTimeout(warm, 600);
      }
    }
    if (document.readyState === "complete") {
      afterUsable();
      return;
    }
    if (homeVideoWarmArmed) return;
    homeVideoWarmArmed = true;
    window.addEventListener("load", afterUsable, { once: true });
  }

  function hydrateViewBackgrounds(view) {
    if (!view) return;
    view.querySelectorAll("[data-bg]").forEach(function (el) {
      var url = el.getAttribute("data-bg");
      if (!url || el.style.backgroundImage) return;
      el.style.backgroundImage = "url(\"" + url.replace(/"/g, "") + "\")";
    });
  }

  function startHomeVideo() {
    /* Design note: first paint ZOOMED OUT (video t=0 / wide poster) — play only on door. */
    clearApproachHold();
    state.approachHold = false;
    var stage = $("#home-stage");
    video = $("#home-video") || (function () {
      var hold = $("#approach-video-hold");
      return hold ? hold.querySelector("video") : null;
    })();
    if (stage) {
      stage.classList.remove("playing", "approach-under", "handoff", "approach-ghost");
      stage.classList.add("settled");
    }
    state.settled = true;
    clearSettleWatch();
    if (video) {
      try {
        video.style.visibility = "";
        video.style.opacity = "";
        video.playbackRate = 1;
        video.pause();
        video.currentTime = 0;
      } catch (e) {}
    }
    var skipBtn = $(".home-skip");
    if (skipBtn) skipBtn.hidden = true;
    scheduleHomeVideoWarm();
  }

  /* Play the imagine-home.mp4 (wide → trailhead), then continue to the chosen route.
     Pin to body hold BEFORE play. Pause at SETTLE (bake frame). Full speed — no
     playbackRate ease (that read as a soft cleanup / slowdown at the end). */
  function playHomeApproach(done, approachRoute) {
    state._approachRoute = approachRoute || "physician";
    /* Round-2 climb: start with picker hidden so OVERLAY_AT can fade it in again. */
    resetTrailheadPickerChrome(
      document.querySelector('.view.trailhead[data-route="' + state._approachRoute + '"]')
    );
    var stage = $("#home-stage");
    video = $("#home-video") || (function () {
      var hold = $("#approach-video-hold");
      return hold ? hold.querySelector("video") : null;
    })();
    /* Tear down any leftover freeze canvas / hidden video from a prior climb. */
    var priorHold = $("#approach-video-hold");
    if (priorHold) {
      var oldC = priorHold.querySelector("canvas.approach-freeze");
      if (oldC) oldC.remove();
      priorHold.classList.remove("is-fading-out");
      try { priorHold.style.opacity = ""; } catch (e) {}
    }
    if (video) {
      try {
        video.style.visibility = "visible";
        video.style.opacity = "1";
        video.playbackRate = 1;
      } catch (e) {}
    }
    clearSettleWatch();
    state.moving = false;

    var skipBtn = $(".home-skip");
    if (skipBtn) {
      skipBtn.hidden = false;
      skipBtn.textContent = "Skip";
      skipBtn.setAttribute("data-skip-video", "1");
    }

    var chromeLanded = false;
    var freezePaused = false;

    function landChrome() {
      if (chromeLanded) return;
      chromeLanded = true;
      if (skipBtn) skipBtn.hidden = true;
      state.moving = false;
      if (typeof done === "function") done();
    }

    function pauseFreeze(thenLand) {
      if (freezePaused) {
        if (thenLand) landChrome();
        return;
      }
      freezePaused = true;
      if (video) {
        try { video.playbackRate = 1; } catch (e) {}
        /* Pause only — no canvas, no seek. Leave the decoded frame up. */
        try { video.pause(); } catch (e) {}
      }
      clearSettleWatch();
      /* Bake onto freeze FIRST, then land chrome — avoids rough end pop. */
      showBakedTrailheadStill(function () {
        if (thenLand) landChrome();
      });
    }

    function finishHard() {
      if (chromeLanded && freezePaused) return;
      if (video) {
        try { video.playbackRate = 1; } catch (e) {}
        try { video.pause(); } catch (e) {}
      }
      pauseFreeze(true);
    }

    window.__ampFinishApproach = finishHard;

    if (!video || reducedMotion()) {
      if (video) pinApproachVideo({ keepPlaying: false });
      if (stage) {
        stage.classList.add("approach-ghost");
        stage.classList.remove("playing");
        stage.classList.add("settled");
      }
      finishHard();
      return;
    }

    function beginApproachPlay() {
      try { video.muted = true; } catch (e) {}
      try { video.playbackRate = 1; } catch (e) {}

      pinApproachVideo({ keepPlaying: true });
      if (stage) {
        stage.classList.remove("settled", "walk-forward", "handoff");
        stage.classList.add("playing", "approach-ghost");
      }

      try { video.currentTime = 0; } catch (e) {}


      var overlayStarted = false;
      function revealPickerOverlay() {
        if (overlayStarted) return;
        overlayStarted = true;
        var route = state._approachRoute || "physician";
        var live = document.querySelector('.view.trailhead.on[data-route="' + route + '"]') ||
          document.querySelector('.view.trailhead[data-route="' + route + '"]');
        if (live) {
          live.classList.add("picker-in", "after-approach", "live-video-bg", "signs-lit");
          if (route === "client" && live && !live.querySelector(".hire-sheet")) {
            try { renderFacilitySignpost(); } catch (e2) {}
            mountTrailheadHits("client");
          }
        }
        state.approachHold = true;
      }

      function tickApproach() {
        if (!video || freezePaused) return;
        var t = video.currentTime || 0;
        try { if (video.playbackRate !== 1) video.playbackRate = 1; } catch (e3) {}
        /* Soft HTML picker during late swoop — video keeps playing to end. */
        if (t >= OVERLAY_AT) revealPickerOverlay();
        /* Freeze only at end of whole clip — do not freeze early. */
        if (t >= FREEZE_END - 0.05 || (video.duration && t >= video.duration - 0.08)) {
          pauseFreeze(true);
          return;
        }
        if (!freezePaused) {
          try { video.__ampEaseRaf = requestAnimationFrame(tickApproach); } catch (e4) {}
        }
      }

      onSettleTime = function () { tickApproach(); };

      video.addEventListener("timeupdate", onSettleTime);
      video.addEventListener("ended", function () {
        pauseFreeze(true);
      });
      try { video.__ampEaseRaf = requestAnimationFrame(tickApproach); } catch (e5) {}

      var p = video.play();
      if (p && p.catch) {
        p.catch(function () { finishHard(); });
      }

      settleTimer = setTimeout(function () {
        if (!freezePaused) pauseFreeze(true);
        else if (!chromeLanded) landChrome();
      }, Math.round(SETTLE * 1000) + 2500);
      setTimeout(function () {
        if (!freezePaused) pauseFreeze(true);
      }, Math.round(FREEZE_END * 1000) + 2500);
    }

    whenHomeVideoReady(video, function (ready) {
      video = ready || video;
      if (!video || !homeVideoSrcOf(video)) {
        finishHard();
        return;
      }
      beginApproachPlay();
    });
  }

  function hideAllViews() {
    $all(".view").forEach(function (v) {
      v.classList.remove("on", "trail-out", "trail-in", "walk-forward", "soft-in", "after-approach", "live-video-bg", "picker-in", "picker-snap", "signs-lit", "signs-frozen");
    });
  }

  /* Funnel hops that use Physician-Path walk-forward (not fade/blur). */
  var WALK_ROUTES = {
    "home": true,
    "physician": true,
    "physician-rank": true,
    "physician-region": true,
    "physician-jobs": true,
    "job": true,
    "job-contact": true,
    "chat": true,
    "confirm-mess": true,
    "client": true,
    "client-specialty": true,
    "client-region": true,
    "client-retained": true,
    "client-meeting": true,
    "confirm-client": true,
    "education": true,
    "mpc": true,
    "mpc-portal": true,
    "mpc-browse": true,
    "mi-lite-portal": true,
    "mi-lite-login": true,
    "mi-lite-app": true,
    "about": true,
    "proof": true,
    "amp-score": true,
    "search": true,
    "contact": true,
    "for-physicians": true,
    "for-organizations": true,
    "residents": true,
    "mi-lite": true,
    "guides": true
  };

  function isWalkRoute(route) {
    return !!WALK_ROUTES[route];
  }

  var RIDGE_US_STATES = [
    { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
    { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" }, { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" },
    { abbr: "DC", name: "District of Columbia" }, { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" },
    { abbr: "ID", name: "Idaho" }, { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
    { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" }, { abbr: "ME", name: "Maine" },
    { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" },
    { abbr: "MS", name: "Mississippi" }, { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
    { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" }, { abbr: "NM", name: "New Mexico" },
    { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" },
    { abbr: "OK", name: "Oklahoma" }, { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
    { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" }, { abbr: "TX", name: "Texas" },
    { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" },
    { abbr: "WV", name: "West Virginia" }, { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" }
  ];

  /* EXAMPLE purchase regions for Ridge packages — refine later OK */
  var RIDGE_PURCHASE_REGIONS = {
    west: { label: "West", states: ["WA", "OR", "CA", "NV", "AK", "HI", "ID", "MT", "WY", "UT", "CO"] },
    southwest: { label: "Southwest", states: ["AZ", "NM", "TX", "OK"] },
    midwest: { label: "Midwest", states: ["ND", "SD", "NE", "KS", "MN", "IA", "MO", "WI", "IL", "MI", "IN", "OH"] },
    northeast: { label: "Northeast", states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "DE", "MD", "DC"] },
    southeast: { label: "Southeast", states: ["WV", "VA", "KY", "TN", "NC", "SC", "GA", "FL", "AL", "MS", "AR", "LA"] }
  };

  var MI_UNLOCK_KEY = "amp_mi_lite_unlocked";
  var MI_PLAN_KEY = "amp_mi_lite_plan";

  function normalizeMiLitePlan(plan) {
    if (plan === "state" || plan === "region" || plan === "national" || plan === "demo") return plan;
    /* legacy monthly/annual EXAMPLE doors → default Region package */
    if (plan === "monthly" || plan === "annual") return "region";
    return plan || "region";
  }

  function readMiLiteUnlock() {
    try {
      state.miLiteUnlocked = localStorage.getItem(MI_UNLOCK_KEY) === "1";
      state.miLitePlan = normalizeMiLitePlan(localStorage.getItem(MI_PLAN_KEY) || state.miLitePlan || "region");
    } catch (e) {
      state.miLiteUnlocked = !!state.miLiteUnlocked;
    }
    return !!state.miLiteUnlocked;
  }

  function writeMiLiteUnlock(plan) {
    state.miLiteUnlocked = true;
    if (plan) state.miLitePlan = plan;
    try {
      localStorage.setItem(MI_UNLOCK_KEY, "1");
      localStorage.setItem(MI_PLAN_KEY, state.miLitePlan || "region");
    } catch (e) {}
  }

  function clearMiLiteUnlock() {
    state.miLiteUnlocked = false;
    try {
      localStorage.removeItem(MI_UNLOCK_KEY);
      localStorage.removeItem(MI_PLAN_KEY);
    } catch (e) {}
  }

  function populateMIFields(selectId, regionsId) {
    var spec = $(selectId), regions = regionsId ? $(regionsId) : null;
    if (!spec) return;
    /* Paid Ridge: region lens removed — specialty + map select only */
    var useRidgeSpecs = selectId === "#mi-app-specialty" && window.AMPRidgeMI && AMPRidgeMI.SPECIALTIES && AMPRidgeMI.SPECIALTIES.length;
    if (!useRidgeSpecs) {
      if (!window.AMP_CONTENT) return;
      if (!spec.options.length) spec.innerHTML = AMP_CONTENT.specialties.filter(function (s) { return s.id !== "other"; }).map(function (s) { return '<option value="' + s.id + '">' + s.label + '</option>'; }).join("");
    }
    if (regions && window.AMP_CONTENT && !regions.innerHTML.trim()) {
      regions.innerHTML = AMP_CONTENT.regions.filter(function (r) { return r.id !== "open"; }).map(function (r) { return '<label class="mi-region-option"><input type="checkbox" value="' + r.id + '"> <span>' + r.label + '</span></label>'; }).join("");
    }
  }

  function renderMILite() {
    populateMIFields("#mi-app-specialty", "#mi-app-regions");
  }

  function ensureMiLiteStateOptions() {
    var sel = $("#mi-lite-state-select");
    if (!sel || sel.options.length > 1) return;
    RIDGE_US_STATES.forEach(function (st) {
      var opt = document.createElement("option");
      opt.value = st.abbr;
      opt.textContent = st.name + " (" + st.abbr + ")";
      sel.appendChild(opt);
    });
  }

  function updateMiLiteRegionStates() {
    var sel = $("#mi-lite-region-select");
    var line = $("#mi-lite-region-states");
    if (!sel || !line) return;
    var key = sel.value;
    var pack = RIDGE_PURCHASE_REGIONS[key];
    if (!pack) {
      line.hidden = true;
      line.textContent = "";
      return;
    }
    line.hidden = false;
    line.textContent = pack.label + " includes: " + pack.states.join(", ");
  }

  function syncMiLitePlanPickers() {
    var plan = normalizeMiLitePlan(state.miLitePlan);
    var statePicker = $("#mi-lite-state-picker");
    var regionPicker = $("#mi-lite-region-picker");
    if (statePicker) statePicker.hidden = plan !== "state";
    if (regionPicker) regionPicker.hidden = plan !== "region";
    if (plan === "region") updateMiLiteRegionStates();
  }

  function renderMILitePortal() {
    readMiLiteUnlock();
    state.miLitePlan = normalizeMiLitePlan(state.miLitePlan);
    ensureMiLiteStateOptions();
    $all('input[name="mi-lite-plan"]').forEach(function (input) {
      input.checked = input.value === state.miLitePlan;
      var card = input.closest(".mi-price-card");
      if (card) card.classList.toggle("is-selected", input.checked);
    });
    syncMiLitePlanPickers();
  }

  function updateMILiteDashboard() {
    var spec = $("#mi-app-specialty");
    if (!spec) return;
    var regionRoot = $("#mi-app-regions");
    var picks = regionRoot ? $all("#mi-app-regions input:checked").map(function (input) { return input.nextElementSibling ? input.nextElementSibling.textContent : input.value; }) : [];
    var chips = $("#mi-app-chip-row");
    if (chips) chips.innerHTML = (picks.length ? picks : ["Map select"]).map(function (name) { return '<span class="mi-region-chip"><span class="dot"></span>' + name + '<b>EXAMPLE</b></span>'; }).join("");
    if (window.AMPRidgeWorkbench && typeof AMPRidgeWorkbench.init === "function") {
      try {
        if (spec.value && typeof AMPRidgeWorkbench.setSpecialtyKey === "function") {
          /* keep workbench specialty in sync when form refreshes */
        }
        AMPRidgeWorkbench.init();
        if (spec.value && AMPRidgeWorkbench.getSpecialtyKey && spec.value !== AMPRidgeWorkbench.getSpecialtyKey()) {
          AMPRidgeWorkbench.setSpecialtyKey(spec.value);
        } else if (typeof AMPRidgeWorkbench.refresh === "function") {
          AMPRidgeWorkbench.refresh();
        }
      } catch (err) {
        console.warn("Ridge workbench", err);
      }
    }
  }

  function applyMiLiteLockUI() {
    var unlocked = readMiLiteUnlock();
    var dash = $("#mi-lite-dashboard");
    var meat = $("#mi-lite-dashboard-meat");
    var blur = $("#mi-lite-blur-overlay");
    var lockBanner = $("#mi-lite-lock-banner");
    var openBanner = $("#mi-lite-open-banner");
    var toolbar = $("#mi-lite-toolbar");
    if (dash) {
      dash.classList.toggle("is-locked", !unlocked);
      dash.classList.toggle("mi-lite-dashboard", true);
    }
    if (blur) blur.hidden = unlocked;
    if (lockBanner) lockBanner.hidden = unlocked;
    if (openBanner) openBanner.hidden = !unlocked;
    if (toolbar) toolbar.hidden = !unlocked;
    if (meat) meat.setAttribute("aria-hidden", unlocked ? "false" : "true");
  }

  function renderMILiteApp() {
    renderMILite();
    updateMILiteDashboard();
    applyMiLiteLockUI();
  }

  function renderMILiteLogin() {
    readMiLiteUnlock();
  }

  function renderDynamic(route, params) {
    if (route === "mi-lite") renderMILite();
    if (route === "mi-lite-portal") renderMILitePortal();
    if (route === "mi-lite-login") renderMILiteLogin();
    if (route === "mi-lite-app") renderMILiteApp();
    if (route === "physician" || route === "physician-specialty") renderSpecialtyGrid();
    if (route === "physician-rank") renderRankStep();
    if (route === "physician-region") renderRegionGrid();
    if (route === "physician-jobs") renderJobsList();
    if (route === "job") renderJob(params.id || state.jobId);
    if (route === "job-contact" || route === "chat") renderJobContact(params.id || state.jobId);
    if (route === "client") renderFacilitySignpost();
    if (route === "client-specialty") renderClientSpecialty();
    if (route === "client-region") renderClientRegion();
    if (route === "client-meeting") {
      syncPickedAgreement();
      if (state.clientState) {
        var _cms = $("#client-meeting-state");
        if (_cms && !_cms.value) _cms.value = state.clientState;
      }
      try { syncClientBdRoutePreview(); } catch (e) {}
    }
    if (route === "blog-post") renderBlogPost(params.slug);
    if (route === "search") renderSearch();
    if (route === "mpc-portal") renderMpcPortal();
    if (route === "mpc-browse") renderMpcBrowse();
  }

  /* Shared walk-forward for physician AND client funnel hops (Physician Path SoT).
     David UX lock 2026-09-09: BOTH candidate + client paths use the SAME scroll/gate
     come-up as hiring portal Shared Ascent (client-retained second option) — funnel sheet. */
  function go(route, opts) {
    opts = opts || {};
    if (route === "residents-fellows") route = "residents";
    /* moving lock removed — it was freezing all clicks after a stuck approach */
    state.moving = false;
    var next = document.querySelector('.view[data-route="' + route + '"]');
    if (!next && (route.indexOf("blog/") === 0 || route.indexOf("blog-posts/") === 0)) {
      next = document.querySelector('.view[data-route="blog-post"]');
    }
    if (route.indexOf("job/") === 0) {
      next = document.querySelector('.view[data-route="job"]');
    }
    if (!next) {
      console.warn("missing route", route);
      return;
    }

    var current = document.querySelector(".view.on");
    var prevRoute = current ? current.getAttribute("data-route") : null;
    if (prevRoute === "physician-jobs" && route !== "physician-jobs") { state.jobWhispered = false; clearJobsGuideWhisper(); }

    var params = opts.params || {};
    if (route.indexOf("job/") === 0) {
      params.id = route.split("/")[1];
      route = "job";
      next = document.querySelector('.view[data-route="job"]');
    }
    if (route.indexOf("blog-posts/") === 0) {
      params.slug = route.replace("blog-posts/", "");
      route = "blog-post";
      next = document.querySelector('.view[data-route="blog-post"]');
    }
    if (route.indexOf("blog/") === 0) {
      params.slug = route.replace("blog/", "");
      route = "blog-post";
      next = document.querySelector('.view[data-route="blog-post"]');
    }

    /* Home → trailhead swoop ONLY from Candidate/Client hero doors (data-approach).
       Nav Education/Blog/Physicians/Hiring and other links land instantly — no fly-in. */
    if (
      !opts.instant &&
      !opts.afterApproach &&
      prevRoute === "home" &&
      (route === "physician" || route === "client") &&
      !!opts.approach &&
      current &&
      current !== next
    ) {
      if (reducedMotion()) {
        /* fall through to instant land below */
      } else {
        /* Land trailhead under live approach video NOW so late-swoop HTML picker can fade on top. */
        hideAllViews();
        resetTrailheadPickerChrome(next);
        next.classList.add("on", "live-video-bg");
        setNavMode(route);
        syncGuideRoute(route);
        renderDynamic(route, params);
        try { applyDocumentSeo(route, params); } catch (eSeo) {}
        try {
          setRouteHash(opts.hash || route); /* approach early-land: PUSH so Back returns Home */
        } catch (e) {}
        window.scrollTo(0, 0);
        playHomeApproach(function () {
          /* End of whole clip: keep last video frame under picker — no live-video-bg strip (blink). */
          next.classList.add("after-approach", "picker-in", "signs-lit", "signs-frozen", "live-video-bg");
          state.moving = false;
          if (route === "client" && !next.querySelector(".hire-sheet")) {
            try { renderFacilitySignpost(); } catch (e2) {}
            mountTrailheadHits("client");
          }
        }, route);
        return;
      }
    }

    /* Design note: ONLY home→trailhead video animates. All other hops are instant — no walk, no soft-in fade. */
    var wantWalk = false;
    var useWalk = false;

    function land(soft) {
      hideAllViews();
      next.classList.add("on");
      try { hydrateViewBackgrounds(next); } catch (eBg) {}
      if (soft) next.classList.add("soft-in");
      if (opts.afterApproach) next.classList.add("after-approach");
      if (opts.afterApproach && state.approachHold && next.classList.contains("trailhead")) {
        next.classList.add("live-video-bg");
        /* Bake already finished before land — keep signs lit (do not strip). */
        next.classList.add("signs-lit", "signs-frozen");
      }
      if (route === "home") {
        clearApproachHold();
      } else if (state.approachHold && !opts.afterApproach) {
        /* Any hop after the swoop trailhead (incl. client-specialty) must drop the
           live hold — otherwise the facility/specialty bake stays under the next
           trailhead and hire labels float on the wrong signs. */
        bakeFreezeToTrailheadStills(function () {});
        teardownApproachVideo();
        resetTrailheadPickerChrome(null, { clearLive: true });
      }
      setNavMode(route); /* keep glass nav over trailhead/funnel photos — never sticky "page" */
      syncGuideRoute(route);
      state.moving = false;
      renderDynamic(route, params);
      try { applyDocumentSeo(route, params); } catch (eSeo) {}
      if ((route === "physician" || route === "client")) {
        var _v = document.querySelector('.view[data-route="' + route + '"]');
        if (_v && _v.querySelector(".hire-sheet")) {
          /* specialty HTML overlay — no plank hits */
        } else {
          mountTrailheadHits(route === "client" ? "client" : "physician");
        }
      } else if (route !== "physician" && route !== "client") {
        /* Keep hits only on specialty/facility trailheads. */
        if (!state.approachHold) unmountTrailheadHits();
      }
      window.scrollTo(0, 0);
      var personId = "";
      if (route === "guides") {
        personId = guidePersonIdFromHash(opts.hash) || guidePersonIdFromHash(location.hash);
      } else if (opts.hash && opts.hash !== route) {
        personId = opts.hash;
      }
      if (personId) {
        setTimeout(function () { scrollGuidePerson(personId); }, 60);
      }
      try {
        var routeKey = route;
        if (params.id) routeKey = "job/" + params.id;
        if (params.slug) routeKey = "blog/" + params.slug;
        setRouteHash(routeKey, {
          fromHistory: !!opts.fromHistory,
          replace: !!opts.replaceHash,
          personHash: (route === "guides") ? (opts.hash || "") : undefined
        });
      } catch (e) {}

      if ((route === "physician" || route === "client") && !opts.afterApproach) {
        /* Non-approach land = post-swoop menu on freeze (Physicians/Hiring nav, Back, crumbs).
           Only Home Candidate/Client doors with data-approach play the swoop. */
        if (state.approachHold || opts.fromHistory || opts.instant || !opts.approach) {
          teardownApproachVideo();
        }
        showTrailheadPickerSheet(next, true);
      }

      if (route === "home") startHomeVideo();
      else if (!opts.afterApproach && !state.approachHold) clearSettleWatch();
      /* afterApproach: keep timeupdate ease-out alive through the last half-second */
      if (route === "confirm-mess") {
        var m = document.getElementById("mess-response-mock");
        /* Default markup already says "Captured" — use "When" row as freshness signal */
        if (m && m.innerHTML.indexOf("When") === -1) stampMess("physician", "Ask a guide / contact interest");
      }
      if (route === "confirm-client") {
        var c = document.getElementById("mess-client-mock");
        var bd = state.clientBd;
        var ownerChip = document.getElementById("confirm-bd-owner-chip");
        var routeNote = document.getElementById("confirm-bd-route-note");
        if (ownerChip && bd && bd.ownerLabel) {
          ownerChip.innerHTML = '<span class="dot"></span> hiring guide · ' + bd.ownerLabel;
        }
        if (routeNote) {
          routeNote.textContent = bd && bd.state
            ? (bd.state + " · owner " + bd.ownerName + " · CC Mike · David · Randy")
            : "";
        }
        if (c && !c.innerHTML.trim()) {
          var messLine = bd
            ? ("Meeting request · " + bd.state + " · " + bd.ownerName + " → a hiring guide · CC Randy/Mike/David")
            : "Meeting request → a hiring guide";
          stampMess("client", messLine);
        }
      }
      if (route === "blog") renderBlogIndex();
    }

    /* prefers-reduced-motion or non-walk: instant land */
    if (wantWalk && reducedMotion()) {
      land(false);
      return;
    }

    /* Hops: walk forward through the outgoing still (3s, opacity 1), then instant land. */
    if (useWalk && current) {
      state.moving = true;
      current.classList.remove("soft-in");
      current.classList.add("on", "walk-forward");
      void current.offsetWidth; /* restart transition */
      setTimeout(function () {
        land(false); /* instant land — no trail-in fade */
        state.moving = false;
      }, 400);
      return;
    }

    land(false);
  }

  /* Physician specialty planks: priority board top-5 + Other (6 wood slots). Layout selection.. */
  var SIGN_SPEC_IDS = ["fm", "obg", "gi", "neuro", "dental", "other"];
  var SIGN_FACILITY_IDS = ["fqhc", "cah", "community", "system", "bh", "group"]; /* Mike stamp #2 Hospital-forward six — no Other */
  /* Client hire specialty: same six wood slots as physician; Other opens search. */
  function clientSpecRanksForFacility(facId) {
    var ranks = (window.AMP_CONTENT && AMP_CONTENT.facilitySpecialtyRanks) || {};
    var id = facId || state.facility || "fqhc";
    if (id === "hospital") id = "system";
    var rows = ranks[id] || ranks.other || [];
    return rows.slice();
  }

  function CLIENT_SIGN_SPEC_IDS_DYNAMIC() {
    var ids = clientSpecRanksForFacility().map(function (r) { return r.id; });
    if (ids.indexOf("other") < 0) ids.push("other");
    return ids;
  }

  /* legacy name used by Other-pop exclude — always live from facility */
  var CLIENT_SIGN_SPEC_IDS = ["fm", "obg", "cards", "hospitalist_internal_medicine", "psychiatry_general", "emergency_medicine", "neuro", "gi", "other"];
  function refreshClientSignSpecIds() {
    CLIENT_SIGN_SPEC_IDS = CLIENT_SIGN_SPEC_IDS_DYNAMIC();
  }

  function plankLabel(raw) {
    if (!raw) return "";
    /* Facility / short rail labels only — specialty planks use exact sign text. */
    return String(raw)
      .replace("Internal Medicine", "IM")
      .replace("Hospital / Health system", "Hospital")
      .replace("Medical group / Clinic", "Medical group")
      .replace("FQHC / Community health", "FQHC")
      .replace("Other organization", "Other")
      .replace("Other specialty", "Other");
  }

  function renderSignpost(signRoot, railRoot, items, attrName, opts) {
    if (!signRoot || !items || !items.length) return;
    opts = opts || {};
    var exact = !!opts.exactLabel;
    signRoot.innerHTML = items.map(function (s, i) {
      var label = exact ? s.label : plankLabel(s.label);
      return '<button class="hot slot-' + i + '" type="button" data-' + attrName + '="' + s.id + '" aria-label="' + s.label + '">' +
        '<span class="sign-words" aria-hidden="true">' + label + '</span></button>';
    }).join("");
    if (railRoot) {
      railRoot.innerHTML = items.map(function (s) {
        var label = exact ? s.label : plankLabel(s.label);
        return '<button type="button" data-' + attrName + '="' + s.id + '">' + label + '</button>';
      }).join("");
    }
  }

  function renderSpecialtyGrid() {
    if (!window.AMP_CONTENT) return;
    var byId = {};
    AMP_CONTENT.specialties.forEach(function (s) { byId[s.id] = s; });
    var items = SIGN_SPEC_IDS.map(function (id) { return byId[id]; }).filter(Boolean);
    renderSignpost($("#specialty-signpost"), $("#specialty-rail"), items, "specialty", { exactLabel: true });
    wireOtherHot($("#specialty-signpost"), "specialty", openSpecialtyOtherPop);
    wireOtherHot($("#specialty-rail"), "specialty", openSpecialtyOtherPop);
  }

  function wireOtherHot(root, attr, openFn) {
    if (!root) return;
    var nodes = root.querySelectorAll("[data-" + attr + "='other']");
    for (var i = 0; i < nodes.length; i++) {
      (function (btn) {
        if (btn._ampOtherWired) return;
        btn._ampOtherWired = true;
        var handler = function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          openFn();
        };
        btn.addEventListener("click", handler, true);
      })(nodes[i]);
    }
  }

  function closeSpecialtyOtherPop() {
    var pop = $("#spec-other-pop");
    if (!pop) return;
    pop.hidden = true;
    pop.setAttribute("hidden", "");
    pop.style.display = "";
    var sp = $("#specialty-signpost");
    if (sp) sp.classList.remove("hits-paused");
    var svg = document.querySelector("#trailhead-hit-layer .plank-hit-svg");
    if (svg) svg.classList.remove("hits-paused");
  }

  function openSpecialtyOtherPop() {
    var pop = $("#spec-other-pop");
    var list = $("#spec-other-list");
    var q = $("#spec-other-q");
    if (!pop || !list || !window.AMP_CONTENT) {
      console.warn("AMP: Other specialty pop missing");
      return;
    }

    /* Hire-sheet path: show FULL specialty list (type-to-filter). Legacy planks:
       exclude the five already on signs. */
    var hireSheet = document.querySelector('.view[data-route="physician"].on .hire-sheet') ||
      document.querySelector('.view.trailhead.on .hire-sheet');
    var plankIds = {};
    if (!hireSheet) {
      SIGN_SPEC_IDS.forEach(function (id) { if (id !== "other") plankIds[id] = true; });
    }
    function paint() {
      var needle = (q && q.value ? q.value : "").trim().toLowerCase();
      var rows = AMP_CONTENT.specialties.filter(function (s) {
        if (s.id === "other") return false;
        if (plankIds[s.id]) return false;
        if (!needle) return true;
        return String(s.label).toLowerCase().indexOf(needle) >= 0;
      });
      if (needle) {
        rows = rows.concat([{ id: "custom:" + needle, label: "Use “" + q.value.trim() + "”" }]);
      }
      list.innerHTML = rows.map(function (s) {
        return '<button type="button" data-specialty-pick="' + s.id + '">' + s.label + '</button>';
      }).join("") || '<div class="muted" style="font-size:12px;padding:8px">No matches — type a specialty name.</div>';
    }
    if (hireSheet) {
      /* Keep pop inside hire-sheet — hit layer is hidden on hire-sheet trailhead. */
      if (pop.parentElement !== hireSheet) hireSheet.appendChild(pop);
      pop.classList.add("in-hire-sheet");
      pop.classList.remove("on-hit-layer");
    } else {
      var layer = ensureTrailheadHitLayer();
      layer.hidden = false;
      layer.classList.add("is-live");
      if (pop.parentElement !== layer) layer.appendChild(pop);
      pop.classList.add("on-hit-layer");
      pop.classList.remove("in-hire-sheet");
      var sp = $("#specialty-signpost");
      if (sp) sp.classList.add("hits-paused");
      var svg = document.querySelector("#trailhead-hit-layer .plank-hit-svg");
      if (svg) svg.classList.add("hits-paused");
    }
    pop.hidden = false;
    try { pop.removeAttribute("hidden"); } catch (e) {}
    pop.style.display = "block";
    if (q) {
      q.value = "";
      try { q.focus({ preventScroll: true }); } catch (e) { /* no focus — avoids viewport jump */ }
    }
    paint();
    list.onclick = function (e) {
      /* amp-build:2059 — pick must set specialty, close pop, advance (same as hire-card Select) */
      var raw = e.target;
      if (raw && raw.nodeType === 3) raw = raw.parentElement;
      if (!raw || typeof raw.closest !== "function") return;
      var btn = raw.closest("[data-specialty-pick]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var id = (btn.getAttribute("data-specialty-pick") || "").trim();
      if (!id) return;
      if (id.indexOf("custom:") === 0) {
        state.specialty = id;
        state.specialtyCustom = id.slice(7);
      } else {
        state.specialty = id;
        state.specialtyCustom = null;
      }
      try { closeSpecialtyOtherPop(); } catch (err) {}
      go("physician-rank", { trail: true, instant: true });
    };
    if (q && !q._ampWired) {
      q._ampWired = true;
      q.addEventListener("input", paint);
    }
    var closer = $("#spec-other-close");
    if (closer && !closer._ampWired) {
      closer._ampWired = true;
      closer.addEventListener("click", closeSpecialtyOtherPop);
    }
  }

  function renderFacilitySignpost() {
    if (!window.AMP_CONTENT || !AMP_CONTENT.facilities) return;
    var byId = {};
    AMP_CONTENT.facilities.forEach(function (f) { byId[f.id] = f; });
    var items = SIGN_FACILITY_IDS.map(function (id) { return byId[id]; }).filter(Boolean);
    /* Exact sign labels — no selected state */
    renderSignpost($("#facility-signpost"), $("#facility-rail"), items, "facility", { exactLabel: true });
    wireOtherHot($("#facility-signpost"), "facility", openFacilityOtherPop);
    wireOtherHot($("#facility-rail"), "facility", openFacilityOtherPop);
  }

  function closeFacilityOtherPop() {
    var pop = $("#fac-other-pop");
    if (pop) {
      pop.hidden = true;
      try { pop.setAttribute("hidden", ""); } catch (e) {}
      pop.style.display = "";
    }
    var fp = $("#facility-signpost");
    if (fp) fp.classList.remove("hits-paused");
    var svgF = document.querySelector("#trailhead-hit-layer .plank-hit-svg");
    if (svgF) svgF.classList.remove("hits-paused");
  }

  function openFacilityOtherPop() {
    var pop = $("#fac-other-pop");
    var list = $("#fac-other-list");
    var q = $("#fac-other-q");
    if (!pop || !list || !window.AMP_CONTENT) return;
    var plankIds = {};
    SIGN_FACILITY_IDS.forEach(function (id) { if (id !== "other") plankIds[id] = true; });
    function paint() {
      var needle = (q && q.value ? q.value : "").trim().toLowerCase();
      var rows = AMP_CONTENT.facilities.filter(function (f) {
        if (f.id === "other") return false;
        if (plankIds[f.id]) return false;
        if (!needle) return true;
        return String(f.label).toLowerCase().indexOf(needle) >= 0;
      });
      if (needle) {
        rows = rows.concat([{ id: "custom:" + needle, label: "Use “" + q.value.trim() + "”" }]);
      }
      list.innerHTML = rows.map(function (f) {
        return '<button type="button" data-facility-pick="' + f.id + '">' + f.label + '</button>';
      }).join("") || '<div class="muted" style="font-size:12px;padding:8px">No matches — type a facility type.</div>';
    }
    var layer = ensureTrailheadHitLayer();
    if (pop.parentElement !== layer) layer.appendChild(pop);
    pop.classList.add("on-hit-layer");
    pop.hidden = false;
    try { pop.removeAttribute("hidden"); } catch (e) {}
    pop.style.display = "block";
    var fp = $("#facility-signpost");
    if (fp) fp.classList.add("hits-paused");
    var svgF = document.querySelector("#trailhead-hit-layer .plank-hit-svg");
    if (svgF) svgF.classList.add("hits-paused");
    if (q) {
      q.value = "";
      try { q.focus({ preventScroll: true }); } catch (e) {}
    }
    paint();
    list.onclick = function (e) {
      var btn = e.target.closest("[data-facility-pick]");
      if (!btn) return;
      var id = btn.getAttribute("data-facility-pick");
      if (id.indexOf("custom:") === 0) {
        state.facility = "other";
        state.facilityCustom = id.slice(7);
      } else {
        state.facility = id;
        state.facilityCustom = null;
      }
      closeFacilityOtherPop();
      go("client-specialty", { trail: true });
    };
    if (q && !q._ampWired) {
      q._ampWired = true;
      q.addEventListener("input", paint);
    }
    var closer = $("#fac-other-close");
    if (closer && !closer._ampWired) {
      closer._ampWired = true;
      closer.addEventListener("click", closeFacilityOtherPop);
    }
  }



  /* #4 Hiring guide by territory (Randy lock). Mike CC on ALL BD leads.
     Aaron TX+CA · Brenton GA/AL/TN/KY · Zach IL/MO/IA/KS/NE · unassigned → Randy (not Kelley). */
  var BD_AARON_STATES = { TX:1, CA:1 };
  var BD_BRENTON_STATES = { GA:1, AL:1, TN:1, KY:1 };
  var BD_ZACH_STATES = { IL:1, MO:1, IA:1, KS:1, NE:1 };
  var BD_CC_ALWAYS = ["Randy Keeth", "Mike Freeman", "David Fontenot"]; /* Randy = main CC; Mike + David always copied */
  var BD_OWNER_META = {
    aaron: { id: "aaron", name: "Aaron Wagner", label: "Aaron Wagner · TX + CA", territory: "Territory · TX · CA", photo: "assets/team/aaron-wagner.jpg", role: "Hiring guide", blurb: "Texas hiring guide who partners with hospital and practice leaders \u2014 clear process, flexible solutions.", fullHtml: "<p>Aaron Wagner is a hiring guide at Adaptive Medical Partners, partnering with hospital and practice executives across Texas and beyond. His background spans healthcare recruiting and business development\u2014including earlier chapters at Rhino Medical Services and Republic Health Resources\u2014plus client-service leadership at AMP. He focuses on simplifying the recruiting process and listening first so solutions fit the organization, not a template.</p><p>Aaron\u2019s BD territory is Texas and California \u2014 hospital and practice leaders across both states.</p><p>Aaron works closely with rural and community healthcare leaders who need a clearer path to durable hires\u2014fewer wasted interviews, stronger fit, and a partner who stays in the conversation.</p><p>Aaron is married and has kids. Outside work, time with family, going out to eat, and enjoying life together are what recharge him.</p>" },
    zach: { id: "zach", name: "Zach Hamann", label: "Zach Hamann · IL/MO/IA/KS/NE", territory: "Territory · IL · MO · IA · KS · NE", photo: "assets/team/zach-hamann.jpg", role: "Hiring guide", blurb: "Came back to AMP on purpose \u2014 Senior BD who knows the climb from both sides of the rope.", fullHtml: "<p>Zach Hamann is a hiring guide and Senior Business Development Consultant at Adaptive Medical Partners, based in Fort Worth. He first served AMP earlier in his career (Client Services), then built experience at other firms\u2014including The Medicus Firm\u2014and in another industry chapter at Umano Medical. Seeing the positive shift at Adaptive, he returned as a strong re-addition to the team\u2014someone who chose the climb again because the guide culture and client craft had moved forward.</p><p>Zach\u2019s BD territory is Illinois, Missouri, Iowa, Kansas, and Nebraska \u2014 Midwest partners who need a clear high camp.</p><p>Zach partners with healthcare organizations to set the high camp: clearer briefs, better process, and searches that respect both the facility and the candidates who will live the week.</p><p>Zach is married and has children. Family is central outside work.</p>" },
    brenton: { id: "brenton", name: "Brenton McMahan", label: "Brenton McMahan · GA/AL/TN/KY", territory: "Territory · GA · AL · TN · KY", photo: "assets/team/brenton-mcmahan.jpg", role: "Hiring guide", blurb: "Client-first guide for the Southeast \u2014 listens hard, delivers solutions, and keeps the high camp ready.", fullHtml: "<p>Brenton McMahan is a hiring guide at Adaptive Medical Partners and serves as Senior Client Success Manager. He has been with AMP for several years and was promoted in 2025 after building trust with partners across the Southeast. His rise is rooted in a simple rule: put the client first\u2014listen, respond, and deliver real solutions that move a hard search forward.</p><p>Brenton\u2019s BD territory is Georgia, Alabama, Tennessee, and Kentucky \u2014 the Southeast corridor he covers day to day.</p><p>Before AMP, Brenton\u2019s path included client-facing and business-development work (including Aston Carter and Fusion 4 Branding), which sharpened an entrepreneurial, practical style. He brings that same energy to rural and community healthcare partnerships.</p><p>Brenton is single. Outside work he enjoys the outdoors, going out to eat, and the kind of strong, grounded upbringing that shows up in how he shows up for clients.</p>" },
    randy: { id: "randy", name: "Randy Keeth", label: "Randy Keeth · National BD · unassigned states", territory: "National BD · unassigned states", photo: "assets/team/randy-keeth.jpg", role: "Managing Partner, Business Development", blurb: "Client-first BD for rural partners \u2014 trusted relationships, faster fills, and a brief candidates can trust.", fullHtml: "<p>Randy Keeth is Managing Partner, Business Development at Adaptive Medical Partners. He brings over twenty years of healthcare staffing leadership and numerous production awards to AMP\u2019s client partnerships. His client-first mindset helps rural healthcare organizations reduce time-to-fill while building trusted, lasting relationships.</p><p>Randy partners across AMP\u2019s BD territories and is copied on every hiring-guide lead so the high camp stays coordinated.</p><p>A University of Texas at Arlington graduate, Randy\u2019s strategic approach and relationship-building have made him widely recognized in the industry. He joined AMP in 2011, a year after the firm was founded, and has held senior leadership roles across the company\u2019s growth. Based in Arlington, Texas, he enjoys working out and home projects when he is not serving AMP\u2019s clients.</p><p>Randy is married and has a teenage son.</p>" }
  };
  function resolveBdOwner(stateCode) {
    var st = String(stateCode || "").toUpperCase().trim();
    if (!st) return null;
    if (BD_AARON_STATES[st]) return BD_OWNER_META.aaron;
    if (BD_BRENTON_STATES[st]) return BD_OWNER_META.brenton;
    if (BD_ZACH_STATES[st]) return BD_OWNER_META.zach;
    return BD_OWNER_META.randy;
  }
  function syncClientBdRoutePreview() {
    var sel = $("#client-meeting-state");
    var chip = $("#client-bd-owner-chip");
    var note = $("#client-bd-route-note");
    if (!sel || !chip) return;
    var owner = resolveBdOwner(sel.value);
    if (!owner) {
      chip.innerHTML = '<span class="dot"></span> Pick a state';
      if (note) note.textContent = "We will connect you with the right hiring guide for your state.";
      return;
    }
    chip.innerHTML = '<span class="dot"></span> ' + owner.label;
    if (note) {
      note.textContent = owner.id === "randy"
        ? "Unassigned state · Randy owns · main CC Randy · also Mike · David"
        : "Hiring guide · main CC Randy · also Mike · David";
    }
  }


  function clientSpecLabel(id) {
    if (!id) return "";
    if (String(id).indexOf("custom:") === 0) return String(id).slice(7);
    try {
      var hit = (AMP_CONTENT.specialties || []).find(function (s) { return s.id === id; });
      if (hit) return hit.label;
    } catch (e) {}
    return id;
  }

  function syncClientSpecialtyCompat() {
    var list = Array.isArray(state.clientSpecialties) ? state.clientSpecialties.slice() : [];
    state.clientSpecialties = list;
    var first = list[0] || null;
    state.clientSpecialty = first;
    if (first && String(first).indexOf("custom:") === 0) {
      state.clientSpecialtyCustom = String(first).slice(7);
    } else if (!list.some(function (x) { return String(x).indexOf("custom:") === 0; })) {
      state.clientSpecialtyCustom = null;
    }
  }


  function isClientSpecMultiMode() {
    var box = $("#client-spec-multi");
    return !!(box && box.checked);
  }

  function wireClientSpecMultiToggle() {
    var box = $("#client-spec-multi");
    var hint = $("#client-spec-hint");
    if (!box) return;
    if (box.getAttribute("data-bound-hire") === "1") return;
    box.setAttribute("data-bound-hire", "1");
    function syncHint() {
      var on = !!box.checked;
      var sheet = document.querySelector('[data-route="client-specialty"]');
      if (sheet) sheet.classList.toggle("is-multi", on);
      if (hint) {
        hint.textContent = on
          ? "Tap specialties to select, then Continue below."
          : "Tap a specialty to continue. Need more than one? Turn on multi-select first.";
      }
      var contWrap = document.querySelector(".client-spec-continue-wrap");
      if (contWrap) contWrap.style.display = on ? "" : "none";
      paintClientSpecSelection();
    }
    box.addEventListener("change", syncHint);
    syncHint();
  }

  function paintClientSpecSelection() {
    refreshClientSignSpecIds();
    if (!Array.isArray(state.clientSpecialties)) state.clientSpecialties = [];
    var set = {};
    state.clientSpecialties.forEach(function (id) { set[id] = true; });
    document.querySelectorAll('[data-route="client-specialty"] [data-client-spec]').forEach(function (btn) {
      var id = (btn.getAttribute("data-client-spec") || "").trim();
      if (id === "other") {
        var extras = state.clientSpecialties.filter(function (x) {
          return CLIENT_SIGN_SPEC_IDS.indexOf(x) < 0 || String(x).indexOf("custom:") === 0;
        });
        var on = extras.length > 0;
        btn.classList.toggle("is-selected", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        var hs = btn.querySelector(".hire-select");
        if (hs) hs.textContent = on ? ("Selected · " + extras.length) : "Browse more";
        return;
      }
      var on = !!set[id];
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var hs = btn.querySelector(".hire-select");
      if (hs) hs.textContent = on ? "Selected ✓" : (isClientSpecMultiMode() ? "Select" : "Select →");
    });
    var extra = $("#client-spec-extra");
    if (extra) {
      var more = state.clientSpecialties.filter(function (x) {
        return CLIENT_SIGN_SPEC_IDS.indexOf(x) < 0 || String(x).indexOf("custom:") === 0;
      });
      if (more.length) {
        extra.hidden = false;
        extra.innerHTML = "Also selected: " + more.map(function (id) {
          return '<span class="chip">' + clientSpecLabel(id) + "</span>";
        }).join("");
      } else {
        extra.hidden = true;
        extra.innerHTML = "";
      }
    }
    var cont = $("#client-spec-continue");
    if (cont) {
      var n = state.clientSpecialties.length;
      cont.disabled = n < 1;
      cont.textContent = n < 1
        ? "Select at least one specialty"
        : (n === 1 ? "Continue with 1 specialty →" : ("Continue with " + n + " specialties →"));
    }
  }

  function toggleClientSpecialty(id) {
    if (!id || id === "other") return;
    if (!Array.isArray(state.clientSpecialties)) state.clientSpecialties = [];
    var i = state.clientSpecialties.indexOf(id);
    if (i >= 0) state.clientSpecialties.splice(i, 1);
    else state.clientSpecialties.push(id);
    syncClientSpecialtyCompat();
    paintClientSpecSelection();
  }

  function continueClientSpecialties() {
    syncClientSpecialtyCompat();
    if (!state.clientSpecialties.length) return;
    if (!state.facility) state.facility = "fqhc";
    try { closeClientSpecOtherPop(); } catch (err) {}
    go("client-region", { trail: true });
  }

  function bindClientHireSheetClicks() {
    document.querySelectorAll('[data-route="client-specialty"] [data-client-spec]').forEach(function (btn) {
      if (btn.getAttribute("data-bound-hire") === "1") return;
      btn.setAttribute("data-bound-hire", "1");
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var csid = (btn.getAttribute("data-client-spec") || "").trim();
        if (!csid) return;
        if (csid === "other") {
          openClientSpecOtherPop();
          return;
        }
        var multi = isClientSpecMultiMode();
        if (multi) {
          toggleClientSpecialty(csid);
          return;
        }
        /* Smooth single-select: set this specialty and continue */
        state.clientSpecialties = [csid];
        syncClientSpecialtyCompat();
        paintClientSpecSelection();
        continueClientSpecialties();
      }, true);
    });
    var cont = $("#client-spec-continue");
    if (cont && cont.getAttribute("data-bound-hire") !== "1") {
      cont.setAttribute("data-bound-hire", "1");
      cont.addEventListener("click", function (ev) {
        ev.preventDefault();
        continueClientSpecialties();
      });
    }
  }


  function statesForRegionId(regionId) {
    try {
      var hit = (AMP_CONTENT.regions || []).find(function (r) { return r.id === regionId; });
      return (hit && hit.states) ? hit.states.slice() : [];
    } catch (e) { return []; }
  }

  function paintClientGuideReveal(stateCode) {
    var reveal = $("#client-guide-reveal");
    var cont = $("#client-region-continue");
    var owner = resolveBdOwner(stateCode);
    if (!reveal || !owner) {
      if (reveal) {
        reveal.hidden = false;
        reveal.classList.add("is-empty");
      }
      if (cont) {
        cont.disabled = true;
        cont.textContent = "Pick a state to continue";
      }
      return;
    }
    reveal.hidden = false;
    reveal.classList.remove("is-empty");
    var img = $("#client-guide-photo");
    var nameEl = $("#client-guide-name");
    var roleEl = $("#client-guide-role");
    var terr = $("#client-guide-territory");
    var blurb = $("#client-guide-blurb");
    var fullBody = $("#client-guide-full-body");
    var fullDet = $("#client-guide-full");
    var note = $("#client-guide-note");
    var talk = $("#client-guide-talk");
    var scriptEl = document.querySelector('script[src*="app.js?v="]');
    var v = scriptEl && (scriptEl.src.match(/[?&]v=(\d+)/) || [])[1] || "";
    if (img) {
      img.src = owner.photo + (v ? ("?v=" + v) : "");
      img.alt = owner.name;
    }
    if (nameEl) nameEl.textContent = owner.name;
    if (roleEl) roleEl.textContent = owner.role || "Hiring guide";
    if (terr) terr.textContent = owner.territory || "";
    if (blurb) blurb.textContent = owner.blurb || "";
    if (fullBody) fullBody.innerHTML = owner.fullHtml || ("<p>" + (owner.blurb || "") + "</p>");
    if (fullDet) fullDet.open = false;
    if (note) note.textContent = "Main CC Randy · also Mike · David";
    if (talk) {
      talk.setAttribute("data-go", "client-meeting");
      talk.setAttribute("data-trail", "1");
    }
    if (cont) {
      cont.disabled = false;
      cont.textContent = "Continue with " + owner.name.split(" ")[0] + " →";
    }
    state.clientBd = {
      state: String(stateCode).toUpperCase(),
      region: state.clientRegion || null,
      ownerId: owner.id,
      ownerName: owner.name,
      ownerLabel: owner.label,
      cc: BD_CC_ALWAYS
    };
    state.clientState = String(stateCode).toUpperCase();
    try { stampConciergePath("client-region"); } catch (e) {}
  }

  function renderClientRegion() {
    var facLine = $("#client-region-fac-line");
    if (facLine) {
      var bits = [];
      try {
        var fac = (AMP_CONTENT.facilities || []).find(function (f) { return f.id === state.facility; });
        if (fac) bits.push(fac.label);
      } catch (e) {}
      if (state.clientSpecialties && state.clientSpecialties.length) {
        bits.push(state.clientSpecialties.map(clientSpecLabel).filter(Boolean).join(", "));
      } else if (state.clientSpecialty) {
        bits.push(clientSpecLabel(state.clientSpecialty));
      }
      facLine.textContent = bits.length ? bits.join(" · ") : "";
    }

    var root = $("#client-region-grid");
    var statesWrap = $("#client-region-states");
    var chips = $("#client-state-chips");
    var reveal = $("#client-guide-reveal");
    var cont = $("#client-region-continue");

    function showStates(regionId) {
      state.clientRegion = regionId;
      var list = regionId === "open" ? [] : statesForRegionId(regionId);
      if (!statesWrap || !chips) return;
      statesWrap.hidden = false;
      if (!list.length) {
        var all = [];
        try {
          (AMP_CONTENT.regions || []).forEach(function (r) {
            (r.states || []).forEach(function (st) { if (all.indexOf(st) < 0) all.push(st); });
          });
        } catch (e) {}
        all.sort();
        list = all;
      }
      chips.classList.add("is-swapping");
      window.requestAnimationFrame(function () {
        chips.innerHTML = list.map(function (st) {
          var on = state.clientState === st ? " is-selected" : "";
          return '<button type="button" class="client-state-chip' + on + '" data-client-state="' + st + '">' + st + "</button>";
        }).join("");
        chips.classList.remove("is-swapping");
      });
      if (state.clientState && list.indexOf(state.clientState) < 0) {
        state.clientState = null;
      }
      if (state.clientState) paintClientGuideReveal(state.clientState);
      else {
        if (reveal) {
          reveal.hidden = false;
          reveal.classList.add("is-empty");
        }
        if (cont) {
          cont.disabled = true;
          cont.textContent = "Pick a state to continue";
        }
      }
    }

    if (root) {
      renderRegionMap(root, {
        selected: state.clientRegion ? [state.clientRegion] : [],
        clientMode: true,
        calm: true,
        onToggle: function (rid) {
          if (rid === "open") {
            /* Open = all states, still one territory pick */
          }
          if (state.clientRegion === rid) {
            showStates(rid);
            return;
          }
          state.clientRegion = rid;
          state.clientState = null; /* clear state when region changes */
          state.regions = [rid];
          renderRegionMap(root, { selected: [rid], clientMode: true, calm: true });
          showStates(rid);
        }
      });
    }

    if (state.clientRegion) showStates(state.clientRegion);
    else {
      if (statesWrap) {
        statesWrap.hidden = false; /* keep slot so layout does not jump */
        if (chips) chips.innerHTML = '<span class="muted" style="font-size:13px">Tap a region on the map first.</span>';
      }
      if (reveal) {
        reveal.hidden = false;
        reveal.classList.add("is-empty");
      }
      if (cont) {
        cont.disabled = true;
        cont.textContent = "Pick a state to continue";
      }
    }

    if (chips && chips.getAttribute("data-bound-client-region") !== "1") {
      chips.setAttribute("data-bound-client-region", "1");
      chips.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("[data-client-state]") : null;
        if (!btn) return;
        var st = btn.getAttribute("data-client-state");
        state.clientState = st;
        chips.querySelectorAll("[data-client-state]").forEach(function (b) {
          b.classList.toggle("is-selected", b.getAttribute("data-client-state") === st);
        });
        paintClientGuideReveal(st);
      });
    }

    if (cont && cont.getAttribute("data-bound-client-region") !== "1") {
      cont.setAttribute("data-bound-client-region", "1");
      cont.addEventListener("click", function (ev) {
        ev.preventDefault();
        if (!state.clientState || !state.clientBd) return;
        var sel = $("#client-meeting-state");
        if (sel) {
          sel.value = state.clientState;
          try { syncClientBdRoutePreview(); } catch (err) {}
        }
        go("client-retained", { trail: true });
      });
    }
  }

  function renderClientSpecialty() {
    refreshClientSignSpecIds();
    var label = $("#client-spec-fac-label");
    var fac = null;
    try {
      fac = AMP_CONTENT.facilities.find(function (f) { return f.id === state.facility; });
    } catch (e) {}
    var name = (state.facility === "other" && state.facilityCustom)
      ? state.facilityCustom
      : (fac && fac.label) || "your facility";
    if (label) label.textContent = "Facility · " + name;
    if (!Array.isArray(state.clientSpecialties)) state.clientSpecialties = [];
    if (state.clientSpecialty && state.clientSpecialties.indexOf(state.clientSpecialty) < 0) {
      state.clientSpecialties = [state.clientSpecialty];
    }
    var ranks = clientSpecRanksForFacility();
    var TOP_N = 4; /* keep sheet scannable — rest under More */
    var top = ranks.slice(0, TOP_N);
    var more = ranks.slice(TOP_N);
    var list = $("#client-spec-cards");
    if (list) {
      function cardHtml(s) {
        return '<button type="button" class="hire-card" data-client-spec="' + s.id + '" aria-pressed="false">' +
          "<h3>" + s.label + "</h3><p>" + (s.blurb || "") + "</p>" +
          '<span class="hire-select">Select →</span></button>';
      }
      var html = top.map(cardHtml).join("");
      if (more.length) {
        html += '<details class="client-spec-more">' +
          "<summary>More common for this facility <span class=\"muted\">(" + more.length + ")</span></summary>" +
          '<div class="client-spec-more-list">' + more.map(cardHtml).join("") + "</div></details>";
      }
      html += '<button type="button" class="hire-card hire-card-other" data-client-spec="other" aria-pressed="false">' +
        "<h3>Other</h3><p>Search every specialty — or type your own.</p>" +
        '<span class="hire-select">Browse all →</span></button>';
      list.innerHTML = html;
      list.querySelectorAll("[data-client-spec]").forEach(function (btn) {
        btn.removeAttribute("data-bound-hire");
      });
    }
    var grid = $("#client-spec-grid");
    if (grid) {
      grid.innerHTML = ranks.map(function (s) {
        return '<button type="button" class="card client-spec-card" data-client-spec="' + s.id + '">' +
          "<h3>" + s.label + "</h3><p>" + (s.blurb || "") + "</p></button>";
      }).join("");
    }
    bindClientHireSheetClicks();
    wireClientSpecMultiToggle();
    paintClientSpecSelection();
  }


  /* amp-build:2059-other-pop-select-advance — close was missing; pick threw and funnel stuck */
  function closeClientSpecOtherPop() {
    var pop = $("#client-spec-other-pop");
    if (!pop) return;
    pop.hidden = true;
    try { pop.setAttribute("hidden", ""); } catch (e) {}
    pop.style.display = "";
  }

  function openClientSpecOtherPop() {
    refreshClientSignSpecIds();
    var pop = $("#client-spec-other-pop");
    var list = $("#client-spec-other-list");
    var q = $("#client-spec-other-q");
    if (!pop || !list || !window.AMP_CONTENT) return;
    var plankIds = {};
    CLIENT_SIGN_SPEC_IDS.forEach(function (id) { if (id !== "other") plankIds[id] = true; });
    function paint() {
      var needle = (q && q.value ? q.value : "").trim().toLowerCase();
      var rows = AMP_CONTENT.specialties.filter(function (s) {
        if (s.id === "other") return false;
        if (plankIds[s.id]) return false;
        if (!needle) return true;
        return String(s.label).toLowerCase().indexOf(needle) >= 0;
      });
      if (needle) {
        rows = rows.concat([{ id: "custom:" + needle, label: "Use “" + q.value.trim() + "”" }]);
      }
      list.innerHTML = rows.map(function (s) {
        return '<button type="button" data-client-spec-pick="' + s.id + '">' + s.label + '</button>';
      }).join("") || '<div class="muted" style="font-size:12px;padding:8px">No matches — type a specialty name.</div>';
    }
    pop.hidden = false;
    if (q) { q.value = ""; q.focus(); }
    paint();
    list.onclick = function (e) {
      /* amp-build:2059 — restore advance after Other pick (closeClientSpecOtherPop was missing) */
      var raw = e.target;
      if (raw && raw.nodeType === 3) raw = raw.parentElement;
      if (!raw || typeof raw.closest !== "function") return;
      var btn = raw.closest("[data-client-spec-pick]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var id = (btn.getAttribute("data-client-spec-pick") || "").trim();
      if (!id) return;
      if (!Array.isArray(state.clientSpecialties)) state.clientSpecialties = [];
      if (isClientSpecMultiMode()) {
        if (state.clientSpecialties.indexOf(id) < 0) state.clientSpecialties.push(id);
        syncClientSpecialtyCompat();
        try { closeClientSpecOtherPop(); } catch (err) {}
        paintClientSpecSelection();
      } else {
        state.clientSpecialties = [id];
        syncClientSpecialtyCompat();
        try { closeClientSpecOtherPop(); } catch (err) {}
        paintClientSpecSelection();
        continueClientSpecialties();
      }
    };
    if (q && !q._ampWired) {
      q._ampWired = true;
      q.addEventListener("input", paint);
    }
    var closer = $("#client-spec-other-close");
    if (closer && !closer._ampWired) {
      closer._ampWired = true;
      closer.addEventListener("click", closeClientSpecOtherPop);
    }
  }

  function isRankTrackVertical() {
    return !!(window.matchMedia && window.matchMedia("(max-width: 720px)").matches);
  }

  function updateRankOrientationCopy() {
    var mobile = isRankTrackVertical();
    var howto = $("#rank-howto");
    var hint = $("#rank-hint");
    var grid = $("#rank-grid");
    if (howto) {
      howto.innerHTML = mobile
        ? "<strong>Do this:</strong> put your #1 on the top. Drag a card, or tap two to swap. Then hit Continue."
        : "<strong>Do this:</strong> put your #1 on the left. Drag a card, or tap two to swap. Then hit Continue.";
    }
    if (hint) {
      hint.textContent = mobile
        ? "Top = most · Bottom = least · Glow shows where a card will land"
        : "Left = what you care about most · Right = least · Glow shows where a card will land";
    }
    if (grid) {
      grid.setAttribute(
        "aria-label",
        mobile
          ? "Rank top to bottom — most important first"
          : "Rank left to right — most important first"
      );
    }
  }

  function renderRankStep() {
    var root = $("#rank-grid");
    if (!root) return;
    updateRankOrientationCopy();
    var spec = (AMP_CONTENT.specialties.find(function (s) { return s.id === state.specialty; }) || {}).label || "Your specialty";
    var label = $("#rank-spec-label");
    if (label) label.textContent = spec;
    ensureRankOrder();
    var order = state.rankOrder;
    var byId = {};
    RANK_DIMS.forEach(function (d) { byId[d.id] = d; });
    function metaFor(i) {
      if (i === 0) return "← Most important";
      if (i === 1) return "2nd";
      if (i === 2) return "3rd";
      return "Least →";
    }
    root.innerHTML = order.map(function (id, i) {
      var d = byId[id];
      if (!d) return "";
      var selected = state.rankPick === id;
      var cls = "rank-card card";
      if (selected) cls += " is-selected";
      return '<button class="' + cls + '" type="button" data-rank="' + d.id + '" draggable="true" aria-pressed="' +
        (selected ? "true" : "false") + '">' +
        '<span class="rank-num">#' + (i + 1) + '</span>' +
        '<h3>' + d.label + '</h3><p>' + d.blurb + '</p>' +
        '<div class="meta">' + metaFor(i) + '</div></button>';
    }).join("");
    var cont = $("#rank-continue");
    if (cont) cont.disabled = order.length !== 4;
  }

  function normalizeRegionState() {
    var picked = Array.isArray(state.regions) ? state.regions.slice() : [];
    if (!picked.length && state.region) picked = String(state.region).split(",").filter(Boolean);
    if (picked.indexOf("open") !== -1) picked = ["open"];
    state.regions = picked;
    /* Keep the old scalar available to integrations; multiple picks join in selection order. */
    state.region = picked.length ? picked.join(",") : null;
    return picked;
  }

  function renderRegionMap(root, opts) {
    if (!root) return;
    opts = opts || {};
    var template = document.getElementById("amp-region-map-template");
    if (!root.querySelector(".amp-region-map") && template) root.innerHTML = template.innerHTML;
    if (typeof opts.onToggle === "function") {
      root._ampRegionMapOnToggle = opts.onToggle;
      if (!root._ampRegionMapWired) {
        root._ampRegionMapWired = true;
        root.addEventListener("click", function (ev) {
          var target = ev.target && typeof ev.target.closest === "function" ? ev.target.closest("[data-region]") : null;
          if (target && root.contains(target) && root._ampRegionMapOnToggle) root._ampRegionMapOnToggle(target.getAttribute("data-region"), root);
        });
      }
    }
    var picked = opts && Array.isArray(opts.selected) ? opts.selected.slice() : normalizeRegionState();
    if (picked.indexOf("open") !== -1) picked = ["open"];
    var selected = {};
    picked.forEach(function (id) { selected[id] = true; });
    var calm = !!(opts && (opts.calm || opts.clientMode));
    var clientMode = !!(opts && opts.clientMode);
    if (clientMode) root.classList.add("is-client-region");
    else root.classList.remove("is-client-region");

    /* Client copy — hide physician Continue-to-roles chrome */
    var kicker = root.querySelector(".region-map-kicker");
    var help = root.querySelector(".region-map-help");
    var h2 = root.querySelector(".region-map-intro h2");
    if (clientMode) {
      if (kicker) kicker.textContent = "Hiring path · territory";
      if (h2) h2.textContent = "Where should we search?";
      if (help) help.textContent = "Tap one region, then pick your state below.";
    }

    var svg = root.querySelector(".amp-region-map");
    /* Plateau re-order causes jumpy maps — skip in calm/client mode */
    if (svg && !calm) {
      var stack = svg.querySelector(".map-plateau-stack");
      if (stack) {
        while (stack.firstChild) svg.appendChild(stack.firstChild);
        stack.remove();
      }
      var regions = Array.prototype.slice.call(svg.querySelectorAll(".map-region"));
      var unselectedGs = [];
      var selectedGs = [];
      regions.forEach(function (g) {
        if (selected[g.getAttribute("data-region")]) selectedGs.push(g);
        else unselectedGs.push(g);
      });
      unselectedGs.forEach(function (g) { svg.appendChild(g); });
      selectedGs.forEach(function (g) { svg.appendChild(g); });
    }
    var paint = function () {
      root.querySelectorAll(".amp-region-map [data-region], .region-open-control[data-region]").forEach(function (region) {
        var active = !!selected[region.getAttribute("data-region")];
        region.classList.toggle("is-selected", active);
        region.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };
    paint();
    var labels = {};
    AMP_CONTENT.regions.forEach(function (r) { labels[r.id] = r.label; });
    var chips = root.querySelector("#region-chips");
    if (chips) {
      if (clientMode) {
        chips.innerHTML = picked.length
          ? '<span class="region-chip">' + (labels[picked[0]] || picked[0]) + "</span>"
          : '<span class="region-chip empty">Tap a region</span>';
      } else {
        chips.innerHTML = picked.length
          ? picked.map(function (id) { return '<span class="region-chip">' + (labels[id] || id) + '</span>'; }).join("")
          : '<span class="region-chip empty">No regions yet</span>';
      }
    }
    var cont = root.querySelector("#region-continue");
    if (cont) {
      if (clientMode) cont.hidden = true;
      else cont.disabled = picked.length === 0;
    }
    var clearBtn = root.querySelector("#region-clear");
    if (clearBtn && clientMode) clearBtn.hidden = true;
  }

  function renderRegionGrid() {
    var root = $("#region-grid");
    if (!root) return;
    var spec = (AMP_CONTENT.specialties.find(function (s) { return s.id === state.specialty; }) || {}).label || "Your specialty";
    var label = $("#region-spec-label");
    if (label) label.textContent = spec;
    normalizeRegionState();
    renderRegionMap(root);
  }

  function jobSummitScore(job) {
    if (!state.rankOrder || !state.rankOrder.length) return 0;
    var summit = job.summit || {};
    var score = 0;
    state.rankOrder.forEach(function (id, i) {
      var weight = 4 - i; /* rank1=4 … rank4=1 */
      score += (summit[id] || 0) * weight;
    });
    return score;
  }

  /* Recruiter name → team photo + short blurb (from Guides page). Mike Freeman spelling locked. */
  var GUIDE_BY_NAME = {
    "Amy Myers": {
      photo: "assets/team/amy-myers.jpg",
      role: "Recruiting guide",
      blurb: "Turns a job preview into a focused, personal conversation — durable matches over rapid placements.",
      tag: "amy"
    },
    "Nate Smith": {
      photo: "assets/team/nate-smith.jpg",
      role: "Recruiting guide",
      blurb: "Helps candidates compare practice, place, and the life between shifts — relationship-first, high standards.",
      tag: "nate"
    },
    "Stephanie Youngblood": {
      photo: "assets/team/stephanie-youngblood.jpg",
      role: "Recruiting guide",
      blurb: "Listens first, then builds a clear path — administrator-minded recruiting with a thoughtful pace.",
      tag: "stephanie"
    },
    "Hadley Herrera": {
      photo: "assets/team/hadley-herrera.jpg",
      role: "Recruiting guide",
      blurb: "Finds the signal in a crowded search and keeps the candidate experience warm.",
      tag: "hadley"
    },
    "Mike Freeman": {
      photo: "assets/team/mike-freeman.jpg",
      role: "Managing Partner, Recruiting",
      blurb: "Sixteen years of physician recruiting — practitioner context, cultural fit, and a drive to build the best firm possible.",
      tag: "mike"
    }
  };

  function guideProfileForRecruiter(rec) {
    var name = (rec && rec.name) ? String(rec.name).trim() : "";
    if (name === "Michael Freeman") name = "Mike Freeman";
    var hit = GUIDE_BY_NAME[name] || null;
    return {
      name: name || "Your guide",
      photo: hit ? hit.photo : null,
      role: hit ? hit.role : "Recruiting guide",
      blurb: hit ? hit.blurb : "",
      tag: hit ? hit.tag : recruiterTagFromName(name)
    };
  }

  function recruiterTagFromName(name) {
    var n = String(name || "").trim().toLowerCase();
    if (!n) return "mike";
    if (n.indexOf("amy") === 0) return "amy";
    if (n.indexOf("nate") === 0) return "nate";
    if (n.indexOf("stephanie") === 0) return "stephanie";
    if (n.indexOf("hadley") === 0) return "hadley";
    if (n.indexOf("mike") === 0 || n.indexOf("michael") === 0) return "mike";
    return "mike";
  }

  function guideInitials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return parts.slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join("");
  }

  function guidePathStamp() {
    /* Job context wins — Concierge / Ask-a-guide trail carries specialty · code · guide */
    if (state.jobId) {
      var j = jobById(state.jobId);
      if (j) {
        var bits = [j.specialtyLabel || j.specialty, j.code];
        if (j.recruiter && j.recruiter.name) bits.push(j.recruiter.name === "Michael Freeman" ? "Mike Freeman" : j.recruiter.name);
        return bits.filter(Boolean).join(" · ");
      }
    }
    var spec = specialtyLabel();
    var picked = normalizeRegionState();
    var labels = {};
    (AMP_CONTENT.regions || []).forEach(function (r) { labels[r.id] = r.label; });
    var regions = picked.length ? picked.map(function (id) { return labels[id] || id; }) : ["Open"];
    return spec + " · " + regions.join(" · ");
  }

  function stampGuidePath() {
    var text = guidePathStamp();
    state.guidePathText = text;
    var stamp = $("#amp-guide-path-stamp");
    if (stamp) { stamp.textContent = "Your path: " + text; stamp.hidden = false; }
    return text;
  }

  /* Stamp Concierge (AMP_CHATBOT) + path trail for job / job-contact / chat with a job id. */

  function isClientFunnelRoute(route) {
    var r = String(route || "");
    return r === "client" || r.indexOf("client-") === 0 || r === "mi-lite" || r === "mi-lite-portal" || r === "mi-lite-login" || r === "mi-lite-app";
  }

  function stampConciergePath(route) {
    window.AMP_CHATBOT = window.AMP_CHATBOT || {};
    var audience = isClientFunnelRoute(route) ? "client" : null;
    if (!audience) {
      var r = String(route || "");
      if (r === "physician" || r.indexOf("physician-") === 0 || r.indexOf("job") === 0 || r === "mpc" || r === "residents") {
        audience = "candidate";
      }
    }
    if (!audience) return;
    window.AMP_CHATBOT.path = audience;
    window.AMP_CHATBOT.audience = audience;
    if (audience === "client") {
      if (state.clientSpecialty || (state.clientSpecialties && state.clientSpecialties[0])) {
        try {
          window.AMP_CHATBOT.specialty = clientSpecLabel(state.clientSpecialty || state.clientSpecialties[0]);
        } catch (e) {}
      }
      if (state.clientState) window.AMP_CHATBOT.region = state.clientState;
      else if (state.clientRegion) window.AMP_CHATBOT.region = state.clientRegion;
      if (state.clientBd && state.clientBd.ownerId) {
        window.AMP_CHATBOT.recruiter = state.clientBd.ownerId;
        window.AMP_CHATBOT.recruiterTag = state.clientBd.ownerId;
      }
    }
    if (typeof window.AMP_CHATBOT.configure === "function") {
      window.AMP_CHATBOT.configure({
        path: audience,
        audience: audience,
        specialty: window.AMP_CHATBOT.specialty || "",
        region: window.AMP_CHATBOT.region || "",
        recruiter: window.AMP_CHATBOT.recruiter || "",
        recruiterTag: window.AMP_CHATBOT.recruiterTag || ""
      });
    }
  }

  function stampJobConcierge(j) {
    if (!j) return;
    var profile = guideProfileForRecruiter(j.recruiter);
    var tag = profile.tag || "mike";
    var spec = j.specialtyLabel || j.specialty || "";
    var jobCode = j.code || "";
    stampGuidePath();
    window.AMP_CHATBOT = window.AMP_CHATBOT || {};
    window.AMP_CHATBOT.specialty = spec;
    window.AMP_CHATBOT.job = jobCode;
    window.AMP_CHATBOT.recruiter = tag;
    window.AMP_CHATBOT.recruiterTag = tag;
    if (typeof window.AMP_CHATBOT.configure === "function") {
      window.AMP_CHATBOT.configure({
        specialty: spec,
        job: jobCode,
        recruiter: tag,
        recruiterTag: tag
      });
    }
  }

  var AMP_ORG_NAME = "Adaptive Medical Partners";
  var AMP_ORG_URL = "https://adaptivemedicalpartners.com/";
  var AMP_ORG_ID = AMP_ORG_URL + "#organization";

  function jobFieldText(value) {
    return value == null ? "" : String(value).trim();
  }

  function jobFieldIsPlaceholder(value) {
    var t = jobFieldText(value);
    if (!t) return true;
    /* Live Webflow leftovers: [Rich Text Description Field Name], [Employment Type Field Name] */
    if (/^\[[^\]]+\]$/.test(t)) return true;
    if (/Field Name/i.test(t)) return true;
    return false;
  }

  function firstJobField(job, keys) {
    if (!job) return "";
    for (var i = 0; i < keys.length; i++) {
      var t = jobFieldText(job[keys[i]]);
      if (t && !jobFieldIsPlaceholder(t)) return t;
    }
    return "";
  }

  function jobPostingDescription(j) {
    var direct = firstJobField(j, ["description", "tease", "excerpt", "sub"]);
    var parts = [];
    if (direct) parts.push(direct);
    if (j && j.bullets && j.bullets.length) {
      j.bullets.forEach(function (b) {
        if (!b) return;
        var k = jobFieldText(b.k);
        var v = jobFieldText(b.v);
        if (k && jobFieldIsPlaceholder(k)) return;
        if (v && jobFieldIsPlaceholder(v)) return;
        if (k && v) parts.push(k + ": " + v);
        else if (v) parts.push(v);
      });
    }
    return parts.join("\n");
  }

  function jobPostingUrl(j) {
    var url = firstJobField(j, ["url"]);
    if (url) return url;
    var slug = firstJobField(j, ["slug"]);
    if (slug) return AMP_ORG_URL.replace(/\/$/, "") + "/job/" + slug;
    return "";
  }

  function jobPostingSalary(j) {
    /* Only structured bake fields — never parse dollar amounts from titles. */
    var raw = j && (j.baseSalary || j.salary);
    if (!raw || jobFieldIsPlaceholder(raw)) return null;
    if (typeof raw === "number" && isFinite(raw)) {
      return {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: { "@type": "QuantitativeValue", value: raw, unitText: "YEAR" }
      };
    }
    if (typeof raw === "object") {
      var value = raw.value != null ? raw.value : raw.minValue;
      if (value == null || jobFieldIsPlaceholder(value)) return null;
      var amount = {
        "@type": "MonetaryAmount",
        currency: jobFieldText(raw.currency) || "USD",
        value: {
          "@type": "QuantitativeValue",
          unitText: jobFieldText(raw.unitText) || "YEAR"
        }
      };
      if (raw.minValue != null && !jobFieldIsPlaceholder(raw.minValue)) amount.value.minValue = raw.minValue;
      if (raw.maxValue != null && !jobFieldIsPlaceholder(raw.maxValue)) amount.value.maxValue = raw.maxValue;
      if (raw.value != null && !jobFieldIsPlaceholder(raw.value)) amount.value.value = raw.value;
      if (amount.value.value == null && amount.value.minValue == null && amount.value.maxValue == null) return null;
      return amount;
    }
    return null;
  }

  function buildJobPostingJsonLd(j) {
    var title = firstJobField(j, ["title"]);
    if (!title) return null;

    var data = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: title,
      hiringOrganization: {
        "@type": "Organization",
        "@id": AMP_ORG_ID,
        name: AMP_ORG_NAME,
        url: AMP_ORG_URL,
        email: "inquire@adaptivemedicalpartners.com",
        telephone: "+1-972-441-2750"
      }
    };

    var description = jobPostingDescription(j);
    if (description) data.description = description;

    var url = jobPostingUrl(j);
    if (url) data.url = url;

    var code = firstJobField(j, ["code", "id"]);
    if (code) {
      data.identifier = {
        "@type": "PropertyValue",
        name: AMP_ORG_NAME,
        value: code
      };
    }

    var datePosted = firstJobField(j, ["datePosted", "postedAt", "publishedAt"]);
    if (datePosted) data.datePosted = datePosted;

    var employmentType = firstJobField(j, ["employmentType"]);
    if (employmentType) data.employmentType = employmentType;

    var salary = jobPostingSalary(j);
    if (salary) data.baseSalary = salary;

    var spec = firstJobField(j, ["specialtyLabel", "specialty"]);
    if (spec) data.occupationalCategory = spec;

    var city = firstJobField(j, ["city"]);
    var region = firstJobField(j, ["stateAbbr", "state"]);
    if (city || region) {
      var address = { "@type": "PostalAddress" };
      if (city) address.addressLocality = city;
      if (region) address.addressRegion = region;
      address.addressCountry = "US";
      data.jobLocation = { "@type": "Place", address: address };
    }

    return data;
  }

  function injectJobJsonLd(jsonLd) {
    var old = document.getElementById("job-jsonld");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!jsonLd) return;
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "job-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    (document.head || document.documentElement).appendChild(script);
  }

  function escapeAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function jobHeroAlt(j) {
    var spec = firstJobField(j, ["specialtyLabel"]);
    if (!spec) {
      var sid = firstJobField(j, ["specialty"]);
      if (sid && window.AMP_CONTENT && AMP_CONTENT.specialties) {
        var hit = AMP_CONTENT.specialties.find(function (s) { return s.id === sid; });
        if (hit && hit.label) spec = hit.label;
      }
      if (!spec && sid) spec = sid;
    }
    if (!spec) spec = "Physician role";
    var place = firstJobField(j, ["state"]);
    if (!place) {
      var regionId = firstJobField(j, ["region"]);
      if (regionId && window.AMP_CONTENT && AMP_CONTENT.regions) {
        var rh = AMP_CONTENT.regions.find(function (r) { return r.id === regionId; });
        if (rh && rh.label) place = rh.label;
      }
    }
    if (place) return spec + " opening in " + place;
    return spec + " opening";
  }

  function renderJobGuideAside(j) {
    var profile = guideProfileForRecruiter(j.recruiter);
    var name = profile.name;
    var avatarHtml;
    if (profile.photo) {
      avatarHtml = '<span class="guide-avatar has-photo job-guide-avatar"><img src="' + profile.photo + '?v=2105" alt="' + escapeAttr(name) + '" width="88" height="110" loading="lazy" /></span>';
    } else {
      avatarHtml = '<span class="guide-avatar job-guide-avatar" aria-hidden="true">' + guideInitials(name) + '</span>';
    }
    var blurbHtml = profile.blurb
      ? '<p class="job-guide-blurb muted">' + profile.blurb + '</p>'
      : '';
    var roleHtml = profile.role
      ? '<p class="job-guide-role muted">' + profile.role + '</p>'
      : '';
    return '<aside class="panel job-guide-aside">' +
      '<h3 style="margin:0 0 12px">Your guide</h3>' +
      '<div class="job-guide-card">' +
        avatarHtml +
        '<div class="job-guide-body">' +
          '<p class="job-guide-name">' + name + '</p>' +
          roleHtml +
          blurbHtml +
        '</div>' +
      '</div>' +
      '<p class="muted" style="margin:12px 0;font-size:13px">Your guide for ' + j.code + '</p>' +
      '<a class="btn btn-primary" style="width:100%;margin-bottom:8px" href="tel:+1' + j.recruiter.phone.replace(/-/g, "") + '">Call ' + j.recruiter.phone + '</a>' +
      '<button class="btn btn-dark" type="button" style="width:100%;margin-bottom:8px" data-chat="text">Text ' + recruiterFirstName(j.recruiter) + '</button>' +
      '<a class="btn btn-ghost" style="width:100%" href="mailto:' + j.recruiter.email + '?cc=' + encodeURIComponent(j.recruiter.cc) + '&subject=' + encodeURIComponent("Interest in " + j.code) + '">Email · CC inquire@</a>' +
      '<p class="muted mt-16" style="font-size:12px">CC always includes inquire@adaptivemedicalpartners.com so capture is never a dead end.</p>' +
    '</aside>';
  }

  function clearJobsGuideWhisper() {
    var launcher = $(".amp-guide-launcher");
    if (launcher) launcher.classList.remove("is-whisper");
  }

  function whisperJobsGuide() {
    if (state.jobWhispered) return;
    state.jobWhispered = true;
    stampGuidePath();
    var launcher = $(".amp-guide-launcher");
    if (launcher) launcher.classList.add("is-whisper");
  }

  function jobsSoftBench() {
    return "<aside class=\"jobs-soft-bench\" aria-label=\"Beyond the posted trail\"><span class=\"tag\">Beyond the posted trail</span><h3 class=\"jobs-soft-bench-title\">Posted roles are only part of the ridge.</h3><p><strong>These are the roles we post.</strong> Guides also hold matches we don’t list — quiet opportunities that never hit this shelf. If nothing here feels right, talk with a guide and keep climbing.</p><button type=\"button\" class=\"btn btn-ghost jobs-soft-bench-cta\" data-guide-whisper=\"1\">Talk to a guide <span aria-hidden=\"true\">→</span></button></aside>";
  }

  function jobsMpcEmpty() {
    var path = guidePathStamp();
    return "<article class=\"jobs-mpc-empty panel panel-glow\" aria-live=\"polite\"><span class=\"tag\">MPC · tailored search</span><h3>Nothing posted for this cut — tailor a search.</h3><p>When nothing posted fits, a recruiting guide opens a tailored search with you.</p><p class=\"jobs-path-stamp\">Your path: " + path + "</p><div class=\"btn-row\"><button type=\"button\" class=\"btn btn-primary\" data-go=\"mpc\">Tailor a search with a guide</button><button type=\"button\" class=\"btn btn-ghost\" data-guide-whisper=\"1\">Talk to a guide</button><button type=\"button\" class=\"btn btn-ghost\" data-chat=\"talk\">Talk with a guide</button></div></article>";
  }

  function renderJobsList() {
    var root = $("#jobs-grid");
    if (!root) return;
    var regions = normalizeRegionState();
    var jobs = AMP_CONTENT.jobs.filter(function (j) {
      if (state.specialty && state.specialty !== "other" && j.specialty !== state.specialty) return false;
      if (regions.length && regions.indexOf("open") === -1 && regions.indexOf(j.region) === -1) return false;
      return true;
    }).slice();
    var sortLine = $("#jobs-sort-line");
    if (!jobs.length && sortLine) { sortLine.textContent = ""; sortLine.hidden = true; }
    if (!jobs.length) {
      root.innerHTML = jobsMpcEmpty();
      whisperJobsGuide();
      return;
    }
    if (jobs.length && state.rankOrder && state.rankOrder.length) {
      jobs.sort(function (a, b) { return jobSummitScore(b) - jobSummitScore(a); });
    }
    if (sortLine) {
      if (jobs.length && state.rankOrder && state.rankOrder.length) {
        var pretty = state.rankOrder.map(function (r, i) {
          var soft = { practice: "Practice feel", life: "Life rhythm", location: "Place", income: "Income clarity" };
          return (i + 1) + ". " + (soft[r] || RANK_LABELS[r] || r);
        }).join(" · ");
        sortLine.textContent = "Sorted for your summit: " + pretty;
        sortLine.hidden = false;
      } else {
        sortLine.textContent = "";
        sortLine.hidden = true;
      }
    }
    root.innerHTML = jobs.map(function (j) {
      var jobKey = "job/" + (j.slug || j.id);
      return '<a class="card" href="' + routeToHref(jobKey) + '" data-go="' + jobKey + '" data-job="' + j.id + '">' +
        '<span class="tag">' + j.code + '</span><h3>' + j.title + '</h3><p>' + j.sub + '</p>' +
        '<div class="meta">View preview →</div></a>';
    }).join("") + (jobs.length < 8 ? jobsSoftBench() : "");
    if (jobs.length < 8 || state.jobViews >= 2) whisperJobsGuide();
  }

  
  function recruiterFirstName(rec) {
    var n = (rec && rec.name) ? String(rec.name).trim() : "";
    if (!n) return "your guide";
    return n.split(/\s+/)[0];
  }

  function jobById(id) {
    var key = String(id || "").trim();
    if (!key || !window.AMP_CONTENT || !AMP_CONTENT.jobs) return null;
    return AMP_CONTENT.jobs.find(function (j) { return j.id === key || j.slug === key; }) || null;
  }

  function clearJobJsonLd() {
    var old = document.getElementById("job-jsonld");
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function renderJobNotFound() {
    state.jobId = "";
    clearJobJsonLd();
    var root = $("#job-root");
    if (!root) return;
    var jobsHref = (typeof routeToHref === "function") ? routeToHref("physician-jobs") : "/jobs";
    root.innerHTML =
      '<article class="jobs-mpc-empty panel panel-glow job-missing" aria-live="polite">' +
        '<span class="tag">Role not found</span>' +
        '<h3>That opening isn’t posted right now.</h3>' +
        '<p>The link may be outdated, or that role may have moved. Browse current openings, or talk with a guide about a tailored search.</p>' +
        '<div class="btn-row">' +
          '<a class="btn btn-primary" href="' + jobsHref + '" data-go="physician-jobs">Browse openings</a>' +
          '<button type="button" class="btn btn-ghost" data-guide-whisper="1">Talk with a guide</button>' +
        '</div>' +
      '</article>';
  }

  function renderJob(id) {
    state.jobViews = (state.jobViews || 0) + 1;
    state.jobId = id;
    var j = jobById(id);
    var root = $("#job-root");
    if (!root) return;
    if (!j) {
      renderJobNotFound();
      return;
    }
    var bullets = j.bullets.map(function (b) {
      return "<li><strong>" + b.k + ":</strong> " + b.v + "</li>";
    }).join("");
    injectJobJsonLd(buildJobPostingJsonLd(j));
    stampJobConcierge(j);
    root.innerHTML =
      '<div class="job-layout">' +
        '<div>' +
          '<div class="job-hero"><img src="' + j.hero + '" alt="' + escapeAttr(jobHeroAlt(j)) + '"><div class="badge">Lifestyle hero · not a facility dump</div></div>' +
          '<div class="panel mt-16">' +
            '<span class="pill">' + j.code + '</span>' +
            '<h2 style="margin:10px 0 6px;font-size:26px;letter-spacing:-.03em">' + j.title + '</h2>' +
            '<p class="muted" style="margin:0 0 8px">' + j.sub + '</p>' +
            '<ul class="bullets">' + bullets + '</ul>' +
            '<p class="gate-note">Full package lives on a brief call with your guide. CME, commencement, PTO stacks, and named facility details stay for that conversation.</p>' +
            '<div class="btn-row">' +
              '<button class="btn btn-primary" type="button" data-go="job-contact" data-trail="1">Tap to Talk / Text / Email</button>' +
              '<button class="btn btn-dark" type="button" data-go="chat" data-trail="1">Talk with AMP</button>' +
            '</div>' +
            '<div class="dest-row"><span class="dest-chip mess"><span class="dot"></span> Reaches a recruiting guide</span></div>' +
          '</div>' +
        '</div>' +
        renderJobGuideAside(j) +
      '</div>';
  }

  function renderJobContact(id) {
    var j = jobById(id || state.jobId);
    if (!j) {
      state.jobId = "";
      var missingWho = $("#contact-job-who");
      if (missingWho) missingWho.textContent = "That role isn’t posted";
      var missingPhone = $("#contact-job-phone");
      if (missingPhone) {
        missingPhone.removeAttribute("href");
        missingPhone.textContent = "Browse openings";
        missingPhone.setAttribute("data-go", "physician-jobs");
      }
      var missingSms = $("#contact-job-sms");
      if (missingSms) { missingSms.removeAttribute("data-chat"); missingSms.textContent = "Talk with a guide"; missingSms.setAttribute("data-guide-whisper", "1"); }
      var missingMail = $("#contact-job-mail");
      if (missingMail) { missingMail.removeAttribute("href"); missingMail.setAttribute("data-go", "physician-jobs"); missingMail.textContent = "Browse openings"; }
      var missingRet = $("#confirm-return-job");
      if (missingRet) {
        missingRet.setAttribute("data-go", "physician-jobs");
        if (missingRet.tagName === "A") missingRet.setAttribute("href", routeToHref("physician-jobs"));
      }
      return;
    }
    state.jobId = j.id;
    stampJobConcierge(j);
    var who = $("#contact-job-who");
    var displayName = (j.recruiter && j.recruiter.name === "Michael Freeman") ? "Mike Freeman" : j.recruiter.name;
    if (who) who.textContent = displayName + " · " + j.code;
    var phone = $("#contact-job-phone");
    if (phone) {
      phone.removeAttribute("data-go");
      phone.href = "tel:+1" + j.recruiter.phone.replace(/-/g, "");
      phone.textContent = "Call " + j.recruiter.phone;
    }
    var sms = $("#contact-job-sms");
    if (sms) {
      sms.removeAttribute("href");
      sms.removeAttribute("data-guide-whisper");
      sms.setAttribute("data-chat", "text");
      sms.textContent = "Text " + recruiterFirstName(j.recruiter);
    }
    var talkBtn = document.querySelector('.chat-actions [data-chat="talk"]');
    if (talkBtn) talkBtn.textContent = "Talk to " + recruiterFirstName(j.recruiter) + " · " + j.code;

    var mail = $("#contact-job-mail");
    if (mail) {
      mail.removeAttribute("data-go");
      mail.href = "mailto:" + j.recruiter.email + "?cc=" + encodeURIComponent(j.recruiter.cc) + "&subject=" + encodeURIComponent("Interest · " + j.code);
    }
    var ret = $("#confirm-return-job");
    if (ret) {
      var retKey = "job/" + (j.slug || j.id);
      ret.setAttribute("data-go", retKey);
      if (ret.tagName === "A") ret.setAttribute("href", routeToHref(retKey));
    }
  }

  
  function renderBlogPost(slug) {
    var post = AMP_CONTENT.posts.find(function (p) { return p.slug === slug; }) || AMP_CONTENT.posts[0];
    var body = $("#blog-article-body");
    var title = $("#blog-article-title");
    var meta = $("#blog-article-meta");
    if (title) title.textContent = post.title;
    if (meta) meta.textContent = (post.byline ? "By " + post.byline + " · " : "") + "Meta description: " + post.meta;
    if (body) body.innerHTML = buildArticleHTML(post);
  }

  function buildArticleHTML(post) {
    var map = window.AMP_ARTICLES || {};
    if (map[post.slug]) return map[post.slug];
    return "<p>Article content loading…</p>";
  }

  function renderSearch() {
    var spec = $("#search-spec");
    var region = $("#search-region");
    if (spec && !spec.options.length) {
      spec.innerHTML = '<option value="">Any specialty</option>' + AMP_CONTENT.specialties.map(function (s) {
        return '<option value="' + s.id + '">' + s.label + '</option>';
      }).join("");
    }
    if (region && !region.options.length) {
      region.innerHTML = '<option value="">Any region</option>' + AMP_CONTENT.regions.map(function (r) {
        return '<option value="' + r.id + '">' + r.label + '</option>';
      }).join("");
    }
  }


  function renderMpcPortal() {
    var inv = (window.AMP_CONTENT && AMP_CONTENT.mpcInventory) || {
      profiles: 47, specialties: 12, corridors: "metro corridors"
    };
    var headline = $("#mpc-inv-headline");
    if (headline) {
      headline.textContent = inv.profiles + " redacted profiles · " + inv.specialties +
        " specialties · open to metro corridors";
    }
    var chips = $("#mpc-inv-chips");
    if (chips) {
      chips.innerHTML =
        '<span class="mpc-chip"><strong>' + inv.profiles + '</strong> redacted profiles</span>' +
        '<span class="mpc-chip"><strong>' + inv.specialties + '</strong> specialties</span>' +
        '<span class="mpc-chip"><strong>Metro</strong> corridors</span>' +
        '<span class="mpc-chip sample">Sample · not live feed</span>';
    }
    $all('input[name="mpc-access"]').forEach(function (inp) {
      inp.checked = inp.value === (state.mpcAccess || "monthly");
      var card = inp.closest(".mpc-price-card");
      if (card) {
        if (inp.checked) card.classList.add("is-selected");
        else card.classList.remove("is-selected");
      }
    });
  }

  function mpcCandidateList() {
    var list = (window.AMP_CONTENT && AMP_CONTENT.mpcCandidates) || [];
    return list.filter(function (c) {
      if (state.mpcFilterSpecialty && c.specialtyId !== state.mpcFilterSpecialty) return false;
      if (state.mpcFilterLooking && c.lookingId !== state.mpcFilterLooking) return false;
      if (state.mpcMetroOnly && !c.metroOnly) return false;
      return true;
    });
  }

  function renderMpcBrowse() {
    state.mpcUnlocked = true;
    var accessLabel = $("#mpc-browse-access-label");
    if (accessLabel) {
      accessLabel.textContent = state.mpcAccess === "per-cv"
        ? "Sample unlock · pay-per-CV example ($49/view)"
        : "Sample unlock · monthly example ($99–149/mo)";
    }
    var specSel = $("#mpc-filter-specialty");
    var lookSel = $("#mpc-filter-looking");
    if (specSel && specSel.options.length <= 1 && window.AMP_CONTENT) {
      specSel.innerHTML = '<option value="">Any specialty</option>' +
        AMP_CONTENT.specialties.filter(function (s) { return s.id !== "other"; }).map(function (s) {
          return '<option value="' + s.id + '">' + s.label + '</option>';
        }).join("");
    }
    if (lookSel && lookSel.options.length <= 1 && window.AMP_CONTENT && AMP_CONTENT.mpcLookingRegions) {
      lookSel.innerHTML = '<option value="">Any region</option>' +
        AMP_CONTENT.mpcLookingRegions.map(function (r) {
          return '<option value="' + r.id + '">' + r.label + '</option>';
        }).join("");
    }
    if (specSel) specSel.value = state.mpcFilterSpecialty || "";
    if (lookSel) lookSel.value = state.mpcFilterLooking || "";
    var metro = $("#mpc-filter-metro");
    if (metro) metro.checked = !!state.mpcMetroOnly;

    var list = mpcCandidateList();
    var count = $("#mpc-filter-count");
    if (count) {
      count.textContent = list.length + " of " +
        ((AMP_CONTENT.mpcCandidates && AMP_CONTENT.mpcCandidates.length) || 0) +
        " sample profiles shown";
    }
    var root = $("#mpc-cards");
    if (!root) return;
    if (!list.length) {
      root.innerHTML = '<div class="panel"><p class="muted mb-0">No sample profiles match these filters. Clear a filter to widen the shelf.</p></div>';
      return;
    }
    root.innerHTML = list.map(function (c) {
      return '<button type="button" class="mpc-card" data-mpc-id="' + c.id + '">' +
        '<div class="mpc-card-top">' +
          '<span class="mpc-avatar" aria-hidden="true">' + c.initials + '</span>' +
          '<span class="tag">Redacted</span>' +
        '</div>' +
        '<h3>' + c.alias + '</h3>' +
        '<p class="mpc-card-spec">' + c.specialty + '</p>' +
        '<p class="mpc-card-looking">Looking: <strong>' + c.looking + '</strong></p>' +
        '<p class="mpc-card-blur">' + c.trainingBlur + '</p>' +
        '<p class="mpc-card-tease">' + c.dossierTease + '</p>' +
        '<div class="meta">Open redacted dossier →</div>' +
      '</button>';
    }).join("");
    syncMpcSellEcho();
  }

  function syncMpcSellEcho() {
    var echo = $("#mpc-sell-echo");
    if (!echo) return;
    var chips = state.mpcAmenities || [];
    var pitch = ($("#mpc-area-pitch") && $("#mpc-area-pitch").value) || "";
    if (!chips.length && !pitch.trim()) {
      echo.textContent = "Select chips to soft-pitch your corridor.";
      return;
    }
    var parts = chips.slice();
    if (pitch.trim()) parts.push('"' + pitch.trim().slice(0, 80) + (pitch.trim().length > 80 ? "…" : "") + '"');
    echo.textContent = "Your soft pitch: " + parts.join(" · ") + " — preview only, not sent.";
  }

  function openMpcDrawer(id) {
    var c = ((window.AMP_CONTENT && AMP_CONTENT.mpcCandidates) || []).find(function (x) {
      return x.id === id;
    });
    if (!c) return;
    state.mpcSelectedId = id;
    var drawer = $("#mpc-drawer");
    var body = $("#mpc-drawer-body");
    if (!drawer || !body) return;
    var sections = (c.sections || []).map(function (s) {
      var redacted = /█|redacted/i.test(s.value);
      return '<div class="mpc-dossier-row' + (redacted ? " is-redacted" : "") + '">' +
        '<span class="k">' + s.label + '</span>' +
        '<span class="v">' + s.value + '</span></div>';
    }).join("");
    body.innerHTML =
      '<span class="tag">Redacted dossier · sample</span>' +
      '<h2 id="mpc-drawer-title" class="mt-0">' + c.alias + ' · ' + c.initials + '</h2>' +
      '<p class="mpc-card-spec">' + c.specialty + ' · Looking: <strong>' + c.looking + '</strong></p>' +
      '<div class="mpc-dossier-block">' +
        '<h4>Dossier (blurred)</h4>' +
        sections +
        '<div class="mpc-blur-band" aria-hidden="true">████████ · ████ · ██████ · contact gated</div>' +
      '</div>' +
      '<div class="mpc-cv-stub panel">' +
        '<h4 class="mt-0">CV stub</h4>' +
        '<p class="muted mb-0">' + c.cvStub + '</p>' +
        '<p class="mpc-card-blur" style="margin-top:8px">' + c.trainingBlur + '</p>' +
      '</div>' +
      '<div class="btn-row mt-16">' +
        '<button type="button" class="btn btn-primary" data-mpc-intro="1">Request intro</button>' +
        '<button type="button" class="btn btn-dark" data-mpc-full="1">Unlock full access</button>' +
      '</div>' +
      '<p class="muted proof-note" id="mpc-drawer-toast">Sample actions — a guide would follow up. No PII shown.</p>';
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("mpc-drawer-open");
  }

  function closeMpcDrawer() {
    var drawer = $("#mpc-drawer");
    if (!drawer) return;
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mpc-drawer-open");
    state.mpcSelectedId = null;
  }

  function sampleBrowseGeo() {
    /* Illustrative only — live site would IP→geo on submit. */
    if (state.browseGeo) return state.browseGeo;
    var samples = [
      "Dallas–Fort Worth, TX · approx. from IP",
      "Chicago metro, IL · approx. from IP",
      "Phoenix metro, AZ · approx. from IP",
      "Tampa–St. Pete, FL · approx. from IP"
    ];
    state.browseGeo = samples[Math.floor(Math.random() * samples.length)] + " · sample";
    return state.browseGeo;
  }

  var RANK_LABELS = {
    practice: "Practice",
    life: "Life",
    location: "Location",
    income: "Income"
  };

  var RANK_DIMS = [
    { id: "practice", label: "Practice feel", blurb: "How the week runs on the ridge — clinic pace, team, call." },
    { id: "life", label: "Life rhythm", blurb: "Room outside clinic — evenings, weekends, the trail home." },
    { id: "location", label: "Place", blurb: "Where you live and what the community feels like." },
    { id: "income", label: "Income clarity", blurb: "Package clarity — band, structure, what lands on the call." }
  ];

  var rankDragId = null;
  var rankJustDragged = false;

  function defaultRankOrder() {
    return RANK_DIMS.map(function (d) { return d.id; });
  }

  function ensureRankOrder() {
    var ids = defaultRankOrder();
    if (!state.rankOrder || state.rankOrder.length !== 4) {
      state.rankOrder = ids.slice();
      return state.rankOrder;
    }
    var ok = ids.every(function (id) { return state.rankOrder.indexOf(id) >= 0; });
    if (!ok) state.rankOrder = ids.slice();
    return state.rankOrder;
  }

  function clearRankDropHints(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".rank-card.is-drop-target, .rank-card.is-drop-before, .rank-card.is-drop-after, .rank-card.is-drop-swap"), function (el) {
      el.classList.remove("is-drop-target", "is-drop-before", "is-drop-after", "is-drop-swap");
    });
  }

  function pulseRankSettle(ids) {
    var root = $("#rank-grid");
    if (!root || !ids || !ids.length) return;
    var list = ids.filter(Boolean);
    /* Re-apply after innerHTML wipe so the eye sees the card land. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        list.forEach(function (id) {
          var el = root.querySelector('[data-rank="' + id + '"]');
          if (!el) return;
          el.classList.remove("is-just-dropped");
          void el.offsetWidth;
          el.classList.add("is-just-dropped");
          setTimeout(function () {
            el.classList.remove("is-just-dropped");
          }, 720);
        });
      });
    });
  }

  function bindRankDnD() {
    var root = $("#rank-grid");
    if (!root || root.getAttribute("data-rank-dnd") === "1") return;
    root.setAttribute("data-rank-dnd", "1");
    var rankDropAfter = false;

    root.addEventListener("dragstart", function (e) {
      var card = e.target && e.target.closest ? e.target.closest("[data-rank]") : null;
      if (!card) return;
      rankDragId = card.getAttribute("data-rank");
      rankJustDragged = false;
      rankDropAfter = false;
      rankDropMode = "insert";
      rankDropTargetId = null;
      card.classList.add("is-dragging");
      root.classList.add("is-dragging-active");
      try {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", rankDragId || "");
      } catch (err) {}
    });

    /* Drop ALWAYS trusts the last cue — never recompute from drop clientX.
       Over a card = SWAP with that card (matches "I put it on Life rhythm").
       In a gap / past ends = insert before/after with the green bar. */
    var rankDropTargetId = null;
    var rankDropMode = "insert"; /* insert | swap */

    function rankHoverMeta(clientX, clientY) {
      var cards = Array.prototype.slice.call(root.querySelectorAll("[data-rank]"));
      var others = cards.filter(function (c) {
        return c.getAttribute("data-rank") !== rankDragId;
      });
      if (!others.length) return null;
      var vertical = isRankTrackVertical();

      function pack(el, after, mode) {
        return {
          el: el,
          after: !!after,
          id: el.getAttribute("data-rank"),
          mode: mode || "insert"
        };
      }

      var i, r, el;
      for (i = 0; i < others.length; i++) {
        el = others[i];
        r = el.getBoundingClientRect();
        if (vertical) {
          if (clientY >= r.top && clientY <= r.bottom) {
            /* Mobile column: Y vs midY → insert before/after (top/bottom drop bars). */
            return pack(el, clientY > ((r.top + r.bottom) / 2), "insert");
          }
        } else if (clientX >= r.left && clientX <= r.right) {
          return pack(el, false, "swap");
        }
      }

      var first = others[0];
      var last = others[others.length - 1];
      var fr = first.getBoundingClientRect();
      var lr = last.getBoundingClientRect();
      if (vertical) {
        if (clientY < fr.top) return pack(first, false, "insert");
        if (clientY > lr.bottom) return pack(last, true, "insert");
        for (i = 0; i < others.length - 1; i++) {
          var aV = others[i];
          var bV = others[i + 1];
          var arV = aV.getBoundingClientRect();
          var brV = bV.getBoundingClientRect();
          if (clientY > arV.bottom && clientY < brV.top) {
            var midY = (arV.bottom + brV.top) / 2;
            return clientY < midY ? pack(aV, true, "insert") : pack(bV, false, "insert");
          }
        }
        return pack(last, true, "insert");
      }

      if (clientX < fr.left) return pack(first, false, "insert");
      if (clientX > lr.right) return pack(last, true, "insert");

      for (i = 0; i < others.length - 1; i++) {
        var a = others[i];
        var b = others[i + 1];
        var ar = a.getBoundingClientRect();
        var br = b.getBoundingClientRect();
        if (clientX > ar.right && clientX < br.left) {
          var mid = (ar.right + br.left) / 2;
          return clientX < mid ? pack(a, true, "insert") : pack(b, false, "insert");
        }
      }
      return pack(last, true, "insert");
    }

    root.addEventListener("dragover", function (e) {
      e.preventDefault();
      try { e.dataTransfer.dropEffect = "move"; } catch (err) {}
      clearRankDropHints(root);
      if (!rankDragId) return;
      var meta = rankHoverMeta(e.clientX, e.clientY);
      if (!meta) return;
      rankDropAfter = meta.after;
      rankDropTargetId = meta.id;
      rankDropMode = meta.mode || "insert";
      meta.el.classList.add("is-drop-target");
      if (rankDropMode === "insert") {
        meta.el.classList.add(meta.after ? "is-drop-after" : "is-drop-before");
      } else {
        meta.el.classList.add("is-drop-swap");
      }
    });

    root.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!rankDragId || !rankDropTargetId) return;
      var targetId = rankDropTargetId;
      var insertAfter = rankDropAfter;
      var mode = rankDropMode || "insert";
      if (!targetId || targetId === rankDragId) return;
      ensureRankOrder();
      var order = state.rankOrder.slice();
      var from = order.indexOf(rankDragId);
      var to = order.indexOf(targetId);
      if (from < 0 || to < 0) return;
      if (mode === "swap") {
        var tmp = order[from];
        order[from] = order[to];
        order[to] = tmp;
      } else {
        order.splice(from, 1);
        to = order.indexOf(targetId);
        if (to < 0) return;
        var insertAt = insertAfter ? to + 1 : to;
        order.splice(insertAt, 0, rankDragId);
      }
      state.rankOrder = order;
      state.rankPick = null;
      rankJustDragged = true;
      var movedId = rankDragId;
      var otherId = targetId;
      rankDropTargetId = null;
      rankDropMode = "insert";
      renderRankStep();
      pulseRankSettle(mode === "swap" ? [movedId, otherId] : [movedId]);
    });

    root.addEventListener("dragend", function () {
      rankDragId = null;
      rankDropAfter = false;
      rankDropTargetId = null;
      rankDropMode = "insert";
      root.classList.remove("is-dragging-active");
      clearRankDropHints(root);
      Array.prototype.forEach.call(root.querySelectorAll(".rank-card.is-dragging"), function (el) {
        el.classList.remove("is-dragging");
      });
      /* Keep rankJustDragged true through the synthetic click; clear shortly after. */
      setTimeout(function () { rankJustDragged = false; }, 50);
    });
  }

  function sampleRankLine() {
    if (state.rankOrder && state.rankOrder.length) {
      return state.rankOrder.map(function (r, i) {
        return (i + 1) + ". " + (RANK_LABELS[r] || r);
      }).join(" · ");
    }
    return "Not ranked yet · captured at apply when live";
  }

  function specialtyLabel() {
    var spec = state.specialty || "obg";
    if (window.AMP_CONTENT && AMP_CONTENT.specialties) {
      var hit = AMP_CONTENT.specialties.find(function (s) { return s.id === spec; });
      if (hit) return hit.label;
    }
    var map = { fm: "Family Medicine", obg: "Obstetrics & Gynecology", gi: "Gastroenterology", neuro: "Neurology", dental: "Dentistry", np: "Nurse Practitioner", psych: "Psychiatry", hosp: "Hospitalist", im: "Internal Medicine", other: "Other" };
    return map[spec] || String(spec).toUpperCase();
  }

  /* Soft public enrich bundle — sample rows for recruiter eye. Not live lookups. */
  function sampleEnrich(kind) {
    if (state.enrichBundle) return state.enrichBundle;
    var spec = specialtyLabel();
    var region = state.region || "midwest";
    var regionLabel = region;
    if (window.AMP_CONTENT && AMP_CONTENT.regions) {
      var rh = AMP_CONTENT.regions.find(function (r) { return r.id === region; });
      if (rh) regionLabel = rh.label;
    }
    if (kind === "client") {
      state.enrichBundle = {
        geo: sampleBrowseGeo(),
        npi: "n/a · org lead",
        license: "n/a · facility path",
        bio: "Public org site / leadership page · sample link",
        openPay: "—",
        referrer: "amp.example / hiring door · sample UTM",
        device: "Desktop · America/Chicago · sample",
        soft: "Org signals · public web hint · sample"
      };
    } else {
      state.enrichBundle = {
        geo: sampleBrowseGeo(),
        npi: "Possible NPI match · " + spec + " · sample",
        license: "License board · " + regionLabel + " · status unchecked (sample)",
        bio: "Public clinic bio / Healthgrades-style hit · sample",
        openPay: "OpenPayments · no pull yet · placeholder",
        referrer: "Job preview · utm_source=site · sample",
        device: "Mobile Safari · America/Chicago · sample",
        soft: spec + " · name+specialty public skim · phone not verified"
      };
    }
    return state.enrichBundle;
  }

  function stampMess(kind, payload) {
    var el = kind === "client" ? $("#mess-client-mock") : $("#mess-response-mock");
    if (!el) return;
    var now = new Date();
    var stamp = $("#amp-guide-path-stamp");
    var en = sampleEnrich(kind);
    var rank = sampleRankLine();
    if (kind === "client") {
      var agree = state.agreement && AGREEMENT_META[state.agreement]
        ? AGREEMENT_META[state.agreement].title
        : "Client meeting";
      el.innerHTML =
        '<div class="row"><span>Owner queue</span><span class="ok">Client lead · your team</span></div>' +
        '<div class="row"><span>Status</span><span class="ok">Captured · routed</span></div>' +
        '<div class="row"><span>When</span><span>' + stamp + '</span></div>' +
        '<div class="row"><span>Agreement</span><span class="ok">' + agree + '</span></div>' +
        '<div class="row"><span>Approx. browse location</span><span class="ok">' + en.geo + '</span></div>' +
        '<div class="row"><span>Referrer / UTM</span><span>' + en.referrer + '</span></div>' +
        '<div class="row"><span>Device / TZ</span><span>' + en.device + '</span></div>' +
        '<div class="row"><span>Soft public match</span><span>' + en.soft + '</span></div>' +
        '<div class="row"><span>Public bio hint</span><span>' + en.bio + '</span></div>' +
        '<div class="row"><span>Payload</span><span>' + (payload || "client interest") + '</span></div>' +
        '<p class="muted" style="margin:10px 0 0;font-size:11px;line-height:1.35">Sample enrich only. Live: IP geo + public org signals. Not a deep scrape.</p>';
    } else {
      el.innerHTML =
        '<div class="row"><span>Queue</span><span class="ok">Recruiter responses</span></div>' +
        '<div class="row"><span>Status</span><span class="ok">Captured · routed</span></div>' +
        '<div class="row"><span>When</span><span>' + stamp + '</span></div>' +
        '<div class="row"><span>Owner</span><span>Amy Myers (sample)</span></div>' +
        '<div class="row"><span>Quadrant rank</span><span class="ok">' + rank + '</span></div>' +
        '<div class="row"><span>Approx. browse location</span><span class="ok">' + en.geo + '</span></div>' +
        '<div class="row"><span>NPI hint</span><span class="ok">' + en.npi + '</span></div>' +
        '<div class="row"><span>License board</span><span>' + en.license + '</span></div>' +
        '<div class="row"><span>Public bio hint</span><span>' + en.bio + '</span></div>' +
        '<div class="row"><span>OpenPayments</span><span>' + en.openPay + '</span></div>' +
        '<div class="row"><span>Soft public match</span><span>' + en.soft + '</span></div>' +
        '<div class="row"><span>Referrer / UTM</span><span>' + en.referrer + '</span></div>' +
        '<div class="row"><span>Device / TZ</span><span>' + en.device + '</span></div>' +
        '<div class="row"><span>Payload</span><span>' + (payload || "interest") + '</span></div>' +
        '<p class="muted" style="margin:10px 0 0;font-size:11px;line-height:1.35">Sample enrich only. Live free stack: NPI + state board + public bio + OpenPayments optional + IP metro + UTM/device. Privacy policy on go-live.</p>';
    }
  }


  function closeGuideDock(immediate) {
    var dock = $("#amp-guide-dock");
    var toggle = $("[data-guide-toggle]");
    var root = $("#amp-guide");
    if (!dock) return;
    dock.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (root) root.classList.remove("is-open");
    if (immediate) {
      dock.hidden = true;
      return;
    }
    setTimeout(function () {
      if (!dock.classList.contains("is-open")) dock.hidden = true;
    }, 220);
  }

  function openGuideDock() {
    clearJobsGuideWhisper();
    var dock = $("#amp-guide-dock");
    var toggle = $("[data-guide-toggle]");
    var root = $("#amp-guide");
    if (!dock || !root || root.hidden) return;
    resetChatFunnel();
    dock.hidden = false;
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    window.requestAnimationFrame(function () { dock.classList.add("is-open"); });
  }

  function toggleGuideDock() {
    var dock = $("#amp-guide-dock");
    if (!dock || dock.hidden) openGuideDock();
    else closeGuideDock();
  }

    function openAmpChat() {
    function tryOpen() {
      if (window.AMP_CHATBOT && typeof window.AMP_CHATBOT.open === "function") {
        window.AMP_CHATBOT.open();
        return true;
      }
      var launch = document.querySelector(".amp-chat-launcher");
      if (launch) { launch.click(); return true; }
      return false;
    }
    if (tryOpen()) return;
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (tryOpen() || n > 40) clearInterval(t);
    }, 100);
  }

function syncGuideRoute(route) {
    try { stampConciergePath(route); } catch (e) {}
    try {
      if (typeof chatFunnel !== "undefined" && typeof isClientFunnelRoute === "function" && isClientFunnelRoute(route)) {
        chatFunnel.path = "client";
      } else if (typeof chatFunnel !== "undefined" && (route === "physician" || String(route || "").indexOf("physician-") === 0 || String(route || "").indexOf("job") === 0)) {
        chatFunnel.path = "candidate";
      }
    } catch (e2) {}
    var root = $("#amp-guide");
    if (route === "chat") {
      if (root) {
        closeGuideDock(true);
        root.hidden = true;
      }
      openAmpChat();
    } else if (root) {
      root.hidden = false;
    }
  }
  function closeMobileNav() { var drawer = $("#mobile-nav-drawer"), backdrop = $(".mobile-nav-backdrop"), toggle = $("[data-mobile-nav-toggle]"); if (drawer) drawer.hidden = true; if (backdrop) backdrop.hidden = true; if (toggle) { toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Open menu"); } }
  function openMobileNav() { var drawer = $("#mobile-nav-drawer"), backdrop = $(".mobile-nav-backdrop"), toggle = $("[data-mobile-nav-toggle]"); if (!drawer) return; drawer.hidden = false; if (backdrop) backdrop.hidden = false; if (toggle) { toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Close menu"); } var first = drawer.querySelector("a[data-go], button[data-go]"); if (first) window.setTimeout(function () { first.focus(); }, 0); }
  function toggleMobileNav() { var drawer = $("#mobile-nav-drawer"); if (drawer && drawer.hidden) openMobileNav(); else closeMobileNav(); }
  function bind() {
    bindRankDnD();
    document.body.addEventListener("click", function (e) {
      var raw = e.target;
      if (raw && raw.nodeType === 3) raw = raw.parentElement;
      if (!raw || typeof raw.closest !== "function") return;
      if (raw.closest("[data-mobile-nav-toggle]")) { toggleMobileNav(); return; }
      if (raw.closest("[data-mobile-nav-close]")) { closeMobileNav(); return; }
      if (raw.closest("[data-guide-toggle]")) { toggleGuideDock(); return; }
      var guideWhisper = raw.closest("[data-guide-whisper]");
      if (guideWhisper) { e.preventDefault(); stampGuidePath(); openAmpChat(); return; }
      if (raw.closest("[data-open-amp-chat]")) { e.preventDefault(); openAmpChat(); return; }
      if (raw.closest("[data-guide-close]")) { closeGuideDock(); return; }
      var guideRoot = $("#amp-guide");
      var guideDock = $("#amp-guide-dock");
      if (guideRoot && !guideRoot.hidden && guideDock && !guideDock.hidden && !raw.closest("#amp-guide")) closeGuideDock();
      var t = raw.closest("[data-go]");
      if (t) {
        if (t.tagName === "A") {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          var tgt = t.getAttribute("target");
          if (tgt && tgt !== "_self") return;
        }
        e.preventDefault();
        var agreeEl = raw.closest("[data-agreement]");
        if (agreeEl) {
          state.agreement = agreeEl.getAttribute("data-agreement");
          syncPickedAgreement();
        }
        if (t.closest("#mobile-nav-drawer")) closeMobileNav();
        var route = t.getAttribute("data-go");
        var trail = t.getAttribute("data-trail") === "1";
        var approach = t.getAttribute("data-approach") === "1";
        var dataHash = t.getAttribute("data-hash") || null;
        state.moving = false;
        if (route === "mpc-browse") {
          var chosen = document.querySelector('input[name="mpc-access"]:checked');
          state.mpcAccess = chosen ? chosen.value : (state.mpcAccess || "monthly");
          state.mpcUnlocked = true;
          state.agreement = state.agreement || "mpc";
        }
        if (route === "mpc-portal") {
          state.agreement = state.agreement || "mpc";
        }
        if (route === "mi-lite-app" && (t.id === "mi-lite-subscribe" || t.getAttribute("data-mi-unlock") === "1")) {
          var miPlan = document.querySelector('input[name="mi-lite-plan"]:checked');
          state.miLitePlan = normalizeMiLitePlan(miPlan ? miPlan.value : (state.miLitePlan || "region"));
          writeMiLiteUnlock(state.miLitePlan);
          if (typeof stampMess === "function") stampMess("client", "Ridge sample unlock · " + state.miLitePlan + " → a hiring guide");
        }
        go(route, { trail: trail, approach: approach, hash: dataHash });
        return;
      }
      var agreeOnly = raw.closest("[data-agreement]");
      if (agreeOnly && !agreeOnly.getAttribute("data-go")) {
        state.agreement = agreeOnly.getAttribute("data-agreement");
        syncPickedAgreement();
      }
      var skip = raw.closest("[data-skip-video]");
      if (skip) {
        if (typeof window.__ampFinishApproach === "function") {
          window.__ampFinishApproach();
          return;
        }
        settleHome();
        return;
      }

      var spec = raw.closest("[data-specialty]");
      if (spec) {
        e.preventDefault();
        e.stopPropagation();
        var sid = (spec.getAttribute("data-specialty") || "").trim();
        if (!sid) return;
        if (sid === "other") {
          openSpecialtyOtherPop();
          return;
        }
        state.specialty = sid;
        state.specialtyCustom = null;
        closeSpecialtyOtherPop();
        go("physician-rank", { trail: true });
        return;
      }
      var rankCard = raw.closest("[data-rank]");
      if (rankCard) {
        if (rankJustDragged) { rankJustDragged = false; return; }
        var rid = rankCard.getAttribute("data-rank");
        ensureRankOrder();
        if (state.rankPick && state.rankPick !== rid) {
          var a = state.rankOrder.indexOf(state.rankPick);
          var b = state.rankOrder.indexOf(rid);
          var swapped = [];
          if (a >= 0 && b >= 0) {
            var tmp = state.rankOrder[a];
            state.rankOrder[a] = state.rankOrder[b];
            state.rankOrder[b] = tmp;
            swapped = [state.rankOrder[a], state.rankOrder[b]];
          }
          state.rankPick = null;
          renderRankStep();
          if (swapped.length) pulseRankSettle(swapped);
        } else if (state.rankPick === rid) {
          state.rankPick = null;
          renderRankStep();
        } else {
          state.rankPick = rid;
          renderRankStep();
        }
        return;
      }
      if (raw.closest("#rank-reset")) {
        state.rankOrder = defaultRankOrder();
        state.rankPick = null;
        renderRankStep();
        return;
      }
      if (raw.closest("#rank-continue")) {
        ensureRankOrder();
        if (!state.rankOrder || state.rankOrder.length < 4) return;
        /* Place #1 or #2 → region plateau map; else skip to roles (rank-weighted). */
        var placeRank = state.rankOrder.indexOf("location");
        if (placeRank === 0 || placeRank === 1) {
          go("physician-region", { trail: true });
        } else {
          state.regions = ["open"];
          normalizeRegionState();
          go("physician-jobs", { trail: true });
        }
        return;
      }
      var region = raw.closest("[data-region]");
      if (region) {
        var reusableMap = raw.closest(".region-picker");
        if (reusableMap && reusableMap._ampRegionMapOnToggle) return;
        var rid = region.getAttribute("data-region");
        var picked = normalizeRegionState();
        if (rid === "open") {
          picked = ["open"];
        } else {
          var wasSelected = picked.indexOf(rid) !== -1;
          picked = picked.filter(function (id) { return id !== "open" && id !== rid; });
          if (!wasSelected) picked.push(rid);
        }
        state.regions = picked;
        normalizeRegionState();
        renderRegionMap($("#region-grid"));
        return;
      }
      if (raw.closest("#region-clear")) {
        state.regions = [];
        normalizeRegionState();
        renderRegionMap($("#region-grid"));
        return;
      }
      if (raw.closest("#region-continue")) {
        var selectedRegions = normalizeRegionState();
        if (!selectedRegions.length) return;
        go("physician-jobs", { trail: true });
        return;
      }
      var job = raw.closest("[data-job]");
      if (job) {
        state.jobId = job.getAttribute("data-job");
        go("job/" + state.jobId, { trail: true });
        return;
      }
      var fac = raw.closest("[data-facility]");
      if (fac) {
        var fid = fac.getAttribute("data-facility");
        if (fid === "other") {
          openFacilityOtherPop();
          return;
        }
        state.facility = fid;
        state.facilityCustom = null;
        closeFacilityOtherPop();
        go("client-specialty", { trail: true });
        return;
      }
      var cs = raw.closest("[data-client-spec]");
      if (cs) {
        e.preventDefault();
        e.stopPropagation();
        var csid = (cs.getAttribute("data-client-spec") || "").trim();
        if (!csid) return;
        if (csid === "other") {
          openClientSpecOtherPop();
          return;
        }
        if (isClientSpecMultiMode()) {
          toggleClientSpecialty(csid);
          return;
        }
        state.clientSpecialties = [csid];
        syncClientSpecialtyCompat();
        paintClientSpecSelection();
        continueClientSpecialties();
        return;
      }
      var blog = raw.closest("[data-blog]");
      if (blog) {
        go("blog/" + blog.getAttribute("data-blog"), { trail: false });
        return;
      }
      var chatOpt = raw.closest("[data-chat]");
      if (chatOpt) {
        if (chatOpt.closest(".jobs-mpc-empty")) stampGuidePath();
        var chatVal = chatOpt.getAttribute("data-chat");
        /* Keep dock open through door/earn steps; close only on final contact opts */
        if (chatOpt.closest("#amp-guide") && (chatVal === "talk" || chatVal === "text" || chatVal === "email" || chatVal === "other")) {
          /* close after handleChat decides */
        }
        handleChat(chatVal);
        return;
      }

      var unlockBtn = raw.closest("#mpc-unlock-btn");
      if (unlockBtn) {
        var chosen = document.querySelector('input[name="mpc-access"]:checked');
        state.mpcAccess = chosen ? chosen.value : "monthly";
        state.mpcUnlocked = true;
        /* data-go on button still fires via closest above — but unlockBtn is also data-go.
           If we reached here, data-go already returned. Keep as safety if id-only. */
      }

      var mpcCard = raw.closest("[data-mpc-id]");
      if (mpcCard) {
        openMpcDrawer(mpcCard.getAttribute("data-mpc-id"));
        return;
      }
      if (raw.closest("[data-mpc-close]")) {
        closeMpcDrawer();
        return;
      }
      var intro = raw.closest("[data-mpc-intro]");
      if (intro) {
        var toast = $("#mpc-drawer-toast");
        if (toast) toast.textContent = "Intro requested — the AMP guide team would connect you. No message sent.";
        return;
      }
      var full = raw.closest("[data-mpc-full]");
      if (full) {
        var toast2 = $("#mpc-drawer-toast");
        if (toast2) toast2.textContent = "Full access is a sample — example monthly or per-CV pricing on the gate. Nothing is charged here.";
        return;
      }
      var amenity = raw.closest("[data-amenity]");
      if (amenity) {
        var key = amenity.getAttribute("data-amenity");
        var label = amenity.textContent.trim();
        var idx = (state.mpcAmenities || []).indexOf(label);
        if (idx >= 0) {
          state.mpcAmenities.splice(idx, 1);
          amenity.classList.remove("is-on");
        } else {
          state.mpcAmenities = state.mpcAmenities || [];
          state.mpcAmenities.push(label);
          amenity.classList.add("is-on");
        }
        syncMpcSellEcho();
        return;
      }
    });

    var jobForm = $("#job-interest-form");
    if (jobForm) {
      jobForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(jobForm);
        stampMess("physician", (fd.get("name") || "Physician") + " · " + (fd.get("specialty") || state.specialty || "OB/GYN"));
        go("confirm-mess", { trail: true });
      });
    }




    var clientForm = $("#client-meeting-form");
    if (clientForm) {
      var stateSel = $("#client-meeting-state");
      if (stateSel) {
        stateSel.addEventListener("change", syncClientBdRoutePreview);
        syncClientBdRoutePreview();
      }
      clientForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(clientForm);
        if (fd.get("agreement")) state.agreement = String(fd.get("agreement"));
        var agreeLabel = state.agreement && AGREEMENT_META[state.agreement]
          ? AGREEMENT_META[state.agreement].tag
          : "Client";
        var stCode = String(fd.get("state") || "").toUpperCase();
        var owner = resolveBdOwner(stCode);
        if (!owner) {
          if (stateSel) stateSel.focus();
          return;
        }
        state.clientBd = {
          state: stCode,
          ownerId: owner.id,
          ownerName: owner.name,
          ownerLabel: owner.label,
          cc: BD_CC_ALWAYS
        };
        stampMess(
          "client",
          (fd.get("name") || "Client") + " · " + stCode + " · " + owner.name + " · " + agreeLabel + " → a hiring guide · CC Randy/Mike/David"
        );
        go("confirm-client", { trail: true });
      });
    }


    /* MPC portal: pricing cards + browse filters */
    $all('input[name="mpc-access"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        state.mpcAccess = inp.value;
        $all(".mpc-price-card").forEach(function (card) {
          var r = card.querySelector('input[name="mpc-access"]');
          if (r && r.checked) card.classList.add("is-selected");
          else card.classList.remove("is-selected");
        });
      });
    });
    var mpcSpec = $("#mpc-filter-specialty");
    if (mpcSpec) {
      mpcSpec.addEventListener("change", function () {
        state.mpcFilterSpecialty = mpcSpec.value;
        renderMpcBrowse();
      });
    }
    var mpcLook = $("#mpc-filter-looking");
    if (mpcLook) {
      mpcLook.addEventListener("change", function () {
        state.mpcFilterLooking = mpcLook.value;
        renderMpcBrowse();
      });
    }
    var mpcMetro = $("#mpc-filter-metro");
    if (mpcMetro) {
      mpcMetro.addEventListener("change", function () {
        state.mpcMetroOnly = !!mpcMetro.checked;
        renderMpcBrowse();
      });
    }
    var mpcPitch = $("#mpc-area-pitch");
    if (mpcPitch) {
      mpcPitch.addEventListener("input", syncMpcSellEcho);
    }
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { closeMpcDrawer(); closeGuideDock(); closeMobileNav(); }
      var mapRegion = ev.target && typeof ev.target.closest === "function" ? ev.target.closest(".amp-region-map [data-region]") : null;
      if (mapRegion && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        mapRegion.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    });

    var contactForm = $("#site-contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(contactForm);
        var intent = String(fd.get("intent") || "physician");
        var who = fd.get("name") || "Contact";
        if (intent === "client") {
          stampMess("client", who + " · general contact → a hiring guide");
          go("confirm-client", { trail: true });
        } else {
          stampMess("physician", who + " · general contact → a recruiting guide");
          go("confirm-mess", { trail: true });
        }
      });
    }

    var searchForm = $("#search-form");
    if (searchForm) {
      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        state.specialty = $("#search-spec").value || null;
        state.region = $("#search-region").value || null;
        state.regions = state.region ? [state.region] : [];
        go("physician-jobs", { trail: true });
      });
    }

    var scoreForm = $("#score-form");
    var miAppForm = $("#mi-lite-app-form");
    if (miAppForm) miAppForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateMILiteDashboard();
    });
    $all('input[name="mi-lite-plan"]').forEach(function (input) {
      input.addEventListener("change", function () {
        state.miLitePlan = normalizeMiLitePlan(input.value);
        $all('input[name="mi-lite-plan"]').forEach(function (other) {
          var card = other.closest(".mi-price-card");
          if (card) card.classList.toggle("is-selected", other.checked);
        });
        syncMiLitePlanPickers();
      });
    });
    var miRegionSelect = $("#mi-lite-region-select");
    if (miRegionSelect && !miRegionSelect._ampWired) {
      miRegionSelect._ampWired = true;
      miRegionSelect.addEventListener("change", updateMiLiteRegionStates);
    }
    var miStateSelect = $("#mi-lite-state-select");
    if (miStateSelect && !miStateSelect._ampWired) {
      miStateSelect._ampWired = true;
      ensureMiLiteStateOptions();
    }
    function unlockRidgeAndGo(plan, note) {
      if (plan) state.miLitePlan = plan;
      writeMiLiteUnlock(state.miLitePlan || "region");
      if (typeof stampMess === "function") stampMess("client", note || ("Ridge unlock · " + state.miLitePlan));
      go("mi-lite-app", { trail: true });
    }
    var miLoginForm = $("#mi-lite-login-form");
    if (miLoginForm) miLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      unlockRidgeAndGo(state.miLitePlan || "region", "Ridge fake login unlock");
    });
    var miDemo = $("#mi-lite-demo-login");
    if (miDemo) miDemo.addEventListener("click", function () {
      unlockRidgeAndGo("demo", "Ridge demo unlock");
    });
    var miLockAgain = $("#mi-lite-lock-again");
    if (miLockAgain) miLockAgain.addEventListener("click", function () {
      clearMiLiteUnlock();
      applyMiLiteLockUI();
    });
    function showMiMockToast(msg) {
      var toast = $("#mi-lite-mock-toast");
      if (!toast) return;
      toast.textContent = msg;
      toast.hidden = false;
      clearTimeout(showMiMockToast._t);
      showMiMockToast._t = setTimeout(function () { toast.hidden = true; }, 2800);
    }
    var miSave = $("#mi-lite-save");
    if (miSave) miSave.addEventListener("click", function () {
      if (!readMiLiteUnlock()) return;
      showMiMockToast("Saved · example snapshot held in this browser only.");
    });
    var miCompare = $("#mi-lite-compare");
    if (miCompare) miCompare.addEventListener("click", function () {
      if (!readMiLiteUnlock()) return;
      showMiMockToast("Compare · mock region overlay — Ask AMP for a real side-by-side.");
    });
    var miDownload = $("#mi-lite-download");
    if (miDownload) miDownload.addEventListener("click", function () {
      if (!readMiLiteUnlock()) return;
      var opened = false;
      try {
        if (window.AMPRidgeWorkbench && typeof AMPRidgeWorkbench.downloadReport === "function") {
          opened = !!AMPRidgeWorkbench.downloadReport();
        }
      } catch (err) { opened = false; }
      if (opened) showMiMockToast("Report opened · AMP lockup on the print sheet. Save as PDF from the browser.");
      else showMiMockToast("Download report · allow pop-ups to open the AMP-branded print sheet, or Ask AMP for a guided brief.");
    });
    /* Education / blog / home Ridge preview cards use data-go already; make panel cards keyboard-activatable */
    $all(".mi-education-card[data-go], .ridge-teaser[data-go]").forEach(function (card) {
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    });

    if (scoreForm) {
      scoreForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var out = $("#score-result");
        if (out) {
          out.classList.remove("hidden");
          $("#score-fill").style.width = "78%";
          $("#score-num").textContent = "78 · Strong fit signal";
        }
      });
    }
  }

  /* Earn-the-talk chat funnel: door → earn → contact (dock + full chat). */
  var chatFunnel = { stage: "door", path: null }; /* door | earn | contact | done */

  function chatBubble(who, html) {
    return '<div class="bubble ' + who + '">' + html + "</div>";
  }

  function chatFunnelOpenCopy() {
    return "Hi — I'm here to help you find the right guide. First: which path are you on?";
  }

  function paintChatFunnel() {
    var log = $("#chat-log");
    var actions = $("#chat-actions");
    var dockLog = $("#amp-guide-log");
    var dockActions = $("#amp-guide-actions");
    var confirm = $("#chat-confirm-row");
    if (confirm) confirm.classList.add("hidden");

    function setLog(html) {
      if (log) { log.innerHTML = html; log.scrollTop = log.scrollHeight; }
      if (dockLog) { dockLog.innerHTML = html; dockLog.scrollTop = dockLog.scrollHeight; }
    }
    function setActions(html, split) {
      if (actions) actions.innerHTML = html;
      if (dockActions) {
        dockActions.innerHTML = html;
        dockActions.classList.toggle("is-split", !!split);
      }
    }

    if (chatFunnel.stage === "door") {
      var onView = document.querySelector(".view.on");
      var routeNow = onView ? onView.getAttribute("data-route") : "";
      if (isClientFunnelRoute(routeNow) && !chatFunnel.path) chatFunnel.path = "client";
      if (chatFunnel.path === "client" || chatFunnel.path === "candidate") {
        chatFunnel.stage = "earn";
        paintChatFunnel();
        return;
      }
      setLog(chatBubble("bot", chatFunnelOpenCopy()));
      setActions(
        '<button type="button" class="btn btn-primary amp-guide-action is-primary" data-chat="door-candidate">Candidate path</button>' +
        '<button type="button" class="btn amp-guide-action is-client" data-chat="door-client" style="color:#1c1917;background:linear-gradient(135deg,#fcd34d,#f59e0b);border:0">Client path</button>',
        true
      );
      return;
    }

    if (chatFunnel.stage === "earn") {
      var earn = chatFunnel.path === "client"
        ? "On the client path, we bring a clear plan so you’re not reliving a hard search. You set the high camp — AMP works the climb."
        : "On the candidate path, we start with your story — why you’d move, what would make you happier — then walk the lit path with you. No spam. Your goals lead.";
      var me = chatFunnel.path === "client" ? "I’m hiring / holding the peak" : "I’m exploring roles";
      setLog(
        chatBubble("bot", chatFunnelOpenCopy()) +
        chatBubble("me", me) +
        chatBubble("bot", earn + " Want a named guide for the next step?")
      );
      setActions(
        '<button type="button" class="btn btn-primary amp-guide-action is-primary" data-chat="earn-continue">Yes — connect me with a guide</button>' +
        (chatFunnel.path === "client"
          ? '<button type="button" class="btn btn-ghost amp-guide-action" data-chat="earn-explore" data-go="client">Explore the client path</button>'
          : '<button type="button" class="btn btn-ghost amp-guide-action" data-chat="earn-explore" data-go="physician">Explore the candidate path</button>'),
        false
      );
      return;
    }

    if (chatFunnel.stage === "contact" || chatFunnel.stage === "done") {
      var me2 = chatFunnel.path === "client" ? "I’m hiring / holding the peak" : "I’m exploring roles";
      var earn2 = chatFunnel.path === "client"
        ? "On the client path, we bring a clear plan so you’re not reliving a hard search. You set the high camp — AMP works the climb."
        : "On the candidate path, we start with your story — why you’d move, what would make you happier — then walk the lit path with you. No spam. Your goals lead.";
      setLog(
        chatBubble("bot", chatFunnelOpenCopy()) +
        chatBubble("me", me2) +
        chatBubble("bot", earn2 + " Want a named guide for the next step?") +
        chatBubble("me", "Yes — connect me with a guide") +
        chatBubble("bot", "Great. How should we reach you? No package dumps — just a clear next step with a recruiting guide.")
      );
      setActions(
        '<button type="button" class="btn btn-primary amp-guide-action is-primary" data-chat="talk">Talk</button>' +
        '<button type="button" class="btn btn-dark amp-guide-action" data-chat="text">Text</button>' +
        '<button type="button" class="btn btn-ghost amp-guide-action" data-chat="email">Email</button>' +
        '<button type="button" class="btn btn-ghost amp-guide-action" data-chat="other">Something else</button>',
        true
      );
    }
  }

  function resetChatFunnel() {
    chatFunnel.stage = "door";
    chatFunnel.path = null;
    paintChatFunnel();
  }

  function handleChat(opt) {
    /* Job-context shortcuts (already earned via job page) skip the door funnel. */
    var jobSkip = !!(state.jobId || state.guidePathText) && (opt === "talk" || opt === "text" || opt === "email" || opt === "other");
    var inDock = !!(document.querySelector("#amp-guide.is-open") || (function () {
      var d = $("#amp-guide-dock");
      return d && !d.hidden;
    })());
    var onChat = !!document.querySelector('.view.on[data-route="chat"]');

    if (opt === "door-candidate" || opt === "door-client") {
      chatFunnel.path = opt === "door-client" ? "client" : "candidate";
      chatFunnel.stage = "earn";
      paintChatFunnel();
      return;
    }
    if (opt === "earn-continue") {
      chatFunnel.stage = "contact";
      paintChatFunnel();
      return;
    }
    if (opt === "earn-explore") {
      /* data-go on the same button handles navigation */
      return;
    }

    if (!jobSkip && chatFunnel.stage === "door" && (opt === "talk" || opt === "text" || opt === "email" || opt === "other")) {
      /* Someone hit contact before picking a door — nudge */
      if (!onChat && !inDock) go("chat", { instant: true });
      paintChatFunnel();
      return;
    }

    if (!onChat && !inDock) {
      go("chat", { instant: true });
      setTimeout(function () { handleChat(opt); }, 0);
      return;
    }

    /* Contact handoff */
    var log = $("#chat-log");
    var dockLog = $("#amp-guide-log");
    var labels = {
      talk: state.guidePathText ? "I want to talk to a guide about " + state.guidePathText : "I’d like to talk with a guide",
      text: "Text me",
      email: "Email is better for me",
      other: "I have a different question"
    };
    var meHtml = chatBubble("me", labels[opt] || opt);
    var botHtml = chatBubble("bot", "Got it. Routing your interest to <strong>a recruiting guide</strong>. Prefer a form? Use Tap to Talk — same destination.");
    if (log) {
      log.innerHTML += meHtml;
      setTimeout(function () {
        log.innerHTML += botHtml;
        log.scrollTop = log.scrollHeight;
        var row = $("#chat-confirm-row");
        if (row) row.classList.remove("hidden");
        var actions = $("#chat-actions");
        if (actions) actions.innerHTML = "";
      }, 400);
    }
    if (dockLog) {
      dockLog.innerHTML += meHtml;
      setTimeout(function () {
        dockLog.innerHTML += botHtml;
        dockLog.scrollTop = dockLog.scrollHeight;
        var da = $("#amp-guide-actions");
        if (da) da.innerHTML = '<button type="button" class="btn btn-primary amp-guide-action is-primary" data-go="confirm-mess" data-trail="1">Confirm · view next step</button>';
      }, 400);
    }
    chatFunnel.stage = "done";
    if (inDock) closeGuideDock();
  }

  function renderBlogIndex() {
    var root = $("#blog-index-grid");
    if (!root) return;
    root.innerHTML = AMP_CONTENT.posts.map(function (p) {
      var blogKey = "blog/" + p.slug;
      return '<a class="card" href="' + routeToHref(blogKey) + '" data-go="' + blogKey + '" data-blog="' + p.slug + '">' +
        '<span class="tag">' + p.mins + " min read</span>" +
        "<h3>" + p.title + "</h3><p>" + p.meta + "</p>" +
        '<div class="meta">' + p.tags.join(" · ") + "</div></a>";
    }).join("");
  }


  /* ---- Path-based public routing (build 1981) ----
     Public pathname ↔ internal route map:
       /                         → home
       /about                    → about
       /blog                     → blog
       /contact-us               → contact
       /jobs                     → physician-jobs
       /organizational-services  → for-organizations
       /recruiting-services      → for-physicians
       /forms                    → forms
       /candidate-authorization  → form-candidate-authorization
       /interview-expense-form   → form-interview-expense
       /easy-pay-authorization   → form-easy-pay
       KEEP public form paths stay; submit stays on live Webflow until mountain
       can prove end-to-end submit. Do not invent form fields or stub “ready”.
       /job/{slug}               → job/{slug}
       /blog-posts/{slug}        → blog/{slug}
       /ridge                    → mi-lite   (/mi-lite aliases here)
     Other SPA views use /{data-route}. Old #hash links still boot, then upgrade to path.
  */
  var GH_PAGES_BASE = "/amp-range-preview-k9m3";
  var BRAND_SUFFIX = " | Adaptive Medical Partners";

  var PATH_TO_ROUTE = {
    "": "home",
    "/": "home",
    "about": "about",
    "blog": "blog",
    "contact-us": "contact",
    "contact": "contact",
    "jobs": "physician-jobs",
    "organizational-services": "for-organizations",
    "recruiting-services": "for-physicians",
    "forms": "forms",
    "candidate-authorization": "form-candidate-authorization",
    "interview-expense-form": "form-interview-expense",
    "easy-pay-authorization": "form-easy-pay",
    "ridge": "mi-lite",
    "mi-lite": "mi-lite"
  };

  var ROUTE_TO_PATH = {
    "home": "/",
    "about": "/about",
    "blog": "/blog",
    "contact": "/contact-us",
    "physician-jobs": "/jobs",
    "for-organizations": "/organizational-services",
    "for-physicians": "/recruiting-services",
    "forms": "/forms",
    "form-candidate-authorization": "/candidate-authorization",
    "form-interview-expense": "/interview-expense-form",
    "form-easy-pay": "/easy-pay-authorization",
    "mi-lite": "/ridge"
  };

  function detectBasePath() {
    var p = location.pathname || "/";
    if (p === GH_PAGES_BASE || p.indexOf(GH_PAGES_BASE + "/") === 0) return GH_PAGES_BASE;
    return "";
  }

  function normalizeRouteAlias(key) {
    if (key === "residents-fellows") return "residents";
    if (key === "market-intelligence" || key === "mi" || key === "ridge") return "mi-lite";
    return key;
  }

  function stripBasePath(pathname) {
    var base = detectBasePath();
    var p = pathname || "/";
    if (base && (p === base || p.indexOf(base + "/") === 0)) {
      p = p.slice(base.length) || "/";
    }
    /* index.html at root still means home */
    if (p === "/index.html" || p === "index.html") return "/";
    return p;
  }

  function routeToPathname(routeKey) {
    routeKey = normalizeRouteAlias(String(routeKey || "home"));
    if (routeKey.indexOf("job/") === 0) return "/job/" + routeKey.slice(4);
    if (routeKey.indexOf("blog-posts/") === 0) return "/" + routeKey;
    if (routeKey.indexOf("blog/") === 0) return "/blog-posts/" + routeKey.slice(5);
    if (ROUTE_TO_PATH[routeKey]) return ROUTE_TO_PATH[routeKey];
    if (routeKey === "home") return "/";
    return "/" + routeKey;
  }

  function pathnameToRouteKey(pathname) {
    var p = stripBasePath(pathname);
    if (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.slice(0, -1);
    if (!p || p === "/") return "home";
    if (p.charAt(0) === "/") p = p.slice(1);

    if (p.indexOf("job/") === 0) return p;
    if (p.indexOf("blog-posts/") === 0) return "blog/" + p.slice("blog-posts/".length);
    if (p.indexOf("blog/") === 0) return p;

    if (PATH_TO_ROUTE.hasOwnProperty(p)) return PATH_TO_ROUTE[p];

    var top = p.split("/")[0];
    if (document.querySelector('.view[data-route="' + top + '"]')) return top;
    if (document.querySelector('.view[data-route="' + p + '"]')) return p;
    return null;
  }

  function routeToHref(routeKey, personHash) {
    routeKey = normalizeRouteAlias(String(routeKey || "home"));
    if (location.protocol === "file:") {
      var fileHash = "#" + (routeKey.indexOf("blog-posts/") === 0 ? "blog/" + routeKey.slice(11) : routeKey);
      return fileHash;
    }
    var path = routeToPathname(routeKey);
    var base = detectBasePath();
    var url = path === "/" ? (base ? base + "/" : "/") : (base + path);
    var pid = guidePersonIdFromHash(personHash);
    if (pid) url += "#" + pid;
    return url;
  }

  function rewriteGoHrefs() {
    $all("a[data-go]").forEach(function (a) {
      var route = a.getAttribute("data-go");
      if (!route) return;
      a.setAttribute("href", routeToHref(route, a.getAttribute("data-hash")));
    });
  }

  /* Mike 2026-09-14 locked title / meta / H1 / robots. Do not re-litigate. */
  var SEO_DEFAULT = {
    title: "Adaptive Medical Partners | Physician & Healthcare Recruiting",
    description: "Adaptive Medical Partners — physician & healthcare recruiting firm. Retained search for candidates and organizations. 87% retention at 3 years, 1.7 avg interviews per placement, 700+ rural/FQHC/CAH partners, 16 years since 2010.",
    robots: "index,follow"
  };

  var SEO_NOINDEX = "noindex,follow";

  var SEO_MAP = {
    home: {
      title: "Adaptive Medical Partners | Physician & Healthcare Recruiting",
      description: SEO_DEFAULT.description,
      robots: "index,follow",
      h1: "Physician & Healthcare Recruiting"
    },
    about: {
      title: "About" + BRAND_SUFFIX,
      description: "About Adaptive Medical Partners — a retained physician recruiting firm since 2010. 87% retention at 3 years, 1.7 interviews per hire, and 700+ rural, FQHC, and critical access partners.",
      robots: "index,follow"
    },
    blog: {
      title: "Blog — Healthcare Recruiting Insights" + BRAND_SUFFIX,
      description: "Healthcare recruiting insights from Adaptive Medical Partners — retained search, physician retention, interview efficiency, and rural/FQHC recruiting.",
      robots: "index,follow"
    },
    contact: {
      title: "Contact Us" + BRAND_SUFFIX,
      description: "Contact Adaptive Medical Partners in Irving, Texas. Talk with a recruiting guide or a hiring guide — inquire@adaptivemedicalpartners.com · (972) 441-2750.",
      robots: "index,follow",
      h1: "Ready to Start a Conversation?"
    },
    "physician-jobs": {
      title: "Physician & Healthcare Jobs" + BRAND_SUFFIX,
      description: "Physician and healthcare jobs with Adaptive Medical Partners. Practice-first previews — talk with a named guide about opportunities that fit your goals.",
      robots: "index,follow",
      h1: "Opportunities That Actually Fit Your Goals"
    },
    "for-organizations": {
      title: "Organizational Services — Retained Physician Search" + BRAND_SUFFIX,
      description: "Organizational services from Adaptive Medical Partners — retained physician search for hospitals, groups, and FQHCs. You wait at the peak; AMP does the climb work.",
      robots: "index,follow",
      h1: "For Healthcare Organizations"
    },
    "for-physicians": {
      title: "Recruiting Services for Physicians" + BRAND_SUFFIX,
      description: "Recruiting services for physicians from Adaptive Medical Partners. Specialty and region filters, practice-first previews, and a named guide — not a blast.",
      robots: "index,follow",
      h1: "For Physicians"
    },
    forms: {
      title: "Forms" + BRAND_SUFFIX,
      description: "Candidate authorization, interview expense, and easy-pay forms from Adaptive Medical Partners.",
      robots: "index,follow"
    },
    "form-candidate-authorization": {
      title: "Candidate Authorization" + BRAND_SUFFIX,
      description: "Candidate authorization form for Adaptive Medical Partners searches.",
      robots: "index,follow"
    },
    "form-interview-expense": {
      title: "Interview Expense Form" + BRAND_SUFFIX,
      description: "Interview expense form for Adaptive Medical Partners candidates.",
      robots: "index,follow"
    },
    "form-easy-pay": {
      title: "Easy Pay Authorization" + BRAND_SUFFIX,
      description: "Easy-pay authorization form for Adaptive Medical Partners.",
      robots: "index,follow"
    },
    "mi-lite": {
      title: "Ridge" + BRAND_SUFFIX,
      description: "Ridge is Adaptive Medical Partners’ specialty × region market read — one snapshot for physicians and healthcare organizations.",
      robots: "index,follow"
    },
    physician: {
      title: "For Physicians" + BRAND_SUFFIX,
      description: "Start the physician path with Adaptive Medical Partners. Choose your specialty and see practice-first roles with a recruiting guide.",
      robots: "index,follow"
    },
    client: {
      title: "For Healthcare Organizations" + BRAND_SUFFIX,
      description: "Start the hiring path with Adaptive Medical Partners. Tell us about your facility and specialty — AMP guides retained physician search.",
      robots: "index,follow"
    },
    education: {
      title: "Education" + BRAND_SUFFIX,
      description: "Education from Adaptive Medical Partners — residents and fellows, Ridge, AMP Score, and healthcare recruiting guides.",
      robots: "index,follow"
    },
    residents: {
      title: "Residents & Fellows" + BRAND_SUFFIX,
      description: "Coming out of training? Adaptive Medical Partners helps residents and fellows choose a first job with clear weeks, place-first questions, and contract literacy.",
      robots: "index,follow"
    },
    guides: {
      title: "Meet Your Guides" + BRAND_SUFFIX,
      description: "Meet the Adaptive Medical Partners guides — recruiting and hiring practitioners who stay until the summit meeting is prepared.",
      robots: "index,follow"
    },
    search: {
      title: "Search" + BRAND_SUFFIX,
      description: "Search physician and healthcare opportunities with Adaptive Medical Partners by specialty and region.",
      robots: "index,follow"
    },
    proof: {
      title: "Proof & Stats" + BRAND_SUFFIX,
      description: "AMP public proof: 87% retention at 3 years, 1.7 interviews per placement, 700+ rural/FQHC/CAH partners, 16 years since 2010.",
      robots: "index,follow"
    },
    "amp-score": {
      title: "AMP Score" + BRAND_SUFFIX,
      description: "AMP Score lives at getampscore.com. This mountain-site page is a preview only — open the full product on getampscore.com.",
      robots: SEO_NOINDEX
    },
    "physician-rank": { title: "What Matters Most" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "physician-region": { title: "Choose Your Region" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "job-contact": { title: "Tap to Talk" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    chat: { title: "Ask a Guide" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "confirm-mess": { title: "Interest Captured" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "confirm-client": { title: "Meeting Request Captured" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-specialty": { title: "Hiring Specialty" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-region": { title: "Search Location" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-retained": { title: "How AMP Works" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-meeting": { title: "Request a Meeting" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    mpc: { title: "Tailor a Search" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mpc-portal": { title: "Client Browse Tools" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mpc-browse": { title: "Browse Tools" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mi-lite-portal": { title: "Ridge Pricing" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mi-lite-login": { title: "Ridge Sign In" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mi-lite-app": { title: "Ridge Sample" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX }
  };

  function blogFallbackMeta(post) {
    var title = post && post.title ? String(post.title).trim() : "Article";
    return title + " — healthcare recruiting insights from Adaptive Medical Partners.";
  }

  function blogDocumentDescription(post) {
    if (!post) return blogFallbackMeta(null);
    var cms = String(post.meta || post.excerpt || "").trim();
    return cms || blogFallbackMeta(post);
  }

  function jobPlace(j) {
    if (!j) return "";
    return String(j.city || j.state || "").trim();
  }

  function jobDocumentTitle(j) {
    var title = String((j && j.title) || "Opportunity").trim();
    var spec = String((j && j.specialtyLabel) || "").trim();
    var city = jobPlace(j);
    var mid = spec && city ? spec + " in " + city : (spec || (city ? "Role in " + city : ""));
    return (mid ? title + " — " + mid : title) + BRAND_SUFFIX;
  }

  function jobDocumentDescription(j) {
    if (!j) return SEO_DEFAULT.description;
    var excerpt = String(j.excerpt || j.meta || j.sub || "").trim();
    if (excerpt) return excerpt;
    var spec = j.specialtyLabel || "Physician";
    var city = jobPlace(j);
    return spec + (city ? " in " + city : "") + " — practice-first preview from Adaptive Medical Partners. Full package on a confidential call with your guide.";
  }

  function setMetaTag(name, content) {
    var el = document.querySelector('meta[name="' + name + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  var PRODUCTION_ORIGIN = "https://www.adaptivemedicalpartners.com";

  /* Flip production path only — never GH Pages base, ?v=, or #hash. */
  function canonicalHrefForRoute(route, params) {
    params = params || {};
    var key = String(route || "home");
    var path;
    if (key === "job" || key.indexOf("job/") === 0) {
      var id = params.id || (key.indexOf("job/") === 0 ? key.slice(4) : "");
      path = id ? "/job/" + id : routeToPathname("physician-jobs");
    } else if (key === "blog-post" || key.indexOf("blog/") === 0 || key.indexOf("blog-posts/") === 0) {
      var slug = params.slug || "";
      if (!slug && key.indexOf("blog-posts/") === 0) slug = key.slice("blog-posts/".length);
      if (!slug && key.indexOf("blog/") === 0) slug = key.slice(5);
      path = slug ? "/blog-posts/" + slug : routeToPathname("blog");
    } else {
      path = routeToPathname(key);
    }
    if (!path) path = "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    return PRODUCTION_ORIGIN + path;
  }

  function setCanonicalLink(href) {
    var el = document.getElementById("amp-canonical");
    if (!el) el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      document.head.appendChild(el);
    }
    el.id = "amp-canonical";
    el.setAttribute("rel", "canonical");
    el.setAttribute("href", href);
    document.querySelectorAll('link[rel="canonical"]').forEach(function (link) {
      if (link !== el && link.parentNode) link.parentNode.removeChild(link);
    });
  }

  function applyDocumentSeo(route, params) {
    params = params || {};
    var viewRoute = route;
    if (String(route || "").indexOf("job/") === 0) viewRoute = "job";
    if (String(route || "").indexOf("blog/") === 0 || String(route || "").indexOf("blog-posts/") === 0) viewRoute = "blog-post";

    var title = SEO_DEFAULT.title;
    var description = SEO_DEFAULT.description;
    var robots = "index,follow";
    var h1 = null;
    var viewSel = viewRoute;

    if (viewRoute === "job") {
      var job = jobById(params.id || state.jobId);
      if (!job) {
        title = "Role not found" + BRAND_SUFFIX;
        description = "That opening isn’t on the site right now. Browse current physician openings from Adaptive Medical Partners.";
        robots = SEO_NOINDEX;
        h1 = "Role not found";
        clearJobJsonLd();
      } else {
        title = jobDocumentTitle(job);
        description = jobDocumentDescription(job);
        robots = "index,follow";
        h1 = job.title || null;
        injectJobJsonLd(buildJobPostingJsonLd(job));
      }
    } else if (viewRoute === "blog-post") {
      var slug = params.slug;
      var post = (window.AMP_CONTENT && AMP_CONTENT.posts || []).find(function (p) { return p.slug === slug; }) || (window.AMP_CONTENT && AMP_CONTENT.posts && AMP_CONTENT.posts[0]);
      title = ((post && post.title) || "Article") + BRAND_SUFFIX;
      description = blogDocumentDescription(post);
      robots = "index,follow";
      h1 = post && post.title ? post.title : null;
      clearJobJsonLd();
    } else {
      var entry = SEO_MAP[viewRoute] || SEO_DEFAULT;
      title = entry.title || SEO_DEFAULT.title;
      description = entry.description || SEO_DEFAULT.description;
      robots = entry.robots || "index,follow";
      h1 = entry.h1 || null;
      clearJobJsonLd();
    }

    document.title = title;
    setMetaTag("description", description);
    setMetaTag("robots", robots);
    setCanonicalLink(canonicalHrefForRoute(route, params));

    if (h1) {
      var view = document.querySelector('.view[data-route="' + viewSel + '"]');
      if (view) {
        var heading = view.querySelector("h1");
        if (heading) heading.textContent = h1;
      }
    }
  }

  /* amp-build:2055-guide-deeplink
     Person anchors are #guide-{slug} (DOM id on each guides article).
     HTTP/GH Pages: path is the view (/guides); #guide-* is the person (not a route).
     Home click: data-go="guides" + data-hash="guide-amy-myers" (existing data-hash scroll).
     Direct load: /guides?v=2055#guide-amy-myers  or  /?v=2055#guide-amy-myers (home hash → guides).
     file: hash is the route, so person id rides opts.hash only. */
  function guidePersonIdFromHash(hash) {
    var h = String(hash || "").replace(/^#/, "");
    return /^guide-[a-z0-9-]+$/i.test(h) ? h : "";
  }

  function scrollGuidePerson(id) {
    var el = id && document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function locationToRouteKey() {
    var pathKey = pathnameToRouteKey(location.pathname);
    var rawHash = (location.hash || "").replace(/^#/, "");
    var person = guidePersonIdFromHash(rawHash);
    var hash = rawHash ? normalizeRouteAlias(rawHash) : "";
    var pathIsHome = !pathKey || pathKey === "home";
    /* Prefer real path doors; only fall back to hash for old links on home/index. */
    if (!pathIsHome) return pathKey;
    /* #guide-amy-myers on home is a person deep-link, not a missing route. */
    if (person) return "guides";
    if (hash) return hash;
    return "home";
  }

  function currentRouteHash() {
    return locationToRouteKey();
  }

  function setRouteHash(routeKey, opts) {
    opts = opts || {};
    routeKey = normalizeRouteAlias(String(routeKey || "home"));
    /* file:// keeps hash routing so offline open still works */
    if (location.protocol === "file:") {
      var hurl = "#" + (routeKey.indexOf("blog-posts/") === 0 ? "blog/" + routeKey.slice(11) : routeKey);
      try {
        if (opts.fromHistory || opts.replace) {
          history.replaceState({ ampRoute: routeKey }, "", hurl);
        } else if (currentRouteHash() === routeKey && (location.hash || "#home").replace(/^#/, "") === routeKey.replace(/^blog-posts\//, "blog/")) {
          history.replaceState({ ampRoute: routeKey }, "", hurl);
        } else {
          history.pushState({ ampRoute: routeKey }, "", hurl);
        }
        _ampLastBootHash = routeKey;
      } catch (e) {}
      return;
    }

    var base = detectBasePath();
    var path = routeToPathname(routeKey);
    var url = base + (path === "/" ? (base ? "/" : "/") : path);
    /* Normalize: base + "/" for home on project pages → /amp-range-preview-k9m3/ */
    if (path === "/") url = base ? base + "/" : "/";
    var search = location.search || "";
    var personHash = "";
    if (routeKey === "guides") {
      var pid = "";
      if (opts.personHash) pid = guidePersonIdFromHash(opts.personHash);
      else if (opts.personHash === "") pid = "";
      else pid = guidePersonIdFromHash(location.hash);
      if (pid) personHash = "#" + pid;
    }
    var full = url + search + personHash;

    try {
      if (opts.fromHistory || opts.replace) {
        history.replaceState({ ampRoute: routeKey }, "", full);
        _ampLastBootHash = routeKey;
        return;
      }
      if (_ampLastBootHash === routeKey && pathnameToRouteKey(location.pathname) === routeKey && !location.hash) {
        history.replaceState({ ampRoute: routeKey }, "", full);
        _ampLastBootHash = routeKey;
        return;
      }
      history.pushState({ ampRoute: routeKey }, "", full);
      _ampLastBootHash = routeKey;
    } catch (e) {}
  }

  var _ampLastBootHash = null;
  function bootFromHash(opts) {
    opts = opts || {};
    var key = locationToRouteKey();
    /* Coalesce double hashchange+popstate — but NEVER skip trailhead restores:
       a no-op leave could leave hire-sheet invisible after Back. */
    if (opts.fromHistory && _ampLastBootHash === key) {
      var trail = document.querySelector('.view.trailhead.on[data-route="' + key + '"]');
      if (trail && trail.classList.contains("picker-in") && trail.classList.contains("after-approach") && !trail.classList.contains("live-video-bg")) {
        return;
      }
      if (trail && (key === "physician" || key === "client")) {
        teardownApproachVideo();
        showTrailheadPickerSheet(trail, true);
        return;
      }
      /* fall through and re-land */
    }
    _ampLastBootHash = key;
    var nav = { instant: true, fromHistory: !!opts.fromHistory, replaceHash: !opts.fromHistory };
    var bootPerson = guidePersonIdFromHash(location.hash);
    if (bootPerson) nav.hash = bootPerson;
    if (key.indexOf("job/") === 0 || key.indexOf("blog/") === 0 || key.indexOf("blog-posts/") === 0) {
      go(key, nav);
    } else if (document.querySelector('.view[data-route="' + key + '"]')) {
      go(key, nav);
    } else {
      go("home", nav);
      key = "home";
    }
    /* Upgrade legacy #hash and aliases (/mi-lite → /ridge) to the canonical pathname. */
    if (location.protocol !== "file:") {
      if (location.hash) {
        try { setRouteHash(key, { replace: true }); } catch (e2) {}
      } else {
        var want = routeToPathname(key);
        var have = stripBasePath(location.pathname);
        if (have.length > 1 && have.charAt(have.length - 1) === "/") have = have.slice(0, -1);
        if (!have) have = "/";
        if (have !== want) {
          try { setRouteHash(key, { replace: true }); } catch (e3) {}
        }
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { bindClientHireSheetClicks(); } catch (e) {}
    window.addEventListener("resize", layoutSignMediaFrames);
    window.addEventListener("orientationchange", layoutSignMediaFrames);
    window.addEventListener("resize", updateRankOrientationCopy);
    window.addEventListener("orientationchange", updateRankOrientationCopy);
    updateRankOrientationCopy();
    try { rewriteGoHrefs(); } catch (eHref) {}
    bind();
    renderBlogIndex();
    bootFromHash({ fromHistory: true });
    try { scheduleHomeVideoWarm(); } catch (eWarm) {}
    /* popstate is the BF spine; hashchange kept for deep-link/manual hash edits, guarded above. */
    window.addEventListener("hashchange", function () {
      bootFromHash({ fromHistory: true });
    });
    window.addEventListener("popstate", function () {
      bootFromHash({ fromHistory: true });
    });
  });

  window.AMPRegionMap = { render: renderRegionMap, normalizeState: normalizeRegionState };
  window.AMP = { go: go, state: state, settleHome: settleHome, href: routeToHref, seo: applyDocumentSeo, jobJsonLd: buildJobPostingJsonLd, canonical: canonicalHrefForRoute };
})();

  document.addEventListener("click", function (e) {
    var scrollBtn = e.target.closest("[data-scroll-to]");
    if (!scrollBtn) return;
    var id = scrollBtn.getAttribute("data-scroll-to");
    var el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });



/* amp-build:2038-home-climb — interactive Candidate/Client climb under Job 2 */
(function () {
  function bindHomeClimb(root) {
    if (!root || root.dataset.climbBound) return;
    root.dataset.climbBound = "1";
    var tabs = root.querySelectorAll("[data-climb-path]");
    var panels = root.querySelectorAll("[data-climb-panel]");
    var ctas = root.querySelectorAll("[data-climb-cta]");
    function showPath(path) {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-climb-path") === path;
        tab.classList.toggle("is-on", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-climb-panel") === path;
        panel.classList.toggle("is-on", on);
        if (on) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      });
      ctas.forEach(function (cta) {
        var on = cta.getAttribute("data-climb-cta") === path;
        if (on) cta.removeAttribute("hidden");
        else cta.setAttribute("hidden", "");
      });
      var guides = document.querySelector("[data-home-guides]");
      if (guides) {
        guides.setAttribute("data-path", path);
        var title = guides.querySelector("[data-guides-title]");
        var lede = guides.querySelector("[data-guides-lede]");
        if (title) title.textContent = path === "client" ? "Your hiring guides" : "Your recruiting guides";
        if (lede) lede.textContent = path === "client"
          ? "Tap one — they help you set the high camp and own the next step."
          : "Tap one — they turn a preview into a real next step.";
        guides.querySelectorAll("[data-guides-panel]").forEach(function (rail) {
          var on = rail.getAttribute("data-guides-panel") === path;
          rail.classList.toggle("is-on", on);
          if (on) rail.removeAttribute("hidden");
          else rail.setAttribute("hidden", "");
        });
      }
    }
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        showPath(tab.getAttribute("data-climb-path"));
      });
    });
    panels.forEach(function (panel) {
      panel.querySelectorAll(".home-climb-step").forEach(function (step) {
        step.addEventListener("click", function () {
          var li = step.closest("li");
          if (!li) return;
          panel.querySelectorAll(".home-climb-step").forEach(function (s) {
            s.classList.remove("is-on");
            s.setAttribute("aria-expanded", "false");
          });
          panel.querySelectorAll(".home-climb-detail").forEach(function (d) {
            d.classList.remove("is-on");
            d.setAttribute("hidden", "");
          });
          step.classList.add("is-on");
          step.setAttribute("aria-expanded", "true");
          var detail = li.querySelector(".home-climb-detail");
          if (detail) {
            detail.classList.add("is-on");
            detail.removeAttribute("hidden");
          }
        });
      });
    });
  }
  function bootHomeClimb() {
    document.querySelectorAll("[data-home-climb]").forEach(bindHomeClimb);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootHomeClimb);
  } else {
    bootHomeClimb();
  }
})();

/* amp-build:2039-home-bg-lock — lock home mountain height in px; ignore URL-bar resize */
(function () {
  var lastW = 0;
  function applyHomeBgVh() {
    var h = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    if (!h) return;
    /* slight overscan so chrome collapse does not expose edges / reflow object-fit */
    document.documentElement.style.setProperty("--home-bg-vh", Math.ceil(h * 1.06) + "px");
  }
  function onResize() {
    var w = window.innerWidth || 0;
    if (lastW && Math.abs(w - lastW) < 8) return; /* height-only chrome change */
    lastW = w;
    applyHomeBgVh();
  }
  applyHomeBgVh();
  lastW = window.innerWidth || 0;
  window.addEventListener("orientationchange", function () {
    setTimeout(applyHomeBgVh, 280);
  });
  window.addEventListener("resize", onResize, { passive: true });
})();

/* amp-build:2042-home-guides-path — climb toggle flips recruiting vs hiring guides */
