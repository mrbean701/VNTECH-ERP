# MT2 — QUÉT TOÀN BỘ CỔNG KIỂM (GATE SWEEP) · 23/09/2026

> Sau khi **đóng nợ cổng test** (22 → 0), tôi quét **TOÀN BỘ** cổng trong `package.json` để tìm nợ cùng loại (cổng ⛔ chưa từng chạy trong các lượt trước).
> Kết quả: **2 cổng ĐỎ thật đã vá** + **1 cổng ĐỎ còn lại do mã cũ, KHÔNG do MT2** (ghi rõ để user quyết).

## A. BẢNG KẾT QUẢ QUÉT

| Cổng | Lệnh | Trước | Sau | Ghi chú |
|---|---|---|---|---|
| Lint | `npm run lint` | 🔴 **1 error** + 202 warning (EXIT=1) | ✅ **0 error** · 202 warning (EXIT=0) | ⚠️ `npm test` chạy lint ĐẦU TIÊN ⇒ cổng này đỏ thì `npm test` đỏ theo |
| CSS baseline | `npm run verify:css-baseline` | 🔴 dead classes=3 | ✅ **ĐẠT** · dead classes=0 · dead vars=0 · 2547 dòng · 363565 B · dynamic contracts PASS | |
| Master baseline | `npm run verify:master-baseline` | ✅ ĐẠT | ✅ **ĐẠT** · `!important=3654` · `css=363565B` | trần ≤ 4950 / 400653 nên gỡ CSS chết là AN TOÀN |
| Artifact | `npm run validate:artifact` | ✅ ĐẠT | ✅ **ĐẠT** (source preflight + built artifact) | |
| Fingerprint | `npm run verify:fingerprint` | 🔴 lệch (`6d21e3f9…` vs `b3e829f2…`) | ✅ **ĐẠT · VNTECH-FP-362A7B92DF4824AE** · source 512 tệp | làm bằng công cụ CHÍNH THỨC `tools/gd-cycle.mjs` |
| Release static | `npm run test:release-static` | 🔴 (2 tầng) | 🟡 **còn 1 tầng đỏ** — xem §C | tầng 1 (SHA256 manifest) đã ĐẠT: 7579 tệp |
| Work item | `npm run test:work-item` | ✅ 14/14 ĐẠT | ✅ 14/14 | |
| Email dispatcher | `npm run test:email` | ✅ ĐẠT | ✅ ĐẠT | |
| Regression | `npm run test:regression` | ✅ 69/69 | ✅ **69/69** | |
| Workflow | `npm run test:workflow` | ✅ PASSED | ✅ **PASSED** | |
| **Toàn bộ hợp đồng** | `node --import tsx --test tests/*.test.mjs` | 🔴 22 FAIL | ✅ **570 · 569 PASS · 0 FAIL · 1 skip** | (từ đợt trước) |
| Typecheck | `npx tsc --noEmit` | ✅ 0 | ✅ **0** | |

## B. ĐÃ VÁ (2 cổng)

### B.1 — `lint`: 1 error ở `app/page.tsx` (do MT2-P12-01) ⇒ ĐÃ SỬA
**Thông điệp:** `2466:38 error Error: Calling setState synchronously within an effect can trigger cascading renders`.
**Nguyên nhân gốc:** effect nạp cấu hình thông báo gọi `void loadNotifConfigs()`, mà hàm đó `setNotifError("")` **đồng bộ TRƯỚC** mốc `await` ⇒ vi phạm luật `react-hooks` (setState đồng bộ trong effect).
**Cách sửa (⛔ không đổi hành vi):** effect tự chạy async IIFE, **mọi `setState` nằm SAU `await`**, thêm cờ `live` chống cập nhật khi unmount/đổi bước; giữ nguyên `loadNotifConfigs` cho nút «↻ Tải lại» và sau Bật/Tắt/Xoá (gọi từ sự kiện, ⛔ không trong effect).
**Bằng chứng:** `npm run lint` ⇒ **`✖ 202 problems (0 errors, 202 warnings)` · EXIT=0**; `npx tsc --noEmit` = 0; toàn bộ 570 hợp đồng vẫn **569 PASS / 0 FAIL**.

### B.2 — CSS chết (3 lớp) ⇒ ĐÃ DỌN
**Cổng chỉ ra:** `approved-stock-bars`, `delivered-detail-grid`, `receipt-drawer`.
**Đã đo trước khi gỡ:** grep toàn repo (trừ `node_modules/dist/.next`) ⇒ **⛔ không tệp `app/`, `lib/`, `scripts/` nào dùng** (chỉ còn định nghĩa trong `app/globals.css`; riêng `receipt-drawer` còn được một **probe cũ** `tools/probe-p2-ui-dom.mjs` truy vấn – ⛔ không phải mã sản phẩm).
**Đã gỡ:** 4 rule `.approved-stock-bars*` + 2 rule `.delivered-detail-grid*` + rule `.receipt-drawer{…}` + lớp đó trong **3 danh sách selector** `.overlay>.drawer, .overlay>.receipt-drawer, .drawer` ⇒ **−581 byte**.
**Bằng chứng:** `verify:css-baseline` **ĐẠT (dead classes=0)** · `verify:master-baseline` **ĐẠT** · 570 hợp đồng vẫn xanh · `tsc` 0.

### B.3 — Fingerprint lệch ⇒ làm lại bằng CÔNG CỤ CHÍNH THỨC
`node tools/gd-cycle.mjs "MT2 P14-03c DON NO CONG TEST VA CSS CHET" --no-build` ⇒
`SOURCE 362a7b92df4824ae3ff5b34801bd6012d7f2dc3003be0d0cc751153c7175a946` · `SHORT VNTECH-FP-362A7B92DF4824AE` · `RELEASE 0bb3a1edcc8af8df7b1ef44eee7ac0e91f8c7fb7650805080f039158b77b248b` ·
`HEAD 0219_phase_gd_mt2_p14_03c_don_no_cong_test_va_css_chet_identity.sql` · «Fixed point stable: OK».
**Bằng chứng sau đó:** `verify:fingerprint` **ĐẠT** · `validate:artifact` **ĐẠT (cả built artifact)** · `probe-schema-drift` **0 lệch (127 bảng · 1615 cột)**.

## C. CÒN LẠI 1 TẦNG ĐỎ — ⛔ KHÔNG PHẢI DO MT2 (chờ user quyết)

**Cổng:** `npm run test:release-static` → bước ② `node scripts/migrate-postgres.mjs --preflight` (**«Migration verification»**).
**Thông điệp thật:** `0080_phase_p4_workflow_multi_identity.sql: con cu phap SQLite sau khi chuyen doi (datetime())` — tức tệp drizzle **0080** (từ PHASE 4) còn `datetime()` sau khi dịch sang PostgreSQL.
**Vì sao trước đây không thấy:** bước ① (SHA256 manifest) đỏ trước nên cổng dừng sớm; nay bước ① đã ĐẠT (7579 tệp) mới lộ bước ②.
**⛔ Chưa tự sửa vì:** đây là **file migration lịch sử** — sửa nội dung có thể làm **lệch checksum** ở môi trường PostgreSQL đã chạy (rủi ro kiểu §19/§20). Cần user quyết 1 trong 2:
- **(A)** sửa `datetime()` → `CURRENT_TIMESTAMP` trong `drizzle/0080_…sql` (kèm ghi chú lịch sử + chạy lại toàn bộ gate);
- **(B)** thêm ngoại lệ/whitelist cho tệp này trong `migrate-postgres` preflight (⛔ không đụng migration).
**Ảnh hưởng MT2:** ⛔ **không** — bản chạy thật dùng **MySQL 8 (Java/Flyway, 29 migration V*)** và H2 cho test; đường PostgreSQL là **track phát hành riêng**.

## D. GHI NHẬN THÊM (rủi ro tái phát — ⛔ chưa tự đổi chính sách)
- `MANIFEST_SHA256.txt` **bao gồm `.memsearch/memory/*.md`** (bộ nhớ phiên, ghi liên tục) ⇒ hash **trôi giữa phiên** làm bước ① dễ đỏ lại. Đã tái sinh manifest (7579 tệp) để xanh hiện tại; **khuyến nghị user** loại `.memsearch/` khỏi manifest (quyết định chính sách).
- `npm run test:regression` chỉ chạy **69/570** ca hợp đồng ⇒ nợ kiểu 22 ca vừa rồi rất dễ tái mù; **khuyến nghị** thêm cổng chạy toàn bộ.

> ⛔ **NO COMMIT · NO PUSH** — mọi thay đổi (mã Java + TS + CSS + 12 hợp đồng + 3 tài liệu + manifest + fingerprint SSOT) nằm trong cây làm việc.

---

## E. QUÉT BỘ PROBE TĨNH (`tools/probe-*.mjs` · `tools/p2-*.mjs`) — 28 probe

**Kết quả: 19 ✅ ĐẠT · 9 ⚠️ cần phân loại.** ⛔ Đây là bộ CÔNG CỤ CHẨN ĐOÁN, phần lớn **không phải cổng chặn** (exit≠0 khi có phát hiện để rà) — nên ⛔ không đánh đồng với "hỏng sản phẩm".
**➕ CẬP NHẬT SAU XỬ LÝ (23/09/2026): 24 ✅ ĐẠT · 1 báo cáo · 1 cần user quyết · 0 lỗi sản phẩm.**
Đã **sửa 5 lỗi CÔNG CỤ** (`probe-action-module-parity` 38→209 khoá · `probe-role-code-scan` 43→0 · `probe-kp89` 2 báo oan · `probe-kp96` 2 kỳ vọng cũ · `probe-write-map-drift` đối chứng cũ) và **chạy 2 probe cần môi trường** (đã dựng stack thật: Java **18081** PID 10684 · UI **8787** PID 6000 · proxy **9000** PID 18512) ⇒ `probe-money-consistency` **14/14 ĐẠT** (UI↔CSDL khớp 94.220.000) + `probe-module-permission-data` **EXIT=0**.
**Còn 2 mục:** ① `probe-css-budget` — `canonical.css` **967 > trần 930** (chờ user chọn A/B) ② `probe-catalog-drift` — bản báo cáo «CÓ trôi dạt» (cần đọc danh sách CHƯA BIẾT, ⛔ chưa tự diễn giải).

### E.1 — ✅ 19 PROBE ĐẠT (đo được, cập nhật trong phiên)
`probe-action-registry-coverage` (mọi action thuộc 1 trong 4 nhóm hợp lệ) · `probe-action-role-parity` (2 bản khớp) · `probe-action-scope-parity` (mọi action JS kiểm phạm vi đều được Java kiểm) · `probe-action-parity` · `probe-action-coverage-controller` (**0** action UI gọi sẽ hỏng trên đường Java) · `probe-java-sql-schema` (0 tham chiếu bảng/cột sai) · `probe-schema-drift` (0 lệch) · `p2-reference-integrity` (**15/15** cặp, 0 mồ côi) · `probe-clause-parity` · `probe-column-parity` (đối chứng dương 5/5) · `probe-increment-drift` · `probe-statusbadge-parity` · `probe-audit-coverage` · `probe-modal-branch-coverage` · `probe-work-item-field-contract` (**14/14**) · `probe-bootstrap-keys` · `probe-canonical-me-code-drift` (Java khớp JS) · `probe-list-toolbar-inventory` · `probe-ui-adoption`.

### E.2 — 🔧 ĐÃ SỬA 1 LỖI CÔNG CỤ (không phải lỗi sản phẩm)
**`probe-action-module-parity`** báo «130 điểm LỆCH» ⇒ **SAI**: hàm `parseJavaMap` cắt khối bằng `text.indexOf(");")` — gặp `);` **đầu tiên**, mà các ghi chú MT2 trong `ActionRbacRegistry.java` có chứa `List.of())`/`);` ⇒ khối bị cắt sớm, **chỉ đọc được 38/209 khoá**. **Đã sửa**: bỏ ghi chú `//` trước khi cắt + cắt tới dòng đóng `);` của `Map.ofEntries(`, ⛔ không dùng `);` bất kỳ.
**Sau sửa:** `Java: ACTION_MODULES 209` (đúng) và kết luận thật = **51 điểm LỆCH** — tất cả dạng **`JS=[]` mà `Java=[module]`** (JS gác bằng `requireRole`, Java gác bằng module: ví dụ `create_project_team` → `site_command` (vá của chính đợt này, JS `:1699` dùng `requireRole`), `delete_notification_config` → `admin` (P12-01), `create_self_work_item` → 2 khoá công việc…). ⇒ **Danh sách RÀ SOÁT, ⛔ không phải lỗi tự động**; cần soi từng ca xem có **siết quá** (đúng lớp lỗi «chặn oan commander» đã vá) hay không.

### E.4 — RÀ 51 ĐIỂM «LỆCH MODULE» CỦA `probe-action-module-parity` (sau khi sửa parser)
**Đo lại đầy đủ:** công cụ in **29 dòng `LỆCH MODULE`** (tổng kết 51 điểm do đếm cả khác biệt theo phần tử), và **TẤT CẢ 29 đều là chiều `JS=[] → Java=[module]`**.
**⇒ Chiều NGUY HIỂM (`JS=[module] → Java=[]`) = 0**: ⛔ không còn action nào mà Java **thiếu** cổng module khiến người dùng có quyền chuẩn bị 403 (đúng lớp lỗi đã vá ở `create_project_team`; `create_request` nay cũng đã khớp `requests` nên ⛔ không còn bị báo).
**29 ca còn lại = Java THÊM cổng module mà JS không khai** ⇒ **SIẾT CHẶT HƠN, đúng GOAL §17 (backend là lớp cưỡng chế)** — ⛔ không phải lỗi. Kiểm chứng cơ chế trên mã: `OpsTaskManagementUseCase` chỉ có **2 chỗ** `rbac.requireRole(...)` (dòng **384** `["commander","admin"]` — chính ca đã vá · dòng **741** `["project","procurement","admin"]` theo JS `:1253`); các action nhóm `teams` còn lại **không** có `requireRole` ⇒ cổng module là **lớp gác DUY NHẤT** (thay cho việc JS để ngỏ) ⇒ ai cần dùng thì cấp quyền module qua `user_module_permissions` (dữ liệu, ⛔ không sửa mã).
**Cơ chế đã đo để bảo đảm ⛔ không «chặn oan» kiểu cũ:** `RbacService.requireRole` so **CẢ** `role()` **và** `roleBase()` ⇒ mã engine (`commander/project/procurement/warehouse/engineer/team/accountant`) ⛔ không bị 403 oan (đã kiểm bằng `probe-action-role-parity` ✅ + `probe-role-code-scan` **0**).
**Kết luận:** ⛔ **không cần sửa mã** cho 29 ca; giữ làm **danh sách theo dõi** để khi cấp quyền module cho vai trò mới thì đối chiếu.

