/* Node smoke: 2178 place hero leads. Stay bridge and Zach strip sit tight under it.
   Title-below-fade padding is back on the place hero. Row2 raise from 2177 stays.
   Run: node js/v3-hero-first-stack-2178.test.js */
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
  assert(html.indexOf("<!-- amp-build:2178-hero-first-stack -->") !== -1, rel + " missing 2178 stamp");
  assert(html.indexOf("<!-- amp-build:2177-zach-scope-strip -->") !== -1, rel + " lost 2177 stamp");
  assert(html.indexOf("<!-- amp-build:2176-specialty-still-there-examples -->") !== -1, rel + " lost 2176 stamp");
  assert(html.indexOf("amp-build 2179-footer-no-overscroll") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2179"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/app.js?v=2179"') !== -1, rel + " app cache");
  assert(html.indexOf("?v=2177") === -1, rel + " still on 2177 cache");
  assert(html.indexOf("?v=2176") === -1, rel + " still on 2176 cache");
  assert(html.indexOf('href="/physician" data-go="physician">Physicians</a>') !== -1, rel + " nav physicians link");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', rel + " homepage");
  var hero = home.indexOf('class="v3-hero v3-place-card"');
  var eyebrow = home.indexOf("RETENTION-LED RECRUITING");
  var place = home.indexOf("We place physicians who stay.");
  var sub = home.indexOf("Adaptive Medical Partners — rural and community healthcare recruiting measured in years, not placements.");
  var rotator = home.indexOf("data-hero-ret-rotator");
  var finding = home.indexOf("Finding someone is one thing.");
  var mint = home.indexOf("Finding someone who stays is another.");
  var bridge = home.indexOf('class="v3-stay-bridge"');
  var steps = home.indexOf('class="v3-bridge-steps"');
  var stripAt = home.indexOf('class="v3-zach-scope amp-zach-scope-strip"');
  var row = home.indexOf('class="v3-stats-parent"');
  assert([hero, eyebrow, place, sub, rotator, finding, mint, bridge, steps, stripAt, row].every(function (n) { return n !== -1; }), rel + " stack markers");
  assert(hero < bridge && bridge < steps && steps < stripAt && stripAt < row, rel + " hero, stay bridge, Zach strip, then row2");
  assert(hero < eyebrow && eyebrow < place && place < rotator && rotator < finding, rel + " hero copy before the stay line");
  assert(home.indexOf(">01<") !== -1 && home.indexOf(">UNDERSTAND<") !== -1, rel + " step 01");
  assert(home.indexOf(">02<") !== -1 && home.indexOf(">FIND<") !== -1, rel + " step 02");
  assert(home.indexOf(">03<") !== -1 && home.indexOf(">MATCH<") !== -1, rel + " step 03");

  var stripEnd = home.indexOf("</p>", stripAt);
  var strip = home.slice(stripAt, stripEnd);
  assert(strip.indexOf('aria-label="Who we place: Physicians, APPs, Dental, Behavioral Health, Allied Health, Nationwide"') !== -1, rel + " who we place label");
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
  assert(card.indexOf(">Physicians<") === -1, rel + " old physicians tag");
  assert(home.indexOf("I'm hiring →") !== -1, rel + " hiring CTA");
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(css.indexOf("amp-build:2178-hero-first-stack") !== -1, "css 2178 stamp");
assert(css.indexOf("amp-build:2177-zach-scope-strip") !== -1, "css 2177 stamp");
assert(app.indexOf('__AMP_BUILD = "2179-footer-no-overscroll"') !== -1, "app build stamp");
assert(css.indexOf(".home-layer-soft-fade") !== -1, "under-header fade remains");
assert(css.indexOf("transparent 148px") !== -1, "desktop fade falloff unchanged");
assert(css.indexOf("z-index: 280") !== -1, "fade layer lock");

var b2177 = css.slice(css.indexOf("========== amp-build:2177-zach-scope-strip"), css.indexOf("========== amp-build:2178-hero-first-stack"));
assert(b2177.indexOf("translateY(-4px)") !== -1, "MI lift kept in 2177");
assert(b2177.indexOf("translateY(-8px)") !== -1, "entry card lift kept in 2177");
assert(b2177.indexOf("0 10px 24px rgba(12, 21, 32, 0.22)") !== -1, "MI shadow kept");
assert(b2177.indexOf("1px solid rgba(30, 58, 85, 0.35)") !== -1, "entry hairline kept");

var b2178Start = css.indexOf("========== amp-build:2178-hero-first-stack");
var b2179Start = css.indexOf("========== amp-build:2179-footer-no-overscroll");
var b2178 = css.slice(b2178Start, b2179Start === -1 ? undefined : b2179Start);
assert(b2178.indexOf("========== amp-build:2178-hero-first-stack") === 0, "2178 block");
assert(b2178.indexOf("opacity: 1") !== -1, "place hero stays opaque");
assert(b2178.indexOf("padding-top: calc(var(--amp-title-clear) - 68px)") !== -1, "desktop title-below-fade pad on the hero");
assert(b2178.indexOf("padding-top: max(72px, calc(var(--amp-title-clear) - 82px))") !== -1, "mobile title-below-fade pad on the hero");
assert(b2178.indexOf("padding-top: 6px") === -1, "2177 hero demotion must not return");
assert(b2178.indexOf("margin-top: calc(var(--amp-title-clear) - 68px)") === -1, "fade clearance must not sit on the stay bridge");
assert(b2178.indexOf("margin-top: 0") !== -1, "stay bridge pulled up under the hero");
assert(b2178.indexOf("margin-top: 6px") !== -1, "Zach strip tight under the stay bridge");

require("./v3-zach-scope-2177.test.js");

console.log("ok — 2178 hero first, stay bridge and Zach strip tight underneath");
