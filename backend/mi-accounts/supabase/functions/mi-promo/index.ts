// 2311: Promo codes for free MI sample polls (no card).
// Admin actions (Mike, Randy, David only: confirmed email in mi_promo_admins): create, list, revoke.
// Customer actions: status, redeem (locks one state), use (spend one free specialty poll in that state).
import { admin, cors, currentUser, json } from "../_shared.ts";

const ALPH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
function newCode(): string {
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  let s = ""; for (let i = 0; i < 12; i++) s += ALPH[b[i] % ALPH.length]; // ~59 bits
  return "AMP-" + s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8, 12);
}
const normCode = (c: unknown) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^AMP/, "");
const fmt = (n: string) => "AMP-" + n.slice(0, 4) + "-" + n.slice(4, 8) + "-" + n.slice(8, 12);
const expired = (r: { expires_at: string | null }) => !!r.expires_at && new Date(r.expires_at).getTime() < Date.now();

async function isAdmin(email: string) {
  const { data } = await admin.from("mi_promo_admins").select("name").eq("email", email).maybeSingle();
  return data ? data.name as string : null;
}
async function usage(codeId: number) {
  const { data } = await admin.from("mi_polls").select("specialty,state,created_at").eq("promo_code_id", codeId).order("created_at");
  return data || [];
}
async function myCode(userId: string) {
  const { data } = await admin.from("mi_promo_codes").select("*").eq("redeemed_by", userId).maybeSingle();
  return data;
}
async function statusFor(row: any) {
  if (!row) return { promo: null };
  const used = await usage(row.id);
  return { promo: { code: row.code, allowance: row.allowance, state: row.state, used: used.length,
    left: Math.max(0, row.allowance - used.length), specialties: used.map((u) => u.specialty),
    expires_at: row.expires_at, expired: expired(row), revoked: !!row.revoked_at } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method" });
  const user = await currentUser(req);
  if (!user) return json(req, 401, { error: "sign_in_required" });
  if (!user.email_confirmed_at) return json(req, 403, { error: "confirm_email_first" });
  const email = String(user.email || "").toLowerCase();
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* empty */ }
  const action = String(b.action || "");

  if (["create", "list", "revoke"].includes(action)) {
    const who = await isAdmin(email);
    if (!who) return json(req, 403, { error: "not_allowed" });
    if (action === "create") {
      const to = String(b.email || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json(req, 400, { error: "bad_email" });
      const allowance = [5, 7, 9].includes(Number(b.allowance)) ? Number(b.allowance) : 5;
      let expires_at: string | null = null;
      if (b.expires_at) { const t = new Date(String(b.expires_at)); if (isNaN(+t)) return json(req, 400, { error: "bad_expiry" }); expires_at = t.toISOString(); }
      for (let i = 0; i < 5; i++) {
        const code = newCode();
        const { data, error } = await admin.from("mi_promo_codes").insert({ code, email: to, allowance, expires_at,
          note: b.note ? String(b.note).slice(0, 200) : null, created_by: `${who} <${email}>` }).select().single();
        if (!error) return json(req, 200, { ok: true, code: data });
        if (!/duplicate/i.test(error.message)) return json(req, 500, { error: "create_failed" });
      }
      return json(req, 500, { error: "create_failed" });
    }
    if (action === "revoke") {
      const { error } = await admin.from("mi_promo_codes").update({ revoked_at: new Date().toISOString() }).eq("id", Number(b.id)).is("revoked_at", null);
      return json(req, error ? 500 : 200, error ? { error: "revoke_failed" } : { ok: true });
    }
    const { data: rows } = await admin.from("mi_promo_codes").select("*").order("created_at", { ascending: false }).limit(500);
    const { data: polls } = await admin.from("mi_polls").select("promo_code_id,specialty").not("promo_code_id", "is", null);
    const out = (rows || []).map((r: any) => {
      const used = (polls || []).filter((p: any) => p.promo_code_id === r.id);
      const status = r.revoked_at ? "revoked" : expired(r) && !r.redeemed_at ? "expired" : !r.redeemed_at ? "unused"
        : used.length >= r.allowance ? "used up" : expired(r) ? "expired" : "active";
      return { ...r, used: used.length, specialties: used.map((p: any) => p.specialty), status };
    });
    return json(req, 200, { ok: true, admin: who, codes: out });
  }

  if (action === "status") return json(req, 200, { ok: true, is_admin: !!(await isAdmin(email)), ...(await statusFor(await myCode(user.id))) });

  if (action === "redeem") {
    const n = normCode(b.code);
    const state = String(b.state || "").toLowerCase();
    if (n.length !== 12) return json(req, 400, { error: "bad_code" });
    if (!/^[a-z]{2}$/.test(state)) return json(req, 400, { error: "pick_state" });
    const mine = await myCode(user.id);
    if (mine && mine.code !== fmt(n)) return json(req, 409, { error: "already_has_promo", ...(await statusFor(mine)) });
    const { data: row } = await admin.from("mi_promo_codes").select("*").eq("code", fmt(n)).maybeSingle();
    // Same answer for "no such code" and "someone else's code" so codes can't be probed.
    if (!row || row.email !== email) return json(req, 404, { error: "code_not_valid_for_this_email" });
    if (row.revoked_at) return json(req, 410, { error: "code_revoked" });
    if (expired(row)) return json(req, 410, { error: "code_expired" });
    if (row.redeemed_by && row.redeemed_by !== user.id) return json(req, 409, { error: "code_already_used" });
    if (!row.redeemed_by) {
      const { error } = await admin.from("mi_promo_codes").update({ redeemed_by: user.id, redeemed_at: new Date().toISOString(), state })
        .eq("id", row.id).is("redeemed_by", null);
      if (error) return json(req, 500, { error: "redeem_failed" });
    }
    return json(req, 200, { ok: true, ...(await statusFor(await myCode(user.id))) });
  }

  if (action === "use") {
    const row = await myCode(user.id);
    if (!row) return json(req, 404, { error: "no_promo" });
    if (row.revoked_at || expired(row)) return json(req, 410, { error: "promo_ended", ...(await statusFor(row)) });
    const specialty = String(b.specialty || "").slice(0, 60);
    const state = String(b.state || "").toLowerCase().slice(0, 2);
    if (!specialty || state !== row.state) return json(req, 403, { error: "wrong_state", ...(await statusFor(row)) });
    const used = await usage(row.id);
    if (used.some((u) => u.specialty === specialty)) return json(req, 200, { ok: true, already: true, ...(await statusFor(row)) });
    if (used.length >= row.allowance) return json(req, 402, { error: "promo_used_up", ...(await statusFor(row)) });
    const { error } = await admin.from("mi_polls").insert({ user_id: user.id, specialty, state, promo_code_id: row.id });
    if (error && !/duplicate/i.test(error.message)) return json(req, 500, { error: "record_failed" });
    return json(req, 200, { ok: true, ...(await statusFor(row)) });
  }
  return json(req, 400, { error: "bad_action" });
});
