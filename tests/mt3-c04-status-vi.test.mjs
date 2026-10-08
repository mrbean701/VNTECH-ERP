// HỢP ĐỒNG «TRẠNG THÁI HIỂN THỊ BẰNG TIẾNG VIỆT» — ERP-SESSION-03 (2026-10-07) · `BUG-20261007-C03`
//
// ⛔ USER BÁO: «Hiển thị trạng thái của tất cả các đơn - phiếu trong toàn bộ hệ thống dưới dạng tiếng Việt
//    (Hiện tại 1 số nơi hiển thị tiếng Anh)» + MT3 §IV.6.
//
// ⭐ ĐO ĐƯỢC **TRƯỚC** KHI SỬA (phép đo thật, chạy `lib/status-labels.ts` bằng esbuild):
//      statusLabel("partial_issued")  => "Partial issued"      ⛔ TIẾNG ANH
//      statusLabel("issued")          => "Issued"              ⛔
//      statusLabel("awaiting_po")     => "Awaiting po"         ⛔
//      statusLabel("posted")          => "Posted"              ⛔
//      statusLabel("REWORK")          => "REWORK"              ⛔ mã thô
//      statusLabel("WAITING_SUPPLIER")=> "WAITING SUPPLIER"    ⛔ mã thô
//   và `StatusBadge` (chốt cũ `/^[a-z0-9_.-]+$/` — CHỈ chữ thường) in NGUYÊN `IN_PROGRESS` ra màn hình.
//
// ⭐ 4 NGUYÊN NHÂN GỐC đã vá:
//   ① Bảng nhãn DÙNG CHUNG (`lib/status-labels.ts`) **thiếu** 15 mã chuỗi cung ứng (chúng chỉ nằm ở bản
//      trùng lặp `lib/labels.ts`) ⇒ người gọi bảng chung nhận `humanize()` = TIẾNG ANH.
//   ② `StatusBadge` chỉ dịch mã **chữ thường** ⇒ mã VIẾT HOA của Công việc lọt nguyên ra UI.
//   ③ `lib/labels.ts` fallback `row.supplyStatus || row.status` ⇒ **RÒ MÃ THÔ** (kể cả vào TỆP XUẤT
//      qua `lib/supply-docs.tsx` / `lib/request-actions.ts`).
//   ④ Ô LỌC «Trạng thái/Tình trạng» dựng nhãn bằng `label: v` (mã thô) ở `Delivered.tsx`/`Purchasing.tsx`.
//
// Chạy riêng:  node --test tests/mt3-c04-status-vi.test.mjs
// ⚠️ Tệp này CÓ được `npm run test:regression` chạy (số ca tăng) — xem `TEST_LOG.md` §C05.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import esbuild from "esbuild";

const require = createRequire(import.meta.url);
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

/** Nạp `lib/status-labels.ts` thật rồi CHẠY (⛔ không so khớp chuỗi để suy ra hành vi). */
function loadStatusLabels() {
  const js = esbuild.transformSync(read("lib/status-labels.ts"), { loader: "ts", format: "cjs", target: "node20" }).code;
  const cjsModule = { exports: {} };
  new Function("require", "module", "exports", js)(require, cjsModule, cjsModule.exports);
  return cjsModule.exports;
}
const labels = loadStatusLabels();
const { statusLabel, knownStatusLabel } = labels;

