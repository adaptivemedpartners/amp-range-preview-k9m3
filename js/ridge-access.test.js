/* Node smoke for Ridge V1 access stairs. Run: node js/ridge-access.test.js */
var fs = require("fs");
var vm = require("vm");
var path = require("path");

var store = {};
var localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};

var sandbox = {
  window: {},
  localStorage: localStorage,
  console: console,
  URLSearchParams: URLSearchParams
};
sandbox.window = sandbox;
sandbox.window.location = { search: "", href: "http://127.0.0.1/ridge" };

vm.runInNewContext(fs.readFileSync(path.join(__dirname, "ridge-access.js"), "utf8"), sandbox);
var api = sandbox.window.AMPRidgeAccess;
if (!api) throw new Error("AMPRidgeAccess missing");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

store = {};
api.reset();
assert(api.STORAGE_KEY === "amp_ridge_seat_v3", "seat key bumped so leftover Extra chrome dies");
var fresh = api.getSeat();
assert(!fresh.demoCommitted, "fresh seat uncommitted");
assert(!fresh.demoSpecialty, "no default specialty");
assert(!fresh.demoState, "no default state");
assert(!api.isDemoCommitted(), "walkthrough required before preview");
assert(!api.startDemo({}).demoCommitted, "empty startDemo does not commit");
assert(!api.startDemo({ specialty: "family_medicine_without_ob" }).demoCommitted, "specialty-only does not commit");
assert(!api.trySpecialty("family_medicine_without_ob").ok, "specialty locked before commit");
assert(api.lastDenial().reason === "walkthrough", "pre-commit denial is walkthrough");
assert(!api.tryState("tx").ok, "state locked before commit");

var seat = api.startDemo({ specialty: "family_medicine_without_ob", state: "TX" });
assert(seat.tier === "demo", "demo tier");
assert(seat.demoCommitted, "both picks commit the 1×1");
assert(api.isDemoCommitted(), "committed after specialty + state");
assert(api.trySpecialty("family_medicine_without_ob").ok, "demo same spec ok");
assert(!api.trySpecialty("ob_gyn_general").ok, "demo other spec locked");
assert(api.lastDenial().reason === "verify", "demo denial is verify");
assert(api.tryState("tx").ok, "demo TX ok");
assert(!api.tryState("ca").ok, "demo CA locked");
assert(api.lastDenial().reason === "verify", "demo out-of-state is verify, not geo");
assert(api.oneStateUnit() === "tx", "demo forced unit is TX");
assert(api.allowsPeek("tx"), "demo may peek TX");
assert(!api.allowsPeek("co"), "demo may not peek CO");
assert(!api.allowsMulti(), "demo has no multi-select");

var bad = api.verify({ name: "Pat", org: "Clinic", email: "pat@gmail.com", phone: "555" });
assert(!bad.ok && bad.reason === "work_email", "gmail rejected");
var ok = api.verify({ name: "Pat", org: "Clinic", email: "pat@ruralhealth.org", phone: "555" });
assert(ok.ok && ok.seat.tier === "verified", "work email verifies");
assert(api.oneStateUnit() === "tx", "verified still one-state TX");
assert(!api.allowsPeek("co"), "verified may not peek other states");
assert(!api.allowsMulti(), "verified has no multi-select");
assert(api.trySpecialty("ob_gyn_general").ok, "verified taste 2");
assert(api.trySpecialty("emergency_medicine").ok, "verified taste 3");
assert(!api.trySpecialty("cardiology_noninvasive").ok, "verified 4th is paywall");
assert(api.lastDenial().reason === "paywall", "paywall reason");
assert(!api.isPaid(), "verified is not a paid plan");
assert(!api.canGrantExtraPoll(), "verified cannot grant Extra $9");
assert(!api.canBuyExtraPoll(), "verified cannot buy Extra $9");
var blockedExtra = api.applyPaid({ sku: "extra_poll" });
assert((Number(blockedExtra.extraPolls) || 0) === 0, "verified Extra $9 does not increment");
assert(api.pollLimit() === 0, "verified has no poll allotment");
assert(String(api.tierCopy().body).indexOf("49") !== -1, "verified paywall offers $49 one-off");
assert(String(api.tierCopy().body).toLowerCase().indexOf("extra") !== -1, "verified copy says Extra is not this stair");

store = {};
api.reset();
api.startDemo({ specialty: "family_medicine_without_ob", state: "TX" });
var sim = api.simulateVerify();
assert(sim.ok && sim.seat.tier === "verified", "simulate verify grants verified");
assert(api.tasteSpecialties().length === 1, "simulate starts with demo taste");
assert(api.trySpecialty("ob_gyn_general").ok, "simulate taste 2");
assert(api.trySpecialty("emergency_medicine").ok, "simulate taste 3");
assert(!api.trySpecialty("cardiology_noninvasive").ok, "simulate 4th is paywall");
assert(!api.allowsMulti(), "verified still no multi-state");
assert(api.oneStateUnit() === "tx", "verified stays in committed state");
assert(!api.canGrantExtraPoll(), "simulate-verified cannot grant Extra $9");
api.applyPaid({ sku: "extra_poll" });
assert((Number(api.getSeat().extraPolls) || 0) === 0, "simulate Extra before paid is a no-op");

