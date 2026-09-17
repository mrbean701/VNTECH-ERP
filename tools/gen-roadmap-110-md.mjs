// Sinh `docs/28_DANH_SACH_110_MUC_MASTER_TASK.md` từ NGUỒN SỰ THẬT `docs/25_TODO_ROADMAP.md`.
//
// VÌ SAO viết script thay vì chép tay: 110 dòng × 10 cột — chép tay là chắc chắn sai và sau này
// nguồn đổi thì bản chép tay lệch ngay. Script parse đúng các dòng `| \`ID\` | … |` của roadmap,
// giữ nguyên thứ tự phase, và tự tính lại số liệu tiến độ từ chính dữ liệu vừa parse.
//
// Chạy: node tools/gen-roadmap-110-md.mjs   (ghi đè tệp đầu ra)
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/25_TODO_ROADMAP.md";
const OUT = "docs/28_DANH_SACH_110_MUC_MASTER_TASK.md";
const lines = readFileSync(SRC, "utf8").split(/\r?\n/);

const ID_RE = /^\|\s*`([A-Z]{1,3}-[0-9]+)`\s*\|(.*)$/;
const phases = [];
let phase = null;
const items = [];

for (const line of lines) {
  const h = line.match(/^#\s+(.+?)\s*$/);
  if (h) {
    phase = { title: h[1], items: [] };
    phases.push(phase);
    continue;
  }
  const m = line.match(ID_RE);
  if (!m) continue;
  const cells = m[2].split("|").map((c) => c.trim());
  // cột: Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT
  const item = {
    id: m[1],
    module: cells[0] ?? "",
    work: cells[1] ?? "",
    priority: cells[2] ?? "",
    deps: cells[3] ?? "",
    db: cells[4] ?? "",
    api: cells[5] ?? "",
    ui: cells[6] ?? "",
    perm: cells[7] ?? "",
    tt: (cells[8] ?? "").replace(/\*\*/g, "").trim(),
  };
  items.push(item);
  if (phase) phase.items.push(item);
}

/** Các nhóm trạng thái theo đúng cách roadmap ghi. */
const group = {
  done: (tt) => tt === "DONE" || tt.startsWith("DONE ") || tt.startsWith("DONE/") || tt.includes("DONE / AP-DUNG"),
  partial: (tt) => tt.includes("KHUNG-XONG") || tt.startsWith("DANG-LAM"),
  blocked: (tt) => tt.includes("BLOCKED"),
  todo: (tt) => tt === "TODO",
};
const count = (fn) => items.filter((i) => fn(i.tt)).length;
const num = (fn, list) => list.filter((i) => fn(i.tt)).length;

const cell = (s) => (s && s !== "" ? s : "—");
const rowsFor = (list) =>
  list
    .map((i) => `| \`${i.id}\` | ${cell(i.phaseTitle ?? i.module)} | ${i.work} | ${cell(i.priority)} | ${cell(i.deps)} | ${cell(i.db)} | ${cell(i.api)} | ${cell(i.ui)} | ${cell(i.perm)} | **${i.tt}** |`)
    .join("\n");

// checklist phẳng — dùng được như TODO thật
const checkFor = (i) => (group.done(i.tt) ? "x" : " ");
const flat = items
  .map((i) => `- [${checkFor(i)}] \`${i.id}\` · **${i.module}** — ${i.work} · \`${i.tt}\``)
  .join("\n");

const dodIdx = lines.findIndex((l) => l.includes("ĐỊNH NGHĨA HOÀN THÀNH"));
const dod = lines.slice(dodIdx).filter((l) => /^\s*-\s*\[\s*\]/.test(l)).join("\n");
const blockerIdx = lines.findIndex((l) => l.includes("VIỆC CHẶN"));
const blockerEnd = lines.findIndex((l, i) => i > blockerIdx && l.startsWith("# "));
const blockers = lines.slice(blockerIdx, blockerEnd === -1 ? undefined : blockerEnd)
  .filter((l) => /^\|\s*\d+\s*\|/.test(l)).join("\n");

const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

const md = `# 28 — DANH SÁCH ${items.length} MỤC CỦA MASTER TASK (bản đọc nhanh)

- **Sinh tự động lúc:** ${now}
- **Nguồn sự thật:** \`${SRC}\` (bản phân rã MASTER TASK thành ${phases.filter((p) => p.items.length).length} phase có mục) — tệp này **không tự thêm/bớt mục nào**;
  mọi thay đổi phải sửa ở \`25_TODO_ROADMAP.md\` rồi chạy lại \`node tools/gen-roadmap-110-md.mjs\`.
- **Căn cứ audit:** \`docs/24_SYSTEM_AUDIT_REPORT.md\` · **Nhật ký thực thi:** \`docs/agent-progress/TASK_INDEX.md\`

## Tiến độ (đo từ chính ${items.length} mục dưới đây)

| Trạng thái | Số mục | Tỷ lệ |
|---|---:|---:|
| **DONE** | ${count(group.done)} | ${((count(group.done) / items.length) * 100).toFixed(0)}% |
| Một phần (khung xong — chưa áp dụng / đang làm) | ${count(group.partial)} | ${((count(group.partial) / items.length) * 100).toFixed(0)}% |
| **TODO** (chưa bắt đầu) | ${count(group.todo)} | ${((count(group.todo) / items.length) * 100).toFixed(0)}% |
| BLOCKED (cần quyết định/spec của người dùng) | ${count(group.blocked)} | ${((count(group.blocked) / items.length) * 100).toFixed(0)}% |
| **Tổng** | **${items.length}** | 100% |

**Theo phase:**

| Phase | Tổng | DONE | Một phần | TODO | BLOCKED |
|---|---:|---:|---:|---:|---:|
${phases
  .filter((p) => p.items.length)
  .map((p) => `| ${p.title} | ${p.items.length} | ${num(group.done, p.items)} | ${num(group.partial, p.items)} | ${num(group.todo, p.items)} | ${num(group.blocked, p.items)} |`)
  .join("\n")}

---

## 1) Checklist phẳng — dùng như TODO

${flat}

---

## 2) Bảng đầy đủ theo phase

${phases
  .filter((p) => p.items.length)
  .map(
    (p) => `### ${p.title} — ${p.items.length} mục (DONE ${num(group.done, p.items)})

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
${p.items
  .map((i) => `| \`${i.id}\` | ${i.module} | ${i.work} | ${cell(i.priority)} | ${cell(i.deps)} | ${cell(i.db)} | ${cell(i.api)} | ${cell(i.ui)} | ${cell(i.perm)} | **${i.tt}** |`)
  .join("\n")}`
  )
  .join("\n\n")}

---

## 3) Việc CHẶN cần người dùng quyết

| # | Vấn đề | Cần gì |
|---|---|---|
${blockers.replace(/^\|\s*#\s*\|.*\n/, "").replace(/^\|[-: |]+\|\n/, "")}

> Ngoài 5 việc chặn trên, còn **11 câu hỏi xác nhận** đang mở trong \`docs/agent-progress/MASTER_STATUS.md\`
> (số SLA thật, hệ license, nhóm quyền nghiệp vụ, backup/PITR, dữ liệu mẫu…).

---

## 4) Định nghĩa HOÀN THÀNH (§44) — một mục chỉ được đánh DONE khi thoả TẤT CẢ

${dod}
`;
writeFileSync(OUT, md, "utf8");
console.log(`Đã ghi ${OUT}`);
console.log(`  ${items.length} mục · ${phases.filter((p) => p.items.length).length} phase`);
console.log(`  DONE ${count(group.done)} · một phần ${count(group.partial)} · TODO ${count(group.todo)} · BLOCKED ${count(group.blocked)}`);
