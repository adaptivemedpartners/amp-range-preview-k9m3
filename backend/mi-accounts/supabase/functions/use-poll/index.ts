// Spend one poll on a specialty x state (all layers). Re-opening a unit already polled is free.
import { admin, balance, cors, currentUser, json } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "method" });
  const user = await currentUser(req);
  if (!user) return json(req, 401, { error: "sign_in_required" });

  let body: { specialty?: string; state?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const specialty = String(body.specialty || "").slice(0, 60);
  const state = String(body.state || "").toLowerCase().slice(0, 2);
  if (!specialty || !/^[a-z]{2}$/.test(state)) return json(req, 400, { error: "bad_unit" });

  const { data: have } = await admin.from("mi_polls").select("id")
    .eq("user_id", user.id).eq("specialty", specialty).eq("state", state).maybeSingle();
  if (have) return json(req, 200, { ok: true, already: true, ...(await balance(user.id)) });

  const b = await balance(user.id);
  if (b.polls_left <= 0) return json(req, 402, { error: "no_polls_left", ...b });

  const { error } = await admin.from("mi_polls").insert({ user_id: user.id, specialty, state });
  if (error && !/duplicate/i.test(error.message)) return json(req, 500, { error: "record_failed" });
  return json(req, 200, { ok: true, ...(await balance(user.id)) });
});
