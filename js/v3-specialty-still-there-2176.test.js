/* Node smoke: 2176 still-there card per client specialty.
   Facility cards from 2174 stay. Specialty lookup no longer falls
   through to the 87% proof when the facility story's specialtyIds miss.
   Run: node js/v3-specialty-still-there-2176.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function sliceBraces(src, openAt) {
  var depth = 0;
  var quote = null;
  var escape = false;
  for (var j = openAt; j < src.length; j++) {
    var c = src.charAt(j);
    if (quote) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (c === "/" && src.charAt(j + 1) === "/") {
      var nl = src.indexOf("\n", j);
      j = nl === -1 ? src.length : nl;
      continue;
    }
    if (c === "/" && src.charAt(j + 1) === "*") {
      var end = src.indexOf("*/", j + 2);
      j = end === -1 ? src.length : end + 1;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(openAt, j + 1);
    }
  }
  throw new Error("unclosed brace at " + openAt);
}

function extractObject(src, marker) {
  var i = src.indexOf(marker);
  assert(i !== -1, "missing " + marker);
  var open = src.indexOf("{", i);
  return sliceBraces(src, open);
}

function extractFunction(src, name) {
  var marker = "function " + name + "(";
  var i = src.indexOf(marker);
  assert(i !== -1, "missing " + name);
  var open = src.indexOf("{", i);
  return src.slice(i, open) + sliceBraces(src, open);
}

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
var content = fs.readFileSync(path.join(ROOT, "js/content.js"), "utf8");
var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var fallback = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");

assert(app.indexOf('window.__AMP_BUILD = "2178-hero-first-stack"') !== -1, "app build stamp");
assert(html.indexOf("<!-- amp-build:2176-specialty-still-there-examples -->") !== -1, "html stamp");
assert(fallback.indexOf("<!-- amp-build:2176-specialty-still-there-examples -->") !== -1, "404 stamp");
assert(css.indexOf("amp-build:2176-specialty-still-there-examples") !== -1, "css stamp");
assert(html.indexOf("amp-build 2178-hero-first-stack") !== -1, "chip");
assert(html.indexOf("?v=2178") !== -1, "cache bust");
assert(html.indexOf("?v=2176") === -1, "html still on 2176 cache");
assert(html.indexOf("?v=2175") === -1, "html still on 2175 cache");
assert(fallback.indexOf("?v=2175") === -1, "404 still on 2175 cache");
assert(html.indexOf("<!-- amp-build:2175-ok-tn-pca-partners -->") !== -1, "2175 stamp kept");
assert(html.indexOf("<!-- amp-build:2174-facility-still-there-examples -->") !== -1, "2174 stamp kept");
assert(html.indexOf("assets/partners/okpca.png?v=2178") !== -1, "OK PCA logo kept");
assert(html.indexOf("assets/partners/tpca.png?v=2178") !== -1, "TN PCA logo kept");
assert(app.indexOf("V3_FACILITY_STORY") !== -1, "facility stories stay");
assert(app.indexOf("V3_SPECIALTY_STORY") !== -1, "specialty story map");

var V3_RET = eval("(" + extractObject(app, "var V3_RET = ") + ")");
var V3_FACILITY_STORY = eval("(" + extractObject(app, "var V3_FACILITY_STORY = ") + ")");
var V3_SPECIALTY_STORY = eval("(" + extractObject(app, "var V3_SPECIALTY_STORY = ") + ")");
var api = new Function(
  "V3_RET",
  "V3_FACILITY_STORY",
  "V3_SPECIALTY_STORY",
  "var state = { facility: '' };\n" +
    extractFunction(app, "v3StoryForFacility") + "\n" +
    extractFunction(app, "v3StoryMatchesSpecialty") + "\n" +
    extractFunction(app, "v3StoryForSpecialty") + "\n" +
    "return { state: state, v3StoryForFacility: v3StoryForFacility, v3StoryForSpecialty: v3StoryForSpecialty };"
)(V3_RET, V3_FACILITY_STORY, V3_SPECIALTY_STORY);

