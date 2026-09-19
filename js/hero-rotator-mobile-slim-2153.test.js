/* Node smoke: 2153 hero rotator mobile slim banner under H1.
   Run: node js/hero-rotator-mobile-slim-2153.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkHtml(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2153-hero-rotator-mobile-slim -->") !== -1, rel + " missing 2153 stamp comment");
  assert(html.indexOf("amp-build 2153-hero-rotator-mobile-slim") !== -1, rel + " missing 2153 chip");
  assert(html.indexOf('href="css/site.css?v=2153"') !== -1, rel + " css not ?v=2153");
  assert(html.indexOf('src="js/app.js?v=2153"') !== -1, rel + " app.js not ?v=2153");
  assert(html.indexOf('src="js/hero-ret-rotator.js?v=2153"') !== -1, rel + " rotator js missing");
  assert(html.indexOf(">RETENTION-LED<") !== -1, rel + " lost RETENTION-LED eyebrow");
  assert(
    html.indexOf('<h1 class="explore-title">Permanent recruitment measured in years — not placements.</h1>') !== -1,
    rel + " H1 lock overwritten"
  );
  assert(html.indexOf("data-hero-ret-rotator") !== -1, rel + " missing hero rotator");
  assert(html.indexOf("Nebraska FQHC") !== -1, rel + " missing 2015 story");
  assert(html.indexOf("Nebraska Critical Access Hospital") !== -1, rel + " missing 2018 story");
  assert(html.indexOf("11 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2015 footer");
  assert(html.indexOf("8 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2018 footer");
  assert(html.indexOf("5 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2021 footer");
  assert(html.indexOf('data-go="physician"') !== -1, rel + " physician funnel data-go lost");
  assert(html.indexOf('data-go="client"') !== -1, rel + " client funnel data-go lost");
  assert(html.indexOf('class="home-ret-strip"') !== -1, rel + " homepage retention strip removed");
  assert(html.indexOf("Seats that stick — years later") !== -1, rel + " lower strip title rewritten");
  assert(html.indexOf("webflow") === -1 && html.indexOf("Webflow") === -1, rel + " Webflow leaked in");
}

checkHtml("index.html");
checkHtml("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2153-hero-rotator-mobile-slim"') !== -1, "app.js build stamp");
assert(app.indexOf("h1 intentionally omitted") !== -1, "SEO H1 lock comment missing");
assert(app.indexOf("never overwrite homepage explore-title H1") !== -1, "SEO explore-title guard missing");

var rotator = fs.readFileSync(path.join(ROOT, "js/hero-ret-rotator.js"), "utf8");
assert(rotator.indexOf("amp-build:2153-hero-rotator-mobile-slim") !== -1, "rotator missing 2153 stamp");
assert(rotator.indexOf("3800") !== -1, "rotator interval should be ~3.8s");
assert(rotator.indexOf("prefers-reduced-motion") !== -1, "rotator missing reduced-motion");
assert(rotator.indexOf("mouseenter") !== -1, "rotator missing hover pause");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2153-hero-rotator-mobile-slim") !== -1, "css missing 2153 stamp");
assert(css.indexOf(".hero-ret-rotator") !== -1, "css missing rotator");
assert(css.indexOf("prefers-reduced-motion: reduce") !== -1, "css missing reduced-motion");
assert(css.indexOf("@media (min-width: 900px)") !== -1, "desktop gutter media query removed");
assert(css.indexOf("width: 220px") !== -1, "desktop 220px gutter width removed");
assert(css.indexOf("@media (max-width: 899px)") !== -1, "mobile banner media query missing");
assert(css.indexOf("display: contents") !== -1, "mobile copy unwrap missing — banner must sit under H1");
assert(css.indexOf("box-shadow: none") !== -1, "mobile banner should drop the card shadow");
assert(css.indexOf("order: 3") !== -1, "rotator order must sit under H1");
assert(css.indexOf("@media (min-width: 640px) and (max-width: 899px)") === -1, "discarded large-phone inline gutter leaked back in");

console.log("hero-rotator-mobile-slim-2153.test.js: ok");
