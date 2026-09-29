// Easy Pay (ACH) authorization. Replaces the old Webflow form handler.
// The browser sends contact details only. Bank routing/account numbers are entered on
// Stripe's hosted page (Checkout, setup mode, us_bank_account) and never touch AMP systems.
// Stripe creates a Customer and saves the bank account with a mandate so accounting can
// charge invoices from the Stripe dashboard.
import { ALLOWED_ORIGINS, cors, json } from "../_shared.ts";

const STRIPE_KEY = Deno.env.get("STRIPE_ACH_KEY") || "";
const TERMS_VERSION = "amp-easy-pay-2026-09";

function clean(v: unknown, max = 200): string {
  return String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method" });
  const origin = req.headers.get("origin") || "";
  if (!ALLOWED_ORIGINS.includes(origin)) return json(req, 403, { error: "origin" });
  if (!STRIPE_KEY) return json(req, 503, { error: "not_configured" });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* empty */ }
  const first = clean(b.first), last = clean(b.last), title = clean(b.title), org = clean(b.org);
  const signature = clean(b.signature), email = clean(b.email, 254), phone = clean(b.phone, 40);
  const accepted = b.accept === true;
  let path = clean(b.path, 200);
  if (!/^\/[A-Za-z0-9\-_/]*$/.test(path)) path = "/easy-pay-authorization";

  if (!first || !last || !title || !org || !signature || !phone) return json(req, 400, { error: "missing_fields" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(req, 400, { error: "bad_email" });
  if (!accepted) return json(req, 400, { error: "terms_not_accepted" });

  const when = new Date().toISOString();
  const meta: Record<string, string> = {
    source: "easy-pay-authorization",
    organization: org,
    contact_name: `${first} ${last}`,
    contact_title: title,
    billing_phone: phone,
    typed_signature: signature,
    terms_version: TERMS_VERSION,
    terms_accepted_at: when,
  };

  const p = new URLSearchParams();
  p.set("mode", "setup");
  p.set("currency", "usd");
  p.append("payment_method_types[]", "us_bank_account");
  p.set("customer_creation", "always");
  p.set("customer_email", email);
  p.set("payment_method_options[us_bank_account][verification_method]", "automatic");
  p.append("payment_method_options[us_bank_account][financial_connections][permissions][]", "payment_method");
  p.set("success_url", `${origin}${path}?ach=done`);
  p.set("cancel_url", `${origin}${path}?ach=cancel`);
  for (const [k, v] of Object.entries(meta)) {
    p.set(`metadata[${k}]`, v);
    p.set(`setup_intent_data[metadata][${k}]`, v);
  }
  p.set("setup_intent_data[description]", `ACH authorization · ${org}`.slice(0, 200));

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: p.toString(),
  });
  const s = await r.json().catch(() => ({}));
  if (!r.ok || !s.url) {
    console.error("stripe_checkout_failed", r.status, s?.error?.code, s?.error?.message);
    return json(req, 502, { error: "stripe_failed" });
  }
  return json(req, 200, { url: s.url });
});
