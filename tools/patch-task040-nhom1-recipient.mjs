// Vá TASK-040 NHÓM 1 — `insertApprovalRecipient` (action `save_email_settings`).
//
// BA LỖI trong cùng một nhóm:
//   (1) SQL ghi 3 cột KHÔNG TỒN TẠI: `user_email`, `cc_emails`, `updated_by`
//       → MySQL "Unknown column" ⇒ HTTP 500.
//   (2) Use case đọc SAI TÊN TRƯỜNG payload: tìm `userEmail`/`ccEmails`, nhưng UI gửi `emails`
//       (app/page.tsx:3733-3734: `recipients.push({ projectId, stage, emails: cc })`)
//       ⇒ kể cả sửa SQL thì Java vẫn `continue` và KHÔNG ghi gì.
//   (3) `emailsFrom` của Java THIẾU bước khử trùng lặp mà JS có (`[...new Set(...)]`).
//
// NGUỒN SỰ THẬT (scripts/system-route.mjs:1608-1615):
//   const normalized = emailsFrom(row.emails).join(",");
//   INSERT INTO approval_email_recipients (id,project_id,stage,emails,active,created_at,updated_at)
//   VALUES (?,?,?,?,?,?,?)      -- bind: id("MAILTO"), projectId, stage, normalized, 1, stamp, stamp
//   emailsFrom (dòng 109-111): tách theo [;,\s]+ → trim → lowercase → chỉ giữ email hợp lệ → KHỬ TRÙNG LẶP
//
// LƯỢC ĐỒ THẬT (giống hệt nhau ở CẢ drizzle 0004 lẫn V1__baseline):
//   id · project_id · stage · emails · active · created_at · updated_at
import { readFileSync, writeFileSync } from "node:fs";

const PORT = "java-backend/application/src/main/java/com/vntech/erp/application/port/out/AdminOpsStore.java";
const ADAPTER = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/AdminOpsStoreAdapter.java";
const USECASE = "java-backend/application/src/main/java/com/vntech/erp/application/service/AdminOpsManagementUseCase.java";

let changed = 0;
const read = (p) => readFileSync(p, "utf8");

// ------------------------------------------------------------------ 1) PORT
{
  const src = read(PORT);
  if (src.includes("void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now);")) {
    console.log("= port: đã vá trước đó");
  } else {
    const re = /void\s+insertApprovalRecipient\([^;]*\);/;
    const m = src.match(re);
    if (!m) { console.error("HỎNG: port không thấy khai báo insertApprovalRecipient"); process.exit(1); }
    if (!m[0].includes("userEmail")) { console.error(`HỎNG: khai báo port khác kỳ vọng: ${m[0]}`); process.exit(1); }
    const to = [
      "/**",
      "     * Ghi một dòng người nhận email theo dự án + bước duyệt.",
      "     *",
      "     * <p><b>SỬA LỖI (TASK-040):</b> chữ ký cũ nhận {@code userEmail} + {@code ccEmails} + {@code updatedBy}.",
      "     * Lược đồ thật của bảng chỉ có <b>MỘT</b> cột {@code emails} (không có {@code user_email},",
      "     * {@code cc_emails}, {@code updated_by}) — xem drizzle/0004 và V1__baseline. JS cũng ghi một cột",
      "     * {@code emails} đã chuẩn hoá và nối bằng dấu phẩy. Nay port theo JS.",
      "     */",
      "    void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now);",
    ].join("\n");
    writeFileSync(PORT, src.replace(re, to), "utf8");
    changed++; console.log("✓ port: đổi chữ ký sang MỘT tham số emails");
  }
}

// ------------------------------------------------------------------ 2) ADAPTER
{
  const src = read(ADAPTER);
  if (src.includes("INSERT INTO approval_email_recipients (id,project_id,stage,emails,active,created_at,updated_at)")) {
    console.log("= adapter: đã vá trước đó");
  } else {
    const lines = src.split(/\r?\n/);
    const at = (n) => lines[n - 1];
    const expects = [
      [80, "public void insertApprovalRecipient"],
      [83, "INSERT INTO approval_email_recipients"],
      [85, "VALUES (?,?,?,?,?,1,?,?,?)"],
      [86, "}"],
    ];
    for (const [n, needle] of expects) {
      if (!at(n).includes(needle)) {
        console.error(`HỎNG: dòng ${n} không khớp "${needle}" — DỪNG.`);
        console.error(`      thực tế: ${JSON.stringify(at(n))}`);
        process.exit(1);
      }
    }
    const block = [
      "    @Override",
      "    @Transactional",
      "    public void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now) {",
      "        // SỬA LỖI (TASK-040): câu lệnh cũ ghi user_email + cc_emails + updated_by — CẢ BA cột này KHÔNG",
      "        // tồn tại trong lược đồ (drizzle 0004 và V1__baseline đều chỉ có MỘT cột `emails`)",
      "        // ⇒ MySQL ném \"Unknown column\" ⇒ action save_email_settings trả HTTP 500.",
      "        // Port nguyên trạng JS (scripts/system-route.mjs): một cột `emails`, active=1, có created_at.",
      "        jdbcTemplate.update(\"\"\"",
      "                INSERT INTO approval_email_recipients (id,project_id,stage,emails,active,created_at,updated_at)",
      "                VALUES (?,?,?,?,1,?,?)\"\"\", id, projectId, stage, emails, now, now);",
      "    }",
    ];
    const out = [...lines.slice(0, 79), ...block, ...lines.slice(86)].join("\n");
    writeFileSync(ADAPTER, out, "utf8");
    changed++; console.log("✓ adapter: INSERT đúng 7 cột của lược đồ");
  }
}

