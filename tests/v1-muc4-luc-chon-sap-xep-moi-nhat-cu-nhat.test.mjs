// VÒNG 1 (GO-LIVE) · MỤC 4 — «nút filter sắp xếp theo ngày, đổi thành 2 lựu chọn "Mới nhất" "Cũ nhất"».
//
// TÌNH HUỐNG ĐO ĐƯỢC: danh sách sắp xếp ĐÃ có đúng 2 lựa chọn, nhưng nhãn dài và lẫn kỹ thuật:
//   "Mới nhất trước (created DESC)" · "Cũ nhất trước"
// ⇒ người dùng phải hiểu `created DESC` là gì. Mục này rút nhãn về đúng 2 chữ "Mới nhất" / "Cũ nhất".
//
// HỢP ĐỒNG PHẢI GIỮ (đã grep toàn bộ `tests/` trước khi sửa):
//   · `tests/p01-p02-p03-contract.test.mjs:59-61` — `PURCHASING_DEFAULT_SORT === "created_desc"`,
//     `PURCHASING_SORTS[0].value === "created_desc"`, `PURCHASING_SORTS.length >= 2`.
//   · `tests/p01-purchasing-two-tabs.test.mjs:201-202` — tệp phải còn khoá `created_desc` và thanh chọn sắp xếp.
//   ⇒ CHỈ được đổi **nhãn hiển thị**; ⛔ KHÔNG được đổi `value`, thứ tự, hay mặc định.
//
// HAI LỚP BẰNG CHỨNG (không chỉ soi chuỗi):
//   1. GIÁ TRỊ THẬT — import `PURCHASING_SORTS` từ mã nguồn và kiểm đúng mảng nó trả về.
//   2. HÌNH DẠNG MÃ   — đọc tệp để chắc nhãn không còn mang thông tin kỹ thuật (D-089).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PURCHASING_SORTS, PURCHASING_DEFAULT_SORT } from "../app/screens/Purchasing.tsx";

const SOURCE = readFileSync(new URL("../app/screens/Purchasing.tsx", import.meta.url), "utf8");

const NHAN = PURCHASING_SORTS.map((s) => s.label);

test("MUC 4 V1 — chi DUNG 2 lua chon, dung 2 nhan nguoi dung yeu cau", () => {
  assert.equal(PURCHASING_SORTS.length, 2, `phai co dung 2 lua chon, hien tai = ${PURCHASING_SORTS.length}`);
  assert.deepEqual(NHAN, ["Mới nhất", "Cũ nhất"], `nhan phai la ["Mới nhất","Cũ nhất"], hien tai = ${JSON.stringify(NHAN)}`);
});

test("MUC 4 V2 — nhan khong con mang thong tin ky thuat / khong con chu 'truoc'", () => {
  for (const label of NHAN) {
    assert.doesNotMatch(label, /created|DESC|ASC|trước/, `nhan "${label}" van con thong tin thua hoac thuat ngu ky thuat`);
  }
});

test("MUC 4 V3 — nhan lay tu MOT nguon duy nhat, khong co ban sao 'SORT_LABEL' tach rieng", () => {
  // D-092: một thay đổi — một cơ chế. Trước đây có 2 bản chữ nhãn (PURCHASING_SORTS + SORT_LABEL)
  // nên sửa một bên là lệch bên kia. Nay SORT_LABEL phải SUY RA từ PURCHASING_SORTS.
  assert.match(
    SOURCE,
    /const SORT_LABEL[^=]*=\s*Object\.fromEntries\(\s*PURCHASING_SORTS\.map\(/,
    "SORT_LABEL phai suy ra tu PURCHASING_SORTS de khong bao gio tach khoi nhau",
  );
  assert.doesNotMatch(
    SOURCE,
    /SORT_LABEL:\s*Record<string,\s*string>\s*=\s*\{\s*\n?\s*created_desc:/,
    "khong duoc viet lai bang goc chuoi 'created_desc:' — do la ban sao moi cua nhan",
  );
});

test("MUC 4 V4 — HOP DONG P-02: gia tri va thu tu khong doi", () => {
  assert.equal(PURCHASING_DEFAULT_SORT, "created_desc", "mac dinh van la created_desc");
  assert.equal(PURCHASING_SORTS[0].value, "created_desc", "lua chon DAU phai van la created_desc");
  assert.equal(PURCHASING_SORTS[1].value, "created_asc", "lua chon SAU phai van la created_asc");
  assert.equal(PURCHASING_SORTS[0].label, "Mới nhất", "lua chon dau phai la 'Moi nhat'");
});

test("MUC 4 V5 — DOC CHUNG AM: doi nhan hoac bo khai bao thi V1 va V3 phai DO", () => {
  const veDoi = SOURCE
    .replace(/{ value: "created_desc", label: "Mới nhất" }/, '{ value: "created_desc", label: "Moi nhat truoc (created DESC)" }')
    .replace(/{ value: "created_asc", label: "Cũ nhất" }/, '{ value: "created_asc", label: "Cu nhat truoc" }');
  assert.notEqual(veDoi, SOURCE, "mau doi nhan khong khop mo hinh that trong tep — hay do lai noi dung nhan");

  const phaiDo = veDoi
    .match(/label: "([^"]*)"/g) || []
    .some((m) => /trước|created/i.test(m));
  assert.ok(phaiDo, "V2 phai phat hien nhan cu chua sua — neu V2 van xanh tren ban sai thi V2 la VỆ RỖNG");

  const boKhaiBao = SOURCE.replace(
    /const SORT_LABEL[^=]*=\s*Object\.fromEntries\(\s*PURCHASING_SORTS\.map\([^;]*;/,
    'const SORT_LABEL: Record<string, string> = { created_desc: "Moi nhat", created_asc: "Cu nhat" };',
  );
  assert.notEqual(boKhaiBao, SOURCE, "mau bo khai bao khong khop — hay do lai cu phap khai bao");
  assert.doesNotMatch(boKhaiBao, /Object\.fromEntries\(\s*PURCHASING_SORTS\.map\(/, "V3 phai DO khi quay ve bang chuoi ban sao");
});