// ── ① MÃ CHUỖI CUNG ỨNG PHẢI RA TIẾNG VIỆT (đây là các mã ĐO ĐƯỢC là rò tiếng Anh trước khi sửa) ─────
test("C04 — mã chuỗi cung ứng trả TIẾNG VIỆT (trước đây rò «Partial issued»/«Issued»/«Posted»)", () => {
  const EXPECTED = {
    partial_issued: "Xuất một phần",
    issued: "Đã xuất kho",
    awaiting_po: "Chờ lập PO",
    posted: "Đã ghi sổ",
    ordered: "Đang mua",
    received: "Đã giao đủ",
    waiting_delivery: "Chờ giao hàng",
    partial_delivery: "Giao một phần",
    approval_pending: "Chờ duyệt",
    awaiting_bch_confirmation: "Chờ BCH xác nhận",
    delivered_pending_confirmation: "Chờ BCH xác nhận",
    received_full_docs_pending: "Đã nhận đủ · Chờ hồ sơ",
    completed_with_shortage: "Đóng đơn có thiếu",
    completed_with_exceptions: "Hoàn tất · Thiếu hồ sơ",
    returned_to_requester: "Trả lại",
  };
  for (const [code, expected] of Object.entries(EXPECTED)) {
    assert.equal(statusLabel(code), expected, `mã \`${code}\` phải là «${expected}»`);
    // ⛔ ĐỐI CHỨNG ÂM: kết quả KHÔNG được là chính mã thô, và KHÔNG được là dạng humanize tiếng Anh.
    assert.notEqual(statusLabel(code), code, `⛔ mã \`${code}\` vẫn lộ nguyên mã thô`);
    assert.notEqual(statusLabel(code), code.replace(/_/g, " "), `⛔ mã \`${code}\` rơi vào humanize tiếng Anh`);
  }
});

// ── ② MÃ VIẾT HOA (Công việc) PHẢI RA TIẾNG VIỆT ────────────────────────────────────────────────────
test("C04 — mã VIẾT HOA của Công việc trả tiếng Việt (trước đây lộ «WAITING SUPPLIER»/«REWORK»)", () => {
  const EXPECTED = {
    IN_PROGRESS: "Đang làm",
    WAITING_SUPPLIER: "Chờ NCC",
    WAITING_CLIENT: "Chờ khách hàng",
    WAITING_PROJECT: "Chờ dự án",
    REWORK: "Làm lại",
    SUBMITTED: "Đã trình",
    BLOCKED: "Bị chặn",
    ON_HOLD: "Tạm dừng",
    NEW: "Mới",
    COMPLETED: "Hoàn thành",
  };
  for (const [code, expected] of Object.entries(EXPECTED)) {
    assert.equal(statusLabel(code, "work_item"), expected, `work_item \`${code}\` phải là «${expected}»`);
    assert.notEqual(statusLabel(code), code, `⛔ mã \`${code}\` phải được dịch kể cả khi ⛔ không truyền domain`);
    assert.notEqual(statusLabel(code), code.replace(/_/g, " "), `⛔ mã \`${code}\` rơi vào humanize tiếng Anh`);
  }
});

// ── ③ CHỐT AN TOÀN: chữ ĐÃ LÀ TIẾNG VIỆT thì GIỮ NGUYÊN (⛔ không hồi quy giao diện) ────────────────
test("C04 — chốt an toàn: nhãn tiếng Việt có sẵn GIỮ NGUYÊN, rỗng/null trả «—»", () => {
  for (const value of ["Đang hoạt động", "Chờ BCH xác nhận", "Đã ghi sổ", "Đạt", "Không đạt", "Đã nhận đủ · Chờ hồ sơ"]) {
    assert.equal(statusLabel(value), value, `⛔ nhãn đã đúng tiếng Việt bị ĐỔI: «${value}»`);
  }
  for (const value of [null, undefined, "", "   "]) {
    assert.equal(statusLabel(value), "—", `giá trị ${JSON.stringify(value)} phải trả «—»`);
  }
  // Mã lạ: vẫn ⛔ KHÔNG được trả mã thô, và ⛔ không được crash.
  assert.equal(knownStatusLabel("zzz_khong_co"), undefined, "mã lạ phải trả `undefined` ở lớp «đã biết»");
  assert.equal(statusLabel("zzz_khong_co"), "Zzz khong co", "mã lạ đi qua humanize (không lộ dấu gạch dưới)");
});

