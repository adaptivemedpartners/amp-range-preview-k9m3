/* amp-build:2194-polish-step4-wide-howwehelp-specialty-photos
   Step 4 wider rail, How we help refresh + richer 1–3 copy, distinct specialty photos,
   EM ER-bay photo, image-quality guard on the three Mike-flagged card images.
   Run: node js/v3-polish-2194.test.js */
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var root = path.join(__dirname, "..");
var STAMP = "2194-polish-step4-wide-howwehelp-specialty-photos";
function assert(cond, msg) { if (!cond) { console.error("FAIL:", msg); process.exit(1); } }
var css = fs.readFileSync(path.join(root, "css/site.css"), "utf8");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");

assert(html.indexOf("amp-build:" + STAMP) !== -1, "html tip stamp");
assert(html.indexOf('href="css/site.css?v=2194"') !== -1, "css cache");
assert(html.indexOf('src="js/app.js?v=2194"') !== -1, "app cache");
assert(html.indexOf("?v=2193") === -1, "no stale 2193 cache-bust");
assert(app.indexOf('__AMP_BUILD = "' + STAMP + '"') !== -1, "app build stamp");
assert(css.indexOf("/* amp-build:" + STAMP + " */") === 0, "css tip stamp");
assert(css.indexOf("/* ========== amp-build:" + STAMP + " ==========") !== -1, "css block stamp");

/* 1 · Step 4 wider rail, 2x2 from 900 kept */
assert(css.indexOf("clamp(360px, 40vw, 740px) !important") !== -1, "wider rail");
assert(css.indexOf("width: min(1880px, calc(100% - 20px)) !important") !== -1, "wider chrome");
assert(css.indexOf("repeat(2, minmax(0, 1fr)) !important") !== -1, "2x2 kept");

/* 2 · How we help copy + refresh; delegation kept */
["1", "2", "3"].forEach(function (n) {
  var m = app.match(new RegExp('"' + n + '": \\{ title: "[^"]+", body: "([^"]+)"'));
  assert(m && m[1].length > 140, "station " + n + " has fuller copy");
});
assert(app.indexOf("clientClimbDocBound") !== -1, "2191 document delegation kept");
assert(css.indexOf("--hwh-sky: #78c4e5") !== -1, "sky accent");
assert(/client-climb-band > \.tag \{[\s\S]*?margin: 0 0 18px/.test(css), "heading spacing");

/* 4/5 · distinct specialty photos */
var imgs = {};
var re = /img: "(assets\/specialty\/[a-z0-9-]+\.webp)",\n\s+alt: "[^"]*",\n[\s\S]*?specialtyIds: \[([^\]]+)\]/g, m;
while ((m = re.exec(app))) {
  assert(fs.existsSync(path.join(root, m[1])), "exists " + m[1]);
  m[2].split(",").forEach(function (id) {
    id = id.trim().replace(/"/g, "");
    if (!imgs[m[1]]) imgs[m[1]] = {};
    imgs[m[1]][id] = 1;
  });
}
var fam = { physician_assistant_primary_care: "pa", physician_assistant_family_medicine_without_ob: "pa", neuro: "neuro", neurology: "neuro" };
Object.keys(imgs).forEach(function (k) {
  var ids = Object.keys(imgs[k]).map(function (i) { return fam[i] || i; });
  var uniq = ids.filter(function (v, i) { return ids.indexOf(v) === i; });
  assert(uniq.length === 1, "one specialty per photo: " + k + " -> " + ids.join(","));
});
assert(Object.keys(imgs).length >= 27, "27 distinct specialty photos (" + Object.keys(imgs).length + ")");
assert(html.indexOf("assets/specialty/emergency-medicine-er-bay.webp?v=2194") !== -1, "step4 EM ER-bay photo");
assert(html.indexOf("assets/story-2013-em-er.jpg") === -1, "old EM surgeon photo gone from step 4");

/* 6 · image quality guard */
var guard = {
  "assets/story-2018-fm-ne-cah.jpg": "4ff9c4c7fef314c04882a1302f2cd42ded08d1de087fcc469de96ad9d47de946",
  "assets/story-2021-physician-ks.jpg": "a19d1795b2ee050ca30d22f5ee9a2e808cc4e0d50ef9d376608fc78b72f09a99",
  "assets/story-2015-peds-ne.jpg": "6bdf0c33b81618797a517d62faa1008a961f94258d188098e8ecbddb10a60501"
};
Object.keys(guard).forEach(function (f) {
  var h = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, f))).digest("hex");
  assert(h === guard[f], "guarded file unchanged " + f);
  assert(html.indexOf(f + "?v=2194") !== -1, "guarded file still used " + f);
});

/* copy locks */
assert(!/\b(retained|retainer)\b/i.test(app.replace(/client-retained/g, "").replace(/retained-vs-contingent/g, "")), "no retained/retainer in app copy");
console.log("ok — 2194 polish (" + STAMP + ")");