var ranksSrc = extractObject(content, "facilitySpecialtyRanks:");
var rankIds = {};
var idRe = /\bid:\s*"([^"]+)"/g;
var m;
while ((m = idRe.exec(ranksSrc))) rankIds[m[1]] = true;
var rankList = Object.keys(rankIds);
assert(rankList.length > 10, "parsed specialty ranks");
rankList.forEach(function (id) {
  assert(Object.prototype.hasOwnProperty.call(V3_SPECIALTY_STORY, id), "map missing rank id " + id);
  assert(V3_RET[V3_SPECIALTY_STORY[id]], "map key has no story " + id);
});

["fm", "obg", "gi", "neuro", "dental", "neurology"].forEach(function (id) {
  assert(V3_SPECIALTY_STORY[id], "map missing " + id);
});

assert(api.v3StoryForSpecialty("") === null, "empty specialty waits");
assert(api.v3StoryForSpecialty("custom:rural clinic") === V3_RET.proof, "custom stays on proof");

var fm = api.v3StoryForSpecialty("fm");
assert(fm.role.indexOf("Wayne Memorial") !== -1, "fm facility");
assert(fm.year.indexOf("Family Medicine") !== -1, "fm specialty line");
assert(JSON.stringify(fm).indexOf("87%") === -1, "fm is not the generic proof");

/* Multi-specialty / Group facility story is Alliance Pediatrics, which does not list fm. */
api.state.facility = "group";
var groupFm = api.v3StoryForSpecialty("fm");
assert(groupFm === fm, "group + family medicine uses the fm card");
assert(groupFm.role.indexOf("Wayne Memorial") !== -1, "group + fm is Wayne");
assert(api.v3StoryForFacility("group").role.indexOf("Alliance Pediatrics") !== -1, "facility card stays Alliance");
assert(groupFm !== api.v3StoryForFacility("group"), "specialty path is not the facility card");

api.state.facility = "";
var obg = api.v3StoryForSpecialty("obg");
assert(obg.role.indexOf("Christ Community Health Services") !== -1, "obg facility");
assert(obg.year.indexOf("OB/GYN") !== -1, "obg year");
var gi = api.v3StoryForSpecialty("gi");
assert(gi.role.indexOf("AdventHealth Medical Group") !== -1, "gi facility");
assert(gi.year.indexOf("Gastroenterology") !== -1, "gi year");
var dental = api.v3StoryForSpecialty("dental");
assert(dental.role.indexOf("Winn Community Health Center") !== -1, "dental facility");
var neuro = api.v3StoryForSpecialty("neuro");
var neurology = api.v3StoryForSpecialty("neurology");
assert(neuro === neurology, "neuro and neurology share a card");
assert(neuro.role.indexOf("Baptist Health - Richmond") !== -1, "neuro facility");
assert(neuro.year.indexOf("Neurology") !== -1, "neuro year");

var add = api.v3StoryForSpecialty("psychiatry_addiction_medicine");
var child = api.v3StoryForSpecialty("psychiatry_child_and_adolescent");
var geri = api.v3StoryForSpecialty("psychiatry_geriatric");
var psych = api.v3StoryForSpecialty("psychiatry_general");
assert(add === psych && child === psych && geri === psych, "psych subtypes reuse Anniston");
assert(add.year.indexOf("Psychiatry") !== -1, "psych year line");
assert(add.role.indexOf("Regional Medical Center") !== -1, "anniston facility");
assert(JSON.stringify(add).indexOf("Adult Medicine") === -1, "not labeled Adult Medicine");

var ednp = api.v3StoryForSpecialty("nurse_practitioner_emergency_medicine");
assert(ednp.role.indexOf("Northern Cochise") !== -1, "ed np reuses Cochise");
assert(ednp.year.indexOf("Nurse Practitioner") !== -1, "honest NP year line");
assert(ednp.year.indexOf("ED NP") === -1, "year line does not invent ED NP");

var derm = api.v3StoryForSpecialty("dermatology");
assert(derm === V3_RET.proof, "dermatology stays on proof");
assert(derm.role.indexOf("87%") !== -1, "dermatology gap is the generic proof");

assert(api.v3StoryForFacility("fqhc").role.indexOf("Wayne Memorial") !== -1, "fqhc facility card");
assert(api.v3StoryForFacility("cah").role.indexOf("Frio Regional") !== -1, "cah facility card");

console.log("ok — 2176 specialty still-there examples (" + rankList.length + " ranked ids)");
