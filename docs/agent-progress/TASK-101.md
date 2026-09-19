# TASK-101 — PHASE 6 (`TM-01` … `TM-06`): TỔ ĐỘI

- **Mã:** TASK-101 · **Ngày:** 20/09/2026 · **Roadmap:** `docs/25_TODO_ROADMAP.md` §`PHASE 6 — TỔ ĐỘI`
- **Nguồn yêu cầu (nguyên văn):** `TM-01` «Danh sách: mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất» · `TM-02` «Ưu tiên sắp xếp: ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng» · `TM-03` «Chi tiết: thông tin · nhân sự · dự án · kho · **cấp phát** · lịch sử» · `TM-04` «CRUD đầy đủ: tạo · xem · sửa · ngừng (theo quyền)» · `TM-05` «Tab **Cấp phát** — dùng lại logic cấp phát kho nếu tương thích» · `TM-06` «Audit `team_members` (hiện **0 dòng**) — xác định cách nạp dữ liệu»
- **Trạng thái:** **`TM-01` DONE · `TM-02` DONE · `TM-03` DONE · `TM-04` BLOCKED · `TM-05` DONE · `TM-06` DONE** (5/6)
- **Quyết định đã chốt:** **0 bảng mới · 0 cột mới · 0 migration · 0 khoá module mới**; màn mới `app/screens/TeamDirectory.tsx` **dùng lại khoá menu `teams`** (đã có) và **tái dùng** action cấp phát kho. **KHÔNG build, KHÔNG khởi động/dừng dịch vụ** (đúng ĐIỀU CẤM) ⇒ mọi hợp đồng chốt ở **tầng NGUỒN + tầng CSDL** (đúng cách `tests/t01-work-menu.test.mjs`, `tests/w0*.test.mjs` đã làm).
- **Tệp hợp đồng:** `tests/tm01-team-list.test.mjs` · `tm02-team-sort.test.mjs` · `tm03-team-detail-tabs.test.mjs` · `tm04-team-crud.test.mjs` · `tm05-team-allocations.test.mjs` · `tm06-team-members-audit.test.mjs` — **30 ca, 30 ĐẠT**.

---

## 1. `TM-01` — DANH SÁCH ĐÚNG **6 CỘT**, MỌI Ô TỪ NGUỒN THẬT

Màn cũ (`app/screens/TeamManagement.tsx`) có **9 cột** (thừa «Hạng mục» · «Kho của tổ đội» · «Quyết toán»).
Màn mới khai **đúng 6 cột** trong hằng số `TEAM_LIST_COLUMNS` (khối thuần), theo **đúng thứ tự nguyên văn**:

| # | Cột | NGUỒN THẬT (đã đo trong mã đang chạy) | Ghi chú |
|---|---|---|---|
| 1 | Mã tổ đội | `teams.code` — `scripts/system-route.mjs:634` | |
| 2 | Tên tổ đội | `teams.name` — `:634` | |
| 3 | Trạng thái | `teams.active` (`tinyint(1) NOT NULL DEFAULT 1`) | ⚠️ bootstrap **lọc `t.active=1`** ⇒ tổ đội đã ngừng **chưa có nguồn** trên stack JS |
| 4 | Thành viên | `team_members.team_id` (khoá `teamMembers`) — `BootstrapDataAdapter.java:1200` | ⚠️ **khoá Java-only** ⇒ vắng thì hiện «chưa có nguồn», **KHÔNG hiện 0 giả** |
| 5 | Dự án | `teams.project_id` → `projects.id` | |
| 6 | Hoạt động gần nhất | `max(stock_issues.issued_at, material_returns.returned_at)` theo `teamId` — `:671` · `:677` | **KHÔNG** dùng `teams.updated_at` (cột đó bị mọi thao tác hệ thống chạm) |

- **Đối chứng âm đã chạy:** `teamListRows({...BASE, teamMembers: undefined})` ⇒ `membersKnown === false` và NGUỒN ghi
  «chưa có nguồn — … bảng team_members là khoá Java-only»; UI rẽ nhánh theo `membersKnown` **trước khi** in số.
- **In NGUỒN ngay trên UI:** khối `data-team-source-notes="TM-01"` ghi rõ nguồn của TỪNG cột — kể cả dòng
  «tổ đội đã ngừng: chưa có nguồn vì bootstrap chỉ trả `active=1`».

