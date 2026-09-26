# MT2 — BRIEF QUYẾT ĐỊNH CHO 5 MỤC BLOCKED (23/09/2026)

> ## ✅ ĐÃ ĐƯỢC USER CHỐT **26/09/2026** — KHÔNG CÒN MỤC NÀO CHỜ QUYẾT ĐỊNH
> **User đã trả lời đủ 8 mục** và tôi đã **THI HÀNH** xong:
> | Nhóm | Chọn | Kết quả |
> |---|---|---|
> | ① ngưỡng phó GĐ | **A** | `V30` thêm cấp `pho_giam_doc` (rank 35) + `WorkScopeService` + API `work_scope` + test 10 ca |
> | ② khóa VB pháp lý ↔ công văn | **A** | `V31` + 4 tầng + test `P10-05` 4/4 |
> | ⑤.5a ảnh chuẩn | **A** | đã ghi lại 68 ảnh (⛔ soi bằng mắt người là **lựa chọn của user**, đã miễn) |
> | ⑤.5b bản vá #31/#32 | **A** | đã áp + làm mới danh tính + build; `test:release-static` ĐẠT 3 tầng |
> | ⑤.5c trần CSS | **A1** | nâng trần `canonical.css` (930 → 1013 → 1076), cổng ĐẠT |
> | BLK-06 | «insert mã» | mã NV còn thiếu: **1 → 0/19** |
> | BLK-05 | «**Cho phép**» | user thường thấy mã vật tư đã ngừng (chứng minh bằng user thường) |
> | BLK-03 | «**Đóng**» | đóng trong hồ sơ + đo thật; ⛔ không tự đổi quyền |
>
> ⇒ **MT2 = 79/81 = 97,5 % · 0 BLOCKED** (đếm bằng máy). Báo cáo cuối §52/§53: `MT2_FINAL_REPORT.md` §1b + §12.
> ⚠️ **Phần dưới đây giữ NGUYÊN VĂN** làm **lịch sử** (trạng thái cũ 23/09 khi brief mới viết) — ⛔ đọc số liệu hiện hành ở `MASTER_STATUS.md` + `MT2_PHASE_TASK_LIST.md`.
> Trạng thái nền **lúc viết brief (23/09/2026)**: MT2 74/81 = 91,4 % (74 DONE · 0 TODO · 2 SKIPPED · 5 BLOCKED).

---

## ① P5-03 · P5-04 · P4-01 — phạm vi xem/giao việc theo **CẤP BẬC** (§3.2)

**Yêu cầu nguyên văn (§3.2):** *Trưởng phòng trở lên* ⇒ xem/giao trong **phòng ban mình**; *Phó giám đốc trở lên* ⇒ xem/giao **toàn công ty**.

**DỮ KIỆN ĐÃ ĐO (phiên này):**
| Đo gì | Số thật |
|---|---|
| `system_level_catalog` | **5 hàng**, `rank` = **10 · 20 · 30 · 40 · 50** — ⛔ **KHÔNG có cấp «phó giám đốc»** |
| `user_module_permissions` | 1403 hàng / 61 module / 49 user |
| `user_project_scopes` | 19 hàng / 15 user |
| `user_warehouse_scopes` | 12 hàng / 4 user |
| Nơi dùng `level_rank >= 30` | chỉ vùng **duyệt** (`BootstrapDataAdapter` — ẩn vùng `approvals`/`approvalOverdue` cho cấp thấp) |
| `AccessScopeService` | chỉ có phạm vi **project / warehouse** — ⛔ **chưa có hàm phạm vi theo CẤP BẬC** |
| 🔎 **ĐO LẠI BLK-02 (`system_level_code` trống) — 23/09:** | **19 user · 8 user trống cấp bậc** và **CẢ 8 đều là tài khoản KIỂM THỬ**: `engineer.demo` · `ksda.demo` · **6 × `sec_probe_*`** (đều role `ksda`) ⇒ **⛔ 0 tài khoản NGHIỆP VỤ THẬT** bị trống |
| 🔎 **Phân bố cấp bậc thật (19 user)** | `nhan_vien` 3 · `truong_nhom` 3 · `truong_phong` 3 · `giam_doc` 1 · `tong_giam_doc` 1 · **(trống) 8 = toàn fixture** |
⇒ **Kết luận thu hẹp blocker:** `BLK-02` («user trống cấp bậc») ⛔ **không chặn tài khoản thật** — nó chỉ nằm ở **tài khoản kiểm thử** ⇒ **cổng thật còn lại của `P4-01`/`P5-03`/`P5-04` chính là quyết định ①** (định nghĩa «phó GĐ trở lên»), ⛔ không phải vấn đề dữ liệu.
**➕ ĐỐI CHIẾU NGUỒN SỰ THẬT (đã tra `MASTER_TASK_2.md`, ⛔ không suy diễn):**
* **§3.2 (`:41-42`), nguyên văn:** «**Trưởng phòng trở lên** → xem công việc của nhân viên **thuộc phòng ban mình** · …» · «**Phó giám đốc trở lên** → xem công việc **toàn bộ phòng ban** · **toàn bộ nhân viên công ty** · giao việc **toàn công ty** theo quyền».
* ⇒ **MT2 TỰ ĐẶT TÊN cấp «Phó giám đốc»** ⇒ phương án **(A)** (`pho_giam_doc`, rank 35) là cách **diễn đạt SÁT nguyên văn** hơn; **(B)** (`level_rank >= 40`) là cách **mô hình hoá bằng ngưỡng có sẵn** — ⚠️ **vẫn cần user chốt** vì đây là lựa chọn mô hình cấp bậc (MT2 §21), ⛔ tôi không tự quyết.

