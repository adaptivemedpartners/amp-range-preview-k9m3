/* Node smoke: 2154 hero cleanup + Kansas medical group.
   Run: node js/hero-cleanup-kansas-2154.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkHtml(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2154-hero-cleanup-kansas -->") !== -1, rel + " missing 2154 stamp comment");
  assert(html.indexOf("amp-build 2154-hero-cleanup-kansas") !== -1, rel + " missing 2154 chip");
  assert(html.indexOf('href="css/site.css?v=2154"') !== -1, rel + " css not ?v=2154");
  assert(html.indexOf('src="js/app.js?v=2154"') !== -1, rel + " app.js not ?v=2154");
  assert(html.indexOf('src="js/hero-ret-rotator.js?v=2154"') !== -1, rel + " rotator js missing");
  assert(html.indexOf(">RETENTION-LED<") !== -1, rel + " lost RETENTION-LED eyebrow");
  assert(
    html.indexOf('<h1 class="explore-title">Permanent recruitment measured in years — not placements.</h1>') !== -1,
    rel + " H1 lock overwritten"
  );
  assert(html.indexOf("Your partners in rural healthcare recruiting") !== -1, rel + " missing partners subline");
  assert(html.indexOf("Clear paths for physicians") === -1, rel + " Clear paths leftover still in markup");
  assert(html.indexOf("Choose a path") === -1, rel + " Choose a path leftover still in markup");
  assert(html.indexOf("Choose your path") === -1, rel + " Choose your path leftover still in markup");
  assert(html.indexOf("explore-range-invite") === -1, rel + " explore-range-invite CTA still in markup");
  assert(html.indexOf('data-scroll-to="home-doors"') === -1, rel + " Choose-a-path scroll CTA still in markup");
  assert(html.indexOf("data-hero-ret-rotator") !== -1, rel + " missing hero rotator");
  assert(html.indexOf("Nebraska FQHC") !== -1, rel + " missing 2015 story");
  assert(html.indexOf("Nebraska Critical Access Hospital") !== -1, rel + " missing 2018 story");
  assert(html.indexOf("Kansas medical group") !== -1, rel + " missing Kansas medical group label");
  assert(html.indexOf('hero-ret-mini-role">Physician<') === -1, rel + " Kansas rotator role still says Physician");
  assert(html.indexOf('amp-ret-role">Physician<') === -1, rel + " Kansas card role still says Physician");
  assert(html.indexOf('amp-ret-place">Kansas<') === -1, rel + " leftover Kansas place line");
  assert(html.indexOf("2021 Physician Kansas") === -1, rel + " old Kansas aria label remains");
  assert(html.indexOf("11 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2015 footer");
  assert(html.indexOf("8 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2018 footer");
  assert(html.indexOf("5 YEARS LATER. STILL THERE.") !== -1, rel + " missing 2021 footer");
  assert(html.indexOf('data-go="physician"') !== -1, rel + " physician funnel data-go lost");
  assert(html.indexOf('data-go="client"') !== -1, rel + " client funnel data-go lost");
  assert(html.indexOf('class="home-ret-strip"') !== -1, rel + " homepage retention strip removed");
  assert(html.indexOf("client-step3-ret-strip") !== -1, rel + " client step 3 ret strip removed");
  assert(html.indexOf("Seats that stick — years later") !== -1, rel + " lower strip title rewritten");
  assert(html.indexOf("Are you a provider looking for a job?") !== -1, rel + " provider path card missing");
  assert(html.indexOf("Are you a medical facility looking to hire?") !== -1, rel + " facility path card missing");
  assert(html.indexOf("webflow") === -1 && html.indexOf("Webflow") === -1, rel + " Webflow leaked in");

  var year2015 = html.split("Pediatrician")[0];
  assert(year2015.indexOf(">2015<") !== -1 || html.indexOf("hero-ret-mini-year\">2015") !== -1, rel + " 2015 year lost");
}

checkHtml("index.html");
checkHtml("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2154-hero-cleanup-kansas"') !== -1, "app.js build stamp");
assert(app.indexOf("h1 intentionally omitted") !== -1, "SEO H1 lock comment missing");
assert(app.indexOf("never overwrite homepage explore-title H1") !== -1, "SEO explore-title guard missing");

var rotator = fs.readFileSync(path.join(ROOT, "js/hero-ret-rotator.js"), "utf8");
assert(rotator.indexOf("amp-build:2154-hero-cleanup-kansas") !== -1, "rotator missing 2154 stamp");
assert(rotator.indexOf("3800") !== -1, "rotator interval should be ~3.8s");
assert(rotator.indexOf("prefers-reduced-motion") !== -1, "rotator missing reduced-motion");
assert(rotator.indexOf("mouseenter") !== -1, "rotator missing hover pause");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2154-hero-cleanup-kansas") !== -1, "css missing 2154 stamp");
assert(css.indexOf(".hero-ret-rotator") !== -1, "css missing rotator");
assert(css.indexOf("prefers-reduced-motion: reduce") !== -1, "css missing reduced-motion");
assert(css.indexOf("@media (min-width: 900px)") !== -1, "desktop gutter media query removed");
assert(css.indexOf("width: 220px") !== -1, "desktop 220px gutter width removed");
assert(css.indexOf("@media (max-width: 899px)") !== -1, "mobile banner media query missing");
assert(css.indexOf("display: contents") !== -1, "mobile copy unwrap missing — banner must sit under H1");
assert(css.indexOf("box-shadow: none") !== -1, "mobile banner should drop the card shadow");
assert(css.indexOf("order: 3") !== -1, "rotator order must sit under H1");
assert(css.indexOf("100vw") !== -1, "mobile partners line should stretch full viewport width");
assert(css.indexOf(".explore-range-invite") !== -1 && css.indexOf("display: none !important") !== -1, "range invite should stay hidden");

console.log("hero-cleanup-kansas-2154.test.js: ok");
