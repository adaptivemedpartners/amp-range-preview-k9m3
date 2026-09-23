/* Node smoke: 2155 homepage placements map replaces retention story cards.
   Run: node js/home-placements-map-2155.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function sliceHome(html) {
  var start = html.indexOf('data-route="home"');
  var end = html.indexOf('class="home-job2"');
  assert(start !== -1 && end !== -1 && end > start, "could not isolate homepage block");
  return html.slice(start, end);
}

function checkHtml(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2158-v3-home-client-funnel -->") !== -1, rel + " missing 2158 stamp comment");
  assert(html.indexOf('href="css/site.css?v=2158"') !== -1, rel + " css not ?v=2158");
  assert(html.indexOf('src="js/app.js?v=2158"') !== -1, rel + " app.js not ?v=2158");
  assert(html.indexOf("webflow") === -1 && html.indexOf("Webflow") === -1, rel + " Webflow leaked in");
  var home = sliceHome(html);
  assert(home.indexOf("data-home-place-map") === -1, rel + " homepage placements map should not mount in V3");
  assert(home.indexOf("data-hero-ret-rotator") === -1, rel + " homepage rotator should not mount in V3");
}

checkHtml("index.html");
checkHtml("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2158-v3-home-client-funnel"') !== -1, "app.js build stamp");
assert(app.indexOf("h1 intentionally omitted") !== -1, "SEO H1 lock comment missing");
assert(app.indexOf("never overwrite homepage explore-title H1") !== -1, "SEO explore-title guard missing");

var mapJs = fs.readFileSync(path.join(ROOT, "js/home-placements-map.js"), "utf8");
assert(mapJs.indexOf("amp-build:2155-home-placements-map") !== -1, "map js missing 2155 stamp");
assert(mapJs.indexOf("ridge-usa-map.svg") !== -1, "map js must reuse in-repo SVG");
assert(mapJs.indexOf("raiseFeatured") !== -1, "map js must raise featured states above neighbors");
assert(mapJs.indexOf("Nebraska FQHC") !== -1, "map js missing 2015 placement");
assert(mapJs.indexOf("Nebraska Critical Access Hospital") !== -1, "map js missing 2018 placement");
assert(mapJs.indexOf("Kansas medical group") !== -1, "map js missing 2021 Kansas medical group");
assert(mapJs.indexOf("aspect-chip") === -1 && mapJs.indexOf("data-aspect") === -1, "map js leaked Aspects chips");
assert(mapJs.indexOf("cashBands") === -1 && mapJs.indexOf("getAmpBands") === -1, "map js leaked cash bands");
assert(mapJs.indexOf("Place-draw") === -1 && mapJs.indexOf("placeDraw") === -1, "map js leaked Place-draw heat");
assert(mapJs.indexOf("ridge-workbench") === -1 && mapJs.indexOf("ridge-map-container") === -1, "map js leaked workbench chrome");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2155-home-placements-map") !== -1, "css missing 2155 stamp");
assert(css.indexOf(".home-place-map-stage") !== -1, "css missing map stage");
assert(css.indexOf(".home-place-map-host") !== -1, "css missing map host");
assert(css.indexOf("@media (max-width: 760px)") !== -1, "css missing mobile map stack");
assert(css.indexOf("client-step3-ret-strip") !== -1, "css lost step 3 strip rules");

console.log("home-placements-map-2155.test.js: ok");
