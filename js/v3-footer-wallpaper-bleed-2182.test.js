/* Node smoke: 2182 footer covers the fixed wallpaper at the end of scroll.
   Run: node js/v3-footer-wallpaper-bleed-2182.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkPage(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2182-footer-wallpaper-bleed -->") !== -1, rel + " missing 2182 stamp");
  assert(html.indexOf("<!-- amp-build:2181-still-there-swipe -->") !== -1, rel + " lost 2181 stamp");
  assert(html.indexOf("<!-- amp-build:2180-footer-no-overscroll-mobile -->") !== -1, rel + " lost 2180 stamp");
  assert(html.indexOf("amp-build 2182-footer-wallpaper-bleed") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2182"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/app.js?v=2182"') !== -1, rel + " app cache");
  assert(html.indexOf("?v=2181") === -1, rel + " still on 2181 cache");
  assert(html.indexOf("AMP-Mess-Soft") === -1, rel + " SoftMess must stay out of this page");
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('__AMP_BUILD = "2182-footer-wallpaper-bleed"') !== -1, "app build stamp");
assert(app.indexOf("function syncFooterWallpaperCap()") !== -1, "gap cap");
assert(app.indexOf('classList.add("amp-footer-endcap")') !== -1, "end cap class");
assert(app.indexOf('setProperty("--home-bg-vh", "100svh")') !== -1, "2180 phone viewport cap kept");
assert(css.indexOf(".site-footer {\n  background: #0b1220; color: #94a3b8; padding: 36px 20px 48px;") !== -1, "original footer padding kept");
assert(css.indexOf("height: 100svh !important;") !== -1, "2180 small-viewport layers kept");
assert(css.indexOf("touch-action: pan-y") !== -1, "2181 swipe kept");

var b2182 = css.slice(css.indexOf("========== amp-build:2182-footer-wallpaper-bleed"));
assert(b2182.indexOf("========== amp-build:2182-footer-wallpaper-bleed") === 0, "2182 block");
assert(b2182.indexOf("clip-path: inset(0 0 calc(100% - 180px) 0);") !== -1, "fade clone clipped to the tuck");
assert(b2182.indexOf("z-index: 1;") !== -1, "footer paints above the fixed wallpaper");
assert(b2182.indexOf("padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));") !== -1, "safe-area stays on the footer");
assert(b2182.indexOf("background-color: #0b1220;") !== -1, "page canvas matches the footer");
assert(b2182.indexOf("body.amp-footer-endcap::after") !== -1, "end cap rule");
assert(b2182.indexOf("overflow: hidden") === -1, "does not trap scroll");
assert(b2182.indexOf("overflow-y: hidden") === -1, "does not trap scroll");

var b2180Start = css.indexOf("========== amp-build:2180-footer-no-overscroll-mobile");
var b2181Start = css.indexOf("========== amp-build:2181-still-there-swipe");
var b2180 = css.slice(b2180Start, b2181Start);
assert(b2180.indexOf("overflow-y: visible") !== -1, "html still scrolls");
assert(b2180.indexOf("height: 100svh !important;") !== -1, "2180 block unchanged");

var home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var hero = home.indexOf('class="v3-hero v3-place-card"');
var bridge = home.indexOf("v3-stay-bridge");
var zach = home.indexOf("amp-zach-scope-strip");
var row2 = home.indexOf("v3-stats-parent");
assert(hero !== -1 && hero < bridge && bridge < zach && zach < row2, "2178 hero-first stack order");

console.log("ok — 2182 footer covers the wallpaper");
