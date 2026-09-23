/* Node smoke: 2175 homepage partner grid swaps IPHCA and VCU
   for Oklahoma and Tennessee Primary Care Associations.
   2174 facility still-there examples stay.
   Run: node js/v3-partners-ok-tn-2175.test.js */
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

var expected = [
  ["assets/partners/adventist-health.png?v=2176", "Adventist Health"],
  ["assets/partners/okpca.png?v=2176", "Oklahoma Primary Care Association"],
  ["assets/partners/tenet-health.png?v=2176", "Tenet Health"],
  ["assets/partners/chs.png?v=2176", "Community Health Systems"],
  ["assets/partners/tpca.png?v=2176", "Tennessee Primary Care Association"],
  ["assets/partners/shriners.png?v=2176", "Shriners Hospitals for Children"]
];

function checkPartners(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2175-ok-tn-pca-partners -->") !== -1, rel + " missing 2175 stamp");
  assert(html.indexOf("<!-- amp-build:2174-facility-still-there-examples -->") !== -1, rel + " lost 2174 stamp");
  assert(html.indexOf("amp-build 2176-specialty-still-there-examples") !== -1, rel + " chip");
  assert(html.indexOf("?v=2174") === -1, rel + " still on 2174 cache");
  var grid = sliceBetween(html, 'class="home-partners-grid"', "</div>", rel + " partners");
  var logos = grid.match(/<img class="partner-logo"[^>]*>/g) || [];
  assert(logos.length === 6, rel + " expected 6 partner logos, got " + logos.length);
  logos.forEach(function (tag, i) {
    assert(tag.indexOf(expected[i][0]) !== -1, rel + " logo " + i + " src");
    assert(tag.indexOf('alt="' + expected[i][1] + '"') !== -1, rel + " logo " + i + " alt");
  });
  assert(grid.indexOf("iphca.png") === -1, rel + " still has IPHCA");
  assert(grid.indexOf("vcu.png") === -1, rel + " still has VCU logo");
  assert(html.indexOf("assets/partners/okpca.png") !== -1, rel + " missing OKPCA");
  assert(html.indexOf("assets/partners/tpca.png") !== -1, rel + " missing TPCA");
}

checkPartners("index.html");
checkPartners("404.html");

assert(fs.existsSync(path.join(ROOT, "assets/partners/okpca.png")), "okpca.png missing");
assert(fs.existsSync(path.join(ROOT, "assets/partners/tpca.png")), "tpca.png missing");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(css.indexOf("amp-build:2175-ok-tn-pca-partners") !== -1, "css 2175 stamp");
assert(css.indexOf("amp-build:2174-facility-still-there-examples") !== -1, "css lost 2174 stamp");
assert(app.indexOf('__AMP_BUILD = "2176-specialty-still-there-examples"') !== -1, "app build stamp");
assert(app.indexOf("V3_FACILITY_STORY") !== -1, "2174 facility stories removed");
assert(app.indexOf("amp-build:2174 — real still-there") !== -1, "2174 facility comment removed");

require("./v3-client-facility-examples-2174.test.js");
require("./v3-confirm-guide-2173.test.js");

console.log("ok — 2175 partner grid is Adventist, OKPCA, Tenet, CHS, TPCA, Shriners");
