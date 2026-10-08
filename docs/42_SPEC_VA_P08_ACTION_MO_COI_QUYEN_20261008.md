# SPEC SẴN SÀNG THI HÀNH — VÁ NHÓM ACTION "MỒ CÔI QUYỀN" (P-08) + ĐỒNG BỘ TẦNG CỔNG

Phiên soạn: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Trạng thái: **CHỜ QUYẾT ĐỊNH NGƯỜI DÙNG**
⚠️ ⛔ **CHƯA THI HÀNH** — tài liệu này **không** sửa mã. Mọi thay đổi phải do **S01** (chủ `java-backend/**`) thực hiện **sau khi user chốt** + **sau khi shell hồi phục để chạy test**.

> Mục tiêu: khi user nói "làm đi", S01 có **đủ mọi thứ** để thi hành trong ~30 phút mà ⛔ không phải điều tra lại.

---

## 1. VẤN ĐỀ (đã đo bằng mã — 3 tầng cổng)

```text
① requireActionModule (RbacService:64-91)   ← tầng registry
      PUBLIC_ACTIONS (10)             ⇒ cho qua
      role == admin                   ⇒ cho qua
      director/accountant && module-list KHÔNG chứa "admin"  ⇒ cho qua
      ⛔ module-list RỖNG (List.of())  ⇒ 403 «Thao tác chưa được khai báo quyền trong hệ thống.»
      còn lại                          ⇒ kiểm module × capability
② case "…" trong SystemController
      requireRequireAdmin(request)     ⇒ 403 «Tài khoản không có quyền thực hiện nghiệp vụ này.»  (chỉ admin)
      requireCurrentUser(request)      ⇒ chỉ cần đã đăng nhập
③ Guard nghiệp vụ trong use case / access scope
      ví dụ ĐÃ CÓ: `accessScopeService.requireProjectAccess(cu.id(), cu.role(), projectId, true, "…")`
      (dùng ở `save_project_contract`, SystemController:308-309)
```

**Hệ quả đã xác minh**: tồn tại nhóm action **khai module RỖNG** + **⛔ không** bị `requireRequireAdmin` ⇒ **403 với mọi tài khoản không phải `admin`/`Ban lãnh đạo`** kèm thông điệp gây hiểu nhầm *«Thao tác chưa được khai báo quyền trong hệ thống»*.

---

## 2. BẢNG QUYẾT ĐỊNH (user chốt cột "ĐỀ XUẤT" — sửa 1 dòng/action ở `ActionRbacRegistry.java`)

### 2.1 Nhóm NGHIỆP VỤ (đề xuất **MỞ** cho người có module — ảnh hưởng go-live)
| Action | Dòng registry | **Đề xuất** | Capability | Hệ quả sau khi sửa | Ai chạy |
|---|---|---|---|---|---|
| `save_material_category` | `:216` | `material_catalog` | `canEdit` | Phòng Kế hoạch bảo trì được danh mục vật tư | L · M |
| `save_material_subcategory` | `:219` | `material_catalog` | `canEdit` | nt | L · M |
| `set_material_category_status` | `:271` | `material_catalog` | `canEdit` | Ẩn/hiện nhóm vật tư | L · M |
| `set_material_subcategory_status` | `:274` | `material_catalog` | `canEdit` | nt | L · M |
| `delete_material_category` | `:129` | `material_catalog` | `canEdit` | ⚠️ hành động phá huỷ — cân nhắc `canDelete` nếu có | L · M |
| `delete_material_subcategory` | `:131` | `material_catalog` | `canEdit` | nt | L · M |
| `import_material_catalog` | `:157` | `material_catalog` | `canCreate` | Nhập Excel danh mục vật tư | L · M |
| `set_project_team_status` | `:283` | `site_command` | `canEdit` | Ngừng/hoạt động tổ đội | L · M |
| `delete_project_team` | `:137` | `site_command` | `canEdit` | ⚠️ phá huỷ | L · M |
| `save_approval_stage` | `:189` | `approvals` | `canUse` | Cấu hình 5 bậc duyệt (**GĐ A2**) | L · M |
| `set_approval_stage_status` | `:263` | `approvals` | `canUse` | nt | L · M |
| `delete_approval_stage` | `:109` | `approvals` | `canUse` | nt | L · M |

