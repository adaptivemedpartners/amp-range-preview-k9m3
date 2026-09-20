/* amp-build:2156-mi-place-draw-heat
   Place-draw national metro heat — ported from locked mock 2026-09-19 (Mike).
   FL Atlantic MIA/FTL/WPB + Jax NE projection. Band order Red < Comp < Magnet < Dest.
   FM Competitive (YOUR Baseline) $306,520. No MGMA. Border-only selection. Light public chrome. */
(function (root) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var FM_BANDS = { redAlert: 255433, competitive: 306520, magnet: 368333, destination: 442612 };
  var FM_BASELINE = 306520;

  var PROJ = {
    x: [2759.8538078730785, 24.915358690648933, -14.953439595594197, -0.0007039183835004792, -0.06417214636590662, -0.21364840651961714],
    y: [379.2382728297884, -16.628347979204527, -23.689029729721316, -0.08434021870074027, 0.03156982137420572, 0.01129541566532044],
    ax: [2047.4798889934937, 16.368944717628892, 0.17238294560225498],
    ay: [1177.1599834210633, 0.13605651716414258, -23.052168778825187]
  };

  function flLonAdjust(lon, lat) {
    if (lat < 24.4 || lat > 31.2 || lon < -87.5 || lon > -79.0) return lon;
    var tip = Math.max(0, Math.min(1, (29.0 - lat) / 3.5));
    var atl = Math.max(0, Math.min(1, (lon + 82.2) / 2.2));
    var adj = tip * (0.70 + 0.45 * atl);
    var ne = Math.max(0, Math.min(1, 1 - Math.abs(lat - 30.35) / 1.15));
    var neAtl = Math.max(0, Math.min(1, (lon + 82.6) / 1.6));
    adj += ne * neAtl * 1.05;
    return lon + adj;
  }
  function flLonUnadjust(lonAdj, lat) {
    if (lat < 24.4 || lat > 31.2 || lonAdj < -87.5 || lonAdj > -78.0) return lonAdj;
    var tip = Math.max(0, Math.min(1, (29.0 - lat) / 3.5));
    var ne = Math.max(0, Math.min(1, 1 - Math.abs(lat - 30.35) / 1.15));
    if (tip <= 0 && ne <= 0) return lonAdj;
    var lon = lonAdj;
    for (var i = 0; i < 10; i++) {
      var atl = Math.max(0, Math.min(1, (lon + 82.2) / 2.2));
      var neAtl = Math.max(0, Math.min(1, (lon + 82.6) / 1.6));
      var f = lon + tip * (0.70 + 0.45 * atl) + ne * neAtl * 1.05 - lonAdj;
      var datl = 0;
      if (lon > -82.2 && lon < -80.0) datl = 1 / 2.2;
      var dneAtl = 0;
      if (lon > -82.6 && lon < -81.0) dneAtl = 1 / 1.6;
      var df = 1 + tip * 0.45 * datl + ne * 1.05 * dneAtl;
      lon -= f / df;
    }
    return lon;
  }
  function lonLatToSvg(lon, lat) {
    lon = flLonAdjust(lon, lat);
    var c = PROJ.x, d = PROJ.y;
    var x = c[0] + c[1]*lon + c[2]*lat + c[3]*lon*lon + c[4]*lat*lat + c[5]*lon*lat;
    var y = d[0] + d[1]*lon + d[2]*lat + d[3]*lon*lon + d[4]*lat*lat + d[5]*lon*lat;
    return [x, y];
  }
  function svgToLonLatAffine(x, y) {
    var a0 = PROJ.ax[0], a1 = PROJ.ax[1], a2 = PROJ.ax[2];
    var b0 = PROJ.ay[0], b1 = PROJ.ay[1], b2 = PROJ.ay[2];
    var det = a1 * b2 - a2 * b1;
    var lon = ((x - a0) * b2 - (y - b0) * a2) / det;
    var lat = (a1 * (y - b0) - b1 * (x - a0)) / det;
    return { lon: lon, lat: lat };
  }
  function svgToLonLat(x, y) {
    var seed = svgToLonLatAffine(x, y);
    var lon = seed.lon, lat = seed.lat;
    var c = PROJ.x, d = PROJ.y;
    for (var i = 0; i < 12; i++) {
      var fx = c[0] + c[1]*lon + c[2]*lat + c[3]*lon*lon + c[4]*lat*lat + c[5]*lon*lat - x;
      var fy = d[0] + d[1]*lon + d[2]*lat + d[3]*lon*lon + d[4]*lat*lat + d[5]*lon*lat - y;
      if (fx*fx + fy*fy < 1e-10) break;
      var dxdlon = c[1] + 2*c[3]*lon + c[5]*lat;
      var dxdlat = c[2] + 2*c[4]*lat + c[5]*lon;
      var dydlon = d[1] + 2*d[3]*lon + d[5]*lat;
      var dydlat = d[2] + 2*d[4]*lat + d[5]*lon;
      var det = dxdlon*dydlat - dxdlat*dydlon;
      if (Math.abs(det) < 1e-12) break;
      lon -= (fx*dydlat - fy*dxdlat) / det;
      lat -= (dxdlon*fy - dydlon*fx) / det;
    }
    lon = flLonUnadjust(lon, lat);
    return { lon: lon, lat: lat };
  }

  var METROS = [
    {id: "la", name: "Los Angeles\u2013Long Beach\u2013Anaheim", label: "LA", lat: 34.05, lon: -118.25, amenity: 88, gravity: 96, costFriction: 87, glowRadiusMiles: 180, strength: 0.99, litmus: true, region: "West Coast", rpp: 115.5, popRank: 2 },
    {id: "sd", name: "San Diego\u2013Chula Vista\u2013Carlsbad", label: "San Diego", lat: 32.7157, lon: -117.1611, amenity: 86, gravity: 89, costFriction: 76, glowRadiusMiles: 110, strength: 0.94, litmus: true, region: "West Coast", rpp: 111.5, popRank: 18 },
    {id: "sf", name: "San Francisco\u2013Oakland\u2013Berkeley", label: "SF Bay", lat: 37.77, lon: -122.42, amenity: 92, gravity: 91, costFriction: 95, glowRadiusMiles: 90, strength: 0.96, litmus: false, region: "West Coast", rpp: 118.2, popRank: 13 },
    {id: "sjc", name: "San Jose\u2013Sunnyvale\u2013Santa Clara", label: "San Jose", lat: 37.34, lon: -121.89, amenity: 90, gravity: 87, costFriction: 80, glowRadiusMiles: 88, strength: 0.93, litmus: false, region: "West Coast", rpp: 112.9, popRank: 36 },
    {id: "sac", name: "Sacramento\u2013Roseville\u2013Folsom", label: "Sacramento", lat: 38.58, lon: -121.49, amenity: 72, gravity: 88, costFriction: 68, glowRadiusMiles: 99, strength: 0.94, litmus: false, region: "West Coast", rpp: 108.9, popRank: 28 },
    {id: "fre", name: "Fresno", label: "Fresno", lat: 36.74, lon: -119.79, amenity: 55, gravity: 84, costFriction: 54, glowRadiusMiles: 90, strength: 0.91, litmus: false, region: "West Coast", rpp: 104.0, popRank: 48 },
    {id: "bak", name: "Bakersfield", label: "Bakersfield", lat: 35.37, lon: -119.02, amenity: 42, gravity: 83, costFriction: 49, glowRadiusMiles: 87, strength: 0.91, litmus: false, region: "West Coast", rpp: 102.2, popRank: 62 },
    {id: "riv", name: "Riverside\u2013San Bernardino", label: "Inland Empire", lat: 34.05, lon: -117.18, amenity: 58, gravity: 91, costFriction: 65, glowRadiusMiles: 108, strength: 0.96, litmus: false, region: "West Coast", rpp: 107.9, popRank: 12 },
    {id: "oxn", name: "Oxnard\u2013Thousand Oaks\u2013Ventura", label: "Oxnard", lat: 34.2, lon: -119.18, amenity: 78, gravity: 82, costFriction: 81, glowRadiusMiles: 85, strength: 0.9, litmus: false, region: "West Coast", rpp: 113.5, popRank: 73 },
    {id: "sea", name: "Seattle\u2013Tacoma\u2013Bellevue", label: "Seattle", lat: 47.61, lon: -122.33, amenity: 90, gravity: 90, costFriction: 80, glowRadiusMiles: 115, strength: 0.95, litmus: false, region: "PNW", rpp: 113.0, popRank: 15 },
    {id: "pdx", name: "Portland\u2013Vancouver\u2013Hillsboro", label: "Portland", lat: 45.52, lon: -122.68, amenity: 84, gravity: 88, costFriction: 62, glowRadiusMiles: 95, strength: 0.94, litmus: false, region: "PNW", rpp: 106.6, popRank: 25 },
    {id: "spo", name: "Spokane\u2013Spokane Valley", label: "Spokane", lat: 47.66, lon: -117.43, amenity: 68, gravity: 81, costFriction: 46, glowRadiusMiles: 81, strength: 0.9, litmus: false, region: "PNW", rpp: 101.0, popRank: 96 },
    {id: "boi", name: "Boise City", label: "Boise", lat: 43.62, lon: -116.2, amenity: 74, gravity: 82, costFriction: 24, glowRadiusMiles: 85, strength: 0.9, litmus: false, region: "Mountain", rpp: 93.4, popRank: 74 },
    {id: "den", name: "Denver\u2013Aurora\u2013Lakewood", label: "Denver", lat: 39.74, lon: -104.99, amenity: 86, gravity: 89, costFriction: 59, glowRadiusMiles: 120, strength: 0.94, litmus: false, region: "Mountain", rpp: 105.5, popRank: 19 },
    {id: "cos", name: "Colorado Springs", label: "Colorado Springs", lat: 38.83, lon: -104.82, amenity: 80, gravity: 82, costFriction: 35, glowRadiusMiles: 84, strength: 0.9, litmus: false, region: "Mountain", rpp: 97.4, popRank: 79 },
    {id: "slc", name: "Salt Lake City", label: "Salt Lake", lat: 40.76, lon: -111.89, amenity: 82, gravity: 84, costFriction: 33, glowRadiusMiles: 100, strength: 0.91, litmus: false, region: "Mountain", rpp: 96.4, popRank: 46 },
    {id: "phx", name: "Phoenix\u2013Mesa\u2013Chandler", label: "Phoenix", lat: 33.45, lon: -112.07, amenity: 72, gravity: 91, costFriction: 59, glowRadiusMiles: 110, strength: 0.96, litmus: false, region: "Mountain", rpp: 105.5, popRank: 10 },
    {id: "tus", name: "Tucson", label: "Tucson", lat: 32.22, lon: -110.97, amenity: 70, gravity: 84, costFriction: 27, glowRadiusMiles: 89, strength: 0.91, litmus: false, region: "Mountain", rpp: 94.3, popRank: 52 },
    {id: "abq", name: "Albuquerque", label: "Albuquerque", lat: 35.08, lon: -106.65, amenity: 62, gravity: 83, costFriction: 23, glowRadiusMiles: 87, strength: 0.91, litmus: false, region: "Mountain", rpp: 93.0, popRank: 61 },
    {id: "lv", name: "Las Vegas\u2013Henderson\u2013Paradise", label: "Las Vegas", lat: 36.17, lon: -115.14, amenity: 68, gravity: 88, costFriction: 35, glowRadiusMiles: 99, strength: 0.94, litmus: false, region: "Mountain", rpp: 97.4, popRank: 29 },
    {id: "rno", name: "Reno", label: "Reno", lat: 39.53, lon: -119.81, amenity: 76, gravity: 80, costFriction: 35, glowRadiusMiles: 80, strength: 0.89, litmus: false, region: "Mountain", rpp: 97.4, popRank: 103 },
    {id: "dfw", name: "Dallas\u2013Fort Worth\u2013Arlington", label: "DFW", lat: 32.78, lon: -96.8, amenity: 68, gravity: 94, costFriction: 52, glowRadiusMiles: 115, strength: 0.98, litmus: true, region: "TX", rpp: 103.3, popRank: 4 },
    {id: "hou", name: "Houston\u2013The Woodlands\u2013Sugar Land", label: "Houston", lat: 29.76, lon: -95.37, amenity: 65, gravity: 93, costFriction: 43, glowRadiusMiles: 120, strength: 0.97, litmus: true, region: "TX", rpp: 100.2, popRank: 5 },
    {id: "aus", name: "Austin\u2013Round Rock\u2013Georgetown", label: "Austin", lat: 30.27, lon: -97.74, amenity: 82, gravity: 88, costFriction: 36, glowRadiusMiles: 95, strength: 0.94, litmus: true, region: "TX", rpp: 97.6, popRank: 26 },
    {id: "sat", name: "San Antonio\u2013New Braunfels", label: "San Antonio", lat: 29.42, lon: -98.49, amenity: 62, gravity: 88, costFriction: 25, glowRadiusMiles: 90, strength: 0.94, litmus: false, region: "TX", rpp: 93.7, popRank: 24 },
    {id: "elp", name: "El Paso", label: "El Paso", lat: 31.76, lon: -106.49, amenity: 48, gravity: 83, costFriction: 15, glowRadiusMiles: 86, strength: 0.91, litmus: false, region: "TX", rpp: 90.2, popRank: 68 },
    {id: "mca", name: "McAllen\u2013Edinburg\u2013Mission", label: "McAllen", lat: 26.2, lon: -98.23, amenity: 45, gravity: 83, costFriction: 8, glowRadiusMiles: 87, strength: 0.91, litmus: false, region: "TX", rpp: 85.6, popRank: 65 },
    {id: "wtx", name: "West Texas (Midland/Odessa)", label: "West TX", lat: 31.997, lon: -102.078, amenity: 22, gravity: 18, costFriction: 28, glowRadiusMiles: 1, strength: 0.0, litmus: true, region: "TX", rpp: 94.8, popRank: 243, coolField: true },
    {id: "ama", name: "Amarillo", label: "Amarillo", lat: 35.22, lon: -101.83, amenity: 38, gravity: 77, costFriction: 17, glowRadiusMiles: 71, strength: 0.87, litmus: false, region: "TX", rpp: 90.8, popRank: 184 },
    {id: "lbb", name: "Lubbock", label: "Lubbock", lat: 33.58, lon: -101.86, amenity: 40, gravity: 78, costFriction: 17, glowRadiusMiles: 75, strength: 0.88, litmus: false, region: "TX", rpp: 90.9, popRank: 155 },
    {id: "mia", name: "Miami\u2013Fort Lauderdale\u2013West Palm Beach", label: "Miami", lat: 25.76, lon: -80.19, amenity: 91, gravity: 92, costFriction: 77, glowRadiusMiles: 46, strength: 0.98, litmus: true, region: "FL", rpp: 111.8, popRank: 9 },
    {id: "tpa", name: "Tampa\u2013St. Petersburg\u2013Clearwater", label: "Tampa", lat: 27.95, lon: -82.46, amenity: 86, gravity: 89, costFriction: 53, glowRadiusMiles: 58, strength: 0.94, litmus: false, region: "FL", rpp: 103.4, popRank: 17 },
    {id: "orl", name: "Orlando\u2013Kissimmee\u2013Sanford", label: "Orlando", lat: 28.54, lon: -81.38, amenity: 76, gravity: 88, costFriction: 46, glowRadiusMiles: 52, strength: 0.88, litmus: false, region: "FL", rpp: 101.1, popRank: 21 },
    {id: "jax", name: "Jacksonville", label: "Jacksonville", lat: 30.33, lon: -81.66, amenity: 68, gravity: 86, costFriction: 41, glowRadiusMiles: 85, strength: 0.95, litmus: true, region: "FL", rpp: 99.2, popRank: 38 },
    {id: "ftl", name: "Fort Lauderdale (Miami MSA label pin)", label: "Fort Lauderdale", lat: 26.12, lon: -80.14, amenity: 92, gravity: 92, costFriction: 77, glowRadiusMiles: 34, strength: 0.97, litmus: true, region: "FL", rpp: 111.8, popRank: 9, msaOf: "mia" },
    {id: "wpb", name: "West Palm Beach (Miami MSA label pin)", label: "West Palm Beach", lat: 26.72, lon: -80.05, amenity: 91, gravity: 92, costFriction: 77, glowRadiusMiles: 36, strength: 0.96, litmus: false, region: "FL", rpp: 111.8, popRank: 9, msaOf: "mia" },
    {id: "fmy", name: "Cape Coral\u2013Fort Myers", label: "Fort Myers / Cape Coral", lat: 26.56, lon: -82.00, amenity: 86, gravity: 82, costFriction: 50, glowRadiusMiles: 40, strength: 0.9, litmus: false, region: "FL", rpp: 102.6, popRank: 72 },
    {id: "srq", name: "North Port\u2013Sarasota\u2013Bradenton", label: "Sarasota / Bradenton", lat: 27.34, lon: -82.53, amenity: 88, gravity: 83, costFriction: 53, glowRadiusMiles: 46, strength: 0.91, litmus: false, region: "FL", rpp: 103.6, popRank: 63 },
    {id: "nap", name: "Naples\u2013Marco Island", label: "Naples / Marco Island", lat: 26.14, lon: -81.80, amenity: 91, gravity: 79, costFriction: 59, glowRadiusMiles: 40, strength: 0.9, litmus: false, region: "FL", rpp: 105.8, popRank: 135 },
    {id: "pns", name: "Pensacola\u2013Ferry Pass\u2013Brent", label: "Pensacola", lat: 30.4213, lon: -87.2169, amenity: 76, gravity: 80, costFriction: 30, glowRadiusMiles: 78, strength: 0.89, litmus: false, region: "FL", rpp: 95.6, popRank: 107 },
    {id: "tlh", name: "Tallahassee", label: "Tallahassee", lat: 30.4383, lon: -84.2807, amenity: 64, gravity: 79, costFriction: 29, glowRadiusMiles: 72, strength: 0.88, litmus: false, region: "FL", rpp: 95.3, popRank: 141 },
    {id: "gnv", name: "Gainesville", label: "Gainesville", lat: 29.6516, lon: -82.3248, amenity: 67, gravity: 78, costFriction: 34, glowRadiusMiles: 68, strength: 0.88, litmus: false, region: "FL", rpp: 96.9, popRank: 157 },
    {id: "day", name: "Deltona\u2013Daytona Beach\u2013Ormond Beach", label: "Daytona Beach", lat: 29.2108, lon: -81.0228, amenity: 78, gravity: 82, costFriction: 39, glowRadiusMiles: 48, strength: 0.86, litmus: false, region: "FL", rpp: 98.7, popRank: 83 },
    {id: "pmy", name: "Palm Bay\u2013Melbourne\u2013Titusville", label: "Palm Bay / Melbourne", lat: 28.0345, lon: -80.5887, amenity: 82, gravity: 81, costFriction: 45, glowRadiusMiles: 46, strength: 0.86, litmus: false, region: "FL", rpp: 100.8, popRank: 91 },
    {id: "lak", name: "Lakeland\u2013Winter Haven", label: "Lakeland / Winter Haven", lat: 28.0395, lon: -81.9498, amenity: 62, gravity: 82, costFriction: 35, glowRadiusMiles: 34, strength: 0.82, litmus: false, region: "FL", rpp: 97.4, popRank: 75 },
    {id: "psl", name: "Port St. Lucie", label: "Port St. Lucie", lat: 27.273, lon: -80.3582, amenity: 84, gravity: 80, costFriction: 48, glowRadiusMiles: 40, strength: 0.86, litmus: false, region: "FL", rpp: 101.7, popRank: 106 },
    {id: "oca", name: "Ocala", label: "Ocala", lat: 29.1872, lon: -82.1401, amenity: 58, gravity: 79, costFriction: 30, glowRadiusMiles: 40, strength: 0.82, litmus: false, region: "FL", rpp: 95.5, popRank: 134 },
    {id: "pcy", name: "Panama City\u2013Panama City Beach", label: "Panama City", lat: 30.1588, lon: -85.6602, amenity: 74, gravity: 76, costFriction: 37, glowRadiusMiles: 65, strength: 0.87, litmus: false, region: "FL", rpp: 98.0, popRank: 218 },
    {id: "cvw", name: "Crestview\u2013Fort Walton Beach\u2013Destin", label: "Crestview / Fort Walton", lat: 30.7621, lon: -86.5705, amenity: 70, gravity: 77, costFriction: 37, glowRadiusMiles: 64, strength: 0.87, litmus: false, region: "FL", rpp: 98.0, popRank: 170 },
    {id: "hms", name: "Homosassa Springs", label: "Homosassa Springs", lat: 28.7814, lon: -82.6151, amenity: 72, gravity: 74, costFriction: 30, glowRadiusMiles: 34, strength: 0.8, litmus: false, region: "FL", rpp: 95.4, popRank: 263 },
    {id: "vll", name: "Wildwood\u2013The Villages", label: "The Villages", lat: 28.9015, lon: -81.9887, amenity: 61, gravity: 74, costFriction: 27, glowRadiusMiles: 34, strength: 0.8, litmus: false, region: "FL", rpp: 94.3, popRank: 286 },
    {id: "pgd", name: "Punta Gorda", label: "Punta Gorda", lat: 26.9298, lon: -82.0454, amenity: 82, gravity: 76, costFriction: 38, glowRadiusMiles: 34, strength: 0.86, litmus: false, region: "FL", rpp: 98.4, popRank: 225 },
    {id: "seb", name: "Sebastian\u2013Vero Beach", label: "Sebastian / Vero Beach", lat: 27.8164, lon: -80.4706, amenity: 81, gravity: 75, costFriction: 34, glowRadiusMiles: 40, strength: 0.84, litmus: false, region: "FL", rpp: 96.9, popRank: 257 },
    {id: "sbr", name: "Sebring\u2013Avon Park", label: "Sebring", lat: 27.4956, lon: -81.4409, amenity: 48, gravity: 68, costFriction: 18, glowRadiusMiles: 26, strength: 0.72, litmus: false, region: "FL", rpp: 91.3, popRank: 348 },
    {id: "sph", name: "Spring Hill (Tampa MSA label pin)", label: "Spring Hill", lat: 28.4769, lon: -82.5255, amenity: 72, gravity: 89, costFriction: 53, glowRadiusMiles: 36, strength: 0.88, litmus: false, region: "FL", rpp: 103.4, popRank: 17, msaOf: "tpa" },
    {id: "atl", name: "Atlanta\u2013Sandy Springs\u2013Roswell", label: "Atlanta", lat: 33.75, lon: -84.39, amenity: 62, gravity: 92, costFriction: 45, glowRadiusMiles: 110, strength: 0.96, litmus: false, region: "SE", rpp: 100.9, popRank: 6 },
    {id: "cha", name: "Charlotte\u2013Concord\u2013Gastonia", label: "Charlotte", lat: 35.23, lon: -80.84, amenity: 66, gravity: 88, costFriction: 34, glowRadiusMiles: 101, strength: 0.94, litmus: false, region: "SE", rpp: 97.0, popRank: 22 },
    {id: "rdu", name: "Raleigh\u2013Cary", label: "Raleigh", lat: 35.78, lon: -78.64, amenity: 70, gravity: 85, costFriction: 37, glowRadiusMiles: 90, strength: 0.92, litmus: false, region: "SE", rpp: 98.0, popRank: 41 },
    {id: "nash", name: "Nashville\u2013Davidson\u2013Murfreesboro", label: "Nashville", lat: 36.16, lon: -86.78, amenity: 74, gravity: 87, costFriction: 35, glowRadiusMiles: 100, strength: 0.93, litmus: false, region: "SE", rpp: 97.4, popRank: 35 },
    {id: "mem", name: "Memphis", label: "Memphis", lat: 35.15, lon: -90.05, amenity: 48, gravity: 85, costFriction: 21, glowRadiusMiles: 70, strength: 0.92, litmus: false, region: "SE", rpp: 92.4, popRank: 45 },
    {id: "bhm", name: "Birmingham\u2013Hoover", label: "Birmingham", lat: 33.52, lon: -86.81, amenity: 42, gravity: 84, costFriction: 22, glowRadiusMiles: 65, strength: 0.91, litmus: false, region: "SE", rpp: 92.6, popRank: 47 },
    {id: "gulf", name: "Mobile / Gulf Coast AL", label: "Mobile", lat: 30.69, lon: -88.04, amenity: 72, gravity: 79, costFriction: 13, glowRadiusMiles: 95, strength: 0.88, litmus: false, region: "SE", rpp: 89.4, popRank: 133 },
    {id: "nola", name: "New Orleans\u2013Metairie", label: "New Orleans", lat: 29.95, lon: -90.07, amenity: 70, gravity: 83, costFriction: 17, glowRadiusMiles: 87, strength: 0.91, litmus: false, region: "SE", rpp: 91.1, popRank: 58 },
    {id: "hsv", name: "Huntsville", label: "Huntsville", lat: 34.73, lon: -86.59, amenity: 58, gravity: 80, costFriction: 27, glowRadiusMiles: 80, strength: 0.89, litmus: false, region: "SE", rpp: 94.4, popRank: 108 },
    {id: "knx", name: "Knoxville", label: "Knoxville", lat: 35.96, lon: -83.92, amenity: 55, gravity: 83, costFriction: 22, glowRadiusMiles: 87, strength: 0.91, litmus: false, region: "Appalachia", rpp: 92.8, popRank: 60 },
    {id: "cht", name: "Chattanooga", label: "Chattanooga", lat: 35.05, lon: -85.31, amenity: 52, gravity: 81, costFriction: 22, glowRadiusMiles: 81, strength: 0.9, litmus: false, region: "Appalachia", rpp: 92.8, popRank: 99 },
    {id: "gsp", name: "Greenville\u2013Anderson", label: "Greenville", lat: 34.85, lon: -82.39, amenity: 54, gravity: 83, costFriction: 22, glowRadiusMiles: 88, strength: 0.91, litmus: false, region: "SE", rpp: 92.8, popRank: 57 },
    {id: "chs", name: "Charleston\u2013North Charleston", label: "Charleston SC", lat: 32.78, lon: -79.93, amenity: 78, gravity: 83, costFriction: 45, glowRadiusMiles: 86, strength: 0.91, litmus: false, region: "SE", rpp: 100.6, popRank: 71 },
    {id: "ric", name: "Richmond", label: "Richmond", lat: 37.54, lon: -77.44, amenity: 60, gravity: 85, costFriction: 37, glowRadiusMiles: 92, strength: 0.92, litmus: false, region: "Mid-Atlantic", rpp: 98.0, popRank: 44 },
    {id: "orf", name: "Virginia Beach\u2013Norfolk", label: "Hampton Roads", lat: 36.85, lon: -76.29, amenity: 68, gravity: 86, costFriction: 35, glowRadiusMiles: 95, strength: 0.93, litmus: false, region: "Mid-Atlantic", rpp: 97.4, popRank: 37 },
    {id: "nyc", name: "New York\u2013Newark\u2013Jersey City", label: "NYC", lat: 40.71, lon: -74.01, amenity: 82, gravity: 98, costFriction: 79, glowRadiusMiles: 100, strength: 1.0, litmus: false, region: "NE", rpp: 112.5, popRank: 1 },
    {id: "bos", name: "Boston\u2013Cambridge\u2013Newton", label: "Boston", lat: 42.36, lon: -71.06, amenity: 75, gravity: 91, costFriction: 76, glowRadiusMiles: 85, strength: 0.96, litmus: false, region: "NE", rpp: 111.6, popRank: 11 },
    {id: "phi", name: "Philadelphia\u2013Camden\u2013Wilmington", label: "Philadelphia", lat: 39.95, lon: -75.17, amenity: 70, gravity: 92, costFriction: 53, glowRadiusMiles: 112, strength: 0.96, litmus: false, region: "Mid-Atlantic", rpp: 103.5, popRank: 8 },
    {id: "was", name: "Washington\u2013Arlington\u2013Alexandria", label: "DC", lat: 38.91, lon: -77.04, amenity: 72, gravity: 92, costFriction: 67, glowRadiusMiles: 112, strength: 0.96, litmus: false, region: "Mid-Atlantic", rpp: 108.6, popRank: 7 },
    {id: "bal", name: "Baltimore\u2013Columbia\u2013Towson", label: "Baltimore", lat: 39.29, lon: -76.61, amenity: 65, gravity: 88, costFriction: 51, glowRadiusMiles: 101, strength: 0.94, litmus: false, region: "Mid-Atlantic", rpp: 102.7, popRank: 20 },
    {id: "pit", name: "Pittsburgh", label: "Pittsburgh", lat: 40.44, lon: -79.99, amenity: 58, gravity: 88, costFriction: 27, glowRadiusMiles: 99, strength: 0.94, litmus: false, region: "Appalachia", rpp: 94.4, popRank: 27 },
    {id: "buf", name: "Buffalo\u2013Cheektowaga", label: "Buffalo", lat: 42.89, lon: -78.88, amenity: 52, gravity: 84, costFriction: 27, glowRadiusMiles: 90, strength: 0.91, litmus: false, region: "Upstate NY", rpp: 94.4, popRank: 50 },
    {id: "roc", name: "Rochester NY", label: "Rochester", lat: 43.16, lon: -77.61, amenity: 55, gravity: 84, costFriction: 36, glowRadiusMiles: 89, strength: 0.91, litmus: false, region: "Upstate NY", rpp: 97.7, popRank: 53 },
    {id: "syr", name: "Syracuse", label: "Syracuse", lat: 43.05, lon: -76.15, amenity: 50, gravity: 81, costFriction: 29, glowRadiusMiles: 82, strength: 0.9, litmus: false, region: "Upstate NY", rpp: 95.2, popRank: 89 },
    {id: "alb", name: "Albany\u2013Schenectady\u2013Troy", label: "Albany", lat: 42.65, lon: -73.76, amenity: 58, gravity: 83, costFriction: 36, glowRadiusMiles: 87, strength: 0.91, litmus: false, region: "Upstate NY", rpp: 97.6, popRank: 64 },
    {id: "pro", name: "Providence\u2013Warwick", label: "Providence", lat: 41.82, lon: -71.41, amenity: 62, gravity: 86, costFriction: 45, glowRadiusMiles: 95, strength: 0.93, litmus: false, region: "NE", rpp: 100.9, popRank: 39 },
    {id: "hfd", name: "Hartford\u2013East Hartford", label: "Hartford", lat: 41.76, lon: -72.69, amenity: 60, gravity: 84, costFriction: 50, glowRadiusMiles: 90, strength: 0.91, litmus: false, region: "NE", rpp: 102.6, popRank: 51 },
    {id: "chi", name: "Chicago\u2013Naperville\u2013Elgin", label: "Chicago", lat: 41.88, lon: -87.63, amenity: 70, gravity: 94, costFriction: 50, glowRadiusMiles: 120, strength: 0.98, litmus: false, region: "Midwest", rpp: 102.6, popRank: 3 },
    {id: "det", name: "Detroit\u2013Warren\u2013Dearborn", label: "Detroit", lat: 42.33, lon: -83.05, amenity: 55, gravity: 91, costFriction: 37, glowRadiusMiles: 107, strength: 0.96, litmus: false, region: "Midwest", rpp: 98.0, popRank: 14 },
    {id: "msp", name: "Minneapolis\u2013St. Paul", label: "Minneapolis", lat: 44.98, lon: -93.27, amenity: 68, gravity: 90, costFriction: 56, glowRadiusMiles: 100, strength: 0.95, litmus: false, region: "Midwest", rpp: 104.5, popRank: 16 },
    {id: "cle", name: "Cleveland\u2013Elyria", label: "Cleveland", lat: 41.5, lon: -81.69, amenity: 52, gravity: 87, costFriction: 23, glowRadiusMiles: 98, strength: 0.93, litmus: false, region: "Midwest", rpp: 93.0, popRank: 33 },
    {id: "cmh", name: "Columbus OH", label: "Columbus", lat: 39.96, lon: -83.0, amenity: 58, gravity: 87, costFriction: 27, glowRadiusMiles: 98, strength: 0.93, litmus: false, region: "Midwest", rpp: 94.5, popRank: 32 },
    {id: "cin", name: "Cincinnati", label: "Cincinnati", lat: 39.1, lon: -84.51, amenity: 56, gravity: 87, costFriction: 26, glowRadiusMiles: 99, strength: 0.93, litmus: false, region: "Midwest", rpp: 94.1, popRank: 30 },
    {id: "ind", name: "Indianapolis\u2013Carmel\u2013Anderson", label: "Indianapolis", lat: 39.77, lon: -86.16, amenity: 54, gravity: 87, costFriction: 27, glowRadiusMiles: 98, strength: 0.93, litmus: false, region: "Midwest", rpp: 94.6, popRank: 34 },
    {id: "mil", name: "Milwaukee\u2013Waukesha", label: "Milwaukee", lat: 43.04, lon: -87.91, amenity: 58, gravity: 86, costFriction: 30, glowRadiusMiles: 94, strength: 0.93, litmus: false, region: "Midwest", rpp: 95.5, popRank: 40 },
    {id: "stl", name: "St. Louis", label: "St. Louis", lat: 38.63, lon: -90.2, amenity: 55, gravity: 88, costFriction: 32, glowRadiusMiles: 101, strength: 0.94, litmus: false, region: "Midwest", rpp: 96.3, popRank: 23 },
    {id: "kc", name: "Kansas City", label: "Kansas City", lat: 39.1, lon: -94.58, amenity: 56, gravity: 87, costFriction: 24, glowRadiusMiles: 98, strength: 0.93, litmus: false, region: "Midwest", rpp: 93.3, popRank: 31 },
    {id: "lou", name: "Louisville/Jefferson County", label: "Louisville", lat: 38.25, lon: -85.76, amenity: 52, gravity: 85, costFriction: 26, glowRadiusMiles: 92, strength: 0.92, litmus: false, region: "Midwest", rpp: 94.0, popRank: 43 },
    {id: "grr", name: "Grand Rapids\u2013Kentwood", label: "Grand Rapids", lat: 42.96, lon: -85.67, amenity: 55, gravity: 84, costFriction: 29, glowRadiusMiles: 90, strength: 0.91, litmus: false, region: "Midwest", rpp: 95.2, popRank: 49 },
    {id: "oma", name: "Omaha\u2013Council Bluffs", label: "Omaha", lat: 41.26, lon: -95.93, amenity: 48, gravity: 83, costFriction: 21, glowRadiusMiles: 88, strength: 0.91, litmus: false, region: "Great Plains", rpp: 92.5, popRank: 56 },
    {id: "ict", name: "Wichita", label: "Wichita", lat: 37.69, lon: -97.34, amenity: 40, gravity: 81, costFriction: 13, glowRadiusMiles: 82, strength: 0.9, litmus: false, region: "Great Plains", rpp: 89.5, popRank: 90 },
    {id: "okc", name: "Oklahoma City", label: "Oklahoma City", lat: 35.47, lon: -97.52, amenity: 50, gravity: 85, costFriction: 17, glowRadiusMiles: 93, strength: 0.92, litmus: false, region: "Great Plains", rpp: 91.0, popRank: 42 },
    {id: "tul", name: "Tulsa", label: "Tulsa", lat: 36.15, lon: -95.99, amenity: 48, gravity: 84, costFriction: 13, glowRadiusMiles: 88, strength: 0.91, litmus: false, region: "Great Plains", rpp: 89.5, popRank: 54 },
    {id: "dsm", name: "Des Moines\u2013West Des Moines", label: "Des Moines", lat: 41.59, lon: -93.62, amenity: 50, gravity: 82, costFriction: 22, glowRadiusMiles: 84, strength: 0.9, litmus: false, region: "Great Plains", rpp: 92.7, popRank: 81 },
    {id: "fsd", name: "Sioux Falls", label: "Sioux Falls", lat: 43.54, lon: -96.73, amenity: 45, gravity: 77, costFriction: 15, glowRadiusMiles: 72, strength: 0.87, litmus: false, region: "Great Plains", rpp: 90.3, popRank: 171 },
    {id: "far", name: "Fargo, ND-MN", label: "Fargo", lat: 46.88, lon: -96.79, amenity: 30, gravity: 55, costFriction: 13, glowRadiusMiles: 70, strength: 0.72, litmus: false, region: "ND / Great Plains", rpp: 89.4, popRank: 189, coolField: true },
    {id: "bis", name: "Bismarck, ND", label: "Bismarck", lat: 46.8083, lon: -100.7837, amenity: 26, gravity: 48, costFriction: 13, glowRadiusMiles: 62, strength: 0.68, litmus: true, region: "ND / Great Plains", rpp: 89.6, popRank: 305, coolField: true },
    {id: "mot", name: "Minot, ND", label: "Minot", lat: 48.2325, lon: -101.2963, amenity: 22, gravity: 40, costFriction: 10, glowRadiusMiles: 55, strength: 0.62, litmus: false, region: "ND / Great Plains", rpp: 88.6, popRank: 382, coolField: true },
    {id: "gfk", name: "Grand Forks, ND-MN", label: "Grand Forks", lat: 47.9253, lon: -97.0329, amenity: 28, gravity: 46, costFriction: 8, glowRadiusMiles: 58, strength: 0.65, litmus: false, region: "ND / Great Plains", rpp: 86.2, popRank: 357, coolField: true },
    {id: "rnd", name: "Rural NW North Dakota (Williston plains)", label: "Rural ND", lat: 48.147, lon: -103.618, amenity: 15, gravity: 12, costFriction: 10, glowRadiusMiles: 1, strength: 0.0, litmus: true, region: "ND / Great Plains", rpp: 88.6, popRank: 999, coolField: true },
    {id: "lit", name: "Little Rock\u2013North Little Rock", label: "Little Rock", lat: 34.75, lon: -92.29, amenity: 45, gravity: 82, costFriction: 12, glowRadiusMiles: 84, strength: 0.9, litmus: false, region: "SE", rpp: 89.1, popRank: 80 },
    {id: "crw", name: "Charleston WV", label: "Charleston WV", lat: 38.35, lon: -81.63, amenity: 35, gravity: 75, costFriction: 10, glowRadiusMiles: 67, strength: 0.86, litmus: false, region: "Appalachia", rpp: 88.4, popRank: 228 },
    {id: "hts", name: "Huntington\u2013Ashland", label: "Huntington", lat: 38.42, lon: -82.45, amenity: 32, gravity: 78, costFriction: 10, glowRadiusMiles: 75, strength: 0.88, litmus: false, region: "Appalachia", rpp: 88.4, popRank: 152 },
    {id: "gso", name: "Greensboro\u2013High Point", label: "Greensboro", lat: 36.07, lon: -79.79, amenity: 50, gravity: 82, costFriction: 22, glowRadiusMiles: 85, strength: 0.9, litmus: false, region: "SE", rpp: 92.7, popRank: 78 },
    {id: "mad", name: "Madison", label: "Madison", lat: 43.07, lon: -89.4, amenity: 72, gravity: 82, costFriction: 31, glowRadiusMiles: 83, strength: 0.9, litmus: false, region: "Midwest", rpp: 95.8, popRank: 87 },
    {id: "anc", name: "Anchorage", label: "Anchorage", lat: 61.22, lon: -149.9, amenity: 78, gravity: 79, costFriction: 56, glowRadiusMiles: 76, strength: 0.88, litmus: false, region: "Other", rpp: 104.5, popRank: 137 },
  ];

  var JUMPS = {
    rnd: { lat: 48.147, lon: -103.618 },
    bis: { lat: 46.8083, lon: -100.7837 },
    far: { lat: 46.88, lon: -96.79 },
    wtx: { lat: 31.997, lon: -102.078 },
    dfw: { lat: 32.78, lon: -96.80 },
    hou: { lat: 29.76, lon: -95.37 },
    aus: { lat: 30.27, lon: -97.74 },
    la: { lat: 34.05, lon: -118.25 },
    sd: { lat: 32.7157, lon: -117.1611 },
    mia: { lat: 25.76, lon: -80.19 },
    ftl: { lat: 26.12, lon: -80.14 },
    wpb: { lat: 26.72, lon: -80.05 },
    jax: { lat: 30.33, lon: -81.66 }
  };

  var LABEL_OFFSET = {
    la:  [10, -18], sd: [10, 16], dfw: [10, -14], hou: [10, 14],
    aus: [-8, -22], wtx: [0, -22], bis: [10, -14], rnd: [0, -22], far: [10, 14], phx: [10, -12], mem: [10, -12],
    bhm: [10, 14], gulf: [8, 16], nash: [10, -14], chi: [10, -14], nyc: [10, -14]
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function milesBetween(lat1, lon1, lat2, lon2) {
    var R = 3958.8;
    var toR = Math.PI / 180;
    var dLat = (lat2 - lat1) * toR;
    var dLon = (lon2 - lon1) * toR;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function falloff(distMiles, radiusMiles) {
    if (distMiles >= radiusMiles) return 0;
    var t = distMiles / radiusMiles;
    return Math.exp(-3.2 * t * t);
  }
  function metroById(id) {
    for (var i = 0; i < METROS.length; i++) if (METROS[i].id === id) return METROS[i];
    return null;
  }
  function resolveMsa(m) {
    if (m && m.msaOf) {
      var parent = metroById(m.msaOf);
      if (parent) return parent;
    }
    return m;
  }
  function nearestMetro(lat, lon) {
    var best = METROS[0], bestD = Infinity;
    for (var i = 0; i < METROS.length; i++) {
      var d = milesBetween(lat, lon, METROS[i].lat, METROS[i].lon);
      if (d < bestD) { bestD = d; best = METROS[i]; }
    }
    return resolveMsa(best);
  }
  function sampleField(lat, lon) {
    var amenity = 0, gravity = 0, cost = 0, wSum = 0, heat = 0, beachPull = 0;
    for (var i = 0; i < METROS.length; i++) {
      var m = METROS[i];
      var d = milesBetween(lat, lon, m.lat, m.lon);
      var f = falloff(d, m.glowRadiusMiles) * m.strength;
      if (f <= 0.002) continue;
      amenity += m.amenity * f;
      gravity += m.gravity * f;
      cost += m.costFriction * f;
      wSum += f;
      heat += f * ((m.amenity * 0.35 + m.gravity * 0.45 - m.costFriction * 0.15) / 100 + 0.35);
      if (m.amenity >= 85) beachPull = Math.max(beachPull, m.amenity * Math.min(1, f / 0.35));
    }
    var baseAmenity = 28, baseGravity = 22, baseCost = 25;
    if (wSum < 0.15 && beachPull < 70) {
      var blend = wSum / 0.15;
      amenity = amenity + baseAmenity * (1 - blend) * 0.15;
      gravity = gravity + baseGravity * (1 - blend) * 0.15;
      cost = cost + baseCost * (1 - blend) * 0.15;
      wSum = Math.max(wSum, 0.15);
      heat += (1 - blend) * 0.12;
    } else if (wSum < 0.15) {
      wSum = Math.max(wSum, 0.15);
    }
    amenity /= wSum; gravity /= wSum; cost /= wSum;
    if (beachPull >= 70) amenity = Math.max(amenity, beachPull * 0.92);
    var draw = amenity * 0.38 + gravity * 0.42 + (100 - cost) * 0.12 + heat * 8;
    draw = Math.max(8, Math.min(98, draw));
    var pressure = Math.max(5, Math.min(95, 100 - draw * 0.92 + (cost - 50) * 0.08));
    return {
      amenity: clamp(amenity, 0, 100),
      gravity: clamp(gravity, 0, 100),
      cost: clamp(cost, 0, 100),
      draw: Math.round(draw),
      pressure: Math.round(pressure),
      cashLift: Math.round(pressure)
    };
  }
  function cashMode(s, lat, lon) {
    if (lat != null && lon != null) {
      var n = nearestMetro(lat, lon);
      if (n && n.coolField) return "amplify";
    }
    return s.draw >= 58 ? "compress" : "amplify";
  }
  function whySentence(s, lat, lon) {
    var nearest = nearestMetro(lat, lon).label;
    if (cashMode(s, lat, lon) === "compress") {
      return "Metro compress near " + nearest + ": high place draw settles the whole cash ladder at or below baseline Competitive (esp. Competitive after COL). ORDER stays Red < Competitive < Magnet < Destination — Red always lowest. Then COL/taxes/cost friction stacks on that ladder (same map).";
    }
    return "Cool-field amplify near " + nearest + ": outside metro glows lifts the whole cash ladder (Competitive at/above AMP YOUR Baseline; Magnet & Destination further above Comp). ORDER stays Red < Competitive < Magnet < Destination — Red always lowest. Then COL/taxes/cost friction stacks on that ladder (same map, not a second heat map).";
  }
  function formatMoney(n) {
    if (n == null || isNaN(n)) return "—";
    return "$" + Math.round(n / 1000) + "k";
  }
  function resolveBands(specBands) {
    if (specBands && specBands.competitive != null) {
      return {
        redAlert: specBands.redAlert,
        competitive: specBands.competitive,
        magnet: specBands.magnet,
        destination: specBands.destination,
        baseline: specBands.competitive
      };
    }
    return { redAlert: FM_BANDS.redAlert, competitive: FM_BANDS.competitive, magnet: FM_BANDS.magnet, destination: FM_BANDS.destination, baseline: FM_BASELINE, lockedFm: true };
  }
  function computeBands(s, lat, lon, specBands) {
    var resolved = resolveBands(specBands);
    var base = resolved.baseline;
    var placeMode = cashMode(s, lat, lon);
    var compressAmt = clamp((s.draw - 58) / 40, 0, 1);
    var amplifyAmt = placeMode === "amplify" ? clamp(Math.max(58 - s.draw, 8) / 50, 0.16, 1) : 0;
    var placeFactor = placeMode === "compress" ? (1 - compressAmt * 0.08) : (1 + amplifyAmt * 0.08);
    var redRatio, magnetRatio, destRatio;
    if (placeMode === "compress") {
      redRatio = 0.88 - compressAmt * 0.05;
      magnetRatio = 1.15 + compressAmt * 0.02;
      destRatio = 1.35 + compressAmt * 0.05;
    } else {
      redRatio = 0.90 - amplifyAmt * 0.05;
      magnetRatio = 1.18 + amplifyAmt * 0.07;
      destRatio = 1.38 + amplifyAmt * 0.12;
    }
    var competitive = base * placeFactor;
    var red = competitive * redRatio;
    var magnet = competitive * magnetRatio;
    var destination = competitive * destRatio;
    var colFactor = 1 + ((s.cost - 50) / 50) * 0.08;
    if (placeMode === "compress" && colFactor > 1) {
      colFactor = 1 + (colFactor - 1) * (1 - compressAmt * 0.72);
    }
    var colPct = Math.round((colFactor - 1) * 1000) / 10;
    competitive *= colFactor; red *= colFactor; magnet *= colFactor; destination *= colFactor;
    if (placeMode === "amplify" && competitive < base) {
      var lift = base / competitive;
      competitive *= lift; red *= lift; magnet *= lift; destination *= lift;
    }
    if (placeMode === "compress" && competitive > base) {
      var damp = base / competitive;
      competitive *= damp; red *= damp; magnet *= damp; destination *= damp;
    }
    if (red >= competitive) red = competitive * 0.88;
    if (magnet <= competitive) magnet = competitive * 1.15;
    if (destination <= magnet) destination = magnet * (1.35 / 1.15);
    if (!(red < competitive && competitive < magnet && magnet < destination)) {
      var vals = [red, competitive, magnet, destination].sort(function (a, b) { return a - b; });
      red = vals[0]; competitive = vals[1]; magnet = vals[2]; destination = vals[3];
    }
    return {
      placeMode: placeMode, compressAmt: compressAmt, amplifyAmt: amplifyAmt, placeFactor: placeFactor,
      colPct: colPct, colFactor: colFactor, competitive: competitive, red: red, destination: destination,
      magnet: magnet, base: base, lockedFm: !!resolved.lockedFm
    };
  }

  function heatToColor(t, light) {
    t = clamp(t, 0, 1.35) / 1.35;
    var stops = light ? [
      [0.00, [183, 196, 212]], [0.20, [150, 180, 198]], [0.38, [90, 165, 185]],
      [0.55, [42, 155, 181]], [0.72, [20, 184, 166]], [0.88, [110, 210, 200]], [1.00, [167, 243, 208]]
    ] : [
      [0.00, [28, 45, 66]], [0.18, [30, 55, 78]], [0.35, [36, 90, 110]],
      [0.52, [42, 155, 181]], [0.70, [20, 184, 166]], [0.85, [94, 200, 190]], [1.00, [204, 251, 241]]
    ];
    var a = stops[0], b = stops[stops.length - 1];
    for (var i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    }
    var u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
    return [
      Math.round(a[1][0] + (b[1][0] - a[1][0]) * u),
      Math.round(a[1][1] + (b[1][1] - a[1][1]) * u),
      Math.round(a[1][2] + (b[1][2] - a[1][2]) * u)
    ];
  }

  function bakeHeat(opts) {
    opts = opts || {};
    var light = opts.light !== false;
    var step = opts.step || 6;
    var W = 959, H = 593;
    var cols = Math.ceil(W / step);
    var rows = Math.ceil(H / step);
    if (typeof document === "undefined") return null;
    var tmp = document.createElement("canvas");
    tmp.width = cols; tmp.height = rows;
    var tctx = tmp.getContext("2d");
    var img = tctx.createImageData(cols, rows);
    var data = img.data;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var x = i * step + step / 2;
        var y = j * step + step / 2;
        var ll = svgToLonLat(x, y);
        var idx = (j * cols + i) * 4;
        if (ll.lon < -126 || ll.lon > -66 || ll.lat < 23 || ll.lat > 50) {
          data[idx] = 10; data[idx+1] = 16; data[idx+2] = 24; data[idx+3] = 0;
          continue;
        }
        var heat = 0;
        for (var k = 0; k < METROS.length; k++) {
          var m = METROS[k];
          var d = milesBetween(ll.lat, ll.lon, m.lat, m.lon);
          var f = falloff(d, m.glowRadiusMiles) * m.strength;
          if (m.strength > 0 && m.glowRadiusMiles > 2) {
            var mx = lonLatToSvg(m.lon, m.lat);
            var mx2 = lonLatToSvg(m.lon + m.glowRadiusMiles / 54.6, m.lat);
            var rPx = Math.max(8, Math.abs(mx2[0] - mx[0]));
            var dPx = Math.hypot(x - mx[0], y - mx[1]);
            if (dPx < rPx) {
              var t = dPx / rPx;
              f = Math.max(f, Math.exp(-3.2 * t * t) * m.strength);
            }
          }
          heat += f * ((m.amenity * 0.4 + m.gravity * 0.5) / 100);
        }
        heat = Math.min(1.35, heat);
        var c = heatToColor(heat, light);
        var alpha = light
          ? Math.round(clamp(heat / 1.35, 0, 1) * 125 + (heat > 0.10 ? 28 : 0))
          : Math.round(clamp(heat / 1.35, 0, 1) * 200 + (heat > 0.08 ? 40 : 0));
        data[idx] = c[0]; data[idx+1] = c[1]; data[idx+2] = c[2]; data[idx+3] = alpha;
      }
    }
    tctx.putImageData(img, 0, 0);
    var out = document.createElement("canvas");
    out.width = W; out.height = H;
    var octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "medium";
    octx.drawImage(tmp, 0, 0, W, H);
    octx.filter = "blur(1.6px)";
    octx.drawImage(out, 0, 0);
    octx.filter = "none";
    return out.toDataURL("image/png");
  }

  function litmusVerify(specBands) {
    var extra = {
      fmy: { lat: 26.5629, lon: -81.9495 },
      mot: { lat: 48.2325, lon: -101.2963 },
      gfk: { lat: 47.9253, lon: -97.0329 }
    };
    var pins = {};
    var k;
    for (k in JUMPS) if (Object.prototype.hasOwnProperty.call(JUMPS, k)) pins[k] = JUMPS[k];
    for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) pins[k] = extra[k];
    var rows = [];
    for (k in pins) {
      if (!Object.prototype.hasOwnProperty.call(pins, k)) continue;
      var j = pins[k];
      var s = sampleField(j.lat, j.lon);
      var b = computeBands(s, j.lat, j.lon, specBands);
      var orderOk = b.red < b.competitive && b.competitive < b.magnet && b.magnet < b.destination;
      var modeOk = b.placeMode === "amplify" ? (b.competitive >= b.base - 50) : (b.competitive <= b.base + 50);
      rows.push({
        id: k, draw: s.draw, mode: b.placeMode,
        red: Math.round(b.red), comp: Math.round(b.competitive),
        magnet: Math.round(b.magnet), dest: Math.round(b.destination),
        base: b.base, orderOk: orderOk, modeOk: modeOk, colPct: b.colPct
      });
    }
    return rows;
  }

  /* ---- live map mount (browser) ---- */
  var live = {
    enabled: false,
    hoverOn: true,
    light: true,
    bands: null,
    pin: { lat: 31.997, lon: -102.078, svgX: null, svgY: null },
    host: null,
    wrap: null,
    svg: null,
    heatCache: null,
    heatCacheKey: "",
    onPinChange: null,
    onStateFromPin: null,
    hoverRaf: 0,
    hoverPending: null,
    dragging: false
  };

  function elNS(name) { return document.createElementNS(NS, name); }
  function ensureLayer(svg, id, afterId) {
    var g = svg.querySelector("#" + id);
    if (g) return g;
    g = elNS("g");
    g.setAttribute("id", id);
    g.setAttribute("pointer-events", "none");
    var after = afterId ? svg.querySelector("#" + afterId) : null;
    if (after && after.nextSibling) svg.insertBefore(g, after.nextSibling);
    else svg.appendChild(g);
    return g;
  }
  function ensureBorderGlow(svg) {
    var defs = svg.querySelector("defs");
    if (!defs) {
      defs = elNS("defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    var old = svg.querySelector("#ampStateBorderGlow");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var glow = elNS("filter");
    glow.setAttribute("id", "ampStateBorderGlow");
    glow.setAttribute("x", "-150%"); glow.setAttribute("y", "-150%");
    glow.setAttribute("width", "400%"); glow.setAttribute("height", "400%");
    glow.setAttribute("color-interpolation-filters", "sRGB");
    glow.innerHTML =
      '<feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b1"/>' +
      '<feFlood id="miGlowFlood1" flood-color="#0B3A4D" flood-opacity="0.88" result="f1"/>' +
      '<feComposite in="f1" in2="b1" operator="in" result="g1"/>' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="b2"/>' +
      '<feFlood id="miGlowFlood2" flood-color="#2a9bb5" flood-opacity="0.85" result="f2"/>' +
      '<feComposite in="f2" in2="b2" operator="in" result="g2"/>' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b3"/>' +
      '<feFlood id="miGlowFlood3" flood-color="#0f766e" flood-opacity="0.55" result="f3"/>' +
      '<feComposite in="f3" in2="b3" operator="in" result="g3"/>' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="12" result="b4"/>' +
      '<feFlood id="miGlowFlood4" flood-color="#14b8a6" flood-opacity="0.32" result="f4"/>' +
      '<feComposite in="f4" in2="b4" operator="in" result="g4"/>' +
      '<feMerge><feMergeNode in="g4"/><feMergeNode in="g3"/><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="SourceGraphic"/></feMerge>';
    defs.appendChild(glow);
  }
  function ensureHeatImage(svg) {
    var img = svg.querySelector("#heatLayer");
    if (img) return img;
    img = elNS("image");
    img.setAttribute("id", "heatLayer");
    img.setAttribute("x", "0"); img.setAttribute("y", "0");
    img.setAttribute("width", "959"); img.setAttribute("height", "593");
    img.setAttribute("preserveAspectRatio", "none");
    img.setAttribute("pointer-events", "none");
    img.style.opacity = "0.58";
    var states = svg.querySelector("g.state") || svg.querySelector(".state");
    if (states && states.nextSibling) svg.insertBefore(img, states.nextSibling);
    else svg.appendChild(img);
    return img;
  }
  function clientToSvg(svg, clientX, clientY) {
    if (!svg || !svg.createSVGPoint) return null;
    var pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    var sp = pt.matrixTransform(ctm.inverse());
    return { x: sp.x, y: sp.y };
  }
  function stateAtSvg(svg, x, y) {
    if (!svg) return null;
    var pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    var paths = svg.querySelectorAll("path[data-state]");
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      try {
        if (typeof p.isPointInFill === "function" && p.isPointInFill(pt)) return p.getAttribute("data-state");
      } catch (e) {}
    }
    return null;
  }
  function setPinLonLat(lat, lon) {
    live.pin.lat = lat; live.pin.lon = lon;
    var xy = lonLatToSvg(lon, lat);
    live.pin.svgX = xy[0]; live.pin.svgY = xy[1];
  }
  function renderHeatLayer() {
    if (!live.svg || !live.enabled) return;
    var img = ensureHeatImage(live.svg);
    var key = "light|6";
    if (!live.heatCache || live.heatCacheKey !== key) {
      live.heatCache = bakeHeat({ light: true, step: 6 });
      live.heatCacheKey = key;
    }
    if (live.heatCache) img.setAttribute("href", live.heatCache);
    img.style.display = "";
  }
  function hideHeatLayer() {
    if (!live.svg) return;
    var img = live.svg.querySelector("#heatLayer");
    if (img) img.style.display = "none";
  }
  function renderOverlays() {
    if (!live.svg || !live.enabled) return;
    var labelLayer = ensureLayer(live.svg, "pdLabelLayer", "heatLayer");
    var pinLayer = ensureLayer(live.svg, "pdPinLayer", "pdLabelLayer");
    var outline = ensureLayer(live.svg, "selectionOutline", "pdPinLayer");
    labelLayer.innerHTML = "";
    pinLayer.innerHTML = "";
    var primary = { wtx:1, dfw:1, hou:1, aus:1, la:1, sd:1 };
    for (var i = 0; i < METROS.length; i++) {
      var m = METROS[i];
      if (!primary[m.id] && !m.litmus) continue;
      var xy = lonLatToSvg(m.lon, m.lat);
      var bx = xy[0], by = xy[1];
      var cool = !!m.coolField;
      if (!cool && m.strength > 0) {
        var dot = elNS("circle");
        dot.setAttribute("cx", bx); dot.setAttribute("cy", by); dot.setAttribute("r", "3.5");
        dot.setAttribute("fill", "rgba(20,184,166,0.90)");
        labelLayer.appendChild(dot);
        var ring = elNS("circle");
        ring.setAttribute("cx", bx); ring.setAttribute("cy", by); ring.setAttribute("r", "6");
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "rgba(42,155,181,0.40)");
        ring.setAttribute("stroke-width", "1.25");
        labelLayer.appendChild(ring);
      } else if (cool) {
        var cr = elNS("circle");
        cr.setAttribute("cx", bx); cr.setAttribute("cy", by); cr.setAttribute("r", "7");
        cr.setAttribute("fill", "none");
        cr.setAttribute("stroke", "rgba(20,184,166,0.95)");
        cr.setAttribute("stroke-width", "2");
        labelLayer.appendChild(cr);
        var cd = elNS("circle");
        cd.setAttribute("cx", bx); cd.setAttribute("cy", by); cd.setAttribute("r", "3");
        cd.setAttribute("fill", "#14b8a6");
        labelLayer.appendChild(cd);
      }
      if (!primary[m.id]) continue;
      var off = LABEL_OFFSET[m.id] || [10, -14];
      var approxW = m.label.length * 6.6 + 18;
      var chipH = 20;
      var lx = cool ? (bx - approxW / 2) : (bx + off[0]);
      var ly = by + off[1] - chipH / 2;
      var g = elNS("g");
      var rect = elNS("rect");
      rect.setAttribute("x", lx); rect.setAttribute("y", ly);
      rect.setAttribute("width", approxW); rect.setAttribute("height", chipH);
      rect.setAttribute("rx", "10");
      rect.setAttribute("fill", "rgba(255,255,255,0.94)");
      rect.setAttribute("stroke", cool ? "rgba(20,184,166,0.55)" : "rgba(42,155,181,0.45)");
      g.appendChild(rect);
      var text = elNS("text");
      text.setAttribute("x", lx + approxW / 2);
      text.setAttribute("y", ly + chipH / 2 + 0.5);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", cool ? "#0f766e" : "#152033");
      text.setAttribute("font-size", "11");
      text.setAttribute("font-weight", "650");
      text.textContent = m.label;
      g.appendChild(text);
      labelLayer.appendChild(g);
    }
    var px = live.pin.svgX, py = live.pin.svgY;
    if (px == null || py == null) {
      var pxy = lonLatToSvg(live.pin.lon, live.pin.lat);
      px = pxy[0]; py = pxy[1];
      live.pin.svgX = px; live.pin.svgY = py;
    }
    var soft = elNS("circle");
    soft.setAttribute("cx", px); soft.setAttribute("cy", py); soft.setAttribute("r", "18");
    soft.setAttribute("fill", "none");
    soft.setAttribute("stroke", "rgba(42,155,181,0.30)");
    soft.setAttribute("stroke-width", "2");
    pinLayer.appendChild(soft);
    var accent = elNS("circle");
    accent.setAttribute("cx", px); accent.setAttribute("cy", py); accent.setAttribute("r", "12");
    accent.setAttribute("fill", "none");
    accent.setAttribute("stroke", "rgba(20,184,166,0.85)");
    accent.setAttribute("stroke-width", "2.5");
    pinLayer.appendChild(accent);
    var pinPath = elNS("path");
    pinPath.setAttribute("d", "M " + px + " " + py + " C " + (px + 11) + " " + (py - 14) + ", " + (px + 9) + " " + (py - 27) + ", " + px + " " + (py - 29) + " C " + (px - 9) + " " + (py - 27) + ", " + (px - 11) + " " + (py - 14) + ", " + px + " " + py + " Z");
    pinPath.setAttribute("fill", "#2a9bb5");
    pinPath.setAttribute("stroke", "#0B3A4D");
    pinPath.setAttribute("stroke-width", "1.5");
    pinLayer.appendChild(pinPath);
    var eye = elNS("circle");
    eye.setAttribute("cx", px); eye.setAttribute("cy", py - 20); eye.setAttribute("r", "3.5");
    eye.setAttribute("fill", "#ffffff");
    pinLayer.appendChild(eye);
    updateSelectedOutline(outline, px, py);
  }
  function updateSelectedOutline(outline, px, py) {
    if (!live.svg) return;
    outline = outline || live.svg.querySelector("#selectionOutline");
    if (outline) outline.innerHTML = "";
    live.svg.querySelectorAll("path[data-state].pd-selected").forEach(function (el) {
      el.classList.remove("pd-selected");
    });
    var st = stateAtSvg(live.svg, px, py);
    if (!st) {
      if (live.onStateFromPin) live.onStateFromPin(null);
      return;
    }
    var el = live.svg.querySelector('path[data-state="' + st + '"]');
    if (el) {
      el.classList.add("pd-selected");
      if (outline) {
        var clone = el.cloneNode(true);
        clone.removeAttribute("data-state");
        clone.removeAttribute("id");
        clone.setAttribute("class", "sel-outline");
        clone.style.fill = "none";
        clone.style.pointerEvents = "none";
        outline.appendChild(clone);
      }
    }
    if (live.onStateFromPin) live.onStateFromPin(st);
  }
  function clearOverlays() {
    if (!live.svg) return;
    ["pdLabelLayer", "pdPinLayer", "selectionOutline"].forEach(function (id) {
      var g = live.svg.querySelector("#" + id);
      if (g) g.innerHTML = "";
    });
    live.svg.querySelectorAll("path[data-state].pd-selected").forEach(function (el) {
      el.classList.remove("pd-selected");
    });
    hideHeatLayer();
  }
  function ensureHoverCard() {
    if (!live.wrap) return null;
    var card = live.wrap.querySelector("#placeHoverCard");
    if (card) return card;
    card = document.createElement("div");
    card.id = "placeHoverCard";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML =
      '<div class="hc-inner">' +
      '<div class="hc-loc" id="hcLoc">—</div>' +
      '<div class="hc-score">Place draw <strong id="hcDraw">—</strong> <span class="hc-mode" id="hcMode"></span></div>' +
      '<div class="hc-amenity">Amenity <b id="hcAmenity">—</b></div>' +
      '<div class="hc-bands">' +
      '<span><i class="t-red">Red</i> <b id="hcRed">—</b></span>' +
      '<span><i class="t-comp">Competitive</i> <b id="hcComp">—</b></span>' +
      '<span><i class="t-magnet">Magnet</i> <b id="hcMagnet">—</b></span>' +
      '<span><i class="t-dest">Destination</i> <b id="hcDest">—</b></span>' +
      '</div>' +
      '<p class="hc-blurb" id="hcBlurb"></p>' +
      '</div>';
    live.wrap.appendChild(card);
    return card;
  }
  function setHoverCardVisible(show) {
    var card = ensureHoverCard();
    if (!card) return;
    card.classList.toggle("show", !!show && live.hoverOn && live.enabled);
    card.setAttribute("aria-hidden", (!show || !live.hoverOn || !live.enabled) ? "true" : "false");
  }
  function positionHoverCard(clientX, clientY) {
    var card = ensureHoverCard();
    if (!card || !live.wrap) return;
    var wrap = live.wrap.getBoundingClientRect();
    var cardW = card.offsetWidth || 300;
    var cardH = card.offsetHeight || 180;
    var x = clientX - wrap.left + 18;
    var y = clientY - wrap.top + 18;
    if (x + cardW > wrap.width - 12) x = clientX - wrap.left - cardW - 14;
    if (y + cardH > wrap.height - 12) y = clientY - wrap.top - cardH - 12;
    x = Math.max(10, Math.min(x, wrap.width - cardW - 10));
    y = Math.max(10, Math.min(y, wrap.height - cardH - 10));
    card.style.left = x + "px";
    card.style.top = y + "px";
  }
  function updateHoverCardAt(lat, lon, svgX, svgY, clientX, clientY) {
    if (!live.hoverOn || !live.enabled) { setHoverCardVisible(false); return; }
    var card = ensureHoverCard();
    if (!card) return;
    var s = sampleField(lat, lon);
    var b = computeBands(s, lat, lon, live.bands);
    var metro = nearestMetro(lat, lon);
    var st = (svgX != null && svgY != null) ? stateAtSvg(live.svg, svgX, svgY) : null;
    var loc = st ? (metro.label + " · " + st.toUpperCase()) : metro.label;
    card.querySelector("#hcLoc").textContent = loc;
    card.querySelector("#hcDraw").textContent = String(s.draw);
    card.querySelector("#hcMode").textContent = b.placeMode === "compress" ? "Metro compress" : "Cool-field amplify";
    card.querySelector("#hcAmenity").textContent = String(Math.round(s.amenity));
    card.querySelector("#hcRed").textContent = formatMoney(b.red);
    card.querySelector("#hcComp").textContent = formatMoney(b.competitive);
    card.querySelector("#hcMagnet").textContent = formatMoney(b.magnet);
    card.querySelector("#hcDest").textContent = formatMoney(b.destination);
    card.querySelector("#hcBlurb").textContent = whySentence(s, lat, lon);
    setHoverCardVisible(true);
    if (clientX != null && clientY != null) positionHoverCard(clientX, clientY);
  }
  function scheduleHoverFromEvent(evt) {
    if (!live.hoverOn || !live.enabled) { setHoverCardVisible(false); return; }
    live.hoverPending = evt;
    if (live.hoverRaf) return;
    live.hoverRaf = requestAnimationFrame(function () {
      live.hoverRaf = 0;
      var e = live.hoverPending;
      live.hoverPending = null;
      if (!e || !live.svg) return;
      var sp = clientToSvg(live.svg, e.clientX, e.clientY);
      if (!sp) { setHoverCardVisible(false); return; }
      if (sp.x < 0 || sp.y < 0 || sp.x > 959 || sp.y > 593) { setHoverCardVisible(false); return; }
      var ll = svgToLonLat(sp.x, sp.y);
      var lat = clamp(ll.lat, 24, 49.5);
      var lon = clamp(ll.lon, -125.5, -66);
      updateHoverCardAt(lat, lon, sp.x, sp.y, e.clientX, e.clientY);
    });
  }
  function placePinAtEvent(evt) {
    if (!live.svg) return;
    var sp = clientToSvg(live.svg, evt.clientX, evt.clientY);
    if (!sp) return;
    live.pin.svgX = sp.x; live.pin.svgY = sp.y;
    var ll = svgToLonLat(sp.x, sp.y);
    live.pin.lat = clamp(ll.lat, 24, 49.5);
    live.pin.lon = clamp(ll.lon, -125.5, -66);
    renderOverlays();
    if (live.onPinChange) live.onPinChange(readPinState());
  }
  function readPinState() {
    var s = sampleField(live.pin.lat, live.pin.lon);
    var b = computeBands(s, live.pin.lat, live.pin.lon, live.bands);
    var metro = nearestMetro(live.pin.lat, live.pin.lon);
    var st = (live.pin.svgX != null) ? stateAtSvg(live.svg, live.pin.svgX, live.pin.svgY) : null;
    return { field: s, bands: b, metro: metro, state: st, pin: { lat: live.pin.lat, lon: live.pin.lon } };
  }
  function mount(opts) {
    opts = opts || {};
    live.host = opts.host || document.getElementById("ridge-map-container");
    live.wrap = opts.wrap || document.getElementById("ridge-map-wrap");
    live.onPinChange = opts.onPinChange || null;
    live.onStateFromPin = opts.onStateFromPin || null;
    if (opts.bands) live.bands = opts.bands;
    if (!live.host) return false;
    live.svg = live.host.querySelector("svg");
    if (!live.svg) return false;
    ensureBorderGlow(live.svg);
    ensureHeatImage(live.svg);
    ensureLayer(live.svg, "pdLabelLayer", "heatLayer");
    ensureLayer(live.svg, "pdPinLayer", "pdLabelLayer");
    ensureLayer(live.svg, "selectionOutline", "pdPinLayer");
    ensureHoverCard();
    if (live.pin.svgX == null) setPinLonLat(live.pin.lat, live.pin.lon);
    return true;
  }
  function setEnabled(on) {
    live.enabled = !!on;
    if (!live.svg && live.host) live.svg = live.host.querySelector("svg");
    if (live.enabled) {
      if (live.host) live.host.classList.add("pd-heat-on");
      if (live.wrap) live.wrap.classList.add("pd-heat-on");
      renderHeatLayer();
      renderOverlays();
    } else {
      if (live.host) live.host.classList.remove("pd-heat-on");
      if (live.wrap) live.wrap.classList.remove("pd-heat-on");
      clearOverlays();
      setHoverCardVisible(false);
    }
  }
  function setHoverCardOn(on) {
    live.hoverOn = !!on;
    if (!live.hoverOn) setHoverCardVisible(false);
  }
  function setBands(bands) { live.bands = bands || null; }
  function refresh() {
    if (!live.enabled) return;
    renderHeatLayer();
    renderOverlays();
    if (live.onPinChange) live.onPinChange(readPinState());
  }
  function jumpTo(id) {
    var j = JUMPS[id] || (metroById(id) ? { lat: metroById(id).lat, lon: metroById(id).lon } : null);
    if (!j) return;
    setPinLonLat(j.lat, j.lon);
    if (live.enabled) renderOverlays();
    if (live.onPinChange) live.onPinChange(readPinState());
  }

  var api = {
    METROS: METROS,
    JUMPS: JUMPS,
    FM_BANDS: FM_BANDS,
    FM_BASELINE: FM_BASELINE,
    lonLatToSvg: lonLatToSvg,
    svgToLonLat: svgToLonLat,
    flLonAdjust: flLonAdjust,
    sampleField: sampleField,
    computeBands: computeBands,
    nearestMetro: nearestMetro,
    cashMode: cashMode,
    whySentence: whySentence,
    formatMoney: formatMoney,
    bakeHeat: bakeHeat,
    litmusVerify: litmusVerify,
    mount: mount,
    setEnabled: setEnabled,
    isEnabled: function () { return !!live.enabled; },
    setHoverCardOn: setHoverCardOn,
    isHoverCardOn: function () { return !!live.hoverOn; },
    setBands: setBands,
    refresh: refresh,
    jumpTo: jumpTo,
    setPinLonLat: setPinLonLat,
    placePinAtEvent: placePinAtEvent,
    scheduleHoverFromEvent: scheduleHoverFromEvent,
    hideHover: function () { setHoverCardVisible(false); },
    readPinState: readPinState,
    getPin: function () { return { lat: live.pin.lat, lon: live.pin.lon, svgX: live.pin.svgX, svgY: live.pin.svgY }; },
    stateAtSvg: function (x, y) { return stateAtSvg(live.svg, x, y); },
    clientToSvg: function (cx, cy) { return clientToSvg(live.svg, cx, cy); },
    _live: live
  };

  root.AMPPlaceDraw = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
