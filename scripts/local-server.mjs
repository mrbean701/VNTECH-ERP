// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createLocalRuntime } from "./local-runtime.mjs";
import { dispatchEmailOutbox } from "./email-dispatcher.mjs";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = resolve(projectRoot, ".local-data");
const runtime = createLocalRuntime(projectRoot, dataDirectory);

if (process.argv.includes("--initialize-only")) {
  runtime.close();
  console.log("Da khoi tao co so du lieu cuc bo: DAT.");
  process.exit(0);
}

globalThis.__MEP_LOCAL_ENV__ = runtime.env;
const workerUrl = pathToFileURL(resolve(projectRoot, "dist", "server", "index.js"));
workerUrl.searchParams.set("local-server", `${process.pid}-${Date.now()}`);
const worker = (await import(workerUrl.href)).default;
const systemRouteUrl = pathToFileURL(resolve(projectRoot, "scripts", "system-route.mjs"));
systemRouteUrl.searchParams.set("local-server", `${process.pid}-${Date.now()}`);
const systemRoute = await import(systemRouteUrl.href);
const executionContext = {
  passThroughOnException() {},
  waitUntil(promise) { Promise.resolve(promise).catch((error) => console.error(error)); },
};

async function toRequest(incoming) {
  const host = incoming.headers.host || "localhost:8787";
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  const method = incoming.method || "GET";
  const chunks = [];
  if (method !== "GET" && method !== "HEAD") {
    for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
  }
  return new Request(`http://${host}${incoming.url || "/"}`, {
    method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
}

async function sendResponse(outgoing, response) {
  const headers = {
    "x-vntech-product-id": VNTECH_IDENTITY.productId,
    "x-vntech-source-fingerprint": VNTECH_IDENTITY.sourceFingerprintShort,
    "x-vntech-owner": encodeURIComponent(VNTECH_IDENTITY.legalOwner),
    "x-vntech-version": VNTECH_IDENTITY.version,
  };
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() !== "set-cookie") headers[name] = value;
  }
  const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  if (cookies.length) headers["set-cookie"] = cookies;
  outgoing.writeHead(response.status, headers);
  if (response.body) outgoing.end(Buffer.from(await response.arrayBuffer()));
  else outgoing.end();
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const request = await toRequest(incoming);
    let response;
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/system") {
      if (request.method === "GET" || request.method === "HEAD") response = await systemRoute.GET(request);
      else if (request.method === "POST") response = await systemRoute.POST(request);
      else response = new Response("Method Not Allowed", { status: 405 });
    } else if (pathname === "/api/files") {
      // MASTER BASELINE SSOT: execute the same built app/api/files route used by tests/cloud runtime.
      response = await worker.fetch(request, runtime.env, executionContext);
    }
    if (!response && (request.method === "GET" || request.method === "HEAD")) {
      const assetResponse = await runtime.env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) response = assetResponse;
    }
    response ??= await worker.fetch(request, runtime.env, executionContext);
    await sendResponse(outgoing, response);
    void dispatchEmailOutbox(runtime.env.DB, runtime.emailSecret);
  } catch (error) {
    console.error(error);
    if (!outgoing.headersSent) outgoing.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    outgoing.end("Loi may chu noi bo. Xem cua so khoi dong de biet chi tiet.");
  }
});

server.on("error", (error) => {
  console.error(`Khong mo duoc cong 8787: ${error.message}`);
  runtime.close();
  process.exit(1);
});

server.listen(8787, "0.0.0.0", () => {
  console.log(`VNTECH ERP V${VNTECH_IDENTITY.version} DA SAN SANG`);
  console.log(`Chu so huu: ${VNTECH_IDENTITY.legalOwner}`);
  console.log(`Product ID: ${VNTECH_IDENTITY.productId}`);
  console.log(`Fingerprint: ${VNTECH_IDENTITY.sourceFingerprintShort}`);
  console.log("Dia chi tren PC nay: http://localhost:8787");
});

const emailTimer = setInterval(() => { void dispatchEmailOutbox(runtime.env.DB, runtime.emailSecret); }, 30000);

function shutdown() {
  clearInterval(emailTimer);
  server.close(() => {
    runtime.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
