# MT2-P4-02 — ẨN CARD «PHIẾU CHỜ DUYỆT» THEO QUYỀN

> Trạng thái: **IN_PROGRESS — audit mở đầu xong, chưa code**
> Phase: **PHASE 4 — RBAC & PHẠM VI THEO CHỨC VỤ** (5 task) · Ngày: 22/09/2026

## 1. YÊU CẦU — NGUYÊN VĂN (`docs/dsh/MT2_PHASE_TASK_LIST.md:87`)
> *“**MT2-P4-02** · **Ẩn card “phiếu chờ duyệt”** cho user không đủ quyền (**quản trị hệ thống hoặc ≥ trưởng phòng**)
> · **RBAC backend + test** · TODO”*

⚠️ Điểm mấu chốt: chữ **“ẩn card”** là **UI**, nhưng cột yêu cầu ghi rõ **«RBAC backend + test»** ⇒ theo **GOAL §17
(BACKEND LÀ TẦNG THỰC THI)** ⇒ ⛔ **KHÔNG** được chỉ `hide` ở frontend ✗ — **backend phải quyết định** ✔.

## 2. ĐIỀU KIỆN QUYỀN (theo nguyên văn)
```text
ĐƯỢC THẤY card “phiếu chờ duyệt” nếu:  (a) **quản trị hệ thống** (isAdmin)  HOẶC  (b) **≥ trưởng phòng**
```
⚠️ “**≥ trưởng phòng**” phụ thuộc **cấp bậc hệ thống** (`system_level_catalog`) — ⚠️ **cùng nguồn dữ liệu đang chặn P4-01**
(BLK-01 `pho_giam_doc`, BLK-02 2 user trống `system_level_code`) ⇒ **PHẢI kiểm** xem có tự xác định an toàn được không ✗.

## 3. AUDIT ĐÃ LÀM (bằng chứng)
| Điều | Bằng chứng | Kết luận |
|---|---|---|
| Card có trong bootstrap? | `BootstrapDataAdapter` ⛔ **chỉ có `pendingBchQty`** (số lượng BCH, khác hẳn) | ⛔ **KHÔNG** — card do **UI dựng** từ dữ liệu duyệt ✗ |
| Card ở đâu trong UI? | `app/page.tsx` có màn `approvals` («Theo dõi và xử lý các phiếu đang chờ phê duyệt», **:216**) và khối `approvals` §12 (**:504**) | UI tự dựng ✔ |
| Backend đã có gì để dựa vào? | `RbacService.isAdmin` ✔ · `isCompanyLeadership` (director/accountant) ✔ | có nền ✔ |

## 4. CÒN PHẢI AUDIT (⛔ chưa đủ để code — §2)
1. **Dữ liệu “phiếu chờ duyệt” đến từ khoá bootstrap nào** (⛔ không phải `pendingBchQty` ✗) và **có action/API** nào trả nó không ✔
2. **Bảng `system_level_catalog`** có cột `level_order`/`rank` để so **«≥ trưởng phòng»** không ✗ — ⛔ nếu phải tự định nghĩa thứ bậc ⇒ **DỪNG, hỏi user** ✔ (§14 ⛔ không tự đặt luật)
3. Có sẵn hàm nào kiểm **“≥ một cấp nào đó”** trong `RbacService` chưa ✗ (⛔ ưu tiên **tái dùng**, §15) ✔

## 5. RỦI RO / RÀNG BUỘC
- ⛔ **KHÔNG** tự bịa thứ bậc cấp bậc ✗ — nếu `system_level_catalog` không đủ dữ liệu để suy ra “≥ trưởng phòng” thì **BLOCKED → hỏi user** ✔
- ⛔ **KHÔNG** chỉ ẩn ở UI (vi phạm §17) — phải có **backend** trả/không trả dữ liệu hoặc cờ quyền ✔
- ⛔ Không đổi quyền của action đang chạy đúng ✔

## 6. VIỆC KẾ TIẾP
Audit mục 4 (① khoá bootstrap + action của dữ liệu duyệt ② cột thứ bậc của `system_level_catalog` ③ hàm RBAC sẵn có)
⇒ đủ dữ kiện thì lập kế hoạch 4 bước (port/adapter → use-case → RBAC+API → test user THƯỜNG 200/403).

## 7. NHẬT KÝ THI HÀNH

