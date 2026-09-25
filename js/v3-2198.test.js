/* amp-build:2198-mi-state-place-aspects — state-only Place draw + Aspects selector. Run: node js/v3-2198.test.js */
var fs = require("fs"), path = require("path"), vm = require("vm");
var root = path.join(__dirname, "..");
var STAMP = "2198-mi-state-place-aspects";
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
assert(html.indexOf("?v=2197") === -1, "no stale 2197 cache");
assert(html.indexOf('href="css/site.css?v=2198"') !== -1, "css cache");
assert(html.indexOf('href="css/mi-aspects-selector.css?v=2198"') !== -1, "aspects css linked");
assert(html.indexOf('src="js/mi-aspects-selector.js?v=2198"') !== -1, "aspects js linked");
assert(html.indexOf('src="js/amp-mi-place-draw-engine.js?v=20260919d"') !== -1, "engine lock query");
assert(html.indexOf('id="mi-aspects-selector"') !== -1, "aspects mount");
assert(html.indexOf('id="mi-aspects-numbers"') !== -1, "numbers mount");
assert(html.indexOf("mi-app-chip-row") === -1, "example chip row gone");
assert(html.indexOf("Map select") === -1, "Map select EXAMPLE gone");
assert(html.indexOf("miPlaceDrawJumps") === -1, "city jump pills gone from html");
assert(html.indexOf("amp-build " + STAMP) !== -1, "footer chip");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app stamp");
assert(app.indexOf("Map select") === -1, "app no longer writes Map select");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip");
assert(css.indexOf("fill: transparent !important") !== -1, "selected state fill transparent");
assert(fb === html, "404 == index");

assert(engine.indexOf("miPlaceDrawJumps") === -1, "engine does not build city jump pills");
assert(engine.indexOf("placeDrawSelectionClip") !== -1, "heat clip path");
assert(engine.indexOf("pixelInSelectionMask") !== -1, "heat mask");
assert(engine.indexOf("function selectionCodes") !== -1, "selection codes");
assert(engine.indexOf('__version: "20260919d"') !== -1, "engine version lock");
assert(engine.indexOf("baseline: 306520") !== -1, "FM competitive lock");
assert(work.indexOf("function maybeFitSelection") !== -1, "fit helper");
assert(work.indexOf("fitToCodes") !== -1, "fit viewport");
assert(work.indexOf('el.style.fill = ""') !== -1, "place draw does not paint gray fill");

var ids = ["raw", "place_draw", "day_load", "specialty_supply", "support", "cah", "fqhc", "cms"];
ids.forEach(function (id) {
  assert(selJs.indexOf('id: "' + id + '"') !== -1, "lens " + id);
});
assert(selJs.indexOf("mount: mount") !== -1, "mount API");
assert(selJs.indexOf("AmpMiAspectsSelector.mount") !== -1 || selJs.indexOf("mount(host, options)") !== -1, "mount documented");
assert(selCss.indexOf(".mi-aspects-lens") !== -1, "lens css");

var sandbox = {
  window: {},
  document: {
    documentElement: { getAttribute: function () { return "light"; } },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
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
  innerHTML: "",
  addEventListener: function () {},
  querySelectorAll: function () { return []; },
  contains: function () { return true; }
};
var nums = { classList: { add: function () {} }, setAttribute: function () {}, innerHTML: "" };
var mounted = 0;
sandbox.document.getElementById = function (id) {
  if (id === "host") return host;
  if (id === "nums") return nums;
  return null;
};
vm.runInContext(selJs, sandbox, { filename: "mi-aspects-selector.js" });
var handle = sandbox.AmpMiAspectsSelector.mount("host", {
  numbersHost: "nums",
  onSelect: function () { mounted += 1; }
});
assert(handle && sandbox.AmpMiAspectsSelector.LENSES.length === 8, "component mounts 8 lenses");
assert(host.innerHTML.indexOf('data-aspect="cms"') !== -1, "all lenses rendered");
assert(host.innerHTML.indexOf("mi-aspects-lens-blurb") !== -1, "one-line blurbs");
handle.setActive("place_draw");
assert(mounted === 1, "one tap switches lens");
assert(handle.getActive() === "place_draw", "active lens");

console.log("ok v3-2198");
