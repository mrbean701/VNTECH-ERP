// HỢP ĐỒNG — «NGÀY TRÊN MÀN HÌNH PHẢI QUA HÀM `date()` DÙNG CHUNG» (ERP-SESSION-03, 07/10/2026)
//
// ⛔ ĐO ĐƯỢC TRƯỚC KHI VÁ (`TASK-20261007-C19`, quét `app/screens/**`):
//   **4 chỗ IN NGÀY THÔ** ra bảng/thẻ, ⛔ không qua `date()` ⇒ hiện **`2026-10-07`** (ISO) trong khi **mọi nơi khác**
//   trong ứng dụng hiện **`07/10/2026`** (vi-VN) ⇒ ⚠️ **KHÔNG NHẤT QUÁN ĐỊNH DẠNG NGÀY**:
//     · `Payments.tsx` — ô «Ngày» của bảng + «Đến hạn: …» (2 chỗ)
//     · `DocumentsScreen.tsx` — cột «Ngày chứng từ»
//     · `ProjectTeams.tsx` — «… · ngày thanh toán»
//   ⭐ **DẤU HIỆU CHÍ MẠNG**: **cả 3 tệp ĐÃ `import { … date … }`** nhưng **gọi `date(...)` 0 LẦN** ⇒ ai đó ĐÃ ĐỊNH
//     dùng hàm chung mà viết thô ⇒ ⛔ không phải thiếu tiện ích, mà là **quên dùng**.
//   ✅ VÁ: bọc 4 chỗ bằng `date(...)` (⛔ không thêm import nào — đã có sẵn).
//
// `date()` (`lib/ui-shared.tsx`) = `Intl.DateTimeFormat("vi-VN", {day:"2-digit",month:"2-digit",year:"numeric"})`
//   ⇒ `dd/mm/yyyy`; nếu chuỗi có `T` thì thêm **giờ:phút**; rỗng ⇒ `—`; ⛔ không hợp lệ ⇒ trả nguyên chuỗi.
//
// Chạy riêng:  node --test tests/mt3-c10-date-format.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

