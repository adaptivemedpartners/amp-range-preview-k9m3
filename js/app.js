/* AMP Mountain Site — SPA router + video settle + shared trail transitions */
(function () {
  "use strict";
  window.__AMP_BUILD = "2159-v3-home-fullbleed-shimmer";    /* Imagine winner lock 2026-09-09 ~12:49 CT: whole ~6s clip; HTML picker soft-fades late. */
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
    clientNeeds: [],
    clientNeedNote: "",
    clientDiscussTopics: [],
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
      tag: "Hiring consult",
      title: "Talk with a hiring guide",
      blurb: "A hiring guide owns the next step."
    },
    "shared-ascent": {
      tag: "Hiring consult",
      title: "Talk with a hiring guide",
      blurb: "A hiring guide owns the next step."
    },
    "mpc": {
      tag: "MPC · tailored search",
      title: "MPC tailor-search",
      blurb: "When nothing posted fits, a recruiting guide opens a tailored search with you."
    },
    "market-analysis": {
      tag: "Hiring consult",
      title: "Talk with a hiring guide",
      blurb: "Leave a short note. Your hiring guide will follow up."
    }
  };

  var CLIENT_NEED_META = {
    volume: { id: "volume", label: "Difficulty getting candidate volume" },
    convert: { id: "convert", label: "We get candidates but can’t close / convert" },
    interviews: { id: "interviews", label: "Interviews take too many cycles / wrong people reach leadership" },
    vacancy: { id: "vacancy", label: "Role stays open too long / vacancy burn" },
    confidential: { id: "confidential", label: "Confidential / competitive search needs a quieter approach" },
    story: { id: "story", label: "Need help telling the opportunity story (marketing/preview)" },
    brief: { id: "brief", label: "Not sure which seats to prioritize / brief is fuzzy" },
    other: { id: "other", label: "Something else" }
  };

  function clientNeedLabels() {
    return (state.clientNeeds || []).map(function (id) {
      var meta = CLIENT_NEED_META[id];
      return meta ? meta.label : id;
    }).filter(Boolean);
  }

  function clientNeedsStamp() {
    var labels = clientNeedLabels();
    var extra = String(state.clientNeedNote || "").trim();
    var line = labels.join("; ");
    if (extra) line += (line ? " — " : "") + extra;
    return line;
  }

  function clientContextBits() {
    var bits = [];
    try {
      var fac = (AMP_CONTENT.facilities || []).find(function (f) { return f.id === state.facility; });
      if (fac) bits.push(fac.label);
      else if (state.facility === "other" && state.facilityCustom) bits.push(state.facilityCustom);
    } catch (e) {}
    if (state.clientSpecialties && state.clientSpecialties.length) {
      bits.push(state.clientSpecialties.map(clientSpecLabel).filter(Boolean).join(", "));
    } else if (state.clientSpecialty) {
      bits.push(clientSpecLabel(state.clientSpecialty));
    }
    if (state.clientState) bits.push(state.clientState);
    if (state.clientBd && state.clientBd.ownerName) bits.push(state.clientBd.ownerName);
    return bits;
  }

  function writeClientMeetingFields() {
    var needsField = $("#meeting-needs");
    var noteField = $("#meeting-need-note");
    var regionField = $("#meeting-region");
    var agreeField = $("#meeting-agreement");
    if (needsField) needsField.value = (state.clientNeeds || []).join(",");
    if (noteField) noteField.value = String(state.clientNeedNote || "").trim();
    if (regionField) regionField.value = state.clientState || state.clientRegion || "";
    if (agreeField) agreeField.value = "";
    state.agreement = null;
  }

  function applyClientMeetingNote() {
    var note = document.querySelector("#client-meeting-form textarea[name=\"note\"]");
    if (!note) return;
    var stamp = clientNeedsStamp();
    var region = state.clientState || "";
    var owner = state.clientBd && state.clientBd.ownerName ? state.clientBd.ownerName : "";
    var lines = [];
    if (stamp) lines.push("Hiring focus: " + stamp);
    if (region) lines.push("Region: " + region + (owner ? " · " + owner : ""));
    var prefix = lines.join("\n");
    var current = String(note.value || "");
    if (!current.trim()) {
      note.value = prefix;
      return;
    }
    if (current.indexOf("Hiring focus:") === 0 || current.indexOf("Region:") === 0) {
      var rest = current.replace(/^(Hiring focus:.*\n?)?(Region:.*\n?)?/, "").replace(/^\n+/, "");
      note.value = prefix + (rest ? "\n" + rest : "");
    }
  }

  function syncPickedAgreement() {
    syncPickedNeeds();
  }

  function syncPickedNeeds() {
    writeClientMeetingFields();
    applyClientMeetingNote();
    var box = $("#picked-agreement");
    var tag = $("#picked-agreement-tag");
    var title = $("#picked-agreement-title");
    var blurb = $("#picked-agreement-blurb");
    var stamp = clientNeedsStamp();
    var bits = clientContextBits();
    if (!box) return;
    if (!stamp && !bits.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (tag) tag.textContent = "What you asked to talk through";
    if (title) title.textContent = stamp ? "Hiring focus" : "Your search";
    if (blurb) {
      var parts = [];
      if (stamp) parts.push(stamp);
      if (bits.length) parts.push(bits.join(" · "));
      blurb.textContent = parts.join(" · ");
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
          /* 2133: no mountain freeze */ img.removeAttribute("src"); img.classList.add("pro-still");
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
    /* amp-build:2133-no-mountain — do not paint mountain freeze frames */
    if (typeof done === "function") done();
    return;
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
          /* 2133: no mountain freeze */ img.removeAttribute("src"); img.classList.add("pro-still");
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
      live.classList.add("after-approach", "picker-in", "signs-lit");
      live.classList.remove("live-video-bg");
      /* 2133: professional navy still under picker — no live mountain video */
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
  var HOME_VIDEO_SRC = ""; /* 2133: mountain approach video removed */

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
    /* amp-build:2133-no-mountain — skip mountain swoop video; land route chrome immediately */
    state._approachRoute = approachRoute || "physician";
    var NO_MOUNTAIN_APPROACH = true;
    if (NO_MOUNTAIN_APPROACH) {
      var stageSkip = $("#home-stage");
      if (stageSkip) {
        stageSkip.classList.add("approach-ghost", "settled");
        stageSkip.classList.remove("playing");
      }
      showBakedTrailheadStill(function () {
        if (typeof done === "function") done();
      });
      return;
    }
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

  /* EXAMPLE purchase regions for Market Intelligence packages — refine later OK */
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
    populateRidgeDemoPickers();
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
    syncRidgeExtraOffer();
  }

  function isRidgePaidSeat(seat) {
    var api = ridgeAccess();
    seat = seat || (api && api.getSeat());
    if (api && api.isPaid) return !!api.isPaid(seat);
    return !!(seat && (seat.tier === "state" || seat.tier === "region" || seat.tier === "national") && seat.grantedByCheckout);
  }

  function ridgeCanGrantExtra(seat) {
    var api = ridgeAccess();
    seat = seat || (api && api.getSeat());
    if (api && api.canGrantExtraPoll) return !!api.canGrantExtraPoll(seat);
    return isRidgePaidSeat(seat);
  }

  function ridgeCanBuyExtra(seat) {
    var api = ridgeAccess();
    seat = seat || (api && api.getSeat());
    if (api && api.canBuyExtraPoll) return !!api.canBuyExtraPoll(seat);
    return ridgeCanGrantExtra(seat) && api && api.pollsLeft && api.pollsLeft(seat) <= 0;
  }

  function syncRidgeExtraOffer(seat) {
    var api = ridgeAccess();
    seat = seat || (api && api.getSeat());
    var showBuy = ridgeCanBuyExtra(seat);
    var showSim = ridgeCanGrantExtra(seat);
    var extraCard = $("#ridge-extra-poll-card");
    var extraBuy = $("#ridge-extra-poll-buy");
    var extraCta = $("#ridge-extra-poll-cta");
    var extraUnit = $("#ridge-unit-extra");
    var extraSim = $("#ridge-simulate-extra");
    if (extraCard) extraCard.hidden = !showBuy;
    if (extraBuy) {
      extraBuy.hidden = !showBuy;
      extraBuy.disabled = !showBuy;
      extraBuy.setAttribute("aria-disabled", showBuy ? "false" : "true");
    }
    if (extraCta) extraCta.hidden = !showBuy;
    if (extraUnit && extraUnit.hidden === false && !showBuy) extraUnit.hidden = true;
    if (extraSim) extraSim.hidden = !showSim;
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
        console.warn("Market Intelligence workbench", err);
      }
    }
  }

  function ridgeAccess() {
    return window.AMPRidgeAccess || null;
  }

  function applyMiLiteLockUI() {
    var api = ridgeAccess();
    var seat = api ? api.getSeat() : { tier: "demo" };
    var dash = $("#mi-lite-dashboard");
    var meat = $("#mi-lite-dashboard-meat");
    var blur = $("#mi-lite-blur-overlay");
    var lockBanner = $("#mi-lite-lock-banner");
    var openBanner = $("#mi-lite-open-banner");
    var toolbar = $("#mi-lite-toolbar");
    var paid = api ? api.isPaid(seat) : false;
    if (dash) {
      dash.classList.remove("is-locked");
      dash.classList.add("mi-lite-dashboard");
      dash.setAttribute("data-ridge-tier", seat.tier || "demo");
    }
    /* Unit-gated surface stays visible; overlay is denial-only, not a whole-dash blur. */
    if (blur) blur.hidden = true;
    if (lockBanner) lockBanner.hidden = true;
    if (openBanner) openBanner.hidden = false;
    if (toolbar) toolbar.hidden = false;
    if (meat) meat.setAttribute("aria-hidden", "false");
    renderRidgeAccessChrome(seat, paid);
    applyRidgeWalkGate();
  }

  function renderRidgeOpenUnits(seat, reallyPaid) {
    var host = $("#ridge-open-units");
    var api = ridgeAccess();
    if (!host || !api) return;
    var units = api.openUnits ? api.openUnits(seat) : [];
    if (!units.length || (seat && seat.tier === "demo")) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }
    var curSpec = "";
    try { curSpec = window.AMPRidgeWorkbench && AMPRidgeWorkbench.getSpecialtyKey ? AMPRidgeWorkbench.getSpecialtyKey() : ""; } catch (e) {}
    curSpec = curSpec || (seat && seat.demoSpecialty) || "";
    var curSt = "";
    try {
      var codes = window.AMPRidgeWorkbench && AMPRidgeWorkbench.getSelectedCodes ? AMPRidgeWorkbench.getSelectedCodes() : [];
      curSt = codes && codes[0] ? codes[0] : "";
    } catch (e2) {}
    curSt = curSt || (seat && (seat.paidState || seat.demoState)) || "";
    host.hidden = false;
    host.innerHTML = units.map(function (u) {
      var spec = u.specialty || "";
      var st = api.normState(u.state || seat.demoState);
      var on = spec === curSpec && st === api.normState(curSt);
      var label = api.specLabel(spec) + " × " + api.stateLabel(st);
      return '<button type="button" class="ridge-unit-chip' + (on ? " is-on" : "") + '" data-ridge-unit-spec="' + spec + '" data-ridge-unit-state="' + st + '">' + label + "</button>";
    }).join("");
  }

  function applyRidgeSimulateVerify() {
    var api = ridgeAccess();
    if (!api || !api.simulateVerify) return;
    var result = api.simulateVerify();
    if (!result.ok) {
      if (result.reason === "walkthrough") jumpToRidgeWalk();
      return;
    }
    hideRidgeDenial();
    applyMiLiteLockUI();
    if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.ensureUnitSelection) AMPRidgeWorkbench.ensureUnitSelection();
    else if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.refresh) AMPRidgeWorkbench.refresh();
    showMiMockToast("Verified sample · +2 specialties in " + (api.stateLabel(result.seat.demoState) || "your demo state") + ".");
    if (!document.querySelector('[data-route="mi-lite-app"].on')) {
      go("mi-lite-app", { trail: true });
    }
  }

  function applyRidgeSimulatePay(sku) {
    var api = ridgeAccess();
    if (!api) return;
    sku = String(sku || "state").replace(/^ridge_/, "");
    if (sku === "extra_poll" && !ridgeCanGrantExtra()) {
      showMiMockToast("Extra poll $9 is only for paid State / Region / National seats.");
      return;
    }
    var region = ($("#mi-lite-region-select") && $("#mi-lite-region-select").value) || "southwest";
    var st = ($("#mi-lite-state-select") && $("#mi-lite-state-select").value) || undefined;
    api.applyPaid({ sku: sku, state: st, region: region });
    hideRidgeDenial();
    applyMiLiteLockUI();
    if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.ensureUnitSelection) AMPRidgeWorkbench.ensureUnitSelection();
    else if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.refresh) AMPRidgeWorkbench.refresh();
    showMiMockToast("Checkout stub · " + sku + " granted (preview). Polls are live.");
    if (!document.querySelector('[data-route="mi-lite-app"].on')) {
      go("mi-lite-app", { trail: true });
    }
  }

  function openRidgeUnitChip(spec, st) {
    var api = ridgeAccess();
    if (!spec) return;
    if (api && api.trySpecialty) api.trySpecialty(spec);
    if (st && api && api.tryState) api.tryState(st);
    try {
      if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.setSpecialtyKey) AMPRidgeWorkbench.setSpecialtyKey(spec);
      if (st && window.AMPRidgeWorkbench && AMPRidgeWorkbench.selectState) AMPRidgeWorkbench.selectState(st);
      if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.refresh) AMPRidgeWorkbench.refresh();
    } catch (e) {}
    applyMiLiteLockUI();
  }

  function renderRidgeAccessChrome(seat, paid) {
    var api = ridgeAccess();
    seat = seat || (api && api.getSeat());
    var copy = api && api.tierCopy ? api.tierCopy(seat) : { tag: "Market Intelligence", title: "Demo", body: "" };
    var tag = $("#ridge-access-tag");
    var title = $("#ridge-access-title");
    var body = $("#ridge-access-body");
    var polls = $("#ridge-poll-meter");
    var verifyBtn = $("#ridge-verify-cta");
    var upgradeBtn = $("#ridge-upgrade-cta");
    var extraBtn = $("#ridge-extra-poll-cta");
    var oneoffBtn = $("#ridge-oneoff-cta");
    if (tag) tag.textContent = copy.tag;
    if (title) title.textContent = copy.title;
    if (body) body.textContent = copy.body;
    var reallyPaid = !!(paid && seat && (seat.tier === "state" || seat.tier === "region" || seat.tier === "national") && seat.grantedByCheckout);
    if (polls) {
      if (reallyPaid && api) {
        polls.hidden = false;
        polls.textContent = api.pollsLeft(seat) + " of " + api.pollLimit(seat) + " left this month";
        polls.classList.toggle("is-empty", api.pollsLeft(seat) <= 0);
      } else {
        polls.hidden = true;
        polls.textContent = "";
      }
    }
    renderRidgeOpenUnits(seat, reallyPaid);
    var simVerify = $("#ridge-simulate-verify-app");
    if (simVerify) simVerify.hidden = !(seat && seat.tier === "demo" && api && api.isDemoCommitted && api.isDemoCommitted(seat));
    var simPay = $("#ridge-sim-pay");
    if (simPay) simPay.hidden = !!(seat && seat.tier === "national" && reallyPaid);
    var tasteHint = $("#ridge-taste-hint");
    if (tasteHint) {
      if (seat && seat.tier === "verified" && api) {
        var usedT = api.tasteSpecialties(seat).length;
        var leftT = Math.max(0, (api.VERIFIED_TASTE_CAP || 3) - usedT);
        tasteHint.hidden = false;
        tasteHint.textContent = leftT
          ? ("Verified: pick " + leftT + " more specialty" + (leftT === 1 ? "" : "s") + " in " + api.stateLabel(seat.demoState) + " from the list. Same state only.")
          : "Verified sample used — 3 tastes in. Subscribe to open another unit.";
      } else {
        tasteHint.hidden = true;
      }
    }
    if (verifyBtn) verifyBtn.hidden = !(seat && seat.tier === "demo");
    if (upgradeBtn) upgradeBtn.hidden = !!(seat && seat.tier === "national" && reallyPaid);
    if (extraBtn) extraBtn.hidden = !ridgeCanBuyExtra(seat);
    if (oneoffBtn) oneoffBtn.hidden = !!reallyPaid;
    syncRidgeExtraOffer(seat);
    var seatLine = $("#ridge-seat-line");
    if (seatLine) {
      if (seat && seat.seat && seat.seat.email) {
        seatLine.hidden = false;
        seatLine.textContent = "Seat · " + seat.seat.org + " · " + seat.seat.email + " · 1 allotment / org seat · no CSV/API in V1";
      } else {
        seatLine.hidden = seat && seat.tier !== "demo";
        if (seat && seat.tier === "demo") seatLine.textContent = "Anonymous demo · org / work email required to verify · 1 allotment per org seat";
      }
    }
  }

  function showRidgeDenial(denial) {
    var overlay = $("#ridge-unit-overlay");
    var title = $("#ridge-unit-title");
    var body = $("#ridge-unit-body");
    var verify = $("#ridge-unit-verify");
    var upgrade = $("#ridge-unit-upgrade");
    var extra = $("#ridge-unit-extra");
    var oneoff = $("#ridge-unit-oneoff");
    if (!overlay) return;
    denial = denial || (ridgeAccess() && ridgeAccess().lastDenial && ridgeAccess().lastDenial());
    var reason = denial && denial.reason;
    overlay.hidden = false;
    if (reason === "verify") {
      if (title) title.textContent = "Demo is locked to 1 state × 1 specialty.";
      if (body) body.textContent = "Verify with name, org, work email, and phone to unlock +2 specialty tastes (3 total). Then a hard paywall.";
      if (verify) verify.hidden = false;
      if (upgrade) upgrade.hidden = false;
      if (extra) extra.hidden = true;
      if (oneoff) oneoff.hidden = true;
    } else if (reason === "paywall") {
      if (title) title.textContent = "Verified sample used — hard paywall.";
      if (body) body.textContent = "Three specialty tastes are in. Subscribe for State / Region / National, or buy a $49 one-off report. Extra poll $9 is only after a paid plan.";
      if (verify) verify.hidden = true;
      if (upgrade) upgrade.hidden = false;
      if (extra) extra.hidden = true;
      if (oneoff) oneoff.hidden = false;
    } else if (reason === "geo") {
      if (title) title.textContent = "Outside your plan geography.";
      if (body) body.textContent = "This state is outside the unlocked AMP region or state. Upgrade geo, or buy a $49 one-off report.";
      if (verify) verify.hidden = true;
      if (upgrade) upgrade.hidden = false;
      if (extra) extra.hidden = true;
      if (oneoff) oneoff.hidden = false;
    } else if (reason === "walkthrough") {
      if (title) title.textContent = "Pick specialty, then state.";
      if (body) body.textContent = "The workbench opens only after you commit one specialty × one state.";
      if (verify) verify.hidden = true;
      if (upgrade) upgrade.hidden = true;
      if (extra) extra.hidden = true;
      if (oneoff) oneoff.hidden = true;
    } else if (reason === "polls") {
      if (title) title.textContent = "No polls left this month.";
      if (body) body.textContent = "A poll is one specialty × state open. Extra poll $9, or upgrade the plan.";
      if (verify) verify.hidden = true;
      if (upgrade) upgrade.hidden = false;
      if (extra) extra.hidden = !ridgeCanBuyExtra();
      if (oneoff) oneoff.hidden = true;
    } else {
      if (title) title.textContent = "Market Intelligence gate";
      if (body) body.textContent = "This unit is locked on the current stair.";
      if (verify) verify.hidden = false;
      if (upgrade) upgrade.hidden = false;
      if (extra) extra.hidden = true;
      if (oneoff) oneoff.hidden = true;
    }
  }

  function hideRidgeDenial() {
    var overlay = $("#ridge-unit-overlay");
    if (overlay) overlay.hidden = true;
  }

  function fillRidgeSpecSelect(sel) {
    if (!sel || !window.AMPRidgeMI || !AMPRidgeMI.SPECIALTIES) return;
    if (sel.options.length > 1) return;
    if (!sel.options.length) {
      var blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "Select a specialty…";
      sel.appendChild(blank);
    }
    AMPRidgeMI.SPECIALTIES.slice(0, 80).forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.key;
      opt.textContent = s.label;
      sel.appendChild(opt);
    });
  }

  function fillRidgeStateSelect(sel) {
    if (!sel || sel.options.length > 1) return;
    RIDGE_US_STATES.forEach(function (row) {
      var opt = document.createElement("option");
      opt.value = row.abbr;
      opt.textContent = row.name + " (" + row.abbr + ")";
      sel.appendChild(opt);
    });
  }

  function ridgeWalkPairs() {
    return [
      { spec: $("#ridge-demo-specialty"), state: $("#ridge-demo-state"), hint: $("#ridge-walk-hint"), open: $all(".ridge-demo-open") },
      { spec: $("#ridge-app-walk-specialty"), state: $("#ridge-app-walk-state"), hint: $("#ridge-app-walk-hint"), open: $all(".ridge-app-walk-open") }
    ];
  }

  function syncRidgeWalkthrough() {
    var api = ridgeAccess();
    var seat = api && api.getSeat();
    var committed = !!(api && api.isDemoCommitted && api.isDemoCommitted(seat));
    ridgeWalkPairs().forEach(function (pair) {
      var spec = pair.spec;
      var st = pair.state;
      if (spec) fillRidgeSpecSelect(spec);
      if (st) fillRidgeStateSelect(st);
      if (committed && seat) {
        if (spec && seat.demoSpecialty) spec.value = seat.demoSpecialty;
        if (st && seat.demoState) st.value = String(seat.demoState).toUpperCase();
      } else {
        if (spec && spec.value && seat && seat.demoSpecialty && spec.value === seat.demoSpecialty && !committed) {
          /* keep in-progress pick */
        }
      }
      var specVal = spec ? spec.value : "";
      var stateVal = st ? st.value : "";
      if (st) st.disabled = !specVal;
      var stepSpec = spec && spec.closest(".ridge-walk-step");
      var stepState = st && st.closest(".ridge-walk-step");
      if (stepSpec) {
        stepSpec.classList.toggle("is-done", !!specVal);
        stepSpec.classList.toggle("is-current", !specVal);
        stepSpec.classList.remove("is-locked");
      }
      if (stepState) {
        stepState.classList.toggle("is-locked", !specVal);
        stepState.classList.toggle("is-current", !!specVal && !stateVal);
        stepState.classList.toggle("is-done", !!specVal && !!stateVal);
      }
      var ready = !!(specVal && stateVal);
      pair.open.forEach(function (btn) {
        btn.disabled = !ready;
        btn.setAttribute("aria-disabled", ready ? "false" : "true");
      });
      if (pair.hint) {
        if (!specVal) pair.hint.textContent = "Step 1 · pick a specialty. The workbench stays closed.";
        else if (!stateVal) pair.hint.textContent = "Step 2 · pick a state to unlock that 1×1.";
        else pair.hint.textContent = "Step 3 · unlock the demo unit. Other specialties and states stay locked.";
      }
    });
  }

  function populateRidgeDemoPickers() {
    syncRidgeWalkthrough();
  }

  function readRidgeWalkPicks() {
    var spec = ($("#ridge-demo-specialty") && $("#ridge-demo-specialty").value)
      || ($("#ridge-app-walk-specialty") && $("#ridge-app-walk-specialty").value)
      || "";
    var st = ($("#ridge-demo-state") && $("#ridge-demo-state").value)
      || ($("#ridge-app-walk-state") && $("#ridge-app-walk-state").value)
      || "";
    return { specialty: spec, state: st };
  }

  function commitRidgeDemoAndOpen() {
    var api = ridgeAccess();
    var picks = readRidgeWalkPicks();
    if (!picks.specialty || !picks.state) {
      syncRidgeWalkthrough();
      jumpToRidgeWalk();
      return false;
    }
    if (api) api.startDemo(picks);
    go("mi-lite-app", { trail: true });
    return true;
  }

  function jumpToRidgeWalk() {
    var door = $("#ridge-demo-door") || $("#ridge-walk-gate");
    var onLanding = document.querySelector('[data-route="mi-lite"].on');
    if (!onLanding) {
      go("mi-lite", { trail: true });
      setTimeout(function () {
        var target = $("#ridge-demo-door");
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
      return;
    }
    if (door && door.scrollIntoView) door.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function applyRidgeWalkGate() {
    var api = ridgeAccess();
    var ready = !!(api && api.isDemoCommitted && api.isDemoCommitted());
    var gate = $("#ridge-walk-gate");
    var dash = $("#mi-lite-dashboard");
    var form = $("#mi-lite-app-form");
    var banner = $("#mi-lite-open-banner");
    if (gate) gate.hidden = ready;
    if (dash) dash.hidden = !ready;
    if (form) form.hidden = !ready;
    if (banner) banner.hidden = !ready;
    return ready;
  }

  function openRidgeCheckout(sku) {
    var api = ridgeAccess();
    sku = String(sku || "").replace(/^ridge_/, "");
    if (sku === "extra_poll" && !ridgeCanBuyExtra()) {
      showMiMockToast("Extra poll $9 is only after a paid State / Region / National allotment is used.");
      return;
    }
    var meta = api && api.SKUS && (api.SKUS[sku] || api.SKUS[String(sku).replace(/^ridge_/, "")]);
    var modal = $("#ridge-checkout-modal");
    if (!modal || !meta) return;
    modal.hidden = false;
    modal.setAttribute("data-ridge-sku", meta.sku.replace(/^ridge_/, ""));
    var title = $("#ridge-checkout-title");
    var amount = $("#ridge-checkout-amount");
    var note = $("#ridge-checkout-note");
    if (title) title.textContent = meta.label;
    if (amount) amount.textContent = meta.kind === "subscription" ? ("$" + meta.amount + " / month") : ("$" + meta.amount + " one-time");
    if (note) {
      note.textContent = "Stripe Checkout is stubbed in V1 (test-mode hook). Simulate success to grant the seat locally. No card is charged.";
    }
    var portalState = $("#mi-lite-state-select");
    var portalRegion = $("#mi-lite-region-select");
    var statePick = $("#ridge-checkout-state");
    var regionPick = $("#ridge-checkout-region");
    var specPick = $("#ridge-checkout-specialty");
    var plan = String(meta.plan || sku);
    if (statePick) {
      if (statePick.options.length <= 1) {
        RIDGE_US_STATES.forEach(function (row) {
          var opt = document.createElement("option");
          opt.value = row.abbr;
          opt.textContent = row.name;
          statePick.appendChild(opt);
        });
      }
      var stateWrap = statePick.closest(".field");
      if (stateWrap) stateWrap.hidden = !(plan === "state" || sku === "oneoff");
      if (portalState && portalState.value) statePick.value = portalState.value;
    }
    if (regionPick) {
      var regionWrap = regionPick.closest(".field");
      if (regionWrap) regionWrap.hidden = plan !== "region";
      if (portalRegion && portalRegion.value) regionPick.value = portalRegion.value;
    }
    if (specPick) {
      if (!specPick.options.length && window.AMPRidgeMI && AMPRidgeMI.SPECIALTIES) {
        AMPRidgeMI.SPECIALTIES.slice(0, 80).forEach(function (s) {
          var opt = document.createElement("option");
          opt.value = s.key;
          opt.textContent = s.label;
          specPick.appendChild(opt);
        });
      }
      var specWrap = specPick.closest(".field");
      if (specWrap) specWrap.hidden = sku !== "oneoff";
    }
  }

  function closeRidgeCheckout() {
    var modal = $("#ridge-checkout-modal");
    if (modal) modal.hidden = true;
  }

  function completeRidgeCheckout() {
    var api = ridgeAccess();
    var modal = $("#ridge-checkout-modal");
    if (!api || !modal) return;
    var sku = modal.getAttribute("data-ridge-sku") || "state";
    if (sku === "extra_poll" && !ridgeCanGrantExtra()) {
      showMiMockToast("Extra poll $9 is only for paid State / Region / National seats.");
      closeRidgeCheckout();
      return;
    }
    api.applyPaid({
      sku: sku,
      state: ($("#ridge-checkout-state") && $("#ridge-checkout-state").value) || ($("#mi-lite-state-select") && $("#mi-lite-state-select").value) || undefined,
      region: ($("#ridge-checkout-region") && $("#ridge-checkout-region").value) || ($("#mi-lite-region-select") && $("#mi-lite-region-select").value) || undefined,
      specialty: ($("#ridge-checkout-specialty") && $("#ridge-checkout-specialty").value) || undefined
    });
    closeRidgeCheckout();
    hideRidgeDenial();
    applyMiLiteLockUI();
    if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.refresh) AMPRidgeWorkbench.refresh();
    showMiMockToast("Checkout stub · " + sku + " granted in this browser (test mode, nothing charged).");
    if (!document.querySelector('[data-route="mi-lite-app"].on')) {
      go("mi-lite-app", { trail: true });
    }
  }

  function showMiMockToast(msg) {
    var toast = $("#mi-lite-mock-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showMiMockToast._t);
    showMiMockToast._t = setTimeout(function () { toast.hidden = true; }, 2800);
  }

  function renderMILiteApp() {
    var api = ridgeAccess();
    var ready = applyRidgeWalkGate();
    renderMILite();
    if (!ready) {
      applyMiLiteLockUI();
      if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.refresh) {
        try { AMPRidgeWorkbench.refresh(); } catch (eHold) {}
      }
      return;
    }
    updateMILiteDashboard();
    applyMiLiteLockUI();
    try {
      var seat2 = api && api.getSeat();
      if (seat2 && window.AMPRidgeWorkbench) {
        if (seat2.demoSpecialty && AMPRidgeWorkbench.getSpecialtyKey && AMPRidgeWorkbench.getSpecialtyKey() !== seat2.demoSpecialty) {
          AMPRidgeWorkbench.setSpecialtyKey(seat2.demoSpecialty);
        }
        if (AMPRidgeWorkbench.ensureUnitSelection) AMPRidgeWorkbench.ensureUnitSelection();
      }
    } catch (eSync) {}
  }

  function renderMILiteLogin() {
    var api = ridgeAccess();
    if (api) api.getSeat();
  }

  function bindWhyAmpProofPairs() {
    var root = document.querySelector('.view[data-route="education"]');
    if (!root) return;
    var nodes = root.querySelectorAll("[data-proof-pair]");
    function setPair(id, on) {
      root.querySelectorAll('[data-proof-pair="' + id + '"]').forEach(function (el) {
        el.classList.toggle("is-paired", !!on);
      });
    }
    nodes.forEach(function (el) {
      if (el.getAttribute("data-proof-bound") === "1") return;
      el.setAttribute("data-proof-bound", "1");
      var id = el.getAttribute("data-proof-pair");
      el.addEventListener("mouseenter", function () { setPair(id, true); });
      el.addEventListener("mouseleave", function () { setPair(id, false); });
      el.addEventListener("focusin", function () { setPair(id, true); });
      el.addEventListener("focusout", function () { setPair(id, false); });
      if (el.classList.contains("why-amp-proof-tile")) {
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", (el.getAttribute("aria-label") || "Jump to matching pillar"));
        el.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var target = root.querySelector('.pillar-card[data-proof-pair="' + id + '"]');
          if (!target) return;
          try {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (eScroll) {
            target.scrollIntoView(true);
          }
          setPair(id, true);
          try { target.focus({ preventScroll: true }); } catch (eFocus) { try { target.focus(); } catch (e2) {} }
        });
        el.addEventListener("keydown", function (ev) {
          if (ev.key !== "Enter" && ev.key !== " ") return;
          ev.preventDefault();
          el.click();
        });
      }
    });
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
    if (route === "client-region") {
      renderClientRegion();
      renderClientOffers();
      bindClientClimbStations();
    }
    if (route === "education") bindWhyAmpProofPairs();
    if (route === "client-meeting") {
      syncPickedNeeds();
      if (state.clientState) {
        var _cms = $("#client-meeting-state");
        if (_cms) _cms.value = state.clientState;
      }
      try { syncClientBdRoutePreview(); } catch (e) {}
    }
    if (route === "blog-post") renderBlogPost(params.slug);
    if (route === "search") renderSearch();
    if (route === "mpc-portal") renderMpcPortal();
    if (route === "mpc-browse") renderMpcBrowse();
    if (route === "form-candidate-authorization" || route === "form-interview-expense") hydrateTypeformEmbeds(route);
    if (route === "form-easy-pay") hydrateEasyPay();
  }

  /* Shared walk-forward for physician AND client funnel hops (Physician Path SoT).
     David UX lock 2026-09-09: BOTH candidate + client paths use the SAME scroll/gate
     come-up as hiring portal Shared Ascent (client-retained second option) — funnel sheet. */
  function go(route, opts) {
    opts = opts || {};
    if (route === "residents-fellows") route = "residents";
    if (route === "client-retained") route = "client-region";
    /* moving lock removed — it was freezing all clicks after a stuck approach */
    state.moving = false;
    if (route === "mi-lite-app") {
      var walkApi = ridgeAccess();
      if (walkApi && walkApi.isDemoCommitted && !walkApi.isDemoCommitted()) {
        route = "mi-lite";
      }
    }
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
        try { paintConfirmClientDiscuss(); } catch (err) {}
        var c = document.getElementById("mess-client-mock");
        var bd = state.clientBd;
        var ownerChip = document.getElementById("confirm-bd-owner-chip");
        var routeNote = document.getElementById("confirm-bd-route-note");
        if (ownerChip && bd && bd.ownerLabel) {
          ownerChip.innerHTML = '<span class="dot"></span> hiring guide · ' + bd.ownerLabel;
        }
        if (routeNote) {
          routeNote.textContent = bd && bd.state
            ? (bd.state + " · hiring guide " + bd.ownerName)
            : "";
        }
        if (c && !c.innerHTML.trim()) {
          var needBit = clientNeedsStamp();
          var messLine = bd
            ? ("Meeting request · " + bd.state + " · " + bd.ownerName + (needBit ? " · " + needBit : "") + " → a hiring guide")
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
      /* amp-build:2124-kpi-jump — pick must set specialty, close pop, advance (same as hire-card Select) */
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

  /* amp-build:2159 — facility/specialty retention cards swap on selection.
     Homepage keeps the 2015 peds story once. FQHC uses 2021 Kansas.
     Critical Access and rural hospital use the 2018 CAH story.
     Family Medicine on step 3 uses that 2018 story; Pediatrics may reuse 2015. */
  var V3_RET = {
    peds2015: {
      img: "assets/story-2015-peds-ne.jpg",
      alt: "Pediatrician who stayed at a Nebraska FQHC",
      year: "2015 · Pediatrician",
      role: "Nebraska FQHC",
      meta: "90 days to identify & place · still serving",
      foot: "11 YEARS LATER. STILL THERE."
    },
    ks2021: {
      img: "assets/story-2021-physician-ks.jpg",
      alt: "Physician who stayed at a Kansas FQHC",
      year: "FQHC fit · 2021",
      role: "Physician · Kansas FQHC",
      meta: "Placed for fit — still serving the same community",
      foot: "YEARS LATER. STILL THERE."
    },
    fm2018: {
      img: "assets/story-2018-fm-ne-cah.jpg",
      alt: "Family Medicine physician who stayed at a Nebraska Critical Access Hospital",
      year: "2018 · Family Medicine",
      role: "Nebraska Critical Access Hospital",
      meta: "174 days to identify & place · still serving",
      foot: "8 YEARS LATER. STILL THERE."
    },
    fm2018cah: {
      img: "assets/story-2018-fm-ne-cah.jpg",
      alt: "Family Medicine physician who stayed at a Nebraska Critical Access Hospital",
      year: "CAH fit · 2018",
      role: "Family Medicine · Nebraska Critical Access Hospital",
      meta: "174 days to identify & place · still serving",
      foot: "8 YEARS LATER. STILL THERE."
    },
    fm2018rural: {
      img: "assets/story-2018-fm-ne-cah.jpg",
      alt: "Family Medicine physician who stayed at a Nebraska Critical Access Hospital",
      year: "Rural hospital fit · 2018",
      role: "Family Medicine · Nebraska Critical Access Hospital",
      meta: "174 days to identify & place · still serving",
      foot: "8 YEARS LATER. STILL THERE."
    },
    proof: {
      img: "assets/home-hero-clinic-consult.jpg",
      alt: "Clinic consult",
      year: "Retention proof",
      role: "87% still there at three years",
      meta: "1.7 avg interviews per hire · rural hospitals, FQHCs, and CAHs",
      foot: "YEARS, NOT PLACEMENTS"
    }
  };

  function v3StoryForFacility(id) {
    if (id === "fqhc") return V3_RET.ks2021;
    if (id === "cah") return V3_RET.fm2018cah;
    if (id === "community") return V3_RET.fm2018rural;
    return V3_RET.proof;
  }

  function v3StoryForSpecialty(id) {
    var s = String(id || "");
    if (!s) return null;
    if (s.indexOf("custom:") === 0) return V3_RET.proof;
    if (s === "fm" || s.indexOf("family_medicine") === 0 || s === "hospitalist_family_medicine") return V3_RET.fm2018;
    if (s.indexOf("pediatr") === 0) return V3_RET.peds2015;
    return V3_RET.proof;
  }

  function paintV3Ctx(root, story) {
    if (!root) return;
    var media = root.querySelector("[data-ctx-media]");
    var year = root.querySelector("[data-ctx-year]");
    var role = root.querySelector("[data-ctx-role]");
    var meta = root.querySelector("[data-ctx-meta]");
    var foot = root.querySelector("[data-ctx-foot]");
    var specialty = root.id === "client-specialty-ctx";
    if (!story) {
      root.classList.add("is-waiting");
      if (media) {
        media.style.backgroundImage = "";
        media.setAttribute("aria-label", "");
      }
      if (year) year.textContent = "Matched retention";
      if (role) role.textContent = specialty ? "Select a specialty" : "Select a facility";
      if (meta) meta.textContent = specialty
        ? "A stay story matched to that specialty appears here."
        : "A stay story matched to that facility type appears here.";
      if (foot) foot.textContent = "STILL THERE.";
      return;
    }
    root.classList.remove("is-waiting");
    if (media) {
      media.style.backgroundImage = "url('" + story.img + "?v=2158')";
      media.setAttribute("aria-label", story.alt || "");
    }
    if (year) year.textContent = story.year;
    if (role) role.textContent = story.role;
    if (meta) meta.textContent = story.meta;
    if (foot) foot.textContent = story.foot;
  }

  function paintClientFacilityCtx() {
    var id = state.facility || "";
    document.querySelectorAll('[data-route="client"] [data-facility]').forEach(function (btn) {
      var on = !!id && btn.getAttribute("data-facility") === id;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    paintV3Ctx($("#client-facility-ctx"), id ? v3StoryForFacility(id) : null);
    var cont = $("#client-facility-continue");
    if (cont) {
      var label = "";
      if (id === "other" && state.facilityCustom) label = state.facilityCustom;
      else if (id && window.AMP_CONTENT && AMP_CONTENT.facilities) {
        var fac = AMP_CONTENT.facilities.find(function (f) { return f.id === id; });
        label = (fac && fac.label) || id;
      }
      cont.disabled = !id;
      cont.textContent = id ? ("Continue with " + label + " →") : "Select a facility to continue";
    }
  }

  function paintClientSpecialtyCtx() {
    var list = Array.isArray(state.clientSpecialties) ? state.clientSpecialties : [];
    var id = list.length ? list[list.length - 1] : "";
    paintV3Ctx($("#client-specialty-ctx"), id ? v3StoryForSpecialty(id) : null);
  }

  function bindClientFacilityContinue() {
    var cont = $("#client-facility-continue");
    if (!cont || cont.getAttribute("data-bound-fac") === "1") return;
    cont.setAttribute("data-bound-fac", "1");
    cont.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (!state.facility) return;
      go("client-specialty", { trail: true });
    });
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
    paintClientFacilityCtx();
    bindClientFacilityContinue();
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
      paintClientFacilityCtx();
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
  var BD_CC_ALWAYS_EMAILS = [
    "rkeeth@adaptivemedicalpartners.com",
    "mfreeman@adaptivemedicalpartners.com",
    "david@adaptivemedicalpartners.com"
  ];
  var BD_CC_ALWAYS_MAP = [
    { name: "Randy Keeth", email: "rkeeth@adaptivemedicalpartners.com" },
    { name: "Mike Freeman", email: "mfreeman@adaptivemedicalpartners.com" },
    { name: "David Fontenot", email: "david@adaptivemedicalpartners.com" }
  ];
  var BD_OWNER_META = {
    aaron: { id: "aaron", name: "Aaron Wagner", label: "Aaron Wagner · TX + CA", territory: "Territory · TX · CA", photo: "assets/team/aaron-wagner.jpg", role: "Hiring guide", blurb: "Texas hiring guide who partners with hospital and practice leaders \u2014 clear process, flexible solutions.", fullHtml: "<p>Aaron Wagner is a hiring guide at Adaptive Medical Partners, partnering with hospital and practice executives across Texas and beyond. His background spans healthcare recruiting and business development\u2014including earlier chapters at Rhino Medical Services and Republic Health Resources\u2014plus client-service leadership at AMP. He focuses on simplifying the recruiting process and listening first so solutions fit the organization, not a template.</p><p>Aaron\u2019s BD territory is Texas and California \u2014 hospital and practice leaders across both states.</p><p>Aaron works closely with rural and community healthcare leaders who need a clearer path to durable hires\u2014fewer wasted interviews, stronger fit, and a partner who stays in the conversation.</p><p>Aaron is married and has kids. Outside work, time with family, going out to eat, and enjoying life together are what recharge him.</p>" },
    zach: { id: "zach", name: "Zach Hamann", label: "Zach Hamann · IL/MO/IA/KS/NE", territory: "Territory · IL · MO · IA · KS · NE", photo: "assets/team/zach-hamann.jpg", role: "Hiring guide", blurb: "Came back to AMP on purpose \u2014 Senior BD who knows the search from both sides of the table.", fullHtml: "<p>Zach Hamann is a hiring guide and Senior Business Development Consultant at Adaptive Medical Partners, based in Fort Worth. He first served AMP earlier in his career (Client Services), then built experience at other firms\u2014including The Medicus Firm\u2014and in another industry chapter at Umano Medical. Seeing the positive shift at Adaptive, he returned as a strong re-addition to the team\u2014someone who chose the work again because the guide culture and client craft had moved forward.</p><p>Zach\u2019s BD territory is Illinois, Missouri, Iowa, Kansas, and Nebraska \u2014 Midwest partners who need a clear brief.</p><p>Zach partners with healthcare organizations to set the brief: clearer requirements, better process, and searches that respect both the facility and the candidates who will live the week.</p><p>Zach is married and has children. Family is central outside work.</p>" },
    brenton: { id: "brenton", name: "Brenton McMahan", label: "Brenton McMahan · GA/AL/TN/KY", territory: "Territory · GA · AL · TN · KY", photo: "assets/team/brenton-mcmahan.jpg", role: "Hiring guide", blurb: "Client-first guide for the Southeast \u2014 listens hard, delivers solutions, and keeps the high camp ready.", fullHtml: "<p>Brenton McMahan is a hiring guide at Adaptive Medical Partners and serves as Senior Client Success Manager. He has been with AMP for several years and was promoted in 2025 after building trust with partners across the Southeast. His rise is rooted in a simple rule: put the client first\u2014listen, respond, and deliver real solutions that move a hard search forward.</p><p>Brenton\u2019s BD territory is Georgia, Alabama, Tennessee, and Kentucky \u2014 the Southeast corridor he covers day to day.</p><p>Before AMP, Brenton\u2019s path included client-facing and business-development work (including Aston Carter and Fusion 4 Branding), which sharpened an entrepreneurial, practical style. He brings that same energy to rural and community healthcare partnerships.</p><p>Outside work he enjoys the outdoors, going out to eat, and the kind of strong, grounded upbringing that shows up in how he shows up for clients.</p>" },
    randy: { id: "randy", name: "Randy Keeth", label: "Randy Keeth · National BD", territory: "National BD · unassigned states", photo: "assets/team/randy-keeth.jpg", role: "Managing Partner, Business Development", blurb: "Client-first BD for rural partners \u2014 trusted relationships, faster fills, and a brief candidates can trust.", fullHtml: "<p>Randy Keeth is Managing Partner, Business Development at Adaptive Medical Partners. He brings over twenty years of healthcare staffing leadership and numerous production awards to AMP\u2019s client partnerships. His client-first mindset helps rural healthcare organizations reduce time-to-fill while building trusted, lasting relationships.</p><p>Randy partners across AMP\u2019s BD territories and is copied on every hiring-guide lead so the high camp stays coordinated.</p><p>A University of Texas at Arlington graduate, Randy\u2019s strategic approach and relationship-building have made him widely recognized in the industry. He joined AMP in 2011, a year after the firm was founded, and has held senior leadership roles across the company\u2019s growth. Based in Arlington, Texas, he enjoys working out and home projects when he is not serving AMP\u2019s clients.</p><p>Randy is married and has a teenage son.</p>" }
  };
  /* Exact Tell-us-where-to-start need cards — reused on post-submit discuss. */
  var CLIENT_START_TOPICS = [
    { id: "volume", label: "Difficulty getting candidate volume", blurb: "The pipeline is thin — not enough people even looking." },
    { id: "convert", label: "We get candidates but can’t close / convert", blurb: "Interest shows up — then it stalls before anyone signs on." },
    { id: "interviews", label: "Interviews take too many cycles / wrong people reach leadership", blurb: "Committees are spending time on conversations that should never have been booked." },
    { id: "vacancy", label: "Role stays open too long / vacancy burn", blurb: "The seat has been empty long enough that the service line is feeling it." },
    { id: "confidential", label: "Confidential / competitive search needs a quieter approach", blurb: "This one can’t be a public blast — we need a quieter, more careful path." },
    { id: "story", label: "Need help telling the opportunity story (marketing/preview)", blurb: "The role is real — the story isn’t landing with the people you want." },
    { id: "brief", label: "Not sure which seats to prioritize / brief is fuzzy", blurb: "Several openings, or the brief still needs a sharper focus." },
    { id: "other", label: "Something else", blurb: "A short note is optional — we’ll pick it up on the call." }
  ];

  function firstClientSpecialtyLabel() {
    var id = (state.clientSpecialties && state.clientSpecialties[0]) || state.clientSpecialty || "";
    return clientSpecLabel(id) || "our open specialty";
  }

  function currentHiringGuide() {
    if (state.clientBd && state.clientBd.ownerId && BD_OWNER_META[state.clientBd.ownerId]) {
      return BD_OWNER_META[state.clientBd.ownerId];
    }
    return resolveBdOwner(state.clientState || (state.clientBd && state.clientBd.state));
  }

  function hiringGuideFirstName(owner) {
    var name = owner && owner.name ? String(owner.name).trim() : "";
    if (!name) return "";
    return name.split(" ")[0];
  }

  function hiringGuideMailto(opts) {
    opts = opts || {};
    var owner = currentHiringGuide();
    var first = hiringGuideFirstName(owner);
    var spec = firstClientSpecialtyLabel();
    var st = String(state.clientState || (state.clientBd && state.clientBd.state) || "").toUpperCase();
    var place = st || "the selected state";
    var subject = opts.subject || ("Market Intelligence report request · " + spec + " · " + place);
    var body = opts.body || (
      "Dear " + first + ",\n\n" +
      "Please send a Market Intelligence report / market analysis for " + spec + " in " + place + ".\n\n" +
      "Thank you."
    );
    /* Public NAP inbox — individual hiring-guide emails are not on the mountain. */
    return "mailto:inquire@adaptivemedicalpartners.com" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function renderClientTopicGrid(root, opts) {
    if (!root) return;
    opts = opts || {};
    var src = $("#client-need-cards");
    if (src && src.innerHTML && src.innerHTML.trim()) {
      root.innerHTML = src.innerHTML;
      root.querySelectorAll("[data-client-need]").forEach(function (btn) {
        var id = (btn.getAttribute("data-client-need") || "").trim();
        if (id) btn.setAttribute("data-client-topic", id);
        btn.classList.remove("is-selected");
        btn.removeAttribute("aria-pressed");
      });
    } else {
      root.innerHTML = CLIENT_START_TOPICS.map(function (t) {
        return '<button type="button" class="hire-card client-need-card" data-client-topic="' + t.id + '" data-client-need="' + t.id + '">' +
          "<h3>" + t.label + "</h3><p>" + t.blurb + "</p>" +
          '<span class="hire-select">Select</span></button>';
      }).join("");
    }
    if (opts.select !== true) return;
    paintClientDiscussSelection();
    if (root.getAttribute("data-bound-topics") === "1") return;
    root.setAttribute("data-bound-topics", "1");
    root.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-client-topic], [data-client-need]") : null;
      if (!btn) return;
      ev.preventDefault();
      toggleClientDiscussTopic(btn.getAttribute("data-client-topic") || btn.getAttribute("data-client-need"));
    });
    var send = $("#client-discuss-send");
    if (send && send.getAttribute("data-bound-discuss-send") !== "1") {
      send.setAttribute("data-bound-discuss-send", "1");
      send.addEventListener("click", function (ev) {
        ev.preventDefault();
        sendClientDiscussTopics();
      });
    }
  }

  function clientDiscussTopicLabels(ids) {
    return (ids || []).map(function (id) {
      var topic = CLIENT_START_TOPICS.filter(function (t) { return t.id === id; })[0];
      if (topic) return topic.label;
      var meta = CLIENT_NEED_META[id];
      return meta ? meta.label : id;
    }).filter(Boolean);
  }

  function paintClientDiscussSelection() {
    var root = $("#client-discuss-topics");
    var selected = Array.isArray(state.clientDiscussTopics) ? state.clientDiscussTopics : [];
    if (root) {
      root.querySelectorAll("[data-client-topic], [data-client-need]").forEach(function (btn) {
        var id = (btn.getAttribute("data-client-topic") || btn.getAttribute("data-client-need") || "").trim();
        var on = selected.indexOf(id) >= 0;
        btn.classList.toggle("is-selected", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        var sel = btn.querySelector(".hire-select");
        if (sel) sel.textContent = on ? "Selected" : "Select";
      });
    }
    var send = $("#client-discuss-send");
    if (send) send.disabled = !selected.length;
  }

  function toggleClientDiscussTopic(id) {
    if (!id) return;
    if (!Array.isArray(state.clientDiscussTopics)) state.clientDiscussTopics = [];
    var idx = state.clientDiscussTopics.indexOf(id);
    if (idx >= 0) state.clientDiscussTopics.splice(idx, 1);
    else state.clientDiscussTopics.push(id);
    var status = $("#client-discuss-send-status");
    if (status) {
      status.hidden = true;
      status.textContent = "";
    }
    paintClientDiscussSelection();
  }

  function readLastClientLead() {
    try {
      var last = JSON.parse(localStorage.getItem("amp_chatbot_last_client_lead") || "null");
      return last && typeof last === "object" ? last : null;
    } catch (e) {
      return null;
    }
  }

  function sendClientDiscussTopics() {
    var ids = Array.isArray(state.clientDiscussTopics) ? state.clientDiscussTopics.slice() : [];
    if (!ids.length) {
      paintClientDiscussSelection();
      return;
    }
    if (!Array.isArray(state.clientNeeds)) state.clientNeeds = [];
    ids.forEach(function (id) {
      if (state.clientNeeds.indexOf(id) < 0) state.clientNeeds.push(id);
    });
    var topicsLine = clientDiscussTopicLabels(ids).join("; ");
    var owner = currentHiringGuide();
    var last = readLastClientLead();
    var topicBit = "Discuss: " + topicsLine;
    if (last) {
      last.discussTopics = ids;
      last.discussTopicLabels = topicsLine;
      var interest = String(last.interest || "");
      if (interest.indexOf("Discuss:") >= 0) last.interest = interest.replace(/Discuss:[\s\S]*$/, topicBit);
      else last.interest = interest ? (interest + " · " + topicBit) : topicBit;
      var note = String(last.note || "");
      if (note.indexOf("Discuss:") >= 0) last.note = note.replace(/Discuss:[\s\S]*$/, topicBit);
      else last.note = note ? (note + "\n" + topicBit) : topicBit;
      last.topicsSentAt = new Date().toISOString();
      postLeadHandoff(last, { replaceLast: true });
    } else {
      postLeadHandoff({
        name: null,
        audience: "client",
        channel: "amp_client_meeting_form",
        source: "AMP website",
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
        discussTopics: ids,
        discussTopicLabels: topicsLine,
        interest: topicBit,
        note: topicBit,
        owner: owner && owner.id ? owner.id : null,
        ownerName: owner && owner.name ? owner.name : null,
        formId: "client-discuss-send",
        region: state.clientState || (state.clientBd && state.clientBd.state) || null
      });
    }
    try {
      stampMess(
        "client",
        (owner && owner.name ? owner.name : "Hiring guide") +
          " · meeting request · topics · " + topicsLine
      );
    } catch (err) {}
    var status = $("#client-discuss-send-status");
    if (status) {
      status.hidden = false;
      status.textContent = "Sent — topics added to your meeting request.";
    }
    paintClientDiscussSelection();
  }

  function syncClientRidgeCtas() {
    var owner = currentHiringGuide();
    var foot = $("#client-ridge-cta-foot");
    var ready = !!(owner && (state.clientState || (state.clientBd && state.clientBd.state)));
    if (!foot) return;
    foot.hidden = !ready;
    if (!ready) return;
    foot.href = hiringGuideMailto();
    foot.textContent = "Get your Market Intelligence report";
  }

  function paintConfirmClientDiscuss() {
    var owner = currentHiringGuide();
    var first = hiringGuideFirstName(owner);
    var title = $("#confirm-client-title");
    var lede = $("#confirm-client-lede");
    var discussTitle = $("#client-discuss-title");
    if (title) title.textContent = first ? (first + " has your meeting request.") : "You’re on the list";
    if (lede && owner) {
      lede.innerHTML = "A <strong>hiring guide</strong> owns the next step. You wait; AMP works.";
    }
    if (discussTitle) {
      discussTitle.textContent = first
      ? (first + " looks forward to meeting with you. What would you like to discuss?")
      : "We look forward to meeting with you. What would you like to discuss?";
    }
    renderClientTopicGrid($("#client-discuss-topics"), { select: true });
    renderClientTopicGrid($("#client-start-topics-parked-grid"));
  }

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
        ? "We'll connect you with a hiring guide for this state."
        : "A named hiring guide will stay with you from the first conversation.";
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
    paintClientSpecialtyCtx();
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
        /* Select in place so the matched retention card can swap before continue */
        state.clientSpecialties = [csid];
        syncClientSpecialtyCompat();
        paintClientSpecSelection();
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
    var owner = resolveBdOwner(stateCode);
    if (!reveal || !owner) {
      if (reveal) {
        reveal.hidden = false;
        reveal.classList.add("is-empty");
      }
      try { paintClientNeedSelection(); } catch (e0) {}
      try { syncClientRidgeCtas(); } catch (e) {}
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
    if (note) note.textContent = "Your hiring guide stays with you from the first conversation.";
    try { syncClientRidgeCtas(); } catch (e) {}
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
    try { paintClientNeedSelection(); } catch (e1) {}
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
        try { paintClientNeedSelection(); } catch (eShow) {}
        try { syncClientRidgeCtas(); } catch (eShowR) {}
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
      try { paintClientNeedSelection(); } catch (eEmpty) {}
      try { syncClientRidgeCtas(); } catch (eEmptyR) {}
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

    try {
      renderClientTopicGrid($("#client-start-topics-parked-grid"));
      syncClientRidgeCtas();
    } catch (err) {}
    try { stampConciergePath("client-region"); } catch (e2) {}
  }

  function paintClientNeedSelection() {
    var list = $("#client-need-cards");
    var selected = state.clientNeeds || [];
    if (list) {
      list.querySelectorAll("[data-client-need]").forEach(function (btn) {
        var id = (btn.getAttribute("data-client-need") || "").trim();
        var on = selected.indexOf(id) >= 0;
        btn.classList.toggle("is-selected", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        var sel = btn.querySelector(".hire-select");
        if (sel) sel.textContent = on ? "Selected" : "Select";
      });
    }
    var otherWrap = $("#client-need-other-wrap");
    if (otherWrap) otherWrap.hidden = selected.indexOf("other") < 0;
    var cont = $("#client-offers-continue");
    if (cont) {
      var hasState = !!(state.clientState && state.clientBd);
      /* 2127: Tell-us-where-to-start is parked — state+guide is enough to continue. */
      /* 2129: mid Ridge-style CTA — hidden until state/guide ready (same as Ridge report). */
      cont.hidden = !hasState;
      cont.disabled = !hasState;
      if (hasState && state.clientBd && state.clientBd.ownerName) {
        cont.textContent = "Request a meeting with " + state.clientBd.ownerName.split(" ")[0] + " and get a full market analysis";
      } else if (hasState) {
        var owner = currentHiringGuide();
        var first = hiringGuideFirstName(owner);
        cont.textContent = first && first !== "there"
          ? "Request a meeting with " + first + " and get a full market analysis"
          : "Request a meeting and get a full market analysis";
      } else {
        cont.textContent = "Request a meeting and get a full market analysis";
      }
    }
    var hint = $("#client-need-hint");
    if (hint) {
      hint.textContent = selected.length
        ? (selected.length === 1 ? "1 selected — add more or continue." : selected.length + " selected — continue when you’re ready.")
        : "Tap one or more. Multi-select is fine — pick anything that’s true right now.";
    }
  }

  function toggleClientNeed(id) {
    if (!id) return;
    if (!Array.isArray(state.clientNeeds)) state.clientNeeds = [];
    var idx = state.clientNeeds.indexOf(id);
    if (idx >= 0) state.clientNeeds.splice(idx, 1);
    else state.clientNeeds.push(id);
    if (state.clientNeeds.indexOf("other") < 0) state.clientNeedNote = "";
    paintClientNeedSelection();
    try { stampConciergePath("client-region"); } catch (e) {}
  }

  function continueClientOffers() {
    if (!state.clientState || !state.clientBd) {
      paintClientNeedSelection();
      var band = $("#client-territory-band") || $("#client-state-chips");
      if (band && band.scrollIntoView) band.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    var otherNote = $("#client-need-other-note");
    if (otherNote) state.clientNeedNote = String(otherNote.value || "").trim();
    writeClientMeetingFields();
    applyClientMeetingNote();
    var sel = $("#client-meeting-state");
    if (sel && state.clientState) {
      sel.value = state.clientState;
      try { syncClientBdRoutePreview(); } catch (err) {}
    }
    go("client-meeting", { trail: true });
  }

  function renderClientOffers() {
    var ctx = $("#client-offers-context");
    if (ctx) {
      var bits = clientContextBits();
      ctx.textContent = bits.length ? bits.join(" · ") : "";
    }
    if (!Array.isArray(state.clientNeeds)) state.clientNeeds = [];
    var otherNote = $("#client-need-other-note");
    if (otherNote && state.clientNeedNote && !otherNote.value) otherNote.value = state.clientNeedNote;
    paintClientNeedSelection();
    var list = $("#client-need-cards");
    if (list && list.getAttribute("data-bound-client-needs") !== "1") {
      list.setAttribute("data-bound-client-needs", "1");
      list.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("[data-client-need]") : null;
        if (!btn) return;
        ev.preventDefault();
        toggleClientNeed((btn.getAttribute("data-client-need") || "").trim());
      });
    }
    if (otherNote && otherNote.getAttribute("data-bound-client-needs") !== "1") {
      otherNote.setAttribute("data-bound-client-needs", "1");
      otherNote.addEventListener("input", function () {
        state.clientNeedNote = String(otherNote.value || "").trim();
      });
    }
    var cont = $("#client-offers-continue");
    if (cont && cont.getAttribute("data-bound-client-needs") !== "1") {
      cont.setAttribute("data-bound-client-needs", "1");
      cont.addEventListener("click", function (ev) {
        ev.preventDefault();
        continueClientOffers();
      });
    }
    try { stampConciergePath("client-region"); } catch (e2) {}
  }

  var CLIMB_DEFAULT_LINE = "You set the brief. We carry the work from the first profile through the close.";
  var CLIMB_STATION_LINES = {
    "1": "We walk the clinic week and the culture before anyone is briefed.",
    "2": "We write a story candidates can trust — not a blast list.",
    "3": "Only prepared people reach your leadership table.",
    "4": "A clean dossier and CV packet, ready for the committee.",
    "5": "We walk the candidate through interview prep before they meet you.",
    "6": "We stay on the rope through the yes — and the first weeks after."
  };

  function lightClientClimbStation(id, persist) {
    var band = $("#client-climb-band");
    var line = $("#client-climb-line");
    if (!band) return;
    var stations = band.querySelectorAll(".client-climb-station");
    stations.forEach(function (btn) {
      var on = id && btn.getAttribute("data-climb") === String(id);
      btn.classList.toggle("is-lit", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (line) line.textContent = (id && CLIMB_STATION_LINES[String(id)]) || CLIMB_DEFAULT_LINE;
    if (persist) band.setAttribute("data-climb-lit", id ? String(id) : "");
  }

  function bindClientClimbStations() {
    var band = $("#client-climb-band");
    if (!band) return;
    if (band.getAttribute("data-bound-climb") === "1") return;
    band.setAttribute("data-bound-climb", "1");
    band.addEventListener("mouseover", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest(".client-climb-station") : null;
      if (!btn || !band.contains(btn)) return;
      lightClientClimbStation(btn.getAttribute("data-climb"), false);
    });
    band.addEventListener("mouseleave", function () {
      var kept = band.getAttribute("data-climb-lit") || "";
      lightClientClimbStation(kept, false);
    });
    band.addEventListener("focusin", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest(".client-climb-station") : null;
      if (!btn) return;
      lightClientClimbStation(btn.getAttribute("data-climb"), false);
    });
    band.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest(".client-climb-station") : null;
      if (!btn) return;
      ev.preventDefault();
      var id = btn.getAttribute("data-climb");
      var already = band.getAttribute("data-climb-lit") === id;
      lightClientClimbStation(already ? "" : id, true);
    });
    var trail = band.querySelector(".client-climb-trail");
    if (trail) {
      var syncSwipe = function () {
        var max = trail.scrollWidth - trail.clientWidth - 8;
        var atEnd = max <= 0 || trail.scrollLeft >= max;
        band.classList.toggle("is-climb-end", atEnd);
      };
      trail.addEventListener("scroll", syncSwipe, { passive: true });
      syncSwipe();
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
      if (help) help.textContent = "Tap a region, then your state.";
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
      if (state.clientNeeds && state.clientNeeds.length) {
        window.AMP_CHATBOT.clientNeeds = clientNeedLabels().join("; ");
        window.AMP_CHATBOT.note = clientNeedsStamp();
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
  var AMP_ORG_URL = "https://www.adaptivemedicalpartners.com/";
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
    var direct = firstJobField(j, ["tease", "sub", "excerpt", "description"]);
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
    var id = firstJobField(j, ["id"]);
    var key = slug || id;
    if (key) return AMP_ORG_URL.replace(/\/$/, "") + "/job/" + key;
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

    /* Region-level only when we have state; city only if a real baked field (never invent towns). */
    var region = firstJobField(j, ["stateAbbr", "state"]);
    var city = firstJobField(j, ["city"]);
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
    return "<aside class=\"jobs-soft-bench\" aria-label=\"More ways to find a fit\"><span class=\"tag\">More than the job board</span><h3 class=\"jobs-soft-bench-title\">Posted roles are only part of the path.</h3><p><strong>These are roles we can show publicly.</strong> Guides also know of openings that never appear here. If nothing listed feels right, talk with a guide — we’ll keep looking with you.</p><button type=\"button\" class=\"btn btn-ghost jobs-soft-bench-cta\" data-guide-whisper=\"1\">Talk to a guide <span aria-hidden=\"true\">→</span></button></aside>";
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
        sortLine.textContent = "Sorted for your search: " + pretty;
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
    var heroBlock = j.hero
      ? '<div class="job-hero"><img src="' + j.hero + '" alt="' + escapeAttr(jobHeroAlt(j)) + '"><div class="badge">Practice preview · not a facility dump</div></div>'
      : '<div class="job-hero job-hero-pro" role="img" aria-label="Practice preview"><div class="badge">Practice preview · not a facility dump</div></div>';
    root.innerHTML =
      '<div class="job-layout">' +
        '<div>' +
          heroBlock +
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
    { id: "practice", label: "Practice feel", blurb: "How the week runs in practice — clinic pace, team, call." },
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

  function conciergeHandoffUrl() {
    try {
      if (window.AMP_CHATBOT && window.AMP_CHATBOT.handoffUrl) {
        return String(window.AMP_CHATBOT.handoffUrl).trim();
      }
    } catch (e) {}
    var script = document.querySelector("script[data-amp-handoff-url], [data-amp-handoff-url]");
    return script ? String(script.getAttribute("data-amp-handoff-url") || "").trim() : "";
  }

  function persistSpaLead(payload, opts) {
    opts = opts || {};
    try {
      var isClient = payload.audience === "client";
      var key = isClient ? "amp_chatbot_client_leads" : "amp_chatbot_leads";
      var list = [];
      try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      if (opts.replaceLast && list.length) list[list.length - 1] = payload;
      else list.push(payload);
      if (list.length > 50) list = list.slice(-50);
      localStorage.setItem(key, JSON.stringify(list));
      if (isClient) {
        localStorage.setItem("amp_chatbot_last_client_lead", JSON.stringify(payload));
        try {
          var all = JSON.parse(localStorage.getItem("amp_chatbot_leads") || "[]");
          if (!Array.isArray(all)) all = [];
          if (opts.replaceLast && all.length) all[all.length - 1] = payload;
          else all.push(payload);
          if (all.length > 50) all = all.slice(-50);
          localStorage.setItem("amp_chatbot_leads", JSON.stringify(all));
        } catch (e2) {}
      } else {
        localStorage.setItem("amp_chatbot_last_lead", JSON.stringify(payload));
      }
    } catch (e) {
      console.warn("[AMP forms] localStorage persist failed:", e);
    }
  }

  function hiringGuideCcFields() {
    return {
      cc: BD_CC_ALWAYS.slice(),
      ccEmails: BD_CC_ALWAYS_EMAILS.slice(),
      ccPeople: BD_CC_ALWAYS_MAP.map(function (p) { return { name: p.name, email: p.email }; })
    };
  }

  /* amp-build:2137 — Pages preview bake: never hang on live handoff */
  function isAmpPagesPreviewBake() {
    try {
      var h = String(location.hostname || "");
      var p = String(location.pathname || "");
      if (window.__AMP_PREVIEW_MOCK_SUCCESS === true) return true;
      if (window.__AMP_PREVIEW_MOCK_SUCCESS === false) return false;
      return h.indexOf("github.io") !== -1 || p.indexOf("amp-range-preview") !== -1;
    } catch (e) {
      return false;
    }
  }

  function postLeadHandoff(payload, opts) {
    persistSpaLead(payload, opts);
    console.log("[AMP forms] Handoff lead captured:", payload);
    /* Preview: mock-success immediately — client meeting + Tap-to-Talk must not stick on Sending… */
    if (isAmpPagesPreviewBake()) {
      console.log("[AMP forms] Preview mock-success — skip network handoff");
      return Promise.resolve({ ok: true, stub: true, previewMock: true, persisted: true });
    }
    var url = conciergeHandoffUrl();
    if (!url) return Promise.resolve({ ok: false, stub: true, persisted: true });
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "omit"
    }).then(function (res) {
      console.log("[AMP forms] Handoff POST status:", res.status);
      return { ok: res.ok, status: res.status, persisted: true };
    }).catch(function (err) {
      console.warn("[AMP forms] Handoff POST failed (localStorage still OK):", err);
      return { ok: false, error: String(err), persisted: true };
    });
  }

  function setFormBusy(form, busy) {
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      if (busy && !btn.getAttribute("data-idle-label")) btn.setAttribute("data-idle-label", btn.textContent);
      btn.disabled = !!busy;
      btn.textContent = busy ? "Sending…" : (btn.getAttribute("data-idle-label") || btn.textContent);
    }
  }

  function stampMess(kind, payload) {
    var el = kind === "client" ? $("#mess-client-mock") : $("#mess-response-mock");
    if (!el) return;
    var stamp = $("#amp-guide-path-stamp");
    var when = stamp || new Date().toLocaleString();
    if (kind === "client") {
      var needsLine = clientNeedsStamp() || "Hiring conversation";
      var regionLine = (state.clientState || "") + (state.clientBd && state.clientBd.ownerName ? " · " + state.clientBd.ownerName : "");
      el.innerHTML =
        '<div class="row"><span>Status</span><span class="ok">Received · guide assigned</span></div>' +
        '<div class="row"><span>When</span><span>' + when + '</span></div>' +
        '<div class="row"><span>Focus</span><span class="ok">' + needsLine + '</span></div>' +
        (regionLine ? '<div class="row"><span>Region / guide</span><span class="ok">' + regionLine + '</span></div>' : "") +
        '<div class="row"><span>Summary</span><span>' + (payload || "Client interest") + '</span></div>' +
        '<p class="muted" style="margin:10px 0 0;font-size:11px;line-height:1.35">Your hiring guide has what they need to follow up.</p>';
    } else {
      el.innerHTML =
        '<div class="row"><span>Status</span><span class="ok">Received · guide notified</span></div>' +
        '<div class="row"><span>When</span><span>' + when + '</span></div>' +
        '<div class="row"><span>Summary</span><span>' + (payload || "Interest") + '</span></div>' +
        '<p class="muted" style="margin:10px 0 0;font-size:11px;line-height:1.35">A recruiting guide will follow up — no public package dump.</p>';
    }
  }

  /* amp-build:2111-public-forms — Typeform live embeds + ACH wired to live Webflow */
  var TYPEFORM_SRC = "https://embed.typeform.com/next/embed.js";
  var ACH_LIVE_URL = "https://www.adaptivemedicalpartners.com/easy-pay-authorization";
  var ACH_WF_SITE = "68ae8c1190abe2fd7be13740";
  var ACH_FIELD_KEYS = {
    "ABA-Number": "ABA Number",
    "Bank-Account-Number": "Bank Account Number",
    "Bank-Account-Type": "Bank Account Type",
    "First-Name": "First-Name",
    "Last-Name": "Last-Name",
    "Title": "Title",
    "Organization": "Organization",
    "Signature": "Signature",
    "Billing-Contact-Email": "Billing Contact Email",
    "Billing-Contact-Phone": "Billing Contact Phone",
    "Acceptance": "Acceptance"
  };

  function loadTypeformScript(cb) {
    if (window.tf) {
      if (cb) cb();
      return;
    }
    var existing = document.querySelector('script[data-amp-typeform="1"]');
    if (existing) {
      if (cb) existing.addEventListener("load", function () { cb(); }, { once: true });
      return;
    }
    var s = document.createElement("script");
    s.src = TYPEFORM_SRC;
    s.async = true;
    s.setAttribute("data-amp-typeform", "1");
    if (cb) s.onload = function () { cb(); };
    document.body.appendChild(s);
  }

  function hydrateTypeformEmbeds(route) {
    var view = document.querySelector('.view[data-route="' + route + '"]');
    if (!view) return;
    loadTypeformScript(function () {
      var nodes = view.querySelectorAll("[data-tf-live]");
      if (!nodes.length) return;
      if (window.tf && typeof window.tf.load === "function") {
        try { window.tf.load(); } catch (e) {}
        return;
      }
      if (window.tf && typeof window.tf.reload === "function") {
        try { window.tf.reload(); } catch (e2) {}
      }
    });
  }

  function setAchStatus(text, isErr) {
    var status = $("#amp-ach-status");
    if (!status) return;
    status.hidden = !text;
    status.textContent = text || "";
    status.classList.toggle("is-error", !!isErr);
  }

  function achOnWwwHost() {
    return /(^|\.)adaptivemedicalpartners\.com$/i.test(location.hostname || "");
  }

  function hydrateEasyPay() {
    bindEasyPayForm();
    var wrap = $("[data-amp-ach-frame-wrap]");
    var frame = $("[data-amp-ach-frame]");
    var form = $("#wf-form-ACH-Form");
    if (!wrap || !frame || !form) return;
    wrap.hidden = true;
    form.hidden = false;
    /* After mountain owns www, iframing this path would recurse. Live Webflow
       also sends X-Frame-Options: SAMEORIGIN, so preview hosts fall back to
       the mountain clone that posts to the same Webflow form handler. */
    if (achOnWwwHost()) return;
    if (frame.getAttribute("data-amp-src-set") === "1") return;
    frame.setAttribute("data-amp-src-set", "1");
    frame.src = ACH_LIVE_URL;
    frame.addEventListener("load", function () {
      try {
        var href = frame.contentWindow && frame.contentWindow.location.href;
        if (!href || href === "about:blank") return;
        var doc = frame.contentDocument;
        if (!doc || !doc.body) return;
      } catch (err) {
        wrap.hidden = false;
        form.hidden = true;
      }
    }, { once: true });
  }

  function bindEasyPayForm() {
    var form = $("#wf-form-ACH-Form");
    if (!form || form.__ampBound) return;
    form.__ampBound = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitEasyPay(form);
    });
  }

  function submitEasyPay(form) {
    var accept = form.querySelector('[name="Acceptance"]');
    if (accept && !accept.checked) {
      setAchStatus("Please accept the terms to authorize payment.", true);
      accept.focus();
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var fd = new FormData(form);
    var body = new URLSearchParams();
    body.set("name", "ACH Form");
    body.set("source", ACH_LIVE_URL);
    body.set("test", "false");
    Object.keys(ACH_FIELD_KEYS).forEach(function (name) {
      var val = fd.get(name);
      if (val == null || val === "") return;
      if (name === "Acceptance") val = "true";
      body.set("fields[" + ACH_FIELD_KEYS[name] + "]", String(val));
    });

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute("data-label", submitBtn.textContent);
      submitBtn.textContent = "Submitting…";
    }
    setAchStatus("Transmitting securely…", false);

    fetch("https://webflow.com/api/v1/form/" + ACH_WF_SITE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString(),
      mode: "cors",
      credentials: "omit",
      cache: "no-store"
    }).then(function (res) {
      if (!res.ok) throw new Error("ach-http");
      form.reset();
      form.hidden = true;
      var done = $("#amp-ach-done");
      if (done) done.hidden = false;
      setAchStatus("", false);
    }).catch(function () {
      setAchStatus("We could not finish this authorization here. Use Open on AMP so banking details post to the proven live form.", true);
      var fallback = $("#amp-ach-fallback");
      if (fallback) fallback.hidden = false;
    }).then(function () {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.getAttribute("data-label") || "Submit authorization";
      }
    });
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
      if (raw.closest("#mi-lite-subscribe")) {
        e.preventDefault();
        var subPlan = document.querySelector('input[name="mi-lite-plan"]:checked');
        openRidgeCheckout(subPlan ? subPlan.value : (state.miLitePlan || "region"));
        return;
      }
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
        if (t.id === "mi-lite-subscribe" || t.getAttribute("data-ridge-checkout")) {
          e.preventDefault();
          var sku = t.id === "mi-lite-subscribe" ? null : t.getAttribute("data-ridge-checkout");
          if (!sku) {
            var miPlan = document.querySelector('input[name="mi-lite-plan"]:checked');
            sku = miPlan ? miPlan.value : (state.miLitePlan || "region");
          }
          openRidgeCheckout(sku);
          return;
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
        paintClientFacilityCtx();
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
        var spec = String(fd.get("specialty") || state.specialty || "OB/GYN");
        var payload = {
          name: String(fd.get("name") || "").trim(),
          phone: String(fd.get("phone") || "").trim(),
          email: String(fd.get("email") || "").trim() || null,
          specialty: spec,
          region: state.region || (state.regions && state.regions[0]) || null,
          jobLabel: state.jobId || null,
          org: null,
          interest: spec + (fd.get("note") ? " · " + fd.get("note") : ""),
          note: String(fd.get("note") || ""),
          source: "AMP website",
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          audience: "candidate",
          channel: "amp_job_interest_form",
          routeTo: "recruiting_responses",
          responsesFeedReady: true,
          recruiterTag: "mike",
          recruiter: "mike",
          owner: "mfreeman",
          formId: "job-interest-form"
        };
        setFormBusy(jobForm, true);
        postLeadHandoff(payload).then(function () {
          setFormBusy(jobForm, false);
          stampMess("physician", (payload.name || "Physician") + " · " + spec);
          go("confirm-mess", { trail: true });
        });
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
        if (fd.get("needNote")) state.clientNeedNote = String(fd.get("needNote"));
        if (fd.get("needs") && (!state.clientNeeds || !state.clientNeeds.length)) {
          state.clientNeeds = String(fd.get("needs")).split(",").filter(Boolean);
        }
        var needsLabel = clientNeedsStamp() || "Hiring consult";
        var stCode = String(fd.get("state") || "").toUpperCase();
        var owner = resolveBdOwner(stCode);
        if (!owner) {
          if (stateSel) stateSel.focus();
          return;
        }
        var cc = hiringGuideCcFields();
        state.clientBd = {
          state: stCode,
          ownerId: owner.id,
          ownerName: owner.name,
          ownerLabel: owner.label,
          cc: cc.cc,
          ccEmails: cc.ccEmails
        };
        state.clientState = stCode;
        var payload = {
          name: String(fd.get("name") || "").trim(),
          phone: String(fd.get("phone") || "").trim(),
          email: String(fd.get("email") || "").trim() || null,
          specialty: clientSpecLabel(state.clientSpecialty || (state.clientSpecialties && state.clientSpecialties[0])) || null,
          region: stCode,
          jobLabel: null,
          org: String(fd.get("role") || "").trim() || null,
          role: String(fd.get("role") || "").trim() || null,
          interest: needsLabel + " · " + stCode + (fd.get("note") ? " · " + fd.get("note") : ""),
          note: String(fd.get("note") || ""),
          agreement: state.agreement || null,
          source: "AMP website",
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          audience: "client",
          channel: "amp_client_meeting_form",
          routeTo: "bd_hub_randy",
          responsesFeedReady: true,
          owner: owner.id,
          ownerName: owner.name,
          formId: "client-meeting-form",
          cc: cc.cc,
          ccEmails: cc.ccEmails,
          ccPeople: cc.ccPeople
        };
        setFormBusy(clientForm, true);
        postLeadHandoff(payload).then(function () {
          setFormBusy(clientForm, false);
          stampMess(
            "client",
            (payload.name || "Client") + " · " + stCode + " · " + owner.name + " · " + needsLabel + " → a hiring guide"
          );
          go("confirm-client", { trail: true });
        });
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
        var who = String(fd.get("name") || "Contact").trim();
        var isClient = intent === "client";
        var cc = isClient ? hiringGuideCcFields() : null;
        var payload = {
          name: who,
          phone: String(fd.get("phone") || "").trim(),
          email: String(fd.get("email") || "").trim() || null,
          specialty: String(fd.get("role") || "").trim() || null,
          region: null,
          jobLabel: null,
          org: isClient ? String(fd.get("role") || "").trim() || null : null,
          interest: (isClient ? "Hiring / client contact" : "Physician / candidate contact") + (fd.get("note") ? " · " + fd.get("note") : ""),
          note: String(fd.get("note") || ""),
          source: "AMP website",
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          audience: isClient ? "client" : "candidate",
          channel: isClient ? "amp_site_contact_form" : "amp_site_contact_form",
          routeTo: isClient ? "bd_hub_randy" : "recruiting_responses",
          responsesFeedReady: true,
          formId: "site-contact-form",
          intent: intent
        };
        if (isClient && cc) {
          payload.cc = cc.cc;
          payload.ccEmails = cc.ccEmails;
          payload.ccPeople = cc.ccPeople;
        } else {
          payload.recruiterTag = "mike";
          payload.recruiter = "mike";
          payload.owner = "mfreeman";
        }
        setFormBusy(contactForm, true);
        postLeadHandoff(payload).then(function () {
          setFormBusy(contactForm, false);
          if (isClient) {
            stampMess("client", who + " · general contact → a hiring guide");
            go("confirm-client", { trail: true });
          } else {
            stampMess("physician", who + " · general contact → a recruiting guide");
            go("confirm-mess", { trail: true });
          }
        });
      });
    }

    bindEasyPayForm();

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
    $all(".ridge-demo-open, .ridge-app-walk-open").forEach(function (ridgeDemoGo) {
      ridgeDemoGo.addEventListener("click", function () {
        if (ridgeDemoGo.disabled) {
          jumpToRidgeWalk();
          return;
        }
        commitRidgeDemoAndOpen();
      });
    });
    $all(".ridge-walk-jump").forEach(function (jumpBtn) {
      jumpBtn.addEventListener("click", function () {
        var api = ridgeAccess();
        if (api && api.isDemoCommitted && api.isDemoCommitted()) {
          go("mi-lite-app", { trail: true });
          return;
        }
        jumpToRidgeWalk();
      });
    });
    ["ridge-demo-specialty", "ridge-demo-state", "ridge-app-walk-specialty", "ridge-app-walk-state"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el._ampWalkWired) return;
      el._ampWalkWired = true;
      el.addEventListener("change", syncRidgeWalkthrough);
    });
    var miLoginForm = $("#mi-lite-login-form");
    if (miLoginForm) miLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var api = ridgeAccess();
      if (!api) return;
      var result = api.verify({
        name: ($("#mi-lite-name") && $("#mi-lite-name").value) || ($("#ridge-verify-name") && $("#ridge-verify-name").value),
        org: ($("#mi-lite-org") && $("#mi-lite-org").value) || ($("#ridge-verify-org") && $("#ridge-verify-org").value),
        email: ($("#mi-lite-email") && $("#mi-lite-email").value) || ($("#ridge-verify-email") && $("#ridge-verify-email").value),
        phone: ($("#mi-lite-phone") && $("#mi-lite-phone").value) || ($("#ridge-verify-phone") && $("#ridge-verify-phone").value)
      });
      var err = $("#ridge-verify-error");
      if (!result.ok) {
        if (err) {
          err.hidden = false;
          err.textContent = result.reason === "work_email"
            ? "Use a verified work / org email — consumer inboxes (gmail, yahoo, outlook, icloud) stay locked."
            : "Name, org, work email, and phone are required.";
        }
        return;
      }
      if (err) err.hidden = true;
      hideRidgeDenial();
      go("mi-lite-app", { trail: true });
    });
    var simVerifyLogin = $("#ridge-simulate-verify");
    if (simVerifyLogin && !simVerifyLogin._ampWired) {
      simVerifyLogin._ampWired = true;
      simVerifyLogin.addEventListener("click", applyRidgeSimulateVerify);
    }
    var simVerifyApp = $("#ridge-simulate-verify-app");
    if (simVerifyApp && !simVerifyApp._ampWired) {
      simVerifyApp._ampWired = true;
      simVerifyApp.addEventListener("click", applyRidgeSimulateVerify);
    }
    var miDemo = $("#mi-lite-demo-login");
    if (miDemo) miDemo.addEventListener("click", function () {
      var api = ridgeAccess();
      if (api && api.isDemoCommitted && api.isDemoCommitted()) {
        go("mi-lite-app", { trail: true });
        return;
      }
      jumpToRidgeWalk();
    });
    var miLockAgain = $("#mi-lite-lock-again");
    if (miLockAgain) miLockAgain.addEventListener("click", function () {
      var api = ridgeAccess();
      if (api) api.reset();
      clearMiLiteUnlock();
      hideRidgeDenial();
      applyMiLiteLockUI();
      applyRidgeWalkGate();
      syncRidgeWalkthrough();
      if (window.AMPRidgeWorkbench && AMPRidgeWorkbench.refresh) AMPRidgeWorkbench.refresh();
      showMiMockToast("Market Intelligence seat reset. Pick specialty, then state, to reopen the demo.");
      go("mi-lite", { trail: true });
    });
    var miSave = $("#mi-lite-save");
    if (miSave) miSave.addEventListener("click", function () {
      showMiMockToast("Saved · snapshot held in this browser only. No CSV / API export in V1.");
    });
    var miCompare = $("#mi-lite-compare");
    if (miCompare) miCompare.addEventListener("click", function () {
      showMiMockToast("Compare · overlay is local only. A poll is one specialty × state.");
    });
    var miDownload = $("#mi-lite-download");
    if (miDownload) miDownload.addEventListener("click", function () {
      var opened = false;
      try {
        if (window.AMPRidgeWorkbench && typeof AMPRidgeWorkbench.downloadReport === "function") {
          opened = !!AMPRidgeWorkbench.downloadReport();
        }
      } catch (err) { opened = false; }
      if (opened) showMiMockToast("AMP-branded report opened. Print / Save PDF from the browser.");
      else showMiMockToast("Allow pop-ups to open the AMP-branded print sheet.");
    });
    document.body.addEventListener("click", function (ev) {
      if (ev.target.closest("#mi-lite-subscribe")) {
        ev.preventDefault();
        var miPlan = document.querySelector('input[name="mi-lite-plan"]:checked');
        openRidgeCheckout(miPlan ? miPlan.value : (state.miLitePlan || "region"));
        return;
      }
      var skuBtn = ev.target.closest("[data-ridge-checkout]");
      if (skuBtn && !skuBtn.getAttribute("data-go")) {
        ev.preventDefault();
        openRidgeCheckout(skuBtn.getAttribute("data-ridge-checkout"));
        return;
      }
      if (ev.target.closest("#ridge-checkout-confirm")) {
        ev.preventDefault();
        completeRidgeCheckout();
        return;
      }
      if (ev.target.closest("[data-ridge-checkout-close]")) {
        ev.preventDefault();
        closeRidgeCheckout();
        return;
      }
      var simPayBtn = ev.target.closest("[data-ridge-simulate]");
      if (simPayBtn) {
        ev.preventDefault();
        applyRidgeSimulatePay(simPayBtn.getAttribute("data-ridge-simulate"));
        return;
      }
      var unitChip = ev.target.closest("[data-ridge-unit-spec]");
      if (unitChip) {
        ev.preventDefault();
        openRidgeUnitChip(unitChip.getAttribute("data-ridge-unit-spec"), unitChip.getAttribute("data-ridge-unit-state"));
        return;
      }
      if (ev.target.closest("[data-ridge-unit-close]")) {
        ev.preventDefault();
        hideRidgeDenial();
      }
    });
    var api = ridgeAccess();
    if (api && api.onChange) {
      api.onChange(function () {
        applyMiLiteLockUI();
      });
    }
    if (api && api.onDenial) {
      api.onDenial(function (denial) {
        showRidgeDenial(denial);
      });
    }
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
        ? "On the client path, we bring a clear plan so you’re not reliving a hard search. You set the brief — AMP runs the search."
        : "On the candidate path, we start with your story — why you’d move, what would make you happier — then walk the lit path with you. No spam. Your goals lead.";
      var me = chatFunnel.path === "client" ? "I’m hiring / setting the brief" : "I’m exploring roles";
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
      var me2 = chatFunnel.path === "client" ? "I’m hiring / setting the brief" : "I’m exploring roles";
      var earn2 = chatFunnel.path === "client"
        ? "On the client path, we bring a clear plan so you’re not reliving a hard search. You set the brief — AMP runs the search."
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
       KEEP public form paths stay; Typeform embeds inline; ACH posts to the
       live Webflow handler (no Mess/localStorage banking, no fake success).
       /job/{slug}               → job/{slug}
       /blog-posts/{slug}        → blog/{slug}
       /market-intelligence      → mi-lite   (/ridge, /mi-lite alias → rewrite here)
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
    "market-intelligence": "mi-lite",
    "market-intelligence/login": "mi-lite-login",
    "market-intelligence/portal": "mi-lite-portal",
    "market-intelligence/app": "mi-lite-app",
    "ridge": "mi-lite",
    "ridge/login": "mi-lite-login",
    "ridge/portal": "mi-lite-portal",
    "ridge/app": "mi-lite-app",
    "mi-lite": "mi-lite",
    "mi-lite-login": "mi-lite-login",
    "mi-lite-portal": "mi-lite-portal",
    "mi-lite-app": "mi-lite-app",
    "why-amp": "education",
    "client-retained": "client-region"
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
    "mi-lite": "/market-intelligence",
    "mi-lite-login": "/market-intelligence/login",
    "mi-lite-portal": "/market-intelligence/portal",
    "mi-lite-app": "/market-intelligence/app"
  };

  function detectBasePath() {
    var p = location.pathname || "/";
    if (p === GH_PAGES_BASE || p.indexOf(GH_PAGES_BASE + "/") === 0) return GH_PAGES_BASE;
    /* Script URL fallback when pathname is unexpected (odd 404, trailing-slash miss). */
    try {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || "";
        if (src.indexOf(GH_PAGES_BASE + "/") !== -1) return GH_PAGES_BASE;
      }
    } catch (eDet) {}
    return "";
  }

  function normalizeRouteAlias(key) {
    if (key === "residents-fellows") return "residents";
    if (key === "market-intelligence" || key === "mi" || key === "ridge") return "mi-lite";
    if (key === "market-intelligence/login" || key === "ridge/login" || key === "mi-lite-login") return "mi-lite-login";
    if (key === "market-intelligence/portal" || key === "ridge/portal" || key === "mi-lite-portal") return "mi-lite-portal";
    if (key === "market-intelligence/app" || key === "ridge/app" || key === "mi-lite-app") return "mi-lite-app";
    if (key === "why-amp") return "education";
    if (key === "client-retained") return "client-region";
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
    title: "Adaptive Medical Partners | Permanent recruitment",
    description: "Adaptive Medical Partners — physician & healthcare recruiting firm. Dedicated investment search for candidates and organizations. 87% retention at 3 years, 1.7 avg interviews per placement, 700+ rural/FQHC/CAH partners, 16 years since 2010.",
    robots: "index,follow"
  };

  var SEO_NOINDEX = "noindex,follow";

  var SEO_MAP = {
    home: {
      title: "Adaptive Medical Partners | Permanent recruitment",
      description: SEO_DEFAULT.description,
      robots: "index,follow"
      /* h1 intentionally omitted — explore-title is locked in HTML; do not overwrite */
    },
    about: {
      title: "About" + BRAND_SUFFIX,
      description: "About Adaptive Medical Partners — a physician recruiting firm since 2010. 87% retention at 3 years, 1.7 interviews per hire, and 700+ rural, FQHC, and critical access partners.",
      robots: "index,follow",
      h1: "About Adaptive Medical Partners"
    },
    blog: {
      title: "Blog — Healthcare Recruiting Insights" + BRAND_SUFFIX,
      description: "Healthcare recruiting insights from Adaptive Medical Partners — dedicated investment search, physician retention, interview efficiency, and rural/FQHC recruiting.",
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
      title: "Organizational Services — Dedicated Physician Search" + BRAND_SUFFIX,
      description: "Organizational services from Adaptive Medical Partners — dedicated physician search for hospitals, groups, and FQHCs. You set the brief; AMP runs the search.",
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
      description: "Shareable authorization and expense forms for Adaptive Medical Partners candidates and organizations.",
      robots: "index,follow",
      h1: "Forms"
    },
    "form-candidate-authorization": {
      title: "Candidate Authorization" + BRAND_SUFFIX,
      description: "Candidate authorization and background verification for Adaptive Medical Partners searches.",
      robots: "index,follow",
      h1: "Candidate Authorization & Background Verification"
    },
    "form-interview-expense": {
      title: "Interview Expense Form" + BRAND_SUFFIX,
      description: "Interview travel expense form for Adaptive Medical Partners candidates.",
      robots: "index,follow",
      h1: "Interview Expense Form"
    },
    "form-easy-pay": {
      title: "Easy Pay Authorization" + BRAND_SUFFIX,
      description: "Secure ACH payment authorization for Adaptive Medical Partners organizations. Details are transmitted securely.",
      robots: "index,follow",
      h1: "Easy Pay Authorization"
    },
    "mi-lite": {
      title: "Market Intelligence — Specialty × State Market Read" + BRAND_SUFFIX,
      description: "Market Intelligence from Adaptive Medical Partners: specialty × state market depth before a search. Public proof — 87% retention at 3 years, 1.7 interviews per hire, 700+ rural/FQHC/CAH partners, 16 years since 2010. Canonical hub for hiring orgs and physician guides.",
      robots: "index,follow",
      h1: "See the market before you choose a path."
    },
    physician: {
      title: "For Physicians" + BRAND_SUFFIX,
      description: "Start the physician path with Adaptive Medical Partners. Choose your specialty and see practice-first roles with a recruiting guide.",
      robots: "index,follow"
    },
    client: {
      title: "For Healthcare Organizations" + BRAND_SUFFIX,
      description: "Start the hiring path with Adaptive Medical Partners. Tell us about your facility and specialty — AMP helps hospitals and groups find and keep physicians.",
      robots: "index,follow"
    },
    education: {
      title: "Why AMP" + BRAND_SUFFIX,
      description: "Why Adaptive Medical Partners — 87% retention at 3 years, 1.7 average interviews per successful placement, 700+ rural/FQHC/CAH partners, 16 years since 2010.",
      robots: "index,follow",
      h1: "Why AMP"
    },
    residents: {
      title: "Residents & Fellows" + BRAND_SUFFIX,
      description: "Coming out of training? Adaptive Medical Partners helps residents and fellows choose a first job with clear weeks, place-first questions, and contract literacy.",
      robots: "index,follow"
    },
    guides: {
      title: "Meet Your Guides" + BRAND_SUFFIX,
      description: "Meet the Adaptive Medical Partners guides — recruiting and hiring practitioners who stay until the hiring meeting is prepared.",
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
      description: "AMP Score lives at getampscore.com. This preview page is tease-level only — open the full product on getampscore.com.",
      robots: SEO_NOINDEX
    },
    "physician-rank": { title: "What Matters Most" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "physician-region": { title: "Choose Your Region" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "job-contact": { title: "Tap to Talk" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    chat: { title: "Ask a Guide" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "confirm-mess": { title: "Interest Captured" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "confirm-client": { title: "Meeting Request Captured" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-specialty": { title: "Hiring Specialty" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-region": { title: "Set the Search · Review the Path" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-retained": { title: "Set the Search · Review the Path" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "client-meeting": { title: "Request a Meeting" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    mpc: { title: "Tailor a Search" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mpc-portal": { title: "Client Browse Tools" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mpc-browse": { title: "Browse Tools" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mi-lite-portal": { title: "Market Intelligence Pricing" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mi-lite-login": { title: "Market Intelligence Sign In" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX },
    "mi-lite-app": { title: "Market Intelligence Sample" + BRAND_SUFFIX, description: SEO_DEFAULT.description, robots: SEO_NOINDEX }
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
        /* Hard lock: never overwrite homepage explore-title H1 */
        if (heading && !heading.classList.contains("explore-title")) heading.textContent = h1;
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
    /* Upgrade legacy #hash and aliases (/ridge, /mi-lite → /market-intelligence) to the canonical pathname. */
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
    try {
      var chip = document.getElementById("amp-build-chip");
      if (chip && window.__AMP_BUILD) chip.textContent = "amp-build " + window.__AMP_BUILD;
    } catch (eChip) {}
    try { bindWhyAmpProofPairs(); } catch (ePair) {}
    try { bindClientHireSheetClicks(); } catch (e) {}
    window.addEventListener("resize", layoutSignMediaFrames);
    window.addEventListener("orientationchange", layoutSignMediaFrames);
    window.addEventListener("resize", updateRankOrientationCopy);
    window.addEventListener("orientationchange", updateRankOrientationCopy);
    updateRankOrientationCopy();
    try { rewriteGoHrefs(); } catch (eHref) {}
    bind();
    try {
      if (window.AMPRidgeAccess && AMPRidgeAccess.consumeCheckoutQuery) AMPRidgeAccess.consumeCheckoutQuery();
    } catch (eCheckout) {}
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
          ? "Tap one — they help you set the brief and own the next step."
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
