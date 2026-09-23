/* Node smoke: 2170 place-who-stay hero, inward rotator, compact bridge steps, Row2 locks,
   facility select stays on step 2, specialty cards are not collapsed.
   Run: node js/v3-home-place-stay-2170.test.js */
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
var rot = fs.readFileSync(path.join(ROOT, "js/hero-ret-rotator.js"), "utf8");
var content = fs.readFileSync(path.join(ROOT, "js/content.js"), "utf8");

assert(html.indexOf("<!-- amp-build:2170-place-stay-bridge-steps -->") !== -1, "html stamp");
assert(html.indexOf('href="css/site.css?v=2170b"') !== -1, "css cache bust");
assert(html.indexOf('src="js/app.js?v=2170b"') !== -1, "app cache bust");
assert(html.indexOf('src="js/hero-ret-rotator.js?v=2170b"') !== -1, "rotator cache bust");
assert(html.indexOf("amp-build 2170-place-stay-bridge-steps") !== -1, "chip");
assert(app.indexOf('__AMP_BUILD = "2170-place-stay-bridge-steps"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:2170-place-stay-bridge-steps") !== -1, "css stamp");
assert(html.indexOf("?v=2169") === -1, "html still on 2169 cache");
assert(html.indexOf("?v=2170\"") === -1 && html.indexOf("?v=2170'") === -1, "html assets still on unbusted 2170");
assert(rot.indexOf("INTERVAL_MS = 3800") !== -1, "fade interval ~3.8s");
assert(rot.indexOf("mouseenter") !== -1 && rot.indexOf("paused = true") !== -1, "pause on hover");

var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
assert(home.indexOf("We place physicians who stay.") !== -1, "place-who-stay headline");
assert(home.indexOf("v3-hero-title-shimmer") !== -1, "2168 shimmer headline");
assert(home.indexOf("v3-years-title") === -1, "oversized years headline class gone");
assert(home.indexOf("Permanent recruitment") === -1, "years line 1 gone from homepage");
assert(home.indexOf("should be measured") === -1, "years line 2 gone from homepage");
assert(home.indexOf("Not placements.") === -1, "years mint line gone from homepage");
assert(home.indexOf("Adaptive Medical Partners — rural and community healthcare recruiting measured in years, not placements.") !== -1, "classic v3-sub");
assert(home.indexOf('class="v3-sub"') !== -1, "v3-sub element");
assert(home.indexOf("v3-hero-split") !== -1, "phrase/card split");
assert(home.indexOf("data-hero-ret-rotator") !== -1, "rotator mount");
assert(home.indexOf("data-still-there-mount") !== -1, "swap mount");
assert(home.indexOf("id=\"amp-still-there-examples\"") !== -1, "example array");

var jsonStart = home.indexOf("id=\"amp-still-there-examples\">");
var jsonEnd = home.indexOf("</script>", jsonStart);
assert(jsonStart !== -1 && jsonEnd !== -1, "examples json");
var examples = JSON.parse(home.slice(home.indexOf("[", jsonStart), jsonEnd));
assert(examples.length === 10, "10 approved rotator cards");
examples.forEach(function (item, i) {
  assert(!item.photo, "card " + (i + 1) + " must not invent a portrait");
  assert(!item.name && !item.candidate, "card " + (i + 1) + " must not carry a name");
});
assert(home.indexOf("Susan B. Allen Memorial Hospital") !== -1, "scrubbed facility card kept");
assert(home.indexOf("scrub 2026-09-23") !== -1, "scrub note on the swap list");

var bridgeAt = home.indexOf('class="v3-stay-bridge"');
var rowAt = home.indexOf('class="v3-stats-parent"');
var heroAt = home.indexOf("v3-hero-split");
var stepsAt = home.indexOf('class="v3-bridge-steps"');
assert(heroAt !== -1 && bridgeAt !== -1 && stepsAt !== -1 && rowAt !== -1, "stack markers");
assert(heroAt < bridgeAt && bridgeAt < stepsAt && stepsAt < rowAt, "hero, bridge+steps, then row2");
assert(home.indexOf("Finding someone is one thing.") !== -1, "bridge line 1");
assert(home.indexOf("Finding someone who stays is another.") !== -1, "bridge line 2");
assert(home.indexOf(">UNDERSTAND<") !== -1, "01 understand step");
assert(home.indexOf(">FIND<") !== -1, "02 find step");
assert(home.indexOf(">MATCH<") !== -1, "03 match step");
assert(home.indexOf(">01<") !== -1 && home.indexOf(">02<") !== -1 && home.indexOf(">03<") !== -1, "numbered steps");

var row = sliceBetween(html, 'class="v3-stats-parent"', 'class="home-partners', "row2");
assert(row.indexOf("mi-enrich cw-c") !== -1, "colorway C class");
assert(row.indexOf('href="/market-intelligence"') !== -1, "MI href");
assert(row.indexOf("amp-path-cand-nurses.jpg?v=2170b") !== -1, "physician photo");
assert(row.indexOf("amp-path-client-hallway.jpg?v=2170b") !== -1, "hiring photo");
assert(row.indexOf("v3-proof-thin") !== -1, "thin pills");
assert(row.indexOf("<strong>87%</strong>") !== -1, "87 pill");
assert(row.indexOf("<strong>1.7</strong>") !== -1, "1.7 pill");
assert(row.indexOf("<strong>700+</strong>") !== -1, "700 pill");
assert(row.indexOf("years since 2010") !== -1, "16 years label");
assert(row.indexOf("v3-proof-stack") === -1, "tall stacked pills must stay gone");
assert(row.indexOf("v3-photo-door") !== -1, "photo doors stay inside the parent");

assert(css.indexOf("--amp-title-clear") !== -1, "shared title clearance");
assert(css.indexOf("z-index: 280") !== -1, "fade z-index");
assert(css.indexOf("transparent 148px") !== -1, "desktop fade falloff");
assert(css.indexOf("transparent 132px") !== -1, "mobile fade falloff");
assert(css.indexOf(".home-layer-soft-fade") !== -1, "fade element rule");
assert(css.indexOf("flex-direction: row !important") !== -1, "thin pill row");
assert(css.indexOf("#35373b") !== -1, "charcoal still-there card");
assert(css.indexOf("clamp(1.7rem, 4.2vw, 2.35rem)") !== -1, "2168 headline scale");
assert(css.indexOf("max-width: 1040px") !== -1, "rotator pulled into a content band");
assert(css.indexOf(".v3-bridge-steps") !== -1, "bridge step rules");
assert(css.indexOf("font-size: clamp(1.15rem, 1.7vw, 1.45rem)") !== -1, "smaller bridge title");
assert(css.indexOf('url("../assets/home-hero-clinic-consult.jpg?v=2170")') !== -1, "wallpaper cache");

var sheetFix = css.slice(css.indexOf("amp-build:2170 — sheet scrolls"));
assert(sheetFix.indexOf("amp-build:2170 — sheet scrolls") === 0, "sheet fix present");
assert(sheetFix.indexOf("min-height: 0") === -1, "card list must not flex-collapse to 0");
assert(sheetFix.indexOf("flex: 1 1 auto") === -1, "card list must not flex-grow against the stay story");
assert(sheetFix.indexOf("flex-shrink: 0") === -1, "siblings must not lock the story at full height");
assert(sheetFix.indexOf("overflow-y: auto") !== -1, "sheet scrolls");
assert(sheetFix.indexOf("min-height: 180px") !== -1, "card list keeps a visible row");
assert(sheetFix.indexOf("flex: none") !== -1, "card list stays in normal flow");
assert(css.indexOf("max-height: 110px") !== -1, "specialty stay story is capped");
assert(css.indexOf("#client-spec-continue") !== -1, "specialty continue stays addressable");
assert(css.indexOf("#client-facility-continue") !== -1, "facility continue stays addressable");
assert(sheetFix.indexOf("position: sticky") !== -1, "continue wrap stays on screen");

var facHandler = app.slice(app.indexOf('var fac = raw.closest("[data-facility]")'), app.indexOf('var cs = raw.closest("[data-client-spec]")'));
assert(facHandler.indexOf("paintClientFacilityCtx()") !== -1, "facility context still paints");
assert(facHandler.indexOf('go("client-specialty"') === -1, "facility click must not advance");
assert(app.indexOf("function bindClientFacilityContinue") !== -1, "continue binder remains");
var contFn = app.slice(app.indexOf("function bindClientFacilityContinue"), app.indexOf("function renderFacilitySignpost"));
assert(contFn.indexOf('go("client-specialty", { trail: true })') !== -1, "continue click still opens specialty");
assert(content.indexOf('facilitySpecialtyRanks') !== -1, "specialty ranks exist");
assert(content.indexOf('"fqhc"') !== -1 && content.indexOf("Family Medicine") !== -1, "FQHC specialties exist");
assert(app.indexOf("function renderClientSpecialty") !== -1, "specialty renderer remains");
assert(app.indexOf('var list = $("#client-spec-cards")') !== -1, "renderer targets the card list");

console.log("ok — 2170 place-who-stay, bridge steps, specialty cards, facility continue");
