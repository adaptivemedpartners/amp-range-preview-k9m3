/* Node smoke: 2156 public MI Aspects + AmpMiPlaceDraw engine 20260919c.
   Run: node js/mi-place-draw-2156.test.js */
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
  assert(html.indexOf('src="js/amp-mi-place-draw-engine.js?v=20260919d"') !== -1, rel + " official engine 20260919d missing");
  assert(html.indexOf("20260919b") === -1, rel + " leftover engine 20260919b");
  assert(html.indexOf("js/mi-place-draw.js") === -1, rel + " leftover second heat module");
  assert(html.indexOf('src="js/ridge-workbench.js?v=2158"') !== -1, rel + " workbench not ?v=2158");
  assert(html.indexOf('src="js/mi-aspect-hooks-v1.js?v=2158"') !== -1, rel + " aspect hooks not ?v=2158");
  assert(html.indexOf("AMP-Market-Intelligence.html") === -1, rel + " must not mirror hub");
  var bench = html.slice(html.indexOf('id="ridge-workbench"'), html.indexOf('id="mi-lite-toolbar"'));
  assert(bench.indexOf("<iframe") === -1, rel + " firm iframe leaked into public MI workbench");
  ["raw", "place_draw", "day_load", "specialty_supply", "support", "cah", "fqhc", "cms"].forEach(function (id) {
    assert(html.indexOf('data-aspect="' + id + '"') !== -1, rel + " missing Aspect chip " + id);
  });
}

checkHtml("index.html");
checkHtml("404.html");

assert(!fs.existsSync(path.join(ROOT, "AMP-Market-Intelligence.html")), "hub file must not be added to this repo");
assert(!fs.existsSync(path.join(ROOT, "js/mi-place-draw.js")), "second heat implementation must be removed");

var app = read("js/app.js");
assert(app.indexOf('window.__AMP_BUILD = "2158-v3-home-client-funnel"') !== -1, "app.js build stamp");

var css = read("css/site.css");
assert(css.indexOf("amp-build:2156-mi-place-draw-heat") !== -1, "css missing 2156 stamp");
assert(css.indexOf("20260919d") !== -1, "css must name engine 20260919d");
assert(css.indexOf("pd-docked") !== -1, "css missing docked phone card");
assert(css.indexOf("#placeDrawHeatLayer") !== -1, "css missing official heat layer");
assert(css.indexOf("html.mi-place-draw-on") !== -1, "css missing html.mi-place-draw-on");
assert(css.indexOf("#ampStateBorderGlow") !== -1, "css missing border-only glow");
assert(css.indexOf("#placeHoverCard") !== -1, "css missing hover card");
assert(css.indexOf("aspect-day-load-on") !== -1, "css missing Day load chrome");
assert(css.indexOf("aspect-support-on") !== -1, "css missing Support chrome");
assert(css.indexOf("aspect-cms-on") !== -1, "css missing CMS chrome");
assert(css.indexOf("aspect-hpsa-pressure") !== -1, "css missing CAH/FQHC HPSA stroke");
assert(css.indexOf("aspect-specialty-supply-on") !== -1, "css missing Specialty supply chrome");
assert(css.indexOf("aspect-raw-on") !== -1, "css missing Raw amplify");
assert(css.indexOf("@media (max-width: 430px)") !== -1, "css missing ~390 phone MI rules");
assert(css.indexOf("padding:0") !== -1 || css.indexOf("padding: 0") !== -1, "MI svg padding must be 0 so heat CTM is live");
assert(css.indexOf("amp-build:2155-home-placements-map") !== -1, "css lost 2155 homepage map rules");

var wb = read("js/ridge-workbench.js");
assert(wb.indexOf("amp-build:2156-mi-place-draw-heat") !== -1, "workbench missing 2156 stamp");
assert(wb.indexOf("AmpMiPlaceDraw") !== -1, "workbench must call official AmpMiPlaceDraw");
assert(wb.indexOf("20260919d") !== -1, "workbench must name engine 20260919d");
assert(wb.indexOf("20260919b") === -1, "workbench leftover 20260919b");
assert(wb.indexOf("pd.enable()") !== -1 && wb.indexOf("pd.disable()") !== -1, "workbench must enable/disable official engine");
assert(wb.indexOf("AMPPlaceDraw") === -1, "workbench still talks to the second heat API");
assert(wb.indexOf("<iframe") === -1 && wb.indexOf("firm iframe") !== -1, "workbench must keep the no-firm-iframe lock");
assert(wb.indexOf("triangulation only") !== -1, "workbench missing CMS triangulation language");
assert(wb.indexOf("overlay pending") !== -1, "workbench missing honest CAH/FQHC pending copy");
assert(wb.indexOf("qualitative v1") !== -1, "workbench missing Day load / Support qualitative copy");
assert(wb.indexOf("YOUR Baseline") !== -1, "workbench missing Raw baseline framing");
assert(wb.indexOf("No firm iframe") !== -1 || wb.indexOf("must not render MGMA") !== -1, "workbench lost public lock comment");

