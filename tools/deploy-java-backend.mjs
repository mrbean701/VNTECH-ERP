// GO-LIVE 05/10/2026 — CÔNG CỤ TRIỂN KHAI BACKEND JAVA (AN TOÀN, MẶC ĐỊNH CHỈ CHẠY THỬ).
//
// ⛔⛔ VÌ SAO CÓ CÔNG CỤ NÀY — LỖ HỔNG AN TOÀN ĐÃ ĐO ĐƯỢC (05/10/2026):
//   · JAR đang chạy: `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` (86.8 MB, build 01/10)
//   · PID **3784** · cmdline `java.exe -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081`
//   · ⛔ **CHƯA CÓ BẢN LÙI NÀO** — `mvn package` **GHI ĐÈ** đúng tệp đang chạy ⇒ nếu bản mới lỗi thì
//     **không có gì để quay lại**. Công cụ này **SAO LƯU TRƯỚC KHI BUILD**.
//
// ⛔ MẶC ĐỊNH **CHỈ CHẠY THỬ** (in kế hoạch, ⛔ không đụng gì). Muốn thực thi phải gõ cờ đồng ý rõ ràng:
//     node tools/deploy-java-backend.mjs                          # CHẠY THỬ (mặc định)
//     node tools/deploy-java-backend.mjs --dong-y-trien-khai       # THỰC THI
//
// ⛔ CÁC CHỐT AN TOÀN BẮT BUỘC:
//   ① vân tay nguồn phải ĐẠT trước khi build;
//   ② PID phải có **cmdline khớp** JAR dự kiến — ⛔ không giết tiến trình lạ;
//   ③ **sao lưu** JAR hiện tại trước khi build (bản lùi);
//   ④ JAR MỚI phải chứa **V35 + V37** (nếu không thì bản build thiếu migration);
//   ⑤ sau khi khởi động phải **health-check** `:18081`;
//   ⑥ in **hướng dẫn lùi** ở cuối.
import { spawnSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const GOC = process.cwd();
const JAR = join(GOC, "java-backend", "web", "target", "vntech-erp-web-0.1.0-SNAPSHOT.jar");
const THU_MUC_LUI = join(GOC, "java-backend", "web", "target", "backup");
const CONG = 18081;
const MVN = "C:\\Users\\PC\\.m2\\wrapper\\dists\\apache-maven-3.9.16\\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\\bin\\mvn.cmd";
const THUC_THI = process.argv.includes("--dong-y-trien-khai");

const buoc = (n, ten) => console.log(`\n[${n}] ${ten}`);
const ok = (s) => console.log(`    ✔ ${s}`);
const canh = (s) => console.log(`    ⛔ ${s}`);
const B = (s) => console.log(`      ${s}`);

function ngheCong(port) {
  const r = spawnSync("powershell", ["-NoProfile", "-Command",
    `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess`],
    { encoding: "utf8" });
  const pid = (r.stdout || "").trim();
  return pid ? Number(pid) : null;
}
function cmdlineCua(pid) {
  const r = spawnSync("powershell", ["-NoProfile", "-Command",
    `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" -ErrorAction SilentlyContinue).CommandLine`],
    { encoding: "utf8" });
  return (r.stdout || "").trim();
}

console.log("=".repeat(84));
console.log(`TRIỂN KHAI BACKEND JAVA — chế độ: ${THUC_THI ? "⭐ THỰC THI" : "ⓘ CHẠY THỬ (mặc định, ⛔ không đụng gì)"}`);
console.log("=".repeat(84));

// ── ① VÂN TAY ─────────────────────────────────────────────────────────────────────────────
buoc(1, "Vân tay nguồn");
const fp = spawnSync("node", ["scripts/verify-vntech-fingerprint.mjs"], { encoding: "utf8", cwd: GOC });
const dongFp = (fp.stdout || "").split("\n").find((l) => l.includes("VNTECH FINGERPRINT")) || "";
if (!/ĐẠT/.test(dongFp)) { canh("vân tay ⛔ KHÔNG ĐẠT ⇒ DỪNG."); process.exit(1); }
ok(dongFp.trim());

// ── ② TIẾN TRÌNH ĐANG CHẠY ────────────────────────────────────────────────────────────────
buoc(2, `Tiến trình đang nghe :${CONG}`);
const pid = ngheCong(CONG);
if (pid === null) {
  canh(`⛔ KHÔNG có tiến trình nào nghe :${CONG} ⇒ DỪNG (không rõ vì sao backend không chạy).`);
  process.exit(1);
}
const cmd = cmdlineCua(pid);
ok(`PID=${pid}`);
B(`cmdline: ${cmd}`);
const DUNG_JAR = cmd.includes("vntech-erp-web-0.1.0-SNAPSHOT.jar");
if (!DUNG_JAR) { canh("⛔ cmdline ⛔ KHÔNG khớp JAR dự kiến ⇒ DỪNG (⛔ không giết tiến trình lạ)."); process.exit(1); }
ok("cmdline KHỚP JAR dự kiến");

// ── ③ SAO LƯU (BẢN LÙI) ───────────────────────────────────────────────────────────────────
buoc(3, "Sao lưu JAR hiện tại (bản lùi)");
if (!existsSync(JAR)) { canh(`⛔ không thấy JAR: ${JAR}`); process.exit(1); }
const mb = (statSync(JAR).size / 1024 / 1024).toFixed(1);
ok(`JAR hiện tại: ${mb} MB · ${statSync(JAR).mtime.toLocaleString("vi-VN")}`);
const dauThoiGian = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const TEP_LUI = join(THU_MUC_LUI, `vntech-erp-web-${dauThoiGian}.jar`);
B(`sẽ sao lưu ⇒ ${TEP_LUI.replace(GOC + "\\", "")}`);
if (THUC_THI) { mkdirSync(THU_MUC_LUI, { recursive: true }); copyFileSync(JAR, TEP_LUI); ok("đã sao lưu"); }
else B("(chạy thử: ⛔ chưa sao lưu)");

// ── ④ BUILD ───────────────────────────────────────────────────────────────────────────────
buoc(4, "Build lại JAR");
B(`mvn -o -DskipTests package   (chạy trong java-backend)`);
if (THUC_THI) {
  const r = spawnSync("cmd", ["/c", `"${MVN}" -o -DskipTests package 2>&1`], { cwd: join(GOC, "java-backend"), encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  if (!/BUILD SUCCESS/.test(out)) { canh("⛔ BUILD ⛔ KHÔNG THÀNH CÔNG ⇒ DỪNG (JAR cũ vẫn nguyên vì đã sao lưu)."); B(out.split("\n").filter((l) => /ERROR|BUILD/.test(l)).slice(0, 8).join("\n")); process.exit(1); }
  ok("BUILD SUCCESS");
} else B("(chạy thử: ⛔ chưa build)");

// ── ⑤ JAR MỚI PHẢI CHỨA V35 + V37 ────────────────────────────────────────────────────────
buoc(5, "Kiểm JAR mới chứa migration V35 + V37");
if (THUC_THI) {
  const libDir = join(GOC, "java-backend", "infrastructure", "target", "classes", "db", "migration");
  const ds = existsSync(libDir) ? readdirSync(libDir).filter((f) => f.endsWith(".sql")) : [];
  const co35 = ds.some((f) => f.startsWith("V35")), co37 = ds.some((f) => f.startsWith("V37"));
  if (!co35 || !co37) { canh(`⛔ thiếu migration trong bản build (V35=${co35} · V37=${co37}) ⇒ DỪNG.`); process.exit(1); }
  ok(`có V35 + V37 (tổng ${ds.length} migration)`);
} else B("(chạy thử: ⛔ chưa kiểm)");

// ── ⑥ DỪNG + KHỞI ĐỘNG LẠI ────────────────────────────────────────────────────────────────
buoc(6, `Dừng PID ${pid} rồi khởi động JAR mới`);
if (THUC_THI) {
  spawnSync("powershell", ["-NoProfile", "-Command", `Stop-Process -Id ${pid} -Force`], { encoding: "utf8" });
  ok(`đã dừng PID ${pid}`);
  const con = ngheCong(CONG);
  if (con !== null) { canh(`⛔ vẫn còn tiến trình nghe :${CONG} (PID ${con}) ⇒ DỪNG.`); process.exit(1); }
  const con2 = spawn("java", ["-jar", JAR, `--server.port=${CONG}`], {
    cwd: join(GOC, "java-backend"), detached: true, stdio: "ignore",
  });
  con2.unref();
  ok("đã khởi động JAR mới (tách tiến trình)");
} else { B(`sẽ dừng PID ${pid} và chạy: java -jar <JAR> --server.port=${CONG}`); }

// ── ⑦ HEALTH-CHECK ────────────────────────────────────────────────────────────────────────
buoc(7, `Health-check :${CONG}`);
if (THUC_THI) {
  let len = false;
  for (let i = 0; i < 40 && !len; i++) {
    await new Promise((s) => setTimeout(s, 3000));
    const r = spawnSync("powershell", ["-NoProfile", "-Command",
      `try{(Invoke-WebRequest -Uri 'http://127.0.0.1:${CONG}/api/system' -Method GET -TimeoutSec 5 -UseBasicParsing).StatusCode}catch{$_.Exception.Response.StatusCode.value__}`],
      { encoding: "utf8" });
    len = (r.stdout || "").trim().length > 0;
    if (!len) B(`chờ… (${(i + 1) * 3}s)`);
  }
  if (len) ok("backend ĐÃ trả lời"); else canh("⛔ backend ⛔ KHÔNG trả lời sau 120s ⇒ XEM HƯỚNG DẪN LÙI ở dưới.");
} else B("(chạy thử: ⛔ chưa health-check)");

// ── ⑧ NGHIỆM THU ──────────────────────────────────────────────────────────────────────────
// ⛔⛔ BỔ SUNG 05/10/2026 (TASK-194) — CHÍNH CÔNG CỤ NÀY TỪNG THIẾU BÀI KIỂM CHO BUG ĐÃ VÁ:
//   Bản trước chỉ chạy 2 bài (BUG-20261008 · BUG-20261010/011) ⇒ ⭐ **triển khai xong ⛔ KHÔNG
//   xác minh được BUG-20261005-012** (lỗi 500 `check_material_alias_conflicts`, đã vá ở TASK-189)
//   ⇒ ⭐ **một cuộc triển khai ⛔ không kiểm chính thứ mình vừa sửa là cuộc triển khai MÙ.**
//   ⭐ Phát hiện nhờ CHẠY DRY-RUN (`node tools/deploy-java-backend.mjs`) — ⭐ **chạy thử công cụ
//   trước khi dùng thật là việc PHẢI làm**: nó lộ ra lỗ hổng này mà đọc mã ⛔ không thấy.
//   ⓘ Từ đây: mỗi bản vá PHẢI có **bài kiểm tương ứng trong danh sách nghiệm thu**.
buoc(8, "Nghiệm thu sau triển khai (bài E2E)");
const NGHIEM_THU = [
  ["tools/e2e/go-live-bao-loi-danh-dau-xong.mjs", "BUG-20261008 — mở lại báo lỗi (kỳ vọng 5/5)"],
  ["tools/e2e/go-live-phu-toan-bo-delete.mjs", "BUG-20261010/011 — chốt chặn delete_* (kỳ vọng 34/34)"],
  // ⭐ BUG-20261005-012 (TASK-189): SQL 1055 `ONLY_FULL_GROUP_BY` ở `check_material_alias_conflicts`
  //    ⇒ ⭐ bài này ĐÃ phát hiện 2 lỗi 500; sau khi vá phải **30/30, ⛔ không còn `[LOI]` nào**
  ["tools/e2e/go-live-kiem-30-action-con-lai.mjs", "BUG-20261005-012 — ⭐ 2 lỗi 500 phải HẾT (kỳ vọng 30/30, ⛔ không còn [LOI])"],
  // ⭐ Các bài ĐO BAO PHỦ — ⛔ không phải bản vá, nhưng là LƯỚI AN TOÀN: chúng nổ nếu có hồi quy
  ["tools/e2e/go-live-kiem-save-chung-tu.mjs", "lưới — 24 `save_*` chứng từ (kỳ vọng 24/24)"],
  ["tools/e2e/go-live-kiem-set-con-lai.mjs", "lưới — 8 `set_*` chưa test (kỳ vọng 16/16)"],
  ["tools/e2e/go-live-kiem-3-action-cuoi.mjs", "lưới — 3 action an toàn cuối (kỳ vọng 6/6)"],
  ["tools/e2e/go-live-thanh-cong-brg.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG business_role_group (kỳ vọng 5/5)"],
  ["tools/e2e/go-live-thanh-cong-dm.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG material_norm (kỳ vọng 5/5)"],
  // ⭐ TASK-195 — 4 thực thể danh mục + ⭐ PHÉP THỬ «CHỐT CHỐNG TRÙNG» (⛔ không cần id)
  ["tools/e2e/go-live-thanh-cong-4-danh-muc.mjs", "lưới — vòng đời 4 danh mục payment_plan/seal/legal_document/correspondence (kỳ vọng 16/16)"],
  ["tools/e2e/go-live-don-4-danh-muc.mjs", "lưới — DỌN RÁC 4 danh mục (kỳ vọng 4/4, và các mảng phải về giá trị gốc)"],
  // ⭐ TASK-196/197 — BUG-20261005-014: `delete_material_category` phải DỌN nhóm con (đúng JS gốc)
  ["tools/e2e/go-live-thanh-cong-danh-muc-vt.mjs", "BUG-20261005-014 — ⭐ xoá nhóm phải DỌN nhóm con (⛔ không còn mồ côi) · kỳ vọng 7/7"],
  // ⭐ TASK-199 — đường thành công `approval_stage` (5 chốt chặn) · ⭐ nhắc: sau triển khai phải kiểm MySQL nữa
  ["tools/e2e/go-live-thanh-cong-buoc-duyet.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG approval_stage (kỳ vọng 5/5, 5 chốt chặn)"],
  // ⭐ TASK-200 — vòng đời `project_contract` · ⭐ CÓ BƯỚC KIỂM CHỐT CHẶN THEO CHIỀU ÂM (chuỗi xác nhận sai ⇒ 400)
  ["tools/e2e/go-live-thanh-cong-hop-dong.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG project_contract + ⭐ chốt chống xoá nhầm (kỳ vọng 5/5)"],
  // ⭐ TASK-201 — ⭐ kỹ thuật «SO TẬP ID TRƯỚC/SAU» + kiểm chốt chặn CHIỀU ÂM (id bịa ⇒ 400)
  ["tools/e2e/go-live-thanh-cong-hdld.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG labor_contract + ⭐ so tập ID (kỳ vọng 5/5)"],
  // ⭐ TASK-202 — `benefit_record` · ⭐ 4 kỹ thuật cũ áp dụng cùng lúc (đọc trọn · so tập ID · chiều âm · dấu vết riêng)
  ["tools/e2e/go-live-thanh-cong-bao-hiem.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG benefit_record (kỳ vọng 5/5)"],
  // ⭐ TASK-203 — `workflow` · ⭐ CÓ 2 PHÉP KIỂM CHỐT CHẶN CHIỀU ÂM (trùng mã + bảo vệ quy trình mặc định) · ⭐ kiểm CẢ 4 mảng
  ["tools/e2e/go-live-thanh-cong-quy-trinh.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG workflow + ⭐ chốt bảo vệ hệ thống (kỳ vọng 6/6)"],
  // ⭐ TASK-205 — `construction_daily_log` · ⭐ KIỂM TẦNG XOÁ CON (mảng cha + mảng con đều phải về gốc)
  ["tools/e2e/go-live-thanh-cong-nhat-ky-thi-cong.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG construction_daily_log + ⭐ tầng xoá con (kỳ vọng 5/5)"],
  // ⭐ TASK-206 — `cashbook_entry` · ⭐ HAI chốt chặn chiều âm + ⭐ KIỂM GIÁ TRỊ DẪN XUẤT (số dư phải hoàn)
  ["tools/e2e/go-live-thanh-cong-so-quy.mjs", "lưới — vòng đời ĐƯỜNG THÀNH CÔNG cashbook_entry (sổ quỹ) + ⭐ hoàn số dư (kỳ vọng 6/6)"],
  // ⭐ TASK-207 — BUG-20261005-015: ⭐ sau triển khai, bước ① PHẢI là **400** (⛔ không còn 500)
  ["tools/e2e/go-live-thanh-cong-chung-tu-kt.mjs", "BUG-20261005-015 — ⭐ voucherDate ngắn phải 400, ⛔ KHÔNG 500 (kỳ vọng 6/6)"],
  // ⭐ TASK-208 — KIỂM TOÁN TRỌN LỚP «thao tác không chốt trên tham số» · ⭐ lưới chống hồi quy cho mẫu `.get(0)`
  ["tools/e2e/go-live-kiem-ung-vien-500.mjs", "lưới — ⭐ 8 action `.get(0)` với payload RỖNG phải 400, ⛔ KHÔNG 500 (kỳ vọng 8/8)"],
  // ⭐ TASK-209 — ⭐ KIỂM HỆ THỐNG: MỌI `save_*` với THAM SỐ MÉO `"1"` ⇒ ⛔ KHÔNG 5xx (kỳ vọng 49/49)
  ["tools/e2e/go-live-kiem-tham-so-meo.mjs", "lưới — ⭐ 49 `save_*` với tham số MÉO phải 400/200, ⛔ KHÔNG 500 (kỳ vọng 49/49)"],
  // ⭐ TASK-210 — ⭐ KHÉP KÍN BAO PHỦ: 2 action còn lại (payload RỖNG + MÉO) ⇒ ⛔ KHÔNG 5xx (kỳ vọng 4/4)
  ["tools/e2e/go-live-kiem-action-doc.mjs", "lưới — ⭐ khép kín bao phủ action 214 = 201 + 13 + 2 (kỳ vọng 4/4)"],
];
for (const [tep, mo] of NGHIEM_THU) B(`sẽ chạy: ${tep}  ← ${mo}`);
if (THUC_THI) {
  for (const [tep] of NGHIEM_THU) {
    const r = spawnSync("node", [tep], { encoding: "utf8", cwd: GOC });
    const out = (r.stdout || "").split("\n");
    const cuoi = out.filter((l) => /ĐẠT \d+\/\d+|KẾT LUẬN|BÁO THÀNH CÔNG SAI|500 lỗi/.test(l)).slice(-3);
    console.log(`    ── ${tep}`);
    for (const l of cuoi) B(l.trim());
  }
}

// ── HƯỚNG DẪN LÙI ─────────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(84));
console.log("HƯỚNG DẪN LÙI (nếu bản mới có vấn đề)");
console.log("=".repeat(84));
if (THUC_THI) {
  console.log(`   1) Dừng tiến trình đang chạy:  Stop-Process -Id <PID mới> -Force`);
  console.log(`   2) Khôi phục JAR cũ:           Copy-Item "${TEP_LUI}" "${JAR}" -Force`);
  console.log(`   3) Khởi động lại:              java -jar "${JAR}" --server.port=${CONG}`);
  console.log(`   ⓘ Bản lùi: ${TEP_LUI.replace(GOC + "\\", "")}`);
} else {
  console.log("   (chạy thử — chưa có gì để lùi)");
}
console.log(`\n   ⛔ LƯU Ý: migration V35/V37 khi đã áp vào DB thì KHÔNG tự lùi — nhưng cả hai đều IDEMPOTENT`);
console.log(`      (V35 = UPDATE khớp 0 dòng · V37 = CREATE TABLE IF NOT EXISTS + INSERT IGNORE) ⇒ lùi JAR là an toàn.`);
if (!THUC_THI) console.log("\nⓘ Đây là CHẠY THỬ. Muốn thực thi: thêm cờ  --dong-y-trien-khai");
