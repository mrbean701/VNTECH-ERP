# MT2 — BẢN NHÁP FINAL AUDIT §52 & BÁO CÁO §53 (CHƯA ĐƯỢC PHÉP CHỐT)

> **Vì sao có tệp này:** `MT2-P14-05` (final audit §52 + báo cáo §53) **vẫn BLOCKED** vì còn **5 mục chờ user quyết**.
> Theo GOAL §53, ⛔ **KHÔNG được tuyên bố MASTER TASK 2 COMPLETE** khi chưa đủ bằng chứng. Tệp này **gom bằng chứng đã ĐO ĐƯỢC** vào đúng 8 hạng mục của §52 để khi user gỡ blocker thì chỉ cần vá 5 dòng còn trống rồi ký chốt — ⛔ **không** thay thế báo cáo cuối.
> Trạng thái tổng: **CHƯA CHỐT** · MT2 **74/81 = 91,4 % (số ĐẾM ĐƯỢC — ⚠️ đang đối soát, xem đính chính)** (74 DONE · 0 TODO · 2 SKIPPED · 5 BLOCKED (trên 81 dòng task đếm được)) · cập nhật **26/09/2026**.

---

## A. §52 — 8 HẠNG MỤC AUDIT

| # | Hạng mục §52 | Trạng thái | BẰNG CHỨNG ĐÃ ĐO |
|---|---|---|---|
| 1 | **Functional** — mọi MUST IMPLEMENT, workflow, RBAC, data flow | 🟡 **74/81 DONE** (số đếm được — ⚠️ đang đối soát mẫu số) | Đối chiếu 14 PHASE ⇄ `MASTER_TASK_2.md` §1/§2 (bảng đầy đủ ở `AUDIT_MT2_GAP.md`): PHASE 1 **8/8** · 2 **9/9** · 3 **9/9** · 4 **4/4** · 6 **8/8** · 7 **4/4** · 8 **12/12** · 9 **9/9** · 12 **7/7** · 13 **6/6** · 14 **5/6** · 5 **2/4** · 10 **5/6** · 11 **4/5**. ⏳ **Còn 5 BLOCKED**: P4-01 · P5-03 · P5-04 · P10-05 · P14-05. |
| 2 | **UI** — layout · modal · table · tabs · toolbar · responsive · attachment | 🟢 ĐẠT (phần đã làm) | ① `probe-p5-dashboard-menu` **4/4** (menu Công việc ⇄ tab Dashboard) ② `probe-p6-07-attachment-layout` **4/4** (2 khổ hẹp ➖ N/A theo responsive: ô chọn tệp **188×44 / 179×44**, chồng **0 px²**, không tràn) ③ `probe-p6-08-menu-single-item` **3/3** (menu 1 mục mở TRỰC TIẾP) ④ P14-01: visual self-test **17 màn × 4 kích thước = 68 ảnh**, nhiễu nền **0 px** ⑤ §23 modal: `BaseModal` 33 lần trong `page.tsx` + lightbox §27 (P2-06b **2/2**). |
| 3 | **Backend** — API · validation · authorization · business logic | 🟢 ĐẠT | ① **Full Java: `mvn -pl web -am test` ⇒ `64/64` · 0 Failures · 0 Errors · BUILD SUCCESS** *(⚠️ dòng này từng ghi «61/61» là số ĐO LÚC P14-03b — nay thay bằng số ĐO LẠI: **64/64**)* ② RBAC live action probe **20/20 đúng · 0 lọt quyền · 0 khoá nhầm** ③ role parity **0 điểm** · scope parity **67/67** ④ luồng license vá parity: `LicenseFoundationParityTest` **4/4** (gồm ca âm 400 + ⛔ không ghi hàng) ⑤ `probe-java-sql-schema` **«không thấy tham chiếu bảng/cột sai»** (127 bảng · 1615 cột · 108 tệp Java). |
| 4 | **Database** — schema · migration · quan hệ · toàn vẹn | 🟢 ĐẠT | ① `probe-schema-drift`: **«tệp migration TÁI LẬP ĐƯỢC DB đang chạy (0 lệch)»** ② `p2-reference-integrity`: **15/15 cặp quan hệ, 0 dòng mồ côi** ③ identity gate **0 lỗi** ④ Flyway: **29 tệp migration** · 127 bảng nghiệp vụ. |
| 5 | **Workflow** — approval · transition · SLA · history | 🟢 ĐẠT (phần đã làm) | P14-04: 4 quy trình · 4 bước mặc định · mọi bước có người duyệt · 3 chế độ modal (`single`/`any_of`/`all_of`) + tìm ứng viên · tạo/đọc/xoá workflow + chặn xoá mặc định · workflow+RBAC regression **16/16** · §4.4 quá hạn: `RequestOverdueReasonTest` **2/2** (400 khi thiếu lý do + lưu vết `overdue_reason`). |
| 6 | **Notification** — Web · Email · recipient · read state | 🟢 ĐẠT | PHASE 13 **6/6** · `NotificationCenterTest` **4/4** · `NotificationManagementUseCase` đã tách luật `NotificationRule` + `NotificationRecipientResolver` · 3 action read/snooze nằm trong `PUBLIC_ACTIONS`. ⚠️ **GHI NHẬN TRUNG THỰC**: **chưa có worker SMTP `@Scheduled`** (chỉ có `retry_email`); đây là hiện trạng đã biết, ⛔ không tự thêm. |
| 7 | **Testing** — functional · integration · regression | 🟢 ĐẠT | ① **Frontend: `node --import tsx --test tests/*.test.mjs` = 570 hợp đồng · 569 PASS · 0 FAIL · 1 skip** ② frontend regression **69/69** · `npx tsc --noEmit` **0** · workflow suite ĐẠT · **Java `64/64`** ③ các contract PHASE 6 **19/19** · contract license **4/4** ④ **ĐỢT RÀ PROBE ĐÃ CHỐT**: `MT2_GATE_SWEEP_23-09.md` §H.1 → **§H.31** + **§H.18.1 SỔ KIỂM CHỐT** — **109 tệp probe · 109/109 ĐÃ CÓ kết quả ghi lại** (§H.25 kiểm độ phủ) · **28 lỗi CÔNG CỤ/PROBE đã sửa** · **1 lỗi SẢN PHẨM thật đã vá** (nút «Thu gọn khối», kiểm LIVE bằng chuột thật) · **0 lỗi SẢN PHẨM đang đỏ** ⑤ **KIỂM CƠ HỌC LẠI (§50, chạy lại trong phiên này): 43/43 tiêu đề cấp 2 của `MASTER_TASK_2.md` ĐỀU được tham chiếu bằng chứng · 0 tiêu đề chưa tham chiếu**. |
| 8 | **Documentation** — TODO · MASTER_STATUS · TASK_INDEX · task history | 🟢 ĐẠT | `MT2_PHASE_TASK_LIST.md` (100 dòng, mẫu số CHỐT) · `MT2_EXECUTION_STATE.md` · `AUDIT_MT2_GAP.md` (đối soát §11 + chốt mẫu số) · `MT2-P14-03-LICENSE-PARITY-AUDIT.md` · `MT2-PHASE-1-AUDIT.md` · `MT2-PHASE-6-AUDIT.md` (nhật ký P4/P6/P8 + đính chính P8-05) · memory dự án (quy tắc H2). |

