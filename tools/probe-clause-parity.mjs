// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-063 — CỔNG ĐỐI CHIẾU MỆNH ĐỀ: `ORDER BY` · `LIMIT` · KIỂU `JOIN`
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO CÓ CỔNG NÀY (Known Problems #61/#63): `probe-column-parity.mjs` so **TẬP CỘT** và đã về 0
// thiếu cột — nhưng trong lúc vá TASK-062 tôi phát hiện **3 ca sai nặng mà cổng cột HOÀN TOÀN MÙ**:
//   • `boqImportBatches`  — Java sắp `created_at DESC`, JS sắp `project_id,contract_id,version_no DESC`
//   • `boqChangeHistory`  — Java thiếu tiebreaker `h.id DESC` và thiếu `LIMIT 1000`
//   • `workflowAssignments` — JS **chỉ admin** mới trả (`isAdmin ? … : []`), Java trả cho MỌI vai trò ⇒ RÒ RỈ
// Ba ca đó phải đọc thẳng JS mới thấy. Cổng này biến việc "đọc thẳng" thành phép đo lặp lại được.
//
// ĐỐI CHỨNG CỦA CHÍNH BỘ SO SÁNH (bắt buộc, vì đây là suy luận văn bản):
//   cặp SQL DỰNG SẴN đã biết đáp án ⇒ phải báo ĐÚNG (4 ca khác nhau ⇒ phải bắt) và KHÔNG báo oan
//   (1 ca chỉ khác định dạng/alias ⇒ phải im). Nếu đối chứng hỏng, cổng KHÔNG cho kết luận.
//
// GIỚI HẠN (ghi rõ, không giấu):
//   • Bỏ TIỀN TỐ BẢNG trong `ORDER BY` (`h.created_at` ⇒ `created_at`) nên **có thể che** lệch bảng.
//   • Chỉ so câu **ĐẦU TIÊN** mỗi phía khi một khoá có nhiều câu (in rõ số câu).
//   • KHÔNG kiểm mệnh đề `WHERE` (quá nhiều cách viết tương đương) — vẫn là vùng MÙ, ghi ở Known Problems.
//   • Không so được khoá mà JS không có SQL tương ứng hoặc khoá ghép động.
//
// Chạy: node tools/probe-clause-parity.mjs [--key <tên>]
import {
  loadJsSqlByKey, loadJavaSqlByKey, orderByOf, limitOf, joinDiffs,
} from "./lib/sql-parity-extract.mjs";

/** Khoá GHÉP (SQL đến từ nhiều biến) — phải khai TƯỜNG MINH, xem bài học #103. */
const JAVA_KEY_SQL_VARS = { boqItems: ["boqMainRows", "unmappedBoqRows"] };

// ═══════════════════════════ 1. ĐỐI CHỨNG CỦA BỘ SO SÁNH ═══════════════════════════
// Mỗi ca là [tên, SQL A, SQL B, có phải báo KHÁC nhau không?]
const SELFTEST = [
  ["chỉ khác ĐỊNH DẠNG + alias ⇒ phải IM",
    "SELECT a.x,a.y FROM t a JOIN u b ON b.id=a.id ORDER BY a.x DESC LIMIT 10",
    "select  a.x, a.y\n  from t a\n  join u b on b.id=a.id\n order by x desc limit 10", false],
  ["LIMIT khác (10 ↔ 500) ⇒ phải BẮT",
    "SELECT a.x FROM t a ORDER BY a.x DESC LIMIT 10",
    "SELECT a.x FROM t a ORDER BY a.x DESC LIMIT 500", true],
  ["CHIỀU sắp xếp khác (DESC ↔ ASC) ⇒ phải BẮT",
    "SELECT a.x FROM t a ORDER BY a.x DESC",
    "SELECT a.x FROM t a ORDER BY a.x ASC", true],
  ["CỘT sắp xếp khác ⇒ phải BẮT",
    "SELECT a.x FROM t a ORDER BY a.created_at",
    "SELECT a.x FROM t a ORDER BY a.occurred_at", true],
  ["MỘT PHÍA THIẾU tiebreaker ⇒ phải BẮT",
    "SELECT h.id FROM h ORDER BY h.created_at DESC,h.id DESC LIMIT 1000",
    "SELECT h.id FROM h ORDER BY h.created_at DESC LIMIT 1000", true],
  ["JOIN ↔ LEFT JOIN ⇒ phải BẮT",
    "SELECT a.x FROM apa JOIN users u ON u.id=apa.owner ORDER BY apa.stage",
    "SELECT a.x FROM apa LEFT JOIN users u ON u.id=apa.owner ORDER BY apa.stage", true],
];

/**
 * `LIMIT` HIỆU DỤNG: `first(...)` của CẢ HAI lõi nghĩa là "lấy 1 dòng" (JS `await first(...)`,
 * Java `first("""…""")`) ⇒ khi câu SQL không ghi `LIMIT` tường minh thì hiệu dụng là 1.
 * ⚠️ DƯƠNG TÍNH GIẢ đã gặp: `productIdentity` — JS dùng `first(...)` (không LIMIT), Java ghi `LIMIT 1`
 * ⇒ bản đầu cổng báo lệch dù hai bên CÙNG lấy 1 dòng. Đã xử ở đây, KHÔNG sửa mã theo số sai.
 */
function comparePair(a, b, aFirst = false, bFirst = false) {
  const problems = [];
  const oa = orderByOf(a), ob = orderByOf(b);
  if ((oa ?? null) !== (ob ?? null)) problems.push("ORDER BY");
  const effLimit = (s, viaFirst) => { const l = limitOf(s); return l === null && viaFirst ? 1 : l; };
  if (effLimit(a, aFirst) !== effLimit(b, bFirst)) problems.push("LIMIT");
  if (joinDiffs([a], [b]).length) problems.push("JOIN");
  return problems;
}

const effLimitOf = (s, viaFirst) => { const l = limitOf(s); return l === null && viaFirst ? 1 : l; };

console.log("═══ ĐỐI CHỨNG CỦA BỘ SO SÁNH (dựng sẵn, biết trước đáp án) ═══");
let selftestOk = true;
for (const [name, a, b, shouldDiffer] of SELFTEST) {
  const problems = comparePair(a, b);
  const ok = shouldDiffer ? problems.length > 0 : problems.length === 0;
  if (!ok) selftestOk = false;
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${problems.length ? ` — bắt: ${problems.join(", ")}` : " — không báo gì"}`);
}
if (!selftestOk) {
  console.log("\n⚠️ BỘ SO SÁNH HỎNG ĐỐI CHỨNG ⇒ MỌI KẾT LUẬN BÊN DƯỚI KHÔNG ĐÁNG TIN.");
  process.exit(1);
}

// ═══════════════════════════ 2. ĐỌC HAI NGUỒN ═══════════════════════════
const { jsByKey, jsFirstByKey } = loadJsSqlByKey();
const { javaByKey, javaFirstByKey, javaVarNamesSeen } = loadJavaSqlByKey(JAVA_KEY_SQL_VARS);

const keyArgIdx = process.argv.indexOf("--key");
if (keyArgIdx >= 0) {
  const key = process.argv[keyArgIdx + 1];
  const j = javaByKey.get(key) ?? [], s = jsByKey.get(key) ?? [];
  const jf = javaFirstByKey.get(key) ?? [], sf = jsFirstByKey.get(key) ?? [];
  console.log(`\n═══ KHOÁ \`${key}\` ═══`);
  j.forEach((q, i) => console.log(`[JAVA ${i}] ORDER BY=${orderByOf(q)} · LIMIT=${effLimitOf(q, jf[i])}${jf[i] ? " (first)" : ""} · ${q.replace(/\s+/g, " ").trim().slice(0, 260)}`));
  s.forEach((q, i) => console.log(`[JS   ${i}] ORDER BY=${orderByOf(q)} · LIMIT=${effLimitOf(q, sf[i])}${sf[i] ? " (first)" : ""} · ${q.replace(/\s+/g, " ").trim().slice(0, 260)}`));
  console.log(`JOIN khác: ${joinDiffs(j.slice(0, 1), s.slice(0, 1)).join(" | ") || "(không)"}`);
  process.exit(0);
}