### 2.2 Nhóm CẤU HÌNH (đề xuất **GIỮ admin-only** — nhưng phải khai cho đúng, ⛔ thay vì để rỗng)
| Action | Dòng | **Đề xuất** | Lý do |
|---|---|---|---|
| `bulk_import_projects` | `:75` | `List.of("admin")` | Nhập Excel hàng loạt = thao tác quản trị (đúng gợi ý `CHECKLIST` §8) |
| `bulk_import_users` | `:76` | `List.of("admin")` | nt |
| `save_email_settings` | `:201` | `List.of("admin")` | Cấu hình SMTP (**GĐ A4**) — admin |
| `retry_email` | `:182` | `List.of("admin")` | nt |
| `save_ui_display_settings` | `:260` | `List.of("admin")` | Tùy chỉnh giao diện toàn hệ |
| `save_trust_development_settings` | `:259` | `List.of("admin")` | Cấu hình tin cậy |

> ⚠️ **Lưu ý kỹ thuật quan trọng**: khai `List.of("admin")` **vẫn là rỗng** ⇒ vẫn **403** cho non-admin. Nếu muốn "chỉ admin" một cách **tường minh và không gây hiểu nhầm**, cổng đúng là **`requireRequireAdmin` ở controller** (như đang có) — còn **registry rỗng thì nên TRÁNH** vì sinh thông điệp sai bản chất.
> ⇒ **Hai lựa chọn cho nhóm 2.2**: **(a)** giữ `requireRequireAdmin` + **xoá entry rỗng khỏi registry** (thì registry rỗng không còn bị chạm vì `requireRequireAdmin` chạy sau?) ⚠️ **KHÔNG ĐƯỢC** — `requireActionModule` chạy **TRƯỚC** switch nên vẫn ném 403 sai thông điệp ⇒ **(b) ĐÚNG: thêm các action này vào `PUBLIC_ACTIONS`?** ⛔ **KHÔNG** (sẽ bỏ gác hoàn toàn).
> ⇒ ✅ **CÁCH ĐÚNG DUY NHẤT**: thêm **một allowlist admin tường minh** trong `RbacService` (ví dụ `ADMIN_ONLY_ACTIONS`) ⇒ khi action nằm trong đó: **yêu cầu `role == "admin"` và ném thông điệp ĐÚNG** («Tài khoản không có quyền thực hiện nghiệp vụ này») — ⛔ không rơi vào nhánh `required.isEmpty()`. **Đây là 1 thay đổi nhỏ ở `RbacService` + điền danh sách** (an toàn, fail-closed).

---

## 3. THAY ĐỔI CỤ THỂ (khi user chốt)

| # | Tệp | Thay đổi | Loại |
|---|---|---|---|
| 1 | `java-backend/application/.../rbac/ActionRbacRegistry.java` | Điền module cho **12 action nghiệp vụ** (§2.1) — mỗi dòng 1 sửa `List.of()` → `List.of("…")` | 1 dòng/action |
| 2 | `java-backend/application/.../rbac/RbacService.java` | Thêm `ADMIN_ONLY_ACTIONS` (Set) + nhánh kiểm **ngay sau** `PUBLIC_ACTIONS`: nếu thuộc đó ⇒ `isAdmin` else **403 thông điệp đúng** | ~8 dòng |
| 3 | `ActionRbacRegistry.java` | **Giữ nguyên** entry rỗng cho nhóm §2.2 **hoặc** xoá — vì nhánh mới ở `RbacService` đã xử lý trước; **khuyến nghị**: xoá khỏi map module để hết "rỗng" gây hiểu nhầm, và khai trong `ADMIN_ONLY_ACTIONS` | |
| 4 | ⛔ **KHÔNG ĐỔI** | `SystemController.java` (**⛔ tránh đụng tầng ②** nếu ⛔ không cần — theo tiền lệ `update_user` MỐC 109: bỏ hard-code, để cổng ở tầng ①) · ⛔ không đổi use case · ⛔ **không migration** (không đụng DB) | |

**Mẫu sửa 1 dòng (nhóm 2.1)**:
```diff
- Map.entry("save_material_category", List.of()),
+ Map.entry("save_material_category", List.of("material_catalog")),
```

**Mẫu thêm nhánh (nhóm 2.2)** trong `RbacService.requireActionModule`:
```java
if (PUBLIC_ACTIONS.contains(action)) return;
+ if (ADMIN_ONLY_ACTIONS.contains(action)) {
+     if (!"admin".equals(user.role()))
+         throw new ApiError("Tài khoản không có quyền thực hiện nghiệp vụ này.", 403);
+     return;
+ }
List<String> required = ActionRbacRegistry.modulesFor(action);
```

---

## 4. TEST BẮT BUỘC (⛔ không được bỏ — Goal §24/§25 + bài học MỐC 110 §7)

