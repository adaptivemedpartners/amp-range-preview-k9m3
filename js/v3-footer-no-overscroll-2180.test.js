/* Node smoke: 2180 mobile document scroll ends at the footer.
   Run: node js/v3-footer-no-overscroll-2180.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkPage(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2180-footer-no-overscroll-mobile -->") !== -1, rel + " missing 2180 stamp");
  assert(html.indexOf("<!-- amp-build:2179-footer-no-overscroll -->") !== -1, rel + " lost 2179 stamp");
  assert(html.indexOf("<!-- amp-build:2178-hero-first-stack -->") !== -1, rel + " lost 2178 stamp");
  assert(html.indexOf("amp-build 2183-bridge-under-sub-inter-teal-faces") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2183"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/app.js?v=2183"') !== -1, rel + " app cache");
  assert(html.indexOf("?v=2179") === -1, rel + " still on 2179 cache");
  var fade = html.indexOf('class="home-layer-soft-fade"');
  var footer = html.indexOf('class="site-footer"');
  assert(fade !== -1 && footer !== -1 && fade < footer, rel + " fade must sit before the footer");
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('__AMP_BUILD = "2183-bridge-under-sub-inter-teal-faces"') !== -1, "app build stamp");
assert(app.indexOf('setProperty("--home-bg-vh", "100svh")') !== -1, "phone wallpaper height is the small viewport");
assert(app.indexOf("Math.ceil(h * 1.06)") !== -1, "desktop overscan kept");
assert(css.indexOf(".site-footer {\n  background: #0b1220; color: #94a3b8; padding: 36px 20px 48px;") !== -1, "footer padding kept");
assert(css.indexOf("padding-top: calc(var(--amp-title-clear) - 68px)") !== -1, "2178 desktop hero pad kept");
assert(css.indexOf("padding-top: max(72px, calc(var(--amp-title-clear) - 82px))") !== -1, "2178 mobile hero pad kept");

var b2180Start = css.indexOf("========== amp-build:2180-footer-no-overscroll-mobile");
var b2181Start = css.indexOf("========== amp-build:2181-still-there-swipe");
var b2180 = css.slice(b2180Start, b2181Start === -1 ? undefined : b2181Start);
assert(b2180.indexOf("@media (max-width: 900px)") !== -1, "mobile-only cap");
assert(b2180.indexOf("overflow-y: visible") !== -1, "html still scrolls");
assert(b2180.indexOf("overflow-y: hidden") === -1, "does not trap scroll with hidden");
assert(b2180.indexOf("overflow: hidden") === -1, "does not trap scroll with hidden shorthand");
assert(b2180.indexOf("height: 100svh !important;") !== -1, "layers use the small viewport");
assert(b2180.indexOf("bottom: auto !important;") !== -1, "layers are not stretched with bottom:0");
assert(b2180.indexOf("transform: none !important;") !== -1, "translateZ dropped on phone layers");
assert(b2180.indexOf(".view.funnel:not(.trailhead) > .shot") !== -1, "interior wallpaper capped");
assert(b2180.indexOf(".home-stage.v3-home .home-pro-bg") !== -1, "L1 wallpaper capped");
assert(b2180.indexOf(".amp-chat-launcher") !== -1, "launcher no longer anchored to layout bottom");
assert(b2180.indexOf("top: calc(100svh - 80px - env(safe-area-inset-bottom, 0px)) !important;") !== -1, "launcher stays on the small viewport");
assert(css.indexOf(".site-nav.is-home") !== -1, "L3 header lock remains");

var home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var hero = home.indexOf('class="v3-hero v3-place-card"');
var bridge = home.indexOf("v3-stay-bridge");
var zach = home.indexOf("amp-zach-scope-strip");
var row2 = home.indexOf("v3-stats-parent");
assert(hero !== -1 && hero < zach && zach < bridge && bridge < row2, "hero, specialty strip, steps, then row2");

console.log("ok — 2180 mobile footer ends the document");
