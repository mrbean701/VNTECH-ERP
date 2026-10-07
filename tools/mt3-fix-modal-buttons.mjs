// USER 28/09/2026 — SỬA 2 LỖI Ở CÁC NÚT CỦA 4 DANH SÁCH TỔNG HỢP:
//   ① ⛔ NÚT BẤM KHÔNG HOẠT ĐỘNG: nhánh `if (tab >= 1) return …` được đặt TRƯỚC `{entityModal}`
//      ⇒ modal chi tiết KHÔNG BAO GIỜ được render ⇒ bấm «Chi tiết / Hồ sơ / Xem kho» không xảy ra gì.
//      Sửa: thêm `{entityModal}` vào GIÁ TRỊ TRẢ VỀ của nhánh danh sách tổng hợp.
//   ② ĐỔI TÊN NÚT cho đồng bộ: «Hồ sơ ›» và «Xem kho ›» ⇒ «Chi tiết ›».
// ⚠️ Giữ nguyên: `openEntity` đã có sẵn, chỉ thiếu chỗ render modal.
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "app/page.tsx";
const AGG = "app/screens/ProjectAggregateTabs.tsx";
let page = readFileSync(PAGE, "utf8");
let agg = readFileSync(AGG, "utf8");
let ok = 0, bad = 0;
const ed = (buf, a, b, n) => { const c = buf.split(a).length - 1; if (c !== 1) { console.log("  🔴 " + n + ": khớp " + c); bad += 1; return buf; } console.log("  ✅ " + n); ok += 1; return buf.replace(a, b); };

// ① thêm {entityModal} vào nhánh danh sách tổng hợp
page = ed(page,
  "      <ProjectAggregateTabs data={data} section={AGG_SECTION_BY_TAB[tab] || \"nhansu\"} openEntity={openEntity} />\n    </div>;",
  "      <ProjectAggregateTabs data={data} section={AGG_SECTION_BY_TAB[tab] || \"nhansu\"} openEntity={openEntity} />\n      {entityModal}   {/* USER 28/09/2026: BẮT BUỘC render modal ở nhánh này — thiếu nó thì nút Chi tiết/Hồ sơ/Xem kho không làm gì */}\n    </div>;",
  "thêm {entityModal} vào nhánh danh sách tổng hợp");

// ② đổi tên nút cho đồng bộ
agg = ed(agg, ">Hồ sơ ›</button>", ">Chi tiết ›</button>", "«Hồ sơ ›» → «Chi tiết ›»");
agg = ed(agg, ">Xem kho ›</button>", ">Chi tiết ›</button>", "«Xem kho ›» → «Chi tiết ›»");
agg = ed(agg, ">Dự án ›</button>", ">Chi tiết ›</button>", "«Dự án ›» → «Chi tiết ›» (đồng bộ)");

if (bad > 0) { console.log("  ⛔ KHÔNG ghi tệp — còn " + bad + " chỗ."); process.exit(1); }
writeFileSync(PAGE, page, "utf8");
writeFileSync(AGG, agg, "utf8");
console.log("  ✅ đã ghi 2 tệp · " + ok + " thay đổi");