/** Tìm chỗ render ngày THÔ ở VỊ TRÍ VĂN BẢN JSX (⛔ bỏ qua thuộc tính như `defaultValue=`/`value=` của ô nhập). */
function rawDateRenders(source) {
  const hits = [];
  for (const m of source.matchAll(/\{\s*(row|r|item|receipt|po|v)\.([A-Za-z]*(?:At|Date|DateAt))\s*\}/g)) {
    const before = source.slice(Math.max(0, m.index - 120), m.index);
    // ⛔ bỏ qua khi nằm trong THUỘC TÍNH JSX (value=/defaultValue=/name=/defaultChecked=)
    if (/(value|defaultValue|name|defaultChecked|min|max)\s*=\s*\{?\s*$/.test(before)) continue;
    if (/name\s*=\s*$/.test(before)) continue;
    hits.push(m[0]);
  }
  return hits;
}

test("C10-1 · ⛔ KHÔNG màn nào in ngày THÔ ra bảng/thẻ (phải qua `date(...)`)", () => {
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
  const offenders = [];
  for (const f of files) {
    const hits = rawDateRenders(read(f));
    if (hits.length) offenders.push(`${f} → ${hits.join(", ")}`);
  }
  assert.deepEqual(offenders, [],
    "⛔ Còn in NGÀY THÔ (hiện ISO `2026-10-07` thay vì `07/10/2026`) ⇒ dùng `date(...)` từ `@/lib/ui-shared`:\n" + offenders.join("\n"));
});

test("C10-2 · `date()` dùng định dạng vi-VN và xử lý đúng dữ liệu rỗng/sai", () => {
  const src = read("lib/ui-shared.tsx");
  const at = src.indexOf("const date = (value: unknown)");
  assert.ok(at >= 0, "phải có `const date = (value: unknown) => …` trong `lib/ui-shared.tsx`");
  const body = src.slice(at, src.indexOf("};", at));
  assert.match(body, /Intl\.DateTimeFormat\("vi-VN"/, "⛔ `date()` phải định dạng `vi-VN` ⇒ `dd/mm/yyyy`");
  assert.match(body, /day:"2-digit", month:"2-digit", year:"numeric"/, "phải là ngày 2 chữ số/tháng 2 chữ số/năm 4 chữ số");
  assert.match(body, /if \(!value\) return "—"/, "⛔ rỗng phải trả `—` (⛔ không hiện «Invalid Date»)");
  assert.match(body, /Number\.isNaN\(parsed\.getTime\(\)\)\) return String\(value\)/, "⛔ chuỗi sai phải trả NGUYÊN chuỗi (⛔ không hiện «Invalid Date»)");
  assert.match(body, /includes\("T"\)/, "chuỗi có giờ phải hiện thêm GIỜ:PHÚT");
});

test("C10-3 · 4 chỗ đã vá phải THỰC SỰ gọi `date(...)` (⛔ và 3 tệp không còn import thừa)", () => {
  const payments = read("app/screens/Payments.tsx");
  assert.match(payments, /\{date\(row\.paymentDate\)\}/, "`Payments.tsx` phải bọc `date(...)` cho ngày");
  assert.doesNotMatch(payments, /\{row\.paymentDate\}/, "⛔ `Payments.tsx` còn in thô `{row.paymentDate}`");
  assert.match(read("app/screens/DocumentsScreen.tsx"), /\{date\(r\.voucherDate\)\}/, "`DocumentsScreen.tsx` phải bọc `date(...)`");
  assert.match(read("app/screens/ProjectTeams.tsx"), /\{date\(r\.paymentDate\)\}/, "`ProjectTeams.tsx` phải bọc `date(...)`");
  // ⭐ Trước khi vá: 3 tệp IMPORT `date` mà GỌI 0 LẦN (import thừa + in thô) ⇒ nay phải gọi ≥1 lần:
  for (const f of ["app/screens/Payments.tsx", "app/screens/DocumentsScreen.tsx", "app/screens/ProjectTeams.tsx"]) {
    const calls = [...read(f).matchAll(/\bdate\(/g)].length;
    assert.ok(calls >= 1, `⛔ ${f} import \`date\` nhưng ⛔ gọi 0 lần (import thừa)`);
  }
});

test("C10-4 · ĐỐI CHỨNG ÂM: bộ dò PHẢI bắt được một chỗ in thô giả lập", () => {
  const fake = `<td>{row.paymentDate}</td>`;
  assert.equal(rawDateRenders(fake).length, 1, "⛔ bộ dò KHÔNG bắt được chỗ in thô ⇒ cổng vô dụng");
  const okAttr = `<input name="paymentDate" defaultValue={r.paymentDate} />`;
  assert.equal(rawDateRenders(okAttr).length, 0, "⛔ bộ dò bắt NHẦM ô nhập liệu ⇒ sẽ sinh báo động giả");
  const okCall = `<td>{date(row.paymentDate)}</td>`;
  assert.equal(rawDateRenders(okCall).length, 0, "⛔ bộ dò bắt nhầm chỗ ĐÃ bọc `date(...)`");
});

// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// BỔ SUNG MT3-S03 (08/10/2026) — `BUG-20261007-C10` **MỞ LẠI MỘT PHẦN**: ⭐ QUÉT **TOÀN BỘ 29 MÀN** (công thức ở `§C33`)
// phát hiện **NGÀY ISO HIỆN THÔ** ở «Tiến độ dự án» (`2026-01-01`) và «Giao việc & Kiểm soát hoàn thành» (`2026-10-07`)
// ⇒ ⚠️ KHÔNG NHẤT QUÁN với `dd/mm/yyyy`. ✅ ĐÃ VÁ **11 CHỖ HIỂN THỊ** ở 4 tệp (dùng `date()` DÙNG CHUNG).
// ⚠️ `.slice(0,10)` **HỢP LỆ** (⛔ KHÔNG phải lỗi) khi dùng cho: ① ô nhập `type="date"` (HTML cần ISO) · ② **so sánh/lọc** · ③ **tên tệp xuất**.
// ⭐ VÌ SAO CỔNG NÀY **NHẮM ĐÍCH** (⛔ không quét toàn bộ `app/screens/**`): quét rộng **không phân biệt được** JSX-hiển-thị
//   với so-sánh/tên-tệp bằng regex ⇒ ⚠️ **ĐÃ ĐO ĐƯỢC 2 LẦN ĐỎ OAN** (và 1 lần **ĐẠT RỖNG** vì bộ dò ⛔ không khớp dạng tam phân)
//   ⇒ ⭐ muốn quét rộng cho ĐÚNG thì phải **phân tích cú pháp (AST)**, ⛔ không phải regex. ⚠️ Chi tiết đầy đủ: `SESSION_C/TEST_LOG.md`.
// ⛔ CÒN LẠI (ngoài quyền phiên 03): `Inventory.tsx` (tệp phiên 02) — **`HANDOFF-20261007-C13`**.

/** Mẫu HIỆN NGÀY ISO THÔ — ⛔ chỉ dùng để KIỂM 4 TỆP ĐÃ VÁ (mọi chỗ trong đó đều là HIỂN THỊ).
 *  ⚠️ Bỏ qua **DÒNG ĐỊNH NGHĨA hàm trợ giúp** (`const datePart = (v) => String(v).slice(0,10)`) — đó là **LOGIC**, ⛔ không hiển thị. */
export function rawIsoDisplayPatterns(source) {
  const hits = [];
  for (const re of [/String\([^)]{0,60}\)\.slice\(0,\s*10\)/g, /datePart\([^)]{0,40}\)\s*\|\|/g]) {
    for (const m of source.matchAll(re)) {
      const before = source.slice(Math.max(0, m.index - 60), m.index);
      if (/=>\s*$/.test(before) || /const\s+datePart\s*=/.test(before)) continue; // ✅ định nghĩa hàm trợ giúp (LOGIC)
      hits.push(m[0].slice(0, 60));
    }
  }
  return hits;
}