### A.1 — 🔄 CHẠY LẠI **TOÀN BỘ CỔNG** TRONG PHIÊN NÀY (bằng chứng MỚI, ⛔ không trích số cũ)
```text
frontend contracts : node --import tsx --test tests/*.test.mjs
                     ⇒ tests 570 · PASS 569 · FAIL 0 · cancelled 0 · SKIP 1 · duration 24,0s   (exit 0)
regression         : npm run test:regression       ⇒ tests 69 · pass 69 · fail 0 · skipped 0   (exit 0)
typecheck          : npx tsc --noEmit              ⇒ exit 0 (⛔ không lỗi)
lint               : npm run lint                  ⇒ ✖ 203 problems (0 ERRORS · 203 warnings)   (exit 0)
CSS baseline gate  : npm run verify:css-baseline   ⇒ ĐẠT · 2551 dòng · 364041 byte · 3654 !important ·
                                                     dead classes = 0 · dead vars = 0 · dynamic contracts = PASS ·
                                                     empty media = 0 · historical patch markers = 0
master baseline    : npm run verify:master-baseline ⇒ ĐẠT · /api/files SSOT · dual storage DELETE ·
                                                     schema 0047 aligned · identity 0049 · CSS R1.1.1 canonical
fingerprint        : npm run verify:fingerprint    ⇒ ĐẠT · VNTECH-FP-7A4835FBC5BCBCA7 · source: 513 files ·
                                                     brand/release verified · logo:e3e4e47d0f02
artifact           : npm run validate:artifact     ⇒ FULL W2 SOURCE PREFLIGHT: ĐẠT ·
                                                     BUILT ARTIFACT VALIDATION: ĐẠT · 5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908
Java               : mvn -pl web -am test          ⇒ 64/64 · 0 Failures · 0 Errors · BUILD SUCCESS
probe              : **109 tệp `tools/probe-*.mjs` · 109/109 đã có kết quả ghi lại** · **28 lỗi CÔNG CỤ/PROBE đã sửa** · 1 lỗi SẢN PHẨM thật đã vá · 0 ca BLOCKED
kiểm cơ học §50    : đối chiếu MỌI tiêu đề CẤP 2 của `MASTER_TASK_2.md` với 4 hồ sơ bằng chứng
                     ⇒ 43/43 ĐƯỢC THAM CHIẾU · 0 tiêu đề chưa tham chiếu
```
⚠️ **Số cũ đã được thay:** «Java 61/61» → **64/64** · «probe LIVE 3 bộ» → **109 tệp probe (109/109 đã có kết quả)** (28 lỗi công cụ · 1 lỗi sản phẩm thật · **0 ca BLOCKED** · 0 lỗi sản phẩm đang đỏ).

