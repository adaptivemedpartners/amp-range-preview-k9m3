/*! amp-mi-place-draw-engine.js — Place draw overlay for AMP Market Intelligence
 * Source: ridge-place-draw-heatmap-mock.html · 2026-09-19 locks
 * FM Comp baseline $306,520 · Red < Comp < Magnet < Dest · FL Atlantic/Gulf + Jax
 * No MGMA on this overlay · AMP YOUR Baseline only
 */
(function (global) {
  "use strict";
  if (global.AmpMiPlaceDraw && global.AmpMiPlaceDraw.__version === "20260919b") return;

const PROJ = {
    x: [2759.8538078730785, 24.915358690648933, -14.953439595594197, -0.0007039183835004792, -0.06417214636590662, -0.21364840651961714],
    y: [379.2382728297884, -16.628347979204527, -23.689029729721316, -0.08434021870074027, 0.03156982137420572, 0.01129541566532044],
    // Affine seed for Newton inverse (click → lon/lat); forward is quadratic
    ax: [2047.4798889934937, 16.368944717628892, 0.17238294560225498],
    ay: [1177.1599834210633, 0.13605651716414258, -23.052168778825187]
  };

  // FL lon calibration before quadratic (keep real CBD coords):
  //   SE tip: Atlantic CBD (~−80.1) seats on east edge of warped FL; Gulf (~−82) stays west.
  //           tip fades north of ~29°N.
  //   NE FL Atlantic (2026-09-19): Jax @30.33 was on-clip but ~14px west of NE coast (looked
  //           like no Jacksonville glow). Mild eastward nudge peak ~30.35°N, Atlantic-only.

function flLonAdjust(lon, lat) {
    if (lat < 24.4 || lat > 31.2 || lon < -87.5 || lon > -79.0) return lon;
    const tip = Math.max(0, Math.min(1, (29.0 - lat) / 3.5));
    const atl = Math.max(0, Math.min(1, (lon + 82.2) / 2.2)); // 0 @ −82.2 Gulf, 1 @ −80 Atlantic
    let adj = tip * (0.70 + 0.45 * atl);
    // NE FL Atlantic corridor — 0 for Gulf/panhandle lons
    const ne = Math.max(0, Math.min(1, 1 - Math.abs(lat - 30.35) / 1.15));
    const neAtl = Math.max(0, Math.min(1, (lon + 82.6) / 1.6)); // 0 @ −82.6, 1 @ −81.0
    adj += ne * neAtl * 1.05;
    return lon + adj;
  }
  function flLonUnadjust(lonAdj, lat) {
    // Invert flLonAdjust via Newton 1D (tip + NE Atlantic terms both depend on lon).
    if (lat < 24.4 || lat > 31.2 || lonAdj < -87.5 || lonAdj > -78.0) return lonAdj;
    const tip = Math.max(0, Math.min(1, (29.0 - lat) / 3.5));
    const ne = Math.max(0, Math.min(1, 1 - Math.abs(lat - 30.35) / 1.15));
    if (tip <= 0 && ne <= 0) return lonAdj;
    let lon = lonAdj;
    for (let i = 0; i < 10; i++) {
      const atl = Math.max(0, Math.min(1, (lon + 82.2) / 2.2));
      const neAtl = Math.max(0, Math.min(1, (lon + 82.6) / 1.6));
      const f = lon + tip * (0.70 + 0.45 * atl) + ne * neAtl * 1.05 - lonAdj;
      let datl = 0;
      if (lon > -82.2 && lon < -80.0) datl = 1 / 2.2;
      let dneAtl = 0;
      if (lon > -82.6 && lon < -81.0) dneAtl = 1 / 1.6;
      const df = 1 + tip * 0.45 * datl + ne * 1.05 * dneAtl;
      lon -= f / df;
    }
    return lon;
  }

  function lonLatToSvg(lon, lat) {
    lon = flLonAdjust(lon, lat);
    const c = PROJ.x, d = PROJ.y;
    const x = c[0] + c[1]*lon + c[2]*lat + c[3]*lon*lon + c[4]*lat*lat + c[5]*lon*lat;
    const y = d[0] + d[1]*lon + d[2]*lat + d[3]*lon*lon + d[4]*lat*lat + d[5]*lon*lat;
    return [x, y];
  }

  function svgToLonLatAffine(x, y) {
    // Affine seed only — forward map is quadratic; do not use alone for pin placement.
    const a0 = PROJ.ax[0], a1 = PROJ.ax[1], a2 = PROJ.ax[2];
    const b0 = PROJ.ay[0], b1 = PROJ.ay[1], b2 = PROJ.ay[2];
    const det = a1 * b2 - a2 * b1;
    const lon = ((x - a0) * b2 - (y - b0) * a2) / det;
    const lat = (a1 * (y - b0) - b1 * (x - a0)) / det;
    return { lon, lat };
  }

  function svgToLonLat(x, y) {
    // Invert quadratic+FL-cal lonLatToSvg via Newton so click/drag pin lands under the cursor.
    // Newton runs in adjusted-lon space (matches forward), then flLonUnadjust → real lon.
    let { lon, lat } = svgToLonLatAffine(x, y);
    const c = PROJ.x, d = PROJ.y;
    for (let i = 0; i < 12; i++) {
      const fx = c[0] + c[1]*lon + c[2]*lat + c[3]*lon*lon + c[4]*lat*lat + c[5]*lon*lat - x;
      const fy = d[0] + d[1]*lon + d[2]*lat + d[3]*lon*lon + d[4]*lat*lat + d[5]*lon*lat - y;
      if (fx*fx + fy*fy < 1e-10) break;
      const dxdlon = c[1] + 2*c[3]*lon + c[5]*lat;
      const dxdlat = c[2] + 2*c[4]*lat + c[5]*lon;
      const dydlon = d[1] + 2*d[3]*lon + d[5]*lat;
      const dydlat = d[2] + 2*d[4]*lat + d[5]*lon;
      const det = dxdlon*dydlat - dxdlat*dydlon;
      if (Math.abs(det) < 1e-12) break;
      lon -= (fx*dydlat - fy*dxdlat) / det;
      lat -= (dxdlon*fy - dydlon*fx) / det;
    }
    lon = flLonUnadjust(lon, lat);
    return { lon, lat };
  }


const METROS = [
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

  const JUMPS = {
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
    wpb: { lat: 26.72, lon: -80.05 }
  };


const SPECIALTIES = {
    fm: {
      name: "Family Medicine",
      baseline: 306520,
      ampBands: { redAlert: 255433, competitive: 306520, magnet: 368333, destination: 442612 },
      supplyNote: "Competitive = AMP YOUR Baseline (MI dual-cash / ampBands.competitive $306,520). Place draw compresses or amplifies the ladder from that lock — not a $280k demo."
    },
    hf: {
      name: "Heart Failure / Cardiology (advanced)",
      baseline: 485000,
      supplyNote: "Specialty supply (stub): thin advanced HF/cardiology bench — fewer candidates nationally; place still moves bands, but scarcity floor is higher. (Not live Redi data.)"
    }
  };

  const LABEL_OFFSET = {
    la:  [10, -18], sd: [10, 16], dfw: [10, -14], hou: [10, 14],
    aus: [-8, -22], wtx: [0, -22], bis: [10, -14], rnd: [0, -22], far: [10, 14], phx: [10, -12], mem: [10, -12],
    bhm: [10, 14], gulf: [8, 16], nash: [10, -14], chi: [10, -14], nyc: [10, -14]
  };


function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function milesBetween(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const toR = Math.PI / 180;
    const dLat = (lat2 - lat1) * toR;
    const dLon = (lon2 - lon1) * toR;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function falloff(distMiles, radiusMiles) {
    if (distMiles >= radiusMiles) return 0;
    const t = distMiles / radiusMiles;
    return Math.exp(-3.2 * t * t);
  }

  function sampleField(lat, lon) {
    let amenity = 0, gravity = 0, cost = 0, wSum = 0, heat = 0;
    let beachPull = 0; // usable-beach metros (amenity≥85) — do not dilute to cool-field ~40s
    for (const m of METROS) {
      const d = milesBetween(lat, lon, m.lat, m.lon);
      const f = falloff(d, m.glowRadiusMiles) * m.strength;
      if (f <= 0.002) continue;
      amenity += m.amenity * f;
      gravity += m.gravity * f;
      cost += m.costFriction * f;
      wSum += f;
      heat += f * ((m.amenity * 0.35 + m.gravity * 0.45 - m.costFriction * 0.15) / 100 + 0.35);
      // World-class beach pull (MIA/FTL/WPB/Naples/Sarasota/Tampa…) — coast≠beach stays lower via amenity table
      if (m.amenity >= 85) beachPull = Math.max(beachPull, m.amenity * Math.min(1, f / 0.35));
    }
    const baseAmenity = 28, baseGravity = 22, baseCost = 25;
    // Cool-field base blend ONLY when outside metro influence — never wash beach amenity down to ~43
    if (wSum < 0.15 && beachPull < 70) {
      const blend = wSum / 0.15;
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
    let draw = amenity * 0.38 + gravity * 0.42 + (100 - cost) * 0.12 + heat * 8;
    draw = Math.max(8, Math.min(98, draw));
    const pressure = Math.max(5, Math.min(95, 100 - draw * 0.92 + (cost - 50) * 0.08));
    return {
      amenity: clamp(amenity, 0, 100),
      gravity: clamp(gravity, 0, 100),
      cost: clamp(cost, 0, 100),
      draw: Math.round(draw),
      pressure: Math.round(pressure),
      cashLift: Math.round(pressure)
    };
  }

  function resolveMsa(m) {
    // Label pins (ftl/wpb/sph) collapse to parent MSA for compress / why copy
    if (m && m.msaOf) {
      const parent = METROS.find(x => x.id === m.msaOf);
      if (parent) return parent;
    }
    return m;
  }

  function nearestMetro(lat, lon) {
    let best = METROS[0], bestD = Infinity;
    for (const m of METROS) {
      const d = milesBetween(lat, lon, m.lat, m.lon);
      if (d < bestD) { bestD = d; best = m; }
    }
    return resolveMsa(best);
  }

  function cashMode(s, lat, lon) {
    // Cool-field anchors (rural ND, West TX, etc.) ALWAYS amplify — Comp ≥ YOUR Baseline
    if (lat != null && lon != null) {
      const n = nearestMetro(lat, lon);
      if (n && n.coolField) return "amplify";
    }
    return s.draw >= 58 ? "compress" : "amplify";
  }

  function nearestLitmus(lat, lon) {
    return nearestMetro(lat, lon).label;
  }

  function whySentence(s, lat, lon) {
    const nearest = nearestLitmus(lat, lon);
    if (cashMode(s, lat, lon) === "compress") {
      return `Metro compress near ${nearest}: high place draw settles the whole cash ladder at or below baseline Competitive (esp. Competitive after COL). ORDER stays Red < Competitive < Magnet < Destination — Red always lowest. Then COL/taxes/cost friction stacks on that ladder (same map).`;
    }
    return `Cool-field amplify near ${nearest}: outside metro glows lifts the whole cash ladder (Competitive at/above AMP YOUR Baseline; Magnet & Destination further above Comp). ORDER stays Red < Competitive < Magnet < Destination — Red always lowest. Then COL/taxes/cost friction stacks on that ladder (same map, not a second heat map).`;
  }

  function formatMoney(n) { return "$" + Math.round(n / 1000) + "k"; }

  function computeBands(s, lat, lon) {
    const spec = SPECIALTIES[specialtyKey];
    const base = spec.baseline;
    const placeMode = cashMode(s, lat, lon);
    const compressAmt = clamp((s.draw - 58) / 40, 0, 1);
    const amplifyAmt = placeMode === "amplify"
      ? clamp(Math.max(58 - s.draw, 8) / 50, 0.16, 1)
      : 0;

    // Place factor shifts the whole ladder: compress ≤1, amplify ≥1 — never inverts ORDER
    let placeFactor;
    if (placeMode === "compress") {
      placeFactor = 1 - compressAmt * 0.08; // ~0.92–1.0
    } else {
      placeFactor = 1 + amplifyAmt * 0.08; // ~1.01–1.08 (cool-field Comp ≥ baseline)
    }

    // Locked ratios vs Competitive (AMP dual-cash ladder shape — YOUR Baseline lock)
    // Red ~0.83–0.90 · Magnet ~1.15–1.25 · Destination ~1.35–1.50
    let redRatio, magnetRatio, destRatio;
    if (placeMode === "compress") {
      redRatio = 0.88 - compressAmt * 0.05;      // 0.83–0.88
      magnetRatio = 1.15 + compressAmt * 0.02;   // 1.15–1.17
      destRatio = 1.35 + compressAmt * 0.05;     // 1.35–1.40
    } else {
      redRatio = 0.90 - amplifyAmt * 0.05;       // 0.85–0.90
      magnetRatio = 1.18 + amplifyAmt * 0.07;    // 1.18–1.25
      destRatio = 1.38 + amplifyAmt * 0.12;      // 1.38–1.50
    }

    let competitive = base * placeFactor;
    let red = competitive * redRatio;
    let magnet = competitive * magnetRatio;
    let destination = competitive * destRatio;

    // COL/taxes stack shifts the whole ladder uniformly
    let colFactor = 1 + ((s.cost - 50) / 50) * 0.08;
    if (placeMode === "compress" && colFactor > 1) {
      const damp = 1 - compressAmt * 0.72;
      colFactor = 1 + (colFactor - 1) * damp;
    }
    const colPct = Math.round((colFactor - 1) * 1000) / 10;
    competitive *= colFactor;
    red *= colFactor;
    magnet *= colFactor;
    destination *= colFactor;

    // CASH LOCK vs YOUR Baseline: amplify Comp ≥ base; compress Comp ≤ base (after COL)
    if (placeMode === "amplify" && competitive < base) {
      const lift = base / competitive;
      competitive *= lift;
      red *= lift;
      magnet *= lift;
      destination *= lift;
    }
    if (placeMode === "compress" && competitive > base) {
      const damp = base / competitive;
      competitive *= damp;
      red *= damp;
      magnet *= damp;
      destination *= damp;
    }

    // Clamp/sort enforce: ALWAYS Red < Competitive < Magnet < Destination
    if (red >= competitive) red = competitive * 0.88;
    if (magnet <= competitive) magnet = competitive * 1.15;
    if (destination <= magnet) destination = magnet * (1.35 / 1.15);
    if (!(red < competitive && competitive < magnet && magnet < destination)) {
      const vals = [red, competitive, magnet, destination].sort((a, b) => a - b);
      red = vals[0];
      competitive = vals[1];
      magnet = vals[2];
      destination = vals[3];
    }

    return {
      placeMode, compressAmt, amplifyAmt, placeFactor,
      colPct, colFactor, competitive, red, destination, magnet, base, spec
    };
  }


function isLightLook() {
    return document.documentElement.getAttribute("data-look") === "light";
  }

  function heatToColor(t) {
    // MI teal palette: map-fill cool → accent → theme (no LinkedIn sky/mint)
    // Light look: softer blooms that still read on #b7c4d4 state fill
    t = clamp(t, 0, 1.35) / 1.35;
    const stops = isLightLook() ? [
      [0.00, [183, 196, 212]],
      [0.20, [150, 180, 198]],
      [0.38, [90, 165, 185]],
      [0.55, [42, 155, 181]],
      [0.72, [20, 184, 166]],
      [0.88, [110, 210, 200]],
      [1.00, [167, 243, 208]]
    ] : [
      [0.00, [28, 45, 66]],
      [0.18, [30, 55, 78]],
      [0.35, [36, 90, 110]],
      [0.52, [42, 155, 181]],
      [0.70, [20, 184, 166]],
      [0.85, [94, 200, 190]],
      [1.00, [204, 251, 241]]
    ];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i][0] && t <= stops[i+1][0]) { a = stops[i]; b = stops[i+1]; break; }
    }
    const u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
    return [
      Math.round(a[1][0] + (b[1][0] - a[1][0]) * u),
      Math.round(a[1][1] + (b[1][1] - a[1][1]) * u),
      Math.round(a[1][2] + (b[1][2] - a[1][2]) * u)
    ];
  }

  function renderHeat() {
    const step = mode === "ridge" ? 6 : 3;
    const look = document.documentElement.getAttribute("data-look") || "dark";
    const key = mode + "|" + step + "|" + look;
    if (heatCache && heatCacheKey === key) {
      var __heatEl = document.getElementById("placeDrawHeatLayer"); if (__heatEl) __heatEl.setAttribute("href", heatCache);
      return;
    }
    const W = 959, H = 593;
    const cols = Math.ceil(W / step);
    const rows = Math.ceil(H / step);
    const tmp = document.createElement("canvas");
    tmp.width = cols; tmp.height = rows;
    const tctx = tmp.getContext("2d");
    const img = tctx.createImageData(cols, rows);
    const data = img.data;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * step + step / 2;
        const y = j * step + step / 2;
        const { lon, lat } = svgToLonLat(x, y);
        const idx = (j * cols + i) * 4;
        if (lon < -126 || lon > -66 || lat < 23 || lat > 50) {
          data[idx] = 10; data[idx+1] = 16; data[idx+2] = 24; data[idx+3] = 0;
          continue;
        }
        let heat = 0;
        for (const m of METROS) {
          const d = milesBetween(lat, lon, m.lat, m.lon);
          let f = falloff(d, m.glowRadiusMiles) * m.strength;
          // SVG-space reinforce: bloom sits where pins project (fixes SE FL tip clip/projection miss)
          if (m.strength > 0 && m.glowRadiusMiles > 2) {
            const [mx, my] = lonLatToSvg(m.lon, m.lat);
            const [mx2] = lonLatToSvg(m.lon + m.glowRadiusMiles / 54.6, m.lat);
            const rPx = Math.max(8, Math.abs(mx2 - mx));
            const dPx = Math.hypot(x - mx, y - my);
            if (dPx < rPx) {
              const t = dPx / rPx;
              f = Math.max(f, Math.exp(-3.2 * t * t) * m.strength);
            }
          }
          const center = (m.amenity * 0.4 + m.gravity * 0.5) / 100;
          heat += f * center;
        }
        heat = Math.min(1.35, heat);
        const c = heatToColor(heat);
        // Soft alpha: cool field nearly transparent so MI map-fill shows; metros glow
        // Light look: lower opacity teal blooms that still read on light slate states
        const alpha = isLightLook()
          ? Math.round(clamp(heat / 1.35, 0, 1) * 125 + (heat > 0.10 ? 28 : 0))
          : Math.round(clamp(heat / 1.35, 0, 1) * 200 + (heat > 0.08 ? 40 : 0));
        data[idx] = c[0]; data[idx+1] = c[1]; data[idx+2] = c[2]; data[idx+3] = alpha;
      }
    }
    tctx.putImageData(img, 0, 0);
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = mode === "mi" ? "high" : "medium";
    octx.drawImage(tmp, 0, 0, W, H);
    if (mode === "ridge") {
      octx.filter = "blur(1.6px)";
      octx.drawImage(out, 0, 0);
      octx.filter = "none";
    }
    heatCache = out.toDataURL("image/png");
    heatCacheKey = key;
    var __heatEl = document.getElementById("placeDrawHeatLayer"); if (__heatEl) __heatEl.setAttribute("href", heatCache);
  }



  var enabled = false;
  var mode = "mi"; /* firm MI finer heat */
  var specialtyKey = "fm";
  var pin = { lat: 25.76, lon: -80.19, svgX: null, svgY: null };
  var heatCache = null, heatCacheKey = "";
  var dragging = false;
  var hoverCardOn = true;
  var hoverRaf = 0, hoverPending = null;
  var bound = false;
  var pinState = null;

  function mapSvg() {
    return document.querySelector("#map-container svg")
      || document.querySelector("#ridge-map-container svg");
  }
  function mapWrapEl() {
    return document.querySelector(".map-wrap")
      || document.getElementById("ridge-map-wrap")
      || document.getElementById("map-container")
      || document.getElementById("ridge-map-container");
  }

  function ensureScaffold() {
    var svg = mapSvg();
    if (!svg) return false;
    var defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    if (!svg.querySelector("#ampStateBorderGlow")) {
      var glow = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      glow.setAttribute("id", "ampStateBorderGlow");
      glow.setAttribute("x", "-150%"); glow.setAttribute("y", "-150%");
      glow.setAttribute("width", "400%"); glow.setAttribute("height", "400%");
      glow.setAttribute("color-interpolation-filters", "sRGB");
      glow.innerHTML =
        '<feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b1"/>' +
        '<feFlood flood-color="#ffffff" flood-opacity="0.95" result="f1"/>' +
        '<feComposite in="f1" in2="b1" operator="in" result="g1"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="b2"/>' +
        '<feFlood flood-color="#5ec8e0" flood-opacity="0.9" result="f2"/>' +
        '<feComposite in="f2" in2="b2" operator="in" result="g2"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b3"/>' +
        '<feFlood flood-color="#2a9bb5" flood-opacity="0.75" result="f3"/>' +
        '<feComposite in="f3" in2="b3" operator="in" result="g3"/>' +
        '<feMerge><feMergeNode in="g3"/><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="SourceGraphic"/></feMerge>';
      defs.appendChild(glow);
    }
    if (!svg.querySelector("#conusClip")) {
      var clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clip.setAttribute("id", "conusClip");
      clip.setAttribute("clipPathUnits", "userSpaceOnUse");
      svg.querySelectorAll("path[data-state], circle[data-state]").forEach(function (el) {
        var st = (el.getAttribute("data-state") || "").toLowerCase();
        if (st === "ak" || st === "hi" || st === "pr") return;
        if (el.closest && (el.closest("#outline-layer") || el.closest("#placeDrawSelectionOutline") || el.closest("#placeDrawPinLayer"))) return;
        var d = el.getAttribute("d");
        if (!d) return;
        var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", d);
        clip.appendChild(p);
      });
      defs.appendChild(clip);
    }
    function ensureLayer(id, tag, attrs) {
      var el = document.getElementById(id);
      if (el) return el;
      el = document.createElementNS("http://www.w3.org/2000/svg", tag);
      el.setAttribute("id", id);
      Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      svg.appendChild(el);
      return el;
    }
    ensureLayer("placeDrawHeatLayer", "image", {
      href: "", x: "0", y: "0", width: "959", height: "593",
      "clip-path": "url(#conusClip)", preserveAspectRatio: "none",
      style: "display:none", "pointer-events": "none"
    });
    ensureLayer("placeDrawSelectionOutline", "g", { "pointer-events": "none", style: "display:none" });
    ensureLayer("placeDrawPinLayer", "g", { "pointer-events": "none", style: "display:none" });
    if (!svg.querySelector("#outline-layer")) {
      ensureLayer("outline-layer", "g", {});
    }
    var wrap = mapWrapEl();
    if (wrap && !document.getElementById("mi-place-draw-chrome")) {
      var chrome = document.createElement("div");
      chrome.id = "mi-place-draw-chrome";
      chrome.setAttribute("aria-hidden", "true");
      chrome.innerHTML =
        '<div class="pd-chrome-label">Place draw · national metro heat</div>' +
        '<div class="pd-chrome-row"><span>Hover card</span>' +
        '<div id="hoverCardToggle" role="group" aria-label="Hover card">' +
        '<button type="button" data-hover="on" class="active">On</button>' +
        '<button type="button" data-hover="off">Off</button></div></div>' +
        '<div class="pd-chrome-row" id="miPlaceDrawJumps">' +
        '<button type="button" data-jump="mia" class="active">Miami</button>' +
        '<button type="button" data-jump="ftl">FTL</button>' +
        '<button type="button" data-jump="wpb">WPB</button>' +
        '<button type="button" data-jump="jax">Jacksonville</button>' +
        '<button type="button" data-jump="tpa">Tampa</button>' +
        '<button type="button" data-jump="dfw">DFW</button>' +
        '<button type="button" data-jump="la">LA</button>' +
        '<button type="button" data-jump="rnd">Rural ND</button>' +
        '<button type="button" data-jump="wtx">West TX</button></div>' +
        '<div style="margin-top:6px;font-size:10px;opacity:0.85">Click/drag pin · border glow only · AMP YOUR Baseline cash · no MGMA</div>';
      wrap.appendChild(chrome);
    }
    if (wrap && !document.getElementById("placeHoverCard")) {
      var card = document.createElement("div");
      card.id = "placeHoverCard";
      card.setAttribute("aria-hidden", "true");
      card.innerHTML =
        '<div class="hc-inner"><div class="hc-loc" id="hcLoc">—</div>' +
        '<div class="hc-score"><strong id="hcDraw">—</strong><span class="hc-mode" id="hcMode">—</span></div>' +
        '<div class="hc-amenity">Amenity <b id="hcAmenity">—</b></div>' +
        '<div class="hc-bands">' +
        '<span><span class="t-red">Red</span> <b id="hcRed">—</b></span>' +
        '<span><span class="t-comp">Competitive</span> <b id="hcComp">—</b></span>' +
        '<span><span class="t-magnet">Magnet</span> <b id="hcMagnet">—</b></span>' +
        '<span><span class="t-dest">Destination</span> <b id="hcDest">—</b></span></div>' +
        '<p class="hc-blurb" id="hcBlurb"></p></div>';
      wrap.appendChild(card);
    }
    if (!document.getElementById("mi-place-draw-panel")) {
      var side = document.getElementById("ridge-side-body")
        || document.getElementById("side-panel")
        || document.querySelector(".side-panel")
        || document.getElementById("sidebar");
      if (side) {
        var host = document.createElement("div");
        host.id = "mi-place-draw-panel";
        host.setAttribute("aria-hidden", "true");
        side.insertBefore(host, side.firstChild);
      }
    }
    return true;
  }
  // isLightLook / heatToColor / renderHeat injected above

  function milesToSvgRadius(lon, lat, miles) {
    var a = lonLatToSvg(lon, lat);
    var b = lonLatToSvg(lon + miles / 54.6, lat);
    return Math.abs(b[0] - a[0]);
  }
  function formatMoney(n) { return "$" + Math.round(n / 1000) + "k"; }

  function syncSpecialtyFromMI() {
    try {
      var s = null;
      if (typeof currentSpec === "function") s = currentSpec();
      else if (typeof global.AMPRidgeCurrentSpec === "function") s = global.AMPRidgeCurrentSpec();
      if (s && s.ampBands && s.ampBands.competitive != null) {
        SPECIALTIES.fm.baseline = s.ampBands.competitive;
        SPECIALTIES.fm.ampBands = {
          redAlert: s.ampBands.redAlert,
          competitive: s.ampBands.competitive,
          magnet: s.ampBands.magnet,
          destination: s.ampBands.destination
        };
      }
    } catch (e) {}
  }

  function renderPin() {
    var layer = document.getElementById("placeDrawPinLayer");
    var svg = mapSvg();
    if (!layer || !svg) return;
    layer.innerHTML = "";
    var px, py;
    if (pin.svgX != null && pin.svgY != null) { px = pin.svgX; py = pin.svgY; }
    else { var xy = lonLatToSvg(pin.lon, pin.lat); px = xy[0]; py = xy[1]; pin.svgX = px; pin.svgY = py; }
    function circ(r, fill, op) {
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", px); c.setAttribute("cy", py); c.setAttribute("r", r);
      c.setAttribute("fill", fill); if (op) c.setAttribute("opacity", op);
      c.setAttribute("pointer-events", "none");
      layer.appendChild(c);
    }
    circ(18, "rgba(42,155,181,0.22)");
    circ(7, "#5ec8e0", "0.85");
    var pinPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pinPath.setAttribute("d", "M"+px+","+(py-22)+" c-7,0 -12,5.5 -12,12.2 0,9.2 12,18.8 12,18.8 s12,-9.6 12,-18.8 c0,-6.7 -5,-12.2 -12,-12.2 z");
    pinPath.setAttribute("fill", "#2a9bb5");
    pinPath.setAttribute("stroke", isLightLook() ? "#0B3A4D" : "#070b12");
    pinPath.setAttribute("stroke-width", "1.5");
    pinPath.setAttribute("pointer-events", "none");
    layer.appendChild(pinPath);
    var eye = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    eye.setAttribute("cx", px); eye.setAttribute("cy", py - 14); eye.setAttribute("r", "3.2");
    eye.setAttribute("fill", "#fff"); eye.setAttribute("pointer-events", "none");
    layer.appendChild(eye);
  }

  function stateAtSvg(x, y) {
    var svg = mapSvg();
    if (!svg) return null;
    var nodes = svg.querySelectorAll("path[data-state], circle[data-state]");
    var pt;
    try { pt = svg.createSVGPoint(); pt.x = x; pt.y = y; } catch (e) { return null; }
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest && (n.closest("#outline-layer") || n.closest("#placeDrawSelectionOutline") || n.closest("#placeDrawPinLayer"))) continue;
      try {
        if (typeof n.isPointInFill === "function" && n.isPointInFill(pt)) {
          return (n.getAttribute("data-state") || "").toLowerCase();
        }
      } catch (e2) {}
    }
    return null;
  }

  function updateSelectedState() {
    var svg = mapSvg();
    var outline = document.getElementById("placeDrawSelectionOutline");
    if (!svg || !outline) return;
    var px = pin.svgX != null ? pin.svgX : lonLatToSvg(pin.lon, pin.lat)[0];
    var py = pin.svgY != null ? pin.svgY : lonLatToSvg(pin.lon, pin.lat)[1];
    var st = stateAtSvg(px, py);
    pinState = st;
    svg.querySelectorAll(".pd-pin-selected").forEach(function (el) { el.classList.remove("pd-pin-selected"); });
    outline.innerHTML = "";
    if (!st) return;
    var el = svg.querySelector('path[data-state="' + st + '"], circle[data-state="' + st + '"]');
    if (!el) return;
    el.classList.add("pd-pin-selected");
    var clone = el.cloneNode(true);
    clone.removeAttribute("class");
    clone.removeAttribute("style");
    clone.setAttribute("fill", "none");
    clone.setAttribute("pointer-events", "none");
    clone.classList.add("pd-outline");
    outline.appendChild(clone);
    try {
      if (typeof selectedStates !== "undefined") {
        selectedStates = [st];
        if (typeof saveClients === "function") saveClients();
        if (typeof renderSidebar === "function") renderSidebar();
      }
    } catch (e) {}
    try {
      if (typeof global.AmpMiPlaceDrawOnPinState === "function") global.AmpMiPlaceDrawOnPinState(st);
    } catch (e2) {}
  }

  function renderAll() {
    if (!enabled) return;
    syncSpecialtyFromMI();
    try { renderHeat(); } catch (e) { console.warn("place-draw heat", e); }
    renderPin();
    updateSelectedState();
    updateMiPlacePanel();
  }

  function clientToSvg(clientX, clientY) {
    var svg = mapSvg();
    if (!svg) return null;
    var pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;
    var sp = pt.matrixTransform(ctm.inverse());
    return { x: sp.x, y: sp.y };
  }
  function setPinLonLat(lat, lon) {
    pin.lat = lat; pin.lon = lon;
    var xy = lonLatToSvg(lon, lat);
    pin.svgX = xy[0]; pin.svgY = xy[1];
  }
  function placePinAtEvent(evt) {
    var sp = clientToSvg(evt.clientX, evt.clientY);
    if (!sp) return;
    pin.svgX = sp.x; pin.svgY = sp.y;
    var ll = svgToLonLat(sp.x, sp.y);
    pin.lat = clamp(ll.lat, 24, 49.5);
    pin.lon = clamp(ll.lon, -125.5, -66);
    renderPin();
    updateSelectedState();
    updateMiPlacePanel();
    updateHoverCardAt(pin.lat, pin.lon, sp.x, sp.y, evt.clientX, evt.clientY);
  }

  function setHoverCardVisible(on) {
    var card = document.getElementById("placeHoverCard");
    if (!card) return;
    card.classList.toggle("show", !!on);
    card.setAttribute("aria-hidden", on ? "false" : "true");
  }
  function positionHoverCard(clientX, clientY) {
    var card = document.getElementById("placeHoverCard");
    var wrap = mapWrapEl();
    if (!card || !wrap) return;
    var wr = wrap.getBoundingClientRect();
    var x = clientX - wr.left + 14;
    var y = clientY - wr.top + 14;
    var cw = card.offsetWidth || 300;
    var ch = card.offsetHeight || 160;
    if (x + cw > wr.width - 8) x = clientX - wr.left - cw - 12;
    if (y + ch > wr.height - 8) y = clientY - wr.top - ch - 12;
    if (x < 8) x = 8; if (y < 8) y = 8;
    card.style.left = x + "px"; card.style.top = y + "px";
  }
  function updateHoverCardAt(lat, lon, sx, sy, clientX, clientY) {
    if (!hoverCardOn || !enabled) { setHoverCardVisible(false); return; }
    var s = sampleField(lat, lon);
    var b = computeBands(s, lat, lon);
    var near = nearestMetro(lat, lon);
    var st = stateAtSvg(sx, sy);
    var loc = near ? near.label : "—";
    if (st) loc += " · " + st.toUpperCase();
    function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    set("hcLoc", loc);
    set("hcDraw", String(Math.round(s.draw)));
    set("hcMode", b.placeMode === "compress" ? "Metro compress" : "Cool-field amplify");
    set("hcRed", formatMoney(b.red));
    set("hcComp", formatMoney(b.competitive));
    set("hcMagnet", formatMoney(b.magnet));
    set("hcDest", formatMoney(b.destination));
    set("hcAmenity", String(Math.round(s.amenity)));
    set("hcBlurb", whySentence(s, lat, lon));
    setHoverCardVisible(true);
    if (clientX != null) positionHoverCard(clientX, clientY);
  }
  function scheduleHoverFromEvent(evt) {
    if (!enabled || !hoverCardOn) { setHoverCardVisible(false); return; }
    hoverPending = evt;
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(function () {
      hoverRaf = 0;
      var e = hoverPending; hoverPending = null;
      if (!e) return;
      var sp = clientToSvg(e.clientX, e.clientY);
      if (!sp || sp.x < 0 || sp.y < 0 || sp.x > 959 || sp.y > 593) { setHoverCardVisible(false); return; }
      var ll = svgToLonLat(sp.x, sp.y);
      updateHoverCardAt(clamp(ll.lat, 24, 49.5), clamp(ll.lon, -125.5, -66), sp.x, sp.y, e.clientX, e.clientY);
    });
  }

  function updateMiPlacePanel() {
    var box = document.getElementById("mi-place-draw-panel");
    if (!box || !enabled) return;
    syncSpecialtyFromMI();
    var s = sampleField(pin.lat, pin.lon);
    var b = computeBands(s, pin.lat, pin.lon);
    var near = nearestMetro(pin.lat, pin.lon);
    box.innerHTML =
      '<div class="pd-panel-head">Place draw · pin</div>' +
      '<div class="pd-score"><strong>' + Math.round(s.draw) + '</strong> ' +
      '<span class="pd-mode ' + b.placeMode + '">' +
      (b.placeMode === "compress" ? "Metro compress" : "Cool-field amplify") + '</span></div>' +
      '<div class="pd-loc">' + (near ? near.label : "—") +
      (pinState ? (" · " + pinState.toUpperCase()) : "") +
      ' · ' + pin.lat.toFixed(2) + ', ' + pin.lon.toFixed(2) + '</div>' +
      '<div class="pd-bands">' +
      '<span><i class="t-red">Red</i> ' + formatMoney(b.red) + '</span>' +
      '<span><i class="t-comp">Competitive</i> ' + formatMoney(b.competitive) + '</span>' +
      '<span><i class="t-magnet">Magnet</i> ' + formatMoney(b.magnet) + '</span>' +
      '<span><i class="t-dest">Destination</i> ' + formatMoney(b.destination) + '</span></div>' +
      '<p class="pd-why">' + whySentence(s, pin.lat, pin.lon) + '</p>' +
      '<div class="pd-note">AMP YOUR Baseline · ORDER Red &lt; Comp &lt; Magnet &lt; Dest · no MGMA</div>';
  }

  function onPointerDown(e) {
    if (!enabled) return;
    if (e.button != null && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest(".aspect-chip, .metric-btn, button, a, input, select, #mi-place-draw-chrome")) return;
    dragging = true;
    placePinAtEvent(e);
    try { e.preventDefault(); } catch (err) {}
  }
  function onPointerMove(e) {
    if (!enabled) return;
    if (dragging) placePinAtEvent(e);
    else scheduleHoverFromEvent(e);
  }
  function onPointerUp() { dragging = false; }
  function onPointerLeave() { if (!dragging) setHoverCardVisible(false); }

  var boundSvg = null;
  function bindOnce() {
    var svg = mapSvg();
    if (!svg) return;
    if (bound && boundSvg === svg) return;
    bound = true;
    boundSvg = svg;
    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("pointerleave", onPointerLeave);
    var ht = document.getElementById("hoverCardToggle");
    if (ht) {
      ht.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-hover]");
        if (!btn) return;
        hoverCardOn = btn.getAttribute("data-hover") === "on";
        ht.querySelectorAll("button[data-hover]").forEach(function (b) {
          b.classList.toggle("active", (b.getAttribute("data-hover") === "on") === hoverCardOn);
        });
        if (!hoverCardOn) setHoverCardVisible(false);
      });
    }
    var jumps = document.getElementById("miPlaceDrawJumps");
    if (jumps) {
      jumps.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-jump]");
        if (!btn || !enabled) return;
        var id = btn.getAttribute("data-jump");
        var m = METROS.find(function (x) { return x.id === id; });
        if (!m) return;
        setPinLonLat(m.lat, m.lon);
        jumps.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b === btn); });
        renderAll();
      });
    }
  }

  function setLayersVisible(on) {
    ["placeDrawHeatLayer", "placeDrawPinLayer", "placeDrawSelectionOutline",
     "mi-place-draw-chrome", "mi-place-draw-panel"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = on ? "" : "none";
      el.setAttribute("aria-hidden", on ? "false" : "true");
    });
    if (!on) setHoverCardVisible(false);
    var svg = mapSvg();
    if (svg) svg.classList.toggle("mi-place-draw-map", !!on);
    document.body.classList.toggle("mi-place-draw-on", !!on);
    document.documentElement.classList.toggle("mi-place-draw-on", !!on);
  }

  var scaffoldTries = 0;
  function enable() {
    enabled = true;
    if (!ensureScaffold()) {
      if (scaffoldTries++ < 40) setTimeout(function () { if (enabled) enable(); }, 120);
      return;
    }
    scaffoldTries = 0;
    bindOnce(); /* bindOnce is idempotent per SVG */
    setLayersVisible(true);
    if (pin.svgX == null) setPinLonLat(25.76, -80.19);
    heatCache = null;
    requestAnimationFrame(function () { renderAll(); });
  }
  function disable() {
    enabled = false;
    dragging = false;
    setHoverCardVisible(false);
    setLayersVisible(false);
    var svg = mapSvg();
    if (svg) svg.querySelectorAll(".pd-pin-selected").forEach(function (el) { el.classList.remove("pd-pin-selected"); });
    var ol = document.getElementById("placeDrawSelectionOutline");
    if (ol) ol.innerHTML = "";
    try { if (typeof paintMap === "function") paintMap(); } catch (e) {}
  }

  global.AmpMiPlaceDraw = {
    __version: "20260919b",
    enable: enable,
    disable: disable,
    isEnabled: function () { return !!enabled; },
    render: renderAll,
    jumpTo: function (id) {
      var m = METROS.find(function (x) { return x.id === id; });
      if (!m) return false;
      setPinLonLat(m.lat, m.lon);
      if (enabled) renderAll();
      return true;
    },
    getPinBands: function () {
      syncSpecialtyFromMI();
      var s = sampleField(pin.lat, pin.lon);
      return computeBands(s, pin.lat, pin.lon);
    },
    getPin: function () { return { lat: pin.lat, lon: pin.lon, state: pinState }; },
    setHoverCardOn: function (v) { hoverCardOn = !!v; if (!hoverCardOn) setHoverCardVisible(false); },
    ensureScaffold: ensureScaffold,
    refreshPanel: updateMiPlacePanel,
    METROS: METROS,
    SPECIALTIES: SPECIALTIES
  };

})(typeof window !== "undefined" ? window : globalThis);
