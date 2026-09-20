/* Node smoke: 2157 MI map pinch-to-zoom + lighter mobile selection stroke.
   Place-draw engine stays 20260919c (or 20260919d if Master Chief landed it).
   Run: node js/mi-map-pinch-zoom-2157.test.js */
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function checkHtml(rel) {
  var html = read(rel);
  assert(html.indexOf("<!-- amp-build:2157-mi-map-pinch-zoom -->") !== -1, rel + " missing 2157 stamp comment");
  assert(html.indexOf("amp-build 2157-mi-map-pinch-zoom") !== -1, rel + " missing 2157 chip");
  assert(html.indexOf('href="css/site.css?v=2157"') !== -1, rel + " css not ?v=2157");
  assert(html.indexOf('src="js/app.js?v=2157"') !== -1, rel + " app.js not ?v=2157");
  assert(html.indexOf('src="js/ridge-workbench.js?v=2157"') !== -1, rel + " workbench not ?v=2157");
  assert(
    html.indexOf("amp-mi-place-draw-engine.js?v=20260919c") !== -1 ||
      html.indexOf("amp-mi-place-draw-engine.js?v=20260919d") !== -1,
    rel + " engine script cache-bust missing 20260919c/d"
  );
  assert(html.indexOf("Pinch to zoom") !== -1, rel + " map caption missing pinch hint");
  assert(html.indexOf("AMP-Market-Intelligence.html") === -1, rel + " must not mirror hub");
  assert(html.indexOf('data-aspect="place_draw"') !== -1, rel + " Place draw chip missing");
}

checkHtml("index.html");
checkHtml("404.html");
assert(!fs.existsSync(path.join(ROOT, "AMP-Market-Intelligence.html")), "hub file must not be added");

var app = read("js/app.js");
assert(app.indexOf('window.__AMP_BUILD = "2157-mi-map-pinch-zoom"') !== -1, "app.js build stamp");

var css = read("css/site.css");
assert(css.indexOf("amp-build:2157-mi-map-pinch-zoom") !== -1, "css missing 2157 stamp");
assert(css.indexOf("@media (max-width: 899px)") !== -1, "css missing 899px mobile soften");
assert(css.indexOf("miPdStrokePulseMobile") !== -1, "css missing mobile pulse");
assert(css.indexOf("opacity(0.65)") !== -1, "css missing ~35% lighter place-draw glow");
assert(css.indexOf("stroke-width: 2.2px") !== -1, "css missing softened 2.2px place-draw stroke");
assert(css.indexOf(".ridge-map-container.is-zoomed") !== -1, "css missing zoomed map clip");
assert(css.indexOf("amp-build:2156-mi-place-draw-heat") !== -1, "css lost 2156 place-draw rules");
assert(/html\.mi-place-draw-on #placeDrawSelectionOutline[\s\S]{0,180}stroke-width:\s*2\.8px/.test(css),
  "desktop place-draw stroke 2.8px must stay");

var wb = read("js/ridge-workbench.js");
assert(wb.indexOf("amp-build:2157-mi-map-pinch-zoom") !== -1, "workbench missing 2157 stamp");
assert(wb.indexOf("bindMapViewport") !== -1, "workbench missing bindMapViewport");
assert(wb.indexOf("is-pinching") !== -1 && wb.indexOf("is-panning") !== -1, "workbench missing pinch/pan classes");
assert(wb.indexOf("__AMP_MI_MAP_VIEWPORT") !== -1, "workbench missing viewport test hook");
assert(wb.indexOf("pinch to zoom") !== -1 || wb.indexOf("Pinch") !== -1 || wb.indexOf("pinch-to-zoom") !== -1,
  "workbench should name pinch-to-zoom");