// ═══════════════════════════ 3. SO THEO TỪNG KHOÁ ═══════════════════════════
const findings = [];
const compared = [];
const notComparable = [];
for (const [key, javaSqls] of javaByKey) {
  const jsSqls = jsByKey.get(key);
  if (!jsSqls || !jsSqls.length) { notComparable.push({ key, why: "JS không có SQL tương ứng" }); continue; }
  const a = javaSqls[0], b = jsSqls[0];
  const aFirst = (javaFirstByKey.get(key) ?? [])[0] ?? false;
  const bFirst = (jsFirstByKey.get(key) ?? [])[0] ?? false;
  const multi = javaSqls.length > 1 || jsSqls.length > 1
    ? ` (chỉ so câu ĐẦU: Java ${javaSqls.length} câu · JS ${jsSqls.length} câu)` : "";
  const problems = comparePair(a, b, aFirst, bFirst);
  compared.push(key);
  if (problems.length) {
    findings.push({
      key, problems, multi,
      javaOrder: orderByOf(a), jsOrder: orderByOf(b),
      javaLimit: effLimitOf(a, aFirst), jsLimit: effLimitOf(b, bFirst),
      joinDiff: joinDiffs([a], [b]),
    });
  }
}

console.log(`\n═══ SO MỆNH ĐỀ: đã so ${compared.length} khoá ═══`);
findings.sort((x, y) => y.problems.length - x.problems.length);
if (!findings.length) {
  console.log("KHÔNG khoá nào lệch `ORDER BY`/`LIMIT`/kiểu `JOIN`. ✅");
} else {
  console.log(`KHOÁ LỆCH MỆNH ĐỀ: ${findings.length}`);
  for (const f of findings) {
    console.log(`  • ${f.key} — ${f.problems.join(" + ")}${f.multi}`);
    if (f.problems.includes("ORDER BY")) {
      console.log(`      ORDER BY  Java: ${f.javaOrder ?? "(không có)"}`);
      console.log(`      ORDER BY  JS  : ${f.jsOrder ?? "(không có)"}`);
    }
    if (f.problems.includes("LIMIT")) console.log(`      LIMIT     Java: ${f.javaLimit ?? "(không)"} · JS: ${f.jsLimit ?? "(không)"}`);
    if (f.problems.includes("JOIN")) f.joinDiff.forEach((d) => console.log(`      JOIN      ${d}`));
  }
}

