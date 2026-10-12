> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# KIỂM 2 ĐƯỜNG CẤP QUYỀN (FE↔BE) + **SCRIPT PHÂN LOẠI 65 ACTION RỖNG** (sẵn dán)

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · **read-only** mã sản phẩm
Bối cảnh: sau khi khoá được **chiều bảo mật** (`docs/43` — ⛔ không bypass) và **chiều gác quá chặt** (`docs/42` — P-08), vòng này kiểm **đường cấp quyền** (vùng dễ sinh "nút chết" nhất — lớp lỗi **MỐC 109**) và chuẩn bị **công cụ phân loại chính xác 65 action rỗng**.

> ⚠️ Shell vẫn hỏng (vòng **5**) ⇒ ⛔ chưa chạy được. Mọi kết quả là **[ĐỌC MÃ]**.

---

## 1. KẾT QUẢ: MỌI ĐƯỜNG **CẤP QUYỀN** ĐỀU **ADMIN-ONLY** — và **FE NHẤT QUÁN** ✅

| Đối tượng cấp quyền | Action | Module (tầng ①) | Tầng ② (controller) | Ai dùng được | FE xử lý |
|---|---|---|---|---|---|
| **Quyền theo TỪNG NGƯỜI** | `save_user_access` | 🔴 **rỗng** | **`requireRequireAdmin`** (`:413-414`) | **A** | ✅ **ẩn nút** với non-admin + ghi chú ngay trong mã (`Inventory.tsx:420-425`: *«backend `requireRole(…, List.of("admin"))` ⇒ **ADMIN-ONLY** ⇒ UI ẩn nút … ⛔ không tạo nút chết như BUG-013/014»*) |
| **Quyền theo PHÒNG BAN** | `save_department_permission` | có module | **`requireRequireAdmin`** (`:424-425`) | **A** | nằm trong màn Quản trị (AdminApp step 5) ⇒ vốn đã admin-only |
| **Xoá quyền phòng ban** | `delete_department_permission` | 🔴 rỗng | **`requireRequireAdmin`** (`:429-430`) | **A** | nt |
| **Ngoại lệ cá nhân** | `delete_user_module_override` | 🔴 rỗng | **`requireRequireAdmin`** (`:418-419`) | **A** | nt |
| **Sửa TÀI KHOẢN** (trường hồ sơ) | `update_user` | `admin_tab_01` · `canEdit` | ⭐ **CỐ Ý BỎ** (`:379-394`, MỐC 109) | **L · M (có `admin_tab_01`)** | FE mở modal khi `hasAdminTab(admin_tab_01)` hoặc admin (`page.tsx:1812`) |
| **Tạo/xoá/khoá tài khoản** | `create_user` · `delete_user` · `set_user_status` · `reset_user_password` | 🔴 rỗng/kết hợp | **`requireRequireAdmin`** | **A** | Quản trị |
| **Cơ cấu tổ chức** | `save_organization_unit` · `set_organization_unit_status` | 🔴 rỗng | **`requireRequireAdmin`** (`:479`, `:484-485`) | **A** | Quản trị |

### 1.1 KẾT LUẬN (⛔ không phải bug mới — tránh tạo việc giả)
1. ✅ **FE và BE NHẤT QUÁN**: mọi nút liên quan cấp quyền đều **bị ẩn/khoá** với người ⛔ không phải admin ⇒ ⛔ **không có "nút chết"** ⇒ ⛔ **KHÔNG phải lớp lỗi MỐC 109** (lớp đó là `update_user` — **đã sửa xong ở MỐC 109**, xác minh lại mã ở `:379-394`).
2. ⭐ **Trả lời trực tiếp câu hỏi GĐ A3/A4**: hiện **việc cấp quyền là tập trung ở admin**, ⛔ **không phân cấp** cho Trưởng phòng. Ngoại lệ duy nhất được phân cấp là **sửa trường hồ sơ tài khoản** (`update_user` + `admin_tab_01`).
   → **Nếu VNTECH muốn Trưởng phòng tự cấp quyền cho nhân viên phòng mình** ⇒ **phải sửa BE** (theo khuôn MỐC 109: bỏ hard-code ở controller cho `save_user_access`/`save_department_permission`, để cổng ở tầng ① + guard phạm vi phòng ban) — ⛔ **cấu hình quyền KHÔNG giải quyết được**.
3. ⚠️ **CẢNH BÁO DỮ LIỆU (đã có trong mã, `Inventory.tsx:423-425`)**: `save_user_access` là **FULL-REPLACE** (`clearUserScopes()` xoá cứng 3 bảng rồi ghi lại) ⇒ ⛔ **phải gửi ĐỦ** `projectScopes` + `warehouseScopes` + `modulePermissions`, gửi thiếu ⇒ **XOÁ mất phạm vi khác** của tài khoản. ⇒ ⭐ Mọi thay đổi liên quan `save_user_access` (kể cả mở quyền) **phải có test chống mất dữ liệu**.

---

## 2. **SCRIPT PHÂN LOẠI 65 ACTION RỖNG** — sẵn dán (⛔ không cần UI/DB)

> Mục đích: thay "canary 65" trong `docs/43` bằng **allowlist chính xác** — và ⛔ **không phải đọc tay 260 dòng** controller.

