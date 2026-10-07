// MT3 §IV.7 + ma trận audit #6 — «Export Excel/CSV UTF-8».
//
// LỖI THẬT đã bịt: màn «Danh sách vật tư» (MaterialListTable) TRƯỚC ĐÂY **không có nút xuất thật**.
//   Các nút CRUD ở cột Thao tác chỉ **mượn LỚP CSS `export-mini`** — mà chính ma trận §A đã cảnh báo:
//   «`export-mini` (91 chỗ) ⚠️ nhiều nút KHÔNG PHẢI export nhưng dùng chung class».
//   ⇒ ⛔ Sự có mặt của lớp CSS **KHÔNG** phải bằng chứng chức năng.
//
// BÀI HỌC BẮT BUỘC (đã ghi vào CURRENT_TASK.md, lỗi lần thứ 4 của phiên):
//   Muốn kết luận một chức năng **CÓ**, phải chứng minh **ĐƯỜNG ĐI CHỨC NĂNG**:
//     (1) import đúng thư viện  →  (2) GỌI HÀM thật  →  (hoặc) (3) nhận qua props từ cha.
//   ⛔ KHÔNG được lấy lớp CSS / chuỗi văn bản làm bằng chứng.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { csvText } from "../lib/tabular-export.ts";

const SRC = readFileSync("app/screens/MaterialListTable.tsx", "utf8");

test("MaterialListTable: nạp THƯ VIỆN XUẤT DÙNG CHUNG (⛔ không tự viết lại CSV/Blob)", () => {
  assert.match(SRC, /from\s+"@\/lib\/tabular-export"/,
    "phải import thư viện xuất dùng chung (§14 — 1 thư viện cho nhiều màn)");
});

test("MaterialListTable: GỌI HÀM XUẤT THẬT (⛔ không chỉ có lớp CSS)", () => {
  assert.match(SRC, /downloadCsv\s*\(/,
    "phải GỌI hàm xuất thật — đây mới là bằng chứng «đường đi chức năng»");
});

test("MaterialListTable: nút xuất có onClick + nhãn nhìn thấy được", () => {
  assert.match(SRC, /data-vntech="material-export-csv"/, "cần mỏ neo đo được cho nút xuất");
  assert.match(SRC, /onClick=\{\(\)\s*=>\s*downloadCsv/, "nút xuất phải có onClick gọi hàm xuất");
  assert.match(SRC, /Xuất CSV/, "phải có nhãn tiếng Việt cho người dùng thấy");
});

test("MaterialListTable: xuất theo ĐÚNG dòng đang hiển thị (sau lọc + sắp xếp)", () => {
  // `rows` là biến ĐÃ lọc/sắp xếp (dùng cho DataTable). Xuất theo `rows` ⇒ «xuất đúng thứ đang thấy».
  assert.match(SRC, /rows\.map\(/, "phải xuất theo `rows` đã lọc, ⛔ không xuất toàn bộ dữ liệu thô");
});

test("Thư viện xuất dùng chung: sinh CSV ĐÚNG tiếng Việt (có nội dung, xuống dòng)", () => {
  const csv = csvText(["Mã vật tư", "Tên chuẩn"], [["VT-001", "Thép hộp mạ kẽm"]]);
  assert.match(csv, /VT-001/, "phải chứa dữ liệu dòng");
  assert.match(csv, /Thép hộp mạ kẽm/, "phải giữ ĐÚNG tiếng Việt có dấu");
  assert.match(csv, /[\r\n]/, "phải có xuống dòng giữa các bản ghi");
});
