// USER 28/09/2026 — RÚT GỌN DẢI «QUY TRÌNH PHÊ DUYỆT» Ở MÀN PHIẾU ĐANG XỬ LÝ.
//   ① LƯỢC BỎ thông tin thừa (mô tả bước dài + 2 dòng "chưa có nguồn (giải thích dài)").
//   ② Bước ĐÃ DUYỆT → hiện TÊN NGƯỜI DUYỆT + THỜI GIAN duyệt ngay dưới tên bước.
//      Bước CHƯA DUYỆT → hiện TRẠNG THÁI của bước.
// ⛔ GIỮ NGUYÊN HỢP ĐỒNG KIỂM THỬ (đọc trước khi sửa):
//   · tests/p2-d4-approval-timeline.test.mjs L75-89 — giữ `data-vntech="approval-step-decided-at"`,
//     `data-vntech="approval-step-comment"`, nhãn «Thời điểm duyệt», «Bình luận», `atView.value`,
//     `commentView.value`, `!atView.hasSource`, `!commentView.hasSource`.
//   · tests/p6-04-future-step-no-approver.test.mjs L17-28 — giữ `Number(stage.stageNo)>currentStage?"Đang chờ"`,
//     `roleLabel(data,code)` nằm sau nhánh chưa-tới, `"Chưa tới bước này"`, và `Đã xử lý … approval?.department`.
//   ⇒ Lý do thiếu nguồn KHÔNG xoá hẳn mà chuyển sang `title` (tooltip) để giữ kỷ luật
//     «không im lặng bỏ trống» mà không làm rối màn hình.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/page.tsx";
const src = readFileSync(FILE, "utf8");

// ① BỎ mô tả dài của bước (không tệp kiểm thử nào khoá; CSS chỉ cần `<div>` bọc tên bước).
const OLD_DESC = '<span>{stage.description||"Theo luồng phê duyệt đã cấu hình"}</span>';

// ② Dòng phụ của khối người xử lý: bước đã duyệt ⇒ THÊM THỜI GIAN DUYỆT ngay cạnh tên người duyệt.
const OLD_SUB =
  '<small>{Number(stage.stageNo)>currentStage?"Chưa tới bước này":Number(stage.stageNo)===currentStage?"Người/nhóm đang xử lý":`Đã xử lý${approval?.department?" · "+approval.department:""}`}</small>';
const NEW_SUB =
  '<small>{Number(stage.stageNo)>currentStage?"Chưa tới bước này":Number(stage.stageNo)===currentStage?"Người/nhóm đang xử lý":`Đã xử lý${approval?.department?" · "+approval.department:""}${approval?.status==="approved"&&atView.hasSource?" · duyệt lúc "+atView.value:""}`}</small>';

// ③ Khối "Thời điểm duyệt / Bình luận": chỉ hiện khi CÓ DỮ LIỆU THẬT; lý do thiếu nguồn → `title`.
const OLD_DEC =
  '<div className="approval-step-decision" data-vntech="approval-flow-step"><span data-vntech="approval-step-decided-at"><b>Thời điểm duyệt:</b> {atView.value}{!atView.hasSource&&<small> ({atView.note})</small>}</span><span data-vntech="approval-step-comment"><b>Bình luận:</b> {commentView.hasSource?`“${commentView.value}”`:commentView.value}{!commentView.hasSource&&<small> ({commentView.note})</small>}</span></div>';
const NEW_DEC =
  '{(atView.hasSource||commentView.hasSource)&&<div className="approval-step-decision" data-vntech="approval-flow-step" title={!atView.hasSource?atView.note:!commentView.hasSource?commentView.note:undefined}>{atView.hasSource&&<span data-vntech="approval-step-decided-at"><b>Thời điểm duyệt:</b> {atView.value}</span>}{commentView.hasSource&&<span data-vntech="approval-step-comment"><b>Bình luận:</b> “{commentView.value}”</span>}</div>}';

const EDITS = [
  ["① bỏ mô tả dài của bước", OLD_DESC, ""],
  ["② thêm thời gian duyệt cho bước đã duyệt", OLD_SUB, NEW_SUB],
  ["③ thu gọn khối thời điểm duyệt / bình luận", OLD_DEC, NEW_DEC],
];

let out = src;
let applied = 0;
for (const [label, from, to] of EDITS) {
  const hits = out.split(from).length - 1;
  if (hits !== 1) {
    console.log("  🔴 " + label + ": khớp " + hits + " lần (cần đúng 1) — KHÔNG sửa");
    continue;
  }
  out = out.replace(from, to);
  applied += 1;
  console.log("  ✅ " + label);
}

if (applied === EDITS.length) {
  writeFileSync(FILE, out, "utf8");
  console.log("  === ĐÃ SỬA " + applied + "/" + EDITS.length + " · page.tsx còn " + out.split("\n").length + " dòng ===");
} else {
  console.log("  ⛔ KHÔNG ghi tệp — còn " + (EDITS.length - applied) + " chỗ chưa khớp.");
}

// Tự kiểm lại 8 điều kiện của hợp đồng kiểm thử ngay trong tệp vừa sửa.
const t = readFileSync(FILE, "utf8");
const start = t.indexOf("approval-detail-pane");
const flow = t.slice(start, t.indexOf("approval-meta-pane"));
const CHECKS = [
  ["data-vntech=approval-step-decided-at", /data-vntech="approval-step-decided-at"/.test(flow)],
  ["data-vntech=approval-step-comment", /data-vntech="approval-step-comment"/.test(flow)],
  ["nhãn «Thời điểm duyệt»", /Thời điểm duyệt/.test(flow)],
  ["nhãn «Bình luận»", /Bình luận/.test(flow)],
  ["atView.value", /atView\.value/.test(flow)],
  ["commentView.value", /commentView\.value/.test(flow)],
  ["!atView.hasSource", /!atView\.hasSource/.test(flow)],
  ["!commentView.hasSource", /!commentView\.hasSource/.test(flow)],
  ["P6-04 nhánh «Đang chờ»", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"/.test(flow)],
  ["P6-04 «Đang chờ» → roleLabel", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"[\s\S]{0,220}roleLabel\(data,code\)/.test(flow)],
  ["P6-04 «Chưa tới bước này»", /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Chưa tới bước này"/.test(flow)],
  ["P6-04 «Đã xử lý» + phòng ban", /Đã xử lý[\s\S]{0,140}approval\?\.department/.test(flow)],
  ["không hard-code decidedAt", !/decidedAt:\s*"/.test(t)],
];
let bad = 0;
for (const [name, ok] of CHECKS) {
  if (!ok) bad += 1;
  console.log("   " + (ok ? "✅" : "🔴") + " " + name);
}
console.log("  === HỢP ĐỒNG: " + (CHECKS.length - bad) + "/" + CHECKS.length + " ===");
