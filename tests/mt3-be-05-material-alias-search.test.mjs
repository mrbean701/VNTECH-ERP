// MT3 §IV.7 + quyết định user 27/09/2026 (A2) — TÌM VẬT TƯ THEO **TÊN PHỤ (alias)**.
//
// LỖI THẬT đã bịt: ô chọn vật tư trong modal tạo **MR/PR** chỉ khớp **ĐÚNG CHUỖI** `` `${code} · ${name}` ``
//   và `<datalist>` chỉ sinh option `code · name` ⇒ ⛔ **nhân sự tìm theo tên họ nhớ KHÔNG tìm được**.
//   (Nguyên văn user: «1 số nhân sự không nắm rõ tên chính xác của vật tư họ thường tìm theo tên mà họ nhớ.»)
//
// CÁCH BỊT: helper DÙNG CHUNG `lib/material-alias.ts` (§14) + nối vào `app/page.tsx`
//   (modal `RequestModal` + thanh tìm kiếm toàn cục). ⛔ KHÔNG thêm API máy chủ — alias đã có sẵn trong payload.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  aliasOf,
  normalizeForSearch,
  materialDisplayName,
  materialSearchTerms,
  findMaterialBySearch,
} from "../lib/material-alias.ts";

const PAGE = readFileSync("app/page.tsx", "utf8");

// ── Dữ liệu thử: 1 vật tư có 2 alias, 1 alias đã NGỪNG (active=0) ──────────────────────
const MATERIALS = [
  { id: "m1", code: "VT-001", name: "Thép hộp mạ kẽm 40x40x1.4mm", unit: "cây" },
  { id: "m2", code: "VT-002", name: "Xi măng PCB40", unit: "bao" },
];
const ALIASES = [
  { materialId: "m1", aliasName: "Thép hộp 40x40", active: 1 },
  { materialId: "m1", aliasName: "thép hộp mạ kẽm", active: 1 },
  { materialId: "m1", aliasName: "ALIAS-DA-NGUNG", active: 0 }, // ⛔ phải bị bỏ qua
  { materialId: "m2", aliasName: "PCB40", active: 1 },
];

test("aliasOf: chỉ lấy alias ĐANG HOẠT ĐỘNG của ĐÚNG vật tư (⛔ bỏ active=0)", () => {
  assert.deepEqual(aliasOf(ALIASES, "m1"), ["Thép hộp 40x40", "thép hộp mạ kẽm"]);
  assert.deepEqual(aliasOf(ALIASES, "m2"), ["PCB40"]);
  assert.deepEqual(aliasOf(ALIASES, "khong-co"), [], "vật tư không có alias ⇒ mảng rỗng");
  assert.ok(!aliasOf(ALIASES, "m1").includes("ALIAS-DA-NGUNG"), "⛔ alias active=0 KHÔNG được trả về");
});

test("normalizeForSearch: chịu được khác DẤU · khác HOA/THƯỜNG · thừa KHOẢNG TRẮNG", () => {
  assert.equal(normalizeForSearch("Thép Hộp"), normalizeForSearch("thep hop"));
  assert.equal(normalizeForSearch("  MẠ   KẼM "), normalizeForSearch("ma kem"));
  assert.equal(normalizeForSearch("Điều chuyển"), "dieu chuyen", "⛔ phải xử lý được chữ Đ");
});

test("findMaterialBySearch: tìm được theo ALIAS (đúng nhu cầu user)", () => {
  const byAlias = findMaterialBySearch(MATERIALS, ALIASES, "PCB40");
  assert.equal(byAlias?.id, "m2", "gõ alias «PCB40» phải ra vật tư VT-002");
  const byAlias2 = findMaterialBySearch(MATERIALS, ALIASES, "Thép hộp 40x40");
  assert.equal(byAlias2?.id, "m1", "gõ alias khác của cùng vật tư vẫn phải ra m1");
});

test("findMaterialBySearch: tìm alias KHÔNG DẤU cũng ra (nhân sự gõ nhanh)", () => {
  const hit = findMaterialBySearch(MATERIALS, ALIASES, "thep hop 40x40");
  assert.equal(hit?.id, "m1", "gõ không dấu vẫn phải tìm được");
});

test("findMaterialBySearch: ⛔ KHÔNG hồi quy — khớp «mã · tên» ĐÚNG như trước", () => {
  const label = materialDisplayName(MATERIALS[0]);
  assert.equal(label, "VT-001 · Thép hộp mạ kẽm 40x40x1.4mm");
  assert.equal(findMaterialBySearch(MATERIALS, ALIASES, label)?.id, "m1", "đường đi CŨ phải giữ nguyên");
});

test("findMaterialBySearch: ⛔ KHÔNG khớp mờ — tên lạ phải trả undefined (tránh chọn nhầm)", () => {
  assert.equal(findMaterialBySearch(MATERIALS, ALIASES, "xyz khong ton tai"), undefined);
  assert.equal(findMaterialBySearch(MATERIALS, ALIASES, ""), undefined);
});

test("materialSearchTerms: gồm NHÃN + MỌI alias (để sinh datalist gợi ý)", () => {
  assert.deepEqual(materialSearchTerms(MATERIALS[1], ALIASES), ["VT-002 · Xi măng PCB40", "PCB40"]);
});

test("app/page.tsx: modal tạo MR/PR đã DÙNG helper dùng chung (⛔ không còn `find` cứng)", () => {
  assert.match(PAGE, /from\s+"@\/lib\/material-alias"/, "phải import helper dùng chung (§14)");
  assert.match(PAGE, /findMaterialBySearch\(materials,data\.materialAliases,value\)/,
    "ô chọn vật tư phải tìm qua helper (khớp được alias)");
  assert.doesNotMatch(PAGE, /const found=materials\.find\(\(m\)=>`\$\{m\.code\|\|""\} · \$\{m\.name\|\|""\}`===value\)/,
    "⛔ đường cũ chỉ khớp `code · name` phải bị bỏ");
});

test("app/page.tsx: <datalist> vật tư có sinh thêm lựa chọn ALIAS", () => {
  assert.match(PAGE, /aliasOf\(data\.materialAliases,m\.id\)\.map\(/,
    "datalist phải phát thêm option cho alias (để gợi ý khi gõ tên nhớ)");
  assert.match(PAGE, /tên phụ/, "nhãn gợi ý phải nói rõ đây là «tên phụ»");
});

test("app/page.tsx: THANH TÌM KIẾM TOÀN CỤC cũng tìm vật tư theo alias", () => {
  assert.match(PAGE, /data\.materials\.forEach\(r=>add\("Vật tư","material_catalog",r\.id,[^;]*aliasOf\(data\.materialAliases,r\.id\)/,
    "kết quả tìm kiếm toàn cục cho vật tư phải gồm alias");
});
