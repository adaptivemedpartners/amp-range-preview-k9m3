/* Node smoke: 2158 locked V3 homepage + client facility/specialty contextual cards.
   Run: node js/v3-home-client-2158.test.js */
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
  assert(html.indexOf("<!-- amp-build:2158-v3-home-client-funnel -->") !== -1, rel + " missing 2158 stamp");
  assert(html.indexOf('href="css/site.css?v=2158"') !== -1, rel + " css cache bust");
  assert(html.indexOf('src="js/app.js?v=2158"') !== -1, rel + " app cache bust");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
  assert(home.indexOf("We place physicians who stay.") !== -1, rel + " hero headline");
  assert(home.indexOf("RETENTION-LED RECRUITING") !== -1, rel + " eyebrow");
  assert(home.indexOf("story-2015-peds-ne.jpg") !== -1, rel + " 2015 chip photo");
  assert(home.split("story-2015-peds-ne.jpg").length === 2, rel + " 2015 story should appear once on the homepage");
  assert(home.indexOf("story-2018-fm-ne-cah.jpg") === -1, rel + " 2018 story leaked onto homepage");
  assert(home.indexOf("story-2021-physician-ks.jpg") === -1, rel + " 2021 story leaked onto homepage");
  assert(home.indexOf("I'm a physician →") !== -1, rel + " physician CTA");
  assert(home.indexOf("I'm hiring →") !== -1, rel + " hiring CTA");
  assert(home.indexOf("Confidential career options") !== -1, rel + " physician body");
  assert(home.indexOf("data-go=\"physician\"") !== -1, rel + " physician door");
  assert(home.indexOf("data-go=\"client\"") !== -1, rel + " hiring door");
  assert(home.indexOf("amp-path-cand-nurses.jpg") !== -1, rel + " physician photo");
  assert(home.indexOf("amp-path-client-hallway.jpg") !== -1, rel + " hiring photo");
  assert(home.indexOf("home-hero-clinic-consult.jpg") !== -1, rel + " clinic hero");
  assert(home.indexOf("Explore MI →") !== -1, rel + " MI teaser");
  assert(home.indexOf("data-go=\"mi-lite\"") !== -1, rel + " MI route");
  assert(home.indexOf("Rural hospitals") !== -1, rel + " proof row");
  assert(home.indexOf("data-hero-ret-rotator") === -1, rel + " rotator still on homepage");
  assert(home.indexOf("data-home-place-map") === -1, rel + " placements map still on homepage");
  assert(home.indexOf("mountain") === -1, rel + " mountain wording on homepage frame");

  var fac = sliceBetween(html, 'data-route="client"', 'data-route="client-specialty"', "facility step");
  assert(fac.indexOf("Step 2 of 5") !== -1, rel + " facility step kicker");
  assert(fac.indexOf("What kind of facility are you hiring for?") !== -1, rel + " facility question");
  assert(fac.indexOf('id="client-facility-ctx"') !== -1, rel + " facility contextual card");
  assert(fac.indexOf('id="client-facility-continue"') !== -1, rel + " facility continue");
  assert(fac.indexOf("story-2015-peds-ne.jpg") === -1, rel + " 2015 story should not be static on facility step");

  var spec = sliceBetween(html, 'data-route="client-specialty"', 'data-route="client-region"', "specialty step");
  assert(spec.indexOf("Step 3 of 5") !== -1, rel + " specialty step kicker");
  assert(spec.indexOf("Which specialty are you hiring?") !== -1, rel + " specialty question");
  assert(spec.indexOf('id="client-specialty-ctx"') !== -1, rel + " specialty contextual card");
  assert(spec.indexOf("client-step3-ret-strip") === -1, rel + " old four-card strip still on step 3");
  assert(spec.indexOf("story-2015-peds-ne.jpg") === -1, rel + " 2015 story should not be static on specialty step");

  assert(html.indexOf("Step 4 of 5") !== -1, rel + " step 4 missing");
  assert(html.indexOf("Step 5 of 5") !== -1, rel + " step 5 missing");
  assert(html.indexOf('data-route="client-region"') !== -1, rel + " map/search step");
  assert(html.indexOf('data-route="client-meeting"') !== -1, rel + " meeting step");
  assert(html.indexOf("webflow") === -1 && html.indexOf("Webflow") === -1, rel + " Webflow leaked in");
}

checkHtml("index.html");
checkHtml("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2158-v3-home-client-funnel"') !== -1, "app build stamp");
assert(app.indexOf("FQHC fit · 2021") !== -1, "FQHC story missing");
assert(app.indexOf("Physician · Kansas FQHC") !== -1, "Kansas FQHC role missing");
assert(app.indexOf("CAH fit · 2018") !== -1, "CAH story missing");
assert(app.indexOf("2018 · Family Medicine") !== -1, "FM specialty story missing");
assert(app.indexOf("8 YEARS LATER. STILL THERE.") !== -1, "2018 footer missing");
assert(app.indexOf("11 YEARS LATER. STILL THERE.") !== -1, "2015 footer missing from specialty match");
assert(app.indexOf("function paintClientFacilityCtx") !== -1, "facility paint missing");
assert(app.indexOf("function paintClientSpecialtyCtx") !== -1, "specialty paint missing");
assert(app.indexOf('s.indexOf("pediatr") === 0') !== -1, "peds match missing");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2158-v3-home-client-funnel") !== -1, "css stamp");
assert(css.indexOf(".v3-doors") !== -1, "door grid");
assert(css.indexOf("@media (max-width: 640px)") !== -1, "mobile stack");

console.log("v3-home-client-2158.test.js: ok");
