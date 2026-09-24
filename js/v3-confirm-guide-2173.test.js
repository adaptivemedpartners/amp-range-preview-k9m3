/* Node smoke: 2173 confirmation uses the selected hiring guide.
   Brenton territory must not fall through to a hardcoded Aaron.
   2172 title-clear / funnel locks stay.
   Run: node js/v3-confirm-guide-2173.test.js */
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
var fallback = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");

assert(html.indexOf("<!-- amp-build:2173-confirm-guide-name -->") !== -1, "html stamp");
assert(fallback.indexOf("<!-- amp-build:2173-confirm-guide-name -->") !== -1, "404 stamp");
assert(html.indexOf("<!-- amp-build:2172-client-top-clean -->") !== -1, "2172 stamp kept");
assert(css.indexOf("amp-build:2173-confirm-guide-name") !== -1, "css stamp");
assert(css.indexOf("amp-build:2172-client-top-clean") !== -1, "2172 css stamp kept");
assert(html.indexOf("?v=2172") === -1, "html still on 2172 cache");
assert(fallback.indexOf("?v=2172") === -1, "404 still on 2172 cache");
assert(app.indexOf('__AMP_BUILD = "2184-specialty-under-sub-sky-bridge-restore"') !== -1, "app build stamp");

var confirm = sliceBetween(html, 'data-route="confirm-client"', 'data-route="mpc"', "confirm step");
assert(confirm.indexOf("Aaron") === -1, "confirm template hardcodes Aaron");
assert(confirm.indexOf('id="confirm-client-title"') !== -1, "confirm title");
assert(confirm.indexOf('id="confirm-bd-owner-chip"') !== -1, "confirm badge");
assert(confirm.indexOf('id="confirm-bd-route-note"') !== -1, "confirm footer");
assert(confirm.indexOf('id="client-discuss-title"') !== -1, "confirm discuss title");

assert(app.indexOf("function rememberHiringGuide") !== -1, "shared guide writer");
assert(app.indexOf("function currentHiringGuide") !== -1, "shared guide reader");
assert(app.indexOf("state.guide = BD_OWNER_META[owner.id] || owner") !== -1, "state.guide is the territory owner");
assert(app.indexOf("clientMeetingStateTouched") !== -1, "untouched state select cannot replace the guide");
assert(app.indexOf('first + " has your meeting request."') !== -1, "headline uses first name");
assert(app.indexOf('first + " looks forward to meeting with you. What would you like to discuss?"') !== -1, "discuss line uses first name");
assert(app.indexOf("hiring guide · ' + owner.label") !== -1, "badge uses guide label");
assert(app.indexOf('st + " · hiring guide " + owner.name') !== -1, "footer uses full name");
assert(app.indexOf("Aaron has your meeting request") === -1, "headline is not hardcoded Aaron");
assert(app.indexOf("hiring guide Aaron Wagner") === -1, "footer is not hardcoded Aaron");

var paint = app.slice(app.indexOf("function paintConfirmClientDiscuss"), app.indexOf("function resolveBdOwner"));
assert(paint.indexOf("currentHiringGuide()") !== -1, "confirm paint reads the selected guide");
assert(paint.indexOf("confirm-bd-owner-chip") !== -1, "confirm paint owns the badge");
assert(paint.indexOf("confirm-bd-route-note") !== -1, "confirm paint owns the footer");

require("./v3-client-top-2172.test.js");

console.log("ok — 2173 confirmation follows the selected hiring guide");
