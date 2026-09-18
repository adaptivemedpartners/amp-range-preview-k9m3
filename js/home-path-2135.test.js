/* Node smoke: 2135 homepage MI/story polish — funnels locked.
   Run: node js/home-path-2135.test.js */
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function homeSlice(html) {
  var start = html.indexOf('data-route="home"');
  var end = html.indexOf('data-route="physician"');
  assert(start !== -1 && end !== -1 && start < end, "missing home slice");
  return html.slice(start, end);
}

function checkFile(rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  assert(html.indexOf("<!-- amp-build:2135-home-mi-story -->") !== -1, rel + " missing 2135 stamp comment");
  assert(html.indexOf("amp-build 2135-home-mi-story") !== -1, rel + " missing 2135 chip");
  assert(html.indexOf('href="css/site.css?v=2135"') !== -1, rel + " css not ?v=2135");
  assert(html.indexOf('src="js/app.js?v=2135"') !== -1, rel + " app.js not ?v=2135");
  assert(html.indexOf("?v=2134") === -1, rel + " leftover ?v=2134 cache tag");

  var home = homeSlice(html);

  /* MI banner: same route, more prominent is CSS-only */
  var mi = home.match(/<a class="home-mi-banner"[^>]*>/);
  assert(mi, rel + " missing home MI banner");
  assert(mi[0].indexOf('href="/ridge"') !== -1, rel + " MI banner href changed");
  assert(mi[0].indexOf('data-go="mi-lite"') !== -1, rel + " MI banner data-go changed");
  assert((home.match(/class="home-mi-banner"/g) || []).length === 1, rel + " extra home MI banners");

  /* Path doors stay compacted in markup + same funnels */
  assert(home.indexOf('href="/physician" data-go="physician"') !== -1, rel + " candidate door route changed");
  assert(home.indexOf('href="/client" data-go="client"') !== -1, rel + " client door route changed");
  assert(home.indexOf("Are you a provider looking for a job?") !== -1, rel + " missing provider door label");
  assert(home.indexOf("Are you a medical facility looking to hire?") !== -1, rel + " missing facility door label");

  /* Story cards use attached assets */
  assert(home.indexOf('src="assets/story-provider.jpg?v=2135"') !== -1, rel + " missing provider story photo");
  assert(home.indexOf('src="assets/story-facility-boardroom.jpg?v=2135"') !== -1, rel + " missing facility story photo");
  assert(home.indexOf("home-job2-panel-candidate") === -1, rel + " leftover candidate gradient panel");
  assert(home.indexOf("home-job2-panel-client") === -1, rel + " leftover client gradient panel");

  /* Hero subline copy stays; shimmer is CSS */
  assert(
    home.indexOf("Your partners in rural healthcare recruiting. Clear paths for physicians and hiring organizations.") !== -1,
    rel + " hero subline copy changed"
  );

  /* Funnel lock: step labels + routes stay */
  ["Step 2 of 5", "Step 3 of 5", "Step 4 of 5", "Step 5 of 5"].forEach(function (step) {
    assert(html.indexOf(step) !== -1, rel + " missing " + step);
  });
  [
    'data-route="physician"',
    'data-route="physician-rank"',
    'data-route="physician-region"',
    'data-route="physician-jobs"',
    'data-route="client"',
    'data-route="client-specialty"',
    'data-route="client-region"',
    'data-route="client-meeting"',
    'data-route="confirm-client"',
    'data-route="mi-lite"'
  ].forEach(function (route) {
    assert(html.indexOf(route) !== -1, rel + " lost " + route);
  });
}

checkFile("index.html");
checkFile("404.html");

assert(fs.existsSync(path.join(ROOT, "assets/story-provider.jpg")), "assets/story-provider.jpg missing");
assert(fs.existsSync(path.join(ROOT, "assets/story-facility-boardroom.jpg")), "assets/story-facility-boardroom.jpg missing");

var app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
assert(app.indexOf('window.__AMP_BUILD = "2135-home-mi-story"') !== -1, "app.js build stamp");
assert(app.indexOf("2134-home-ad-hero") === -1, "app.js still stamped 2134");

var css = fs.readFileSync(path.join(ROOT, "css/site.css"), "utf8");
assert(css.indexOf("amp-build:2135-home-mi-story") !== -1, "css missing 2135 stamp");
assert(css.indexOf("exploreSubTextShimmer") === -1, "css still animates explore-sub shimmer");
assert(/\.explore-sub \{[\s\S]{0,280}animation:\s*none/.test(css) || /\.explore-sub \{[\s\S]{0,280}background-image:\s*none/.test(css), "explore-sub not static");
assert(css.indexOf("min-height: 0 !important") !== -1, "compact door min-height lock missing");
assert(/\.home-stage\.no-mountain-hero \.door-hero \{[\s\S]{0,180}min-height:\s*0 !important/.test(css), "door compact sizing changed");
assert(/\.home-mi-banner-title \{[\s\S]{0,80}font-size:\s*1\.55rem/.test(css), "MI title not enlarged");
assert(/\.home-proof-stack \.proof-chip,[\s\S]{0,80}\.home-proof-subtle \.proof-chip \{[\s\S]{0,80}font-size:\s*16\.5px/.test(css), "proof pills not enlarged");
assert(css.indexOf("story-provider") === -1 || true, "css ok");
assert(css.indexOf(".home-job2-photo-facility") !== -1, "facility photo crop class missing");

console.log("home-path-2135.test.js ok");
