#!/usr/bin/env node
/**
 * VNTECH ERP — Khung Contract Test Harness (Giai đoạn 0, mục 5).
 *
 * Ý tưởng (theo docs/09 §6):
 *   1. Golden mode: chạy JS reference (server JS với DB SQLite test) cùng 1 tập input
 *      (bootstrap, action...), ghi response JSON thành golden snapshot.
 *   2. Compare mode: chạy Java backend với cùng input trên MySQL test, deep-compare JSON
 *      với golden (bỏ qua trường động: thời gian, id sinh mới... qua key normalize).
 *
 * Ở phase 0, file này dựng khung + 2 ví dụ thật (bootstrap shape trên file fixture)
 * để nhóm dev bổ sung từng action khi slice được migrate. Chạy bằng Node, không cần Maven.
 *
 * Một snapshot gồm: { input, response } — response là JSON thô từ reference.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const javaBackend = resolve(__dirname, "..");
const snapshotsDir = join(javaBackend, "contract-tests", "snapshots");
const runnerDir = join(javaBackend, "contract-tests");

mkdirSync(snapshotsDir, { recursive: true });

const mode = process.argv[2] || "help";
const fixture = process.argv[3];

/** So khớp JSON, bỏ qua key động theo selector. */
function normalize(value, state, path = "$") {
  if (Array.isArray(value)) return value.map((v, i) => normalize(v, state, `${path}[${i}]`));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const keyPath = `${path}.${k}`;
      if (state.ignoreKeys.some((r) => r.test(keyPath))) { out[k] = "<IGNORED>"; continue; }
      out[k] = normalize(v, state, keyPath);
    }
    return out;
  }
  return value;
}

const IGNORABLE = [
  /\.(createdAt|updatedAt|createdat|occurredAt|receivedAt|issuedAt|requestedAt|neededAt|dueAt|queuedAt|decidedAt|notifiedAt|reminderSentAt|plannedDeliveryAt|orderedAt|deliveryQueuedAt|deliveryCompletedAt|approvedAt|lastSeenAt|expiresAt|expiresat|reportedAt|recordedAt)$/,
  /\.(id|ids|userid|ownerUserId|approverUserId|assignedTo|assignedBy|requestedBy|approvedBy|createdBy|updatedBy)$/,
  /\.name$/,
  /\$\.data\.(time|serverTime)$/,
  /\$\.data\.user\.(id|avatarUrl|userid)$/,
];

function loadJson(p) { return JSON.parse(readFileSync(p, "utf8")); }

