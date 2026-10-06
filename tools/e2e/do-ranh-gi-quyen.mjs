// TASK-142 — L-11: tìm CHÍNH XÁC ranh giới của lỗ hổng, không đoán.
// Đã biết `requireActionModule` thoát sớm cho vai trò `director`/`accountant`
// (RbacService:69). Câu hỏi: chỉ hai vai trò đó, hay rộng hơn?
//
// Cách đo: gọi `list_contract_review` (module `dept_legal_contract_review`) bằng MỌI
// tài khoản e2e, rồi đối chiếu với (a) vai trò, (b) module có thật trong bootstrap.
import { login, call, bootstrap, ghi } from "./client.mjs";

const MK = "Vn@2026Test";
const MODULE = "dept_legal_contract_review";
const TAI_KHOAN = [
  "e2e.kt",      // accountant  — kế toán
  "e2e.bgd",     // director    — ban giám đốc
  "e2e.thuky",   // thuky       — thư ký TGD
  "e2e.ns",      // hr          — nhân sự
  "e2e.project", // da_nv       — dự án
  "e2e.kh",      // kh_nv       — kế hoạch
  "e2e.thukysa", // thuky       — thư ký sau
  "e2e.chtsa",   // cht         — chủ tịch
];

const bang = [];

async function chay() {
  for (const tk of TAI_KHOAN) {
    let rec = { taiKhoan: tk, vaiTro: "?", coModule: "?", http: "?", ketLuan: "?" };
    try {
      await login(tk, MK);
      const bs = await bootstrap();
      const ds = bs.userModulePermissions || bs.modulePermissions || [];
      const arr = Array.isArray(ds) ? ds : [];
      const cu = arr.filter((m) => m.moduleKey === MODULE && m.userId === tk);
      const coQuyen = arr.length ? (cu.length > 0 || arr.some((m) => m.userId !== tk && m.moduleKey === MODULE)) : "doc khong duoc";
      // vai tro: doc tu bootstrap
      const dsUser = bs.users || [];
      const u = Array.isArray(dsUser) ? dsUser.find((x) => x.username === tk) : null;
      rec = {
        taiKhoan: tk,
        vaiTro: u?.role ?? u?.roleBase ?? "?",
        coModule: arr.length ? (arr.some((m) => m.userId === tk && m.moduleKey === MODULE) ? "CO" : "KHONG") : "?",
        http: "?",
        ketLuan: "?",
      };
      void coQuyen;
      const r = await call("list_contract_review", {}, { boQuaLoi: true });
      rec.http = r?.status ?? "?";
      rec.duLieu = typeof r?.total === "number" ? `total=${r.total}` : (r?._loi || r?.error || "");
      rec.ketLuan = r?.status === 403 ? "CHAN" : (r?.status === 200 ? "CHO QUA" : `khac(${r?.status})`);
    } catch (e) {
      rec.ketLuan = "LOI: " + String(e?.message ?? e).slice(0, 60);
    }
    bang.push(rec);
    console.log(
      `  ${rec.taiKhoan.padEnd(12)} vai tro ${String(rec.vaiTro).padEnd(13)} ` +
      `module ${String(rec.coModule).padEnd(8)} HTTP ${String(rec.http).padEnd(5)} ` +
      `${rec.ketLuan.padEnd(10)} ${rec.duLieu || ""}`
    );
  }

  const qua = bang.filter((b) => b.ketLuan === "CHO QUA");
  const chan = bang.filter((b) => b.ketLuan === "CHAN");
  console.log(`\nCHO QUA (lo quyen): ${qua.length} — ${qua.map((b) => b.taiKhoan + "(" + b.vaiTro + ")").join(", ")}`);
  console.log(`CHAN dung:         ${chan.length} — ${chan.map((b) => b.taiKhoan + "(" + b.vaiTro + ")").join(", ")}`);

  const quaKhongCoModule = qua.filter((b) => b.coModule === "KHONG");
  console.log(`\nTrong so dang lo quyen, SO TAI KHOAN THIET SU KHONG CO MODULE "${MODULE}": ${quaKhongCoModule.length}`);
  console.log(`=> ${quaKhongCoModule.length > 0
    ? "LỖI THẬT: có tài khoản không có quyền nhưng vẫn đọc được dữ liệu."
    : "KHÔNG có lỗ hổng với module này."}`);

  ghi("ranh-gi-lu-quyen", bang);
  process.exitCode = 0;
}

await chay();