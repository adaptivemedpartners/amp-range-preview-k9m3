/* Node smoke: 2137 Market Intelligence smoky whiteboard BG.
   Run: node js/mi-bg-2137.test.js
   HARD LOCK: no physician/client funnel changes — this test only asserts MI/ridge
   entry chrome + cache-bust, and that funnel path BGs / stairs stay put. */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function checkFile(rel) {
  var html = read(rel);
  assert(html.indexOf("<!-- amp-build:2137-mi-bg-whiteboard-smoky -->") !== -1, rel + " missing 2137 stamp comment");
  assert(html.indexOf("amp-build 2137-mi-bg-whiteboard-smoky") !== -1, rel + " missing 2137 chip");
  assert(html.indexOf('href="css/site.css?v=2137"') !== -1, rel + " css not ?v=2137");
  assert(html.indexOf('src="js/app.js?v=2137"') !== -1, rel + " app.js not ?v=2137");
  assert(html.indexOf("?v=2136") === -1, rel + " leftover ?v=2136");
  assert(html.indexOf('data-route="mi-lite"') !== -1, rel + " lost mi-lite landing");
  assert(html.indexOf('data-route="mi-lite-app"') !== -1, rel + " lost ridge workbench");
  assert(html.indexOf('data-route="mi-lite-portal"') !== -1, rel + " lost ridge pricing");
  assert(html.indexOf('data-route="mi-lite-login"') !== -1, rel + " lost ridge verify");
  /* HARD LOCK — funnel doors / stairs still present, copy untouched */
  assert(html.indexOf('data-route="physician"') !== -1, rel + " lost physician funnel");
  assert(html.indexOf('data-route="client"') !== -1, rel + " lost client funnel");
  assert(html.indexOf("Are you a provider looking for a job?") !== -1, rel + " funnel provider label changed");
  assert(html.indexOf("Are you a medical facility looking to hire?") !== -1, rel + " funnel facility label changed");
  assert(html.indexOf("Pick specialty, then state. Then the 1×1 opens.") !== -1, rel + " ridge walk copy changed");
}

checkFile("index.html");
checkFile("404.html");

var app = read("js/app.js");
assert(app.indexOf('window.__AMP_BUILD = "2137-mi-bg-whiteboard-smoky"') !== -1, "app.js build stamp");
assert(app.indexOf("renderMILite") !== -1, "MI render still present");

var css = read("css/site.css");
assert(css.indexOf("amp-build:2137-mi-bg-whiteboard-smoky") !== -1, "css missing 2137 stamp");
assert(css.indexOf('url("../assets/mi-bg-whiteboard-smoky.jpg?v=2137")') !== -1, "css missing smoky MI jpg");
assert(css.indexOf("?v=2136") === -1, "css leftover ?v=2136");
["mi-lite", "mi-lite-portal", "mi-lite-login", "mi-lite-app"].forEach(function (route) {
  assert(css.indexOf('data-route="' + route + '"') !== -1, "css missing route " + route);
});
assert(css.indexOf("filter: blur(0.6px)") !== -1, "MI BG missing smoky blur");
assert(/rgba\(21,\s*35,\s*50/.test(css), "navy veil rgba missing");
/* Not neon AI — MI rule must not reintroduce the cyan radial glow */
var miAt = css.indexOf("amp-build:2137-mi-bg-whiteboard-smoky — MI / ridge entry");
assert(miAt !== -1, "missing MI CSS block");
var miBlock = css.slice(miAt);
assert(miBlock.indexOf("120, 196, 229") === -1, "MI block still uses neon cyan radial");
assert(miBlock.indexOf("120,196,229") === -1, "MI block still uses neon cyan radial (tight)");

/* Path BGs stay — HARD LOCK no funnel theme rewrite */
assert(css.indexOf("amp-path-cand-specialty.jpg") !== -1, "physician path BG removed");
assert(css.indexOf("amp-path-client-fqhc.jpg") !== -1, "client path BG removed");

var jpg = path.join(ROOT, "assets/mi-bg-whiteboard-smoky.jpg");
assert(fs.existsSync(jpg), "assets/mi-bg-whiteboard-smoky.jpg missing");
var bytes = fs.readFileSync(jpg);
assert(bytes[0] === 0xff && bytes[1] === 0xd8, "MI bg is not a JPEG");
assert(bytes.length > 20000 && bytes.length < 400000, "MI bg size should stay a soft smoky jpg, not a huge crisp file");

console.log("mi-bg-2137.test.js ok");
