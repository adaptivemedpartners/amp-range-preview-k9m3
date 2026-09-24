/* Node smoke: 2183 bridge headline under the hero sub, Inter + Allied teal,
   face crop on story media, and the step-4 pepper trio swap.
   Run: node js/v3-bridge-under-sub-2183.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var STAMP = "2183-bridge-under-sub-inter-teal-faces";

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
  assert(html.indexOf("<!-- amp-build:" + STAMP + " -->") !== -1, rel + " missing 2183 stamp");
  assert(html.indexOf("<!-- amp-build:2182-footer-wallpaper-bleed -->") !== -1, rel + " lost 2182 stamp");
  assert(html.indexOf("amp-build 2185-drop-nationwide-specialty-strip") !== -1, rel + " chip");
  assert(html.indexOf('href="css/site.css?v=2185"') !== -1, rel + " css cache");
  assert(html.indexOf('src="js/app.js?v=2185"') !== -1, rel + " app cache");
  assert(html.indexOf("?v=2182") === -1, rel + " still on 2182 cache");
  assert(html.indexOf("family=Caveat:wght@600;700") !== -1, rel + " Caveat stays");
  assert(html.indexOf("Source+Serif") === -1, rel + " Source Serif link removed");
  assert(html.indexOf("AMP-Mess-Soft") === -1, rel + " SoftMess stays out");

  var home = sliceBetween(html, 'data-route="home"', 'class="home-job2"', rel + " homepage");
  var copy = sliceBetween(home, 'class="v3-years-copy', "data-hero-ret-rotator", rel + " hero copy");
  var sub = copy.indexOf('class="v3-sub"');
  var stripInCopy = copy.indexOf("amp-zach-scope-strip");
  assert(sub !== -1 && stripInCopy !== -1 && sub < stripInCopy, rel + " specialty strip sits under .v3-sub");
  assert(copy.indexOf("Finding someone is one thing.") === -1, rel + " stay headline is not in the hero copy");

  var titleAt = home.indexOf('class="v3-stay-title"');
  var strip = home.indexOf("amp-zach-scope-strip");
  var bridge = home.indexOf('class="v3-stay-bridge"');
  var steps = home.indexOf('class="v3-bridge-steps"');
  var row = home.indexOf('class="v3-stats-parent"');
  assert(titleAt !== -1 && strip !== -1 && bridge !== -1 && steps !== -1 && row !== -1, rel + " stack markers");
  assert(strip < bridge && bridge < titleAt && titleAt < steps && steps < row, rel + " stay headline is back in the bridge");
  assert(home.indexOf(">UNDERSTAND<") !== -1 && home.indexOf(">FIND<") !== -1 && home.indexOf(">MATCH<") !== -1, rel + " 01-03 kept");
  assert(home.indexOf("A placement is a moment.") !== -1, rel + " stay sub kept with the steps");

  var jsonStart = home.indexOf('id="amp-still-there-examples">');
  var jsonEnd = home.indexOf("</script>", jsonStart);
  var examples = JSON.parse(home.slice(home.indexOf("[", jsonStart), jsonEnd));
  assert(examples.length === 10, rel + " rotator still 10 cards");
  assert(examples[0].facility === "Northcrest Medical Center", rel + " rotator first card unchanged");
  assert(examples.some(function (item) { return item.facility === "Peterson Regional Medical Center"; }), rel + " rotator still includes Peterson");

  var pepper = sliceBetween(html, 'class="client-ret-pepper client-ret-pepper--region"', "client-retained", rel + " pepper");
  assert(pepper.indexOf("amp-ret-days") === -1, rel + " pepper omits unknown day counts");
  assert(pepper.indexOf('data-ret="2015-peds"') === -1, rel + " old peds card gone");
  assert(pepper.indexOf('data-ret="2018-fm"') === -1, rel + " old family medicine card gone");
  assert(pepper.indexOf('data-ret="2021-ks"') === -1, rel + " old kansas card gone");
  assert(pepper.indexOf("Pediatrician") === -1, rel + " old pediatrician copy gone");
  assert(pepper.indexOf("Nebraska") === -1, rel + " old nebraska copy gone");

  var cards = [
    {
      id: "2013-em-vcu",
      year: "2013",
      role: "Emergency Medicine",
      place: "VCU Community Memorial Hospital · South Hill, VA",
      footer: "13 YEARS LATER. STILL THERE.",
      img: "assets/story-2015-peds-ne.jpg?v=2185",
      alt: "Emergency Medicine placement still serving at VCU Community Memorial Hospital",
      desktop: true
    },
    {
      id: "2016-dds-winn",
      year: "2016",
      role: "Dentistry",
      place: "Winn Community Health Center · Winnfield, LA",
      footer: "9 YEARS LATER. STILL THERE.",
      img: "assets/story-2018-fm-ne-cah.jpg?v=2185",
      alt: "Dentistry placement still serving at Winn Community Health Center"
    },
    {
      id: "2017-vasc-peterson",
      year: "2017",
      role: "Vascular Surgery",
      place: "Peterson Regional Medical Center · Kerrville, TX",
      footer: "9 YEARS LATER. STILL THERE.",
      img: "assets/story-2021-physician-ks.jpg?v=2185",
      alt: "Vascular Surgery placement still serving at Peterson Regional Medical Center"
    }
  ];
  var cursor = 0;
  cards.forEach(function (card) {
    var at = pepper.indexOf('data-ret="' + card.id + '"', cursor);
    assert(at !== -1, rel + " missing " + card.id);
    var article = pepper.lastIndexOf("<article", at);
    var next = pepper.indexOf("<article", at + 10);
    var slice = pepper.slice(article, next === -1 ? pepper.length : next);
    assert(slice.indexOf(">" + card.year + "<") !== -1, rel + " " + card.id + " year");
    assert(slice.indexOf(">" + card.role + "<") !== -1, rel + " " + card.id + " role");
    assert(slice.indexOf(card.place) !== -1, rel + " " + card.id + " place");
    assert(slice.indexOf(card.footer) !== -1, rel + " " + card.id + " footer");
    assert(slice.indexOf(card.img) !== -1, rel + " " + card.id + " photo");
    assert(slice.indexOf(card.alt) !== -1, rel + " " + card.id + " alt");
    if (card.desktop) assert(slice.indexOf("amp-ret-card--desktop") !== -1, rel + " first card stays desktop");
    cursor = at + 1;
  });
}

checkPage("index.html");
checkPage("404.html");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(css.indexOf("/* amp-build:" + STAMP + " */") !== -1, "css 2183 stamp kept");
assert(css.indexOf("========== amp-build:" + STAMP) !== -1, "css 2183 block");
assert(app.indexOf('window.__AMP_BUILD = "2185-drop-nationwide-specialty-strip"') !== -1, "app build stamp");
assert(css.indexOf("Source Serif") === -1, "Source Serif family gone from css");

