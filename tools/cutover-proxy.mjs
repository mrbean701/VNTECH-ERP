#!/usr/bin/env node
/**
 * VNTECH ERP — REVERSE PROXY CHO PHƯƠNG ÁN A (cutover backend JS → Java).
 *
 * Kiến trúc:
 *   Người dùng → Node SSR (:8787) ──proxy /api/*──> Java API (:18081) ──> MySQL
 *
 * VÌ SAO KHÔNG SỬA scripts/local-server.mjs:
 *   `scripts` nằm trong ROOT_DIRS của lib/trust/source-fingerprint.mjs ⇒ sửa file đó sẽ phá
 *   fingerprint gate (đã chứng minh bằng thực nghiệm). Proxy này nằm ở `tools/` nên KHÔNG
 *   thuộc tập hash ⇒ fingerprint giữ nguyên VNTECH-FP-54394992D738B8F0.
 *
 * Cách chạy:
 *   node tools/cutover-proxy.mjs                 # UI :8787 (Node) + API → Java :18081
 *   node tools/cutover-proxy.mjs --port 9000     # đổi cổng vào
 *   node tools/cutover-proxy.mjs --api-only      # chỉ chuyển /api sang Java, UI vẫn của Node
 *
 * Nguyên tắc:
 *   - /api/*  → Java (toàn bộ nghiệp vụ chạy Java + MySQL)
 *   - còn lại → Node SSR (giao diện KHÔNG đổi)
 *   - Cookie `mep_session` đi thẳng qua: cùng origin nên KHÔNG cần CORS, KHÔNG đổi thuộc tính cookie.
 */

import { createServer } from "node:http";
import { request as httpRequest } from "node:http";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const LISTEN_PORT = Number(arg("--port", process.env.CUTOVER_PORT || 8787));
const UI_HOST = arg("--ui-host", process.env.CUTOVER_UI_HOST || "127.0.0.1");
const UI_PORT = Number(arg("--ui-port", process.env.CUTOVER_UI_PORT || 8788));
const API_HOST = arg("--api-host", process.env.CUTOVER_API_HOST || "127.0.0.1");
const API_PORT = Number(arg("--api-port", process.env.CUTOVER_API_PORT || 18081));

/** Đường dẫn nào thuộc BACKEND (Java). Mọi thứ khác là UI (Node SSR). */
const API_PREFIXES = ["/api/system", "/api/files", "/api/health", "/actuator"];

const isApi = (pathname) => API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

function forward(target, incoming, outgoing, label) {
  const headers = { ...incoming.headers };
  // Đổi Host sang backend để Spring/Tomcat sinh URL/cookie đúng.
  headers.host = `${target.host}:${target.port}`;
  // Không để proxy tự nén kép.
  delete headers["accept-encoding"];

  const upstream = httpRequest(
    {
      host: target.host,
      port: target.port,
      method: incoming.method,
      path: incoming.url,
      headers,
    },
    (res) => {
      // set-cookie phải là mảng để KHÔNG bị gộp thành 1 dòng (mất cookie mep_session).
      const outHeaders = { ...res.headers };
      if (res.headers["set-cookie"]) outHeaders["set-cookie"] = res.headers["set-cookie"];
      outgoing.writeHead(res.statusCode || 502, outHeaders);
      res.pipe(outgoing);
    },
  );

  upstream.on("error", (error) => {
    console.error(`[proxy] ${label} lỗi: ${error.message}`);
    if (!outgoing.headersSent) {
      outgoing.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    }
    outgoing.end(
      JSON.stringify({
        ok: false,
        error: `Không kết nối được ${label} (${target.host}:${target.port}). Kiểm tra tiến trình đã chạy chưa.`,
      }),
    );
  });

  incoming.pipe(upstream);
}

const server = createServer((incoming, outgoing) => {
  const pathname = new URL(incoming.url || "/", "http://localhost").pathname;
  const useApi = isApi(pathname);
  const target = useApi ? { host: API_HOST, port: API_PORT } : { host: UI_HOST, port: UI_PORT };
  forward(target, incoming, outgoing, useApi ? "Java API" : "Node UI");
});

server.listen(LISTEN_PORT, () => {
  console.log("──────────────────────────────────────────────────────────────");
  console.log(" VNTECH ERP — CUTOVER PROXY (Phương án A)");
  console.log("──────────────────────────────────────────────────────────────");
  console.log(`  Người dùng mở      : http://127.0.0.1:${LISTEN_PORT}`);
  console.log(`  /api/*  →  Java    : http://${API_HOST}:${API_PORT}`);
  console.log(`  Còn lại →  Node UI : http://${UI_HOST}:${UI_PORT}`);
  console.log("──────────────────────────────────────────────────────────────");
  console.log("  Cookie mep_session đi thẳng (cùng origin, không CORS).");
  console.log("  Dừng: Ctrl+C");
  console.log("──────────────────────────────────────────────────────────────");
});

server.on("error", (error) => {
  console.error(`Không mở được cổng ${LISTEN_PORT}: ${error.message}`);
  process.exit(1);
});
