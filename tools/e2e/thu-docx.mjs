// KIỂM CHỨNG bộ sinh DOCX: sinh tệp → mở lại bằng .NET ZipFile → parse từng XML.
// ⛔ Không tin "nó đã ghi file" — phải mở lại và kiểm từng phần.
import { taoDocx } from "./docx.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const thu = join(dirname(fileURLToPath(import.meta.url)), "_thu-docx.docx");
const r = taoDocx(thu, {
  tieuDe: "BÁO CÁO THỬ — GIAI ĐOẠN 0",
  phuDe: "Kiểm chứng bộ sinh DOCX thuần Node · ngày 01/10/2026",
  khoiTao: (kh) => {
    kh.doan("Tài liệu này kiểm tra: tiêu đề, ba cấp đề mục, đoạn văn, danh sách, bảng có ô tô bóng, và ký tự tiếng Việt có dấu đầy đủ.");
    kh.h1("1. Cấp đề mục 1"); kh.doan("Nội dung thử nghiệm chuẩn tiếng Việt: Đề nghị mua hàng, đơn mua hàng, phiếu nhập kho, phiếu điều chuyển, phiếu xuất, hoàn trả vật tư.");
    kh.h2("1.1. Cấp đề mục 2"); kh.danhSach(["Tạo phiếu đề nghị mua hàng", "Duyệt đủ 5 bước", "Tách đơn mua hàng"]);
    kh.h3("1.1.1. Cấp đề mục 3"); kh.ghiChu("Dòng chú thích in nghiêng màu xám.");
    kh.bang(["Bước", "Vai trò", "Kết quả"], [
      ["1", "Trưởng phòng Dự án", "Đạt"],
      ["2", "Phòng Kế hoạch", "Đạt"],
      ["3", "Phòng Kế toán", "Đạt"],
    ]);
    kh.trang(); kh.h1("2. Trang thứ hai"); kh.doan("Nội dung sau ngắt trang.");
  },
});
console.log("  Đã sinh: " + r.duongDan + "  (" + r.byte + " byte)");