### 4.1 Cổng tĩnh (⛔ chạy được **ngay cả khi** UI/DB không sẵn — khuyến nghị làm TRƯỚC)
`tests/golive-rbac-orphans.test.mjs` (**mới**), 4 ca:
1. **Quét `ActionRbacRegistry.java`**: mọi `List.of()` còn lại **phải nằm trong** allowlist đã biết (`save_error_report` đã ở `PUBLIC_ACTIONS` + 10 public) ⇒ ⛔ **không còn action "rỗng mà không giải thích"**.
2. **Đối chứng âm**: cố tình thêm 1 entry rỗng giả ⇒ cổng **PHẢI đỏ** (chứng minh cổng thật sự bắt).
3. **`ADMIN_ONLY_ACTIONS` ⊂ registry** và **∩ `PUBLIC_ACTIONS` = ∅** (⛔ không vừa công khai vừa admin-only).
4. **Không hồi quy**: 12 action nghiệp vụ **không** được nằm trong `ADMIN_ONLY_ACTIONS`.

### 4.2 Cổng API thật (khi shell + dịch vụ sống)
| # | Phép thử | Kỳ vọng |
|---|---|---|
| 1 | user **M** (đủ `material_catalog`+`canEdit`) gọi `save_material_category` | **200** |
| 2 | user **M** (⚠️ **thiếu** quyền đó) gọi `save_material_category` | **403** «Tài khoản chưa được … cấp đúng quyền…» |
| 3 | user **M** gọi `bulk_import_projects` | **403** «Tài khoản không có quyền thực hiện nghiệp vụ này.» (**thông điệp ĐÚNG**, ⛔ không còn «chưa được khai báo quyền») |
| 4 | `admin` gọi cả 2 action trên | **200** |
| 5 | Không đăng nhập | **401** |

### 4.3 Hồi quy
`npx tsc --noEmit` · `npm run test:regression` (mốc `865 · 864 · 0 · 1`) · `ActionRbacRegistryPoTest` + `RbacSupplierMaterialTest` (Java) · sau khi sửa `java-backend/**` ⇒ **build lại JAR + restart `:18081`** theo runbook.

---

## 5. ⛔ NHỮNG ĐIỀU **KHÔNG ĐƯỢC LÀM** (bài học đã trả giá)

1. ⛔ **KHÔNG** mở quyền theo hướng "cho qua khi rỗng" — đó chính là lỗ hổng PHASE 0B đã bịt.
2. ⛔ **KHÔNG** thêm action vào `PUBLIC_ACTIONS` để "hết 403" (bỏ gác hoàn toàn = hở).
3. ⛔ **KHÔNG** sửa mã sản phẩm cho vừa **chuỗi** mà cổng/probe đang khớp (bài học `SESSION_C`).
4. ⛔ **KHÔNG** đụng `SystemController` nếu ⛔ không cần (giữ 1 tầng cổng duy nhất — tiền lệ `update_user`).
5. ⛔ **KHÔNG** commit/push (luật user) · ⛔ **KHÔNG** tạo migration (việc này thuần mã Java).

---

## 6. THỨ TỰ THI HÀNH & ĐIỀU KIỆN SẴN SÀNG

```text
① USER chốt bảng §2  (12 action mở + danh sách admin-only)
② S01 sửa ActionRbacRegistry (+ RbacService nếu chọn nhánh ADMIN_ONLY)
③ Viết cổng tĩnh tests/golive-rbac-orphans.test.mjs   ← chạy được ngay, ⛔ không cần UI/DB
④ typecheck + test:regression + build JAR + restart :18081 (theo runbook)
⑤ Chạy 5 phép thử API §4.2 bằng tài khoản THẬT (M / admin / không đăng nhập)
⑥ Cập nhật docs/41 (ma trận) + SESSION_A log + Telegram
```

**Definition of Done**: `0` action "rỗng không giải thích" · 5/5 phép thử API đạt · hồi quy xanh · **ma trận `docs/41` cập nhật** · có **đối chứng âm** cho mọi thay đổi mở quyền.

## 7. ROLLBACK
`git diff` chỉ 1–2 tệp Java ⇒ hoàn nguyên bằng `git checkout -- <2 tệp>` (⚠️ **chỉ tệp của mình**, luật §38) + build lại JAR bản lùi (86,8 MB) theo runbook `docs/29`.

---

## 8. GHI CHÚ PHỐI HỢP (multi-session)
- Tệp đích `java-backend/**` = **LOCK ERP-SESSION-01** ⇒ phiên này (S04) ⛔ **không tự sửa**; đã có `HANDOFF-20261008-D01`.
- `docs/41` §1–§5 nay đã **soi đủ 4 dải** (xem cập nhật) ⇒ ⛔ không còn dòng "⏳ chưa soi thân".
- Sau khi vá: ⭐ **tiền lệ `update_user` (MỐC 109)** là khuôn mẫu đã được kiểm chứng trong repo — dùng lại, ⛔ không phát minh cách mới (§17 REUSE).