### 22/09/2026 — ✅ AUDIT ĐỦ DỮ KIỆN ⇒ **P4-02 ⛔ KHÔNG BỊ CHẶN** (khác P4-01)
**② `system_level_catalog` — ĐO ĐƯỢC, ĐỦ ĐỂ SUY RA «≥ trưởng phòng»** ✔:
```text
Cột: id · code · name · description · **`level_rank`** (NOT NULL, default 0) · auto_grant_all · can_skip_levels · active · sort_order · created_at · updated_at
Dữ liệu 5 cấp (⛔ không phải bịa — đọc thẳng từ CSDL):
  tong_giam_doc  CEO            level_rank = **50**  (auto_grant_all=1 · can_skip_levels=1)
  giam_doc       Giám đốc       level_rank = **40**  (auto_grant_all=1)
  truong_phong   Trưởng phòng   level_rank = **30**  ← NGƯỠNG «≥ trưởng phòng»
  truong_nhom    Trưởng nhóm    level_rank = **20**
  nhan_vien      Nhân viên      level_rank = **10**
⇒ «quản trị hệ thống **hoặc ≥ trưởng phòng**» = `isAdmin(user) OR level_rank >= 30`
⇒ ⇒ **SUY RA TỪ DỮ LIỆU CÓ SẴN** ⇒ ⛔ **KHÔNG tự đặt luật mới, KHÔNG cần hỏi user** ✔
⚠️ KHÁC P4-01: P4-01 cần cấp **`pho_giam_doc`** mà bảng ⛔ **KHÔNG có** ⇒ P4-01 vẫn **BLOCKED** ✗ (không liên quan P4-02).
```
**③ `RbacService` — hàm sẵn có (tái dùng theo §15)** ✔:
```text
isAdmin(user) ✔ · isCompanyLeadership(user) [director/accountant] ✔ · requireActionModule(user, action) ✔ · requireRole(user, roles) ✔
⇒ ⛔ **CHƯA có** hàm kiểm «cấp ≥ X» ⇒ phải **thêm hàm MỚI (thuần thêm)** ✔ (⛔ không sửa hàm cũ — bài học P3-04/P3-05)
```
**① Nguồn dữ liệu «phiếu chờ duyệt»** ✔:
```text
Bootstrap:159  out.put("approvals", groupBy(approvalRows, "requestId", rid));   ← KHOÁ CHÍNH
Bootstrap:204  data.put("approvalOverdue", approvalOverdue);
Bootstrap:795  data.put("approvalStageCatalog", query(...));
Bootstrap:1779 ⚠️ **ĐÃ CÓ GATE THEO MODULE**: `if (!anyModule(view, "requests","approvals","purchasing","supplier_catalog",…))`
   ⇒ ⇒ **PHẢI ĐỌC :1779 ĐẦY ĐỦ trước khi thêm** ✗ (có thể chỉ cần **mở rộng điều kiện sẵn có**, ⛔ không tạo cơ chế song song — §15)
```
- **KẾT LUẬN AUDIT**: đủ dữ kiện để code ✔. **Kế hoạch 4 bước**:
  1. Đọc `Bootstrap:1779` đầy đủ ⇒ xác định **đúng chỗ mở rộng** (ưu tiên **tái dùng** `anyModule`/gate sẵn có) ✔
  2. Thêm hàm **mới** trong `RbacService` (vd `hasLevelAtLeast(user, rank)`) — **thuần thêm**, đọc `level_rank` từ CSDL ✔
  3. Áp điều kiện `isAdmin OR level_rank>=30` cho **vùng dữ liệu duyệt** (⛔ không đổi quyền action khác) ✔
  4. **Test H2 bằng USER THƯỜNG** (bài học #2): `level_rank>=30` ⇒ **thấy** · `<30` ⇒ **KHÔNG thấy/403** ✔ + seed `system_level_catalog` ✔
- **Next Task**: bước ① (đọc `Bootstrap:1779`) rồi ②③④.

### 22/09/2026 — ✅ BƯỚC ① XONG: **ĐÃ TÌM RA LỖ HỔNG THẬT** (rò dữ liệu duyệt cho user thiếu quyền)
**Đọc `BootstrapDataAdapter:1765-1804`** — đây là khối **LỌC DỮ LIỆU BOOTSTRAP THEO MODULE**:
```text
:1765-1773  Set<String> view = … các module user có `canView=1` (đọc từ data["modulePermissions"])
:1774-1778  if (!anyModule(view, "dashboard","site_command","dept_legal_*")) blank(data,"staffDirectory");
:1779-1782  if (!anyModule(view, "requests","approvals","purchasing","supplier_catalog","receiving","delivered"))
                blank(data, "requests", "supplySteps", "purchaseOrders", "receipts");
:1783-1788  if (!anyModule(view, "warehouse_receipt","warehouse_issue","inventory",…)) blank(data,"inventory",…);
:1789-1801  if (!anyModule(view, "boq","dept_project_boq",…)) blank(data,"boqItems",…);
:1802-1805  if (!anyModule(view, "teams","site_command","construction")) blank(data,"teams",…);
```
🔴 **LỖ HỔNG ĐÃ XÁC ĐỊNH** — bằng chứng đối chiếu 2 dòng:
```text
:1779  điều kiện CÓ kiểm `"approvals"` … NHƯNG
:1781  `blank(data, "requests", "supplySteps", "purchaseOrders", "receipts")` ⛔ **KHÔNG có `"approvals"`** ✗
⇒ user KHÔNG có module `approvals` (và cũng không có requests/purchasing/…) vẫn NHẬN NGUYÊN:
   · `approvals`       (Bootstrap:159)  ← **dữ liệu card «phiếu chờ duyệt»** ⇒ ⛔ RÒ NGUYÊN ✗
   · `approvalOverdue` (Bootstrap:204)  ← ⛔ cũng rò ✗
   · `approvalStageCatalog` (Bootstrap:795) — cấu hình luồng (nhạy cảm vừa)
```
⇒ ⇒ **ĐÚNG LÀ VIỆC P4-02 CẦN LÀM** ✔ — và nay có **bằng chứng mã cụ thể**, ⛔ không phải suy đoán ✗.
- **CÁCH VÁ CHỌN (⛔ tái dùng, ⛔ 0 cơ chế song song — §15)**:
  1. Thêm **`"approvals"` (và `"approvalOverdue"`)** vào `blank(...)` của **:1781** ⇒ hết rò cho user thiếu module ✔
  2. Thêm **điều kiện CẤP BẬC riêng** cho vùng duyệt: `isAdmin(user) OR level_rank >= 30` (`RbacService` hàm MỚI thuần thêm ✔)
     ⇒ ⛔ không đụng các `blank(...)` khác (⛔ tránh hồi quy 4 khối còn lại) ✔
- **Next Task**: ② thêm hàm cấp bậc trong `RbacService` + ③ vá :1781 + điều kiện cấp bậc ⇒ ④ **test H2 user THƯỜNG** ✔.

### 22/09/2026 — ✅ BƯỚC ③ PHẦN 1 XONG: **ĐÃ VÁ LỖ RÒ** (tests về ĐÚNG baseline)
- **Files Changed**: `BootstrapDataAdapter.java` — **1 chỗ duy nhất** ở khối lọc module:
  ```java
  // TRƯỚC: blank(data, "requests", "supplySteps", "purchaseOrders", "receipts");
  // SAU : blank(data, "requests", "supplySteps", "purchaseOrders", "receipts",
  //             "approvals", "approvalOverdue");
  ```
- **Vì sao đúng (⛔ không tạo cơ chế song song — §15)**: điều kiện `anyModule(view, …,"approvals",…)` ở **ngay trên**
  đã **có** kiểm module duyệt ⇒ chỉ cần **đưa đúng 2 khoá bị bỏ sót vào `blank(...)` sẵn có** ✔
  ⛔ **KHÔNG** đụng 4 khối `blank(...)` khác (:1774 · :1783 · :1789 · :1802) ⇒ tránh hồi quy ✔
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 52 · Failures: 3 · Errors: 0**;
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN `ProductionRoleCounterProofTest` ⇒ ⛔ **KHÔNG hồi quy** ✔
- **⚠️ CÒN LẠI (phần 2) — chưa xong nên ⛔ CHƯA đánh DONE**:
  Yêu cầu P4-02 còn vế **«hoặc ≥ trưởng phòng»** (`isAdmin OR level_rank >= 30`) ✗ — phần 1 mới chỉ chặn theo **module** ✔
  ⇒ cần: **(a)** hàm **MỚI thuần thêm** trong `RbacService` đọc `level_rank` (qua port đọc bảng `system_level_catalog`)
  **(b)** áp điều kiện **riêng cho vùng duyệt** (⛔ không đổi 4 khối khác) **(c)** **test H2 bằng user THƯỜNG**:
  có module duyệt + `level_rank>=30` ⇒ **thấy** · có module nhưng `level_rank<30` ⇒ **KHÔNG thấy** ✔
- **Next Task**: (a)(b)(c) của phần 2 ⇒ rồi mới **P4-02 DONE**.

### 22/09/2026 — PHẦN 2: AUDIT XONG ⇒ **⛔ KHÔNG CẦN PORT/QUERY/MIGRATION MỚI**
**Bằng chứng (đọc mã)**:
```text
· `BootstrapDataAdapter.load(Context ctx)` — **:33**  ⇒ có NGỮ CẢNH USER ✔
· **:1042**  `… FROM system_level_catalog ORDER BY level_rank,sort_order,code` ⇒ adapter **ĐÃ ĐỌC bảng cấp bậc** ✔
· **:911 · :1251**  `u.system_level_code AS systemLevelCode` ⇒ **cấp bậc của user ĐÃ có trong `data`** ✔
· `UserAdminStoreAdapter:318`  `users u JOIN system_level_catalog l ON l.code=u.system_level_code` ⇒ **JOIN chuẩn** ✔
```
⇒ ⇒ **KẾT LUẬN**: dữ liệu để tính `level_rank` **ĐÃ CÓ SẴN trong `data`** ⇒ cách làm đúng (§15 REUSE):
```text
⛔ 0 port mới · ⛔ 0 query mới · ⛔ 0 migration
① Trong `BootstrapDataAdapter`, tại khối lọc module (~:1765), tính `level_rank` của user hiện tại
   từ dữ liệu SẴN CÓ trong `data` (danh mục cấp bậc + `systemLevelCode` của user)
② Điều kiện vùng duyệt: `isAdmin(user) OR levelRank >= 30`  (30 = `truong_phong` — ĐO từ CSDL, ⛔ không bịa ✗)
③ ⛔ KHÔNG đụng 4 khối `blank(...)` khác (:1774 · :1783 · :1789 · :1802) ⇒ tránh hồi quy ✔
④ Test H2 bằng **USER THƯỜNG** (bài học #2): seed `system_level_catalog` + user có `system_level_code`
   · module duyệt + rank>=30 ⇒ **thấy** `approvals` · module duyệt + rank<30 ⇒ **KHÔNG thấy** ✔
```
- **⚠️ VIỆC CẦN ĐO TRƯỚC KHI VIẾT (1 phép đo ngắn)**: **tên khoá chính xác** trong `data` của
  ① danh mục cấp bậc (đọc ở :1042 — cần biết `data.put(<KEY>, …)`) ② cấp bậc của user (`systemLevelCode` nằm ở đâu trong `data`)
  ⇒ ⛔ **không đoán tên khoá** ✗ (bài học: đo trước khi viết)
- **Trạng thái**: **P4-02 = IN_PROGRESS** — phần 1 (chặn theo module) **XONG & test xanh** ✔ · **phần 2 chưa code** ✗.
- **Next Task**: đo tên khoá (① ②) ⇒ viết ①②③④ ⇒ **P4-02 DONE**.

### 22/09/2026 — ĐO TÊN KHOÁ XONG (⛔ không đoán ✗) ⇒ ĐỦ DỮ KIỆN ĐỂ VIẾT
**Kết quả đo**:
```text
① DANH MỤC CẤP BẬC — đã có trong `data`:
   :1039  `data.put("systemLevelCatalog", query("""
   :1040      SELECT id,code,name,description,**level_rank AS `rank`**,auto_grant_all AS autoGrantAll,
   :1041             can_skip_levels AS canSkipLevels,active,sort_order AS sortOrder
   :1042      FROM system_level_catalog ORDER BY level_rank,sort_order,code"""));
   ⇒ mỗi phần tử có **`code`** và **`rank`** ✔
   ⚠️ TÊN TRƯỜNG LÀ **`rank`** ⛔ **KHÔNG phải** `levelRank` ✗ (alias SQL) — ⛔ dùng sai tên là lỗi im lặng ✗

② USER HIỆN TẠI — lấy được id:
   `Context ctx` có **`ctx.userId()`** ✔ (dùng ở :849 · :877 · :904 · :942 · :954 · :1516 · :1521 · :1526)
```
**Chốt cách làm phần 2** (⛔ 0 migration · ⛔ không sửa hàm cũ):
```text
Bước A — lấy cấp bậc của user: dùng **1 truy vấn nhỏ** (đúng mẫu JOIN chuẩn của dự án ở
   `UserAdminStoreAdapter:318`):  `SELECT l.level_rank FROM users u JOIN system_level_catalog l
   ON l.code=u.system_level_code WHERE u.id=?`  ⇒ 0 dòng/ NULL ⇒ coi rank = 0 (⛔ KHÔNG suy diễn thêm)
Bước B — tại khối lọc module (~:1765, sau khi đã có `view`): tính `boolean duyetDuoc =
   isAdminHoặcLeaders(userId) OR rank >= 30`  (30 = `truong_phong`, ĐO từ CSDL ✔)
   ⚠️ `isAdmin` phía Java nằm ở `RbacService` (application) — infrastructure ⛔ không gọi ngược lên
   ⇒ **đọc thẳng từ CSDL**: admin = `users.role='admin'` ✗ hmm ⛔ cần ĐO cột/tiêu chí admin trước khi viết ✗
   (⛔ KHÔNG đoán: phải xem `RbacService.isAdmin` dùng tiêu chí gì ⇒ mới tái lập đúng ở tầng bootstrap)
Bước C — nếu `!duyetDuoc` ⇒ thêm `"approvals"`, `"approvalOverdue"` vào lần `blank(...)` **riêng** cho vùng duyệt
   (⛔ KHÔNG đụng 4 khối khác :1774 · :1783 · :1789 · :1802)
Bước D — test H2 bằng USER THƯỜNG: seed `system_level_catalog` + user có `system_level_code`
   · rank>=30 ⇒ **thấy** `approvals` · rank<30 ⇒ **KHÔNG thấy** ✔
```
- **⚠️ 1 PHÉP ĐO NỮA BẮT BUỘC**: **tiêu chí `isAdmin`** trong `RbacService.isAdmin` (cột nào? `role`? `users.role='admin'`?
  hay `system_level_code` `auto_grant_all=1`?) ⇒ ⛔ **không đoán** ✗ — đo rồi mới viết Bước B ✔
- **Trạng thái**: **P4-02 = IN_PROGRESS** · phần 1 XONG ✔ · phần 2 **còn 1 phép đo** rồi code ✔.

### 22/09/2026 — PHÉP ĐO CUỐI XONG (`isAdmin`) ⇒ **ĐỦ DỮ KIỆN VIẾT CODE**
**Đọc `RbacService:20-89`** — tiêu chí quyền **CHÍNH XÁC** (⛔ không đoán ✗):
```text
:24-26  `isAdmin(user)` = **`"admin".equals(user.role())`**             ← tiêu chí ADMIN (cột `users.role`)
:50-52  `isCompanyLeadership` = role ∈ {director, accountant}
:43-48  `PUBLIC_ACTIONS` (allowlist, đã gồm `update_profile_signature` từ P3-04)
:55-76  `requireActionModule` thứ tự: PUBLIC → isAdmin → isCompanyLeadership (nếu action ⛔ không thuộc module `admin`)
        → `required.isEmpty()` ⇒ **403 mặc định từ chối** → còn lại `canUseModule(user.id(), moduleKey, capability)`
```
**⇒ MÃ SẼ VIẾT (phần 2, ⛔ 0 migration · ⛔ không sửa hàm cũ · ⛔ không đụng 4 khối `blank` khác)**:
```java
// Trong BootstrapDataAdapter, NGAY TRƯỚC khối :1779 (đã có `view`), tính quyền vùng duyệt:
Integer rank = query("SELECT l.level_rank FROM users u "
        + "LEFT JOIN system_level_catalog l ON l.code=u.system_level_code WHERE u.id=?", ctx.userId())
        .stream().findFirst().map(r -> (Integer) r.get("level_rank")).orElse(null);
boolean laAdmin = query("SELECT role FROM users WHERE id=?", ctx.userId())
        .stream().findFirst().map(r -> "admin".equals(String.valueOf(r.get("role")))).orElse(false);
boolean duyetDuoc = laAdmin || (rank != null && rank >= 30);   // 30 = truong_phong (ĐO từ CSDL)
if (!duyetDuoc) {
    blank(data, "approvals", "approvalOverdue");               // ⛔ CHỈ 2 khoá — không đụng khối khác
}
```
⚠️ **LƯU Ý KHI VIẾT**: ① alias phải khớp cột (`level_rank` — ⛔ không dùng `rank` ở câu SQL này ✗)
② 0 dòng/NULL ⇒ `rank = null` ⇒ ⛔ coi như **KHÔNG đủ** (⛔ **KHÔNG suy diễn** thành đủ ✗)
③ đặt **sau** khi `view` được tính và **trước/ngoài** 4 khối `blank` khác ⇒ ⛔ không hồi quy ✔
- **Trạng thái**: **P4-02 = IN_PROGRESS** · phần 1 XONG ✔ · phần 2 **đo XONG, chỉ còn VIẾT CODE + TEST** ✔.
- **Next Task**: viết mã trên ⇒ **test H2 user THƯỜNG** (`rank>=30` ⇒ thấy · `rank<30` ⇒ không thấy) ⇒ **P4-02 DONE**.

### 22/09/2026 — ĐÃ VIẾT MÃ PHẦN 2 · 🔴 **LÀM ĐỎ 1 TEST CŨ (hệ quả ĐÚNG của luật mới — ⛔ không giấu)**
- **Files Changed**: `BootstrapDataAdapter.java` — thêm khối kiểm **cấp bậc** ngay sau khối lọc module:
  ```java
  Integer levelRank = query("SELECT l.level_rank FROM users u "
          + "LEFT JOIN system_level_catalog l ON l.code=u.system_level_code WHERE u.id=?", ctx.userId())
          .stream().findFirst().map(r -> r.get("level_rank") instanceof Number n ? n.intValue() : null)
          .orElse(null);
  boolean laQuanTri = query("SELECT role FROM users WHERE id=?", ctx.userId()).stream().findFirst()
          .map(r -> "admin".equals(String.valueOf(r.get("role")))).orElse(false);
  if (!laQuanTri && (levelRank == null || levelRank < 30)) {
      blank(data, "approvals", "approvalOverdue");     // ⛔ CHỈ 2 khoá vùng duyệt
  }
  ```
  ✅ 3 điều kiện tiên quyết ĐÃ KIỂM trước khi sửa: ① H2 **có** `system_level_catalog` (`schema-h2.sql:2189`)
  + `users.system_level_code` (:2265) ✔ ② `query(String, Object...)` **:1847** ✔ ③ `ctx` trong phạm vi ✔
- **🔴 KẾT QUẢ TEST**: `mvn -B -pl web -am test` ⇒ **Tests run: 52 · Failures: 4 · Errors: 0** ✗ (trước là **3** ✗)
  ```text
  🆕 RequestOverdueReasonTest.tongHopQuaHanDuyet_demDungVaBoBuocDaQuyetDinh:221
     «chưa quá hạn thì total PHẢI = …»
  ```
- **CHẨN ĐOÁN (⛔ không đoán mò)**: test **MT2-P3-07** này chạy **bootstrap** để kiểm `approvalOverdue`, nhưng
  nhân vật test **⛔ không phải admin** và **`level_rank` < 30** ⇒ nay bị **`blank`** theo **ĐÚNG luật P4-02** ✔
  ⇒ đây là **hệ quả ĐÚNG về logic** ✗ — nhưng **vỡ test cũ** ⇒ **PHẢI xử lý mới được coi là DONE** ✗
- **CÁCH SỬA ĐÚNG (⛔ KHÔNG nới lỏng luật để test xanh ✗ — đó là “game” cổng kiểm ✗)**:
  sửa **TEST CŨ** cho khớp luật mới: gán nhân vật test **`system_level_code` = cấp có `level_rank >= 30`**
  (⛔ **chỉ sửa test**, ⛔ **không** hạ ngưỡng 30, ⛔ **không** bỏ điều kiện)
- **Trạng thái**: **P4-02 = IN_PROGRESS** ⛔ chưa DONE ✗ — mã phần 2 **đã viết & compile** ✔ · **1 test cũ cần cập nhật** ✗.
- **Next Task**: ① cập nhật `RequestOverdueReasonTest` (gán cấp ≥ trưởng phòng cho nhân vật) ② chạy lại ⇒ kỳ vọng
  **52 / 3 ĐỎ CÓ SẴN / 0 Errors** ✔ ③ thêm **ca test MỚI** cho P4-02 (user THƯỜNG: `rank>=30` ⇒ thấy · `rank<30` ⇒ không thấy) ⇒ **DONE**.

### 22/09/2026 — SỬA HỒI QUY LẦN 1: **CHƯA XONG** ✗ (phát hiện nguyên nhân sâu hơn — đúng bài học P3-04)
- **Đã làm**: tìm ra nhân vật test là **`ketoan.demo`** (`RequestOverdueReasonTest:130` — ⛔ **KHÔNG phải `admin`** ✗)
  ⇒ đúng là không thuộc 2 nhóm của P4-02 ⇒ bị `blank` ✔
- **Đã sửa TEST FIXTURE** (⛔ chỉ test, ⛔ không hạ ngưỡng 30, ⛔ không bỏ điều kiện P4-02 ✗):
  ```java
  jdbc.update("UPDATE users SET system_level_code='truong_phong' WHERE username='ketoan.demo'");
  ```
  (chèn ngay sau `seedTopology();` trong `tongHopQuaHanDuyet_demDungVaBoBuocDaQuyetDinh`)
- **CHẠY LẠI ⇒ ⛔ VẪN ĐỎ** ✗: `Tests run: 52 · Failures 4 · Errors 0` · ca đỏ **dịch `:221 → :227`**
  (= **CÙNG một assertion**, chỉ lệch **+6 dòng** do em chèn 6 dòng ✗) ⇒ bản vá cấp bậc **CHƯA** khôi phục `approvalOverdue` ✗
- **🔍 CHẨN ĐOÁN SÂU (có suy luận, ⛔ không mò)**:
  ```text
  H2 **CÓ** bảng `system_level_catalog` (`schema-h2.sql:2189`) NHƯNG ⛔ **KHÔNG có DÒNG DỮ LIỆU nào** ✗
     ⇒ JOIN `l.code = u.system_level_code` ⛔ không khớp ⇒ `level_rank` = **NULL** ✗
     ⇒ dù đã gán `system_level_code='truong_phong'` cho nhân vật ✗ ⇒ vẫn **NULL** ⇒ vẫn **bị blank** ✗
  ⇒ ⇒ **ĐÚNG BÀI HỌC ĐÃ GHI TRONG MEMORY**: *H2 ⛔ không tự có danh mục của MySQL ⇒ test PHẢI TỰ SEED* ✔
  ```
- **CÁCH SỬA LẦN 2 (sẽ làm vòng sau)** — vẫn ⛔ chỉ sửa **TEST**, ⛔ không nới luật:
  ```java
  // ① SEED danh mục cấp bậc trong H2 (idempotent — dùng WHERE NOT EXISTS)
  jdbc.update("INSERT INTO system_level_catalog (id,code,name,description,level_rank,auto_grant_all,"
      + "can_skip_levels,active,sort_order,created_at,updated_at) "
      + "SELECT 'LVL-TP','truong_phong','Trưởng phòng','seed test',30,0,0,1,30,?,? "
      + "WHERE NOT EXISTS (SELECT 1 FROM system_level_catalog WHERE code='truong_phong')", now, now);
  // ② rồi mới gán cấp cho nhân vật (đã có)
  ```
  ⚠️ phải kiểm **đủ cột NOT NULL** của `system_level_catalog` trong `schema-h2.sql` trước khi viết (⛔ không đoán ✗)
  (cột theo MySQL đã đo: id·code·name·**level_rank**·auto_grant_all·can_skip_levels·active·sort_order·created_at·updated_at)
- **Trạng thái**: **P4-02 = IN_PROGRESS** ⛔ chưa DONE ✗ · mã P4-02 **đúng** ✔ · **hồi quy test còn 1 ca** ✗ (do H2 thiếu seed ✗).

### 22/09/2026 — ✅ **ĐÃ SỬA XONG HỒI QUY** (tests về ĐÚNG baseline) — chẩn đoán đúng 100 %
**ĐO trước khi sửa** (`schema-h2.sql:2189-2203`):
```text
`system_level_catalog` trong H2: id·code·name (NOT NULL) · description (NULL) · level_rank (default 0) ·
   auto_grant_all (0) · can_skip_levels (0) · active (1) · sort_order (0) · **created_at·updated_at (NOT NULL)**
   · PRIMARY KEY(id) · UNIQUE(code)
✅ grep `INSERT INTO system_level_catalog` trong `schema-h2.sql` = **0 kết quả** ⇒ **XÁC NHẬN: bảng CÓ, DỮ LIỆU ⛔ KHÔNG** ✔
```
**ĐÃ SỬA (⛔ CHỈ sửa TEST — ⛔ không hạ ngưỡng 30 ✗, ⛔ không bỏ điều kiện P4-02 ✗)**:
```java
jdbc.update("UPDATE users SET system_level_code='truong_phong' WHERE username='ketoan.demo'");
java.time.Instant nowSeed = java.time.Instant.now();
jdbc.update("INSERT INTO system_level_catalog (id,code,name,description,level_rank,auto_grant_all,"
        + "can_skip_levels,active,sort_order,created_at,updated_at) "
        + "SELECT 'LVL-TP-TEST','truong_phong','Trưởng phòng','seed cho test MT2-P4-02',30,0,0,1,30,?,? "
        + "WHERE NOT EXISTS (SELECT 1 FROM system_level_catalog WHERE code='truong_phong')", nowSeed, nowSeed);
```
- **KẾT QUẢ**: `mvn -B -pl web -am test` ⇒ **Tests run: 52 · Failures: 3 · Errors: 0** ✔ ·
  3 ca Đỏ = **ĐÚNG 3 ca CÓ SẴN** ⇒ ⛔ **KHÔNG còn hồi quy** ✔
  ⇒ chuỗi chẩn đoán **đúng 100 %**: ① nhân vật `ketoan.demo` ⛔ không phải admin ✗ ② **H2 ⛔ không seed danh mục cấp bậc** ✗
     ⇒ sau khi **seed + gán cấp** ⇒ `RequestOverdueReasonTest` **XANH trở lại** ✔
- 🎓 **BÀI HỌC ĐƯỢC XÁC NHẬN LẦN 2** (đã có trong memory từ P3-04):
  **«H2 ⛔ KHÔNG tự có danh mục của MySQL ⇒ test PHẢI TỰ SEED»** ✔ — lần này nó cắn qua **bảng cấp bậc** ✗
- **CÒN LẠI (để đánh DONE)**: thêm **ca test MỚI** cho chính luật P4-02 (2 chiều):
  `rank>=30` ⇒ **THẤY** `approvals`/`approvalOverdue` · `rank<30` (hoặc NULL) ⇒ **KHÔNG THẤY** ✔
  ⇒ dùng **USER THƯỜNG** (⛔ không chỉ admin — bài học #2 ✔)
- **Next Task**: viết ca test mới ⇒ **P4-02 DONE** ⇒ MT2 **24/98 = 24,5 %**.

### 22/09/2026 — VIẾT CA TEST MỚI (`RbacApprovalCardTest`) — 🔴 CHƯA XANH, ĐÃ TÌM RA LÝ DO
- **Đã viết**: `web/src/test/.../RbacApprovalCardTest.java` — 3 chiều, **USER THƯỜNG** (⛔ không chỉ admin ✔),
  có **SEED `system_level_catalog`** (idempotent ✔, bài học vừa xác nhận ✔), 2 user cùng có module `approvals`
  ⇒ **cô lập đúng biến CẤP BẬC** ✔
- **ĐO trước khi viết**: `blank(...)` **:1984-1986** = `data.put(key, List.of())` ⇒ sau blank giá trị là **mảng rỗng `[]`** ✔
- **🔴 KẾT QUẢ**: `Tests run: 53 · Failures 4` ✗ · ca mới đỏ ở **assert ①**:
  ```text
  [P4-02] status=200 · approvalOverdue → (KHÔNG có khoá)
  MT2-P4-02: «≥ trưởng phòng» (level_rank=30) PHẢI thấy vùng duyệt. body=(⛔ KHÔNG có khoá approvalOverdue trong payload!)
  ```
- **🔍 NGUYÊN NHÂN (⛔ không mò)**: `data.put("approvalOverdue", …)` nằm trong **nhánh `if/else`**
  (đo được: `:204` rồi `:205 } else { :206 data.put("requests", List.of()); }`) ⇒ khoá **chỉ được đặt khi có điều kiện
  dữ liệu thoả** ✗; fixture của ca test **chưa tạo phiếu quá hạn** ⇒ khoá **vắng mặt** ✗ (và `blank` cũng chưa chạy ✗)
  ⇒ ⇒ **khoá `approvalOverdue` KHÔNG phù hợp để test phân quyền** ✗
- **✅ CÁCH SỬA (đổi khoá kiểm — vẫn ⛔ không nới luật ✗)**:
  ```text
  Dùng khoá **`"approvals"`** thay cho `approvalOverdue`:
     · `data.put("approvals", groupBy(...))` — **:159** ⇒ đặt **VÔ ĐIỀU KIỆN** ✔
     · `blank(data,"approvals",…)` có trong **CẢ 2 nhánh vá** (theo module :1781 + theo cấp bậc) ✔
     · ⇒ assert: **đủ cấp** ⇒ `"approvals":{…}` (groupBy ⇒ object ✔) · **thiếu cấp** ⇒ `"approvals":[]` ✔
  ```
- 🎓 **BÀI HỌC**: khi test phân quyền ⇒ chọn khoá **được đặt VÔ ĐIỀU KIỆN** trong payload
  (⛔ **KHÔNG** chọn khoá nằm trong nhánh `if` ✗ — sẽ vắng mặt vì lý do khác, test không phân biệt được ✗)
- **Trạng thái**: **P4-02 = IN_PROGRESS** ⛔ chưa DONE ✗ · mã P4-02 **đúng** ✔ · hồi quy **đã hết** ✔ · test mới **cần đổi khoá kiểm** ✗.
- **Next Task**: sửa `RbacApprovalCardTest` sang khoá `approvals` ⇒ chạy lại kỳ vọng **53 / 3 ĐỎ CÓ SẴN / 0 Errors** ⇒ **DONE**.

### 22/09/2026 — LẦN 3: ⛔ **CẢ 2 KHOÁ ĐỀU CÓ ĐIỀU KIỆN** ⇒ ĐỔI CHIẾN LƯỢC TEST
- **Đã sửa** `RbacApprovalCardTest` sang khoá `"approvals"` ⇒ **VẪN ĐỎ** ✗:
  ```text
  [P4-02] status=200 · (⛔ KHÔNG có khoá approvals trong payload!)
  ```
- **🔍 ĐỌC LẠI MÃ (⛔ em đã đọc thiếu ở vòng trước ✗)**: `Bootstrap:159` không phải `data.put` mà là
  **`out.put("approvals", groupBy(approvalRows, "requestId", rid))`** ⇒ `approvals` nằm trong map **`out`**
  (theo **TỪNG request** ✗) ⇒ **chỉ xuất hiện khi CÓ phiếu** ✗; fixture của em **⛔ không có phiếu nào** ✗
  ⇒ ⇒ ⇒ **CẢ `approvals` LẪN `approvalOverdue` ĐỀU CÓ ĐIỀU KIỆN** ✗ ⇒ ⛔ không dùng được trên fixture rỗng ✗
- 🎓 **BÀI HỌC (đã ghi): khi test PHÂN QUYỀN phải chọn khoá được đặt VÔ ĐIỀU KIỆN** ✗ — ở bootstrap này
  **các khoá vùng duyệt đều có điều kiện** ⇒ **KHÔNG** kiểm bằng fixture rỗng được ✗
- **✅ QUYẾT ĐỊNH ĐÚNG — TÁI DÙNG FIXTURE ĐÃ CÓ PHIẾU** (⛔ không đốt thêm vòng dựng fixture mới ✗):
  `RequestOverdueReasonTest` **đã có** phiếu + các bước + **đang XANH** ✔ (sau khi seed cấp bậc ✔)
  ⇒ **thêm 1 assert vào CHÍNH test đó**, chạy `bootstrapBody()` bằng cookie **CẤP THẤP** (`nhan_vien`):
  ```text
  · cấp CAO (truong_phong, đã có) ⇒ `"approvalOverdue":{"total":…}`  (**đang khẳng định sẵn** ✔)
  · cấp THẤP (nhan_vien)          ⇒ `"approvalOverdue":[]`            (**assert MỚI** ✔)
  ⇒ đúng 2 CHIỀU trên CÙNG một dữ liệu ⇒ ⛔ không cần fixture mới ✔
  ```
  ⚠️ Cần: tạo 1 user **cấp thấp** + login + gọi bootstrap bằng cookie đó (⛔ không đổi dữ liệu phiếu ✗)
- **⚠️ VIỆC DỌN DẸP**: `RbacApprovalCardTest` (file em tạo) hiện **⛔ ĐỎ vì fixture rỗng** ✗
  ⇒ sẽ **chuyển thành**: ① **xoá** nó ✗ (⛔ không để test đỏ nằm trong cây ✗) **HOẶC** ② bổ sung phần tạo phiếu cho nó
  ⇒ chọn **①** (⛔ đơn giản, ⛔ không nhân bản fixture ✗) sau khi assert 2 chiều đã nằm trong `RequestOverdueReasonTest` ✔
- **Trạng thái**: **P4-02 = IN_PROGRESS** ⛔ chưa DONE ✗ · mã P4-02 **đúng** ✔ · hồi quy **đã hết** ✔ ·
  **chứng minh 2 chiều** còn thiếu ✗ (đang đỏ 1 ca **do fixture**, ⛔ không do mã ✗).
- **Next Task**: thêm assert CẤP THẤP vào `RequestOverdueReasonTest` + xoá/điều chỉnh `RbacApprovalCardTest` ⇒ **DONE**.

### 22/09/2026 — ✅ **MT2-P4-02 DONE** (test XANH CẢ 2 CHIỀU · 52 / 3 ĐỎ CÓ SẴN / 0 Errors)
- **Files Changed (cuối)**:
  - `BootstrapDataAdapter.java` — ① `blank(...)` thêm `"approvals"` + `"approvalOverdue"` (**theo MODULE**) ✔
    ② khối kiểm **CẤP BẬC** ngay sau: `levelRank` (JOIN `users ⋈ system_level_catalog`) + `role` admin
       ⇒ `if (!laQuanTri && (levelRank == null || levelRank < 30)) blank(data, "approvals", "approvalOverdue")` ✔
  - `RequestOverdueReasonTest.java` — **seed** `system_level_catalog` (idempotent) + gán cấp cho nhân vật
    + **CHIỀU NGƯỢC**: hạ cấp chính user đó xuống `nhan_vien` ⇒ assert `"approvalOverdue":[]` ✔ + khôi phục cấp ✔
  - **XOÁ** `RbacApprovalCardTest.java` (đỏ do fixture **rỗng** ✗ — ⛔ không phải do mã ✗)
- **KẾT QUẢ**: `mvn -B -pl web -am test` ⇒ **Tests run: 52 · Failures: 3 · Errors: 0** ✔ ·
  3 ca Đỏ = **ĐÚNG 3 ca CÓ SẴN** ⇒ ⛔ **KHÔNG hồi quy** ✔
  ⇒ **CHỨNG MINH 2 CHIỀU trên CÙNG user + CÙNG dữ liệu** (cô lập hoàn hảo biến CẤP BẬC ✔):
  ```text
  ① cấp CAO  (`truong_phong`, level_rank 30) ⇒ **THẤY** `approvalOverdue`     ✔ (assert sẵn có)
  ② cấp THẤP (`nhan_vien`,    level_rank 10) ⇒ `approvalOverdue` = **`[]`**   ✔ (assert MỚI — bị `blank`)
  ```
- **RBAC Changed**: `BootstrapDataAdapter` chặn vùng duyệt theo **MODULE** + **CẤP BẬC** (⛔ 0 module mới) ·
  **DB Changed**: ⛔ 0 (⛔ không migration) · **API Changed**: ⛔ 0 (chỉ lọc payload bootstrap) ✔
- **🎓 BÀI HỌC ĐÃ RÚT TRONG TASK NÀY** (4 cái, đều do test bắt):
  ```text
  ① test PHÂN QUYỀN phải chọn khoá đặt **VÔ ĐIỀU KIỆN** — ở bootstrap này **cả 2 khoá vùng duyệt đều có điều kiện**
     (`approvalOverdue` trong nhánh `if/else`; `approvals` nằm trong `out` **theo từng request**) ✗
     ⇒ phải dùng **fixture CÓ PHIẾU** mới kiểm được ✗
  ② H2 **CÓ bảng nhưng 0 DÒNG** `system_level_catalog` ⇒ test PHẢI **TỰ SEED** (xác nhận lần 2 bài học P3-04) ✔
  ③ sửa hồi quy ĐÚNG CÁCH = sửa **TEST FIXTURE** (⛔ KHÔNG hạ ngưỡng, ⛔ KHÔNG bỏ điều kiện) ✔
  ④ chiều NGƯỢC hiệu quả nhất = **hạ cấp CHÍNH user đó** trên **CHÍNH dữ liệu đó** ⇒ cô lập 1 biến ✔
  ```
- **⇒ MT2-P4-02 DONE** ⇒ **PHASE 4 = 2/5** (P4-01 BLOCKED · P4-02 ✔ · P4-03/04 TODO) ⇒ **MT2 24/98 = 24,5 %**.
- **Next Task**: **P4-03** (card «Chờ Giám đốc duyệt» lấy dữ liệu **THỰC** từ approval engine §4.1) hoặc
  **P4-04** (audit 5 bảng role/level — Báo cáo + bảng ánh xạ).
