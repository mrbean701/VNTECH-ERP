// VNTECH PROPRIETARY SOURCE | V5.0.0 authenticated bootstrap smoke test
import { createHash, randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createUniversalRuntime } from "./universal-runtime.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtime = await createUniversalRuntime(root);
globalThis.__MEP_LOCAL_ENV__ = runtime.env;

function tokenHash(value) { return createHash("sha256").update(value).digest("hex"); }
let sessionId = null;
try {
  const count = await runtime.env.DB.prepare(`SELECT COUNT(*) AS count FROM users`).first();
  const totalUsers = Number(count?.count ?? 0);
  const route = await import(`./system-route.mjs?bootstrap-smoke=${Date.now()}`);
  if (totalUsers === 0) {
    const response = await route.GET(new Request("http://vntech.local/api/system"));
    const body = await response.json();
    if (!response.ok || body?.setupRequired !== true) throw new Error(`Setup-state smoke failed: HTTP ${response.status} ${JSON.stringify(body)}`);
    console.log("Authenticated bootstrap smoke: DAT · setupRequired=true (no users yet).");
  } else {
    const user = await runtime.env.DB.prepare(`SELECT id FROM users WHERE active=1 ORDER BY CASE WHEN role='admin' THEN 0 ELSE 1 END,created_at LIMIT 1`).first();
    if (!user?.id) throw new Error("No active user available for bootstrap smoke test.");
    const token = `SMOKE_${randomUUID()}_${randomUUID()}`;
    sessionId = `SMOKE_${randomUUID()}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    await runtime.env.DB.prepare(`INSERT INTO sessions (id,user_id,token_hash,expires_at,ip_address,user_agent,created_at) VALUES (?,?,?,?,?,?,?)`)
      .bind(sessionId, user.id, tokenHash(token), expires, "127.0.0.1", "VNTECH-FINAL-BOOTSTRAP-SMOKE", now.toISOString()).run();
    const request = new Request("http://vntech.local/api/system", { headers: { cookie: `mep_session=${encodeURIComponent(token)}` } });
    const response = await route.GET(request);
    const text = await response.text();
    let body = null; try { body = JSON.parse(text); } catch {}
    if (!response.ok || body?.ok !== true || body?.authenticated !== true || !body?.data) {
      throw new Error(`Bootstrap smoke failed: HTTP ${response.status} ${text.slice(0,1200)}`);
    }
    if (!Array.isArray(body.data.formFieldConfigs) || body.data.formFieldConfigs.length < 30) {
      throw new Error(`FINAL bootstrap missing dynamic field configuration: ${body.data.formFieldConfigs?.length ?? "none"}`);
    }
    const boqKeys=new Set(body.data.formFieldConfigs.filter((r)=>r.formKey==="boq").map((r)=>r.fieldKey));
    for(const key of ["receivedQty","varianceContract","issuedQty","stockQty","orderedNotReceivedQty"]){if(!boqKeys.has(key))throw new Error(`FINAL bootstrap missing BOQ system field: ${key}`);}
    console.log(`Authenticated bootstrap smoke FINAL: DAT · projects=${body.data.projects?.length ?? 0} · requests=${body.data.requests?.length ?? 0} · materials=${body.data.materials?.length ?? 0} · fieldConfigs=${body.data.formFieldConfigs.length}.`);
  }
} finally {
  if (sessionId) {
    try { await runtime.env.DB.prepare(`DELETE FROM sessions WHERE id=?`).bind(sessionId).run(); } catch {}
  }
  delete globalThis.__MEP_LOCAL_ENV__;
  await runtime.close();
}
