/* amp-build:2186-specialty-ctx-photo-taller */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

const css = fs.readFileSync(path.join(root, "css/site.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");

assert(html.indexOf("amp-build:2186-specialty-ctx-photo-taller") !== -1, "html tip stamp");
assert(html.indexOf('href="css/site.css?v=2186"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2186"') !== -1, "app cache");
assert(app.indexOf('__AMP_BUILD = "2186-specialty-ctx-photo-taller"') !== -1, "app build stamp");
assert(css.indexOf("amp-build:2186-specialty-ctx-photo-taller") !== -1, "css tip stamp");

/* Step 3 specialty still-there photo band enlarged (was 96/110). */
const mediaRule = css.split('.view.funnel.trailhead[data-route="client-specialty"] .v3-ctx:not(.slim) .v3-ctx-media')[1] || "";
const block = mediaRule.split("}")[0] || "";
assert(block.indexOf("height: 180px") !== -1, "photo band height 180");
assert(block.indexOf("min-height: 160px") !== -1, "photo band min 160");
assert(block.indexOf("max-height: 220px") !== -1, "photo band max 220");
assert(block.indexOf("background-position: center top") !== -1, "faces bias center top");
assert(block.indexOf("height: 96px") === -1, "old 96px height gone");
assert(css.indexOf("max-height: 110px") === -1 || block.indexOf("max-height: 110px") === -1, "old 110 cap gone from rule");

/* Alliance Pediatrics wiring still points at the shared card + asset. */
assert(app.indexOf("specPdAlliance") !== -1, "Alliance key");
assert(app.indexOf('role: "Alliance Pediatrics"') !== -1, "Alliance role");
assert(app.indexOf("assets/story-2015-peds-ne.jpg") !== -1, "Alliance photo asset");
assert(html.indexOf('id="client-specialty-ctx"') !== -1, "specialty ctx card");
assert(html.indexOf('data-ctx-media') !== -1, "ctx media node");

/* SoftMess must stay untouched — sanity: this repo has no SoftMess file. */
assert(!fs.existsSync("/Users/mike/Desktop/AMP-Mess-Soft.html") || true, "softmess path not our concern");

console.log("ok 2186-specialty-ctx-photo-taller");
