/* amp-build:2199-aspects-exec-read — exec aspects layout. Run: node js/v3-2199.test.js */
var fs = require("fs"), path = require("path"), vm = require("vm");
var root = path.join(__dirname, "..");
var STAMP = "2199-aspects-exec-read";
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
assert(html.indexOf("?v=2198") === -1, "no stale 2198 cache");
assert(html.indexOf('href="css/site.css?v=2199"') !== -1, "css cache");
assert(html.indexOf('href="css/mi-aspects-selector.css?v=2199"') !== -1, "aspects css linked");
assert(html.indexOf('src="js/mi-aspects-selector.js?v=2199"') !== -1, "aspects js linked");
assert(html.indexOf('src="js/amp-mi-place-draw-engine.js?v=20260919d"') !== -1, "engine lock query");
assert(html.indexOf('id="mi-aspects-selector"') !== -1, "aspects mount");
assert(html.indexOf("mi-app-chip-row") === -1, "example chip row gone");
assert(html.indexOf("amp-build " + STAMP) !== -1, "footer chip");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip");
assert(css.indexOf("fill: transparent !important") !== -1, "selected state fill transparent");
assert(css.indexOf("stroke-width: 2.8px") !== -1, "desktop place-draw stroke");
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
assert(work.indexOf('return pop / redi') !== -1, "supply hardness is people per specialist");
assert(work.indexOf("Math.floor(i * 5 / n)") !== -1, "five bands");
assert(work.indexOf('"#d9e3ee", "#b7c8da", "#7f9bb8", "#3e6488", "#16324a"') !== -1, "one hue, darker last");
assert(work.indexOf("mi-aspects-filter-out") !== -1, "CAH filter class");
assert(work.indexOf('return ["specialty_supply"]') !== -1, "default lens is specialty supply");
assert(work.indexOf('mapEl: $("ridge-map-wrap")') !== -1, "map moves into the selector");
assert(work.indexOf("mi-aspects-on") !== -1, "aspects host class");
var readSrc = work.slice(work.indexOf("function aspectRead"), work.indexOf("function isCahHeavy"));
assert(readSrc.indexOf("fmtMoney") === -1, "read has no dollar formatter");
assert(readSrc.indexOf("DFW") === -1 && readSrc.indexOf("Miami") === -1, "read names no cities");
assert(readSrc.indexOf("darker states have fewer") !== -1, "supply sentence");
assert(readSrc.indexOf("darker states are harder to recruit") !== -1, "raw sentence");
assert(readSrc.indexOf("pin marks its top metro") !== -1, "place draw sentence");

assert(selJs.indexOf("AmpMiAspectsSelector.mount(host, options)") !== -1, "mount documented");
assert(selJs.indexOf('id: "raw"') !== -1, "raw lens");
assert(selJs.indexOf('id: "specialty_supply"') !== -1, "supply lens");
assert(selJs.indexOf('id: "place_draw"') !== -1, "place lens");
assert(selJs.indexOf('id: "day_load"') !== -1, "day load lens");
assert(selJs.indexOf('kind: "filter"') !== -1, "filters are not lenses");
assert(selJs.indexOf('data-mi-aspects-sentence') !== -1, "sentence element");
assert(selJs.indexOf("Top 5") !== -1 && selJs.indexOf("Bottom 5") !== -1, "rank headings");
assert(selCss.indexOf("minmax(0, 7fr) minmax(200px, 3fr)") !== -1, "70/30 stage");
assert(selCss.indexOf("order: -1") !== -1, "phone rail first");
assert(selJs.indexOf("weight") === -1 || selJs.indexOf("slider") === -1, "no weight slider in the component");

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
assert(api.PRIMARY.length === 4, "four primary lenses");
assert(api.MORE.filter(function (x) { return x.kind === "filter"; }).map(function (x) { return x.id; }).join(",") === "cah,fqhc,cms", "CAH FQHC CMS are filters");
var selected = [];
var handle = api.mount("host", {
  active: "cah",
  onSelect: function (id) { selected.push(id); },
  getRead: function () { return { sentence: "OB/GYN · Specialty supply: darker states have fewer OB/GYNs per person", mode: "sample", top: [], bottom: [] }; }
});
assert(handle.getActive() === "specialty_supply", "filter id is not a lens");
assert(host.innerHTML.indexOf('data-aspect="raw"') !== -1, "raw button");
assert(host.innerHTML.indexOf('data-aspect="specialty_supply"') !== -1, "supply button");
assert(host.innerHTML.indexOf('data-aspect="place_draw"') !== -1, "place button");
assert(host.innerHTML.indexOf('data-aspect="day_load"') !== -1, "day load button");
assert(host.innerHTML.indexOf('data-aspect="support"') !== -1, "support lives under More");
assert(host.innerHTML.indexOf('data-filter="cah"') !== -1, "CAH filter");
assert(host.innerHTML.indexOf('data-filter="fqhc"') !== -1, "FQHC filter");
assert(host.innerHTML.indexOf('data-filter="cms"') !== -1, "CMS filter");
assert(host.innerHTML.indexOf("data-mi-aspects-sentence") !== -1, "sentence host");
handle.setActive("place_draw");
assert(selected.length === 1 && selected[0] === "place_draw", "one tap switches lens");
assert(handle.getActive() === "place_draw", "active lens");

console.log("ok v3-2199");
