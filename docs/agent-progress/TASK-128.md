# TASK-128 — CHẨN ĐOÁN + SỬA LỖI CHẶN ĐƯỜNG luồng duyệt mua hàng (bước 5)

- **Ngày**: 2026-09-21 · **Nhánh**: `unity-p2-full-20260920`
- **Commit**: `90b52f6` (bước 1) · `1abeddf` (bước 2)
- **Kết luận ngắn**: **KHÔNG có lỗi mã Java** chặn luồng. Lỗi chặn đường nằm ở **kỳ vọng của
  probe** dựa trên **dữ liệu ẢNH CHỤP CŨ** (`workflow_step_approvers`). Người duyệt THẬT của
  bước 5 là `giamdoc.demo` — đã đo được **HTTP 200** và hồ sơ chốt bình thường.

---

## 1. Câu 400 nằm ở đâu · điều kiện kiểm là gì

**Nơi sinh câu thông báo (Java)**

- `java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java:605-606`
  trong `decideApproval(...)`:

```java
if (!canApproveRequestStage(principal.userId(), requestId, stage))
    throw Api("Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.");
```

- Vị từ quyết định: `canApproveRequestStage(...)` — **cùng tệp, dòng 736-770**:

```java
Map<String, Object> req = store.findRequestForApproval(requestId).orElse(Map.of());
java.util.Set<String> pool = new java.util.LinkedHashSet<>(
        store.stageApproverUserIds(sv(req, "projectId"), stage));   // workflow_step_approvers
String owner = sv(stageRow, "ownerUserId");                          // approvals.approver_user_id
if (!owner.isEmpty()) pool.add(owner);

String role = sv(stageRow, "allowedRoleCodes");
java.util.Set<String> allowed = new java.util.HashSet<>(java.util.Arrays.asList(role.split(",")));
allowed.removeIf(String::isBlank);

Map<String, Object> userRole = store.findUserRoleInfo(userId).orElse(Map.of());
String userRoleCode = sv(userRole, "role");
String baseRole = sv(userRole, "baseRole");
boolean roleEligible = "admin".equals(userRoleCode)
        || allowed.contains(userRoleCode) || allowed.contains(baseRole);

if (pool.contains(userId)) return allowed.isEmpty() || roleEligible;   // (1) chỉ định ĐÍCH DANH
return !allowed.isEmpty() && roleEligible;                            // (2) ĐÚNG VAI TRÒ
```

- Bản tham chiếu JS (cùng câu chữ): `scripts/system-route.mjs:550-555` + `:1182-1183`
  — JS **CHẶT HƠN** Java: đòi `approvals.approver_user_id === user.id` **và** vai trò hợp lệ.
- Nguồn dữ liệu của `stageRow` / `pool`:
  - `RequestStoreAdapter.java:313-321` — `findApprovalRow` (đọc `approvals` + `approval_stage_catalog`).
  - `RequestStoreAdapter.java:183-192` — `stageApproverUserIds` (đọc `workflow_step_approvers`
    → `workflow_steps` → `workflow_definitions`, **không** gắn với phiếu nào, chỉ lọc theo `step_no`).

## 2. VÌ SAO `trdademo` trượt ở bước 5 — NGUYÊN NHÂN GỐC

Đo trực tiếp trên MySQL `vntech_erp` cho phiếu của lượt probe (`MR_f4636c1c…`, phiếu 0136):

| stage | `approvals.approver_user_id` | `allowed_role_codes_snapshot` | department |
|---|---|---|---|
| 2 | `USR_8011a197…` **thukydemo** (thuky) | `thuky,thu_ky_tgd` | Thư ký Tổng giám đốc |
| 3 | `USR_76575c08…` **nvdademo** (da_nv) | `project,da_nv` | Phòng Dự án |
| 4 | `USR_8869ca60…` **nvkhdemo** (kh_nv) | `procurement,kh_nv` | Phòng Kế hoạch |
| **5** | **`USR_p2_giamdoc_demo` · `giamdoc.demo` (director)** | **`director,tgd,giam_doc`** | **Giám đốc** |