## 2. `TM-02` — THỨ TỰ ƯU TIÊN (CÓ ĐỐI CHỨNG ÂM BẮT ĐƯỢC 2 LỖI THẬT)

Hàm thuần `tmCompare(a, b)` — **một nguồn sự thật** cho cả sắp xếp lẫn test:

1. `ĐANG HOẠT ĐỘNG` (hạng 0) **luôn** trước `ngừng` (hạng 1) — kể cả khi tổ đội đã ngừng có ngày mới hơn;
2. trong cùng hạng: `lastActivityAt` **giảm dần**; ngày rỗng («chưa có hoạt động») **xếp cuối**;
3. cùng ngày: theo `code` tăng dần (tất định).

**HAI LỖI THẬT do chính bộ test bắt được ở lượt chạy đầu (ghi lại, không giấu):**

| Lỗi | Biểu hiện | Sửa |
|---|---|---|
| **(1) "last write wins"** | `if (days[last] > day)` không cập nhật khi `day === ""` ⇒ «hoạt động gần nhất» lấy nhầm nguồn **Hoàn** thay vì `max(Xuất, Hoàn)` | `if (!day \|\| latest > day) day = latest` |
| **(2) `localeCompare` + chuỗi rỗng** | ở chiều **giảm dần**, `"".localeCompare("2026-09-08") === -1` ⇒ tổ đội **KHÔNG có hoạt động** nhảy **LÊN ĐẦU** | thêm nhánh tường minh: rỗng ⇒ trả `1` |

⇒ Chứng minh bộ ca **có thể HỎNG**: nếu ai đảo dấu so sánh hoặc bỏ nhánh rỗng, `tests/tm02-team-sort.test.mjs` vỡ ngay.

## 3. `TM-03` — CHI TIẾT ĐÚNG **6 TAB**

`TEAM_TABS = ["Thông tin", "Nhân sự", "Dự án", "Kho", "Cấp phát", "Lịch sử"]` (màn cũ **3 tab**: Tổng quan / Thành viên / Đơn từ).

| Tab | Nguồn THẬT | `available` khi nào |
|---|---|---|
| Thông tin | `teams` (id · code · name · trade · project_id · warehouse_id · active) + `users.full_name` (tổ trưởng) | luôn |
| Nhân sự | `team_members WHERE team_id=?` (`joined_at` · `left_at` · `role_in_team` · `active`) | **chỉ khi payload có `teamMembers`** |
| Dự án | `teams.project_id → projects` | luôn |
| Kho | `teams.warehouse_id → warehouses` + `inventory[].balance/available/reserved` | cần kho **và** dòng tồn |
| Cấp phát | `stock_issues.team_id` + `material_returns.team_id` | luôn |
| Lịch sử | `audit_logs WHERE entity_type='team'` (`:756` — **chỉ admin** nhận `audits[]`) + `team_subcontracts`/`team_settlements` | cần dòng audit |

⚠️ Đo trên CSDL thật: **`audit_logs` KHÔNG có dòng `entity_type='team'` nào** ⇒ tab «Lịch sử» hiện
**«chưa có nguồn» + lý do** (khoá `audits[]` chỉ admin nhận, và chỉ 100 dòng gần nhất toàn hệ thống).

## 4. `TM-04` — **BLOCKED** Ở NHÁNH «SỬA» (phần đã làm được vẫn hoạt động)

### 4.1 ĐÃ LÀM ĐƯỢC (có test)

| Thao tác | Action THẬT | Cổng quyền (đo được) | UI |
|---|---|---|---|
| **Xem** | bootstrap (`teams`, `issues`, `returns`, …) | `teams` module `canView` | danh sách 6 cột + chi tiết 6 tab |
| **Tạo** | `create_project_team` — `system-route.mjs:1626`, `requireRole(["commander","admin"])` | `site_command` · `canUse` — `ActionRbacRegistry.java:39`/`:233` | nút «＋ TẠO TỔ ĐỘI» … |
| **Ngừng / khôi phục** | `set_project_team_status` — `:1643`, `requireRole(["admin"])` | `site_command` · `canUse` — `:190`/`:379` | nút «Ngừng tổ đội» trong chi tiết, gọi `runAction("set_project_team_status", { teamId, active })` |

