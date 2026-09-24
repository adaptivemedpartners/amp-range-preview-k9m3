/* amp-build:2190-client-region-mike-plan
   Step 3 taller FM ctx; Step 4 climb detail + YEARS/2-col; Step 5 2×2 + MI retarget;
   confirm receipt removed. SoftMess untouched.
   Run: node js/v3-client-region-mike-plan-2190.test.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2190-client-region-mike-plan";

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

var css = fs.readFileSync(path.join(root, "css/site.css"), "utf8");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");

assert(html.indexOf("amp-build:" + STAMP) !== -1, "html tip stamp");
assert(html.indexOf("amp-build " + STAMP) !== -1, "html chip");
assert(html.indexOf('href="css/site.css?v=2190"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2190"') !== -1, "app cache");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:" + STAMP) === 0 || css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* Step 4 — climb detail + dark how-help still parked */
assert(html.indexOf('id="client-climb-detail"') !== -1, "climb detail card");
assert(html.indexOf('id="client-climb-band"') !== -1, "climb band kept");
assert(app.indexOf("CLIMB_STATIONS") !== -1, "climb station map");
assert(app.indexOf("pinned — stop following hover") !== -1, "click freezes hover");
assert(html.indexOf('data-amp-later="how-we-help-dark"') !== -1, "dark how-help parked");
assert(css.indexOf('.view[data-route="client-region"] .client-how-help') !== -1, "css hides how-help");
assert(css.indexOf("client-ret-sell-rail--thin") !== -1, "thin YEARS rail css");
assert(css.indexOf("repeat(2, minmax(0, 1fr))") !== -1, "2-col placements");
assert(html.indexOf("client-ret-sell-rail--thin") !== -1, "thin class on region YEARS");
assert(html.indexOf("Community hospital · dedicated investment search") !== -1, "richer region cards");

/* Step 5 — 2×2 + 2-col proof grid */
assert(html.indexOf("client-meeting-proof-grid") !== -1, "meeting proof grid");
assert(html.indexOf('data-ret="meeting-alliance"') !== -1, "alliance card");
assert(html.indexOf('data-ret="meeting-vcu"') !== -1, "second meeting card");
assert(css.indexOf("display: contents") !== -1, "step5 display contents for 2x2");
assert(css.indexOf('.view[data-route="client-meeting"] .picked-agreement') !== -1, "search card grid cell");

/* Step 3 — taller FM media */
assert(css.indexOf("height: 268px") !== -1 || css.indexOf("min-height: 240px") !== -1, "taller specialty media");
assert(css.indexOf("background-position: center 48%") !== -1, "FM position not center-top only");

/* Confirm — MI retarget + receipt gone */
assert(html.indexOf("Explore the Range") === -1, "Explore the Range removed");
var miBtns = html.split('Get your preview of market intelligence here').length - 1;
assert(miBtns === 2, "two MI retarget CTAs, got " + miBtns);
assert(html.indexOf('href="/market-intelligence" data-go="mi-lite">Get your preview of market intelligence here') !== -1, "MI href+data-go");
assert(html.indexOf('id="mess-client-mock"') === -1, "client receipt mock removed from DOM");
assert(app.indexOf("client receipt mock removed") !== -1, "confirm-client no longer stamps receipt");

/* SoftMess untouched */
assert(html.indexOf("AMP-Mess-Soft") === -1, "SoftMess stays out of index");
assert(css.indexOf("AMP-Mess-Soft") === -1, "SoftMess stays out of css");
assert(html.indexOf('id="mess-response-mock"') !== -1, "physician confirm mock kept");

/* 2187 nine specialties + Other still */
assert(app.indexOf("slice(0, 9)") !== -1, "nine specialty ranks");
assert(html.indexOf("hire-card-other") !== -1 || app.indexOf("hire-card-other") !== -1, "Other row");

console.log("ok — 2190 client-region Mike plan (climb detail, YEARS/2-col, step5 2x2, MI retarget, receipt gone)");
