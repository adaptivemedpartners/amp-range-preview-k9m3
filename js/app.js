/* AMP Mountain Site — SPA router + video settle + shared trail transitions */
(function () {
  "use strict";
  window.__AMP_BUILD = "1989-back-specialty";

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
    agreement: null,
    mpcAccess: "monthly",
    mpcUnlocked: false,
    mpcFilterSpecialty: "",
    mpcFilterLooking: "",
    mpcMetroOnly: true,
    mpcAmenities: [],
    mpcSelectedId: null,
    miLitePlan: "monthly",
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
      blurb: "You hold the peak; AMP does the work — lump retainer + marketing + placement. BD Hub owns this lead."
    },
    "shared-ascent": {
      tag: "Shared Ascent",
      title: "Shared Ascent (Partnership)",
      blurb: "Lower upfront risk — initiation + 4–6 monthlies. You wait; AMP works. BD Hub owns this lead."
    },
    "mpc": {
      tag: "MPC · Candidate catch-all",
      title: "MPC tailor-search",
      blurb: "Physician / candidate catch-all when posted roles don’t fit — tailor-search with a guide. Lands in The Mess Responses. Client telescope / pay-per-CV parked until CV bank."
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

  function clearApproachHold() {
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
      /* Critical: bake hide must not stick — second Enter was a black hold. */
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
    resetTrailheadPickerChrome(null, { clearLive: true });
    state.approachHold = false;
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
          img.src = "assets/hero-mountain-trailhead-freeze.png?v=1989";
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
          try { renderFacilitySignpost(); } catch (e) {}
          mountTrailheadHits("client");
        }
      }
      state.approachHold = true;
    }

    function tickApproach() {
      if (!video || freezePaused) return;
      var t = video.currentTime || 0;
      try { if (video.playbackRate !== 1) video.playbackRate = 1; } catch (e) {}
      /* Soft HTML picker during late swoop — video keeps playing to end. */
      if (t >= OVERLAY_AT) revealPickerOverlay();
      /* Freeze only at end of whole clip — do not freeze early. */
      if (t >= FREEZE_END - 0.05 || (video.duration && t >= video.duration - 0.08)) {
        pauseFreeze(true);
        return;
      }
      if (!freezePaused) {
        try { video.__ampEaseRaf = requestAnimationFrame(tickApproach); } catch (e) {}
      }
    }

    onSettleTime = function () { tickApproach(); };

    video.addEventListener("timeupdate", onSettleTime);
    video.addEventListener("ended", function () {
      pauseFreeze(true);
    });
    try { video.__ampEaseRaf = requestAnimationFrame(tickApproach); } catch (e) {}

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

  function hideAllViews() {
    $all(".view").forEach(function (v) {
      v.classList.remove("on", "trail-out", "trail-in", "walk-forward", "soft-in", "after-approach", "live-video-bg", "picker-in", "signs-lit", "signs-frozen");
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
    "client-retained": true,
    "client-meeting": true,
    "confirm-client": true,
    "education": true,
    "mpc": true,
    "mpc-portal": true,
    "mpc-browse": true,
    "mi-lite-portal": true,
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

  function populateMIFields(selectId, regionsId) {
    var spec = $(selectId), regions = $(regionsId);
    if (!window.AMP_CONTENT || !spec || !regions) return;
    if (!spec.options.length) spec.innerHTML = AMP_CONTENT.specialties.filter(function (s) { return s.id !== "other"; }).map(function (s) { return '<option value="' + s.id + '">' + s.label + '</option>'; }).join("");
    if (!regions.innerHTML.trim()) regions.innerHTML = AMP_CONTENT.regions.filter(function (r) { return r.id !== "open"; }).map(function (r) { return '<label class="mi-region-option"><input type="checkbox" value="' + r.id + '"> <span>' + r.label + '</span></label>'; }).join("");
  }

  function renderMILite() {
    populateMIFields("#mi-lite-specialty", "#mi-lite-regions");
    populateMIFields("#mi-app-specialty", "#mi-app-regions");
  }

  function renderMILitePortal() {
    try {
      state.miLiteUnlocked = sessionStorage.getItem("amp-mi-lite-unlocked") === "1";
      state.miLitePlan = sessionStorage.getItem("amp-mi-lite-plan") || state.miLitePlan;
    } catch (e) {}
    $all('input[name="mi-lite-plan"]').forEach(function (input) {
      input.checked = input.value === state.miLitePlan;
      var card = input.closest(".mi-price-card");
      if (card) card.classList.toggle("is-selected", input.checked);
    });
  }

  function updateMILiteDashboard() {
    var spec = $("#mi-app-specialty"), title = $("#mi-app-title"), copy = $("#mi-app-copy");
    if (!spec) return;
    var label = spec.options[spec.selectedIndex] ? spec.options[spec.selectedIndex].text : "Your specialty";
    var picks = $all("#mi-app-regions input:checked").map(function (input) { return input.nextElementSibling ? input.nextElementSibling.textContent : input.value; });
    var score = 68 + ((label.length * 3 + picks.length * 5) % 24);
    if (title) title.textContent = label + " · " + (picks.length ? picks.join(" + ") : "open region lens");
    if (copy) copy.textContent = "Example signal for " + (picks.length ? picks.join(" + ") : "open region hints") + ". Directional planning only—not a forecast or client dossier.";
    var scoreEl = $("#mi-app-score"), demand = $("#mi-app-demand"), breadth = $("#mi-app-breadth"), readiness = $("#mi-app-readiness");
    if (scoreEl) scoreEl.textContent = score + " / 100";
    if (demand) demand.style.width = Math.min(92, score + 5) + "%";
    if (breadth) breadth.style.width = Math.min(88, 44 + picks.length * 14) + "%";
    if (readiness) readiness.style.width = Math.min(86, 58 + picks.length * 6) + "%";
    var demandLabel = $("#mi-app-demand-label"), breadthLabel = $("#mi-app-breadth-label"), readyLabel = $("#mi-app-readiness-label");
    if (demandLabel) demandLabel.textContent = score > 80 ? "High" : "Moderate";
    if (breadthLabel) breadthLabel.textContent = picks.length > 1 ? "Broad" : "Mixed";
    if (readyLabel) readyLabel.textContent = picks.length ? "Framing" : "Early";
    var chips = $("#mi-app-chip-row");
    if (chips) chips.innerHTML = (picks.length ? picks : ["Open region lens"]).map(function (name) { return '<span class="mi-region-chip"><span class="dot"></span>' + name + '<b>EXAMPLE</b></span>'; }).join("");
  }

  function renderMILiteApp() {
    try {
      state.miLiteUnlocked = sessionStorage.getItem("amp-mi-lite-unlocked") === "1";
      state.miLitePlan = sessionStorage.getItem("amp-mi-lite-plan") || state.miLitePlan;
    } catch (e) {}
    renderMILite();
    updateMILiteDashboard();
  }

  function renderDynamic(route, params) {
    if (route === "mi-lite") renderMILite();
    if (route === "mi-lite-portal") renderMILitePortal();
    if (route === "mi-lite-app") renderMILiteApp();
    if (route === "physician" || route === "physician-specialty") renderSpecialtyGrid();
    if (route === "physician-rank") renderRankStep();
    if (route === "physician-region") renderRegionGrid();
    if (route === "physician-jobs") renderJobsList();
    if (route === "job") renderJob(params.id || state.jobId);
    if (route === "job-contact" || route === "chat") renderJobContact(params.id || state.jobId);
    if (route === "client") renderFacilitySignpost();
    if (route === "client-specialty") renderClientSpecialty();
    if (route === "client-meeting") syncPickedAgreement();
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
        clearApproachHold();
      }
      setNavMode(route); /* keep glass nav over trailhead/funnel photos — never sticky "page" */
      syncGuideRoute(route);
      state.moving = false;
      renderDynamic(route, params);
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
      if (opts.hash && opts.hash !== route) {
        var anchor = document.getElementById(opts.hash);
        if (anchor) setTimeout(function () { anchor.scrollIntoView({ block: "start" }); }, 0);
      }
      try {
        var routeKey = route;
        if (params.id) routeKey = "job/" + params.id;
        if (params.slug) routeKey = "blog/" + params.slug;
        setRouteHash(routeKey, {
          fromHistory: !!opts.fromHistory,
          replace: !!opts.replaceHash
        });
      } catch (e) {}

      if ((route === "physician" || route === "client") && !opts.afterApproach) {
        next.classList.add("signs-lit", "signs-frozen");
        /* Back/Forward (and any non-swoop land): hire-sheet stays opacity:0 without picker-in. */
        if (!state.approachHold) {
          next.classList.add("picker-in", "after-approach");
        }
        layoutSignMediaFrames();
      }

      if (route === "home") startHomeVideo();
      else if (!opts.afterApproach && !state.approachHold) clearSettleWatch();
      /* afterApproach: keep timeupdate ease-out alive through the last half-second */
      if (route === "confirm-mess") {
        var m = document.getElementById("mess-response-mock");
        /* Default markup already says "Captured" — use "When" row as freshness signal */
        if (m && m.innerHTML.indexOf("When") === -1) stampMess("physician", "Switchboard / contact interest");
      }
      if (route === "confirm-client") {
        var c = document.getElementById("mess-client-mock");
        var bd = state.clientBd;
        var ownerChip = document.getElementById("confirm-bd-owner-chip");
        var routeNote = document.getElementById("confirm-bd-route-note");
        if (ownerChip && bd && bd.ownerLabel) {
          ownerChip.innerHTML = '<span class="dot"></span> BD Hub · ' + bd.ownerLabel;
        }
        if (routeNote) {
          routeNote.textContent = bd && bd.state
            ? (bd.state + " · owner " + bd.ownerName + " · CC Mike · David · Randy")
            : "";
        }
        if (c && !c.innerHTML.trim()) {
          var messLine = bd
            ? ("Meeting request · " + bd.state + " · " + bd.ownerName + " → BD Hub · CC Randy/Mike/David")
            : "Meeting request → BD Hub";
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
  var CLIENT_SIGN_SPEC_IDS = ["fm", "obg", "gi", "neuro", "dental", "other"];

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
      var btn = e.target.closest("[data-specialty-pick]");
      if (!btn) return;
      var id = btn.getAttribute("data-specialty-pick");
      if (id.indexOf("custom:") === 0) {
        state.specialty = id;
        state.specialtyCustom = id.slice(7);
      } else {
        state.specialty = id;
        state.specialtyCustom = null;
      }
      closeSpecialtyOtherPop();
      go("physician-rank", { trail: true });
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
        state.clientSpecialty = csid;
        state.clientSpecialtyCustom = null;
        if (!state.facility) state.facility = "fqhc";
        try { closeClientSpecOtherPop(); } catch (err) {}
        go("client-retained", { trail: true, instant: true });
      }, true);
    });
  }

  function renderClientSpecialty() {
    var label = $("#client-spec-fac-label");
    var fac = null;
    try {
      fac = AMP_CONTENT.facilities.find(function (f) { return f.id === state.facility; });
    } catch (e) {}
    var name = (state.facility === "other" && state.facilityCustom)
      ? state.facilityCustom
      : (fac && fac.label) || "your facility";
    if (label) label.textContent = "Facility · " + name;
    var grid = $("#client-spec-grid");
    if (grid) {
      /* legacy grid path */
      var specs = (AMP_CONTENT.specialties || []).slice(0, 6);
      grid.innerHTML = specs.map(function (s) {
        return '<button type="button" class="card client-spec-card" data-client-spec="' + s.id + '">' +
          "<h3>" + s.label + "</h3><p>" + (s.blurb || "") + "</p></button>";
      }).join("");
    }
    /* hire-sheet path uses static data-client-spec cards in HTML */
    bindClientHireSheetClicks();
  }

  function openClientSpecOtherPop() {
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
      var btn = e.target.closest("[data-client-spec-pick]");
      if (!btn) return;
      var id = btn.getAttribute("data-client-spec-pick");
      if (id.indexOf("custom:") === 0) {
        state.clientSpecialty = id;
        state.clientSpecialtyCustom = id.slice(7);
      } else {
        state.clientSpecialty = id;
        state.clientSpecialtyCustom = null;
      }
      closeClientSpecOtherPop();
      go("client-retained", { trail: true });
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

  function renderRankStep() {
    var root = $("#rank-grid");
    if (!root) return;
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
    /* Light lift: stack by target selection first, then toggle class next frame so translateY can ease. */
    var svg = root.querySelector(".amp-region-map");
    if (svg) {
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
    if (svg) {
      void svg.getBoundingClientRect();
      requestAnimationFrame(function () { requestAnimationFrame(paint); });
    } else {
      paint();
    }
    var labels = {};
    AMP_CONTENT.regions.forEach(function (r) { labels[r.id] = r.label; });
    var chips = root.querySelector("#region-chips");
    if (chips) chips.innerHTML = picked.length
      ? picked.map(function (id) { return '<span class="region-chip">' + (labels[id] || id) + '</span>'; }).join("")
      : '<span class="region-chip empty">No regions yet</span>';
    var cont = root.querySelector("#region-continue");
    if (cont) cont.disabled = picked.length === 0;
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

  function guidePathStamp() {
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
    return "<aside class=\"jobs-soft-bench\" aria-label=\"Beyond the posted trail\"><span class=\"tag\">Beyond the posted trail</span><p>These are the roles we post. Guides also hold matches we don’t list.</p><button type=\"button\" class=\"linkish jobs-soft-bench-cta\" data-guide-whisper=\"1\">Talk to a guide <span aria-hidden=\"true\">→</span></button></aside>";
  }

  function jobsMpcEmpty() {
    var path = guidePathStamp();
    return "<article class=\"jobs-mpc-empty panel panel-glow\" aria-live=\"polite\"><span class=\"tag\">MPC · candidate catch-all</span><h3>Nothing posted for this cut — tailor a search.</h3><p>Market Prime Candidate is the catch-all when posted roles don’t fit. Tailor a search with a guide; your note lands in The Mess Responses. Client pay-per-CV / telescope stays parked until CV bank.</p><p class=\"jobs-path-stamp\">Your path: " + path + "</p><div class=\"btn-row\"><button type=\"button\" class=\"btn btn-primary\" data-go=\"mpc\">Tailor a search with a guide</button><button type=\"button\" class=\"btn btn-ghost\" data-guide-whisper=\"1\">Talk to a guide</button><button type=\"button\" class=\"btn btn-ghost\" data-chat=\"talk\">Open the Mess</button></div></article>";
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
      return '<button class="card" type="button" data-job="' + j.id + '">' +
        '<span class="tag">' + j.code + '</span><h3>' + j.title + '</h3><p>' + j.sub + '</p>' +
        '<div class="meta">View tease →</div></button>';
    }).join("") + (jobs.length < 8 ? jobsSoftBench() : "");
    if (jobs.length < 8 || state.jobViews >= 2) whisperJobsGuide();
  }

  
  function recruiterFirstName(rec) {
    var n = (rec && rec.name) ? String(rec.name).trim() : "";
    if (!n) return "your guide";
    return n.split(/\s+/)[0];
  }

  function jobById(id) {
    return AMP_CONTENT.jobs.find(function (j) { return j.id === id; }) || AMP_CONTENT.jobs[0];
  }

  function renderJob(id) {
    state.jobViews = (state.jobViews || 0) + 1;
    state.jobId = id;
    var j = jobById(id);
    var root = $("#job-root");
    if (!root) return;
    var bullets = j.bullets.map(function (b) {
      return "<li><strong>" + b.k + ":</strong> " + b.v + "</li>";
    }).join("");
    var jsonLd = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: j.title,
      identifier: j.code,
      hiringOrganization: { "@type": "Organization", name: "Adaptive Medical Partners" },
      jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: "Midwest", addressCountry: "US" } },
      description: "Tease only. Full package on a confidential call with " + j.recruiter.name + ".",
      baseSalary: { "@type": "MonetaryAmount", currency: "USD", value: { "@type": "QuantitativeValue", minValue: 812000, unitText: "YEAR" } }
    };
    root.innerHTML =
      '<div class="job-layout">' +
        '<div>' +
          '<div class="job-hero"><img src="' + j.hero + '" alt="Lifestyle / community hero"><div class="badge">Lifestyle hero · not a facility dump</div></div>' +
          '<div class="panel mt-16">' +
            '<span class="pill">' + j.code + '</span>' +
            '<h2 style="margin:10px 0 6px;font-size:26px;letter-spacing:-.03em">' + j.title + '</h2>' +
            '<p class="muted" style="margin:0 0 8px">' + j.sub + '</p>' +
            '<ul class="bullets">' + bullets + '</ul>' +
            '<p class="gate-note">Full package lives on a brief call — not dumped on this page on purpose. CME, commencement, PTO stacks, and named facility details stay gated.</p>' +
            '<div class="btn-row">' +
              '<button class="btn btn-primary" type="button" data-go="job-contact" data-trail="1">Tap to Talk / Text / Email</button>' +
              '<button class="btn btn-dark" type="button" data-go="chat" data-trail="1">Open chatbot switchboard</button>' +
            '</div>' +
            '<div class="dest-row"><span class="dest-chip mess"><span class="dot"></span> Lands in The Mess Responses</span></div>' +
          '</div>' +
          '<details class="seo-drawer"><summary>Page details · Meta / OG / JobPosting data</summary>' +
            '<pre>' +
              'Title: ' + j.title + '\n' +
              'Meta description: Confidential ' + (j.specialtyLabel || 'physician') + ' opportunity tease — schedule, practice pace, and public income band. Full package with ' + j.recruiter.name + '.\n' +
              'OG:type=article · OG:title=' + j.title + '\n\n' +
              JSON.stringify(jsonLd, null, 2) +
            '</pre></details>' +
        '</div>' +
        '<aside class="panel">' +
          '<h3 style="margin:0 0 8px">Your guide</h3>' +
          '<p style="margin:0 0 4px;font-weight:700">' + j.recruiter.name + '</p>' +
          '<p class="muted" style="margin:0 0 12px;font-size:13px">Owner recruiter for ' + j.code + '</p>' +
          '<a class="btn btn-primary" style="width:100%;margin-bottom:8px" href="tel:+1' + j.recruiter.phone.replace(/-/g, "") + '">Call ' + j.recruiter.phone + '</a>' +
          '<button class="btn btn-dark" type="button" style="width:100%;margin-bottom:8px" data-chat="text">Text ' + recruiterFirstName(j.recruiter) + '</button>' +
          '<a class="btn btn-ghost" style="width:100%" href="mailto:' + j.recruiter.email + '?cc=' + encodeURIComponent(j.recruiter.cc) + '&subject=' + encodeURIComponent("Interest in " + j.code) + '">Email · CC inquire@</a>' +
          '<p class="muted mt-16" style="font-size:12px">CC always includes inquire@adaptivemedicalpartners.com so capture is never a dead end.</p>' +
        '</aside>' +
      '</div>';
  }

  function renderJobContact(id) {
    var j = jobById(id || state.jobId);
    state.jobId = j.id;
    var who = $("#contact-job-who");
    if (who) who.textContent = j.recruiter.name + " · " + j.code;
    var phone = $("#contact-job-phone");
    if (phone) {
      phone.href = "tel:+1" + j.recruiter.phone.replace(/-/g, "");
      phone.textContent = "Call " + j.recruiter.phone;
    }
    var sms = $("#contact-job-sms");
    if (sms) { sms.removeAttribute("href"); sms.setAttribute("data-chat", "text"); sms.textContent = "Text " + recruiterFirstName(j.recruiter); }
    var talkBtn = document.querySelector('.chat-actions [data-chat="talk"]');
    if (talkBtn) talkBtn.textContent = "Talk to " + recruiterFirstName(j.recruiter) + " · " + j.code;

    var mail = $("#contact-job-mail");
    if (mail) mail.href = "mailto:" + j.recruiter.email + "?cc=" + encodeURIComponent(j.recruiter.cc) + "&subject=" + encodeURIComponent("Interest · " + j.code);
    var crumb = $("#contact-job-crumb");
    if (crumb) crumb.setAttribute("data-go", "job/" + j.id);
    var chatCrumb = $("#chat-job-crumb");
    if (chatCrumb) chatCrumb.setAttribute("data-go", "job/" + j.id);
    var ret = $("#confirm-return-job");
    if (ret) ret.setAttribute("data-go", "job/" + j.id);
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
        ? "Sample unlock · pay-per-CV example ($49/view illustrative)"
        : "Sample unlock · monthly example ($99–149/mo illustrative)";
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
    echo.textContent = "Your soft pitch: " + parts.join(" · ") + " — illustrative only, not sent.";
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

    function rankHoverMeta(clientX) {
      var cards = Array.prototype.slice.call(root.querySelectorAll("[data-rank]"));
      var others = cards.filter(function (c) {
        return c.getAttribute("data-rank") !== rankDragId;
      });
      if (!others.length) return null;

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
        if (clientX >= r.left && clientX <= r.right) {
          return pack(el, false, "swap");
        }
      }

      var first = others[0];
      var last = others[others.length - 1];
      var fr = first.getBoundingClientRect();
      var lr = last.getBoundingClientRect();
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
      var meta = rankHoverMeta(e.clientX);
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
        bio: "Public org site / leadership page · illustrative link",
        openPay: "—",
        referrer: "amp.example / hiring door · sample UTM",
        device: "Desktop · America/Chicago · sample",
        soft: "Org signals · public web hint · illustrative"
      };
    } else {
      state.enrichBundle = {
        geo: sampleBrowseGeo(),
        npi: "Possible NPI match · " + spec + " · illustrative",
        license: "License board · " + regionLabel + " · status unchecked (sample)",
        bio: "Public clinic bio / Healthgrades-style hit · illustrative",
        openPay: "OpenPayments · no pull yet · placeholder",
        referrer: "Job tease OBG-8449 · utm_source=site · sample",
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

  function syncGuideRoute(route) {
    var root = $("#amp-guide");
    if (!root) return;
    if (route === "chat") {
      closeGuideDock(true);
      root.hidden = true;
    } else {
      root.hidden = false;
    }
  }
  function closeMobileNav() { var drawer = $("#mobile-nav-drawer"), backdrop = $(".mobile-nav-backdrop"), toggle = $("[data-mobile-nav-toggle]"); if (drawer) drawer.hidden = true; if (backdrop) backdrop.hidden = true; if (toggle) { toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Open menu"); } }
  function openMobileNav() { var drawer = $("#mobile-nav-drawer"), backdrop = $(".mobile-nav-backdrop"), toggle = $("[data-mobile-nav-toggle]"); if (!drawer) return; drawer.hidden = false; if (backdrop) backdrop.hidden = false; if (toggle) { toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Close menu"); } var first = drawer.querySelector("button[data-go]"); if (first) window.setTimeout(function () { first.focus(); }, 0); }
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
      if (guideWhisper) { e.preventDefault(); stampGuidePath(); openGuideDock(); return; }
      if (raw.closest("[data-guide-close]")) { closeGuideDock(); return; }
      var guideRoot = $("#amp-guide");
      var guideDock = $("#amp-guide-dock");
      if (guideRoot && !guideRoot.hidden && guideDock && !guideDock.hidden && !raw.closest("#amp-guide")) closeGuideDock();
      var t = raw.closest("[data-go]");
      if (t) {
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
        if (route === "mi-lite-app") {
          var miPlan = document.querySelector('input[name="mi-lite-plan"]:checked');
          state.miLitePlan = miPlan ? miPlan.value : (state.miLitePlan || "monthly");
          state.miLiteUnlocked = true;
          try {
            sessionStorage.setItem("amp-mi-lite-unlocked", "1");
            sessionStorage.setItem("amp-mi-lite-plan", state.miLitePlan);
          } catch (err) {}
          if (typeof stampMess === "function") stampMess("client", "MI Lite sample unlock · " + state.miLitePlan + " → BD Hub");
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
        state.clientSpecialty = csid;
        state.clientSpecialtyCustom = null;
        if (!state.facility) state.facility = "fqhc";
        try { closeClientSpecOtherPop(); } catch (err) {}
        /* Contract options next — Summit Clear / Shared Ascent */
        go("client-retained", { trail: true, instant: true });
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
        if (chatOpt.closest("#amp-guide")) closeGuideDock();
        handleChat(chatOpt.getAttribute("data-chat"));
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
        if (toast2) toast2.textContent = "Full access is illustrative — example monthly or per-CV pricing on the gate. Nothing is charged here.";
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


  /* #4 Client form → BD Hub by territory (Randy official lock 2026-09-09). CC Randy on ALL BD leads (+ Mike + David). */
  var BD_AARON_STATES = { TX:1, CA:1 };
  var BD_BRENTON_STATES = { GA:1, AL:1, TN:1, KY:1 }; /* WV not in this lock */
  var BD_ZACH_STATES = { IL:1, MO:1, IA:1, KS:1, NE:1 };
  var BD_OWNER_META = {
    aaron: { id: "aaron", name: "Aaron Wagner", label: "Aaron Wagner · TX + CA" },
    zach: { id: "zach", name: "Zach Hamann", label: "Zach Hamann · IL/MO/IA/KS/NE" },
    brenton: { id: "brenton", name: "Brenton McMahan", label: "Brenton McMahan · GA/AL/TN/KY" },
    kelley: { id: "kelley", name: "Kelley Lobona", label: "Kelley Lobona · catch-all" }
  };
  function resolveBdOwner(stateCode) {
    var st = String(stateCode || "").toUpperCase().trim();
    if (!st) return null;
    if (BD_AARON_STATES[st]) return BD_OWNER_META.aaron;
    if (BD_BRENTON_STATES[st]) return BD_OWNER_META.brenton;
    if (BD_ZACH_STATES[st]) return BD_OWNER_META.zach;
    return BD_OWNER_META.kelley;
  }
  function syncClientBdRoutePreview() {
    var sel = $("#client-meeting-state");
    var chip = $("#client-bd-owner-chip");
    var note = $("#client-bd-route-note");
    if (!sel || !chip) return;
    var owner = resolveBdOwner(sel.value);
    if (!owner) {
      chip.innerHTML = '<span class="dot"></span> Pick a state';
      if (note) note.textContent = "Territory route · Randy lock · always CC Randy · Mike · David.";
      return;
    }
    chip.innerHTML = '<span class="dot"></span> ' + owner.label;
    if (note) {
      note.textContent = owner.id === "kelley"
        ? "Catch-all (unowned state) · always CC Randy · Mike · David"
        : "BD Hub Responses · always CC Randy · Mike · David";
    }
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
          cc: ["Randy Keeth", "Mike Freeman", "David Fontenot"]
        };
        stampMess(
          "client",
          (fd.get("name") || "Client") + " · " + stCode + " · " + owner.name + " · " + agreeLabel + " → BD Hub · CC Randy/Mike/David"
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
          stampMess("client", who + " · general contact → BD Hub");
          go("confirm-client", { trail: true });
        } else {
          stampMess("physician", who + " · general contact → The Mess Responses");
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
    var miForm = $("#mi-lite-form");
    if (miForm) miForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var spec = $("#mi-lite-specialty"), result = $("#mi-lite-result"), title = $("#mi-lite-result-title"), copy = $("#mi-lite-result-copy");
      var picks = $all("#mi-lite-regions input:checked").map(function (input) { return input.nextElementSibling ? input.nextElementSibling.textContent : input.value; });
      if (title) title.textContent = (spec && spec.options[spec.selectedIndex] ? spec.options[spec.selectedIndex].text : "Your specialty") + " · ridge snapshot";
      if (copy) copy.textContent = "Example signal for " + (picks.length ? picks.join(" + ") : "open region hints") + ". Directional only—use a guide conversation to test the real week, place, and contract.";
      if (result) result.hidden = false;
    });
    var miAppForm = $("#mi-lite-app-form");
    if (miAppForm) miAppForm.addEventListener("submit", function (e) {
      e.preventDefault();
      updateMILiteDashboard();
    });
    $all('input[name="mi-lite-plan"]').forEach(function (input) {
      input.addEventListener("change", function () {
        state.miLitePlan = input.value;
        $all('input[name="mi-lite-plan"]').forEach(function (other) {
          var card = other.closest(".mi-price-card");
          if (card) card.classList.toggle("is-selected", other.checked);
        });
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

  function handleChat(opt) {
    var log = $("#chat-log");
    var chatView = document.querySelector('.view.on[data-route="chat"]');
    /* The SPA keeps chat markup mounted while hidden; route before handling dock actions. */
    if (!log || !chatView) { go("chat", { instant: true }); setTimeout(function () { handleChat(opt); }, 0); return; }
    var labels = {
      talk: state.guidePathText ? "I want to talk to a guide about " + state.guidePathText : "I want to talk to Amy about OBG-8449",
      text: "Text me about this role",
      email: "Email is better for me",
      other: "I have a different question"
    };
    log.innerHTML += '<div class="bubble me">' + (labels[opt] || opt) + "</div>";
    setTimeout(function () {
      log.innerHTML += '<div class="bubble bot">Got it. Routing your interest to <strong>The Mess Responses</strong> for the owner recruiter. Prefer a form? Use Tap to Talk — same destination.</div>';
      log.scrollTop = log.scrollHeight;
      var row = $("#chat-confirm-row");
      if (row) row.classList.remove("hidden");
    }, 450);
  }

  function renderBlogIndex() {
    var root = $("#blog-index-grid");
    if (!root) return;
    root.innerHTML = AMP_CONTENT.posts.map(function (p) {
      return '<button class="card" type="button" data-blog="' + p.slug + '">' +
        '<span class="tag">' + p.mins + " min read</span>" +
        "<h3>" + p.title + "</h3><p>" + p.meta + "</p>" +
        '<div class="meta">' + p.tags.join(" · ") + "</div></button>";
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
       /job/{slug}               → job/{slug}
       /blog-posts/{slug}        → blog/{slug}
     Other SPA views use /{data-route}. Old #hash links still boot, then upgrade to path.
  */
  var GH_PAGES_BASE = "/amp-range-preview-k9m3";

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
    "easy-pay-authorization": "form-easy-pay"
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
    "form-easy-pay": "/easy-pay-authorization"
  };

  function detectBasePath() {
    var p = location.pathname || "/";
    if (p === GH_PAGES_BASE || p.indexOf(GH_PAGES_BASE + "/") === 0) return GH_PAGES_BASE;
    return "";
  }

  function normalizeRouteAlias(key) {
    if (key === "residents-fellows") return "residents";
    if (key === "market-intelligence" || key === "mi") return "mi-lite";
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

  function locationToRouteKey() {
    var pathKey = pathnameToRouteKey(location.pathname);
    var hash = (location.hash || "").replace(/^#/, "");
    if (hash) hash = normalizeRouteAlias(hash);
    var pathIsHome = !pathKey || pathKey === "home";
    /* Prefer real path doors; only fall back to hash for old links on home/index. */
    if (!pathIsHome) return pathKey;
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
    var full = url + search;

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
    /* Coalesce double hashchange+popstate on Back/Forward across pushState entries. */
    if (opts.fromHistory && _ampLastBootHash === key) return;
    _ampLastBootHash = key;
    var nav = { instant: true, fromHistory: !!opts.fromHistory, replaceHash: !opts.fromHistory };
    if (key.indexOf("job/") === 0 || key.indexOf("blog/") === 0 || key.indexOf("blog-posts/") === 0) {
      go(key, nav);
    } else if (document.querySelector('.view[data-route="' + key + '"]')) {
      go(key, nav);
    } else {
      go("home", nav);
      key = "home";
    }
    /* Upgrade legacy #hash on home path to a real pathname (prefer path). */
    if (location.protocol !== "file:" && location.hash) {
      try { setRouteHash(key, { replace: true }); } catch (e2) {}
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { bindClientHireSheetClicks(); } catch (e) {}
    window.addEventListener("resize", layoutSignMediaFrames);
    window.addEventListener("orientationchange", layoutSignMediaFrames);
    bind();
    renderBlogIndex();
    bootFromHash({ fromHistory: true });
    /* popstate is the BF spine; hashchange kept for deep-link/manual hash edits, guarded above. */
    window.addEventListener("hashchange", function () {
      bootFromHash({ fromHistory: true });
    });
    window.addEventListener("popstate", function () {
      bootFromHash({ fromHistory: true });
    });
  });

  window.AMPRegionMap = { render: renderRegionMap, normalizeState: normalizeRegionState };
  window.AMP = { go: go, state: state, settleHome: settleHome };
})();
