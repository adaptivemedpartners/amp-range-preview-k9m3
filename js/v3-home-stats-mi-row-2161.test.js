/* Node smoke: 2161 stats/MI row — MI panel + 4 pills; doors below.
   Run: node js/v3-home-stats-mi-row-2161.test.js */
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

function checkHtml(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2161-stats-mi-row -->") !== -1, rel + " missing 2161 stamp");
  assert(html.indexOf('href="css/site.css?v=2161"') !== -1, rel + " css cache bust");
  assert(html.indexOf('src="js/app.js?v=2161"') !== -1, rel + " app cache bust");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', "homepage");
  assert(home.indexOf("v3-stats-mi") !== -1, rel + " stats/MI row");
  assert(home.indexOf("v3-stats-mi-panel") !== -1, rel + " MI panel");
  assert(home.indexOf(">Market Intelligence<") !== -1, rel + " MI label");
  assert(home.indexOf("<strong>87%</strong>") !== -1, rel + " 87% pill");
  assert(home.indexOf("<strong>1.7</strong>") !== -1, rel + " 1.7 pill");
  assert(home.indexOf("<strong>700+</strong>") !== -1, rel + " 700+ pill");
  assert(home.indexOf("<strong>16</strong>") !== -1, rel + " 16 years pill");
  assert(home.indexOf("years since 2010") !== -1, rel + " 16 years label");
  assert(home.indexOf("home-pro-bg") !== -1, rel + " wallpaper layer");
  assert(/\bmountain\b/i.test(home) === false, rel + " mountain language");

  var statsIdx = home.indexOf('class="v3-stats-mi"');
  var doorsIdx = home.indexOf('id="home-doors"');
  assert(statsIdx !== -1 && doorsIdx !== -1 && statsIdx < doorsIdx, rel + " doors must be below stats/MI row");
  assert(home.indexOf('class="v3-mi"') === -1, rel + " legacy full-width MI strip must be gone");
}

function checkCss() {
  var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
  assert(css.indexOf("amp-build:2161-stats-mi-row") !== -1, "css missing 2161 block");
  assert(css.indexOf(".v3-stats-mi") !== -1, "css missing stats-mi");
  assert(css.indexOf("grid-template-columns: minmax(150px, 0.25fr) minmax(0, 0.75fr)") !== -1, "css missing 25/75 grid");
  assert(css.indexOf("position: fixed") !== -1, "css keep fixed wallpaper");
  assert(css.indexOf('url("../assets/home-hero-clinic-consult.jpg?v=2161")') !== -1, "css wallpaper cache");
}

function checkApp() {
  var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
  assert(app.indexOf('__AMP_BUILD = "2161-stats-mi-row"') !== -1, "app build stamp");
}

checkHtml("index.html");
checkHtml("404.html");
checkCss();
checkApp();
console.log("ok — 2161 stats/MI row + doors below");
