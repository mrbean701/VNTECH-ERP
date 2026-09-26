# TASK-135 — SỬA LỖI RBAC CỦA 3 ACTION PO (`approve_po` · `reject_po` · `update_po_price`)

- **Ngày**: 21/09/2026 · **Nhánh**: `unity-p2-full-20260920`
- **Phạm vi**: RẤT HẸP — 1 tệp nguồn + 2 tệp test mới + hồ sơ này.
- **Trạng thái**: ĐÃ SỬA · test ĐỎ→XANH · **chờ captain package + restart `:18081`** để đo lại LIVE.

## 1. Lỗi đã ĐO (không đoán lại)

`ActionRbacRegistry.java` khai **MODULE RỖNG** cho 3 action PO ⇒ `RbacService.requireActionModule`
rơi vào nhánh «MẶC ĐỊNH TỪ CHỐI» (PHASE 0B) ⇒ **403 cho MỌI user không phải admin/C-level**, bất kể
họ có quyền ở module `purchasing` hay không.

Bằng chứng LIVE (jar 21/09 11:10, `tools/probe-wf-muahang-standard.mjs --apply`):

| Bước | User | Action | Kết quả |
|---|---|---|---|
| B6a | `nvkhdemo` | `create_po` | **200** ✔ (user CÓ quyền module `purchasing`) |
| B6b | `nvkhdemo` | `approve_po` | **403** «Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.» ✗ |

⇒ Hành vi trong Java đã có (`SystemController.java:1078/1083/1088`), chỉ **thiếu khai báo quyền**.

## 2. Đã đổi gì (tệp:dòng · trước → sau · lý do)

`java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java`

| Dòng (sau sửa) | Trước | Sau | Lý do chọn |
|---|---|---|---|
| `:26` | `Map.entry("approve_po", List.of())` | `List.of("purchasing")` | Tiền lệ ĐÚNG chuẩn cùng module: `create_po` (:61) · `close_po_line` (:55). ⛔ 0 khoá `module_catalog` mới. |
| `:124` | `Map.entry("reject_po", List.of())` | `List.of("purchasing")` | Từ chối PO là quyết định trên **cùng chứng từ PO** ⇒ cùng module với duyệt PO. |
| `:217` | `Map.entry("update_po_price", List.of())` | `List.of("purchasing")` | Sửa đơn giá của chính PO ⇒ module của nghiệp vụ PO. |
| `:235` | `Map.entry("approve_po", "canUse")` | `"canApprove"` | Duyệt = hành vi PHÊ DUYỆT; tiền lệ `close_po_line` (:250) = `canApprove`; mọi `approve_*` khác trong bản đồ đều `canApprove`. |
| `:326` | `Map.entry("reject_po", "canUse")` | `"canApprove"` | `decidePo()` dùng CHUNG một cổng cho duyệt và từ chối; tách quyền sẽ khiến người có quyền duyệt không thể từ chối (vô lý nghiệp vụ). |
| `:426` | `Map.entry("update_po_price", "canUse")` | `"canEdit"` | **Căn cứ (không đoán)**: JS `update_boq_contract_prices` khai `canEdit` (`scripts/system-route.mjs:34`) **và** handler JS cưỡng chế `canUseModule(user,"boq","canEdit")` với lỗi «Chưa được cấp quyền sửa BOQ/Hợp đồng.» (`:3064`); Java `update_boq_contract_prices` cũng = `canEdit`. Sửa GIÁ = quyền SỬA ở cả nguồn JS. |

**Hệ quả có chủ ý cần biết**: user chỉ có `purchasing.can_use=1` (không `can_edit`) sẽ bị **403 CẤP QUYỀN**
ở `update_po_price` — đúng quy ước «sửa ⇒ canEdit». Nếu đặc tả muốn rộng hơn (mọi user có `purchasing`),
chỉ cần đổi 1 dòng `:426` về `canUse`.

**Lệch JS↔Java (ghi chú bắt buộc)**: nguồn JS `scripts/system-route.mjs` **KHÔNG có** 3 action PO này trong
`ACTION_MODULE`/`ACTION_CAPABILITY` ⇒ JS cũng để module rỗng (JS cũng 403 oan), còn Java trước đây còn
`canUse` cho cả 3. Bản sửa này khiến **Java tốt hơn JS** ở 3 action PO ⇒ `java-backend/ACTION_CATALOG.json`
(sinh từ JS) **không được sửa** (⛔ ngoài phạm vi) và giờ **KHÔNG còn phản ánh đúng** registry Java ở 3 dòng
`approve_po`/`reject_po`/`update_po_price`. Việc đồng bộ JS là **task riêng** (nhánh JS đang được phiên khác dùng).

## 3. Test — ĐỎ trước / XANH sau

