/* Node smoke: 2134 homepage retention hero + compact doors + MI strip.
   Run: node js/home-path-2134.test.js
   HARD LOCK: candidate/client funnels, step counts, data-go, hire-sheet, form fields stay. */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function homeSlice(html) {
  var start = html.indexOf('data-route="home"');
  var phys = html.indexOf("<!-- ========== PHYSICIAN FUNNEL");
  assert(start !== -1 && phys !== -1, "missing home or physician funnel marker");
  return html.slice(start, phys);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2134-home-retention-hero -->") !== -1, rel + " missing 2134 stamp comment");
  assert(html.indexOf("amp-build 2134-home-retention-hero") !== -1, rel + " missing 2134 chip");
  assert(html.indexOf('href="css/site.css?v=2134"') !== -1, rel + " css not ?v=2134");
  assert(html.indexOf('src="js/app.js?v=2134"') !== -1, rel + " app.js not ?v=2134");

  var home = homeSlice(html);
  assert(home.indexOf("Permanent recruitment measured in years") !== -1, rel + " missing retention headline");
  assert(home.indexOf("Your partners in rural healthcare recruiting") !== -1, rel + " missing rural partners subline");
  assert(home.indexOf("Are you a provider looking for a job?") !== -1, rel + " missing candidate path card");
  assert(home.indexOf("Are you a medical facility looking to hire?") !== -1, rel + " missing client path card");
  assert(home.indexOf('id="home-mi-banner"') !== -1, rel + " missing MI banner");
  assert(home.indexOf('href="/ridge"') !== -1 && home.indexOf('data-go="mi-lite"') !== -1, rel + " MI banner must use existing nav route");
  assert(home.indexOf("<strong>87%</strong>") !== -1, rel + " missing 87% proof");
  assert(home.indexOf("<strong>1.7</strong>") !== -1, rel + " missing 1.7 proof");
  assert(home.indexOf("<strong>700+</strong>") !== -1, rel + " missing 700+ proof");
  assert(home.indexOf("<strong>16 yrs</strong>") !== -1, rel + " missing 16 yrs proof");
  assert(home.indexOf("assets/partners/iphca.png") !== -1, rel + " missing IPHCA logo");
  assert((home.match(/class="partner-logo"/g) || []).length >= 6, rel + " need six partner logos");

  var doorsAt = home.indexOf('id="home-doors"');
  var miAt = home.indexOf('id="home-mi-banner"');
  var proofAt = home.indexOf('aria-label="AMP public proof stats"');
  var logosAt = home.indexOf('class="home-partners"');
  assert(doorsAt !== -1 && miAt !== -1 && proofAt !== -1 && logosAt !== -1, rel + " missing homepage stack markers");
  assert(doorsAt < miAt && miAt < proofAt && proofAt < logosAt, rel + " order must be doors → MI → proof → logos");

  /* Funnel hard lock */
  assert(html.indexOf('data-route="physician"') !== -1, rel + " lost physician route");
  assert(html.indexOf('data-route="client"') !== -1, rel + " lost client route");
  assert(html.indexOf('class="hire-sheet') !== -1, rel + " lost hire-sheet");
  ["Step 2 of 5", "Step 3 of 5", "Step 4 of 5", "Step 5 of 5"].forEach(function (step) {
    assert(html.indexOf(step) !== -1, rel + " missing " + step);
  });
  assert(html.indexOf('id="client-meeting-form"') !== -1, rel + " lost client meeting form");
  var meeting = html.split('id="client-meeting-form"')[1] || "";
  meeting = meeting.split("</form>")[0] || "";
  ["name=\"name\"", "name=\"email\"", "name=\"phone\"", "name=\"role\"", "name=\"state\""].forEach(function (field) {
    assert(meeting.indexOf(field) !== -1, rel + " meeting form lost " + field);
  });
  assert(meeting.indexOf('name="note"') === -1, rel + " meeting form grew a note field");
  assert(html.indexOf('data-go="physician"') !== -1, rel + " lost physician data-go");
  assert(html.indexOf('data-go="client"') !== -1, rel + " lost client data-go");
  assert(html.indexOf('data-go="mi-lite"') !== -1, rel + " lost mi-lite data-go");
}

checkFile("index.html");
checkFile("404.html");

assert(fs.existsSync(path.join(ROOT, "assets/home-hero-clinic-consult.jpg")), "missing clinic hero jpg");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2134-home-retention-hero"') !== -1, "app.js build stamp");
assert(app.indexOf('h1: "Permanent recruitment measured in years — not placements."') !== -1, "SEO home h1 must keep retention headline");
assert(app.indexOf("go(\"client-meeting\"") !== -1 || app.indexOf('go("client-meeting"') !== -1, "client meeting nav must stay");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2134-home-retention-hero") !== -1, "css missing 2134 stamp");
assert(css.indexOf("home-hero-clinic-consult.jpg") !== -1, "css missing clinic hero cover");
assert(css.indexOf("#152332") !== -1 && css.indexOf("#78C4E5") !== -1 && css.indexOf("#6BE0AD") !== -1, "LinkedIn palette colors missing");
var block = css.slice(css.lastIndexOf("amp-build:2134-home-retention-hero"));
assert(/\.doors-hero \.door-hero\s*\{[\s\S]{0,180}min-height:\s*0/.test(block), "homepage doors must drop min-height");
assert(/\.doors-hero \.door-hero\s*\{[\s\S]{0,220}padding:\s*20px 22px 12px/.test(block), "homepage doors must hug CTA with tight padding");
assert(/\.doors-hero \.door-hero \.door-cta\s*\{[\s\S]{0,80}margin-top:\s*auto/.test(block), "door CTAs should pin to the card bottom");
assert(block.indexOf(".home-mi-banner") !== -1, "css missing MI banner");
assert(block.indexOf(".home-proof-band") !== -1, "css missing proof band");

console.log("home-path-2134.test.js ok");
