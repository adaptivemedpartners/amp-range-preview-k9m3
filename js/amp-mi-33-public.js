/* amp-build 2201: 33 kept specialties on public MI. Competitive = Mike-approved 2026-09-25 (MI-33-COMPETITIVE-DRAFT-20260925.xlsx).
   Red/Magnet/Destination use the same default spread as the internal MI for non-MGMA rows (Red = Competitive / 1.2, Magnet = x1.21, Destination = x1.4641).
   New rows use NPPES Sep 2026 V2 candidate counts (high/medium confidence) as supply. No MGMA, no postings invented (left null). */
(function (w) {
  "use strict";
  var MI = w.AMPRidgeMI, NP = w.AMP_MI_NPPES || {};
  if (!MI || !MI.SPECIALTIES) return;
  var COMP = {
"Anesthesiologist Assistant": {
"competitive": 206000,
"conf": "medium",
"method": "Midpoint of CAA market range 158k-253k (AAAA/AnesthesiaJobs).",
"thin": true
},
"Cardiovascular Perfusionist": {
"competitive": 203000,
"conf": "medium",
"method": "AmSECT survey total comp ~202,691 (older survey, not inflation-adjusted).",
"thin": false
},
"Chiropractor": {
"competitive": 79000,
"conf": "medium",
"method": "BLS median; excludes owner income so likely understates.",
"thin": false
},
"Clinical Nurse Specialist": {
"competitive": 132000,
"conf": "low",
"method": "BLS NP median used as the only number; CNS usually pays below NP, so this is a ceiling.",
"thin": true
},
"Echo Technologist": {
"competitive": 89000,
"conf": "medium",
"method": "BLS sonographer median; cardiac echo usually above this.",
"thin": false
},
"Neuropsychologist": {
"competitive": 95000,
"conf": "low",
"method": "BLS all-psychologists median; clinical neuropsych usually higher. Floor.",
"thin": true
},
"Pharmacist": {
"competitive": 137000,
"conf": "high",
"method": "BLS pharmacist median (exact occupation).",
"thin": false
},
"Physical Therapist Assistant": {
"competitive": 66000,
"conf": "high",
"method": "BLS PTA median (exact occupation).",
"thin": false
},
"Anesthesiology: Critical Care": {
"competitive": 465000,
"conf": "low",
"method": "Mean of anesthesiology mean and Medscape critical care.",
"thin": true
},
"Cardiology: Adult Congenital Heart Disease": {
"competitive": 554000,
"conf": "medium",
"method": "Mean of Doximity 587,360 and Medscape 520,000.",
"thin": false
},
"Cardiology: Advanced Heart Failure & Transplant": {
"competitive": 554000,
"conf": "medium",
"method": "Mean of Doximity and Medscape cardiology.",
"thin": false
},
"Cardiology: Nuclear": {
"competitive": 554000,
"conf": "medium",
"method": "Mean of Doximity and Medscape cardiology.",
"thin": false
},
"Dermatology: Micrographic Surgery & Dermatologic Oncology": {
"competitive": 481000,
"conf": "medium",
"method": "Mean of Doximity 508,401 and Medscape 454,000.",
"thin": false
},
"Interventional Radiology: Integrated": {
"competitive": 573000,
"conf": "high",
"method": "Direct Doximity 2025 IR line.",
"thin": false
},
"Neurology: Vascular Neurology": {
"competitive": 346000,
"conf": "medium",
"method": "Mean of Doximity and Medscape neurology.",
"thin": false
},
"Neurotology": {
"competitive": 504000,
"conf": "medium",
"method": "Mean of Doximity and Medscape otolaryngology.",
"thin": false
},
"Ophthalmology: Ophthalmic Plastic & Reconstructive": {
"competitive": 443000,
"conf": "low",
"method": "Mean of Doximity and Medscape ophthalmology.",
"thin": true
},
"Orthopedic Surgery: Adult Reconstructive": {
"competitive": 622000,
"conf": "low",
"method": "Mean of Doximity 679,517 and Medscape 564,000 (sources ~20% apart).",
"thin": true
},
"Physiatry: Spinal Cord Injury Medicine": {
"competitive": 368000,
"conf": "medium",
"method": "Mean of Doximity and Medscape PM&R.",
"thin": false
},
"Radiology: Abdominal": {
"competitive": 549000,
"conf": "medium",
"method": "Mean of Doximity and Medscape radiology.",
"thin": false
},
"Sports Medicine: Emergency": {
"competitive": 400000,
"conf": "medium",
"method": "Mean of Doximity and Medscape EM.",
"thin": false
},
"Sports Medicine: Internal Medicine": {
"competitive": 326000,
"conf": "low",
"method": "Doximity IM only (single source).",
"thin": true
},
"Sports Medicine: PM&R": {
"competitive": 368000,
"conf": "medium",
"method": "Mean of Doximity and Medscape PM&R.",
"thin": false
},
"Surgery: Complex General Surgical Oncology": {
"competitive": 493000,
"conf": "low",
"method": "Mean of Doximity oncology and general surgery.",
"thin": true
},
"Surgery: Hand (General)": {
"competitive": 458000,
"conf": "low",
"method": "Mean of Doximity and Medscape general surgery.",
"thin": true
},
"Surgery: Surgical Critical Care": {
"competitive": 438000,
"conf": "low",
"method": "Mean of Medscape critical care and general-surgery mean.",
"thin": true
},
"Pediatrics: Clinical and Lab Immunology": {
"competitive": 265000,
"conf": "medium",
"method": "Mean of Doximity and Medscape pediatrics.",
"thin": false
},
"Pediatrics: Dermatology": {
"competitive": 373000,
"conf": "low",
"method": "Midpoint of pediatrics and dermatology means.",
"thin": true
},
"Pediatrics: Sports Medicine": {
"competitive": 265000,
"conf": "medium",
"method": "Mean of Doximity and Medscape pediatrics.",
"thin": false
},
"Psychiatry: Chemical Dependency": {
"competitive": 341000,
"conf": "medium",
"method": "Mean of Doximity and Medscape psychiatry.",
"thin": false
},
"Psychiatry: Forensic": {
"competitive": 341000,
"conf": "medium",
"method": "Mean of Doximity and Medscape psychiatry.",
"thin": false
},
"Psychiatry: Geriatric": {
"competitive": 341000,
"conf": "medium",
"method": "Mean of Doximity and Medscape psychiatry.",
"thin": false
},
"Surgery: Plastic and Reconstruction-Hand": {
"competitive": 583000,
"conf": "medium",
"method": "Mean of Doximity and Medscape plastic surgery.",
"thin": false
}
};
  function slug(l) { return l.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
  function bands(c) { return { redAlert: Math.round(c / 1.2), competitive: c, magnet: Math.round(c * 1.21), destination: Math.round(c * 1.4641) }; }
  var pop = MI.STATE_POP || {}, list = MI.SPECIALTIES, byLabel = {};
  list.forEach(function (s) { byLabel[String(s.label).toLowerCase()] = s; });
  var added = 0, updated = 0;
  Object.keys(COMP).forEach(function (label) {
    var c = COMP[label], s = byLabel[label.toLowerCase()], np = NP[label];
    if (!s) {
      s = { key: slug(label), label: label, physByState: {}, densityByState: {}, postingsByState: {}, ratioByState: {},
        physNational: null, physNationalForRatio: null, age55Pct: null, annualRevenue: null, compRatio: null,
        totalComp: null, workRVUs: null, timeToFillDays: null, nationalPostings: null, supplySource: null };
      if (np) {
        s.physNational = np.national; s.physNationalForRatio = np.national; s.supplySource = np.source;
        Object.keys(np.byState).forEach(function (st) {
          var n = np.byState[st]; s.physByState[st] = n;
          s.densityByState[st] = pop[st] ? Math.round(n / pop[st] * 1e6) / 10 : 0;
          s.postingsByState[st] = 0; s.ratioByState[st] = 0;
        });
      }
      list.push(s); added++;
    } else updated++;
    s.ampBands = bands(c.competitive);
    s.amp33 = true;
    s.ampBandsNote = "Competitive approved 2026-09-25 (" + c.conf + " confidence)";
  });
  MI.AMP33 = { added: added, updated: updated, keys: Object.keys(COMP) };
})(window);
