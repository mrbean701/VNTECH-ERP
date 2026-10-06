// VÒNG 1 (GO-LIVE) · D-107 — BUG-20261002-004: BẢNG PR LỆCH CỘT (tiêu đề không khớp dữ liệu).
//
// NGƯỜI DÙNG BÁO: «bảng danh sách PR đang hiển thị thông tin hỗn loạn hết cả lên» và chỉ đúng chỗ:
//   «thanh tiêu đề (thead) của bảng danh sách phiếu đề nghị mua (PR)».
//
// NGUYÊN NHÂN GỐC (đo được, KHÔNG đoán): dòng dữ liệu PR phát ra 12 ô `<td>` nhưng tiêu đề chỉ có
// 11 ô `<th>` (10 cột khai báo trong `PURCHASING_PR_COLUMNS` + 1 ô trống cho cột nút).
//   · Ô thứ 3 là BẢN SAO của ô thứ 2 — cả hai đều in mã dự án:
//       ô 2: `data.projects.find(...)?.code || row.projectCode`
//       ô 3: `row.projectCode || data.projects.find(...)?.code`   ← chỉ đảo thứ tự ưu tiên
//   · Vì thừa 1 ô, MỌI cột từ «Người đề nghị» trở đi bị đẩy lệch sang phải: «Người đề nghị»
//     hiện mã dự án, «Ngày đề nghị» hiện người đề nghị, … tới cột cuối tràn ra ngoài bảng.
//   · Lỗi có TRƯỚC thay đổi MỤC 7 (git diff xác nhận bản HEAD cũng 11 ô / 10 tiêu đề); MỤC 7 thêm
//     nút «Xem chi tiết PR» + `<th />` nhưng KHÔNG gỡ ô sao chép còn sót ⇒ vẫn lệch 1.
//
// BÀI HỌC: `tsc` EXIT=0, build ĐẠT, cổng UI 3/3 ✓, 79 vệ hợp đồng XANH — KHÔNG phép đo nào bắt được
// lỗi này, vì tất cả đều đọc MÃ NGUỒN chứ không đối chiếu SỐ Ô của tiêu đề với SỐ Ô của dữ liệu.
// Tệp này bù đúng lỗ hổng đó: đối chiếu CẤU TRÚC BẢNG, không đối chiếu chuỗi.
//
// CHẠY RIÊNG: node --import tsx --test tests/d107-bang-pr-khop-so-o.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FILE = fileURLToPath(new URL("../app/screens/Purchasing.tsx", import.meta.url));
const SOURCE = readFileSync(FILE, "utf8");

// Cắt đúng một khối bảng theo mốc dữ liệu của nó; `between` TỰ assert mốc tồn tại (D-089) nên
// nếu mốc đổi tên thì vệ ĐỎ chứ không âm thầm xanh.
function between(src, from, to) {
  const a = src.indexOf(from);
  assert.ok(a >= 0, `không tìm thấy mốc mở «${from}»`);
  const b = src.indexOf(to, a);
  assert.ok(b > a, `không tìm thấy mốc đóng «${to}» sau «${from}»`);
  return src.slice(a, b + to.length);
}

