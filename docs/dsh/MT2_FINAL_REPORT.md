# MT2 — BÁO CÁO TỔNG HỢP (KHUNG §53) · ⛔ CHƯA ĐƯỢC PHÉP CHỐT

> **MASTER TASK 2** — VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1 · FINAL 20260908)
> Ngày lập: **26/09/2026** · Người lập: phiên DSH · ⛔ **NO COMMIT · NO PUSH** (GOAL MT2 §28/§29)
> **VÌ SAO CHƯA CHỐT:** còn **5 nhóm quyết định của user** (§5 dưới đây). GOAL §53: ⛔ **không tuyên bố COMPLETE khi chưa đủ bằng chứng**.
> Bằng chứng chi tiết: `MT2_GATE_SWEEP_23-09.md` (§H.1 → §H.34) · `MT2_FINAL_AUDIT_DRAFT.md` (§A.1 cổng · §A.2 live · §A.3 kiểm trên bản phục vụ · §B) · `MT2_BLOCKER_DECISION_BRIEF.md` · `MT2_CHECKPOINT.md` · `MT2_PHASE_TASK_LIST.md`.

---

## 1. STATUS
```text
MASTER TASK 2 : ✅ **ĐÃ CHỐT** — `P14-05` DONE (final audit §52 9 nhóm + báo cáo §53 = tệp này)
Tiến độ       : 79/81 = 97,5 % (ĐẾM BẰNG MÁY trên `MT2_PHASE_TASK_LIST.md`)
                79 DONE · 0 TODO · 0 IN_PROGRESS · 2 SKIPPED · **0 BLOCKED** = 81 dòng
BLOCKED còn lại: **KHÔNG CÒN** — 5 BLOCKED cũ (P4-01 · P5-03 · P5-04 · P10-05 · P14-05) đều đã gỡ.
Lỗi sản phẩm  : 3 lỗi THẬT đã vá trong kỳ:
                (1) nút «Thu gọn khối» màn Phiếu đề nghị vô tác dụng — kiểm LIVE bằng chuột thật (bodyScroll 1605 → 375)
                (2) `NullPointerException` khi `users.department` = null trong `WorkScopeService.scopeOf` (⇒ 500 thay vì trả phạm vi an toàn) — do TEST bắt được
                (3) cờ `canViewDepartmentWork` trả SAI `false` cho tầng `COMPANY` (phó GĐ xem được mọi phòng) — do TEST bắt được, đã vá + verify LIVE = true
                ⛔ 0 lỗi sản phẩm đang đỏ.
```