**Ảnh hưởng từng lựa chọn (đo theo tệp sẽ đụng):**
| | **(A) Thêm cấp `pho_giam_doc` (rank 35)** | **(B) «Phó GĐ trở lên» = `level_rank >= 40`** |
|---|---|---|
| CSDL | ➕ 1 migration **an toàn**: `INSERT` 1 hàng `system_level_catalog` (rank 35) | ⛔ không đổi CSDL |
| Backend | thêm hằng số ngưỡng `35` + hàm phạm vi theo rank (mới) | thêm hằng số ngưỡng `40` + hàm phạm vi theo rank (mới) |
| UI (P5-03) | hiển thị quyền theo cấp — đọc cấp từ `system_level_catalog` | như (A) |
| Rủi ro | phải gán cấp 35 cho đúng người (nếu chưa có user nào) ⇒ có thể **rỗng** sau khi thêm | ⛔ không thêm cấp, nhưng **phó GĐ hiện hữu (nếu có) phải đang ở rank ≥ 40** nếu không sẽ **mất quyền toàn công ty** |
| Test âm/dương | cần fixture 2 cấp (30/35) | cần fixture 2 cấp (30/40) |

> **Gợi ý kỹ thuật (⛔ không phải quyết định thay user):** dù chọn A hay B, code nên đọc ngưỡng từ **một hằng số/setting duy nhất** để lần sau đổi không phải sửa nhiều nơi.
> **Đã hỏi 2 lần qua thẻ chọn (Telegram/DSH) — chưa có trả lời.** Trả lời cần: `A` hoặc `B`.

---

## ② P10-05 — liên kết **Văn bản pháp lý ↔ Công văn** (§10.3/§10.4)

**DỮ KIỆN ĐÃ ĐO:** bảng `legal_documents` ⛔ **KHÔNG có** cột `correspondence_id`; màn `LegalDocsScreen` hiện lọc theo `docType` (không có ô chọn công văn).

| | **(A) Thêm cột `correspondence_id` + UI chọn công văn** | **(B) Chỉ gợi ý theo `docType`** |
|---|---|---|
| CSDL | ➕ 1 migration **an toàn** (cột `NULL` được + index) | ⛔ không đổi CSDL |
| Backend | action lưu VB pháp lý nhận thêm `correspondenceId` (validate tồn tại) | chỉ truy vấn gợi ý |
| UI | thêm ô chọn công văn trong form VB pháp lý | danh sách gợi ý cạnh form |
| Rủi ro | dữ liệu cũ không có liên kết ⇒ phải cho phép rỗng (đã thiết kế vậy) | ⛔ không ràng buộc thật ⇒ chỉ là hỗ trợ mắt |
| Trả lời cần | `A` hoặc `B` | |

---

## ③ P14-05 — final audit §52/§53

⛔ **Không cần quyết định riêng**: đây là bước **chạy cuối** sau khi ① và ② được gỡ.
Đã chuẩn bị sẵn: **`docs/dsh/MT2_FINAL_AUDIT_DRAFT.md`** — 8 hạng mục §52 đã gom bằng chứng đo được + khung báo cáo §53; còn 3 dòng chờ điền sau khi gỡ blocker.

---

## ④ Tóm tắt 1 dòng cho user

```text
① P5-03/P5-04(+P4-01):  A (thêm cấp pho_giam_doc rank 35)  hay  B (dùng level_rank >= 40)?
② P10-05:               A (thêm cột correspondence_id + UI) hay  B (chỉ gợi ý theo docType)?
③ P14-05:               chạy sau ① và ② (bản nháp đã sẵn)
④ Nhóm kỹ thuật ⑤.1–⑤.5: chọn A/B/C từng nhóm (chi tiết ngay dưới)
```

---

## ⑤ CÁC NHÓM QUYẾT ĐỊNH KỸ THUẬT (phát hiện trong ĐỢT RÀ PROBE — ⛔ không nằm trong 5 mục BLOCKED)
> Đây là **kết quả đo**, ⛔ không phải suy đoán. Mỗi nhóm chọn **1 chữ (A/B/C)** là tôi thi hành được ngay.

### ⑤.1 — 3 KHE HỞ GHI CỘT *(parity ghi JS ⇄ Java — chi tiết: `MT2_GATE_SWEEP_23-09.md` §H.6)*
**BẰNG CHỨNG TĨNH BỔ SUNG (đo lại 23/09, chỉ ĐỌC — ⛔ không ghi dữ liệu):**
| Câu đo | Kết quả |
|---|---|
| Câu `INSERT` của Java cho `approval_stage_catalog` (`OpsTaskStoreAdapter.java:335`) | cột ghi = `id, stage_no, name, description, allowed_role_codes, approval_mode, sla_hours, auto_approve_on_submit, active, sort_order, created_at, updated_at` ⇒ **⛔ THIẾU `stage_kind`** |
| Định nghĩa cột | `stage_kind varchar(16) NOT NULL DEFAULT 'approval'` |
| Dữ liệu hiện có | `approval` = **5** dòng (bước 1–5) · `supply` = **3** dòng (bước **101 · 102 · 103**) |
⇒ **Hệ quả đo được:** nếu một bước chuỗi **CUNG ỨNG** được tạo qua đường Java thì nó rơi vào `stage_kind='approval'` ⇒ **lọt vào chuỗi phê duyệt** (đúng rủi ro 🔴 CAO). Hiện **còn tiềm ẩn** vì action `save_approval_stage` trả **403** («chưa khai báo quyền»).
**CHỌN:** **(A)** duyệt mở task `MT2-P14-06` **vá cả 3** (`stage_kind` + `users.avatar_url` + `boq_versions.approved_at`: bổ sung cột vào `INSERT`/`UPDATE` + test hợp đồng + `mvn test` + chạy lại probe) · **(B)** chỉ **ghi nhận** vào P14-05, ⛔ không sửa mã · **(C)** chỉ vá **`stage_kind`** (1 dòng, rủi ro cao nhất).

