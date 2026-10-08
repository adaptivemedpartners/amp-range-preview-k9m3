/* 2220: in-house visitor log. Sends page path + title to our own server function, which records the
   visitor's internet address and matches it to an organization from public ownership records.
   Team devices can opt out once with ?notrack=1 (undo with ?notrack=0).
   2302: AMP Social attribution. When the page is opened from a tagged link (?utm_source=...&utm_term=person), the tags
   ride along with the visit (first page = is_entry, the click) and are remembered in this browser (localStorage
   amp_utm, 90 days, latest tagged link wins) so a later Market Intelligence sign-up records who and which platform
   sent the person. Only utm_* tags are kept; nothing else from the address is stored. */
(function (w, d) {
  "use strict";
  var URL_FN = "https://bschlmhjsqvtxlkgrulc.supabase.co/functions/v1/track-visit";
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  /* Read the tags now, before anything can rewrite the address. */
  var tagged = null;
  try {
    var sp = new URLSearchParams(w.location.search || "");
    if (sp.get("utm_source")) {
      var keep = new URLSearchParams();
      KEYS.forEach(function (k) { var v = sp.get(k); if (v) keep.set(k, v.slice(0, 150)); });
      tagged = {
        source: keep.get("utm_source") || "", medium: keep.get("utm_medium") || "", campaign: keep.get("utm_campaign") || "",
        content: keep.get("utm_content") || "", term: keep.get("utm_term") || "",
        landing: w.location.origin + w.location.pathname + "?" + keep.toString(), at: new Date().toISOString()
      };
      try { localStorage.setItem("amp_utm", JSON.stringify(tagged)); } catch (eS) {}
    }
  } catch (eQ) {}
  w.AMPAttribution = {
    /* Tags for a sign-up: this page's link first, else the last tagged link in this browser (90 days). */
    get: function () {
      if (tagged) return tagged;
      try {
        var t = JSON.parse(localStorage.getItem("amp_utm") || "null");
        if (t && t.source && (!t.at || Date.now() - Date.parse(t.at) < 90 * 86400000)) return t;
      } catch (e) {}
      return null;
    }
  };
  try {
    var q = new URLSearchParams(w.location.search || "").get("notrack");
    if (q === "1") localStorage.setItem("amp_notrack", "1");
    if (q === "0") localStorage.removeItem("amp_notrack");
    if (localStorage.getItem("amp_notrack") === "1") return;
  } catch (e) {}
  if (navigator.webdriver) return;
  var last = "", timer = null, first = true;
  function send() {
    var path = w.location.pathname + (w.location.hash && w.location.hash.length > 1 ? w.location.hash : "");
    if (path === last) return;
    last = path;
    var payload = { path: path, title: d.title, ref: d.referrer || "", site: w.location.host };
    if (tagged) {
      payload.utm = { source: tagged.source, medium: tagged.medium, campaign: tagged.campaign, content: tagged.content, term: tagged.term };
      payload.landing = tagged.landing;
      payload.entry = first;
    }
    first = false;
    var body = JSON.stringify(payload);
    try { fetch(URL_FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true, mode: "cors" }).catch(function () {}); } catch (e) {}
  }
  function soon() { clearTimeout(timer); timer = setTimeout(send, 600); }
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m];
    history[m] = function () { var r = orig.apply(this, arguments); soon(); return r; };
  });
  w.addEventListener("popstate", soon);
  w.addEventListener("hashchange", soon);
  if (d.readyState === "complete") soon(); else w.addEventListener("load", soon);
})(window, document);
