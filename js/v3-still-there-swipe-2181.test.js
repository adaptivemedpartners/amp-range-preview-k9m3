/* Node smoke: 2181 still-there cards swipe.
   Run: node js/v3-still-there-swipe-2181.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkPage(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2181-still-there-swipe -->") !== -1, rel + " missing 2181 stamp");
  assert(html.indexOf("<!-- amp-build:2180-footer-no-overscroll-mobile -->") !== -1, rel + " lost 2180 stamp");
  assert(html.indexOf("<!-- amp-build:2178-hero-first-stack -->") !== -1, rel + " lost 2178 stamp");
  assert(html.indexOf("amp-build 2181-still-there-swipe") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2181"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/hero-ret-rotator.js?v=2181"') !== -1, rel + " rotator cache");
  assert(html.indexOf("?v=2180") === -1, rel + " still on 2180 cache");
  assert(html.indexOf("data-hero-ret-rotator") !== -1, rel + " rotator mount");
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
var rot = fs.readFileSync(path.join(ROOT, "js/hero-ret-rotator.js"), "utf8");
assert(app.indexOf('__AMP_BUILD = "2181-still-there-swipe"') !== -1, "app build stamp");
assert(app.indexOf('setProperty("--home-bg-vh", "100svh")') !== -1, "2180 phone viewport cap kept");
assert(rot.indexOf("INTERVAL_MS = 3800") !== -1, "auto-rotate kept");
assert(rot.indexOf("mouseenter") !== -1 && rot.indexOf("paused = true") !== -1, "hover pause kept");
assert(rot.indexOf("data-hero-ret-track") !== -1, "swipe track");
assert(rot.indexOf("pointerdown") !== -1 && rot.indexOf("pointermove") !== -1, "pointer drag");
assert(rot.indexOf('drag.lock === "y"') !== -1, "vertical scroll wins");
assert(rot.indexOf("FLICK_PX_MS") !== -1, "velocity snap");
assert(rot.indexOf("data-hero-ret-dot") !== -1, "dots stay");
assert(css.indexOf("touch-action: pan-y") !== -1, "vertical pan stays with the page");
assert(css.indexOf(".site-footer {\n  background: #0b1220; color: #94a3b8; padding: 36px 20px 48px;") !== -1, "footer padding kept");
assert(css.indexOf("height: 100svh !important;") !== -1, "2180 small-viewport layers kept");

var home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var hero = home.indexOf('class="v3-hero v3-place-card"');
var bridge = home.indexOf("v3-stay-bridge");
var zach = home.indexOf("amp-zach-scope-strip");
var row2 = home.indexOf("v3-stats-parent");
assert(hero !== -1 && hero < bridge && bridge < zach && zach < row2, "2178 hero-first stack order");
assert(home.indexOf('id="client-facility-ctx"') !== -1, "client step 2 story card kept");
assert(home.indexOf('id="client-specialty-ctx"') !== -1, "client step 3 story card kept");

console.log("ok — 2181 still-there cards swipe");