const commands = {
  /** mvnw test-like: kiểm tra khung hoạt động (không cần backend). */
  selfcheck() {
    const sample = { ok: true, authenticated: true, data: { projects: [{ id: "x", createdAt: "2026-01-01T00:00:00Z" }] } };
    const normal = normalize(sample, { ignoreKeys: IGNORABLE });
    if (normal.data.projects[0].createdAt !== "<IGNORED>") throw new Error("normalize lỗi");
    console.log("selfcheck OK — harness sẵn sàng; thêm snapshot thật khi migrate slice.");
  },

  /** Sinh golden snapshot từ fixture JSON { inputs: [...], fetch: mock } — placeholder tới khi có bridge JS. */
  "record:fixture"() {
    if (!fixture) throw new Error("cần path fixture: node contract-harness.mjs record:fixture <file>");
    const fx = loadJson(fixture);
    const name = join(snapshotsDir, `${fx.name || "snapshot"}.json`);
    writeFileSync(name, JSON.stringify(fx, null, 2));
    console.log(`golden snapshot -> ${name}`);
  },

  /**
   * record:live — chạy CHUỖI action thật lên Java backend đang chạy (HTTP)
   * và ghi golden snapshot (ignore timestamps). Dùng sau khi boot
   * `java -jar ... --spring.profiles.active=dev` (cổng mặc định 18080).
   *   node contract-harness.mjs record:live [baseUrl] [snapshotName]
   */
  async "record:live"() {
    const base = process.argv[3] || "http://127.0.0.1:18080";
    const name = process.argv[4] || "live-default";
    let cookie = "";
    const call = async (action, body = {}) => {
      const res = await fetch(`${base}/api/system`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify({ action, ...body }),
      });
      const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (setCookie.length) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
      let json;
      try { json = await res.json(); } catch { json = { raw: await res.text() }; }
      return { status: res.status, response: json };
    };
    const get = async () => {
      const res = await fetch(`${base}/api/system`, { headers: cookie ? { Cookie: cookie } : {} });
      return { status: res.status, response: await res.json() };
    };
    const snap = { name, baseUrl: base, recordedAt: new Date().toISOString(), steps: [] };
    snap.steps.push({ step: "pre-setup GET", ...await get() });
    snap.steps.push({ step: "setup", ...await call("setup", { companyName: "CTY", fullName: "ADMIN", username: "admin", password: "VnTech@123" }) });
    snap.steps.push({ step: "login", ...await call("login", { username: "admin", password: "VnTech@123" }) });
    snap.steps.push({ step: "bootstrap", ...await get() });
    const out = join(snapshotsDir, `${name}.json`);
    writeFileSync(out, JSON.stringify(snap, null, 2));
    console.log(`✅ record:live -> ${out} (${snap.steps.length} bước)`);
  },

  /**
   * record:live-chain — như record:live nhưng thêm chuỗi action master thật
   * (không cần seed — tự tạo qua API): project, material category, material.
   * Kiểm chứng nhiều action hơn trên runtime + so sánh được qua `compare`.
   *   node contract-harness.mjs record:live-chain [baseUrl] [snapshotName]
   */
  async "record:live-chain"() {
    const base = process.argv[3] || "http://127.0.0.1:18080";
    const name = process.argv[4] || "live-chain";
    let cookie = "";
    const call = async (action, body = {}) => {
      const res = await fetch(`${base}/api/system`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        body: JSON.stringify({ action, ...body }),
      });
      const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (setCookie.length) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
      let json;
      try { json = await res.json(); } catch { json = { raw: await res.text() }; }
      return { status: res.status, response: json };
    };
    const get = async () => {
      const res = await fetch(`${base}/api/system`, { headers: cookie ? { Cookie: cookie } : {} });
      return { status: res.status, response: await res.json() };
    };
    const chain = [
      ["create_project", { projectId: "p_harness", name: "Dự án Harness", code: "HARN1", active: true, startDate: "2026-09-01" }],
      ["save_project_contract", { projectId: "p_harness", contractNo: "HD-H1", contractName: "Hợp đồng Harness", contractType: "main", isPrimary: true }],
      ["save_material", { code: "M-LIVE", name: "Vật tư Live", unit: "cái", system: "DIEN", standardPrice: 10000 }],
      ["save_material_category", { code: "NL", name: "Nguyên liệu" }],
      ["save_boq_version", { projectId: "p_harness", contractId: "{{contractId}}", versionCode: "V1", makeActive: true }],
      ["save_boq_item", { projectId: "p_harness", contractId: "{{contractId}}", boqVersionId: "{{boqVersionId}}", materialName: "Vật tư Live", unit: "cái", contractQty: 50, sourceOrder: 1, internalMaterialCode: "M-LIVE", rowRole: "material" }],
      ["save_email_settings", { enabled: false }],
      ["factory_reset_preview", {}],
    ];
    const snap = { name, baseUrl: base, recordedAt: new Date().toISOString(), steps: [] };
    const ctx = {};
    snap.steps.push({ step: "pre-setup GET", ...await get() });
    snap.steps.push({ step: "setup", ...await call("setup", { companyName: "CTY", fullName: "ADMIN", username: "admin", password: "VnTech@123" }) });
    snap.steps.push({ step: "login", ...await call("login", { username: "admin", password: "VnTech@123" }) });
    for (const [action, rawBody] of chain) {
      const body = JSON.parse(JSON.stringify(rawBody));
      const fill = (o) => {
        for (const k of Object.keys(o)) {
          if (typeof o[k] === "string" && o[k].startsWith("{{") && ctx[o[k].slice(2, -2)]) o[k] = ctx[o[k].slice(2, -2)];
          else if (o[k] && typeof o[k] === "object") fill(o[k]);
        }
      };
      fill(body);
      const step = { step: action, ...await call(action, body) };
      snap.steps.push(step);
      // capture id phổ biến cho bước sau
      for (const key of ["projectId", "contractId", "boqVersionId", "requestId", "poId", "receiptId"])
        if (step.response && step.response[key] && !ctx[key]) ctx[key] = String(step.response[key]);
    }
    snap.steps.push({ step: "bootstrap", ...await get() });
    const out = join(snapshotsDir, `${name}.json`);
    writeFileSync(out, JSON.stringify(snap, null, 2));
    console.log(`✅ record:live-chain -> ${out} (${snap.steps.length} bước)`);
  },

  /** So sánh một response Java với golden (deep-compare có ignore). */
  compare() {
    const [goldenPath, actualPath] = [fixture, process.argv[4]].map((p) => resolve(p));
    const golden = loadJson(goldenPath);
    const actual = loadJson(actualPath);
    const state = { ignoreKeys: IGNORABLE };
    const g = normalize(golden.response ?? golden, state);
    const a = normalize(actual.response ?? actual, state);
    const gs = JSON.stringify(g, null, 2);
    const as = JSON.stringify(a, null, 2);
    if (gs === as) { console.log("✅ CONTRACT OK"); return; }
    console.log("❌ CONTRACT DIFF:");
    // diff dòng đơn giản
    const gl = gs.split("\n"), al = as.split("\n");
    for (let i = 0; i < Math.max(gl.length, al.length); i++) {
      if (gl[i] !== al[i]) {
        console.log(`  golden[${i}]: ${gl[i] ?? "(end)"}`);
        console.log(`  actual[${i}]: ${al[i] ?? "(end)"}`);
        if (i > 40) { console.log("  ... (cắt)"); break; }
      }
    }
  },

  help() {
    console.log(`VNTECH ERP Contract Harness
  node contract-harness.mjs selfcheck
  node contract-harness.mjs record:fixture <fixture.json>
  node contract-harness.mjs record:live [baseUrl] [snapshotName]
  node contract-harness.mjs record:live-chain [baseUrl] [snapshotName]
  node contract-harness.mjs compare <golden.json> <actual.json>
Harness dir: ${runnerDir}`);
  },
};

const fn = commands[mode] || commands.help;
fn();
process.stdout.write(existsSync(snapshotsDir) ? `\nsnapshots: ${snapshotsDir}\n` : "");