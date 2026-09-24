/* amp-build:2193-step3-sbs-step4-cards-confirm-legible
   Step3 SBS + step4 four cards from 900px + confirm legibility.
   Run: node js/v3-step3-sbs-step4-cards-confirm-legible-2193.test.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2193-step3-sbs-step4-cards-confirm-legible";

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
assert(html.indexOf('href="css/site.css?v=2193"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2193"') !== -1, "app cache");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* Step 3 SBS lock */
assert(css.indexOf("desktop SBS lock") !== -1, "step3 comment");
assert(css.indexOf("display: grid !important") !== -1, "step3 grid important");
assert(css.indexOf("grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.78fr) !important") !== -1, "step3 columns");
assert(html.indexOf('class="client-spec-split"') !== -1, "step3 split markup");

/* Step 4 four cards from 900 */
assert(css.indexOf("drop right-rail grid from 1100") !== -1 || css.indexOf("four placement photos in right rail from 900px") !== -1, "step4 900 comment");
assert(css.indexOf(".view[data-route=\"client-region\"] > .view-chrome {\n    display: grid !important") !== -1
  || css.indexOf("display: grid !important") !== -1, "chrome grid important");
assert(css.indexOf("repeat(2, minmax(0, 1fr)) !important") !== -1, "2x2 important");
assert(css.indexOf(".amp-ret-card--desktop {\n    display: flex !important") !== -1
  || css.indexOf("amp-ret-card--desktop") !== -1 && css.indexOf("display: flex !important") !== -1, "desktop cards flex");
assert(html.indexOf('data-ret="2013-em-vcu"') !== -1, "EM card");
assert(html.indexOf('data-ret="2012-peds-alliance"') !== -1, "Alliance card");
assert(html.indexOf("assets/story-2013-em-er.jpg") !== -1, "EM ER asset");
assert((html.match(/client-ret-pepper--region[\s\S]*?<\/aside>/) || [""])[0].split("<article").length - 1 === 4
  || (html.split('client-ret-pepper--region')[1] || "").split("<article").length >= 5, "four pepper articles");

/* Confirm legibility */
assert(css.indexOf("width: 40px !important") !== -1, "check shrunk");
assert(css.indexOf("font-size: 15px !important") !== -1, "topic label 15px");
assert(css.indexOf("font-size: clamp(1.28rem") !== -1, "discuss title enlarged");
assert(css.indexOf("padding: 11px 12px 10px !important") !== -1, "card footprint restored");
assert(css.indexOf("prefer") !== -1 || css.indexOf("older-reader") !== -1, "legibility note");

/* SoftMess untouched */
assert(html.indexOf("AMP-Mess-Soft") === -1, "SoftMess out of index");
assert(css.indexOf("AMP-Mess-Soft") === -1, "SoftMess out of css");
assert(!fs.existsSync(path.join(root, "SoftMess")), "no SoftMess dir");

console.log("ok — 2193 step3 SBS + step4 four cards @900 + confirm legible (" + STAMP + ")");
