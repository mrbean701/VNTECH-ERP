# TASK-117 — `P-09`: 5 call site `requireRole` dùng mã vai trò CŨ + CA ĐỐI CHỨNG

- **Mục master task:** `P-09` *(PHASE 2 — Sửa 5 chỗ `requireRole` dùng mã vai trò cũ ở `ProductionManagementUseCase`)*.
- **HEAD lúc đo:** `f5c0aac` *(sau TASK-116)*.
- **Kết luận cuối:** **LIKELY** — *có* «từ chối oan» thật, nhưng **nhánh kích hoạt trong sản phẩm hẹp hơn** tiền đề
  `P09-FIX-PLAN.md` mô tả (chi tiết §3). Đã sửa 5 call site + khoá hành vi bằng **5 ca test**.
- **Mã TRƯỚC → SAU:** §2 · **Ca đối chứng ĐỎ → XANH:** §4 · **Cổng Java:** §5.

---

## 1. BẢNG MÃ VAI TRÒ THẬT — `SELECT code, base_role FROM role_catalog` (MySQL thật, CHỈ ĐỌC)

16 dòng · `base_role` **rỗng/`NULL` = 0 dòng** · `active=1` **16/16**:

| `code` (mã chức danh người dùng có) | `base_role` (mã ENGINE dùng để phân quyền) |
|---|---|
| `accountant` | `accountant` |
| `cht` · `commander` | `commander` |
| `director` · `thuky` | `director` |
| `engineer` · `ksda` | `engineer` |
| `kh_nv` · `kh_truong` · `procurement` | `procurement` |
| `da_nv` · `da_truong` · `project` | `project` |
| `team` | `team` |
| `thu_kho` · `warehouse` | `warehouse` |

**Phân bố người dùng THẬT** (`LEFT JOIN role_catalog rc ON rc.code=u.role`) — **11/11 người đều có
`COALESCE(rc.base_role, u.role)` khác rỗng**:

| `users.role` | `effectiveRole` | SL |
|---|---|---|
| `ksda` | `engineer` | 3 |
| `admin` · `da_nv` · `thuky` · `kh_nv` · `thu_kho` · `accountant` · `cht` · `kh_truong` · `da_truong` · `director` | lần lượt `admin`/`project`/`director`/`procurement`/`warehouse`/`accountant`/`commander`/`procurement`/`project`/`director` | 10 × 1 |

⇒ **KHÔNG ai có** `commander` hay `project` **trong cột `users.role`** *(đúng như `P09-FIX-PLAN.md` §2 nói)*,
nhưng **ai cũng có `roleBase`** ⇒ xem §3.

---

## 2. 5 CALL SITE — TRƯỚC → SAU (`ProductionManagementUseCase.java`)

Nguyên tắc: **nhận CẢ HAI** — giữ nguyên mã ENGINE (tương thích ngược khi `roleBase` có giá trị) và
**thêm** mã chức danh THẬT đúng `base_role` đã duyệt (`cht`→`commander`; `da_nv`/`da_truong`→`project`).
**KHÔNG** thêm `engineer`/`team`/`warehouse` vào bất kỳ danh sách nào.

| # | Action | Dòng (HEAD cũ) | TRƯỚC (mã cũ) | SAU |
|---|---|---|---|---|
| 1 | `save_team_subcontract` | `:217` | `admin, commander, project` | `admin, commander, cht, project, da_nv, da_truong` |
| 2 | `save_team_production` | `:239` | `admin, commander, project` | `admin, commander, cht, project, da_nv, da_truong` |
| 3 | `approve_team_production` | `:264` | `admin, commander, project` | `admin, commander, cht, project, da_nv, da_truong` |
| 4 | `save_team_payment` | `:283` | `admin, commander, accountant, project` | `admin, commander, cht, accountant, project, da_nv, da_truong` |
| 5 | `settle_team_subcontract` | `:309` | `admin, commander, accountant` | `admin, commander, cht, accountant` |

*Chỗ thứ 5 là `:309` (`settle_team_subcontract`) — `P09-FIX-PLAN.md` §1 ghi «(1 chỗ nữa — rà hết tệp khi sửa)»;
nay đã xác định chính xác.* Mỗi call site được thêm 1 chú thích `[P-09/TASK-117]` ghi nguồn mã
(`SELECT code, base_role FROM role_catalog`) để lần sau không bị đảo ngược âm thầm.

**KHÔNG sửa** `RbacService.requireRole` (đúng phạm vi `P-09`: đổi hàm dùng chung sẽ ảnh hưởng toàn hệ).

---

## 3. ĐÍNH CHÍNH TIỀN ĐỀ — «từ chối oan» CÓ THẬT nhưng HẸP HƠN mô tả

