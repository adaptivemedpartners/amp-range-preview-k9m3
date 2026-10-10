/* AMP job photos (build 2303, Mike approved Oct 10 2026).
 * Every job gets a header photo and a list thumbnail automatically, chosen from its state and the
 * place words in its title/sub (e.g. "West Texas", "Silicon Valley", "Eastern Oregon").
 * All photos are public domain or CC0 landscapes (no people), hosted in /assets/job-photos/
 * (credits + source links: assets/job-photos/credits.json). Each scene has 3 sizes:
 *   {key}.webp up to 1400x700 header, {key}-800.webp 800x400 mobile header, {key}-thumb.webp 480x300 list card.
 * Overrides, in order: job.hero (explicit image URL) > job.photo (scene key) > rules below > state > "default".
 * New state? Add a scene (run the photo build in /workspace/job-photos-20261010) and a STATE entry; until then
 * the job falls back to "default" (country road), so nothing ever shows a broken image. */
(function () {
  var BASE = "/assets/job-photos/";
  var V = "2303";
  var SCENES = {
 "tx-west": {
  "alt": "Guadalupe Mountains rising above the West Texas desert",
  "pos": "50% 40%",
  "w": 1400
 },
 "tx-west-2": {
  "alt": "Gomez Peak in the Davis Mountains of West Texas",
  "pos": "50% 45%",
  "w": 1400
 },
 "tx-hill": {
  "alt": "Bluebonnets and live oaks in the Texas Hill Country",
  "pos": "50% 60%",
  "w": 1400
 },
 "tx-dfw": {
  "alt": "Dallas skyline on a clear day",
  "pos": "50% 45%",
  "w": 1400
 },
 "tx-east": {
  "alt": "Cypress trees in still water at Big Thicket National Preserve, East Texas",
  "pos": "50% 50%",
  "w": 1400
 },
 "ca-bay": {
  "alt": "Santa Clara Valley and the South Bay seen from Mount Hamilton",
  "pos": "50% 55%",
  "w": 1400
 },
 "ca-coast": {
  "alt": "Wildflowers above a rocky cove on the California coast",
  "pos": "50% 50%",
  "w": 1024
 },
 "ca-valley": {
  "alt": "Rows of crops in California's Salinas Valley",
  "pos": "50% 60%",
  "w": 1400
 },
 "ca-redwoods": {
  "alt": "Looking up into a grove of coast redwoods",
  "pos": "50% 50%",
  "w": 1024
 },
 "ca-south": {
  "alt": "Sandstone cliffs above the Pacific in Southern California",
  "pos": "50% 50%",
  "w": 1400
 },
 "wa-wine": {
  "alt": "Vineyard rows below Rattlesnake Mountain in Washington wine country",
  "pos": "50% 55%",
  "w": 1400
 },
 "wa-nw": {
  "alt": "Mountain meadow and ponds with Mount Rainier behind",
  "pos": "50% 45%",
  "w": 1400
 },
 "or-east": {
  "alt": "Mann Lake and snow-capped mountains in eastern Oregon",
  "pos": "50% 45%",
  "w": 1023
 },
 "or": {
  "alt": "Mount Hood reflected in Mirror Lake, Oregon",
  "pos": "50% 45%",
  "w": 1024
 },
 "az-tucson": {
  "alt": "Saguaro cactus on a desert hillside at Saguaro National Park near Tucson",
  "pos": "50% 50%",
  "w": 1024
 },
 "az": {
  "alt": "Red rock formations and juniper near Sedona, Arizona",
  "pos": "50% 50%",
  "w": 1024
 },
 "nv": {
  "alt": "Red Rock Canyon near Las Vegas, Nevada",
  "pos": "50% 50%",
  "w": 1024
 },
 "nm": {
  "alt": "The Organ Mountains of southern New Mexico",
  "pos": "50% 45%",
  "w": 1400
 },
 "nh": {
  "alt": "Red boathouses on Lake Sunapee, New Hampshire",
  "pos": "50% 55%",
  "w": 1023
 },
 "ok": {
  "alt": "Lake and granite hills in the Wichita Mountains of southwest Oklahoma",
  "pos": "50% 50%",
  "w": 1024
 },
 "ks": {
  "alt": "Rolling tallgrass prairie in the Kansas Flint Hills",
  "pos": "50% 50%",
  "w": 1400
 },
 "mo": {
  "alt": "Lakeshore at Big Bay Recreation Area in the Missouri Ozarks",
  "pos": "50% 50%",
  "w": 1024
 },
 "in": {
  "alt": "Autumn hills at Brown County State Park, Indiana",
  "pos": "50% 50%",
  "w": 1400
 },
 "ky": {
  "alt": "Fall color along a river crossing in the Southern forest",
  "pos": "50% 50%",
  "w": 1024
 },
 "tn": {
  "alt": "Great Smoky Mountains ridgelines seen from Clingmans Dome",
  "pos": "50% 50%",
  "w": 1024
 },
 "al": {
  "alt": "Little River Canyon from Wolf Creek Overlook in northeast Alabama",
  "pos": "50% 50%",
  "w": 1400
 },
 "al-2": {
  "alt": "Little River Falls in northeast Alabama",
  "pos": "50% 50%",
  "w": 1400
 },
 "ga": {
  "alt": "North Georgia mountains from Black Rock Mountain State Park",
  "pos": "50% 50%",
  "w": 1400
 },
 "sc": {
  "alt": "Tidal creek and salt marsh on the South Carolina coast",
  "pos": "50% 55%",
  "w": 1400
 },
 "la": {
  "alt": "Cypress trees and Spanish moss along a Louisiana bayou",
  "pos": "50% 50%",
  "w": 1024
 },
 "default": {
  "alt": "Open farmland along a quiet country road",
  "pos": "50% 55%",
  "w": 1400
 }
};
  // Place-word rules, checked in order against "title sub" for that state. A list = rotate by job id.
  var RULES = {
    TX: [
      [/west texas|midland|odessa|lubbock|abilene|permian|big spring|san angelo|el paso/i, ["tx-west", "tx-west-2"]],
      [/hill country|central texas|austin|san antonio|waco/i, "tx-hill"],
      [/east texas|northeast texas|tyler|longview|texarkana|beaumont/i, "tx-east"],
      [/dallas|dfw|fort worth|north texas/i, "tx-dfw"]
    ],
    CA: [
      [/silicon valley|san jose|bay area|santa clara/i, "ca-bay"],
      [/redwood|humboldt|eureka/i, "ca-redwoods"],
      [/southern california|los angeles|san diego|inland empire|orange county/i, "ca-south"],
      [/central california|salinas|monterey county|central valley|fresno/i, "ca-valley"],
      [/central coast|coast|monterey|big sur/i, "ca-coast"]
    ],
    WA: [[/wine country|central washington|yakima|walla walla|tri-cities|wenatchee|eastern washington/i, "wa-wine"]],
    OR: [[/eastern oregon|blue mountain|pendleton|la grande/i, "or-east"]],
    AZ: [[/tucson|southern arizona/i, "az-tucson"]]
  };
  var STATE = {
    TX: "tx-hill", CA: "ca-coast", WA: "wa-nw", OR: "or", AZ: "az", NV: "nv", NM: "nm", NH: "nh",
    OK: "ok", KS: "ks", MO: "mo", IN: "in", KY: "ky", TN: "tn", AL: ["al", "al-2"], GA: "ga",
    SC: "sc", LA: "la"
  };
  function hash(s) { var h = 0; s = String(s || ""); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function pickOne(v, id) { return Array.isArray(v) ? v[hash(id) % v.length] : v; }
  function sceneKey(j) {
    if (!j) return "default";
    if (j.photo && SCENES[j.photo]) return j.photo;
    var st = String(j.stateAbbr || "").toUpperCase();
    var text = (j.title || "") + " " + (j.sub || "");
    var rules = RULES[st] || [];
    for (var i = 0; i < rules.length; i++) if (rules[i][0].test(text)) return pickOne(rules[i][1], j.id);
    if (STATE[st]) return pickOne(STATE[st], j.id);
    return "default";
  }
  function photoFor(j) {
    var key = sceneKey(j);
    var s = SCENES[key] || SCENES["default"];
    if (j && j.hero) return { key: "custom", src: j.hero, mid: j.hero, thumb: j.hero, alt: s.alt, pos: "50% 50%", custom: true };
    return {
      key: key,
      src: BASE + key + ".webp?v=" + V,
      mid: BASE + key + "-800.webp?v=" + V,
      thumb: BASE + key + "-thumb.webp?v=" + V,
      alt: s.alt,
      w: s.w || 1400,
      pos: s.pos || "50% 50%"
    };
  }
  window.AMP_JOB_PHOTOS = { scenes: SCENES, sceneKey: sceneKey, photoFor: photoFor };
})();
