/* Node smoke: 2169 years cadence + big still-there rotator + stay bridge.
   Run: node js/v3-home-years-rotate-2169.test.js */
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

assert(html.indexOf("<!-- amp-build:2169-years-rotate-bridge -->") !== -1, "html stamp");
assert(html.indexOf('href="css/site.css?v=2169"') !== -1, "css cache bust");
assert(html.indexOf('src="js/app.js?v=2169"') !== -1, "app cache bust");
assert(html.indexOf('src="js/hero-ret-rotator.js?v=2169"') !== -1, "rotator cache bust");
assert(html.indexOf("amp-build 2169-years-rotate-bridge") !== -1, "chip");
assert(app.indexOf('__AMP_BUILD = "2169-years-rotate-bridge"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:2169-years-rotate-bridge") !== -1, "css stamp");
assert(html.indexOf("?v=2168") === -1, "html still on 2168 cache");
assert(rot.indexOf("INTERVAL_MS = 3800") !== -1, "fade interval ~3.8s");
assert(rot.indexOf("mouseenter") !== -1 && rot.indexOf("paused = true") !== -1, "pause on hover");

var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
assert(home.indexOf("We place physicians who stay.") === -1, "old hero headline still on homepage");
assert(home.indexOf("Permanent recruitment") !== -1, "years line 1");
assert(home.indexOf("should be measured") !== -1, "years line 2");
assert(home.indexOf("in years.") !== -1, "years line 3");
assert(home.indexOf("Not placements.") !== -1, "years line 4");
assert(home.indexOf("v3-years-mint") !== -1, "mint last line");
assert(home.indexOf("v3-hero-split") !== -1, "phrase/card split");
assert(home.indexOf("data-hero-ret-rotator") !== -1, "rotator mount");
assert(home.indexOf("data-still-there-mount") !== -1, "swap mount");
assert(home.indexOf("id=\"amp-still-there-examples\"") !== -1, "example array");
assert(home.indexOf("UNDERSTAND") === -1, "no understand column");
assert(home.indexOf(">FIND<") === -1 && home.indexOf("02 FIND") === -1, "no find column");
assert(home.indexOf("03 MATCH") === -1 && home.indexOf(">MATCH<") === -1, "no match column");

var jsonStart = home.indexOf("id=\"amp-still-there-examples\">");
var jsonEnd = home.indexOf("</script>", jsonStart);
assert(jsonStart !== -1 && jsonEnd !== -1, "examples json");
var examples = JSON.parse(home.slice(home.indexOf("[", jsonStart), jsonEnd));
assert(examples.length === 10, "10 approved rotator cards");
var approved = [
  ["2011", "Pediatrics", "Northcrest Medical Center", "Springfield, TN", "14 YEARS LATER. STILL THERE."],
  ["2012", "General Surgery", "Baptist Regional Medical Center", "Corbin, KY", "14 YEARS LATER. STILL THERE."],
  ["2013", "Family Medicine w/ OB", "Frio Regional Hospital", "Pearsall, TX", "13 YEARS LATER. STILL THERE."],
  ["2013", "Emergency Medicine", "VCU Community Memorial Hospital", "South Hill, VA", "13 YEARS LATER. STILL THERE."],
  ["2013", "Radiology", "T.J. Samson Community Hospital", "Glasgow, KY", "12 YEARS LATER. STILL THERE."],
  ["2013", "Family Medicine", "Wayne Memorial Health System", "Honesdale, PA", "12 YEARS LATER. STILL THERE."],
  ["2014", "Orthopedic Surgery", "Henry County Medical Center", "Paris, TN", "12 YEARS LATER. STILL THERE."],
  ["2014", "Hospitalist", "Baptist Richmond", "Richmond, KY", "12 YEARS LATER. STILL THERE."],
  ["2017", "Vascular Surgery", "Peterson Regional Medical Center", "Kerrville, TX", "9 YEARS LATER. STILL THERE."],
  ["2016", "OB/GYN", "Susan B. Allen Memorial Hospital", "El Dorado, KS", "10 YEARS LATER. STILL THERE."]
];
approved.forEach(function (row, i) {
  var item = examples[i];
  assert(item.year === row[0] && item.specialty === row[1] && item.facility === row[2] && item.place === row[3] && item.still === row[4], "card " + (i + 1) + " mismatch");
  assert(!item.photo, "card " + (i + 1) + " must not invent a portrait");
  assert(!item.name && !item.candidate, "card " + (i + 1) + " must not carry a name");
});
assert(home.indexOf("Nebraska FQHC") === -1, "placeholder nebraska chip gone from homepage");
assert(home.indexOf("scrub 2026-09-23") !== -1, "scrub note on the swap list");
assert(rot.indexOf("if (it.photo)") !== -1, "photos stay optional");

var bridgeAt = home.indexOf('class="v3-stay-bridge"');
var rowAt = home.indexOf('class="v3-stats-parent"');
var heroAt = home.indexOf("v3-hero-split");
assert(heroAt !== -1 && bridgeAt !== -1 && rowAt !== -1, "stack markers");
assert(heroAt < bridgeAt && bridgeAt < rowAt, "hero, then bridge, then row2");
assert(home.indexOf("Finding someone is one thing.") !== -1, "bridge line 1");
assert(home.indexOf("Finding someone who stays is another.") !== -1, "bridge line 2");

var row = sliceBetween(html, 'class="v3-stats-parent"', 'class="home-partners', "row2");
assert(row.indexOf("mi-enrich cw-c") !== -1, "colorway C class");
assert(row.indexOf('href="/market-intelligence"') !== -1, "MI href");
assert(row.indexOf("amp-path-cand-nurses.jpg?v=2169") !== -1, "physician photo");
assert(row.indexOf("amp-path-client-hallway.jpg?v=2169") !== -1, "hiring photo");
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
assert(css.indexOf("grid-template-columns: 1fr") !== -1, "mobile stack rule present");
assert(css.indexOf(".v3-stay-bridge") !== -1, "bridge rules");
assert(css.indexOf('url("../assets/home-hero-clinic-consult.jpg?v=2169")') !== -1, "wallpaper cache");

var facHandler = app.slice(app.indexOf('var fac = raw.closest("[data-facility]")'), app.indexOf('var cs = raw.closest("[data-client-spec]")'));
assert(facHandler.indexOf('go("client-specialty", { trail: true })') !== -1, "facility select advances to specialty");
assert(facHandler.indexOf("paintClientFacilityCtx()") !== -1, "facility context still paints");
assert(app.indexOf('go("client-specialty", { trail: true })') !== -1, "continue backup still targets specialty");
assert(css.indexOf('data-route="client-specialty"] .hire-sheet') !== -1, "specialty sheet unclip");
assert(css.indexOf("overflow-y: auto") !== -1, "sheet can scroll");
assert(css.indexOf("#client-spec-continue") !== -1, "specialty continue stays addressable");

console.log("ok — 2169 years cadence, rotating still-there cards, stay bridge");
