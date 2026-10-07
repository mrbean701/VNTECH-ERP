// GO-LIVE 05/10/2026 — KIỂM ỨNG VIÊN 500 TỪ PHÉP QUÉT MẪU (TASK-208).
//
// ⭐ VÌ SAO BÀI NÀY — ⭐ bài học vòng 62: **đọc NGUYÊN KHỐI + quét CẢ HỌ mẫu** đã tìm ra một **500 thật**
//   (`voucherDate.substring(0,4)` ⛔ không chốt). ⭐ Vòng này quét tiếp các **mẫu có thể ném ngoại lệ**:
//   · `substring(0,N)`  ⇒ ✅ **ĐÓNG SỔ**: 10 vị trí, ⭐ **cả 5 truncation đều có chốt độ dài**, 1 lỗi đã vá ✓
//   · `parseInt`/`parseDouble` trên tham số ⇒ ✅ **0 vị trí ⛔ không chốt** ✓
//   · `LocalDate/Instant.parse` ⇒ ✅ **12 vị trí, CẢ 12 có chốt** (`parsableInstant(...)` hoặc `try` cùng dòng) ✓
//   · `.split(...)[0]` ⇒ ✅ **an toàn** (`split` luôn trả ≥1 phần tử) ✓
//   · ⚠️ **`.get(0)` / `[0]`** ⇒ ⚠️ **15 vị trí**, hầu hết có chốt (`isEmpty() ? … : …get(0)` · `size() == 1`),
//     ⚠️ **NHƯNG 6 vị trí CẦN KIỂM**: `StockManagementUseCase:380,384,455,473,474` · `RequestManagementUseCase:521`
//
// ⭐⭐ CÁCH KIỂM: gọi các action đó với **PAYLOAD RỖNG** ⇒ ⛔ **KHÔNG được 5xx** (⭐ kỳ vọng **400** — thiếu tham số).
//    ⭐ Nếu một action trả **500** ⇒ ⭐ **`IndexOutOfBoundsException` ⛔ không bắt** ⇒ **LỖI THẬT** ✓
// ⛔ BÀI NÀY **KHÔNG TẠO DỮ LIỆU** (payload rỗng ⇒ bị chốt chặn) ⇒ ⭐ vẫn kiểm hậu quả đầy đủ ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
tieuDe("KIỂM ỨNG VIÊN 500 TỪ PHÉP QUÉT `.get(0)` — payload RỖNG ⇒ kỳ vọng 400, ⛔ KHÔNG 5xx");

// ⭐ các action ánh xạ tới 6 vị trí `.get(0)` cần kiểm
const DS = [
  ["issue_stock", "StockManagementUseCase:380,384 — `lines.get(0)` / `items.get(0)`"],
  ["create_transfer_order", "StockManagementUseCase:455,473,474 — `selected.get(0)` / `items.get(0)`"],
  ["receive_transfer_order", "StockManagementUseCase — cùng họ"],
  ["ship_transfer_order", "StockManagementUseCase — cùng họ"],
  ["create_central_return", "StockManagementUseCase — cùng họ"],
  ["approve_central_return", "StockManagementUseCase — cùng họ"],
  ["create_request", "RequestManagementUseCase:521 — `stages.get(0)`"],
  ["create_stock_count", "StockManagementUseCase — cùng họ"],
];

await login("admin", "Admin123456@");
const truoc = await bootstrap();
const KHOA = Object.keys(truoc).filter((k) => Array.isArray(truoc[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (truoc[k] || []).length]));

for (const [a, mo] of DS) {
  await buoc(`${a} — payload RỖNG (${mo})`, async () => {
    const r = await call(a, {}, { boQuaLoi: true });
    const ma = r?.status ?? r?.statusCode ?? r?._status;
    if (typeof ma === "number" && ma >= 500)
      throw new Error(`⚠️⚠️ ${ma} — 500: NGHI \`get(0)\` trên danh sách RỖNG ⇒ IndexOutOfBoundsException ⛔ không bắt`);
    const loi = String(r?._loi || r?.message || "");
    if (/Exception|NullPointer|Internal Server Error/i.test(loi)) throw new Error(`⚠️ NGHI 5xx/NPE: «${loi.slice(0, 80)}»`);
    return r.ok ? "200 (không tạo gì)" : `400 · ${loi.slice(0, 52)}`;
  }, BC);
}

const sau = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (sau[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (payload rỗng ⇒ ⛔ không tạo gì)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);

console.log("\n" + tomTatBuoc("KIỂM ỨNG VIÊN 500 `.get(0)`", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