### E.5 — TRẠNG THÁI TỪNG PROBE ĐÃ XỬ LÝ (bảng chi tiết)
| Probe | Kết luận đo được | Phân loại | Việc cần làm |
|---|---|---|---|
| `probe-action-module-parity` | 51 điểm LỆCH `JS=[] / Java=[module]` | 🔵 CÔNG CỤ BÁO CÁO (đã sửa parse) | Rà 51 ca xem có siết quá; ghi lại ca CHẤP NHẬN |
| `probe-css-budget` | 🔧 **ĐÃ GIẢM**: `app/styles/canonical.css` **975 → 967 dòng**, **khối trùng 2 → 0** (gộp 3 khối `.attachment-pick > input[type="file"]` cùng ngữ cảnh thành 1 — ⛔ không mất thuộc tính nào; gỡ 2 quy tắc CHẾT `.project-warehouse-detail h3`/`h3 small` = −10 dòng, grep 0 lần dùng). Vẫn còn **1 chỉ số vượt trần: 967 > 930 (37 dòng)**; các chỉ số khác ✅ (`!important` 3699≤5014 · tổng dòng CSS 3777≤3918 · font<10px 14≤14). **➕ ĐÃ ĐO KHẢ NĂNG PHƯƠNG ÁN (A)**: quét **223 quy tắc** ⇒ **22 nhóm có THÂN GIỐNG NHAU** trong cùng ngữ cảnh; gộp **AN TOÀN** (không có quy tắc trùng selector xen giữa ⇒ ⛔ không đổi thứ tự cascade) chỉ tiết kiệm **16 dòng** ⇒ ⛔ **KHÔNG đủ** đưa 967 → ≤930 (còn 951); muốn đủ phải gộp cả nhóm **RỦI RO** (119 dòng tiềm năng nhưng **có** quy tắc xen giữa ⇒ đổi thứ tự cascade ⇒ phải chạy lại toàn bộ cổng + đo lại hình) | 🟡 **CẦN QUYẾT ĐỊNH** | **(A1)** gộp an toàn 16 dòng (⛔ vẫn còn vượt 21) · **(A2)** gộp cả nhóm rủi ro (đủ 37 nhưng đổi cascade — cần đo lại hình) · **(B)** user duyệt **nâng trần riêng canonical.css 930 → 970** (⛔ các trần khác vẫn đạt) |
| `probe-role-code-scan` | 🔧 **ĐÃ SỬA CÔNG CỤ — «43 chỗ NGHI NGỜ CAO» là BÁO OAN** ⇒ nay **0** ✅ (EXIT=0). **Nguyên nhân gốc (2 lớp):** ① tiền đề cũ chưa biết `RbacService.requireRole` (dòng 89) đã được port theo ĐÚNG JS — nó so **CẢ HAI** `user.role()` (mã chuẩn) **VÀ** `user.roleBase()` (mã engine) ⇒ dùng mã engine trong `requireRole` là **HỢP LỆ**, ⛔ không phải lỗi ② bộ mã hợp lệ thiếu 2 `base_role` **THẬT** đo từ CSDL: **`accountant`** và **`team`**. **Đã sửa:** công cụ nay kiểm ① có nhánh `roleBase()` trong `RbacService` không ② chỉ soi ĐÚNG danh sách vai trò truyền vào `requireRole(...)` (⛔ không soi mọi chuỗi trên dòng) ③ bộ mã = **số đo CSDL thật** (`SELECT DISTINCT base_role FROM role_catalog` = accountant · commander · director · engineer · procurement · project · team · warehouse; `SELECT DISTINCT role FROM users` = accountant · admin · cht · da_nv · da_truong · director · kh_nv · kh_truong · ksda · thu_kho · thuky) | ✅ XONG | (không cần làm gì thêm) |
| `probe-kp96-dead-project-tree` | 🔧 **ĐÃ SỬA CÔNG CỤ — nay ĐẠT 31/31 ✅**: 2 phép kiểm cũ đòi `page.tsx` CÒN shim `FILTER`/`MAP` cho nhóm `project_management`, nhưng 3 tầng catalog (MySQL · SQLite · fallback) đã xác nhận **không còn nhóm đó** ⇒ shim thành mã chết, gỡ là ĐÚNG (§27). Nay kiểm **Ý ĐỊNH**: nhánh chết phải VẮNG (`__site_command_tree_disabled__` = 0) + `site_command` vẫn là đích THẬT | ✅ XONG | — |
| `probe-kp89-dead-dept-branch` | 🔧 **ĐÃ SỬA 2 BÁO OAN — nay ĐẠT 25/25 ✅**: ① needle `data-dept` khớp chuỗi con nên bắt oan marker **ĐANG SỐNG** `data-dept-filter="AD-08"` (`app/page.tsx:1823`) ⇒ nay loại trừ `data-dept-filter` ② phép kiểm «37 literal `subGroup:`» tìm ở `page.tsx` (nay **0**) nhưng 37 literal đã **CHUYỂN sang nguồn sự thật menu** `lib/menu-helpers.ts` (**37**) ⇒ nay đếm ở đúng tệp | ✅ XONG | — |
| `probe-write-map-drift` | 🔧 **ĐÃ SỬA ĐỐI CHỨNG — nay EXIT=0 ✅**: ca đối chứng cũ `vntech_license_installations` **đã HẾT LỆCH sau MT2-P14-03b** (Java ghi đủ 18 cột) ⇒ đối chứng cũ tự báo «công cụ hỏng». Nay đối chứng kiểm ① vẫn PARSE được bảng đó ở **cả 2 phía** ② vẫn phát hiện **≥1 bảng lệch** (đo được **20 bảng**) ⇒ công cụ chạy đúng, và ghi rõ ca cũ đã được vá | ✅ XONG | — |
| `probe-catalog-drift` | «CÓ trôi dạt — cần rà lại» (báo cáo) | 🔵 BÁO CÁO | Đọc danh sách CHƯA BIẾT để quyết — ⛔ chưa tự diễn giải |
| `probe-money-consistency` | ✅ **ĐẠT 14/14 · 0 HỎNG · 1 GHI NHẬN** (chạy với stack thật) — đối chiếu UI ↔ CSDL khớp: báo cáo sản lượng Σ thực tế **94.220.000 ↔ 94.220.000**; thu hồi vốn 1 hồ sơ · Σ được duyệt khớp · 0 hồ sơ vượt tiền thực thu. ⚠️ **GHI NHẬN**: tồn kho **72 dòng, 0 dòng có đơn giá** ⇒ giá trị tồn theo giá = 0 (cùng gốc KP #82) | ✅ XONG (kèm ghi nhận) | Ghi nhận vào hồ sơ tồn kho |
| `probe-module-permission-data` | ✅ **EXIT=0** (chạy với stack thật): `user_module_permissions` cho module `admin` = **0 dòng**; **0** tài khoản không-phải-admin có `canUse=1` ⇒ **chỉ admin có module `admin`** ⇒ cổng quản trị workflow ĐÚNG | ✅ XONG | — |

> ⛔ **NO COMMIT · NO PUSH.** Ưu tiên lượt kế: ① `probe-css-budget` (sửa thật) ② `probe-role-code-scan` (43 vị trí) ③ cập nhật 3 công cụ cũ (kp89/kp96/write-map-drift) + rà 51 ca parity.

---

## F. KIỂM CHỨNG **LIVE** TRÊN STACK THẬT (23/09/2026, GOAL §46/§47)

**Stack đang chạy:** Java **18081** (PID 10684) · UI **8787** (PID 6000) · proxy **9000** (PID 18512). ⛔ Không kill tiến trình nào khác.

| Probe LIVE | Kết quả đo được |
|---|---|
| `probe-live-stack` | **RESULT: ALL PASS** |
| `probe-p5-dashboard-menu` | **4/4 ĐẠT** — «§3.1 ĐẠT trên bundle ĐANG PHỤC VỤ» |
| `probe-p6-08-menu-single-item` | **3/3 ĐẠT** — menu 1 mục mở TRỰC TIẾP, ⛔ không lồng 2 cấp |
| `probe-security-rbac` | ✅ (đã tự dọn dữ liệu probe) |
| `probe-ui-action-coverage` | ✅ **toàn bộ 170 action UI GỌI đều có ở Java** ⇒ chiều UI ↓ API KHỚP |
| `probe-purchasing-flow` | ✅ (luồng mua hàng; ⚠️ cần `--apply` để chạy hết chuỗi) |
| `probe-schema-drift` | ✅ **0 lệch** (127 bảng · 1615 cột) |
| `probe-money-consistency` | ✅ **14/14 ĐẠT** — UI ↔ CSDL khớp (Σ sản lượng **94.220.000 ↔ 94.220.000**) |
| `probe-module-permission-data` | ✅ EXIT=0 — module `admin`: 0 dòng quyền · 0 tài khoản thường có `canUse=1` |
| `probe-work-center` | 🔧 **ĐÃ SỬA CÔNG CỤ → ĐẠT ✅ EXIT=0**: ① Part A đọc **sai tên trường** (`assigneeUserId` ⛔ không tồn tại) — payload THẬT dùng **`assignedTo`/`assignedToName`**; đo live: `assignedTo = USR_2f435847…` **= `data.user.id`** ⇒ item tự tạo GÁN ĐÚNG người tạo ② Part B còn kỳ vọng menu/tab **thời trước MT2** (3 tab, «Nhiệm vụ nhân viên đang làm») ⇒ cập nhật **mục «Cá nhân» + ĐÚNG 5 tab** ③ thêm null-guard (trước đây `root=null` ⇒ ném TypeError giữa đường, ⛔ không in được kết luận) ④ bó selector vào **con trực tiếp** của dải tab (trước bắt luôn nút dải con «Của tôi/Được giao/Do tôi tạo»). **Kết quả live:** mở màn Công việc ✅ · `.work-center` render ✅ · **đúng 5 tab + đúng nhãn/thứ tự** (Cá nhân · Phòng ban · Giao việc · Dashboard · Báo cáo) ✅ · **cả 5 tab mở được với dữ liệu thật** (bảng 1/2/0/2/3 · dòng 1/14/0/3/22 · bars 1/27/0/5/20) ✅ |

**⇒ Sau đợt này KHÔNG còn cổng/probe nào đỏ vì SẢN PHẨM.** Còn đúng **1 mục chờ user quyết** (`probe-css-budget`: `canonical.css` 967 > trần 930).

### F.1 — Đo tiếp trong đợt (23/09/2026)
| Probe | Kết quả đo được |
|---|---|
| `probe-p6-07-attachment-layout` (LIVE) | ✅ **4/4 kích thước ĐẠT** — đo thật trên UI đang phục vụ: ô chọn tệp **179×44** (laptop) / nhãn-chữ **96×17** · **chồng 0 px²** · **⛔ không tràn ngang**; chuỗi khung `form.file-upload[grid w=242 clientW=242 …] ← div.attachment-panel[block w=268 clientW=266 …]` |
| `probe-catalog-drift` | 🔧 **ĐÃ SỬA CÔNG CỤ → EXIT=0 ✅**: danh mục `ACTION_CATALOG.json` là **bản kiểm kê SINH TỪ JS** (chỉ 3 khoá gốc); MT2 thêm **17 action Java-only** vào `ActionRbacRegistry` (209 tên). Công cụ có sẵn allowlist `KNOWN_JAVA_ONLY` nhưng thiếu 17 tên đó ⇒ báo «17 CHƯA BIẾT». **Đã đo**: cả 17 đều có `case "<action>"` trong `SystemController` (**17/17**) ⇒ **Java-only THẬT, ⛔ không phải lỗi**; đã bổ sung allowlist kèm phân nhóm (§7 KHO/GRN · §13.1 THÔNG BÁO · §6.3 NCC/VẬT TƯ · §4 PHÊ DUYỆT). **Kết quả:** `danh mục ngoài JS = 0` · `đã biết 27/29` · **`CHƯA BIẾT = 0`** · «KHÔNG có trôi dạt ⚠️→✅» |
| `probe-visual-regression` (LIVE) | ⚠️ **KHÔNG ĐẠT 59/68 ảnh lệch — nhưng là TRÔI ẢNH CHUẨN, ⛔ KHÔNG phải lỗi sản phẩm** (xem §F.2) | 🟡 **CẦN USER QUYẾT** | (A) duyệt **làm lại ảnh chuẩn** (có nhãn phiên bản, sau khi xem diff) **hay** (B) giữ ảnh chuẩn cũ làm mốc «trước MT2» và coi cổng này là **tham khảo** tới khi chốt |

### F.2 — VÌ SAO `probe-visual-regression` LỆCH (bằng chứng, ⛔ không kết luận vội)
| Bằng chứng | Số đo |
|---|---|
| **Tuổi ảnh chuẩn** | `tools/baseline/` = **68 PNG · sửa lần cuối 20/09/2026 03:03** ⇒ ảnh chuẩn được chụp **TRƯỚC** toàn bộ đợt MT2 (21–23/09) |
| Thay đổi MT2 ẢNH HƯỞNG TRỰC TIẾP tới ảnh | **P5-01** màn Công việc còn **5 tab** mới · **T-125** Tổ đội tách màn · **P12-01** màn Quản trị **12 → 13 bước** («Thông báo») · **P12-03** danh sách tài khoản **13 → 12 cột** · **§6.1** đổi vị trí «Nhà cung cấp» · **§7.6** thêm mục «Cấp phát & hoàn trả» · **P6-01..P6-08** thẻ/thanh tiến trình/quá hạn |
| Ảnh lệch nặng tập trung đúng các màn MT2 sửa | `03-work` desktop **22,5%** · `04-team` desktop **24,8%** · `01-dashboard` desktop **7,19%** — đều là màn có thay đổi menu/nhãn/bố cục ở trên |
| **Kiểm chứng ĐỘC LẬP hành vi hiện tại (live)** | `probe-p5-dashboard-menu` **4/4** · `probe-p6-07` **4/4** · `probe-p6-08` **3/3** · `probe-work-center` **ĐẠT** (đúng **5 tab** + cả 5 tab mở được với dữ liệu thật) · `probe-layout-audit` **ĐẠT** (không tràn ngang) |
| Vì sao ⛔ KHÔNG tự làm lại ảnh chuẩn | Làm lại ảnh chuẩn = **âm thầm hợp thức hoá MỌI thay đổi hình** (kể cả thay đổi sai) ⇒ theo GOAL §24/§52 phải để **user duyệt**, ⛔ không tự làm |

**⇒ Kết luận trung thực:** cổng thị giác đang đo **một bản UI cũ (20/09)**; ⛔ **không có bằng chứng nào cho thấy lỗi bố cục mới** (4 cổng live đo hành vi hiện tại đều ĐẠT). Việc cần user quyết: **(A)** chốt lại ảnh chuẩn cho bản hiện tại (sau khi xem diff) hay **(B)** giữ làm mốc lịch sử + coi cổng là tham khảo.

---

## G. ẢNH CHỤP TRẠNG THÁI CỔNG — 23/09/2026 (dùng cho final audit P14-05)

| Nhóm | Cổng | Kết quả ĐO ĐƯỢC |
|---|---|---|
| Frontend | `node --import tsx --test tests/*.test.mjs` (96 tệp) | **570 · 569 PASS · 0 FAIL · 1 skip** ✅ |
| Frontend | `npx tsc --noEmit` | **0** ✅ |
| Frontend | `npm run lint` | **0 error** (202 warning) ✅ |
| Frontend | `npm run test:regression` | **69/69** ✅ |
| Frontend | `npm run test:workflow` | **PASSED** ✅ |
| Frontend | `npm run test:work-item` · `test:email` | **14/14** · **ĐẠT** ✅ |
| **Backend Java** | `mvn -pl web -am test` | **64/64 · 0 Failures · 0 Errors · BUILD SUCCESS** ✅ |
| Baseline | `verify:master-baseline` · `validate:artifact` | **ĐẠT** · **ĐẠT** (source preflight + built artifact) ✅ |
| Baseline | `verify:fingerprint` | **ĐẠT · VNTECH-FP-362A7B92DF4824AE** (512 tệp nguồn) ✅ |
| Baseline | `verify:css-baseline` | **ĐẠT** (dead classes=0 · dead vars=0 · dynamic contracts PASS) ✅ |
| DB | `probe-schema-drift` · `probe-java-sql-schema` · `p2-reference-integrity` | **0 lệch** · **0 sai** · **15/15 cặp, 0 mồ côi** ✅ |
| LIVE | 10 probe trên stack thật (Java 18081 · UI 8787 · proxy 9000) | **10/10 ĐẠT** (p5 4/4 · p6-07 4/4 · p6-08 3/3 · money 14/14 · UI-action 170 · work-center ĐẠT · layout ĐẠT · live-stack ALL PASS · security-rbac ĐẠT · module-perm ĐẠT) ✅ |
| **CÒN ĐỎ** | `probe-css-budget` (canonical.css 967 > 930) · `probe-visual-regression` (ảnh chuẩn 20/09) · `test:release-static` (**SHA256 manifest lệch**) | 🟡 **3 mục — TẤT CẢ đã chứng minh ⛔ KHÔNG phải lỗi sản phẩm**, chờ user chọn cách xử lý |

> 🔴 **ĐÍNH CHÍNH CHÍNH BẢN ĐÍNH CHÍNH (23/09/2026 — ⚠️ TÔI ĐÃ SAI, xin ghi rõ):** khối này TRƯỚC ĐÂY tôi viết «nguyên nhân `drizzle/0080 datetime()` là **SAI**» — **CHÍNH TÔI SAI**: tôi chỉ đo `datetime()` **rỗng tham số** (0 lần) mà ⛔ không đọc **bộ kiểm** ⇒ bộ kiểm ở `scripts/migrate-postgres.mjs:228` bắt **MỌI** mẫu `\bdatetime\s*\(` (kể cả **`datetime(3)`** — tệp 0080 có **6 lần**). ⇒ **Ghi chú GỐC («`drizzle/0080 datetime()`») là ĐÚNG về bản chất.**
> **CỔNG NÀY CÓ 3 TẦNG — đã đi lần lượt qua từng tầng bằng SỐ ĐO:**
> ```text
> TẦNG ①  Package/source verifier  : LỖI «SHA256 không khớp: .ai/orchestration/MASTER_STATE.md»
>         ⇒ nguyên nhân: MANIFEST_SHA256.txt chứa 15 đường dẫn TỆP TRẠNG THÁI (.ai/** 5 + .memsearch/** 10)
>         ⇒ ĐÃ VÁ: thêm `.ai`, `.memsearch` vào `excludedTopDirs` của `scripts/generate-release-manifest.mjs`
>                   (⛔ KHÔNG đổi chính sách: chính tệp đó ghi «volatile cache/log/update-backup state excluded»)
>         ⇒ SINH LẠI manifest: 7.579 → **7.561** dòng · dòng `.ai/` = **0** · dòng `.memsearch/` = **0** ✅
> TẦNG ②  Migration verification  : LỖI «0080_phase_p4_workflow_multi_identity.sql: con cu phap SQLite sau khi
>         chuyen doi (datetime()): CREATE TABLE IF NOT EXISTS "workflow_definitions" (»
>         ⇒ nguyên nhân: bộ chuyển đổi ⛔ THIẾU ánh xạ kiểu `datetime(n)` (MySQL) → `timestamp(n)` (PostgreSQL)
>         ⇒ ĐÃ VÁ: thêm `.replace(/\bdatetime\s*\(\s*(\d+)\s*\)/gi, "timestamp($1)")` TRƯỚC quy tắc `datetime('now')`
>         ⇒ CHẠY LẠI: `PostgreSQL migration preflight: DAT · 221 files · 852 statements` · **EXIT = 0** ✅
> TẦNG ③  Brand fingerprint       : ⚠️ nay báo «KHÔNG ĐẠT · Brand fingerprint verifier» — VÌ tôi vừa SỬA 2 tệp
>         nguồn (`scripts/generate-release-manifest.mjs`, `scripts/migrate-postgres.mjs`) ⇒ **danh tính phát hành
>         đã đổi** ⇒ cần LÀM MỚI bằng `node tools/gd-cycle.mjs "<NHÃN>" --no-build` rồi `npm run build`.
>         ⛔ TÔI ⛔ KHÔNG tự làm: đó là **thao tác danh tính phát hành** (đổi `VNTECH-FP-…` + cần build lại để
>         :8787 khớp) ⇒ thuộc QUYẾT ĐỊNH của user (mục ⑤.5 của brief).
> ```
> ⇒ **TRẠNG THÁI SAU CÙNG (⚠️ ĐÃ HOÀN TÁC — đọc kỹ):** 2 bản vá #31/#32 **đã viết + ĐÃ KIỂM CHỨNG** (tầng ①: manifest 7.579 → **7.561** dòng, 0 dòng tệp trạng thái ✅ · tầng ②: preflight **EXIT 0**, «221 files · 852 statements» ✅) **NHƯNG SAU ĐÓ ĐÃ `git checkout` HOÀN TÁC** — vì `scripts/` nằm trong **ROOT_DIRS của fingerprint** ⇒ vá xong thì tầng ③ «Brand fingerprint» đỏ, mà **làm mới danh tính phát hành là quyết định của user** (⑤.5).
> ✅ **ĐÃ KIỂM LẠI SAU HOÀN TÁC:** `git status --porcelain` 3 tệp = **rỗng (sạch)** · `npm run verify:fingerprint` ⇒ **ĐẠT · `VNTECH-FP-7A4835FBC5BCBCA7` · source 513 tệp** ⇒ repo về đúng trạng thái nhất quán trước đó.
> 📄 **BẢN VÁ ĐƯỢC LƯU LẠI ĐỂ ÁP LẠI TRONG 1 BƯỚC:** **`docs/dsh/MT2-PATCH-31-32.md`** (đích sửa chính xác · regex · lệnh kiểm · **quy trình 4 bước đúng thứ tự** · ⚠️ hệ quả: mã FP sẽ đổi + phải build lại + cập nhật hồ sơ).
> ⚠️ Ghi chú: dòng §H.1 (bảng cổng) ghi «tầng ① (SHA256 manifest) đã ĐẠT: **7.579** tệp» là **số ĐO LÚC ĐÓ** — hiện manifest vẫn **7.579** dòng (vì đã hoàn tác).

---

## H. ĐO THÊM BỘ PROBE **LUỒNG LIVE** (23/09/2026) — 12 probe

**Kết quả: 7 ✅ ĐẠT · 1 🔧 đã sửa công cụ · 4 ⚠️ (3 CŨ-SHAPE + 1 GHI NHẬN DỮ LIỆU).**

| Probe | Kết quả đo được | Phân loại |
|---|---|---|
| `probe-wf05-doi-quy-trinh` | **5/5 ĐẠT · 0 HỎNG** | ✅ |
| `probe-wf-muahang-standard` | ĐẠT (chế độ khảo sát; ⚠️ cần `--apply` để thi hành chuỗi) | ✅ |
| `probe-stock-issue-flow` · `probe-supplier-crud-flow` · `probe-project-screen` · `probe-nonadmin-access` · `probe-material-list` | ĐẠT (nonadmin tự dọn user probe) | ✅ |
| `probe-wf04-hop-nhat-2-he` | 🔧 **ĐÃ SỬA CÔNG CỤ → EXIT=0 ✅**: bản cũ `SELECT … version … FROM workflow_definitions` — ĐO `SHOW COLUMNS` ⛔ **không có cột `version`** ⇒ MySQL `ERROR 1054` làm probe chết, rồi `ReferenceError: ver`. Đã gỡ cột không tồn tại (⛔ không bịa cột). **Kết luận (theo thiết kế, đã ghi trong probe):** `approval_stage_catalog` là **CHÍNH** cho Phiếu đề nghị (100 dòng `approvals` dùng snapshot) · `workflow_*` là **CHÍNH** cho 3 module mới (PO · xuất kho · nhập kho) · **snapshot là cầu nối** ⇒ đổi hệ nào cũng ⛔ không làm lệch phiếu đang chạy · **⛔ KHÔNG xoá hệ nào, KHÔNG di trú 100 dòng đang chạy** | 🔧 CÔNG CỤ (đã sửa) |
| `probe-wf02-snapshot-nguoi-chi-dinh` | **4/5 ĐẠT · 1 HỎNG**: «mọi phiếu duyệt đều có SNAPSHOT vai trò/mode» = **252/259 dòng** ⇒ **7 dòng thiếu snapshot** (các ca khác ĐẠT: người chỉ định là trường của TỪNG phiếu 251/259 · đổi catalog ⛔ không đổi phiếu cũ · mã nguồn CÓ ghi 2 cột snapshot) | ⚠️ **GHI NHẬN DỮ LIỆU THẬT** ⇒ 7 dòng cũ thiếu snapshot (khả năng: tạo TRƯỚC khi có cột). Đề xuất: **(A)** backfill 7 dòng bằng script có kiểm soát (cần user OK vì là DML) hoặc **(B)** ghi nhận là dữ liệu lịch sử, ⛔ không đụng |
| `probe-team-screen` | **4 mục HỎNG** vì đòi tab cũ «Tổng quan / Thành viên / Đơn từ», thực tế màn Tổ đội nay **6 tab**: `Thông tin(1) · Nhân sự(6) · Dự án(1) · Kho · Cấp phát(22) · Lịch sử` (T-125/MT2 rework) | 🔵 **CŨ-SHAPE** (⛔ không phải lỗi) ⇒ cập nhật kỳ vọng theo 6 tab thật |
| `probe-material-tabs` | **3 mục HỎNG** vì đòi tab «Danh mục vật tư / So sánh-Đối chiếu BOQ / Soát trùng Alias», thực tế `Danh sách vật tư · Danh mục nhóm con mã vật tư gốc · Mã vật tư gốc` | 🔵 **CŨ-SHAPE + ĐÚNG MT2 §2**: 2 tab «So sánh/Đối chiếu BOQ» + «Soát trùng Alias» thuộc phần **TẠM BỎ QUA** (⇒ `MT2-P11-05` SKIPPED) — probe kỳ vọng tính năng ⛔ chưa được yêu cầu làm |
| `probe-request-page` | ~~6 mục HỎNG~~ ⇒ **ĐẠT ✅ sau khi viết lại** (xem §H.3) | ✅ |
| `probe-p2-live-approval` | 🔧 **ĐÃ SỬA CÔNG CỤ → ĐẠT ✅ (EXIT=0) · «KẾT LUẬN: ĐẠT — 4/4 phép đo có bằng chứng HTTP/DB THẬT»** — bản cũ `break` ngay khi 1 tài khoản demo đăng nhập hỏng ⇒ probe DỪNG dù vẫn đủ tài khoản khác. **ĐO LIVE 7 tài khoản demo**: **6/7 ĐĂNG NHẬP ĐƯỢC** (ksda.demo→ksda/engineer · nvdademo→da_nv/project · nvkhdemo→kh_nv/procurement · trdademo→da_truong/project · tkhodemo→thu_kho/warehouse · engineer.demo→ksda/engineer) và **1/7 hỏng: `thukydemo` → HTTP 401** (⛔ mật khẩu lệch theo seed — hành vi **đúng**: `login` từ chối khi sai mật khẩu, ⛔ không phải lỗi sản phẩm). **Đã sửa**: bỏ `break`, BỎ QUA tài khoản hỏng + chỉ chặn khi **< 2 phiên**, và bổ sung 2 tài khoản theo **số đo** (trdademo · tkhodemo) ⇒ nay chạy đủ **4/4 phép đo** (≥2 vai trò khác nhau · `create_request` ⛔ không còn 403 · luật «người tạo không tự duyệt» · cột `audit_logs.result`) ⇒ **bổ sung bằng chứng LIVE cho LUỒNG ② (TRUNG TÂM PHÊ DUYỆT) của §25** | ✅ XONG |
| | ➡️ Kết quả đã ghi ở §H.3 (viết lại) + nêu trên | ✅ |

### H.1 — ĐỢT PROBE THỨ 2 (7 probe luồng/đối chiếu): 4 ĐẠT · **1 sửa công cụ → ĐẠT** · 2 cần phân định

| Probe | Kết quả đo | Phân loại |
|---|---|---|
| `probe-staff-full` | **ĐẠT ✅** | ✅ |
| `probe-request-no-project` | **ĐẠT ✅** — «LẬP ĐƯỢC + THẤY TRONG DANH SÁCH + MỞ ĐƯỢC ĐỂ DUYỆT khi KHÔNG chọn dự án/HĐ/BOQ/kho» | ✅ |
| `probe-q10-materials-system` | ĐẠT (exit 0) — 18 mã lệch/36 mã là **kết quả ĐO** mà probe tự kết luận, ⛔ không phải lỗi cổng | ✅ |
| `probe-retry-email` | ĐẠT — «action chạy được — ⛔ KHÔNG xác nhận được giả thuyết lỗi bảng» ⇒ **giả thuyết lỗi bị BÁC BỎ**, ⛔ không phải lỗi | ✅ |
| `probe-live-rolebase` | 🔧 **ĐÃ SỬA CÔNG CỤ → ĐẠT ✅ (EXIT=0)**: «KẾT LUẬN: roleBase trả về ĐÚNG mã ENGINE ✅ (TASK-021 có hiệu lực thật)» — **9/9 tài khoản ĐÚNG** (`admin→admin` · `ksda→engineer` · `da_nv`/`da_truong→project` · `kh_nv`/`kh_truong→procurement` · `thu_kho→warehouse` · `cht→commander`), 1 bỏ qua (`thukydemo` 401). **Bệnh cũ**: probe gọi `POST {action:"me"}` — ĐO LẠI thấy action này nay trả **HTTP 403** (nvkhdemo) / **HTTP 400** (admin) ⇒ bản cũ đọc ra role/roleBase **RỖNG cho CẢ 10 tài khoản** (kể cả `admin`) rồi kết luận oan «còn tài khoản trả roleBase sai». Danh tính phiên nay lấy bằng **GET `/api/system` ⇒ `data.user`** (đo được `kh_nv/procurement` · `admin/admin` ⇒ **ĐÚNG**) ⇒ **sửa cách ĐỌC, ⛔ không sửa sản phẩm** | ✅ XONG |
| `probe-q9-payment-ui-db` | **2 ĐẠT · 1 ĐIỀU KIỆN DỮ LIỆU**: `✅ quá hạn UI ↔ CSDL` (299.222.222đ) · `✅ tổng kế hoạch UI ↔ CSDL` (673.250.123đ) · ⚠️ `tổng kế hoạch (673.250.123đ) ≠ GIÁ TRỊ HỢP ĐỒNG (673.250.000đ)` — **lệch 123đ** (≈0,000018%). ⛔ **KHÔNG phải lỗi mã** (UI↔CSDL KHỚP nhau — đó mới là bất biến thật); đây là **khác biệt DỮ LIỆU** giữa Σ mốc thanh toán và giá trị hợp đồng ⇒ **cần quyết định nghiệp vụ**: (A) chấp nhận làm tròn theo mốc (ghi nhận) hoặc (B) chỉnh số tiền mốc (DML — cần user OK) | ⚠️ **DỮ LIỆU — chờ user** |
| `probe-task049-owner-checks` | ⛔ **BỊ CHẶN BỞI MÔI TRƯỜNG**: probe cần tài khoản `thukydemo` — tài khoản này **401** (mật khẩu lệch seed) ⇒ probe dừng trước khi in kết luận. Chính header probe đã ghi: owner BƯỚC 2 là `thukydemo` và dòng phạm vi của tài khoản này trỏ tới project **KHÔNG TỒN TẠI** `PRJ_fdbfab20-bf1f-0000-0000-000000000000` (**known issue #51 / quyết định D5** — ⛔ không tự sửa dữ liệu) | ⚠️ **MÔI TRƯỜNG/DỮ LIỆU — chờ user** |

> **Tổng đợt này**: 4 ✅ · 1 🔧 (sửa công cụ → ĐẠT) · 2 ⚠️ **đều là DỮ LIỆU/MÔI TRƯỜNG, ⛔ không phải lỗi sản phẩm** ⇒ **0 lỗi sản phẩm**.

### H.1.1 — TRUY VẾT TẬN GỐC ca `thukydemo` 401 (ĐỌC CSDL, ⛔ không sửa dữ liệu)
| Tài khoản | role | active | hash dài | tiền tố hash | `updated_at` | `password_reset_at` |
|---|---|---|---|---|---|---|
| `admin` | admin | 1 | 111 | `pbkd` | 2026‑09‑14 16:22:34 | 2026‑09‑14 16:04:41 |
| `nvkhdemo` (đăng nhập OK) | kh_nv | 1 | 111 | `pbkd` | 2026‑09‑21 10:02:13 | NULL |
| **`thukydemo` (401)** | thuky | **1** | **111** | **`pbkd`** | **2026‑09‑21 15:20:05** | **NULL** |

**KẾT LUẬN TẬN GỐC:** tài khoản **tồn tại**, **active=1**, **cùng định dạng hash** với tài khoản chạy được (dài 111 · tiền tố `pbkd`), ⛔ không có bất thường định dạng; chỉ khác ở chỗ `updated_at = 21/09 15:20` ⇒ **mật khẩu đã được ĐỔI trong CSDL thật ngày 21/09/2026** (và `password_reset_at = NULL` ⇒ do **chính người dùng đổi**, ⛔ không phải admin reset). ⇒ Đây **⛔ KHÔNG phải lỗi sản phẩm**: action `login` từ chối đúng vì mật khẩu demo `Vntech@2026` không còn đúng cho tài khoản đó.
**Cần user quyết**: (A) cho biết mật khẩu hiện tại của `thukydemo` để chạy 2 cổng `probe-task049-owner-checks` + nhánh director của `probe-p2-live-approval`; hoặc (B) **uỷ quyền đổi mật khẩu** tài khoản demo này (là ghi CSDL ⇒ cần user OK); hoặc (C) chấp nhận bỏ qua nhánh dùng tài khoản đó (các nhánh khác đã ĐẠT: `probe-p2-live-approval` 4/4 · `probe-live-rolebase` 9/9).
> **Chuỗi công cụ đã sửa trong phiên: 13 mục** (`action-module-parity` · `role-code-scan` · `kp89` · `kp96` · `write-map-drift` · `wf04` · `work-center` ×2 · `team-screen` · `material-tabs` · `request-page` · `p2-live-approval` · `live-rolebase`).

### H.1.2 — KIỂM CHỨNG LUẬT «Σ mốc thanh toán = GIÁ TRỊ HỢP ĐỒNG» CÓ ĐƯỢC CƯỠNG CHẾ TRONG MÃ KHÔNG?
**Phép quét (đọc mã, ⛔ không sửa):** tìm trong `java-backend/**/*.java` + `lib` + `scripts` mọi chỗ **so tổng mốc kế hoạch với giá trị hợp đồng** (`totalPlanned` · `plannedTotal` · `sum(plannedAmount) ⇄ contractValue` · chuỗi «tổng kế hoạch») ⇒ **⛔ KHÔNG có chỗ nào**.
**Kết luận:** 2 bất biến **THẬT** của Q9 đều **ĐẠT** (`quá hạn UI ↔ CSDL` · `tổng kế hoạch UI ↔ CSDL`); còn điều kiện «Σ mốc = giá trị hợp đồng» **⛔ không được cưỡng chế ở bất kỳ tầng nào** (không có trong mã, không tài liệu hoá) ⇒
- ⛔ **KHÔNG phải lỗi mã** (⛔ không có luật nào bị vi phạm);
- ❓ **Đây là CÂU HỎI NGHIỆP VỤ**: hợp đồng có bắt buộc Σ mốc = giá trị HĐ (phần lệch **123đ** là do làm tròn từng mốc) hay không ⇒ **theo GOAL §14 ⛔ KHÔNG tự bịa luật**, chờ user chốt (A) chấp nhận làm tròn · (B) chỉnh số mốc (DML) · (C) bổ sung luật kiểm tra ở backend (là **tính năng mới** ⇒ phải được yêu cầu trước khi làm).

### H.1.3 — ĐO LẠI CỔNG SAU TOÀN BỘ ĐỢT (xác nhận không hồi quy)
| Cổng | Kết quả |
|---|---|
| 570 hợp đồng frontend | **569 PASS · 0 FAIL · 1 skip** ✅ |
| Java `mvn -pl web -am test` | **64/64 · 0 Failures · 0 Errors · BUILD SUCCESS** ✅ |
| `tsc` · `lint` · css-baseline · master-baseline | **0** · **0 error** · **ĐẠT** (dead classes=0) · **ĐẠT** ✅ |
| fingerprint · build · artifact | **ĐẠT** `VNTECH-FP-7A4835FBC5BCBCA7` · build **exit 0** · `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ |
| **LIVE** | 9/9 (bộ chính) + `p2-live-approval` **4/4** + `live-rolebase` **9/9** + `request-page` **ĐẠT** ✅ |
| **Tổng kết lỗi SẢN PHẨM đang đỏ** | **0** — trong phiên đã **tìm và vá 1 lỗi thật** (nút «Thu gọn khối» vô tác dụng) + sửa **13 lỗi CÔNG CỤ/PROBE** |

> ⚠️ **GHI CHÚ SỬA HỒ SƠ (TRUNG THỰC — đọc kỹ trước khi trích dẫn):**
> 1. Trong lúc chèn 3 tiểu mục đợt-probe-2 tôi **đã vô tình ghi đè TIÊU ĐỀ** của tiểu mục truy vết `thukydemo` ⇒ **ĐÃ KHÔI PHỤC** (nội dung bảng `thukydemo` ⛔ chưa từng mất).
> 2. **ĐÃ ĐÁNH SỐ LẠI cho khớp thứ tự vật lý** (⛔ **không** di chuyển khối nội dung lớn): các tiểu mục nay đọc **§H → §H.1 → §H.1.1 → §H.1.2 → §H.1.3 → §H.2 → §H.3** đúng theo thứ tự trong tệp.
>    - **Quy đổi số CŨ → MỚI** (để tra các bản tin/báo cáo cũ): `§H.1` (sự cố mã hoá) → **`§H.2`** · `§H.2` (lỗi thật nút «Thu gọn khối») → **`§H.3`** · `§H.3` (đợt probe 2) → **`§H.1`** · `§H.3.1/§H.3.2/§H.3.3` → **`§H.1.1/§H.1.2/§H.1.3`**.
> 3. Mọi **số đo/nội dung** của cả 7 tiểu mục đều là số đo THẬT của phiên; chỉ **số thứ tự tiểu mục** là đã đổi để đọc theo thứ tự tệp.
| | **Số đo LIVE của `probe-request-page` (sau khi trỏ đúng khung `.overlay.page-mode`)**: `{"found":true,"w":1561,"h":808,"vw":1576,"vh":808,"left":0,"top":0,"borderRadius":"0px","hasBack":true,"backText":"← Quay lại","wrapperClass":"overlay page-mode",…,"hasApprovalText":true,"buttonLabels":["×","⌃ Thu gọn khối","← Quay lại","Xem chi tiết PO","◉ Tổng hợp giao nhận (","↑ TẢI LÊN","⇩ Tải Excel","⇩ Tải PDF"],"bodyScrollable":{"overflowY":"auto","scrollH":1605,"clientH":682}}` ⇒ **CHẾ ĐỘ TRANG ĐÚNG** (chiếm gần hết màn, ⛔ không bo góc) · **nút «← Quay lại» CÓ** · **nút «⌃ Thu gọn khối» CÓ** (lớp `page-collapse`) · **khối «Tiến trình phê duyệt» CÓ** · **thân cuộn riêng** ⇒ 6 mục "HỎNG" là do probe tìm ở khung cũ `.request-drawer.is-page` + đòi `<header>` sticky (mẫu mới dùng `.edm-head` + thân `.edm-body` cuộn) | ⛔ **không sửa mã sản phẩm** |

> **Việc lượt kế (không cần duyệt):** cập nhật 3 probe CŨ-SHAPE theo hiện trạng (`team-screen` 6 tab · `material-tabs` theo §2 ⛔ bỏ 2 tab bị skip · `request-page` theo bố cục hiện tại) ⇒ đưa về ĐẠT; và **xin user quyết** ca 7 dòng thiếu snapshot (DML).

### H.2 — ⚠️ SỰ CỐ CÔNG CỤ ĐÃ SỬA: 1 tệp bị sai mã hoá khi vá bằng PowerShell ⇒ ĐÃ KHÔI PHỤC
- Trong lúc vá `tools/probe-request-page.mjs` tôi dùng vòng `Get-Content -Raw` → `[System.IO.File]::WriteAllText(UTF8)` ⇒ shell đọc tệp UTF-8 như ANSI rồi ghi lại ⇒ **double-encode toàn bộ tiếng Việt** (`Xem chi tiết` → `Xem chi tiÃ¡ÂºÂ¿t`).
- **ĐÃ SỬA**: `git checkout -- tools/probe-request-page.mjs` ⇒ tệp về **nguyên trạng bản HEAD**: `node --check` ✅ · chuỗi tiếng Việt đúng trở lại («Xem chi tiết») · `git status` sạch cho tệp này. Bản vá dở (chưa hoàn chỉnh) cũng được **bỏ luôn** ⇒ ⛔ không để lại tệp nửa vời.
- **BÀI HỌC (ghi để không tái diễn):** ⛔ **KHÔNG** dùng PowerShell `Get-Content`/`Set-Content`/`WriteAllText` để sửa tệp có tiếng Việt; dùng **công cụ edit** (an toàn UTF-8) hoặc Node `readFileSync/writeFileSync` với `"utf8"`.
- **Trạng thái `probe-request-page`**: 🔵 **cần viết lại** theo cấu trúc `.overlay.page-mode` + `.edm-*`; ⛔ **không phải lỗi sản phẩm** (số đo LIVE ở bảng trên đã chứng minh chế độ trang · nút «← Quay lại» · nút «⌃ Thu gọn khối» · khối «Tiến trình phê duyệt» · thân cuộn ĐỀU CÓ).
- ✅ **5 tệp probe khác đã kiểm**: `team-screen` · `material-tabs` · `wf04` · `work-center` · `catalog-drift` ⇒ ⛔ **không** bị lỗi mã hoá (đã sửa bằng công cụ edit).

### H.3 — 🔴 **PHÁT HIỆN 1 LỖI THẬT** khi viết lại `probe-request-page`: NÚT «THU GỌN KHỐI» VÔ TÁC DỤNG ⇒ **ĐÃ SỬA MÃ**
**Bằng chứng (2 lớp, độc lập):**
1. **Mã nguồn**: `app/screens/RequestDrawer.tsx` khai `const [collapsed, setCollapsed] = useState(false)`, nút `.page-collapse` có `onClick={() => setCollapsed(v => !v)}` — nhưng grep toàn tệp cho thấy `collapsed` **chỉ được dùng để đổi NHÃN của chính nút** («⌃ Thu gọn khối» ⇄ «⌄ Mở rộng khối»), ⛔ **không** được dùng vào việc render ⇒ bấm nút **⛔ không ẩn/thu gọn khối nào**.
2. **LIVE**: bấm nút trong trình duyệt thật ⇒ nhãn **⛔ không đổi**, thân chi tiết **682px → 682px**, `scrollHeight` **1605 → 1605** (⛔ không co lại).

**ĐÃ SỬA (an toàn, ⛔ không xoá tính năng):**
- `RequestDrawer.tsx`: `<div className="drawer-body">` → `<div className={collapsed ? "drawer-body sections-collapsed" : "drawer-body"}>`
- `app/globals.css`: thêm `.sections-collapsed > .drawer-section { display:none; }` (ẩn KHỐI CHI TIẾT, **giữ** khối tóm tắt đầu trang) — đặt ngay cạnh định nghĩa `.drawer-section`.
**Bằng chứng sau sửa**: `npx tsc --noEmit` **0** · `verify:css-baseline` **ĐẠT** (dead classes=0) · `verify:master-baseline` **ĐẠT** (css `364041B` ≤ `400653`) · **toàn bộ 570 hợp đồng = 569 PASS · 0 FAIL** · fingerprint làm lại theo công cụ chính thức ⇒ **ĐẠT · VNTECH-FP-7A4835FBC5BCBCA7** (513 tệp nguồn) · rebuild bundle rồi đo lại LIVE (ghi ở báo cáo lượt).
⚠️ **Lưu ý quy trình đã học**: `npm run build` chạy `verify-vntech-fingerprint` **ĐẦU TIÊN** ⇒ sửa mã nguồn xong **phải chạy `tools/gd-cycle.mjs … --no-build`** (làm mới identity) **rồi mới build**, nếu không build sẽ dừng ở bước fingerprint (đã gặp và xử lý đúng thứ tự trong lượt này).

**Kiểm chứng sau sửa (đã có):**
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0** ✅ |
| `verify:css-baseline` · `verify:master-baseline` | **ĐẠT** (dead classes=0) · **ĐẠT** (`css=364041B` ≤ 400653) ✅ |
| Toàn bộ hợp đồng (96 tệp) | **570 · 569 PASS · 0 FAIL** ✅ |
| `verify:fingerprint` | **ĐẠT · VNTECH-FP-7A4835FBC5BCBCA7** (513 tệp) ✅ |
| `npm run build` | **exit 0** · `BUILT ARTIFACT VALIDATION: ĐẠT` ✅ |
| **Bundle được PHỤC VỤ có chứa bản vá** | HTML của `:8787` tham chiếu **`assets/page-C3s9lFmS.js`** — đúng tệp trong `dist/client/assets` **chứa `sections-collapsed`** (cùng `index-DoBvlB0N.css`) ✅ (đã khởi động lại ĐÚNG UI PID 6000 → PID 18852) |
| ⚠️ **CHƯA CHỐT**: đo lại hành vi bấm nút bằng chuột THẬT | ✅ **ĐÃ CHỐT — đo bằng CDP `Input.dispatchMouseEvent` (click chuột thật)**: `✅ Có nút thu gọn khối — CLICKED_AT_303,189` · `✅ Bấm thu gọn ĐỔI NHÃN nút — "⌃ Thu gọn khối" → "⌄ Mở rộng khối"` · `✅ Thu gọn làm thân chi tiết NGẮN LẠI — bodyScroll 1605 → 375 · bodyH 682 → 375` · `✅ Mở rộng lại được` ⇒ **BẢN VÁ ĂN THẬT**; kết quả «không đổi» trước đó là do `element.click()` **không phải** click chuột thật (lỗi phương pháp đo, ⛔ không phải lỗi sản phẩm) | ✅ **XONG** |

> **➕ QUÉT LAN LỚP LỖI TƯƠNG TỰ (state chết)** — quét **55 tệp `.tsx`/`.ts`** trong `app/` tìm `const [x, setX] = useState(...)` mà biến `x` **⛔ không bao giờ được ĐỌC** ⇒ **0 ca**. ⚠️ **Giới hạn**: phép quét chỉ bắt được state *hoàn toàn không đọc*; ca đã vá ở `RequestDrawer` là loại **đọc nhưng chỉ để đổi NHÃN của chính nút** ⇒ muốn bắt đủ cần **phân tích AST** (⛔ ngoài phạm vi hiện tại) — nên ⛔ **không** kết luận «hết sạch» loại lỗi này. Script tạm đã **xoá** sau khi dùng; ⛔ không để lại tệp lạ (các `tools/_*.mjs` còn lại là script **có từ trước**).

### H.4 — QUÉT LAN LỚP LỖI «NÚT CHẾT» (nút bấm ⛔ không làm gì) — **0 ca THẬT**
**Phép quét:** 48 tệp `.tsx` trong `app/`, tìm mọi thẻ `<button>` **⛔ không `onClick`** · **⛔ không `type="submit"`** · **⛔ không `disabled`** ⇒ **41 hit thô**.
**Phân định từng nhóm (đo lại, ⛔ không kết luận vội) — cả 41 hit là DƯƠNG TÍNH GIẢ, 3 nhóm:**
1. **Nằm trong CHÚ THÍCH/tài liệu ví dụ** — vd `app/components/ui/ListToolbar.tsx:27` · `PermissionGuard.tsx:11` là **ví dụ trong khối comment đầu tệp** (⛔ không phải mã chạy).
2. **Nút nằm trong `<form>` và gửi bằng `onSubmit` của form** — đo lại: `page.tsx:639` `<button className="primary">＋ Giao việc</button></form>` · `1254` `GHI NHẬN HỒ SƠ</button></form>` · `1399` `Áp dụng toàn công ty</button></form>` ⇒ theo chuẩn HTML `<button>` trong form **mặc định là `submit`** ⇒ nút **CHẠY được**; `page.tsx:1244` thì **CÓ** `onClick` (đo: `onClick trong dòng? true`).
3. **JSX nén 1 dòng dài** ⇒ bộ so khớp cắt cụt thẻ mở, thấy như thiếu `onClick` trong khi handler nằm cùng dòng.
**KẾT LUẬN:** **⛔ 0 nút chết thật** theo phép quét này. ⚠️ **Giới hạn**: đây là quét **TĨNH** — muốn khẳng định «bấm nút X có hiệu lực» phải đo **HÀNH VI** (click chuột THẬT qua CDP rồi quan sát DOM/state) như đã làm cho nút «Thu gọn khối»; ⛔ chưa làm cho toàn bộ nút.

**Ghi nhận thêm cho §24 (responsive) — ĐÃ CÓ bằng chứng, ⛔ không cần việc mới:** `probe-layout-audit` **ĐẠT** và đo ở **ĐÚNG 3 kích thước**: `1920×1080 (desktop)` · `1366×768 (laptop)` · `768×1024 (tablet)` ⇒ yêu cầu «⛔ không chỉ desktop» của §24 đã được phủ bằng số đo thật.

### H.5 — ĐỢT PROBE THỨ 3 (14 probe parity/hợp đồng): **13 ĐẠT · 1 sửa công cụ → ĐẠT** · 0 lỗi sản phẩm
| Probe | Kết quả |
|---|---|
| `probe-action-registry-coverage` | ✅ «mọi action đều thuộc 1 trong 4 nhóm hợp lệ (public · module+capability · admin-only · …)» |
| `probe-action-role-parity` | ✅ «tầng vai trò hai bản KHỚP và đường ống `roleBase` đầy đủ» |
| `probe-action-scope-parity` | ✅ «mọi action JS kiểm phạm vi đều được Java kiểm tương ứng» |
| `probe-canonical-me-code-drift` | ✅ «Java HIỆN TẠI khớp JS trên toàn bộ đầu vào thử» |
| `probe-clause-parity` | ✅ «⛔ KHÔNG khoá nào lệch `ORDER BY`/`LIMIT`/kiểu `JOIN`» |
| `probe-statusbadge-parity` | ✅ «hai hàm cho kết quả GIỐNG HỆT với mọi giá trị đã kiểm» |
| `probe-java-sql-schema` · `probe-java-sql-live` | ✅ «⛔ không tham chiếu bảng/cột sai so với lược đồ ĐANG CHẠY» |
| `probe-action-parity` · `probe-action-coverage-controller` · `probe-column-parity` · `probe-bootstrap-keys` · `probe-rbac-gap` | ✅ exit 0 (các probe này in BẢNG ĐỂ RÀ thay vì 1 dòng kết luận) |
| **`probe-write-map-triage`** | 🔧 **ĐÃ SỬA CÔNG CỤ → EXIT=0 ✅**. **Bệnh cũ**: chỉ nhận SQL là **chuỗi TĨNH** (bỏ `%s`/`${`/nối chuỗi) ⇒ bảng do **adapter ghi bằng SQL động** hoặc ghi ở **tệp khác với nhánh `case`** bị coi là «Java ⛔ không ghi» ⇒ **kết luận OAN «THIẾU PORT THẬT: 3 bảng»** (`users` · `approval_stage_catalog` · `boq_versions`). **ĐO LẠI BẰNG MÃ (⛔ không suy luận)**: `users` ← `UserAdminStoreAdapter.java:94` `INSERT INTO users (id, employee_code, full_name, username, email, password_hash, role, department, …)` (+`SystemSettingsStoreAdapter.java:320`) · `approval_stage_catalog` ← `OpsTaskStoreAdapter.java:335` `INSERT INTO approval_stage_catalog (…)` · `boq_versions` ← `BoqStoreAdapter.java:100` `INSERT INTO boq_versions (…)` ⇒ **CẢ 3 ĐỀU CÓ GHI**. **Đã vá**: bổ sung tập «BẢNG nào ĐƯỢC GHI ở đâu đó trong `java-backend`» (quét `INSERT INTO`/`UPDATE … SET`/`DELETE FROM` trên **toàn văn tệp**, nhận cả SQL ĐỘNG) + tách nhóm mới **«◑ LỆCH CỘT/GHI KHÁC NHÁNH (bảng CÓ ghi ở Java ⇒ cần đọc mã)»** thay vì gán oan «thiếu port». **Kết quả sau vá**: `⚠ THIẾU PORT THẬT` = **0 bảng** · `◑ LỆCH CỘT/GHI KHÁC NHÁNH` = **3 bảng** (18 cặp bảng–cột; ⚠️ **vẫn cần đọc mã**, ⛔ chưa kết luận là đúng/sai) · `◐ HỖN HỢP` = 0 · `○ CHƯA PORT` = **2 bảng** (`work_item_comments` · `work_item_participants` — **đúng Strangler Fig**, chưa port theo kế hoạch) | ✅ XONG |

> **Tổng sau 3 đợt probe (33 probe đã chạy trong phiên):** **0 lỗi sản phẩm** · **14 lỗi CÔNG CỤ/PROBE đã sửa** (`action-module-parity` · `role-code-scan` · `kp89` · `kp96` · `write-map-drift` · `wf04` · `work-center` ×2 · `team-screen` · `material-tabs` · `request-page` · `p2-live-approval` · `live-rolebase` · **`write-map-triage`**).

### H.6 — 🔴 ĐỌC MÃ 3 CẶP «LỆCH CỘT» ⇒ **3 KHE HỞ GHI CỘT THẬT (parity ghi JS ⇄ Java)** — ⛔ chưa sửa, cần quyết định
Sau khi vá `probe-write-map-triage`, 3 bảng bị gắn nhãn «◑ LỆCH CỘT/GHI KHÁC NHÁNH» chỉ còn **đúng 3 cặp**; đã **mở mã + đo lược đồ** cho từng cặp (⛔ không suy luận):

| # | Bảng . cột | Lược đồ DB | JS có ghi | **Java có GHI?** | Java có ĐỌC? | Bằng chứng |
|---|---|---|---|---|---|---|
| 1 | `users.avatar_url` | ✅ có | ✅ | ⛔ **KHÔNG có BẤT KỲ** `INSERT`/`UPDATE` nào | ✅ `BootstrapDataAdapter:914` · `:1252` (`u.avatar_url AS avatarUrl`) | còn `UserJpaEntity:52` `@Column(name="avatar_url")` ⇒ có ánh xạ entity nhưng ⛔ không có đường ghi JDBC; `UserAdminStoreAdapter:94` `INSERT INTO users (…)` **⛔ không có `avatar_url`** |
| 2 | `approval_stage_catalog.stage_kind` | ✅ có | ✅ | ⛔ **KHÔNG** — `OpsTaskStoreAdapter.insertApprovalStage` (`INSERT … (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at)`) **⛔ thiếu `stage_kind`** | ✅ `RequestStoreAdapter:171-178` `COALESCE(stage_kind,'approval') … WHERE active=1 AND stage_kind='approval'` | **cùng LỚP LỖI mà `TASK-041` từng vá** (bản cũ thiếu cả `approval_mode`/`sla_hours`/`sort_order`) |
| 3 | `boq_versions.approved_at` | ✅ có | ✅ | ⛔ **KHÔNG** — các lệnh `approved_at` trong Java thuộc **bảng khác**: `BoqStoreAdapter:481` `UPDATE boq_material_components SET … approved_at=?` · `:492` `INSERT INTO boq_material_components (… approved_at …)` · `:597` `project_boq_items(… variation_approved_at …)` | ✅ `BootstrapDataAdapter:713` `v.approved_at AS approvedAt` (nguồn `boq_versions v`) | ⛔ không có `UPDATE boq_versions … approved_at` / `INSERT INTO boq_versions (… approved_at …)` |

**ĐÁNH GIÁ TÁC ĐỘNG (đo được, ⛔ không phóng đại):**
- ① `avatar_url`: nếu đường ghi hồ sơ người dùng đi qua Java ⇒ **ảnh đại diện ⛔ không lưu được** (đọc ra vẫn NULL). Cần đo LIVE bằng 1 lần ghi thử **có kiểm soát** mới kết luận chắc (⛔ tôi chưa ghi thử vì đó là thay đổi dữ liệu).
- ② `stage_kind`: rủi ro **lệch nghiệp vụ** — bước có `stage_kind` khác `'approval'` (vd chuỗi duyệt **hồ sơ/văn bản** theo chỉ đạo 21/09) nếu được tạo qua Java sẽ lưu **NULL** ⇒ mọi truy vấn `AND stage_kind='approval'` ⛔ **không lọc được** ⇒ bước đó **lọt vào chuỗi duyệt phiếu**. (Đọc có `COALESCE(…,'approval')` nên ca NULL bị coi là `approval`.) **Đây là khe hở nghiêm trọng nhất trong 3 cặp.**
- ③ `boq_versions.approved_at`: mốc duyệt phiên bản BOQ ⛔ không được ghi ⇒ màn/bao cáo dùng `approvedAt` sẽ **trống**.

**PHÂN LOẠI:** 🔴 **LỖI SẢN PHẨM thật (khe hở parity ghi cột)** — ⛔ **không** phải lỗi công cụ. Theo **GOAL §39** (bug không thuộc task đang làm ⇒ **lập task riêng**, ⛔ không tự mở rộng phạm vi vô hạn) ⇒ **ĐỀ XUẤT** thêm **1 dòng task mới** (⚠️ **cần user duyệt vì đổi mẫu số 100 → 101**, giống cách `MT2-P14-03b` đã được thêm trước đây):
> **`MT2-P14-06`** *(đề xuất)* — **Vá 3 khe hở GHI CỘT JS ⇄ Java**: `users.avatar_url` · `approval_stage_catalog.stage_kind` · `boq_versions.approved_at` (thêm cột vào đúng câu `INSERT`/`UPDATE` của Java + test hợp đồng khoá cột + đo LIVE).
> **Lựa chọn**: **(A)** duyệt thêm task & tôi vá ngay (kèm test khoá cột) · **(B)** ⛔ không vá, chỉ ghi nhận vào báo cáo `P14-05` như «khe hở parity đã biết» · **(C)** chỉ vá ca ② `stage_kind` (rủi ro nghiệp vụ cao nhất) trước.

#### H.6.1 — ĐO LIVE 3 CỘT ĐỂ CHỐT MỨC ĐỘ (⛔ không phóng đại, ⛔ không hạ nhẹ)
| # | Câu đo LIVE (CSDL `vntech_erp`) | Số đo | Mức độ & lý do |
|---|---|---|---|
| ② | `SELECT COALESCE(stage_kind,'(NULL)') kind, COUNT(*) FROM approval_stage_catalog GROUP BY stage_kind` | **`approval` = 5** · **`supply` = 3** — chi tiết: bước **1–5** = `approval` (bước 1 «CHT xác nhận nhu cầu» đang `active=0`); bước **101 «Lập & phát hành PO»** · **102 «Giao nhận»** · **103 «BCH xác nhận giao hàng»** = **`supply`** | 🔴 **CAO (nhưng ĐANG KHÔNG TỚI ĐƯỢC)**: cột **đang được DÙNG THẬT** với giá trị `supply`; Java ⛔ không ghi `stage_kind` khi insert/update ⇒ nếu bước 101/102/103 bị sửa qua đường Java thì `stage_kind` mất → NULL → `COALESCE(...,'approval')` biến thành `'approval'` ⇒ **3 bước KHO lọt vào chuỗi duyệt Phiếu đề nghị** (`RequestStoreAdapter` lọc `AND stage_kind='approval'`). **Chặn hiện tại**: action `save_approval_stage` đang trả **HTTP 403 «chưa khai báo quyền»** (đo bằng `probe-rbac-gap`) ⇒ ⛔ chưa khai thác được, **nhưng hễ action được cấp quyền là lỗi hiện ra** |
| ① | `SELECT COUNT(*), SUM(avatar_url IS NOT NULL AND avatar_url<>'') FROM users` | **19 user · 0 có avatar** | 🟡 **THẤP (tiềm ẩn)**: cột chưa được dùng trong dữ liệu thật ⇒ ⛔ chưa gây hậu quả quan sát được |
| ③ | `SELECT COUNT(*), SUM(approved_at IS NOT NULL) FROM boq_versions` | **4 phiên bản · 0 có `approved_at`** | 🟡 **THẤP (tiềm ẩn)**: mốc duyệt BOQ chưa từng được ghi ⇒ ⛔ chưa gây hậu quả quan sát được (⚠️ lưu ý: `boq_versions` ⛔ **không có cột `approved_by`** — đo bằng lỗi `ERROR 1054` khi tôi thử SELECT cột đó) |

**KHUYẾN NGHỊ (dựa trên số đo, ⛔ không tự quyết)**: ưu tiên **ca ② `stage_kind`** (đúng **lớp lỗi `TASK-041`** từng vá và có **dữ liệu thật `supply`** đang bị rủi ro) ⇒ nếu anh chọn **(A)** hoặc **(C)**, tôi sẽ: thêm `stage_kind` vào cả `INSERT` và `UPDATE` của `OpsTaskStoreAdapter` + **test hợp đồng khoá cột** + chạy `mvn test` + đối chiếu lại `probe-write-map-triage` (kỳ vọng ca ② về `0`) + ghi biên bản `P14-03`.

#### H.6.2 — ⚠️ **ĐÍNH CHÍNH CHÍNH TÔI** (đọc kỹ `INSERT` vs `UPDATE`) — rủi ro HẸP HƠN câu tôi nói ở §H.6.1
Ở §H.6.1 tôi viết «nếu bước 101/102/103 bị **SỬA** qua đường Java thì `stage_kind` mất» ⇒ **SAI về mặt SQL**: mở mã cho thấy
* `OpsTaskStoreAdapter.insertApprovalStage` — `INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at)` ⇒ **⛔ THIẾU `stage_kind`** ⇒ **bước MỚI tạo bằng Java sẽ có `stage_kind` = NULL**.
* `OpsTaskStoreAdapter.updateApprovalStage` — `UPDATE approval_stage_catalog SET stage_no=?,name=?,description=?,allowed_role_codes=?,approval_mode=?,sla_hours=?,auto_approve_on_submit=?,sort_order=?,updated_at=? WHERE id=?` ⇒ **⛔ thiếu `stage_kind` trong SET** — nhưng theo ngữ nghĩa SQL, **cột không nằm trong SET thì GIỮ NGUYÊN** ⇒ **SỬA bước ⛔ KHÔNG làm mất `stage_kind`**.
**⇒ RỦI RO ĐÚNG LÀ:** chỉ khi **TẠO BƯỚC MỚI** (INSERT) qua đường Java; ⛔ không phải khi sửa bước.

**Đo lại ③ `boq_versions` cho chính xác (cùng cách đọc):**
* `BoqStoreAdapter.insertBoqVersion` — `INSERT INTO boq_versions (id,project_id,contract_id,version_no,version_code,version_name,revision_type,source_file_name,status,active,effective_at,created_by,created_at,updated_at)` ⇒ **⛔ thiếu `approved_at`**.
* 3 câu `UPDATE boq_versions` duy nhất của Java (`:112` `SET active=0,status='superseded'` · `:539` `SET status=?,active=0` · `:657` `SET source_file_name=?`) ⇒ **⛔ KHÔNG câu nào set `approved_at`** ⇒ **Java ⛔ KHÔNG CÓ BẤT KỲ ĐƯỜNG NÀO ghi được `approved_at`** (chỉ JS ghi).
**⇒ ③ mức độ:** 🟠 **TRUNG BÌNH** — khi Strangler chuyển hẳn sang Java, trường này **vĩnh viễn ⛔ không ghi được** (dữ liệu lịch sử: 0/4 dòng có giá trị).
* ① `users.avatar_url`: tương tự ③, ⛔ **không có đường ghi nào ở Java** ⇒ 🟠 nhưng dữ liệu thật **0/19** ⇒ chưa ảnh hưởng quan sát được.

**BÀI HỌC GHI LẠI:** khi kết luận «mất cột», phải phân biệt **`INSERT` (thiếu cột ⇒ NULL)** với **`UPDATE` (thiếu cột trong SET ⇒ GIỮ NGUYÊN)** — ⛔ không gộp hai ca làm một.

#### H.6.3 — 🔧 NÂNG CẤP CÔNG CỤ (lỗi công cụ #15) ĐỂ TỰ PHÂN BIỆT `INSERT` vs `UPDATE`
Để **bài học ở §H.6.2 không phải dựa vào trí nhớ của người đọc**, tôi đã nâng `tools/probe-write-map-triage.mjs`: thêm hàm `collectSplit()` đổ vào **2 sổ riêng** (`javaInsCols` · `javaUpdCols`) + in thêm khối **«TÁCH THEO PHÉP GHI»**:
* `◍ Thiếu ở CẢ HAI (⛔ không có đường ghi tĩnh nào)` — **18 cặp** = 15 cặp thuộc 2 bảng ⛔ chưa port (`work_item_comments` 7 · `work_item_participants` 8) + **đúng 3 cặp thật** `approval_stage_catalog.stage_kind` · `boq_versions.approved_at` · `users.avatar_url`
* `◔ CHỈ thiếu ở INSERT (dòng mới sẽ NULL)` — **0 cặp** · `◕ CHỈ thiếu ở UPDATE (⚠️ KHÔNG làm mất dữ liệu)` — **0 cặp**
⇒ Kết quả này **xác nhận bản đính chính §H.6.2** (cả 3 cột đều ⛔ vắng ở **cả** INSERT lẫn UPDATE theo SQL tĩnh) và **từ nay máy tự phân biệt**, ⛔ không phụ thuộc trí nhớ người đọc. Công cụ vẫn `EXIT=0` (`⚠ THIẾU PORT THẬT` = 0).

### H.7 — ĐỢT PROBE THỨ 4 (12 probe RBAC/quyền/UI): **9 ĐẠT · 3 CŨ-SHAPE** · **0 lỗi sản phẩm**
| Probe | Kết quả |
|---|---|
| `probe-dept-perm` | ✅ **ĐẠT** |
| `probe-row-duplication` | ✅ **15/15 ĐẠT · 0 HỎNG · 0 GHI NHẬN** |
| `probe-modal-branch-coverage` | ✅ **3 ĐẠT · 0 HỎNG · 1 GHI NHẬN** |
| `probe-project-visibility` | ✅ «có lọc theo quyền» |
| `probe-page-assets` | ✅ `PASS 200 1024969 bytes /assets/page-C3s9lFmS.js` ⇒ **bundle đang phục vụ = bundle mới nhất** |
| `probe-admintab-bugs` · `probe-increment-drift` · `probe-list-toolbar-inventory` · `probe-ui-adoption` | ✅ exit 0 (in BẢNG ĐỂ RÀ, ⛔ không có 1 dòng kết luận) |
| `probe-material-perm` · `probe-work-permission` | ⚠️ **CŨ-SHAPE (cần rà từng mục)** — «3 MỤC KHÔNG ĐẠT» mỗi probe; ⛔ **chưa kết luận**, phải đọc mã/đo lại như đã làm với `probe-user-profile` dưới đây |
| **`probe-user-profile`** | 🔧 **ĐÃ SỬA 1 PHẦN + PHÂN ĐỊNH ĐƯỢC = CŨ-SHAPE** (⛔ **0 lỗi sản phẩm**) |

**`probe-user-profile` — bằng chứng đo được (⛔ không suy luận):**
1. **Lỗi công cụ đã vá**: bản cũ đếm `.admin-mini-list button` ⇒ **0** (màn Quản trị nay render danh sách người dùng bằng **BẢNG**). Đã sửa để nhận **CẢ HAI**: sau khi vá đo được **«19 mục (thẻ 0 · dòng bảng 19)»** ✅
2. **Phần còn lại là CŨ-SHAPE — đối chiếu mã nguồn HIỆN TẠI (`app/screens/ProjectEntityModal.tsx:102-118`)**:
   | Probe kỳ vọng (bản cũ) | Hiện trạng ĐO ĐƯỢC | Kết luận |
   |---|---|---|
   | Tiêu đề «**Hồ sơ nhân sự**» | «**Chi tiết nhân sự · \<tên\>**» (L102) | 🔵 tên đã đổi ⇒ regex cũ ⛔ khớp |
   | Mục «Thông tin cá nhân» · «Dự án đã và đang tham gia» · «Thao tác gần đây» | **4 tab**: «**Hồ sơ**» · «**Dự án tham gia**» · «**Tổ đội**» · «**Kho phụ trách**» (L104-118) | 🔵 cấu trúc đã đổi theo **PR-04/PR-06** (gom vào `EntityDetailModal`) |
   | Trường «Số CCCD/CMND» · «Trình độ học vấn» · «Ngày vào làm» **trong panel Quản trị** | Panel Quản trị có 8 trường: Họ tên · **Mã nhân viên** · Tài khoản · **Email** · **Chức danh** · **Phòng ban** · Cấp hệ thống · Trạng thái | 🔵 3 trường kia thuộc **màn Hồ sơ nhân sự** (⛔ không thuộc Quản trị) — và **§3 của chính probe này ĐẠT 4/4** với panel «Hồ sơ nhân sự chi tiết» có «Thao tác gần đây» + «Đơn từ & giấy tờ liên quan» ✅ |
3. **Thực tế đo trên UI**: panel Quản trị mở ĐÚNG, chỉ **541 ký tự** văn bản (gọn) và **⛔ không lỗi JS**; probe tự ghi nhận «✅ Panel ở Quản trị KHÔNG hiện mục Đơn từ (đúng yêu cầu)» ⇒ ⛔ **không phải lỗi sản phẩm**.

**⚠️ VIỆC CÒN LẠI (⛔ chưa làm vội):** viết lại kỳ vọng §1–§2 của `probe-user-profile` theo cấu trúc 4 tab ĐO ĐƯỢC (⛔ **không** hạ nhẹ phép kiểm, chỉ đổi cho khớp thực tế) rồi chạy lại để về ĐẠT; và **phân định `probe-material-perm` + `probe-work-permission`** (mỗi probe «3 MỤC KHÔNG ĐẠT») theo đúng cách đã làm ở đây.
➡️ **KHÔNG** kết luận 2 probe đó là lỗi sản phẩm khi chưa đọc mã xác nhận.

### H.7.1 — PHÂN ĐỊNH 2 PROBE CÒN LẠI CỦA ĐỢT 4 (đọc mã ⇒ ⛔ không suy luận)

**① `probe-material-perm` = 🔵 LỖI FIXTURE/PHÉP KIỂM (⛔ không phải lỗi sản phẩm).** Số đo thật của probe: `{"found":true,…,"rows":1,**"note":"0/0 vật tư — Bạn chỉ có quyền xem — các nút đã bị vô hiệu hoá"**}` ⇒ bảng render nhưng **0 dòng vật tư** (user thường không thấy vật tư nào) ⇒ `tbody .row-actions button` **⛔ không tồn tại** ⇒ 3 phép kiểm «có bao nhiêu nút bị disable» **không có mẫu để đo** (0/0). ⚠️ Thêm nữa, **tên phép kiểm tự nó mâu thuẫn**: «Nút 'Sửa' **VẪN HIỆN** cho user thường — **0 nút**» bị chấm ❌ trong khi «0 nút» lại chính là trạng thái **mong muốn**. ⇒ Cần sửa **fixture** (cho user thường thấy ≥1 vật tư) **hoặc** chuyển phép kiểm sang dạng «nếu có nút thì phải disabled» + coi «0 nút» là ĐẠT. **⛔ Không do MT2.**

**② `probe-work-permission` = 🔴 TÌM RA 1 HÀNH VI THẬT (kế thừa JS) — cần user quyết.** Hai phép kiểm sau (gán đúng người tạo · mã phòng CN) **không đo được** vì phép kiểm đầu đã không thấy việc ⇒ tạm ⛔ không kết luận.
> ⚠️ **TRẠNG THÁI CỔNG (nói rõ để ⛔ không hoá xanh im lặng):** `probe-work-permission` **GIỮ ĐỎ CÓ CHỦ Ý** cho tới khi user chốt lựa chọn (A)/(B)/(C) ở dưới — nó đang **nói đúng sự thật** (người tạo không thấy việc của mình), ⛔ **KHÔNG** phải probe cũ-shape, và ⛔ **KHÔNG** được sửa để thành xanh trước khi có quyết định.
* Đo được: `create_self_work_item` **HTTP 200** (user thường tự tạo được việc) · giao việc cho người khác **HTTP 400** đúng luật ⇒ 2 phép kiểm đó **ĐẠT**.
* Nhưng bootstrap của **chính user đó** trả **0 việc tự tạo**.
* **TRUY TẬN GỐC (đọc mã, ⛔ không đoán)** — `BootstrapDataAdapter`:
  * `departmentForRole("engineer")` ⇒ **`""`** (chỉ có `procurement→KH`, `project→DA`).
  * `departmentCodeForUser(...)` với `roleBase = "engineer"` ⇒ **`"BCH"`** (dòng: `List.of("commander","engineer","warehouse").contains(base) ⇒ "BCH"`).
  * Nhánh lọc trong bootstrap: `else if ("BCH".equals(depCode)) workItemWhere = "(wi.department_code='BCH' AND (wi.assigned_to=? OR wi.project_id IS NULL OR wi.project_id IN (<phạm vi>)))"`.
  * Việc tự tạo (`OpsTaskManagementUseCase.createSelfWorkItem`) đặt **`department_code = "CN"`** + `assigned_to = chính họ` (đã đọc mã: L279 `task.put("department","CN")`, `assigned_to/assigned_by = principal.userId()`).
  * ⇒ Điều kiện ngoài `wi.department_code='BCH'` **loại** dòng có `department_code='CN'` ⇒ **người tạo ⛔ KHÔNG thấy việc CÁ NHÂN do chính mình tạo** (trừ admin vì nhánh admin là `1=1`).
* ⚠️ **Đây ⛔ KHÔNG phải lỗi do MT2**: khối chú thích ngay trên hàm ghi rõ logic này **sao chép nguyên trạng từ JS `:715`** (Strangler parity §17/§20) ⇒ sửa = **ĐỔI HÀNH VI**, phải do **user quyết** (⛔ §14 không tự bịa luật).
* **Lựa chọn (cần user chốt):** **(A)** coi là **đúng thiết kế** (việc cá nhân chỉ admin/khối Cá nhân trong WorkCenter thấy) ⇒ ghi nhận + nới phép kiểm probe · **(B)** **sửa để người tạo luôn thấy việc cá nhân của mình** (thêm `OR wi.department_code='CN' AND wi.assigned_to=?` vào mọi nhánh) — ⚠️ phải sửa **cả JS và Java** để giữ parity, kèm test hợp đồng · **(C)** chỉ **ghi nhận** vào báo cáo `P14-05` như «khác biệt đã biết giữa WorkCenter và bootstrap».

**ĐO LIVE MỨC ẢNH HƯỞNG (CSDL thật, ⛔ không phóng đại):**
```sql
SELECT wi.department_code, u.role, u.username, COUNT(*) FROM work_items wi
JOIN users u ON u.id=wi.assigned_to GROUP BY wi.department_code, u.role, u.username;
```
| department_code | role người được giao | Số dòng |
|---|---|---|
| **CN** (việc cá nhân) | `ksda` (**roleBase = engineer** ⇒ rơi nhánh BCH) | **6** — tất cả thuộc tài khoản `sec_probe_*` (**dữ liệu TỒN DƯ từ `probe-security-rbac`**, ⛔ không phải dữ liệu nghiệp vụ) |
| DA (dự án) | `da_nv` (6) · `da_truong` (1) | 7 — nhánh `DA` **thấy được** (đúng) |

⇒ **Mức ảnh hưởng HÔM NAY = 0 dòng NGHIỆP VỤ THẬT bị ảnh hưởng** (6 dòng CN đều là rác của probe; ⛔ không có người dùng nghiệp vụ nào đã tạo việc cá nhân) ⇒ đây là **KHE HỞ TIỀM ẨN ĐÃ CHỨNG MINH CƠ CHẾ** (⚠️ khác với «đang gây lỗi» — tôi ghi rõ để ⛔ không nói quá).

### H.7.2 — ✅ ĐÃ VIẾT LẠI `probe-user-profile` ⇒ **ĐẠT (EXIT=0)** (lỗi công cụ #17)
**Đã sửa theo ĐÚNG cấu trúc ĐO ĐƯỢC (⛔ không hạ nhẹ phép kiểm):**
* Tiêu đề: nhận `/Chi tiết nhân sự|Hồ sơ nhân sự/i` (đo được «Chi tiết nhân sự · <tên>»).
* Thay việc đọc `.card-head h2` bằng đọc **nhãn TAB** + kiểm **2 tab bắt buộc** «Hồ sơ» · «Dự án tham gia».
* 6 trường định danh vẫn kiểm ở panel Quản trị: **Họ tên · Mã nhân viên · Tài khoản · Email · Chức danh · Phòng ban**.
* §2 đổi sang kiểm **tab «Dự án tham gia» bấm được + render dữ liệu HOẶC nhãn rỗng rõ ràng** («Chưa tham gia dự án nào»).
* ⚠️ **NÓI RÕ PHẦN ĐÃ GỠ** (⛔ không im lặng hạ cổng): phép kiểm **«đang tham gia trước · đã kết thúc sau · đã kết thúc bị LÀM MỜ»** đọc `.admin-mini-list > div` — lớp này **⛔ không còn ở panel Quản trị**; phép kiểm đó **vẫn được giữ nguyên vẹn ở §3 (màn Hồ sơ nhân sự)** — nơi panel mới có khối «Thao tác gần đây» + «Đơn từ & giấy tờ liên quan».
* 3 trường **Số CCCD/CMND · Trình độ học vấn · Ngày vào làm** nay **chỉ kiểm ở §3** (màn Hồ sơ nhân sự) vì ⛔ không thuộc panel Quản trị.

**KẾT QUẢ SAU SỬA (đo thật):** `═══ KẾT LUẬN: ĐẠT ✅ ═══` · `EXIT=0` · nhật ký tab đo được: `· tab: Hồ sơ · tab: Dự án tham gia · tab: Tổ đội · tab: Kho phụ trách` · `tab Dự án tham gia: CLICKED · dòng=0 · có nhãn rỗng «Chưa tham gia dự án nào»=true`.

### H.7.3 — ✅ ĐÃ VÁ PHÉP KIỂM `probe-material-perm` ⇒ **ĐẠT (EXIT=0)** (lỗi công cụ #18)
**Yêu cầu bảo mật THẬT** (⛔ không hạ nhẹ): *«⛔ KHÔNG được tồn tại bất kỳ nút thao tác nào ĐANG BẬT cho user thiếu quyền»*. Bản cũ lại đòi **`total > 0`** («nút 'Sửa' VẪN HIỆN») rồi mới kiểm `disabled` ⇒ khi user thường **⛔ không thấy nút nào** thì 2 phép kiểm ❌ **OAN** dù ⛔ không có nút nào bật.
**Đã sửa thành:** kiểm **`enabled = total − disabled === 0`** cho cả «Sửa» và «Ngừng» (thiếu nút ⇒ 0 nút bật ⇒ **thoả** đúng yêu cầu) + in **mẫu đo** + **GHI NHẬN** khi 0 dòng (⛔ không kết luận được ở mức nút nhưng vẫn khẳng định «0 nút bật»).
**KẾT QUẢ SAU SỬA (đo thật):** `KẾT LUẬN: ĐẠT ✅` · `EXIT=0` · `(mẫu đo: 1 dòng vật tư · nút «Sửa» 0 (bật 0) · «Ngừng» 0 (bật 0))` · `✅ ⛔ KHÔNG có nút «Sửa» nào ĐANG BẬT cho user thiếu quyền (thiếu nút = thoả) — 0 nút bật / 0 nút` · `✅ Có dòng ghi chú giải thích quyền — "…Bạn chỉ có quyền xem — các nút đã bị vô hiệu hoá"`.

### H.8 — ĐỢT PROBE THỨ 5 (12 probe TASK-04x/06x/07x): **9 ĐẠT · 1 CŨ-SHAPE đã vá ⇒ ĐẠT · 1 thoát-1-theo-thiết-kế · 1 chập chờn** · **0 lỗi sản phẩm**
| Probe | Kết quả |
|---|---|
| `probe-task041` | ✅ **21/21 mục ĐẠT** khi chạy lại (lần đầu 20/21 ⇒ **CHẬP CHỜN do dữ liệu tạm của lần chạy trước**, ⛔ không phải lỗi) — bằng chứng đẹp: `HTTP 400 "Bước này đang có hồ sơ chờ xử lý. Hãy xử lý hết hồ sơ hoặc giữ bước hoạt động; phiếu đang chạy không được cắt ngang."` + dọn sạch `8 -> 8` |
| `probe-task041-subcat` | ✅ **19/19 mục ĐẠT** |
| `probe-task041-delete` | 🔧 **ĐÃ VÁ → ĐẠT** (lỗi công cụ #19, xem dưới) |
| `probe-task045-save-material` | ✅ **18/18 ĐẠT** |
| `probe-task070-field-coverage` · `probe-task071-aliased-fields` | ✅ **10/10 ĐẠT** mỗi probe |
| `probe-work-item-field-contract` | ✅ **18/18 ĐẠT · 0 HỎNG · 2 GHI NHẬN (bundle cũ)** |
| `probe-audit-coverage` | ✅ «khe hở này là về TÊN/CHI TIẾT hành động ở tầng use-case, ⛔ không phải …» (đọc kỹ mã rồi mới kết luận) |
| `probe-put-order` · `probe-settings-fix` | ✅ ĐẠT («cả hai action đã hết 500 và hai phép kiểm nghiệp vụ của JS hoạt động») |
| `probe-task062-boq` | ✅ exit 0 — probe **tự nói rõ** nhánh `material_request_items.boq_item_id IS NULL` **chưa được cổng này mô phỏng** (ghi nhận, ⛔ không nhận ĐẠT khống) |
| `probe-task069-appdata-contract` | ⚠️ **thoát 1 THEO THIẾT KẾ**: «cổng in cặp số để người đọc tự phán, ⛔ KHÔNG tự kết luận sai» ⇒ ⛔ không phải lỗi |

#### H.8.1 — `probe-task041-delete`: **SUÝT KẾT LUẬN OAN 1 LỖI SẢN PHẨM** ⇒ đọc mã + đo lại ⇒ **BÁC BỎ**
* **Hiện tượng ban đầu**: probe báo 2 mục HỎNG — `chặn đúng nguyên văn JS — HTTP 200 ""` và `bước 902 VẪN CÒN` ⇒ nếu tin ngay thì đó là **lỗi nặng** («Java cho xoá bước hoạt động CUỐI CÙNG», «xoá báo 200 nhưng ⛔ không xoá»).
* **Đọc mã Java (`OpsTaskManagementUseCase.deleteApprovalStage:590-599`)** ⇒ **CẢ HAI chốt ĐỀU CÓ**:
  `if (store.countApprovalsByStageNo(...) > 0) throw Api("Bước đã có lịch sử hồ sơ nên không được xóa…")`
  `if (store.countActiveStages() <= 1) throw Api("Không thể xóa bước hoạt động cuối cùng.")`
* **ĐO LẠI để tìm nguyên nhân thật**: log probe in `dựng kịch bản: 4 bước hoạt động (là bước tạm 902)` ⇒ **902 ⛔ KHÔNG phải bước cuối**! Vì probe chỉ tắt `stage_no BETWEEN 1 AND 5`, mà CSDL **đã có thêm 101 · 102 · 103 (`stage_kind='supply'`)**. ⇒ `delete` trả **200** là **ĐÚNG**; phép kiểm «chặn» là **GIẢ ĐỊNH CŨ ĐÃ HẾT ĐÚNG**.
* **ĐÃ VÁ (⛔ không hạ nhẹ)**: đổi thành `UPDATE … SET active=0 WHERE stage_no<>902` ⇒ **902 THẬT SỰ là bước hoạt động cuối** ⇒ đo lại: `dựng kịch bản: 1 bước hoạt động` · `HTTP 400 "Không thể xóa bước hoạt động cuối cùng."` ✅ ⇒ **chốt cuối được cưỡng chế ĐÚNG**.
* ⚠️ **TÔI TỰ GÂY 1 TÁC DỤNG PHỤ VÀ ĐÃ SỬA**: cách vá trên tắt cả **101/102/103** nhưng bước khôi phục cũ chỉ bật lại `1..5` ⇒ **đã để 3 bước supply `active=0` trong CSDL thật**. **ĐÃ KHÔI PHỤC NGAY** (`UPDATE … SET active=1 WHERE stage_no IN (1,2,3,4,5,101,102,103)` ⇒ đo lại `101:1,102:1,103:1`) **và làm cứng công cụ**: probe nay **ghi nhớ tập bước đang bật lúc đầu** (`ghi nhớ 8 bước đang bật để khôi phục: 1,101,102,103,2,3,4,5`) rồi khôi phục **đúng tập đó** ⇒ đo lại: `trạng thái cuối = trạng thái đầu` ✅ và CSDL sau khi chạy đúng `1:1,2:1,3:1,4:1,5:1,101:1,102:1,103:1`.
* ⇒ **BÀI HỌC GHI LẠI:** ① probe cũ viết theo CSDL **thời điểm đó** — khi thêm dữ liệu mới (101–103) thì **giả định nền** có thể hết đúng ⇒ phải **đọc log dựng kịch bản trước khi kết luận**; ② mọi probe **đổi cấu hình thật** phải **ghi nhớ trạng thái đầu** và khôi phục theo trạng thái đó, ⛔ không hard-code «1..5».

### H.9 — ĐỢT PROBE THỨ 6 (12 probe TASK-04x/05x/06x): **8 ĐẠT · 4 chặn-bởi-tiền-đề** · **0 lỗi sản phẩm**
| Probe | Kết quả đo được |
|---|---|
| `probe-task040-nhom1` · `-nhom1-authz` · `-nhom3` · `-nhom3b` | ✅ «nhóm 1 (SQL + đường đọc)… đã hết lỗi ở mức HTTP» · «ranh giới phân quyền đúng, hai khoá mới không rò rỉ» · «định mức vật tư đã hết 500, đúng hợp đồng payload của UI» · **17/17 ĐẠT** |
| `probe-task042-retry-email` | ✅ **9/9 mục ĐẠT** |
| `probe-task054-all-roles` | ✅ exit 0 — «dữ liệu hiện tại ⛔ KHÔNG có bước `all_roles` ⇒ ⛔ không kiểm được end-to-end» (tự nói rõ, ⛔ không nhận ĐẠT khống) |
| `probe-task058-work-items` · `probe-task063-clauses` | ✅ **17/17 ĐẠT** · ✅ **7/7 ĐẠT** |
| `probe-task043-custom-fields` · `probe-task048-audit-requests` | ⚠️ **DỪNG vì TIỀN ĐỀ CŨ** (xem dưới) — ⛔ không phải lỗi sản phẩm |
| `probe-task066-role-shape` | ⚠️ **1 HỎNG duy nhất** = «`[thukydemo]` đăng nhập … HTTP 401» ⇒ **đúng ca credential drift đã truy tận gốc ở §H.1.1** (mật khẩu đổi 21/09) ⛔ không phải lỗi sản phẩm; chính probe tự ghi «Dữ liệu rỗng theo vai trò là HỢP LỆ và ⛔ không bị tính là HỎNG» |
| `probe-task040-nhom45` | ⚠️ exit 2 — «**Thiếu `issueItemId`**. Lấy một dòng thật:» ⇒ **thiếu FIXTURE/dữ liệu đầu vào** (probe cần 1 dòng phiếu xuất kho thật) ⛔ không phải lỗi sản phẩm |

#### H.9.1 — VÌ SAO 2 PROBE DỪNG: bước **101/102/103 là hàng MIRROR** của hệ workflow mới (ĐO ĐƯỢC, ⛔ không suy luận)
Cả hai probe cùng dừng ở tiền đề: «**8 bước đang hoạt động** đều có Owner cho PRJ-DEMO-01 — **thiếu bước 101, 102, 103**» và tự bảo vệ «dừng để ⛔ không tạo dữ liệu dở dang» (thiết kế tốt, ⛔ không phải lỗi).
**ĐO ĐỂ PHÂN ĐỊNH (CSDL thật):**
| Câu đo | Kết quả |
|---|---|
| `SELECT stage, COUNT(*) FROM approvals WHERE stage IN (101,102,103) GROUP BY stage` | **RỖNG ⇒ 0 hồ sơ** nào từng chạy qua 3 bước này ở hệ `approval_stage_catalog` |
| `SELECT code, module_key, active FROM workflow_definitions` | **`WF-MUAHANG-01 (requests)` · `WF-PO-01 (purchasing)` · `WF-XUATKHO-01 (warehouse_issue)` · `WF-NHAPKHO-01 (warehouse_receipt)`** — đều `active=1` |
| `SELECT COUNT(*) FROM workflow_steps / workflow_step_approvers` | **10 bước · 10 người duyệt** (đã phân công đủ) |
⇒ **KẾT LUẬN:** 3 dòng `stage_no = 101/102/103` (`stage_kind='supply'`) là **hàng MIRROR/legacy** của chuỗi KHO–MUA HÀNG nay do **engine `workflow_*`** làm chủ (đúng như kết luận đã ghi ở `probe-wf04`: «`approval_stage_catalog` là CHÍNH cho Phiếu đề nghị · `workflow_*` là CHÍNH cho 3 module mới · ⛔ không xoá hệ nào»). ⇒ Tiền đề «**mọi** bước trong catalog phải có Owner» **⛔ không còn áp dụng** cho 3 bước mirror.
**⚠️ VIỆC CẦN USER QUYẾT (⛔ tôi không tự sửa tiền đề nghiệp vụ):** **(A)** coi 101–103 là mirror ⇒ nới tiền đề 2 probe (chỉ kiểm các bước `stage_kind='approval'`) · **(B)** vẫn phân công Owner cho 3 bước mirror để giữ nguyên tiền đề · **(C)** ẩn 3 bước mirror khỏi catalog (đổi dữ liệu ⇒ cần anh OK).

### H.10 — ĐỢT PROBE THỨ 7 (12 probe): **4 ĐẠT · 1 CŨ-SHAPE đã vá ⇒ ĐẠT · 7 phân định = MÔI TRƯỜNG/FIXTURE/CŨ** · **0 lỗi sản phẩm**
| Probe | Kết quả đo được | Phân loại |
|---|---|---|
| `probe-task046` | ✅ **17/17 ĐẠT** | ✅ |
| `probe-task080c-work-items` | ✅ **28/28 ĐẠT · 0 HỎNG · 1 KHOẢNG TRỐNG ĐÃ GHI NHẬN** | ✅ |
| `probe-workflow` | ✅ **ĐẠT** | ✅ |
| `probe-ui-data` | ✅ «QUẢN TRỊ HỆ THỐNG (đã bấm)» | ✅ |
| **`probe-menu-11`** | 🔧 **ĐÃ VÁ 4 KỲ VỌNG CŨ → ĐẠT ✅ (EXIT=0)** — lỗi công cụ #20 (xem dưới) | ✅ XONG |
| `probe-task050-bootstrap` | ⛔ «`Error: đăng nhập thukydemo lỗi HTTP 401`» | 🔵 **credential drift đã truy tận gốc §H.1.1** |
| `probe-task065-caneditcentral` | ⛔ `ERROR 1062 Duplicate entry 'USR_…-central_warehouse'` khi probe `INSERT` phạm vi | 🔵 **FIXTURE không dọn dữ liệu lần chạy trước** |
| `probe-task073-team-members` | ⛔ «NGOẠI LỆ khi chạy — Command failed: mysql.exe …» (0/1) | 🔵 **MÔI TRƯỜNG (gọi mysql)** |
| `probe-task080e-production` | ⚠️ 17/18 (1 HỎNG + 1 GHI NHẬN) — các **tự-kiểm-soát đều ĐÚNG**: từ chối trùng kỳ · từ chối duyệt vượt sản lượng · từ chối liên kết báo cáo chưa duyệt; GHI NHẬN «trdademo ⛔ không tạo được báo cáo — **Dự án đã có báo cáo sản lượng cho kỳ này**» | 🔵 **DỮ LIỆU TỒN DƯ của lần chạy trước** |
| `probe-task082-realdata` | ⚠️ 20/21 (1 HỎNG) | ⏭️ cần đọc dòng HỎNG cụ thể (việc kế) |
| `probe-task075-attachments` | ⚠️ 19/22 — HỎNG `D1 · UI lọc ảnh theo file.mimeType` · `D2 · có ≥2 thẻ <img> trỏ đúng endpoint tệp` · `D6 · có trạng thái rỗng cho danh sách tệp` | ⏭️ **VIỆC KẾ TIÊN QUYẾT**: đây là ca **duy nhất có thể là lỗi UI thật** (P2-06b/P6-07 vùng đính kèm) ⇒ ⛔ **chưa kết luận** |
| `probe-p2-ui-dom` | ⛔ `BLOCKED` ở `[approval-step-decided-at]` + `[approval-step-comment]` (cần 1 bước duyệt ĐÃ quyết trên màn) | 🔵 **TIỀN ĐỀ dữ liệu** (⛔ không phải kết luận lỗi) |

#### H.10.1 — `probe-menu-11`: 4 KỲ VỌNG CŨ đã vá (lỗi công cụ #20) — ⛔ KHÔNG hạ nhẹ
| # | Kỳ vọng cũ | Hiện trạng ĐO ĐƯỢC | Nguồn xác nhận |
|---|---|---|---|
| 1 | tab 1 = «**Nhân sự**» | «**Tài khoản**» | `app/screens/admin-governance-pure.ts` · `ADMIN_STEP_LABELS[0]` (AD-01: «Đổi tên Nhân sự → Tài khoản») |
| 2 | «**ĐÚNG 12 tab**» | **13 tab** | MT2-P12-01 thêm tab «Thông báo» ⇒ khoá tổng số là SAI (chính chú thích đầu tệp probe đã ghi «⛔ KHÔNG khẳng định tổng số») ⇒ nay kiểm **≥ số tab bắt buộc** + vẫn đòi **ĐỦ từng tab bắt buộc** |
| 3 | nhóm menu «**CÔNG VIỆC CỦA TÔI**» | «**CÔNG VIỆC**» | `lib/menu-helpers.ts:101` («NHÓM MENU «CÔNG VIỆC» TÁCH THÀNH 5 MỤC») |
| 4 | còn 1 chỗ **hard-code** «CÔNG VIỆC CỦA TÔI» ở check riêng | như trên | như trên |
**KẾT QUẢ SAU VÁ:** `═══ KẾT LUẬN: ĐẠT ✅ ═══` · `EXIT=0` (trước đó 6 mục ❌).

### H.11 — KẾT LUẬN CA TIÊN QUYẾT: `probe-task075-attachments` **CŨ-SHAPE do UI CHUYỂN TỆP** ⇒ ĐÃ VÁ → **22/22 ĐẠT** (lỗi công cụ #21) · **⛔ KHÔNG mất tính năng**
**3 phép kiểm HỎNG (D1/D2/D6) là KIỂM TĨNH theo TỆP** — probe đọc **chỉ `app/page.tsx`** (L152 cũ). **ĐO LẠI chính xác 2 tệp:**
| Kỳ vọng | `app/page.tsx` (probe đọc) | **`lib/ui-shared.tsx`** (nơi khối đính kèm NAY ở) | Kết luận |
|---|---|---|---|
| `D1` · `String(file.mimeType \|\| "").startsWith("image/")` | **0** | **1** ✅ | có thật, đã chuyển tệp |
| `D2` · ảnh `src={\`/api/files?id=${encodeURIComponent(file.id)}\`}` (cần ≥2) | **0** | **2** ✅ | có thật (dải ảnh + ô thu nhỏ) |
| `D6` · «Chưa có ảnh hoặc hồ sơ vật tư đặc thù được tải lên.» | **0** | **1** ✅ | có thật |
**Vì sao chuyển tệp:** khối đính kèm được **TÁI SỬ DỤNG** thành thư viện dùng chung — chính mã nguồn ghi rõ (`app/screens/CorrespondenceScreen.tsx:24`): «đã có sẵn ở `lib/ui-shared.tsx:295`, `input multiple` + `/api/files` ⇒ ⛔ không thêm bảng/cột (REUSE §15)».
**ĐÃ VÁ (⛔ không hạ nhẹ):** probe nay đọc **CẢ HAI** tệp (`app/page.tsx` + `lib/ui-shared.tsx`), **giữ nguyên toàn bộ nội dung phép kiểm** ⇒ **`KẾT QUẢ: 22/22 ĐẠT`** · `EXIT=0`, gồm `✅ D1`, `✅ D2`, `✅ D6`, `✅ ĐC1 dữ liệu cố ý hỏng (HTML) ⛔ không bị nhận là ảnh`.
⇒ **CA TIÊN QUYẾT ĐÃ CHỐT: ⛔ 0 LỖI SẢN PHẨM** (suy đoán «có thể mất tính năng đính kèm» đã được **BÁC BỎ bằng số đo**, ⛔ không phải bằng cảm giác).
**⏭️ Còn 1 việc nhỏ của đợt 7:** đọc dòng HỎNG cụ thể của `probe-task082-realdata` (20/21).

### H.12 — CHỐT `probe-task082-realdata` (20/21): HỎNG DUY NHẤT = **LỖI CÔNG CỤ SEED**, ⛔ không phải lỗi sản phẩm
**Phép kiểm HỎNG:** «mọi phiếu đã BCH xác nhận đều có **TÊN người xác nhận THẬT** (⛔ không rơi vào chữ dự phòng) :: **18/24 phiếu**».
**ĐO CSDL THẬT (`goods_receipts` — ⛔ không phải bảng `receipts`):**
| Nhóm | Số dòng | `created_at` | `updated_at` |
|---|---|---|---|
| **CÓ** người xác nhận (`LEFT JOIN users` khớp) | **18** | 2026‑02‑02 → 2026‑09‑21 | → 2026‑09‑21 13:56 |
| **THIẾU** người xác nhận (`bch_confirmed_by` NULL **và** `bch_confirmed_at` NULL) | **14** | **2026‑09‑16 → 2026‑09‑21 13:26** | như trên |
**TRUY TẬN GỐC (đọc mã):**
* **Sản phẩm GHI ĐÚNG**: `PurchaseStoreAdapter:554` `UPDATE … SET bch_confirmation_status='confirmed', bch_confirmed_by=?, bch_confirmed_at=?, bch_comment=?`; các lệnh `INSERT` cũng có đủ 4 cột (`PurchaseStoreAdapter:428` · `WarehouseStockStoreAdapter:439`/`516`); `BootstrapDataAdapter:391` `LEFT JOIN users confirmer ON confirmer.id=gr.bch_confirmed_by` để hiển thị TÊN.
* **CÔNG CỤ SEED THIẾU CỘT**: `tools/seed-p2-test-data.mjs` (dòng khai `COT_GRN`) = `["id","receipt_no","purchase_order_id","warehouse_id","received_by","received_at","delivery_note_no","qc_status","document_status","posting_status",**"bch_confirmation_status"**,"created_at","updated_at"]` ⇒ **CÓ `bch_confirmation_status` nhưng ⛔ KHÔNG CÓ `bch_confirmed_by`/`bch_confirmed_at`** (đo bằng `-match` trên chính dòng đó: `bch_confirmed_by? False`).
⇒ **Các dòng thiếu tên là do SEED tạo ra** (trùng đúng khoảng 16–21/09 khi seed chạy) ⇒ ⛔ **KHÔNG phải lỗi mã sản phẩm**.
**⚠️ 2 VIỆC (1 công cụ + 1 cần user):**
* 🔧 **Công cụ (#22 – đề xuất):** thêm `bch_confirmed_by` + `bch_confirmed_at` vào `COT_GRN` **kèm giá trị người xác nhận thật** để seed mới thoả yêu cầu — ⚠️ phải đọc kỹ cơ chế sinh giá trị (`sinhCauLenh`) trước khi sửa, ⛔ không sửa vội kẻo hỏng dữ liệu seed.
* ❓ **Dữ liệu (cần user):** **14 dòng hiện có** mang trạng thái xác nhận nhưng ⛔ không có người xác nhận ⇒ **(A)** chấp nhận là dữ liệu seed/demo (ghi nhận) · **(B)** backfill người xác nhận (DML — cần anh OK + cần biết đúng người) · **(C)** dọn các dòng seed này (DML — cần anh OK).

### H.13 — 🔧 ĐÃ SỬA CÔNG CỤ SEED (#22) — CÓ KIỂM CÂN XỨNG, ⛔ KHÔNG chạy seed (tránh ghi dữ liệu)
**Đọc cơ chế trước khi sửa (⛔ không sửa vội):** `seed-p2-test-data.mjs` dùng `insertNhieu(bang, COT_x, rows)` — mỗi dòng là **mảng giá trị khớp THỨ TỰ cột** ⇒ thêm cột **bắt buộc** thêm giá trị tương ứng, nếu không sẽ **lệch cột/giá trị**.
**Đã sửa 2 chỗ:**
1. `COT_GRN`: chèn `"bch_confirmed_by"`, `"bch_confirmed_at"` **ngay sau** `"bch_confirmation_status"`.
2. `grnRows`: chèn `S(kh.nguoiDung)` (người dùng THẬT của seed — cùng người đang dùng cho `received_by`) + `T()` (thời điểm seed) **đúng vị trí tương ứng**.
**KIỂM CHỨNG BẰNG MÁY (⛔ không chạy seed để tránh ghi dữ liệu):**
| Câu kiểm | Kết quả |
|---|---|
| `node --check tools/seed-p2-test-data.mjs` | **0** ✅ |
| Đếm cột `COT_GRN` | **15** |
| Đếm giá trị trong `grnRows` | **15** |
| `can_xung` (số cột == số giá trị) | **true** ✅ |
| Vị trí 11 = `bch_confirmed_by` ⇒ giá trị | **`S(kh.nguoiDung)`** ✅ |
| Vị trí 12 = `bch_confirmed_at` ⇒ giá trị | **`T()`** ✅ |
**Ý nghĩa:** lần **seed kế tiếp** sẽ tạo phiếu nhập **CÓ người xác nhận thật** ⇒ `probe-task082-realdata` sẽ hết HỎNG trên dữ liệu mới. ⚠️ **14 dòng cũ vẫn nguyên** (⛔ không tự DML) ⇒ vẫn cần user chọn (A)/(B)/(C) ở trên.
**GHI CHÚ:** script kiểm đếm là **tạm**, đã **xoá** sau khi dùng (⛔ không để lại tệp lạ).

### H.14 — ĐỢT PROBE THỨ 8 (4 probe cuối): **1 ĐẠT · 1 PHÂN ĐỊNH = LỖI PHƯƠNG PHÁP PROBE** · 2 chờ rà (P5/P6) · **0 lỗi sản phẩm**
| Probe | Kết quả | Phân loại |
|---|---|---|
| `probe-task024-leadership-parity` | ✅ «PARITY công lãnh đạo JS↔Java: **7/7 ĐẠT**» | ✅ |
| **`probe-task027-live`** | ⚠️ **439 phép đo**: «chặn đúng (tầng admin) **312** · **lọt 0** · cho phép đúng **81** · **403 tầng-vai-trò (LỖI THẬT) 1** · 403 khác 45» ⇒ probe kết luận «còn 403 ở tầng VAI TRÒ ⇒ lỗi thật» | 🔵 **LỖI PHƯƠNG PHÁP PROBE — ⛔ KHÔNG phải lỗi sản phẩm** (xem §H.14.1) |
| `probe-p5` · `probe-p6` | ❌ 7 mục / 4 mục KHÔNG ĐẠT | ⏭️ **chờ rà** (nhiều khả năng là probe CŨ bị thay bởi `probe-p5-dashboard-menu` **4/4** · `probe-p6-07` **4/4** · `probe-p6-08` **3/3** đều ĐẠT) — ⛔ **chưa kết luận** |

#### H.14.1 — TRUY TẬN GỐC 403 «tầng vai trò» duy nhất: `approve_stock_issue` với tài khoản **kho**
* Dòng chi tiết của probe: `↳ approve_stock_issue [T2-vai-tro] Tài khoản không có quyền thực hiện nghiệp vụ này.` xuất hiện dưới tài khoản **`tkhodemo` (warehouse)**.
* **ĐỌC MÃ (registry):** `ActionRbacRegistry:36` `Map.entry("approve_stock_issue", List.of("approvals"))` + `:303` capability **`canApprove`** (chú thích: «TASK-132 — bước ② WF-XUATKHO-01»).
* **ĐO CSDL (dữ liệu THẬT quyết định ai được duyệt)** — `WF-XUATKHO-01` có **2 bước**, người duyệt được gán trong `workflow_step_approvers`:
 | bước | tên bước | người duyệt | vai trò |
 |---|---|---|---|
 | 1 | Chỉ huy trưởng / BCH xác nhận | `cha.ht` | **cht (commander)** |
 | 2 | **Kế toán xác nhận** | `kttdemo` | **accountant** |
* ⇒ Bước ② (duyệt xuất kho) **⛔ KHÔNG giao cho vai trò kho** mà giao cho **kế toán** ⇒ `tkhodemo` nhận **403 là ĐÚNG THIẾT KẾ**.
* **Vì sao probe vẫn coi là lỗi:** probe **suy ra** kỳ vọng «action thuộc vai trò mình» từ **module + capability** (`approvals` + `canApprove`) chứ ⛔ không đọc **người duyệt thực tế** của bước workflow; và `approve_stock_issue` là **action Java-only** (đo: ⛔ **không** có trong `scripts/system-route.mjs`/`lib/` ⇒ chỉ xuất hiện trong chính các probe) nên ⛔ **không có parity JS** để làm chuẩn.
* ⇒ **KẾT LUẬN: 0 lỗi sản phẩm**; đây là **giả định sai của probe**.
* **🔧 VIỆC KẾ (đề xuất — lỗi công cụ #23):** đổi PHA-2 sang **đọc `workflow_step_approvers`** để chỉ kỳ vọng thành công khi tài khoản **đúng là người duyệt** của bước tương ứng (thay vì suy từ module+capability) — ⛔ **không hạ nhẹ**: vẫn giữ PHA-1 «admin-only phải 403» (đang **312 chặn đúng · 0 lọt** ✅).

### H.15 — CHỐT 2 PROBE CUỐI `probe-p5` (7 mục) + `probe-p6` (4 mục): **0 LỖI SẢN PHẨM** · 2 VIỆC CÔNG CỤ
#### H.15.1 — `probe-p6`: «SINH RA bản ghi nhật ký — 100 → 100» = **CÁCH ĐO SAI** (⛔ không phải lỗi)
**ĐỌC MÃ Java (quyết định):** `BootstrapDataAdapter` câu `data.put("audits", …)` kết thúc bằng **`ORDER BY al.occurred_at DESC LIMIT 100`** ⇒ `data.audits` **bị chặn trần 100 dòng** ⇒ so **số lượng** trước/sau **⛔ không bao giờ tăng** khi đã đủ 100 ⇒ phép kiểm «Thao tác thay đổi dữ liệu SINH RA bản ghi nhật ký (100 → 100)» là **SAI PHƯƠNG PHÁP**. Cách đúng: so **id/`occurredAt` của dòng MỚI NHẤT**.
* «❌ Có đúng 12 tab — **13**» = **cùng ca khoá-tổng-số-tab** như `probe-menu-11` (MT2-P12-01 thêm tab «Thông báo») ⇒ CŨ-SHAPE.
* «Có ô tìm kiếm» + «Tìm kiếm lọc được nhật ký 101 → 101» ⇒ cần rà selector/ô tìm kiếm ở tab Audit log — ⏭️ **chưa kết luận** (việc kế).
* **🔧 Công cụ #24:** so dòng mới nhất thay vì so số lượng; bỏ khoá «đúng 12 tab»; rà lại ô tìm kiếm.

#### H.15.2 — `probe-p5`: «Quyền chức năng KHÔNG bị mất khi bị chặn — 59 → 1» — **ĐÃ TRUY TẬN GỐC: ⛔ KHÔNG phải lỗi sản phẩm** (nhưng probe có tác dụng phụ)
* Chuỗi đo của probe: `═══ 5) BACKEND — QUYỀN PHÒNG BAN ═══` → **thêm** `save_department_permission` cho đơn vị KH rồi **xoá ngay** («Đã thu hồi sạch» ✅) → `═══ 6) …` → `trước: {"perms":59,…}` → gọi `save_user_access` (xin cấp `dept_legal_correspondence` — phòng KH ⛔ không có chức năng này) → `sau : {"perms":1,…}`.
* **ĐỌC MÃ (quyết định)** — `UserManagementUseCase.saveUserAccess` (L204-212) **kiểm TRƯỚC khi ghi** (chú thích P5.3 nói rõ: nếu đặt sau `clearUserScopes()` thì «yêu cầu bị TỪ CHỐI vẫn xoá sạch … ⇒ MẤT DỮ LIỆU») và gọi `assertDepartmentAllowsPermissions(...)` trước `clearUserScopes()`.
* **ĐỌC MÃ `assertDepartmentAllowsPermissions` (L406+)** ⇒ **3 cửa THOÁT SỚM (được phép)**: ① role admin **hoặc** cấp hệ thống có `auto_grant_all=1`; ② `organizationUnitId` **rỗng**; ③ **phòng ban CHƯA được cấu hình quyền nào** (`deptConfigured == false`). Chỉ khi phòng đã cấu hình mới áp ràng buộc «phải có `department_module_permissions` active + `can_view=1`».
* **ĐO CSDL:** các tài khoản phòng KH đang có **59 dòng** quyền (`nvkhdemo` 59 · `testuser86661` 59 · `trinhtrench` 59) ⇒ **59 là trạng thái chuẩn** của seed.
* ⇒ Suy ra: sau khi probe **thu hồi** quyền phòng ban ở bước 5, **phòng KH ⛔ không còn cấu hình nào** ⇒ rơi vào **cửa thoát sớm ③** ⇒ lệnh cấp quyền được **CHẤP NHẬN là ĐÚNG THEO THIẾT KẾ**; và vì lệnh chấp nhận nên `clearUserScopes` + ghi 1 dòng ⇒ **59 → 1 là hệ quả của một lệnh HỢP LỆ**, ⛔ không phải «mất dữ liệu do bị chặn».
* ⚠️ **NHƯNG đây là TÁC DỤNG PHỤ CỦA PROBE**: probe ⛔ **không snapshot/khôi phục** quyền của tài khoản đích trước khi gọi ⇒ nó **ghi đè** quyền của user kiểm thử. ⇒ **🔧 Công cụ #25**: probe phải **chụp trạng thái trước** và **khôi phục sau** (như đã làm cho `probe-task041-delete` ở §H.8.1).
* **KẾT LUẬN:** 0 lỗi sản phẩm; 7 mục ❌ của `probe-p5` thuộc nhóm **CŨ-SHAPE + SAI PHƯƠNG PHÁP + TÁC DỤNG PHỤ PROBE** — ⏭️ chi tiết từng mục (dropdown phòng ban 0 lựa chọn, nút cấp quyền hàng loạt, ô tìm kiếm) **rà ở lượt kế**, ⛔ chưa kết luận.

### H.16 — RÀ CHI TIẾT 5 MỤC UI CÒN LẠI CỦA `probe-p5` + Ô TÌM KIẾM CỦA `probe-p6`: **TÍNH NĂNG VẪN CÓ ⇒ CŨ-SHAPE DO CHUẨN HOÁ UI (§22)**
**Cách làm: ⛔ không đoán — tìm ĐÚNG chuỗi trong mã nguồn HIỆN TẠI.**
| Probe kỳ vọng | Hiện trạng ĐO ĐƯỢC trong mã | Kết luận |
|---|---|---|
| «Có nút cấp quyền hàng loạt theo nhóm + lưu — BỎ CHỌN TẤT CẢ \| LƯU THAY ĐỔI» | **CÓ**: `app/page.tsx:1738` «Tab "**Phân quyền phòng ban**" — cấp quyền HÀNG LOẠT cho cả phòng ban» · nút `page.tsx:1844` «Bỏ chọn tất cả» · `page.tsx:1546` «LƯU THAY ĐỔI Ban chỉ huy» (chữ HOA do CSS `text-transform`) | 🔵 **CŨ-SHAPE** (nút nằm ở **tab 5 «Phân quyền phòng ban»**, probe lại tìm trong tab 6 «Phân quyền người dùng») |
| «Có dropdown chọn phòng ban — **0 lựa chọn**» + «Dropdown hiển thị TÊN phòng ban» | **CÓ bộ lọc đơn vị**: `page.tsx:790` `{ key:"organizationUnitId", label:"Phòng ban", value:filterState.organizationUnitId, onChange:setFilterVal }` ⇒ nay là **bộ lọc trong `ListToolbar`**, ⛔ không còn là `<select>` `.card select` mà probe cầm (đoạn probe lấy `sels[sels.length-1]` ⇒ trúng select khác ⇒ 0 lựa chọn) | 🔵 **CŨ-SHAPE** (§22 đã chuẩn hoá toolbar dùng chung) |
| «Có ô tìm kiếm theo tên/mã/chức danh» + «Tìm kiếm lọc được danh sách **19 → 19**» | **CÓ**: `app/components/ui/ListToolbar.tsx:87` `placeholder={search.placeholder \|\| "Nhập từ khoá…"}` ⇒ ô tìm kiếm **dùng chung**; probe tìm theo selector riêng cũ ⇒ không thấy ⇒ không gõ được ⇒ danh sách không lọc | 🔵 **CŨ-SHAPE** |
| `probe-p6` «Có ô tìm kiếm» (tab Audit log) | **Tab CÓ**: `page.tsx:2070` `function AuditLogManager(...)` (tab «Audit log» — ĐỢT P6) và ô tìm kiếm nay qua `ListToolbar` dùng chung | 🔵 **CŨ-SHAPE** |
**⇒ TẤT CẢ tính năng mà 2 probe này đòi ĐỀU TỒN TẠI trong mã hiện tại** — chúng thất bại vì **selector/tab index cũ** sau đợt chuẩn hoá UI (§22) và đổi tab (AD‑01/P12).
**🔧 VIỆC KẾ (đề xuất):**
* **#26** `probe-p5`: điều hướng theo **NHÃN TAB** («Phân quyền phòng ban» cho cấp hàng loạt · «Phân quyền người dùng» cho tìm kiếm người dùng) + tìm ô tìm kiếm/nút qua **`ListToolbar`** + so khớp **không phân biệt hoa/thường** (do CSS uppercase) + **snapshot/khôi phục quyền** user đích (mục #25).
* **#27** `probe-p6`: bỏ khoá «đúng 12 tab»; kiểm nhật ký bằng **dòng MỚI NHẤT** (do `LIMIT 100`); tìm ô tìm kiếm qua `ListToolbar`.
**⚠️ GHI CHÚ TRUNG THỰC:** các mục trên đây tôi **⛔ chưa sửa probe** trong lượt này — đã **đọc mã để chứng minh tính năng tồn tại**, việc cập nhật probe là **việc kế** (⛔ không hạ nhẹ phép kiểm: vẫn phải kiểm được thao tác lọc thật).

### H.17 — 🔧 ĐÃ SỬA `probe-p6` ⇒ **ĐẠT (EXIT=0)** (lỗi công cụ **#26 ✅ XONG**) — và lộ ra 1 sự thật ĐÁNG CHÚ Ý về nhật ký
**4 sửa đổi (⛔ không hạ nhẹ phép kiểm, mỗi phép kiểm vẫn đòi bằng chứng THẬT):**
| # | Bản cũ | Đã sửa | Bằng chứng sau sửa |
|---|---|---|---|
| 1 | `check(after.length > before.length, …)` — so SỐ LƯỢNG | So **ID dòng MỚI** (`fresh = after.filter(a => !beforeIds.has(id))`) + vẫn đòi `fresh ≥ 3` | `✅ sinh ra bản ghi nhật ký (so ID dòng MỚI — ⛔ không so số lượng vì LIMIT 100) — 100 → 100 · **mới 3**` |
| 2 | `check(tabs.length === 12, "Có đúng 12 tab")` | `>= 12` (⛔ không khoá tổng số) | `✅ Có ÍT NHẤT 12 tab — **13**` |
| 3 | `check(tabs[10] === "Audit log", "Tab 11 = …")` — theo **VỊ TRÍ** | Theo **TÊN TAB** (`tabs.includes("Audit log")`) | `✅ Có tab "Audit log" (theo TÊN, ⛔ không theo vị trí)` |
| 4 | Ô tìm kiếm: `input.admin-search` (lớp CŨ) ở **CẢ 2 chỗ** (phát hiện + GÕ từ khoá) | Nhận `input[type=search]` (component dùng chung `ListToolbar.tsx:83`) **hoặc** lớp cũ; bước gõ **bắt buộc gõ thật** + bắn sự kiện React | `✅ Tìm kiếm lọc được nhật ký — **101 → 4**` |
**KẾT LUẬN ĐO ĐƯỢC:** `═══ KẾT LUẬN: ĐẠT ✅ ═══` · `EXIT=0` (trước đó 4 mục ❌).
> ⚠️ **BÀI HỌC ĐÁNG CHÚ Ý:** phép kiểm CŨ «sinh nhật ký» **ĐÃ SAI TỪ ĐẦU** vì Java trả `data.audits` với **`LIMIT 100`** — nếu chỉ tin nó thì đã **kết luận oan «không sinh nhật ký»** (đọc mã + đo lại cho thấy **có 3 dòng mới** mỗi lần thao tác). ⛔ Đây là lý do vì sao mọi kết luận đỏ đều phải **đọc mã/đo lại** trước khi báo.
> ⚠️ **TRAP ĐÃ GẶP LẠI (lần 2) — đã sửa:** chú thích nằm **TRONG template literal của `ev()`** mà chứa **dấu huyền** (`… .card input.admin-search …`) làm vỡ cú pháp ⇒ `node --check` **1**. Đã viết lại chú thích **không dấu huyền** (ghi rõ trong mã) ⇒ `node --check` **0**.
**🔧 CÒN LẠI (việc kế #27):** viết lại `probe-p5` (điều hướng theo NHÃN TAB · tìm qua `ListToolbar` · so khớp không phân biệt hoa/thường · **snapshot/khôi phục quyền** user đích như mục #25).

### H.18 — `probe-p5`: **7 mục ❌ → 2 mục ❌** (đã vá 5) — 2 mục còn lại ĐÃ TRUY TẬN GỐC, cần viết lại BƯỚC 6
**5 mục đã vá (⛔ không hạ nhẹ):**
| Mục | Bản cũ | Đã sửa | Bằng chứng sau sửa |
|---|---|---|---|
| «Có dropdown chọn phòng ban — 0 lựa chọn» | đọc `.card select` (⛔ không còn) | đọc **mẫu mới**: mỗi phòng là 1 **nút** chứa `<b>mã</b>` + `<small>tên</small>` (`page.tsx:1824-1830`), ⛔ không phải `<select>` | `kiểu điều khiển: nut-ma-ten · ["Ban giám đốc","Phòng Dự án","Hành chính Pháp chế","Ban chỉ huy công trường","Phòng Kế hoạch","Phòng Tài chính – Kế toán"]` ✅ |
| «Dropdown hiển thị TÊN phòng ban (không kèm mã)» | như trên | kiểm **tên** có «Kế hoạch» **và** `codeInName === false` | ✅ |
| «Có nút cấp quyền hàng loạt + lưu» | regex `/cấp nhóm\|…/` — nhãn nay là «**Nhóm** Kế hoạch/Dự án/Tài chính/Hành chính» | regex `/nhóm \|bỏ chọn\|lưu thay đổi/i`, vẫn đòi **≥5** | `✅ NHÓM KẾ HOẠCH \| NHÓM DỰ ÁN \| NHÓM TÀI CHÍNH \| NHÓM HÀNH CHÍNH \| BỎ CHỌN TẤT CẢ \| LƯU THAY ĐỔI` ✅ |
| «Có ô tìm kiếm» (×2 chỗ: phát hiện + GÕ) | `.card input.admin-search` (lớp CŨ) | nhận `input[type=search]` (`ListToolbar.tsx:83`) **hoặc** lớp cũ | ✅ |
| «Tìm kiếm lọc được danh sách — 19 → 19» | hệ quả của việc ⛔ không gõ được (input `null`) | gõ thật vào input mới | `✅ Tìm kiếm lọc được danh sách — **19 → 3**` ✅ |
**2 mục CÒN LẠI = «CHẶN cấp quyền mà phòng ban không có» + «Quyền chức năng KHÔNG bị mất — 59 → 1»** ⇒ **đã truy tận gốc ở §H.15.2**: `assertDepartmentAllowsPermissions` có **3 cửa thoát sớm**; bước 5 của probe **tự thu hồi** quyền phòng ban vừa thêm ⇒ phòng trở về «⛔ chưa cấu hình» ⇒ rơi cửa ③ ⇒ lệnh **được chấp nhận là ĐÚNG**, và vì chấp nhận nên quyền user bị **ghi đè** (59 → 1).
**🔧 BẢN VIẾT LẠI BƯỚC 6 (đã thiết kế, ⛔ chưa áp — việc kế):**
1. **Chụp trạng thái** `user_module_permissions` của tài khoản đích (snapshot để khôi phục — mục #25).
2. **Cấu hình phòng TRƯỚC**: giữ 1 quyền phòng ban (module **khác** module sẽ xin) ⇒ `deptConfigured = true`.
3. Xin cấp module mà phòng ⛔ **không** có ⇒ **bắt buộc 400** (phép kiểm giữ nguyên độ chặt).
4. Kiểm **quyền không bị mất** (so với snapshot).
5. **DỌN trong `finally`**: thu hồi quyền phòng vừa thêm **+ khôi phục quyền user từ snapshot** (⛔ không để lại tác dụng phụ).
### H.18.1 — SỔ KIỂM CHỐT ĐỢT RÀ PROBE (tổng hợp **§H.1 → §H.19**; đặt ngay sau §H.18 cho tiện đối chiếu — **§H.19 là ca CUỐI được vá**, đọc kèm bên dưới)
```text
SỐ PROBE ĐÃ CHẠY        : **109 tệp probe · 109/109 đã có kết quả** (9 đợt §H.1 → §H.23 + **§H.25 kiểm độ phủ** + §H.26–§H.34) · ⛔ **0 ca còn BLOCKED/ngoại lệ**
LỖI CÔNG CỤ/PROBE ĐÃ SỬA: **28** *(bản gốc ghi 27; nay +1 = #33 vá tiền đề 2 probe theo MT2 §7 — xem §H.27)* (⚠️ ĐÍNH CHÍNH CÁCH GHI — xem bảng truy vết ngay dưới: các số `#n` trong §H
                                là số ĐÁNH THEO LÚC VIẾT (có ca «đề xuất» rồi làm ở số khác) ⇒ ⛔ KHÔNG phải
                                danh sách `#1..#30` liền mạch; con số **27 là ĐẾM SỰ KIỆN ĐÃ VÁ**, ⛔ không phải số thứ tự)
LỖI SẢN PHẨM THẬT ĐÃ VÁ  : 1   (nút «Thu gọn khối» ở Phiếu đề nghị — state `collapsed` chỉ đổi nhãn;
                                đã kiểm LIVE bằng click CHUỘT THẬT: `bodyScroll 1605 → 375`)
LỖI SẢN PHẨM ĐANG ĐỎ    : 0   ← mọi ca đỏ còn lại đều đã được ĐỌC MÃ / ĐO CSDL / ĐO LIVE để phân loại
```

**📋 BẢNG TRUY VẾT CÁC CA ĐÃ VÁ (những ca ⛔ nêu được CHÍNH XÁC tệp + nguyên nhân + mục bằng chứng):**
| # | Tệp / hạng mục đã vá | Nguyên nhân (đã chứng minh) | Bằng chứng |
|---|---|---|---|
| 1 | `tools/probe-user-profile.mjs` | selector cũ `.admin-mini-list button` + cấu trúc 4 tab nay khác | §H.7.2 (**ĐẠT**) |
| 2 | `tools/probe-material-perm.mjs` | phép kiểm `enabled` sai công thức | §H.7.3 (**ĐẠT**) |
| 3 | `tools/probe-task041-delete.mjs` | tiền đề cũ + ⛔ không khôi phục dữ liệu | §H (có khôi phục theo trạng thái đầu) |
| 4 | `tools/probe-live-rolebase.mjs` | đọc danh tính bằng `POST {action:"me"}` (nay 403/400) ⇒ chuyển `GET /api/system` | §H |
| 5 | `tools/probe-p2-live-approval.mjs` | tài khoản hỏng + cần ≥2 phiên | §H |
| 6 | `tools/probe-write-map-triage.mjs` | ⛔ chưa tách `INSERT` vs `UPDATE` ⇒ thêm `collectSplit()` | §H.6.3 |
| 7 | `tools/probe-menu-11.mjs` | 4 kỳ vọng cũ: tab 1 «Nhân sự»→«Tài khoản» · khoá «đúng 12 tab» · nhóm «CÔNG VIỆC» | §H.10.1 (**ĐẠT**) |
| 8 | `tools/probe-task075-attachments.mjs` | khối đính kèm **đã chuyển** sang `lib/ui-shared.tsx` | §H.11 (**22/22 ĐẠT**) |
| 9 | `tools/seed-p2-test-data.mjs` | thiếu `bch_confirmed_by`/`bch_confirmed_at` | §H.13 (kiểm cân xứng 15=15) |
| 10 | `tools/probe-p6.mjs` | so SỐ LƯỢNG (audits `LIMIT 100`) · khoá 12 tab · tab theo vị trí · selector `ListToolbar` | §H.17 (**ĐẠT**) |
| 11 | `tools/probe-p5.mjs` | danh sách phòng ban mẫu mới · nhãn «Nhóm …» · `ListToolbar` · **tiền đề sai** · thiếu snapshot/khôi phục | §H.18 + §H.19 (**ĐẠT**) |
| 12 | `tools/probe-task073-team-members.mjs` | fixture lần trước còn sót ⇒ `ERROR 1062` | §H.21 (**21/21 ĐẠT**) |
| 13 | `tools/probe-task040-nhom45.mjs` | đòi `argv` ⇒ tự dò `stock_issue_items` (READ-ONLY) | §H.22 (**9/9 ĐẠT**) |
| 14 | `tools/probe-p2-ui-dom.mjs` | **P6-08** vẽ nhóm 1 mục thành **nút đi thẳng** (⛔ còn `.nav-child`) | §H.23 (**5/5 dấu ĐẠT**) |
> ⚠️ **NÓI THẲNG:** bảng trên liệt kê **14/27** ca có thể truy vết **chính xác tệp + nguyên nhân**; **13 ca còn lại** nằm rải trong các mục §H (nhiều ca là **sửa nhỏ trong lúc chạy**: selector, tiền đề, khôi phục dữ liệu) ⇒ ⛔ **tôi KHÔNG bịa số thứ tự** để lấp cho đủ; muốn tra từng ca thì đọc §H tương ứng.

**5 NHÓM NGUYÊN NHÂN ĐÃ CHỨNG MINH (⛔ không phải suy đoán):**
| Nhóm | Ca tiêu biểu | Bằng chứng |
|---|---|---|
| ① CŨ‑SHAPE do **chuẩn hoá UI §22** | ô tìm kiếm/nút nay ở `ListToolbar` dùng chung (`ListToolbar.tsx:83,87`) | `probe-p6`: «lọc 101 → 4» sau khi vá selector · `probe-p5`: «lọc 19 → 3» |
| ② CŨ‑SHAPE do **thêm tab / đổi tên** | 12 → **13** tab (P12-01 «Thông báo») · «Nhân sự» → «**Tài khoản**» (AD-01) · «CÔNG VIỆC CỦA TÔI» → «**CÔNG VIỆC**» (`menu-helpers.ts:101`) | `probe-menu-11` **ĐẠT** sau vá · `probe-p6` **ĐẠT** |
| ③ **SAI PHƯƠNG PHÁP ĐO** | `data.audits` có `LIMIT 100` ⇒ so **số lượng** ⛔ không bao giờ tăng | đổi sang so **ID dòng mới**: «100 → 100 · **mới 3**» ✅ |
| ④ **TIỀN ĐỀ SAI** | `approve_stock_issue` giao **kế toán** `kttdemo` (bước ② `WF-XUATKHO-01`) chứ ⛔ không phải kho ⇒ 403 của `tkhodemo` là ĐÚNG · phòng **KH đã có** `dept_legal_correspondence` (`active=1, can_view=1`) ⇒ guard cho phép là ĐÚNG | khi xin chức năng **thật sự chưa cấp** (`dept_legal_seal`) ⇒ backend **CHẶN 400 THẬT** + «quyền 59 → 59» + «dọn dẹp về trạng thái đầu» ✅ |
| ⑤ **MÔI TRƯỜNG / FIXTURE** | thiếu `issueItemId` · `mysql.exe` ngoại lệ · dữ liệu tồn dư «đã có báo cáo kỳ này» · `thukydemo` **401** (credential drift 21/09) · fixture `USR_…-central_warehouse` trùng · 14 dòng phiếu nhập thiếu người xác nhận **do SEED** (đã vá seed) | ⛔ không ca nào là lỗi mã sản phẩm |
**BÀI HỌC GHI LẠI (đã ghi trong mã + hồ sơ):** ⛔ **KHÔNG dùng PowerShell `Get-Content`/`WriteAllText` để sửa tệp có tiếng Việt** (gây double-encode — đã xảy ra **2 lần**, cả 2 lần tự phát hiện bằng câu kiểm chuỗi + `git checkout` khôi phục rồi vá lại bằng công cụ `edit`) · ⛔ **không đặt dấu huyền (backtick) trong chú thích nằm TRONG template literal `ev(\`…\`)`** (vỡ cú pháp — đã xảy ra **2 lần**) · mọi probe **đổi dữ liệu thật** phải **snapshot + khôi phục trong `finally`** (mục #25).

### H.19 — `probe-p5` ⇒ **ĐẠT ✅ (EXIT=0)** — lỗi công cụ **#27 ✅ XONG** · và **CHỨNG MINH ĐƯỢC** ràng buộc phòng ban hoạt động đúng
**Đo để bác bỏ giả định SAI của probe (quan trọng nhất lượt này):**
| Câu đo | Kết quả |
|---|---|
| `department_module_permissions` của đơn vị **KH** — có `dept_legal_correspondence`? | **CÓ** — `active=1, can_view=1` |
| Số chức năng KH đã cấu hình | **59** |
| `nhan_vien.auto_grant_all` (cấp bậc user bị thử) | **0** (⛔ không rơi cửa thoát sớm «tự động toàn quyền») |
⇒ Chức năng mà probe bản cũ xin cấp (`dept_legal_correspondence`) **đã thuộc phòng KH** ⇒ backend **cho phép là ĐÚNG THIẾT KẾ** ⇒ 2 mục ❌ còn lại là **TIỀN ĐỀ SAI CỦA PROBE**, ⛔ **không phải lỗi sản phẩm**.
**Vá cuối cùng (⛔ không hạ nhẹ):** (a) khẳng định **phòng ĐÃ được cấu hình** (đo được: 59 chức năng) làm tiền đề; (b) xin cấp **`dept_legal_seal`** — chức năng đã **kiểm `!khModules.has(...)`** ở bước 5 (phòng ⛔ không có) ⇒ ràng buộc **PHẢI** chặn.
**BẰNG CHỨNG SẢN PHẨM ĐÚNG (đây là phần giá trị nhất):**
* `✅ Phòng Kế hoạch ĐÃ được cấu hình quyền (tiền đề…) — 59 chức năng`
* `✅ CHẶN cấp quyền mà phòng ban không có (dept_legal_seal) — Phòng ban “Phòng Kế hoạch” chưa được cấp quyền cho chức năng “dept_legal_seal”. Hãy cấp ở tab “Phân quyền phòng ban” trước…` ⇒ **backend THẬT SỰ chặn (400)**
* `✅ Quyền chức năng KHÔNG bị mất khi yêu cầu bị chặn — 59 → 59`
* `✅ DỌN DẸP: khôi phục quyền/phạm vi người dùng về TRẠNG THÁI ĐẦU — perms 59 → 59 · scopes 0 → 0`
**KẾT LUẬN:** `═══ KẾT LUẬN: ĐẠT ✅ ═══` · `EXIT=0` (trước đó **7 mục ❌**). ⛔ **0 lỗi sản phẩm**; probe đã có **snapshot/khôi phục** nên ⛔ **không còn tác dụng phụ** (mục #25 đã được thực hiện luôn trong bước này).
**➕ QUÉT LAN LỚP LỖI TƯƠNG TỰ (state chết) — ⛔ KHÔNG tìm thêm ca nào:** quét **55 tệp `.tsx`/`.ts`** trong `app/` tìm `const [x, setX] = useState(...)` mà biến `x` **⛔ không bao giờ được ĐỌC** ⇒ **0 ca**. ⚠️ Nói thẳng **giới hạn của phép quét**: nó chỉ bắt được state *hoàn toàn không đọc*; ca đã vá ở `RequestDrawer` là loại **đọc nhưng chỉ để đổi nhãn của chính nút** ⇒ muốn bắt đủ lớp này cần **phân tích AST** (⛔ ngoài phạm vi hiện tại) — nên ⛔ không kết luận «hết sạch» loại lỗi này. Script tạm đã **xoá** sau khi dùng; ⛔ không để lại tệp lạ (các tệp `tools/_*.mjs` còn lại là script **có từ trước**, ⛔ không phải của đợt này).

### H.21 — 🔧 `probe-task073-team-members`: **0/1 (ngoại lệ) → 21/21 ĐẠT** (lỗi công cụ **#28 ✅ XONG**)
**Lỗi đo được (KHÔNG đoán):** `ERROR 1062 (23000) at line 1: Duplicate entry 'PRB073-A' for key 'team_members.PRIMARY'` ⇒ probe cắm fixture `PRB073-A/B` nhưng **lần chạy TRƯỚC đã để lại đúng 2 dòng đó** và probe ⛔ **không dọn trước** ⇒ ném ngoại lệ ngay ở bước cắm ⇒ `0/1 ĐẠT` («NGOẠI LỆ khi chạy»).
**Đã sửa 2 chỗ (⛔ không hạ nhẹ phép kiểm; chỉ thêm DỌN ĐÚNG 2 id CỦA CHÍNH PROBE `PRB073-*`, ⛔ không chạm dữ liệu nghiệp vụ):**
1. **DỌN TRƯỚC KHI ĐO MỨC NỀN** — vì nếu lần trước còn sót thì mức nền bị **phồng** ⇒ phép kiểm C8 («sau dọn = mức nền») **⛔ không thể đúng** (đo được: `sau dọn = 4 · mức nền = 6`).
2. **DỌN ngay trước khi CẮM** ⇒ chạy lại được nhiều lần (idempotent).
**KẾT QUẢ SAU SỬA:** `KẾT QUẢ: 21/21 ĐẠT` · `EXIT=0` — gồm `✅ C8 · dọn sạch fixture — sau dọn = 4 · mức nền = 4` · `✅ C7 · tài khoản KHÔNG phải admin ⛔ không nhận dữ liệu này — rò rỉ = 0` · 4 phép **đối chứng âm** (giống⇒KHỚP · khác⇒LỆCH · null vs 'NULL'⇒LỆCH · so sai cặp cột⇒LỆCH) đều ĐẠT.
**⏭️ 2 ca còn chặn-bởi-môi-trường (việc kế):** `probe-task040-nhom45` (cần `issueItemId` thật — nên **tự dò** từ payload thay vì đòi biến môi trường) · `probe-p2-ui-dom` (`BLOCKED` ở `[approval-step-decided-at]`/`[approval-step-comment]` — cần chọn phiên có bước **ĐÃ quyết**).

### H.22 — 🔧 `probe-task040-nhom45`: **exit 2 (thiếu fixture) → 9/9 ĐẠT** (lỗi công cụ **#29 ✅ XONG**) + ĐO TIỀN ĐỀ CA CUỐI
**Bản cũ:** `if (!ISSUE_ITEM_ID) process.exit(2)` ⇒ probe **chưa bao giờ chạy được** trong đợt rà (luôn «Thiếu `issueItemId`»).
**ĐÃ VÁ (⛔ không hạ nhẹ, ⛔ không bịa id):** nếu thiếu argv thì **TỰ DÒ** 1 dòng THẬT bằng `SELECT id FROM stock_issue_items ORDER BY created_at DESC LIMIT 1` (**READ-ONLY, ⛔ không ghi**); ưu tiên argv khi có; nếu DB cũng rỗng thì mới thoát với thông báo rõ.
**KẾT QUẢ SAU SỬA:** `(tự dò) issueItemId = SMII_507ce9bf-da26-4a9b-ac23-c139e3933f22 — lấy từ stock_issue_items (READ-ONLY)` · **`9/9 mục ĐẠT`** · `EXIT=0`, gồm bằng chứng **tầng chặn hoạt động đúng**:
| Phép kiểm | Kết quả đo |
|---|---|
| dòng xuất kho ⛔ không tồn tại | `HTTP 400 "Dòng xác nhận lắp đặt không hợp lệ."` |
| action tới được tầng nghiệp vụ (⛔ không 500) | `HTTP 400` |
| số lượng `0` | `HTTP 400` đúng thông điệp |
| xác nhận **vượt** số lượng đã nhận | `HTTP 400 "Số lượng xác nhận lắp vượt số lượng tổ đội đã nhận."` |
| ⛔ không lộ lỗi 500 ở cả 3 nhánh | ✅ |
| hợp đồng giao khoán ⛔ không tồn tại | `HTTP 400 "Không có quyền quyết toán hợp đồng này."` |
| action **CÓ** được Java triển khai (⛔ không còn thông điệp Strangler) | ✅ |
| **RBAC**: `confirm_installation` chặn ở backend khi thiếu quyền | `HTTP 403` (đăng nhập `nvdademo`, engine role `project`) |
**➕ ĐO TIỀN ĐỀ CHO CA CUỐI `probe-p2-ui-dom` (⛔ không đoán):** probe báo `BLOCKED` ở 2 dấu `[approval-step-decided-at]`/`[approval-step-comment]`. **DỮ LIỆU CẦN THIẾT ⛔ KHÔNG thiếu:**
| Câu đo | Kết quả |
|---|---|
| `approvals` tổng | **287** dòng |
| đã quyết (`decided_at IS NOT NULL`) | **134** |
| **đã quyết VÀ có bình luận** (`comment` khác rỗng) | **119** |
| `approval_stage_decisions` | 0 dòng *(bảng trống — luật hiện hành ghi ở `approvals`)* |
⇒ ⇒ **Kết luận: BLOCKED là do ĐIỀU HƯỚNG/CHỌN PHIÊN của probe**, ⛔ không phải thiếu dữ liệu (và ⛔ không phải lỗi sản phẩm). **Việc kế:** sửa bước chọn phiên/điều hướng của `probe-p2-ui-dom` để mở đúng phiếu **đã có bước quyết kèm bình luận**, và ⛔ vẫn giữ `exit 2` nếu không tới được màn (⛔ không nhận ĐẠT khống).

### H.23 — 🔧 `probe-p2-ui-dom`: **BLOCKED (exit 2) → ĐẠT ✅** (lỗi công cụ **#30 ✅ XONG**) — **HẾT CA BLOCKED CUỐI CÙNG**
**LÝ DO NGUYÊN VĂN (đo được, ⛔ không đoán):** `bấm mục menu «Trung tâm phê duyệt» → EXPANDED` ⇒ `⛔ BLOCKED … LÝ DO: không tìm thấy mục menu «Trung tâm phê duyệt» trong sidebar — EXPANDED`.
**TRUY TẬN GỐC (đọc mã):** `app/page.tsx:578-580` — **P6-08** vẽ nhóm menu **CHỈ CÓ 1 MỤC** thành **NÚT ĐI THẲNG** (`className="nav-dashboard-direct nav-single-direct"`), ⛔ **không còn `.nav-child`**; probe lại chỉ tìm `.sidebar .nav-child` ⇒ luôn `NOT_FOUND` ⇒ **BLOCKED OAN** (đúng ca mà `probe-p6-08-menu-single-item` **3/3 ĐẠT** đã chứng minh là tính năng ĐÚNG).
**ĐÃ VÁ (#30):** bước bấm menu tìm trong **MỌI phần tử bấm được của sidebar** (`.sidebar button` · `.nav-child` · `.nav-single-direct` · `.nav-dashboard-direct` · `.nav-parent`), **vẫn ưu tiên KHỚP ĐÚNG NHÃN** rồi mới tới khớp chứa; giữ nguyên nhánh mở-rộng dự phòng. ⛔ Không hạ nhẹ: vẫn phải **tìm thấy + bấm đúng mục thật** rồi mới đo DOM, và ⛔ vẫn giữ `exit 2` (BLOCKED) nếu không tới được màn.
**KẾT QUẢ SAU SỬA — `KẾT LUẬN: ĐẠT ✅ — 5/5 dấu có thật trên DOM của bundle ĐANG PHỤC VỤ` · `EXIT=0`:**
| Bằng chứng | Kết quả đo |
|---|---|
| PHẦN A — asset JS ĐANG PHỤC VỤ | HTML tham chiếu **5 asset** · trang **thật sự nạp 5 asset** · **`page-C3s9lFmS.js` = 1.024.969 byte chứa ĐỦ 5/5 chuỗi dấu** (qua proxy `:9000`) ✅ |
| `[approval-step-decided-at]` trên DOM lúc chạy | ✅ «Thời điểm duyệt» (D4 §19) |
| `[approval-step-comment]` trên DOM lúc chạy | ✅ «Bình luận: "Kiểm thử GĐ-C bước 3"» · «"Kiểm thử GĐ-C bước 4"» — **bước ĐÃ quyết kèm bình luận THẬT** |
| ca **bước CHƯA quyết** (đối chứng) | ✅ «Bình luận: **chưa có nguồn** *(bước chưa ra quyết định nên chưa có ý kiến)*» — ⛔ không bịa nội dung |
**⇒ TỔNG KẾT ĐỢT RÀ: ⛔ KHÔNG còn ca** `BLOCKED`/ngoại lệ nào trong toàn bộ 85+ probe; **0 lỗi SẢN PHẨM đang đỏ**.

### H.24 — 🔎 ĐO LẠI CỔNG ẢNH CHUẨN: `probe-visual-regression` = **KHÔNG ĐẠT · 59/68 ảnh lệch** (bằng chứng cho quyết định)
**Nguyên văn kết luận:** `KẾT LUẬN: KHÔNG ĐẠT ❌ — 59/68 ảnh lệch`
**ĐO ĐƯỢC:**
| Điều | Số thật |
|---|---|
| Thư mục `tools/baseline/` | **68 tệp PNG**, **toàn bộ ghi ngày 2026‑09‑21** (⚠️ «20/09» trong hồ sơ cũ là **ngày yêu cầu R-01**, ⛔ không phải ngày tệp) |
| Số ảnh lệch khi chạy lại | **59/68** |
| Dạng lệch đáng chú ý | `19-report-center`: «**KÍCH THƯỚC ẢNH KHÁC**: chuẩn 1920×1080 vs nay **1920×2214**» ⇒ màn nay chụp **toàn trang** (baseline cũ chụp khung nhìn) · nhiều màn lệch **11–12,6%** (tablet) |
| Chống lỗi giả của probe | lệch **1 lần chưa kết luận** — chỉ báo LỆCH khi **cả hai** lần chụp đều vượt ngưỡng (`probe-visual-regression.mjs:592-593`) ⇒ các ca trên **đã xác nhận 2 lần** |
⚠️ **NÓI THẲNG GIỚI HẠN:** ⛔ **tôi chưa duyệt từng màn** nên ⛔ **không dám khẳng định** cả 59 ca đều là thay đổi MT2 **có chủ đích** — nhiều khả năng phần lớn là do (a) màn nay chụp **fullPage** và (b) các thay đổi UI đã biết (13 tab · đổi tên nhãn · bản vá «Thu gọn khối»), nhưng **muốn chắc phải duyệt từng ảnh**.
**⇒ HỆ QUẢ:** với **59/68 lệch**, cổng này ⛔ **mất khả năng phát hiện hồi quy MỚI** ⇒ **cần user quyết**: **(A)** ghi lại ảnh chuẩn (**⚠️ nên duyệt từng màn trước**) · **(B)** giữ baseline cũ + ghi nhận known limitation. ⇒ `MT2_BLOCKER_DECISION_BRIEF.md` §⑤.5.1.

### H.25 — 🔎 KIỂM **ĐỘ PHỦ** SỔ KIỂM: `tools/probe-*.mjs` = **109 tệp** · trước đây chỉ **103** tệp có kết quả ⇒ **đã chạy nốt 6 tệp còn thiếu**
**ĐO ĐƯỢC:** tổng **109** tệp probe · có tên trong sổ kiểm §H = **103** ⇒ **6 tệp CHƯA từng được ghi kết quả**: `probe-admin-tabs-toolbar` · `probe-roadmap-progress` · `probe-task040-nhom1-authz` · `probe-task040-nhom3` · `probe-task040-nhom3b` · `probe-task041-last-stage`.
| Probe | Kết quả đo được | Phân loại |
|---|---|---|
| `probe-admin-tabs-toolbar` | ✅ **`KẾT LUẬN: ĐẠT ✅ (11 mục)`** · `EXIT=0` — gồm «Ô tìm kiếm ở bước 6 **LỌC THẬT** — nhập từ khóa không tồn tại: **19 dòng → 1 dòng**» · «AuditLogManager: tiêu đề đúng — đọc được: "BỘ LỌC"» | ✅ **ĐẠT** — **xác nhận ĐỘC LẬP** cho kết luận của `probe-p5`/`probe-p6` về `ListToolbar` |
| `probe-roadmap-progress` | ✅ `EXIT=0` — **là CÔNG CỤ BÁO CÁO, ⛔ không phải cổng**: «TIẾN ĐỘ MASTER TASK (nguồn `docs/25_TODO_ROADMAP.md`) · Tổng số mục: **110** · **DONE 108/110 (98,2 %)** · **BLOCKED 1 (0,9 %)** · **TODO 1 (0,9 %)**» | ✅ **ĐẠT** (khớp dòng «MASTER TASK 1 (cũ): DONE 108/110 (98,2 %)» trong hồ sơ) |
| `probe-task040-nhom1-authz` | ✅ «ranh giới phân quyền đúng, hai khoá mới ⛔ không rò rỉ» (đo ở đợt 6) | ✅ |
| `probe-task040-nhom3` | ✅ «định mức vật tư đã hết 500, đúng hợp đồng payload của UI» (đợt 6) | ✅ |
| `probe-task040-nhom3b` | ✅ **17/17 ĐẠT** (đợt 6) | ✅ |
| `probe-task041-last-stage` | ⚠️ **4/7 mục ĐẠT · `EXIT=1`** — 3 mục HỎNG: ① «dựng được kịch bản: đúng 1 bước hoạt động — **4**» ② «bước 5 KHÔNG có hồ sơ chờ — **2**» ③ «chặn đúng nguyên văn JS — HTTP 400 "Bước này đang có hồ sơ chờ xử lý. Hãy xử lý hết hồ sơ hoặc giữ bước hoạt động; phiếu đang chạy không được cắt ngang."». ✅ **2 mục QUAN TRỌNG vẫn ĐẠT:** «**trạng thái cuối = trạng thái đầu** — `1:1,2:1,3:1,4:1,5:1,101:1,102:1,103:1` → y hệt» (⛔ không để lại tác dụng phụ) · «không còn bước tạm nào (stage_no=900)» | 🔵 **TIỀN ĐỀ SAI (⛔ không phải lỗi sản phẩm)** — probe đòi «**đúng 1** bước hoạt động» nhưng CSDL có **nhiều hơn** (bước 1–5 + **101–103 là hàng MIRROR**) và **có 2 hồ sơ chờ ở bước 5** ⇒ kịch bản «xoá bước cuối» ⛔ **không dựng được**; phép kiểm ③ vì thế bị chặn **do lý do KHÁC** (hồ sơ chờ) — mà thông điệp **400 vẫn hợp lý nghiệp vụ** |
**⇒ KẾT LUẬN ĐỘ PHỦ:** sau §H.25, **109/109 tệp probe đều ĐÃ CÓ kết quả ghi lại** (103 + 6) · ⛔ **0 lỗi sản phẩm mới** trong 6 ca này · mọi ca HỎNG còn lại thuộc nhóm **TIỀN ĐỀ/CŨ‑SHAPE** và đã được **truy tận gốc bằng số đo**.

### H.26 — CHẠY 4 CÔNG CỤ **KIỂM TRA** (⛔ không phải probe) ⇒ **3 XANH + 1 PHÁT HIỆN MỚI**
| Công cụ | Kết quả đo được | Ý nghĩa |
|---|---|---|
| `tools/audit-java-only-actions.mjs` | `EXIT=0` · «Action Java-only: **12** · Có module rỗng (mặc định từ chối): **6** · **Rủi ro (rỗng module + KHÔNG chặn admin): 0**» · «✅ Mọi action module-rỗng đều đã được controller chặn admin ⇒ việc mặc định từ chối là **CHÍNH ĐÁNG**» | ✅ **GỠ LO NGẠI BLK-03** (nhóm «action tổ đội để `List.of()` ⇒ 403 cho non-admin»): 6 action đó **⛔ không có đường tới từ UI/API** ⇒ default-deny là **đúng**, ⛔ không phải lỗi |
| `tools/check-approval-dept-mapping.mjs` | `EXIT=0` · «tra được phòng ban: **127** · `approverUserId` rỗng: **0** · không có trong danh bạ: **0** · có trong danh bạ nhưng department TRỐNG: **0**» · «toàn bộ **127 bước đã quyết** đều tra được phòng ban KHÁC RỖNG» | ✅ ánh xạ **bước duyệt ↔ phòng ban** đúng dữ liệu (nền cho hiển thị «Phòng ban: …») |
| `tools/verify-seed-v3.mjs` | `EXIT=0` · «✅ **MENU DỰNG ĐƯỢC TỪ DỮ LIỆU**» (`hr_legal` 6 mục · `reports` 5 · `material_master` 1 · `system_admin` 1 …) | ✅ dữ liệu/menu seed **nhất quán** |
| `tools/audit-team-members.mjs` | `EXIT=0` · **«KẾT LUẬN cách nạp dữ liệu: CONFIRMED»** — ⛔ **«Không có bất kỳ action nào (JS lẫn Java) ghi `team_members` ⇒ dữ liệu ⛔ KHÔNG thể sinh ra từ luồng sản phẩm»** · «100% dòng hiện có đến từ SQL ngoài sản phẩm: seed `tools/task080-seed-real-data.sql` + fixture probe» · «Hệ quả: màn «Thành viên tổ đội» mở ra ở trạng thái **CHỈ ĐỌC**; muốn thêm/sửa thành viên **phải có action mới**» | 🔴 **PHÁT HIỆN MỚI (khoảng trống chức năng)** — đã ghi vào **`MT2_BLOCKER_DECISION_BRIEF.md` §⑤.7** |
**⇒ 3 công cụ đầu: 0 lỗi sản phẩm** · công cụ thứ 4 nêu **khoảng trống «ghi `team_members`»** ⇒ **cần user quyết** (⛔ tôi không tự thêm action mới — đó là **tính năng mới**, MT2 §40/§14).

#### H.26.1 — ✅ **ĐÍNH CHÍNH: cái «khoảng trống» đó ⛔ KHÔNG PHẢI khoảng trống — ĐÚNG YÊU CẦU MT2 §8**
Tôi **tra lại NGUỒN SỰ THẬT** (`docs/dsh/MASTER_TASK_2.md`) thay vì dừng ở suy luận:
* **§8 TỔ ĐỘI (`:210-211`), nguyên văn:** «Chỉ hiển thị **danh sách tổ đội** + **Filter theo dự án**. ⛔ **Không tự thêm nghiệp vụ ngoài phạm vi**.»
* **§5.2 (`:100`):** mỗi tab «① hiển thị danh sách ② có thông tin thực tế ③ click item ④ **mở modal detail**» — ⛔ **không có** yêu cầu thêm/sửa.
* **Tính năng HIỂN THỊ đã có thật:** `app/screens/TeamDirectory.tsx` · `ProjectDetailTabs.tsx:152,259` · `ProjectEntityModal.tsx:149`; và chính mã ghi rõ (`TeamDirectory.tsx:13`): «Khoá `teamMembers` là **Java-only**; `scripts/system-route.mjs` ⛔ KHÔNG có `team_members`/`teamMembers`» ⇒ **chỉ-đọc là CHỦ Ý**.
**⇒ KẾT LUẬN:** màn chỉ-đọc là **ĐÚNG yêu cầu**; ⛔ nếu tự thêm action ghi thì **vi phạm** câu «⛔ Không tự thêm nghiệp vụ ngoài phạm vi» (và MT2 §14). ⇒ **MỤC NÀY ĐÓNG, ⛔ không cần user quyết.**
⚠️ **BÀI HỌC GHI LẠI:** công cụ audit chỉ ra «thiếu đường ghi» là **đúng về mặt kỹ thuật**, nhưng ⛔ **không tự động là khiếm khuyết** — phải **đối chiếu với NGUỒN SỰ THẬT** trước khi xếp vào nhóm «cần làm» (đúng tinh thần MT2 §1/§4).

### H.27 — 🔧 VÁ TIỀN ĐỀ PROBE THEO **NGUỒN SỰ THẬT** (lỗi công cụ **#33**) ⇒ `probe-task043` **27/27 ĐẠT** · **ĐÓNG MỤC ⑤.3**
**ĐỌC NGUỒN SỰ THẬT `MASTER_TASK_2.md` §7 (KHO VẬT TƯ):**
* **§7.5 Xuất kho (`:199`), nguyên văn:** «Thêm **CRUD · Search · Sort · Filter**. Hiển thị danh sách phiếu xuất · đơn xuất kho.» ⇒ ⛔ **KHÔNG** quy định bước duyệt.
* **§7.6 Cấp phát — Hoàn trả (`:206`), nguyên văn:** «⚠️ **Logic nghiệp vụ + workflow + quyền sẽ triển khai SAU khi business rule được xác định** ⇒ hiện tại **chỉ triển khai cấu trúc UI/list/tab/data foundation**. ⛔ **Không tự suy diễn nghiệp vụ**.»
⇒ **KẾT LUẬN:** MT2 ⛔ **KHÔNG** đặt 3 bước `stage_kind='supply'` (101–103) vào `approval_stage_catalog` ⇒ chúng là **hàng MIRROR/legacy**, ⛔ **không thuộc phạm vi MT2** ⇒ tiền đề «**MỌI** bước đang hoạt động phải có Owner» của 2 probe là **SAI** (⛔ không phải lỗi sản phẩm).
**ĐÃ VÁ (#33) — ⛔ không hạ nhẹ, chỉ THU HẸP đúng phạm vi (giữ nguyên độ chặt cho 8 bước thật của chuỗi phiếu đề nghị):**
| Tệp | Sửa | Kết quả sau sửa |
|---|---|---|
| `tools/probe-task043-custom-fields.mjs` | tiền đề chỉ kiểm bước có `COALESCE(stage_kind,'approval')='approval'` | ✅ **`27/27 ĐẠT` · `EXIT=0`** (trước đó `EXIT=1`) |
| `tools/probe-task048-audit-requests.mjs` | vá tiền đề GIỐNG HỆT (cùng một dòng `SELECT`) | ⚠️ `4/18 ĐẠT · EXIT=1` — **đã truy tận gốc:** mọi mục HỎNG **dồn từ MỘT nguyên nhân**: `A2 · HTTP 400 "Bạn không phải Owner được phân công của bước này nên không được phê duyệt."` ⇒ probe dùng **tài khoản KHÔNG phải Owner bước 1** ⇒ cả chuỗi `EDIT_RETURNED`/`RESUBMIT`/`CANCEL` ⛔ không thể xảy ra. ⚠️ **Probe này đã bị THAY** — chính thông điệp của nó trỏ sang **`probe-task054-all-roles.mjs` (20/20 ĐẠT)** ⇒ **CŨ‑SHAPE/superseded**, ⛔ không phải lỗi sản phẩm. ⏭️ Việc còn lại: sửa tài khoản đăng nhập cho khớp Owner bước 1 (hoặc bỏ hẳn probe đã bị thay). |
**⇒ MỤC ⑤.3 ĐÓNG — chọn (A) nới tiền đề probe, và điều này do NGUỒN SỰ THẬT xác nhận** (⛔ không phải ý kiến của tôi): ⛔ **không** chọn (B) phân công Owner cho hàng mirror (MT2 ⛔ không yêu cầu) · ⛔ **không** chọn (C) ẩn/xoá dữ liệu (MT2 §19 + ⛔ không cần thiết).

### H.28 — 📖 ĐỐI CHIẾU ⑤.1 VỚI NGUỒN SỰ THẬT: MT2 ⛔ KHÔNG yêu cầu 3 cột đó (hạ mức rủi ro 🔴 CAO)
**Tra MASTER_TASK_2.md:** `stage_kind` ⛔ không có · `avatar`/«ảnh đại diện» ⛔ không có · `approved_at`/`boq_version` ⛔ không có · `BOQ` chỉ có ở **danh sách TẠM BỎ QUA** (§12.3) và mô tả tự-fill khi tạo PR (`:151`).
⇒ Rủi ro «bước cung ứng lọt chuỗi phê duyệt» chỉ xảy ra **nếu** có bước cung ứng tạo qua Java — mà MT2 §7 ⛔ **không yêu cầu** đặt bước cung ứng vào `approval_stage_catalog`, và `save_approval_stage` hiện trả **403** ⇒ **lệch parity JS⇄Java, ⛔ KHÔNG phải yêu cầu MT2 bị thiếu**, và **còn TIỀM ẨN**.
⇒ **Khuyến nghị đúng phạm vi:** **(B) ghi nhận** ở P14-05; nếu muốn parity thì **(A)** đã có đặc tả sẵn: `docs/dsh/MT2-P14-06-SPEC.md`.
### H.29 — 📖 ĐỐI CHIẾU ⑤.6 VỚI NGUỒN SỰ THẬT: MT2 ⛔ KHÔNG yêu cầu ghi `before_json`/`after_json`
**Tra `MASTER_TASK_2.md`:** `nhật ký` ⛔ không có · `Audit log` ⛔ không có · `trước/sau` ⛔ không có · `after` ⛔ không có; chữ `audit` xuất hiện **chỉ với nghĩa ĐỘNG TỪ «hãy rà soát»** (§1 `:15` «audit hệ thống»; §6.x `:162` «Phải audit enum/state hiện tại»; §11 `:242` «phải audit API · response · mapping …») — ⛔ **không** phải yêu cầu về tính năng NHẬT KÝ có ảnh chụp trạng thái trước/sau.
⇒ `before_json` trống ở 1.486 dòng là **lệch chất lượng nhật ký**, ⛔ **KHÔNG phải yêu cầu MT2 bị thiếu** ⇒ khuyến nghị **(B) ghi nhận** trong `P14-05` (giữ nguyên đề xuất trước: nếu muốn làm thì **(C)** mở hẹp cho `delete_*` ở tầng use case, ⛔ không đụng filter).
### H.30 — ✅ KIỂM TRỰC TIẾP TRÊN **BUNDLE ĐANG PHỤC VỤ**: yêu cầu MT2 §6.11 ĐÃ ĐƯỢC THI HÀNH · + ĐÍNH CHÍNH CÁCH ĐẾM «5/5 dấu» · + HẠ MỨC ⑤.4
**1) Xác định ĐÚNG asset đang phục vụ (⛔ không đoán):** gọi `Invoke-WebRequest http://127.0.0.1:8787/` ⇒ **HTTP 200**, đọc HTML ⇒ asset = **`page-C3s9lFmS.js`** (khớp hồ sơ). Trong `dist` có **2** bundle cùng lúc 02:00 ngày 26/09: `page-B-01S9gs.js` (1.805,7 KB) và **`page-C3s9lFmS.js` (1.000,9 KB · ⛔ chính là bản được phục vụ)**.
**2) Yêu cầu MT2 §6.11 (:174) — ĐÃ THI HÀNH, kiểm trên CHÍNH bản đang phục vụ:**
| Phép kiểm | Kết quả đo được |
|---|---|
| Nhãn CŨ «Xác nhận giao hàng thực tế» (MT2 yêu cầu ĐỔI) | ✅ ⛔ **KHÔNG còn** — `False` trong `app/`+`lib/` VÀ `False` trong `dist/client/assets/page-C3s9lFmS.js` |
| Nhãn MỚI «Chi tiết đơn giao hàng» | ✅ **CÓ** — `Delivered.tsx:24-27` · `ReceiptDrawer.tsx` (modal, ⛔ không sideform) · `True` trong bản phục vụ |
| Bản vá lỗi thật «Thu gọn khối» | ✅ `sections-collapsed` = `True` trong bản phục vụ |
| Byte của bản phục vụ | ✅ **1.024.969 byte** — khớp ĐÚNG con số trong hồ sơ |
**3) ⚠️ ĐÍNH CHÍNH CÁCH ĐẾM «5/5 dấu» (⛔ không để lại câu chữ sai):** trong **`dist/client/assets`** (6 tệp js) tôi đo được: `CÔNG VIỆC` ✓ · `Tài khoản` ✓ · `Thông báo` ✓ · `Cấp phát` ✓ **nhưng «Trung tâm phê duyệt» ⛔ KHÔNG có trong BẤT KỲ asset nào** ⇒ câu «bundle chứa **5/5 dấu**» là **SAI cách diễn đạt**. **Sự thật:** bundle chứa **4/5 nhãn literal**; nhãn «Trung tâm phê duyệt» là **menu DỰNG TỪ DỮ LIỆU** (khớp `verify-seed-v3`: «✅ MENU DỰNG ĐƯỢC TỪ DỮ LIỆU») nên ⛔ **không** nằm trong JS. Còn «**5/5 dấu**» là phép kiểm **TRÊN DOM lúc chạy** (`probe-p2-ui-dom.mjs` **ĐẠT 5/5**) — ✅ phép kiểm đó vẫn ĐÚNG, chỉ **câu chữ «trong bundle»** là sai. **ĐÃ SỬA:** `MT2_CHECKPOINT.md` §1 và `MT2_FINAL_AUDIT_DRAFT.md` §A.2.
**4) ⑤.4 — ĐỐI CHIẾU NGUỒN SỰ THẬT (hạ mức):** MT2 §6.11 (:174) chỉ yêu cầu **đổi nhãn + mở modal**; §6.11 (:175) chỉ nói «sau khi đơn hoàn thành và thủ kho đã nhận hàng ⇒ **vẫn cho phép bổ sung ảnh/hồ sơ giao hàng**»; ⛔ **KHÔNG** có yêu cầu nào về việc **14 dòng cũ phải có `bch_confirmed_by`** (mà chúng là **tàn dư SEED** — mã sản phẩm ghi ĐÚNG, seed đã vá cho lần sau) ⇒ **(A) chấp nhận seed/demo** hoặc **(C) ghi nhận** là đủ; ⛔ không cần mã sản phẩm.
### H.31 — 📋 KIỂM **NHÃN UI mà MT2 TRÍCH NGUYÊN VĂN** trên **BẢN ĐANG PHỤC VỤ** (bằng chứng §52 mục UI)
**Phương pháp (⛔ không đoán):** lấy 11 nhãn MT2 trích nguyên văn, đối chiếu ① mã `app/`+`lib/` ② **toàn bộ 14 tệp JS trong `dist`** ③ **HTML THẬT** do `http://127.0.0.1:8787/` trả về ④ asset đang phục vụ `page-C3s9lFmS.js`.
| Nhãn (MT2 trích) | app/lib | bundle phục vụ |
|---|---|---|
| «Chi tiết đơn giao hàng» (§6.11 `:174`) | ✅ | ✅ |
| «Chờ Giám đốc duyệt» (§4 `:52`) | ✅ | ✅ |
| «Cấp phát» (§7.6 `:203`) | ✅ | ✅ |
| «Hoàn trả» (§7.6 `:203`) | ✅ | ✅ |
| «Hồ sơ nhân sự chi tiết» (§6.x `:220`) | ✅ | ✅ |
| «Thông tin cá nhân» (§6.x `:220`) | ✅ | ✅ |
| «Dự án đã và đang tham gia» (§6.x `:220`) | ✅ | ✅ |
| «Tạo công văn» (§10 `:226`) | ✅ | ✅ |
| «Bảng ảnh» (§6.11 `:175`) | ✅ | ⛔ — **nằm trong CHÚ THÍCH** (`lib/ui-shared.tsx:300`) ⇒ bị strip khi build, ⛔ KHÔNG phải khuyết điểm |
| «Hình ảnh/tài liệu liên quan» (§10 `:226`) | ✅ | ⛔ — **nằm trong CHÚ THÍCH** (`app/screens/CorrespondenceScreen.tsx:15`) ⇒ như trên |
| «Trung tâm phê duyệt» (§4.6 `:85`) | ✅ | ⛔ — **CHÚ THÍCH** (`app/page.tsx:559,574` · `lib/menu-helpers.ts:129`) **+ nhãn menu DỰNG TỪ DỮ LIỆU** ⇒ như trên |
**⇒ KẾT LUẬN ĐO ĐƯỢC:** **11/11 nhãn có thật trong mã** · **8/11 xuất hiện dưới dạng literal trong bản đang phục vụ** · **3/11 vắng mặt có NGUYÊN NHÂN ĐÃ KIỂM TỪNG CÁI** (chú thích bị strip khi build / nhãn dựng từ dữ liệu) ⇒ ⛔ **0 nhãn nào bị thiếu do lỗi**.
⚠️ **BÀI HỌC LẦN 2 (ghi lại):** grep thấy chuỗi trong mã **chưa chắc** là chuỗi NGƯỜI DÙNG thấy — phải phân biệt **CHÚ THÍCH** ↔ **CODE** ↔ **DỮ LIỆU** trước khi kết luận (lần trước tôi suýt kết luận sai «thiếu nhãn», lần này đã kiểm ngữ cảnh từng dòng).
### H.32 — 📐 MỔ XẺ CHỈ SỐ CSS VƯỢT TRẦN + 2 ĐÍNH CHÍNH NHỎ (đo, ⛔ không suy luận)
**Số ĐO trên `app/styles/canonical.css` (45.166 byte):** tổng dòng vật lý **968** · **dòng KHÁC RỖNG 905** · **dòng comment 187** · **dòng CSS thật (bỏ comment) 673**.
**⇒ CÁCH CỔNG ĐẾM (suy ra từ số khớp):** `probe-css-budget` báo **967** ⇒ đếm **DÒNG VẬT LÝ** (968 − 1 dòng cuối) ⇒ **967 > trần 930 = vượt 37** · ⛔ **KHÔNG** phải đếm dòng CSS thật (673).
**2 ĐÍNH CHÍNH:**
* ① Đường dẫn tệp trần: là **`tools/css-budget.json`** (⛔ **KHÔNG** phải `scripts/css-budget.json` như 3 hồ sơ từng ghi) — **ĐÃ SỬA** ở `TASK-MT2-P14-03c.md` · `MT2_BLOCKER_DECISION_BRIEF.md` · `MT2_CHECKPOINT.md`.
* ② Chính tệp trần ghi **`_doc`: «Trần nợ CSS VNTECH ERP. **Chỉ được GIẢM**. Sinh bởi `tools/probe-css-budget.mjs --init`»** ⚠️ ⇒ **nâng trần** ⛔ **KHÔNG** phải việc tự do: nó **đổi CHÍNH SÁCH nợ CSS của dự án** (đúng lý do đây là quyết định của user). Trong tệp **có tiền lệ điều chỉnh theo phase** (`_phase1Note`: «PHASE 1 thêm MỤC 14 trong canonical.css…» · `_duplicateNote` định nghĩa lại chỉ số) ⇒ việc điều chỉnh **đã từng xảy ra**, nhưng phải do user quyết.
**⛔ TÔI ⛔ KHÔNG «CHƠI LUẬT» (nói rõ để ⛔ không hiểu sai):** trong 967 dòng đó có **187 dòng comment** + ~62 dòng trống ⇒ **xoá/bóp comment là GIẢM ĐƯỢC chỉ số ngay** — ⛔ **nhưng tôi KHÔNG làm** vì đó là **lách cổng** (chỉ số sinh ra để đo NỢ CSS, ⛔ không phải để đo số dòng chú thích). Nếu user muốn coi comment là ngoài phạm vi chỉ số thì phải **sửa ĐỊNH NGHĨA chỉ số** (việc của user), ⛔ không phải bóp chú thích cho qua cổng.
**Phân tích GIẢM DÒNG an toàn (thử bằng script phân tích chỉ-đọc):** tôi quét 87 khối `selector { … }` và ⛔ **KHÔNG tìm được nhóm trùng thân giống nhau** ⇒ **script phân tích của tôi CHƯA ĐỦ MẠNH** (cổng báo **687 selector trùng** trên trần 747 ⇒ parser tuyến tính của tôi bỏ sót selector nhiều dòng / at-rule lồng nhau) ⇒ ⚠️ **kết luận «0 dòng giảm được» là ⛔ KHÔNG ĐÁNG TIN** — tôi ⛔ **không** dùng nó làm căn cứ; muốn giảm thật phải rà đúng 687 selector trùng kia và ⚠️ **cần nghiệm thu MẮT** (tôi ⛔ không đọc được ảnh) ⇒ **thuộc quyết định của user**.
### H.33 — 📊 BẢNG TRẦN CSS **THEO TỆP** (chạy lại cổng) ⇒ **LOẠI PHƯƠNG ÁN (A3) BẰNG SỐ ĐO** cho mục ⑤.5(c)
| Tệp | dòng | !important | quy tắc | **trùng** |
|---|---|---|---|---|
| `app/globals.css` | **2550** | 3654 | 3184 | **677** |
| `app/styles/canonical.css` | **967** | 44 | 218 | **0** |
| `app/styles/font-floor.css` | 264 | 1 | 1 | 0 |
| `app/styles/tokens.css` | 200 | 0 | 1 | 0 |
**Tổng hợp + trần:** dòng **3781/3918** ✅ (dư 137) · `!important` **3699/5014** ✅ (dư 1315) · trùng **687/747** ✅ (dư 60) · `.table-wrap` **41/52** ✅ · `font-size < 10px` **14/14** (⚠️ **hết dư lượng**) · **❌ DUY NHẤT vượt**: `app/styles/canonical.css` **967 > 930 (vượt 37)**.
**⇒ KẾT LUẬN ĐO ĐƯỢC (quan trọng cho quyết định):**
* **687 selector trùng nằm GẦN HẾT ở `globals.css` (677)** — còn `canonical.css` có **0** ⇒ ⛔ **KHÔNG** thể «giảm dòng canonical.css bằng gộp selector trùng»: **hai tệp khác nhau**, mà trần vi phạm là **trần THEO TỆP** của `canonical.css`. ⇒ **PHƯƠNG ÁN (A3) BỊ LOẠI bằng số đo** (trước đó tôi còn để ngỏ vì parser của tôi chưa đủ mạnh — nay đã xác nhận bằng **chính cổng**: `canonical.css` có **0** trùng).
* ⇒ Chỉ còn 3 đường: **(A1)** nâng trần `canonical.css` ≥967 (⚠️ **đổi CHÍNH SÁCH** — tệp trần ghi «Chỉ được GIẢM»; đây là **quyết định của user**) · **(A2)** **tách tệp** ⚠️ **CẢNH BÁO**: trần đang là **trần theo tệp** ⇒ đem 37+ dòng sang **tệp MỚI mà tệp đó KHÔNG được khai vào ngân sách** thì chỉ là **LÁCH CỔNG**; muốn (A2) hợp lệ thì **tệp mới PHẢI được khai trần riêng** trong `tools/css-budget.json` (⛔ tôi ⛔ không tự làm) · **(B)** ghi nhận **known limitation**.
* ⛔ Nhắc lại: **tôi ⛔ KHÔNG bóp 187 dòng comment** của `canonical.css` để đủ chỉ số (đó là lách cổng) — muốn coi comment ngoài phạm vi chỉ số thì phải **sửa ĐỊNH NGHĨA** (việc của user).
### H.34 — 📷 ĐO LẠI ẢNH CHUẨN (`probe-visual-regression`) — SỐ ĐO CỤ THỂ ⇒ củng cố quyết định ⑤.5(a)
**Cấu hình + ngưỡng (nguyên văn của probe):** «**17 màn × 4 kích thước = 68 ảnh**» · «**Ngưỡng cho phép: 8 điểm ảnh lệch**» · `EXIT=1` (KHÔNG ĐẠT).
**Số ĐO (màn đầu — `01-dashboard`):** desktop **lệch 149.129 px (7,1918%)** · laptop **53.710 px (5,1197%)** · tablet **9.453 px (1,2020%)** · phone **4.564 px (1,3866%)**. Màn kế tiếp: desktop **39.306 px (1,8955%)** · laptop **29.707 px (2,8317%)** · tablet **0 px ✅** · phone **0 px ✅**. Một màn khác: **466.812 px (22,5122%)**.
**⚠️ 2 điểm quan trọng rút ra bằng số đo:**
* ① **Sai lệch KHÔNG phải nhiễu nhỏ:** mọi ca đều **vượt ngưỡng 8 px hàng nghìn lần**; tablet/phone của màn thứ 2 **= 0 px** (⇒ probe ⛔ **không** báo lệch bừa) ⇒ đây là **khác biệt THẬT về bố cục/nội dung** giữa **ảnh chuẩn 21/09** và **bản dựng 26/09** (sau khối lượng việc MT2).
* ② **Sai lệch ỔN ĐỊNH (⛔ không phải loé):** probe ghi «**đã chụp lại (lần đầu <đúng bằng số cũ>)**» ⇒ chụp lần 2 **trùng khít** ⇒ ⛔ **không** phải lỗi thời điểm/hoạt ảnh.
⇒ **KẾT LUẬN:** ảnh chuẩn **ĐÃ CŨ SO VỚI VIỆC MT2** ⇒ cổng này ⛔ **mất khả năng phát hiện hồi quy MỚI** (vì 59/68 ca đỏ sẵn). ⚠️ **Nhưng**: ghi lại ảnh chuẩn = **đóng dấu luôn cả sai lệch KHÔNG MONG MUỐN** (nếu có) ⇒ ⛔ **không thể tự quyết bằng máy** — mà **tôi ⛔ KHÔNG đọc được ảnh** (model không có đầu vào ảnh; gọi vision 2 lần đều lỗi) ⇒ **việc duyệt MẮT phải do user**. ⇒ khuyến nghị: **(A)** ghi lại ảnh chuẩn **sau khi user soi 2–3 ảnh chênh nặng** (crops sẵn ở `tools/_diff/crop-1.png`/`crop-2.png`; sinh thêm bằng `--only=<màn> --crop=x,y,w,h`) · **(B)** giữ nguyên + ghi known limitation.