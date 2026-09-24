/* amp-build:2192-em-er-photo
   EM ER photo + pepper stack lift + confirm discuss thin.
   Run: node js/v3-em-er-photo-2192.test.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2192-em-er-photo";

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
assert(html.indexOf('href="css/site.css?v=2192"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2192"') !== -1, "app cache");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* EM photo swap — only 2013-em-vcu card */
var emStart = html.indexOf('data-ret="2013-em-vcu"');
assert(emStart !== -1, "EM card present");
var emChunk = html.slice(emStart, html.indexOf("</article>", emStart));
assert(emChunk.indexOf("assets/story-2013-em-er.jpg") !== -1, "EM uses ER asset");
assert(emChunk.indexOf("story-2015-peds-ne.jpg") === -1, "EM no longer uses peds");

var alStart = html.indexOf('data-ret="2012-peds-alliance"');
assert(alStart !== -1, "Alliance card present");
var alChunk = html.slice(alStart, html.indexOf("</article>", alStart));
assert(alChunk.indexOf("assets/story-2015-peds-ne.jpg") !== -1, "Alliance keeps peds");
assert(alChunk.indexOf("story-2013-em-er.jpg") === -1, "Alliance not on ER");

assert(fs.existsSync(path.join(root, "assets/story-2013-em-er.jpg")), "ER asset file exists");
assert(fs.existsSync(path.join(root, "assets/story-2015-peds-ne.jpg")), "peds asset still exists");

/* Pepper stack lift — zero sticky/margin as unit */
assert(css.indexOf("position: relative; /* 2192") !== -1, "pepper sticky killed");
assert(css.indexOf(".client-ret-pepper--region {\n    margin: 0 !important;") !== -1
  || css.indexOf("margin: 0 !important;") !== -1, "pepper margin zeroed");
assert(css.indexOf("lift ENTIRE right pepper stack") !== -1 || css.indexOf("whole right stack flush") !== -1, "stack lift comment");

/* Confirm discuss thin */
assert(css.indexOf("thinner topic cards") !== -1, "confirm thin comment");
assert(css.indexOf('.view[data-route="confirm-client"] .client-discuss-grid .hire-card') !== -1, "confirm card rule");
assert(css.indexOf("padding: 7px 9px 6px") !== -1, "thinner card padding");
assert(css.indexOf("Do NOT pull into under-header fade") !== -1, "fade constraint noted");

/* SoftMess untouched */
assert(html.indexOf("AMP-Mess-Soft") === -1, "SoftMess out of index");
assert(css.indexOf("AMP-Mess-Soft") === -1, "SoftMess out of css");
assert(!fs.existsSync(path.join(root, "SoftMess")), "no SoftMess dir in preview repo");

console.log("ok — 2192 em-er-photo + pepper lift + confirm thin (" + STAMP + ")");
