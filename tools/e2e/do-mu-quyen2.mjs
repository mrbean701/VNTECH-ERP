// TASK-142 — L-11: 6 action "mù quyền". Câu hỏi thật: máy chủ CÓ chặn không?
// Kịch bản trước trả 200 ⇒ hoặc guard không chạy, hoặc tài khoản ĐÃ CÓ module được yêu cầu.
// Phải tách hai khả năng đó, nếu không kết luận sẽ là báo oan (D-078).
//
// Cách đúng: dùng một tài khoản CHẮC CHẮN không có `dept_legal_contract_review`,
// và TỰ KIỂM tra bằng chính máy chủ chứ không tin danh sách mình cầm tay.
import { login, call, bootstrap, ghi } from "./client.mjs";

const MK = "Vn@2026Test";
const MODULE_REVIEW = "dept_legal_contract_review";

/** Gom đúng danh sách module của 1 tài khoản từ bootstrap. */
function moduleCua(bs, userId) {
  const nguon = bs.userModulePermissions || bs.modulePermissions || [];
  if (!Array.isArray(nguon)) return null;
  return nguon.filter((m) => !userId || m.userId === userId).map((m) => m.moduleKey);
}

async function thu(user) {
  await login(user, MK);
  const bs = await bootstrap();
  const co = moduleCua(bs);
  return { user, co, bs };
}

async function chay() {
  // ⛔ `e2e.kt` là kế toán — KHÔNG được cấp `dept_legal_contract_review`.
  //    Nhưng phải TỰ CHỨNG MINH bằng dữ liệu máy chủ trả về, không tin tên tài khoản.
  const r = await thu("e2e.kt");
  console.log(`Tai khoan: ${r.user}`);
  console.log(`  modulePermissions co phai mang? ${Array.isArray(r.co)}`);
  console.log(`  so module cua ho: ${r.co ? r.co.length : "doc khong duoc"}`);
  console.log(`  co "${MODULE_REVIEW}"? ${r.co ? (r.co.includes(MODULE_REVIEW) ? "CO" : "KHONG") : "?"}\n`);

  // Kiểm chứng chéo: gọi chính endpoint quyền của module đó xem máy chủ có trả lỗi quyền không.
  // ⛔ Dùng module `requests` — tài khoản này CHẮC CHẮN có (modulePermissions in ra).
  const kiem = await call("create_request", {}, { boQuaLoi: true });

  const list = await call("list_contract_review", {}, { boQuaLoi: true });
  const scope = await call("work_scope", {}, { boQuaLoi: true });

  const ketLuan = [];
  ketLuan.push({
    kiemTra: `Tai khoan ${r.user} co module ${MODULE_REVIEW}?`,
    kq: r.co ? (r.co.includes(MODULE_REVIEW) ? "CO" : "KHONG CO") : "khong doc duoc",
    yNghia: r.co && r.co.includes(MODULE_REVIEW)
      ? "Tai khoan CO quyen — 200 khong chung minh gi"
      : "Tai khoan KHONG CO quyen — 200 nghia la THAT",
  });
  ketLuan.push({
    kiemTra: "create_request (doi chieu: co quyen, thi co 400 hay 403?)",
    kq: `HTTP ${kiem?.status ?? "?"} — ${kiem?._loi || kiem?.error || "ok"}`,
    yNghia: "Neu cung 400 nghia la may chu tra loi tham so truoc khoi kiem quyen",
  });
  ketLuan.push({
    kiemTra: "list_contract_review (yeu cau module rieng)",
    kq: `HTTP ${list?.status ?? "?"}`,
    yNghia: "200 = KHONG bi chan",
  });
  ketLuan.push({
    kiemTra: "work_scope",
    kq: `HTTP ${scope?.status ?? "?"}`,
    yNghia: "200 = KHONG bi chan",
  });

  console.log("=== KET LUA ===");
  for (const k of ketLuan) {
    console.log(`  ${k.kiemTra}`);
    console.log(`    ket qua : ${k.kq}`);
    console.log(`    y nghia : ${k.yNghia}`);
  }
  console.log("\nNoi dung list_contract_review tra ve:");
  console.log("  " + JSON.stringify(list).slice(0, 400));

  ghi("do-mu-quyen-lan-2", ketLuan);
  process.exitCode = 0;
}

await chay();