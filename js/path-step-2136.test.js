/* Node smoke: 2136 smoky path-step backgrounds. Funnels stay locked.
   Run: node js/path-step-2136.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function sliceRoute(html, route, nextRoute) {
  var start = html.indexOf('data-route="' + route + '"');
  assert(start !== -1, "missing data-route=" + route);
  var end = nextRoute ? html.indexOf('data-route="' + nextRoute + '"', start + 1) : html.length;
  if (end === -1) end = html.length;
  return html.slice(start, end);
}

function checkFile(rel) {
  var html = read(rel);
  assert(html.indexOf("<!-- amp-build:2136-path-step-bgs -->") !== -1, rel + " missing 2136 stamp comment");
  assert(html.indexOf("amp-build 2136-path-step-bgs") !== -1, rel + " missing 2136 chip");
  assert(html.indexOf('href="css/site.css?v=2136"') !== -1, rel + " css not ?v=2136");
  assert(html.indexOf('src="js/app.js?v=2136"') !== -1, rel + " app.js not ?v=2136");

  /* HARD LOCK — routes, step order, data-go, form fields */
  var candOrder = ["physician", "physician-rank", "physician-region", "physician-jobs"];
  var last = -1;
  candOrder.forEach(function (route) {
    var at = html.indexOf('data-route="' + route + '"');
    assert(at !== -1, rel + " lost candidate route " + route);
    assert(at > last, rel + " candidate step order changed at " + route);
    last = at;
  });

  var clientOrder = ["client", "client-specialty", "client-region", "client-retained", "client-meeting"];
  last = -1;
  clientOrder.forEach(function (route) {
    var at = html.indexOf('data-route="' + route + '"');
    assert(at !== -1, rel + " lost client route " + route);
    assert(at > last, rel + " client step order changed at " + route);
    last = at;
  });

  var spec = sliceRoute(html, "physician", "physician-rank");
  ["fm", "obg", "gi", "neuro", "dental", "other"].forEach(function (id) {
    assert(spec.indexOf('data-specialty="' + id + '"') !== -1, rel + " lost specialty " + id);
  });

  var fac = sliceRoute(html, "client", "client-specialty");
  ["fqhc", "cah", "community", "system", "bh", "group"].forEach(function (id) {
    assert(fac.indexOf('data-facility="' + id + '"') !== -1, rel + " lost facility " + id);
  });

  assert(html.indexOf('data-go="physician-region"') !== -1, rel + " lost data-go physician-region");
  assert(html.indexOf('data-go="physician"') !== -1, rel + " lost data-go physician");
  assert(html.indexOf('data-go="client"') !== -1, rel + " lost data-go client");

  var jobForm = html.split('id="job-interest-form"')[1] || "";
  jobForm = jobForm.split("</form>")[0] || "";
  ["name", "email", "phone", "specialty", "note"].forEach(function (field) {
    assert(jobForm.indexOf('name="' + field + '"') !== -1, rel + " job form lost " + field);
  });

  var meet = html.split('id="client-meeting-form"')[1] || html.split('name="agreement"')[0];
  /* meeting fields live on client-meeting view */
  var meeting = sliceRoute(html, "client-meeting", "confirm-client");
  ["name", "email", "phone", "role", "state", "agreement", "needs", "needNote", "region"].forEach(function (field) {
    assert(meeting.indexOf('name="' + field + '"') !== -1, rel + " meeting form lost " + field);
  });

  assert(html.indexOf("Step 2 of 5") !== -1, rel + " lost client step 2");
  assert(html.indexOf("Step 3 of 5") !== -1, rel + " lost client step 3");
}

checkFile("index.html");
checkFile("404.html");

["path-cand-specialty-clinic.jpg", "path-cand-nurses-station.jpg", "path-client-fqhc-exterior.jpg", "path-client-busy-hallway.jpg"].forEach(function (name) {
  var full = path.join(ROOT, "assets", name);
  assert(fs.existsSync(full), "missing asset " + name);
  assert(fs.statSync(full).size > 20000, name + " looks empty");
});

var app = read("js/app.js");
assert(app.indexOf('window.__AMP_BUILD = "2136-path-step-bgs"') !== -1, "app.js build stamp");
assert(app.indexOf('go("physician-region"') !== -1 || app.indexOf('go("physician-region",') !== -1, "physician-region navigation lost");
assert(app.indexOf('go("client-specialty"') !== -1 || app.indexOf('go("client-specialty",') !== -1, "client-specialty navigation lost");

var css = read("css/site.css");
assert(css.indexOf("amp-build:2136-path-step-bgs") !== -1, "css missing 2136 stamp");
assert(css.indexOf('url("../assets/path-cand-specialty-clinic.jpg?v=2136")') !== -1, "css missing specialty clinic plate");
assert(css.indexOf('url("../assets/path-cand-nurses-station.jpg?v=2136")') !== -1, "css missing nurses station plate");
assert(css.indexOf('url("../assets/path-client-fqhc-exterior.jpg?v=2136")') !== -1, "css missing FQHC plate");
assert(css.indexOf('url("../assets/path-client-busy-hallway.jpg?v=2136")') !== -1, "css missing hallway plate");
assert(css.indexOf('data-route="physician"] > .shot .pro-still') !== -1, "physician still not wired");
assert(css.indexOf('data-route="physician-region"] > .shot .pro-still') !== -1, "region still not wired");
assert(css.indexOf('data-route="client"] > .shot .pro-still') !== -1, "client still not wired");
assert(css.indexOf('data-route="client-specialty"] > .shot .pro-still') !== -1, "client-specialty still not wired");
assert(css.indexOf("rgba(21, 35, 50") !== -1, "navy veil missing");
assert(css.indexOf("background-size: cover, cover, cover") !== -1, "cover sizing missing");

console.log("path-step-2136.test.js ok");