```js
// tools/rbac-classify-actions.mjs   — chạy: node tools/rbac-classify-actions.mjs
// Phân loại MỌI action khai module RỖNG (ActionRbacRegistry) theo tầng cổng thực tế.
// ⛔ Thuần đọc mã ⇒ chạy được cả khi UI/DB trục trặc.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const J = "java-backend/application/src/main/java/com/vntech/erp/application/rbac";
const reg  = readFileSync(resolve(ROOT, `${J}/ActionRbacRegistry.java`), "utf8");
const rbac = readFileSync(resolve(ROOT, `${J}/RbacService.java`), "utf8");
const ctrl = readFileSync(resolve(ROOT, "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java"), "utf8");

// ① tầng registry: action khai List.of()
const empty = new Set([...reg.matchAll(/Map\.entry\("([a-z_0-9]+)",\s*List\.of\(\)\)/g)].map((m) => m[1]));

// ② PUBLIC_ACTIONS
const src = rbac.slice(rbac.indexOf("PUBLIC_ACTIONS = java.util.Set.of("));
const pub = new Set([...src.slice(0, src.indexOf(");")).matchAll(/"([a-z_0-9]+)"/g)].map((m) => m[1]));

// ③ tầng controller: thân từng `case`
const caseBody = (a) => {
  const i = ctrl.indexOf(`case "${a}" ->`);
  if (i < 0) return null;
  const j = ctrl.indexOf('case "', i + 10);
  return ctrl.slice(i, j < 0 ? ctrl.length : j);
};

const rows = [...empty].map((a) => {
  const b = caseBody(a);
  const cls = pub.has(a) ? "PUBLIC"
    : b === null ? "NO_CASE"                                   // ⚠️ phải điều tra
    : b.includes("requireRequireAdmin") ? "ADMIN_HARD"         // admin-only + thông điệp ĐÚNG
    : "ORPHAN";                                                // ⇒ 403 «chưa khai báo quyền» cho M
  return { a, cls };
});
const pick = (c) => rows.filter((r) => r.cls === c).map((r) => r.a);

console.log(`Tổng action khai rỗng : ${rows.length}`);
console.log(`PUBLIC   (đã có cổng riêng)      : ${pick("PUBLIC").length}`, pick("PUBLIC"));
console.log(`ADMIN_HARD (admin, thông điệp ĐÚNG): ${pick("ADMIN_HARD").length}`);
console.log(`ORPHAN   (⇒ 403 sai bản chất cho M): ${pick("ORPHAN").length}`);
pick("ORPHAN").forEach((a) => console.log("   -", a));
console.log(`NO_CASE  (⚠️ không thấy case)      : ${pick("NO_CASE").length}`, pick("NO_CASE"));

// ⛔ CHỐNG "CỔNG XANH RỖNG" (bài học SHARED_STATE §34): đo hỏng ≠ sạch
if (rows.length === 0 || ctrl.indexOf('case "') < 0) {
  console.error("❌ Không đọc được mã ⇒ PHÉP ĐO HỎNG (⛔ không phải «sạch»)");
  process.exit(1);
}
console.log("\n// DÁN VÀO ALLOWLIST của tests/golive-rbac-orphans.test.mjs:\n"
  + JSON.stringify(pick("ORPHAN"), null, 2));
```

**Đầu ra kỳ vọng (⚠️ chưa chạy được ở phiên này)**: `ORPHAN` sẽ gồm **12 action P-08** (`docs/42` §2.1) + `bulk_import_projects` · `bulk_import_users` · `save_email_settings` · `retry_email` · `save_ui_display_settings` · `save_trust_development_settings` + các action danh mục khác ⇒ **danh sách này thay hằng số canary** ⇒ cổng tĩnh trở nên **chính xác từng tên** thay vì đếm số.

**Đối chứng âm của script**: nếu ai đó thêm `Map.entry("save_zzz", List.of())` vào registry **và** thêm `case "save_zzz"` dùng `requireCurrentUser` vào controller ⇒ script **phải** liệt nó vào `ORPHAN` (regex + cắt thân case đã chứng minh ở `docs/43` §2.1).

---

## 3. VIỆC CẦN LÀM

| # | Việc | Ai | Ghi chú |
|---|---|---|---|
| 1 | Dán `tools/rbac-classify-actions.mjs` (§2) và chạy ⇒ lấy danh sách `ORPHAN` thật | **S01** | ⚠️ `tools/**` dùng chung — ⭐ nếu S01 không muốn thêm tệp, chạy tạm bằng `node -e` trong 1 lệnh |
| 2 | Dán danh sách `ORPHAN` vào `ALLOWLIST` của `tests/golive-rbac-orphans.test.mjs` (thay canary) | **S01** | Sau khi vá P-08 ⇒ xoá tên khỏi allowlist ⇒ cổng đỏ nếu chưa cập nhật (đúng ý đồ) |
| 3 | Xác nhận `NO_CASE = 0` | **S01** | Nếu > 0 ⇒ có action khai trong registry mà **không có `case`** ⇒ ⚠️ cần điều tra (action "mồ côi controller") |
| 4 | **Trả lời câu hỏi nghiệp vụ** §1.1 mục 2: cấp quyền **tập trung (admin)** hay **phân cấp (Trưởng phòng)**? | **USER** | Nếu phân cấp ⇒ thêm vào phạm vi vá BE (khuôn MỐC 109) |

## 4. GHI NHẬN
- ✅ Vòng này **⛔ không tạo việc giả**: nghi vấn "FE mở khoá – BE chặn" **không tái hiện** — FE **đã** ẩn nút và **ghi chú ngay trong mã** ⇒ ⭐ đây là **thực hành tốt cần giữ**.
- ⭐ **Điểm mấu chốt cho go-live**: mô hình quyền hiện tại là **"admin cấp quyền, mọi người dùng quyền"** — ⛔ không phân cấp. Đây là **quyết định thiết kế**, ⛔ không phải lỗi ⇒ cần user xác nhận trước khi cấu hình GĐ A3/A4.
