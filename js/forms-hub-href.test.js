/* Node smoke: forms hub pills stay under the GH Pages project folder.
   Run: node js/forms-hub-href.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var EXPECTED = {
  "form-candidate-authorization": "candidate-authorization",
  "form-interview-expense": "interview-expense-form",
  "form-easy-pay": "easy-pay-authorization"
};
var PROJECT = "/amp-range-preview-k9m3";
var HOST = "https://adaptivemedpartners.github.io";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function hubHrefs(html) {
  var found = {};
  html.split("\n").forEach(function (line) {
    if (line.indexOf("data-go=\"form-") === -1 || line.indexOf("<a ") === -1) return;
    var go = line.match(/data-go="([^"]+)"/);
    var href = line.match(/href="([^"]+)"/);
    if (go && EXPECTED[go[1]] && href) found[go[1]] = href[1];
  });
  return found;
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  var hrefs = hubHrefs(html);
  Object.keys(EXPECTED).forEach(function (route) {
    var href = hrefs[route];
    assert(href, rel + " missing hub link for " + route);
    assert(href.charAt(0) !== "/", rel + " " + route + " is root-absolute: " + href);
    assert(href.indexOf("://") === -1, rel + " " + route + " left the site: " + href);
    assert(href === EXPECTED[route], rel + " " + route + " unexpected href " + href);

    /* SPA writes /forms with no trailing slash; relative href is a sibling. */
    [
      PROJECT + "/",
      PROJECT + "/forms",
      PROJECT + "/index.html"
    ].forEach(function (from) {
      var resolved = new URL(href, HOST + from);
      assert(
        resolved.pathname === PROJECT + "/" + EXPECTED[route],
        rel + " " + route + " from " + from + " → " + resolved.pathname
      );
    });
  });
}

checkFile("index.html");
checkFile("404.html");

/* Existing rewriteGoHrefs helper prefixes GH_PAGES_BASE when on the project site. */
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('var GH_PAGES_BASE = "/amp-range-preview-k9m3"') !== -1, "GH_PAGES_BASE missing");
assert(app.indexOf("function detectBasePath()") !== -1, "detectBasePath missing");
assert(app.indexOf("function rewriteGoHrefs()") !== -1, "rewriteGoHrefs missing");
assert(app.indexOf('src.indexOf(GH_PAGES_BASE + "/")') !== -1, "script-src base fallback missing");

console.log("forms-hub-href.test.js ok");