## 1b. §52 FINAL AUDIT — 9 NHÓM, ĐO LẠI 26/09/2026 (⛔ evidence-based, không suy luận)
| Nhóm §52 | Kết luận | Bằng chứng ĐO ĐƯỢC |
|---|---|---|
| **Functional** | ✅ | `MT2_PHASE_TASK_LIST.md` 81 dòng: **78 DONE** · 2 SKIPPED (theo MT2 §2/§38) · 1 BLOCKED (= chốt báo cáo). Mọi mục MUST-IMPLEMENT đều DONE. |
| **UI** | ✅ | 2 thay đổi theo yêu cầu user 26/09: modal phiếu (người duyệt·PB·thời gian + dải trạng thái + nút ngang hàng + **ô bình luận TRÊN nút**) và **Trung tâm phê duyệt cột «Phiếu đang xử lý» ⇒ dải duyệt NGANG `o---o`** (§4.3) — đo bằng **DOM thật**: `flexDirection=row`, `sameRow=true`, `r1Top=r2Top=830`, 6 mốc, đường nối dọc cũ đã tắt (`connectorAfter=true`). Ảnh chuẩn visual **ghi lại 68 ảnh** (trước đó lệch 59/68). |
| **Backend** | ✅ | `WorkScopeService` (3 tầng, ngưỡng 30/35 ĐO từ CSDL) + API `work_scope` + `canAssignToDepartment`; `V31` cho liên kết công văn; **Java 134 test / 0 lỗi**; RBAC vẫn là lớp chặn (§17 — ⛔ không chỉ ẩn nút). |
| **Database** | ✅ | Flyway áp thật **V30 + V31** (`flyway_schema_history.success=1`): `system_level_catalog` **5 → 6 cấp**; `legal_documents.correspondence_id` + index đã có. Migrations cổng kiểm `0000..0224`. |
| **Workflow** | ✅ | ⛔ KHÔNG sửa luồng duyệt: chỉ ĐỔI CÁCH HIỂN THỊ (bố cục dọc → ngang) + hiện thêm thông tin đã có trong payload. Cấu hình duyệt (`approval_stage_catalog` + `approval_project_assignments`) **nguyên trạng**. |
| **Notification** | ✅ | ⛔ không đụng trong kỳ này; cổng `probe-p2-ui-dom` (5/5) + release gate vẫn ĐẠT. |
| **Testing** | ✅ | contract **579 = 578 PASS · 0 FAIL · 1 skip** · regression **69/69** · Java **134 test 0 lỗi** · probe mới `blk05` **5/5**, `p10-05` **4/4**, `WorkScopeServiceTest` **10/10** · cổng đo DOM mới **ĐẠT**. |
| **Documentation** | ✅ | Đã cập nhật: `MASTER_STATUS.md` · `MT2_PHASE_TASK_LIST.md` (4 dòng BLOCKED → DONE) · `MT2-P12-07-IDENTITY-INTEGRITY.md` (§6 bảng quyết định + §6.1 BLK-03) · `TM-06-AUDIT-TEAM-MEMBERS.md` (khối đính chính số đo) · `tools/css-budget.json` (2 ghi chú kiểm toán) · báo cáo này (§1/§1b/§5/§12). |
| **Regression** | ✅ | `test:release-static` **3 tầng ĐẠT** (① SHA256 manifest **7611 files** + migrations 0000..0224 · ② PostgreSQL preflight 225 files/857 statements + SQL bind arity 585 · ③ Template+OpenXML+Brand) · `verify:master-baseline` **ĐẠT** · `verify:css-baseline` **ĐẠT** (3654 `!important`) · `probe-css-budget` **ĐẠT** (3893/3918) · `verify:fingerprint` **ĐẠT** · LIVE 3/3 cổng HTTP 200. |


## 2. IMPLEMENTED (đúng nguồn sự thật `docs/dsh/MASTER_TASK_2.md`)
* **14 PHASE** theo `MT2_PHASE_TASK_LIST.md`: PHASE 1 **8/8** · 2 **9/9** · 3 **9/9** · 4 **4/4** · 6 **8/8** · 7 **4/4** · 8 **12/12** · 9 **9/9** · 12 **7/7** · 13 **6/6** · 14 **5/6** · 5 **2/4** · 10 **5/6** · 11 **4/5**.
* **Bản vá lỗi sản phẩm thật:** `app/screens/RequestDrawer.tsx` (+ `app/globals.css` `.sections-collapsed`) — nút «Thu gọn khối» nay hoạt động; ⛔ **đã xác nhận có trong bundle ĐANG PHỤC VỤ** (chuỗi `sections-collapsed` = True).
* **Đối chiếu NGUỒN SỰ THẬT (4 mục đã đóng/hạ mức):** ⑤.7 Tổ đội chỉ-đọc **ĐÓNG** (đúng MT2 §8) · ⑤.3 bước 101–103 **ĐÓNG** (hàng mirror ngoài MT2 §7; đã **vá tiền đề 2 probe**, `probe-task043` **27/27 ĐẠT**) · ⑤.1 3 khe hở ghi cột **hạ mức** (MT2 ⛔ không nhắc `stage_kind`/`avatar`/`approved_at`) · ⑤.6 nhật ký `before_json` **hạ mức** (MT2 ⛔ không yêu cầu) · ⑤.4 14 dòng phiếu nhập **hạ mức** (MT2 §6.11 ⛔ không yêu cầu người xác nhận).
* **Yêu cầu UI trích nguyên văn của MT2 — đã kiểm:** §6.11 «đổi nhãn *Xác nhận giao hàng thực tế* → *Chi tiết đơn giao hàng* + mở modal» **đã thi hành** (nhãn cũ ⛔ hết ở mã VÀ ở bundle phục vụ; modal `ReceiptDrawer.tsx`). **11/11 nhãn UI** MT2 trích đều có trong mã; **8/11** là literal trong bundle, 3 nhãn vắng mặt **đã kiểm nguyên nhân từng cái** (chú thích bị strip khi build / nhãn menu dựng từ dữ liệu).

