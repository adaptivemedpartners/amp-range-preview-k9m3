/* Node smoke: 2179 document scroll ends at the footer.
   Run: node js/v3-footer-no-overscroll-2179.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkPage(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2179-footer-no-overscroll -->") !== -1, rel + " missing 2179 stamp");
  assert(html.indexOf("<!-- amp-build:2178-hero-first-stack -->") !== -1, rel + " lost 2178 stamp");
  assert(html.indexOf("amp-build 2182-footer-wallpaper-bleed") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2182"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/app.js?v=2182"') !== -1, rel + " app cache");
  assert(html.indexOf("?v=2178") === -1, rel + " still on 2178 cache");
  var fade = html.indexOf('class="home-layer-soft-fade"');
  var footer = html.indexOf('class="site-footer"');
  var fade2 = html.indexOf('class="home-layer-soft-fade"', fade + 1);
  assert(fade !== -1 && footer !== -1 && fade < footer, rel + " fade must sit before the footer");
  assert(fade2 === -1, rel + " fade duplicated");
  assert(html.indexOf("padding-bottom: 100vh") === -1, rel + " no chat runway padding");
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('__AMP_BUILD = "2182-footer-wallpaper-bleed"') !== -1, "app build stamp");
assert(css.indexOf(".site-footer {\n  background: #0b1220; color: #94a3b8; padding: 36px 20px 48px;") !== -1, "footer padding kept");
assert(css.indexOf(".home-layer-soft-fade") !== -1, "under-header fade remains");
assert(css.indexOf("position: fixed") !== -1, "fixed layers remain");

var b2179Start = css.indexOf("========== amp-build:2179-footer-no-overscroll");
var b2180Start = css.indexOf("========== amp-build:2180-footer-no-overscroll-mobile");
var b2179 = css.slice(b2179Start, b2180Start === -1 ? undefined : b2180Start);
assert(b2179.indexOf("========== amp-build:2179-footer-no-overscroll") === 0, "2179 block");
assert(b2179.indexOf("overflow-x: clip") !== -1, "clip instead of a hidden scrollport");
assert(b2179.indexOf("overscroll-behavior-y: none") !== -1, "no rubber-band past the footer");
assert(b2179.indexOf(".view:not(.on):not(.walk-forward)") !== -1, "inactive views drop 100dvh min-height");
assert(b2179.indexOf(".view.on,\n.view.walk-forward {\n  min-height: 100dvh;") !== -1, "active view still fills the viewport");
assert(b2179.indexOf("overflow-y: visible") !== -1, "home stage is not a second scrollport");
assert(b2179.indexOf("bottom: auto") !== -1, "viewport layers anchor to the top");
assert(b2179.indexOf("height: 100dvh;\n  max-height: 100dvh;") !== -1, "fade cannot grow with the document");
assert(b2179.indexOf(".amp-chat-root {\n  position: fixed;") !== -1, "chat root leaves normal flow");
assert(b2179.indexOf("width: 0;\n  height: 0;") !== -1, "chat root is a zero box");
assert(b2179.indexOf("padding-bottom:") === -1, "2179 must not pad the body under the chat");
assert(css.indexOf(".home-stage.v3-home .home-pro-bg") !== -1, "L1 wallpaper rule remains");
assert(css.indexOf(".site-nav.is-home") !== -1, "L3 header lock remains");

var home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var hero = home.indexOf('class="v3-hero v3-place-card"');
var bridge = home.indexOf("v3-stay-bridge");
var zach = home.indexOf("amp-zach-scope-strip");
var row2 = home.indexOf("v3-stats-parent");
assert(hero !== -1 && hero < bridge && bridge < zach && zach < row2, "2178 hero-first stack order");

console.log("ok — 2179 footer ends the document");
