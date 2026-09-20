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

function sliceHomeMap(html) {
  var start = html.indexOf('class="home-ret-strip home-place-map"');
  var end = html.indexOf('class="home-job2"');
  assert(start !== -1 && end !== -1 && end > start, "could not isolate homepage map strip");
  return html.slice(start, end);
}

function sliceStep3(html) {
  var start = html.indexOf("client-step3-ret-strip");
  var end = html.indexOf('data-route="client-region"');
  assert(start !== -1 && end !== -1 && end > start, "could not isolate client step 3 strip");
  return html.slice(start, end);
}

function checkHtml(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2157-mi-map-pinch-zoom -->") !== -1, rel + " missing 2157 stamp comment");
  assert(html.indexOf("amp-build 2157-mi-map-pinch-zoom") !== -1, rel + " missing 2157 chip");
  assert(html.indexOf('href="css/site.css?v=2157"') !== -1, rel + " css not ?v=2157");
  assert(html.indexOf('src="js/app.js?v=2157"') !== -1, rel + " app.js not ?v=2157");
  assert(html.indexOf('src="js/home-placements-map.js?v=2157"') !== -1, rel + " placements map js missing");
  assert(html.indexOf('src="js/hero-ret-rotator.js?v=2157"') !== -1, rel + " rotator js missing");
  assert(html.indexOf(">RETENTION-LED<") !== -1, rel + " lost RETENTION-LED eyebrow");
  assert(
    html.indexOf('<h1 class="explore-title">Permanent recruitment measured in years — not placements.</h1>') !== -1,
    rel + " H1 lock overwritten"
  );
  assert(html.indexOf("data-hero-ret-rotator") !== -1, rel + " missing hero rotator");
  assert(html.indexOf("Your partners in rural healthcare recruiting") !== -1, rel + " missing partners subline");
  assert(html.indexOf("Clear paths for physicians") === -1, rel + " Clear paths leftover still in markup");
  assert(html.indexOf("explore-range-invite") === -1, rel + " explore-range-invite CTA still in markup");
  assert(html.indexOf("Kansas medical group") !== -1, rel + " missing Kansas medical group label");
  assert(html.indexOf('hero-ret-mini-role">Physician<') === -1, rel + " Kansas rotator role still says Physician");
  assert(html.indexOf('amp-ret-role">Physician<') === -1, rel + " Kansas card role still says Physician");
  assert(html.indexOf("Nebraska FQHC") !== -1, rel + " missing 2015 story");
  assert(html.indexOf("Nebraska Critical Access Hospital") !== -1, rel + " missing 2018 story");
  assert(html.indexOf("11 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2015 footer");
  assert(html.indexOf("8 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2018 footer");
  assert(html.indexOf("5 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2021 footer");
  assert(html.indexOf('data-go="physician"') !== -1, rel + " physician funnel data-go lost");
  assert(html.indexOf('data-go="client"') !== -1, rel + " client funnel data-go lost");
  assert(html.indexOf("webflow") === -1 && html.indexOf("Webflow") === -1, rel + " Webflow leaked in");

  var home = sliceHome(html);
  var homeMap = sliceHomeMap(html);
  assert(home.indexOf("data-hero-ret-rotator") !== -1, rel + " hero rotator left the homepage");
  assert(homeMap.indexOf("data-home-place-map") !== -1, rel + " homepage map host missing");
  assert(homeMap.indexOf("Placements in the wild") !== -1, rel + " homepage kicker rewritten away from placements");
  assert(homeMap.indexOf("Seats that stick — years later") !== -1, rel + " homepage title rewritten");
  assert(homeMap.indexOf("home-ret-strip-grid") === -1, rel + " homepage still has story-card grid");
  assert(homeMap.indexOf("amp-ret-card") === -1, rel + " homepage story cards still stacked");
  assert(homeMap.indexOf("story-2015-peds-ne.jpg") === -1, rel + " homepage map still shows 2015 card photo");
  assert(homeMap.indexOf("story-2018-fm-ne-cah.jpg") === -1, rel + " homepage map still shows 2018 card photo");
  assert(homeMap.indexOf("story-2021-physician-ks.jpg") === -1, rel + " homepage map still shows 2021 card photo");
  assert(homeMap.indexOf("Aspect") === -1, rel + " homepage map leaked Aspects chrome");
  assert(homeMap.indexOf("Ridge") === -1 && homeMap.indexOf("ridge") === -1, rel + " homepage map leaked Ridge naming");
  assert(homeMap.indexOf("Place-draw") === -1 && homeMap.indexOf("cash band") === -1, rel + " homepage map leaked MI chrome");

  var step3 = sliceStep3(html);
  assert(step3.indexOf("home-ret-strip-grid--4") !== -1, rel + " client step 3 4-card grid removed");
  assert(step3.indexOf("amp-ret-card") !== -1, rel + " client step 3 cards removed");
  assert(step3.indexOf("YEARS, NOT PLACEMENTS") !== -1, rel + " client step 3 proof card removed");
  assert(step3.indexOf("data-home-place-map") === -1, rel + " map incorrectly injected into step 3");
}

checkHtml("index.html");
checkHtml("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2157-mi-map-pinch-zoom"') !== -1, "app.js build stamp");
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