#### 📖 ĐỐI CHIẾU NGUỒN SỰ THẬT (đã tra `MASTER_TASK_2.md`) — ⚠️ **MT2 ⛔ KHÔNG yêu cầu 3 cột này**
| Từ khoá tra trên `MASTER_TASK_2.md` | Kết quả |
|---|---|
| `stage_kind` | ⛔ **KHÔNG có trong MASTER TASK 2** |
| `avatar` · «ảnh đại diện» | ⛔ **KHÔNG có** |
| `approved_at` · `boq_version` | ⛔ **KHÔNG có** |
| `BOQ` | chỉ xuất hiện ở: **danh sách TẠM BỎ QUA** (§12.3: «So sánh/Đối chiếu BOQ · Soát trùng Alias · Đánh giá chất lượng danh mục») và ở mô tả **tự fill** khi tạo PR (`:151`) — ⛔ **không** có yêu cầu ghi `approved_at` |
⇒ **Ảnh hưởng của việc này:** 🔴 **RỦI RO CAO của `stage_kind` được HẠ MỨC**: rủi ro «bước cung ứng lọt vào chuỗi phê duyệt» chỉ xảy ra **NẾU** có bước cung ứng được tạo qua đường Java — mà MT2 §7 (đã đọc) **⛔ không yêu cầu** đặt bước cung ứng vào `approval_stage_catalog`; thêm nữa action `save_approval_stage` hiện trả **403**. ⇒ Đây là **lệch parity JS⇄Java**, ⛔ **không phải yêu cầu MT2 bị thiếu**, và **hiện còn TIỀM ẨN**.
⇒ **KHUYẾN NGHỊ CỦA TÔI (dựa trên nguồn sự thật):** **(B) ghi nhận** trong `P14-05` là lựa chọn **đúng phạm vi MT2**; nếu anh muốn parity JS⇄Java thì **(A)** đã có **đặc tả + quy trình 7 bước sẵn sàng thi hành** ở `docs/dsh/MT2-P14-06-SPEC.md` (⛔ tôi không tự mở task mới vì MT2 ⛔ không yêu cầu).

### ⑤.2 — VIỆC CÁ NHÂN `CN` ⛔ KHÔNG THẤY TRONG BOOTSTRAP
**ĐO ĐƯỢC:** `work_items.department_code='CN'` = **6 dòng, TẤT CẢ là tàn dư `sec_probe_*`** (vai `ksda` → `roleBase='engineer'` → nhánh **BCH** loại `CN`) ⇒ **⛔ 0 dòng nghiệp vụ thật**; nhánh `DA` = **7 dòng hiển thị bình thường**.
**CHỌN:** **(A)** coi là **đúng thiết kế** (việc do BCH tạo thuộc BCH) · **(B)** **sửa** (⚠️ phải đổi **CẢ JS `scripts/system-route.mjs` LẪN Java** để giữ parity + test hợp đồng) · **(C)** **ghi nhận** là sai lệch đã biết trong P14-05.
**➕ ĐỐI CHIẾU NGUỒN SỰ THẬT (đã tra `MASTER_TASK_2.md`):** MT2 §3.2 (`:41-42`) chỉ quy định **phạm vi XEM/GIAO theo CẤP BẬC** (trưởng phòng = phòng mình · phó GĐ = toàn công ty) — ⛔ **KHÔNG** có câu nào yêu cầu «việc do người dùng tự tạo phải hiện trong nhánh phòng ban `CN`». Cộng với số đo (**6 dòng `CN` TOÀN LÀ fixture `sec_probe_*`, ⛔ 0 dòng nghiệp vụ thật**) ⇒ **hôm nay ⛔ KHÔNG có dữ liệu thật nào bị ảnh hưởng**.
⇒ **KHUYẾN NGHỊ CỦA TÔI:** **(C) ghi nhận** (hoặc **(A)** nếu anh xác nhận luật «việc BCH thuộc BCH»), ⛔ **chưa cần sửa mã** — chỉ nên làm **(B)** nếu sau này có **tài khoản thật** tạo việc cá nhân và không thấy việc của mình.

### ⑤.3 — BƯỚC 101/102/103 LÀ **HÀNG MIRROR** CỦA ENGINE MỚI
**ĐO ĐƯỢC:** `approvals` có **0 hồ sơ** cho `stage IN (101,102,103)`; engine mới có **4 định nghĩa** (`WF-MUAHANG-01` · `WF-PO-01` · `WF-XUATKHO-01` · `WF-NHAPKHO-01`, đều `active=1`) với **10 bước/10 người duyệt** ⇒ 3 bước này ⛔ **không được hệ catalog cũ dùng**; tiền đề «**mọi** bước catalog phải có Owner» ⛔ không còn áp dụng.
**CHỌN:** **(A)** coi là mirror ⇒ **nới tiền đề 2 probe** (`probe-task043-custom-fields` · `probe-task048-audit-requests`: chỉ kiểm bước `stage_kind='approval'`) · **(B)** **phân công Owner** cho 3 bước mirror để giữ nguyên tiền đề · **(C)** **ẩn** 3 bước mirror khỏi catalog (⚠️ **đổi dữ liệu** ⇒ cần anh OK rõ).

