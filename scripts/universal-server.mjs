// VNTECH PROPRIETARY SOURCE | V5.0.0 Universal Central Server
import { createServer } from "node:http";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createUniversalRuntime } from "./universal-runtime.mjs";
import { dispatchEmailOutbox } from "./email-dispatcher.mjs";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";
import { inspectStartupTrust } from "./trust-startup.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const trustState = await inspectStartupTrust(projectRoot);
if (!trustState.allowStartup) throw new Error(`VNTECH Trust Lock từ chối khởi động: ${trustState.license.reasons.join("; ")}`);
process.env.VNTECH_MACHINE_FINGERPRINT = trustState.machineFingerprint;
const runtime = await createUniversalRuntime(projectRoot);
runtime.env.TRUST_STATE = trustState;
globalThis.__MEP_LOCAL_ENV__ = runtime.env;

const cacheBust = `${process.pid}-${Date.now()}`;
const workerUrl = pathToFileURL(resolve(projectRoot, "dist", "server", "index.js")); workerUrl.searchParams.set("server", cacheBust);
const systemRouteUrl = pathToFileURL(resolve(projectRoot, "scripts", "system-route.mjs")); systemRouteUrl.searchParams.set("server", cacheBust);
const worker = (await import(workerUrl.href)).default;
const systemRoute = await import(systemRouteUrl.href);
const executionContext = { passThroughOnException() {}, waitUntil(promise) { Promise.resolve(promise).catch(console.error); } };
const port = Number(process.env.PORT || process.env.VNTECH_PORT || 8787);
const host = process.env.VNTECH_BIND_HOST || "0.0.0.0";
const loginFailures = new Map();
const releaseBuild = process.env.VNTECH_RELEASE_BUILD || VNTECH_IDENTITY.release.build;
const packageId = process.env.VNTECH_PACKAGE_ID || VNTECH_IDENTITY.release.packageId;
const uiContractId = process.env.VNTECH_UI_CONTRACT_ID || VNTECH_IDENTITY.release.uiContractId;

