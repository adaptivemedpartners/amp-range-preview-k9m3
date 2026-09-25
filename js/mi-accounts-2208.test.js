// 2208: server-backed seat mirrors purchases/polls; accounts-off path unchanged.
const fs = require("fs"), vm = require("vm");
function assert(c, m) { if (!c) throw new Error(m); }
function boot(accounts) {
  const store = {};
  const w = { location: { search: "", pathname: "/" }, history: { replaceState() {} },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
  w.window = w; w.localStorage = w.localStorage;
  if (accounts) w.AMPMiAccounts = { enabled: true, usePoll: () => Promise.resolve({ ok: true }), syncSeat() {} };
  vm.createContext(w); w.localStorage = w.localStorage;
  vm.runInContext("var localStorage = window.localStorage;" + fs.readFileSync(__dirname + "/ridge-access.js", "utf8"), w);
  return w;
}
let w = boot(true), api = w.AMPRidgeAccess;
assert(api.applyServerSeat, "exports applyServerSeat");
let seat = api.applyServerSeat({ purchases: [{ sku: "pack15", polls_granted: 15 }, { sku: "extra_poll", polls_granted: 1 }, { sku: "oneoff", polls_granted: 0, specialty: "fm", state: "tx" }], polls: [{ specialty: "fm", state: "tx" }] });
assert(api.isPaid(seat), "paid after server package");
assert(api.pollLimit(seat) === 16, "15 + extra = 16, got " + api.pollLimit(seat));
assert(api.pollsLeft(seat) === 15, "one used, 15 left, got " + api.pollsLeft(seat));
assert(seat.oneOffs.length === 1, "one-off report mirrored");
w.location.search = "?ridge_checkout=success&ridge_sku=pack250&session_id=cs_live_x";
assert(api.consumeCheckoutQuery() === null, "accounts on: URL alone never unlocks");
seat = api.applyServerSeat({ purchases: [], polls: [] });
assert(!api.isPaid(seat), "no server purchases = not paid");
const src = fs.readFileSync(__dirname + "/app.js", "utf8");
assert(/AMPMiAccounts\.requireAccount\(goStripe\)/.test(src), "checkout requires account when accounts on");
const cfg = fs.readFileSync(__dirname + "/mi-accounts-config.js", "utf8");
assert(/url: ""/.test(cfg), "accounts stay off until the customer project exists");
console.log("mi-accounts-2208 ok");
