/**
 * AMP Ask-a-guide Widget — mountain preview theme (from live Concierge)
 * Self-contained IIFE: injects CSS + bottom-right bubble/panel + soft funnel.
 * Entry fork: candidate (specialty → region → soft handoff) | client BD (need → contact → BD Hub).
 *
 * Config (any of): window.AMP_CHATBOT | data-amp-* on script | ?specialty=&region=&job=&recruiter=
 * AMP_CHATBOT keys: specialty, region, job, recruiter, recruiterTag, handoffUrl, autoOpen
 * Recruiter tag (accept either): recruiter OR recruiterTag → normalized to one field.
 *   window.AMP_CHATBOT.recruiter / .recruiterTag
 *   data-amp-recruiter / data-amp-recruiter-tag
 *   ?recruiter=amy|nate|stephanie|hadley|mike (aliases OK)
 * Untagged/general candidate pages → Mike (recruiterTag=mike / owner=mfreeman).
 * Job CMS pages should set owning recruiterTag today (payload ready for Overnight).
 * Client path unchanged → amp_chatbot_client_leads + routeTo bd_hub_randy (BD Hub).
 *
 * Handoff: always console.log + localStorage (amp_chatbot_leads / amp_chatbot_client_leads).
 * handoffUrl stays BLANK until CoS stands up fan-out endpoint (email + SMS + Mess Responses).
 * Do NOT invent handoffUrl. When set → ONE POST JSON fans to owning recruiter triple-ping.
 * No Bullhorn create · no Instantly email wiring in this ship.
 *
 * Version: 1.3.3 — kill leftover “don’t list live openings” copy · acknowledge live opening
 */
