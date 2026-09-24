/* Node smoke: 2171 bridge blue stretch, larger left hero column, glass rotator,
   wider steps, locked MI compensation line, specialty cards stay visible.
   Run: node js/v3-home-bridge-blue-2171.test.js */
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

assert(html.indexOf("<!-- amp-build:2171-bridge-blue-stretch -->") !== -1, "html stamp");
assert(html.indexOf('href="css/site.css?v=2182"') !== -1, "css cache bust");
assert(html.indexOf('src="js/app.js?v=2182"') !== -1, "app cache bust");
assert(html.indexOf('src="js/hero-ret-rotator.js?v=2182"') !== -1, "rotator cache bust");
assert(html.indexOf("amp-build 2182-footer-wallpaper-bleed") !== -1, "chip");
assert(app.indexOf('__AMP_BUILD = "2182-footer-wallpaper-bleed"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:2171-bridge-blue-stretch") !== -1, "css stamp");
assert(html.indexOf("?v=2170") === -1, "html still on 2170 cache");
assert(rot.indexOf("INTERVAL_MS = 3800") !== -1, "fade interval ~3.8s");
assert(rot.indexOf("mouseenter") !== -1 && rot.indexOf("paused = true") !== -1, "pause on hover");

var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
assert(home.indexOf("We place physicians who stay.") !== -1, "place-who-stay headline");
assert(home.indexOf("RETENTION-LED RECRUITING") !== -1, "eyebrow");
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
var stripAt = home.indexOf("amp-zach-scope-strip");
assert(heroAt !== -1 && bridgeAt !== -1 && stepsAt !== -1 && stripAt !== -1 && rowAt !== -1, "stack markers");
assert(heroAt < bridgeAt && bridgeAt < stepsAt && stepsAt < stripAt && stripAt < rowAt, "hero, bridge, zach strip, then row2");
assert(home.indexOf("Finding someone is one thing.") !== -1, "bridge line 1");
assert(home.indexOf("Finding someone who stays is another.") !== -1, "bridge line 2");
assert(home.indexOf("v3-stay-mint") !== -1, "second line hook kept");
assert(home.indexOf(">UNDERSTAND<") !== -1, "01 understand step");
assert(home.indexOf(">FIND<") !== -1, "02 find step");
assert(home.indexOf(">MATCH<") !== -1, "03 match step");
assert(home.indexOf(">01<") !== -1 && home.indexOf(">02<") !== -1 && home.indexOf(">03<") !== -1, "numbered steps");

var row = sliceBetween(html, 'class="v3-stats-parent"', 'class="home-partners', "row2");
assert(row.indexOf("mi-enrich cw-c") !== -1, "colorway C class");
assert(row.indexOf('href="/market-intelligence"') !== -1, "MI href");
assert(row.indexOf("Real-time compensation data for every") !== -1, "locked MI line");
assert(row.indexOf("specialty × state") !== -1, "multiplication sign on specialty × state");
assert(row.indexOf("mi-spec-state") !== -1, "nowrap hook so the unit does not crush");
assert(row.indexOf("See demand signals") === -1, "old MI headline gone");
assert(row.indexOf(">Place draw<") !== -1, "place draw pill");
assert(row.indexOf(">Specialty supply<") !== -1, "specialty supply pill");
assert(row.indexOf(">FQHC<") !== -1, "FQHC pill");
assert(row.indexOf(">CAH<") !== -1, "CAH pill");
assert(row.indexOf("amp-path-cand-nurses.jpg?v=2182") !== -1, "physician photo");
assert(row.indexOf("amp-path-client-hallway.jpg?v=2182") !== -1, "hiring photo");
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
assert(css.indexOf("#35373b") !== -1, "prior charcoal rule remains for the override to replace");
assert(css.indexOf("max-width: 1040px") !== -1, "rotator pulled into a content band");
assert(css.indexOf("max-width: 470px") !== -1, "card width lock");
assert(css.indexOf("font-size: clamp(1.15rem, 1.7vw, 1.45rem)") !== -1, "bridge title size stays");
assert(css.indexOf('url("../assets/home-hero-clinic-consult.jpg?v=2170")') !== -1, "wallpaper cache");

var b2171 = css.slice(css.indexOf("========== amp-build:2171-bridge-blue-stretch"));
assert(b2171.indexOf("========== amp-build:2171-bridge-blue-stretch") === 0, "2171 block present");
assert(b2171.indexOf("clamp(2.55rem, 4vw, 3.35rem)") !== -1, "larger headline");
assert(b2171.indexOf("font-size: 16px") !== -1, "larger eyebrow");
assert(b2171.indexOf("font-size: 1.08rem") !== -1, "subheader scales slightly");
assert(b2171.indexOf("rgba(21, 35, 50, 0.38)") !== -1, "rotator glass");
assert(b2171.indexOf("#5eb8e0") !== -1, "MI blue accents");
assert(b2171.indexOf("#8fcebb") === -1, "2171 must not reintroduce mint");
assert(b2171.indexOf("#6BE0AD") === -1, "2171 must not reintroduce mint dot");
assert(b2171.indexOf("min(1720px, 100%)") !== -1, "wider bridge");
assert(b2171.indexOf("gap: 18px") !== -1, "steps spread");
assert(b2171.indexOf("rgba(21, 35, 50, 0.22)") !== -1, "step glass");
assert(b2171.indexOf("max-width: none") !== -1, "MI title released from 22ch");
assert(b2171.indexOf("white-space: nowrap") !== -1, "specialty × state stays one unit");
assert(b2171.indexOf("grid-auto-rows: minmax(112px, auto)") !== -1, "specialty row cannot crush");
assert(b2171.indexOf("overflow-y: auto") !== -1, "specialty sheet scrolls");
assert(b2171.indexOf("flex: none") !== -1, "specialty list stays natural height");
assert(css.indexOf(":not(.hire-card-list)") === -1, "2169 non-list flex-shrink lock removed");
css.split("}").forEach(function (block) {
  var bodyAt = block.lastIndexOf("{");
  if (bodyAt === -1) return;
  var sel = block.slice(0, bodyAt);
  var body = block.slice(bodyAt);
  if (sel.indexOf("hire-card-list") === -1) return;
  assert(body.indexOf("min-height: 0") === -1, "hire-card-list must not use min-height:0");
  assert(body.indexOf("flex: 1") === -1, "hire-card-list must not flex-grow");
});
assert(b2171.indexOf("max-width: 470") === -1, "2171 does not resize the rotator");
assert(b2171.indexOf("min-height: 176") === -1, "2171 does not grow the rotator");
assert(b2171.indexOf("font-size: clamp(1.15rem, 1.7vw, 1.45rem)") === -1, "bridge title size not retuned");

var sheetFix = css.slice(css.indexOf("amp-build:2170 — sheet scrolls"), css.indexOf("========== amp-build:2171-bridge-blue-stretch"));
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

console.log("ok — 2171 bridge blue stretch, hero weight, MI line, specialty cards");
