/* Node smoke: 2174 real still-there facility → specialty examples on client path.
   Run: node js/v3-client-facility-examples-2174.test.js */
var fs = require("fs");
var path = require("path");
var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
var content = fs.readFileSync(path.join(ROOT, "js/content.js"), "utf8");
var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");

assert(app.indexOf('window.__AMP_BUILD = "2181-still-there-swipe"') !== -1, "app build stamp");
assert(html.indexOf("amp-build:2174-facility-still-there-examples") !== -1, "html build stamp");
assert(css.indexOf("amp-build:2174-facility-still-there-examples") !== -1, "css build stamp");
assert(html.indexOf("?v=2181") !== -1, "html cache bust");
assert(html.indexOf("webflow") === -1 && html.indexOf("Webflow") === -1, "no Webflow");

/* Facility → unique specialty wiring (scrubbed, no physician names) */
var wired = [
  ["Wayne Memorial Health System", "Family Medicine", "fqhc"],
  ["Frio Regional Hospital", "Family Medicine w/ OB", "cah"],
  ["VCU Community Memorial Hospital", "Emergency Medicine", "community"],
  ["Baptist Regional Medical Center", "General Surgery", "system"],
  ["Family Services of Chemung County", "Psychiatric NP", "bh"],
  ["Alliance Pediatrics", "Pediatrics", "group"]
];
wired.forEach(function (row) {
  assert(app.indexOf(row[0]) !== -1, "missing facility example " + row[0]);
  assert(app.indexOf(row[1]) !== -1, "missing specialty text " + row[1]);
});

assert(app.indexOf("V3_FACILITY_STORY") !== -1, "facility story map");
assert(app.indexOf("specialtyIds") !== -1, "specialty id locks on stories");
assert(app.indexOf("function bindClientFacilityContinue") !== -1, "continue binder remains");
assert(app.indexOf('go("client-specialty", { trail: true })') !== -1, "select then Continue");

/* Unique lead specialty per facility in ranks */
function firstRankId(fac) {
  var key = '"' + fac + '":';
  var i = content.indexOf(key, content.indexOf("facilitySpecialtyRanks"));
  assert(i !== -1, "ranks missing " + fac);
  var slice = content.slice(i, i + 500);
  var m = slice.match(/\{\s*id:\s*"([^"]+)"/);
  assert(m, "first id for " + fac);
  return m[1];
}
assert(firstRankId("fqhc") === "fm", "fqhc lead fm");
assert(firstRankId("cah") === "family_medicine_with_ob", "cah lead FMwOB");
assert(firstRankId("community") === "emergency_medicine", "community lead EM");
assert(firstRankId("system") === "surgery_general", "system lead GS");
assert(firstRankId("bh") === "nurse_practitioner_psychiatry", "bh lead PMHNP");
assert(firstRankId("group") === "pediatrics_general", "group lead peds");

var leads = ["fm", "family_medicine_with_ob", "emergency_medicine", "surgery_general", "nurse_practitioner_psychiatry", "pediatrics_general"];
assert(new Set(leads).size === leads.length, "lead specialties must be unique");

/* Prior locks */
assert(css.indexOf("#client-spec-continue") !== -1, "specialty continue addressable");
assert(css.indexOf("#client-facility-continue") !== -1, "facility continue addressable");
assert(css.indexOf("grid-auto-rows: minmax(112px, auto)") !== -1, "specialty cards stay visible");

console.log("ok — 2174 facility still-there examples (unique specialty each)");
