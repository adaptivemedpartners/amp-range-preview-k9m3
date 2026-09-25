// Shared helpers for MI account functions (Deno / Supabase Edge Functions).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export const ALLOWED_ORIGINS = (Deno.env.get("MI_ALLOWED_ORIGINS") ||
  "https://adaptivemedpartners.github.io,https://adaptivemedicalpartners.com,https://www.adaptivemedicalpartners.com")
  .split(",").map((s) => s.trim());

export function cors(req: Request): Record<string, string> {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
}

export const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

// Resolve the signed-in customer from the request's bearer token.
export async function currentUser(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Payment Link id -> sku and polls granted. Kept server-side so the browser cannot claim a different product.
export const SKUS: Record<string, { sku: string; polls: number }> = {
  plink_1UJaxBLH1aj7lFJmyAVh4YiO: { sku: "pack15", polls: 15 },
  plink_1UJaxCLH1aj7lFJmnorM65PX: { sku: "pack50", polls: 50 },
  plink_1UJaxDLH1aj7lFJmcfGnfect: { sku: "pack100", polls: 100 },
  plink_1UJaxELH1aj7lFJmJRnBwUnn: { sku: "pack250", polls: 250 },
  plink_1UJaxFLH1aj7lFJmdP32IUFD: { sku: "oneoff", polls: 0 },
  plink_1UJaxGLH1aj7lFJm7TMr8XJq: { sku: "extra_poll", polls: 1 },
};

export async function balance(userId: string) {
  const [{ data: p }, { count }] = await Promise.all([
    admin.from("mi_purchases").select("sku,polls_granted,specialty,state,created_at").eq("user_id", userId),
    admin.from("mi_polls").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const purchases = p || [];
  const granted = purchases.reduce((s, r) => s + (r.polls_granted || 0), 0);
  return {
    polls_left: granted - (count || 0),
    polls_used: count || 0,
    has_package: purchases.some((r) => /^pack/.test(r.sku)),
    reports: purchases.filter((r) => r.sku === "oneoff").map((r) => ({ specialty: r.specialty, state: r.state, at: r.created_at })),
  };
}
