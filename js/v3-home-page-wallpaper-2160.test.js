/* Node smoke: 2160 continuous page wallpaper + door desk placement.
   Run: node js/v3-home-page-wallpaper-2160.test.js */
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
  assert(html.indexOf("<!-- amp-build:2160-v3-home-page-wallpaper -->") !== -1, rel + " missing 2160 stamp");
  assert(html.indexOf('href="css/site.css?v=2160"') !== -1, rel + " css cache bust");
  assert(html.indexOf('src="js/app.js?v=2160"') !== -1, rel + " app cache bust");
  assert(html.indexOf('src="assets/amp-lockup-nav.png?v=2160"') !== -1, rel + " lockup asset");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
  assert(home.indexOf("We place physicians who stay.") !== -1, rel + " hero headline");
  assert(home.indexOf("v3-hero-title-shimmer") !== -1, rel + " hero shimmer class");
  assert(home.indexOf("RETENTION-LED RECRUITING") !== -1, rel + " eyebrow");
  assert(home.indexOf('class="explore-title v3-door-title">Find your next chapter') !== -1, rel + " physician door shimmer");
  assert(home.indexOf('class="explore-title v3-door-title">Fill seats that stick') !== -1, rel + " hiring door shimmer");
  assert(home.indexOf("I'm a physician →") !== -1, rel + " physician CTA");
  assert(home.indexOf("I'm hiring →") !== -1, rel + " hiring CTA");
  // Wallpaper is page-level via CSS/.home-pro-bg — hero band must NOT carry its own photo
  assert(/class="v3-hero"[^>]*style\s*=\s*"[^"]*background-image/i.test(home) === false, rel + " discrete hero band bg must be gone");
  assert(home.indexOf("home-pro-bg") !== -1, rel + " fixed wallpaper layer element");
  assert(/\bmountain\b/i.test(home) === false, rel + " mountain language on homepage");
}

function checkCss() {
  var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
  assert(css.indexOf("amp-build:2160-v3-home-page-wallpaper") !== -1, "css missing 2160 wallpaper block");
  assert(css.indexOf('url("../assets/home-hero-clinic-consult.jpg?v=2160")') !== -1, "css missing clinic wallpaper asset");
  assert(css.indexOf(".home-stage.v3-home .home-pro-bg") !== -1, "css missing home-pro-bg wallpaper");
  assert(css.indexOf("position: fixed") !== -1, "css missing fixed wallpaper approach");
  assert(css.indexOf("background-image: none !important") !== -1, "css must clear hero band bg");
  assert(css.indexOf("max-width: 1320px") !== -1, "css missing wider doors");
  assert(css.indexOf("align-self: flex-end") !== -1, "css missing right-biased doors");
  assert(css.indexOf("exploreDoorShimmer") !== -1, "css missing shimmer keyframes");
}

function checkApp() {
  var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
  assert(app.indexOf('__AMP_BUILD = "2160-v3-home-page-wallpaper"') !== -1, "app build stamp");
}

checkHtml("index.html");
checkHtml("404.html");
checkCss();
checkApp();
console.log("ok — 2160 continuous page wallpaper + wider right-biased doors under desk");
