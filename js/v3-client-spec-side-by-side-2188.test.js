/* amp-build:2188-client-spec-side-by-side
   Client path steps 3/4/5 full-width 16:9 side-by-side.
   Run: node js/v3-client-spec-side-by-side-2188.test.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2188-client-spec-side-by-side";

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
assert(html.indexOf('href="css/site.css?v=2188"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2188"') !== -1, "app cache");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:" + STAMP) === 0 || css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* Step 3 — specialty split */
assert(html.indexOf('class="client-spec-split"') !== -1, "step3 split wrap");
assert(html.indexOf('class="client-spec-picker"') !== -1, "step3 picker");
assert(html.indexOf('class="client-spec-preview"') !== -1, "step3 preview");
assert(html.indexOf('id="client-specialty-ctx"') !== -1, "step3 ctx card");
assert(html.indexOf('id="client-spec-cards"') !== -1, "step3 cards");
assert(css.indexOf(".client-spec-split") !== -1, "css split");
assert(css.indexOf("grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.78fr)") !== -1, "step3 desktop cols");
assert(css.indexOf("max-width: 1360px") !== -1, "step3 sheet widened");
/* 2187 grid locks still present */
assert(css.indexOf("grid-column: 1 / -1") !== -1, "Other full-width row kept");
assert(app.indexOf("ranks.slice(0, 9)") !== -1 || app.indexOf(".slice(0, 9)") !== -1, "9 specialty cap kept");

/* Step 4 — region sheet + pepper side-by-side */
assert(html.indexOf('data-route="client-region"') !== -1, "step4 route");
assert(html.indexOf("client-ret-pepper--region") !== -1, "step4 pepper");
assert(css.indexOf('view[data-route="client-region"] > .view-chrome') !== -1, "step4 chrome grid selector");
assert(css.indexOf("minmax(0, 1.45fr) minmax(300px, 400px)") !== -1, "step4 desktop cols");
assert(css.indexOf("max-width: 1440px") !== -1, "step4 full width");

/* Step 5 — meeting form + proof */
assert(html.indexOf("client-meeting-sheet") !== -1, "step5 sheet class");
assert(html.indexOf("client-meeting-split") !== -1, "step5 split");
assert(html.indexOf("client-meeting-preview") !== -1, "step5 preview");
assert(html.indexOf('style="max-width:640px;margin:0 auto"') === -1 || html.indexOf('client-meeting-sheet" style="max-width:640px') === -1, "step5 inline 640 gone from meeting");
assert(html.indexOf("client-meeting-sheet") !== -1 && html.indexOf('data-route="client-meeting"') < html.indexOf("client-meeting-sheet"), "meeting uses sheet class");
/* Ensure meeting no longer uses the old centered 640 inline on its panel */
var meet = html.slice(html.indexOf('data-route="client-meeting"'), html.indexOf('data-route="confirm-client"'));
assert(meet.indexOf("max-width:640px") === -1, "meeting panel dropped inline 640");
assert(css.indexOf(".client-meeting-split") !== -1, "css meeting split");
assert(css.indexOf("minmax(0, 1.2fr) minmax(280px, 0.72fr)") !== -1, "step5 desktop cols");

/* SoftMess not in this repo / not referenced */
assert(html.indexOf("AMP-Mess-Soft") === -1, "SoftMess stays out of index");
assert(css.indexOf("AMP-Mess-Soft") === -1, "SoftMess stays out of css");

console.log("ok — 2188 client steps 3/4/5 full-width side-by-side");
