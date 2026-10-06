// BỘ SINH BÁO CÁO — cùng một nội dung, xuất ra ĐÔNG THỜI file .md và file .docx chuẩn hoá.
// Lý do dùng chung: nếu tách hai đường ghi, .md và .docx sẽ trôi khỏi nhau và báo cáo thành sai lệch.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { taoDocx } from "./docx.mjs";

/** Ký hiệu trạng thái thống nhất, dùng giống nhau ở cả .md lẫn .docx. */
export const NHAN = { "ĐẠT": "PASS", "LỖI": "FAIL", "CẢNH BÁO": "WARN", "GHI NHẬN": "INFO" };

const md = (s) => String(s).replace(/\|/g, "\\|");
const oChu = (s) => String(s).replace(/`/g, "'");

/** Dựng cả .md và .docx từ MỘT danh sách khối nội dung.
 *  Mỗi khối: {loai:"tieuDe"|"phuDe"|"h1"|"h2"|"h3"|"doan"|"ghiChu"|"doiDong"|"trang"|"ds"|"bang", ...} */
export function viet(duongDan, khoiTao, { tieuDe, phuDe = null, ngay = null, thuMuc = "docs/KiemThuE2E" } = {}) {
  // ⛔ BỎ DẤU TRƯỚC rồi mới thay ký tự lạ — nếu không, "Báo cáo" ra thành "B-o-c-o" (mỗi ký tự có dấu bị thay bằng dấu gạch).
  // ⓘ "đ"/"Đ" KHÔNG tách được bằng NFD (nó là một ký tự riêng, không phải ký tự gốc + dấu) ⇒ phải thay tay,
  //    nếu không "đoạn" sẽ thành "-oan" mất chữ d.
  const khoa = tieuDe.replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  const mdPath = `${thuMuc}/${khoa}.md`;
  const dxPath = `${thuMuc}/${khoa}.docx`;
  mkdirSync(thuMuc, { recursive: true });

  // ── 1. Nuôi bộ sinh .docx để lấy văn bản đã khuôn ──────────────────────────
  const dich = [];
  const kh = {
    tieuDe: (s) => dich.push(["tieuDe", s]),
    h1: (s) => dich.push(["h1", s]), h2: (s) => dich.push(["h2", s]), h3: (s) => dich.push(["h3", s]),
    doan: (s) => dich.push(["doan", s]), ghiChu: (s) => dich.push(["ghiChu", s]),
    doiDong: () => dich.push(["doiDong"]), trang: () => dich.push(["trang"]),
    danhSach: (ds) => ds.forEach((x) => dich.push(["ds", x])),
    bang: (cot, hang, o = {}) => dich.push(["bang", cot, hang, o]),
  };
  khoiTao(kh);

  // ── 2. .md ────────────────────────────────────────────────────────────────
  const L = [];
  L.push("> **BÁO CÁO KIỂM THỬ E2E — VNTECH ERP V5.3.0**  ");
  L.push("> Dự án: `VNTECH_ERP_V5_3_0_MASTER_BASELINE` · Nhánh: `unity`  ");
  if (ngay) L.push("> Ngày lập: " + ngay + "  ");
  L.push("> Phạm vi: kiểm thử hành vi toàn hệ thống theo kịch bản nghiệp vụ thực tế  ");
  L.push("> Môi trường: `http://127.0.0.1:9000` (proxy) → UI `:8787` → backend Java `:18081`");
  L.push("");
  L.push("---");
  L.push("");
  L.push("# " + tieuDe);
  if (phuDe) L.push("*" + phuDe + "*");
  L.push("");
  for (const [loai, ...a] of dich) {
    if (loai === "tieuDe") continue; // tiêu đề đã vào dòng # ở trên
    else if (loai === "h1") L.push("## " + a[0] + "\n");
    else if (loai === "h2") L.push("### " + a[0] + "\n");
    else if (loai === "h3") L.push("#### " + a[0] + "\n");
    else if (loai === "doan") L.push(md(a[0]) + "\n");
    else if (loai === "ghiChu") L.push("> *" + md(a[0]) + "*\n");
    else if (loai === "doiDong") L.push("");
    else if (loai === "trang") L.push("\n---\n");
    else if (loai === "ds") L.push("- " + md(a[0]));
    else if (loai === "bang") {
      const [cot, hang] = a;
      L.push("| " + cot.map(md).join(" | ") + " |");
      L.push("|" + cot.map(() => "---").join("|") + "|");
      for (const r of hang) L.push("| " + r.map((x) => md(x)).join(" | ") + " |");
      L.push("");
    }
  }
  writeFileSync(mdPath, L.join("\n").replace(/\n{4,}/g, "\n\n\n") + "\n", "utf8");

  // ── 3. .docx ───────────────────────────────────────────────────────────────
  const r = taoDocx(dxPath, {
    tieuDe, phuDe,
    ngay: ngay || undefined,
    khoiTao: (b) => {
      b.tieuDe(tieuDe);
      if (phuDe) b.doan(phuDe);
      for (const [loai, ...x] of dich) {
        if (loai === "tieuDe") continue;
        if (loai === "h1") b.h1(x[0]);
        else if (loai === "h2") b.h2(x[0]);
        else if (loai === "h3") b.h3(x[0]);
        else if (loai === "doan") b.doan(x[0]);
        else if (loai === "ghiChu") b.ghiChu(x[0]);
        else if (loai === "doiDong") b.doiDong();
        else if (loai === "trang") b.trang();
        else if (loai === "ds") b.danhSach([x[0]]);
        else if (loai === "bang") b.bang(x[0], x[1], x[2] || {});
      }
    },
  });
  void oChu;
  return { md: mdPath, docx: dxPath, byte: r.byte };
}
