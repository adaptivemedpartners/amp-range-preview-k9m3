/* amp-build:2191-client-region-years-align-four
   Years top-align + 4-card 2×2 + climb delegation + step3 side-by-side restore.
   Run: node js/v3-client-region-years-align-four-2191.test.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2191-client-region-years-align-four";

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
assert(html.indexOf('href="css/site.css?v=2191"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2191"') !== -1, "app cache");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* (1) Years top-align */
assert(css.indexOf("margin: 0 0 12px; /* 2191: was 18px") !== -1, "pepper top margin zeroed");
assert(css.indexOf("YEARS top-align") !== -1 || css.indexOf("raise YEARS top") !== -1, "years align comment");

/* (2) Fourth card Alliance + no odd-third span when 4 */
assert(html.indexOf('data-ret="2012-peds-alliance"') !== -1, "alliance fourth card");
assert(html.indexOf("Alliance Pediatrics") !== -1, "alliance label");
assert(html.indexOf("Keller, TX") !== -1, "alliance place");
var regionSlice = html.slice(html.indexOf('client-ret-pepper--region'), html.indexOf('data-route="client-retained"'));
assert((regionSlice.match(/class="amp-ret-card/g) || []).length >= 4, "four region cards");
assert(css.indexOf(".amp-ret-card:nth-child(3):last-child") !== -1, "odd-third only when last");
assert(css.indexOf("nth-child(3):not(:last-child)") !== -1, "no span when 4 cards");

/* (3) Climb reliable after navigate */
assert(app.indexOf("clientClimbDocBound") !== -1, "doc delegation flag");
assert(app.indexOf("resetClientClimbStations") !== -1, "reset on enter");
assert(app.indexOf("activeClientClimbBand") !== -1, "active band helper");
assert(app.indexOf('document.addEventListener("pointerover"') !== -1, "pointerover delegation");
assert(app.indexOf('document.addEventListener("click"') !== -1, "click delegation");

/* (4) Step 3 side-by-side restore */
assert(css.indexOf("restore full-width 16:9 side-by-side") !== -1, "step3 restore block");
assert(html.indexOf('class="client-spec-split"') !== -1, "step3 split kept");
assert(css.indexOf("grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.78fr)") !== -1, "step3 cols");
assert(css.indexOf("max-width: 1360px") !== -1, "step3 sheet width");

/* Step 5 2x2 still present */
assert(css.indexOf("display: contents") !== -1, "step5 contents");
assert(html.indexOf("client-meeting-split") !== -1, "step5 split");

/* SoftMess untouched */
assert(html.indexOf("AMP-Mess-Soft") === -1, "SoftMess out of index");
assert(css.indexOf("AMP-Mess-Soft") === -1, "SoftMess out of css");

console.log("ok — 2191 client-region years-align-four (" + STAMP + ")");
