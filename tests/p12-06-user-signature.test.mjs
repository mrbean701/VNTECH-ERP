// MT2-P12-06 (§13.4) — HỢP ĐỒNG chữ ký trong modal TẠO và CHỈNH SỬA tài khoản.
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:266`: «Trong modal **tạo user** và **chỉnh sửa user** ⇒ thêm
// **Chữ ký**, cho phép upload **đúng 1 ảnh**. Nếu upload ảnh mới ⇒ **xoá/thay ảnh cũ** ⇒ lưu ảnh mới.
// ⛔ Không cho tồn tại nhiều chữ ký active cho cùng user nếu nghiệp vụ không yêu cầu.»
//
// AUDIT: backend P3-04 ĐÃ có `setUserSignature` + `updateUser` xử lý `signatureUrl` (chỉ khi payload CÓ khoá;
// rỗng ⇒ ghi NULL) + cột `users.signature_url` (V25) + `ProfileSignatureTest`. ⛔ NHƯNG `createUser` CHƯA ghi
// chữ ký ⇒ UI modal tạo sẽ chọn ảnh xong **mất** ⇒ phải bổ sung tầng backend (task này).
//
// Chạy: node --import tsx --test tests/p12-06-user-signature.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const page = read("../app/page.tsx");
const useCase = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java");
const store = read("../java-backend/application/src/main/java/com/vntech/erp/application/port/out/UserAdminStore.java");
const css = read("../app/globals.css");

// ⚠️ Cửa sổ phải ĐỦ RỘNG: khối chữ ký trong `createUser` nằm ~2500 ký tự sau chữ ký hàm.
const create = useCase.slice(useCase.indexOf("public String createUser("), useCase.indexOf("public String createUser(") + 3200);
const update = useCase.slice(useCase.indexOf("public String updateUser("), useCase.indexOf("public String updateUser(") + 3000);
const field = page.slice(page.indexOf("function SignatureField("), page.indexOf("function UserModal("));
const createModal = page.slice(page.indexOf("function UserModal("), page.indexOf("function ForcedPasswordModal("));
const editModal = page.slice(page.indexOf("function UserEditModal("), page.indexOf("function UserAccessModal("));

test("P12-06 — backend: `createUser` phải LƯU chữ ký (⛔ thiếu thì ảnh chọn lúc tạo sẽ mất)", () => {
  assert.match(create, /if \(payload\.containsKey\("signatureUrl"\)\)\s*\{[\s\S]{0,300}store\.setUserSignature\(userId, signature, now\)/,
    "§13.4 yêu cầu chữ ký ở modal TẠO ⇒ backend phải ghi khi tạo");
  // ⚠️ Khoảng cách thật giữa `insertUser` và khối chữ ký ≈ 780 ký tự ⇒ cửa sổ phải rộng.
  assert.match(create, /store\.insertUser\([\s\S]{0,1200}if \(payload\.containsKey\("signatureUrl"\)\)/,
    "⛔ phải ghi SAU khi đã có `userId` (không ghi trước khi insert)");
});

test("P12-06 — backend: chỉ ghi khi payload CÓ khoá `signatureUrl` (⛔ không ghi đè khi client không gửi)", () => {
  for (const [name, block] of [["createUser", create], ["updateUser", update]]) {
    assert.match(block, /payload\.containsKey\("signatureUrl"\)/,
      `${name} phải kiểm tra CÓ khoá trước khi ghi (giữ đúng hành vi P3-04)`);
  }
  assert.match(store, /void setUserSignature\(String userId, String signatureUrl, Instant now\)/,
    "port `setUserSignature` phải tồn tại (P3-04)");
});

test("P12-06 — 1 ô chữ ký DÙNG CHUNG cho cả 2 modal (§15 không nhân bản component)", () => {
  assert.ok(page.includes("function SignatureField("), "phải có 1 component `SignatureField` dùng chung");
  assert.match(createModal, /<SignatureField value=\{signature\} onChange=\{setSignature\}\/>/, "modal TẠO phải dùng ô chữ ký");
  assert.match(editModal, /<SignatureField value=\{signature\} onChange=\{setSignature\}\/>/, "modal SỬA phải dùng ô chữ ký");
  const uses = (page.match(/<SignatureField /g) || []).length;
  assert.equal(uses, 2, "⛔ chỉ được dùng đúng 2 chỗ (tạo + sửa); nhiều hơn ⇒ nhân bản");
});

test("P12-06 — payload: cả tạo lẫn sửa đều gửi `signatureUrl`", () => {
  assert.match(createModal, /submit\("create_user",\{\.\.\.payload,projectIds:selectedProjects,signatureUrl:signature\}\)/,
    "modal tạo phải gửi signatureUrl (⛔ không chọn ảnh xong không lưu)");
  assert.match(editModal, /submit\("update_user",[\s\S]{0,500}signatureUrl: signature/,
    "modal sửa phải gửi signatureUrl (gửi rỗng ⇒ backend ghi NULL ⇒ xoá được chữ ký)");
  // ⚠️ `||` phải escape thành `\|\|` — viết `||` trong regex = alternation ⇒ khớp lung tung.
  assert.match(editModal, /const \[signature,setSignature\]=useState\(String\(row\.signatureUrl\|\|""\)\)/,
    "⛔ modal sửa phải prefill chữ ký hiện có (không làm mất khi mở form)");
});

test("P12-06 — đúng 1 ảnh: không danh sách + chọn ảnh mới GHI ĐÈ giá trị cũ", () => {
  assert.match(field, /reader\.readAsDataURL\(file\)/, "phải đọc ảnh thành chuỗi (data-URI) như khuôn avatar");
  assert.match(field, /onChange\(String\(reader\.result \|\| ""\)\)/, "chọn ảnh mới ⇒ thay thế giá trị cũ (⛔ không nối thêm)");
  assert.ok(!/multiple/.test(field), "⛔ input KHÔNG được `multiple` (§13.4: đúng 1 ảnh)");
  assert.ok(!/signatures\.map|signatureList|appendSignature/.test(page), "⛔ không được dựng danh sách chữ ký (sẽ sinh nhiều chữ ký active)");
});

test("P12-06 — kiểm ảnh REUSE đúng luật khuôn avatar (MIME + 2 MB), ⛔ không phát minh luật mới", () => {
  // ⚠️ Regex phải chấp nhận KHOẢNG TRẮNG quanh `*` (mã nguồn viết `2 * 1024 * 1024`).
  assert.match(field, /\["image\/jpeg",\s*"image\/png",\s*"image\/webp"\]\.includes\(file\.type\)/, "MIME phải giống hệt khuôn ảnh đại diện");
  assert.match(field, /file\.size\s*>\s*2\s*\*\s*1024\s*\*\s*1024/, "giới hạn 2 MB phải giống khuôn ảnh đại diện");
  assert.match(css, /\.signature-field\{display:grid;grid-template-columns:180px 1fr/, "phải có CSS cho khối chữ ký (⛔ không để tràn khung)");
  assert.match(css, /@media\(max-width:650px\)\{\.signature-field\{grid-template-columns:1fr\}/, "§24: màn hình hẹp phải co 1 cột");
});
