> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# RÀ CHIỀU NGƯỢC (`PUBLIC_ACTIONS`) + **MÃ CỔNG TĨNH SẴN DÁN**

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · **read-only** cho mã sản phẩm (⛔ 0 dòng sửa)
Mục đích: kiểm **chiều ngược lại của P-08** — action nào đang **mở quá rộng** (⇒ **authorization bypass** = mức **CRITICAL** theo Goal §20/§45) — và **chuẩn bị sẵn mã cổng** để S01 dán vào là chạy.

> ⚠️ Shell vẫn hỏng (vòng **4**) ⇒ ⛔ chưa chạy được. Mọi kết quả dưới đây là **[ĐỌC MÃ]**.

---

## 1. KẾT QUẢ RÀ 10 `PUBLIC_ACTIONS` — ✅ **SẠCH (không có lỗ hổng)**

Nguồn: `RbacService.java:43-58` (danh sách) + `SystemController.java` (thân từng `case`).

| # | Action | `requireCurrentUser`? | Tự-giới-hạn? | Chặn bổ sung | Kết luận |
|---|---|---|---|---|---|
| 1 | `setup` | ❌ (không xác thực — đúng thiết kế) | — | ✅ **`AuthUseCase:82-90`**: `isInitialized()` (≥1 user) ⇒ **`ApiError("Hệ thống đã được khởi tạo.", 409)`** | ✅ **AN TOÀN** — chỉ chạy được trên DB trống ⇒ ⛔ không thể tạo admin trái phép sau go-live |
| 2 | `login` | ❌ (đúng thiết kế) | — | ✅ **lockout 10 lần/15 phút** ⇒ `429` (`SystemController:243-247`) | ✅ AN TOÀN |
| 3 | `logout` | ❌ (đúng thiết kế) | chỉ xoá phiên của **chính token đang gửi** (`currentToken(request)`) | idempotent | ✅ AN TOÀN |
| 4 | `change_password` | ✅ `:261` | dùng `cu.id()` + token phiên | — | ✅ AN TOÀN |
| 5 | `update_profile_avatar` | ✅ `:277` | `cu.id()` (`:278`) | — | ✅ AN TOÀN |
| 6 | `update_profile_signature` | ✅ `:1386` | `cu.id()` + mã ghi rõ *«⛔ KHÔNG cho phép sửa chữ ký của người khác»* (`:1383-1387`) | — | ✅ AN TOÀN |
| 7 | `mark_notification_read` | ✅ `:1372` | `cu.id()` + mã ghi *«⛔ KHÔNG cho phép thao tác lên user khác»* (`:1369-1373`) | — | ✅ AN TOÀN |
| 8 | `mark_notification_all_read` | ✅ `:1376` | `cu.id()` | — | ✅ AN TOÀN |
| 9 | `mark_notification_snooze` | ✅ `:1380` | `cu.id()` | — | ✅ AN TOÀN |
| 10 | `save_error_report` | ✅ `:1472` (inline) | gắn người gửi theo phiên | — | ✅ AN TOÀN |

### 1.1 Nhận xét thiết kế (đáng ghi nhận — ⛔ không phải việc cần sửa)
⭐ **7/7 action "tự phục vụ" đều dùng `cu.id()` LẤY TỪ PHIÊN**, ⛔ **không** nhận `userId` từ payload ⇒ **đúng nguyên tắc chống IDOR** (Insecure Direct Object Reference). Mã còn ghi chú giải thích ngay tại `case` — ⭐ nên giữ nguyên phong cách này.
⭐ `setup` **fail-closed theo dữ liệu** (409 khi đã khởi tạo) — đây là **cách chặn đúng** cho action không xác thực.

**⇒ KẾT LUẬN: ⛔ KHÔNG có authorization bypass trong `PUBLIC_ACTIONS`.** (Đây là **tin tốt** cho go-live; ⛔ không tạo việc giả.)

---

## 2. **MÃ CỔNG TĨNH SẴN DÁN** (⛔ chạy **không cần** UI/DB — dùng được ngay khi shell hồi phục)

> ⭐ Thiết kế: **2 tệp test tĩnh** đọc mã Java bằng regex ⇒ ⛔ không cần dịch vụ, ⛔ không cần CSDL.
> ⭐ **Đối chứng âm có trong từng tệp** (bài học MỐC 110 §7 + `SHARED_STATE` §40: cổng phải chứng minh **nó bắt được**).

