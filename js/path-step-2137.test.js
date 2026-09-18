/* Node smoke: 2137 path-step badge + smoky plates.
   Run: node js/path-step-2137.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2137-path-step-polish -->") !== -1, rel + " missing 2137 stamp comment");
  assert(html.indexOf("amp-build 2137-path-step-polish") !== -1, rel + " missing 2137 chip");
  assert(html.indexOf('href="css/site.css?v=2137"') !== -1, rel + " css not ?v=2137");
  assert(html.indexOf('src="js/app.js?v=2137"') !== -1, rel + " app.js not ?v=2137");
  assert(html.indexOf("What matters most for your search?") !== -1, rel + " rank heading not updated");
  assert(html.indexOf("What matters most on your summit") === -1, rel + " summit rank copy still present");
  assert(html.indexOf("client-step-on-hero") === -1, rel + " step badge still jammed in dark hero");

  ["Step 2 of 5", "Step 3 of 5", "Step 4 of 5", "Step 5 of 5"].forEach(function (step) {
    assert(html.indexOf(step) !== -1, rel + " missing " + step);
  });

  var region = html.split('data-route="client-region"')[1] || "";
  region = region.split('data-route="client-retained"')[0] || region.split('data-route="client-meeting"')[0] || "";
  var regionHero = region.split('class="hero-inner"')[1] || "";
  regionHero = regionHero.split("</div>")[0] || "";
  assert(regionHero.indexOf("Step 4 of 5") === -1, rel + " step 4 badge still in region hero");
  assert(region.indexOf("client-combined-stage") !== -1 && region.indexOf("Step 4 of 5") !== -1, rel + " step 4 badge not on region card");

  var meeting = html.split('data-route="client-meeting"')[1] || "";
  meeting = meeting.split('data-route="confirm-client"')[0] || "";
  var meetingHero = meeting.split('class="hero-inner"')[1] || "";
  meetingHero = meetingHero.split("</div>")[0] || "";
  assert(meetingHero.indexOf("Step 5 of 5") === -1, rel + " step 5 badge still in meeting hero");
  assert(meeting.indexOf("client-meeting-card") !== -1 && meeting.indexOf("Step 5 of 5") !== -1, rel + " step 5 badge not on meeting card");

  var confirm = html.split('data-route="confirm-client"')[1] || "";
  confirm = confirm.split('data-route="mpc"')[0] || "";
  assert(confirm.indexOf("Step 5 of 5") === -1, rel + " confirm page should not show step badge");
}

checkFile("index.html");
checkFile("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2137-path-step-polish"') !== -1, "app.js build stamp");
assert(app.indexOf('go("client-meeting"') !== -1 || app.indexOf("go(\"client-meeting\"") !== -1, "client-meeting route lost");
assert(app.indexOf('go("physician-rank"') !== -1 || app.indexOf("go(\"physician-rank\"") !== -1, "physician-rank route lost");
assert(app.indexOf('go("physician-jobs"') !== -1 || app.indexOf("go(\"physician-jobs\"") !== -1, "physician-jobs route lost");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2137-path-step-polish") !== -1, "css missing 2137 stamp");
assert(css.indexOf("amp-path-client-step4-boardroom.jpg?v=2137") !== -1, "missing client step 4 boardroom plate");
assert(css.indexOf("amp-path-client-step5-desk.jpg?v=2137") !== -1, "missing client step 5 desk plate");
assert(css.indexOf("amp-path-cand-rank-countryside.jpg?v=2137") !== -1, "missing candidate rank countryside plate");
assert(css.indexOf('data-route="physician-jobs"] > .shot .pro-still') !== -1, "jobs list must stay blank/no photo");
assert(css.indexOf('data-route="confirm-client"] > .shot .pro-still') !== -1, "confirm-client must stay blank/no photo");
assert(css.indexOf("amp-path-cand-specialty.jpg") !== -1, "candidate specialty plate lost");
assert(css.indexOf("amp-path-cand-nurses.jpg") !== -1, "candidate map/nurses plate lost");
assert(css.indexOf("amp-path-client-fqhc.jpg") !== -1, "client facility plate lost");
assert(css.indexOf("amp-path-client-hallway.jpg") !== -1, "client specialty plate lost");
assert(/\.path-step[\s\S]{0,180}position:\s*absolute/.test(css), "path-step not absolutely placed");
assert(/\.path-step[\s\S]{0,220}right:\s*14px/.test(css), "path-step not top-right");
assert(css.indexOf("client-step-on-hero") !== -1, "legacy on-hero hook should remain harmless");

["amp-path-client-step4-boardroom.jpg", "amp-path-client-step5-desk.jpg", "amp-path-cand-rank-countryside.jpg"].forEach(function (file) {
  assert(fs.existsSync(path.join(ROOT, "assets", file)), "missing asset " + file);
});

console.log("path-step-2137.test.js ok");
