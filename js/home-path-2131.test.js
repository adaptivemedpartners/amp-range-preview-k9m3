/* Node smoke: 2131 mobile-only rank-card compact.
   Run: node js/home-path-2131.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2131-mobile-rank-cards -->") !== -1, rel + " missing 2131 stamp comment");
  assert(html.indexOf("amp-build 2131-mobile-rank-cards") !== -1, rel + " missing 2131 chip");
  assert(html.indexOf('href="css/site.css?v=2131"') !== -1, rel + " css not ?v=2131");
  assert(html.indexOf('src="js/app.js?v=2131"') !== -1, rel + " app.js not ?v=2131");
  assert(html.indexOf('id="rank-grid"') !== -1, rel + " lost rank grid");
  assert(html.indexOf("Looks good — continue") !== -1, rel + " lost rank continue");
}

checkFile("index.html");
checkFile("404.html");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2131-mobile-rank-cards"') !== -1, "app.js build stamp");
assert(app.indexOf("rank-card") !== -1 && app.indexOf("data-rank=") !== -1, "rank-card markup missing");
assert(app.indexOf("Practice feel") !== -1, "Practice feel copy should stay");
assert(app.indexOf("Life rhythm") !== -1, "Life rhythm copy should stay");
assert(app.indexOf("Income clarity") !== -1, "Income clarity copy should stay");
assert(app.indexOf("Most important") !== -1, "Most important affordance should stay");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2131-mobile-rank-cards") !== -1, "css missing 2131 stamp");
assert(/\.rank-card \{[\s\S]{0,180}min-height:\s*168px/.test(css), "desktop rank-card min-height should stay 168px");
assert(/\.rank-card \{[\s\S]{0,180}padding:\s*22px 16px 16px/.test(css), "desktop rank-card padding should stay");
assert(/\.rank-card h3 \{[\s\S]{0,120}clamp\(16px/.test(css), "desktop rank title clamp should stay");
assert(/\.rank-card p \{[\s\S]{0,180}-webkit-line-clamp:\s*4/.test(css), "desktop blurb clamp should stay 4");

var phoneAt = css.indexOf("Phone: vertical stack");
assert(phoneAt !== -1, "missing phone rank-stack comment");
var phone = css.slice(phoneAt, phoneAt + 2800);
assert(phone.indexOf(".rank-card") !== -1, "720px query missing rank-card");
assert(/min-height:\s*0/.test(phone), "phone rank-card missing min-height:0");
assert(/padding:\s*10px 12px 8px/.test(phone), "phone rank-card padding not compacted");
assert(/\.rank-card h3 \{[\s\S]{0,80}font-size:\s*15px/.test(phone), "phone rank title not smaller");
assert(/\.rank-card p \{[\s\S]{0,120}-webkit-line-clamp:\s*2/.test(phone), "phone blurb not clamped to 2 lines");
assert(/\.rank-card p \{[\s\S]{0,80}font-size:\s*12px/.test(phone), "phone blurb font not tighter");
assert(/\.rank-track[\s\S]{0,280}gap:\s*6px/.test(phone), "phone rank-track gap not tightened");
assert(/\.rank-num \{[\s\S]{0,120}font-size:\s*12\.5px/.test(phone), "phone rank badge should stay readable");
assert(/\.rank-card \.meta \{[\s\S]{0,80}font-size:\s*12px/.test(phone), "phone Most/Least meta should stay readable");

console.log("home-path-2131.test.js ok");