### A.2 — 🖥️ KIỂM **HỆ THỐNG ĐANG CHẠY** NGAY TRONG PHIÊN (§46)
```text
CỔNG ĐANG NGHE      : 18081 → PID 10684 (java)    · 9000 → PID 18512 (node, proxy)  · 8787 → PID 18852 (node, UI)
BUNDLE ĐANG PHỤC VỤ : :8787 và :9000 ĐỀU nạp  assets/page-C3s9lFmS.js   (⛔ không lệch giữa UI và proxy)
API Java còn sống   : GET /api/system KHÔNG token ⇒ HTTP 401  (⇒ sống + đúng DEFAULT-DENY)
DẤU TRONG BUNDLE    : request-child-pos = 3 · request-child-pos-empty = 1 · grn-source-po = 4 ·
                      approval-step-decided-at = 1 · approval-step-comment = 1 ·
                      **sections-collapsed = 1** (⛔ bằng chứng bản vá «Thu gọn khối» CÓ trong bundle đang phục vụ)
```
⇒ **Nghiệm thu mắt được ngay**: mở `http://127.0.0.1:8787` là chạy đúng bundle đã kiểm — asset **`page-C3s9lFmS.js` (1.024.969 byte)** đã xác nhận bằng cách **gọi HTTP `:8787` và đọc tên asset trong HTML** (⚠️ ĐÍNH CHÍNH: bundle chứa **4/5 nhãn literal** + bản vá nút «Thu gọn khối»; nhãn «Trung tâm phê duyệt» là **menu DỰNG TỪ DỮ LIỆU**; còn «**5/5 dấu**» là phép kiểm **TRÊN DOM lúc chạy** — `probe-p2-ui-dom.mjs` ĐẠT).