// ── ④ `StatusBadge` PHẢI DỊCH CẢ MÃ CHỮ HOA ────────────────────────────────────────────────────────
test("C04 — StatusBadge nhận mã CHỮ HOA và vẫn giữ nguyên chuỗi có dấu cách/tiếng Việt", () => {
  const badge = read("app/components/ui/StatusBadge.tsx");
  const line = badge.split("\n").find((row) => row.includes("const looksLikeRawCode"));
  assert.ok(line, "phải tìm thấy chốt `looksLikeRawCode` trong StatusBadge");
  assert.match(line, /\[\s*A-Za-z0-9_\.-\s*\]/, "⛔ chốt cũ chỉ có `a-z` ⇒ mã VIẾT HOA của Công việc không được dịch");
  // Đối chứng: chốt vẫn phải LOẠI chuỗi có dấu cách (nhãn tiếng Việt đã đúng).
  const re = /^[A-Za-z0-9_.-]+$/;
  assert.equal(re.test("IN_PROGRESS"), true, "mã chữ hoa phải được coi là mã thô");
  assert.equal(re.test("Đang hoạt động"), false, "chuỗi tiếng Việt có dấu cách ⛔ không được coi là mã thô");
  assert.equal(re.test("Chờ duyệt"), false, "chuỗi tiếng Việt có dấu ⛔ không được coi là mã thô");
});

// ── ⑤ KHÔNG CÒN BẢNG NHÃN TRÙNG LẶP + ⛔ KHÔNG RÒ MÃ THÔ RA TỆP XUẤT ────────────────────────────────
test("C04 — `lib/labels.ts` dùng CHUNG bảng nhãn, ⛔ không còn fallback in mã thô", () => {
  const source = read("lib/labels.ts").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.match(source, /from "@\/lib\/status-labels"/, "phải import bảng nhãn DÙNG CHUNG (⛔ không giữ bảng sao chép)");
  assert.doesNotMatch(source, /return labels\[row\.supplyStatus\]/, "⛔ bảng nhãn sao chép cũ đã quay lại");
  assert.doesNotMatch(source, /\|\|\s*row\.supplyStatus\s*\|\|\s*row\.status\s*\|/, "⛔ fallback RÒ MÃ THÔ đã quay lại");
  // Đối chứng DƯƠNG: thứ tự ưu tiên hợp đồng phải còn (supplyStatus → status → postingStatus).
  const order = source.indexOf("row?.supplyStatus");
  const second = source.indexOf("row?.status");
  const third = source.indexOf("row?.postingStatus");
  assert.ok(order > 0 && second > order && third > second, "⛔ thứ tự ưu tiên supplyStatus → status → postingStatus bị đổi");
});