| Nhận định | Kết quả ĐO được |
|---|---|
| `P09-FIX-PLAN.md` §2: *«KHÔNG ai có `commander`/`project` ⇒ nếu `roleBase` trống … thì danh sách không khớp»* | **NỬA ĐÚNG.** Đúng phần «không ai có `commander`/`project` trong `users.role`», **SAI phần «`roleBase` trống»**: `AuthUseCase:215` + 3 adapter dùng `COALESCE(rc.base_role, users.role)` và `role_catalog.base_role` **có giá trị ở 16/16 dòng** ⇒ **trong sản phẩm hiện tại `roleBase` LUÔN khác rỗng** |
| `TASK-113` §128: *«`RbacService:80` nay kiểm cả `role()` và `roleBase()` ⇒ chưa có bằng chứng tái hiện»* | **ĐÚNG.** Với người dùng thật + dữ liệu thật, 5 call site **KHÔNG** từ chối oan — **đã chứng minh bằng H2** (CA 1 xanh trên mã CŨ) |
| Vậy còn lỗi thật không? | **CÒN.** Cổng chỉ so mã vai trò với 2 giá trị (`role`, `roleBase`). Khi **`roleBase` không cứu được** — `role_catalog` cấu hình sai cho một mã chức danh — thì mã chức danh thật (`cht`, `da_nv`, `da_truong`) **không có chỗ đứng nào** trong danh sách ⇒ **403 oan** (CA 3 + CA 4 đỏ trên mã cũ). Đồng thời hợp đồng của chính `Principal` (dòng 34-39) khai **`roleBase()` mặc định rơi về `role()`** cho «mọi tầng gọi chưa truyền giá trị này xuống» — đúng nhánh không được bảo vệ |

⇒ **CONFIRMED** việc: ① danh sách mã CŨ **không khớp** `role_catalog` thật (thiếu `cht`/`da_nv`/`da_truong`);
② có **nhánh `roleBase` không cứu được** và nhánh đó **dẫn tới 403 oan** (đo được, §4).
⇒ **LIKELY** (không CONFIRMED) việc: 5 call site gây từ chối oan **trên dữ liệu sản phẩm hiện tại** — đo trên
`role_catalog` thật cho kết quả **KHÔNG**; muốn CONFIRMED phải có dữ liệu `role_catalog` cấu hình sai trong
sản phẩm (chưa có).

---

## 4. 5 CA ĐỐI CHỨNG — ĐỎ trước → XANH sau