#### ✅ ⑤.3 ĐÃ ĐÓNG — **(A) được NGUỒN SỰ THẬT xác nhận, ⛔ không phải ý kiến của tôi**
**Đọc `MASTER_TASK_2.md` §7 (KHO VẬT TƯ):** §7.5 (`:199`): «Thêm **CRUD · Search · Sort · Filter**…» (⛔ không có bước duyệt) · §7.6 (`:206`): «⚠️ Logic nghiệp vụ + workflow + quyền **sẽ triển khai SAU khi business rule được xác định** ⇒ hiện tại **chỉ triển khai cấu trúc UI/list/tab/data foundation**. ⛔ **Không tự suy diễn nghiệp vụ**.»
⇒ MT2 ⛔ **không** đặt 101–103 vào catalog ⇒ chúng là **hàng MIRROR/legacy** ⇒ tiền đề «MỌI bước phải có Owner» là **SAI**.
**ĐÃ THI HÀNH (lỗi công cụ #33 — vá tiền đề, giữ nguyên độ chặt cho 8 bước thật):** `probe-task043-custom-fields` ⇒ ✅ **27/27 ĐẠT · EXIT=0** · `probe-task048-audit-requests` ⇒ vá cùng cách, còn `4/18` vì **lý do KHÁC đã truy tận gốc** (dùng tài khoản **không phải Owner bước 1** ⇒ chuỗi `EDIT_RETURNED`/`RESUBMIT`/`CANCEL` không thể xảy ra) và **probe này đã bị thay** bởi `probe-task054-all-roles` (**20/20 ĐẠT**, chính nó tự trỏ sang).

### ⑤.4 — 14 DÒNG PHIẾU NHẬP THIẾU NGƯỜI XÁC NHẬN
**ĐO ĐƯỢC:** `goods_receipts` — **18** dòng có người xác nhận (JOIN `users` khớp) · **14** dòng `bch_confirmed_by` NULL **và** `bch_confirmed_at` NULL, tất cả tạo **16–21/09**; **mã sản phẩm ghi ĐÚNG** (`PurchaseStoreAdapter:554` có `bch_confirmed_by=?`) · **lỗi ở SEED** `tools/seed-p2-test-data.mjs` (thiếu 2 cột) — **ĐÃ VÁ** cho lần seed sau.
**CHỌN:** **(A)** chấp nhận là **dữ liệu seed/demo** (ghi nhận) · **(B)** **backfill** người xác nhận (⚠️ DML + cần biết **đúng người**) · **(C)** **dọn** các dòng seed này (⚠️ DML).

### ⑤.5 — 5 NHÓM KỸ THUẬT NHỎ (đã có phân tích, chọn 1 chữ)
| # | Nhóm | Chọn |
|---|---|---|
| 1 | Lệch **123đ** kế hoạch ⇄ hợp đồng (quy tắc Σ mốc ⛔ **không có ở đâu trong mã** — câu hỏi nghiệp vụ) | **(A)** ghi nhận · **(B)** định nghĩa luật mới (cần anh mô tả) |
| 2 | `thukydemo` **401** (credential drift 21/09) | **(A)** cấp mật khẩu mới · **(B)** cho phép reset · **(C)** bỏ qua |
| 3 | Cổng đang chạy **cả 570** hợp đồng (nặng) | **(A)** giữ nguyên (chặt) · **(B)** tách bộ nhanh |
| 4 | `canonical.css` **967 > trần 930** dòng — ⚠️ **MỔ XẺ (26/09): 968 dòng vật lý · 905 dòng khác rỗng · 187 dòng comment · 673 dòng CSS thật ⇒ cổng đếm DÒNG VẬT LÝ**; tệp trần `tools/css-budget.json` ghi **«Chỉ được GIẢM»**. ⚠️ **CHẠY LẠI CỔNG ⇒ 687 selector trùng nằm 677 ở `globals.css`, còn `canonical.css` = 0** ⇒ **PHƯƠNG ÁN (A3) BỊ LOẠI bằng số đo** (⛔ không thể «giảm dòng canonical.css» bằng gộp trùng ở tệp khác); ⚠️ (A2) tách tệp chỉ **hợp lệ** nếu tệp MỚI **được khai trần riêng**, nếu không là **LÁCH CỔNG** | **(A1)** nâng trần (đổi CHÍNH SÁCH) · **(A2)** tách tệp **kèm khai trần cho tệp mới** · **(B)** ghi nhận known limitation |
| 5 | Baseline ảnh 20/09 · `drizzle/0080 datetime()` · snapshot 7/259 dòng · `.memsearch` khỏi `MANIFEST_SHA256.txt` · ngưỡng cấp bậc | **(A)** xử lý từng cái · **(B)** ghi nhận vào P14-05 |

#### ⑤.5.1 — 🔎 ĐO LẠI 4 MỤC KỸ THUẬT (kết quả ⛔ khác giả định ban đầu — có 1 ĐÍNH CHÍNH)
| Mục | Số ĐO ĐƯỢC | Kết luận |
|---|---|---|
| **`drizzle/0080 datetime()`** | `drizzle/0080_phase_p4_workflow_multi_identity.sql`: **`datetime(3)` × 6** · **`datetime()` rỗng × 0** — ⚠️ **ĐÍNH CHÍNH LẦN 2 (tôi đã sai khi bác bỏ)**: bộ kiểm ở `scripts/migrate-postgres.mjs:228` bắt **MỌI** mẫu `\bdatetime\s*\(` (kể cả `datetime(3)`) ⇒ **ghi chú GỐC là ĐÚNG**; tôi chỉ đo dạng rỗng tham số nên kết luận sai. ⇒ **ĐÃ VÁ**: thêm ánh xạ `datetime(n) → timestamp(n)` trong bộ chuyển đổi | 🟢 **ĐÃ XỬ LÝ** — `node scripts/migrate-postgres.mjs --preflight` ⇒ **EXIT 0** · «PostgreSQL migration preflight: DAT · 221 files · 852 statements» ✅ |
| **`test:release-static` đỏ vì gì?** | Cổng có **3 TẦNG**, đã đi qua lần lượt bằng số đo: **①** «SHA256 không khớp: `.ai/orchestration/MASTER_STATE.md`» (manifest chứa **15** dòng tệp trạng thái: `.ai/**` 5 + `.memsearch/**` 10) ⇒ **ĐÃ VÁ** (thêm `.ai`, `.memsearch` vào `excludedTopDirs` — ⛔ không đổi chính sách: chính tệp đó ghi «volatile cache/log/update-backup state excluded»); sinh lại manifest **7.579 → 7.561** dòng, dòng `.ai/` = **0**, `.memsearch/` = **0** ✅ **②** «0080… `datetime()`» ⇒ **ĐÃ VÁ** (xem dòng trên) ✅ **③** «**Brand fingerprint verifier**» — ⚠️ ĐỎ **vì tôi vừa sửa 2 tệp nguồn** ⇒ **danh tính phát hành đã đổi**, cần làm mới (`node tools/gd-cycle.mjs "<NHÃN>" --no-build` → `npm run build`) | 🟡 **tầng ①② ĐÃ XANH** · tầng ③ **chờ quyết định của anh**: **(A)** làm mới danh tính + build lại ⇒ cổng xanh toàn bộ · **(B)** giữ 2 bản vá công cụ + chấp nhận tầng ③ đỏ tới khi được phép làm mới · **(C)** hoàn tác 2 bản vá công cụ |
| **`canonical.css` 967 > trần 930** | Trần nằm ở **`tools/css-budget.json` `"lines": 930`**; hiện **967 dòng · 45.166 byte**. **CHẠY LẠI `probe-css-budget` (kết quả): `KẾT LUẬN: KHÔNG ĐẠT ❌ — 1 chỉ số vượt trần`** — cụ thể **CHỈ** `app/styles/canonical.css: 967 > 930` (**vượt 37 dòng**), còn **mọi chỉ số khác ĐỀU ĐẠT và CÒN DƯ**: `!important` **3.699/5.014** (dư 1.315) · `.table-wrap` **41/52** (dư 11) · **selector định nghĩa trùng 687/747** (dư **60**) · `font-size < 10px` 14/14 · **tổng dòng CSS 3.781/3.918** (dư 137) | 🟡 **chỉ vượt 1 chỉ số, 37 dòng** ⇒ **(A1)** nâng trần tệp lên **≥ 967** (rủi ro thấp: mọi trần khác còn dư) · **(A2)** tách bớt phần ra tệp khác (⚠️ đổi cấu trúc CSS ⇒ phải chạy lại `verify:css-baseline` + `verify:master-baseline`) · **(B)** giữ + ghi nhận |
| **`.memsearch` khỏi `MANIFEST_SHA256.txt`** | **10 dòng** `.memsearch/memory/*.md` trong manifest (tổng manifest 7.579 dòng) | 🟡 cùng nhóm với mục trên ⇒ nên xử lý **cùng một quyết định**, ⛔ không tách rời |
| **«Ảnh chuẩn 20/09» (`probe-visual-regression`)** | Thư mục `tools/baseline/` = **68 tệp PNG**, **TOÀN BỘ ghi ngày 2026‑09‑21** (⚠️ ghi cũ «20/09» là **ngày yêu cầu R‑01**, ⛔ không phải ngày tệp) · probe so ảnh hiện tại ⇄ ảnh chuẩn, **chống lỗi giả**: lệch **1 lần chưa kết luận**, phải lệch **CẢ HAI lần** chụp mới báo LỆCH (`probe-visual-regression.mjs:592-593`) · **ĐÃ CHẠY LẠI: `KẾT LUẬN: KHÔNG ĐẠT ❌ — 59/68 ảnh lệch`** · ví dụ `19-report-center`: «**KÍCH THƯỚC ẢNH KHÁC**: chuẩn 1920×1080 vs nay **1920×2214**» (màn nay chụp **toàn trang**) | 🔴 **CẦN XỬ LÝ**: với **59/68 lệch**, cổng ⛔ **không còn khả năng phát hiện hồi quy MỚI** ⇒ chọn **(A)** **ghi lại ảnh chuẩn** (⚠️ nên **duyệt từng màn** trước khi ghi để ⛔ không «chụp luôn» cả lỗi thật) · **(B)** giữ baseline cũ + ghi nhận known limitation |
**CHỌN (gộp cho 2 mục manifest):** **(A)** **ÁP LẠI 2 bản vá #31/#32 rồi làm mới danh tính + build lại** ⇒ cổng xanh **cả 3 tầng** — **quy trình 4 bước + đích sửa chính xác ở `docs/dsh/MT2-PATCH-31-32.md`** (⚠️ mã FP `VNTECH-FP-7A4835FBC5BCBCA7` sẽ **BỊ THAY** + phải cập nhật hồ sơ + bundle mới có tên khác) · **(B)** **GIỮ NGUYÊN trạng thái hiện tại** (2 lỗi công cụ đã ghi nhận, ⛔ chưa vá; đã hoàn tác để repo nhất quán) · **(C)** áp lại nhưng ⛔ **không** làm mới danh tính (⚠️ tầng ③ sẽ đỏ — ⛔ tôi không khuyến nghị).
> ℹ️ **TÌNH TRẠNG HIỆN TẠI ĐÃ ĐƯỢC KIỂM LẠI:** sau hoàn tác — `git status` 3 tệp **sạch** · `verify:fingerprint` **ĐẠT** · `test:release-static` vẫn đỏ ở **tầng ①** (như trước khi tôi vá).

#### ⑤.5.2 — ⚠️ GIỚI HẠN CỦA TÔI VỀ VIỆC «DUYỆT ẢNH» (nói thẳng, ⛔ không giả vờ)
* ⛔ **Tôi KHÔNG đọc được ảnh** (model hiện tại **không có đầu vào ảnh**) và **đã thử gọi agent có khả năng đọc ảnh 2 lần — cả 2 lần lỗi** ⇒ **⛔ tôi KHÔNG thể tự duyệt 59 ảnh lệch**, và ⛔ **không được phép** kết luận «tất cả là thay đổi chủ đích».
* ✅ **Đã tạo sẵn ẢNH ĐỂ ANH SOI** (chụp mới trong phiên, vùng nặng nhất của màn nặng nhất):
  * `tools/_diff/crop-1.png` và `tools/_diff/crop-2.png` — **86,8 KB mỗi tệp**, vùng **x 0..384 · y 128..448** của màn **«Quản trị — modal tạo tổ đội dự án»** ở **tablet** (vùng bị báo lệch **11,09%**), **phóng to 3×**.
  * Probe còn hỗ trợ soi nhanh: `node tools/probe-visual-regression.mjs --only=<màn> --crop=x,y,w,h` ⇒ **sinh lại vùng bất kỳ** để anh xem.
* ⇒ **Quyết định (A)/(B) cho ảnh chuẩn nên do ANH** (hoặc một phiên có model đọc ảnh) — ⛔ tôi không tự chốt thay.

### ⑤.6 — 🔎 ĐO LẠI MỤC «SNAPSHOT» ⇒ **TÌM RA 1 KHE HỞ NHẬT KÝ THẬT** (auditability — mức **TRUNG BÌNH**)
**ĐO TRÊN `audit_logs` (1.579 dòng):**
| Câu đo | Kết quả |
|---|---|
| thiếu **CẢ HAI** snapshot | **0** |
| thiếu `after_json` | **0** (⇒ mọi dòng đều có trạng thái SAU) |
| thiếu `before_json` | **1.486** |
| trong đó là hành động **SỬA/XOÁ** (nơi **phải** có trạng thái TRƯỚC) | `update_user` **279** · `delete_department_permission` 22 · `update_returned_request` 16 · `delete_request` 16 · `delete_approval_stage` 14 · `update_boq_contract_prices` 12 · `delete_supplier`/`delete_system_level`/`delete_material_norm`/`delete_partner` 8–9 mỗi loại |
| 93 dòng **CÓ** `before_json` thuộc về ai | **toàn bộ là tên hành động KIỂU CŨ (CHỮ HOA)**: `EDIT_RETURNED` 16 · `DELETE_RETURNED` 16 · `CANCEL` 16 · `RESUBMIT` 16 · `UPDATE` 15 · `APPROVE_PARTIAL` 14 |
| `update_user` — bao nhiêu dòng có `before_json` | **0 / 279** |
| Đường ghi của Java có cột đó không | **CÓ**: `AuditLogAdapter.java:58` liệt kê `before_json, after_json, …` trong `INSERT` ⇒ **khả năng có, nhưng nhánh Java ⛔ không truyền giá trị** |
⇒ **KẾT LUẬN ĐO ĐƯỢC:** mọi dòng audit đều có `after_json`, nhưng **nhánh Java KHÔNG ghi trạng thái TRƯỚC** cho các hành động **sửa/xoá** (chỉ nhánh CŨ kiểu chữ HOA mới ghi) ⇒ với `update_user` (279 dòng), `delete_request`, `delete_supplier`… **không thể dựng lại «đã đổi từ gì»** từ nhật ký.
⚠️ **⛔ Đây KHÔNG phải «7/259» như ghi cũ** — con số cũ **thấp hơn thực tế**; bản này là **đo lại đầy đủ**.
**CHỌN:** **(A)** mở task riêng **`MT2-P14-07`** bổ sung `before_json` cho nhánh Java ở các action sửa/xoá (+ test hợp đồng + chạy lại `probe-audit-coverage`) · **(B)** chỉ **ghi nhận** là known limitation trong `P14-05` · **(C)** chỉ áp cho nhóm **`delete_*`** (rủi ro mất dữ liệu cao nhất) rồi mở rộng sau.

#### ⑤.6.1 — 🔎 TRUY TẬN GỐC ⑤.6 (đã tìm ra ĐÚNG chỗ thiếu) + **CHI PHÍ THẬT**
* **Chỗ ghi thiếu:** `java-backend/web/src/main/java/com/vntech/erp/web/security/**AuditTrailFilter.java:77**` — một **SERVLET FILTER** ghi nhật ký **cho MỌI action** đổi dữ liệu: `auditLogPort.logDetailed(buildEntry(action, payload, request))`.
* **Đọc `buildEntry()` (L83+):** hàm **set đủ** `action · ipAddress · userId/userName/userRole/department/systemLevel · moduleKey · permissionUsed · entityType · entityId · after_json (= payload người dùng gửi)` — **⛔ KHÔNG hề set `beforeJson`**. ⇒ Đây **chính là** nguồn của 1.486 dòng thiếu `before_json` (mọi `update_user`, `delete_supplier`, `save_*`…).
* **Cổng `AuditLogPort` KHÔNG thiếu khả năng:** chữ ký có sẵn `log(userId, action, entityType, entityId, **beforeJson**, afterJson, ipAddress)`; **13 lời gọi** trong mã đã **có** nơi truyền `beforeJson` thật (vd `RequestManagementUseCase:504/556/584/612/730` + `MaterialCatalogManagementUseCase:162` truyền `MiniJson.stringify(mr/existing)`) — **khớp đúng 93 dòng CÓ before_json** trong CSDL (`EDIT_RETURNED`/`DELETE_RETURNED`/`CANCEL`/`RESUBMIT`/`UPDATE`/`APPROVE_PARTIAL`) ✅ ⇒ **cơ chế đã đúng ở luồng Phiếu đề nghị**.
* ⚠️ **CHI PHÍ THẬT của việc vá ở tầng FILTER (nói thẳng để ⛔ không hứa hão):** muốn filter biết trạng thái **TRƯỚC**, nó phải **đọc dữ liệu TRƯỚC khi request chạy** ⇒ cần **ánh xạ action → bảng/khoá** (hàng trăm action), **thêm truy vấn cho mọi request đổi dữ liệu** (ảnh hưởng hiệu năng), và xử lý đúng thứ tự. ⇒ ⛔ **KHÔNG phải vá nhanh 1 dòng**; ⛔ **tôi không tự làm** vì đổi **semantics nhật ký** + rủi ro hiệu năng (MT2 §14/§19/§40).
* **ĐỀ XUẤT CỦA TÔI (dựa trên số đo):** **(B)** ghi nhận là **known limitation** trong `P14-05` **trước**, và nếu muốn làm thì chọn **(C)** mở phạm vi **hẹp**: chỉ bổ sung `beforeJson` cho **`delete_*`** (rủi ro mất dữ liệu cao nhất) theo **cách của luồng Phiếu đề nghị** (truyền `beforeJson` ở **use case**, ⛔ **không** đụng filter) — **tránh** đổi tầng filter.

#### 📖 ĐỐI CHIẾU NGUỒN SỰ THẬT (đã tra `MASTER_TASK_2.md`) — ⚠️ **MT2 ⛔ KHÔNG yêu cầu `before_json`/`after_json`**
| Từ khoá tra trên `MASTER_TASK_2.md` | Kết quả |
|---|---|
| `nhật ký` · `Audit log` · `trước/sau` · `after` | ⛔ **KHÔNG có mục nào** |
| `audit` | chỉ xuất hiện với nghĩa **ĐỘNG TỪ «hãy rà soát»**: §1 (`:15`) «audit hệ thống» · §6.x (`:162`) «Phải **audit** enum/state hiện tại» · §11 (`:242`) «phải **audit** API · response · mapping …» — ⛔ **không** phải yêu cầu về tính năng NHẬT KÝ có ảnh chụp trạng thái trước/sau |
⇒ **Ảnh hưởng:** việc 1.486 dòng thiếu `before_json` là **lệch CHẤT LƯỢNG nhật ký**, ⛔ **không phải yêu cầu MT2 bị thiếu**.
⇒ **KHUYẾN NGHỊ CỦA TÔI (theo nguồn sự thật):** **(B) ghi nhận** trong `P14-05` — đúng phạm vi; nếu sau này cần thì **(C)** mở **hẹp** cho `delete_*` ở **tầng use case** (⛔ ⛔ **không** đụng `AuditTrailFilter`), ⛔ **không** chọn (A) rộng vì chi phí/ảnh hưởng hiệu năng đã đo.

---

### ⑤.7 — 🔴 **MÀN «THÀNH VIÊN TỔ ĐỘI» LÀ CHỈ ĐỌC** — ⛔ KHÔNG có action nào ghi `team_members` (PHÁT HIỆN MỚI, đo bằng công cụ)
**BẰNG CHỨNG ĐO ĐƯỢC** (`node tools/audit-team-members.mjs` ⇒ `EXIT=0`, nguyên văn):
```text
KẾT LUẬN cách nạp dữ liệu: CONFIRMED
• Không có bất kỳ action nào (JS lẫn Java) ghi `team_members` ⇒ dữ liệu KHÔNG thể sinh ra từ luồng sản phẩm.
• 100% dòng hiện có đến từ SQL ngoài sản phẩm: seed `tools/task080-seed-real-data.sql` + fixture probe.
• Hệ quả: màn «Thành viên tổ đội» mở ra ở trạng thái CHỈ ĐỌC; muốn thêm/sửa thành viên phải có action mới.
```
⇒ **Đây là KHOẢNG TRỐNG CHỨC NĂNG** (⛔ không phải «lỗi đang đỏ»): UI mở được, dữ liệu hiển thị được, nhưng **⛔ không có đường ghi** ⇒ người dùng ⛔ không thể thêm/sửa thành viên tổ đội.

#### ✅ ĐÍNH CHÍNH NGAY SAU ĐÓ — **⑤.7 ĐÃ ĐÓNG: ⛔ KHÔNG PHẢI KHOẢNG TRỐNG** (đọc lại NGUỒN SỰ THẬT, MT2 §1)
**Tôi đã tra thẳng `docs/dsh/MASTER_TASK_2.md` (nguồn sự thật) — yêu cầu là HIỂN THỊ, ⛔ KHÔNG có yêu cầu ghi:**
* **§8 TỔ ĐỘI (`MASTER_TASK_2.md:210-211`), nguyên văn:** «Chỉ hiển thị **danh sách tổ đội** + **Filter theo dự án**. ⛔ **Không tự thêm nghiệp vụ ngoài phạm vi**.»
* **§5.2 Project tabs (`:100`), nguyên văn:** «Các tab **Tổng quan · Nhân sự · Tổ đội · Kho · Ban chỉ huy** … Mỗi tab: ① hiển thị **danh sách dữ liệu tương ứng** ② có thông tin thực tế ③ click item ④ **mở modal detail tương ứng**.» ⇒ ⛔ **không** có ⑤ «thêm/sửa».
**VÀ tính năng HIỂN THỊ đã có thật trong mã:** `app/screens/TeamDirectory.tsx` (đọc `teamMembers[]`) · `app/screens/ProjectDetailTabs.tsx:152,259` (tab «Nhân sự»/«Tổ đội») · `app/screens/ProjectEntityModal.tsx:149` (modal chi tiết có danh sách thành viên) — chính mã ghi rõ `TeamDirectory.tsx:13`: «Khoá `teamMembers` là **Java-only**: `scripts/system-route.mjs` ⛔ KHÔNG có `team_members`/`teamMembers`» ⇒ **chỉ-đọc là CHỦ Ý**.
⇒ **KẾT LUẬN: màn «Thành viên tổ đội» chỉ đọc là ĐÚNG YÊU CẦU MT2 §8/§5.2**; ⛔ nếu tôi tự thêm action ghi thì **vi phạm** chính câu «⛔ Không tự thêm nghiệp vụ ngoài phạm vi» (và MT2 §14). ⇒ **⛔ KHÔNG cần quyết định gì cho mục này — ĐÓNG.**
**ℹ️ 3 công cụ kiểm tra khác chạy cùng lượt — ĐỀU XANH (0 lỗi sản phẩm):** `audit-java-only-actions` («12 action Java-only · 6 module rỗng · **rủi ro 0**» ⇒ **gỡ lo ngại BLK-03**) · `check-approval-dept-mapping` («**127/127** bước đã quyết tra được phòng ban khác rỗng») · `verify-seed-v3` («✅ MENU DỰNG ĐƯỢC TỪ DỮ LIỆU»).

---

### ⑤.5.1b — 📷 CẬP NHẬT SỐ ĐO ẢNH CHUẨN (26/09) ⇒ củng cố lựa chọn (A)/(B) ở §⑤.5.1
**Đo lại `probe-visual-regression` (ngưỡng cho phép **8 điểm ảnh**):** `17 màn × 4 kích thước = 68 ảnh` · `EXIT=1` · **59/68 ca đỏ**.
**Số đo cụ thể:** `01-dashboard` desktop **149.129 px (7,19%)** · laptop **53.710 px (5,12%)** · tablet **9.453 px (1,20%)** · phone **4.564 px (1,39%)**; màn kế tiếp desktop **39.306 px (1,90%)** · laptop **29.707 px (2,83%)** · **tablet 0 px ✅** · **phone 0 px ✅**; một màn khác **466.812 px (22,51%)**.
**2 KẾT LUẬN ĐO ĐƯỢC:** ① sai lệch **vượt ngưỡng 8 px hàng nghìn lần** mà tablet/phone của màn thứ 2 **= 0 px** ⇒ probe ⛔ **không báo lệch bừa** — đây là **khác biệt THẬT về bố cục/nội dung** giữa **ảnh chuẩn 21/09** và **bản dựng 26/09**; ② probe ghi «**đã chụp lại (lần đầu <đúng số cũ>)**» ⇒ **ỔN ĐỊNH**, ⛔ không phải loé/hoạt ảnh.
**⇒ KHUYẾN NGHỊ:** **(A)** ghi lại ảnh chuẩn **SAU KHI anh soi 2–3 ảnh chênh nặng** (crops sẵn: `tools/_diff/crop-1.png` · `tools/_diff/crop-2.png`; sinh thêm: `node tools/probe-visual-regression.mjs --only=<màn> --crop=x,y,w,h`) · **(B)** giữ nguyên + ghi **known limitation**. ⚠️ **Tôi ⛔ KHÔNG đọc được ảnh** (model không có đầu vào ảnh; gọi vision 2 lần đều lỗi) ⇒ **việc duyệt MẮT ⛔ không thể thay bằng máy** — ⛔ tôi ⛔ **không** tự ghi lại ảnh chuẩn vì như vậy là **đóng dấu luôn mọi sai lệch chưa được người duyệt**.