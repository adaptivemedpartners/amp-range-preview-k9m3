// Called by the MI page when a buyer returns from Stripe with ?session_id=...
// Confirms with Stripe that the checkout is paid, belongs to this signed-in customer,
// and records it once. Access is granted only from what this function writes.
import { admin, balance, cors, currentUser, json, SKUS } from "../_shared.ts";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method" });

  const user = await currentUser(req);
  if (!user) return json(req, 401, { error: "sign_in_required" });

  let body: { session_id?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const sid = String(body.session_id || "");
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sid)) return json(req, 400, { error: "bad_session" });

  // Already recorded? Return the balance (safe to call twice, e.g. on page refresh).
  const { data: existing } = await admin.from("mi_purchases").select("user_id").eq("stripe_session_id", sid).maybeSingle();
  if (existing) {
    if (existing.user_id !== user.id) return json(req, 403, { error: "session_belongs_to_other_account" });
    return json(req, 200, { ok: true, already: true, ...(await balance(user.id)) });
  }

  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sid}`, {
    headers: { Authorization: `Bearer ${STRIPE_KEY}` },
  });
  if (!r.ok) return json(req, 400, { error: "stripe_lookup_failed" });
  const s = await r.json();

  if (s.status !== "complete" || s.payment_status !== "paid") return json(req, 402, { error: "not_paid" });
  // The page sends the customer's account id to Stripe as client_reference_id ("<uuid>__sku__spec__state").
  const ref = String(s.client_reference_id || "");
  if (ref.split("__")[0] !== user.id) return json(req, 403, { error: "session_not_for_this_account" });
  const map = SKUS[String(s.payment_link || "")];
  if (!map) return json(req, 400, { error: "unknown_product" });

  const parts = ref.split("__");
  const specialty = map.sku === "oneoff" ? (parts[2] || null) : null;
  const state = map.sku === "oneoff" ? (parts[3] || null) : null;

  if (map.sku === "extra_poll") {
    const b = await balance(user.id);
    if (!b.has_package) return json(req, 409, { error: "extra_poll_needs_package" });
  }

  const { error } = await admin.from("mi_purchases").insert({
    user_id: user.id,
    stripe_session_id: sid,
    stripe_payment_intent: s.payment_intent || null,
    sku: map.sku,
    polls_granted: map.polls,
    amount_cents: s.amount_total || 0,
    tax_cents: s.total_details?.amount_tax || 0,
    specialty,
    state,
  });
  if (error && !/duplicate/i.test(error.message)) return json(req, 500, { error: "record_failed" });

  return json(req, 200, { ok: true, sku: map.sku, ...(await balance(user.id)) });
});
