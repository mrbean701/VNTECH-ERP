// GO-LIVE 05/10/2026 — CỔNG HẸP: MỌI DẢI TAB (`role="tablist"`) PHẢI CÓ LỚP **ĐƯỢC ĐỊNH NGHĨA** TRONG CSS.
//
// ⛔ VÌ SAO CÓ CỔNG NÀY (lỗi thật đo được 05/10/2026):
//   `app/page.tsx:2638,2639` dựng 2 dải tab của màn Quản trị (bước 2 «Tổ chức» · bước 3 «Chức danh»)
//   bằng `<div className="admin-subtabs">` — nhưng lớp `admin-subtabs` **KHÔNG tồn tại trong BẤT KỲ
//   stylesheet nào** (`globals.css` IndexOf = -1 · `canonical.css` = false) ⇒ 2 dải tab đó **hoàn toàn
//   không được style**, lệch hẳn so với mọi dải tab khác. Trái GOAL §11 («tab trong cùng một modal phải
//   đồng nhất kích thước/căn chỉnh»).
//
// ⛔ VÌ SAO CỔNG CŨ KHÔNG BẮT ĐƯỢC: `scripts/css-baseline-audit.mjs` chỉ kiểm **một chiều** — «CSS CHẾT»
//   (lớp được ĐỊNH NGHĨA mà không ai dùng). Lỗi này là **chiều NGƯỢC LẠI** (lớp được DÙNG mà không
//   định nghĩa) nên cổng báo `dead classes=0 … ĐẠT` trong khi giao diện vẫn sai.
//
// ⛔ VÌ SAO CHỈ KIỂM `role="tablist"` MÀ KHÔNG KIỂM MỌI LỚP: đo thử trên toàn bộ `app/**/*.tsx` cho ra
//   **272 "lớp dùng mà không có CSS"** nhưng **đa số là GIẢ** (`index`, `key`, `String`, `onRowClick`,
//   `rowClassName`… — là định danh trong BIỂU THỨC JSX, không phải lớp CSS). Muốn kiểm mọi lớp thì phải
//   phân tích cú pháp JSX thật ⇒ ⛔ vượt phạm vi GO-LIVE (§12). Vì vậy cổng này **cố ý HẸP**: chỉ nhắm
//   dải tab, nơi §11 đòi hỏi đồng nhất và nơi lớp luôn là CHUỖI TĨNH.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const doc = (p) => readFileSync(new URL(p, root), "utf8");

const CSS = [doc("app/globals.css"), doc("app/styles/canonical.css")].join("\n");

function walk(d) {
  return readdirSync(new URL(d, root), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${d}${e.name}/`) : [`${d}${e.name}`]));
}

/** Lớp có được ĐỊNH NGHĨA trong stylesheet không (khớp `.ten-lop` và không dính hậu tố). */
const coDinhNghia = (lop) => new RegExp(`\\.${lop}(?![\\w-])`).test(CSS);

/** Mọi dải tab: thẻ có `role="tablist"` + `className` là CHUỖI TĨNH. */
function daiTab() {
  const ra = [];
  for (const f of walk("app/").filter((x) => x.endsWith(".tsx"))) {
    const s = readFileSync(new URL(f, root), "utf8");
    for (const m of s.matchAll(/<[a-zA-Z][^>]*?role="tablist"[^>]*?>/g)) {
      const the = m[0];
      const cm = the.match(/className="([^"]*)"/);
      if (!cm) continue;                       // className động ⇒ bỏ qua (⛔ không đoán)
      const lop = cm[1].split(/\s+/).filter(Boolean);
      ra.push({ f, dong: s.slice(0, m.index).split("\n").length, lop });
    }
  }
  return ra;
}

test("TABLIST-1 · mọi dải tab dùng lớp TĨNH và có ÍT NHẤT 1 lớp được định nghĩa trong CSS", () => {
  const ds = daiTab();
  assert.ok(ds.length >= 10, `phải quét được ≥10 dải tab (đo được ${ds.length}) — nếu ít hơn thì phép quét HỎNG`);
  const hong = [];
  for (const t of ds) {
    const dinhNghia = t.lop.filter(coDinhNghia);
    if (!dinhNghia.length) hong.push(`${t.f}:${t.dong} → className="${t.lop.join(" ")}" (KHÔNG lớp nào có CSS)`);
  }
  assert.deepEqual(hong, [],
    "Dải tab dùng lớp KHÔNG có CSS ⇒ hiển thị lệch hẳn các dải khác (GOAL §11):\n  " + hong.join("\n  "));
});

test("TABLIST-2 · ĐỐI CHỨNG ÂM — lớp bịa phải bị coi là KHÔNG định nghĩa", () => {
  // ⛔ Không có vệ này thì TABLIST-1 có thể «xanh vô nghĩa» nếu `coDinhNghia` luôn trả true.
  assert.equal(coDinhNghia("lop-bia-dat-khong-ton-tai-xyz"), false,
    "cổng hỏng: lớp bịa mà vẫn coi là 'có định nghĩa'");
  assert.equal(coDinhNghia("admin-subtabs"), false,
    "lớp `admin-subtabs` (đã gây lỗi 05/10) không được có CSS — nếu có thì đổi kỳ vọng này cho khớp");
  assert.equal(coDinhNghia("project-scope-tabs"), true,
    "lớp khuôn nhà `project-scope-tabs` PHẢI có CSS — nếu không thì cả cổng vô nghĩa");
});

test("TABLIST-3 · 2 dải tab màn Quản trị phải dùng KHUÔN NHÀ (không lớp tự chế)", () => {
  const page = doc("app/page.tsx");
  for (const [nhan, dau] of [["AD-05 Tổ chức", 'data-org-subtabs="AD-05"'], ["AD-06 Chức danh", 'data-position-subtabs="AD-06"']]) {
    const i = page.indexOf(dau);
    assert.ok(i > 0, `không tìm thấy dải tab ${nhan}`);
    const the = page.slice(page.lastIndexOf("<div", i), i);
    assert.match(the, /className="project-scope-tabs/, `${nhan} phải mang lớp khuôn nhà \`project-scope-tabs\``);
    assert.match(the, /role="tablist"/, `${nhan} phải có \`role="tablist"\` (trợ năng + nhận rule chung)`);
  }
});
