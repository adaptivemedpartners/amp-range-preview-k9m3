/* MI customer accounts: create account, sign in, forgot/reset password, server-verified purchases and polls.
   Loads supabase-js only when js/mi-accounts-config.js has a url. */
(function (w, d) {
  "use strict";
  var cfg = w.AMP_MI_ACCOUNTS || {};
  var enabled = !!(cfg.url && cfg.anonKey);
  var sb = null, user = null, ready = null, listeners = [];

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
        if (user) syncSeat();
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
  function syncSeat() {
    if (!sb || !user) return Promise.resolve(null);
    return Promise.all([
      sb.from("mi_purchases").select("sku,polls_granted,specialty,state,created_at"),
      sb.from("mi_polls").select("specialty,state,created_at")
    ]).then(function (rs) {
      var purchases = rs[0].data || [], polls = rs[1].data || [];
      var api = w.AMPRidgeAccess;
      if (!api || !api.applyServerSeat) return null;
      return api.applyServerSeat({ purchases: purchases, polls: polls });
    });
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
      ".mi-acct-links{font-size:14px;margin:10px 0 0}.mi-acct-links a{color:#1a6fa3;cursor:pointer;margin-right:14px}";
    d.head.appendChild(css);
    return modal;
  }

  var VIEWS = {
    signup: {
      title: "Create your account", sub: "Your purchases and polls stay on this account, on any device.",
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
        var prof = { full_name: val(form, "full_name"), organization: val(form, "organization"), phone: val(form, "phone") };
        if (!prof.full_name || !prof.organization || !email) { msg("Please fill in name, organization and work email.", true); return done(); }
        if (w.AMPRidgeAccess && AMPRidgeAccess.isWorkEmail && !AMPRidgeAccess.isWorkEmail(email)) { msg("Please use your work email, not a personal one.", true); return done(); }
        if (pw.length < 8) { msg("Password needs at least 8 characters.", true); return done(); }
        return sb.auth.signUp({ email: email, password: pw, options: { data: prof, emailRedirectTo: redirect } }).then(function (r) {
          done();
          if (r.error) return msg(r.error.message, true);
          if (r.data.session) { saveProfile(prof, email).then(finish); }
          else {
            try { localStorage.setItem("amp_mi_pending_profile", JSON.stringify({ email: email, prof: prof })); } catch (e) {}
            msg("Check your email to confirm your account, then sign in here.");
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
    return sb.from("mi_customers").upsert({ user_id: user.id, full_name: prof.full_name, organization: prof.organization, phone: prof.phone || null, work_email: email });
  }
  /* First sign-in after email confirmation: write the profile captured at sign-up. */
  function ensureProfile(u) {
    user = u;
    return sb.from("mi_customers").select("user_id").eq("user_id", u.id).maybeSingle().then(function (r) {
      if (r.data) return;
      var meta = u.user_metadata || {};
      return saveProfile({ full_name: meta.full_name || "", organization: meta.organization || "", phone: meta.phone || "" }, u.email);
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

  w.AMPMiAccounts = {
    enabled: enabled, init: init, user: function () { return user; }, requireAccount: requireAccount,
    open: openModal, signOut: signOut, verifyCheckout: verifyCheckout, usePoll: usePoll, syncSeat: syncSeat,
    onChange: function (f) { listeners.push(f); }
  };
  /* Visible account bar on the MI page + ?account=signin|signup deep link (2209). */
  function accountBar() {
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
      bar.appendChild(left); bar.appendChild(right);
    }
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
    var boot = function () { listeners.push(accountBar); init().then(function () { accountBar(); accountDeepLink(); handleReturn(); }); };
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(window, document);
