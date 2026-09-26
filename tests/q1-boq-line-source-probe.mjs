// PROBE CHỈ-ĐỌC (TASK-122 · Q1 phương án A) — ĐO TRƯỜNG THẬT của một DÒNG BOQ trong payload bootstrap.
//
// Mục đích: trả lời bằng DỮ LIỆU THẬT (không suy đoán) câu hỏi:
//   «Dòng BOQ thật có `boqCode` / `contractLineRef` / `lineNo` / `code` không, và giá trị của chúng là gì?»
// Tuyệt đối KHÔNG ghi dữ liệu: chỉ POST `login` + `GET /api/system`.
//
//   node --import tsx tests/q1-boq-line-source-probe.mjs [base] [user] [pass]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";

console.log(`═══ PROBE NGUỒN MÃ DÒNG BOQ (chỉ đọc) — ${BASE} ═══`);
let cookie = "";
try {
  const login = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username: USER, password: PASS }),
  });
  cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  console.log(`login: HTTP ${login.status} · cookie=${cookie ? "có" : "KHÔNG"}`);
} catch (error) {
  console.log(`login LỖI: ${error?.message || error}`);
  process.exit(2);
}
let data;
try {
  const res = await fetch(`${BASE}/api/system`, { headers: cookie ? { Cookie: cookie } : {} });
  const body = await res.json();
  data = body?.data || body;
  console.log(`GET /api/system: HTTP ${res.status}`);
} catch (error) {
  console.log(`GET /api/system LỖI: ${error?.message || error}`);
  process.exit(2);
}

const rows = Array.isArray(data?.boqItems) ? data.boqItems : [];
console.log(`boqItems: ${rows.length} dòng`);
if (!rows.length) {
  console.log("⇒ KHÔNG có dòng BOQ nào trong payload ⇒ không đo được nguồn mã.");
  process.exit(3);
}

// Lưu BẰNG CHỨNG nguyên văn (UTF-8, do Node ghi — KHÔNG dùng PowerShell vì tiếng Việt) để test hợp đồng
// `tests/q1-boq-export-display.test.mjs` đo được trên ĐÚNG dữ liệu thật khi dịch vụ tắt.
if (process.env.Q1_WRITE_FIXTURE === "1") {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(new URL("./q1-boq-lines-payload.json", import.meta.url), JSON.stringify(rows, null, 1) + "\n", "utf8");
  console.log("→ đã ghi bằng chứng: tests/q1-boq-lines-payload.json");
}

const KEYS = ["id", "code", "boqCode", "lineRef", "contractLineRef", "no", "lineNo", "sourceOrder", "sourceRow", "contractCode", "materialCode", "contractMaterialCode", "internalMaterialCode", "systemCode", "materialName", "rowRole", "sourceItemId"];
console.log(`\n1) Sự CÓ MẶT của từng trường trên ${rows.length} dòng (đếm giá trị KHÁC RỖNG):`);
for (const key of KEYS) {
  const present = rows.filter((row) => Object.prototype.hasOwnProperty.call(row, key)).length;
  const nonEmpty = rows.filter((row) => row?.[key] !== null && row?.[key] !== undefined && String(row[key]).trim() !== "").length;
  const sample = rows.map((row) => row?.[key]).find((value) => value !== null && value !== undefined && String(value).trim() !== "");
  console.log(`   ${key.padEnd(24)} có-mặt=${String(present).padStart(4)}  khác-rỗng=${String(nonEmpty).padStart(4)}  ví-dụ=${sample === undefined ? "—" : JSON.stringify(String(sample).slice(0, 60))}`);
}

console.log(`\n2) TẬP KHOÁ ĐẦY ĐỦ của dòng BOQ (hợp của mọi dòng, ${new Set(rows.flatMap((row) => Object.keys(row))).size} khoá):`);
console.log(`   ${[...new Set(rows.flatMap((row) => Object.keys(row)))].sort().join(", ")}`);

console.log("\n3) 3 DÒNG ĐẦU — nguyên văn (đã lược `customFields` cho gọn):");
for (const row of rows.slice(0, 3)) {
  const { customFields, ...rest } = row;
  console.log(`   ${JSON.stringify(rest, null, 0).slice(0, 900)}`);
  console.log(`      customFields=${JSON.stringify(customFields)}`);
}

console.log(`\n4) KIỂM TRA «có nguồn mã nghiệp vụ không» theo đúng thứ tự ưu tiên của TASK-122:`);
const chain = ["code", "boqCode", "lineRef", "contractLineRef", "no"];
for (const key of chain) {
  const nonEmpty = rows.filter((row) => row?.[key] !== null && row?.[key] !== undefined && String(row[key]).trim() !== "").length;
  console.log(`   ${key.padEnd(24)} → ${nonEmpty}/${rows.length} dòng có giá trị`);
}
const noSource = rows.filter((row) => chain.every((key) => row?.[key] === null || row?.[key] === undefined || String(row[key]).trim() === "")).length;
console.log(`   DÒNG KHÔNG CÓ NGUỒN MÃ NÀO trong chuỗi ưu tiên: ${noSource}/${rows.length}`);
const guidLike = rows.filter((row) => /^(BOQ|BQS|MR|PO|GRN)_/.test(String(row?.id ?? ""))).length;
console.log(`   Dòng có \`id\` dạng <PREFIX>_<GUID> (GUID thô đang bị xuất ra): ${guidLike}/${rows.length}`);
console.log("\n═══ HẾT PROBE (không ghi dữ liệu) ═══");