var titleRule = css.slice(css.indexOf(".v3-stay-title {"), css.indexOf(".v3-stay-title span"));
assert(titleRule.indexOf("font-family: var(--font);") !== -1, "stay title uses the site stack");
assert(titleRule.indexOf("font-weight: 560;") !== -1, "stay title weight stays");
assert(titleRule.indexOf("letter-spacing: -0.022em;") !== -1, "stay title tracking stays");

var b2183 = css.slice(css.indexOf("========== amp-build:" + STAMP));
assert(b2183.indexOf(".home-stage.v3-home .v3-years-copy .v3-stay-title") !== -1, "title lives in the copy column");
assert(b2183.indexOf("font-family: var(--font);") !== -1, "2183 keeps Inter on the title");
assert(b2183.indexOf(".v3-stay-mint") !== -1 && b2183.indexOf("color: var(--teal);") !== -1, "mint line is Allied teal");
assert(b2183.indexOf("#6BE0AD") === -1, "teal token, not a raw hex after 2171");
assert(b2183.indexOf("#8fcebb") === -1, "old mint hex stays out of 2183");
assert(b2183.indexOf("background-position: center top;") !== -1, "placement media bias");
assert(b2183.indexOf("background-size: cover;") !== -1, "placement media still covers");
assert(b2183.indexOf("object-position: center top;") !== -1, "pepper and still photos bias to the top");
assert(b2183.indexOf("overflow: hidden") === -1, "2183 does not trap scroll");
assert(css.indexOf(".site-footer {\n  background: #0b1220; color: #94a3b8; padding: 36px 20px 48px;") !== -1, "footer padding lock");

console.log("ok — 2183 bridge under the sub, teal, faces, pepper trio");
