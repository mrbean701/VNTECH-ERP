# MA TRẬN PHÂN QUYỀN WORK **ĐỘNG** — HỒ SƠ ĐẦY ĐỦ (08/10/2026 · `ERP-SESSION-04` / `SESSION_D`)

> **Yêu cầu gốc của user (nguyên văn):** «Trong ma trận hiện tại thì lại chia ra 2 phòng ban, trong khi
> công ty có rất nhiều phòng ban, nên **không được hardcode mà phải thiết kế động**.»
> **User chốt:** **PHƯƠNG ÁN A** = 1 khoá «Công việc» dùng chung + phạm vi xem/giao tính ĐỘNG theo
> phòng ban + cấp bậc. **User cho phép:** «Cho phép thay đổi database nếu cần».

---

## 1. SỐ ĐO TRƯỚC KHI SỬA (⛔ không suy diễn — đo từ CSDL MySQL thật + API `bootstrap` :9000)

| Phép đo | Kết quả ĐO ĐƯỢC | Nguồn |
|---|---|---|
| `organization_units` (đơn vị thật) | **11** — BGD · DA · HCPC · BCH · E2E-BCH-01 · E2E-DIAG-BCH · KH · NS · TCKT · VNTECH · VNTECH-01 | `probe-ma-tran-dong.mjs` |
| Nhóm quyền WORK cũ | **4 khoá / 2 phòng** (`dept_plan_*`=Kế hoạch · `dept_project_*`=Dự án) | `lib/menu-helpers.ts:34-59` |
| Nhân sự theo đơn vị | BCH **44** · DA 15 · KH 5 · BGD 4 · TCKT 2 · HCPC 1 · NS 1 · 1 không đơn vị = **73** | `probe-ma-tran-dong.mjs` |
| `users.system_level_code` | **62/73 = NULL** ⚠️ ⇒ ⛔ KHÔNG thể thay bằng luật «theo cấp bậc» thuần (trưởng phòng KH có rank NULL sẽ **MẤT quyền**) | `do-luong-csdl-pham-vi.mjs` |
| Chức danh quản lý phòng (`%_truong`) | **3 tài khoản**: `e2e.kh` · `trinhtrench` (kh_truong/KH) · `trdademo` (da_truong/DA) | `do-luong-csdl-pham-vi.mjs` |
| `role_catalog.base_role` của `thuky`/`hr` | **`director`** ⚠️ ⇒ `isCompanyLeadership` trả `true` cho họ (5 tài khoản) | `do-luong-csdl-pham-vi.mjs` |
| `work_items.department_code` thật | `DA`=17 · `CN`=10 — trong đó **`CN` = «Cá nhân»** theo thiết kế (`OpsTaskManagementUseCase.java:303`), ⛔ KHÔNG phải mã phòng | `do-luong-csdl-pham-vi.mjs` |
| `can_approve` của 4 khoá WORK cũ | **=0** ở BCH·DA·HCPC·KH·TCKT; =1 ở BGD (1 khoá) · VNTECH · VNTECH-01 ⚠️ | MySQL `department_module_permissions` |

**Kết luận chẩn đoán:** dữ liệu **đã ĐỘNG từ lâu** (`department_code` chứa cả mã `CN` lẫn `DA`), còn mã
nguồn thì **CỨNG**: `workItemWhere` ghi literal `'KH'`/`'kh_truong'`/`'DA'`/`'da_truong'`/`'BCH'`;
ma trận chỉ có khoá mang **tên 2 phòng ban**. ⇒ Nhân sự TCKT/HCPC/NS ⛔ không có khoá nào để cấp quyền
CÔNG VIỆC; trưởng phòng của họ ⛔ không có nhánh xem việc của nhân viên mình.

---

## 2. THAY ĐỔI ĐÃ LÀM

