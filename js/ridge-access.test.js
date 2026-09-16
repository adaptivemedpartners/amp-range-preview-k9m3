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
var seat = api.startDemo({ specialty: "family_medicine_without_ob", state: "TX" });
assert(seat.tier === "demo", "demo tier");
assert(api.trySpecialty("family_medicine_without_ob").ok, "demo same spec ok");
assert(!api.trySpecialty("ob_gyn_general").ok, "demo other spec locked");
assert(api.lastDenial().reason === "verify", "demo denial is verify");
assert(api.tryState("tx").ok, "demo TX ok");
assert(!api.tryState("ca").ok, "demo CA locked");
assert(api.lastDenial().reason === "verify", "demo out-of-state is verify, not geo");

var bad = api.verify({ name: "Pat", org: "Clinic", email: "pat@gmail.com", phone: "555" });
assert(!bad.ok && bad.reason === "work_email", "gmail rejected");
var ok = api.verify({ name: "Pat", org: "Clinic", email: "pat@ruralhealth.org", phone: "555" });
assert(ok.ok && ok.seat.tier === "verified", "work email verifies");
assert(api.trySpecialty("ob_gyn_general").ok, "verified taste 2");
assert(api.trySpecialty("emergency_medicine").ok, "verified taste 3");
assert(!api.trySpecialty("cardiology_noninvasive").ok, "verified 4th is paywall");
assert(api.lastDenial().reason === "paywall", "paywall reason");

api.applyPaid({ sku: "state", state: "TX" });
assert(api.isPaid(), "state plan paid");
assert(api.pollLimit() === 15, "15 polls");
assert(api.tryState("tx").ok, "paid TX poll");
assert(!api.tryState("ca").ok, "state plan CA geo locked");
assert(api.lastDenial().reason === "geo", "geo reason");

api.applyPaid({ sku: "region", region: "southwest" });
var az = api.tryState("az");
assert(az.ok, "region AZ ok: " + (az.reason || ""));
assert(api.pollsUsed() >= 1, "at least the TX poll remains");
assert(api.pollLimit() === 30, "region 30 polls");

api.applyPaid({ sku: "extra_poll" });
assert(api.pollLimit() === 31, "region 30 + extra");

api.applyPaid({ sku: "national" });
assert(api.canState("me"), "national ME open");

api.applyPaid({ sku: "oneoff", specialty: "dermatology", state: "WA" });
assert(api.canCombo("dermatology", "wa"), "one-off combo");

console.log("ridge-access.test.js ok");
