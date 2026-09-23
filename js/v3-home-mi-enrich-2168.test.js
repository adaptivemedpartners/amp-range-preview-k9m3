/* Node smoke: 2168 MI colorway C + photo doors + thin pills + title clearance.
   Run: node js/v3-home-mi-enrich-2168.test.js */
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

var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");

assert(html.indexOf("<!-- amp-build:2168-mi-photo-title-clear -->") !== -1, "html stamp");
assert(html.indexOf('href="css/site.css?v=2168"') !== -1, "css cache bust");
assert(html.indexOf('src="js/app.js?v=2168"') !== -1, "app cache bust");
assert(html.indexOf("amp-build 2168-mi-photo-title-clear") !== -1, "chip");
assert(app.indexOf('__AMP_BUILD = "2168-mi-photo-title-clear"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:2168-mi-photo-title-clear") !== -1, "css stamp");
assert(css.indexOf("?v=2167") === -1, "css still on 2167 cache");
assert(html.indexOf("?v=2167") === -1, "html still on 2167 cache");

var row = sliceBetween(html, 'class="v3-stats-parent"', 'class="home-partners', "row2");
assert(row.indexOf("mi-enrich cw-c") !== -1, "colorway C class");
assert(row.indexOf(">Market Intelligence<") !== -1, "MI kicker");
assert(row.indexOf("See demand signals before you post a seat") !== -1, "MI title");
assert(row.indexOf("Explore MI →") !== -1, "MI cta");
assert(row.indexOf('href="/market-intelligence"') !== -1, "MI href");
assert(row.indexOf("Place draw") !== -1 && row.indexOf("Specialty supply") !== -1, "aspect chips");
assert(row.indexOf("EXAMPLE") !== -1, "EXAMPLE stamp");
assert(row.indexOf("EXAMPLE · TX × Family Medicine") !== -1, "example line");
assert(row.indexOf(">Competitive<") !== -1, "competitive pill");
assert(row.indexOf("#5eb8e0") !== -1, "electric sky in radar/heat");

assert(row.indexOf('href="/physician"') !== -1, "physician href");
assert(row.indexOf('href="/client"') !== -1, "hiring href");
assert(row.indexOf("amp-path-cand-nurses.jpg?v=2168") !== -1, "physician photo");
assert(row.indexOf("amp-path-client-hallway.jpg?v=2168") !== -1, "hiring photo");
assert(row.indexOf(">Physicians<") !== -1, "physicians badge");
assert(row.indexOf(">Hiring Orgs<") !== -1, "hiring badge");
assert(row.indexOf("Find your next chapter") !== -1, "physician title");
assert(row.indexOf("Confidential career options for physicians exploring rural and community practice.") !== -1, "physician sub");
assert(row.indexOf("I'm a physician →") !== -1, "physician cta");
assert(row.indexOf("Fill seats that stick") !== -1, "hiring title");
assert(row.indexOf("I'm hiring →") !== -1, "hiring cta");
assert(row.indexOf("v3-proof-thin") !== -1, "thin pills");
assert(row.indexOf("<strong>87%</strong>") !== -1, "87 pill");
assert(row.indexOf("<strong>1.7</strong>") !== -1, "1.7 pill");
assert(row.indexOf("<strong>700+</strong>") !== -1, "700 pill");
assert(row.indexOf("years since 2010") !== -1, "16 years label");
assert(row.indexOf("v3-proof-stack") === -1, "tall stacked pills must be gone");

assert(css.indexOf("linear-gradient(165deg, #0c1520 0%, #152332 55%, #1a2c3f 100%)") !== -1, "deeper navy");
assert(css.indexOf("--amp-title-clear") !== -1, "shared title clearance");
assert(css.indexOf("padding-top: var(--amp-title-clear) !important") !== -1, "hero-band clearance");
assert(css.indexOf('data-route="blog-post"') !== -1, "blog article clearance");
assert(css.indexOf("flex-direction: row !important") !== -1, "thin pill row");

/* Fade mask itself stays the 2167 tuck */
assert(css.indexOf("z-index: 280") !== -1, "fade z-index");
assert(css.indexOf("transparent 148px") !== -1, "desktop fade falloff");
assert(css.indexOf("transparent 132px") !== -1, "mobile fade falloff");
assert(css.indexOf(".home-layer-soft-fade") !== -1, "fade element rule");

var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
assert(home.indexOf("RETENTION-LED RECRUITING") !== -1, "eyebrow remains");
assert(home.indexOf("We place physicians who stay.") !== -1, "headline remains");
assert(home.indexOf("11 YEARS LATER. STILL THERE.") !== -1, "2015 story remains");

console.log("ok — 2168 MI colorway C, photo doors, thin pills, title clearance");
