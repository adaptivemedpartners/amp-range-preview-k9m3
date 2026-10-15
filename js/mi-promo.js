/* 2311: Market Intelligence promo codes (free sample polls, no card).
   Recipient: signs in with the email the code was issued to, enters the code, picks ONE state.
   They then get 5, 7 or 9 free specialty polls in that state. Counts live on the server (mi-promo function). */
(function (w, d) {
  "use strict";
  var promo = null;
  var STATES = "AL Alabama|AK Alaska|AZ Arizona|AR Arkansas|CA California|CO Colorado|CT Connecticut|DE Delaware|DC District of Columbia|FL Florida|GA Georgia|HI Hawaii|ID Idaho|IL Illinois|IN Indiana|IA Iowa|KS Kansas|KY Kentucky|LA Louisiana|ME Maine|MD Maryland|MA Massachusetts|MI Michigan|MN Minnesota|MS Mississippi|MO Missouri|MT Montana|NE Nebraska|NV Nevada|NH New Hampshire|NJ New Jersey|NM New Mexico|NY New York|NC North Carolina|ND North Dakota|OH Ohio|OK Oklahoma|OR Oregon|PA Pennsylvania|RI Rhode Island|SC South Carolina|SD South Dakota|TN Tennessee|TX Texas|UT Utah|VT Vermont|VA Virginia|WA Washington|WV West Virginia|WI Wisconsin|WY Wyoming"
    .split("|").map(function (x) { return [x.slice(0, 2), x.slice(3)]; });
  function acc() { return w.AMPMiAccounts && w.AMPMiAccounts.enabled ? w.AMPMiAccounts : null; }
  function stLabel(k) {
    k = String(k || "").toUpperCase();
    for (var i = 0; i < STATES.length; i++) if (STATES[i][0] === k) return STATES[i][1];
    return k;
  }
  function toast(t) { var e = d.getElementById("mi-lite-mock-toast"); if (e) { e.textContent = t; e.hidden = false; setTimeout(function () { e.hidden = true; }, 5000); } }
  function go(route) { var a = d.createElement("a"); a.setAttribute("data-go", route); a.href = "#"; a.style.display = "none"; d.body.appendChild(a); a.click(); a.remove(); }
  var ERR = {
    code_not_valid_for_this_email: "That code isn't valid for this email. Sign in with the email address the code was sent to.",
    code_expired: "That code has expired. Contact us for a new one.", code_revoked: "That code is no longer active. Contact us for a new one.",
    code_already_used: "That code was already used.", already_has_promo: "This account already has a promo code.",
    bad_code: "Please check the code. It looks like AMP-XXXX-XXXX-XXXX.", pick_state: "Please pick the state for your free polls.",
    confirm_email_first: "Please confirm your email first (check your inbox)."
  };

  function apply(p) {
    promo = p || null;
    var api = w.AMPRidgeAccess; if (api && api.applyPromo) { try { api.applyPromo(promo); } catch (e) {} }
    try { var a0 = acc(); if (a0 && a0.user() && w.AMPMiAccounts.syncSeat && !apply._busy) { apply._busy = true; w.AMPMiAccounts.syncSeat().then(function () { apply._busy = false; bar(); }, function () { apply._busy = false; }); } } catch (e1) {}
    bar();
    if (w.AMPRidgeWorkbench && w.AMPRidgeWorkbench.refresh) { try { w.AMPRidgeWorkbench.refresh(); } catch (e2) {} }
  }
  function refresh() {
    var a = acc(); if (!a || !a.user()) { promo = null; bar(); return; }
    a.promo({ action: "status" }).then(function (r) { if (r && !r.error) apply(r.promo); });
  }

  function bar() {
    var host = d.getElementById("mi-acct-bar"); if (!host) return;
    var el = d.getElementById("mi-promo-line");
    if (!el) { el = d.createElement("div"); el.id = "mi-promo-line"; el.style.cssText = "flex-basis:100%;font:500 14px/1.4 Inter,system-ui,sans-serif"; host.appendChild(el); }
    else if (el.parentNode !== host) host.appendChild(el);
    el.innerHTML = "";
    var a = acc();
    if (promo && !promo.expired && !promo.revoked) {
      var s = d.createElement("strong");
      s.textContent = "Promo code: " + promo.left + " of " + promo.allowance + " free polls left in " + stLabel(promo.state) + ".";
      el.appendChild(s);
      el.appendChild(d.createTextNode(promo.left ? " Each poll opens one specialty in " + stLabel(promo.state) + "." : " Your free polls are used. "));
      if (!promo.left) { var b = d.createElement("a"); b.href = "#"; b.textContent = "Buy polls or a $99 report"; b.style.cssText = "text-decoration:underline;color:inherit;font-weight:600";
        b.onclick = function (e) { e.preventDefault(); go("mi-lite-portal"); }; el.appendChild(b); }
      return;
    }
    var link = d.createElement("a"); link.href = "#"; link.id = "mi-promo-open"; link.textContent = "Have a promo code?";
    link.style.cssText = "text-decoration:underline;color:inherit;font-weight:600";
    link.onclick = function (e) { e.preventDefault(); open(); };
    el.appendChild(link);
    if (!a || !a.user()) el.appendChild(d.createTextNode(" Create an account with the email the code was sent to, then enter it."));
  }

  function open(prefill) {
    var a = acc(); if (!a) return;
    a.requireAccount(function () { dialog(prefill); });
  }
  function dialog(prefill) {
    var old = d.getElementById("mi-promo-modal"); if (old) old.remove();
    var wrap = d.createElement("div"); wrap.id = "mi-promo-modal"; wrap.className = "mi-acct-modal"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true");
    wrap.innerHTML = '<div class="mi-acct-card"><button type="button" class="mi-acct-x" aria-label="Close">×</button><h2>Redeem your promo code</h2>' +
      '<p class="mi-acct-sub">Free polls, no card needed. Pick the one state you want. Each poll opens one specialty in that state.</p>' +
      '<form novalidate><label for="mi-promo-code">Promo code</label><input id="mi-promo-code" autocomplete="off" placeholder="AMP-XXXX-XXXX-XXXX" required>' +
      '<label for="mi-promo-state">State</label><select id="mi-promo-state" required style="width:100%;padding:10px;border:1px solid #cfd6dd;border-radius:8px;font-size:15px"></select>' +
      '<button type="submit">Redeem code</button></form><p class="mi-acct-msg" role="status"></p>' +
      '<p class="mi-acct-sub" style="margin-top:10px;font-size:13px">Signed in as <span id="mi-promo-email"></span>. The code only works for the email it was sent to.</p></div>';
    d.body.appendChild(wrap);
    wrap.querySelector("#mi-promo-email").textContent = (acc().user() || {}).email || "";
    var sel = wrap.querySelector("#mi-promo-state");
    sel.innerHTML = '<option value="">Choose a state</option>';
    STATES.forEach(function (st) { var o = d.createElement("option"); o.value = st[0].toLowerCase(); o.textContent = st[1]; sel.appendChild(o); });
    var code = wrap.querySelector("#mi-promo-code"); code.value = prefill || "";
    var msg = wrap.querySelector(".mi-acct-msg");
    var close = function () { wrap.remove(); };
    wrap.querySelector(".mi-acct-x").onclick = close;
    wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    wrap.querySelector("form").onsubmit = function (e) {
      e.preventDefault();
      var btn = wrap.querySelector("button[type=submit]"); btn.disabled = true; msg.className = "mi-acct-msg"; msg.textContent = "Checking…";
      acc().promo({ action: "redeem", code: code.value, state: sel.value }).then(function (r) {
        btn.disabled = false;
        if (!r || r.error) { msg.className = "mi-acct-msg err"; msg.textContent = ERR[r && r.error] || "That didn't work. Please try again."; if (r && r.promo) apply(r.promo); return; }
        apply(r.promo); close();
        toast("Code redeemed: " + r.promo.allowance + " free polls in " + stLabel(r.promo.state) + ".");
      });
    };
    (prefill ? sel : code).focus();
  }

  w.AMPMiPromo = { apply: apply, open: open, refresh: refresh, get: function () { return promo; } };
  function boot() {
    var a = acc(); if (!a) return;
    a.onChange(function () { setTimeout(refresh, 400); });
    a.init().then(function () {
      refresh();
      var p = new URLSearchParams(w.location.search || "").get("promo");
      if (p) open(p);
    });
    setInterval(function () { if (!d.getElementById("mi-promo-line")) bar(); }, 1500);
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();
})(window, document);
