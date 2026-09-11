/* amp-build:1999 Ridge workbench — Light MI full-bleed inside mountain chrome.
   No Look/theme switcher. Firm guts (Live AMP / Bullhorn / MPC / Outfitter) stay behind Ask AMP. */
(function (w) {
  "use strict";

  var METRICS = [
    { key: "physicians", label: "Physician supply" },
    { key: "density", label: "Physicians / 100k" },
    { key: "postings", label: "Approx. postings" },
    { key: "ratio", label: "Openings / 100 physicians" },
    { key: "difficulty", label: "Recruiting difficulty" },
    { key: "rpp", label: "COL index (RPP)" },
    { key: "realpay", label: "Real pay value" },
    { key: "comp", label: "Median total comp" }
  ];

  /* Illustrative state COL / RPP seeds (EXAMPLE) — not live BLS */
  var STATE_RPP = {
    al: 88, ak: 105, az: 98, ar: 86, ca: 112, co: 103, ct: 108, de: 100, dc: 118, fl: 100,
    ga: 95, hi: 119, id: 94, il: 100, in: 92, ia: 90, ks: 90, ky: 89, la: 91, me: 98,
    md: 110, ma: 115, mi: 94, mn: 99, ms: 85, mo: 91, mt: 95, ne: 91, nv: 98, nh: 104,
    nj: 114, nm: 92, ny: 116, nc: 96, nd: 93, oh: 93, ok: 88, or: 104, pa: 98, ri: 102,
    sc: 93, sd: 90, tn: 92, tx: 97, ut: 98, vt: 101, va: 103, wa: 108, wv: 87, wi: 95, wy: 96
  };


  /* Market intel seeds (EXAMPLE) — from AMP Market Intelligence for Ridge hover card */
  var RETENTION_BY_STATE = {"al":52.3,"ak":70.3,"az":54.9,"ar":55.3,"ca":75.7,"co":58.2,"ct":46.7,"de":41.2,"dc":33.6,"fl":64.5,"ga":58.5,"hi":52.5,"id":66.0,"il":53.3,"in":55.4,"ia":46.7,"ks":52.8,"ky":50.8,"la":51.8,"me":60.9,"md":45.7,"ma":54.6,"mi":53.1,"mn":51.0,"ms":52.0,"mo":48.0,"mt":58.0,"ne":52.0,"nv":54.0,"nh":45.1,"nj":48.0,"nm":50.0,"ny":48.5,"nc":52.0,"nd":50.0,"oh":51.0,"ok":52.0,"or":55.0,"pa":48.5,"ri":44.9,"sc":54.0,"sd":50.0,"tn":53.0,"tx":64.9,"ut":51.5,"vt":48.9,"va":49.1,"wa":56.1,"wv":49.0,"wi":53.9,"wy":43.0};
  var HPSA_BY_STATE = {"al":{"pctMet":67.0,"needed":239,"pop":2251179},"ak":{"pctMet":26.6,"needed":68,"pop":298176},"az":{"pctMet":42.2,"needed":776,"pop":4220172},"ar":{"pctMet":53.5,"needed":177,"pop":1123775},"ca":{"pctMet":53.6,"needed":1045,"pop":6905819},"co":{"pctMet":46.7,"needed":171,"pop":997473},"ct":{"pctMet":74.6,"needed":73,"pop":961480},"de":{"pctMet":11.2,"needed":122,"pop":394684},"dc":{"pctMet":0.2,"needed":96,"pop":286765},"fl":{"pctMet":39.6,"needed":1434,"pop":6966284},"ga":{"pctMet":39.0,"needed":563,"pop":2720812},"hi":{"pctMet":66.6,"needed":58,"pop":604780},"id":{"pctMet":47.1,"needed":85,"pop":509230},"il":{"pctMet":44.4,"needed":597,"pop":3343128},"in":{"pctMet":52.2,"needed":431,"pop":2822011},"ia":{"pctMet":37.2,"needed":197,"pop":979850},"ks":{"pctMet":41.2,"needed":122,"pop":652005},"ky":{"pctMet":31.4,"needed":388,"pop":1752671},"la":{"pctMet":72.5,"needed":220,"pop":2540625},"me":{"pctMet":60.1,"needed":26,"pop":209904},"md":{"pctMet":28.7,"needed":284,"pop":1170262},"ma":{"pctMet":58.5,"needed":81,"pop":599751},"mi":{"pctMet":47.5,"needed":464,"pop":2629221},"mn":{"pctMet":54.4,"needed":216,"pop":1503698},"ms":{"pctMet":34.9,"needed":303,"pop":1353860},"mo":{"pctMet":21.5,"needed":475,"pop":1837226},"mt":{"pctMet":42.3,"needed":57,"pop":334449},"ne":{"pctMet":49.2,"needed":36,"pop":257978},"nv":{"pctMet":43.7,"needed":180,"pop":957294},"nh":{"pctMet":78.9,"needed":14,"pop":192273},"nj":{"pctMet":70.2,"needed":24,"pop":243247},"nm":{"pctMet":43.7,"needed":182,"pop":1003706},"ny":{"pctMet":35.4,"needed":1036,"pop":4845088},"nc":{"pctMet":47.8,"needed":559,"pop":3203805},"nd":{"pctMet":37.7,"needed":37,"pop":195077},"oh":{"pctMet":48.5,"needed":686,"pop":4017969},"ok":{"pctMet":30.7,"needed":318,"pop":1279787},"or":{"pctMet":51.3,"needed":169,"pop":1022377},"pa":{"pctMet":51.6,"needed":91,"pop":461015},"ri":{"pctMet":74.3,"needed":22,"pop":257218},"sc":{"pctMet":78.5,"needed":189,"pop":2739889},"sd":{"pctMet":33.2,"needed":59,"pop":287405},"tn":{"pctMet":58.8,"needed":383,"pop":2816840},"tx":{"pctMet":51.0,"needed":1147,"pop":7346355},"ut":{"pctMet":65.4,"needed":79,"pop":703027},"vt":{"pctMet":84.2,"needed":2,"pop":43971},"va":{"pctMet":57.5,"needed":298,"pop":2221978},"wa":{"pctMet":45.4,"needed":685,"pop":4101131},"wv":{"pctMet":38.3,"needed":163,"pop":793019},"wi":{"pctMet":54.0,"needed":200,"pop":1500000},"wy":{"pctMet":40.0,"needed":40,"pop":200000}};
  var GME_PROGRAMS = {fm:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:11,ak:1,az:17,ar:15,ca:84,co:14,ct:6,de:4,dc:1,fl:39,ga:20,hi:5,id:9,il:35,in:17,ia:8,ks:6,ky:10,la:13,me:4,md:7,ma:7,mi:40,mn:13,ms:9,mo:14,mt:2,ne:5,nv:7,nh:4,nj:24,nm:7,ny:43,nc:21,nd:6,oh:41,ok:13,or:9,pa:59,pr:5,ri:2,sc:18,sd:3,tn:13,tx:43,ut:5,vt:2,va:17,wa:27,wv:8,wi:21,wy:3,_national:817},im:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:12,ak:1,az:14,ar:11,ca:66,co:4,ct:14,de:2,dc:4,fl:55,ga:21,hi:4,id:2,il:25,in:8,ia:4,ks:4,ky:7,la:11,me:1,md:13,ma:15,mi:36,mn:4,ms:9,mo:14,mt:2,ne:2,nv:6,nh:2,nj:30,nm:3,ny:65,nc:15,nd:2,oh:34,ok:5,or:6,pa:37,pr:10,ri:4,sc:10,sd:1,tn:10,tx:46,ut:1,vt:1,va:14,wa:9,wv:6,wi:6,wy:0,_national:688},obg:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:2,ak:0,az:4,ar:1,ca:25,co:2,ct:6,de:1,dc:3,fl:17,ga:6,hi:2,id:0,il:13,in:3,ia:1,ks:3,ky:3,la:5,me:1,md:5,ma:6,mi:24,mn:2,ms:1,mo:5,mt:0,ne:2,nv:2,nh:1,nj:17,nm:1,ny:36,nc:9,nd:0,oh:15,ok:4,or:1,pa:16,pr:3,ri:1,sc:5,sd:0,tn:8,tx:23,ut:1,vt:1,va:7,wa:3,wv:3,wi:3,wy:0,_national:303},pd:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:2,ak:0,az:3,ar:1,ca:18,co:1,ct:2,de:1,dc:2,fl:15,ga:5,hi:2,id:1,il:10,in:2,ia:2,ks:1,ky:2,la:5,me:1,md:4,ma:4,mi:10,mn:2,ms:1,mo:4,mt:0,ne:1,nv:2,nh:1,nj:9,nm:1,ny:32,nc:5,nd:1,oh:9,ok:3,or:1,pa:8,pr:4,ri:1,sc:3,sd:1,tn:4,tx:13,ut:1,vt:1,va:6,wa:3,wv:3,wi:3,wy:0,_national:217},psych:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:8,ak:0,az:6,ar:3,ca:38,co:2,ct:6,de:2,dc:4,fl:28,ga:8,hi:2,id:2,il:13,in:5,ia:3,ks:2,ky:2,la:5,me:3,md:7,ma:12,mi:12,mn:3,ms:2,mo:5,mt:1,ne:2,nv:4,nh:2,nj:13,nm:1,ny:46,nc:10,nd:1,oh:11,ok:4,or:3,pa:17,pr:2,ri:1,sc:5,sd:1,tn:5,tx:22,ut:1,vt:1,va:7,wa:2,wv:4,wi:4,wy:0,_national:353},em:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:2,ak:0,az:6,ar:3,ca:26,co:1,ct:2,de:2,dc:2,fl:24,ga:5,hi:0,id:0,il:13,in:2,ia:2,ks:1,ky:2,la:4,me:1,md:2,ma:5,mi:27,mn:3,ms:3,mo:5,mt:0,ne:1,nv:4,nh:1,nj:12,nm:1,ny:32,nc:7,nd:0,oh:18,ok:5,or:1,pa:22,pr:2,ri:2,sc:5,sd:1,tn:5,tx:20,ut:1,vt:1,va:7,wa:2,wv:2,wi:2,wy:0,_national:297},ortho:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:3,ak:0,az:3,ar:1,ca:17,co:1,ct:2,de:0,dc:2,fl:11,ga:4,hi:2,id:0,il:7,in:1,ia:1,ks:2,ky:2,la:4,me:0,md:5,ma:4,mi:17,mn:2,ms:1,mo:5,mt:0,ne:1,nv:2,nh:1,nj:10,nm:1,ny:19,nc:5,nd:1,oh:16,ok:2,or:2,pa:16,pr:1,ri:1,sc:3,sd:0,tn:4,tx:15,ut:1,vt:1,va:4,wa:2,wv:2,wi:2,wy:0,_national:209},gs:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:3,ak:0,az:8,ar:1,ca:27,co:5,ct:6,de:2,dc:3,fl:29,ga:8,hi:2,id:0,il:13,in:3,ia:3,ks:3,ky:3,la:6,me:1,md:8,ma:10,mi:24,mn:3,ms:2,mo:5,mt:0,ne:2,nv:3,nh:1,nj:15,nm:1,ny:40,nc:9,nd:1,oh:20,ok:3,or:2,pa:23,pr:2,ri:1,sc:6,sd:1,tn:7,tx:26,ut:2,vt:1,va:8,wa:5,wv:4,wi:4,wy:0,_national:365},rad:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:3,ak:0,az:3,ar:1,ca:20,co:1,ct:6,de:1,dc:2,fl:11,ga:3,hi:1,id:0,il:10,in:2,ia:1,ks:2,ky:2,la:4,me:1,md:3,ma:10,mi:10,mn:2,ms:1,mo:4,mt:0,ne:2,nv:1,nh:1,nj:6,nm:1,ny:25,nc:3,nd:0,oh:8,ok:3,or:1,pa:12,pr:1,ri:1,sc:1,sd:0,tn:4,tx:12,ut:1,vt:1,va:4,wa:4,wv:1,wi:3,wy:0,_national:200},derm:{_type:"residency",_source:"ACGME Data Resource Book AY 2024-2025",al:1,ak:0,az:4,ar:1,ca:12,co:1,ct:2,de:0,dc:3,fl:11,ga:3,hi:0,id:0,il:7,in:1,ia:1,ks:1,ky:1,la:2,me:0,md:3,ma:4,mi:7,mn:3,ms:1,mo:5,mt:0,ne:1,nv:0,nh:1,nj:3,nm:1,ny:12,nc:4,nd:0,oh:7,ok:1,or:2,pa:8,pr:2,ri:1,sc:1,sd:0,tn:2,tx:13,ut:1,vt:1,va:5,wa:1,wv:1,wi:3,wy:0,_national:145},gi:{_type:"fellowship",_source:"ACGME Data Resource Book AY 2024-2025",_national:242},rheum:{_type:"fellowship",_source:"ACGME Data Resource Book AY 2024-2025",_national:138},endo:{_type:"fellowship",_source:"ACGME Data Resource Book AY 2024-2025",_national:163}};
  var GME_SPEC_MAP = {
    family_medicine_without_ob:"fm", family_medicine_with_ob:"fm", family_medicine_ambulatory_only_no_inpatient_work:"fm",
    family_medicine_sports_medicine:"fm", hospitalist_family_medicine:"fm",
    internal_medicine_general:"im", internal_medicine_ambulatory_only_no_inpatient_work:"im", hospitalist_internal_medicine:"im", hospitalist_nocturnist:"im",
    ob_gyn_general:"obg", hospitalist_ob_gyn:"obg",
    pediatrics_general:"pd",
    psychiatry_general:"psych", psychiatry_child_and_adolescent:"psych", psychiatry_geriatric:"psych", psychiatry_addiction_medicine:"psych",
    emergency_medicine:"em",
    orthopedic_surgery_general:"ortho", orthopedic_surgery_sports_medicine:"ortho", orthopedic_surgery_spine:"ortho",
    orthopedic_surgery_trauma:"ortho", orthopedic_surgery_hand:"ortho", orthopedic_surgery_hip_and_joint:"ortho",
    surgery_general:"gs", surgery_trauma:"gs",
    radiology_diagnostic:"rad", radiology_interventional:"rad",
    dermatology:"derm", dermatology_mohs_surgery:"derm",
    gastroenterology:"gi", gastroenterology_hepatology:"gi",
    rheumatology:"rheum",
    endocrinology_metabolism:"endo"
  };

  var state = {
    specialtyKey: null,
    mapMetric: "difficulty",
    selected: {},
    multi: false,
    groupFilter: "all",
    search: "",
    hover: null,
    mapReady: false
  };

  function $(id) { return document.getElementById(id); }
  function data() { return w.AMPRidgeMI || {}; }
  function specialties() { return (data().SPECIALTIES || []); }
  function stateNames() { return data().STATE_NAMES || {}; }
  function statePop() { return data().STATE_POP || {}; }

  function currentSpec() {
    var list = specialties();
    var key = state.specialtyKey || (list[0] && list[0].key);
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
    return list[0] || null;
  }

  function ampSpecGroup(s) {
    var k = (s.key || "").toLowerCase();
    var l = (s.label || "").toLowerCase();
    if (k.indexOf("dent") >= 0 || l.indexOf("dent") >= 0 || k.indexOf("hygien") >= 0 ||
        k.indexOf("orthodont") >= 0 || k.indexOf("endodont") >= 0 || k.indexOf("periodont") >= 0 ||
        k.indexOf("prosthodont") >= 0 || k.indexOf("oral_maxillofacial") >= 0 ||
        l.indexOf("orthodont") >= 0 || l.indexOf("endodont") >= 0 || l.indexOf("periodont") >= 0 ||
        l.indexOf("prosthodont") >= 0 || l.indexOf("oral & maxillofacial") >= 0) return "Dentistry";
    if (k.indexOf("nurse_practitioner") >= 0 || k.indexOf("physician_assistant") >= 0 ||
        k.indexOf("nurse_midwife") >= 0 || k.indexOf("certified_registered_nurse") >= 0 ||
        k.indexOf("crna") >= 0 || k.indexOf("np_") >= 0 || k.indexOf("_np") >= 0 ||
        k.indexOf("pa_") >= 0 || k.indexOf("_pa") >= 0 || k.indexOf("advanced_practice") >= 0 ||
        l.indexOf("nurse practitioner") >= 0 || l.indexOf("physician assistant") >= 0 ||
        l.indexOf("midwife") >= 0 || l.indexOf("crna") >= 0 || l.indexOf("nurse anesthetist") >= 0 ||
        l.indexOf("advanced practice") >= 0 || l.indexOf("(np)") >= 0 || l.indexOf("(pa)") >= 0)
      return "Advanced Practice (Mid-level)";
    if (k.indexOf("therapist") >= 0 || k.indexOf("therapy") >= 0 || k.indexOf("technolog") >= 0 ||
        k.indexOf("technician") >= 0 || k.indexOf("sonograph") >= 0 || k.indexOf("radiologic") >= 0 ||
        k.indexOf("speech") >= 0 || k.indexOf("audiolog") >= 0 || k.indexOf("laboratory") >= 0 ||
        k.indexOf("pharmacist") >= 0 || k.indexOf("pharmacy") >= 0 || k.indexOf("dietitian") >= 0 ||
        k.indexOf("nutrition") >= 0 || k.indexOf("chiropract") >= 0 || k.indexOf("optometr") >= 0 ||
        k.indexOf("podiatr") >= 0 || l.indexOf("therapist") >= 0 || l.indexOf("technician") >= 0 ||
        l.indexOf("technolog") >= 0 || l.indexOf("pharmacist") >= 0 || l.indexOf("optometr") >= 0 ||
        l.indexOf("podiatr") >= 0 || l.indexOf("chiropract") >= 0 || l.indexOf("dietitian") >= 0)
      return "Allied Health";
    return "Physicians";
  }

  function workforceTerms(s) {
    var g = ampSpecGroup(s || {});
    if (g === "Dentistry") {
      return { group: g, plural: "dentists", title: "Dentists", active: "Active dentists", vsSupply: "dentist supply",
        mapSupply: "Dental supply", mapDensity: "Dentists / 100k", mapRatio: "Openings / 100 dentists" };
    }
    if (g === "Allied Health") {
      return { group: g, plural: "clinicians", title: "Clinicians", active: "Active clinicians", vsSupply: "allied supply",
        mapSupply: "Allied supply", mapDensity: "Clinicians / 100k", mapRatio: "Openings / 100 clinicians" };
    }
    if (g === "Advanced Practice (Mid-level)") {
      return { group: g, plural: "APPs", title: "APPs", active: "Active APPs", vsSupply: "APP supply",
        mapSupply: "APP supply", mapDensity: "APPs / 100k", mapRatio: "Openings / 100 APPs" };
    }
    return { group: g, plural: "physicians", title: "Physicians", active: "Active physicians", vsSupply: "physician supply",
      mapSupply: "Physician supply", mapDensity: "Physicians / 100k", mapRatio: "Openings / 100 physicians" };
  }

  function fmtNum(n, digits) {
    if (n == null || isNaN(n)) return null;
    return Number(n).toLocaleString("en-US", {
      maximumFractionDigits: digits == null ? 0 : digits,
      minimumFractionDigits: digits == null ? 0 : digits
    });
  }
  function fmtMoney(n) {
    if (n == null || isNaN(n)) return null;
    return "$" + Math.round(Number(n)).toLocaleString("en-US");
  }
  function show(v, fallback) { return v == null || v === "" ? (fallback || "n/a") : v; }

  function physCountFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.physByState && s.physByState[code] != null) return s.physByState[code] || 0;
    return 0;
  }
  function postingsFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.postingsByState && s.postingsByState[code] != null) return s.postingsByState[code] || 0;
    return 0;
  }
  function densityFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.densityByState && s.densityByState[code] != null) return s.densityByState[code] || 0;
    var n = physCountFor(code);
    var pop = statePop()[code];
    if (!pop) return 0;
    return 100000 * n / pop;
  }
  function ratioFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    if (s.ratioByState && s.ratioByState[code] != null) return s.ratioByState[code] || 0;
    var n = physCountFor(code);
    var p = postingsFor(code);
    if (!n) return 0;
    return Math.round((100 * p / n) * 100) / 100;
  }
  function difficultyFor(code) {
    var s = currentSpec();
    if (!s) return 0;
    var dens = densityFor(code);
    var ratio = ratioFor(code);
    var age = s.age55Pct != null ? s.age55Pct : 50;
    var densScore = dens <= 0 ? 70 : Math.max(0, Math.min(100, 100 * (1 - dens / 60)));
    var ratioScore = Math.max(0, Math.min(100, ratio * 25));
    var ageScore = Math.max(0, Math.min(100, (age - 30) * 2));
    var score = 0.45 * densScore + 0.35 * ratioScore + 0.20 * ageScore;
    if (!s.physCategory && !s.nationalPostings && !s.physByState) return Math.round(score * 0.4 * 10) / 10;
    return Math.round(score * 10) / 10;
  }
  function rppFor(code) { return STATE_RPP[code] || 100; }

  function hpsaFor(code) { return HPSA_BY_STATE[code] || null; }
  function retentionFor(code) {
    var v = RETENTION_BY_STATE[code];
    return v != null ? v : null;
  }
  function gmeKeyForSpec(s) {
    s = s || currentSpec();
    if (!s) return null;
    return GME_SPEC_MAP[s.key] || null;
  }
  function gmeProgramsFor(code, s) {
    var gk = gmeKeyForSpec(s);
    if (!gk || !GME_PROGRAMS[gk]) return null;
    var g = GME_PROGRAMS[gk];
    if (code) {
      if (g[code] != null) return { count: g[code], type: g._type, national: g._national, state: code };
      if (g._type === "fellowship") return { count: null, type: g._type, national: g._national, state: code, nationalOnly: true };
      return { count: 0, type: g._type, national: g._national, state: code };
    }
    return { count: g._national, type: g._type, national: g._national };
  }
  function mgmaBarsHtml(tc, opts) {
    opts = opts || {};
    var cls = opts.className || "ridge-bars";
    if (!tc) return "";
    var maxComp = Math.max(tc.p90 || 0, tc.p75 || 0, tc.p50 || 0, tc.p25 || 0, 1);
    var html = '<div class="' + cls + '">';
    [["25th", tc.p25], ["50th", tc.p50], ["75th", tc.p75], ["90th", tc.p90]].forEach(function (pair) {
      var pct = pair[1] != null ? Math.round(pair[1] / maxComp * 100) : 0;
      html += '<div class="bar-row"><span class="bar-lbl">' + pair[0] + '</span><div class="bar"><i style="width:' + pct + '%"></i></div><span class="bar-val">' + show(fmtMoney(pair[1]), "—") + "</span></div>";
    });
    html += "</div>";
    if (opts.mean !== false && tc.mean != null) {
      html += '<div class="mean-line' + (opts.meanRow ? " mean-row" : "") + '">';
      if (opts.meanRow) html += '<span class="k">Mean</span><span class="v"><strong>' + fmtMoney(tc.mean) + "</strong></span>";
      else html += "Mean " + fmtMoney(tc.mean) + (opts.meanSuffix || " · MGMA · EXAMPLE");
      html += "</div>";
    }
    return html;
  }

  function realPayFor(code) {
    var s = currentSpec();
    var p50 = s && s.totalComp && s.totalComp.p50 != null ? s.totalComp.p50 : null;
    if (p50 == null) return 0;
    var rpp = rppFor(code) || 100;
    return Math.round(p50 * (100 / rpp));
  }
  function compFor() {
    var s = currentSpec();
    return s && s.totalComp && s.totalComp.p50 != null ? s.totalComp.p50 : 0;
  }

  function metricValueFor(code) {
    if (state.mapMetric === "postings") return postingsFor(code);
    if (state.mapMetric === "ratio") return ratioFor(code);
    if (state.mapMetric === "density") return densityFor(code);
    if (state.mapMetric === "difficulty") return difficultyFor(code);
    if (state.mapMetric === "rpp") return rppFor(code);
    if (state.mapMetric === "realpay") return realPayFor(code);
    if (state.mapMetric === "comp") return compFor();
    return physCountFor(code);
  }

  function metricLabelForActive() {
    var s = currentSpec();
    var wt = workforceTerms(s);
    var map = {
      physicians: wt.mapSupply,
      density: wt.mapDensity,
      postings: "Approx. postings",
      ratio: wt.mapRatio,
      difficulty: "Recruiting difficulty",
      rpp: "COL index (RPP)",
      realpay: "Real pay value",
      comp: "Median total comp"
    };
    return map[state.mapMetric] || "Map metric";
  }

  function formatMetric(v) {
    if (v == null || isNaN(v)) return "—";
    if (state.mapMetric === "realpay" || state.mapMetric === "comp") return fmtMoney(v);
    if (state.mapMetric === "density" || state.mapMetric === "ratio" || state.mapMetric === "difficulty")
      return Number(v).toFixed(1);
    if (state.mapMetric === "rpp") return String(Math.round(v));
    return fmtNum(v);
  }

  function lerpColor(t) {
    /* Light MI: soft slate → teal → deep teal */
    t = Math.max(0, Math.min(1, t));
    var a = [186, 210, 222], b = [45, 158, 168], c = [13, 148, 136];
    var rgb;
    if (t < 0.55) {
      var u = t / 0.55;
      rgb = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    } else {
      var u2 = (t - 0.55) / 0.45;
      rgb = [b[0] + (c[0] - b[0]) * u2, b[1] + (c[1] - b[1]) * u2, b[2] + (c[2] - b[2]) * u2];
    }
    return "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")";
  }

  function vacancyBreakdown(annual) {
    if (annual == null || isNaN(annual)) return null;
    return {
      annual: annual,
      quarterly: annual / 4,
      monthly: annual / 12,
      daily: annual / 365,
      d30: annual / 365 * 30,
      d90: annual / 365 * 90,
      d180: annual / 365 * 180
    };
  }

  function timeToFillFor(s) {
    if (!s) return 110;
    if (s.timeToFillDays != null) return s.timeToFillDays;
    return 110;
  }

  function annualRevenueFor(s) {
    if (!s) return null;
    if (s.annualRevenue != null) return s.annualRevenue;
    return null;
  }

  function redrawOutlines() {
    var root = $("ridge-map-container");
    if (!root) return;
    var svg = root.querySelector("svg");
    if (!svg) return;
    var layer = svg.querySelector("#outline-layer");
    if (!layer) {
      layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      layer.setAttribute("id", "outline-layer");
      svg.appendChild(layer);
    }
    layer.innerHTML = "";
    function cloneOutline(code, cls) {
      var srcEl = root.querySelector('.state [data-state="' + code + '"], circle[data-state="' + code + '"]');
      if (!srcEl) srcEl = root.querySelector('[data-state="' + code + '"]');
      if (!srcEl || (srcEl.closest && srcEl.closest("#outline-layer"))) return;
      var clone = srcEl.cloneNode(true);
      clone.removeAttribute("id");
      clone.removeAttribute("class");
      clone.removeAttribute("data-state");
      clone.setAttribute("class", cls);
      clone.style.fill = "none";
      clone.style.pointerEvents = "none";
      clone.style.stroke = "";
      clone.style.strokeWidth = "";
      clone.style.filter = "";
      /* AK/HI multipaths glitch under heavy SVG filters — stroke-only glow */
      if (code === "ak" || code === "hi") {
        clone.style.filter = "none";
        clone.style.stroke = "#0d9488";
        clone.style.strokeWidth = "2.4px";
        clone.style.strokeOpacity = "0.95";
      }
      layer.appendChild(clone);
    }
    selectedCodes().forEach(function (code) { cloneOutline(code, "outline-selected"); });
    if (state.hover && !state.selected[state.hover]) cloneOutline(state.hover, "outline-hover");
  }

  function allStateCodes() {
    return Object.keys(stateNames());
  }

  function metricExtent() {
    var vals = allStateCodes().map(metricValueFor).filter(function (v) { return v != null && !isNaN(v) && v > 0; });
    if (!vals.length) return { min: 0, max: 1 };
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    if (min === max) max = min + 1;
    return { min: min, max: max };
  }

  function paintMap() {
    var root = $("ridge-map-container");
    if (!root) return;
    var ext = metricExtent();
    var nodes = root.querySelectorAll(".state [data-state], circle[data-state]");
    nodes.forEach(function (el) {
      if (el.closest && el.closest("#outline-layer")) return;
      var code = el.getAttribute("data-state");
      var v = metricValueFor(code);
      var t = (v - ext.min) / (ext.max - ext.min);
      if (!v || isNaN(v)) t = 0.08;
      el.style.fill = lerpColor(t);
      el.classList.toggle("selected", !!state.selected[code]);
      el.classList.toggle("is-hover", state.hover === code);
      /* Avoid double-filter black blobs on AK/HI */
      if (code === "ak" || code === "hi") {
        el.style.filter = "none";
      } else {
        el.style.filter = "";
      }
    });
    var legend = $("ridge-map-legend-dynamic");
    if (legend) {
      legend.innerHTML =
        '<span class="ridge-legend-metric">' + metricLabelForActive() + '</span>' +
        '<span class="ridge-legend-scale"><i class="lo"></i> Lower</span>' +
        '<span class="ridge-legend-scale"><i class="hi"></i> Higher</span>' +
        '<span class="ridge-legend-scale"><i class="sel"></i> Selected</span>';
    }
    redrawOutlines();
  }

  function pctCells(obj, fmt) {
    if (!obj) return "";
    return [
      { l: "25th", k: "p25" },
      { l: "50th", k: "p50" },
      { l: "75th", k: "p75" },
      { l: "90th", k: "p90" }
    ].map(function (x) {
      var v = obj[x.k];
      return '<div class="pct"><div class="l">' + x.l + '</div><div class="v">' + show(fmt(v), "—") + '</div></div>';
    }).join("");
  }

  function renderBenchCards() {
    var host = $("ridge-bench-cards");
    if (!host) return;
    var s = currentSpec();
    if (!s) { host.innerHTML = ""; return; }
    var tc = s.totalComp || {};
    var rvu = s.workRVUs || {};
    var ratio = s.compRatio || {};
    var wt = workforceTerms(s);
    var html = "";

    /* Row 1 (Mike 1999): Compensation top-left, then pipeline, then workforce age.
       Row 2: former top row — supply, postings, openings ratio. */
    html += '<div class="bench-card comp bench-featured"><div class="title">Total Compensation (national MGMA)</div>';
    html += '<div class="hero">' + show(fmtMoney(tc.p50), "n/a") + "<small>median</small></div>";
    html += mgmaBarsHtml(tc, { className: "ridge-bars ridge-bars-hud", mean: true, meanSuffix: " · MGMA · EXAMPLE" });
    if (ratio.p50 != null || (rvu && rvu.p50 != null)) {
      html += '<div class="bench-extra">';
      if (ratio.p50 != null) html += '<span>Comp / wRVU <b>' + show(fmtNum(ratio.p50, 2), "n/a") + "</b></span>";
      if (rvu && rvu.p50 != null) html += '<span>wRVU median <b>' + show(fmtNum(rvu.p50), "n/a") + "</b></span>";
      html += "</div>";
    }
    html += "</div>";

    html += '<div class="bench-card pipeline"><div class="title">Training pipeline (NRMP)</div>';
    if (s.pipelineFilled != null) {
      html += '<div class="hero">' + show(fmtNum(s.pipelineFilled), "n/a") + '<small>PGY-1 filled / year</small></div>';
      html += '<div class="mean-line">' + show(fmtNum(s.pipelineOffered), "") + " offered · " +
        (s.pipelineFillRate != null ? s.pipelineFillRate + "% fill" : "") + " · 2025 Match · EXAMPLE</div>";
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>no PGY-1 match breakout</small></div>';
      html += '<div class="mean-line">Subspecialties often lack separate Match counts · EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card aging"><div class="title">Workforce age 55+</div>';
    if (s.age55Pct != null) {
      html += '<div class="hero">' + s.age55Pct.toFixed(1) + '%<small>national specialty signal</small></div>';
      html += '<div class="mean-line">AAMC workforce reports · retirement pressure · EXAMPLE</div>';
    } else {
      html += '<div class="hero"><span class="na">n/a</span></div><div class="mean-line">EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card phys"><div class="title">' + (wt.active || ("Active " + wt.title)) + '</div>';
    if (s.physCategory || (s.physNational != null && s.physNational > 0)) {
      html += '<div class="hero">' + show(fmtNum(s.physNational), "n/a") + '<small>national · ' + (s.physCategory || s.label || wt.title) + '</small></div>';
      html += '<div class="mean-line">KFF May 2026 · EXAMPLE</div>';
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>limited public count</small></div>';
      html += '<div class="mean-line">' + wt.group + ' · supply snapshot · EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card postings"><div class="title">Approx. live postings</div>';
    if (s.nationalPostings) {
      html += '<div class="hero">' + show(fmtNum(s.nationalPostings), "n/a") + '<small>national JAMA</small></div>';
      html += '<div class="mean-line">' + (s.postingCategory || "") + (s.postingDemand ? " · demand " + s.postingDemand : "") + " · EXAMPLE</div>";
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>limited public count</small></div>';
      html += '<div class="mean-line">Not broken out on JAMA snapshot · EXAMPLE</div>';
    }
    html += '</div>';

    html += '<div class="bench-card ratio-card"><div class="title">Openings : ' + wt.plural + '</div>';
    if (s.openingsPerPhysician != null) {
      var per100 = s.openingsPerPhysician * 100;
      html += '<div class="hero">' + per100.toFixed(2) + '<small>openings / 100 ' + wt.plural + '</small></div>';
      html += '<div class="mean-line">≈ ' + show(fmtNum(s.physiciansPerOpening, 1), "n/a") + " " + wt.plural + " per opening · EXAMPLE</div>";
    } else {
      html += '<div class="hero"><span class="na">n/a</span><small>need postings + supply</small></div>';
      html += '<div class="mean-line">Ratio needs postings and ' + wt.vsSupply + " · EXAMPLE</div>";
    }
    html += '</div>';

    host.innerHTML = html;
  }

  function selectedCodes() {
    return Object.keys(state.selected).filter(function (k) { return state.selected[k]; });
  }

  function renderSidebar() {
    var headName = $("ridge-side-name");
    var headSub = $("ridge-side-sub");
    var body = $("ridge-side-body");
    if (!body) return;
    var s = currentSpec();
    var names = stateNames();
    var picks = selectedCodes();
    var wt = workforceTerms(s || {});

    if (headName) {
      if (picks.length === 1) headName.textContent = names[picks[0]] || picks[0].toUpperCase();
      else if (picks.length > 1) headName.textContent = picks.length + " states selected";
      else headName.textContent = s ? s.label : "Market Insight";
    }
    if (headSub) {
      if (picks.length === 1) headSub.textContent = (s ? s.label + " · " : "") + picks[0].toUpperCase() + " · EXAMPLE";
      else if (picks.length > 1) headSub.textContent = (s ? s.label + " · " : "") + metricLabelForActive() + " · EXAMPLE";
      else headSub.textContent = "Difficulty · speed-to-fill · Total Comp MGMA · EXAMPLE";
    }

    var html = "";
    html += '<div class="sel-block">';
    html += '<div class="sel-title"><strong>Selected states</strong><span class="sel-hint">' +
      (state.multi ? "Multi-select ON · click to add/remove" : "Click map · one state · Multi-select / Cmd-click to compare") +
      "</span></div>";
    if (picks.length) {
      html += '<div class="sel-chips">';
      picks.slice().sort(function (a, b) {
        return (names[a] || a).localeCompare(names[b] || b);
      }).forEach(function (code) {
        html += '<span class="sel-chip">' + (names[code] || code.toUpperCase()) +
          '<button type="button" data-remove-state="' + code + '" title="Remove" aria-label="Remove">×</button></span>';
      });
      html += "</div>";
    } else {
      html += '<div class="sel-hint">None selected — click a state on the map</div>';
    }
    html += "</div>";

    html += '<div class="section-title">Market Insight</div>';
    if (picks.length === 1) {
      var code0 = picks[0];
      html += '<div class="row"><span class="k">Recruiting difficulty</span><span class="v"><strong>' +
        Number(difficultyFor(code0)).toFixed(1) + " / 100</strong></span></div>";
    } else if (picks.length > 1) {
      var sumDiff = 0;
      picks.forEach(function (c) { sumDiff += difficultyFor(c) || 0; });
      html += '<div class="row"><span class="k">Avg recruiting difficulty</span><span class="v"><strong>' +
        (sumDiff / picks.length).toFixed(1) + " / 100</strong></span></div>";
    } else if (s) {
      var codes = allStateCodes();
      var dsum = 0, dn = 0;
      codes.forEach(function (c) { var d = difficultyFor(c); if (d) { dsum += d; dn++; } });
      html += '<div class="row"><span class="k">Recruiting difficulty</span><span class="v"><strong>' +
        (dn ? (dsum / dn).toFixed(1) : "—") + " / 100</strong></span></div>";
    }

    var ttfDays = timeToFillFor(s);
    html += '<div class="row"><span class="k">Speed-to-fill</span><span class="v"><strong>~' + ttfDays +
      " days</strong></span></div>";

    if (s && s.totalComp) {
      html += '<div class="section-title">Total Compensation (national MGMA)</div>';
      html += mgmaBarsHtml(s.totalComp, { className: "ridge-bars", mean: true, meanRow: true, meanSuffix: "" });
      if (s.compRatio && s.compRatio.p50 != null)
        html += '<div class="row"><span class="k">Comp / wRVU</span><span class="v">' + show(fmtNum(s.compRatio.p50, 2), "—") + "</span></div>";
      if (s.workRVUs && s.workRVUs.p50 != null)
        html += '<div class="row"><span class="k">wRVU median</span><span class="v">' + show(fmtNum(s.workRVUs.p50), "—") + "</span></div>";
    }

    var annualRev = annualRevenueFor(s);
    var vac = vacancyBreakdown(annualRev);
    if (vac) {
      html += '<div class="section-title">Cost of vacancy</div>';
      html += '<div class="vacancy-box">';
      html += '<div class="vac-title">Benchmark search length · AAPPR-aligned</div>';
      html += '<div class="vac-hero">' + ttfDays + ' days<small>median time-to-fill for specialty family</small></div>';
      html += '<div class="row vac-daily"><span class="k">Daily cost they\u2019re losing</span><span class="v"><strong>' + fmtMoney(vac.daily) + "</strong></span></div>";
      html += '<div class="row"><span class="k">Revenue at risk over TTF</span><span class="v"><strong>' + fmtMoney(vac.daily * ttfDays) + "</strong></span></div>";
      html += '<div class="vacancy-grid">';
      html += '<div class="cell"><div class="lbl">Daily</div><div class="val">' + fmtMoney(vac.daily) + "</div></div>";
      html += '<div class="cell"><div class="lbl">Monthly</div><div class="val">' + fmtMoney(vac.monthly) + "</div></div>";
      html += '<div class="cell"><div class="lbl">Quarterly</div><div class="val">' + fmtMoney(vac.quarterly) + "</div></div>";
      html += '<div class="cell"><div class="lbl">Annual</div><div class="val">' + fmtMoney(vac.annual) + "</div></div>";
      html += "</div>";
      html += '<div class="note">TTF is a specialty benchmark. Revenue is directional professional medical revenue · EXAMPLE.</div>';
      html += "</div>";
    }

    if (picks.length) {
      html += '<div class="section-title">Selected · supply &amp; openings</div>';
      var sumPhys = 0, sumPost = 0, sumPop = 0;
      var pop = statePop();
      picks.slice().sort(function (a, b) {
        return (names[a] || a).localeCompare(names[b] || b);
      }).forEach(function (code) {
        var n = physCountFor(code);
        var p = postingsFor(code);
        var dens = densityFor(code);
        var diff = difficultyFor(code);
        sumPhys += n || 0;
        sumPost += p || 0;
        sumPop += pop[code] || 0;
        html += '<div class="st-card">';
        html += '<div class="st-name">' + (names[code] || code.toUpperCase()) + "</div>";
        html += '<div class="st-metrics">';
        html += '<div class="st-m"><span class="st-ml">' + wt.title + '</span><span class="st-mv">' + show(fmtNum(n), "—") + "</span></div>";
        html += '<div class="st-m"><span class="st-ml">Per 100k</span><span class="st-mv">' + Number(dens).toFixed(1) + "</span></div>";
        html += '<div class="st-m"><span class="st-ml">~Jobs</span><span class="st-mv">' + show(fmtNum(p), "0") + "</span></div>";
        html += '<div class="st-m"><span class="st-ml">Difficulty</span><span class="st-mv">' + Number(diff).toFixed(1) + "</span></div>";
        html += "</div>";
        html += '<div class="st-pay"><span>COL ' + rppFor(code) + '</span><span>Real pay ' + show(fmtMoney(realPayFor(code)), "—") + "</span></div>";
        html += "</div>";
      });
      html += '<div class="row"><span class="k"><strong>Combined ' + wt.plural + '</strong></span><span class="v"><strong>' + show(fmtNum(sumPhys), "—") + "</strong></span></div>";
      if (sumPop > 0)
        html += '<div class="row"><span class="k"><strong>Combined density</strong></span><span class="v"><strong>' + (100000 * sumPhys / sumPop).toFixed(1) + " / 100k</strong></span></div>";
      if (sumPhys > 0)
        html += '<div class="row"><span class="k"><strong>Selected openings / 100</strong></span><span class="v"><strong>' + (100 * sumPost / sumPhys).toFixed(2) + "</strong></span></div>";
    } else if (s) {
      html += '<div class="section-title">National benchmarks</div>';
      html += '<div class="row"><span class="k">Active supply</span><span class="v">' + show(fmtNum(s.physNational), "—") + "</span></div>";
      html += '<div class="row"><span class="k">Approx. postings</span><span class="v">' + show(fmtNum(s.nationalPostings), "—") + "</span></div>";
      html += '<div class="row"><span class="k">Age 55+</span><span class="v">' + (s.age55Pct != null ? s.age55Pct.toFixed(1) + "%" : "—") + "</span></div>";
    }

    html += '<p class="ridge-side-note">EXAMPLE / ILLUSTRATIVE · Selection stays on the map. Multi-select toggle or Cmd/Ctrl+click to compare. No client names, search IDs, or Outfitter guts.</p>';
    body.innerHTML = html;
  }

  function updateTitle() {
    var s = currentSpec();
    var title = $("mi-app-title");
    var copy = $("mi-app-copy");
    var picks = selectedCodes();
    var names = stateNames();
    var lens = picks.length ? picks.map(function (c) { return names[c] || c.toUpperCase(); }).join(" · ") : "national lens";
    if (title) title.textContent = (s ? s.label : "Specialty") + " · " + lens;
    if (copy) copy.textContent = "Full Ridge market workbench for " + (s ? s.label : "specialty") +
      " — map, HUD cards, and state rail. EXAMPLE signals for planning; Ask AMP for Live AMP / Bullhorn / MPC / Outfitter.";
  }

  function updateMetricButtons() {
    var bar = $("ridge-metric-bar");
    if (!bar) return;
    var wt = workforceTerms(currentSpec());
    var labels = {
      physicians: wt.mapSupply,
      density: wt.mapDensity,
      postings: "Approx. postings",
      ratio: wt.mapRatio,
      difficulty: "Recruiting difficulty",
      rpp: "COL index (RPP)",
      realpay: "Real pay value",
      comp: "Median total comp"
    };
    bar.querySelectorAll(".metric-btn").forEach(function (btn) {
      var key = btn.getAttribute("data-metric");
      if (labels[key]) btn.textContent = labels[key];
      btn.classList.toggle("active", key === state.mapMetric);
    });
  }

  function populateSpecialtySelect() {
    var sel = $("mi-app-specialty");
    if (!sel) return;
    var q = (state.search || "").toLowerCase().trim();
    var current = state.specialtyKey;
    sel.innerHTML = "";
    var groups = {
      "Physicians": [],
      "Advanced Practice (Mid-level)": [],
      "Allied Health": [],
      "Dentistry": []
    };
    specialties().forEach(function (s) {
      if (q && (s.label || "").toLowerCase().indexOf(q) < 0 && (s.key || "").toLowerCase().indexOf(q) < 0) return;
      var g = ampSpecGroup(s);
      if (state.groupFilter && state.groupFilter !== "all" && g !== state.groupFilter) return;
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    });
    var order = ["Physicians", "Advanced Practice (Mid-level)", "Allied Health", "Dentistry"];
    var total = 0;
    order.forEach(function (gName) {
      var list = groups[gName] || [];
      if (!list.length) return;
      var og = document.createElement("optgroup");
      og.label = gName + " (" + list.length + ")";
      list.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.key;
        opt.textContent = s.label;
        og.appendChild(opt);
        total++;
      });
      sel.appendChild(og);
    });
    if (!total) {
      var opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No matches";
      sel.appendChild(opt);
      return;
    }
    var found = false;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === current) { found = true; break; }
    }
    if (found) sel.value = current;
    else {
      state.specialtyKey = sel.options[0].value;
      sel.value = state.specialtyKey;
    }
  }

  function setSpecialty(key) {
    state.specialtyKey = key;
    refresh();
  }

  function toggleState(code, additive) {
    if (!code) return;
    var multi = !!additive || !!state.multi;
    if (multi) {
      state.selected[code] = !state.selected[code];
      if (!state.selected[code]) delete state.selected[code];
    } else {
      var only = selectedCodes();
      if (only.length === 1 && only[0] === code) state.selected = {};
      else {
        state.selected = {};
        state.selected[code] = true;
      }
    }
    paintMap();
    renderSidebar();
    updateTitle();
  }

  function clearStates() {
    state.selected = {};
    paintMap();
    renderSidebar();
    updateTitle();
  }

  function showTooltip(evt, code) {
    var tip = $("ridge-map-tooltip");
    if (!tip) return;
    if (!code) { tip.hidden = true; tip.innerHTML = ""; return; }
    var names = stateNames();
    var s = currentSpec();
    var wt = workforceTerms(s || {});
    var n = physCountFor(code);
    var p = postingsFor(code);
    var r = ratioFor(code);
    var dens = densityFor(code);
    var diff = difficultyFor(code);
    var h = hpsaFor(code);
    var ret = retentionFor(code);
    var rows = "";
    function addRow(k, v) {
      if (v == null || v === "") return;
      rows += '<div class="tt-row"><span class="tt-k">' + k + '</span><span class="tt-v">' + v + "</span></div>";
    }
    addRow(wt.title, n ? Number(n).toLocaleString("en-US") : "0");
    if (dens) addRow(wt.title + " density", Number(dens).toFixed(1) + " / 100k");
    if (s && s.nationalPostings) addRow("Approx. postings", "~" + Math.round(p || 0).toLocaleString("en-US"));
    if (r) addRow("Openings / 100 " + wt.plural, String(r));
    if (diff) addRow("Difficulty", diff + " / 100");
    var rpp = rppFor(code);
    if (rpp != null) {
      var vs = rpp - 100;
      addRow("COL (BEA RPP)", Number(rpp).toFixed(1) + " (" + (vs >= 0 ? "+" : "") + Number(vs).toFixed(1) + "% vs U.S.)");
      var realPay = realPayFor(code);
      if (realPay) addRow("Real value of nat. median", fmtMoney(realPay));
    }
    var gme = gmeProgramsFor(code, s);
    if (gme) {
      if (gme.nationalOnly) addRow(gme.type === "fellowship" ? "Fellowships (U.S.)" : "Residencies (U.S.)", String(gme.national));
      else if (gme.count != null) addRow(gme.type === "fellowship" ? "Fellowships in state" : "Residencies in state", String(gme.count) + " (U.S. " + gme.national + ")");
    }
    var extra = "";
    if (h) {
      extra += '<div class="tt-section"><div class="tt-section-label">Primary care HPSA</div>';
      extra += '<div class="tt-row"><span class="tt-k">Need met</span><span class="tt-v">' + h.pctMet.toFixed(0) + "%</span></div>";
      extra += '<div class="tt-row"><span class="tt-k">PC needed</span><span class="tt-v">' + Number(h.needed).toLocaleString("en-US") + "</span></div></div>";
    }
    if (ret != null) {
      extra += '<div class="tt-section"><div class="tt-section-label">GME retention</div>';
      extra += '<div class="tt-row"><span class="tt-k">Stay in-state</span><span class="tt-v">' + Number(ret).toFixed(1) + "%</span></div></div>";
    }
    var hint = state.multi
      ? "Multi-select ON · click to add/remove"
      : "Cmd/Ctrl · multi-select";
    tip.hidden = false;
    tip.innerHTML = '<div class="tt-head"><div class="tt-title">' + (names[code] || code.toUpperCase()) +
      '</div><div class="tt-hint">' + hint + '</div></div><div class="tt-body">' + rows + extra + "</div>";
    var wrap = $("ridge-map-wrap") || tip.parentElement;
    var rect = wrap.getBoundingClientRect();
    var tw = tip.offsetWidth || 260;
    var th = tip.offsetHeight || 220;
    var x = evt.clientX - rect.left + 14;
    var y = evt.clientY - rect.top + 14;
    if (x + tw > rect.width - 8) x = Math.max(8, rect.width - tw - 8);
    if (y + th > rect.height - 8) y = Math.max(8, evt.clientY - rect.top - th - 12);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  function ensureMapGlow(host) {
    if (!host) return;
    var svg = host.querySelector("svg");
    if (!svg) return;
    if (!svg.querySelector("#ampStateGlow")) {
      var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML =
        '<filter id="ampStateGlow" x="-120%" y="-120%" width="340%" height="340%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b1"/>' +
        '<feFlood flood-color="#ffffff" flood-opacity="0.95" result="f1"/>' +
        '<feComposite in="f1" in2="b1" operator="in" result="g1"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b2"/>' +
        '<feFlood flood-color="#0d9488" flood-opacity="0.95" result="f2"/>' +
        '<feComposite in="f2" in2="b2" operator="in" result="g2"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="16" result="b3"/>' +
        '<feFlood flood-color="#0d9488" flood-opacity="0.75" result="f3"/>' +
        '<feComposite in="f3" in2="b3" operator="in" result="g3"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="26" result="b4"/>' +
        '<feFlood flood-color="#14b8a6" flood-opacity="0.45" result="f4"/>' +
        '<feComposite in="f4" in2="b4" operator="in" result="g4"/>' +
        '<feMerge><feMergeNode in="g4"/><feMergeNode in="g3"/><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
      svg.insertBefore(defs, svg.firstChild);
    }
    if (!svg.querySelector("#outline-layer")) {
      var layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      layer.setAttribute("id", "outline-layer");
      svg.appendChild(layer);
    }
    svg.querySelectorAll(".state [data-state], circle[data-state]").forEach(function (el) {
      el.style.pointerEvents = "auto";
      el.style.cursor = "pointer";
    });
    svg.querySelectorAll("g.borders path, path.separator1").forEach(function (el) {
      el.style.pointerEvents = "none";
      el.style.fill = "none";
      el.setAttribute("fill", "none");
      if (el.classList.contains("separator1") || (el.getAttribute("class") || "").indexOf("separator") >= 0) {
        el.style.stroke = "#94a3b8";
        el.style.strokeWidth = "1";
        el.style.opacity = "0.55";
      }
    });
  }

  function bindMap() {
    var root = $("ridge-map-container");
    if (!root || root.getAttribute("data-ridge-bound") === "1") return;
    root.setAttribute("data-ridge-bound", "1");
    ensureMapGlow(root);

    root.addEventListener("pointerover", function (e) {
      var el = e.target.closest("[data-state]");
      if (!el || !root.contains(el)) return;
      var code = el.getAttribute("data-state");
      if (state.hover === code) return;
      state.hover = code;
      paintMap();
      showTooltip(e, state.hover);
    });
    root.addEventListener("pointermove", function (e) {
      var el = e.target.closest("[data-state]");
      if (el && root.contains(el)) {
        var code = el.getAttribute("data-state");
        if (state.hover !== code) {
          state.hover = code;
          paintMap();
        }
        showTooltip(e, state.hover);
      }
    });
    root.addEventListener("pointerleave", function () {
      if (!state.hover) return;
      state.hover = null;
      paintMap();
      showTooltip(null, null);
    });
    root.addEventListener("click", function (e) {
      var el = e.target.closest("[data-state]");
      if (!el || !root.contains(el)) return;
      e.preventDefault();
      var additive = state.multi || e.metaKey || e.ctrlKey;
      toggleState(el.getAttribute("data-state"), additive);
    });
  }

  function loadMapSvg(cb) {
    var host = $("ridge-map-container");
    if (!host) { if (cb) cb(); return; }
    if (host.querySelector("svg")) {
      state.mapReady = true;
      host.removeAttribute("data-ridge-bound");
      ensureMapGlow(host);
      bindMap();
      if (cb) cb();
      return;
    }
    fetch("assets/ridge-usa-map.svg?v=1999")
      .then(function (r) {
        if (!r.ok) throw new Error("map " + r.status);
        return r.text();
      })
      .then(function (svg) {
        host.innerHTML = svg;
        state.mapReady = true;
        host.removeAttribute("data-ridge-bound");
        ensureMapGlow(host);
        bindMap();
        if (cb) cb();
      })
      .catch(function () {
        host.innerHTML = '<p class="ridge-map-fallback">Map failed to load. Refresh or Ask AMP.</p>';
        if (cb) cb();
      });
  }

  function refresh() {
    updateMetricButtons();
    renderBenchCards();
    paintMap();
    renderSidebar();
    updateTitle();
  }

  function bindChrome() {
    var root = $("ridge-workbench");
    if (!root || root.getAttribute("data-ridge-chrome") === "1") return;
    root.setAttribute("data-ridge-chrome", "1");

    var bar = $("ridge-metric-bar");
    if (bar) {
      bar.addEventListener("click", function (e) {
        var btn = e.target.closest(".metric-btn");
        if (!btn) return;
        state.mapMetric = btn.getAttribute("data-metric") || "difficulty";
        refresh();
      });
    }

    document.querySelectorAll(".ridge-carve-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.groupFilter = btn.getAttribute("data-carve") || "all";
        document.querySelectorAll(".ridge-carve-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        populateSpecialtySelect();
        var sel = $("mi-app-specialty");
        if (sel && sel.value) state.specialtyKey = sel.value;
        refresh();
      });
    });

    var search = $("ridge-spec-search");
    if (search) {
      search.addEventListener("input", function () {
        state.search = search.value || "";
        populateSpecialtySelect();
        var sel = $("mi-app-specialty");
        if (sel && sel.value) state.specialtyKey = sel.value;
        refresh();
      });
    }

    var sel = $("mi-app-specialty");
    if (sel) {
      sel.addEventListener("change", function () {
        if (sel.value) setSpecialty(sel.value);
      });
    }

    var clearBtn = $("ridge-clear-states");
    if (clearBtn) clearBtn.addEventListener("click", clearStates);

    var multiBtn = $("ridge-multi-toggle");
    if (multiBtn) {
      function syncMultiBtn() {
        multiBtn.classList.toggle("active", !!state.multi);
        multiBtn.setAttribute("aria-pressed", state.multi ? "true" : "false");
        multiBtn.textContent = state.multi ? "Multi-select ON" : "Multi-select";
      }
      syncMultiBtn();
      multiBtn.addEventListener("click", function () {
        state.multi = !state.multi;
        syncMultiBtn();
        renderSidebar();
      });
    }

    var side = $("ridge-side-body");
    if (side) {
      side.addEventListener("click", function (e) {
        var rem = e.target.closest("[data-remove-state]");
        if (rem) {
          e.preventDefault();
          var code = rem.getAttribute("data-remove-state");
          if (state.selected[code]) {
            delete state.selected[code];
            paintMap();
            renderSidebar();
            updateTitle();
          }
          return;
        }
        var row = e.target.closest("[data-ridge-state]");
        if (!row) return;
        toggleState(row.getAttribute("data-ridge-state"), state.multi);
      });
    }
  }

  function buildReportHtml() {
    var s = currentSpec();
    var picks = selectedCodes();
    var names = stateNames();
    var logo = (function () {
      try {
        return new URL("assets/amp-lockup-nav.png?v=1999", window.location.href).href;
      } catch (e) {
        return "assets/amp-lockup-nav.png?v=1999";
      }
    })();
    var rows = picks.length ? picks : allStateCodes().slice(0, 12);
    var table = rows.map(function (code) {
      return "<tr><td>" + (names[code] || code.toUpperCase()) + "</td><td>" + formatMetric(metricValueFor(code)) +
        "</td><td>" + fmtNum(physCountFor(code)) + "</td><td>" + Number(difficultyFor(code)).toFixed(1) + "</td></tr>";
    }).join("");
    var tc = s && s.totalComp ? s.totalComp : {};
    return "<!doctype html><html><head><meta charset='utf-8'><title>Ridge Report · Adaptive Medical Partners</title>" +
      "<style>body{font-family:Inter,system-ui,sans-serif;color:#0f172a;padding:32px;max-width:900px;margin:0 auto}" +
      ".logo{height:52px;width:auto;margin-bottom:18px}h1{font-size:22px;margin:0 0 6px}p{color:#475569}" +
      "table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;font-size:13px}" +
      ".stamp{display:inline-block;letter-spacing:.12em;font-size:11px;font-weight:800;color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;padding:4px 8px;border-radius:999px}" +
      ".cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0} .card{border:1px solid #e2e8f0;border-radius:12px;padding:12px} .card b{display:block;font-size:20px;margin-top:6px}" +
      "@media print{.no-print{display:none}}</style></head><body>" +
      '<img class="logo" src="' + logo + '" alt="Adaptive Medical Partners" />' +
      '<div class="stamp">EXAMPLE / ILLUSTRATIVE</div>' +
      "<h1>Ridge market report</h1>" +
      "<p><strong>" + (s ? s.label : "Specialty") + "</strong> · " + metricLabelForActive() +
      " · Generated from the Ridge sample on Adaptive Medical Partners.</p>" +
      '<div class="cards">' +
      "<div class='card'>Active supply<b>" + show(fmtNum(s && s.physNational), "n/a") + "</b></div>" +
      "<div class='card'>Approx. postings<b>" + show(fmtNum(s && s.nationalPostings), "n/a") + "</b></div>" +
      "<div class='card'>Median total comp<b>" + show(fmtMoney(tc.p50), "n/a") + "</b></div>" +
      "</div>" +
      "<table><thead><tr><th>State</th><th>Map metric</th><th>Supply</th><th>Difficulty</th></tr></thead><tbody>" +
      table + "</tbody></table>" +
      "<p style='margin-top:24px;font-size:12px;color:#64748b'>Adaptive Medical Partners · Ridge sample. Not a live Outfitter export. Ask AMP for guided recruiting next steps.</p>" +
      '<p class="no-print"><button onclick="window.print()">Print / Save PDF</button></p>' +
      "</body></html>";
  }

  function downloadReport() {
    var html = buildReportHtml();
    var wdw = window.open("", "_blank");
    if (!wdw) return false;
    wdw.document.open();
    wdw.document.write(html);
    wdw.document.close();
    return true;
  }

  function init() {
    if (!data().SPECIALTIES || !data().SPECIALTIES.length) return;
    if (!state.specialtyKey) state.specialtyKey = data().SPECIALTIES[0].key;
    populateSpecialtySelect();
    bindChrome();
    loadMapSvg(function () { refresh(); });
  }

  w.AMPRidgeWorkbench = {
    init: init,
    refresh: refresh,
    downloadReport: downloadReport,
    getSpecialtyKey: function () { return state.specialtyKey; },
    setSpecialtyKey: setSpecialty
  };
})(window);
