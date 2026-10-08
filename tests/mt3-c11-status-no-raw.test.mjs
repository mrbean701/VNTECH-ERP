// HỢP ĐỒNG — «THẺ TRẠNG THÁI ⛔ KHÔNG ĐƯỢC PHƠI MÃ THÔ» (ERP-SESSION-03, 08/10/2026 · `TASK-20261007-C27`)
//
// ⛔ ĐO ĐƯỢC TRƯỚC KHI VÁ (quét `app/screens/**` tìm `StatusBadge` có nhánh RƠI XUỐNG GIÁ TRỊ THÔ):
//   · `AllocateReturn.tsx` — `String(row.status) === "issued" ? "Đã xuất" : **String(row.status)**`
//     ⇒ **MỌI** trạng thái khác `issued` hiện **MÃ THÔ** (vd `pending`, `returned`…) ⇒ ⚠️ đúng khiếu nại «hiện tiếng Anh».
//   · `WorkKanban.tsx` — `WORK_STATUS_LABELS[…] || **String(row.status || "—")**` (thẻ) và `… || **key**` (nhãn cột)
//     ⇒ thiếu khoá trong bảng nhãn là **lộ mã thô**.
//   ⭐ NGUỒN GỐC CHUNG: ⛔ **không dùng chốt chặn CUỐI** là bảng nhãn DÙNG CHUNG (`@/lib/status-labels`)
//     ⇒ mỗi màn tự xử lý ⇒ màn nào quên thì rò. ✅ VÁ: dùng `statusLabel(value)` / `statusLabel(value, miền)` làm chốt chặn.
//
// ⚠️ CÒN LẠI (⛔ KHÔNG thuộc quyền phiên 03 — đã ghi handoff, ⛔ KHÔNG tự sửa):
//   `Inventory.tsx` (nhãn BCH · tệp của phiên 02) · `ProjectEntityModal.tsx` · `TeamManagement.tsx` · `app/page.tsx` (LOCK phiên 01)
//   ⇒ cổng này ⛔ KHÔNG đòi 3 tệp trên sạch, ⭐ nhưng **CẤM phát sinh tệp MỚI** vi phạm.
//
// Chạy riêng:  node --test tests/mt3-c11-status-no-raw.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

/** Danh sách tệp ĐÃ BIẾT còn phơi mã thô (⛔ ngoài quyền phiên 03 — có handoff, ⛔ KHÔNG tự sửa). */
const KNOWN = [
  "app/screens/Inventory.tsx", // ⚠️ tệp của phiên 02 (nhãn BCH) ⇒ HANDOFF-20261007-C13
];

/**
 * Bộ dò: tìm `StatusBadge value={…}` mà biểu thức có nhánh **RƠI XUỐNG GIÁ TRỊ THÔ**.
 * ⭐ ĐÃ HIỆU CHỈNH SAU KHI ĐO THẬT (⛔ tránh BÁO ĐỘNG GIẢ):
 *   · ⛔ KHÔNG bắt `taskStatusLabel(String(row.status || "todo"))` — ở đó `String(...)` là **ĐỐI SỐ** của hàm nhãn
 *     (giá trị thô **được dịch tiếp**), ⛔ không phải giá trị cuối của thẻ. (Đo được: `ProjectDetailTabs.tsx` dòng 229.)
 *   · ✅ CHỈ bắt khi `String(...)` là **GIÁ TRỊ CUỐI**: nhánh else của tam phân, hoặc vế phải `||`, hoặc cả biểu thức.
 */
export function rawExposureSites(source) {
  const hits = [];
  for (const m of source.matchAll(/StatusBadge\s+value=\{([\s\S]{0,300}?)\}\s*\/>/g)) {
    const expr = m[1];
    const flags = [];
    if (/\|\|\s*String\([^()]*\)\s*$/.test(expr)) flags.push("nhánh `|| String(...)` ở CUỐI (rơi xuống mã thô)");
    if (/:\s*String\([A-Za-z_$][\w$]*\.[\w$]+/.test(expr)) flags.push("nhánh else `→ String(trường)` (rơi xuống mã thô)");
    if (/^\s*String\([A-Za-z_$][\w$]*\.[\w$]+[^)]*\)\s*$/.test(expr)) flags.push("`String(trường)` thuần (⛔ không qua bảng nhãn)");
    if (flags.length) hits.push(flags.join(" + "));
  }
  return hits;
}

test("C11-1 · ⛔ KHÔNG phát sinh tệp MỚI phơi mã thô ở thẻ trạng thái", () => {
  const files = [];
  const walk = (dirUrl, prefix) => {
    for (const e of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + e.name;
      if (e.isDirectory()) { walk(new URL(e.name + "/", dirUrl), next + "/"); continue; }
      if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) files.push(next);
    }
  };
  walk(new URL("../app/screens/", import.meta.url), "app/screens/");
  // ⭐ CHỐT VÙNG PHỦ (⭐ chống «ĐẠT RỖNG» — LUẬT 21): ⛔ nếu bộ quét KHÔNG đọc được tệp nào thì «0 vi phạm» là VÔ NGHĨA.
  assert.ok(files.length >= 20, `⛔ CHỐT VÙNG PHỦ: chỉ quét được ${files.length} tệp (kỳ vọng ≥ 20) ⇒ bộ quét HỎNG, kết quả bên dưới VÔ NGHĨA`);
  const offenders = files.filter((f) => rawExposureSites(read(f)).length > 0);
  const unexpected = offenders.filter((f) => !KNOWN.includes(f));
  assert.deepEqual(unexpected, [],
    "⛔ TỆP MỚI phơi MÃ THÔ ở `StatusBadge` ⇒ dùng `statusLabel(value)` / `statusLabel(value, \"miền\")` từ `@/lib/status-labels`:\n" +
    unexpected.map((f) => `${f} → ${rawExposureSites(read(f)).join("; ")}`).join("\n"));
});

