/* Node smoke: 2186 drop Nationwide + trailing bar from specialty strip.
   Keep strip under the hero sub; sky bridge layout from 2184 stays.
   Run: node js/v3-drop-nationwide-2186.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var STAMP = "2186-specialty-ctx-photo-taller";
var PREV = "2184-specialty-under-sub-sky-bridge-restore";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function sliceBetween(html, startNeedle, endNeedle, label) {
  var start = html.indexOf(startNeedle);
  var end = html.indexOf(endNeedle, start + startNeedle.length);
  assert(start !== -1 && end !== -1 && end > start, "could not isolate " + label);
  return html.slice(start, end);
}

function checkPage(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:" + STAMP + " -->") !== -1, rel + " missing 2186 stamp");
  assert(html.indexOf("<!-- amp-build:" + PREV + " -->") !== -1, rel + " lost 2184 stamp");
  assert(html.indexOf("amp-build " + STAMP) !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2186"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/app.js?v=2186"') !== -1, rel + " app cache");
  assert(html.indexOf("?v=2184") === -1, rel + " still on 2184 cache");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', rel + " homepage");
  var copy = sliceBetween(home, 'class="v3-years-copy', "data-hero-ret-rotator", rel + " hero copy");
  var stripAt = copy.indexOf("amp-zach-scope-strip");
  assert(stripAt !== -1, rel + " strip in copy");
  var stripEnd = copy.indexOf("</p>", stripAt);
  var strip = copy.slice(stripAt, stripEnd);
  assert(strip.indexOf("Nationwide") === -1, rel + " Nationwide removed");
  assert(strip.indexOf('aria-label="Who we place: Physicians, APPs, Dental, Behavioral Health, Allied Health"') !== -1, rel + " aria");
  assert(strip.indexOf("Allied Health</span>") !== -1, rel + " Allied is last item");
  assert(strip.indexOf("Allied Health<span class=\"v3-zach-pipe\">") === -1, rel + " no trailing pipe");
  ["Physicians", "APPs", "Dental", "Behavioral Health", "Allied Health"].forEach(function (label) {
    assert(strip.indexOf(label) !== -1, rel + " missing " + label);
  });
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css header stamp");
assert(css.indexOf("========== amp-build:" + STAMP) !== -1, "css 2186 block");
assert(css.indexOf("========== amp-build:" + PREV) !== -1, "css 2184 block kept");
assert(app.indexOf('window.__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");

console.log("ok — 2186 Nationwide + trailing bar dropped from specialty strip");