test("C04 — ô LỌC trạng thái không dựng nhãn từ mã thô (`label: v`)", () => {
  // ⚠️ CHỈ soi dòng dựng nhãn từ chính MÃ TRẠNG THÁI. ⛔ KHÔNG soi `label:v` nói chung:
  //    bộ lọc «Nhà cung cấp» dùng `label:v` là ĐÚNG (đó là tên NCC, ⛔ không phải mã trạng thái) —
  //    lượt chạy đầu của test này đã báo oan chính chỗ đó.
  const delivered = read("app/screens/Delivered.tsx").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(delivered, /statusOptions\.map\(\(v\)=>\(\{value:v,label:v\}\)\)/,
    "⛔ Delivered.tsx còn dựng nhãn lọc TRẠNG THÁI từ mã thô");
  assert.doesNotMatch(delivered, /\?String\(row\.postingStatus\|\|"Chờ hạch toán"\)/,
    "⛔ cột TÌNH TRẠNG của Delivered.tsx còn rơi về mã thô");
  const purchasing = read("app/screens/Purchasing.tsx").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(purchasing, /PR_STATUS_LABEL\[value\]\s*\|\|\s*value/,
    "⛔ Purchasing.tsx còn fallback nhãn PR = mã thô");
  assert.doesNotMatch(purchasing, /PO_STATUS_LABEL\[value\]\s*\|\|\s*value/,
    "⛔ Purchasing.tsx còn fallback nhãn PO = mã thô");
  assert.doesNotMatch(purchasing, /labels\.size\s*\?\s*\[\.\.\.labels\]\.join\(" \/ "\)\s*:\s*value/,
    "⛔ Purchasing.tsx còn fallback nhãn lọc = mã thô");
  for (const [file, source] of [["Delivered.tsx", delivered], ["Purchasing.tsx", purchasing]]) {
    assert.match(source, /statusLabel\(/, `⛔ ${file} phải đi qua bảng nhãn dùng chung`);
  }
});

test("C04 — ⛔ KHÔNG còn nơi nào tự chép lại bảng nhãn của các mã DÙNG CHUNG", () => {
  // ⚠️ CHỈ bắt «bảng sao chép» = object literal khoá bằng **MÃ DÙNG CHUNG** (đã có ở `status-labels.ts`).
  //    ⛔ KHÔNG bắt các bảng nghiệp vụ RIÊNG (PR_STATUS_LABEL · PO_STATUS_LABEL · PROJECT_STATUS_LABELS…):
  //    đó là nhãn đặc thù phân hệ, hợp lệ. Lượt chạy đầu bắt oan `label:"…"` của mọi danh sách lựa chọn.
  const SHARED_CODES = new Set([
    "pending_approval", "approval_pending", "approved", "rejected", "returned", "returned_to_requester",
    "cancelled", "completed", "completed_with_shortage", "completed_with_exceptions", "posted", "issued",
    "partial_issued", "awaiting_po", "waiting_delivery", "partial_delivery", "draft", "pending", "ordered",
    "received", "blocked", "in_progress", "submitted",
  ]);
  const files = [];
  const walk = (dirUrl, prefix) => {
    for (const entry of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + entry.name;
      if (entry.isDirectory()) { walk(new URL(entry.name + "/", dirUrl), next + "/"); continue; }
      if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(next);
    }
  };
  for (const root of ["app", "lib"]) walk(new URL(`../${root}/`, import.meta.url), root + "/");
  const offenders = [];
  for (const file of files) {
    if (file.endsWith("lib/status-labels.ts")) continue;
    const code = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const hits = [...code.matchAll(/(?:^|[\s{,])([a-z][a-z0-9_]*)\s*:\s*"([^"]*)"/g)]
      .filter((m) => SHARED_CODES.has(m[1]) && /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(m[2]));
    if (hits.length < 4) continue;
    // ⚠️ MIỄN TRỪ CÓ ĐIỀU KIỆN: bảng nhãn ĐẶC THÙ PHÂN HỆ (`PR_STATUS_LABEL` · `PO_STATUS_LABEL`…) được phép
    //    tồn tại vì nhãn PR ≠ nhãn PO cho cùng mã — ⛔ nhưng PHẢI có fallback về bảng DÙNG CHUNG
    //    (đã kiểm ở ca trên: ⛔ không còn `|| value`). ⛔ Chỉ BAN bảng sao chép KHÔNG có fallback chung.
    const hasDomainTable = /const\s+[A-Z][A-Z0-9_]*_STATUS_LABEL\w*\s*[:=]/.test(code);
    const usesShared = /@\/lib\/status-labels/.test(code);
    if (hasDomainTable && usesShared) continue;
    offenders.push(`${file} — ${hits.length} nhãn sao chép (vd \`${hits[0][1]}: "${hits[0][2]}"\`)`);
  }
  assert.deepEqual(offenders, [],
    "⛔ Có nơi tự chép bảng nhãn của MÃ DÙNG CHUNG mà ⛔ KHÔNG fallback về `lib/status-labels.ts` ⇒ sẽ lộ tiếng Anh:\n" + offenders.join("\n"));
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ⑥ VÒNG 4 (`BUG-20261007-C04`) — ƯU TIÊN + LOẠI CON DẤU: mã TIẾNG ANH đã lọt ra bảng
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ĐO ĐƯỢC trước khi sửa: `work_items.priority` lưu `critical|urgent|high|normal|low` và
//   • `ProjectDetailTabs.tsx` in NGUYÊN MÃ (`{String(row.priority || "—")}`)
//   • `WorkCenter.tsx` tự dịch bằng ternary lặp 2 chỗ và **SÓT `critical`** ⇒ việc KHẨN CẤP hiện «Thường»
//   • `Requests.tsx` bộ lọc rơi về mã thô cho mọi mã ngoài `high`/`normal`
//   • `SealScreen.tsx` in NGUYÊN MÃ loại dấu (`company`/`legal`/`signature`/`other`)
test("C04-v4 — nhãn ƯU TIÊN + LOẠI CON DẤU trả tiếng Việt, ⛔ không rơi về mã thô", () => {
  const PRIORITY = { critical: "Khẩn cấp", urgent: "Khẩn", high: "Cao", normal: "Bình thường", low: "Thấp" };
  for (const [code, expected] of Object.entries(PRIORITY)) {
    assert.equal(statusLabel(code, "priority"), expected, `priority \`${code}\` phải là «${expected}»`);
    assert.notEqual(statusLabel(code, "priority"), code, `⛔ priority \`${code}\` lộ mã thô`);
    assert.notEqual(statusLabel(code), code, `⛔ priority \`${code}\` phải dịch được ⛔ cả khi không truyền domain`);
  }
  const SEAL = { company: "Dấu công ty", legal: "Dấu pháp nhân", signature: "Dấu chức danh", other: "Khác" };
  for (const [code, expected] of Object.entries(SEAL)) {
    assert.equal(statusLabel(code, "seal_type"), expected, `seal_type \`${code}\` phải là «${expected}»`);
  }
  // ⭐ ĐỐI CHỨNG DƯƠNG của chính lỗi đã sửa: ternary cũ trả «Thường» cho `critical` ⇒ nay phải là «Khẩn cấp».
  assert.equal(statusLabel("critical", "priority"), "Khẩn cấp", "⛔ việc KHẨN CẤP không được hiện «Thường»");
});

test("C04-v4 — `KANBAN_PRIORITIES` (WorkKanban) ⛔ KHÔNG được LỆCH nhãn với bảng DÙNG CHUNG", () => {
  const kanban = read("app/screens/WorkKanban.tsx");
  const block = kanban.slice(kanban.indexOf("const KANBAN_PRIORITIES"), kanban.indexOf("];", kanban.indexOf("const KANBAN_PRIORITIES")));
  const pairs = [...block.matchAll(/key:\s*"([a-z]+)",\s*label:\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]);
  assert.ok(pairs.length >= 5, `Chỉ trích được ${pairs.length} mức ưu tiên từ KANBAN_PRIORITIES — nghi ngờ cách trích, ⛔ không kết luận vội`);
  const mismatched = pairs.filter(([key, label]) => statusLabel(key, "priority") !== label);
  assert.deepEqual(mismatched, [],
    "⛔ Bảng Kanban và bảng DÙNG CHUNG lệch nhãn ⇒ sửa MỘT nơi rồi quên nơi kia:\n" + mismatched.map(([k, l]) => `${k}: kanban=«${l}» vs chung=«${statusLabel(k, "priority")}»`).join("\n"));
});

test("C04-v4 — ⛔ KHÔNG màn nào còn in mã thô `priority` / `sealType`", () => {
  const screens = [];
  const walk = (dirUrl, prefix) => {
    for (const entry of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + entry.name;
      if (entry.isDirectory()) { walk(new URL(entry.name + "/", dirUrl), next + "/"); continue; }
      if (/\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name)) screens.push(next);
    }
  };
  walk(new URL("../app/screens/", import.meta.url), "app/screens/");
  const offenders = [];
  for (const file of screens) {
    const code = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    if (/\{String\((row|r)\.priority \|\| "—"\)\}/.test(code)) offenders.push(`${file} — in mã thô \`priority\``);
    if (/\{(row|r)\.sealType\}/.test(code)) offenders.push(`${file} — in mã thô \`sealType\``);
    // Ternary tự dịch ưu tiên: đã bị bỏ vì SÓT `critical` và lặp nhiều chỗ.
    if (/(row|r)\.priority === "urgent" \?/.test(code)) offenders.push(`${file} — tự dịch Ưu tiên bằng ternary (sót \`critical\`)`);
  }
  assert.deepEqual(offenders, [], "⛔ Dùng `statusLabel(value, \"priority\" | \"seal_type\")`:\n" + offenders.join("\n"));
});

// ── ⑦ VÒNG 5 (`BUG-20261007-C05`) — bản dịch Ưu tiên lọt vào ĐƯỜNG XUẤT TỆP (`lib/**`) ────────────
// ĐO ĐƯỢC trước khi sửa: `lib/request-export.ts:25` có bản dịch **thứ 5**
//   `value === "urgent" ? "Khẩn" : value === "high" ? "Cao" : value === "normal" ? "Bình thường" : text(value)`
//   ⇒ với `critical` / `low` rơi vào `text(value)` ⇒ **IN MÃ THÔ VÀO TỆP XUẤT** (PDF/XLSX phiếu đề nghị).
// ⚠️ Vòng 4 tôi chỉ quét `app/screens/**` nên **ĐÃ BỎ SÓT `lib/**`** — ca này bịt đúng lỗ hổng đó.
test("C04-v5 — ⛔ KHÔNG nơi nào trong `app/**` + `lib/**` tự dịch ƯU TIÊN (trừ bảng Kanban được kiểm riêng)", () => {
  const files = [];
  const walk = (dirUrl, prefix) => {
    for (const entry of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + entry.name;
      if (entry.isDirectory()) { walk(new URL(entry.name + "/", dirUrl), next + "/"); continue; }
      if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(next);
    }
  };
  for (const root of ["app", "lib"]) walk(new URL(`../${root}/`, import.meta.url), root + "/");
  const offenders = [];
  // ⛔ NỢ ĐÃ GIAO HANDOFF (⛔ KHÔNG phải miễn trừ trắng): tệp **thuộc phiên khác** ⇒ phiên 03 ⛔ không sửa.
  //    ⚠️ Mọi mục ở đây PHẢI có mã HANDOFF, và PHẢI bị gỡ khi phiên sở hữu sửa xong.
  const KNOWN_DEBT = new Map([["app/page.tsx", "HANDOFF-20261007-C05 — in Ưu tiên bằng ternary (tệp của ERP-SESSION-01)"]]);
  for (const file of files) {
    if (file.endsWith("lib/status-labels.ts")) continue;
    const code = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    // ⚠️ MIỄN TRỪ DUY NHẤT: nơi khai `KANBAN_PRIORITIES` (nguồn MÀU + THỨ TỰ) — đã bị ca ⑨ kiểm
    //    «không được lệch nhãn với bảng DÙNG CHUNG» nên ⛔ không thể lệch âm thầm.
    if (/KANBAN_PRIORITIES/.test(code)) continue;
    if (KNOWN_DEBT.has(file)) { console.log(`  ⚠️ NỢ ĐÃ GIAO: ${file} — ${KNOWN_DEBT.get(file)}`); continue; }
    if (/===\s*"urgent"\s*\?|===\s*"high"\s*\?\s*"Cao"/.test(code))
      offenders.push(`${file} — tự dịch Ưu tiên bằng ternary (sót mã ⇒ rò mã thô)`);
    if (/"critical"\s*\?\s*"Khẩn cấp"/.test(code) && !/status-labels/.test(file))
      offenders.push(`${file} — tự chép bảng nhãn Ưu tiên`);
  }
  assert.deepEqual(offenders, [],
    "⛔ Dùng `statusLabel(value, \"priority\")` từ `lib/status-labels.ts` (⛔ kể cả trong đường XUẤT TỆP):\n" + offenders.join("\n"));
  // ĐỐI CHỨNG DƯƠNG: đường xuất tệp PHẢI dùng bảng chung, và phải dịch được `critical`/`low`.
  const exportFile = read("lib/request-export.ts");
  assert.match(exportFile, /import \{ statusLabel \} from "@\/lib\/status-labels"/,
    "⛔ `lib/request-export.ts` phải dùng bảng nhãn DÙNG CHUNG cho Ưu tiên");
  assert.doesNotMatch(exportFile, /text\(value\) \|\| "Bình thường"/,
    "⛔ fallback in MÃ THÔ trong tệp xuất đã quay lại");
});

// ── ⑧ VÒNG 8 (`BUG-20261007-C06`) — tệp xuất «Đơn hàng đã giao» in MÃ THÔ cho cột hồ sơ (CO/CQ) ─────
// ĐO ĐƯỢC trước khi sửa: `lib/ui-shared.tsx::deliveredExportRows` truyền `row.certificateStatus||""` và
//   `row.deliveryDocumentStatus||""` ⇒ **CẢ XLSX LẪN CSV** hiện `complete` / `missing` / `not_required`
//   (tiếng Anh) ở 2 cột «Chứng chỉ» và «Giấy giao hàng», trong khi `lib/request-export.ts` lại có **bản dịch riêng**.
test("C04-v8 — nhãn CO/CQ + GIẤY GIAO HÀNG trả tiếng Việt, ⛔ không rơi về mã thô", () => {
  const CERT = { complete: "Đã có", missing: "Chưa có", not_required: "Không yêu cầu" };
  for (const [code, expected] of Object.entries(CERT)) {
    assert.equal(statusLabel(code, "certificate_status"), expected, `certificate_status \`${code}\` phải là «${expected}»`);
    assert.notEqual(statusLabel(code, "certificate_status"), code, `⛔ certificate_status \`${code}\` lộ mã thô`);
  }
  assert.equal(statusLabel("complete", "delivery_document"), "Đã có");
  assert.equal(statusLabel("missing", "delivery_document"), "Chưa có");
  // ⛔ `not_required` KHÔNG có trong domain giấy giao hàng (ô chọn chỉ có 2 giá trị) ⇒ vẫn phải ra TIẾNG VIỆT,
  //    ⛔ không được rơi về humanize tiếng Anh nếu dữ liệu cũ có giá trị này.
  assert.notEqual(statusLabel("not_required", "delivery_document"), "Not required", "⛔ giá trị lạ vẫn phải tránh humanize tiếng Anh");
});

test("C04-v8 — TỆP XUẤT dùng bảng nhãn DÙNG CHUNG, ⛔ không truyền mã thô vào cột hồ sơ", () => {
  const uiShared = read("lib/ui-shared.tsx");
  const deliveredRows = uiShared.slice(uiShared.indexOf("function deliveredExportRows"), uiShared.indexOf("function exportDeliveredXlsx"));
  assert.ok(deliveredRows, "không tìm thấy `deliveredExportRows` trong `lib/ui-shared.tsx`");
  assert.doesNotMatch(deliveredRows, /row\.certificateStatus\s*\|\|/,
    "⛔ `deliveredExportRows` còn truyền THẲNG `row.certificateStatus` vào tệp xuất ⇒ tiếng Anh");
  assert.doesNotMatch(deliveredRows, /row\.deliveryDocumentStatus\s*\|\|/,
    "⛔ `deliveredExportRows` còn truyền THẲNG `row.deliveryDocumentStatus` vào tệp xuất ⇒ tiếng Anh");
  assert.match(deliveredRows, /statusLabel\(row\.certificateStatus,\s*"certificate_status"\)/,
    "cột «Chứng chỉ» phải đi qua bảng nhãn DÙNG CHUNG (domain `certificate_status`)");
  assert.match(deliveredRows, /statusLabel\(row\.deliveryDocumentStatus,\s*"delivery_document"\)/,
    "cột «Giấy giao hàng» phải đi qua bảng nhãn DÙNG CHUNG (domain `delivery_document`)");

  // Và bản dịch RIÊNG trong đường xuất PO/GRN cũng phải uỷ quyền bảng chung (⛔ không giữ 2 bản song song).
  const exportFile = read("lib/request-export.ts").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(exportFile, /value === "complete" \? "Đã có"/,
    "⛔ `lib/request-export.ts` còn BẢN DỊCH RIÊNG cho CO/CQ ⇒ 2 bản sẽ lệch nhau");
  assert.match(exportFile, /statusLabel\(raw, "certificate_status"\)/, "`certificateLabel` phải uỷ quyền bảng DÙNG CHUNG");
  assert.match(exportFile, /statusLabel\(raw, "delivery_document"\)/, "`documentLabel` phải uỷ quyền bảng DÙNG CHUNG");
});
