/* Node smoke: 2177 Zach scope strip, provider card copy, raised row2.
   2178 puts the place hero first; this file still locks the strip copy.
   Run: node js/v3-zach-scope-2177.test.js */
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

var LABELS = ["Physicians", "APPs", "Dental", "Behavioral Health", "Allied Health", "Nationwide"];

function checkPage(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2177-zach-scope-strip -->") !== -1, rel + " missing 2177 stamp");
  assert(html.indexOf("<!-- amp-build:2176-specialty-still-there-examples -->") !== -1, rel + " lost 2176 stamp");
  assert(html.indexOf("<!-- amp-build:2175-ok-tn-pca-partners -->") !== -1, rel + " lost 2175 stamp");
  assert(html.indexOf("<!-- amp-build:2174-facility-still-there-examples -->") !== -1, rel + " lost 2174 stamp");
  assert(html.indexOf("amp-build 2184-specialty-under-sub-sky-bridge-restore") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2184"') !== -1, rel + " css cache");
  assert(html.indexOf("?v=2176") === -1, rel + " still on 2176 cache");
  assert(html.indexOf("?v=2175") === -1, rel + " still on 2175 cache");
  assert(html.indexOf(">Physicians<") !== -1, rel + " site nav Physicians removed");
  assert(html.indexOf('href="/physician" data-go="physician">Physicians</a>') !== -1, rel + " nav physicians link");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', rel + " homepage");
  var finding = home.indexOf("Finding someone is one thing.");
  var stripAt = home.indexOf('class="v3-zach-scope amp-zach-scope-strip"');
  var hero = home.indexOf("We place physicians who stay.");
  var steps = home.indexOf('class="v3-bridge-steps"');
  var row = home.indexOf('class="v3-stats-parent"');
  assert(finding !== -1 && stripAt !== -1 && hero !== -1, rel + " stack markers");
  assert(hero < stripAt && stripAt < finding && finding < steps && steps < row, rel + " specialty strip under the hero, then the stay line and steps, then row2");
  assert(steps !== -1 && stripAt < steps && steps < row, rel + " steps stay after the specialty strip");
  assert(home.indexOf("Finding someone who stays is another.") !== -1, rel + " mint stay line");
  assert(home.indexOf(">01<") !== -1 && home.indexOf(">UNDERSTAND<") !== -1, rel + " step 01");
  assert(home.indexOf(">02<") !== -1 && home.indexOf(">FIND<") !== -1, rel + " step 02");
  assert(home.indexOf(">03<") !== -1 && home.indexOf(">MATCH<") !== -1, rel + " step 03");

  var stripEnd = home.indexOf("</p>", stripAt);
  var strip = home.slice(stripAt, stripEnd);
  assert(strip.indexOf('aria-label="Who we place: Physicians, APPs, Dental, Behavioral Health, Allied Health, Nationwide"') !== -1, rel + " strip label");
  var cursor = 0;
  LABELS.forEach(function (label) {
    var at = strip.indexOf(label, cursor);
    assert(at !== -1, rel + " strip missing " + label);
    cursor = at + label.length;
  });
  assert(strip.indexOf("<a ") === -1, rel + " strip must stay non-clickable");

  var card = sliceBetween(home, 'class="v3-photo-door" href="/physician"', "v3-stats-col-hiring", rel + " provider card");
  assert(card.indexOf(">Providers<") !== -1, rel + " provider tag");
  assert(card.indexOf("I'm a provider →") !== -1, rel + " provider CTA");
  assert(card.indexOf("Find your next chapter") !== -1, rel + " chapter headline");
  assert(card.indexOf('href="/physician"') !== -1, rel + " physician route");
  assert(card.indexOf(">Physicians<") === -1, rel + " old physicians tag");
  assert(card.indexOf("I'm a physician") === -1, rel + " old physician CTA");
  assert(home.indexOf("I'm hiring →") !== -1, rel + " hiring CTA");
  assert(home.indexOf("Fill seats that stick") !== -1, rel + " hiring headline");
  assert(home.indexOf("Oklahoma Primary Care Association") !== -1, rel + " OKPCA");
  assert(home.indexOf("Tennessee Primary Care Association") !== -1, rel + " TPCA");
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(css.indexOf("amp-build:2177-zach-scope-strip") !== -1, "css 2177 stamp");
assert(css.indexOf("amp-build:2176-specialty-still-there-examples") !== -1, "css 2176 stamp");
assert(css.indexOf("amp-build:2175-ok-tn-pca-partners") !== -1, "css 2175 stamp");
assert(css.indexOf("amp-build:2174-facility-still-there-examples") !== -1, "css 2174 stamp");
assert(app.indexOf('__AMP_BUILD = "2184-specialty-under-sub-sky-bridge-restore"') !== -1, "app build stamp");
assert(app.indexOf("amp-build:2174 — real still-there") !== -1, "2174 facility comment");
assert(css.indexOf(".home-layer-soft-fade") !== -1, "under-header fade remains");
assert(css.indexOf("transparent 148px") !== -1, "desktop fade falloff unchanged");

var b2177 = css.slice(css.indexOf("========== amp-build:2177-zach-scope-strip"));
assert(b2177.indexOf("========== amp-build:2177-zach-scope-strip") === 0, "2177 block");
assert(b2177.indexOf("opacity: 1") !== -1, "place card stays opaque");
assert(b2177.indexOf("padding-top: 6px") !== -1, "hero pulled up");
assert(b2177.indexOf("translateY(-4px)") !== -1, "MI lift");
assert(b2177.indexOf("translateY(-8px)") !== -1, "entry card lift");
assert(b2177.indexOf("translateY(-6px)") !== -1, "MI hover lift");
assert(b2177.indexOf("translateY(-10px)") !== -1, "entry hover lift");
assert(b2177.indexOf("0 10px 24px rgba(12, 21, 32, 0.22)") !== -1, "MI shadow");
assert(b2177.indexOf("0 12px 26px rgba(12, 21, 32, 0.2)") !== -1, "entry shadow");
assert(b2177.indexOf("1px solid rgba(198, 224, 240, 0.55)") !== -1, "MI hairline");
assert(b2177.indexOf("1px solid rgba(30, 58, 85, 0.35)") !== -1, "entry hairline");
assert(b2177.indexOf("flex-wrap: wrap") !== -1, "strip wraps");

require("./v3-partners-ok-tn-2175.test.js");
require("./v3-specialty-still-there-2176.test.js");

console.log("ok — 2177 zach scope strip, provider card, raised row2");