- **≥2 người dùng mô phỏng** (`teamGates` chạy thật trong test): **admin** ⇒ tạo/ngừng/xoá đều ĐƯỢC;
  **CHT `cha.ht`** (`canUse=1`) ⇒ tạo/ngừng được; **người chỉ xem** (`canUse=0`) ⇒ **cả 3 bị CHẶN**;
  **vắng hàng quyền** ⇒ cũng bị chặn (không mặc định cho phép).

### 4.2 🔴 GÃY — vì sao phải `BLOCKED`

1. **KHÔNG tồn tại action «sửa tổ đội» ở CẢ 2 route.** `grep` `update_project_team|save_project_team|edit_project_team|rename_team`
   trên `scripts/system-route.mjs` = **0**; `SystemController.java` cũng **0** `case`; `ActionRbacRegistry.java` chỉ có
   **3** action tổ đội (`create_project_team` `:39` · `set_project_team_status` `:190` · `delete_project_team` `:73`).
2. Muốn đủ «CRUD đầy đủ» phải **thêm action mới** ⇒ phải sửa `scripts/system-route.mjs` — **nằm trong DANH SÁCH CẤM**
   của đợt này ⇒ theo đúng chỉ đạo *«nếu buộc sửa tệp khác ⇒ DỪNG, báo BLOCKED»*, **ĐÃ DỪNG**.