---

## B. §53 — KHUNG BÁO CÁO CUỐI (ĐIỀN SAU KHI GỠ BLOCKER)

```text
MASTER TASK 2 — VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)
STATUS      : ⛔ CHƯA COMPLETE — chờ 5 quyết định của user (P4-01 · P5-03 · P5-04 · P10-05) rồi chạy P14-05
TIẾN ĐỘ     : 74/81 = 91,4 % (số ĐẾM ĐƯỢC — ⚠️ đang đối soát, xem đính chính)  (74 DONE · 0 TODO · 2 SKIPPED · 5 BLOCKED (trên 81 dòng task đếm được))

IMPLEMENTED : 14 PHASE; 10 phase đã XONG toàn bộ (1 · 2 · 3 · 4 · 6 · 8 · 9 · 12 · 13 …), PHASE 7 = 4/4 + 1 SKIP,
              PHASE 14 = 5/6 (chỉ còn final audit), PHASE 5 = 2/4, PHASE 10 = 5/6, PHASE 11 = 4/5
TESTED      : frontend regression 69/69 · tsc 0 · Java 61/61 (0 Failures/0 Errors) · contract P6 19/19 ·
              license parity 4/4 · p08-supplier-po-material + p2-08 19/19 · p3-05 3/3
VALIDATED   : probe LIVE: menu P5 4/4 · attachment P6-07 4/4 · menu 1 mục P6-08 3/3 ·
              DB: schema-drift 0 lệch · java-sql-schema 0 sai · reference-integrity 15/15, 0 mồ côi
DOCUMENTATION: MT2_PHASE_TASK_LIST · MT2_EXECUTION_STATE · AUDIT_MT2_GAP · 3 tệp audit theo phase/task

KNOWN LIMITATIONS : 5 mục BLOCKED (P4-01 · P5-03 · P5-04 ngưỡng «phó GĐ trở lên» · P10-05 liên kết VB pháp lý ↔ công văn ·
                    P14-05 chính là báo cáo này) + chưa có worker SMTP gửi email tự động
SKIPPED BY REQUIREMENT : P7-05 (logic đánh giá tiến độ) · P11-05 (so sánh/đối chiếu BOQ · soát trùng Alias · chất lượng danh mục)
NO COMMIT · NO PUSH
```

---

## C. VIỆC CÒN LẠI ĐỂ CHỐT P14-05 (⛔ chỉ user gỡ được)

| # | Mục | Cần gì từ user | Ảnh hưởng khi gỡ |
|---|---|---|---|
| 1 | **P5-03 · P5-04 · P4-01** | Chọn **(A)** thêm cấp `pho_giam_doc` (`level_rank` ≈ 35) **hay (B)** «phó GĐ trở lên» = `level_rank >= 40` | PHASE 5 ⇒ **4/4**; mở luôn P4-01 |
| 2 | **P10-05** | Chọn **(A)** thêm cột `correspondence_id` (+ UI chọn công văn) **hay (B)** chỉ gợi ý theo `docType` | PHASE 10 ⇒ **6/6** |
| 3 | **P14-05** | Chạy sau khi (1) và (2) xong: điền §B + ký chốt | **PHASE 14 ⇒ 6/6** và MASTER TASK 2 mới đủ điều kiện kết luận |

> ⚠️ 3 quyết định này đã được hỏi qua **thẻ chọn trên Telegram/DSH** — ⛔ chưa có trả lời ⇒ giữ BLOCKED, ⛔ **không tự bịa nghiệp vụ** (GOAL §13/§14).

---

