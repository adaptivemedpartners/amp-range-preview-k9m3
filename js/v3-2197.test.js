/* amp-build:2197-pill-blue-wash — stat pills navy background, sky text kept; 404 synced. Run: node js/v3-2197.test.js */
var fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
var STAMP = "2197-pill-blue-wash";
function assert(c, m) { if (!c) { console.error("FAIL:", m); process.exit(1); } }
var css = fs.readFileSync(path.join(root, "css/site.css"), "utf8");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var fb = fs.readFileSync(path.join(root, "404.html"), "utf8");
var app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
assert(html.indexOf("amp-build:" + STAMP) !== -1, "html stamp");
assert(html.indexOf("?v=2196") === -1, "no stale 2195");
assert(html.indexOf('href="css/site.css?v=2197"') !== -1, "css cache");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip");
var b = css.slice(css.indexOf("/* ========== amp-build:" + STAMP));
assert(b.indexOf("radial-gradient") !== -1 && b.indexOf("#152332") !== -1, "wash bg");
assert(css.indexOf("color: #78C4E5;") !== -1, "sky text kept");
assert(fb === html, "404 == index");
console.log("ok v3-2197");
