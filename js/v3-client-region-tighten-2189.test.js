/* amp-build:2189-client-region-tighten
   Step 4: one How we help (climb), dark how-help hidden, map hero.
   Run: node js/v3-client-region-tighten-2189.test.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2189-client-region-tighten";

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
assert(html.indexOf('href="css/site.css?v=2189"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2189"') !== -1, "app cache");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:" + STAMP) === 0 || css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* Step 4 — keep climb, hide dark how-help */
assert(html.indexOf('id="client-climb-band"') !== -1, "climb timeline kept");
assert(html.indexOf('data-climb-option="A"') !== -1, "climb option A kept");
assert(html.indexOf('data-amp-later="how-we-help-dark"') !== -1, "dark how-help parked marker");
var howHelpIdx = html.indexOf('class="client-how-help"');
assert(howHelpIdx !== -1, "how-help section still in DOM (parked)");
var howHelpSnippet = html.slice(howHelpIdx, howHelpIdx + 160);
assert(howHelpSnippet.indexOf("hidden") !== -1, "how-help has hidden attr");
assert(css.indexOf('.view[data-route="client-region"] .client-how-help') !== -1, "css hides how-help on region");
assert(css.indexOf("display: none !important") !== -1, "how-help display none");

/* Map hero enlarge */
assert(css.indexOf("max-height: 340px") !== -1, "desktop map taller");
assert(css.indexOf("max-height: 300px") !== -1, "base map taller");

/* 2188 side-by-side locks still present */
assert(css.indexOf("minmax(0, 1.45fr) minmax(300px, 400px)") !== -1, "step4 desktop cols kept");
assert(css.indexOf("minmax(0, 1.25fr) minmax(300px, 0.78fr)") !== -1, "step3 desktop cols kept");
assert(css.indexOf("minmax(0, 1.2fr) minmax(280px, 0.72fr)") !== -1, "step5 desktop cols kept");
assert(html.indexOf('class="client-spec-split"') !== -1, "step3 split kept");
assert(html.indexOf("client-meeting-split") !== -1, "step5 split kept");
assert(html.indexOf("client-ret-pepper--region") !== -1, "step4 pepper kept");

/* Optional crumb truncate */
assert(app.indexOf('+ " more"') !== -1 || app.indexOf("+ \" more\"") !== -1 || app.indexOf('+" more"') !== -1, "fac-line +N more");
assert(app.indexOf("labels.slice(0, 3)") !== -1, "fac-line caps at 3 specs");

/* SoftMess untouched */
assert(html.indexOf("AMP-Mess-Soft") === -1, "SoftMess stays out of index");
assert(css.indexOf("AMP-Mess-Soft") === -1, "SoftMess stays out of css");

console.log("ok — 2189 client-region tighten (one How we help, map hero)");