(function () {
  "use strict";
  if (window.__AMP_CHATBOT_LOADED__) return;
  window.__AMP_CHATBOT_LOADED__ = true;

  /* ---------- inject CSS ---------- */
  (function injectCss() {
    if (document.querySelector("style[data-amp-chatbot-css]")) return;
    var style = document.createElement("style");
    style.setAttribute("data-amp-chatbot-css", "1");
    style.textContent = "/* AMP Concierge Widget — Adaptive Medical Partners\n   Hosted asset. Production live Concierge (candidate + client). Teal #0D9488. */\n.amp-chat-root {\n  --amp-teal: #0D9488;\n  --amp-teal-dark: #0F766E;\n  --amp-teal-light: #CCFBF1;\n  --amp-teal-soft: #F0FDFA;\n  --amp-navy: #ecfdf5;\n  --amp-gray: #94a3b8;\n  --amp-gray-light: #1e293b;\n  --amp-border: rgba(148,163,184,0.28);\n  --amp-white: #111827;\n  --amp-bot-bg: #0f172a;\n  --amp-user-bg: #0D9488;\n  --amp-shadow: 0 4px 24px rgba(2, 12, 27, 0.35);\n  --amp-shadow-lg: 0 18px 50px rgba(2, 12, 27, 0.55);\n  --radius: 16px;\n  --radius-sm: 10px;\n  --font: \"Inter\", \"Segoe UI\", system-ui, -apple-system, sans-serif;\n  --panel-w: min(400px, calc(100vw - 24px));\n  --panel-h: min(640px, calc(100vh - 100px));\n  font-family: var(--font);\n  -webkit-font-smoothing: antialiased;\n  color: var(--amp-navy);\n  line-height: 1.4;\n  box-sizing: border-box;\n  z-index: 2147483000;\n}\n.amp-chat-root *, .amp-chat-root *::before, .amp-chat-root *::after { box-sizing: border-box; margin: 0; padding: 0; }\n.amp-chat-root.amp-hidden { display: none !important; }\n\n.amp-chat-launcher {\n  position: fixed;\n  right: 20px;\n  bottom: 20px;\n  z-index: 2147483001;\n  width: 60px;\n  height: 60px;\n  border-radius: 50%;\n  border: 2.5px solid rgba(153, 246, 228, 0.98);\n  background: linear-gradient(135deg, var(--amp-teal) 0%, var(--amp-teal-dark) 100%);\n  color: #fff;\n  cursor: pointer;\n  box-shadow: var(--amp-shadow-lg), 0 0 0 3px rgba(13, 148, 136, 0.42), 0 0 20px rgba(13, 148, 136, 0.55);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;\n  font-family: inherit;\n  animation: ampLauncherPulse 2.4s ease-in-out infinite;\n}\n@keyframes ampLauncherPulse {\n  0%, 100% {\n    border-color: rgba(153, 246, 228, 0.95);\n    box-shadow: 0 12px 40px rgba(15, 118, 110, 0.22), 0 0 0 3px rgba(13, 148, 136, 0.45), 0 0 18px rgba(45, 212, 191, 0.55), 0 0 0 0 rgba(13, 148, 136, 0.45);\n  }\n  50% {\n    border-color: rgba(204, 251, 241, 1);\n    box-shadow: 0 14px 44px rgba(15, 118, 110, 0.34), 0 0 0 4px rgba(13, 148, 136, 0.55), 0 0 28px rgba(45, 212, 191, 0.75), 0 0 0 14px rgba(13, 148, 136, 0);\n  }\n}\n.amp-chat-launcher:hover { transform: scale(1.05); border-color: #fff; box-shadow: 0 14px 44px rgba(15, 118, 110, 0.36), 0 0 0 4px rgba(13, 148, 136, 0.5), 0 0 26px rgba(45, 212, 191, 0.7); animation: none; }\n.amp-chat-launcher:active { transform: scale(0.97); }\n.amp-chat-launcher.amp-is-open {\n  animation: none;\n  border-color: rgba(153, 246, 228, 0.85);\n  box-shadow: var(--amp-shadow-lg), 0 0 0 3px rgba(13, 148, 136, 0.35), 0 0 14px rgba(13, 148, 136, 0.4);\n}\n.amp-chat-launcher .amp-launcher-close { display: none; font-size: 28px; line-height: 1; font-weight: 400; }\n.amp-chat-launcher.amp-is-open .amp-launcher-icon { display: none; }\n.amp-chat-launcher.amp-is-open .amp-launcher-close { display: block; }\n.amp-chat-launcher .amp-launcher-icon { display: flex; align-items: center; justify-content: center; }\n\n.amp-chat-panel {\n  position: fixed;\n  right: 20px;\n  bottom: 92px;\n  width: var(--panel-w);\n  height: var(--panel-h);\n  min-height: 420px;\n  background: var(--amp-white);\n  border-radius: 20px;\n  box-shadow: var(--amp-shadow-lg), 0 0 0 1px var(--amp-border);\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  z-index: 2147483002;\n  font-family: var(--font);\n}\n.amp-chat-panel.amp-hidden { display: none !important; }\n\n.amp-chat-header {\n  background: linear-gradient(135deg, var(--amp-teal) 0%, var(--amp-teal-dark) 100%);\n  color: #fff;\n  padding: 14px 16px;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-shrink: 0;\n}\n.amp-chat-header .amp-avatar {\n  width: 40px; height: 40px; border-radius: 50%;\n  background: rgba(255,255,255,0.22);\n  display: flex; align-items: center; justify-content: center;\n  font-weight: 700; font-size: 13px; letter-spacing: -0.02em; flex-shrink: 0;\n}\n.amp-chat-header .amp-meta { flex: 1; min-width: 0; }\n.amp-chat-header .amp-meta .amp-name { font-weight: 600; font-size: 0.95rem; line-height: 1.2; }\n.amp-chat-header .amp-meta .amp-status {\n  font-size: 0.75rem; opacity: 0.9; display: flex; align-items: center; gap: 5px; margin-top: 2px;\n}\n.amp-chat-header .amp-meta .amp-status::before {\n  content: \"\"; width: 7px; height: 7px; border-radius: 50%;\n  background: #6EE7B7; box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.35);\n}\n.amp-sample-tag {\n  font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;\n  background: rgba(255,255,255,0.2); padding: 3px 7px; border-radius: 6px; flex-shrink: 0;\n}\n.amp-chat-close {\n  appearance: none; border: none; background: rgba(255,255,255,0.18); color: #fff;\n  width: 32px; height: 32px; border-radius: 8px; font-size: 22px; line-height: 1;\n  cursor: pointer; flex-shrink: 0; margin-left: 4px;\n  display: flex; align-items: center; justify-content: center; font-family: inherit;\n}\n.amp-chat-close:hover { background: rgba(255,255,255,0.28); }\n\n.amp-chat-messages {\n  flex: 1; overflow-y: auto; padding: 16px 14px 8px; background: var(--amp-bot-bg);\n  display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; -webkit-overflow-scrolling: touch;\n}\n.amp-msg { display: flex; flex-direction: column; max-width: 90%; animation: ampFadeIn 0.28s ease; }\n@keyframes ampFadeIn {\n  from { opacity: 0; transform: translateY(8px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n.amp-msg.amp-bot { align-self: flex-start; }\n.amp-msg.amp-user { align-self: flex-end; }\n.amp-msg .amp-bubble {\n  padding: 10px 14px; border-radius: var(--radius); font-size: 0.9rem; line-height: 1.45; word-wrap: break-word;\n}\n.amp-msg.amp-bot .amp-bubble {\n  background: rgba(15,23,42,0.95); color: #ecfdf5; border: 1px solid rgba(94,234,212,0.22);\n  border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);\n}\n.amp-msg.amp-user .amp-bubble { background: var(--amp-user-bg); color: #fff; border-bottom-right-radius: 4px; }\n.amp-msg .amp-time { font-size: 10px; color: var(--amp-gray); margin-top: 3px; padding: 0 4px; }\n.amp-msg.amp-user .amp-time { text-align: right; }\n\n.amp-context-strip { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }\n.amp-context-pill {\n  font-size: 0.7rem; font-weight: 600; background: #fff; border: 1px solid var(--amp-teal-light);\n  color: var(--amp-teal-dark); padding: 3px 8px; border-radius: 999px;\n}\n\n.amp-typing {\n  display: flex; gap: 4px; padding: 12px 16px; background: var(--amp-white);\n  border: 1px solid var(--amp-border); border-radius: var(--radius); border-bottom-left-radius: 4px;\n  width: fit-content; align-self: flex-start;\n}\n.amp-typing span {\n  width: 7px; height: 7px; border-radius: 50%; background: var(--amp-teal); opacity: 0.5;\n  animation: ampBounce 1.2s infinite;\n}\n.amp-typing span:nth-child(2) { animation-delay: 0.15s; }\n.amp-typing span:nth-child(3) { animation-delay: 0.3s; }\n@keyframes ampBounce {\n  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }\n  30% { transform: translateY(-4px); opacity: 1; }\n}\n\n.amp-chat-composer {\n  flex-shrink: 0; border-top: 1px solid var(--amp-border); background: var(--amp-white); padding: 12px 14px 14px;\n}\n.amp-chip-groups { display: flex; flex-direction: column; gap: 10px; }\n.amp-chip-group { display: flex; flex-direction: column; gap: 6px; }\n.amp-chip-group-label {\n  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;\n  color: var(--amp-gray);\n}\n.amp-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 0; }\n.amp-chip {\n  appearance: none; border: 1.5px solid var(--amp-teal); background: var(--amp-white);\n  color: var(--amp-teal-dark); font-family: inherit; font-size: 0.82rem; font-weight: 550;\n  padding: 8px 14px; border-radius: 999px; cursor: pointer;\n  transition: background 0.15s, color 0.15s, transform 0.1s;\n}\n.amp-chip:hover { background: var(--amp-teal); color: #fff; }\n.amp-chip:active { transform: scale(0.97); }\n.amp-chip:disabled { opacity: 0.45; cursor: default; pointer-events: none; }\n.amp-chip.amp-chip-muted { border-color: var(--amp-border); color: var(--amp-gray); }\n.amp-chip.amp-chip-muted:hover { background: var(--amp-gray-light); color: var(--amp-navy); border-color: var(--amp-gray); }\n\n.amp-capture-form { display: flex; flex-direction: column; gap: 8px; }\n.amp-capture-form label { font-size: 0.75rem; font-weight: 600; color: var(--amp-gray); }\n.amp-capture-form input {\n  font-family: inherit; font-size: 0.9rem; padding: 10px 12px; border: 1.5px solid var(--amp-border);\n  border-radius: var(--radius-sm); outline: none; transition: border-color 0.15s; color: var(--amp-navy);\n  width: 100%;\n}\n.amp-capture-form input:focus { border-color: var(--amp-teal); }\n.amp-capture-form input::placeholder { color: #94A3B8; }\n.amp-btn-primary {\n  appearance: none; border: none; background: var(--amp-teal); color: #fff; font-family: inherit;\n  font-size: 0.9rem; font-weight: 600; padding: 11px 16px; border-radius: var(--radius-sm);\n  cursor: pointer; margin-top: 4px; transition: background 0.15s;\n}\n.amp-btn-primary:hover { background: var(--amp-teal-dark); }\n.amp-btn-primary:disabled { opacity: 0.5; cursor: default; }\n\n.amp-handoff {\n  background: var(--amp-teal-soft); border: 1px solid var(--amp-teal-light);\n  border-radius: var(--radius-sm); padding: 14px; margin-top: 4px;\n}\n.amp-handoff .amp-icon {\n  width: 36px; height: 36px; border-radius: 50%; background: var(--amp-teal); color: #fff;\n  display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 18px;\n}\n.amp-handoff h3 { font-size: 0.95rem; font-weight: 700; color: var(--amp-navy); margin-bottom: 6px; }\n.amp-handoff p { font-size: 0.8rem; color: var(--amp-gray); line-height: 1.45; margin-bottom: 10px; }\n.amp-handoff .amp-summary {\n  background: #fff; border-radius: 8px; padding: 10px; font-size: 0.78rem; color: var(--amp-navy); line-height: 1.55;\n}\n.amp-handoff .amp-summary strong { color: var(--amp-teal-dark); font-weight: 600; }\n.amp-handoff .amp-stub-note { margin-top: 10px; font-size: 11px; color: var(--amp-gray); font-style: italic; }\n\n.amp-restart-row { text-align: center; padding-top: 8px; display: flex; flex-direction: column; gap: 8px; align-items: center; }\n.amp-btn-ghost {\n  appearance: none; border: none; background: transparent; color: var(--amp-teal-dark);\n  font-family: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer;\n  text-decoration: underline; text-underline-offset: 2px;\n}\n.amp-btn-ghost:hover { color: var(--amp-navy); }\n.amp-composer-hint { font-size: 0.72rem; color: var(--amp-gray); text-align: center; margin-top: 8px; }\n\n@media (max-width: 480px) {\n  .amp-chat-panel {\n    right: 8px; left: 8px; bottom: 84px; width: auto;\n    height: min(70vh, 560px); min-height: 360px;\n  }\n  .amp-chat-launcher { right: 14px; bottom: 14px; width: 56px; height: 56px; }\n  .amp-chip { padding: 7px 12px; font-size: 0.78rem; }\n}\n";
    (document.head || document.documentElement).appendChild(style);
  })();


  var cfg = Object.assign({}, window.AMP_CHATBOT || {});
  var params = new URLSearchParams(window.location.search);

  function fromScriptData(key) {
    var scripts = document.querySelectorAll("script[data-amp-specialty],script[data-amp-region],script[data-amp-recruiter],script[data-amp-recruiter-tag],script[data-amp-chatbot-js],script[src*='widget.js'],script[src*='amp-chatbot-widget']");
    for (var i = 0; i < scripts.length; i++) {
      var v = scripts[i].getAttribute("data-amp-" + key);
      if (v) return v.trim();
    }
    var any = document.querySelector("[data-amp-" + key + "]");
    return any ? (any.getAttribute("data-amp-" + key) || "").trim() : "";
  }

  function resolve(key) {
    var c = (cfg[key] || "").toString().trim();
    if (c) return c;
    var d = fromScriptData(key);
    if (d) return d;
    return (params.get(key) || "").trim();
  }

  var paramSpecialty = resolve("specialty");
  var paramRegion = resolve("region");
  var paramJob = resolve("job");
  var handoffUrl = (cfg.handoffUrl || fromScriptData("handoff-url") || "").trim();

  /* Recruiter tagging (Mike lock 2026-09-02) — candidate → recruiting_responses */
  var RECRUITER_CANON = ["amy", "nate", "stephanie", "hadley", "mike"];
  var RECRUITER_ALIASES = {
    amy: "amy",
    nate: "nate",
    stephanie: "stephanie",
    hadley: "hadley",
    mike: "mike",
    amyers: "amy",
    nsmith: "nate",
    syoungblood: "stephanie",
    hherrera: "hadley",
    mfreeman: "mike"
  };
  var RECRUITER_OWNER = {
    amy: "amyers",
    nate: "nsmith",
    stephanie: "syoungblood",
    hadley: "hherrera",
    mike: "mfreeman"
  };
  function normalizeRecruiterTag(raw) {
    if (!raw) return null;
    var key = String(raw).trim().toLowerCase().replace(/^@/, "");
    if (key.indexOf("@") !== -1) key = key.split("@")[0];
    var tag = RECRUITER_ALIASES[key] || null;
    if (tag && RECRUITER_CANON.indexOf(tag) !== -1) return tag;
    return null;
  }
  function resolveRecruiterTag() {
    /* Accept recruiter OR recruiterTag (config / data-amp-* / query); normalize to one tag */
    var raw = resolve("recruiter");
    if (!raw) raw = resolve("recruiterTag");
    if (!raw) raw = fromScriptData("recruiter");
    if (!raw) raw = fromScriptData("recruiter-tag");
    if (!raw && params.get("recruiter")) raw = params.get("recruiter");
    if (!raw && params.get("recruiterTag")) raw = params.get("recruiterTag");
    var tag = normalizeRecruiterTag(raw);
    /* Untagged / general site page → Mike (future fan-out: email + SMS + Mess Responses) */
    return tag || "mike";
  }
  var resolvedRecruiterTag = resolveRecruiterTag();
  var resolvedRecruiterOwner = RECRUITER_OWNER[resolvedRecruiterTag] || "mfreeman";


  /* Bullhorn chip labels → full specialty / role values (Mike 2026-09-02) */
  var PHYSICIAN_CHIPS = [
    { label: "FP", value: "Family Medicine" },
    { label: "IM", value: "Internal Medicine" },
    { label: "OBG", value: "Obstetrics and Gynecology" },
    { label: "EM", value: "Emergency Medicine" },
    { label: "Psych", value: "Psychiatry" },
    { label: "PD", value: "Pediatrics" },
    { label: "GS", value: "General Surgery" },
    { label: "ORS", value: "Orthopedic Surgery" },
    { label: "ANES", value: "Anesthesiology" },
    { label: "CD", value: "Cardiology" }
  ];
  var ALLIED_CHIPS = [
    { label: "NP", value: "Nurse Practitioner" },
    { label: "PA", value: "Physician Assistant" },
    { label: "CRNA", value: "CRNA" },
    { label: "LCSW", value: "LCSW" },
    { label: "DDS", value: "Dentistry" },
    { label: "Other", value: "__other__" }
  ];
  var ALL_SPECIALTY_VALUES = PHYSICIAN_CHIPS.concat(ALLIED_CHIPS)
    .map(function (c) { return c.value; })
    .filter(function (v) { return v !== "__other__"; });

  var REGIONS = ["Southeast", "Midwest", "Southwest", "Northeast", "West"];

  var state = {
    audience: null, /* "candidate" | "client" */
    specialty: null,
    region: null,
    jobLabel: null,
    org: null,
    name: null,
    phone: null,
    email: null,
    source: "website",
    recruiterTag: resolvedRecruiterTag, /* owning recruiter for Mess Responses Overnight */
    recruiter: resolvedRecruiterTag, /* alias (same value) for Zapier mapping clarity */
    owner: resolvedRecruiterOwner
  };

  function normalizeSpecialty(s) {
    if (!s) return null;
    var hit = ALL_SPECIALTY_VALUES.find(function (x) { return x.toLowerCase() === s.toLowerCase(); });
    if (hit) return hit;
    var byLabel = PHYSICIAN_CHIPS.concat(ALLIED_CHIPS).find(function (c) {
      return c.label.toLowerCase() === s.toLowerCase() && c.value !== "__other__";
    });
    return byLabel ? byLabel.value : s;
  }
  function normalizeRegion(s) {
    if (!s) return null;
    var hit = REGIONS.find(function (x) { return x.toLowerCase() === s.toLowerCase(); });
    return hit || s;
  }
  function nowTime() {
    return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- DOM mount ---------- */
  var root = document.createElement("div");
  root.className = "amp-chat-root";
  root.setAttribute("data-amp-chatbot", "1");
  root.innerHTML =
    '<button type="button" class="amp-chat-launcher" aria-label="Open AMP Concierge" aria-expanded="false" aria-controls="amp-chat-panel">' +
      '<span class="amp-launcher-icon" aria-hidden="true">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H13l-3.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
        "</svg>" +
      "</span>" +
      '<span class="amp-launcher-close" aria-hidden="true">×</span>' +
    "</button>" +
    '<div id="amp-chat-panel" class="amp-chat-panel amp-hidden" role="dialog" aria-label="Ask a guide" aria-modal="false">' +
      '<header class="amp-chat-header">' +
        '<div class="amp-avatar" aria-hidden="true">AMP</div>' +
        '<div class="amp-meta">' +
          '<div class="amp-name">Ask a guide</div>' +
          '<div class="amp-status">Online</div>' +
        "</div>" +
        '<button type="button" class="amp-chat-close" aria-label="Close chat">×</button>' +
      "</header>" +
      '<div class="amp-chat-messages" aria-live="polite"></div>' +
      '<div class="amp-chat-composer" aria-label="Chat replies"></div>' +
    "</div>";

  function mount() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", mount);
      return;
    }
    document.body.appendChild(root);
    bindUI();
  }

  var launcher, panel, messagesEl, composerEl, closeBtn, started;

  function bindUI() {
    launcher = root.querySelector(".amp-chat-launcher");
    panel = root.querySelector(".amp-chat-panel");
    messagesEl = root.querySelector(".amp-chat-messages");
    composerEl = root.querySelector(".amp-chat-composer");
    closeBtn = root.querySelector(".amp-chat-close");
    started = false;

    launcher.addEventListener("click", function () {
      if (panel.classList.contains("amp-hidden")) {
        openPanel();
        ensureStart();
      } else {
        closePanel();
      }
    });
    closeBtn.addEventListener("click", closePanel);

    if (cfg.autoOpen) {
      openPanel();
      ensureStart();
    }
  }

  function openPanel() {
    panel.classList.remove("amp-hidden");
    launcher.classList.add("amp-is-open");
    launcher.setAttribute("aria-expanded", "true");
  }
  function closePanel() {
    panel.classList.add("amp-hidden");
    launcher.classList.remove("amp-is-open");
    launcher.setAttribute("aria-expanded", "false");
  }
  function ensureStart() {
    if (started) return;
    started = true;
    startConversation(false);
  }

  function scrollBottom() {
    requestAnimationFrame(function () {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function addBot(html, delayMs) {
    return new Promise(function (resolve) {
      var typing = document.createElement("div");
      typing.className = "amp-typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      messagesEl.appendChild(typing);
      scrollBottom();
      setTimeout(function () {
        typing.remove();
        var msg = document.createElement("div");
        msg.className = "amp-msg amp-bot";
        msg.innerHTML =
          '<div class="amp-bubble">' + html + '</div><div class="amp-time">' + nowTime() + "</div>";
        messagesEl.appendChild(msg);
        scrollBottom();
        resolve();
      }, delayMs == null ? 650 : delayMs);
    });
  }

  function addUser(text) {
    var msg = document.createElement("div");
    msg.className = "amp-msg amp-user";
    msg.innerHTML =
      '<div class="amp-bubble">' + escapeHtml(text) + '</div><div class="amp-time">' + nowTime() + "</div>";
    messagesEl.appendChild(msg);
    scrollBottom();
  }

  function clearComposer() { composerEl.innerHTML = ""; }

  function showChips(options, onPick) {
    clearComposer();
    var wrap = document.createElement("div");
    wrap.className = "amp-chips";
    options.forEach(function (opt) {
      var label = typeof opt === "string" ? opt : opt.label;
      var value = typeof opt === "string" ? opt : opt.value;
      var muted = typeof opt === "object" && opt.muted;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "amp-chip" + (muted ? " amp-chip-muted" : "");
      btn.textContent = label;
      btn.addEventListener("click", function () {
        wrap.querySelectorAll(".amp-chip").forEach(function (c) { c.disabled = true; });
        onPick(value, label);
      });
      wrap.appendChild(btn);
    });
    composerEl.appendChild(wrap);
    var hint = document.createElement("p");
    hint.className = "amp-composer-hint";
    hint.textContent = "Chips = fast path · a recruiter follows up on next steps";
    composerEl.appendChild(hint);
  }

  function appendChipRow(parent, chips, onPick) {
    var wrap = document.createElement("div");
    wrap.className = "amp-chips";
    chips.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "amp-chip";
      btn.textContent = opt.label;
      btn.addEventListener("click", function () {
        parent.querySelectorAll(".amp-chip").forEach(function (c) { c.disabled = true; });
        onPick(opt.value, opt.label);
      });
      wrap.appendChild(btn);
    });
    parent.appendChild(wrap);
  }

  function showSpecialtyChips(onPick) {
    clearComposer();
    var groups = document.createElement("div");
    groups.className = "amp-chip-groups";

    var g1 = document.createElement("div");
    g1.className = "amp-chip-group";
    var l1 = document.createElement("div");
    l1.className = "amp-chip-group-label";
    l1.textContent = "Physicians";
    g1.appendChild(l1);
    appendChipRow(g1, PHYSICIAN_CHIPS, onPick);
    groups.appendChild(g1);

    var g2 = document.createElement("div");
    g2.className = "amp-chip-group";
    var l2 = document.createElement("div");
    l2.className = "amp-chip-group-label";
    l2.textContent = "APPs · Allied · Dental";
    g2.appendChild(l2);
    appendChipRow(g2, ALLIED_CHIPS, onPick);
    groups.appendChild(g2);

    composerEl.appendChild(groups);
    var hint = document.createElement("p");
    hint.className = "amp-composer-hint";
    hint.textContent = state.audience === "client"
      ? "Pick the specialty / role you’re hiring for — Other lets you type it"
      : "Pick a specialty / role — Other lets you type yours";
    composerEl.appendChild(hint);
  }

  function showOtherSpecialtyInput() {
    clearComposer();
    var form = document.createElement("form");
    form.className = "amp-capture-form";
    var labelText = state.audience === "client" ? "Specialty / role you need" : "Your specialty / role";
    form.innerHTML =
      '<label for="amp-widget-other-spec">' + labelText + "</label>" +
      '<input id="amp-widget-other-spec" name="otherSpecialty" type="text" autocomplete="organization-title" placeholder="' + labelText + '" required />' +
      '<button type="submit" class="amp-btn-primary">Continue</button>';
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = form.querySelector("#amp-widget-other-spec").value.trim();
      if (!val) return;
      addUser(val);
      clearComposer();
      state.specialty = val;
      if (state.audience === "client") {
        askClientRegionOrCapture();
      } else {
        askRegionOrHandoff();
      }
    });
    composerEl.appendChild(form);
    form.querySelector("#amp-widget-other-spec").focus();
  }

  function onSpecialtyPicked(value, label) {
    if (value === "__other__") {
      addUser(label || "Other");
      clearComposer();
      return showOtherSpecialtyInput();
    }
    addUser(label || value);
    clearComposer();
    state.specialty = value;
    if (state.audience === "client") {
      askClientRegionOrCapture();
    } else {
      askRegionOrHandoff();
    }
  }

  function showCaptureForm() {
    clearComposer();
    var form = document.createElement("form");
    form.className = "amp-capture-form";
    var isClient = state.audience === "client";
    var submitLabel = isClient ? "Notify BD team" : "Notify recruiter";
    form.innerHTML =
      '<label for="amp-widget-name">Your name</label>' +
      '<input id="amp-widget-name" name="name" type="text" autocomplete="name" placeholder="Alex Rivera" required />' +
      '<label for="amp-widget-phone">Best cell</label>' +
      '<input id="amp-widget-phone" name="phone" type="tel" autocomplete="tel" placeholder="(555) 123-4567" required />' +
      (isClient
        ? '<label for="amp-widget-email">Best email</label>' +
          '<input id="amp-widget-email" name="email" type="email" autocomplete="email" placeholder="you@hospital.org" required />' +
          '<label for="amp-widget-org">Org / facility <span style="font-weight:500;opacity:.75">(optional)</span></label>' +
          '<input id="amp-widget-org" name="org" type="text" autocomplete="organization" placeholder="Facility or group name" />'
        : "") +
      '<button type="submit" class="amp-btn-primary">' + submitLabel + "</button>";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#amp-widget-name").value.trim();
      var phone = form.querySelector("#amp-widget-phone").value.trim();
      if (!name || !phone) return;
      state.name = name;
      state.phone = phone;
      state.email = null;
      if (isClient) {
        var emailEl = form.querySelector("#amp-widget-email");
        var email = emailEl ? emailEl.value.trim() : "";
        if (!email) return;
        state.email = email;
        var orgEl = form.querySelector("#amp-widget-org");
        state.org = orgEl ? (orgEl.value.trim() || null) : null;
      }
      addUser(
        name + " · " + phone +
        (state.email ? " · " + state.email : "") +
        (state.org ? " · " + state.org : "")
      );
      clearComposer();
      runHandoff();
    });
    composerEl.appendChild(form);
    form.querySelector("#amp-widget-name").focus();
  }

  function contextStripHtml() {
    var pills = [];
    if (state.specialty) pills.push(state.specialty);
    if (state.region) pills.push(state.region);
    if (state.jobLabel) pills.push(state.jobLabel);
    if (state.org) pills.push(state.org);
    if (!pills.length) return "";
    return (
      '<div class="amp-context-strip">' +
      pills.map(function (p) {
        return '<span class="amp-context-pill">' + escapeHtml(p) + "</span>";
      }).join("") +
      "</div>"
    );
  }

  /* ---------- Entry fork ---------- */
  function askAudience() {
    return addBot(
      "Welcome to the range. Are you searching for the peak, or holding it for your organization?",
      500
    ).then(function () {
      showChips(
        [
          { label: "Candidate path", value: "candidate" },
          { label: "Client path", value: "client" }
        ],
        function (value, label) {
          addUser(label);
          clearComposer();
          state.audience = value;
          if (value === "client") {
            startClientPath();
          } else {
            startCandidatePath();
          }
        }
      );
    });
  }

  function startCandidatePath() {
    var knownSpecialty = !!state.specialty;
    var knownRegion = !!state.region;

    if (knownSpecialty) {
      return addBot(
        "Great — we’ll connect you with a recruiter.",
        450
      ).then(function () {
        return addBot(
          contextStripHtml() +
            "<p>We’ve noted what we know so you don’t start from a cold ask. A recruiter will follow up on this opening — fit, schedule, and next steps.</p>",
          550
        );
      }).then(function () {
        if (knownSpecialty && !knownRegion) {
          return addBot(
            "Since we already know your specialty focus, which <strong>region</strong> should we note?",
            600
          ).then(askRegion);
        }
        return beginSoftHandoff();
      });
    }

    return addBot(
      "To connect you with the right recruiter, what’s your <strong>specialty or role</strong>?",
      550
    ).then(function () {
      showSpecialtyChips(onSpecialtyPicked);
    });
  }

  function startClientPath() {
    return addBot(
      "Thanks — we’ll route you to our business development team. What <strong>specialty or role</strong> are you looking to fill?",
      550
    ).then(function () {
      showSpecialtyChips(onSpecialtyPicked);
    });
  }

  function askSpecialty() {
    return addBot(
      "Which specialty or role should we note for a recruiter follow-up?",
      500
    ).then(function () {
      showSpecialtyChips(onSpecialtyPicked);
    });
  }

  function askRegion() {
    var prompt = state.audience === "client"
      ? "Which region is this search focused on? (optional — skip if not sure)"
      : "Which region interests you most right now?";
    return addBot(prompt, 500).then(function () {
      var chips = REGIONS.concat([
        { label: "Any region", value: "Any region", muted: true }
      ]);
      showChips(chips, function (reg) {
        addUser(reg);
        clearComposer();
        state.region = reg === "Any region" ? null : reg;
        if (state.audience === "client") {
          beginClientHandoff();
        } else {
          beginSoftHandoff();
        }
      });
    });
  }

  function askRegionOrHandoff() {
    if (state.region) return beginSoftHandoff();
    return askRegion();
  }

  function askClientRegionOrCapture() {
    /* Region optional for clients — still offer chips, then capture */
    return askRegion();
  }

  function beginSoftHandoff() {
    var focus =
      [state.jobLabel, state.specialty, state.region].filter(Boolean).join(" · ") || "your interest";
    return addBot(
      "Thanks — noted <strong>" +
        escapeHtml(focus) +
        "</strong>. A recruiter can follow up on fit, schedule, and next steps for this opening. What’s your name and best cell?",
      650
    ).then(showCaptureForm);
  }

  function beginClientHandoff() {
    var focus =
      [state.specialty, state.region].filter(Boolean).join(" · ") || "your search";
    return addBot(
      "Got it — <strong>" +
        escapeHtml(focus) +
        "</strong>. Leave your name, best cell, best email, and optional org/facility so our BD team can follow up.",
      650
    ).then(showCaptureForm);
  }

  function buildPayload() {
    var isClient = state.audience === "client";
    var interestBits = [];
    if (state.specialty) interestBits.push(state.specialty);
    if (state.region) interestBits.push(state.region);
    if (state.jobLabel) interestBits.push(state.jobLabel);
    if (isClient && state.org) interestBits.push(state.org);
    var payload = {
      name: state.name,
      phone: state.phone,
      email: isClient ? (state.email || null) : null,
      specialty: state.specialty,
      region: state.region,
      jobLabel: state.jobLabel,
      org: isClient ? state.org : null,
      interest: interestBits.join(" · ") || (isClient ? "Client staffing need" : "General candidate opportunities"),
      source: "AMP website",
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      audience: isClient ? "client" : "candidate",
      channel: isClient ? "amp_client_concierge" : "amp_candidate_concierge",
      /* FUTURE fan-out (handoffUrl blank until CoS stands up endpoint — do NOT invent URL):
       * Candidate + recruiterTag set (job page) → owning recruiter triple-ping: email + SMS + Mess Responses
       * Candidate untagged/general → Mike
       * Client fork → BD Hub (bd_hub_randy) — do not break
       */
      routeTo: isClient ? "bd_hub_randy" : "recruiting_responses",
      /* Reserved fields for future Responses / Bullhorn / BD Hub wiring — no Bullhorn/Instantly invent */
      responsesFeedReady: true
    };
    if (!isClient) {
      var tag = state.recruiterTag || state.recruiter || "mike";
      payload.recruiterTag = tag; /* owning recruiter tag for Mess Responses Overnight */
      payload.recruiter = tag; /* alias for clarity in Zapier mapping */
      payload.owner = state.owner || RECRUITER_OWNER[tag] || "mfreeman";
    }
    return payload;
  }

  function persistLead(payload) {
    try {
      var isClient = payload.audience === "client";
      var key = isClient ? "amp_chatbot_client_leads" : "amp_chatbot_leads";
      var list = [];
      try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      list.push(payload);
      if (list.length > 50) list = list.slice(-50);
      localStorage.setItem(key, JSON.stringify(list));
      if (isClient) {
        localStorage.setItem("amp_chatbot_last_client_lead", JSON.stringify(payload));
        /* Also mirror into amp_chatbot_leads so existing readers still see activity */
        try {
          var all = JSON.parse(localStorage.getItem("amp_chatbot_leads") || "[]");
          if (!Array.isArray(all)) all = [];
          all.push(payload);
          if (all.length > 50) all = all.slice(-50);
          localStorage.setItem("amp_chatbot_leads", JSON.stringify(all));
        } catch (e2) { /* ignore */ }
      } else {
        localStorage.setItem("amp_chatbot_last_lead", JSON.stringify(payload));
      }
    } catch (e) {
      console.warn("[AMP Chatbot] localStorage persist failed:", e);
    }
  }

  function postHandoff(payload) {
    persistLead(payload);
    var storeKey = payload.audience === "client" ? "amp_chatbot_client_leads" : "amp_chatbot_leads";
    console.log("[AMP Chatbot] Handoff lead captured. Saved to localStorage key " + storeKey + ":", payload);
    if (!handoffUrl) {
      return Promise.resolve({ ok: false, stub: true, persisted: true });
    }
    /* handoffUrl blank until CoS fan-out (email+SMS+Mess). When set: ONE POST JSON — do not invent URL */
    return fetch(handoffUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "omit"
    })
      .then(function (res) {
        console.log("[AMP Chatbot] Handoff POST status:", res.status);
        return { ok: res.ok, status: res.status, persisted: true };
      })
      .catch(function (err) {
        console.warn("[AMP Chatbot] Handoff POST failed (localStorage still OK):", err);
        return { ok: false, error: String(err), persisted: true };
      });
  }

  function runHandoff() {
    var payload = buildPayload();
    var isClient = payload.audience === "client";
    var waitingMsg = isClient ? "Thanks — notifying our BD team now…" : "Thanks — notifying a recruiter now…";
    return addBot(waitingMsg, 500)
      .then(function () { return postHandoff(payload); })
      .then(function () {
        var title = isClient ? "BD team handoff" : "Recruiter handoff";
        var blurb = isClient
          ? "Thanks — our business development team will follow up. Here’s what would be passed along:"
          : "Thanks — a recruiter will follow up. Here’s what would be passed along:";
        var interestLabel = [state.specialty, state.region, state.jobLabel]
          .filter(Boolean).join(" · ") || (isClient ? "Client staffing need" : "General candidate opportunities");
        var summaryHtml =
          '<div class="amp-handoff">' +
          '<div class="amp-icon">✓</div>' +
          "<h3>" + title + "</h3>" +
          "<p>" + blurb + "</p>" +
          '<div class="amp-summary">' +
          "<div><strong>Name:</strong> " + escapeHtml(state.name) + "</div>" +
          "<div><strong>Cell:</strong> " + escapeHtml(state.phone) + "</div>" +
          (isClient && state.email
            ? "<div><strong>Email:</strong> " + escapeHtml(state.email) + "</div>"
            : "") +
          (isClient && state.org
            ? "<div><strong>Org:</strong> " + escapeHtml(state.org) + "</div>"
            : "") +
          "<div><strong>Interest:</strong> " + escapeHtml(interestLabel) + "</div>" +
          "<div><strong>Path:</strong> " + (isClient ? "Client / BD" : "Candidate") + "</div>" +
          (isClient
            ? ""
            : "<div><strong>Recruiter:</strong> " + escapeHtml(state.recruiterTag || "mike") + "</div>") +
          "<div><strong>Source:</strong> AMP website</div>" +
          "</div>" +
          "</div>";
        return addBot(summaryHtml, 800);
      })
      .then(showRestart);
  }

  function showRestart() {
    clearComposer();
    var row = document.createElement("div");
    row.className = "amp-restart-row";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "amp-btn-ghost";
    btn.textContent = "Restart conversation";
    btn.addEventListener("click", function () { startConversation(true); });
    row.appendChild(btn);
    composerEl.appendChild(row);
  }

  function startConversation(isRestart) {
    messagesEl.innerHTML = "";
    clearComposer();
    state.audience = null;
    state.name = null;
    state.phone = null;
    state.email = null;
    state.org = null;
    state.specialty = normalizeSpecialty(paramSpecialty);
    state.region = normalizeRegion(paramRegion);
    state.jobLabel = paramJob || null;
    state.recruiterTag = resolvedRecruiterTag;
    state.recruiter = resolvedRecruiterTag;
    state.owner = resolvedRecruiterOwner;

    return addBot(
      "Hi — welcome to the range. <strong>Adaptive Medical Partners</strong> is your guide.",
      isRestart ? 300 : 400
    ).then(function () {
      return askAudience();
    });
  }

  mount();
  try {
    window.AMP_CHATBOT = window.AMP_CHATBOT || {};
    window.AMP_CHATBOT.open = function () { openPanel(); if (!started) { started = true; startConversation(false); } };
    window.AMP_CHATBOT.close = closePanel;
  } catch (e) {}
})();
