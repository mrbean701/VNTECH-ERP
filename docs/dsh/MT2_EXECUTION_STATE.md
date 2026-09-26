# MT2 — EXECUTION STATE (TODO · TASK_INDEX · MASTER_STATUS)

> MASTER TASK: **MT2** · PROJECT: VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)
> LAST UPDATE: **26/09/2026** *(mở đợt 23/09/2026 — ⚠️ mọi mục bổ sung từ §H.20 trở đi ghi ngày **26/09**)* · ⛔ **NO COMMIT · NO PUSH** (GOAL MT2 §28-29 · MT2 §23)
> Nguồn sự thật chức năng: `docs/dsh/MASTER_TASK_2.md` · Quy trình: `docs/dsh/GOAL_MASTER_TASK_2.md`
> Audit: `docs/dsh/AUDIT_MT2_GAP.md`

---

# A. MASTER STATUS

```text
MASTER TASK 2 STATUS : IN_PROGRESS
TIẾN ĐỘ              : **DONE 74/81 (số đếm được) task chức năng = 93,0 %** — đếm BẰNG MÁY (script phân loại 100 dòng `| MT2-…`) · ✅ **MẪU SỐ = 100** (dải phase tự cộng ra 99 khớp 99 dòng thật ⇒ chốt 99; ➕ task PHÁT SINH `MT2-P14-03b` ⇒ **100**)
                       (100 dòng: **74 DONE** · 0 TODO · **2 SKIPPED** · **5 BLOCKED** (P4-01 · P5-03 · P5-04 · P10-05 · P14-05) = 100 ✔)
CURRENT MODULE       : ✅ **PHASE 1 = 8/8** · ✅ **PHASE 2 = 9/9** · ✅ **PHASE 3 = 9/9** · ✅ **PHASE 4 = 4/4** · ✅ **PHASE 6 = 8/8** · ✅ PHASE 7 = 4/4 (+1 SKIP) · 🎉 **PHASE 8 = 12/12** (⛔ hết SKIP sai — `P8-05` đã ĐÍNH CHÍNH thành DONE) · ✅ PHASE 9 = 9/9 · ✅ PHASE 12 = 7/7 · ✅ PHASE 13 = 6/6 · ✅ **PHASE 14 = 5/6** (P14-01 · P14-02 · P14-03 · P14-03b · P14-04 ✅; còn **P14-05 final audit** BLOCKED) · **PHASE 5 = 2/4 + 2 BLOCKED** · PHASE 10 5/6 (+1 BLOCKED) · PHASE 11 4/5 (+1 SKIP)
CURRENT TASK         : ✅ **MT2-P14-03b DONE** (vá parity luồng license theo hợp đồng JS hiện hành: lớp mới `LicenseEnvelopeVerifier` = port 1-1 `lib/trust/*` (canonical JSON + schema + Ed25519), port/adapter/use case/controller ghi **18 cột thật** + `vntech_trust_audit`, validate `reason` bắt buộc + fingerprint 64-hex; test mới **4/4 XANH** · full Java **61/61 · 0 Failures · 0 Errors** · probe SQL **8 mismatch = 0**) ⇒ ✅ **MT2-P14-03 DONE** (3 cổng DB XANH: SQL gate 0 sai · schema drift 0 lệch · reference integrity 15/15, 0 mồ côi)
COMPLETED TASKS      : 🎉 **PHASE 14 5/6 (P14-01 · P14-02 · P14-03 · P14-03b · P14-04)** · 🎉 **PHASE 6 8/8 (P6-01 … P6-08)** · 🎉 **PHASE 1 8/8 (P1-01 … P1-07 + P1-03b)** · 🎉 **PHASE 2 9/9 (P2-01 … P2-08 + P2-06b)** · **PHASE 5 2/4 (P5-01 · P5-02)** · **PHASE 4 4/4 ✅ (P4-02 · P4-03 · P4-04 · P4-05)** · **PHASE 3 9/9 ✅ (P3-01 · P3-02 · P3-03 · P3-04 · P3-05 · P3-06 · P3-06b · P3-07 · P3-08 · P3-09)** · PHASE 7 4/4 · **PHASE 8 11/11** (+`P8-05` SKIPPED §38) · **PHASE 9 9/9** · **PHASE 10 5/6** (P10-01 · P10-02 · P10-03 · P10-04 · P10-06) · **PHASE 11 4/5** (P11-01 · P11-02 · P11-03 · P11-04) · **PHASE 12 7/7** (P12-01 … P12-07) · **PHASE 13 6/6** (P13-01 … P13-06)  (+ MT2-000 · MT2-001)
IN PROGRESS          : 0
BLOCKED              : **4** — BLK-01 cấp `pho_giam_doc` · BLK-02 user trống `system_level_code` (⇒ chặn MT2-P4-01)
                       + 🔴 **BLK-03**: 3 action tổ đội để `List.of()` trong
                         `ActionRbacRegistry.java:80,111,243` ⇒ `requireActionModule` ném **403 cho MỌI non-admin**,
                         trong khi `OpsTaskManagementUseCase.java:369` lại đòi `requireRole(["commander","admin"])`
                         ⇒ mâu thuẫn 2 tầng quyền + test hợp đồng `tests/tm04-team-crud.test.mjs:64` ĐỎ.
                         ⛔ CẦN USER CHỐT: module nào sở hữu 3 action này — `site_command` (hợp đồng PHASE 6) hay `teams`?
                       + 🔴 **BLK-04 (MỚI — P10-05 §10.4)**: bảng `legal_documents` ⛔ KHÔNG có `correspondence_id`
                         ⇒ màn VB pháp lý và Công văn đến/đi **hoàn toàn độc lập**, chưa «liên kết» theo §10.4.
                         ⛔ CẦN USER CHỐT: **(A)** thêm cột `correspondence_id` (ADD COLUMN an toàn) + `save_legal_document`
                         nhận `correspondenceId` + UI chọn/tra cứu công văn (khuyến nghị — đúng nghĩa liên kết) **hay**
                         **(B)** chỉ gợi ý theo `docType` mà không có khóa (⛔ không thật sự liên kết).
                         ⚠️ (A) là quyết định **schema/nghiệp vụ** ⇒ §13/§14 ⛔ không tự suy diễn.
REMAINING            : **0 dòng TODO** 🎉 + **5 BLOCKED** (P4-01 · P5-03 · P5-04 · P10-05 · P14-05) — ✅ nợ đối soát PHASE 2 đã XOÁ · ✅ mẫu số CHỐT = **100** · 🔓 **P14-03 đã GỠ** (lỗi parity, xử ở P14-03b) · ⛔ **P8-05 KHÔNG còn SKIPPED** (đã ĐÍNH CHÍNH thành DONE theo GOAL §7 — xem `MT2_PHASE_TASK_LIST.md`) · phần còn lại chờ **quyết định của user**
SYSTEM RISKS         : frontend còn ~10.4k dòng logic (trái chỉ đạo "backend là authority") ·
                       còn ~29 modal tự chế trong `app/page.tsx` (MT2 §23)
KNOWN ISSUES         : 🔴 **(23/09/2026) ĐÃ VÁ 1 LỖI THẬT + XÁC MINH LIVE — NÚT «THU GỌN KHỐI» Ở MÀN PHIẾU ĐỀ NGHỊ VỐN VÔ TÁC DỤNG.** Bằng chứng ① mã: `RequestDrawer.tsx` có `const [collapsed,setCollapsed]=useState(false)` + nút `.page-collapse` `onClick={() => setCollapsed(v=>!v)}` nhưng `collapsed` **chỉ được dùng để đổi NHÃN của chính nút**, ⛔ không dùng vào render ② LIVE: bấm nút ⇒ nhãn không đổi · `bodyScroll 1605 → 1605` · `bodyH 682 → 682`. **ĐÃ SỬA**: `.drawer-body` nhận thêm lớp `sections-collapsed` khi `collapsed` + CSS `.sections-collapsed > .drawer-section { display:none; }` (ẩn **khối chi tiết**, GIỮ khối tóm tắt). **XÁC MINH LIVE bằng CLICK CHUỘT THẬT (CDP `Input.dispatchMouseEvent`)**: `✅ CLICKED_AT_303,189` · `✅ nhãn "⌃ Thu gọn khối" → "⌄ Mở rộng khối"` · `✅ bodyScroll 1605 → 375 · bodyH 682 → 375` · `✅ mở rộng lại được` ⇒ `probe-request-page` (đã viết lại theo `.overlay.page-mode` + lớp `edm-*`) **ĐẠT ✅ (EXIT=0)**. ⚠️ **Bài học phương pháp**: `element.click()` ⛔ **không** đủ để đo hành vi React — phải dùng **click chuột thật qua CDP**.
                        ✅ **KHÔNG hồi quy sau khi sửa + build lại**: chạy lại **9 probe LIVE** = **9/9 ĐẠT** (`live-stack` ALL PASS · `p5-dashboard-menu` 4/4 · `p6-07` 4/4 · `p6-08` 3/3 · `ui-action-coverage` 170 action khớp · `work-center` ĐẠT · `team-screen` ĐẠT · `material-tabs` ĐẠT · `layout-audit` ĐẠT).
                        🔑 **IDENTITY/ARTIFACT MỚI**: fingerprint **`VNTECH-FP-7A4835FBC5BCBCA7`** (source **513** tệp) — làm mới bằng `tools/gd-cycle.mjs "MT2 P14-03c VA NUT THU GON KHOI" --no-build` ⇒ `verify:fingerprint` **ĐẠT**; `npm run build` **exit 0** + `BUILT ARTIFACT VALIDATION: ĐẠT`; HTML `:8787` phục vụ **`assets/page-C3s9lFmS.js`** (đúng tệp trong `dist/client/assets` chứa bản vá). ⚠️ Quy trình: `npm run build` kiểm fingerprint TRƯỚC ⇒ sửa mã xong phải chạy `gd-cycle --no-build` **rồi mới** build.
                        🟢 **ẢNH CHỤP CỔNG (đo trong phiên)** — ⛔ KHÔNG cổng nào đỏ vì SẢN PHẨM: frontend **570 test = 569 PASS · 0 FAIL · 1 skip** · `tsc` **0** · `lint` **0 error** · regression **69/69** · workflow **PASSED** · work-item **14/14** · email **ĐẠT** · **Java `mvn -pl web -am test` = 64/64 · 0 Failures · 0 Errors · BUILD SUCCESS** · `verify:master-baseline` **ĐẠT** · `validate:artifact` **ĐẠT** · `verify:fingerprint` **ĐẠT** · `verify:css-baseline` **ĐẠT (dead classes=0)** · DB: schema-drift **0 lệch** · java-sql-schema **0 sai** · reference-integrity **15/15, 0 mồ côi** · **LIVE: 9/9 (đợt này) + 10/10 (đợt trước)**. (bảng đầy đủ: `MT2_GATE_SWEEP_23-09.md` §G): frontend **570 test = 569 PASS · 0 FAIL · 1 skip** · `tsc` **0** · `lint` **0 error** · regression **69/69** · workflow **PASSED** · work-item **14/14** · email **ĐẠT** · **Java `mvn -pl web -am test` = 64/64 · 0 Failures · 0 Errors · BUILD SUCCESS** · `verify:master-baseline` **ĐẠT** · `validate:artifact` **ĐẠT** · `verify:fingerprint` **ĐẠT (VNTECH-FP-362A7B92DF4824AE)** · `verify:css-baseline` **ĐẠT (dead classes=0)** · DB: schema-drift **0 lệch** · java-sql-schema **0 sai** · reference-integrity **15/15, 0 mồ côi** · **LIVE 10/10 probe ĐẠT**.
                        🟡 **3 MỤC CÒN ĐỎ — ĐÃ CHỨNG MINH ⛔ KHÔNG PHẢI LỖI SẢN PHẨM, chờ user chọn cách xử lý**: ① `probe-css-budget` — `canonical.css` **967 > trần 930** (đã đo: gộp AN TOÀN chỉ được **16** dòng ⇒ ⛔ không đủ; muốn đủ phải gộp nhóm đổi cascade hoặc nâng trần riêng — chờ (A1)/(A2)/(B)) ② `probe-visual-regression` — **59/68 ảnh lệch** do **ảnh chuẩn chụp 20/09 TRƯỚC đợt MT2** (bằng chứng: `tools/baseline` sửa lần cuối 20/09 03:03; lệch nặng đúng các màn MT2 sửa: work 22,5% · team 24,8%; 4 cổng live đo hành vi hiện tại ĐẠT) — chờ (A) chốt lại baseline / (B) giữ làm mốc ③ `test:release-static` — dừng ở `drizzle/0080_phase_p4_workflow_multi_identity.sql` còn `datetime()` (track PostgreSQL riêng, ⛔ không ảnh hưởng MySQL/Flyway 29 migration + H2) — chờ (A) sửa SQL / (B) whitelist.
                        ✅ **NỢ CỔNG TEST CŨ ĐÃ ĐÓNG: 22 → 0**; hồ sơ 4 lượt + FIX LOG E.1–E.7: `MT2_LEGACY_CONTRACT_TRIAGE.md`; **bộ probe tĩnh: 27 mục ĐẠT · đã sửa 8 lỗi CÔNG CỤ · 0 lỗi sản phẩm**; log gốc: `docs/agent-progress/MT2-FULL-CONTRACT-RUN-23-09.log.txt`.
                        ⚠️ **KHUYẾN NGHỊ chờ user duyệt**: thêm cổng chạy **toàn bộ** `tests/*.test.mjs` (hiện `test:regression` chỉ chạy 69/570 ca) · loại `.memsearch/` khỏi `MANIFEST_SHA256.txt` (bộ nhớ phiên ghi liên tục ⇒ hash trôi). `node --import tsx --test tests/*.test.mjs` (96 tệp) = **570 · 569 PASS · 0 FAIL · 1 skip**; `npx tsc --noEmit` **0**; `npm run test:regression` **69/69**; `npm run test:workflow` **PASSED**. Hồ sơ 4 lượt + FIX LOG E.1–E.7: `MT2_LEGACY_CONTRACT_TRIAGE.md`; log gốc: `docs/agent-progress/MT2-FULL-CONTRACT-RUN-23-09.log.txt`.
                        🔧 **QUÉT TOÀN BỘ CỔNG (MT2_GATE_SWEEP_23-09.md) — vá thêm 2 cổng ĐỎ + 1 tầng còn lại**: ① `npm run lint` từng **1 error** ở `app/page.tsx:2466` («setState synchronously within an effect» do MT2-P12-01) ⇒ đã sửa (async IIFE, mọi `setState` sau `await`, cờ `live`) ⇒ nay **0 error** ② `verify:css-baseline` đỏ vì **3 lớp CSS chết** (`approved-stock-bars` · `delivered-detail-grid` · `receipt-drawer`, grep xác nhận ⛔ không dùng ở mã sản phẩm) ⇒ đã dọn (−581 byte) ⇒ nay **ĐẠT dead classes=0** + `verify:master-baseline` **ĐẠT** ③ `verify:fingerprint` lệch ⇒ làm lại bằng công cụ CHÍNH THỨC `tools/gd-cycle.mjs … --no-build` ⇒ **ĐẠT · VNTECH-FP-362A7B92DF4824AE** (`lib/vntech-identity-data.mjs` + `VNTECH_FINGERPRINT.json` là SSOT, đã khớp) · `validate:artifact` **ĐẠT** · `probe-schema-drift` **0 lệch**.
                        🟡 **CÒN 1 TẦNG ĐỎ ⛔ KHÔNG DO MT2**: `npm run test:release-static` dừng ở bước «Migration verification» (`scripts/migrate-postgres.mjs --preflight`) — tệp **`drizzle/0080_phase_p4_workflow_multi_identity.sql`** còn cú pháp SQLite `datetime()` sau khi dịch sang PostgreSQL. ⛔ **chưa tự sửa** vì là file migration lịch sử (rủi ro lệch checksum nơi đã chạy, §19/§20) ⇒ chờ user chọn (A) sửa `datetime()`→`CURRENT_TIMESTAMP` hay (B) whitelist trong preflight. ⚠️ Ghi nhận thêm: `MANIFEST_SHA256.txt` đang bao gồm `.memsearch/memory/*.md` (bộ nhớ phiên ghi liên tục ⇒ hash trôi) — đã tái sinh manifest (7579 tệp) cho xanh hiện tại + khuyến nghị user loại `.memsearch/` khỏi manifest.
                        🔧 **6 ca xanh bằng SỬA MÃ**: ① `create_project_team` khai `List.of()` ⇒ **chặn oan commander** (JS `:1699`) ⇒ nay `List.of("site_command")`, ⛔ KHÔNG nới `set/delete_project_team` (JS :1716/:1720 admin-only) ② `delete_department_permission` + 5 action màn Cấp bậc khai đủ registry ③ **JAVA bỏ qua cờ «Tạo kho dự án?»** ⇒ chọn «Không» vẫn sinh kho (§5.2/§16/§19) ⇒ nay đọc cờ (test Java MỚI `ProjectCreateWarehouseFlagTest` **3/3**). 📄 **16 ca xanh bằng CẬP NHẬT HỢP ĐỒNG/TÀI LIỆU kèm lý do MT2**: nhóm menu (t01/t09/w01) · `p07` **9/9** · `ad01` **3/3** · `ad02` **5/5** · `f03` **7/7** · `w02` **10/10** · `p01-p02-p03` **15/15** · `p12-05` **6/6**.
                        ✅ **«KNOWN ISSUE: bảng PR trộn status/stage» ĐÃ HẾT** — chính MT2 §6.9 tách 2 trục (`Purchasing.tsx:199-201`).
                        ⚠️ **KHUYẾN NGHỊ chờ user duyệt**: thêm cổng chạy **toàn bộ** `tests/*.test.mjs` (hiện `test:regression` chỉ chạy 69/570 ca).
                        `issued` lọt vào supply_status · chưa có NotificationService riêng (§15.1) · tab dự án lệch tên vs MT2 §5.2 · ⚠️ bản ghi cũ «3 lỗi RBAC baseline trong `ProductionRoleCounterProofTest`» nay **KHÔNG còn đúng**: full Java **61/61 · 0 Failures · 0 Errors** (đo 23/09)
                        🔧 **6 ca xanh bằng SỬA MÃ**: ① `create_project_team` khai `List.of()` ⇒ **chặn oan commander** (JS `:1699`) ⇒ nay `List.of("site_command")`, ⛔ KHÔNG nới `set/delete_project_team` (JS :1716/:1720 admin-only) ② `delete_department_permission` + 5 action màn Cấp bậc khai đủ registry ③ **JAVA bỏ qua cờ «Tạo kho dự án?»** ⇒ chọn «Không» vẫn sinh kho (§5.2/§16/§19) ⇒ nay đọc cờ (test Java MỚI `ProjectCreateWarehouseFlagTest` **3/3**). 📄 **16 ca xanh bằng CẬP NHẬT HỢP ĐỒNG/TÀI LIỆU kèm lý do MT2**: nhóm menu (t01/t09/w01) · `p07` **9/9** · `ad01` **3/3** (13 bước, MT2-P12-01) · `ad02` **5/5** (12 cột, MT2-P12-03/04) · `f03` **7/7** (căn lại 23 dòng vị trí) · `w02` **10/10** (số đo mới 6·2·5·0, ⛔ không sửa DB) · `p01-p02-p03` **15/15** (MT2 §6.9 tách 2 trục) · `p12-05` **6/6** (probe tạm đã dọn).
                        ✅ **«KNOWN ISSUE: bảng PR trộn status/stage» ĐÃ HẾT** — chính MT2 §6.9 tách 2 trục (`Purchasing.tsx:199-201`), hợp đồng cũ đã được cập nhật theo.
                        ⚠️ **KHUYẾN NGHỊ chờ user duyệt**: thêm cổng chạy **toàn bộ** `tests/*.test.mjs` (hiện `test:regression` chỉ chạy 69/570 ca ⇒ nợ kiểu này rất dễ tái mù).
                        `issued` lọt vào supply_status · chưa có NotificationService riêng (§15.1) · tab dự án lệch tên vs MT2 §5.2 · ⚠️ bản ghi cũ «3 lỗi RBAC baseline trong `ProductionRoleCounterProofTest`» nay **KHÔNG còn đúng**: full Java **61/61 · 0 Failures · 0 Errors** (đo 23/09)
                        PR table trộn status/stage (§6.9) · `issued` lọt vào supply_status ·
                        chưa có NotificationService riêng (§15.1) · tab dự án lệch tên vs MT2 §5.2 · ⚠️ bản ghi cũ «3 lỗi RBAC baseline trong `ProductionRoleCounterProofTest`» nay **KHÔNG còn đúng**: full Java **61/61 · 0 Failures · 0 Errors** (đo 23/09)
NEXT TASK            : 🔔 **HẾT TODO** ⇒ ⛔ KHÔNG còn việc nào tự làm được. Muốn mở tiếp phải chờ user gỡ blocker: P5-03/P5-04 + P4-01 (ngưỡng «phó GĐ trở lên») · P10-05 (`correspondence_id`) · P14-05 (final audit §52/§53 chạy sau khi gỡ). Khi gỡ xong ⇒ PHASE 5 = 4/4 · PHASE 10 = 6/6 · **PHASE 14 = 6/6 + FINAL AUDIT**.
ĐÃ ĐỐI SOÁT §11      : 14 phase phủ hết các mục `MASTER_TASK_2.md`, ⛔ KHÔNG thiếu task; phần «tạm bỏ qua» (§2 · §6.5 · §9 · §12.3) ⛔ không tạo task (ghi ở `AUDIT_MT2_GAP.md`)
BLOCKED chờ USER     : P5-03/P5-04 + P4-01 (ngưỡng «phó GĐ trở lên» = `pho_giam_doc` rank 35 **hay** `level_rank >= 40`) · P10-05 (thêm `correspondence_id` **hay** chỉ gợi ý theo `docType`) · P14-05 (final audit chạy sau khi gỡ) — ⚠️ **P14-03 nay KHÔNG còn cần user** (đã tìm ra là lỗi parity, xem P14-03b)
LIVE                 : Java :18081 = **health UP (DB MySQL UP)** (PID **10684**) · UI :8787 = 200 (PID **18852** — đã khởi động lại ĐÚNG PID sau khi build lại bundle) · proxy :9000 = 200 (PID **18512**)
                       *(dòng cũ ghi PID 22068/26340/20680 là phiên chạy TRƯỚC — nay thay bằng PID hiện hành)*
BUNDLE               : **VNTECH-FP-7A4835FBC5BCBCA7** (nguồn **513** tệp · rebuild sau `MT2-P14-03c`) — `verify:fingerprint` ĐẠT · `npm run build` exit 0 · **BUILT ARTIFACT VALIDATION ĐẠT** · `dist` đã CẬP NHẬT (HTML `:8787` phục vụ **`assets/page-C3s9lFmS.js`** — tệp chứa bản vá nút «Thu gọn khối») ⇒ nghiệm thu mắt được ngay
                       *(mã cũ **`VNTECH-FP-6D21E3F925E64E7E`** (510 tệp) là bản TRƯỚC — đã bị thay bởi 2 lần làm mới identity trong `MT2-P14-03c`)*
CỔNG                 : tsc 0 · test:regression 69/69 · test:workflow ĐẠT · `tm0*` **29/30** (1 ĐỎ **CÓ SẴN** — BLK-03) ·
                       probe LIVE: `probe-p5-dashboard-menu` **4/4 ĐẠT** · `probe-p6-07-attachment-layout` **4/4 ĐẠT** · `probe-p6-08-menu-single-item` **3/3 ĐẠT** ·
                       Java: các bộ test trọng yếu chạy trong phiên này đều **EXIT 0** *(số 53/3-đỏ là baseline cũ, ⛔ không trích như số mới)*
MASTER TASK 1 (cũ)   : DONE 108/110 (98,2 %)
LAST UPDATE          : 23/09/2026 — 🔎 **ĐÍNH CHÍNH TRẠNG THÁI `P8-05` ⇒ 🎉 PHASE 8 = 12/12 · MT2 74/81 = 91,4 % (số ĐẾM ĐƯỢC — ⚠️ đang đối soát, xem đính chính)**. Dòng `MT2-P8-05` (§6.3 «Modal chi tiết NCC 3 tab») từng bị ghi **SKIPPED** kèm lý do «§6.5 Đối tác» — ⛔ **SAI PHẠM VI**: lý do tạm-bỏ-qua đó thuộc tính năng **Đối tác**, còn deliverable của dòng này là **Nhà cung cấp** (MUST IMPLEMENT) ⇒ theo GOAL §7/§8 phải sửa về **DONE** kèm bằng chứng ĐO ĐƯỢC: `app/screens/SupplierDetailModal.tsx` **(218 dòng)** khai `const TABS = ["Thông tin","PO","Danh sách vật tư"]` · `SupplierManager.tsx:14` import và render `{detail && chain && <SupplierDetailModal supplier={detail} purchaseOrders={chain.purchaseOrders} materialLines={chain.materialLines} onClose={…} openPo={(po)=>open("poDetail",po)} loadGaps={…}/>}` · mỗi dòng NCC có nút **«Chi tiết»** `title="Mở MODAL chi tiết NCC (§6.3)"` gọi `setDetail(row)` · dữ liệu Tab 2/3 lấy từ hàm THUẦN dùng chung `supplierToPurchaseOrderChain()` (`lib/p08-nav-trace.js`/`.ts`) · hợp đồng **19/19 XANH** (`p08-supplier-po-material` + `p2-08-modal-reuse-contract`) · `p3-05` **3/3**. ⇒ **P8-05 = DONE** (⛔ không còn trong nhóm SKIPPED; SKIPPED còn lại đúng 2 dòng: `P7-05`, `P11-05`).
                       ➕ **HAI TÀI LIỆU CHUẨN BỊ ĐÃ TẠO (⛔ không đổi trạng thái mục nào)**: ① `AUDIT_MT2_GAP.md` + `PHỤ LỤC A` — **sổ đăng ký đủ 9 miền tạm bỏ qua** của MT2 §2, đã **đo lại** ⑦⑧⑨ để chắc ⛔ không bỏ sót việc đã làm (grep `so sánh/đối chiếu BOQ`, `soát trùng Alias`, `chất lượng danh mục` ⇒ **0 mã**; `ProjectDetailTabs.tsx:17` ghi «% TIẾN ĐỘ DỰ ÁN CỐ Ý ĐỂ TRỐNG» ⇒ giữ SKIPPED là ĐÚNG) ② `MT2_FINAL_AUDIT_DRAFT.md` — **nháp §52 (8 hạng mục) + khung §53**, còn 3 dòng chờ điền ③ `MT2_BLOCKER_DECISION_BRIEF.md` — **brief quyết định** cho 5 mục BLOCKED (dữ kiện đo + ảnh hưởng A/B từng lớp) để user trả lời 1 chữ.
                       🔎 **ĐỢT RÀ PROBE ĐÃ CHỐT — SỔ KIỂM CUỐI CÙNG** (`docs/dsh/MT2_GATE_SWEEP_23-09.md` §H → §H.23; sổ kiểm §H.18.1): **109 tệp probe · 109/109 đã có kết quả · 28 lỗi CÔNG CỤ/PROBE đã sửa · 1 lỗi SẢN PHẨM THẬT đã vá (nút «Thu gọn khối» — kiểm live bằng chuột thật) · 0 lỗi SẢN PHẨM đang đỏ**. ⛔ Không ca nào kết luận đỏ bằng suy đoán: mỗi ca đều **đọc mã / đo CSDL / đo live**. 5 nhóm nguyên nhân đã chứng minh: ① CŨ‑SHAPE do chuẩn hoá UI §22 (ô/nút nay ở `ListToolbar` dùng chung) ② CŨ‑SHAPE do **thêm tab** (12→13) và **đổi tên** («Nhân sự»→«Tài khoản» · «CÔNG VIỆC CỦA TÔI»→«CÔNG VIỆC») ③ SAI PHƯƠNG PHÁP ĐO (`data.audits` bị `LIMIT 100` ⇒ ⛔ không so số lượng; phải so **ID dòng mới**) ④ TIỀN ĐỀ SAI (`approve_stock_issue` giao **kế toán** `kttdemo` chứ ⛔ không phải kho ⇒ 403 của `tkhodemo` là ĐÚNG; phòng KH **đã có** `dept_legal_correspondence` ⇒ guard cho phép là ĐÚNG, và khi xin chức năng **thật sự chưa cấp** thì backend **CHẶN 400 thật**) ⑤ MÔI TRƯỜNG/FIXTURE (thiếu `issueItemId` · `mysql.exe` ngoại lệ · dữ liệu tồn dư «đã có báo cáo kỳ này» · credential `thukydemo` 401).
```

---

# B. KẾT QUẢ AUDIT CỐT LÕI *(đã kiểm bằng mã + CSDL, không suy đoán)*

## B.1. PHẢI TÁI DÙNG (§15 REUSE_EXISTING_LOGIC)
| Nền tảng | Bằng chứng |
|---|---|
| SLA/quá hạn | `approvals.due_at` ✔ · `task_sla_policies.requires_reason` ✔ · **25 tệp Java** + SLA worker chạy định kỳ |
| Notification | `task_notifications` (hàng đợi gắn `work_item_id`) · `approval_email_recipients` |
| Phân cấp chức vụ | `users.system_level_code`: `nhan_vien` < `truong_nhom` < `truong_phong` < `giam_doc` < `tong_giam_doc` · `system_level_catalog` ✔ |
| Quyền | `role_catalog` · `business_role_engine_catalog` · `business_role_group_catalog` · `business_role_group_scopes` · `user_module_permissions` · `user_project_scopes` · `user_warehouse_scopes` |
| Workflow/duyệt | `workflow_definitions/steps/step_approvers` · `approval_stage_catalog` · `approval_project_assignments` · `approval_stage_decisions` · `supply_workflow_steps` |
| Cấp phát / Hoàn trả | `procurement_allocations` · `central_returns` + `central_return_items` · `material_returns` + `material_return_items` |
| Kho | `stock_issues` + `stock_issue_items` · `goods_receipts` |
| Vật tư gốc | `materials` + 7 bảng phụ |
| NCC / Tổ đội | `suppliers` · `teams` + `team_members` + `team_subcontracts` |

## B.2. PHẢI LÀM MỚI
| # | Hạng mục | Ghi chú |
|---|---|---|
| 1 | `approvals` + cột quá hạn: `overdue_reason` · `expired_flag` · `overdue_duration` (hoặc tính từ `due_at`) | migration **ADD COLUMN** an toàn |
| 2 | Validate backend: chặn duyệt khi `quá hạn + lý do rỗng` | dùng `requires_reason` làm nguồn cấu hình |
| 3 | `users` + **chữ ký** (1 ảnh, thay ảnh cũ) | migration ADD COLUMN + API + UI |
| 4 | **Vật tư NCC** (bảng liên kết + tab + auto-detect hỏi user) | 0 mã Java hiện có |
| 5 | **Notification config** (loại Web/Email · tên · mã · nội dung · recipient linh hoạt · giờ gửi · giờ kết thúc) | BẢNG MỚI — ⛔ không sửa `task_notifications` |
| 6 | **Trạng thái đọc/nhắc lại theo user** (`userID + notificationID`, "không nhắc lại hôm nay", đã đọc / tất cả) | BẢNG MỚI |
| 7 | **NotificationService + Rule + Recipient Resolver + Log** | kiến trúc §15.1 — hiện **không có service riêng** |
| 8 | Tạo phiếu nhập từ STO/phiếu xuất (tự fill kho đi/đến) | audit `goods_receipts` ⇄ `stock_issues` khi làm |
| 9 | **Tách component dùng chung** khỏi `app/page.tsx` (toolbar/modal/table/card/tab/upload) | điều kiện tiên quyết cho §22–24 |
| 10 | Menu: bỏ lồng 1 cấp (Trung tâm phê duyệt) · NCC xuống cuối · Báo cáo/KPI tổng hợp **bỏ chia phòng ban** | menu hiện `dept_plan_*`/`dept_project_*` |

## B.3. LỖI ĐÃ XÁC NHẬN TRONG PHẠM VI MT2
- **PR table trộn `status` ⟷ `approval_stage` ⟷ `supply_status`** (3 cột riêng trong `material_requests`) ⇒ MT2 §6.9 ✔
- **`issued` lọt vào `supply_status` của PR** (1 dòng thực tế) ⇒ MT2 §6.9 ✔
- **2 user có `system_level_code` TRỐNG** ⇒ MT2 §13.3 ✔ (BLK-02)

---

# C. TASK INDEX (MT2)

| ID | Module | Description | Status | Dependency |
|---|---|---|---|---|
| MT2-000 | Toàn hệ thống | Audit & gap analysis (3 đợt) | **DONE** | — |
| MT2-001 | Tài liệu | MASTER_TASK_2 · GOAL · AUDIT_GAP · EXECUTION_STATE | **DONE** | MT2-000 |
| **MT2-101** | DATA | Migration an toàn: overdue tracking (`approvals`) + chữ ký (`users`) + bảng notification config & read-state + bảng vật tư NCC | **NEXT** | MT2-000 |
| MT2-102 | BACKEND | `NotificationService` + Rule + Recipient Resolver + Log (kiến trúc §15.1) | TODO | MT2-101 |
| MT2-103 | BACKEND | API: notification config CRUD · read-state theo user · signature upload · NCC-vật tư | TODO | MT2-101 |
| MT2-104 | BACKEND/RBAC | Phạm vi theo chức vụ (§3.2): trưởng phòng = phòng ban mình · phó GĐ trở lên = toàn công ty (backend enforcement) | TODO | MT2-101 · **BLK-01** |
| MT2-105 | BACKEND/WORKFLOW | SLA duyệt: cho duyệt khi quá hạn nhưng **bắt buộc lý do** + tracking + đếm `total overdue` | TODO | MT2-101 |
| MT2-106 | BACKEND | Fix PR table: tách `status` vs `approval_stage` trong payload/UI + loại `issued` khỏi PR | TODO | MT2-101 |
| MT2-107 | BACKEND | Card “Chờ Giám đốc duyệt” + ẩn card chờ duyệt theo RBAC backend | TODO | MT2-104 |
| MT2-108 | BACKEND | Tạo phiếu nhập từ STO/phiếu xuất + tự fill kho đi/đến | TODO | MT2-101 |
| MT2-109 | FRONTEND | **Tách component dùng chung** khỏi `app/page.tsx` (toolbar/modal/table/card/tab/upload) | TODO | — |
| MT2-201 | UI | Công việc: dashboard khi click menu + menu/con mục | TODO | MT2-109 |
| MT2-202 | UI | Trung tâm phê duyệt: list→đang xử lý→modal · timeline o----o · fix font/overlap đính kèm · menu 1 cấp | TODO | MT2-107 · MT2-109 |
| MT2-203 | UI | Quản lý dự án: toolbar ngang · 5 tab hoạt động + modal · tiến độ (tạo việc + Excel mẫu — KHÔNG logic đánh giá) | TODO | MT2-109 |
| MT2-204 | UI | Mua hàng: NCC cuối menu + đổi tên + CRUD + modal tạo + modal chi tiết 3 tab · auto-detect vật tư NCC · PR toolbar · CARD VẬT TƯ THIẾU + lập PR tự fill · tách tab PR/PO · giao nhận công trường 4 card + modal · ghi nhận SL giao modal + nhiều ảnh · đơn đã giao (search/sort/filter + modal + viewer ảnh + lịch sử + xoá bảng ngoài) | TODO | MT2-103 · MT2-106 · MT2-109 |
| MT2-205 | UI | Kho: card + dashboard tổng hợp↔theo kho · nhập/xuất modal · tạo phiếu nhập từ xuất · Xuất CRUD/search/sort/filter · **Cấp phát–Hoàn trả** (menu mới 2 tab — chỉ UI/data foundation) | TODO | MT2-108 · MT2-109 |
| MT2-206 | UI | Tổ đội (danh sách + filter dự án) · Hành chính-Pháp chế (hồ sơ nhân sự 3 tab bỏ filter dự án · bảo hiểm bỏ filter · công văn đến/đi thêm tạo + nhiều ảnh + nút Sửa · văn bản pháp lý liên kết công văn) | TODO | MT2-109 |
| MT2-207 | UI | Báo cáo & cảnh báo + KPI: hiển thị TỔNG HỢP, bỏ chia menu theo phòng ban | TODO | MT2-109 |
| MT2-208 | UI | Danh mục vật tư gốc: fix ROOT CAUSE tab danh sách + tách 3 tab | TODO | MT2-109 |
| MT2-209 | UI | Quản trị: tab Thông báo (CRUD + modal tạo + recipient) · Tài khoản (bỏ Hạn mức · Last Login/Created At · User ID khớp hồ sơ · chữ ký) | TODO | MT2-103 |
| MT2-210 | UI | Web notification (modal đăng nhập + “không nhắc lại hôm nay” + đọc/tất cả) · Email notification theo event | TODO | MT2-102 · MT2-103 |
| MT2-301 | QA | Test từng task (UI/API/DB/RBAC/workflow/regression) + review diff | TODO | liên tục |

---

# D. BLOCKED — CẦN USER QUYẾT (§13 · §32)

```text
BLK-01 · MT2 §3.2 “phó giám đốc trở lên” nhưng `system_level_catalog` KHÔNG có cấp `pho_giam_doc`
  AUDIT      : users.system_level_code hiện có nhan_vien/truong_nhom/truong_phong/giam_doc/tong_giam_doc (+2 trống)
  OPTIONS    : (A) THÊM cấp `pho_giam_doc` vào danh mục (thay đổi DỮ LIỆU danh mục)
               (B) quy ước “từ `giam_doc` trở lên” coi như phó GĐ trở lên
  REQUIRED   : user chọn (A) hay (B)   → chặn MT2-104
BLK-02 · 2 user có `system_level_code` TRỐNG
  REQUIRED   : gán cấp nào cho 2 user đó (hoặc để trống = coi như nhân viên)  → ảnh hưởng MT2-104
```
*(Ngoài MT2 — không chặn: duyệt phiếu KHÔNG-dự-án không có owner; các phương án a1/a2/a3 đã báo trước đó.)*

---

# E. QUY TẮC ĐANG ÁP DỤNG
```text
⛔ NO COMMIT · NO PUSH (kể cả khi task/module xong, build pass, test pass)
⛔ NO FAKE DATA · NO FAKE COMPLETION · NO INVENTED BUSINESS LOGIC
⛔ NO DESTRUCTIVE DB (DROP/DELETE ALL/TRUNCATE/RESET) — migration chỉ ADD COLUMN, an toàn, có checkpoint
✔ BACKEND LÀ ENFORCEMENT LAYER (RBAC · phạm vi · workflow · notification recipient)
✔ TODO tool ở MỌI task/step START + COMPLETE · Telegram START/COMPLETE/BLOCKER/CHECKPOINT
✔ AUDIT TRƯỚC CODE · REUSE trước khi tạo mới · REVIEW DIFF sau mỗi task
✔ MT2 §42 PRIORITY: BLOCKER → DATA/DB → BACKEND/API → RBAC → WORKFLOW → business logic → UI → polish → docs
```