và `approval_project_assignments` của `PRJ-DEMO-01`: bước 5 → **`USR_p2_giamdoc_demo`**.

⇒ `trdademo` (`da_truong` · base_role `project`) **KHÔNG phải Owner được phân công** của bước 5
của phiếu này, và vai trò của anh ta **không nằm trong** `allowed_role_codes` ⇒ 400 là **ĐÚNG**.

**Vì sao tưởng là `trdademo`?** Vì `workflow_step_approvers` (WF-MUAHANG bước 5) **vẫn còn**
`trdademo`. Bảng đó là **ẢNH CHỤP** do migration `V8__workflow_multi.sql:87-93` seed
ngày **18/09/2026** từ `approval_project_assignments`; đến **20/09/2026** `TASK-106` đã
`UPDATE approval_project_assignments SET owner_user_id='USR_p2_giamdoc_demo' WHERE stage=5`
(cấu hình §6: bước 5 = «Giám đốc») nhưng **không cập nhật** ảnh chụp đó.

**Phép đo quyết định (chứng minh Java KHÔNG phải thủ phạm)** — đăng nhập đúng Owner bước 5:

```
login giamdoc.demo (GiamDoc@2026): 200 true
decide_approval request=MR_f4636c1c-85db-4b32-bf03-9592c17ed591 stage=5 as=giamdoc.demo
  -> HTTP 200 {"ok":true,"message":"Đã hoàn tất luồng phê duyệt; hồ sơ tự chuyển sang Mua hàng & PO
     và bắt đầu tính thời gian lập PO."}
```

⇒ Luồng **không hề kẹt** ở tầng mã; nó chỉ kẹt với **tài khoản sai**. Bảng `workflow_steps` của
WF-MUAHANG (`allowed_role_codes` **không tồn tại** — đã kiểm `SHOW COLUMNS`) không tham gia vào
chuỗi duyệt phiếu; chuỗi duyệt phiếu lấy từ `approval_stage_catalog` + `approval_project_assignments`
(`RequestManagementUseCase.java:221-275`).

### 2.1 Vì sao bước 1 cũng 400 (kỳ vọng probe cũng sai)
`approval_stage_catalog` `ASTAGE-1` đang **`active=0`** ⇒ phiếu **không có** dòng `approvals` bước 1,
sinh ra đã ở bước 2. Nên `2.1 [cha.ht]` 400 là **đúng**, không phải lỗi cần sửa.

## 3. ĐÃ SỬA GÌ (chỉ tệp probe — được phép theo ràng buộc “kỳ vọng của probe sai”)

`tools/probe-purchasing-flow.mjs`

| Dòng (sau khi sửa) | Trước → Sau |
|---|---|
| `:9-20` | bước 5 gán cho `trdademo`/`trinhtrench` → **`giamdoc.demo` (Owner thật)**; 2 tài khoản cũ thành ĐỐI CHỨNG ÂM, kèm chú thích ảnh chụp `V8` 18/09 vs `TASK-106` 20/09 |
| `:24-26` | mới: `RUN_TAG` (nhãn duy nhất mỗi lượt chạy) |
| `:76-93` | `step(n, who, what, r)` → `step(n, who, what, r, opts)` có **`expectFail`**: 400 ĐÚNG kỳ vọng được tính **ĐẠT** (trước đây mọi 400 đều bị đếm là HỎNG ⇒ báo động giả) |
| `:104` | `ACTORS` + `giamdoc.demo` (admin `update_user` đặt mật khẩu demo cho tài khoản này) |
| `:186-244` | khối duyệt: chuỗi dương bước 2→3→4; **đối chứng âm** `2.1✗` (cha.ht), `2.5✗` (trinhtrench), `2.5✗` (trdademo); **`2.5c` = `giamdoc.demo` chốt bước 5**; `2.5d` đối chứng âm sau khi chốt |
| `:268-282` | chọn PO: `poNo` lớn nhất (chọn nhầm PO seed `…-9308` của phiếu khác) → **lọc theo `requestId` của chính phiếu** |
| `:290-300` | `deliveryNoteNo: "GN-TEST-0001"` / `lotNo: "LOT-TEST-01"` (hằng số, lượt 2 bị 409) → **`GN-TEST-${RUN_TAG}` / `LOT-TEST-${RUN_TAG}`** |