### A.3 — 🔎 BẰNG CHỨNG KIỂM **TRỰC TIẾP TRÊN BẢN ĐANG PHỤC VỤ** (đo trong phiên 26/09/2026)
| Phép kiểm | Cách đo | Kết quả |
|---|---|---|
| Xác định ĐÚNG asset đang phục vụ | gọi `Invoke-WebRequest http://127.0.0.1:8787/` (HTTP 200) rồi đọc tên asset trong HTML | asset = **`page-C3s9lFmS.js`** · **1.024.969 byte** (khớp hồ sơ) |
| MT2 §6.11 — ĐỔI nhãn «Xác nhận giao hàng thực tế» → «Chi tiết đơn giao hàng» | grep nhãn trong `app/`+`lib/` VÀ trong asset phục vụ | ✅ nhãn CŨ **⛔ không còn** ở cả hai nơi · nhãn MỚI **có** (`Delivered.tsx:24-27` + modal `ReceiptDrawer.tsx`) |
| Bản vá lỗi thật «Thu gọn khối» | tìm chuỗi `sections-collapsed` trong asset phục vụ | ✅ **có** |
| **11 nhãn UI mà MT2 trích nguyên văn** | đối chiếu mã + **14 tệp JS trong `dist`** + HTML thật + asset phục vụ | ✅ **11/11 có trong mã** · **8/11 là literal trong bản phục vụ** · 3/11 vắng mặt **đã kiểm nguyên nhân từng cái** (2 nhãn nằm trong **CHÚ THÍCH** bị strip khi build: `ui-shared.tsx:300` · `CorrespondenceScreen.tsx:15`; 1 nhãn menu **DỰNG TỪ DỮ LIỆU**: `page.tsx:559,574` · `menu-helpers.ts:129`) ⇒ **0 nhãn thiếu do lỗi** (chi tiết §H.31) |
| Độ phủ probe | so 109 tệp `tools/probe-*.mjs` với sổ kiểm | ✅ **109/109 đã có kết quả** (trước đó 103) — §H.25 |
| 4 mục đối chiếu **NGUỒN SỰ THẬT** | tra `MASTER_TASK_2.md` | ⑤.7 **ĐÓNG** (Tổ đội chỉ đọc = đúng §8) · ⑤.3 **ĐÓNG** (101–103 là mirror ngoài §7 ⇒ vá probe #33, `probe-task043` **27/27 ĐẠT**) · ⑤.1 **hạ mức** (MT2 ⛔ không nhắc `stage_kind`/`avatar`/`approved_at`) · ⑤.6 **hạ mức** (MT2 ⛔ không yêu cầu `before_json`/`after_json`) · ⑤.4 **hạ mức** (§6.11 ⛔ không yêu cầu người xác nhận cho 14 dòng cũ) |
⚠️ **2 đính chính trung thực trong phiên (ghi lại để ⛔ không lặp):** ① câu «bundle chứa **5/5 dấu**» là **sai cách diễn đạt** ⇒ nay ghi **8/11 nhãn literal** + lý do từng nhãn (§H.31); ② tôi từng **bác bỏ sai** nguyên nhân `drizzle/0080 datetime()` của cổng release — bộ kiểm bắt **MỌI** mẫu `datetime(` (kể cả `datetime(3)`) ⇒ **ghi chú GỐC đúng**, đã sửa lại (§H khối «ĐÍNH CHÍNH CHÍNH BẢN ĐÍNH CHÍNH»).

### B. §53 — KHUNG BÁO CÁO CUỐI (điền được NGAY, ⛔ chưa được phép phát hành vì còn 5 BLOCKED)
``text
MASTER TASK 2 — VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)
STATUS      : CHƯA CHỐT — 74/81 = 91,4 % (số ĐẾM ĐƯỢC — ⚠️ đang đối soát, xem đính chính) (74 DONE · 0 TODO · 2 SKIPPED · 5 BLOCKED (trên 81 dòng task đếm được) chờ user)
IMPLEMENTED : 14 PHASE theo docs/dsh/MT2_PHASE_TASK_LIST.md — PHASE 1 8/8 · 2 9/9 · 3 9/9 · 4 4/4 · 6 8/8 · 7 4/4 ·
              8 12/12 · 9 9/9 · 12 7/7 · 13 6/6 · 14 5/6 · 5 2/4 · 10 5/6 · 11 4/5 · 1 lỗi SẢN PHẨM thật đã vá
              (nút «Thu gọn khối» — kiểm LIVE bằng chuột thật: bodyScroll 1605 → 375), có trong bundle đang phục vụ