Tệp: `java-backend/web/src/test/java/com/vntech/erp/web/controller/ProductionRoleCounterProofTest.java` *(mới)*
· H2 + `MockMvc`, fixture theo phong cách `TASK-115` (PBKDF2 600k · quyền module · phạm vi dự án)
· **KHÔNG ca nào chạy bằng `admin`** *(bài học #1: chạy admin sẽ che lỗi phân quyền)*.

| # | Ca | Vai trò | Kỳ vọng | Mã CŨ | Mã MỚI |
|---|---|---|---|---|---|
| 1 | `productionRole_cht_duocPhep` | `cht` (`base_role=commander`) qua HTTP `save_team_subcontract` | **ĐƯỢC** (200 + có dòng `team_subcontracts`) | ✅ PASS | ✅ PASS |
| 2 | `productionRole_engineer_biChan` | `engineer` **đã có** `canUse=1` module `teams` + phạm vi `write` | **BỊ CHẶN** 403 «Tài khoản không có quyền thực hiện nghiệp vụ này.» | ✅ PASS | ✅ PASS |
| 3 | `productionRole_cht_roleBaseSai_vanDuocPhep` | `cht` với `base_role='engineer'` *(fixture CỐ Ý sai)* | **ĐƯỢC** (200) | ❌ **FAIL** `expected:<200> but was:<403>` | ✅ PASS |
| 4 | `productionRole_5CallSite_nhanMaChucDanhThat` | `cht` với `roleBase='cht'`; gọi **đủ 5/5** call site | **KHÔNG** bị chặn ở cổng `requireRole` | ❌ **FAIL** `save_team_subcontract vẫn bị TỪ CHỐI OAN ở cổng requireRole` | ✅ PASS (5/5) |
| 5 | `productionRole_team_vanBiChan` | `team` (tổ đội — người NHẬN giao khoán) | **BỊ CHẶN** 403 (chống nới quyền quá mức) | ✅ PASS | ✅ PASS |

**Nguyên văn ca đỏ (mã CŨ, chạy lại trên cây đã `git stash` bản vá):**

```
[ERROR] Tests run: 4, Failures: 2, Errors: 0, Skipped: 0
[ERROR]   productionRole_5CallSite_nhanMaChucDanhThat:257->assertNotRoleDenied:287
          save_team_subcontract vẫn bị TỪ CHỐI OAN ở cổng requireRole: Tài khoản không có quyền thực hiện nghiệp vụ này.
[ERROR]   productionRole_cht_roleBaseSai_vanDuocPhep:227->call:78 Response status expected:<200> but was:<403>
```

**Nguyên văn ca xanh (mã MỚI):**

```
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- in com.vntech.erp.web.controller.ProductionRoleCounterProofTest
```

**Kỷ luật chứng cứ:** vì ca 3/4 bị tôi chỉnh lại giữa lượt, ĐỎ được **chạy lại lần cuối** trên cây đã
`git stash push -- …ProductionManagementUseCase.java` (đưa về mã CŨ) rồi `git stash pop` khôi phục; kiểm
`git stash list` **rỗng** sau đó. Không còn `admin` nào trong chuỗi khẳng định phân quyền.

---

## 5. CỔNG JAVA (nguyên văn) — chạy trên cây ĐÃ có bản vá

| Cổng | Kết quả | Exit |
|---|---|---|
| `mvn -B -pl web -am test` | Domain `19/0/0` · Application `16/0/0` · Infrastructure `10/0/0` · **Web `Tests run: 34, Failures: 0, Errors: 0, Skipped: 0`** · `BUILD SUCCESS` | 0 |
| `mvn -B -pl application -am test` | `Tests run: 19, Failures: 0, Errors: 0` + `Tests run: 16, Failures: 0, Errors: 0` · `BUILD SUCCESS` | 0 |
| `mvn -B -pl domain -am test` | `Tests run: 19, Failures: 0, Errors: 0, Skipped: 0` · `BUILD SUCCESS` | 0 |

Web **29 → 34** *(29 nền của `TASK-115` + **5 ca mới**)*, **0 đỏ**. Không chạy `package`, không start/stop dịch vụ.

---

## 6. Tệp đã sửa

| Tệp | Loại | Nội dung |
|---|---|---|
| `java-backend/application/…/service/ProductionManagementUseCase.java` | sửa (`src/main`) | **5 call site** `requireRole`: ENGINE + mã chức danh THẬT (`cht`·`da_nv`·`da_truong`) + chú thích nguồn mã |
| `java-backend/web/src/test/java/…/ProductionRoleCounterProofTest.java` | **mới** (`src/test`) | 5 ca đối chứng (§4) |
| `docs/agent-progress/TASK-117.md` | **mới** | tệp này |
| `docs/25_TODO_ROADMAP.md` | sửa | ô TT dòng `P-09` ⇒ `**DONE**`; lý do ghi ở cột «Việc» |
| `docs/agent-progress/MASTER_STATUS.md` | sửa | **chỉ ô số**: `DONE 101→102` · `TODO 7→6` · PHASE 2 `3/9→4/9` |

`git stash` đã được kiểm **rỗng**; `git add -A`/push **không** dùng; 2 tệp `tests/p2-25-*.test.mjs` giữ
**untracked**; không chạm `app/**`, `lib/**`, `scripts/**`, `drizzle/**`, `AGENTS.md`, `docs/28_*`.

---

## 7. Điều KHÔNG khẳng định (giới hạn lượt đo)

- **KHÔNG** chạy dịch vụ thật (`8787`/`9000`/`18081`) để bấm tay 5 action; mọi khẳng định hành vi đến từ
  **H2 + MockMvc** đi đúng chuỗi `SystemController → use case → RbacService`.
- **KHÔNG** khẳng định 5 call site từng gây từ chối oan **trên chính dữ liệu `role_catalog` sản phẩm hiện có**
  (đo ra là KHÔNG) — nên kết luận «có lỗi thật trong sản phẩm» chỉ ở mức **LIKELY**.
- **KHÔNG** khẳng định mọi màn hình/flow khác của `ProductionManagementUseCase` đã hết mã vai trò cũ:
  `P09-FIX-PLAN.md` §1 yêu cầu rà cả tệp; lượt này đã rà và **chỉ 5 chỗ** dùng `rbac.requireRole` với danh sách
  mã — các chỗ còn lại dùng `accessScope`/`"admin".equals(principal.role())` (**không** thuộc 5 call site).
- **KHÔNG** sửa `RbacService.requireRole` để nhận cả mã chức danh cho **mọi** use case khác; nếu muốn thống
  nhất toàn hệ thì đó là việc riêng (đổi hàm dùng chung).
- `save_team_production`/`approve_team_production`/`save_team_payment`/`settle_team_subcontract` chỉ được đo ở
  **cổng vai trò** (đi qua được rồi dừng ở cổng nghiệp vụ phía sau) — **chưa** dựng chuỗi H2 đầy đủ cho từng
  action trong lượt này — *muốn dựng chuỗi đầy đủ cho từng action thì cần thêm tổ đội/kho/hợp đồng; đây là
  việc mở rộng, không nằm trong phạm vi `P-09`*.
