// Pay an invoice: client enters invoice number + amount, pays by bank account (ACH) or card on
// Stripe's hosted Checkout. No invoice lookup yet (QuickBooks comes later). The invoice number is
// written onto the Stripe payment (description, metadata, client_reference_id) so accounting can
// match client + invoice + amount in the Stripe dashboard.
import { ALLOWED_ORIGINS, cors, json } from "../_shared.ts";

const STRIPE_KEY = Deno.env.get("STRIPE_ACH_KEY") || "";
const MIN_CENTS = 100;          // $1
const MAX_CENTS = 50000000;     // $500,000

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
  const invoice = clean(b.invoice, 40).replace(/^#/, "");
  const org = clean(b.org), name = clean(b.name), email = clean(b.email, 254), phone = clean(b.phone, 40);
  const amountStr = clean(b.amount, 20).replace(/[$,\s]/g, "");
  let path = clean(b.path, 200);
  if (!/^\/[A-Za-z0-9\-_/]*$/.test(path)) path = "/pay-invoice";

  if (!/^[A-Za-z0-9\-]{2,30}$/.test(invoice)) return json(req, 400, { error: "bad_invoice" });
  if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) return json(req, 400, { error: "bad_amount" });
  const cents = Math.round(parseFloat(amountStr) * 100);
  if (!(cents >= MIN_CENTS && cents <= MAX_CENTS)) return json(req, 400, { error: "amount_range" });
  if (!org || !name) return json(req, 400, { error: "missing_fields" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(req, 400, { error: "bad_email" });

  const dollars = (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const desc = `Invoice ${invoice} · ${org}`.slice(0, 200);
  const meta: Record<string, string> = {
    source: "pay-invoice",
    invoice_number: invoice,
    organization: org,
    contact_name: name,
    billing_phone: phone,
    amount_entered: dollars,
  };

  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("submit_type", "pay");
  p.append("payment_method_types[]", "us_bank_account");
  p.append("payment_method_types[]", "card");
  p.set("customer_creation", "always");
  p.set("customer_email", email);
  p.set("client_reference_id", invoice);
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", "usd");
  p.set("line_items[0][price_data][unit_amount]", String(cents));
  p.set("line_items[0][price_data][product_data][name]", `Invoice ${invoice}`);
  p.set("line_items[0][price_data][product_data][description]", `Adaptive Medical Partners · ${org}`.slice(0, 200));
  p.set("payment_method_options[us_bank_account][verification_method]", "automatic");
  p.set("payment_intent_data[description]", desc);
  p.set("payment_intent_data[statement_descriptor_suffix]", `INV ${invoice}`.slice(0, 22));
  p.set("success_url", `${origin}${path}?paid=1&inv=${encodeURIComponent(invoice)}`);
  p.set("cancel_url", `${origin}${path}?paid=cancel`);
  for (const [k, v] of Object.entries(meta)) {
    p.set(`metadata[${k}]`, v);
    p.set(`payment_intent_data[metadata][${k}]`, v);
  }

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