## 3. TESTED (số đo lại trong kỳ, ⛔ không trích số cũ)
```text
frontend contracts : node --import tsx --test tests/*.test.mjs ⇒ tests 570 · PASS 569 · FAIL 0 · SKIP 1   (exit 0)
regression         : npm run test:regression                   ⇒ tests 69 · pass 69 · fail 0            (exit 0)
typecheck          : npx tsc --noEmit                          ⇒ exit 0
lint               : npm run lint                              ⇒ 0 ERRORS (203 warnings)
Java               : mvn -pl web -am test                      ⇒ 64/64 · 0 Failures · 0 Errors · BUILD SUCCESS
probe              : 109 tệp tools/probe-*.mjs · 109/109 ĐÃ CÓ kết quả ghi lại · 28 lỗi CÔNG CỤ/PROBE đã sửa
                     · 1 lỗi SẢN PHẨM thật đã vá · 0 ca BLOCKED/ngoại lệ
kiểm cơ học §50     : 43/43 tiêu đề cấp 2 của MASTER_TASK_2.md đều được tham chiếu bằng chứng
```

## 4. VALIDATED (cổng + hệ thống đang chạy)
```text
10/10 cổng ĐẠT     : frontend contracts · regression · tsc · lint · css-baseline · master-baseline ·
                     fingerprint · validate:artifact · Java test · probe sweep
css-baseline       : ĐẠT · 2551 dòng · 364041 byte · 3654 !important · dead classes 0 · dead vars 0
master-baseline    : ĐẠT · /api/files SSOT · dual storage DELETE · schema 0047 · identity 0049 · CSS R1.1.1
fingerprint        : ĐẠT · VNTECH-FP-7A4835FBC5BCBCA7 · source 513 files
validate:artifact  : FULL W2 SOURCE PREFLIGHT ĐẠT · 5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908
live               : java :18081 · proxy :9000 · UI :8787 · asset ĐANG PHỤC VỤ = page-C3s9lFmS.js (1.024.969 byte)
                     · API không token ⇒ 401 (default-deny)
⚠️ CHƯA ĐẠT 1 cổng   : probe-css-budget = «KHÔNG ĐẠT — 1 chỉ số vượt trần: app/styles/canonical.css 967 > 930 (vượt 37)»
                      ⇒ xem §5 ⑤.5(c) + §6 KNOWN LIMITATIONS
```

## 5. ⛔ CHỜ USER QUYẾT (5 nhóm — trả lời 1 tin là thi hành + chốt `P14-05`)
| # | Vấn đề | Lựa chọn | Ghi chú đo được |
|---|---|---|---|
| **①** | Ngưỡng «phó giám đốc trở lên» (`P4-01`/`P5-03`/`P5-04`) | **A** thêm cấp `pho_giam_doc` (rank 35) · **B** dùng `level_rank >= 40` | MT2 §3.2 (`:41-42`) **tự đặt tên cấp «Phó giám đốc»** ⇒ (A) sát nguyên văn; `BLK-02` (user trống cấp bậc) **chỉ ở TÀI KHOẢN KIỂM THỬ** |
| **②** | `P10-05` liên kết Văn bản pháp lý ↔ Công văn | **A** thêm cột `correspondence_id` + UI · **B** gợi ý theo `docType` | — |
| **⑤.2** | Việc cá nhân `CN` không thấy trong bootstrap | **A** đúng thiết kế · **B** sửa (JS **và** Java) · **C** ghi nhận | **6 dòng `work_items` `CN` TOÀN LÀ fixture** `sec_probe_*` (⛔ 0 dòng nghiệp vụ thật); MT2 §3.2 chỉ quy định phạm vi XEM/GIAO theo cấp bậc ⇒ **nghiêng (C)** |
| **⑤.4** | 14 dòng `goods_receipts` thiếu người xác nhận | **A** chấp nhận seed/demo · **C** ghi nhận | **Do SEED** (mã sản phẩm ghi ĐÚNG, seed **đã vá** cho lần sau); MT2 §6.11 ⛔ không yêu cầu ⇒ **nghiêng (A)** |
| **⑤.5** | (a) Ảnh chuẩn lệch **59/68** · (b) **2 lỗi công cụ #31/#32** (bản vá sẵn) · (c) `canonical.css` **967 > 930** | (a) **A** ghi lại sau khi user soi crops / **B** giữ · (b) **A** áp lại + làm mới danh tính + build / **B** giữ nguyên / **C** áp lại không làm mới · (c) **A1** nâng trần (đổi chính sách) / **B** ghi nhận | (a) sai lệch **7,19%–22,51%**, ỔN ĐỊNH, vượt ngưỡng 8 px hàng nghìn lần; ⚠️ **tôi ⛔ không đọc được ảnh** ⇒ cần user nghiệm thu mắt. (b) đặc tả + quy trình 4 bước ở `MT2-PATCH-31-32.md`; ⚠️ áp lại thì **mã FP sẽ đổi**. (c) tệp trần `tools/css-budget.json` ghi **«Chỉ được GIẢM»**; **687 selector trùng nằm 677 ở `globals.css`**, `canonical.css` = **0** ⇒ **⛔ (A3) bị loại**; ⛔ tôi **không** bóp 187 dòng comment để lách cổng |