### 2.1. Khoá quyền `work` (mới — dùng chung MỌI phòng ban)
| Tầng | Tệp | Thay đổi |
|---|---|---|
| Node | `scripts/system-route.mjs` | `MODULE_KEYS` += `"work"` (:14) · 8 action nhóm WORK += `"work"` (:23, :26) · cổng chặn dữ liệu việc += `"work"` (:833) |
| Java | `ActionRbacRegistry.java` | 8 action nhóm WORK += `"work"` (sửa TAY — xem `BUG-D17`) |
| FE | `lib/ui-shared.tsx` | `ModuleKey` += `"work"` + icon «tasks» + tông «green» |
| FE | `lib/menu-helpers.ts` | dòng ma trận `{ key:"work", label:"Công việc (mọi phòng ban)" }` · `work_hub.permissionKeys` += `"work"` · `legacyWorkMenuKeys` += `"work"` (ẩn khỏi CÂY MENU, giữ trong MA TRẬN) |
| FE | `app/page.tsx` | `titles.work` (bắt buộc theo `Record<ModuleKey,…>`) |
| DB | `db/migration/V40__work_module_dynamic.sql` | `module_catalog` += 1 dòng · `department_module_permissions` += 8 đơn vị (kế thừa `MAX()` năng lực hiện có) · `user_module_permissions` += 3 tài khoản quản lý phòng |

### 2.2. Phạm vi xem việc — ĐỘNG (bỏ hardcode phòng ban)
Luật mới (CẢ 2 đường, soi gương nhau):

1. `admin` **HOẶC** lãnh đạo công ty (`director·tgd·giam_doc·ptgd·pho_giam_doc` ở `role` **hoặc** `roleBase`)
   ⇒ **TOÀN BỘ** việc — đúng yêu cầu «việc của tất cả các nhân viên thì **giám đốc và admin** có thể xem».
2. Còn lại ⇒ việc **CỦA MÌNH** (mọi trường hợp — giữ `BUG-D15`: việc `CN` «Cá nhân» vẫn hiện cho người tạo)
   **HOẶC** việc **CÙNG MÃ PHÒNG** khi **MỘT TRONG BA** điều kiện đúng:
   · đơn vị mình là `site_command` (Ban chỉ huy — giữ nguyên quyền cũ theo phạm vi dự án), **HOẶC**
   · chức danh mình là quản lý phòng (`LIKE '%_truong'` — hành vi cũ, giữ để ⛔ không ai mất quyền), **HOẶC**
   · ⭐ **được ADMIN CẤP `canApprove` trên khoá `work`** (quyết định user 08/10: «**Admin sẽ quyết định ai là
     trưởng phòng**») — đọc từ `user_module_permissions` ⇒ ⭐ **quyết định của admin ở ma trận là NGUỒN SỰ THẬT**.
     ⚠️ Vế này là **BẮT BUỘC**: thiếu nó thì admin tick «Duyệt» chỉ mở được **nút Duyệt** mà người đó
     ⛔ **vẫn không XEM được** việc của nhân viên trong phòng mình — tức quyết định của admin **vô hiệu một nửa**.

⭐ Mã phòng tra **ĐỘNG**: `users.organization_unit_id → organization_units.code`
(⛔ không còn literal `'KH'`/`'DA'`/`'BCH'`) ⇒ chạy đúng cho **cả 11 đơn vị**. Thiếu đơn vị ⇒ `COALESCE(…,'')`
= rỗng ⇒ không khớp ⇒ **chỉ việc của mình** (⛔ không nới quyền oan).

| Tầng | Vị trí |
|---|---|
| Node | `scripts/system-route.mjs:805-806` + hàm `workScopeAll(user)` ở **cuối tệp** (hoist ⇒ 0 dòng dịch) |
| Java | `BootstrapDataAdapter.java` — `boolean workAll` + `workItemWhere` + `isWorkCompanyScope(...)` ở cuối lớp |

⚠️ **CỐ Ý ⛔ KHÔNG dùng `isCompanyLeadership`** cho phạm vi việc: ĐO ĐƯỢC `thuky` (3) + `hr` (2) có
`base_role='director'` ⇒ dùng hàm đó là **mở oan toàn bộ việc của 73 nhân sự** (gồm việc Cá nhân) cho thư ký/HR.