TESTED      : frontend 570 hợp đồng (569 PASS · 0 FAIL · 1 skip) · regression 69/69 · tsc 0 · lint 0 lỗi ·
              Java mvn -pl web -am test 64/64 · 109/109 tệp probe đã có kết quả · 28 lỗi công cụ/probe đã sửa
VALIDATED   : 10/10 cổng ĐẠT — css-baseline · master-baseline · fingerprint VNTECH-FP-7A4835FBC5BCBCA7 (513 tệp) ·
              validate:artifact (FULL W2 + BUILT ARTIFACT) · schema-drift 0 lệch · §50 kiểm cơ học 43/43
              · kiểm TRỰC TIẾP trên bản phục vụ: asset page-C3s9lFmS.js (1.024.969 byte) có nhãn MT2 §6.11 mới,
              ⛔ không còn nhãn cũ, có bản vá; 11/11 nhãn UI MT2 có trong mã (8/11 literal trong bundle)
DOCUMENTATION: MT2_PHASE_TASK_LIST.md · MT2_EXECUTION_STATE.md · MASTER_STATUS.md · TASK_INDEX.md ·
              MT2_GATE_SWEEP_23-09.md (§H.1→§H.31 + §H.18.1 sổ kiểm) · MT2_BLOCKER_DECISION_BRIEF.md ·
              MT2_CHECKPOINT.md · MT2-PATCH-31-32.md · MT2-P14-06-SPEC.md · TASK-MT2-P14-03c.md (§35)
KNOWN LIMIT  : ① 1.486 dòng audit_logs thiếu before_json (lệch CHẤT LƯỢNG nhật ký; MT2 ⛔ không yêu cầu) ·
              ② 3 khe hở ghi cột JS⇄Java (stage_kind 🔴 đã HẠ MỨC vì MT2 ⛔ không yêu cầu; action đang 403) ·
              ③ chưa có worker SMTP @Scheduled (chỉ có retry_email) · ④ canonical.css 967 > trần 930 (37 dòng) ·
              ⑤ ảnh chuẩn visual 59/68 lệch (⚠️ tôi ⛔ KHÔNG đọc được ảnh ⇒ cần user nghiệm thu mắt)
SKIPPED     : ⛔ THEO YÊU CẦU MT2 (⛔ không phải việc bị bỏ dở) — ① MT2-P7-05: MT2 §5.3 (`:107`) «Chưa có
              nghiệp vụ đánh giá ⇒ CHỈ triển khai phần HIỂN THỊ và NHẬP DỮ LIỆU» + GOAL §14 ⇒ ⛔ không tự
              dựng logic đánh giá; ② MT2-P11-05: MT2 §12.3 (`:247`) «⏸️ Tạm bỏ qua: So sánh/Đối chiếu BOQ ·
              Soát trùng Alias · Đánh giá chất lượng danh mục» — kèm bằng chứng đã grep: `app/**`+`lib/**`
              ⇒ 0 mã liên quan. Sổ đăng ký phạm vi bỏ qua: **PHỤ LỤC A (9 miền, MT2 §2 + §38)** trong
              `MT2_PHASE_TASK_LIST.md` (dòng MT2-P7-05 / MT2-P11-05).
NO COMMIT   : TRUE (GOAL MT2 §28)   ·   NO PUSH: TRUE (§29)
``