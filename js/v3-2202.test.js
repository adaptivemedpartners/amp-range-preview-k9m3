/* amp-build:2202-mi-aspects-drop-cms — CMS removed from MI Aspects; seven remain. Run: node js/v3-2202.test.js */
var fs = require("fs"), path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2202-mi-aspects-drop-cms";
function assert(c, m) { if (!c) { console.error("FAIL:", m); process.exit(1); } }
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var fb = fs.readFileSync(path.join(root, "404.html"), "utf8");
var css = fs.readFileSync(path.join(root, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
var wb = fs.readFileSync(path.join(root, "js/ridge-workbench.js"), "utf8");
assert(html.indexOf("<!-- amp-build:" + STAMP + " -->") === html.indexOf("<!-- amp-build:"), "html tip stamp");
assert(html.indexOf("?v=2201") === -1, "no stale 2201 cache");
assert(html.indexOf("amp-build " + STAMP) !== -1, "footer chip");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip");
assert(fb === html, "404 == index");
assert(wb.indexOf('{ id: "cms"') === -1, "no CMS aspect def");
global.window = global;
require(path.join(root, "js/mi-aspects-selector.js"));
var S = window.AmpMiAspectsSelector;
var ids = S.FACILITY.map(function (l) { return l.id; });
assert(ids.join(",") === "cah,fqhc", "facility = CAH, FQHC");
assert(S.CORE.length === 5, "core five kept");
console.log("OK v3-2202");
