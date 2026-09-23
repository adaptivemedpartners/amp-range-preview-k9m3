/* Node smoke: 2172 client territory + meeting tops sit below the fade.
   One territory title. Map path chrome is not a second heading.
   Homepage 2171 locks, select-then-Continue, and specialty cards stay.
   Run: node js/v3-client-top-2172.test.js */
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

assert(html.indexOf("<!-- amp-build:2172-client-top-clean -->") !== -1, "html stamp");
assert(html.indexOf("<!-- amp-build:2171-bridge-blue-stretch -->") !== -1, "2171 stamp kept");
assert(html.indexOf('href="css/site.css?v=2173"') !== -1, "css cache bust 2173");
var fallback = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
assert(fallback.indexOf("<!-- amp-build:2172-client-top-clean -->") !== -1, "404 fallback stamp");
assert(fallback.indexOf('href="css/site.css?v=2173"') !== -1, "404 css cache");
assert(sliceBetween(fallback, 'data-route="client-region"', 'data-route="client-retained"', "404 territory").split("Where should we search?").length === 2, "404 one territory title");
assert(html.indexOf("?v=2171") === -1, "html still on 2171 cache");
assert(css.indexOf("amp-build:2172-client-top-clean") !== -1, "css stamp");
assert(app.indexOf('__AMP_BUILD = "2173-confirm-guide-name"') !== -1, "app build stamp");
assert(app.indexOf('h2.textContent = "Where should we search?"') === -1, "map must not repeat the territory title");
assert(app.indexOf('kicker.textContent = "Hiring path · territory"') === -1, "map path kicker removed");
assert(app.indexOf("introCopy.hidden = !!clientMode") !== -1, "client map intro copy stays hidden");

var region = sliceBetween(html, 'data-route="client-region"', 'data-route="client-retained"', "territory step");
assert(region.split("Where should we search?").length === 2, "exactly one territory title");
assert(region.indexOf('class="hire-title">Where should we search?') !== -1, "title is the page h1");
assert(region.indexOf("client-region-context") !== -1, "compact context line");
assert(region.indexOf("client-region-context") < region.indexOf("client-card-lede"), "context sits under the title");
assert(region.indexOf("Hiring path") === -1, "path chrome not in the territory markup");
assert(region.indexOf('id="client-region-fac-line"') !== -1, "facility · specialty line kept");
assert(region.indexOf('id="client-region-grid"') !== -1, "map kept");
assert(region.indexOf('id="client-offers-continue"') !== -1, "meeting CTA kept");

var meeting = sliceBetween(html, 'data-route="client-meeting"', 'data-route="confirm-client"', "meeting step");
assert(meeting.split("Request a hiring consultation.").length === 2, "one meeting title");
assert(meeting.indexOf('id="client-meeting-form"') !== -1, "form kept");
assert(meeting.indexOf('name="name"') !== -1, "name field kept");
assert(meeting.indexOf('name="email"') !== -1, "email field kept");
assert(meeting.indexOf('name="phone"') !== -1, "phone field kept");
assert(meeting.indexOf('id="client-meeting-state"') !== -1, "state field kept");
assert(meeting.indexOf("Request a meeting") !== -1, "submit kept");

var b2172 = css.slice(css.indexOf("========== amp-build:2172-client-top-clean"));
assert(b2172.indexOf("========== amp-build:2172-client-top-clean") === 0, "2172 block present");
assert(b2172.indexOf('data-route="client-region"') !== -1, "territory rule");
assert(b2172.indexOf('data-route="client-meeting"') !== -1, "meeting rule");
assert(b2172.indexOf("padding-top: var(--amp-title-clear) !important") !== -1, "shared title clearance");
assert(b2172.indexOf("region-map-intro > div:first-child") !== -1, "duplicate map title hidden");
assert(b2172.indexOf(".client-region-context") !== -1, "context line styled");
assert(css.indexOf("--amp-title-clear") !== -1, "title-clear token remains");

assert(app.indexOf("function bindClientFacilityContinue") !== -1, "facility continue remains");
assert(app.indexOf('go("client-specialty", { trail: true })') !== -1, "facility continue still opens specialty");
assert(app.indexOf('go("client-meeting", { trail: true })') !== -1, "territory still opens meeting");
assert(css.indexOf("#client-spec-continue") !== -1, "specialty continue stays addressable");
assert(css.indexOf("grid-auto-rows: minmax(112px, auto)") !== -1, "specialty cards stay a visible row");

require("./v3-home-bridge-blue-2171.test.js");

console.log("ok — 2172 client tops clear the fade; one territory title");