test("C10-5 · 4 tệp ĐÃ VÁ ⛔ không còn mẫu HIỆN NGÀY ISO THÔ nào", () => {
  const fixed = [
    "app/screens/WorkKanban.tsx",           // «Hôm nay {UI_TODAY}» — ⚠️ HẰNG ISO bị render THÔ (đo được ở màn «Giao việc», `§C35`)
    "app/screens/AllocateReturn.tsx",       // «Ngày xuất» · «Ngày trả»
    "app/screens/Purchasing.tsx",           // «Ngày yêu cầu» · «Cần có» · «Đã đặt» · «ETA»
    "app/screens/PurchaseOrderDrawer.tsx",  // «Đã đặt» · «Hạn giao (ETA)» · «Ngày nhận»
    "app/screens/ContractReviewScreen.tsx", // «Ngày nhận» · «Ngày review» (bảng + modal)
  ];
  const offenders = fixed.filter((f) => rawIsoDisplayPatterns(read(f)).length);
  assert.deepEqual(offenders, [],
    "⛔ Còn HIỆN NGÀY ISO THÔ (phải dùng `date()` từ `@/lib/ui-shared` ⇒ `dd/mm/yyyy`):\n" +
    offenders.map((f) => `${f} → ${rawIsoDisplayPatterns(read(f)).join(", ")}`).join("\n"));
  // ⭐ 4 tệp phải THỰC SỰ gọi `date(...)` (⛔ không chỉ xoá mẫu cũ):
  for (const f of fixed) {
    assert.ok([...read(f).matchAll(/\bdate\(/g)].length >= 1, `⛔ ${f} chưa gọi \`date(...)\``);
  }
});

test("C10-6 · ĐỐI CHỨNG ÂM: bộ dò PHẢI khớp **NGUYÊN VĂN** 2 mẫu THẬT đã đo, ⛔ và bỏ qua mẫu HỢP LỆ", () => {
  // ⭐ 2 mẫu ĐÚNG NGUYÊN VĂN đã tồn tại trong mã TRƯỚC khi vá (đo ở `AllocateReturn` và `Purchasing`):
  assert.equal(rawIsoDisplayPatterns(`<td>{row.issuedAt ? String(row.issuedAt).slice(0, 10) : "—"}</td>`).length, 1, "⛔ KHÔNG bắt được mẫu `AllocateReturn` ⇒ cổng VÔ DỤNG");
  assert.equal(rawIsoDisplayPatterns(`<td>{datePart(po.orderedAt)||"—"}</td>`).length, 1, "⛔ KHÔNG bắt được mẫu `Purchasing` ⇒ cổng VÔ DỤNG");
  // ⛔ Mẫu HỢP LỆ — bộ dò này ⛔ KHÔNG được dùng để kết luận «sạch» cho toàn bộ màn (xem ghi chú đầu khối):
  assert.equal(rawIsoDisplayPatterns(`<td>{date(row.issuedAt)}</td>`).length, 0, "⛔ bắt nhầm chỗ ĐÃ dùng `date(...)`");
  assert.equal(rawIsoDisplayPatterns(`const day = datePart(purchasingRowDate(row));`).length, 0, "⛔ bắt nhầm chỗ dùng `datePart` cho LOGIC (⛔ không hiển thị)");
});
test("C10-7 · ⛔ KHÔNG render HẰNG `UI_TODAY` (ISO) THÔ ra màn hình — phải qua `date(...)`", () => {
  // ⭐ ĐO ĐƯỢC (`§C35`): màn «Giao việc & Kiểm soát hoàn thành» hiện `«Hôm nay 2026-10-07»` trong `<p class="muted">`
  //   ⇒ ⛔ KHÔNG NHẤT QUÁN với `dd/mm/yyyy`. Nguồn: `app/screens/WorkKanban.tsx` render `{UI_TODAY}` trực tiếp.
  // ⚠️ HỢP LỆ (⛔ KHÔNG phải lỗi — ⭐ đo được **3 chỗ** bị bắt nhầm ở lần chạy ĐẦU):
  //   ① ô nhập `defaultValue={UI_TODAY}` (HTML date input **bắt buộc** ISO) · ② **TÊN TỆP xuất** (`…_${UI_TODAY}` / `download*`).
  const rawTodayDisplays = (source) => {
    const hits = [];
    for (const m of source.matchAll(/\{\s*UI_TODAY\s*\}/g)) {
      const before = source.slice(Math.max(0, m.index - 140), m.index);
      if (/(defaultValue|value)\s*=\s*\{?\s*$/.test(before)) continue;              // ✅ ô nhập ngày
      if (/download|downloadCsv|downloadBlob|\.csv|\.json/i.test(before)) continue; // ✅ tên tệp xuất
      if (/\$\s*$/.test(before)) continue;                                          // ✅ trong template literal (tên tệp: `…_${UI_TODAY}`)
      hits.push(m[0]);
    }
    return hits;
  };
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
  const rawToday = files.filter((f) => rawTodayDisplays(read(f)).length);
  assert.deepEqual(rawToday, [], "⛔ Render `{UI_TODAY}` THÔ ra màn hình (hi ISO `yyyy-mm-dd`) ⇒ dùng `{date(UI_TODAY)}`:\n" + rawToday.join("\n"));
  // ⭐ tệp ĐÃ VÁ phải THỰC SỰ bọc `date(...)`:
  assert.match(read("app/screens/WorkKanban.tsx"), /Hôm nay \{date\(UI_TODAY\)\}/, "⛔ `WorkKanban.tsx` phải hiện «Hôm nay dd/mm/yyyy»");
  // ⛔ ĐỐI CHỨNG ÂM — mẫu ĐÚNG ⛔ không được bắt (nếu bắt ⇒ BÁO ĐỘNG GIẢ):
  assert.equal(rawTodayDisplays(`<p>Hôm nay {date(UI_TODAY)} — …</p>`).length, 0, "⛔ bắt nhầm chỗ ĐÃ bọc `date(...)`");
  assert.equal(rawTodayDisplays(`<input type="date" name="paymentDate" defaultValue={UI_TODAY} required/>`).length, 0, "⛔ bắt nhầm Ô NHẬP NGÀY");
  assert.equal(rawTodayDisplays("<button onClick={()=>downloadCsv(rows, `Chi_tiet_du_an_${pid}_${UI_TODAY}`)}>⇩ XUẤT</button>").length, 0, "⛔ bắt nhầm TÊN TỆP xuất");
  // ⭐ và PHẢI bắt được mẫu THẬT đã đo:
  assert.equal(rawTodayDisplays(`<p className="muted">Hôm nay {UI_TODAY} — thẻ hiển thị: …</p>`).length, 1, "⛔ KHÔNG bắt được mẫu THẬT `WorkKanban` ⇒ cổng VÔ DỤNG");
});