// ------------------------------------------------------------------ 3) USE CASE
{
  const src = read(USECASE);
  if (src.includes('emailsFrom(row.get("emails"))')) {
    console.log("= use case: đã vá trước đó");
  } else {
    const lines = src.split(/\r?\n/);
    const at = (n) => lines[n - 1];
    for (const [n, needle] of [[104, "userEmail"], [106, "userEmail.isEmpty()"], [107, "insertApprovalRecipient"], [108, "ccEmails"]]) {
      if (!at(n).includes(needle)) {
        console.error(`HỎNG: dòng ${n} không khớp "${needle}" — DỪNG.`);
        console.error(`      thực tế: ${JSON.stringify(at(n))}`);
        process.exit(1);
      }
    }
    const block = [
      "            // SỬA LỖI (TASK-040): UI gửi `recipients: [{ projectId, stage, emails }]` — MỘT trường `emails`",
      "            // (app/page.tsx:3733-3734), đúng như JS đọc (`row.emails`). Bản cũ tìm `userEmail`/`ccEmails`",
      "            // nên luôn rỗng ⇒ `continue` ⇒ KHÔNG ghi gì, kể cả sau khi đã sửa câu lệnh SQL.",
      "            String emails = emailsFrom(row.get(\"emails\"));",
      "            if (projectId.isEmpty() || stage == 0 || emails.isEmpty()) continue;",
      "            store.insertApprovalRecipient(idGenerator.next(\"AREC\"), projectId, stage, emails, now);",
    ];
    const out = [...lines.slice(0, 103), ...block, ...lines.slice(108)].join("\n");
    writeFileSync(USECASE, out, "utf8");
    changed++; console.log("✓ use case: đọc trường `emails` như JS");
  }

  // 3b) thêm KHỬ TRÙNG LẶP vào emailsFrom cho khớp JS ([...new Set(...)])
  const src2 = read(USECASE);
  if (src2.includes("LinkedHashSet")) {
    console.log("= emailsFrom: đã có khử trùng lặp");
  } else {
    const from = `            if (p.matches("(?i)^[^@\\\\s]+@[^@\\\\s]+\\\\.[^@\\\\s]+$")) out.add(p.toLowerCase(Locale.ROOT));`;
    if (!src2.includes(from)) {
      console.error("HỎNG: không khớp dòng thêm email trong emailsFrom — DỪNG.");
      process.exit(1);
    }
    const to = `            // JS dùng [...new Set(...)] ⇒ KHỬ TRÙNG LẶP; bản cũ không khử nên một email có thể bị lặp.
            if (p.matches("(?i)^[^@\\\\s]+@[^@\\\\s]+\\\\.[^@\\\\s]+$")) {
                String mail = p.toLowerCase(Locale.ROOT);
                if (!out.contains(mail)) out.add(mail);
            }`;
    writeFileSync(USECASE, src2.replace(from, to), "utf8");
    changed++; console.log("✓ emailsFrom: thêm khử trùng lặp như JS");
  }
}

// ------------------------------------------------------------------ HẬU KIỂM
const p = read(PORT), a = read(ADAPTER), u = read(USECASE);
const checks = [
  ["port: chữ ký MỘT tham số emails", p.includes("void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now);")],
  ["port: KHÔNG còn userEmail/ccEmails trong khai báo", !/void\s+insertApprovalRecipient\([^;]*userEmail/.test(p)],
  ["adapter: INSERT đúng 7 cột", a.includes("INSERT INTO approval_email_recipients (id,project_id,stage,emails,active,created_at,updated_at)")],
  ["adapter: VALUES (?,?,?,?,1,?,?)", a.includes("VALUES (?,?,?,?,1,?,?)")],
  // LƯU Ý: KHÔNG kiểm ở mức TỆP (`!a.includes("user_email")`) — `cc_emails` là cột CÓ THẬT của bảng
  // KHÁC (`approval_project_assignments`, dòng 73) và chú thích của chính bản vá cũng nhắc tên cột cũ.
  // Phải kiểm ĐÚNG câu lệnh INSERT của bảng này.
  ["adapter: câu lệnh mới KHÔNG còn cột sai",
    (() => {
      const m = a.match(/INSERT INTO approval_email_recipients \(([^)]*)\)/);
      return Boolean(m) && !/user_email|cc_emails|updated_by/.test(m[1]);
    })()],
  ["use case: đọc trường emails", u.includes('String emails = emailsFrom(row.get("emails"));')],
  ["use case: kiểm emails.isEmpty()", u.includes("if (projectId.isEmpty() || stage == 0 || emails.isEmpty()) continue;")],
  ["use case: gọi store với emails + now", u.includes('store.insertApprovalRecipient(idGenerator.next("AREC"), projectId, stage, emails, now);')],
  ["emailsFrom: có khử trùng lặp", u.includes("if (!out.contains(mail)) out.add(mail);")],
];
console.log(`\nĐã sửa ${changed} tệp. Hậu kiểm:`);
let ok = true;
for (const [name, pass] of checks) { console.log(`  ${pass ? "ĐẠT" : "HỎNG"}  ${name}`); if (!pass) ok = false; }
process.exit(ok ? 0 : 1);
