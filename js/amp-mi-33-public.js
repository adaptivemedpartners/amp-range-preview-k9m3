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
  /* 2222/2223: core rows whose AMP bands exist on internal MI (same method, e.g. FM matches) but were never copied to public. 2223 copies all 167. */
  var CORE = {
    ob_gyn_general: { redAlert: 341958, competitive: 405430, magnet: 496403, destination: 607788 },
    internal_medicine_general: { redAlert: 269281, competitive: 323137, magnet: 387764, destination: 465317 },
    emergency_medicine: { redAlert: 351968, competitive: 422362, magnet: 507834, destination: 610603 },
    psychiatry_general: { redAlert: 284078, competitive: 340893, magnet: 410934, destination: 495367 },
    hospitalist_internal_medicine: { redAlert: 303853, competitive: 349431, magnet: 440283, destination: 554757 },
    cardiology_noninvasive: { redAlert: 495695, competitive: 589818, magnet: 719648, destination: 878055 },
    cardiology_invasive_interventional: { redAlert: 652454, competitive: 750322, magnet: 945406, destination: 1191211 },
    anesthesiology: { redAlert: 458388, competitive: 550066, magnet: 661939, destination: 796566 },
    surgery_general: { redAlert: 419799, competitive: 501885, magnet: 609520, destination: 740239 },
    pediatrics_general: { redAlert: 224860, competitive: 269832, magnet: 323798, destination: 388558 },
    urgent_care: { redAlert: 217962, competitive: 261555, magnet: 316072, destination: 381952 },
    allergy_immunology: { redAlert: 298736, competitive: 358483, magnet: 433764, destination: 524855 },
    anesthesiology_cardiology: { redAlert: 521239, competitive: 625487, magnet: 752700, destination: 905785 },
    anesthesiology_pain_management: { redAlert: 462133, competitive: 531453, magnet: 669631, destination: 843735 },
    bariatrics_nonsurgical_obesity_medicine: { redAlert: 246053, competitive: 295264, magnet: 357269, destination: 432296 },
    cardiology_electrophysiology: { redAlert: 644583, competitive: 741271, magnet: 934001, destination: 1176842 },
    cardiology_invasive: { redAlert: 526907, competitive: 626957, magnet: 764962, destination: 933344 },
    certified_registered_nurse_anesthetist: { redAlert: 211232, competitive: 253479, magnet: 306710, destination: 371119 },
    critical_care_intensivist: { redAlert: 402955, competitive: 464598, magnet: 584010, destination: 734113 },
    dentistry: { redAlert: 158822, competitive: 190587, magnet: 230610, destination: 279038 },
    dermatology: { redAlert: 404686, competitive: 485623, magnet: 586869, destination: 709224 },
    dermatology_dermatopathology: { redAlert: 457701, competitive: 549241, magnet: 661727, destination: 797251 },
    dermatology_mohs_surgery: { redAlert: 692229, competitive: 830675, magnet: 996810, destination: 1196172 },
    dietician_nutritionist: { redAlert: 63667, competitive: 76400, magnet: 92444, destination: 111857 },
    endocrinology_metabolism: { redAlert: 247409, competitive: 296891, magnet: 358543, destination: 432996 },
    family_medicine_sports_medicine: { redAlert: 325075, competitive: 373836, magnet: 471033, destination: 593502 },
    gastroenterology: { redAlert: 514192, competitive: 604589, magnet: 746181, destination: 920934 },
    gastroenterology_hepatology: { redAlert: 355650, competitive: 426780, magnet: 512136, destination: 614563 },
    geriatrics: { redAlert: 264705, competitive: 304411, magnet: 383558, destination: 483283 },
    hematology_oncology: { redAlert: 513605, competitive: 604894, magnet: 745385, destination: 918507 },
    hematology_oncology_oncology_only: { redAlert: 433096, competitive: 519715, magnet: 623658, destination: 748390 },
    hospice_palliative_care: { redAlert: 238333, competitive: 274083, magnet: 345345, destination: 435134 },
    hospitalist_family_medicine: { redAlert: 283999, competitive: 326599, magnet: 411515, destination: 518509 },
    hospitalist_neurology: { redAlert: 320092, competitive: 384110, magnet: 460932, destination: 553118 },
    hospitalist_nocturnist: { redAlert: 335915, competitive: 386302, magnet: 486741, destination: 613293 },
    hospitalist_ob_gyn: { redAlert: 303278, competitive: 363933, magnet: 436720, destination: 524064 },
    hyperbaric_medicine_wound_care: { redAlert: 292992, competitive: 351590, magnet: 425424, destination: 514763 },
    infectious_disease: { redAlert: 258063, competitive: 309676, magnet: 374708, destination: 453397 },
    internal_medicine_ambulatory_only_no_inpatient_work: { redAlert: 272057, competitive: 326468, magnet: 391762, destination: 470114 },
    licensed_clinical_social_worker: { redAlert: 64076, competitive: 76891, magnet: 93038, destination: 112576 },
    nephrology: { redAlert: 310402, competitive: 372482, magnet: 450703, destination: 545351 },
    neurology: { redAlert: 332138, competitive: 394657, magnet: 482179, destination: 589111 },
    neurology_epilepsy_eeg: { redAlert: 271443, competitive: 325732, magnet: 390878, destination: 469054 },
    neurology_neurocritical_care: { redAlert: 359612, competitive: 431535, magnet: 517842, destination: 621410 },
    neurology_neuromuscular_medicine: { redAlert: 201706, competitive: 242047, magnet: 290456, destination: 348548 },
    neurology_stroke_medicine: { redAlert: 343238, competitive: 411885, magnet: 494262, destination: 593114 },
    nurse_midwife: { redAlert: 124565, competitive: 149478, magnet: 180868, destination: 218851 },
    nurse_practitioner_primary_care: { redAlert: 110250, competitive: 132300, magnet: 160083, destination: 193700 },
    nurse_practitioner_surgical: { redAlert: 114725, competitive: 137670, magnet: 166581, destination: 201563 },
    nurse_practitioner_behavioral_medicine: { redAlert: 118908, competitive: 142689, magnet: 172654, destination: 208911 },
    nurse_practitioner_emergency_medicine: { redAlert: 121084, competitive: 145301, magnet: 175814, destination: 212735 },
    nurse_practitioner_family_medicine_without_ob: { redAlert: 113150, competitive: 135780, magnet: 164294, destination: 198795 },
    nurse_practitioner_hospitalist_primary_care: { redAlert: 119886, competitive: 143863, magnet: 174074, destination: 210630 },
    nurse_practitioner_psychiatry: { redAlert: 123049, competitive: 147659, magnet: 178667, destination: 216188 },
    ob_gyn_gynecological_oncology: { redAlert: 451443, competitive: 541147, magnet: 655489, destination: 793992 },
    ob_gyn_gynecology_only: { redAlert: 269431, competitive: 309846, magnet: 390406, destination: 491912 },
    ob_gyn_maternal_and_fetal_medicine: { redAlert: 488487, competitive: 561760, magnet: 707818, destination: 891850 },
    ob_gyn_minimally_invasive_gynecologic_surgery: { redAlert: 340542, competitive: 408209, magnet: 494462, destination: 598940 },
    ob_gyn_reproductive_endocrinology: { redAlert: 554017, competitive: 664102, magnet: 804424, destination: 974396 },
    ob_gyn_urogynecology: { redAlert: 371566, competitive: 445397, magnet: 539508, destination: 653504 },
    occupational_medicine: { redAlert: 274483, competitive: 329380, magnet: 398550, destination: 482245 },
    occupational_therapist: { redAlert: 83608, competitive: 100330, magnet: 121399, destination: 146893 },
    ophthalmology: { redAlert: 388932, competitive: 466719, magnet: 564730, destination: 683323 },
    optometrist: { redAlert: 146415, competitive: 175698, magnet: 212595, destination: 257239 },
    orthopedic_surgery_foot_and_ankle: { redAlert: 633461, competitive: 749582, magnet: 919504, destination: 1127945 },
    orthopedic_surgery_general: { redAlert: 613075, competitive: 725459, magnet: 889913, destination: 1091646 },
    orthopedic_surgery_hand: { redAlert: 616331, competitive: 729311, magnet: 894638, destination: 1097442 },
    orthopedic_surgery_hip_and_joint: { redAlert: 746321, competitive: 884596, magnet: 1083386, destination: 1326849 },
    orthopedic_surgery_oncology: { redAlert: 466337, competitive: 552738, magnet: 676951, destination: 829079 },
    orthopedic_surgery_shoulder_elbow: { redAlert: 639910, competitive: 758470, magnet: 928916, destination: 1137666 },
    orthopedic_surgery_spine: { redAlert: 769771, competitive: 910879, magnet: 1117365, destination: 1370659 },
    orthopedic_surgery_sports_medicine: { redAlert: 555042, competitive: 638298, magnet: 804255, destination: 1013362 },
    orthopedic_surgery_trauma: { redAlert: 691023, competitive: 817695, magnet: 1003057, destination: 1230439 },
    otorhinolaryngology: { redAlert: 440754, competitive: 528905, magnet: 639975, destination: 774370 },
    pain_management_nonanesthesia: { redAlert: 435431, competitive: 500746, magnet: 630940, destination: 794984 },
    pathology_anatomic: { redAlert: 324429, competitive: 389315, magnet: 471071, destination: 569996 },
    pathology_anatomic_and_clinical: { redAlert: 335017, competitive: 402020, magnet: 486444, destination: 588597 },
    pathology_clinical: { redAlert: 323602, competitive: 388322, magnet: 469870, destination: 568542 },
    pathology_surgical: { redAlert: 344988, competitive: 413985, magnet: 500922, destination: 606115 },
    pediatrics_adolescent_medicine: { redAlert: 210435, competitive: 252522, magnet: 303026, destination: 363632 },
    pediatrics_allergy_immunology: { redAlert: 218366, competitive: 262039, magnet: 314447, destination: 377336 },
    pediatrics_anesthesiology: { redAlert: 468245, competitive: 561894, magnet: 674273, destination: 809127 },
    pediatrics_cardiology: { redAlert: 304496, competitive: 365395, magnet: 438474, destination: 526169 },
    pediatrics_child_development: { redAlert: 183282, competitive: 219938, magnet: 263926, destination: 316711 },
    pediatrics_critical_care_intensivist: { redAlert: 285650, competitive: 342780, magnet: 411336, destination: 493603 },
    pediatrics_emergency_medicine: { redAlert: 277149, competitive: 332579, magnet: 399095, destination: 478914 },
    pediatrics_endocrinology: { redAlert: 210673, competitive: 242274, magnet: 305265, destination: 384634 },
    pediatrics_gastroenterology: { redAlert: 259528, competitive: 311433, magnet: 373720, destination: 448464 },
    pediatrics_genetics: { redAlert: 228188, competitive: 273826, magnet: 328591, destination: 394309 },
    pediatrics_hematology_oncology: { redAlert: 225851, competitive: 271021, magnet: 325225, destination: 390270 },
    pediatrics_hospitalist: { redAlert: 203470, competitive: 244164, magnet: 292997, destination: 351596 },
    pediatrics_hospitalist_internal_medicine: { redAlert: 202052, competitive: 238683, magnet: 293272, destination: 360345 },
    pediatrics_infectious_disease: { redAlert: 181516, competitive: 217819, magnet: 261383, destination: 313659 },
    pediatrics_internal_medicine: { redAlert: 276524, competitive: 319995, magnet: 400888, destination: 502230 },
    pediatrics_neonatal_medicine: { redAlert: 310854, competitive: 364388, magnet: 451034, destination: 558284 },
    pediatrics_nephrology: { redAlert: 224854, competitive: 269825, magnet: 323790, destination: 388548 },
    pediatrics_neurology: { redAlert: 257994, competitive: 309593, magnet: 371512, destination: 445814 },
    pediatrics_neurosurgery: { redAlert: 652878, competitive: 783454, magnet: 940145, destination: 1128174 },
    pediatrics_ophthalmology: { redAlert: 385461, competitive: 462553, magnet: 555064, destination: 666076 },
    pediatrics_orthopedic_surgery: { redAlert: 446966, competitive: 536359, magnet: 645404, destination: 776619 },
    pediatrics_otorhinolaryngology: { redAlert: 432138, competitive: 516854, magnet: 627440, destination: 761687 },
    pediatrics_pulmonology: { redAlert: 232043, competitive: 278452, magnet: 334142, destination: 400971 },
    pediatrics_radiology: { redAlert: 511291, competitive: 613549, magnet: 736259, destination: 883511 },
    pediatrics_rheumatology: { redAlert: 196676, competitive: 236011, magnet: 283213, destination: 339856 },
    pediatrics_surgery: { redAlert: 522605, competitive: 627126, magnet: 753091, destination: 904358 },
    pediatrics_urology: { redAlert: 563626, competitive: 674512, magnet: 818361, destination: 992887 },
    physiatry_physical_medicine_and_rehabilitation: { redAlert: 306348, competitive: 367617, magnet: 441140, destination: 529368 },
    physical_therapist: { redAlert: 85633, competitive: 102760, magnet: 124340, destination: 150451 },
    physician_assistant_primary_care: { redAlert: 117987, competitive: 141584, magnet: 171317, destination: 207293 },
    physician_assistant_surgical: { redAlert: 111909, competitive: 134291, magnet: 162492, destination: 196615 },
    physician_assistant_anesthesiology: { redAlert: 101165, competitive: 121398, magnet: 146892, destination: 177739 },
    physician_assistant_family_medicine_without_ob: { redAlert: 106562, competitive: 127874, magnet: 154728, destination: 187220 },
    physician_assistant_hospitalist_primary_care: { redAlert: 111390, competitive: 133668, magnet: 161738, destination: 195703 },
    physician_assistant_orthopedics_surgical: { redAlert: 110223, competitive: 132268, magnet: 160044, destination: 193654 },
    physician_assistant_psychiatry: { redAlert: 121488, competitive: 145786, magnet: 176401, destination: 213445 },
    podiatry_general: { redAlert: 207249, competitive: 248699, magnet: 300926, destination: 364120 },
    podiatry_surgery: { redAlert: 287688, competitive: 345225, magnet: 417722, destination: 505444 },
    psychiatry_addiction_medicine: { redAlert: 279316, competitive: 321213, magnet: 404728, destination: 509958 },
    psychiatry_behavioral_medicine: { redAlert: 112797, competitive: 135356, magnet: 163167, destination: 196692 },
    psychiatry_child_and_adolescent: { redAlert: 284460, competitive: 330816, magnet: 412541, destination: 514455 },
    psychologist: { redAlert: 110490, competitive: 132588, magnet: 160431, destination: 194122 },
    pulmonary_medicine_critical_care: { redAlert: 405659, competitive: 486791, magnet: 587127, destination: 708144 },
    pulmonary_medicine_general: { redAlert: 360319, competitive: 418236, magnet: 522486, destination: 652723 },
    pulmonary_medicine_general_and_critical_care: { redAlert: 429259, competitive: 515111, magnet: 621284, destination: 749341 },
    radiation_oncology: { redAlert: 533771, competitive: 613837, magnet: 773435, destination: 974528 },
    radiology_diagnostic: { redAlert: 491952, competitive: 590342, magnet: 714086, destination: 863768 },
    radiology_interventional: { redAlert: 551877, competitive: 634658, magnet: 799669, destination: 1007583 },
    radiology_neurological: { redAlert: 486175, competitive: 583410, magnet: 703065, destination: 847262 },
    radiology_nuclear_medicine: { redAlert: 425170, competitive: 488945, magnet: 616071, destination: 776249 },
    rheumatology: { redAlert: 252408, competitive: 302889, magnet: 366496, destination: 443460 },
    sleep_medicine: { redAlert: 301564, competitive: 361877, magnet: 437871, destination: 529824 },
    surgery_bariatric: { redAlert: 462525, competitive: 552966, magnet: 671556, destination: 815580 },
    surgery_breast: { redAlert: 364603, competitive: 435897, magnet: 529380, destination: 642912 },
    surgery_cardiothoracic: { redAlert: 846249, competitive: 973186, magnet: 1226214, destination: 1545030 },
    surgery_cardiovascular: { redAlert: 959457, competitive: 1103376, magnet: 1390254, destination: 1751720 },
    surgery_colon_and_rectal: { redAlert: 428523, competitive: 492802, magnet: 620931, destination: 782372 },
    surgery_endocrine: { redAlert: 265268, competitive: 318321, magnet: 383925, destination: 463051 },
    surgery_neurological: { redAlert: 796421, competitive: 915884, magnet: 1154014, destination: 1454057 },
    surgery_oncology: { redAlert: 421943, competitive: 506332, magnet: 610685, destination: 736544 },
    surgery_oral: { redAlert: 416362, competitive: 499635, magnet: 599562, destination: 719474 },
    surgery_plastic_and_reconstruction: { redAlert: 512937, competitive: 589878, magnet: 743246, destination: 936490 },
    surgery_thoracic_primary: { redAlert: 651919, competitive: 749707, magnet: 944631, destination: 1190235 },
    surgery_transplant: { redAlert: 415735, competitive: 498882, magnet: 598658, destination: 718390 },
    surgery_transplant_heart: { redAlert: 545870, competitive: 655044, magnet: 786053, destination: 943263 },
    surgery_trauma: { redAlert: 421758, competitive: 485022, magnet: 611128, destination: 770021 },
    surgery_trauma_burn: { redAlert: 511917, competitive: 614300, magnet: 740904, destination: 893601 },
    surgery_vascular_primary: { redAlert: 522191, competitive: 600520, magnet: 756655, destination: 953386 },
    surgical_specialist_physician_rollup: { redAlert: 495999, competitive: 595199, magnet: 720191, destination: 871431 },
    urology: { redAlert: 513225, competitive: 601544, magnet: 744659, destination: 921823 },
    dental_hygienist: { redAlert: 81750, competitive: 98100, magnet: 118701, destination: 143628 },
    orthodontics: { redAlert: 240950, competitive: 289140, magnet: 349859, destination: 423330 },
    endodontics: { redAlert: 212486, competitive: 254983, magnet: 308529, destination: 373321 },
    periodontics: { redAlert: 187492, competitive: 224990, magnet: 272238, destination: 329408 },
    pediatric_dentistry: { redAlert: 187492, competitive: 224990, magnet: 272238, destination: 329408 },
    prosthodontics: { redAlert: 259317, competitive: 311180, magnet: 376528, destination: 455599 },
    oral_maxillofacial_surgery: { redAlert: 244386, competitive: 293263, magnet: 354848, destination: 429366 },
    speech_language_pathologist: { redAlert: 81558, competitive: 97870, magnet: 118423, destination: 143291 },
    radiologic_technologist: { redAlert: 66758, competitive: 80110, magnet: 96933, destination: 117289 },
    mri_technologist: { redAlert: 79567, competitive: 95480, magnet: 115531, destination: 139792 },
    ct_technologist: { redAlert: 66758, competitive: 80110, magnet: 96933, destination: 117289 },
    diagnostic_medical_sonographer: { redAlert: 80492, competitive: 96590, magnet: 116874, destination: 141417 },
    respiratory_therapist: { redAlert: 68567, competitive: 82280, magnet: 99559, destination: 120466 },
    surgical_technologist: { redAlert: 53875, competitive: 64650, magnet: 78226, destination: 94654 },
    cardiovascular_technologist: { redAlert: 61925, competitive: 74310, magnet: 89915, destination: 108797 },
    nuclear_medicine_technologist: { redAlert: 84475, competitive: 101370, magnet: 122658, destination: 148416 },
    medical_laboratory_scientist: { redAlert: 52442, competitive: 62930, magnet: 76145, destination: 92136 },
    audiologist: { redAlert: 79817, competitive: 95780, magnet: 115894, destination: 140231 }
  };
  list.forEach(function (s) {
    var b = CORE[s.key];
    if (b && !(s.ampBands && s.ampBands.competitive != null)) { s.ampBands = b; s.ampBandsNote = "AMP bands from internal MI (same method)"; }
  });
  MI.AMP33 = { added: added, updated: updated, keys: Object.keys(COMP) };
})(window);
