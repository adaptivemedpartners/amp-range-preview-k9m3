/* amp-build:2200-aspects-eight-bands — eight Aspects on the four AMP bands. Run: node js/v3-2200.test.js */
var fs = require("fs"), path = require("path"), vm = require("vm");
var root = path.join(__dirname, "..");
var STAMP = "2200-aspects-eight-bands";
function assert(c, m) { if (!c) { console.error("FAIL:", m); process.exit(1); } }

var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var fb = fs.readFileSync(path.join(root, "404.html"), "utf8");
var css = fs.readFileSync(path.join(root, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
var engine = fs.readFileSync(path.join(root, "js/amp-mi-place-draw-engine.js"), "utf8");
var work = fs.readFileSync(path.join(root, "js/ridge-workbench.js"), "utf8");
var selJs = fs.readFileSync(path.join(root, "js/mi-aspects-selector.js"), "utf8");
var selCss = fs.readFileSync(path.join(root, "css/mi-aspects-selector.css"), "utf8");

assert(html.indexOf("<!-- amp-build:" + STAMP + " -->") === html.indexOf("<!-- amp-build:"), "html tip stamp");
assert(html.indexOf("?v=2199") === -1, "no stale 2199 cache");
assert(html.indexOf('href="css/site.css?v=2200"') !== -1, "css cache");
assert(html.indexOf('href="css/mi-aspects-selector.css?v=2200"') !== -1, "aspects css linked");
assert(html.indexOf('src="js/mi-aspects-selector.js?v=2200"') !== -1, "aspects js linked");
assert(html.indexOf('src="js/amp-mi-place-draw-engine.js?v=20260919d"') !== -1, "engine lock query");
assert(html.indexOf('id="mi-aspects-selector"') !== -1, "aspects mount");
assert(html.indexOf("mi-app-chip-row") === -1, "example chip row gone");
assert(html.indexOf("amp-build " + STAMP) !== -1, "footer chip");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip");
assert(css.indexOf("fill: transparent !important") !== -1, "selected state fill transparent");
assert(css.indexOf("stroke-width: 2.8px") !== -1, "desktop place-draw stroke");
assert(css.indexOf(".t-red { color: #f87171") !== -1, "existing Red color");
assert(css.indexOf(".t-comp { color: #fbbf24") !== -1, "existing Competitive color");
assert(css.indexOf(".t-magnet { color: #60a5fa") !== -1, "existing Magnet color");
assert(css.indexOf(".t-dest { color: #a78bfa") !== -1, "existing Destination color");
assert(fb === html, "404 == index");

assert(engine.indexOf("placeDrawSelectionClip") !== -1, "heat clip path");
assert(engine.indexOf('globalCompositeOperation = "destination-in"') !== -1, "heat clipped after smoothing");
assert(engine.indexOf("isPointInFill") !== -1, "mask uses svg hit test");
assert(engine.indexOf('__version: "20260919d"') !== -1, "engine version lock");
assert(engine.indexOf("baseline: 306520") !== -1, "FM competitive lock");
assert(work.indexOf("function maybeFitSelection") !== -1, "fit helper");
assert(work.indexOf('el.style.fill = ""') !== -1, "place draw does not paint gray fill");
assert(work.indexOf("function aspectRead") !== -1, "aspect read");
assert(work.indexOf("function aspectCard") !== -1, "aspect card");
assert(work.indexOf("return pop / redi") !== -1, "supply hardness is people per specialist");
assert(work.indexOf("Math.floor(i * 4 / n)") !== -1, "four bands");
assert(work.indexOf('fill: "#f87171"') !== -1, "Red fill");
assert(work.indexOf('fill: "#fbbf24"') !== -1, "Competitive fill");
assert(work.indexOf('fill: "#60a5fa"') !== -1, "Magnet fill");
assert(work.indexOf('fill: "#a78bfa"') !== -1, "Destination fill");
assert(work.indexOf("exactValues: false") !== -1, "public leaves exact values off");
assert(work.indexOf('return ["specialty_supply"]') !== -1, "default lens is specialty supply");
assert(work.indexOf('mapEl: $("ridge-map-wrap")') !== -1, "map moves into the selector");
var readSrc = work.slice(work.indexOf("function aspectRead"), work.indexOf("function isCahHeavy"));
assert(readSrc.indexOf("fmtMoney") === -1, "read has no dollar formatter");
assert(readSrc.indexOf("DFW") === -1 && readSrc.indexOf("Miami") === -1, "read names no cities");
assert(readSrc.indexOf("Red states have fewer") !== -1, "supply sentence");
assert(readSrc.indexOf("national baseline") !== -1, "raw sentence");
assert(readSrc.indexOf("pin marks its top metro") !== -1, "place draw sentence");
assert(readSrc.indexOf("no site file") !== -1, "FQHC stays pending");

assert(selJs.indexOf("AmpMiAspectsSelector.mount(host, options)") !== -1, "mount documented");
assert(selJs.indexOf("options.exactValues") !== -1, "exact-values option documented");
assert(selJs.indexOf("mi-aspects-more") === -1, "no More menu");
assert(selJs.indexOf('data-mi-aspects-sentence') !== -1, "sentence element");
assert(selJs.indexOf("mi-aspects-key") !== -1, "four-band key");
assert(selJs.indexOf("Top 5") !== -1 && selJs.indexOf("Bottom 5") !== -1, "rank headings");
assert(selCss.indexOf("minmax(0, 7fr) minmax(200px, 3fr)") !== -1, "70/30 stage");
assert(selCss.indexOf("order: -1") !== -1, "phone rail first");
assert(selCss.indexOf("mi-aspects-group-facility") !== -1, "lighter facility group");
assert(selCss.indexOf("#placeHoverCard") === -1, "pin card is not hidden by this sheet");

var sandbox = {
  window: {},
  document: {
    documentElement: { getAttribute: function () { return "light"; } },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    addEventListener: function () {},
    removeEventListener: function () {},
    createElement: function () { return { getContext: function () { return null; } }; },
    createElementNS: function () { return {}; }
  },
  console: console
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(engine, sandbox, { filename: "amp-mi-place-draw-engine.js" });
var pd = sandbox.AmpMiPlaceDraw;
assert(pd && pd.__version === "20260919d", "engine boots");
assert(pd.topMetroForStates(["tx"]).id === "dfw", "TX pin target is DFW");
assert(pd.topMetroForStates(["fl"]).id === "mia", "FL pin target is Miami");
assert(pd.topMetroForStates(["ca"]).id === "la", "CA pin target is LA");
assert(pd.topMetroForStates(["ri"]).id === "pro", "RI pin target is Providence");
assert(pd.topMetroForStates(["tx", "ok"]).id === "dfw", "TX+OK top metro stays DFW");
assert(pd.SPECIALTIES.fm.baseline === 306520, "FM baseline");
assert(pd.SPECIALTIES.fm.ampBands.redAlert < pd.SPECIALTIES.fm.ampBands.competitive, "Red < Competitive");
assert(pd.SPECIALTIES.fm.ampBands.competitive < pd.SPECIALTIES.fm.ampBands.magnet, "Competitive < Magnet");
assert(pd.SPECIALTIES.fm.ampBands.magnet < pd.SPECIALTIES.fm.ampBands.destination, "Magnet < Destination");

var host = {
  classList: { add: function () {} },
  setAttribute: function (k, v) { this[k] = v; },
  getAttribute: function (k) { return this[k]; },
  innerHTML: "",
  addEventListener: function () {},
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  contains: function () { return true; }
};
sandbox.document.getElementById = function (id) {
  if (id === "host") return host;
  return null;
};
vm.runInContext(selJs, sandbox, { filename: "mi-aspects-selector.js" });
var api = sandbox.AmpMiAspectsSelector;
assert(api.CORE.map(function (x) { return x.id; }).join(",") === "raw,place_draw,day_load,specialty_supply,support", "core five");
assert(api.FACILITY.map(function (x) { return x.id; }).join(",") === "cah,fqhc,cms", "facility three");
assert(api.LENSES.length === 8, "eight lenses");
assert(api.BANDS.map(function (b) { return b.fill; }).join(",") === "#f87171,#fbbf24,#60a5fa,#a78bfa", "band colors");
var selected = [];
var handle = api.mount("host", {
  onSelect: function (id) { selected.push(id); },
  getRead: function () { return { sentence: "Family Medicine · Specialty supply: candidates here.", mode: "sample", top: [], bottom: [] }; }
});
assert(handle.getActive() === "specialty_supply", "default lens");
["raw", "place_draw", "day_load", "specialty_supply", "support", "cah", "fqhc", "cms"].forEach(function (id) {
  assert(host.innerHTML.indexOf('data-aspect="' + id + '"') !== -1, "button " + id);
});
assert(host.innerHTML.indexOf("mi-aspects-group-facility") !== -1, "facility group rendered");
assert(host.innerHTML.indexOf("mi-aspects-more") === -1, "no More control");
assert(host.innerHTML.indexOf("data-mi-aspects-sentence") !== -1, "sentence host");
assert(host.innerHTML.indexOf("#f87171") !== -1, "key swatch");
handle.setActive("cah");
assert(selected.length === 1 && selected[0] === "cah", "CAH is one tap");
assert(handle.getActive() === "cah", "active lens");

console.log("ok v3-2200");