| Test | ĐỎ (trước sửa) | XANH (sau sửa) |
|---|---|---|
| `application/src/test/.../rbac/ActionRbacRegistryPoTest.java` (unit, fake store) | `Tests run: 7, Failures: 7` — `expected: <[purchasing]> but was: <[]>` · `expected: <canApprove> but was: <canUse>` · `ApiError: Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.` | `Tests run: 7, Failures: 0, Errors: 0` · BUILD SUCCESS |
| `web/src/test/.../controller/PoRbacActionsIntegrationTest.java` (H2 + MockMvc, đúng đường HTTP của probe) | `Tests run: 4, Failures: 4` — body `{"ok":false,"error":"Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên."}` | `Tests run: 4, Failures: 0, Errors: 0` · BUILD SUCCESS |

Nội dung chốt:
- **Dương**: `kh.po135` (vai trò `procurement` + `purchasing` có `can_approve=1`/`can_edit=1`) gọi
  `approve_po` · `reject_po` ⇒ **KHÔNG còn 403**, lỗi còn lại là **400 nghiệp vụ** «PO không tồn tại hoặc đã
  xử lý.»; `update_po_price` ⇒ **400** «PO không tồn tại.» (bằng chứng cổng quyền đã CHO QUA).
- **Đối chứng ÂM**: `none.po135` (cùng vai trò `procurement`, ⛔ không có quyền module nào) ⇒ **403 CẤP QUYỀN**
  «Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.» cho cả 3 action ⇒ **cổng quyền KHÔNG bị nới lỏng**.
- Đối chứng âm phụ (unit): chỉ có `purchasing.canUse` ⇒ vẫn 403 khi DUYỆT / SỬA GIÁ PO.

## 4. Cổng (số đo)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | **0 lỗi** (exit 0) |
| `npm run test:regression` | **69/69 PASS** (`tests 69 · pass 69 · fail 0`, exit 0) |
| `npm run test:workflow` | **ĐẠT** — «Workflow VNTECH ERP V5.3.0 FULL W2 passed: …» (exit 0) |
| `mvn -B -pl web -am test` (JDK 26.0.2.1, Maven 3.9.16, **1 lượt / shell mới**) | domain **19/19** · application **23/23** (gồm 7 test mới) · infrastructure **10/10** · web **40 test / 4 Failures + 2 Errors** |

Phân tích web 40 test (so baseline «34 test / 3 ĐỎ»):
- **34 baseline** + **4 test mới của TASK-135** (`PoRbacActionsIntegrationTest`, **4/4 PASS**)
  + **2 tệp test CHƯA COMMIT của phiên khác** (`StockIssueWorkflowSteps345Test`, `TmpScopeProbeTest`).
- ĐỎ CÓ SẴN (baseline, không do TASK-135): `ProductionRoleCounterProofTest` **3 đỏ** (`save_team_subcontract`).
- ĐỎ/ERROR KHÁC (cũng KHÔNG do TASK-135 — 0/3 action PO được các test này gọi, đã `grep` = 0 match):
  - `SupplyChainEndToEndIntegrationTest` (`:192` không có movement SMI) — do thay đổi hành vi **TASK-133**
    (`issue_stock` KHÔNG còn ghi `stock_movements`; chỉ ghi ở bước ③ `issue_stock_confirm`) đang có trong cây làm việc.
  - `StockIssueWorkflowSteps345Test` (409 khi `issue_stock_confirm`) — tệp **chưa commit** của TASK-133.
  - `TmpScopeProbeTest` — tệp **chưa commit** của phiên khác (đã được đổi tên thành `TmpStoreProbeTest` NGAY
    trong lúc lượt `mvn` này chạy ⇒ lỗi nạp ApplicationContext là hệ quả của việc đổi tên giữa lượt).
- ⚠️ Cây làm việc đang có sửa đổi **CHƯA COMMIT của phiên khác**
  (`java-backend/infrastructure/.../AccessScopeStoreAdapter.java`) ⇒ có thể ảnh hưởng các test chuỗi nói trên.

## 5. Cần captain làm (ngoài quyền của agent này)

1. **Package** jar mới + **restart dịch vụ `:18081`** (agent ⛔ KHÔNG được package/restart).
2. Chạy lại `node tools/probe-wf-muahang-standard.mjs --apply` ⇒ **kỳ vọng bước B6b `approve_po` từ ❌ 403 ⇒ ✅ 200**.
3. Nếu 3 action PO vẫn 403 cho user thật ⇒ đối chiếu `user_module_permissions` của user đó với module
   `purchasing`: cần `can_approve=1` (duyệt/từ chối) và `can_edit=1` (sửa đơn giá). Thiếu `can_edit` ⇒
   quyết định lại dòng `:426` (`canEdit` ↔ `canUse`).
4. Việc đồng bộ **JS** (`scripts/system-route.mjs` + `ACTION_CATALOG.json`) cho 3 action PO ⇒ **task riêng**.

## 6. Rủi ro còn lại

- `update_po_price` = `canEdit` có thể chặt hơn ý muốn nghiệp vụ nếu user mua hàng chỉ được cấp `can_use`
  (xem §2). Đổi lại 1 dòng nếu đặc tả chốt khác.
- `ACTION_CATALOG.json` (sinh từ JS) **không được cập nhật** ⇒ lệch với registry Java ở đúng 3 dòng PO.
- Chưa đo lại LIVE — phụ thuộc captain package/restart (§5).