api.applyPaid({ sku: "state", state: "TX" });
assert(api.isPaid(), "state plan paid");
assert(api.pollLimit() === 15, "15 polls");
assert(api.pollsUsed() >= 1, "current 1×1 seeded as first poll");
assert(api.tryState("tx").ok, "paid TX poll");
assert(api.pollsUsed() === 1, "revisit TX is free");
assert(api.trySpecialty("dermatology").ok, "new specialty in TX burns a poll");
assert(api.pollsUsed() === 2, "second unit consumed");
assert(api.openUnits().length === 2, "open-unit chips = spent polls");
assert(String(api.tierCopy().title).indexOf("left this month") !== -1, "HUD says left this month");
assert(!api.tryState("ca").ok, "state plan CA geo locked");
assert(api.lastDenial().reason === "geo", "geo reason");
assert(api.oneStateUnit() === "tx", "state plan forced unit is TX");
assert(!api.allowsMulti(), "state plan has no multi-select");
assert(api.canGrantExtraPoll(), "paid state can simulate Extra");
assert(!api.canBuyExtraPoll(), "Extra $9 CTA stays dark while allotment remains");

api.applyPaid({ sku: "region", region: "southwest" });
var az = api.tryState("az");
assert(az.ok, "region AZ ok: " + (az.reason || ""));
assert(api.pollsUsed() >= 1, "at least the TX poll remains");
assert(api.pollLimit() === 30, "region 30 polls");
assert(!api.oneStateUnit(), "region is not a single forced unit");
assert(api.allowsMulti(), "region allows multi-select");

assert(api.canGrantExtraPoll(), "paid region can simulate Extra");
api.applyPaid({ sku: "extra_poll" });
assert(api.pollLimit() === 31, "region 30 + extra");
assert(api.getSeat().tier === "region", "Extra $9 does not replace a paid plan");

api.applyPaid({ sku: "national" });
assert(api.canState("me"), "national ME open");

api.applyPaid({ sku: "oneoff", specialty: "dermatology", state: "WA" });
assert(api.canCombo("dermatology", "wa"), "one-off combo");

store = {};
var leftover = api.reset();
leftover.tier = "region";
leftover.paidRegion = "southwest";
leftover.polls = [{ specialty: "family_medicine_without_ob", state: "tx" }];
leftover.grantedByCheckout = false;
leftover.demoCommitted = true;
leftover.demoState = "tx";
leftover.demoSpecialty = "family_medicine_without_ob";
api.save(leftover);
var demoted = api.getSeat();
assert(demoted.tier === "demo", "fake Region seat without Checkout is demoted to demo");
assert(!api.isPaid(demoted), "demoted seat is not paid");
assert(String(api.tierCopy(demoted).tag).indexOf("149") === -1, "chrome is not Region $149");
assert(String(api.tierCopy(demoted).title).indexOf("of 30") === -1, "no 30-poll meter on demo");

store = {};
var noPromo = api.reset();
assert(noPromo.tier === "demo", "fresh seat is demo");
assert(!noPromo.grantedByCheckout, "no checkout grant on fresh seat");
assert(!api.isPaid(noPromo), "fresh seat is not paid");
assert(!api.canGrantExtraPoll(noPromo), "fresh seat cannot Extra $9");
assert(!api.canBuyExtraPoll(noPromo), "fresh seat Extra CTA hidden");

store = {};
api.reset();
assert(api.STORAGE_KEY === "amp_ridge_seat_v3", "seat key bumped so leftover Extra chrome dies");
var stale = api.getSeat();
stale.tier = "verified";
stale.extraPolls = 12;
stale.demoCommitted = true;
stale.demoState = "tx";
stale.demoSpecialty = "family_medicine_without_ob";
stale.seat = { email: "pat@ruralhealth.org", org: "Clinic" };
api.save(stale);
var cleaned = api.getSeat();
assert((Number(cleaned.extraPolls) || 0) === 0, "verified leftover extraPolls stripped");
assert(!api.canBuyExtraPoll(cleaned), "stale verified Extra CTA stays hidden");

store = {};
api.reset();
api.startDemo({ specialty: "family_medicine_without_ob", state: "TX" });
assert(!api.canGrantExtraPoll(), "demo cannot Extra $9");
api.applyPaid({ sku: "extra_poll" });
assert((Number(api.getSeat().extraPolls) || 0) === 0, "demo Extra $9 is a no-op");

store = {};
api.reset();
api.startDemo({ specialty: "family_medicine_without_ob", state: "TX" });
api.applyPaid({ sku: "state", state: "TX" });
var i;
for (i = 0; i < 20 && api.pollsLeft() > 0; i++) {
  api.trySpecialty("dermatology_" + i);
}
assert(api.pollsLeft() === 0, "allotment exhausted");
assert(api.canBuyExtraPoll(), "Extra $9 CTA after paid allotment is used");
api.applyPaid({ sku: "extra_poll" });
assert(api.pollLimit() === 16, "state 15 + extra after 0");
assert(api.pollsLeft() === 1, "extra poll restores one open");

console.log("ridge-access.test.js ok");
