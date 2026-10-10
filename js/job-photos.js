/* AMP job photos (build 2303, Mike approved Oct 10 2026; revised same day: city photo first, scenery second).
 * HEADER + LIST THUMBNAIL = a real photo of the job's city, found automatically from the place named in the job's
 * "Setting" bullet (else title/sub). If the city is only mentioned as a reference ("25 minutes from Wichita",
 * "minutes from Monterey") or the town has no usable photo (Centreville AL -> Tuscaloosa), the photo is labeled
 * "Nearby: <city>". No city named -> the state/area scenic photo below. Unknown state -> "default".
 * SECOND IMAGE on the job page = the area scenic photo (SCENES, chosen as before).
 * City photos: /assets/job-photos/city/{key}.webp (1400x700), -800.webp, -thumb.webp (480x300); credits in
 * assets/job-photos/city/credits.json and /assets/job-photos/credits.html (CC BY / BY-SA need the visible credit).
 * Overrides on a job in js/content.js: job.city = city key (or "none"), job.cityNear = true, job.photo = scene key, job.hero = image URL.
 * New city: add a photo (workspace job-photos-20261010/city build) + a CITIES entry + a TOWNS line.
 * Original header notes:
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

  // City photos (real photos of the place; see credits). name = how the place is labeled.
  var CITIES = {
   "midland-tx": {
    "name": "Midland, TX",
    "label": "Downtown Midland, TX",
    "alt": "Downtown Midland, Texas skyline under a blue sky",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Quintin Soloviev",
    "lic": "CC BY 4.0",
    "licUrl": "https://creativecommons.org/licenses/by/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Midland,_TX_skyline.jpg"
   },
   "abilene-tx": {
    "name": "Abilene, TX",
    "label": "Downtown Abilene, TX",
    "alt": "Historic buildings in downtown Abilene, Texas",
    "pos": "50% 35%",
    "w": 1400,
    "by": "Keithimus",
    "lic": "Public domain",
    "licUrl": "",
    "src": "https://commons.wikimedia.org/wiki/File:DowntownAbilene.JPG"
   },
   "las-vegas-nv": {
    "name": "Las Vegas, NV",
    "label": "The Las Vegas Strip, NV",
    "alt": "The Las Vegas Strip at night, with the Bellagio fountain lake in front",
    "pos": "50% 50%",
    "w": 1400,
    "by": "King of Hearts",
    "lic": "CC BY-SA 3.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Bellagio_Las_Vegas_December_2013_panorama.jpg"
   },
   "concord-nh": {
    "name": "Concord, NH",
    "label": "Downtown Concord, NH",
    "alt": "New Hampshire State House on Main Street in downtown Concord",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Bpp88520",
    "lic": "CC0",
    "licUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Concord_NH_state_house.png"
   },
   "salinas-ca": {
    "name": "Salinas, CA",
    "label": "Main Street, Salinas, CA",
    "alt": "Historic storefronts along Main Street in Oldtown Salinas, California",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Naotake Murayama; cropped by Beyond My Ken",
    "lic": "CC BY 2.0",
    "licUrl": "https://creativecommons.org/licenses/by/2.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Main_Street,_Salinas_crop.jpg"
   },
   "tuscaloosa-al": {
    "name": "Tuscaloosa, AL",
    "label": "Downtown Tuscaloosa, AL",
    "alt": "The Bama Theatre in downtown Tuscaloosa, Alabama, with fall color",
    "pos": "50% 45%",
    "w": 1400,
    "by": "Paul Kilgo",
    "lic": "Public domain",
    "licUrl": "",
    "src": "https://commons.wikimedia.org/wiki/File:Bama_Theatre_Tuscaloosa_Alabama_2009.jpg"
   },
   "walla-walla-wa": {
    "name": "Walla Walla, WA",
    "label": "Downtown Walla Walla, WA",
    "alt": "Historic buildings in downtown Walla Walla, Washington",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Jon Roanhaus",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Walla_Walla_Downtown_HD_NRHP_100006868_Walla_Walla_County,_WA.jpg"
   },
   "garberville-ca": {
    "name": "Garberville, CA",
    "label": "Garberville, CA",
    "alt": "The South Fork Eel River valley seen from Garberville, California",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Z3lvs",
    "lic": "CC0",
    "licUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "src": "https://commons.wikimedia.org/wiki/File:South_Fork_Eel_River_viewed_from_Garberville,_California.jpg"
   },
   "texarkana-tx": {
    "name": "Texarkana, TX",
    "label": "Texarkana, TX",
    "alt": "Texarkana, Texas municipal building with flags out front",
    "pos": "50% 60%",
    "w": 1400,
    "by": "Billy Hathorn",
    "lic": "CC BY-SA 3.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Municipal_building,_Texarkana,_TX_IMG_6411.jpg"
   },
   "san-jose-ca": {
    "name": "San Jose, CA",
    "label": "Downtown San Jose, CA",
    "alt": "Downtown San Jose, California skyline with the hills behind",
    "pos": "50% 50%",
    "w": 1400,
    "by": "Adam Schultz",
    "lic": "CC BY 2.0",
    "licUrl": "https://creativecommons.org/licenses/by/2.0/",
    "src": "https://commons.wikimedia.org/wiki/File:SAN_JOSE_CALIFORNIA_BAYAREA01_(cropped2).jpg"
   },
   "tishomingo-ok": {
    "name": "Tishomingo, OK",
    "label": "Tishomingo, OK",
    "alt": "The historic Chickasaw Nation Capitol building in Tishomingo, Oklahoma",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Interim81",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Chickasaw_Nation_Capitol_building.jpg"
   },
   "cape-girardeau-mo": {
    "name": "Cape Girardeau, MO",
    "label": "Downtown Cape Girardeau, MO",
    "alt": "Downtown Cape Girardeau, Missouri, looking toward City Hall",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Drowzy",
    "lic": "Public domain",
    "licUrl": "",
    "src": "https://commons.wikimedia.org/wiki/File:Cape_Girardeau_dec29-07_(23).jpg"
   },
   "columbus-in": {
    "name": "Columbus, IN",
    "label": "Downtown Columbus, IN",
    "alt": "Bartholomew County Courthouse in downtown Columbus, Indiana",
    "pos": "50% 45%",
    "w": 1400,
    "by": "Nyttend",
    "lic": "Public domain",
    "licUrl": "",
    "src": "https://commons.wikimedia.org/wiki/File:Bartholomew_County_Courthouse,_southwestern_angle.jpg"
   },
   "greeneville-tn": {
    "name": "Greeneville, TN",
    "label": "Downtown Greeneville, TN",
    "alt": "Main Street and the historic General Morgan Inn in downtown Greeneville, Tennessee",
    "pos": "50% 60%",
    "w": 1400,
    "by": "AppalachianCentrist",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:General_Morgan_Inn_and_Main_Street_-_Greeneville.jpg"
   },
   "gadsden-al": {
    "name": "Gadsden, AL",
    "label": "Downtown Gadsden, AL",
    "alt": "Historic storefronts on Broad Street in downtown Gadsden, Alabama",
    "pos": "50% 50%",
    "w": 1400,
    "by": "Carol M. Highsmith",
    "lic": "Public domain",
    "licUrl": "",
    "src": "https://commons.wikimedia.org/wiki/File:Historic_downtown_Gadsden,_Alabama_LCCN2010640495.tif"
   },
   "newton-ks": {
    "name": "Newton, KS",
    "label": "Downtown Newton, KS",
    "alt": "The historic Railroad Savings and Loan building in downtown Newton, Kansas",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Matthew Zisi",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Newton,_Kansas_Railroad_Savings_and_Loan_Building.jpg"
   },
   "dallas-tx": {
    "name": "Dallas, TX",
    "label": "Downtown Dallas, TX",
    "alt": "Downtown Dallas, Texas skyline seen across the Trinity River levee",
    "pos": "50% 50%",
    "w": 1400,
    "by": "drumguy8800 (xvisionx.com)",
    "lic": "CC BY-SA 3.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Dallas,_Texas_Skyline_2005.jpg"
   },
   "pauls-valley-ok": {
    "name": "Pauls Valley, OK",
    "label": "Pauls Valley, OK",
    "alt": "The restored Santa Fe depot in Pauls Valley, Oklahoma",
    "pos": "50% 60%",
    "w": 1400,
    "by": "Matthew Zisi",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Pauls_Valley_Santa_Fe_Depot.jpg"
   },
   "chickasha-ok": {
    "name": "Chickasha, OK",
    "label": "Downtown Chickasha, OK",
    "alt": "Historic storefronts in the Chickasha Downtown Historic District, Oklahoma",
    "pos": "50% 60%",
    "w": 1400,
    "by": "Crimsonedge34",
    "lic": "CC BY-SA 3.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Chickasha_Downtown_Historic_District.jpg"
   },
   "johnson-city-tn": {
    "name": "Johnson City, TN",
    "label": "Downtown Johnson City, TN",
    "alt": "Downtown Johnson City, Tennessee, with Buffalo Mountain behind",
    "pos": "50% 50%",
    "w": 1400,
    "by": "Mrgriffter",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Johnson_City.jpg"
   },
   "tucson-az": {
    "name": "Tucson, AZ",
    "label": "Downtown Tucson, AZ",
    "alt": "Downtown Tucson, Arizona skyline under a blue sky",
    "pos": "50% 85%",
    "w": 1400,
    "by": "Sahmeditor",
    "lic": "CC BY-SA 3.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Tucson_skyline.JPG"
   },
   "oklahoma-city-ok": {
    "name": "Oklahoma City, OK",
    "label": "Downtown Oklahoma City, OK",
    "alt": "Downtown Oklahoma City skyline above the river",
    "pos": "50% 45%",
    "w": 1400,
    "by": "Kerwin Moore",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Oklahoma_City_downtown_skyline_May_2024_(cropped).jpg"
   },
   "winnfield-la": {
    "name": "Winnfield, LA",
    "label": "Downtown Winnfield, LA",
    "alt": "Downtown Winnfield, Louisiana",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Wikilester 3",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Downtown_Winnfield_2021.jpg"
   },
   "ardmore-ok": {
    "name": "Ardmore, OK",
    "label": "Downtown Ardmore, OK",
    "alt": "Historic brick storefronts on Main Street in downtown Ardmore, Oklahoma",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Ken Lund",
    "lic": "CC BY-SA 4.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Ardmore,_Oklahoma_-_54971739809.jpg"
   },
   "valdosta-ga": {
    "name": "Valdosta, GA",
    "label": "Downtown Valdosta, GA",
    "alt": "A restored historic brick building in downtown Valdosta, Georgia",
    "pos": "50% 50%",
    "w": 1400,
    "by": "Mjrmtg",
    "lic": "CC BY 4.0",
    "licUrl": "https://creativecommons.org/licenses/by/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Downtown_Social,_Valdosta.jpg"
   },
   "pecos-tx": {
    "name": "Pecos, TX",
    "label": "Pecos, TX",
    "alt": "Pecos, Texas welcome sign: Home of the World's First Rodeo",
    "pos": "50% 15%",
    "w": 1400,
    "by": "Jadecolour",
    "lic": "CC BY-SA 3.0",
    "licUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Pecos_texas.jpg"
   },
   "wichita-ks": {
    "name": "Wichita, KS",
    "label": "Downtown Wichita, KS",
    "alt": "Aerial view of downtown Wichita, Kansas, along the Arkansas River",
    "pos": "50% 50%",
    "w": 1400,
    "by": "Quintin Soloviev",
    "lic": "CC BY 4.0",
    "licUrl": "https://creativecommons.org/licenses/by/4.0/",
    "src": "https://commons.wikimedia.org/wiki/File:Wichita,_Kansas_skyline_aerial_view.jpg"
   },
   "monterey-ca": {
    "name": "Monterey, CA",
    "label": "Monterey Harbor, CA",
    "alt": "Boats in the harbor at Monterey, California",
    "pos": "50% 55%",
    "w": 1400,
    "by": "Carol M. Highsmith",
    "lic": "Public domain",
    "licUrl": "",
    "src": "https://commons.wikimedia.org/wiki/File:Harbor,_Monterey,_California_LCCN2011630971.tif"
   }
  };
  // Place names looked for in the job's setting text, per state. [regex, city key, forceNearby]
  var TOWNS = {
    TX: [[/\bMidland\b/, "midland-tx"], [/\bAbilene\b/, "abilene-tx"], [/\bTexarkana\b/, "texarkana-tx"], [/\bPecos\b/, "pecos-tx"], [/\bDallas\b/, "dallas-tx"]],
    NV: [[/\bLas Vegas\b/, "las-vegas-nv"]],
    NH: [[/\bConcord\b/, "concord-nh"]],
    CA: [[/\bSalinas\b/, "salinas-ca"], [/\bGarberville\b/, "garberville-ca"], [/\bSan Jose\b/, "san-jose-ca"], [/\bMonterey (Bay|County|Peninsula)\b/, "monterey-ca", true], [/\bMonterey\b/, "monterey-ca"]],
    AL: [[/\bCentreville\b/, "tuscaloosa-al", true], [/\bTuscaloosa\b/, "tuscaloosa-al"], [/\bGadsden\b/, "gadsden-al"]],
    WA: [[/\bWalla Walla\b/, "walla-walla-wa"]],
    OK: [[/\bTishomingo\b/, "tishomingo-ok"], [/\bPauls Valley\b/, "pauls-valley-ok"], [/\bChickasha\b/, "chickasha-ok"], [/\bArdmore\b/, "ardmore-ok"], [/\bOklahoma City\b/, "oklahoma-city-ok"]],
    MO: [[/\bCape Girardeau\b/, "cape-girardeau-mo"]],
    IN: [[/\bColumbus\b/, "columbus-in"]],
    TN: [[/\bGreeneville\b/, "greeneville-tn"], [/\bJohnson City\b/, "johnson-city-tn"]],
    KS: [[/\bNewton\b/, "newton-ks"], [/\bWichita\b/, "wichita-ks"]],
    AZ: [[/\bTucson\b/, "tucson-az"]],
    LA: [[/\bWinnfield\b/, "winnfield-la"]],
    GA: [[/\bValdosta\b/, "valdosta-ga"]]
  };
  function hash(s) { var h = 0; s = String(s || ""); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function pickOne(v, id) { return Array.isArray(v) ? v[hash(id) % v.length] : v; }
  function settingText(j) {
    var b = (j && j.bullets) || [];
    for (var i = 0; i < b.length; i++) if (/^setting$/i.test(String(b[i].k || "").trim())) return String(b[i].v || "").replace(/^[^·]*·\s*/, "");
    return "";
  }
  function sceneKey(j) {
    if (!j) return "default";
    if (j.photo && SCENES[j.photo]) return j.photo;
    var st = String(j.stateAbbr || "").toUpperCase();
    var text = (j.title || "") + " " + (j.sub || "") + " " + settingText(j);
    var rules = RULES[st] || [];
    for (var i = 0; i < rules.length; i++) if (rules[i][0].test(text)) return pickOne(rules[i][1], j.id);
    if (STATE[st]) return pickOne(STATE[st], j.id);
    return "default";
  }
  // Finds the job's city photo: {key, near} or null. Earliest place named in the setting text wins.
  var FAR = /(\bhours\b|\b(6\d|[7-9]\d|1\d\d) minutes)[^,.;]*$/i;      // "2.5 hours from Dallas" is not "nearby"
  var REF = /\b(from|to|near|outside( of)?|of|access to)\s+(the\s+)?$/i;  // "25 minutes from Wichita", "access to the Wichita metro"
  var CLOSE = /^\s*(and [A-Z][a-z]+\s+)?(close by|nearby|within reach)/;
  function cityMatch(j) {
    if (!j) return null;
    if (j.city === "none") return null;
    if (j.city && CITIES[j.city]) return { key: j.city, near: !!j.cityNear };
    var st = String(j.stateAbbr || "").toUpperCase(), towns = TOWNS[st];
    if (!towns) return null;
    var texts = [settingText(j), (j.title || "") + " · " + (j.sub || "")];
    for (var t = 0; t < texts.length; t++) {
      var text = texts[t], best = null;
      for (var i = 0; i < towns.length; i++) {
        var re = new RegExp(towns[i][0].source, "g"), m;
        while ((m = re.exec(text))) {
          var pre = text.slice(Math.max(0, m.index - 40), m.index), post = text.slice(m.index + m[0].length, m.index + m[0].length + 30);
          if (FAR.test(pre)) continue;
          if (!best || m.index < best.at) best = { at: m.index, key: towns[i][1], near: !!towns[i][2] || REF.test(pre) || CLOSE.test(post) };
          break;
        }
      }
      if (best) return { key: best.key, near: best.near };
    }
    return null;
  }
  function sceneInfo(key) {
    var s = SCENES[key] || SCENES["default"];
    return { key: key, src: BASE + key + ".webp?v=" + V, mid: BASE + key + "-800.webp?v=" + V, thumb: BASE + key + "-thumb.webp?v=" + V, alt: s.alt, w: s.w || 1400, pos: s.pos || "50% 50%" };
  }
  // photoFor(j) -> header photo {src, mid, thumb, alt, w, pos, kind, label, credit} plus .scenic (second image) when the header is a city photo.
  // kind: "city" | "nearby" | "scenic" (state/area fallback) | "generic" (no state match) | "custom" (job.hero)
  function photoFor(j) {
    var sk = sceneKey(j), scenic = sceneInfo(sk);
    scenic.kind = sk === "default" ? "generic" : "scenic";
    scenic.label = "Area scenery" + (j && j.state && sk !== "default" ? " · " + j.state : "");
    if (j && j.hero) return { key: "custom", kind: "custom", src: j.hero, mid: j.hero, thumb: j.hero, alt: scenic.alt, pos: "50% 50%", custom: true, label: "Practice preview" };
    var cm = cityMatch(j);
    if (!cm) return scenic;
    var c = CITIES[cm.key], cb = BASE + "city/" + cm.key;
    return {
      key: cm.key, kind: cm.near ? "nearby" : "city",
      src: cb + ".webp?v=" + V, mid: cb + "-800.webp?v=" + V, thumb: cb + "-thumb.webp?v=" + V,
      alt: c.alt, w: c.w || 1400, pos: c.pos || "50% 50%",
      label: cm.near ? "Nearby: " + c.name : c.label,
      credit: { by: c.by, lic: c.lic, licUrl: c.licUrl, src: c.src },
      scenic: scenic
    };
  }
  window.AMP_JOB_PHOTOS = { scenes: SCENES, cities: CITIES, sceneKey: sceneKey, cityMatch: cityMatch, photoFor: photoFor };
})();
