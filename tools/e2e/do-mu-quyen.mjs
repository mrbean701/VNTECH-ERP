// TASK-142 — ĐO LỖI L-11: 6 action "mù quyền" có THỰC SỰ lộ thiếu quyền không?
// Cách đo: đăng nhập bằng tài khoản THƯỜNG (không phải admin, không có quyền pháp chế)
// rồi gọi từng action. Nếu máy chủ trả 200 ⇒ lỗi thật. Nếu 403 ⇒ cổng probe đã báo oan.
//
// ⛔ AN TOÀN: chỉ gọi `list_*` (đọc) và `open_*` với id KHÔNG TỒN TẠI để máy chủ từ chối sớm.
//    KHÔNG gọi save/delete/log trên dữ liệu thật. `work_scope` là action đọc nên gọi với
//    payload rỗng — nếu nó xoá gì thì phải thấy trong mã trước, và ta đã rà: nó chỉ đọc.
import { login, call, bootstrap, ghi } from "./client.mjs";

const MK = "Vn@2026Test";
const TAI_KHOAN = "e2e.kt"; // Kế toán — KHÔNG có quyền pháp chế/hợp đồng
const ID_KHONG_TON_TAI = "CR_KHONG_CO_00000000-0000-0000-0000-000000000000";

const bang = [];
let sai = 0;

function dong(label, r) {
  const ok = r?.ok === false;
  const blocked = ok && (r.status === 401 || r.status === 403);
  if (!blocked) sai++;
  bang.push({
    action: label,
    http: r?.status ?? "(khong co status)",
    ketLuan: blocked ? "DA CHAN" : (ok ? "CHAN, ly do khac" : "⚠ KHONG CHAN"),
    loai: r?._loi || r?.error || "",
  });
  return blocked;
}

async function chay() {
  await login(TAI_KHOAN, MK);
  const bs = await bootstrap();
  console.log(`Dang do bang tay khoan "${TAI_KHOAN}" (vai tro la nguoi thuong, KHONG phai admin)`);
  console.log(`  modulePermissions cua ho: ${JSON.stringify(bs.userModulePermissions?.[TAI_KHOAN] ?? bs.modulePermissions ?? "khong doc duoc")}\n`);

  dong("list_contract_review", await call("list_contract_review", {}, { boQuaLoi: true }));
  dong("open_contract_review", await call("open_contract_review", { id: ID_KHONG_TON_TAI }, { boQuaLoi: true }));
  dong("save_contract_review", await call("save_contract_review", {}, { boQuaLoi: true }));
  dong("log_contract_review", await call("log_contract_review", {}, { boQuaLoi: true }));
  dong("delete_contract_review", await call("delete_contract_review", { id: ID_KHONG_TON_TAI }, { boQuaLoi: true }));
  dong("work_scope", await call("work_scope", {}, { boQuaLoi: true }));

  console.log("\n=== KET QUA DO ===");
  for (const b of bang) {
    console.log(`  ${b.action.padEnd(24)} HTTP ${String(b.http).padEnd(18)} ${b.ketLuan}`);
    if (b.loai) console.log(`  ${"".padEnd(24)} loi: ${String(b.loai).slice(0, 120)}`);
  }

  ghi("do-mu-quyen", bang);
  console.log(`\nTAT CA ${bang.length} action ${sai === 0 ? "DA BI CHAN" : `CO ${sai} action KHONG bi chan`}.`);
  process.exitCode = sai === 0 ? 0 : 1;
}

await chay();