3. **KHÔNG im lặng, KHÔNG dựng nút giả:** `teamGates.canEdit = false` **luôn luôn**, UI **không có nút «Sửa»**
   (nút giả = bấm không có gì xảy ra — đúng lớp lỗi KP #90 đã gặp ở `U-10`), và lý do được ghi **ngay trong mã nguồn**
   (`TeamDirectory.tsx` §`teamGates`) + tại đây.

### 4.3 🔴 GÃY THỨ HAI (đã VÁ trong đợt này)

Call-site cũ `app/page.tsx`: `{active === "teams" && <TeamManagement data={data} open={open} />}` — **KHÔNG truyền
`action`/`permission`** ⇒ *mọi* thao tác ghi của màn Tổ đội là **BẤT KHẢ** (kể cả tạo/ngừng đã có action).
**Đã vá:** `{active === "teams" && <TeamDirectory data={data} action={action} permission={activePermission} />}`,
và `tests/tm04-team-crud.test.mjs` **chặn** call-site cũ quay lại.

### 4.4 Đề xuất gỡ chặn `TM-04` (chọn 1)

- **(A)** Cho phép sửa `scripts/system-route.mjs`: thêm action `update_project_team` (~25 dòng: validate `projectId` +
  `canAccessProject` + chống trùng mã/tên + `UPDATE teams SET name,trade,updated_at`), **+** khai `ACTION_MODULE`/`ACTION_CAPABILITY`
  (`site_command` · `canEdit`) **+** sinh lại `java-backend/ACTION_CATALOG.json`/`ActionRbacRegistry` để 2 route không lệch.
  Tương thích ngược; kiểm bằng 1 probe sống (tạo tổ đội tạm → sửa tên → xoá).
- **(B)** Mở rộng phạm vi cho `scripts/**` ở đợt sau và làm cùng lúc với các mục PHASE 7.
- **(C)** Chốt lại yêu cầu: coi «sửa tổ đội» là **không cần** (tổ đội cố định sau khi tạo) ⇒ đổi `TM-04` thành
  «tạo · xem · ngừng», bỏ chữ «sửa» khỏi roadmap. *Nếu chọn (C) thì `TM-04` đóng được ngay.*

## 5. `TM-05` — TAB «CẤP PHÁT»: **TƯƠNG THÍCH — TÁI DÙNG THẬT**

| Tầng | Đã tái dùng GÌ | Bằng chứng |
|---|---|---|
| **Action** | `issue_stock` (cấp phát kho cho tổ đội) + `return_stock` (hoàn trả) | `system-route.mjs:1652` · `:1657`; `SystemController.java` có cả 2 |
| **Bảng** | `stock_issues` + `stock_issue_items` (`issues[]`), `material_returns` (`returns[]`) | `:1653`/`:1654` INSERT; `:671`/`:677` SELECT — **0 bảng mới** |
| **Cùng sổ** | `confirm_installation` tăng `stock_issue_items.installed_qty` | `system-route.mjs:1663` — tab đọc lại chính cột `installedQty` đó |
| **Khoá nối** | CẢ HAI bảng mang `team_id` (`NOT NULL` ở `stock_issues`) | `si.team_id AS teamId` · `mr.team_id AS teamId` |
| **Quyền** | `issue_stock` mở bằng **2 cổng**: `teams` + `warehouse_issue` | `system-route.mjs:12` **và** `ActionRbacRegistry.java:89` (khớp nhau) |

- **Đối chứng âm:** phiếu của tổ đội KHÁC không bị tính sang; tổ đội không có phiếu nào ⇒ bảng rỗng ghi
  «chưa có nguồn — chưa có phiếu xuất/hoàn nào mang `team_id` của tổ đội này» (không hiện 0 trơ).
- **Ghi rõ 1 giới hạn THẬT:** phiếu đề nghị mua hàng (`material_requests.team_id`) đang **NULL ở 4/4 dòng** ⇒
  phần «phiếu đề nghị» trong tab Cấp phát lọc theo **DỰ ÁN**, và UI ghi rõ lý do.

## 6. `TM-06` — AUDIT `team_members`: **ĐÍNH CHÍNH TIỀN ĐỀ** + CÁCH NẠP **CONFIRMED**

Báo cáo đầy đủ (bắt buộc, tệp riêng): **`docs/agent-progress/TM-06-AUDIT-TEAM-MEMBERS.md`**
· bằng chứng số: `docs/agent-progress/TM-06-TEAM-MEMBERS-AUDIT.csv` (sinh bằng `tools/audit-team-members.mjs`).

### 6.1 ⚠️ ĐÍNH CHÍNH

Roadmap (và `TASK-070/071/073`) ghi **«`team_members` = 0 dòng»** — **SAI** ở thời điểm hiện tại:
**CSDL THẬT = 6 dòng**, trong đó **5 dòng `active=1`** (và 5 dòng `active=1 AND left_at IS NULL`).
Bóc tách: **4** dòng thật (`TMB_T080_…`, `created_at 2026-09-18 01:00:36`, seed `tools/task080-seed-real-data.sql:75`)
+ **2** dòng **tàn dư fixture** của cổng TASK-073 (`PRB073-A`/`PRB073-B`; B trỏ `user_id` **không tồn tại**).
⇒ **«5 active» KHÔNG đồng nghĩa «5 thành viên thật»**: đúng **4 thật + 1 fixture**.

### 6.2 CÁCH NẠP DỮ LIỆU = **CONFIRMED** (SQL ngoài sản phẩm)

| Tầng | ĐỌC | GHI |
|---|---|---|
| `scripts/system-route.mjs` | **KHÔNG** (grep `team_members\|teamMembers` = 0) | **KHÔNG** |
| `BootstrapDataAdapter.java:1197-1210` | **CÓ** (1 tệp duy nhất) | **KHÔNG** |
| Toàn bộ `java-backend/**/*.java` | 1 tệp | **0 tệp** |
| Action nghiệp vụ `*team_member*` | — | **KHÔNG tồn tại** ở JS lẫn Java |

⇒ 100% dòng đến từ **SQL chạy ngoài sản phẩm** (seed TASK-080 + fixture probe).
**Mâu thuẫn phát hiện:** `V14__project_membership_and_team_members.sql:47` hứa *«sẽ bổ sung qua giao diện»* —
giao diện/đường ghi đó **CHƯA BAO GIỜ ĐƯỢC XÂY**. Nghĩa `active`/`left_at`: `1 = đang trong tổ đội`,
`0 = đã rời`; `left_at` là mốc rời; `UNIQUE (team_id,user_id,joined_at)` ⇒ **một người vào lại cùng tổ đội ở mốc mới vẫn giữ lịch sử**.

### 6.3 Hệ quả cho màn Tổ đội

`teamMembers` là **khoá Java-only** ⇒ trên đường Node (`:8787`) màn này **THIẾU nguồn thành viên** nên UI bắt buộc
hiện «chưa có nguồn» + lý do (không bịa sĩ số). Cổng người dùng đang mở (`:9000` → Java `18081`) **có** khoá này.

## 7. `probe-roadmap-progress.mjs` SAU KHI SỬA HỒ SƠ

```
Tổng số mục đọc được: 110
PHÂN LOẠI NGUYÊN VĂN CỘT TT:
  DONE         81 / 110  (73.6%)
  BLOCKED       3 / 110  (2.7%)     ← F-01 (nền) + W-03 + TM-04 (mới)
  TODO         26 / 110  (23.6%)
THEO PHASE:
  PHASE 6 — ĐỘI NHÓM          5/6    (chặn 1)
```

⇒ **81/110 = 73,6 %** (76 → **+5** đúng bằng số mục đóng thật `TM-01`·`TM-02`·`TM-03`·`TM-05`·`TM-06`)
· **PHASE 6 = 5/6** — **KHÔNG** ghi khống 6/6 vì `TM-04` bị chặn ở nhánh «sửa».

## 8. PHẠM VI TỆP ĐÃ ĐỘNG VÀO

| Tệp | Thay đổi |
|---|---|
| `app/screens/TeamDirectory.tsx` | **MỚI** — khối thuần `TM-PURE-BEGIN/END` (`TEAM_LIST_COLUMNS` · `TEAM_TABS` · `tmCompare` · `tmLastActivity` · `tmMemberSummary` · `teamDetailTabs` · `teamAllocations` · `teamGates` · `TEAM_ACTION_GATES` · `TEAM_ALLOCATION_SOURCES`) + UI 6 cột / 6 tab |
| `app/screens/TeamManagement.tsx` | **CHỈ chú thích**: ghi rõ màn 3 tab này **đã ngừng dùng** từ PHASE 6 và **KHÔNG được import lại** |
| `app/page.tsx` | **CHỈ vùng màn Tổ đội**: đổi `import` sang `TeamDirectory` + call-site truyền `action={action} permission={activePermission}` |
| `tools/probe-team-screen.mjs` | Cập nhật hợp đồng cổng runtime: **6 cột** (TM-01) · ghi chú sắp xếp (TM-02) · **6 tab** (TM-03) · in rõ **bundle đang phục vụ** để phân biệt «nguồn sai» với «bundle cũ» |
| `tools/audit-team-members.mjs` | **MỚI** — cổng audit `TM-06` (chỉ ĐỌC CSDL + mã nguồn), sinh CSV bằng chứng |
| `tests/tm01…tm06-*.test.mjs` (6 tệp) | **MỚI** — hợp đồng từng mục, **30 ca** |
| `docs/25_TODO_ROADMAP.md` | CHỈ cột `TT` của `TM-01/02/03/05/06` = `**DONE**`, `TM-04` = `**BLOCKED**` (giải thích nằm ở cột «Việc», vì cổng chỉ đọc **nguyên văn** ô TT) |
| `docs/agent-progress/MASTER_STATUS.md` | CHỈ các ô số: DONE **76 → 81** · % **69,1 → 73,6** · BỊ CHẶN **2 → 3** · TODO **32 → 26** · dòng `PHASE 6 — ĐỘI NHÓM` **0/6 → 5/6** |
| `docs/agent-progress/TM-06-AUDIT-TEAM-MEMBERS.md` | **MỚI** — báo cáo audit `TM-06` |
| `docs/agent-progress/TM-06-TEAM-MEMBERS-AUDIT.csv` | **MỚI** — bằng chứng số (25 dòng) |
| `docs/agent-progress/TASK-101.md` + `TASK_INDEX.md` | **MỚI** / +1 dòng chỉ mục |

**KHÔNG đụng:** `scripts/**` · `java-backend/**` · `drizzle/**` · `AGENTS.md` · `docs/28_*` · mọi `.docx`/`.xlsx` ·
`docs/agent-progress/TASK-094…100.md` · `tools/baseline/**` · menu nhóm Công việc/Kho/Dự án đã chốt.

## 9. 8 CỔNG

| # | Cổng | Kết quả |
|---|---|---|
| 1 | `npx tsc --noEmit` | **0 lỗi** (EXIT 0) |
| 2 | `npm run lint` | **0 error · 181 warning** (đúng mức nền — 0 warning phát sinh) |
| 3 | `npm run test:regression` | **69/69 PASS · 0 FAIL** |
| 4 | `npm run test:workflow` | **passed** ("Workflow VNTECH ERP V5.3.0 FULL W2 passed") |
| 5 | 6 tệp test mới | **30/30 ĐẠT** |
| 6 | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** |
| 7 | `node tools/probe-project-screen.mjs` | **ĐẠT** |
| 8 | `node tools/probe-work-item-field-contract.mjs` | **18/18 ĐẠT · 2 GHI NHẬN (bundle cũ)** — không tệ hơn mức nền |

### 9.1 ⚠️ GHI CHÚ BẮT BUỘC VỀ `tools/probe-team-screen.mjs`

Cổng runtime `probe-team-screen.mjs` đã được cập nhật theo hợp đồng MỚI, nhưng **bản build đang phục vụ là bundle CŨ**
(`app/page.tsx` vẫn nạp `TeamManagement` 3 tab) vì đợt này **KHÔNG được phép `npm run build`**. Chạy cổng đó lúc này
cho **13 mục KHÔNG ĐẠT** (thiếu cột «Hoạt động gần nhất», thiếu ghi chú TM-02/TM-01, chỉ 3 tab) — **ĐÚNG như dự kiến**,
và cổng đã tự in dòng `▸ Bundle đang phục vụ: …` để phân biệt «nguồn sai» với «bundle chưa dựng lại».
⇒ **Sau khi có người dựng lại bundle, chạy lại `node tools/probe-team-screen.mjs` và kỳ vọng ĐẠT.**

## 10. UNKNOWN / CẦN NGƯỜI DÙNG QUYẾT

1. **`TM-04` — phương án gỡ chặn** (mục 4.4): (A) cho sửa `scripts/system-route.mjs` để thêm `update_project_team`,
   (B) hoãn sang đợt sau, hay **(C) chốt lại yêu cầu: bỏ chữ «sửa» khỏi `TM-04`** (khi đó `TM-04` đóng được ngay ⇒ 82/110 = 74,5 %).
   *Mặc định tôi giữ (A-chờ-duyệt): UI không có nút giả, mục để `BLOCKED` với lý do đo được.*
2. **`TM-06` — 2 dòng tàn dư `PRB073-A`/`PRB073-B`**: (A) cho phép `DELETE` 2 dòng rác (1 câu SQL; B là dòng **mồ côi**
   trỏ `user_id` không tồn tại), (B) giữ nguyên coi là fixture, hay (C) đặt `active=0`. *Mặc định tôi **KHÔNG** tự sửa dữ liệu.*
3. **`TM-06` — đường nạp thành viên**: `V14` hứa «bổ sung qua giao diện» nhưng **không có action nào**. (A) bổ sung
   `save_team_member` (JS + Java — **ngoài phạm vi PHASE 6** vì phải sửa `scripts/**`), (B) giữ chỉ-đọc + nạp bằng SQL,
   (C) hoãn. *Mặc định (B) và ghi rõ đây là khuyết điểm đã biết, không phải tính năng.*
4. **`teamMembers` có cần có trên đường Node (`:8787`)?** Nếu cần thì phải thêm SELECT vào `scripts/system-route.mjs`
   (BỊ CẤM). *Mặc định: chấp nhận Java-only như hiện trạng.*

## 11. GIỚI HẠN ĐÃ BIẾT

- Mọi hợp đồng chốt ở **tầng nguồn + CSDL**; **chưa có bằng chứng runtime cho giao diện mới** vì bundle chưa dựng lại
  (đợt này cấm `npm run build`) — xem §9.1.
- `teams` trên stack JS chỉ có **1 dòng** ⇒ «sắp xếp theo ngày» và «đã ngừng» được chứng minh bằng **fixtures có thật
  trong test**, không phải bằng dữ liệu sống (dữ liệu sống không đủ độ phủ).
- `TM-04` nhánh «sửa» **không thể** kiểm bằng action thật vì **action không tồn tại** — đã thay bằng đối chứng âm
  (`assert.equal(updateActions.length, 0)`) để nếu ai thêm action thì test **buộc** phải cập nhật kết luận.