**KHÔNG sửa**: mã Java · dữ liệu MySQL (không `UPDATE`/`INSERT`) · `AGENTS.md` · `docs/28_*` · TASK-094…127.

## 4. CHỨNG MINH ĐỎ → XANH (`node tools/probe-purchasing-flow.mjs --apply`)

| | TRƯỚC (HEAD `57dfe56`) | SAU (`1abeddf`) |
|---|---|---|
| Tổng | **24/29 bước ĐẠT** | **33/36 bước ĐẠT** |
| Bước 2/3/4 | ✅ | ✅ |
| `2.1` cha.ht | ❌ 400 (đếm là HỎNG) | ✅ (đối chứng âm, 400 ĐÚNG) |
| `2.5` trinhtrench | ❌ 400 | ✅ (đối chứng âm, 400 ĐÚNG) |
| `2.5b` **trdademo** | ❌ **400 “Bạn không phải Owner…”** ← điểm chặn | ✅ `2.5c` **`giamdoc.demo` → 200 “Đã hoàn tất luồng phê duyệt”** |
| Phiếu cuối | `pending_approval` · bước 5 (kẹt) | **`approved`** · bước 5 · `awaiting_po` |
| Lập PO | ❌ 3a **và** 3b 400 “Chỉ được tạo PO từ MR đã duyệt đủ các cấp” | ✅ **3a `nvkhdemo` → PO-PRJ-DEMO-01-2026-0014** |
| Nhập kho | ⛔ không có PO ⇒ không test được | ✅ **4b → GRN-PRJ-DEMO-01-2026-0013** |

⇒ **Hết kẹt bước 5 · có PO · có GRN (NHẬP KHO).** Chuỗi đã chạy tới bước nhận hàng.

### 4.1 Ba phép đo còn ❌ — KHÔNG phải lỗi chặn đường của bước 5

1. **`4a` `tkhodemo` receive_goods → 403** “Tài khoản không có quyền thao tác kho nhận hàng này”
   (`PurchaseManagementUseCase.java:300-302` → `accessScope.requireWarehouseAccess`).
   Nguyên nhân **DỮ LIỆU**: `warehouses.keeper_user_id` của `KHO-PRJ-DEMO-01` = **admin**
   (`USR_2f435847…`) và `user_warehouse_scopes` **KHÔNG có dòng nào** cho `tkhodemo`
   (`tkhodemo` chỉ có `user_project_scopes` = `write` trên PRJ-DEMO-01 ⇒ qua được phép dự án, trượt phép kho).
   ⇒ **SQL cần captain quyết** (KHÔNG tự chạy):
   ```sql
   -- (a) gán thủ kho thật cho kho công trường của dự án demo
   UPDATE warehouses SET keeper_user_id='USR_8984cf69-c2d7-4162-bb4f-03ab51427e1e'   -- tkhodemo
     WHERE id='WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d';
   -- (b) hoặc cấp phạm vi kho cho tài khoản thủ kho (kiểm schema trước khi chạy)
   -- INSERT INTO user_warehouse_scopes (…user_id='USR_8984cf69-…', warehouse_id='WH_51e0f009-…', …);
   ```
2. **`5a`/`5b` confirm_delivery → 400** “Phải tải ít nhất một ảnh giao hàng thực tế trước khi BCH xác nhận.”
   Đây là **luật nghiệp vụ THẬT** (bắt buộc có ảnh giao hàng) — chỉ mới chạm tới được vì nay đã có GRN.
   Không phải lỗi; cần ảnh thật hoặc nới luật theo quyết định của người dùng.
