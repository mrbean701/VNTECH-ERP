#!/usr/bin/env node
/**
 * CỔNG ĐO TIẾN ĐỘ SO VỚI MASTER TASK
 *
 * Nguồn sự thật duy nhất: docs/25_TODO_ROADMAP.md (110 mục A-01 … F-05).
 * Cổng này KHÔNG tự đặt ra tiêu chí "xong"; nó chỉ ĐẾM NGUYÊN VĂN cột TT
 * (cột cuối cùng của mỗi dòng mục) rồi phân loại theo đúng chuỗi có trong file.
 *
 * Vì sao cần: đã nhiều lần trả lời "tiến độ bao nhiêu %" bằng cảm nhận.
 * Con số chỉ được phép đến từ file nguồn sự thật, và phải nói rõ phần KHÔNG đo được.
 *
 * GIỚI HẠN (đọc trước khi trích dẫn số):
 *  - Chỉ đếm 110 dòng mục của roadmap. Công việc đã làm nằm ở các TASK-0xx
 *    (sửa lỗi audit) KHÔNG tự động cộng vào đây — không có ánh xạ 1-1.
 *  - "KHUNG-XONG / AP-DUNG 0" nghĩa là đã viết khung nhưng CHƯA áp dụng thực tế
 *    ⇒ cổng này tính RIÊNG, KHÔNG gộp vào DONE.
 *  - "DANG-LAM 9/32" là mục đang làm dở, cũng tính riêng.
 */
import { readFileSync } from "node:fs";

const FILE = "docs/25_TODO_ROADMAP.md";
const text = readFileSync(FILE, "utf8");
const lines = text.split(/\r?\n/);

const rows = [];
for (const line of lines) {
  const m = line.match(/^\|\s*`([A-Z]+-\d+)`\s*\|(.*)$/);
  if (!m) continue;
  const cells = line.split("|").map((c) => c.trim());
  // cells[0]="" , cells[1]="`A-01`" , ... , cells[N-2]=cột TT , cells[N-1]=""
  const status = cells[cells.length - 2] ?? "";
  rows.push({ id: m[1], raw: line, status });
}

const classify = (s) => {
  const t = s.replace(/\*\*/g, "").trim().toUpperCase();
  if (t === "DONE") return "DONE";
  if (t === "BLOCKED") return "BLOCKED";
  if (t.startsWith("DONE /")) return "DONE"; // "DONE / AP-DUNG n"
  if (t.startsWith("DANG-LAM")) return "DOING";
  if (t.startsWith("KHUNG-XONG")) return "FRAME_ONLY";
  if (t === "TODO") return "TODO";
  return "OTHER";
};

const bucket = { DONE: [], DOING: [], FRAME_ONLY: [], BLOCKED: [], TODO: [], OTHER: [] };
for (const r of rows) bucket[classify(r.status)].push(r);

// Tiền tố → phase. Số lượng mục mỗi tiền tố ĐÃ ĐO từ file (không đoán):
// A=16 · S=10 · U=17 · P=9 · T=10 · PR=6 · W=4 · TM=6 · AD=16 · WF=6 · R=5 · F=5  ⇒ tổng 110.
const PHASE_BY_PREFIX = {
  A: "PHASE 0 — AUDIT",
  S: "PHASE 0B — BẢO MẬT",
  U: "PHASE 1 — UI/UX",
  P: "PHASE 2 — MUA HÀNG",
  T: "PHASE 3 — CÔNG VIỆC",
  PR: "PHASE 4 — DỰ ÁN",
  W: "PHASE 5 — KHO",
  TM: "PHASE 6 — ĐỘI NHÓM",
  AD: "PHASE 7 — QUẢN TRỊ",
  WF: "PHASE 8 — WORKFLOW",
  R: "PHASE 9 — BÁO CÁO",
  F: "PHASE 10 — TƯƠNG LAI",
};
// Khớp tiền tố DÀI nhất trước để `PR-01` không bị nhận nhầm thành `P-01`.
const PREFIXES_BY_LEN = Object.keys(PHASE_BY_PREFIX).sort((a, b) => b.length - a.length);

const phaseOf = (id) => {
  const p = PREFIXES_BY_LEN.find((k) => id.startsWith(k + "-"));
  if (!p) return "⚠ TIỀN TỐ LẠ";
  return PHASE_BY_PREFIX[p];
};

console.log(`═══ TIẾN ĐỘ MASTER TASK (nguồn: ${FILE}) ═══`);
console.log(`Tổng số mục đọc được: ${rows.length}`);
if (rows.length !== 110) console.log(`⚠ CẢNH BÁO: roadmap phải có 110 mục, đọc được ${rows.length} ⇒ số dưới đây KHÔNG hợp lệ.`);
console.log("");
console.log("PHÂN LOẠI NGUYÊN VĂN CỘT TT:");
for (const k of ["DONE", "DOING", "FRAME_ONLY", "BLOCKED", "TODO", "OTHER"]) {
  if (!bucket[k].length) continue;
  const pct = ((bucket[k].length / rows.length) * 100).toFixed(1);
  console.log(`  ${k.padEnd(11)} ${String(bucket[k].length).padStart(3)} / ${rows.length}  (${pct}%)`);
}
if (bucket.OTHER.length) {
  console.log("  OTHER = chuỗi lạ, cần xem tay:");
  bucket.OTHER.forEach((r) => console.log(`    • ${r.id} — "${r.status}"`));
}

console.log("");
console.log("THEO PHASE (DONE / tổng mục của phase):");
const byPhase = new Map();
for (const r of rows) {
  const ph = phaseOf(r.id);
  if (!byPhase.has(ph)) byPhase.set(ph, { done: 0, total: 0, doing: 0, frame: 0, blocked: 0 });
  const e = byPhase.get(ph);
  e.total++;
  const c = classify(r.status);
  if (c === "DONE") e.done++;
  else if (c === "DOING") e.doing++;
  else if (c === "FRAME_ONLY") e.frame++;
  else if (c === "BLOCKED") e.blocked++;
}
for (const [ph, e] of byPhase) {
  const extra = [e.doing ? `đang làm ${e.doing}` : "", e.frame ? `khung ${e.frame}` : "", e.blocked ? `chặn ${e.blocked}` : ""]
    .filter(Boolean)
    .join(" · ");
  console.log(`  ${ph.padEnd(26)} ${String(e.done).padStart(2)}/${String(e.total).padEnd(3)}${extra ? "  (" + extra + ")" : ""}`);
}

console.log("");
console.log("CÁC MỤC ĐÃ DONE (nguyên văn cột TT):");
for (const r of bucket.DONE) {
  const cells = r.raw.split("|").map((c) => c.trim());
  console.log(`  • ${r.id} — ${cells[3]?.slice(0, 78)}  [${r.status}]`);
}

console.log("");
console.log("GIỚI HẠN: cổng chỉ đếm roadmap. Các TASK-0xx (sửa lỗi phát hiện khi audit)");
console.log("         KHÔNG được cộng vào đây vì không có ánh xạ 1-1 với mục roadmap.");
console.log("         'KHUNG-XONG / AP-DUNG 0' = đã có khung, CHƯA áp dụng ⇒ không tính DONE.");
