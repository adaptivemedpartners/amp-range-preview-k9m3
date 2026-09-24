/* amp-build:2195-pill-sky-step4-fit-refresh
   Homepage thin stat pills use the eyebrow sky (#78C4E5); Step 4 fits the
   Market Intelligence button on screen; 404.html (GitHub Pages deep-link /
   refresh fallback) is kept identical to index.html so a refresh on
   /client-region serves the current markup (4 placement cards, How we help
   detail card).
   Run: node js/v3-2195.test.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var STAMP = "2195-pill-sky-step4-fit-refresh";
function assert(cond, msg) { if (!cond) { console.error("FAIL:", msg); process.exit(1); } }
var css = fs.readFileSync(path.join(root, "css/site.css"), "utf8");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var fallback = fs.readFileSync(path.join(root, "404.html"), "utf8");
var app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");

assert(html.indexOf("amp-build:" + STAMP) !== -1, "html tip stamp");
assert(html.indexOf('href="css/site.css?v=2195"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2195"') !== -1, "app cache");
assert(html.indexOf("?v=2194") === -1, "no stale 2194 cache-bust");
assert(html.indexOf("amp-build " + STAMP) !== -1, "build chip");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* 1 · pill text color = eyebrow sky */
var block = css.slice(css.indexOf("/* ========== amp-build:" + STAMP));
assert(/\.v3-proof-thin \.v3-proof-pill strong,\s*\n\.home-stage\.v3-home \.v3-stats-parent \.v3-proof-thin \.v3-proof-pill span \{\s*color: #78C4E5;\s*\}/.test(block), "pill sky color");

/* 2 · Step 4 fit */
assert(block.indexOf("#client-ridge-cta-foot:not([hidden])") !== -1, "MI button docks on short screens");
assert(block.indexOf(".client-combined-stage > .client-step-on-card") !== -1, "step pill docked, heading up");

/* 3/4 · refresh path: 404 fallback must be the current page */
assert(fallback === html, "404.html identical to index.html (refresh on a deep link)");
var region = html.slice(html.indexOf('data-route="client-region"'));
region = region.slice(0, region.indexOf("</aside>"));
assert((region.match(/class="amp-ret-card amp-ret-card--dense/g) || []).length === 4, "4 placement cards on step 4");
assert(region.indexOf('id="client-climb-detail"') !== -1, "How we help detail card present");
assert(app.indexOf("clientClimbDocBound") !== -1, "2191 document delegation kept");
console.log("ok v3-2195");