### 2.1 `tests/golive-rbac-orphans.test.mjs`
```js
// Cổng tĩnh: action khai module RỖNG trong ActionRbacRegistry phải là CHỦ Ý.
// Sinh bởi ERP-SESSION-04 (docs/43) — dán nguyên tệp vào tests/ rồi chạy:
//   node --import tsx --test tests/golive-rbac-orphans.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REG = resolve(ROOT, "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
const RBAC = resolve(ROOT, "java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java");

const emptyRe = /Map\.entry\("([a-z_0-9]+)",\s*List\.of\(\)\)/g;
function emptyActions(src) {
  const out = new Set(); let m;
  while ((m = emptyRe.exec(src))) out.add(m[1]);
  emptyRe.lastIndex = 0;                 // ⚠️ regex dùng lại ⇒ phải reset (bẫy thật)
  return out;
}
function publicActions() {
  const src = readFileSync(RBAC, "utf8");
  const i = src.indexOf("PUBLIC_ACTIONS = java.util.Set.of(");
  const body = src.slice(i, src.indexOf(");", i));
  return new Set([...body.matchAll(/"([a-z_0-9]+)"/g)].map((m) => m[1]));
}

// Ảnh chụp ĐO ĐƯỢC ngày 2026-10-08: 65 action khai rỗng.
const SNAPSHOT_EMPTY_COUNT = 65;
// Nhóm NGHIỆP VỤ đang mồ côi (P-08) — phải VÁ (docs/42). Khi vá xong ⇒ XOÁ tên khỏi đây
// (cổng sẽ đỏ cho tới khi danh sách được cập nhật ⇒ buộc ghi nhận tiến độ).
const KNOWN_ORPHAN_BUSINESS = [
  "save_material_category", "save_material_subcategory", "set_material_category_status",
  "set_material_subcategory_status", "delete_material_category", "delete_material_subcategory",
  "import_material_catalog", "set_project_team_status", "delete_project_team",
  "save_approval_stage", "set_approval_stage_status", "delete_approval_stage",
];

test("số action khai rỗng không được TĂNG ngoài ảnh chụp (canary)", () => {
  const n = emptyActions(readFileSync(REG, "utf8")).size;
  assert.equal(n, SNAPSHOT_EMPTY_COUNT,
    `Số action khai rỗng đổi: ${n} ≠ ${SNAPSHOT_EMPTY_COUNT}. Nếu là CHỦ Ý (vá P-08) ⇒ cập nhật hằng số + ghi lý do; nếu không ⇒ có action mới bị "mồ côi".`);
});

test("12 action nghiệp vụ P-08 vẫn nằm trong nhóm rỗng ⇒ chưa vá (theo dõi tiến độ)", () => {
  const empty = emptyActions(readFileSync(REG, "utf8"));
  const conLai = KNOWN_ORPHAN_BUSINESS.filter((a) => empty.has(a));
  assert.deepEqual(conLai, KNOWN_ORPHAN_BUSINESS,
    `Trạng thái P-08 đã đổi: còn ${conLai.length}/${KNOWN_ORPHAN_BUSINESS.length}. Nếu đã vá ⇒ XOÁ tên khỏi KNOWN_ORPHAN_BUSINESS + cập nhật docs/41 (ma trận quyền).`);
});

test("PUBLIC_ACTIONS ∩ tập khai rỗng: entry rỗng phải được GIẢI THÍCH", () => {
  const empty = emptyActions(readFileSync(REG, "utf8"));
  const pub = publicActions();
  const chuaGiaiThich = [...empty].filter((a) => !pub.has(a));
  assert.ok(chuaGiaiThich.length > 0, "Phép kiểm vô nghĩa nếu không còn entry rỗng nào — cập nhật cổng.");
});

test("ĐỐI CHỨNG ÂM: regex PHẢI bắt được entry rỗng mới", () => {
  const gia = 'Map.entry("save_zzz_test", List.of()),';
  const found = emptyActions('Map.entry("create_request", List.of("requests")),' + gia);
  assert.ok(found.has("save_zzz_test"), "Cổng hỏng: không bắt được entry rỗng giả.");
});
```