/** Số cột TIÊU ĐỀ: các cột khai báo trong mảng + mọi `<th` viết tay trong cùng khối. */
function soTieuDe(block, soCotKhaiBao) {
  const vietTay = (block.match(/<th[ />]/g) || []).length;
  const coMap = /\{PURCHASING_[A-Z]+_COLUMNS\.map\(/.test(block);
  // ⛔ Khi có `.map(` thì chính nó cũng chứa một thẻ `<th` ⇒ phải trừ 1, nếu không sẽ đếm thừa
  // (đã dính: bảng PO ra 11 tiêu đề trong khi thật là 10).
  return coMap ? soCotKhaiBao + (vietTay - 1) : vietTay;
}

/**
 * Số cột DỮ LIỆU của một dòng.
 * ⛔ Cắt từ `<tbody>` — KHÔNG cắt từ `purchasing-` vì chuỗi đó khớp ngay trong
 *   `data-vntech="purchasing-pr-table"` và sẽ lấy nhầm `</tr>` của phần tiêu đề (đã dính).
 * ⛔ Dòng PO có nhánh điều kiện `?<>3 ô</>:<td colSpan={3}>1 ô</>`: cả HAI nhánh đều nằm trong
 *   mã nguồn nên đếm thô ra 11 ô. `colSpan={3}` nghĩa là nhánh đó THAY CHO 3 cột ⇒ số cột hiệu
 *   dụng = số ô đếm được TRỪ số ô có `colSpan` (nhánh còn lại đã đủ số cột đó).
 */
function soOCotDuLieu(block) {
  const than = between(block, "<tbody>", "</tr>");
  const td = (than.match(/<td[ >]/g) || []).length;
  const soOCoColSpan = (than.match(/colSpan=\{/g) || []).length;
  return { td, hieuDung: td - soOCoColSpan };
}

/**
 * Tách các ô dữ liệu của dòng PR và tìm ô SAO CHÉP nhau.
 * ⛔ Phải BÓC dấu `{` `}` NGOÀI CÙNG trước khi so: lỗi gốc là `a || b` so với `b || a`,
 *   nếu để nguyên thì `{` dính vào toán hạng đầu nên hai chuỗi đã sắp xếp vẫn KHÁC nhau
 *   ⇒ vệ không bắt được (đã dính, V4 phát hiện).
 */
function oSaoChep(block) {
  const than = between(block, "<tbody>", "</tr>");
  const o = than
    .split("</td>")
    .map((s) => {
      const i = s.lastIndexOf("<td");
      if (i < 0) return "";
      return s
        .slice(i)
        .replace(/^<td[^>]*>/, "")
        .trim()
        .replace(/^\{/, "")
        .replace(/\}$/, "")
        .trim();
    })
    .filter(Boolean);
  const chuanHoa = (s) => s.split("||").map((x) => x.trim()).sort().join(" || ");
  const dem = new Map();
  for (const s of o) {
    const k = chuanHoa(s);
    dem.set(k, (dem.get(k) || 0) + 1);
  }
  return { o, trung: [...dem.entries()].filter(([, n]) => n > 1).map(([k]) => k) };
}

test("D-107 V1 — bảng PR: số ô dữ liệu PHẢI bằng số ô tiêu đề (10 cột + 1 ô nút)", () => {
  const block = between(SOURCE, 'data-vntech="purchasing-pr-table"', "</table>");
  const tieuDe = soTieuDe(block, 10); // PURCHASING_PR_COLUMNS có 10 cột
  const { td, hieuDung } = soOCotDuLieu(block);
  assert.equal(
    hieuDung,
    tieuDe,
    `bảng PR lệch cột: tiêu đề ${tieuDe} ô nhưng dữ liệu ${hieuDung} cột (đếm thô ${td} ô) ⇒ ` +
      `mọi cột sau ô thừa bị đẩy lệch. Sửa: gỡ ô <td> sao chép, hoặc thêm cột vào PURCHASING_PR_COLUMNS.`,
  );
});

test("D-107 V2 — bảng PR: KHÔNG có 2 ô nào in CÙNG một biểu thức (ô sao chép)", () => {
  const block = between(SOURCE, 'data-vntech="purchasing-pr-table"', "</table>");
  const { o, trung } = oSaoChep(block);
  assert.deepEqual(trung, [], `bảng PR có ô dữ liệu SAO CHÉP nhau:\n${trung.join("\n")}`);
  assert.ok(o.length >= 10, `phải nhận ra được các ô dữ liệu, hiện chỉ ${o.length}`);
});

test("D-107 V3 — bảng PO: số ô dữ liệu PHẢI bằng số ô tiêu đề (9 cột + 1 ô nút)", () => {
  const block = between(SOURCE, 'data-vntech="purchasing-po-table"', "</table>");
  const tieuDe = soTieuDe(block, 9); // PURCHASING_PO_COLUMNS có 9 cột
  const { td, hieuDung } = soOCotDuLieu(block);
  assert.equal(
    hieuDung,
    tieuDe,
    `bảng PO lệch cột: tiêu đề ${tieuDe} ô nhưng dữ liệu ${hieuDung} cột (đếm thô ${td} ô)`,
  );
});

test("D-107 V4 — ĐỐI CHỨNG ÂM: cài lại đúng ô sao chép của lỗi gốc thì V1+V2 phải ĐỎ", () => {
  const that = '<td>{data.projects.find((p)=>p.id===row.projectId)?.code||row.projectCode||"—"}</td>';
  const saoChep = '<td>{row.projectCode||data.projects.find((p)=>p.id===row.projectId)?.code||"—"}</td>';
  assert.ok(SOURCE.includes(that), "mẫu thay phải khớp ô mã dự án đang có");
  const hong = SOURCE.replace(that, that + saoChep);

  const block = between(hong, 'data-vntech="purchasing-pr-table"', "</table>");
  const tieuDe = soTieuDe(block, 10);
  const { hieuDung } = soOCotDuLieu(block);
  assert.notEqual(hieuDung, tieuDe, "V1 phải ĐỎ khi cài lại ô sao chép");

  // Dùng CHUNG `oSaoChep` với V2 (D-092: một cơ chế, không chép lại phép đo).
  const { trung } = oSaoChep(block);
  assert.ok(trung.length > 0, "V2 phải ĐỎ khi cài lại ô sao chép");
});