/* Node smoke: 2159 full-bleed hero + door shimmer + standard lockup.
   Run: node js/v3-home-fullbleed-2159.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function sliceBetween(html, startNeedle, endNeedle, label) {
  var start = html.indexOf(startNeedle);
  var end = html.indexOf(endNeedle, start + startNeedle.length);
  assert(start !== -1 && end !== -1 && end > start, "could not isolate " + label);
  return html.slice(start, end);
}

function checkHtml(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2159-v3-home-fullbleed-shimmer -->") !== -1, rel + " missing 2159 stamp");
  assert(html.indexOf('href="css/site.css?v=2159"') !== -1, rel + " css cache bust");
  assert(html.indexOf('src="js/app.js?v=2159"') !== -1, rel + " app cache bust");
  assert(html.indexOf('src="assets/amp-lockup-nav.png?v=2159"') !== -1, rel + " lockup asset");
  assert(html.indexOf("Adaptive Medical Partners</span>") === -1 || html.indexOf('brand-lockup-img') !== -1, rel + " should use lockup img");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
  assert(home.indexOf("We place physicians who stay.") !== -1, rel + " hero headline");
  assert(home.indexOf("v3-hero-title-shimmer") !== -1, rel + " hero shimmer class");
  assert(home.indexOf("RETENTION-LED RECRUITING") !== -1, rel + " eyebrow");
  assert(home.indexOf('class="explore-title v3-door-title">Find your next chapter') !== -1, rel + " physician door shimmer");
  assert(home.indexOf('class="explore-title v3-door-title">Fill seats that stick') !== -1, rel + " hiring door shimmer");
  assert(home.indexOf("I'm a physician →") !== -1, rel + " physician CTA");
  assert(home.indexOf("I'm hiring →") !== -1, rel + " hiring CTA");
  assert(home.indexOf("home-hero-clinic-consult.jpg") !== -1, rel + " clinic hero");
  // No mountain theme language on homepage hero
  assert(/\bmountain\b/i.test(home) === false, rel + " mountain language on homepage");
}

function checkCss() {
  var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
  assert(css.indexOf("amp-build:2159-v3-home-fullbleed") !== -1, "css missing 2159 fullbleed block");
  assert(css.indexOf("exploreDoorShimmer") !== -1, "css missing shimmer keyframes");
  assert(css.indexOf(".v3-door-body h2.explore-title.v3-door-title") !== -1, "css missing door title shimmer");
  assert(css.indexOf("prefers-reduced-motion: reduce") !== -1, "css missing reduced motion");
}

function checkApp() {
  var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
  assert(app.indexOf('__AMP_BUILD = "2159-v3-home-fullbleed-shimmer"') !== -1, "app build stamp");
}

checkHtml("index.html");
checkHtml("404.html");
checkCss();
checkApp();
console.log("ok — 2159 full-bleed hero + door shimmer + lockup");