// ═══════════════════════════ 4. ĐỘ PHỦ — CỔNG PHẢI TỰ BÁO KHI MẤT KHOÁ ═══════════════════════════
const comparedSet = new Set(compared);
const REQUIRED_COMPARED_KEYS = [
  "boqItems", "boqSourceItems", "boqImportBatches", "boqChangeHistory", "boqVersions", "projectContracts",
  "contractStockLedger", "contractStockBalances", "stockReconciliations", "teamSettlements", "teamPayments",
  "modulePermissions", "workflowAssignments", "constructionDailyLogs", "taskNotifications",
  "businessRoleGroupScopes", "organizationUnits", "materials",
];
const MIN_COMPARED = 65;
const coverageProblems = [];
{
  const lost = REQUIRED_COMPARED_KEYS.filter((k) => !comparedSet.has(k));
  if (lost.length) coverageProblems.push(`mất độ phủ ${lost.length} khoá BẮT BUỘC: ${lost.join(", ")}`);
  if (compared.length < MIN_COMPARED) coverageProblems.push(`số khoá so được tụt còn ${compared.length} (< ${MIN_COMPARED})`);
  for (const [key, names] of Object.entries(JAVA_KEY_SQL_VARS)) {
    for (const n of names) if (!javaVarNamesSeen.has(n)) coverageProblems.push(`JAVA_KEY_SQL_VARS["${key}"] trỏ tới biến KHÔNG tồn tại: \`${n}\``);
  }
}
if (coverageProblems.length) {
  console.log("\n⚠️ ĐỘ PHỦ CỦA CỔNG CÓ VẤN ĐỀ — kết luận 'không lệch' ở trên KHÔNG đáng tin:");
  for (const p of coverageProblems) console.log(`  • ${p}`);
} else {
  console.log(`\nĐỘ PHỦ: so được ${compared.length} khoá (≥ ${MIN_COMPARED}) · có đủ ${REQUIRED_COMPARED_KEYS.length} khoá bắt buộc ⇒ cổng KHÔNG mất độ phủ.`);
}
console.log(`Không so được ${notComparable.length} khoá (JS không có SQL tương ứng / khoá dựng động) — KHÔNG tính là đã khớp.`);

console.log("\nGIỚI HẠN: bỏ tiền tố bảng trong `ORDER BY` ⇒ có thể che lệch BẢNG (chỉ so ngữ nghĩa sắp xếp);");
console.log("         chỉ so câu ĐẦU của mỗi khoá khi khoá có nhiều câu; KHÔNG kiểm mệnh đề `WHERE`.");
process.exit(findings.length === 0 && coverageProblems.length === 0 ? 0 : 1);