⚠️ **CỐ Ý dùng `LIKE '%_truong'`** (⛔ không `'%\_truong'`) trong **mệnh đề ứng dụng**: SQLite ⛔ không hiểu
`\` là ký tự thoát ⇒ phải giữ dạng chạy được ở **CẢ HAI engine**.

⚠️ **CỐ Ý ⛔ KHÔNG chuyển sang luật «cấp bậc ≥30»**: ĐO ĐƯỢC **62/73 tài khoản có `system_level_code=NULL`**
⇒ tài khoản `kh_truong` (rank NULL) sẽ **MẤT quyền** xem việc phòng mình (hồi quy). Luật cấp bậc thuộc
`WorkScopeService` (đã có sẵn cho payload/giao việc) — việc hợp nhất 2 luật là **hạng mục riêng**.

---

## 3. LỖI TỰ PHÁT HIỆN & TỰ VÁ TRONG CHÍNH ĐỢT NÀY

### `BUG-D17` — BỘ SINH REGISTRY XOÁ MẤT 34 MỤC GHI TAY (⛔ hồi quy NẶNG, đã vá)
- **Nguyên nhân:** tôi chạy `java-backend/tools/generate-rbac-registry.mjs` (tưởng registry «thuần sinh tự động»).
  Thực tế registry = **sinh tự động + 34 mục GHI TAY** (Java-only + các bản vá có tài liệu).
- **Hậu quả ĐO ĐƯỢC:** `git diff` cho thấy **27 dòng bị xoá**; `tests/warehouse-modal-contract.test.mjs` ĐỎ
  («`save_warehouse` thiếu ở bảng MODULES»); và nếu phát hành thì `approve_po` quay lại **403 cho mọi user
  không phải admin/C-level** — đúng lỗi **TASK-135** đã vá, cùng `approve_stock_issue`·`create_issue_grn`·
  `create_transfer_grn` (TASK-132/133) và `create_project_team` (MT2-P14-03c).
- **Cách vá:** khôi phục tệp về **đúng HEAD** bằng `git cat-file blob` (⛔ KHÔNG dùng `git checkout/reset`),
  rồi áp lại thay đổi bằng script có **kiểm tra khớp đúng 1 lần** (`probes/fix-registry-work.mjs`).
  Kết quả: `git diff --numstat` = **12 thêm / 7 sửa** (đúng chủ đích), 34 mục ghi tay **nguyên vẹn**.
- **Chốt chặn tận gốc:** `generate-rbac-registry.mjs` nay **TỰ PHÁT HIỆN** mục ghi tay và **DỪNG**
  (exit 1, ⛔ không ghi tệp) trừ khi chạy kèm cờ `--allow-drop-handwritten`. ĐÃ THỬ: từ chối đúng, tệp
  không đổi (so hash trước/sau).
- **Bài học:** ⛔ **KHÔNG chạy bộ sinh trên tệp có sửa tay mà chưa kiểm `git diff` trước/sau.**

### `BUG-D18` — TÁCH ACTION DUYỆT (`Q2-b`) LÀM QUẢN LÝ PHÒNG **MẤT QUYỀN DUYỆT** (đã vá bằng dữ liệu)
- Trước: nút «Duyệt» đi qua `update_work_item_status` (**`canEdit`**) ⇒ `kh_truong`/`da_truong` (có
  `edit=1` trên cặp khoá của phòng mình) **duyệt được**.
- Sau khi tách: đi qua `approve_work_item` (**`canApprove`**) — mà ĐO CSDL: **`can_approve=0`** ở
  BCH·DA·HCPC·KH·TCKT ⇒ quản lý phòng bị **403** (chỉ admin/lãnh đạo đi qua nhánh miễn kiểm).
- **Vá:** `V40` §3 cấp `can_approve=1` trên khoá `work` cho **ĐÚNG 3 tài khoản `%_truong`** (⛔ không cấp
  ở tầng phòng ban — cấp ở tầng phòng ban là **mọi nhân viên trong phòng đều duyệt được**, SAI).
- 📌 **CÒN TREO:** TCKT·HCPC·NS·BCH ⛔ chưa có chức danh `%_truong` ⇒ **chưa biết ai là trưởng phòng**
  ở các đơn vị đó ⇒ ⛔ KHÔNG tự đoán. Cần user quyết (xem §6).

### Rủi ro đã CHẶN (⛔ không để lại hậu quả)
- `V40` §2 bản nháp chèn `work` cho **cả 11 đơn vị** — trong đó **3 đơn vị chưa từng có dòng quyền nào**
  (E2E-BCH-01 · E2E-DIAG-BCH · NS). Chèn dòng toàn-0 khiến đơn vị bị coi là **«ĐÃ cấu hình quyền»** ⇒
  `assertDepartmentAllowsPermissions` bắt đầu áp ràng buộc ⇒ có thể **CHẶN cấp quyền** module khác.
  ⇒ Đã thêm `HAVING (tổng 5 cờ > 0)` + dọn 3 dòng đã lỡ chèn (`481 → 489 = 481 + 8`).

---

## 4. BẰNG CHỨNG XÁC MINH

| Hạng mục | Kết quả |
|---|---|
| `node --check scripts/system-route.mjs` | **0** · tệp 3429 → 3452 dòng (chỉ dài thêm ở **cuối**) · dòng `:14 :23 :26 :37 :38 :805 :806 :833` **GIỮ NGUYÊN vị trí** ⇒ cổng `F-03` ⛔ không dịch |
| `javac` (BootstrapDataAdapter + ActionRbacRegistry) | **0** |
| `npm run typecheck` | **0 lỗi** |
| `tests/t13-work-progress-cell.test.mjs` | **15/15** (thêm 1 test mới khoá luật ĐỘNG; cập nhật 2 khẳng định hợp đồng cũ) |
| `tests/t07-kanban-board.test.mjs` | **8/8** |
| `tests/warehouse-modal-contract.test.mjs` | **6/6** (sau khi vá `BUG-D17`) |
| `tools/probe-catalog-drift.mjs` | ⛔ **KHÔNG trôi dạt** |
| `tools/probe-action-parity.mjs` | Catalog **KHỚP HOÀN TOÀN** nguồn JS · Java thiếu đúng **2** action đã biết (`add_work_item_comment`·`set_work_item_participant`) |
| CSDL MySQL sau `V40` | `module_catalog` 76→**77** · `department_module_permissions` 481→**489** (8 đơn vị) · `user_module_permissions` 2772→**2775** (3 tài khoản) |
| **Chạy lại `V40` lần 2** | Số dòng **KHÔNG ĐỔI** ⇒ **IDEMPOTENT** ✅ |
| App ĐANG CHẠY (:9000) | `moduleCatalog` = **77**, có `work` (`label='Công việc (mọi phòng ban)'`, `groupKey='my_work'`, `sortOrder=9`) · 8 đơn vị được cấp · 3 tài khoản quản lý có dòng |

### Sửa cổng kiểm `tools/probe-action-parity.mjs` (điểm mù phát hiện trong đợt này)
Regex cũ `/case\s+"([a-z0-9_]+)"\s*(?:->|:)/` chỉ bắt nhãn **ĐẦU TIÊN** của một nhóm `case` ⇒ nhãn **ghép**
(`case "a", "b" ->`) bị bỏ ⇒ cổng báo **THIẾU OAN** (`update_work_item_status` bị báo thiếu dù đã có nhánh).
Nay bắt **cả nhóm nhãn**; sau khi sửa, con số khớp thực tế: **CHỈ CÓ Ở JS = 2** (đúng 2 action đang chờ port).

---

## 5. VIỆC CÒN LẠI (⛔ chưa làm — có lý do)

1. **⛔ CHƯA ẩn 4 dòng khoá cũ khỏi MA TRẬN.** User nêu đúng vấn đề «chia 2 phòng ban», và tôi ĐÃ đo được
   rằng ẩn khỏi phần VẼ **⛔ không làm mất quyền** khi bấm Lưu (state + payload dùng HỢP
   `moduleCatalog ∪ entries`, giá trị lấy từ dòng đang có). **NHƯNG** có **rủi ro THẬT**: hai nút hàng loạt
   `setAll`/`setColumnAll` (`PermissionAccessPanel.tsx:211-231`) lặp trên **TOÀN BỘ tập khoá** ⇒ bấm
   «Bỏ chọn tất cả» hoặc bỏ tick **đầu cột** sẽ **ghi 0 ÂM THẦM** cho 4 khoá đã ẩn, mà cảnh báo
   «đang thay đổi ≥20 quyền» khó bắt được. ⇒ Muốn ẩn **phải** sửa kèm 2 nút hàng loạt. **Chờ user quyết (§6).**
2. **⛔ CHƯA thêm mã drizzle `0353`** cho chuỗi SQLite: cổng `verify-full-release` buộc `MIGRATION_HEAD`
   trong `VNTECH_PACKAGE_ID.txt` phải trỏ đúng tệp mới ⇒ đổi fingerprint gói = **việc của bước BUILD**
   (⛔ không tự đổi giữa golive). Đường Node vẫn chạy được vì `MODULE_KEYS` (JS) **đã có** `work`
   ⇒ validate qua, chỉ thiếu nhãn/thứ tự (rơi về nhãn trong mã).
3. **⛔ CHƯA port 2 action Java còn thiếu**: `add_work_item_comment` · `set_work_item_participant`
   (đúng 2 action mà `probe-action-parity` báo thiếu; mã dán sẵn ở `docs/57 §4.4`).
4. **⛔ CHƯA nghiệm thu được phạm vi ĐỘNG trên app ĐANG CHẠY**: máy chủ Java hiện chạy mã **CŨ** (chưa build)
   ⇒ phần đổi `BootstrapDataAdapter` chỉ xác minh bằng **biên dịch + test + đối chiếu mã**, ⛔ chưa bằng live.
   Việc này thuộc **bước BUILD** (user đã chốt «đợi session 1 làm xong thì build»).

---

## 6. CẦN USER QUYẾT

| # | Câu hỏi | Vì sao cần |
|---|---|---|
| 1 | **Ẩn 4 dòng khoá cũ khỏi ma trận** hay giữ? (nếu ẩn: tôi sửa kèm 2 nút hàng loạt để ⛔ không ghi 0 âm thầm) | Chính là yêu cầu «đừng chia 2 phòng ban»; nhưng 4 khoá đó vẫn là **cổng THẬT của tầng UI** (tab `WorkCenter`, tiêu đề màn, tìm kiếm) |
| 2 | ~~**Ai là «trưởng phòng» của TCKT · HCPC · NS · BCH** (để cấp `canApprove` trên khoá `work`)?~~ | ✅ **USER ĐÃ CHỐT 08/10/2026: «Admin sẽ quyết định ai là trưởng phòng»** ⇒ ⛔ **phiên 04 KHÔNG tự gán ai**; cơ chế đã sẵn: **admin tick cột «Duyệt»** ở dòng «Công việc (mọi phòng ban)» trong ma trận ⇒ người đó **vừa duyệt được vừa XEM được** việc của nhân viên phòng mình (vế ② của luật phạm vi, đọc từ `user_module_permissions`) |
| 3 | Có cần **hợp nhất** luật cấp bậc (`WorkScopeService`: ≥30 phòng · ≥35 công ty) vào phạm vi xem việc không? | 62/73 tài khoản thiếu `system_level_code` ⇒ hợp nhất cần **gán cấp bậc cho 62 tài khoản** trước (thay đổi dữ liệu lớn) |
