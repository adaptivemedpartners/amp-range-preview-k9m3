/* Node smoke: 2137 preview polish — hero crop, step badge, path BGs.
   Run: node js/home-path-2137.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2137-preview-polish -->") !== -1, rel + " missing 2137 stamp comment");
  assert(html.indexOf("amp-build 2137-preview-polish") !== -1, rel + " missing 2137 chip");
  assert(html.indexOf('href="css/site.css?v=2137"') !== -1, rel + " css not ?v=2137");
  assert(html.indexOf('src="js/app.js?v=2137"') !== -1, rel + " app.js not ?v=2137");
  assert(html.indexOf("What matters most for your search?") !== -1, rel + " missing rank heading rename");
  assert(html.indexOf("What matters most on your summit") === -1, rel + " old summit heading still present");
  assert(html.indexOf("Step 2 of 5") !== -1, rel + " missing Step 2 of 5");
  assert(html.indexOf("Step 3 of 5") !== -1, rel + " missing Step 3 of 5");
  assert(html.indexOf("Step 4 of 5") !== -1, rel + " missing Step 4 of 5");
  assert(html.indexOf("Step 5 of 5") !== -1, rel + " missing Step 5 of 5");
  var region = html.split('data-route="client-region"')[1] || "";
  region = region.split('data-route="client-retained"')[0] || "";
  assert(region.indexOf("client-step-on-card") !== -1, rel + " step 4 badge not on white card");
  assert(region.indexOf("client-step-on-hero") === -1, rel + " step 4 badge still on hero");
  var meeting = html.split('data-route="client-meeting"')[1] || "";
  meeting = meeting.split('data-route="confirm-client"')[0] || "";
  assert(meeting.indexOf("client-step-on-card") !== -1, rel + " step 5 badge not on white card");
  assert(meeting.indexOf("client-step-on-hero") === -1, rel + " step 5 badge still on hero");
}

checkFile("index.html");
checkFile("404.html");

["amp-path-client-step4-boardroom.jpg", "amp-path-client-step5-desk.jpg", "amp-path-cand-rank-countryside.jpg"].forEach(function (file) {
  var full = path.join(ROOT, "assets", file);
  assert(fs.existsSync(full), "missing asset " + file);
  assert(fs.statSync(full).size > 10000, file + " looks too small");
});

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2137-preview-polish"') !== -1, "app.js build stamp");
assert(app.indexOf('go("client-meeting"') !== -1 || app.indexOf("go(\"client-meeting\"") !== -1, "funnel navigate to client-meeting must stay");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2137-preview-polish") !== -1, "css missing 2137 stamp");
assert(css.indexOf("72% center") !== -1, "mobile hero crop not nudged to ~72%");
assert(css.indexOf("62% center") === -1, "old 62% mobile hero crop still present");
assert(css.indexOf("amp-path-cand-rank-countryside.jpg") !== -1, "rank countryside BG missing");
assert(css.indexOf("amp-path-client-step4-boardroom.jpg") !== -1, "client step4 boardroom BG missing");
assert(css.indexOf("amp-path-client-step5-desk.jpg") !== -1, "client step5 desk BG missing");
assert(css.indexOf("client-step-on-card") !== -1, "css missing on-card step badge");
assert(/\.hire-sheet \.client-step[\s\S]{0,180}position:\s*absolute/.test(css), "hire-sheet step badge not absolute top-right");
assert(css.indexOf('data-route="confirm-client"] > .shot .pro-still') !== -1, "confirm-client still blank / missing desk BG");

console.log("home-path-2137.test.js ok");
