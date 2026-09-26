// 2220: in-house website visitor log. Free version: matches IPs to organizations using the
// public internet address ownership records (RDAP via rdap.org). No paid lookup service.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|scrapy/i;
const HEALTH = /hospital|health|medical|medicine|clinic|physician|surgical|surgery|healthcare|pediatric|children'?s|cancer|mayo|kaiser|baptist|methodist|presbyterian|mercy|saint |ascension|adventhealth|hca\b|tenet|lifepoint|ardent|ochsner|sutter|providence|intermountain|atrium|novant|banner|geisinger|christus|trinity|uab\b|vumc|infirmary|regional med/i;
const ISP = /comcast|charter|spectrum|at&t|att-|verizon|t-mobile|tmobile|cox comm|centurylink|lumen|frontier|windstream|mediacom|optimum|altice|cable one|sparklight|wow!|rcn|brightspeed|starlink|spacex|cellco|sprint|us cellular|consolidated comm|tds telecom|suddenlink|hughes|viasat|google fiber|metronet|ziply|astound|wide open west/i;
const CLOUD = /amazon|aws|google llc|google cloud|microsoft|azure|apple|icloud|cloudflare|akamai|fastly|digitalocean|linode|ovh|hetzner|oracle|zscaler|netskope|facebook|meta platforms|private relay/i;

function kindOf(text: string): string {
  if (!text) return "unknown";
  if (CLOUD.test(text)) return "cloud";
  if (ISP.test(text)) return "isp";
  if (HEALTH.test(text)) return "health";
  return "company";
}

function vcardName(e: any): string {
  const v = e?.vcardArray?.[1] || [];
  const fn = v.find((x: any[]) => x[0] === "fn");
  return fn ? String(fn[3] || "") : "";
}

async function lookup(ip: string) {
  const { data: hit } = await admin.from("ip_orgs").select("org,netname,kind").eq("ip", ip).maybeSingle();
  if (hit) return hit;
  let org = "", netname = "", cidr = "";
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch("https://rdap.org/ip/" + encodeURIComponent(ip), { headers: { Accept: "application/rdap+json" }, redirect: "follow", signal: ctl.signal });
    clearTimeout(t);
    if (r.ok) {
      const d = await r.json();
      netname = String(d.name || "");
      cidr = d.startAddress && d.endAddress ? d.startAddress + " - " + d.endAddress : "";
      const ents: any[] = d.entities || [];
      const reg = ents.find((e) => (e.roles || []).includes("registrant")) || ents.find((e) => (e.roles || []).includes("customer")) || ents[0];
      org = vcardName(reg);
      // ARIN often nests the real customer one level down.
      if (!org && reg?.entities?.length) org = vcardName(reg.entities[0]);
    }
  } catch (_) { /* lookup failed: keep unknown */ }
  const kind = kindOf(org + " " + netname);
  await admin.from("ip_orgs").upsert({ ip, org: org || null, netname: netname || null, cidr: cidr || null, kind });
  return { org, netname, kind };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: CORS });
  const ua = req.headers.get("user-agent") || "";
  if (BOT.test(ua)) return new Response(JSON.stringify({ skipped: "bot" }), { headers: { ...CORS, "Content-Type": "application/json" } });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "";
  if (!ip) return new Response(JSON.stringify({ skipped: "no_ip" }), { headers: { ...CORS, "Content-Type": "application/json" } });
  let body: any = {};
  try { body = JSON.parse(await req.text() || "{}"); } catch (_) {}
  const clip = (s: unknown, n: number) => String(s || "").slice(0, n);
  const info = await lookup(ip);
  await admin.from("site_visits").insert({
    ip, path: clip(body.path, 300) || "/", title: clip(body.title, 200), referrer: clip(body.ref, 500),
    user_agent: clip(ua, 400), site: clip(body.site, 120), org: info.org || info.netname || null, kind: info.kind,
  });
  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
