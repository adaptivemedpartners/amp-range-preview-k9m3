/* Node smoke: 2156 public MI Aspects + Place-draw national metro heat.
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
  assert(html.indexOf("<!-- amp-build:2156-mi-place-draw-heat -->") !== -1, rel + " missing 2156 stamp comment");
  assert(html.indexOf("amp-build 2156-mi-place-draw-heat") !== -1, rel + " missing 2156 chip");
  assert(html.indexOf('href="css/site.css?v=2156"') !== -1, rel + " css not ?v=2156");
  assert(html.indexOf('src="js/app.js?v=2156"') !== -1, rel + " app.js not ?v=2156");
  assert(html.indexOf('src="js/mi-place-draw.js?v=2156"') !== -1, rel + " place-draw module missing");
  assert(html.indexOf('src="js/ridge-workbench.js?v=2156"') !== -1, rel + " workbench not ?v=2156");
  assert(html.indexOf('src="js/mi-aspect-hooks-v1.js?v=2156"') !== -1, rel + " aspect hooks not ?v=2156");
  assert(html.indexOf('src="js/home-placements-map.js?v=2156"') !== -1, rel + " homepage map cache-bust lost");

  var aspects = ["raw", "place_draw", "day_load", "specialty_supply", "support", "cah", "fqhc", "cms"];
  aspects.forEach(function (id) {
    assert(html.indexOf('data-aspect="' + id + '"') !== -1, rel + " missing Aspect chip " + id);
  });
  assert(html.indexOf("id=\"ridge-pd-hover-toggle\"") !== -1, rel + " missing hover-card toggle");
  assert(html.indexOf("id=\"ridge-pd-litmus\"") !== -1, rel + " missing litmus jumps");
  ["mia", "ftl", "wpb", "jax"].forEach(function (j) {
    assert(html.indexOf('data-jump="' + j + '"') !== -1, rel + " missing FL litmus jump " + j);
  });
  var bench = html.slice(html.indexOf('id="ridge-workbench"'), html.indexOf('id="mi-lite-toolbar"'));
  assert(bench.indexOf("data-aspect=\"place_draw\"") !== -1, rel + " workbench slice failed");
  assert(!/\bMGMA\b/.test(bench), rel + " MGMA leaked onto public MI workbench");
}

checkHtml("index.html");
checkHtml("404.html");

var app = read("js/app.js");
assert(app.indexOf('window.__AMP_BUILD = "2156-mi-place-draw-heat"') !== -1, "app.js build stamp");

var css = read("css/site.css");
assert(css.indexOf("amp-build:2156-mi-place-draw-heat") !== -1, "css missing 2156 stamp");
assert(css.indexOf("#heatLayer") !== -1, "css missing heat layer");
assert(css.indexOf("#ampStateBorderGlow") !== -1, "css missing border-only glow");
assert(css.indexOf("fill: none !important") !== -1, "css must keep selection fill none");
assert(css.indexOf("#placeHoverCard") !== -1, "css missing hover card");
assert(css.indexOf("#0B3A4D") !== -1, "hover card must stay navy");
assert(css.indexOf("aspect-day-load-on") !== -1, "css missing Day load chrome");
assert(css.indexOf("aspect-support-on") !== -1, "css missing Support chrome");
assert(css.indexOf("aspect-cms-on") !== -1, "css missing CMS chrome");
assert(css.indexOf("aspect-hpsa-pressure") !== -1, "css missing CAH/FQHC HPSA stroke");
assert(css.indexOf("aspect-specialty-supply-on") !== -1, "css missing Specialty supply chrome");
assert(css.indexOf("raw-aspect-on") !== -1 || css.indexOf("aspect-raw-on") !== -1, "css missing Raw amplify");
assert(css.indexOf("amp-build:2155-home-placements-map") !== -1, "css lost 2155 homepage map rules");

var wb = read("js/ridge-workbench.js");
assert(wb.indexOf("amp-build:2156-mi-place-draw-heat") !== -1, "workbench missing 2156 stamp");
assert(wb.indexOf("function applyAspectLayers") !== -1, "workbench missing applyAspectLayers");
assert(wb.indexOf("function syncAspectMapChrome") !== -1, "workbench missing map chrome sync");
assert(wb.indexOf("function paintSupplyDots") !== -1, "workbench missing specialty supply dots");
assert(wb.indexOf("hpsaPressureCodes") !== -1, "workbench missing CAH/FQHC HPSA overlay");
assert(wb.indexOf("triangulation only") !== -1, "workbench missing CMS triangulation language");
assert(wb.indexOf("overlay pending") !== -1, "workbench missing honest CAH/FQHC pending copy");
assert(wb.indexOf("qualitative v1") !== -1, "workbench missing Day load / Support qualitative copy");
assert(wb.indexOf("YOUR Baseline") !== -1, "workbench missing Raw baseline framing");
assert(wb.indexOf("pd.setEnabled(placeOn)") !== -1, "workbench must toggle Place draw on/off");
assert(wb.indexOf("Never MGMA") !== -1 || wb.indexOf("must not render MGMA") !== -1, "workbench lost MGMA lock");
assert(wb.indexOf("assets/ridge-usa-map.svg?v=2156") !== -1, "workbench map fetch not 2156");
assert(wb.indexOf("border-only") !== -1, "workbench missing border-only story");
assert(wb.indexOf("renderBenchCards()") !== -1, "toggle must refresh cash HUD");

var data = read("js/ridge-mi-data.js");
["family_medicine_without_ob", "family_medicine_with_ob", "family_medicine_ambulatory_only_no_inpatient_work"].forEach(function (k) {
  var i = data.indexOf('"' + k + '"');
  assert(i !== -1, "missing FM spec " + k);
  var slice = data.slice(i, i + 900);
  assert(slice.indexOf('"competitive":306520') !== -1, k + " missing locked FM Competitive $306520");
  assert(slice.indexOf('"redAlert":255433') !== -1, k + " missing locked red alert");
});

var hooks = read("js/mi-aspect-hooks-v1.js");
assert(hooks.indexOf("cmsByLabel") !== -1, "hooks missing CMS map");
assert(hooks.indexOf("rediByStateByLabel") !== -1, "hooks missing Redi-by-state");

var pdSrc = read("js/mi-place-draw.js");
assert(pdSrc.indexOf("amp-build:2156-mi-place-draw-heat") !== -1, "place-draw missing 2156 stamp");
assert(!/\bMGMA\b/.test(pdSrc.replace(/No MGMA/g, "")), "place-draw must not ship MGMA");
assert(pdSrc.indexOf("flLonAdjust") !== -1 && pdSrc.indexOf("flLonUnadjust") !== -1, "FL projection helpers missing");

var ctx = { window: {}, document: undefined };
vm.runInNewContext(pdSrc, ctx);
var pd = ctx.window.AMPPlaceDraw;
assert(pd && pd.METROS && pd.METROS.length === 111, "expected 111 metros, got " + (pd && pd.METROS && pd.METROS.length));
assert(pd.FM_BANDS.competitive === 306520, "FM Competitive lock drifted");
assert(pd.FM_BANDS.redAlert === 255433 && pd.FM_BANDS.magnet === 368333 && pd.FM_BANDS.destination === 442612, "FM band lock drifted");

function xy(id) {
  var m = pd.METROS.filter(function (x) { return x.id === id; })[0];
  assert(m, "missing metro " + id);
  return pd.lonLatToSvg(m.lon, m.lat).map(function (n) { return Math.round(n * 10) / 10; });
}
var mia = xy("mia"), ftl = xy("ftl"), wpb = xy("wpb"), jax = xy("jax"), tpa = xy("tpa"), nap = xy("nap");
assert(mia[0] === 791 && mia[1] === 554.7, "MIA svg drifted " + mia);
assert(ftl[0] === 789.4 && ftl[1] === 546.6, "FTL svg drifted " + ftl);
assert(wpb[0] === 786.8 && wpb[1] === 533.2, "WPB svg drifted " + wpb);
assert(jax[0] === 748.4 && jax[1] === 455.7, "JAX svg drifted " + jax);
assert(tpa[0] === 728.9 && tpa[1] === 512.9, "Tampa svg drifted " + tpa);
assert(tpa[0] < mia[0] - 40, "Gulf Tampa must sit west of Atlantic MIA");
assert(nap[0] < mia[0] && nap[1] > tpa[1], "Naples must stay on Gulf, south of Tampa");
assert(jax[1] < mia[1] - 70, "Jax must sit in NE FL, not on the SE tip");

var rows = pd.litmusVerify();
assert(rows.length === 16, "litmus expected 16 rows, got " + rows.length);
rows.forEach(function (r) {
  assert(r.orderOk, "band order fail at " + r.id);
  assert(r.modeOk, "compress/amplify fail at " + r.id);
  assert(r.red < r.comp && r.comp < r.magnet && r.magnet < r.dest, "Red<Comp<Magnet<Dest fail " + r.id);
});

var homeMap = read("js/home-placements-map.js");
assert(homeMap.indexOf("amp-build:2155-home-placements-map") !== -1, "homepage placements map stamp must stay 2155 internally");
assert(homeMap.indexOf("AMPPlaceDraw") === -1, "homepage map must not mount Place draw");

console.log("mi-place-draw-2156.test.js: ok");
