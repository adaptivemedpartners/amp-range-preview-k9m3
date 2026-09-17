/* Node smoke: 2128 homepage + client-path fine-tunes on the Pages publish branch.
   Run: node js/home-path-2128.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2128-home-path-finetune -->") !== -1, rel + " missing 2128 stamp comment");
  assert(html.indexOf("amp-build 2128-home-path-finetune") !== -1, rel + " missing 2128 chip");
  assert(html.indexOf('href="css/site.css?v=2128"') !== -1, rel + " css not ?v=2128");
  assert(html.indexOf('src="js/app.js?v=2128"') !== -1, rel + " app.js not ?v=2128");
  assert(html.indexOf("js/ridge-access.js") !== -1, rel + " lost ridge-access.js");
  assert(
    html.indexOf("Your partners in rural healthcare recruiting. AMP as your guide. Two paths. One mountain.") !== -1,
    rel + " missing restored hero subhead"
  );
  assert(html.indexOf("Retained search") === -1 || html.indexOf("explore-sub") < html.indexOf("Retained search"), "ok");
  var sub = html.split('class="explore-sub"')[1] || "";
  sub = sub.split("</p>")[0] || "";
  assert(sub.indexOf("Retained search") === -1, rel + " brought back Retained search in hero sub");
  assert(sub.indexOf("Dedicated investment") === -1, rel + " brought back Dedicated investment in hero sub");
  assert(html.indexOf("Are you a provider looking for a job?") !== -1, rel + " missing provider label");
  assert(html.indexOf("Are you a medical facility looking to hire?") !== -1, rel + " missing facility label");
  assert(html.indexOf("assets/partners/iphca.png") !== -1, rel + " missing IPHCA logo");
  assert(html.indexOf("assets/partners/vcu.png") !== -1, rel + " missing VCU logo");
  assert((html.match(/class="partner-logo"/g) || []).length >= 6, rel + " need six partner logos");
  ["Step 2 of 5", "Step 3 of 5", "Step 4 of 5", "Step 5 of 5"].forEach(function (step) {
    assert(html.indexOf(step) !== -1, rel + " missing " + step);
  });
  assert(html.indexOf('id="client-ridge-cta-mid"') === -1, rel + " mid mailto Ridge CTA should be gone");
  assert(html.indexOf('id="client-ridge-cta-foot"') !== -1, rel + " missing foot Ridge CTA");
  assert(html.indexOf("Get your market Ridge report") !== -1, rel + " missing foot Ridge report label");
  assert(html.indexOf('id="client-how-help-title"') !== -1, rel + " missing How we help");
  assert(html.indexOf('id="client-climb-band"') !== -1, rel + " lost climb How we help");
  assert(html.indexOf('id="client-start-topics-parked"') !== -1, rel + " missing parked Tell-us-where-to-start");
  assert(/id="client-start-topics-parked"[^>]*hidden/.test(html), rel + " Tell-us-where-to-start not parked hidden");
  assert(html.indexOf("Difficulty getting candidate volume") !== -1, rel + " missing original volume need card");
  assert(html.indexOf("We get candidates but can’t close / convert") !== -1, rel + " missing convert need card");
  assert(html.indexOf("Interviews take too many cycles / wrong people reach leadership") !== -1, rel + " missing interviews need card");
  assert(html.indexOf("Role stays open too long / vacancy burn") !== -1, rel + " missing vacancy need card");
  assert(html.indexOf("Confidential / competitive search needs a quieter approach") !== -1, rel + " missing confidential need card");
  assert(html.indexOf("Need help telling the opportunity story (marketing/preview)") !== -1, rel + " missing story need card");
  assert(html.indexOf("Not sure which seats to prioritize / brief is fuzzy") !== -1, rel + " missing brief need card");
  assert(html.indexOf(">Something else<") !== -1 || html.indexOf("Something else") !== -1, rel + " missing something else card");
  assert(html.indexOf('id="client-discuss-topics"') !== -1, rel + " missing post-submit topic grid");
  assert(html.indexOf('id="confirm-client-title"') !== -1, rel + " missing confirm title id");
  assert(html.indexOf('id="client-discuss-title"') !== -1, rel + " missing discuss title");
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
assert(app.indexOf('window.__AMP_BUILD = "2128-home-path-finetune"') !== -1, "app.js build stamp");
assert(app.indexOf("var CLIENT_START_TOPICS") !== -1, "CLIENT_START_TOPICS missing");
["volume", "convert", "interviews", "vacancy", "confidential", "story", "brief", "other"].forEach(function (id) {
  assert(app.indexOf('id: "' + id + '"') !== -1, "missing original need topic " + id);
});
["ridge", "comp", "timeline", "first-slate", "agenda"].forEach(function (id) {
  assert(app.indexOf('id: "' + id + '"') === -1, "invented topic " + id + " should be gone");
});
assert(app.indexOf("Ridge market report") === -1, "invented Ridge market report topic still in app.js");
assert(app.indexOf("Compensation bands") === -1, "invented Compensation bands topic still in app.js");
assert(app.indexOf("and get a full market analysis") !== -1, "continue CTA missing market-analysis copy");
assert(app.indexOf("Click here to get a full market analysis from") === -1, "mid mailto copy still in app.js");
assert(app.indexOf("function syncClientRidgeCtas") !== -1, "syncClientRidgeCtas missing");
assert(app.indexOf("function paintConfirmClientDiscuss") !== -1, "paintConfirmClientDiscuss missing");
assert(app.indexOf("function hiringGuideMailto") !== -1, "hiringGuideMailto missing");
assert(app.indexOf("Tell-us-where-to-start is parked") !== -1, "continue still requires parked needs");
assert(app.indexOf("go(\"client-meeting\"") !== -1 || app.indexOf('go("client-meeting"') !== -1, "continue must still navigate to client-meeting");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2128-home-path-finetune") !== -1, "css missing 2128 stamp");
assert(css.indexOf("min-height: 416px") !== -1, "css missing 30% taller doors");
assert(css.indexOf(".home-partners-grid") !== -1, "css missing partners one-row");
assert(css.indexOf(".why-amp-proof-tile") !== -1, "css lost Why AMP KPI tiles");
assert(css.indexOf(".client-combined-stage") !== -1, "css lost combined client stage");
assert(/\.door-path[\s\S]{0,220}text-transform:\s*uppercase/.test(css), "door-path should be uppercase");
assert(/\.home-job2-path[\s\S]{0,220}text-transform:\s*uppercase/.test(css), "job2 path should be uppercase");
assert(css.indexOf("font-size: 19.5px") !== -1, "door-path not noticeably larger");
assert(css.indexOf("#0f172a") !== -1, "css missing dark discuss ink");
assert(/\.client-discuss-title[\s\S]{0,180}color:\s*#0f172a/.test(css), "discuss title not forced dark");

console.log("home-path-2128.test.js ok");
