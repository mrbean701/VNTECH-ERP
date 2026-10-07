// USER 28/09/2026 (lần 2) — SỬA LỖI THẬT: bước ĐÃ DUYỆT nằm SAU bước đang xử lý thì bản cũ
// rơi vào nhánh "Chưa tới bước này" ⇒ mất tên người duyệt + thời gian duyệt.
// ⛔ Điều kiện P6-04 §4.3 vẫn giữ: bước CHƯA TỚI LƯỢT (chưa duyệt + sau bước hiện tại) không lộ người duyệt.
// ⇒ Thứ tự ưu tiên MỚI: ① đã duyệt → tên + thời gian   ② đang xử lý → trạng thái   ③ chưa tới → trạng thái.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/page.tsx";
let out = readFileSync(FILE, "utf8");

// ── DÒNG PHỤ (khối người xử lý) ────────────────────────────────────────────
const OLD_SUB =
  '<small>{Number(stage.stageNo)>currentStage?"Chưa tới bước này":Number(stage.stageNo)===currentStage?"Người/nhóm đang xử lý":`Đã xử lý${approval?.department?" · "+approval.department:""}${approval?.status==="approved"&&atView.hasSource?" · duyệt lúc "+atView.value:""}`}</small>';

// ① ĐÃ DUYỆT (bất kể đứng trước/sau bước đang xử lý) → «Đã duyệt · <phòng ban> · duyệt lúc <thời gian>»
// ② CHƯA DUYỆT + đúng bước hiện tại                    → «Người/nhóm đang xử lý»
// ③ CHƯA DUYỆT + nằm sau                             → «Chưa tới bước này»
const NEW_SUB =
  '<small>{approval?.status==="approved"?`Đã duyệt${approval?.department?" · "+approval.department:""}${atView.hasSource?" · duyệt lúc "+atView.value:""}`:Number(stage.stageNo)===currentStage?"Người/nhóm đang xử lý":Number(stage.stageNo)>currentStage?"Chưa tới bước này":`Chờ duyệt${approval?.department?" · "+approval.department:""}`}</small>';

// ── TÊN NGƯỜI: bước chưa tới lượt KHÔNG được lộ (P6-04) ───────────────────
const OLD_NAME =
  '<b>{Number(stage.stageNo)>currentStage?"Đang chờ":(approval?.approverName||String(stage.allowedRoleCodes||"").split(",").filter(Boolean).map((code:string)=>roleLabel(data,code)).join(" / ")||"Chưa xác định người xử lý")}</b>';

// Ưu tiên: đã duyệt → tên thật; chưa tới lượt → «Đang chờ»; còn lại → tên/role.
const NEW_NAME =
  '<b>{approval?.status==="approved"?(approval?.approverName||"Người duyệt"):Number(stage.stageNo)>currentStage?"Đang chờ":(approval?.approverName||String(stage.allowedRoleCodes||"").split(",").filter(Boolean).map((code:string)=>roleLabel(data,code)).join(" / ")||"Chưa xác định người xử lý")}</b>';

const EDITS = [
  ["dòng phụ: đã duyệt → tên phòng ban + thời gian", OLD_SUB, NEW_SUB],
  ["tên: đã duyệt → tên thật (bỏ điều kiện vị trí)", OLD_NAME, NEW_NAME],
];

let applied = 0;
for (const [label, from, to] of EDITS) {
  const hits = out.split(from).length - 1;
  if (hits !== 1) { console.log("  🔴 " + label + ": khớp " + hits + " lần"); continue; }
  out = out.replace(from, to);
  applied += 1;
  console.log("  ✅ " + label);
}
if (applied !== EDITS.length) { console.log("  ⛔ KHÔNG ghi tệp."); process.exit(1); }
writeFileSync(FILE, out, "utf8");
console.log("  === ĐÃ SỬA " + applied + "/" + EDITS.length + " · page.tsx " + out.split("\n").length + " dòng ===");

// ── Tự kiểm lại hợp đồng kiểm thử ─────────────────────────────────────────
const t = readFileSync(FILE, "utf8");
const flow = t.slice(t.indexOf("approval-detail-pane"), t.indexOf("approval-meta-pane"));
const CHECKS = [
  ["p2-d4 data-vntech decided-at", /data-vntech="approval-step-decided-at"/.test(flow)],
  ["p2-d4 data-vntech comment", /data-vntech="approval-step-comment"/.test(flow)],
  ["p2-d4 nhãn «Thời điểm duyệt»", /Thời điểm duyệt/.test(flow)],
  ["p2-d4 nhãn «Bình luận»", /Bình luận/.test(flow)],
  ["p2-d4 atView.value", /atView\.value/.test(flow)],
  ["p2-d4 commentView.value", /commentView\.value/.test(flow)],
  ["p2-d4 !atView.hasSource", /!atView\.hasSource/.test(flow)],
  ["p2-d4 !commentView.hasSource", /!commentView\.hasSource/.test(flow)],
  ["P6-04 nhánh «Đang chờ»", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"/.test(flow)],
  ["P6-04 «Đang chờ» → roleLabel ≤220", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"[\s\S]{0,220}roleLabel\(data,code\)/.test(flow)],
  ["P6-04 «Chưa tới bước này»", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Chưa tới bước này"/.test(flow)],
  ["P6-04 «Đã duyệt» + phòng ban", /Đã duyệt[\s\S]{0,140}approval\?\.department/.test(flow)],
  ["không hard-code decidedAt", !/decidedAt:\s*"/.test(t)],
];
let bad = 0;
for (const [n, ok] of CHECKS) { if (!ok) bad += 1; console.log("   " + (ok ? "✅" : "🔴") + " " + n); }
console.log("  === HỢP ĐỒNG: " + (CHECKS.length - bad) + "/" + CHECKS.length + " ===");
process.exit(bad === 0 ? 0 : 1);
