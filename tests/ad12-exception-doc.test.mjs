// PHASE 7 (`AD-12`) — HỢP ĐỒNG TÀI LIỆU: «NGOẠI LỆ CÁ NHÂN = GHI ĐÈ QUYỀN» — GIỮ NGUYÊN CHỨC NĂNG.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-12`: «Ghi rõ **Ngoại lệ cá nhân = ghi đè QUYỀN** vào tài liệu;
// giữ nguyên chức năng» (phụ thuộc `A-08` ✔).
//
// ĐỀ BÀI NÓI RẤT RÕ: mục này **CHỈ ghi tài liệu**, **KHÔNG đổi hành vi**. Vì vậy test kiểm HAI CHIỀU:
//   (1) tài liệu nói đúng câu chốt + giải thích cơ chế THẬT (`permission_source='manual_override'`);
//   (2) mã nguồn KHÔNG bị đổi hành vi: các dấu vết cơ chế cũ vẫn còn nguyên (đối chứng âm: nếu ai xoá/đổi
//       cơ chế `manual_override` thì test này HỎNG).
//
// Chạy riêng:  node --test tests/ad12-exception-doc.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const page = read("app/page.tsx");
const DOC = "docs/agent-progress/AD-12-NGOAI-LE-CA-NHAN-GHI-DE-QUYEN.md";

test("AD-12 — tài liệu tồn tại và ghi ĐÚNG câu chốt «Ngoại lệ cá nhân = ghi đè QUYỀN»", () => {
  assert.ok(existsSync(new URL(DOC, root)), `Thiếu tài liệu bắt buộc ${DOC}`);
  const text = readFileSync(new URL(DOC, root), "utf8");
  assert.match(text, /Ngoại lệ cá nhân\s*=\s*ghi đè QUYỀN/,
    "Câu chốt phải xuất hiện nguyên văn: «Ngoại lệ cá nhân = ghi đè QUYỀN»");
  assert.match(text, /manual_override/, "Phải giải thích cơ chế THẬT: `permission_source='manual_override'`");
  assert.match(text, /KHÔNG đổi hành vi/, "Phải ghi rõ phạm vi: KHÔNG đổi hành vi chức năng");
  assert.match(text, /(app\/|java-backend\/|scripts\/)[\w./-]+/, "Phải trích dẫn tệp/dòng bằng chứng");
  // Đối chứng âm: tài liệu chỉ nói chung chung, không có cơ chế ⇒ cổng phải HỎNG.
  const gate = (t) => /Ngoại lệ cá nhân\s*=\s*ghi đè QUYỀN/.test(t) && /manual_override/.test(t) && /KHÔNG đổi hành vi/.test(t);
  assert.equal(gate(text), true, "cổng tài liệu phải ĐẠT với nội dung thật");
  assert.equal(gate("Ngoại lệ cá nhân là một tính năng hay."), false, "[đối chứng âm] nội dung chung chung phải bị bắt");
});

test("AD-12 — GIỮ NGUYÊN CHỨC NĂNG: cơ chế ghi đè vẫn còn nguyên trong mã (không bị ai sửa)", () => {
  assert.match(page, /function PersonalExceptionManager\(/, "Màn «Ngoại lệ cá nhân» phải còn nguyên");
  assert.match(page, /permissionSource\) === "manual_override"/, "UI phải còn nhận diện nguồn quyền `manual_override`");
  assert.match(page, /save_user_access/, "Đường ghi quyền cá nhân phải còn dùng `save_user_access`");
  const java = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/UserAdminStoreAdapter.java");
  assert.match(java, /permission_source='manual_override'/, "Backend phải còn khai nguồn `manual_override` cho ngoại lệ cá nhân");
  assert.match(java, /permission_source='department_default'/, "Phải phân biệt rõ với bản sao phòng ban `department_default`");
  // Đối chứng âm: nếu ai xoá cơ chế ⇒ cổng phải HỎNG.
  const gate = (text) => /manual_override/.test(text);
  assert.equal(gate(page), true);
  assert.equal(gate(page.replace(/manual_override/g, "x")), false, "[đối chứng âm] xoá cơ chế ghi đè ⇒ cổng phải HỎNG");
});
