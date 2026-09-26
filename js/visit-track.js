/* 2220: in-house visitor log. Sends page path + title to our own server function, which records the
   visitor's internet address and matches it to an organization from public ownership records.
   Team devices can opt out once with ?notrack=1 (undo with ?notrack=0). */
(function (w, d) {
  "use strict";
  var URL_FN = "https://bschlmhjsqvtxlkgrulc.supabase.co/functions/v1/track-visit";
  try {
    var q = new URLSearchParams(w.location.search || "").get("notrack");
    if (q === "1") localStorage.setItem("amp_notrack", "1");
    if (q === "0") localStorage.removeItem("amp_notrack");
    if (localStorage.getItem("amp_notrack") === "1") return;
  } catch (e) {}
  if (navigator.webdriver) return;
  var last = "", timer = null;
  function send() {
    var path = w.location.pathname + (w.location.hash && w.location.hash.length > 1 ? w.location.hash : "");
    if (path === last) return;
    last = path;
    var body = JSON.stringify({ path: path, title: d.title, ref: d.referrer || "", site: w.location.host });
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
