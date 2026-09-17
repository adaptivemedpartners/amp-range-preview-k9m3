/* Node smoke: 2130 confirm-page discuss + 2129 meeting CTA gap.
   Run: node js/home-path-2130.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2130-confirm-discuss -->") !== -1, rel + " missing 2130 stamp comment");
  assert(html.indexOf("amp-build 2130-confirm-discuss") !== -1, rel + " missing 2130 chip");
  assert(html.indexOf('href="css/site.css?v=2130"') !== -1, rel + " css not ?v=2130");
  assert(html.indexOf('src="js/app.js?v=2130"') !== -1, rel + " app.js not ?v=2130");
  assert(html.indexOf("js/ridge-access.js") !== -1, rel + " lost ridge-access.js");
  assert(
    html.indexOf("Your partners in rural healthcare recruiting. AMP as your guide. Two paths. One mountain.") !== -1,
    rel + " missing restored hero subhead"
  );
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
  assert(html.indexOf('id="client-ridge-cta-mid"') === -1, rel + " mid mailto Ridge CTA should stay gone");
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
  assert(html.indexOf('id="client-discuss-send"') !== -1, rel + " missing discuss Send button");
  assert(html.indexOf("Tap a topic to send a note") === -1, rel + " old per-card send copy still on confirm");
  assert(html.indexOf("Select any topics, then Send") !== -1, rel + " missing multi-select Send hint");
  assert(html.indexOf('id="client-meeting-state"') !== -1, rel + " missing meeting state");
  assert(html.indexOf('id="ridge-checkout-modal"') !== -1, rel + " lost Ridge checkout modal");
  assert(html.indexOf('id="why-amp-pillar-retention"') !== -1, rel + " lost Why AMP KPI pillars");
  var meeting = html.split('id="client-meeting-form"')[1] || "";
  meeting = meeting.split("</form>")[0] || "";
  assert(meeting.indexOf('name="note"') === -1, rel + " meeting form still has short note");

  var region = html.split('data-route="client-region"')[1] || "";
  region = region.split('data-route="client-retained"')[0] || region.split('data-route="client-meeting"')[0] || "";
  var mapAt = region.indexOf('id="client-territory-band"');
  var ctaAt = region.indexOf('id="client-offers-continue"');
  var climbAt = region.indexOf('id="client-climb-band"');
  var helpAt = region.indexOf('id="client-how-help-title"');
  var footAt = region.indexOf('id="client-ridge-cta-foot"');
  assert(mapAt !== -1, rel + " missing client-territory-band");
  assert(ctaAt !== -1, rel + " missing meeting CTA");
  assert(climbAt !== -1, rel + " missing climb How we help");
  assert(mapAt < ctaAt && ctaAt < climbAt, rel + " meeting CTA must sit between map and How we help");
  assert(helpAt !== -1 && climbAt < helpAt, rel + " climb band should stay above How we help list");
  assert(footAt !== -1 && helpAt < footAt, rel + " foot Ridge report must stay below How we help");
  assert((region.match(/id="client-offers-continue"/g) || []).length === 1, rel + " duplicate meeting CTA");
  assert(region.indexOf("Pick a state to continue") === -1, rel + " old pick-a-state placeholder still in region");
  var ctaChunk = region.slice(ctaAt - 80, ctaAt + 180);
  assert(ctaChunk.indexOf("client-ridge-cta") !== -1, rel + " meeting CTA missing Ridge bar class");
  assert(ctaChunk.indexOf("btn-primary") === -1, rel + " meeting CTA still uses btn-primary pill");
  assert(/id="client-offers-continue"[^>]*hidden/.test(region), rel + " meeting CTA should start hidden like Ridge CTAs");
  var afterFoot = region.slice(footAt);
  assert(afterFoot.indexOf("client-spec-continue-wrap") === -1, rel + " leftover bottom continue wrap after Ridge report");

  var confirm = html.split('data-route="confirm-client"')[1] || "";
  confirm = confirm.split('data-route="mpc"')[0] || "";
  assert(confirm.indexOf('id="client-discuss-send"') !== -1, rel + " Send not on confirm page");
  assert(confirm.indexOf("client-discuss-grid") !== -1, rel + " confirm topics missing 2x4 grid class");
  assert(confirm.indexOf("client-confirm-discuss-wrap") !== -1, rel + " confirm discuss wrap missing");
}

checkFile("index.html");
checkFile("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2130-confirm-discuss"') !== -1, "app.js build stamp");
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
assert(app.indexOf("function sendClientDiscussTopics") !== -1, "sendClientDiscussTopics missing");
assert(app.indexOf("function toggleClientDiscussTopic") !== -1, "toggleClientDiscussTopic missing");
assert(app.indexOf("I would like to discuss") === -1, "per-card mailto body still in app.js");
assert(app.indexOf("window.location.href = href") === -1, "topic tap still fires mailto");
assert(app.indexOf("replaceLast: true") !== -1, "Send should extend the existing meeting lead");
assert(app.indexOf("amp_client_meeting_form") !== -1, "meeting channel lost");
assert(app.indexOf("Tell-us-where-to-start is parked") !== -1, "continue still requires parked needs");
assert(app.indexOf("hidden until state/guide ready") !== -1, "meeting CTA should hide until state/guide ready");
assert(app.indexOf("Pick a state to continue") === -1, "old pick-a-state continue copy still in app.js");
assert(app.indexOf("go(\"client-meeting\"") !== -1 || app.indexOf('go("client-meeting"') !== -1, "continue must still navigate to client-meeting");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2130-confirm-discuss") !== -1, "css missing 2130 stamp");
assert(css.indexOf("min-height: 416px") !== -1, "css missing 30% taller doors");
assert(css.indexOf(".home-partners-grid") !== -1, "css missing partners one-row");
assert(css.indexOf(".why-amp-proof-tile") !== -1, "css lost Why AMP KPI tiles");
assert(css.indexOf(".client-combined-stage") !== -1, "css lost combined client stage");
assert(/\.door-path[\s\S]{0,220}text-transform:\s*uppercase/.test(css), "door-path should be uppercase");
assert(/\.home-job2-path[\s\S]{0,220}text-transform:\s*uppercase/.test(css), "job2 path should be uppercase");
assert(css.indexOf("font-size: 19.5px") !== -1, "door-path not noticeably larger");
assert(css.indexOf("#0f172a") !== -1, "css missing dark discuss ink");
assert(/\.client-discuss-title[\s\S]{0,180}color:\s*#0f172a/.test(css), "discuss title not forced dark");
assert(css.indexOf("padding-bottom: 88px") === -1, "sticky-bottom padding for old continue still on client-region");
assert(/\.confirm-band \.hero-inner\s*\{\s*max-width:\s*1040px/.test(css), "confirm card not widened");
assert(css.indexOf("repeat(4, minmax(0, 1fr))") !== -1, "discuss topics not 4-across on desktop");
assert(/\.view\.funnel\[data-route="confirm-client"\] \.client-discuss[\s\S]{0,220}background:\s*#ffffff/.test(css), "discuss card not lightened");

console.log("home-path-2130.test.js ok");
