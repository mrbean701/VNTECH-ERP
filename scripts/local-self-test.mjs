import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createLocalRuntime } from "./local-runtime.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = await mkdtemp(join(tmpdir(), "mep-warehouse-test-"));
const runtime = createLocalRuntime(projectRoot, dataDirectory);

try {
  globalThis.__MEP_LOCAL_ENV__ = runtime.env;
  await runtime.env.BUCKET.put("__r11-delete-self-test__", new TextEncoder().encode("VNTECH"));
  assert(await runtime.env.BUCKET.get("__r11-delete-self-test__"));
  await runtime.env.BUCKET.delete("__r11-delete-self-test__");
  assert.equal(await runtime.env.BUCKET.get("__r11-delete-self-test__"), null);
  const workerUrl = pathToFileURL(resolve(projectRoot, "dist", "server", "index.js"));
  workerUrl.searchParams.set("local-self-test", `${process.pid}-${Date.now()}`);
  const worker = (await import(workerUrl.href)).default;
  const ctx = { passThroughOnException() {}, waitUntil() {} };

  const home = await worker.fetch(new Request("http://localhost:8787/"), runtime.env, ctx);
  assert.equal(home.status, 200);

  const templateChecks = [
    ["/Mau_nhap_phieu_de_nghi_mua_hang.xlsx", "xlsx"],
    ["/templates/Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.xlsx", "xlsx"],
    ["/templates/Mau_BOQ_Hop_Dong_VNTECH.xlsx", "xlsx"],
    ["/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.xlsx", "xlsx"],
    ["/templates/Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.csv", "csv"],
    ["/templates/Mau_BOQ_Hop_Dong_VNTECH.csv", "csv"],
    ["/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv", "csv"],
  ];
  for (const [path, kind] of templateChecks) {
    const response = await runtime.env.ASSETS.fetch(new Request(`http://localhost:8787${path}`));
    assert.equal(response.status, 200, `Template not served: ${path}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (kind === "xlsx") {
      assert(bytes.length > 10000, `XLSX too small: ${path}`);
      assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4b);
    } else {
      const text = new TextDecoder().decode(bytes);
      assert(text.includes("sep=;"), `CSV delimiter marker missing: ${path}`);
      assert(text.split(/\r?\n/).length >= 3, `CSV content missing: ${path}`);
    }
  }

  const before = await worker.fetch(new Request("http://localhost:8787/api/system"), runtime.env, ctx);
  assert.equal(before.status, 200);
  const beforeData = await before.json();
  assert.equal(beforeData.setupRequired, true);

  const setup = await worker.fetch(new Request("http://localhost:8787/api/system", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "setup", companyName: "Cong ty kiem thu", fullName: "Quan tri kiem thu", username: "admin", password: "TestKho@2026!" }),
  }), runtime.env, ctx);
  assert.equal(setup.status, 201);
  const cookie = setup.headers.get("set-cookie")?.split(";")[0];
  assert(cookie);

  const after = await worker.fetch(new Request("http://localhost:8787/api/system", { headers: { Cookie: cookie } }), runtime.env, ctx);
  assert.equal(after.status, 200);
  const afterData = await after.json();
  assert.equal(afterData.data.projects.length, 0);
  assert.equal(afterData.data.teams.length, 0);
  assert(afterData.data.warehouses.some((row) => row.type === "central"));
  assert(afterData.data.moduleCatalog.some((row) => row.moduleKey === "central_warehouse"));
  assert(afterData.data.materialCategories.length > 0);
  console.log("KIEM TRA DAT: giao dien, SQLite cuc bo, dang nhap, Kho Tong va danh muc he thong khoi tao sach.");
} finally {
  delete globalThis.__MEP_LOCAL_ENV__;
  runtime.close();
  await rm(dataDirectory, { recursive: true, force: true });
}
