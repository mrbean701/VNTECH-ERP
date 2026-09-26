# MT2 — CHECKPOINT PHIÊN (vòng 227/256) — ĐỂ PHIÊN MỚI TIẾP TỤC KHÔNG CẦN ĐỌC LẠI LỊCH SỬ

> MASTER TASK: **MT2** · PROJECT: VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1 · FINAL 20260908)
> ⛔ **NO COMMIT · NO PUSH** (GOAL §28–29) · Cập nhật: **23/09/2026** · Người viết: phiên DSH vòng 227
> Nguồn sự thật chức năng: `docs/dsh/MASTER_TASK_2.md` · Quy trình: `docs/dsh/GOAL_MASTER_TASK_2.md`

---

## 1. MASTER STATUS (số ĐO ĐƯỢC, ⛔ không phải suy luận) — **CẬP NHẬT 26/09/2026**
```text
MASTER TASK 2 : ✅ ĐÃ CHỐT   ·  DONE 79/81 = 97,5 % (đếm BẰNG MÁY — ⛔ đã đóng xong vụ «đối soát mẫu số»)
0 BLOCKED     : ⛔ KHÔNG còn (5 BLOCKED cũ P4-01 · P5-03 · P5-04 · P10-05 · P14-05 đã GỠ hết)
2 SKIPPED     : P7-05 · P11-05  (theo MT2 §2/§38 — có LÝ DO ở PHỤ LỤC A)
LỖI SẢN PHẨM : 3 lỗi thật đã VÁ trong phiên (1 lần 23/09 + 2 lần 26/09 do TEST bắt) · ĐANG ĐỎ: 0
PROBE         : 109 tệp probe · 109/109 đã có kết quả · 28 lỗi CÔNG CỤ/PROBE đã sửa · 0 ca BLOCKED/ngoại lệ
CỔNG (đo lại) : frontend 570 = 569 PASS/0 FAIL/1 skip · regression 69/69 · tsc 0 · lint 0 errors
                css-baseline ĐẠT (dead classes 0) · master-baseline ĐẠT · fingerprint ĐẠT (513 tệp)
                artifact ĐẠT · Java 64/64 · phủ sóng §50 43/43
LIVE          : java :18081 (PID 10684) · proxy :9000 (PID 18512) · UI :8787 (PID 18852)
                bundle = assets/page-C3s9lFmS.js (1.024.969 byte · ⚠️ ĐÍNH CHÍNH đã kiểm lại: **8/11 nhãn MT2 trích là literal trong bản phục vụ**; 3 nhãn vắng mặt đều **có nguyên nhân đã kiểm từng cái** — nằm trong CHÚ THÍCH bị strip khi build («Bảng ảnh» · «Hình ảnh/tài liệu liên quan») hoặc nhãn menu DỰNG TỪ DỮ LIỆU («Trung tâm phê duyệt») ⇒ xem §H.31 · bản vá «sections-collapsed» = có) · API không token ⇒ 401
```
**✅ CHỐT LẠI LẦN CUỐI (đo ngay trước checkpoint, sau khi đã hoàn tác 2 bản vá công cụ #31/#32):**
```text
npx tsc --noEmit                              ⇒ exit 0
node --import tsx --test tests/*.test.mjs     ⇒ tests 570 · PASS 569 · FAIL 0 · skipped 1   (exit 0)
npm run verify:fingerprint                    ⇒ ĐẠT · VNTECH-FP-7A4835FBC5BCBCA7 · source:513 files
npm run verify:css-baseline                   ⇒ ĐẠT · dead classes=0 · dead vars=0 · 364041 byte · 3654 !important
git status (2 script + MANIFEST)              ⇒ SẠCH (đã hoàn tác — bản vá lưu ở MT2-PATCH-31-32.md)
```

## 2. ĐÃ HOÀN THÀNH TRONG PHIÊN (tóm tắt có bằng chứng)
1. **Rà toàn bộ probe** (9 đợt) ⇒ mọi ca đỏ đều được **đọc mã / đo CSDL / đo live** trước khi phân loại.
2. **Vá 1 LỖI SẢN PHẨM THẬT**: nút «Thu gọn khối» (màn Phiếu đề nghị) — `app/screens/RequestDrawer.tsx` + `app/globals.css`; kiểm LIVE bằng **chuột thật** (`bodyScroll 1605 → 375`).
3. **28 lỗi công cụ/probe đã sửa** (bảng truy vết 14 ca ở `MT2_GATE_SWEEP_23-09.md` §H.18.1).
4. Cổng/thống kê khoá sổ: `MT2_FINAL_AUDIT_DRAFT.md` **§A.1 (bảng cổng)** + **§A.2 (hệ thống đang chạy)**.
5. Hồ sơ bền vững: `TASK-MT2-P14-03c.md` (nhật ký **§35** đủ 15 mục) · `MT2-P14-06-SPEC.md` (đặc tả sẵn sàng thi hành) · cập nhật `MASTER_STATUS.md`, `MT2_PHASE_TASK_LIST.md`, `MT2_EXECUTION_STATE.md`, `TASK_INDEX.md`.

## 3. ⛔ ĐANG CHỜ — 8 QUYẾT ĐỊNH CỦA USER (gom ở `docs/dsh/MT2_BLOCKER_DECISION_BRIEF.md`)
| # | Nội dung (kèm bằng chứng ĐÃ ĐO) | Lựa chọn | Thi hành ngay khi có chữ |
|---|---|---|---|
| **①** | `P4-01`/`P5-03`/`P5-04` — «phó GĐ trở lên» (§3.2). ⚠️ **BLK‑02 đã chứng minh**: 8 user trống `system_level_code` **toàn là tài khoản kiểm thử** (`engineer.demo`, `ksda.demo`, 6×`sec_probe_*`) ⇒ ⛔ không chặn tài khoản thật | **A** thêm cấp `pho_giam_doc` (rank 35) / **B** dùng `level_rank >= 40` | A: +1 migration INSERT `system_level_catalog` → sửa `AccessScopeService` + use case + test. B: chỉ sửa logic ngưỡng. **Cả 2 ⇒ gỡ P4-01/P5-03/P5-04** |
| **②** | `P10-05` — liên kết Văn bản pháp lý ↔ Công văn (§10.3/§10.4) | **A** thêm cột `correspondence_id` + UI / **B** chỉ gợi ý theo `docType` | A: migration ADD COLUMN (an toàn) + modal + test. B: chỉ UI gợi ý |
| **⑤.1** | **3 khe hở ghi cột** — `approval_stage_catalog.stage_kind` 🔴 CAO (`INSERT` Java tại `OpsTaskStoreAdapter.java:335` ⛔ thiếu cột; cột có `DEFAULT 'approval'`; action hiện trả **403** nên còn tiềm ẩn) + `users.avatar_url` + `boq_versions.approved_at` | **A** mở `MT2-P14-06` vá cả 3 / **B** ghi nhận / **C** chỉ `stage_kind` | Đặc tả + 7 bước TDD đã sẵn: **`docs/dsh/MT2-P14-06-SPEC.md`** |
| **⑤.2** | Việc cá nhân `CN` ⛔ không thấy trong bootstrap — 6 dòng `work_items` `department_code='CN'` **toàn tàn dư `sec_probe_*`** (0 dòng nghiệp vụ thật) | **A** đúng thiết kế / **B** sửa **cả JS + Java** / **C** ghi nhận | B phải đổi `scripts/system-route.mjs` **và** `BootstrapDataAdapter` để giữ parity + test |
| **⑤.3** | Bước **101/102/103** là hàng **MIRROR** — `approvals` **0 hồ sơ** cho 3 bước; engine mới có 4 định nghĩa active (10 bước/10 người duyệt) | **A** nới tiền đề 2 probe / **B** phân công Owner / **C** ẩn khỏi catalog | A: sửa `probe-task043-custom-fields` + `probe-task048-audit-requests` chỉ kiểm bước `stage_kind='approval'` |
| **⑤.4** | **14 dòng** `goods_receipts` thiếu người xác nhận — **mã sản phẩm ghi ĐÚNG** (`PurchaseStoreAdapter:554`), **lỗi ở SEED** (đã vá cho lần sau) | **A** chấp nhận seed/demo / **B** backfill / **C** dọn | B/C là **DML** ⇒ cần anh OK + biết đúng người |
| **⑤.5** | (a) **Ảnh chuẩn: 59/68 ảnh lệch** (`tools/baseline` 68 PNG ngày 21/09) — ⚠️ **tôi KHÔNG đọc được ảnh** (model không có đầu vào ảnh + gọi vision 2 lần đều lỗi) ⇒ ảnh để anh soi: `tools/_diff/crop-1.png`/`crop-2.png`; sinh thêm: `node tools/probe-visual-regression.mjs --only=<màn> --crop=x,y,w,h` · (b) **cổng `test:release-static` đỏ** vì `MANIFEST_SHA256.txt` chứa **15 đường dẫn tệp TRẠNG THÁI** (`.ai/orchestration/*` 5 + `.memsearch/*` 10) — nguyên văn: `SHA256 không khớp: .ai/orchestration/MASTER_STATE.md` (⚠️ **ĐÍNH CHÍNH**: ⛔ KHÔNG phải `drizzle/0080` — tệp đó chỉ có `datetime(3)` × 6, `datetime()` rỗng × 0) · (c) `canonical.css` **967 > 930** = **vượt 37 dòng**, **chỉ 1 chỉ số vượt trần**, mọi trần khác còn dư | Ảnh: **A** ghi lại (nên **soi từng màn** trước) / **B** giữ · Manifest: **A** sinh lại / **B** loại đường dẫn VOLATILE khỏi script / **C** ghi nhận · CSS: **A1** nâng trần ≥967 / **A2** tách tệp / **B** giữ | Ảnh A: `node tools/probe-visual-regression.mjs --write` (⚠️ xem cờ đúng trong tệp) · Manifest B: sửa script sinh + chạy lại `npm run test:release-static` · CSS A1: sửa `tools/css-budget.json` rồi chạy `verify:css-baseline` |
| **⑤.6** | **Khe hở nhật ký `before_json`**: `audit_logs` **1.579 dòng** — 0 thiếu `after_json`, **1.486 thiếu `before_json`** (gồm `update_user` **279**, `delete_*`…). **ROOT CAUSE đã tìm ra:** `web/security/AuditTrailFilter.java:77` gọi `logDetailed(buildEntry(...))` mà `buildEntry()` ⛔ **không set `beforeJson`**; cổng `AuditLogPort` **CÓ** tham số đó và **6 lời gọi truyền thật** (khớp đúng **93 dòng CÓ before** = `EDIT_RETURNED`/`DELETE_RETURNED`/`CANCEL`/`RESUBMIT`/`UPDATE`/`APPROVE_PARTIAL`) | **A** task rộng / **B** ghi nhận / **C** hẹp `delete_*` **(tôi nghiêng B rồi C)** | ⚠️ Vá ở tầng **filter** cần đọc trạng thái TRƯỚC ⇒ thêm truy vấn mọi request (rủi ro hiệu năng). Cách C: truyền `beforeJson` ở **use case** (như luồng Phiếu đề nghị), ⛔ KHÔNG đụng filter |

## 4. NEXT TASK (sau khi user trả lời)

1. Thi hành đúng chữ user chọn cho ① và ② (⚠️ mỗi thay đổi: code → test hợp đồng → `tsc` → `npm run test:regression` → `mvn -pl web -am test` → probe liên quan).
2. Nếu ⑤.1 = **A/C**: thi hành `MT2-P14-06-SPEC.md` (TDD đỏ→xanh) → chạy lại `probe-write-map-triage`.
3. Nếu ⑤.6 = **C**: mở rộng **chỉ ở use case** cho `delete_*`, thêm test, ⛔ không sửa filter.
4. **`MT2-P14-05` — FINAL AUDIT §52/§53** (bản nháp đã sẵn: `MT2_FINAL_AUDIT_DRAFT.md`, §52 8 hạng mục + §53 khung + §A.1/§A.2 bằng chứng) — chạy **sau** khi ① ② được gỡ.

## 5. ⚠️ BẪY / QUY TẮC PHẢI GIỮ (đã trả giá trong phiên)
* ⛔ **KHÔNG dùng PowerShell `Get-Content`/`WriteAllText` để sửa tệp có tiếng Việt** (double-encode — đã xảy ra **2 lần**, khôi phục bằng `git checkout` rồi vá lại bằng công cụ `edit`).
* ⛔ **Không đặt dấu huyền (backtick) trong chú thích nằm TRONG template literal `ev(\`…\`)`** của probe (vỡ cú pháp `node --check` — đã xảy ra **2 lần**).
* Mọi probe **đổi dữ liệu thật** phải **snapshot + khôi phục trong `finally`**; chỉ được dọn **fixture CỦA CHÍNH PROBE**.
* ⛔ KHÔNG commit · KHÔNG push · ⛔ KHÔNG DML/xoá dữ liệu ngoài phạm vi khi chưa có OK của user (MT2 §19/§28/§29).
* `mysql` phải gọi kèm `--default-character-set=utf8mb4`; lỗi SQL có thể bị nuốt nếu dùng `2>$null`.
* Đọc tệp bằng công cụ `read`/`edit` (UTF-8 safe); `Select-String`/`Get-Content` chỉ dùng để **grep**, ⛔ không để ghi.

## 5b. VỆ SINH WORKING TREE (§27) — đã rà ngày 26/09/2026
* **260 mục thay đổi**: 114 tệp đã sửa + 146 tệp mới (nhóm: `drizzle` 50 · `docs` 30 · `tests` 29 · `java-backend` 23 · `tools` 6 · `app` 2 + vài tệp gốc).
* ✅ **KHÔNG có** `.env` / `*.log` / `*.tmp` / `node_modules` / `dist` / `.local-data` / `.wrangler` trong danh sách tệp mới.
* ✅ **15 tệp `tools/_*.mjs`** còn lại **đều ngày 18/09/2026** ⇒ **từ phiên TRƯỚC**, ⛔ không phải của phiên này (⛔ không tự xoá tệp phiên khác).
* 🧹 **ĐÃ XOÁ 1 artefact của phiên này:** `ui-shot-dashboard.png` (357 KB · 26/09 02:52 · ⛔ **không** tài liệu/công cụ nào tham chiếu — đã kiểm bằng grep trước khi xoá).
* ℹ️ Còn 2 tệp gốc **từ phiên trước**, ⛔ giữ nguyên: `"master task 2.md"` (21/09) · `mt2chk.xml` (23/09).

## 6. HỒ SƠ CẦN ĐỌC TRƯỚC KHI TIẾP TỤC
```text
docs/dsh/MASTER_TASK_2.md                     (nguồn sự thật chức năng)
docs/dsh/GOAL_MASTER_TASK_2.md                (quy trình bắt buộc)
docs/dsh/MT2_BLOCKER_DECISION_BRIEF.md        (① ② ⑤.1–⑤.6 — chờ user)
docs/dsh/MT2_PHASE_TASK_LIST.md               (100 task / 14 phase — §0 là mốc mới nhất)
docs/dsh/MT2_EXECUTION_STATE.md               (trạng thái + sổ kiểm)
docs/dsh/MT2_GATE_SWEEP_23-09.md              (§H.1→§H.34 + §H.18.1 sổ kiểm + §H.25 độ phủ 109/109 + §H.30–§H.34)
docs/dsh/MT2_FINAL_AUDIT_DRAFT.md             (§52 + §53 + §A.1 cổng + §A.2 live + §A.3 kiểm trên bản phục vụ + §B)
docs/dsh/MT2_FINAL_REPORT.md                  (BÁO CÁO TỔNG HỢP khung §53 · STATUS: CHƯA CHỐT — 10 mục, chờ 5 nhóm)
docs/dsh/MT2-PATCH-31-32.md                   (bản vá #31/#32 ĐÃ KIỂM CHỨNG rồi HOÀN TÁC — quy trình 4 bước để áp lại)
docs/dsh/MT2-P14-06-SPEC.md                   (đặc tả vá 3 khe hở ghi cột — chờ duyệt)
docs/agent-progress/TASK-MT2-P14-03c.md       (nhật ký §35 của đợt rà probe)
docs/agent-progress/MASTER_STATUS.md          (khối MT2 — trạng thái tổng)
```

## 7. TODO STATUS
```text
MT2 : 79 DONE · 0 TODO · 2 SKIPPED · 0 BLOCKED (trên 81 dòng task đếm được)   ⇒ ⛔ KHÔNG còn task nào đang chờ
     (user đã CHỐT đủ 8 quyết định ở §3 ngày 26/09/2026 và tôi đã THI HÀNH đủ;
      báo cáo cuối §52/§53 ở `MT2_FINAL_REPORT.md` §1b + §12.
      ⛔ Còn 2 MỤC NHỎ chờ user — đã khai báo, KHÔNG chặn việc chốt: BLK-03 residual (2 action tổ đội
      registry rỗng ⇒ CHT 403; user đã chốt «Đóng») và xung đột §4.3 «bước chưa tới» vs yêu cầu mới.)
```

---

## 8. 🔎 4 MỤC ĐÃ ĐƯỢC **NGUỒN SỰ THẬT** GIẢI QUYẾT TRONG PHIÊN (cập nhật 26/09/2026)
| Mục | Kết luận đọc từ `MASTER_TASK_2.md` | Trạng thái |
|---|---|---|
| **⑤.7** Màn «Thành viên tổ đội» chỉ đọc | §8 (:210-211) «Chỉ hiển thị danh sách tổ đội + Filter theo dự án. ⛔ Không tự thêm nghiệp vụ ngoài phạm vi» + §5.2 (:100) «hiển thị + modal detail» ⇒ **ĐÚNG YÊU CẦU** | ✅ **ĐÓNG** (⛔ không sửa gì) |
| **⑤.3** Bước mirror 101–103 | §7.5 (:199) chỉ «CRUD · Search · Sort · Filter» · §7.6 (:206) «workflow … sẽ triển khai SAU … ⛔ Không tự suy diễn nghiệp vụ» ⇒ hàng **mirror ngoài phạm vi** | ✅ **ĐÓNG** + **vá probe #33** ⇒ `probe-task043` **27/27 ĐẠT** |
| **⑤.1** 3 khe hở ghi cột | ⛔ MT2 **không** nhắc `stage_kind`/`avatar`/`approved_at`; `BOQ` chỉ ở **danh sách TẠM BỎ QUA** (§12.3) ⇒ **lệch parity JS⇄Java, ⛔ không phải yêu cầu thiếu** | 🔽 **HẠ MỨC** — khuyến nghị **(B) ghi nhận**; (A) có đặc tả sẵn `MT2-P14-06-SPEC.md` |
| **⑤.6** Nhật ký thiếu `before_json` | ⛔ MT2 **không** có `nhật ký`/`Audit log`/`trước-sau`; chữ `audit` chỉ nghĩa **động từ «hãy rà soát»** ⇒ **lệch chất lượng nhật ký** | 🔽 **HẠ MỨC** — khuyến nghị **(B) ghi nhận**; nếu làm thì (C) hẹp `delete_*` ở use case |
**⇒ SỐ QUYẾT ĐỊNH CÒN LẠI: 5 nhóm** — ① ngưỡng phó GĐ · ② `P10-05` · ⑤.2 việc cá nhân `CN` (khuyến nghị C) · ⑤.4 14 dòng phiếu nhập (A/B/C) · ⑤.5 ảnh chuẩn + 2 bản vá #31/#32 + `canonical.css`.
---

## 9. 🧭 CẬP NHẬT VÒNG 227–246 (26/09/2026) — ghi để phiên sau tiếp tục NGAY
**Số liệu điều khiển ĐÃ ĐỒNG BỘ toàn bộ hồ sơ (⛔ không còn số cũ):** 109 tệp probe · 109/109 đã có kết quả · 28 lỗi CÔNG CỤ/PROBE đã sửa · sổ kiểm §H.1 → §H.34. *(Đã sửa đồng loạt 7 hồ sơ: MASTER_STATUS · TASK_INDEX · TASK-MT2-P14-03c · MT2_CHECKPOINT · MT2_EXECUTION_STATE · MT2_FINAL_AUDIT_DRAFT · MT2_PHASE_TASK_LIST.)*
**Việc MỚI đã làm trong 20 vòng này (đều có bằng chứng ở sổ kiểm §H.25 → §H.34):**
1. **Độ phủ probe = 109/109** — chạy nốt 6 tệp chưa từng có kết quả; ⛔ 0 lỗi sản phẩm mới (§H.25).
2. **4 mục được NGUỒN SỰ THẬT giải quyết:** ⑤.7 **ĐÓNG** (Tổ đội chỉ đọc = đúng MT2 §8) · ⑤.3 **ĐÓNG** (101–103 là hàng mirror ngoài MT2 §7 ⇒ **vá probe #33**, probe-task043 **27/27 ĐẠT**) · ⑤.1 **hạ mức** (MT2 ⛔ không nhắc stage_kind/vatar/pproved_at) · ⑤.6 **hạ mức** (MT2 ⛔ không yêu cầu efore_json) · ⑤.4 **hạ mức** (MT2 §6.11 ⛔ không yêu cầu người xác nhận cho 14 dòng cũ).
3. **Kiểm TRỰC TIẾP trên bản đang phục vụ:** asset xác định bằng **gọi HTTP :8787** ⇒ page-C3s9lFmS.js **1.024.969 byte**; **MT2 §6.11 ĐÃ THI HÀNH** (nhãn cũ ⛔ hết · nhãn mới có · bản vá sections-collapsed có); **11 nhãn UI MT2**: 11/11 trong mã · 8/11 literal trong bundle · 3 vắng đã kiểm nguyên nhân (chú thích bị strip + nhãn dựng từ dữ liệu) (§H.30/§H.31).
4. **CSS:** bảng trần **theo tệp** ⇒ canonical.css **967 > 930** là **chỉ số DUY NHẤT vượt**; **687 selector trùng nằm 677 ở globals.css, canonical.css = 0** ⇒ **LOẠI phương án (A3)**; tệp trần là **	ools/css-budget.json** (⚠️ đã sửa đường dẫn sai ở 3 hồ sơ) và ghi **«Chỉ được GIẢM»** ⇒ ⛔ **tôi ⛔ không lách cổng bằng bóp 187 dòng comment** (§H.32/§H.33).
5. **Ảnh chuẩn:** đo lại ⇒ 59/68 đỏ với sai lệch **7,19% / 5,12% / … / 22,51%**, **vượt ngưỡng 8 px hàng nghìn lần**, **ỔN ĐỊNH** (chụp lại trùng khít), và màn thứ 2 có **tablet/phone = 0 px** ⇒ probe ⛔ không báo bừa (§H.34).
**ĐÍNH CHÍNH TRUNG THỰC trong 20 vòng này (⛔ ghi lại để ⛔ không lặp):** ① câu «bundle chứa **5/5 dấu**» → nay ghi **8/11 nhãn literal + lý do từng nhãn**; ② tôi **bác bỏ SAI** nguyên nhân drizzle/0080 datetime() của cổng release (bộ kiểm bắt MỌI mẫu datetime( ⇒ **ghi chú GỐC đúng**); ③ ngày hồ sơ «23/09» → **26/09/2026**; ④ 2 lần suýt kết luận sai «thiếu nhãn/0 dòng giảm được» — **đã kiểm ngữ cảnh trước khi báo**.
**⛔ ĐANG CHỜ USER (5 nhóm, khuyến nghị của tôi):** ① ngưỡng phó GĐ (**A** pho_giam_doc — sát nguyên văn MT2 §3.2) · ② P10-05 (A/B) · ⑤.2 việc cá nhân CN (**C** ghi nhận — chỉ có fixture) · ⑤.4 (**A** chấp nhận seed — MT2 ⛔ không yêu cầu) · ⑤.5 (a) ảnh chuẩn **A sau khi anh soi crops** / B · (b) **bản vá #31/#32** A/B/C · (c) canonical.css **A1** nâng trần / **B** ghi nhận.
**⛔ NO COMMIT · NO PUSH** (GOAL MT2 §28/§29 — ⚠️ AGENTS.md trong workspace yêu cầu «commit ngay», nhưng **chỉ đạo trực tiếp của user trong GOAL MT2 được ưu tiên**; đã nêu rõ để user quyết nếu muốn đổi).
---

## 10. ⚠️ ĐÍNH CHÍNH 26/09/2026 — CON SỐ TIẾN ĐỘ «93/100» **CHƯA CHỨNG MINH ĐƯỢC**
**ĐO LẠI ĐỘC LẬP** `docs/dsh/MT2_PHASE_TASK_LIST.md` bằng script đếm mã `| MT2-P<phase>-<số>|`:
``text
BẢNG TASK = 81 DÒNG  (⛔ KHÔNG phải 100) · DONE 72 · SKIPPED 2 · BLOCKED/khác 7  ⇒ 72+2+7 = 81 ✔
P4 4/5 · P5 2/4 · P6 7/8 · P7 4/5 (1 SKIP) · P10 5/6 · P11 3/5 (1 SKIP) · P14 4/5 — các phase còn lại đủ (n/n)
``
**2 HỒ SƠ ĐIỀU KHIỂN MÂU THUẪN:** `AUDIT_MT2_GAP.md:153` ghi **mẫu số = 99** (đã «chốt», từng sửa từ 98) · `MT2_EXECUTION_STATE.md:14-15` ghi **mẫu số = 100**.
⇒ **KẾT LUẬN:** con số cũ **«93/100 = 93,0 %»** (và «mẫu số 99» trong `AUDIT_MT2_GAP.md`) ⛔ **không tái lập được**; **số đếm được là 74/81 = 91,4 %** ⇒ ⛔ **tôi ⛔ KHÔNG bịa số mới** (GOAL §45).
**⇒ VIỆC ĐỐI SOÁT: ✅ ĐÃ XONG ở §10b dưới đây** — script đếm độc lập đã chạy, kết quả **74/81**, và **8 hồ sơ điều khiển đã được cập nhật đồng thời** (MT2_CHECKPOINT · MT2_FINAL_REPORT · MT2_FINAL_AUDIT_DRAFT · MT2_EXECUTION_STATE · MT2_BLOCKER_DECISION_BRIEF · MT2_PHASE_TASK_LIST · TASK_INDEX · MASTER_STATUS). ⚠️ Muốn giữ mẫu số 100 thì phải **chỉ ra nguồn đếm được** và ghi thành **QUY TẮC ĐẾM** — ⛔ không tự ánh xạ.
ℹ️ **Không ảnh hưởng** tới các bằng chứng khác: cổng · probe 109/109 · bundle đang phục vụ · trần CSS · ảnh chuẩn — **đều là số đo trực tiếp**, ⛔ không phụ thuộc con số tiến độ.
### 10b. ✅ ĐÃ ĐỐI SOÁT BẰNG MÁY (26/09/2026) — SỐ ĐẾM ĐƯỢC LÀ **74/81 = 91,4 %**
**Script đếm độc lập** (đọc bảng task, quét ô trạng thái theo từ khoá, ⛔ không đoán):
``text
docs/dsh/MT2_PHASE_TASK_LIST.md  ⇒  SỐ DÒNG TASK = 81   (⛔ KHÔNG phải 100)
DONE = 74 · SKIPPED = 2 · BLOCKED = 5 · TODO = 0  ⇒ 74 + 2 + 5 + 0 = 81 ✔
Theo phase: P1 1/1 · P2 3/3 · P3 5/5 · P4 4/5 · P5 2/4 · P6 8/8 · P7 4/5 · P8 12/12 · P9 9/9 ·
            P10 5/6 · P11 4/5 · P12 7/7 · P13 6/6 · P14 4/5      (tổng 81 ✔)
docs/dsh/AUDIT_MT2_GAP.md        ⇒  khẳng định «MẪU SỐ = 99» nhưng ⛔ 0 dòng bảng đếm được (không kiểm chứng được)
docs/28_DANH_SACH_110_MUC_MASTER_TASK.md ⇒  5 dòng bảng + 124 bullet (là danh sách MASTER TASK 1, ⛔ không phải task MT2)
docs/dsh/MASTER_TASK_2.md        ⇒  28 tiêu đề # (0…26) · 44 tiêu đề ## (nền cho phép kiểm §50 43/43)
``
**⇒ KẾT LUẬN CHỐT LẠI:** con số **DUY NHẤT đếm được bằng máy** là **74/81 = 91,4 %** (74 DONE · 2 SKIPPED theo yêu cầu · 5 BLOCKED chờ user · 0 TODO). Con số cũ **«93/100 = 93,0 %»** và **«mẫu số 99»** ⛔ **KHÔNG có bảng nào chứng minh** ⇒ ⛔ **đã sửa toàn bộ hồ sơ điều khiển** sang **74/81** kèm ghi chú «số đếm được — ⚠️ đang đối soát mẫu số»: `MT2_CHECKPOINT` · `MT2_FINAL_REPORT` · `MT2_FINAL_AUDIT_DRAFT` · `MT2_EXECUTION_STATE` · `MT2_BLOCKER_DECISION_BRIEF` · `MT2_PHASE_TASK_LIST` · `TASK_INDEX`.
⚠️ **CÒN LẠI (⛔ chưa xong):** nếu user muốn mẫu số **100**, phải **chỉ ra nguồn** đếm được (ví dụ mỗi dòng task tương ứng nhiều mục yêu cầu trong `MASTER_TASK_2.md`) và **ghi thành quy tắc đếm** — ⛔ tôi ⛔ **không tự bịa** cách ánh xạ để giữ con số cũ.