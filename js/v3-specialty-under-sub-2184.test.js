/* Node smoke: 2184 specialty strip under the hero sub.
   Finding-someone headline returns to the bridge with the 01–03 steps.
   Stay line stays Inter; the second line is palette sky.
   Run: node js/v3-specialty-under-sub-2184.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var STAMP = "2184-specialty-under-sub-sky-bridge-restore";

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
  assert(html.indexOf("<!-- amp-build:" + STAMP + " -->") !== -1, rel + " missing 2184 stamp");
  assert(html.indexOf("<!-- amp-build:2183-bridge-under-sub-inter-teal-faces -->") !== -1, rel + " lost 2183 stamp");
  assert(html.indexOf("<!-- amp-build:2182-footer-wallpaper-bleed -->") !== -1, rel + " lost 2182 stamp");
  assert(html.indexOf("amp-build 2185-drop-nationwide-specialty-strip") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2185"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/app.js?v=2185"') !== -1, rel + " app cache");
  assert(html.indexOf("?v=2184") === -1, rel + " still on 2184 cache");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', rel + " homepage");
  var copy = sliceBetween(home, 'class="v3-years-copy', "data-hero-ret-rotator", rel + " hero copy");
  var sub = copy.indexOf('class="v3-sub"');
  var strip = copy.indexOf("amp-zach-scope-strip");
  assert(sub !== -1 && strip !== -1 && sub < strip, rel + " strip under the hero sub");
  assert(copy.indexOf("Finding someone is one thing.") === -1, rel + " stay headline left the hero");
  assert(copy.indexOf("Physicians") !== -1 && copy.indexOf("Allied Health") !== -1, rel + " strip labels in the copy column");
  assert(copy.indexOf("Nationwide") === -1, rel + " Nationwide dropped");

  var bridge = sliceBetween(home, 'class="v3-stay-bridge"', 'class="v3-stats-parent"', rel + " bridge");
  var title = bridge.indexOf('class="v3-stay-title"');
  var mint = bridge.indexOf('class="v3-stay-mint"');
  var steps = bridge.indexOf('class="v3-bridge-steps"');
  assert(title !== -1 && title < mint && mint < steps, rel + " stay headline leads the bridge steps");
  assert(bridge.indexOf("Finding someone is one thing.") !== -1, rel + " bridge line 1");
  assert(bridge.indexOf("Finding someone who stays is another.") !== -1, rel + " bridge line 2");
  assert(bridge.indexOf("amp-zach-scope-strip") === -1, rel + " strip is not in the bridge");
  assert(bridge.indexOf(">UNDERSTAND<") !== -1 && bridge.indexOf(">MATCH<") !== -1, rel + " steps kept");

  var pepper = sliceBetween(html, 'class="client-ret-pepper client-ret-pepper--region"', "client-retained", rel + " pepper");
  assert(pepper.indexOf('data-ret="2013-em-vcu"') !== -1, rel + " VCU card");
  assert(pepper.indexOf('data-ret="2016-dds-winn"') !== -1, rel + " Winn card");
  assert(pepper.indexOf('data-ret="2017-vasc-peterson"') !== -1, rel + " Peterson card");
  assert(pepper.indexOf("amp-ret-days") === -1, rel + " pepper still omits day counts");
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(css.indexOf("/* amp-build:2185-drop-nationwide-specialty-strip */") === 0, "css header stamp");
assert(css.indexOf("========== amp-build:" + STAMP) !== -1, "css 2184 block kept");
assert(app.indexOf('window.__AMP_BUILD = "2185-drop-nationwide-specialty-strip"') !== -1, "app build stamp");

var b2184 = css.slice(css.indexOf("========== amp-build:" + STAMP));
assert(b2184.indexOf(".home-stage.v3-home .v3-years-copy .v3-zach-scope.amp-zach-scope-strip") !== -1, "strip lives in the copy column");
assert(b2184.indexOf("font-family: var(--font);") !== -1, "stay headline stays Inter");
assert(b2184.indexOf("color: var(--sky);") !== -1, "stay line is palette sky");
assert(b2184.indexOf("#6BE0AD") === -1, "allied mint hex stays off this line");
assert(b2184.indexOf("#78C4E5") === -1, "sky comes from the token");
assert(b2184.indexOf("minmax(280px, 0.78fr) minmax(560px, 1.4fr)") !== -1, "bridge columns restored");
assert(b2184.indexOf("grid-template-columns: 1fr;") !== -1, "phone bridge still stacks");
assert(b2184.indexOf("overflow: hidden") === -1, "2184 does not trap scroll");
assert(css.indexOf("object-position: center top;") !== -1, "face crop kept");
assert(css.indexOf(".site-footer {\n  background: #0b1220; color: #94a3b8; padding: 36px 20px 48px;") !== -1, "footer padding lock");

console.log("ok — 2184 specialty strip under the sub, sky bridge restored");
