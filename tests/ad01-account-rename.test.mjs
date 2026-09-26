// PHASE 7 (`AD-01`) — HỢP ĐỒNG: ĐỔI TÊN «NHÂN SỰ → TÀI KHOẢN».
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-01`: «Đổi tên **Nhân sự → Tài khoản**».
//
// Cách kiểm: đọc NHÃN 12 BƯỚC của màn Quản trị từ khối THUẦN `AD-PURE-BEGIN/END`
// (`app/screens/admin-governance-pure.ts`), dịch TS→JS bằng esbuild rồi CHẠY THẬT + đối chiếu nguồn.
// ĐỐI CHỨNG ÂM: cổng `labelGate` phải BẮT được nhãn cũ «Nhân sự» nếu ai đó đổi lại.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/ad01-account-rename.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const page = read("app/page.tsx");

function loadPure(names) {
  assert.equal((pure.match(/^\/\/ AD-PURE-BEGIN$/gm) || []).length, 1, "Mốc AD-PURE-BEGIN phải là DÒNG RIÊNG, đúng 1 lần");
  assert.equal((pure.match(/^\/\/ AD-PURE-END$/gm) || []).length, 1, "Mốc AD-PURE-END phải là DÒNG RIÊNG, đúng 1 lần");
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

/** Cổng kiểm dùng CHUNG cho đối chứng âm: nhãn bước 1 phải là «Tài khoản» và KHÔNG còn «Nhân sự». */
const labelGate = (labels) => labels[0] === "Tài khoản" && !labels.includes("Nhân sự");

test("AD-01 — bước 1 của màn Quản trị đổi tên thành «Tài khoản», các bước còn lại giữ nguyên thứ tự", () => {
  const { ADMIN_STEP_LABELS } = loadPure(["ADMIN_STEP_LABELS"]);
  // ⚠️ CẬP NHẬT 23/09/2026 (MT2-P12-01 §13.1): màn Quản trị nay có **13 bước** — MT2 thêm bước «Thông báo»
  // (tab cấu hình thông báo Web/Email; backend đã có `save_notification_config` nhưng trước đó UI = 0 dòng).
  // ⇒ bất biến AD-01 cần giữ là: bước 1 = «Tài khoản», ⛔ KHÔNG còn «Nhân sự», và 12 nhãn CŨ giữ nguyên THỨ TỰ.
  // Xem `app/screens/admin-governance-pure.ts:22` (chính mã ghi mốc MT2-P12-01).
  assert.equal(ADMIN_STEP_LABELS.length, 13, "Màn Quản trị phải có ĐÚNG 13 bước (12 bước AD-01 + «Thông báo» của MT2-P12-01)");
  assert.equal(ADMIN_STEP_LABELS[0], "Tài khoản", "Nguyên văn AD-01: bước «Nhân sự» đổi thành «Tài khoản»");
  assert.equal(labelGate(ADMIN_STEP_LABELS), true, "Cổng nhãn phải ĐẠT với dữ liệu thật");
  // 12 bước của AD-01 KHÔNG được đổi tên/đổi thứ tự; bước 13 là phần THÊM của MT2.
  assert.deepEqual(ADMIN_STEP_LABELS.slice(1, 12), [
    "Tổ chức", "Chức danh / vai trò", "Nhóm quyền nghiệp vụ", "Phân quyền phòng ban", "Phân quyền người dùng",
    "Cấp bậc hệ thống", "Phạm vi dự án & kho", "Workflow phê duyệt", "Ngoại lệ cá nhân", "Audit log", "Cấu hình hệ thống",
  ], "AD-01 KHÔNG được đổi nhãn/thứ tự 12 bước cũ");
  assert.equal(ADMIN_STEP_LABELS[12], "Thông báo", "Bước thêm của MT2-P12-01 phải là «Thông báo» (đặt SAU «Cấu hình hệ thống»)");
});

test("AD-01 — ĐỐI CHỨNG ÂM: cổng nhãn PHẢI HỎNG nếu ai đổi lại thành «Nhân sự»", () => {
  const { ADMIN_STEP_LABELS } = loadPure(["ADMIN_STEP_LABELS"]);
  const mutated = [...ADMIN_STEP_LABELS];
  mutated[0] = "Nhân sự";
  assert.equal(labelGate(mutated), false, "[đối chứng âm] cổng phải BẮT được nhãn cũ «Nhân sự»");
  const empty = [];
  assert.equal(labelGate(empty), false, "[đối chứng âm] mảng rỗng không được coi là ĐẠT");
});

test("AD-01 — UI dùng CHÍNH hằng số đó (một nguồn sự thật), không hard-code lại 12 nhãn", () => {
  assert.match(page, /const steps=ADMIN_STEP_LABELS;/, "app/page.tsx phải dựng dải bước từ `ADMIN_STEP_LABELS`");
  assert.doesNotMatch(page, /const steps=\["Nhân sự","Tổ chức"/, "Không được giữ mảng nhãn cũ trong app/page.tsx");
  // Tiêu đề danh sách bước 1 nói rõ đây là DANH SÁCH TÀI KHOẢN.
  assert.ok(page.includes("DANH SÁCH TÀI KHOẢN"), "Tiêu đề danh sách bước 1 phải là «DANH SÁCH TÀI KHOẢN»");
});
