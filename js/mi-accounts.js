/* MI customer accounts: create account, sign in, forgot/reset password, server-verified purchases and polls.
   Loads supabase-js only when js/mi-accounts-config.js has a url. */
(function (w, d) {
  "use strict";
  var cfg = w.AMP_MI_ACCOUNTS || {};
  var enabled = !!(cfg.url && cfg.anonKey);
  var sb = null, user = null, ready = null, listeners = [], lastSeat = null;
  /* 2219: came back from the confirmation email (hash from Supabase, or our ?welcome=1). Read before supabase-js strips the hash. */
  var fromConfirm = /type=(signup|email)/.test(w.location.hash || "") || new URLSearchParams(w.location.search || "").get("welcome") === "1";
  var PACK_LABEL = { pack15: "15-poll package", pack50: "50-poll package", pack100: "100-poll package", pack250: "250-poll package" };
  function ra() { return w.AMPRidgeAccess || null; }
  /* The free-sample market this browser picked (specialty key + state code), if any. */
  function localSample() {
    var api = ra(), seat = api && api.load ? api.load() : null;
    return seat && seat.demoSpecialty && seat.demoState ? { spec: seat.demoSpecialty, st: String(seat.demoState).toUpperCase() } : null;
  }
  function accountSample() {
    var pr = lastSeat && lastSeat.profile;
    if (pr && pr.sample_specialty && pr.sample_state) return { spec: pr.sample_specialty, st: String(pr.sample_state).toUpperCase() };
    var meta = (user && user.user_metadata) || {};
    if (meta.sample_specialty && meta.sample_state) return { spec: meta.sample_specialty, st: String(meta.sample_state).toUpperCase() };
    return localSample();
  }
  /* Plain-English description of the free Verified sample. */
  function sampleText(smp) {
    if (smp) { var st = stateLabel(smp.st).replace(/\s*\([A-Z]{2}\)\s*$/, ""); return specLabel(smp.spec) + " in " + st + ", plus 2 more specialties in " + st; }
    return "1 specialty in 1 state of your choice, plus 2 more specialties in that state";
  }

  function fnUrl(name) { return cfg.url.replace(/\/$/, "") + "/functions/v1/" + name; }
  function emit() { listeners.forEach(function (f) { try { f(user); } catch (e) {} }); }

  function loadLib() {
    if (w.supabase && w.supabase.createClient) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = d.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
      s.onload = res; s.onerror = rej; d.head.appendChild(s);
    });
  }

  function init() {
    if (!enabled) return Promise.resolve(null);
    if (ready) return ready;
    ready = loadLib().then(function () {
      sb = w.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
      sb.auth.onAuthStateChange(function (evt, session) {
        user = session ? session.user : null;
        if (evt === "PASSWORD_RECOVERY") openModal("reset");
        emit();
        if (user) (evt === "SIGNED_IN" ? ensureProfile(user).catch(function () {}) : Promise.resolve()).then(syncSeat);
      });
      return sb.auth.getSession().then(function (r) {
        user = r.data.session ? r.data.session.user : null;
        emit();
        return user;
      });
    });
    return ready;
  }

  function call(name, body) {
    return sb.auth.getSession().then(function (r) {
      var tok = r.data.session && r.data.session.access_token;
      if (!tok) return { error: "sign_in_required" };
      return fetch(fnUrl(name), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok, apikey: cfg.anonKey },
        body: JSON.stringify(body || {})
      }).then(function (res) { return res.json().catch(function () { return { error: "bad_response" }; }); });
    });
  }

  /* Pull purchases + polls from the server and mirror them into the page's seat so the existing UI renders them. */
  var syncing = false;
  function syncSeat() {
    if (!sb || !user) return Promise.resolve(null);
    syncing = true;
    return ensureProfile(user).catch(function () {}).then(function () { return Promise.all([
      sb.from("mi_purchases").select("sku,polls_granted,specialty,state,created_at"),
      sb.from("mi_polls").select("specialty,state,created_at"),
      sb.from("mi_customers").select("full_name,free_level,sample_specialty,sample_state").eq("user_id", user.id).maybeSingle()
    ]).then(function (rs) {
      var purchases = rs[0].data || [], polls = rs[1].data || [], profile = rs[2].data || null;
      lastSeat = { purchases: purchases, polls: polls, profile: profile };
      var api = w.AMPRidgeAccess, out = null;
      if (api && api.applyServerSeat) out = api.applyServerSeat({ purchases: purchases, polls: polls });
      if (api && api.applyFreeLevel && profile) { try { api.applyFreeLevel(profile); } catch (eF) {} }
      syncing = false;
      rememberSample();
      try { accountBar(); } catch (eBar) {}
      maybeWelcome();
      return out;
    }); });
  }

  function verifyCheckout(sessionId) {
    return init().then(function () { return call("verify-checkout", { session_id: sessionId }); })
      .then(function (r) { return syncSeat().then(function () { return r; }); });
  }
  function usePoll(specialty, state) {
    if (!enabled || !user) return Promise.resolve({ skipped: true });
    return call("use-poll", { specialty: specialty, state: state });
  }

  /* ---------- modal ---------- */
  var modal;
  function el(html) { var t = d.createElement("div"); t.innerHTML = html.trim(); return t.firstChild; }
  function buildModal() {
    if (modal) return modal;
    modal = el(
      '<div class="mi-acct-modal" role="dialog" aria-modal="true" aria-labelledby="mi-acct-title" hidden>' +
      '<div class="mi-acct-card"><button type="button" class="mi-acct-x" aria-label="Close">×</button>' +
      '<h2 id="mi-acct-title"></h2><p class="mi-acct-sub"></p><form novalidate></form>' +
      '<p class="mi-acct-msg" role="status"></p><p class="mi-acct-links"></p></div></div>');
    d.body.appendChild(modal);
    modal.querySelector(".mi-acct-x").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    var css = d.createElement("style");
    css.textContent =
      ".mi-acct-modal{position:fixed;inset:0;background:rgba(10,20,30,.55);display:flex;align-items:center;justify-content:center;z-index:9999}" +
      ".mi-acct-modal[hidden]{display:none}.mi-acct-card{background:#fff;border-radius:14px;max-width:420px;width:92%;padding:28px;position:relative;font-family:Inter,system-ui,sans-serif}" +
      ".mi-acct-card h2{margin:0 0 6px;font-size:22px}.mi-acct-sub{margin:0 0 16px;color:#555;font-size:14px}" +
      ".mi-acct-card label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px}.mi-acct-card input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cfd6dd;border-radius:8px;font-size:15px}" +
      ".mi-acct-card button[type=submit]{margin-top:16px;width:100%;padding:12px;border:0;border-radius:8px;background:#0f2a3d;color:#fff;font-weight:600;font-size:15px;cursor:pointer}" +
      ".mi-acct-x{position:absolute;top:10px;right:14px;border:0;background:none;font-size:24px;cursor:pointer}.mi-acct-msg{font-size:14px;margin:12px 0 0;min-height:1em}.mi-acct-msg.err{color:#b3261e}" +
      ".mi-acct-get{display:flex;flex-direction:column;gap:4px;margin:0 0 8px;padding:12px 14px;border-radius:10px;background:#e7f7ef;border:1px solid #6BE0AD;color:#0b3d2a;font-size:14px;line-height:1.35}.mi-acct-get[hidden]{display:none}" +
      ".mi-acct-links{font-size:14px;margin:10px 0 0}.mi-acct-links a{color:#1a6fa3;cursor:pointer;margin-right:14px}";
    d.head.appendChild(css);
    return modal;
  }

  var VIEWS = {
    signup: {
      title: "Create your free account", sub: "Your free sample, purchases and polls stay on this account, on any device.",
      fields: [["full_name", "Full name", "text", "name"], ["organization", "Organization", "text", "organization"],
        ["email", "Work email", "email", "email"], ["phone", "Phone", "tel", "tel"], ["password", "Password (8+ characters)", "password", "new-password"]],
      cta: "Create account", links: [["signin", "I already have an account"]]
    },
    signin: {
      title: "Sign in", sub: "Sign in to see your polls and reports.",
      fields: [["email", "Work email", "email", "email"], ["password", "Password", "password", "current-password"]],
      cta: "Sign in", links: [["signup", "Create an account"], ["forgot", "Forgot password?"]]
    },
    forgot: {
      title: "Reset your password", sub: "We'll email you a link to set a new password.",
      fields: [["email", "Work email", "email", "email"]], cta: "Send reset link", links: [["signin", "Back to sign in"]]
    },
    reset: {
      title: "Set a new password", sub: "Choose a new password for your account.",
      fields: [["password", "New password (8+ characters)", "password", "new-password"]], cta: "Save password", links: []
    }
  };
  var pendingAfter = null;

  function msg(t, err) { var m = modal.querySelector(".mi-acct-msg"); m.textContent = t || ""; m.className = "mi-acct-msg" + (err ? " err" : ""); }

  function openModal(view, after) {
    buildModal();
    if (after) pendingAfter = after;
    var v = VIEWS[view];
    modal.querySelector("h2").textContent = v.title;
    modal.querySelector(".mi-acct-sub").textContent = v.sub;
    var get = modal.querySelector(".mi-acct-get");
    if (!get) { get = d.createElement("div"); get.className = "mi-acct-get"; modal.querySelector(".mi-acct-sub").after(get); }
    get.hidden = view !== "signup";
    if (view === "signup") {
      get.innerHTML = "";
      var g1 = d.createElement("strong"); g1.textContent = "You're getting: Free Verified sample";
      var g2 = d.createElement("span"); g2.textContent = sampleText(localSample()) + ". Real pay bands, no card needed.";
      get.appendChild(g1); get.appendChild(g2);
    }
    var form = modal.querySelector("form");
    form.innerHTML = v.fields.map(function (f) {
      return '<label for="mi-acct-' + f[0] + '">' + f[1] + '</label><input id="mi-acct-' + f[0] + '" name="' + f[0] + '" type="' + f[2] + '" autocomplete="' + f[3] + '" required>';
    }).join("") + '<button type="submit">' + v.cta + "</button>";
    var links = modal.querySelector(".mi-acct-links");
    links.innerHTML = "";
    v.links.forEach(function (l) {
      var a = d.createElement("a"); a.textContent = l[1];
      a.addEventListener("click", function () { openModal(l[0]); });
      links.appendChild(a);
    });
    msg("");
    form.onsubmit = function (e) { e.preventDefault(); submit(view, form); };
    modal.hidden = false;
    var first = form.querySelector("input"); if (first) first.focus();
  }
  function closeModal() { if (modal) modal.hidden = true; }

  function val(form, n) { var i = form.querySelector('[name="' + n + '"]'); return i ? i.value.trim() : ""; }

  function submit(view, form) {
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    var done = function () { btn.disabled = false; };
    var redirect = w.location.origin + w.location.pathname;
    init().then(function () {
      if (view === "signup") {
        var email = val(form, "email"), pw = val(form, "password");
        var smp = localSample();
        var prof = { full_name: val(form, "full_name"), organization: val(form, "organization"), phone: val(form, "phone"),
          free_level: "verified", sample_specialty: smp ? smp.spec : "", sample_state: smp ? smp.st : "",
          sample_label: "Free Verified sample: " + sampleText(smp) };
        if (!prof.full_name || !prof.organization || !email) { msg("Please fill in name, organization and work email.", true); return done(); }
        if (w.AMPRidgeAccess && AMPRidgeAccess.isWorkEmail && !AMPRidgeAccess.isWorkEmail(email)) { msg("Please use your work email, not a personal one.", true); return done(); }
        if (pw.length < 8) { msg("Password needs at least 8 characters.", true); return done(); }
        return sb.auth.signUp({ email: email, password: pw, options: { data: prof, emailRedirectTo: redirect + "?welcome=1" } }).then(function (r) {
          done();
          if (r.error) return msg(r.error.message, true);
          if (r.data.session) { saveProfile(prof, email).then(finish); }
          else {
            try { localStorage.setItem("amp_mi_pending_profile", JSON.stringify({ email: email, prof: prof })); } catch (e) {}
            msg("Almost done. Check your email and tap the confirmation link. It brings you right back here with your free sample ready.");
          }
        });
      }
      if (view === "signin") {
        return sb.auth.signInWithPassword({ email: val(form, "email"), password: val(form, "password") }).then(function (r) {
          done();
          if (r.error) return msg(/confirm/i.test(r.error.message) ? "Please confirm your email first (check your inbox)." : "That email and password didn't match.", true);
          ensureProfile(r.data.user).then(finish);
        });
      }
      if (view === "forgot") {
        return sb.auth.resetPasswordForEmail(val(form, "email"), { redirectTo: redirect }).then(function () {
          done(); msg("If that email has an account, a reset link is on its way.");
        });
      }
      if (view === "reset") {
        var np = val(form, "password");
        if (np.length < 8) { msg("Password needs at least 8 characters.", true); return done(); }
        return sb.auth.updateUser({ password: np }).then(function (r) {
          done();
          if (r.error) return msg(r.error.message, true);
          msg("Password saved. You're signed in."); setTimeout(closeModal, 1200);
        });
      }
    }).catch(function () { done(); msg("Something went wrong. Please try again.", true); });
  }

  function saveProfile(prof, email) {
    return sb.from("mi_customers").upsert({ user_id: user.id, full_name: prof.full_name, organization: prof.organization, phone: prof.phone || null, work_email: email,
      free_level: prof.free_level || "verified", sample_specialty: prof.sample_specialty || null, sample_state: prof.sample_state || null });
  }
  /* First sign-in after email confirmation: write the profile captured at sign-up. */
  function ensureProfile(u) {
    user = u;
    return sb.from("mi_customers").select("user_id").eq("user_id", u.id).maybeSingle().then(function (r) {
      if (r.data) return;
      var meta = u.user_metadata || {};
      return saveProfile({ full_name: meta.full_name || "", organization: meta.organization || "", phone: meta.phone || "",
        free_level: meta.free_level || "verified", sample_specialty: meta.sample_specialty || "", sample_state: meta.sample_state || "" }, u.email);
    });
  }
  function finish() {
    closeModal();
    var t = d.getElementById("mi-lite-mock-toast"); if (t) { t.textContent = "You're signed in."; t.hidden = false; setTimeout(function () { t.hidden = true; }, 4000); }
    syncSeat();
    var cb = pendingAfter; pendingAfter = null;
    if (cb) cb(user);
  }

  /* Run fn(user) once there is a signed-in account; opens Create account if not. */
  function requireAccount(fn) {
    if (!enabled) return fn(null);
    init().then(function (u) { if (u) fn(u); else openModal("signup", fn); });
  }

  function signOut() { return init().then(function () { return sb && sb.auth.signOut(); }); }

  /* Buyer returned from Stripe: verify on the server before anything unlocks. */
  function handleReturn() {
    if (!enabled) return;
    var p = new URLSearchParams(w.location.search || "");
    var sid = p.get("session_id");
    if (!sid) return;
    requireAccount(function () {
      verifyCheckout(sid).then(function (r) {
        ["ridge_checkout", "ridge_sku", "session_id"].forEach(function (k) { p.delete(k); });
        var qs = p.toString();
        try { w.history.replaceState(null, "", w.location.pathname + (qs ? "?" + qs : "") + w.location.hash); } catch (e) {}
        var t = d.getElementById("mi-lite-mock-toast");
        if (t) {
          t.textContent = r && r.ok ? "Payment confirmed. Your access is open." : "We couldn't confirm that payment yet. If you were charged, contact us and we'll fix it right away.";
          t.hidden = false; setTimeout(function () { t.hidden = true; }, 5000);
        }
        if (w.AMPRidgeWorkbench && AMPRidgeWorkbench.refresh) { try { AMPRidgeWorkbench.refresh(); } catch (e) {} }
      });
    });
  }

  /* 2219: if the account has no sample market yet and this browser picks one, save it to the account. */
  function rememberSample() {
    if (!sb || !user || syncing || !lastSeat || !lastSeat.profile) return;
    var pr = lastSeat.profile, smp = localSample();
    if (!smp || (pr.sample_specialty && pr.sample_state)) return;
    pr.sample_specialty = smp.spec; pr.sample_state = smp.st;
    sb.from("mi_customers").update({ sample_specialty: smp.spec, sample_state: smp.st }).eq("user_id", user.id).then(function () {});
    var api = ra(); if (api && api.applyFreeLevel) { try { api.applyFreeLevel(pr); } catch (e) {} }
    try { accountBar(); } catch (e2) {}
  }
  function goRoute(route) {
    var a = d.createElement("a"); a.setAttribute("data-go", route); a.href = "#"; a.style.display = "none";
    d.body.appendChild(a); a.click(); a.remove();
  }
  function maybeWelcome() {
    if (!fromConfirm || !user || !lastSeat) return;
    fromConfirm = false;
    try {
      var p = new URLSearchParams(w.location.search || ""); p.delete("welcome");
      var qs = p.toString(); w.history.replaceState(null, "", w.location.pathname + (qs ? "?" + qs : ""));
    } catch (e) {}
    buildModal();
    var old = d.getElementById("mi-welcome"); if (old) old.remove();
    var smp = accountSample();
    var first = String((lastSeat.profile && lastSeat.profile.full_name) || (user.user_metadata || {}).full_name || "").split(" ")[0];
    var wrap = el('<div class="mi-acct-modal" id="mi-welcome" role="dialog" aria-modal="true" aria-labelledby="mi-welcome-h"><div class="mi-acct-card">' +
      '<button type="button" class="mi-acct-x" aria-label="Close">×</button><h2 id="mi-welcome-h"></h2><p class="mi-acct-sub"></p>' +
      '<div class="mi-acct-get"></div><button type="button" class="mi-welcome-go"></button><p class="mi-welcome-more"></p></div></div>');
    wrap.querySelector("h2").textContent = "\u2713 You're verified" + (first ? ", " + first : "") + ".";
    wrap.querySelector(".mi-acct-sub").textContent = "Your email is confirmed and your account is ready. Here's what you signed up for:";
    var get = wrap.querySelector(".mi-acct-get");
    var g1 = d.createElement("strong"); g1.textContent = "Your free sample";
    var g2 = d.createElement("span"); g2.textContent = sampleText(smp) + ".";
    var g3 = d.createElement("span"); g3.textContent = "You see the real Red alert and Competitive pay bands. Free, no card needed.";
    get.appendChild(g1); get.appendChild(g2); get.appendChild(g3);
    var go = wrap.querySelector(".mi-welcome-go");
    go.textContent = smp ? "Open my free sample" : "Pick my free sample";
    go.style.cssText = "margin-top:14px;width:100%;padding:12px;border:0;border-radius:8px;background:#0f2a3d;color:#fff;font-weight:600;font-size:15px;cursor:pointer";
    var more = wrap.querySelector(".mi-welcome-more");
    more.style.cssText = "font-size:14px;color:#555;margin:14px 0 0;line-height:1.4";
    more.appendChild(d.createTextNode("Want every layer? Get one full report for $99, or a poll package: 15 polls for $225, 50 for $650, 100 for $1,100 or 250 for $2,250. "));
    var see = d.createElement("a"); see.href = "#"; see.textContent = "See options"; see.style.cssText = "color:#1a6fa3";
    more.appendChild(see);
    var close = function () { wrap.remove(); };
    wrap.querySelector(".mi-acct-x").onclick = close;
    wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    go.onclick = function () { close(); if (smp) openOwned(smp.spec, smp.st); else { goRoute("mi-lite"); setTimeout(function () { var dr = d.getElementById("ridge-demo-door"); if (dr) dr.scrollIntoView({ behavior: "smooth", block: "center" }); }, 350); } };
    see.onclick = function (e) { e.preventDefault(); close(); goRoute("mi-lite-portal"); };
    d.body.appendChild(wrap);
  }
  /* One friendly line describing the account's current level. */
  function planText() {
    var ps = (lastSeat && lastSeat.purchases) || [];
    var packs = ps.filter(function (p) { return /^pack/.test(p.sku); });
    if (packs.length) {
      var big = packs.slice().sort(function (a, b) { return (b.polls_granted || 0) - (a.polls_granted || 0); })[0];
      var granted = ps.reduce(function (n, p) { return n + (Number(p.polls_granted) || 0); }, 0);
      var left = Math.max(0, granted - ((lastSeat.polls || []).length));
      return { name: PACK_LABEL[big.sku] || "Poll package", detail: left + " of " + granted + " polls left. Each poll opens one specialty in one state, every layer.", paid: true };
    }
    var reports = ps.filter(function (p) { return p.sku === "oneoff"; }).length;
    return { name: "Free Verified sample" + (reports ? " + " + reports + " full report" + (reports > 1 ? "s" : "") : ""), detail: sampleText(accountSample()) + ".", paid: false };
  }

  w.AMPMiAccounts = {
    enabled: enabled, init: init, user: function () { return user; }, requireAccount: requireAccount,
    open: openModal, signOut: signOut, verifyCheckout: verifyCheckout, usePoll: usePoll, syncSeat: syncSeat,
    onChange: function (f) { listeners.push(f); }
  };
  /* Visible account bar on the MI page + ?account=signin|signup deep link (2209). */
  function optLabel(id, v) {
    var sel = d.getElementById(id);
    if (sel) for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === v) return sel.options[i].textContent;
    return "";
  }
  function specLabel(k) { return optLabel("ridge-demo-specialty", k) || String(k || "").replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function stateLabel(k) { return optLabel("ridge-demo-state", String(k || "").toUpperCase()) || String(k || "").toUpperCase(); }
  function openOwned(spec, st) {
    var api = w.AMPRidgeAccess;
    if (api && api.startDemo) { try { api.startDemo({ specialty: spec, state: st }); } catch (e) {} }
    var a = d.createElement("a"); a.setAttribute("data-go", "mi-lite-app"); a.href = "#"; a.style.display = "none";
    d.body.appendChild(a); a.click(); a.remove();
  }
  function ownerView() {
    var ps = (user && lastSeat && lastSeat.purchases) || [];
    var owner = ps.some(function (p) { return p.sku === "oneoff" || /^pack/.test(p.sku); });
    d.body.classList.toggle("mi-owner", owner);
    if (!d.getElementById("mi-owner-css")) {
      var css = d.createElement("style"); css.id = "mi-owner-css";
      css.textContent = "body.mi-owner #ridge-verify-cta,body.mi-owner #ridge-simulate-verify-app,body.mi-owner #ridge-oneoff-cta,body.mi-owner #mi-lite-lock-again,body.mi-owner #ridge-sim-pay,body.mi-owner #ridge-seat-line,body.mi-owner .ridge-access-actions,body.mi-owner #mi-lite-lock-banner,body.mi-owner .mi-dashboard-head .example-stamp{display:none!important}" +
        "body.mi-owner #ridge-demo-door:not(.mi-open){display:none!important}" +
        "#mi-try-other{display:none;margin:4px 16px 14px;font:600 15px/1.3 Inter,system-ui,sans-serif;color:#0b2a44;text-decoration:underline;cursor:pointer;background:none;border:0;padding:0}body.mi-owner #mi-try-other{display:inline-block}";
      d.head.appendChild(css);
    }
    var door = d.getElementById("ridge-demo-door");
    if (door && !d.getElementById("mi-try-other")) {
      var t = d.createElement("button"); t.type = "button"; t.id = "mi-try-other";
      t.textContent = "Try a free sample of another market \u25be";
      t.onclick = function () { var o = door.classList.toggle("mi-open"); t.textContent = o ? "Hide free sample \u25b4" : "Try a free sample of another market \u25be"; };
      door.parentNode.insertBefore(t, door);
    }
    var wtag = d.querySelector('.mi-dashboard-head .tag');
    if (wtag) {
      if (!wtag.getAttribute("data-orig")) wtag.setAttribute("data-orig", wtag.textContent);
      wtag.textContent = owner ? "Market Intelligence \u00b7 your report" : wtag.getAttribute("data-orig");
    }
    var lede = d.querySelector('.view[data-route="mi-lite-app"] .hero-inner .lede');
    if (lede) {
      if (!lede.getAttribute("data-orig")) lede.setAttribute("data-orig", lede.textContent);
      lede.textContent = owner ? "Your purchased report, with every layer open." : lede.getAttribute("data-orig");
    }
  }
  function accountBar() {
    if (!user) lastSeat = null;
    var host = d.querySelector('.view[data-route="mi-lite"]');
    var bar = d.getElementById("mi-acct-bar");
    if (host && !bar) {
      bar = d.createElement("div"); bar.id = "mi-acct-bar";
      var hero = host.querySelector(".hero-band");
      if (hero && hero.parentNode) hero.parentNode.insertBefore(bar, hero.nextSibling);
      else host.insertBefore(bar, host.firstChild);
    }
    if (bar) {
      bar.innerHTML = "";
      bar.style.cssText = "display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px 16px;align-items:center;position:relative;z-index:5;margin:14px 16px;padding:12px 18px;border-radius:12px;font:600 15px/1.3 Inter,system-ui,sans-serif;" +
        (user ? "background:#e7f7ef;border:1px solid #6BE0AD;color:#0b3d2a" : "background:#eef6fb;border:1px solid #78C4E5;color:#0b2a44");
      var left = d.createElement("span");
      var right = d.createElement("span"); right.style.cssText = "display:flex;gap:16px";
      if (user) {
        left.textContent = "\u2713 You're signed in as " + (user.email || "");
        if (lastSeat) {
          var bal = d.createElement("div");
          bal.style.cssText = "flex-basis:100%;display:flex;flex-direction:column;gap:8px;font-weight:500;border-top:1px solid rgba(11,61,42,.15);padding-top:10px";
          var ps = lastSeat.purchases || [];
          var reports = ps.filter(function (p) { return p.sku === "oneoff" && p.specialty && p.state; });
          var granted = ps.reduce(function (n, p) { return n + (Number(p.polls_granted) || 0); }, 0);
          var left2 = Math.max(0, granted - (lastSeat.polls || []).length);
          var plan = planText();
          var head = d.createElement("div"); head.id = "mi-your-plan";
          var hs = d.createElement("strong"); hs.textContent = "Your plan: " + plan.name;
          var hd = d.createElement("div"); hd.textContent = plan.detail;
          head.appendChild(hs); head.appendChild(hd);
          bal.appendChild(head);
          if (!plan.paid) {
            var up = d.createElement("div"); up.style.cssText = "font-size:14px;opacity:.9";
            up.appendChild(d.createTextNode("Want every layer? $99 for one full report, or poll packages of 15, 50, 100 or 250 polls. "));
            var upa = d.createElement("a"); upa.href = "#"; upa.textContent = "See options"; upa.style.cssText = "text-decoration:underline;color:inherit";
            upa.onclick = function (e) { e.preventDefault(); goRoute("mi-lite-portal"); };
            up.appendChild(upa); bal.appendChild(up);
          }
          reports.forEach(function (r) {
            var row = d.createElement("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center";
            var t = d.createElement("span"); t.textContent = "\u2713 $99 report: " + specLabel(r.specialty) + " \u00b7 " + stateLabel(r.state);
            var b = d.createElement("button"); b.type = "button"; b.textContent = "Open report";
            b.style.cssText = "padding:6px 14px;border-radius:999px;border:0;background:#0b3d2a;color:#fff;font:600 14px/1 Inter,system-ui,sans-serif;cursor:pointer";
            b.onclick = function () { openOwned(r.specialty, r.state); };
            row.appendChild(t); row.appendChild(b); bal.appendChild(row);
          });
          bar.appendChild(bal);
        }
        var out = d.createElement("a"); out.href = "#"; out.textContent = "Sign out"; out.style.cssText = "text-decoration:underline;color:inherit";
        out.onclick = function (e) { e.preventDefault(); signOut(); };
        right.appendChild(out);
      } else {
        left.textContent = "Have an account? Sign in to see your purchases.";
        [["signin", "Sign in"], ["signup", "Create account"]].forEach(function (l) {
          var a = d.createElement("a"); a.href = "#"; a.textContent = l[1]; a.style.cssText = "text-decoration:underline;color:inherit";
          a.onclick = function (e) { e.preventDefault(); openModal(l[0]); };
          right.appendChild(a);
        });
      }
      bar.insertBefore(right, bar.firstChild); bar.insertBefore(left, bar.firstChild);
    }
    ownerView();
    /* Top nav: show signed-in state on every page. */
    var nav = d.getElementById("site-nav");
    var chip = d.getElementById("mi-acct-nav");
    if (nav && !chip) {
      chip = d.createElement("a"); chip.id = "mi-acct-nav"; chip.href = "#";
      chip.style.cssText = "margin-left:10px;padding:6px 12px;border-radius:999px;font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:none;white-space:nowrap";
      chip.onclick = function (e) { e.preventDefault(); if (!user) openModal("signin"); else if (confirm("Sign out of " + (user.email || "your account") + "?")) signOut(); };
      var cta = nav.querySelector('[data-go="mi-lite"]');
      (cta && cta.parentNode ? cta.parentNode : nav).appendChild(chip);
    }
    if (chip) {
      chip.textContent = user ? "\u2713 Signed in" : "Sign in";
      chip.title = user ? (user.email || "") : "Sign in to Market Intelligence";
      chip.style.background = user ? "#6BE0AD" : "transparent";
      chip.style.color = user ? "#0b3d2a" : "#ffffff";
      chip.style.border = user ? "1px solid #6BE0AD" : "1px solid rgba(255,255,255,.85)";
    }
  }
  function accountDeepLink() {
    var v = new URLSearchParams(w.location.search || "").get("account");
    if (!user && (v === "signin" || v === "signup")) openModal(v);
  }
  if (enabled) {
    var boot = function () { listeners.push(accountBar);
      var api0 = ra(); if (api0 && api0.onChange) api0.onChange(function () { if (user && !syncing) rememberSample(); }); init().then(function () { accountBar(); accountDeepLink(); handleReturn(); }); };
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(window, document);
