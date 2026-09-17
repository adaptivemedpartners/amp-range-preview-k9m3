/* Node smoke: 2127 homepage + client-path checklist on the Pages publish branch.
   Run: node js/home-path-2127.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2127-home-path-clarity -->") !== -1, rel + " missing 2127 stamp comment");
  assert(html.indexOf("amp-build 2127-home-path-clarity") !== -1, rel + " missing 2127 chip");
  assert(html.indexOf('href="css/site.css?v=2127"') !== -1, rel + " css not ?v=2127");
  assert(html.indexOf('src="js/app.js?v=2127"') !== -1, rel + " app.js not ?v=2127");
  assert(html.indexOf("js/ridge-access.js") !== -1, rel + " lost ridge-access.js");
  assert(html.indexOf("Your partners in rural healthcare recruiting.") !== -1, rel + " missing hero subhead");
  assert(html.indexOf("Are you a provider looking for a job?") !== -1, rel + " missing provider label");
  assert(html.indexOf("Are you a medical facility looking to hire?") !== -1, rel + " missing facility label");
  assert(html.indexOf("assets/partners/iphca.png") !== -1, rel + " missing IPHCA logo");
  assert(html.indexOf("assets/partners/vcu.png") !== -1, rel + " missing VCU logo");
  assert((html.match(/class="partner-logo"/g) || []).length >= 6, rel + " need six partner logos");
  ["Step 2 of 5", "Step 3 of 5", "Step 4 of 5", "Step 5 of 5"].forEach(function (step) {
    assert(html.indexOf(step) !== -1, rel + " missing " + step);
  });
  assert(html.indexOf('id="client-ridge-cta-mid"') !== -1, rel + " missing mid Ridge CTA");
  assert(html.indexOf('id="client-ridge-cta-foot"') !== -1, rel + " missing foot Ridge CTA");
  assert(html.indexOf('id="client-how-help-title"') !== -1, rel + " missing How we help");
  assert(html.indexOf('id="client-climb-band"') !== -1, rel + " lost 2126 climb How we help");
  assert(html.indexOf('id="client-start-topics-parked"') !== -1, rel + " missing parked Tell-us-where-to-start");
  assert(/id="client-start-topics-parked"[^>]*hidden/.test(html), rel + " Tell-us-where-to-start not parked hidden");
  assert(html.indexOf('id="client-discuss-topics"') !== -1, rel + " missing post-submit topic grid");
  assert(html.indexOf('id="confirm-client-title"') !== -1, rel + " missing confirm title id");
  assert(html.indexOf('id="client-meeting-state"') !== -1, rel + " missing meeting state");
  assert(html.indexOf('id="ridge-checkout-modal"') !== -1, rel + " lost Ridge checkout modal");
  assert(html.indexOf('id="why-amp-pillar-retention"') !== -1, rel + " lost Why AMP KPI pillars");
  var meeting = html.split('id="client-meeting-form"')[1] || "";
  meeting = meeting.split("</form>")[0] || "";
  assert(meeting.indexOf('name="note"') === -1, rel + " meeting form still has short note");
}

checkFile("index.html");
checkFile("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2127-home-path-clarity"') !== -1, "app.js build stamp");
assert(app.indexOf("var CLIENT_START_TOPICS") !== -1, "CLIENT_START_TOPICS missing");
assert((app.match(/id: "/g) || []).join("").length >= 0, "topics present");
["ridge", "comp", "timeline", "retained", "rural", "slate", "first-slate", "agenda"].forEach(function (id) {
  assert(app.indexOf('id: "' + id + '"') !== -1, "missing topic " + id);
});
assert(app.indexOf("function syncClientRidgeCtas") !== -1, "syncClientRidgeCtas missing");
assert(app.indexOf("function paintConfirmClientDiscuss") !== -1, "paintConfirmClientDiscuss missing");
assert(app.indexOf("function hiringGuideMailto") !== -1, "hiringGuideMailto missing");
assert(app.indexOf("Tell-us-where-to-start is parked") !== -1, "continue still requires parked needs");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2127-home-path-clarity") !== -1, "css missing 2127 stamp");
assert(css.indexOf("min-height: 416px") !== -1, "css missing 30% taller doors");
assert(css.indexOf(".home-partners-grid") !== -1, "css missing partners one-row");
assert(css.indexOf(".why-amp-proof-tile") !== -1, "css lost Why AMP KPI tiles");
assert(css.indexOf(".client-combined-stage") !== -1, "css lost combined client stage");

console.log("home-path-2127.test.js ok");
