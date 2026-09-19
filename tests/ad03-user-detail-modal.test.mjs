// PHASE 7 (`AD-03`) — HỢP ĐỒNG: BẤM VÀO TÀI KHOẢN → **USER DETAIL MODAL**.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-03`: «Bấm vào tài khoản → **User Detail Modal**» (phụ thuộc `U-01` ✔).
//
// `U-01` (đã ĐÓNG) nghĩa là dùng LẠI khung dùng chung `EntityDetailModal`; `PR-04` (đã ĐÓNG) đã dựng CỔNG
// `app/screens/ProjectEntityModal.tsx` với `case "user"`. Vì vậy AD-03 KHÔNG được tự dựng modal thứ hai.
//
// ĐỐI CHỨNG ÂM: nếu danh sách tài khoản quay lại mở `open("userProfile")` (đường cũ) thì cổng phải HỎNG.
//
// Chạy riêng:  node --test tests/ad03-user-detail-modal.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const page = read("app/page.tsx");
const gateway = read("app/screens/ProjectEntityModal.tsx");
const modal = read("app/components/ui/EntityDetailModal.tsx");

/** Khối component danh sách tài khoản (bước 1 của màn Quản trị). */
function accountListBlock() {
  const start = page.indexOf("function AdminStaffList(");
  const end = page.indexOf("const EMPTY_CAPS", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy khối `AdminStaffList` trong app/page.tsx");
  return page.slice(start, end);
}

/** Cổng kiểm ĐỘC LẬP để chứng minh phép kiểm có răng (đối chứng âm). */
const rowClickGate = (block) => /openEntity\("user"/.test(block) && !/open\("userProfile"/.test(block);

test("AD-03 — danh sách tài khoản mở User Detail Modal qua CỔNG DÙNG CHUNG `openEntity(\"user\")`", () => {
  const block = accountListBlock();
  assert.equal(rowClickGate(block), true, "Dòng tài khoản phải mở `EntityDetailModal` qua cổng chung `openEntity(\"user\", …)`");
  assert.match(block, /onClick=\{\(\) => openEntity\("user", u\)\}/, "Bấm vào DÒNG phải mở chi tiết tài khoản (không chỉ nút «Hồ sơ»)");
  assert.doesNotMatch(block, /open\("userProfile"/, "Không được quay lại modal `userProfile` tự dựng cho dòng tài khoản");
});

test("AD-03 — ĐỐI CHỨNG ÂM: đường cũ `open(\"userProfile\")` phải bị cổng BẮT", () => {
  const block = accountListBlock();
  const mutated = block.replace('openEntity("user", u)', 'open("userProfile", u)');
  assert.notEqual(mutated, block, "Phép biến đổi đối chứng phải thực sự đổi được mã");
  assert.equal(rowClickGate(mutated), false, "[đối chứng âm] quay lại modal cũ ⇒ cổng phải HỎNG");
});

test("AD-03 — component `Admin` tự suy cổng `openEntity` và RENDER cổng dùng chung (không prop chết)", () => {
  assert.match(page, /function Admin\(\{ data, open, action \}/, "`Admin` giữ nguyên chữ ký gốc (không thêm state từ màn cha)");
  assert.match(page, /const \[entity,setEntity\]=useState<\{kind:ProjectEntityKind;row:Row\}\|null>\(null\)/,
    "`Admin` phải giữ state thực thể để mở modal chi tiết");
  assert.match(page, /function openEntity\(kind: ProjectEntityKind, row: Row\) \{ setEntity\(\{ kind: kind, row: row \}\); \}/,
    "`Admin` phải khai cổng `openEntity` (một nguồn sự thật)");
  assert.match(page, /<ProjectEntityModal data=\{data\} entity=\{entity\} onClose=\{\(\)=>setEntity\(null\)\} permission=\{modulePermission\(data,"admin"\)\}\/>/,
    "Nơi render phải THẬT SỰ dựng cổng chung `ProjectEntityModal` cho tài khoản");
  assert.match(page, /<AdminStaffList data=\{data\} open=\{open\} query=\{adminQuery\} openEntity=\{openEntity\}\/>/,
    "Danh sách tài khoản phải nhận `openEntity` từ màn cha (không prop chết)");
});

test("AD-03 — cổng chung THẬT SỰ có nhánh `user` trả về `EntityDetailModal`", () => {
  assert.match(gateway, /case "user": \{/, "`ProjectEntityModal` phải có nhánh `user`");
  assert.match(gateway, /<EntityDetailModal/, "Cổng chung phải render `EntityDetailModal` (U-01)");
  assert.match(modal, /export function EntityDetailModal/, "`EntityDetailModal` phải tồn tại trong `app/components/ui`");
  // Nhánh user phải hiện hồ sơ THẬT từ payload (không bịa).
  assert.match(gateway, /source: "users\.full_name"/, "Nhánh user phải ghi rõ nguồn từng trường");
});