test("C11-2 · 2 tệp ĐÃ VÁ phải SẠCH và THỰC SỰ gọi `statusLabel`", () => {
  for (const f of ["app/screens/AllocateReturn.tsx", "app/screens/WorkKanban.tsx"]) {
    const src = read(f);
    assert.deepEqual(rawExposureSites(src), [], `⛔ ${f} còn phơi mã thô ở thẻ trạng thái`);
    assert.match(src, /import \{[^}]*statusLabel[^}]*\} from "@\/lib\/status-labels"/, `${f} phải import \`statusLabel\` từ bảng nhãn DÙNG CHUNG`);
    assert.ok([...src.matchAll(/\bstatusLabel\(/g)].length >= 1, `${f} import \`statusLabel\` nhưng ⛔ gọi 0 lần`);
  }
  assert.match(read("app/screens/AllocateReturn.tsx"), /statusLabel\(row\.status\)/, "cột «Trạng thái» phải đi qua `statusLabel(...)`");
  assert.match(read("app/screens/WorkKanban.tsx"), /statusLabel\(row\.status, "work_item"\)/, "thẻ Kanban phải đi qua `statusLabel(..., \"work_item\")`");
  assert.match(read("app/screens/WorkKanban.tsx"), /statusLabel\(key, "work_item"\)/, "nhãn cột Kanban phải đi qua `statusLabel(..., \"work_item\")`");
});

test("C11-3 · Chốt chặn CUỐI phải có nhãn TIẾNG VIỆT cho 2 miền được dùng", () => {
  const src = read("lib/status-labels.ts");
  const work = src.match(/work_item:\s*\{[\s\S]{0,700}?\}/)?.[0] ?? "";
  assert.match(work, /NEW:\s*"Mới"/, "miền `work_item` phải có `NEW → «Mới»`");
  assert.match(work, /CANCELLED:\s*"Đã huỷ"/, "miền `work_item` phải có `CANCELLED → «Đã huỷ»`");
  for (const s of ["NEW", "IN_PROGRESS", "WAITING_SUPPLIER", "WAITING_CLIENT", "WAITING_APPROVAL", "WAITING_PROJECT", "BLOCKED", "ON_HOLD", "SUBMITTED", "REWORK", "COMPLETED", "CANCELLED"]) {
    assert.match(work, new RegExp(s + ":"), `miền \`work_item\` thiếu trạng thái \`${s}\` (bảng nhãn màn Công việc phủ đủ 12)`);
  }
  const bch = src.match(/bch_confirmation:\s*\{[\s\S]{0,260}?\}/)?.[0] ?? "";
  assert.match(bch, /rejected:\s*"BCH từ chối"/, "miền `bch_confirmation` phải có `rejected → «BCH từ chối»` (⛔ thay cho mã thô «rejected»)");
});

test("C11-4 · ĐỐI CHỨNG ÂM: bộ dò PHẢI bắt được MẪU THẬT đã vá và ⛔ KHÔNG bắt nhầm chỗ đúng", () => {
  // ⭐ ĐÚNG NGUYÊN VĂN 2 mẫu ĐÃ ĐO ĐƯỢC trong mã trước khi vá:
  assert.equal(rawExposureSites(`<StatusBadge value={String(row.status) === "issued" ? "Đã xuất" : String(row.status)} />`).length, 1, "⛔ bộ dò KHÔNG bắt được mẫu `AllocateReturn` ⇒ cổng vô dụng");
  assert.equal(rawExposureSites(`<StatusBadge value={WORK_STATUS_LABELS[String(row.status)] || String(row.status || "—")}/>`).length, 1, "⛔ bộ dò KHÔNG bắt được mẫu `WorkKanban` ⇒ cổng vô dụng");
  // ⭐ Chỗ ĐÚNG ⛔ không được bắt (nếu bắt ⇒ báo động giả):
  assert.equal(rawExposureSites(`<StatusBadge value={statusLabel(row.status)} />`).length, 0, "⛔ bắt nhầm chỗ ĐÃ dùng bảng nhãn");
  assert.equal(rawExposureSites(`<StatusBadge value={PROJECT_STATUS_LABELS[String(row.status || "active")] || statusLabel(row.status, "project")} />`).length, 0, "⛔ bắt nhầm chỗ có chốt chặn `statusLabel`");
  assert.equal(rawExposureSites(`<StatusBadge value={Number(row.active)===0?"Đã ẩn":"Đang làm"} />`).length, 0, "⛔ bắt nhầm chỗ nhãn hằng tiếng Việt");
});
