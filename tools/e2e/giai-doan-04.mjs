// GIAI DOAN 4 — CẤU HÌNH HỆ THỐNG NHÓM VẬT TƯ + 200 MÃ VẬT TƯ CÓ TÊN PHỤ
//
// Mục tiêu (kịch bản người dùng):
//   "Kế toán cấu hình hệ thống nhóm - vật tư và tạo 200 mã vật tư kèm TÊN PHỤ."
//
// ⛔ TUYỆT ĐỐI KHÔNG xoá / sửa dữ liệu có sẵn — chỉ TẠO MỚI, mọi thứ mới mang tiền tố `E2E-`.
// ⛔ Idempotent: luôn kiểm tra "đã có chưa" trước khi tạo ⇒ chạy lại nhiều lần không tạo trùng.
// ⛔ KHÔNG dùng cờ boQuaLoi — mọi lệnh ghi đi qua coThat()/buoc() và kiểm `ok` thật.
// ⛔ KHÔNG dùng require(), KHÔNG dùng node -e, KHÔNG escape \uXXXX — tiếng Việt thật.
//
// HỢP ĐỒNG PAYLOAD (đọc từ mã nguồn, không đoán):
//   save_material_category   → { code*, name*, description?, parentId?, sortOrder?, categoryId? }   (* = bắt buộc)
//   save_material_subcategory→ { categoryId*, name*, code?, description?, scopeExamples?,
//                                reviewStatus?, adjustmentNote?, sortOrder?, subcategoryId? }
//   save_material            → { code*, name*, unit*, categoryId*, subcategoryId?, materialId?,
//                                specification?, brand?, standardPrice?, minStock?, requiresMar?,
//                                isComponent?, formulaKey?, active?, aliasText? }
//        `aliasText` = TÊN PHỤ: tách bằng `;` hoặc xuống dòng, máy chủ tự chuẩn hoá + kiểm trùng.
//        KHÔNG có action riêng "tạo tên phụ" — mọi tên phụ đi qua đúng trường aliasText của save_material.
import { writeFileSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const TIEN_TO = "E2E-";
const TONG_MA_YEU_CAU = 200;
const SO_LAN_SONG_SONG = 5;
const CHI_KHAO_SAT = process.argv[2] === "--khao-sat";

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU CHUẨN BỊ (ngành xây dựng) — 9 hệ nhóm, mỗi hệ có nhóm con + danh mục vật tư
// Mỗi vật tư = 1 tên chính + 1 TÊN PHỤ (tên gọi tắt) + 1 tên gọi miệng tại hiện trường.
// ─────────────────────────────────────────────────────────────────────────────
const B = (...xs) => xs.map((s) => { const i = s.indexOf("|"); return { ten: s.slice(0, i), vietTat: s.slice(i + 1) }; });
const P = (ten, tenPhu, donVi, gia, thuongHieu, bien) => ({ ten, tenPhu, donVi, gia, thuongHieu, bien });

const HE_NHOM = [
  {
    maNhom: "XM", code: "E2E-XIMANG", ten: "Xi măng & bê tông", mucDich: 25,
    moTa: "Xi măng các loại, bê tông tươi, vữa trộn sẵn và phụ gia trộn vữa.",
    nhomCon: ["Xi măng thông thường", "Xi măng chuyên dụng", "Bê tông & vữa", "Phụ gia trộn vữa"],
    sanPham: [
      P("Xi măng Portland PC40 Bắc Thành", "XM Bắc Thành PC40", "kg", 12500, "Bắc Thành", B("Bao 40 kg|40kg", "Bao 50 kg|50kg", "Kiên hàng 1 tấn|1T")),
      P("Xi măng Portland PCB40 Bắc Thành", "XM Bắc Thành PCB40", "kg", 11800, "Bắc Thành", B("Bao 40 kg|40kg", "Bao 50 kg|50kg")),
      P("Xi măng Portland PC40 Thăng Long", "XM Thăng Long PC40", "kg", 12100, "Thăng Long", B("Bao 40 kg|40kg", "Kiên hàng 1 tấn|1T")),
      P("Xi măng Portland PC40 Hồng Thái B", "XM Hồng Thái B PC40", "kg", 11400, "Hồng Thái B", B("Bao 40 kg|40kg", "Bao 50 kg|50kg")),
      P("Xi măng trộn sẵn cấy kiền trạng", "XM trộn sẵn", "kg", 9600, "Cấy kiền trạng", B("Bao 40 kg|40kg", "Bao 50 kg|50kg")),
      P("Xi măng chống thấm bitum polymer", "XM chống thấm", "kg", 18500, "Bitum Polymer", B("Bao 25 kg|25kg", "Bao 40 kg|40kg")),
      P("Xi măng pozzolan PCC40 Holcim", "XM pozzolan PCC40", "kg", 12300, "Holcim", B("Bao 40 kg|40kg", "Kiên hàng 1 tấn|1T")),
      P("Xi măng xám lấy khuôn", "XM xám khuôn", "kg", 6800, "VNM Corp", B("Bao 20 kg|20kg", "Bao 40 kg|40kg")),
      P("Bê tông tươi mác 250", "BT tươi C250", "m3", 1650000, "VNM Corp", B("Đổ bằng thông|thông", "Đổ bằng bơm|bơm")),
      P("Bê tông tươi mác 300", "BT tươi C300", "m3", 1820000, "VNM Corp", B("Đổ bằng thông|thông", "Đổ bằng bơm|bơm")),
      P("Vữa tươi trộn sẵn mác 75", "Vữa tươi M75", "m3", 1850000, "VNM Corp", B("Trộn tại chỗ|chỗ", "Trộn tại trạm|trạm")),
      P("Phụ gia bê tông siêu dẻo", "Phụ gia siêu dẻo", "lít", 42000, "Sika", B("Can 5 lít|5L", "Can 25 lít|25L")),
    ],
  },
  {
    maNhom: "TH", code: "E2E-THEP", ten: "Thép", mucDich: 30,
    moTa: "Thép cán, thép ống hộp, thép tấm và lưới thép hàn.",
    nhomCon: ["Thép cán dây", "Thép ống & hộp", "Thép tấm & lưới"],
    sanPham: [
      P("Thép cây dây thép D10", "Thép cây D10", "kg", 15600, "Hòa Phát", B("Đường kính 10 mm|D10", "Chiều dài 12 m|12m", "Chiều dài 6 m|6m")),
      P("Thép cây dây thép D12", "Thép cây D12", "kg", 15400, "Hòa Phát", B("Đường kính 12 mm|D12", "Chiều dài 12 m|12m", "Chiều dài 6 m|6m")),
      P("Thép cây dây thép D13", "Thép cây D13", "kg", 15300, "Hòa Phát", B("Đường kính 13 mm|D13", "Chiều dài 12 m|12m")),
      P("Thép cây dây thép D16", "Thép cây D16", "kg", 15200, "Hòa Phát", B("Đường kính 16 mm|D16", "Chiều dài 12 m|12m")),
      P("Thép cây dây thép D20", "Thép cây D20", "kg", 15100, "Hòa Phát", B("Đường kính 20 mm|D20", "Chiều dài 12 m|12m")),
      P("Thép cây dây thép D25", "Thép cây D25", "kg", 15000, "Hòa Phát", B("Đường kính 25 mm|D25", "Chiều dài 12 m|12m")),
      P("Ống thép tròn không đường D48", "Ống thép D48", "kg", 15200, "Hòa Phát", B("Đường kính 48.3 mm|D48", "Chiều dài 6 m|6m")),
      P("Ống thép tròn liền D60", "Ống thép D60", "kg", 15300, "Hòa Phát", B("Đường kính 60.3 mm|D60", "Chiều dài 6 m|6m")),
      P("Ống thép vuông 50x50", "Ông vuông 50x50", "kg", 15400, "Hòa Phát", B("Kích thước 50x50 mm|50x50", "Chiều dài 6 m|6m")),
      P("Hộp thép 100x50 dày 2", "Hộp thép 100x50", "kg", 15600, "Hòa Phát", B("Kích thước 100x50x2 mm|100x50x2", "Chiều dài 6 m|6m")),
      P("Tấm thép Q235", "Tấm thép Q235", "kg", 15800, "Hòa Phát", B("Dày 3 mm|3mm", "Khổ 1500x6000 mm|1500x6000")),
      P("Tấm thép Q345", "Tấm thép Q345", "kg", 16900, "Hòa Phát", B("Dày 5 mm|5mm", "Khổ 1500x6000 mm|1500x6000")),
      P("Lưới thép hàn Q4", "Lưới hàn Q4", "m2", 38000, "Hòa Phát", B("Mắt lưới 100x100 mm|100x100", "Mắt lưới 200x200 mm|200x200")),
      P("Lưới thép dây Q3", "Lưới dây Q3", "m2", 26000, "Hòa Phát", B("Mắt lưới 100x100 mm|100x100", "Mắt lưới 150x150 mm|150x150")),
    ],
  },
  {
    maNhom: "GO", code: "E2E-GACH", ten: "Gạch ốp lát", mucDich: 22,
    moTa: "Gạch xây, gạch ốp tường, gạch lát sàn và gạch trang trí.",
    nhomCon: ["Gạch xây", "Gạch ốp tường", "Gạch lát sàn", "Gạch trang trí"],
    sanPham: [
      P("Gạch xây ống", "Gạch ống 6.5", "viên", 1250, "Tuynel", B("Kích thước 6.5x10.5x22 cm|6.5-22", "Kích thước 6.5x10.5x22 cm đặc|đặc-22")),
      P("Gạch xây đặc", "Gạch xây đặc", "viên", 1750, "Tuynel", B("Kích thước 10x10x22 cm|10-22", "Kích thước 10.5x10.5x22 cm|10.5-22")),
      P("Gạch xây bê tông", "Gạch bê tông", "viên", 4500, "An Phú", B("Kích thước 20x10x40 cm|20-40", "Kích thước 20x10x50 cm|20-50")),
      P("Gạch ốp tường 30x60", "Gạch ốp 30x60", "viên", 7800, "Ceramic Viglacera", B("Màu kem|kem", "Màu cà phê|cà phê")),
      P("Gạch ốp tường 45x90", "Gạch ốp 45x90", "viên", 15500, "Ceramic Viglacera", B("Màu trắng|trắng", "Màu vân gỗ|vân gỗ")),
      P("Gạch ốp chống nước", "Gạch ốp chống nước", "viên", 11500, "Taicera", B("Kích thước 30x60x9 cm|30x60", "Kích thước 40x80x9 cm|40x80")),
      P("Gạch lát sàn granit 60x60", "Gạch granit 60x60", "viên", 18500, "Granit Đông Á", B("Màu xám đậm|xám đậm", "Màu nâu|nâu")),
      P("Gạch lát sàn granit 80x80", "Gạch granit 80x80", "viên", 32000, "Granit Đông Á", B("Màu xám sáng|xám sáng", "Màu kem|kem")),
      P("Gạch lát sàn gốm 50x50", "Gạch gốm 50x50", "viên", 9500, "Taicera", B("Màu xám|xám", "Màu be|be")),
      P("Gạch lát ngoài trời 40x40", "Gạch lát ngoài", "viên", 12500, "Taicera", B("Màu xám|xám", "Màu đỏ|đỏ")),
      P("Gạch trang trí mosaic", "Gạch mosaic", "m2", 165000, "Viglacera", B("Màu xanh|xanh", "Màu trắng|trắng")),
    ],
  },
  {
    maNhom: "ON", code: "E2E-CTN-ONGNUOC", ten: "Ống nước & phụ kiện", mucDich: 25,
    moTa: "Ống nước PVC/PEF/PP-R/PE, phụ kiện ống, van và bể nước.",
    nhomCon: ["Ống nước PVC", "Ống nước PEF & PP-R", "Phụ kiện ống nước", "Van & bể nước"],
    sanPham: [
      P("Ống nước PVC cứng", "Ống PVC cứng", "m", 24500, "Tiền Phong", B("Kích thước 21 PN10|21 PN10", "Kích thước 27 PN10|27 PN10", "Kích thước 33 PN10|33 PN10")),
      P("Ống nước PVC lưới gia cố", "Ống PVC lưới", "m", 42000, "Tiền Phong", B("Kích thước 33 PN10|33 PN10", "Kích thước 42 PN10|42 PN10")),
      P("Ống nhựa PEF cấp nước", "Ống PEF", "m", 28500, "Tây Đô", B("Kích thước 20 PN10|20 PN10", "Kích thước 25 PN10|25 PN10", "Kích thước 32 PN10|32 PN10")),
      P("Ống nhựa PP-R cấp nước nóng", "Ống PP-R", "m", 38000, "Tây Đô", B("Kích thước 20 PN16|20 PN16", "Kích thước 25 PN16|25 PN16", "Kích thước 32 PN16|32 PN16")),
      P("Ống nước PE", "Ống PE", "m", 46000, "Tây Đô", B("Kích thước 40 PN10|40 PN10", "Kích thước 50 PN10|50 PN10")),
      P("Ống thoát nước PVC", "Ống thoát PVC", "m", 28000, "Tiền Phong", B("Đường kính 110|110", "Đường kính 140|140")),
      P("Cút nước PVC 90 độ", "Cút PVC 90", "cái", 3200, "Tiền Phong", B("Kích thước 21|21", "Kích thước 27|27", "Kích thước 33|33")),
      P("Tê nước PVC 90 độ", "Tê PVC 90", "cái", 3600, "Tiền Phong", B("Kích thước 21|21", "Kích thước 27|27", "Kích thước 33|33")),
      P("Van khóa nước nhựa PP-R", "Van khóa PP-R", "cái", 18500, "Tây Đô", B("Kích thước 25 PN16|25 PN16", "Kích thước 32 PN16|32 PN16")),
      P("Bể nước PE nhựa", "Bể nước PE", "cái", 4800000, "Tân Á", B("Thể tích 1.000 lít|1000L", "Thể tích 1.500 lít|1500L")),
    ],
  },
  {
    maNhom: "DD", code: "E2E-DIEN-THIETBI", ten: "Thiết bị điện", mucDich: 24,
    moTa: "Dây điện, cáp, thiết bị bảo vệ, ổ cắm công tắc và thiết bị chiếu sáng.",
    nhomCon: ["Dây điện & cáp", "Thiết bị bảo vệ", "Ổ cắm & công tắc", "Đèn & chiếu sáng"],
    sanPham: [
      P("Dây điện CV 2.5", "Dây CV 2.5", "m", 13500, "Dây Điện Việt", B("Màu đỏ|đỏ", "Màu xanh dương|xanh")),
      P("Dây điện CV 4.0", "Dây CV 4.0", "m", 20500, "Dây Điện Việt", B("Màu đỏ|đỏ", "Màu đen|đen")),
      P("Cáp điện trên thang", "Cáp trên thang", "m", 98000, "Thép Sài Gòn", B("Tiết diện 2x25+10 mm2|2x25+10", "Tiết diện 3x25+10 mm2|3x25+10")),
      P("Cáp điện CV 3 lõi", "Cáp CV 3 lõi", "m", 28500, "Dây Điện Việt", B("Tiết diện 3x2.5 mm2|3x2.5", "Tiết diện 3x4 mm2|3x4")),
      P("Cầu dao gạt 2 cực", "Cầu dao 2 cực", "cái", 32000, "Schneider", B("Cấp điện 16A|16A", "Cấp điện 32A|32A")),
      P("MCCB 3P", "MCCB 3P", "cái", 480000, "Schneider", B("Dòng định mức 100A|100A", "Dòng định mức 125A|125A")),
      P("Rơ le bảo vệ quá tải 1P", "Rơ le 1P", "cái", 26000, "Schneider", B("Cấp điện 20A|20A", "Cấp điện 32A|32A")),
      P("Ổ cắm âm tường tiêu chuẩn", "Ổ cắm âm tường", "cái", 12500, "Legrand", B("Màu trắng|trắng", "Màu xám|xám")),
      P("Công tắc 2 chiều", "Công tắc 2 chiều", "cái", 28000, "Merten", B("Màu trắng|trắng", "Màu xám|xám")),
      P("Bóng đèn LED 9W", "Đèn LED 9W", "bóng", 8500, "Philips", B("Ánh sáng trắng|trắng", "Ánh sáng vàng|vàng")),
      P("Đèn LED panel 36W", "Đèn panel 36W", "cái", 185000, "Philips", B("Kích thước 600x600 mm|600x600", "Kích thước 300x1200 mm|300x1200")),
      P("Đèn đường LED", "Đèn đường LED", "bóng", 1450000, "Philips", B("Công suất 100W|100W", "Công suất 150W|150W")),
    ],
  },
  {
    maNhom: "DM", code: "E2E-DAUMOS", ten: "Dầu mỡ & hóa chất", mucDich: 18,
    moTa: "Dầu bôi trơn, dầu hộp số, dầu thủy lực, hóa chất và sơn dung môi.",
    nhomCon: ["Dầu mỡ bôi trơn", "Dầu hộp số & thủy lực", "Hóa chất xử lý", "Sơn & dung môi"],
    sanPham: [
      P("Dầu mỡ bôi trơn", "Dầu mỡ bôi", "kg", 88000, "Shell", B("Đóng can 1 kg|1kg", "Đóng can 4 kg|4kg")),
      P("Dầu hộp số", "Dầu hộp số", "lít", 145000, "Shell", B("Đóng can 1 lít|1L", "Đóng can 4 lít|4L")),
      P("Dầu thủy lực 46", "Dầu thuỷ lực 46", "lít", 96000, "Shell", B("Đóng can 20 lít|20L", "Đóng can 208 lít|208L")),
      P("Dầu thủy lực 68", "Dầu thuỷ lực 68", "lít", 102000, "Mobil", B("Đóng can 20 lít|20L", "Đóng can 208 lít|208L")),
      P("Dầu cắt gọt", "Dầu cắt gọt", "lít", 78000, "Mobil", B("Đóng can 20 lít|20L", "Đóng can 25 lít|25L")),
      P("Rỉ ức chế rỉ nhớt 1T-3k", "Rỉ nhớt 1T-3k", "lít", 48000, "Shell", B("Đóng can 208 lít|208L", "Đóng can 20 lít|20L")),
      P("Vỏ hộp bánh răng 0.5S", "Vỏ hộp 0.5S", "kg", 125000, "Mobil", B("Vỉ 5 kg|5kg", "Hộp 18 kg|18kg")),
      P("Chlorine 70%", "Chlorine 70%", "kg", 42000, "Hà Nội", B("Can 5 kg|5kg", "Can 25 kg|25kg")),
      P("Axit cloric 12%", "Axit cloric 12%", "kg", 36000, "Hà Nội", B("Can 5 kg|5kg", "Can 30 kg|30kg")),
    ],
  },
  {
    maNhom: "VP", code: "E2E-VATTUPHU", ten: "Vật tư phụ", mucDich: 22,
    moTa: "Bao bì, chống thấm, vật tư phụ hoàn thiện, keo dán và phụ kiện bê tông.",
    nhomCon: ["Vật tư phụ hoàn thiện", "Bao bì & màng chống", "Keo dán & chống thấm", "Phụ kiện bê tông"],
    sanPham: [
      P("Bao PP dây", "Bao PP", "kg", 18500, "Hà Nội", B("Quy cách 2 chỉ|2chỉ", "Quy cách 3 chỉ|3chỉ")),
      P("Cọc tre", "Cọc tre", "cây", 75000, "Nông nghiệp", B("Đường kính 6 cm|D6", "Đường kính 8 cm|D8")),
      P("Bao PP bọc bả vệ bê tông", "Bọc bả bê tông", "kg", 14500, "Hà Nội", B("Rộng 1 m|1m", "Rộng 2 m|2m")),
      P("Màng dựng hơi HDPE", "Màng dựng hơi", "m", 18000, "Nhựa Đông Á", B("Rộng 2 m|2m", "Rộng 4 m|4m")),
      P("Xốp EPS tường", "Xốp EPS tường", "m2", 42000, "Hà Nội", B("Dày 50 mm|50mm", "Dày 100 mm|100mm")),
      P("Tấm lợp fibrocement", "Tấm lợp fibro", "m2", 96000, "Incom", B("Dày 3.5 mm|3.5mm", "Dày 4.0 mm|4mm")),
      P("Lưới chống nứt mặt tường", "Lưới chống nứt", "m2", 8500, "Hà Nội", B("Mắt lưới 5x5 mm|5x5", "Mắt lưới 10x10 mm|10x10")),
      P("Keo dán gạch", "Keo dán gạch", "kg", 68000, "Cemix", B("Thùng 5 kg|5kg", "Thùng 20 kg|20kg")),
      P("Keo silicon chống thấm", "Keo silicon", "cái", 32000, "Sika", B("Ống 300 ml|300ml", "Ống 500 ml|500ml")),
      P("Dây thép buộc lưới", "Dây buộc lưới", "kg", 19000, "Hà Nội", B("Quy cách 1.0 mm|1.0mm", "Quy cách 1.2 mm|1.2mm")),
      P("Đinh thép xây dựng", "Đinh thép", "kg", 16500, "Hà Nội", B("Chân trục 4x100 mm|4x100", "Chân trục 4x120 mm|4x120")),
    ],
  },
  {
    maNhom: "DC", code: "E2E-DUNGCU", ten: "Dụng cụ", mucDich: 18,
    moTa: "Dụng cụ cầm tay, dụng cụ đo lười, thiết bị bảo hộ và máy thi công.",
    nhomCon: ["Dụng cụ cầm tay", "Dụng cụ đo lười", "Bảo hộ & máy thi công"],
    sanPham: [
      P("Xẻng xây", "Xẻng xây", "cái", 95000, "Thái Bình", B("Lưỡi dày 1.2 mm|1.2mm", "Lưỡi dày 1.5 mm|1.5mm")),
      P("Búa khay", "Búa khay", "cái", 145000, "Thái Bình", B("Trọng lượng 1.5 kg|1.5kg", "Trọng lượng 2.0 kg|2kg")),
      P("Cây xây", "Cây xây", "cái", 120000, "Thái Bình", B("Cán gỗ 1.2 m|1.2m", "Cán gỗ 1.5 m|1.5m")),
      P("Đá mài", "Đá mài", "cái", 32000, "Lưỡi liền", B("Số 125|125", "Số 180|180")),
      P("Khoen kéo dây", "Khoen kéo dây", "cái", 12000, "Nhật", B("Loại khoen 25 ký|25ký", "Loại khoen 32 ký|32ký")),
      P("Thước dây", "Thước dây", "cái", 28000, "Hà Nội", B("Chiều dài 5 m|5m", "Chiều dài 8 m|8m")),
      P("Đồng hồ đo điện từ", "Đồng hồ điện", "cái", 185000, "Mitsubishi", B("Dòng đo 100A|100A", "Dòng đo 200A|200A")),
      P("Máy cắt bê tông", "Máy cắt bê tông", "cái", 3800000, "Mikasa", B("Đường kính lưỡi 350 mm|350mm", "Đường kính lưỡi 400 mm|400mm")),
      P("Khẩu trụ bảo hộ", "Khẩu trụ", "cái", 45000, "3M", B("Màu trắng|trắng", "Màu vàng|vàng")),
    ],
  },
  {
    maNhom: "BH", code: "E2E-BAOHIEM", ten: "Bảo hiểm cơ khí", mucDich: 16,
    moTa: "Bao bọc máy, phụ tùng bảo hành và kho vật tư dự phòng cho thiết bị.",
    nhomCon: ["Bao bọc máy", "Phụ tùng bảo hành", "Kho vật tư dự phòng"],
    sanPham: [
      P("Đệm lưng chống rung", "Đệm lưng", "cái", 320000, "ACE", B("Tải trọng 500 kg|500kg", "Tải trọng 1000 kg|1000kg")),
      P("Bao bọc máy đào", "Bao bọc máy đào", "cái", 450000, "ACE", B("Kích thước S|S", "Kích thước M|M", "Kích thước L|L")),
      P("Bộ lọc gió khí nén", "Bộ lọc gió", "bộ", 45000, "ACE", B("Cấp lọc F1|F1", "Cấp lọc F2|F2")),
      P("Van an toàn khí nén", "Van an toàn", "cái", 55000, "ACE", B("Ren 1/2 inch|ren12", "Ren 3/4 inch|ren34")),
      P("Công suất khí nén", "Công suất", "cái", 320000, "ACE", B("Cho 1 đầu nối|1đầu", "Cho 2 đầu nối|2đầu")),
      P("Bộ nở vặn khí nén", "Bộ nở vặn", "bộ", 185000, "ACE", B("Bộ 2 đầu|2đầu", "Bộ 3 đầu|3đầu")),
      P("Cánh gió quạt tháp", "Cánh gió quạt", "cái", 78000, "ACE", B("Đường kính 1.2 m|1.2m", "Đường kính 1.5 m|1.5m")),
      P("Bộ van phao bảo vệ", "Bộ van phao", "bộ", 42000, "ACE", B("Kích thước DN80|DN80", "Kích thước DN100|DN100")),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH
// ─────────────────────────────────────────────────────────────────────────────
/** Chuẩn hoá tên y hệt máy chủ (MaterialSystemCodes.normalizeMaterialName) — dùng để chặn trùng. */
function chuanHoaTen(gia) {
  return String(gia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/\b(phi|dn|d|ø)\s*(\d+)/g, "d$2").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Sinh danh sách 200 mã vật tư: mã / tên chính / tên phụ / đơn vị / đơn giá / nhóm. */
function taoDanhSachVatTu() {
  const ra = [];
  const dungTen = new Set();
  const dungTenPhu = new Set();
  for (const he of HE_NHOM) {
    let so = 0;
    for (let i = 0; i < he.sanPham.length && so < he.mucDich; i++) {
      const sp = he.sanPham[i];
      for (const bien of sp.bien) {
        if (so >= he.mucDich) break;
        const ten = `${sp.ten} ${bien.ten}`;
        const tenPhu = `${sp.tenPhu} ${bien.vietTat}`;
        // ⛔ TÊN PHỤ: luôn ≥1 tên phụ KHÁC tên chính.
        //   Quy tắc của máy chủ: một tên (đã chuẩn hoá) chỉ thuộc 1 mã duy nhất — "Tên tương đương X
        //   đang thuộc mã Y; không được ghép hai vật tư khác thông số". Vì vậy KHÔNG dùng tên phụ
        //   trần (bỏ quy cách) cho MỌI biến thể của cùng một sản phẩm.
        //   → tên phụ #1 (tên gọi tắt có quy cách): luôn có, duy nhất theo từng (sản phẩm, biến thể).
        //   → tên phụ #2 (tên gọi miệng hiện trường): chỉ thêm khi sản phẩm chỉ có MỘT biến thể.
        const dsTenPhu = [`${sp.tenPhu} ${bien.vietTat}`];
        if (sp.bien.length === 1) dsTenPhu.push(sp.tenPhu);
        const chuan = dsTenPhu.map(chuanHoaTen);
        const tenChuan = chuanHoaTen(ten);
        if (dungTen.has(tenChuan)) continue;                 // ⛔ chặn trùng tên gốc
        if (chuan.some((t) => dungTenPhu.has(t))) continue;   // ⛔ chặn trùng tên phụ
        dungTen.add(tenChuan);
        for (const t of chuan) dungTenPhu.add(t);
        so++;
        ra.push({
          maNhom: he.maNhom,
          code: `${TIEN_TO}${he.maNhom}-${String(so).padStart(3, "0")}`,
          name: ten,
          unit: sp.donVi,
          standardPrice: sp.gia,
          brand: sp.thuongHieu,
          specification: bien.ten,
          minStock: 0,
          aliasText: dsTenPhu.join("; "),   // ⛔ CHÍNH LÀ TRƯỜNG "TÊN PHỤ" CỦA HỆ THỐNG
          dsTenPhu,
          tenPhuChinh: dsTenPhu[0],
          categoryCode: he.code,
          subcategoryName: he.nhomCon[i % he.nhomCon.length],
        });
      }
    }
    if (so < he.mucDich) console.log(`      [LOI] hệ ${he.code} chỉ sinh được ${so}/${he.mucDich} mã — thiếu dữ liệu sản phẩm.`);
  }
  return ra;
}

/** Chạy nhiều lệnh song song có giới hạn; KHÔNG nuốt lỗi — lỗi trả về để ghi báo cáo. */
async function chaySongSong(danhSach, soLan, xuLy) {
  let viTri = 0;
  const ketQua = new Array(danhSach.length).fill(null);
  const loiList = [];
  async function worker() {
    while (viTri < danhSach.length) {
      const i = viTri++;
      try {
        ketQua[i] = await xuLy(danhSach[i], i);
      } catch (e) {
        ketQua[i] = { ok: false, loi: String(e?.message || e) };
        loiList.push({ ma: danhSach[i]?.code || "?", loi: ketQua[i].loi });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(soLan, Math.max(1, danhSach.length)) }, () => worker()));
  return { ketQua, loiList };
}

// ─────────────────────────────────────────────────────────────────────────────
// BẮT ĐẦU
// ─────────────────────────────────────────────────────────────────────────────
const BC = [];
tieuDe("GIAI DOAN 4 — NHOM VAT TU + 200 MA VAT TU CO TEN PHU");
await login("admin", "Admin123456@");
ghi({ giaiDoan: 4, buoc: "bat-dau" });

// ── 4.1 KHẢO SÁT HIỆN TRẠNG ──────────────────────────────────────────────────
tieuDe("4.1 KHẢO SÁT HIỆN TRẠNG (đọc từ bootstrap)");
const bs0 = await bootstrap();
const khoaCanKhao = ["materials", "adminMaterials", "materialCategories", "adminMaterialCategories",
  "materialSubcategories", "adminMaterialSubcategories", "materialAliases", "suppliers", "inventory"];
console.log("  Tổng số khoá bootstrap: " + Object.keys(bs0).length);
console.log("  Số lượng các khoá liên quan vật tư:");
const truocKhao = {};
for (const k of khoaCanKhao) {
  const n = Array.isArray(bs0[k]) ? bs0[k].length : (bs0[k] ? 1 : 0);
  truocKhao[k] = n;
  console.log("      " + k.padEnd(30) + " = " + n);
}
console.log("\n  BẢN GHI MẪU (in đủ toàn bộ tên trường):");
for (const k of khoaCanKhao) {
  const v = bs0[k];
  if (!Array.isArray(v) || !v.length) { console.log("      " + k + ": (rỗng)"); continue; }
  console.log("      [" + k + "] tên trường: " + Object.keys(v[0]).join(", "));
  for (const dong of v.slice(0, 2)) console.log("         · " + JSON.stringify(dong));
}
const truocE2E = (bs0.materials || []).filter((m) => String(m.code || "").startsWith(TIEN_TO)).length;
console.log("\n  Số mã vật tư đã mang tiền tố " + TIEN_TO + ": " + truocE2E);

if (CHI_KHAO_SAT) {
  console.log("\n  (chạy với cờ --khao-sat: dừng sau bước khảo sát, KHÔNG ghi gì)");
} else {

// ── 4.2 DANH SÁCH MẪU SẼ TẠO ────────────────────────────────────────────────
tieuDe("4.2 DANH SÁCH CHUẨN BỊ (in trước khi ghi)");
const danhSach = taoDanhSachVatTu();
console.log("  Tổng số mã dự kiến tạo: " + danhSach.length + " (yêu cầu: " + TONG_MA_YEU_CAU + ")");
if (danhSach.length !== TONG_MA_YEU_CAU) {
  console.log("      [LOI] số mã sinh ra (" + danhSach.length + ") KHÔNG bằng " + TONG_MA_YEU_CAU);
  process.exitCode = 1;
}
console.log("  Phân bổ theo hệ nhóm:");
const theoHe = new Map();
for (const m of danhSach) theoHe.set(m.maNhom, (theoHe.get(m.maNhom) || 0) + 1);
for (const he of HE_NHOM) console.log("      " + he.code.padEnd(22) + he.ten.padEnd(24) + " " + theoHe.get(he.maNhom) + " mã");
console.log("\n  10 mã mẫu (mã · tên chính · TÊN PHỤ · ĐVT · đơn giá · nhóm):");
for (const m of danhSach.slice(0, 10)) {
  console.log("      " + m.code + " · " + m.name);
  console.log("         ↳ tên phụ: " + m.aliasText.split("; ").join(" | ") + "  ·  ĐVT " + m.unit + "  ·  " + m.standardPrice.toLocaleString("vi-VN") + " đ");
}

// ── 4.3 TẠO HỆ THỐNG NHÓM VẬT TƯ (categories) ────────────────────────────────
tieuDe("4.3 TAO HE THONG NHOM VAT TU (save_material_category)");
const catTheoCode = new Map((bs0.materialCategories || []).map((c) => [String(c.code), c]));
const nhomTaoMoi = [], nhomDaCo = [];
for (const [i, he] of HE_NHOM.entries()) {
  const daCo = catTheoCode.get(he.code);
  if (daCo) { nhomDaCo.push(daCo); continue; }
  const r = await buoc("save_material_category " + he.code, () => coThat("save_material_category", {
    code: he.code, name: he.ten, description: he.moTa, sortOrder: 500 + i,
  }, "tao he nhom vat tu"), BC);
  if (r) nhomTaoMoi.push(he.code);
}
console.log("  Đã có sẵn: " + nhomDaCo.length + " · vừa tạo: " + nhomTaoMoi.length + " (" + nhomTaoMoi.join(", ") + ")");

// ── 4.4 TẠO NHÓM CON (subcategories) ─────────────────────────────────────────
tieuDe("4.4 TAO NHOM CON VAT TU (save_material_subcategory)");
const bs1 = await bootstrap();
const catTheoCode2 = new Map((bs1.materialCategories || []).map((c) => [String(c.code), c]));
const subCanTao = [];
for (const he of HE_NHOM) {
  const cat = catTheoCode2.get(he.code);
  if (!cat) { console.log("      [LOI] không tìm thấy hệ nhóm " + he.code + " sau khi tạo"); continue; }
  he.nhomCon.forEach((tenSub, j) => {
    const daCo = (bs1.materialSubcategories || []).find((s) => String(s.categoryId) === String(cat.id) && String(s.name) === tenSub);
    if (daCo) return;
    subCanTao.push({ he, cat, tenSub, j });
  });
}
console.log("  Số nhóm con cần tạo: " + subCanTao.length);
const subDaTao = [];
for (const item of subCanTao) {
  const codeSub = `${TIEN_TO}${item.he.maNhom}-${String(item.j + 1).padStart(2, "0")}`;
  const r = await buoc("save_material_subcategory " + codeSub, () => coThat("save_material_subcategory", {
    categoryId: item.cat.id, code: codeSub, name: item.tenSub,
    description: item.he.ten + " · " + item.tenSub, reviewStatus: "approved", sortOrder: 10 + item.j,
  }, "tao nhom con vat tu"), BC);
  if (r) subDaTao.push(codeSub + " (" + item.tenSub + ")");
}
console.log("  Vừa tạo: " + subDaTao.length + " nhóm con");
if (subDaTao.length) for (const s of subDaTao) console.log("      · " + s);

// ── 4.5 TẠO 200 MÃ VẬT TƯ (mỗi mã CÓ TÊN PHỤ) ───────────────────────────────
tieuDe("4.5 TAO " + TONG_MA_YEU_CAU + " MA VAT TU — MOI MA CO TEN PHU (save_material)");
const bs2 = await bootstrap();
const matTheoCode = new Map((bs2.materials || []).map((m) => [String(m.code), m]));
const catIdTheoCode = new Map();
for (const c of bs2.materialCategories || []) catIdTheoCode.set(String(c.code), String(c.id));
const subIdTheoKey = new Map();
for (const s of bs2.materialSubcategories || []) subIdTheoKey.set(String(s.categoryId) + "||" + String(s.name), String(s.id));

const canTao = [], canSua = [], boQua = [];
const soDongDaCo = bs2.materials.filter((m) => String(m.code || "").startsWith(TIEN_TO)).length;
for (const m of danhSach) {
  const daCo = matTheoCode.get(m.code);
  if (!daCo) { canTao.push(m); continue; }
  // ⛔ Idempotent: chỉ ghi lại khi tên phụ đang lệch so với dữ liệu chuẩn của script này.
  //    (lần chạy trước có 48 mã bị ghi dở vì máy chủ từ chối tên phụ trùng ⇒ phải bổ sung.)
  const coHienTai = (daCo.aliases || []).map((a) => String(a).trim()).sort();
  const coYeuCau = [...m.dsTenPhu].map((a) => String(a).trim()).sort();
  const giongNhau = coHienTai.length === coYeuCau.length
    && coHienTai.every((a, j) => a === coYeuCau[j]);
  if (giongNhau) boQua.push(m.code);
  else canSua.push({ ...m, materialId: daCo.id, coHienTai });
}
console.log("  Mã E2E đã tồn tại trên máy chủ: " + soDongDaCo + " / " + danhSach.length);
console.log("  Đã có đúng tên phu chuẩn (bỏ qua, không ghi lại): " + boQua.length);
console.log("  Đã có mã nhưng tên phu THIẾU/LỆCH (sẽ ghi lại): " + canSua.length);
console.log("  Cần tạo mới: " + canTao.length);
if (canTao.length) console.log("      ví dụ: " + canTao.slice(0, 3).map((x) => x.code).join(", ") + " …");
if (canSua.length) console.log("      ví dụ: " + canSua.slice(0, 3).map((x) => x.code + " (đang có: " + JSON.stringify(x.coHienTai) + ")").join(" | "));

const batDau = Date.now();
let xong = 0;
const taoMoi = await chaySongSong(canTao, SO_LAN_SONG_SONG, async (m) => {
  const catId = catIdTheoCode.get(m.categoryCode);
  const subId = subIdTheoKey.get(catId + "||" + m.subcategoryName);
  if (!catId || !subId) throw new Error("thiếu hệ/nhóm con cho " + m.code);
  const r = await coThat("save_material", {
    code: m.code, name: m.name, unit: m.unit, categoryId: catId, subcategoryId: subId,
    specification: m.specification, brand: m.brand,
    standardPrice: m.standardPrice, minStock: m.minStock, active: true,
    aliasText: m.aliasText,          // ⛔ CHÍNH LÀ TRƯỜNG "TÊN PHỤ" của hệ thống
  }, "tao ma vat tu co ten phu");
  xong++;
  if (xong % 25 === 0) console.log("      ... đã gửi " + xong + "/" + canTao.length + " lệnh ghi");
  return r;
});
const boSung = await chaySongSong(canSua, SO_LAN_SONG_SONG, async (m) => {
  const catId = catIdTheoCode.get(m.categoryCode);
  return coThat("save_material", {
    materialId: m.materialId, code: m.code, name: m.name, unit: m.unit,
    categoryId: catId, subcategoryId: subIdTheoKey.get(catId + "||" + m.subcategoryName),
    specification: m.specification, brand: m.brand, standardPrice: m.standardPrice, minStock: m.minStock,
    active: true, aliasText: m.aliasText,
  }, "bo sung ten phu cho ma da co");
});
const giay = Math.round((Date.now() - batDau) / 1000);
const tongLoiGhi = taoMoi.loiList.length + boSung.loiList.length;
console.log("\n  Số lệnh ghi THẬT đã gửi: " + (canTao.length + canSua.length)
  + " (tạo mới " + canTao.length + ", bổ sung tên phụ " + canSua.length + ")");
console.log("  Số lỗi: " + tongLoiGhi + " · thời gian " + giay + " giây");
for (const l of [...taoMoi.loiList, ...boSung.loiList].slice(0, 20)) console.log("      [LOI] " + l.ma + " :: " + l.loi);
BC.push({
  ten: "Ghi " + (canTao.length + canSua.length) + " lệnh save_material",
  ok: tongLoiGhi === 0,
  loi: tongLoiGhi ? "có " + tongLoiGhi + " lỗi" : null,
});
ghi({ giaiDoan: 4, buoc: "tao-ma-vat-tu", gui: canTao.length + canSua.length, loi: tongLoiGhi, giay });

// ── 4.6 ĐỐI CHIẾU LẠI TỪ MÁY CHỦ (KHÔNG tin thông báo "thành công") ───────────
tieuDe("4.6 DEM LAI TU MAY CHU (nguon su that duy nhat)");
const bs3 = await bootstrap();
const sauKhao = {};
for (const k of khoaCanKhao) sauKhao[k] = Array.isArray(bs3[k]) ? bs3[k].length : (bs3[k] ? 1 : 0);

const e2eMaterials = (bs3.materials || []).filter((m) => String(m.code || "").startsWith(TIEN_TO));
const e2eCoTenPhu = e2eMaterials.filter((m) => Array.isArray(m.aliases) && m.aliases.length > 0);
const e2eCat = (bs3.materialCategories || []).filter((c) => String(c.code || "").startsWith(TIEN_TO));
const catIdE2E = new Set(e2eCat.map((c) => String(c.id)));
const e2eSub = (bs3.materialSubcategories || []).filter((s) => catIdE2E.has(String(s.categoryId)));
const idCoAlias = new Set(e2eCoTenPhu.map((m) => String(m.id)));
const e2eAlias = (bs3.materialAliases || []).filter((a) => idCoAlias.has(String(a.materialId)));
const e2eCoDonGia = e2eMaterials.filter((m) => Number(m.standardPrice) > 0);
const e2eCoDonVi = e2eMaterials.filter((m) => String(m.unit || "").trim() !== "");
// ⛔ Tên phụ phải KHÁC tên chính (máy chủ tự bỏ alias trùng, nhưng phải tự kiểm lại).
const e2eTenPhuTrungTenChinh = e2eMaterials.filter((m) =>
  (m.aliases || []).some((a) => chuanHoaTen(a) === chuanHoaTen(m.name)));

console.log("  " + "khoá".padEnd(30) + "TRUOC".padStart(8) + "SAU".padStart(8) + "TANG".padStart(8));
for (const k of khoaCanKhao) {
  const a = truocKhao[k], b = sauKhao[k];
  console.log("  " + k.padEnd(30) + String(a).padStart(8) + String(b).padStart(8) + String(b - a).padStart(8));
}
console.log("\n  Mã vật tư E2E trên máy chủ  : " + e2eMaterials.length + " (yêu cầu " + TONG_MA_YEU_CAU + ")");
console.log("  Mã E2E CÓ TÊN PHỤ           : " + e2eCoTenPhu.length);
console.log("  Dòng alias E2E trong bảng    : " + e2eAlias.length);
console.log("  Hệ nhóm E2E                 : " + e2eCat.length + " · nhóm con E2E: " + e2eSub.length);
console.log("  Mã E2E có đơn vị tính        : " + e2eCoDonVi.length + " · có đơn giá > 0: " + e2eCoDonGia.length);
console.log("  Mã E2E có tên phụ TRÙNG tên chính: " + e2eTenPhuTrungTenChinh.length + " (phải bằng 0)");
console.log("  Phân bổ hệ M&E suy ra từ mã hệ: " +
  JSON.stringify(e2eMaterials.reduce((a, m) => { a[m.system] = (a[m.system] || 0) + 1; return a; }, {})));

console.log("\n  10 mã mẫu (đọc lại từ máy chủ):");
for (const m of e2eMaterials.slice(0, 10)) {
  console.log("      " + String(m.code).padEnd(16) + m.name);
  console.log("         ↳ tên phụ: " + (m.aliasText || "(KHÔNG CÓ)") + "   · ĐVT " + m.unit
    + " · " + Number(m.standardPrice).toLocaleString("vi-VN") + " đ · " + m.categoryCode + " / " + m.subcategoryName);
}

// ── 4.7 GHI KẾT QUẢ ──────────────────────────────────────────────────────────
const loiTatCa = [...taoMoi.loiList, ...boSung.loiList];
const ketQua = {
  giaiDoan: 4,
  moTa: "Cấu hình hệ thống nhóm vật tư và tạo 200 mã vật tư kèm tên phụ",
  chayLuc: new Date().toISOString(),
  tienTo: TIEN_TO,
  actionDung: {
    taoHeNhom: "save_material_category { code*, name*, description?, sortOrder? }",
    taoNhomCon: "save_material_subcategory { categoryId*, name*, code?, description?, reviewStatus?, sortOrder? }",
    taoMaVatTu: "save_material { code*, name*, unit*, categoryId*, subcategoryId?, brand?, specification?, standardPrice?, minStock?, active?, aliasText? }",
    tenPhu: "KHÔNG có action riêng — tên phụ nhập qua trường aliasText của save_material (tách bằng dấu ';' hoặc xuống dòng); máy chủ tự chuẩn hoá, chặn trùng và ghi vào bảng material_aliases.",
  },
  truoc: truocKhao,
  sau: sauKhao,
  soLenhGhiThucTe: canTao.length + canSua.length,
  soLenhTaoMoi: canTao.length,
  soLenhBoSungTenPhu: canSua.length,
  soLoi: loiTatCa.length,
  danhSachLoi: loiTatCa,
  ketQuaDoLaiTuMayChu: {
    maVatTuE2E: e2eMaterials.length,
    maVatTuE2ECoTenPhu: e2eCoTenPhu.length,
    dongAliasE2E: e2eAlias.length,
    heNhomE2E: e2eCat.length,
    nhomConE2E: e2eSub.length,
    coDonViTinh: e2eCoDonVi.length,
    coDonGia: e2eCoDonGia.length,
    tenPhuTrungTenChinh: e2eTenPhuTrungTenChinh.length,
    heME: e2eMaterials.reduce((a, m) => { a[m.system] = (a[m.system] || 0) + 1; return a; }, {}),
  },
  luuYPhatHien: [
    "PHÁT HIỆN (không sửa, chỉ báo cáo): MaterialSystemCodes.canonicalMeCode() dùng helper " +
    "`private static boolean contains(List<String> list, String v) { return list.contains(v); }` — tức là so BẰNG TOÀN BỘ chuỗi, " +
    "KHÔNG phải substring, dù Javadoc của TASK-040 ghi đã vá để so tiền tố. Hệ quả: mã hệ M&E chỉ đúng khi mã danh mục " +
    "BẰNG ĐÚNG 'DIEN'/'CTN'/'ELV'/'PCCC'/'HVAC'/'DNHE' hoặc BẮT ĐẦU bằng chúng. 9 hệ E2E đều bắt đầu bằng 'E2E-' nên " +
    "canonicalMeCode trả 'KHAC' cho tất cả 200 mã — kể cả 'E2E-CTN-ONGNUOC' và 'E2E-DIEN-THIETBI'.",
  ],
  buoc: BC,
  duDieuKhongDat: e2eMaterials.length !== TONG_MA_YEU_CAU
    || e2eCoTenPhu.length !== e2eMaterials.length
    || e2eTenPhuTrungTenChinh.length !== 0,
};
writeFileSync("tools/e2e/ket-qua-04.json", JSON.stringify(ketQua, null, 2), "utf8");
ghi({ giaiDoan: 4, buoc: "ket-thuc", maVatTu: e2eMaterials.length, coTenPhu: e2eCoTenPhu.length, loi: loiTatCa.length });

console.log("\n  ĐÁNH GIÁ: " + (ketQua.duDieuKhongDat
  ? "CHƯA ĐẠT — xem ket-qua-04.json"
  : "ĐẠT — đủ " + e2eMaterials.length + " mã, " + e2eCoTenPhu.length + " mã có tên phụ."));
console.log("  Đã ghi tools/e2e/ket-qua-04.json");
tomTatBuoc("GIAI DOAN 4", BC);

}