var data = read("js/ridge-mi-data.js");
["family_medicine_without_ob", "family_medicine_with_ob", "family_medicine_ambulatory_only_no_inpatient_work"].forEach(function (k) {
  var i = data.indexOf('"' + k + '"');
  assert(i !== -1, "missing FM spec " + k);
  var slice = data.slice(i, i + 900);
  assert(slice.indexOf('"competitive":306520') !== -1, k + " missing locked FM Competitive $306520");
});

var hooks = read("js/mi-aspect-hooks-v1.js");
assert(hooks.indexOf("cmsByLabel") !== -1, "hooks missing CMS map");
assert(hooks.indexOf("rediByStateByLabel") !== -1, "hooks missing Redi-by-state");

var pdSrc = read("js/amp-mi-place-draw-engine.js");
assert(pdSrc.indexOf('__version === "20260919d"') !== -1, "engine version lock missing");
assert(pdSrc.indexOf('__version: "20260919d"') !== -1, "engine export version missing");
assert(pdSrc.indexOf("20260919b") === -1, "engine leftover 20260919b");
assert(pdSrc.indexOf("placeDrawHeatLayer") !== -1, "engine missing official heat layer id");
assert(pdSrc.indexOf("pd-docked") !== -1, "engine missing docked phone card");
assert(pdSrc.indexOf("Tap-first on phone") !== -1 || pdSrc.indexOf("tap") !== -1, "engine missing phone tap-to-pin");
assert(pdSrc.indexOf("flLonAdjust") !== -1 && pdSrc.indexOf("flLonUnadjust") !== -1, "FL projection helpers missing");
assert(pdSrc.indexOf("30.33") !== -1 && pdSrc.indexOf("-81.66") !== -1, "Jax NE lock missing");
assert(pdSrc.indexOf("Naples") !== -1 && pdSrc.indexOf("Tampa") !== -1, "Gulf Tampa–Naples missing");
assert(!/\bMGMA\b/.test(pdSrc.replace(/[Nn]o MGMA/g, "")), "engine must not ship MGMA product");

var ctx = { window: {}, document: undefined, requestAnimationFrame: function () {}, console: console };
vm.runInNewContext(pdSrc, ctx);
var pd = ctx.window.AmpMiPlaceDraw;
assert(pd && pd.__version === "20260919d", "AmpMiPlaceDraw 20260919d not exported");
assert(pd.enable && pd.disable && pd.isEnabled, "engine API missing enable/disable");
assert(pd.SPECIALTIES && pd.SPECIALTIES.fm && pd.SPECIALTIES.fm.baseline === 306520, "FM Competitive lock drifted");
assert(pd.SPECIALTIES.fm.ampBands.redAlert === 255433, "FM red alert lock drifted");
assert(pd.METROS && pd.METROS.length >= 100, "expected national metro set, got " + (pd.METROS && pd.METROS.length));
var byId = {};
pd.METROS.forEach(function (m) { byId[m.id] = m; });
["mia", "ftl", "wpb", "jax", "tpa", "nap"].forEach(function (id) {
  assert(byId[id], "missing locked FL metro " + id);
});
assert(byId.mia.lon > byId.tpa.lon, "Atlantic MIA must sit east of Gulf Tampa");
assert(byId.jax.lat > byId.mia.lat + 3, "Jax must sit in NE FL, not on the SE tip");
assert(byId.nap.lat < byId.tpa.lat, "Naples must stay south of Tampa on the Gulf");

var homeMap = read("js/home-placements-map.js");
assert(homeMap.indexOf("amp-build:2155-home-placements-map") !== -1, "homepage placements map stamp must stay 2155 internally");
assert(homeMap.indexOf("AmpMiPlaceDraw") === -1 && homeMap.indexOf("AMPPlaceDraw") === -1, "homepage map must not mount Place draw");

console.log("mi-place-draw-2156.test.js: ok");