3. **Trôi số PO (dữ liệu)**: lượt chạy đầu sau khi hết kẹt trả
   `409 Số PO "PO-PRJ-DEMO-01-2026-0011" đã tồn tại` (3a), trong khi
   `document_sequences` (`PO:PRJ_fdbfab20-…:2026`) `last_number=10`
   và `SELECT COUNT(*) FROM purchase_orders WHERE po_no='PO-PRJ-DEMO-01-2026-0011'` = **1**.
   `nextSequence` (`PurchaseStoreAdapter.java:104-115`) đúng; **bộ đếm bị lệch sau khi dữ liệu
   được khôi phục/seed lại**. ⇒ SQL cần captain quyết (KHÔNG tự chạy):
   ```sql
   UPDATE document_sequences SET last_number=(SELECT MAX(CAST(RIGHT(po_no,4) AS UNSIGNED))
       FROM purchase_orders WHERE po_no LIKE 'PO-PRJ-DEMO-01-2026-%')
     WHERE id='PO:PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3:2026';
   ```
   Lượt sau 3a đã tự qua (bộ đếm đã tiến), nhưng rủi ro 409 vẫn còn ở các dự án khác.

### 4.2 Ảnh chụp `workflow_step_approvers` đã cũ — captain quyết
Hiện màn “Workflow phê duyệt” (WF-MUAHANG-01 bước 5) hiển thị **`trdademo` (all_of)** trong khi
chuỗi duyệt đang chạy của dự án là **`giamdoc.demo` (single · director,tgd,giam_doc)**.
Đồng bộ là việc **DỮ LIỆU** — đề xuất (KHÔNG tự chạy):
```sql
-- Xoá người duyệt CŨ không còn trong phân công của dự án (chỉ bảng ảnh chụp workflow_*)
-- DELETE FROM workflow_step_approvers WHERE step_id='WFS_507c1908-f412-41ad-876f-9a7637fd0ce1'
--   AND user_id='USR_c51d95b2-8f98-4f01-9daa-0b64d0037b7d';
-- INSERT INTO workflow_step_approvers (id,step_id,user_id,active,created_at,updated_at)
--   VALUES ('WFSA-T128-5','WFS_507c1908-f412-41ad-876f-9a7637fd0ce1',
--           'USR_p2_giamdoc_demo',1,NOW(3),NOW(3));
-- UPDATE workflow_steps SET approval_mode='single', name='Giám đốc', updated_at=NOW(3)
--   WHERE id='WFS_507c1908-f412-41ad-876f-9a7637fd0ce1';
```
⚠️ **Chưa làm ở đợt này** vì (a) là thay đổi DỮ LIỆU ngoài quyền của tôi, (b) đổi `name`/`approval_mode`
của bước 5 sẽ chạm nhánh `all_of` ở `RequestManagementUseCase.java:690-708`
(`store.stageApprovalMode`) — cần người dùng xác nhận trước.

## 5. Cổng kiểm

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **exit 0** (0 lỗi) ✔ |
| `npm run test:regression` | **69/69 pass · 0 fail** ✔ |
| `npm run test:workflow` | **ĐẠT** ✔ (`Workflow VNTECH ERP V5.3.0 FULL W2 passed: …`) |
| Java `mvn -B -pl web -am test` | **KHÔNG chạy** — đợt này **không sửa dòng Java nào** (`git show --stat`: chỉ 1 tệp `.mjs`) |

## 6. BLOCKED / UNKNOWN

- **BLOCKED (cần người dùng quyết)**: `4a` (thủ kho — dữ liệu kho/phạm vi kho) và `5a/5b`
  (bắt buộc ảnh giao hàng thật) — cả hai **ngoài** nguyên nhân bước 5, cần SQL/ảnh thật.
- **UNKNOWN**: còn 6 phiếu `pending_approval` ở bước 5 (0133/0135/0136/0139/0142/0145…) từ các lượt
  probe cũ — cần Owner bước 5 (`giamdoc.demo`) chốt hoặc hủy; **không tự chạy**.
- **KHÔNG sửa dữ liệu** trong đợt này: đúng ràng buộc của nhiệm vụ.
