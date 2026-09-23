/* Node smoke: 2157 MI map pinch-to-zoom + engine 20260919d + mobile border pass.
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
  assert(html.indexOf("<!-- amp-build:2158-v3-home-client-funnel -->") !== -1, rel + " missing 2158 stamp comment");
  assert(html.indexOf("amp-build 2158-v3-home-client-funnel") !== -1, rel + " missing 2158 chip");
  assert(html.indexOf('href="css/site.css?v=2158"') !== -1, rel + " css not ?v=2158");
  assert(html.indexOf('src="js/app.js?v=2158"') !== -1, rel + " app.js not ?v=2158");
  assert(html.indexOf('src="js/ridge-workbench.js?v=2158"') !== -1, rel + " workbench not ?v=2158");
  assert(html.indexOf('src="js/amp-mi-place-draw-engine.js?v=20260919d"') !== -1, rel + " engine script not ?v=20260919d");
  assert(html.indexOf("Pinch to zoom") !== -1, rel + " map caption missing pinch hint");
  assert(html.indexOf("AMP-Market-Intelligence.html") === -1, rel + " must not mirror hub");
  assert(html.indexOf('data-aspect="place_draw"') !== -1, rel + " Place draw chip missing");
}

checkHtml("index.html");
checkHtml("404.html");
assert(!fs.existsSync(path.join(ROOT, "AMP-Market-Intelligence.html")), "hub file must not be added");

var app = read("js/app.js");
assert(app.indexOf('window.__AMP_BUILD = "2158-v3-home-client-funnel"') !== -1, "app.js build stamp");

var css = read("css/site.css");
assert(css.indexOf("amp-build:2157-mi-map-pinch-zoom") !== -1, "css missing 2157 stamp");
assert(css.indexOf("PLACE_DRAW_MOBILE_BORDER_PASS_20260919d") !== -1, "css missing official 20260919d border pass");
assert(css.indexOf("ampStateBorderGlowMobile") !== -1, "css missing mobile glow filter");
assert(css.indexOf("ridgeStrokePulseMobile") !== -1, "css missing mobile pulse");
assert(css.indexOf(".ridge-map-container.is-zoomed") !== -1, "css missing zoomed map clip");
assert(css.indexOf("amp-build:2156-mi-place-draw-heat") !== -1, "css lost 2156 place-draw rules");
assert(/html\.mi-place-draw-on #placeDrawSelectionOutline[\s\S]{0,180}stroke-width:\s*2\.8px/.test(css),
  "desktop place-draw stroke 2.8px must stay");

var wb = read("js/ridge-workbench.js");
assert(wb.indexOf("amp-build:2157-mi-map-pinch-zoom") !== -1, "workbench missing 2157 stamp");
assert(wb.indexOf("20260919d") !== -1, "workbench must name engine 20260919d");
assert(wb.indexOf("bindMapViewport") !== -1, "workbench missing bindMapViewport");
assert(wb.indexOf("is-pinching") !== -1 && wb.indexOf("is-panning") !== -1, "workbench missing pinch/pan classes");
assert(wb.indexOf("__AMP_MI_MAP_VIEWPORT") !== -1, "workbench missing viewport test hook");
assert(wb.indexOf("ctrlKey") !== -1 && wb.indexOf("wheel") !== -1, "optional desktop wheel zoom missing");
assert(wb.indexOf("AmpMiPlaceDraw") !== -1, "workbench must still call official AmpMiPlaceDraw");

var pdSrc = read("js/amp-mi-place-draw-engine.js");
assert(pdSrc.indexOf('__version: "20260919d"') !== -1, "engine export version missing");
assert(pdSrc.indexOf('__version === "20260919d"') !== -1, "engine version lock missing");
assert(pdSrc.indexOf("ampStateBorderGlowMobile") !== -1, "engine missing mobile glow filter");
assert(pdSrc.indexOf("stateIsCommitted") !== -1, "engine missing committed-sample hover/pin lock");
assert(pdSrc.indexOf("commitStateScope") !== -1, "engine missing commitStateScope");
assert(pdSrc.indexOf("mapGestureLock") !== -1, "engine must yield to host pinch/pan");
assert(pdSrc.indexOf("pendingTap") !== -1, "engine must defer pin while zoomed so tap still works");
assert(pdSrc.indexOf("pinch to zoom") !== -1, "engine chrome hint should mention pinch");
assert(pdSrc.indexOf("flLonAdjust") !== -1 && pdSrc.indexOf("flLonUnadjust") !== -1, "FL projection helpers missing");
assert(pdSrc.indexOf("30.33") !== -1 && pdSrc.indexOf("-81.66") !== -1, "Jax NE lock missing");
assert(!/\bMGMA\b/.test(pdSrc.replace(/[Nn]o MGMA/g, "")), "engine must not ship MGMA product");

var ctx = { window: {}, document: undefined, requestAnimationFrame: function () {}, console: console };
vm.runInNewContext(pdSrc, ctx);
var pd = ctx.window.AmpMiPlaceDraw;
assert(pd && pd.__version === "20260919d", "AmpMiPlaceDraw 20260919d not exported");
assert(typeof pd.stateIsCommitted === "function", "stateIsCommitted not exported");
assert(pd.stateIsCommitted("") === false, "empty state never gets a pin card");
assert(pd.SPECIALTIES.fm.baseline === 306520, "FM Competitive lock drifted");
assert(pd.SPECIALTIES.fm.ampBands.redAlert === 255433, "FM red alert lock drifted");

var gated = { window: {
  AMPRidgeAccess: {
    oneStateUnit: function () { return "tx"; },
    allowedStates: function () { return ["tx"]; },
    canState: function (s) { return String(s).toLowerCase() === "tx"; },
    normState: function (s) { return String(s || "").toLowerCase(); }
  }
}, document: undefined, requestAnimationFrame: function () {}, console: console };
vm.runInNewContext(pdSrc, gated);
assert(gated.window.AmpMiPlaceDraw.__version === "20260919d", "gated engine version");
assert(gated.window.AmpMiPlaceDraw.stateIsCommitted("tx") === true, "TX demo must allow TX card");
assert(gated.window.AmpMiPlaceDraw.stateIsCommitted("fl") === false, "TX demo must hide FL hover/pin card");
assert(gated.window.AmpMiPlaceDraw.stateIsCommitted("ca") === false, "TX demo must hide CA hover/pin card");

var homeMap = read("js/home-placements-map.js");
assert(homeMap.indexOf("bindMapViewport") === -1, "homepage map must not mount MI pinch host");
assert(homeMap.indexOf("AmpMiPlaceDraw") === -1, "homepage map must not mount Place draw");

console.log("mi-map-pinch-zoom-2157.test.js: ok (engine " + pd.__version + ")");