## 5. ✅ USER ĐÃ CHỐT (26/09/2026) — ĐÃ THI HÀNH (⛔ không còn nhóm nào «chờ user»)
| Nhóm | Quyết định NGUYÊN VĂN của user | ĐÃ THI HÀNH | Bằng chứng |
|---|---|---|---|
| **①** | **A** (thêm cấp `pho_giam_doc`) | ✅ `V30` rank **35** (Flyway `success=1`, 5→6 cấp) + `WorkScopeService` 3 tầng + API `work_scope` + test **10 ca** | smoke live: `scope=COMPANY · levelRank=50`; Java 134 test 0 lỗi |
| **②** | **A** (thêm cột `correspondence_id`) | ✅ `V31` + 4 tầng (DB·H2×2·backend·parity JS+UI) + test `P10-05` **4/4** | Flyway `success=1`; smoke lưu VB kèm công văn ⇒ cột ghi đúng; đã dọn dữ liệu tạm |
| **⑤.5a** | **A** (ghi lại ảnh chuẩn sau build) | ✅ đã ghi lại **68 ảnh** | `probe-visual-regression --update` EXIT=0 (trước đó lệch 59/68) — ⛔ **ghi rõ**: việc soi bằng mắt người là **theo lựa chọn của user** (đã miễn), ⛔ không tự coi là đã kiểm bằng mắt |
| **⑤.5b** | **A** (áp lại #31/#32 + làm mới danh tính + build) | ✅ đã áp + `gd-cycle` + build + manifest | `test:release-static` **3 tầng ĐẠT**; manifest **7611 files**; `BUILT ARTIFACT VALIDATION: ĐẠT` |
| **⑤.5c** | **A1** (nâng trần `canonical.css`) | ✅ nâng **930 → 1013 → 1076** (2 lần, đều có ghi chú kiểm toán trong `tools/css-budget.json`) | `probe-css-budget` **ĐẠT** (3893/3918) |
| **BLK-06** | «thiếu mã thì insert vào, đây chỉ là dữ liệu test» | ✅ insert `SEC-866610` ⇒ **0/19** thiếu mã. Hồ sơ nhân sự: **BÁO CÁO**, ⛔ không tạo hồ sơ giả (§14/§18) | đo MySQL |
| **BLK-05** | «**Cho phép** user thường nhìn thấy mã vật tư gốc đã ngừng» | ✅ bỏ lọc `m.active=1` ở payload `materials` (**Java + JS parity**), giữ cột `active`; ⛔ không đụng danh sách tồn kho | **chứng minh bằng USER THƯỜNG** `nvdademo` thấy mã `active=0`; test `blk05` **5/5** |
| **BLK-03** | «**Đóng**» | ✅ đóng trong hồ sơ + **đo lại thực tế** (⛔ không tự đổi quyền) | xem `MT2-P12-07-IDENTITY-INTEGRITY.md` §6.1 |
| — | **Yêu cầu UI mới (2 lần)**: (i) modal phiếu hiện người duyệt·PB·thời gian + trạng thái + nút ngang hàng + bình luận TRÊN nút; (ii) **Trung tâm phê duyệt cột «Phiếu đang xử lý» ⇒ dải duyệt NGANG `o---o`** | ✅ cả hai | **DOM thật**: `flexDirection=row`, `sameRow=true`, `r1Top=r2Top=830`, 6 mốc · `tsc` 0 · contract 579 |

## 6. KNOWN LIMITATIONS (khai báo trung thực — cập nhật 26/09/2026)
1. **`audit_logs`: ~1.486/1.579 dòng thiếu `before_json`** — lệch **CHẤT LƯỢNG nhật ký**; MT2 ⛔ không yêu cầu ⇒ ghi nhận, ⛔ không tự mở rộng.
2. **3 khe hở ghi cột JS⇄Java** (`approval_stage_catalog.stage_kind` · `users.avatar_url` · `boq_versions.approved_at`) — MT2 ⛔ không yêu cầu; ⛔ không tự thêm.
3. **Chưa có worker SMTP `@Scheduled`** (chỉ có `retry_email`) — hiện trạng đã biết, ⛔ không tự thêm.
4. ~~`canonical.css` vượt trần~~ → ✅ **ĐÃ GỠ** (user duyệt A1; nay 1076 dòng, cổng ĐẠT).
5. ~~Ảnh chuẩn visual lệch 59/68~~ → ✅ **ĐÃ GHI LẠI 68 ảnh** (user chọn A). ⚠️ **VẪN CÒN**: ⛔ **không có bước soi bằng MẮT NGƯỜI** — user đã **miễn**; đây là **lựa chọn của user**, ⛔ không được diễn giải thành «đã kiểm bằng mắt».
6. ~~Cổng release cần bản vá #31/#32~~ → ✅ **ĐÃ ÁP + ĐẠT cả 3 tầng** (FP mới `VNTECH-FP-38A7A45C22EA6DC3`).
7. 🆕 **BLK-03 còn tồn (user đã chốt «Đóng»)**: `delete_project_team` và `set_project_team_status` vẫn `List.of()` trong `ActionRbacRegistry` ⇒ **mọi tài khoản không phải admin bị 403** «Thao tác chưa được khai báo quyền», trong khi UI đã khai báo `module: site_command` cho cả 3 action (`TeamDirectory.tsx:72-76`) ⇒ nếu tài khoản có `site_command.canUse=1` thì **thấy nút nhưng bị 403** (lệch nguyên tắc §17). ⛔ **KHÔNG tự sửa** vì chọn module gác action là **quyết định quyền hạn** (§13/§21) và user đã chốt «Đóng». Cách sửa 1 dòng nếu user muốn: đổi 2 dòng đó thành `List.of("site_command")` cho khớp ý định đã khai báo ở UI + action anh em `create_project_team` (đã vá).
8. 🆕 **Xung đột đặc tả cần user chốt**: `MASTER_TASK_2.md` §4.3 dòng 73 ghi «⛔ **không** hiển thị thông tin người duyệt ở **step chưa tới**», nhưng yêu cầu 26/09 của user là hiện **đủ** thông tin ⇒ hiện đang **khác nhau có chủ ý** (Trung tâm phê duyệt theo §4.3: bước chưa tới chỉ «Đang chờ»; **modal phiếu hiện đủ** theo yêu cầu mới). Cần chốt có áp §4.3 cho cả modal hay không.
9. 🆕 **Hồ sơ nhân sự**: chỉ **4/19** tài khoản có `hr_records` (6/15 tài khoản thiếu là fixture `sec_probe_*`). ⛔ **Không tạo hồ sơ giả** (§14/§18) ⇒ **ghi nhận**, không phải lỗi sản phẩm.

## 7. SKIPPED BY REQUIREMENT (⛔ không phải việc bỏ dở)
* **`MT2-P7-05`** — MT2 **§5.3 (`:107`)**: «Chưa có nghiệp vụ đánh giá ⇒ **chỉ triển khai phần HIỂN THỊ và NHẬP DỮ LIỆU**» + GOAL §14 ⇒ ⛔ không tự dựng logic đánh giá.
* **`MT2-P11-05`** — MT2 **§12.3 (`:247`)**: «⏸️ **Tạm bỏ qua**: So sánh/Đối chiếu BOQ · Soát trùng Alias · Đánh giá chất lượng danh mục» + bằng chứng grep `app/**`+`lib/**` ⇒ **0 mã liên quan**.
* Sổ đăng ký phạm vi bỏ qua: **PHỤ LỤC A (9 miền, MT2 §2 + §38)** trong `MT2_PHASE_TASK_LIST.md`.

## 8. DOCUMENTATION
`MT2_PHASE_TASK_LIST.md` (81 dòng task + §0) · `MT2_EXECUTION_STATE.md` · `MASTER_STATUS.md` · `TASK_INDEX.md` · `MT2_GATE_SWEEP_23-09.md` (§H.1 → §H.34 + sổ kiểm §H.18.1) · `MT2_BLOCKER_DECISION_BRIEF.md` (§①–§⑤.7) · `MT2_CHECKPOINT.md` · `MT2_FINAL_AUDIT_DRAFT.md` · `MT2-P14-06-SPEC.md` · **`MT2-PATCH-31-32.md`** · **`MT2-P12-07-IDENTITY-INTEGRITY.md`** (§6 bảng quyết định + §6.1 BLK-03) · `TM-06-AUDIT-TEAM-MEMBERS.md` (khối đính chính số đo) · **`MT2_FINAL_REPORT.md`** (tệp này).

## 9. ĐIỀU KIỆN ĐỂ CHỐT `P14-05` — ✅ **ĐÃ ĐỦ ĐIỀU KIỆN (26/09/2026)**
```text
1) User trả lời 5 nhóm ở §5            ⇒ ✅ ĐÃ TRẢ LỜI (①A · ②A · ⑤.5a A · ⑤.5b A · ⑤.5c A1 · BLK-06 · BLK-05 · BLK-03)
                                          và ĐÃ THI HÀNH đúng chữ đã chọn (mỗi thay đổi đều kèm test + cổng + hồ sơ)
2) Chạy lại toàn bộ cổng ⇒ ghi số MỚI  ⇒ ✅ ĐÃ CHẠY: xem §1b (9 nhóm §52) — contract 579 · regression 69 ·
                                          Java 134 · tsc 0 · lint 0 error · release-static 3 tầng ĐẠT · FP mới
3) Đối chiếu §52 (9 hạng mục) + điền §53 ⇒ ✅ ĐÃ ĐỐI CHIẾU (§1b) + §53 điền ở §12
⛔ CÒN LẠI (⛔ không tự quyết — chờ user): 2 mục ở §6.7 (BLK-03 residual) và §6.8 (xung đột §4.3).
   Hai mục này ĐÃ ĐƯỢC KHAI BÁO TRUNG THỰC, ⛔ không chặn việc chốt báo cáo vì user đã quyết «Đóng» / chưa yêu cầu.
```

## 10. FINAL FLAGS
```text
NO COMMIT = TRUE   (GOAL MT2 §28 — ⚠️ AGENTS.md của workspace yêu cầu «commit ngay», nhưng chỉ đạo trực tiếp
                    của user trong GOAL MT2 được ưu tiên; ⛔ chưa commit gì)
NO PUSH   = TRUE   (§29)
⛔ Không tạo release, ⛔ không tag.
```

---

## 11. ⚠️ ĐÍNH CHÍNH QUAN TRỌNG (đo lại bằng máy, 26/09/2026) — CON SỐ «93/100» **KHÔNG TÁI LẬP ĐƯỢC**
**ĐO LẠI ĐỘC LẬP bảng task `docs/dsh/MT2_PHASE_TASK_LIST.md`** (đếm bằng script theo mã `| MT2-P<phase>-<số>|`):
``text
SỐ DÒNG TASK TRONG BẢNG = 81   (⛔ KHÔNG phải 100)
DONE 72 · SKIPPED 2 · BLOCKED/khác 7   ⇒ 72 + 2 + 7 = 81 ✔
Theo phase: P1 1/1 · P2 3/3 · P3 5/5 · P4 4/5 · P5 2/4 · P6 7/8 · P7 4/5(+1 SKIP) · P8 12/12 · P9 9/9 ·
            P10 5/6 · P11 3/5(+1 SKIP) · P12 7/7 · P13 6/6 · P14 4/5
``
**⚠️ VÀ 2 HỒ SƠ ĐIỀU KHIỂN ĐANG MÂU THUẪN NHAU VỀ MẪU SỐ:**
* `AUDIT_MT2_GAP.md:153` — «✅ **CHỐT MẪU SỐ TIẾN ĐỘ = 99** (trước đây ghi 98 — MÂU THUẪN NỘI BỘ)».
* `MT2_EXECUTION_STATE.md:14-15` — «MẪU SỐ = **100** … 100 dòng: 74 DONE · 0 TODO · 2 SKIPPED · 5 BLOCKED (trên 81 dòng task đếm được) = 100 ✔».
⇒ **KẾT LUẬN TRUNG THỰC (giữ nguyên phần này làm lịch sử):** con số **«74/81 = 91,4 % (số ĐẾM ĐƯỢC — ⚠️ đang đối soát, xem đính chính)»** mà tôi đã dùng suốt phiên ⛔ **KHÔNG tái lập được** từ bảng task (81 dòng) và **hai hồ sơ tự mâu thuẫn (99 ↔ 100)**. ⛔ Tôi **không tự bịa** con số mới — đã **đếm bằng máy** (xem ngay dưới).
**⇒ open item ĐÃ ĐÓNG (26/09/2026):** đã **đếm bằng máy** trực tiếp trên `MT2_PHASE_TASK_LIST.md` (mã `| MT2-P<phase>-<số>|`) sau khi cập nhật 5 dòng cuối ⇒ **KẾT QUẢ TÁI LẬP ĐƯỢC**:
```text
SỐ DÒNG TASK = 81   ·   DONE 79  ·  SKIPPED 2 (P7-05 · P11-05)  ·  BLOCKED 0   ⇒ 79 + 2 + 0 = 81 ✔
TIẾN ĐỘ = 79/81 = 97,5 %   (⛔ KHÔNG còn dấu «đang đối soát»)
```
⇒ **Mẫu số chốt = 81** (không phải 99/100). Hai hồ sơ `AUDIT_MT2_GAP.md:153` («99») và `MT2_EXECUTION_STATE.md:14-15` («100») là **nguồn mâu thuẫn đã được đính chính**; mọi báo cáo hiện dùng **79/81 = 97,5 %**.
**⛔ ẢNH HƯỞNG TỚI CÁC KẾT LUẬN KHÁC:** ⛔ **không** ảnh hưởng — mọi kết luận khác trong báo cáo này đều dựa trên **số đo trực tiếp** (cổng, probe, DB, bundle đang phục vụ, trần CSS, ảnh chuẩn), ⛔ không dựa vào con số tiến độ 93/100.

---

## 12. §53 — BÁO CÁO HOÀN TẤT (mẫu bắt buộc của GOAL §53)
```text
MASTER TASK 2
STATUS: ✅ COMPLETE — ĐÃ THI HÀNH HẾT CÁC MỤC THUỘC PHẠM VI ĐÃ CHỐT

IMPLEMENTED:
  • ①A (§3.2) phạm vi theo cấp bậc — cấp `pho_giam_doc` (V30) + WorkScopeService + API `work_scope` + test 10 ca
  • ②A (§10.4) khóa văn bản pháp lý ↔ công văn (V31) + 4 tầng + test P10-05
  • BLK-06 mã nhân viên (0/19 thiếu) · BLK-04 (=②A) · BLK-05 user thường thấy mã vật tư đã ngừng · BLK-03 đóng
  • 2 thay đổi GIAO DIỆN theo yêu cầu user 26/09: modal phiếu (5 yêu cầu) + dải phê duyệt NGANG `o---o` ở
    Trung tâm phê duyệt (đo bằng DOM thật, không chỉ bằng mã nguồn)
  • ⑤.5b/⑤.5c/⑤.5a — bản vá #31/#32 + danh tính mới + build + nâng trần CSS (A1) + ghi lại 68 ảnh chuẩn

TESTED (đều exit 0, đo lại 26/09/2026):
  contract 579 = 578 PASS · 0 FAIL · 1 SKIP   |   regression 69/69   |   tsc 0   |   lint 0 error
  Java 134 test · 0 lỗi (domain 19 · application 38 · infrastructure 13 · web 64)
  test mới: WorkScopeServiceTest 10/10 · P10-05 4/4 · BLK-05 5/5 · probe đo dải ngang ĐẠT (DOM thật)

VALIDATED (các cổng, tất cả ĐẠT):
  test:release-static 3 tầng (SHA256 manifest 7611 files · migrations 0000..0224 · PostgreSQL preflight
  225 files/857 statements · SQL bind arity 585 · Template+OpenXML) · verify:master-baseline ĐẠT ·
  verify:css-baseline ĐẠT (3654 !important) · probe-css-budget ĐẠT (3893/3918) ·
  verify:fingerprint ĐẠT VNTECH-FP-38A7A45C22EA6DC3 (519 tệp) · build + BUILT ARTIFACT VALIDATION ĐẠT ·
  LIVE 3/3 cổng HTTP 200 (18081 API · 8787 UI · 9000 proxy) · Flyway V30+V31 `success=1` trên MySQL thật

DOCUMENTATION (đã cập nhật): MASTER_STATUS.md · MT2_PHASE_TASK_LIST.md (5 dòng cuối → DONE) ·
  MT2_FINAL_REPORT.md (tệp này: §1 · §1b · §5 · §6 · §9 · §11 · §12) · MT2-P12-07-IDENTITY-INTEGRITY.md
  (§6 + §6.1) · TM-06-AUDIT-TEAM-MEMBERS.md (khối đính chính số đo) · tools/css-budget.json (2 ghi chú)

KNOWN LIMITATIONS (khai báo trung thực — xem §6.1→§6.9):
  1) audit_logs thiếu `before_json`  2) 3 khe hở ghi cột JS⇄Java  3) chưa có worker SMTP @Scheduled
  4) ảnh chuẩn đã ghi lại nhưng ⛔ KHÔNG có bước soi MẮT NGƯỜI (user đã miễn — lựa chọn của user)
  5) BLK-03 residual: 2 action tổ đội registry rỗng ⇒ CHT 403 (user đã chốt «Đóng», ⛔ không tự đổi quyền)
  6) xung đột đặc tả §4.3 «bước chưa tới chỉ hiện Đang chờ» vs yêu cầu mới «hiện đủ thông tin» (cần user chốt)
  7) hồ sơ nhân sự 4/19 (⛔ không tạo hồ sơ giả)

SKIPPED BY REQUIREMENT (⛔ không phải việc bỏ dở): P7-05 (MT2 §5.3 — chưa có nghiệp vụ đánh giá) ·
  P11-05 (MT2 §12.3 — tạm bỏ qua) · Phụ lục A (9 miền, MT2 §2 + §38)

NO COMMIT  ⛔  (GOAL MT2 §28 — dù AGENTS.md của workspace yêu cầu «commit ngay», chỉ đạo trực tiếp của
               user trong GOAL MT2 được ưu tiên; ⛔ chưa commit gì)
NO PUSH    ⛔  (§29)
```
### 12.1 Còn 2 việc CHỜ ANH CHỐT (⛔ không chặn việc chốt MT2, đã ghi ở §6.7 & §6.8)
1. **BLK-03** — 2 action tổ đội còn registry rỗng ⇒ CHT 403 trong khi UI đã khai báo `site_command`; sửa **1 dòng** là khớp, nhưng chọn module gác quyền là **quyết định của anh** (§13/§21).
2. **Xung đột §4.3** — giữ nguyên hiện tại (Trung tâm phê duyệt theo §4.3, modal hiện đủ) hay áp §4.3 cho **cả** modal.