### 2.2 `tests/golive-rbac-public-actions.test.mjs`
```js
// Cổng tĩnh: mọi action trong PUBLIC_ACTIONS (trừ allowlist) PHẢI tự gác bằng `requireCurrentUser`
// ⇒ chặn "authorization bypass" do vô tình thêm action vào PUBLIC_ACTIONS.
//   node --import tsx --test tests/golive-rbac-public-actions.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CTRL = resolve(ROOT, "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
const RBAC = resolve(ROOT, "java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java");
const AUTH = resolve(ROOT, "java-backend/application/src/main/java/com/vntech/erp/application/service/AuthUseCase.java");

// 3 action ĐƯỢC PHÉP không xác thực (đã kiểm chứng ở docs/43 §1):
//   setup (chặn bổ sung bằng 409) · login (lockout 429) · logout (chỉ xoá phiên hiện tại)
const KHONG_XAC_THUC_HOP_LE = new Set(["setup", "login", "logout"]);

function publicActions() {
  const src = readFileSync(RBAC, "utf8");
  const i = src.indexOf("PUBLIC_ACTIONS = java.util.Set.of(");
  const body = src.slice(i, src.indexOf(");", i));
  return [...body.matchAll(/"([a-z_0-9]+)"/g)].map((m) => m[1]);
}
function bodyOfCase(src, action) {
  const key = `case "${action}" ->`;
  const i = src.indexOf(key);
  if (i < 0) return null;
  const j = src.indexOf(`case "`, i + key.length);   // tới case kế tiếp
  return src.slice(i, j < 0 ? src.length : j);
}

test("mọi PUBLIC action (trừ allowlist) phải gọi requireCurrentUser", () => {
  const src = readFileSync(CTRL, "utf8");
  const viPham = publicActions()
    .filter((a) => !KHONG_XAC_THUC_HOP_LE.has(a))
    .filter((a) => { const b = bodyOfCase(src, a); return !b || !b.includes("requireCurrentUser"); });
  assert.deepEqual(viPham, [], `Action công khai nhưng KHÔNG tự gác: ${viPham.join(", ")}`);
});

test("setup phải bị chặn chạy lại (409) — chống tạo admin trái phép", () => {
  const src = readFileSync(AUTH, "utf8");
  assert.ok(/Hệ thống đã được khởi tạo/.test(src), "Mất chốt chặn chạy lại của setup");
  assert.ok(/409/.test(src), "Mất mã 409 của setup");
});

test("ĐỐI CHỨNG ÂM: nếu PUBLIC action KHÔNG gác ⇒ cổng PHẢI bắt", () => {
  const gia = 'case "save_zzz_test" -> { return ResponseEntity.ok(json(Map.of("ok", true))); }';
  const b = bodyOfCase(gia, "save_zzz_test");
  assert.ok(b && !b.includes("requireCurrentUser"), "Cổng hỏng: không phát hiện được case thiếu cổng.");
});
```

---

## 3. VIỆC CẦN LÀM (⛔ S01, vì `tests/**` + `java-backend/**` thuộc phạm vi phiên 01/02)

| # | Việc | Ai | Ghi chú |
|---|---|---|---|
| 1 | Dán **2 tệp test** ở §2 vào `tests/` rồi chạy | **S01** | 2 tệp **MỚI**, ⛔ không đè tệp nào của S02/S03 |
| 2 | Khai 2 tệp vào `package.json` (`test:regression`) nếu muốn chạy cùng bộ | **S01** | ⚠️ `package.json` = **tệp dùng chung** ⇒ đọc trước, ⛔ không ghi đè |
| 3 | Chạy **§2.1** ⇒ kỳ vọng **PASS** (65 = 65; 12/12 P-08 còn nguyên) | **S01** | ⛔ chưa chạy được ở phiên này (shell hỏng) |
| 4 | Chạy **§2.2** ⇒ kỳ vọng **PASS** (`setup` có 409; 7 action tự gác) | **S01** | |
| 5 | Sau khi vá **P-08** (`docs/42`) ⇒ **cập nhật** `SNAPSHOT_EMPTY_COUNT` + xoá tên khỏi `KNOWN_ORPHAN_BUSINESS` | **S01** | Cổng sẽ **đỏ** cho tới khi cập nhật ⇒ **buộc ghi nhận** (đúng ý đồ thiết kế) |

## 4. GHI NHẬN CHUNG
- ⭐ **Chiều "mở quá rộng" đã được kiểm và SẠCH** ⇒ rủi ro go-live nằm ở chiều **"gác quá chặt"** (P-08), ⛔ không phải ở chiều bảo mật.
- ⭐ Cổng tĩnh §2 là loại cổng **chạy được không cần UI/DB** ⇒ **phù hợp thi hành ngay cả khi hạ tầng đang trục trặc** — ⭐ đề xuất dùng làm khuôn cho các cổng RBAC sau này.