function clientIp(request) {
  return (request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown").split(",")[0].trim();
}
async function loginKey(request, payload) {
  const username = String(payload?.username || "").trim().toLowerCase() || "unknown";
  return `vntech:loginfail:${clientIp(request)}:${username}`;
}
async function failureCount(key) {
  if (runtime.redis) return Number(await runtime.redis.get(key) || 0);
  const item = loginFailures.get(key); if (!item || item.expires < Date.now()) { loginFailures.delete(key); return 0; } return item.count;
}
async function registerFailure(key) {
  if (runtime.redis) { const count = await runtime.redis.incr(key); if (count === 1) await runtime.redis.expire(key, 900); return count; }
  const prev = loginFailures.get(key); const count = prev && prev.expires > Date.now() ? prev.count + 1 : 1; loginFailures.set(key, { count, expires: Date.now() + 900000 }); return count;
}
async function clearFailures(key) { if (runtime.redis) await runtime.redis.del(key); else loginFailures.delete(key); }

async function toRequest(incoming) {
  const proto = String(incoming.headers["x-forwarded-proto"] || (runtime.env.COOKIE_SECURE ? "https" : "http"));
  const hostHeader = incoming.headers.host || `localhost:${port}`;
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item)); else if (value !== undefined) headers.set(name, value);
  }
  if (!headers.has("x-forwarded-for") && incoming.socket?.remoteAddress) headers.set("x-forwarded-for", incoming.socket.remoteAddress);
  const method = incoming.method || "GET"; const chunks = [];
  if (method !== "GET" && method !== "HEAD") for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
  return new Request(`${proto}://${hostHeader}${incoming.url || "/"}`, { method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
}
async function sendResponse(outgoing, response) {
  const headers = { "x-vntech-product-id": VNTECH_IDENTITY.productId, "x-vntech-source-fingerprint": VNTECH_IDENTITY.sourceFingerprintShort, "x-vntech-owner": encodeURIComponent(VNTECH_IDENTITY.legalOwner), "x-vntech-version": VNTECH_IDENTITY.version, "x-vntech-build": releaseBuild, "x-vntech-package": packageId, "x-vntech-ui-contract": uiContractId };
  for (const [name, value] of response.headers) if (name.toLowerCase() !== "set-cookie") headers[name] = value;
  const contentType=String(response.headers.get("content-type")||"").toLowerCase(); if(["text/html","javascript","text/css","application/json"].some(t=>contentType.includes(t))){headers["cache-control"]="no-store, no-cache, must-revalidate, max-age=0";headers.pragma="no-cache";headers.expires="0";}
  const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  if (cookies.length) headers["set-cookie"] = cookies;
  outgoing.writeHead(response.status, headers);
  if (response.body) outgoing.end(Buffer.from(await response.arrayBuffer())); else outgoing.end();
}
async function healthResponse() {
  const checks = { database: false, redis: runtime.redis ? false : null, storage: false };
  try { const row = await runtime.env.DB.prepare("SELECT 1 AS ok").first(); checks.database = Number(row?.ok || 0) === 1; } catch {}
  try { if (runtime.redis) checks.redis = (await runtime.redis.ping()) === "PONG"; } catch {}
  try { await access(runtime.info.storageDirectory, fsConstants.R_OK | fsConstants.W_OK); checks.storage = true; } catch {}
  const ok = checks.database && checks.storage && checks.redis !== false;
  return Response.json({ ok, product: VNTECH_IDENTITY.productId, version: VNTECH_IDENTITY.version, build: releaseBuild, package: packageId, uiContract: uiContractId, deployment: runtime.info, trust: { mode: trustState.mode, enforcementEnabled: trustState.enforced, licenseStatus: trustState.license.status, machineFingerprint: trustState.machineFingerprint, privateKeyPresent: false }, checks, time: new Date().toISOString() }, { status: ok ? 200 : 503, headers: { "Cache-Control":"no-store" } });
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const request = await toRequest(incoming); const url = new URL(request.url); const pathname = url.pathname;
    if (pathname === "/healthz" || pathname === "/api/health") return await sendResponse(outgoing, await healthResponse());
    let loginMeta = null;
    if (pathname === "/api/system" && request.method === "POST") {
      try {
        const body = await request.clone().json();
        if (body?.action === "login") {
          const key = await loginKey(request, body);
          if (await failureCount(key) >= 10) return await sendResponse(outgoing, Response.json({ ok:false, error:"Tạm khóa đăng nhập 15 phút do nhập sai quá nhiều lần." }, { status:429 }));
          loginMeta = { key };
        }
      } catch {}
    }
    let response;
    if (pathname === "/api/system") {
      if (request.method === "GET" || request.method === "HEAD") response = await systemRoute.GET(request);
      else if (request.method === "POST") response = await systemRoute.POST(request);
      else response = new Response("Method Not Allowed", { status:405 });
    } else if (pathname === "/api/files") {
      // MASTER BASELINE SSOT: execute the same built app/api/files route used by tests/cloud runtime.
      response = await worker.fetch(request, runtime.env, executionContext);
    }
    if (!response && (request.method === "GET" || request.method === "HEAD")) {
      const assetResponse = await runtime.env.ASSETS.fetch(request); if (assetResponse.status !== 404) response = assetResponse;
    }
    response ??= await worker.fetch(request, runtime.env, executionContext);
    if (loginMeta) { if (response.status === 401) await registerFailure(loginMeta.key); else if (response.ok) await clearFailures(loginMeta.key); }
    await sendResponse(outgoing, response);
    void dispatchEmailOutbox(runtime.env.DB, runtime.emailSecret);
  } catch (error) {
    console.error(error); if (!outgoing.headersSent) outgoing.writeHead(500, { "Content-Type":"text/plain; charset=utf-8" }); outgoing.end("Lỗi máy chủ VNTECH ERP. Xem log may chu de biet chi tiet.");
  }
});
server.on("error", async (error) => { console.error(`Khong mo duoc cong ${port}: ${error.message}`); await runtime.close(); process.exit(1); });
server.listen(port, host, () => {
  console.log(`VNTECH ERP V${VNTECH_IDENTITY.version} UNIVERSAL CENTRAL SERVER DA SAN SANG`);
  console.log(`Chu so huu: ${VNTECH_IDENTITY.legalOwner}`); console.log(`Che do: ${runtime.info.mode}`); console.log(`Database: ${runtime.info.engine}`); console.log(`Storage: ${runtime.info.storageDirectory}`); console.log(`Port: ${port}`);
  console.log(`Trust Lock: ${trustState.mode} · enforcement=${trustState.enforced ? "enabled" : "disabled-by-design"} · license=${trustState.license.status}`);
  if (runtime.info.publicUrl) console.log(`Dia chi su dung: ${runtime.info.publicUrl}`); else console.log(`Dia chi noi bo: http://<IP-MAY-CHU>:${port}`);
});
const emailTimer = setInterval(() => { void dispatchEmailOutbox(runtime.env.DB, runtime.emailSecret); }, 30000);
async function shutdown() { clearInterval(emailTimer); server.close(async () => { await runtime.close(); process.exit(0); }); }
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