assert(wb.indexOf("touch-action") !== -1, "workbench must keep touch-action none for custom pinch");
assert(wb.indexOf("ctrlKey") !== -1 && wb.indexOf("wheel") !== -1, "optional desktop wheel zoom missing");
assert(wb.indexOf("AMPPlaceDraw") === -1, "workbench still talks to the second heat API");
assert(wb.indexOf("AmpMiPlaceDraw") !== -1, "workbench must still call official AmpMiPlaceDraw");

var pdSrc = read("js/amp-mi-place-draw-engine.js");
var engineVer = /__version:\s*"(20260919[cd])"/.exec(pdSrc);
assert(engineVer, "engine export version missing (want 20260919c or 20260919d)");
assert(pdSrc.indexOf("mapGestureLock") !== -1, "engine must yield to host pinch/pan");
assert(pdSrc.indexOf("pendingTap") !== -1, "engine must defer pin while zoomed so tap still works");
assert(pdSrc.indexOf("pinch to zoom") !== -1, "engine chrome hint should mention pinch");
assert(pdSrc.indexOf("isUnlockedState") !== -1 && pdSrc.indexOf("cardAllowedForState") !== -1,
  "engine missing unlocked-state hover/pin lock");
assert(pdSrc.indexOf("committed sample") !== -1, "engine must name committed-sample card lock");
assert(pdSrc.indexOf("Tap-first on phone") !== -1 || pdSrc.indexOf("tap") !== -1, "engine missing phone tap-to-pin");
assert(pdSrc.indexOf("flLonAdjust") !== -1 && pdSrc.indexOf("flLonUnadjust") !== -1, "FL projection helpers missing");
assert(pdSrc.indexOf("30.33") !== -1 && pdSrc.indexOf("-81.66") !== -1, "Jax NE lock missing");
assert(!/\bMGMA\b/.test(pdSrc.replace(/[Nn]o MGMA/g, "")), "engine must not ship MGMA product");

var ctx = { window: {}, document: undefined, requestAnimationFrame: function () {}, console: console };
vm.runInNewContext(pdSrc, ctx);
var pd = ctx.window.AmpMiPlaceDraw;
assert(pd && (pd.__version === "20260919c" || pd.__version === "20260919d"), "AmpMiPlaceDraw 20260919c/d not exported");
assert(typeof pd.cardAllowedForState === "function", "cardAllowedForState not exported");
assert(pd.cardAllowedForState("tx") === true, "without access API, any named state is allowed");
assert(pd.cardAllowedForState("") === false, "empty state never gets a pin card");
var gated = { window: {
  AMPRidgeAccess: {
    canState: function (s) { return String(s).toLowerCase() === "tx"; },
    normState: function (s) { return String(s || "").toLowerCase(); },
    oneStateUnit: function () { return "tx"; }
  }
}, document: undefined, requestAnimationFrame: function () {}, console: console };
vm.runInNewContext(pdSrc, gated);
assert(gated.window.AmpMiPlaceDraw.cardAllowedForState("tx") === true, "TX demo must allow TX card");
assert(gated.window.AmpMiPlaceDraw.cardAllowedForState("fl") === false, "TX demo must hide FL hover/pin card");
assert(gated.window.AmpMiPlaceDraw.cardAllowedForState("ca") === false, "TX demo must hide CA hover/pin card");
assert(pdSrc.indexOf('dfw: "tx"') !== -1 && pdSrc.indexOf('mia: "fl"') !== -1, "jump buttons must know metro states");
assert(pd.SPECIALTIES.fm.baseline === 306520, "FM Competitive lock drifted");
assert(pd.SPECIALTIES.fm.ampBands.redAlert === 255433, "FM red alert lock drifted");

var homeMap = read("js/home-placements-map.js");
assert(homeMap.indexOf("bindMapViewport") === -1, "homepage map must not mount MI pinch host");
assert(homeMap.indexOf("AmpMiPlaceDraw") === -1, "homepage map must not mount Place draw");

console.log("mi-map-pinch-zoom-2157.test.js: ok (engine " + pd.__version + ")");
